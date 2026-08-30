# 片 A 的输入素材

这几张是成片的**输入**，不是产物：它们由生成式接口产出，同一段提示词再跑一次不会得到
同一张图。删掉就没了，所以进 git。

| 文件 | 用在哪 | 怎么来的 |
|---|---|---|
| `plate-ai-b.png` | s3–s14 的底板 | 拿空背板当参考图，把发光球体加进磨砂外壳 |
| `doc-off-icon.png` | s1、s2 的文档阵列 | prop，抠图后取最大连通域 |
| `doc-on-icon.png` | s2 亮起的那一枚 | 同上，暖橙发光版 |
| `card.png` | s4、s5 的稿件卡 | 独立生成的不透明卡片，不给参考图 |
| `bg.png` | s1、s2 的背景 | stage，纯电路板 |
| `panel-l.png` `panel-r.png` | s6 的两块截图面板 | 实验一 `01-contradiction.png` 切块后 3 倍栅格化 |

生成命令见 `illustrated-videos` skill 的 `references/style-presets.md`，参考图那一节。
