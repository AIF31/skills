---
name: git-clean
description: Remove stale local branches and worktrees, keeping the default branch and anything with an open GitHub PR.
disable-model-invocation: true
---

Prune the current repository down to the default branch plus every branch with an open PR. Preserve unfinished work: remove a branch or worktree only once it is proven **spent**, with clean files and changes already integrated into the default branch by the checks below.

## 0. Synchronize before cleaning

Record the main checkout's current branch and locate worktrees with `git worktree list --porcelain`. Fetch and prune remote-tracking refs first:

```bash
git fetch --prune origin
gh repo view --json defaultBranchRef --jq '.defaultBranchRef.name'
```

Use that default branch name as `<default>` throughout; do not assume `main`.

If the default branch is checked out, run `git -C <default-worktree> status --porcelain=v1 --untracked-files=all`. If it prints anything, stop cleanup and report the files; do not auto-stash, reset, or discard them. Otherwise update that checkout:

```bash
git -C <default-worktree> pull --ff-only origin <default>
```

If the default branch is not checked out anywhere, update its local ref with `git fetch origin <default>:refs/heads/<default>` without force; leave the current checkout on its original branch.

Stop before any deletion if fetching, default-branch discovery, or updating fails. Require `git rev-parse <default>` and `git rev-parse origin/<default>` to match; a locally ahead or divergent default branch needs human resolution. Never merge, rebase, or force-reset to make cleanup proceed.

Done when the local default branch matches the fetched remote default branch.

## 1. Survey

```bash
git worktree list --porcelain
git branch -vv
git branch -r
gh pr list --state open --json number,headRefName -L 200
gh pr list --state all --json number,headRefName,state,headRefOid,baseRefName -L 200
```

If either PR query reaches its 200-result limit, retrieve the remaining pages before classifying candidates. A failed or incomplete query is not proof that no open PR exists.

The **keep set** is the default branch, the branch originally checked out in the main checkout, and every `headRefName` of an open PR. Keep the main checkout and all worktrees on keep-set branches. Every other local branch and linked worktree is a **candidate**, including detached worktrees.

Done when each candidate is listed with its branch (or detached SHA) and worktree path.

## 2. Prove each candidate spent

For each candidate worktree: `git -C <path> status --short` prints nothing, and `git -C <path> stash list` is empty.

For each candidate branch or detached SHA, it is spent when one of these succeeds:

- `git merge-base --is-ancestor <ref> <default>` exits 0 (all commits are already on the default branch).
- `git cherry <default> <ref>` prints no `+` lines **and** `git rev-list --merges <default>..<ref>` prints nothing (patch-equivalent rebase/cherry-pick merges; the merge check protects changes made only in merge commits).
- A MERGED PR targeting `<default>` has `headRefOid` equal to the ref's tip (covers squash merges, which `git cherry` misses).

Command errors or insufficient/shallow history are not proof; hold the candidate. A worktree is spent only if both its files/stashes and its branch or detached SHA pass. Hold its branch too when the worktree must be held.

Any candidate that fails moves to a **held** list with the reason (dirty files, N unique commits, no merged PR). Done when every candidate is marked spent or held.

## 3. Remove

Recheck the candidate tip, worktree status, and stashes immediately before removal; hold anything that changed since verification.

For each spent candidate:

1. `git worktree remove <path>` for each spent worktree, then `git worktree prune`.
2. `git branch -d <branch>` for each spent branch.
3. Force deletion is the user's to run. A spent branch that `-d` refuses (squash-merged, or merged after a remote rebase) goes on a **force list** with the rule that proved it spent and its tip SHA. Print one `git branch -D <branch> ...` command covering the force list for the user to run.

Remote branches are outward-facing: list any `origin/*` outside the keep set with its PR state and ask before running `git push origin --delete`.

Done when `git worktree list` and `git branch` show only the keep set, the held list, and the force list.

## 4. Report

Report the default branch synchronization result. List removed worktrees (path and branch), deleted branches, the held list with reasons, the force list with its proving rule and tip SHA followed by the printed `git branch -D` command, and any remote branches awaiting a decision. Note that T3 Code or other tools' threads bound to a removed worktree lose their checkout. Leave untracked files in the main checkout untouched and mention them.
