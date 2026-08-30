#!/usr/bin/env node
// s7「骨架半天就搭完了，但产出的成品质量很差。剩下的一周多，全花在打磨上」
//
// 第七种运动: 条形推进与回退。上面那条一冲到底, 下面那条爬爬停停、还要往回退
// 几次——每一次回退是一轮返工。两条并排, 长短差距自己说话。
//
// 实验一的 README 写明「精确工时未记录」, 所以这里不能有刻度、百分比或天数,
// 只有「半天」和「一周多」两个标签, 和一条明显长得多的轨道。
import {mkdirSync, writeFileSync, copyFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {easeOut, easeInOut, window_, pulse, mix, clamp01} from
  'file:///Users/kaidong/Code/editorial-video/scripts/lib/easing.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const dir = process.argv[2] ?? path.join(here, 'frames');
// 素材共用一份, 构建时复制进帧目录——同一张底板存十二份是三十六兆。
const ASSETS = path.join(here, '..', '..', 'assets');
const USES = [
  ['plate-ai-b.png', 'plate.png'],
];

const W = 1920, H = 1080, FPS = 24, DURATION = 12;

const TRACK_X = 300, TRACK_W = 1330;

// 打磨那条爬爬停停: 每段前进一点, 再退回一截。退的那几下就是返工。
const GRIND = [
  [0.00, 0.10, 0.22], [0.10, 0.05, 0.17],   // 进到 22%, 退回 17%
  [0.16, 0.12, 0.41], [0.28, 0.05, 0.34],
  [0.34, 0.14, 0.62], [0.48, 0.05, 0.55],
  [0.54, 0.16, 0.86], [0.70, 0.04, 0.80],
  [0.75, 0.13, 1.00],
];
function grindAt(u) {
  let value = 0;
  for (const [start, span, target] of GRIND) {
    if (u < start) break;
    const k = easeInOut(clamp01((u - start) / span));
    value = mix(value, target, k);
  }
  return value;
}

function frameHtml(t) {
  const breath = pulse(t, 0.8);
  // 骨架条: 一冲到底, 早早就满了。
  const frame = easeOut(window_(t, 0.08, 0.12), 2.6);
  // 打磨条: 从骨架满了之后才开始, 一直爬到最后一刻。
  const grind = grindAt(window_(t, 0.2, 0.72));
  const rework = GRIND.filter(([s, , target], i) => i % 2 === 1
    && window_(t, 0.2 + s * 0.72, 0.04) > 0 && window_(t, 0.2 + s * 0.72 + 0.06, 0.06) < 1).length;

  const caption = easeOut(window_(t, 0.72, 0.12));
  const note = easeOut(window_(t, 0.44, 0.14));

  return `<!doctype html><html><head><meta charset="utf-8">
<meta name="render-size" content="${W}x${H}">
<style>*{margin:0;padding:0;box-sizing:border-box}
body{width:${W}px;height:${H}px;position:relative;overflow:hidden;background:#0a1730;
 font-family:'PingFang SC',sans-serif}
.plate{position:absolute;left:50%;top:50%;width:${W}px;height:${H}px;object-fit:cover;
 transform:translate(-50%,-50%) scale(1.06);filter:brightness(.42) blur(4px)}
.row{position:absolute;left:${TRACK_X}px;width:${TRACK_W}px}
.row .name{font-size:38px;color:#B7CCE6;letter-spacing:2px;margin-bottom:18px;display:flex;
 justify-content:space-between;align-items:baseline}
.row .name em{font-style:normal;font-size:30px;color:#7E98BA}
.track{position:relative;height:26px;border-radius:999px;background:rgba(16,34,64,.85);
 box-shadow:0 0 0 1px rgba(120,180,255,.22) inset}
.fill{position:absolute;left:0;top:0;bottom:0;border-radius:999px}
.a .fill{background:linear-gradient(to right,#3E7FD0,#7FC4FF);
 box-shadow:0 0 26px rgba(110,190,255,.65)}
.b .fill{background:linear-gradient(to right,#B36A28,#F0A050);
 box-shadow:0 0 ${(26 + 12 * breath).toFixed(0)}px rgba(240,160,80,.6)}
.head{position:absolute;top:50%;width:14px;height:44px;border-radius:6px;
 transform:translate(-50%,-50%);background:#F5FAFF;box-shadow:0 0 24px rgba(200,235,255,.9)}
.note{position:absolute;font-size:29px;color:#F0A050;letter-spacing:1px;
 text-shadow:0 0 18px rgba(240,150,60,.5)}
.caption{position:absolute;left:120px;bottom:96px;opacity:${caption.toFixed(3)};
 transform:translateY(${((1 - caption) * 18).toFixed(0)}px)}
.caption b{display:block;font-size:62px;font-weight:600;color:#F1F6FC;letter-spacing:3px}
.caption span{display:block;margin-top:14px;font-size:33px;font-weight:300;color:#A9BFDC;
 letter-spacing:2px}
</style></head><body>
<img class="plate" src="plate.png">
<div class="row a" style="top:318px">
  <div class="name"><span>搭骨架</span><em>半天</em></div>
  <div class="track"><div class="fill" style="width:${(frame * 22).toFixed(1)}%"></div>
    ${frame > 0.02 && frame < 0.99 ? `<div class="head" style="left:${(frame * 22).toFixed(1)}%"></div>` : ''}
  </div>
</div>
<div class="row b" style="top:520px">
  <div class="name"><span>打磨到能发</span><em>一周多</em></div>
  <div class="track"><div class="fill" style="width:${(grind * 100).toFixed(1)}%"></div>
    ${grind > 0.02 && grind < 0.995 ? `<div class="head" style="left:${(grind * 100).toFixed(1)}%"></div>` : ''}
  </div>
</div>
<div class="note" style="left:${TRACK_X}px;top:646px;opacity:${note.toFixed(3)}">
  每一次往回退，都是一轮返工</div>
<div class="caption"><b>不是想精益求精</b><span>是不打磨就发不出去</span></div>
</body></html>`;
}

mkdirSync(dir, {recursive: true});
for (const [src, as] of USES) copyFileSync(path.join(ASSETS, src), path.join(dir, as));
const total = FPS * DURATION;
for (let f = 0; f < total; f += 1) {
  writeFileSync(path.join(dir, `fr${String(f).padStart(3, '0')}.html`), frameHtml(f / (total - 1)));
}
console.log(`${total} frames`);
