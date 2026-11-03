# 操作流程

从零到能在手机上刷题，一共两个阶段：**一次性搭建**（约 10 分钟）和**每天循环**（约 30 秒）。

```
建仓库 → 推送 → 开 Pages → 加主屏        ← 只做一次
我发 TSV → 导入 → push → 做题            ← 每天
```

> 本文是**本地命令行版**。如果你不想在自己电脑上装任何东西、想全程用浏览器完成，看 **[GITHUB_RUN.md](GITHUB_RUN.md)** —— 那边用 GitHub Actions 代替本地 Python，手机上也能发布新题。



---

## 0. 前置检查（30 秒）

打开 Git Bash，逐条跑：

```bash
git --version
python --version
```

**本机现状**：`git 2.55.0` ✅　`python 3.13.14` ✅　`git 身份：未配置` ❌

只要两条版本号都出来了，就继续。Python 不是必须的（有零命令行路线，见「快速通道」），但配了省事。

---

## 快速通道：不碰命令行，双击就行

最适合先试试手感，或者暂时不想公开仓库。

1. 在文件管理器里进入 `jlpt-drill` 文件夹
2. **双击 `index.html`**
3. 应该立刻看到日期胶囊（`11/2 月`、`11/1 日`、`10/31 土`）和「开始测验（选择题）」
4. 想临时加练：点 **「粘贴导入」**，把我发的 TSV 整段贴进去

**为什么双击能用**：构建脚本会把所有题目打包进 `data/bundle.js`，页面用 `<script>` 载入，不受 `file://` 的 fetch 限制。代价是——**改了数据要重新生成一次** `bundle.js`（`import` 命令会自动做）。

数据存在这个浏览器里，换设备看不到。想长久用、想在手机上看，走下面的正式通道。

---

## 正式通道 A：一次性搭建

### A1. 进入项目目录

```bash
cd "C:/Users/盛奕蓉/WorkBuddy/2026-11-02-18-36-58/jlpt-drill"
```

> 路径里有中文没问题，Git 能处理。但**必须用引号**包住。

### A2. 配置 git 身份（必做）

**不配这一步，后面 commit 一定失败。**

```bash
git config --global user.name "你的名字"
git config --global user.email "你的邮箱@example.com"
```

验证：

```bash
git config --global user.name
```

能回显刚才的名字就成了。邮箱建议用注册 GitHub 的那个，commit 记录才会归到你名下。

### A3. 本地验收

最简单：直接双击 `index.html`（见快速通道）。

想跑本地服务器（可选，改了数据不想每次都重新打包时更方便）：

```bash
python scripts/build.py serve
```

看到 `[ok] http://localhost:8000` 就打开浏览器访问它。

**验收清单**（三项都对才往下走）：

- 顶部显示「今日のJLPT」，右上角有「连续 0」
- 日期条上有 3 个胶囊：`11/2 月`、`11/1 日`、`10/31 土`，最左边是深色选中态
- 中间卡片写着「10 单词 / 3 语法 / 正确率 —」，下面有「开始测验（选择题）」

点「开始测验」，出现一个大号日语词（可能不是同一个词，题目是随机打乱的）和四个选项 → 随便点一个 → 有对错反馈和例句 → **说明全链路通了**。

按 `Ctrl+C` 停掉服务器。

### A4. 建 GitHub 空仓库

浏览器打开 <https://github.com/new>

- Repository name：`jlpt-drill`
- 可见性：**Public**
- 下面的 "Add a README / .gitignore / license" **全部不要勾**
- 点 Create repository

> **为什么必须 Public**：免费账号的 GitHub Pages 只能从公开仓库发布。不想公开的话有两个选择——仓库设 Private 且只在本地用 `serve`（A3 那套），或者升级 GitHub Pro。

### A5. 提交并推送

逐行执行，把 `<用户名>` 换成你的 GitHub 用户名：

```bash
git init
git add -A
git commit -m "chore: 初始化 jlpt-drill"
git branch -M main
git remote add origin https://github.com/<用户名>/jlpt-drill.git
git push -u origin main
```

**成功标志**：输出里有 `main -> main`，刷新 GitHub 页面能看到十来个文件。

**首次推送会弹浏览器要求授权**。GitHub 已停用密码登录，如果命令行窗口提示输入密码，那是要 **Personal Access Token**：GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token，勾 `repo` 权限，复制生成的串当密码粘进去。

### A6. 打开 Pages

1. 仓库页 → **Settings**（顶部菜单）
2. 左侧栏 → **Pages**
3. Source 选 **Deploy from a branch**
4. Branch 选 **main**，右边目录选 **/ (root)**
5. 点 **Save**

等 1–2 分钟，刷新这个页面，顶部会出现：

```
Your site is live at https://<用户名>.github.io/jlpt-drill/
```

打开它，应该和 A3 看到的完全一样。**打不开或 404 先别改代码**，等满 2 分钟再看。

### A7. 添加到手机主屏

- **iPhone（Safari）**：打开链接 → 底部「分享」→ 往下找「添加到主屏幕」
- **Android（Chrome）**：打开链接 → 右上角「⋮」→「添加到主屏幕」

加完从桌面图标进入，是全屏无地址栏的，跟 App 一样。

**建议把书签存成 `.../jlpt-drill/?start=1`**，打开直接进当天测验，跳过封面。

---

## 正式通道 B：每天循环（30 秒）

### B1. 拿到当天的 TSV

我每天会发一段这样的内容（Tab 分隔，9 列）：

```
type	jp	reading	pos	cn	alt	example	exampleCn	tags
word	曖昧	あいまい	ナ形	暧昧；含糊	模糊|含糊不清	彼の返事は曖昧だ。	他的回答很含糊。	N2
```

### B2. 存成文件

在 `jlpt-drill/scripts/` 下新建 `2026-11-03.tsv`，把内容原样粘进去保存。

> **必须保留 Tab 制表符**。不要用 Excel 另存，它会把 Tab 换成逗号。

### B3. 导入

```bash
cd "C:/Users/盛奕蓉/WorkBuddy/2026-11-02-18-36-58/jlpt-drill"
python scripts/build.py import scripts/2026-11-03.tsv
```

**成功标志**：

```
[ok] data\days\2026-11-03.json：10 个单词 + 3 个语法
```

它会自动编号 ID 并重建 `data/index.json`。

### B4. 推送

```bash
git add -A
git commit -m "feat: 11/03 的词句"
git push
```

手机刷新页面，日期条最左边多出 `11/3`，选中它就能测。

> 想跳过 B2–B4：直接在网页点「粘贴导入」，贴 TSV 就能测。适合临时加练，数据只在当前设备。

---

## 故障对照表

| 现象                                   | 原因                     | 处理                                    |
| ------------------------------------ | ---------------------- | ------------------------------------- |
| 双击打开没有题目                    | `data/bundle.js` 缺失或过期     | 跑 `python scripts/build.py index` 后刷新         |
| `commit` 报 `Author identity unknown` | 没配 git 身份              | 回到 **A2**                             |
| 导入报「没有解析出有效条目」                       | 每行字段数不够或分隔符混乱          | 已兼容 Tab / 逗号 / 空格；仍失败就确认每行 9 段     |
| 导入报「缺少 jp 或 cn 列」                    | 表头列名被改动                  | 保留首行表头，或整行删掉（无表头按固定列序解析）               |
| `push` 报 `Authentication failed`     | GitHub 停用了密码           | 改用 Personal Access Token（见 A5）        |
| Pages 链接 404                         | 通常只是没编译完               | 等 2 分钟；再确认分支 main、目录 `/ (root)`       |
| 页面样式正常但点「开始测验」没反应                    | 当天 JSON 的 `items` 是空数组 | 跑 `python scripts/build.py check` 看报错 |
| 手机上打不开                               | 存的是本地 `localhost` 地址   | 必须用 `https://用户名.github.io/...`       |
| 换个手机进度没了                             | 进度存在浏览器 localStorage   | 正常设计；需要同步得接云端（见 README 扩展）            |

---

## 三条命令的日常备忘

```bash
# 本地看效果
python scripts/build.py serve

# 导入当天内容
python scripts/build.py import scripts/日期.tsv

# 检查数据有没有写错（推送前跑一遍最稳）
python scripts/build.py check
```
