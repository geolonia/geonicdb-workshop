import { MapView } from './components/MapView'

// TODO ここから先が今日つくるところ。AI に頼んで進めてください。
//   1. GeonicDB からデータを取得して MapView に渡す
//      （src/lib/geonicdb.ts の fetchFeatures() / toGeoJSON() を使う）
//   2. 種別で絞り込むチェックボックスをサイドパネルに追加する
//   3. 名前・住所のキーワード検索
//   4. 「現在地から近い順」— fetchNearby() を使う
//   5. 見た目を整える（凡例、件数バッジ、モバイル対応 など）
export function App() {
  return <MapView />
}
