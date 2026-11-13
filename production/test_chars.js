const { openPages, shot } = require('./page');
const C = require('./chars');
const g = (x, s, inner) => `<g transform="translate(${x} 900) scale(${s})">${inner}</g>`;
(async () => {
  const { browser, pages } = await openPages(1, 1920, 1000);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1000"><rect width="1920" height="1000" fill="#EBDDC6"/>` +
    g(170, 1.5, C.rafi({ armL: 'toolbox', armR: 'wave', expr: 'happy', mouth: 'aa', waveA: 10 })) +
    g(480, 1.5, C.rafi({ armL: 'down', armR: 'tool', reachR: [150, -250], expr: 'normal', look: [3, 1] })) +
    g(800, 1.5, C.nasima({ armL: 'counter', armR: 'phone', expr: 'surprised', mouth: 'oo' })) +
    g(1100, 1.5, C.nasima({ armL: 'hip', armR: 'gesture', expr: 'annoyed', mouth: 'ee', blink: true })) +
    g(1400, 1.5, C.dadu({ armL: 'behind', armR: 'raise', expr: 'happy', mouth: 'aa' })) +
    g(1640, 1.5, C.dadu({ armL: 'down', armR: 'tap', expr: 'thinking' })) +
    g(1820, 1.5, C.girl({ expr: 'sad', look: [4, 0] })) + `</svg>`;
  await shot(pages[0], svg, 'build/test_chars.png', 'png');
  await browser.close();
})();
