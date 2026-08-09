---
id: site
display_name: Website / static blog
aliases: [site, blog, website, github-pages, static-site, 网站, 静态站, 博客]
outputs:
  - path: drafts/site/blog.md
    template: templates/site/blog.md
language: en
publish_skill: null
---

# Website / Static Blog

## Role

The canonical, citable write-up. Optimize for credibility, search, future linking, and readers who want to verify the work.

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

## Acceptance Checklist

- Has title, date, slug, tags, summary, and experiment frontmatter.
- Has setup sufficient for another builder to understand what was tested.
- Contains only numbers from `data/` or README `Data`.
- Links back to raw notes/data/recordings.
- Flags missing conclusion or missing data instead of filling it in.
