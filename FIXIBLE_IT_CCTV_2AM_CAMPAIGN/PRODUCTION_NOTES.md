# Production Notes — FIXIBLE IT | "The 2 AM CCTV Incident"

**Status:** EXECUTED and VERIFIED technically (see TECHNICAL_EXPORT_REPORT.md). Creative sign-off by the client is still PENDING (listen-through of the voice required, see "Known limitations").
**Final master:** `10_Exports/FIXIBLE_IT_CCTV_2AM_CINEMATIC_MASTER.mp4` (1080×1920, 30 fps, H.264 High, AAC 320k, 26.6 s)

## 1. Production pipeline used (what was available, what was chosen)
| Need | Preferred | Available here | Used |
|---|---|---|---|
| Photoreal 3D characters & world | Unreal Engine 5 / Blender + character assets | No GPU, no UE5/Blender, no character assets, most asset sites blocked | **Canva AI image generation** (photoreal plates, with character reference for consistency), then a 2.5D camera/atmosphere pipeline in Python |
| Motion | Full character animation | AI video generation (Canva/Seedance) needs explicit AI-limit consent, outputs 720p | **2.5D cinematography:** keyframed push-ins, tilts, snap-zooms, micro handheld, lamp flicker, drifting fog, LED pulse, red light-wash, film grain |
| Bangla male VO | Professional voice artist | Offline neural TTS only (cloud TTS blocked) | Coqui Bangla VITS (male) → ONNX → sherpa-onnx, with broadcast processing |
| Music/SFX | Licensed library | No library access | **Original synthesis** (no licensing risk) |
| Brand end card | Motion graphics app | Headless Chromium | HTML/CSS motion graphics rendered frame-by-frame (correct Bengali shaping) |

## 2. Edit decision list (EDL)
| Time | Shot | Plate | Technique |
|---|---|---|---|
| 0.0–4.0 | Hook: deserted Dhaka street, distant figure | S01 | Slow push to figure, sodium-lamp flicker, fog drift, fade-up |
| 4.0–6.2 | Intruder (hood + gamcha) approaches shutter | S02a | Lateral drift, rim-lit, footsteps |
| 6.2–7.9 | ECU eyes scanning | S02b | Slow push, heartbeat |
| 7.9–8.9 | Push toward padlock/shutter | S02a (crop) | Accelerating push, riser |
| 8.9–10.1 | **Reveal:** tilt from shutter up to CCTV | S05 (crop) | Tilt-up, flash + snap-zoom at 9.25 s on the impact hit |
| 10.1–11.7 | ECU CCTV lens + red indicator | S03c | Push, pulsing red LED glow, surveillance tone |
| 11.7–12.9 | Reaction: freeze | S02b | Snap-zoom, decaying shake, red wash from above, bass hit |
| 12.9–14.4 | CCTV POV (dramatised) REC · CAM 01 · 02:00:17→18 AM | S02a | Mono grade, barrel distortion, scanlines, REC blink |
| 14.4–15.4 | He leaves into the fog | S01 | Pull-back, fade |
| 15.4–17.8 | Secure shop exterior, tension → confidence | S05 | Crane-out, warmer/calmer grade, Scene 05 line on screen, brand music enters |
| 17.8–26.6 | Brand end card | S06 + official logo | Teal flash, logo blur-in + light sweep, text cascade synced to VO, continuous slow push |

## 3. Creative decisions & deviations from the brief (for your approval)
1. **Duration 26.6 s instead of ~25 s.** The full Bangla script at a natural pace needs ~22 s of speech. I kept the brief's "do not rush" rule rather than cutting words.
2. **The Scene 05 line is on screen, not spoken.** Section 3 gives it as VO, but Section 4 ("Complete voiceover") leaves it out, and speaking it would push the film to ~31 s. The audio file exists (`06_Voiceover/segments_processed/L5.wav`) if you want it spoken.
3. **Logo tagline conflict.** The official logo file contains the tagline "TOP TECH. TOTAL SUPPORT." The brief's slogan is "Your Technology Partner." The logo is used **unmodified** (as the brief requires) and the slogan sits underline-styled below it. If you prefer a single tagline, supply a logo variant without the built-in tagline.
4. **The four shots I couldn't generate were built from existing plates.** Canva's image-generation quota ran out after 6 plates. The hand-on-shutter, look-up reaction, CCTV POV and walk-away shots were built from those plates through cropping, camera moves, grade and sound. The story beats are preserved, but the hand and the literal "looking up" are implied by the edit, not shown.
5. **Typography:** a hair space (U+200A) sits before the dari in "থেকে।" so it does not read as "থেকো". Spelling is unchanged.
6. **Not shown as real footage:** the CCTV POV is clearly stylised and the man is a fictional character. The film never claims CCTV guarantees crime prevention; the message is surveillance, deterrence and awareness.

## 4. Known limitations (honest QA)
- **The voice was not checked by ear.** This environment has no audio playback or Bengali speech recognition. Timing, levels and clipping were verified by measurement only. **Please listen once on headphones** for pronunciation of "অনাহূত", "নজরদারিতে", "ফিক্সিবল আইটি". If any word sounds off, it can be re-synthesised with a phonetic respelling in minutes.
- Characters do not have full-body animation (no lip, limb or cloth simulation). Motion is camera-driven 2.5D. For true UE5-grade character animation, see the upgrade path below.

## 5. Upgrade path (optional, needs your approval)
- **Canva AI video (Seedance, 720p)** can animate the existing plates (e.g. the man turning and looking up, the hand reaching). It uses a significant share of your Canva AI limit, so it needs your explicit go-ahead.
- **Professional Bangla voice artist** for the paid-media version (recommended): a drop-in replacement for `06_Voiceover/VO_FULL_TIMED_48k.wav` with the same cue times.
- **More plates** once the Canva quota resets: a dedicated hand-reach shot and a true look-up reaction.

## 6. Re-render instructions
```bash
python3 09_Final_Edit/render_scenes.py 09_Final_Edit/timeline.json <frames_dir>          # scenes 01–05
node 09_Final_Edit/tools/render_html.js 08_Motion_Graphics/endcard.html <dir> 30 8.8     # end card
python3 07_Sound_Design/sound_design.py 07_Sound_Design/cues.json 07_Sound_Design       # stems
# then mix and encode per TECHNICAL_EXPORT_REPORT.md
```
