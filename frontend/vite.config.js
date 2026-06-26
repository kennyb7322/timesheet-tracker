import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'UCS Rides',
        short_name: 'UCS Rides',
        description: 'Book a ride or hire a driver by the hour — by UC Solutions',
        theme_color: '#0A0E14',
        background_color: '#0A0E14',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
        ],
      },
    }),
  ],
  server: {
    host: '0.0.0.0',
    strictPort: true,
    proxy: {
      '/api': {
        target: `http://localhost:${(parseInt(process.env.VITE_PORT) || 3000) + 100}`,
        changeOrigin: true,
      },
    },
  },
})
