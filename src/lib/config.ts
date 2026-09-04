/**
 * 開催回ごとの設定（対象地域・データセット）をここ 1 か所に閉じ込める。
 *
 * 中身を変えるのはリポジトリ直下の `workshop.config.json` だけ。
 * ワークショップを別の場所・別のデータで開くときは、そのファイルを書き換える。
 */
import rawConfig from '../../workshop.config.json'

export type WorkshopConfig = {
  /** 画面と <title> に出すアプリ名。 */
  title: string
  /** NGSI-LD のエンティティ型名。CLI の --type にも同じ値を使う。 */
  entityType: string
  map: {
    /** データが 0 件のときの初期表示位置。データが入ると全点が入る範囲に自動で寄る。 */
    center: { lng: number; lat: number }
    zoom: number
    /** 点の色分けに使う属性名。 */
    colorBy: string
    /** 属性値 → 色。空にすると defaultColor の 1 色になる。 */
    colors: Record<string, string>
    defaultColor: string
  }
  /** 詳細パネルに出す属性と、その見出し。 */
  fields: { key: string; label: string }[]
  /** 出典表示（CC BY などで必須）。不要なら null。 */
  attribution: { label: string; url: string } | null
}

export const config: WorkshopConfig = rawConfig
