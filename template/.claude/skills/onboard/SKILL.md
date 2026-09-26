---
name: onboard
description: One-time setup that teaches the AI this project before any feature work. Detects the stack, learns the codebase (or, for a blank project, the idea), fills .claude/workflow.conf and CLAUDE.md, writes the handbook map and glossary, and adopts existing features into _features/. Safe to re-run.
argument-hint: [new|existing] [quick|deep]
disable-model-invocation: true
---

Input: $ARGUMENTS (optional: `new` for a blank project or `existing` for a codebase; `quick` asks fewer questions, `deep` asks more)

## Current profile
```
!`cat .claude/workflow.conf`
```

## Repo snapshot
- Top level: !`ls -a`
- Remote: !`git remote -v 2>/dev/null | head -2`
- Branches: !`git branch -a 2>/dev/null | head -10`
- Recent commits: !`git log --oneline -5 2>/dev/null`

You are onboarding the AI dev workflow to this project. The output is a project the AI understands well enough to plan and build features safely, and a developer who knows what was decided. Keep the developer's attention under 15 minutes. Never use the em dash character in anything you write.

## 0. Which path?
If the input says `new` or `existing`, use it. Otherwise: fewer than about 10 source files and no tests means `new`; anything else means `existing`. Say which path you chose and why.

## Path A: blank or nearly blank project

A1. Interview (one AskUserQuestion round of up to 4 questions, two rounds in `deep`, one question in `quick`): what the product does and for whom; the stack and hosting (recommend one if they are undecided); the first 3 to 6 features in priority order; where the repo is hosted and whether work items are tracked. Everything else you decide and list as "Decisions I made for you".
A2. Write `docs/project-plan.md` (replace the placeholders): problem, users, first features, stack, non-goals, decisions and assumptions.
A3. Fill `.claude/workflow.conf` for the chosen stack (build, test, single-test hint, source globs, default branch, PR mode, work items). If the stack needs scaffolding (a `create-*` command, a solution file), propose the exact command and ask before running it; never scaffold silently.
A4. Fill `CLAUDE.md`: overview, the intended structure, dependency rules, layer order for /build, conventions you are adopting (name the style guide or reference project), commands. Keep it under 150 lines.
A5. Seed `_features/INDEX.md` with one `planned` row per first feature (slug, one line, also-called names). Do not create feature folders yet; `/feature <slug>` does that with a proper plan.
A6. Write `docs/handbook/00-map.md` from the intended structure and seed `docs/handbook/glossary.md` with the domain terms from the interview.

## Path B: existing codebase

B1. Explore first, in parallel, with up to 4 Explore subagents (never ask what the code can answer):
   a. build system, entry points, how tests run and the test framework, CI files, scripts;
   b. source layout: modules or areas, layers, shared code, dependency direction;
   c. configuration and secrets (file names only, never values), external services, databases and migrations;
   d. existing docs, ADRs, conventions, linters, commit style (`git log --format=%s -30`), branch naming, and the remote host (GitHub, Azure DevOps, GitLab, other).
   Read what they found; open the 5 to 10 most central files yourself.
B2. Propose `.claude/workflow.conf` from what you found (BUILD_CMD, TEST_CMD, TEST_ONE_HINT, ARCH_TEST_CMD, SOURCE_GLOBS, DEFAULT_BRANCH, PR_MODE, REPO_WEB_URL, WORK_ITEMS, WORK_ITEM_TITLE_PREFIX, WORK_ITEM_LINK_SYNTAX, MODULE_PREFIXES, DEVELOPER_NAME). Ask one AskUserQuestion round (max 4 questions; `deep` allows two rounds, `quick` one question) only about what you could not infer: usually the developer's name, whether work items are tracked and where, and the PR mode when several are plausible. Write the file. If the build output can be locked by a running app (for example .NET `bin` folders under Visual Studio), set BUILD_EXTRA_ARGS to build into `.claude/.build/` and add that folder to `.gitignore`.
B3. Verify the profile: run BUILD_CMD once and TEST_CMD once (or the single-test hint if the suite is slow) and fix the profile until both work. Run `echo {} | node .claude/hooks/verify-build.js; echo exit=$?` on a clean tree and confirm it exits 0 without building.
B4. Fill `CLAUDE.md`: replace every `<...>` placeholder from what you observed: overview, structure tree, dependency rules that actually hold (name the test or lint rule that enforces them), the conventions in use (naming, error handling, DI, tests, commit style), the commands, and the layer order for /build. Under 150 lines. Move area-specific detail into `.claude/rules/<area>.md` with `paths:` frontmatter (see `.claude/rules/README.md`); write at least the rule files for the two or three areas most code lives in, each pointing at real example paths.
B5. Permissions: add the project's build, test, lint, and run commands to `permissions.allow` in `.claude/settings.json` (Bash and PowerShell forms). Keep every deny rule; add Read deny rules for any file that holds secrets here.
B6. Handbook: write `docs/handbook/00-map.md` from the code (structure, areas table, layers, request or call path diagram, tests, where things live, config names). In `01-request-lifecycle.md` and `02-recipes.md`, set the "Start here" lines to the smallest real feature to trace or copy, and fill any recipe you can ground in one clean example. Seed `docs/handbook/glossary.md` with 10 to 30 domain terms from entity, model, or type names, each grounded in a path.
B7. Adopt existing features. Propose 5 to 25 feature slugs from routes, screens, jobs, or top-level modules, with a one-line description and the names a user would call each. Ask the developer to confirm or trim the list (one AskUserQuestion). Then, in parallel batches of about 8 with Explore subagents, create `_features/<slug>/feature.md` from `_features/_template.md` for each: Status live, What it does now (from the code), acceptance criteria as observed, a verified Code map (every path must exist), and fill `_features/INDEX.md` with "Also called" aliases. Mark anything you could not find. Leave Walkthrough for `/learn`.
B8. Optional: write `AGENTS.md` if other coding agents will work in this repo (the template already points it at CLAUDE.md and the workflow files).

## Report (both paths)
Reply with: the path taken; the profile values; what you wrote (files) and what you assumed; the features adopted or planned; anything you could not verify; and the three commands to run next: `/feature <idea>`, `/change <feature> <request>`, `/learn 00-map quiz`. Suggest `npx sanoy-ai-workflow doctor` to confirm the setup from outside Claude Code.
