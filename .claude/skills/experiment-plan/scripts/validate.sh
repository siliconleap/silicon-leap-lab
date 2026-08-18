#!/bin/sh
# 校验实验目录是否满足约定。只查确定性的东西，语义质量不在此列。
#
# 用法: validate.sh <实验目录>
# 退出码: 0 全过 / 1 有 FAIL / 2 用法错误
#
# 查得了: 七标题逐字、目录名格式、步骤表空格、drafts 相对链接、结论待补标记
# 查不了: 是否教程腔、反直觉点成不成立、结论有没有价值 —— 这些只能人看

set -u

dir=${1:-}
[ -n "$dir" ] || { echo "用法: validate.sh <实验目录>" >&2; exit 2; }
[ -d "$dir" ] || { echo "错误: 目录不存在: $dir" >&2; exit 2; }

dir=${dir%/}
fails=0
warns=0

fail() { echo "FAIL  $*"; fails=$((fails + 1)); }
warn() { echo "WARN  $*"; warns=$((warns + 1)); }
pass() { echo "ok    $*"; }

# --- 1. 目录名格式 ---------------------------------------------------------
base=$(basename "$dir")
if echo "$base" | grep -Eq '^[0-9]{4}-[0-9]{2}-[a-z0-9]+(-[a-z0-9]+)*$'; then
	pass "目录名格式 YYYY-MM-<slug>"
else
	fail "目录名不符合 YYYY-MM-<slug>: $base"
fi

readme="$dir/README.md"
if [ ! -f "$readme" ]; then
	fail "缺少 README.md（唯一必需文件）"
	echo
	echo "$fails 项失败, $warns 项警告"
	exit 1
fi

# --- 2. 七段标题逐字且有序 -------------------------------------------------
# content-forge 按标题文本解析，差一个字整条链就断。
expected="Question Setup Log Data:What Worked:What Failed:Conclusion"
actual=$(grep '^## ' "$readme" | sed 's/^## //' | head -7 | tr '\n' ':' | sed 's/:$//')
want="Question:Setup:Log:Data:What Worked:What Failed:Conclusion"
if [ "$actual" = "$want" ]; then
	pass "七段标题逐字匹配且有序"
else
	fail "七段标题不匹配 content-forge 的解析接口"
	echo "        期望: $want"
	echo "        实际: $actual"
fi

# 可选第八段
if grep -q '^## Artifacts$' "$readme"; then
	pass "含可选第八段 Artifacts"
fi

# --- 3. Conclusion 是否为空 ------------------------------------------------
conclusion=$(sed -n '/^## Conclusion$/,$p' "$readme" \
	| sed '1d' \
	| sed '/^## /,$d' \
	| sed 's/<!--.*-->//g' \
	| tr -d ' \t\n')
if [ -z "$conclusion" ]; then
	conclusion_empty=1
	warn "Conclusion 为空 —— 这是设计允许的状态，但发布前必须由人写"
else
	conclusion_empty=0
	pass "Conclusion 已填写"
fi

# --- 4. plan.md ------------------------------------------------------------
plan="$dir/plan.md"
if [ -f "$plan" ]; then
	if grep -q '^## 产物时间轴$' "$plan"; then
		pass "plan.md 含产物时间轴"
	else
		fail "plan.md 缺少产物时间轴（应由 init-experiment.sh 生成）"
	fi

	# 步骤表空单元格：取「## 步骤」到下一个二级标题之间的表格数据行
	empty_cells=$(sed -n '/^## 步骤$/,/^## /p' "$plan" \
		| grep '^|' \
		| grep -v '^| *#* *|* *---' \
		| grep -v '^| --- ' \
		| grep -Ev '^\| *# *\|' \
		| grep -Ec '\| *\|' || true)
	if [ "${empty_cells:-0}" -gt 0 ]; then
		fail "plan.md 步骤表有 $empty_cells 行含空单元格（「记什么数据」不许留空）"
	else
		pass "plan.md 步骤表无空单元格"
	fi
else
	warn "无 plan.md —— 实验应先有剧本再开跑"
fi

# --- 5. drafts 相对链接目标必须存在 ----------------------------------------
# 模板硬编码 notes/ data/ recordings/ code/ 会产出死链，这一项专抓它。
if [ -d "$dir/drafts" ]; then
	broken=0
	for f in $(find "$dir/drafts" -name '*.md' 2>/dev/null); do
		fdir=$(dirname "$f")
		links=$(grep -o ']([^)]*)' "$f" 2>/dev/null | sed 's/^](//; s/)$//' || true)
		for link in $links; do
			case "$link" in
				http://* | https://* | mailto:* | '#'*) continue ;;
			esac
			target=${link%%#*}
			[ -n "$target" ] || continue
			if [ ! -e "$fdir/$target" ] && [ ! -e "$dir/$target" ]; then
				fail "死链 ${f#"$dir"/} -> $target"
				broken=$((broken + 1))
			fi
		done
	done
	[ "$broken" -eq 0 ] && pass "drafts 相对链接目标全部存在"

	# 结论为空时，各平台初稿必须带待补标记
	if [ "$conclusion_empty" -eq 1 ]; then
		missing=0
		for pf in "$dir"/drafts/*/; do
			[ -d "$pf" ] || continue
			if ! grep -rqi 'TODO\|待补' "$pf" 2>/dev/null; then
				fail "结论为空但 ${pf#"$dir"/} 没有待补标记"
				missing=$((missing + 1))
			fi
		done
		[ "$missing" -eq 0 ] && pass "结论为空，各平台初稿均已标待补"
	fi
else
	warn "无 drafts/ —— 尚未跑 content-forge"
fi

# --- 6. 数字溯源（启发式，仅警告）------------------------------------------
# 抽 drafts 里的数字，检查是否在 README Data 段出现过。会有假阳性，仅作提示。
if [ -d "$dir/drafts" ] && grep -q '^## Data$' "$readme"; then
	data_section=$(sed -n '/^## Data$/,/^## /p' "$readme")
	unsourced=""
	# 只扫面向读者的正文：brief / packaging 是视觉规格文件，通篇尺寸与色值，扫了全是噪音
	# 再剔除：色值 #1a1a19、时间码 0:30、文件名序号 01-xxx、日期 2026-08、尺寸 1080 × 1440、字号 44px
	nums=$(find "$dir/drafts" -name '*.md' ! -name '*brief*' ! -name 'packaging.md' -exec cat {} + 2>/dev/null \
		| sed 's/#[0-9a-fA-F]\{3,8\}//g' \
		| sed 's/[0-9][0-9]*:[0-9][0-9]*//g' \
		| sed 's/[0-9][0-9]*-[a-zA-Z]/-/g' \
		| sed 's/[0-9]\{4\}-[0-9]\{2\}//g' \
		| sed 's/[0-9][0-9]* *[×x] *[0-9][0-9]*//g' \
		| sed 's/[0-9][0-9]*px//g' \
		| grep -oE '[0-9]{2,}' | sort -u || true)
	for n in $nums; do
		case "$n" in
			2026 | 2025) continue ;;  # 年份
		esac
		echo "$data_section" | grep -q "$n" || unsourced="$unsourced $n"
	done
	if [ -n "$unsourced" ]; then
		warn "drafts 中这些数字未出现在 README Data 段（启发式，可能误报）:$unsourced"
	else
		pass "drafts 数字均可在 Data 段找到"
	fi
fi

echo
if [ "$fails" -gt 0 ]; then
	echo "$fails 项失败, $warns 项警告 —— 修完再报告"
	exit 1
fi
echo "全部通过, $warns 项警告"
exit 0
