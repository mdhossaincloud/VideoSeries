#!/usr/bin/env python3
"""Original, procedurally synthesised soundscape + score for 'The 2 AM CCTV Incident'.
All sounds generated from scratch (noise/oscillators) -> 100% original, no third-party licensing.
Usage: python3 sound_design.py cues.json out_dir
Writes stems (ambience, sfx, music) as 48 kHz stereo WAV.
"""
import json, os, sys
import numpy as np
import soundfile as sf

SR = 48000
rng = np.random.default_rng(11)

def t_axis(d): return np.arange(int(d * SR)) / SR
def env(n, a, r):
    e = np.ones(n); a = min(int(a * SR), n // 2); r = min(int(r * SR), n // 2)
    if a: e[:a] = np.linspace(0, 1, a)
    if r: e[-r:] *= np.linspace(1, 0, r)
    return e
def lp(x, cut):  # one-pole lowpass
    a = np.exp(-2 * np.pi * cut / SR); y = np.empty_like(x); s = 0.0
    for i in range(len(x)): s = (1 - a) * x[i] + a * s; y[i] = s
    return y
def lp_fast(x, cut, passes=2):
    # FFT brickwall-ish smooth lowpass (fast for long buffers)
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= 1 / (1 + (f / cut) ** (2 * passes)); return np.fft.irfft(X, len(x))
def hp_fast(x, cut, passes=2):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= 1 - 1 / (1 + (f / max(cut, 1)) ** (2 * passes)); return np.fft.irfft(X, len(x))
def bp_fast(x, lo, hi): return hp_fast(lp_fast(x, hi), lo)
def place(buf, snd, t, gain=1.0, pan=0.0):
    i = int(t * SR); n = min(len(snd), len(buf) - i)
    if n <= 0: return
    l = np.cos((pan + 1) * np.pi / 4); r = np.sin((pan + 1) * np.pi / 4)
    buf[i:i + n, 0] += snd[:n] * gain * l * 1.414
    buf[i:i + n, 1] += snd[:n] * gain * r * 1.414

# ---------- sound sources ----------
def wind(d):
    n = rng.normal(0, 1, int(d * SR))
    b = bp_fast(n, 150, 900)
    mod = 0.6 + 0.4 * np.sin(2 * np.pi * 0.17 * t_axis(d) + 1) * np.sin(2 * np.pi * 0.07 * t_axis(d))
    return b * mod / (np.abs(b).max() + 1e-9)
def city_rumble(d):
    n = rng.normal(0, 1, int(d * SR)); b = lp_fast(n, 180)
    t = t_axis(d); b *= 0.7 + 0.3 * np.sin(2 * np.pi * 0.05 * t)
    # distant horn (tonal, very soft)
    return b / (np.abs(b).max() + 1e-9)
def far_horn(d=1.2):
    t = t_axis(d); s = np.sign(np.sin(2 * np.pi * 410 * t)) * 0.5 + np.sin(2 * np.pi * 515 * t) * 0.5
    s = lp_fast(s, 1200) * env(len(t), 0.08, 0.5); return s / np.abs(s).max()
def drone(d, f=41.2):
    t = t_axis(d)
    s = np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * f * 1.5 * t + 0.3) + 0.25 * np.sin(2 * np.pi * f * 2.01 * t)
    s *= 0.75 + 0.25 * np.sin(2 * np.pi * 0.25 * t)
    return s / np.abs(s).max()
def footstep(heavy=1.0):
    d = 0.32; t = t_axis(d); n = rng.normal(0, 1, len(t))
    scuff = bp_fast(n, 300, 3500) * np.exp(-t * 28)
    thud = np.sin(2 * np.pi * 70 * t) * np.exp(-t * 35) * heavy
    wet = bp_fast(rng.normal(0, 1, len(t)), 2000, 8000) * np.exp(-((t - 0.03) ** 2) / 0.0004) * 0.4
    s = scuff * 0.6 + thud + wet; return s / np.abs(s).max()
def heartbeat():
    d = 0.7; t = t_axis(d)
    b = lambda t0: np.sin(2 * np.pi * 55 * (t - t0)) * np.exp(-np.clip(t - t0, 0, None) * 22) * (t >= t0)
    s = b(0) + 0.7 * b(0.22); return lp_fast(s, 200) / 1.2
def riser(d):
    t = t_axis(d); f = 200 * (12 ** (t / d))
    ph = 2 * np.pi * np.cumsum(f) / SR
    noise = hp_fast(rng.normal(0, 1, len(t)), 1500) * (t / d) ** 2
    s = 0.4 * np.sin(ph) + 0.25 * np.sin(ph * 1.5) + 0.35 * noise
    return s * (t / d) ** 1.5 / np.abs(s).max()
def impact():
    d = 2.6; t = t_axis(d)
    boom = np.sin(2 * np.pi * (38 + 60 * np.exp(-t * 9)) * t) * np.exp(-t * 2.2)
    crack = hp_fast(rng.normal(0, 1, len(t)), 800) * np.exp(-t * 30) * 0.8
    tail = lp_fast(rng.normal(0, 1, len(t)), 900) * np.exp(-t * 2.5) * 0.35
    s = boom + crack + tail; return s / np.abs(s).max()
def bass_hit():
    d = 1.6; t = t_axis(d)
    s = np.sin(2 * np.pi * (45 + 40 * np.exp(-t * 12)) * t) * np.exp(-t * 3.2)
    s += 0.25 * np.tanh(4 * s); return s / np.abs(s).max()
def surveil_tone():
    d = 1.4; t = t_axis(d)
    s = np.sin(2 * np.pi * 1760 * t) * (np.sin(2 * np.pi * 9 * t) > 0) * env(len(t), 0.01, 0.4) * 0.5
    servo = bp_fast(rng.normal(0, 1, len(t)), 600, 2200) * np.sin(2 * np.pi * 52 * t) * env(len(t), 0.05, 0.3) * (t < 0.6)
    s = s + 0.6 * servo; return s / np.abs(s).max()
def beep(f=2400, d=0.09):
    t = t_axis(d); return np.sin(2 * np.pi * f * t) * env(len(t), 0.005, 0.03)
def whoosh(d=0.6):
    t = t_axis(d); n = rng.normal(0, 1, len(t))
    s = bp_fast(n, 400, 5000) * np.sin(np.pi * t / d) ** 2; return s / np.abs(s).max()
def shimmer(d=1.2):
    t = t_axis(d); s = sum(np.sin(2 * np.pi * f * t) * np.exp(-t * 2.5) for f in (1567.98, 2093.0, 2637.0))
    return s / np.abs(s).max()

# ---------- music ----------
def note(f, d, kind="pad"):
    t = t_axis(d)
    if kind == "pad":
        s = sum(np.sin(2 * np.pi * f * dt * t + p) for dt, p in ((1, 0), (1.003, 1), (0.997, 2), (2.0, .5)))
        return lp_fast(s, 2400) * env(len(t), 0.6, 0.8) / 4
    if kind == "pluck":
        s = (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t)) * np.exp(-t * 5)
        return s * env(len(t), 0.004, 0.05)
    if kind == "sub":
        return np.sin(2 * np.pi * f * t) * env(len(t), 0.02, 0.2)
def hz(m): return 440 * 2 ** ((m - 69) / 12)

def tension_bed(d):
    t = t_axis(d)
    s = drone(d, 41.2) * 0.6
    # dissonant minor-second cluster that slowly breathes
    s += 0.18 * lp_fast(np.sin(2 * np.pi * 233.08 * t) + np.sin(2 * np.pi * 246.94 * t), 800) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.3 * t))
    # ticking clock-like pulse (2 AM)
    for k in np.arange(0, d, 0.5):
        i = int(k * SR); tick = beep(3200, 0.02) * 0.12
        s[i:i + len(tick)] += tick[:max(0, len(s) - i)]
    return s / np.abs(s).max()

def brand_music(d, bpm=100):
    """Confident, warm resolution in D major: pad Dmaj9 -> Bm7 -> G -> A, pluck arpeggio, soft kick."""
    out = np.zeros(int(d * SR)); beat = 60 / bpm
    chords = [[62, 66, 69, 73, 76], [59, 62, 66, 69], [55, 59, 62, 67], [57, 61, 64, 69]]
    bar = beat * 4; i = 0; t0 = 0.0
    while t0 < d:
        ch = chords[i % 4]
        for m in ch:
            p = note(hz(m), min(bar + 0.8, d - t0), "pad"); place1(out, p * 0.5, t0)
        place1(out, note(hz(ch[0] - 24), min(bar, d - t0), "sub") * 0.55, t0)
        for k in range(8):
            tt = t0 + k * beat / 2
            if tt < d: place1(out, note(hz(ch[k % len(ch)] + 12), 0.5, "pluck") * 0.35, tt)
        for k in range(4):
            tt = t0 + k * beat
            if tt < d: place1(out, kick() * 0.45, tt)
        t0 += bar; i += 1
    return out / np.abs(out).max()
def place1(buf, s, t):
    i = int(t * SR); n = min(len(s), len(buf) - i)
    if n > 0: buf[i:i + n] += s[:n]
def kick():
    t = t_axis(0.35); return np.sin(2 * np.pi * (50 + 90 * np.exp(-t * 30)) * t) * np.exp(-t * 9)

def main():
    cues = json.load(open(sys.argv[1])); out = sys.argv[2]; os.makedirs(out, exist_ok=True)
    D = cues["duration"]; N = int(D * SR)
    amb = np.zeros((N, 2)); sfx = np.zeros((N, 2)); mus = np.zeros((N, 2))
    tb = cues["tension_end"]; bs = cues["brand_music_start"]
    # ambience (night street) until brand section, fading
    w = wind(tb + 1.0); place(amb, w * env(len(w), 0.8, 1.2), 0, 0.10, -0.3)
    w2 = wind(tb + 1.0); place(amb, w2 * env(len(w2), 0.8, 1.2), 0, 0.08, 0.35)
    c = city_rumble(tb + 1.0); place(amb, c * env(len(c), 1.0, 1.2), 0, 0.12)
    place(amb, far_horn() , 1.6, 0.035, 0.6)
    # tension bed
    tbed = tension_bed(tb); tbed *= env(len(tbed), 0.5, 0.6); place(mus, tbed, 0, 0.16)
    # sfx cues
    lib = {"footstep": lambda: footstep(), "heartbeat": heartbeat, "impact": impact, "bass_hit": bass_hit,
           "surveil": surveil_tone, "beep": lambda: beep(), "whoosh": lambda: whoosh(), "shimmer": lambda: shimmer()}
    for c in cues["sfx"]:
        if c["type"] == "riser": snd = riser(c["dur"])
        else: snd = lib[c["type"]]()
        place(sfx, snd, c["t"], c.get("gain", 0.5), c.get("pan", 0.0))
    # brand music
    bm = brand_music(D - bs); bm *= env(len(bm), 0.8, 1.0); place(mus, bm, bs, 0.22)
    for name, b in (("ambience", amb), ("sfx", sfx), ("music", mus)):
        sf.write(os.path.join(out, f"stem_{name}.wav"), b.astype(np.float32), SR)
    print("stems written", D)

if __name__ == "__main__":
    main()
