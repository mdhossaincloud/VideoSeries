# Technical Export Report

## Deliverables (10_Exports/)
| File | Purpose | Size |
|---|---|---|
| FIXIBLE_IT_CCTV_2AM_CINEMATIC_MASTER.mp4 | Master (2-pass H.264, 25 Mb/s) | 83.0 MB |
| FIXIBLE_IT_CCTV_2AM_SOCIAL_UPLOAD.mp4 | Lighter upload copy (CRF 21, ≤12 Mb/s) for Reels/TikTok/Shorts | 31.1 MB |
| FIXIBLE_IT_CCTV_2AM_THUMBNAIL_1080x1920.jpg | Cover / thumbnail | 0.3 MB |
| FIXIBLE_IT_CCTV_2AM_AUDIO_MIX_48k.wav | Final stereo mix | 5.1 MB |

## Master specification (measured with ffprobe on the exported file)
| Check | Required | Measured | Result |
|---|---|---|---|
| Aspect ratio | 9:16 | 1080×1920 | PASS |
| Resolution | 1080×1920 | 1080×1920 | PASS |
| Frame rate | 30 fps | 30/1 CFR, 798 frames | PASS |
| Container / video codec | MP4 / H.264 | MP4 (faststart) / H.264 High, yuv420p, BT.709 | PASS |
| Audio | AAC | AAC-LC 48 kHz stereo, 320 kb/s | PASS |
| Duration | ~25 s | 26.6 s (video = audio = 26.600 s) | PASS (see notes) |
| Black frames | none | blackdetect: 0 | PASS |
| Frozen holds / gaps | none | freezedetect (>1 s): 0 | PASS |
| Decode errors | none | 0 | PASS |
| Loudness | social-ready | −14.3 LUFS integrated, LRA 4.7 LU | PASS |
| Clipping / true peak | none | −1.4 dBTP; 0 clipped samples in mix | PASS |
| A/V sync | in sync | reveal impact audio onset vs flash frame: −12 ms | PASS |
| Logo | original | official Drive file, unmodified | PASS |
| Website | correct | FIXIBLEIT.COM (fixibleit.com responds HTTP 200) | PASS |
| Bengali text | correct, readable | rendered with Hind Siliguri via Chromium (proper conjunct shaping); visually inspected | PASS |
| CTA screen time | sufficient | question 18.7 s→end (7.9 s), CTA pill 21.7 s→end (4.9 s), website 23.0 s→end (3.6 s) | PASS |
| Voice clarity | clear | not verified by ear in this environment | **PENDING client listen** |

## Mix chain
VO stem + (music + ambience) side-chain ducked under the VO (4:1) + SFX → limiter → EBU R128 loudnorm (I −14, TP −1.5).

## Encode commands (master)
```
ffmpeg -framerate 30 -i frames/f%04d.png -c:v libx264 -profile:v high -level 4.2 -preset slow -b:v 25M -maxrate 35M -bufsize 50M -pix_fmt yuv420p -r 30 -g 30 -bf 2 -pass 1 -an -f null -
ffmpeg -framerate 30 -i frames/f%04d.png -i MIX_MASTER_48k.wav -map 0:v -map 1:a [same video opts] -pass 2 \
  -color_primaries bt709 -color_trc bt709 -colorspace bt709 -c:a aac -b:a 320k -ar 48000 -ac 2 -shortest -movflags +faststart MASTER.mp4
```
