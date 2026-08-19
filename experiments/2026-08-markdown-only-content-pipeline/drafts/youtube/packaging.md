# YouTube Packaging

> 成片已生成：`build/final.mp4`，4 分 24 秒，1920×1080，外挂 `subtitles.srt`（60 条）。
> 画面全部是一手材料——会话记录卡、结构图、数据卡，没有录屏，也没有示意图。

## Title Options

1. AI 半天写完，我为什么一周多不敢发
2. 内容流水线跑通了，内容还是发不出去
3. 配置说别写列表，模板却在教它写列表
4. 一篇 AI 初稿，为什么让我更不想行动
5. 别直接发 AI 初稿：我加入最多三轮独立审核

## Thumbnail Concepts

1. **卡了一周** — 左侧「半天：流水线搭完」，右侧「一周多：第一篇仍不想发」，底部小字「不是代码卡住」。
2. **同一事实** — 左右对照旧稿三段列表和改稿的处境、反差、停顿，覆盖文字「为什么读不下去」。
3. **谁来负责** — 三层图：脚本 / agent / 人，人的一栏突出「确认、发布」。

## Description

这次测的是一条不依赖任何平台工具的内容流水线：只用 Markdown 约定和两个 Claude Code skill 文件，不要服务器，不要数据库。流水线骨架半天搭完，但第一篇内容让我断断续续拖了一周多，仍不愿意发布。

问题不是代码失败，而是初稿缺少事实核验和编辑判断：配置禁止列表式表达，模板却硬编码了列表。新流程要求作者先确认短内容简报，再让独立审核者最多审改三轮。账号、补拍、剪辑、发布和维护仍是人工成本；本期没有录屏，不能制作成片。

Links:

- Experiment: https://github.com/siliconleap/silicon-leap-lab/tree/master/experiments/2026-08-markdown-only-content-pipeline
- Content brief: `content-brief.md`
- Blog: TBD

## Chapters

时间码来自 `build/manifest.json`，随配音时长自动产生。改了旁白就要重新生成。

```
00:00 没开工的那段时间
00:39 批准了自己没理解的东西
01:26 生成出来的内容很平庸
01:49 录屏这件事不成立
02:07 平庸是默认值
02:41 真正卡住我的不是 AI
03:26 数字
03:43 结论
```

## Pinned Comment

你们会在 AI 初稿之后，单独做事实和结论边界审核吗？最容易让你们拖着不发的，是文笔、事实，还是平台发布本身？

## Shorts Candidates

| Clip | Source recording | Why it works |
| --- | --- | --- |
| 旧稿 vs 改稿对照 | `01-before-after.png`（无录屏） | 视觉上直接解释「为什么读不下去」 |
| 配置批评模板 | `02-contradiction.png`（无录屏） | 两份文件互相矛盾，单点冲突成立 |
| 半天与一周多 | 待补口述或画面 | 个人代价与技术过程的反差 |

## Missing Assets

- **零录屏**——这不再是阻塞项。对话式工作在终端里没有「人的操作」可录，过程证据改用 `notes/session-timeline.md`，11 张记录卡都印了时间戳和来源文件。
- **可选补录**：`command -v` 逐个返回 NOT FOUND 的终端画面，要用必须标「复现」。
- **不可用素材**：精确耗时、token 消耗和主观评分均未记录，不得在标题或 thumbnail 中伪造数字。
- **thumbnail 尚未出图**——三个方案还是文字描述，需要写 HTML 再 `render.sh`。
