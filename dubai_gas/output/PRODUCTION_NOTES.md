# Dubai Gas & Rice — Vertical Ad v1: Production Notes & QA

**Master:** `output/dubai_gas_rice_ad_v1.mp4` — 1080×1920, 30 fps, H.264 + AAC 192k, 55.57 s (1667 frames), ~17 MB.

## Audio timeline (one combined ElevenLabs file, voice "Rayhan"; speakers mapped from measured pauses)
| Part | Time (s) | Speaker / location |
|---|---|---|
| Opening: দারুন্নাজাত মাদ্রাসা… হাতের কাছেই! ("গ্যাস" ≈7.2, "চাল" ≈7.7) | 0.14 – 10.29 | Rafi — shop |
| দাদু, আর বলবেন না!… বোঝা মুশকিল! | 10.53 – 21.40 | Nasima — neighbourhood lane |
| সেটাই তো মা!… খুব জরুরি! | 21.63 – 33.88 | Dadu — neighbourhood lane |
| একদম ঠিক বলেছেন!… আমাদের কাছে! ("Dubai Gas & Rice" ≈35.9, "গ্যাসের সিলিন্ডার" ≈38.7, rice ≈43.3–46.9) | 34.19 – 46.93 | Rafi — shop |
| তাই দেরি না করে… আপন ঠিকানা! (Facebook ≈49, WhatsApp ≈50.4, brand ≈51.8) | 47.24 – 55.30 | Rafi — shop CTA |

## Scenes
Shop exterior (signboard with official logo) → Rafi inside (cylinders left, rice right, counter) → crossfade → residential lane near the madrasa (houses, grill balcony, laundry, iron gate, pole + wires, brick lane, distant mosque/madrasa silhouette, cat and sparrow) → Nasima/Dadu conversation (two-shots, singles, close-ups, price-confusion thought bubble "৳ ?") → crossfade → Rafi promo (logo pop, cylinder display insert with shine, gesture to cylinders, rice display) → CTA (Facebook + WhatsApp pills) → navy end card (logo, "আপনাদের এলাকার আপন ঠিকানা!", contacts, Rafi).

## Rules followed
- Rafi appears only in the shop; Nasima and Dadu only in the neighbourhood.
- LPG cylinders always upright, unbranded, no prices or offers, no flames or leaks; rice is secondary.
- Original logo used unmodified; voice sample-identical; music/ambience/SFX synthesized (licence-safe); mix peak 0.92 (no clipping).
- Characters reused from code (identical faces and hair). Rafi wears a Dubai Gas & Rice navy-and-gold uniform instead of the FIXIBLE IT teal polo.

## Limitations / pending
- 2D flat vector style, not 3D (same production method as the FIXIBLE IT ad).
- One voice speaks all characters in the supplied file.
- **WhatsApp number not provided** — the pill shows "WhatsApp" only. The Facebook pill shows "Dubai Gas & Rice", taken from the logo; please confirm the exact page name.
  Re-render with a number: `DG_WHATSAPP="WhatsApp: 01XXXXXXXXX" node render.js`, then re-encode.
