const { openPages, shot } = require('./page');
const F = require('./film');
(async () => {
  const times = process.argv.slice(2).map(Number);
  const ts = times.length ? times : F.SHOTS.map(s => +(Math.min(s.t1, F.DUR) * 0.5 + s.t0 * 0.5).toFixed(2));
  const { browser, pages } = await openPages(1, F.W, F.H);
  for (const t of ts) await shot(pages[0], F.frameSVG(t), `build/kf_${t.toFixed(2)}.jpg`);
  await browser.close();
  console.log(ts.join(' '));
})();
