# 纯操作版（用户名：ikiyo00）

```
仓库：https://github.com/ikiyo00/jlpt-drill
网站：https://ikiyo00.github.io/jlpt-drill/
```

---

## A. 一次性搭建（约 10 分钟，只做一次）

### A1. 建仓库

打开 `https://github.com/new`

| 填什么 | 值 |
|---|---|
| Repository name | `jlpt-drill` |
| Public / Private | **Public** |
| Add a README file | 不勾 |
| Add .gitignore | 不勾 |
| Choose a license | 不勾 |

点 **Create repository**。

### A2. 上传文件（二选一）

**方式 1（推荐，装一次，最省事）**

1. 下载安装：https://desktop.github.com/
2. 打开 → **File → Add local repository**
3. 选 `C:\Users\盛奕蓉\WorkBuddy\2026-11-02-18-36-58\jlpt-drill`
4. 右上角 **Publish repository**
5. 名字 `jlpt-drill`，**取消勾** `Keep this code private`，点 **Publish repository**

→ 跳到 A3。

**方式 2（纯网页，不装软件）**

1. 仓库页 → 点 `uploading an existing file`
2. 打开 `jlpt-drill` 文件夹，**全选里面的内容**（不是文件夹本身），拖进浏览器
3. 点 **Commit changes**
4. 补隐藏文件：仓库页 → **Add file → Create new file**，文件名填 `.nojekyll`，内容留空，Commit
5. 同样方式建 `.github/workflows/add-day.yml`，把项目里同名文件的内容整段粘贴进去，Commit

### A3. 开 Pages

打开 `https://github.com/ikiyo00/jlpt-drill/settings/pages`

1. Source 选 **Deploy from a branch**
2. Branch 选 `main`，右边选 `/ (root)`
3. 点 **Save**
4. 等 1–2 分钟，刷新，顶部出现 `Your site is live at https://ikiyo00.github.io/jlpt-drill/`

### A4. 验收

打开 `https://ikiyo00.github.io/jlpt-drill/`

看到日期条（11/2、11/1、10/31）+ 「开始测验」→ 算通了。

### A5. 加到手机主屏

- iPhone：Safari 打开 → 分享 → **添加到主屏幕**
- Android：Chrome 打开 → ⋮ → **添加到主屏幕**

手机书签填这个（点开直接进当天测验）：

```
https://ikiyo00.github.io/jlpt-drill/?start=1
```

---

## B. 每天加题（30 秒，手机也能做）

1. 打开 `https://github.com/ikiyo00/jlpt-drill`
2. **Add file → Create new file**
3. 文件名填 `inbox/2026-11-03.tsv`（日期按当天改），把 TSV 粘进去 → **Commit changes**

看结果：打开 `https://github.com/ikiyo00/jlpt-drill/actions`

约 20 秒后出现一条绿色的「导入每日题目」。

然后手机刷新网页 → 日期条最左边多出当天。

### 想手动重跑

Actions 页 → 左侧 **导入每日题目** → 右侧 **Run workflow** → 填 `inbox/2026-11-03.tsv` → 绿色按钮。

---

## C. 常用链接

| 用途 | 链接 |
|---|---|
| 刷题（手机加主屏用这个） | `https://ikiyo00.github.io/jlpt-drill/?start=1` |
| 仓库首页 | https://github.com/ikiyo00/jlpt-drill |
| 看自动化有没有跑成功 | https://github.com/ikiyo00/jlpt-drill/actions |
| 上传新题 | https://github.com/ikiyo00/jlpt-drill/upload |
| Pages 设置 | https://github.com/ikiyo00/jlpt-drill/settings/pages |

---

## D. 出问题，照做

| 现象 | 动作 |
|---|---|
| 网站 404 | Settings → Pages → 分支重新选 `main` + `/ (root)` → Save，等 2 分钟 |
| 网站能开但没题目 | Actions 页 → 跑一次「校验学习数据」 |
| Actions 页看不到任何工作流 | 说明 `.github/` 没传上去 → 改用 A2 方式 1 |
| 提交 inbox 后没反应 | 确认分支是 `main`、文件名以 `.tsv` 结尾、在 `inbox/` 目录里 |
| 导入后日期不对 | 文件名改成 `2026-11-03.tsv` 这种格式，或手动 Run workflow 填 date |
| 粘贴后题目串列 | 能传原文件就别手打；脚本现在也认逗号和空格，但示例句含空格时会错 |
| 想改仓库名字 | Settings → General → Repository name（改完网址也要跟着变） |
