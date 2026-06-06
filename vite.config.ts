import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  root: "site",
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:43164'
    },
  },
  build: {
    outDir: "../src/adfotg/site",
  },
})
