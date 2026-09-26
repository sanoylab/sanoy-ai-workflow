# Recipes: doing it by hand

Numbered checklists in the order the project builds things (see "Layer Order for /build" in `CLAUDE.md`). Each step names the exact file to copy from. Fill the `<...>` with `/learn handbook 02-recipes` once the project has one clean example of each; until then the placeholders say what to look for.

Start here: <the smallest complete feature to copy from, chosen by /onboard>

## 1. Add a field to an existing entity end to end
1. Model: `<entity file>`: add the property, keep invariants in the entity.
2. Persistence: `<mapping or schema file>`: column, length, index if filtered.
3. Migration: see recipe 4.
4. Logic: `<create or update use case>` and its validator.
5. Transport: `<DTO or view model>`.
6. UI: `<form and detail views>`.
7. Tests: `<test file>`: validator rule, mapping, one end-to-end test.
Gotcha: <what people forget in this project, e.g. the read model, the export, the search index>.

## 2. Add a command, query, or use case
1. `<request type>`: the input record.
2. `<validator>`: input rules (registered how: `<registration path>`).
3. `<handler>`: the logic, returns the project's result type.
4. `<entry point>`: thin, delegates.
5. `<test file>`: handler happy path, one failure, validator rules.

## 3. Add a CRUD entity
Copy the smallest existing one: `<path of the smallest lookup or entity>`. Files in order: model, repository interface, repository implementation, mapping, migration, use cases (create, update, delete, list, get), entry points, views, tests.

## 4. Add a migration
```
<exact command(s) per database or context>
```
Gotchas: <what refuses to start on pending changes; what test pins the model; never hand-edit generated migrations>.

## 5. Add a screen or view
1. Copy `<a small existing view>`; it shows the layout, the shared components, and the conventions from `.claude/rules/frontend.md`.
2. Register the route or entry point: `<path>`.
3. Wire the read model: `<path>`.
4. Tests: `<path>`.

## 6. Add an API endpoint
1. Copy `<an existing API controller or route>`.
2. Auth: `<how endpoints are protected>`.
3. Request binding: `<request class convention>`.
4. Versioning and docs: `<path>`.
5. Tests: `<path>`.

## 7. Add a cross-area interface
1. Define it in `<shared abstractions path>`.
2. Implement it in the owning area: `<path>`.
3. Register it: `<DI registration path>`.
4. Consume it from the other area through the interface only.

## 8. Send a notification or email
1. `<sender interface>` and its outcome type.
2. `<an existing handler that sends>`.
3. Config keys (names only): `<keys>`.

## 9. Debug a bug report
1. From the URL or action to the entry point: `<route table or convention>`.
2. From the entry point to the use case and handler: `<pattern>`.
3. Read the logs: `<log location>`, find the request by `<correlation id or request id>`.
4. Write a failing test first, copying the style of `<test name>` and `<test name>`.
5. Run one test project: `<TEST_CMD variant>`; one test: `<TEST_ONE_HINT>`.
6. Fix, keep the test as a regression guard, record the root cause in the feature's change entry.

## 10. Protect an action with a permission or role
1. `<how policies or roles are named>`.
2. `<where they are defined or seeded>`.
3. `<one example entry point>`.
