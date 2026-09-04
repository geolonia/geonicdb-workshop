/**
 * GeonicDB からのデータ取得をここに閉じ込める。
 *
 * ブラウザ側は「匿名 (anonymous) の読み取り専用」で接続する。
 * API キーを JS に埋め込まないので、ビルド成果物を GitHub Pages に公開しても
 * 秘密が漏れない。書き込みは geonicdb-cli 側（API キー認証）で行う。
 */
import GeonicDB from '@geolonia/geonicdb-sdk'
import { config } from './config'
import type { Feature, MapCollection } from './types'

/** ワークショップで使うエンティティ型名（workshop.config.json で決める）。 */
export const ENTITY_TYPE = config.entityType

const baseUrl = import.meta.env.VITE_GEONICDB_URL
const tenant = import.meta.env.VITE_GEONICDB_TENANT

if (!baseUrl || !tenant) {
  throw new Error(
    '.env.local に VITE_GEONICDB_URL と VITE_GEONICDB_TENANT を設定してください（.env.example を参照）',
  )
}

export const db = new GeonicDB({
  baseUrl,
  tenant,
  anonymous: true, // Authorization ヘッダを送らない = 匿名ロールとして評価される
})

/** サーバーが 1 リクエストで返せる最大件数（NGSI_MAX_LIMIT）。 */
const PAGE_SIZE = 1000

/**
 * エンティティを全件取得して Feature[] に変換する。
 *
 * `options: 'keyValues'` を付けると属性が `{ type, value }` ではなく値そのものになり、
 * 画面側の取り回しが楽になる（NGSI-LD の簡易表現）。
 */
export async function fetchFeatures(): Promise<Feature[]> {
  const all: Feature[] = []

  for (let offset = 0; ; offset += PAGE_SIZE) {
    const page = await db.getEntities({
      type: ENTITY_TYPE,
      options: 'keyValues',
      limit: PAGE_SIZE,
      offset,
    })

    all.push(...page.map(toFeature).filter((f): f is Feature => f !== null))

    if (page.length < PAGE_SIZE) break
  }

  return all
}

/**
 * 指定座標から半径 radiusMeters 以内のデータを、近い順に取得する。
 * NGSI-LD の Geo-query（georel / geometry / coordinates は 3 つセットで指定）。
 */
export async function fetchNearby(
  center: [number, number],
  radiusMeters: number,
): Promise<Feature[]> {
  const entities = await db.getEntities({
    type: ENTITY_TYPE,
    options: 'keyValues',
    georel: `near;maxDistance==${radiusMeters}`,
    geometry: 'Point',
    coordinates: JSON.stringify(center), // [経度, 緯度] の順
    orderByDistance: true,
    limit: PAGE_SIZE,
  })

  return entities.map(toFeature).filter((f): f is Feature => f !== null)
}

/** keyValues 表現のエンティティ 1 件を Feature に変換する。座標が無ければ null。 */
function toFeature(entity: Record<string, unknown>): Feature | null {
  const location = entity.location as { coordinates?: unknown } | undefined
  const coordinates = location?.coordinates

  if (!Array.isArray(coordinates) || coordinates.length < 2) return null

  const [lng, lat] = coordinates as [number, number]
  if (typeof lng !== 'number' || typeof lat !== 'number') return null

  // id / type / location 以外の属性を、そのまま文字列として持ち回る。
  const props: Record<string, string> = {}
  for (const [key, value] of Object.entries(entity)) {
    if (key === 'id' || key === 'type' || key === 'location') continue
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      props[key] = String(value)
    }
  }

  return { id: String(entity.id), lng, lat, props }
}

/** 地図に渡すための GeoJSON に変換する。 */
export function toGeoJSON(features: Feature[]): MapCollection {
  return {
    type: 'FeatureCollection',
    features: features.map(({ id, lng, lat, props }) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [lng, lat] },
      properties: { ...props, id },
    })),
  }
}
