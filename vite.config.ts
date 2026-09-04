import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import workshopConfig from './workshop.config.json'

// index.html の %WORKSHOP_TITLE% を workshop.config.json の title に差し替える。
// 開催回ごとに変わるのは workshop.config.json だけ、という状態を保つため。
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'workshop-title',
      transformIndexHtml: (html) => html.replaceAll('%WORKSHOP_TITLE%', workshopConfig.title),
    },
  ],
  // GitHub Pages のプロジェクトページ（https://<user>.github.io/<repo>/）で
  // そのまま動くよう、アセットは相対パスで出力する。
  base: './',
  server: {
    port: 5173,
  },
})
