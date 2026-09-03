/**
 * Geolonia Maps の地図を表示するコンポーネント。
 *
 * ★ このファイルは完成済みです。ワークショップ中は基本的に触らなくて構いません。
 *   （地図の初期化は React だと壊しやすいので、こちらで済ませてあります）
 *
 * 使い方:
 *   <MapView data={geojson} selectedId={id} onSelect={setId} />
 */
import { useEffect, useRef } from 'react'
import { GeoloniaMap, keyring } from '@geolonia/embed/core'
import type { FacilityCollection } from '../lib/types'

// YOUR-API-KEY は localhost / GitHub Pages / Vercel / Netlify / Cloudflare Pages で
// そのまま使える開発用キー。独自ドメインで公開するときだけ実キーに差し替える。
keyring.apiKey = import.meta.env.VITE_GEOLONIA_API_KEY || 'YOUR-API-KEY'
// npm から使う場合、stage は script タグから読めないので明示する（既定は 'dev'）。
keyring.stage = 'v1'

const SOURCE_ID = 'facilities'
const LAYER_ID = 'facilities-circle'
const LAYER_ID_SELECTED = 'facilities-selected'

/** 名古屋市役所あたり。 */
const DEFAULT_CENTER: [number, number] = [136.9066, 35.1815]
const DEFAULT_ZOOM = 11

type Props = {
  data: FacilityCollection
  selectedId?: string | null
  onSelect?: (id: string | null) => void
  /** 点の色分けに使う properties のキー。既定は category。 */
  colorBy?: keyof FacilityCollection['features'][number]['properties']
}

type GeoJsonSourceLike = { setData: (data: FacilityCollection) => void }

const EMPTY: FacilityCollection = { type: 'FeatureCollection', features: [] }

export function MapView({ data, selectedId = null, onSelect, colorBy = 'category' }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<GeoloniaMap | null>(null)
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

    const map = new GeoloniaMap({
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
          'circle-color': [
            'match',
            ['get', colorBy],
            '常設給水栓', '#0aa5ff',
            '地下式給水栓', '#00d4aa',
            '仮設給水栓', '#ffb020',
            '#8a8f98',
          ],
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
      const source = map.getSource(SOURCE_ID) as unknown as GeoJsonSourceLike | undefined
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
