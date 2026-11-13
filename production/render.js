// Renders every frame (30fps) to build/frames/*.jpg using N parallel Chromium pages.
const fs = require('fs');
const { openPages, shot } = require('./page');
const F = require('./film');
(async () => {
  const N = Math.round(F.DUR * F.FPS);
  const from = +(process.argv[2] || 0), to = +(process.argv[3] || N);
  fs.mkdirSync('build/frames', { recursive: true });
  const { browser, pages } = await openPages(4, F.W, F.H);
  let next = from, done = 0; const t0 = Date.now();
  await Promise.all(pages.map(async p => {
    while (next < to) {
      const i = next++;
      await shot(p, F.frameSVG(i / F.FPS), `build/frames/f${String(i).padStart(5, '0')}.jpg`);
      if (++done % 100 === 0) console.log(done, 'frames', ((Date.now() - t0) / 1000).toFixed(0) + 's');
    }
  }));
  await browser.close();
  console.log('done', N, 'frames total; rendered', from, '→', to);
})();
