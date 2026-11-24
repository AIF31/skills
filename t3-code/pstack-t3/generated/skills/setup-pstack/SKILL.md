---
name: setup-pstack
description: Configure T3 provider, model, and reasoning effort per pstack role, including documentation and reciprocal independent reviews.
---

# Set up pstack for T3 Code

Read [the T3 adapter](~/.agents/pstack-t3/docs/harness/t3-code.md), then the current model rule at `~/.agents/pstack-models.md`. The adapter's Model policy defines role selection and precedence. This file configures that policy; it does not start implementation agents.

1. Detect providers and models with `orchestrator_capabilities`, once per thread. Use its search when the user names a model missing from the short list. Only providers with `canRunChildTask: true` are eligible. A model value consists of `<providerInstanceId>/<model> <effort>`; effort is an option, not part of the model ID. Validate the model's effort option and values.
2. Load every existing role and policy comment from `~/.agents/pstack-models.md`. On a re-run, preserve explicit models, efforts, documentation routing, review direction, panel lengths, and effort ceiling unless the user changes them. With no file, use `inherit-parent` and ask the user to choose panel entries. Show an available model from each enabled family as options; do not enroll another provider without the user's choice.
3. Ask for a preset if the user has not chosen one: `unlimited — max reasoning`, `large — xhigh reasoning`, `medium — high reasoning`, or `small — medium reasoning`. Explain that the preset supplies starting effort for unspecified roles. Explicit efforts override it. Never turn an explicit medium role into high just because the preset is called medium. Use the nearest supported effort at or below the chosen target; ask if no such value exists. Efforts above max require an explicit request.
4. Show every role, policy, and panel count. Confirm the complete mapping once; prior explicit choices remain authorized. Explain that cross-provider spawns are separate sessions with their own usage. `auto` and `inherit-parent` preserve the selected thread model and its settings. Lists run one agent per entry, except `arena cross-judge pool`, which selects one eligible judge.
5. Validate every explicit provider/model/effort against detected capabilities. Report an unavailable configured choice and ask for a replacement; preserve the choice until the user changes it. Do not silently switch models or drop panel seats. Write the whole rule to `~/.agents/pstack-models.md`, without frontmatter. Include `# budget: <preset> (<effort>)` and any user-chosen effort ceiling, adaptation rule, and explicit thread-model override. Keep these roles:

   - `worker default`
   - `feature, refactoring`
   - `bug-fix`
   - `perf-issue`
   - `hillclimb`
   - `judgment and prose`
   - `hardest tasks`
   - `documentation`
   - `how explorer`
   - `how explainer`
   - `why investigators`
   - `why synthesizer`
   - `reflect tooling`
   - `reflect judgment, divergent, synthesizer`
   - `arena runners`
   - `arena cross-judge pool`
   - `swarm workers`
   - `architect runners`
   - `interrogate reviewers`
   - `review of GPT work`
   - `review of Claude work`

   Drop a retired role only after showing it to the user. Preserve policy comments on re-runs. User-added roles require an accompanying selection rule in the adapter; a line alone does not make a role effective.
6. Report the path and choices. The rule takes effect when re-read; no restart is required for model-rule edits. The adapter reads it at session start; after editing it in the current session, re-read it immediately. Adding or changing launcher metadata may require **Restart agent session**.

For a project-specific setup, offer a verification skill only if the project lacks a way to exercise its real surface and that would help the task. Formal verification is optional and offered only for a concrete invariant. This personal model setup does not require either.
