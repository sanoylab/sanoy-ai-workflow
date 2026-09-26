'use strict';
// Core of the sanoy-ai-workflow CLI: install the template into a project, apply stack
// packs, merge git-ignore lines and settings, update kit-owned files, run checks.
// Pure Node (>=18), no dependencies, works on Windows, macOS, and Linux.

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const KIT_ROOT = path.resolve(__dirname, '..');
const TEMPLATE_DIR = path.join(KIT_ROOT, 'template');
const STACKS_DIR = path.join(KIT_ROOT, 'stacks');
const MANIFEST = path.join('.claude', 'workflow-kit.json');
const IGNORE_FILE = '.gitignore.workflow';
const SETTINGS_MERGE = 'settings.merge.json';
const VERSION = require(path.join(KIT_ROOT, 'package.json')).version;

// Files the kit owns and `update` may overwrite. Everything else is the project's.
const KIT_OWNED = [
  /^\.claude[\\/]skills[\\/][^\\/]+[\\/]SKILL\.md$/,
  /^\.claude[\\/]agents[\\/]reviewer\.md$/,
  /^\.claude[\\/]hooks[\\/]verify-build\.js$/,
  /^\.claude[\\/]rules[\\/]README\.md$/,
  /^_features[\\/]_template\.md$/,
  /^docs[\\/]decisions[\\/]README\.md$/,
  /^scripts[\\/]azdo-.*\.ps1$/,
  /^scripts[\\/]README\.md$/,
];

function walk(dir, base = dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, base, out);
    else out.push(path.relative(base, full));
  }
  return out;
}

function listStacks() {
  if (!fs.existsSync(STACKS_DIR)) return [];
  return fs.readdirSync(STACKS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => {
      const readme = path.join(STACKS_DIR, d.name, 'README.md');
      const first = fs.existsSync(readme)
        ? fs.readFileSync(readme, 'utf8').split(/\r?\n/).find((l) => l.trim() && !l.startsWith('#')) || ''
        : '';
      return { name: d.name, summary: first.trim() };
    });
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function unionInto(target, source) {
  for (const key of Object.keys(source || {})) {
    const src = source[key];
    if (Array.isArray(src)) {
      target[key] = target[key] || [];
      for (const v of src) if (!target[key].includes(v)) target[key].push(v);
    } else if (src && typeof src === 'object') {
      target[key] = target[key] || {};
      unionInto(target[key], src);
    } else {
      target[key] = src;
    }
  }
  return target;
}

function mergeSettings(targetDir, mergeFile, log) {
  const dest = path.join(targetDir, '.claude', 'settings.json');
  if (!fs.existsSync(dest)) return;
  const settings = readJson(dest);
  unionInto(settings, readJson(mergeFile));
  fs.writeFileSync(dest, JSON.stringify(settings, null, 2) + '\n');
  log(`merged ${path.relative(KIT_ROOT, mergeFile)} into .claude/settings.json`);
}

function copyTree(fromDir, targetDir, { force, onlyKitOwned, log }) {
  const copied = [];
  const skipped = [];
  for (const rel of walk(fromDir)) {
    const base = path.basename(rel);
    if (base === IGNORE_FILE || base === SETTINGS_MERGE) continue;
    if (onlyKitOwned && !KIT_OWNED.some((re) => re.test(rel))) continue;
    const src = path.join(fromDir, rel);
    const dest = path.join(targetDir, rel);
    if (fs.existsSync(dest) && !force) { skipped.push(rel); continue; }
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
    copied.push(rel);
  }
  const merge = path.join(fromDir, SETTINGS_MERGE);
  if (fs.existsSync(merge)) mergeSettings(targetDir, merge, log);
  return { copied, skipped };
}

function appendIgnoreLines(targetDir, log) {
  const src = path.join(TEMPLATE_DIR, IGNORE_FILE);
  const dest = path.join(targetDir, '.gitignore');
  const wanted = fs.readFileSync(src, 'utf8').split(/\r?\n/).filter((l) => l.trim() && !l.startsWith('#'));
  const existing = fs.existsSync(dest) ? fs.readFileSync(dest, 'utf8').split(/\r?\n/) : [];
  const missing = wanted.filter((l) => !existing.includes(l));
  if (missing.length === 0) return 0;
  const prefix = existing.length && existing[existing.length - 1] !== '' ? '\n' : '';
  fs.appendFileSync(dest, `${prefix}\n# Claude Code workflow: local-only files\n${missing.join('\n')}\n`);
  log(`appended ${missing.length} line(s) to .gitignore`);
  return missing.length;
}

function writeManifest(targetDir, stacks) {
  const file = path.join(targetDir, MANIFEST);
  const existing = fs.existsSync(file) ? readJson(file) : {};
  const merged = {
    version: VERSION,
    installedAt: new Date().toISOString(),
    stacks: Array.from(new Set([...(existing.stacks || []), ...stacks])),
  };
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(merged, null, 2) + '\n');
  return merged;
}

function readManifest(targetDir) {
  const file = path.join(targetDir, MANIFEST);
  return fs.existsSync(file) ? readJson(file) : null;
}

function install(targetDir, { stacks = [], force = false, log = () => {} } = {}) {
  targetDir = path.resolve(targetDir);
  if (!fs.existsSync(targetDir)) throw new Error(`Target folder not found: ${targetDir}`);
  for (const s of stacks) {
    if (!fs.existsSync(path.join(STACKS_DIR, s))) throw new Error(`Unknown stack pack: ${s} (available: ${listStacks().map((x) => x.name).join(', ') || 'none'})`);
  }
  const result = copyTree(TEMPLATE_DIR, targetDir, { force, log });
  for (const s of stacks) {
    const r = copyTree(path.join(STACKS_DIR, s), targetDir, { force, log });
    result.copied.push(...r.copied);
    result.skipped.push(...r.skipped);
  }
  result.ignoreLines = appendIgnoreLines(targetDir, log);
  result.manifest = writeManifest(targetDir, stacks);
  return result;
}

function update(targetDir, { log = () => {} } = {}) {
  targetDir = path.resolve(targetDir);
  const manifest = readManifest(targetDir);
  if (!manifest) throw new Error('No .claude/workflow-kit.json found. Run `init` first.');
  const result = copyTree(TEMPLATE_DIR, targetDir, { force: true, onlyKitOwned: true, log });
  for (const s of manifest.stacks || []) {
    const dir = path.join(STACKS_DIR, s);
    if (!fs.existsSync(dir)) { log(`stack pack ${s} no longer exists in this version, skipped`); continue; }
    const r = copyTree(dir, targetDir, { force: true, onlyKitOwned: true, log });
    result.copied.push(...r.copied);
  }
  result.manifest = writeManifest(targetDir, manifest.stacks || []);
  return result;
}

function parseConf(text) {
  const conf = {};
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (!m) continue;
    let value = m[2].trim();
    const hash = value.search(/\s+#/);
    if (hash >= 0 && !/^["']/.test(value)) value = value.slice(0, hash).trim();
    if (value.startsWith('"') && value.lastIndexOf('"') > 0) {
      value = value.slice(1, value.lastIndexOf('"')).replace(/\\(["\\])/g, '$1');
    } else if (value.startsWith("'") && value.lastIndexOf("'") > 0) {
      value = value.slice(1, value.lastIndexOf("'"));
    }
    conf[m[1]] = value;
  }
  return conf;
}

function readConf(targetDir) {
  const file = path.join(targetDir, '.claude', 'workflow.conf');
  return fs.existsSync(file) ? parseConf(fs.readFileSync(file, 'utf8')) : null;
}

function commandExists(cmd) {
  try {
    execSync(`${process.platform === 'win32' ? 'where' : 'command -v'} ${cmd}`, { stdio: 'ignore' });
    return true;
  } catch { return false; }
}

function doctor(targetDir) {
  targetDir = path.resolve(targetDir);
  const checks = [];
  const ok = (name, detail) => checks.push({ status: 'ok', name, detail });
  const warn = (name, detail) => checks.push({ status: 'warn', name, detail });
  const fail = (name, detail) => checks.push({ status: 'fail', name, detail });

  const has = (rel) => fs.existsSync(path.join(targetDir, rel));
  has('.git') ? ok('git repository', targetDir) : warn('git repository', 'not a git repo; /feature and /ship need one (git init)');
  const manifest = readManifest(targetDir);
  manifest ? ok('kit installed', `version ${manifest.version}${manifest.stacks.length ? ', stacks: ' + manifest.stacks.join(', ') : ''}`) : fail('kit installed', 'no .claude/workflow-kit.json; run `npx sanoy-ai-workflow init`');
  for (const rel of ['CLAUDE.md', '.claude/settings.json', '.claude/workflow.conf', '.claude/hooks/verify-build.js', '.claude/skills/feature/SKILL.md', '.claude/skills/onboard/SKILL.md', '.claude/agents/reviewer.md', '_features/INDEX.md', 'docs/handbook/README.md']) {
    has(rel) ? ok(rel, 'present') : fail(rel, 'missing; run `init` again (existing files are kept)');
  }
  if (has('.claude/settings.json')) {
    try {
      const s = readJson(path.join(targetDir, '.claude', 'settings.json'));
      const hook = JSON.stringify(s.hooks || {}).includes('verify-build.js');
      hook ? ok('Stop hook registered', 'settings.json hooks.Stop') : warn('Stop hook registered', 'settings.json has no verify-build.js Stop hook');
    } catch (e) { fail('settings.json valid JSON', e.message); }
  }
  const conf = readConf(targetDir);
  if (conf) {
    conf.BUILD_CMD ? ok('BUILD_CMD', conf.BUILD_CMD) : warn('BUILD_CMD', 'empty: the Stop hook is disabled until you set it (run /onboard)');
    conf.TEST_CMD ? ok('TEST_CMD', conf.TEST_CMD) : warn('TEST_CMD', 'empty: /build and /ship cannot run tests');
    const pr = conf.PR_MODE || 'gh';
    if (pr === 'gh') commandExists('gh') ? ok('PR_MODE gh', 'gh CLI found') : warn('PR_MODE gh', 'gh CLI not found; install it or set PR_MODE to url');
    else if (pr === 'gitlab') commandExists('glab') ? ok('PR_MODE gitlab', 'glab found') : warn('PR_MODE gitlab', 'glab not found; /ship falls back to a link');
    else if ((pr === 'azdo' || pr === 'url') && !conf.REPO_WEB_URL) warn(`PR_MODE ${pr}`, 'REPO_WEB_URL is empty');
    else ok(`PR_MODE ${pr}`, 'configured');
    const wi = conf.WORK_ITEMS || 'none';
    if (wi === 'github') commandExists('gh') ? ok('WORK_ITEMS github', 'gh CLI found') : warn('WORK_ITEMS github', 'gh CLI not found');
    else if (wi === 'azdo') (process.env.AZDO_PAT || has('.claude/azdo.local.json')) ? ok('WORK_ITEMS azdo', 'credentials source present') : warn('WORK_ITEMS azdo', 'no AZDO_PAT env var and no .claude/azdo.local.json');
    else ok('WORK_ITEMS', wi);
  }
  const placeholders = has('CLAUDE.md') && /<[A-Za-z][^<>\n]{3,}>/.test(fs.readFileSync(path.join(targetDir, 'CLAUDE.md'), 'utf8'));
  placeholders ? warn('CLAUDE.md', 'still has <placeholders>; run /onboard in Claude Code') : ok('CLAUDE.md', 'no placeholders left');
  commandExists('claude') ? ok('Claude Code CLI', 'found on PATH') : warn('Claude Code CLI', 'not found on PATH (fine if you use the desktop app or IDE extension)');
  return checks;
}

module.exports = { install, update, doctor, listStacks, parseConf, readConf, readManifest, VERSION, TEMPLATE_DIR, STACKS_DIR, KIT_ROOT };
