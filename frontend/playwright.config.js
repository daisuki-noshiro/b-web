import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.js',
  fullyParallel: false,
  workers: 1,
  timeout: 45000,
  expect: { timeout: 8000 },
  reporter: [['list'], ['json', { outputFile: '../artifacts/e2e-results.json' }]],
  use: {
    browserName: 'chromium',
    viewport: { width: 1280, height: 800 },
    baseURL: process.env.BWEB_E2E_URL || 'http://127.0.0.1:5173',
    launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: process.env.BWEB_E2E_URL ? undefined : [
    { command: 'go run ./cmd/server', cwd: '..', env: { BWEB_ADDR: '127.0.0.1:18080', BWEB_STATIC_DIR: '' }, url: 'http://127.0.0.1:18080/api/health', reuseExistingServer: !process.env.CI, timeout: 120000 },
    { command: 'npm run dev', env: { BWEB_API_TARGET: 'http://127.0.0.1:18080' }, url: 'http://127.0.0.1:5173', reuseExistingServer: !process.env.CI, timeout: 60000 },
  ],
});
