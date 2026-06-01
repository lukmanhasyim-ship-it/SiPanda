import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/gas': {
        target: 'https://script.google.com/a/macros/guru.smk.belajar.id',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/gas/, '/s/AKfycbwTaoQRklJ4JBBUn9hEaGnTOMrfQ87TgHmElI-T2lrUFHnpgtH2qe8BLaaq331qZiGJfg/exec'),
      },
    },
  },
})
