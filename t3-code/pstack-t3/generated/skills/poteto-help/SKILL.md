---
name: poteto-help
description: Explain the installed T3 pstack skills, model routing, review panels, and setup.
disable-model-invocation: true
---

# pstack help in T3 Code

Read [the T3 adapter](~/.agents/pstack-t3/docs/harness/t3-code.md) before answering. Answer help questions without starting a run. For an explicit request to do work, read the matching installed skill and carry out the task.

## Setup and models

The skills are installed as `pstack-*` launchers for Codex and Claude. Use `$pstack-setup-pstack` to configure `~/.agents/pstack-models.md`. Read that file to report the current choices; if it is absent, roles inherit the thread model. Model-rule edits apply on the next read. New or changed launcher metadata may need **Restart agent session**.

The worker default, role assignments, documentation override, and reciprocal review rules are defined by the adapter's Model policy. Reasoning preset and explicit role effort are distinct. Panels run one agent per entry; a judge pool selects one eligible judge. Another provider means another session with its own usage. To reduce usage, change model, effort, or panel count through setup.

## Start a task

Use `$pstack-poteto-mode <goal and completion check>` for a rigorous run. Mention it with each new task; T3 has no persistent pstack custom mode. The router selects a playbook and reads its supporting skills by path. For focused work:

- `$pstack-how`: inspect code and explain it.
- `$pstack-why`: investigate why it is shaped that way.
- `$pstack-arena`: generate and judge competing candidates.
- `$pstack-architect`: compare designs and implement the selected design; add "with checkpoint" for a design pause.
- `$pstack-interrogate`: review a diff with the configured panel.
- `$pstack-swarm`: run checks or workers over separate slices.
- `$pstack-reflect`: derive improvements from a completed session.

Read [MAPPING.md](~/.agents/pstack-t3/MAPPING.md) for the complete installed command list. Only recommend a launcher listed there. For another skill, give `$pstack-poteto-mode` with the desired task. Read the target skill before explaining its detailed behavior. Link local T3 files; upstream guide pages are background material with Cursor mechanics that require the adapter.

## T3 mechanics

Same-provider agents can use the native tool only when the T3 routing rules allow it. Custom settings, another provider, background work, or a separate checkout use `delegate_task`. T3 owns delegate worktrees. They are checkouts of a repository on the same machine unless another environment is explicitly selected.

Child agents receive an explicit brief with the goal, inputs, permitted writes, and completion checks. Their agent persona is loaded by file path; no registered `poteto-agent` type is required. Completion wakes and PR watches replace polling. The root owns PR watches and merges. A fresh agent reviews work it did not write, using the configured opposite-family reviewer.

## Troubleshooting

- Model choice seems unchanged: re-read `~/.agents/pstack-models.md` and inspect the actual delegate target and options.
- A command is absent from the picker: verify its launcher link, then restart the agent session. Most launchers are explicit-only and are intentionally absent from automatic model discovery.
- Workers overwrite each other: give writers separate T3-managed worktrees.
- A run claims success from a build alone: ask for the actual behavior check and evidence.
- A requested model is unavailable: report it and ask for a replacement; retain the saved choice.

Cursor Automations and built-in custom modes are not installed by this integration. A requested scheduled task uses T3 scheduling. Existing Bugbot comments can be reviewed through the forge; starting a missing Cursor feature is skipped with a clear reason. The project driver, CLI, or test harness verifies behavior; browser preview tools require a browser-work request.

Give a concise answer and one usable example prompt when helpful. Respect the user's existing authorization and T3's action boundaries.
