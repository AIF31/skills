---
name: pstack-arena
description: "Spawn N parallel candidates at the same task, pick a base, graft the strongest parts of the losers into it. Use for $pstack-arena, 'arena this', 'throw it in the arena', or when one attempt at a non-trivial artifact would lock in the wrong shape."
disable-model-invocation: true
---

# pstack-arena

Launcher for the pstack `arena` skill (pstack 0.15.36) under T3 Code.

1. If you have not read it in this session, read `~/.agents/pstack-t3/docs/harness/t3-code.md`. It maps pstack's Cursor names to T3 Code tools, and its rules win over pstack's where they conflict.
2. Read `~/.agents/pstack-t3/skills/arena/SKILL.md` and follow it for this request, with the user's message as its input. Resolve the skill's relative paths against `~/.agents/pstack-t3/skills/arena/`.
