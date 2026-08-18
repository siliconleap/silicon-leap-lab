#!/usr/bin/env python3
"""把 scenes.md 构建成带字幕的成片。

用法:
    build-video.py <drafts/youtube 目录> [选项]

选项:
    --dry-run       只解析和校验, 不生成任何文件
    --voice NAME    TTS 音色, 默认 Tingting (macOS say)
    --rate N        语速, 默认 180 字/分
    --burn          把字幕烧进画面 (需要 libass)。默认只输出外挂 srt
    --size WxH      输出尺寸, 默认 1920x1080

设计:
    scenes.md 是唯一的源。时长不写在源里——TTS 跑完才知道每段多长, 总长是
    加出来的。所以顺序必须是: 配音 → 拿到真实时长 → 铺画面 → 生成字幕。
    反过来 (先定时长再配音) 就要对轴, 而对轴是人干的活。

    字幕不是单独一道工序。旁白文本就是字幕内容, 音频时长就是字幕时间码,
    两者同源, 不可能对不上。

    剪辑退化成 concat: 画面是静态图和 5 秒 B-roll, 没有多轨也没有转场
    (youtube.md: 不要用转场和音乐掩盖信息不足)。确定性的部分全在这里,
    人只需要审 scenes.md 的文案和选图。

产物 (<目录>/build/):
    audio/NN.aiff      逐 scene 配音
    clips/NN.mp4       逐 scene 画面, 时长对齐配音
    subtitles.srt      外挂字幕
    final.mp4          成片
    manifest.json      每个 scene 的实际时长与来源, 供复核
"""

import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

LEVELS = {"一手", "复现", "示意", "缺"}
SCENE_RE = re.compile(r"^###\s+(S\d+)\s+·\s+(.+?)\s*$")
FIELD_RE = re.compile(r"^\*\*(旁白|画面|证据级别|B-roll)：\*\*\s*(.*)$")
# 拆句给字幕用。一条字幕最多一句, 太长了手机上看不清。
SENT_RE = re.compile(r"[^。！？!?\n]+[。！？!?]?")


def die(msg):
    print(f"错误: {msg}", file=sys.stderr)
    sys.exit(1)


def run(cmd, **kw):
    return subprocess.run(cmd, check=True, capture_output=True, text=True, **kw)


def parse_scenes(path):
    """解析 scenes.md。格式约定写在模板里, 这里只认那一种。"""
    scenes = []
    cur = None
    field = None
    in_scenes = False

    for lineno, raw in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
        line = raw.rstrip()

        # 「## 格式约定」里有示例 scene, 不能当真。只认 `## Scenes` 之后的。
        if line.startswith("## "):
            in_scenes = line.strip() == "## Scenes"
            if not in_scenes and cur:
                scenes.append(cur)
                cur = None
            continue
        if not in_scenes:
            continue

        m = SCENE_RE.match(line)
        if m:
            if cur:
                scenes.append(cur)
            cur = {
                "id": m.group(1),
                "title": m.group(2),
                "旁白": "",
                "画面": "",
                "证据级别": "",
                "B-roll": "",
                "line": lineno,
            }
            field = None
            continue

        if cur is None:
            continue

        m = FIELD_RE.match(line)
        if m:
            field = m.group(1)
            cur[field] = m.group(2).strip()
            if field != "旁白":
                field = None
            continue

        if field == "旁白":
            if line.strip():
                cur["旁白"] = (cur["旁白"] + "\n" + line.strip()).strip()
            elif cur["旁白"]:
                field = None

    if cur:
        scenes.append(cur)
    return scenes


def validate(scenes, base):
    """构建前把能确定的问题全报出来, 不要跑到一半才失败。"""
    errs = []
    if not scenes:
        errs.append("没有解析到任何 scene——检查 `## Scenes` 标题和 `### SNN · 标题` 格式")

    for s in scenes:
        tag = f"{s['id']} (第 {s['line']} 行)"
        text = s["旁白"]

        if not text:
            errs.append(f"{tag}: 旁白为空")
        if "{{" in text:
            errs.append(f"{tag}: 旁白里还有未填的 {{{{占位符}}}}")
        if "TODO" in text:
            errs.append(f"{tag}: 旁白里有 TODO——结论必须由作者写完")

        level = s["证据级别"]
        if level not in LEVELS:
            errs.append(f"{tag}: 证据级别 '{level}' 不在 {sorted(LEVELS)} 内")
        elif level == "缺":
            errs.append(f"{tag}: 证据级别为「缺」——补素材或删掉这个 scene, 不许用示意冒充")

        shot = s["画面"]
        if not shot or "{{" in shot:
            errs.append(f"{tag}: 画面未指定")
        elif shot.startswith("记录:"):
            errs.append(f"{tag}: 画面是 `{shot}`——会话记录要先渲染成图, 跑 render.sh 后填 PNG 路径")
        elif not (base / shot).exists() and not Path(shot).exists():
            errs.append(f"{tag}: 画面文件不存在: {shot}")

    return errs


def resolve(base, ref):
    p = base / ref
    return p if p.exists() else Path(ref)


def duration(path):
    out = run([
        "ffprobe", "-v", "error", "-show_entries", "format=duration",
        "-of", "default=nw=1:nk=1", str(path),
    ]).stdout.strip()
    return float(out)


def srt_time(sec):
    ms = int(round(sec * 1000))
    h, ms = divmod(ms, 3600000)
    m, ms = divmod(ms, 60000)
    s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def split_sentences(text):
    parts = [m.group(0).strip() for m in SENT_RE.finditer(text)]
    return [p for p in parts if p] or [text.strip()]


def make_srt(scenes, out):
    """字幕时间码来自配音时长, 句内按字符数比例切分。

    比例切分不是精确对齐——一句话里字符密度不均。但误差在半秒内, 而精确
    对齐要么靠强制对齐模型, 要么靠人对轴。这里选够用的那个。
    """
    lines = []
    n = 0
    t = 0.0
    for s in scenes:
        sents = split_sentences(s["旁白"])
        total = sum(len(x) for x in sents) or 1
        cursor = t
        for sent in sents:
            span = s["duration"] * len(sent) / total
            n += 1
            lines.append(f"{n}\n{srt_time(cursor)} --> {srt_time(cursor + span)}\n{sent}\n")
            cursor += span
        t += s["duration"]
    out.write_text("\n".join(lines), encoding="utf-8")
    return n


def make_clip(shot, dur, out, size):
    """画面铺满配音时长。图片就 loop, 视频短了定格末帧、长了截断。"""
    w, h = size.split("x")
    pad = (
        f"scale={w}:{h}:force_original_aspect_ratio=decrease,"
        f"pad={w}:{h}:(ow-iw)/2:(oh-ih)/2:color=#1a1a19,setsar=1,fps=24"
    )
    if shot.suffix.lower() in (".mp4", ".mov", ".webm"):
        cmd = ["ffmpeg", "-y", "-i", str(shot), "-an",
               "-vf", f"{pad},tpad=stop_mode=clone:stop_duration={dur}"]
    else:
        cmd = ["ffmpeg", "-y", "-loop", "1", "-i", str(shot), "-vf", pad]
    cmd += ["-t", f"{dur:.3f}", "-c:v", "libx264", "-pix_fmt", "yuv420p", str(out)]
    run(cmd)


def main(argv):
    if not argv or argv[0].startswith("--"):
        print(__doc__.strip(), file=sys.stderr)
        return 2

    base = Path(argv[0]).resolve()
    dry = "--dry-run" in argv
    burn = "--burn" in argv

    def opt(name, default):
        return argv[argv.index(name) + 1] if name in argv else default

    voice = opt("--voice", "Tingting")
    rate = opt("--rate", "180")
    size = opt("--size", "1920x1080")

    src = base / "scenes.md"
    if not src.exists():
        die(f"找不到 {src}")

    scenes = parse_scenes(src)
    errs = validate(scenes, base)
    if errs:
        print(f"校验未通过, {len(errs)} 个问题:\n", file=sys.stderr)
        for e in errs:
            print(f"  - {e}", file=sys.stderr)
        return 1

    print(f"解析到 {len(scenes)} 个 scene, 校验通过")
    for s in scenes:
        print(f"  {s['id']}  {s['证据级别']:<2}  {len(s['旁白']):>3} 字  {s['画面']}")

    if dry:
        print("\n--dry-run: 未生成文件")
        return 0

    for tool in ("ffmpeg", "ffprobe"):
        if not shutil.which(tool):
            die(f"缺少 {tool}——`brew install ffmpeg`")
    if not shutil.which("say"):
        die("缺少 say (macOS TTS)——换 TTS 请改本脚本的 tts 段")

    build = base / "build"
    for sub in ("audio", "clips"):
        (build / sub).mkdir(parents=True, exist_ok=True)

    print("\n配音…")
    for s in scenes:
        wav = build / "audio" / f"{s['id']}.aiff"
        run(["say", "-v", voice, "-r", rate, "-o", str(wav), s["旁白"]])
        s["duration"] = duration(wav)
        print(f"  {s['id']}  {s['duration']:6.2f}s")

    total = sum(s["duration"] for s in scenes)
    print(f"总时长 {total // 60:.0f}:{total % 60:04.1f}")

    print("\n铺画面…")
    for s in scenes:
        clip = build / "clips" / f"{s['id']}.mp4"
        make_clip(resolve(base, s["画面"]), s["duration"], clip, size)
        print(f"  {s['id']}  {s['画面']}")

    srt = build / "subtitles.srt"
    n = make_srt(scenes, srt)
    print(f"\n字幕 {n} 条 → {srt.name}")

    concat = build / "concat.txt"
    concat.write_text(
        "".join(f"file 'clips/{s['id']}.mp4'\n" for s in scenes), encoding="utf-8"
    )
    audio_list = build / "audio.txt"
    audio_list.write_text(
        "".join(f"file 'audio/{s['id']}.aiff'\n" for s in scenes), encoding="utf-8"
    )

    print("拼接…")
    final = build / "final.mp4"
    cmd = ["ffmpeg", "-y",
           "-f", "concat", "-safe", "0", "-i", str(concat),
           "-f", "concat", "-safe", "0", "-i", str(audio_list)]
    if burn:
        cmd += ["-vf", f"subtitles={srt}:force_style='FontSize=22,MarginV=48'"]
        cmd += ["-c:v", "libx264", "-pix_fmt", "yuv420p"]
    else:
        cmd += ["-c:v", "copy"]
    cmd += ["-c:a", "aac", "-shortest", str(final)]
    run(cmd, cwd=build)

    (build / "manifest.json").write_text(
        json.dumps(
            {
                "total_seconds": round(total, 2),
                "burned_subtitles": burn,
                "scenes": [
                    {k: s[k] for k in ("id", "title", "证据级别", "画面", "duration")}
                    for s in scenes
                ],
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )

    print(f"\n成片 {final}")
    print(f"时长 {total // 60:.0f}:{total % 60:04.1f}, 字幕 {'已烧录' if burn else '外挂 subtitles.srt'}")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main(sys.argv[1:]))
    except subprocess.CalledProcessError as e:
        die(f"{e.cmd[0]} 失败:\n{e.stderr.strip()[-800:]}")
