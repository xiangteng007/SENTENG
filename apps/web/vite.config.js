import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: {
        name: 'Senteng ERP',
        short_name: 'Senteng',
        description: 'Senteng ERP System - 工程管理系統',
        theme_color: '#1f2937',
        background_color: '#f3f4f6',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'vite.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg}'],
        // Skip problematic firebase chunks
        globIgnores: ['**/node_modules/**/*', '**/@firebase/**/*'],
        navigateFallback: 'index.html',
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 10
            }
          }
        ]
      },
      devOptions: {
        enabled: false
      }
    })
  ],
  // Fix for Firebase module resolution in CI/build
  optimizeDeps: {
    include: [
      'firebase/app',
      'firebase/auth',
      'firebase/firestore',
      'firebase/storage',
      '@firebase/app',
      '@firebase/auth',
      '@firebase/firestore',
      '@firebase/storage'
    ],
    esbuildOptions: {
      target: 'esnext'
    }
  },
  resolve: {
    dedupe: [
      'firebase',
      '@firebase/app',
      '@firebase/auth',
      '@firebase/firestore',
      '@firebase/storage',
      '@firebase/util',
      '@firebase/component'
    ]
  },
  build: {
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Split firebase into separate chunk
          if (id.includes('node_modules/firebase') || id.includes('node_modules/@firebase')) {
            return 'firebase';
          }
          // Split react-pdf into separate chunk
          if (id.includes('node_modules/@react-pdf')) {
            return 'pdf';
          }
          // Split icons into separate chunk (P2: Chunk optimization)
          if (id.includes('node_modules/lucide-react')) {
            return 'icons';
          }
          // Split charts into separate chunk
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3-')) {
            return 'charts';
          }
          // Split React core into vendor chunk
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router')) {
            return 'vendor-react';
          }
        }
      }
    }
  }
})
