// FIXIBLE IT vertical ad — audio-driven timeline. frameSVG(t) returns a full 1080x1920 SVG for time t.
'use strict';
const fs = require('fs'), path = require('path');
const C = require('./chars');
const S = require('./scenes');
const { BRAND } = C;
const W = 1080, H = 1920, FPS = 30;
const ENV = JSON.parse(fs.readFileSync(path.join(__dirname, 'build/voice_env.json'))).frames;
const DUR = 46.367;

const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const ease = x => { x = clamp(x); return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; };
const lerp = (a, b, k) => a + (b - a) * k;
const prog = (t, a, b) => ease((t - a) / (b - a));
const spring = x => x <= 0 ? 0 : 1 - Math.exp(-6 * x) * Math.cos(11 * x);

// ---- who speaks when (measured from silence gaps in the supplied voice-over) ----
const SPK = [[0, 5.79, 'nasima'], [5.79, 18.2, 'dadu'], [18.2, 29.64, 'rafi'], [29.64, 32.94, 'nasima'], [32.94, 40.12, 'dadu'], [40.12, 99, 'rafi']];
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
const OFF = { rafi: 0.3, nasima: 1.7, dadu: 2.9, girl: 0.9 };
const PER = { rafi: 3.6, nasima: 4.2, dadu: 4.7, girl: 3.3 };
function life(id, t, extraBlinks = []) {
  const ph = (t + OFF[id]) % PER[id];
  let blink = ph < 0.1;
  extraBlinks.forEach(b => { if (t >= b && t < b + 0.1) blink = true; });
  const talk = speaker(t) === id ? envSmooth(t) : 0;
  return {
    blink,
    breath: 0.012 * Math.sin((t + OFF[id]) * 2 * Math.PI / 3.4),
    tilt: 1.4 * Math.sin(t * 1.1 + OFF[id] * 3) + (talk - 0.3) * 4 * (talk > 0 ? 1 : 0),
  };
}
const place = (x, y, s, svg) => `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${s})">${svg}</g>`;

// ---- camera + layers ----
function frame(cam, env, chars, overlay = '') {
  const { x, y, z } = cam;
  const layer = (p, inner) => `<g transform="translate(${W / 2} ${H / 2}) scale(${1 + (z - 1) * p}) translate(${(-x * p).toFixed(1)} ${(-y * p).toFixed(1)})">${inner}</g>`;
  return layer(0.55, env.back) + layer(1, (env.preMid || '') + chars.behind + env.mid + (chars.front || '')) + layer(1.25, env.front || '') + overlay;
}
const camLerp = (a, b, k) => ({ x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), z: lerp(a.z, b.z, k) });

// ---- placements ----
const CS = 1.95;                      // adult scale
const SHOP_G = 330, HOME_G = 560;     // ground lines
const NAS_X = -200;

function nas(t, o = {}) { const l = life('nasima', t, o.blinks); return C.nasima({ ...l, ...o, mouth: lip('nasima', t, o.rest || 'closed') }); }
function dad(t, o = {}) { const l = life('dadu', t, o.blinks); return C.dadu({ ...l, ...o, tilt: l.tilt + (o.tiltAdd || 0), mouth: lip('dadu', t, o.rest || 'closed') }); }
function raf(t, o = {}) { const l = life('rafi', t, o.blinks); return C.rafi({ ...l, ...o, tilt: l.tilt + (o.tiltAdd || 0), mouth: lip('rafi', t, o.rest || 'closed') }); }
function gir(t, o = {}) { const l = life('girl', t); return C.girl({ ...l, ...o }); }
const GIRL = (t, o) => place(110, 300, CS, gir(t, o));

// ================= SHOTS =================
const SHOTS = [];
const shot = (t0, t1, xf, fn) => SHOTS.push({ t0, t1, xf, fn });

// S1a — night exterior establishing ("ধুর!")
shot(0, 1.0, false, t => frame(camLerp({ x: 0, y: -150, z: 1.0 }, { x: 0, y: -230, z: 1.14 }, prog(t, 0, 1.0)), S.shopExterior(t), { behind: '' }));
// S1b — inside: dead CCTV monitor, Nasima frustrated
shot(1.0, 3.0, true, t => {
  const look = t < 1.6 ? [5, 1] : (t < 2.3 ? [0, 0] : [5, 1]);
  const gest = t > 1.9 && t < 2.9;
  const ch = place(NAS_X, SHOP_G, CS, nas(t, { expr: 'annoyed', look, armL: 'counter', armR: gest ? 'gesture' : 'counter', gA: Math.sin(t * 9) * 6, rest: 'frown' }));
  return frame(camLerp({ x: 80, y: -330, z: 1.25 }, { x: 85, y: -340, z: 1.32 }, prog(t, 1.0, 3.0)), S.shopInterior(t, { cctv: 'off' }), { behind: ch });
});
// S1c — close-up: sigh, "এখন কে বলবে কী হইছে?"
shot(3.0, 5.79, false, t => {
  const sigh = t >= 3.0 && t < 3.95;
  const br = sigh ? -0.03 * Math.sin((t - 3.0) / 0.95 * Math.PI) : 0;
  const ch = place(NAS_X, SHOP_G, CS, nas(t, { expr: sigh ? 'sad' : 'annoyed', look: t > 4.6 && t < 5.1 ? [5, 0] : [0, 0], armL: 'counter', armR: 'counter', rest: 'frown', breath: br, blinks: [3.95] }));
  return frame(camLerp({ x: -195, y: -420, z: 2.05 }, { x: -198, y: -430, z: 2.25 }, prog(t, 3.0, 5.79)), S.shopInterior(t, { cctv: 'off' }), { behind: ch });
});
// S2a — Dadu medium: "আর আমার জ্বালা শোনেন!"
shot(5.79, 7.6, true, t => {
  const ch = GIRL(t, { expr: 'sad', look: [5, 1] }) + place(-300, HOME_G, CS, dad(t, { expr: 'annoyed', armL: 'behind', armR: t > 6.4 ? 'raise' : 'behind', gA: Math.sin(t * 8) * 6, rest: 'frown' }));
  return frame(camLerp({ x: -200, y: -260, z: 1.7 }, { x: -195, y: -270, z: 1.8 }, prog(t, 5.79, 7.6)), S.homeLiving(t, { router: 'bad', class: 'frozen' }), { behind: ch });
});
// S2b — wide: the online class is frozen ("মেয়ের অনলাইন ক্লাস চলে")
shot(7.6, 9.6, false, t => {
  const ch = GIRL(t, { expr: 'sad', look: [5, 1] }) + place(-300, HOME_G, CS, dad(t, { expr: 'annoyed', look: [5, 1], armL: 'behind', armR: t > 8.2 ? 'point' : 'behind', rest: 'frown' }));
  return frame(camLerp({ x: 40, y: -170, z: 1.12 }, { x: 50, y: -180, z: 1.18 }, prog(t, 7.6, 9.6)), S.homeLiving(t, { router: 'bad', class: 'frozen' }), { behind: ch });
});
// S2c — insert: weak router + buffering laptop ("বাসার ওয়াইফাই খালি ঘোরে") ≤1.5s
shot(9.6, 11.05, false, t => {
  const ch = GIRL(t, { expr: 'sad', look: [5, 1] });
  return frame(camLerp({ x: 330, y: -150, z: 2.1 }, { x: 335, y: -155, z: 2.25 }, prog(t, 9.6, 11.05)), S.homeLiving(t, { router: 'bad', class: 'frozen' }), { behind: ch });
});
// S2d — close on Dadu: "স্যারের কথা আসে অর্ধেক!"
shot(11.05, 13.23, false, t => {
  const shake = t > 12.3 && t < 13.0 ? Math.sin((t - 12.3) * 22) * 4 : 0;
  const ch = place(-300, HOME_G, CS, dad(t, { expr: 'annoyed', armL: 'behind', armR: 'behind', tiltAdd: shake, rest: 'frown' }));
  return frame(camLerp({ x: -300, y: -190, z: 2.3 }, { x: -300, y: -200, z: 2.45 }, prog(t, 11.05, 13.23)), S.homeLiving(t, { router: 'bad', class: 'frozen' }), { behind: ch });
});
// S3a — insert: old PC crawling boot (≤1.5s)
shot(13.23, 14.6, true, t => frame(camLerp({ x: 120, y: -20, z: 2.3 }, { x: 120, y: -25, z: 2.42 }, prog(t, 13.23, 14.6)), S.homePC(t, { screen: 'boot', progress: 0.05 + (t - 13.23) * 0.01 }), { behind: '' }));
// S3b — Dadu at the slow PC, tapping; clock spins morning→noon on "চালু হয় দুপুরে"
shot(14.6, 18.2, false, t => {
  const chuck = t > 16.15 && t < 16.95;
  const tap = t < 16.1 ? Math.abs(Math.sin(t * 9)) * -10 : 0;
  const spin = prog(t, 16.95, 18.0) * 3;
  const lookUp = t > 17.0 && t < 17.9;
  const ch = place(-270, HOME_G, CS, dad(t, { expr: chuck ? 'happy' : (lookUp ? 'surprised' : 'thinking'), look: lookUp ? [4, -4] : [5, 2], armL: 'behind', armR: t < 16.1 ? 'tap' : 'behind', tapY: tap, rest: chuck ? 'grin' : 'flat' }));
  return frame(camLerp({ x: -70, y: -280, z: 1.58 }, { x: -68, y: -290, z: 1.66 }, prog(t, 14.6, 18.2)), S.homePC(t, { screen: 'boot', progress: 0.07 + (t - 14.6) * 0.008, clockSpin: spin }), { behind: ch });
});
// S4 — Rafi arrives on brand teal: wave, then 3 problems → the FIXIBLE IT logo
function logoCard(cx, cy, size, k) {
  const s = spring(k);
  if (k <= 0) return '';
  return `<g transform="translate(${cx} ${cy}) scale(${s})"><rect x="${-size / 2}" y="${-size / 2}" width="${size}" height="${size}" rx="${size * 0.14}" fill="#FFFFFF" stroke="${BRAND.navy}" stroke-width="8"/>` +
    `<image href="/logo.png" x="${-size * 0.42}" y="${-size * 0.42}" width="${size * 0.84}" height="${size * 0.84}"/></g>`;
}
function probIcon(kind, x, y, k) {
  if (k <= 0) return '';
  const s = spring(k);
  let ic = '';
  if (kind === 0) ic = `<path d="M-30 -14 L18 -14 Q28 -14 28 -4 L28 4 Q28 14 18 14 L-30 14 Z" fill="#fff"/><circle cx="28" cy="0" r="9" fill="${BRAND.navy}"/>`;
  if (kind === 1) ic = `<path d="M-26 0 Q0 -26 26 0" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round"/><path d="M-14 12 Q0 -2 14 12" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round"/><circle cx="0" cy="22" r="5" fill="#fff"/>`;
  if (kind === 2) ic = `<rect x="-28" y="-22" width="56" height="38" rx="4" fill="#fff"/><rect x="-10" y="16" width="20" height="10" fill="#fff"/>`;
  return `<g transform="translate(${x} ${y}) scale(${s})"><circle r="62" fill="#C0392B" stroke="${BRAND.navy}" stroke-width="7"/>${ic}<path d="M30 -52 l24 24 M54 -52 l-24 24" stroke="#fff" stroke-width="8" stroke-linecap="round"/></g>`;
}
shot(18.2, 22.2, true, t => {
  const walk = prog(t, 18.2, 18.8);
  const rx = lerp(760, 60, walk);
  const step = walk < 1 ? t * 14 : 0;
  const armR = t < 18.75 ? 'hip' : (t < 19.75 ? 'wave' : 'present');
  const ch = place(rx, 980, 2.6, raf(t, { expr: 'happy', step, armL: 'toolbox', armR, waveA: Math.sin(t * 12) * 14, rest: 'grin' }));
  let ov = '';
  // three problems pop on "ঝামেলা তিনটা", collapse into the logo on "সমাধান একটাই"
  const merge = prog(t, 20.95, 21.25);
  [[-290, -560], [0, -640], [290, -560]].forEach(([x, y], i) => {
    if (t < 21.25) ov += probIcon(i, lerp(x, 0, merge), lerp(y, -620, merge), (t - (19.95 + i * 0.22)) / 0.5 * (1 - merge * 0.999));
  });
  ov += logoCard(0, -640, 400, (t - 21.1) / 0.6);
  if (t > 21.35) {
    const k = clamp((t - 21.35) / 0.35);
    ov += `<g opacity="${k}" transform="translate(0 ${(1 - k) * 30})"><text x="0" y="-330" font-size="104" fill="#FFFFFF" text-anchor="middle" letter-spacing="4">FIXIBLE IT</text><text x="0" y="-262" font-size="38" fill="${BRAND.navy}" text-anchor="middle" letter-spacing="6">YOUR TECHNOLOGY PARTNER</text></g>`;
    [[-250, -800], [250, -790], [-270, -520], [270, -540], [0, -880]].forEach(([sx, sy], i) => { ov += S.sparkle(sx, sy, 0.9 * Math.abs(Math.sin(t * 3 + i)), '#FFFFFF', t * 60 + i * 40); });
  }
  return frame({ x: 0, y: 0, z: lerp(1.04, 1.0, prog(t, 18.2, 22.2)) }, { back: S.brandBG(t, 18.2), mid: '' }, { behind: ch, front: ov });
});
// S5a — CCTV repair at the shop ("দোকানের সিসিটিভি")
shot(22.2, 24.7, true, t => {
  const st = t < 23.6 ? 'off' : (t < 23.85 ? 'glitch' : 'live');
  const fixed = t > 23.95;
  const ch = place(NAS_X, SHOP_G, CS, nas(t, { expr: fixed ? 'surprised' : 'thinking', look: [5, 1], armL: 'counter', armR: 'counter', rest: fixed ? 'o' : 'flat' })) +
    place(110, SHOP_G, CS, raf(t, { expr: 'normal', look: t < 23.5 ? [0, 4] : [5, 1], armL: 'down', armR: 'tool', reachR: [24 + Math.sin(t * 10) * 3, -196], rest: 'smile' }));
  return frame(camLerp({ x: 50, y: -290, z: 1.2 }, { x: 55, y: -300, z: 1.26 }, prog(t, 22.2, 24.7)), S.shopInterior(t, { cctv: st, sparkAt: 23.45 }), { behind: ch });
});
// S5b — Wi-Fi router fix at home ("বাসার ওয়াইফাই")
shot(24.7, 25.95, true, t => {
  const ok = t > 25.2;
  const ch = GIRL(t, { expr: ok ? 'happy' : 'sad', look: [5, 1] }) + place(540, HOME_G, CS, raf(t, { expr: 'normal', look: [-4, -4], armL: 'reach', reachL: [-92, -440], armR: 'hip', rest: 'smile' }));
  let ov = '';
  if (t > 25.2 && t < 25.8) ov = S.sparkle(360, -500, 1.4 * Math.sin((t - 25.2) / 0.6 * Math.PI), BRAND.hi, t * 300);
  return frame(camLerp({ x: 300, y: -200, z: 1.45 }, { x: 305, y: -205, z: 1.52 }, prog(t, 24.7, 25.95)), S.homeLiving(t, { router: ok ? 'ok' : 'bad', class: t > 25.4 ? 'clear' : 'frozen' }), { behind: ch, front: ov });
});
// S5c — old PC fix ("পুরান কম্পিউটার")
shot(25.95, 27.0, true, t => {
  const done = t > 26.4;
  const key = Math.floor(t * 12) % 20;
  const ch = place(-170, HOME_G, CS, raf(t, { expr: done ? 'happy' : 'normal', look: [5, 2], armL: 'down', armR: 'reach', reachR: [140, -196 + Math.abs(Math.sin(t * 14)) * -6], rest: 'smile' }));
  return frame(camLerp({ x: -20, y: -190, z: 1.42 }, { x: -18, y: -195, z: 1.5 }, prog(t, 25.95, 27.0)), S.homePC(t, { screen: done ? 'desktop' : 'boot', progress: lerp(0.1, 1, prog(t, 25.95, 26.4)), key: done ? -1 : key }), { behind: ch });
});
// S5d — "সব ঠিক করি গুছিয়ে, বুঝিয়ে দিয়ে" — Rafi explains, Dadu nods, everything working
shot(27.0, 29.64, true, t => {
  const nod = Math.sin(t * 6) * 3;
  const behind = GIRL(t, { expr: 'happy', look: [5, 1] }) + place(-300, HOME_G, CS, dad(t, { expr: 'happy', look: [5, 0], armL: 'behind', armR: 'behind', tiltAdd: nod, rest: 'smile' }));
  const front = place(200, 760, 2.05, raf(t, { expr: 'happy', look: [-5, 0], armL: 'down', armR: t > 27.6 ? 'present' : 'hip', rest: 'grin' }));
  return frame(camLerp({ x: -40, y: -170, z: 1.32 }, { x: -45, y: -175, z: 1.24 }, prog(t, 27.0, 29.64)), S.homeLiving(t, { router: 'ok', class: 'clear' }), { behind, front });
});
// S6 — Nasima: "আরে বাহ! (হাসি) এখন তো মোবাইলেই দোকান দেখি!"
function phoneLive(t) {
  return `<rect width="100" height="180" fill="#0C0E14"/><rect width="100" height="18" fill="${BRAND.teal}"/><text x="50" y="13" font-size="9" fill="#fff" text-anchor="middle">CCTV</text>` +
    `<svg x="4" y="24" width="92" height="66" viewBox="0 0 160 100" preserveAspectRatio="none">${S.paneStreet(t)}</svg>` +
    `<svg x="4" y="96" width="92" height="66" viewBox="0 0 160 100" preserveAspectRatio="none">${S.paneShelf()}</svg>` +
    (Math.floor(t * 2) % 2 ? `<circle cx="12" cy="31" r="3.5" fill="#E0444E"/>` : '');
}
shot(29.64, 32.94, true, t => {
  const surprised = t < 30.4;
  const up = prog(t, 30.6, 31.0);
  const armR = t > 30.6 ? 'phone' : 'counter';
  const ch = place(NAS_X, SHOP_G, CS, nas(t, { expr: surprised ? 'surprised' : 'happy', look: t > 31.0 && t < 31.9 ? [5, -2] : [0, 0], armL: 'counter', armR, phoneY: lerp(-200, -330, up), phoneScreen: phoneLive(t), rest: surprised ? 'o' : 'grin', blinks: [30.4] }));
  return frame(camLerp({ x: -150, y: -400, z: 1.75 }, { x: -146, y: -410, z: 1.85 }, prog(t, 29.64, 32.94)), S.shopInterior(t, { cctv: 'live' }), { behind: ch });
});
// S7 — Dadu relieved: "যাক বাবা! এখন মেয়ের ক্লাস একদম পরিষ্কার।" (gentle pull-out)
shot(32.94, 36.73, true, t => {
  const relief = t < 33.6;
  const br = relief ? 0.03 * Math.sin((t - 32.94) / 0.66 * Math.PI) : 0;
  const ch = GIRL(t, { expr: 'happy', look: [5, 1], typeY: Math.sin(t * 16) * 2 }) + place(-300, HOME_G, CS, dad(t, { expr: relief ? 'sad' : 'happy', look: t > 34.3 && t < 35.4 ? [5, 1] : [0, 0], armL: 'behind', armR: t > 35.2 ? 'thumb' : 'behind', breath: br, rest: 'smile' }));
  let ov = '';
  for (let i = 0; i < 7; i++) { const yy = -600 + ((t * 40 + i * 140) % 900); ov += `<circle cx="${-400 + i * 140}" cy="${yy}" r="5" fill="#FFF3C4" opacity="0.6"/>`; }
  return frame(camLerp({ x: -60, y: -190, z: 1.4 }, { x: -55, y: -180, z: 1.26 }, prog(t, 32.94, 36.73)), S.homeLiving(t, { router: 'ok', class: 'clear' }), { behind: ch, front: ov });
});
// S8 — PC works: "সাবাশ দাদুভাই! এ তো চোখের পলকে চালু!"
shot(36.73, 40.12, true, t => {
  const ch = place(-250, HOME_G, CS, dad(t, { expr: 'happy', look: t < 38.2 ? [5, 0] : [0, 0], armL: 'behind', armR: t > 36.9 && t < 38.3 ? 'raise' : 'point', gA: Math.sin(t * 7) * 8, rest: 'grin' })) +
    place(420, HOME_G, CS, raf(t, { expr: 'happy', look: [-5, 0], armL: 'down', armR: t > 38.3 ? 'thumb' : 'hip', rest: 'grin' }));
  return frame(camLerp({ x: 80, y: -230, z: 1.15 }, { x: 82, y: -240, z: 1.22 }, prog(t, 36.73, 40.12)), S.homePC(t, { screen: 'desktop', progress: 1 }), { behind: ch });
});
// S9 — CTA (FixibleIT.com / Facebook) + slogan
function pill(x, y, w, h, fill, stroke, inner, k) {
  if (k <= 0) return '';
  const s = spring(k);
  return `<g transform="translate(${x} ${y}) scale(${s})"><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="${h / 2}" fill="${fill}" stroke="${stroke}" stroke-width="6"/>${inner}</g>`;
}
shot(40.12, DUR + 0.1, true, t => {
  let ov = '';
  ov += logoCard(0, -650, 340, (t - 40.2) / 0.6);
  const k1 = clamp((t - 40.5) / 0.4);
  ov += `<g opacity="${k1}"><text x="0" y="-375" font-size="96" fill="#FFFFFF" text-anchor="middle" letter-spacing="4">FIXIBLE IT</text><text x="0" y="-312" font-size="34" fill="${BRAND.hi}" text-anchor="middle" letter-spacing="6">YOUR TECHNOLOGY PARTNER</text></g>`;
  const k2 = clamp((t - 44.45) / 0.4);
  ov += `<g opacity="${k2}"><text x="0" y="-205" font-size="44" fill="#FFFFFF" text-anchor="middle">আপনার প্রতিদিনের প্রযুক্তিগত ঝামেলায়,</text><text x="0" y="-145" font-size="44" fill="${BRAND.hi}" text-anchor="middle">পাশে আছে FIXIBLE IT</text></g>`;
  ov += pill(0, -20, 700, 112, BRAND.teal, '#FFFFFF',
    `<g transform="translate(-270 0)"><circle r="30" fill="none" stroke="#fff" stroke-width="6"/><ellipse rx="13" ry="30" fill="none" stroke="#fff" stroke-width="5"/><path d="M-30 0 L30 0" stroke="#fff" stroke-width="5"/></g><text x="30" y="20" font-size="58" fill="#FFFFFF" text-anchor="middle">FixibleIT.com</text>`, (t - 42.46) / 0.5);
  ov += pill(0, 120, 700, 112, '#FFFFFF', BRAND.teal,
    `<g transform="translate(-270 0)"><circle r="32" fill="#1877F2"/><text x="3" y="20" font-size="52" fill="#fff" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700">f</text></g><text x="30" y="20" font-size="58" fill="${BRAND.navy}" text-anchor="middle">Fixible IT</text>`, (t - 43.6) / 0.5);
  const armR = t < 41.6 ? 'wave' : 'present';
  const ch = place(-230, 1500, 2.7, raf(t, { expr: 'happy', look: t > 42.3 ? [4, -3] : [0, 0], armL: 'down', armR, waveA: Math.sin(t * 12) * 14, rest: 'grin' }));
  return frame({ x: 0, y: 0, z: 1 }, { back: S.ctaBG(t), mid: '' }, { behind: ch, front: '' }) + `<g transform="translate(${W / 2} ${H / 2})">${ov}</g>`;
});

// ---- compositor with crossfades at location changes ----
const XF = 0.28;
function frameSVG(t) {
  const i = SHOTS.findIndex(s => t >= s.t0 && t < s.t1);
  const cur = SHOTS[i < 0 ? SHOTS.length - 1 : i];
  let body = cur.fn(t);
  if (cur.xf && i > 0 && t < cur.t0 + XF) {
    const prev = SHOTS[i - 1];
    const a = (t - cur.t0) / XF;
    body = prev.fn(t) + `<g opacity="${a.toFixed(3)}">${body}</g>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="${W}" height="${H}" fill="#000"/>${body}</svg>`;
}
module.exports = { frameSVG, SHOTS, DUR, FPS, W, H, speaker };
