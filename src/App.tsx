// TODO ここから先が今日つくるところ。AI に頼んで進めてください。
//   1. data-lat / data-lng / data-zoom を開催地に合わせて変える
//   2. GeonicDB からデータを取得して地図に表示する
//   3. 種別で絞り込むチェックボックスをサイドパネルに追加する
//   4. 名前・住所のキーワード検索
//   5. 「現在地から近い順」で一覧表示する
//   6. 見た目を整える（凡例、件数バッジ、モバイル対応 など）
export function App() {
  return (
    <div
      className="geolonia"
      style={{ position: 'fixed', inset: 0 }}
      data-lat="35.681236"
      data-lng="139.767125"
      data-zoom="14"
      data-navigation-control="top-right"
    />
  )
}
