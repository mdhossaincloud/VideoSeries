// Usage: node render.js            → all frames to build/frames
//        node render.js kf t1 t2…  → keyframes to build/kf_<t>.jpg
const fs = require('fs');
const { openPages, shot } = require('../production/page');
const F = require('./film');
const EXTRA = { '/dubai_logo.jpg': { body: fs.readFileSync(__dirname + '/assets/dubai_logo_original.jpg'), type: 'image/jpeg' } };
(async () => {
  const kf = process.argv[2] === 'kf';
  const { browser, pages } = await openPages(kf ? 1 : 4, F.W, F.H, EXTRA);
  await Promise.all(pages.map(p => p.evaluate(async () => { const i = new Image(); i.src = '/dubai_logo.jpg'; await i.decode(); })));
  if (kf) {
    for (const t of process.argv.slice(3).map(Number)) await shot(pages[0], F.frameSVG(t), `build/kf_${t.toFixed(2)}.jpg`);
  } else {
    fs.mkdirSync('build/frames', { recursive: true });
    const N = Math.round(F.DUR * F.FPS); let next = 0;
    await Promise.all(pages.map(async p => { while (next < N) { const i = next++; await shot(p, F.frameSVG(i / F.FPS), `build/frames/f${String(i).padStart(5, '0')}.jpg`); } }));
    console.log('done', N);
  }
  await browser.close();
})();
