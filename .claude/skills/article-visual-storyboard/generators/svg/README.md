# SVG 生成器

默认通道。模型直接写 SVG 源，Chrome headless 渲染成 PNG。

## 为什么默认用它

- **源是文本**——进 git，可 diff，改一条线就是改一行，不用重新生成整张
- **零外部依赖**——不需要图像生成 API、账号、配额、计费
- **可控**——要一条线在哪就在哪，不用反复抽卡
- **适合示意图**——图标、结构、流程、比喻，这些本来就该是矢量的

不适合的场景见 `../image/README.md`。

## 写法

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="1920" height="1080">
  <defs>
    <filter id="hand" x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency="0.016" numOctaves="3" seed="5" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="3.2"
                         xChannelSelector="R" yChannelSelector="G"/>
    </filter>
  </defs>
  <rect width="1920" height="1080" fill="#1a1a19"/>

  <!-- 图形进 filter 分组 -->
  <g filter="url(#hand)" fill="none" stroke-linecap="round" stroke-linejoin="round">
    ...
  </g>

  <!-- 文字在 filter 之外，否则会被扭糊 -->
  <text x="..." y="..." font-size="30" fill="#c3c2b7">...</text>
</svg>
```

## 三条最容易踩的坑

1. **文字进了 filter** —— 渲染出来是糊的。图形和文字必须分组
2. **路径写错不报错** —— SVG 语法合法但画出一团乱线，脚本照样返回成功。
   **每张都要肉眼看过**
3. **`seed` 忘了改** —— 十张图用同一个 seed，抖动纹理完全一样，串成视频看得出来

## 渲染

```sh
render.sh <文件.svg | 目录> [...]
```

传目录会渲染其中所有 `.svg` 和 `.html`。产物是同名 `.png`，与源同目录。

尺寸取自 SVG 根元素的 `width` / `height`，或 HTML 里的
`<meta name="render-size" content="宽x高">`。
