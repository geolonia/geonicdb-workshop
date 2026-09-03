#!/usr/bin/env bash
#
# ワークショップ参加者 1 人分のテナントを発行する。
#
#   ./organizer/provision.sh ws01          # dry-run（実行内容を表示するだけ）
#   DRY_RUN=0 ./organizer/provision.sh ws01
#
# 事前に super_admin でログインしておくこと:
#   npx geonic config set url https://geonicdb.geolonia.com && npx geonic auth login
#
# !! staging に対して未検証。1 人分で疎通を確認してから残りを流すこと（organizer/README.md 参照）
#
set -euo pipefail

TENANT="${1:?usage: provision.sh <tenant-name>}"
URL="${GEONIC_URL:-https://geonicdb.geolonia.com}"
ENTITY_TYPE="${ENTITY_TYPE:-EmergencyWaterSupply}"
DRY_RUN="${DRY_RUN:-1}"

run() {
  if [ "$DRY_RUN" = "1" ]; then
    printf '[dry-run] %s\n' "$*"
    return 0
  fi
  "$@"
}

geonic() { npx --yes geonic --url "$URL" "$@"; }

echo "=== $TENANT ==="

# 1. テナント
#    allowedOrigins は意図的に設定しない（未設定 = 全オリジン許可）。
#    参加者は localhost と各自の GitHub Pages から接続するため。
run geonic admin tenants create "{\"name\":\"$TENANT\",\"description\":\"workshop $TENANT\"}"

TENANT_ID=""
if [ "$DRY_RUN" != "1" ]; then
  TENANT_ID=$(geonic admin tenants list --format json \
    | python3 -c "
import json,sys
name=sys.argv[1]
data=json.load(sys.stdin)
items=data if isinstance(data,list) else data.get('tenants') or data.get('items') or data.get('data') or []
print(next((t.get('id') or t.get('tenantId') for t in items if t.get('name')==name), ''))
" "$TENANT")
  [ -n "$TENANT_ID" ] || { echo "tenant id を解決できませんでした: $TENANT" >&2; exit 1; }
  echo "tenant id: $TENANT_ID"
fi

# 2. 匿名の読み取りポリシー（ブラウザからの GET を許可する）
run geonic admin policies create "{
  \"policyId\": \"anon-read-$TENANT\",
  \"description\": \"workshop: anonymous read for $ENTITY_TYPE\",
  \"target\": {
    \"subjects\": [{\"attributeId\": \"role\", \"matchValue\": \"anonymous\"}],
    \"resources\": [{\"attributeId\": \"entityType\", \"matchValue\": \"$ENTITY_TYPE\"}],
    \"actions\": [{\"attributeId\": \"method\", \"matchValue\": \"GET\"}]
  },
  \"rules\": [{\"ruleId\": \"permit-read\", \"effect\": \"Permit\"}]
}" --service "$TENANT"

# 3. API キー用の読み書きポリシー（CLI からの投入を許可する）
run geonic admin policies create "{
  \"policyId\": \"cli-rw-$TENANT\",
  \"description\": \"workshop: api_key read/write on NGSI-LD\",
  \"target\": {
    \"subjects\": [{\"attributeId\": \"role\", \"matchValue\": \"api_key\"}],
    \"resources\": [{\"attributeId\": \"path\", \"matchValue\": \"/ngsi-ld/**\", \"matchFunction\": \"glob\"}]
  },
  \"rules\": [{\"ruleId\": \"permit-all\", \"effect\": \"Permit\"}]
}" --service "$TENANT"

# 4. API キー（参加者に配る。origins は '*' = 非ブラウザ含め全許可）
run geonic admin api-keys create \
  --name "workshop-$TENANT" \
  --policy "cli-rw-$TENANT" \
  --origins '*' \
  ${TENANT_ID:+--tenant-id "$TENANT_ID"} \
  --service "$TENANT"

cat <<CARD

--- 配布カード ($TENANT) --------------------
GeonicDB URL : $URL
テナント名    : $TENANT
API キー      : (上の出力の apiKey をここに転記)
---------------------------------------------
CARD
