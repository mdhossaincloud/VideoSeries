# Voiceover — Bangla male narration

| ID | Script (as written in brief) | TTS input (phonetic) | In (s) | Out (s) |
|---|---|---|---|---|
| L1a | রাত তখন ঠিক ২টা... | রাত তখন ঠিক দুইটা। | 0.30 | 1.89 |
| L1b | দোকান বন্ধ, চারদিকে নিস্তব্ধতা! | (same) | 2.15 | 4.61 |
| L2 | সুযোগ বুঝে এগিয়ে এলো এক অনাহূত অতিথি! | (same) | 4.80 | 7.90 |
| L3a | কিন্তু সে জানত না... | কিন্তু সে জানত না। | 8.05 | 9.19 |
| L3b | তার প্রতিটি মুহূর্ত নজরদারিতে! | (same) | 9.55 | 11.59 |
| L4a | ওপরে তাকাতেই... | ওপরে তাকাতেই। | 11.80 | 12.80 |
| L4b | CCTV ক্যামেরা! | সিসিটিভি ক্যামেরা! | 13.05 | 14.21 |
| L6 | আপনার দোকান কিংবা বাসার নিরাপত্তায় CCTV প্রয়োজন? | …সিসিটিভি প্রয়োজন? | 18.00 | 21.93 |
| L7 | কনসাল্ট নিন FIXIBLE IT থেকে। | কনসাল্ট নিন ফিক্সিবল আইটি থেকে। | 22.05 | 24.28 |
| L8 | FIXIBLEIT.COM | ফিক্সিবল আইটি ডট কম। | 24.45 | 26.20 |

- The "..." pauses were built by synthesising each half separately and placing it on the timeline.
- L5 (Scene 05, "আপনার নিরাপত্তায় সচেতন সিদ্ধান্তই হতে পারে সবচেয়ে বড় সুরক্ষা!") was synthesised (`segments_processed/L5.wav`). It is shown as on-screen text rather than spoken, because Section 4 of the brief ("Complete voiceover") does not include it and speaking it would push the film past ~30 s.
- Engine: Coqui Bangla VITS male → ONNX (`export_coqui_vits_to_onnx.py`) → sherpa-onnx (`synth_all.py`, speed 1.12).
- Processing: −0.9 semitone pitch for depth, HPF 75 Hz, +2.5 dB @140 Hz, +2.5 dB @3.2 kHz, −2 dB @7.5 kHz, 3:1 compression, short room echo.
- `VO_FULL_TIMED_48k.wav` is the timed VO stem used in the mix.
