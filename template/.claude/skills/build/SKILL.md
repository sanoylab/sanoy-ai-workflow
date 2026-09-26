---
name: build
description: Implement an approved new feature end to end with tests first, verification, a fresh-eyes review, and a learning walkthrough.
argument-hint: <slug> [auto|pair|coach]
disable-model-invocation: true
---

Input: $ARGUMENTS
First word: the slug. Optional second word: learning mode, default auto.

## Project profile
```
!`cat .claude/workflow.conf`
```

## 0. Load
Read `_features/<slug>/feature.md` and the files its Design names, plus `CLAUDE.md` and the `.claude/rules/` files that match those paths. Make sure you're on `feature/<slug>` (`git branch --show-current`). Set Status: building.

## 1. Tests first
Turn each testable acceptance criterion into tests in the project's test framework and naming convention (see CLAUDE.md). Run them (TEST_CMD, or TEST_ONE_HINT for a single test) and confirm they fail for the right reason.

## 2. Implement
Follow the layer order CLAUDE.md prescribes (for example data model, application logic, persistence, UI). Copy the patterns the plan names.
After each layer is green, make a local checkpoint commit `wip(<slug>): <layer>` with trailer `Feature: <slug>`. Never push.
Small ambiguity: choose what is most consistent with existing code, add one line to the Decision log, continue.
Stop and ask before:
- anything that contradicts the plan or the code,
- an unplanned schema or data migration,
- touching shared infrastructure, another module, or the application entry point beyond the plan,
- auth, permission, or security behavior changes,
- scope growing noticeably beyond the plan.
Never create a schema migration on your own; when the data model changes, say so and wait (use the project's migration skill if one exists).

## 3. Learning mode
- auto: implement everything.
- pair: implement tests, scaffolding, and wiring. Leave 1 to 3 core pieces as `// TODO(dev): <what and why>` with a one-line hint naming the pattern and an example path. Keep it compiling (throw a not-implemented error). List the TODOs and stop. When they say done, review their code like a senior colleague (correctness first, then style), then continue.
- coach: write no production code. Give the next step: which file, what to add, what good looks like. When they say done, review, run the tests, give the next step. Write tests only if they ask.

## 4. Verify
Loop until green: BUILD_CMD, tests for touched areas (TEST_CMD), and ARCH_TEST_CMD if set. For UI changes, add a manual checklist (URL, steps, states to check) to the Walkthrough. Never claim something passed that you didn't run.

## 5. Review
Spawn the `reviewer` subagent on the branch diff against DEFAULT_BRANCH plus uncommitted changes, with the feature.md path. Fix every Blocker and Major. Log Minors you don't fix, with a reason, in the Decision log.

## 6. Document
In feature.md: fill the Code map (`Code map verified: <today>`), update What it does now if the build changed anything, and write the Walkthrough for someone who has never seen this code (under about 80 lines). Update the `_features/INDEX.md` row. No em dash characters.

## 7. Report
Set Status: review. Reply with: what was built (3 to 5 bullets), tests run and results, decisions made, a diff reading order (files in the order to read them, one line each on why), any TODO(dev). Suggest `/learn <slug>` next.
