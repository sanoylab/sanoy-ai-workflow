---
name: change
description: Fix a bug in, modify, or add to an EXISTING feature. Use when the developer reports a bug, relays user feedback or a change request, gives a work item number, or asks to change how an existing feature behaves.
argument-hint: <feature name, slug, or #workitem> <what needs to change> [auto|pair|coach]
---

Input: $ARGUMENTS

## Project profile
```
!`cat .claude/workflow.conf`
```

## 1. Find the feature
Resolve the target in this order, and stop at the first confident match:
1. A work item number (#1234 or 1234): search `_features/INDEX.md` and the `feature.md` files for it. If not recorded: WORK_ITEMS=azdo, run `.\scripts\azdo-get-workitem.ps1 -Id <n>` (PowerShell); WORK_ITEMS=github, run `gh issue view <n> --json title,body,comments`; use the returned text to identify the feature. If the tool reports missing config, say so and continue with the developer's words.
2. A slug or a name: match `_features/INDEX.md` "Feature" and "Also called" columns.
3. A description, page, URL, or file path: search the `feature.md` code maps, then the code (route or entry point to handler), then `git log --grep "Feature:"`.
If two or more candidates remain, AskUserQuestion with the top 3. If none match, the code predates this workflow: offer to adopt it (map the code into a new `_features/<slug>/feature.md` with What it does now and Code map, add to INDEX.md) or to treat it as a new /feature.

## 2. Load
Read feature.md, then the files in its Code map, plus the `.claude/rules/` files that match them. If the map is missing or stale (paths don't exist), refresh it first and note it. Pull the work item text if a number was given.

## 3. Classify and size
- Type: bug (code differs from What it does now), change (user wants different behavior), addition (new behavior within this feature).
- Size: S (a few files, no schema change, no new screen), M (several layers, a migration, or a new screen), L (a new capability or crosses modules).
If L: recommend /feature with Parent: <slug>, and stop.
Questions: use the same triage as /feature step 4b (ask only what the code can't answer, is expensive to get wrong, and could reasonably go either way). S: at most 2 questions, often none. M: one round of up to 4, asked together with the mini plan. Recommended option first. Everything else: decide, and list it in the entry.

## 4. Set up
If the working tree is dirty, stop and say so. Create branch `fix/<slug>-<short>` (bugs) or `change/<slug>-<short>` from DEFAULT_BRANCH. Add a change entry C-00N (next number) to feature.md with date, type, size, request, source, status open.
M only: write the plan in the entry (3 to 8 bullets, files, tests) and ask the developer to approve before coding. S runs straight through.

## 5. Bugs: reproduce first
Write a failing test that reproduces the bug. If it is UI only and can't be unit tested, write exact repro steps. Find the root cause and write it in the entry before fixing. Explain the root cause briefly as you go.

## 6. Implement and verify
Same rules as /build: stop-and-ask list, learning mode (default auto; in pair mode for bugs, you find the cause and write the failing test, they write the fix), checkpoint commits with trailer `Feature: <slug>` (and the WORK_ITEM_LINK_SYNTAX reference if an item is known), never create migrations on your own, loop BUILD_CMD + touched tests + ARCH_TEST_CMD until green, then the `reviewer` subagent on the diff. Fix Blockers and Majors.

## 7. Update the living doc
In feature.md: update What it does now and acceptance criteria to the new truth, the Code map if files were added or moved, and complete the change entry (what changed, files, tests, Learn note, status in review). Update the INDEX.md row (Last change). No em dash characters.

## 8. Report
Reply with: root cause (bugs) or what changed, tests run and results, a diff reading order, anything left open. Suggest /ship.
