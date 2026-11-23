---
name: manim-animations
description: Use when writing, editing, rendering, or debugging Python animations with Manim Community Edition (manim), including animated equations, graphs, diagrams, and 2D or 3D scenes.
---

# Manim animations

## Choose the runtime

- Use the project's existing Manim environment and render settings. Check `manim --version` through that environment and consult the matching documentation when API or CLI behavior differs. Manim Community imports `manim`. ManimGL imports `manimlib` and has its own API.
- For standalone scenes on the author's machine, use the `~/manimations` uv project if it exists. Run from the working directory for the scene and its assets:

  ~~~bash
  uv run --project "$HOME/manimations" --locked manim render -ql scene.py SceneName
  ~~~

- If no Manim environment is available, use the [official installation guide](https://docs.manim.community/en/stable/installation.html#local-installation) when setup is part of the task.

[Manim Community tutorials](https://docs.manim.community/en/stable/tutorials/index.html) · [Reference manual](https://docs.manim.community/en/stable/reference.html)

## Build the scene

- Put the sequence in `Scene.construct`. Use `MovingCameraScene` or `ThreeDScene` when the scene needs that camera API. Use `self.add` for immediately visible objects and `self.play` for animated changes. Give the viewer time to read key labels and equations.
- Use one chained `.animate` expression per mobject in a play call. For a true rotational path, use `Rotate`. With `Transform(source, target)`, keep using `source` after the animation. With `ReplacementTransform(source, target)`, use `target` afterward. [Quickstart](https://docs.manim.community/en/stable/tutorials/quickstart.html)
- Use `Text` for ordinary labels and `MathTex` with raw strings for LaTeX math. Check the TeX log for the first compiler error if a formula fails to render. [Rendering Text and Formulas](https://docs.manim.community/en/stable/guides/using_text.html)
- For markers that follow graphs, live labels, per-frame geometry, or equation transformations, read [Reactive scene patterns](references/scene-patterns.md).

## Render and verify

- Use `manim render -ql <file> <SceneName>` through the chosen environment for a fast motion check. Use `-s` to save only the final frame as PNG. Use `-p` when opening the output in a viewer is part of the task.
- Manim Community 0.22.1 loads `manim.cfg` from the render working directory. Pass `--config_file PATH` to select a specific config, and use `--media_dir PATH` for isolated output. [Configuration source](https://docs.manim.community/en/stable/_modules/manim/_config/utils.html#config_file_paths) · [Output settings](https://docs.manim.community/en/stable/tutorials/output_and_config.html)
- Verify the reported output path and inspect the parts that changed. When checking motion, play the clip or sample frames at relevant times. For example, `ffmpeg -ss 1.2 -i render.mp4 -frames:v 1 frame.png` extracts a frame near 1.2 seconds. Render the deliverable at the requested format, aspect ratio, frame rate, and quality, and link the actual output. Use `manim render --help` for the installed version's flags.
