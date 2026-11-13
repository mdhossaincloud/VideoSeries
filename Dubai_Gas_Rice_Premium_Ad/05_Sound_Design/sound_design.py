"""Original music + sound design for Dubai Gas & Rice commercial (100% synthesised, royalty-free).
Outputs (48 kHz, 24-bit, stereo, exactly 30.0 s): music.wav, sfx.wav
Cue times are locked to the timed voiceover (02_Voiceover/VO_timed_30s.wav)."""
import numpy as np, wave, os
SR = 48000; DUR = 30.0; N = int(SR * DUR)
rng = np.random.default_rng(11)
t_all = np.arange(N) / SR
OUT = os.path.dirname(os.path.abspath(__file__))

def lp(x, fc):  # one-pole lowpass (fc may be array)
    a = np.exp(-2 * np.pi * np.asarray(fc) / SR) * np.ones_like(x)
    y = np.empty_like(x); s = 0.0
    for i in range(len(x)): s = (1 - a[i]) * x[i] + a[i] * s; y[i] = s
    return y
def lp_fast(x, fc):  # fixed-cutoff one-pole lowpass
    from scipy.signal import lfilter
    a = np.exp(-2 * np.pi * fc / SR); return lfilter([1 - a], [1, -a], x)
def hp_fast(x, fc): return x - lp_fast(x, fc)
def env(n, a, d, sus=1.0, rel=None):
    e = np.ones(n) * sus; ai = int(a * SR); e[:ai] = np.linspace(0, 1, ai) if ai else e[:ai]
    if rel: ri = int(rel * SR); e[-ri:] *= np.linspace(1, 0, ri)
    return e
def place(buf, sig, t0, gain=1.0, pan=0.0):
    i = int(t0 * SR); j = min(N, i + len(sig))
    if j <= i: return
    l = np.cos((pan + 1) * np.pi / 4); r = np.sin((pan + 1) * np.pi / 4)
    buf[0, i:j] += sig[:j - i] * gain * l * 1.414; buf[1, i:j] += sig[:j - i] * gain * r * 1.414
def mtof(m): return 440 * 2 ** ((m - 69) / 12)

# ------------------------------------------------------------------ MUSIC
mus = np.zeros((2, N))
BPM = 100; beat = 60 / BPM; bar = 4 * beat
# chord plan (MIDI notes) per section
Bm = [47, 54, 59, 62, 66]; G = [43, 55, 59, 62, 67]; D = [38, 54, 57, 62, 66]; A = [45, 52, 57, 61, 64]
Em = [40, 55, 59, 64, 67]; Fs = [42, 54, 58, 61, 66]
plan = [  # (start, end, chord)
    (0.0, 3.9, D), (3.9, 6.0, Bm), (6.0, 8.15, Fs),
    (8.15, 10.55, D), (10.55, 12.95, A), (12.95, 15.35, Bm), (15.35, 17.3, G),
    (17.3, 19.25, D), (19.25, 21.2, A), (21.2, 23.15, Bm), (23.15, 25.1, G),
    (25.1, 27.15, D), (27.15, 29.2, A), (29.2, 30.0, D)]
def pad_voice(f, n, bright):
    tt = np.arange(n) / SR; s = np.zeros(n)
    for det in (-0.07, 0.0, 0.07):
        ph = 2 * np.pi * f * (1 + det / 100) * tt + rng.uniform(0, 6)
        for h in range(1, 7): s += np.sin(h * ph) / h * (0.8 ** h if not bright else 0.9 ** h)
    return s / 6
for (a, b, ch) in plan:
    n = int((b - a + 0.6) * SR); e = env(n, 0.45, 0, 1, 0.6)
    bright = a >= 8.15
    sig = sum(pad_voice(mtof(m + 12 if k == 0 else m), n, bright) for k, m in enumerate(ch[1:]))
    sig = lp_fast(sig, 1800 if bright else 900) * e
    lvl = 0.06 if a < 3.9 else (0.05 if a < 8.15 else 0.07)
    place(mus, sig, a, lvl, -0.3); place(mus, np.roll(sig, 900), a, lvl, 0.3)
    # sub bass
    bn = int((b - a) * SR); bt = np.arange(bn) / SR
    bass = np.sin(2 * np.pi * mtof(ch[0]) * bt) * env(bn, 0.05, 0, 1, 0.15)
    if a >= 3.9: place(mus, bass, a, 0.16 if a >= 8.15 else 0.11)
# pluck arpeggio (8ths) from 8.15
def pluck(f, dur=0.5):
    n = int(dur * SR); tt = np.arange(n) / SR
    s = (np.sin(2 * np.pi * f * tt) + 0.35 * np.sin(4 * np.pi * f * tt) + 0.12 * np.sin(6 * np.pi * f * tt)) * np.exp(-tt * 7)
    return s * np.minimum(1, tt * 400)
for (a, b, ch) in plan:
    if a < 8.15 or a >= 29.2: continue
    notes = [ch[2] + 12, ch[3] + 12, ch[4] + 12, ch[3] + 12]
    k = 0; tt0 = a
    while tt0 < b - 0.05:
        place(mus, pluck(mtof(notes[k % 4])), tt0, 0.05 if a < 21.2 else 0.04, -0.5 + (k % 2))
        k += 1; tt0 += beat / 2
# tension pulse 3.9-8.15 (ticking low pulse)
tt0 = 3.9
while tt0 < 8.1:
    n = int(0.18 * SR); x = np.arange(n) / SR
    place(mus, np.sin(2 * np.pi * 55 * x) * np.exp(-x * 25), tt0, 0.22); tt0 += beat / 2
# soft kick + shaker groove 8.15-29.2 (lighter during S6)
def kick():
    n = int(0.35 * SR); x = np.arange(n) / SR; f = 50 + 90 * np.exp(-x * 30)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x * 9)
def shaker():
    n = int(0.08 * SR); return hp_fast(rng.standard_normal(n), 6000) * np.exp(-np.arange(n) / SR * 60)
tt0 = 8.15; i = 0
while tt0 < 29.15:
    g = 0.5 if not (21.2 <= tt0 < 25.1) else 0.3
    if i % 2 == 0: place(mus, kick(), tt0, 0.35 * g)
    place(mus, shaker(), tt0 + beat / 2, 0.05 * g, 0.4)
    tt0 += beat; i += 1
# final resolve: big D chord with long tail from 29.2
n = int(0.8 * SR); x = np.arange(n) / SR
final = sum(np.sin(2 * np.pi * mtof(m) * x) for m in [50, 57, 62, 66, 69, 74]) * np.exp(-x * 1.2) / 6
place(mus, final, 29.2, 0.25)
# master fades
mus *= np.clip(t_all / 0.4, 0, 1)
mus[:, -int(0.35 * SR):] *= np.linspace(1, 0, int(0.35 * SR))

# ------------------------------------------------------------------ SFX
sfx = np.zeros((2, N))
def whoosh(d=0.6, up=True):
    n = int(d * SR); x = np.arange(n) / SR; nz = rng.standard_normal(n)
    fc = (300 + 5000 * (x / d) ** 2) if up else (5000 - 4600 * (x / d) ** .5)
    y = lp(nz, fc); y = y - lp_fast(y, 150)
    e = np.sin(np.pi * x / d) ** 1.5
    return y * e / (np.abs(y).max() + 1e-9)
def impact(f=48, d=1.6):
    n = int(d * SR); x = np.arange(n) / SR
    boom = np.sin(2 * np.pi * np.cumsum(f + 60 * np.exp(-x * 18)) / SR) * np.exp(-x * 3)
    crack = lp_fast(rng.standard_normal(n), 2500) * np.exp(-x * 30) * .5
    return boom + crack
def chime(f0=1568, d=2.2):
    n = int(d * SR); x = np.arange(n) / SR; y = np.zeros(n)
    for k, (r, a) in enumerate([(1, 1), (2.76, .5), (5.4, .25), (8.93, .12)]):
        y += a * np.sin(2 * np.pi * f0 * r * x) * np.exp(-x * (2 + k * 2.5))
    return y * np.minimum(1, x * 600) / 1.8
def bell():  # bicycle-rickshaw bell (ring-ring)
    y = np.zeros(int(0.7 * SR))
    for s in (0, 0.14):
        c = chime(2350, 0.5); c = c[:len(y) - int(s * SR)]; y[int(s * SR):int(s * SR) + len(c)] += c
    return y
def riser(d):
    n = int(d * SR); x = np.arange(n) / SR
    tone = np.sin(2 * np.pi * np.cumsum(200 + 900 * (x / d) ** 2) / SR) * .3
    nz = hp_fast(rng.standard_normal(n), 2000) * .5
    return (tone + nz) * (x / d) ** 2
def click(f=2500):
    n = int(0.03 * SR); x = np.arange(n) / SR; return np.sin(2 * np.pi * f * x) * np.exp(-x * 220)
def pop():
    n = int(0.12 * SR); x = np.arange(n) / SR; return np.sin(2 * np.pi * np.cumsum(600 + 900 * x / .12) / SR) * np.exp(-x * 40)

# ambience: neighbourhood (0-3.9) & market murmur (3.9-8.0)
n = int(4.2 * SR); x = np.arange(n) / SR
amb = lp_fast(rng.standard_normal(n), 900) * 0.6 + lp_fast(hp_fast(rng.standard_normal(n), 3000), 7000) * 0.08
amb *= np.minimum(1, x / 0.4) * np.clip((4.2 - x) / 0.5, 0, 1)
place(sfx, amb, 0, 0.07)
for tb, pn in [(0.6, -0.6), (2.45, 0.5)]: place(sfx, bell(), tb, 0.10, pn)
n = int(4.5 * SR); x = np.arange(n) / SR
mur = lp_fast(hp_fast(rng.standard_normal(n), 250), 1200) * (0.7 + 0.3 * np.sin(2 * np.pi * 3.1 * x) * np.sin(2 * np.pi * 0.7 * x))
mur *= np.minimum(1, x / 0.4) * np.clip((4.5 - x) / 0.5, 0, 1)
place(sfx, mur, 3.75, 0.09)
# pin drop
place(sfx, impact(70, 0.6), 1.72, 0.25); place(sfx, chime(1175, 1.4), 1.78, 0.08)
# transitions
for tc, up in [(3.35, True), (7.6, True), (10.95, True), (16.9, True), (20.95, True), (24.6, True)]:
    place(sfx, whoosh(0.65, up), tc, 0.22, -0.4); place(sfx, whoosh(0.65, up), tc + 0.02, 0.22, 0.4)
# price emphasis + tension
place(sfx, impact(60, 0.5), 5.5, 0.18)
place(sfx, riser(0.9), 7.15, 0.18)
# brand reveal
place(sfx, impact(44, 2.0), 8.12, 0.45); place(sfx, impact(52, 1.2), 9.4, 0.3)
place(sfx, chime(1568, 2.4), 9.55, 0.13, -0.3); place(sfx, chime(2093, 2.0), 9.62, 0.08, 0.3)
# product
place(sfx, impact(40, 1.4), 11.35, 0.28)
n = int(2.9 * SR); x = np.arange(n) / SR  # rice pouring hiss
rice = hp_fast(rng.standard_normal(n), 3500) * (0.6 + 0.4 * rng.random(n)) * np.minimum(1, x / .2) * np.clip((2.9 - x) / .4, 0, 1)
place(sfx, rice, 14.8, 0.05, 0.3)
# phone
place(sfx, whoosh(0.5), 17.35, 0.16)
for tt0 in (18.55,): place(sfx, click(1800), tt0, 0.35); place(sfx, pop(), tt0 + 0.02, 0.15)
for k in range(2):  # soft ringback tone
    n = int(0.45 * SR); x = np.arange(n) / SR
    place(sfx, (np.sin(2 * np.pi * 440 * x) + np.sin(2 * np.pi * 480 * x)) * env(n, .02, 0, 1, .05) * .5, 18.75 + k * 0.6, 0.05)
for k in range(14): place(sfx, click(3200 + (k % 3) * 300), 19.78 + k * 0.053, 0.10)
place(sfx, pop(), 20.62, 0.22)
# representative ready + end card
place(sfx, chime(1318, 1.6), 21.6, 0.08); place(sfx, chime(1760, 1.4), 23.4, 0.09)
place(sfx, impact(42, 2.4), 25.55, 0.42)
place(sfx, chime(1568, 2.6), 25.95, 0.13, -0.3); place(sfx, chime(2349, 2.2), 26.05, 0.08, 0.3)
place(sfx, chime(1975, 1.6), 28.3, 0.07)

def write(path, buf):
    buf = buf / max(1.0, np.abs(buf).max() / 0.89)
    pcm = (np.clip(buf.T, -1, 1) * (2 ** 23 - 1)).astype(np.int32)
    b = bytearray()
    raw = pcm.astype('<i4').tobytes()
    for i in range(0, len(raw), 4): b += raw[i:i + 3]
    with wave.open(path, 'wb') as w: w.setnchannels(2); w.setsampwidth(3); w.setframerate(SR); w.writeframes(bytes(b))
write(os.path.join(OUT, 'music.wav'), mus)
write(os.path.join(OUT, 'sfx.wav'), sfx)
print('ok', N / SR)
