"""
Extract user-provided Yoon's Phonics World word-card sheets into app-ready WebP files.

Run:
  python scripts/extract-word-card-images.py
  python scripts/extract-word-card-images.py --force

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
    from PIL import Image
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
    return sheet.crop((as_int(x1), as_int(y1), as_int(x2), as_int(y2))).convert("RGBA")


def trim_background(img: Image.Image, margin: int = 18) -> Image.Image:
    rgba = img.convert("RGBA")
    px = rgba.load()
    w, h = rgba.size
    min_x, min_y, max_x, max_y = w, h, -1, -1
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            if abs(r - 255) + abs(g - 255) + abs(b - 255) > 38:
                min_x = min(min_x, x)
                min_y = min(min_y, y)
                max_x = max(max_x, x)
                max_y = max(max_y, y)
    if max_x < min_x or max_y < min_y:
        return rgba
    min_x = max(0, min_x - margin)
    min_y = max(0, min_y - margin)
    max_x = min(w - 1, max_x + margin)
    max_y = min(h - 1, max_y + margin)
    return rgba.crop((min_x, min_y, max_x + 1, max_y + 1))


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
    parser.add_argument("--words", default="", help="comma-separated words to extract")
    args = parser.parse_args()
    target_words = {w.strip().lower() for w in args.words.split(",") if w.strip()}

    data = json.loads(MAP_FILE.read_text(encoding="utf-8"))
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    ok = skipped = missing = failed = 0
    seen: set[str] = set()

    for spec in data["sheets"]:
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
                result.save(out, "WEBP", quality=args.quality, method=6)
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
