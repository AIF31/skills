# Git skills

Git maintenance skills for Codex and Claude Code.

| Skill | Invoke | Purpose |
| --- | --- | --- |
| [git-clean](git-clean/SKILL.md) | `$git-clean` (Codex), `/git-clean` (Claude) | Prune local branches and worktrees to the default branch plus open-PR branches, removing only work proven merged and clean. |

Each skill is explicit-only: `agents/openai.yaml` sets `allow_implicit_invocation: false` for Codex, and `disable-model-invocation: true` in the frontmatter does the same for Claude.

## Install

```sh
git/install.sh
```

The script links each skill into `~/.agents/skills` (read by Codex) and links `~/.claude/skills/<name>` to that entry, so both agents read this checkout. It refuses to replace an existing directory; move old copies aside first. Remove any legacy copy in `~/.codex/skills` so Codex does not load the skill twice. Restart agent sessions after installing.

Override destinations with `AGENTS_SKILLS_DIR` and `CLAUDE_SKILLS_DIR`.
