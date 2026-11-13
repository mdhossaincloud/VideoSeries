// Builds the FIXIBLE IT cast sheet (1920x1080) and renders it to PNG with Chromium.
// Usage: node build_sheet.js [outPng]
'use strict';
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const R = require('./rig');
const { PAL, INK, CAST, EF, L } = R;

const W = 1920, H = 1080;
const fontPath = path.join(__dirname, 'assets/fonts/HindSiliguri-Bold.ttf');
const fontB64 = fs.readFileSync(fontPath).toString('base64');

function pill(x, y, w, h, fill, text, size, col = '#fff', anchor = 'middle') {
  const tx = anchor === 'middle' ? x + w / 2 : x + 22;
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="${fill}"/>` +
    `<text x="${tx}" y="${y + h / 2 + size * 0.36}" font-size="${size}" fill="${col}" text-anchor="${anchor}">${text}</text>`;
}

let svg = '';
// title
svg += `<rect x="28" y="22" width="1080" height="78" rx="39" fill="${PAL.night}"/>`;
svg += `<text x="64" y="76" font-size="44" fill="#fff">FIXIBLE IT অ্যাড: <tspan fill="${PAL.mari}">নতুন ক্যারেক্টার কাস্ট</tspan></text>`;
svg += L('M1130 61 L1600 61', 4, PAL.night);
svg += pill(1620, 34, 272, 54, PAL.night, 'Bangla Toon Flat', 26, '#fff');

// full-body cast
const xs = [220, 590, 960, 1330, 1690], ground = 640;
CAST.forEach((c, i) => {
  const x = xs[i];
  svg += `<g transform="translate(${x} ${ground})">${c.fn()}</g>`;
  const label = `${c.bn}`;
  const w = 64 + label.length * 22;
  svg += pill(x - w / 2, ground + 18, w, 44, PAL.night, label, 26);
  svg += `<text x="${x}" y="${ground + 88}" font-size="19" fill="${INK}" text-anchor="middle">${c.en}</text>`;
  svg += `<text x="${x}" y="${ground + 112}" font-size="16" fill="#6A6470" text-anchor="middle">${c.mark}</text>`;
});

// bottom panels
const py = 778, ph = 268;
const panel = (x, w, title, tw) => `<rect x="${x}" y="${py}" width="${w}" height="${ph}" rx="22" fill="none" stroke="${PAL.night}" stroke-width="3"/>` +
  pill(x + 10, py - 20, tw, 44, PAL.night, title, 24, '#fff');

// expressions
svg += panel(28, 760, 'রাফির এক্সপ্রেশন', 260);
const exprs = [['normal', 'স্বাভাবিক'], ['happy', 'খুশি'], ['surprised', 'অবাক'], ['thinking', 'চিন্তিত'], ['annoyed', 'বিরক্ত'], ['sad', 'দুঃখী']];
exprs.forEach(([e, bn], i) => {
  const cx = 100 + i * 124, cy = py + 128;
  svg += `<g transform="translate(${cx} ${cy}) scale(0.78)">${bust(e, null)}</g>`;
  svg += pill(cx - 52, py + 212, 104, 34, PAL.night, bn, 19);
});
// mouth shapes
svg += panel(806, 676, 'মুখের আকার (লিপ-সিংক)', 330);
const mouths = [['closed', 'বন্ধ'], ['aa', 'অ-আ'], ['ee', 'ই-এ'], ['oo', 'উ-ও'], ['mm', 'ম-ব-প']];
mouths.forEach(([m, bn], i) => {
  const cx = 880 + i * 132, cy = py + 128;
  svg += `<g transform="translate(${cx} ${cy}) scale(0.78)">${bust('normal', m)}</g>`;
  svg += pill(cx - 52, py + 212, 104, 34, PAL.night, bn, 19);
});
// palette
svg += panel(1500, 392, 'প্যালেট', 140);
const pal = [['#F6F1E7', 'Alpona'], ['#C8643B', 'Terracotta'], ['#F2A900', 'Marigold'], ['#B3202A', 'Lal-Paar'], ['#1F7A74', 'River Teal'], ['#D9B88F', 'Jute'], ['#1B1A22', 'Ink'], ['#1E2A4A', 'Night']];
pal.forEach(([hex, nm], i) => {
  const cx = 1530 + (i % 4) * 90, cy = py + 46 + Math.floor(i / 4) * 106;
  svg += `<rect x="${cx}" y="${cy}" width="66" height="56" rx="12" fill="${hex}" stroke="${INK}" stroke-width="3"/>`;
  svg += `<text x="${cx + 33}" y="${cy + 76}" font-size="14" fill="${INK}" text-anchor="middle">${hex}</text>`;
});

// alpona border strip
let border = `<rect x="0" y="${H - 22}" width="${W}" height="22" fill="${PAL.night}"/>`;
for (let x = 12; x < W; x += 36) border += `<path d="M${x} ${H - 11} l9 -7 l9 7 l-9 7 Z" fill="${PAL.white}"/><circle cx="${x + 27}" cy="${H - 11}" r="3" fill="${PAL.mari}"/>`;
svg += border;

function bust(expr, mouth) {
  // head + shoulders of Rafi, head centred at (0,0)
  const shoulders = `<path d="M-60 112 Q-62 66 -30 56 Q0 70 30 56 Q62 66 60 112 Z" fill="${PAL.teal}" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>` +
    `<path d="M-22 54 L0 70 L-8 86 L-26 64 Z M22 54 L0 70 L8 86 L26 64 Z" fill="${PAL.mari}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>` +
    `<path d="M-12 40 L12 40 L12 62 L-12 62 Z" fill="#C98B5E" stroke="${INK}" stroke-width="5"/>`;
  return `<clipPath id="bc${expr}${mouth}"><rect x="-90" y="-90" width="180" height="196"/></clipPath><g clip-path="url(#bc${expr}${mouth})">` +
    shoulders + R.rafiHead({ cx: 0, cy: 0, expr, mouth }) + '</g>';
}

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:'Hind Siliguri';src:url(data:font/ttf;base64,${fontB64}) format('truetype');font-weight:700}
html,body{margin:0;background:${PAL.white}}
svg text{font-family:'Hind Siliguri';font-weight:700}
</style></head><body>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<rect width="${W}" height="${H}" fill="#FBF6EC"/>${svg}</svg></body></html>`;

(async () => {
  const out = process.argv[2] || path.join(__dirname, 'fixibleit_cast_sheet.png');
  fs.writeFileSync(out.replace(/\.png$/, '.html'), html);
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  await p.setContent(html);
  await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: out });
  await b.close();
  console.log('wrote', out);
})();
