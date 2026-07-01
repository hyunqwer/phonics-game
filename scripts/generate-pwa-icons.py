from pathlib import Path
from PIL import Image, ImageDraw, ImageFont


OUT_DIR = Path("public/icons")
OUT_DIR.mkdir(parents=True, exist_ok=True)

FONT_BOLD = Path("C:/Windows/Fonts/arialbd.ttf")


def font(size):
    if FONT_BOLD.exists():
        return ImageFont.truetype(str(FONT_BOLD), size)
    return ImageFont.load_default()


def draw_icon(size=1024, maskable=False):
    scale = size / 1024
    pad = int((92 if maskable else 44) * scale)
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    def xy(values):
        return tuple(int(v * scale) for v in values)

    def rounded(box, radius, fill, outline=None, width=1):
        draw.rounded_rectangle(xy(box), int(radius * scale), fill=fill, outline=outline, width=max(1, int(width * scale)))

    # App tile background: bright game-sky, not a classroom/book palette.
    for y in range(size):
        t = y / max(1, size - 1)
        r = int(115 * (1 - t) + 45 * t)
        g = int(214 * (1 - t) + 171 * t)
        b = int(246 * (1 - t) + 220 * t)
        draw.line([(0, y), (size, y)], fill=(r, g, b, 255))

    # Subtle rounded app boundary and inner glow.
    rounded((pad, pad, 1024 - pad, 1024 - pad), 210, (255, 255, 255, 22))
    rounded((pad + 16, pad + 16, 1024 - pad - 16, 1024 - pad - 16), 190, (79, 187, 225, 45))

    # Soft hill/base.
    draw.ellipse(xy((112, 650, 912, 1120)), fill=(54, 180, 135, 255))
    draw.ellipse(xy((170, 684, 854, 1046)), fill=(88, 204, 154, 255))

    # Castle silhouette.
    cream = (255, 248, 220, 255)
    shadow = (31, 70, 96, 55)
    navy = (26, 55, 82, 255)
    gold = (255, 205, 52, 255)
    gold_dark = (202, 132, 16, 255)
    coral = (255, 105, 76, 255)

    draw.rounded_rectangle(xy((295, 430, 729, 742)), int(42 * scale), fill=shadow)
    rounded((310, 390, 714, 708), 42, cream)
    rounded((238, 310, 390, 708), 40, cream)
    rounded((634, 310, 786, 708), 40, cream)
    rounded((424, 262, 600, 708), 44, cream)

    # Battlements.
    for x in [238, 290, 342, 424, 484, 544, 634, 686, 738]:
        rounded((x, 250 if x in [424, 484, 544] else 298, x + 38, 376), 12, cream)

    # Castle details.
    draw.polygon([xy((512, 282))[0:2], xy((592, 390))[0:2], xy((432, 390))[0:2]], fill=(255, 228, 132, 255))
    rounded((474, 536, 550, 708), 36, navy)
    for box in [(278, 424, 326, 486), (700, 424, 748, 486), (456, 414, 496, 470), (528, 414, 568, 470)]:
        rounded(box, 18, (89, 190, 227, 255))

    # Flag.
    draw.line([xy((599, 258))[0:2], xy((599, 176))[0:2]], fill=navy, width=max(4, int(8 * scale)))
    draw.polygon([xy((603, 178))[0:2], xy((710, 206))[0:2], xy((603, 242))[0:2]], fill=coral)

    # Quest key in the foreground.
    draw.line([xy((336, 742))[0:2], xy((655, 564))[0:2]], fill=(127, 74, 15, 70), width=max(1, int(76 * scale)))
    draw.line([xy((326, 718))[0:2], xy((650, 536))[0:2]], fill=gold_dark, width=max(1, int(82 * scale)))
    draw.line([xy((326, 718))[0:2], xy((650, 536))[0:2]], fill=gold, width=max(1, int(58 * scale)))
    draw.ellipse(xy((238, 626, 410, 798)), fill=gold_dark)
    draw.ellipse(xy((260, 642, 388, 770)), fill=gold)
    draw.ellipse(xy((298, 680, 350, 732)), fill=(255, 247, 178, 255))
    draw.rectangle(xy((638, 506, 736, 568)), fill=gold)
    draw.rectangle(xy((698, 554, 744, 612)), fill=gold)
    draw.rectangle(xy((638, 556, 688, 604)), fill=gold_dark)

    # Phonics mark.
    q_font = font(int(238 * scale))
    draw.text(xy((510, 678)), "Q", font=q_font, anchor="mm", fill=(255, 255, 255, 235), stroke_width=max(1, int(12 * scale)), stroke_fill=navy)
    draw.text(xy((510, 670)), "Q", font=q_font, anchor="mm", fill=(255, 255, 255, 255), stroke_width=max(1, int(6 * scale)), stroke_fill=(37, 91, 127, 255))

    # Sound sparkle cues.
    for cx, cy, rr in [(794, 295, 13), (828, 344, 8), (772, 378, 7)]:
        draw.ellipse(xy((cx - rr, cy - rr, cx + rr, cy + rr)), fill=(255, 255, 255, 210))
    draw.arc(xy((742, 226, 884, 368)), 300, 24, fill=(255, 255, 255, 200), width=max(2, int(9 * scale)))
    draw.arc(xy((716, 198, 920, 402)), 305, 22, fill=(255, 255, 255, 140), width=max(2, int(7 * scale)))

    return img


def save_png(path, size, maskable=False):
    base = draw_icon(1024, maskable=maskable)
    out = base.resize((size, size), Image.Resampling.LANCZOS)
    out.save(OUT_DIR / path)


def save_svg():
    svg = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" role="img" aria-label="Yoon's Phonics Quest icon">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#73d6f6"/>
      <stop offset="1" stop-color="#2dabdc"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="1024" rx="210" fill="url(#sky)"/>
  <ellipse cx="512" cy="884" rx="400" ry="234" fill="#36b487"/>
  <ellipse cx="512" cy="872" rx="342" ry="181" fill="#58cc9a"/>
  <g fill="#fff8dc">
    <rect x="310" y="390" width="404" height="318" rx="42"/>
    <rect x="238" y="310" width="152" height="398" rx="40"/>
    <rect x="634" y="310" width="152" height="398" rx="40"/>
    <rect x="424" y="262" width="176" height="446" rx="44"/>
    <rect x="238" y="298" width="38" height="78" rx="12"/>
    <rect x="290" y="298" width="38" height="78" rx="12"/>
    <rect x="342" y="298" width="38" height="78" rx="12"/>
    <rect x="424" y="250" width="38" height="126" rx="12"/>
    <rect x="484" y="250" width="38" height="126" rx="12"/>
    <rect x="544" y="250" width="38" height="126" rx="12"/>
    <rect x="634" y="298" width="38" height="78" rx="12"/>
    <rect x="686" y="298" width="38" height="78" rx="12"/>
    <rect x="738" y="298" width="38" height="78" rx="12"/>
  </g>
  <path d="M512 282l80 108H432z" fill="#ffe484"/>
  <rect x="474" y="536" width="76" height="172" rx="36" fill="#1a3752"/>
  <g fill="#59bee3">
    <rect x="278" y="424" width="48" height="62" rx="18"/>
    <rect x="700" y="424" width="48" height="62" rx="18"/>
    <rect x="456" y="414" width="40" height="56" rx="18"/>
    <rect x="528" y="414" width="40" height="56" rx="18"/>
  </g>
  <path d="M599 258V176" stroke="#1a3752" stroke-width="8" stroke-linecap="round"/>
  <path d="M603 178l107 28-107 36z" fill="#ff694c"/>
  <path d="M326 718l324-182" stroke="#ca8410" stroke-width="82" stroke-linecap="round"/>
  <path d="M326 718l324-182" stroke="#ffcd34" stroke-width="58" stroke-linecap="round"/>
  <circle cx="324" cy="712" r="86" fill="#ca8410"/>
  <circle cx="324" cy="706" r="64" fill="#ffcd34"/>
  <circle cx="324" cy="706" r="26" fill="#fff7b2"/>
  <path d="M638 506h98v62h-98zM698 554h46v58h-46z" fill="#ffcd34"/>
  <text x="512" y="724" text-anchor="middle" font-family="Arial, sans-serif" font-weight="900" font-size="238" fill="#fff" stroke="#255b7f" stroke-width="12">Q</text>
  <g fill="none" stroke="#fff" stroke-linecap="round">
    <path d="M742 297a76 76 0 0 1 97-56" stroke-width="9" opacity=".78"/>
    <path d="M716 300a111 111 0 0 1 142-82" stroke-width="7" opacity=".55"/>
  </g>
</svg>
"""
    (OUT_DIR / "ypq-icon.svg").write_text(svg, encoding="utf-8")


if __name__ == "__main__":
    save_svg()
    save_png("icon-192.png", 192)
    save_png("icon-512.png", 512)
    save_png("icon-maskable-512.png", 512, maskable=True)
    save_png("apple-touch-icon.png", 180)
    save_png("favicon-32.png", 32)
    print(f"Generated PWA icons in {OUT_DIR.resolve()}")
