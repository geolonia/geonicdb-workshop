# 名古屋市オープンデータ可視化ワークショップ

名古屋市のオープンデータを **GeonicDB**（FIWARE Orion 互換の Context Broker）に取り込み、
**Geolonia Maps** の地図で可視化する Web アプリを、AI にコードを書かせながら作ります。

作るもの: 名古屋市の**応急給水施設 617 か所**（災害時に水をもらえる場所）のマップ。

- 地図は **Geolonia Maps**（`@geolonia/embed`）
- データの投入は **geonicdb-cli**（`geonic`）
- 画面は React + TypeScript + Vite
- **すべて無料プランで完走できます**（クレジットカード登録なし）

このリポジトリは「地図が最初から表示される」状態まで出来ています。皆さんがやるのは
**データを入れること**と**画面を作り込むこと**です。

---

## 0. 準備するもの

| 必要なもの | 備考 |
|---|---|
| Node.js 20 以上 | `node -v` で確認 |
| Git / GitHub アカウント | テンプレートの複製と公開に使う |
| Google アカウント | AI（Gemini CLI）のログインに使う。無料 |
| 接続情報カード | 当日配布。GeonicDB の URL とテナント名、API キーが書いてあります |

AI のセットアップ（1 回だけ）:

```bash
npm install -g @google/gemini-cli
gemini            # 初回はブラウザが開くので Google アカウントでログイン
```

> 無料枠は 1 日 1,000 リクエスト。ワークショップ中に使い切ることはまずありません。
> Cursor / Claude Code / GitHub Copilot を使い慣れている方はそれでも構いません。
> このリポジトリには `AGENTS.md` `CLAUDE.md` `.cursorrules` を同じ内容で置いてあるので、
> どのツールでもプロジェクトのルールが読まれます。

---

## 1. 自分のリポジトリを作る

このページ右上の **「Use this template」→「Create a new repository」** を押して、
自分のアカウントにコピーを作ります。そのあと:

```bash
git clone https://github.com/<あなたのユーザー名>/<リポジトリ名>.git
cd <リポジトリ名>
npm install
```

---

## 2. 接続先を設定して地図を出す

```bash
cp .env.example .env.local
```

`.env.local` を開き、配布カードの値を貼ります。

```bash
VITE_GEONICDB_URL=https://geonicdb.geolonia.com
VITE_GEONICDB_TENANT=あなたのテナント名
VITE_GEOLONIA_API_KEY=YOUR-API-KEY
```

`VITE_GEOLONIA_API_KEY` はそのままで OK です（`YOUR-API-KEY` は localhost や
GitHub Pages でそのまま使える開発用キーです）。

```bash
npm run dev
```

http://localhost:5173 を開くと、**名古屋の地図**と「データを取得できませんでした」が出ます。
データがまだ空なので正常です。ここまで来たら第一関門クリアです。

---

## 3. CLI で GeonicDB に触ってみる

`geonic` は GeonicDB の公式 CLI です（このリポジトリに同梱済み。`npx geonic` で動きます）。

```bash
# 接続先を保存する（以降 --url を省略できる）
npx geonic config set url https://geonicdb.geolonia.com

# 自分が誰として認証されているか確認
npx geonic me --api-key <配布カードの API キー> --service <テナント名>
```

毎回オプションを書くのが面倒なので、環境変数にしておきます。

```bash
export GEONIC_API_KEY=<配布カードの API キー>
export GEONIC_TENANT=<テナント名>
alias g="npx geonic --api-key $GEONIC_API_KEY --service $GEONIC_TENANT"
```

試しに 1 件だけ手で入れて、消してみましょう。

```bash
g entities create '{
  "id": "urn:ngsi-ld:EmergencyWaterSupply:test:1",
  "type": "EmergencyWaterSupply",
  "name": { "type": "Property", "value": "テスト給水栓" },
  "location": { "type": "GeoProperty",
    "value": { "type": "Point", "coordinates": [136.9066, 35.1815] } }
}'

g entities list --type EmergencyWaterSupply --local
g entities list --type EmergencyWaterSupply --local -f geojson   # GeoJSON でも出せる
g entities delete urn:ngsi-ld:EmergencyWaterSupply:test:1
```

`{ "type": "Property", "value": ... }` という書き方が NGSI-LD の作法です。
位置は `GeoProperty` + GeoJSON で、座標は **[経度, 緯度]** の順です（緯度が先ではありません）。

---

## 4. 本番データを入れる（ここが山場・AI に書かせます）

`data/nagoya-emergency-water-supply.csv` に名古屋市が公開している CSV が入っています。

```bash
head -3 data/nagoya-emergency-water-supply.csv
```

```text
ID,施設名,施設名フリガナ,施設種別,区・町名,住所,緯度,経度
1,東山配水場,ヒガシヤマハイスイジョウ,常設給水栓,名古屋市千種区,田代町四観音道西,35.17342437,136.9550014
```

CLI が読み込めるのは **NDJSON（1 行 1 エンティティ）** なので、CSV を変換する必要があります。
この変換スクリプトを AI に書かせてください。`gemini` を起動して、たとえばこう頼みます。

```text
data/nagoya-emergency-water-supply.csv を NGSI-LD の NDJSON に変換する Node スクリプトを
scripts/csv-to-ngsild.mjs に作ってください。仕様は AGENTS.md の「データモデル」に従うこと。
外部パッケージは使わず、node 標準モジュールだけで書いてください。
```

できたら実行して、投入します。

```bash
node scripts/csv-to-ngsild.mjs data/nagoya-emergency-water-supply.csv > entities.ndjson
wc -l entities.ndjson          # 617 になるはず

g import entities.ndjson --dry-run     # まず何が送られるか確認
g import entities.ndjson --batch-size 100
```

```text
Imported: 617 succeeded, 0 failed, 0 skipped across 7 chunk(s).
```

ブラウザに戻ると **617 件**の点が地図に出ます。ここが本日のメインイベントです。

> `--batch-size` は無料プランの上限（100 件/リクエスト）に合わせています。
> 大きくすると 400 が返ります。

---

## 5. 画面を作り込む

ここから先は自由時間です。`src/App.tsx` の `TODO` に課題が並んでいます。
AI に日本語で頼んでいけば進みます。頼み方の例:

```text
施設種別（常設給水栓 / 地下式給水栓 / 仮設給水栓）で表示を絞り込むチェックボックスを
サイドパネルに追加してください。件数バッジも出してください。
```

```text
「現在地から近い順」ボタンを付けてください。ブラウザの位置情報を取り、
src/lib/geonicdb.ts の fetchNearby() を使って半径 3km 以内を近い順に一覧表示します。
位置情報が拒否された場合は名古屋市役所を現在地として扱ってください。
```

変更したら必ず通しておきます。

```bash
npm run lint
npm run build
```

**`src/components/MapView.tsx` は完成済みなので触らなくて大丈夫です**（地図の初期化は
React だと壊しやすいので、こちらで用意しました）。

---

## 6. インターネットに公開する

GitHub Pages で公開できます。

1. リポジトリの **Settings → Pages → Build and deployment → Source** を **GitHub Actions** にする
2. `git push` する（`main` への push で自動デプロイされます）
3. `https://<ユーザー名>.github.io/<リポジトリ名>/` を開く

> `.env.local` は git に入りません（公開されません）。GitHub Pages 用の接続先は
> リポジトリの **Settings → Secrets and variables → Actions → Variables** に
> `VITE_GEONICDB_URL` と `VITE_GEONICDB_TENANT` を登録してください。
> ブラウザ側は匿名の読み取り専用で接続するので、API キーを公開する必要はありません。

---

## 困ったときは

- [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) — エラーメッセージ別の対処
- [docs/CHEATSHEET.md](docs/CHEATSHEET.md) — `geonic` コマンドと NGSI-LD の早見表
- [docs/WORKSHOP.md](docs/WORKSHOP.md) — 当日の進行

## データの出典

名古屋市「応急給水施設一覧表」（[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/deed.ja)）
— 詳細は [data/README.md](data/README.md)

## ライセンス

このテンプレートのコードは MIT ライセンスです。
