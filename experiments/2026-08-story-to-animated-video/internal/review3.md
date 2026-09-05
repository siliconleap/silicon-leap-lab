# 内容审核 · 第 3 轮

- 审核日期：2026-09-02
- 审核范围：`drafts/site/`、`drafts/github/`、`drafts/wechat/`、`drafts/xiaohongshu/`、`drafts/youtube/`
- 依据：`README.md`、`content-outline.md`、`content-brief.md`、对应平台配置
- 本轮未修改文件：是

## 上轮任务完成情况

- 已完成：GitHub 保留 README 原始中文问题并附英文表述；小红书补具体读者处境、改为“计划放置”置顶评论并清理无依据标签；YouTube 将 evidence level 改为解析器接受的纯值并把来源移到独立字段，增加 S11 拆分实践边界，加入 Film A/B 已发布成片路径，补充 `human-in-the-loop` 解释，并同步 `project.json` 的成片路径。
- 有意保留：YouTube 复盘内容包未执行 TTS、真实时间轴回填和第三支视频渲染，`project.json` 的 1 帧占位和 `_status` 明确记录这一点。

## 评分（0-2 分）

| 平台 | 事实 | 边界 | 叙事 | 可读 | 连贯 | 平台/视觉 | 痛点 | 关键词 | 人工/发布 | 总分 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Site EN | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 18/18 |
| GitHub | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 18/18 |
| 微信公众号 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 18/18 |
| Site ZH | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 18/18 |
| 小红书 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 18/18 |
| YouTube | 2 | 2 | 2 | 2 | 2 | 2 | 1 | 2 | 1 | 15/18 |

## 证据与结论

- 五个平台正文的事实、边界、人工成本和敏感信息均可回查当前实验材料；`check-structure.py` 为 5 份稿件、0 项警告。
- YouTube 的 `build-video.py --dry-run` 已通过，11 个 scene 与 11 段 narration 数量一致，S01/S02 使用已发布 Film A/B，S03-S11 明确为示意数据卡并附来源。
- YouTube 不是已完成的复盘视频：TTS、真实时长、章节时间码和最终渲染仍未执行，`project.json` 的占位帧数不应带入发布流程。因此它是可交付的内容包，但不是 publish-ready 成片。
- `validate.sh` 通过，仅有数字序号与 180 秒推荐目标触发的启发式警告；标点门禁、`git diff --check`、敏感信息扫描均通过。

## 审核结论

- Site EN：publish-ready
- GitHub：publish-ready
- 微信公众号：publish-ready
- Site ZH：publish-ready
- 小红书：publish-ready
- YouTube：not publish-ready（复盘视频尚未构建；内容包本身可交给后续制作）
