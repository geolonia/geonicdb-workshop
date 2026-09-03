/**
 * GeonicDB からのデータ取得をここに閉じ込める。
 *
 * ブラウザ側は「匿名 (anonymous) の読み取り専用」で接続する。
 * API キーを JS に埋め込まないので、ビルド成果物を GitHub Pages に公開しても
 * 秘密が漏れない。書き込みは geonicdb-cli 側（API キー認証）で行う。
 */
import GeonicDB from '@geolonia/geonicdb-sdk'
import type { Facility, FacilityCollection } from './types'

/** ワークショップで使うエンティティ型名。 */
export const ENTITY_TYPE = 'EmergencyWaterSupply'

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
 * エンティティを全件取得して Facility[] に変換する。
 *
 * `options: 'keyValues'` を付けると属性が `{ type, value }` ではなく値そのものになり、
 * 画面側の取り回しが楽になる（NGSI-LD の簡易表現）。
 */
export async function fetchFacilities(): Promise<Facility[]> {
  const all: Facility[] = []

  for (let offset = 0; ; offset += PAGE_SIZE) {
    const page = await db.getEntities({
      type: ENTITY_TYPE,
      options: 'keyValues',
      limit: PAGE_SIZE,
      offset,
    })

    all.push(...page.map(toFacility).filter((f): f is Facility => f !== null))

    if (page.length < PAGE_SIZE) break
  }

  return all
}

/**
 * 指定座標から半径 radiusMeters 以内の施設を、近い順に取得する。
 * NGSI-LD の Geo-query（georel / geometry / coordinates は 3 つセットで指定）。
 */
export async function fetchNearby(
  center: [number, number],
  radiusMeters: number,
): Promise<Facility[]> {
  const entities = await db.getEntities({
    type: ENTITY_TYPE,
    options: 'keyValues',
    georel: `near;maxDistance==${radiusMeters}`,
    geometry: 'Point',
    coordinates: JSON.stringify(center), // [経度, 緯度] の順
    orderByDistance: true,
    limit: PAGE_SIZE,
  })

  return entities.map(toFacility).filter((f): f is Facility => f !== null)
}

/** keyValues 表現のエンティティ 1 件を Facility に変換する。座標が無ければ null。 */
function toFacility(entity: Record<string, unknown>): Facility | null {
  const location = entity.location as { coordinates?: unknown } | undefined
  const coordinates = location?.coordinates

  if (!Array.isArray(coordinates) || coordinates.length < 2) return null

  const [lng, lat] = coordinates as [number, number]
  if (typeof lng !== 'number' || typeof lat !== 'number') return null

  return {
    id: String(entity.id),
    name: str(entity.name),
    category: str(entity.category),
    ward: str(entity.ward),
    address: str(entity.address),
    lng,
    lat,
  }
}

function str(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

/** 地図に渡すための GeoJSON に変換する。 */
export function toGeoJSON(facilities: Facility[]): FacilityCollection {
  return {
    type: 'FeatureCollection',
    features: facilities.map(({ lng, lat, ...properties }) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [lng, lat] },
      properties,
    })),
  }
}
