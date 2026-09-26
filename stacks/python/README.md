# Python stack pack

Profile hints for Python projects (no extra skills yet; contributions welcome).

Suggested `.claude/workflow.conf` values:

```
BUILD_CMD="python -m compileall -q ."   # or: ruff check . && mypy .   (lint and types as the "build")
TEST_CMD="pytest -q"
TEST_ONE_HINT="pytest <path>::<test_name> -q"
ARCH_TEST_CMD="ruff check ."
SOURCE_GLOBS="*.py pyproject.toml requirements*.txt"
```

Suggested rules files: `.claude/rules/api.md` (routers, schemas, error shapes) and `.claude/rules/data.md` (models, migrations with Alembic or Django), each pointing at one clean example in the project.

`settings.merge.json` in this pack allows `python`, `pip`, `pytest`, `ruff`, `mypy`, `poetry`, and `uv` commands.
