#!/usr/bin/env python3
"""把 scenes.md 构建成带字幕的成片。

状态: 暂不启用。视频主线正在迁往 editorial-video (Remotion + 分层素材),
那边能做分层、关键帧和转场, 这里做不到。本脚本保留为轻量通道——零 Node
依赖, ffmpeg 直出, 适合不需要动画的片子。下面的音频时间轴逻辑 (裁静音、
受控停顿、逐句真实时长) 先在这里验证, 再移植到 editorial-video。

用法:
    build-video.py <drafts/youtube 目录> [选项]

选项:
    --dry-run       只解析和校验, 不生成任何文件
    --tts ENGINE    say (默认, macOS 自带) | tencent (腾讯云)
    --voice NAME    say 用音色名, 默认 Tingting；tencent 用 VoiceType 数字, 默认 501000
    --rate N        say 的语速, 默认 180 字/分。tencent 不用这项
    --speed N       tencent 语速, -2~2, 0 是正常, 正数更快。默认 0。
                    实测 501000 音色: Speed=0 约 331 字/分, Speed=1.0 约 396
                    字/分——后者明显赶。旧默认值是 1.0, 已改回 0
    --gap N         句间停顿秒数, 默认 0.25。合成器自带的头尾静音会被裁掉,
                    停顿全部由这个参数补回
    --burn          把字幕烧进画面 (需要 libass)。默认只输出外挂 srt
    --no-motion     关掉 Ken Burns 推拉, 画面完全静止
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
    两者同源, 不可能对不上。而且旁白是按句合成的, 每句多长是合成端的真值,
    量一下就有——不需要强制对齐模型去反推已经知道的事。

    停顿是参数, 不是副产品。合成器给每句都填了头尾静音, 拼起来每个句子
    边界就攒下半秒空白。裁掉再按标点补回, 节奏才是可调的。

    第一支成片的教训: 观感上的「拖」来自停顿, 不来自语速——语速其实一直
    偏快 (Speed=1.0 时 396 字/分)。填充把每句撑开, 听感是一顿一顿的, 于是
    很容易误判成「读得慢」, 然后去调快语速, 结果两头都更糟。先把停顿处理
    干净, 再谈语速。

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
GAP_SENTENCE = 0.25   # 句间停顿
GAP_SCENE_END = 0.10  # scene 末句——转场本身就是一次停顿, 不用给满
SCENE_RE = re.compile(r"^###\s+(S\d+)\s+·\s+(.+?)\s*$")
# 图层是分层渲染 (editorial-video) 的字段, 这条轻量通道用不上。但必须认得它:
# 不认的话, 写在旁白后面的图层说明会被当成旁白收进去, 然后被念出来。
FIELD_RE = re.compile(r"^\*\*(旁白|画面|证据级别|B-roll|图层)：\*\*\s*(.*)$")
IGNORED_FIELDS = {"图层"}
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
            if field not in IGNORED_FIELDS:
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


def tencent_tts(text, out, voice, speed, tmp_dir, gap=GAP_SENTENCE):
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
            "Speed": float(speed),
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
    parts, cues = [], []
    for i, sent in enumerate(sentences):
        raw = tmp_dir / f"{out.stem}-{i:02d}.raw.mp3"
        raw.write_bytes(one(sent, i))
        # 末句的停顿留给转场, 给满反而拖
        g = GAP_SCENE_END if i == len(sentences) - 1 else gap
        part = tmp_dir / f"{out.stem}-{i:02d}.wav"
        trim_silence(raw, part, g)
        raw.unlink()
        span = duration(part)
        cues.append({"text": sent, "speech": max(span - g, 0.01), "span": span})
        parts.append(part)

    lst = tmp_dir / f"{out.stem}-parts.txt"
    lst.write_text("".join(f"file '{p.name}'\n" for p in parts), encoding="utf-8")
    run(["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", str(lst),
         "-c:a", "libmp3lame", "-q:a", "2", str(out)], cwd=tmp_dir)
    for p in parts:
        p.unlink()
    lst.unlink()
    return cues


def trim_silence(src, dst, gap):
    """裁掉合成音频头尾的静音, 再补一个受控的停顿。

    腾讯云按句合成, 每句自带头尾静音填充。整段拼起来后每个句子边界就攒下
    半秒空白——实测第一支成片 66 段静音全部落在 0.53-0.55 秒, 这种整齐度
    不可能是语气停顿, 是填充累加出来的, 占了全片 12%。

    裁掉再按标点补回, 停顿就成了可调参数。
    """
    strip = ("silenceremove=start_periods=1:start_duration=0:"
             "start_threshold=-45dB:detection=peak")
    af = f"{strip},areverse,{strip},areverse"
    if gap > 0:
        af += f",apad=pad_dur={gap:.3f}"
    # 输出 PCM: 后面要按帧精确拼接, mp3 的编码器填充会把裁掉的空白又加回来
    run(["ffmpeg", "-y", "-i", str(src), "-af", af, "-c:a", "pcm_s16le", str(dst)])


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
    """字幕时间码优先用逐句合成的真实时长。

    旁白是一句一句合成的, 每句音频多长是合成端的真值, ffprobe 量一下就有。
    比按字符数比例切分准, 也比用 ASR 反推准——反推是猜一件已经知道的事。

    只有 say 通道整段合成、拿不到分句时长时, 才退回比例切分。那条路误差
    在半秒内, 够用。
    """
    lines = []
    n = 0
    t = 0.0
    for s in scenes:
        cursor = t
        if s.get("cues"):
            for c in s["cues"]:
                n += 1
                lines.append(
                    f"{n}\n{srt_time(cursor)} --> {srt_time(cursor + c['speech'])}\n{c['text']}\n"
                )
                cursor += c["span"]
        else:
            sents = split_sentences(s["旁白"])
            total = sum(len(x) for x in sents) or 1
            for sent in sents:
                span = s["duration"] * len(sent) / total
                n += 1
                lines.append(f"{n}\n{srt_time(cursor)} --> {srt_time(cursor + span)}\n{sent}\n")
                cursor += span
        t += s["duration"]
    out.write_text("\n".join(lines), encoding="utf-8")
    return n


def ken_burns(idx, frames, w, h):
    """给静态图一点缓慢的推拉平移。

    一屏不动的图连着放几分钟, 看起来就是幻灯片。这里的运动幅度刻意很小
    (最多 8%), 目的是让画面「活着」, 不是炫技——幅度一大, 卡片上的字就
    开始飘, 反而更难读。

    四种方向轮换, 相邻两个 scene 不会同向, 否则整片像在同一个方向漂。
    """
    span = 0.08
    per = span / max(frames, 1)
    cx = "iw/2-(iw/zoom/2)"
    cy = "ih/2-(ih/zoom/2)"
    moves = [
        (f"'min(1+{per:.6f}*on,{1 + span})'", cx, cy),                  # 推近
        (f"'max({1 + span}-{per:.6f}*on,1)'", cx, cy),                  # 拉远
        (f"'min(1+{per:.6f}*on,{1 + span})'", f"'(iw-iw/zoom)*(on/{max(frames,1)})'", cy),   # 推近 + 右移
        (f"'min(1+{per:.6f}*on,{1 + span})'", f"'(iw-iw/zoom)*(1-on/{max(frames,1)})'", cy), # 推近 + 左移
    ]
    z, x, y = moves[idx % len(moves)]
    x = x if x.startswith("'") else f"'{x}'"
    y = y if y.startswith("'") else f"'{y}'"
    return f"zoompan=z={z}:d={frames}:x={x}:y={y}:s={w}x{h}:fps=24"


def make_clip(shot, dur, out, size, idx=0, motion=True):
    """画面铺满配音时长。图片就 loop, 视频短了定格末帧、长了截断。"""
    w, h = size.split("x")
    frames = max(1, int(round(dur * 24)))
    fade = min(0.4, dur / 4)
    tail = f"fade=t=in:st=0:d={fade:.2f},fade=t=out:st={max(dur - fade, 0):.2f}:d={fade:.2f}"

    if shot.suffix.lower() in (".mp4", ".mov", ".webm"):
        pad = (
            f"scale={w}:{h}:force_original_aspect_ratio=decrease,"
            f"pad={w}:{h}:(ow-iw)/2:(oh-ih)/2:color=#1a1a19,setsar=1,fps=24"
        )
        cmd = ["ffmpeg", "-y", "-i", str(shot), "-an",
               "-vf", f"{pad},tpad=stop_mode=clone:stop_duration={dur},{tail}"]
    elif motion:
        # zoompan 在原分辨率上做会抖。先放大一倍再采样, 抖动就看不出来了。
        big = f"scale={int(w) * 2}:{int(h) * 2}:force_original_aspect_ratio=decrease,pad={int(w) * 2}:{int(h) * 2}:(ow-iw)/2:(oh-ih)/2:color=#1a1a19"
        vf = f"{big},{ken_burns(idx, frames, w, h)},setsar=1,{tail}"
        cmd = ["ffmpeg", "-y", "-loop", "1", "-i", str(shot), "-vf", vf]
    else:
        pad = (
            f"scale={w}:{h}:force_original_aspect_ratio=decrease,"
            f"pad={w}:{h}:(ow-iw)/2:(oh-ih)/2:color=#1a1a19,setsar=1,fps=24"
        )
        cmd = ["ffmpeg", "-y", "-loop", "1", "-i", str(shot), "-vf", f"{pad},{tail}"]
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
    voice = opt("--voice", "501000" if engine == "tencent" else "Tingting")
    rate = opt("--rate", "180")
    speed = opt("--speed", "0")
    gap = float(opt("--gap", str(GAP_SENTENCE)))
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
            s["cues"] = tencent_tts(s["旁白"], wav, voice, speed, build / "audio", gap)
        else:
            run_retry(["say", "-v", voice, "-r", rate, "-o", str(wav), s["旁白"]], timeout=60)
            s["cues"] = None
        s["audio"] = wav.name
        s["duration"] = duration(wav)
        print(f"  {s['id']}  {s['duration']:6.2f}s")

    total = sum(s["duration"] for s in scenes)
    print(f"总时长 {total // 60:.0f}:{total % 60:04.1f}")

    motion = "--no-motion" not in argv
    print(f"\n铺画面（{'带推拉' if motion else '静止'}）…")
    for i, s in enumerate(scenes):
        clip = build / "clips" / f"{s['id']}.mp4"
        make_clip(resolve(base, s["画面"]), s["duration"], clip, size, i, motion)
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
