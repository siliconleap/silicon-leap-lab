#!/usr/bin/env node
// s11「第四件，把确定性的活交给脚本。校验脚本第一次跑，就抓出四处死链」
//
// 第十一种运动: 逐行吐出。一个终端窗口浮在场景里, 校验一项一项跑过去, 前几项
// 打勾, 到 drafts 链接这一项连爆四条死链, 计数器停在 4。
//
// 输出格式照抄 validate.sh 里那一行 `fail "死链 ${f#"$dir"/} -> $target"`,
// 数字 4 来自实验一 README 的数据表:「校验脚本首次运行抓出的死链 | 4」。
// 具体是哪四条没有留存, 所以只写脚本硬编码的那几个目录名, 不编造文件名。
import {mkdirSync, writeFileSync, copyFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {easeOut, window_, pulse, mix, clamp01} from
  'file:///Users/kaidong/Code/editorial-video/scripts/lib/easing.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const dir = process.argv[2] ?? path.join(here, 'frames');
// 素材共用一份, 构建时复制进帧目录——同一张底板存十二份是三十六兆。
const ASSETS = path.join(here, '..', '..', 'assets');
const USES = [
  ['plate-ai-b.png', 'plate.png'],
];

const W = 1920, H = 1080, FPS = 24, DURATION = 12;

// 前几行是通过的检查, 后四行是死链。死链的目标目录取自 validate.sh 的注释:
// 「模板硬编码 notes/ data/ recordings/ code/ 会产出死链，这一项专抓它。」
const LINES = [
  ['ok', 'plan.md 必填字段齐全'],
  ['ok', 'README 数据表每一行都有来源'],
  ['ok', '结论段落非空'],
  ['bad', '死链 drafts/site/blog.md -> notes/'],
  ['bad', '死链 drafts/wechat/post.md -> data/'],
  ['bad', '死链 drafts/xiaohongshu/note.md -> recordings/'],
  ['bad', '死链 drafts/github/readme.md -> code/'],
];

function frameHtml(t) {
  const breath = pulse(t, 0.9);
  const open = easeOut(window_(t, 0.03, 0.12), 2.4);

  const lines = LINES.map(([kind, text], i) => {
    const on = clamp01((window_(t, 0.16, 0.46) - i * 0.1) / 0.05);
    if (on <= 0) return '';
    return `<div class="line ${kind}" style="opacity:${on.toFixed(3)}">`
      + `<i>${kind === 'ok' ? '✓' : '✗'}</i><span>${text}</span></div>`;
  }).join('');

  // 计数器跟着死链一条条往上跳, 停在 4。
  const found = LINES.reduce((n, [kind], i) =>
    n + (kind === 'bad' && window_(t, 0.16, 0.46) - i * 0.1 > 0 ? 1 : 0), 0);
  const counter = easeOut(window_(t, 0.44, 0.12));
  const caption = easeOut(window_(t, 0.72, 0.12));

  return `<!doctype html><html><head><meta charset="utf-8">
<meta name="render-size" content="${W}x${H}">
<style>*{margin:0;padding:0;box-sizing:border-box}
body{width:${W}px;height:${H}px;position:relative;overflow:hidden;background:#0a1730;
 font-family:'PingFang SC',sans-serif}
.plate{position:absolute;left:50%;top:50%;width:${W}px;height:${H}px;object-fit:cover;
 transform:translate(-50%,-50%) scale(1.06);filter:brightness(.38) blur(5px)}
.term{position:absolute;left:150px;top:150px;width:1180px;border-radius:14px;overflow:hidden;
 background:rgba(7,12,22,.94);border:2px solid rgba(120,180,255,.4);
 box-shadow:0 30px 70px rgba(0,0,0,.7),0 0 46px rgba(70,150,255,.22);
 transform:scale(${(0.94 + 0.06 * open).toFixed(3)});opacity:${open.toFixed(3)};
 transform-origin:0 0}
.bar{display:flex;align-items:center;gap:12px;padding:16px 22px;
 background:rgba(14,26,46,.95);border-bottom:1px solid rgba(120,180,255,.2)}
.bar i{width:13px;height:13px;border-radius:50%;display:block;background:#3E5madeup}
.bar i{background:#3E5772}
.bar b{margin-left:14px;font-size:26px;color:#8FB0D4;font-weight:400;letter-spacing:1px;
 font-family:'SF Mono','Menlo',monospace}
.body{padding:26px 30px 34px;font-family:'SF Mono','Menlo',monospace}
.cmd{font-size:30px;color:#9FD8FF;margin-bottom:22px}
.cmd em{font-style:normal;color:#5E7B99}
.line{display:flex;align-items:center;gap:16px;font-size:29px;padding:9px 0;letter-spacing:.5px}
.line i{font-style:normal;width:26px;display:block;text-align:center}
.line.ok{color:#7FA8CE}.line.ok i{color:#6FD6A6}
.line.bad{color:#F3C9A0}.line.bad i{color:#F0764A}
.count{position:absolute;right:170px;top:300px;text-align:center;opacity:${counter.toFixed(3)}}
.count b{display:block;font-size:170px;font-weight:600;color:#F0764A;line-height:1;
 font-family:'SF Mono','Menlo',monospace;
 text-shadow:0 0 ${(30 + 18 * breath).toFixed(0)}px rgba(240,110,70,.55)}
.count span{display:block;margin-top:18px;font-size:30px;color:#B08770;letter-spacing:2px}
.count em{display:block;margin-top:10px;font-style:normal;font-size:25px;color:#6E8098}
.caption{position:absolute;left:150px;bottom:82px;opacity:${caption.toFixed(3)};
 transform:translateY(${((1 - caption) * 18).toFixed(0)}px)}
.caption b{display:block;font-size:58px;font-weight:600;color:#F1F6FC;letter-spacing:3px}
.caption span{display:block;margin-top:12px;font-size:31px;font-weight:300;color:#A9BFDC;
 letter-spacing:2px}
</style></head><body>
<img class="plate" src="plate.png">
<div class="term">
  <div class="bar"><i></i><i></i><i></i><b>validate.sh</b></div>
  <div class="body"><div class="cmd">$ ./validate.sh <em>experiments/2026-08-markdown-only-content-pipeline</em></div>
  ${lines}</div>
</div>
<div class="count"><b>${found}</b><span>处死链</span><em>第一次跑就抓出来</em></div>
<div class="caption"><b>把确定性的活交给脚本</b><span>目录骨架、格式校验、配图渲染，都不再靠人记得</span></div>
</body></html>`;
}

mkdirSync(dir, {recursive: true});
for (const [src, as] of USES) copyFileSync(path.join(ASSETS, src), path.join(dir, as));
const total = FPS * DURATION;
for (let f = 0; f < total; f += 1) {
  writeFileSync(path.join(dir, `fr${String(f).padStart(3, '0')}.html`), frameHtml(f / (total - 1)));
}
console.log(`${total} frames`);
