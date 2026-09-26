# Path-scoped rules

Files in this folder are loaded by Claude Code only when a file matching their `paths:` frontmatter is in play. Put area-specific knowledge here (UI conventions, persistence rules, pipeline details) so `CLAUDE.md` stays short and loads fast.

Format:

```markdown
---
paths:
  - "src/web/**/*.tsx"
  - "**/*.css"
---
# Frontend rules

Loaded when a component or stylesheet is in play.

- Rule one, with the path of an example to copy.
- Rule two.
```

Guidelines:
- One file per area: `frontend.md`, `persistence.md`, `api.md`, `pipeline.md`, `email.md`, and so on.
- Every rule should point at a real path that shows the pattern.
- A file without `paths:` loads at session start like CLAUDE.md, so only leave it out on purpose.
- Keep `CLAUDE.md` for what applies to every change; move the rest here.
- Never use the em dash character.

Delete this README once the folder has real rules, or keep it as the guide.
