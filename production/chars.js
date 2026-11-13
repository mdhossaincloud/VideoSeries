// Posable, animatable versions of the cast (front view, Bangla Toon Flat).
// Origin = ground point between feet. Adult height ≈ 440 units.
'use strict';
const R = require('../characters/rig');
const { PAL, INK, SKIN, shade, P, L, E, EF, F, G, tube, hand, handOpen, shoe, sandal } = R;

const BRAND = { teal: '#0CAEA9', hi: '#1FD6C8', navy: '#052E3B', tint: '#F1FAF6' };

function thumbUp(x, y, skin, flip = false) {
  return G(tube([[-2, -8], [-2, -26]], 9, skin) + E(0, 2, 14, 13, skin) + L('M-8 -2 L8 -2 M-8 6 L8 6', 2.5, shade(skin, 0.75)),
    `translate(${x} ${y}) scale(${flip ? -1 : 1} 1)`);
}
function pointHand(x, y, skin, rot = 0) {
  return G(tube([[6, -2], [26, -2]], 8, skin) + E(0, 0, 14, 13, skin) + E(-4, -10, 7, 5, skin), `translate(${x} ${y}) rotate(${rot})`);
}
// Generic arm: shoulder S, bend control E, wrist H.
function arm(S, E2, H, o) {
  let s = '';
  if (o.long) {
    s += tube([S, E2, H], o.sw ?? 26, o.sleeve);
    if (o.cuff) s += L(`M${H[0] - 9} ${H[1] - 4} L${H[0] + 9} ${H[1] + 4}`, 5, o.cuff);
  } else {
    s += tube([S, E2, H], o.w ?? 21, o.skin);
    const f = o.frac ?? 0.42;
    const m = [S[0] + (E2[0] - S[0]) * f, S[1] + (E2[1] - S[1]) * f];
    s += tube([S, m], o.sw ?? 31, o.sleeve);
  }
  return s + (o.hand || '');
}
const breathWrap = (inner, br, pivot = -160) => `<g transform="translate(0 ${pivot}) scale(${1 + br * 0.4} ${1 + br}) translate(0 ${-pivot})">${inner}</g>`;
const headWrap = (inner, tilt, neckY, dx = 0, dy = 0) => `<g transform="translate(${dx} ${dy}) rotate(${tilt.toFixed(2)} 0 ${neckY})">${inner}</g>`;

function phone(x, y, w, h, screen, rot = 0) {
  return G(P(`M${-w / 2 + 8} ${-h / 2} L${w / 2 - 8} ${-h / 2} Q${w / 2} ${-h / 2} ${w / 2} ${-h / 2 + 8} L${w / 2} ${h / 2 - 8} Q${w / 2} ${h / 2} ${w / 2 - 8} ${h / 2} L${-w / 2 + 8} ${h / 2} Q${-w / 2} ${h / 2} ${-w / 2} ${h / 2 - 8} L${-w / 2} ${-h / 2 + 8} Q${-w / 2} ${-h / 2} ${-w / 2 + 8} ${-h / 2} Z`, '#23262F') +
    `<svg x="${-w / 2 + 5}" y="${-h / 2 + 9}" width="${w - 10}" height="${h - 18}" viewBox="0 0 100 180" preserveAspectRatio="none">${screen || '<rect width="100" height="180" fill="#11141B"/>'}</svg>`,
    `translate(${x} ${y}) rotate(${rot})`);
}

// ---------------- RAFI (FIXIBLE IT technician) ----------------
function rafi(o = {}) {
  const skin = SKIN.rafi, polo = BRAND.teal, jeans = '#22304A';
  let s = EF(0, 2, 92, 12, '#000', 'opacity="0.13"');
  const step = o.step || 0; // walk cycle phase (0 = still)
  const lk = Math.sin(step) * 10, rk = -lk;
  s += tube([[-22, -168], [-23 + lk * 0.3, -100], [-26 + lk, -26 - Math.max(0, lk) * 0.6]], 40, jeans) +
       tube([[22, -168], [23 + rk * 0.3, -100], [26 + rk, -26 - Math.max(0, rk) * 0.6]], 40, jeans);
  s += shoe(-30 + lk, -6 - Math.max(0, lk) * 0.6, PAL.white, polo, true) + shoe(30 + rk, -6 - Math.max(0, rk) * 0.6, PAL.white, polo);
  s += P('M-48 -188 L48 -188 L46 -146 L-46 -146 Z', jeans);
  let up = '';
  up += P('M-13 -332 L13 -332 L14 -292 L-14 -292 Z', skin);
  up += P('M-46 -300 Q-68 -298 -70 -276 L-58 -164 Q0 -158 58 -164 L70 -276 Q68 -298 46 -300 Q0 -290 -46 -300 Z', polo);
  up += F('M38 -296 Q62 -296 64 -276 L54 -166 Q44 -164 40 -164 Z', shade(polo));
  up += P('M-26 -302 L0 -286 L-10 -266 L-30 -290 Z', BRAND.navy) + P('M26 -302 L0 -286 L10 -266 L30 -290 Z', BRAND.navy);
  up += L('M0 -284 L0 -240', 4) + E(0, -268, 3, 3, PAL.white) + E(0, -252, 3, 3, PAL.white);
  // small chest mark (white roundel + teal tick) — subtle, not an oversized logo
  up += E(-32, -258, 11, 11, PAL.white, 'stroke-width="3.5"') + L('M-38 -258 L-33 -253 L-25 -263', 3.5, polo);
  up += L('M-14 -292 L16 -232 M14 -292 L18 -232', 4, BRAND.navy);
  up += P('M6 -232 L32 -232 L32 -196 L6 -196 Z', PAL.white) + F('M8.5 -229.5 L29.5 -229.5 L29.5 -222 L8.5 -222 Z', polo) + E(19, -212, 5, 5, skin, 'stroke-width="2.5"') + L('M11 -201 L27 -201', 2.5);
  up += L('M-52 -168 Q0 -162 52 -168', 4);
  const SLv = { sleeve: polo, skin };
  // left arm
  const aL = o.armL || 'down';
  if (aL === 'toolbox') {
    up += arm([-60, -288], [-74, -232], [-77, -182], SLv);
    up += L('M-96 -156 Q-96 -176 -76 -176 Q-56 -176 -56 -156', 7, INK);
    up += P('M-116 -156 L-36 -156 L-36 -104 L-116 -104 Z', PAL.terra) + F('M-113 -132 L-39 -132 L-39 -107 L-113 -107 Z', shade(PAL.terra)) + L('M-116 -132 L-36 -132', 4) + P('M-82 -140 L-70 -140 L-70 -126 L-82 -126 Z', PAL.mari);
    up += hand(-76, -172, skin, 90);
  } else if (aL === 'reach') {
    const T = o.reachL || [-150, -250];
    up += arm([-60, -288], [(-60 + T[0]) / 2 - 10, (-288 + T[1]) / 2 + 30], T, SLv) + hand(T[0], T[1], skin, -90 + (o.reachRotL || 0));
  } else {
    up += arm([-60, -288], [-76, -232], [-78, -180], SLv) + hand(-78, -172, skin, 90);
  }
  // right arm
  const aR = o.armR || 'hip';
  if (aR === 'wave') {
    up += arm([60, -288], [116, -262], [116, -334], SLv) + handOpen(116, -350, skin, (o.waveA || 0), true);
  } else if (aR === 'present') {
    up += arm([60, -288], [110, -232], [146, -258], SLv) + handOpen(156, -266, skin, 62, true);
  } else if (aR === 'thumb') {
    up += arm([60, -288], [112, -232], [100, -292], SLv) + thumbUp(100, -300, skin, true);
  } else if (aR === 'reach' || aR === 'tool') {
    const T = o.reachR || [150, -250];
    up += arm([60, -288], [(60 + T[0]) / 2 + 10, (-288 + T[1]) / 2 + 30], T, SLv);
    if (aR === 'tool') up += L(`M${T[0] + 8} ${T[1] - 4} L${T[0] + 58} ${T[1] - 18}`, 5, '#9AA3AD') + P(`M${T[0] - 6} ${T[1] + 2} L${T[0] + 14} ${T[1] - 4} L${T[0] + 16} ${T[1] - 16} L${T[0] - 4} ${T[1] - 10} Z`, PAL.mari, 'stroke-width="3"');
    up += hand(T[0], T[1], skin, -90 + (o.reachRotR || 0), true);
  } else {
    up += arm([60, -288], [96, -224], [60, -192], SLv) + hand(58, -188, skin, -120, true);
  }
  up += headWrap(R.rafiHead({ expr: o.expr, mouth: o.mouth, look: o.look, blink: o.blink }), o.tilt || 0, -318);
  s += breathWrap(up, o.breath || 0);
  return s;
}

// ---------------- NASIMA APA (shop owner) ----------------
function nasima(o = {}) {
  const skin = SKIN.nasima, kameez = '#7D2E3A', salwar = '#EDE3D2', orna = '#E9DCCB', trim = '#C9A86A';
  let s = EF(0, 2, 90, 12, '#000', 'opacity="0.13"');
  s += P('M44 -290 Q74 -250 70 -150 L52 -150 Q54 -230 30 -284 Z', orna);
  s += sandal(-26, -8, skin, PAL.mari, true) + sandal(26, -8, skin, PAL.mari);
  s += tube([[-22, -128], [-24, -70], [-24, -26]], 34, salwar) + tube([[22, -128], [24, -70], [24, -26]], 34, salwar);
  let up = '';
  up += P('M-12 -326 L12 -326 L13 -290 L-13 -290 Z', skin);
  up += P('M-42 -298 Q-62 -296 -64 -276 L-60 -210 Q-70 -160 -74 -112 Q0 -102 74 -112 Q70 -160 60 -210 L64 -276 Q62 -296 42 -298 Q0 -288 -42 -298 Z', kameez);
  up += F('M34 -294 Q56 -292 58 -274 L54 -210 Q64 -160 68 -114 Q58 -112 50 -112 Q50 -180 34 -294 Z', shade(kameez));
  up += L('M-72 -122 Q0 -110 72 -122', 6, trim);
  up += L('M-16 -296 Q0 -272 16 -296', 4, trim);
  up += P('M-48 -298 Q-20 -232 40 -228 Q58 -230 64 -250 L52 -288 Q30 -250 -6 -262 Q-26 -272 -34 -300 Z', orna);
  up += L('M-40 -282 Q-14 -240 46 -238', 2.5, shade(orna, 0.85));
  const SL = { long: true, sleeve: kameez, sw: 26, cuff: trim };
  const aL = o.armL || 'counter', aR = o.armR || 'counter';
  if (aL === 'hip') up += arm([-54, -282], [-82, -232], [-58, -192], SL) + hand(-52, -184, skin, 110);
  else if (aL === 'counter') up += arm([-54, -282], [-76, -232], [-50, -196], SL) + hand(-44, -190, skin, 80);
  else up += arm([-54, -282], [-70, -230], [-72, -184], SL) + hand(-72, -176, skin, 90);
  if (aR === 'gesture') {
    up += arm([54, -282], [104, -250], [106, -310], SL) + handOpen(106, -326, skin, 18 + (o.gA || 0), true);
  } else if (aR === 'phone') {
    const py = o.phoneY ?? -330;
    up += arm([54, -282], [108, -246], [104, py + 30], SL);
    up += phone(104, py, 62, 112, o.phoneScreen, -6);
    up += hand(104, py + 40, skin, -100, true);
  } else if (aR === 'counter') up += arm([54, -282], [76, -232], [50, -196], SL) + hand(44, -190, skin, 100, true);
  else up += arm([54, -282], [70, -230], [72, -184], SL) + hand(72, -176, skin, 90, true);
  up += headWrap(R.nasimaHead({ expr: o.expr, mouth: o.mouth, look: o.look, blink: o.blink }), o.tilt || 0, -316);
  s += breathWrap(up, o.breath || 0);
  return s;
}

// ---------------- DADU (grandfather) ----------------
function dadu(o = {}) {
  const skin = SKIN.dadu, panj = '#F4EFE4';
  let s = EF(0, 2, 88, 12, '#000', 'opacity="0.13"');
  const aL = o.armL || 'behind', aR = o.armR || 'behind';
  const SL = { long: true, sleeve: panj, sw: 26 };
  let back = '';
  if (aL === 'behind') back += tube([[-54, -270], [-66, -220], [-50, -190]], 26, panj);
  if (aR === 'behind') back += tube([[54, -270], [66, -220], [50, -190]], 26, panj);
  s += sandal(-26, -8, skin, '#6B3F2A', true) + sandal(26, -8, skin, '#6B3F2A');
  s += tube([[-20, -120], [-22, -70], [-22, -28]], 32, PAL.white) + tube([[20, -120], [22, -70], [22, -28]], 32, PAL.white);
  let up = back;
  up += P('M-13 -312 L13 -312 L14 -276 L-14 -276 Z', skin);
  up += P('M-44 -286 Q-62 -282 -64 -262 L-60 -112 Q0 -104 60 -112 L64 -262 Q62 -282 44 -286 Q0 -276 -44 -286 Z', panj);
  up += F('M36 -282 Q56 -280 58 -262 L54 -114 Q46 -112 42 -112 Q46 -200 36 -282 Z', shade(panj, 0.9));
  up += P('M-8 -282 L8 -282 L8 -226 L-8 -226 Z', panj) + E(0, -268, 2.8, 2.8, PAL.mari) + E(0, -254, 2.8, 2.8, PAL.mari) + E(0, -240, 2.8, 2.8, PAL.mari);
  up += P('M-14 -290 L0 -280 L14 -290 L14 -282 L0 -272 L-14 -282 Z', '#E8E1D2');
  if (aL === 'down') up += arm([-52, -276], [-68, -226], [-70, -178], SL) + hand(-70, -168, skin, 90);
  if (aL === 'counter') up += arm([-52, -276], [-76, -228], [-48, -194], SL) + hand(-42, -188, skin, 80);
  if (aR === 'point') up += arm([52, -276], [100, -236], [138, -258], SL) + pointHand(150, -260, skin, -8);
  else if (aR === 'raise') up += arm([52, -276], [104, -246], [104, -318], SL) + handOpen(104, -334, skin, 10 + (o.gA || 0), true);
  else if (aR === 'tap') up += arm([52, -276], [96, -228], [128, -196 + (o.tapY || 0)], SL) + hand(136, -192 + (o.tapY || 0), skin, -80, true);
  else if (aR === 'thumb') up += arm([52, -276], [106, -232], [98, -290], SL) + thumbUp(98, -298, skin, true);
  else if (aR === 'down') up += arm([52, -276], [68, -226], [70, -178], SL) + hand(70, -168, skin, 90, true);
  else if (aR === 'counter') up += arm([52, -276], [76, -228], [48, -194], SL) + hand(42, -188, skin, 100, true);
  else if (aR === 'phone') {
    const py = o.phoneY ?? -320;
    up += arm([52, -276], [106, -240], [102, py + 30], SL) + phone(102, py, 62, 112, o.phoneScreen, -6) + hand(102, py + 40, skin, -100, true);
  }
  up += headWrap(R.daduHead({ expr: o.expr, mouth: o.mouth, look: o.look, blink: o.blink }), o.tilt || 0, -296);
  s += breathWrap(up, o.breath || 0);
  return s;
}

// ---------------- GRANDDAUGHTER (seated at the study table, no dialogue) ----------------
function girl(o = {}) {
  const skin = SKIN.tutul, frock = '#3B6EA8';
  let up = '';
  up += P('M-10 -206 L10 -206 L11 -186 L-11 -186 Z', skin);
  up += P('M-34 -194 Q-50 -192 -52 -176 L-46 -100 L46 -100 L52 -176 Q50 -192 34 -194 Q0 -186 -34 -194 Z', PAL.white);
  up += P('M-26 -184 L-14 -184 L-12 -152 L12 -152 L14 -184 L26 -184 L30 -146 Q40 -120 44 -96 L-44 -96 Q-40 -120 -30 -146 Z', frock);
  up += P('M-18 -194 L0 -182 L-6 -170 L-22 -186 Z', PAL.white) + P('M18 -194 L0 -182 L6 -170 L22 -186 Z', PAL.white);
  const ty = o.typeY || 0;
  up += tube([[-44, -180], [-60, -140], [-24, -118 + ty]], 16, skin) + tube([[-44, -182], [-52, -164]], 24, PAL.white) + hand(-22, -116 + ty, skin, 0, false, 0.8);
  up += tube([[44, -180], [60, -140], [26, -118 - ty]], 16, skin) + tube([[44, -182], [52, -164]], 24, PAL.white) + hand(24, -116 - ty, skin, 0, true, 0.8);
  up += headWrap(R.tutulHead({ expr: o.expr, mouth: o.mouth || 'closed', look: o.look, blink: o.blink }), o.tilt || 0, -200);
  return breathWrap(up, o.breath || 0, -100);
}

module.exports = { BRAND, rafi, nasima, dadu, girl, phone, thumbUp };
