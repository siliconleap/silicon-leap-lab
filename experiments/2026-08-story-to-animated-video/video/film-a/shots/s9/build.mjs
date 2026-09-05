#!/usr/bin/env node
// s9「第二件，让另一个没写过这稿子的 agent 来挑毛病」
//
// 第九种运动: 逐项落评。八项评分一行一行打出来, 满分的落定即止, 扣分的那几行
// 亮起并甩出具体问题——「没有证据不许给满分」这句话在画面上就是这个样子。
//
// 分数与结论全部来自实验一的 internal/review1.md: Site 12/16, 八项各自的分数,
// 结论 not publish-ready。一个字都没有编。
import {mkdirSync, writeFileSync, copyFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {easeOut, easeInOut, window_, pulse, mix, clamp01} from
  '../../src/easing.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const dir = process.argv[2] ?? path.join(here, 'frames');
// 素材共用一份, 构建时复制进帧目录——同一张底板存十二份是三十六兆。
const ASSETS = path.join(here, '..', '..', 'assets');
const USES = [
  ['plate-ai-b.png', 'plate.png'],
];

const W = 1920, H = 1080, FPS = 24, DURATION = 11;

// internal/review1.md 的 Site 一栏, 逐项照抄。
const ROWS = [
  ['事实准确与可追溯', 1, '链接指向 github.com 首页，不是实验仓库'],
  ['结论支撑与边界', 2, ''],
  ['逻辑与叙事', 2, ''],
  ['表达可读性', 2, ''],
  ['平台适配与视觉证据', 1, '「失败」一节缺真实终端证据'],
  ['读者痛点与吸引力', 2, ''],
  ['关键词与语境', 1, '用了 agent 却没按简报解释它'],
  ['人工成本与发布状态', 2, ''],
];

function frameHtml(t) {
  const breath = pulse(t, 0.8);
  const rows = ROWS.map(([name, score, issue], i) => {
    const enter = easeOut(clamp01((window_(t, 0.06, 0.42) - i * 0.1) / 0.26), 2.2);
    if (enter <= 0) return '';
    const short = score < 2;
    // 扣分的那几行晚一步亮起, 并甩出具体问题。
    const flagged = short ? easeOut(clamp01((window_(t, 0.5, 0.32) - i * 0.07) / 0.2)) : 0;
    return `<div class="row${short ? ' short' : ''}" style="opacity:${enter.toFixed(3)};`
      + `transform:translateX(${((1 - enter) * -40).toFixed(0)}px);`
      + `--flag:${flagged.toFixed(3)}">`
      + `<span class="n">${name}</span>`
      + `<span class="s">${score}<em>/2</em></span>`
      + (issue && flagged > 0.05
        ? `<span class="i" style="opacity:${flagged.toFixed(3)}">${issue}</span>` : '')
      + `</div>`;
  }).join('');

  const total = easeOut(window_(t, 0.62, 0.14));
  const verdict = easeOut(window_(t, 0.72, 0.12));
  const caption = easeOut(window_(t, 0.8, 0.12));

  return `<!doctype html><html><head><meta charset="utf-8">
<meta name="render-size" content="${W}x${H}">
<style>*{margin:0;padding:0;box-sizing:border-box}
body{width:${W}px;height:${H}px;position:relative;overflow:hidden;background:#0a1730;
 font-family:'PingFang SC',sans-serif}
.plate{position:absolute;left:50%;top:50%;width:${W}px;height:${H}px;object-fit:cover;
 transform:translate(-50%,-50%) scale(1.05);filter:brightness(.4) blur(4px)}
.head{position:absolute;left:160px;top:104px;display:flex;align-items:baseline;gap:22px}
.head b{font-size:44px;color:#EAF2FB;font-weight:600;letter-spacing:2px}
.head em{font-style:normal;font-size:28px;color:#7E98BA;letter-spacing:1px;
 font-family:'SF Mono','Menlo',monospace}
.sheet{position:absolute;left:160px;top:210px;width:1180px}
.row{display:flex;align-items:center;height:74px;padding:0 26px;border-radius:10px;
 border-left:4px solid rgba(120,180,255,.3);margin-bottom:9px;
 background:rgba(10,24,48,.72)}
.row .n{flex:0 0 400px;font-size:34px;color:#C6D8EE;letter-spacing:1px}
.row .s{flex:0 0 120px;font-size:38px;color:#9BE0BE;font-weight:600;
 font-family:'SF Mono','Menlo',monospace}
.row .s em{font-style:normal;font-size:25px;color:#5E7B99}
.row .i{font-size:26px;color:#F0A050;letter-spacing:1px}
.row.short{border-left-color:rgba(240,160,80,calc(.3 + .7 * var(--flag)));
 background:rgba(52,28,10,calc(.2 + .55 * var(--flag)));
 box-shadow:0 0 calc(26px * var(--flag)) rgba(240,150,60,.45)}
.row.short .s{color:#F0A050}
.total{position:absolute;right:150px;top:280px;text-align:right;width:420px;opacity:${total.toFixed(3)}}
.total b{display:block;font-size:104px;color:#F0A050;font-weight:600;
 font-family:'SF Mono','Menlo',monospace;
 text-shadow:0 0 ${(20 + 14 * breath).toFixed(0)}px rgba(240,150,60,.55)}
.total span{display:block;font-size:26px;color:#7E98BA;letter-spacing:2px;margin-top:6px}
.verdict{position:absolute;right:150px;top:470px;padding:14px 30px;border-radius:999px;
 border:2px solid rgba(240,150,60,.8);color:#F6C08C;font-size:32px;letter-spacing:2px;
 font-family:'SF Mono','Menlo',monospace;opacity:${verdict.toFixed(3)};
 box-shadow:0 0 28px rgba(240,150,60,.35)}
.caption{position:absolute;left:160px;bottom:82px;opacity:${caption.toFixed(3)};
 transform:translateY(${((1 - caption) * 18).toFixed(0)}px)}
.caption b{display:block;font-size:58px;font-weight:600;color:#F1F6FC;letter-spacing:3px}
.caption span{display:block;margin-top:12px;font-size:31px;font-weight:300;color:#A9BFDC;
 letter-spacing:2px}
</style></head><body>
<img class="plate" src="plate.png">
<div class="head"><b>独立审核 · 第 1 轮</b><em>internal/review1.md</em></div>
<div class="total"><b>12<em style="font-style:normal;font-size:40px;color:#5E7B99">/16</em></b>
  <span>SITE 中英双语稿</span></div>
<div class="verdict">not publish-ready</div>
<div class="sheet">${rows}</div>
<div class="caption"><b>换一个没写过这稿子的 agent 来挑毛病</b>
  <span>逐项打分，没有证据不许给满分</span></div>
</body></html>`;
}

mkdirSync(dir, {recursive: true});
for (const [src, as] of USES) copyFileSync(path.join(ASSETS, src), path.join(dir, as));
const total = FPS * DURATION;
for (let f = 0; f < total; f += 1) {
  writeFileSync(path.join(dir, `fr${String(f).padStart(3, '0')}.html`), frameHtml(f / (total - 1)));
}
console.log(`${total} frames`);
