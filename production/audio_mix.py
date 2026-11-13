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
    e = np.ones(n); ai=int(a*SR); ri=int(r*SR)
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
                if d>0.1: add(music, t, 0.18*tone(nt(m), d, decay=0.4, harm=(1,0.15))*env_ar(int(d*SR),0.3,0.4))
        m = ch[[0,1,2,1][k%4]] + 12
        add(music, t, (0.32 if bright else 0.24)*tone(nt(m), 0.9, decay=5 if bright else 3.5, harm=(1,0.4,0.15,0.05)))
        if bright and k%2==1: add(music, t+beat/2, 0.12*tone(nt(ch[2]+24), 0.4, decay=9))
        t += beat; k += 1
section(0.0, 18.2, [[57,60,64],[53,57,60],[48,52,55],[55,59,62]], 0.62, False)
section(18.2, N/SR, [[48,52,55],[55,59,62],[57,60,64],[53,57,60]], 0.42, True)
# soft bass in B
t=18.2; k=0
for t in np.arange(18.2, N/SR, 0.84):
    root=[36,43,45,41][(k//2)%4]; add(music, t, 0.22*tone(nt(root), 0.8, decay=3, harm=(1,0.2))); k+=1
music *= env_ar(N, 0.6, 1.2)

# ---------- ambience ----------
amb = np.zeros(N)
def span(a,b): i,j=int(a*SR),int(b*SR); return i,j
shop = [(0,5.79),(22.2,24.7),(29.64,32.94)]
home = [(5.79,13.23),(24.7,25.95),(27.0,29.64),(32.94,36.73)]
pc   = [(13.23,18.2),(25.95,27.0),(36.73,40.12)]
for a,b in shop:  # night crickets + room hum
    d=b-a; t=np.arange(int(d*SR))/SR
    cr = np.sin(2*np.pi*4300*t)*(np.sin(2*np.pi*28*t)>0.3)*(0.5+0.5*np.sin(2*np.pi*0.7*t))
    hum = 0.4*np.sin(2*np.pi*100*t)
    add(amb, a, (0.10*cr + 0.08*hum)*env_ar(len(t),0.25,0.25))
for a,b in home:  # ceiling-fan swish + occasional birds
    d=b-a; n=noise(d); f=lp_fast(n, 60)*(0.7+0.3*np.sin(2*np.pi*3.2*np.arange(len(n))/SR))
    add(amb, a, 0.9*f*env_ar(len(f),0.25,0.25))
    for bt in np.arange(a+0.6, b-0.4, 1.9):
        tt=np.arange(int(0.12*SR))/SR; add(amb, bt, 0.08*np.sin(2*np.pi*(3000+2500*tt/0.12)*tt)*np.exp(-20*tt))
for a,b in pc:   # old PC fan whir
    d=b-a; t=np.arange(int(d*SR))/SR; n=lp_fast(noise(d), 25)
    add(amb, a, (0.6*n + 0.05*np.sin(2*np.pi*180*t))*env_ar(len(t),0.25,0.25))

# ---------- SFX ----------
sfx = np.zeros(N)
def whoosh(t0, d=0.45, g=0.5):
    n=noise(d); e=np.sin(np.pi*np.linspace(0,1,len(n)))**2
    lo=lp_fast(n, 18); add(sfx, t0-d/2, g*lo*e)
def pop(t0, f=520, g=0.6):
    tt=np.arange(int(0.12*SR))/SR; add(sfx, t0, g*np.sin(2*np.pi*(f+900*np.exp(-30*tt))*tt)*np.exp(-28*tt))
def chime(t0, notes, g=0.35, step=0.09):
    for i,m in enumerate(notes): add(sfx, t0+i*step, g*tone(nt(m), 0.8, decay=5, harm=(1,0.5,0.2)))
def click(t0, g=0.5):
    n=noise(0.02)*np.exp(-np.arange(int(0.02*SR))/SR*300); add(sfx, t0, g*n)
def knock(t0, g=0.5):
    tt=np.arange(int(0.09*SR))/SR; add(sfx, t0, g*np.sin(2*np.pi*140*tt)*np.exp(-45*tt) + g*0.3*lp_fast(noise(0.09),6)*np.exp(-60*tt))
for t0 in [1.0, 5.79, 13.23, 18.2, 22.2, 24.7, 25.95, 27.0, 29.64, 32.94, 36.73, 40.12]: whoosh(t0, g=0.35)
for t0 in np.arange(14.62, 16.1, 1/ (9/np.pi)): knock(t0, 0.45)                 # desk tapping (matches hand cycle)
for t0 in np.arange(16.95, 18.0, 0.09): click(t0, 0.25)                           # clock racing
for i,t0 in enumerate([19.95, 20.17, 20.39]): pop(t0, 300+i*80, 0.4)              # three problem icons
chime(21.1, [72, 76, 79, 84], 0.33)                                               # logo reveal
click(23.45, 0.6); click(23.52, 0.5); add(sfx, 23.6, 0.12*noise(0.25)*np.exp(-np.arange(int(0.25*SR))/SR*8)); chime(23.9, [81, 88], 0.25, 0.12)   # CCTV fixed
chime(25.2, [76, 83], 0.3, 0.11)                                                  # router connected
for t0 in np.arange(25.96, 26.38, 0.075): click(t0, 0.5)                         # keyboard
chime(26.4, [67, 71, 74, 79], 0.28, 0.07)                                         # PC desktop ready
whoosh(30.8, 0.3, 0.3)                                                            # phone up
pop(40.25, 420, 0.4); pop(42.46, 520, 0.45); pop(43.6, 600, 0.45); chime(44.45, [79, 84], 0.2, 0.1)

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
