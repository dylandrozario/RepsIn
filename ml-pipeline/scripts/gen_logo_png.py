#!/usr/bin/env python3
"""
Render the RepsIn logo (bold R + vertical dumbbell) to transparent PNGs with
Pillow, in black and white, at a high resolution for crisp display.

Writes:
  mobile-app/assets/logo.png          (black on transparent)
  mobile-app/assets/logo-white.png    (white on transparent)
"""
import os
from PIL import Image, ImageDraw

SIZE = 1024          # output px (square)
SS = 4               # supersample factor for smooth edges
S = SIZE * SS


def scale(v):
    # map 0..100 viewBox units to supersampled pixels
    return v / 100.0 * S


def rrect(draw, x, y, w, h, r, fill):
    draw.rounded_rectangle(
        [scale(x), scale(y), scale(x + w), scale(y + h)],
        radius=scale(r), fill=fill,
    )


def render(color):
    img = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # --- Bold R silhouette as a polygon, with the counter cut out -----------
    outer = [
        (28, 12), (58, 12),
        (72, 12), (82, 23), (82, 37),   # top bowl curve approximated
        (82, 49), (74, 59), (62, 61),
        (80, 88), (62, 88),
        (42, 58), (42, 47),
        (56, 47), (62, 43), (66, 37),
        (66, 31), (62, 27), (56, 27),
        (42, 27), (42, 88), (28, 88),
    ]
    d.polygon([(scale(x), scale(y)) for x, y in outer], fill=color)

    # The counter (hole in the bowl) — punch transparent, then we re-fill R
    # parts. Simpler: draw R as two rects + a filled bowl, matching the SVG.
    # Redo cleanly below instead of the polygon above:
    img = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # left stem
    rrect(d, 28, 12, 14, 76, 2, color)
    # top bar
    rrect(d, 28, 12, 34, 15, 2, color)
    # bowl outer (right side) — use pieslice-ish via ellipse clipped by rects
    # Approximate the bowl with a filled rounded rect + ellipse.
    d.ellipse([scale(40), scale(12), scale(84), scale(62)], fill=color)
    # knock out the inner counter (transparent)
    d.ellipse([scale(52), scale(24), scale(72), scale(50)], fill=(0, 0, 0, 0))
    # knock out left of the bowl so the stem reads
    d.rectangle([scale(0), scale(12), scale(42), scale(62)], fill=(0, 0, 0, 0))
    # re-draw stem + top bar (the rectangle knockout clipped them)
    rrect(d, 28, 12, 14, 76, 2, color)
    rrect(d, 28, 12, 30, 15, 2, color)
    # inner vertical wall of the bowl
    rrect(d, 42, 12, 6, 50, 2, color)
    # diagonal leg
    d.polygon(
        [(scale(x), scale(y)) for x, y in [(50, 50), (62, 50), (80, 88), (64, 88), (42, 58), (42, 50)]],
        fill=color,
    )

    # --- Vertical dumbbell ---------------------------------------------------
    rrect(d, 47, 30, 6, 40, 3, color)        # handle
    rrect(d, 35, 38, 30, 8, 4, color)        # inner plate top
    rrect(d, 35, 54, 30, 8, 4, color)        # inner plate bottom
    rrect(d, 40, 30, 20, 6.5, 3.2, color)    # outer plate top
    rrect(d, 40, 63.5, 20, 6.5, 3.2, color)  # outer plate bottom
    rrect(d, 46, 26, 8, 4.5, 2.2, color)     # tip top
    rrect(d, 46, 69.5, 8, 4.5, 2.2, color)   # tip bottom

    return img.resize((SIZE, SIZE), Image.LANCZOS)


def main():
    out = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'mobile-app', 'assets'))
    os.makedirs(out, exist_ok=True)
    render((26, 26, 38, 255)).save(os.path.join(out, 'logo.png'))          # near-black (ink)
    render((255, 255, 255, 255)).save(os.path.join(out, 'logo-white.png'))  # white
    print('Wrote logo.png and logo-white.png to', out)


if __name__ == '__main__':
    main()
