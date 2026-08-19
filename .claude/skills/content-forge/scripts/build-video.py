#!/usr/bin/env python3
"""把 scenes.md 构建成带字幕的成片。

用法:
    build-video.py <drafts/youtube 目录> [选项]

选项:
    --dry-run       只解析和校验, 不生成任何文件
    --tts ENGINE    say (默认, macOS 自带) | tencent (腾讯云)
    --voice NAME    say 用音色名, 默认 Tingting；tencent 用 VoiceType 数字, 默认 101016
    --rate N        say 的语速, 默认 180 字/分。tencent 忽略这项
    --burn          把字幕烧进画面 (需要 libass)。默认只输出外挂 srt
    --size WxH      输出尺寸, 默认 1920x1080

腾讯云 TTS 需要环境变量 (两种写法都认):
    TENCENTCLOUD_SECRET_ID   或 TENCENT_CLOUD_SECRET_ID
    TENCENTCLOUD_SECRET_KEY  或 TENCENT_CLOUD_SECRET_KEY

密钥不要写进仓库, 也不要贴进跟 agent 的对话——会话记录会被 extract-timeline.py
提取成公开的实验素材。

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


def run_retry(cmd, timeout=90, tries=3, **kw):
    """macOS 的 say 偶尔会挂住不返回——连着调十几次就可能遇上一次。

    单独重跑同一句永远是好的, 所以这不是文本的问题, 不用去改旁白。杀掉重试
    即可, 但必须有上限: 静默重试到天荒地老比失败更难查。
    """
    for i in range(1, tries + 1):
        try:
            return subprocess.run(
                cmd, check=True, capture_output=True, text=True, timeout=timeout, **kw
            )
        except subprocess.TimeoutExpired:
            if i == tries:
                die(f"{cmd[0]} 连续 {tries} 次超时 (每次 {timeout}s), 放弃")
            print(f"    {cmd[0]} 超时, 重试 {i}/{tries - 1}", file=sys.stderr)


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
            # 旁白一直收到下一个 `**字段：**` 或下一个 scene 为止。空行是段落
            # 分隔, 不是结束标记——按空行结束会把多段旁白截成第一段, 而配音
            # 短了半截是很难看出来的, 只有时长明显偏短才露馅。
            if line.strip() and line.strip() != "---":
                cur["旁白"] = (cur["旁白"] + "\n" + line.strip()).strip()

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


def tencent_creds():
    """腾讯云凭据。两种变量名都认——官方 SDK 用 TENCENTCLOUD_, 但手写
    export 时很多人会写成 TENCENT_CLOUD_, 为一个下划线debug不值得。"""
    import os

    def pick(*names):
        for n in names:
            v = os.environ.get(n)
            if v:
                return v
        return None

    sid = pick("TENCENTCLOUD_SECRET_ID", "TENCENT_CLOUD_SECRET_ID")
    skey = pick("TENCENTCLOUD_SECRET_KEY", "TENCENT_CLOUD_SECRET_KEY")
    return sid, skey


def tencent_tts(text, out, voice, tmp_dir):
    """腾讯云语音合成 (TextToVoice)。

    走 REST + TC3 签名, 不装 SDK——这条流水线的前提是零额外依赖, 为一个
    接口拉一整个 SDK 不划算。

    短文本合成单次上限 150 个汉字, 而旁白经常超。所以按句切开逐句合成,
    再用 ffmpeg 拼回一个 scene 的音频。句子边界本来就是换气的地方, 拼接
    听不出来。
    """
    import base64
    import hashlib
    import hmac
    import json as _json
    import os
    import time
    import urllib.request

    sid, skey = tencent_creds()

    host, service, version, action = "tts.tencentcloudapi.com", "tts", "2019-08-23", "TextToVoice"

    def one(sentence, idx):
        payload = _json.dumps({
            "Text": sentence,
            "SessionId": f"{int(time.time())}-{idx}",
            "VoiceType": int(voice),
            "Codec": "mp3",
            "SampleRate": 16000,
        }, ensure_ascii=False)

        ts = int(time.time())
        date = time.strftime("%Y-%m-%d", time.gmtime(ts))
        canonical = (
            f"POST\n/\n\ncontent-type:application/json; charset=utf-8\nhost:{host}\n\n"
            f"content-type;host\n{hashlib.sha256(payload.encode()).hexdigest()}"
        )
        scope = f"{date}/{service}/tc3_request"
        to_sign = (
            f"TC3-HMAC-SHA256\n{ts}\n{scope}\n"
            f"{hashlib.sha256(canonical.encode()).hexdigest()}"
        )

        def sign(key, msg):
            return hmac.new(key, msg.encode(), hashlib.sha256).digest()

        k = sign(sign(sign(("TC3" + skey).encode(), date), service), "tc3_request")
        sig = hmac.new(k, to_sign.encode(), hashlib.sha256).hexdigest()

        req = urllib.request.Request(
            f"https://{host}",
            data=payload.encode(),
            headers={
                "Content-Type": "application/json; charset=utf-8",
                "Host": host,
                "X-TC-Action": action,
                "X-TC-Version": version,
                "X-TC-Timestamp": str(ts),
                "Authorization": (
                    f"TC3-HMAC-SHA256 Credential={sid}/{scope}, "
                    f"SignedHeaders=content-type;host, Signature={sig}"
                ),
            },
        )
        with urllib.request.urlopen(req, timeout=60) as resp:
            body = _json.loads(resp.read())
        r = body.get("Response", {})
        if "Error" in r:
            die(f"腾讯云 TTS: {r['Error'].get('Code')} {r['Error'].get('Message')}")
        return base64.b64decode(r["Audio"])

    sentences = split_sentences(text)
    parts = []
    for i, sent in enumerate(sentences):
        part = tmp_dir / f"{out.stem}-{i:02d}.mp3"
        part.write_bytes(one(sent, i))
        parts.append(part)

    if len(parts) == 1:
        parts[0].replace(out)
        return

    lst = tmp_dir / f"{out.stem}-parts.txt"
    lst.write_text("".join(f"file '{p.name}'\n" for p in parts), encoding="utf-8")
    run(["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", str(lst),
         "-c", "copy", str(out)], cwd=tmp_dir)
    for p in parts:
        p.unlink()
    lst.unlink()


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
    # 画面基本是静止的, stillimage + veryfast 能把编码时间压掉一个量级,
    # 而这种素材看不出画质差别。
    cmd += ["-t", f"{dur:.3f}", "-c:v", "libx264", "-preset", "veryfast",
            "-tune", "stillimage", "-pix_fmt", "yuv420p", str(out)]
    run_retry(cmd, timeout=180)


def main(argv):
    if not argv or argv[0].startswith("--"):
        print(__doc__.strip(), file=sys.stderr)
        return 2

    base = Path(argv[0]).resolve()
    dry = "--dry-run" in argv
    burn = "--burn" in argv

    def opt(name, default):
        return argv[argv.index(name) + 1] if name in argv else default

    engine = opt("--tts", "say")
    voice = opt("--voice", "101016" if engine == "tencent" else "Tingting")
    rate = opt("--rate", "180")
    size = opt("--size", "1920x1080")
    if engine not in ("say", "tencent"):
        die(f"--tts 只支持 say / tencent, 收到 '{engine}'")

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
    if engine == "say" and not shutil.which("say"):
        die("缺少 say (macOS TTS)——用 --tts tencent 换腾讯云")
    if engine == "tencent":
        sid, skey = tencent_creds()
        if not sid or not skey:
            die("腾讯云 TTS 缺少凭据: 需要 TENCENTCLOUD_SECRET_ID / _KEY "
                "(或 TENCENT_CLOUD_SECRET_ID / _KEY)")

    build = base / "build"
    for sub in ("audio", "clips"):
        (build / sub).mkdir(parents=True, exist_ok=True)

    print(f"\n配音（{engine}）…")
    ext = "mp3" if engine == "tencent" else "aiff"
    for s in scenes:
        wav = build / "audio" / f"{s['id']}.{ext}"
        if engine == "tencent":
            tencent_tts(s["旁白"], wav, voice, build / "audio")
        else:
            run_retry(["say", "-v", voice, "-r", rate, "-o", str(wav), s["旁白"]], timeout=60)
        s["audio"] = wav.name
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
        "".join(f"file 'audio/{s['audio']}'\n" for s in scenes), encoding="utf-8"
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
