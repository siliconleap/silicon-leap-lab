# 没有素材，AI 能不能把一次实验讲成一支能发的动画视频？

## Question

在没有录屏、没有实拍、没有现成插画的前提下，AI 能不能从一次实验的过程记录里自己发掘素材，生成一支画面连贯、能发到 YouTube 的动画视频？

## Setup

**环境**

- macOS，Claude Code CLI，模型 Opus 5，Node v24.6.0
- 图像：腾讯云 aiart `TextToImageLite`（`ap-guangzhou`），密钥取自 `TENCENTCLOUD_SECRET_ID` / `_KEY`
- 配音：腾讯云 TTS，音色 501000，`Speed=0`
- 渲染：Remotion（`editorial-video` skill 的默认渲染器，本机尚未安装依赖）
- 无 OpenAI API key，无图形编辑软件，无实拍设备

**被测对象**

`~/Code/editorial-video`（skill 名 `illustrated-videos`）的分层插画视频流水线：每个 scene 拆成不含主体的背景板，加若干独立生成的带 alpha 的主体、道具与前景层，再由 Remotion 合成、加语义动效与字幕。

对照基线是实验一的 `content-forge/scripts/build-video.py`：静态图 concat + TTS + 字幕，已产出一支 4 分 24 秒的成片，作者判定不可发布，理由是「画面是截图的简单拼接，算不上动画，非常不连贯」。

**任务**

不是 toy example。素材来源是实验一 `2026-08-markdown-only-content-pipeline` 的全部过程记录：`README.md` 七段、`notes/session-timeline.md` 的 105 条真人输入、`drafts/youtube/scenes.md` 的 13 个 scene、`internal/review1-6.md`。目标是从这份材料重新生成一支 180 秒以内的动画视频。

实验一里已有的真实截图与结构图（`drafts/*/assets/`）可以进片；没有截图可用的段落，必须由生成的分层插画承担，不许用文字卡片充数。

**形式约束**

- 非口播：不出镜，不用真人画面，旁白只走 TTS
- 全程由 AI 执行，人只做审核和局部微调，每次干预逐条记进 `data/interventions.md`

**判据**

1. 能不能产出一支 180 秒以内、通过 `editorial-video` 自带 QA（`scripts/verify-video.sh` + `references/quality-rubric.md`）的成片
2. 成片里有没有单张静止画面连续超过 8 秒——这是实验一被判不合格的直接病根
3. 从「交出实验一目录」到「成片产出」，人工干预次数是多少，其中哪几次是不可省的

**已知短板**

作者无美术、动画、策划、编辑背景，对「精美」的判断只能是主观打分，不构成客观判据。YouTube 账号尚未注册，本次拿不到发布后的真实数据。

## Log

<!-- 跑的过程中记，允许混乱。卡在哪、报什么错、当时怎么想的。 -->

## Data

<!-- 跑完从 data/ 汇总成表。没测到的写「待补」，绝不估算。 -->

## What Worked

<!-- 有效的，带条件：什么情况下有效。 -->

## What Failed

<!-- 失败的，带原因。这段往往比上一段更有内容价值，不许为了好看删。 -->

## Conclusion

<!-- 只能人写。agent 可给候选，但必须由人改写，不是点头批准。 -->

<!-- 可选第八段：产生了可复用成果时，在此后追加 "## Artifacts"，写指针表（成果 | 位置 | 状态），不要把成果拷进本目录。 -->
