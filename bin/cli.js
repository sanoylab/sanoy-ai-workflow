#!/usr/bin/env node
'use strict';
const path = require('path');
const kit = require('../lib/kit');

const HELP = `sanoy-ai-workflow ${kit.VERSION}
Sanoy: an agentic AI development workflow for Claude Code. Short alias: sanoy.

Usage:
  npx sanoy-ai-workflow init [dir] [--stack <name>]... [--force]   install the workflow into a project
  npx sanoy-ai-workflow update [dir]                                refresh kit-owned files (skills, agent, hook), keep your config
  npx sanoy-ai-workflow doctor [dir]                                check the installation and configuration
  npx sanoy-ai-workflow stacks                                      list available stack packs
  npx sanoy-ai-workflow --help | --version

After init, open the project in Claude Code and run /onboard.
`;

function parse(argv) {
  const args = { _: [], stacks: [], force: false, help: false, version: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--stack' || a === '-s') args.stacks.push(argv[++i]);
    else if (a.startsWith('--stack=')) args.stacks.push(a.slice(8));
    else if (a === '--force' || a === '-f') args.force = true;
    else if (a === '--help' || a === '-h') args.help = true;
    else if (a === '--version' || a === '-v') args.version = true;
    else if (a.startsWith('-')) throw new Error(`Unknown option: ${a}`);
    else args._.push(a);
  }
  return args;
}

function main() {
  let args;
  try { args = parse(process.argv.slice(2)); } catch (e) { console.error(e.message); console.error(HELP); process.exit(2); }
  if (args.version) { console.log(kit.VERSION); return; }
  const cmd = args._[0];
  if (args.help || !cmd) { console.log(HELP); return; }
  const dir = path.resolve(args._[1] || '.');
  const log = (m) => console.log(`  ${m}`);

  try {
    if (cmd === 'init') {
      const r = kit.install(dir, { stacks: args.stacks, force: args.force, log });
      console.log(`\nInstalled ${r.copied.length} file(s) into ${dir}`);
      if (r.skipped.length) {
        console.log(`Kept ${r.skipped.length} existing file(s) (use --force to overwrite):`);
        r.skipped.forEach((f) => console.log(`  ${f}`));
      }
      console.log(`\nNext steps:
  1. Open the project in Claude Code and run /onboard.
     It learns your codebase (or your idea, for a blank project), fills .claude/workflow.conf and CLAUDE.md,
     writes the handbook map, and adopts existing features.
  2. Run \`npx sanoy-ai-workflow doctor\` any time to check the setup.
  3. Then: /feature <idea> for something new, /change <feature> <request> for existing code, /status to see where you are.`);
    } else if (cmd === 'update') {
      const r = kit.update(dir, { log });
      console.log(`\nUpdated ${r.copied.length} kit-owned file(s) to ${kit.VERSION}. Your CLAUDE.md, workflow.conf, settings, rules, features, and docs were not touched.`);
    } else if (cmd === 'doctor') {
      const checks = kit.doctor(dir);
      const icon = { ok: 'OK  ', warn: 'WARN', fail: 'FAIL' };
      for (const c of checks) console.log(`${icon[c.status]}  ${c.name}: ${c.detail}`);
      const fails = checks.filter((c) => c.status === 'fail').length;
      const warns = checks.filter((c) => c.status === 'warn').length;
      console.log(`\n${fails} failure(s), ${warns} warning(s)`);
      process.exit(fails ? 1 : 0);
    } else if (cmd === 'stacks') {
      const stacks = kit.listStacks();
      if (!stacks.length) console.log('No stack packs found.');
      for (const s of stacks) console.log(`${s.name.padEnd(10)} ${s.summary}`);
    } else {
      console.error(`Unknown command: ${cmd}\n`);
      console.error(HELP);
      process.exit(2);
    }
  } catch (e) {
    console.error(`Error: ${e.message}`);
    process.exit(1);
  }
}

main();
