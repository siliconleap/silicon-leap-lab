#!/bin/sh
# 把配图 HTML 源渲染成 PNG。零额外依赖，只用系统自带的 Chrome。
#
# 用法: render.sh <文件.html | 目录> [...]
#   传目录则渲染其中所有 .html
#
# 尺寸取自 HTML 里的 <meta name="render-size" content="宽x高">，缺省 1080x1440。
# 产物为同名 .png，与源文件同目录。
#
# 设计: HTML 源进 git（纯文本、可 diff、可复现），PNG 是产物。
# 改图改 HTML 重渲染，不要用图形工具改 PNG——那样源和产物就脱钩了。

set -u

CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
[ -x "$CHROME" ] || {
	echo "错误: 未找到 Chrome: $CHROME" >&2
	echo "      本脚本依赖 Chrome headless，这是本机唯一可用的渲染器" >&2
	echo "      （rsvg-convert / ImageMagick / wkhtmltoimage 均未安装）" >&2
	exit 1
}

[ $# -gt 0 ] || { echo "用法: render.sh <文件.html | 目录> [...]" >&2; exit 2; }

rendered=0
failed=0

render_one() {
	html=$1
	out=${html%.html}.png

	size=$(grep -o 'name="render-size"[^>]*content="[0-9]*x[0-9]*"' "$html" 2>/dev/null \
		| grep -o '[0-9]*x[0-9]*' | head -1)
	[ -n "$size" ] || size=1080x1440
	w=${size%x*}
	h=${size#*x}

	if "$CHROME" --headless --disable-gpu --no-sandbox --hide-scrollbars \
		--force-device-scale-factor=1 --window-size="$w,$h" \
		--screenshot="$out" "$html" >/dev/null 2>&1 && [ -s "$out" ]; then
		echo "ok    ${out##*/}  ${w}x${h}"
		rendered=$((rendered + 1))
	else
		echo "FAIL  ${html##*/} 渲染失败" >&2
		failed=$((failed + 1))
	fi
}

for target in "$@"; do
	if [ -d "$target" ]; then
		for f in "$target"/*.html; do
			[ -e "$f" ] || continue
			render_one "$f"
		done
	elif [ -f "$target" ]; then
		render_one "$target"
	else
		echo "FAIL  不存在: $target" >&2
		failed=$((failed + 1))
	fi
done

echo
echo "渲染 $rendered 张, 失败 $failed 张"
[ "$failed" -eq 0 ] || exit 1
