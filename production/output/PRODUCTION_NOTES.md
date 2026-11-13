# FIXIBLE IT — Vertical Ad v1: Production Notes & QA Report

**Master:** `output/fixibleit_ad_vertical_v1.mp4` — 1080×1920 (9:16), 30 fps, H.264 + AAC 192k, 46.367 s (1391 frames), ~14 MB.
Suitable for Facebook/Instagram Reels, YouTube Shorts, TikTok.

## 1. Audio timeline (measured from the supplied ElevenLabs file, silence detection at −35 dB / −32 dB)
| Line | Time (s) | Speaker (on screen) | Text |
|---|---|---|---|
| 1 | 0.15 – 5.59 | Nasima Apa | ধুর! কাল রাতেও দোকানের ক্যামেরা বন্ধ ছিল। (sigh 3.0–3.9) এখন কে বলবে কী হইছে? |
| 2 | 5.99 – 13.05 | Dadu | আর আমার জ্বালা শোনেন! মেয়ের অনলাইন ক্লাস চলে, বাসার ওয়াইফাই খালি ঘোরে। স্যারের কথা আসে অর্ধেক! |
| 3 | 13.43 – 18.04 | Dadu | আমার কম্পিউটার চালু করি সকালে... (chuckle ~16.2–16.9) চালু হয় দুপুরে! |
| 4 | 18.37 – 22.04 | Rafi | আসসালামু আলাইকুম! ঝামেলা তিনটা, সমাধান একটাই, ফিক্সিবল আইটি! |
| 5 | 22.36 – 29.47 | Rafi | দোকানের সিসিটিভি (→24.6), বাসার ওয়াইফাই (→25.8), পুরান কম্পিউটার (→27.0), সব ঠিক করি গুছিয়ে, বুঝিয়ে দিয়ে। |
| 6 | 29.80 – 32.78 | Nasima Apa | আরে বাহ! (laugh) এখন তো মোবাইলেই দোকান দেখি! |
| 7 | 33.09 – 36.57 | Dadu | যাক বাবা! এখন মেয়ের ক্লাস একদম পরিষ্কার। |
| 8 | 36.88 – 39.94 | Dadu (to Rafi) | সাবাশ দাদুভাই! এ তো চোখের পলকে চালু! |
| 9 | 40.30 – 46.07 | Rafi | আপনার আইটি ঝামেলাও আমাদের বলুন। ফিক্সিবল আইটি ডট কম (≈42.46), অথবা ফেসবুকে (≈43.6) ফিক্সিবল আইটি। |

## 2. Scene breakdown
| Shot | Time | Location | Content |
|---|---|---|---|
| 1a | 0–1.0 | Shop exterior, night | Establishing: "নাসিমা স্টোর", dead CCTV camera, street lamp, wires |
| 1b–c | 1.0–5.79 | Shop interior | CCTV monitor "NO SIGNAL"; Nasima frustrated → sigh close-up |
| 2a–d | 5.79–13.23 | Dadu's living room | Dadu complains; granddaughter's class frozen (spinner); router red, weak Wi-Fi; close-up |
| 3a–b | 13.23–18.2 | Dadu's PC corner | Old PC crawling boot; Dadu taps desk; wall clock races morning → noon |
| 4 | 18.2–22.2 | Brand teal | Rafi walks in, salam/wave; 3 problem icons merge into the official logo |
| 5a | 22.2–24.7 | Shop | Rafi works on the DVR → monitor glitches → live 4-camera feed |
| 5b | 24.7–25.95 | Living room | Rafi adjusts router → green LEDs, full Wi-Fi, class video clears |
| 5c | 25.95–27.0 | PC corner | Rafi at keyboard → boot completes → desktop |
| 5d | 27.0–29.64 | Living room | Rafi explains, Dadu nods, everything working |
| 6 | 29.64–32.94 | Shop | Nasima surprised → laughs, shows live CCTV on her phone |
| 7 | 32.94–36.73 | Living room | Dadu relieved, thumbs-up; class clear |
| 8 | 36.73–40.12 | PC corner | Dadu praises Rafi; desktop running; Rafi thumbs-up |
| 9 | 40.12–46.37 | Brand navy CTA | Logo, FIXIBLE IT, YOUR TECHNOLOGY PARTNER, FixibleIT.com, Facebook: Fixible IT, Bengali tagline |

Shot mix: character shots ≈ 94%; device-only inserts 2 × ≤1.45 s (≈ 3%).

## 3. Sound
Voice: the original ElevenLabs audio, sample-identical (decoded and summed, no EQ/compression), encoded to AAC.
Music, ambience and SFX were all synthesized in code (licence-safe): music ≈ −24 dB below voice peak and ducked under speech; SFX ≈ −18 dB; ambience ≈ −27 dB.
Includes: night crickets, ceiling-fan air, PC fan, desk taps, racing clock, pops, router/CCTV/PC-ready chimes, transition whooshes.

## 4. QA results
- [x] 1080×1920, 30 fps, H.264/AAC, duration 46.367 s — equal to the voice-over (0 frame difference)
- [x] No black frames (ffmpeg blackdetect), no clipped dialogue, no watermark, no subtitles
- [x] Official logo used unmodified (original PNG on a white card)
- [x] Only the speaking character's mouth moves; others hold expressions; blinking and breathing throughout
- [x] Every device has a visible before → after state shown on screen
- [x] Characters consistent across shots; Muslim looks (Nasima hijab, Dadu tupi), standard clothing colours
- [x] Bengali text (signboard, screens, tagline) renders correctly (Chromium + Hind Siliguri)

## 5. Limitations / assumptions (honest)
- **Style is 2D flat vector, not 3D.** This environment has no 3D software or image/video generation models; everything was drawn in code (SVG) and rendered with Chromium + ffmpeg. A true 3D cinematic version needs a 3D pipeline (Blender/Maya + rigged models) or an AI video tool.
- **Lip-sync is amplitude/spectrum-driven** (5 mouth shapes from the actual voice energy), not phoneme-level alignment. No Bengali alignment model was available offline.
- **One narrator voice** ("Syed") speaks every character in the supplied file. Speaker mapping follows the script order and the measured pauses.
- **Story mapping:** the brief listed Rafi as the PC owner, but Rafi is also the FIXIBLE IT technician and line 8 says "সাবাশ দাদুভাই". So the slow PC belongs to Dadu, and Rafi fixes it.
- Line 5 word boundaries inside the sentence are inferred from short pauses (≈0.1–0.3 s), so montage cuts land within about ±0.2 s of each spoken item.
- "মোবাইলেই দোকান দেখি" implies FIXIBLE IT sets up CCTV mobile viewing — please confirm this is a service you offer.

## 6. Source files
`characters/rig.js` (character rig) · `production/chars.js` (posable cast) · `production/scenes.js` (environments/devices) · `production/film.js` (timeline) · `production/render.js` (frame render) · `production/audio_analyze.py`, `production/audio_mix.py` (audio) · `production/assets/` (logo, original voice).
Rebuild: `python3 audio_analyze.py && node render.js && python3 audio_mix.py`, then the ffmpeg encode command in this file's history.
