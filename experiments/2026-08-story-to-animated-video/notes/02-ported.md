# 步骤 2 · 移植实装

**日期：** 2026-08-23
**改动仓库：** `~/Code/editorial-video`，提交 `61a5a18`
**diff：** `notes/02-ported.diff`（本实验的产物，另一个仓库的历史不属于本目录）

## 作者裁定

开跑前作者定了三件事，本步按此执行：

1. 生图与音频都继续用腾讯云，不引入新厂商
2. `qa.md` 里「No full composite illustration is accepted as a production scene」这条限制不需要
3. 水印可不可以关，要查清楚（见 `notes/01c-watermark.md`）

## 实装了什么

### 1. preflight 三个白名单补齐

`scripts/preflight.mjs` 之前是：

```js
const imageProviders  = new Set(['codex-native', 'openai-api', 'mcp', 'file']);
const voiceProviders  = new Set(['edge-tts', 'openai', 'file']);
const timingProviders = new Set(['manual', 'faster-whisper']);
```

补成 `tencent-aiart` / `tencent` / `synthesis`。

`synthesis` 是新增的时间码来源：直接取合成端每句的实测时长，不跑 ASR。这条链路本来就是通的——`generate-voice.mjs` 的 tencent 分支写 `{audioDuration, cues}` sidecar，`apply-caption-timings.mjs` 读它——缺的只是一个合法取值。

顺手加了凭证检查：用 `tencent-aiart` 或 `tencent` 而环境里没有 `TENCENTCLOUD_SECRET_ID` / `_KEY` 时，preflight 直接报错。preflight 的意义就是在烧掉三十张图之前拦住，而不是烧到第三十张才报。

### 2. 真实产物可以进画面

`references/qa.md` 那条限制按作者要求删掉，替换成：

> A real artifact -- a screenshot, terminal capture, diagram, or document the story is actually about -- may enter a scene as its own alpha layer. It is evidence, so it is never regenerated, redrawn, or restyled, and it carries its own provenance note. It rides inside the frame alongside the other layers; it does not become the frame.

`SKILL.md` 对应处同样加了这个例外。

**保留了 `layer-contract.md` 的三条硬失败不动**，其中一条是「the only visible motion is a pan, zoom, or crop applied to the whole scene」。原来那条 composite 禁令有一半作用是防止退化成幻灯片，而防幻灯片的活其实是这条硬失败在干——它才是判据 2 的真正守门人。删掉前者不影响后者。

### 3. 水印文档改写

`references/providers.md` 原来声称 `LogoAdd: 0` 去不掉「AI 生成」标，并注明「Verified by inspection」。腾讯官方三个接口的文档口径一致地否定了这个说法。改写成：文档怎么说、旧说法撤回、最可能的成因（那次调用没显式传参，默认按 1 处理）、以及**在真看过一张生成图之前问题仍然开放**。

发布时的 AI 声明义务照旧保留——那与图片角落里那个标是两回事。

## 没实装的，和为什么

| 条目 | 结论 |
| --- | --- |
| 参考图条件化（硅基流动 FLUX.1 Kontext / Qwen-Image-Edit） | 作者定为不引入新厂商 |
| IndexTTS2 的时长控制 | 作者定为音频用腾讯云，探测取消 |
| StoryDiffusion | 停更两年 |
| 本地推理（ComfyUI / Z-Image / Qwen-Image） | 无 GPU |
| 借 Manim 的手法解释抽象物 | 不是代码改动，留到步骤 7 定分镜时判断 |

**如实记两条代价**，跑完回来对照：

- 角色一致性现在只剩腾讯云自己的图生图接口（`ImageToImage` 收 `InputImage`）加 prompt anchor。那是风格迁移接口，不是为「同一角色换姿态」设计的，够不够用要等 B 跑到步骤 9 才知道。
- 腾讯 TTS 的时长不可控，所以画面时长仍然由旁白说了算。一个需要 6 秒演完的动作配上 3 秒的旁白，只能压缩或硬撑。这对判据 2 是个已知的不利条件。

## 验证

用目标配置跑 preflight（`image: tencent-aiart`、`voice: tencent`、`timing: synthesis`）：**三条 provider 报错全部消失。** 剩下两条是真实的环境问题，归步骤 3：

```
"Python Pillow is required for layered chroma removal and alpha validation."
"Tencent providers require TENCENTCLOUD_SECRET_ID / _KEY (or TENCENT_CLOUD_*)."
```

第二条不是密钥不存在——`~/.zshrc` 里配着，作者说得对。是执行环境为非交互 shell，不加载 `.zshrc`，所以变量没进来。属于接线问题，步骤 3 处理，不需要作者重新配。

## 本步数据

| 字段 | 值 |
| --- | --- |
| 移植清单提出 | 8 条 |
| 本次实装 | 3 条 |
| 放弃 | 4 条（其中 2 条因作者选型裁定） |
| 待步骤 7 判断 | 1 条 |
| 改动文件 | 4（`preflight.mjs`、`qa.md`、`SKILL.md`、`providers.md`） |
| 失败次数 | 0 |
