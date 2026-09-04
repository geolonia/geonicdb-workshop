# 早見表

## geonic（geonicdb-cli）

毎回オプションを書かずに済むよう、最初にこれを実行しておくと楽です。

> 配布された API キーは DPoP（RFC 9449）必須で発行されています。`geonic` が透過的に
> 処理するので、意識する必要はありません。

```bash
export GEONIC_API_KEY=<配布カードの API キー>
export GEONIC_TENANT=<テナント名>
alias g="npx geonic --url https://geonicdb.geolonia.com --api-key $GEONIC_API_KEY --service $GEONIC_TENANT"
```

| やりたいこと | コマンド |
|---|---|
| 自分の認証状態を見る | `g me` |
| サーバーの生死確認 | `npx geonic health --url https://geonicdb.geolonia.com` |
| 1 件作る | `g entities create '{"id":"...","type":"...","name":{"type":"Property","value":"..."}}'` |
| 一覧（型で絞る） | `g entities list --type YOUR_ENTITY_TYPE --local` |
| 一覧を GeoJSON で | `g entities list --type YOUR_ENTITY_TYPE --local -f geojson` |
| 一覧を表で | `g entities list --type YOUR_ENTITY_TYPE --local -f table` |
| 1 件取得 | `g entities get urn:ngsi-ld:YOUR_ENTITY_TYPE:1` |
| 属性を更新 | `g entities update YOUR_ENTITY_ID '{"name":{"type":"Property","value":"新しい名前"}}'` |
| 1 件削除 | `g entities delete YOUR_ENTITY_ID` |
| 件数だけ数える | `g entities list --type YOUR_ENTITY_TYPE --local --count-only` |
| NDJSON を一括投入 | `g import entities.ndjson --batch-size 100` |
| 投入内容を事前確認 | `g import entities.ndjson --dry-run` |
| 失敗行を回収して再送 | `g import entities.ndjson --continue-on-error --errors-out failed.ndjson` |
| カタログを覗く | `g catalog datasets list` |
| ヘルプ | `npx geonic help` / `npx geonic help entities list` |

`--local` は「範囲の広すぎるクエリ」チェックを免除するオプションです。型で絞った一覧を
取るときに付けておくと弾かれません。

## NGSI-LD の書き方

```jsonc
{
  "id": "urn:ngsi-ld:YOUR_ENTITY_TYPE:1",  // URN 形式が推奨
  "type": "YOUR_ENTITY_TYPE",
  "name": { "type": "Property", "value": "○○センター" },
  "capacity": { "type": "Property", "value": 100 },        // 数値もそのまま value に
  "location": {
    "type": "GeoProperty",
    "value": { "type": "Point", "coordinates": [139.767, 35.681] }   // [経度, 緯度]
  }
}
```

| 属性の種類 | `type` | 用途 |
|---|---|---|
| ふつうの値 | `Property` | 文字列・数値・真偽値・配列 |
| 位置 | `GeoProperty` | GeoJSON の Geometry を `value` に入れる |
| 他エンティティへの参照 | `Relationship` | `object` に相手の id を入れる |

### 取得時の便利なパラメータ

| パラメータ | 効果 |
|---|---|
| `options=keyValues` | `{type, value}` を剥がして値だけにする |
| `limit` / `offset` | ページング（1 回の上限は 1,000 件） |
| `q=category=="種別A"` | 属性値で絞り込む |
| `attrs=name,location` | 返す属性を絞る |
| `orderBy=name&orderDirection=asc` | 並び替え |
| `georel` + `geometry` + `coordinates` | 地理検索（3 点セットで指定） |
| `orderByDistance=true` | `near` 検索の結果を近い順に並べる |

## AI への頼み方のコツ

- **1 回に 1 つのことを頼む。** 「絞り込みと検索と近い順を全部」ではなく順番に。
- **エラーはそのまま貼る。** 「動きません」ではなく端末の出力を全文貼る。
- **確認方法まで指示する。** 「`npm run build` が通ることを確認してください」を添える。
- **参照先を教える。** 「仕様は `AGENTS.md` のデータモデルに従って」と書くと精度が上がる。
- 迷走し始めたら `git checkout -- .` で戻して、頼み方を変えてやり直すのが早いです。

コピペで使える例:

```text
サイドパネルに種別（実際の値は workshop.config.json や AGENTS.md のデータモデルを参照）の
チェックボックスを追加し、
チェックが外れた種別を地図から隠してください。件数も種別ごとに出してください。
MapView.tsx は変更せず、App.tsx とスタイルだけで実現してください。
```

```text
以下のエラーが出ました。原因を調べて直してください。
（ここに端末の出力をそのまま貼る）
```
