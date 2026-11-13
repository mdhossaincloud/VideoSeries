import sys, sherpa_onnx, soundfile as sf, numpy as np
cfg=sherpa_onnx.OfflineTtsConfig(model=sherpa_onnx.OfflineTtsModelConfig(vits=sherpa_onnx.OfflineTtsVitsModelConfig(model="male_onnx/model.onnx",tokens="male_onnx/tokens.txt",noise_scale=0.6,noise_scale_w=0.7,length_scale=1.0),num_threads=4))
tts=sherpa_onnx.OfflineTts(cfg); speed=float(sys.argv[1])
for line in open('vo_lines.tsv',encoding='utf-8'):
    k,t=line.rstrip('\n').split('\t'); a=tts.generate(t,sid=0,speed=speed); x=np.array(a.samples)
    # trim leading/trailing silence
    idx=np.where(np.abs(x)>0.02)[0]; x=x[max(idx[0]-400,0):idx[-1]+1200]
    sf.write(f'vo/{k}.wav',x,a.sample_rate); print(k, round(len(x)/a.sample_rate,2))
