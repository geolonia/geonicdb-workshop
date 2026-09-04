import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // GitHub Pages のプロジェクトページ（https://<user>.github.io/<repo>/）で
  // そのまま動くよう、アセットは相対パスで出力する。
  base: './',
  server: {
    port: 5173,
  },
})
