# Per-frame (30fps) voice envelope for lip-sync: level, spectral centroid, zero-crossing rate.
import json, subprocess, numpy as np, sys
SR, FPS = 44100, 30
raw = subprocess.run(['ffmpeg','-v','error','-i','audio/voiceover_original.mp3','-f','f32le','-ac','1','-ar',str(SR),'-'],capture_output=True).stdout
x = np.frombuffer(raw, np.float32)
n = int(round(len(x)/SR*FPS))
hop = SR//FPS
out=[]
for i in range(n):
    seg = x[i*hop:(i+1)*hop]
    if len(seg)<16: seg=np.zeros(hop,np.float32)
    rms = float(np.sqrt(np.mean(seg**2))+1e-9)
    spec = np.abs(np.fft.rfft(seg*np.hanning(len(seg))))
    f = np.fft.rfftfreq(len(seg),1/SR)
    cen = float((spec*f).sum()/(spec.sum()+1e-9))
    zcr = float(np.mean(np.abs(np.diff(np.sign(seg)))>0))
    out.append([rms,cen,zcr])
a=np.array(out); db=20*np.log10(a[:,0])
lvl=np.clip((db+45)/30,0,1)
res=[{'l':round(float(l),3),'c':round(float(c)),'z':round(float(z),3)} for l,(r,c,z) in zip(lvl,out)]
json.dump({'fps':FPS,'duration':len(x)/SR,'frames':res},open('build/voice_env.json','w'))
print('frames',n,'dur',len(x)/SR,'lvl>0.1 frames',int((lvl>0.1).sum()))
