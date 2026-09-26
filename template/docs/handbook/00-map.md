# The map

`/onboard` fills this page from the code. Every `<...>` is a placeholder until then.

## What this is

<One paragraph: the product, its users, the stack.>

## Structure

```
<repo tree, 20 to 40 lines, with a comment per folder>
```

## Areas or modules

| Area | What it is for | Entry point | Storage |
|---|---|---|---|
| <name> | <purpose> | `<path>` | <schema, table prefix, or store> |

## Layers and dependency rules

<What each layer holds and what may depend on what. Name the enforcing test or lint rule.>

## The path of a request or call

```
<ASCII diagram: client -> entry point -> validation -> logic -> persistence -> response>
```

## Shared code

<Shared libraries or folders and 2 to 4 key types each, with paths.>

## Tests

| Project or folder | Covers | Framework |
|---|---|---|
| `<path>` | <what> | <framework> |

## Where things live

| I am looking for | Path |
|---|---|
| Entry points (routes, commands, jobs) | `<path>` |
| Business logic | `<path>` |
| Data model | `<path>` |
| Persistence and migrations | `<path>` |
| UI | `<path>` |
| Tests | `<path>` |
| Configuration (names only) | `<path>` |
