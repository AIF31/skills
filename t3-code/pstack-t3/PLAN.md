# Plan: pstack in T3 Code

Status: v2, implemented. v1 and the review that changed it are in the revision log at the end.

## Goal

Run pstack's playbooks and skills from T3 Code sessions on Claude and Codex, with T3's V2 orchestration doing the delegation. pstack keeps the engineering method. T3 keeps the mechanics. No change to T3 Code itself.

## Verified facts

Checked on 2026-10-31 against pstack `4dd1d05` (0.15.36), t3code `ceb06de`, and the live T3 server this session runs in.

| Claim | Source | Result |
| --- | --- | --- |
| pstack ships a harness-adapter mechanism: one mapping doc plus a generator that writes a per-harness tree | `pstack/docs/harness/claude-code.md`, `scripts/generate-pstack-harness-trees.mjs` | True. The handoff missed this. It is the basis of v2. |
| The generator checks that the adapter covers every Cursor name the skills use | upstream `TERMS` and the "adapter has no row" check | True. pstack-t3 reuses the same check. |
| 57 of 58 skills are `disable-model-invocation: true` | frontmatter scan | True. Only `setup-pstack` is model-invocable. |
| `delegate_task` has `isolation: "shared" \| "worktree"`, `target.options`, `clientRequestId`, `mode` | live tool schema | True. `runtimeMode` also has `auto`, which the handoff left out. `target.options` takes an object or an `{id, value}` array. |
| Worktree children start from the parent commit and do not see uncommitted edits | live schema description | True. |
| T3 worktrees are `git worktree` checkouts of one repository | `apps/server/src/vcs/GitVcsDriverCore.ts` runs `git worktree add` | True. Local children share objects and branches, so SHAs move between them with no push. |
| Native Claude `Agent` must run with `run_in_background: false` under T3 | `orchestrationInstructions.ts` | True. pstack says `run_in_background: true`, so the adapter remaps it. |
| T3 children never watch PRs, and PR waits never poll | `runtimeInstructions.ts` | True. pstack's `watch-pr` polls and its autopilot owners babysit, so the adapter remaps both. |
| Claude in T3 reads `~/.claude/skills` and `.claude/skills` | `docs/user/providers-claude.md` | True. |
| Codex reads `~/.agents/skills` | Codex `skills/list` on this machine | Verified after install. See Verification. |
| Available child providers here: `claudeAgent` and `codex` | `orchestrator_capabilities` | True. Cursor, Grok, OpenCode, and others are disabled. pstack's Grok defaults cannot run. |

## Design

### D1. Generate a T3 harness tree. Do not rewrite pstack.

`scripts/build.mjs` reads an upstream checkout and writes `~/.agents/pstack-t3/`: every skill, agent, and guide file unchanged, plus `docs/harness/t3-code.md`. Each `SKILL.md` that uses a Cursor name gets one line after its H1 that points at the adapter, the same edit upstream makes for Claude Code. An upstream update is a rebuild. No playbook text forks.

Rejected: the handoff's hand-written `engineering-mode` skill with five translated playbooks. It forks 23 playbooks' worth of method into a second copy that drifts, and pstack already solved per-harness adaptation.

### D2. Register thin `pstack-*` launchers, not the skills.

The tree lives outside every skill folder, so providers do not list its 58 skills. The generator writes one launcher per skill in the README's "all skills" table, 32 in all. Each launcher has the upstream description and manual-only flag, reads the adapter, then reads the real `SKILL.md` by absolute path. Launchers link into `~/.agents/skills/` for Codex and `~/.claude/skills/` for Claude, through the user's existing `.claude -> .agents` symlink convention.

Why the prefix: `tdd` and `teach` already exist in this user's skills, and Claude lets the config-directory copy win on a name clash. Why absolute paths: poteto-mode resolves siblings as `../<name>/`, which breaks once a skill folder is reached through a symlink. Why not expose principles: pstack reads them by path, never by name.

`automate-me` and `make-bot-ui` get no launcher. Both build Cursor Automations.

### D3. One adapter, with an explicit precedence.

User, then T3's orchestration instructions, then the adapter, then pstack. T3 wins on mechanics. pstack wins on method. The adapter repeats the T3 rules that pstack steps pull against, so a model reading only the skill still sees them.

### D4. Subagent routing.

| The spawn needs | Route |
| --- | --- |
| Same provider, no own checkout, result this turn | Native subagent (Claude `Agent` foreground, Codex `spawn_agent`) |
| Own checkout (`environment: "cloud"`, candidates, adversaries, owners, verifiers) | `delegate_task`, `isolation: "worktree"` |
| Another provider's model | `delegate_task` with `target` from capabilities |
| Runs while the parent works | `delegate_task`, `mode: "async"` |

Every brief starts with a delegate header, because a T3 child gets only its task: adapter path, `poteto-agent.md` path, goal, base SHA, write scope, done predicate, and the PASS / ISSUES / BLOCKED report shape.

### D5. Commits move by SHA.

Children commit in their worktrees, and the parent reads the SHA from the shared object store after `git cat-file -e`. Reviewers get a committed SHA. A dirty scope for interrogate becomes `git stash create` plus a `refs/pstack/<slug>` ref, so the parent tree stays untouched and no shell-made checkout is needed.

### D6. Models stay on the parent until the user chooses.

Cursor slugs in skills map to `inherit-parent`. Cross-provider seats come only from `~/.agents/pstack-models.md`, written by `$pstack-setup-pstack` from `orchestrator_capabilities` as `<providerInstanceId>/<model> <effort>`. This follows T3's "never switch unasked" and keeps paid cross-provider sessions opt-in. The file sits outside the tree so a rebuild never deletes it.

### D7. PRs and waits.

`gh` or Origin to create, then `link_pull_request`. `watch_pull_request` replaces every polling wait. Owners return the T3 PR line. The root watches and spawns a fresh owner round per wake. `/loop` maps to completion wakes, `watch_pull_request`, `/goal`, or `schedule_task`.

### D8. No T3 Code changes now.

The handoff's Phase 2 (a native workflow state layer) is not warranted. Every gap found so far closes with instructions on existing APIs. Revisit only with a recorded failure the adapter cannot fix.

## Files

| Path | Role |
| --- | --- |
| `adapter/t3-code.md` | The adapter source. `{{PSTACK}}` and `{{MODELS}}` are filled at build. |
| `scripts/build.mjs` | Generator, `--check` drift test, and `--link` installer. |
| `scripts/sync-upstream.sh` | Sparse-clones `cursor/plugins` into `.upstream/`. |
| `test/build.test.mjs` | Fixture tests, plus one real-upstream test when `PSTACK_UPSTREAM` is set. |
| `~/.agents/pstack-t3/` | Generated tree, including `MAPPING.md`, the per-skill and per-playbook map. |
| `~/.agents/skills/pstack-*`, `~/.claude/skills/pstack-*` | Launcher links. |
| `~/.agents/pstack-models.md` | Per-role models, written by `$pstack-setup-pstack`. |

## Verification

| Check | How | Expected |
| --- | --- | --- |
| Adapter covers every Cursor name | build's term check | No `FAIL` lines |
| Upstream drift | build compares upstream `TERMS` keys | Fails on a new upstream key |
| Generator behavior | `npm test` | All pass |
| Codex lists launchers | `codex app-server` `skills/list` | 32 `pstack-*` skills |
| Claude lists launchers | Claude init event | 32 `pstack-*` skills |
| Behavior | `$pstack-how` on a small question in a new T3 thread | Reads adapter, picks Investigation, no edits |

The behavior check and the full end-to-end bug-fix and review run from the handoff's test matrix spend model sessions, so they stay with the user. Suggested prompts are in the README.

## Out of scope

Cursor Automations, custom modes, `cursor-team-kit` (`deslop`, `control-ui`, `control-cli`), and changes to T3 Code.

## Revision log

v1 was the handoff's plan made concrete: a hand-written `engineering-mode` skill with five playbooks, installed as plain skill folders. A review against the sources changed it as follows.

| v1 | Finding | v2 |
| --- | --- | --- |
| Hand-port five playbooks | pstack already has a harness-adapter pattern with a coverage check. A port forks the method. | D1, generated tree plus adapter |
| Register all skills under upstream names | `tdd` and `teach` clash with existing user skills. 58 entries flood the `$` menu. | D2, 32 prefixed launchers |
| Symlink upstream skill folders directly | `../<name>/SKILL.md` resolves against the symlink's folder, not the tree | Absolute paths in launchers and the adapter line |
| Map Grok-default roles to Codex | A silent provider switch breaks T3's "never switch unasked" and spends a paid session | D6, inherit until setup |
| Keep the model rule in the generated tree | A rebuild deletes the tree | Rule file outside it |
| Copy dirty changes into reviewer worktrees in the shell | T3 forbids shell-made child checkouts | D5, `git stash create` plus a ref |
| Autopilot owners babysit their PRs | T3 children never watch | D7, the root watches |
| Worktree cleanup audits by age and merge state | T3 owns thread and delegate worktrees | Adapter Worktrees section |
| Rebuild with an unconditional `rm -rf` | Could delete a folder the user owns | Marker check before replace |
