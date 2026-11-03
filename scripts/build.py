#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""jlpt-drill 数据工具（只用标准库）

用法：
  python scripts/build.py serve                  # 本地预览 http://localhost:8000
  python scripts/build.py import day.tsv         # 把当天 TSV 导入 data/days/<今天>.json
  python scripts/build.py import day.tsv --date 2026-11-03 --title "N2 第 3 天"
  python scripts/build.py index                  # 重新生成 data/index.json
  python scripts/build.py check                  # 校验数据（CI 用），有问题返回 1
"""

import argparse
import datetime
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
DAYS_DIR = ROOT / "data" / "days"
INDEX = ROOT / "data" / "index.json"

COLS = ["type", "jp", "reading", "pos", "cn", "alt", "example", "exampleCn", "tags"]
ALT_SEP = "|"
TAG_SEP = "|"


def die(msg: str) -> int:
    print(f"[x] {msg}")
    return 1


def ok(msg: str) -> None:
    print(f"[ok] {msg}")


def read_json(p: pathlib.Path):
    return json.loads(p.read_text(encoding="utf-8"))


def write_json(p: pathlib.Path, obj) -> None:
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(obj, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def day_files():
    return sorted(DAYS_DIR.glob("*.json"))


# ---------------------------------------------------------------- index
def cmd_index(quiet: bool = False) -> int:
    days = []
    bundle = []
    for f in day_files():
        try:
            d = read_json(f)
        except json.JSONDecodeError as e:
            return die(f"{f.name} 不是合法 JSON：{e}")
        items = d.get("items", [])
        date = d.get("date") or f.stem
        days.append({
            "date": date,
            "title": d.get("title", ""),
            "words": sum(1 for i in items if i.get("type") == "word"),
            "grammar": sum(1 for i in items if i.get("type") == "grammar"),
        })
        bundle.append({"date": date, "title": d.get("title", ""), "items": items})

    days.sort(key=lambda x: x["date"], reverse=True)
    bundle.sort(key=lambda x: x["date"], reverse=True)

    write_json(INDEX, {"generated": datetime.date.today().isoformat(), "days": days})
    write_bundle(bundle)

    if not quiet:
        total = sum(d["words"] + d["grammar"] for d in days)
        ok(f"data/index.json + data/bundle.js 已更新：{len(days)} 天 / {total} 条")
    return 0


def write_bundle(bundle) -> None:
    """产出一个可直接被 <script> 载入的数据包。

    有了它，双击 index.html（file:// 协议）也能正常出题，
    因为脚本标签不受 fetch 的同源限制。
    """
    payload = {"generated": datetime.date.today().isoformat(), "days": bundle}
    text = "window.__JLPT_DATA=" + json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + ";\n"
    (ROOT / "data" / "bundle.js").write_text(text, encoding="utf-8")


# ---------------------------------------------------------------- import
def detect_delimiter(lines) -> str:
    """判断这份"TSV"到底用什么分隔。

    GitHub 网页编辑器、聊天窗口、Excel 都会偷偷把 Tab 换成分隔符，
    所以这里退让一步：能认就认，别让人卡在格式上。
    """
    body = [l for l in lines if l.strip()]
    tabs = sum(1 for l in body if "\t" in l)
    commas = sum(1 for l in body if "," in l)
    if tabs >= max(1, int(len(body) * 0.6)):
        return "\t"
    if commas >= max(1, int(len(body) * 0.6)):
        return ","
    return " "


def split_cells(line: str, delim: str = "\t"):
    if delim == " ":
        # 先用「两个以上空格」切，切开不够再用单空格
        cells = [c for c in re.split(r"\s{2,}", line.strip()) if c != ""]
        if len(cells) < 4:
            cells = line.split()
        return [c.strip() for c in cells]
    return [c.strip() for c in line.split(delim)]


def cmd_import(path: str, date, title: str) -> int:
    p = pathlib.Path(path)
    if not p.is_absolute():
        p = (pathlib.Path.cwd() / p).resolve()
    if not p.exists():
        return die(f"找不到文件：{p}")

    raw = p.read_text(encoding="utf-8-sig").replace("\r\n", "\n")
    lines = [l for l in raw.split("\n") if l.strip() and not l.lstrip().startswith("#")]
    if not lines:
        return die("文件是空的")

    delim = detect_delimiter(lines)
    if delim != "\t":
        hint = "逗号" if delim == "," else "空格"
        print(f"[!] 没检测到 Tab，已按{hint}解析（多半是被编辑器换掉了，能用但建议确认一下示例句有没有串列）")

    rows = [split_cells(l, delim) for l in lines]
    head = [h.lower() for h in rows[0]]
    if head[0] in ("type", "类型", "word") and "jp" in head:
        rows = rows[1:]
    else:
        head = COLS

    col = {name: (head.index(name.lower()) if name.lower() in head else -1) for name in COLS}
    if col["jp"] < 0 or col["cn"] < 0:
        return die("表头里必须有 jp 和 cn 两列")

    date = date or datetime.date.today().isoformat()
    try:
        datetime.date.fromisoformat(date)
    except ValueError:
        return die(f"日期格式应为 YYYY-MM-DD，收到 {date}")

    stamp = date.replace("-", "")
    items, bad = [], []
    for n, r in enumerate(rows, start=1):
        def g(k):
            i = col[k]
            return r[i] if 0 <= i < len(r) else ""

        jp, cn = g("jp"), g("cn")
        if not jp or not cn:
            bad.append(n)
            continue
        kind = "grammar" if g("type").lower() in ("grammar", "语法", "文法") else "word"
        items.append({
            "id": f"{'g' if kind == 'grammar' else 'w'}-{stamp}-{len(items) + 1:02d}",
            "type": kind,
            "jp": jp,
            "reading": g("reading"),
            "pos": g("pos"),
            "cn": cn,
            "alt": [s.strip() for s in g("alt").split(ALT_SEP) if s.strip()],
            "example": g("example"),
            "exampleCn": g("exampleCn"),
            "tags": [s.strip() for s in g("tags").split(TAG_SEP) if s.strip()],
        })

    if not items:
        return die("没有解析出有效条目，检查列是否对齐（必须是 Tab 分隔）")

    out = DAYS_DIR / f"{date}.json"
    write_json(out, {"date": date, "title": title or "每日词句", "items": items})
    cmd_index(quiet=True)

    w = sum(1 for i in items if i["type"] == "word")
    g_ = len(items) - w
    ok(f"{out.relative_to(ROOT)}：{w} 个单词 + {g_} 个语法")
    if bad:
        print(f"[!] 第 {', '.join(map(str, bad))} 行缺少 jp 或 cn，已跳过")
    return 0


# ---------------------------------------------------------------- check
def cmd_check() -> int:
    problems = []
    seen_global = set()
    stats = {}

    for f in day_files():
        try:
            d = read_json(f)
        except json.JSONDecodeError as e:
            problems.append(f"{f.name}: JSON 解析失败 {e}")
            continue
        if not d.get("date"):
            problems.append(f"{f.name}: 缺少 date")
        if d.get("date") and d["date"] != f.stem:
            problems.append(f"{f.name}: date 字段({d['date']})与文件名不一致")
        items = d.get("items")
        if not isinstance(items, list) or not items:
            problems.append(f"{f.name}: items 为空")
            continue
        stats[f.stem] = len(items)
        for i, it in enumerate(items, start=1):
            tag = f"{f.name} 第 {i} 条"
            if it.get("type") not in ("word", "grammar"):
                problems.append(f"{tag}: type 只能是 word / grammar")
            for k in ("id", "jp", "cn"):
                if not str(it.get(k, "")).strip():
                    problems.append(f"{tag}: 缺少 {k}")
            if it.get("id") in seen_global:
                problems.append(f"{tag}: id 重复 {it.get('id')}")
            seen_global.add(it.get("id"))
    if problems:
        for p in problems:
            print(f"[x] {p}")
        print(f"\n共 {len(problems)} 处问题")
        return 1

    before = INDEX.read_text(encoding="utf-8") if INDEX.exists() else ""
    cmd_index(quiet=True)
    after = INDEX.read_text(encoding="utf-8")
    if before and before != after:
        print("[!] data/index.json 已过期，已自动重建，记得一起提交")

    total = sum(stats.values())
    ok(f"数据校验通过：{len(stats)} 天 / {total} 条")
    return 0


# ---------------------------------------------------------------- serve
def cmd_serve(port: int) -> int:
    import http.server
    import socketserver

    class Handler(http.server.SimpleHTTPRequestHandler):
        def __init__(self, *a, **kw):
            super().__init__(*a, directory=str(ROOT), **kw)

        def log_message(self, fmt, *args):
            pass

    class Server(socketserver.ThreadingTCPServer):
        allow_reuse_address = True
        daemon_threads = True

        def handle_error(self, request, client_address):
            # 浏览器提前断开不算错误，别刷屏
            exc = sys.exc_info()[1]
            if isinstance(exc, (ConnectionResetError, ConnectionAbortedError, BrokenPipeError)):
                return
            super().handle_error(request, client_address)

    with Server(("127.0.0.1", port), Handler) as httpd:
        print(f"[ok] http://localhost:{port}  (Ctrl+C 停止)")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n[ok] 已停止")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description="jlpt-drill 数据工具")
    sub = ap.add_subparsers(dest="cmd", required=True)

    sub.add_parser("index", help="重建 data/index.json")
    sub.add_parser("check", help="校验数据格式")

    p_imp = sub.add_parser("import", help="把 TSV 导入成一天的 JSON")
    p_imp.add_argument("path")
    p_imp.add_argument("--date", default=None)
    p_imp.add_argument("--title", default="")

    p_srv = sub.add_parser("serve", help="本地预览")
    p_srv.add_argument("--port", type=int, default=8000)

    a = ap.parse_args()
    if a.cmd == "index":
        return cmd_index()
    if a.cmd == "check":
        return cmd_check()
    if a.cmd == "import":
        return cmd_import(a.path, a.date, a.title)
    if a.cmd == "serve":
        return cmd_serve(a.port)
    return 1


if __name__ == "__main__":
    sys.exit(main())
