# 困ったときは

エラーメッセージで探してください。上から順に、当日出やすいものを並べています。

## `npm install` が `ERESOLVE could not resolve` で止まる

`.npmrc` を消していないか確認してください。GeonicDB SDK が宣言している
`@geolonia/embed` のバージョン範囲が実際の最新版より古いため、`legacy-peer-deps=true`
で解決だけ緩めています。実行時の互換性には問題ありません。

```bash
cat .npmrc     # legacy-peer-deps=true が入っているはず
```

## 画面に「データを取得できませんでした」と出る

### `Access denied: no applicable policy`

`.env.local` の `VITE_GEONICDB_TENANT` が配布カードのテナント名と一致しているか確認してください。
テナント名が違うと、匿名読み取りを許可したポリシーが適用されず 403 になります。
`.env.local` を書き換えたら **`npm run dev` を再起動**してください（Vite は環境変数を
起動時に読み込みます）。

### `0 件` のまま点が出ない

まだデータが入っていません。README の手順 4（CSV → NDJSON → `geonic import`）を実行してください。
入ったかどうかは CLI で確認できます。

```bash
g entities list --type EmergencyWaterSupply --local --count-only
```

## 地図が真っ白 / グレーのまま

- `VITE_GEOLONIA_API_KEY` を書き換えていませんか。`YOUR-API-KEY` は
  **localhost / GitHub Pages / Vercel / Netlify / Cloudflare Pages でだけ**有効な開発用キーです。
  それ以外のドメイン（独自ドメインなど）で使うと地図が出ません。
- `http://127.0.0.1:5173` ではなく **`http://localhost:5173`** で開いてください。
- ブラウザの DevTools の Console と Network を見て、`cdn.geolonia.com` や
  `tileserver.geolonia.com` へのリクエストが失敗していないか確認してください。

## `geonic import` が失敗する

| メッセージ | 原因と対処 |
|---|---|
| `400 BadRequestData` | JSON の形が NGSI-LD になっていない。`--dry-run` で送信内容を確認する。`AGENTS.md` のデータモデルと見比べる |
| `413` / ボディが大きすぎる | `--batch-size 100` を付ける（無料プランの上限は 100 件・512KB） |
| `Quota exceeded` / entity 上限 | 無料プランは 1,000 件まで。重複投入していないか確認（同じ `id` なら上書きなので増えない） |
| `429` | レート制限。少し待ってから再実行する。`--retries` で自動リトライもできる |
| 一部だけ失敗する | `--continue-on-error --errors-out failed.ndjson --errors-log errors.log` を付けて、失敗行だけ後で再送する |

## 点が海の上や外国に出る

座標の順番が逆です。GeoJSON は **`[経度, 緯度]`**（`[136.9, 35.1]`）の順で、
CSV の「緯度, 経度」とは逆です。変換スクリプトを直して、投入し直してください
（同じ `id` なら上書きされます）。

## 日本語が文字化けする

今回の CSV は UTF-8（BOM 付き）ですが、**名古屋市の他のデータセットは Shift_JIS（CP932）の
ものもあります**。文字化けしたら変換時にエンコーディングを指定してください。

```bash
iconv -f CP932 -t UTF-8 元ファイル.csv > 変換後.csv
```

また、拡張子が `.csv` でも**中身が Excel ファイル（XLSX）**のデータセットが混ざっています
（例: 名古屋市「公衆トイレ一覧」）。`head` で中身を見て、`PK` で始まっていたら XLSX です。

## GitHub Pages が真っ白

- Settings → Pages の **Source が「GitHub Actions」**になっているか確認してください。
- Actions タブでデプロイのワークフローが成功しているか確認してください。
- 接続先はビルド時に埋め込まれます。Settings → Secrets and variables → Actions →
  **Variables** に `VITE_GEONICDB_URL` と `VITE_GEONICDB_TENANT` を登録してから、
  もう一度 push（または Actions の Re-run）してください。

## AI が同じ失敗を繰り返す

- エラー出力を**そのまま全文**貼ってください。要約すると原因が伝わりません。
- 一度に複数の変更を頼まず、1 つずつに分けてください。
- どうにもならなくなったら `git checkout -- .` で作業前に戻して、頼み方を変えてやり直すのが
  結局いちばん早いです。
- Gemini の無料枠は 1 日 1,000 リクエストです。上限に当たった場合は時間をおいてください。

## それでも解決しないとき

`npm run lint` と `npm run build` の出力、ブラウザの Console のエラー、
実行したコマンドをスタッフに見せてください。
