# 步骤 5 · 图像探测：水印与图生图

> **2026-08-23 后续更正：** 作者在腾讯云后台打开了配置开关后重测，`LogoAdd`
> 完全按文档行为——传 0 无标，传 1 有标。**本文下面「关不掉」的结论只对开关
> 未开的账号成立。**完整机制见 `notes/05c-watermark-resolved.md`。

**日期：** 2026-08-23
**调用：** 3 次（TextToImageLite ×2，ImageToImage ×1）
**样图：** `notes/probe/`

## 结论一：水印关不掉，官方文档说的不成立

同一句 prompt 生成两张，一张传 `LogoAdd: 0`，一张传 `LogoAdd: 1`。

| 文件 | LogoAdd | 右下角 |
| --- | --- | --- |
| `probe/no-logo.png` | 0 | 有「AI 生成」 |
| `probe/with-logo.png` | 1 | 有「AI 生成」 |
| `probe/i2i.png` | 0（ImageToImage） | 有「AI 生成」 |

放大右下角对比（`probe/*-corner.png`），两张**看不出区别**。请求正常返回，不报错，参数没有可观察的效果。

腾讯官方三个接口的文档都写着「默认为1。1：添加标识。0：不添加标识」。**实测不是这样。**

### 这件事的完整经过值得记下来

1. 仓库里 `providers.md` 写着：`LogoAdd: 0` 去不掉「AI 生成」标，注明「Verified by inspection」
2. 代码注释写着相反的：传 0 就能关掉
3. 作者说网上查到可以关，要求核实
4. 我去查官方文档，三个接口口径一致地支持「可以关」，于是**判定 `providers.md` 错了**，把它改写成「旧说法撤回」，还给出了一个推测的成因
5. 步骤 5 实测：`providers.md` 原来是对的，文档是错的，我改错了

第 4 步是这次实验到目前为止最值得记的一次失误。手上有一份声称目视核实过的一手记录，和一份权威但二手的文档，两者冲突时我选了文档。**一手记录输给了权威来源，而一手记录是对的。**

当时留了一句「在真看过一张生成图之前问题仍然开放」，步骤 5 照跑——这句话救了这次。代价是两张图。

一个说得通但未经证实的解释：合规标在 AI 生成内容标识相关规定下变成了强制项，而接口文档的措辞没跟着改。**这是推测，实测不是。**

### 后果

- 这个 provider 出的每一张图右下角都有标，约占宽 18%、高 5.5%，正落在字幕安全区
- 不许裁掉或涂掉——那是合规标，移除与否是项目所有者的决定，工具链不替他做
- **分层是唯一的出路**：标是盖在背景板上的，主体抠出来时标随背景留下。所以只有背景板带标，主体层干净。构图时把主体避开右下角

## 结论二：ImageToImage 是风格迁移，不能换姿态

原打算用它做角色一致性：先生成一次角色，再派生变体。实测不行。

给它一张源图加一句「同一只戴眼镜的灰兔子，站起来伸手指向前方」，返回的是**原构图换了个画风**——兔子还是坐着，笔记本还在原位，要求的动作被忽略了（`probe/i2i.png`）。

它是风格迁移接口，不是「同一角色换姿态换场景」的接口。**所以它不能承担跨 scene 的角色连贯。**

顺带一个更麻烦的现象：源图上的「AI 生成」标被风格化重绘了一遍，变成带描边的字，等于烧得更死。

## 对 B 那支片子的影响

角色一致性原来规划的三层退路：

1. ~~腾讯图生图派生变体~~ ——本步证否
2. prompt anchor 加 QA 检查
3. 承认做不到，照实写

**第一层没了。** 现在只剩靠文字描述反复约束，以及承认做不到。

## 本步数据

| 字段 | 值 |
| --- | --- |
| 图像 API 调用 | 3 次 |
| 探测结论 | 水印不可关；ImageToImage 不能换姿态 |
| 是否阻塞 | 不阻塞主线，但改变了两处设计前提 |
| 引发的文档更正 | `editorial-video@7adf138` |

---

## 附：这次水印实测具体调了什么、怎么传的参

作者要求看清楚调用细节，记在这里。

**代码路径**

- 发请求：`~/Code/editorial-video/scripts/generate-tencent-image.mjs:40-55`
- 签名：`~/Code/editorial-video/scripts/lib/tencent.mjs`，TC3-HMAC-SHA256
- 凭据：`TENCENTCLOUD_SECRET_ID` / `_KEY`，两种变量名都认（本机用的是 `TENCENT_CLOUD_*`）

**请求**

```
POST https://aiart.tencentcloudapi.com
X-TC-Action:    TextToImageLite
X-TC-Version:   2022-12-29
X-TC-Region:    ap-guangzhou
Content-Type:   application/json; charset=utf-8
Authorization:  TC3-HMAC-SHA256 ...（含 SecretId）
```

```json
{
  "Prompt": "<提示词>",
  "Resolution": "1024:1024",
  "LogoAdd": 0,
  "RspImgType": "base64"
}
```

`LogoAdd` 的取值由 `generate-tencent-image.mjs:22` 决定：`args.includes('--logo') ? 1 : 0`。也就是说不加 `--logo` 时**确实传的是 0**，不是漏传，也不是走了默认值。

**两次调用的唯一差别**就是这个字段 0 与 1。响应都正常返回 `ResultImage`，无错误码，无警告。

**复现方法**（会产生 2 次计费调用）

```sh
cd ~/Code/editorial-video
export TENCENT_CLOUD_SECRET_ID=...   # 本机已配在 ~/.zshrc
export TENCENT_CLOUD_SECRET_KEY=...
echo "剪纸风格插画，一只戴眼镜的灰兔子坐在桌前" > /tmp/p.txt
node scripts/generate-tencent-image.mjs --prompt-file /tmp/p.txt --out /tmp/a.png --resolution 1024:1024
node scripts/generate-tencent-image.mjs --prompt-file /tmp/p.txt --out /tmp/b.png --resolution 1024:1024 --logo
```

然后裁两张图右下角 22%×8% 放大对比。本次结果：`notes/probe/no-logo-corner.png` 与 `notes/probe/with-logo-corner.png`，肉眼无差别。

**还没试过的两条**，如果你想继续挖：

- `LogoParam`：文档说可以把标识换成自定义图片。没试过换成一张全透明 1×1 会怎样——但那本质上是绕过合规标，属于你的决定，我没自作主张试。
- 换产品线：混元生图 2.0 / 3.0 在 `hunyuan` 而不是 `aiart` 下（文档 1729 与 1668 是两套），接口是异步的提交任务加查询任务。有没有同样的行为，没测。
