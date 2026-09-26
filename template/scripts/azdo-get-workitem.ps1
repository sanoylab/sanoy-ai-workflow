<#
.SYNOPSIS
    Reads one Azure DevOps work item and prints it as JSON. Used by the
    /change Claude Code skill when a work item number is given.

.DESCRIPTION
    Resolves the Azure DevOps configuration exactly like azdo-create-pbi.ps1
    (AZDO_ORG_URL / AZDO_PROJECT / AZDO_PAT environment variables first, then
    the git-ignored .claude/azdo.local.json), fetches the work
    item and its most recent comments, strips HTML, and emits:

    {
      "Id", "Type", "State", "Title", "Description", "AcceptanceCriteria",
      "ReproSteps", "Tags", "Url", "Comments": [ { "Date", "Author", "Text" } ]
    }

    The PAT is never printed.

.PARAMETER Id
    The work item number.

.PARAMETER CommentCount
    How many of the newest comments to include (default 5).

.PARAMETER ApiVersion
    Azure DevOps REST API version (default: 7.0).

.EXAMPLE
    .\scripts\azdo-get-workitem.ps1 -Id 1342
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory=$true)]
    [int] $Id,

    [int] $CommentCount = 5,

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

if ($missing.Count -gt 0) {
    Write-Error "Azure DevOps config incomplete. Missing: $($missing -join ', '). Create the git-ignored .claude/azdo.local.json (OrgUrl, Project, Pat) or the AZDO_ORG_URL / AZDO_PROJECT / AZDO_PAT environment variables."
    exit 1
}

$orgUrl = $orgUrl.TrimEnd('/')

$bytes  = [Text.Encoding]::ASCII.GetBytes(":$pat")
$base64 = [Convert]::ToBase64String($bytes)
$headers = @{ Authorization = "Basic $base64" }

# ── Helper: HTML to plain text ───────────────────────────────────────
function ConvertTo-PlainText {
    param([string] $Html)
    if ([string]::IsNullOrWhiteSpace($Html)) { return "" }
    $t = $Html -replace '(?i)<br\s*/?>', "`n"
    $t = $t -replace '(?i)</(p|div|li|h[1-6]|tr)>', "`n"
    $t = $t -replace '(?i)<li[^>]*>', '- '
    $t = $t -replace '<[^>]+>', ''
    $t = [System.Net.WebUtility]::HtmlDecode($t)
    $t = $t -replace '\r', ''
    $t = $t -replace '[ \t]+\n', "`n"
    $t = $t -replace '\n{3,}', "`n`n"
    return $t.Trim()
}

# ── Fetch the work item ──────────────────────────────────────────────
$fields = @(
    'System.Id', 'System.WorkItemType', 'System.State', 'System.Title',
    'System.Description', 'Microsoft.VSTS.Common.DescriptionHtml',
    'Microsoft.VSTS.Common.AcceptanceCriteria', 'Microsoft.VSTS.TCM.ReproSteps',
    'System.Tags'
) -join ','
$uri = "$orgUrl/$project/_apis/wit/workitems/$Id`?fields=$fields&api-version=$ApiVersion"

try {
    $wi = Invoke-RestMethod -Method Get -Uri $uri -Headers $headers
}
catch {
    Write-Error "Failed to read work item #$Id`: $($_.Exception.Message)"
    if ($_.ErrorDetails.Message) { Write-Error $_.ErrorDetails.Message }
    exit 1
}

$f = $wi.fields
$description = $f.'System.Description'
if ([string]::IsNullOrWhiteSpace($description)) { $description = $f.'Microsoft.VSTS.Common.DescriptionHtml' }

# ── Fetch the newest comments (best effort) ──────────────────────────
$comments = @()
try {
    $cUri = "$orgUrl/$project/_apis/wit/workitems/$Id/comments?`$top=$CommentCount&order=desc&api-version=7.0-preview.3"
    $c = Invoke-RestMethod -Method Get -Uri $cUri -Headers $headers
    foreach ($item in @($c.comments)) {
        $comments += [PSCustomObject]@{
            Date   = $item.createdDate
            Author = $item.createdBy.displayName
            Text   = ConvertTo-PlainText $item.text
        }
    }
}
catch {
    Write-Warning "Could not read comments for #$Id`: $($_.Exception.Message)"
}

[PSCustomObject]@{
    Id                 = $wi.id
    Type               = $f.'System.WorkItemType'
    State              = $f.'System.State'
    Title              = $f.'System.Title'
    Description        = ConvertTo-PlainText $description
    AcceptanceCriteria = ConvertTo-PlainText $f.'Microsoft.VSTS.Common.AcceptanceCriteria'
    ReproSteps         = ConvertTo-PlainText $f.'Microsoft.VSTS.TCM.ReproSteps'
    Tags               = $f.'System.Tags'
    Url                = "$orgUrl/$project/_workitems/edit/$($wi.id)"
    Comments           = @($comments)
} | ConvertTo-Json -Depth 5
