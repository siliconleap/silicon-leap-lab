# Silicon Leap Lab

Experiment records for [Silicon Leap](https://github.com/) (硅基跃迁) — an ongoing investigation
into how AI changes the way one person builds software.

Each experiment is a directory under `experiments/`. Raw notes, measurements, terminal
recordings, and code stay together with the write-up.

This is a monorepo on purpose. Experiments cross-reference each other — structural comparison
across runs is the point, not each run in isolation.

## Experiments

| Date | Experiment | Status |
| --- | --- | --- |
| | | |

## Layout

```
experiments/
  YYYY-MM-<slug>/
    README.md          # design and conclusion — the only required file
    plan.md            # the run script — written by experiment-plan before the run
    notes/             # raw notes from the run
    data/              # timings, token counts, success rates
    recordings/        # asciinema casts and window captures
    code/              # experiment code
    drafts/            # pipeline output — not hand-written
```

Full conventions: [`silicon-leap-forge/docs/experiment-layout.md`](../silicon-leap-forge/docs/experiment-layout.md)

## Notes are raw on purpose

Notes taken during a run are not cleaned up. What went wrong, what was tried, what the error
said, what the thinking was at the time — that mess is the source material for video, and it is
exactly what the blog post strips out. Both come from here.

## Graduation

When an experiment produces something installable, needs its own release cycle, or is worth
maintaining long-term, it moves to its own repo. The record stays here with a pointer.

## Related repos

| Repo | Contents |
| --- | --- |
| `silicon-leap-forge` | content pipeline |
| `silicon-leap-lab` | this one — experiment records |
| `silicon-leap-site` | blog static site |
