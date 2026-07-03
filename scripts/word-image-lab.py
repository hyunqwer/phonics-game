from __future__ import annotations

import argparse
import importlib.util
import json
import mimetypes
import posixpath
from collections import deque
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import parse_qs, unquote, urlparse

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "source_assets" / "nypw-source-capture"
LAB_DIR = ROOT / "source_assets" / "word-image-lab"
MAPPING_FILE = LAB_DIR / "word-crops.json"
TMP_DIR = ROOT / "tmp_word_image_lab"
PREVIEW_DIR = TMP_DIR / "previews"
CONTACT_DIR = TMP_DIR / "contact-sheets"
APP_WORD_DIR = ROOT / "public" / "content" / "img" / "words"
APPROVED_FILE = APP_WORD_DIR / "approved-images.json"
UI_DIR = ROOT / "tools" / "word-image-lab"

STATUSES = {"draft", "approved", "needs_edit", "fallback"}


def rel_to_root(path: Path) -> str:
    return path.resolve().relative_to(ROOT).as_posix()


def safe_source_path(source: str) -> Path:
    path = (ROOT / source).resolve()
    if SOURCE_DIR.resolve() not in path.parents or path.suffix.lower() != ".png":
        raise ValueError("source must be a PNG inside source_assets/nypw-source-capture")
    if not path.exists():
        raise FileNotFoundError(source)
    return path


def safe_word(value: str) -> str:
    word = "".join(ch for ch in value.strip().lower() if ch.isalnum() or ch in ("-", "_"))
    if not word:
        raise ValueError("word is required")
    return word


def read_json(path: Path, default: Any) -> Any:
    if not path.exists():
        return default
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def load_mapping() -> dict[str, Any]:
    data = read_json(MAPPING_FILE, {"items": []})
    items = data.get("items") if isinstance(data, dict) else []
    if not isinstance(items, list):
        items = []
    normalized = []
    for raw in items:
        if not isinstance(raw, dict):
            continue
        try:
            word = safe_word(str(raw.get("word", "")))
            source = str(raw.get("source", ""))
            safe_source_path(source)
            box = normalize_box(raw.get("box"))
        except Exception:
            continue
        status = str(raw.get("status", "draft"))
        normalized.append(
            {
                "word": word,
                "source": source,
                "box": box,
                "erase": normalize_erase(raw.get("erase")),
                "eraseMode": raw.get("eraseMode") if raw.get("eraseMode") in ("transparent", "white") else "transparent",
                "status": status if status in STATUSES else "draft",
                "notes": str(raw.get("notes", "")),
            }
        )
    return {"items": normalized}


def save_mapping(data: dict[str, Any]) -> dict[str, Any]:
    items = data.get("items", [])
    if not isinstance(items, list):
        raise ValueError("items must be a list")
    normalized = []
    seen: set[tuple[str, str]] = set()
    for raw in items:
        if not isinstance(raw, dict):
            continue
        word = safe_word(str(raw.get("word", "")))
        source = str(raw.get("source", ""))
        safe_source_path(source)
        key = (source, word)
        if key in seen:
            raise ValueError(f"duplicate word in source: {word}")
        seen.add(key)
        status = str(raw.get("status", "draft"))
        normalized.append(
            {
                "word": word,
                "source": source,
                "box": normalize_box(raw.get("box")),
                "erase": normalize_erase(raw.get("erase")),
                "eraseMode": raw.get("eraseMode") if raw.get("eraseMode") in ("transparent", "white") else "transparent",
                "status": status if status in STATUSES else "draft",
                "notes": str(raw.get("notes", "")),
            }
        )
    result = {"items": normalized}
    write_json(MAPPING_FILE, result)
    write_approved_list(result)
    return result


def normalize_box(value: Any) -> list[int]:
    if not isinstance(value, list) or len(value) != 4:
        raise ValueError("box must be [x1,y1,x2,y2]")
    x1, y1, x2, y2 = [int(round(float(v))) for v in value]
    if x2 <= x1 or y2 <= y1:
        raise ValueError("box must have positive size")
    return [x1, y1, x2, y2]


def normalize_erase(value: Any) -> list[list[int]]:
    if not isinstance(value, list):
        return []
    out = []
    for raw in value:
        if not isinstance(raw, list) or len(raw) != 4:
            continue
        x, y, w, h = [int(round(float(v))) for v in raw]
        if w > 0 and h > 0:
            out.append([x, y, w, h])
    return out


def write_approved_list(mapping: dict[str, Any]) -> None:
    words = sorted({item["word"] for item in mapping.get("items", []) if item.get("status") == "approved"})
    write_json(APPROVED_FILE, {"words": words})


def preview_filename(source: str, word: str) -> str:
    return f"{Path(source).stem}--{safe_word(word)}.png"


def list_sources() -> list[dict[str, Any]]:
    sources = []
    for path in sorted(SOURCE_DIR.glob("*.png")):
        try:
            with Image.open(path) as img:
                width, height = img.size
        except Exception:
            width = height = 0
        sources.append(
            {
                "name": path.name,
                "path": rel_to_root(path),
                "width": width,
                "height": height,
            }
        )
    return sources


def load_capture_presets():
    path = ROOT / "scripts" / "extract-nypw-source-captures.py"
    spec = importlib.util.spec_from_file_location("nypw_capture_presets", path)
    if not spec or not spec.loader:
        raise RuntimeError("could not load source capture presets")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module.PAGES, module.SPECIAL_RECTS


def rect_to_box(rect: tuple[float, float, float, float], width: int, height: int) -> list[int]:
    x, y, rw, rh = rect
    return [
        round(x * width),
        round(y * height),
        round((x + rw) * width),
        round((y + rh) * height),
    ]


def auto_erase_for_box(box: list[int]) -> list[list[int]]:
    w = max(1, box[2] - box[0])
    h = max(1, box[3] - box[1])
    s = round(min(w, h) * 0.22)
    return [[0, 0, s, s]]


def add_seed_item(items: list[dict[str, Any]], word: str | None, source: str, box: list[int], erase_badge: bool) -> None:
    if not word:
        return
    items.append(
        {
            "word": safe_word(word),
            "source": source,
            "box": box,
            "erase": auto_erase_for_box(box) if erase_badge else [],
            "eraseMode": "transparent",
            "status": "draft",
            "notes": "",
        }
    )


def seed_grid(
    items: list[dict[str, Any]],
    words: list[str | None],
    *,
    source: str,
    width: int,
    height: int,
    rect: tuple[float, float, float, float],
    cols: int,
    rows: int,
    bottom_cut: float,
) -> None:
    x, y, rw, rh = rect
    cell_w = rw / cols
    cell_h = rh / rows
    safe_bottom_cut = min(bottom_cut, 0.08)
    for index, word in enumerate(words):
        if not word:
            continue
        row, col = divmod(index, cols)
        inset_x = cell_w * 0.03
        inset_y = cell_h * 0.03
        crop_rect = (
            x + col * cell_w + inset_x,
            y + row * cell_h + inset_y,
            cell_w - inset_x * 2,
            cell_h * (1 - safe_bottom_cut) - inset_y,
        )
        add_seed_item(items, word, source, rect_to_box(crop_rect, width, height), True)


def seed_grid_with_two_item_last_row(
    items: list[dict[str, Any]],
    words: list[str | None],
    *,
    source: str,
    width: int,
    height: int,
    rect: tuple[float, float, float, float],
    bottom_cut: float,
) -> None:
    x, y, rw, rh = rect
    cell_h = rh / 3
    safe_bottom_cut = min(bottom_cut, 0.08)
    for row in range(3):
        row_words = words[row * 3 : row * 3 + 3]
        row_cols = 2 if row == 2 and row_words[0] and row_words[1] and not row_words[2] else 3
        for col, word in enumerate(row_words[:row_cols]):
            if not word:
                continue
            cell_w = rw / row_cols
            inset_x = cell_w * 0.03
            inset_y = cell_h * 0.03
            crop_rect = (
                x + col * cell_w + inset_x,
                y + row * cell_h + inset_y,
                cell_w - inset_x * 2,
                cell_h * (1 - safe_bottom_cut) - inset_y,
            )
            add_seed_item(items, word, source, rect_to_box(crop_rect, width, height), True)


def preset_items_for_source(source: str) -> list[dict[str, Any]]:
    path = safe_source_path(source)
    with Image.open(path) as img:
        width, height = img.size
    pages, special_rects = load_capture_presets()
    filename = path.name
    items: list[dict[str, Any]] = []

    for spec in pages:
        style, page_file, header, data, *rest = spec
        if page_file != filename:
            continue
        rows = rest[0] if len(rest) > 0 else 3
        cols = rest[1] if len(rest) > 1 else 3

        if style == "blue":
            add_seed_item(items, header, source, rect_to_box((0.50, 0.02, 0.38, 0.15), width, height), False)
            seed_grid(items, data, source=source, width=width, height=height, rect=(0.02, 0.27, 0.96, 0.70), cols=cols, rows=rows, bottom_cut=0.26)
        elif style == "blue_rows2":
            seed_grid(items, data, source=source, width=width, height=height, rect=(0.10, 0.04, 0.86, 0.92), cols=2, rows=4, bottom_cut=0.27)
        elif style == "orange":
            add_seed_item(items, header, source, rect_to_box((0.43, 0.02, 0.42, 0.16), width, height), False)
            seed_grid(items, data, source=source, width=width, height=height, rect=(0.02, 0.24, 0.96, 0.73), cols=cols, rows=rows, bottom_cut=0.25)
        elif style == "orange_short":
            add_seed_item(items, header, source, rect_to_box((0.43, 0.02, 0.42, 0.16), width, height), False)
            seed_grid(items, data, source=source, width=width, height=height, rect=(0.02, 0.31, 0.96, 0.66), cols=cols, rows=rows, bottom_cut=0.25)
        elif style == "green":
            add_seed_item(items, header, source, rect_to_box((0.43, 0.02, 0.40, 0.16), width, height), False)
            if rows == 3 and cols == 3 and data[6] and data[7] and not data[8]:
                seed_grid_with_two_item_last_row(
                    items,
                    data,
                    source=source,
                    width=width,
                    height=height,
                    rect=(0.03, 0.29, 0.94, 0.68),
                    bottom_cut=0.25,
                )
            else:
                seed_grid(items, data, source=source, width=width, height=height, rect=(0.03, 0.29, 0.94, 0.68), cols=cols, rows=rows, bottom_cut=0.25)
        elif style == "pink_two":
            for panel_index, (panel_header, cells) in enumerate(data):
                panel_y = 0.0 if panel_index == 0 else 0.50
                panel_h = 0.50
                add_seed_item(items, panel_header, source, rect_to_box((0.42, panel_y + 0.03, 0.30, 0.16), width, height), False)
                seed_grid(
                    items,
                    cells,
                    source=source,
                    width=width,
                    height=height,
                    rect=(0.02, panel_y + panel_h * 0.50, 0.96, panel_h * 0.42),
                    cols=4,
                    rows=1,
                    bottom_cut=0.28,
                )
        elif style == "pink_single":
            add_seed_item(items, header, source, rect_to_box((0.45, 0.02, 0.34, 0.17), width, height), False)
            seed_grid(items, data, source=source, width=width, height=height, rect=(0.03, 0.27, 0.94, 0.69), cols=cols, rows=rows, bottom_cut=0.27)

    for special_file, word, rect in special_rects:
        if special_file == filename:
            add_seed_item(items, word, source, rect_to_box(rect, width, height), False)
    return items


def seed_source(source: str, replace: bool = False) -> dict[str, Any]:
    seeded = preset_items_for_source(source)
    if not seeded:
        raise ValueError(f"no preset layout found for {Path(source).name}")
    mapping = load_mapping()
    existing = mapping["items"]
    if replace:
        existing = [item for item in existing if item["source"] != source]
    known = {(item["source"], item["word"]) for item in existing}
    known_active_words = {item["word"] for item in existing if item.get("status") != "fallback"}
    added = 0
    skipped_existing = 0
    for item in seeded:
        key = (item["source"], item["word"])
        if key in known:
            continue
        if item["word"] in known_active_words:
            skipped_existing += 1
            continue
        existing.append(item)
        known.add(key)
        known_active_words.add(item["word"])
        added += 1
    result = save_mapping({"items": existing})
    return {
        "added": added,
        "skippedExisting": skipped_existing,
        "totalForSource": len([item for item in result["items"] if item["source"] == source]),
        "mapping": result,
    }


def reset_word(source: str, word: str) -> dict[str, Any]:
    word = safe_word(word)
    seeded = preset_items_for_source(source)
    preset = next((item for item in seeded if item["word"] == word), None)
    if not preset:
        raise ValueError(f"no preset found for {word} in {Path(source).name}")
    mapping = load_mapping()
    other_active = any(
        item["source"] != source and item["word"] == word and item.get("status") != "fallback"
        for item in mapping["items"]
    )
    if other_active:
        raise ValueError(f"{word} already exists in another source")
    replaced = False
    for index, item in enumerate(mapping["items"]):
        if item["source"] == source and item["word"] == word:
            mapping["items"][index] = preset
            replaced = True
            break
    if not replaced:
        mapping["items"].append(preset)
    result = save_mapping(mapping)
    return {"word": word, "replaced": replaced, "mapping": result}


def apply_default_erases(source: str) -> dict[str, Any]:
    seeded = preset_items_for_source(source)
    preset_erases = {
        item["word"]: item["erase"]
        for item in seeded
        if item.get("erase")
    }
    mapping = load_mapping()
    changed = 0
    for item in mapping["items"]:
        if item["source"] != source:
            continue
        erase = preset_erases.get(item["word"])
        if not erase:
            continue
        item["erase"] = erase
        item["eraseMode"] = "transparent"
        changed += 1
    result = save_mapping(mapping)
    return {"changed": changed, "mapping": result}


def green_badge_bbox(img: Image.Image) -> list[int] | None:
    rgba = img.convert("RGBA")
    px = rgba.load()
    width, height = rgba.size
    scan_w = max(1, min(width, round(width * 0.45)))
    scan_h = max(1, min(height, round(height * 0.45)))
    green = bytearray(scan_w * scan_h)

    for y in range(scan_h):
        for x in range(scan_w):
            r, g, b, a = px[x, y]
            is_green = g > 120 and r < 170 and b < 210 and g > r + 18 and g > b + 10
            is_cyan = g > 120 and b > 130 and r < 130 and g > r + 25 and b > r + 35
            if a > 10 and (is_green or is_cyan):
                green[y * scan_w + x] = 1

    seen = bytearray(scan_w * scan_h)
    best: tuple[int, int, int, int, int] | None = None
    for start_y in range(scan_h):
        for start_x in range(scan_w):
            start = start_y * scan_w + start_x
            if seen[start] or not green[start]:
                continue
            q: deque[tuple[int, int]] = deque([(start_x, start_y)])
            seen[start] = 1
            count = 0
            left = right = start_x
            top = bottom = start_y
            while q:
                x, y = q.popleft()
                count += 1
                left = min(left, x)
                right = max(right, x)
                top = min(top, y)
                bottom = max(bottom, y)
                for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                    if nx < 0 or ny < 0 or nx >= scan_w or ny >= scan_h:
                        continue
                    idx = ny * scan_w + nx
                    if seen[idx] or not green[idx]:
                        continue
                    seen[idx] = 1
                    q.append((nx, ny))
            if count < 18:
                continue
            if best is None or count > best[0]:
                best = (count, left, top, right, bottom)

    if not best:
        return None
    _, left, top, right, bottom = best
    center_x = (left + right) / 2
    center_y = (top + bottom) / 2
    min_side = max(18, round(min(width, height) * 0.28))
    side = max(min_side, right - left + 13, bottom - top + 13)
    return [
        max(0, round(center_x - side / 2)),
        max(0, round(center_y - side / 2)),
        min(width, round(center_x + side / 2)),
        min(height, round(center_y + side / 2)),
    ]


def is_foreground_pixel(pixel: tuple[int, int, int, int]) -> bool:
    r, g, b, a = pixel
    if a <= 10:
        return False
    if r > 242 and g > 242 and b > 242:
        return False
    if r > 210 and g > 220 and b > 200:
        return False
    if r > 175 and g > 205 and b > 135 and g > r + 4 and g > b + 9:
        return False
    return True


def foreground_bbox(img: Image.Image, ignore_boxes: list[list[int]] | None = None, scan_bottom: float = 1.0) -> list[int] | None:
    rgba = img.convert("RGBA")
    px = rgba.load()
    width, height = rgba.size
    ignore_boxes = ignore_boxes or []

    def ignored(x: int, y: int) -> bool:
        for x1, y1, x2, y2 in ignore_boxes:
            if x1 <= x < x2 and y1 <= y < y2:
                return True
        return False

    scan_height = max(1, min(height, round(height * scan_bottom)))
    mask = bytearray(width * scan_height)
    for y in range(scan_height):
        for x in range(width):
            if ignored(x, y):
                continue
            if is_foreground_pixel(px[x, y]):
                mask[y * width + x] = 1

    seen = bytearray(width * scan_height)
    kept: list[tuple[int, int, int, int, int]] = []
    min_pixels = max(14, round(width * height * 0.0015))
    for start_y in range(scan_height):
        for start_x in range(width):
            start = start_y * width + start_x
            if seen[start] or not mask[start]:
                continue
            q: deque[tuple[int, int]] = deque([(start_x, start_y)])
            seen[start] = 1
            count = 0
            left = right = start_x
            top = bottom = start_y
            while q:
                x, y = q.popleft()
                count += 1
                left = min(left, x)
                right = max(right, x)
                top = min(top, y)
                bottom = max(bottom, y)
                for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                    if nx < 0 or ny < 0 or nx >= width or ny >= scan_height:
                        continue
                    idx = ny * width + nx
                    if seen[idx] or not mask[idx]:
                        continue
                    seen[idx] = 1
                    q.append((nx, ny))

            comp_w = right - left + 1
            comp_h = bottom - top + 1
            is_thin_line = comp_w <= 3 and comp_h > height * 0.18
            if count < min_pixels or is_thin_line:
                continue
            kept.append((count, left, top, right + 1, bottom + 1))

    if not kept:
        return None

    left = min(comp[1] for comp in kept)
    top = min(comp[2] for comp in kept)
    right = max(comp[3] for comp in kept)
    bottom = max(comp[4] for comp in kept)
    bbox_w = right - left
    bbox_h = bottom - top
    if bbox_w < max(14, round(width * 0.12)) or bbox_h < max(14, round(height * 0.12)):
        return None
    if bbox_w * bbox_h < max(120, round(width * height * 0.015)):
        return None
    pad_x = 12
    pad_top = 12
    pad_bottom = 14
    return [
        max(0, left - pad_x),
        max(0, top - pad_top),
        min(width, right + pad_x),
        min(height, bottom + pad_bottom),
    ]


def relative_intersection(box: list[int], crop_box: list[int]) -> list[int] | None:
    x1 = max(box[0], crop_box[0])
    y1 = max(box[1], crop_box[1])
    x2 = min(box[2], crop_box[2])
    y2 = min(box[3], crop_box[3])
    if x2 <= x1 or y2 <= y1:
        return None
    return [x1 - crop_box[0], y1 - crop_box[1], x2 - x1, y2 - y1]


def auto_refine_source(source: str, word: str | None = None) -> dict[str, Any]:
    mapping = load_mapping()
    source_path = safe_source_path(source)
    target_word = safe_word(word) if word else None
    with Image.open(source_path).convert("RGBA") as src:
        changed = 0
        for item in mapping["items"]:
            if item["source"] != source or item.get("status") == "fallback":
                continue
            if target_word and item["word"] != target_word:
                continue
            old_box = normalize_box(item["box"])
            x1, y1, x2, y2 = old_box
            crop = src.crop((x1, y1, x2, y2))
            badge = green_badge_bbox(crop)
            ignore = [badge] if badge else []
            fg = foreground_bbox(crop, ignore, scan_bottom=0.86 if badge else 0.78)
            if not fg:
                if badge:
                    item["erase"] = [[badge[0], badge[1], badge[2] - badge[0], badge[3] - badge[1]]]
                    changed += 1
                continue

            new_box = [
                x1 + fg[0],
                y1 + fg[1],
                x1 + fg[2],
                y1 + fg[3],
            ]
            new_box = normalize_box(new_box)
            new_erase: list[list[int]] = []
            if badge:
                absolute_badge = [x1 + badge[0], y1 + badge[1], x1 + badge[2], y1 + badge[3]]
                intersection = relative_intersection(absolute_badge, new_box)
                if intersection:
                    new_erase.append(intersection)

            if item["box"] != new_box or item.get("erase", []) != new_erase:
                item["box"] = new_box
                item["erase"] = new_erase
                item["eraseMode"] = "transparent"
                changed += 1

    result = save_mapping(mapping)
    return {"changed": changed, "mapping": result}


def bg_like(pixel: tuple[int, int, int, int]) -> bool:
    r, g, b, a = pixel
    if a == 0:
        return True
    if r > 235 and g > 235 and b > 235:
        return True
    if r > 185 and g > 215 and b > 145 and g > r + 5 and g > b + 12:
        return True
    return False


def clear_edge_background(img: Image.Image) -> Image.Image:
    img = img.convert("RGBA")
    pix = img.load()
    width, height = img.size
    q: deque[tuple[int, int]] = deque()
    seen = bytearray(width * height)

    for x in range(width):
        q.append((x, 0))
        q.append((x, height - 1))
    for y in range(height):
        q.append((0, y))
        q.append((width - 1, y))

    while q:
        x, y = q.popleft()
        if x < 0 or y < 0 or x >= width or y >= height:
            continue
        idx = y * width + x
        if seen[idx]:
            continue
        seen[idx] = 1
        if not bg_like(pix[x, y]):
            continue
        pix[x, y] = (255, 255, 255, 0)
        q.extend(((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)))
    return img


def trim_alpha(img: Image.Image, pad: int = 10) -> Image.Image:
    bbox = img.getchannel("A").getbbox()
    if not bbox:
        return img
    left, top, right, bottom = bbox
    return img.crop(
        (
            max(0, left - pad),
            max(0, top - pad),
            min(img.width, right + pad),
            min(img.height, bottom + pad),
        )
    )


def fit_square(img: Image.Image, size: int = 512) -> Image.Image:
    img = trim_alpha(img)
    canvas = Image.new("RGBA", (size, size), (255, 255, 255, 0))
    if img.width <= 0 or img.height <= 0:
        return canvas
    max_side = size - 72
    scale = min(max_side / img.width, max_side / img.height)
    resized = img.resize(
        (max(1, round(img.width * scale)), max(1, round(img.height * scale))),
        Image.Resampling.LANCZOS,
    )
    canvas.alpha_composite(resized, ((size - resized.width) // 2, (size - resized.height) // 2))
    return canvas


def render_item(item: dict[str, Any], write_app: bool = True) -> dict[str, Any]:
    word = safe_word(item["word"])
    source = safe_source_path(item["source"])
    x1, y1, x2, y2 = normalize_box(item["box"])
    with Image.open(source).convert("RGBA") as src:
        x1 = max(0, min(src.width - 1, x1))
        y1 = max(0, min(src.height - 1, y1))
        x2 = max(x1 + 1, min(src.width, x2))
        y2 = max(y1 + 1, min(src.height, y2))
        crop = src.crop((x1, y1, x2, y2))

    draw = ImageDraw.Draw(crop)
    fill = (255, 255, 255, 0) if item.get("eraseMode") != "white" else (255, 255, 255, 255)
    for x, y, w, h in normalize_erase(item.get("erase")):
        draw.rectangle((x, y, x + w, y + h), fill=fill)

    result = fit_square(clear_edge_background(crop))
    PREVIEW_DIR.mkdir(parents=True, exist_ok=True)
    preview_path = PREVIEW_DIR / preview_filename(item["source"], word)
    result.save(preview_path)

    app_path = APP_WORD_DIR / f"{word}.webp"
    if write_app and item.get("status") == "approved":
        APP_WORD_DIR.mkdir(parents=True, exist_ok=True)
        result.save(app_path, "WEBP", quality=88, method=4)

    approved = item.get("status") == "approved"
    return {
        "word": word,
        "preview": rel_to_root(preview_path),
        "app": rel_to_root(app_path) if approved else None,
        "approved": approved,
    }


def render_items(source: str | None = None, word: str | None = None) -> list[dict[str, Any]]:
    mapping = load_mapping()
    active_by_word: dict[str, list[dict[str, Any]]] = {}
    for item in mapping["items"]:
        if item.get("status") == "fallback":
            continue
        active_by_word.setdefault(item["word"], []).append(item)
    duplicate_words = {word for word, items in active_by_word.items() if len(items) > 1}
    rendered = []
    for item in mapping["items"]:
        if source and item["source"] != source:
            continue
        if word and item["word"] != word:
            continue
        if item.get("status") == "fallback":
            continue
        if item["word"] in duplicate_words:
            raise ValueError(f"duplicate word across sources: {item['word']}")
        rendered.append(render_item(item))
    write_approved_list(mapping)
    return rendered


def make_contact_sheet(source: str) -> Path:
    mapping = load_mapping()
    items = [item for item in mapping["items"] if item["source"] == source and item.get("status") != "fallback"]
    thumbs: list[tuple[dict[str, Any], Image.Image]] = []
    for item in items:
        info = render_item(item, write_app=False)
        preview = ROOT / info["preview"]
        thumbs.append((item, Image.open(preview).convert("RGBA")))

    thumb = 128
    label_h = 42
    cols = 4
    rows = max(1, (len(thumbs) + cols - 1) // cols)
    sheet = Image.new("RGB", (cols * 180, rows * (thumb + label_h)), "white")
    draw = ImageDraw.Draw(sheet)
    status_colors = {
        "approved": (25, 135, 84),
        "needs_edit": (210, 125, 0),
        "fallback": (120, 120, 120),
        "draft": (60, 100, 190),
    }
    for index, (item, img) in enumerate(thumbs):
        col = index % cols
        row = index // cols
        x = col * 180 + 26
        y = row * (thumb + label_h) + 8
        small = img.resize((thumb, thumb), Image.Resampling.LANCZOS)
        sheet.paste(small, (x, y), small)
        status = item.get("status", "draft")
        draw.text((col * 180 + 12, y + thumb + 3), item["word"], fill=(20, 20, 20))
        draw.text((col * 180 + 12, y + thumb + 20), status, fill=status_colors.get(status, (80, 80, 80)))
    CONTACT_DIR.mkdir(parents=True, exist_ok=True)
    out = CONTACT_DIR / f"{Path(source).stem}.jpg"
    sheet.save(out, quality=94)
    return out


class Handler(BaseHTTPRequestHandler):
    server_version = "WordImageLab/1.0"

    def log_message(self, fmt: str, *args: Any) -> None:
        print(f"{self.address_string()} - {fmt % args}")

    def send_json(self, data: Any, status: int = 200) -> None:
        payload = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def send_error_json(self, message: str, status: int = 400) -> None:
        self.send_json({"error": message}, status)

    def read_body(self) -> Any:
        length = int(self.headers.get("Content-Length", "0"))
        raw = self.rfile.read(length)
        return json.loads(raw.decode("utf-8") or "{}")

    def do_GET(self) -> None:
        try:
            parsed = urlparse(self.path)
            path = parsed.path
            query = parse_qs(parsed.query)
            if path == "/api/sources":
                return self.send_json({"sources": list_sources()})
            if path == "/api/mapping":
                return self.send_json(load_mapping())
            if path == "/api/source-image":
                return self.send_file(safe_source_path(query.get("source", [""])[0]))
            if path == "/api/preview":
                word = safe_word(query.get("word", [""])[0])
                source = query.get("source", [""])[0]
                preview = PREVIEW_DIR / preview_filename(source, word) if source else PREVIEW_DIR / f"{word}.png"
                return self.send_file(preview)
            if path == "/api/contact-sheet":
                source = query.get("source", [""])[0]
                return self.send_file(make_contact_sheet(source))
            if path == "/" or path == "/index.html":
                return self.send_file(UI_DIR / "index.html")
            return self.send_ui_asset(path)
        except FileNotFoundError:
            self.send_error_json("file not found", 404)
        except Exception as exc:
            self.send_error_json(str(exc), 400)

    def do_POST(self) -> None:
        try:
            parsed = urlparse(self.path)
            body = self.read_body()
            if parsed.path == "/api/mapping":
                return self.send_json(save_mapping(body))
            if parsed.path == "/api/seed-source":
                return self.send_json(seed_source(str(body.get("source", "")), bool(body.get("replace", False))))
            if parsed.path == "/api/reset-word":
                return self.send_json(reset_word(str(body.get("source", "")), str(body.get("word", ""))))
            if parsed.path == "/api/default-erases":
                return self.send_json(apply_default_erases(str(body.get("source", ""))))
            if parsed.path == "/api/auto-refine":
                return self.send_json(auto_refine_source(str(body.get("source", "")), body.get("word")))
            if parsed.path == "/api/render":
                source = body.get("source")
                word = body.get("word")
                return self.send_json({"rendered": render_items(source=source, word=word)})
            if parsed.path == "/api/render-all":
                return self.send_json({"rendered": render_items()})
            self.send_error_json("unknown endpoint", 404)
        except Exception as exc:
            self.send_error_json(str(exc), 400)

    def send_ui_asset(self, request_path: str) -> None:
        clean = posixpath.normpath(unquote(request_path)).lstrip("/")
        path = (UI_DIR / clean).resolve()
        if UI_DIR.resolve() not in path.parents:
            raise FileNotFoundError(clean)
        self.send_file(path)

    def send_file(self, path: Path) -> None:
        path = path.resolve()
        if not path.exists() or not path.is_file():
            raise FileNotFoundError(str(path))
        content_type = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
        data = path.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(data)


def ensure_dirs() -> None:
    LAB_DIR.mkdir(parents=True, exist_ok=True)
    PREVIEW_DIR.mkdir(parents=True, exist_ok=True)
    CONTACT_DIR.mkdir(parents=True, exist_ok=True)
    APP_WORD_DIR.mkdir(parents=True, exist_ok=True)
    if not MAPPING_FILE.exists():
        write_json(MAPPING_FILE, {"items": []})
    if not APPROVED_FILE.exists():
        write_json(APPROVED_FILE, {"words": []})


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8765)
    args = parser.parse_args()
    ensure_dirs()
    server = ThreadingHTTPServer((args.host, args.port), Handler)
    print(f"Word Image Lab running at http://{args.host}:{args.port}")
    print("Press Ctrl+C to stop.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
