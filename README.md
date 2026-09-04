# オープンデータ可視化ワークショップ

対象のオープンデータを **GeonicDB**（FIWARE Orion 互換の Context Broker）に取り込み、
**Geolonia Maps** の地図で可視化する Web アプリを、AI にコードを書かせながら作ります。

対象地域・データセットは開催回ごとに異なります。当日の内容は主催者から配布される資料で
確認してください。

- 地図は **Geolonia Maps**（`@geolonia/embed`）
- データの投入は **geonicdb-cli**（`geonic`）
- 画面は React + TypeScript + Vite
- **すべて無料プランで完走できます**（クレジットカード登録なし）

このリポジトリは「地図が 1 つ表示される」状態まで出来ています（`src/App.tsx`）。皆さんがやるのは
**データを入れること**、**それを地図に表示するコードを書くこと**、そして**画面を作り込むこと**です。

---

## 0. 準備するもの

| 必要なもの | 備考 |
|---|---|
| Node.js 20 以上 | `node -v` で確認 |
| GitHub アカウント | テンプレートの複製（自分用リポジトリの作成）に使う |
| GeonicDB のログイン情報 | 主催者から事前に案内済み（ログイン用メールアドレス・パスワード） |

### 0-1. GitHub アカウントの取得

すでにアカウントを持っている方はこの手順は不要です。

1. https://github.com/signup を開く
2. メールアドレス・パスワード・ユーザー名を入力してアカウントを作成する
3. 届いた確認コードをメールから入力する

### 0-2. geonicdb-cli のインストール

`geonic` は GeonicDB の公式 CLI です。グローバルにインストールします。

```bash
npm install -g @geolonia/geonicdb-cli
geonic --version
```

### 0-3. opencode のインストール

このワークショップでは AI に地図表示やデータ変換のコードを書かせます。使う AI ツールは
**opencode**（無料で使えます）です。

```bash
# インストール（npm でも入ります: npm install -g opencode-ai）
curl -fsSL https://opencode.ai/install | bash

# 起動
opencode
```

初回だけ、opencode の中で接続設定をします。

1. `/connect` と入力して **opencode** を選ぶ
2. ブラウザで https://opencode.ai/auth を開いてサインインし、API キーをコピー
3. opencode に戻ってキーを貼る

サインインには GitHub または Google のアカウントを使います。

使うモデルは **Big Pickle**（無料・コンテキスト 200K）です。このリポジトリの
`opencode.json` で指定済みなので、モデルを選ぶ操作は不要です。
切り替えたいときは `/models` で選べます（**無料表示のモデル以外を選ぶと課金対象になります**）。

> Cursor / Claude Code / GitHub Copilot を使い慣れている方はそれでも構いません。
> このリポジトリの `AGENTS.md` は多くのツールが標準で読むファイル名なので、
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

`.env.local` にはデフォルトのテナント名 `chusoku_stg` が入っています。主催者から
別のテナント名が案内されていたら、そちらに書き換えてください。

```bash
VITE_GEONICDB_URL=https://geonicdb.geolonia.com
VITE_GEONICDB_TENANT=chusoku_stg
VITE_GEOLONIA_API_KEY=YOUR-API-KEY
```

`VITE_GEOLONIA_API_KEY` はそのままで OK です（`YOUR-API-KEY` は localhost で
そのまま使える開発用キーです）。

```bash
npm start
```

http://localhost:5173 を開くと、**地図だけが表示された画面**が出ます。まだデータを取得して
表示するコードを書いていないので、これで正常です（エラーも出ません）。
ここまで来たら第一関門クリアです。

表示位置は `index.html` の `<div class="geolonia">` の `data-lat` / `data-lng` / `data-zoom`
で決まっています。開催地に合わせて変えたいときは、この値を書き換えてください。

---

## 3. CLI で GeonicDB にログインする

`geonic`（[0-2. geonicdb-cli のインストール](#0-2-geonicdb-cli-のインストール) 参照）で
GeonicDB にログインします。事前に案内されたメールアドレスとパスワードを使います。

```bash
# 接続先を保存する（以降 --url を省略できる）
geonic config set url https://geonicdb.geolonia.com

# ログイン（メールアドレス・パスワードを対話的に聞かれます）
geonic auth login --tenant chusoku_stg
```

ログインに成功すると、トークンとテナント名が設定に保存されるので、以降のコマンドに
`--api-key` や `--service` を付ける必要はありません。

```bash
geonic me   # 自分が誰として認証されているか確認
```

試しに 1 件だけ手で入れて、消してみましょう（エンティティ型名 `Facility` は例です。
実際に使う型名は主催者の資料に従ってください）。

```bash
geonic entities create '{
  "id": "urn:ngsi-ld:Facility:test:1",
  "type": "Facility",
  "name": { "type": "Property", "value": "テスト施設" },
  "location": { "type": "GeoProperty",
    "value": { "type": "Point", "coordinates": [139.767, 35.681] } }
}'

geonic entities list --type Facility --local
geonic entities list --type Facility --local -f geojson   # GeoJSON でも出せる
geonic entities delete urn:ngsi-ld:Facility:test:1
```

`{ "type": "Property", "value": ... }` という書き方が NGSI-LD の作法です。
位置は `GeoProperty` + GeoJSON で、座標は **[経度, 緯度]** の順です（緯度が先ではありません）。

---

## 4. 本番データを入れる（ここが山場・AI に書かせます）

主催者から配布された CSV をリポジトリ直下に置き、中身を確認します。

```bash
head -3 <データセットのファイル名>.csv
```

CLI が読み込めるのは **NDJSON（1 行 1 エンティティ）** なので、CSV を変換する必要があります。
この変換スクリプトを AI に書かせてください。`opencode` を起動して、たとえばこう頼みます。

```text
<データセットのファイル名>.csv を NGSI-LD の NDJSON に変換する Node スクリプトを
scripts/csv-to-ngsild.mjs に作ってください。仕様は AGENTS.md に従うこと。
外部パッケージは使わず、node 標準モジュールだけで書いてください。
```

できたら実行して、投入します。

```bash
node scripts/csv-to-ngsild.mjs <データセットのファイル名>.csv > entities.ndjson
wc -l entities.ndjson

geonic import entities.ndjson --dry-run     # まず何が送られるか確認
geonic import entities.ndjson --batch-size 100
```

```text
Imported: N succeeded, 0 failed, 0 skipped across N chunk(s).
```

> `--batch-size` は無料プランの上限（100 件/リクエスト）に合わせています。
> 大きくすると 400 が返ります。

これで GeonicDB にはデータが入りましたが、**ブラウザに戻ってもまだ地図には何も出ません**。
`src/App.tsx` がまだ「地図を表示するだけ」の状態で、データを取得して渡すコードを
書いていないからです。ここを AI に書かせます。

```text
src/App.tsx を書き換えて、起動時に GeonicDB からデータを取得し、地図に表示してください。
@geolonia/geonicdb-sdk を使って anonymous:true でエンティティを取得し、GeoJSON に変換して、
window.geolonia.registerPlugin() で受け取った地図インスタンスに addSource / addLayer で
表示してください。仕様は AGENTS.md に従うこと。
```

うまくいくとブラウザに点が出ます。ここが本日のピークです。

---

## 5. 画面を作り込む

ここから先は自由時間です。`src/App.tsx` の `TODO` に課題が並んでいます。
AI に日本語で頼んでいけば進みます。頼み方の例:

```text
種別で表示を絞り込むチェックボックスをサイドパネルに追加してください。
件数バッジも出してください。
```

```text
「現在地から近い順」ボタンを付けてください。ブラウザの位置情報を取り、
GeonicDB の Geo-query（georel=near、orderByDistance）で半径 3km 以内を近い順に一覧表示します。
```

変更したら必ず通しておきます。

```bash
npm run lint
npm run build
```

> ユニットテスト（Vitest）と、Cucumber による基礎的な E2E テスト（地図が表示されるかの確認）も
> 用意してあります。`npm test` でまとめて実行できます（lint → ユニット → E2E の順、
> E2E は内部でビルドしてローカルサーバーを起動します）。個別に実行したいときは
> `npm run test:unit` / `npm run test:e2e` を使ってください。

---

## データの出典

対象データの出典・ライセンスは、主催者の配布資料を参照してください
（CC BY 等で表示が必須な場合は、画面に出典表示を追加してください）。

## ライセンス

このテンプレートのコードは MIT ライセンスです。配布データ自体のライセンスは
主催者の案内に従ってください。
