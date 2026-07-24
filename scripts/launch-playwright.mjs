/**
 * Dual-load study + list via Playwright; assert chrome + one interaction each.
 */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const BASE = process.env.BASE_URL || 'http://127.0.0.1:4173';
const scratch = 'C:/Users/zjh/AppData/Local/Temp/grok-goal-6744799ce230/implementer';
const launchDir = join(scratch, 'launch');
mkdirSync(launchDir, { recursive: true });

const log = [];
const errors = [];

function note(msg) {
  log.push(msg);
  console.log(msg);
}

async function loadStudy(page, run) {
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e)));
  page.on('console', (msg) => {
    if (msg.type() === 'error') pageErrors.push(`console.error: ${msg.text()}`);
  });

  await page.goto(`${BASE}/index.html`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(800);

  const bodyReady = await page.evaluate(() => document.body.classList.contains('is-ready'));
  const cardVisible = await page.locator('#card').isVisible().catch(() => false);
  const emptyVisible = await page.locator('#empty').isVisible().catch(() => false);
  const lucideCount = await page.locator('svg.lucide-icon, [data-lucide] svg, .icon-slot svg').count();
  const canvas = await page.locator('canvas.ambient-canvas').count();
  const progress = await page.locator('#progress').innerText().catch(() => '');

  // Interaction: theme toggle
  const beforeTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  await page.locator('#btn-theme').click();
  await page.waitForTimeout(200);
  const afterTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  // restore
  await page.locator('#btn-theme').click();
  await page.waitForTimeout(100);

  // Interaction: reveal answer if card present
  let revealOk = false;
  if (cardVisible) {
    const showBtn = page.locator('[data-act="show"]');
    if (await showBtn.count()) {
      await showBtn.click();
      await page.waitForTimeout(350);
      const showing = await page.locator('#face').getAttribute('data-showing');
      revealOk = showing === 'back';
    }
  }

  const shot = join(launchDir, `study-run${run}.png`);
  await page.screenshot({ path: shot, fullPage: true });

  const result = {
    run,
    page: 'study',
    bodyReady,
    cardVisible,
    emptyVisible,
    lucideCount,
    canvas,
    progress,
    themeBefore: beforeTheme,
    themeAfter: afterTheme,
    themeChanged: beforeTheme !== afterTheme,
    revealOk,
    pageErrors,
    screenshot: shot,
  };

  note(JSON.stringify(result, null, 2));
  if (pageErrors.length) errors.push(...pageErrors.map((e) => `study#${run}: ${e}`));
  if (!bodyReady) errors.push(`study#${run}: body not ready`);
  if (lucideCount < 1) errors.push(`study#${run}: no Lucide SVG`);
  if (!result.themeChanged) errors.push(`study#${run}: theme did not toggle`);
  if (!(cardVisible || emptyVisible)) errors.push(`study#${run}: blank main surface`);

  return result;
}

async function loadList(page, run) {
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e)));
  page.on('console', (msg) => {
    if (msg.type() === 'error') pageErrors.push(`console.error: ${msg.text()}`);
  });

  await page.goto(`${BASE}/list.html`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(800);

  const bodyReady = await page.evaluate(() => document.body.classList.contains('is-ready'));
  const rows = await page.locator('.problem-row').count();
  const lucideCount = await page.locator('svg.lucide-icon, [data-lucide] svg, .icon-slot svg').count();
  const canvas = await page.locator('canvas.ambient-canvas').count();
  const stats = await page.locator('#stats').innerText().catch(() => '');

  // Interaction: theme toggle
  const beforeTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  await page.locator('#theme-toggle').click();
  await page.waitForTimeout(200);
  const afterTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  await page.locator('#theme-toggle').click();
  await page.waitForTimeout(100);

  // Interaction: expand first row if present
  let expandOk = false;
  if (rows > 0) {
    await page.locator('.problem-row').first().locator('.problem-summary').click();
    await page.waitForTimeout(300);
    expandOk = await page.locator('.problem-row.is-expanded').count().then((n) => n > 0);
  }

  const shot = join(launchDir, `list-run${run}.png`);
  await page.screenshot({ path: shot, fullPage: false });

  const result = {
    run,
    page: 'list',
    bodyReady,
    rows,
    lucideCount,
    canvas,
    stats,
    themeBefore: beforeTheme,
    themeAfter: afterTheme,
    themeChanged: beforeTheme !== afterTheme,
    expandOk,
    pageErrors,
    screenshot: shot,
  };

  note(JSON.stringify(result, null, 2));
  if (pageErrors.length) errors.push(...pageErrors.map((e) => `list#${run}: ${e}`));
  if (!bodyReady) errors.push(`list#${run}: body not ready`);
  if (lucideCount < 1) errors.push(`list#${run}: no Lucide SVG`);
  if (!result.themeChanged) errors.push(`list#${run}: theme did not toggle`);
  if (rows < 1) errors.push(`list#${run}: no problem rows`);
  if (!expandOk) errors.push(`list#${run}: expand did not work`);

  return result;
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await context.newPage();

try {
  note(`BASE=${BASE}`);
  // dual load each
  await loadStudy(page, 1);
  await loadStudy(page, 2);
  await loadList(page, 1);
  await loadList(page, 2);
} catch (err) {
  errors.push(String(err?.stack || err));
  note(`FATAL: ${err}`);
} finally {
  await browser.close();
}

const summary = {
  ok: errors.length === 0,
  errorCount: errors.length,
  errors,
};
writeFileSync(join(launchDir, 'console.log'), log.join('\n') + '\n\nERRORS:\n' + errors.join('\n') + '\n');
writeFileSync(join(launchDir, 'summary.json'), JSON.stringify(summary, null, 2));
writeFileSync(
  join(scratch, 'immersive-layer.log'),
  [
    'Immersive layer exercise via Playwright dual launch',
    `ok=${summary.ok}`,
    ...log.filter((l) => l.includes('canvas') || l.includes('"canvas"')),
    'See launch/console.log for full results',
  ].join('\n') + '\n'
);

console.log('\n=== SUMMARY ===');
console.log(JSON.stringify(summary, null, 2));
process.exit(summary.ok ? 0 : 1);
