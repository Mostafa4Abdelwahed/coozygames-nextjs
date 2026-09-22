// Smoke test: loads a game page, presses play, and samples the proxied
// iframe state (loading text, canvas count) + takes a screenshot.
// Usage: node scripts/smoke-game.mjs [slug] [seconds]
import puppeteer from 'puppeteer-core';

const slug = process.argv[2] || 'subway-surfers';
const budget = parseInt(process.argv[3] || '90', 10);

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: true,
  args: ['--no-sandbox', '--enable-unsafe-swiftshader', '--window-size=1280,800'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 800 });
page.on('pageerror', (e) => console.log('[pageerror]', String(e).slice(0, 200)));

await page.goto(`http://localhost:3000/game/${slug}`, { waitUntil: 'networkidle2', timeout: 60000 });
await page.waitForSelector('button[aria-label^="العب"]', { timeout: 15000 });
await page.click('button[aria-label^="العب"]');
console.log('play pressed');

const steps = Math.floor(budget / 5);
for (let i = 0; i < steps; i++) {
  await new Promise((r) => setTimeout(r, 5000));
  const state = await page.evaluate(() => {
    const frames = Array.from(document.querySelectorAll('iframe'));
    const f = frames[0];
    const info = { frames: frames.length, src: (f?.src || '').slice(0, 100) };
    try {
      const d = f?.contentDocument;
      if (d) {
        info.bodyText = ((d.body?.innerText || '').replace(/\s+/g, ' ')).slice(0, 250);
        info.canvas = d.querySelectorAll('canvas').length;
      } else {
        info.noAccess = true;
      }
    } catch {
      info.crossOrigin = true;
    }
    return info;
  });
  console.log(`t+${(i + 1) * 5}s`, JSON.stringify(state).slice(0, 350));
}
await page.screenshot({ path: `smoke-${slug}.png` });
console.log(`screenshot saved: smoke-${slug}.png`);
await browser.close();
