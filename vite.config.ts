import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// Content Security Policy for production builds (NIST 800-53 SC-18, SI-10).
// GitHub Pages cannot set HTTP headers, so the policy is injected as a <meta> tag.
// Only this site's own files may run; the only outside connection is the Supabase project.
const csp = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "font-src 'self'",
  "img-src 'self' data:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
  "worker-src 'self'",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ')

function cspPlugin(): Plugin {
  return {
    name: 'inject-csp',
    apply: 'build',
    transformIndexHtml(html) {
      return html.replace('<head>', `<head>\n    <meta http-equiv="Content-Security-Policy" content="${csp}" />`)
    },
  }
}

export default defineConfig({
  // Shown on the Account screen so it's easy to confirm a device has the newest version.
  define: {
    __APP_VERSION__: JSON.stringify(`${(process.env.GITHUB_SHA ?? 'local').slice(0, 7)} · ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC`),
  },
  // For a GitHub Pages project site this is "/<repo-name>/" (set by the deploy workflow).
  base: process.env.VITE_BASE ?? '/',
  plugins: [
    react(),
    tailwindcss(),
    cspPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Read Aloud Stars',
        short_name: 'Read Stars',
        description: 'Reading practice for kids and English-to-Spanish speaking practice, with stars and stickers.',
        theme_color: '#4f46e5',
        background_color: '#e0e7ff',
        display: 'standalone',
        start_url: '.',
        scope: '.',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // Never cache API traffic: learner data stays out of the service worker cache.
        navigateFallbackDenylist: [/^\/auth/, /^\/rest/],
      },
    }),
  ],
})
