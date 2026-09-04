/**
 * Geolonia Maps の地図を表示するコンポーネント。
 *
 * ★ このファイルは完成済みです。ワークショップ中は基本的に触らなくて構いません。
 *   （地図の初期化は React だと壊しやすいので、こちらで済ませてあります）
 *
 * Geolonia Maps 本体は index.html の <script> タグ（CDN）で読み込み済みで、
 * window.geolonia として使える（型は src/types/geolonia.d.ts）。
 *
 * 使い方:
 *   <MapView />                                    // 地図だけ表示
 *   <MapView data={geojson} selectedId={id} onSelect={setId} />
 */
import { useEffect, useRef } from 'react'
import { config } from '../lib/config'
import type { MapCollection } from '../lib/types'

const SOURCE_ID = 'entities'
const LAYER_ID = 'entities-circle'
const LAYER_ID_SELECTED = 'entities-selected'

/** データが 0 件のときの初期表示。開催地に合わせて workshop.config.json で変える。 */
const DEFAULT_CENTER: [number, number] = [config.map.center.lng, config.map.center.lat]
const DEFAULT_ZOOM = config.map.zoom

const EMPTY: MapCollection = { type: 'FeatureCollection', features: [] }

type Props = {
  data?: MapCollection
  selectedId?: string | null
  onSelect?: (id: string | null) => void
  /** 点の色分けに使う properties のキー。既定は workshop.config.json の map.colorBy。 */
  colorBy?: string
}

/**
 * 色分けの式を組み立てる。
 * workshop.config.json の map.colors が空なら defaultColor の 1 色になる。
 */
function circleColor(colorBy: string): unknown {
  const entries = Object.entries(config.map.colors)
  if (entries.length === 0) return config.map.defaultColor
  return ['match', ['get', colorBy], ...entries.flat(), config.map.defaultColor]
}

export function MapView({
  data = EMPTY,
  selectedId = null,
  onSelect,
  colorBy = config.map.colorBy,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<geolonia.Map | null>(null)
  const readyRef = useRef(false)
  const fittedRef = useRef(false)
  /** 地図の load 完了前に届いた更新をためておく。 */
  const pendingRef = useRef<(() => void)[]>([])
  // 最新の props を地図のイベントハンドラから参照するための箱
  const onSelectRef = useRef(onSelect)
  useEffect(() => {
    onSelectRef.current = onSelect
  }, [onSelect])

  // 地図の生成は一度だけ。
  useEffect(() => {
    if (!containerRef.current) return

    const map = new window.geolonia.Map({
      container: containerRef.current,
      style: 'geolonia/basic',
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      hash: false,
    })
    mapRef.current = map

    map.on('load', () => {
      map.addSource(SOURCE_ID, { type: 'geojson', data: EMPTY })

      map.addLayer({
        id: LAYER_ID,
        type: 'circle',
        source: SOURCE_ID,
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 9, 3, 14, 7],
          'circle-color': circleColor(colorBy),
          'circle-stroke-width': 1,
          'circle-stroke-color': '#ffffff',
        },
      })

      map.addLayer({
        id: LAYER_ID_SELECTED,
        type: 'circle',
        source: SOURCE_ID,
        filter: ['==', ['get', 'id'], ''],
        paint: {
          'circle-radius': 11,
          'circle-color': 'rgba(0,0,0,0)',
          'circle-stroke-width': 3,
          'circle-stroke-color': '#ff4d6d',
        },
      })

      map.on('click', LAYER_ID, (event) => {
        const feature = event.features?.[0]
        const id = feature?.properties?.id
        onSelectRef.current?.(typeof id === 'string' ? id : null)
      })
      map.on('click', (event) => {
        const hits = map.queryRenderedFeatures(event.point, { layers: [LAYER_ID] })
        if (hits.length === 0) onSelectRef.current?.(null)
      })
      map.on('mouseenter', LAYER_ID, () => {
        map.getCanvas().style.cursor = 'pointer'
      })
      map.on('mouseleave', LAYER_ID, () => {
        map.getCanvas().style.cursor = ''
      })

      readyRef.current = true
      const pending = pendingRef.current
      pendingRef.current = []
      pending.forEach((run) => run())
    })

    return () => {
      readyRef.current = false
      fittedRef.current = false
      pendingRef.current = []
      mapRef.current = null
      map.remove()
    }
  }, [colorBy])

  // データが変わったら差し替える。
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const apply = () => {
      const source = map.getSource(SOURCE_ID)
      source?.setData(data)

      // 最初にデータが入ったときだけ、全点が入る範囲に寄せる。
      if (!fittedRef.current && data.features.length > 0) {
        fittedRef.current = true
        const lngs = data.features.map((f) => f.geometry.coordinates[0])
        const lats = data.features.map((f) => f.geometry.coordinates[1])
        map.fitBounds(
          [
            [Math.min(...lngs), Math.min(...lats)],
            [Math.max(...lngs), Math.max(...lats)],
          ],
          { padding: 48, duration: 0 },
        )
      }
    }

    if (readyRef.current) apply()
    else pendingRef.current.push(apply)
  }, [data])

  // 選択中の点をハイライトする。
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const apply = () => {
      if (map.getLayer(LAYER_ID_SELECTED)) {
        map.setFilter(LAYER_ID_SELECTED, ['==', ['get', 'id'], selectedId ?? ''])
      }
    }

    if (readyRef.current) apply()
    else pendingRef.current.push(apply)
  }, [selectedId])

  return <div ref={containerRef} className="map" />
}
