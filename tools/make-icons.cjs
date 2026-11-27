// アプリのアイコン（icon-192.png・icon-512.png）を作る。こげ茶の地に、砂山と1粒（どこから砂山？）。
// 使い方: node tools/make-icons.cjs（qa/ の playwright を使う）
const path = require("path");
const { chromium } = require(path.join(__dirname, "..", "qa", "node_modules", "playwright"));
(async () => {
  const b = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  for (const s of [192, 512]) {
    const p = await b.newPage({ viewport: { width: s, height: s } });
    await p.setContent(`<body style="margin:0"><svg width="${s}" height="${s}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" fill="#3d2c0e"/>
      <path d="M12 78 Q50 18 88 78 Z" fill="#d9a948"/><path d="M12 78 Q50 18 88 78" fill="none" stroke="#fbe7b5" stroke-width="2"/>
      <circle cx="40" cy="60" r="2" fill="#7a5717"/><circle cx="55" cy="52" r="2" fill="#7a5717"/><circle cx="63" cy="66" r="2" fill="#7a5717"/><circle cx="47" cy="70" r="2" fill="#7a5717"/>
      <circle cx="82" cy="30" r="5" fill="#fbe7b5"/><rect x="8" y="80" width="84" height="4" rx="2" fill="#b23a24"/></svg></body>`);
    await p.screenshot({ path: path.join(__dirname, "..", `icon-${s}.png`), clip: { x: 0, y: 0, width: s, height: s } });
  }
  await b.close();
})();
