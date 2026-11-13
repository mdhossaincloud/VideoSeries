// Bangla Toon Flat — parametric SVG character rig for the FIXIBLE IT ad cast.
// Every function returns an SVG string. Origin (0,0) = ground point between the feet.
'use strict';

const INK = '#1B1A22';
const PAL = {
  white: '#F6F1E7', terra: '#C8643B', mari: '#F2A900', red: '#B3202A',
  teal: '#1F7A74', jute: '#D9B88F', ink: INK, night: '#1E2A4A',
};
const SW = 5; // outline width at 1080p

function shade(hex, f = 0.86) {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => Math.round(v * f));
  return '#' + c.map(v => v.toString(16).padStart(2, '0')).join('');
}
const r1 = v => Math.round(v * 10) / 10;
const P = (d, fill, extra = '') =>
  `<path d="${d}" fill="${fill}" stroke="${INK}" stroke-width="${SW}" stroke-linejoin="round" stroke-linecap="round" ${extra}/>`;
const F = (d, fill, extra = '') => `<path d="${d}" fill="${fill}" ${extra}/>`; // fill only (shade tones)
const L = (d, w = SW, col = INK, extra = '') =>
  `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round" ${extra}/>`;
const E = (cx, cy, rx, ry, fill, extra = '') =>
  `<ellipse cx="${r1(cx)}" cy="${r1(cy)}" rx="${r1(rx)}" ry="${r1(ry)}" fill="${fill}" stroke="${INK}" stroke-width="${SW}" ${extra}/>`;
const EF = (cx, cy, rx, ry, fill, extra = '') =>
  `<ellipse cx="${r1(cx)}" cy="${r1(cy)}" rx="${r1(rx)}" ry="${r1(ry)}" fill="${fill}" ${extra}/>`;
const G = (inner, tf = '') => `<g ${tf ? `transform="${tf}"` : ''}>${inner}</g>`;

// Outlined tube limb through 2 or 3 points (3 points = smooth bend through a control point).
function tube(pts, w, col) {
  const [a, b, c] = pts;
  const d = c ? `M${a[0]} ${a[1]} Q${b[0]} ${b[1]} ${c[0]} ${c[1]}` : `M${a[0]} ${a[1]} L${b[0]} ${b[1]}`;
  return L(d, w + SW * 2, INK) + L(d, w, col);
}

// Simple mitten hand: palm + thumb. rot in degrees, flip mirrors thumb side.
function hand(x, y, skin, rot = 0, flip = false, s = 1) {
  const sx = flip ? -1 : 1;
  return G(
    E(0, 0, 13, 14, skin) + E(-11, -5, 6, 8.5, skin, 'transform="rotate(-30 -11 -5)"') +
    L('M-3 8 Q4 10 9 4', 3, shade(skin, 0.8)),
    `translate(${x} ${y}) rotate(${rot}) scale(${sx * s} ${s})`);
}
// Pointing / open hand variants for gesture shots
function handOpen(x, y, skin, rot = 0, flip = false) {
  const sx = flip ? -1 : 1;
  const fingers = [-12, -4, 4, 12].map((fx, i) =>
    P(`M${fx} -6 L${fx + (i - 1.5) * 2} -26`, 'none').replace('fill="none"', 'fill="none"')).join('');
  const fingerTubes = [-11, -3.5, 4, 11].map((fx, i) => tube([[fx, -4], [fx + (i - 1.5) * 2.5, -24 + Math.abs(i - 1.5) * 3]], 6.5, skin)).join('');
  return G(fingerTubes + tube([[-14, 4], [-24, -6]], 7, skin) + E(0, 2, 14, 13, skin), `translate(${x} ${y}) rotate(${rot}) scale(${sx} 1)`);
}

function shoe(x, y, col, sole = PAL.white, flip = false) {
  return G(
    P('M-26 0 Q-28 -20 -6 -22 L6 -21 Q30 -16 30 -2 Q30 4 22 4 L-20 4 Q-27 4 -26 0 Z', col) +
    L('M-26 -3 L29 -3', 4, sole) + L('M-8 -18 L4 -12 M-4 -20 L8 -14', 3, INK),
    `translate(${x} ${y}) scale(${flip ? -1 : 1} 1)`);
}
function sandal(x, y, skin, strap, flip = false) {
  return G(
    P('M-24 2 Q-26 -14 -6 -15 Q22 -14 28 -2 Q29 4 22 4 L-20 4 Z', skin) +
    P('M-27 4 L30 4 L30 9 L-27 9 Z', '#6B3F2A') +
    P('M-14 -10 Q2 -16 16 -8 L14 0 Q2 -6 -12 -2 Z', strap),
    `translate(${x} ${y}) scale(${flip ? -1 : 1} 1)`);
}

// ---------- FACE ----------
// expr: normal | happy | surprised | thinking | annoyed | sad
// mouth: closed | aa | ee | oo | mm | smile | grin | frown | flat | o
function face(o) {
  const { cx, cy, rx, ry, skin } = o;
  const expr = o.expr || 'normal';
  const look = o.look || [0, 0];
  const ex = rx * 0.36, ey = cy + ry * 0.06;
  let s = '';
  // cheeks
  s += EF(cx - rx * 0.52, cy + ry * 0.36, rx * 0.15, ry * 0.09, '#E07A5F', 'opacity="0.45"');
  s += EF(cx + rx * 0.52, cy + ry * 0.36, rx * 0.15, ry * 0.09, '#E07A5F', 'opacity="0.45"');
  // eyes
  const eye = (x, side) => {
    const lx = x + look[0], ly = ey + look[1];
    if (expr === 'happy') return L(`M${x - 8} ${ey + 3} Q${x} ${ey - 9} ${x + 8} ${ey + 3}`, 4.5);
    const big = expr === 'surprised' ? 1.25 : 1;
    let e = EF(lx, ly, 5.6 * big, 7.6 * big, INK) + EF(lx + 1.8, ly - 2.6, 1.9, 1.9, '#fff');
    if (expr === 'annoyed') e += F(`M${x - 10} ${ey - 11} L${x + 10} ${ey - 11} L${x + 10} ${ey - 1} L${x - 10} ${ey - 1} Z`, skin) + L(`M${x - 8} ${ey - 1} L${x + 8} ${ey - 1}`, 3.5);
    if (expr === 'sad') e += F(`M${x - 10} ${ey - 12} L${x + 10} ${ey - 12} L${x + 10} ${ey - 3} L${x - 10} ${ey - 3} Z`, skin) + L(`M${x - 7} ${ey - 3} Q${x} ${ey - 5} ${x + 7} ${ey - 3}`, 3);
    return e;
  };
  s += eye(cx - ex, -1) + eye(cx + ex, 1);
  // brows
  const by = cy - ry * 0.2, bw = 10, bt = o.browW || 5;
  const bc = o.browCol || INK;
  const brow = (x, side) => {
    // side: -1 left, +1 right. inner end is toward center
    let inner = 0, outer = 0, arch = -3;
    if (expr === 'surprised') { inner = -9; outer = -9; arch = -5; }
    if (expr === 'happy') { inner = -3; outer = -3; }
    if (expr === 'annoyed') { inner = 6; outer = -4; arch = 0; }
    if (expr === 'sad') { inner = -7; outer = 3; arch = -1; }
    if (expr === 'thinking') { if (side > 0) { inner = -8; outer = -10; } else { inner = 3; outer = 1; arch = 0; } }
    const xi = x - side * bw, xo = x + side * bw;
    return L(`M${xi} ${by + inner} Q${x} ${by + arch + (inner + outer) / 2 - 2} ${xo} ${by + outer}`, bt, bc);
  };
  s += brow(cx - ex, -1) + brow(cx + ex, 1);
  // nose
  const ny = cy + ry * 0.22;
  s += L(`M${cx - 2} ${ny - 6} Q${cx + 7} ${ny + 3} ${cx - 3} ${ny + 6}`, 3.6, shade(skin, 0.62));
  // mouth
  const my = cy + ry * 0.5;
  let m = o.mouth;
  if (!m) m = { normal: 'smile', happy: 'grin', surprised: 'o', thinking: 'flat', annoyed: 'frown', sad: 'frown' }[expr];
  const lip = '#7A2430', tongue = '#E06C6C';
  const mouths = {
    closed: () => L(`M${cx - 10} ${my} Q${cx} ${my + 5} ${cx + 10} ${my}`, 4),
    smile: () => L(`M${cx - 12} ${my - 2} Q${cx} ${my + 9} ${cx + 12} ${my - 2}`, 4),
    flat: () => L(`M${cx - 9} ${my + 2} Q${cx + 2} ${my} ${cx + 10} ${my - 2}`, 4),
    frown: () => L(`M${cx - 10} ${my + 4} Q${cx} ${my - 4} ${cx + 10} ${my + 4}`, 4),
    mm: () => L(`M${cx - 10} ${my} L${cx + 10} ${my}`, 4.5) + L(`M${cx - 6} ${my + 5} Q${cx} ${my + 7} ${cx + 6} ${my + 5}`, 2.5, shade(skin, 0.7)),
    grin: () => P(`M${cx - 15} ${my - 4} Q${cx} ${my - 1} ${cx + 15} ${my - 4} Q${cx + 12} ${my + 14} ${cx} ${my + 14} Q${cx - 12} ${my + 14} ${cx - 15} ${my - 4} Z`, lip) +
      F(`M${cx - 9} ${my + 10} Q${cx} ${my + 4} ${cx + 9} ${my + 10} Q${cx} ${my + 14} ${cx - 9} ${my + 10} Z`, tongue) +
      F(`M${cx - 12} ${my - 2} Q${cx} ${my} ${cx + 12} ${my - 2} L${cx + 11} ${my + 2} Q${cx} ${my + 4} ${cx - 11} ${my + 2} Z`, '#fff'),
    aa: () => P(`M${cx - 11} ${my - 3} Q${cx} ${my - 6} ${cx + 11} ${my - 3} Q${cx + 10} ${my + 15} ${cx} ${my + 15} Q${cx - 10} ${my + 15} ${cx - 11} ${my - 3} Z`, lip) +
      F(`M${cx - 7} ${my + 11} Q${cx} ${my + 5} ${cx + 7} ${my + 11} Q${cx} ${my + 15} ${cx - 7} ${my + 11} Z`, tongue),
    ee: () => P(`M${cx - 15} ${my - 2} Q${cx} ${my - 4} ${cx + 15} ${my - 2} Q${cx + 13} ${my + 9} ${cx} ${my + 9} Q${cx - 13} ${my + 9} ${cx - 15} ${my - 2} Z`, lip) +
      F(`M${cx - 12} ${my - 1} L${cx + 12} ${my - 1} L${cx + 11} ${my + 3} L${cx - 11} ${my + 3} Z`, '#fff'),
    oo: () => P(`M${cx} ${my - 5} Q${cx + 8} ${my - 5} ${cx + 8} ${my + 4} Q${cx + 8} ${my + 12} ${cx} ${my + 12} Q${cx - 8} ${my + 12} ${cx - 8} ${my + 4} Q${cx - 8} ${my - 5} ${cx} ${my - 5} Z`, lip),
    o: () => P(`M${cx} ${my - 4} Q${cx + 7} ${my - 4} ${cx + 7} ${my + 4} Q${cx + 7} ${my + 11} ${cx} ${my + 11} Q${cx - 7} ${my + 11} ${cx - 7} ${my + 4} Q${cx - 7} ${my - 4} ${cx} ${my - 4} Z`, lip),
  };
  if (o.mustache) s += mustacheArt(cx, cy + ry * 0.36, o.mustache);
  s = s.replace(/$/, '');
  return { pre: s, mouth: (mouths[m] || mouths.smile)() };
}
function mustacheArt(cx, y, col) {
  return P(`M${cx} ${y - 2} Q${cx + 12} ${y - 8} ${cx + 24} ${y - 1} Q${cx + 30} ${y + 4} ${cx + 26} ${y + 7} Q${cx + 14} ${y + 2} ${cx} ${y + 6} Q${cx - 14} ${y + 2} ${cx - 26} ${y + 7} Q${cx - 30} ${y + 4} ${cx - 24} ${y - 1} Q${cx - 12} ${y - 8} ${cx} ${y - 2} Z`, col);
}

// Hair cap generator: lumpy outer silhouette over the top of the head + scalloped hairline.
function hairCap(cx, cy, rx, ry, o = {}) {
  const pad = o.pad ?? 9, amp = o.amp ?? 7, bumps = o.bumps ?? 7;
  const a0 = (o.a0 ?? 172) * Math.PI / 180, a1 = (o.a1 ?? 368) * Math.PI / 180;
  const N = 90, pts = [];
  for (let i = 0; i <= N; i++) {
    const t = a0 + (a1 - a0) * i / N;
    const u = (t - a0) / (a1 - a0);
    const lump = amp * Math.abs(Math.sin(bumps * Math.PI * u)) * (o.lumpTop ? Math.max(0, -Math.sin(t)) : 1);
    pts.push([cx + (rx + pad + lump) * Math.cos(t), cy + (ry + pad + lump) * Math.sin(t) + (o.lift ?? 0)]);
  }
  let d = 'M' + pts.map(p => `${r1(p[0])} ${r1(p[1])}`).join(' L');
  // hairline from right temple to left temple
  const lineY = cy - ry * (o.line ?? 0.38);
  const sideY = cy + ry * (o.side ?? 0.08);
  const xr = cx + rx * 0.9, xl = cx - rx * 0.9;
  d += ` L${r1(xr)} ${r1(sideY)} Q${r1(cx + rx * 0.8)} ${r1(lineY + 6)} ${r1(cx + rx * 0.62)} ${r1(lineY)}`;
  const sc = o.scallops ?? 4, xa = cx + rx * 0.62, xb = cx - rx * 0.62;
  const part = o.part; // x offset of part (center-part style) → smooth arcs
  for (let i = 0; i < sc; i++) {
    const x0 = xa + (xb - xa) * i / sc, x1 = xa + (xb - xa) * (i + 1) / sc;
    const dip = (o.dip ?? 12) * (i % 2 ? 1 : 0.75);
    if (part !== undefined) {
      d += ` Q${r1((x0 + x1) / 2)} ${r1(lineY - (o.dip ?? 10))} ${r1(x1)} ${r1(lineY)}`;
    } else {
      d += ` Q${r1((x0 + x1) / 2)} ${r1(lineY + dip)} ${r1(x1)} ${r1(lineY - 2)}`;
    }
  }
  d += ` Q${r1(cx - rx * 0.8)} ${r1(lineY + 6)} ${r1(xl)} ${r1(sideY)} Z`;
  return P(d, o.col || INK);
}
function hairShine(arr) { return arr.map(d => L(d, 4, '#4B4A5C')).join(''); }

// ---------- HEAD (ears + head + face + hair) ----------
function head(o) {
  const { cx, cy, rx, ry, skin } = o;
  let s = '';
  if (o.hairBack) s += o.hairBack;
  s += E(cx - rx + 1, cy + 4, 9, 12, skin) + E(cx + rx - 1, cy + 4, 9, 12, skin);
  s += L(`M${cx - rx + 2} ${cy} q-4 4 0 8`, 3, shade(skin, 0.7)) + L(`M${cx + rx - 2} ${cy} q4 4 0 8`, 3, shade(skin, 0.7));
  s += E(cx, cy, rx, ry, skin);
  // one shade tone along the jaw
  s += F(`M${cx - rx * 0.7} ${cy + ry * 0.62} Q${cx} ${cy + ry * 1.08} ${cx + rx * 0.7} ${cy + ry * 0.62} Q${cx} ${cy + ry * 0.92} ${cx - rx * 0.7} ${cy + ry * 0.62} Z`, shade(skin, 0.9));
  if (o.beard) s += o.beard;
  const f = face(o);
  s += f.pre;
  if (o.under) s += o.under;
  s += f.mouth;
  if (o.lines) s += o.lines;
  if (o.hairFront) s += o.hairFront;
  if (o.glasses) {
    const gy = cy + ry * 0.06, gx = rx * 0.36;
    const lens = x => `<rect x="${x - 16}" y="${gy - 12}" width="32" height="25" rx="7" fill="#ffffff" fill-opacity="0.18" stroke="${o.glasses}" stroke-width="4.5"/>`;
    s += lens(cx - gx) + lens(cx + gx) +
      L(`M${cx - gx + 15} ${gy - 2} Q${cx} ${gy - 7} ${cx + gx - 15} ${gy - 2}`, 4, o.glasses) +
      L(`M${cx - gx - 15} ${gy - 3} L${cx - rx + 4} ${gy - 6} M${cx + gx + 15} ${gy - 3} L${cx + rx - 4} ${gy - 6}`, 4, o.glasses);
  }
  if (o.extra) s += o.extra;
  return s;
}

// ================= CAST =================
const SKIN = { rafi: '#C98B5E', karim: '#B07447', nasima: '#D79A6C', dadu: '#BE8457', tutul: '#D69466' };

// 1) RAFI — FIXIBLE IT field technician (hero, 26)
function rafiHead(o = {}) {
  const cx = o.cx ?? 0, cy = o.cy ?? -372, rx = 50, ry = 54, skin = SKIN.rafi;
  const hairFront = hairCap(cx, cy, rx, ry, { pad: 8, amp: 9, bumps: 6, line: 0.42, scallops: 3, dip: 16, a0: 168, a1: 372, lumpTop: true }) +
    // side-swept fringe lock
    P(`M${cx + 14} ${cy - ry * 0.62} Q${cx - 8} ${cy - ry * 0.5} ${cx - 26} ${cy - ry * 0.2} Q${cx - 16} ${cy - ry * 0.52} ${cx - 2} ${cy - ry * 0.7} Z`, INK) +
    hairShine([`M${cx - 30} ${cy - ry * 0.82} q12 -10 26 -8`, `M${cx + 14} ${cy - ry * 0.9} q10 -2 18 4`]);
  return head({ cx, cy, rx, ry, skin, expr: o.expr, mouth: o.mouth, look: o.look, hairFront });
}
function rafi(o = {}) {
  const skin = SKIN.rafi, teal = PAL.teal, jeans = '#2E3A5C';
  let s = EF(0, 2, 92, 12, '#000', 'opacity="0.12"');
  // legs
  s += tube([[-22, -168], [-23, -100], [-26, -26]], 40, jeans) + tube([[22, -168], [23, -100], [26, -26]], 40, jeans);
  s += L('M-24 -40 L-28 -40 M24 -40 L28 -40', 3, shade(jeans, 0.8));
  s += shoe(-30, -6, PAL.white, teal, true) + shoe(30, -6, PAL.white, teal);
  s += P('M-48 -188 L48 -188 L46 -146 L-46 -146 Z', jeans);
  // neck
  s += P('M-13 -332 L13 -332 L14 -292 L-14 -292 Z', skin);
  // back arm (right side, hand on hip) drawn first
  // torso: teal polo
  s += P('M-46 -300 Q-68 -298 -70 -276 L-58 -164 Q0 -158 58 -164 L70 -276 Q68 -298 46 -300 Q0 -290 -46 -300 Z', teal);
  s += F('M38 -296 Q62 -296 64 -276 L54 -166 Q44 -164 40 -164 Z', shade(teal));
  // collar
  s += P('M-26 -302 L0 -286 L-10 -266 L-30 -290 Z', PAL.mari) + P('M26 -302 L0 -286 L10 -266 L30 -290 Z', PAL.mari);
  s += L('M0 -284 L0 -240', 4) + E(0, -268, 3, 3, PAL.white) + E(0, -252, 3, 3, PAL.white);
  // chest badge (FIXIBLE IT mark — wrench in marigold circle)
  s += E(-32, -258, 11, 11, PAL.mari) + L('M-37 -253 L-28 -262', 4) + E(-26, -264, 3.5, 3.5, PAL.mari);
  // ID card on marigold lanyard
  s += L('M-14 -292 L16 -232 M14 -292 L18 -232', 4, PAL.mari);
  s += P('M6 -232 L32 -232 L32 -196 L6 -196 Z', PAL.white) + F('M8.5 -229.5 L29.5 -229.5 L29.5 -222 L8.5 -222 Z', teal) + E(19, -212, 5, 5, skin, 'stroke-width="2.5"') + L('M11 -201 L27 -201', 2.5);
  // belt line
  s += L('M-52 -168 Q0 -162 52 -168', 4);
  // left arm holding toolbox
  s += tube([[-60, -286], [-68, -258]], 34, teal) + tube([[-68, -252], [-74, -214], [-76, -178]], 21, skin) + tube([[-62, -290], [-70, -256]], 34, teal);
  s += L('M-82 -262 L-56 -252', 4);
  // toolbox (FIXIBLE IT kit)
  s += L('M-96 -156 Q-96 -176 -76 -176 Q-56 -176 -56 -156', 7, INK);
  s += P('M-116 -156 L-36 -156 L-36 -104 L-116 -104 Z', PAL.terra) + F('M-113 -132 L-39 -132 L-39 -107 L-113 -107 Z', shade(PAL.terra)) + L('M-116 -132 L-36 -132', 4) + P('M-82 -140 L-70 -140 L-70 -126 L-82 -126 Z', PAL.mari);
  s += hand(-76, -172, skin, 90, false);
  // right arm on hip
  s += tube([[60, -286], [70, -260]], 34, teal) + tube([[70, -256], [96, -220], [62, -190]], 21, skin) + tube([[62, -290], [72, -258]], 34, teal);
  s += L('M58 -252 L84 -262', 4);
  s += hand(58, -188, skin, -120, true);
  s += rafiHead({ expr: o.expr || 'happy', mouth: o.mouth });
  return s;
}

// 2) KARIM BHAI — gadget/variety shop owner (45)
function karimHead(o = {}) {
  const cx = o.cx ?? 0, cy = o.cy ?? -366, rx = 55, ry = 54, skin = SKIN.karim;
  const hairCol = '#2A2730';
  // balding: hair only around the sides/back + a thin comb-over
  const hairBack = P(`M${cx - rx - 6} ${cy + 14} Q${cx - rx - 14} ${cy - 30} ${cx - rx + 14} ${cy - 46} Q${cx} ${cy - 30} ${cx + rx - 14} ${cy - 46} Q${cx + rx + 14} ${cy - 30} ${cx + rx + 6} ${cy + 14} Z`, hairCol);
  const hairFront = P(`M${cx - rx - 3} ${cy + 10} Q${cx - rx - 8} ${cy - 28} ${cx - rx + 18} ${cy - 44} Q${cx - rx + 10} ${cy - 18} ${cx - rx + 8} ${cy + 6} Z`, hairCol) +
    P(`M${cx + rx + 3} ${cy + 10} Q${cx + rx + 8} ${cy - 28} ${cx + rx - 18} ${cy - 44} Q${cx + rx - 10} ${cy - 18} ${cx + rx - 8} ${cy + 6} Z`, hairCol) +
    L(`M${cx - 26} ${cy - ry + 10} Q${cx} ${cy - ry - 2} ${cx + 28} ${cy - ry + 12}`, 4, hairCol) +
    L(`M${cx - 20} ${cy - ry + 18} Q${cx + 4} ${cy - ry + 8} ${cx + 30} ${cy - ry + 20}`, 3.5, hairCol) +
    L(`M${cx - rx - 2} ${cy - 14} q4 -10 10 -14 M${cx + rx + 2} ${cy - 14} q-4 -10 -10 -14`, 3, '#8C8A96') +
    EF(cx + 14, cy - ry + 22, 10, 5, '#ffffff', 'opacity="0.35"');
  const lines = L(`M${cx - 18} ${cy - ry * 0.45} q18 -5 36 0`, 2.5, shade(skin, 0.7));
  return head({ cx, cy, rx, ry, skin, expr: o.expr, mouth: o.mouth, look: o.look, hairBack, hairFront, mustache: '#25222B', browW: 7, lines });
}
function karim(o = {}) {
  const skin = SKIN.karim;
  let s = EF(0, 2, 100, 12, '#000', 'opacity="0.12"');
  // feet + sandals
  s += sandal(-30, -8, skin, PAL.terra, true) + sandal(30, -8, skin, PAL.terra);
  s += tube([[-22, -60], [-26, -20]], 24, skin) + tube([[22, -60], [26, -20]], 24, skin);
  // checked lungi (River Teal + Ink checks)
  s += P('M-66 -176 L-74 -36 Q0 -28 74 -36 L66 -176 Z', PAL.teal);
  s += `<g clip-path="url(#lungiClip)">` + [-60, -36, -12, 12, 36, 60].map(x => L(`M${x} -180 L${x * 1.1} -30`, 5, shade(PAL.teal, 0.72))).join('') +
    [-150, -118, -86, -54].map(y => L(`M-80 ${y} L80 ${y}`, 5, shade(PAL.teal, 0.72))).join('') +
    [-48, 0, 48].map(x => L(`M${x} -180 L${x * 1.1} -30`, 2.5, PAL.mari)).join('') + `</g>`;
  s += `<clipPath id="lungiClip"><path d="M-66 -176 L-74 -36 Q0 -28 74 -36 L66 -176 Z"/></clipPath>`;
  s += P('M-66 -176 L-74 -36 Q0 -28 74 -36 L66 -176 Z', 'none');
  s += L('M-70 -44 Q0 -36 70 -44', 4, PAL.mari);
  // neck
  s += P('M-15 -322 L15 -322 L16 -286 L-16 -286 Z', skin);
  // fotua (short kurta) — jute with terracotta trims, round belly
  s += P('M-52 -296 Q-76 -294 -80 -268 Q-92 -200 -76 -150 Q0 -138 76 -150 Q92 -200 80 -268 Q76 -294 52 -296 Q0 -284 -52 -296 Z', PAL.jute);
  s += F('M44 -292 Q72 -290 76 -266 Q88 -200 72 -152 Q60 -148 56 -150 Q72 -210 44 -292 Z', shade(PAL.jute));
  s += P('M-16 -294 Q0 -282 16 -294 L10 -246 L-10 -246 Z', PAL.white) + L('M0 -284 L0 -238', 3.5) + E(0, -270, 2.8, 2.8, PAL.terra) + E(0, -254, 2.8, 2.8, PAL.terra);
  s += L('M-76 -152 Q0 -140 76 -152', 6, PAL.terra);
  // pocket with marigold pen
  s += P('M22 -252 L50 -252 L48 -222 L24 -222 Z', PAL.jute) + P('M30 -266 L35 -266 L35 -248 L30 -248 Z', PAL.mari);
  // left arm: hand resting on belly
  s += tube([[-66, -284], [-82, -250]], 34, PAL.jute) + tube([[-82, -246], [-92, -206], [-44, -196]], 22, skin) + tube([[-68, -288], [-84, -252]], 34, PAL.jute);
  s += L('M-98 -252 L-68 -244', 4);
  s += hand(-42, -196, skin, 10, true);
  // right arm holding the red khata (ledger)
  s += tube([[66, -284], [82, -250]], 34, PAL.jute) + tube([[82, -246], [96, -210], [92, -178]], 22, skin) + tube([[68, -288], [84, -252]], 34, PAL.jute);
  s += L('M68 -244 L98 -252', 4);
  s += P('M84 -196 L132 -186 L124 -134 L76 -144 Z', PAL.red) + L('M84 -188 L128 -179', 3, PAL.white);
  s += hand(92, -172, skin, -70, true);
  s += karimHead({ expr: o.expr || 'normal', mouth: o.mouth || 'grin' });
  return s;
}

// 3) NASIMA APA — mother, home user (35), salwar-kameez + orna, side bun
function nasimaHead(o = {}) {
  const cx = o.cx ?? 0, cy = o.cy ?? -364, rx = 48, ry = 52, skin = SKIN.nasima;
  const hairCol = '#231F2A';
  const hairBack = E(cx + rx + 8, cy - ry * 0.55, 26, 24, hairCol) + L(`M${cx + rx - 6} ${cy - ry * 0.5} q14 -16 28 -6`, 3.5, '#4B4A5C') +
    // marigold flower in bun
    [0, 72, 144, 216, 288].map(a => E(cx + rx + 26 + 9 * Math.cos(a * Math.PI / 180), cy - ry * 0.88 + 9 * Math.sin(a * Math.PI / 180), 6, 6, PAL.mari, 'stroke-width="3"')).join('') + E(cx + rx + 26, cy - ry * 0.88, 4, 4, PAL.terra, 'stroke-width="2.5"') +
    P(`M${cx - rx - 8} ${cy + 18} Q${cx - rx - 14} ${cy - 20} ${cx - rx} ${cy - 30} L${cx + rx} ${cy - 30} Q${cx + rx + 14} ${cy - 20} ${cx + rx + 8} ${cy + 18} Z`, hairCol);
  const hairFront = hairCap(cx, cy, rx, ry, { pad: 7, amp: 0, bumps: 1, line: 0.32, scallops: 2, dip: 14, part: 0, side: 0.3, a0: 165, a1: 375 }) +
    L(`M${cx} ${cy - ry - 7} L${cx + 2} ${cy - ry * 0.38}`, 3, '#4B4A5C') + hairShine([`M${cx - 30} ${cy - ry * 0.78} q10 -12 24 -14`]);
  const extra = E(cx - rx + 1, cy + 22, 4.5, 4.5, PAL.mari, 'stroke-width="2.5"') + E(cx + rx - 1, cy + 22, 4.5, 4.5, PAL.mari, 'stroke-width="2.5"') +
    EF(cx, cy - ry * 0.3, 3, 3, PAL.red);
  return head({ cx, cy, rx, ry, skin, expr: o.expr, mouth: o.mouth, look: o.look, hairBack, hairFront, extra });
}
function nasima(o = {}) {
  const skin = SKIN.nasima, kameez = PAL.red, salwar = PAL.jute;
  let s = EF(0, 2, 90, 12, '#000', 'opacity="0.12"');
  // orna tail hanging behind (right shoulder)
  s += P('M44 -290 Q74 -250 70 -150 L52 -150 Q54 -230 30 -284 Z', PAL.mari);
  s += sandal(-26, -8, skin, PAL.mari, true) + sandal(26, -8, skin, PAL.mari);
  s += tube([[-22, -128], [-24, -70], [-24, -26]], 34, salwar) + tube([[22, -128], [24, -70], [24, -26]], 34, salwar);
  s += L('M-36 -32 L-12 -32 M12 -32 L36 -32', 4);
  s += P('M-12 -326 L12 -326 L13 -290 L-13 -290 Z', skin);
  // kameez A-line tunic
  s += P('M-42 -298 Q-62 -296 -64 -276 L-60 -210 Q-70 -160 -74 -112 Q0 -102 74 -112 Q70 -160 60 -210 L64 -276 Q62 -296 42 -298 Q0 -288 -42 -298 Z', kameez);
  s += F('M34 -294 Q56 -292 58 -274 L54 -210 Q64 -160 68 -114 Q58 -112 50 -112 Q50 -180 34 -294 Z', shade(kameez));
  s += L('M-72 -122 Q0 -110 72 -122', 8, PAL.mari) + L('M-72 -122 Q0 -110 72 -122', 2.5, INK, 'stroke-dasharray="2 10"');
  s += L('M-16 -296 Q0 -272 16 -296', 5, PAL.mari);
  // orna across the chest
  s += P('M-48 -298 Q-20 -232 40 -228 Q58 -230 64 -250 L52 -288 Q30 -250 -6 -262 Q-26 -272 -34 -300 Z', PAL.mari);
  s += L('M-40 -282 Q-14 -240 46 -238', 2.5, shade(PAL.mari, 0.8));
  [-30, -16, 0, 16, 32, 48].forEach((x, i) => { s += EF(x, -232 + Math.abs(x - 10) * 0.12 - (i === 5 ? 6 : 0), 2.6, 2.6, PAL.teal); });
  // left arm: hand on hip
  s += tube([[-54, -282], [-80, -232], [-56, -186]], 26, kameez) + tube([[-58, -196], [-56, -188]], 18, skin);
  s += L('M-68 -200 L-50 -196', 5, PAL.teal);
  s += hand(-50, -182, skin, 110, false);
  // right arm: holding smartphone in front of chest
  s += tube([[54, -282], [80, -228], [46, -214]], 26, kameez);
  s += L('M56 -228 L48 -208', 5, PAL.teal);
  s += P('M14 -262 L40 -262 Q44 -262 44 -258 L44 -212 Q44 -208 40 -208 L14 -208 Q10 -208 10 -212 L10 -258 Q10 -262 14 -262 Z', '#2B2F3A') + F('M14 -256 L40 -256 L40 -214 L14 -214 Z', '#7FC6C0');
  s += hand(40, -214, skin, -30, true);
  s += nasimaHead({ expr: o.expr || 'normal', mouth: o.mouth, look: o.look || [2, 2] });
  return s;
}

// 4) DADU — retired grandfather (70): bald, round glasses, white mustache + short beard, teal shawl
function daduHead(o = {}) {
  const cx = o.cx ?? 0, cy = o.cy ?? -348, rx = 50, ry = 52, skin = SKIN.dadu;
  const white = '#EEEAE2';
  // combed-back silver hair with a receding hairline (not bald)
  const hairFront = hairCap(cx, cy, rx, ry, { col: white, pad: 7, amp: 3, bumps: 5, line: 0.62, scallops: 2, dip: 8, side: 0.05, a0: 170, a1: 370 }) +
    L(`M${cx - 26} ${cy - ry * 0.78} q14 -10 30 -8 M${cx + 6} ${cy - ry * 0.86} q12 -4 24 2`, 3, '#BDB8AE');
  const beard = P(`M${cx - rx * 0.78} ${cy + ry * 0.35} Q${cx - rx * 0.66} ${cy + ry * 1.12} ${cx} ${cy + ry * 1.14} Q${cx + rx * 0.66} ${cy + ry * 1.12} ${cx + rx * 0.78} ${cy + ry * 0.35} Q${cx + rx * 0.5} ${cy + ry * 0.78} ${cx} ${cy + ry * 0.78} Q${cx - rx * 0.5} ${cy + ry * 0.78} ${cx - rx * 0.78} ${cy + ry * 0.35} Z`, white);
  const lines = L(`M${cx - 18} ${cy - ry * 0.42} q18 -5 36 0`, 2.5, shade(skin, 0.7)) +
    L(`M${cx - rx * 0.62} ${cy + ry * 0.2} q-4 8 2 14 M${cx + rx * 0.62} ${cy + ry * 0.2} q4 8 -2 14`, 2.5, shade(skin, 0.7));
  return head({ cx, cy, rx, ry, skin, expr: o.expr, mouth: o.mouth, look: o.look, hairFront, beard, mustache: white, glasses: '#3A2A22', browCol: '#D8D4CC', browW: 6, lines });
}
function dadu(o = {}) {
  const skin = SKIN.dadu, panj = PAL.white;
  let s = EF(0, 2, 88, 12, '#000', 'opacity="0.12"');
  // arms behind the back (upper arms only visible)
  s += tube([[-54, -270], [-66, -220], [-50, -190]], 26, panj) + tube([[54, -270], [66, -220], [50, -190]], 26, panj);
  s += sandal(-26, -8, skin, '#6B3F2A', true) + sandal(26, -8, skin, '#6B3F2A');
  s += tube([[-20, -120], [-22, -70], [-22, -28]], 32, PAL.white) + tube([[20, -120], [22, -70], [22, -28]], 32, PAL.white);
  s += P('M-13 -312 L13 -312 L14 -276 L-14 -276 Z', skin);
  // panjabi (long, slightly bent posture)
  s += P('M-44 -286 Q-62 -282 -64 -262 L-60 -112 Q0 -104 60 -112 L64 -262 Q62 -282 44 -286 Q0 -276 -44 -286 Z', panj);
  s += F('M36 -282 Q56 -280 58 -262 L54 -114 Q46 -112 42 -112 Q46 -200 36 -282 Z', shade(panj, 0.9));
  s += P('M-8 -282 L8 -282 L8 -226 L-8 -226 Z', panj) + E(0, -268, 2.8, 2.8, PAL.mari) + E(0, -254, 2.8, 2.8, PAL.mari) + E(0, -240, 2.8, 2.8, PAL.mari);
  // teal shawl over the left shoulder, terracotta border
  s += P('M-52 -288 Q-20 -296 6 -280 Q34 -230 60 -150 L36 -142 Q14 -210 -14 -250 Q-40 -262 -60 -250 Z', PAL.teal);
  s += L('M-4 -282 Q30 -228 50 -150', 4, PAL.terra) + L('M-56 -262 Q-34 -268 -14 -254', 4, PAL.terra);
  s += L('M36 -142 L60 -150', 3, PAL.mari, 'stroke-dasharray="3 6"');
  s += daduHead({ expr: o.expr || 'happy', mouth: o.mouth || 'smile' });
  return s;
}

// 5) TUTUL — schoolgirl (10): two braids with red ribbons, school uniform, marigold backpack
function tutulHead(o = {}) {
  const cx = o.cx ?? 0, cy = o.cy ?? -248, rx = 48, ry = 50, skin = SKIN.tutul;
  const hc = '#211D28';
  const braid = (sx) => {
    let b = '';
    for (let i = 0; i < 4; i++) b += E(cx + sx * (rx + 4 + i * 1.5), cy + 14 + i * 18, 11 - i * 0.8, 11, hc);
    b += P(`M${cx + sx * (rx + 10)} ${cy + 86} l${sx * 14} 10 l${-sx * 2} -14 Z M${cx + sx * (rx + 10)} ${cy + 86} l${-sx * 10} 12 l${sx * -4} -14 Z`, PAL.red, 'stroke-width="3.5"');
    b += E(cx + sx * (rx + 9), cy + 84, 6, 5, PAL.red, 'stroke-width="3.5"');
    return b;
  };
  const hairBack = braid(-1) + braid(1);
  const hairFront = hairCap(cx, cy, rx, ry, { pad: 7, amp: 0, bumps: 1, line: 0.3, scallops: 2, dip: 12, part: 0, side: 0.25, a0: 166, a1: 374 }) +
    // short bangs
    P(`M${cx - rx * 0.62} ${cy - ry * 0.3} Q${cx - 20} ${cy - ry * 0.05} ${cx - 6} ${cy - ry * 0.34} Q${cx + 10} ${cy - ry * 0.06} ${cx + 22} ${cy - ry * 0.34} Q${cx + 34} ${cy - ry * 0.12} ${cx + rx * 0.66} ${cy - ry * 0.3} L${cx + rx * 0.5} ${cy - ry * 0.6} L${cx - rx * 0.5} ${cy - ry * 0.6} Z`, hc) +
    hairShine([`M${cx - 30} ${cy - ry * 0.82} q10 -10 22 -12`]);
  return head({ cx, cy, rx, ry, skin, expr: o.expr, mouth: o.mouth, look: o.look, hairBack, hairFront });
}
function tutul(o = {}) {
  const skin = SKIN.tutul, frock = '#3B6EA8';
  let s = EF(0, 2, 66, 10, '#000', 'opacity="0.12"');
  // backpack behind
  s += P('M-52 -192 Q-54 -110 -44 -100 L44 -100 Q54 -110 52 -192 Q0 -206 -52 -192 Z', PAL.mari);
  s += tube([[-16, -96], [-17, -30]], 20, skin) + tube([[16, -96], [17, -30]], 20, skin);
  s += P('M-28 -54 L-6 -54 L-6 -24 L-28 -24 Z', PAL.white) + P('M6 -54 L28 -54 L28 -24 L6 -24 Z', PAL.white);
  s += shoe(-20, -6, INK, '#555', true).replace(/scale\(-1 1\)/, 'scale(-0.75 0.85)') + shoe(20, -6, INK, '#555').replace(/scale\(1 1\)/, 'scale(0.75 0.85)');
  s += P('M-10 -206 L10 -206 L11 -186 L-11 -186 Z', skin);
  // white shirt
  s += P('M-34 -194 Q-50 -192 -52 -176 L-46 -120 L46 -120 L52 -176 Q50 -192 34 -194 Q0 -186 -34 -194 Z', PAL.white);
  // sky-blue pinafore frock with white belt
  s += P('M-26 -184 L-14 -184 L-12 -152 L12 -152 L14 -184 L26 -184 L30 -146 Q44 -120 52 -84 Q0 -74 -52 -84 Q-44 -120 -30 -146 Z', frock);
  s += F('M22 -184 L26 -184 L30 -146 Q44 -120 52 -84 Q44 -82 40 -82 Q36 -122 22 -150 Z', shade(frock));
  s += P('M-34 -142 L34 -142 L35 -132 L-35 -132 Z', PAL.white);
  s += P('M-18 -194 L0 -182 L-6 -170 L-22 -186 Z', PAL.white) + P('M18 -194 L0 -182 L6 -170 L22 -186 Z', PAL.white);
  // backpack straps
  s += L('M-30 -190 Q-34 -160 -32 -136', 8, shade(PAL.mari, 0.8)) + L('M30 -190 Q34 -160 32 -136', 8, shade(PAL.mari, 0.8));
  // left arm holding strap
  s += tube([[-44, -180], [-52, -166]], 24, PAL.white) + tube([[-52, -164], [-56, -140], [-38, -150]], 16, skin);
  s += hand(-34, -150, skin, 20, true, 0.8);
  // right arm waving (open palm)
  s += tube([[44, -180], [54, -168]], 24, PAL.white) + tube([[54, -166], [86, -186], [88, -228]], 16, skin);
  s += handOpen(88, -238, skin, 12, false);
  s += tutulHead({ expr: o.expr || 'happy', mouth: o.mouth || 'grin' });
  return s;
}

const CAST = [
  { id: 'rafi', fn: rafi, head: rafiHead, bn: 'রাফি', en: 'Rafi — FIXIBLE IT Technician', mark: 'Teal polo, ID card, toolbox' },
  { id: 'karim', fn: karim, head: karimHead, bn: 'করিম ভাই', en: 'Karim Bhai — Shop Owner', mark: 'Moustache, checked lungi, khata' },
  { id: 'nasima', fn: nasima, head: nasimaHead, bn: 'নাসিমা আপা', en: 'Nasima Apa — Home User', mark: 'Red kameez, marigold orna, bun' },
  { id: 'dadu', fn: dadu, head: daduHead, bn: 'দাদু', en: 'Dadu — Grandfather', mark: 'Silver hair, square glasses, teal shawl' },
  { id: 'tutul', fn: tutul, head: tutulHead, bn: 'টুটুল', en: 'Tutul — Student', mark: 'Two braids, red ribbons, backpack' },
];

module.exports = { PAL, INK, SW, shade, P, L, E, EF, F, G, tube, hand, head, face, CAST, rafiHead };
