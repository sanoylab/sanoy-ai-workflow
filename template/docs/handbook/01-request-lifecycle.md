# One request, end to end

Trace one small real feature through every hop, with `path:line` at each. Write it with `/learn handbook 01-request-lifecycle` once the project has a feature worth tracing (the smallest create-or-update flow is ideal).

Start here: <the feature `/onboard` picked, or "not chosen yet">

## The request

<Method, route or command, and what the user did to trigger it.>

## Hops

For each hop: `path:line`, then 2 to 5 lines on what happens and why it is built that way.

1. Entry point (route, controller, handler registration)
2. Input binding and first-line validation
3. Cross-cutting behavior (logging, auth, validation pipeline, transactions)
4. Business logic (the use case or service)
5. Domain rules and invariants
6. Persistence (repository or query, ORM mapping, transaction commit)
7. Response (redirect, view, JSON) and how failures are shown

## The read path

<The list or detail query for the same feature, briefly: query, mapping to a DTO or view model, paging, caching.>

## Error shapes

<What a validation failure, an authorization failure, and an unhandled exception each return, with the code that produces them.>

## Try it yourself

1. <Add a validation rule, trigger it, observe the response.>
2. <Break an invariant and see how the failure surfaces.>
3. <Log a request and find it in the logs by its correlation id.>
4. <Write a failing test for one hop and make it pass.>

## Tests that cover this path

- `<test file>`: <5 to 8 representative test names>
