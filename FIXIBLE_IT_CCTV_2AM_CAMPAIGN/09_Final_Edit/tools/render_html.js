// usage: node render_html.js page.html outdir fps dur [stillTime]
const { chromium } = require('playwright');
(async () => {
  const [page_, out, fps, dur, still] = process.argv.slice(2);
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await p.goto('file://' + require('path').resolve(page_)); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(500);
  if (still !== undefined) { await p.evaluate(t => setT(t), +still); await p.screenshot({ path: out }); await b.close(); return; }
  const n = Math.round(fps * dur);
  for (let i = 0; i < n; i++) { await p.evaluate(t => setT(t), i / fps); await p.screenshot({ path: `${out}/f${String(i).padStart(4, '0')}.png` }); }
  await b.close();
})();
