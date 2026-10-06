import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/gas': {
        target: 'https://script.google.com',
        changeOrigin: true,
        followRedirects: true,
        rewrite: (path) => path.replace(/^\/gas/, '/macros/s/AKfycbwTaoQRklJ4JBBUn9hEaGnTOMrfQ87TgHmElI-T2lrUFHnpgtH2qe8BLaaq331qZiGJfg/exec'),
      },
    },
  },
})
