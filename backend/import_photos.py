"""Import & optimise end-of-match photos for the match pages.

Takes raw photos named by match date (``DD-MM-YYYY.jpg`` or ``YYYY-MM-DD.jpg``)
from an inbox folder, normalises every one to a tidy 16:9 web-sized JPEG and
writes it to ``frontend/public/photos/<YYYY-MM-DD>.jpg`` — the exact name the
match page looks for. Finally it reports which matches still have no photo.

The intended workflow mirrors the data one: drop new photos into the inbox
(default ``photos_inbox/``), then run this script.

Usage:
    python import_photos.py [--src DIR] [--force]

Created: 2026-06-17
"""

from __future__ import annotations

import argparse
import json
import re
from datetime import date
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
PHOTOS_DIR = ROOT / "frontend" / "public" / "photos"
MATCHES_DIR = ROOT / "frontend" / "public" / "data" / "matches"

TARGET_RATIO = 16 / 9  # match-page card aspect
MAX_WIDTH = 1600       # plenty for the card, keeps files small
JPEG_QUALITY = 85

# Accept DD-MM-YYYY or YYYY-MM-DD stems.
_DMY = re.compile(r"^(\d{2})-(\d{2})-(\d{4})$")
_YMD = re.compile(r"^(\d{4})-(\d{2})-(\d{2})$")


def parse_date(stem: str) -> date | None:
    """Return the match date from a file stem, or None if it isn't a date."""
    if m := _YMD.match(stem):
        y, mo, d = m.groups()
    elif m := _DMY.match(stem):
        d, mo, y = m.groups()
    else:
        return None
    try:
        return date(int(y), int(mo), int(d))
    except ValueError:
        return None


def crop_box(im: Image.Image, ratio: float, zoom: float, cx: float, cy: float) -> Image.Image:
    """Crop the largest ``ratio`` box at the given ``zoom``, centred at (cx, cy).

    ``zoom`` of 1.0 keeps the full frame (just trimmed to ``ratio``); higher
    values crop tighter. ``cx``/``cy`` are fractions of the original size, so a
    far-away group can be centred and zoomed in. The box is clamped to stay
    inside the image.
    """
    w, h = im.size
    cw = w / max(zoom, 1.0)
    ch = cw / ratio
    if ch > h:  # box taller than the image -> fit by height instead
        ch = h
        cw = ch * ratio
    if cw > w:
        cw = w
        ch = cw / ratio
    left = min(max(cx * w - cw / 2, 0), w - cw)
    top = min(max(cy * h - ch / 2, 0), h - ch)
    return im.crop((round(left), round(top), round(left + cw), round(top + ch)))


def process(src_path: Path, out_path: Path, spec: dict | None) -> None:
    """Crop to 16:9 (with optional per-date zoom/anchor), downscale, save JPEG."""
    spec = spec or {}
    zoom = float(spec.get("zoom", 1.0))
    cx = float(spec.get("x", 0.5))
    cy = float(spec.get("y", 0.5))
    with Image.open(src_path) as im:
        im = ImageOps.exif_transpose(im)  # honour camera rotation
        im = im.convert("RGB")
        im = crop_box(im, TARGET_RATIO, zoom, cx, cy)
        if im.width > MAX_WIDTH:
            new_h = round(MAX_WIDTH / TARGET_RATIO)
            im = im.resize((MAX_WIDTH, new_h), Image.LANCZOS)
        out_path.parent.mkdir(parents=True, exist_ok=True)
        im.save(out_path, "JPEG", quality=JPEG_QUALITY, optimize=True, progressive=True)


def load_crops(path: Path) -> dict:
    """Load the per-date crop map, ignoring comment keys. Missing file -> {}."""
    if not path.exists():
        return {}
    raw = json.loads(path.read_text(encoding="utf-8"))
    return {k: v for k, v in raw.items() if isinstance(v, dict)}


def match_dates() -> set[str]:
    """All match dates (YYYY-MM-DD) that exist in the generated data."""
    return {p.stem for p in MATCHES_DIR.glob("*.json")}


def main() -> None:
    ap = argparse.ArgumentParser(description="Import & crop match photos.")
    ap.add_argument(
        "--src",
        default=str(ROOT / "photos_inbox"),
        help="Folder of raw photos named by match date.",
    )
    ap.add_argument(
        "--force",
        action="store_true",
        help="Re-process photos even if a file already exists for that date.",
    )
    ap.add_argument(
        "--crops",
        default=str(ROOT / "backend" / "photos_crops.json"),
        help="Optional JSON map of per-date crop hints (zoom/x/y).",
    )
    args = ap.parse_args()

    src = Path(args.src)
    if not src.is_dir():
        raise SystemExit(f"Source folder not found: {src}")

    crops = load_crops(Path(args.crops))
    imported, skipped, ignored = [], [], []
    for f in sorted(src.iterdir()):
        if f.suffix.lower() not in {".jpg", ".jpeg", ".png"}:
            continue
        d = parse_date(f.stem)
        if d is None:
            ignored.append(f.name)
            continue
        iso = d.isoformat()
        out_path = PHOTOS_DIR / f"{iso}.jpg"
        if out_path.exists() and not args.force:
            skipped.append(iso)
            continue
        process(f, out_path, crops.get(iso))
        imported.append(iso)

    print(f"Imported {len(imported)} photo(s) into {PHOTOS_DIR}")
    for iso in imported:
        print(f"  + {iso}.jpg")
    if skipped:
        print(f"Skipped {len(skipped)} (already present, use --force to redo): "
              f"{', '.join(sorted(skipped))}")
    if ignored:
        print(f"Ignored {len(ignored)} non-date file(s): {', '.join(ignored)}")

    # Report coverage against known matches.
    matches = match_dates()
    have = {p.stem for p in PHOTOS_DIR.glob("*.jpg")}
    missing = sorted(matches - have)
    orphan = sorted(have - matches)  # photos with no matching match yet

    print(f"\nPhoto coverage: {len(matches & have)}/{len(matches)} matches have a photo.")
    if missing:
        print("Matches still WITHOUT a photo:")
        for d in missing:
            print(f"  - {d}")
    else:
        print("Every known match has a photo. 🎉")
    if orphan:
        print("\nPhotos with no matching match (matches.csv not updated yet?):")
        for d in orphan:
            print(f"  ? {d}.jpg")


if __name__ == "__main__":
    main()
