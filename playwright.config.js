import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  retries: 0,
  webServer: {
    command: 'npm run dev -- --port 5174',
    port: 5174,
    reuseExistingServer: !process.env.CI,
  },
  use: {
    baseURL: 'http://localhost:5174/cornholio/',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
})
