# MinerU skill

Adapted from the agent skill in [opendatalab/MinerU](https://github.com/opendatalab/MinerU/blob/master/skills/mineru/SKILL.md) for the installed MinerU 4.2.3 CLI. It is licensed under the [MinerU Open Source License](LICENSE.md), Apache License 2.0 with additional terms.

Changes from upstream:

- Managed parse-server setup verifies models before downloading them and skips settings that are already active. `--output` checks and `parse_wait_timeout` recovery are added; both exist in the 4.2.3 CLI.
- Sandbox, upgrade, doclib-lock, libGL and config-permission guidance covers Linux and macOS as well as Windows, following MinerU's [FAQ](https://opendatalab.github.io/MinerU/faq/) and [`mineru server` reference](https://github.com/opendatalab/MinerU/blob/master/docs/next/cli/mineru-server.md).
- The server starts from the MinerU home folder, because 4.2.3's managed parse server writes `blobs/` and `.mineru-service.lock` into the folder it was started from.
- Hardware inspection and the startup-tier table use MinerU's official Linux/Windows/macOS rows and [tier documentation](https://opendatalab.github.io/MinerU/usage/tiers/).
- The page-range link points at the MinerU repository, and the recovery gate links to the hardware section that exists.

Install for Codex and Claude Code by linking `~/.agents/skills/mineru` to this folder and `~/.claude/skills/mineru` to that link. Update the copy when upgrading the MinerU CLI.
