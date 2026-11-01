import { expect, test, type Page } from '@playwright/test';

const errors = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }) => {
  const messages: string[] = [];
  errors.set(page, messages);
  page.on('pageerror', (error) => messages.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') messages.push(message.text());
  });
  await page.clock.install();
  await page.clock.pauseAt(new Date());
  await page.goto('/');
});
test.afterEach(async ({ page }) => {
  expect(errors.get(page)).toEqual([]);
});

const advance = (page: Page, ms = 1000) => page.clock.runFor(ms);

test('opens a working canvas without browser errors', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Gravity Sandbox' })).toBeVisible();
  await expect(page.getByLabel('Celestial bodies')).toHaveText('7');
  await advance(page);
  expect(parseFloat(await page.getByLabel('Simulated time').innerText())).toBeGreaterThan(0.8);
  await expect(page.getByRole('button', { name: 'Pause simulation' })).toBeVisible();
});

test('switches all three presets and resets scene time', async ({ page }) => {
  await page.getByRole('button', { name: 'Binary Stars' }).click();
  await expect(page.getByLabel('Celestial bodies')).toHaveText('4');
  await expect(page.getByRole('button', { name: 'Binary Stars' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await advance(page);
  await page.getByRole('button', { name: 'Chaos', exact: true }).click();
  await expect(page.getByLabel('Celestial bodies')).toHaveText('24');
  await expect(page.getByLabel('Simulated time')).toHaveText('0.0 s');
  await page.getByRole('button', { name: 'Solar System' }).click();
  await expect(page.getByLabel('Celestial bodies')).toHaveText('7');
});

test('pause freezes time and canvas; resume visibly moves the scene', async ({ page }) => {
  await advance(page);
  await page.getByRole('button', { name: 'Pause simulation' }).click();
  await advance(page, 32);
  const time = await page.getByLabel('Simulated time').innerText();
  const frozen = await page.locator('canvas').screenshot();
  await advance(page, 1000);
  expect(await page.getByLabel('Simulated time').innerText()).toBe(time);
  expect((await page.locator('canvas').screenshot()).equals(frozen)).toBe(true);
  await page.getByRole('button', { name: 'Resume simulation' }).click();
  await advance(page, 1000);
  expect(await page.getByLabel('Simulated time').innerText()).not.toBe(time);
  expect((await page.locator('canvas').screenshot()).equals(frozen)).toBe(false);
});

test('creates a body with selected mass and drag launch velocity', async ({ page }) => {
  await page.getByRole('button', { name: 'Pause simulation' }).click();
  await page.getByRole('button', { name: 'Clear scene' }).click();
  await page.getByLabel('New body mass').fill('80');
  const box = (await page.locator('canvas').boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.4, box.y + box.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.55, box.y + box.height * 0.4, { steps: 8 });
  await page.mouse.up();
  await expect(page.getByLabel('Celestial bodies')).toHaveText('1');
  await expect(page.getByLabel('Total mass')).toHaveText('80');
  await advance(page, 32);
  const before = await page.locator('canvas').screenshot();
  await page.getByRole('button', { name: 'Resume simulation' }).click();
  await advance(page, 600);
  expect((await page.locator('canvas').screenshot()).equals(before)).toBe(false);
});

test('click creates a stationary body and clear removes every body', async ({ page }) => {
  await page.getByRole('button', { name: 'Clear scene' }).click();
  await page.locator('canvas').click({ position: { x: 200, y: 200 } });
  await expect(page.getByLabel('Celestial bodies')).toHaveText('1');
  await advance(page, 32);
  const before = await page.locator('canvas').screenshot();
  await advance(page);
  expect((await page.locator('canvas').screenshot()).equals(before)).toBe(true);
  await page.getByRole('button', { name: 'Clear scene' }).click();
  await expect(page.getByLabel('Celestial bodies')).toHaveText('0');
  await expect(page.getByLabel('Total mass')).toHaveText('0');
});

test('simulation speed changes elapsed physical time', async ({ page }) => {
  await page.getByLabel('Simulation speed').selectOption('2');
  await advance(page, 1000);
  const time = parseFloat(await page.getByLabel('Simulated time').innerText());
  expect(time).toBeGreaterThan(1.8);
  expect(time).toBeLessThan(2.2);
});

test('cancels a pending launch when Escape or pointercancel fires', async ({ page }) => {
  await page.getByRole('button', { name: 'Clear scene' }).click();
  const canvas = page.locator('canvas');
  await canvas.hover({ position: { x: 150, y: 150 } });
  await page.mouse.down();
  await page.keyboard.press('Escape');
  await page.mouse.up();
  await expect(page.getByLabel('Celestial bodies')).toHaveText('0');
  await page.mouse.down();
  await canvas.dispatchEvent('pointercancel');
  await page.mouse.up();
  await expect(page.getByLabel('Celestial bodies')).toHaveText('0');
});

test('body limit prevents an unbounded scene while paused', async ({ page }) => {
  await page.getByRole('button', { name: 'Pause simulation' }).click();
  await page.getByRole('button', { name: 'Clear scene' }).click();
  // Real pointer input, many clicks without a physics tick to merge them.
  const box = (await page.locator('canvas').boundingBox())!;
  for (let i = 0; i < 163; i++) await page.mouse.click(box.x + 100, box.y + 100);
  await expect(page.getByLabel('Celestial bodies')).toHaveText('160');
  await expect(page.locator('#announcement')).toContainText('160');
});

test('desktop screenshot and controls fit without horizontal overflow', async ({ page }) => {
  await advance(page, 6000);
  await page.getByRole('button', { name: 'Pause simulation' }).click();
  await advance(page, 32);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'artifacts/gravity-desktop.png', fullPage: true });
});

test('mobile viewport remains usable after resize', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await advance(page, 1000);
  await expect(page.getByRole('button', { name: 'Clear scene' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const box = (await page.locator('canvas').boundingBox())!;
  expect(box.width).toBeGreaterThan(300);
  expect(box.height).toBeGreaterThan(300);
  await page.screenshot({ path: 'artifacts/gravity-mobile.png', fullPage: true });
});

test('resize redraws a paused canvas without waiting for another animation frame', async ({
  page,
}) => {
  await advance(page, 1000);
  await page.getByRole('button', { name: 'Pause simulation' }).click();
  await page.setViewportSize({ width: 1200, height: 900 });
  // Screenshot forces browser layout/ResizeObserver, but does not advance the mocked clock.
  await page.locator('canvas').screenshot();
  const alpha = await page
    .locator('canvas')
    .evaluate(
      (canvas: HTMLCanvasElement) => canvas.getContext('2d')!.getImageData(10, 10, 1, 1).data[3],
    );
  expect(alpha).toBe(255);
});

test('touch gesture creates a body in a mobile browser context', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  const touchErrors: string[] = [];
  page.on('pageerror', (error) => touchErrors.push(error.message));
  await page.goto('/');
  await page.getByRole('button', { name: 'Pause simulation' }).click();
  await page.getByRole('button', { name: 'Clear scene' }).click();
  await page.locator('canvas').scrollIntoViewIfNeeded();
  const box = (await page.locator('canvas').boundingBox())!;
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
  await expect(page.getByLabel('Celestial bodies')).toHaveText('1');
  expect(touchErrors).toEqual([]);
  await context.close();
});
