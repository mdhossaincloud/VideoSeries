// Dubai Gas & Rice — premium vertical commercial renderer
// Deterministic: window.renderAt(t) draws the exact frame for time t (seconds).
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const W = 1080, H = 1920, DUR = 30.0;

// ---------- helpers ----------
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const P = (t, a, b) => clamp((t - a) / (b - a));
const eio = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const eout = t => 1 - Math.pow(1 - t, 3);
const eout5 = t => 1 - Math.pow(1 - t, 5);
const ein = t => t * t * t;
const eback = t => { const c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
const sine = t => -(Math.cos(Math.PI * t) - 1) / 2;
function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
const sRGB = c => new THREE.Color(c);

function canvasTex(w, h, draw, repeat) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); draw(g, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
  return t;
}
function noise(g, w, h, n, alpha, r) {
  for (let i = 0; i < n; i++) { const v = Math.floor(r() * 255); g.fillStyle = `rgba(${v},${v},${v},${alpha * r()})`; g.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2); }
}

// ---------- renderer & compositor ----------
const canvas = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.toneMapping = THREE.NoToneMapping;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const mkRT = () => new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4 });
const rtA = mkRT(), rtB = mkRT();
const pmrem = new THREE.PMREMGenerator(renderer);
const envTex = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;

const compMat = new THREE.ShaderMaterial({
  uniforms: {
    tA: { value: rtA.texture }, tB: { value: rtB.texture }, mixv: { value: 0 }, mode: { value: 0 }, time: { value: 0 },
    gA: { value: new THREE.Vector4(1, 1, 1, 1) }, gB: { value: new THREE.Vector4(1, 1, 1, 1) }, // rgb tint, saturation
    eA: { value: new THREE.Vector2(1, 1) }, eB: { value: new THREE.Vector2(1, 1) },               // exposure, tonemap(1=aces,0=linear)
    zA: { value: 0 }, zB: { value: 0 }, vig: { value: 0.35 }, fade: { value: 0 }
  },
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }`,
  fragmentShader: `
  precision highp float; varying vec2 vUv;
  uniform sampler2D tA,tB; uniform float mixv,time,zA,zB,vig,fade; uniform int mode;
  uniform vec4 gA,gB; uniform vec2 eA,eB;
  vec3 aces(vec3 x){ return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14),0.,1.); }
  vec3 toSRGB(vec3 c){ c=clamp(c,0.,1.); return mix(c*12.92, 1.055*pow(c,vec3(1./2.4))-0.055, step(0.0031308,c)); }
  float hash(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); }
  vec3 zs(sampler2D t, vec2 uv, float amt){
    if(amt<0.002) return texture2D(t,uv).rgb;
    vec2 c=vec2(.5,.5); vec3 acc=vec3(0.);
    for(int i=0;i<14;i++){ float s=1.-amt*float(i)/13.; acc+=texture2D(t,c+(uv-c)*s).rgb; }
    return acc/14.;
  }
  vec3 grade(vec3 c, vec4 g, vec2 e){
    c*=e.x; vec3 m = e.y>0.5 ? aces(c) : clamp(c,0.,1.);
    float l=dot(m,vec3(.2126,.7152,.0722)); m=mix(vec3(l),m,g.w); m*=g.rgb; return m;
  }
  void main(){
    vec2 uv=vUv;
    vec2 ua = mode==1 ? (vec2(.5)+(uv-vec2(.5))*(1.-0.18*mixv)) : uv;
    vec2 ub = mode==1 ? (vec2(.5)+(uv-vec2(.5))*(1.+0.25*(1.-mixv))) : uv;
    vec3 a = grade(zs(tA,ua,zA),gA,eA);
    vec3 col=a;
    if(mixv>0.0005){
      vec3 b = grade(zs(tB,ub,zB),gB,eB);
      float m=mixv;
      if(mode==2){ // diagonal wipe with golden edge
        float d=(uv.x*0.55+(1.-uv.y)*0.45); float edge=mixv*1.3-0.15;
        m=smoothstep(edge+0.02,edge-0.02,d);
        float glow=exp(-pow((d-edge)*28.,2.));
        col=mix(a,b,m)+vec3(1.,.82,.5)*glow*0.9*sin(3.14159*mixv);
      } else col=mix(a,b,m);
    }
    float r=length((uv-.5)*vec2(1.,1.25)); col*=1.-vig*smoothstep(.35,.95,r);
    col=toSRGB(col);
    col+= (hash(uv*vec2(1080.,1920.)+fract(time*7.31)*91.)-.5)*0.028;
    col*=1.-fade;
    gl_FragColor=vec4(col,1.);
  }`, depthTest: false, depthWrite: false
});
const compScene = new THREE.Scene(); const compCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
compScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), compMat));

// ---------- shared: LPG cylinder ----------
function holeAlpha(w, h, holes) {
  return canvasTex(w, h, (g) => { g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.fillStyle = '#000'; holes(g); });
}
function makeCylinder(color, opts = {}) {
  const grp = new THREE.Group();
  const paint = new THREE.MeshPhysicalMaterial({ color, roughness: opts.rough ?? 0.32, metalness: 0.25, clearcoat: 1, clearcoatRoughness: 0.12, envMapIntensity: opts.env ?? 1 });
  const steel = new THREE.MeshStandardMaterial({ color: opts.collar ?? color, roughness: 0.4, metalness: 0.35, envMapIntensity: opts.env ?? 1 });
  const brass = new THREE.MeshStandardMaterial({ color: 0xc9a046, roughness: 0.28, metalness: 1, envMapIntensity: 1.3 });
  // body profile (meters): diameter ~0.31, height ~0.6
  const pts = [[0, .07], [.06, .072], [.11, .082], [.142, .1], [.153, .125], [.155, .15], [.155, .48], [.153, .505], [.142, .535], [.12, .56], [.085, .58], [.045, .59], [0, .592]].map(p => new THREE.Vector2(p[0], p[1]));
  const body = new THREE.Mesh(new THREE.LatheGeometry(pts, 96), paint); body.castShadow = body.receiveShadow = true; grp.add(body);
  // weld seam + foot ring
  const seam = new THREE.Mesh(new THREE.TorusGeometry(.1555, .0028, 8, 96), paint); seam.rotation.x = Math.PI / 2; seam.position.y = .33; grp.add(seam);
  const footA = holeAlpha(512, 64, g => { for (let i = 0; i < 4; i++) { g.beginPath(); g.ellipse(64 + i * 128, 36, 22, 12, 0, 0, 7); g.fill(); } });
  const footMat = steel.clone(); footMat.alphaMap = footA; footMat.alphaTest = 0.5; footMat.side = THREE.DoubleSide;
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(.13, .135, .085, 96, 1, true), footMat); foot.position.y = .0425; foot.castShadow = true; grp.add(foot);
  const footLip = new THREE.Mesh(new THREE.TorusGeometry(.135, .004, 8, 96), steel); footLip.rotation.x = Math.PI / 2; footLip.position.y = .002; grp.add(footLip);
  // protective collar with two handle cut-outs
  const colA = holeAlpha(1024, 128, g => { [256, 768].forEach(cx => { g.beginPath(); g.roundRect(cx - 120, 34, 240, 46, 23); g.fill(); }); });
  const colMat = steel.clone(); colMat.alphaMap = colA; colMat.alphaTest = .5; colMat.side = THREE.DoubleSide;
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(.092, .098, .13, 96, 1, true), colMat); collar.position.y = .64; collar.castShadow = true; grp.add(collar);
  const lip = new THREE.Mesh(new THREE.TorusGeometry(.092, .006, 10, 96), steel); lip.rotation.x = Math.PI / 2; lip.position.y = .705; grp.add(lip);
  // valve
  const vb = new THREE.Mesh(new THREE.CylinderGeometry(.018, .022, .07, 32), brass); vb.position.y = .625; grp.add(vb);
  const vt = new THREE.Mesh(new THREE.CylinderGeometry(.026, .026, .014, 32), brass); vt.position.y = .662; grp.add(vt);
  const out = new THREE.Mesh(new THREE.CylinderGeometry(.011, .011, .05, 24), brass); out.rotation.z = Math.PI / 2; out.position.set(.03, .63, 0); grp.add(out);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, .02, 32), new THREE.MeshStandardMaterial({ color: 0x1b1b1b, roughness: .5 })); cap.position.y = .675; grp.add(cap);
  grp.userData.paint = paint;
  return grp;
}

// ---------- sky dome ----------
function skyDome(top, mid, bot, r = 600) {
  const m = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: sRGB(top) }, mid: { value: sRGB(mid) }, bot: { value: sRGB(bot) } },
    vertexShader: `varying vec3 vp; void main(){ vp=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `uniform vec3 top,mid,bot; varying vec3 vp; void main(){ float y=vp.y; vec3 c= y>0.? mix(mid,top,pow(clamp(y,0.,1.),.6)) : mix(mid,bot,clamp(-y*3.,0.,1.)); gl_FragColor=vec4(c,1.); }`
  });
  return new THREE.Mesh(new THREE.SphereGeometry(r, 32, 16), m);
}

// =====================================================================
// SCENE 1 — Bangladeshi residential neighbourhood (aerial)
// =====================================================================
function buildHood() {
  const r = rng(7);
  const s = new THREE.Scene();
  s.add(skyDome(0x7fa9d1, 0xe8e2d2, 0xbdb4a2));
  s.fog = new THREE.Fog(0xdcd9cf, 70, 330);
  s.environment = envTex;
  s.add(new THREE.HemisphereLight(0xdbe8fa, 0x7a6a50, .75));
  const sun = new THREE.DirectionalLight(0xffdcae, 2.7); sun.position.set(-70, 110, 30); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -90, right: 90, top: 120, bottom: -120, near: 10, far: 400 }); sun.shadow.bias = -0.0004;
  sun.target.position.set(0, 0, -60); s.add(sun, sun.target);

  // ground, street, sidewalks
  const groundT = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#9b927f'; g.fillRect(0, 0, w, h); noise(g, w, h, 4000, .25, r); }, true); groundT.repeat.set(60, 60);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), new THREE.MeshStandardMaterial({ map: groundT, roughness: 1 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; s.add(ground);
  const asph = canvasTex(256, 1024, (g, w, h) => {
    g.fillStyle = '#4a4a4c'; g.fillRect(0, 0, w, h); noise(g, w, h, 9000, .35, r);
    for (let i = 0; i < 14; i++) { g.fillStyle = `rgba(30,30,32,${.15 + r() * .2})`; g.beginPath(); g.ellipse(r() * w, r() * h, 10 + r() * 40, 20 + r() * 80, 0, 0, 7); g.fill(); }
    g.fillStyle = 'rgba(235,225,190,.75)'; for (let y = 0; y < h; y += 128) g.fillRect(w / 2 - 3, y, 6, 64);
  }, true); asph.repeat.set(1, 30);
  const street = new THREE.Mesh(new THREE.PlaneGeometry(11, 300), new THREE.MeshStandardMaterial({ map: asph, roughness: .92 })); street.rotation.x = -Math.PI / 2; street.position.set(0, .02, -80); street.receiveShadow = true; s.add(street);
  const swM = new THREE.MeshStandardMaterial({ color: 0xb8ae9a, roughness: .95 });
  [-1, 1].forEach(sd => { const sw = new THREE.Mesh(new THREE.BoxGeometry(2.6, .22, 300), swM); sw.position.set(sd * 6.8, .11, -80); sw.receiveShadow = true; s.add(sw); });
  // cross street
  const cross = new THREE.Mesh(new THREE.PlaneGeometry(200, 9), new THREE.MeshStandardMaterial({ color: 0x4d4c4c, roughness: .95 })); cross.rotation.x = -Math.PI / 2; cross.position.set(0, .015, -96); cross.receiveShadow = true; s.add(cross);

  // facade textures — Dhaka-style residential: grilled windows, balconies, monsoon stains
  const wallCols = ['#e9dcc0', '#d3e4d2', '#efc9a8', '#ead0c9', '#cddcea', '#efeae0', '#e6c77f', '#c7c2b8', '#f1e3b5', '#d9cfe3'];
  const facades = wallCols.map((wc, k) => canvasTex(256, 256, (g, w, h) => {
    const rr = rng(100 + k);
    g.fillStyle = wc; g.fillRect(0, 0, w, h); noise(g, w, h, 1800, .10, rr);
    const sg = g.createLinearGradient(0, 160, 0, 256); sg.addColorStop(0, 'rgba(70,70,60,0)'); sg.addColorStop(1, 'rgba(70,70,60,.22)'); g.fillStyle = sg; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 6; i++) { g.fillStyle = 'rgba(60,60,50,.06)'; g.fillRect(rr() * w, 200 + rr() * 40, 3 + rr() * 6, -60 - rr() * 100); }
    // window
    const gx = 44, gy = 52, gw = 168, gh = 130;
    const gl = g.createLinearGradient(gx, gy, gx + gw, gy + gh); gl.addColorStop(0, '#2b3a49'); gl.addColorStop(.55, '#5c7488'); gl.addColorStop(1, '#22303c');
    g.fillStyle = '#d8d3c8'; g.fillRect(gx - 8, gy - 8, gw + 16, gh + 16);
    g.fillStyle = gl; g.fillRect(gx, gy, gw, gh);
    if (rr() > .4) { g.fillStyle = ['#c3504a', '#3d6fa8', '#e2b23d', '#6aa35a', '#d77fa8'][Math.floor(rr() * 5)]; g.globalAlpha = .85; g.fillRect(gx + 10, gy + 10, gw * .35, gh - 20); g.globalAlpha = 1; }
    g.strokeStyle = 'rgba(245,245,240,.9)'; g.lineWidth = 3;
    for (let x = gx; x <= gx + gw; x += 14) { g.beginPath(); g.moveTo(x, gy); g.lineTo(x, gy + gh); g.stroke(); }
    for (let y = gy; y <= gy + gh; y += gh / 3) { g.beginPath(); g.moveTo(gx, y); g.lineTo(gx + gw, y); g.stroke(); }
    // balcony slab + rail
    g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(0, 214, w, 8);
    g.fillStyle = '#f2efe8'; g.fillRect(0, 206, w, 10);
    if (k % 2 === 0) { g.strokeStyle = 'rgba(40,40,40,.7)'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, 170); g.lineTo(w, 170); g.stroke(); for (let x = 6; x < w; x += 16) { g.beginPath(); g.moveTo(x, 170); g.lineTo(x, 206); g.stroke(); } }
    if (rr() > .5) { g.fillStyle = '#e8e8e4'; g.fillRect(200, 150, 46, 30); g.fillStyle = '#999'; for (let i = 0; i < 5; i++) g.fillRect(204, 154 + i * 5, 38, 2); }
  }, true));
  const shopT = ['#c0392b', '#1f6d9c', '#2d8a4e', '#d9a21b', '#7d3c98'].map((bc, k) => canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#8f9295'; g.fillRect(0, 0, w, h);
    for (let y = 60; y < h; y += 8) { g.fillStyle = y % 16 ? '#a3a6a9' : '#7c7f82'; g.fillRect(10, y, w - 20, 5); }
    g.fillStyle = bc; g.fillRect(0, 0, w, 58); g.fillStyle = 'rgba(255,255,255,.75)'; g.fillRect(30, 18, 120 + k * 10, 10); g.fillRect(30, 34, 80, 8);
  }, true));
  const roofT = canvasTex(128, 128, (g, w, h) => { g.fillStyle = '#a7a196'; g.fillRect(0, 0, w, h); noise(g, w, h, 1500, .25, r); }, true);
  const roofM = new THREE.MeshStandardMaterial({ map: roofT, roughness: 1 });
  const tankM = new THREE.MeshStandardMaterial({ color: 0x1b1c1e, roughness: .55 });
  const parM = new THREE.MeshStandardMaterial({ color: 0xe7e2d6, roughness: .9 });
  const fl = 3.1;
  function building(x, z, wz, dx, floors, side) {
    const h = floors * fl; const fi = Math.floor(r() * facades.length);
    const front = facades[fi].clone(); front.needsUpdate = true; front.repeat.set(Math.max(1, Math.round(wz / 4)), floors - 1); front.offset.set(0, 0);
    const sideT = facades[fi].clone(); sideT.needsUpdate = true; sideT.repeat.set(Math.max(1, Math.round(dx / 4)), floors - 1);
    const fm = new THREE.MeshStandardMaterial({ map: front, roughness: .92 }), sm = new THREE.MeshStandardMaterial({ map: sideT, roughness: .92 });
    const geo = new THREE.BoxGeometry(dx, h - fl, wz);
    const mats = side < 0 ? [fm, sm, roofM, roofM, sm, sm] : [sm, fm, roofM, roofM, sm, sm];
    const b = new THREE.Mesh(geo, mats); b.position.set(x, fl + (h - fl) / 2, z); b.castShadow = b.receiveShadow = true; s.add(b);
    // ground-floor shop
    const st = shopT[Math.floor(r() * shopT.length)].clone(); st.needsUpdate = true; st.repeat.set(Math.max(1, Math.round(wz / 4)), 1);
    const sm2 = new THREE.MeshStandardMaterial({ map: st, roughness: .7, metalness: .2 }), gm = new THREE.MeshStandardMaterial({ color: 0xcfc8b8, roughness: .9 });
    const shop = new THREE.Mesh(new THREE.BoxGeometry(dx, fl, wz), side < 0 ? [sm2, gm, gm, gm, gm, gm] : [gm, sm2, gm, gm, gm, gm]); shop.position.set(x, fl / 2, z); shop.castShadow = shop.receiveShadow = true; s.add(shop);
    // roof: parapet, tank, stair room
    const ty = h;
    [[dx, .9, .18, 0, wz / 2], [dx, .9, .18, 0, -wz / 2], [.18, .9, wz, dx / 2, 0], [.18, .9, wz, -dx / 2, 0]].forEach(p => { const m = new THREE.Mesh(new THREE.BoxGeometry(p[0], p[1], p[2]), parM); m.position.set(x + p[3], ty + .45, z + p[4]); m.castShadow = true; s.add(m); });
    const nT = 1 + Math.floor(r() * 2);
    for (let i = 0; i < nT; i++) { const tk = new THREE.Mesh(new THREE.CylinderGeometry(.85, .85, 1.7, 20), tankM); tk.position.set(x + (r() - .5) * dx * .5, ty + 1.9, z + (r() - .5) * wz * .5); const st2 = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.05, 1.8), parM); st2.position.set(tk.position.x, ty + .52, tk.position.z); tk.castShadow = st2.castShadow = true; s.add(tk, st2); }
    if (r() > .35) { const sr = new THREE.Mesh(new THREE.BoxGeometry(3, 2.6, 3.2), parM); sr.position.set(x - side * dx * .2, ty + 1.3, z + wz * .25); sr.castShadow = true; s.add(sr); }
    if (r() > .5) { for (let i = 0; i < 3; i++) { const p = new THREE.Mesh(new THREE.IcosahedronGeometry(.6 + r() * .4, 0), new THREE.MeshStandardMaterial({ color: 0x4f8a3c, flatShading: true })); p.position.set(x + (r() - .5) * dx * .7, ty + .7, z + (r() - .5) * wz * .7); s.add(p); } }
  }
  [-1, 1].forEach(side => {
    let z = 40;
    while (z > -230) {
      const wz = 9 + r() * 7, dx = 12 + r() * 6, floors = 4 + Math.floor(r() * 5);
      if (Math.abs(z - wz / 2 + 96) < 9) { z -= 14; continue; }
      if (r() < .12) { z -= wz; continue; }
      building(side * (8.1 + dx / 2), z - wz / 2, wz - .6, dx, floors, side);
      // back row (taller skyline)
      const dx2 = 12 + r() * 8; building(side * (8.1 + dx + 3 + dx2 / 2), z - wz / 2 + (r() - .5) * 3, wz - .6, dx2, 5 + Math.floor(r() * 6), side);
      z -= wz;
    }
  });
  // trees
  const trunkM = new THREE.MeshStandardMaterial({ color: 0x6b5338, roughness: 1 });
  const leafMs = [0x3e7a35, 0x4f8c3c, 0x2f6a30].map(c => new THREE.MeshStandardMaterial({ color: c, roughness: .9, flatShading: true }));
  const frondM = new THREE.MeshStandardMaterial({ color: 0x3f7d36, roughness: .8, side: THREE.DoubleSide });
  function palm(x, z) {
    const g = new THREE.Group(); const hh = 8 + r() * 4; const bend = (r() - .5) * 2;
    const curve = new THREE.QuadraticBezierCurve3(v3(0, 0, 0), v3(bend * .5, hh * .5, 0), v3(bend, hh, 0));
    const tr = new THREE.Mesh(new THREE.TubeGeometry(curve, 10, .22, 6), trunkM); tr.castShadow = true; g.add(tr);
    for (let i = 0; i < 9; i++) {
      const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.quadraticCurveTo(.5, 2, 0, 4.2); sh.quadraticCurveTo(-.5, 2, 0, 0);
      const f = new THREE.Mesh(new THREE.ShapeGeometry(sh, 6), frondM); f.castShadow = true;
      f.position.set(bend, hh, 0); f.rotation.set(0, i / 9 * Math.PI * 2, 0); f.rotateX(-1.1 - r() * .5); g.add(f);
    }
    g.position.set(x, 0, z); s.add(g);
  }
  function roundTree(x, z) {
    const g = new THREE.Group(); const t = new THREE.Mesh(new THREE.CylinderGeometry(.2, .3, 3, 6), trunkM); t.position.y = 1.5; g.add(t);
    for (let i = 0; i < 4; i++) { const l = new THREE.Mesh(new THREE.IcosahedronGeometry(1.6 + r(), 1), leafMs[i % 3]); l.position.set((r() - .5) * 2, 3.8 + r() * 1.5, (r() - .5) * 2); l.castShadow = true; g.add(l); }
    g.position.set(x, 0, z); s.add(g);
  }
  for (let z = 30; z > -220; z -= 13 + r() * 12) { const sd = r() > .5 ? 1 : -1; (r() > .45 ? palm : roundTree)(sd * (7.6 + r() * .4), z); }
  // electric poles + sagging wires
  const poleM = new THREE.MeshStandardMaterial({ color: 0x9d9a92, roughness: .9 });
  const wireM = new THREE.LineBasicMaterial({ color: 0x1d1d1f });
  [-1, 1].forEach(sd => {
    const tops = [];
    for (let z = 34; z > -220; z -= 20) { const p = new THREE.Mesh(new THREE.BoxGeometry(.3, 10, .3), poleM); p.position.set(sd * 7.4, 5, z); p.castShadow = true; s.add(p); const arm = new THREE.Mesh(new THREE.BoxGeometry(1.6, .14, .14), poleM); arm.position.set(sd * 7.4, 9.4, z); s.add(arm); tops.push(z); }
    for (let i = 0; i < tops.length - 1; i++) for (let k = 0; k < 4; k++) {
      const pts = []; const xo = sd * 7.4 + (k - 1.5) * .45, y0 = 9.5 - (k % 2) * .5;
      for (let j = 0; j <= 12; j++) { const u = j / 12; pts.push(v3(xo, y0 - Math.sin(u * Math.PI) * (.6 + k * .12), lerp(tops[i], tops[i + 1], u))); }
      s.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), wireM));
    }
  });
  for (let i = 0; i < 6; i++) { const z = 20 - i * 34; const pts = []; for (let j = 0; j <= 12; j++) { const u = j / 12; pts.push(v3(lerp(-7.4, 7.4, u), 9.3 - Math.sin(u * Math.PI) * .9, z + (r() - .5) * 4)); } s.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), wireM)); }

  // vehicles: cycle-rickshaws and green CNG auto-rickshaws
  const tyreM = new THREE.MeshStandardMaterial({ color: 0x151515, roughness: .8 });
  const frameM = new THREE.MeshStandardMaterial({ color: 0x2b2b2b, roughness: .6, metalness: .4 });
  const hoodTex = ['#d63c6b', '#2a6fd1', '#f0b323', '#1fa37a'].map((c, k) => canvasTex(256, 128, (g, w, h) => { g.fillStyle = c; g.fillRect(0, 0, w, h); for (let x = 0; x < w; x += 32) { g.fillStyle = k % 2 ? '#fff4' : '#0003'; g.fillRect(x, 0, 12, h); } g.fillStyle = '#ffe36b'; for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(20 + i * 42, 100, 9, 0, 7); g.fill(); } }));
  const skin = new THREE.MeshStandardMaterial({ color: 0x8a5a3c, roughness: .8 });
  const vehicles = [];
  function rider(g, x, y, z, col) { const b = new THREE.Mesh(new THREE.CapsuleGeometry(.22, .5, 4, 8), new THREE.MeshStandardMaterial({ color: col, roughness: .9 })); b.position.set(x, y, z); const hd = new THREE.Mesh(new THREE.SphereGeometry(.15, 12, 8), skin); hd.position.set(x, y + .52, z); b.castShadow = true; g.add(b, hd); }
  function rickshaw(k) {
    const g = new THREE.Group(); const wh = [];
    [[-.55, .42, .55], [.55, .42, .55], [0, .38, -1.3]].forEach(p => { const w = new THREE.Mesh(new THREE.TorusGeometry(p[1], .045, 8, 24), tyreM); w.rotation.y = Math.PI / 2; w.position.set(p[0], p[1], p[2]); g.add(w); wh.push(w); });
    const fr = new THREE.Mesh(new THREE.BoxGeometry(.08, .08, 1.9), frameM); fr.position.set(0, .55, -.4); g.add(fr);
    const seat = new THREE.Mesh(new THREE.BoxGeometry(1.15, .35, .6), new THREE.MeshStandardMaterial({ color: [0xb52a3a, 0x1e4fa3, 0xe0a420, 0x23885f][k % 4], roughness: .5 })); seat.position.set(0, .85, .55); seat.castShadow = true; g.add(seat);
    const hood = new THREE.Mesh(new THREE.CylinderGeometry(.62, .62, .9, 20, 1, true, 0, Math.PI), new THREE.MeshStandardMaterial({ map: hoodTex[k % 4], side: THREE.DoubleSide, roughness: .6 })); hood.rotation.z = Math.PI / 2; hood.rotation.y = Math.PI / 2; hood.position.set(0, 1.15, .7); hood.castShadow = true; g.add(hood);
    rider(g, 0, 1.0, -.9, [0xf2f2f2, 0x3b6ea5, 0x9a3b3b][k % 3]);
    if (k % 2 === 0) rider(g, 0, 1.2, .55, [0x2d6e5c, 0xd98c3a][k % 2 ? 1 : 0]);
    g.scale.setScalar(1.15); return { g, wh };
  }
  function cng() {
    const g = new THREE.Group(); const wh = [];
    const body = new THREE.Mesh(new RoundedBoxGeometry(1.45, 1.25, 2.6, 3, .25), new THREE.MeshStandardMaterial({ color: 0x1f8a3c, roughness: .35, metalness: .2 })); body.position.y = .95; body.castShadow = true; g.add(body);
    const roof = new THREE.Mesh(new RoundedBoxGeometry(1.5, .12, 2.5, 2, .05), new THREE.MeshStandardMaterial({ color: 0x0f3d1d })); roof.position.y = 1.62; g.add(roof);
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(1.2, .55), new THREE.MeshStandardMaterial({ color: 0x223344, roughness: .1, metalness: .5 })); glass.position.set(0, 1.25, -1.31); glass.rotation.y = Math.PI; g.add(glass);
    [[-.6, .32, .8], [.6, .32, .8], [0, .32, -1.05]].forEach(p => { const w = new THREE.Mesh(new THREE.TorusGeometry(p[1], .1, 8, 20), tyreM); w.rotation.y = Math.PI / 2; w.position.set(p[0], p[1], p[2]); g.add(w); wh.push(w); });
    g.scale.setScalar(1.25); return { g, wh };
  }
  const lanes = [];
  for (let i = 0; i < 14; i++) {
    const v = (i % 5 === 2) ? cng() : rickshaw(i);
    const dir = i % 2 ? 1 : -1; const x = dir > 0 ? 2.3 : -2.3;
    v.g.rotation.y = dir > 0 ? Math.PI : 0;
    vehicles.push({ ...v, x: x + (r() - .5) * .8, z0: 20 - i * 16 - r() * 6, sp: (v.wh.length && i % 5 === 2 ? 7 : 3.4) * dir });
    s.add(v.g);
  }
  // pedestrians on sidewalks
  const peds = [];
  for (let i = 0; i < 26; i++) { const g = new THREE.Group(); rider(g, 0, .75, 0, [0xffffff, 0x2f5f9e, 0xa83a5a, 0x2d7a5a, 0xd9a03a, 0x444444][i % 6]); const sd = i % 2 ? 1 : -1; g.position.set(sd * (6.2 + r() * 1.1), .2, 25 - r() * 200); s.add(g); peds.push({ g, sp: (r() - .5) * 2.2 }); }

  // location pin (gold) + pulse rings
  const gold = new THREE.MeshStandardMaterial({ color: 0xd9ab52, metalness: 1, roughness: .22, envMapIntensity: 1.6 });
  const pin = new THREE.Group();
  const pinHead = new THREE.Mesh(new THREE.SphereGeometry(1.5, 32, 24), gold); pinHead.position.y = 3.6;
  const pinCone = new THREE.Mesh(new THREE.ConeGeometry(1.32, 3.2, 32, 1, true), gold); pinCone.rotation.x = Math.PI; pinCone.position.y = 1.9;
  const pinDot = new THREE.Mesh(new THREE.SphereGeometry(.62, 24, 16), new THREE.MeshStandardMaterial({ color: 0x0b1f3a, roughness: .3, metalness: .4 })); pinDot.position.set(0, 3.6, 1.0);
  pin.add(pinHead, pinCone, pinDot); pin.traverse(o => o.castShadow = true); s.add(pin);
  const PZ = -60;
  const rings = [0, 1, 2].map(() => { const m = new THREE.Mesh(new THREE.RingGeometry(.9, 1.15, 64), new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.set(0, .12, PZ); s.add(m); return m; });

  const cam = new THREE.PerspectiveCamera(42, W / H, .5, 900);
  function update(t) {
    const u = eio(P(t, 0, 4.1));
    cam.position.set(lerp(-14, 3, u), lerp(105, 17, u), lerp(70, -18, u));
    cam.lookAt(lerp(0, 0, u), lerp(0, 5, u), lerp(-55, -60, u));
    cam.rotateZ(lerp(.05, -.015, u));
    vehicles.forEach(v => { const z = v.z0 - v.sp * t; v.g.position.set(v.x, 0, z); v.wh.forEach(w => w.rotation.x = -t * v.sp * 2); });
    peds.forEach(p => { p.g.position.z += 0; p.g.userData.z0 ??= p.g.position.z; p.g.position.z = p.g.userData.z0 + p.sp * t; p.g.position.y = .2 + Math.abs(Math.sin(t * 6 + p.g.userData.z0)) * .05; });
    const d = P(t, 1.0, 1.75); const bounce = d < 1 ? lerp(42, 0, eout(d) ** 1) : 0;
    const sq = P(t, 1.75, 2.15); const squash = 1 + Math.sin(sq * Math.PI) * .18 * (1 - sq);
    pin.position.set(0, bounce + (t > 2.15 ? Math.sin((t - 2.15) * 3) * .35 + .35 : 0), PZ); pin.scale.set(1.25 * squash, 1.25 / squash, 1.25 * squash);
    pin.rotation.y = t * 1.3; pin.visible = t > .95;
    rings.forEach((m, i) => { const ph = ((t - 1.75 - i * .45) / 1.4); if (ph < 0) { m.material.opacity = 0; return; } const f = ph % 1; m.scale.setScalar(1 + f * 9); m.material.opacity = (1 - f) * .85; });
  }
  return { scene: s, cam, update };
}

// =====================================================================
// SCENE 2 — local LPG retail shop (problem)
// =====================================================================
function buildMarket() {
  const r = rng(21);
  const s = new THREE.Scene(); s.environment = envTex; s.background = sRGB(0x1a1c1f);
  s.fog = new THREE.Fog(0x24262a, 4, 13);
  s.add(new THREE.HemisphereLight(0xbfd2e6, 0x3a3226, .55));
  const bulb = new THREE.PointLight(0xffc27a, 9, 9, 1.6); bulb.position.set(.3, 2.6, .2); bulb.castShadow = true; bulb.shadow.mapSize.set(1024, 1024); s.add(bulb);
  const bulbMesh = new THREE.Mesh(new THREE.SphereGeometry(.06, 16, 12), new THREE.MeshBasicMaterial({ color: 0xfff1c9 })); bulbMesh.position.copy(bulb.position); s.add(bulbMesh);
  const day = new THREE.DirectionalLight(0xcfe4ff, 1.5); day.position.set(-3, 3, 4); day.castShadow = true; day.shadow.mapSize.set(2048, 2048); Object.assign(day.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4 }); s.add(day);
  const floorT = canvasTex(512, 512, (g, w, h) => { g.fillStyle = '#6f6a61'; g.fillRect(0, 0, w, h); noise(g, w, h, 12000, .3, r); g.strokeStyle = 'rgba(30,28,25,.45)'; g.lineWidth = 3; for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * 128, 0); g.lineTo(i * 128, h); g.stroke(); g.beginPath(); g.moveTo(0, i * 128); g.lineTo(w, i * 128); g.stroke(); } }, true); floorT.repeat.set(4, 4);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.MeshStandardMaterial({ map: floorT, roughness: .75 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; s.add(floor);
  const wallT = canvasTex(512, 512, (g, w, h) => { g.fillStyle = '#5f8a86'; g.fillRect(0, 0, w, h); noise(g, w, h, 9000, .22, r); const gr = g.createLinearGradient(0, h * .6, 0, h); gr.addColorStop(0, 'rgba(40,40,30,0)'); gr.addColorStop(1, 'rgba(40,40,30,.4)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }, true); wallT.repeat.set(3, 1);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(14, 4), new THREE.MeshStandardMaterial({ map: wallT, roughness: .95 })); wall.position.set(0, 2, -1.6); wall.receiveShadow = true; s.add(wall);
  // rolled shutter + platform
  const shut = new THREE.Mesh(new THREE.CylinderGeometry(.22, .22, 14, 24), new THREE.MeshStandardMaterial({ color: 0x8a8e93, metalness: .7, roughness: .35 })); shut.rotation.z = Math.PI / 2; shut.position.set(0, 3.1, .9); s.add(shut);
  const plat = new THREE.Mesh(new THREE.BoxGeometry(14, .16, 1.2), new THREE.MeshStandardMaterial({ color: 0x4b4741, roughness: .9 })); plat.position.set(0, .08, -.9); plat.receiveShadow = plat.castShadow = true; s.add(plat);
  // shelf w/ boxes
  const shelfM = new THREE.MeshStandardMaterial({ color: 0x6b4a2e, roughness: .8 });
  const shelf = new THREE.Mesh(new THREE.BoxGeometry(5, .05, .35), shelfM); shelf.position.set(1.5, 1.7, -1.42); s.add(shelf);
  for (let i = 0; i < 7; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(.3 + r() * .2, .25 + r() * .2, .25), new THREE.MeshStandardMaterial({ color: [0xb33a2c, 0x2c64a8, 0xd2a537, 0x2e8b57, 0xe3e0d6][i % 5], roughness: .7 })); b.position.set(-.6 + i * .6, 1.85, -1.42); s.add(b); }
  // regulators / hose coil on wall
  const hose = new THREE.Mesh(new THREE.TorusGeometry(.22, .02, 8, 40), new THREE.MeshStandardMaterial({ color: 0xe0661f, roughness: .5 })); hose.position.set(-1.8, 1.6, -1.55); s.add(hose);
  const hose2 = hose.clone(); hose2.position.x = -2.3; s.add(hose2);
  // cylinders in rows (generic colours, no brand marks)
  const cols = [0x1f6d3a, 0xa8231f, 0x1f4e8c, 0xd79a1c, 0x17766f, 0xa8231f, 0x1f6d3a, 0x1f4e8c, 0xd79a1c, 0xa8231f, 0x1f6d3a, 0x1f4e8c];
  for (let i = 0; i < 11; i++) { const c = makeCylinder(cols[i], { rough: .45 }); c.position.set(-3.2 + i * .52 + (r() - .5) * .05, .16, -1.0 + (r() - .5) * .08); c.rotation.y = r() * 6; c.scale.setScalar(1.45); s.add(c); }
  for (let i = 0; i < 8; i++) { const c = makeCylinder(cols[(i + 3) % cols.length], { rough: .45 }); c.position.set(-2.4 + i * .62 + (r() - .5) * .08, 0, -.05 + (r() - .5) * .1); c.rotation.y = r() * 6; c.scale.setScalar(1.45); s.add(c); }
  // dust motes in light
  const N = 400, pos = new Float32Array(N * 3); for (let i = 0; i < N; i++) { pos[i * 3] = (r() - .5) * 5; pos[i * 3 + 1] = r() * 3; pos[i * 3 + 2] = (r() - .2) * 3; }
  const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const dust = new THREE.Points(dg, new THREE.PointsMaterial({ color: 0xffe0b0, size: .012, transparent: true, opacity: .6, depthWrite: false, blending: THREE.AdditiveBlending })); s.add(dust);
  const cam = new THREE.PerspectiveCamera(38, W / H, .05, 60);
  function update(t) {
    const u = P(t, 3.6, 8.3); const e = sine(u);
    cam.position.set(lerp(2.3, -1.6, e), lerp(1.55, 1.15, e) + Math.sin(t * 1.7) * .012, lerp(3.4, 2.4, e) - ein(P(t, 7.5, 8.3)) * 1.2);
    cam.lookAt(lerp(.9, -1.0, e), lerp(.75, .7, e), -.6);
    cam.rotateZ(Math.sin(t * 1.3) * .006 + lerp(-.02, .02, e));
    dust.rotation.y = t * .05; dust.position.y = Math.sin(t * .5) * .05;
    bulb.intensity = 9 + Math.sin(t * 23) * .3;
  }
  return { scene: s, cam, update };
}

// =====================================================================
// SCENE 3/6 — brand stage with 3D logo medallion
// =====================================================================
const logoTex = new THREE.TextureLoader().load('logo.png'); logoTex.colorSpace = THREE.SRGBColorSpace; logoTex.anisotropy = 8;
function buildBrand() {
  const r = rng(33);
  const s = new THREE.Scene(); s.environment = envTex;
  const bg = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.ShaderMaterial({
    uniforms: { t: { value: 0 } }, depthWrite: false,
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `uniform float t; varying vec2 vUv; void main(){ vec2 p=vUv-.5; p.y*=1.0; float d=length(p*vec2(1.,.62));
      vec3 c=mix(vec3(.010,.032,.085),vec3(.0012,.004,.012),smoothstep(0.,.45,d));
      float rays=pow(max(0.,sin(atan(p.y,p.x)*9.+t*.25)),8.)*smoothstep(.45,.0,d)*.05; c+=vec3(.9,.7,.35)*rays;
      gl_FragColor=vec4(c,1.); }`
  })); bg.position.z = -12; s.add(bg);
  // bokeh
  const bok = [];
  for (let i = 0; i < 26; i++) { const m = new THREE.Mesh(new THREE.CircleGeometry(.35 + r() * .7, 32), new THREE.MeshBasicMaterial({ color: r() > .4 ? 0xe8b45a : 0x2fb3a7, transparent: true, opacity: .05 + r() * .08, blending: THREE.AdditiveBlending, depthWrite: false })); m.position.set((r() - .5) * 14, (r() - .5) * 22, -6 - r() * 4); s.add(m); bok.push({ m, sp: .1 + r() * .25, ph: r() * 6 }); }
  // gold dust particles
  const N = 900, pos = new Float32Array(N * 3), sz = new Float32Array(N), sp = new Float32Array(N);
  for (let i = 0; i < N; i++) { pos[i * 3] = (r() - .5) * 9; pos[i * 3 + 1] = (r() - .5) * 16; pos[i * 3 + 2] = -4 + r() * 6; sz[i] = 4 + r() * 16; sp[i] = .15 + r() * .5; }
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); pg.setAttribute('size', new THREE.BufferAttribute(sz, 1)); pg.setAttribute('sp', new THREE.BufferAttribute(sp, 1));
  const pm = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { t: { value: 0 }, a: { value: 1 } },
    vertexShader: `attribute float size; attribute float sp; uniform float t; varying float vA; void main(){ vec3 p=position; p.y=mod(p.y+t*sp+8.,16.)-8.; p.x+=sin(t*.6+position.y)*.15; vec4 mv=modelViewMatrix*vec4(p,1.); gl_PointSize=size*(6./-mv.z); vA=.35+.65*fract(sp*13.7); gl_Position=projectionMatrix*mv; }`,
    fragmentShader: `uniform float a; varying float vA; void main(){ float d=length(gl_PointCoord-.5); float k=smoothstep(.5,.0,d); gl_FragColor=vec4(vec3(1.,.8,.45)*k*vA*a,1.); }` });
  s.add(new THREE.Points(pg, pm));
  // halo rings
  const ringM = new THREE.MeshBasicMaterial({ color: 0xf0cf82, transparent: true, opacity: .55, blending: THREE.AdditiveBlending, depthWrite: false });
  const halo1 = new THREE.Mesh(new THREE.TorusGeometry(1.32, .006, 8, 160), ringM); const halo2 = new THREE.Mesh(new THREE.TorusGeometry(1.5, .003, 8, 160), ringM.clone()); halo2.material.opacity = .3;
  const glow = new THREE.Mesh(new THREE.CircleGeometry(2.4, 64), new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { a: { value: 1 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `uniform float a; varying vec2 vUv; void main(){ float d=length(vUv-.5)*2.; gl_FragColor=vec4(vec3(.95,.72,.35)*pow(max(0.,1.-d),2.2)*.35*a,1.); }` }));
  glow.position.z = -.3;
  // medallion
  const med = new THREE.Group();
  const front = new THREE.Mesh(new THREE.CircleGeometry(1, 128), new THREE.MeshBasicMaterial({ map: logoTex, transparent: true, alphaTest: .02 })); front.position.z = .041;
  const edgeM = new THREE.MeshStandardMaterial({ color: 0xd6a650, metalness: 1, roughness: .2, envMapIntensity: 2 });
  const edge = new THREE.Mesh(new THREE.CylinderGeometry(.995, .995, .08, 128, 1, true), edgeM); edge.rotation.x = Math.PI / 2;
  const back = new THREE.Mesh(new THREE.CircleGeometry(1, 128), new THREE.MeshStandardMaterial({ color: 0x0d2445, metalness: .6, roughness: .35 })); back.rotation.y = Math.PI; back.position.z = -.041;
  const backRim = new THREE.Mesh(new THREE.TorusGeometry(.985, .02, 12, 128), edgeM); backRim.position.z = -.04;
  // light sweep over the logo face
  const sweep = new THREE.Mesh(new THREE.CircleGeometry(1, 128), new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { p: { value: -2 }, map: { value: logoTex } },
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `uniform float p; uniform sampler2D map; varying vec2 vUv; void main(){ float a=texture2D(map,vUv).a; float d=(vUv.x+vUv.y*.6)-p; float b=exp(-d*d*120.)*.55+exp(-d*d*12.)*.12; gl_FragColor=vec4(vec3(1.,.93,.78)*b*a,1.); }` }));
  sweep.position.z = .043;
  med.add(front, edge, back, backRim, sweep);
  const key = new THREE.DirectionalLight(0xfff0d0, 2); key.position.set(2, 3, 4); s.add(key);
  const rim = new THREE.PointLight(0x4fd1c5, 6, 10); rim.position.set(-2.5, -1, -1); s.add(rim);
  const medWrap = new THREE.Group(); medWrap.add(glow, halo1, halo2, med); s.add(medWrap);
  const cam = new THREE.PerspectiveCamera(40, W / H, .1, 100); cam.position.set(0, 0, 5);
  function update(t) {
    s.children.forEach(() => { });
    bg.material.uniforms.t.value = t; pm.uniforms.t.value = t;
    bok.forEach(b => { b.m.position.y += 0; b.m.material.opacity = (.05 + .06 * (.5 + .5 * Math.sin(t * b.sp * 3 + b.ph))); });
    halo1.rotation.z = t * .2; halo2.rotation.z = -t * .12;
    let sc = .62, y = .28, rotY = 0, z = 0, vis = 1, glowA = 1, sw = -2;
    if (t < 15) { // first reveal 7.85 → 11.6
      const a = P(t, 8.05, 9.45); const e = eout5(a);
      rotY = lerp(-Math.PI * 2.5, 0, e); z = lerp(-9, 0, e); sc = lerp(.3, .62, eback(a));
      y = .28 + Math.sin(t * 1.6) * .015 * P(t, 9.4, 10);
      glowA = P(t, 8.6, 9.5);
      sw = lerp(-.8, 2.4, P(t, 9.55, 10.45));
      const out = eio(P(t, 10.95, 11.6)); y += out * 2.4; z -= out * 3; // exit up for depth transition
      cam.position.set(Math.sin(t * .3) * .08, 0, lerp(5.4, 5.0, P(t, 7.85, 11.6)));
    } else { // closing segment 21.2 → 30
      const a = P(t, 24.75, 25.75); const e = eout5(a);
      vis = t > 24.7 ? 1 : 0;
      rotY = lerp(Math.PI * 3, 0, e); z = lerp(-12, 0, e); sc = lerp(.25, .58, eback(a));
      y = 1.02 + Math.sin(t * 1.4) * .012 * P(t, 25.7, 26.3);
      glowA = P(t, 25.2, 26);
      sw = lerp(-.8, 2.4, P(t, 25.9, 26.8)) + (t > 28.3 ? lerp(-.8 - 1.6, 2.4, P(t, 28.3, 29.2)) + 1.6 - 2.4 + 0 : 0);
      if (t > 28.3) sw = lerp(-.8, 2.4, P(t, 28.3, 29.2));
      cam.position.set(Math.sin(t * .3) * .06, 0, 5);
    }
    med.rotation.set(Math.sin(t * .9) * .03 * (t > 9.5 ? 1 : 0), rotY, 0);
    medWrap.position.set(0, y, z); medWrap.scale.setScalar(sc); medWrap.visible = !!vis;
    glow.material.uniforms.a.value = glowA; halo1.material.opacity = .55 * glowA; halo2.material.opacity = .3 * glowA;
    sweep.material.uniforms.p.value = sw;
    cam.lookAt(0, 0, 0);
  }
  return { scene: s, cam, update };
}

// =====================================================================
// SCENE 4 — product studio: hero LPG cylinder + rice varieties
// =====================================================================
function buildProduct() {
  const r = rng(44);
  const s = new THREE.Scene(); s.environment = envTex;
  const cyc = new THREE.Mesh(new THREE.SphereGeometry(30, 48, 24), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false,
    vertexShader: `varying vec3 vp; void main(){ vp=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `varying vec3 vp; void main(){ vec3 n=normalize(vp); float h=n.y; float side=n.x; vec3 c=mix(vec3(.014,.04,.085),vec3(.05,.13,.22),smoothstep(-.1,.5,h)*smoothstep(1.,-.3,n.z)); c+=vec3(.04,.12,.13)*smoothstep(.2,1.,-side)*.6; gl_FragColor=vec4(c,1.); }` }));
  s.add(cyc);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(14, 96), new THREE.MeshPhysicalMaterial({ color: 0x0a1a30, roughness: .32, metalness: .3, clearcoat: .6, clearcoatRoughness: .25 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; s.add(floor);
  // soft floor spot
  const spotDisc = new THREE.Mesh(new THREE.CircleGeometry(3.2, 64), new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `varying vec2 vUv; void main(){ float d=length(vUv-.5)*2.; gl_FragColor=vec4(vec3(.25,.45,.6)*pow(max(0.,1.-d),2.)*.35,1.); }` })); spotDisc.rotation.x = -Math.PI / 2; spotDisc.position.y = .003; s.add(spotDisc);
  const key = new THREE.SpotLight(0xfff2de, 140, 20, .55, .6, 1.6); key.position.set(3, 6.5, 4); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -.0002; key.target.position.set(0, 1.2, 0); s.add(key, key.target);
  const rimL = new THREE.SpotLight(0x3fd0c4, 160, 18, .5, .7, 1.5); rimL.position.set(-4.5, 3.5, -3.5); rimL.target.position.set(0, 1.3, 0); s.add(rimL, rimL.target);
  const rimR = new THREE.SpotLight(0xffc26a, 140, 18, .5, .7, 1.5); rimR.position.set(4.5, 3, -3.5); rimR.target.position.set(0, 1.3, 0); s.add(rimR, rimR.target);
  const fill = new THREE.HemisphereLight(0x9fb8d8, 0x0a1220, .35); s.add(fill);
  // hero cylinder: neutral deep-blue enamel, no brand marks
  const hero = makeCylinder(0x173f7a, { rough: .22, collar: 0x173f7a, env: 1.4 }); hero.scale.setScalar(4.2); s.add(hero);
  // rice bowls: three varieties
  const bowlPts = []; for (let i = 0; i <= 24; i++) { const a = i / 24; bowlPts.push(new THREE.Vector2(.08 + Math.sin(a * Math.PI / 2) * .38, Math.pow(a, 1.6) * .3)); }
  const inner = []; for (let i = 24; i >= 0; i--) { const a = i / 24; inner.push(new THREE.Vector2(.07 + Math.sin(a * Math.PI / 2) * .36, .012 + Math.pow(a, 1.6) * .29)); }
  const bowlGeo = new THREE.LatheGeometry([...bowlPts, new THREE.Vector2(.465, .305), ...inner], 96);
  const brassBowl = new THREE.MeshStandardMaterial({ color: 0xc89b45, metalness: 1, roughness: .26, envMapIntensity: 1.6, side: THREE.DoubleSide });
  const ceramic = new THREE.MeshPhysicalMaterial({ color: 0xf2efe8, roughness: .2, clearcoat: 1, side: THREE.DoubleSide });
  const grainGeo = new THREE.SphereGeometry(1, 8, 6);
  const varieties = [
    { pos: v3(2.05, 0, 1.25), len: .052, rad: .0095, col: [0xf7f4ea, 0xefe9da], mat: ceramic },    // long slender white grain
    { pos: v3(1.1, 0, 2.1), len: .034, rad: .013, col: [0xfbf8f1, 0xf1ece0], mat: brassBowl },     // short plump white grain
    { pos: v3(2.9, 0, 2.15), len: .044, rad: .011, col: [0xe9d3a3, 0xdcc08a], mat: ceramic },      // parboiled (light golden)
  ];
  const bowls = [];
  const dummy = new THREE.Object3D();
  varieties.forEach((v, vi) => {
    const g = new THREE.Group(); const bowl = new THREE.Mesh(bowlGeo, v.mat); bowl.castShadow = bowl.receiveShadow = true; g.add(bowl);
    const n = 2600; const im = new THREE.InstancedMesh(grainGeo, new THREE.MeshStandardMaterial({ roughness: .55, color: 0xffffff }), n); im.castShadow = true; im.receiveShadow = true;
    const c = new THREE.Color();
    for (let i = 0; i < n; i++) {
      const rr = Math.sqrt(r()) * .36, a = r() * Math.PI * 2; const hh = .29 + .1 * Math.cos(rr / .36 * Math.PI / 2) - .02 + r() * .015;
      dummy.position.set(Math.cos(a) * rr, hh, Math.sin(a) * rr); dummy.rotation.set(r() * 3, r() * 3, r() * 3); dummy.scale.set(v.rad, v.rad, v.len / 2); dummy.updateMatrix(); im.setMatrixAt(i, dummy.matrix);
      c.set(v.col[i % 2]).offsetHSL(0, 0, (r() - .5) * .04); im.setColorAt(i, c);
    }
    g.add(im); g.position.copy(v.pos); g.scale.setScalar(1.0); s.add(g); bowls.push(g);
  });
  // pouring stream into the first bowl
  const NP = 700; const pour = new THREE.InstancedMesh(grainGeo, new THREE.MeshStandardMaterial({ roughness: .5, color: 0xf7f4ea }), NP); pour.castShadow = true; s.add(pour);
  const pr = []; for (let i = 0; i < NP; i++) pr.push({ ts: i / NP * 2.8, x: (r() - .5) * .05, z: (r() - .5) * .05, rx: r() * 6, ry: r() * 6, sp: .8 + r() * .4 });
  const cam = new THREE.PerspectiveCamera(34, W / H, .05, 100);
  const tmpL = v3(0, 0, 0);
  function update(t) {
    // hero rises from the floor (depth transition from medallion)
    const rise = eout5(P(t, 11.2, 12.2)); hero.position.y = lerp(-3.2, 0, rise); hero.rotation.y = lerp(-1.2, 0, rise) + t * .12;
    // camera: orbit around hero, then reframe to rice
    const o = P(t, 11.2, 14.55); const eo = eio(o);
    const ang = lerp(-.95, .55, eo), rad = lerp(9.2, 7.6, eo), hgt = lerp(1.6, 2.6, eo);
    const p1 = v3(Math.sin(ang) * rad, hgt, Math.cos(ang) * rad), l1 = v3(0, lerp(1.95, 2.05, eo), 0);
    const p2 = v3(lerp(3.7, 3.3, P(t, 14.6, 17.6)), lerp(3.3, 3.0, P(t, 14.6, 17.6)), lerp(6.6, 5.9, P(t, 14.6, 17.6))), l2 = v3(1.5, .05, 1.2);
    const k = eio(P(t, 14.35, 15.25));
    cam.position.lerpVectors(p1, p2, k); tmpL.lerpVectors(l1, l2, k); cam.lookAt(tmpL);
    // moving key light sweep
    key.position.set(Math.sin(t * .5) * 3.5 + 1, 6.5, 4);
    // bowls appear
    bowls.forEach((b, i) => { const a = P(t, 14.25 + i * .14, 14.95 + i * .14); b.scale.setScalar(Math.max(.0001, eback(a))); b.position.y = lerp(-.3, 0, eout(a)); b.visible = t > 14.2; });
    // pour
    const pt = t - 14.75; const base = bowls[0].position;
    for (let i = 0; i < NP; i++) {
      const q = pr[i]; const lt = pt - q.ts; let vis = lt > 0 && pt < 3.0;
      const fall = .5 * 9.8 * q.sp * lt * lt; const y = 2.9 - fall;
      if (y < .34) vis = false;
      dummy.position.set(base.x + q.x + Math.sin(lt * 9 + q.rx) * .01, y, base.z + q.z); dummy.rotation.set(q.rx + lt * 8, q.ry + lt * 5, 0);
      dummy.scale.set(vis ? .0095 : 0, vis ? .0095 : 0, vis ? .026 : 0); dummy.updateMatrix(); pour.setMatrixAt(i, dummy.matrix);
    }
    pour.instanceMatrix.needsUpdate = true;
  }
  return { scene: s, cam, update };
}

// =====================================================================
// SCENE 5 — Bangladeshi home kitchen
// =====================================================================
function buildKitchen() {
  const r = rng(55);
  const s = new THREE.Scene(); s.environment = envTex; s.background = sRGB(0xd9d2c4);
  s.add(new THREE.HemisphereLight(0xfff6e8, 0x6b5a46, 1.0));
  const win = new THREE.DirectionalLight(0xfff0d6, 3.2); win.position.set(-4, 3.2, 1.5); win.castShadow = true; win.shadow.mapSize.set(2048, 2048); Object.assign(win.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4 }); s.add(win);
  const fillL = new THREE.PointLight(0xffe2b8, 3, 8); fillL.position.set(1.5, 2.4, 2); s.add(fillL);
  const tiles = canvasTex(512, 512, (g, w, h) => { g.fillStyle = '#b9b4aa'; g.fillRect(0, 0, w, h); for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { const gr = g.createLinearGradient(x * 128, y * 128, x * 128 + 128, y * 128 + 128); gr.addColorStop(0, '#fbfbf8'); gr.addColorStop(1, '#e9ece9'); g.fillStyle = gr; g.fillRect(x * 128 + 3, y * 128 + 3, 122, 122); } }, true); tiles.repeat.set(8, 3);
  const wallT = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#efe4cf'; g.fillRect(0, 0, w, h); noise(g, w, h, 3000, .08, r); }, true);
  const tileWall = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 2.4), new THREE.MeshStandardMaterial({ map: tiles, roughness: .25 })); tileWall.position.set(0, 1.2, -.75); s.add(tileWall);
  const upWall = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 2), new THREE.MeshStandardMaterial({ map: wallT, roughness: .95 })); upWall.position.set(0, 3.4, -.75); s.add(upWall);
  const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(5, 4.4), new THREE.MeshStandardMaterial({ map: wallT, roughness: .95 })); leftWall.rotation.y = Math.PI / 2; leftWall.position.set(-3.2, 2.2, 1.5); s.add(leftWall);
  const floorT = canvasTex(512, 512, (g, w, h) => { g.fillStyle = '#8c8174'; g.fillRect(0, 0, w, h); for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) { g.fillStyle = (x + y) % 2 ? '#d8cfc0' : '#cfc5b4'; g.fillRect(x * 256 + 2, y * 256 + 2, 252, 252); } noise(g, w, h, 5000, .1, r); }, true); floorT.repeat.set(6, 6);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), new THREE.MeshStandardMaterial({ map: floorT, roughness: .5 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; s.add(floor);
  // counter: concrete base + black granite top
  const gran = canvasTex(512, 256, (g, w, h) => { g.fillStyle = '#1c1d1f'; g.fillRect(0, 0, w, h); for (let i = 0; i < 6000; i++) { const v = 60 + r() * 120; g.fillStyle = `rgba(${v},${v},${v * .95},${r() * .5})`; g.fillRect(r() * w, r() * h, 1.5, 1.5); } }, true);
  const counter = new THREE.Mesh(new THREE.BoxGeometry(3.6, .86, .75), new THREE.MeshStandardMaterial({ color: 0xd9d1c2, roughness: .9 })); counter.position.set(.6, .43, -.36); counter.castShadow = counter.receiveShadow = true; s.add(counter);
  const top = new THREE.Mesh(new THREE.BoxGeometry(3.7, .05, .8), new THREE.MeshPhysicalMaterial({ map: gran, roughness: .15, clearcoat: 1 })); top.position.set(.6, .885, -.36); top.receiveShadow = top.castShadow = true; s.add(top);
  // two-burner gas stove (switched off)
  const steelM = new THREE.MeshStandardMaterial({ color: 0xb8bcc2, metalness: .9, roughness: .25 });
  const stove = new THREE.Mesh(new RoundedBoxGeometry(.95, .1, .5, 2, .02), new THREE.MeshStandardMaterial({ color: 0x141414, metalness: .3, roughness: .15 })); stove.position.set(.55, .96, -.38); stove.castShadow = true; s.add(stove);
  [[.32], [.78]].forEach(([x]) => { const b = new THREE.Mesh(new THREE.TorusGeometry(.085, .018, 10, 32), steelM); b.rotation.x = Math.PI / 2; b.position.set(x, 1.02, -.38); s.add(b); const c = new THREE.Mesh(new THREE.CylinderGeometry(.045, .05, .03, 24), new THREE.MeshStandardMaterial({ color: 0xb08a3a, metalness: 1, roughness: .3 })); c.position.set(x, 1.03, -.38); s.add(c); for (let i = 0; i < 4; i++) { const st = new THREE.Mesh(new THREE.BoxGeometry(.12, .015, .015), new THREE.MeshStandardMaterial({ color: 0x222 })); st.position.set(x, 1.04, -.38); st.rotation.y = i * Math.PI / 4; s.add(st); } });
  [.42, .68].forEach(x => { const k = new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, .03, 20), steelM); k.rotation.x = Math.PI / 2; k.position.set(x, .96, -.12); s.add(k); });
  // aluminium pot (dekchi) on the right burner
  const potPts = [[0, 0], [.14, 0], [.16, .02], [.16, .17], [.175, .18], [.17, .19], [.15, .185], [.15, .03], [0, .03]].map(p => new THREE.Vector2(p[0], p[1]));
  const pot = new THREE.Mesh(new THREE.LatheGeometry(potPts, 48), new THREE.MeshStandardMaterial({ color: 0xc9ccd0, metalness: .85, roughness: .32, side: THREE.DoubleSide })); pot.position.set(.78, 1.045, -.38); pot.castShadow = true; s.add(pot);
  // spice jars on shelf
  const shelf = new THREE.Mesh(new THREE.BoxGeometry(2.2, .04, .25), new THREE.MeshStandardMaterial({ color: 0x7a5432, roughness: .7 })); shelf.position.set(1.0, 2.05, -.62); s.add(shelf);
  for (let i = 0; i < 6; i++) { const j = new THREE.Mesh(new THREE.CylinderGeometry(.07, .07, .2, 20), new THREE.MeshPhysicalMaterial({ color: 0xffffff, transmission: .0, roughness: .1, transparent: true, opacity: .9 })); j.position.set(.2 + i * .3, 2.17, -.6); s.add(j); const f = new THREE.Mesh(new THREE.CylinderGeometry(.062, .062, .14, 20), new THREE.MeshStandardMaterial({ color: [0xd9a31c, 0xb6361f, 0x6b3d1d, 0xe7d8a8, 0x3d6b2a, 0xc9581e][i] })); f.position.set(.2 + i * .3, 2.14, -.6); s.add(f); const lid = new THREE.Mesh(new THREE.CylinderGeometry(.073, .073, .03, 20), new THREE.MeshStandardMaterial({ color: 0xc0392b })); lid.position.set(.2 + i * .3, 2.285, -.6); s.add(lid); }
  // window with grill on left wall (light source)
  const winFrame = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.2), new THREE.MeshBasicMaterial({ color: 0xfff8e6 })); winFrame.rotation.y = Math.PI / 2; winFrame.position.set(-3.19, 2.0, .8); s.add(winFrame);
  for (let i = 0; i < 8; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(.03, 1.2, .03), new THREE.MeshStandardMaterial({ color: 0x2b2b2b })); b.position.set(-3.17, 2.0, .2 + i * .17); s.add(b); }
  // LPG cylinder standing safely on the floor beside the counter, with regulator + hose
  const cyl = makeCylinder(0x173f7a, { rough: .25 }); cyl.scale.setScalar(1.5); cyl.position.set(-1.55, 0, -.25); cyl.rotation.y = .8; s.add(cyl);
  const reg = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, .07, 24), new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: .4 })); reg.position.set(-1.55, 1.03, -.25); s.add(reg);
  const hoseC = new THREE.CatmullRomCurve3([v3(-1.55, 1.05, -.25), v3(-1.3, 1.2, -.45), v3(-.6, 1.0, -.6), v3(.0, .97, -.55)]);
  const hose = new THREE.Mesh(new THREE.TubeGeometry(hoseC, 40, .014, 8), new THREE.MeshStandardMaterial({ color: 0xe0661f, roughness: .5 })); s.add(hose);
  const cam = new THREE.PerspectiveCamera(40, W / H, .05, 50);
  function update(t) {
    const u = sine(P(t, 17.15, 21.6));
    cam.position.set(lerp(-.6, -.15, u), lerp(1.85, 1.65, u), lerp(4.2, 3.4, u));
    cam.lookAt(lerp(-.3, -.1, u), lerp(1.3, 1.25, u), -.4);
  }
  return { scene: s, cam, update };
}

// ---------- build all ----------
const S = { hood: buildHood(), market: buildMarket(), brand: buildBrand(), product: buildProduct(), kitchen: buildKitchen() };
// grading per scene: [r,g,b,saturation], [exposure, tonemap]
const GR = {
  hood: [[1.04, 1.0, .93, 1.22], [.82, 1]],
  market: [[.92, 1.0, 1.07, .85], [.72, 1]],
  brand: [[1, 1, 1, 1], [1, 0]],
  product: [[1, 1, 1, 1.1], [.78, 1]],
  kitchen: [[1.03, 1.0, .94, 1.08], [.85, 1]],
};
// scene schedule: [name, start, end]
const SEG = [['hood', 0, 4.05], ['market', 3.6, 8.3], ['brand', 7.85, 11.65], ['product', 11.2, 17.6], ['kitchen', 17.15, 21.65], ['brand', 21.2, 30.1]];
// transitions [start, end, mode]  (mode 1 zoom-blur, 2 golden wipe, 0 fade)
const TR = [[3.6, 4.05, 1], [7.85, 8.3, 2], [11.2, 11.65, 1], [17.15, 17.6, 2], [21.2, 21.65, 1]];

function renderScene(name, t, rt) {
  const sc = S[name]; sc.update(t);
  renderer.setRenderTarget(rt); renderer.render(sc.scene, sc.cam);
}
function setGrade(which, name) { const g = GR[name]; compMat.uniforms['g' + which].value.set(...g[0]); compMat.uniforms['e' + which].value.set(...g[1]); }

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

window.renderAt = function (t) {
  t = Math.min(Math.max(t, 0), DUR - 1e-4);
  const act = SEG.filter(s => t >= s[1] && t < s[2]);
  let tr = TR.find(x => t >= x[0] && t < x[1]);
  const A = act[0][0]; renderScene(A, t, rtA); setGrade('A', A);
  if (act.length > 1 && tr) {
    const B = act[1][0];
    // brand scene appears twice; disambiguate the time-mapped instance
    renderScene(B, t, rtB); setGrade('B', B);
    const m = P(t, tr[0], tr[1]); const em = eio(m);
    compMat.uniforms.mixv.value = tr[2] === 2 ? m : em; compMat.uniforms.mode.value = tr[2];
    const zb = tr[2] === 1 ? Math.sin(m * Math.PI) * .16 : 0; compMat.uniforms.zA.value = zb; compMat.uniforms.zB.value = zb;
  } else { compMat.uniforms.mixv.value = 0; compMat.uniforms.zA.value = 0; compMat.uniforms.zB.value = 0; compMat.uniforms.mode.value = 0; }
  compMat.uniforms.time.value = t;
  compMat.uniforms.vig.value = .38;
  compMat.uniforms.fade.value = 1 - P(t, 0, .18); // fade from black
  renderer.setRenderTarget(null); renderer.render(compScene, compCam);
  overlays(t);
  return true;
};

window.__ready = (async () => {
  try { const c = await (await fetch('contact.json', { cache: 'no-store' })).json(); setPhone(c.phone_display, !!c.is_placeholder); } catch (e) { }
  await document.fonts.load('700 80px "Hind Siliguri"', 'দারুন্নাজাত'); await document.fonts.load('500 40px "Hind Siliguri"', 'আপনার');
  await document.fonts.load('800 40px Montserrat', 'LPG'); await document.fonts.load('600 40px Montserrat', 'A'); await document.fonts.load('700 40px "Playfair Display"', 'Dubai');
  await document.fonts.ready;
  await new Promise(res => { const chk = () => logoTex.image && logoTex.image.complete ? res() : setTimeout(chk, 30); chk(); });
  // warm up every scene once (shader compile)
  for (const tt of [1, 5, 9, 13, 16, 19, 23, 27]) window.renderAt(tt);
  return true;
})();
