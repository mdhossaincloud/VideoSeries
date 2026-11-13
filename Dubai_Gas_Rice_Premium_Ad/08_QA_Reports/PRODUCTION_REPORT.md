# Dubai Gas & Rice — Premium 2D Commercial: Production & QA Report

**Final master:** `07_Renders/Dubai_Gas_Rice_Premium_Commercial_1080x1920.mp4`
**Status:** VERIFIED (checked on the rendered file, not the timeline)

## Technical specification (measured with ffprobe/ffmpeg)
| Item | Required | Measured |
|---|---|---|
| Resolution | 1080×1920 (9:16) | 1080×1920 ✅ |
| Frame rate | 30 fps | 30/1, 900 frames ✅ |
| Video codec | H.264 | H.264 High, yuv420p, CRF 18, faststart ✅ |
| Audio codec | AAC | AAC-LC 48 kHz stereo 256 kbps ✅ |
| Duration | 25–30 s | 30.000 s ✅ |
| Loudness | no clipping | −13.8 LUFS integrated, −1.0 dBTP peak ✅ |
| Black frames | none | 0 detected ✅ |
| Freezes | none | 0 detected ✅ |

## Voiceover
- Source: ElevenLabs "Rayhan" (30.51 s), kept untouched in `02_Voiceover/VO_ElevenLabs_Rayhan_ORIGINAL.mp3`.
- Approved script fully preserved — **no words cut or changed**. To fit 30 s with a readable end card: two long sentence pauses shortened (0.59→0.35 s, 0.49→0.33 s) and +3 % tempo with pitch preserved.

## Scene timeline (synced to VO sentence boundaries)
| Time | Scene | On-screen |
|---|---|---|
| 0.0–3.8 | Bangladeshi neighbourhood (parallax, rickshaws, CNG, pin drop) | দারুন্নাজাত কামিল মাদ্রাসা / ও আশপাশের এলাকা |
| 3.8–8.0 | Local gas shop, market-uncertainty graph, "৳ ???" tag (no fabricated prices) | গ্যাস কিনতে গিয়ে / অতিরিক্ত দাম দিচ্ছেন না তো? |
| 8.0–11.4 | Brand reveal — official logo coin-flip + light sweep | আপনার জন্যই রয়েছে |
| 11.4–14.4 | Studio hero LPG cylinder on podium (primary product) | LPG GAS CYLINDER |
| 14.4–17.3 | Three unbranded rice varieties + rice pour (secondary) | বিভিন্ন ধরনের চাল / যোগাযোগ করুন আমাদের সঙ্গে |
| 17.3–21.3 | Home kitchen, phone: call → WhatsApp-style chat | CALL NOW / WHATSAPP MESSAGE / 01888-565688 |
| 21.3–25.0 | Representative ready | আপনার প্রয়োজন বুঝে সহযোগিতা করতে / আমাদের প্রতিনিধি প্রস্তুত |
| 25.0–30.0 | End card (5 s hold) | Logo, আপনার এলাকার নির্ভরযোগ্য ঠিকানা, 01888-565688, CALL / WHATSAPP |

## QA checklist
- [x] 9:16, 1080×1920, 30 fps, H.264 MP4, AAC
- [x] 30.0 s, full Bengali VO, no clipped dialogue, music ducked under voice
- [x] Bengali conjuncts render correctly (Hind Siliguri, browser HarfBuzz shaping)
- [x] Official logo used as supplied (no redraw/distortion)
- [x] Phone 01888-565688 (Call & WhatsApp, supplied by owner) on phone screen, contact bar, end card
- [x] LPG cylinder primary, rice secondary; no brands, prices, discounts or specs invented
- [x] Safe LPG visuals: upright cylinders, stove off, no flames/leaks/smoking
- [x] Local Bangladeshi environments (no Dubai skyline)
- [x] No black frames, no freezes, transitions verified on extracted frames (`QA_final_frames.jpg`)

## Pipeline (reproducible: `06_Project_Files/build.sh`)
2D motion graphics: Canvas2D vector illustration (`scenes2d.js`) + HTML/CSS kinetic typography (`index.html`, `main.js`) → deterministic frame capture in headless Chromium (`render.mjs`) → FFmpeg. Audio: original synthesised music & SFX (`05_Sound_Design/sound_design.py`, royalty-free), sidechain ducking, two-pass loudnorm. Earlier 3D version kept as `main_3d_archive.js` (not used, per client direction to 2D).
To change the phone number: edit `06_Project_Files/contact.json`, then run `build.sh`.

## Known limitations
- Environments are stylised 2D illustrations (no live footage / AI photo generation available in this environment).
- No human customer figure is shown in the shop scene (avoided low-quality figures).
- Only files in `07_Renders` are final deliverables; nothing has been published or posted.
