#!/usr/bin/env node
// s1「收藏夹里躺着一千篇教程，想着以后要仔细学、动手试」
//
// 一次连续拉远。开头画面里只有一枚文档图标, 看得清它的每一处细节; 相机往后退,
// 同样的图标陆续显现, 一直排到画框之外。观众不是一上来就看见一片, 而是自己
// 发现后面还有——「开场只给一个主角」那条规则要的就是这个。
//
// 「很多」不靠数量堆, 靠四件事:
//   位置错落不成矩阵——排整齐了观众就开始数, 数得清就不多了;
//   大气透视——远处降明度对比和饱和度, 让它退进空气里, 而不是降透明度发灰;
//   失焦前景——画框边上压一枚被切掉大半的大图标, 观众立刻读出「镜头装不下」;
//   一行文字兜底——数量交给字说, 画面只负责气氛。
//
// 阵列是代码平铺的, 不是生成的: 疏密、显现次序、以及后面让某一个单独亮起,
// 都要能精确控制。
import {mkdirSync, writeFileSync, copyFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {easeInOut, easeOut, window_, pulse, mix} from
  '../../src/easing.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const dir = process.argv[2] ?? path.join(here, 'frames');
// 素材共用一份, 构建时复制进帧目录——同一张底板存十二份是三十六兆。
const ASSETS = path.join(here, '..', '..', 'assets');
const USES = [
  ['bg.png', 'bg.png'],
  ['doc-off-icon.png', 'doc.png'],
];

const W = 1920, H = 1080, FPS = 24, DURATION = 11;

const ASPECT = 383 / 596;   // 图标本身的宽高比
const COLS = 4;             // 拉到最远时约十来枚在画内, 边上的被画框切掉
const ROWS = 2;

// 每个位置的错动量。固定的伪随机, 保证同一帧每次生成结果一致。
const jitter = (col, row, salt) => {
  const n = Math.sin((col * 12.9898 + row * 78.233 + salt * 37.719) * 43758.5453);
  return n - Math.floor(n) - 0.5;
};

function frameHtml(t) {
  const pull = easeInOut(t);
  // 世界单位到屏幕像素。760 时一枚图标几乎占满画幅高度, 300 时中景停住, 图标仍看得清标题带和文本行——拉太远就只剩一堆蓝方块了。
  const scale = mix(760, 300, pull);
  const iconH = 1.25 * scale;
  const iconW = iconH * ASPECT;

  const tiles = [];
  for (let row = -ROWS; row <= ROWS; row += 1) {
    for (let col = -COLS; col <= COLS; col += 1) {
      // 错开位置和大小, 让它读作散落的一堆而不是一张表格。
      const x = W / 2 + (col * 1.18 + jitter(col, row, 1) * 0.42) * scale;
      const y = H / 2 + (row * 1.62 + jitter(col, row, 2) * 0.46) * scale;
      const size = 1 + jitter(col, row, 3) * 0.26;
      // 超出画幅的不必写进 DOM。
      if (x < -iconW * 1.4 || x > W + iconW * 1.4 || y < -iconH * 1.4 || y > H + iconH * 1.4) continue;

      // 离中心越远, 显现得越晚——退一步多看见一圈。
      const ring = Math.max(Math.abs(row), Math.abs(col));
      const appear = ring === 0 ? 1 : easeOut(window_(t, 0.14 + ring * 0.055, 0.3));
      if (appear <= 0) continue;

      // 远处的略暗一点, 免得整片一样亮而失去纵深。
      // 大气透视: 远处降明度对比与饱和度。降透明度会让图标发灰发脏,
      // 降对比才是「退进空气里」。
      const recede = Math.min(1, ring * 0.34);
      const contrast = 1 - 0.3 * recede;
      const saturate = 1 - 0.15 * recede;
      const bright = 1 - 0.22 * recede;
      const defocus = Math.min(9, ring * 2.6) * pull;
      tiles.push(
        `<img class="doc" src="doc.png" style="left:${x.toFixed(0)}px;top:${y.toFixed(0)}px;`
        + `width:${(iconW * size).toFixed(0)}px;opacity:${appear.toFixed(3)};`
        + `filter:blur(${defocus.toFixed(1)}px) contrast(${contrast.toFixed(2)}) `
        + `saturate(${saturate.toFixed(2)}) brightness(${bright.toFixed(2)}) `
        + `drop-shadow(0 14px 30px rgba(0,0,0,.5))">`,
      );
    }
  }

  // 失焦前景。它不是给人看的, 是用来说明「画外还有」——所以只露一角, 且始终虚着。
  const nearIn = easeOut(window_(t, 0.34, 0.34));
  const near = [
    {x: -0.06, y: 0.74, w: 1.45, blur: 22},
    {x: 0.97, y: 0.28, w: 1.18, blur: 26},
  ].map((n) =>
    `<img class="doc" src="doc.png" style="left:${(n.x * W).toFixed(0)}px;`
    + `top:${(n.y * H).toFixed(0)}px;width:${(iconW * n.w).toFixed(0)}px;`
    + `opacity:${(nearIn * 0.85).toFixed(3)};`
    + `filter:blur(${n.blur}px) contrast(.78) saturate(.85) brightness(.9)">`).join('');

  const breath = pulse(t, 0.7);
  const caption = easeOut(window_(t, 0.16, 0.1));

  return `<!doctype html><html><head><meta charset="utf-8">
<meta name="render-size" content="${W}x${H}">
<style>*{margin:0;padding:0;box-sizing:border-box}
body{width:${W}px;height:${H}px;position:relative;overflow:hidden;background:#0a1730;
 font-family:'PingFang SC',sans-serif}
.bg{position:absolute;left:50%;top:50%;width:${W}px;height:${H}px;object-fit:cover;
 transform:translate(-50%,-50%) scale(${mix(1.22, 1, pull).toFixed(4)});filter:brightness(.8)}
.doc{position:absolute;transform:translate(-50%,-50%);display:block}
.breath{position:absolute;inset:0;mix-blend-mode:screen;
 background:radial-gradient(ellipse at 50% 46%,rgba(70,160,255,${(0.05 + 0.04 * breath).toFixed(3)}) 0%,
 rgba(0,0,0,0) 60%)}
.shade{position:absolute;inset:0;
 background:linear-gradient(to bottom,rgba(6,14,30,0) 52%,rgba(6,14,30,.82) 100%),
 radial-gradient(ellipse at 50% 50%,rgba(0,0,0,0) 44%,rgba(4,10,22,.38) 100%)}
.hud{position:absolute;right:110px;top:88px;display:flex;align-items:center;gap:16px;
 padding:16px 34px;border-radius:999px;background:rgba(8,18,38,.72);
 border:1px solid rgba(120,180,255,.28);backdrop-filter:blur(10px);
 font-size:33px;color:#93AACB;letter-spacing:2px}
.hud b{color:#DCE8F7;font-weight:600}
.hud b.zero{color:#F0A050}
.hud i{width:1px;height:30px;background:rgba(120,180,255,.3);display:block}
.caption{position:absolute;left:120px;bottom:100px;opacity:${caption.toFixed(3)};
 transform:translateY(${((1 - caption) * 18).toFixed(0)}px)}
.caption b{display:block;font-size:66px;font-weight:600;color:#F1F6FC;letter-spacing:3px}
.caption span{display:block;margin-top:16px;font-size:34px;font-weight:300;color:#A9BFDC;
 letter-spacing:2px}
</style></head><body>
<img class="bg" src="bg.png">${tiles.join('')}${near}
<div class="breath"></div><div class="shade"></div>
<div class="hud" style="opacity:${easeOut(window_(t, 0.40, 0.14)).toFixed(3)}">
  <span>已收藏</span><b>1000+</b><i></i><span>已发布</span><b class="zero">0</b>
</div>
<div class="caption"><b>收藏夹里躺着一千篇教程</b><span>想着以后要仔细学、动手试，就是没有一篇真的开始</span></div>
</body></html>`;
}

mkdirSync(dir, {recursive: true});
for (const [src, as] of USES) copyFileSync(path.join(ASSETS, src), path.join(dir, as));
const total = FPS * DURATION;
for (let f = 0; f < total; f += 1) {
  writeFileSync(path.join(dir, `fr${String(f).padStart(3, '0')}.html`), frameHtml(f / (total - 1)));
}
console.log(`${total} frames`);
