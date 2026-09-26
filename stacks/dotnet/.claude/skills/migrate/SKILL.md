---
name: migrate
description: Add an EF Core migration and optionally update the database for any DbContext in this solution
argument-hint: [module] [MigrationName]
disable-model-invocation: true
allowed-tools: Bash(git diff:*), Bash(git status:*), Bash(git branch:*), Bash(dotnet ef:*), Bash(dotnet-ef:*), Bash(dotnet build:*), PowerShell(dotnet ef *), PowerShell(dotnet-ef *), PowerShell(dotnet build *)
---

Input: $ARGUMENTS (optional: module name, then migration name)

## Context

- Changed files: !`git status --short`
- Current branch: !`git branch --show-current`

## Module registry (fill this in once)

| Module | Infrastructure project path | Context class | Schema |
|--------|-----------------------------|---------------|--------|
| <Name> | `src/<path to the project that holds the DbContext>` | `<Name>DbContext` | `<schema>` |

Startup project (always): `<path to the web or host project>`
Output dir (always): `Persistence/Migrations` (or the folder this project already uses)
Command: `dotnet ef` (use `dotnet-ef` if the global tool is what is installed).

## Instructions

### Step 1: Detect target module

Use the module from the input if given. Otherwise look at the changed files above and determine which module's data model or EF configuration changed. If changes span multiple modules, list them and ask which one to migrate first. If nothing is detected and no module was given, ask.

### Step 2: Ask for migration name

Use the name from the input if given. Otherwise ask: **"What should the migration be called?"** PascalCase, no spaces, descriptive of what changed (not "Update" or "Fix").

### Step 3: Show the full commands

```bash
# Add migration
dotnet ef migrations add {MigrationName} \
  --project {ProjectPath} \
  --startup-project {StartupProject} \
  --context {ContextClass} \
  --output-dir {OutputDir}

# Apply to database
dotnet ef database update \
  --project {ProjectPath} \
  --startup-project {StartupProject} \
  --context {ContextClass}
```

Ask: **"Run both commands (add + update), or just add the migration?"**

### Step 4: Execute

Run the approved commands in order and show full output. If `migrations add` fails, run the build first (EF requires a clean build); if the build fails, show the errors and stop; if the build passes but EF fails, show the raw error and suggest a fix. If it succeeds, show the generated file and check that it contains only the expected operations.

### Step 5: Confirm database update

If "add + update" was chosen, run `database update` (without `--no-build`) and confirm success. Remind the developer to commit the migration files and to re-run any model snapshot or architecture test the project has.
