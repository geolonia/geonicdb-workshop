# 主催者向け準備手順

参加者が触るのはリポジトリ直下の README だけです。こちらは**前日までにやること**をまとめています。

## 全体像

- 対象地域・データセットは開催回ごとに変わります。前日までに
  [../workshop.config.json](../workshop.config.json) と [../data/README.md](../data/README.md) を
  その回の内容に更新してください。
- 参加者は **1 人 1 テナント**（無料プラン T0）。共用にすると 300 重み/分・同時 5・
  エンティティ 1,000 件を全員で取り合い、`import` が集中する 1:20 前後で詰まります。
- ブラウザ側は**匿名の読み取り専用**。フロントに API キーを置かないので、
  参加者が成果物を GitHub Pages に公開しても秘密が漏れません。
- 書き込み（`geonic import`）は **API キー**で行います。**このワークショップの API キーは
  DPoP（RFC 9449）必須**で発行します（`provision.sh` の `--dpop-required`）。DPoP のハンドシェイクは
  `geonic` CLI が透過的に処理するため、主催者・参加者とも追加の作業は不要です。

必要な権限: staging（`https://geonicdb.geolonia.com`）の `super_admin`。

## 前日までにやること

### 1. テナント・ユーザー・API キー・匿名読み取りポリシーを発行する

`provision.sh` が 1 人分の発行をまとめて行います。**既定は dry-run（表示のみ）**です。

```bash
# まず super_admin でログイン
npx geonic config set url https://geonicdb.geolonia.com
npx geonic auth login

# 何が実行されるか確認（実行しない）
./organizer/provision.sh ws01

# 実際に発行する
DRY_RUN=0 ./organizer/provision.sh ws01

# 20 人分
for i in $(seq -w 1 20); do DRY_RUN=0 ./organizer/provision.sh "ws$i"; done
```

> **ローカルの認証有効な GeonicDB（`AUTH_ENABLED=true`）に対しては一通り検証済みです。**
> テナント作成 → ポリシー 2 本 → API キー → API キーで書き込み(201) → 匿名で読み取り(200) →
> 無関係なテナントからの匿名読み取り(403) → 匿名書き込み(403) → 他テナントへの越境書き込み(403) →
> `geonic import` での一括投入成功、まで確認しました。
> **staging では未実行です。** 必ず 1 人分だけ実行して疎通を確かめてから残りを流してください。

**テナント名は小文字英数字とアンダースコアのみ**（ハイフン不可）。`ws-01` はサーバーに弾かれます。
`ws01` や `ws_01` を使ってください。スクリプト側でも事前チェックしています。

**ポリシーには `tenantId` が必須です**（スクリプトに入れてあります）。省略すると
`tenantId: null` の「全テナントに効くポリシー」になり、**staging の無関係なテナントにも
匿名読み取りと api_key の読み書きが開きます**。ローカル検証で実際に他テナントから
200 が返る状態を再現したので、ここを削らないでください。

### 2. 疎通確認（1 テナントだけ手で）

> **注意: `--api-key` は保存済みのログイン（トークン）に負けます。** super_admin でログイン
> している端末でそのまま試すと、API キーではなく保存トークンが使われて
> `Authentication failed` になります。`HOME` を分けるか、別プロファイル（`-p`）で試してください。
> 参加者の端末には保存トークンが無いので、この問題は起きません。
>
> ```bash
> HOME=$(mktemp -d) npx geonic ... --api-key "$KEY"
> ```

```bash
TENANT=ws01
KEY=<発行された API キー>

# 書き込みできる（API キー経由）
npx geonic entities create '{"id":"urn:ngsi-ld:<ENTITY_TYPE>:probe:1","type":"<ENTITY_TYPE>",
  "name":{"type":"Property","value":"probe"},
  "location":{"type":"GeoProperty","value":{"type":"Point","coordinates":[139.767,35.681]}}}' \
  --url https://geonicdb.geolonia.com --service "$TENANT" --api-key "$KEY"

# 匿名で読める（Authorization ヘッダなし・ブラウザと同じ条件）
curl -s -H "NGSILD-Tenant: $TENANT" -H "Origin: http://localhost:5173" \
  "https://geonicdb.geolonia.com/ngsi-ld/v1/entities?type=<ENTITY_TYPE>&options=keyValues&limit=5"

# 片付け
npx geonic entities delete urn:ngsi-ld:<ENTITY_TYPE>:probe:1 \
  --url https://geonicdb.geolonia.com --service "$TENANT" --api-key "$KEY"
```

匿名 GET が `403 Access denied: no applicable policy` を返すなら、匿名ポリシーが
そのテナントに入っていません。

### 3. 配布カードを作る

参加者 1 人につきこの 3 行を印刷して配ります（`provision.sh` が同じ内容を出力します）。

```text
GeonicDB URL : https://geonicdb.geolonia.com
テナント名    : ws01
API キー      : gdb_xxxxxxxxxxxxxxxxxxxx
```

### 4. テンプレートリポジトリを最新にしておく

```bash
npm install && npm run lint && npm run build      # 通ることを確認
```

参加者は「Use this template」から複製します。**リポジトリが Public でないと参加者が複製できません。**

### 5. AI 環境の下見（必須）

使うのは **opencode** + 無料モデル **Big Pickle**（`opencode/big-pickle`、リポジトリの
`opencode.json` で固定済み）。ただし次の 2 点は**一次確認が取れていません**。前日までに
主催者自身が新規アカウントで試してください。

- `https://opencode.ai/auth` のサインアップで**クレジットカードを要求されないか**
  （公式手順には "add your billing details" が含まれる一方、無料モデルはカード不要とする情報もある）
- Big Pickle が当日も無料で提供されているか（「期間限定の無料提供」とされているモデル）

崩れていた場合の代替は **Gemini API の無料キー**（Google AI Studio、カード不要、
Gemini 3 Flash で 15 RPM・1,000 リクエスト/日、期限なし）。`opencode` の `/connect` で
Google を接続し、`opencode.json` の `model` を差し替えれば進行は変わりません。
参加者への案内文だけ差し替えられるよう、両方の手順を手元に用意しておいてください。

### 6. 参加者への事前案内

- Node.js 20 以上、Git、GitHub アカウント
- 会場の回線で `npm install`（約 340 パッケージ）が走ります。事前に済ませてもらうと 10 分縮みます
- `curl -fsSL https://opencode.ai/install | bash` と `/connect` の初回接続も事前に済ませてもらう

## 当日の注意

- **staging へのデプロイを重ねない。** ワークショップ中に本体をデプロイすると
  コールドスタートやダウンで全員が同時に詰まります。
- **CORS の allowedOrigins は設定しない（未設定＝全オリジン許可のまま）。** 参加者は
  `localhost` と各自の GitHub Pages ドメインからアクセスするため、絞ると全員分の
  登録が必要になります。加えて staging の WAF はリクエストボディに `http://localhost` を
  含むと 403 を返すので、`localhost` を許可リストに登録する操作自体が通りません。
- 無料プランのエンティティ上限は 1,000 件。`workshop.config.json` と `data/README.md` で
  選んだデータセットの件数を事前に確認してください。参加者が 2 回投入しても
  （同じ `id` なら上書きで）増えません。
- 進行台本は [../docs/WORKSHOP.md](../docs/WORKSHOP.md)。

## 終わったあと

テナントは残しておけば参加者が持ち帰って続けられます。片付ける場合:

```bash
npx geonic admin tenants delete <tenant-id>
```
