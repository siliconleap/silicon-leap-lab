#!/usr/bin/env python3
"""把会话记录里的原话渲染成记录卡 HTML。

用法:
    make-quote-cards.py <quotes.json> [--size 1920x1080]

输入 JSON 是一个数组, 每项:
    {
      "id":    "S03",                       输出文件名前缀
      "ts":    "2026-08-09 07:11:50",       时间戳, 印在卡上
      "src":   "25865db6….jsonl",           来源文件, 印在卡上
      "quote": "可以，写出来，后续软链我想办法建"
    }

为什么要印时间戳和来源:
    这是一手证据卡, 不是金句海报。观众要能看出这句话是从记录里捞的, 不是
    事后编的——所以出处必须在画面上, 而且原话一个字都不能改。要删就整条不用。

产物是同目录的 <id>-quote.html, 再跑 render.sh 出 PNG。
"""

import html
import json
import sys
from pathlib import Path

TPL = """<!doctype html>
<meta charset="utf-8">
<meta name="render-size" content="{w}x{h}">
<style>
  * {{ margin: 0; padding: 0; box-sizing: border-box; }}
  body {{
    width: {w}px; height: {h}px;
    background: #1a1a19;
    display: flex; flex-direction: column; justify-content: center;
    padding: {pad}px;
    font-family: -apple-system, "PingFang SC", "Helvetica Neue", sans-serif;
  }}
  .meta {{
    font-family: "SF Mono", Menlo, monospace;
    font-size: {meta}px; color: #898781;
    letter-spacing: .02em; margin-bottom: {gap}px;
    display: flex; gap: {meta}px; align-items: baseline;
  }}
  .meta .ts {{ color: #c3c2b7; }}
  .quote {{
    font-size: {size}px; line-height: 1.5; color: #ffffff;
    font-weight: 500; white-space: pre-wrap;
    border-left: {bar}px solid #3987e5; padding-left: {gap}px;
  }}
  .tag {{
    margin-top: {gap}px; font-size: {meta}px; color: #898781;
    font-family: "SF Mono", Menlo, monospace;
  }}
</style>
<div class="meta"><span class="ts">{ts}</span><span>{src}</span></div>
<div class="quote">{quote}</div>
<div class="tag">一手记录 · 原话未改写</div>
"""


def font_size(text, base):
    """字多就缩。卡片是给手机看的, 宁可字大话少。"""
    n = len(text)
    if n <= 30:
        return base
    if n <= 60:
        return int(base * 0.72)
    if n <= 110:
        return int(base * 0.54)
    return int(base * 0.42)


def main(argv):
    if not argv:
        print(__doc__.strip(), file=sys.stderr)
        return 2

    src = Path(argv[0])
    size = argv[argv.index("--size") + 1] if "--size" in argv else "1920x1080"
    w, h = (int(x) for x in size.split("x"))

    items = json.loads(src.read_text(encoding="utf-8"))
    out_dir = src.parent

    for it in items:
        quote = it["quote"].strip()
        page = TPL.format(
            w=w, h=h,
            pad=int(w * 0.07),
            gap=int(w * 0.018),
            bar=max(3, int(w * 0.003)),
            meta=int(w * 0.014),
            size=font_size(quote, int(w * 0.042)),
            ts=html.escape(it["ts"]),
            src=html.escape(it["src"]),
            quote=html.escape(quote),
        )
        dst = out_dir / f"{it['id']}-quote.html"
        dst.write_text(page, encoding="utf-8")
        print(f"ok    {dst.name}  {len(quote)} 字")

    print(f"\n生成 {len(items)} 张, 下一步: scripts/render.sh {out_dir}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
