---
title: "You cannot bookmark your way to growth"
date: 2026-08-09
slug: markdown-only-content-pipeline
tags: [claude-code, ai-agents, content-pipeline, tooling, workflow]
summary: "An agent can write one story for several platforms, and that part does automate. It is not as smooth as the internet says, and the quality comes from engineering constraints rather than luck with the prompt."
experiment: 2026-08-markdown-only-content-pipeline
lang: en
translations:
  zh: markdown-only-content-pipeline-zh
---

A thousand saved articles buy nothing you could call growth. So I used an agent to build a content pipeline, then used the pipeline to record the experiment itself. The skeleton took half a day. The first draft took more than a week.

Two things came out different from what I expected.

**One: an agent really can write the same story for several platforms in different registers, and that part really does automate. It is nowhere near as smooth as the internet says.** The automation itself has to be built and repaired: templates, constraints, review gates, all of it by hand. Wishing at a model does not produce a publishable article.

**Two: quality is not something you roll for.** The same model returns whatever the constraints ask of it. Mediocrity is not a property of the model, it is the default: with no explicit constraint, generation returns to the mean, and the mean is mediocre. What moves it is engineering: a skill that spells out what not to do, prompts that carry those rules item by item, a confirmed brief and an independent review gate. A bigger model just returns a more polished mean.

What follows is what actually happened during that week.

## The question

Can a content pipeline run on nothing but Markdown conventions and Claude Code skills, with no n8n, no Coze, no Dify, no server, no database?

The answer is yes, and it is the least interesting result here.

## Setup

Two repositories, both plain text: `silicon-leap-forge` holds the pipeline (skills, platform configs, templates), `silicon-leap-lab` holds the experiment records, input and output alike.

Two skills: `experiment-plan` turns a one-line topic into a runnable experiment directory; `content-forge` turns a finished experiment into per-platform drafts. An agent here is the Claude Code workflow that drafts and runs deterministic steps; fact confirmation and publishing decisions stay with the author. Environment: macOS, Claude Code CLI, git. Nothing else installed.

![Four pipeline stages: experiment-plan, the run itself, content-forge, and publish. The first is built this run, the second is not automatable, the third existed before, the fourth is not built.](assets/01-pipeline.png)
*The pipeline before and after this run. Only the middle stage existed; publishing is still open.*

## What complete looks like when it is empty

The generated skill had frontmatter, a numbered flow, a hard-constraints list, and an acceptance checklist. Approving it took one sentence.

Running it produced the failure. The Xiaohongshu draft was unreadable. Not wrong, just dead. Tracing it back, the template hardcoded a three-part list skeleton: *Results / What worked / What went wrong*. In a different file of the same configuration (`platforms/xiaohongshu.md`) sat this line:

> States the facts, then falls into a list. No situation, no reaction, numbers with no reference point.

The config was criticizing the template. The template was violating the config. **Read separately, both files were correct.** The contradiction only existed in the output.

The same section carried a rule that could never run: emit SVG source, rendered by the author. This machine has no `rsvg-convert`, no ImageMagick, no `wkhtmltoimage`. The rule was unexecutable from the day it was written.

## The week that was not a coding outage

The draft looked complete and read empty; each rewrite made me more reluctant to publish. Halfway through I wrote this in the session:

> After the code and the skill were generated, I had not understood the internals at all.

([`notes/session-timeline.md`](https://github.com/siliconleap/silicon-leap-lab/blob/master/experiments/2026-08-markdown-only-content-pipeline/notes/session-timeline.md), 2026-08-10 14:54:07, translated from the Chinese original and tidied; the original runs longer)

Approval took one sentence. The comprehension cost did not disappear; it deferred to the moment of use.

So the editorial standard went into the workflow rather than into one more rewrite. A draft is evidence for review, not a finished article: reviewers score factual traceability, conclusion support, logic, readability, platform fit, and disclosed human work, three rounds per batch, and a draft that misses the gate is marked not publish-ready. Three is the ceiling for wording work; overturning a fact, a title, or the structure starts a new batch, which is why this piece went through six.

## What that looked like in practice

The requirements went back into the skill: a seven-item anti-AI-tone list; a required narrative arc (why this experiment, what failed, what came out, whether it transfers); the Xiaohongshu template rewritten from a list skeleton into narrative structure; images that must actually render.

![Three layers of responsibility: script for deterministic work, agent for inferable drafting, human for actual decisions.](assets/02-layers.png)
*Determinism belongs in scripts. What remains is what a human actually has to decide.*

The durable part is pushing determinism down into scripts. Directory scaffolding, heading checks, validation, image rendering: no judgment required, so a shell script owns them. A validation script now checks the invariants, and its first run caught four dead links that had previously only surfaced through manual review. Images follow the same rule: HTML source is committed and diffable, PNGs are build products rendered by headless Chrome, no additional install.

## Results

| Metric | Value | Source |
| --- | --- | --- |
| Pipeline stages covered before this run | 1 of 3 (middle only) | code review |
| Skill files | 12 | `find` count |
| Platform configs / templates | 5 / 7 | `platforms/`, `templates/` |
| Information leaks found | 2 (commit author, absolute-path symlink) | git history + symlink scan |
| Execution failures | 1 (`cp -R` nesting) | run log |
| Identity-isolation scenarios verified | 3 / 3 | `includeIf` test |
| Platform-tool dependencies | 0 | no n8n / Coze / Dify |
| From starting to being willing to publish | more than one week; exact hours not recorded | author supplement, 2026-08-15 |
| Screen recordings | 0 (process evidence came from the session log instead: 105 human turns) | [`notes/session-timeline.md`](https://github.com/siliconleap/silicon-leap-lab/blob/master/experiments/2026-08-markdown-only-content-pipeline/notes/session-timeline.md) |
| Video channel delivery | failed (a 4:24 cut exists; not publishable) | author judgment, 2026-08-20 |
| Wall-clock time, token usage | not recorded | see caveats |

## What was tried, and what transfers

| Practice | Effective | Transfers |
| --- | --- | --- |
| Have an agent build a pipeline that drafts for several platforms at once | yes | yes |
| Adopt an existing community skill (Waza's `write`) to raise prose quality | yes | yes |
| Replace re-rolling with process: confirmed brief, independent review, three-round ceiling | yes | yes |
| Push deterministic work into scripts (scaffolding, validation, image rendering) | yes | yes |
| Have an agent assemble a video from generated images | not yet | no |

The last row is why the rest of the table is worth reading. The assembly works: plain-text scenes, TTS narration, images laid out against the narration length, narration doubling as subtitles, which produced a 4 minute 24 second cut. It is not publishable. With zero recordings, every frame is a session-log card or a diagram, and none of it is footage of the thing happening. The plain-text approach held for the written channels and broke here.

The platform configs do not transfer either: they are written against these specific channels, so a new channel means a rewrite.

## Boundary

Sample size is one. This run shows only that the generation did not surface a cross-file contradiction on its own and could not decide whether the text was worth publishing. It says nothing about models in general, and it does not imply that switching models is useless.

Three caveats. This record is retroactive: `plan.md` was reconstructed after the run, so the "expected counterintuitive finding" section became actual findings, since a prediction written after the fact is worth nothing. No timing or token data was captured and `--reset-author` overwrote the commit timestamps, which makes "more than a week" a recollection rather than a measurement. And there is no terminal screenshot here, nor should there be: the agent ran the commands while I stayed in a chat window, so the evidence is the session log (105 human turns, timestamped 08-08 to 08-18) and the git history.

Zero platform-tool dependencies are not zero publishing cost. Account registration and maintenance, real screenshots, author sign-off, mobile preview, layout, publishing, and comment handling are all human work, and none of it has been performed or verified by this content package.

The next experiment starts with `plan.md` written up front, so there is a prediction to be wrong about.

As for me, the lesson is one line: do not demand perfection, do not settle for mediocrity. Demand perfection and you never publish; settle for mediocrity and nobody reads what you publish.

## Reproduce

Everything is plain text. Inspect the [experiment README](https://github.com/siliconleap/silicon-leap-lab/blob/master/experiments/2026-08-markdown-only-content-pipeline/README.md), [confirmed content brief](https://github.com/siliconleap/silicon-leap-lab/blob/master/experiments/2026-08-markdown-only-content-pipeline/content-brief.md), [artifacts](https://github.com/siliconleap/silicon-leap-lab/blob/master/experiments/2026-08-markdown-only-content-pipeline/README.md#artifacts), and [full experiment directory](https://github.com/siliconleap/silicon-leap-lab/tree/master/experiments/2026-08-markdown-only-content-pipeline).
