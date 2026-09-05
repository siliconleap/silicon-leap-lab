# 内容审核 · 第 1 轮

- 审核者：`/root/polish_chinese`（Site EN、GitHub）与 `/root/polish_english`（微信公众号、Site ZH、小红书、YouTube）
- 审核日期：2026-09-02
- 审核范围：`drafts/site/`、`drafts/github/`、`drafts/wechat/`、`drafts/xiaohongshu/`、`drafts/youtube/`
- 依据：`README.md`、`content-outline.md`、`content-brief.md`、对应平台配置
- 本轮未修改文件：是

## 评分

| 平台 | 事实 | 边界 | 叙事 | 可读 | 连贯 | 平台/视觉 | 痛点 | 关键词 | 人工/发布 | 总分 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Site EN | 2 | 2 | 2 | 2 | 2 | 1 | 1 | 0 | 2 | 14/18 |
| GitHub | 2 | 2 | 2 | 2 | 2 | 2 | 1 | 0 | 2 | 15/18 |
| 微信公众号 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 1 | 2 | 17/18 |
| Site ZH | 2 | 2 | 2 | 2 | 2 | 1 | 1 | 1 | 2 | 15/18 |
| 小红书 | 2 | 2 | 2 | 2 | 2 | 1 | 2 | 1 | 2 | 16/18 |
| YouTube | 2 | 2 | 2 | 2 | 2 | 1 | 1 | 1 | 1 | 14/18 |

## 证据与修改任务

### Site EN

- `drafts/site/blog.md` 的数据、失败路径和样本边界均可回查 `README.md` 的 Data、What Failed、Conclusion。
- 但开头没有接上 `content-outline.md`「有故事或项目、没有素材也不会拍剪画」的作者观察；tags 中的 `AI video generation`、`human-in-the-loop`、`code-generated animation` 也没有在正文首次解释。
- `What failed` 没有失败产物视觉证据；结尾只给实验目录，缺直接的 `notes/`、`data/`、`video/` 链接。

任务：补读者处境与术语解释；补原始材料链接；为失败段补证据卡或明确视觉缺口。

### GitHub

- `drafts/github/readme-section.md` 的时长、静止画面、QA、137/18、29.27 元、19 小时、21 次失败、37 次干预均能回查 README Data。
- `Question` 没保留原问题中的“值得看的连贯动画”约束；缺读者处境和术语解释；缺干预构成及 token 未记录；`Status: done` 未写出两支影片已发布且暂无播放数据。

任务：补完整问题、读者处境、最小术语说明、干预构成和具体状态。

### 微信公众号

- `drafts/wechat/article.md` 有完整失败路径、4 张有来源图注的配图、实践清单和结论边界，符合平台的 3–6 图要求。
- 关键词只零散出现，缺首次解释。

任务：首次出现时解释“代码合成动画”与 `human-in-the-loop`。

### Site ZH

- `drafts/site/blog-zh.md` 保留失败路线、实践表、两样本边界和发布数据缺口，事实可回查。
- 缺读者处境、术语首次解释和直接的 `notes/`、`data/` 指针；站内规则要求它们可核查。

任务：补一小段作者观察、术语解释、原始材料链接。

### 小红书

- `drafts/xiaohongshu/note.md` 以“QA 全过仍重做三版”开场，5 张竖版卡的 HTML 与 PNG 均存在，数字和边界准确。
- “评论区 / 主页”没有明确落点；`#AIAgent`、`#StoryToVideo` 没在正文解释。

任务：给出实验目录的明确落点，并补一句术语解释。

### YouTube

- `scenes.md`、`narration.txt`、`project.json` 均含连续 10 个 scene；`build-video.py --dry-run` 通过；数字可回查 README Data。
- `project.json` 仍为 TTS 回填前的 `duration: 1` 占位；章节时间码与 Blog 链接未形成；这是新复盘视频的内容包，不是已完成的第三支成片。
- 内容层仍缺目标读者处境和术语解释；需要在至少两个 scene 使用 Film A / B 成片片段或会话记录，而不是全部数据卡。

任务：补读者处境、术语与现有成片片段；保留 TTS、时间码、实际渲染为明确的生产缺口，不把它写成已发布。

## 审核结论

- Site EN：not publish-ready
- GitHub：not publish-ready
- 微信公众号：publish-ready
- Site ZH：not publish-ready
- 小红书：publish-ready
- YouTube：not publish-ready（内容包已完成，复盘视频成片未制作）
