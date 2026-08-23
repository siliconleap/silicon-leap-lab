# 步骤 1 · 开源 story → video 路线横向调研

**日期：** 2026-08-23
**产出：** 路线分类、选型结论、移植清单
**数据来源：** GitHub REST API 实时拉取（2026-08-23），加本机两个仓库的源码阅读。SEO 站的说法一律不采信。

## 候选与实测数据

star 数和最后推送日期取自 `api.github.com`，不是二手转述。**最后推送日期是这张表里最有用的一列**——它比 star 数更能说明一个项目还能不能用。

| 项目 | star | 许可 | 最后推送 | 形态 |
| --- | ---: | --- | --- | --- |
| harry0703/MoneyPrinterTurbo | 114,683 | MIT | 2026-08-22 | 素材拼接 |
| 3b1b/manim | 91,917 | MIT | 2026-08-18 | 代码合成（数学动画） |
| remotion-dev/remotion | 57,099 | 自定义 | 2026-08-22 | 代码合成（React） |
| ManimCommunity/manim | 40,368 | MIT | 2026-08-22 | 代码合成（社区维护版） |
| motion-canvas/motion-canvas | 18,993 | MIT | 2026-07-02 | 代码合成（生成器语法） |
| Wan-Video/Wan2.2 | 17,249 | Apache-2.0 | 2026-03-17 | 文生视频扩散 |
| Lightricks/LTX-Video | 10,886 | Apache-2.0 | 2026-01-05 | 文生视频扩散 |
| RayVentura/ShortGPT | 7,869 | MIT | **2025-02-10** | 素材拼接 |
| HVision-NKU/StoryDiffusion | 6,452 | Apache-2.0 | **2024-09-26** | 一致性图像序列 |
| midrender/revideo | 3,997 | — | 2026-07-15 | 代码合成（Motion Canvas 分支） |

## 分类：三条路，各自适合什么

### 素材拼接型

给个主题，AI 写脚本，去素材库搜配图配片，配 TTS 和字幕，拼成片。MoneyPrinterTurbo 是这一类的头部，11.4 万 star，仍在日常更新。

**适合：** 口播、资讯流、带货、热点搬运。输入是一个话题，输出是一支通用短视频。

**为什么不选：** 它不生成画面，只是检索现成素材再配上去。而本次要的是「对一个故事形象化的表现」——童话里那只兔子、实验里那次卡住，素材库里没有对应的东西。搜出来的会是泛泛的 B-roll，正好是这次要避开的东西。

ShortGPT 同类但已停更一年半（最后推送 2025-02-10），不进入考虑。

### 文生视频扩散型

Wan2.2、LTX-Video 这一类，直接从文字生成运动画面。

**适合：** 电影质感的短镜头、氛围片、概念预告。

**为什么不选：** 两个原因。一是可控性——分镜、构图、同一角色的一致性都难以约束，而讲故事需要的恰恰是这些。二是硬条件：这类模型要本地 GPU，这台 macOS 机器跑不动，走 API 又不在「开源自建」的范围内。

顺带一提，这两个项目的最后推送分别是 2026-03 和 2026-01，在扩散模型这个迭代速度里已经算慢了。

### 代码合成型

画面由代码组织：Remotion（React）、Motion Canvas / Revideo（生成器语法）、Manim（Python，数学动画）。

**适合：** 需要精确控制、可复现、可局部重渲的内容。解释性视频、数据可视化、插画讲述。

**选这一类。** 理由是判据 2 直接指着它：要求「没有单张静止画面连续超过 8 秒」，本质上是要求画面里有编排好的变化，而代码合成是唯一能把「什么时候变、变多少」写死并复现的形态。

Manim 值得单独说一句：91,917 star，是这次调研里除 MoneyPrinterTurbo 外最热的项目，专长是把抽象概念画成动画——正好是 A 那支片子最难的部分（软件实验只有抽象概念和终端输出）。但它是数学动画引擎，做的是公式变换和几何演示，不做插画叙事。**不作为主路线，但它的「用动画解释抽象物」这一套值得进移植清单。**

### 一致性图像序列

StoryDiffusion，NeurIPS 2024 Spotlight，用 consistent self-attention 让同一角色在多张图里保持一致——这正是 B 那支童话最大的风险。

**但不移植，理由是时效：** 最后推送 2024-09-26，基于 SD1.5/SDXL 时代的模型。近两年的图像模型和条件控制方式已经换了一轮，把一套两年前的注意力改法接进来，代价远大于收益。

角色一致性这次走另一条路：`editorial-video` 现有的 prompt anchor 加 QA 检查（`references/qa.md` 里那条「Character anchor, paper outline, palette, texture, and light direction remain consistent across poses and scenes」）。**它够不够用，是 B 那支片子要测出来的结果，不是这里能假设的。**

## 选型结论

**实测 `~/Code/editorial-video`（skill 名 `illustrated-videos`），代码合成型，渲染器 Remotion。** A、B 两支共用。

选它不是因为它最强，是因为三件事同时成立：分层素材契约天然要求画面里有独立可动的层（对判据 2）、Remotion 是代码合成里生态最大的（5.7 万 star，日常更新）、以及它是本机已有的项目，改得动。

## 移植清单

按 `plan.md` 的规则筛：只移植能直接服务于判据 1、2 的，其余记下来当后续。

### 先说一件反直觉的事：最该移植的那条已经在里面了

上一个实验的 `build-video.py` 留下的核心教训是时间轴——旁白按句合成，每句多长是合成端的真值，量一下就有，不需要 ASR 去反推；合成器给每句填的头尾静音要裁掉，停顿改成参数补回。

读 `scripts/generate-voice.mjs` 的 tencent 分支，这套已经整个在里面了，而且提交了（`97a75ad`）：逐句合成绕开 150 字上限、`silenceremove` 正反各裁一次、PCM 中转避免 mp3 编码器把空白加回来、cues 直接从每句实测时长累加。`apply-caption-timings.mjs` 也已经在读 `{audioDuration, cues}` 这个 sidecar。

**所以步骤 2 的规模比预想小得多。** 这是好消息，但它让「移植」这个动作本身缩水了——如实记下来，不为了让步骤 2 显得有分量而硬凑清单。

### 真正的缺口：preflight 的白名单没跟上

读 `scripts/preflight.mjs:110-155`，三个 provider 白名单是这样的：

```js
const imageProviders  = new Set(['codex-native', 'openai-api', 'mcp', 'file']);
const voiceProviders  = new Set(['edge-tts', 'openai', 'file']);
const timingProviders = new Set(['manual', 'faster-whisper']);
```

而实际情况是：

- `generate-tencent-image.mjs` 存在，`providers.md` 用一整节文档化了 `tencent-aiart`——但白名单里没有它
- `generate-voice.mjs` 支持 `tencent`——但白名单里没有它
- 时间码可以直接来自合成端的 cues，不需要 ASR——但 `timing.provider` 没有对应取值，只能填 `manual` 或 `faster-whisper`，后者还会要求装 `faster_whisper` Python 包

**结果是：这台机器上唯一有密钥、唯一跑得起来的那套 provider 组合，preflight 会直接拒绝。** 而实现代码和文档都是齐的。

这和上一个实验的招牌发现是同一个形状——那次是「配置在骂模板，模板在违反配置，两个文件分开看都对」。这次是「脚本支持、文档写了、校验不认」。三个文件分开看，每一个都是对的。

移植清单第 1 条因此是：**把 preflight 的三个白名单补齐，并给 `timing.provider` 加一个从合成端 cues 取时间码的取值。** 这条直接服务判据 1——不修就跑不起来。

### 清单

| # | 移植什么 | 从哪来 | 服务哪条判据 | 本次实装 |
| --- | --- | --- | --- | --- |
| 1 | preflight 白名单补 `tencent-aiart` / `tencent` / 合成端 cues 取时间码 | 本仓库自身的实现与文档不一致 | 判据 1（跑不起来就没有片子） | 是 |
| 2 | 「用动画解释抽象物」的手法——概念对象化、变换而非切换、一次只动一个量 | Manim 的表达范式（不引入依赖，只借做法） | 判据 2（A 那支片子最难的部分） | 待步骤 7 定分镜时判断 |
| 3 | 真实截图/终端画面的 scene 类型 | Motion Canvas / Manim 的「标注文档」范式 | 判据 2（A 要嵌上一个实验的真实截图） | 否，见下 |
| 4 | 角色一致性的模型级方案 | StoryDiffusion | B 的最大风险 | 否——停更两年，代价大于收益 |

第 3 条要单独说：`references/layer-contract.md` 要求每个 scene 拆成背景板加独立 alpha 层，而一张终端截图是不可拆的合成图。按现有契约它进不了片，但 A 那支片子的一手证据全在这类图里。**这是本次已知的最大结构性冲突，留到步骤 7 定分镜时正面处理**——要么给它开一个受约束的例外，要么承认这条流水线讲不了带真实证据的技术故事。不在这一步预先裁定。

## 顺带发现：一处代码与文档互相矛盾，本步不裁决

`scripts/generate-tencent-image.mjs:19-22` 的注释说：aiart 的 `LogoAdd` 默认为 1 会在右下角盖生成标识，所以这里默认传 0 关掉。

`references/providers.md:71-74` 说的是另一回事：`LogoAdd: 0` 本来就是这里的默认值，它只去掉品牌 logo，**合规标「AI 生成」仍然保留**，并注明是「Verified by inspection, not assumed」。

两个文件直接打架。**本步不裁决，交给步骤 5 的图像探测用一次真实生成来定**——生成一张，看右下角。在那之前，两种说法都不当事实用。

## 本步数据

| 字段 | 值 |
| --- | --- |
| 调研的候选方案数 | 10 |
| 分成几类 | 4（素材拼接 / 文生视频扩散 / 代码合成 / 一致性图像序列） |
| 选定路线 | 代码合成型，`editorial-video` + Remotion |
| 移植候选条数 | 4（本次实装 1，待定 1，不实装 2） |
