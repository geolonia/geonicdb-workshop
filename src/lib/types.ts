/** アプリ内で扱う施設 1 件（NGSI-LD エンティティを画面用に平たくしたもの）。 */
export type Facility = {
  id: string
  name: string
  category: string
  ward: string
  address: string
  /** 経度 */
  lng: number
  /** 緯度 */
  lat: number
}

export type FacilityFeature = {
  type: 'Feature'
  geometry: { type: 'Point'; coordinates: [number, number] }
  properties: Omit<Facility, 'lng' | 'lat'>
}

export type FacilityCollection = {
  type: 'FeatureCollection'
  features: FacilityFeature[]
}
