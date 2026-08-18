---
id: site
display_name: Website / static blog
aliases: [site, blog, website, github-pages, static-site, 网站, 静态站, 博客]
outputs:
  - path: drafts/site/blog.md
    template: templates/site/blog.md
  - path: drafts/site/blog-zh.md
    template: templates/site/blog.md
language: en+zh
publish_skill: null
---

# Website / Static Blog

## Role

The canonical, citable write-up. Optimize for credibility, search, future linking, and readers who want to verify the work.

## 双语

站点上每篇实验文章都要有中英两版：`blog.md`（英）和 `blog-zh.md`（中）。

**中文版不要另起炉灶写。** 它和微信版共享同一份叙述主体——都是中文长文，都按时间推演，讲同一件事。做法是拿 `drafts/wechat/article.md` 改，而不是从蒸馏摘要重新生成一遍：

- 去掉公众号特有的部分：配图清单、发布备注、每段不超过 3 行的排版约束
- 换上 site 的 frontmatter（`title` / `date` / `slug` / `tags` / `summary` / `experiment` / `lang`）
- 配图直接引用 `../wechat/assets/*.png`，不要复制一份到 `site/assets/`。同一张图两处引用，改一次两处都更新
- 保留失败段落和 TODO 标记，规则和英文版一致

**两版不是互译。** 英文版按论证组织（问题 → 方法 → 证据 → 结论），中文版按时间推演（当时在做什么 → 撞上什么 → 想明白什么）。同一批事实，同一批数字，不同的组织方式。逐句对译出来的东西两边都不像人话。

frontmatter 里必须有 `lang: en` / `lang: zh` 和 `translationOf`（中文版指向英文 slug），否则静态站无法配对。

## Emphasis

- State the question and result early.
- Keep method, environment, data, and raw-material links visible.
- Use concrete caveats: what the data does and does not prove.
- Avoid platform slang, hype, and engagement bait.

## Layout Rules

- Frontmatter is required.
- Include an experiment link and reproducibility notes.
- Prefer tables for metrics.
- Use headings that describe the argument, not the publishing platform.
- The conclusion remains author-written if README `Conclusion` is empty.

## Visual Assets

A wall of text is a barrier, not a guide. Plan 2–3 visuals per post — more than that and they stop being read.

| Slot | Purpose | Form |
| --- | --- | --- |
| After the opening | Orient the reader in the system under test | Structure diagram (boxes and arrows, no decoration) |
| In Results | Make the headline number legible at a glance | Data card, or skip it if the table already reads cleanly |
| In What failed | Evidence | Real terminal screenshot or recording frame |

Specs:

- Landscape, 16:9 or 3:2. Must stay legible at half width on mobile.
- Light surface `#fcfcfb`, ink `#0b0b0b` / `#52514e`, hairline `#e1e0d9`. Ship a dark variant (`#1a1a19` / `#ffffff` / `#c3c2b7`) — dark mode is selected, never an automatic flip.
- Categorical colors in fixed slot order: `#2a78d6`, `#eb6834`, `#1baf7a`. Status colors carry an icon and a label, never color alone.
- System sans throughout. No serif or display face.
- Every figure gets a caption stating what it shows, and alt text.

Source priority: real screenshot > data card > structure diagram > illustration.

Deterministic cards are generated, not described. Write HTML source under `drafts/site/assets/` with `<meta name="render-size" content="1600x900">`, then run `scripts/render.sh` to produce the PNG. HTML is the source — versioned, diffable, re-rendered on change; the PNG is a build product. Never edit the PNG directly.

Redact inside images too: usernames, emails, and absolute paths get placeholders. A figure about a leak that itself leaks is worse than the original — images get reposted and cannot be corrected.

Screenshots that do not exist go in the gap list; a re-enacted screenshot must match the git history exactly.

## Acceptance Checklist

- Has title, date, slug, tags, summary, and experiment frontmatter.
- Has setup sufficient for another builder to understand what was tested.
- Contains only numbers from `data/` or README `Data`.
- Links back to raw notes/data/recordings.
- Flags missing conclusion or missing data instead of filling it in.
