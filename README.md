# Sanoy AI Workflow

[![npm](https://img.shields.io/npm/v/sanoy-ai-workflow)](https://www.npmjs.com/package/sanoy-ai-workflow)
[![CI](https://github.com/sanoylab/sanoy-ai-workflow/actions/workflows/ci.yml/badge.svg)](https://github.com/sanoylab/sanoy-ai-workflow/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Website: [sanoylab.github.io/sanoy-ai-workflow](https://sanoylab.github.io/sanoy-ai-workflow/)

**Sanoy: an agentic AI development workflow for Claude Code that keeps you in control and teaches you the code it writes.**

Sanoy is Yonas spelled backwards: the workflow was extracted from a real production project and generalized so anyone can use it.

Vibe coding is fast until you have to change something you do not understand. This kit gives Claude Code a repeatable loop with review gates, one living document per feature, a build gate that runs before the agent stops, a fresh-eyes reviewer, and a learning system so the codebase never becomes a black box.

```bash
npx sanoy-ai-workflow init        # in any project, new or existing
```

Then open the project in Claude Code and run **`/onboard`**. That is the whole setup.

## What you get

```
NEW FEATURE    /feature <idea>  ->  /build <slug>  ->  /learn <slug>  ->  /ship
                 short interview,    tests first,      walkthrough,      verify, one confirmation,
                 plan you approve    reviewer, docs    quiz              commit, push, PR

FIX OR CHANGE  /change <feature, #123, or "the export button is broken"> <what to change>  ->  /ship
                 finds the feature, reproduces bugs first, sizes the work (S runs, M asks, L becomes a /feature)

ANY TIME       /status    where am I, what is open, what next
               /learn     explain any feature, file, or concept; quiz mode
               /onboard   (re)teach the AI the project
```

- **One home per feature.** `_features/<slug>/feature.md` holds what the feature does now, its code map, design decisions, a walkthrough, and every change (`C-001`, `C-002`, ...). `_features/INDEX.md` lets Claude resolve "the map explorer", `#1342`, or a slug to the right doc.
- **Onboarding that reads before it asks.** `/onboard` explores an existing codebase with parallel subagents, proposes the build and test commands, fills `CLAUDE.md`, writes a map and glossary, and adopts your existing features. For a blank project it interviews you briefly and writes a project plan and a roadmap.
- **A build gate that cannot be skipped.** A Stop hook fingerprints your source changes and rebuilds before Claude ends its turn; on errors it blocks and feeds them back. Runs on Node, so it behaves the same on Windows, macOS, and Linux.
- **Review gates where they matter.** You approve the plan before code, and the result before the PR. In between, the agent runs autonomously with an explicit stop-and-ask list (unplanned migrations, shared infrastructure, security behavior, scope creep).
- **Fresh-eyes review.** A read-only `reviewer` subagent checks correctness, architecture rules, data access, security, tests, and scope before anything ships.
- **Learn while you ship.** Three learning modes (`auto`, `pair`, `coach`), a per-feature walkthrough, `/learn ... quiz`, and a handbook (`docs/handbook/`) written for a developer working without AI.
- **Git remembers.** Every commit carries `Feature: <slug>` and, when known, a work item link.
- **Works with other agents too.** State lives in markdown; `AGENTS.md` points Codex, OpenCode, or Copilot at the same files.

## Install

```bash
# new or existing project, any stack
npx sanoy-ai-workflow init

# with a stack pack (adds stack-specific skills, rules, and permissions)
npx sanoy-ai-workflow init --stack dotnet      # also: node, python
npx sanoy-ai-workflow stacks                   # list packs

# later
npx sanoy-ai-workflow doctor                   # check the setup
npx sanoy-ai-workflow update                   # refresh skills, reviewer, hook; keeps your config
```

Requirements: Node 18+, git, Claude Code 2.1 or newer. `gh` for GitHub PRs and issues. Existing files are never overwritten (use `--force`).

## The files

```
CLAUDE.md                      short project rules (placeholders filled by /onboard); area detail in .claude/rules/
AGENTS.md                      pointer for other coding agents
.claude/workflow.conf          the project profile: build, test, branch, PR mode, work items
.claude/settings.json          safe allow list, deny rules for destructive git and secrets, the Stop hook
.claude/hooks/verify-build.js  the build gate
.claude/skills/                onboard, feature, build, change, learn, ship, status
.claude/agents/reviewer.md     read-only reviewer
.claude/rules/                 path-scoped rules (loaded only when matching files are touched)
_features/                     one folder per feature + INDEX.md
docs/handbook/                 map, request lifecycle, recipes, glossary, per-area pages
docs/decisions/                ADRs (only for hard-to-reverse, non-obvious trade-offs)
docs/project-plan.md           for new projects
scripts/                       Azure DevOps work item scripts (optional)
```

Every project-specific value lives in `.claude/workflow.conf`; the skills read it at invocation, the hook reads it at stop time.

## How a feature flows

1. `/feature add CSV export to the incidents list`: Claude checks it is not an existing feature, branches, explores the most similar feature, asks at most two short rounds of questions (only what the code cannot answer and a wrong guess would be expensive), writes a lean plan with "decisions I made for you", and stops.
2. `/clear`, then `/build incidents-csv-export`: tests first from the acceptance criteria, then layer by layer with checkpoint commits, build and tests until green, reviewer pass, code map and walkthrough written.
3. `/learn incidents-csv-export quiz` if you want to own it.
4. `/ship`: build, tests, secrets check, one confirmation, commit with trailers, push, PR (via `gh`, `glab`, or a ready-to-paste link for Azure DevOps and others).

A bug report: `/change "the CSV export drops the last row"`: Claude resolves the feature, writes a failing test, finds the root cause, fixes it, updates the feature doc with a change entry and a two-line lesson, and hands you the diff reading order.

## Philosophy

- Ask less, decide more, and write the decisions down where the developer can overrule them by reading.
- The truth about a feature lives next to the feature, not in a chat transcript.
- Verification is a hook, not a promise.
- The goal is a developer who could keep working if the AI disappeared tomorrow.

## Roadmap and ideas

See [CHANGELOG.md](CHANGELOG.md) and the issues. Contributions welcome: [CONTRIBUTING.md](CONTRIBUTING.md). MIT licensed.
