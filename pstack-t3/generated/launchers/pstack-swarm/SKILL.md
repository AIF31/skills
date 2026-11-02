---
name: pstack-swarm
description: "Fan out N parallel workers, drain them, and return one report. Use for $pstack-swarm, 'swarm this', or parallel coverage, races, gauntlets, and exploration."
disable-model-invocation: true
---

# pstack-swarm

Launcher for the pstack `swarm` skill (pstack 0.15.36) under T3 Code.

1. If you have not read it in this session, read `~/.agents/pstack-t3/docs/harness/t3-code.md`. It maps pstack's Cursor names to T3 Code tools, and its rules win over pstack's where they conflict.
2. Read `~/.agents/pstack-t3/skills/swarm/SKILL.md` and follow it for this request, with the user's message as its input. Resolve the skill's relative paths against `~/.agents/pstack-t3/skills/swarm/`.
