# Personal T3 configuration

Approved in the design interview, including the final high-effort changes. The live model rule is `~/.agents/pstack-models.md`; read it for the current assignments.

## Agreed

- Configure models and fix generated T3 instructions through the generator/templates. Preserve upstream source for updates.
- General preset: medium budget (high reasoning). Explicit role efforts override the preset.
- Delegated work defaults to Codex GPT-6.1 Sol at medium effort. Follow the thread model when the user explicitly requests it. The main conversation retains its selected model.
- Independent reviews of Sol work use Claude Opus 5.5 at high effort; reviews of Opus work use Sol at high effort.
- Documentation uses GPT-6.1 Terra at medium effort.
- Adapt effort to task difficulty, up to high without asking. Ask before exceeding high.

## Approved role mapping

All named models were reported available by T3 capabilities during this interview. Provider routing and effort must still be validated before each configured delegation. Preserve the requested choice and report an unavailable model instead of silently switching.

| Role | Starting model and effort |
| --- | --- |
| feature, refactoring | codex/gpt-6.1-sol medium |
| bug-fix | codex/gpt-6.1-sol high |
| perf-issue | codex/gpt-6.1-sol high |
| hillclimb | codex/gpt-6.1-sol high |
| judgment and prose | codex/gpt-6.1-sol medium; documentation override below |
| hardest tasks | codex/gpt-6.1-sol high |
| how explorer | codex/gpt-6.1-sol medium |
| how explainer | codex/gpt-6.1-terra medium |
| why investigators | codex/gpt-6.1-sol medium |
| why synthesizer | codex/gpt-6.1-sol high |
| reflect tooling | codex/gpt-6.1-sol medium |
| reflect judgment, divergent, synthesizer | codex/gpt-6.1-sol high |
| arena runners | codex/gpt-6.1-sol high, claudeAgent/claude-opus-5-5 high |
| arena cross-judge pool | claudeAgent/claude-opus-5-5 high, codex/gpt-6.1-sol high |
| swarm workers | codex/gpt-6.1-sol medium |
| architect runners | codex/gpt-6.1-sol high, claudeAgent/claude-opus-5-5 high |
| interrogate reviewers | codex/gpt-6.1-sol high, claudeAgent/claude-opus-5-5 high |

Documentation override: Terra medium for writing/editing docs and explanations, including work otherwise routed to a broader prose role. The generated role schema and model rule include a dedicated `documentation` role.

Independent review override: choose the reviewer from the model family that produced the artifact, rather than the current conversation's family. Sol/GPT and Terra/GPT work go to Opus high; Opus/Claude work goes to Sol high. A new agent performs the review. Ordinary reviews use one reviewer; panel skills use their configured panel.

Arena selects one judge from a different family than the coordinator, in pool order, as required by its judging method. It assesses candidates that can themselves span families. The pool does not request two judges. Swarm worker counts remain task-dependent and governed by the invoked skill.

## Implementation

- Two seats for arena, architect, and interrogate; one reviewer for ordinary reviews.
- Generator-owned T3 setup/help templates and routing instructions preserve these choices across rebuilds.
- Upstream Cursor source remains unchanged. Operational model instructions are adapted; legacy mechanics and background guide pages are interpreted through the T3 adapter.
