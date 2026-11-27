# AGENTS.md

どこから砂山？：砂山（日によって人だかり・森）を少しずつ減らし、そのたびに「砂山・ちがう・分からない」を答えて自分の境目をさがす（正解の無い問い。砂山のパラドックス）。続けて、気象庁「予報用語」の「一時」「時々」・夏日〜酷暑日・冬日と真冬日のような、はっきり決めた線の問題を1日5問（正解がある）。最後に自分の線と決めた線をくらべる。`index.html` と `data.js`（問題の種類と砂山のお題）を GitHub Pages で公開する。

## 準備（最初に一度）

```bash
bash scripts/setup.sh   # Node.js（版は .nvmrc）を確かめ、検査の依存とブラウザを入れる。何度実行してもよい
```

Claude Code のクラウドセッションでは `.claude/settings.json` のフックが自動で実行する。

## push する前の確認

```bash
node qa/run.mjs   # 問題（21種類×3000問：答えが資料の線どおり・2段目）・砂山の進み方・今日の回と上級（3年分）・とことん・通しで遊ぶ・続きから・復習・幅320px・PWA・引き継ぎ・見やすさ（CI の QA と同じ）
```

## このリポジトリの決まり

- 決めた線の中身は、気象庁「予報用語」の時に関する用語（一時・時々・連続的と断続的）と気温に関する用語（夏日・真夏日・猛暑日・酷暑日・冬日・真冬日）に書いてあることだけ（2026-11-27 に読んだ）。結果の画面の成年18歳は民法 第4条（e-Gov 法令検索）。種類を足すときも資料を読み、`qa/run.mjs` の `TB`（別に書いた答えの決め方）にも足す。用語が変わったら読み直す。
- 砂山には正解を出さない（何粒から砂山かは決まっていない。Hyde & Raffman "Sorites Paradox", スタンフォード哲学百科事典）。砂山の答えは自信をかける・復習・★に入れない（正解が無いため。深さは決めた線の問題だけ）。
- 公式の情報の代わりにしない：遊び方と「このゲームについて」と README に、予報用語を言いかえた文であること・実際は気象庁の発表で確かめることを置く（QA が見る）。
- 2段目：時の問題は「決め手は？」（ひと続き・切れ間あり × 1/4・1/2）、気温の問題は「少しずらすと？」（線のちょうど・0.1度下）。
- 今日の回（砂山1つ＋やさしい2・ふつう2・むずかしい1）・上級（むずかしい3）・砂山のお題は日本時間の日付の種で決まり、だれでも同じ。`Math.random()` は練習・とことんの種だけ。`KINDS`・`THEMES`・`THEME_DAY` は最後に足すだけ（QA の `PIN` が第1回を見る）。`data.js` を変える PR は自動ではマージされない（`hold_paths`）。
- ★はまちがい＋ヒントの数（0で★3・1で★2・2以上で★1）。上級はヒントなし。時間制限なし。
- 好きなだけ遊べる：チケット・ライフ・回数制限・🔒で開くモードを入れない（shared-workflows `routines/game-dev.md` F1〜F7。QA が見る）。練習の砂山は何度でも。
- 記録 `sny-v1`・文字 `sny-fs`・復習 `sny-depth`。`depth.js`・`qa/depth-check.mjs`・見やすさ（`<!-- a11y:begin -->`〜`end`・`qa/a11y.mjs`）・引き継ぎ（`transfer.js`・`qa/transfer-check.mjs`）は shared-workflows `template/` の写しで、ここでは直さない。
- 画面の土台は どこの裁判所？（saibansho-doko）から写した。写し元の言葉が残っていないかを QA が見る。
- 共有は遊ぶ人が押したときに開くリンクだけ。シェアの文に問題・答えを出さない（自分の線は正解の無い答えなので出す）。外へ通信しない（CSP の `connect-src 'self'` を広げない）。
- PWA：画面のファイルを足したら `sw.js` の `SHELL` にも足し、中身を大きく変えたら `CACHE` の版を上げる。アイコンは `node tools/make-icons.cjs`、`og.png` は `node tools/make-og.cjs`。
- 公開リポジトリなので、個人情報・鍵を入れない。

## 公開

- GitHub Pages は `main` のルート（`/`）を公開する。PR の QA と Secret scan が ✅ になると `automerge.yml` が自動でマージする。止めたいときは下書きにするか、ラベル「自動マージしない」を付ける。
- `sw.js`・`manifest.webmanifest`・`data.js` を変える PR は自動ではマージされない（`hold_paths`）。CodeRabbit のレビューを読み、手でマージする直前に今の head へのレビューを読み直す。CodeRabbit は PR に `@coderabbitai review` とコメントして頼む。

## 共通のきまり

- PR の作り方・マージの仕方は satou-aaaaa/shared-workflows の `routines/pr.md`、全体のきまりは `routines/common.md` に従う。
- CI の部品は shared-workflows の共通部品を呼ぶ。リポジトリ側の .github/workflows には呼び出しと設定値だけを書く。
- Claude 以外の AI・人が作業するときは、shared-workflows の `routines/tool-map.md` と `routines/without-claude.md` を読む。
