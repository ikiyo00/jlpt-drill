/* 今日のJLPT — 每日单词 / 语法 中日对照自测 */
(() => {
  "use strict";

  const K_PROGRESS = "jlpt-drill:progress:v1";
  const K_SESSIONS = "jlpt-drill:sessions:v1";
  const K_PREFS = "jlpt-drill:prefs:v1";
  const K_LOCAL = "jlpt-drill:localdays:v1";
  const K_SW = "jlpt-drill:sw:v1";
  const K_BOOK = "jlpt-drill:wrongbook:v1";
  const K_BOOK_MIG = "jlpt-drill:bookmig:v1";

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

  /* 常用日语汉字词读音：给没有显式注音的历史数据兜底。
     只收录无歧义的词，宁可漏标也不误标。新题由生成端直接写 漢字[かな]，优先级更高。 */
  const FURI_WORD = {
    "挨拶": "あいさつ", "散歩": "さんぽ", "証拠": "しょうこ", "責任": "せきにん",
    "恩師": "おんし", "上司": "じょうし", "実際": "じっさい", "判断": "はんだん",
    "発言": "はつげん", "若者": "わかもの", "深刻": "しんこく", "借金": "しゃっきん",
    "説明": "せつめい", "書類": "しょるい", "接客": "せっきゃく", "先生": "せんせい",
    "合格": "ごうかく", "議論": "ぎろん", "人物": "じんぶつ", "強行": "きょうこう",
    "被害": "ひがい", "感謝": "かんしゃ", "教育者": "きょういくしゃ", "好天気": "こうてんき",
    "周囲": "しゅうい", "本日": "ほんじつ", "失敗": "しっぱい", "卒業": "そつぎょう",
    "優勝": "ゆうしょう", "当時": "とうじ", "苦労": "くろう", "想像": "そうぞう",
    "有無": "うむ", "空気": "くうき", "東京": "とうきょう", "全国": "ぜんこく",
    "出発": "しゅっぱつ", "映画": "えいが", "感動": "かんどう", "初心者": "しょしんしゃ",
    "指導者": "しどうしゃ", "完璧": "かんぺき", "解決": "かいけつ", "自信": "じしん",
    "即刻左遷": "そっこくさせん", "地域": "ちいき", "実情": "じつじょう", "支援策": "しえんさく",
    "現行法": "げんこうほう", "処分": "しょぶん", "妥当": "だとう", "遺産": "いさん",
    "兄弟": "きょうだい", "来春": "らいしゅん", "開業": "かいぎょう", "準備": "じゅんび",
    "一国": "いっこく", "大臣": "だいじん", "先方": "せんぽう", "担当者": "たんとうしゃ",
    "来週": "らいしゅう", "回答": "かいとう", "難局": "なんきょく", "一秒": "いちびょう",
    "無駄": "むだ", "職人": "しょくにん", "手仕事": "てしごと", "問題": "もんだい",
    "高齢者": "こうれいしゃ", "迷惑": "めいわく", "地方": "ちほう", "人口": "じんこう",
    "年々減少": "ねんねんげんしょう", "今年": "ことし", "財布": "さいふ", "作業": "さぎょう",
    "作業員": "さぎょういん", "文章": "ぶんしょう", "冗長": "じょうちょう", "不安": "ふあん",
    "表情": "ひょうじょう", "何度": "なんど", "見返": "みかえ", "会社員": "かいしゃいん",
    "小説": "しょうせつ", "駅前": "えきまえ", "本屋": "ほんや", "郵便局": "ゆうびんきょく",
    "切手": "きって", "正社員": "せいしゃいん", "契約社員": "けいやくしゃいん",
    "安全研修": "あんぜんけんしゅう", "必修": "ひっしゅう", "無断欠勤": "むだんけっきん",
    "余地": "よち", "無事": "ぶじ", "寝坊": "ねぼう", "大事": "だいじ",
    "肌寒": "はださむ", "専門家": "せんもんか", "英語": "えいご", "中国語": "ちゅうごくご",
    "流暢": "りゅうちょう", "法案": "ほうあん", "成立": "せいりつ", "携帯": "けいたい",
    "詳細": "しょうさい", "連絡": "れんらく", "美術館": "びじゅつかん", "浮世絵": "うきよえ",
    "日本美術": "にほんびじゅつ", "幅広": "はばひろ", "収蔵": "しゅうぞう", "分野": "ぶんや",
    "研究": "けんきゅう", "第一人者": "だいいちにんしゃ", "経済": "けいざい", "発展": "はってん",
    "環境問題": "かんきょうもんだい", "住民": "じゅうみん", "開発計画": "かいはつけいかく",
    "惨状": "さんじょう", "我慢": "がまん", "指導": "しどう", "入賞": "にゅうしょう",
    "感激": "かんげき", "来場者数": "らいじょうしゃすう", "過去最高": "かこさいこう",
    "記録": "きろく", "総務部": "そうむぶ", "人事部": "じんじぶ", "通知": "つうち",
    "配布": "はいふ", "家賃": "やちん", "統計": "とうけい", "報告書": "ほうこくしょ",
    "作成": "さくせい", "学生": "がくせい", "模範": "もはん", "猛反対": "もうはんたい",
    "態度": "たいど", "失礼極": "しつれいきわ", "丁寧": "ていねい", "対応": "たいおう",
    "野外": "やがい", "大成功": "だいせいこう", "冗談": "じょうだん", "本題": "ほんだい",
    "営業": "えいぎょう", "終了": "しゅうりょう", "実力": "じつりょく", "難問": "なんもん",
    "出向": "しゅっこう", "電話": "でんわ", "指摘": "してき", "成功": "せいこう",
    "新学期": "しんがっき", "一年生": "いちねんせい", "代表": "だいひょう", "優秀": "ゆうしゅう",
    "十年": "じゅうねん", "行動": "こうどう", "値段": "ねだん", "品質": "ひんしつ",
    "大雨": "おおあめ", "氾濫": "はんらん", "雑誌": "ざっし", "初心者向": "しょしんしゃむけ",
    "商品": "しょうひん", "半額": "はんがく", "新製品": "しんせいひん", "発売": "はつばい",
    "報道向": "ほうどうむけ", "発表会": "はっぴょうかい", "進路": "しんろ", "真剣": "しんけん",
    "真相": "しんそう", "調査委員会": "ちょうさいいんかい", "設置": "せっち", "祖国": "そこく",
    "戦場": "せんじょう", "試合": "しあい", "予定通": "よていどおり", "写真": "しゃしん",
    "返事": "へんじ", "失礼": "しつれい", "連休": "れんきゅう", "観光地": "かんこうち",
    "先輩": "せんぱい", "賛成": "さんせい", "意見": "いけん", "試験": "しけん",
    "一夜漬": "いちやづけ", "友人": "ゆうじん", "手紙": "てがみ", "今回": "こんかい",
    "来月": "らいげつ", "制度案": "せいどあん", "昨今": "さっこん", "経済情勢": "けいざいじょうせい",
    "時期": "じき", "延期": "えんき", "困難": "こんなん", "状況": "じょうきょう",
    "冷静": "れいせい", "途中": "とちゅう", "実行": "じっこう", "自社製品": "じしゃせいひん",
    "業界一": "ぎょうかいいち", "公言": "こうげん", "昼食": "ちゅうしょく", "物事": "ものごと",
    "関係者以外": "かんけいしゃいがい", "立入": "たちいり", "観光客": "かんこうきゃく",
    "要素": "ようそ", "一言余計": "ひとことよけい", "友達": "ともだち", "出張": "しゅっちょう",
    "故郷": "こきょう", "両親": "りょうしん", "体験": "たいけん", "理解": "りかい",
    "気持": "きもち", "会社": "かいしゃ", "謝罪": "しゃざい", "事実": "じじつ",
    "一人暮": "ひとりぐ", "心細": "こころぼそ", "気配": "けはい", "木々": "きぎ",
    "昨夜": "さくや", "危険": "きけん", "意欲": "いよく", "採用": "さいよう",
    "新入社員": "しんにゅうしゃいん", "熱意": "ねつい", "資料": "しりょう", "配付": "はいふ",
    "入学": "にゅうがく", "提出": "ていしゅつ", "転勤": "てんきん", "社内": "しゃない",
    "遅刻": "ちこく", "光景": "こうけい", "歓迎": "かんげい", "素晴": "すば",
    "彼女": "かのじょ", "自分": "じぶん", "反対": "はんたい", "計画": "けいかく",
    "会議": "かいぎ", "努力": "どりょく", "以上": "いじょう", "信頼": "しんらい",
    "必要": "ひつよう", "経験": "けいけん", "皮切": "かわきり", "最中": "さいちゅう",
    "次第": "しだい", "手伝": "てつだい", "先駆": "さきがけ", "同然": "どうぜん",
    "始末": "しまつ", "手前": "てまえ", "事欠": "ことか", "最後": "さいご",
    "峠": "とうげ", "周囲": "しゅうい", "流暢": "りゅうちょう"
  };

  /* 单字训读：仅在汉字后紧跟平假名（送り仮名）时使用，避免把音读词标错。 */
  const FURI_STEM = {
    "彼": "かれ", "言": "い", "得": "え", "限": "かぎ", "人": "ひと", "向": "む",
    "禁": "きん", "至": "いた", "上": "あ", "思": "おも", "買": "か", "足": "た",
    "極": "きわ", "恐": "おそ", "持": "も", "味": "あじ", "謝": "あやま", "開": "ひら",
    "断": "ことわ", "店": "みせ", "知": "し", "聞": "き", "会": "あ", "降": "ふ",
    "嬉": "うれ", "春": "はる", "悲": "かな", "認": "みと", "者": "もの", "進": "すす",
    "母": "はは", "子": "こ", "切": "き", "書": "か", "続": "つづ", "遅": "おく",
    "朝": "あさ", "話": "はな", "飛": "と", "早": "はや", "安": "やす", "細": "こま",
    "考": "かんが", "川": "かわ", "始": "はじ", "雨": "あめ", "見": "み", "眺": "なが",
    "忙": "いそが", "語": "かた", "疲": "つか", "多": "おお", "勝": "か", "臨": "のぞ",
    "頼": "たの", "取": "と", "戻": "もど", "使": "つか", "良": "よ", "悪": "わる",
    "争": "あらそ", "絶": "た", "実": "じつ", "結": "むす", "乗": "の", "温": "あたた",
    "品": "しな", "狭": "せま", "祝": "いわ", "緩": "ゆる", "終": "お", "伺": "うかが",
    "寄": "よ", "歩": "ある", "立": "た", "若": "わか", "過": "す", "君": "きみ",
    "厳": "きび", "混": "こ", "引": "ひ", "受": "う", "長": "なが", "猫": "ねこ",
    "鳴": "な", "木": "き", "黙": "だま", "示": "しめ", "沈": "しず", "守": "まも",
    "許": "ゆる", "申": "もう", "着": "つ", "難": "むずか", "追": "お", "新": "あたら",
    "保": "たも", "移": "うつ", "町": "まち", "惹": "ひ", "怒": "おこ", "激": "はげ",
    "久": "ひさ", "訪": "おとず", "重": "おも", "揃": "そろ", "初": "はじ", "風": "かぜ",
    "秋": "あき", "漂": "ただよ", "少": "すく", "色": "いろ", "暑": "あつ", "助": "たす",
    "捨": "す", "驚": "おどろ", "責": "せ", "解": "と", "帰": "かえ", "大": "おお",
    "皆": "みな", "高": "たか", "必": "かなら", "顔": "かお", "服": "ふく", "窓": "まど",
    "外": "そと", "手": "て", "振": "ふ", "何": "なん", "迎": "むか", "喜": "よろこ",
    "物": "もの", "口": "くち", "助": "たす", "込": "こ"
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
    returnToBook: false,
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
  const prefs = () => readJSON(K_PREFS, { mode: "choice" });
  const bookEntries = () => {
    const b = readJSON(K_BOOK, {});
    return Object.keys(b).map((k) => ({ ...b[k], key: k }))
      .filter((e) => e && e.jp && e.cn)
      .sort((a, b2) => (b2.lastTs || 0) - (a.lastTs || 0));
  };

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

  /* 假名标注：优先用数据里的 漢字[かな]，否则查内置词典。
     查不到就原样输出——宁可漏标，也不给错读音。 */
  const KANJI = /[\u4e00-\u9fff\u3400-\u4dbf々〆ヶ]/;
  const KANA_ONLY = /^[ぁ-んァ-ヶー]+$/;
  const HIRAGANA = /^[ぁ-ん]/;
  function furigana(text) {
    const s = String(text == null ? "" : text);
    let out = "", plain = "";
    const flush = () => { if (plain) { out += esc(plain); plain = ""; } };
    const ruby = (base, yomi) => `<ruby class="fg">${esc(base)}<rt>${esc(yomi)}</rt></ruby>`;
    let i = 0;
    while (i < s.length) {
      if (KANJI.test(s[i])) {
        let j = i;
        while (j < s.length && KANJI.test(s[j])) j++;
        const block = s.slice(i, j);
        // 数据里的显式注音，如 禁[きん]じ得[え]ない
        if (s[j] === "[") {
          const close = s.indexOf("]", j + 1);
          if (close > j + 1) {
            const yomi = s.slice(j + 1, close);
            if (KANA_ONLY.test(yomi)) {
              flush();
              out += ruby(block, yomi);
              i = close + 1;
              continue;
            }
          }
        }
        flush();
        if (FURI_WORD[block]) {
          out += ruby(block, FURI_WORD[block]);
        } else if (block.length === 1 && FURI_STEM[block] && HIRAGANA.test(s[j] || "")) {
          // 单字 + 送り仮名 → 训读词干
          out += ruby(block, FURI_STEM[block]);
        } else {
          out += esc(block);
        }
        i = j;
        continue;
      }
      plain += s[i++];
    }
    flush();
    return out;
  }

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

  /* 一次性迁移：把旧版 progress 里仍标为做错的题收进错题本 */
  function migrateWrongbook() {
    if (localStorage.getItem(K_BOOK_MIG)) return;
    try {
      const p = progress(), book = readJSON(K_BOOK, {});
      Object.keys(p).forEach((date) => {
        const items = (state.bundleItems && state.bundleItems[date])
          || state.localDays[date] || [];
        Object.keys(p[date] || {}).forEach((id) => {
          const r = p[date][id];
          if (!r || r.ok !== false) return;
          const it = items.find((x) => x.id === id);
          const key = date + ":" + id;
          if (!it || book[key]) return;
          book[key] = {
            ...it, key, date,
            count: 1, firstTs: r.ts || Date.now(), lastTs: r.ts || Date.now(),
            lastOk: false, lastValue: ""
          };
        });
      });
      writeJSON(K_BOOK, book);
    } catch (e) { }
    try { localStorage.setItem(K_BOOK_MIG, "1"); } catch (e) { }
  }

  async function boot() {
    registerSW();
    state.localDays = readJSON(K_LOCAL, {});
    state.mode = prefs().mode === "type" ? "type" : "choice";

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
    migrateWrongbook();
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
    state.returnToBook = false;

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
    else if (state.phase === "book") main.innerHTML = viewBook();
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
    const bookN = bookEntries().length;
    const acc = s.done ? Math.round((s.ok / s.done) * 100) : 0;
    const w = items.filter((i) => i.type === "word").length;
    const g = items.filter((i) => i.type === "grammar").length;
    const modeLabel = state.mode === "choice" ? "选择题" : "输入题";

    return `<div class="card">
      <div class="meta-row">
        <h2 class="date-title">${esc(state.day)} <span style="color:var(--muted);font-weight:400">${esc(weekday(state.day))}曜</span></h2>
        <span class="typebadge ${s.done ? "grammar" : "word"}">${s.done ? "已完成 " + s.done + "/" + s.total : "未开始"}</span>
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
        <button class="btn ghost" data-act="book-open">错题本（${bookN}）</button>
        <button class="btn ghost" data-act="paste-open">粘贴导入</button>
      </div>
    </div>`;
  }

  /* 永久错题本：做错过一次就一直留着，重做答对也不移除（除非开启自动移出或手动移除）。 */
  function viewBook() {
    const list = bookEntries();
    const totalWrong = list.reduce((n, e) => n + (e.count || 0), 0);
    const auto = !!prefs().autoRemove;
    return `<div class="card">
      <p class="eyebrow" style="margin:0 0 8px">错题本 · 跨天永久保存</p>
      <div class="meta-row">
        <h2 class="date-title">共 ${list.length} 条错题</h2>
        <span class="typebadge grammar">累计做错 ${totalWrong} 次</span>
      </div>
      <p class="book-note">只要做错过一次就会一直收进这里，重做答对也不会自动消失。可以在下面改成「答对即移出」，或逐条手动移除。</p>

      <div class="switch">
        <div>
          <span class="switch-lbl">错题保留方式</span>
          <span class="switch-sub">${auto ? "答对后自动移出（旧行为）" : "永久保留（推荐）"}</span>
        </div>
        <div class="seg" role="group">
          <button data-act="book-auto" data-on="0" aria-pressed="${!auto}">永久保留</button>
          <button data-act="book-auto" data-on="1" aria-pressed="${auto}">答对移出</button>
        </div>
      </div>

      <div class="btn-row">
        <button class="btn primary" data-act="book-retry" ${list.length ? "" : "disabled"}>重练全部（${list.length}）</button>
        <button class="btn ghost" data-act="book-clear" ${list.length ? "" : "disabled"}>清空</button>
      </div>

      ${list.length ? `<ul class="booklist">
        ${list.map((e) => `<li>
          <div class="bl-main">
            <div class="bl-jp jp">${furigana(e.jp)}</div>
            <div class="bl-cn">${esc(e.cn)}</div>
            <div class="bl-meta">${esc(shortDate(e.date))} · ${e.type === "grammar" ? "语法" : "单词"} · 错 ${e.count || 1} 次 · ${e.lastOk ? "最近一次答对" : "尚未答对"}</div>
          </div>
          <button class="bl-x" data-act="book-remove" data-key="${esc(e.key)}" title="移出错题本" aria-label="移出错题本">×</button>
        </li>`).join("")}
      </ul>` : `<div class="empty"><h2>错题本是空的</h2><p>做错一题就会自动收进来，之后一直留着。</p></div>`}

      <div class="btn-row">
        <button class="linkish" data-act="book-close">回到今天</button>
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

    const readingLine = item.reading
      ? `<p class="reading" data-act="reveal"><span class="rtext ${ans ? "" : "blur"}">${esc(item.reading)}</span>${ans ? "" : '<span class="rhint">读音</span>'}</p>`
      : "";

    const head = `<div class="quizbar">
        <span>${n} / ${total}</span>
        <span class="typebadge ${isG ? "grammar" : "word"}">${isG ? "语法" : "单词"}</span>
        <button class="linkish" data-act="exit">退出</button>
      </div>
      <div class="bar"><i style="width:${pct}%"></i></div>
      <p class="prompt">${state.mode === "choice" ? "选出正确的中文释义" : "写出中文释义"}${state.onlyWrong ? " · 错题重练" : ""}</p>
      <h2 class="word jp">${furigana(item.jp)}</h2>
      ${readingLine}
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
              + `<b class="opt-jp jp">${furigana(o.source.jp)}</b>`
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
      let distractor = "";
      if (!ans.ok && state.mode === "choice") {
        const chosen = (state.options || []).find((o) => o.cn === ans.value);
        if (chosen) {
          if (chosen.source && chosen.jp) {
            distractor = `<p class="distractor-info">
              <span class="di-label">你选的「${esc(chosen.cn)}」其实是：</span>
              <b class="di-jp jp">${furigana(chosen.jp)}</b>${chosen.reading ? `<span class="di-rd">${esc(chosen.reading)}</span>` : ""}
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
          <p class="jp-s jp">${furigana(item.example)}</p>
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
        <div class="count"><b>${total - ok}</b><span>本轮做错</span></div>
      </div>

      ${wrong.length ? `<p class="eyebrow" style="margin:18px 0 0">本轮错题</p>
        <ul class="wronglist">
          ${wrong.map((a) => `<li><span class="w-jp jp">${furigana(a.jp)}</span><span class="w-cn">${esc(a.cn)}</span></li>`).join("")}
        </ul>` : `<p style="color:var(--muted);font-size:13px;margin:18px 0 0">本轮全对。之前收录的错题仍保留在错题本里。</p>`}

      <div class="btn-row">
        ${wrong.length ? `<button class="btn primary" data-act="retry-wrong">重练错题</button>` : ""}
        <button class="btn ${wrong.length ? "ghost" : "primary"}" data-act="start">再来一轮</button>
      </div>
      <div class="btn-row">
        <button class="linkish" data-act="book-open">打开错题本（${bookEntries().length}）</button>
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
    state.returnToBook = false;
    state.startTs = Date.now();
    state.phase = "quiz";
    render();
  }

  function startBookQuiz() {
    const list = bookEntries().map((e) => ({ ...e, _bookKey: e.key, _bookDate: e.date }));
    if (!list.length) return;
    state.queue = shuffle(list);
    state.idx = 0;
    state.answers = [];
    state.current = null;
    state.options = null;
    state.onlyWrong = true;
    state.returnToBook = true;
    state.startTs = Date.now();
    state.phase = "quiz";
    render();
  }

  function snapshot(item) {
    return {
      date: item._bookDate || state.day,
      id: item.id,
      type: item.type,
      jp: item.jp,
      reading: item.reading || "",
      pos: item.pos || "",
      cn: item.cn,
      alt: item.alt || [],
      example: item.example || "",
      exampleCn: item.exampleCn || "",
      tags: item.tags || []
    };
  }

  function answer(value, ok, skipped) {
    const item = state.queue[state.idx];
    state.current = { value, ok: !!ok, skipped: !!skipped };
    const key = item._bookKey || ((item._bookDate || state.day) + ":" + item.id);
    state.answers.push({
      id: item.id, key, type: item.type, jp: item.jp, cn: item.cn,
      ok: !!ok, value: value || ""
    });

    // 当天进度：仍按最新一次结果记录（影响正确率显示）
    const all = progress();
    const d = item._bookDate || state.day;
    all[d] = all[d] || {};
    all[d][item.id] = { ok: !!ok, ts: Date.now(), mode: state.mode };
    writeJSON(K_PROGRESS, all);

    // 永久错题本：做错即收录；答对不移除（除非开启「答对移出」）
    const book = readJSON(K_BOOK, {});
    if (!ok) {
      const prev = book[key] || {};
      book[key] = {
        ...snapshot(item), key,
        count: (prev.count || 0) + 1,
        firstTs: prev.firstTs || Date.now(),
        lastTs: Date.now(),
        lastOk: false,
        lastValue: value || ""
      };
    } else if (book[key]) {
      book[key].lastOk = true;
      book[key].lastTs = Date.now();
      if (prefs().autoRemove) delete book[key];
    }
    writeJSON(K_BOOK, book);

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
      const p = prefs(); p.mode = state.mode;
      writeJSON(K_PREFS, p);
      state.current = null;
      state.options = null;
      render();
      return;
    }
    if (act === "start") { startQuiz(false); return; }
    if (act === "only-wrong") { startQuiz(true); return; }
    if (act === "exit") {
      state.current = null; state.answers = []; state.idx = 0;
      if (state.returnToBook) { state.returnToBook = false; state.phase = "book"; }
      else state.phase = "start";
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
      const wrong = state.answers.filter((a) => !a.ok)
        .map((a) => state.queue.find((x) => x.id === a.id && x.jp === a.jp))
        .filter(Boolean);
      if (!wrong.length) return;
      state.queue = shuffle(wrong);
      state.idx = 0; state.answers = []; state.current = null; state.options = null;
      state.startTs = Date.now(); state.phase = "quiz";
      render();
      return;
    }
    if (act === "book-open") { state.phase = "book"; render(); return; }
    if (act === "book-close") { state.phase = "start"; render(); return; }
    if (act === "book-retry") { startBookQuiz(); return; }
    if (act === "book-remove") {
      const b = readJSON(K_BOOK, {});
      delete b[t.getAttribute("data-key")];
      writeJSON(K_BOOK, b);
      render(); return;
    }
    if (act === "book-clear") {
      if (!window.confirm("确定清空错题本吗？所有已收录的错题都会被移除。")) return;
      writeJSON(K_BOOK, {});
      render(); return;
    }
    if (act === "book-auto") {
      const p = prefs();
      p.autoRemove = t.getAttribute("data-on") === "1";
      writeJSON(K_PREFS, p);
      render(); return;
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

  window.__jlpt = { parseTSV, judge, norm, furigana, state };

  boot();
})();
