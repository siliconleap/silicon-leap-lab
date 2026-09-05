#!/usr/bin/env node
// s2「所以我决定，不再收藏了，直接开始做实验」
//
// 换机位。s1 是正面拉远, 这一拍改成侧向横移: 相机贴着这片文档从右往左掠过,
// 阵列带一点侧透视, 掠到中途其中一枚亮起来, 相机随即归正并推近, 停在它身上。
// 横移和推拉是两种运动, 切过去立刻能看出机位变了——两拍都用拉远会像卡住。
//
// 全片唯一一次用暖色: 点亮版图标只在这一拍出现。
import {mkdirSync, writeFileSync, copyFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {easeInOut, easeOut, window_, pulse, flash, mix} from
  '../../src/easing.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const dir = process.argv[2] ?? path.join(here, 'frames');
// 素材共用一份, 构建时复制进帧目录——同一张底板存十二份是三十六兆。
const ASSETS = path.join(here, '..', '..', 'assets');
const USES = [
  ['bg.png', 'bg.png'],
  ['doc-off-icon.png', 'doc.png'],
  ['doc-on-icon.png', 'doc-on.png'],
];

const W = 1920, H = 1080, FPS = 24, DURATION = 4.5;

const ASPECT = 383 / 596;
const COLS = 6, ROWS = 3;
const HERO = {col: 0, row: 0};

const jitter = (col, row, salt) => {
  const n = Math.sin((col * 12.9898 + row * 78.233 + salt * 37.719) * 43758.5453);
  return n - Math.floor(n) - 0.5;
};

function frameHtml(t) {
  // 三段运动, 首尾相接: 横移 → 归正 → 推近。
  const track = easeInOut(window_(t, 0.02, 0.42));   // 相机横移
  const settle = easeInOut(window_(t, 0.38, 0.30));  // 侧透视归正
  const push = easeInOut(window_(t, 0.42, 0.48));    // 推近主角

  const scale = mix(300, 470, push);
  const iconH = 1.25 * scale;
  const iconW = iconH * ASPECT;

  const ignite = easeOut(window_(t, 0.34, 0.2));     // 亮起, 和归正同时开始
  const spark = flash(t, 0.39, 0.032);
  const suppress = easeInOut(window_(t, 0.40, 0.34));
  const breath = pulse(t, 0.9);

  // 相机横移: 整片阵列反向平移。归正后阵列以主角为中心。
  const drift = mix(0.62, 0, track) * scale;
  const originX = W / 2 - HERO.col * 1.18 * scale + drift;
  const originY = H / 2 - HERO.row * 1.62 * scale;

  const tiles = [];
  for (let row = -ROWS; row <= ROWS; row += 1) {
    for (let col = -COLS; col <= COLS; col += 1) {
      const x = originX + (col * 1.18 + jitter(col, row, 1) * 0.42) * scale;
      const y = originY + (row * 1.62 + jitter(col, row, 2) * 0.46) * scale;
      const size = 1 + jitter(col, row, 3) * 0.26;
      if (x < -iconW * 1.6 || x > W + iconW * 1.6 || y < -iconH * 1.6 || y > H + iconH * 1.6) continue;

      const hero = col === HERO.col && row === HERO.row;
      const ring = Math.max(Math.abs(row - HERO.row), Math.abs(col - HERO.col));
      const recede = Math.min(1, ring * 0.3);
      const contrast = (1 - 0.3 * recede) * (1 - 0.35 * suppress);
      const saturate = (1 - 0.15 * recede) * (1 - 0.4 * suppress);
      const bright = (1 - 0.22 * recede) * (1 - 0.45 * suppress);
      const defocus = Math.min(9, ring * 2.4) + 4 * suppress;

      if (hero) {
        tiles.push(
          `<img class="doc" src="doc.png" style="left:${x.toFixed(0)}px;top:${y.toFixed(0)}px;`
          + `width:${(iconW * size).toFixed(0)}px;opacity:${(1 - ignite).toFixed(3)}">`,
          `<div class="halo" style="left:${x.toFixed(0)}px;top:${y.toFixed(0)}px;`
          + `width:${(iconW * 3.6).toFixed(0)}px;height:${(iconW * 3.6).toFixed(0)}px;`
          + `opacity:${(ignite * (0.42 + 0.26 * breath) + spark).toFixed(3)}"></div>`,
          `<img class="doc hero" src="doc-on.png" style="left:${x.toFixed(0)}px;top:${y.toFixed(0)}px;`
          + `width:${(iconW * size).toFixed(0)}px;opacity:${ignite.toFixed(3)}">`,
        );
      } else {
        tiles.push(
          `<img class="doc" src="doc.png" style="left:${x.toFixed(0)}px;top:${y.toFixed(0)}px;`
          + `width:${(iconW * size).toFixed(0)}px;`
          + `filter:blur(${defocus.toFixed(1)}px) contrast(${contrast.toFixed(2)}) `
          + `saturate(${saturate.toFixed(2)}) brightness(${bright.toFixed(2)}) `
          + `drop-shadow(0 14px 30px rgba(0,0,0,.5))">`,
        );
      }
    }
  }

  const caption = easeOut(window_(t, 0.58, 0.12));
  // 侧透视随归正收回。旋转整层而不是逐个元素, 阵列才是一个整体。
  const tilt = mix(15, 0, settle);

  return `<!doctype html><html><head><meta charset="utf-8">
<meta name="render-size" content="${W}x${H}">
<style>*{margin:0;padding:0;box-sizing:border-box}
body{width:${W}px;height:${H}px;position:relative;overflow:hidden;background:#0a1730;
 font-family:'PingFang SC',sans-serif}
.bg{position:absolute;left:50%;top:50%;width:${W}px;height:${H}px;object-fit:cover;
 transform:translate(-50%,-50%) scale(${mix(1.05, 1.2, push).toFixed(4)});
 filter:brightness(${(0.78 - 0.34 * suppress).toFixed(3)})}
.stage{position:absolute;inset:0;perspective:2400px;transform-style:preserve-3d}
.deck{position:absolute;inset:0;transform:rotateY(${tilt.toFixed(2)}deg);
 transform-origin:50% 50%;transform-style:preserve-3d}
.doc{position:absolute;transform:translate(-50%,-50%);display:block}
.hero{filter:drop-shadow(0 18px 44px rgba(0,0,0,.6)) drop-shadow(0 0 34px rgba(255,150,60,.55))}
.halo{position:absolute;transform:translate(-50%,-50%);pointer-events:none;mix-blend-mode:screen;
 background:radial-gradient(circle,rgba(255,190,120,.5) 0%,rgba(255,140,50,.19) 34%,rgba(0,0,0,0) 66%)}
.shade{position:absolute;inset:0;
 background:linear-gradient(to bottom,rgba(6,14,30,0) 54%,rgba(6,14,30,.8) 100%)}
.caption{position:absolute;right:120px;bottom:104px;text-align:right;opacity:${caption.toFixed(3)};
 transform:translateY(${((1 - caption) * 18).toFixed(0)}px)}
.caption b{display:block;font-size:66px;font-weight:600;color:#F1F6FC;letter-spacing:3px}
.caption span{display:block;margin-top:16px;font-size:34px;font-weight:300;color:#F0B478;
 letter-spacing:2px}
</style></head><body>
<img class="bg" src="bg.png">
<div class="stage"><div class="deck">${tiles.join('')}</div></div>
<div class="shade"></div>
<div class="caption"><b>不再收藏了，直接开始</b><span>第一个实验</span></div>
</body></html>`;
}

mkdirSync(dir, {recursive: true});
for (const [src, as] of USES) copyFileSync(path.join(ASSETS, src), path.join(dir, as));
const total = FPS * DURATION;
for (let f = 0; f < total; f += 1) {
  writeFileSync(path.join(dir, `fr${String(f).padStart(3, '0')}.html`), frameHtml(f / (total - 1)));
}
console.log(`${total} frames`);
