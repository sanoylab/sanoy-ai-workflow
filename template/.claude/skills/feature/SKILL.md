---
name: feature
description: Plan a brand new feature. Clarifies intent, explores the codebase, creates the branch, the feature folder, and a lean plan for approval. Writes no code. For work on an existing feature, use /change instead.
argument-hint: <short feature idea> [quick|deep]
disable-model-invocation: true
---

Idea: $ARGUMENTS

## Project profile
```
!`cat .claude/workflow.conf`
```

Goal: a plan short enough that the developer reads all of it, and specific enough that /build can run without them.

1. Check it's new. Search `_features/INDEX.md` (Feature and "Also called" columns) for a feature this idea belongs to. If one matches, say so and suggest /change instead (ask which with AskUserQuestion).
2. Branch. If the working tree is dirty (`git status --short`), stop and say so. Derive a slug (kebab-case, max 40 chars; start with one of MODULE_PREFIXES when the project defines them). Branch from DEFAULT_BRANCH (say so if HEAD is elsewhere): `git switch -c feature/<slug>`. Never put an AI or tool name in a branch name.
3. Explore before asking. Up to 3 Explore subagents in parallel:
   a. the most similar existing feature (its `_features/<slug>/feature.md` code map) and how it is built end to end,
   b. every file this feature likely touches,
   c. related tests.
   Read `CLAUDE.md`, `docs/handbook/00-map.md`, and any `.claude/rules/` file that matches the files found.
4. Interview (light by default). This is the only phase where you question the developer about a new feature, so make it count.
   a. List the open decisions as a tree: what depends on what (scope before UI, data model before validation, roles before screens).
   b. Triage each one. ASK only if all three are true: the code and existing features can't answer it; a wrong guess is expensive to undo (data model, permissions, who sees what, the user-facing flow, scope); reasonable people would choose differently. Otherwise DECIDE it yourself and record it under "Decisions I made for you".
   c. Ask in rounds. Each round is one AskUserQuestion call with up to 4 questions, and only covers the frontier: questions whose prerequisites are already answered. Every question has your recommended option first, with a one-line reason.
   d. Budget by mode (last word of the input):
      - light (default): up to 2 rounds, max 8 questions.
      - quick: at most 1 round of 1 to 2 questions. Use when they already know what they want.
      - deep: walk the whole tree one question at a time until nothing important is silently assumed. Use for big or vague ideas. If it passes about 30 questions, say the scope is probably too big and suggest splitting.
   e. "You decide" or "don't know" means: take your recommendation and mark it as an assumption.
   f. Push back when an answer conflicts with the code, another feature, or an earlier answer. Say so plainly, once, with the evidence.
   g. Domain words: if they use a term that isn't in `docs/handbook/glossary.md`, or use one differently than it defines, confirm the meaning in the same round and update the glossary.
   h. Stop asking when the frontier is empty or the budget is spent. Never ask during /build.
5. Create `_features/<slug>/feature.md` from `_features/_template.md`. Fill: header, What it does now (the intended behavior) with acceptance criteria, Design (name the pattern to copy with paths, at least one alternative, the flags, Decisions: what they answered, what you decided, assumptions), Build plan (goal, files, test plan, risks). Status: planned. Aim for under 120 lines. No em dash characters.
   If a decision is hard to reverse, non-obvious, and a real trade-off that affects the whole project (not just this feature), also write a short ADR in `docs/decisions/NNNN-<title>.md` (context, decision, consequences). Most features produce none.
6. Add a row to `_features/INDEX.md` (Status: planned).
7. Stop and present: goal (1 line), approach (max 5 bullets), "Decisions I made for you" (so they can overrule any by reading), assumptions, open questions. Ask with AskUserQuestion: approve, change, or cancel.

After approval, suggest /clear, then `/build <slug>`, and `/pbi <slug>` if the project tracks work items.
