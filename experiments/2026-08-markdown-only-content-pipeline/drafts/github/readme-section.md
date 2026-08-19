## 2026-08 · Markdown-only content pipeline

**Status:** record complete; content package not publish-ready · **Date:** 2026-08-09

**Question:** Can a content pipeline run on Markdown conventions and Claude Code skills, with no n8n, Coze, Dify, server, or database?

For this run, yes: `experiment-plan` produced the experiment structure and `content-forge` produced per-platform drafts. Here, a Claude Code **agent** means the workflow that assists with drafting and deterministic steps; it does not confirm facts or make publishing decisions.

The first Xiaohongshu draft was not prepared for publication. The author found it lacked a concrete situation and narrative entry point; tracing it back exposed a local contradiction: the platform configuration rejected list-first writing while its template hardcoded a three-part list. A visual-assets rule also required a renderer that was not installed on this machine.

This is a single retroactive record. It supports the narrower finding that this run did not surface those contradictions on its own; it does not establish a general limit for all models or workflows. The process now requires an author-confirmed content brief and up to three independent review/revision rounds.

| Metric | Value |
| --- | --- |
| Pipeline stages covered before this run | 1 of 3 (middle only) |
| Skill files | 12 |
| Platform configs / templates | initial run: 4 / 6; after WeChat addition: 5 / 7 |
| Information leaks found and fixed | 2 |
| Dead links caught by validation on first run | 4 |
| Platform-tool dependencies | 0 |
| From starting to being willing to publish | more than one week; exact hours not recorded |
| Screen recordings | 0 (session log used as process evidence instead) |

**Inspect:** [experiment README](https://github.com/siliconleap/silicon-leap-lab/blob/master/experiments/2026-08-markdown-only-content-pipeline/README.md) · [content brief](https://github.com/siliconleap/silicon-leap-lab/blob/master/experiments/2026-08-markdown-only-content-pipeline/content-brief.md) · [artifacts](https://github.com/siliconleap/silicon-leap-lab/blob/master/experiments/2026-08-markdown-only-content-pipeline/README.md#artifacts) · [full experiment directory](https://github.com/siliconleap/silicon-leap-lab/tree/master/experiments/2026-08-markdown-only-content-pipeline)

**Publishing status:** account setup and maintenance, real screenshots, author sign-off, mobile preview, layout, publishing, and comment handling have not been executed or verified. Video is producible: the first cut runs 4:24, assembled from plain-text scenes, TTS narration, and session-log cards, with no screen recordings.
