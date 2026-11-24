# pstack for T3 Code

Personal T3 adaptation of pstack 0.15.36 for Codex and Claude. Includes 58 skills, 23 router playbooks, and 32 user-facing `pstack-*` launchers. Upstream engineering methods are preserved; T3 owns agent routing, worktrees, completion wakes, and PR watches.

## Contents

- `generated/`: the complete adapted skill bundle, including `skills/`, `agents/`, `docs/`, `launchers/`, `MAPPING.md`, upstream license, and provenance in `SOURCE.json`.
- `adapter/`: maintained T3 policy and setup/help templates.
- `scripts/` and `test/`: generator, upstream synchronization, and regression tests.
- `config/pstack-models.md`: the approved personal model profile.
- `CONFIGURATION.md`: decisions from the setup interview; `GLOSSARY.md` defines their terms.
- `PLAN.md`: the original integration design and its revision history.
- `REVIEW.md`: Sol-medium findings, resolution, routing scenarios, and validation limits.

The generated bundle is a checked-in snapshot of the installation at `~/.agents/pstack-t3`. Its runtime pointers name that installation on the author's machine, with the home directory written as `~`; the generator writes absolute paths. It is reference material in this repository, not a second installation. Rebuild using the steps below on another machine or when changing paths. Edit templates and the generator rather than generated files.

## Model policy

The live profile is `~/.agents/pstack-models.md`; the copy in `config/` records the approved baseline. Role settings are read by the adapter rather than automatically injected into every T3 conversation.

- General delegated work: GPT-6.1 Sol, medium effort.
- Bug fixes, performance work, hillclimb, and hardest tasks: Sol, high effort.
- Documentation and explanatory writing: GPT-6.1 Terra, medium effort.
- Arena, architect, and interrogate: two seats, Sol high and Claude Opus 5.5 high.
- Ordinary independent reviews: one fresh reviewer, Opus high for GPT-authored work and Sol high for Claude-authored work. Determine the author from artifact provenance, not the coordinator's model.
- Reasoning adapts to difficulty up to high; ask before exceeding high. Explicit per-role efforts override the general medium-budget/high-reasoning preset.
- Follow the thread model only when explicitly requested. Report unavailable configured choices and ask for a replacement.

Explicit per-task model instructions can override the standing review policy, as in the Sol-medium review requested before adding this package.

## Install or rebuild

Requires Node.js 20 or newer, Git, and T3 with the configured Codex/Claude models available.

```sh
cd t3-code/pstack-t3
npm run sync
npm test
npm run install-skills
npm run check
```

Synchronization fetches current upstream into the ignored `.upstream/` checkout; it can therefore advance beyond the bundled snapshot. The generator rejects newly unmapped upstream terms. Inspect the generated differences and run tests before installing an upstream update. For exact reconstruction, check out the upstream commit recorded in `generated/SOURCE.json` inside `.upstream/` before building.

To adopt the personal profile when no live profile exists:

```sh
mkdir -p ~/.agents
cp -n config/pstack-models.md ~/.agents/pstack-models.md
```

Use `$pstack-setup-pstack` for intentional changes to an existing profile. The setup skill preserves explicit efforts, review directions, panel counts, and policy comments. Model-rule edits apply when re-read. After installing or changing launcher metadata, use **Restart agent session** in T3.

The installer generates `~/.agents/pstack-t3` and keeps managed links in `~/.agents/skills` and `~/.claude/skills`. It refuses to replace unrelated entries. Override destinations with the generator's `--out`, `--models`, `--agents-skills`, and `--claude-skills` flags.

## Use

- `$pstack-poteto-mode <goal and completion check>` selects a rigorous playbook.
- `$pstack-how <question>` inspects code and explains it.
- `$pstack-interrogate <diff or commit>` runs the configured review panel.
- `$pstack-poteto-help <question>` explains the T3 integration.

The complete command and playbook list is in `generated/MAPPING.md`. Most launchers are explicit-only and are intentionally absent from automatic model discovery. Mention the launcher with each new task; T3 has no persistent pstack custom mode.

## Refresh the repository snapshot

After an approved change, rebuild and verify the live installation, then replace `generated/` with that generated tree and copy the approved live model profile into `config/`. Preserve source templates and the provenance file. Never copy `.git`, provider credentials, conversation logs, or the upstream checkout into this package.

## License

Upstream pstack is MIT, copyright Lauren Tan. Its license is preserved at `generated/LICENSE`. Provenance and the upstream commit are recorded in `generated/SOURCE.json`.
