import { useEffect, useMemo, useState } from 'react'
import { MapView } from './components/MapView'
import { fetchFacilities, toGeoJSON } from './lib/geonicdb'
import type { Facility } from './lib/types'

export function App() {
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    fetchFacilities()
      .then(setFacilities)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false))
  }, [])

  const geojson = useMemo(() => toGeoJSON(facilities), [facilities])
  const selected = facilities.find((f) => f.id === selectedId) ?? null

  return (
    <div className="layout">
      <aside className="panel">
        <h1>名古屋市 応急給水施設マップ</h1>

        <p className="status">
          {loading ? '読み込み中…' : `${facilities.length.toLocaleString()} 件`}
        </p>

        {error && (
          <div className="error">
            <strong>データを取得できませんでした</strong>
            <p>{error}</p>
            <p>
              まだ <code>geonic import</code> を実行していない場合は、README の手順 4 を先に
              進めてください。
            </p>
          </div>
        )}

        {selected ? (
          <dl className="detail">
            <dt>施設名</dt>
            <dd>{selected.name || '(不明)'}</dd>
            <dt>種別</dt>
            <dd>{selected.category || '(不明)'}</dd>
            <dt>区</dt>
            <dd>{selected.ward || '(不明)'}</dd>
            <dt>住所</dt>
            <dd>{selected.address || '(不明)'}</dd>
          </dl>
        ) : (
          <p className="hint">地図上の点をクリックすると詳細が出ます。</p>
        )}

        {/*
          TODO ここから先が今日つくるところ。AI に頼んで進めてください。
            1. 種別（常設 / 地下式 / 仮設）で絞り込むチェックボックス
            2. 区で絞り込むセレクトボックス
            3. 名前・住所のキーワード検索
            4. 「現在地から近い順」— src/lib/geonicdb.ts の fetchNearby() を使う
            5. 見た目を整える（凡例、件数バッジ、モバイル対応 など）
        */}

        <footer className="credit">
          出典:{' '}
          <a
            href="https://data.bodik.jp/dataset/231002_6101130000_01"
            target="_blank"
            rel="noreferrer"
          >
            名古屋市「応急給水施設一覧表」
          </a>{' '}
          (CC BY 4.0)
        </footer>
      </aside>

      <main className="main">
        <MapView data={geojson} selectedId={selectedId} onSelect={setSelectedId} />
      </main>
    </div>
  )
}
