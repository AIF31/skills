# pstack for T3 Code

## Summary

Adapt pstack 0.15.36 to T3 Code with a configured worker default, documentation model, reasoning budget, and independent review policy.

```text
pstack-t3/
├── adapter/                 # T3 model policy and setup/help templates
├── scripts/                 # generator, installer, and upstream sync
├── test/                    # generator regression tests
├── generated/               # 58 adapted skills, 23 playbooks, 32 launchers
├── config/pstack-models.md  # approved personal model profile
├── CONFIGURATION.md         # setup decisions
├── REVIEW.md                # Sol-medium findings and resolution
└── USAGE.md                 # installation, commands, updates, and license
```

The worker default is Sol medium; bug fixes, performance work, hillclimb, hard tasks, and panel seats start at high. Documentation uses Terra medium. Independent reviews use Opus high for GPT-authored work and Sol high for Claude-authored work. Reasoning adapts up to high; higher effort requires approval.

See [installation and usage](USAGE.md), the [complete skill mapping](generated/MAPPING.md), and the [approved configuration](CONFIGURATION.md). The generated snapshot contains installation-specific absolute paths; rebuild it for another machine or destination.

## Evidence

- **Before:** setup and help retained Cursor instructions, no personal T3 model rule was saved, and Arena's mapping note allowed silently skipping the cross-judge.
  **After:** T3 setup/help templates and model policy are generated directly; the approved profile records 21 roles; Arena reports a missing eligible judge and asks for a choice.
- **Before:** regression checks exposed missing T3 model-path substitution and operational Cursor model defaults.
  **After:** all 12 generator tests pass, including generation from real upstream inputs. The bundled files match the verified installation; all 32 launcher metadata files and 64 managed links validated.
- **Before:** the integration had no completed review at the requested Sol-medium setting.
  **After:** [Sol 6.1 medium review](REVIEW.md) checked the frozen core snapshot and routing scenarios. Its one stale Arena note was corrected and the generator tests rerun. The review did not execute every playbook or application workflow.
