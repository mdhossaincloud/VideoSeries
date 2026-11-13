// Shared Chromium page setup: serves font + logo from a fake origin so frames can reference them.
'use strict';
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const FONT = fs.readFileSync(path.join(__dirname, '../characters/assets/fonts/HindSiliguri-Bold.ttf'));
const LOGO = fs.readFileSync(path.join(__dirname, 'assets/fixibleit_logo_original.png'));
const HTML = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:'Hind Siliguri';src:url(/font.ttf) format('truetype');font-weight:700}
html,body{margin:0;background:#000;overflow:hidden} svg text{font-family:'Hind Siliguri';font-weight:700}
</style></head><body><div id="c"></div><img id="pre" src="/logo.png" style="position:absolute;left:-9999px"><span style="font-family:'Hind Siliguri';position:absolute;left:-9999px">বাংলা FIXIBLE</span></body></html>`;
async function openPages(n, W, H, extra = {}) {
  const browser = await chromium.launch();
  const pages = [];
  for (let i = 0; i < n; i++) {
    const p = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
    await p.route('http://render.local/**', r => {
      const u = r.request().url();
      if (u.endsWith('/font.ttf')) return r.fulfill({ body: FONT, contentType: 'font/ttf' });
      if (u.endsWith('/logo.png')) return r.fulfill({ body: LOGO, contentType: 'image/png' });
      for (const k in extra) if (u.endsWith(k)) return r.fulfill({ body: extra[k].body, contentType: extra[k].type });
      return r.fulfill({ body: HTML, contentType: 'text/html' });
    });
    await p.goto('http://render.local/');
    await p.evaluate(async () => { await document.fonts.load("700 20px 'Hind Siliguri'"); await document.fonts.ready; const i = document.getElementById('pre'); if (!i.complete) await new Promise(r => i.onload = r); });
    pages.push(p);
  }
  return { browser, pages };
}
async function shot(page, svg, out, type = 'jpeg') {
  await page.evaluate(s => { document.getElementById('c').innerHTML = s; }, svg);
  await page.screenshot({ path: out, type, quality: type === 'jpeg' ? 92 : undefined });
}
module.exports = { openPages, shot };
