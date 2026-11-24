# pstack in T3 Code

pstack skills use Cursor names. In T3 Code, read this file once per session, then map each Cursor name in a skill with the tables below. `<pstack>` means `~/.agents/pstack-t3`, the folder that holds `skills/`, `agents/`, and `docs/`. In T3 Code this file replaces `docs/harness/claude-code.md`, including in Claude sessions. If a Cursor field has no row, drop it and say so. Never pass a field or value the tool schema rejects.

## Precedence

1. The user's instructions.
2. T3 Code's orchestration instructions, in your system prompt or in `<t3_code_orchestration_instructions>`. They own tool mechanics: when to use `delegate_task`, waiting and polling, threads, checkouts, PR links and watches.
3. This file.
4. The pstack skill. It owns the engineering method: playbooks, evidence, review separation, the reply.

When a pstack step conflicts with item 2, keep the step's intent, use T3's mechanics, and say so in one line. Examples: fix a small review finding yourself instead of delegating it, and wait for a delegate's wake instead of polling it.

Your harness: tools named `Agent` and `Skill` mean a Claude session. A tool named `spawn_agent` means a Codex session. Any other provider uses `delegate_task` for every subagent.

## Tools

| Cursor | T3 Code |
| --- | --- |
| `Task` | See Subagent routing. |
| `AskQuestion` | Claude: `AskUserQuestion`. Codex: `request_user_input_async` for missing preferences when offered; `request_user_input` only when its mode permits it. Otherwise ask in plain text in your reply. |
| Open a todolist | Claude: `TodoWrite` or `TaskCreate` when offered. Codex: `update_plan`. Otherwise keep the list in your reply and update it at each phase. |
| Run another pstack skill (`/name` or "the **name** skill") | `Read` `<pstack>/skills/<name>/SKILL.md` and follow it. Never start it through `Skill` or a `$` mention, because the provider lists only the `pstack-*` launchers. When you tell the user to type a skill, write `$pstack-<name>` if `<pstack>/MAPPING.md` lists that launcher, otherwise `$pstack-poteto-mode` with the request. |
| `Grep`, `Glob` | Your file-search tools, or `rg` through the shell. |

## Subagent routing

pstack spawns every subagent with `Task`. T3 Code has two paths. Pick one per spawn.

| The spawn needs | Use |
| --- | --- |
| Your provider and a model it offers, no user-requested settings beyond the parent, no checkout of its own, and its result before you continue this turn | A native subagent. Claude: `Agent` with `run_in_background: false`. Codex: `spawn_agent`, then wait. Several spawns in one message run in parallel. |
| Its own checkout. This covers `environment: "cloud"`, arena and architect candidates, interrogate adversaries, swarm workers that write or check out a SHA, PR owners, and verifiers | `delegate_task` with `isolation: "worktree"`. |
| Custom user-chosen settings (including per-role effort), or a model on another provider such as a cross-family reviewer | `delegate_task` with `target` from `orchestrator_capabilities`. |
| To keep running while you do other work | `delegate_task` with `mode: "async"`, the default. |

T3 rules for `delegate_task`. They repeat T3's own instructions because pstack steps pull the other way.

- Call `orchestrator_capabilities` once per thread, before the first `delegate_task`. Use only providers, models, and option values it lists.
- The child receives only `task`. It gets no parent history and no skill. Start every brief with the delegate header below.
- Never poll. After an async spawn, follow the result's `next`, then do other work or end your turn. T3 wakes you when the child finishes. Read the result with `task_status` only after the wake.
- `workState: "result_available"` means a report exists, not that the work is correct. `waiting_for_children` is not done. Verify the report per the playbook.
- Set `clientRequestId` to `pstack-<slug>-<role>-<n>-r<round>`. Reuse it only to retry the same spawn. A new round gets a new id.
- Stop a delegate you replace or no longer need with `task_cancel`.
- Never make a child's checkout in the shell or in the brief. Never use `t3_thread_launch` or `create_threads` for a pstack subagent, because they make top-level threads.
- A named provider or model that is unavailable is an error to report. It is not a reason to switch.
- `runtimeMode` stays unset unless the user asks for a supervised child. Narrow modes pause for human approval. They do not make a child read-only.

### Delegate header

Start every brief, native or delegated, with these lines, then the pstack brief:

```
You are a pstack delegate running under T3 Code.
Before any work, read ~/.agents/pstack-t3/docs/harness/t3-code.md, then ~/.agents/pstack-t3/agents/poteto-agent.md, then every skill file this brief names.
Do the work yourself. Start no subagents unless this brief says so.
Goal: <the user's goal, restated>.
Base commit: <full SHA>. Branch: <name, or none>.
You may write: <paths>. You must not: <actions>.
Done means: <command and its expected output, or the artifact>.
End with: Status PASS, ISSUES, or BLOCKED. Then the source commit, your commit SHA and branch or none, each command you ran with its output, and the gaps.
```

For a spawn whose pstack skill sets its own subagent type (`how`, `why`, `interrogate`, `swarm`, `reflect`), replace the `poteto-agent.md` path with that skill's prompt file or `SKILL.md`. A read-only spawn says "Do not edit files" in place of the write line.

## Subagent fields

| Cursor | T3 Code |
| --- | --- |
| `subagent_type: generalPurpose` | Claude native `general-purpose`, Codex's default native agent, or `delegate_task` with the `role` that fits: `implementation`, `research`, `review`, `design`, `test`, or `general`. |
| `poteto-agent`, `comment-sicko` | No registered agent type exists. Route the spawn as above and name `<pstack>/agents/poteto-agent.md` or `<pstack>/agents/comment-sicko.md` in the delegate header. poteto-mode's "this file's absolute path" is `<pstack>/skills/poteto-mode/SKILL.md`. |
| `readonly: true` | Claude native `Explore`, or any route with "Do not edit files" in the brief. Run `git status` afterward. Do not use `runtimeMode` or `interactionMode: "plan"` for this. A plan-mode child returns a plan instead of running probes. |
| `readonly: false` | The default. Omit. |
| `environment: "cloud"` | `delegate_task` with `isolation: "worktree"`. The worktree starts from your current commit, and uncommitted edits stay out. Commit first, or name the SHA the worker must check out. See Moving commits. |
| `environment: "local"` | A native subagent, or `delegate_task` with `isolation: "shared"`, the default. Shared means your checkout. Never give two writers one checkout. |
| `cloud_base_branch: <b>` | Tell the worker to run `git checkout <b>` in its worktree first. |
| `run_in_background: true` | `delegate_task` with `mode: "async"`. A native Claude `Agent` always runs with `run_in_background: false` in T3 Code. |
| `resume` | A new spawn with consolidated scope: the original brief, every later directive, and the prior report, branch, and SHA. Use `t3_thread_send` to a child only in pstack's strict reuse cases, such as its uncommitted changes or a process it still runs. Never use it for a review or re-check round. |
| `file_attachments` | List absolute paths in the brief. A worktree child sees committed repository files and any absolute path on this machine. |

## Moving commits

On one machine, T3 worktrees are `git worktree` checkouts of one repository. They share objects and branches, so a commit a child makes is visible from your checkout by SHA or branch.

- Before you use a child's SHA, run `git cat-file -e <sha>^{commit}`. If that fails, the child is on another machine or did not commit. Start a new spawn that pushes the branch.
- Read candidates with `git show`, `git diff <base>..<sha>`, and the paths in `git worktree list`. Take a winner onto your branch with `git cherry-pick` or `git merge --ff-only`, then verify it there. A child never merges into your branch.
- A reviewer or verifier gets a committed SHA, never a dirty tree. For interrogate's "copy the scope's uncommitted changes into each worktree", run `sha=$(git stash create)` and `git update-ref refs/pstack/<slug> "$sha"` in your checkout. That records tracked changes without touching your tree. Commit untracked files first, or `git add` them before `git stash create`. Then tell each adversary to run `git checkout --detach <sha>` in its worktree.
- A child on another environment (`environmentId`) shares nothing with you. It must push a branch, and you fetch it.

## Models

Read `~/.agents/pstack-models.md` immediately after this adapter, once per session and again after editing the rule. Nothing loads it automatically. T3 routes by provider instance, model ID, and options from `orchestrator_capabilities`; a Cursor slug is not a valid T3 target.

### Model policy

Resolve every spawn in this order:

1. An explicit user model instruction wins. "Follow this thread's model" means inherit the actual parent provider, model, and options. This affects the requested work; the main conversation keeps its selected model. Preserve review independence: a request to inherit a reviewer from the author's family needs clarification.
2. For an independent review, select `review of GPT work` or `review of Claude work` from the artifact author's recorded family. Terra and Sol are GPT; Opus is Claude. Use a fresh agent that did not produce the artifact. Pass author provenance in the brief. If authorship is mixed or unknown, report that and ask for a reviewer choice when the saved rule cannot resolve it. Ordinary reviews use one reviewer. Named panel skills use their full configured list instead; make clear which seats are from the author's family.
3. Documentation and explanatory writing select `documentation`. Code edits, diagnostic investigation, and design decisions retain their task roles even if their output contains prose.
4. Otherwise use the task's exact role line. A missing role uses `worker default`; a missing file/default uses `inherit-parent`. Panel roles without saved lists need a user choice before cross-provider fan-out; do not invent seats.

Role labels are those listed in the installed setup skill, including `worker default`, `documentation`, `review of GPT work`, and `review of Claude work`. When a plain documentation task is delegated through a broad prose role, the documentation override takes precedence. `how explainer` is explanatory writing. `why synthesizer` and reflect judgment/synthesis are investigation and judgment.

A rule entry is `<providerInstanceId>/<model> <effort>`, or `inherit-parent` / `auto`. Aliases mean inherit the parent provider, model, and options. Panel lists contain one entry per seat; `arena cross-judge pool` is a preference list from which one eligible judge is selected. Do not add or duplicate seats without a user request. Swarm worker counts follow the task's scope and invoked skill.

Validate explicit choices against capabilities before spawning. On `delegate_task`, put provider and model in `target.providerInstanceId` and `target.model`, and effort in `target.options` using the option ID the model lists (`reasoningEffort` for Codex, `effort` for Claude). User-chosen per-role settings require `delegate_task`, even on your own provider. Use the native tool only when all Subagent routing conditions hold. An unavailable configured model or rejected target is reported; ask for a replacement instead of switching provider, model, or dropping a seat. An unsupported adjusted effort returns to the validated starting effort if available; otherwise report the block.

The `# budget` comment is a preset for unspecified efforts, not a command to overwrite explicit role efforts. Follow the saved adaptation and ceiling comments. For this user's policy, roles may adapt to task difficulty up to high; ask before exceeding high. Keep the chosen model and panel count while adapting. Inherited aliases keep the parent's settings unless the user requests an effort override, which then requires an explicit validated delegate target. Standard speed is the default. Set priority/fast options only for a user-requested or urgent run and only when listed in capabilities.

Families go by T3 driver: `codex` is GPT and `claudeAgent` is Claude. Other enabled drivers require a detected family, never a guessed name prefix. Arena's cross-judge is distinct from ordinary artifact review: it must be from a family other than the coordinator's (parent's), per Arena's judging rule. Try configured eligible pool entries in order. If no eligible entry is available, report the limitation and ask rather than silently inventing a replacement. The judge assesses all candidates, which may themselves span families.

### Legacy terms

| Cursor | T3 Code |
| --- | --- |
| The `pstack-models.mdc` rule, `~/.cursor/rules/pstack-models.mdc`, `.cursor/rules/` | `~/.agents/pstack-models.md`, read under Model policy. |
| `claude-`, `grok-`, `gpt-` Cursor default slugs | Resolve the configured role. With no saved choice, use the worker default or `inherit-parent`; legacy slugs never choose a provider. |
| `inherit-parent`, `auto` | Inherit provider, model, and options, subject to the review-independence rule. |
| A `-fast` slug | Use a detected speed option only for an authorized urgency override. |
| Native Claude `Agent` model field | Only native aliases supported by that tool; use delegation for explicit user-chosen model/effort settings. |

### setup-pstack

Follow the installed T3 setup skill. It detects real targets, preserves explicit role efforts and policy comments, confirms a complete mapping, and writes `~/.agents/pstack-models.md` without frontmatter. Re-read the rule immediately after an edit. Never put role lines in `AGENTS.md` or `CLAUDE.md`. Cross-provider roles are separate sessions with their own usage. A model-rule change needs no restart; newly installed launcher metadata may require one.

## PRs and waiting

| Cursor | T3 Code |
| --- | --- |
| A built-in PR tool | None exists. Use `gh`, or Origin per the playbook. After you create or push to a PR, call `link_pull_request` with its full URL as your next call, once per PR and stack layer. |
| `scripts/watch-pr/watch-pr` | `watch-pr --status-only` is fine for one status pass. For anything that waits (the bare command, `drive`, `background`, `--queued-stack`), call `watch_pull_request` and end your turn. T3 wakes you on failed checks, passed required checks, new comments or reviews, and conflicts. |
| `gh pr checks --watch`, `origin pr checks --watch` | `watch_pull_request`. |
| Cursor's `/loop` | A delegate's completion and `watch_pull_request` wake you, so event waits need no loop. To keep a goal alive across turns, ask the user to send `/goal <predicate>`, which Claude and Codex support in T3 Code. For a timed audit in a long autonomous program the user granted, use `schedule_task` with an interval and report its next run time. Never wait on a PR or a delegate with `sleep`, Monitor, or ScheduleWakeup. |
| An Autopilot-full or Autopilot-stack owner that babysits its PR | T3 children never watch PRs, even when the brief says babysit. An owner builds, opens and links its PR, and ends with the line `PR <full URL>, head <SHA>, checks and reviews <state>`. You, the root, call `watch_pull_request` for each PR. On each wake, spawn a fresh owner round with the wake's findings. Merges happen in the root per Shipping, after a verifier that did not write the code passes the current head. |
| Ending a babysit | Call `unwatch_pull_request` on every PR you watch before you hand back. |

## Worktrees

| Cursor | T3 Code |
| --- | --- |
| `scripts/worktree-audit.sh`, "the pinned and active chats", the sidebar | T3 Code creates and owns worktrees for threads and `delegate_task` children. The audit's buckets are advice. The in-use set comes from `t3_worktree_list` and `t3_thread_list`: a worktree bound to a thread that is not archived or deleted is in use, as is any worktree of a running delegate. Never remove one of those. Hand the user the list and let them archive the thread in T3 first. |
| `.cursor/worktrees/<repo>/` | T3's worktree folder, such as `~/.t3/worktrees/<project>/`. `git worktree list` shows every path. |
| `~/Library/Application Support/Cursor` caches | Not applicable. Never clear `~/.t3/userdata`. |

## Verification surfaces

| Cursor | T3 Code |
| --- | --- |
| "the matching control skill", `control-ui` or `control-cli` from `cursor-team-kit` | Use the project's own driver first: a `verify-*` skill, its end-to-end or Playwright suite, or a real CLI run. Use T3's `preview_*` browser tools only when the user's request asks for browser work or names a page. For iOS or Android, use the `device_*` tools per T3's device rules. If no driver reaches the surface, write `Skipped in T3 Code: <step>. <reason>.` and report the result as INCONCLUSIVE, never as a pass. |
| `deslop` from `cursor-team-kit` | Not available. Write `Skipped in T3 Code: /deslop. cursor-team-kit is not installed.` Still run `<pstack>/skills/no-comments/SKILL.md`. |
| `create-skill`, Cursor's built-in skill-authoring skill | Claude: the `writing-for-agents` or `skill-creator` skill when the session lists it. Otherwise follow the Agent Skills format: a folder whose `SKILL.md` frontmatter has `name` equal to the folder name and a `description`. |

## Paths

| Cursor | T3 Code |
| --- | --- |
| `.cursor/skills/`, `~/.cursor/skills/` | Project: `.agents/skills/<name>/`, read by Codex, plus a symlink at `.claude/skills/<name>` for Claude. User: `~/.agents/skills/` and `~/.claude/skills/`. After adding a skill, tell the user to run **Restart agent session**. |
| `~/.cursor/plugins/`, `.cursor-plugin/plugin.json` | `<pstack>`. The version is in `<pstack>/plugin.json`, and the upstream commit is in `<pstack>/SOURCE.json`. A delegate looking for `poteto-mode` reads `<pstack>/skills/poteto-mode/SKILL.md`. |
| `.cursor/rules/*.mdc`, always-applied rules | `AGENTS.md`, plus `CLAUDE.md` for Claude. The model rule is the exception. See Models. |
| `https://github.com/cursor/plugins/blob/main/pstack/<path>` | `<pstack>/<path>` when that file exists. Read the local copy. Give the user the URL when they need a link. |
| Transcripts in `~/.cursor/projects/<slug>/agent-transcripts/` | Prefer T3 threads. Call `t3_thread_read` with a small `limit` on a thread id or link, and `t3_thread_search` to find one. Raw logs: Claude in `~/.claude/projects/<slug>/`, where the slug is the workspace path with each `/` and `.` changed to `-`. Codex in `~/.codex/sessions/`. Read only this workspace's sessions. |
| The root agent's store, the Project tracker (`notes.md`), the Project store | `$(git rev-parse --git-common-dir)/pstack/<slug>/`. Every local worktree of the repository sees it, and nothing commits it. Name the absolute path in every brief. |

## Cursor-only features

Claude Code and Codex in T3 have no Cursor Automations, Bugbot, Cursor cloud agents, or custom modes. When a step needs one, put one line in your reply, `Skipped in T3 Code: <step>. <reason>.`, then go on to the next step. Do not stop, ask, or retry. When a later step needs what the skipped step made, leave a placeholder and name it in the line.

| Cursor | T3 Code |
| --- | --- |
| Cursor Automations: routines, `update_state` calls, `api2.cursor.sh/automations` webhooks, routine wakes | Skip with the line. A scheduled or webhook-triggered run the user asks for is `schedule_task`. |
| `SendToUser` secret requests | `request_secret`. Pass its `secretRef` to a T3 tool, or use `delivery: "file"` for a shell command. |
| Bugbot | Bugbot comments on a GitHub PR are ordinary review threads, so triage them with the step's forge command. Skip a step that starts, waits for, or configures Bugbot when the PR has no Bugbot check or comment. |
| Cursor cloud agents | `delegate_task` with `isolation: "worktree"`. A machine the user names: its `environmentId` from `t3_environment_links`. Skip a step that needs the cloud agent itself, such as its dashboard. |
| Custom modes, which keep `/poteto-mode` on across turns | None. The user mentions `$pstack-poteto-mode` with each task. |
