# 主催者向け準備手順

参加者が触るのはリポジトリ直下の README だけです。こちらは**前日までにやること**をまとめています。

## 全体像

- 参加者は **1 人 1 テナント**（無料プラン T0）。共用にすると 300 重み/分・同時 5・
  エンティティ 1,000 件を全員で取り合い、`import` が集中する 1:20 前後で詰まります。
- ブラウザ側は**匿名の読み取り専用**。フロントに API キーを置かないので、
  参加者が成果物を GitHub Pages に公開しても秘密が漏れません。
- 書き込み（`geonic import`）は **API キー**で行います。

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

> **このスクリプトは staging に対して未検証です。** 必ず 1 人分だけ実行して、
> `geonic entities create` と匿名 GET が期待どおりに通るか手で確かめてから残りを流してください
> （確認手順は下の「疎通確認」）。

### 2. 疎通確認（1 テナントだけ手で）

```bash
TENANT=ws01
KEY=<発行された API キー>

# 書き込みできる（API キー経由）
npx geonic entities create '{"id":"urn:ngsi-ld:EmergencyWaterSupply:probe:1","type":"EmergencyWaterSupply",
  "name":{"type":"Property","value":"probe"},
  "location":{"type":"GeoProperty","value":{"type":"Point","coordinates":[136.9,35.18]}}}' \
  --url https://geonicdb.geolonia.com --service "$TENANT" --api-key "$KEY"

# 匿名で読める（Authorization ヘッダなし・ブラウザと同じ条件）
curl -s -H "NGSILD-Tenant: $TENANT" -H "Origin: http://localhost:5173" \
  "https://geonicdb.geolonia.com/ngsi-ld/v1/entities?type=EmergencyWaterSupply&options=keyValues&limit=5"

# 片付け
npx geonic entities delete urn:ngsi-ld:EmergencyWaterSupply:probe:1 \
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
- 無料プランのエンティティ上限は 1,000 件。今回のデータは 617 件なので、
  参加者が 2 回投入しても（同じ `id` なら上書きで）増えません。
- 進行台本は [../docs/WORKSHOP.md](../docs/WORKSHOP.md)。

## 終わったあと

テナントは残しておけば参加者が持ち帰って続けられます。片付ける場合:

```bash
npx geonic admin tenants delete <tenant-id>
```
