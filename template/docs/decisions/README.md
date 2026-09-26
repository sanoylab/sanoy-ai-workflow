# Architecture decision records

An ADR is written only when a decision is all three of:

1. **Hard to reverse**: changing it later means a migration, a data backfill, a re-authentication flow, or touching every area.
2. **Non-obvious**: a newcomer reading the code would ask "why on earth is it done this way".
3. **A real trade-off**: a reasonable engineer could have chosen the other option.

Most features produce none. Feature-level decisions (what was asked, what Claude decided, what was assumed) live in the feature's `_features/<slug>/feature.md` under Design > Decisions. `/feature` writes an ADR here only when a project-wide decision meets the three tests above.

## Files

`NNNN-short-title.md`, numbered in order of creation (`0001-...`). Link the ADR from the feature doc that triggered it.

## Template

```markdown
# NNNN. <Title>

Date: <yyyy-mm-dd> | Status: proposed | accepted | superseded by NNNN
Feature: <slug or "platform">

## Context
What forced the decision. The constraints that matter. Two to six sentences.

## Decision
What was chosen, in one paragraph. Name the alternatives that were rejected and the one-line reason for each.

## Consequences
What becomes easier, what becomes harder, what must now be done consistently (with paths to the code that embodies the decision).
```

## Existing records

None yet.
