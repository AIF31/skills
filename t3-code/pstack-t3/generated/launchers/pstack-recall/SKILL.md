---
name: pstack-recall
description: "Reconstruct your recent working context from your own chat history, live state, and the shared record (user reports, prior fixes, incidents), then hand back a tight current-state brief. Use for 'recall my work on X', 'catch me up', 'what have I been working on', 'where did I leave off', before starting or resuming work."
disable-model-invocation: true
---

# pstack-recall

Launcher for the pstack `recall` skill (pstack 0.15.36) under T3 Code.

1. If you have not read it in this session, read `~/.agents/pstack-t3/docs/harness/t3-code.md`. It maps pstack's Cursor names to T3 Code tools, and its rules win over pstack's where they conflict.
2. Read `~/.agents/pstack-t3/skills/recall/SKILL.md` and follow it for this request, with the user's message as its input. Resolve the skill's relative paths against `~/.agents/pstack-t3/skills/recall/`.
