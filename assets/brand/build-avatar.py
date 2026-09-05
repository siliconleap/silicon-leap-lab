#!/usr/bin/env python3
"""在既有 Silicon Leap 标记下方加 LAB 字样，生成 800x800 的 YouTube 频道头像。

源标记取自 GitHub 账号头像（siliconleap-mark-source.png）。
YouTube 会把头像裁成圆形，脚本会校验内容落在内切圆的安全半径内。

    python3 -m venv .venv && .venv/bin/pip install pillow
    .venv/bin/python assets/brand/build-avatar.py
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).parent
SRC = HERE / "siliconleap-mark-source.png"
OUT = HERE / "youtube-avatar.png"
S = 800
FONT, FONT_INDEX = "/System/Library/Fonts/Avenir Next.ttc", 8  # Avenir Next Heavy
TEXT, MARK_H, LAB_W, GAP, SAFE_R = "LAB", 340, 330, 48, 380

im = Image.open(SRC).convert("L")
im = im.point(lambda p: 255 if p >= 245 else p)  # 清掉近白噪点，保留抗锯齿
mark = im.crop(im.point(lambda p: 255 if p < 245 else 0).getbbox())
mark = Image.merge("RGBA", (Image.new("L", mark.size, 0),) * 3
                   + (Image.eval(mark, lambda p: 255 - p),))
mw, mh = mark.size
mark = mark.resize((round(mw * MARK_H / mh), MARK_H), Image.LANCZOS)
mw, mh = mark.size


def measure(font, track):
    d = ImageDraw.Draw(Image.new("L", (1, 1)))
    w = sum(d.textlength(c, font=font) for c in TEXT) + track * (len(TEXT) - 1)
    return int(w), font.getbbox(TEXT)


size = 200
track = round(size * 0.07)
w, _ = measure(ImageFont.truetype(FONT, size, index=FONT_INDEX), track)
size = round(size * LAB_W / w)
track = round(size * 0.07)
font = ImageFont.truetype(FONT, size, index=FONT_INDEX)
tw, tb = measure(font, track)
th = tb[3] - tb[1]

gw, gh = max(mw, tw), mh + GAP + th
canvas = Image.new("RGBA", (S, S), (255, 255, 255, 255))
ox, oy = (S - gw) // 2, (S - gh) // 2
canvas.alpha_composite(mark, (ox + (gw - mw) // 2, oy))

draw = ImageDraw.Draw(canvas)
x, y = ox + (gw - tw) // 2, oy + mh + GAP - tb[1]
for c in TEXT:
    draw.text((x, y), c, font=font, fill=(0, 0, 0, 255))
    x += draw.textlength(c, font=font) + track

cx = cy = S / 2
worst = max(((px - cx) ** 2 + (py - cy) ** 2) ** 0.5 for px, py in
            [(ox + (gw - mw) // 2, oy), (ox + (gw + mw) // 2, oy),
             (ox + (gw - tw) // 2, oy + gh), (ox + (gw + tw) // 2, oy + gh)])
assert worst < SAFE_R, f"内容超出圆形安全区：{worst:.0f} > {SAFE_R}"
print(f"最远角 {worst:.0f} / 安全半径 {SAFE_R}")

out = canvas.convert("RGB")
out.save(OUT)
for sz in (98, 48):  # YouTube 常见小尺寸，用于目检可读性
    out.resize((sz, sz), Image.LANCZOS).save(HERE / f"preview-{sz}.png")
print("saved", OUT)
