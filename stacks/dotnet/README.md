# .NET stack pack

Adds to the base kit:

- `.claude/skills/migrate/SKILL.md`: EF Core migration skill with a module registry (project path, DbContext class, schema) to fill in. Uses `dotnet ef`; if that command is denied or not installed, install the global tool (`dotnet tool install -g dotnet-ef`) and change the skill to `dotnet-ef`.
- `.claude/rules/frontend.example.md`: an example path-scoped rule file for Razor views, CSS, and JS. Rename it (drop `.example`) and replace the content with your project's real rules, or delete it.

Suggested `.claude/workflow.conf` values:

```
BUILD_CMD="dotnet build MySolution.slnx"
TEST_CMD="dotnet test"
TEST_ONE_HINT="dotnet test tests/<Project> --filter \"FullyQualifiedName~<Name>\""
ARCH_TEST_CMD="dotnet test tests/<ArchitectureTests project>"     # if you have one
SOURCE_GLOBS="*.cs *.cshtml *.csproj *.props"
BUILD_EXTRA_ARGS="-p:OutDir=$CLAUDE_PROJECT_DIR/.claude/.build/"   # when Visual Studio keeps the app running and locks bin/
```

Suggested `settings.json` additions: allow `Bash(dotnet:*)`, `PowerShell(dotnet build *)`, `PowerShell(dotnet test *)`; deny `Bash(dotnet ef:*)` and `Edit(**/Migrations/**)` so migrations only happen through `/migrate`.
