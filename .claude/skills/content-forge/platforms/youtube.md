---
id: youtube
display_name: YouTube
aliases: [youtube, yt, video, shorts, 视频, 长视频]
outputs:
  - path: drafts/youtube/script.md
    template: templates/youtube/script.md
  - path: drafts/youtube/packaging.md
    template: templates/youtube/packaging.md
language: zh-first
publish_skill: null
---

# YouTube

## Role

视频内容包。目标不是把 Blog 念出来，而是把实验过程、失败现场和数据结论剪成有留存的故事。

## Emphasis

- Title, thumbnail, and first 30 seconds decide whether anyone watches.
- Process and failed attempts matter more than polished final state.
- Use recordings as primary evidence.
- Separate full video packaging from Shorts candidates.
- Chinese script first; English track can be translated from the same edit.

## Layout Rules

- Provide 5 title options.
- Provide 3 thumbnail concepts with 2-5 words of overlay text.
- Hook must fit 0:00-0:30 and include conflict or result.
- Script must map narration to recording filenames/time ranges when available.
- Include description, chapters, pinned comment, subtitles notes, and Shorts candidates.

## 视觉资产

录屏是主素材，但录屏讲不了数字。三类图各司其职：

| 类型 | 用在 | 规格 |
| --- | --- | --- |
| Thumbnail | 决定点不点开 | 1280 × 720，覆盖文字 2-5 字，手机端缩到指甲盖仍可读 |
| 数据卡 | 数据段，旁白报数字时压在画面上 | 16:9，深色底 `#1a1a19` 配终端质感，一张卡一个 hero 数字 |
| 结构图 | 背景段，解释被测系统 | 16:9，方框箭头，无装饰 |

- 文字色 `#ffffff` / `#c3c2b7` / `#898781`；状态色 通过 `#0ca30c` · 警告 `#fab219` · 失败 `#d03b3b`，**必须配图标和文字**。
- 分类色固定顺序 `#3987e5` `#d95926` `#199e70`，超过三类合并成「其他」。
- 系统 sans，不用衬线或展示体。终端画面字号放大到手机端可读。
- 确定性的卡片由 agent 出图：写 HTML 源到 `drafts/youtube/assets/`（thumbnail 用 `<meta name="render-size" content="1280x720">`，数据卡用 `1920x1080`），跑 `scripts/render.sh` 渲染 PNG。HTML 是源，PNG 是产物，改图改 HTML。
- thumbnail 需要真实截图打底的，列进缺口清单，不用示意图冒充。
- 图里的用户名、邮箱、绝对路径一律换占位符——视频封面比正文传播更广，改不了。
- 重演补录必须与 git 历史一致，不许为效果伪造报错或时间线。

## Acceptance Checklist

- Has title options and thumbnail brief.
- Has a hook, not an intro.
- Keeps failures and stuck moments.
- Uses actual recording filenames when present.
- Lists missing footage if the video cannot be made well yet.
