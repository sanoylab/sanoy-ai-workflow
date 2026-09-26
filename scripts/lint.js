'use strict';
// Repo checks: no em dash characters anywhere, valid JSON, every SKILL.md has frontmatter,
// and the template settings register the Node hook.
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const skip = new Set(['node_modules', '.git']);
const problems = [];

function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skip.has(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) { walk(full); continue; }
    if (!/\.(md|js|json|conf|yml|ps1|txt|html)$|^LICENSE$/.test(e.name)) continue;
    const text = fs.readFileSync(full, 'utf8');
    const rel = path.relative(root, full);
    if (text.includes(String.fromCharCode(0x2014))) problems.push(`${rel}: contains an em dash`);
    if (e.name.endsWith('.json')) { try { JSON.parse(text); } catch (err) { problems.push(`${rel}: invalid JSON (${err.message})`); } }
    if (e.name === 'SKILL.md' && !/^---\r?\n[\s\S]*?\r?\n---/.test(text)) problems.push(`${rel}: missing frontmatter`);
    if (e.name === 'SKILL.md' && !/^name:\s*\S+/m.test(text)) problems.push(`${rel}: frontmatter has no name`);
  }
}
walk(root);

const settings = JSON.parse(fs.readFileSync(path.join(root, 'template', '.claude', 'settings.json'), 'utf8'));
if (!JSON.stringify(settings.hooks || {}).includes('verify-build.js')) problems.push('template/.claude/settings.json: Stop hook does not reference verify-build.js');

if (problems.length) { console.error(problems.join('\n')); process.exit(1); }
console.log('lint ok');
