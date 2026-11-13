// Environments for the Dubai Gas & Rice ad: residential lane (A) and the gas & rice shop (B).
'use strict';
const R = require('../characters/rig');
const { PAL, INK, shade, P, L, E, EF, F, G } = R;
const { rect, rectF, txt, sparkle, rng } = require('../production/scenes');

const DG = { navy: '#0F2747', navy2: '#0B1C36', gold: '#C9A24A', gold2: '#E6C77A', white: '#FFFFFF' };

// ---------- props ----------
// Generic LPG cylinder (no brand, no price). (x,y) = bottom centre. Height ≈ 300*s.
function lpg(x, y, s, col) {
  const dk = shade(col, 0.78);
  let g = '';
  g += P('M-62 0 L-58 -26 L58 -26 L62 0 Z', '#4A4F5C');                                   // foot ring
  g += P('M-74 -24 Q-80 -150 -70 -206 Q-62 -236 -30 -240 L30 -240 Q62 -236 70 -206 Q80 -150 74 -24 Q0 -14 -74 -24 Z', col); // body
  g += F('M40 -236 Q66 -230 70 -204 Q78 -150 72 -28 Q60 -24 50 -24 Q60 -130 40 -236 Z', dk);
  g += L('M-76 -112 Q0 -100 76 -112', 4, dk);                                              // weld seam
  g += rectF(-46, -200, 18, 130, '#FFFFFF', 9, 'opacity="0.22"');                           // highlight
  g += P('M-40 -238 L-40 -290 Q-40 -300 -30 -300 L30 -300 Q40 -300 40 -290 L40 -238 Z', col); // collar / shroud
  g += P('M-22 -290 L22 -290 L22 -268 L-22 -268 Z', '#F6F1E7');                             // handle hole
  g += P('M-12 -238 L12 -238 L12 -262 L-12 -262 Z', '#9AA3AD') + P('M-16 -262 L16 -262 L16 -272 L-16 -272 Z', '#B9C0C8'); // valve
  return G(g, `translate(${x} ${y}) scale(${s})`);
}
function riceSack(x, y, s, col, label = 'চাল', band = PAL.red) {
  let g = P('M-80 0 Q-92 -110 -76 -200 Q-70 -222 -40 -226 L40 -226 Q70 -222 76 -200 Q92 -110 80 0 Q0 10 -80 0 Z', col);
  g += P('M-40 -226 Q-30 -250 -46 -262 Q0 -248 46 -262 Q30 -250 40 -226 Z', col);
  g += L('M-72 -60 Q0 -50 72 -60', 3, shade(col, 0.82)) + L('M-74 -150 Q0 -140 74 -150', 3, shade(col, 0.82));
  g += rectF(-56, -138, 112, 22, band, 4) + txt(0, -76, label, 46, INK);
  return G(g, `translate(${x} ${y}) scale(${s})`);
}
function ricePack(x, y, s, col) {
  return G(P('M-30 0 L-34 -84 Q-34 -92 -26 -92 L26 -92 Q34 -92 34 -84 L30 0 Z', PAL.white) + rectF(-30, -66, 60, 24, col, 3) + `<ellipse cx="0" cy="-30" rx="14" ry="8" fill="${DG.gold}"/>`, `translate(${x} ${y}) scale(${s})`);
}
function clothes(x, y, t) { // clothesline with gently swaying laundry
  let g = L(`M${x} ${y} Q${x + 200} ${y + 26} ${x + 400} ${y}`, 3, '#4A4F5C');
  [[40, PAL.teal, 60, 90], [130, '#E9DCCB', 70, 120], [230, PAL.red, 54, 80], [320, '#3B6EA8', 60, 100]].forEach(([dx, c, w, h], i) => {
    const sw = Math.sin(t * 1.6 + i) * 3, yy = y + 26 * Math.sin(Math.PI * dx / 400);
    g += G(P(`M${-w / 2} 0 L${w / 2} 0 L${w / 2 - 4} ${h} L${-w / 2 + 4} ${h} Z`, c), `translate(${x + dx} ${yy}) rotate(${sw})`);
  });
  return g;
}

// ---------- ENVIRONMENT A: residential lane near the madrasa (day) ----------
function lane(t, o = {}) {
  const r = rng(21);
  let back = rectF(-1400, -1800, 2800, 3600, '#BFE3F0');
  // clouds
  [[-420, -1180], [260, -1260], [620, -1120]].forEach(([x, y], i) => { const dx = ((t * 8 + i * 200) % 2400) - 1200; back += `<g transform="translate(${x + dx * 0.15} ${y})" opacity="0.9"><ellipse cx="0" cy="0" rx="110" ry="40" fill="#fff"/><ellipse cx="60" cy="-24" rx="70" ry="40" fill="#fff"/><ellipse cx="-60" cy="-14" rx="60" ry="32" fill="#fff"/></g>`; });
  // distant madrasa / mosque silhouette (pale, desaturated) — locality cue, no text
  const far = '#CFD9DC';
  back += rectF(-200, -980, 440, 420, far) + `<path d="M-90 -980 Q20 -1140 130 -980 Z" fill="${far}"/>` + rectF(170, -1200, 44, 640, far) + `<path d="M162 -1200 Q192 -1270 222 -1200 Z" fill="${far}"/>` + `<circle cx="20" cy="-1100" r="8" fill="${far}"/>`;
  for (let i = 0; i < 4; i++) back += rectF(-170 + i * 100, -900, 40, 70, '#BCC8CB', 20);
  // distant rooftops
  [[-760, -760, 380, 400, '#D9CDBB'], [380, -720, 420, 360, '#D5C6B0'], [-900, -640, 260, 300, '#CDBFA8']].forEach(([x, y, w, h, c]) => { back += rectF(x, y, w, h, c); for (let k = 0; k < 4; k++) back += rectF(x + 30 + k * 80, y + 50, 40, 50, '#B7AA94', 4); });
  let mid = '';
  // left house (Nasima's): pale yellow plaster, door, window with grill, small kitchen nook with LPG cylinder
  mid += rect(-900, -700, 760, 1180, '#EFD99A') + F('M-900 -700 L-140 -700 L-140 -660 L-900 -660 Z', '#D8BF7C');
  mid += rect(-860, -760, 760, 70, '#E8E1D2', 6);                                           // parapet
  mid += rect(-500, -40, 210, 500, '#5E7F6E', 6) + L('M-395 -30 L-395 460', 4) + EF(-418, 230, 6, 6, PAL.mari);   // door
  mid += rect(-820, -470, 240, 220, '#BFE3E0', 6); for (let x = -800; x < -580; x += 40) mid += L(`M${x} -468 L${x} -252`, 5, '#4A4F5C');
  mid += P('M-840 -490 L-560 -490 L-580 -460 L-820 -460 Z', '#B57B4F');                     // sunshade
  mid += L('M-900 -560 L-140 -560', 3, '#D8BF7C');
  // balcony with clothes
  mid += rect(-460, -560, 300, 24, '#C9C2B4', 4) + Array.from({ length: 7 }, (_, i) => L(`M${-450 + i * 46} -536 L${-450 + i * 46} -440`, 5, '#4A4F5C')).join('') + L('M-460 -440 L-160 -440', 6, '#4A4F5C');
  mid += clothes(-500, -660, t);
  // kitchen nook + small LPG cylinder by the door
  mid += rect(-280, 160, 150, 300, '#E2D3B4', 4) + lpg(-205, 455, 0.62, '#B94A3A');
  // right house: pale teal, gate, potted plants
  mid += rect(160, -620, 760, 1100, '#BFD8CF') + rect(130, -680, 820, 70, '#E8E1D2', 6);
  mid += rect(300, -420, 230, 200, '#F6F1E7', 6) + L('M415 -420 L415 -220 M300 -320 L530 -320', 5, '#4A4F5C');
  mid += rect(560, 0, 300, 460, '#3E5A66', 4); for (let x = 580; x < 860; x += 34) mid += L(`M${x} 10 L${x} 450`, 5, '#22343C');  // iron gate
  mid += P('M540 -20 L880 -20 L880 0 L540 0 Z', '#22343C');
  // electric pole + wires
  mid += rect(110, -1400, 30, 1880, '#7C808C') + L(`M-1200 -1250 Q0 ${-1160 + Math.sin(t) * 6} 1200 -1230`, 4, '#3A3F4C') + L(`M-1200 -1190 Q0 ${-1110 + Math.sin(t * 1.2) * 6} 1200 -1180`, 4, '#3A3F4C');
  // lane floor (brick) + drain edge
  mid += rectF(-1400, 470, 2800, 1300, '#C98F6A') + rectF(-1400, 470, 2800, 22, '#9C6A4C');
  for (let y = 520; y < 1700; y += 60) for (let x = -1400 + ((y / 60) % 2) * 60; x < 1400; x += 120) mid += rectF(x, y, 110, 52, '#BC8260', 4);
  // background life: a cat crossing far, sparrow hopping on the parapet
  const cx = -1100 + ((t * 70) % 2600);
  mid += G(P('M-30 0 Q-30 -26 0 -26 Q30 -26 30 0 Z', '#4A4048') + E(34, -26, 14, 12, '#4A4048') + L('M-30 -10 Q-56 -30 -48 -50', 6, '#4A4048'), `translate(${cx} 520) scale(0.8)`);
  const hop = Math.abs(Math.sin(t * 5)) * 10;
  mid += G(E(0, -hop, 14, 10, '#8A6A4A') + E(12, -8 - hop, 7, 7, '#8A6A4A') + L(`M18 ${-8 - hop} l8 2`, 3, PAL.mari), `translate(${-300 + Math.sin(t * 0.5) * 60} -770)`);
  let front = G(P('M-60 0 L60 0 L46 160 L-46 160 Z', PAL.terra) + P(`M0 0 Q${-120 + Math.sin(t) * 8} -180 -60 -330 Q-10 -180 0 0 Z`, '#4E8A4A') + P(`M0 0 Q${110 + Math.sin(t) * 8} -200 70 -320 Q20 -180 0 0 Z`, '#5E9E54'), 'translate(-560 1060)');
  front += G(P('M-50 0 L50 0 L40 130 L-40 130 Z', '#B57B4F') + P('M0 0 Q-90 -150 -40 -250 Q-5 -130 0 0 Z', '#5E9E54') + P('M0 0 Q90 -140 50 -240 Q10 -130 0 0 Z', '#4E8A4A'), 'translate(600 1090)');
  return { back, mid, front };
}

// ---------- ENVIRONMENT B: Dubai Gas & Rice shop ----------
const CYL_COLS = ['#B94A3A', '#2F6FA3', '#3C8A5A', '#6F7F8F', '#B94A3A', '#2F6FA3'];
function shopFront(t) {
  let back = rectF(-1400, -1800, 2800, 3600, '#BFE3F0');
  back += rectF(-1400, -1100, 2800, 600, '#D5C6B0');
  for (let k = 0; k < 8; k++) back += rectF(-1200 + k * 320, -1040, 120, 140, '#B7AA94', 6);
  let mid = '';
  mid += rect(-560, -900, 1120, 1380, '#E8E1D2');
  // signboard
  mid += rect(-520, -860, 1040, 250, DG.navy, 16) + `<rect x="-506" y="-846" width="1012" height="222" rx="12" fill="none" stroke="${DG.gold}" stroke-width="5"/>`;
  mid += `<image href="/dubai_logo.jpg" x="-492" y="-836" width="200" height="200"/>`;
  mid += txt(110, -752, 'DUBAI GAS &amp; RICE', 82, DG.white, 'middle', 'letter-spacing="3"') + txt(110, -664, 'দুবাই গ্যাস এন্ড রাইস', 60, DG.gold2);
  // rolled-up shutter + open shop interior
  mid += rect(-500, -580, 1000, 70, '#8F98A8', 6) + L('M-496 -560 L496 -560 M-496 -540 L496 -540', 3, '#6E7688');
  mid += rect(-480, -510, 960, 990, '#F2E7CF');
  mid += rect(-470, -500, 940, 24, '#FFFDF2', 12);
  // rice sacks stacked on the right inside, shelves of rice packs on the back wall
  mid += rect(-460, -380, 920, 16, '#8A5A3C') + rect(-460, -200, 920, 16, '#8A5A3C');
  for (let i = 0; i < 12; i++) mid += ricePack(-420 + i * 76, -380, 0.8, [PAL.red, PAL.teal, DG.gold, '#3B6EA8'][i % 4]);
  for (let i = 0; i < 12; i++) mid += ricePack(-420 + i * 76, -200, 0.8, [DG.gold, '#3B6EA8', PAL.red, PAL.teal][i % 4]);
  mid += riceSack(300, 470, 0.95, '#F3EEE3') + riceSack(410, 470, 0.95, '#E2D3B4', 'চাল', DG.gold) + riceSack(355, 260, 0.9, '#F3EEE3');
  // LPG cylinders in front-left rows (upright)
  for (let i = 0; i < 5; i++) mid += lpg(-410 + i * 105, 300, 0.55, CYL_COLS[i]);
  for (let i = 0; i < 4; i++) mid += lpg(-360 + i * 105, 470, 0.62, CYL_COLS[i + 1]);
  // street
  mid += rectF(-1400, 480, 2800, 1400, '#9A9488') + rectF(-1400, 480, 2800, 24, '#7E786E');
  // passing rickshaw (background life)
  const rx = ((t * 160) % 2800) - 1400;
  const rk = G(`<circle cx="-60" cy="0" r="46" fill="none" stroke="${INK}" stroke-width="8"/><circle cx="70" cy="0" r="46" fill="none" stroke="${INK}" stroke-width="8"/>` + P('M-110 -40 L30 -150 L110 -150 L110 -10 L-110 -10 Z', PAL.red) + P('M20 -200 Q80 -260 140 -200 L130 -150 L30 -150 Z', DG.gold) + L('M-110 -10 L-150 -80', 6), `translate(${rx} 700) scale(-1 1)`);
  let front = rk;
  front += rect(-1400, 1300, 2800, 40, '#6E685E');
  return { back, mid, front };
}
function shopInside(t, o = {}) {
  let back = rectF(-1400, -1800, 2800, 3600, '#F2E7CF') + rectF(-1400, -1800, 2800, 500, '#E5D6B6');
  back += `<ellipse cx="0" cy="-1080" rx="560" ry="160" fill="#FFF8DC" opacity="0.5"/>` + rect(-240, -1110, 480, 30, '#FFFDF2', 15);
  // back wall: logo board + shelves of rice packs
  back += rect(-330, -1010, 660, 210, DG.navy, 14) + `<image href="/dubai_logo.jpg" x="-316" y="-996" width="182" height="182"/>` + txt(80, -910, 'DUBAI GAS &amp; RICE', 54, DG.white) + txt(80, -848, 'দুবাই গ্যাস এন্ড রাইস', 40, DG.gold2);
  [-700, -480].forEach((y, k) => { back += rect(-900, y, 1800, 20, '#8A5A3C'); for (let i = 0; i < 22; i++) back += ricePack(-860 + i * 80, y, 0.9, [PAL.red, PAL.teal, DG.gold, '#3B6EA8'][(i + k) % 4]); });
  let mid = '';
  // gas-cylinder display: left side, three upright rows on a low platform
  mid += rect(-1000, 300, 900, 40, '#8A8F99', 6);
  for (let i = 0; i < 6; i++) mid += lpg(-940 + i * 150, -10, 0.82, CYL_COLS[i % 6]);
  for (let i = 0; i < 6; i++) mid += lpg(-880 + i * 150, 150, 0.86, CYL_COLS[(i + 2) % 6]);
  for (let i = 0; i < 6; i++) mid += lpg(-940 + i * 150, 310, 0.9, CYL_COLS[(i + 4) % 6]);
  // rice display: right side, stacked sacks
  const sk = ['#F3EEE3', '#E2D3B4', '#F3EEE3', '#E9DCCB'];
  for (let i = 0; i < 4; i++) mid += riceSack(560 + i * 170, 120, 0.95, sk[i], 'চাল', [PAL.red, DG.gold, '#3B6EA8', PAL.teal][i]);
  for (let i = 0; i < 3; i++) mid += riceSack(640 + i * 170, 330, 1.0, sk[(i + 1) % 4], 'চাল', [DG.gold, PAL.red, PAL.teal][i]);
  // counter in the centre
  mid += rect(-160, 140, 600, 36, '#9B6A44', 6) + rect(-140, 170, 560, 400, '#B57B4F') + rectF(-120, 200, 520, 80, DG.navy, 8) + txt(140, 256, 'DUBAI GAS &amp; RICE', 42, DG.gold2);
  mid += rectF(-1400, 560, 2800, 1300, '#CFC4AE') + rectF(-1400, 560, 2800, 16, '#B5A98F');
  // product shine sweep
  if (o.shine !== undefined) {
    const k = t - o.shine;
    if (k > 0 && k < 0.8) { const x = -1000 + k / 0.8 * 1000; mid += `<path d="M${x} -300 L${x + 60} -300 L${x - 40} 360 L${x - 100} 360 Z" fill="#FFFFFF" opacity="0.35"/>`; }
  }
  return { back, mid, front: '' };
}

module.exports = { DG, lpg, riceSack, lane, shopFront, shopInside };
