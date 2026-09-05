# Can AI turn a story into a publishable animated video?

The previous text-only content-pipeline experiment failed at its video channel: it produced a 4 minute 24 second sequence of screenshots, cards, and narration that was not publishable as animation. This experiment retested the problem with one illustrated-video pipeline and two different text inputs: a software-experiment narrative and an original fairy tale.

**Date:** 2026-08
**Status:** experiment complete; both films published; playback data not yet available

## Question

`给一段文字讲的故事——没有分镜、没有素材、没有录像——AI 能不能自己把它变成一支画面连贯、能发出去的动画视频？`

In English: given a piece of text that tells a story, with no storyboard, footage, or prepared artwork, can AI turn it into a coherent animated video that is worth publishing?

## Process at a glance

The failed route was: **choose a topic → define background and subject icons → split scenes → assemble a video**. The revised route was: **choose a topic → split the narrative into scenes → assign one visual idea to each narration segment → fix the visual style → generate complete scenes → create independent layers only when motion requires them → design camera motion in code → derive timing from the final narration → assemble and run QA**. The experiment log contains the retries and implementation details; this sequence is the reader-facing overview.

This is also why `editorial-video` is not a mandatory background/foreground cutout pipeline. It starts with a complete scene for consistent lighting and materials, and splits out an opaque layer only when an element needs to move independently. In this experiment, splitting everything first created sticker-like composites and did not transfer.

## Setup

Author observation: this is for someone with a project or story to show but no footage, illustration, or editing material. Here, AI video generation means illustrated scenes assembled with code. Human-in-the-loop means a person still owns story decisions, visual review, and rejection.

- macOS, Claude Code CLI, Opus 5, Node.js 24.6.0
- Tencent image generation and TTS
- One final pipeline for both films; Film A briefly tested a browser frame renderer during iteration
- No filming, presenter, graphics editor, or OpenAI API key

## Results

| Metric | Film A | Film B |
| --- | ---: | ---: |
| Input | Software experiment record | Original fairy tale |
| Final duration | 186.46 s | 76.60 s |
| Longest frozen frame | 4.67 s | 4.00 s |
| QA failures | 0 | 0 |
| Author score | 4/5 | 3/5 |
| Time to current version | Nearly one week | Half a day |

Across both films, the run used 137 generated images but kept 18. Image and voice APIs cost CNY 29.27. The full experiment took about 19 hours, included 21 failed attempts, and recorded 37 human interventions: 25 decisions, 10 actions that can become rules, and 2 manual rework actions. Token use was not recorded.

## Takeaway

AI can produce linear illustrated videos at low API cost. Once narration is final, voice generation, timing, rendering, and assembly can run as an automated chain. Story decisions, visual direction, review, and rejection still require a person. Two samples show that the pipeline can handle different subject types; they do not show that it can automatically make a good video from any story.

## Practice ledger

| Practice | Effective | Transfers |
| --- | --- | --- |
| Generate complete scenes after fixing style as data | Yes | Yes |
| Derive shot timing from final narration audio | Yes | Yes |
| Put repeatable movement in code keyframes | Yes | Yes |
| Generate opaque assets when an element must move independently | Yes | Yes |
| Split every scene into background and subject, then depend on cutouts | No for this class of generated video | No |
| Control complex poses by repeatedly rewriting prompts | No in this run | Not directly |

## Contents

- [`README.md`](../../README.md) - full experiment record and conclusion
- [`notes/`](../../notes/) - research, failures, and review notes
- [`data/`](../../data/) - timing and intervention records
- [`video/`](../../video/) - Film A and Film B source projects

## Published films

- [Film A: AI-generated account of Experiment 1](https://youtu.be/oOVnuUOSYBY)
- [Film B: The Last Light](https://youtu.be/aUFPD-lNm3w)

## Boundary

The sample size is two, both stories are linear, and neither requires live footage or a presenter. QA passing means the picture moves and the manifest is valid; it does not measure whether the film is good.
