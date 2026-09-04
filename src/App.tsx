import { Fragment, useEffect, useMemo, useState } from 'react'
import { MapView } from './components/MapView'
import { config } from './lib/config'
import { fetchFeatures, toGeoJSON } from './lib/geonicdb'
import type { Feature } from './lib/types'

export function App() {
  const [features, setFeatures] = useState<Feature[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    fetchFeatures()
      .then(setFeatures)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false))
  }, [])

  const geojson = useMemo(() => toGeoJSON(features), [features])
  const selected = features.find((f) => f.id === selectedId) ?? null

  return (
    <div className="layout">
      <aside className="panel">
        <h1>{config.title}</h1>

        <p className="status">
          {loading ? '読み込み中…' : `${features.length.toLocaleString()} 件`}
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
            {config.fields.map((field) => (
              <Fragment key={field.key}>
                <dt>{field.label}</dt>
                <dd>{selected.props[field.key] || '(不明)'}</dd>
              </Fragment>
            ))}
          </dl>
        ) : (
          <p className="hint">地図上の点をクリックすると詳細が出ます。</p>
        )}

        {/*
          TODO ここから先が今日つくるところ。AI に頼んで進めてください。
            1. 種別で絞り込むチェックボックス
            2. 地域（区・市町村など）で絞り込むセレクトボックス
            3. 名前・住所のキーワード検索
            4. 「現在地から近い順」— src/lib/geonicdb.ts の fetchNearby() を使う
            5. 見た目を整える（凡例、件数バッジ、モバイル対応 など）
        */}

        {config.attribution && (
          <footer className="credit">
            出典:{' '}
            <a href={config.attribution.url} target="_blank" rel="noreferrer">
              {config.attribution.label}
            </a>
          </footer>
        )}
      </aside>

      <main className="main">
        <MapView data={geojson} selectedId={selectedId} onSelect={setSelectedId} />
      </main>
    </div>
  )
}
