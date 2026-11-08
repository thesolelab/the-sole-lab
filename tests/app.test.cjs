const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
let server, browser, base;

before(async () => {
  server = http.createServer(async (req, res) => {
    try {
      const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      const file = path.resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
      if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
      const content = await fs.readFile(file);
      const types = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.jpg': 'image/jpeg', '.png': 'image/png' };
      res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
      res.end(content);
    } catch { res.writeHead(404).end(); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({
    ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
    headless: true,
    args: ['--no-sandbox']
  });
});
after(async () => { await browser?.close(); await new Promise(resolve => server?.close(resolve)); });

async function newPage(t, viewport = { width: 1440, height: 1000 }) {
  const page = await browser.newPage({ viewport });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  t.after(async () => { assert.deepEqual(errors, [], 'no uncaught browser errors'); await page.close(); });
  // Offline tests must not send analytics or depend on external font availability.
  await page.route('https://**/*', route => route.abort());
  await page.goto(base);
  await page.waitForSelector('.component-name');
  await page.evaluate(() => { window.events = []; window.umami = { track: (name, data) => events.push({ name, data }) }; });
  return page;
}

async function exportDownload(page, button) {
  const downloading = page.waitForEvent('download');
  await page.click(button);
  const download = await downloading;
  const buffer = await fs.readFile(await download.path());
  await page.waitForFunction(selector => !document.querySelector(selector).disabled, button);
  return { name: download.suggestedFilename(), buffer };
}

function readZip(buffer) {
  const entries = [];
  let offset = 0;
  while (buffer.readUInt32LE(offset) === 0x04034b50) {
    const size = buffer.readUInt32LE(offset + 18);
    const nameSize = buffer.readUInt16LE(offset + 26);
    const extraSize = buffer.readUInt16LE(offset + 28);
    const start = offset + 30 + nameSize + extraSize;
    entries.push({ name: buffer.subarray(offset + 30, offset + 30 + nameSize).toString(), data: buffer.subarray(start, start + size) });
    offset = start + size;
  }
  assert.equal(buffer.readUInt32LE(offset), 0x02014b50, 'central ZIP directory exists');
  assert.equal(buffer.readUInt32LE(buffer.length - 22), 0x06054b50, 'ZIP end record exists');
  return entries;
}

test('pattern editing, lazy swatches, collapse, duplicate and color clipboard', async t => {
  const page = await newPage(t);
  assert.equal(await page.locator('.pattern-option').count(), 0);
  const card = page.locator('.component-card').first();
  await card.locator('.component-name').fill('Base');
  await card.locator('.component-material').selectOption('Leather');
  await card.locator('.color-1-red').fill('123');
  await card.locator('.color-1-green').fill('45');
  await card.locator('.color-1-blue').fill('67');
  assert.equal(await card.locator('[data-color="1"]').evaluate(e => getComputedStyle(e).backgroundColor), 'rgb(123, 45, 67)');
  await card.locator('.color-card').nth(0).getByRole('button', { name: 'Copy', exact: true }).click();
  await card.locator('.color-card').nth(1).getByRole('button', { name: 'Paste', exact: true }).click();
  assert.equal(await card.locator('.color-2-red').inputValue(), '123');
  await card.locator('.pattern-picker-trigger').click();
  assert.equal(await card.locator('.pattern-option').count(), 29);
  assert.equal(await card.locator('.pattern-grid').count(), 1);
  assert.equal(await card.locator('.pattern-page-title').count(), 0);
  await card.locator('[data-pattern-id="pattern-23"]').click();
  assert.equal(await card.locator('.component-pattern-id').inputValue(), 'pattern-23');
  assert.equal(await card.locator('.pattern-picker-trigger').getAttribute('aria-expanded'), 'false');
  await card.locator('.pattern-picker-trigger').click();
  await page.keyboard.press('Escape');
  assert.equal(await card.locator('.pattern-picker').isVisible(), false);
  await card.locator('.pattern-duplicate-btn').click();
  assert.equal(await page.locator('.component-card').count(), 2);
  assert.equal(await page.locator('.component-name').nth(1).inputValue(), 'Base');
  assert.equal(await page.locator('.component-pattern-id').nth(1).inputValue(), 'pattern-23');
  await card.locator('.pattern-collapse-toggle').click();
  assert.match(await card.locator('.pattern-component-summary').innerText(), /Base · Leather/);
  assert.equal(await card.locator('.pattern-component-body').isVisible(), false);
  await page.locator('.remove-component-btn').nth(1).click();
  assert.equal(await page.locator('.component-card').count(), 1);
  assert.equal(await card.locator('.pattern-component-number').innerText(), '01');
  await page.click('#addComponentBtn');
  assert.equal(await page.locator('.component-card').count(), 2);
  assert.equal(await page.evaluate(() => events.filter(e => e.name === 'solelab_add_component').length), 1);
});

test('rejects unnamed rows and invalid RGB/scale without normalizing data', async t => {
  const page = await newPage(t);
  const alerts = [];
  page.on('dialog', async dialog => { alerts.push(dialog.message()); await dialog.accept(); });
  await page.fill('#shoeName', 'Test Shoe');
  await page.click('#addComponentBtn');
  await page.locator('.component-name').nth(1).fill('Toe');
  await page.locator('.pattern-collapse-toggle').first().click();
  await page.click('#downloadRecipeBtn');
  assert.match(alerts.pop(), /Entry 1 needs a name/);
  assert.equal(await page.locator('.component-name').first().evaluate(e => e === document.activeElement), true);
  await page.locator('.component-name').first().fill('Base');
  for (const value of ['999', '-1', '1.5', '']) {
    await page.locator('.color-1-red').first().fill(value);
    await page.click('#downloadRecipeBtn');
    assert.match(alerts.pop(), /0 to 255/);
    assert.equal(await page.locator('.color-1-red').first().inputValue(), value);
  }
  await page.locator('.color-1-red').first().fill('0');
  await page.locator('.color-1-red').first().focus();
  assert.equal(await page.locator('.color-1-red').first().inputValue(), '0');
  await page.locator('.component-x').first().fill('13');
  await page.click('#downloadRecipeBtn');
  assert.match(alerts.pop(), /0.50 to 12.00/);
  assert.equal(await page.evaluate(() => events.filter(e => e.name === 'solelab_download_jpeg').length), 0);
});

test('keyboard tabs, labeled controls, responsive layout and true colors', async t => {
  const page = await newPage(t);
  await page.focus('#patternToolBtn');
  await page.keyboard.press('ArrowRight');
  assert.equal(await page.locator('#specTool').isVisible(), true);
  assert.equal(await page.locator('#specToolBtn').getAttribute('tabindex'), '0');
  await page.keyboard.press('Home');
  assert.equal(await page.locator('#patternTool').isVisible(), true);
  const unlabelled = await page.locator('input:not([type="hidden"]):not([type="file"]),select').evaluateAll(inputs => inputs.filter(input => !input.labels.length && !input.getAttribute('aria-label')).length);
  assert.equal(unlabelled, 0);
  const ids = await page.locator('[id]').evaluateAll(elements => elements.map(e => e.id));
  assert.equal(new Set(ids).size, ids.length);
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.click('#patternToolBtn');
    await page.locator('.pattern-picker-trigger').click();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `pattern fits ${width}`);
    await page.click('#specToolBtn');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `spec fits ${width}`);
  }
  await page.fill('.spec-red', '255');
  assert.equal(await page.locator('.spec-color-preview').evaluate(e => getComputedStyle(e).backgroundColor), 'rgb(255, 0, 0)');
});

test('draft recovery and editable JSON round trip retain both editors and incomplete values', async t => {
  const page = await newPage(t);
  await page.fill('#shoeName', 'Draft Shoe');
  await page.fill('.component-name', 'Base');
  await page.fill('.color-1-red', '');
  await page.click('.pattern-collapse-toggle');
  await page.click('#specToolBtn');
  await page.fill('#specShoeName', 'Share Shoe');
  await page.fill('.spec-layer-name', 'Toe');
  await page.fill('.spec-green', '88');
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('sole-lab-workspace-v1') || '{}').spec?.entries[0]?.fields?.['spec-green'] === '88');
  await page.reload();
  await page.waitForSelector('.spec-layer-name');
  assert.equal(await page.inputValue('#shoeName'), 'Draft Shoe');
  assert.equal(await page.inputValue('.color-1-red'), '');
  assert.equal(await page.locator('.pattern-component-body').isVisible(), false);
  assert.equal(await page.inputValue('.spec-green'), '88');
  const exported = await exportDownload(page, '#exportDraftBtn');
  const data = JSON.parse(exported.buffer.toString());
  assert.equal(data.spec.entries[0].name, 'Toe');
  await page.click('#clearSpecFormBtn');
  page.on('dialog', dialog => dialog.accept());
  await page.locator('#importDraftInput').setInputFiles({ name: 'workspace.json', mimeType: 'application/json', buffer: exported.buffer });
  await page.waitForFunction(() => document.querySelector('.spec-layer-name').value === 'Toe');
  assert.equal(await page.inputValue('.spec-green'), '88');
  await page.locator('#importDraftInput').setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from('{"version": 999}') });
  await page.waitForFunction(() => document.getElementById('importDraftInput').value === '');
  assert.equal(await page.inputValue('.spec-layer-name'), 'Toe');
  await page.click('#clearSpecFormBtn');
  await page.reload();
  await page.waitForSelector('.spec-layer-name');
  assert.equal(await page.inputValue('.spec-layer-name'), '');
});

test('single JPEG/PNG downloads, ZIP pagination and one analytics event per successful export', async t => {
  const page = await newPage(t);
  await page.fill('#shoeName', 'Test Shoe');
  await page.fill('.component-name', 'Base');
  const jpeg = await exportDownload(page, '#downloadRecipeBtn');
  assert.equal(jpeg.name, 'test-shoe-pattern-1.jpg');
  assert.equal(jpeg.buffer.readUInt16BE(0), 0xffd8);
  await page.click('#specToolBtn');
  await page.fill('#specShoeName', 'Share Shoe');
  await page.fill('.spec-layer-name', 'Toe');
  await page.fill('.spec-red', '48');
  await page.click('.spec-copy-color-btn');
  await page.click('#addSpecLayerBtn');
  await page.locator('.spec-paste-color-btn').nth(1).click();
  assert.equal(await page.locator('.spec-red').nth(1).inputValue(), '48');
  await page.locator('.spec-remove-layer-btn').nth(1).click();
  const png = await exportDownload(page, '#downloadSpecCardBtn');
  assert.equal(png.name, 'share-shoe-spec-card-1.png');
  assert.equal(png.buffer.subarray(1, 4).toString(), 'PNG');
  assert.equal(png.buffer.readUInt32BE(16), 1080);
  assert.equal(png.buffer.readUInt32BE(20), 1350);
  assert.equal(await page.evaluate(() => events.filter(e => e.name === 'solelab_download_spec_card').length), 1);
  for (let index = 1; index < 11; index++) await page.locator('.spec-duplicate-layer-btn').first().click();
  const archive = await exportDownload(page, '#downloadSpecCardBtn');
  assert.equal(archive.name, 'sole-lab-cards.zip');
  const entries = readZip(archive.buffer);
  assert.deepEqual(entries.map(entry => entry.name), ['share-shoe-spec-card-1.png', 'share-shoe-spec-card-2.png']);
  assert.equal(entries[1].data.readUInt32BE(16), 1080);
  await page.click('#patternToolBtn');
  for (let index = 1; index < 6; index++) await page.locator('.pattern-duplicate-btn').first().click();
  const patternArchive = readZip((await exportDownload(page, '#downloadRecipeBtn')).buffer);
  assert.deepEqual(patternArchive.map(entry => entry.name), ['test-shoe-pattern-1.jpg', 'test-shoe-pattern-2.jpg']);
});

test('export metadata stays consistent while the user edits during generation', async t => {
  const page = await newPage(t);
  await page.fill('#shoeName', 'Snapshot Shoe');
  await page.fill('.component-name', 'Base');
  await page.selectOption('#brand', 'Nike');
  await page.evaluate(() => {
    window.drawnText = [];
    const fillText = CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.fillText = function(text, ...args) {
      drawnText.push(text);
      return fillText.call(this, text, ...args);
    };
    const toBlob = HTMLCanvasElement.prototype.toBlob;
    HTMLCanvasElement.prototype.toBlob = function(callback, ...args) {
      document.getElementById('brand').value = 'Jordan';
      return toBlob.call(this, callback, ...args);
    };
  });
  for (let i = 1; i < 6; i++) await page.locator('.pattern-duplicate-btn').first().click();
  await exportDownload(page, '#downloadRecipeBtn');
  const brandLines = await page.evaluate(() => drawnText.filter(text => text.includes('NBA 2K27')));
  assert.equal(brandLines.length, 2);
  assert.ok(brandLines.every(text => text.startsWith('Nike')));
  assert.equal(await page.evaluate(() => events.find(e => e.name === 'solelab_download_jpeg').data.brand), 'Nike');
});

test('share cancellation does not download or count a successful export', async t => {
  const page = await newPage(t);
  await page.fill('#shoeName', 'Share Shoe');
  await page.fill('.component-name', 'Base');
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => true });
    Object.defineProperty(navigator, 'share', { configurable: true, value: async () => { throw new DOMException('Cancelled', 'AbortError'); } });
  });
  let downloads = 0;
  page.on('download', () => downloads++);
  await page.click('#downloadRecipeBtn');
  await page.waitForFunction(() => !document.getElementById('downloadRecipeBtn').disabled);
  assert.equal(downloads, 0);
  assert.equal(await page.evaluate(() => events.filter(e => e.name === 'solelab_download_jpeg').length), 0);
});

test('Quick Share rejects invalid channels, duplicate keeps unfinished edits, and storage failure leaves editing usable', async t => {
  const page = await newPage(t);
  const alerts = [];
  page.on('dialog', async dialog => { alerts.push(dialog.message()); await dialog.accept(); });
  await page.click('#specToolBtn');
  await page.fill('#specShoeName', 'Spec');
  await page.fill('.spec-layer-name', 'Toe');
  for (const value of ['256', '-1', '1.2', '']) {
    await page.fill('.spec-red', value);
    await page.click('#downloadSpecCardBtn');
    assert.match(alerts.pop(), /0 to 255/);
    assert.equal(await page.inputValue('.spec-red'), value);
  }
  await page.click('.spec-duplicate-layer-btn');
  assert.equal(await page.locator('.spec-red').nth(1).inputValue(), '');
  await page.evaluate(() => {
    Storage.prototype.setItem = () => { throw new DOMException('Disabled', 'SecurityError'); };
  });
  await page.locator('.spec-layer-name').first().fill('Updated');
  await page.waitForFunction(() => document.getElementById('draftStatus').textContent.includes('Automatic saving unavailable'));
  assert.equal(await page.locator('.spec-layer-name').first().inputValue(), 'Updated');
});

test('native share success and failure fallback are handled once', async t => {
  const page = await newPage(t);
  await page.fill('#shoeName', 'Share Shoe');
  await page.fill('.component-name', 'Base');
  await page.evaluate(() => {
    window.sharedFiles = [];
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => true });
    Object.defineProperty(navigator, 'share', { configurable: true, value: async ({ files }) => { sharedFiles.push(files[0].name); } });
  });
  await page.click('#downloadRecipeBtn');
  await page.waitForFunction(() => !document.getElementById('downloadRecipeBtn').disabled);
  assert.deepEqual(await page.evaluate(() => sharedFiles), ['share-shoe-pattern-1.jpg']);
  assert.equal(await page.evaluate(() => events.filter(e => e.name === 'solelab_download_jpeg').length), 1);
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'share', { configurable: true, value: async () => { throw new DOMException('Gesture expired', 'NotAllowedError'); } });
  });
  const fallback = await exportDownload(page, '#downloadRecipeBtn');
  assert.equal(fallback.name, 'share-shoe-pattern-1.jpg');
  assert.equal(await page.evaluate(() => events.filter(e => e.name === 'solelab_download_jpeg').length), 2);
});

test('image cache shares in-flight promises and retries a failed request', async t => {
  const page = await newPage(t);
  const result = await page.evaluate(async () => {
    const { loadImage } = await import('./js/files.js');
    const first = loadImage('assets/patterns/pattern-01.jpg');
    const second = loadImage('assets/patterns/pattern-01.jpg');
    const samePromise = first === second;
    const image = await first;
    const failed = loadImage('assets/missing-test.jpg');
    await failed.catch(() => {});
    const retried = loadImage('assets/missing-test.jpg');
    const newPromise = retried !== failed;
    await retried.catch(() => {});
    return { samePromise, decoded: image.naturalWidth > 0, newPromise };
  });
  assert.deepEqual(result, { samePromise: true, decoded: true, newPromise: true });
});

test('ZIP records preserve UTF-8 filenames, file bytes and checksums', async () => {
  const { zipFiles } = await import('../js/files.js');
  const { crc32 } = require('node:zlib');
  const files = [new File(['first'], 'shoe-1.png'), new File(['second'], 'é-shoe-2.jpg')];
  const zip = Buffer.from(await (await zipFiles(files)).arrayBuffer());
  const entries = readZip(zip);
  assert.deepEqual(entries.map(entry => entry.name), files.map(file => file.name));
  let offset = 0;
  for (const [index, entry] of entries.entries()) {
    assert.equal(entry.data.toString(), index ? 'second' : 'first');
    assert.equal(zip.readUInt32LE(offset + 14), crc32(entry.data));
    offset += 30 + Buffer.byteLength(entry.name) + entry.data.length;
  }
  for (const entry of entries) {
    assert.equal(zip.readUInt32LE(offset), 0x02014b50);
    assert.equal(zip.readUInt32LE(offset + 16), crc32(entry.data));
    offset += 46 + Buffer.byteLength(entry.name);
  }
});

test('component reordering preserves data and collapse state, saves order, and exports in that order', async t => {
  const page = await newPage(t);
  await page.fill('#shoeName', 'Ordered Shoe');
  await page.fill('.component-name', 'Base');
  assert.equal(await page.locator('.pattern-move-up-btn').isDisabled(), true);
  assert.equal(await page.locator('.pattern-move-down-btn').isDisabled(), true);
  await page.fill('.color-1-red', '123');
  await page.fill('.component-notes', 'Keep this note');
  await page.click('#addComponentBtn');
  await page.locator('.component-name').nth(1).fill('Heel');
  await page.click('#addComponentBtn');
  await page.locator('.component-name').nth(2).fill('Tongue');
  await page.locator('.pattern-collapse-toggle').first().click();
  await page.locator('.pattern-move-down-btn').first().click();
  const names = () => page.locator('.component-name').evaluateAll(inputs => inputs.map(input => input.value));
  assert.deepEqual(await names(), ['Heel', 'Base', 'Tongue']);
  const moved = page.locator('.component-card').nth(1);
  assert.equal(await moved.locator('.pattern-component-body').isVisible(), false);
  assert.equal(await moved.locator('.color-1-red').inputValue(), '123');
  assert.equal(await moved.locator('.component-notes').inputValue(), 'Keep this note');
  await moved.locator('.pattern-move-down-btn').focus();
  await page.keyboard.press('Enter');
  assert.deepEqual(await names(), ['Heel', 'Tongue', 'Base']);
  assert.equal(await page.locator('.pattern-move-down-btn').last().isDisabled(), true);
  assert.equal(await page.locator('.pattern-move-up-btn').last().evaluate(button => button === document.activeElement), true);
  await page.keyboard.press('Enter');
  assert.deepEqual(await names(), ['Heel', 'Base', 'Tongue']);
  await page.locator('.pattern-move-up-btn').nth(1).click();
  assert.deepEqual(await names(), ['Base', 'Heel', 'Tongue']);
  assert.equal(await page.locator('.pattern-move-up-btn').first().isDisabled(), true);
  assert.deepEqual(await page.locator('.pattern-component-number').allTextContents(), ['01', '02', '03']);
  // Reorder again before checking persistence and the actual canvas drawing order.
  await page.locator('.pattern-move-down-btn').first().click();
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('sole-lab-workspace-v1') || '{}').pattern?.entries[0]?.name === 'Heel');
  await page.reload();
  await page.waitForSelector('.component-card');
  assert.deepEqual(await names(), ['Heel', 'Base', 'Tongue']);
  assert.equal(await page.locator('.component-card').nth(1).locator('.pattern-component-body').isVisible(), false);
  const json = JSON.parse((await exportDownload(page, '#exportDraftBtn')).buffer.toString());
  assert.deepEqual(json.pattern.entries.map(entry => entry.name), ['Heel', 'Base', 'Tongue']);
  await page.evaluate(() => {
    window.exportOrder = [];
    const original = CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.fillText = function(text, ...args) {
      if (['Base', 'Heel', 'Tongue'].includes(text)) exportOrder.push(text);
      return original.call(this, text, ...args);
    };
  });
  await exportDownload(page, '#downloadRecipeBtn');
  assert.deepEqual(await page.evaluate(() => exportOrder), ['Heel', 'Base', 'Tongue']);
  await page.locator('.pattern-duplicate-btn').first().click();
  assert.deepEqual(await names(), ['Heel', 'Heel', 'Base', 'Tongue']);
  assert.equal(await page.locator('.pattern-move-down-btn').last().isDisabled(), true);
  await page.locator('.remove-component-btn').last().click();
  assert.equal(await page.locator('.pattern-move-down-btn').last().isDisabled(), true);
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  }
});
