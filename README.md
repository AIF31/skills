# Skills

Created in [T3 Code](https://t3.codes).

## Skills

- [pstack for T3 Code](t3-code/pstack-t3/README.md): adapted skills, model profile, installer, and review record.
- [Git skills](git/README.md): `git-clean`, which prunes spent branches and worktrees, for Codex and Claude Code.
- [mineru](mineru/README.md): MinerU's document-reading skill (PDF, OCR, Office), vendored with its license so Codex and Claude Code share one copy.
- [manim-animations](manim-animations/SKILL.md) covers authoring, rendering, and checking Manim Community scenes. Install for Codex and Claude Code by linking `~/.agents/skills/manim-animations` to this folder and `~/.claude/skills/manim-animations` to that link.

## Maestría skills

Maestría’s `.claude/skills/` entries point to `.agents/skills/`. The two vault workflow entries load the canonical skills in `copilot/skills/`. Resolve their relative links in that vault layout, where the companion skills and `00-System/` files live. This repository keeps reference copies of the workflows.

- [vault-ingest](obsidian/vault-ingest/SKILL.md) imports selected material into Maestría. Source folder in Maestría is `copilot/skills/vault-ingest/`.
- [vault-connect](obsidian/vault-connect/SKILL.md) links checked sources to concept notes. Source folder in Maestría is `copilot/skills/vault-connect/`.
- [obsidian-cli](obsidian/obsidian-cli/SKILL.md) works with a running Obsidian app. It is adapted from Maestría’s `.agents/skills/obsidian-cli/`.
