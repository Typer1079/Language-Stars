import { defineConfig, devices } from '@playwright/test'

/**
 * Browser tests (tests/e2e). They run against a production build that talks to a fake Supabase
 * (tests/e2e/mockSupabase.ts), so they need no accounts or network. `npm run test:e2e`.
 * Set PW_CHROME=/path/to/chrome to use an installed Chrome instead of Playwright's download.
 */
const port = 4179
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 45_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://127.0.0.1:${port}/Language-Stars/`,
    trace: 'retain-on-failure',
    permissions: ['microphone'],
    ...devices['Desktop Chrome'],
    launchOptions: {
      args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'],
      ...(process.env.PW_CHROME ? { executablePath: process.env.PW_CHROME } : {}),
    },
  },
  // Listen on 127.0.0.1 explicitly: on GitHub's Linux runners "localhost" can mean the IPv6 address,
  // and the tests would wait for a server they can't reach.
  webServer: {
    command: `npm run build:e2e && npx vite preview --outDir dist-e2e --host 127.0.0.1 --port ${port} --strictPort --base /Language-Stars/`,
    url: `http://127.0.0.1:${port}/Language-Stars/`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
})
