// Dubai Gas & Rice — vertical ad timeline (audio-driven). frameSVG(t) → 1080x1920 SVG.
'use strict';
const fs = require('fs'), path = require('path');
const C = require('../production/chars');
const S = require('../production/scenes');
const D = require('./scenes_dg');
const { DG } = D;
const W = 1080, H = 1920, FPS = 30;
const ENV = JSON.parse(fs.readFileSync(path.join(__dirname, 'build/voice_env.json'))).frames;
const DUR = 55.5624;

const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const ease = x => { x = clamp(x); return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; };
const lerp = (a, b, k) => a + (b - a) * k;
const prog = (t, a, b) => ease((t - a) / (b - a));
const spring = x => x <= 0 ? 0 : 1 - Math.exp(-6 * x) * Math.cos(11 * x);
const camLerp = (a, b, k) => ({ x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), z: lerp(a.z, b.z, k) });

// Speaker map (measured from pauses in the supplied voice-over)
const SPK = [[0, 10.41, 'rafi'], [10.41, 21.52, 'nasima'], [21.52, 34.04, 'dadu'], [34.04, 99, 'rafi']];
const speaker = t => (SPK.find(s => t >= s[0] && t < s[1]) || [])[2];
const envAt = t => ENV[clamp(Math.floor(t * FPS), 0, ENV.length - 1)];
const envSmooth = t => { let s = 0; for (let k = -2; k <= 2; k++) s += envAt(t + k / FPS).l; return s / 5; };
function lip(id, t, rest) {
  if (speaker(t) !== id) return rest;
  const e = envAt(t);
  if (e.l < 0.12) return rest === 'grin' ? 'smile' : (rest || 'closed');
  if (e.z > 0.22 || e.c > 2800) return 'ee';
  if (e.l > 0.55) return 'aa';
  return e.c < 1300 ? 'oo' : (e.l > 0.35 ? 'aa' : 'mm');
}
const OFF = { rafi: 0.3, nasima: 1.7, dadu: 2.9 }, PER = { rafi: 3.6, nasima: 4.2, dadu: 4.7 };
function life(id, t, extra = []) {
  const ph = (t + OFF[id]) % PER[id];
  let blink = ph < 0.1; extra.forEach(b => { if (t >= b && t < b + 0.1) blink = true; });
  const talk = speaker(t) === id ? envSmooth(t) : 0;
  return { blink, breath: 0.012 * Math.sin((t + OFF[id]) * 2 * Math.PI / 3.4), tilt: 1.4 * Math.sin(t * 1.1 + OFF[id] * 3) + (talk > 0 ? (talk - 0.3) * 4 : 0) };
}
const place = (x, y, s, svg) => `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${s})">${svg}</g>`;
function frame(cam, env, chars, overlay = '') {
  const { x, y, z } = cam;
  const layer = (p, inner) => `<g transform="translate(${W / 2} ${H / 2}) scale(${1 + (z - 1) * p}) translate(${(-x * p).toFixed(1)} ${(-y * p).toFixed(1)})">${inner}</g>`;
  return layer(0.55, env.back) + layer(1, (chars.behind || '') + env.mid + (chars.front || '')) + layer(1.25, env.front || '') + overlay;
}

const UNI = { polo: DG.navy, collar: DG.gold, badge: 'flame', lanyard: DG.gold };
const raf = (t, o = {}) => { const l = life('rafi', t, o.blinks); return C.rafi({ ...l, ...o, uniform: UNI, tilt: l.tilt + (o.tiltAdd || 0), mouth: lip('rafi', t, o.rest || 'closed') }); };
const nas = (t, o = {}) => { const l = life('nasima', t, o.blinks); return C.nasima({ ...l, ...o, tilt: l.tilt + (o.tiltAdd || 0), mouth: lip('nasima', t, o.rest || 'closed') }); };
const dad = (t, o = {}) => { const l = life('dadu', t, o.blinks); return C.dadu({ ...l, ...o, tilt: l.tilt + (o.tiltAdd || 0), mouth: lip('dadu', t, o.rest || 'closed') }); };

const SHOTS = [];
const shot = (t0, t1, xf, fn) => SHOTS.push({ t0, t1, xf, fn });

// ---------- RAFI OPENING (shop) ----------
const RIN = { x: 0, g: 660, s: 2.0 };     // Rafi inside the shop, in front of the counter
const rIn = (t, o) => place(RIN.x, RIN.g, RIN.s, raf(t, o));
shot(0, 1.8, false, t => {
  const ch = place(150, 480, 1.55, raf(t, { expr: 'happy', armL: 'down', armR: t > 0.5 ? 'wave' : 'hip', waveA: Math.sin(t * 12) * 14, rest: 'grin' }));
  return frame(camLerp({ x: 0, y: -330, z: 1.0 }, { x: 20, y: -280, z: 1.12 }, prog(t, 0, 1.8)), D.shopFront(t), { front: ch });
});
shot(1.8, 6.65, true, t => {
  const armR = t < 3.0 ? 'wave' : (t > 5.6 ? 'thumb' : 'present');
  let ov = '';
  if (t > 5.6 && t < 6.6) for (let i = 0; i < 5; i++) ov += S.sparkle(Math.cos(i * 1.3) * 360, -620 + Math.sin(i * 2.1) * 120, 1.2 * Math.sin((t - 5.6) * Math.PI), DG.gold2, t * 90 + i * 30);
  const ch = rIn(t, { expr: t > 5.5 ? 'happy' : 'normal', armL: 'down', armR, waveA: Math.sin(t * 12) * 14, rest: 'grin' });
  return frame(camLerp({ x: 0, y: -280, z: 1.4 }, { x: 0, y: -295, z: 1.52 }, prog(t, 1.8, 6.65)), D.shopInside(t), { front: ch }, `<g transform="translate(${W / 2} ${H / 2})">${ov}</g>`);
});
shot(6.65, 10.41, false, t => {
  const gas = t > 7.1 && t < 8.3, rice = t > 7.7 && t < 8.5;
  const ch = rIn(t, { expr: 'happy', look: gas && !rice ? [-5, 1] : (rice ? [5, 1] : [0, 0]), armL: gas ? 'reach' : 'down', reachL: [-150, -262], armR: rice ? 'present' : (t > 8.5 ? 'thumb' : 'hip'), rest: 'grin' });
  return frame(camLerp({ x: -60, y: -220, z: 1.0 }, { x: -40, y: -230, z: 1.06 }, prog(t, 6.65, 10.41)), D.shopInside(t, { shine: 7.15 }), { front: ch });
});

// ---------- NEIGHBOURHOOD: Nasima & Dadu ----------
const NX = -250, DX = 250, LG = 720, LS = 2.0;
function pair(t, no, do_) { return place(NX, LG, LS, nas(t, no)) + place(DX, LG, LS, dad(t, do_)); }
function priceBubble(t, t0, t1) {
  if (t < t0 || t > t1) return '';
  const k = spring((t - t0) / 0.5) * (t > t1 - 0.25 ? (t1 - t) / 0.25 : 1);
  const q = Math.sin(t * 6) * 6;
  let g = `<circle cx="-150" cy="150" r="14" fill="#fff" stroke="#1B1A22" stroke-width="5"/><circle cx="-110" cy="100" r="22" fill="#fff" stroke="#1B1A22" stroke-width="5"/>` +
    `<ellipse cx="0" cy="-40" rx="190" ry="140" fill="#fff" stroke="#1B1A22" stroke-width="6"/>` + D.lpg(-50, 50, 0.42, '#B94A3A');
  g += `<g transform="translate(70 ${-90 + q})"><rect x="-56" y="-34" width="112" height="68" rx="12" fill="${DG.gold2}" stroke="#1B1A22" stroke-width="5"/><text x="0" y="18" font-size="50" fill="#1B1A22" text-anchor="middle">৳ ?</text></g>`;
  g += `<text x="120" y="20" font-size="70" fill="${C.BRAND ? '#B3202A' : '#B3202A'}" text-anchor="middle">?</text>`;
  return `<g transform="translate(-250 -430) scale(${k})">${g}</g>`;
}
shot(10.41, 12.3, true, t => frame(camLerp({ x: 0, y: -120, z: 1.22 }, { x: 0, y: -130, z: 1.3 }, prog(t, 10.41, 12.3)), D.lane(t),
  { front: pair(t, { expr: 'annoyed', look: [5, 0], armL: 'hip', armR: t > 11.3 ? 'gesture' : 'down', gA: Math.sin(t * 7) * 6, rest: 'frown' }, { expr: 'normal', look: [-5, 0], armL: 'behind', armR: 'behind', rest: 'closed', blinks: [10.7] }) }));
shot(12.3, 15.4, false, t => frame(camLerp({ x: -250, y: -120, z: 1.65 }, { x: -250, y: -130, z: 1.75 }, prog(t, 12.3, 15.4)), D.lane(t),
  { front: pair(t, { expr: 'annoyed', look: [4, 0], armL: 'hip', armR: t > 13.0 && t < 14.8 ? 'gesture' : 'down', gA: Math.sin(t * 6) * 8, rest: 'frown' }, { expr: 'thinking', look: [-5, 0], armL: 'behind', armR: 'behind' }) }));
shot(15.4, 18.48, false, t => frame(camLerp({ x: -110, y: -120, z: 1.42 }, { x: -100, y: -125, z: 1.48 }, prog(t, 15.4, 18.48)), D.lane(t),
  { front: pair(t, { expr: 'sad', look: [5, 0], armL: 'hip', armR: 'gesture', gA: Math.sin(t * 5) * 6, rest: 'frown' }, { expr: 'thinking', look: [-5, 0], armL: 'behind', armR: 'behind', tiltAdd: Math.sin(t * 5) * 2.5 }) }));
shot(18.48, 21.52, false, t => {
  const ch = place(NX, LG, LS, nas(t, { expr: t > 20.0 ? 'thinking' : 'sad', look: t > 18.8 && t < 19.9 ? [4, -4] : [0, 0], armL: 'hip', armR: 'down', rest: 'frown' }));
  return frame(camLerp({ x: -240, y: -170, z: 1.9 }, { x: -240, y: -180, z: 2.0 }, prog(t, 18.48, 21.52)), D.lane(t), { front: ch + priceBubble(t, 18.7, 21.4) });
});
shot(21.52, 25.0, false, t => frame(camLerp({ x: 250, y: -120, z: 1.65 }, { x: 250, y: -130, z: 1.75 }, prog(t, 21.52, 25.0)), D.lane(t),
  { front: pair(t, { expr: 'thinking', look: [5, 0], armL: 'hip', armR: 'down' }, { expr: t < 21.65 ? 'thinking' : 'normal', look: [-5, 0], armL: 'behind', armR: t > 22.6 && t < 24.6 ? 'raise' : 'behind', gA: Math.sin(t * 5) * 6, rest: 'closed', blinks: [21.55] }) }));
shot(25.0, 29.8, false, t => frame(camLerp({ x: 0, y: -120, z: 1.25 }, { x: 0, y: -130, z: 1.32 }, prog(t, 25.0, 29.8)), D.lane(t),
  { front: pair(t, { expr: 'sad', look: [5, 0], armL: 'hip', armR: 'down', tiltAdd: Math.sin(t * 4) * 2 }, { expr: t > 28.4 ? 'sad' : 'normal', look: [-5, 0], armL: 'behind', armR: t > 26.9 && t < 28.3 ? 'raise' : (t > 28.4 ? 'down' : 'behind'), gA: Math.sin(t * 6) * 8, rest: 'flat' }) }));
shot(29.8, 34.04, false, t => frame(camLerp({ x: 240, y: -110, z: 2.0 }, { x: 240, y: -120, z: 2.15 }, prog(t, 29.8, 34.04)), D.lane(t),
  { front: place(DX, LG, LS, dad(t, { expr: t > 33.1 ? 'surprised' : 'normal', look: [-3, 0], armL: 'behind', armR: t > 33.15 ? 'point' : 'behind', rest: 'closed' })) }));

// ---------- RAFI: promo (shop) ----------
function logoCard(cx, cy, size, k) {
  if (k <= 0) return '';
  return `<g transform="translate(${cx} ${cy}) scale(${spring(k)})"><rect x="${-size / 2 - 8}" y="${-size / 2 - 8}" width="${size + 16}" height="${size + 16}" rx="${size * 0.12}" fill="${DG.gold}"/>` +
    `<image href="/dubai_logo.jpg" x="${-size / 2}" y="${-size / 2}" width="${size}" height="${size}"/></g>`;
}
shot(34.04, 35.87, true, t => frame(camLerp({ x: 0, y: -290, z: 1.5 }, { x: 0, y: -295, z: 1.56 }, prog(t, 34.04, 35.87)), D.shopInside(t),
  { front: rIn(t, { expr: 'happy', armL: 'down', armR: t > 34.2 ? 'thumb' : 'hip', rest: 'grin' }) }));
shot(35.87, 38.55, false, t => {
  const ov = logoCard(0, -560, 420, (t - 35.95) / 0.6);
  return frame(camLerp({ x: 0, y: -250, z: 1.3 }, { x: 0, y: -260, z: 1.36 }, prog(t, 35.87, 38.55)), D.shopInside(t),
    { front: rIn(t, { expr: 'happy', armL: 'down', armR: t < 37.0 ? 'wave' : 'present', waveA: Math.sin(t * 12) * 14, rest: 'grin' }) }, `<g transform="translate(${W / 2} ${H / 2})">${ov}</g>`);
});
// product insert: the cylinder display (≤1.5 s)
shot(38.55, 40.0, false, t => frame(camLerp({ x: -540, y: -60, z: 1.55 }, { x: -470, y: -60, z: 1.62 }, prog(t, 38.55, 40.0)), D.shopInside(t, { shine: 38.65 }), {}));
shot(40.0, 42.3, false, t => frame(camLerp({ x: -300, y: -200, z: 1.15 }, { x: -290, y: -210, z: 1.2 }, prog(t, 40.0, 42.3)), D.shopInside(t),
  { front: rIn(t, { expr: 'happy', look: t < 41.2 ? [-5, 1] : [0, 0], armL: t < 41.4 ? 'reach' : 'down', reachL: [-150, -262], armR: 'hip', rest: 'grin' }) }));
shot(42.3, 44.2, false, t => frame(camLerp({ x: 0, y: -290, z: 1.5 }, { x: 0, y: -300, z: 1.58 }, prog(t, 42.3, 44.2)), D.shopInside(t),
  { front: rIn(t, { expr: 'happy', look: [3, 0], armL: 'down', armR: 'present', rest: 'grin' }) }));
// rice display (≤1.5 s)
shot(44.2, 45.7, false, t => frame(camLerp({ x: 640, y: -40, z: 1.45 }, { x: 720, y: -40, z: 1.5 }, prog(t, 44.2, 45.7)), D.shopInside(t), {}));
shot(45.7, 47.1, false, t => frame(camLerp({ x: 160, y: -250, z: 1.3 }, { x: 170, y: -255, z: 1.34 }, prog(t, 45.7, 47.1)), D.shopInside(t),
  { front: rIn(t, { expr: 'happy', look: [5, 0], armL: 'down', armR: 'present', rest: 'grin' }) }));

// ---------- CTA ----------
function pill(x, y, w, h, fill, stroke, inner, k) {
  if (k <= 0) return '';
  return `<g transform="translate(${x} ${y}) scale(${spring(k)})"><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="${h / 2}" fill="${fill}" stroke="${stroke}" stroke-width="6"/>${inner}</g>`;
}
const fbPill = (x, y, k) => pill(x, y, 720, 110, '#FFFFFF', DG.gold, `<g transform="translate(-290 0)"><circle r="32" fill="#1877F2"/><text x="3" y="20" font-size="52" fill="#fff" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700">f</text></g><text x="30" y="19" font-size="52" fill="${DG.navy}" text-anchor="middle">Dubai Gas &amp; Rice</text>`, k);
const waPill = (x, y, k) => pill(x, y, 720, 110, '#25D366', '#FFFFFF', `<g transform="translate(-290 0)"><circle r="32" fill="#fff"/><path d="M-14 -12 Q-16 2 -4 12 Q8 20 14 14 L10 6 L4 8 Q-4 4 -6 -4 L-4 -10 Z" fill="#25D366"/></g><text x="30" y="19" font-size="52" fill="#FFFFFF" text-anchor="middle">${WHATSAPP_TEXT}</text>`, k);
const WHATSAPP_TEXT = process.env.DG_WHATSAPP || 'WhatsApp';
shot(47.1, 51.62, true, t => {
  let ov = fbPill(0, -700, (t - 49.0) / 0.5) + waPill(0, -560, (t - 50.4) / 0.5);
  return frame(camLerp({ x: -330, y: -260, z: 1.35 }, { x: -330, y: -270, z: 1.42 }, prog(t, 47.1, 51.62)), D.shopInside(t),
    { front: place(-330, 660, 2.0, raf(t, { expr: 'happy', armL: 'down', armR: t > 48.9 ? 'present' : 'thumb', look: t > 49.0 ? [3, -4] : [0, 0], rest: 'grin' })) }, `<g transform="translate(${W / 2} ${H / 2})">${ov}</g>`);
});
shot(51.62, DUR + 0.1, true, t => {
  const env = D.shopInside(t);
  let ov = `<rect x="-600" y="-1000" width="1200" height="2000" fill="${DG.navy2}" opacity="0.86"/>`;
  ov += logoCard(0, -560, 520, (t - 51.7) / 0.6);
  const k = clamp((t - 53.56) / 0.4);
  ov += `<g opacity="${k}"><text x="0" y="-210" font-size="62" fill="${DG.gold2}" text-anchor="middle">আপনাদের এলাকার আপন ঠিকানা!</text></g>`;
  ov += fbPill(0, -70, 1.2) + waPill(0, 70, 1.2);
  const ch = place(0, 1640, 2.4, raf(t, { expr: 'happy', armL: 'down', armR: 'wave', waveA: Math.sin(t * 10) * 12, rest: 'grin' }));
  return frame({ x: -200, y: -200, z: 1.2 }, env, {}) + `<g transform="translate(${W / 2} ${H / 2})">${ov}${ch}</g>`;
});

const XF = 0.3;
function frameSVG(t) {
  const i = SHOTS.findIndex(s => t >= s.t0 && t < s.t1);
  const cur = SHOTS[i < 0 ? SHOTS.length - 1 : i];
  let body = cur.fn(t);
  if (cur.xf && i > 0 && t < cur.t0 + XF) body = SHOTS[i - 1].fn(t) + `<g opacity="${((t - cur.t0) / XF).toFixed(3)}">${body}</g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="${W}" height="${H}" fill="#000"/>${body}</svg>`;
}
module.exports = { frameSVG, SHOTS, DUR, FPS, W, H };
