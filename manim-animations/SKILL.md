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
- When the video explains a computation (a MATLAB or Python solution, a dataset), draw its real results. Export the values, point clouds, curves and images from the source computation to a data file (JSON) and read them in the scene; label any illustrative stand-in as illustrative. When decimating data for drawing, keep the extrema: a `[::2]` step can drop the peak sample.
- Space grouped phrases with nested groups, `VGroup(VGroup(a, b).arrange(RIGHT), VGroup(c, d).arrange(RIGHT)).arrange(RIGHT, buff=0.9)`. A spacer mobject without points, such as `MathTex(r"\qquad")`, breaks `arrange` and stacks everything after it on top of the earlier items.
- Keep every label inside the 14.2 × 8 frame with a margin, and below the title. Fit long text with `font_size`, a `\\` line break, or a narrower column, and anchor side columns by their left edge (`align_to`) so they cannot run off the right edge.
- For sound effects or a soundtrack, read [Sound](references/sound.md).

## Render and verify

- Use `manim render -ql <file> <SceneName>` through the chosen environment for a fast motion check. Use `-s` to save only the final frame as PNG. Use `-p` when opening the output in a viewer is part of the task.
- Manim Community 0.22.1 loads `manim.cfg` from the render working directory. Pass `--config_file PATH` to select a specific config, and use `--media_dir PATH` for isolated output. [Configuration source](https://docs.manim.community/en/stable/_modules/manim/_config/utils.html#config_file_paths) · [Output settings](https://docs.manim.community/en/stable/tutorials/output_and_config.html)
- Before every deliverable render, run the layout lint from the scene's folder, with the chosen environment's Python, until it reports 0 issues. `SKILL_DIR` is the folder that holds this `SKILL.md`, wherever your agent loaded it from. With the `~/manimations` project:

  ~~~bash
  uv run --project "$HOME/manimations" --locked python "$SKILL_DIR/scripts/layout_check.py" scene.py SceneName
  ~~~

  It dry-runs the scene and lists, with timestamps, text that leaves the frame, overlaps other text, or crowds the title. It sees text boxes only, so also sample a frame at the end of every section (just before each wipe) and look for labels crossing curves, axes, arrows or moving objects.
- For a video that explains a computation, check every displayed number, formula and figure reference against the source computation before the final render. Run the source (the MATLAB MCP server works for `.m` and `.mlx`) and compare value by value.
- Verify the reported output path and inspect the parts that changed. When checking motion, play the clip or sample frames at relevant times. For example, `ffmpeg -ss 1.2 -i render.mp4 -frames:v 1 frame.png` extracts a frame near 1.2 seconds. Render the deliverable at the requested format, aspect ratio, frame rate, and quality, and link the actual output. Use `manim render --help` for the installed version's flags.
