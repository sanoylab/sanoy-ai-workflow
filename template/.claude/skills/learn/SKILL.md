---
name: learn
description: Teach the developer how code in this repo works so they can explain and change it without AI. Use when they ask to explain, walk through, understand, or be quizzed on a feature, its history, a file, a module, or a concept in this codebase.
argument-hint: <feature | path | topic> [quiz]  or  handbook <page>
---

Input: $ARGUMENTS

Choose the mode:
- A feature (resolve like /change step 1 through `_features/INDEX.md`): walk through it using its feature.md and the code. Include its history from Changes when useful ("why does it work this way").
- A path or topic ("the request pipeline", "src/payments", "how search works"): explain that area.
- Ends with `quiz`: quiz on that subject.
- Starts with `handbook`: create or update a page in `docs/handbook/`.

## Explain or walk through
1. One-sentence purpose, and where it sits in the architecture (see `docs/handbook/00-map.md`).
2. Trace one real request or call end to end: entry point, validation, business logic, persistence or external call, response. Cite path:line at each hop. Read the code; don't rely on docs alone. `docs/handbook/01-request-lifecycle.md` shows the shape.
3. For each pattern met: what it is, why it's used here, the tradeoff, one other place it appears.
4. A small ASCII or mermaid diagram when it helps.
5. End with "Change it by hand": a numbered recipe for the most likely next change (`docs/handbook/02-recipes.md` has the generic ones).
6. Flag anything that looks wrong, dead, or inconsistent with CLAUDE.md or with feature.md. Don't fix it here.
Explain like a senior colleague at a whiteboard. Offer to go deeper on any hop. If feature.md was missing something you had to discover, add it to the Walkthrough or Code map.

## Quiz
Ask 5 questions one at a time (one AskUserQuestion per question, with an "I don't know" option), waiting for each answer. Mix: recall (where does X live), flow (what happens after Y), why (why this pattern here), predict (what breaks if Z changes), apply (where would you add W). Grade honestly: what was right, what was missing, and the file that shows it. End with a score and 1 to 2 topics to revisit. For a feature, append the date and score to its Quiz log in feature.md.

## Handbook
Write for a developer working without AI. Ground every statement in real paths. Prefer checklists and one worked example over prose. Module or area pages go in `docs/handbook/modules/<name>.md`. Keep `docs/handbook/README.md`'s index current. No em dash characters.
