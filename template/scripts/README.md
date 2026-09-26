# Scripts

## `azdo-get-workitem.ps1` (used when WORK_ITEMS="azdo" in .claude/workflow.conf)

Reads one Azure DevOps work item (title, type, state, description, acceptance
criteria, repro steps, tags, newest comments as plain text) as JSON. The
`/change` skill runs it when you pass a work item number, so the request text
comes straight from the tracker.

```powershell
.\scripts\azdo-get-workitem.ps1 -Id 1342
```

Connection: `AZDO_ORG_URL`, `AZDO_PROJECT`, `AZDO_PAT` environment variables
first, then the git-ignored `.claude/azdo.local.json`
(`{ "OrgUrl", "Project", "Pat" }`; override the path with `AZDO_CONFIG_PATH`).
The PAT is never printed and needs the "Work Items: Read" scope.

## GitHub (WORK_ITEMS="github")

No scripts needed: `/change` uses the `gh` CLI (`gh issue view <n>`).

## Other trackers

Add a script here that prints the same JSON shape (`Id`, `Type`, `State`,
`Title`, `Description`, `Comments`) and point the `/change` skill at it.
