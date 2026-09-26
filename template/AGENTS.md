# Agent instructions

This repository uses Sanoy (sanoy-ai-workflow), an agentic AI development workflow. The rules and project knowledge live in files any coding agent can read:

- `CLAUDE.md`: project overview, architecture rules, conventions, commands. Read it first.
- `.claude/workflow.conf`: build, test, branch, and pull-request settings.
- `.claude/rules/*.md`: area-specific rules; read the ones whose `paths:` match the files you touch.
- `_features/INDEX.md` and `_features/<slug>/feature.md`: every feature's current behavior, code map, decisions, and change history. Update the feature doc when you change its code.
- `docs/handbook/`: how the codebase works, recipes, glossary.

Workflow expectations for any agent: plan before coding and get the plan approved; write tests first from acceptance criteria; keep commits small with a `Feature: <slug>` trailer; never create schema migrations without asking; run the build and tests before claiming done; never use the em dash character.

The `.claude/skills/*/SKILL.md` files describe each step of the workflow in detail (feature, build, change, learn, ship, status, onboard). They are written for Claude Code but read as plain procedures.
