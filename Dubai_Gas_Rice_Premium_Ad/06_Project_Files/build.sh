#!/usr/bin/env bash
# Rebuild the full commercial: ./build.sh   (edit contact.json first to change the phone number)
set -euo pipefail
cd "$(dirname "$0")"; ROOT=..
[ -d node_modules ] || npm install
export NODE_PATH=$(npm root -g)
# 1) timed voiceover (no words changed: 2 long pauses trimmed, +3% tempo, pitch preserved)
ffmpeg -hide_banner -loglevel error -y -i $ROOT/02_Voiceover/VO_ElevenLabs_Rayhan_ORIGINAL.mp3 -filter_complex "[0]atrim=0:3.68,asetpts=N/SR/TB[a];[0]atrim=3.92:8.35,asetpts=N/SR/TB[b];[0]atrim=8.51,asetpts=N/SR/TB[c];[a][b][c]concat=n=3:v=0:a=1,aresample=48000,atempo=1.03,adelay=150:all=1,apad=whole_dur=30" -c:a pcm_s24le $ROOT/02_Voiceover/VO_timed_30s.wav
# 2) music + sfx
python3 $ROOT/05_Sound_Design/sound_design.py
# 3) mix + loudness (-14 LUFS, -1 dBTP)
cd $ROOT/05_Sound_Design
FC="[0]aresample=48000,pan=stereo|c0=c0|c1=c0,highpass=f=70,acompressor=threshold=-20dB:ratio=2.5:attack=8:release=120:makeup=2,asplit=2[vo][vok];[1]volume=0.9[mu];[mu][vok]sidechaincompress=threshold=0.03:ratio=6:attack=25:release=350[mud];[2]volume=1.0[fx];[vo][mud][fx]amix=inputs=3:normalize=0:duration=first,alimiter=limit=0.89"
ffmpeg -hide_banner -y -loglevel error -i ../02_Voiceover/VO_timed_30s.wav -i music.wav -i sfx.wav -filter_complex "$FC" -c:a pcm_s24le mix_premaster.wav
M=$(ffmpeg -hide_banner -i mix_premaster.wav -af loudnorm=I=-14:TP=-1:LRA=9:print_format=json -f null - 2>&1 | sed -n '/{/,/}/p')
II=$(echo "$M" | python3 -c "import json,sys;d=json.load(sys.stdin);print(f\"measured_I={d['input_i']}:measured_TP={d['input_tp']}:measured_LRA={d['input_lra']}:measured_thresh={d['input_thresh']}:offset={d['target_offset']}\")")
ffmpeg -hide_banner -y -loglevel error -i mix_premaster.wav -af "loudnorm=I=-14:TP=-1:LRA=9:$II:linear=true,aresample=48000" -c:a pcm_s24le mix_master_-14LUFS.wav
cd ../06_Project_Files
# 4) render picture (Three.js + HTML overlays, deterministic frames)
node render.mjs video ../04_Motion_Graphics/video_only_1080x1920_30fps.mp4 30
# 5) mux final master
ffmpeg -hide_banner -loglevel error -y -i ../04_Motion_Graphics/video_only_1080x1920_30fps.mp4 -i ../05_Sound_Design/mix_master_-14LUFS.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -ar 48000 -movflags +faststart -t 30 ../07_Renders/Dubai_Gas_Rice_Premium_Commercial_1080x1920.mp4
echo "Done: 07_Renders/Dubai_Gas_Rice_Premium_Commercial_1080x1920.mp4"
