# 内容审核 · 第 8 轮

- 审核日期：2026-09-04
- 审核范围：`drafts/site/blog.md`、`drafts/site/blog-zh.md`、`drafts/wechat/article.md`、`drafts/xiaohongshu/note.md`
- 依据：当前成稿、`README.md`、`data/steps.md`、`data/interventions.md`
- 本轮方法：叙事重写后的重新盲读。审核者只读对应新稿，不读任何前版或项目材料。

## 本轮修改

第 7 轮把 Film A 重做场景直接放在第一句，故事性提升，但读者尚不知道 Film A 是什么。本轮先用短总体说明交代：实验要补什么缺口、为什么做、两支输入分别是什么、是否做成；随后才让“技术通过仍推翻重做”的场景推动下文。

`content-forge` 同时新增两条硬规则：转折不能先于舞台；任何改动开场、叙事顺序、事实解释或交付状态的重写，都会使旧版盲读失效，必须重新盲读。

## 盲读结果

| 平台 | 结果 | 读者可复述 |
| --- | --- | --- |
| Site EN / ZH | 通过盲读 | 实验目标与动机、Film A/B、已完成结果、主要困难、可迁移方法与未开放工具。 |
| 微信公众号 | 通过盲读 | 内容流水线的视频缺口、两支影片、三轮重做的原因、公开与可复制成果、结论边界。 |
| 小红书 | 通过盲读 | 文字故事转插画动画的目标、旧片失败原因、Film A/B、主要困难和读者收获。 |

## 验证

- `check-structure.py`：通过。
- `validate.sh`：通过，保留数字序号与 180 秒推荐值的既有启发式警告。
- 中英文标点门禁：通过。
- `git diff --check`：通过。

## 审核结论

- Site EN：publish-ready
- Site ZH：publish-ready
- 微信公众号：publish-ready
- 小红书：publish-ready
