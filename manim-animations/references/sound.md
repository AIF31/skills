# Sound

Worked example layout: a project `animations/` folder where `sound_cues.py` records cues and `soundtrack.py` synthesizes and masters.

## Pipeline

1. A base scene overrides `play()` and logs a **cue sheet**: for each animation its kind (`Write`, `Create`, `GrowFromCenter`, ...), start time, duration and screen position. Scenes add semantic cues (a carrier tone, a correlation sweep) right before the `play()` they belong to.
2. `manim render --dry_run` advances scene time without drawing frames, so it refreshes the cue sheet in seconds to minutes.
3. In `tear_down`, synthesize the soundtrack from the cue sheet and hand it to the file writer at time 0. Manim muxes it into the rendered MP4.

Pitch and stereo can follow the picture: pan from the object's x position, pitch from its height, quantized to the current chord.

## Gotchas

- `Scene.add_sound` returns early while the renderer is skipping cached animations, so a cached last animation silently drops the track. Attach it with `self._get_manager().file_writer.add_sound(path, 0.0)`.
- Partial renders (`-n`) start the video later than the cue sheet: skip the soundtrack when `config.from_animation_number > 0` or `config.upto_animation_number` is set. Skip it too for `--dry_run` and `-s`.
- `FadeIn` and `FadeOut` subclass `Transform`: test them before `Transform` when classifying animations.
- Animations in one `play()` can have different run times, and `play(..., run_time=...)` overrides them all. Take each animation's own run time, then expand `AnimationGroup.anims_with_timings` inside it.
- A `Line` has only four control points: treat it as two endpoints, not as a curve to sample.
- Master to a static gain (about −16 LUFS, measured with ffmpeg `loudnorm`), then `alimiter=...:level=0:latency=1`. Keep peaks under −1 dBFS, and keep a full-scale hit off t = 0, where AAC encoding overshoots.
- Smooth long audio envelopes with a cumulative-sum moving average; `np.convolve` with a long kernel takes minutes.
