# CLAUDE.md

Run `/onboard` once after copying the kit; it replaces every `<...>` placeholder from the code. Keep this file under 150 lines; area-specific detail goes in `.claude/rules/`.

## Project Overview

<One paragraph: what the product is, who uses it, the stack (language, framework, database), and the one acronym or term a newcomer must know.>

## Workflow

Two lanes, one home per feature:

- **New feature**: `/feature <idea> [quick|deep]` (short interview, plan for approval) then `/build <slug> [auto|pair|coach]`, `/learn <slug>`, `/ship`.
- **Fix or change on an existing feature**: `/change <feature, #workitem, or description> <what changed>` then `/ship`. Small changes run straight through; medium ones wait for a mini plan approval; large ones become a `/feature`.
- **Any time**: `/pbi <slug> [C-00N]` creates or links work items; `/learn <anything> [quiz]` explains or quizzes.

Project values (commands, branches, PR mode, work items) live in `.claude/workflow.conf`. Run `/feature`, `/build`, and medium or large changes on the strongest model. After approving a plan, `/clear` and run `/build`: the feature doc carries everything.

## Features

Every feature lives in `_features/<slug>/feature.md` (What it does now, Code map, Design, Walkthrough, Changes, Build plan). When the user mentions an existing feature by any name, work item number, page, or description, resolve it through `_features/INDEX.md` first, then the feature docs, then `git log --grep 'Feature:'`. Any code change to a feature must update its `feature.md` (What it does now, Code map, Changes) and `INDEX.md`. Every commit carries a `Feature: <slug>` trailer and, when known, a work item link.

## Working Principles

- **Think before coding.** State assumptions. If several readings exist, present them instead of picking silently. Push back when a simpler approach exists.
- **Simplicity first.** No features beyond the ask, no abstractions for single-use code, no speculative configurability. <Project-specific: the pipeline, validation, and error-handling pieces to trust instead of re-implementing.>
- **Surgical changes.** Touch only what the request needs. Match existing style even if you'd do it differently. Remove only the orphans your change created; mention pre-existing dead code, don't delete it.
- **Goal-driven execution.** Turn tasks into verifiable goals (a failing test that reproduces a bug; tests green before and after a refactor; a clean build). Loop until verified.

## Structure

```
<repo tree, 15 to 30 lines: entry point, source areas or modules, shared code, tests, config>
```

## Dependency Rules

<What may depend on what, and what is forbidden. Name the test or lint rule that enforces it, if any.>

## Layer Order for /build

<The order to implement a feature in, e.g. model, logic, persistence, UI, tests. One line each on what goes where.>

## Coding Conventions

- <Language version and the features in use>
- <Error handling convention: result types, exceptions, validation layer>
- <Dependency injection and composition rules>
- <Naming conventions for files, tests, branches>
- <Test framework and the test naming pattern>
- <UI conventions, if any, with a pointer to `.claude/rules/frontend.md`>

## Common Commands

```bash
<build command>
<run command>
<test everything>
<test one project or file>
<test one test>
<lint or format>
```

<Anything the commands need: how migrations are made, what locks build output while the app runs, what needs a secret.>

## Explaining Your Work

Say why, name the pattern, and point to an existing example by path. Separate verified facts from assumptions. Never claim a build or test passed unless you ran it in this session.

## Writing Style

Never use the em dash character, anywhere: files, code, comments, commit messages, replies. Use a colon, comma, parentheses, or a new sentence. Commit subjects follow `type(scope): description` (feat, fix, refactor, docs, style, test, perf, chore). No AI attribution lines or tool names in branch names, commits, or PRs.

## Where the Rest Lives

- `.claude/rules/`: path-scoped rules that load when matching files are in play. <List each file and its area.>
- `docs/handbook/`: the developer handbook (map, request lifecycle, recipes, glossary). `docs/decisions/`: ADRs.
- `_features/`: one folder per feature with its living doc and archived plans.

## Core Values

Clarity over cleverness. Simplicity over complexity. Consistency over individual preference. Read existing code before modifying; ask when requirements are unclear.
