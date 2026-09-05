#!/usr/bin/env node
// s12「这些问题，没有一条是看文章能看出来的，全是真跑一遍才撞上的」
//
// 第十二种运动: 剥落。四张写着「网上文章这么说」的漂亮卡片正面朝观众, 一张张
// 翻过去, 背面是这次真撞到的那件事。翻转本身就是这一拍的意思——正面和背面
// 是同一件事的两种说法。
//
// 背面四条全部来自实验一 README 与 notes, 不是概括。
import {mkdirSync, writeFileSync, copyFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {easeOut, easeInOut, window_, mix, clamp01} from
  '../../src/easing.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const dir = process.argv[2] ?? path.join(here, 'frames');
// 素材共用一份, 构建时复制进帧目录——同一张底板存十二份是三十六兆。
const ASSETS = path.join(here, '..', '..', 'assets');
const USES = [
  ['plate-ai-b.png', 'plate.png'],
];

const W = 1920, H = 1080, FPS = 24, DURATION = 18.5;

const CARDS = [
  ['接上写作 skill 就行', '装完才发现，它禁用破折号，和这个仓库的中文稿直接打架'],
  ['配图交给脚本渲染', '约定写着「由人渲染 SVG」，可这台机器三个渲染器一个都没装'],
  ['让 AI 自查一遍', '它没自己发现跨文件矛盾，两个文件分开读都是对的'],
  ['流程跑通就能发', '骨架半天搭完，第一篇拖了一周多，差点回到没开始的原点'],
];

function frameHtml(t) {
  const cards = CARDS.map(([front, back], i) => {
    const enter = easeOut(clamp01((window_(t, 0.04, 0.24) - i * 0.05) / 0.16), 2.2);
    if (enter <= 0) return '';
    // 一张张翻过去, 每张翻转占 0.14。
    const flip = easeInOut(clamp01((window_(t, 0.32, 0.5) - i * 0.12) / 0.14));
    const deg = flip * 180;
    const flipped = flip > 0.5;
    const y = 236 + i * 178;
    return `<div class="slot" style="top:${y}px;opacity:${enter.toFixed(3)};`
      + `transform:translateX(${((1 - enter) * 60).toFixed(0)}px)">
      <div class="card" style="transform:rotateY(${deg.toFixed(1)}deg)">
        <div class="face front"><i>网上文章这么说</i><b>${front}</b></div>
        <div class="face back"><i>真跑一遍撞到的</i><b>${back}</b></div>
      </div>
      <div class="idx${flipped ? ' done' : ''}">${i + 1}</div>
    </div>`;
  }).join('');

  const caption = easeOut(window_(t, 0.8, 0.12));

  return `<!doctype html><html><head><meta charset="utf-8">
<meta name="render-size" content="${W}x${H}">
<style>*{margin:0;padding:0;box-sizing:border-box}
body{width:${W}px;height:${H}px;position:relative;overflow:hidden;background:#0a1730;
 font-family:'PingFang SC',sans-serif}
.plate{position:absolute;left:50%;top:50%;width:${W}px;height:${H}px;object-fit:cover;
 transform:translate(-50%,-50%) scale(1.06);filter:brightness(.36) blur(5px)}
.slot{position:absolute;left:250px;width:1420px;height:148px;perspective:1800px}
.card{position:relative;width:100%;height:100%;transform-style:preserve-3d}
.face{position:absolute;inset:0;backface-visibility:hidden;border-radius:14px;
 padding:24px 34px;display:flex;flex-direction:column;justify-content:center;gap:10px}
.face i{font-style:normal;font-size:24px;letter-spacing:2px}
.face b{font-size:38px;font-weight:600;letter-spacing:1px}
.front{background:rgba(12,30,58,.9);border:2px solid rgba(120,180,255,.45)}
.front i{color:#6D8CAC}.front b{color:#CFE2F6}
.back{background:rgba(48,26,12,.92);border:2px solid rgba(240,150,70,.6);
 transform:rotateY(180deg);box-shadow:0 0 30px rgba(240,140,60,.22)}
.back i{color:#B0805C}.back b{color:#F6D9BC;font-size:34px;line-height:1.35}
.idx{position:absolute;left:-84px;top:50%;transform:translateY(-50%);width:52px;height:52px;
 border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:27px;
 background:rgba(20,44,80,.9);color:#8FB4DC;border:2px solid rgba(120,180,255,.4);
 font-family:'SF Mono','Menlo',monospace}
.idx.done{background:rgba(70,34,14,.95);color:#F0A050;border-color:rgba(240,150,70,.8)}
.caption{position:absolute;left:250px;bottom:74px;opacity:${caption.toFixed(3)};
 transform:translateY(${((1 - caption) * 18).toFixed(0)}px)}
.caption b{display:block;font-size:56px;font-weight:600;color:#F1F6FC;letter-spacing:3px}
</style></head><body>
<img class="plate" src="plate.png">${cards}
<div class="caption"><b>没有一条是看文章能看出来的</b></div>
</body></html>`;
}

mkdirSync(dir, {recursive: true});
for (const [src, as] of USES) copyFileSync(path.join(ASSETS, src), path.join(dir, as));
const total = FPS * DURATION;
for (let f = 0; f < total; f += 1) {
  writeFileSync(path.join(dir, `fr${String(f).padStart(3, '0')}.html`), frameHtml(f / (total - 1)));
}
console.log(`${total} frames`);
