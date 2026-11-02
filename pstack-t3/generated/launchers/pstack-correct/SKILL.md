---
name: pstack-correct
description: "Find the mistakes agents keep repeating in this repo and make each one impossible. Try architecture first, then types, then a lint whose error names the fix, then a test, and write docs last. Prove each check fails on a real past mistake. Repeat this each time the operator corrects you. Use for $pstack-correct."
disable-model-invocation: true
---

# pstack-correct

Launcher for the pstack `correct` skill (pstack 0.15.36) under T3 Code.

1. If you have not read it in this session, read `~/.agents/pstack-t3/docs/harness/t3-code.md`. It maps pstack's Cursor names to T3 Code tools, and its rules win over pstack's where they conflict.
2. Read `~/.agents/pstack-t3/skills/correct/SKILL.md` and follow it for this request, with the user's message as its input. Resolve the skill's relative paths against `~/.agents/pstack-t3/skills/correct/`.
