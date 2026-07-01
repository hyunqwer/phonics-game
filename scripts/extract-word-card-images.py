"""
Extract user-provided Yoon's Phonics World word-card sheets into app-ready WebP files.

Run:
  python scripts/extract-word-card-images.py
  python scripts/extract-word-card-images.py --force
  python scripts/extract-word-card-images.py --force --sheets book05_1.png,book05_2.png

Input:
  source_assets/word-card-sheets/*.png
  source_assets/word-card-sheets/word-card-sheets.json

Output:
  public/content/img/words/<word>.webp

Notes:
  Only mapped words are extracted. Unmapped words use the app's emoji fallback.
  Requires Pillow: python -m pip install pillow
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

try:
    from PIL import Image, ImageChops, ImageDraw
except ImportError as exc:
    raise SystemExit("Pillow is required. Install with: python -m pip install pillow") from exc


ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "source_assets" / "word-card-sheets"
MAP_FILE = SOURCE_DIR / "word-card-sheets.json"
OUT_DIR = ROOT / "public" / "content" / "img" / "words"


def as_int(value: float) -> int:
    return int(round(value))


def crop_word(sheet: Image.Image, grid: dict[str, Any], index: int) -> Image.Image:
    cols = int(grid["cols"])
    row, col = divmod(index, cols)
    inset = float(grid.get("inset", 0))
    x1 = float(grid["left"]) + col * (float(grid["cardWidth"]) + float(grid.get("colGap", 0))) + inset
    y1 = float(grid["top"]) + row * (float(grid["cardHeight"]) + float(grid.get("rowGap", 0))) + inset
    x2 = x1 + float(grid["cardWidth"]) - inset * 2
    y2 = y1 + float(grid["cardHeight"]) - inset * 2
    crop = sheet.crop((as_int(x1), as_int(y1), as_int(x2), as_int(y2))).convert("RGBA")
    content = grid.get("content")
    if content:
        left = as_int(float(content.get("left", 0)))
        top = as_int(float(content.get("top", 0)))
        right = crop.width - as_int(float(content.get("right", 0)))
        bottom = crop.height - as_int(float(content.get("bottom", 0)))
        crop = crop.crop((left, top, right, bottom))
    for erase in grid.get("erase", []):
        x, y, w, h = [as_int(float(v)) for v in erase]
        ImageDraw.Draw(crop).rectangle((x, y, x + w, y + h), fill=(255, 255, 255, 0))
    if grid.get("erase") or grid.get("removePaleGreen"):
        crop = remove_pale_green_guides(crop)
    return crop


def remove_pale_green_guides(img: Image.Image) -> Image.Image:
    rgba = img.convert("RGBA")
    px = rgba.load()
    w, h = rgba.size
    edge = 14
    for y in range(h):
        for x in range(w):
            if edge <= x < w - edge and edge <= y < h - edge:
                continue
            r, g, b, a = px[x, y]
            if a and r > 115 and g > 150 and b > 75 and g > r + 8 and g > b + 8:
                px[x, y] = (255, 255, 255, 0)
    return rgba


def trim_background(img: Image.Image, margin: int = 18) -> Image.Image:
    rgba = img.convert("RGBA")
    white = Image.new("RGB", rgba.size, (255, 255, 255))
    diff = ImageChops.difference(rgba.convert("RGB"), white).convert("L")
    color_mask = diff.point(lambda p: 255 if p > 12 else 0)
    alpha_mask = rgba.getchannel("A").point(lambda p: 255 if p else 0)
    mask = ImageChops.multiply(color_mask, alpha_mask)
    bbox = mask.getbbox()
    if not bbox:
        return rgba
    min_x, min_y, max_x, max_y = bbox
    min_x = max(0, min_x - margin)
    min_y = max(0, min_y - margin)
    max_x = min(rgba.width, max_x + margin)
    max_y = min(rgba.height, max_y + margin)
    return rgba.crop((min_x, min_y, max_x, max_y))


def fit_square(img: Image.Image, size: int = 512) -> Image.Image:
    canvas = Image.new("RGBA", (size, size), (255, 255, 255, 0))
    img = trim_background(img)
    max_side = size - 56
    scale = min(max_side / img.width, max_side / img.height)
    img = img.resize((max(1, as_int(img.width * scale)), max(1, as_int(img.height * scale))), Image.Resampling.LANCZOS)
    x = (size - img.width) // 2
    y = (size - img.height) // 2
    canvas.alpha_composite(img, (x, y))
    return canvas


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--force", action="store_true", help="overwrite existing webp files")
    parser.add_argument("--quality", type=int, default=82, help="webp quality, default 82")
    parser.add_argument("--method", type=int, default=4, help="webp encoder method 0-6, default 4")
    parser.add_argument("--words", default="", help="comma-separated words to extract")
    parser.add_argument("--sheets", default="", help="comma-separated sheet file names to extract")
    args = parser.parse_args()
    target_words = {w.strip().lower() for w in args.words.split(",") if w.strip()}
    target_sheets = {s.strip() for s in args.sheets.split(",") if s.strip()}

    data = json.loads(MAP_FILE.read_text(encoding="utf-8"))
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    ok = skipped = missing = failed = 0
    seen: set[str] = set()

    for spec in data["sheets"]:
        if target_sheets and spec["file"] not in target_sheets:
            continue
        sheet_path = SOURCE_DIR / spec["file"]
        if not sheet_path.exists():
            print(f"! missing sheet: {sheet_path}")
            missing += 1
            continue
        sheet = Image.open(sheet_path)
        for index, word in enumerate(spec["words"]):
            if not word:
                continue
            word = str(word).strip().lower()
            if target_words and word not in target_words:
                continue
            if word in seen:
                continue
            seen.add(word)
            out = OUT_DIR / f"{word}.webp"
            if out.exists() and not args.force:
                skipped += 1
                continue
            try:
                crop = crop_word(sheet, spec["grid"], index)
                result = fit_square(crop)
                result.save(out, "WEBP", quality=args.quality, method=args.method)
                print(f"✓ {word:<10} -> {out.relative_to(ROOT)}")
                ok += 1
            except Exception as exc:
                print(f"✗ {word}: {exc}")
                failed += 1

    print(f"\nDone: {ok} generated, {skipped} skipped, {missing} missing sheets, {failed} failed")
    print(f"Output: {OUT_DIR}")
    return 1 if failed or missing else 0


if __name__ == "__main__":
    raise SystemExit(main())
