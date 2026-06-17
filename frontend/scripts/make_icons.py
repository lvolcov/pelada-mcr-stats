"""Generate Pelada MCR icons from the brand logo (Brazilian bee + football).

Produces:
  public/logo.png            transparent, content-cropped — for in-site use
  public/icon-512.png        white-background app icon (PWA)
  public/icon-192.png        white-background app icon (PWA)
  public/apple-touch-icon.png  white-background (iOS)
  public/favicon.png         white-background (browser tab)

The white background is removed via flood-fill from the corners, so interior
white (the football, wing fill) is preserved.

Run: python frontend/scripts/make_icons.py
Created: 2026-06-17
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw

HERE = Path(__file__).resolve().parent
SRC = HERE / "logo-source.png"
OUT = HERE.parent / "public"
KEY = (255, 0, 255)  # sentinel for "background"


def transparent_logo(src: Image.Image) -> Image.Image:
    """Return the logo with the corner-connected white background removed."""
    rgb = src.convert("RGB")
    w, h = rgb.size
    for corner in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]:
        ImageDraw.floodfill(rgb, corner, KEY, thresh=40)
    rgba = rgb.convert("RGBA")
    px = rgba.load()
    for y in range(h):
        for x in range(w):
            if px[x, y][:3] == KEY:
                px[x, y] = (0, 0, 0, 0)
    logo = rgba.crop(rgba.getbbox())  # trim transparent margin
    side = max(logo.size)
    canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    canvas.paste(logo, ((side - logo.size[0]) // 2, (side - logo.size[1]) // 2), logo)
    return canvas


def white_square(src: Image.Image) -> Image.Image:
    """Logo padded to a square on a white background (for app icons)."""
    rgb = src.convert("RGB")
    w, h = rgb.size
    side = max(w, h)
    sq = Image.new("RGB", (side, side), (255, 255, 255))
    sq.paste(rgb, ((side - w) // 2, (side - h) // 2))
    return sq


def main() -> None:
    src = Image.open(SRC)

    transparent_logo(src).resize((512, 512), Image.LANCZOS).save(OUT / "logo.png")

    icon = white_square(src)
    for size, name in [
        (512, "icon-512.png"),
        (192, "icon-192.png"),
        (180, "apple-touch-icon.png"),
        (64, "favicon.png"),
    ]:
        icon.resize((size, size), Image.LANCZOS).save(OUT / name)

    print(f"Wrote logo.png + app icons to {OUT}")


if __name__ == "__main__":
    main()
