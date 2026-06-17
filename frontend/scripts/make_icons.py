"""Generate the Pelada MCR app icons (a Manchester worker bee with a football).

Draws at 4x supersample with Pillow and downscales for crisp edges. Outputs PNGs
into frontend/public/ for the PWA manifest + Apple touch icon.

Run: python frontend/scripts/make_icons.py
Created: 2026-06-17
"""

from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw

S = 2048  # supersampled canvas
SCALE = S / 512
OUT = Path(__file__).resolve().parents[1] / "public"

GREEN_TOP = (5, 96, 58)
GREEN_BOT = (18, 183, 106)
AMBER = (251, 191, 36, 255)
DARK = (17, 24, 39, 255)
WHITE = (255, 255, 255, 255)


def s(v: float) -> float:
    return v * SCALE


def build() -> Image.Image:
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))

    # Rounded-rect green gradient background.
    bg = Image.new("RGB", (S, S), GREEN_BOT)
    bd = ImageDraw.Draw(bg)
    for y in range(S):
        t = y / S
        bd.line(
            [(0, y), (S, y)],
            fill=tuple(int(GREEN_TOP[i] + (GREEN_BOT[i] - GREEN_TOP[i]) * t) for i in range(3)),
        )
    mask = Image.new("L", (S, S), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, S - 1, S - 1], radius=s(112), fill=255)
    img.paste(bg, (0, 0), mask)

    draw = ImageDraw.Draw(img)

    # Wings (rotated translucent ellipses behind the body).
    def wing(cx, cy, rx, ry, angle):
        layer = Image.new("RGBA", (S, S), (0, 0, 0, 0))
        ImageDraw.Draw(layer).ellipse(
            [s(cx - rx), s(cy - ry), s(cx + rx), s(cy + ry)], fill=(255, 255, 255, 230)
        )
        img.alpha_composite(layer.rotate(angle, center=(s(cx), s(cy))))

    wing(196, 165, 74, 48, 22)
    wing(316, 165, 74, 48, -22)

    # Bee body.
    body = [s(196), s(150), s(316), s(330)]
    draw.rounded_rectangle(body, radius=s(60), fill=AMBER)

    # Stripes, clipped to the body shape.
    bmask = Image.new("L", (S, S), 0)
    ImageDraw.Draw(bmask).rounded_rectangle(body, radius=s(60), fill=255)
    stripe = Image.new("L", (S, S), 0)
    sd = ImageDraw.Draw(stripe)
    for sy in (196, 248, 300):
        sd.rectangle([s(196), s(sy), s(316), s(sy + 26)], fill=255)
    img.paste(DARK, mask=ImageChops.multiply(stripe, bmask))

    # Head + antennae.
    draw.ellipse([s(256 - 34), s(140 - 34), s(256 + 34), s(140 + 34)], fill=DARK)
    draw.line([s(244), s(116), s(214), s(84)], fill=DARK, width=int(s(6)))
    draw.line([s(268), s(116), s(298), s(84)], fill=DARK, width=int(s(6)))
    for ax in (210, 302):
        draw.ellipse([s(ax - 9), s(84 - 9), s(ax + 9), s(84 + 9)], fill=DARK)

    # Football (bottom centre).
    cx, cy, r = 256, 398, 58
    draw.ellipse(
        [s(cx - r), s(cy - r), s(cx + r), s(cy + r)],
        fill=WHITE,
        outline=DARK,
        width=int(s(5)),
    )
    angles = [math.radians(a) for a in (0, 72, 144, 216, 288)]
    pent = [(cx + 22 * math.sin(a), cy - 22 * math.cos(a)) for a in angles]
    draw.polygon([(s(x), s(y)) for x, y in pent], fill=DARK)
    for a in angles:
        ix, iy = cx + 22 * math.sin(a), cy - 22 * math.cos(a)
        ox, oy = cx + 54 * math.sin(a), cy - 54 * math.cos(a)
        draw.line([s(ix), s(iy), s(ox), s(oy)], fill=DARK, width=int(s(5)))

    return img


def main() -> None:
    icon = build()
    for size, name in [(512, "icon-512.png"), (192, "icon-192.png"), (180, "apple-touch-icon.png")]:
        icon.resize((size, size), Image.LANCZOS).save(OUT / name)
    print(f"Wrote icons to {OUT}")


if __name__ == "__main__":
    main()
