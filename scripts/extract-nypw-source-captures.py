"""
Extract missing word images from the organized NYPW source capture folder.

The captures in source_assets/nypw-source-capture are worksheet/page screenshots,
not clean card sheets. This script crops the picture area only, removes the small
number badge from cells, trims white background, and writes app-ready WebP files.

Run:
  python scripts/extract-nypw-source-captures.py
  python scripts/extract-nypw-source-captures.py --force
"""
from __future__ import annotations

import argparse
from pathlib import Path
from typing import Iterable

from PIL import Image, ImageChops, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "source_assets" / "nypw-source-capture"
OUT_DIR = ROOT / "public" / "content" / "img" / "words"


def as_int(value: float) -> int:
    return int(round(value))


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
    return rgba.crop(
        (
            max(0, min_x - margin),
            max(0, min_y - margin),
            min(rgba.width, max_x + margin),
            min(rgba.height, max_y + margin),
        )
    )


def fit_square(img: Image.Image, size: int = 512) -> Image.Image:
    canvas = Image.new("RGBA", (size, size), (255, 255, 255, 0))
    img = trim_background(img)
    max_side = size - 56
    scale = min(max_side / img.width, max_side / img.height)
    img = img.resize((max(1, as_int(img.width * scale)), max(1, as_int(img.height * scale))), Image.Resampling.LANCZOS)
    canvas.alpha_composite(img, ((size - img.width) // 2, (size - img.height) // 2))
    return canvas


def crop_rect(sheet: Image.Image, rect: tuple[float, float, float, float]) -> Image.Image:
    w, h = sheet.size
    x, y, rw, rh = rect
    return sheet.crop((as_int(x * w), as_int(y * h), as_int((x + rw) * w), as_int((y + rh) * h))).convert("RGBA")


def erase_badge(img: Image.Image, rel_size: float = 0.22) -> Image.Image:
    out = img.copy()
    s = as_int(min(out.size) * rel_size)
    ImageDraw.Draw(out).rectangle((0, 0, s, s), fill=(255, 255, 255, 0))
    return out


def crop_grid(
    sheet: Image.Image,
    words: list[str | None],
    *,
    rect: tuple[float, float, float, float],
    cols: int,
    rows: int,
    bottom_cut: float = 0.24,
    erase: bool = True,
) -> Iterable[tuple[str, Image.Image]]:
    x, y, rw, rh = rect
    cell_w = rw / cols
    cell_h = rh / rows
    for index, word in enumerate(words):
        if not word:
            continue
        row, col = divmod(index, cols)
        inset_x = cell_w * 0.03
        inset_y = cell_h * 0.03
        crop = crop_rect(
            sheet,
            (
                x + col * cell_w + inset_x,
                y + row * cell_h + inset_y,
                cell_w - inset_x * 2,
                cell_h * (1 - bottom_cut) - inset_y,
            ),
        )
        if erase:
            crop = erase_badge(crop)
        yield word, crop


def page_blue(sheet: Image.Image, header: str | None, cells: list[str | None], *, rows: int = 3, cols: int = 3):
    if header:
        yield header, crop_rect(sheet, (0.50, 0.02, 0.38, 0.15))
    yield from crop_grid(sheet, cells, rect=(0.02, 0.27, 0.96, 0.70), cols=cols, rows=rows, bottom_cut=0.26)


def page_blue_rows2(sheet: Image.Image, cells: list[str | None]):
    yield from crop_grid(sheet, cells, rect=(0.10, 0.04, 0.86, 0.92), cols=2, rows=4, bottom_cut=0.27)


def page_orange(sheet: Image.Image, header: str | None, cells: list[str | None], *, rows: int = 3, cols: int = 3):
    if header:
        yield header, crop_rect(sheet, (0.43, 0.02, 0.42, 0.16))
    yield from crop_grid(sheet, cells, rect=(0.02, 0.24, 0.96, 0.73), cols=cols, rows=rows, bottom_cut=0.25)


def page_orange_short(sheet: Image.Image, header: str | None, cells: list[str | None], *, rows: int = 3, cols: int = 3):
    if header:
        yield header, crop_rect(sheet, (0.43, 0.02, 0.42, 0.16))
    yield from crop_grid(sheet, cells, rect=(0.02, 0.31, 0.96, 0.66), cols=cols, rows=rows, bottom_cut=0.25)


def page_green(sheet: Image.Image, header: str | None, cells: list[str | None], *, rows: int = 3, cols: int = 3):
    if header:
        yield header, crop_rect(sheet, (0.43, 0.02, 0.40, 0.16))
    yield from crop_grid(sheet, cells, rect=(0.03, 0.29, 0.94, 0.68), cols=cols, rows=rows, bottom_cut=0.25)


def page_pink_two(sheet: Image.Image, sections: list[tuple[str | None, list[str | None]]]):
    for panel_index, (header, cells) in enumerate(sections):
        panel_y = 0.0 if panel_index == 0 else 0.50
        panel_h = 0.50
        if header:
            yield header, crop_rect(sheet, (0.42, panel_y + 0.03, 0.30, 0.16))
        yield from crop_grid(
            sheet,
            cells,
            rect=(0.02, panel_y + panel_h * 0.50, 0.96, panel_h * 0.42),
            cols=4,
            rows=1,
            bottom_cut=0.28,
        )


def page_pink_single(sheet: Image.Image, header: str | None, cells: list[str | None], *, rows: int = 3, cols: int = 3):
    if header:
        yield header, crop_rect(sheet, (0.45, 0.02, 0.34, 0.17))
    yield from crop_grid(sheet, cells, rect=(0.03, 0.27, 0.94, 0.69), cols=cols, rows=rows, bottom_cut=0.27)


PAGES = [
    ("blue", "b01-1.png", "seal", ["sad", "sand", "salt", "same", "sink", "six", "soap", "sock", "sun"]),
    ("blue", "b01-2.png", "tiger", ["table", "tail", "talk", "tape", "ten", "tent", "tie", "toe", "toy"]),
    ("blue", "b01-3.png", "bat", ["bag", "ball", "bear", "bed", "bell", "big", "book", "box", "boy"]),
    ("blue", "b01-4.png", "hen", ["hair", "hand", "happy", "head", "hill", "mat", "hop", "horse", "house"]),
    ("blue", "b01-5.png", "mouse", ["man", "many", "map", "mat", "milk", "money", "monkey", "moon", "mop"]),
    ("blue", "b02-1.png", "king", ["ketchup", "key", "kick", "kid", "kind", "kiss", "kitchen", "kite", "kitten"]),
    ("blue", "b02-2.png", "jet", ["jacket", "jail", "jam", "jar", "jeans", "jeep", "juice", "jump", "jungle"]),
    ("blue", "b02-3.png", "fox", ["family", "fan", "farm", "fat", "father", "finger", "fire", "fish", "five"]),
    ("blue", "b02-4.png", "goat", ["game", "gap", "garden", "gate", "girl", "give", "go", "gold", "gum"]),
    ("blue", "b02-5.png", "lion", ["lake", "lamp", "laugh", "leaf", "letter", "little", "lock", "log", "lunch"]),
    ("blue", "b03-1.png", "dog", ["dark", "deer", "desk", "dish", "doctor", "doll", "dolphin", "door", "duck"]),
    ("blue", "b03-2.png", "nurse", ["name", "neck", "net", "new", "night", "nine", "nose", "number", "nut"]),
    ("blue", "b03-3.png", "wolf", ["wagon", "wall", "watch", "water", "wind", "window", "wing", "winter", "woman"]),
    ("blue", "b03-4.png", "cat", ["cake", "call", "can", "candy", "car", "cold", "cow", "cup", "cut"]),
    ("blue", "b03-5.png", "rabbit", ["rat", "read", "red", "ring", "river", "rock", "rope", "rose", "run"]),
    ("blue", "b04-1.png", "pig", ["paper", "pencil", "pie", "pot", "puppy", None, None, None, None]),
    ("blue", "b04-2.png", "queen", ["quail", "quarter", "question", "quiet", "quiz", None, None, None, None]),
    ("blue", "b04-3.png", "vase", ["valley", "van", "vest", "vine", "violin", None, None, None, None]),
    ("blue", "b04-4.png", "yo-yo", ["yarn", "yawn", "yellow", "yes", "young", None, None, None, None]),
    ("blue", "b04-5.png", "zebra", ["zero", "zipper", "zone", "zoo", "zoom", None, None, None, None]),
    ("blue_rows2", "b04-6.png", None, ["beak", "book", "cliff", "leaf", "pull", "school", "bread", "road"]),
    ("blue_rows2", "b04-7.png", None, ["bag", "log", "coin", "down", "cup", "soap", "ax", "box"]),
    ("orange_short", "b05-1.png", None, ["bad", "glad", "mad", "sad", "clap", "map", "nap", "trap", None]),
    ("orange_short", "b05-2.png", None, ["big", "dig", "twig", "wig", "hit", "kit", "sit", "split", None]),
    ("orange_short", "b05-3.png", None, ["fill", "gill", "hill", "pill", "fin", "pin", "thin", "win", None]),
    ("orange_short", "b06-1.png", None, ["bun", "fun", "run", "hug", "jug", "mug", "plug", "rug", None]),
    ("orange_short", "b06-2.png", None, ["cut", "hut", "shut", "club", "rub", None, "sub", "tub", None]),
    ("orange_short", "b06-3.png", None, ["clog", "fog", None, "frog", "log", None, "fox", "ox", None]),
    ("orange_short", "b06-4.png", None, ["dot", "hot", "knot", "spot", "mop", "pop", "stop", "top", None]),
    ("orange_short", "b07-1.png", None, ["get", "jet", "net", "pet", "wet", None, "men", "pen", "ten"]),
    ("orange_short", "b07-2.png", None, ["sell", "smell", "tell", "well", None, None, "red", "bed", "sled"]),
    ("green", "b08-1.png", "cake", ["bake", "lake", "rake", "snake", "date", "gate", "hate", "late", "plate"]),
    ("green", "b08-2.png", "space", ["flame", "game", "name", "same", "face", "place", "race", "trace", None]),
    ("green", "b08-3.png", "slide", ["bike", "hike", "like", "hide", "ride", None, "side", "wide", None]),
    ("green", "b08-4.png", "lime", ["crime", "dime", "slime", "time", "dive", "drive", "five", "hive", None]),
    ("green", "b08-5.png", "mule", ["cube", "tube", "tune", "cure", "pure", "sure", "cute", "mute", None]),
    ("green", "b09-1.png", "rose", ["hole", "mole", "pole", "close", "hose", None, "nose", "pose", None]),
    ("green", "b09-2.png", "phone", ["hope", "rope", "slope", "bone", "cone", None, "stone", "zone", None]),
    ("green", "b09-3.png", "bee", ["knee", "see", "three", "tree", "jeep", "sheep", "sleep", "sweep", None]),
    ("green", "b09-4.png", "eel", ["feed", "need", "seed", "speed", "weed", "feel", "heel", "peel", "wheel"]),
    ("green", "b10-1.png", "tray", ["day", "hay", "gray", "lay", "pay", None, "play", "say", None]),
    ("green", "b10-2.png", "mail", ["nail", "pail", "pain", "paint", "rain", "sail", "tail", "train", "wait"]),
    ("green", "b10-3.png", "night", ["fight", "high", "light", "right", "tight", "die", "lie", "pie", "tie"]),
    ("green", "b11-1.png", "boat", ["coat", "float", "goat", "throat", "load", None, "road", "toad", None]),
    ("green", "b11-2.png", "snow", ["doe", "hoe", "foe", "toe", "bow", "grow", "low", "row", "slow"]),
    ("green", "b11-3.png", "leaf", ["beak", "dream", "eat", "meat", "neat", "pea", "sea", "seal", "tea"]),
    ("pink_two", "b12-1.png", None, [("frog", ["frame", "friend", "front", "fruit"]), ("grape", ["grass", "gray", "green", "ground"])]),
    ("pink_two", "b12-2.png", None, [("bride", ["bread", "break", "broom", "brown"]), ("pretty", ["price", "prince", "prize", "present"])]),
    ("pink_two", "b12-3.png", None, [("fly", ["flag", "float", "floor", "flower"]), ("glass", ["globe", "glove", "glow", "glue"])]),
    ("pink_two", "b12-4.png", None, [("blue", ["black", "blanket", "block", "blow"]), ("plane", ["plant", "plate", "play", "plum"])]),
    ("pink_two", "b13-1.png", None, [("smoke", ["small", "smart", "smell", "smile"]), ("stand", ["star", "stop", "store", "study"])]),
    ("pink_two", "b13-2.png", None, [("swing", ["sweater", "sweet", "swim", "switch"]), ("snack", ["snail", "snake", "sneeze", "snow"])]),
    ("pink_two", "b13-3.png", None, [("sleep", ["sled", "slide", "slip", "slow"]), ("speak", ["space", "spill", "spoon", "sport"])]),
    ("pink_two", "b13-4.png", None, [("cereal", ["ceiling", "celery", "circle", "city"]), ("gem", ["giant", "ginger", "giraffe", "gym"])]),
    ("pink_single", "b14-1.png", "chicken", ["chain", "chair", "chase", "cheap", "cheese", "chess", "child", "chin", "chop"]),
    ("pink_single", "b14-2.png", "beach", ["coach", "couch", "peach", "reach", "rich", None, "speech", "teach", None]),
    ("pink_single", "b14-3.png", "sheep", ["shade", "shake", "shark", "sharp", "shell", "ship", "shirt", "shoe", "short"]),
    ("pink_single", "b14-4.png", "fish", ["ash", "brush", "cash", "dish", "fresh", "rash", "trash", "wash", "wish"]),
    ("pink_single", "b14-5.png", "thumb", ["thick", "thin", "think", "thorn", "bath", "cloth", "math", "moth", "tooth"]),
    ("pink_single", "b15-1.png", "whale", ["wheel", "whip", "whiskers", "whisper", "whistle", "white", "phone", "photo", None]),
    ("pink_single", "b15-2.png", "king", ["bring", "hang", "long", "lung", "ring", "sing", "song", "strong", "wing"]),
    ("pink_single", "b15-3.png", "duck", ["back", "block", "clock", "kick", "lock", "neck", "rock", "sick", "sock"]),
    ("pink_single", "b15-4.png", "wrench", ["wrap", "wrestle", "wrinkle", "wrist", "write", "wrong"], 3, 2),
    ("pink_single", "b15-5.png", "knight", ["knee", "knife", "knit", "knob", "knock", "knot", "know", None, None]),
    ("orange", "b16-1.png", "coin", ["boil", "foil", "noise", "oil", "soil", "voice", "boy", "joy", "toy"]),
    ("orange", "b16-2.png", "mouse", ["cloud", "house", "round", "shout", "brown", "clown", "cow", "down", "owl"]),
    ("orange", "b16-3.png", "laundry", ["faucet", "pause", "sauce", "sausage", "claw", "draw", "hawk", "straw", "yawn"]),
    ("orange", "b16-4.png", "book", ["cook", "cookie", "foot", "hoof", "hook", None, "look", "wood", None]),
    ("orange", "b17-1.png", "pool", ["broom", "room", "school", "spoon", "tool", "chew", "new", "screw", "stew"]),
    ("orange", "b17-2.png", "glue", ["blue", "clue", "true", "flute", "rude", "rule", "bruise", "fruit", "suit"]),
    ("orange", "b17-3.png", "sky", ["cry", "dry", "fly", "fry", "shy", None, "spy", "try", None]),
    ("orange", "b17-4.png", "baby", ["bunny", "candy", "dirty", "empty", "funny", None, "happy", "penny", None]),
    ("orange", "b18-1.png", "car", ["arm", "bark", "card", "dark", "far", "farm", "jar", "park", "star"]),
    ("orange", "b18-2.png", "horse", ["cork", "corn", "fork", "horn", "short", "sport", "storm", "thorn", "torn"]),
    ("orange", "b18-3.png", "bird", ["dirt", "shirt", "skirt", "brother", "sister", "weather", "fur", "nurse", "purse"]),
]

SPECIAL_RECTS = [
    ("b05-1.png", "bad", (0.09, 0.34, 0.23, 0.15)),
    ("b05-1.png", "glad", (0.43, 0.34, 0.20, 0.14)),
    ("b05-1.png", "trap", (0.60, 0.78, 0.30, 0.13)),
    ("b05-2.png", "fit", (0.52, 0.12, 0.20, 0.09)),
    ("b05-2.png", "twig", (0.70, 0.30, 0.20, 0.16)),
    ("b05-2.png", "kit", (0.72, 0.54, 0.18, 0.13)),
    ("b05-2.png", "split", (0.61, 0.80, 0.25, 0.12)),
    ("b05-3.png", "gill", (0.41, 0.31, 0.22, 0.14)),
    ("b05-3.png", "pin", (0.72, 0.53, 0.14, 0.13)),
    ("b07-1.png", "get", (0.14, 0.31, 0.24, 0.13)),
    ("b07-1.png", "pet", (0.11, 0.55, 0.22, 0.16)),
    ("b07-1.png", "wet", (0.64, 0.55, 0.20, 0.16)),
    ("b07-1.png", "men", (0.10, 0.77, 0.26, 0.13)),
    ("b07-1.png", "pen", (0.39, 0.77, 0.22, 0.13)),
    ("b07-2.png", "sell", (0.10, 0.33, 0.25, 0.15)),
    ("b07-2.png", "smell", (0.58, 0.33, 0.20, 0.15)),
    ("b07-2.png", "tell", (0.10, 0.55, 0.26, 0.15)),
    ("b07-2.png", "well", (0.57, 0.55, 0.24, 0.15)),
    ("b07-2.png", "sled", (0.59, 0.78, 0.23, 0.14)),
    ("b15-1.png", "pharmacy", (0.80, 0.02, 0.14, 0.11)),
    ("b14-1.png", "chicken", (0.55, 0.02, 0.22, 0.14)),
    ("b14-2.png", "beach", (0.55, 0.02, 0.25, 0.14)),
    ("b14-3.png", "sheep", (0.55, 0.02, 0.22, 0.14)),
    ("b14-4.png", "fish", (0.55, 0.02, 0.22, 0.14)),
    ("b14-5.png", "thumb", (0.55, 0.02, 0.22, 0.14)),
    ("b15-1.png", "whale", (0.30, 0.02, 0.16, 0.11)),
    ("b15-2.png", "king", (0.55, 0.02, 0.22, 0.14)),
    ("b15-3.png", "duck", (0.55, 0.02, 0.22, 0.14)),
    ("b15-4.png", "wrench", (0.54, 0.02, 0.24, 0.14)),
    ("b15-5.png", "knight", (0.55, 0.02, 0.22, 0.14)),
    ("b16-1.png", "coin", (0.43, 0.02, 0.24, 0.13)),
    ("b16-2.png", "mouse", (0.43, 0.02, 0.24, 0.13)),
    ("b16-3.png", "laundry", (0.43, 0.02, 0.24, 0.13)),
    ("b16-4.png", "book", (0.43, 0.02, 0.24, 0.13)),
    ("b17-1.png", "pool", (0.47, 0.02, 0.20, 0.11)),
    ("b17-2.png", "glue", (0.43, 0.02, 0.24, 0.13)),
    ("b17-3.png", "sky", (0.43, 0.02, 0.24, 0.13)),
    ("b17-4.png", "baby", (0.52, 0.02, 0.22, 0.15)),
    ("b18-1.png", "car", (0.43, 0.02, 0.24, 0.13)),
    ("b18-2.png", "horse", (0.43, 0.02, 0.24, 0.13)),
    ("b18-3.png", "bird", (0.52, 0.02, 0.22, 0.13)),
    ("b04-extra-bus-root-drum.png", "bus", (0.27, 0.08, 0.24, 0.13)),
    ("b04-extra-bus-root-drum.png", "root", (0.72, 0.29, 0.15, 0.12)),
    ("b04-extra-bus-root-drum.png", "drum", (0.32, 0.75, 0.16, 0.13)),
    ("b10-extra-open-a.png", "apron", (0.11, 0.17, 0.20, 0.20)),
    ("b10-extra-open-a.png", "bacon", (0.37, 0.18, 0.27, 0.12)),
    ("b10-extra-open-i.png", "idea", (0.10, 0.15, 0.18, 0.16)),
    ("b10-extra-open-i.png", "idol", (0.40, 0.13, 0.23, 0.20)),
    ("b10-extra-open-i.png", "pilot", (0.74, 0.11, 0.15, 0.22)),
    ("b11-extra-open-o.png", "oval", (0.12, 0.17, 0.18, 0.13)),
    ("b11-extra-open-o.png", "open", (0.43, 0.16, 0.18, 0.18)),
    ("b11-extra-open-e.png", "erase", (0.08, 0.09, 0.22, 0.16)),
    ("b11-extra-open-e.png", "evening", (0.40, 0.10, 0.22, 0.14)),
    ("b11-extra-open-e.png", "me", (0.73, 0.09, 0.16, 0.15)),
]


def iter_page_words(style: str, sheet: Image.Image, header, data, rows=3, cols=3):
    if style == "blue":
        yield from page_blue(sheet, header, data, rows=rows, cols=cols)
    elif style == "blue_rows2":
        yield from page_blue_rows2(sheet, data)
    elif style == "orange_short":
        yield from page_orange_short(sheet, header, data, rows=rows, cols=cols)
    elif style == "orange":
        yield from page_orange(sheet, header, data, rows=rows, cols=cols)
    elif style == "green":
        yield from page_green(sheet, header, data, rows=rows, cols=cols)
    elif style == "pink_two":
        yield from page_pink_two(sheet, data)
    elif style == "pink_single":
        yield from page_pink_single(sheet, header, data, rows=rows, cols=cols)
    else:
        raise ValueError(f"unknown style: {style}")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--force", action="store_true", help="overwrite existing image files")
    parser.add_argument("--quality", type=int, default=82)
    parser.add_argument("--method", type=int, default=2)
    parser.add_argument("--words", default="", help="comma-separated words to limit extraction")
    args = parser.parse_args()

    target_words = {w.strip().lower() for w in args.words.split(",") if w.strip()}
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    generated = skipped = missing_sheet = failed = 0
    for spec in PAGES:
        style, filename, header, data, *rest = spec
        rows = rest[0] if len(rest) > 0 else 3
        cols = rest[1] if len(rest) > 1 else 3
        path = SOURCE_DIR / filename
        if not path.exists():
            print(f"! missing source: {filename}")
            missing_sheet += 1
            continue
        sheet = Image.open(path).convert("RGBA")
        for word, crop in iter_page_words(style, sheet, header, data, rows=rows, cols=cols):
            word = word.lower()
            if target_words and word not in target_words:
                continue
            out = OUT_DIR / f"{word}.webp"
            if out.exists() and not args.force:
                skipped += 1
                continue
            try:
                result = fit_square(crop)
                result.save(out, "WEBP", quality=args.quality, method=args.method)
                print(f"✓ {word:<12} <- {filename}")
                generated += 1
            except Exception as exc:
                print(f"✗ {word}: {exc}")
                failed += 1

    for filename, word, rect in SPECIAL_RECTS:
        word = word.lower()
        if target_words and word not in target_words:
            continue
        out = OUT_DIR / f"{word}.webp"
        if out.exists() and not args.force:
            skipped += 1
            continue
        path = SOURCE_DIR / filename
        if not path.exists():
            print(f"! missing source: {filename}")
            missing_sheet += 1
            continue
        try:
            sheet = Image.open(path).convert("RGBA")
            result = fit_square(crop_rect(sheet, rect))
            result.save(out, "WEBP", quality=args.quality, method=args.method)
            print(f"✓ {word:<12} <- {filename}")
            generated += 1
        except Exception as exc:
            print(f"✗ {word}: {exc}")
            failed += 1

    print(f"\nDone: {generated} generated, {skipped} skipped, {missing_sheet} missing sheets, {failed} failed")
    return 1 if missing_sheet or failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
