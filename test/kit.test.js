'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');
const kit = require('../lib/kit');

const CLI = path.join(__dirname, '..', 'bin', 'cli.js');

function tmpRepo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sanoy-'));
  execFileSync('git', ['init', '-q', dir]);
  execFileSync('git', ['-C', dir, 'config', 'user.email', 'test@example.com']);
  execFileSync('git', ['-C', dir, 'config', 'user.name', 'Test']);
  return dir;
}

function runHook(dir, stdin = '{}') {
  return spawnSync(process.execPath, [path.join(dir, '.claude', 'hooks', 'verify-build.js')], {
    input: stdin, encoding: 'utf8', env: { ...process.env, CLAUDE_PROJECT_DIR: dir },
  });
}

function writeConf(dir, lines) {
  fs.writeFileSync(path.join(dir, '.claude', 'workflow.conf'), lines.join('\n') + '\n');
}

// Quote a value for workflow.conf: double quotes, with \" and \\ escapes.
function q(value) {
  return '"' + value.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
}
const NODE = `"${process.execPath}"`;

test('init installs the template, appends gitignore lines, writes a manifest', () => {
  const dir = tmpRepo();
  const r = kit.install(dir, { stacks: [] });
  assert.ok(r.copied.length > 20);
  for (const f of ['CLAUDE.md', 'AGENTS.md', '.claude/settings.json', '.claude/workflow.conf', '.claude/hooks/verify-build.js',
    '.claude/skills/onboard/SKILL.md', '.claude/skills/feature/SKILL.md', '.claude/skills/ship/SKILL.md', '.claude/agents/reviewer.md',
    '_features/INDEX.md', 'docs/handbook/README.md', '.claude/workflow-kit.json']) {
    assert.ok(fs.existsSync(path.join(dir, f)), `${f} missing`);
  }
  const ignore = fs.readFileSync(path.join(dir, '.gitignore'), 'utf8');
  assert.match(ignore, /\.pbi-payload\.json/);
  assert.match(ignore, /\.claude\/\.last-green-build/);
  const manifest = kit.readManifest(dir);
  assert.equal(manifest.version, kit.VERSION);
});

test('init keeps existing files unless forced, and stack packs merge settings', () => {
  const dir = tmpRepo();
  fs.writeFileSync(path.join(dir, 'CLAUDE.md'), '# mine\n');
  const r = kit.install(dir, { stacks: ['dotnet'] });
  assert.ok(r.skipped.includes('CLAUDE.md'));
  assert.equal(fs.readFileSync(path.join(dir, 'CLAUDE.md'), 'utf8'), '# mine\n');
  assert.ok(fs.existsSync(path.join(dir, '.claude', 'skills', 'migrate', 'SKILL.md')));
  const settings = JSON.parse(fs.readFileSync(path.join(dir, '.claude', 'settings.json'), 'utf8'));
  assert.ok(settings.permissions.deny.includes('Edit(**/Migrations/**)'));
  assert.ok(settings.permissions.allow.includes('Bash(dotnet:*)'));
  const forced = kit.install(dir, { stacks: [], force: true });
  assert.ok(forced.copied.includes('CLAUDE.md'));
  assert.deepEqual(kit.readManifest(dir).stacks, ['dotnet']);
});

test('update refreshes kit-owned files only', () => {
  const dir = tmpRepo();
  kit.install(dir, { stacks: [] });
  const conf = path.join(dir, '.claude', 'workflow.conf');
  fs.writeFileSync(conf, 'BUILD_CMD="my build"\n');
  const skill = path.join(dir, '.claude', 'skills', 'feature', 'SKILL.md');
  fs.writeFileSync(skill, 'tampered');
  const r = kit.update(dir);
  assert.ok(r.copied.includes(path.join('.claude', 'skills', 'feature', 'SKILL.md')));
  assert.notEqual(fs.readFileSync(skill, 'utf8'), 'tampered');
  assert.equal(fs.readFileSync(conf, 'utf8'), 'BUILD_CMD="my build"\n');
  assert.ok(!r.copied.includes('CLAUDE.md'));
});

test('unknown stack is rejected', () => {
  const dir = tmpRepo();
  assert.throws(() => kit.install(dir, { stacks: ['nope'] }), /Unknown stack pack/);
});

test('parseConf handles quotes, comments, and empty values', () => {
  const c = kit.parseConf('# c\nA="x y"   # trailing\nB=\'q\'\nC=\nD=bare # note\n');
  assert.deepEqual(c, { A: 'x y', B: 'q', C: '', D: 'bare' });
});

test('hook: disabled with empty BUILD_CMD, blocks on failure, stamps on success, skips on stop_hook_active', () => {
  const dir = tmpRepo();
  kit.install(dir, { stacks: [] });
  fs.writeFileSync(path.join(dir, 'a.cs'), 'x');
  writeConf(dir, ['BUILD_CMD=""', 'SOURCE_GLOBS="*.cs"']);
  assert.equal(runHook(dir).status, 0, 'empty BUILD_CMD should disable');

  const failCmd = `${NODE} -e "console.error('error CS0001: boom'); process.exit(1)"`;
  writeConf(dir, [`BUILD_CMD=${q(failCmd)}`, 'SOURCE_GLOBS="*.cs"']);
  const fail = runHook(dir);
  assert.equal(fail.status, 2, fail.stderr);
  assert.match(fail.stderr, /CS0001: boom/);
  assert.equal(runHook(dir, '{"stop_hook_active": true}').status, 0, 'stop_hook_active must short-circuit');

  const okCmd = `${NODE} -e "process.exit(0)"`;
  writeConf(dir, [`BUILD_CMD=${q(okCmd)}`, 'SOURCE_GLOBS="*.cs"']);
  const ok = runHook(dir);
  assert.equal(ok.status, 0, ok.stderr);
  assert.ok(fs.existsSync(path.join(dir, '.claude', '.last-green-build')));

  writeConf(dir, [`BUILD_CMD=${q(failCmd)}`, 'SOURCE_GLOBS="*.cs"']);
  assert.equal(runHook(dir).status, 0, 'same fingerprint must not rebuild');

  writeConf(dir, [`BUILD_CMD=${q(failCmd)}`, 'SOURCE_GLOBS="*.ts"']);
  assert.equal(runHook(dir).status, 0, 'no matching source change must not build');
});

test('parseConf unescapes quotes and backslashes inside double quotes', () => {
  const c = kit.parseConf('A="dotnet build \\"My App.sln\\""\nB="C:\\\\tools\\\\x.exe"\nC=\'raw \\" kept\'\n');
  assert.equal(c.A, 'dotnet build "My App.sln"');
  assert.equal(c.B, 'C:\\tools\\x.exe');
  assert.equal(c.C, 'raw \\" kept');
});

test('doctor reports missing kit and a clean install', () => {
  const dir = tmpRepo();
  const before = kit.doctor(dir);
  assert.ok(before.some((c) => c.name === 'kit installed' && c.status === 'fail'));
  kit.install(dir, { stacks: [] });
  const after = kit.doctor(dir);
  assert.ok(after.every((c) => c.status !== 'fail'), JSON.stringify(after.filter((c) => c.status === 'fail')));
  assert.ok(after.some((c) => c.name === 'BUILD_CMD' && c.status === 'warn'));
});

test('cli: --version, stacks, init, doctor', () => {
  const dir = tmpRepo();
  assert.equal(execFileSync(process.execPath, [CLI, '--version'], { encoding: 'utf8' }).trim(), kit.VERSION);
  assert.match(execFileSync(process.execPath, [CLI, 'stacks'], { encoding: 'utf8' }), /dotnet/);
  const out = execFileSync(process.execPath, [CLI, 'init', dir], { encoding: 'utf8' });
  assert.match(out, /Installed \d+ file/);
  const doc = spawnSync(process.execPath, [CLI, 'doctor', dir], { encoding: 'utf8' });
  assert.equal(doc.status, 0, doc.stdout);
  assert.match(doc.stdout, /0 failure/);
});
