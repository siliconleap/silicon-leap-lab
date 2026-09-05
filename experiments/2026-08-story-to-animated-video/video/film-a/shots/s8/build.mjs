#!/usr/bin/env node
// s8「第一件，不自己写。把社区里现成的写作 skill 接进流水线」
//
// 第八种运动: 插入并咬合。一块外来的模块从画外推进来, 对准流水线上的槽口按下去,
// 接口一亮, 四份稿子逐个从它里面过一遍。运动是「装上去」, 和前面七拍都不同。
//
// 末尾一行小字带出那句「改掉的多半不是词, 是假装深刻的句式」——旁白里只有一句,
// 画面就给一行, 不为它单开一拍。
import {mkdirSync, writeFileSync, copyFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {easeOut, easeInOut, window_, pulse, flash, spring, mix, clamp01} from
  '../../src/easing.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const dir = process.argv[2] ?? path.join(here, 'frames');
// 素材共用一份, 构建时复制进帧目录——同一张底板存十二份是三十六兆。
const ASSETS = path.join(here, '..', '..', 'assets');
const USES = [
  ['plate-ai-b.png', 'plate.png'],
];

const W = 1920, H = 1080, FPS = 24, DURATION = 16.5;

const SLOT = [1180, 470];   // 槽口位置
const FILES = ['README.md', 'blog.md', 'note.md', 'packaging.md'];

function frameHtml(t) {
  const breath = pulse(t, 0.8);
  const approach = easeOut(window_(t, 0.05, 0.26), 2.4);   // 模块推进来
  const seat = window_(t, 0.28, 0.1);                      // 咬合
  const click = flash(t, 0.33, 0.028);
  const live = easeOut(window_(t, 0.36, 0.14));            // 接口通电

  // 模块从画面右外侧推到槽口, 落位时轻微过冲。
  const x = mix(W + 420, SLOT[0], approach) - 10 * (1 - spring(seat));

  // 四个文件逐个从模块里过一遍: 进去是灰的, 出来是亮的。
  const files = FILES.map((name, i) => {
    const pass = clamp01((window_(t, 0.44, 0.42) - i * 0.14) / 0.3);
    if (pass <= 0) return '';
    const fx = mix(SLOT[0] - 620, SLOT[0] + 560, easeInOut(pass));
    const done = pass > 0.55;
    return `<div class="file ${done ? 'done' : ''}" style="left:${fx.toFixed(0)}px;`
      + `top:${SLOT[1]}px;opacity:${easeOut(Math.min(1, pass * 3)).toFixed(3)}">`
      + `<i></i>${name}</div>`;
  }).join('');

  const caption = easeOut(window_(t, 0.6, 0.12));
  const aside = easeOut(window_(t, 0.78, 0.12));

  return `<!doctype html><html><head><meta charset="utf-8">
<meta name="render-size" content="${W}x${H}">
<style>*{margin:0;padding:0;box-sizing:border-box}
body{width:${W}px;height:${H}px;position:relative;overflow:hidden;background:#0a1730;
 font-family:'PingFang SC',sans-serif}
.plate{position:absolute;left:50%;top:50%;width:${W}px;height:${H}px;object-fit:cover;
 transform:translate(-50%,-50%) scale(1.04);filter:brightness(.55) blur(2px)}
.rail{position:absolute;left:120px;top:${SLOT[1]}px;width:1680px;height:8px;
 transform:translateY(-50%);border-radius:999px;
 background:linear-gradient(to right,rgba(90,170,255,.15),rgba(120,200,255,.55),rgba(90,170,255,.15));
 box-shadow:0 0 26px rgba(90,180,255,.35)}
.socket{position:absolute;left:${SLOT[0]}px;top:${SLOT[1]}px;width:330px;height:150px;
 transform:translate(-50%,-50%);border-radius:14px;
 border:3px dashed rgba(120,190,255,${(0.7 - 0.6 * live).toFixed(2)})}
.mod{position:absolute;top:${SLOT[1]}px;width:330px;height:150px;transform:translate(-50%,-50%);
 border-radius:14px;background:linear-gradient(160deg,#13315e,#0d2044);
 border:2px solid rgba(150,215,255,${(0.5 + 0.45 * live).toFixed(2)});
 box-shadow:0 18px 44px rgba(0,0,0,.6),
 0 0 ${(20 + 40 * live + 20 * breath * live).toFixed(0)}px rgba(90,190,255,${(0.2 + 0.5 * live).toFixed(2)});
 display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px}
.mod-front b{font-size:40px;color:#E6F1FC;letter-spacing:2px;font-weight:600}
.mod-front em{font-style:normal;font-size:26px;color:#8FB4DC;letter-spacing:1px}
.pins{position:absolute;left:-16px;top:50%;transform:translateY(-50%);
 display:flex;flex-direction:column;gap:12px}
.pins i{width:16px;height:14px;border-radius:3px;background:rgba(150,215,255,${(0.35 + 0.6 * live).toFixed(2)});
 box-shadow:0 0 ${(14 * live).toFixed(0)}px rgba(120,200,255,.9);display:block}
.mod-front{position:absolute;left:${x.toFixed(0)}px;top:${SLOT[1]}px;width:330px;height:150px;
 transform:translate(-50%,-50%);border-radius:14px;pointer-events:none;
 background:linear-gradient(160deg,rgba(19,49,94,.97),rgba(13,32,68,.97));
 border:2px solid rgba(150,215,255,${(0.5 + 0.45 * live).toFixed(2)});
 box-shadow:0 18px 44px rgba(0,0,0,.6),
 0 0 ${(20 + 40 * live + 20 * breath * live).toFixed(0)}px rgba(90,190,255,${(0.2 + 0.5 * live).toFixed(2)});
 display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px}
.click{position:absolute;left:${SLOT[0]}px;top:${SLOT[1]}px;width:620px;height:620px;
 transform:translate(-50%,-50%);mix-blend-mode:screen;pointer-events:none;
 background:radial-gradient(circle,rgba(190,235,255,${(0.5 * click).toFixed(3)}) 0%,
 rgba(90,180,255,${(0.2 * click).toFixed(3)}) 40%,rgba(0,0,0,0) 70%)}
.file{position:absolute;transform:translate(-50%,-50%);display:flex;align-items:center;gap:12px;
 padding:12px 26px;border-radius:10px;background:rgba(10,22,44,.9);
 border:2px solid rgba(120,170,220,.4);color:#8FA8C6;font-size:31px;letter-spacing:1px;
 font-family:'SF Mono','Menlo',monospace;white-space:nowrap}
.file i{width:11px;height:11px;border-radius:2px;display:block}
.file i{background:#59718F}
.file.done{border-color:rgba(130,215,175,.85);color:#DCF2E8;
 box-shadow:0 0 24px rgba(90,210,160,.4)}
.file.done i{background:#6FD6A6;box-shadow:0 0 12px rgba(110,225,170,.9)}
.caption{position:absolute;left:120px;bottom:150px;opacity:${caption.toFixed(3)};
 transform:translateY(${((1 - caption) * 18).toFixed(0)}px)}
.caption b{display:block;font-size:62px;font-weight:600;color:#F1F6FC;letter-spacing:3px}
.caption span{display:block;margin-top:14px;font-size:33px;font-weight:300;color:#A9BFDC;
 letter-spacing:2px}
.aside{position:absolute;left:120px;bottom:82px;font-size:29px;color:#7E98BA;letter-spacing:1px;
 opacity:${aside.toFixed(3)}}
.aside u{text-decoration:none;color:#F0A050}
</style></head><body>
<img class="plate" src="plate.png">
<div class="rail"></div><div class="socket"></div>
<div class="mod" style="left:${x.toFixed(0)}px">
  <div class="pins"><i></i><i></i><i></i></div></div>
${files}<div class="mod-front"><b>写作 skill</b><em>社区现成的</em></div><div class="click"></div>
<div class="caption"><b>不自己写</b><span>逐个文件过一遍，只改表达，不动事实</span></div>
<div class="aside">改掉的多半不是词，是<u>「问题不只是 A，而是 B」</u>这类假装深刻的句式</div>
</body></html>`;
}

mkdirSync(dir, {recursive: true});
for (const [src, as] of USES) copyFileSync(path.join(ASSETS, src), path.join(dir, as));
const total = FPS * DURATION;
for (let f = 0; f < total; f += 1) {
  writeFileSync(path.join(dir, `fr${String(f).padStart(3, '0')}.html`), frameHtml(f / (total - 1)));
}
console.log(`${total} frames`);
