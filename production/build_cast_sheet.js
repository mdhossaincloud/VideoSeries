// Character reference sheet for the vertical ad (final looks).
const { openPages, shot } = require('./page');
const C = require('./chars');
const R = require('../characters/rig');
const W = 1920, H = 1080, B = C.BRAND;
const g = (x, y, s, inner) => `<g transform="translate(${x} ${y}) scale(${s})">${inner}</g>`;
const label = (x, y, t1, t2) => `<rect x="${x - 150}" y="${y}" width="300" height="50" rx="25" fill="${B.navy}"/><text x="${x}" y="${y + 35}" font-size="28" fill="#fff" text-anchor="middle">${t1}</text><text x="${x}" y="${y + 82}" font-size="20" fill="${B.navy}" text-anchor="middle">${t2}</text>`;
let s = `<rect width="${W}" height="${H}" fill="${B.tint}"/><rect x="30" y="24" width="1000" height="74" rx="37" fill="${B.navy}"/><text x="66" y="76" font-size="42" fill="#fff">FIXIBLE IT অ্যাড: <tspan fill="${B.hi}">ক্যারেক্টার রেফারেন্স</tspan></text>`;
s += g(260, 760, 1.45, C.nasima({ expr: 'happy', mouth: 'smile', armL: 'hip', armR: 'down' })) + label(260, 790, 'নাসিমা আপা', 'Mother at home — maroon kameez, cream hijab');
s += g(720, 760, 1.45, C.dadu({ expr: 'happy', mouth: 'smile', armL: 'behind', armR: 'behind' })) + label(720, 790, 'দাদু', 'Shop owner — white panjabi, tupi');
s += g(1180, 760, 1.45, C.rafi({ expr: 'happy', mouth: 'grin', armL: 'toolbox', armR: 'hip' })) + label(1180, 790, 'রাফি', 'FIXIBLE IT technician — brand teal');
s += g(1600, 690, 1.45, C.girl({ expr: 'happy' })) + `<rect x="1480" y="560" width="240" height="140" fill="#9B6A44" stroke="#1B1A22" stroke-width="5"/>` + label(1600, 790, 'মেয়ে', 'Nasima\'s daughter — no dialogue');
const ex = ['normal', 'happy', 'surprised', 'thinking', 'annoyed', 'sad'];
ex.forEach((e, i) => { s += g(140 + i * 150, 975, 0.85, R.nasimaHead({ cx: 0, cy: 0, expr: e })) + g(1060 + i * 140, 975, 0.8, R.daduHead({ cx: 0, cy: 0, expr: e })); });
s += `<text x="60" y="915" font-size="22" fill="${B.navy}">Expressions — স্বাভাবিক · খুশি · অবাক · চিন্তিত · বিরক্ত · দুঃখী</text>`;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${s}</svg>`;
(async () => { const { browser, pages } = await openPages(1, W, H); await shot(pages[0], svg, 'output/character_reference_sheet.png', 'png'); await browser.close(); })();
