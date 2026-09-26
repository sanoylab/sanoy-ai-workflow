#!/usr/bin/env node
'use strict';
// Stop hook: when source files changed since the last green build, make sure the
// project still builds before Claude finishes its turn. Cross-platform (Node >= 18).
// Reads BUILD_CMD, BUILD_EXTRA_ARGS, and SOURCE_GLOBS from .claude/workflow.conf.
// An empty BUILD_CMD disables the hook. Exit 2 blocks Claude and feeds stderr back to it.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync, spawnSync } = require('child_process');

function readStdin() {
  try { return fs.readFileSync(0, 'utf8'); } catch { return ''; }
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

function git(args, cwd) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
}

function main() {
  const input = readStdin();
  // Don't loop: if Claude is already continuing because of this hook, let it stop.
  if (/"stop_hook_active"\s*:\s*true/.test(input)) return 0;

  const root = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
  const confFile = path.join(root, '.claude', 'workflow.conf');
  if (!fs.existsSync(confFile)) return 0;
  const conf = parseConf(fs.readFileSync(confFile, 'utf8'));
  if (!conf.BUILD_CMD) return 0;

  const globs = (conf.SOURCE_GLOBS || '*').split(/\s+/).filter(Boolean);
  const pathspecs = ['--', ...globs];
  let status;
  try { status = git(['status', '--porcelain', ...pathspecs], root); } catch { return 0; }
  if (!status.trim()) return 0; // nothing relevant changed

  // Fingerprint of the current source changes (tracked diffs + untracked files).
  const hash = crypto.createHash('sha1');
  try { hash.update(git(['diff', 'HEAD', ...pathspecs], root)); } catch { /* no HEAD yet */ }
  try {
    const untracked = git(['ls-files', '--others', '--exclude-standard', ...pathspecs], root).split(/\r?\n/).filter(Boolean);
    for (const f of untracked) { try { hash.update(f); hash.update(fs.readFileSync(path.join(root, f))); } catch { /* ignore */ } }
  } catch { /* ignore */ }
  const sig = hash.digest('hex');

  const stamp = path.join(root, '.claude', '.last-green-build');
  if (fs.existsSync(stamp) && fs.readFileSync(stamp, 'utf8').trim() === sig) return 0; // already built green

  const expand = (s) => (s || '').replace(/\$\{?CLAUDE_PROJECT_DIR\}?/g, root);
  const cmd = `${expand(conf.BUILD_CMD)} ${expand(conf.BUILD_EXTRA_ARGS)}`.trim();
  const res = spawnSync(cmd, { cwd: root, shell: true, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const out = `${res.stdout || ''}\n${res.stderr || ''}`;
  if (res.status !== 0) {
    const lines = Array.from(new Set(out.split(/\r?\n/).filter((l) => /(error|failed|exception)/i.test(l)))).slice(0, 20);
    process.stderr.write(`Build failed (${cmd}). Fix these before finishing:\n${lines.join('\n') || out.slice(-2000)}\n`);
    return 2;
  }
  fs.writeFileSync(stamp, sig);
  return 0;
}

process.exit(main());
