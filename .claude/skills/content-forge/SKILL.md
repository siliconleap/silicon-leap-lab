---
name: content-forge
description: 把一个实验目录的原始记录蒸馏成已确认的事实简报，再按平台配置生成网站、GitHub、公众号、小红书、YouTube 等内容包。用于实验内容、Blog、README 片段、社交稿、视频脚本和平台适配；不负责替作者下结论或发布。
---

# Content Forge

把一次实验做成可信、能读懂、可审核的多平台内容包。流水线搬运事实、组织叙事、生成格式与视觉资产；作者负责观点、结论、账号和发布。

## 先读这些资源

- 事实、引用、困难与发布状态：[`references/evidence.md`](references/evidence.md)
- 叙事主线与 Site/公众号/小红书写法：[`references/narrative.md`](references/narrative.md)
- 内容审核与无背景盲读：[`references/review.md`](references/review.md)
- 平台独有要求：`platforms/<id>.md`

## 硬边界

- README `Conclusion` 为空时，不代写结论，标注待补。
- 数字只来自 README `Data` 或 `data/`；未知写待补。
- 不把作者观察写成群体事实，不把草稿或计划写成已发布成果。
- 不把临时环境问题写成可外推发现。
- 公开前必须说明读者能拿走什么、哪些仍需人工或未开放。

## 工作流

### 1. 建立事实简报

读取实验目录的 README、plan、notes、data、recordings、会话时间线、content-outline 和 Artifacts。README 缺失、七段不完整、关键过程段为空，或新实验的 `content-outline.md` 未确认时，停止并报告缺口。

生成 `content-brief.md`，包含：背景与问题、读者处境、关键事实、共通困难、实践清单、人工投入与发布状态、意外发现、结论边界、关键词和作者确认。

运行：

```sh
python3 scripts/check-content-brief.py <实验目录>
```

通过后停止，等待作者同时确认“已确认：是；可公开：是”。

### 2. 选择叙事主线

按 `references/narrative.md` 先写总体说明，再选择一个真实转折推进正文。内部名词必须在实验对象之后出现。不要把事实摘要、日志或表格直接改写成文章。

### 3. 渲染平台稿

读取被选平台的 `platforms/<id>.md` 和模板，写入 `drafts/<platform>/`。默认生成所有已配置平台；用户指定平台时只生成指定项。

平台稿完成后，用 `write` skill 做行文润色。润色不得改变数字、引用、文件名、链接、事实、结论边界、标题层级或图片占位。中文作者明确采用破折号时保留该风格；英文不用 em dash。

### 4. 生成视觉资产

配图 HTML 是源，PNG 是产物。写入 `drafts/<platform>/assets/`，带 `render-size`，再运行：

```sh
scripts/render.sh drafts/<platform>/assets
```

图中文字同样受事实和脱敏约束。没有真实截图时列素材缺口，不伪造截图。

### 5. 自动校验

把能确定的条件交给脚本，不用 prose 规则替代：

```sh
python3 scripts/check-content-brief.py <实验目录>
python3 scripts/check-structure.py <实验目录>
../experiment-plan/scripts/validate.sh <实验目录>
```

`check-structure.py` 检查实践表、失败行、边界、篇幅和内部名词顺序；不判断文风或故事质量。所有 FAIL 必须修复。数字序号和时间码警告逐项判断，不为消警告改事实。

成片、录屏等外部资源先上传并取得真实链接，再写入正文；没有链接就写待补。

### 6. 人工判断门

按 `references/review.md` 完成独立内容审核与无背景盲读。只有事实、边界、可读性和盲读都通过，才写 `publish-ready`。YouTube 包装、脚本和分镜不等于已完成视频。

## 输出与报告

报告列出：生成文件、未确认或缺失材料、可公开/可复制/未开放成果、各平台人工动作、校验结果、审核状态。

## 维护原则

- 新的确定性规则：优先加或改脚本，并在本文件引用它。
- 需要判断的写作经验：放入对应 `references/`，不堆进本文件。
- 平台差异：只改 `platforms/<id>.md` 或模板。
- 主文件只保留入口、顺序、硬边界和放行门槛。
