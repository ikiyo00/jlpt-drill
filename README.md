# 今日のJLPT

每天推送的单词和语法，用「中日对照释义」自测一遍。
纯静态网页，零依赖、零后端，托管在 GitHub Pages 上，手机加主屏即可当 App 用。

## 它到底测什么

只测一件事：**看到日语，能不能说出中文释义。**

- 两种出题方式：**四选一**（快，适合通勤）/ **自己写中文**（扎实，按关键词判分）
- 单词和语法分开统计，附例句和中文翻译
- 答错的自动进「错题」，可以只练错题
- 进度和连续天数存在浏览器本地，换设备不同步（这是刻意的，隐私简单）
- 可以把某次成绩导出成 JSON，提交回仓库做长期记录

## 三步跑起来

> 完整的分步操作流程（含 GitHub 建仓、Pages 设置、故障对照表）见 **[SETUP.md](SETUP.md)**。
> 不想在自己电脑上跑、只想全程用浏览器 + GitHub：见 **[GITHUB_RUN.md](GITHUB_RUN.md)**。
> 只想照着做、不看解释：见 **[QUICKSTART.md](QUICKSTART.md)**。
> 下面是速览版。


```bash
# 1. 看效果：直接双击 index.html 就行（数据由 data/bundle.js 内嵌）
#    想跑服务器也可以：
python scripts/build.py serve          # http://localhost:8000

# 2. 把当天内容导入（TSV 格式见下）
python scripts/build.py import scripts/sample.tsv --date 2026-11-03

# 3. 提交
git add -A && git commit -m "feat: 11/03 的词句" && git push
```

> `import` 会自动重建 `data/index.json` 和 `data/bundle.js`，两个都要提交。

### 部署到 GitHub Pages

1. 新建仓库，把整个目录推上去
2. Settings → Pages → Source 选 `Deploy from a branch`，分支 `main`，目录 `/ (root)`
3. 等一分钟，打开 `https://<你的用户名>.github.io/<仓库名>/`
4. 手机上用 Safari/Chrome 打开 → 分享 → 添加到主屏幕

> 加书签时用 `.../仓库名/?start=1`，打开直接进入当天测验，跳过封面页。

## 每天的数据怎么来

我每天给你一段 TSV（Tab 分隔）。列固定 9 个：

| 列 | 说明 | 例 |
|---|---|---|
| `type` | `word` / `grammar` | `word` |
| `jp` | 日语词或语法点 | `曖昧` / `〜に応じて` |
| `reading` | 读音 | `あいまい` |
| `pos` | 词性或接续 | `ナ形` / `名詞＋に応じて` |
| `cn` | 中文释义（用 `；` 分主要义项） | `暧昧；含糊` |
| `alt` | 可接受的同义答法，`\|` 分隔 | `模糊\|含糊不清` |
| `example` | 日文例句 | `彼の返事は曖昧だ。` |
| `exampleCn` | 例句中文 | `他的回答很含糊。` |
| `tags` | 标签，`\|` 分隔 | `N2` |

存成 `xxx.tsv` 后跑一行 `python scripts/build.py import xxx.tsv`，它会：
- 生成 `data/days/<日期>.json`
- 自动编号 id（`w-20261102-01` / `g-20261102-01`）
- 重建 `data/index.json` 和 `data/bundle.js`

**完全不碰命令行也行**：把 `.tsv` 提交到 `inbox/`（文件名带日期，如 `inbox/2026-11-03.tsv`），GitHub Actions 会自动导入并把结果提交回仓库。分隔符不强求 Tab，逗号、空格也能解析。

**不想碰命令行也行**：网页上点「粘贴导入」，把 TSV 直接贴进去就开始测，数据存在浏览器里。适合临时加练，缺点是换设备看不到。

## 目录结构

```
index.html              单页应用
assets/app.js           出题、判分、进度
assets/style.css        样式
data/index.json         日期索引（脚本生成，别手改）
data/bundle.js          内嵌全部题目，让 file:// 也能跑（脚本生成）
data/days/*.json        每天一个文件
scripts/build.py        import / index / check / serve
scripts/sample.tsv      格式示例
inbox/*.tsv             每天丢这里，Actions 自动导入
SETUP.md                分步操作流程（本地）
GITHUB_RUN.md           分步操作流程（全程浏览器 / GitHub）
.github/workflows/      自动校验 + 自动导入
```

## 判分规则（输入题）

不是逐字比对，否则「根据」和「根据…；按照…」永远判错。命中任一条即算对：

1. 与答案或 `alt` 完全一致（忽略大小写、空格、标点）
2. 输入是答案的连续子串（≥2 字）
3. 与答案的字符重合度 ≥ 0.6
4. 命中了用 `；，、` 切开的任一义项片段

所以 `alt` 这一列值得认真填——判分宽松度全靠它。

## 想扩展的话

- **加错题自动复现**：在 `app.js` 的 `startQuiz` 里，把近 7 天 `ok:false` 的条目混进队列
- **做成微信小程序**：`data/` 和判分函数可原样复用，只需把 DOM 渲染换成 WXML
- **云端同步**：接 Supabase 存 progress，就能多设备同步
- **音频**：给每条加 `audio` 字段，答题后播放（`edge-tts` 可以批量生成）
