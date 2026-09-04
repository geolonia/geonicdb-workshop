/**
 * アプリ内で扱うデータ 1 件（NGSI-LD エンティティを画面用に平たくしたもの）。
 *
 * 属性はデータセットごとに変わるので、`props` に文字列として詰めておく。
 * 画面に出す属性と見出しは `workshop.config.json` の `fields` で決める。
 */
export type Feature = {
  id: string
  /** 経度 */
  lng: number
  /** 緯度 */
  lat: number
  /** location と id 以外の属性。 */
  props: Record<string, string>
}

export type MapFeature = {
  type: 'Feature'
  geometry: { type: 'Point'; coordinates: [number, number] }
  /** `id` と `props` の中身が入る（地図の色分け・クリック判定で使う）。 */
  properties: Record<string, string>
}

export type MapCollection = {
  type: 'FeatureCollection'
  features: MapFeature[]
}
