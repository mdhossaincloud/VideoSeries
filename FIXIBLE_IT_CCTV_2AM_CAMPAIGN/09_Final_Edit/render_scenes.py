#!/usr/bin/env python3
"""FIXIBLE IT - The 2 AM CCTV Incident: scene renderer (2.5D camera, atmosphere, grade, overlays).
Usage: python3 render_scenes.py <timeline.json> <out_frame_dir>
Each shot renders its own plate with a keyframed camera (zoom/centre), lamp flicker, drifting fog,
LED pulse, CCTV-POV treatment, grade, vignette and film grain. Output: PNG frames @30fps 1080x1920.
"""
import json, math, os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H, FPS = 1080, 1920, 30
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PLATES = os.path.join(ROOT, "05_Scene_Renders", "plates")
FONT_MONO = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf"
rng = np.random.default_rng(7)

def ease_io(x):
    x = min(max(x, 0.0), 1.0)
    return x * x * (3 - 2 * x)

def lerp(a, b, t):
    return a + (b - a) * t

_plate_cache = {}
_ov_cache = {}
def _ov(path):
    if path not in _ov_cache:
        _ov_cache[path] = Image.open(os.path.join(ROOT, path)).convert("RGBA")
    return _ov_cache[path]
def plate(name):
    if name not in _plate_cache:
        im = Image.open(os.path.join(PLATES, name + ".png")).convert("RGB")
        # 2x Lanczos upsample so push-ins up to ~1.6x keep detail
        _plate_cache[name] = im.resize((W * 2, H * 2), Image.LANCZOS)
    return _plate_cache[name]

def camera(img, zoom, cx, cy, rot=0.0):
    """Crop a W*H window (in source px of a 2x plate) centred at (cx,cy) normalised, at zoom>=1."""
    sw, sh = img.size
    cw, ch = sw / zoom, sh / zoom
    x0 = min(max(cx * sw - cw / 2, 0), sw - cw)
    y0 = min(max(cy * sh - ch / 2, 0), sh - ch)
    if rot:
        img = img.rotate(rot, resample=Image.BICUBIC, center=(x0 + cw / 2, y0 + ch / 2))
    return img.resize((W, H), Image.BICUBIC, box=(x0, y0, x0 + cw, y0 + ch)), (x0, y0, cw, ch, sw, sh)

# --- precomputed textures -------------------------------------------------
def make_fog():
    small = rng.random((48, 27)).astype(np.float32)
    im = Image.fromarray((small * 255).astype(np.uint8)).resize((W * 2, H), Image.BICUBIC)
    im = im.filter(ImageFilter.GaussianBlur(40))
    a = np.asarray(im, np.float32) / 255.0
    a = (a - a.min()) / (a.max() - a.min() + 1e-6)
    return a
FOG = make_fog()
GRAIN = [rng.normal(0, 1, (H // 2, W // 2)).astype(np.float32) for _ in range(6)]
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
VIG = 1 - 0.55 * np.clip((((xx - W / 2) / (W * 0.62)) ** 2 + ((yy - H / 2) / (H * 0.6)) ** 2), 0, 1) ** 1.4

def grade(arr, g):
    """arr float 0..1 HxWx3. g: dict(lift, gain, sat, tint, contrast)."""
    lift = np.array(g.get("lift", [0.0, 0.0, 0.0]), np.float32)
    gain = np.array(g.get("gain", [1.0, 1.0, 1.0]), np.float32)
    arr = arr * gain + lift * (1 - arr)
    lum = arr @ np.array([0.2126, 0.7152, 0.0722], np.float32)
    s = g.get("sat", 1.0)
    arr = lum[..., None] + (arr - lum[..., None]) * s
    c = g.get("contrast", 1.0)
    arr = (arr - 0.5) * c + 0.5
    return np.clip(arr, 0, 1)

def radial(cx, cy, r):
    d = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2) / r
    return np.clip(1 - d, 0, 1) ** 2

def barrel(arr, k=0.18):
    nx = (xx - W / 2) / (W / 2); ny = (yy - H / 2) / (H / 2)
    r2 = nx * nx * 0.6 + ny * ny * 0.4
    f = 1 + k * r2
    sx = np.clip((nx / f) * (W / 2) + W / 2, 0, W - 1).astype(np.int32)
    sy = np.clip((ny / f) * (H / 2) + H / 2, 0, H - 1).astype(np.int32)
    return arr[sy, sx]

def overlay_pov(im, t, stamp):
    d = ImageDraw.Draw(im)
    f_big = ImageFont.truetype(FONT_MONO, 44); f_sm = ImageFont.truetype(FONT_MONO, 34)
    # frame corners
    for (x, y, sx, sy) in [(60, 200, 1, 1), (W - 60, 200, -1, 1), (60, H - 360, 1, -1), (W - 60, H - 360, -1, -1)]:
        d.line([(x, y), (x + 70 * sx, y)], fill=(235, 235, 235), width=5)
        d.line([(x, y), (x, y + 70 * sy)], fill=(235, 235, 235), width=5)
    if int(t * 2) % 2 == 0:
        d.ellipse([90, 236, 124, 270], fill=(235, 30, 30))
    d.text((140, 230), "REC", font=f_big, fill=(240, 240, 240))
    d.text((W - 330, 232), "CAM 01", font=f_sm, fill=(240, 240, 240))
    d.text((90, H - 395), stamp, font=f_big, fill=(255, 255, 255))
    return im

def render_shot(s, t_local, frame_idx):
    dur = s["dur"]; p = t_local / dur
    k0, k1 = s["cam"][0], s["cam"][1]
    e = ease_io(p) if s.get("ease", True) else p
    zoom = lerp(k0[0], k1[0], e); cx = lerp(k0[1], k1[1], e); cy = lerp(k0[2], k1[2], e)
    # optional snap-in at a time (reaction / reveal)
    if "snap" in s:
        ts, amt = s["snap"]
        if t_local >= ts:
            q = min((t_local - ts) / 0.12, 1.0)
            zoom *= 1 + amt * (1 - (1 - q) ** 3)
    rot = 0.0
    if "shake" in s:
        ts, amp = s["shake"]
        if t_local >= ts:
            decay = math.exp(-(t_local - ts) * 6)
            cx += amp * decay * math.sin(t_local * 61) / 1000
            cy += amp * decay * math.cos(t_local * 47) / 1000
            rot = amp * decay * math.sin(t_local * 37) * 0.02
    # gentle handheld breathing for live-action feel
    cx += 0.0016 * math.sin(t_local * 1.3 + frame_idx * 0.0) ; cy += 0.0012 * math.sin(t_local * 0.9 + 1)
    img, box = camera(plate(s["plate"]), zoom, cx, cy, rot)
    x0, y0, cw, ch, sw, sh = box
    def P(nx, ny, nr):  # plate-normalised -> output pixel coords
        return (nx * sw - x0) / cw * W, (ny * sh - y0) / ch * H, nr * W * (sw / cw)
    arr = np.asarray(img, np.float32) / 255.0

    # lamp flicker (sodium vapour): global + local glow
    if "lamp" in s:
        lx, ly, lr = P(*s["lamp"])
        fl = 1.0
        ph = (t_local * 7.3) % 1
        if int(t_local * 3.1) % 4 == 2 and ph < 0.35:
            fl = 0.72 + 0.2 * math.sin(ph * 60)
        glow = radial(lx, ly, lr)[..., None] * np.array([1.0, 0.62, 0.25], np.float32) * 0.22 * fl
        arr = arr * (0.9 + 0.1 * fl) + glow
    # fog drift
    if s.get("fog", 0) > 0:
        off = int((t_local + s.get("t0", 0)) * 38) % W
        fog = FOG[:, off:off + W]
        if fog.shape[1] < W:
            fog = np.concatenate([fog, FOG[:, :W - fog.shape[1]]], 1)
        fog = fog * np.linspace(0.35, 1.0, H, dtype=np.float32)[:, None]
        arr = arr + (1 - arr) * fog[..., None] * s["fog"] * np.array([0.55, 0.62, 0.75], np.float32)
    # red LED pulse
    if "led" in s:
        lx, ly, lr = P(*s["led"])
        pulse = 0.55 + 0.45 * math.sin(t_local * 6.3)
        arr = arr + radial(lx, ly, lr)[..., None] * np.array([1.0, 0.08, 0.06], np.float32) * 0.55 * pulse
    # red wash from above (camera's gaze) on reaction
    if "redwash" in s:
        ts, amt = s["redwash"]
        if t_local >= ts:
            a = min((t_local - ts) / 0.25, 1) * (0.75 + 0.25 * math.sin(t_local * 9))
            grad = np.clip(1 - yy / (H * 0.75), 0, 1)[..., None]
            arr = arr + grad * np.array([0.9, 0.05, 0.05], np.float32) * amt * a
    arr = grade(arr, s.get("grade", {}))
    if s.get("pov"):
        lum = arr @ np.array([0.3, 0.59, 0.11], np.float32)
        lum = np.clip((lum - 0.04) * 1.6, 0, 1)
        arr = np.stack([lum * 0.86, lum * 0.98, lum * 0.9], -1)
        arr = barrel(arr, 0.22)
        arr *= (0.94 + 0.06 * np.sin(yy * 1.6))[..., None]  # scanlines
    arr *= VIG[..., None]
    # fade in/out
    fi, fo = s.get("fade_in", 0), s.get("fade_out", 0)
    if fi and t_local < fi: arr *= t_local / fi
    if fo and t_local > dur - fo: arr *= max(0, (dur - t_local) / fo)
    if "flash" in s:
        ts, amt = s["flash"]
        if ts <= t_local < ts + 0.2:
            arr = arr + (1 - arr) * amt * (1 - (t_local - ts) / 0.2)
    # grain
    g = GRAIN[frame_idx % len(GRAIN)]
    g = np.asarray(Image.fromarray(g).resize((W, H), Image.BILINEAR), np.float32)
    arr = arr + g[..., None] * s.get("grain", 0.025)
    out = Image.fromarray((np.clip(arr, 0, 1) * 255).astype(np.uint8))
    if s.get("pov"):
        out = overlay_pov(out, t_local, "02:00:%02d AM" % (17 + int(t_local)))
    if "text" in s:
        path, tin, fd = s["text"]
        if t_local >= tin:
            ov = _ov(path)
            al = min((t_local - tin) / fd, 1.0)
            if fo and t_local > dur - fo: al *= max(0, (dur - t_local) / fo)
            dy = int((1 - al) * 30)
            o = ov.copy(); o.putalpha(o.getchannel("A").point(lambda v: int(v * al)))
            out.paste(o, (0, dy), o)
    return out

def main():
    tl = json.load(open(sys.argv[1])); out = sys.argv[2]
    os.makedirs(out, exist_ok=True)
    only = sys.argv[3] if len(sys.argv) > 3 else None
    n = 0
    for s in tl["shots"]:
        frames = round(s["dur"] * FPS)
        if only and s["id"] != only:
            n += frames; continue
        for i in range(frames):
            render_shot(s, i / FPS, n).save(os.path.join(out, f"f{n:04d}.png"), compress_level=1)
            n += 1
        print(s["id"], "done ->", n, flush=True)

if __name__ == "__main__":
    main()
