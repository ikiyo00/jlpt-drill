/* 今日のJLPT — 每日单词 / 语法 中日对照自测 */
(() => {
  "use strict";

  const K_PROGRESS = "jlpt-drill:progress:v1";
  const K_SESSIONS = "jlpt-drill:sessions:v1";
  const K_PREFS = "jlpt-drill:prefs:v1";
  const K_LOCAL = "jlpt-drill:localdays:v1";
  const K_SW = "jlpt-drill:sw:v1";

  const FALLBACK = {
    word: [
      "陡峭的；险峻的", "宽松的；宽大的", "顽固的；固执的", "朴素的；不加修饰的",
      "荒唐的；离谱的", "微妙的；细微的", "慌张的；手忙脚乱的", "慎重的；小心的",
      "顽强的；坚韧的", "充足的；富裕的", "粗糙的；粗鲁的", "灵活的；机敏的",
      "清澈的；透明的", "寂寞的；冷清的", "意外的；出乎意料的", "焦急的；急躁的"
    ],
    grammar: [
      "只要…就…", "即使…也…", "不仅…而且…", "正因为…才…", "虽然…但是…",
      "如果没有…就…", "在…期间", "代替…；反过来…", "趁着…", "刚一…就…"
    ]
  };

  const state = {
    manifest: [],
    localDays: {},
    bundleItems: null,
    days: [],
    day: null,
    items: [],
    queue: [],
    idx: 0,
    answers: [],
    current: null,
    phase: "start",
    mode: "choice",
    onlyWrong: false,
    startTs: 0,
    loadError: ""
  };

  /* ---------------- storage ---------------- */
  const readJSON = (k, fb) => {
    try {
      const v = JSON.parse(localStorage.getItem(k));
      return v == null ? fb : v;
    } catch (e) {
      return fb;
    }
  };
  const writeJSON = (k, v) => {
    try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { }
  };
  const progress = () => readJSON(K_PROGRESS, {});
  const sessions = () => readJSON(K_SESSIONS, []);

  /* ---------------- utils ---------------- */
  const esc = (s) => String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

  const pad = (n) => String(n).padStart(2, "0");
  const todayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };
  const shortDate = (s) => {
    const p = String(s).split("-");
    return p.length === 3 ? `${+p[1]}/${+p[2]}` : s;
  };
  const weekday = (s) => {
    const d = new Date(s + "T00:00:00");
    return isNaN(d) ? "" : "日月火水木金土"[d.getDay()];
  };

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  const norm = (s) => String(s == null ? "" : s)
    .toLowerCase()
    .replace(/[\s\u3000]/g, "")
    .replace(/[，。、；：！？（）()「」『』【】·…\-—~〜,.!?;:'"“”‘’/／]/g, "");

  function jaccard(a, b) {
    if (!a || !b) return 0;
    const A = new Set(a), B = new Set(b);
    let inter = 0;
    A.forEach((c) => { if (B.has(c)) inter++; });
    return inter / (A.size + B.size - inter);
  }

  /* 判分：答案、别名、包含关系、字面重合度、分句命中 */
  function judge(input, item) {
    const i = norm(input);
    if (!i) return false;
    const cands = [item.cn, ...(item.alt || [])].map(norm).filter(Boolean);
    for (const c of cands) {
      if (i === c) return true;
      if (i.length >= 2 && c.includes(i)) return true;
      if (c.length >= 2 && i.includes(c)) return true;
      if (jaccard(i, c) >= 0.6) return true;
    }
    const segs = String(item.cn || "").split(/[；;，,、（）()\/]/).map(norm).filter((s) => s.length >= 2);
    return segs.some((s) => i.length >= 2 && s.includes(i));
  }

  /* ---------------- data ---------------- */
  function registerSW() {
    // file:// 下注册不了 Service Worker，但那时本来就是纯本地、不需要网络
    if (!("serviceWorker" in navigator)) return;
    if (!/^https?:$/.test(location.protocol)) return;

    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").then((reg) => {
        if (!localStorage.getItem(K_SW)) {
          localStorage.setItem(K_SW, "1");
          if (reg.active) toast("已缓存到本地，之后断网也能刷题");
        }
      }).catch(() => {});
    });
  }

  function toast(text) {
    let el = document.getElementById("swToast");
    if (!el) {
      el = document.createElement("div");
      el.id = "swToast";
      el.className = "sw-toast";
      document.body.appendChild(el);
    }
    el.textContent = text;
    el.classList.add("show");
    setTimeout(() => el.classList.remove("show"), 3200);
  }

  async function boot() {
    registerSW();
    state.localDays = readJSON(K_LOCAL, {});
    const prefs = readJSON(K_PREFS, { mode: "choice" });
    state.mode = prefs.mode === "type" ? "type" : "choice";

    // 优先用 data/bundle.js 内嵌的数据：file:// 下也能跑，且省掉多次请求
    const bundle = window.__JLPT_DATA;
    if (bundle && Array.isArray(bundle.days) && bundle.days.length) {
      state.bundleItems = {};
      state.manifest = bundle.days.map((d) => {
        const items = d.items || [];
        state.bundleItems[d.date] = items;
        return {
          date: d.date,
          title: d.title || "",
          words: items.filter((x) => x.type === "word").length,
          grammar: items.filter((x) => x.type === "grammar").length
        };
      });
    } else {
      try {
        const res = await fetch("data/index.json", { cache: "no-store" });
        if (!res.ok) throw new Error("HTTP " + res.status);
        const m = await res.json();
        state.manifest = Array.isArray(m.days) ? m.days : [];
      } catch (e) {
        state.loadError = "读不到 data/index.json（本地直接双击打开会被浏览器拦截，请用本地服务器或 GitHub Pages 打开）。";
      }
    }

    buildDays();
    renderStreak();

    const list = state.days;
    if (!list.length) {
      state.phase = "start";
      render();
      return;
    }
    const t = todayStr();
    const pick = list.find((d) => d.date === t)
      || list.find((d) => d.date <= t)
      || list[0];
    await selectDay(pick.date);

    if (/[?&]start=1\b/.test(location.search)) startQuiz(false);
  }

  function buildDays() {
    const map = new Map();
    state.manifest.forEach((d) => {
      if (!d || !d.date) return;
      map.set(d.date, {
        date: d.date,
        title: d.title || "",
        words: d.words || 0,
        grammar: d.grammar || 0,
        local: false
      });
    });
    Object.keys(state.localDays).forEach((date) => {
      const items = state.localDays[date] || [];
      map.set(date, {
        date,
        title: "临时导入",
        words: items.filter((x) => x.type === "word").length,
        grammar: items.filter((x) => x.type === "grammar").length,
        local: true
      });
    });
    state.days = Array.from(map.values()).sort((a, b) => (a.date < b.date ? 1 : -1));
  }

  async function selectDay(date) {
    state.day = date;
    state.phase = "start";
    state.current = null;
    state.answers = [];
    state.idx = 0;

    if (state.localDays[date]) {
      state.items = state.localDays[date];
    } else if (state.bundleItems && state.bundleItems[date]) {
      state.items = state.bundleItems[date];
    } else {
      try {
        const res = await fetch(`data/days/${date}.json`, { cache: "no-store" });
        if (!res.ok) throw new Error("HTTP " + res.status);
        const d = await res.json();
        state.items = (d.items || []).map((it, i) => ({
          ...it,
          id: it.id || `${it.type === "grammar" ? "g" : "w"}-${date.replace(/-/g, "")}-${pad(i + 1)}`
        }));
      } catch (e) {
        state.items = [];
      }
    }
    renderDaynav();
    render();
  }

  /* ---------------- derived ---------------- */
  function dayProgress(date) {
    return progress()[date] || {};
  }
  function statsFor(items, date) {
    const p = dayProgress(date);
    let done = 0, ok = 0;
    items.forEach((it) => {
      const r = p[it.id];
      if (r) { done++; if (r.ok) ok++; }
    });
    return { done, ok, total: items.length };
  }
  function wrongItems(date) {
    const p = dayProgress(date);
    return state.items.filter((it) => p[it.id] && p[it.id].ok === false);
  }
  function renderStreak() {
    const set = new Set(sessions().map((s) => s.date));
    const d = new Date();
    let n = 0;
    // 今天还没练不算断，从昨天往前数
    if (!set.has(todayStr())) d.setDate(d.getDate() - 1);
    for (; ;) {
      const k = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      if (set.has(k)) { n++; d.setDate(d.getDate() - 1); }
      else break;
    }
    const el = document.getElementById("streakNum");
    if (el) el.textContent = String(n);
  }

  /* ---------------- render ---------------- */
  function renderDaynav() {
    const nav = document.getElementById("daynav");
    if (!nav) return;
    if (!state.days.length) { nav.innerHTML = ""; return; }
    nav.innerHTML = state.days.map((d) => {
      const cur = d.date === state.day ? "true" : "false";
      return `<button class="chip" data-act="day" data-date="${esc(d.date)}" aria-current="${cur}">
        ${esc(shortDate(d.date))} <span style="opacity:.6">${esc(weekday(d.date))}</span>${d.local ? '<span class="dot"></span>' : ""}
      </button>`;
    }).join("");
  }

  function render() {
    const main = document.getElementById("main");
    if (!main) return;
    if (state.phase === "quiz") main.innerHTML = viewQuiz();
    else if (state.phase === "done") main.innerHTML = viewResult();
    else main.innerHTML = viewStart();
    postRender();
  }

  function viewStart() {
    if (!state.days.length) {
      return `<div class="card"><div class="empty">
        <h2>还没有今天的数据</h2>
        <p>${state.loadError ? esc(state.loadError) : "把今天的 TSV 存成 data/days/日期.json，刷新页面即可。"}</p>
        <button class="btn primary" data-act="paste-open">粘贴今天的内容</button>
      </div></div>`;
    }

    const items = state.items;
    if (!items.length) {
      return `<div class="card"><div class="empty">
        <h2>这一天没有题目</h2>
        <p>数据文件可能是空的，或者格式不对。</p>
        <button class="btn ghost" data-act="paste-open">粘贴今天的内容</button>
      </div></div>`;
    }

    const s = statsFor(items, state.day);
    const wrong = wrongItems(state.day).length;
    const acc = s.done ? Math.round((s.ok / s.done) * 100) : 0;
    const w = items.filter((i) => i.type === "word").length;
    const g = items.filter((i) => i.type === "grammar").length;
    const modeLabel = state.mode === "choice" ? "选择题" : "输入题";

    return `<div class="card">
      <div class="meta-row">
        <h2 class="date-title">${esc(state.day)} <span style="color:var(--muted);font-weight:400">${esc(weekday(state.day))}曜</span></h2>
        <span class="typebadge ${wrong ? "grammar" : "word"}">${s.done ? "已完成 " + s.done + "/" + s.total : "未开始"}</span>
      </div>
      <p class="eyebrow" style="margin:0">Today's drill</p>

      <div class="counts">
        <div class="count"><b>${w}</b><span>单词</span></div>
        <div class="count"><b>${g}</b><span>语法</span></div>
        <div class="count"><b>${s.done ? acc + "%" : "—"}</b><span>正确率</span></div>
      </div>

      <div class="switch">
        <div>
          <span class="switch-lbl">出题方式</span>
          <span class="switch-sub">${state.mode === "choice" ? "四选一，快一点" : "自己写中文释义，更扎实"}</span>
        </div>
        <div class="seg" role="group">
          <button data-act="mode" data-mode="choice" aria-pressed="${state.mode === "choice"}">选择</button>
          <button data-act="mode" data-mode="type" aria-pressed="${state.mode === "type"}">输入</button>
        </div>
      </div>

      <div class="btn-row">
        <button class="btn primary wide" data-act="start">${s.done ? "再测一遍" : "开始测验"}（${modeLabel}）</button>
      </div>
      <div class="btn-row">
        <button class="btn ghost" data-act="only-wrong" ${wrong ? "" : "disabled"}>只练错题（${wrong}）</button>
        <button class="btn ghost" data-act="paste-open">粘贴导入</button>
      </div>
    </div>`;
  }

  /* 每个选项都带一个 source：正确项 source 是本题的日语词；
     干扰项若来自当天的其他词条，source 就是那个词条（jp+reading），
     否则是 null（纯通用干扰项，不在今日词表里）。 */
  function buildOptions(item) {
    const same = state.items
      .filter((x) => x.type === item.type && x.id !== item.id && x.cn && x.cn !== item.cn)
      .map((x) => ({ cn: x.cn, jp: x.jp, reading: x.reading, source: x }));
    // 按 cn 去重，避免同一中文释义出现两次
    const uniq = Array.from(new Set(same.map((o) => o.cn)))
      .map((cn) => same.find((o) => o.cn === cn));
    const extra = (FALLBACK[item.type] || FALLBACK.word)
      .filter((c) => c && c !== item.cn)
      .map((c) => ({ cn: c, jp: "", reading: "", source: null }));
    const pool = [...uniq, ...extra];
    const picked = shuffle(pool).slice(0, 3);
    while (picked.length < 3) picked.push({ cn: "—", jp: "", reading: "", source: null });
    const correct = { cn: item.cn, jp: item.jp, reading: item.reading, source: item };
    return shuffle([correct, ...picked]);
  }

  function viewQuiz() {
    const item = state.queue[state.idx];
    if (!item) return viewStart();
    const total = state.queue.length;
    const n = state.idx + 1;
    const pct = Math.round(((state.idx) / total) * 100);
    const ans = state.current;
    const isG = item.type === "grammar";

    const head = `<div class="quizbar">
        <span>${n} / ${total}</span>
        <span class="typebadge ${isG ? "grammar" : "word"}">${isG ? "语法" : "单词"}</span>
        <button class="linkish" data-act="exit">退出</button>
      </div>
      <div class="bar"><i style="width:${pct}%"></i></div>
      <p class="prompt">${state.mode === "choice" ? "选出正确的中文释义" : "写出中文释义"}</p>
      <h2 class="word jp">${esc(item.jp)}</h2>
      <p class="reading" data-act="reveal"><span class="rtext ${ans ? "" : "blur"}">${esc(item.reading || "")}</span>${ans ? "" : '<span class="rhint">读音</span>'}</p>
      <p class="posline">${esc(item.pos || "")}${item.tags && item.tags.length ? " · " + item.tags.map(esc).join(" / ") : ""}</p>`;

    let body = "";
    if (state.mode === "choice") {
      const opts = state.options || (state.options = buildOptions(item));
      body = opts.map((o, i) => {
        let cls = "opt";
        let pairing = "";
        if (ans) {
          if (o.cn === item.cn) cls += " correct";
          else if (o.cn === ans.value) cls += " wrong";
          else cls += " dim";
          // 不论对错，每个选项都亮出它对应的日语来源
          if (o.source && o.jp) {
            const isSelf = o.source === item;
            pairing = `<span class="opt-pair ${isSelf ? "self" : ""}">`
              + `<span class="opt-eq">＝</span>`
              + `<b class="opt-jp jp">${esc(o.source.jp)}</b>`
              + (o.source.reading ? `<span class="opt-rd">${esc(o.source.reading)}</span>` : "")
              + `</span>`;
          } else {
            pairing = `<span class="opt-pair muted"><span class="opt-eq">＝</span>通用干扰项（不在今日词表）</span>`;
          }
        }
        return `<button class="${cls}" data-act="choose" data-i="${i}" ${ans ? "disabled" : ""}>
          <span class="key">${"ABCD"[i]}</span>
          <span class="opt-main"><span class="opt-cn">${esc(o.cn)}</span>${pairing}</span>
        </button>`;
      }).join("");
    } else {
      body = `${ans
        ? `<div class="answer-input" style="border-bottom-color:${ans.ok ? "var(--ok)" : "var(--bad)"};font-size:19px">${esc(ans.value || "（未作答）")}</div>`
        : `<input class="answer-input" id="ansInput" type="text" autocomplete="off" autocapitalize="off"
             spellcheck="false" placeholder="中文释义，答关键词即可">`
        }`;
    }

    let feedback = "";
    if (ans) {
      // 选错了，且选中的是「其他词条的中文释义」时，把它对应的日语亮出来
      let distractor = "";
      if (!ans.ok && state.mode === "choice") {
        const chosen = (state.options || []).find((o) => o.cn === ans.value);
        if (chosen) {
          if (chosen.source && chosen.jp) {
            distractor = `<p class="distractor-info">
              <span class="di-label">你选的「${esc(chosen.cn)}」其实是：</span>
              <b class="di-jp jp">${esc(chosen.jp)}</b>${chosen.reading ? `<span class="di-rd">${esc(chosen.reading)}</span>` : ""}
            </p>`;
          } else {
            distractor = `<p class="distractor-info muted">
              <span class="di-label">你选的「${esc(chosen.cn)}」是干扰项，不在今天的词表里。</span>
            </p>`;
          }
        }
      }
      feedback = `<div class="feedback">
        <p class="verdict ${ans.ok ? "ok" : "no"}">
          <span class="ico">${ans.ok ? "✓" : "✕"}</span>${ans.ok ? "答对了" : (ans.skipped ? "看答案" : "再看一遍")}
        </p>
        <p class="def">${esc(item.cn)}</p>
        ${distractor}
        ${item.example ? `<div class="example">
          <p class="jp-s jp">${esc(item.example)}</p>
          <p class="cn-s">${esc(item.exampleCn || "")}</p>
        </div>` : ""}
        <div class="btn-row">
          <button class="btn primary wide" data-act="next">${n === total ? "查看结果" : "下一题"}</button>
        </div>
      </div>`;
    } else {
      feedback = state.mode === "type"
        ? `<div class="btn-row">
             <button class="btn ghost" data-act="skip">看答案</button>
             <button class="btn primary" data-act="submit-type">提交</button>
           </div>`
        : `<p class="kbd-hint">按 <kbd>1</kbd>–<kbd>4</kbd> 选择 · <kbd>Enter</kbd> 下一题</p>`;
    }

    return `<div class="card">${head}<div class="qbody">${body}</div>${feedback}</div>`;
  }

  function viewResult() {
    const total = state.answers.length;
    const ok = state.answers.filter((a) => a.ok).length;
    const acc = total ? Math.round((ok / total) * 100) : 0;
    const secs = Math.max(1, Math.round((Date.now() - state.startTs) / 1000));
    const wAll = state.answers.filter((a) => a.type === "word");
    const gAll = state.answers.filter((a) => a.type === "grammar");
    const wOk = wAll.filter((a) => a.ok).length;
    const gOk = gAll.filter((a) => a.ok).length;
    const wrong = state.answers.filter((a) => !a.ok);

    return `<div class="card">
      <p class="eyebrow" style="margin:0 0 8px">Result · ${esc(state.day)}</p>
      <div class="score-row">
        <div class="score-big">${acc}<small>%</small></div>
        <div class="score-side">
          答对 ${ok} / ${total} 题<br>
          用时 ${Math.floor(secs / 60) ? Math.floor(secs / 60) + " 分 " : ""}${secs % 60} 秒
        </div>
      </div>
      <div class="counts" style="margin-top:0">
        <div class="count"><b>${wOk}/${wAll.length}</b><span>单词</span></div>
        <div class="count"><b>${gOk}/${gAll.length}</b><span>语法</span></div>
        <div class="count"><b>${total - ok}</b><span>需重练</span></div>
      </div>

      ${wrong.length ? `<p class="eyebrow" style="margin:18px 0 0">错题</p>
        <ul class="wronglist">
          ${wrong.map((a) => `<li><span class="w-jp jp">${esc(a.jp)}</span><span class="w-cn">${esc(a.cn)}</span></li>`).join("")}
        </ul>` : `<p style="color:var(--muted);font-size:13px;margin:18px 0 0">全对，没有错题。</p>`}

      <div class="btn-row">
        ${wrong.length ? `<button class="btn primary" data-act="retry-wrong">重练错题</button>` : ""}
        <button class="btn ${wrong.length ? "ghost" : "primary"}" data-act="start">再来一轮</button>
      </div>
      <div class="btn-row">
        <button class="linkish" data-act="export">导出这次记录</button>
        <button class="linkish" data-act="exit">回到今天</button>
      </div>
    </div>`;
  }

  function postRender() {
    const input = document.getElementById("ansInput");
    if (input) {
      input.focus();
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") { e.preventDefault(); submitTyped(); }
      });
    }
  }

  /* ---------------- flow ---------------- */
  function startQuiz(onlyWrong) {
    let list = state.items.slice();
    if (onlyWrong) list = wrongItems(state.day);
    if (!list.length) return;
    state.queue = shuffle(list);
    state.idx = 0;
    state.answers = [];
    state.current = null;
    state.options = null;
    state.onlyWrong = !!onlyWrong;
    state.startTs = Date.now();
    state.phase = "quiz";
    render();
  }

  function answer(value, ok, skipped) {
    const item = state.queue[state.idx];
    state.current = { value, ok: !!ok, skipped: !!skipped };
    state.answers.push({
      id: item.id, type: item.type, jp: item.jp, cn: item.cn,
      ok: !!ok, value: value || ""
    });
    const all = progress();
    all[state.day] = all[state.day] || {};
    all[state.day][item.id] = { ok: !!ok, ts: Date.now(), mode: state.mode };
    writeJSON(K_PROGRESS, all);
    render();
    renderStreak();
  }

  function submitTyped() {
    const input = document.getElementById("ansInput");
    if (!input) return;
    const v = input.value.trim();
    const item = state.queue[state.idx];
    if (!v) { input.focus(); return; }
    answer(v, judge(v, item), false);
  }

  function next() {
    if (state.idx + 1 >= state.queue.length) {
      state.phase = "done";
      state.current = null;
      const total = state.answers.length;
      const ok = state.answers.filter((a) => a.ok).length;
      const s = sessions();
      s.push({ date: state.day, ts: Date.now(), total, ok, mode: state.mode });
      writeJSON(K_SESSIONS, s.slice(-400));
      render();
      renderStreak();
      return;
    }
    state.idx++;
    state.current = null;
    state.options = null;
    render();
  }

  /* ---------------- paste import ---------------- */
  const COLS = ["type", "jp", "reading", "pos", "cn", "alt", "example", "exampleCn", "tags"];

  /* 猜分隔符：优先认表头，认不出就按「Tab > 逗号 > 两个以上空格 > 单空格」退化。
     复制粘贴时 Tab 很容易被换成空格，这一步就是为了兜住这种情况。 */
  function pickSep(sample) {
    const known = new Set(COLS.map((c) => c.toLowerCase()));
    const cands = ["\t", ",", "|", /\s{2,}/, " "];
    let best = "\t", bestScore = -1;
    cands.forEach((c) => {
      const cells = sample.split(c).map((s) => s.trim()).filter(Boolean);
      const score = cells.filter((x) => known.has(x.toLowerCase())).length;
      if (score > bestScore) { bestScore = score; best = c; }
    });
    if (bestScore > 0) return best;
    if (sample.includes("\t")) return "\t";
    if (sample.includes(",")) return ",";
    if (/\s{2,}/.test(sample)) return /\s{2,}/;
    return " ";
  }

  function parseTSV(text) {
    let raw = String(text).replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
    // 去掉误粘进来的 ``` 围栏
    raw = raw.split("\n").filter((l) => !/^\s*```/.test(l)).join("\n");
    const lines = raw.split("\n").filter((l) => l.trim() && !l.trim().startsWith("#"));
    if (!lines.length) throw new Error("内容为空");

    const sep = pickSep(lines[0]);
    const cells = (l) => l.split(sep).map((c) => c.trim());

    let head = cells(lines[0]).map((h) => h.toLowerCase());
    const isHeader = head.includes("jp") && head.includes("cn");
    const rows = isHeader ? lines.slice(1) : lines;
    if (!isHeader) head = COLS.map((c) => c.toLowerCase());

    const idx = (name) => head.indexOf(name.toLowerCase());
    const map = {};
    COLS.forEach((c) => { map[c] = idx(c); });
    if (map.jp < 0 || map.cn < 0) throw new Error("缺少 jp 或 cn 列");

    const date = todayStr();
    const items = rows.map((line, i) => {
      const c = cells(line);
      const get = (k) => (map[k] >= 0 ? (c[map[k]] || "") : "");
      const type = /^(grammar|语法|文法)$/i.test(get("type")) ? "grammar" : "word";
      const jp = get("jp");
      const cn = get("cn");
      if (!jp || !cn) return null;
      return {
        id: `${type === "grammar" ? "g" : "w"}-${date.replace(/-/g, "")}-${pad(i + 1)}`,
        type, jp, cn,
        reading: get("reading"),
        pos: get("pos"),
        alt: get("alt") ? get("alt").split(/[|｜、]/).map((s) => s.trim()).filter(Boolean) : [],
        example: get("example"),
        exampleCn: get("exampleCn"),
        tags: get("tags") ? get("tags").split(/[|｜,，]/).map((s) => s.trim()).filter(Boolean) : []
      };
    }).filter(Boolean);

    if (!items.length) {
      const cols0 = cells(lines[0]).length;
      throw new Error(`没有解析出有效条目（第 1 行只切出 ${cols0} 列）。可能是制表符被换成了空格，或某行少了字段；每行应有 9 个字段。`);
    }
    return { date, items };
  }

  function openPaste() {
    document.getElementById("modal").hidden = false;
    const err = document.getElementById("pasteErr");
    err.hidden = true;
    document.getElementById("pasteArea").focus();
  }
  function closePaste() {
    document.getElementById("modal").hidden = true;
  }

  /* ---------------- export ---------------- */
  function exportRecord() {
    const total = state.answers.length;
    const ok = state.answers.filter((a) => a.ok).length;
    const payload = {
      date: state.day,
      exportedAt: new Date().toISOString(),
      mode: state.mode,
      total, correct: ok,
      answers: state.answers
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `progress-${state.day}.json`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  /* ---------------- events ---------------- */
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-act]");
    if (!t) return;
    const act = t.getAttribute("data-act");

    if (act === "day") { selectDay(t.getAttribute("data-date")); return; }
    if (act === "reveal") {
      if (!state.current) {
        const r = t.querySelector(".rtext");
        if (r) r.classList.remove("blur");
        const h = t.querySelector(".rhint");
        if (h) h.remove();
      }
      return;
    }
    if (act === "mode") {
      state.mode = t.getAttribute("data-mode") === "type" ? "type" : "choice";
      writeJSON(K_PREFS, { mode: state.mode });
      state.current = null;
      state.options = null;
      render();
      return;
    }
    if (act === "start") { startQuiz(false); return; }
    if (act === "only-wrong") { startQuiz(true); return; }
    if (act === "exit") {
      state.phase = "start"; state.current = null; state.answers = []; state.idx = 0;
      render(); return;
    }
    if (act === "choose") {
      if (state.current) return;
      const item = state.queue[state.idx];
      const opt = (state.options || [])[+t.getAttribute("data-i")];
      const val = opt ? opt.cn : "";
      answer(val, val === item.cn, false);
      return;
    }
    if (act === "submit-type") { submitTyped(); return; }
    if (act === "skip") { answer("", false, true); return; }
    if (act === "next") { next(); return; }
    if (act === "retry-wrong") {
      const wrong = state.answers.filter((a) => !a.ok).map((a) => state.items.find((x) => x.id === a.id)).filter(Boolean);
      if (!wrong.length) return;
      state.queue = shuffle(wrong);
      state.idx = 0; state.answers = []; state.current = null; state.options = null;
      state.startTs = Date.now(); state.phase = "quiz";
      render();
      return;
    }
    if (act === "export") { exportRecord(); return; }
    if (act === "paste-open") { openPaste(); return; }
    if (act === "paste-cancel") { closePaste(); return; }
    if (act === "paste-ok") {
      const err = document.getElementById("pasteErr");
      try {
        const { date, items } = parseTSV(document.getElementById("pasteArea").value);
        const all = readJSON(K_LOCAL, {});
        all[date] = items;
        writeJSON(K_LOCAL, all);
        state.localDays = all;
        buildDays();
        closePaste();
        selectDay(date);
      } catch (ex) {
        err.textContent = ex.message || "导入失败";
        err.hidden = false;
      }
      return;
    }
  });

  document.addEventListener("keydown", (e) => {
    if (state.phase !== "quiz") return;
    if (e.target && e.target.tagName === "INPUT") {
      if (e.key === "Enter") { e.preventDefault(); if (state.current) next(); }
      return;
    }
    if (e.key >= "1" && e.key <= "4" && state.mode === "choice" && !state.current) {
      const i = +e.key - 1;
      const btn = document.querySelector(`[data-act="choose"][data-i="${i}"]`);
      if (btn) btn.click();
    }
    if (e.key === "Enter" || e.key === " ") {
      if (state.current) { e.preventDefault(); next(); }
    }
  });

  document.getElementById("pasteCancel").addEventListener("click", closePaste);

  // 调试出口：方便在控制台或自动化测试里单独验证解析与判分
  window.__jlpt = { parseTSV, judge, norm, state };

  boot();
})();
