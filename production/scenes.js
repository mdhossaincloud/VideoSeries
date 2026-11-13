// Environments + device props for the FIXIBLE IT vertical ad (world units; frame = 1080x1920 at zoom 1).
'use strict';
const R = require('../characters/rig');
const { PAL, INK, shade, P, L, E, EF, F, G } = R;
const { BRAND } = require('./chars');

const rect = (x, y, w, h, fill, rx = 0, extra = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${INK}" stroke-width="5" stroke-linejoin="round" ${extra}/>`;
const rectF = (x, y, w, h, fill, rx = 0, extra = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" ${extra}/>`;
const txt = (x, y, s, size, fill, anchor = 'middle', extra = '') => `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" text-anchor="${anchor}" ${extra}>${s}</text>`;
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
let uid = 0; const nid = p => `${p}${uid++}`;
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));

// ---------- tiny CCTV pane scenes (160x100 local) ----------
function paneStreet(t) {
  const rx = ((t * 26) % 220) - 40;
  return rectF(0, 0, 160, 100, '#26304C') + rectF(0, 62, 160, 38, '#3C4258') + rectF(0, 58, 160, 6, '#59607A') +
    rectF(12, 18, 26, 40, '#3A4566') + rectF(44, 26, 30, 32, '#34405E') + rectF(118, 12, 30, 46, '#3A4566') +
    rectF(18, 26, 6, 6, '#F2C25A') + rectF(124, 22, 6, 6, '#F2C25A') + rectF(130, 36, 6, 6, '#F2C25A') +
    // rickshaw passing
    `<g transform="translate(${rx} 70)"><circle cx="0" cy="14" r="9" fill="none" stroke="#C9CCD6" stroke-width="2.5"/><circle cx="26" cy="14" r="9" fill="none" stroke="#C9CCD6" stroke-width="2.5"/><path d="M-4 0 L14 -14 L30 -14 L30 4 Z" fill="${PAL.red}"/><path d="M12 -18 Q22 -30 34 -18 Z" fill="${PAL.mari}"/></g>`;
}
function paneShelf() {
  let s = rectF(0, 0, 160, 100, '#C9B58A');
  [22, 52, 82].forEach(y => { s += rectF(8, y, 144, 5, '#7A5235'); });
  const r = rng(7); const cols = [PAL.red, PAL.teal, PAL.mari, PAL.terra, '#3B6EA8', '#F6F1E7'];
  [22, 52, 82].forEach(y => { for (let x = 12; x < 148; x += 14) { const h = 10 + r() * 10; s += rectF(x, y - h, 11, h, cols[Math.floor(r() * 6)]); } });
  return s;
}
function paneDoor(t) {
  const p = (Math.sin(t * 1.5) + 1) / 2;
  return rectF(0, 0, 160, 100, '#4A4F66') + rectF(40, 14, 80, 86, '#E5CE9B') + rectF(40, 14, 80, 30, '#8F98A8') +
    [18, 24, 30, 36].map(y => rectF(40, y, 80, 2, '#6E7688')).join('') + rectF(0, 86, 160, 14, '#2F3346') +
    `<g transform="translate(${70 + p * 20} 60)"><circle cx="0" cy="-14" r="7" fill="#B07447"/><rect x="-7" y="-7" width="14" height="22" rx="4" fill="${PAL.teal}"/></g>`;
}
function paneCounter(t) {
  return rectF(0, 0, 160, 100, '#B57B4F') + rectF(10, 40, 140, 50, '#9B6A44') + rectF(20, 50, 34, 22, '#2B2F3A') + rectF(64, 48, 26, 26, PAL.mari) + rectF(98, 52, 40, 18, '#F6F1E7') +
    `<circle cx="${120 + Math.sin(t * 3) * 3}" cy="28" r="6" fill="#F6F1E7" opacity="0.6"/>`;
}
// state: off | glitch | live
function cctvScreen(state, t) {
  let s = rectF(0, 0, 330, 210, '#0C0E14');
  const panes = [[5, 5], [167, 5], [5, 107], [167, 107]];
  const fns = [paneStreet, paneShelf, paneDoor, paneCounter];
  panes.forEach(([x, y], i) => {
    const id = nid('pc');
    let inner;
    if (state === 'live') inner = fns[i](t + i);
    else if (state === 'glitch') {
      const r = rng(Math.floor(t * 30) + i * 13);
      inner = rectF(0, 0, 160, 100, '#1A1D26') + Array.from({ length: 9 }, () => rectF(0, r() * 100, 160, 2 + r() * 8, ['#F6F1E7', '#7FC6C0', '#B3202A', '#555'][Math.floor(r() * 4)], 0, `opacity="${0.4 + r() * 0.5}"`)).join('');
    } else {
      const r = rng(Math.floor(t * 12) + i * 31);
      inner = rectF(0, 0, 160, 100, '#050608') + Array.from({ length: 5 }, () => rectF(0, r() * 100, 160, 1, '#2A2E38')).join('') +
        txt(80, 56, 'NO SIGNAL', 15, '#E0444E', 'middle', 'font-family="Hind Siliguri"');
    }
    s += `<svg x="${x}" y="${y}" width="158" height="98" viewBox="0 0 160 100" preserveAspectRatio="none">${inner}</svg>`;
  });
  if (state === 'live') {
    const on = Math.floor(t * 2) % 2 === 0;
    s += rectF(10, 10, 54, 18, '#000', 4, 'opacity="0.55"') + (on ? `<circle cx="20" cy="19" r="5" fill="#E0444E"/>` : '') + txt(42, 24, 'LIVE', 12, '#fff');
  }
  return s;
}
function monitor(x, y, w, h, screen) {
  // (x,y) = bottom-centre of the stand
  return G(P(`M-30 0 L30 0 L18 -24 L-18 -24 Z`, '#3A3F4C') + rect(-10, -44, 20, 24, '#3A3F4C') +
    rect(-w / 2, -h - 40, w, h, '#2B2F3A', 12) +
    `<svg x="${-w / 2 + 12}" y="${-h - 28}" width="${w - 24}" height="${h - 24}" viewBox="0 0 330 210" preserveAspectRatio="none">${screen}</svg>` +
    EF(w / 2 - 22, -52, 4, 4, '#7CE38B'), `translate(${x} ${y})`);
}
function dvr(x, y, state, t) {
  const blink = Math.floor(t * 3) % 2;
  const led = state === 'live' ? ['#7CE38B', '#7CE38B', blink ? '#7CE38B' : '#2E5E3A'] : ['#E0444E', blink ? '#E0444E' : '#5A1E22', '#333'];
  return G(rect(-80, -42, 160, 42, '#30343F', 8) + rectF(-66, -30, 60, 6, '#151820', 3) + led.map((c, i) => `<circle cx="${30 + i * 16}" cy="-21" r="5" fill="${c}"/>`).join('') +
    L('M80 -20 Q120 -20 130 10', 5, '#1B1A22') + L('M-80 -14 Q-110 -10 -116 20', 5, '#1B1A22'), `translate(${x} ${y})`);
}

// ---------- Wi-Fi router ----------
function router(x, y, s, state, t) {
  const ok = state === 'ok';
  const blink = Math.floor(t * 4) % 2;
  const leds = ok ? ['#7CE38B', '#7CE38B', (Math.floor(t * 6) % 2) ? '#7CE38B' : '#3D8A4C', '#7CE38B'] : ['#7CE38B', blink ? '#E0444E' : '#4A1A1E', '#3A3A3A', '#3A3A3A'];
  let g = L('M-50 -34 L-62 -110', 9) + L('M-50 -34 L-62 -110', 4, '#3A3F4C') + L('M50 -34 L62 -110', 9) + L('M50 -34 L62 -110', 4, '#3A3F4C');
  g += rect(-80, -40, 160, 44, PAL.white, 12) + rectF(-74, -8, 148, 8, '#D8D2C6', 4) + leds.map((c, i) => `<circle cx="${-36 + i * 24}" cy="-20" r="5.5" fill="${c}" stroke="${INK}" stroke-width="2"/>`).join('');
  // signal icon above
  const icx = 0, icy = -150;
  const arcs = [[20, 1], [38, 2], [56, 3]];
  const lvl = ok ? 3 : 1;
  arcs.forEach(([r, n]) => {
    const col = n <= lvl ? (ok ? BRAND.teal : '#E0444E') : '#B9B2A6';
    g += L(`M${icx - r * 0.75} ${icy - r * 0.55} Q${icx} ${icy - r * 1.25} ${icx + r * 0.75} ${icy - r * 0.55}`, 9, col, `opacity="${n <= lvl && !ok ? (blink ? 1 : 0.45) : 1}"`);
  });
  g += `<circle cx="${icx}" cy="${icy}" r="7" fill="${ok ? BRAND.teal : '#E0444E'}"/>`;
  if (!ok) g += L(`M${icx + 40} ${icy - 10} l18 18 M${icx + 58} ${icy - 10} l-18 18`, 6, '#E0444E', `opacity="${blink ? 1 : 0.4}"`);
  return G(g, `translate(${x} ${y}) scale(${s})`);
}

// ---------- online class laptop ----------
function classScreen(state, t) {
  let s = rectF(0, 0, 330, 210, '#DDEFF0');
  s += rectF(0, 0, 330, 22, BRAND.navy) + `<circle cx="14" cy="11" r="5" fill="${state === 'clear' ? '#7CE38B' : '#E0444E'}"/>` + txt(165, 16, 'অনলাইন ক্লাস', 13, '#fff');
  // whiteboard + teacher
  s += rectF(26, 34, 170, 92, '#F6F1E7', 4) + L('M40 56 L150 56 M40 74 L170 74 M40 92 L130 92', 4, '#3B6EA8');
  const talk = state === 'clear' ? Math.abs(Math.sin(t * 11)) : 0;
  s += `<g transform="translate(240 150)"><path d="M-46 60 Q-46 6 0 6 Q46 6 46 60 Z" fill="${PAL.teal}" stroke="${INK}" stroke-width="3"/><ellipse cx="0" cy="-26" rx="30" ry="33" fill="#B98258" stroke="${INK}" stroke-width="3"/><path d="M-31 -34 Q-30 -66 0 -62 Q30 -66 31 -34 Q20 -50 0 -48 Q-20 -50 -31 -34 Z" fill="${INK}"/><rect x="-22" y="-32" width="17" height="12" rx="3" fill="none" stroke="${INK}" stroke-width="2.5"/><rect x="5" y="-32" width="17" height="12" rx="3" fill="none" stroke="${INK}" stroke-width="2.5"/><ellipse cx="0" cy="-6" rx="7" ry="${1.5 + talk * 4}" fill="#7A2430"/></g>`;
  // self-view tiles
  s += rectF(26, 140, 70, 54, '#C9D8DA', 4) + rectF(104, 140, 70, 54, '#C9D8DA', 4) + `<circle cx="61" cy="160" r="10" fill="#D69466"/><circle cx="139" cy="160" r="10" fill="#B07447"/>`;
  if (state === 'frozen') {
    s += rectF(0, 22, 330, 188, '#1B1A22', 0, 'opacity="0.55"');
    const a = (t * 360) % 360;
    s += `<g transform="translate(165 116) rotate(${a})"><path d="M0 -26 A26 26 0 1 1 -24 10" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round"/></g>`;
    s += txt(165, 172, 'সংযোগ হচ্ছে...', 16, '#fff');
  }
  return s;
}
function laptop(x, y, s, screen) {
  return G(P('M-150 0 L150 0 L172 26 L-172 26 Z', '#9AA3AD') + F('M-160 12 L160 12 L166 20 L-166 20 Z', '#7F8893') +
    rect(-140, -196, 280, 192, '#2B2F3A', 10) +
    `<svg x="-128" y="-184" width="256" height="168" viewBox="0 0 330 210" preserveAspectRatio="none">${screen}</svg>`, `translate(${x} ${y}) scale(${s})`);
}

// ---------- old desktop PC ----------
function pcScreen(state, p, t) {
  if (state === 'desktop') {
    let s = rectF(0, 0, 320, 240, '#7FC6C0') + `<path d="M0 170 Q80 120 170 160 Q250 196 320 140 L320 240 L0 240 Z" fill="${BRAND.teal}"/><path d="M0 200 Q110 160 220 200 Q280 222 320 200 L320 240 L0 240 Z" fill="${shade(BRAND.teal, 0.8)}"/><circle cx="250" cy="60" r="26" fill="${PAL.mari}"/>`;
    [[16, 16, PAL.mari], [16, 62, '#3B6EA8'], [16, 108, PAL.red], [16, 154, PAL.white]].forEach(([x, y, c]) => { s += rectF(x, y, 34, 30, c, 6, `stroke="${INK}" stroke-width="2"`); });
    s += rectF(0, 220, 320, 20, BRAND.navy) + rectF(6, 224, 30, 12, BRAND.teal, 3) + txt(300, 234, '১২:০০', 10, '#fff', 'end');
    return s;
  }
  let s = rectF(0, 0, 320, 240, '#101826');
  s += `<circle cx="160" cy="88" r="30" fill="none" stroke="#C9D4E5" stroke-width="6"/><rect x="152" y="54" width="16" height="30" fill="#101826"/><line x1="160" y1="56" x2="160" y2="88" stroke="#C9D4E5" stroke-width="6" stroke-linecap="round"/>`;
  for (let i = 0; i < 6; i++) {
    const a = t * 3 + i * 0.5;
    s += `<circle cx="${160 + Math.cos(a) * 18}" cy="${150 + Math.sin(a) * 18}" r="${3 - i * 0.3}" fill="#C9D4E5" opacity="${1 - i * 0.14}"/>`;
  }
  s += rectF(70, 192, 180, 12, '#2A3448', 6) + rectF(70, 192, 180 * clamp(p), 12, '#C9D4E5', 6) + txt(160, 228, 'চালু হচ্ছে...', 14, '#C9D4E5');
  return s;
}
function oldMonitor(x, y, s, screen) {
  return G(P('M-46 0 L46 0 L34 -26 L-34 -26 Z', '#CFC3A8') + rect(-150, -250, 300, 226, '#E2D6BE', 14) + F('M-140 -40 L140 -40 L140 -32 L-140 -32 Z', '#CFC3A8') +
    rect(-128, -232, 256, 180, '#1B1A22', 8) +
    `<svg x="-120" y="-224" width="240" height="164" viewBox="0 0 320 240" preserveAspectRatio="none">${screen}</svg>` +
    EF(120, -40, 4, 4, '#7CE38B') + rectF(-30, -40, 60, 6, '#BBAE92', 3), `translate(${x} ${y}) scale(${s})`);
}
function tower(x, y, s, t, busy) {
  const led = busy ? ((Math.floor(t * 9) % 2) ? '#F2A900' : '#5A4000') : '#7CE38B';
  return G(rect(-56, -250, 112, 250, '#E2D6BE', 10) + rect(-40, -224, 80, 16, '#CFC3A8', 3) + rect(-40, -196, 80, 16, '#CFC3A8', 3) + `<circle cx="0" cy="-130" r="12" fill="#CFC3A8" stroke="${INK}" stroke-width="4"/>` + `<circle cx="28" cy="-130" r="5" fill="${led}"/>` + L('M-30 -60 L30 -60 M-30 -46 L30 -46 M-30 -32 L30 -32', 3, '#BBAE92'), `translate(${x} ${y}) scale(${s})`);
}
function keyboard(x, y, s, pressed = -1) {
  let k = P('M-150 -10 L150 -10 L162 22 L-162 22 Z', '#E2D6BE');
  for (let r = 0; r < 2; r++) for (let c = 0; c < 10; c++) {
    const i = r * 10 + c;
    k += rectF(-138 + c * 28 + r * 6, -4 + r * 12 + (i === pressed ? 2 : 0), 22, 8, i === pressed ? '#9C9078' : '#BBAE92', 2);
  }
  return G(k + P('M200 4 Q200 -12 214 -12 Q228 -12 228 4 L228 14 Q228 24 214 24 Q200 24 200 14 Z', '#E2D6BE'), `translate(${x} ${y}) scale(${s})`);
}
function wallClock(x, y, r, hourA, minA) {
  let s = E(0, 0, r, r, PAL.white) + `<circle cx="0" cy="0" r="${r - 8}" fill="none" stroke="${PAL.terra}" stroke-width="4"/>`;
  for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; s += L(`M${Math.sin(a) * (r - 18)} ${-Math.cos(a) * (r - 18)} L${Math.sin(a) * (r - 26)} ${-Math.cos(a) * (r - 26)}`, 4); }
  s += L(`M0 0 L${Math.sin(hourA) * r * 0.45} ${-Math.cos(hourA) * r * 0.45}`, 8) + L(`M0 0 L${Math.sin(minA) * r * 0.7} ${-Math.cos(minA) * r * 0.7}`, 5) + EF(0, 0, 6, 6, PAL.red);
  return G(s, `translate(${x} ${y})`);
}
function fan(x, y, a) {
  let s = L(`M0 -120 L0 -20`, 10) + L(`M0 -120 L0 -20`, 5, '#CFC6B4');
  for (let i = 0; i < 3; i++) {
    const ang = a + i * 120, c = Math.cos(ang * Math.PI / 180);
    s += G(P('M0 -8 Q90 -18 170 -6 Q176 4 170 10 Q90 18 0 8 Z', '#E8E2D6'), `scale(${c} 0.35) translate(0 0)`);
  }
  s += E(0, 0, 34, 16, '#CFC6B4');
  return G(s, `translate(${x} ${y})`);
}
function sparkle(x, y, s, col = PAL.mari, rot = 0) {
  return `<path transform="translate(${x} ${y}) scale(${s}) rotate(${rot})" d="M0 -20 Q3 -3 20 0 Q3 3 0 20 Q-3 3 -20 0 Q-3 -3 0 -20 Z" fill="${col}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`;
}

// ================= ENVIRONMENTS =================
// Each returns { back, mid, front } in world coordinates.

function shopExterior(t) {
  const r = rng(3);
  let back = rectF(-1200, -1600, 2400, 3200, PAL.night);
  for (let i = 0; i < 26; i++) back += `<circle cx="${-700 + r() * 1400}" cy="${-1200 + r() * 500}" r="${2 + r() * 2.5}" fill="#F6F1E7" opacity="${0.4 + 0.5 * Math.abs(Math.sin(t * 2 + i))}"/>`;
  back += E(330, -820, 70, 70, PAL.white, 'stroke-width="0"') + EF(310, -830, 14, 10, '#E2DBCB');
  const bl = '#2C3A5E';
  [[-760, -620, 260, 1200], [-520, -760, 220, 1300], [380, -700, 260, 1300], [600, -560, 240, 1200]].forEach(([x, y, w, h], i) => {
    back += rectF(x, y, w, h, bl);
    for (let k = 0; k < 6; k++) if (r() > 0.45) back += rectF(x + 30 + (k % 3) * 70, y + 50 + Math.floor(k / 3) * 110, 36, 46, '#C9A54A', 3, `opacity="${0.35 + r() * 0.3}"`);
  });
  let mid = '';
  // building + shop
  mid += rect(-430, -620, 860, 1100, '#5A4560');
  mid += rect(-360, -470, 720, 170, PAL.mari, 14) + txt(0, -358, 'নাসিমা স্টোর', 96, INK);
  mid += rect(-330, -250, 660, 690, '#E5CE9B');
  // interior hint
  [-110, 40, 190].forEach(y => { mid += rectF(-300, y, 600, 14, '#8A5A3C'); for (let x = -290; x < 290; x += 46) mid += rectF(x, y - 50 + ((x * 7) % 20), 34, 50 - ((x * 7) % 20), [PAL.red, PAL.teal, PAL.terra, '#3B6EA8'][Math.abs(x / 46 | 0) % 4]); });
  // half-rolled shutter
  mid += rect(-340, -260, 680, 220, '#7D8798') + [-230, -205, -180, -155, -130, -105, -80].map(y => L(`M-336 ${y} L336 ${y}`, 3, '#5E6878')).join('') + rect(-60, -52, 120, 18, '#5E6878', 6);
  // CCTV bullet camera (dead)
  mid += G(rect(-10, -30, 20, 34, '#9AA3AD', 4) + P('M-44 -60 L30 -60 Q46 -60 46 -46 L46 -36 Q46 -22 30 -22 L-44 -22 Z', PAL.white) + E(46, -41, 8, 13, '#30343F') + EF(-28, -41, 4, 4, '#555'), 'translate(330 -540) scale(1.3)');
  mid += rectF(-1200, 440, 2400, 1200, '#2A2F45') + rectF(-1200, 440, 2400, 18, '#3C4260');
  // street lamp
  mid += rect(-512, -760, 22, 1220, '#3A3F55') + P('M-500 -760 Q-480 -800 -400 -790 L-396 -770 Q-470 -776 -488 -748 Z', '#3A3F55') + E(-392, -770, 26, 14, '#FFE6A0');
  const fl = 0.16 + 0.03 * Math.sin(t * 23) * Math.sin(t * 7);
  mid += `<path d="M-412 -760 L-372 -760 L-200 440 L-600 440 Z" fill="#FFE6A0" opacity="${fl}"/>`;
  // moth circling the lamp
  mid += `<circle cx="${-392 + Math.cos(t * 9) * 40}" cy="${-740 + Math.sin(t * 13) * 22}" r="4" fill="#F6F1E7"/>`;
  let front = rect(470, -1500, 46, 2600, '#141824') + rect(440, -980, 110, 140, '#20263A', 8) +
    L(`M-700 -1150 Q0 ${-1060 + Math.sin(t * 1.3) * 8} 700 -1130`, 5, '#0E1018') + L(`M-700 -1090 Q0 ${-1000 + Math.sin(t * 1.1) * 10} 700 -1060`, 5, '#0E1018') + L(`M-700 -1040 Q100 ${-960 + Math.sin(t * 1.5) * 8} 700 -1000`, 4, '#0E1018');
  return { back, mid, front };
}

function shopInterior(t, o = {}) {
  const r = rng(11);
  let back = rectF(-1200, -1600, 2400, 3200, '#E5CE9B');
  back += rectF(-1200, -1600, 2400, 420, '#D9BF86');
  // tube light + glow
  const fl = 1 - (Math.sin(t * 31) > 0.97 ? 0.15 : 0);
  back += `<ellipse cx="0" cy="-1080" rx="520" ry="160" fill="#FFF6D8" opacity="${0.45 * fl}"/>` + rect(-220, -1100, 440, 28, '#FFFDF2', 14);
  // shelves with goods
  const cols = [PAL.red, PAL.teal, PAL.mari, PAL.terra, '#3B6EA8', PAL.white, '#6A9A4A'];
  [-860, -620, -380, -140].forEach(y => {
    back += rect(-700, y, 1400, 22, '#8A5A3C');
    for (let x = -680; x < 680;) {
      const kind = Math.floor(r() * 4), c = cols[Math.floor(r() * cols.length)];
      if (kind === 0) { const w = 54 + r() * 30, h = 70 + r() * 80; back += rect(x, y - h, w, h, c, 4) + rectF(x + 8, y - h + 14, w - 16, 12, PAL.white, 3, 'opacity="0.7"'); x += w + 8; }
      else if (kind === 1) { back += P(`M${x + 8} ${y} L${x + 8} ${y - 70} Q${x + 8} ${y - 90} ${x + 20} ${y - 96} L${x + 20} ${y - 116} L${x + 34} ${y - 116} L${x + 34} ${y - 96} Q${x + 46} ${y - 90} ${x + 46} ${y - 70} L${x + 46} ${y} Z`, c); x += 56; }
      else if (kind === 2) { back += rect(x, y - 80, 70, 80, '#F2E6CC', 16) + rect(x - 2, y - 92, 74, 18, c, 5); x += 80; }
      else { back += P(`M${x} ${y} L${x + 6} ${y - 100} L${x + 60} ${y - 100} L${x + 66} ${y} Z`, c) + L(`M${x + 4} ${y - 86} L${x + 62} ${y - 86}`, 4, PAL.white); x += 74; }
    }
  });
  let mid = '';
  // counter
  mid += rect(-760, -26, 1520, 36, '#9B6A44', 6) + rect(-740, 10, 1480, 1400, '#B57B4F');
  mid += rect(-680, 70, 560, 260, '#CFE3E2', 10) + rect(-60, 70, 560, 260, '#CFE3E2', 10);
  for (let i = 0; i < 9; i++) mid += rectF(-650 + i * 60 + (i > 4 ? 120 : 0), 250 - (i % 3) * 30, 44, 60 + (i % 3) * 30, cols[i % cols.length], 4, `stroke="${INK}" stroke-width="3"`);
  mid += L('M-660 90 L-560 190 M-40 90 L60 190', 6, '#FFFFFF', 'opacity="0.6"');
  mid += F('M-740 360 L740 360 L740 1410 L-740 1410 Z', shade('#B57B4F'));
  // CCTV kit on the counter
  const st = o.cctv || 'off';
  mid += dvr(110, -26, st, t) + monitor(330, -26, 360, 240, cctvScreen(st, t));
  if (o.sparkAt !== undefined) {
    const k = t - o.sparkAt;
    if (k > 0 && k < 0.6) mid += sparkle(130, -70, 1.4 * Math.sin(k / 0.6 * Math.PI), PAL.mari, k * 200) + sparkle(80, -96, 0.8 * Math.sin(k / 0.6 * Math.PI), BRAND.hi, -k * 200);
  }
  // front: hanging snack packets + rice sacks
  let front = L('M-900 -1240 L900 -1240', 5);
  for (let i = 0; i < 16; i++) {
    const x = -860 + i * 112, sw = Math.sin(t * 2 + i) * 3;
    front += G(rect(-36, 0, 72, 120, cols[i % cols.length], 6) + rectF(-26, 30, 52, 40, PAL.white, 20, 'opacity="0.75"') + L('M-36 12 L36 12', 4), `translate(${x} -1236) rotate(${sw})`);
  }
  front += G(P('M-150 0 Q-170 -190 -110 -230 Q0 -250 110 -230 Q170 -190 150 0 Z', PAL.jute) + L('M-110 -200 Q0 -216 110 -200', 4) + txt(0, -110, 'চাল', 60, PAL.terra), 'translate(-560 980)');
  return { back, mid, front };
}

function homeBack(t, wall, opt = {}) {
  let back = rectF(-1200, -1600, 2400, 3200, wall) + rectF(-1200, 430, 2400, 1200, '#B98A5E') + rectF(-1200, 430, 2400, 20, '#8F6644');
  for (let x = -1200; x < 1200; x += 240) back += L(`M${x} 450 L${x - 120} 1600`, 3, '#A97B50');
  back += rectF(-1200, 380, 2400, 50, shade(wall, 0.9));
  return back;
}
function homeLiving(t, o = {}) {
  let back = homeBack(t, '#EADBC2');
  // window with grill + teal curtains
  back += rect(-520, -860, 380, 470, '#BFE3E0', 8) + `<circle cx="-230" cy="-760" r="44" fill="${PAL.mari}"/>` + `<path d="M-516 -520 Q-420 -580 -330 -540 Q-240 -500 -144 -560 L-144 -394 L-516 -394 Z" fill="#9CCB8A"/>`;
  for (let x = -500; x < -150; x += 46) back += L(`M${x} -858 L${x} -392`, 5, '#4A4F5C');
  back += L('M-518 -630 L-142 -630', 5, '#4A4F5C');
  [-470, -380, -290, -200].forEach(x => { back += P(`M${x} -630 l18 -24 l18 24 l-18 24 Z`, 'none', 'stroke="#4A4F5C"').replace('stroke="#1B1A22"', 'stroke="#4A4F5C"'); });
  back += rect(-540, -880, 420, 30, '#8A5A3C', 6);
  const sway = Math.sin(t * 1.2) * 8;
  back += P(`M-560 -856 L-470 -856 Q${-480 + sway} -620 ${-470 + sway} -380 L-570 -380 Z`, PAL.teal) + P(`M-100 -856 L-190 -856 Q${-180 + sway} -620 ${-190 + sway} -380 L-90 -380 Z`, PAL.teal);
  // framed alpona art + calendar
  back += rect(-40, -880, 200, 150, PAL.white, 6) + `<circle cx="60" cy="-805" r="44" fill="none" stroke="${PAL.terra}" stroke-width="6"/>` + [0, 60, 120, 180, 240, 300].map(a => `<circle cx="${60 + Math.cos(a * Math.PI / 180) * 44}" cy="${-805 + Math.sin(a * Math.PI / 180) * 44}" r="9" fill="${PAL.mari}"/>`).join('');
  back += rect(320, -900, 170, 220, PAL.white, 4) + rectF(320, -900, 170, 50, PAL.red) + txt(405, -862, '২০২৬', 30, PAL.white) + Array.from({ length: 12 }, (_, i) => rectF(338 + (i % 4) * 36, -830 + Math.floor(i / 4) * 40, 24, 24, '#E8DCC8', 3)).join('');
  // wall shelf + router
  back += rect(200, -330, 320, 20, '#8A5A3C', 4) + L('M240 -310 L260 -280 M480 -310 L460 -280', 6, '#8A5A3C');
  back += router(360, -330, 1.25, o.router || 'bad', t);
  back += fan(0, -1100, t * 900);
  let mid = '';
  // study table
  mid += rect(-160, 140, 740, 34, '#9B6A44', 6) + rect(-140, 170, 700, 300, '#B57B4F') + F('M-140 400 L560 400 L560 470 L-140 470 Z', shade('#B57B4F')) + rect(-150, 460, 40, 160, '#8A5A3C') + rect(520, 460, 40, 160, '#8A5A3C');
  mid += L('M200 220 L200 420', 4) + rect(170, 300, 60, 16, '#8A5A3C', 8);
  mid += laptop(340, 140, 1.0, classScreen(o.class || 'frozen', t));
  mid += rect(-120, 92, 120, 22, PAL.teal, 4) + rect(-110, 70, 110, 22, PAL.red, 4) + rect(-116, 48, 100, 22, PAL.mari, 4);
  mid += P('M30 140 L30 90 L80 90 L80 140 Z', PAL.white) + L('M80 100 Q100 110 80 128', 6) + `<path d="M44 80 q6 -16 0 -30 M60 78 q6 -16 0 -30" fill="none" stroke="#fff" stroke-width="4" opacity="${0.4 + 0.3 * Math.sin(t * 3)}"/>`;
  let front = G(P('M-60 0 L60 0 L46 160 L-46 160 Z', PAL.terra) + P(`M0 0 Q${-120 + sway} -180 -60 -330 Q-10 -180 0 0 Z`, '#4E8A4A') + P(`M0 0 Q${110 + sway} -200 70 -320 Q20 -180 0 0 Z`, '#5E9E54') + P('M0 0 Q-160 -80 -200 -140 Q-100 -90 0 0 Z', '#4E8A4A'), 'translate(-520 880)');
  return { back, mid, front };
}

function homePC(t, o = {}) {
  let back = homeBack(t, '#E6D3B4');
  const sp = o.clockSpin || 0; // extra hours spun
  const h = (9 + sp) / 12 * Math.PI * 2, m = sp * Math.PI * 2;
  back += wallClock(120, -640, 92, h, m);
  back += rect(-560, -900, 300, 400, '#BFE3E0', 8) + L('M-410 -900 L-410 -500 M-560 -700 L-260 -700', 6, '#4A4F5C') + rect(-580, -920, 340, 26, '#8A5A3C', 6);
  back += rect(320, -880, 200, 260, PAL.white, 4) + rectF(336, -864, 168, 120, '#9CCB8A') + `<circle cx="460" cy="-830" r="20" fill="${PAL.mari}"/>` + txt(420, -680, 'শুভ সকাল', 30, PAL.terra);
  let mid = '';
  mid += tower(380, 560, 1.0, t, o.screen !== 'desktop');
  mid += rect(-120, 140, 580, 34, '#9B6A44', 6) + rect(-100, 170, 540, 300, '#B57B4F') + rect(-110, 460, 40, 160, '#8A5A3C') + rect(430, 460, 40, 160, '#8A5A3C');
  mid += oldMonitor(120, 140, 1.0, pcScreen(o.screen || 'boot', o.progress || 0, t));
  mid += keyboard(120, 196, 1.0, o.key ?? -1);
  return { back, mid, front: '' };
}

function brandBG(t, t0) {
  let s = rectF(-1400, -1800, 2800, 3600, BRAND.teal);
  const a = (t - t0) * 12;
  let rays = '';
  for (let i = 0; i < 16; i++) rays += `<path d="M0 0 L${Math.cos((i * 22.5 - 4) * Math.PI / 180) * 2400} ${Math.sin((i * 22.5 - 4) * Math.PI / 180) * 2400} L${Math.cos((i * 22.5 + 4) * Math.PI / 180) * 2400} ${Math.sin((i * 22.5 + 4) * Math.PI / 180) * 2400} Z" fill="${BRAND.hi}" opacity="0.35"/>`;
  s += `<g transform="translate(0 -300) rotate(${a})">${rays}</g>`;
  s += `<circle cx="0" cy="-300" r="520" fill="${BRAND.tint}" opacity="0.18"/>`;
  return s;
}
function ctaBG(t) {
  let s = rectF(-1400, -1800, 2800, 3600, BRAND.navy);
  const r = rng(5);
  for (let i = 0; i < 14; i++) {
    const y = -1000 + i * 150, x0 = r() > 0.5 ? -700 : 700, len = 200 + r() * 260, dir = x0 < 0 ? 1 : -1;
    const x1 = x0 + dir * len;
    s += L(`M${x0} ${y} L${x1} ${y} L${x1 + dir * 40} ${y + 40}`, 6, BRAND.teal, 'opacity="0.28"') + `<circle cx="${x1 + dir * 52}" cy="${y + 52}" r="14" fill="none" stroke="${BRAND.teal}" stroke-width="6" opacity="${0.28 + 0.2 * Math.sin(t * 2 + i)}"/>`;
  }
  return s;
}

module.exports = { shopExterior, shopInterior, homeLiving, homePC, brandBG, ctaBG, sparkle, rect, rectF, txt, cctvScreen, paneStreet, paneShelf, clamp, rng };
