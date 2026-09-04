/**
 * Geolonia Maps は npm パッケージを使わず index.html の <script> タグ（CDN）で読み込む。
 * そのため型定義も自前で最小限だけ用意する（MapView.tsx で使う範囲のみ）。
 * 本体は MapLibre GL JS 互換なので、詳しい仕様は
 * https://maplibre.org/maplibre-gl-js/docs/API/classes/Map/ を参照。
 */
import type { MapCollection } from '../lib/types'

type LngLatLike = [number, number]

type GeoloniaMapOptions = {
  container: string | HTMLElement
  style?: string | Record<string, unknown>
  center?: LngLatLike
  zoom?: number
  hash?: boolean
}

type GeoJsonSourceLike = { setData: (data: MapCollection) => void }

type MapMouseEvent = {
  point: { x: number; y: number }
  features?: Array<{ properties?: Record<string, unknown> }>
}

declare global {
  namespace geolonia {
    class Map {
      constructor(options: GeoloniaMapOptions)
      on(type: 'load', listener: () => void): void
      on(
        type: 'click' | 'mouseenter' | 'mouseleave',
        layerId: string,
        listener: (event: MapMouseEvent) => void,
      ): void
      on(type: 'click', listener: (event: MapMouseEvent) => void): void
      addSource(id: string, source: { type: 'geojson'; data: MapCollection }): void
      addLayer(layer: Record<string, unknown> & { id: string }): void
      getSource(id: string): GeoJsonSourceLike | undefined
      getLayer(id: string): unknown
      setFilter(id: string, filter: unknown[]): void
      fitBounds(bounds: [LngLatLike, LngLatLike], options?: { padding?: number; duration?: number }): void
      queryRenderedFeatures(
        point: { x: number; y: number },
        options?: { layers?: string[] },
      ): Array<{ properties?: Record<string, unknown> }>
      getCanvas(): HTMLCanvasElement
      remove(): void
    }
  }

  interface Window {
    geolonia: typeof geolonia
  }
}

export {}
