import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-192.png', 'icon-512.png'],
      manifest: {
        name: '家庭记账',
        short_name: '记账',
        description: '家庭记账应用',
        theme_color: '#10B981',
        background_color: '#FFFFFF',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '.',
        scope: '.',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: { cacheName: 'api-cache', expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 } },
          },
        ],
      },
    }),
  ],
  server: {
    port: 5175,
    host: true,
    allowedHosts: ['localhost', '.serveousercontent.com'],
    proxy: {
      '/api/baidu-token': {
        target: 'https://aip.baidubce.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/baidu-token/, '/oauth/2.0/token'),
      },
      '/api/baidu-asr': {
        target: 'https://vop.baidu.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/baidu-asr/, '/server_api'),
      },
    },
  },
});
