---
name: pstack-sharpen
description: "Make a task deeper, not bigger, then rewrite the prompt. Use for $pstack-sharpen."
disable-model-invocation: true
---

# pstack-sharpen

Launcher for the pstack `sharpen` skill (pstack 0.15.36) under T3 Code.

1. If you have not read it in this session, read `~/.agents/pstack-t3/docs/harness/t3-code.md`. It maps pstack's Cursor names to T3 Code tools, and its rules win over pstack's where they conflict.
2. Read `~/.agents/pstack-t3/skills/sharpen/SKILL.md` and follow it for this request, with the user's message as its input. Resolve the skill's relative paths against `~/.agents/pstack-t3/skills/sharpen/`.
