# Scripts

## Azure DevOps work items (used when WORK_ITEMS="azdo" in .claude/workflow.conf)

Both scripts resolve the connection the same way: `AZDO_ORG_URL`, `AZDO_PROJECT`,
`AZDO_PAT` environment variables first, then the git-ignored
`.claude/azdo.local.json` (`{ "OrgUrl", "Project", "Pat" }`; override the path
with `AZDO_CONFIG_PATH`). The PAT is never printed. The PAT needs the
"Work Items: Read, write, & manage" scope.

### `azdo-create-pbi.ps1`

Creates Product Backlog Items or Bugs (never child tasks) from a JSON payload.
Used by the `/pbi` skill.

```powershell
.\scripts\azdo-create-pbi.ps1 -CheckConfig                      # reports which values are missing, never the values
.\scripts\azdo-create-pbi.ps1 -PayloadPath ".pbi-payload.json"  # creates the items
```

Payload: a single item `{ "title", "description", "acceptanceCriteria", "tags" }`
or `{ "pbis": [ ... ] }`. Each item may set `"workItemType": "Bug"` (default is
`Product Backlog Item`); a Bug also gets its description written to Repro Steps.
Output ends with `{ "Pbis": [ { "PbiId", "PbiUrl", "Title", "Type" } ] }`.

If your process template uses different work item type names (for example
"User Story" in Agile or "Issue" in Basic), change `Get-ItemType` in the script.

### `azdo-get-workitem.ps1`

Reads one work item (title, type, state, description, acceptance criteria,
repro steps, tags, newest comments as plain text) as JSON. Used by the
`/change` skill when a work item number is given.

```powershell
.\scripts\azdo-get-workitem.ps1 -Id 1342
```

## GitHub (WORK_ITEMS="github")

No scripts needed: the skills use the `gh` CLI (`gh auth status`, `gh issue create`, `gh issue view`).
