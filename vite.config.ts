import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import pkg from './package.json' with { type: 'json' }

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
  // App version: the release number from package.json (bump it for each release, as the App Store
  // will need), plus the build number and commit from GitHub. Shown in Account and Help, and sent
  // with problem reports, so it's easy to confirm which version a device is running.
  define: {
    __APP_VERSION__: JSON.stringify(
      `${pkg.version} (build ${process.env.GITHUB_RUN_NUMBER ?? 'local'} · ${(process.env.GITHUB_SHA ?? 'dev').slice(0, 7)} · ${new Date().toISOString().slice(0, 10)})`,
    ),
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
        name: 'Language Stars',
        short_name: 'Language Stars',
        description: 'Read-aloud practice for kids and adults: Reading, Spanish and Spelling Bee, with stars and stickers.',
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
