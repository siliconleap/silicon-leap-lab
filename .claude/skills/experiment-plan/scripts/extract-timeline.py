#!/usr/bin/env python3
"""从 agent 会话记录里提取真人输入的时间线。

用法:
    extract-timeline.py <jsonl 或目录> [...] [--cwd 子串] [--full] [--since YYYY-MM-DD]

为什么需要这个:
    对话式工作没有「操作过程」可录屏——终端里没有人的动作。但会话记录本身
    就是过程证据: 每一句真人输入都带时间戳, 决策、犹豫、中断、返工全在里面。
    这是 notes/ 和 recordings/ 之外第三类原始素材, 而且是唯一一类事后还能补的。

    产物写进实验的 notes/, 作为一手证据。不要手写这个文件——手写的是回忆,
    提取的是记录。

支持两种格式, 自动识别:
    Claude Code   ~/.claude/projects/<项目>/*.jsonl
    Codex CLI     ~/.codex/sessions/YYYY/MM/DD/rollout-*.jsonl

一定要用 --cwd:
    Claude 的记录按项目分目录, 但 Codex 的按日期分目录——同一天所有项目的
    会话混在一起。不过滤就会把别的项目的对话抄进实验记录, 而这份产物是要
    公开的。--cwd 按会话的工作目录过滤, 匹配不上的整个文件跳过。

脱敏:
    绝对路径里的用户名一律换成 ~, 因为这份产物要进 git。
"""

import json
import os
import re
import sys
from pathlib import Path

TRUNCATE = 500

# 这些不是真人在说话: 系统注入、skill 正文被当成 user 消息回灌、工具结果。
SKIP_PREFIXES = (
    "<",
    "Base directory for this skill:",
    "Caveat:",
    "Shell cwd was reset",
)

HOME_RE = re.compile(r"/Users/[^/\s\"']+")


def redact(text):
    return HOME_RE.sub("~", text)


def parse_claude(path):
    """Claude Code: type=user, message.content 是 str 或 block 列表。"""
    for line in path.open(encoding="utf-8", errors="replace"):
        try:
            d = json.loads(line)
        except ValueError:
            continue
        if d.get("type") != "user":
            continue
        content = (d.get("message") or {}).get("content")
        if isinstance(content, str):
            text = content
        elif isinstance(content, list):
            text = "".join(
                b.get("text", "")
                for b in content
                if isinstance(b, dict) and b.get("type") == "text"
            )
        else:
            continue
        yield d.get("timestamp", ""), text


def parse_codex(path):
    """Codex CLI: type=event_msg, payload.type=user_message。"""
    for line in path.open(encoding="utf-8", errors="replace"):
        try:
            d = json.loads(line)
        except ValueError:
            continue
        payload = d.get("payload")
        if d.get("type") != "event_msg" or not isinstance(payload, dict):
            continue
        if payload.get("type") != "user_message":
            continue
        yield d.get("timestamp", ""), payload.get("message") or ""


def session_cwd(path):
    """会话的工作目录。Codex 在首行 session_meta, Claude 在每条记录上。

    返回 None 表示探不出来——这种文件在指定了 --cwd 时一律跳过, 宁可漏也
    不要把别的项目的对话混进来。
    """
    with path.open(encoding="utf-8", errors="replace") as fh:
        for i, line in enumerate(fh):
            if i > 50:
                break
            try:
                d = json.loads(line)
            except ValueError:
                continue
            if d.get("cwd"):
                return d["cwd"]
            payload = d.get("payload")
            if isinstance(payload, dict) and payload.get("cwd"):
                return payload["cwd"]
    return None


def collect(path):
    """一个文件可能是任一格式, 两个解析器都跑, 谁有产出用谁。"""
    entries = []
    for parser in (parse_claude, parse_codex):
        entries.extend(parser(path))
        if entries:
            break

    out = []
    for ts, text in entries:
        text = text.strip()
        if not text or text.startswith(SKIP_PREFIXES):
            continue
        out.append((ts, redact(text), path.name))
    return out


def main(argv):
    full = "--full" in argv
    since = argv[argv.index("--since") + 1] if "--since" in argv else ""
    cwd_filter = argv[argv.index("--cwd") + 1] if "--cwd" in argv else ""
    consumed = {since, cwd_filter} - {""}
    targets = [a for a in argv if not a.startswith("--") and a not in consumed]

    if not targets:
        print(__doc__.strip(), file=sys.stderr)
        return 2

    files = []
    for t in targets:
        p = Path(os.path.expanduser(t))
        if p.is_dir():
            files.extend(sorted(p.rglob("*.jsonl")))
        elif p.is_file():
            files.append(p)
        else:
            print(f"跳过 (不存在): {t}", file=sys.stderr)

    if not files:
        print("错误: 没有找到任何 .jsonl", file=sys.stderr)
        return 1

    if cwd_filter:
        kept = []
        for f in files:
            c = session_cwd(f)
            if c is None:
                print(f"跳过 (探不出 cwd): {f.name}", file=sys.stderr)
            elif cwd_filter in c:
                kept.append(f)
        print(f"cwd 过滤 '{cwd_filter}': {len(files)} → {len(kept)} 个文件", file=sys.stderr)
        files = kept
    else:
        print("警告: 未指定 --cwd, 可能混入其他项目的会话", file=sys.stderr)

    rows = []
    for f in files:
        rows.extend(collect(f))
    rows = [r for r in rows if r[0] >= since]
    rows.sort(key=lambda r: r[0])

    if not rows:
        print("错误: 没有提取到任何真人输入", file=sys.stderr)
        return 1

    print("# 会话时间线")
    print()
    print("由 `extract-timeline.py` 从 agent 会话记录提取, 不要手工编辑。")
    print(f"来源 {len(files)} 个文件, 共 {len(rows)} 条真人输入。")
    print(f"跨度 {rows[0][0][:10]} → {rows[-1][0][:10]}。")
    print()
    print("每条都是原话, 只做了路径脱敏。这是一手过程证据: 引用时不必标「复现」。")
    print()

    day = None
    for ts, text, src in rows:
        if ts[:10] != day:
            day = ts[:10]
            print(f"\n## {day}\n")
        if not full and len(text) > TRUNCATE:
            text = text[:TRUNCATE].rstrip() + " …"
        print(f"**{ts[11:19]}** · `{src}`")
        print()
        for para in text.split("\n"):
            print(f"> {para}" if para.strip() else ">")
        print()

    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
