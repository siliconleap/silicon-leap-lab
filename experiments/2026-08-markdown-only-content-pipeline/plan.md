# 实验剧本：纯 Markdown 约定 + Claude Code Skill 的内容流水线

> **回溯补记**：本剧本晚于实验执行，步骤为实际发生过程的还原，不是开跑前的计划。
> 因此本文件不含「预期反直觉点」——事后写的预测没有价值，也违背 `experiment-plan` 自己的边界。
> 下面的「实际发现」是跑的过程中真正撞上的意外，按发生顺序记录。
>
> 后续实验必须先写 `plan.md` 再开跑，本次是流水线本身尚未建成导致的一次性例外。

## 产物时间轴

| 时刻 | 产生什么 | 谁 |
| --- | --- | --- |
| 开跑前 | `README.md` 骨架 + 本文件 | init-experiment.sh |
| 每步开始 | 记下开始时间 | 你 |
| **跑的过程中** | `notes/` `recordings/` `data/` ← **唯一产生窗口，错过补不回来** | 你 |
| 跑完 | README 的 Log / Data / What Worked / What Failed | agent 起草，你核对 |
| 跑完 | README 的 Conclusion | **只能你写** |
| 产生可复用成果时 | README 的 Artifacts 段（写指针，不拷贝） | 你 |
| 最后 | `drafts/` | content-forge |

> 本次为补记，第一行的「开跑前」并未真实发生——脚本是在这次实验里才写出来的。
> 「跑的过程中」那一格全部落空，正是本次零录屏零计时的原因。

## 判据

1. **前段**：`experiment-plan` 能否从一句话选题产出可照着跑的实验目录（七段骨架齐全 + 剧本含交付物）
2. **后段**：`content-forge` 能否产出四个平台的内容包，且平台之间确实有差异（不是同一篇改长度）
3. **依赖**：全程零平台工具（n8n / Coze / Dify / Wordware），产物全部是纯文本、可版本控制

## 实际发现

跑的过程中真正撞上的三件意外，都不在事前设想里：

**(a) 绝对路径软链会被 git 原样存进对象**

`lab/.claude/skills/` 下原有两个指向 forge 的软链用的是绝对路径。git 把软链目标当作 blob 内容存储——一旦 push，本机用户名和完整目录结构就公开了。用相对路径软链则无此问题，且 clone 后依然可用。

**(b) 仓库初始 commit 的 author 是本机真实身份，而非已配好的品牌身份**

`git config user.name` 早已设为品牌身份，但初始 commit 的 author/committer 仍是本机个人身份——配置晚于那次提交。仓库从未 push，`--reset-author` 即可无损修复。根因是全局身份仍是个人身份，靠 repo-local override 挡；换个新仓库忘了设就会复发。

**(c) `cp -R` 到已存在的同名目录会产生嵌套**

目标 `skills/` 已存在时，`cp -R src/skills dst/skills` 不是合并而是拷进去，得到 `skills/skills/`。执行前没检查目标是否存在。

## 步骤

按实际发生顺序还原。

| # | 做什么 | 交付物 | 记什么数据 | 录哪段 |
| --- | --- | --- | --- | --- |
| 1 | 读 forge 的约定文档，搞清实验目录与流水线现状 | 结论：流水线只有中段（素材→初稿） | 文档数 2，skill 数 1 | 无 |
| 2 | 修 lab README 指向约定文档的坏链接 | `README.md` 第 31 行 | 坏链接 1 处 | 无 |
| 3 | 设计三段式流水线，确认缺前段和后段 | 设计结论：补前段，发布留第二版 | 缺口 2 处 | 无 |
| 4 | 写 `experiment-plan` skill | `.claude/skills/experiment-plan/SKILL.md` | 硬约束 6 条 | 无 |
| 5 | 连带更新约定与下游 skill | `docs/experiment-layout.md`、`content-forge/SKILL.md`、forge `README.md` | 改动文件 3 | 无 |
| 6 | 建 `.agents/skills` 相对软链（forge 与 lab 各一） | 两条相对软链 | 软链 2 条 | 无 |
| 7 | 把 forge 的 skills 实拷进 lab | lab `.claude/skills/` 12 个文件 | **失败 1 次**（嵌套，见发现 c） | 无 |
| 8 | 全仓库敏感信息扫描 | 扫描结论 | **发现 2 处泄露**（见发现 a、b） | 无 |
| 9 | 重写初始 commit 的 author | commit `87e3719` | 重写 1 个 commit | 无 |
| 10 | 提交并推送 | commit `e08657d`，tracked 16 个文件 | 推送 1 次，无需 force | 无 |
| 11 | 配 `includeIf` 做全局身份隔离并验证 | `~/.gitconfig` 追加段、`~/.gitconfig-siliconleap` | 验证 3 场景全过 | 无 |

## 数据字段

| 字段 | 单位 | 记录时机 | 本次值 |
| --- | --- | --- | --- |
| 单步耗时 | 分钟 | 每步开始/结束 | **待补**——全程未计时 |
| 总耗时 | 分钟 | 收尾 | **待补**（见下方说明） |
| token 消耗 | token | 收尾 | **待补**——未记录 |
| 失败次数 | 次 | 发生时 | 1（步骤 7） |
| 需人工干预次数 | 次 | 发生时 | 2（步骤 8 的两处泄露均需人工确认修复方案） |
| 主观评分 | 1-5 | 收尾 | **待补**——需本人评分并写理由 |

**耗时为什么拿不到**：`git commit --amend --reset-author` 会把 author date 一并重置。lab 两个 commit 的时间戳因此都变成 21:50 前后，无法反映真实跨度。这是本次数据最大的缺口，下次必须在步骤开始时手记时间。

## 录制清单

**本次零录屏。**

计划中应有的片段（下次实验必须补上）：

- `01-repo-scan.cast`——读文档、确认流水线缺口
- `02-skill-authoring.cast`——写 `experiment-plan` skill
- `03-secret-scan.cast`——敏感信息扫描与两处泄露的发现瞬间
- `04-identity-fix.cast`——重写 commit author 与 `includeIf` 验证

第 3 段是最可惜的——「扫描时突然发现 author 是本机身份」这个瞬间是天然的视频钩子，没录下来。

## 已知风险

- **回溯补记削弱可信度**：剧本晚于执行，读者有理由怀疑步骤是被结果反向修饰过的。缓解办法是所有步骤都对应可核验的 commit 和文件路径，不写无凭据的过程描述。
- **数据薄**：耗时与 token 三项全空，`content-forge` 的硬约束会把它们标成「待补」，四个平台的初稿里凡涉及量化对比的段落都会是占位。
- **视频渠道本次不可用**：零录屏，`youtube` 平台包只能产出脚本结构，无对应素材。
- **样本量为 1**：只跑了一次，判据 2（平台差异）的结论强度有限，需要第二个实验交叉验证。
