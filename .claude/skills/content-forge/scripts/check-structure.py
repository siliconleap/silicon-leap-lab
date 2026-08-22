#!/usr/bin/env python3
"""平台稿结构校验：认知开篇、实践清单、边界收尾，以及行文跳不跳。

用法：
    python3 check-structure.py <实验目录>

退出码 0 表示通过（可能带 WARN），非 0 表示有 FAIL 必须修。

这个脚本只查确定性的东西：该有的段落在不在、清单有没有失败行、段落是不是
长到读不动。它查不了「读起来顺不顺」，那仍然是审核 sub-agent 的活。
"""

import re
import sys
from pathlib import Path

# 长文：认知 + 实践清单 + 边界，三样都要有
LONG_FORM = ("drafts/site/blog.md", "drafts/site/blog-zh.md", "drafts/wechat/article.md")
# 短文：清单可以是无序列表，认知可以短，但边界仍要写
SHORT_FORM = ("drafts/xiaohongshu/note.md",)
# 片段：只要求实践清单，其余由主文承担
FRAGMENT = ("drafts/github/readme-section.md",)

PRACTICE_HEADERS = (
    ("实践", "是否有效", "是否可复制"),
    ("practice", "effective", "transfers"),
)
NEGATIVE_MARKERS = ("目前无效", "不可复制", "not yet", "no |", "无效")
BOUNDARY_MARKERS = ("边界", "boundary")

fails: list[str] = []
warns: list[str] = []


def body_of(text: str) -> str:
    """去掉 frontmatter 和平台稿的元数据尾巴（配图清单 / 发布备注 / 标签）。"""
    if text.startswith("---\n"):
        text = text.split("---\n", 2)[-1]
    for cut in ("## 配图清单", "## 发布备注", "## 标签", "## 复现", "## Reproduce"):
        text = text.split(cut)[0]
    return text


def opening_of(body: str) -> str:
    """开篇 = 正文开始处到第一个小节标题之间。

    公众号和小红书稿把正文包在「## 正文」下面，站内长文没有这层包装，
    两种都要认，否则开篇会被切成空字符串。
    """
    if "## 正文" in body:
        body = body.split("## 正文", 1)[1]
    parts = re.split(r"^#{2,4} ", body, maxsplit=1, flags=re.M)
    head = parts[0]
    # 小红书没有小节标题，用「下面是具体过程」这类过渡句收尾开篇。
    for marker in ("下面是", "下面按", "具体是这样", "具体过程"):
        if marker in head:
            line_end = head.index(marker)
            return head[: head.find("\n", line_end) + 1 or len(head)]
    return head


def scale(text: str) -> float:
    """英文一个词摊成好几个字符，字数阈值按语言放宽。"""
    if not text:
        return 1.0
    cjk = sum(1 for ch in text if "\u4e00" <= ch <= "\u9fff")
    return 1.0 if cjk > len(text) * 0.2 else 2.4


def has_practice_table(body: str) -> bool:
    for header in PRACTICE_HEADERS:
        for line in body.splitlines():
            low = line.lower()
            if all(col in low for col in header):
                return True
    # 小红书那种无序列表：一行里同时出现「有效」和「复制」
    hits = [l for l in body.splitlines() if l.lstrip().startswith("-") and "复制" in l]
    return len(hits) >= 3


def check(path: Path, rel: str, kind: str) -> None:
    text = path.read_text(encoding="utf-8")
    body = body_of(text)
    opening = opening_of(body)

    if kind in ("long", "short"):
        # 认知：开篇里至少两条独立判断。长文用加粗，短文允许 emoji 路标带序号。
        bold = len(re.findall(r"\*\*[^*]+\*\*", opening))
        numbered = len(re.findall(r"^[^\n]*(?:一、|二、|三、|📌)", opening, flags=re.M))
        if max(bold, numbered) < 2:
            fails.append(f"{rel}: 开篇没有两条以上认知（加粗判断或编号条目）")
        limit = int(900 * scale(opening))
        if len(opening.strip()) > limit:
            warns.append(f"{rel}: 开篇 {len(opening.strip())} 字，认知该是判断不是铺垫")

    if kind in ("long", "short", "fragment"):
        if not has_practice_table(body):
            fails.append(f"{rel}: 缺实践清单（实践 / 是否有效 / 是否可复制）")
        elif not any(m in body.lower() for m in NEGATIVE_MARKERS):
            fails.append(f"{rel}: 实践清单里没有一条失败或不可复制的，这种表读者不信")

    if kind in ("long", "short"):
        if not any(m in body.lower() for m in BOUNDARY_MARKERS):
            fails.append(f"{rel}: 没有边界段（样本多大、什么不能外推）")

    # 行文跳跃的可测代理：段落过长，或整节没有分段
    for para in [p.strip() for p in body.split("\n\n") if p.strip()]:
        if para.startswith(("|", "!", ">", "-", "*", "#")) or "](" in para:
            continue
        if len(para) > int(320 * scale(para)):
            warns.append(f"{rel}: 有段落 {len(para)} 字，拆开更好读：{para[:24]}…")


def main() -> int:
    if len(sys.argv) != 2:
        print("用法: check-structure.py <实验目录>", file=sys.stderr)
        return 2
    root = Path(sys.argv[1])
    if not root.is_dir():
        print(f"目录不存在: {root}", file=sys.stderr)
        return 2

    checked = 0
    for rel, kind in [(f, "long") for f in LONG_FORM] + [
        (f, "short") for f in SHORT_FORM
    ] + [(f, "fragment") for f in FRAGMENT]:
        path = root / rel
        if not path.exists():
            continue
        checked += 1
        check(path, rel, kind)

    if not checked:
        print("没有找到任何平台稿，跳过结构校验")
        return 0

    for w in warns:
        print(f"WARN  {w}")
    for f in fails:
        print(f"FAIL  {f}")

    if fails:
        print(f"\n{checked} 份稿件, {len(fails)} 项失败, {len(warns)} 项警告 —— 修完再报告")
        return 1
    print(f"\n{checked} 份稿件, 结构齐全, {len(warns)} 项警告")
    return 0


if __name__ == "__main__":
    sys.exit(main())
