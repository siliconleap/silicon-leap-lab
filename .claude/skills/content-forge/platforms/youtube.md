---
id: youtube
display_name: YouTube
aliases: [youtube, yt, video, shorts, 视频, 长视频]
outputs:
  - path: drafts/youtube/scenes.md
    template: templates/youtube/scenes.md
  - path: drafts/youtube/project.json
    template: templates/youtube/project.json
    when: 走分层渲染（默认）
  - path: drafts/youtube/packaging.md
    template: templates/youtube/packaging.md
  - path: drafts/youtube/broll-brief.md
    template: templates/youtube/broll-brief.md
    when: 有 scene 缺一手素材
language: zh-first
publish_skill: null
---

# YouTube

## Role

视频内容包。目标不是把 Blog 念出来，而是把实验过程、失败现场和数据结论剪成有留存的故事。

产物是 `scenes.md` 和 `project.json`——**同一步产出两份，不是两个阶段**。同一次
决策的两个视图：

| 文件 | 给谁看 | 装什么 |
| --- | --- | --- |
| `scenes.md` | 人 | 旁白、证据级别、选了哪张图、这一拍用哪个运动模板 |
| `project.json` | 机器 | 图层、坐标、z-index、关键帧 |

不要「先审完 scenes.md 再转换成 project.json」。人改了 scenes.md 就重新生成一次，
几秒的事。审的落点必须是可读的那份——旁白埋在几百行 JSON 里没法审，而结论段
旁白必须由作者手写这条规矩就会失效。

旁白字段一份三用：喂 TTS、当字幕、给人看。

## 渲染走哪条

**默认：editorial-video（Remotion）**。分层素材、语义关键帧、转场、BGM。

`narration.txt` 也在这一步产出：把各 scene 的 `**旁白：**` 按编号顺序拼起来，
scene 之间空一行，scene 内部的段落空行原样保留。它不是新写的文案，是旁白字段
的另一种排布。

```sh
# 1. 配音 + 真实时间码
node scripts/generate-voice.mjs --provider tencent \
  --text-file narration.txt --out public/assets/audio/voice.mp3 \
  --scene-ids S01,S01,S02,S03
# 2. 展开运动模板
node scripts/expand-motion.mjs --project public/project.json
# 3. 回填帧数: durationInFrames、scene from/duration、captions
node scripts/apply-caption-timings.mjs \
  --aligned public/assets/audio/voice.cues.json --project public/project.json
# 4. 校验 → 渲染
node scripts/validate-manifest.mjs && node scripts/audit-project.mjs
npm run render
```

`--scene-ids` 是**按段落**对齐的，不是按 scene。一个 scene 的旁白分成几段，
就把它的 id 重复几次——上面 S01 有两段所以写两次。个数对不上会直接报错退出，
不会静默错位。

时长不写在源里。配音跑完才知道每段多长，总长是加出来的。

**轻量通道：`scripts/build-video.py`**。ffmpeg 直出，零 Node 依赖，只有静态图和
Ken Burns，没有分层也没有转场。**当前不启用**，保留给不需要动画的片子。它只读
`scenes.md`，不认 `project.json`。

## Emphasis

- Title, thumbnail, and first 30 seconds decide whether anyone watches.
- Process and failed attempts matter more than polished final state.
- Use first-hand records as primary evidence（录屏只是其中一种，见下）。
- Separate full video packaging from Shorts candidates.
- Chinese script first; English track can be translated from the same edit.

## 证据分级

对话式工作没有「操作过程」可录屏——终端里没有人的动作，`recordings/` 是空的
才是常态。但过程证据不止录屏一种：

| 级别 | 什么算 | 画面上要不要标 |
| --- | --- | --- |
| 一手 | 会话记录（`notes/session-timeline.md`）、git 历史、文件 diff、当时的截图、录屏 | 不标 |
| 复现 | 事后补录的终端操作 | 标「复现」 |
| 示意 | 生成的 B-roll、结构示意图 | 标「示意」 |
| 缺 | 没素材也没决定怎么补 | 不能进片 |

- **优先用一手。** 有会话记录就不要生成 B-roll——原始证据永远比示意画面有力。
- 引用会话记录要给文件名和时间戳，让人能回去查。这是记录，不是重演，不必标复现。
- 级别为「缺」的 scene，`build-video.py` 会拒绝构建。补素材或删掉它。
- 重演补录必须与 git 历史一致，不许为效果伪造报错或时间线。
- 没有一手素材的 scene 才写进 `broll-brief.md`，交外部视频 skill 生成，成片一律标「示意」。

## 时长

不预设时长。`build-video.py` 跑完 TTS 才知道每个 scene 多长，总长是加出来的。
讲清楚就停——写「预计 8-10 分钟」是拍脑袋，写不出来。

## 视觉资产

**画面交给 `article-visual-storyboard` skill**（装在同一个 `skills/` 目录下）。
它管风格定义、分镜清单、逐张构图和渲染；本配置只管这里需要哪几类图。

叙事示意图是主力——图形示意 + 嵌入真实原话和时间戳，图是画的，字是真的。
纯文字卡片连着放几分钟就是幻灯片，不要整片都用。

三类图各司其职：

| 类型 | 用在 | 规格 |
| --- | --- | --- |
| Thumbnail | 决定点不点开 | 1280 × 720，覆盖文字 2-5 字，手机端缩到指甲盖仍可读 |
| 数据卡 | 数据段，旁白报数字时压在画面上 | 16:9，深色底 `#1a1a19` 配终端质感，一张卡一个 hero 数字 |
| 结构图 | 背景段，解释被测系统 | 16:9，方框箭头，无装饰 |
| 记录卡 | 引用会话记录原话 | 16:9，等宽字体，带时间戳和文件名，原话不许改写 |

- 文字色 `#ffffff` / `#c3c2b7` / `#898781`；状态色 通过 `#0ca30c` · 警告 `#fab219` · 失败 `#d03b3b`，**必须配图标和文字**。
- 分类色固定顺序 `#3987e5` `#d95926` `#199e70`，超过三类合并成「其他」。
- 系统 sans，不用衬线或展示体。终端画面字号放大到手机端可读。
- 确定性的卡片由 agent 出图：写 HTML 源到 `drafts/youtube/assets/`（thumbnail 用 `<meta name="render-size" content="1280x720">`，数据卡和记录卡用 `1920x1080`），跑 `scripts/render.sh` 渲染 PNG。HTML 是源，PNG 是产物，改图改 HTML。
- thumbnail 需要真实截图打底的，列进缺口清单，不用示意图冒充。
- 图里的用户名、邮箱、绝对路径一律换占位符——视频封面比正文传播更广，改不了。

## 构建

`scenes.md` 定稿后：

```sh
scripts/build-video.py <实验>/drafts/youtube --dry-run   # 先校验
scripts/build-video.py <实验>/drafts/youtube             # 配音 + 铺画面 + 字幕 + 拼接
```

顺序是配音 → 真实时长 → 画面 → 字幕，不能颠倒。字幕时间码来自音频，所以
永远不用对轴。产物在 `drafts/youtube/build/`，成片和中间件都不进 git。

人只需要审两件事：**scene 的文案**、**画面选得对不对**。其余是确定性的。

## 成文结构同样适用

视频不是文章的另一种长度，但**结构约束是同一套**（见 SKILL.md「成文结构」）：

- **开篇给认知**，两到三条，一条一句。不要用一条纯时间顺序的复述开场
- **中段给细节**，按实际发生顺序，重点放在耗时最多的那一段而不是最戏剧化的那一段
- **收尾给实践清单**：做了什么 / 是否有效 / 是否可复制。**清单里每一条重要的实践，值得各占
  一拍，配自己的画面**——把整张表塞进一个镜头，观众要暂停才读得完，等于没讲
- **困难只讲共通的**，临时的（装包、配变量、改路径）留在实验记录里，不进片

## Acceptance Checklist

- Has title options and thumbnail brief.
- Has a hook, not an intro.
- Keeps failures and stuck moments.
- 每个 scene 都有证据级别，且没有「缺」。
- 引用会话记录的 scene 给出了文件名和时间戳。
- `build-video.py --dry-run` 通过。
- Lists missing footage if the video cannot be made well yet.
- 开篇有两条以上认知，不是流水账开场。
- 收尾有实践清单，且重要的实践各占一拍、各有自己的画面。
- 困难都标了临时 / 共通，片中只出现共通的那些。
- 中段的篇幅分配对得上 `data/` 里的耗时分布。
