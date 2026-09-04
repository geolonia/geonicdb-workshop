# AI エージェント向けの指示

このリポジトリは**オープンデータを地図で可視化するワークショップ用テンプレート**です。
対象地域・データセットは開催回ごとに変わります（`workshop.config.json` を参照）。
コードを書く前にこのファイルを最後まで読んでください。

このファイルは opencode が標準で読み込むルールファイルです（`CLAUDE.md` / `.cursorrules` は同じ内容の複製）。

## スタック

- React 19 + TypeScript + Vite
- 地図: **Geolonia Maps**（`@geolonia/embed` の `/core` エントリ）
- データ: **GeonicDB**（FIWARE Orion 互換 Context Broker、NGSI-LD API）
- SDK: `@geolonia/geonicdb-sdk`（ブラウザ側は匿名の読み取り専用）
- データ投入: `geonicdb-cli`（コマンド名は `geonic`）
- 開催回ごとの設定: `workshop.config.json`（対象地域、データセット、地図の中心座標、
  表示項目、出典表示。`src/lib/config.ts` 経由で読む）

## 絶対に守ること

1. **地図は Geolonia Maps を使う。** MapLibre GL JS を直接使ったり、Google Maps / Leaflet /
   react-map-gl に差し替えたりしないこと。
2. **`src/components/MapView.tsx` は完成済み。** 原則として書き換えない。地図の見た目
   （レイヤーの色・半径など）を変える必要があるときだけ、そのファイル内の `paint` を編集する。
   新しい地図コンポーネントを作らないこと。色分けのルールは `workshop.config.json` の
   `map.colors` / `map.defaultColor` で調整できる。
3. Geolonia Maps の API を調べる必要が出たら、**まず `https://docs.geolonia.com/llms-full.txt`
   を取得**して最新仕様を確認する。記憶で書かない。
4. **GeonicDB へのアクセスは `src/lib/geonicdb.ts` 経由に集約する。** コンポーネントから
   直接 `fetch` しない。
5. **API キーや秘密情報をコードに書かない。** ブラウザ側は `anonymous: true` の匿名接続で
   読み取りだけを行う。書き込みは CLI（API キー認証）で行う。
6. `.env.local` を git に追加しない。
7. 変更後は **`npm run lint` と `npm run build` を通す**。`noUnusedLocals` が有効なので
   未使用の変数・引数はビルドエラーになる。
8. コメントは日本語で、既存ファイルの粒度に合わせて書く。
9. **対象地域・データセット名をコードやドキュメントに決め打ちで書かない。** 都市名や
   データセット名は `workshop.config.json` に集約し、それ以外の場所からは参照する形にする。

## データモデル

エンティティ型は `workshop.config.json` の `entityType` で決める（既定は `Facility`）。
以下は一般的な例（実際のフィールド名は対象データセットに合わせて変える）。

```jsonc
{
  "id": "urn:ngsi-ld:Facility:1",          // CSV の ID 列を使う
  "type": "Facility",                       // workshop.config.json の entityType
  "name":     { "type": "Property", "value": "○○センター" },
  "category": { "type": "Property", "value": "種別A" },
  "address":  { "type": "Property", "value": "○○町1-2-3" },
  "location": {
    "type": "GeoProperty",
    "value": { "type": "Point", "coordinates": [139.767, 35.681] }
  }
}
```

- 属性は `{ type, value }` の形。`type` は `Property` / `GeoProperty` / `Relationship`。
- 位置は必ず `location` という名前の `GeoProperty` にする（SDK / Geo-query の既定名）。
- 座標は GeoJSON なので **`[経度, 緯度]`** の順。多くの CSV は「緯度, 経度」の順に
  並んでいるので入れ替えが必要。ここを間違えると点が海の上や外国に出る。
- 画面の詳細パネルに出す属性は `workshop.config.json` の `fields` で決める
  （`src/App.tsx` はそこに列挙されたキーをそのまま表示するだけ）。
- CSV の文字コードは事前に確認する。UTF-8 (BOM 付き) のことが多いが、
  Shift_JIS (CP932) のデータセットも珍しくない。

## GeonicDB の読み取り（`src/lib/geonicdb.ts`）

```ts
db.getEntities({
  type: ENTITY_TYPE,      // workshop.config.json の entityType
  options: 'keyValues',   // 属性が { type, value } ではなく値そのものになる
  limit: 1000,            // サーバー側の 1 リクエスト上限
  offset: 0,
})
```

Geo-query は `georel` / `geometry` / `coordinates` を **3 つセットで**指定する
（部分指定はサーバーが 400 を返す）。

```ts
db.getEntities({
  type: ENTITY_TYPE,
  georel: 'near;maxDistance==3000',   // メートル。区切りは == （: ではない）
  geometry: 'Point',
  coordinates: '[139.767,35.681]',    // [経度, 緯度]
  orderByDistance: true,              // 近い順に並ぶ
})
```

## 無料プラン（T0）の制約 — 超えると失敗する

| 項目 | 上限 |
|---|---|
| エンティティ数 | **1,000 件** |
| 1 リクエストの件数 | **100 件**（`geonic import --batch-size 100`） |
| リクエストボディ | 512 KB |
| レート | 300 重み/分・同時 5 |

エンティティを大量生成するコードや、全件を 1 リクエストで送るコードを書かないこと。
データセットを選ぶ／絞り込む段階で 1,000 件以内に収める（`data/README.md` 参照）。

## CLI の使い方

```bash
# 投入（NDJSON = 1 行 1 エンティティ）
npx geonic import entities.ndjson --api-key <KEY> --service <TENANT> --batch-size 100

# 確認
npx geonic entities list --type <ENTITY_TYPE> --local --api-key <KEY> --service <TENANT>

# 何が送られるか確認するだけ（実行しない）
npx geonic import entities.ndjson --dry-run
```

CSV を直接読む機能は CLI にはない。**CSV → NDJSON の変換スクリプトは自分で書く**
（`scripts/csv-to-ngsild.mjs`、node 標準モジュールのみ、外部パッケージ禁止）。

## やってはいけないこと

- `src/components/MapView.tsx` を作り直す / 別の地図ライブラリに置き換える
- ブラウザのコードに API キーを書く、`.env.local` をコミットする
- 1,000 件を超えるエンティティを投入する
- `data/` の CSV を書き換える（出典データはそのまま残す。加工結果は別ファイルに出す）
