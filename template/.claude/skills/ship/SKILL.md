---
name: ship
description: Verify, commit, push, and open (or prepare) the pull request for the current feature, fix, or change branch after one confirmation.
disable-model-invocation: true
---

## Project profile
```
!`cat .claude/workflow.conf`
```

## Context
- Branch: !`git branch --show-current`
- Status: !`git status --short`
- Recent commits: !`git log --oneline -8`

## Steps
1. Identify. From the branch name (feature/, fix/, change/) find the slug, its `_features/<slug>/feature.md`, and for fix/change the open change entry.
2. Guards. Stop if on DEFAULT_BRANCH (or main/master), if there is nothing to ship, or if the changes include secrets, .env files, tokens, passwords in connection strings, or local-only config files.
3. Verify. Run BUILD_CMD, TEST_CMD, and ARCH_TEST_CMD if set. On any failure, stop and show it. Check that no `TODO(dev)` and no new not-implemented stubs remain.
4. Docs. feature.md must have a filled Walkthrough (new features) or a completed change entry (fixes and changes), and a current Code map. If the Quiz log has nothing for a new feature, mention it once (don't block). Set status shipped (feature Status: live; entry status: shipped) and update `_features/INDEX.md`. If `_features/` is git-ignored in this project, these edits never enter the commit; that is expected.
5. Confirm. Show a one-paragraph summary, files changed grouped by area, and test results. AskUserQuestion: Ship it / Show full diff / Cancel.
6. On yes: commit the remaining changes using the convention in CLAUDE.md (default `<type>(<scope>): <description>`, present tense, subject under 72 characters) with trailers `Feature: <slug>` and one WORK_ITEM_LINK_SYNTAX line per linked work item. Never add AI attribution lines unless CLAUDE.md asks for them. Push (`git push -u origin <branch>` if no upstream, never force).
7. Pull request, by PR_MODE:
   - `gh`: `gh pr create --base <DEFAULT_BRANCH> --title "<subject>" --body-file <temp file>`. If a PR already exists (`gh pr view`), show its URL.
   - `gitlab`: `glab mr create --target-branch <DEFAULT_BRANCH> --title "<subject>" --description-file <temp file>` if `glab` is installed, otherwise fall back to `url`.
   - `azdo`: print `<REPO_WEB_URL>/pullrequestcreate?sourceRef=<branch>&targetRef=<DEFAULT_BRANCH>` with the title and body in a fenced block to paste. Ask for the PR number back.
   - `url`: print `<REPO_WEB_URL>` and the title and body to paste. Ask for the PR number back.
   - `none`: skip.
   PR body: summary, acceptance criteria or the change request, root cause for bugs, test results, `Feature doc: _features/<slug>/feature.md`, work item links, and a note that squash merge is recommended if the branch has wip commits.
8. Record the PR link or number in feature.md (header for features, the change entry for fixes) and INDEX.md. If the developer never supplies it, leave "PR: pending".
9. Report: commit, branch, PR link. If work items are tracked and none is linked, suggest `/pbi <slug>` or `/pbi <slug> C-00N`.

Never use --no-verify or --force. Never amend pushed commits. Never use the em dash character in commit messages or PR text.
