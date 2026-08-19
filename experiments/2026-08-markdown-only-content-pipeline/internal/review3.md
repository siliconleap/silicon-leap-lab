# 内容审核 · 第 3 轮

- 审核者：独立审核 sub-agent（第 3 轮）
- 审核日期：2026-08-19
- 审核范围：`drafts/site/blog.md`、`drafts/site/blog-zh.md`、`drafts/wechat/article.md`、`drafts/xiaohongshu/note.md`、`drafts/xiaohongshu/carousel-brief.md`、`drafts/github/readme-section.md`、`drafts/youtube/scenes.md`、`drafts/youtube/packaging.md`、`drafts/youtube/script.md`
- 依据：`README.md`、`content-outline.md`、已确认的 `content-brief.md`、`platforms/` 下五份平台配置、`internal/review1.md`、`internal/review2.md`、`notes/polish-pass-2026-08-19.md` 与同名 `.diff`
- 本轮未修改文件：是

## 上轮任务完成情况

review2 的「下一轮最小修改集」共 5 条。逐条核对当前文件（不采信「已修」的转述）：

| review2 最小修改集 | 状态 | 复核依据 |
| --- | --- | --- |
| 1. site 英文/中文与微信中「很多人 / common」式共鸣改成作者观察 | **未完成** | `drafts/site/blog.md:13` 仍为「The starting condition is common enough to be boring」；`drafts/site/blog-zh.md:16` 与 `drafts/wechat/article.md:29` 仍为「很多人想学技能、做项目或改变习惯时，也会卡在……」 |
| 2. 小红书配图清单「一周」改「一周多」 | **未完成** | `drafts/xiaohongshu/note.md:64` 仍写「半天写完 / 卡了一周的反差」，与同文件 `:5` 标题的「一周多」及 README Data 不一致 |
| 3. site 中文稿首次出现 `agent` 补职责边界解释 | **未完成** | `drafts/site/blog-zh.md:93`「剩下要判断的才归 agent」仍是全文首次出现，无解释；`:129` 第二次出现同样无解释 |
| 4. site 视觉证据：补拍标「复现」或保留缺口声明 | **已完成（按 review2 允许的低配路径）** | `drafts/site/blog.md:76`、`drafts/site/blog-zh.md:131` 均声明原始终端输出已被覆盖、补拍须标「复现」。未补拍，故该项维持 1 分 |
| 5. YouTube：补录/剪辑/配音/字幕/时间码/作者结论后再推进 | **被取代，且引入新问题** | 见下方说明 |

**关于第 5 条与「本轮只做了润色」这一前提的更正。** 委派说明称 review2 之后只做了一次表达润色。核对 git 后不成立：`drafts/youtube/` 在 review2（08-18）之后发生了内容层改动——提交 `9fb6145 Finalize the conclusion; add Tencent Cloud TTS`、`4ecf1af State what the criteria actually proved`、`88f8dc5 Build the first video: 4:24, Tencent Cloud TTS`，并新增 `scenes.md`、`assets/S*-quote.*`、`build/final.mp4`（08-19 14:46）。因此 YouTube 本轮不是「沿用 review2 结论」，而是按新证据重评。

**润色回合核对。** 读 `notes/polish-pass-2026-08-19.diff`：5 个文件、26 增 26 删，全部为行内表达改写（破折号改标点、翻案句改直述、定义句口语化）。未见事实、数字、文件名、引用原话或结构层级被改动，符合第 5.5 步的四条边界。中文稿保留「——」、小红书 `#AI编程` 不加空格，按作者风格与平台惯例，不计问题。

## 校验记录

从 `.claude/skills/content-forge/` 运行：

```sh
../experiment-plan/scripts/validate.sh ../../../experiments/2026-08-markdown-only-content-pipeline
```

结果：全部硬校验通过（含「drafts 相对链接目标全部存在」），退出码 0。唯一警告为数字溯源启发式，列出 `01 03 04 05 06 07 076 09 10 105 11 13 14 18 24 25865 47 50 84 950`，其中多数是文件序号、时间码与哈希片段，属已知误报；但 `105` 与 `10` 对应视频稿中的实际主张，逐条判断见 YouTube 一节。

---

## Site（英文 + 中文）— 13/16

| 指标 | 分数 | 证据 |
| --- | ---: | --- |
| 事实准确与可追溯 | 1 | `blog.md:13`、`blog-zh.md:16` 共鸣写成普遍事实；`blog-zh.md:121` 关于视频的表述已与实际不符 |
| 结论支撑与边界 | 2 | `blog.md:55-59`、`blog-zh.md:74-78` 明确「样本为 1、不能外推到所有模型」；`blog.md:93-99`、`blog-zh.md:123-133` 完整列出限制 |
| 逻辑与叙事 | 2 | 动机（`blog-zh.md:12-24`）→ 失败（`:41-70`）→ 证据（`:99-113`）→ 限制（`:115-133`）推进完整；英文版按论证组织，中文版按时间推演，符合 `platforms/site.md`「两版不是互译」 |
| 表达可读性 | 2 | 润色后句子短、无翻案腔，见 `polish-pass-2026-08-19.diff` 对 `blog-zh.md:14,18,70,78,95,117` 的改写 |
| 平台适配与视觉证据 | 1 | 两张结构图与图注齐备（`blog.md:38-39,69-70`；`blog-zh.md:51-52,90-91`），但失败段仍无一手终端证据；另 `blog-zh.md:139-141` 的「复现」段没有可点击链接，英文版 `blog.md:105-107` 有 |
| 读者痛点与吸引力 | 2 | `blog.md:17-19`、`blog-zh.md:22-24` 用「半天 / 一周多 / 不是代码卡住」的具体处境开篇 |
| 关键词与语境 | 1 | 英文版 `blog.md:36` 已解释 agent；中文版 `blog-zh.md:93` 首次出现 `agent` 无解释 |
| 人工成本与发布状态 | 2 | `blog.md:99`、`blog-zh.md:133` 列出账号、截图、预览、排版、发布、评论维护均未执行 |

### 问题证据

- `drafts/site/blog.md:13`：「The starting condition is common enough to be boring」把作者处境写成普遍状态。`content-brief.md:11-13` 只把这条标为作者判断，SKILL.md 禁止用「大多数人 / 普遍如此」冒充调研结论。改为 "This is my own starting condition, and I suspect it is not unique to AI." 之类的明确署名说法。（review2 第 1 条，未完成）
- `drafts/site/blog-zh.md:16`：「很多人想学技能、做项目或改变习惯时，也会卡在同一处」。同上。改为「我怀疑这不只发生在 AI 领域」。（review2 第 1 条，未完成）
- `drafts/site/blog-zh.md:93`：`agent` 首次出现无解释，与 `content-brief.md:19-23` 的关键词用法规定冲突。补一句「agent 负责可推断、可重复的步骤，不替人确认事实、结论或发布」。（review2 第 3 条，未完成）
- `drafts/site/blog-zh.md:121`：「录屏为 0，剪辑、配音、字幕都没有自动化路径。纯文本这套办法……到视频这里失效了」。该判断在 `drafts/youtube/scenes.md` 与 `drafts/youtube/build/final.mp4`（08-19 14:46 生成，4 分 24 秒）之后已不成立。同一内容包内两处对同一事实的描述相反，必须择一为准。英文版 `blog.md` 未出现该段，无此冲突。
- `drafts/site/blog-zh.md:108`：「校验脚本首次运行抓出的死链 | 4」列在「数据」表里，但 README 的 `## Data` 段没有这一行，该数字来自 `README.md:83` 的 Log 叙述。硬约束要求表内数字来自 `data/` 或 README Data 段。低严重度：数字本身可追溯，建议把该行补进 README Data，或把来源列改成「过程记录」。同一问题见 `drafts/github/readme-section.md:19`。
- `drafts/site/blog-zh.md:139-141`：「复现」段只给目录名，没有可点击链接；英文版 `blog.md:107` 给了四个完整链接。低严重度，但 `platforms/site.md` 要求「Links back to raw notes/data/recordings」，两版应对齐。

---

## 微信公众号 — 15/16

| 指标 | 分数 | 证据 |
| --- | ---: | --- |
| 事实准确与可追溯 | 1 | `article.md:29` 把共鸣写成普遍事实；`article.md:75` 关于视频的表述已与实际不符 |
| 结论支撑与边界 | 2 | `article.md:46-52` 单列一节写清「不能证明什么」；`:73` 明确 0 依赖 ≠ 0 成本 |
| 逻辑与叙事 | 2 | 按时间推演，`:19-31` 冲突在前、背景后置，`:33-44` 归因，`:54-67` 改法，`:69-75` 代价 |
| 表达可读性 | 2 | 每段不超过 3 行；润色后无翻案腔（diff 对 `:15,31,44,56,62,71,75` 的改写） |
| 平台适配与视觉证据 | 2 | `:41-42`、`:66-67` 两张图均有图注写明内容与来源；`:83-89` 配图清单含尺寸与缺口；`:5` 标题 17 字 |
| 读者痛点与吸引力 | 2 | `:19-23` 开头三行给出「半天 / 一周多 / 不是代码卡住」 |
| 关键词与语境 | 2 | `:62` 对「内容实验 harness」和 `AI agent` 都用一句人话解释 |
| 人工成本与发布状态 | 2 | `:73` 列出注册、补拍、确认、预览、排版、发布、评论维护；`:89,:94` 声明本稿非已发布证明 |

### 问题证据

- `drafts/wechat/article.md:29`：「很多人想学技能、做项目或改变习惯时，也会卡在这里」。review2 已点名此行并给出改法，本轮仍未改。README 的作者补充（`README.md:75`）本身也用了这句，但那里是作者自述语境；进入面向读者的正文必须显式标为作者观察。改为「我怀疑这不只发生在 AI 领域：想学技能、做项目或改变习惯时，人也可能卡在这里」。改后事实项可升至 2，本平台即达标。（review2 第 1 条，未完成）
- `drafts/wechat/article.md:75`：「视频尤其如此。录屏为 0，剪辑、配音和字幕都没有路径，当前只能交付脚本结构，不是一条能发的视频。」与 `drafts/youtube/packaging.md:3`（成片已生成，4 分 24 秒）直接冲突。需在两处之间选定一个真相后统一。

---

## 小红书 — 15/16

| 指标 | 分数 | 证据 |
| --- | ---: | --- |
| 事实准确与可追溯 | 1 | `note.md:64` 的「一周」与 `note.md:5` 标题、README Data「一周多」不一致 |
| 结论支撑与边界 | 2 | `note.md:42` 明确「这一次只能说明……没自己发现跨文件的矛盾」，不外推 |
| 逻辑与叙事 | 2 | `:17-33` 处境 → 冲突 → 归因，`:44-52` 改法与代价 |
| 表达可读性 | 2 | 段落 1-3 行，无教程腔与夸张词；`:23` 已改为口语化解释（见 diff） |
| 平台适配与视觉证据 | 2 | `carousel-brief.md:5-43` 逐页写明目的/来源、版面、文案、字号层级、状态；5 张 HTML 与 PNG 均实存于 `drafts/xiaohongshu/assets/` |
| 读者痛点与吸引力 | 2 | `note.md:17-19` 给处境与节奏，非「陈述事实 + 列表」 |
| 关键词与语境 | 2 | `note.md:23` 以人话解释 AI agent，未堆砌 `agent harness` 等术语 |
| 人工成本与发布状态 | 2 | `note.md:72-81`、`carousel-brief.md:45-50` 列出账号、预览、排版、发布均未执行 |

### 问题证据

- `drafts/xiaohongshu/note.md:64`：配图清单封面行仍写「半天写完 / 卡了一周的反差」。review2 已逐字点名此行。同一内容包内时长不一致，事实项无法给 2。改为「一周多」，并确认 `assets/00-cover.html` 与重渲染的 PNG 同步——`carousel-brief.md:9` 的封面文案已经是「一周多」，说明 brief 与清单本身也不一致。（review2 第 2 条，未完成）
- `drafts/xiaohongshu/carousel-brief.md:35`：`03-timeline` 状态写「需确认 HTML 已同步上述末节点文案后再发布」，该确认动作至今未标记完成。低严重度，属发布前人工待办，不影响评分。

---

## GitHub README — 14/16

| 指标 | 分数 | 证据 |
| --- | ---: | --- |
| 事实准确与可追溯 | 1 | `readme-section.md:26` 末句已被 `drafts/youtube/build/final.mp4` 证伪 |
| 结论支撑与边界 | 2 | `:11` 明确限定为单次回溯记录，不外推到所有模型或工作流 |
| 逻辑与叙事 | 2 | 问题 → 结果 → 失败与归因 → 指标表 → 检查入口 → 发布状态 |
| 表达可读性 | 2 | 紧凑，无社交 hook；润色只动 1 行（diff） |
| 平台适配与视觉证据 | 2 | 符合 `platforms/github.md`：含状态与日期、原题、指标表、无图（结构无需图解） |
| 读者痛点与吸引力 | 1 | 无一句说明读者能拿走什么可复用成果；review2 建议的补句未加（`:11` 后仍直接进表） |
| 关键词与语境 | 2 | `:7` 用一句解释 agent 的职责边界 |
| 人工成本与发布状态 | 2 | `:26` 列出账号、截图、作者确认、预览、排版、发布、评论维护均未执行 |

### 问题证据

- `drafts/github/readme-section.md:26`：「The zero recordings also mean the YouTube package is not a producible video.」此句在 review2 时为真，现已不成立：`drafts/youtube/build/final.mp4`（08-19 14:46，4 分 24 秒，见 `packaging.md:3`）已存在，且 `platforms/youtube.md` 的证据分级明确把会话记录列为「一手」，零录屏本身不再构成不可制作的理由。这是本轮把 GitHub 从 review2 的 `publish-ready` 退回的唯一原因。改为陈述实际状态（例如：成片由会话记录卡与数据卡构成，结论旁白待作者定稿），或删去该句。
- `drafts/github/readme-section.md:19`：「Dead links caught by validation on first run | 4」同样来自 README Log 而非 Data 段，与 `blog-zh.md:108` 一致。低严重度，建议把该指标补进 README Data。
- `drafts/github/readme-section.md:11` 后：仍缺一句「可复用成果」指引（实验骨架、`validate.sh`、HTML→PNG 渲染链路、平台配置），并链接 Artifacts。这是 review2 已提出的软项建议，未采纳，读者痛点项维持 1 分。

---

## YouTube — 12/16

本平台自 review2 后发生内容层改动，按当前文件与 `platforms/youtube.md` 重评，不沿用「零录屏 = 不可发布」的旧理由。

| 指标 | 分数 | 证据 |
| --- | ---: | --- |
| 事实准确与可追溯 | 1 | `packaging.md:3` 与 `packaging.md:24` 自相矛盾；`scenes.md` S14 的「十天」无来源 |
| 结论支撑与边界 | 1 | `scenes.md` S15 旁白把 README 中标注「未定稿」的结论当成片旁白播出，而同一内容包的 site/微信稿仍写「结论 TODO」 |
| 逻辑与叙事 | 2 | S01 处境 → S04-S06 批准与缺口 → S07-S11 失败 → S13-S14 改法与数字 → S15 结论，四拍齐全 |
| 表达可读性 | 2 | 旁白口语、句子短，引用原话未改写（`scenes.md:6-20` 声明并由 `assets/S*-quote.*` 与 `quotes.json` 佐证） |
| 平台适配与视觉证据 | 1 | 分镜、证据级别、来源标注齐备且无「缺」级；但 `script.md` 这份已作废文件仍留在 `drafts/youtube/`，且不是 `platforms/youtube.md` 声明的输出；thumbnail 仍只有文字方案（`packaging.md:64`） |
| 读者痛点与吸引力 | 2 | `packaging.md:8-12` 标题方案、`:16-18` thumbnail 概念都落在「半天 vs 一周多」的具体反差上 |
| 关键词与语境 | 2 | `scenes.md` S02、S13 用人话交代 agent 与流程，无术语堆砌 |
| 人工成本与发布状态 | 1 | 发布状态自相矛盾：`packaging.md:3` 称成片已生成，`scenes.md` 制作备注称 `build-video.py` 会拒绝构建，`packaging.md:24` 称不能制作成片 |

### 问题证据

- `drafts/youtube/packaging.md:3` vs `drafts/youtube/packaging.md:24`：同一文件内，前者写「成片已生成：`build/final.mp4`，4 分 24 秒」，后者的 Description 正文写「本期没有录屏，不能制作成片」。这段 Description 是要贴到 YouTube 上的对外文案，直接对读者说了假话。二者必须择一。
- `drafts/youtube/scenes.md`（制作备注首条）：「**S15 未定稿，`build-video.py` 会拒绝构建。** 这是有意的——结论没写完就不该出片。」但 `drafts/youtube/build/final.mp4` 存在且时间戳晚于该文件的约束声明。要么护栏被绕过、要么该备注已过期。在 `README.md:135-137` 的 Conclusion 仍标注「未定稿」的前提下，成片不得视为可发布，且需说明这次构建是如何越过护栏的。
- `drafts/youtube/scenes.md` S14 旁白：「十天，一百零五条真人输入，零个录屏文件。」`105` 可追溯到 `notes/session-timeline.md` 表头（「共 105 条真人输入」），但「十天」无对应记录：时间线跨度写的是 2026-08-08 → 2026-08-18，README Data 段里既没有「十天」也没有天数指标，Data 里对应的表述是「一周多（精确工时未记录）」。硬约束要求数字来自 `data/` 或 README Data 段。改用「一周多」，或把跨度与条数补进 README Data 后再引用。
- `drafts/youtube/scenes.md` S13 旁白：「后来跑了两轮审核，第一轮就抓出十条问题。」本报告落盘后即为三轮，该数字会立刻过期。建议改为不带轮次计数的说法，或在成片前重新核对。
- `drafts/youtube/script.md:1-30`：文件自称「已过时，不要照它制作」，但仍留在 `drafts/youtube/` 下，且不在 `platforms/youtube.md` 的 outputs 里。`:4` 的「预计时长 8-10 分钟」与实际 4 分 24 秒矛盾，`:57` 的画面说明仍是 review2 点名过的「半天做完 / 没法用」框架。留作历史记录应移出 `drafts/`（例如 `notes/`），否则任何读到 `drafts/` 的人都会拿到两份互斥的脚本。
- `drafts/youtube/packaging.md:64`：thumbnail 三个方案仍是文字描述，未出 HTML、未渲染 PNG。`platforms/youtube.md` 的验收清单要求有 thumbnail brief（已满足），但按视觉资产段，thumbnail 需 1280×720 实际出图才能发布。
- `drafts/youtube/packaging.md:55-56`：Shorts 候选引用 `01-before-after.png`、`02-contradiction.png`，未写明它们在 `drafts/xiaohongshu/assets/` 且为 3:4 竖版，直接复用到 16:9 Shorts 需重渲染。低严重度，属制作备注缺口。

---

## 审核结论

| 平台 | 总分 | 未达 2 分的硬项 | 状态 |
| --- | ---: | --- | --- |
| Site（英文 + 中文） | 13/16 | 事实准确与可追溯 = 1 | **not publish-ready** |
| 微信公众号 | 15/16 | 事实准确与可追溯 = 1 | **not publish-ready** |
| 小红书 | 15/16 | 事实准确与可追溯 = 1 | **not publish-ready** |
| GitHub README | 14/16 | 事实准确与可追溯 = 1 | **not publish-ready** |
| YouTube | 12/16 | 事实准确与可追溯 = 1；结论支撑与边界 = 1 | **not publish-ready** |

第 3 轮已用尽。按 SKILL.md 第八步，**不得再用润色掩盖问题**——本轮的问题没有一条是表达层的，再跑一次 `write` 不会改变任何一项评分。以下是需要人工补的最小问题集，逐条对应上表的未通过项。

### 需要人工补充的最小问题集

**跨平台（一次决定，四处生效）**

1. **确定「视频到底能不能交付」这一个事实，然后统一四处表述。** 冲突点：`drafts/youtube/packaging.md:3`（成片已生成 4:24）↔ `packaging.md:24`、`drafts/wechat/article.md:75`、`drafts/site/blog-zh.md:121`、`drafts/github/readme-section.md:26`（不能制作成片）。同时决定 `drafts/youtube/build/` 是否算交付物——`platforms/youtube.md` 写明成片和中间件不进 git，目前也确未入库。
2. **作者定稿 `README.md` 的 `## Conclusion`。** 现为「照本人原话整理，未定稿」。它同时卡住 `blog.md:103`、`blog-zh.md:137` 的 TODO 和 `scenes.md` S15 的旁白（该旁白已在成片里念出未定稿的结论）。

**逐平台**

3. **Site：** `blog.md:13`、`blog-zh.md:16` 的普遍化共鸣改成署名的作者观察；`blog-zh.md:93` 首次出现 `agent` 处补一句职责边界。（可选，不影响过线：`blog-zh.md:139-141` 补齐与英文版对齐的可点击链接。）
4. **微信：** `article.md:29` 同上一条共鸣改法。这是本平台唯一未完成项，改完即 16/16。
5. **小红书：** `note.md:64`「一周」改「一周多」，并核对 `assets/00-cover.html` 与重渲染的 PNG（`carousel-brief.md:9` 已是「一周多」）。这是本平台唯一未完成项，改完即 16/16。
6. **GitHub：** `readme-section.md:26` 末句按第 1 条的裁定重写；建议一并补一句可复用成果指引并链接 Artifacts（软项，补了到 16/16）。
7. **YouTube：** 除第 1、2 条外——`scenes.md` S14 的「十天」换成 README Data 有的说法（或把时间线跨度与 105 条补进 README Data）；`scenes.md` S13 的审核轮次数字重新核对；把已作废的 `script.md` 移出 `drafts/youtube/`；thumbnail 出 HTML 并 `render.sh` 渲染。
8. **数据溯源（低优先，两平台共用）：** 把「校验脚本首次运行抓出的死链 = 4」正式补进 `README.md` 的 `## Data` 段，`blog-zh.md:108` 与 `readme-section.md:19` 即可完全满足「数字只能来自 Data 段」。

发布前仍需作者本人确认：结论、个人经历表述、封面与图文顺序、各平台账号与发布动作。本内容包不代表上述任何动作已完成。
