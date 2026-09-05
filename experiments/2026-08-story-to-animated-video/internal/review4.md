# 内容审核 · 第 4 轮

- 审核日期：2026-09-03
- 审核范围：`drafts/site/`、`drafts/github/`、`drafts/wechat/`、`drafts/xiaohongshu/`、`drafts/youtube/`
- 依据：`README.md`、`content-brief.md`、`content-outline.md`、`.claude/skills/content-forge/SKILL.md`、`editorial-video/SKILL.md`
- 本轮变更：补充读者易懂的总体流程，并说明 `editorial-video` 的按需拆层边界。

## 审核结果

| 检查项 | 结果 | 证据 |
| --- | --- | --- |
| 开头先交代实验对象和背景 | 通过 | Site、公众号、小红书、YouTube 均在进入 Film A/B 细节前说明上次失败与本次问题 |
| 给出不拆过细的总体流程 | 通过 | Site EN/ZH、GitHub、公众号、小红书、YouTube packaging、YouTube scenes/narration 均含旧路线与改进路线 |
| 旧路线与最终路线区分清楚 | 通过 | `drafts/site/blog-zh.md`、`drafts/wechat/article.md`、`drafts/youtube/scenes.md` |
| 不误写 `editorial-video` 为固定拆图层实现 | 通过 | 各正文说明完整场景优先，独立图层仅在需要独立运动时生成 |
| 细节仍留在 log 和中段 | 通过 | 总流程段只给认知地图，失败次数、提示词和渲染耗时仍在后文/README |
| 事实、边界、发布状态 | 通过 | 数字与 YouTube 链接可回查 README/Data；无播放效果外推 |

## 验证

- `check-structure.py`：通过，5 份稿件，1 条既有开篇长度启发式警告。
- `validate.sh`：通过；数字序号与 180 秒推荐值仍触发启发式警告，非事实错误。
- `build-video.py drafts/youtube --dry-run`：通过，11 个 scene，旁白数量一致。
- Write 标点门禁：中英文稿件均通过。
- `git diff --check`：通过。

## 结论

总体流程已经能让陌生读者先建立清晰认知，再进入 Film A、Film B 和实验 log。用户提出的改进路线方向正确，但“拆前景”必须是条件步骤；`editorial-video` 的实现正是以完整场景为默认、以按需拆分不透明图层为例外。YouTube 复盘成片仍未生成，因此 YouTube 内容包不是 publish-ready 成片。
