import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/himalayas': {
        target: 'https://himalayas.app',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/himalayas/, '/jobs/api'),
      },
    },
  },
})
