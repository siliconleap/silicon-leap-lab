#!/usr/bin/env node
// s13「最后列成了一张表。而表的最后一行写着：让 AI 反推图片、合成视频，目前无效」
//
// 第十三种运动: 表格滚动到底。成果一行行往上滚, 前面全是「已提升」的绿色,
// 滚到最后一行停住——红色的「失败」。整拍的重量都在这一停上。
//
// 表的内容照抄实验一 README 的成果指针表, 最后一行照抄数据表里那句
// 「视频渠道交付 | 失败。试出一版 4 分 24 秒的成片，达不到可发布标准」。
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
];

const W = 1920, H = 1080, FPS = 24, DURATION = 12.5;

const ROWS = [
  ['experiment-plan skill', '已提升'],
  ['init-experiment.sh　骨架生成', '已提升'],
  ['validate.sh　确定性校验', '已提升'],
  ['content-forge 平台化改造　5 配置 + 7 模板', '已提升'],
  ['render.sh　HTML → PNG', '已提升'],
  ['微信公众号平台配置 + 模板', '已提升'],
  ['反 AI 腔负面清单　全平台通用', '已提升'],
  ['.agents/skills 相对软链约定', '已提升'],
  ['git 身份隔离　includeIf', '实验内'],
  ['视频渠道交付', '失败'],
];
const ROW_H = 92;

function frameHtml(t) {
  const breath = pulse(t, 0.9);
  // 表格向上滚, 最后一行停在画面偏上, 下面留白给它说话。
  const scroll = easeInOut(window_(t, 0.08, 0.52));
  const offset = -scroll * (ROWS.length - 4) * ROW_H;
  const land = easeOut(window_(t, 0.58, 0.14));   // 最后一行落定并亮起
  const caption = easeOut(window_(t, 0.72, 0.12));

  const rows = ROWS.map(([name, state], i) => {
    const last = i === ROWS.length - 1;
    const cls = last ? 'fail' : state === '失败' ? 'fail' : state === '实验内' ? 'mid' : 'ok';
    return `<div class="row ${cls}" style="top:${(i * ROW_H).toFixed(0)}px;`
      + (last ? `--land:${land.toFixed(3)}` : '--land:0') + `">`
      + `<span class="n">${name}</span><span class="s">${state}</span></div>`;
  }).join('');

  return `<!doctype html><html><head><meta charset="utf-8">
<meta name="render-size" content="${W}x${H}">
<style>*{margin:0;padding:0;box-sizing:border-box}
body{width:${W}px;height:${H}px;position:relative;overflow:hidden;background:#0a1730;
 font-family:'PingFang SC',sans-serif}
.plate{position:absolute;left:50%;top:50%;width:${W}px;height:${H}px;object-fit:cover;
 transform:translate(-50%,-50%) scale(1.06);filter:brightness(.34) blur(5px)}
.head{position:absolute;left:200px;top:96px;font-size:40px;color:#C6D8EE;letter-spacing:3px}
.head em{font-style:normal;font-size:26px;color:#6D8CAC;margin-left:20px;
 font-family:'SF Mono','Menlo',monospace}
.win{position:absolute;left:200px;top:186px;width:1520px;height:400px;overflow:hidden;
 mask-image:linear-gradient(to bottom,transparent 0,#000 12%,#000 84%,transparent 100%)}
.list{position:absolute;left:0;right:0;top:0;transform:translateY(${offset.toFixed(1)}px)}
.row{position:absolute;left:0;right:0;height:78px;display:flex;align-items:center;
 padding:0 30px;border-radius:10px;background:rgba(10,24,48,.66);
 border-left:4px solid rgba(120,180,255,.3)}
.row .n{flex:1;font-size:33px;color:#B9CDE4;letter-spacing:1px}
.row .s{font-size:29px;letter-spacing:2px;padding:7px 22px;border-radius:999px}
.row.ok .s{color:#8FD9B4;background:rgba(30,72,54,.7)}
.row.mid .s{color:#9FC0E0;background:rgba(28,52,86,.7)}
.row.fail{border-left-color:rgba(240,90,60,calc(.4 + .6 * var(--land)));
 background:rgba(56,18,12,calc(.5 + .45 * var(--land)));
 box-shadow:0 0 calc(34px * var(--land)) rgba(240,90,60,.5)}
.row.fail .n{color:#F6D2C4}
.row.fail .s{color:#FF9270;background:rgba(94,26,16,.9)}
.detail{position:absolute;left:200px;top:626px;opacity:${land.toFixed(3)};
 transform:translateY(${((1 - land) * 16).toFixed(0)}px)}
.detail b{display:block;font-size:38px;color:#FF9270;letter-spacing:1px;font-weight:600;
 text-shadow:0 0 ${(16 + 10 * breath).toFixed(0)}px rgba(240,100,60,.45)}
.detail span{display:block;margin-top:12px;font-size:30px;color:#A9BFDC;letter-spacing:1px}
.caption{position:absolute;left:200px;bottom:82px;opacity:${caption.toFixed(3)};
 transform:translateY(${((1 - caption) * 18).toFixed(0)}px)}
.caption b{display:block;font-size:56px;font-weight:600;color:#F1F6FC;letter-spacing:3px}
</style></head><body>
<img class="plate" src="plate.png">
<div class="head">这次做出来的东西<em>README · 成果指针表</em></div>
<div class="win"><div class="list">${rows}</div></div>
<div class="detail"><b>试出一版 4 分 24 秒的成片，达不到可发布标准</b>
  <span>视频不是纯文本，也没法由纯文本生成</span></div>
<div class="caption"><b>而表的最后一行，写着失败</b></div>
</body></html>`;
}

mkdirSync(dir, {recursive: true});
for (const [src, as] of USES) copyFileSync(path.join(ASSETS, src), path.join(dir, as));
const total = FPS * DURATION;
for (let f = 0; f < total; f += 1) {
  writeFileSync(path.join(dir, `fr${String(f).padStart(3, '0')}.html`), frameHtml(f / (total - 1)));
}
console.log(`${total} frames`);
