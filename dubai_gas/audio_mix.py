# Builds the final soundtrack: original voice (sample-identical) + synthesized, licence-free music bed, ambience and SFX.
import subprocess, numpy as np, wave, json
SR = 44100
raw = subprocess.run(['ffmpeg','-v','error','-i','audio/voiceover_original.mp3','-f','f32le','-ac','1','-ar',str(SR),'-'],capture_output=True).stdout
voice = np.frombuffer(raw, np.float32).astype(np.float64)
N = len(voice); T = np.arange(N)/SR
rng = np.random.default_rng(7)
def db(x): return 10**(x/20)
vpk = np.percentile(np.abs(voice), 99.5)
def env_ar(n, a, r):
    e = np.ones(n); ai=min(int(a*SR), n//2); ri=min(int(r*SR), n//2)
    if ai: e[:ai]=np.linspace(0,1,ai)
    if ri: e[-ri:]*=np.linspace(1,0,ri)
    return e
def add(buf, t0, sig):
    i=int(t0*SR); j=min(N, i+len(sig))
    if i<N: buf[i:j]+=sig[:j-i]
def tone(f, dur, decay=4.0, harm=(1,0.3,0.1)):
    t=np.arange(int(dur*SR))/SR
    return sum(a*np.sin(2*np.pi*f*(k+1)*t) for k,a in enumerate(harm))*np.exp(-decay*t)
def noise(dur): return rng.standard_normal(int(dur*SR))
def lowpass(x, a):  # one-pole
    y=np.empty_like(x); acc=0.0
    for i in range(len(x)): acc+= a*(x[i]-acc); y[i]=acc
    return y
def lp_fast(x, k):  # moving average as cheap low-pass
    return np.convolve(x, np.ones(k)/k, mode='same')

# ---------- music bed ----------
music = np.zeros(N)
nt = lambda m: 440*2**((m-69)/12)
# A section (problems, 0–18.2): gentle Am–F–C–G, slow plucks; B section (18.2–end): brighter C–G–Am–F, faster
def section(t0, t1, chords, beat, bright):
    t=t0; k=0
    while t < t1:
        ch = chords[(k//4)%len(chords)]
        # pad on bar start
        if k%4==0:
            for m in ch:
                d=min(beat*4, t1-t)
                if d>0.1: add(music, t, 0.18*(lambda x: x*env_ar(len(x),0.3,0.4))(tone(nt(m), d, decay=0.4, harm=(1,0.15))))
        m = ch[[0,1,2,1][k%4]] + 12
        add(music, t, (0.32 if bright else 0.24)*tone(nt(m), 0.9, decay=5 if bright else 3.5, harm=(1,0.4,0.15,0.05)))
        if bright and k%2==1: add(music, t+beat/2, 0.12*tone(nt(ch[2]+24), 0.4, decay=9))
        t += beat; k += 1
section(0.0, 10.41, [[48,52,55],[55,59,62],[57,60,64],[53,57,60]], 0.42, True)
section(10.41, 34.04, [[57,60,64],[53,57,60],[48,52,55],[55,59,62]], 0.6, False)
section(34.04, N/SR, [[48,52,55],[55,59,62],[57,60,64],[53,57,60]], 0.42, True)
# soft bass in B
t=18.2; k=0
for t in [x for x in np.arange(0, N/SR, 0.84) if x < 10.41 or x >= 34.04]:
    root=[36,43,45,41][(k//2)%4]; add(music, t, 0.22*tone(nt(root), 0.8, decay=3, harm=(1,0.2))); k+=1
music *= env_ar(N, 0.6, 1.2)

# ---------- ambience ----------
amb = np.zeros(N)
shop = [(0,10.41),(34.04,N/SR)]
lane = [(10.41,34.04)]
for a_,b_ in shop:  # shop: low street murmur
    d=b_-a_; n=lp_fast(noise(d), 40)
    add(amb, a_, 0.8*n*env_ar(len(n),0.3,0.3))
for a_,b_ in lane:  # neighbourhood: soft air + sparrows + distant rickshaw bell
    d=b_-a_; n=lp_fast(noise(d), 80)
    add(amb, a_, 0.6*n*env_ar(len(n),0.3,0.3))
    for bt in np.arange(a_+0.5, b_-0.4, 1.7):
        tt=np.arange(int(0.1*SR))/SR; add(amb, bt, 0.10*np.sin(2*np.pi*(3200+2200*tt/0.1)*tt)*np.exp(-22*tt))
    for bt in [13.9, 26.2, 31.8]:
        for k in range(2):
            tt=np.arange(int(0.25*SR))/SR; add(amb, bt+k*0.18, 0.12*(np.sin(2*np.pi*2300*tt)+0.5*np.sin(2*np.pi*3450*tt))*np.exp(-14*tt))
# ---------- SFX ----------
sfx = np.zeros(N)
def whoosh(t0, d=0.45, g=0.5):
    n=noise(d); e=np.sin(np.pi*np.linspace(0,1,len(n)))**2
    add(sfx, t0-d/2, g*lp_fast(n, 18)*e)
def pop(t0, f=520, g=0.6):
    tt=np.arange(int(0.12*SR))/SR; add(sfx, t0, g*np.sin(2*np.pi*(f+900*np.exp(-30*tt))*tt)*np.exp(-28*tt))
def chime(t0, notes, g=0.35, step=0.09):
    for i,m in enumerate(notes): add(sfx, t0+i*step, g*tone(nt(m), 0.8, decay=5, harm=(1,0.5,0.2)))
def shimmer(t0, g=0.25):
    for i,m in enumerate([84, 88, 91, 96]): add(sfx, t0+i*0.06, g*tone(nt(m), 0.5, decay=8, harm=(1,0.3)))
for t0 in [1.8, 10.41, 34.04, 47.1, 51.62]: whoosh(t0, g=0.35)
shimmer(5.65); shimmer(7.2, 0.2)
chime(35.95, [67, 71, 74, 79], 0.3, 0.08)          # logo reveal
shimmer(38.65); whoosh(44.2, 0.35, 0.25)           # cylinder shine, rice pan
pop(18.75, 380, 0.4)                               # thought bubble
pop(49.0, 520, 0.45); pop(50.4, 600, 0.45)         # Facebook / WhatsApp
chime(51.75, [72, 76, 79, 84], 0.3, 0.09)          # end card
# ---------- levels (relative to voice peak) ----------
def norm_to(x, rel_db):
    pk = np.percentile(np.abs(x[np.abs(x)>0]) , 99.5) if np.any(x) else 1
    return x / (pk+1e-9) * vpk * db(rel_db)
music = norm_to(music, -24); amb = norm_to(amb, -27); sfx = norm_to(sfx, -18)
# duck music further while someone is speaking (voice envelope)
ve = lp_fast(np.abs(voice), 2205); ve = ve/ve.max()
duck = 1 - 0.45*np.clip(ve*6, 0, 1)
bed = music*duck + amb + sfx
mix = voice + bed
pk = np.abs(mix).max()
print('voice peak', round(float(np.abs(voice).max()),3), 'mix peak', round(float(pk),3))
if pk > 0.999:  # scale only the bed so the voice stays untouched
    over = np.maximum(np.abs(mix) - 0.98, 0)
    bed *= np.clip(1 - over/np.maximum(np.abs(bed),1e-9), 0, 1); mix = voice + bed
st = np.stack([mix, mix], 1)
with wave.open('build/final_mix.wav','wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(st,-1,1)*32767).astype(np.int16).tobytes())
print('wrote build/final_mix.wav', N/SR, 's; bed RMS vs voice RMS (dB):', round(20*np.log10(np.sqrt(np.mean(bed**2))/np.sqrt(np.mean(voice**2))),1))
