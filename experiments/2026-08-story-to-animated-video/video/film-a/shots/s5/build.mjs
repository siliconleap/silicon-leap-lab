#!/usr/bin/env node
// s5「叠到一起严丝合缝——它们说的其实是同一批话……稳稳落在平均线上」
//
// 第五种运动: 收拢重合。四张卡从 s4 的落位向中间聚拢, 合拢瞬间闪一下,
// 后三张并进第一张——四份稿子叠起来严丝合缝, 就是「均值」这个词的画面。
//
// 落点坐标和 s3、s4 是同一组常量, 所以这一拍是从上一拍的画面接着动的。
import {mkdirSync, writeFileSync, copyFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {easeOut, easeInOut, window_, pulse, flash, spring, mix} from
  'file:///Users/kaidong/Code/editorial-video/scripts/lib/easing.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const dir = process.argv[2] ?? path.join(here, 'frames');
// 素材共用一份, 构建时复制进帧目录——同一张底板存十二份是三十六兆。
const ASSETS = path.join(here, '..', '..', 'assets');
const USES = [
  ['plate-ai-b.png', 'plate.png'],
  ['card.png', 'card.png'],
];

const W = 1920, H = 1080, FPS = 24, DURATION = 16.5;

const SOURCE = [540, 547];
const SLOTS = [[1010, 560], [1240, 542], [1470, 525], [1700, 508]];
const MERGE = [1300, 528];
const NAMES = ['网站', 'GitHub', '小红书', '公众号'];
const COLORS = ['#4E93D8', '#3B4FC0', '#F0822D', '#E8A93A'];
const CARD_ASPECT = 408 / 730;

function frameHtml(t) {
  // 前两秒不动, 让上一拍的画面站住——落定后要呼吸, 不能一接上就开始收。
  const converge = easeOut(window_(t, 0.24, 0.32), 2.4);
  const overlap = window_(t, 0.52, 0.16);
  const snap = flash(t, 0.575, 0.03);
  const breath = pulse(t, 0.9);

  // 合拢之后镜头缓缓收紧, 画面才不会剩一张小卡挂在空场里。
  const tighten = easeInOut(window_(t, 0.5, 0.42));
  const zoom = mix(1, 1.16, tighten);
  const cards = [];
  const labels = [];
  SLOTS.forEach(([sx, sy], i) => {
    let x = mix(sx, MERGE[0], converge);
    let y = mix(sy, MERGE[1], converge);
    // 以画幅中心为原点缩放, 和背景的 scale 保持一致。
    x = W / 2 + (x - W / 2) * zoom;
    y = H / 2 + (y - H / 2) * zoom;
    // 收拢途中给一点过冲, 落定才有重量。
    const height = 244 * zoom * (1 + 0.06 * (1 - spring(window_(t, 0.24, 0.32))));
    // 后三张并进第一张。留一点点没并干净, 才看得出确实是四张叠着。
    const opacity = i === 0 ? 1 : 1 - 0.82 * easeOut(overlap);
    cards.push(`<img class="card" src="card.png" style="left:${x.toFixed(0)}px;`
      + `top:${y.toFixed(0)}px;height:${height.toFixed(0)}px;`
      + `width:${(height * CARD_ASPECT).toFixed(0)}px;opacity:${opacity.toFixed(3)};`
      + `filter:drop-shadow(0 16px 34px rgba(0,0,0,.55))">`);

    // 标签在收拢一开始就撤, 四个挤到一处会压成一团。
    const tag = 1 - easeInOut(window_(t, 0.2, 0.16));
    if (tag > 0.02) {
      const lift = 210 + (i % 2 ? 74 : 0);
      labels.push(`<div class="label" style="left:${Math.min(Math.max(x, 190), W - 190).toFixed(0)}px;`
        + `top:${(y - lift).toFixed(0)}px;opacity:${tag.toFixed(3)};`
        + `border-color:${COLORS[i]};box-shadow:0 0 26px ${COLORS[i]}77">`
        + `<i style="background:${COLORS[i]}"></i>${NAMES[i]}</div>`);
    }
  });

  // 两段字幕各压各的画面。第一段在四份还摊着时出, 第二段在合拢之后。
  const firstIn = easeOut(window_(t, 0.06, 0.1));
  const firstOut = easeInOut(window_(t, 0.42, 0.1));
  const first = firstIn * (1 - firstOut);
  const second = easeOut(window_(t, 0.6, 0.12));
  // 合拢之后浮出质量轴。卡片重合只说明「四份一样」, 说不出「四份都平庸」——
  // 均值要有参照系才看得见: 一条从「发不出去」到「值得发」的轴, 四个点全挤在正中。
  const axis = easeOut(window_(t, 0.62, 0.14));
  const dots = easeOut(window_(t, 0.7, 0.16));

  return `<!doctype html><html><head><meta charset="utf-8">
<meta name="render-size" content="${W}x${H}">
<style>*{margin:0;padding:0;box-sizing:border-box}
body{width:${W}px;height:${H}px;position:relative;overflow:hidden;background:#0b1a35;
 font-family:'PingFang SC',sans-serif}
.plate{position:absolute;left:50%;top:50%;width:${W}px;height:${H}px;object-fit:cover;
 transform:translate(-50%,-50%) scale(${mix(1, 1.16, easeInOut(window_(t, 0.5, 0.42))).toFixed(4)});
 filter:brightness(.82)}
.glow{position:absolute;left:${SOURCE[0]}px;top:${SOURCE[1]}px;width:470px;height:470px;
 transform:translate(-50%,-50%);mix-blend-mode:screen;
 background:radial-gradient(circle,rgba(150,225,255,${(0.2 + 0.2 * breath).toFixed(3)}) 0%,
 rgba(80,175,255,${(0.09 + 0.09 * breath).toFixed(3)}) 38%,rgba(0,0,0,0) 68%)}
.card{position:absolute;transform:translate(-50%,-50%);display:block}
.snap{position:absolute;left:${MERGE[0]}px;top:${MERGE[1]}px;width:820px;height:820px;
 transform:translate(-50%,-50%);mix-blend-mode:screen;pointer-events:none;
 background:radial-gradient(circle,rgba(190,240,255,${(0.55 * snap).toFixed(3)}) 0%,
 rgba(90,190,255,${(0.22 * snap).toFixed(3)}) 40%,rgba(0,0,0,0) 70%)}
.label{position:absolute;transform:translate(-50%,-100%);display:flex;align-items:center;gap:12px;
 padding:12px 28px;border-radius:999px;background:rgba(8,18,40,.88);border:2px solid;color:#EAF2FB;
 font-size:42px;letter-spacing:1px;white-space:nowrap}
.label i{width:13px;height:13px;border-radius:50%;display:block}
.caption{position:absolute;left:120px;bottom:104px}
.axis{position:absolute;left:1300px;top:718px;width:620px;margin-left:-310px}
.axis .rail{height:4px;border-radius:999px;
 background:linear-gradient(to right,rgba(200,110,80,.85),rgba(150,160,190,.85),rgba(120,215,170,.85))}
.axis .lo,.axis .hi{position:absolute;top:18px;font-size:25px;color:#8FA6C4;letter-spacing:1px}
.axis .lo{left:0}.axis .hi{right:0}
.axis .mid{position:absolute;left:50%;top:2px}
.axis .mid i{position:absolute;width:17px;height:17px;border-radius:50%;display:block;
 box-shadow:0 0 14px rgba(255,255,255,.5)}
.axis .mid b{position:absolute;left:50%;top:-58px;transform:translateX(-50%);
 font-size:30px;color:#EAF2FB;letter-spacing:3px;white-space:nowrap;font-weight:600;
 text-shadow:0 0 16px rgba(0,0,0,.8)}
.caption b{display:block;font-size:64px;font-weight:600;color:#F1F6FC;letter-spacing:3px;
 text-shadow:0 4px 26px rgba(0,0,0,.7)}
.caption span{display:block;margin-top:16px;font-size:33px;font-weight:300;color:#A9BFDC;
 letter-spacing:2px;text-shadow:0 2px 18px rgba(0,0,0,.65)}
</style></head><body>
<img class="plate" src="plate.png"><div class="glow"></div>
${cards.join('')}<div class="snap"></div>${labels.join('')}
<div class="axis" style="opacity:${axis.toFixed(3)}">
  <div class="rail"></div>
  <span class="lo">发不出去</span><span class="hi">值得发</span>
  <div class="mid" style="opacity:${dots.toFixed(3)}">
    ${NAMES.map((n, i) => `<i style="background:${COLORS[i]};`
      + `transform:translate(-50%,-50%) translate(${(i - 1.5) * 13}px,${(i % 2 ? 11 : -11)}px);`
      + `opacity:${easeOut(Math.max(0, (dots - i * 0.12) / 0.5)).toFixed(3)}"></i>`).join('')}
    <b style="opacity:${dots.toFixed(3)}">均值</b>
  </div>
</div>
<div class="caption" style="opacity:${first.toFixed(3)}">
  <b>四份摊开来看，内容都很寡淡</b><span>语言不通顺，完全没法读</span></div>
<div class="caption" style="opacity:${second.toFixed(3)};
  transform:translateY(${((1 - second) * 18).toFixed(0)}px)">
  <b>没有约束，AI 给你的就是均值</b><span>跟它许愿，换不来一篇好文章</span></div>
</body></html>`;
}

mkdirSync(dir, {recursive: true});
for (const [src, as] of USES) copyFileSync(path.join(ASSETS, src), path.join(dir, as));
const total = FPS * DURATION;
for (let f = 0; f < total; f += 1) {
  writeFileSync(path.join(dir, `fr${String(f).padStart(3, '0')}.html`), frameHtml(f / (total - 1)));
}
console.log(`${total} frames`);
