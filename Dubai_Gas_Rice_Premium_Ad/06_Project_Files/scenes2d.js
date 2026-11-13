// Dubai Gas & Rice — premium 2D motion-graphics scenes (Canvas2D, deterministic)
export const W = 1080, H = 1920;
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const P = (t, a, b) => clamp((t - a) / (b - a));
export const eio = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const eout = t => 1 - Math.pow(1 - t, 3);
export const eout5 = t => 1 - Math.pow(1 - t, 5);
export const ein = t => t * t * t;
export const eback = t => { const c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
export const sine = t => -(Math.cos(Math.PI * t) - 1) / 2;
export function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

function mk(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function rr(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }
function grad(g, x0, y0, x1, y1, stops) { const l = g.createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, c]) => l.addColorStop(o, c)); return l; }
function rad(g, x, y, r0, r1, stops) { const l = g.createRadialGradient(x, y, r0, x, y, r1); stops.forEach(([o, c]) => l.addColorStop(o, c)); return l; }
function shade(hex, k) { // k<0 darker, k>0 lighter
  const n = parseInt(hex.slice(1), 16); let r = n >> 16, gg = n >> 8 & 255, b = n & 255;
  const f = v => Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k);
  return `rgb(${f(r)},${f(gg)},${f(b)})`;
}

// ------------------------------------------------------------------ shared: LPG cylinder (flat-premium)
export function drawCylinder(g, cx, baseY, h, color, opt = {}) {
  const w = h * .5, footH = h * .12, colH = h * .17, bodyTop = baseY - h + colH, bodyBot = baseY - footH * .55;
  const x0 = cx - w / 2;
  // floor shadow
  if (!opt.noShadow) { g.save(); g.fillStyle = rad(g, cx, baseY, 0, w * .9, [[0, 'rgba(0,0,0,.45)'], [1, 'rgba(0,0,0,0)']]); g.translate(cx, baseY); g.scale(1, .18); g.translate(-cx, -baseY); g.beginPath(); g.arc(cx, baseY, w * .9, 0, 7); g.fill(); g.restore(); }
  const cyl = (c) => grad(g, x0, 0, x0 + w, 0, [[0, shade(c, -.6)], [.12, shade(c, -.25)], [.32, shade(c, .12)], [.42, shade(c, .38)], [.5, shade(c, .08)], [.78, shade(c, -.2)], [1, shade(c, -.65)]]);
  // foot ring
  const fw = w * .86, fx = cx - fw / 2;
  g.fillStyle = cyl(color); rr(g, fx, baseY - footH, fw, footH, [4, 4, 10, 10]); g.fill();
  g.fillStyle = 'rgba(0,0,0,.55)'; for (let i = -1; i <= 1; i++) { g.beginPath(); g.ellipse(cx + i * fw * .3, baseY - footH * .5, fw * .07, footH * .2, 0, 0, 7); g.fill(); }
  // body (rounded domes)
  g.fillStyle = cyl(color); rr(g, x0, bodyTop, w, bodyBot - bodyTop, [w * .42, w * .42, w * .2, w * .2]); g.fill();
  // dome shading
  g.fillStyle = grad(g, 0, bodyTop, 0, bodyTop + w * .45, [[0, 'rgba(255,255,255,.18)'], [1, 'rgba(255,255,255,0)']]); rr(g, x0, bodyTop, w, w * .45, [w * .42, w * .42, 0, 0]); g.fill();
  g.fillStyle = grad(g, 0, bodyBot - w * .25, 0, bodyBot, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,.35)']]); g.fillRect(x0, bodyBot - w * .25, w, w * .25);
  // weld seam
  const sy = lerp(bodyTop, bodyBot, .52); g.strokeStyle = 'rgba(0,0,0,.28)'; g.lineWidth = Math.max(1.5, h * .004); g.beginPath(); g.ellipse(cx, sy, w / 2, w * .04, 0, 0, Math.PI); g.stroke();
  g.strokeStyle = 'rgba(255,255,255,.18)'; g.beginPath(); g.ellipse(cx, sy + 3, w / 2, w * .04, 0, 0, Math.PI); g.stroke();
  // collar with handle hole
  const cw = w * .58, cxl = cx - cw / 2, cy0 = baseY - h;
  g.fillStyle = cyl(opt.collar || color); rr(g, cxl, cy0, cw, colH + w * .08, [8, 8, 2, 2]); g.fill();
  g.fillStyle = 'rgba(5,10,20,.85)'; rr(g, cx - cw * .3, cy0 + colH * .2, cw * .6, colH * .33, colH * .16); g.fill();
  g.fillStyle = grad(g, 0, cy0, 0, cy0 + 8, [[0, 'rgba(255,255,255,.5)'], [1, 'rgba(255,255,255,0)']]); g.fillRect(cxl + 4, cy0, cw - 8, 8);
  // brass valve (visible through hole)
  const vx = cx - w * .05, vy = cy0 + colH * .33;
  g.fillStyle = grad(g, vx, 0, vx + w * .1, 0, [[0, '#6e4f17'], [.4, '#f4d68a'], [1, '#8a6420']]); g.fillRect(vx, vy, w * .1, colH * .5);
  // specular highlight strip
  g.fillStyle = grad(g, x0 + w * .3, 0, x0 + w * .44, 0, [[0, 'rgba(255,255,255,0)'], [.5, 'rgba(255,255,255,.35)'], [1, 'rgba(255,255,255,0)']]);
  rr(g, x0 + w * .3, bodyTop + w * .12, w * .14, bodyBot - bodyTop - w * .3, w * .07); g.fill();
  // moving light sweep (premium)
  if (opt.sweep !== undefined) {
    g.save(); rr(g, x0, bodyTop, w, bodyBot - bodyTop, [w * .42, w * .42, w * .2, w * .2]); g.clip();
    const sx = lerp(x0 - w, x0 + w * 2, opt.sweep);
    g.globalCompositeOperation = 'lighter';
    g.fillStyle = grad(g, sx - w * .25, 0, sx + w * .25, 0, [[0, 'rgba(255,255,255,0)'], [.5, 'rgba(255,240,210,.45)'], [1, 'rgba(255,255,255,0)']]);
    g.fillRect(x0, bodyTop, w, bodyBot - bodyTop); g.restore();
  }
  // rim light
  if (opt.rim) { g.strokeStyle = opt.rim; g.lineWidth = Math.max(2, h * .006); rr(g, x0, bodyTop, w, bodyBot - bodyTop, [w * .42, w * .42, w * .2, w * .2]); g.stroke(); }
}

// ------------------------------------------------------------------ SCENE 1: neighbourhood
function buildingFacade(g, x, base, bw, bh, col, r) {
  const top = base - bh;
  g.fillStyle = col; g.fillRect(x, top, bw, bh);
  // left edge shadow + stains
  g.fillStyle = grad(g, x, 0, x + bw, 0, [[0, 'rgba(0,0,0,.12)'], [.15, 'rgba(0,0,0,0)'], [.85, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,.18)']]); g.fillRect(x, top, bw, bh);
  for (let i = 0; i < 4; i++) { g.fillStyle = 'rgba(60,55,45,.07)'; g.fillRect(x + r() * bw, top + r() * bh * .6, 3 + r() * 6, 60 + r() * 160); }
  const fh = 92, shopH = 120, nf = Math.floor((bh - shopH - 30) / fh);
  const cols = Math.max(1, Math.round(bw / 95)), cw = bw / cols;
  for (let f = 0; f < nf; f++) {
    const fy = top + 30 + f * fh;
    for (let c = 0; c < cols; c++) {
      const wx = x + c * cw + cw * .16, ww = cw * .68, wy = fy + 14, wh = fh * .58;
      g.fillStyle = 'rgba(255,255,255,.55)'; g.fillRect(wx - 4, wy - 4, ww + 8, wh + 8);
      g.fillStyle = grad(g, wx, wy, wx + ww, wy + wh, [[0, '#2c3d50'], [.55, '#5f7a90'], [1, '#22303d']]); g.fillRect(wx, wy, ww, wh);
      if (r() > .55) { g.fillStyle = ['#c3504a', '#3d6fa8', '#e2b23d', '#6aa35a', '#d77fa8'][Math.floor(r() * 5)]; g.globalAlpha = .85; g.fillRect(wx + 3, wy + 3, ww * .35, wh - 6); g.globalAlpha = 1; }
      g.strokeStyle = 'rgba(240,240,235,.9)'; g.lineWidth = 2; for (let k = 1; k < 6; k++) { g.beginPath(); g.moveTo(wx + ww * k / 6, wy); g.lineTo(wx + ww * k / 6, wy + wh); g.stroke(); }
      g.beginPath(); g.moveTo(wx, wy + wh / 2); g.lineTo(wx + ww, wy + wh / 2); g.stroke();
      if (r() > .7) { g.fillStyle = '#e9e9e4'; g.fillRect(wx + ww - 10, wy + wh - 22, 30, 20); }
    }
    // balcony slab + railing + clothes
    g.fillStyle = '#f3efe6'; g.fillRect(x - 6, fy + fh - 10, bw + 12, 9); g.fillStyle = 'rgba(0,0,0,.15)'; g.fillRect(x - 6, fy + fh - 1, bw + 12, 4);
    if (f % 2 === 0) { g.strokeStyle = 'rgba(40,40,40,.55)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, fy + fh - 34); g.lineTo(x + bw, fy + fh - 34); g.stroke(); for (let k = x + 8; k < x + bw; k += 14) { g.beginPath(); g.moveTo(k, fy + fh - 34); g.lineTo(k, fy + fh - 10); g.stroke(); } }
    if (r() > .7) { const cx = x + r() * bw * .7; ['#e74c3c', '#f1c40f', '#3498db', '#ffffff'].forEach((cc, k) => { g.fillStyle = cc; g.fillRect(cx + k * 16, fy + fh - 33, 12, 18 + r() * 8); }); }
  }
  // ground-floor shop
  const sy = base - shopH; const sc = ['#c0392b', '#1f6d9c', '#2d8a4e', '#d9a21b', '#7d3c98'][Math.floor(r() * 5)];
  g.fillStyle = '#8f9295'; g.fillRect(x, sy, bw, shopH); for (let y = sy + 34; y < base; y += 8) { g.fillStyle = (y / 8) % 2 < 1 ? '#a6a9ac' : '#7d8083'; g.fillRect(x + 6, y, bw - 12, 5); }
  g.fillStyle = sc; g.fillRect(x, sy, bw, 32); g.fillStyle = 'rgba(255,255,255,.75)'; g.fillRect(x + 12, sy + 9, bw * .4, 6); g.fillRect(x + 12, sy + 19, bw * .25, 5);
  // roof: parapet, water tanks, stair room
  g.fillStyle = shade(col.startsWith('#') ? col : '#dddddd', -.08); g.fillRect(x - 4, top - 16, bw + 8, 16);
  const nt = 1 + Math.floor(r() * 2);
  for (let i = 0; i < nt; i++) { const tx = x + 20 + r() * (bw - 90); g.fillStyle = '#d9d4c8'; g.fillRect(tx - 6, top - 30, 70, 14); g.fillStyle = grad(g, tx, 0, tx + 58, 0, [[0, '#0e0f11'], [.4, '#3a3d42'], [1, '#0c0d0f']]); rr(g, tx, top - 84, 58, 56, 10); g.fill(); g.fillStyle = '#2a2c30'; g.fillRect(tx + 4, top - 60, 50, 3); }
  if (r() > .5) { g.fillStyle = shade('#e8e2d4', -.05); g.fillRect(x + bw - 90, top - 70, 70, 54); }
}
function palm(g, x, base, h, r) {
  const bend = (r() - .5) * 60;
  g.strokeStyle = '#6b5338'; g.lineWidth = 12; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, base); g.quadraticCurveTo(x + bend * .3, base - h * .5, x + bend, base - h); g.stroke();
  g.strokeStyle = 'rgba(0,0,0,.18)'; g.lineWidth = 2; for (let k = 0; k < h; k += 14) { const u = k / h; const px = x + bend * u * u; g.beginPath(); g.moveTo(px - 6, base - k); g.lineTo(px + 6, base - k - 3); g.stroke(); }
  const tx = x + bend, ty = base - h;
  for (let i = 0; i < 9; i++) {
    const a = -Math.PI / 2 + (i - 4) * .38 + (r() - .5) * .2, L = 110 + r() * 40;
    const ex = tx + Math.cos(a) * L, ey = ty + Math.sin(a) * L * .55 + 50;
    g.fillStyle = i % 2 ? '#3f7d36' : '#4f9440'; g.beginPath(); g.moveTo(tx, ty);
    g.quadraticCurveTo((tx + ex) / 2 + Math.sin(a) * 18, (ty + ey) / 2 - 40, ex, ey); g.quadraticCurveTo((tx + ex) / 2 - Math.sin(a) * 18, (ty + ey) / 2 - 20, tx, ty); g.fill();
  }
}
function roundTree(g, x, base, s, r) {
  g.fillStyle = '#6b5338'; g.fillRect(x - 7, base - 90 * s, 14, 90 * s);
  ['#2f6a30', '#3e7a35', '#4f8c3c'].forEach((c, k) => { g.fillStyle = c; for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(x + (r() - .5) * 90 * s, base - 120 * s - k * 22 * s + (r() - .5) * 30, (48 - k * 6) * s, 0, 7); g.fill(); } });
}
export function buildHood() {
  const r = rng(7);
  const far = mk(1500, 1300), mid = mk(1600, 1600), front = mk(1700, 1920);
  { // far skyline
    const g = far.getContext('2d');
    let x = 0; while (x < 1500) { const bw = 90 + r() * 140, bh = 240 + r() * 420; g.fillStyle = `rgba(${150 + r() * 20},${165 + r() * 20},${185 + r() * 15},1)`; g.fillRect(x, 1250 - bh, bw, bh + 50);
      g.fillStyle = 'rgba(255,255,255,.25)'; for (let yy = 1250 - bh + 20; yy < 1240; yy += 36) for (let xx = x + 10; xx < x + bw - 14; xx += 26) if (r() > .3) g.fillRect(xx, yy, 12, 16);
      if (r() > .5) { g.fillStyle = 'rgba(120,130,150,1)'; rr(g, x + 14, 1250 - bh - 26, 34, 26, 5); g.fill(); }
      x += bw + 6; }
    g.fillStyle = grad(g, 0, 700, 0, 1300, [[0, 'rgba(225,225,215,0)'], [1, 'rgba(225,222,210,.6)']]); g.fillRect(0, 0, 1500, 1300);
  }
  { // mid: detailed residential blocks
    const g = mid.getContext('2d'); const cols = ['#e9dcc0', '#d3e4d2', '#efc9a8', '#ead0c9', '#cddcea', '#efeae0', '#e6c77f', '#f1e3b5', '#d9cfe3', '#c9e0dc'];
    let x = -20; let k = 0;
    while (x < 1600) {
      const bw = 200 + r() * 140, bh = 620 + r() * 380;
      buildingFacade(g, x, 1560, bw, bh, cols[k % cols.length], r);
      if (r() > .45) { const tx = x + bw + 12; palm(g, tx, 1560, 360 + r() * 160, r); }
      x += bw + 18 + r() * 20; k++;
    }
  }
  { // front: sidewalk, poles, wires, trees
    const g = front.getContext('2d');
    g.fillStyle = '#b8ae9a'; g.fillRect(0, 1540, 1700, 60); g.fillStyle = '#958b77'; g.fillRect(0, 1596, 1700, 10);
    g.fillStyle = grad(g, 0, 1606, 0, 1920, [[0, '#4a4a4c'], [1, '#353537']]); g.fillRect(0, 1606, 1700, 314);
    for (let i = 0; i < 3000; i++) { const v = 40 + r() * 60; g.fillStyle = `rgba(${v},${v},${v},.5)`; g.fillRect(r() * 1700, 1606 + r() * 314, 2, 2); }
    g.fillStyle = 'rgba(240,230,190,.8)'; for (let x = 0; x < 1700; x += 120) g.fillRect(x, 1770, 64, 8);
    g.fillStyle = '#b8ae9a'; g.fillRect(0, 1890, 1700, 30);
    const poles = [140, 760, 1380];
    poles.forEach(px => { g.fillStyle = grad(g, px - 9, 0, px + 9, 0, [[0, '#7d7a72'], [.5, '#b5b1a7'], [1, '#6e6b64']]); g.fillRect(px - 9, 520, 18, 1050); g.fillStyle = '#8d8a82'; g.fillRect(px - 50, 560, 100, 10); g.fillRect(px - 40, 610, 80, 8); });
    g.strokeStyle = 'rgba(20,20,22,.85)'; g.lineWidth = 2.5;
    for (let i = 0; i < poles.length - 1; i++) for (let k2 = 0; k2 < 5; k2++) { const y0 = 562 + (k2 % 3) * 24; g.beginPath(); g.moveTo(poles[i] - 40 + k2 * 20, y0); g.quadraticCurveTo((poles[i] + poles[i + 1]) / 2, y0 + 70 + k2 * 12, poles[i + 1] - 40 + k2 * 20, y0); g.stroke(); }
    for (let k2 = 0; k2 < 3; k2++) { g.beginPath(); g.moveTo(-10, 590 + k2 * 30); g.quadraticCurveTo(70, 640 + k2 * 20, poles[0] - 30, 566 + k2 * 20); g.stroke(); }
    roundTree(g, 470, 1560, 1.35, r); roundTree(g, 1090, 1560, 1.2, r);
  }
  // vehicles + pedestrians
  const veh = [];
  for (let i = 0; i < 6; i++) veh.push({ type: i % 3 === 1 ? 'cng' : 'rick', dir: i % 2 ? -1 : 1, x0: -300 + i * 330 + r() * 80, lane: i % 2 ? 1690 : 1840, sp: i % 3 === 1 ? 260 : 120 + r() * 40, col: i });
  const peds = []; for (let i = 0; i < 9; i++) peds.push({ x0: r() * 1500, sp: (r() - .5) * 80, col: ['#ffffff', '#2f5f9e', '#a83a5a', '#2d7a5a', '#d9a03a', '#444'][i % 6], y: 1565 + r() * 20 });
  const birds = []; for (let i = 0; i < 7; i++) birds.push({ x: 700 + r() * 300, y: 520 + r() * 160, s: .6 + r() * .6, ph: r() * 6 });
  function person(g, x, y, col, s = 1, walk = 0) {
    g.fillStyle = '#7a4e33'; g.beginPath(); g.arc(x, y - 58 * s, 9 * s, 0, 7); g.fill();
    g.fillStyle = col; rr(g, x - 10 * s, y - 48 * s, 20 * s, 32 * s, 6 * s); g.fill();
    g.fillStyle = '#3a3a3a'; g.fillRect(x - 8 * s + Math.sin(walk) * 3, y - 18 * s, 6 * s, 18 * s); g.fillRect(x + 2 * s - Math.sin(walk) * 3, y - 18 * s, 6 * s, 18 * s);
  }
  function wheel(g, x, y, R, ang) {
    g.strokeStyle = '#151515'; g.lineWidth = R * .18; g.beginPath(); g.arc(x, y, R, 0, 7); g.stroke();
    g.strokeStyle = '#bdbdbd'; g.lineWidth = 1.5; for (let k = 0; k < 8; k++) { const a = ang + k * Math.PI / 4; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * R * .9, y + Math.sin(a) * R * .9); g.stroke(); }
    g.fillStyle = '#888'; g.beginPath(); g.arc(x, y, R * .14, 0, 7); g.fill();
  }
  function rickshaw(g, x, y, dir, t, k) {
    g.save(); g.translate(x, y); g.scale(dir, 1);
    const ang = t * 6;
    wheel(g, -55, -30, 30, ang); wheel(g, 70, -28, 28, ang);
    g.strokeStyle = '#2b2b2b'; g.lineWidth = 6; g.beginPath(); g.moveTo(-55, -30); g.lineTo(10, -55); g.lineTo(70, -28); g.stroke();
    const hc = ['#d63c6b', '#2a6fd1', '#f0b323', '#1fa37a'][k % 4];
    g.fillStyle = ['#b52a3a', '#1e4fa3', '#e0a420', '#23885f'][k % 4]; rr(g, -95, -95, 80, 40, 8); g.fill();
    g.fillStyle = hc; g.beginPath(); g.moveTo(-110, -95); g.quadraticCurveTo(-100, -175, -30, -170); g.lineTo(-25, -95); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 3; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(-100 + i * 18, -98); g.quadraticCurveTo(-92 + i * 16, -150, -40 + i * 4, -165 + i * 5); g.stroke(); }
    g.fillStyle = '#ffe36b'; for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(-95 + i * 20, -105, 4, 0, 7); g.fill(); }
    person(g, 22, -62, ['#f2f2f2', '#3b6ea5', '#9a3b3b'][k % 3], 1, t * 8);
    if (k % 2 === 0) person(g, -60, -95, '#2d6e5c', .95);
    g.restore();
  }
  function cng(g, x, y, dir, t) {
    g.save(); g.translate(x, y); g.scale(dir, 1);
    wheel(g, -70, -26, 26, t * 9); wheel(g, 75, -26, 26, t * 9);
    g.fillStyle = grad(g, 0, -170, 0, -30, [[0, '#2fae55'], [1, '#17722f']]); rr(g, -110, -150, 220, 115, [50, 60, 14, 14]); g.fill();
    g.fillStyle = '#0f3d1d'; rr(g, -115, -165, 200, 22, 8); g.fill();
    g.fillStyle = '#1a2a38'; rr(g, 40, -140, 60, 48, [30, 12, 4, 4]); g.fill();
    g.strokeStyle = '#0f3d1d'; g.lineWidth = 3; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(-100 + i * 24, -143); g.lineTo(-100 + i * 24, -60); g.stroke(); }
    g.fillStyle = '#ffd36b'; g.beginPath(); g.arc(104, -70, 7, 0, 7); g.fill();
    g.restore();
  }
  function draw(g, t) {
    const u = eio(P(t, 0, 4.05));
    // sky
    g.fillStyle = grad(g, 0, 0, 0, 1300, [[0, '#5d8fc2'], [.55, '#a9c6de'], [1, '#efe6d2']]); g.fillRect(0, 0, W, H);
    g.fillStyle = rad(g, 860, 420, 0, 520, [[0, 'rgba(255,240,200,.9)'], [.15, 'rgba(255,230,180,.45)'], [1, 'rgba(255,230,180,0)']]); g.fillRect(0, 0, W, H);
    // clouds
    g.fillStyle = 'rgba(255,255,255,.55)'; [[200, 300, 1], [640, 210, .8], [980, 380, .7]].forEach(([cx, cy, s], i) => { const x = cx - t * (8 + i * 4); for (let k = 0; k < 4; k++) { g.beginPath(); g.ellipse(x + k * 46 * s, cy + (k % 2) * 8, 60 * s, 26 * s, 0, 0, 7); g.fill(); } });
    birds.forEach(b => { const x = b.x - t * 40 * b.s, y = b.y + Math.sin(t * 2 + b.ph) * 8, f = Math.sin(t * 10 + b.ph) * 8; g.strokeStyle = 'rgba(30,40,55,.7)'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(x - 14 * b.s, y - f * b.s); g.quadraticCurveTo(x - 6 * b.s, y - 4, x, y); g.quadraticCurveTo(x + 6 * b.s, y - 4, x + 14 * b.s, y - f * b.s); g.stroke(); });
    // camera push-in
    const sc = lerp(1.0, 1.16, u);
    g.save(); g.translate(540, 1500); g.scale(sc, sc); g.translate(-540, -1500);
    g.drawImage(far, -200 - u * 40, 1500 - 1300 + 20 - 340);
    g.drawImage(mid, -260 - u * 90, -40);
    g.drawImage(front, -300 - u * 150, 0);
    // pedestrians & vehicles (front layer space)
    const ox = -300 - u * 150;
    peds.forEach(p => { const x = ((p.x0 + p.sp * t) % 1700 + 1700) % 1700 + ox; person(g, x, p.y, p.col, .9, t * 7 + p.x0); });
    veh.forEach(v => { let x = v.x0 + v.dir * v.sp * t; x = ((x + 400) % 2100 + 2100) % 2100 - 400; const y = v.lane; v.type === 'cng' ? cng(g, x + ox + 300, y, v.dir, t) : rickshaw(g, x + ox + 300, y, v.dir, t, v.col); });
    // location pin dropping onto the street
    if (t > .95) {
      const d = P(t, 1.0, 1.7); const py = d < 1 ? lerp(-500, 1700, eout(d) * eout(d)) : 1700;
      const sq = P(t, 1.7, 2.1); const squash = 1 + Math.sin(sq * Math.PI) * .2 * (1 - sq);
      const fl = t > 2.1 ? Math.sin((t - 2.1) * 3) * 10 - 10 : 0;
      for (let i = 0; i < 3; i++) { const ph = (t - 1.7 - i * .45) / 1.4; if (ph < 0) continue; const f = ph % 1; g.strokeStyle = `rgba(255,210,122,${(1 - f) * .9})`; g.lineWidth = 6 * (1 - f) + 2; g.beginPath(); g.ellipse(540, 1712, 40 + f * 260, (40 + f * 260) * .25, 0, 0, 7); g.stroke(); }
      g.save(); g.translate(540, py + fl); g.scale(1.1 * squash, 1.1 / squash);
      g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(0, 12, 40, 10, 0, 0, 7); g.fill();
      g.fillStyle = grad(g, -60, -200, 60, 0, [[0, '#fff1c4'], [.35, '#e8bf62'], [.7, '#b8862f'], [1, '#e9c776']]);
      g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(-30, -60, -70, -95, -70, -150); g.arc(0, -150, 70, Math.PI, 0); g.bezierCurveTo(70, -95, 30, -60, 0, 0); g.fill();
      g.fillStyle = '#0b1f3a'; g.beginPath(); g.arc(0, -150, 30, 0, 7); g.fill();
      g.fillStyle = 'rgba(255,255,255,.45)'; g.beginPath(); g.ellipse(-28, -180, 12, 24, -.5, 0, 7); g.fill();
      g.restore();
    }
    g.restore();
    // warm grade
    g.fillStyle = 'rgba(255,190,120,.05)'; g.fillRect(0, 0, W, H);
  }
  return draw;
}

// ------------------------------------------------------------------ SCENE 2: gas shop (problem)
export function buildMarket() {
  const r = rng(21);
  const L = mk(1700, 1920); const g = L.getContext('2d');
  g.fillStyle = grad(g, 0, 0, 0, 1500, [[0, '#33554f'], [1, '#4c716b']]); g.fillRect(0, 0, 1700, 1500);
  for (let i = 0; i < 9000; i++) { const v = r() * 255; g.fillStyle = `rgba(${v},${v},${v},${r() * .05})`; g.fillRect(r() * 1700, r() * 1500, 3, 3); }
  g.fillStyle = grad(g, 0, 1100, 0, 1500, [[0, 'rgba(30,30,20,0)'], [1, 'rgba(30,30,20,.35)']]); g.fillRect(0, 1100, 1700, 400);
  // rolled shutter
  g.fillStyle = grad(g, 0, 60, 0, 190, [[0, '#5d6166'], [.5, '#b9bec4'], [1, '#55595e']]); g.fillRect(0, 60, 1700, 130);
  for (let y = 70; y < 190; y += 12) { g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(0, y, 1700, 3); }
  // shelf with stock boxes
  g.fillStyle = '#6b4a2e'; g.fillRect(800, 860, 820, 18); g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(800, 878, 820, 10);
  for (let i = 0; i < 8; i++) { const bw = 70 + r() * 40, bh = 70 + r() * 60; g.fillStyle = ['#b33a2c', '#2c64a8', '#d2a537', '#2e8b57', '#e3e0d6'][i % 5]; g.fillRect(820 + i * 100, 860 - bh, bw, bh); g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(820 + i * 100, 860 - bh, bw, 10); }
  // hose coils
  [[260, 760], [380, 760]].forEach(([x, y]) => { g.strokeStyle = '#e0661f'; g.lineWidth = 9; for (let k = 0; k < 3; k++) { g.beginPath(); g.ellipse(x, y + k * 4, 52, 52, 0, 0, 7); g.stroke(); } });
  // floor
  g.fillStyle = grad(g, 0, 1500, 0, 1920, [[0, '#5d584f'], [1, '#3a3631']]); g.fillRect(0, 1500, 1700, 420);
  g.strokeStyle = 'rgba(20,18,15,.4)'; g.lineWidth = 3; for (let x = -400; x < 2100; x += 220) { g.beginPath(); g.moveTo(850 + (x - 850) * .6, 1500); g.lineTo(x, 1920); g.stroke(); } [1580, 1690, 1830].forEach(y => { g.beginPath(); g.moveTo(0, y); g.lineTo(1700, y); g.stroke(); });
  // platform + cylinders
  g.fillStyle = '#4b4741'; g.fillRect(0, 1360, 1700, 40); g.fillStyle = '#5c574f'; g.fillRect(0, 1350, 1700, 12);
  const cols = ['#1f6d3a', '#a8231f', '#1f4e8c', '#d79a1c', '#17766f', '#a8231f', '#1f6d3a', '#1f4e8c', '#d79a1c', '#a8231f', '#1f6d3a', '#1f4e8c'];
  for (let i = 0; i < 9; i++) drawCylinder(g, 110 + i * 190 + (r() - .5) * 20, 1360, 430, cols[i]);
  for (let i = 0; i < 7; i++) drawCylinder(g, 70 + i * 260 + (r() - .5) * 30, 1820, 560, cols[(i + 3) % cols.length]);
  return function draw(c, t) {
    const u = sine(P(t, 3.6, 8.3));
    const sc = lerp(1.0, 1.08, u) + ein(P(t, 7.5, 8.3)) * .2;
    c.save(); c.translate(540, 1300); c.scale(sc, sc); c.translate(-540, -1300);
    c.drawImage(L, lerp(-80, -560, u), Math.sin(t * 1.7) * 3);
    c.restore();
    // hanging bulb glow + cool tension grade
    c.save(); c.globalCompositeOperation = 'lighter';
    c.fillStyle = rad(c, 520, 600, 0, 700, [[0, 'rgba(255,190,110,.32)'], [1, 'rgba(255,190,110,0)']]); c.fillRect(0, 0, W, H); c.restore();
    c.strokeStyle = '#222'; c.lineWidth = 3; c.beginPath(); c.moveTo(520, 0); c.lineTo(520, 560); c.stroke();
    c.fillStyle = rad(c, 520, 585, 0, 32, [[0, '#fffbe8'], [.6, '#ffd890'], [1, 'rgba(255,200,120,0)']]); c.beginPath(); c.arc(520, 585, 32, 0, 7); c.fill();
    c.fillStyle = 'rgba(12,24,44,.28)'; c.fillRect(0, 0, W, H);
  };
}

// ------------------------------------------------------------------ brand stage (S3, S6, end card)
export function buildBrand(logoImg) {
  const r = rng(33);
  const parts = []; for (let i = 0; i < 170; i++) parts.push({ x: r() * W, y: r() * H, s: 1.5 + r() * 4.5, sp: 30 + r() * 90, a: .3 + r() * .7, ph: r() * 6 });
  const bok = []; for (let i = 0; i < 16; i++) bok.push({ x: r() * W, y: r() * H, rr: 50 + r() * 130, gold: r() > .4, ph: r() * 6 });
  function bg(g, t, cy = 860) {
    g.fillStyle = rad(g, 540, cy, 0, 1300, [[0, '#17355f'], [.45, '#0b1f3a'], [1, '#030a16']]); g.fillRect(0, 0, W, H);
    g.save(); g.globalCompositeOperation = 'lighter'; g.translate(540, cy); g.rotate(t * .05);
    for (let i = 0; i < 14; i++) { g.rotate(Math.PI * 2 / 14); g.fillStyle = grad(g, 0, 0, 0, -1300, [[0, 'rgba(255,200,110,.10)'], [1, 'rgba(255,200,110,0)']]); g.beginPath(); g.moveTo(-12, 0); g.lineTo(-90, -1300); g.lineTo(90, -1300); g.lineTo(12, 0); g.fill(); }
    g.restore();
    g.save(); g.globalCompositeOperation = 'lighter';
    bok.forEach(b => { const a = .05 + .05 * Math.sin(t * .8 + b.ph); g.fillStyle = b.gold ? `rgba(232,180,90,${a})` : `rgba(47,179,167,${a})`; g.beginPath(); g.arc(b.x + Math.sin(t * .3 + b.ph) * 20, b.y, b.rr, 0, 7); g.fill(); });
    parts.forEach(p => { const y = ((p.y - p.sp * t) % H + H) % H, x = p.x + Math.sin(t * .7 + p.ph) * 14; g.fillStyle = rad(g, x, y, 0, p.s * 2.2, [[0, `rgba(255,220,150,${p.a})`], [1, 'rgba(255,220,150,0)']]); g.fillRect(x - p.s * 2.2, y - p.s * 2.2, p.s * 4.4, p.s * 4.4); });
    g.restore();
  }
  function logo(g, t, cx, cy, d, flip, sweep, glowA) {
    // glow + halo rings
    g.save(); g.globalCompositeOperation = 'lighter';
    g.fillStyle = rad(g, cx, cy, d * .3, d * 1.25, [[0, `rgba(240,190,100,${.35 * glowA})`], [1, 'rgba(240,190,100,0)']]); g.fillRect(cx - d * 1.3, cy - d * 1.3, d * 2.6, d * 2.6);
    g.restore();
    g.save(); g.translate(cx, cy);
    g.strokeStyle = `rgba(240,207,130,${.6 * glowA})`; g.lineWidth = 2.5; g.setLineDash([]); g.beginPath(); g.arc(0, 0, d * .66, 0, 7); g.stroke();
    g.rotate(t * .25); g.strokeStyle = `rgba(240,207,130,${.4 * glowA})`; g.lineWidth = 2; g.setLineDash([3, 14]); g.beginPath(); g.arc(0, 0, d * .75, 0, 7); g.stroke(); g.setLineDash([]);
    g.restore();
    // coin flip: scaleX = |cos|, gold edge thickness when turned
    g.save(); g.translate(cx, cy);
    const sx = Math.max(.02, Math.abs(flip));
    if (sx < .98) { g.fillStyle = grad(g, -d / 2, 0, d / 2, 0, [[0, '#7a5518'], [.5, '#f3d790'], [1, '#7a5518']]); g.beginPath(); g.ellipse(Math.sign(flip || 1) * -d * .04 * (1 - sx), 0, d / 2 * sx + d * .03 * (1 - sx), d / 2, 0, 0, 7); g.fill(); }
    g.scale(sx, 1);
    if (flip >= 0) g.drawImage(logoImg, -d / 2, -d / 2, d, d);
    else { g.fillStyle = grad(g, 0, -d / 2, 0, d / 2, [[0, '#14335e'], [1, '#08162b']]); g.beginPath(); g.arc(0, 0, d / 2, 0, 7); g.fill(); g.strokeStyle = '#d6a650'; g.lineWidth = d * .02; g.stroke(); }
    // light sweep (clipped to the logo disc)
    if (sweep > -1 && sweep < 2 && flip >= 0) {
      g.beginPath(); g.arc(0, 0, d / 2 - 2, 0, 7); g.clip(); g.globalCompositeOperation = 'lighter';
      const sxp = lerp(-d, d, sweep); g.rotate(-.5);
      g.fillStyle = grad(g, sxp - d * .14, 0, sxp + d * .14, 0, [[0, 'rgba(255,240,210,0)'], [.5, 'rgba(255,240,210,.42)'], [1, 'rgba(255,240,210,0)']]); g.fillRect(-d, -d, d * 2, d * 2);
    }
    g.restore();
  }
  return function draw(g, t) {
    if (t < 15) { // S3 reveal 7.85 → 11.65
      bg(g, t, 860);
      const a = P(t, 8.05, 9.45), e = eout5(a);
      const flip = Math.cos(lerp(Math.PI * 5, 0, e));
      const d = lerp(150, 660, eback(a)); const out = eio(P(t, 10.95, 11.6));
      const cy = 880 + Math.sin(t * 1.6) * 6 * P(t, 9.4, 10) - out * 1100;
      logo(g, t, 540, cy, d * (1 - out * .4), flip, P(t, 9.55, 10.45) * 1.0, P(t, 8.6, 9.5));
    } else { // 21.2 → 30
      bg(g, t, t > 24.8 ? 600 : 860);
      if (t > 24.7) {
        const a = P(t, 24.75, 25.75), e = eout5(a);
        const flip = Math.cos(lerp(Math.PI * 6, 0, e));
        const d = lerp(120, 560, eback(a));
        const sw = t > 28.3 ? P(t, 28.3, 29.2) : P(t, 25.9, 26.8);
        logo(g, t, 540, 600 + Math.sin(t * 1.4) * 5 * P(t, 25.7, 26.3), d, flip, sw, P(t, 25.2, 26));
      }
    }
  };
}

// ------------------------------------------------------------------ SCENE 4: product studio
function grainTex(w, h, cols, len, wid, seed) {
  const c = mk(w, h), g = c.getContext('2d'), r = rng(seed);
  g.fillStyle = cols[1]; g.fillRect(0, 0, w, h);
  for (let i = 0; i < w * h / 55; i++) { const x = r() * w, y = r() * h; g.save(); g.translate(x, y); g.rotate(r() * Math.PI);
    g.fillStyle = grad(g, 0, -wid, 0, wid, [[0, cols[0]], [.5, '#ffffff'], [1, cols[2]]]); g.beginPath(); g.ellipse(0, 0, len, wid, 0, 0, 7); g.fill();
    g.strokeStyle = 'rgba(0,0,0,.08)'; g.lineWidth = 1; g.stroke(); g.restore(); }
  return c;
}
export function buildProduct() {
  const r = rng(44);
  const rice = [
    { tex: grainTex(400, 160, ['#e9e4d6', '#f6f2e8', '#d8d1bf'], 9, 2.3, 1), bowl: 'ceramic' },   // long slender white
    { tex: grainTex(400, 160, ['#ece6d8', '#faf6ee', '#dcd5c4'], 6, 3.2, 2), bowl: 'brass' },     // short plump white
    { tex: grainTex(400, 160, ['#d9bf88', '#ecd8a8', '#c7aa70'], 8, 2.6, 3), bowl: 'ceramic' },   // parboiled golden
  ];
  const pour = []; for (let i = 0; i < 260; i++) pour.push({ ts: i / 260 * 2.6, x: (r() - .5) * 26, a: r() * 6, sp: .85 + r() * .3 });
  const sparks = []; for (let i = 0; i < 70; i++) sparks.push({ x: r() * W, y: r() * H, s: 1 + r() * 3, sp: 20 + r() * 50, ph: r() * 6 });
  function bowl(g, cx, cy, w, v, heap) {
    const h = w * .42;
    g.fillStyle = rad(g, cx, cy + h * .95, 0, w * .62, [[0, 'rgba(0,0,0,.5)'], [1, 'rgba(0,0,0,0)']]); g.save(); g.translate(cx, cy + h); g.scale(1, .2); g.beginPath(); g.arc(0, 0, w * .62, 0, 7); g.restore(); g.fill();
    const body = v.bowl === 'brass' ? grad(g, cx - w / 2, 0, cx + w / 2, 0, [[0, '#6e4b15'], [.3, '#f2d27c'], [.45, '#fff1c4'], [.7, '#c8953d'], [1, '#5e3f10']]) : grad(g, cx - w / 2, 0, cx + w / 2, 0, [[0, '#9aa3ad'], [.3, '#ffffff'], [.6, '#eef0f2'], [1, '#8d96a0']]);
    g.fillStyle = body; g.beginPath(); g.moveTo(cx - w / 2, cy); g.bezierCurveTo(cx - w / 2, cy + h * .9, cx - w * .2, cy + h, cx, cy + h); g.bezierCurveTo(cx + w * .2, cy + h, cx + w / 2, cy + h * .9, cx + w / 2, cy); g.fill();
    // rice heap (domed) clipped
    g.save(); g.beginPath(); g.ellipse(cx, cy, w / 2 - 4, w * .1, 0, 0, Math.PI); g.lineTo(cx - w / 2 + 4, cy); g.bezierCurveTo(cx - w * .4, cy - heap * 1.1, cx + w * .4, cy - heap * 1.1, cx + w / 2 - 4, cy); g.closePath(); g.clip();
    g.drawImage(v.tex, cx - w / 2, cy - heap - 10, w, heap + w * .12 + 10);
    g.fillStyle = grad(g, 0, cy - heap, 0, cy + w * .1, [[0, 'rgba(255,255,255,.15)'], [1, 'rgba(0,0,0,.25)']]); g.fillRect(cx - w / 2, cy - heap - 10, w, heap + w * .12 + 10);
    g.restore();
    // rim
    g.strokeStyle = v.bowl === 'brass' ? '#f6dc94' : '#ffffff'; g.lineWidth = 6; g.beginPath(); g.ellipse(cx, cy, w / 2, w * .1, 0, 0, Math.PI); g.stroke();
  }
  return function draw(g, t) {
    // studio backdrop
    g.fillStyle = grad(g, 0, 0, 0, H, [[0, '#0f2b4f'], [.55, '#0a1d36'], [1, '#040b17']]); g.fillRect(0, 0, W, H);
    g.save(); g.globalCompositeOperation = 'lighter';
    g.fillStyle = rad(g, 540, 700, 0, 900, [[0, 'rgba(70,160,190,.22)'], [1, 'rgba(70,160,190,0)']]); g.fillRect(0, 0, W, H);
    // volumetric spotlight cone
    g.fillStyle = grad(g, 0, 0, 0, 1500, [[0, 'rgba(255,235,200,.16)'], [1, 'rgba(255,235,200,0)']]); g.beginPath(); g.moveTo(470, 0); g.lineTo(610, 0); g.lineTo(900, 1500); g.lineTo(180, 1500); g.fill();
    sparks.forEach(p => { const y = ((p.y - p.sp * t) % H + H) % H; g.fillStyle = `rgba(255,215,140,${.5 + .5 * Math.sin(t * 2 + p.ph)})`; g.beginPath(); g.arc(p.x, y, p.s, 0, 7); g.fill(); });
    g.restore();
    const k = eio(P(t, 14.3, 15.2)); // reframe to rice
    // podium
    const px = lerp(540, 330, k), pS = lerp(1, .82, k), py = lerp(1560, 1430, k);
    g.fillStyle = grad(g, 0, py - 40, 0, py + 70, [[0, '#123a68'], [1, '#06152a']]); g.beginPath(); g.ellipse(px, py + 20, 380 * pS, 90 * pS, 0, 0, 7); g.fill();
    g.fillStyle = grad(g, px - 380 * pS, 0, px + 380 * pS, 0, [[0, '#0a2443'], [.5, '#1b4c86'], [1, '#0a2443']]); g.beginPath(); g.ellipse(px, py, 380 * pS, 90 * pS, 0, 0, 7); g.fill();
    g.strokeStyle = '#e2b863'; g.lineWidth = 4; g.beginPath(); g.ellipse(px, py, 380 * pS, 90 * pS, 0, 0, 7); g.stroke();
    // hero LPG cylinder
    const rise = eout5(P(t, 11.2, 12.2));
    const ch = lerp(1000, 860, k), cyb = py + lerp(900, 0, rise) + 20;
    drawCylinder(g, px, cyb, ch, '#1d4f9a', { sweep: P(t, 12.4, 13.6) + P(t, 15.3, 16.4) * 0 , rim: 'rgba(120,220,210,.35)' });
    // rice bowls + pour
    if (t > 14.2) {
      const spots = [[790, 1330, 380], [560, 1650, 330], [905, 1680, 330]];
      spots.forEach((s, i) => { const a = P(t, 14.25 + i * .14, 14.95 + i * .14); const sc = Math.max(.001, eback(a)); g.save(); g.translate(s[0], s[1] + (1 - eout(a)) * 120); g.scale(sc, sc); g.globalAlpha = P(t, 14.25 + i * .14, 14.4 + i * .14); bowl(g, 0, 0, s[2], rice[i], s[2] * (i === 0 ? .12 + .05 * P(t, 14.8, 17.4) : .16)); g.restore(); });
      const pt = t - 14.75;
      if (pt > 0) {
        g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = grad(g, 760, 0, 820, 0, [[0, 'rgba(255,240,210,0)'], [.5, 'rgba(255,240,210,.08)'], [1, 'rgba(255,240,210,0)']]); g.fillRect(760, 0, 60, 1300); g.restore();
        pour.forEach(q => { const lt = pt - q.ts; if (lt < 0 || pt > 2.9) return; const y = -40 + .5 * 2400 * q.sp * lt * lt; if (y > 1290) return;
          g.save(); g.translate(790 + q.x + Math.sin(lt * 9 + q.a) * 3, y); g.rotate(q.a + lt * 7); g.fillStyle = '#f7f2e6'; g.beginPath(); g.ellipse(0, 0, 8, 2.6, 0, 0, 7); g.fill(); g.restore(); });
      }
    }
  };
}

// ------------------------------------------------------------------ SCENE 5: home kitchen
export function buildKitchen() {
  const r = rng(55);
  const L = mk(1200, 2000), g = L.getContext('2d');
  g.fillStyle = '#efe4cf'; g.fillRect(0, 0, 1200, 2000);
  // tiles
  for (let y = 300; y < 1290; y += 110) for (let x = 0; x < 1200; x += 110) { g.fillStyle = grad(g, x, y, x + 110, y + 110, [[0, '#fbfbf8'], [1, '#e6e9e6']]); g.fillRect(x + 3, y + 3, 104, 104); }
  g.fillStyle = 'rgba(160,155,145,.6)'; for (let y = 300; y < 1290; y += 110) g.fillRect(0, y, 1200, 3); for (let x = 0; x < 1200; x += 110) g.fillRect(x, 300, 3, 990);
  // window with grill (daylight)
  g.fillStyle = grad(g, 60, 360, 60, 860, [[0, '#cfe6f5'], [1, '#fff6dc']]); g.fillRect(60, 360, 330, 470); g.strokeStyle = '#2b2b2b'; g.lineWidth = 6; g.strokeRect(60, 360, 330, 470);
  for (let x = 60; x <= 390; x += 41) { g.beginPath(); g.moveTo(x, 360); g.lineTo(x, 830); g.stroke(); } g.beginPath(); g.moveTo(60, 595); g.lineTo(390, 595); g.stroke();
  g.fillStyle = 'rgba(80,140,70,.7)'; for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(90 + i * 55, 800, 40, 0, 7); g.fill(); }
  // shelf with spice jars
  g.fillStyle = '#7a5432'; g.fillRect(520, 640, 620, 20);
  for (let i = 0; i < 6; i++) { const x = 545 + i * 100; g.fillStyle = 'rgba(255,255,255,.85)'; rr(g, x, 520, 70, 120, 10); g.fill(); g.fillStyle = ['#d9a31c', '#b6361f', '#6b3d1d', '#e7d8a8', '#3d6b2a', '#c9581e'][i]; rr(g, x + 6, 560, 58, 74, 8); g.fill(); g.fillStyle = '#c0392b'; rr(g, x - 3, 500, 76, 24, 6); g.fill(); }
  // counter with black granite top
  g.fillStyle = '#d9d1c2'; g.fillRect(0, 1330, 1200, 670);
  g.fillStyle = grad(g, 0, 1290, 0, 1340, [[0, '#2a2b2e'], [1, '#111214']]); g.fillRect(0, 1290, 1200, 50);
  for (let i = 0; i < 1500; i++) { const v = 90 + r() * 110; g.fillStyle = `rgba(${v},${v},${v},${r() * .5})`; g.fillRect(r() * 1200, 1290 + r() * 50, 2, 2); }
  // cabinet doors
  for (let x = 20; x < 1200; x += 290) { g.fillStyle = grad(g, x, 1370, x + 270, 1370, [[0, '#b98a5a'], [1, '#a17447']]); rr(g, x, 1370, 270, 600, 10); g.fill(); g.fillStyle = '#d8c3a0'; g.fillRect(x + 200, 1420, 12, 110); }
  // stove (switched off) + aluminium pot
  g.fillStyle = grad(g, 0, 1215, 0, 1295, [[0, '#2b2b2b'], [1, '#0d0d0d']]); rr(g, 420, 1215, 560, 80, 14); g.fill();
  g.fillStyle = '#9da2a8'; g.fillRect(470, 1262, 26, 18); g.fillRect(900, 1262, 26, 18);
  g.strokeStyle = '#a7abb1'; g.lineWidth = 8; g.beginPath(); g.ellipse(560, 1215, 90, 16, 0, 0, 7); g.stroke();
  g.fillStyle = grad(g, 730, 0, 930, 0, [[0, '#8d9198'], [.35, '#f2f3f5'], [.6, '#c9ccd0'], [1, '#7c8087']]); rr(g, 730, 1040, 200, 180, [8, 8, 30, 30]); g.fill();
  g.fillStyle = '#e6e8eb'; g.beginPath(); g.ellipse(830, 1040, 104, 18, 0, 0, 7); g.fill();
  return function draw(c, t) {
    const u = sine(P(t, 17.15, 21.65)); const sc = lerp(1.0, 1.07, u);
    c.save(); c.translate(540, 1000); c.scale(sc, sc); c.translate(-540, -1000);
    c.drawImage(L, -60, -60);
    // LPG cylinder standing safely beside the counter + regulator hose to stove
    c.strokeStyle = '#e0661f'; c.lineWidth = 9; c.beginPath(); c.moveTo(1000, 1130); c.bezierCurveTo(960, 1180, 920, 1260, 880, 1215); c.stroke();
    drawCylinder(c, 990, 1880, 760, '#1d4f9a', { sweep: P(t, 17.6, 18.8) });
    c.fillStyle = '#222'; rr(c, 965, 1110, 50, 40, 8); c.fill();
    c.restore();
    // window light shaft
    c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = grad(c, 0, 300, 700, 1300, [[0, 'rgba(255,240,200,.25)'], [1, 'rgba(255,240,200,0)']]); c.beginPath(); c.moveTo(0, 300); c.lineTo(330, 300); c.lineTo(1000, 1500); c.lineTo(300, 1700); c.fill(); c.restore();
    c.fillStyle = 'rgba(10,20,40,.18)'; c.fillRect(0, 0, W, H);
  };
}
