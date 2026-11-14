#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""周末复习题库生成器（只用标准库）

从历史 data/days/*.json 里抽取「之前推送过」的词条，生成：
  - inbox/<date>.tsv      9 列 TSV（可手动上传到 GitHub 的 inbox/ 触发自动构建）
  - 复习_<date>.md        人读复习清单（发到对话里）
并调用 build.py import 直接把当天网站题库变成复习题。

设计要点：
  - 只从「新题日」取历史；title 含「复习」的日子会被排除，避免复习题套娃。
  - 周五/周六/周日三天共用同一个洗牌种子（本周周五日期），再各取 1/3，
    保证同一周末三天题目不重复、且尽量覆盖全部历史。每周换一次顺序。
  - 按 jp 去重，优先保留带假名注音（[]）的版本。
  - 复习日不产生任何新词条，因此不需要更新 N1_进度.md。

用法（在仓库根目录运行）：
  python3 scripts/review.py
  python3 scripts/review.py --date 2026-11-14 --words 100 --grammar 50
  python3 scripts/review.py --date 2026-11-14 --no-import   # 只产出 TSV 和 md
"""

import argparse
import datetime
import json
import math
import pathlib
import random
import re
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
DAYS_DIR = ROOT / "data" / "days"
INBOX = ROOT / "inbox"
BUILD = ROOT / "scripts" / "build.py"

COLS = ["type", "jp", "reading", "pos", "cn", "alt", "example", "exampleCn", "tags"]
ALT_SEP = "|"
TAG_SEP = "|"
KANJI = re.compile(r"[\u4e00-\u9fff\u3400-\u4dbf々〆ヶ]")


def clean(s):
    """TSV 单元格里不能出现 Tab / 换行。"""
    return str(s or "").replace("\t", " ").replace("\r", " ").replace("\n", " ").strip()


def as_list(v):
    if isinstance(v, list):
        return [clean(x) for x in v if x]
    if isinstance(v, str):
        return [clean(x) for x in v.split(ALT_SEP) if x.strip()]
    return []


def collect_history(cutoff):
    """收集 cutoff（含）之前的历史新题，按 jp 去重，返回 (words, grammar)。

    cutoff 固定为「本周四」，这样周五/六/日三天共享同一个历史池，
    配合同一个洗牌种子即可保证三天的复习题互不重复。
    """
    words, grammar = {}, {}
    for p in sorted(DAYS_DIR.glob("*.json")):
        try:
            d = json.loads(p.read_text(encoding="utf-8"))
        except Exception:
            continue
        dd = d.get("date") or p.stem
        if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", dd):
            continue
        if dd > cutoff:                      # 只用截止日及之前的新题
            continue
        if "复习" in (d.get("title") or ""):  # 复习题不作为历史源
            continue
        for it in d.get("items", []):
            jp, cn = clean(it.get("jp")), clean(it.get("cn"))
            if not jp or not cn:
                continue
            kind = "grammar" if it.get("type") == "grammar" else "word"
            bucket = grammar if kind == "grammar" else words
            old = bucket.get(jp)
            if old is None:
                bucket[jp] = (dd, it)
            else:
                # 优先保留带假名注音的版本
                old_score = (old[1].get("jp", "").count("[") + old[1].get("example", "").count("["))
                new_score = it.get("jp", "").count("[") + it.get("example", "").count("[")
                if new_score > old_score:
                    bucket[jp] = (dd, it)
    w = sorted(words.values(), key=lambda x: x[0])
    g = sorted(grammar.values(), key=lambda x: x[0])
    return w, g


def week_slot(date):
    """返回 (本周五日期, 0/1/2 槽位)。非周五~周日按 0 处理。"""
    d = datetime.date.fromisoformat(date)
    wd = d.weekday()                       # Mon=0 ... Sun=6
    friday = d - datetime.timedelta(days=wd - 4)
    slot = wd - 4 if 4 <= wd <= 6 else 0
    return friday.isoformat(), max(0, min(2, slot))


def pick(pool, n, rng, slot):
    """洗牌后按三等分取对应槽位；不足 n 时从整池补足。"""
    items = [it for _, it in pool]
    rng.shuffle(items)
    size = max(1, math.ceil(len(items) / 3))
    part = items[slot * size:(slot + 1) * size]
    out = list(part[:n])
    if len(out) < n:
        chosen = {x.get("jp") for x in out}
        for it in items:
            if len(out) >= n:
                break
            if it.get("jp") not in chosen:
                out.append(it)
                chosen.add(it.get("jp"))
    return out


def to_row(it):
    return [
        "grammar" if it.get("type") == "grammar" else "word",
        clean(it.get("jp")),
        clean(it.get("reading")) if it.get("type") != "grammar" else "",
        clean(it.get("pos")),
        clean(it.get("cn")),
        ALT_SEP.join(as_list(it.get("alt"))),
        clean(it.get("example")),
        clean(it.get("exampleCn")),
        TAG_SEP.join(as_list(it.get("tags"))),
    ]


def write_tsv(path, items):
    lines = ["\t".join(COLS)]
    lines += ["\t".join(to_row(it)) for it in items]
    path.write_text("\n".join(lines) + "\n", encoding="utf-8", newline="\n")


def write_md(path, date, words, grammar, slot):
    wd = datetime.date.fromisoformat(date).weekday()
    names = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"]
    part = ["周五", "周六", "周日"][slot]
    out = [
        f"# 周末复习 · {date}（{names[wd]}）",
        "",
        f"本轮共 **{len(words)} 个单词 + {len(grammar)} 条语法**，全部来自之前推送过的题目。",
        f"今天是 {part} 场，与同周末另外两天不重复；例句和小测在网站上。",
        "",
        f"## 一、单词（{len(words)}）",
        "",
    ]
    for i, it in enumerate(words, 1):
        jp = clean(it.get("jp"))
        rd = clean(it.get("reading"))
        pos = clean(it.get("pos"))
        cn = clean(it.get("cn"))
        out.append(f"{i}. {jp}｜{rd}｜{pos}｜{cn}")
    out += ["", f"## 二、语法（{len(grammar)}）", ""]
    for i, it in enumerate(grammar, 1):
        jp = clean(it.get("jp"))
        pos = clean(it.get("pos"))
        cn = clean(it.get("cn"))
        out.append(f"{i}. {jp}｜{pos or '—'}｜{cn}")
    out += ["", "---", "", "提示：网站今天的小测也是这一批复习题，直接去刷即可。", ""]
    path.write_text("\n".join(out), encoding="utf-8", newline="\n")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--date", default=datetime.date.today().isoformat())
    ap.add_argument("--words", type=int, default=100)
    ap.add_argument("--grammar", type=int, default=50)
    ap.add_argument("--no-import", action="store_true", help="只生成 TSV / md，不改动 data/")
    a = ap.parse_args()

    try:
        datetime.date.fromisoformat(a.date)
    except ValueError:
        print(f"[x] 日期格式应为 YYYY-MM-DD：{a.date}")
        return 1

    seed, slot = week_slot(a.date)
    cutoff = (datetime.date.fromisoformat(seed) - datetime.timedelta(days=1)).isoformat()
    wpool, gpool = collect_history(cutoff)
    print(f"[i] 历史池（截至 {cutoff}）：{len(wpool)} 个不同单词 / {len(gpool)} 条不同语法（已排除复习日）")
    if not wpool or not gpool:
        print("[x] 历史题库为空，无法生成复习题")
        return 1

    rng = random.Random(seed)
    words = pick(wpool, a.words, rng, slot)
    rng2 = random.Random(seed + "-g")
    grammar = pick(gpool, a.grammar, rng2, slot)

    INBOX.mkdir(parents=True, exist_ok=True)
    tsv = INBOX / f"{a.date}.tsv"
    md = ROOT / f"复习_{a.date}.md"
    write_tsv(tsv, words + grammar)
    write_md(md, a.date, words, grammar, slot)
    print(f"[ok] {tsv.relative_to(ROOT)}：{len(words)} 词 + {len(grammar)} 语法")
    print(f"[ok] {md.relative_to(ROOT)}：人读复习清单")

    if a.no_import:
        return 0

    title = f"周末复习 {len(words)}+{len(grammar)}"
    r = subprocess.run(
        [sys.executable, str(BUILD), "import", str(tsv), "--date", a.date, "--title", title],
        cwd=str(ROOT),
    )
    if r.returncode != 0:
        print("[x] build.py import 失败")
        return r.returncode
    r = subprocess.run([sys.executable, str(BUILD), "check"], cwd=str(ROOT))
    return r.returncode


if __name__ == "__main__":
    sys.exit(main())
