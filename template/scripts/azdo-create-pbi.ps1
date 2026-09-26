<#
.SYNOPSIS
    Creates one or more Azure DevOps Product Backlog Items from a JSON
    payload. No child tasks are created. Used by the /pbi skill of the AI dev workflow.

.DESCRIPTION
    Reads a JSON file describing one PBI or several PBIs (a complex spec/plan
    may be split into multiple independent PBIs), then posts each to the
    Azure DevOps Work Items REST API. No child Task work items are created.

    Authentication uses Basic auth with an empty username and the PAT as
    the password (Azure DevOps convention).

.PARAMETER PayloadPath
    Path to the JSON file describing one or more PBIs. No child tasks are
    created. Two shapes are accepted:

    Single PBI:
    {
      "title":             "Feature title (PBI Title)",
      "description":       "<HTML body for the PBI description>",
      "acceptanceCriteria":"<HTML body for the AC field>",
      "areaPath":          "Optional. Defaults to the project root.",
      "iterationPath":     "Optional. Defaults to the project root.",
      "tags":              "Optional; semicolon-separated string of tags"
    }

    Multiple PBIs (complex spec/plan split into independent PBIs):
    {
      "areaPath":      "Optional root-level default applied to every PBI",
      "iterationPath": "Optional root-level default applied to every PBI",
      "tags":          "Optional root-level default applied to every PBI",
      "pbis": [
        { "title": "...", "description": "...", "acceptanceCriteria": "...", "tags": "..." },
        { "title": "...", "description": "...", "acceptanceCriteria": "..." }
      ]
    }

    Every item may carry "workItemType": "Product Backlog Item" (default) or
    "Bug". For a Bug the description is also written to the Repro Steps field
    (Microsoft.VSTS.TCM.ReproSteps).

.PARAMETER CheckConfig
    Validate the Azure DevOps configuration and print only which values are
    missing (never the values), then exit. Exit code 0 when complete, 1 when
    something is missing.

.PARAMETER ApiVersion
    Azure DevOps REST API version (default: 7.0).

.EXAMPLE
    $env:AZDO_ORG_URL = "https://dev.azure.com/myorg"
    $env:AZDO_PROJECT = "ASeAP"
    $env:AZDO_PAT     = "..."
    .\scripts\azdo-create-pbi.ps1 -PayloadPath ".\pbi-payload.json"

.EXAMPLE
    .\scripts\azdo-create-pbi.ps1 -CheckConfig
#>
[CmdletBinding()]
param(
    [string] $PayloadPath,

    [switch] $CheckConfig,

    [string] $ApiVersion = "7.0"
)

$ErrorActionPreference = "Stop"

# ── Resolve config (env vars take precedence, then the local JSON file) ─────
$orgUrl  = $env:AZDO_ORG_URL
$project = $env:AZDO_PROJECT
$pat     = $env:AZDO_PAT

# Local config file (git-ignored): { "OrgUrl": "...", "Project": "...", "Pat": "..." }
# or the same three keys under an "AzureDevOps" object. Override the location with AZDO_CONFIG_PATH.
$repoRoot      = Split-Path -Parent $PSScriptRoot
$devConfigPath = if ($env:AZDO_CONFIG_PATH) { $env:AZDO_CONFIG_PATH } else { Join-Path $repoRoot '.claude/azdo.local.json' }

if (Test-Path $devConfigPath) {
    try {
        $devConfig = Get-Content $devConfigPath -Raw | ConvertFrom-Json
        $section = if ($devConfig.AzureDevOps) { $devConfig.AzureDevOps } else { $devConfig }
        if (-not $orgUrl  -and $section.OrgUrl)  { $orgUrl  = $section.OrgUrl }
        if (-not $project -and $section.Project) { $project = $section.Project }
        if (-not $pat     -and $section.Pat)     { $pat     = $section.Pat }
    }
    catch {
        Write-Warning "Could not parse $devConfigPath as JSON; falling back to env vars only."
    }
}

$missing = @()
if ([string]::IsNullOrWhiteSpace($orgUrl))  { $missing += 'OrgUrl'  }
if ([string]::IsNullOrWhiteSpace($project)) { $missing += 'Project' }
if ([string]::IsNullOrWhiteSpace($pat))     { $missing += 'Pat'     }

if ($CheckConfig) {
    if ($missing.Count -eq 0) {
        Write-Host "Azure DevOps config OK: OrgUrl, Project, and Pat are all set."
        exit 0
    }
    Write-Host "Azure DevOps config incomplete. Missing: $($missing -join ', ')."
    Write-Host "Set them in the AzureDevOps section of the git-ignored .claude/azdo.local.json (OrgUrl, Project, Pat) or as AZDO_ORG_URL / AZDO_PROJECT / AZDO_PAT environment variables."
    exit 1
}

if ([string]::IsNullOrWhiteSpace($PayloadPath)) {
    Write-Error "PayloadPath is required (or use -CheckConfig)."
    exit 1
}

if ($missing.Count -gt 0) {
    Write-Error @"
Azure DevOps credentials are not configured. Missing: $($missing -join ', ').

Create .claude/azdo.local.json (git-ignored) with:

  {
    "OrgUrl":  "https://dev.azure.com/yourorg",
    "Project": "YourProjectName",
    "Pat":     "<your-personal-access-token>"
  }

This file is gitignored, so the PAT stays local. Alternatively, set
AZDO_ORG_URL / AZDO_PROJECT / AZDO_PAT as environment variables.
"@
    exit 1
}

# Strip trailing slash
$orgUrl = $orgUrl.TrimEnd('/')

if (-not (Test-Path $PayloadPath)) {
    Write-Error "Payload file not found: $PayloadPath"
    exit 1
}

# Read as UTF-8 explicitly; PS 5.1 Get-Content -Raw defaults to ANSI and would
# mangle non-ASCII characters (em-dash, accented names) in the payload.
$payload = [IO.File]::ReadAllText((Resolve-Path $PayloadPath).ProviderPath) | ConvertFrom-Json

# Accept either a single PBI object ({ title, description, ... }) or a
# multi-PBI payload ({ "pbis": [ {...}, {...} ] }). A complex spec/plan may
# be split into several independent PBIs (no child tasks either way).
if ($payload.pbis) {
    $pbiItems = @($payload.pbis)
}
elseif (-not [string]::IsNullOrWhiteSpace($payload.title)) {
    $pbiItems = @($payload)
}
else {
    Write-Error "Payload must contain either a 'title' (single PBI) or a non-empty 'pbis' array."
    exit 1
}

if ($pbiItems.Count -eq 0) {
    Write-Error "Payload 'pbis' array is empty."
    exit 1
}

foreach ($p in $pbiItems) {
    if ([string]::IsNullOrWhiteSpace($p.title)) {
        Write-Error "Every PBI must have a non-empty 'title'."
        exit 1
    }
}

if ($pbiItems.Count -gt 5) {
    Write-Warning "Payload contains $($pbiItems.Count) PBIs; the /pbi convention is to keep this under 5. Creating them anyway."
}

# ── Build auth header ────────────────────────────────────────────────
$bytes  = [Text.Encoding]::ASCII.GetBytes(":$pat")
$base64 = [Convert]::ToBase64String($bytes)
$headers = @{
    Authorization = "Basic $base64"
}

# ── Helper: post a work item ─────────────────────────────────────────
function New-WorkItem {
    param(
        [string] $WorkItemType,
        [array]  $JsonPatch
    )
    $typeEncoded = [Uri]::EscapeDataString($WorkItemType)
    $uri = "$orgUrl/$project/_apis/wit/workitems/`$$typeEncoded`?api-version=$ApiVersion"
    # Windows PowerShell 5.1 doesn't have -AsArray on ConvertTo-Json. When the
    # input is a single-element array it gets unwrapped to an object; force
    # array brackets so the JSON-patch payload Azure DevOps expects is valid.
    $body = $JsonPatch | ConvertTo-Json -Depth 10
    if ($body -notmatch '^\s*\[') { $body = "[$body]" }
    # Send as UTF-8 *without* BOM. A string body in PS 5.1 is emitted with a
    # leading BOM, which Azure DevOps rejects with "You must pass a valid patch
    # document" because ﻿[ no longer parses as a JSON-patch array. Bytes
    # also preserve non-ASCII chars (em-dash, &) that ASCII/ANSI encoding mangles.
    $bytes = [Text.UTF8Encoding]::new($false).GetBytes($body)
    return Invoke-RestMethod -Method Post -Uri $uri -Headers $headers `
        -ContentType 'application/json-patch+json' -Body $bytes
}

# ── Helper: work item type for one item ("Product Backlog Item" or "Bug") ─
function Get-ItemType {
    param([object] $Pbi)
    $t = $Pbi.workItemType
    if ([string]::IsNullOrWhiteSpace($t)) { return 'Product Backlog Item' }
    if ($t -eq 'Bug' -or $t -eq 'Product Backlog Item') { return $t }
    Write-Error "Unsupported workItemType '$t' on '$($Pbi.title)'. Use 'Product Backlog Item' or 'Bug'."
    exit 1
}

# ── Helper: build the field patch for one PBI ────────────────────────
# Area / Iteration / Tags fall back to payload-root defaults when not set
# on the individual PBI item.
function Build-PbiPatch {
    param([object] $Pbi)

    $patch = @(
        @{ op = "add"; path = "/fields/System.Title"; value = $Pbi.title }
    )
    if ($Pbi.description) {
        # Some Azure DevOps process templates bind the work-item form's "Description" panel to
        # Microsoft.VSTS.Common.DescriptionHtml on PBIs (same as Tasks), not
        # System.Description. Write both so the rendered panel always has content,
        # regardless of which field the process template surfaces.
        $patch += @{ op = "add"; path = "/fields/System.Description"; value = $Pbi.description }
        $patch += @{ op = "add"; path = "/fields/Microsoft.VSTS.Common.DescriptionHtml"; value = $Pbi.description }
    }
    if ($Pbi.acceptanceCriteria) {
        $patch += @{ op = "add"; path = "/fields/Microsoft.VSTS.Common.AcceptanceCriteria"; value = $Pbi.acceptanceCriteria }
    }
    if ((Get-ItemType $Pbi) -eq 'Bug' -and $Pbi.description) {
        # Bugs show Repro Steps instead of (or next to) Description on the form.
        $patch += @{ op = "add"; path = "/fields/Microsoft.VSTS.TCM.ReproSteps"; value = $Pbi.description }
    }

    $area = if ($Pbi.areaPath) { $Pbi.areaPath } elseif ($payload.areaPath) { $payload.areaPath } else { $null }
    if ($area) { $patch += @{ op = "add"; path = "/fields/System.AreaPath"; value = $area } }

    $iteration = if ($Pbi.iterationPath) { $Pbi.iterationPath } elseif ($payload.iterationPath) { $payload.iterationPath } else { $null }
    if ($iteration) { $patch += @{ op = "add"; path = "/fields/System.IterationPath"; value = $iteration } }

    $tags = if ($Pbi.tags) { $Pbi.tags } elseif ($payload.tags) { $payload.tags } else { $null }
    if ($tags) { $patch += @{ op = "add"; path = "/fields/System.Tags"; value = $tags } }

    return $patch
}

# ── Create each PBI (no child tasks) ─────────────────────────────────
Write-Host "Creating $($pbiItems.Count) PBI(s)..." -ForegroundColor Cyan

$results = @()
foreach ($p in $pbiItems) {
    $type = Get-ItemType $p
    Write-Host "Creating $type`: $($p.title)" -ForegroundColor Cyan
    try {
        $pbi = New-WorkItem -WorkItemType $type -JsonPatch (Build-PbiPatch -Pbi $p)
    }
    catch {
        Write-Error "Failed to create $type '$($p.title)': $($_.Exception.Message)"
        if ($_.ErrorDetails.Message) { Write-Error $_.ErrorDetails.Message }
        exit 1
    }
    $webUrl = "$orgUrl/$project/_workitems/edit/$($pbi.id)"
    Write-Host "  ✓ $type #$($pbi.id) created" -ForegroundColor Green
    $results += [PSCustomObject]@{ PbiId = $pbi.id; PbiUrl = $webUrl; Title = $p.title; Type = $type }
}

# ── Output ───────────────────────────────────────────────────────────
Write-Host ""
Write-Host "Done. Created $($results.Count) work item(s)." -ForegroundColor Green
foreach ($r in $results) {
    Write-Host "$($r.Type) #$($r.PbiId) : $($r.PbiUrl)" -ForegroundColor Yellow
}

# Emit structured result so callers (e.g. the /pbi command) can parse it.
[PSCustomObject]@{
    Pbis = @($results)
} | ConvertTo-Json -Depth 5
