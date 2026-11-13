# FIXIBLE IT — Character Bible (locked, approved after Ad v2)

Style: Bangla Toon Flat — 2D flat vector, Ink outline `#1B1A22` (~5px @1080p), one shade tone per colour, warm brown skin.
Code: `characters/rig.js` (heads, helpers) + `production/chars.js` (posable bodies). Reuse these; do not redraw.
Reference image: `production/output/character_reference_sheet.png`

## Main cast

| Character | Role | Look (must stay identical) | Skin | Poses available (`chars.js`) |
|---|---|---|---|---|
| **রাফি (Rafi)** | FIXIBLE IT technician (hero, ~26) | Wavy black hair; **brand-teal polo `#0CAEA9`**, navy collar `#052E3B`; white roundel + teal tick on chest; ID card on navy lanyard; navy jeans `#22304A`; white sneakers with teal sole; terracotta toolbox | `#C98B5E` | armL: down, toolbox, reach · armR: hip, wave, present, thumb, reach, tool · walk (`step`) |
| **দাদু (Dadu)** | Shop owner of "বিসমিল্লাহ স্টোর" (elder, ~70), also owns the old PC | **White tupi** (prayer cap); silver combed-back hair; square brown glasses; white moustache + short white beard; off-white panjabi `#F4EFE4` with 3 buttons; white pajama; brown sandals. **No shawl.** | `#BE8457` | armL: behind, down, counter · armR: behind, down, counter, point, raise, tap, thumb, phone |
| **নাসিমা আপা (Nasima Apa)** | Mother at home (~35) | **Cream hijab `#E9DCCB`** framing the face (no hair visible, no bindi); maroon kameez `#7D2E3A` with gold trim `#C9A86A`; cream orna across the chest; cream salwar `#EDE3D2`; sandals | `#D79A6C` | armL: hip, counter, down · armR: gesture, phone, counter, down |
| **মেয়ে (Nasima's daughter)** | Student (~10), no dialogue | Two black braids with red ribbons; white shirt; blue school pinafore `#3B6EA8` | `#D69466` | seated bust at the study table; `typeY` for typing |

All characters: 6 expressions (normal, happy, surprised, thinking, annoyed, sad), 5+ mouth shapes (closed, aa, ee, oo, mm + smile/grin/frown/flat/o), blink, breathing, head tilt.

## Rules
- Characters are Muslim and modest. Standard, calm clothing colours (no loud red/marigold outfits).
- Rafi always greets with "আসসালামু আলাইকুম".
- Brand colours: Teal `#0CAEA9` · Highlight `#1FD6C8` · Navy `#052E3B` · Tint `#F1FAF6`. Slogan: YOUR TECHNOLOGY PARTNER.
- Official logo: `production/assets/fixibleit_logo_original.png` — use unmodified (on a white card).
- Font: Hind Siliguri Bold (`characters/assets/fonts/`).

## Locations already built (`production/scenes.js`)
Shop exterior at night · shop interior (shelves, counter, CCTV monitor + DVR) · Nasima's living room (window grill, fan, router, study table, laptop) · PC corner (old monitor, tower, wall clock) · brand-teal intro · navy CTA end card.

## Retired / not used
Karim Bhai and Tutul (first sheet) are no longer in the cast.
