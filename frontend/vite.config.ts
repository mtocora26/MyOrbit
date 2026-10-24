import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import { VitePWA } from 'vite-plugin-pwa'

// Solo en desarrollo: un service worker de un build anterior (p. ej. visto por ngrok) sigue sirviendo la copia vieja
// porque `vite dev` no publica /sw.js y nunca se entera de que cambió. Este sw.js lo reemplaza, borra las cachés,
// se desregistra y recarga las pestañas abiertas.
const clearStaleServiceWorker = {
  name: 'clear-stale-service-worker',
  apply: 'serve' as const,
  configureServer(server: { middlewares: { use: (handler: (req: { url?: string }, res: { setHeader: (k: string, v: string) => void; end: (body: string) => void }, next: () => void) => void) => void } }) {
    server.middlewares.use((req, res, next) => {
      if (req.url?.split('?')[0] !== '/sw.js') return next()
      res.setHeader('Content-Type', 'application/javascript')
      res.setHeader('Cache-Control', 'no-store')
      res.end(`self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil((async () => {
  await Promise.all((await caches.keys()).map((key) => caches.delete(key)));
  await self.registration.unregister();
  (await self.clients.matchAll({ type: 'window' })).forEach((client) => client.navigate(client.url));
})()));`)
    })
  },
}

// El navegador llama a /api en su mismo origen (localhost o el túnel ngrok); el proxy es quien cruza al backend.
// Sin quitar Origin, Spring ve el dominio de ngrok como petición cross-origin no permitida y responde 403.
const apiProxy = {
  target: process.env.VITE_DEV_API_TARGET || 'http://localhost:8080',
  configure: (proxy: { on: (event: 'proxyReq', handler: (req: { removeHeader: (name: string) => void }) => void) => void }) => {
    proxy.on('proxyReq', (req) => req.removeHeader('origin'))
  },
}

export default defineConfig(() => ({
  plugins: [
    clearStaleServiceWorker,
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'MyOrbit',
        short_name: 'MyOrbit',
        description: 'Organiza tus tareas, hábitos y estudios.',
        lang: 'es',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#101828',
        theme_color: '#101828',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Shell offline: se precachea el build y las navegaciones caen en index.html.
        navigateFallback: '/index.html',
        // La API nunca pasa por el service worker: ni fallback ni caché de respuestas.
        navigateFallbackDenylist: [/^\/api\//],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: parseInt(process.env.PORT || '8443'),
    strictPort: true,
    // Túneles ngrok: el subdominio cambia en el plan gratuito, así que se permite todo el dominio.
    allowedHosts: ['.ngrok-free.dev', '.ngrok-free.app', '.ngrok.app'],
    proxy: {
      '/api': apiProxy,
    },
  },
  preview: {
    host: '0.0.0.0',
    allowedHosts: ['.ngrok-free.dev', '.ngrok-free.app', '.ngrok.app'],
    port: parseInt(process.env.PORT || '8443'),
    proxy: {
      '/api': apiProxy,
    },
  },
}))
