"""Layout lint for Manim Community scenes.

Dry-runs a scene (no frames, no video) and, after every play(), reports text and images that
  frame    come closer than MARGIN to the frame edge or leave it,
  overlap  overlap another text/formula/image,
  title    sit within TITLE_GAP below the top-most title line.
Each finding is printed once, with the scene time where it first appears.

    uv run --project "$HOME/manimations" --locked python layout_check.py scene.py SceneName [--media_dir DIR]

Run it from the scene's folder. The default media_dir (./media) reuses the Tex cache of normal renders.
Blind spot: it checks text boxes only, not text crossing curves, axes or arrows; sample frames for those.
"""

import argparse
import importlib.util
import sys
from itertools import combinations
from pathlib import Path

from manim import ImageMobject, MathTex, Scene, SingleStringMathTex, Text, config, tempconfig

MARGIN = 0.12        # Manim units from the frame edge
TITLE_GAP = 0.18     # minimum gap below the title
MIN_OVERLAP = 0.015  # intersection area (units^2) that counts as an overlap


def leaves(mobs):
    """Top-most visible text, formula and image objects."""
    out = []

    def walk(m):
        if isinstance(m, (MathTex, SingleStringMathTex, Text, ImageMobject)):
            visible = isinstance(m, ImageMobject) or any(
                q.get_fill_opacity() > 0.05 for q in m.family_members_with_points())
            if visible and m.width > 1e-3:
                out.append(m)
            return
        for s in m.submobjects:
            walk(s)
    for m in mobs:
        walk(m)
    return out


def label(m):
    if isinstance(m, ImageMobject):
        return "<image>"
    s = getattr(m, "tex_string", None) or getattr(m, "text", None) or type(m).__name__
    return " ".join(str(s).split())[:70]


def box(m):
    return m.get_left()[0], m.get_right()[0], m.get_bottom()[1], m.get_top()[1]


def check(scene):
    fw, fh = config.frame_width / 2, config.frame_height / 2
    issues = []
    boxes = [(m, box(m)) for m in leaves(scene.mobjects)]
    for m, (l, r, b, t) in boxes:
        if l < -fw + MARGIN or r > fw - MARGIN or b < -fh + MARGIN or t > fh - MARGIN:
            issues.append(("frame", f"{label(m)!r} x[{l:.2f},{r:.2f}] y[{b:.2f},{t:.2f}]"))
    for (m1, a), (m2, c) in combinations(boxes, 2):
        w = min(a[1], c[1]) - max(a[0], c[0])
        h = min(a[3], c[3]) - max(a[2], c[2])
        if w > 0 and h > 0 and w * h > MIN_OVERLAP and not (
                isinstance(m1, ImageMobject) and isinstance(m2, ImageMobject)):
            issues.append(("overlap", f"{label(m1)!r} <-> {label(m2)!r} ({w:.2f} x {h:.2f})"))
    top = max((bx[3] for _, bx in boxes), default=-fh)
    titles = [(m, bx) for m, bx in boxes if bx[3] > fh - 0.9 and bx[3] > top - 0.05]
    title_ids = {id(m) for m, _ in titles}
    for _, tb in titles:
        for m, (l, r, b, t) in boxes:
            if id(m) not in title_ids and t > tb[2] - TITLE_GAP and b < tb[2] and min(r, tb[1]) > max(l, tb[0]):
                issues.append(("title", f"{label(m)!r} top {t:.2f} vs title bottom {tb[2]:.2f}"))
    return issues


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("file")
    ap.add_argument("scene")
    ap.add_argument("--media_dir", default="media")
    args = ap.parse_args()

    seen, report = set(), []
    orig = Scene.play

    def play(self, *a, **k):  # subclasses that override play() still reach this through super()
        orig(self, *a, **k)
        for kind, msg in check(self):
            if (kind, msg) not in seen:
                seen.add((kind, msg))
                report.append(f"{self.renderer.time:7.1f}s  {kind:8s} {msg}")
    Scene.play = play

    path = Path(args.file).resolve()
    sys.path.insert(0, str(path.parent))
    spec = importlib.util.spec_from_file_location(path.stem, path)
    mod = importlib.util.module_from_spec(spec)
    sys.modules[path.stem] = mod
    spec.loader.exec_module(mod)
    with tempconfig({"dry_run": True, "media_dir": args.media_dir, "verbosity": "ERROR", "progress_bar": "none"}):
        getattr(mod, args.scene)().render()
    print(f"== {args.scene}: {len(report)} issue(s)")
    print("\n".join(report))
    sys.exit(1 if report else 0)


if __name__ == "__main__":
    main()
