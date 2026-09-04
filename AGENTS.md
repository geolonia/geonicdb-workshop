# AI エージェント向けの指示

このリポジトリは**オープンデータを地図で可視化するワークショップ用テンプレート**です。
`src/App.tsx` に地図が 1 つ表示されているだけの、意図的に何もない状態から始まります。
データの取得・表示・画面づくりは、すべてワークショップ当日に AI へ頼んで書きます。

このファイルは opencode が標準で読み込むルールファイルです。`CLAUDE.md` はこのファイルを
参照するだけの短いスタブです。

## MUST（絶対に守ること）

1. **地図は Geolonia Maps を使う。** MapLibre GL JS を直接使ったり、Google Maps / Leaflet /
   react-map-gl に差し替えたりしないこと。`index.html` の `<script>` タグ（CDN）で読み込み済みで、
   `class="geolonia"` を持つ `<div>` が自動的に地図になる（Embed API）。
2. **データは `@geolonia/geonicdb-sdk` 経由で GeonicDB から AJAX 取得する。** 静的ファイルへの
   決め打ちや別データソースへの差し替えをしないこと。SDK はまだ `package.json` に入っていないので、
   データ取得コードを書くときに `npm install @geolonia/geonicdb-sdk` を先に行う。
3. **適切な XACML ポリシーを適用する。** 匿名ロールは読み取り専用（GET のみ）、書き込みは
   API キー経由のみ。ポリシーは主催者がテナントごとに発行済み（`tenantId` 必須）。アプリ側で
   ポリシーを書き換えないこと。
4. **API キーには DPoP（RFC 9449）を使用する。** ワークショップで配布する API キーは
   `--dpop-required` 付きで発行済み。CLI/SDK が透過的に処理するため、アプリ側の追加実装は不要。

## スタック

- React 19 + TypeScript + Vite
- 地図: Geolonia Maps（`index.html` の `<script>` タグで CDN から読み込み、`<div class="geolonia">`
  の data 属性で操作する。プログラマティックに操作したいときだけ `window.geolonia` を使う）
- データ: GeonicDB（FIWARE Orion 互換 Context Broker、NGSI-LD API）、SDK は
  `@geolonia/geonicdb-sdk`（ブラウザ側は匿名の読み取り専用）
- データ投入: `geonicdb-cli`（コマンド名は `geonic`）

## 実装上の注意

- 地図は `index.html` の `<div class="geolonia">`（Embed API）として静的に置いてある。
  React が後から差し込む要素は Embed API の DOM スキャンに間に合わないため、
  `src/App.tsx` 側に地図用の div を書かないこと。
- 開催地・ズームは `index.html` の `<div class="geolonia">` の `data-lat` / `data-lng` /
  `data-zoom` で決める。属性の一覧は Geolonia Maps の Embed API ドキュメントを参照。
- Embed API が作った地図インスタンスを JS から触るときは
  `window.geolonia.registerPlugin((map) => { ... })` で受け取る。
- GeonicDB から取得したエンティティを地図に表示するときは、`data-geojson`（GeoJSON の URL を
  渡す）よりも、地図インスタンスに対して `addSource` / `addLayer` で動的に描画する方法を
  優先する（データがブラウザ内で変わるため）。
- エンティティの属性は `{ type, value }` の形（`type` は `Property` / `GeoProperty` /
  `Relationship`）。位置は `location` という名前の `GeoProperty` にする（SDK / Geo-query の既定名）。
- **座標は `[経度, 緯度]` の順。** 多くの CSV は「緯度, 経度」の順なので入れ替えが必要。
  ここを間違えると点が海の上や外国に出る。
- 無料プラン（T0）の上限はエンティティ **1,000 件**・1 リクエスト **100 件**・ボディ 512 KB。
  超えるコードを書かないこと。
- API キーや秘密情報をコードに書かない。`.env.local` を git に追加しない。
- 変更後は `npm run lint` と `npm run build` を通す（`noUnusedLocals` が有効）。
- コメントは日本語で、既存ファイルの粒度に合わせて書く。
- CSV を NDJSON に変換するスクリプトは自分で書く（`scripts/csv-to-ngsild.mjs`、node 標準
  モジュールのみ、外部パッケージ禁止）。配布 CSV 自体は書き換えない。
