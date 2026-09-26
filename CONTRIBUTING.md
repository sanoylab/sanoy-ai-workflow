# Contributing

Thanks for helping make agentic development safer and more learnable.

## Ground rules

- The template must stay stack-agnostic. Anything language- or framework-specific goes in a stack pack under `stacks/<name>/`.
- Every skill must work with only what is in the project: `.claude/workflow.conf`, `CLAUDE.md`, `.claude/rules/`, `_features/`, `docs/`. No hidden state.
- Skills ask the developer only what the code cannot answer and what is expensive to get wrong. Everything else is decided and listed.
- No em dash characters anywhere in the repo (`npm run lint` checks). Use a colon, comma, parentheses, or a new sentence.
- No telemetry, no network calls from the CLI or the hook, no secrets read by skills.

## Development

```bash
git clone https://github.com/sanoylab/sanoy-ai-workflow
cd sanoy-ai-workflow
npm test          # installs the template into temp folders and exercises the hook
npm run lint      # em dash and placeholder checks
node bin/cli.js init ../some-project --stack dotnet   # try it locally
```

Node 18 or newer; no dependencies.

## Adding a stack pack

1. Create `stacks/<name>/` mirroring the project layout (`.claude/skills/...`, `.claude/rules/...`).
2. Add `README.md` (first non-heading line is the summary shown by `npx sanoy-ai-workflow stacks`) with the suggested `workflow.conf` values.
3. Optional `settings.merge.json`: allow and deny rules merged into the project's `.claude/settings.json` (arrays are unioned).
4. Add a test case in `test/kit.test.js` if the pack adds files.

## Changing a skill

Keep the shape: numbered steps, explicit stop-and-ask list, one confirmation at most, a report section. Test it on a real project before opening a PR and describe what changed in behavior, not just wording. Update `CHANGELOG.md`.

## Pull requests

Small and focused. Explain the problem, the change, and how you verified it. Commit subjects follow `type(scope): description`.
