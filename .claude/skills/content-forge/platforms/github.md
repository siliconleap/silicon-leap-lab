---
id: github
display_name: GitHub README
aliases: [github, readme, repo-readme, github-readme, README, GitHub]
outputs:
  - path: drafts/github/readme-section.md
    template: templates/github/readme-section.md
language: en
publish_skill: null
---

# GitHub README

## Role

The shortest technical summary for people browsing the experiment repository.

## Emphasis

- What was tested.
- How to reproduce or inspect the run.
- The smallest useful result table.
- Links to notes, data, recordings, code, and published write-ups.

## Layout Rules

- Keep it compact.
- Do not use social hooks.
- Do not bury status.
- Prefer links over explanation when raw artifacts exist.

## Visual Assets

At most one image. A README section that needs three diagrams is a blog post in the wrong place.

- Use it only when the structure is genuinely hard to state in a sentence — then a boxes-and-arrows diagram; otherwise none.
- HTML source under `drafts/github/assets/` with `<meta name="render-size" content="1600x900">`, rendered to PNG by `scripts/render.sh`, referenced by relative path. Never link an image that does not exist in the repo — `validate.sh` fails on it.
- Redact usernames, emails, and absolute paths inside the image, not just in the prose.
- GitHub renders both themes: either use colors that hold on light and dark surfaces, or ship two files behind `<picture>`.
- Alt text is required; a diagram with no alt text is a blank space for anyone reading with a screen reader or on a slow connection.

## Acceptance Checklist

- Fits as a section inside an experiment README.
- Includes status and date.
- Uses the exact experiment question.
- Has a metric table or explicitly says data is TBD.
- Leaves author takeaway as TODO if conclusion is not present.
