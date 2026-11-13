// Dubai Gas & Rice — premium 2D motion-graphics commercial (deterministic: window.renderAt(t))
import { W, H, clamp, lerp, P, eio, eout, eout5, ein, eback, sine, rng, buildHood, buildMarket, buildBrand, buildProduct, buildKitchen } from './scenes2d.js';
const DUR = 30.0;
const out = document.getElementById('gl'); const ctx = out.getContext('2d');
const mkc = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; };
const bufA = mkc(), bufB = mkc(); const ga = bufA.getContext('2d'), gb = bufB.getContext('2d');
const logoImg = new Image(); logoImg.src = 'logo.png';
let S = null;
// film grain plates
const grains = [0, 1, 2].map(k => { const c = document.createElement('canvas'); c.width = 540; c.height = 960; const g = c.getContext('2d'); const d = g.createImageData(540, 960); const r = rng(900 + k); for (let i = 0; i < d.data.length; i += 4) { const v = r() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; } g.putImageData(d, 0, 0); return c; });
const SEG = [['hood', 0, 4.05], ['market', 3.6, 8.3], ['brand', 7.85, 11.65], ['product', 11.2, 17.6], ['kitchen', 17.15, 21.65], ['brand', 21.2, 30.1]];
const TR = [[3.6, 4.05, 1], [7.85, 8.3, 2], [11.2, 11.65, 1], [17.15, 17.6, 2], [21.2, 21.65, 1]];
// ---------- DOM overlay animation ----------
const $ = id => document.getElementById(id);
function show(el, o, x = 0, y = 0, s = 1, blur = 0, rot = 0) {
  if (typeof el === 'string') el = $(el);
  el.style.opacity = o.toFixed(4);
  el.style.transform = `translate(${x.toFixed(2)}px,${y.toFixed(2)}px) scale(${s.toFixed(4)}) rotate(${rot.toFixed(3)}deg)`;
  el.style.filter = blur > .05 ? `blur(${blur.toFixed(2)}px)` : 'none';
  el.style.visibility = o < .002 ? 'hidden' : 'visible';
}
// word mask reveal: each .w > span rises in; out = fade/drift up
function words(id, t, tin, tout, stagger = .09, dur = .55) {
  const el = $(id); const ws = el.querySelectorAll('.w>span');
  const o = P(t, tin - .01, tin + .05) * (1 - P(t, tout, tout + .35));
  show(el, o, 0, -eio(P(t, tout, tout + .35)) * 40, 1, P(t, tout, tout + .35) * 10);
  ws.forEach((w, i) => { const a = eout5(P(t, tin + i * stagger, tin + i * stagger + dur)); w.style.transform = `translateY(${((1 - a) * 115).toFixed(2)}%)`; });
}
function fadeEl(id, t, tin, tout, dy = 30, dur = .45, s0 = 1) {
  const a = eout5(P(t, tin, tin + dur)); const b = eio(P(t, tout, tout + .35));
  show(id, a * (1 - b), 0, (1 - a) * dy - b * 30, lerp(s0, 1, a), (1 - a) * 8 + b * 8);
}

let PHONE = '01XXX-XXXXXX', IS_PH = true;
function overlays(t) {
  show('scrim', (1-P(t,3.4,3.8))*.95 + P(t,3.9,4.2)*(1-P(t,7.6,7.95))*.8, 0,0,1);
  // ---------- S1 hook ----------
  fadeEl('s1kick', t, .25, 3.35, 20);
  words('s1title', t, .35, 3.35, .16, .7);
  { const a = eout5(P(t, .95, 1.6)); $('s1line').style.transform = `scaleX(${a})`; $('s1line').style.opacity = a * (1 - P(t, 3.35, 3.6)); $('s1line').style.visibility = 'visible'; }
  fadeEl('s1sub', t, 1.35, 3.35, 40, .55, .85);

  // ---------- S2 problem ----------
  words('s2a', t, 4.05, 7.6, .1, .5);
  words('s2b', t, 4.85, 7.6, .14, .55);
  { const a = eout5(P(t, 5.45, 5.95)); const out = P(t, 7.6, 7.9); const el = $('s2bar'); el.style.opacity = (a > 0 ? 1 : 0) * (1 - out); el.style.visibility = a > 0 ? 'visible' : 'hidden'; el.style.transform = `scaleX(${a}) skewX(-12deg)`; }
  { // emphasis shake on "অতিরিক্ত দাম"
    const k = P(t, 5.5, 6.1); const sh = Math.sin(k * Math.PI * 7) * (1 - k) * 6; $('s2b').style.transform += ` translateX(${sh.toFixed(2)}px)`;
  }
  words('s2c', t, 6.1, 7.6, .12, .5);
  { const a = eback(P(t, 5.1, 5.75)); const o = P(t, 5.1, 5.3) * (1 - P(t, 7.55, 7.85)); show('s2tag', o, 0, 0, Math.max(.01, a), 0, Math.sin(t * 5) * 3);
    const qs = ['৳ ???', '৳ ?!?', '৳ ??!', '৳ ?!!']; $('s2price').textContent = qs[Math.floor(t * 8) % 4]; }
  { const o = P(t, 4.3, 4.7) * (1 - P(t, 7.55, 7.85)); show('s2chart', o, (1 - eout5(P(t, 4.3, 4.9))) * -60, 0, 1);
    const pts = []; const prog = P(t, 4.3, 7.4); const n = 24; for (let i = 0; i <= n; i++) { const u = i / n; if (u > prog) break; const yy = 150 - Math.sin(u * 13.0) * 34 - Math.sin(u * 29.0 + 1) * 22 - u * 40 + Math.sin(u * 51) * 10; pts.push([30 + u * 380, yy]); }
    $('s2path').setAttribute('d', pts.length ? 'M' + pts.map(p => p.map(v => v.toFixed(1)).join(' ')).join(' L') : '');
    const last = pts[pts.length - 1] || [30, 150]; $('s2dot').setAttribute('cx', last[0]); $('s2dot').setAttribute('cy', last[1]); }

  // ---------- S3 brand reveal ----------
  words('s3a', t, 8.25, 10.95, .14, .6);

  // ---------- S4 product ----------
  fadeEl('s4k', t, 11.75, 14.25, 20);
  words('s4t', t, 12.25, 14.25, .12, .6);
  { const a = eout5(P(t, 12.7, 13.3)); const o = 1 - P(t, 14.25, 14.5); const el = $('s4line'); el.style.opacity = a * o; el.style.visibility = 'visible'; el.style.transform = `scaleX(${a})`; }
  words('s4r', t, 14.55, 17.05, .14, .6);
  fadeEl('s4c', t, 15.75, 17.1, 30, .5, .8); { const o=P(t,15.75,15.9); if(t>15.75&&t<17.1) $('s4r').style.opacity=1; }

  // ---------- S5 phone / call / WhatsApp ----------
  { const a = eout5(P(t, 17.4, 18.2)); const out = eio(P(t, 21.05, 21.6));
    const el = $('phone'); el.style.visibility = (t > 17.3 && t < 21.7) ? 'visible' : 'hidden'; el.style.opacity = P(t, 17.35, 17.6) * (1 - P(t, 21.4, 21.6));
    el.style.transform = `perspective(2200px) translateY(${((1 - a) * 900 - out * 120).toFixed(1)}px) rotateX(${((1 - a) * 28).toFixed(2)}deg) rotateY(${(Math.sin(t * .8) * 4 * a).toFixed(2)}deg) rotateZ(${((1 - a) * -6).toFixed(2)}deg) scale(${(lerp(.92, 1, a) * (1 + out * 1.4)).toFixed(4)})`;
    el.style.filter = out > .02 ? `blur(${(out * 14).toFixed(1)}px)` : 'none'; }
  { const tap = P(t, 18.55, 19.15); $('ripple').style.opacity = (t > 18.55 && t < 19.2) ? (1 - tap) : 0; $('ripple').style.transform = `scale(${1 + tap * 1.6})`;
    $('callbtn').style.transform = `scale(${1 + Math.sin(P(t, 17.9, 18.55) * Math.PI * 3) * .06 - (t > 18.55 && t < 18.7 ? .08 : 0)})`;
    const calling = t > 18.65; $('dialst').textContent = calling ? 'কল হচ্ছে' + '.'.repeat(1 + Math.floor(t * 3) % 3) : 'মোবাইল'; }
  { const c = eio(P(t, 19.35, 19.75)); $('chat').style.opacity = c; $('dial').style.opacity = 1 - c; $('chat').style.transform = `translateX(${((1 - c) * 60).toFixed(1)}px)`;
    const msg = 'গ্যাস সিলিন্ডার লাগবে, যোগাযোগ করতে চাই।'; const seg = [...new Intl.Segmenter('bn', { granularity: 'grapheme' }).segment(msg)].map(x => x.segment);
    const n = Math.floor(seg.length * P(t, 19.75, 20.5)); $('typed').textContent = t < 20.62 ? seg.slice(0, n).join('') + (Math.floor(t * 4) % 2 ? '|' : '') : '';
    const b = eback(P(t, 20.62, 20.95)); $('bub').style.opacity = P(t, 20.62, 20.7); $('bub').style.transform = `scale(${Math.max(.01, b)})`; }
  { const a = eback(P(t, 17.75, 18.25)); const o = P(t, 17.75, 17.9) * (1 - P(t, 19.25, 19.5)); show('chipCall', o, (1 - a) * -80, 0, Math.max(.2, a)); }
  { const a = eback(P(t, 19.45, 19.95)); const o = P(t, 19.45, 19.6) * (1 - P(t, 21.05, 21.35)); show('chipWa', o, 0, (1 - a) * -50, Math.max(.2, a)); }

  // ---------- S6 representative ready ----------
  { const a = eback(P(t, 21.55, 22.15)); const o = P(t, 21.55, 21.7) * (1 - P(t, 24.6, 24.95)); show('s6icon', o, 0, -eio(P(t, 24.6, 24.95)) * 60, Math.max(.01, a));
    const pr = (t * .9) % 1; $('s6r1').setAttribute('r', (96 + pr * 24).toFixed(1)); $('s6r1').setAttribute('opacity', ((1 - pr) * .8).toFixed(2)); }
  words('s6a', t, 21.7, 24.6, .12, .55);
  words('s6b', t, 22.35, 24.6, .14, .55);
  fadeEl('s6card', t, 23.35, 24.6, 50, .55, .85);

  // contact bar (S6) then end-card phone
  { const a = eout5(P(t, 21.9, 22.5)); const o = P(t, 21.9, 22.1) * (1 - P(t, 24.65, 24.95)); show('cbar', o, 0, (1 - a) * 80, .82); }
  // ---------- end card ----------
  words('ecTag', t, 27.15, 99, .12, .6);
  { const a = eout5(P(t, 27.55, 28.2)); const el = $('ecDiv'); el.style.opacity = a; el.style.visibility = a > 0 ? 'visible' : 'hidden'; el.style.transform = `scaleX(${a})`; }
  { const a = eback(P(t, 25.6, 26.25)); const o = P(t, 25.6, 25.75); const pulse = 1 + Math.max(0, Math.sin((t - 26.5) * 4)) * .025 * (t > 26.5 ? 1 : 0); show('ecPhone', o, 0, (1 - eout5(P(t, 25.6, 26.25))) * 90, Math.max(.01, a) * pulse); }
  { const a = eout5(P(t, 26.05, 26.6)); show('ecCw', a, 0, (1 - a) * 40, 1); }
  fadeEl('ecArea', t, 28.25, 99, 20);
  show('ph', IS_PH ? P(t, 22, 22.3) * ((t > 24.8 && t < 25.6) ? 0 : 1) * ((t > 17.4) ? 1 : 0) : 0, 0, 0, 1);

  // ---------- light leaks / flashes on cuts ----------
  const flashes = [[3.75, .55], [8.05, .7], [9.42, .55], [11.4, .5], [25.55, .6]];
  let f = 0; flashes.forEach(([c, a]) => { const d = (t - c) / .22; f = Math.max(f, a * Math.exp(-d * d)); });
  show('flash', f, 0, 0, 1);
  const lk = [[7.8, 8.6], [17.1, 17.9], [24.9, 25.9]]; let lo = 0, lx = 0;
  lk.forEach(([a, b]) => { if (t > a && t < b) { const u = P(t, a, b); lo = Math.sin(u * Math.PI) * .75; lx = lerp(-900, 900, u); } });
  show('leak', lo, lx, 0, 1.2);
}
// ecPhone wrapper is the cbar clone
(function makeEcPhone() { const c = $('cbar').cloneNode(true); c.id = 'ecPhone'; c.classList.add('a'); $('ov').insertBefore(c, $('ecCw')); })();

function setPhone(p, isPh) { PHONE = p; IS_PH = isPh; document.querySelectorAll('[data-phone]').forEach(e => e.textContent = p); }

function composite(t) {
  const act = SEG.filter(s => t >= s[1] && t < s[2]); const tr = TR.find(x => t >= x[0] && t < x[1]);
  S[act[0][0]](ga, t);
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.filter = 'none'; ctx.globalCompositeOperation = 'source-over';
  if (act.length > 1 && tr) {
    S[act[1][0]](gb, t); const m = P(t, tr[0], tr[1]), em = eio(m);
    if (tr[2] === 1) { // zoom-blur push
      const bl = Math.sin(m * Math.PI) * 14;
      ctx.filter = bl > .5 ? `blur(${bl.toFixed(1)}px)` : 'none';
      const sa = 1 + em * .25; ctx.drawImage(bufA, 540 - 540 * sa, 960 - 960 * sa, W * sa, H * sa);
      ctx.globalAlpha = em; const sb = 1.2 - em * .2; ctx.drawImage(bufB, 540 - 540 * sb, 960 - 960 * sb, W * sb, H * sb);
      ctx.globalAlpha = 1; ctx.filter = 'none';
    } else { // diagonal golden wipe
      ctx.drawImage(bufA, 0, 0);
      const e = lerp(-700, W + 700, em);
      ctx.save(); ctx.beginPath(); ctx.moveTo(e - 600, H); ctx.lineTo(e + 600, 0); ctx.lineTo(-2000, 0); ctx.lineTo(-2000, H); ctx.closePath(); ctx.clip(); ctx.drawImage(bufB, 0, 0); ctx.restore();
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(255,214,140,.9)'; ctx.lineWidth = 10; ctx.shadowColor = '#ffcf70'; ctx.shadowBlur = 40;
      ctx.beginPath(); ctx.moveTo(e - 600, H); ctx.lineTo(e + 600, 0); ctx.stroke(); ctx.restore();
    }
  } else ctx.drawImage(bufA, 0, 0);
  // vignette, grain, fade-in
  const v = ctx.createRadialGradient(540, 960, 500, 540, 960, 1250); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.42)'); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = .07; ctx.drawImage(grains[Math.floor(t * 30) % 3], 0, 0, W, H); ctx.restore();
  const f = 1 - P(t, 0, .2); if (f > 0) { ctx.fillStyle = `rgba(0,0,0,${f})`; ctx.fillRect(0, 0, W, H); }
}
window.renderAt = function (t) { t = Math.min(Math.max(t, 0), DUR - 1e-4); composite(t); overlays(t); return true; };
window.__ready = (async () => {
  await new Promise(res => { if (logoImg.complete && logoImg.naturalWidth) res(); else logoImg.onload = res; });
  S = { hood: buildHood(), market: buildMarket(), brand: buildBrand(logoImg), product: buildProduct(), kitchen: buildKitchen() };
  try { const c = await (await fetch('contact.json', { cache: 'no-store' })).json(); setPhone(c.phone_display, !!c.is_placeholder); } catch (e) { }
  await document.fonts.load('700 80px "Hind Siliguri"', 'দারুন্নাজাত'); await document.fonts.load('500 40px "Hind Siliguri"', 'আপনার');
  await document.fonts.load('800 40px Montserrat', 'LPG'); await document.fonts.load('600 40px Montserrat', 'A'); await document.fonts.load('700 40px "Playfair Display"', 'Dubai');
  await document.fonts.ready; window.renderAt(1); return true;
})();
