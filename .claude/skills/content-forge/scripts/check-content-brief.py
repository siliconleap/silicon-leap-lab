#!/usr/bin/env python3
"""检查 content-brief.md 是否具备平台渲染所需的确定性字段。"""

import sys
from pathlib import Path

REQUIRED = {
    "背景": ("背景与问题", "background"),
    "叙事": ("读者痛点", "叙事线", "narrative"),
    "事实": ("本次发生了什么", "what happened"),
    "实践": ("实践清单", "practice ledger"),
    "边界": ("结论边界", "boundary"),
    "确认": ("作者确认", "author confirmation"),
}


def main() -> int:
    if len(sys.argv) != 2:
        print("用法: check-content-brief.py <实验目录>", file=sys.stderr)
        return 2
    brief = Path(sys.argv[1]) / "content-brief.md"
    if not brief.is_file():
        print(f"FAIL  缺少 {brief}")
        return 1

    text = brief.read_text(encoding="utf-8")
    lower = text.lower()
    failed = []
    for label, markers in REQUIRED.items():
        if not any(marker.lower() in lower for marker in markers):
            failed.append(label)

    if "已确认：是" not in text or "可公开：是" not in text:
        failed.append("作者确认未同时包含“已确认：是；可公开：是”")

    if failed:
        for item in failed:
            print(f"FAIL  内容简报缺少：{item}")
        return 1
    print("内容简报字段与作者确认：通过")
    return 0


if __name__ == "__main__":
    sys.exit(main())
