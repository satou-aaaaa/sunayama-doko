// どこから砂山？の問題を作る（ブラウザと node の両方で使う）。
// 2つの部分がある。
//  1. 砂山（HEAP）：砂山・人だかり・森を少しずつ減らし、「砂山・ちがう・分からない」を答える。正解は無い（言葉の境目は決まっていない。
//     出典：Hyde & Raffman "Sorites Paradox", Stanford Encyclopedia of Philosophy 2025 改訂）。
//  2. 決めた線（KINDS）：はっきり決めた境目に当てはまるかを選ぶ問題。正解がある。中身は気象庁「予報用語」に書いてあることだけ
//     （時に関する用語：一時・時々・連続的と断続的、気温に関する用語：夏日・真夏日・猛暑日・酷暑日・冬日・真冬日。2026-11-27 に読んだ）。
// 乱数 R は呼ぶ回数が同じ tag なら毎回同じになるように使う（sort の比較の中では引かない）。同じ tag なら、どの端末でも同じ問題になる。
// KINDS・THEMES・THEME_DAY は最後に足すだけにし、足す種類には since:"YYYY-MM-DD"（出し始める日・公開の翌日以降）を付ける。
(function (root) {
  "use strict";
  const LV = ["やさしい", "ふつう", "むずかしい"];

  // 出典（画面の「なぜ」と「このゲームについて」に出す）
  const SRC = {
    toki: ["気象庁「予報用語 時に関する用語」", "https://www.jma.go.jp/jma/kishou/know/yougo_hp/toki.html"],
    kion: ["気象庁「予報用語 気温に関する用語」", "https://www.jma.go.jp/jma/kishou/know/yougo_hp/kion.html"],
  };
  // 砂山と、ほかの決めた線の出典（答えの出どころではなく、結果の画面と「このゲームについて」に出す）
  const MORE = {
    sep: ["Hyde & Raffman「Sorites Paradox」（スタンフォード哲学百科事典）", "https://plato.stanford.edu/entries/sorites-paradox/"],
    minpo: ["e-Gov 法令検索「民法」第4条", "https://laws.e-gov.go.jp/law/129AC0000000089"],
    kokusho: ["気象庁 報道発表「最高気温40℃以上の日の名称」（2026-04-17）", "https://www.jma.go.jp/jma/press/2604/17a/20260417_40degree_name.pdf"],
  };

  // part:ri:begin（shared-workflows の template/parts/data/ri.js の写し。ここでは直さない。node scripts/sync-template.mjs で写す）
  const ri = (R, a, b) => a + Math.floor(R() * (b - a + 1));
  // part:ri:end
  // part:shuffle:begin（shared-workflows の template/parts/data/shuffle.js の写し。ここでは直さない。node scripts/sync-template.mjs で写す）
  function shuffle(R, a) { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = ri(R, 0, i); [b[i], b[j]] = [b[j], b[i]]; } return b; }
  // part:shuffle:end
  // part:pickN:begin（shared-workflows の template/parts/data/pickN.js の写し。ここでは直さない。node scripts/sync-template.mjs で写す）
  function pickN(R, a, n) { return shuffle(R, a).slice(0, n); }
  // part:pickN:end

  // ---- 1. 砂山（正解の無い問い）----
  // seq：大きく減らすときの数（多い順）。1粒ずつの段は、はじめて「砂山」でなくなった所の前後で入る（index.html）
  const THEMES = [
    { id: "suna", w: "砂山", u: "粒", mk: "⛰", thing: "砂の粒", seq: [1000, 500, 250, 120, 80, 50, 35, 25, 18, 12, 8, 5, 3, 1] },
    { id: "hito", w: "人だかり", u: "人", mk: "👥", thing: "人", seq: [300, 150, 80, 50, 35, 25, 18, 12, 8, 5, 3, 1] },
    { id: "mori", w: "森", u: "本", mk: "🌲", thing: "木", seq: [500, 250, 120, 80, 50, 35, 25, 18, 12, 8, 5, 3, 1] },
  ];
  const THEME_BY = Object.fromEntries(THEMES.map((t) => [t.id, t]));
  const THEME_DAY = ["suna", "suna", "hito", "suna", "mori"]; // 日ごとのお題（砂山が多め）
  const FINE_MAX = 10; // 1粒ずつ減らすのは多くて10回

  // ---- 2. 決めた線（正解のある問い）----
  // 2段目の選び肢（GROUPS）。問題ごとに見せる組（g2）と、2段目の問い（ask2）が決まる
  const GROUPS = {
    // 時に関する用語：決め手は？
    c1: { name: "ひと続き・期間の1/4未満", sub: "雨の切れ間が1時間未満" },
    i2: { name: "切れ間あり・合計が1/2未満", sub: "雨の切れ間が1時間以上" },
    c4: { name: "ひと続き・期間の1/4以上", sub: "雨の切れ間が1時間未満" },
    i4: { name: "切れ間あり・合計が1/2以上", sub: "雨の切れ間が1時間以上" },
    // 気温（夏）：少しずらすと？
    natsu: { name: "夏日", sub: "最高25度以上" },
    manatsu: { name: "真夏日", sub: "最高30度以上" },
    mosho: { name: "猛暑日", sub: "最高35度以上" },
    kokusho: { name: "酷暑日", sub: "最高40度以上" },
    // 気温（冬）：少しずらすと？
    mafuyu: { name: "真冬日", sub: "最高0度未満" },
    fuyu: { name: "冬日", sub: "最低0度未満" },
    nofuyu: { name: "どちらでもない", sub: "最低0度以上" },
  };
  const G_TOKI = ["c1", "i2", "c4", "i4"], G_NATSU = ["natsu", "manatsu", "mosho", "kokusho"], G_FUYU = ["mafuyu", "fuyu", "nofuyu"];
  const GRP_OF = {};
  const GRP_WHY = {};

  // ---- 時に関する用語（一時・時々）----
  // 時間は30分を1こまで数える。予報の期間 P 時間＝2P こま。1/4 は P/2 こま、1/2 は P こま
  const PERIODS = [[6, 18], [12, 6], [18, 6], [24, 0]]; // [時間, 始まりの時]
  const T_OPTS = ["一時 雨", "時々 雨", "どちらでもない"];
  const hm = (S, c) => { const m = S * 60 + c * 30, h = Math.floor(m / 60), mm = m % 60; return mm ? `${h}時${mm}分` : `${h}時`; };
  const dur = (c) => (c % 2 ? (c > 1 ? `${(c - 1) / 2}時間30分` : "30分") : `${c / 2}時間`);
  // 雨のまとまりを並べる。lens：まとまりの長さ（こま）、gap：あいだの最小（こま）、N：期間のこま数
  function place(R, N, lens, gap, exactGap) {
    const k = lens.length, need = lens.reduce((a, b) => a + b, 0) + gap * (k - 1);
    if (need > N) return null;
    const slots = new Array(k + 1).fill(0); let free = N - need;
    // 余りを「前・あいだ・後」に配る。exactGap のときは、あいだを広げない（30分の切れ間のまま）
    const can = exactGap ? [0, k] : [...Array(k + 1).keys()];
    while (free > 0) { slots[can[ri(R, 0, can.length - 1)]]++; free--; }
    const segs = []; let c = slots[0];
    for (let i = 0; i < k; i++) { segs.push([c, lens[i]]); c += lens[i] + (i < k - 1 ? gap + slots[i + 1] : 0); }
    return segs;
  }
  function split(R, total, k, min) { const a = new Array(k).fill(min); for (let r = total - min * k; r > 0; r--) a[ri(R, 0, k - 1)]++; return a; }
  function timeline(P, S, segs) {
    const N = P * 2, W = 280, x = (c) => 20 + (c / N) * W;
    const ticks = []; const step = P <= 6 ? 1 : P <= 12 ? 2 : 3;
    for (let h = 0; h <= P; h += step) ticks.push(`<line x1="${x(h * 2)}" y1="20" x2="${x(h * 2)}" y2="58" stroke="currentColor" stroke-opacity=".35"/><text x="${x(h * 2)}" y="74" font-size="11" text-anchor="middle" fill="currentColor">${S + h}時</text>`);
    const rain = segs.map(([s, l]) => `<rect x="${x(s)}" y="24" width="${x(s + l) - x(s)}" height="30" rx="3" fill="#2f6db3" stroke="#123554"/><rect x="${x(s)}" y="24" width="${x(s + l) - x(s)}" height="30" rx="3" fill="url(#rp)"/>`).join("");
    return `<svg viewBox="0 0 320 80" role="img" aria-label="雨の時間の図" data-a11y-keepcolor><defs><pattern id="rp" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(20)"><line x1="0" y1="0" x2="0" y2="6" stroke="#ffffff" stroke-opacity=".55" stroke-width="1.5"/></pattern></defs><rect x="20" y="24" width="${W}" height="30" fill="#f0eadb" stroke="#8a7f66"/>${rain}${ticks.join("")}</svg>`;
  }
  const segText = (S, segs) => segs.map(([s, l]) => `${hm(S, s)}〜${hm(S, s + l)}`).join("・");
  // 時の問題を作る。kind(R, N, q, h) が雨のまとまりを返す（作れなければ null）
  function tokiQ(gen, ans, grp, periods) {
    return (R) => {
      const ps = periods || PERIODS;
      for (let t = 0; t < 40; t++) {
        const [P, S] = ps[ri(R, 0, ps.length - 1)], N = P * 2, segs = gen(R, N, N / 4, N / 2);
        if (!segs) continue;
        const total = segs.reduce((a, b) => a + b[1], 0);
        return {
          type: "toki", media: "天気予報の言葉", ask: "予報の言葉は？",
          q: `${P}時間の予報（${S}時〜${S + P}時）。雨は ${segText(S, segs)}。`,
          svg: timeline(P, S, segs), facts: { P, S, segs, total },
          opts: T_OPTS.slice(), ans, grp, g2: G_TOKI.slice(), ask2: "決め手は？",
          gwhy: `この雨は${grp === "c1" || grp === "c4" ? "切れ間が1時間未満なので「連続的」" : "切れ間が1時間以上なので「断続的」"}。合わせて${dur(total)}で、期間${P}時間の${grp === "c1" || grp === "c4" ? `1/4（${dur(N / 4)}）${grp === "c1" ? "未満" : "以上"}` : `1/2（${dur(N / 2)}）${grp === "i2" ? "未満" : "以上"}`}です。`,
          v: `${P}:${segs.map((x) => x.join(".")).join("-")}`,
        };
      }
      return null;
    };
  }

  // ---- 気温に関する用語 ----
  const HOT = ["呼び名なし", "夏日", "真夏日", "猛暑日", "酷暑日"]; // 下から（画面の選び肢はわざと混ぜる）
  const HOT_KEY = [null, "natsu", "manatsu", "mosho", "kokusho"];
  const hotOf = (x10) => (x10 >= 400 ? 4 : x10 >= 350 ? 3 : x10 >= 300 ? 2 : x10 >= 250 ? 1 : 0); // 0.1度を1として整数で比べる
  const t1 = (x10) => (x10 < 0 ? "−" : "") + (Math.abs(x10) / 10).toFixed(1);
  // vals：最高気温（0.1度単位の整数）の候補
  function hotQ(vals, lv) {
    return (R) => {
      const x = vals[ri(R, 0, vals.length - 1)], a = hotOf(x);
      const others = [0, 1, 2, 3, 4].filter((i) => i !== a), near = others.filter((i) => Math.abs(i - a) === 1);
      // やさしいは選び肢3つ、ふつう・むずかしいは4つ（となりの呼び名を1つ必ず入れる）
      let ds;
      if (lv === 0) ds = pickN(R, others, 2);
      else { const nb = pickN(R, near, 1); ds = [...nb, ...pickN(R, others.filter((i) => !nb.includes(i)), 2)]; }
      // 2段目：線のすぐそば（ちょうど・0.1度下）に動かすと？（25度以上だけ。呼び名なしは2段目の選び肢に無い）
      const lines = [250, 300, 350, 400], L = lines[ri(R, 0, 3)], dn = ri(R, 0, 1);
      let y = dn && L > 250 ? L - 1 : L; if (y === x) y = y === L ? (L > 250 ? L - 1 : L + 1) : L;
      const b = hotOf(y);
      return {
        type: "kion", media: "最高気温", ask: "いちばん暑い呼び名は？",
        q: `この日の最高気温は ${t1(x)}度。`,
        svg: thermo(x, null), facts: { hi: x },
        opts: shuffle(R, [a, ...ds]).map((i) => HOT[i]), ans: HOT[a], grp: HOT_KEY[b], g2: G_NATSU.slice(),
        ask2: `では、最高気温が ${t1(y)}度なら？`,
        gwhy: `${t1(y)}度は${HOT[b]}（日最高気温が${[0, 25, 30, 35, 40][b]}度以上）。線をまたぐと、0.1度でも呼び名が変わります。`,
        v: `${x}:${y}:${ds.join(".")}`,
      };
    };
  }
  const COLD = ["真冬日", "冬日", "どちらでもない"];
  const coldOf = (lo, hi) => (hi < 0 ? 0 : lo < 0 ? 1 : 2);
  const COLD_KEY = ["mafuyu", "fuyu", "nofuyu"];
  // los・his：最低・最高気温（0.1度単位）の候補
  function coldQ(los, his) {
    return (R) => {
      let lo = los[ri(R, 0, los.length - 1)], hi = his[ri(R, 0, his.length - 1)];
      if (lo > hi) [lo, hi] = [hi, lo];
      const a = coldOf(lo, hi);
      // 2段目：どちらか1つだけを0度のすぐそばに動かすと？
      const cand = [["lo", 0], ["lo", -1], ["hi", -1], ["hi", 0]].filter(([w, v]) => (w === "lo" ? v <= hi && v !== lo : lo <= v && v !== hi));
      const [w, v] = cand[ri(R, 0, cand.length - 1)], lo2 = w === "lo" ? v : lo, hi2 = w === "hi" ? v : hi, b = coldOf(lo2, hi2);
      return {
        type: "kion", media: "最低気温と最高気温", ask: "いちばん寒い呼び名は？",
        q: `この日の最低気温は ${t1(lo)}度、最高気温は ${t1(hi)}度。`,
        svg: thermo(hi, lo), facts: { lo, hi },
        opts: COLD.slice(), ans: COLD[a], grp: COLD_KEY[b], g2: G_FUYU.slice(),
        ask2: `では、${w === "lo" ? "最低" : "最高"}気温だけ ${t1(v)}度なら？`,
        gwhy: `最低 ${t1(lo2)}度・最高 ${t1(hi2)}度は「${COLD[b]}」。真冬日は日最高気温が0度未満、冬日は日最低気温が0度未満の日。0.0度は「0度未満」に入りません。`,
        v: `${lo}:${hi}:${w}${v}`,
      };
    };
  }
  // 温度計の絵（横向き。線と温度を文字でも書く。色だけで伝えない）
  function thermo(hi, lo) {
    const cold = lo != null, a = cold ? -150 : 150, b = cold ? 150 : 450, x = (v) => 20 + ((Math.max(a, Math.min(b, v)) - a) / (b - a)) * 280;
    const lines = (cold ? [0] : [250, 300, 350, 400]).map((v) => `<line x1="${x(v)}" y1="30" x2="${x(v)}" y2="54" stroke="currentColor" stroke-opacity=".6" stroke-dasharray="3 2"/><text x="${x(v)}" y="68" font-size="11" text-anchor="middle" fill="currentColor">${v / 10}度</text>`).join("");
    const mark = (v, lab, c, up) => `<path d="M${x(v)} ${up ? 30 : 54} l-5 ${up ? -8 : 8} h10 z" fill="${c}"/><text x="${Math.min(260, Math.max(40, x(v)))}" y="${up ? 16 : 78}" font-size="12" font-weight="700" text-anchor="middle" fill="currentColor">${lab} ${t1(v)}度</text>`;
    return `<svg viewBox="0 0 320 ${cold ? 84 : 72}" role="img" aria-label="温度計の図" data-a11y-keepcolor><rect x="20" y="36" width="280" height="12" rx="6" fill="#f0eadb" stroke="#8a7f66"/><rect x="20" y="36" width="${x(hi) - 20}" height="12" rx="6" fill="#d9734f"/>${lines}${mark(hi, "最高", "#b23a24", true)}${cold ? mark(lo, "最低", "#2f6db3", false) : ""}</svg>`;
  }
  const range = (a, b) => { const o = []; for (let v = a; v <= b; v++) o.push(v); return o; };

  // id：種類、lv：難しさ、name：帳に出す名前、look：1回目のヒント、key：2回目のヒント（資料の言葉）、why：説明（資料の名前を書く）、src：出典、make：問題を作る
  const K = (id, lv, src, name, look, key, why, make) => ({ id, lv, src: [src], name, look, key, why, make });
  const KEY_ICHIJI = "一時：現象が連続的に起こり、その現象の発現期間が予報期間の1/4未満のとき。";
  const KEY_TOKI = "時々：現象が断続的に起こり、その現象の発現期間の合計時間が予報期間の1/2未満のとき。";
  const KEY_REN = "「連続的」は現象の切れ間がおよそ1時間未満、「断続的」は切れ間がおよそ1時間以上。";
  const KEY_HOT = "夏日は日最高気温が25度以上、真夏日は30度以上、猛暑日は35度以上、酷暑日は40度以上の日。";
  const KEY_COLD = "冬日は日最低気温が0度未満の日。真冬日は日最高気温が0度未満の日。";
  const KINDS = [
    // ---- やさしい ----
    K("ichiji", 0, "toki", "ひと続きの短い雨", "雨はひと続き。期間の何分の1？", KEY_ICHIJI,
      "ひと続きの雨が予報期間の1/4未満なら「一時」（気象庁 予報用語）。",
      tokiQ((R, N, q) => place(R, N, [ri(R, 1, q - 1)], 0), "一時 雨", "c1")),
    K("tokidoki", 0, "toki", "切れ間のある雨", "雨と雨のあいだが1時間以上あります。", KEY_TOKI,
      "切れ間が1時間以上ある雨が、合わせて予報期間の1/2未満なら「時々」（気象庁 予報用語）。",
      tokiQ((R, N, q, h) => { const k = ri(R, 2, N >= 24 ? 3 : 2), tot = ri(R, k, Math.min(h - 1, k * 3)); return place(R, N, split(R, tot, k, 1), 3); }, "時々 雨", "i2")),
    K("zutto", 0, "toki", "長く続く雨", "雨は期間の半分より長く続きます。", KEY_ICHIJI,
      "ひと続きの雨が予報期間の1/4以上なら「一時」ではありません。半分をこえて降るなら、ただの「雨」です（気象庁 予報用語）。",
      tokiQ((R, N, q, h) => place(R, N, [ri(R, h, N)], 0), "どちらでもない", "c4")),
    K("natsu", 0, "kion", "夏日", "25度・30度の線を見ます。", KEY_HOT,
      "日最高気温が25度以上で30度未満なら「夏日」（気象庁 予報用語）。",
      hotQ(range(255, 294), 0)),
    K("manatsu", 0, "kion", "真夏日", "30度・35度の線を見ます。", KEY_HOT,
      "日最高気温が30度以上で35度未満なら「真夏日」（気象庁 予報用語）。",
      hotQ(range(305, 344), 0)),
    K("mosho", 0, "kion", "猛暑日", "35度・40度の線を見ます。", KEY_HOT,
      "日最高気温が35度以上で40度未満なら「猛暑日」（気象庁 予報用語）。",
      hotQ(range(355, 394), 0)),
    K("fuyu", 0, "kion", "冬日", "最低気温だけが0度より下です。", KEY_COLD,
      "日最低気温が0度未満で、最高気温は0度以上なら「冬日」（気象庁 予報用語）。",
      coldQ(range(-50, -5), range(30, 120))),
    // ---- ふつう ----
    K("c-mid", 1, "toki", "1/4をこえる、ひと続きの雨", "ひと続きの雨。1/4より長い？", KEY_ICHIJI,
      "ひと続きの雨が予報期間の1/4以上なら「一時」ではありません。1/2未満なら、降る時間帯を言う決まりです（気象庁 予報用語）。",
      tokiQ((R, N, q, h) => (h - 1 >= q + 1 ? place(R, N, [ri(R, q + 1, h - 1)], 0) : null), "どちらでもない", "c4")),
    K("i-short", 1, "toki", "短い雨が2回", "短くても、切れ間が1時間以上あります。", KEY_TOKI,
      "切れ間が1時間以上ある雨は「断続的」。短くても「一時」でなく「時々」です（気象庁 予報用語）。",
      tokiQ((R, N, q) => place(R, N, split(R, Math.max(2, ri(R, 2, q - 1)), 2, 1), 3), "時々 雨", "i2")),
    K("i-long", 1, "toki", "切れ間があるが長い雨", "切れ間はあります。合わせると何時間？", KEY_TOKI,
      "切れ間がある雨でも、合わせて予報期間の1/2以上なら「時々」ではありません（気象庁 予報用語）。",
      tokiQ((R, N, q, h) => { const k = 2, max = N - 3; if (max < h + 1) return null; return place(R, N, split(R, ri(R, h + 1, Math.min(max, h + 6)), k, 1), 3); }, "どちらでもない", "i4")),
    K("kokusho", 1, "kion", "酷暑日", "40度の線を見ます。", KEY_HOT,
      "日最高気温が40度以上なら「酷暑日」（気象庁 予報用語。2026年4月に名前が決まりました）。",
      hotQ(range(401, 418), 1)),
    K("nashi", 1, "kion", "夏日に届かない日", "25度の線を見ます。", KEY_HOT,
      "日最高気温が25度未満なら、夏日・真夏日・猛暑日・酷暑日のどれでもありません（気象庁 予報用語）。",
      hotQ(range(180, 244), 1)),
    K("mafuyu", 1, "kion", "真冬日", "最高気温も0度より下です。", KEY_COLD,
      "日最高気温が0度未満なら「真冬日」。冬日より寒い呼び名です（気象庁 予報用語）。",
      coldQ(range(-120, -50), range(-40, -5))),
    K("fuyu-no", 1, "kion", "冬日でない寒い日", "最低気温は0度より上です。", KEY_COLD,
      "日最低気温が0度以上なら、冬日でも真冬日でもありません（気象庁 予報用語）。",
      coldQ(range(5, 60), range(80, 150))),
    // ---- むずかしい（線のちょうど上・すぐ下） ----
    K("just-q", 2, "toki", "ちょうど1/4の雨", "「1/4未満」は、ちょうど1/4を含みません。", KEY_ICHIJI,
      "「一時」は1/4「未満」。ひと続きの雨がちょうど1/4なら「一時」ではありません（気象庁 予報用語）。",
      tokiQ((R, N, q) => place(R, N, [q], 0), "どちらでもない", "c4")),
    K("gap30", 2, "toki", "30分だけ止む雨", "切れ間は1時間より短い。ひと続きと見ます。", KEY_REN,
      "切れ間が1時間未満なら「連続的」。合わせて1/4未満なら「時々」でなく「一時」です（気象庁 予報用語）。",
      tokiQ((R, N, q) => { const k = 2, span = ri(R, 3, q - 1), lens = split(R, span - (k - 1), k, 1); return place(R, N, lens, 1, true); }, "一時 雨", "c1", PERIODS.slice(1))),
    K("just-h", 2, "toki", "ちょうど半分の雨", "「1/2未満」は、ちょうど1/2を含みません。", KEY_TOKI,
      "「時々」は合わせて1/2「未満」。切れ間のある雨がちょうど1/2なら「時々」ではありません（気象庁 予報用語）。",
      tokiQ((R, N, q, h) => place(R, N, split(R, h, 2, 1), 3), "どちらでもない", "i4")),
    K("line-on", 2, "kion", "ちょうど線の上の日", "「以上」は、ちょうどの温度を含みます。", KEY_HOT,
      "「以上」なので、ちょうど25.0度・30.0度・35.0度・40.0度は、その呼び名に入ります（気象庁 予報用語）。",
      hotQ([250, 300, 350, 400], 2)),
    K("line-below", 2, "kion", "線の0.1度下の日", "0.1度でも線の下です。", KEY_HOT,
      "24.9度・29.9度・34.9度・39.9度は、線に0.1度届かないので、一つ下の呼び名です（気象庁 予報用語）。",
      hotQ([249, 299, 349, 399], 2)),
    K("zero-min", 2, "kion", "最低気温ちょうど0度", "「0度未満」は0.0度を含みません。", KEY_COLD,
      "冬日は最低気温が0度「未満」。ちょうど0.0度なら冬日ではありません（気象庁 予報用語）。",
      coldQ([0], range(30, 100))),
    K("zero-max", 2, "kion", "最高気温ちょうど0度", "最高気温0.0度は「0度未満」ではありません。", KEY_COLD,
      "真冬日は最高気温が0度「未満」。ちょうど0.0度なら真冬日でなく、最低が0度未満なら冬日です（気象庁 予報用語）。",
      coldQ(range(-60, -10), [0])),
  ];
  const BY = Object.fromEntries(KINDS.map((k) => [k.id, k]));
  const kindsOf = (lv, date) => KINDS.filter((k) => k.lv === lv && (!date || !k.since || k.since <= date)).map((k) => k.id);

  // part:seedOf:begin（shared-workflows の template/parts/data/seedOf.js の写し。ここでは直さない。node scripts/sync-template.mjs で写す）
  function seedOf(str) { let h = 2166136261; for (const ch of String(str)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
  // part:seedOf:end
  // part:rng:begin（shared-workflows の template/parts/data/rng.js の写し。ここでは直さない。node scripts/sync-template.mjs で写す）
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  // part:rng:end

  // 1問を作る。tag は「種類|種」（例 "ichiji|2026-11-28:d0"）。同じ tag ならいつも同じ問題
  function make(tag) {
    const [kind] = String(tag).split("|"), k = Object.prototype.hasOwnProperty.call(BY, kind) ? BY[kind] : null;
    if (!k) return null;
    const p = k.make(rng(seedOf(tag)), k.lv);
    if (!p) return null;
    return { tag, kind, lv: k.lv, name: k.name, look: k.look, key: k.key, why: k.why, src: k.src.map((s) => SRC[s]), ...p };
  }
  // 同じ問題かを見分ける鍵（種類・言い方・選び肢の組・2段目）
  const keyOf = (P) => `${P.kind}:${P.q}:${P.opts.slice().sort().join("/")}:${P.ask2}`;

  // 今日の5問（やさしい2・ふつう2・むずかしい1）。種類は重ねない
  function dailyTags(date) {
    const R = rng(seedOf("day:" + date)), e = pickN(R, kindsOf(0, date), 2), n = pickN(R, kindsOf(1, date), 2), h = pickN(R, kindsOf(2, date), 1);
    return [...e, ...n, ...h].map((id, i) => `${id}|${date}:d${i}`);
  }
  // 上級の3問（むずかしいだけ・今日の5問のむずかしいとは別の種類）
  function hardTags(date) {
    const dh = dailyTags(date)[4].split("|")[0], R = rng(seedOf("hard:" + date)), h = pickN(R, kindsOf(2, date).filter((x) => x !== dh), 3);
    return h.map((id, i) => `${id}|${date}:h${i}`);
  }
  // 今日の砂山のお題（だれでも同じ）
  const themeOf = (date) => THEME_DAY[seedOf("theme:" + date) % THEME_DAY.length];

  const SNY = { KINDS, BY, GROUPS, GRP_OF, GRP_WHY, LV, SRC, MORE, THEMES, THEME_BY, FINE_MAX, HOT, COLD, T_OPTS, kindsOf, seedOf, rng, make, keyOf, dailyTags, hardTags, themeOf, pickN, hotOf, coldOf };
  if (typeof module !== "undefined" && module.exports) module.exports = SNY; else root.SNY = SNY;
})(typeof self !== "undefined" ? self : this);
