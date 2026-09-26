# Node stack pack

Profile hints for Node and TypeScript projects (no extra skills yet; contributions welcome).

Suggested `.claude/workflow.conf` values:

```
BUILD_CMD="npm run build"            # or: npx tsc --noEmit  (type check only, faster)
TEST_CMD="npm test"
TEST_ONE_HINT="npx vitest run <path>   or   npx jest <path> -t '<name>'"
ARCH_TEST_CMD="npm run lint"
SOURCE_GLOBS="*.ts *.tsx *.js *.jsx *.mjs *.cjs package.json"
```

Suggested rules files: `.claude/rules/frontend.md` (components, styling, state) and `.claude/rules/api.md` (routes, validation, error shapes), each pointing at one clean example in the project.

`settings.merge.json` in this pack allows `npm`, `npx`, `pnpm`, and `yarn` commands.
