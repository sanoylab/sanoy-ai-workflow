---
name: status
description: Show where the project stands: current branch and its feature, open change entries, features by status, unshipped work, and the suggested next command. Read-only.
---

## Context
- Branch: !`git branch --show-current`
- Uncommitted: !`git status --short | head -20`
- Recent commits: !`git log --oneline -8`
- Feature index:
```
!`cat _features/INDEX.md`
```

Report, in under 30 lines and without editing anything:
1. **Now**: the branch, the feature it belongs to (from the branch name and `_features/INDEX.md`), its status, and whether there are uncommitted changes.
2. **Open work**: change entries whose status is not shipped (grep `status: open|approved|in review` across `_features/*/feature.md`), features in `planned`, `building`, or `review`, and branches that were pushed but have no PR recorded (feature docs with "PR: pending").
3. **Health**: whether `.claude/workflow.conf` has BUILD_CMD and TEST_CMD, whether `CLAUDE.md` still has `<placeholders>`, and whether `.claude/.last-green-build` is newer than the last source change (if not, say the Stop hook will build on the next stop).
4. **Next**: the single most useful command right now (`/build <slug>`, `/ship`, `/change ...`, `/learn <slug>`, `/onboard`, or `/feature <idea>`), with one line on why.
