# pstack model configuration for T3 Code. Overrides upstream model defaults.
# budget: medium (high)
# Explicit role efforts below override the preset; preserve them on setup re-runs.
# effort adaptation: adapt to task difficulty while preserving the configured model.
# effort ceiling: high; ask the user before exceeding high.
# speed: standard; priority/fast only for an authorized urgent run and supported options.
# thread override: follow the thread model and options only when the user explicitly requests it.
# documentation override: documentation and explanatory writing use the documentation role.
# independent reviews: fresh reviewer opposite the artifact author's family, not the coordinator's.
# GPT authors include Sol and Terra; Claude authors include Opus. Record author provenance in briefs.
# ordinary reviews: one reviewer. Panel skills use their exact configured lists.
# unavailable choices: report and ask for a replacement; never silently substitute or drop a seat.
# auto / inherit-parent: inherit the parent provider, model, and options.
worker default: codex/gpt-6.1-sol medium
feature, refactoring: codex/gpt-6.1-sol medium
bug-fix: codex/gpt-6.1-sol high
perf-issue: codex/gpt-6.1-sol high
hillclimb: codex/gpt-6.1-sol high
judgment and prose: codex/gpt-6.1-sol medium
hardest tasks: codex/gpt-6.1-sol high
documentation: codex/gpt-6.1-terra medium
how explorer: codex/gpt-6.1-sol medium
how explainer: codex/gpt-6.1-terra medium
why investigators: codex/gpt-6.1-sol medium
why synthesizer: codex/gpt-6.1-sol high
reflect tooling: codex/gpt-6.1-sol medium
reflect judgment, divergent, synthesizer: codex/gpt-6.1-sol high
arena runners: codex/gpt-6.1-sol high, claudeAgent/claude-opus-5-5 high
arena cross-judge pool: claudeAgent/claude-opus-5-5 high, codex/gpt-6.1-sol high
swarm workers: codex/gpt-6.1-sol medium
architect runners: codex/gpt-6.1-sol high, claudeAgent/claude-opus-5-5 high
interrogate reviewers: codex/gpt-6.1-sol high, claudeAgent/claude-opus-5-5 high
review of GPT work: claudeAgent/claude-opus-5-5 high
review of Claude work: codex/gpt-6.1-sol high
