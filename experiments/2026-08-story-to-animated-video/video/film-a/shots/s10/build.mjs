#!/usr/bin/env node
// s10「第三件，用流程替代抽卡」
//
// 第十种运动: 左右对照。左边是抽卡——同一个按钮按三次, 掉出三张互不相干的稿子,
// 每次都从头再来; 右边是流程——简报、人确认、展开成稿, 不满意退回上一步接着改。
// 两边并排同时演, 差别自己说话。
import {mkdirSync, writeFileSync, copyFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {easeOut, easeInOut, window_, pulse, flash, mix, clamp01} from
  '../../src/easing.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const dir = process.argv[2] ?? path.join(here, 'frames');
// 素材共用一份, 构建时复制进帧目录——同一张底板存十二份是三十六兆。
const ASSETS = path.join(here, '..', '..', 'assets');
const USES = [
  ['plate-ai-b.png', 'plate.png'],
];

const W = 1920, H = 1080, FPS = 24, DURATION = 14;

const STEPS = ['先出简报', '事实与观点交给人确认', '确认了才展开成稿'];

function frameHtml(t) {
  const breath = pulse(t, 0.8);
  const leftIn = easeOut(window_(t, 0.04, 0.14));
  const rightIn = easeOut(window_(t, 0.3, 0.14));

  // 左: 抽三次, 每次掉一张废稿, 上一张被推开。三次都是重新开始。
  const draws = [0, 1, 2].map((i) => {
    const u = window_(t, 0.12 + i * 0.13, 0.13);
    if (u <= 0) return '';
    const drop = easeOut(u, 2.2);
    const age = clamp01((window_(t, 0.12 + (i + 1) * 0.13, 0.1)));
    return `<div class="draw" style="top:${(296 + drop * 128).toFixed(0)}px;`
      + `opacity:${(drop * (1 - age * 0.28)).toFixed(3)};`
      + `transform:translate(-50%,0) rotate(${(-6 + i * 5).toFixed(1)}deg) `
      + `translate(${(age * -54).toFixed(0)}px,${(age * 122).toFixed(0)}px) `
      + `scale(${(1 - age * 0.06).toFixed(3)})">`
      + `<i></i>第 ${i + 1} 次生成</div>`;
  }).join('');
  const press = [0, 1, 2].map((i) => flash(t, 0.13 + i * 0.13, 0.016)).reduce((a, b) => a + b, 0);

  // 右: 三步依次点亮, 第三步不满意退回第二步, 再走一遍。
  const back = window_(t, 0.72, 0.1);
  const redo = window_(t, 0.8, 0.12);
  const steps = STEPS.map((name, i) => {
    const on = easeOut(clamp01((window_(t, 0.36, 0.3) - i * 0.1) / 0.16));
    // 第三步在退回时熄掉, 第二步重新亮起, 然后第三步再亮一次。
    const dim = i === 2 ? easeInOut(back) * (1 - easeInOut(redo)) : 0;
    const relit = i === 1 ? easeInOut(back) * (1 - easeInOut(redo)) : 0;
    return `<div class="step${on > 0.5 ? ' on' : ''}" style="opacity:${on.toFixed(3)};`
      + `--dim:${dim.toFixed(3)};--relit:${relit.toFixed(3)}">`
      + `<b>${i + 1}</b><span>${name}</span></div>`;
  }).join('');

  const arrow = easeOut(window_(t, 0.72, 0.1)) * (1 - easeInOut(window_(t, 0.86, 0.08)));
  const caption = easeOut(window_(t, 0.84, 0.12));

  return `<!doctype html><html><head><meta charset="utf-8">
<meta name="render-size" content="${W}x${H}">
<style>*{margin:0;padding:0;box-sizing:border-box}
body{width:${W}px;height:${H}px;position:relative;overflow:hidden;background:#0a1730;
 font-family:'PingFang SC',sans-serif}
.plate{position:absolute;left:50%;top:50%;width:${W}px;height:${H}px;object-fit:cover;
 transform:translate(-50%,-50%) scale(1.05);filter:brightness(.4) blur(4px)}
.col{position:absolute;top:130px;width:800px}
.col h{display:block;font-size:38px;letter-spacing:2px;margin-bottom:10px}
.col em{display:block;font-style:normal;font-size:27px;letter-spacing:1px;margin-bottom:34px}
.L{left:120px;opacity:${leftIn.toFixed(3)}}
.L h{color:#E0A98A}.L em{color:#8B7060}
.R{right:120px;opacity:${rightIn.toFixed(3)}}
.R h{color:#9FD8FF}.R em{color:#6D8CAC}
.split{position:absolute;left:50%;top:150px;bottom:210px;width:1px;
 background:linear-gradient(to bottom,rgba(120,180,255,0),rgba(120,180,255,.35),rgba(120,180,255,0))}
.btn{position:absolute;left:520px;top:250px;transform:translate(-50%,-50%);
 width:210px;height:74px;border-radius:12px;display:flex;align-items:center;justify-content:center;
 background:rgba(60,30,14,${(0.7 + 0.3 * press).toFixed(2)});
 border:2px solid rgba(240,150,70,${(0.6 + 0.4 * press).toFixed(2)});color:#F6C08C;
 font-size:30px;letter-spacing:2px;box-shadow:0 0 ${(20 + 50 * press).toFixed(0)}px rgba(240,150,60,.5)}
.draw{position:absolute;left:520px;width:290px;padding:20px 24px;border-radius:12px;
 background:rgba(24,20,18,.9);border:2px solid rgba(150,110,80,.5);color:#A08670;
 font-size:28px;display:flex;align-items:center;gap:14px;font-family:'SF Mono','Menlo',monospace}
.draw i{width:11px;height:11px;border-radius:50%;background:#8A6A50;display:block}
.step{position:relative;display:flex;align-items:center;gap:22px;height:96px;padding:0 28px;
 margin-bottom:20px;border-radius:12px;background:rgba(10,26,52,.8);
 border:2px solid rgba(120,180,255,calc(.28 + .5 * var(--relit)));
 filter:brightness(calc(1 - .55 * var(--dim)))}
.step.on{border-color:rgba(130,205,255,calc(.72 + .28 * var(--relit)));
 box-shadow:0 0 calc(22px + 26px * var(--relit)) rgba(90,190,255,.4)}
.step b{width:52px;height:52px;border-radius:50%;display:flex;align-items:center;
 justify-content:center;background:rgba(30,80,150,.9);color:#DCEEFF;font-size:28px}
.step span{font-size:34px;color:#D3E4F7;letter-spacing:1px}
.loop{position:absolute;left:1010px;top:437px;width:70px;height:116px;
 border:4px solid rgba(240,160,80,.95);border-right:none;border-radius:16px 0 0 16px;
 opacity:${arrow.toFixed(3)};box-shadow:0 0 24px rgba(240,150,60,.55)}
.loop::after{content:'';position:absolute;right:-4px;top:-13px;width:0;height:0;
 border:12px solid transparent;border-bottom-color:rgba(240,160,80,.98)}
.loop span{position:absolute;left:86px;top:calc(100% + 26px);
 font-size:29px;color:#F0A050;white-space:nowrap;letter-spacing:1px;
 text-shadow:0 0 16px rgba(240,150,60,.5)}
.caption{position:absolute;left:120px;bottom:82px;opacity:${caption.toFixed(3)};
 transform:translateY(${((1 - caption) * 18).toFixed(0)}px)}
.caption b{display:block;font-size:58px;font-weight:600;color:#F1F6FC;letter-spacing:3px}
.caption span{display:block;margin-top:12px;font-size:31px;font-weight:300;color:#A9BFDC;
 letter-spacing:2px}
</style></head><body>
<img class="plate" src="plate.png"><div class="split"></div>
<div class="col L"><h>抽卡</h><em>不满意就重新生成一版，碰运气</em>
  <div class="btn">再生成一次</div>${draws}</div>
<div class="col R"><h>流程</h><em>不满意就退回上一步，接着改</em>
  ${steps}</div>
<div class="loop"><span>退回第 2 步，不是从头再来</span></div>
<div class="caption"><b>用流程替代抽卡</b><span>事实和观点交给人确认，确认了才展开</span></div>
</body></html>`;
}

mkdirSync(dir, {recursive: true});
for (const [src, as] of USES) copyFileSync(path.join(ASSETS, src), path.join(dir, as));
const total = FPS * DURATION;
for (let f = 0; f < total; f += 1) {
  writeFileSync(path.join(dir, `fr${String(f).padStart(3, '0')}.html`), frameHtml(f / (total - 1)));
}
console.log(`${total} frames`);
