import { test, expect } from '@playwright/test';

const snapshot = (page) => page.evaluate(() => window.__BWEB_DEBUG__.snapshot());
const settle = (page) => expect.poll(async () => { const s = await snapshot(page); return Math.abs(s.x - s.target); }).toBeLessThan(0.6);

async function walkToLetter(page) {
  const size = page.viewportSize();
  await page.mouse.move(size.width / 2, size.height * 0.64);
  const state = await snapshot(page);
  const destination = 980 - state.viewport.width / 2;
  const delta = destination - state.target;
  const count = Math.ceil(Math.abs(delta) * state.viewport.scale / 240);
  for (let i = 0; i < count; i++) await page.mouse.wheel(0, Math.sign(delta) * Math.min(240, Math.abs(delta) * state.viewport.scale / count));
  await settle(page);
  await expect(page.locator('#interaction-hint')).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('response', (response) => { if (response.status() >= 400) errors.push(`HTTP ${response.status()} ${response.url()}`); });
  page.on('requestfailed', (request) => errors.push(request.failure()?.errorText));
  page.errors = errors;
  await page.goto('/');
  await expect(page.locator('#loading')).toBeHidden();
  await expect(page.locator('#debug-api')).toHaveAttribute('data-state', 'ok');
});

test.afterEach(async ({ page }) => {
  expect(page.errors).toEqual([]);
});

test('实际加载 Canvas、Gin 代理与环境循环动画', async ({ page }, testInfo) => {
  const response = await page.request.get('/api/health');
  expect(await response.json()).toEqual({ status: 'ok', service: 'b-web' });
  await expect(page.locator('canvas')).toBeVisible();
  const initial = await snapshot(page);
  await expect.poll(async () => (await snapshot(page)).animations.cloudX).not.toBe(initial.animations.cloudX);
  const later = await snapshot(page);
  expect(later.animations.lampAlpha).not.toBe(initial.animations.lampAlpha);
  expect(later.animations.grassSkew).not.toBe(initial.animations.grassSkew);
  await expect.poll(async () => (await snapshot(page)).fps).toBeGreaterThan(10);
  await testInfo.attach('runtime-sample', { body: JSON.stringify(await snapshot(page), null, 2), contentType: 'application/json' });
  await page.screenshot({ path: '../artifacts/world-desktop.png' });
});

test('连续滚轮平滑收敛，键盘可逆向，四层视差投影一致', async ({ page }) => {
  await page.mouse.move(700, 450);
  for (let i = 0; i < 12; i++) await page.mouse.wheel(0, 160);
  await settle(page);
  const state = await snapshot(page);
  expect(state.renderX).toBeGreaterThan(500);
  for (const [name, speed] of Object.entries({ sky: 0.08, mountains: 0.22, forest: 0.55, foreground: 1 })) expect(state.layers[name]).toBe(-Math.round(state.renderX * speed));
  await page.keyboard.down('ArrowLeft');
  await expect.poll(async () => (await snapshot(page)).target).toBeLessThan(state.target - 70);
  await page.keyboard.up('ArrowLeft');
  await settle(page);
  expect((await snapshot(page)).renderX).toBeLessThan(state.renderX);
});

test('世界两端有边界，大量滚轮输入之后仍能反向操作', async ({ page }) => {
  await page.mouse.move(700, 450);
  for (let i = 0; i < 55; i++) await page.mouse.wheel(0, 1000);
  await settle(page);
  const end = await snapshot(page);
  expect(end.renderX).toBe(end.maxX);
  await page.screenshot({ path: '../artifacts/world-end.png' });
  for (let i = 0; i < 55; i++) await page.mouse.wheel(0, -1000);
  await settle(page);
  expect((await snapshot(page)).renderX).toBe(0);
});

test('HTML 提示与 Canvas 信箱都可打开卡片，模态遮挡输入并恢复焦点', async ({ page }) => {
  await walkToLetter(page);
  await page.locator('#interaction-hint').click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.locator('#memory-title')).toHaveText('一起等过的晚霞');
  expect(await page.locator('#memory-image').evaluate((img) => img.complete && img.naturalWidth > 0)).toBe(true);
  const frozen = await snapshot(page);
  await page.mouse.move(20, 450);
  await page.mouse.wheel(0, 500);
  await page.keyboard.press('ArrowRight');
  await expect.poll(async () => (await snapshot(page)).x).toBe(frozen.x);
  await page.screenshot({ path: '../artifacts/memory-card.png' });
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page.locator('#interaction-hint')).toBeFocused();
  const state = await snapshot(page);
  await page.mouse.click(state.mailbox.x, state.mailbox.y + 40 * state.viewport.scale);
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.locator('#memory-return').click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await page.mouse.move(700, 450);
  await page.mouse.wheel(0, 160);
  await settle(page);
  expect((await snapshot(page)).renderX).toBeGreaterThan(state.renderX);
});

test('移动尺寸、横屏和高分辨率缩放，提示始终对齐信箱', async ({ page }, testInfo) => {
  await walkToLetter(page);
  await page.locator('#debug-toggle').click();
  for (const size of [{ width: 390, height: 844 }, { width: 667, height: 375 }, { width: 1920, height: 1080 }]) {
    await page.setViewportSize(size);
    await expect.poll(async () => (await snapshot(page)).viewport.width).toBe(Math.ceil(size.width / Math.max(1, Math.min(4, Math.floor(size.height / 360)))));
    await walkToLetter(page);
    const state = await snapshot(page);
    const rect = await page.locator('#interaction-hint').boundingBox();
    expect(Math.abs(rect.x + rect.width / 2 - state.mailbox.x)).toBeLessThan(2);
    expect(Math.abs(rect.y + rect.height - state.mailbox.y)).toBeLessThan(2);
    const canvas = await page.locator('canvas').boundingBox();
    expect(canvas.width).toBeGreaterThanOrEqual(size.width);
    expect(canvas.height).toBeGreaterThanOrEqual(size.height);
    if (size.width === 390) {
      await testInfo.attach('mobile-sample', { body: JSON.stringify(state, null, 2), contentType: 'application/json' });
      await page.screenshot({ path: '../artifacts/world-mobile.png' });
      await page.locator('#interaction-hint').click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await page.screenshot({ path: '../artifacts/memory-mobile.png' });
      await page.locator('#memory-close').click();
      // 继续走到信箱接近视口边缘：提示保持完整，指示角仍指向世界物件。
      await page.mouse.move(size.width / 2, size.height * 0.64);
      await page.mouse.wheel(0, 50 * state.viewport.scale);
      await settle(page);
      await expect(page.locator('#interaction-hint')).toBeVisible();
      const edgeHint = await page.locator('#interaction-hint').boundingBox();
      expect(edgeHint.x).toBeGreaterThanOrEqual(10);
      expect(edgeHint.x + edgeHint.width).toBeLessThanOrEqual(size.width - 10);
    }
  }
});

test('API 返回错误时明确提示，场景仍可以探索', async ({ page }) => {
  await page.route('**/api/health', (route) => route.fulfill({ status: 503, contentType: 'application/json', body: '{"error":"unavailable"}' }));
  await page.reload();
  await expect(page.locator('#loading')).toBeHidden();
  await expect(page.locator('#debug-api')).toHaveAttribute('data-state', 'error');
  await expect(page.locator('#debug-api')).toContainText('HTTP 503');
  await page.mouse.move(700, 450);
  await page.mouse.wheel(0, 200);
  await settle(page);
  expect((await snapshot(page)).renderX).toBeGreaterThan(0);
  // 503 是本用例故意注入的唯一资源错误；其他错误仍使本用例失败。
  expect(page.errors.every((error) => error.includes('503'))).toBe(true);
  page.errors.length = 0;
});

test('调试面板可以隐藏；减少动态效果模式仍可用按钮探索和打开卡片', async ({ page }) => {
  await page.locator('#debug-toggle').click();
  await expect(page.locator('#debug-panel')).toBeHidden();
  await page.locator('#debug-toggle').click();
  await expect(page.locator('#debug-panel')).toBeVisible();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const initial = await snapshot(page);
  await page.locator('#move-right').focus();
  await page.keyboard.press('Enter');
  await expect.poll(async () => (await snapshot(page)).renderX).toBeGreaterThan(initial.renderX);
  const motion = await snapshot(page);
  await page.mouse.move(700, 450);
  await page.mouse.wheel(0, 200);
  expect((await snapshot(page)).animations.cloudX).toBe(motion.animations.cloudX);
  await walkToLetter(page);
  await page.locator('#interaction-hint').click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.locator('#memory-close').click();
  await expect(page.getByRole('dialog')).toBeHidden();
});
