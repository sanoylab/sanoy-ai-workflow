---
name: pbi
description: Create work items (backlog items, issues, or a bug, never child tasks) from a feature or a change entry, and record their IDs back in the feature docs.
argument-hint: <feature slug or name> [C-00N]
disable-model-invocation: true
---

Input: $ARGUMENTS

## Project profile
```
!`cat .claude/workflow.conf`
```

If WORK_ITEMS is `none`, say that this project does not track work items (set WORK_ITEMS in `.claude/workflow.conf` to `github` or `azdo`) and stop.

## 1. Resolve the target
Resolve the feature like /change step 1 (if empty, ask with AskUserQuestion, offering the 4 most recently changed features from `_features/INDEX.md`). Read `_features/<slug>/feature.md`.
- No change ID: the target is the whole feature.
- A change ID (C-00N): the target is that change entry.
If work item IDs are already recorded for this target, show them and ask: create more, or stop.

## 2. Check config (never read secrets)
- `azdo`: run `.\scripts\azdo-create-pbi.ps1 -CheckConfig` (PowerShell). If it reports missing values, tell the developer which ones and how to set them (`AZDO_ORG_URL`, `AZDO_PROJECT`, `AZDO_PAT` env vars, or the git-ignored `.claude/azdo.local.json` with `OrgUrl`, `Project`, `Pat`) and stop. Never open that file or print the PAT.
- `github`: run `gh auth status`. If not authenticated, say so and stop.

## 3. Build the work items
Title: `<WORK_ITEM_TITLE_PREFIX><Name>`, where `<MODULE>` in the prefix is replaced by the module derived from the slug prefix (MODULE_PREFIXES) or the feature's Module field.

Whole feature:
- Simple or cohesive: 1 item named after the feature title.
- Complex: 2 to 4 independent items, each a user-facing vertical slice with its own short capability name. Never split by architecture layer. Hard cap 4. Consolidate.

Change entry:
- bug: 1 Bug (azdo) or 1 issue labeled `bug` (github). Title names the symptom. Repro steps from the entry (steps, expected, actual), plus the root cause if known.
- change or addition: 1 backlog item or issue. Title names the new behavior.

For every item:
- Description: at most 2 short paragraphs (HTML `<p>` for azdo, markdown for github). First: the outcome for the user. Second (optional): key scope rules, ending with `Feature doc: _features/<slug>/feature.md`.
- Acceptance criteria: a list of the criteria that apply to this item, one short line each (`<ul>` for azdo, a markdown checklist for github).
- Tags or labels: `<Module>; <slug>` (azdo) or labels `<slug>` plus `bug` when relevant (github).
No child tasks, ever. No em dash characters.

## 4. Preview and confirm
- `azdo`: write `.pbi-payload.json` in the repo root (single object, or `{ "pbis": [...] }`; add `"workItemType": "Bug"` on a bug item).
- `github`: prepare one `gh issue create --title ... --body-file ... --label ...` per item.
Show: how many items, each type and title, acceptance criteria count. AskUserQuestion: Create / Show payload / Cancel.

## 5. Create and record
- `azdo`: run `.\scripts\azdo-create-pbi.ps1 -PayloadPath ".pbi-payload.json"` (PowerShell). The script ends with a JSON object `{ "Pbis": [ { "PbiId", "PbiUrl", "Title", "Type" } ] }`. Delete `.pbi-payload.json` on success; keep it on failure for a retry.
- `github`: run the prepared `gh issue create` commands; each prints the issue URL.
Then write the IDs into feature.md (header "Work items" for a feature; the change entry for C-00N) and into the `_features/INDEX.md` row, and report each ID with its URL, one per line, plus any warnings.
Tip: WORK_ITEM_LINK_SYNTAX in commits and PRs links them to the work item; /ship adds it automatically.
