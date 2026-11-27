// SNS で貼られたときの絵（og.png 1200×630）を作る。今日の問題（答え）は入れず、遊び方の例だけ（問題データにない言い方で、正解の印も付けない。CodeRabbit mansion-kimari#1）。
// 使い方: node tools/make-og.cjs（qa/ の playwright を使う）
const path = require("path");
const { chromium } = require(path.join(__dirname, "..", "qa", "node_modules", "playwright"));
(async () => {
  const b = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
  const btn = (mk, t) => `<div style="flex:1;font-size:30px;font-weight:900;padding:14px 8px;border-radius:12px;background:#fff;border:3px solid #1d2a3f;text-align:center">${mk}<br>${t}</div>`;
  let dots = ""; let seed = 7; const R = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let n = 0; n < 420;) { const x = (R() * 2 - 1) * 230, y = R() * 140; if (y <= 140 * (1 - (x / 230) ** 2)) { dots += `<circle cx="${290 + x}" cy="${190 - y}" r="4" fill="#b88a2e" stroke="#6b4f1d" stroke-width="1"/>`; n++; } }
  await p.setContent(`<body style="margin:0;font-family:'Noto Sans CJK JP','IPAPGothic',sans-serif">
  <div style="width:1200px;height:630px;box-sizing:border-box;padding:48px 64px;background:#f3efe4;color:#1d2a3f;display:flex;gap:48px;align-items:center">
    <div style="flex:0 0 420px">
      <div style="font-size:30px;color:#83261a;letter-spacing:.06em">砂山のパラドックス</div>
      <div style="font-size:84px;font-weight:900;margin-top:8px;line-height:1.15;color:#123554">どこから<br><span style="color:#8a6416">砂山？</span></div>
      <div style="font-size:36px;margin-top:14px">1粒ずつ減らすと<br>どこで変わる？</div>
    </div>
    <div style="flex:1;background:#fffdf7;border:4px solid #1d2a3f;border-radius:16px;overflow:hidden">
      <svg width="580" height="210" viewBox="0 0 580 210" style="display:block;background:#f6eedb">${dots}</svg>
      <div style="display:flex;gap:10px;padding:16px">${btn("⛰", "砂山")}${btn("✕", "ちがう")}${btn("？", "分からない")}</div>
    </div>
  </div></body>`);
  await p.screenshot({ path: path.join(__dirname, "..", "og.png") });
  await b.close();
})();
