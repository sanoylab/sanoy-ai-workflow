# Developer handbook

Written for a developer who has to work on this codebase without AI. Every claim points at a real path. Claude keeps it current through `/learn handbook <page>`.

## Pages

| Page | Read it when |
|---|---|
| [00-map.md](00-map.md) | You need to know where things live. |
| [01-request-lifecycle.md](01-request-lifecycle.md) | You want to follow one real request or call end to end, with file and line references. |
| [02-recipes.md](02-recipes.md) | You have to add a field, a use case, an entity, a migration, a screen, an endpoint, or debug a bug report, by hand. |
| [glossary.md](glossary.md) | A domain word is unclear. Both you and Claude add to it. |
| [modules/](modules/README.md) | Per-area deep dives, filled over time with `/learn handbook modules/<name>`. |
| [../decisions/](../decisions/README.md) | Architecture decision records: the few choices that were hard to reverse. |

Feature-level knowledge lives next to each feature in `_features/<slug>/feature.md`. The index of every feature is `_features/INDEX.md`.

## Cheat sheet: the Claude Code workflow

```
NEW FEATURE    /feature <idea> [quick|deep]  ->  /build <slug> [auto|pair|coach]  ->  /learn <slug>  ->  /ship
                 short interview, you approve the plan                                                    you approve the result

FIX OR CHANGE  /change <feature, #workitem, or description> <what the user asked> [auto|pair|coach]  ->  /ship
                 S: runs straight through | M: you approve a mini plan | L: becomes a /feature

ANY TIME       /pbi <slug> [C-003]      create or link work items (backlog items or issues, a bug for a change entry)
               /learn <anything> [quiz] explain, walk through, or quiz
               /status                  where am I, what is open, what next
               /onboard [new|existing]  (re)teach the AI the project
```

- **Finding a feature later**: any name works (`/change map explorer ...`, `/change #1342 ...`, `/change my-slug ...`, or a description). Claude resolves it through `_features/INDEX.md` ("Also called", work item numbers), then the feature docs, then `git log --grep "Feature:"`. If nothing matches, it offers to adopt the code into a new feature folder.
- **Git remembers**: every commit carries a `Feature: <slug>` trailer and, when known, a work item link. `git log --grep "Feature: <slug>"` shows a feature's history.
- **When Claude stops and asks** during /build or /change: the plan contradicts the code; an unplanned migration; a change to shared infrastructure, another module, or the entry point beyond the plan; auth or security behavior; scope growing.
- **Learning modes**: `auto` (Claude writes everything, then explains), `pair` (Claude writes tests, scaffolding, and wiring, leaves 1 to 3 core pieces as `TODO(dev)`), `coach` (you write it, Claude gives one step at a time and reviews).
- **Daily tips**: fresh context per phase (`/clear` after approving a plan); Esc Esc rewinds; two items at once means two worktrees and two sessions; strongest model for /feature, /build, and M or L changes.
- **The Stop hook** rebuilds when source files changed since the last green build and blocks Claude from finishing on a broken build. Configure it in `.claude/workflow.conf` (BUILD_CMD, SOURCE_GLOBS).

## Catching up on code AI already built

One 30 to 45 minute session at a time:

1. Read `00-map.md` and `01-request-lifecycle.md`, then `/learn request lifecycle quiz`.
2. One area per session: `/learn <path>`, then `quiz`.
3. The next few bug fixes in `pair` mode: Claude finds the root cause and writes the failing test, you write the fix.
4. Then a small feature in `coach` mode.

You are done when you can do recipes 1 to 3 and the bug recipe without AI, and explain one request end to end on a whiteboard.
