# Reactive scene patterns

- Drive changing numeric state with a `ValueTracker`. Use `add_updater` for an existing mobject that can be repositioned or updated in place. Use `always_redraw` when its geometry needs to be rebuilt each frame. Add the dependent mobject to the scene. [ValueTracker](https://docs.manim.community/en/stable/reference/manim.mobject.value_tracker.ValueTracker.html) · [always_redraw](https://docs.manim.community/en/stable/reference/manim.animation.updaters.mobject_update_utils.html#manim.animation.updaters.mobject_update_utils.always_redraw)
- Convert data coordinates through `axes.c2p(x, y)` when placing marks on an `Axes` object. Use the same function for the curve and dependent points. Updating the tracker changes the input to the updater, which recomputes the position. [Axes](https://docs.manim.community/en/stable/reference/manim.mobject.graphing.coordinate_systems.Axes.html) · [Building blocks](https://docs.manim.community/en/stable/tutorials/building_blocks.html)
- For a changing numeric display, update a `DecimalNumber` in place with `set_value`. For steps in a derivation, split `MathTex` into meaningful matching parts before using `TransformMatchingTex`. [DecimalNumber](https://docs.manim.community/en/stable/reference/manim.mobject.text.numbers.DecimalNumber.html) · [TransformMatchingTex](https://docs.manim.community/en/stable/reference/manim.animation.transform_matching_parts.TransformMatchingTex.html)

## Moving point on a curve

Save as `scene.py` and render the `ParabolaPoint` scene. The dot follows the plotted curve as the x-coordinate changes.

~~~python
from manim import Axes, BLUE, DOWN, Dot, Scene, Text, UP, ValueTracker, YELLOW, linear


class ParabolaPoint(Scene):
    def construct(self):
        axes = Axes(
            x_range=[-2, 2, 1],
            y_range=[0, 4, 1],
            x_length=7,
            y_length=4,
        ).shift(DOWN * 0.35)

        def parabola(x):
            return x**2

        curve = axes.plot(parabola, x_range=[-2, 2], color=BLUE)
        title = Text("y = x²", font_size=36).to_edge(UP)
        x_position = ValueTracker(-1.5)

        def move_dot(dot):
            x = x_position.get_value()
            dot.move_to(axes.c2p(x, parabola(x)))

        dot = Dot(color=YELLOW).add_updater(move_dot, call_updater=True)
        self.add(title, axes, curve, x_position, dot)
        self.play(x_position.animate.set_value(1.5), run_time=2, rate_func=linear)
        self.wait(0.5)
~~~
