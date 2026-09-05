# YouTube Packaging

> 状态：未构建的复盘内容包。以下是脚本、画面规格和发布包装，不是已完成的第三支视频。尚未生成 TTS、真实章节时间码或复盘成片。

## Title Options

1. AI 能出片，却还不会做决定
2. 137 张 AI 图，为什么最后只用了 18 张
3. 两支 AI 动画，真正贵的不是接口
4. 技术检查全过，我为什么还重做了三版
5. 同一套 AI 流水线：童话半天，实验片近一周

## Thumbnail Concepts

1. **只用了 18 张**：左侧 137 张素材阵列，右侧只保留 18 张，底部标“119 张未采用”。
2. **QA 全过，还是重做**：绿色“0 failures”与红色“重做三版”正面对照。
3. **29 元 vs 19 小时**：接口账单和人工时间双卡，覆盖文字“贵的不是接口”。

已生成首选封面：`assets/thumbnail.html` → `assets/thumbnail.png`，1280 × 720。封面是数据卡式示意，不是 Film A 或 Film B 的真实画面截图。

## Description

上一个内容流水线实验的视频渠道失败了：它做出一支 4 分 24 秒的截图、文字卡和旁白拼接片，但不能作为动画发布。这次我换成 AI 插画视频流水线，重新测试文字故事能不能变成连贯的视频。

我用同一套最终流水线处理了两个故事：Film A 讲一次软件实验，Film B 是原创童话《最后一盏灯》。两支片子都通过 QA，最长静止画面分别是 4.67 秒和 4.00 秒。

整条流程可以先压缩成一句话：定主题，拆叙事场景，为每段旁白定画面，固定风格，生成完整场景，按需拆独立图层，用代码设计镜头运动，再由配音反推时长，最后合成和 QA。`editorial-video` 默认不是先拆背景和主体，因为统一场景更容易保持光照和材质一致；只有需要独立运动的对象才单独生成。

技术通过不等于片子好看。实验共生成 137 张图，只采用 18 张；接口成本 29.27 元，总耗时约 19 小时，记录了 21 次失败和 37 次人工介入。旁白定稿后的配音、计时、渲染和合成已经能自动跑，前面的叙事与视觉判断仍需要人。

Links:

- Experiment: https://github.com/siliconleap/silicon-leap-lab/tree/master/experiments/2026-08-story-to-animated-video
- Film A: https://youtu.be/oOVnuUOSYBY
- Film B, The Last Light: https://youtu.be/aUFPD-lNm3w
- Data: https://github.com/siliconleap/silicon-leap-lab/tree/master/experiments/2026-08-story-to-animated-video/data

## Chapters

时间码待 TTS 和最终剪辑生成后回填：

- Hook：QA 全过，为什么还重做
- 两支片子与同一套流水线
- 三个版本走错的素材路线
- 137 张图只留下 18 张
- 技术判据看不见什么
- 自动化从旁白定稿以后开始
- 实践清单与结论边界

## Pinned Comment

如果你也试过把故事做成 AI 视频，最耗时间的是素材生成、画面编排，还是审片时说不清“哪里不对”？请只选一个最贵的环节，并说说你怎么处理。

## Shorts Candidates

| Clip | Source | Why it works |
| --- | --- | --- |
| 137 张只用 18 张 | `assets/02-waste.png` | 一个数字对照说明试错成本 |
| QA 全过仍重做 | `assets/04-qa.png` | 技术通过与主观否决的冲突完整 |
| 自动化分界线 | `assets/05-boundary.png` | 30 秒内能讲清人和流水线的职责 |

## Missing Assets

- Chapters 的真实时间码要等 TTS 和最终剪辑完成后回填，当前不能用于发布页。
- 没有播放数据，不在标题、封面或描述中加入观看效果结论。
