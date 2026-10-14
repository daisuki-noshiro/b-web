import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';

// 直接验证普通生产包，不依赖开发快照入口。先启动 Gin 的静态托管模式。
const baseURL = process.env.BWEB_SMOKE_URL || 'http://127.0.0.1:18081';
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
try {
  const page = await browser.newPage({ baseURL, viewport: { width: 1280, height: 800 } });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('response', (response) => { if (response.status() >= 400) errors.push(`HTTP ${response.status()} ${response.url()}`); });
  page.on('requestfailed', (request) => errors.push(request.failure()?.errorText));
  await page.goto('/');
  await page.locator('#loading').waitFor({ state: 'hidden' });
  await page.locator('#debug-api[data-state="ok"]').waitFor({ state: 'attached' });
  assert.equal(await page.evaluate(() => typeof window.__BWEB_DEBUG__), 'undefined');
  assert.deepEqual(await (await page.request.get('/api/health')).json(), { status: 'ok', service: 'b-web' });
  await page.mouse.move(700, 450);
  for (let i = 0; i < 6; i++) await page.mouse.wheel(0, 220);
  await page.locator('#interaction-hint').waitFor({ state: 'visible' });
  await page.locator('#interaction-hint').click();
  await page.locator('#memory-dialog').waitFor({ state: 'visible' });
  await page.locator('#memory-close').click();
  await page.locator('#memory-dialog').waitFor({ state: 'hidden' });
  assert.deepEqual(errors, []);
  const result = { production: 'ok', url: baseURL, health: 'ok', debugHook: 'absent', interaction: 'ok', errors };
  await mkdir('../artifacts', { recursive: true });
  await writeFile('../artifacts/visual-production-smoke.json', JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result));
} finally {
  await browser.close();
}
