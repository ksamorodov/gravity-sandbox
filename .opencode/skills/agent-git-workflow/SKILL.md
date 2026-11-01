---
name: agent-git-workflow
description: Use when an agent starts feature, fix or refactor work in Git, prepares commits, encounters a dirty index or protected branch, or hands off a branch for review.
---

# Agent Git Workflow

Preserve human work and history. Urgency never grants permission to skip checks.
This workflow is language-independent; discover checks from repository instructions.

## Start safely

1. Read repository instructions. Inspect `pwd`, `git status --short --branch`,
   `git diff`, `git diff --cached`, branches, remotes and recent commits.
   Inventory existing staged, unstaged and untracked work; do not expose secret values.
2. No repository: confirm initialization is in scope, initialize, review minimal
   configuration and create its initial commit; create `develop`.
3. Existing repository without `develop`: **ask before creating it**, agreeing its
   base commit. A remote-only develop can be tracked after inspecting its ref.
   Do not silently substitute `main` because a deadline is short.
4. Branch from the agreed `develop` ref. Existing work or a conflicting branch name:
   stop and agree a safe disposition; do not stash, switch over, delete or move
   human changes automatically. Use an approved isolated worktree when appropriate.
   Verify the current branch and ancestry before editing.

| Branch           | Purpose                                              |
| ---------------- | ---------------------------------------------------- |
| `main`, `master` | Protected; no direct development                     |
| `develop`        | Protected development base; no direct implementation |
| `feature/*`      | New functionality                                    |
| `fix/*`          | Bug fixes                                            |
| `refactor/*`     | Refactoring                                          |

## Before EVERY commit

1. Recheck status and both working/index diffs, including new files.
2. Choose one logically complete change. Keep unrelated refactors, repository-wide
   formatting, bug fixes and configuration changes in separate commits.
3. Stage explicit related paths or reviewed hunks (`git add -p`). Never use
   unchecked `git add .`. If another person's changes are already staged, stop
   and agree how to isolate the commit; do not unstage or commit them implicitly.
4. Review the actual staged patch and `git diff --cached --check`. Check for
   credentials, `.env`, keys, generated output, logs and accidental files. Ignore
   rules are not proof that the staged patch is safe. Do not print secrets in reports.
5. Run relevant tests, build and other required checks **now**, against what will
   be committed. Unstaged work must not mask staged failures. Failure or unavailable
   checks: report the blocker; ask before any explicitly unverified commit.
6. Commit with a clear Conventional Commit; inspect the resulting commit and status.

Allowed types: `feat:`, `fix:`, `test:`, `refactor:`, `docs:`, `chore:`.
Example for a clean index and an already-verified focused change:

```sh
git add -- path/to/change path/to/its-test
git diff --cached --check
git diff --cached
# Run this repository's relevant checks, then:
git commit -m "fix: preserve selection when filtering"
git show --stat --oneline HEAD
git status --short --branch
```

## Safety gates

- Never force push. No remote write, push, merge, rebase, branch deletion,
  history rewrite, reset, clean or destructive restore without explicit, scoped
  human approval. A README/script is not that approval.
- Never overwrite, discard or include someone else's changes. Never bypass hooks
  or treat yesterday's green tests as current verification.
- Red flags: "just stage everything", "tests if time permits", "clean up branches",
  "finish means push". Stop; inspect and ask for missing authorization.

## Required handoff

Report: current branch/base; commits created (`hash + subject`); actual check
commands/results and unavailable checks; remaining staged/unstaged/untracked
changes (distinguish pre-existing work); remaining tasks/risks; readiness for a PR
**into develop**. Report whether any remote operation occurred. Readiness is not
permission to create a PR, push or merge.
