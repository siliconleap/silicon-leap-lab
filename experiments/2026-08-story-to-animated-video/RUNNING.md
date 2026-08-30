# 怎么把这两支片子跑出来

成片和 `node_modules` 都不在 git 里，它们是确定性的产物。源是 `public/project.json`
加 `public/assets/`，加上 `narration.txt`。

## 密钥放哪

**不放仓库，任何形式都不放。** 本实验只需要一组腾讯云凭据，两个环境变量：

```
TENCENT_CLOUD_SECRET_ID
TENCENT_CLOUD_SECRET_KEY
```

`illustrated-videos` 的 `scripts/lib/tencent.mjs` 也认 `TENCENTCLOUD_SECRET_ID` / `_KEY`
这一组写法，两种都行。

放在 shell 的启动文件里（本机是 `~/.zshrc`），或任何仓库之外的地方。**这里只记变量名，
不记值，也不提供 `.env.example` 之外的任何模板** ——`.gitignore` 已经挡掉 `.env`
和 `.env.local`，但挡得住不等于该往那儿放。

`preflight.mjs` 会在开跑前检查这两个变量，缺了直接报错退出，不会跑到第三十张图才失败。

### agent 执行时读不到密钥的坑

agent 跑的是非交互 shell，**不加载 `~/.zshrc`**，所以「我明明配了」和「程序读得到」
是两回事。本次的做法是在仓库之外写一个加载脚本，把 venv 的 PATH 和 shell 启动文件里
的那两个变量一起载进来：

```sh
export PATH="$HOME/.claude/skills/illustrated-videos/.venv/bin:$PATH"
set -a
eval "$(grep -E '^[[:space:]]*export[[:space:]]+TENCENT' "$HOME/.zshrc" | sed 's/^[[:space:]]*export[[:space:]]*//')"
set +a
```

**这个脚本本身也不进仓库**——它虽然不含密钥，但把「密钥在哪个文件的哪一行」写死了，
属于不必要的暴露面。

## 依赖

```sh
python3 -m venv ~/.claude/skills/illustrated-videos/.venv
~/.claude/skills/illustrated-videos/.venv/bin/pip install pillow rembg onnxruntime
```

Pillow 不要用 `brew install pillow`：它会装进 brew 自己那个 Python 版本，而系统
`python3` 可能是另一个版本，装成功但导入失败。

## 跑

```sh
cd <film-a 或 film-b>
npm install
node ~/.claude/skills/illustrated-videos/scripts/preflight.mjs --config project-config.json
node ~/.claude/skills/illustrated-videos/scripts/validate-manifest.mjs .
npx remotion render src/index.ts IllustratedVideo out/film.mp4 \
  --codec=h264 --audio-codec=aac --pixel-format=yuv420p --crf=18 --concurrency=2
```

改了旁白就要重新配音并重新对时，顺序不能颠倒：

```sh
node ~/.claude/skills/illustrated-videos/scripts/generate-voice.mjs --provider tencent --voice 501000 \
  --speed 0 --text-file narration.txt --scene-ids s1,s2,... --out public/assets/audio/narration.mp3
node ~/.claude/skills/illustrated-videos/scripts/apply-caption-timings.mjs \
  --aligned public/assets/audio/narration.cues.json --project public/project.json --tail-seconds 1.6
```

## 只看某一拍

不要渲整片再拆帧，直接出那一帧：

```sh
npx remotion still src/index.ts IllustratedVideo out/check.png --frame=<帧号>
```
