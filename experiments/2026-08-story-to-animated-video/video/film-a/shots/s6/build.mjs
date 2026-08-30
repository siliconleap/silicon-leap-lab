#!/usr/bin/env node
// s6「一次生成的东西太多，四份之间、每一份内部，都开始互相矛盾」
//
// 全片第一次上真实截图: 实验一里那两个自相矛盾的文件——配置说「陈述完事实就
// 转进列表」, 模板恰恰在这么干。这是唯一一处能证明「确实撞到过」的东西。
//
// 但截图不能平贴上去。两块面板各自是场景里的一个物件: 带透视、带这个世界本来的
// 边框光和投影, 中间打一道冲突弧光, 相机缓缓推近。判据是暂停任意一帧, 截图应该
// 像被放进这个世界里, 而不是盖在上面。
//
// 第六种运动: 对峙。两块面板从两侧压进来、越靠越近, 和前五拍都不同。
import {mkdirSync, writeFileSync, copyFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {easeOut, easeInOut, window_, pulse, flash, mix} from
  'file:///Users/kaidong/Code/editorial-video/scripts/lib/easing.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const dir = process.argv[2] ?? path.join(here, 'frames');
// 素材共用一份, 构建时复制进帧目录——同一张底板存十二份是三十六兆。
const ASSETS = path.join(here, '..', '..', 'assets');
const USES = [
  ['plate-ai-b.png', 'plate.png'],
  ['panel-l.png', 'panel-l.png'],
  ['panel-r.png', 'panel-r.png'],
];

const W = 1920, H = 1080, FPS = 24, DURATION = 15;

function frameHtml(t) {
  // 两块从画外压进来, 停在中间隔着一道缝对峙。
  const enter = easeOut(window_(t, 0.04, 0.34), 2.6);
  const close = easeInOut(window_(t, 0.4, 0.26));   // 再逼近一点
  const arc = easeOut(window_(t, 0.52, 0.18));      // 冲突弧光接通
  const zap = flash(t, 0.6, 0.028);
  const breath = pulse(t, 0.8);

  const push = mix(1, 1.08, easeInOut(window_(t, 0.3, 0.6)));
  const gap = mix(600, 392, close);
  // 两块都以自身中心定位, 缩放锚点一致, 否则一边会比另一边大一圈。
  const half = 260 * push;
  const leftX = mix(-700, W / 2 - gap / 2 - half, enter);
  const rightX = mix(W + 700, W / 2 + gap / 2 + half, enter);
  const tilt = mix(26, 13, close);

  // 框是面板的子元素, 用百分比定位, 所以自动跟着透视走, 不需要单独算坐标。
  // 等面板停稳 (close 完成) 之后才出现——框在移动的东西上画, 永远对不准。
  const mark = easeOut(window_(t, 0.7, 0.1));
  const first = easeOut(window_(t, 0.14, 0.1)) * (1 - easeInOut(window_(t, 0.5, 0.1)));
  const second = easeOut(window_(t, 0.62, 0.12));

  return `<!doctype html><html><head><meta charset="utf-8">
<meta name="render-size" content="${W}x${H}">
<style>*{margin:0;padding:0;box-sizing:border-box}
body{width:${W}px;height:${H}px;position:relative;overflow:hidden;background:#0a1730;
 font-family:'PingFang SC',sans-serif}
.plate{position:absolute;left:50%;top:50%;width:${W}px;height:${H}px;object-fit:cover;
 transform:translate(-50%,-50%) scale(${(1.04 * push).toFixed(4)});filter:brightness(.5) blur(3px)}
.stage{position:absolute;inset:0;perspective:2200px}
.panel{position:absolute;top:44%;width:520px;border-radius:16px;overflow:hidden;
 border:2px solid rgba(120,190,255,.55);
 box-shadow:0 26px 60px rgba(0,0,0,.6),0 0 40px rgba(70,160,255,.28),
 0 0 0 1px rgba(160,215,255,.25) inset;background:#0d0d0f}
.panel img{display:block;width:100%}
.panel .mark{position:absolute;left:4%;right:4%;border:3px solid rgba(255,180,90,.95);
 border-radius:8px;pointer-events:none;
 box-shadow:0 0 22px rgba(255,150,60,.7),0 0 22px rgba(255,150,60,.45) inset}
.l{transform:translate(-50%,-50%) perspective(2200px) rotateY(${tilt.toFixed(2)}deg) scale(${push.toFixed(3)})}
.r{transform:translate(-50%,-50%) perspective(2200px) rotateY(${(-tilt).toFixed(2)}deg) scale(${push.toFixed(3)})}
.arc{position:absolute;left:50%;top:44%;transform:translate(-50%,-50%);
 width:${(gap + 90).toFixed(0)}px;height:${(20 + 10 * breath).toFixed(0)}px;mix-blend-mode:screen;
 background:linear-gradient(to right,rgba(255,120,40,0) 0%,
 rgba(255,205,140,${(0.95 * arc + zap).toFixed(3)}) 22%,
 rgba(255,235,200,${(1 * arc + zap).toFixed(3)}) 50%,
 rgba(255,205,140,${(0.95 * arc + zap).toFixed(3)}) 78%,rgba(255,120,40,0) 100%);
 filter:blur(${(4 + 4 * breath).toFixed(1)}px);
 box-shadow:0 0 ${(70 + 34 * breath).toFixed(0)}px rgba(255,150,60,${(0.95 * arc).toFixed(2)})}
.arc2{position:absolute;left:50%;top:44%;transform:translate(-50%,-50%);
 width:${(gap + 140).toFixed(0)}px;height:${(110 + 40 * breath).toFixed(0)}px;mix-blend-mode:screen;
 pointer-events:none;border-radius:50%;
 background:radial-gradient(ellipse,rgba(255,170,80,${(0.42 * arc).toFixed(3)}) 0%,
 rgba(255,120,40,0) 70%);filter:blur(16px)}
.burst{position:absolute;left:50%;top:44%;width:640px;height:640px;transform:translate(-50%,-50%);
 mix-blend-mode:screen;pointer-events:none;
 background:radial-gradient(circle,rgba(255,200,140,${(0.5 * zap).toFixed(3)}) 0%,
 rgba(255,140,50,${(0.2 * zap).toFixed(3)}) 38%,rgba(0,0,0,0) 68%)}
.caption{position:absolute;left:120px;bottom:88px}
.caption b{display:block;font-size:62px;font-weight:600;color:#F1F6FC;letter-spacing:3px;
 text-shadow:0 4px 26px rgba(0,0,0,.85)}
.caption span{display:block;margin-top:14px;font-size:33px;font-weight:300;color:#A9BFDC;
 letter-spacing:2px;text-shadow:0 2px 18px rgba(0,0,0,.8)}
</style></head><body>
<img class="plate" src="plate.png">
<div class="stage">
  <div class="panel l" style="left:${leftX.toFixed(0)}px">
    <img src="panel-l.png"><div class="mark" style="opacity:${mark.toFixed(3)};top:28%;height:25%"></div></div>
  <div class="panel r" style="left:${rightX.toFixed(0)}px">
    <img src="panel-r.png"><div class="mark" style="opacity:${mark.toFixed(3)};top:25%;height:44%"></div></div>
</div>
<div class="arc2"></div><div class="arc"></div><div class="burst"></div>
<div class="caption" style="opacity:${first.toFixed(3)}">
  <b>两个文件分开读，每一个都是对的</b><span>配置说别转进列表，模板恰恰在转进列表</span></div>
<div class="caption" style="opacity:${second.toFixed(3)};
  transform:translateY(${((1 - second) * 18).toFixed(0)}px)">
  <b>一次生成的东西太多，内部就开始互相矛盾</b><span>跑出一篇才看得出来</span></div>
</body></html>`;
}

mkdirSync(dir, {recursive: true});
for (const [src, as] of USES) copyFileSync(path.join(ASSETS, src), path.join(dir, as));
const total = FPS * DURATION;
for (let f = 0; f < total; f += 1) {
  writeFileSync(path.join(dir, `fr${String(f).padStart(3, '0')}.html`), frameHtml(f / (total - 1)));
}
console.log(`${total} frames`);
