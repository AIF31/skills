#!/usr/bin/env bash
# Link every skill in this directory into Codex (~/.agents/skills) and
# Claude Code (~/.claude/skills). Claude's link points at the Codex link,
# matching the layout of the other shared skills.
set -euo pipefail

src_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
agents_dir="${AGENTS_SKILLS_DIR:-$HOME/.agents/skills}"
claude_dir="${CLAUDE_SKILLS_DIR:-$HOME/.claude/skills}"

link() {
  local target="$1" dest="$2"
  if [ -L "$dest" ]; then
    ln -sfn "$target" "$dest"
  elif [ -e "$dest" ]; then
    echo "refusing to replace $dest: not a symlink; move it aside first" >&2
    return 1
  else
    ln -s "$target" "$dest"
  fi
  echo "$dest -> $target"
}

mkdir -p "$agents_dir" "$claude_dir"
for skill in "$src_dir"/*/; do
  skill="${skill%/}"
  [ -f "$skill/SKILL.md" ] || continue
  name="$(basename "$skill")"
  link "$skill" "$agents_dir/$name"
  link "$agents_dir/$name" "$claude_dir/$name"
  if [ -e "$HOME/.codex/skills/$name" ]; then
    echo "warning: $HOME/.codex/skills/$name also exists; Codex may load $name twice" >&2
  fi
done
