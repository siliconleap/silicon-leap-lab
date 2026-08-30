#!/usr/bin/env node
// s14「你正在看的这支片子，就是那一行的下一次尝试」
//
// 第十四种运动: 由红转亮。上一拍那行「失败」还留在画面上, 它先褪成灰,
// 再被一道从左扫过的光换成新的一行——第二个实验。然后制作说明一条条落下。
//
// 结尾要交代清楚三件事: Claude Code 加 Remotion 做的、没用视频大模型、成本很低。
// 成本用的是实际账单: 图像 27.5 元 + 语音 1.77 元 (作者核对, 2026-08-30)。
import {mkdirSync, writeFileSync, copyFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {easeOut, easeInOut, window_, pulse, flash, mix, clamp01} from
  'file:///Users/kaidong/Code/editorial-video/scripts/lib/easing.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const dir = process.argv[2] ?? path.join(here, 'frames');
// 素材共用一份, 构建时复制进帧目录——同一张底板存十二份是三十六兆。
const ASSETS = path.join(here, '..', '..', 'assets');
const USES = [
  ['plate-ai-b.png', 'plate.png'],
];

const W = 1920, H = 1080, FPS = 24, DURATION = 24;

const FACTS = [
  // 片 A 这一版没有用 Remotion——十四拍是逐帧 HTML 加浏览器截图渲出来的。
  // 片尾曾经写着「Claude Code + Remotion」, 对这一版来说是错的。
  ['做法', 'Claude Code 写代码'],
  ['视频大模型', '一个都没用'],
  ['画面', '静态图 + 代码算出的动作，浏览器逐帧渲染'],
  ['配音', '文字转语音'],
  ['生成图片', '这一支 115 张，最后用上 5 张'],
];

function frameHtml(t) {
  const breath = pulse(t, 0.8);
  // 上一拍那行失败还挂着, 先褪色。
  const fade = easeInOut(window_(t, 0.06, 0.16));
  // 一道光从左扫过, 扫过之处换成新的一行。
  const sweep = easeInOut(window_(t, 0.2, 0.18));
  const spark = flash(t, 0.29, 0.03);
  const rise = easeOut(window_(t, 0.34, 0.16));

  const facts = FACTS.map(([k, v], i) => {
    const on = easeOut(clamp01((window_(t, 0.46, 0.34) - i * 0.08) / 0.14));
    if (on <= 0) return '';
    return `<div class="fact" style="opacity:${on.toFixed(3)};`
      + `transform:translateY(${((1 - on) * 22).toFixed(0)}px)">`
      + `<span>${k}</span><b>${v}</b></div>`;
  }).join('');

  const cost = easeOut(window_(t, 0.78, 0.12));

  return `<!doctype html><html><head><meta charset="utf-8">
<meta name="render-size" content="${W}x${H}">
<style>*{margin:0;padding:0;box-sizing:border-box}
body{width:${W}px;height:${H}px;position:relative;overflow:hidden;background:#0a1730;
 font-family:'PingFang SC',sans-serif}
.plate{position:absolute;left:50%;top:50%;width:${W}px;height:${H}px;object-fit:cover;
 transform:translate(-50%,-50%) scale(${mix(1.06, 1.14, easeInOut(t)).toFixed(4)});
 filter:brightness(${(0.34 + 0.14 * rise).toFixed(3)}) blur(${(5 - 2 * rise).toFixed(1)}px)}
.line{position:absolute;left:200px;top:210px;width:1520px;height:78px;border-radius:10px;
 display:flex;align-items:center;padding:0 30px;overflow:hidden;
 border-left:4px solid rgba(240,90,60,${(1 - fade * 0.75).toFixed(2)});
 background:rgba(56,18,12,${(0.85 - fade * 0.55).toFixed(2)})}
.line .n{flex:1;font-size:33px;letter-spacing:1px;
 color:rgba(246,210,196,${(1 - fade * 0.7).toFixed(2)})}
.line .s{font-size:29px;letter-spacing:2px;padding:7px 22px;border-radius:999px;
 color:rgba(255,146,112,${(1 - fade * 0.7).toFixed(2)});background:rgba(94,26,16,${(0.9 - fade * 0.6).toFixed(2)})}
.newline{position:absolute;left:200px;top:210px;width:1520px;height:78px;border-radius:10px;
 display:flex;align-items:center;padding:0 30px;overflow:hidden;
 clip-path:inset(0 ${((1 - sweep) * 100).toFixed(1)}% 0 0);
 border-left:4px solid rgba(120,205,255,.95);background:rgba(12,42,80,.94);
 box-shadow:0 0 ${(20 + 26 * sweep + 14 * breath).toFixed(0)}px rgba(90,190,255,.45)}
.newline .n{flex:1;font-size:33px;color:#DCEEFF;letter-spacing:1px}
.newline .s{font-size:29px;letter-spacing:2px;padding:7px 22px;border-radius:999px;
 color:#9FE7C4;background:rgba(28,72,54,.9)}
.beam{position:absolute;left:${(200 + sweep * 1520).toFixed(0)}px;top:196px;width:8px;height:106px;
 background:rgba(220,245,255,${(0.9 * (sweep > 0.02 && sweep < 0.98 ? 1 : 0) + spark).toFixed(3)});
 filter:blur(3px);box-shadow:0 0 40px rgba(150,225,255,.95);mix-blend-mode:screen}
.title{position:absolute;left:200px;top:340px;opacity:${rise.toFixed(3)};
 transform:translateY(${((1 - rise) * 20).toFixed(0)}px)}
.title b{display:block;font-size:64px;font-weight:600;color:#F1F6FC;letter-spacing:3px}
.title span{display:block;margin-top:14px;font-size:32px;font-weight:300;color:#A9BFDC;
 letter-spacing:2px}
.facts{position:absolute;left:200px;top:530px}
.fact{display:flex;align-items:baseline;gap:26px;margin-bottom:22px}
.fact span{width:210px;font-size:28px;color:#6D8CAC;letter-spacing:2px;text-align:right}
.fact b{font-size:38px;color:#DCEAF8;font-weight:500;letter-spacing:1px}
.cost{position:absolute;left:200px;top:872px;display:flex;align-items:baseline;gap:26px;
 opacity:${cost.toFixed(3)}}
.cost span{width:210px;font-size:28px;color:#6D8CAC;letter-spacing:2px;text-align:right}
.cost b{font-size:38px;color:#F0A050;font-weight:500;letter-spacing:1px}
.cost em{font-style:normal;font-size:26px;color:#6D8CAC;margin-left:14px}
</style></head><body>
<img class="plate" src="plate.png">
<div class="line"><span class="n">视频渠道交付</span><span class="s">失败</span></div>
<div class="newline"><span class="n">第二个实验　让 AI 把一个故事讲成一支能发的动画视频</span>
  <span class="s">你正在看</span></div>
<div class="beam"></div>
<div class="title"><b>这支片子，就是那一行的下一次尝试</b>
  <span>原来这类视频，确实可以让 AI 自动生成出来</span></div>
<div class="facts">${facts}</div>
<div class="cost"><span>成本</span><b>约 24 元</b><em>这一支的估算份额，两支合计 29.27 元</em></div>
</body></html>`;
}

mkdirSync(dir, {recursive: true});
for (const [src, as] of USES) copyFileSync(path.join(ASSETS, src), path.join(dir, as));
const total = FPS * DURATION;
for (let f = 0; f < total; f += 1) {
  writeFileSync(path.join(dir, `fr${String(f).padStart(3, '0')}.html`), frameHtml(f / (total - 1)));
}
console.log(`${total} frames`);
