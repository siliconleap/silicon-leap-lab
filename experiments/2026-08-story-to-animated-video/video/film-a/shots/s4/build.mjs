#!/usr/bin/env node
// s4「四份稿子各自生成，风格各不相同」
//
// 第四种运动: 沿轨道滑入。卡片不是直线飞过去的, 是顺着 s3 长出来的那四条
// 光丝滑到各自的槽里——路径和上一拍完全重合, 所以两拍接起来是一件事的两段,
// 而不是两个镜头。
//
// 落定后槽框淡出、平台标签挂上。四个平台必须认得出来, 这一拍是全片唯一
// 点名它们的地方。
import {mkdirSync, writeFileSync, copyFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {easeOut, easeInOut, window_, pulse, mix} from
  'file:///Users/kaidong/Code/editorial-video/scripts/lib/easing.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const dir = process.argv[2] ?? path.join(here, 'frames');
// 素材共用一份, 构建时复制进帧目录——同一张底板存十二份是三十六兆。
const ASSETS = path.join(here, '..', '..', 'assets');
const USES = [
  ['plate-ai-b.png', 'plate.png'],
  ['card.png', 'card.png'],
];

const W = 1920, H = 1080, FPS = 24, DURATION = 9;

const SOURCE = [540, 547];
const SLOTS = [[1010, 560], [1240, 542], [1470, 525], [1700, 508]];
const NAMES = ['网站', 'GitHub', '小红书', '公众号'];
const COLORS = ['#4E93D8', '#3B4FC0', '#F0822D', '#E8A93A'];
const CARD_ASPECT = 408 / 730;

// 与 s3 完全相同的控制点, 卡片才会走在光丝上。
const control = (i, sx, sy) => [
  mix(SOURCE[0], sx, 0.42),
  SOURCE[1] + (sy - SOURCE[1]) * 0.15 + (i - 1.5) * 210,
];
// 二次贝塞尔取点。
const bezier = (p0, c, p1, u) => [
  (1 - u) ** 2 * p0[0] + 2 * (1 - u) * u * c[0] + u ** 2 * p1[0],
  (1 - u) ** 2 * p0[1] + 2 * (1 - u) * u * c[1] + u ** 2 * p1[1],
];

function frameHtml(t) {
  const breath = pulse(t, 0.9);
  // s3 结尾满屏都是光丝, 这一拍得接着画, 否则切过来整层凭空消失。
  // 卡片落位后光丝逐条隐去——货送到了, 传送带就该退场。
  const wires = SLOTS.map(([sx, sy], i) => {
    const fade = 1 - easeInOut(window_(t, 0.06 + i * 0.13 + 0.3, 0.24));
    if (fade <= 0.02) return '';
    const c = control(i, sx, sy);
    const d = `M ${SOURCE[0]} ${SOURCE[1]} Q ${c[0].toFixed(0)} ${c[1].toFixed(0)} `
      + `${(sx - 92).toFixed(0)} ${sy}`;
    return `<path class="halo" d="${d}" opacity="${fade.toFixed(3)}"/>`
      + `<path class="core" d="${d}" opacity="${fade.toFixed(3)}"/>`;
  }).join('');

  const cards = [];
  const labels = [];
  const slots = [];

  SLOTS.forEach(([sx, sy], i) => {
    // 一张一张走, 每张晚 0.13。四张同时滑就数不清了。
    const ride = easeOut(window_(t, 0.06 + i * 0.13, 0.4), 2.4);
    const landed = window_(t, 0.06 + i * 0.13 + 0.34, 0.14);
    const c = control(i, sx, sy);
    const [x, y] = bezier(SOURCE, c, [sx, sy], ride);   // 终点就是槽心

    // 槽框在卡片落进来时让位。
    const slotAlpha = 1 - easeOut(landed);
    if (slotAlpha > 0.02) {
      slots.push(`<div class="slot" style="left:${sx}px;top:${sy}px;`
        + `opacity:${(slotAlpha * (0.8 + 0.2 * breath)).toFixed(3)}"><i>${i + 1}</i></div>`);
    }

    if (ride <= 0) return;
    // 出发时小而虚, 落位才成形——从光球里"长"出来的, 不是飞过来的。
    const height = mix(84, 244, ride);
    cards.push(`<img class="card" src="card.png" style="left:${x.toFixed(0)}px;`
      + `top:${y.toFixed(0)}px;height:${height.toFixed(0)}px;`
      + `width:${(height * CARD_ASPECT).toFixed(0)}px;`
      + `opacity:${easeOut(Math.min(1, ride * 2.2)).toFixed(3)};`
      + `filter:blur(${(7 * (1 - ride)).toFixed(1)}px) `
      + `drop-shadow(0 16px 34px rgba(0,0,0,.55))">`);

    const tag = easeOut(window_(t, 0.06 + i * 0.13 + 0.38, 0.16));
    if (tag > 0) {
      // 相邻标签交错高度, 否则四个挤在一条线上会压字。
      const lift = 210 + (i % 2 ? 74 : 0);
      labels.push(`<div class="label" style="left:${Math.min(Math.max(sx, 190), W - 190)}px;`
        + `top:${(sy - lift).toFixed(0)}px;opacity:${tag.toFixed(3)};`
        + `border-color:${COLORS[i]};box-shadow:0 0 26px ${COLORS[i]}77">`
        + `<i style="background:${COLORS[i]}"></i>${NAMES[i]}</div>`);
    }
  });

  const caption = easeOut(window_(t, 0.62, 0.12));

  return `<!doctype html><html><head><meta charset="utf-8">
<meta name="render-size" content="${W}x${H}">
<style>*{margin:0;padding:0;box-sizing:border-box}
body{width:${W}px;height:${H}px;position:relative;overflow:hidden;background:#0b1a35;
 font-family:'PingFang SC',sans-serif}
.plate{position:absolute;inset:0;width:${W}px;height:${H}px;object-fit:cover;filter:brightness(.82)}
.glow{position:absolute;left:${SOURCE[0]}px;top:${SOURCE[1]}px;width:470px;height:470px;
 transform:translate(-50%,-50%);mix-blend-mode:screen;
 background:radial-gradient(circle,rgba(150,225,255,${(0.2 + 0.2 * breath).toFixed(3)}) 0%,
 rgba(80,175,255,${(0.09 + 0.09 * breath).toFixed(3)}) 38%,rgba(0,0,0,0) 68%)}
.card{position:absolute;transform:translate(-50%,-50%);display:block}
svg{position:absolute;inset:0;width:${W}px;height:${H}px;mix-blend-mode:screen}
svg path{fill:none;stroke-linecap:round}
svg path.halo{stroke:rgba(70,165,255,.55);stroke-width:22;
 filter:blur(9px) drop-shadow(0 0 26px rgba(70,170,255,.9))}
svg path.core{stroke:rgba(215,245,255,.98);stroke-width:7;
 filter:drop-shadow(0 0 16px rgba(150,225,255,1))}
.slot{position:absolute;width:178px;height:258px;border-radius:14px;transform:translate(-50%,-50%);
 border:4px solid rgba(170,225,255,.95);background:rgba(20,60,120,.3);
 display:flex;align-items:flex-end;justify-content:flex-end;
 box-shadow:0 0 34px rgba(120,205,255,.5) inset,0 0 28px rgba(90,185,255,.45)}
.slot i{font-style:normal;font-size:34px;font-weight:600;color:rgba(200,235,255,.95);
 padding:0 16px 12px 0}
.label{position:absolute;transform:translate(-50%,-100%);display:flex;align-items:center;gap:12px;
 padding:12px 28px;border-radius:999px;background:rgba(8,18,40,.88);border:2px solid;color:#EAF2FB;
 font-size:42px;letter-spacing:1px;white-space:nowrap}
.label i{width:13px;height:13px;border-radius:50%;display:block}
.caption{position:absolute;left:120px;bottom:104px;opacity:${caption.toFixed(3)};
 transform:translateY(${((1 - caption) * 18).toFixed(0)}px)}
.caption b{display:block;font-size:64px;font-weight:600;color:#F1F6FC;letter-spacing:3px;
 text-shadow:0 4px 26px rgba(0,0,0,.7)}
.caption span{display:block;margin-top:16px;font-size:33px;font-weight:300;color:#A9BFDC;
 letter-spacing:2px;text-shadow:0 2px 18px rgba(0,0,0,.65)}
</style></head><body>
<img class="plate" src="plate.png"><div class="glow"></div>
<svg viewBox="0 0 ${W} ${H}">${wires}</svg>
${slots.join('')}${cards.join('')}${labels.join('')}
<div class="caption"><b>四份稿子各自生成</b><span>风格各不相同</span></div>
</body></html>`;
}

mkdirSync(dir, {recursive: true});
for (const [src, as] of USES) copyFileSync(path.join(ASSETS, src), path.join(dir, as));
const total = FPS * DURATION;
for (let f = 0; f < total; f += 1) {
  writeFileSync(path.join(dir, `fr${String(f).padStart(3, '0')}.html`), frameHtml(f / (total - 1)));
}
console.log(`${total} frames`);
