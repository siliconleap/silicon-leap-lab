#!/usr/bin/env node
// s3「按网上文章说的方法，搭一条文章生产流水线，一次产出四个平台的稿子」
//
// 第三种运动: 不是拉远, 也不是横移, 是光丝生长。四条光丝从 AI 球里长出来,
// 分叉伸向右侧空场, 末端各自亮起一个空槽——流水线搭好了, 但还没有东西产出来。
// 四条分叉预告了后面的四个平台, 也让 s4 的卡片有地方可落。
//
// 这一拍到 s5 是同一个场景的连续三拍, 所以运动必须各不相同: 光丝生长 →
// 卡片飞出 → 收拢重合。三拍都用「元素移动」会同质。
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
  ['plate-ai-b.png', 'plate.png'],
];

const W = 1920, H = 1080, FPS = 24, DURATION = 10.5;

// 光球在背景图里的位置, 光丝从这里长出来。
const SOURCE = [540, 547];
// 四个落点, 就是 s4 卡片要停的地方。
const SLOTS = [[1010, 560], [1240, 542], [1470, 525], [1700, 508]];

function frameHtml(t) {
  // 全程极慢的拉远, 只有 6%——这一拍的运动是光丝, 相机不要抢戏。
  const pull = easeInOut(t);
  const zoom = mix(1.06, 1.0, pull);
  const breath = pulse(t, 0.9);

  const paths = SLOTS.map(([sx, sy], i) => {
    // 每条晚 0.09 出发, 生长本身占 0.42。
    const grow = easeOut(window_(t, 0.14 + i * 0.09, 0.42), 2.2);
    if (grow <= 0) return '';
    // 控制点让四条各自弯出不同的弧度, 不然就是一把直线扇子。
    const cx = mix(SOURCE[0], sx, 0.42);
    const cy = SOURCE[1] + (sy - SOURCE[1]) * 0.15 + (i - 1.5) * 210;
    // 二次贝塞尔的弧长按控制点估算, 估短了末端会差一截没画出来。
    const length = (Math.hypot(cx - SOURCE[0], cy - SOURCE[1])
      + Math.hypot(sx - cx, sy - cy)) * 1.02;
    const d = `M ${SOURCE[0]} ${SOURCE[1]} Q ${cx.toFixed(0)} ${cy.toFixed(0)} ${(sx - 92).toFixed(0)} ${sy}`;
    const dash = `stroke-dasharray="${length.toFixed(0)}" `
      + `stroke-dashoffset="${(length * (1 - grow)).toFixed(0)}"`;
    // 两层: 宽的负责在亮背景上占住位置, 细的负责亮芯。
    return `<path class="halo" d="${d}" ${dash}/><path class="core" d="${d}" ${dash}/>`;
  }).join('');

  const slots = SLOTS.map(([sx, sy], i) => {
    // 光丝到位后槽位才亮, 差 0.06 —— 先接通, 再点亮。
    const lit = easeOut(window_(t, 0.56 + i * 0.09, 0.2));
    if (lit <= 0) return '';
    return `<div class="slot" style="left:${sx}px;top:${sy}px;`
      + `opacity:${lit.toFixed(3)};`
      + `transform:translate(-50%,-50%) scale(${(0.86 + 0.14 * lit).toFixed(3)});`
      + `box-shadow:0 0 ${(30 + 16 * breath).toFixed(0)}px rgba(120,205,255,.55) inset,`
      + `0 0 ${(26 + 14 * breath).toFixed(0)}px rgba(90,185,255,.5)"><i>${i + 1}</i></div>`;
  }).join('');

  const caption = easeOut(window_(t, 0.68, 0.12));

  return `<!doctype html><html><head><meta charset="utf-8">
<meta name="render-size" content="${W}x${H}">
<style>*{margin:0;padding:0;box-sizing:border-box}
body{width:${W}px;height:${H}px;position:relative;overflow:hidden;background:#0b1a35;
 font-family:'PingFang SC',sans-serif}
.plate{position:absolute;left:50%;top:50%;width:${W}px;height:${H}px;object-fit:cover;
 transform:translate(-50%,-50%) scale(${zoom.toFixed(4)});filter:brightness(.82)}
.glow{position:absolute;left:${SOURCE[0]}px;top:${SOURCE[1]}px;width:470px;height:470px;
 transform:translate(-50%,-50%);mix-blend-mode:screen;
 background:radial-gradient(circle,rgba(150,225,255,${(0.2 + 0.2 * breath).toFixed(3)}) 0%,
 rgba(80,175,255,${(0.09 + 0.09 * breath).toFixed(3)}) 38%,rgba(0,0,0,0) 68%)}
svg{position:absolute;inset:0;width:${W}px;height:${H}px;mix-blend-mode:screen}
svg path{fill:none;stroke-linecap:round}
svg path.halo{stroke:rgba(70,165,255,.55);stroke-width:22;
 filter:blur(9px) drop-shadow(0 0 26px rgba(70,170,255,.9))}
svg path.core{stroke:rgba(215,245,255,.98);stroke-width:7;
 filter:drop-shadow(0 0 16px rgba(150,225,255,1))}
.slot{position:absolute;width:178px;height:258px;border-radius:14px;
 border:4px solid rgba(170,225,255,.95);background:rgba(20,60,120,.3);
 backdrop-filter:blur(3px);display:flex;align-items:flex-end;justify-content:flex-end}
.slot i{font-style:normal;font-size:34px;font-weight:600;color:rgba(200,235,255,.95);
 padding:0 16px 12px 0;text-shadow:0 0 14px rgba(90,190,255,.9)}
.caption{position:absolute;left:120px;bottom:104px;opacity:${caption.toFixed(3)};
 transform:translateY(${((1 - caption) * 18).toFixed(0)}px)}
.caption b{display:block;font-size:64px;font-weight:600;color:#F1F6FC;letter-spacing:3px;
 text-shadow:0 4px 26px rgba(0,0,0,.7)}
.caption span{display:block;margin-top:16px;font-size:33px;font-weight:300;color:#A9BFDC;
 letter-spacing:2px;text-shadow:0 2px 18px rgba(0,0,0,.65)}
</style></head><body>
<img class="plate" src="plate.png"><div class="glow"></div>
<svg viewBox="0 0 ${W} ${H}">${paths}</svg>${slots}
<div class="caption"><b>按网上说的方法，搭一条文章生产流水线</b><span>一次产出四个平台的稿子</span></div>
</body></html>`;
}

mkdirSync(dir, {recursive: true});
for (const [src, as] of USES) copyFileSync(path.join(ASSETS, src), path.join(dir, as));
const total = FPS * DURATION;
for (let f = 0; f < total; f += 1) {
  writeFileSync(path.join(dir, `fr${String(f).padStart(3, '0')}.html`), frameHtml(f / (total - 1)));
}
console.log(`${total} frames`);
