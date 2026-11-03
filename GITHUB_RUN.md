# 在 GitHub 里运行（全程只用浏览器）

先说清楚一件事：**"在 GitHub 里跑"其实是两件不同的事**，很多人混在一起，结果卡住。

| 你想让什么跑 | 靠什么 | 在哪看结果 |
|---|---|---|
| 让网页能打开、手机能刷题 | **GitHub Pages**（静态托管） | `https://用户名.github.io/jlpt-drill/` |
| 让 `python scripts/build.py import` 跑起来 | **GitHub Actions**（云端跑脚本） | 仓库的 Actions 标签页 |
| 想有个能敲命令的云端电脑 | **Codespaces** | 仓库里按 `.` 或 Code → Codespaces |

日常只需要前两个。第三个是备选。

---

## 第一部分：让网页在 GitHub 上跑（一次性，约 10 分钟）

### 1. 建仓库

打开 `github.com/new`：

- 名字：`jlpt-drill`
- 可见性：**Public**（免费账号只有公开仓库能免费开 Pages）
- 下面三个勾（README / .gitignore / license）**都不要勾**

点 Create repository。

### 2. 上传文件

新仓库页面上有一行 `uploading an existing file`，点它。

然后打开你电脑上的 `jlpt-drill` 文件夹，**全选里面的内容**（不是选这个文件夹本身），拖进浏览器。

> 为什么强调"里面的内容"：GitHub Pages 要求 `index.html` 在仓库最外层。如果拖的是整个文件夹，路径会变成 `jlpt-drill/index.html`，打开网站就是 404。

拖进去后点 Commit changes。

**成功标志**：仓库首页能看到 `index.html`、`assets/`、`data/`、`scripts/` 这几个并排出现。

### 3. 补两个隐藏文件（Windows 上很可能漏掉）

`Ctrl+A` 全选时，以 `.` 开头的文件是看不见的，所以这两个大概率没上传：

- `.nojekyll`（空文件，让 Pages 别用 Jekyll 处理）
- `.github/workflows/add-day.yml`（自动导入，第二部分要用）

补法：仓库页面 → **Add file → Create new file**，文件名直接输 `.nojekyll`，内容留空，Commit。

同样的方式建 `.github/workflows/add-day.yml`。这个文件有 100 多行，手打不现实，两个办法：

- **办法一（推荐）**：装 [GitHub Desktop](https://desktop.github.com/)，`File → Add local repository` 选 `jlpt-drill` 文件夹，Publish 一次。所有文件、隐藏文件、提交历史一次到位，以后再也不用管命令行。
- **办法二**：把 `.github/workflows/add-day.yml` 的内容复制到网页编辑器里粘贴。

### 4. 打开 Pages

仓库 → **Settings** → 左侧 **Pages**：

- Source 选 `Deploy from a branch`
- Branch 选 `main`，目录选 `/ (root)`
- 点 Save

等 1–2 分钟，刷新这个页面，顶部会出现：

```
Your site is live at https://<用户名>.github.io/jlpt-drill/
```

**成功标志**：打开这个链接，看到日期条（11/2、11/1、10/31）和「开始测验」。

### 5. 加到手机主屏

- iPhone：Safari 打开链接 → 分享 → 添加到主屏幕
- Android：Chrome 打开 → ⋮ → 添加到主屏幕

建议在链接后面加 `?start=1`，一点开就直接进当天的测验：

```
https://<用户名>.github.io/jlpt-drill/?start=1
```

> 这里不需要 `python scripts/build.py serve`。那个命令只是为了在本机绕过 `file://` 的限制；Pages 本身就是 http 服务，直接可用。

---

## 第二部分：让"导入"也在 GitHub 上跑（GitHub Actions）

这是这一步最值钱的地方：**你不用装 Python，也不用自己的电脑开着，手机也能发布新题。**

### 它是怎么运作的

```
你把 2026-11-03.tsv 放进 inbox/
        ↓ 提交
GitHub Actions 自动启动一台云端 Linux
        ↓ 跑 python scripts/build.py import
生成 data/days/2026-11-03.json + 重建 index.json / bundle.js
        ↓ 自动提交回仓库
Pages 重新构建 → 手机刷新就能看到 11/3
```

### 每天的操作（3 步，手机也能做）

1. 仓库首页 → **Add file → Create new file**
2. 文件名填 `inbox/2026-11-03.tsv`，把 TSV 内容粘进去（**日期写在文件名里，脚本会自动认**）
3. 点 **Commit changes**

然后去 **Actions** 标签页，会看到一条「导入每日题目」正在跑。约 20 秒后变绿。

**成功标志**：`data/days/` 里多出 `2026-11-03.json`，网页日期条最左边多出 `11/3`。

### 文件名规则

| 文件名 | 结果 |
|---|---|
| `inbox/2026-11-03.tsv` | 导入成 2026-11-03 那天 |
| `inbox/day1.tsv` | 用「运行当天」的日期 |
| `inbox/2026-11-03-单词.tsv` | 认不出日期，用当天 |

### 手动重跑

如果自动没触发（比如你改了文件但没动 `inbox/`），去 Actions → 左侧「导入每日题目」→ 右侧 **Run workflow**，填文件名 `inbox/2026-11-03.tsv`，点绿色按钮。

---

## 我为此改了什么

**1. `scripts/build.py` 现在不挑分隔符**

GitHub 网页编辑器会把 Tab 变成空格，原来只认 Tab 就会报「没有解析出有效条目」。现在会先探测分隔符，Tab / 逗号 / 空格都试，能认就认，并且打印一行提示。

实测四种输入（9 列，共 4 条）都能正确落到 `jp / reading / pos / cn / alt / example / exampleCn / tags`：

| 输入 | 结果 |
|---|---|
| 原始 Tab | ✅ 3 单词 + 1 语法 |
| Tab 换成逗号 | ✅ |
| Tab 换成两个空格 | ✅ |
| Tab 换成一个空格 | ✅ 各列没错位 |
| 删掉表头 | ✅ |

**2. 新增 `inbox/` 目录和 `.github/workflows/add-day.yml`**

放进去 `.tsv` 就自动导入，规则写在上面的表格里。

**3. 流程末端自动触发 Pages 重建**

Actions 用机器人身份提交，默认不一定触发 Pages 重新构建，所以 workflow 最后会显式调一次 `POST /pages/builds`。这一步失败也不影响数据（`continue-on-error`），最多你手动去 Settings → Pages 点一次 Save。

---

## 第三部分：想在云端有个终端（可选）

仓库页面按键盘 `.`（一个点）会打开网页版 VS Code（github.dev），但那只能改文件、不能跑命令。

要能跑命令，用 **Codespaces**：仓库 → Code → Codespaces → Create codespace on main。等 1 分钟，你会得到一个浏览器里的完整 Linux，终端里可以：

```bash
python scripts/build.py check
python scripts/build.py serve --port 8000
```

免费额度：个人账号每月 120 核时 + 15 GB 存储，够用。用完记得在 Codespaces 页面 Stop，不然会一直计费。

---

## GitHub 上特有的坑

| 现象 | 原因 | 处理 |
|---|---|---|
| 网站 404 | `index.html` 不在仓库根目录 | 把文件移到根，Settings → Pages 重新选分支 |
| Pages 设置里选不到分支 | 仓库还是空的，没提交过任何文件 | 先提交一次 |
| 网站能开但没题目 | `data/bundle.js` 没生成 | Actions 里跑一次「校验学习数据」，或本地 `build.py index` 后上传 |
| Actions 标签页空白 | `.github/workflows/` 没上传成功 | 用 GitHub Desktop 推一次，或网页新建该文件 |
| Actions 报 `Resource not accessible by integration` | 权限不足 | 确认 `add-day.yml` 里 `permissions: contents: write` 没被删 |
| 提交到 `inbox/` 后什么都没发生 | 文件名不是 `.tsv` 结尾，或在工作流之外的分支 | 确认是 `main` 分支、后缀 `.tsv` |
| 导入后日期不对 | 文件名没带 `YYYY-MM-DD` | 改成 `2026-11-03.tsv`，或手动 Run workflow 填 date |
| 私有仓库看不到 Pages | 免费账号不支持私有仓库 Pages | 改公开，或本地用 |

---

## 一句话总结

**Pages 负责"能打开"，Actions 负责"能更新"，你只负责往 `inbox/` 扔一个 TSV。**
