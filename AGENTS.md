# AI エージェント向けの指示

このリポジトリは**オープンデータを地図で可視化するワークショップ用テンプレート**です。
対象地域・データセットは開催回ごとに変わります（`workshop.config.json` を参照）。

このファイルは opencode が標準で読み込むルールファイルです。`.cursorrules` はこのファイルと
同じ内容の複製、`CLAUDE.md` はこのファイルを参照するだけの短いスタブです。

## MUST（絶対に守ること）

1. **地図は Geolonia Maps を使う。** MapLibre GL JS を直接使ったり、Google Maps / Leaflet /
   react-map-gl に差し替えたりしないこと。スタイルは `geolonia/gsi`（ローカル配置。
   `src/styles/geolonia-gsi.json`、`src/components/MapView.tsx` で読み込み済み）を使う。
2. **データは `@geolonia/geonicdb-sdk` 経由で GeonicDB から AJAX 取得する。** 静的ファイルへの
   決め打ちや別データソースへの差し替えをしないこと。アクセスは `src/lib/geonicdb.ts` に集約する
   （コンポーネントから直接 `fetch` しない）。
3. **適切な XACML ポリシーを適用する。** 匿名ロールは読み取り専用（GET のみ）、書き込みは
   API キー経由のみ。ポリシーは主催者がテナントごとに発行済み（`tenantId` 必須）。アプリ側で
   ポリシーを書き換えないこと。
4. **API キーには DPoP（RFC 9449）を使用する。** ワークショップで配布する API キーは
   `--dpop-required` 付きで発行済み。CLI/SDK が透過的に処理するため、アプリ側の追加実装は不要。

## スタック

- React 19 + TypeScript + Vite
- 地図: Geolonia Maps（`index.html` の `<script>` タグで CDN から読み込み、`window.geolonia`
  として使う。型は `src/types/geolonia.d.ts`）
- データ: GeonicDB（FIWARE Orion 互換 Context Broker、NGSI-LD API）、SDK は
  `@geolonia/geonicdb-sdk`（ブラウザ側は匿名の読み取り専用）
- データ投入: `geonicdb-cli`（コマンド名は `geonic`）
- 開催回ごとの設定: `workshop.config.json`（`src/lib/config.ts` 経由で読む）

## 実装上の注意

- **`src/components/MapView.tsx` は完成済み。** 原則として書き換えない。地図の見た目
  （レイヤーの色・半径など）を変える必要があるときだけ、そのファイル内の `paint` を編集する。
  色分けのルールは `workshop.config.json` の `map.colors` / `map.defaultColor` で調整できる。
- エンティティ型・属性名は `workshop.config.json`（`entityType` / `fields`）で決める。属性は
  `{ type, value }` の形（`type` は `Property` / `GeoProperty` / `Relationship`）。位置は
  `location` という名前の `GeoProperty` にする（SDK / Geo-query の既定名）。
- **座標は `[経度, 緯度]` の順。** 多くの CSV は「緯度, 経度」の順なので入れ替えが必要。
  ここを間違えると点が海の上や外国に出る。
- 無料プラン（T0）の上限はエンティティ **1,000 件**・1 リクエスト **100 件**・ボディ 512 KB。
  超えるコードを書かないこと。
- 対象地域・データセット名をコードやドキュメントに決め打ちで書かない。
  `workshop.config.json` に集約し、それ以外はそこを参照する。
- API キーや秘密情報をコードに書かない。`.env.local` を git に追加しない。
- 変更後は `npm run lint` と `npm run build` を通す（`noUnusedLocals` が有効）。
- コメントは日本語で、既存ファイルの粒度に合わせて書く。
- CSV を NDJSON に変換するスクリプトは自分で書く（`scripts/csv-to-ngsild.mjs`、node 標準
  モジュールのみ、外部パッケージ禁止）。配布 CSV 自体は書き換えない。
