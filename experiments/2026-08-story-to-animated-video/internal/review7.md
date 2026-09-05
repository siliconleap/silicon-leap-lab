# 内容审核 · 第 7 轮

- 审核日期：2026-09-04
- 审核范围：`drafts/site/blog.md`、`drafts/site/blog-zh.md`、`drafts/wechat/article.md`、`drafts/xiaohongshu/note.md`
- 依据：当前成稿、`README.md`、`data/steps.md`、`data/interventions.md`
- 本轮变更：从“事实汇报”改为“一个技术通过却被推翻的成片”这条叙事主线。

## 修改判断

此前稿件能解释术语和交付状态，但每段都在介绍一个对象或数字，读者没有理由从头读到尾。本轮把 Film A 首次通过 QA、却没有讲清故事而被重做三次作为开场场景。

- 路线变化只解释这三次重做为什么发生。
- 137 张图、29.27 元、19 小时只解释试错的代价。
- 自动化只解释为何后段能跑、前段仍要人判断。
- `content-forge`、公开视频和未开放的 `editorial-video` 放到结果之后，作为读者能带走什么，而不是开头的产品清单。

## Skill 规则

`content-forge` 新增叙事控制：平台稿先选一条真实转折；长文遵循“卡点 → 失效 → 判断转向 → 代价与结果 → 可带走成果 → 边界”；Site、公众号、小红书各有不同落点。若把段首改为“X 是 Y”仍能成立，即判定为汇报稿，必须重写。

## 验证

- `check-structure.py`：通过，5 份稿件，0 项警告。
- `validate.sh`：通过。数字序号和 180 秒推荐值仍有既有启发式警告。
- 中英文标点门禁：通过。
- `git diff --check`：通过。

## 审核结论

- Site EN：publish-ready
- Site ZH：publish-ready
- 微信公众号：publish-ready
- 小红书：publish-ready
