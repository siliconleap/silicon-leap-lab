#!/bin/sh
# 把 SVG / HTML 画面源渲染成 PNG。零额外依赖，只用系统自带的 Chrome。
#
# 用法: render.sh <文件.svg | 文件.html | 目录> [...]
#   传目录则渲染其中所有 .svg 和 .html
#
# 尺寸: SVG 取根元素的 width/height；HTML 取 <meta name="render-size" content="宽x高">。
# 都取不到时用 1920x1080。
#
# 设计: 源进 git（纯文本、可 diff、可复现），PNG 是产物。改图改源重渲染，
# 不要用图形工具改 PNG——那样源和产物就脱钩了。
#
# 注意: SVG 语法合法但路径写错时，这里照样返回成功，只是画出一团乱线。
# 渲染完必须逐张肉眼看过。

set -u

CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
[ -x "$CHROME" ] || {
	echo "错误: 未找到 Chrome: $CHROME" >&2
	echo "      本脚本依赖 Chrome headless 渲染" >&2
	exit 1
}

[ $# -gt 0 ] || { echo "用法: render.sh <文件.svg | 文件.html | 目录> [...]" >&2; exit 2; }

rendered=0
failed=0

size_of() {
	src=$1
	case $src in
	*.svg)
		# 根元素上的 width="1920" height="1080"
		w=$(grep -o 'width="[0-9]*"' "$src" 2>/dev/null | head -1 | grep -o '[0-9]*')
		h=$(grep -o 'height="[0-9]*"' "$src" 2>/dev/null | head -1 | grep -o '[0-9]*')
		[ -n "$w" ] && [ -n "$h" ] && { echo "${w}x${h}"; return; }
		;;
	*)
		s=$(grep -o 'name="render-size"[^>]*content="[0-9]*x[0-9]*"' "$src" 2>/dev/null \
			| grep -o '[0-9]*x[0-9]*' | head -1)
		[ -n "$s" ] && { echo "$s"; return; }
		;;
	esac
	echo "1920x1080"
}

render_one() {
	src=$1
	out=${src%.*}.png
	size=$(size_of "$src")
	w=${size%x*}
	h=${size#*x}

	if "$CHROME" --headless --disable-gpu --no-sandbox --hide-scrollbars \
		--force-device-scale-factor=1 --window-size="$w,$h" \
		--default-background-color=00000000 \
		--screenshot="$out" "$src" >/dev/null 2>&1 && [ -s "$out" ]; then
		echo "ok    ${out##*/}  ${w}x${h}"
		rendered=$((rendered + 1))
	else
		echo "FAIL  ${src##*/} 渲染失败" >&2
		failed=$((failed + 1))
	fi
}

for target in "$@"; do
	if [ -d "$target" ]; then
		for f in "$target"/*.svg "$target"/*.html; do
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
echo "提醒: 逐张看过再交付——路径写错不会报错, 只会画错。"
[ "$failed" -eq 0 ] || exit 1
