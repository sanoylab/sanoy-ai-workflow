# Stack packs

Optional add-ons copied on top of `template/` with `npx sanoy-ai-workflow init --stack <name>` (several `--stack` flags are allowed). A pack mirrors the project layout (`.claude/skills/...`, `.claude/rules/...`) so its files land in place.

| Pack | Adds |
|---|---|
| `dotnet` | `/migrate` skill for EF Core (module registry to fill in), an example path-scoped rule file for Razor views, permissions for dotnet, and `workflow.conf` hints |
| `node` | `workflow.conf` hints and permissions for npm, npx, pnpm, yarn |
| `python` | `workflow.conf` hints and permissions for python, pip, pytest, ruff, mypy, poetry, uv |

To add a pack: create `stacks/<name>/` with the same folder structure as `template/`, a `README.md` whose first non-heading line is the one-line summary shown by `npx sanoy-ai-workflow stacks`, an optional `settings.merge.json` (allow and deny arrays are unioned into the project settings), and keep everything free of em dash characters.
