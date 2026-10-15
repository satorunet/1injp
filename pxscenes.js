/* 1億2千万分の1 — ドット絵の「場面」。出来事や毎日の暮らしに合わせて、背景・服装・ポーズ・まわりの人・小物を描く。
   h（描画ヘルパー）：{ g, W, gr(地面のy), T(秒), e(場面が始まってからの秒), P(1ドット), r(x,y,w,h,色), prop(名前,x,y,色の上書き,左右反転) } */
(function () {
  const C = { wall: '#efe6d6', wall2: '#e2d6c2', wood: '#b08a5a', dark: '#3a332b', glass: '#bcd6ea', red: '#c0392b', pink: '#f4b6c2', green: '#5c8a5a', leaf: '#7fae7c', blue: '#4f86c6', sky: '#a9c7e6', yellow: '#e8b94a', white: '#fbf8f2', gray: '#9aa3b5', black: '#1d1f26', orange: '#e07b39', water: '#7fb3e0' };
  const tree = (h, x, gr, pinkTop) => { h.r(x + 4, gr - 16, 3, 16, C.wood); h.r(x - 2, gr - 30, 15, 12, pinkTop ? C.pink : C.leaf); h.r(x, gr - 34, 11, 5, pinkTop ? C.pink : C.leaf); };
  const petals = (h, n, col) => { for (let k = 0; k < n; k++) h.r((k * 41 + h.T * 14 + Math.sin(h.T + k) * 8) % h.W, (k * 17 + h.T * 18) % h.gr, 2, 2, col || C.pink); };
  const x0Pole = (h) => Math.round(h.W * 0.5); // 木の電柱
  const BG = {
    // コンビニ・店
    konbini: (h) => { if ((h.Y || 2026) < 1975) return BG.shoten(h); const x0 = h.W * 0.38; h.r(x0, h.gr - 50, h.W - x0 - 2, 50, C.white); h.r(x0, h.gr - 50, h.W - x0 - 2, 3, C.green); h.r(x0, h.gr - 47, h.W - x0 - 2, 2, C.orange); h.r(x0, h.gr - 45, h.W - x0 - 2, 2, C.blue); for (let x = x0 + 6; x < h.W - 14; x += 20) h.r(x, h.gr - 38, 14, 22, C.glass); h.r(x0 + 6, h.gr - 36, 2, 18, '#ffffff'); },
    shoten: (h) => { const x0 = h.W * 0.38, w = h.W - x0 - 2; h.r(x0, h.gr - 52, w, 52, '#8a6a48'); h.r(x0 - 4, h.gr - 56, w + 8, 6, '#4a4038'); h.r(x0 + 6, h.gr - 48, w - 12, 8, '#f4ead2'); for (let k = 0; k < 4; k++) h.r(x0 + 10 + k * 12, h.gr - 46, 6, 4, '#3a332b'); for (let x = x0 + 4; x < h.W - 12; x += 16) { h.r(x, h.gr - 36, 12, 16, '#2f4a6a'); h.r(x + 5, h.gr - 36, 1, 16, '#ffffff'); } h.r(x0 + 4, h.gr - 18, w - 8, 18, '#a88a62'); for (let x = x0 + 6; x < h.W - 10; x += 8) h.r(x, h.gr - 16, 6, 6, ['#e86a5a', '#f2c94c', '#7fae7c'][(x / 8 | 0) % 3]); },
    shop: (h) => { if ((h.Y || 2026) < 1970) return BG.shoten(h); BG.konbini(h); h.r(h.W * 0.38, h.gr - 50, h.W * 0.62 - 2, 5, C.red); },
    kitchen: (h) => { h.r(0, h.gr - 50, h.W, 50, C.wall); for (let x = 0; x < h.W; x += 8) h.r(x, h.gr - 24, 7, 7, x % 16 ? '#dfe7ea' : '#cdd9de'); h.r(h.W * 0.62, h.gr - 18, 40, 18, C.gray); h.r(h.W * 0.62 + 6, h.gr - 22, 10, 4, C.dark); h.r(h.W * 0.62 + 22, h.gr - 22, 10, 4, C.dark); h.g.globalAlpha = 0.5; for (let k = 0; k < 3; k++) h.r(h.W * 0.62 + 10 + k * 8 + Math.sin(h.T * 3 + k) * 2, h.gr - 30 - (h.T * 10 + k * 6) % 14, 2, 3, '#ffffff'); h.g.globalAlpha = 1; },
    office: (h) => { h.r(0, h.gr - 54, h.W, 54, C.wall2); for (let x = 6; x < h.W - 10; x += 26) h.r(x, h.gr - 48, 20, 22, C.glass); h.r(h.W * 0.6, h.gr - 14, 44, 3, C.wood); h.r(h.W * 0.6 + 4, h.gr - 11, 2, 11, C.wood); h.r(h.W * 0.6 + 38, h.gr - 11, 2, 11, C.wood); if ((h.Y || 2026) >= 1985) { h.r(h.W * 0.6 + 12, h.gr - 26, 18, 12, C.dark); h.r(h.W * 0.6 + 14, h.gr - 24, 14, 8, Math.floor(h.T * 2) % 2 ? '#a9e0b5' : C.sky); } else { h.r(h.W * 0.6 + 6, h.gr - 20, 14, 6, '#f4f1ea'); h.r(h.W * 0.6 + 8, h.gr - 22, 14, 2, '#e8e2d2'); h.r(h.W * 0.6 + 24, h.gr - 17, 14, 3, C.wood); for (let k = 0; k < 5; k++) h.r(h.W * 0.6 + 25 + k * 3, h.gr - 18, 1, 5, C.dark); if ((h.Y || 2026) < 1960) h.r(h.W * 0.8, h.gr - 54, 10, 12, '#f6f0dc'); } },
    factory: (h) => { h.r(0, h.gr - 34, h.W, 34, C.wall2); for (let x = 0; x < h.W; x += 24) { h.g.fillStyle = C.gray; h.g.beginPath(); h.g.moveTo(x, h.gr - 34); h.g.lineTo(x + 12, h.gr - 44); h.g.lineTo(x + 12, h.gr - 34); h.g.fill(); } h.r(h.W - 26, h.gr - 60, 8, 26, C.gray); h.g.globalAlpha = 0.4; for (let k = 0; k < 4; k++) h.r(h.W - 26 + Math.sin(h.T + k) * 4 + k * 3, h.gr - 66 - (h.T * 8 + k * 5) % 20, 6, 4, '#9a9a9a'); h.g.globalAlpha = 1; h.r(h.W * 0.55, h.gr - 10, h.W * 0.4, 4, C.dark); for (let x = h.W * 0.55 + ((h.T * 20) % 10); x < h.W * 0.95; x += 10) h.r(x, h.gr - 14, 6, 4, C.orange); },
    construction: (h) => { h.r(h.W * 0.7, h.gr - 64, 3, 64, C.yellow); h.r(h.W * 0.35, h.gr - 64, h.W * 0.5, 3, C.yellow); h.r(h.W * 0.4 + Math.sin(h.T) * 10, h.gr - 61, 1, 16 + Math.sin(h.T) * 4, C.dark); for (let y = h.gr - 30; y < h.gr; y += 10) h.r(h.W * 0.5, y, h.W * 0.4, 2, C.orange); },
    farm: (h) => { h.r(0, h.gr - 16, h.W, 16, '#cfe3b2'); for (let x = 2; x < h.W; x += 6) for (let y = h.gr - 14; y < h.gr; y += 5) h.r(x + Math.sin(h.T * 2 + x) * 0.5, y, 2, 4, C.green); h.r(h.W - 30, 10, 12, 12, C.yellow); },
    classroom: (h) => { h.r(0, h.gr - 56, h.W, 56, C.wall); h.r(h.W * 0.25, h.gr - 50, h.W * 0.5, 24, '#2f5d46'); h.r(h.W * 0.25 + 6, h.gr - 44, 20, 2, '#dfe7d8'); h.r(h.W * 0.25 + 6, h.gr - 38, 30, 2, '#dfe7d8'); h.r(h.W * 0.25, h.gr - 26, h.W * 0.5, 2, C.wood); h.r(h.W - 16, h.gr - 54, 10, 10, C.white); h.r(h.W - 12, h.gr - 52, 1, 4, C.dark); },
    juku: (h) => { h.r(0, 0, h.W, h.gr, '#2c3550'); h.r(h.W - 30, 8, 10, 10, '#f6e3a8'); h.r(h.W - 27, 8, 7, 7, '#2c3550'); for (let k = 0; k < 8; k++) h.r((k * 53) % h.W, (k * 11) % 30 + 4, 1, 1, '#ffffff'); h.r(h.W * 0.55, h.gr - 14, 40, 3, C.wood); h.r(h.W * 0.55 + 30, h.gr - 28, 2, 14, C.gray); h.r(h.W * 0.55 + 22, h.gr - 30, 12, 4, C.yellow); h.g.globalAlpha = 0.25; h.r(h.W * 0.55 + 8, h.gr - 26, 30, 12, '#fff3b0'); h.g.globalAlpha = 1; },
    schoolgate: (h) => { h.r(h.W * 0.45, h.gr - 50, h.W * 0.5, 50, C.white); for (let x = h.W * 0.48; x < h.W * 0.92; x += 14) h.r(x, h.gr - 40, 8, 8, C.glass); h.r(h.W * 0.66, h.gr - 58, 12, 10, C.white); h.r(h.W * 0.66 + 2, h.gr - 56, 8, 6, '#ffffff'); h.r(h.W * 0.66 + 6, h.gr - 55, 1, 3, C.dark); h.r(h.W * 0.4, h.gr - 22, 3, 22, C.gray); h.r(h.W * 0.4 - 10, h.gr - 20, 8, 14, C.white); h.r(h.W * 0.4 - 9, h.gr - 18, 6, 1, C.dark); h.r(h.W * 0.4 - 9, h.gr - 15, 6, 1, C.dark); h.r(h.W * 0.4 - 9, h.gr - 12, 6, 1, C.dark); tree(h, 6, h.gr, true); petals(h, 12); },
    playground: (h) => { tree(h, 6, h.gr, false); h.r(h.W * 0.62, h.gr - 30, 3, 30, C.red); h.r(h.W * 0.62, h.gr - 30, 18, 3, C.red); h.g.strokeStyle = C.yellow; h.g.lineWidth = 3; h.g.beginPath(); h.g.moveTo(h.W * 0.62 + 18, h.gr - 28); h.g.lineTo(h.W * 0.62 + 40, h.gr - 2); h.g.stroke(); h.r(h.W * 0.85, h.gr - 8, 20, 8, '#e9d8b4'); },
    funeral: (h) => { for (let x = 0; x < h.W; x += 10) h.r(x, 0, 5, h.gr, C.black); h.r(0, 0, h.W, h.gr, 'rgba(255,255,255,0)'); const cx = h.W * 0.62; h.r(cx - 30, h.gr - 16, 60, 16, C.white); h.r(cx - 22, h.gr - 26, 44, 10, C.white); for (let k = 0; k < 9; k++) h.r(cx - 30 + k * 7, h.gr - 20 - (k % 2) * 6, 6, 5, '#ffffff'); h.r(cx - 7, h.gr - 46, 14, 18, C.black); h.r(cx - 5, h.gr - 44, 10, 14, '#e8e0d0'); h.r(cx - 2, h.gr - 41, 4, 4, '#d9b48e'); h.r(cx - 3, h.gr - 37, 6, 5, C.gray); h.g.globalAlpha = 0.35; for (let k = 0; k < 3; k++) h.r(cx - 18 + Math.sin(h.T + k) * 2, h.gr - 30 - (h.T * 5 + k * 6) % 20, 1, 4, '#bbbbbb'); h.g.globalAlpha = 1; },
    grave: (h) => { for (const [x, ht] of [[0.5, 22], [0.7, 26], [0.88, 20]]) { h.r(h.W * x, h.gr - ht, 10, ht, C.gray); h.r(h.W * x - 3, h.gr - 4, 16, 4, '#7d8596'); } h.g.globalAlpha = 0.4; h.r(h.W * 0.7 + 4 + Math.sin(h.T * 2), h.gr - 34 - (h.T * 4) % 10, 1, 4, '#bbbbbb'); h.g.globalAlpha = 1; tree(h, 8, h.gr, false); },
    wedding: (h) => { const cx = h.W * 0.62; h.r(cx - 26, h.gr - 54, 52, 54, C.white); h.g.fillStyle = C.white; h.g.beginPath(); h.g.moveTo(cx - 30, h.gr - 54); h.g.lineTo(cx, h.gr - 70); h.g.lineTo(cx + 30, h.gr - 54); h.g.fill(); h.r(cx - 1, h.gr - 80, 2, 10, C.yellow); h.r(cx - 4, h.gr - 77, 8, 2, C.yellow); h.r(cx - 10, h.gr - 30, 20, 30, C.wood); h.r(cx - 6, h.gr - 46, 12, 10, C.glass); petals(h, 16, '#ffffff'); petals(h, 8); },
    shrine: (h) => { const cx = h.W * 0.62; h.r(cx - 30, h.gr - 50, 60, 4, C.red); h.r(cx - 34, h.gr - 54, 68, 4, C.dark); h.r(cx - 24, h.gr - 50, 4, 50, C.red); h.r(cx + 20, h.gr - 50, 4, 50, C.red); h.r(cx - 26, h.gr - 40, 52, 3, C.red); tree(h, 6, h.gr, false); },
    ceremony: (h) => { for (let x = 0; x < h.W; x += 12) h.r(x, 0, 6, h.gr - 20, C.red); for (let x = 6; x < h.W; x += 12) h.r(x, 0, 6, h.gr - 20, C.white); h.r(h.W * 0.3, 6, h.W * 0.4, 10, C.white); for (let k = 0; k < 5; k++) h.r(h.W * 0.33 + k * h.W * 0.07, 9, h.W * 0.04, 4, C.dark); },
    hospital: (h) => { h.r(0, 0, h.W, h.gr, '#eef2f2'); h.r(h.W * 0.15, 8, 24, 18, C.glass); h.r(h.W * 0.7, h.gr - 50, 2, 50, C.gray); h.r(h.W * 0.7 - 4, h.gr - 50, 10, 12, '#dfefff'); h.r(h.W * 0.82, h.gr - 44, 26, 18, C.dark); const t = h.T * 30; for (let x = 0; x < 24; x++) { const y = (Math.floor(x + t) % 12 === 0) ? -5 : 0; h.r(h.W * 0.82 + 1 + x, h.gr - 35 + y, 1, 1, '#7ee08a'); } },
    care: (h) => { h.r(0, 0, h.W, h.gr, '#f1ece2'); h.r(0, h.gr - 26, h.W, 2, C.wood); h.r(h.W * 0.15, 8, 26, 18, C.glass); },
    homein: (h) => { h.r(0, 0, h.W, h.gr, C.wall); h.r(h.W * 0.12, 8, 30, 22, C.sky); h.r(h.W * 0.12 + 14, 8, 2, 22, C.white); h.r(h.W * 0.6, h.gr - 16, 50, 4, C.wood); h.r(h.W * 0.6 + 4, h.gr - 12, 3, 12, C.wood); h.r(h.W * 0.6 + 43, h.gr - 12, 3, 12, C.wood); },
    park: (h) => { tree(h, 6, h.gr, false); tree(h, h.W - 26, h.gr, false); h.r(h.W * 0.55, h.gr - 10, 34, 3, C.wood); h.r(h.W * 0.55 + 2, h.gr - 7, 2, 7, C.dark); h.r(h.W * 0.55 + 30, h.gr - 7, 2, 7, C.dark); },
    sakura: (h) => { tree(h, 6, h.gr, true); tree(h, h.W * 0.5, h.gr, true); tree(h, h.W - 26, h.gr, true); h.r(h.W * 0.6, h.gr - 3, 40, 3, '#5aa0d8'); petals(h, 24); },
    festival: (h) => { h.g.strokeStyle = C.dark; h.g.lineWidth = 1; h.g.beginPath(); h.g.moveTo(0, 12); h.g.quadraticCurveTo(h.W / 2, 26, h.W, 12); h.g.stroke(); for (let x = 8; x < h.W; x += 18) { const y = 12 + Math.sin(x / h.W * Math.PI) * 13; h.r(x - 3, y, 7, 9, Math.floor(h.T * 2 + x) % 5 ? C.red : C.orange); h.r(x - 3, y + 3, 7, 1, C.white); } const sx = h.W * 0.62; h.r(sx, h.gr - 30, 46, 4, C.red); h.r(sx, h.gr - 26, 46, 3, C.white); h.r(sx + 2, h.gr - 23, 2, 23, C.wood); h.r(sx + 42, h.gr - 23, 2, 23, C.wood); h.r(sx, h.gr - 12, 46, 3, C.wood); },
    fireworks: (h) => { h.r(0, 0, h.W, h.gr, '#1f2747'); const ph = (h.T % 2.2) / 2.2, x = h.W * (0.3 + 0.4 * ((Math.floor(h.T / 2.2) * 0.37) % 1)), y = 20; const cols = [C.red, C.yellow, '#ffffff', C.pink, '#7ee0d6']; if (ph > 0.25) { const rr = (ph - 0.25) * 34; for (let k = 0; k < 14; k++) { const a = k / 14 * Math.PI * 2; h.r(x + Math.cos(a) * rr, y + Math.sin(a) * rr + ph * 6, 2, 2, cols[k % 5]); } } else h.r(x, h.gr - ph * 4 * (h.gr - y), 1, 3, C.yellow); },
    sports: (h) => { h.g.strokeStyle = C.dark; h.g.lineWidth = 1; h.g.beginPath(); h.g.moveTo(0, 10); h.g.quadraticCurveTo(h.W / 2, 22, h.W, 10); h.g.stroke(); const cols = [C.red, C.blue, C.yellow, C.green, '#ffffff']; for (let x = 4; x < h.W; x += 10) { const y = 10 + Math.sin(x / h.W * Math.PI) * 11; h.r(x, y, 6, 5, cols[(x / 10 | 0) % 5]); } h.r(0, h.gr - 6, h.W, 6, '#d9b98a'); for (let x = 0; x < h.W; x += 40) h.r(x, h.gr - 4, 26, 1, '#ffffff'); },
    stage: (h) => { h.r(0, 0, h.W, h.gr, '#2a1e2a'); h.r(0, 0, h.W, 8, C.red); for (let x = 0; x < h.W; x += 10) h.r(x, 8, 5, 4, C.red); h.g.globalAlpha = 0.18; h.g.fillStyle = '#fff6c8'; h.g.beginPath(); h.g.moveTo(h.W * 0.28, 0); h.g.lineTo(h.W * 0.12, h.gr); h.g.lineTo(h.W * 0.5, h.gr); h.g.lineTo(h.W * 0.36, 0); h.g.fill(); h.g.globalAlpha = 1; h.r(h.W * 0.6, h.gr - 18, 34, 12, C.black); h.r(h.W * 0.6, h.gr - 8, 34, 2, '#ffffff'); h.r(h.W * 0.6 + 2, h.gr - 6, 2, 6, C.black); h.r(h.W * 0.6 + 30, h.gr - 6, 2, 6, C.black); },
    sea: (h) => { h.r(0, h.gr - 18, h.W, 18, C.water); for (let x = 0; x < h.W; x += 12) h.r(x + (h.T * 8) % 12, h.gr - 18 + Math.sin(h.T * 2 + x) * 1.5, 6, 2, '#ffffff'); h.r(h.W - 30, 8, 12, 12, C.yellow); h.r(0, h.gr - 4, h.W * 0.45, 4, '#e9d8b4'); },
    mountain: (h) => { h.g.fillStyle = '#8aa3b8'; h.g.beginPath(); h.g.moveTo(h.W * 0.3, h.gr); h.g.lineTo(h.W * 0.62, h.gr - 58); h.g.lineTo(h.W * 0.95, h.gr); h.g.fill(); h.g.fillStyle = '#ffffff'; h.g.beginPath(); h.g.moveTo(h.W * 0.62 - 10, h.gr - 40); h.g.lineTo(h.W * 0.62, h.gr - 58); h.g.lineTo(h.W * 0.62 + 10, h.gr - 40); h.g.fill(); tree(h, 6, h.gr, false); },
    snow: (h) => { h.r(0, h.gr - 5, h.W, 5, '#ffffff'); h.r(h.W * 0.72, h.gr - 14, 14, 10, '#ffffff'); h.r(h.W * 0.72 + 2, h.gr - 22, 10, 9, '#ffffff'); h.r(h.W * 0.72 + 4, h.gr - 19, 1, 1, C.dark); h.r(h.W * 0.72 + 8, h.gr - 19, 1, 1, C.dark); h.r(h.W * 0.72 + 6, h.gr - 17, 2, 1, C.orange); for (let k = 0; k < 30; k++) h.r((k * 37 + Math.sin(h.T + k) * 6) % h.W, (k * 23 + h.T * 14) % h.gr, 2, 2, '#ffffff'); },
    onsen: (h) => { h.r(0, h.gr - 12, h.W, 12, '#9cc9d6'); for (let x = 0; x < h.W; x += 16) h.r(x, h.gr - 14, 12, 4, C.gray); h.g.globalAlpha = 0.45; for (let k = 0; k < 8; k++) h.r((k * 29) % h.W + Math.sin(h.T + k) * 3, h.gr - 18 - (h.T * 8 + k * 7) % 24, 3, 4, '#ffffff'); h.g.globalAlpha = 1; tree(h, h.W - 26, h.gr - 10, false); },
    izakaya: (h) => { h.r(0, 0, h.W, h.gr, '#5a3a2a'); for (let x = 12; x < h.W; x += 40) { h.r(x, 6, 10, 14, C.red); h.r(x, 9, 10, 2, C.dark); h.r(x, 15, 10, 2, C.dark); } h.r(0, h.gr - 14, h.W, 4, C.wood); for (let x = h.W * 0.5; x < h.W - 10; x += 22) { h.r(x, h.gr - 22, 7, 8, C.yellow); h.r(x, h.gr - 24, 7, 2, '#ffffff'); } },
    airport: (h) => { h.r(0, h.gr - 4, h.W, 4, C.gray); for (let x = 0; x < h.W; x += 16) h.r(x, h.gr - 2, 8, 1, '#ffffff'); const ph = (h.e * 0.5) % 1, px = h.W * (0.2 + ph * 0.9), py = h.gr - 10 - ph * ph * 60; h.prop('plane', px, py); },
    station: (h) => { h.r(0, h.gr - 8, h.W, 8, C.gray); h.r(0, 4, h.W, 4, C.dark); const tx = h.W - ((h.e * 60) % (h.W * 2)); h.r(tx, h.gr - 30, h.W * 0.9, 22, '#e2e2e2'); h.r(tx, h.gr - 20, h.W * 0.9, 3, C.green); for (let x = tx + 6; x < tx + h.W * 0.9 - 8; x += 16) h.r(x, h.gr - 28, 10, 6, C.glass); },
    bus: (h) => { h.r(0, h.gr - 4, h.W, 4, '#777'); for (let x = 0; x < h.W; x += 20) h.r(x, h.gr - 2, 10, 1, '#ffffff'); const bx = h.W * 0.5 + Math.sin(h.e) * 2; h.r(bx, h.gr - 30, 64, 24, C.yellow); h.r(bx, h.gr - 18, 64, 3, C.red); for (let x = bx + 4; x < bx + 58; x += 12) h.r(x, h.gr - 27, 9, 7, C.glass); h.r(bx + 8, h.gr - 7, 7, 7, C.dark); h.r(bx + 48, h.gr - 7, 7, 7, C.dark); },
    truck: (h) => { const bx = h.W * 0.5; h.r(bx, h.gr - 34, 46, 28, C.white); h.r(bx + 2, h.gr - 30, 42, 3, C.green); h.r(bx + 46, h.gr - 24, 16, 18, C.blue); h.r(bx + 50, h.gr - 22, 9, 7, C.glass); h.r(bx + 8, h.gr - 7, 8, 7, C.dark); h.r(bx + 48, h.gr - 7, 8, 7, C.dark); for (let k = 0; k < 2; k++) h.r(bx - 18 - k * 12, h.gr - 10 - k * 2, 10, 10 - k * 2, C.wood); },
    newhouse: (h) => { const cx = h.W * 0.66; h.r(cx - 24, h.gr - 30, 48, 30, C.white); h.g.fillStyle = C.blue; h.g.beginPath(); h.g.moveTo(cx - 30, h.gr - 30); h.g.lineTo(cx, h.gr - 52); h.g.lineTo(cx + 30, h.gr - 30); h.g.fill(); h.r(cx - 5, h.gr - 18, 10, 18, C.wood); h.r(cx - 18, h.gr - 24, 9, 8, C.glass); h.r(cx + 9, h.gr - 24, 9, 8, C.glass); if (Math.floor(h.e * 3) % 2) h.prop('sparkle', cx + 22, h.gr - 50); },
    police: (h) => { h.r(0, 0, h.W, h.gr, '#2c3044'); const cx = h.W * 0.62; h.r(cx, h.gr - 18, 52, 12, C.white); h.r(cx, h.gr - 12, 52, 6, C.black); h.r(cx + 12, h.gr - 26, 26, 8, C.white); h.r(cx + 22, h.gr - 30, 6, 4, Math.floor(h.T * 6) % 2 ? C.red : '#ff8a80'); h.r(cx + 6, h.gr - 6, 8, 6, C.dark); h.r(cx + 38, h.gr - 6, 8, 6, C.dark); if (Math.floor(h.T * 6) % 2) { h.g.globalAlpha = 0.15; h.r(0, 0, h.W, h.gr, C.red); h.g.globalAlpha = 1; } },
    lottery: (h) => { const cx = h.W * 0.6; h.r(cx, h.gr - 40, 44, 40, C.white); h.r(cx, h.gr - 40, 44, 10, C.red); for (let k = 0; k < 4; k++) h.r(cx + 4 + k * 10, h.gr - 37, 6, 4, C.yellow); h.r(cx + 8, h.gr - 26, 28, 12, C.glass); },
    pachinko: (h) => { h.r(0, 0, h.W, h.gr, '#2a1838'); for (let x = 4; x < h.W; x += 22) { h.r(x, h.gr - 46, 16, 40, '#4a2a5a'); h.r(x + 2, h.gr - 44, 12, 18, ['#ff6ec7', '#ffe14d', '#6ee7ff'][(Math.floor(h.T * 4) + x) % 3]); for (let k = 0; k < 3; k++) h.r(x + 3 + ((h.T * 20 + k * 4) % 10), h.gr - 22 + k * 4, 2, 2, '#dddddd'); } },
    quake: (h) => { h.r(0, 0, h.W, h.gr, C.wall); h.r(h.W * 0.2, 8, 26, 18, C.sky); h.g.strokeStyle = C.dark; h.g.beginPath(); h.g.moveTo(h.W * 0.6, 0); h.g.lineTo(h.W * 0.64, 14); h.g.lineTo(h.W * 0.6, 24); h.g.lineTo(h.W * 0.66, 40); h.g.stroke(); h.r(h.W * 0.8 + Math.sin(h.T * 30) * 2, h.gr - 30, 14, 30, C.wood); },
    flood: (h) => { const lv = Math.min(18, h.e * 6); h.g.globalAlpha = 0.6; h.r(0, h.gr - lv, h.W, lv + 6, '#8a7a5a'); h.g.globalAlpha = 1; for (let k = 0; k < 40; k++) h.r((k * 37 + h.T * 40) % h.W, (k * 23 + h.T * 160) % h.gr, 1, 4, C.water); },
    election: (h) => { h.r(h.W * 0.55, h.gr - 40, 60, 30, C.wood); for (let k = 0; k < 3; k++) h.r(h.W * 0.55 + 4 + k * 19, h.gr - 36, 15, 22, C.white); h.r(h.W * 0.55 + 8, h.gr - 32, 7, 7, '#d9b48e'); h.r(h.W * 0.55 + 4, h.gr - 10, 2, 10, C.wood); h.r(h.W * 0.55 + 54, h.gr - 10, 2, 10, C.wood); },
    night: (h) => { h.r(0, 0, h.W, h.gr, '#232a3f'); h.r(h.W - 28, 8, 10, 10, '#f6e3a8'); for (let k = 0; k < 14; k++) if ((Math.floor(h.T * 2) + k) % 5) h.r((k * 53) % h.W, (k * 13) % 40 + 4, 1, 1, '#ffffff'); }
  };

  // 服装（pixelChar の outfit）
  const OUT = {
    black: (l) => ({ top: '#1d1f26', bot: '#1d1f26', collar: 'blacktie', skirt: false }),
    suit: (l) => ({ top: l.sex === 'F' ? '#3d4250' : '#2f3542', bot: l.sex === 'F' ? '#3d4250' : '#2f3542', collar: 'tie', skirt: l.sex === 'F' }),
    bride: (l) => l.sex === 'F' ? { top: '#ffffff', bot: '#ffffff', collar: null, extra: null, dress: true } : { top: '#1d1f26', bot: '#1d1f26', collar: 'tie' },
    furisode: (l) => l.sex === 'F' ? { top: '#c0392b', bot: '#c0392b', collar: 'kimono', dress: true } : { top: '#2f3542', bot: '#5a5248', collar: 'kimono' },
    kimonoKid: (l) => ({ top: l.sex === 'F' ? '#e7889b' : '#3d4b6a', bot: l.sex === 'F' ? '#e7889b' : '#5a5248', collar: 'kimono', dress: l.sex === 'F' }),
    yukata: (l) => ({ top: l.sex === 'F' ? '#6b8cc4' : '#3d4b6a', bot: l.sex === 'F' ? '#6b8cc4' : '#3d4b6a', collar: 'kimono', dress: true }),
    apron: (l) => ({ top: '#ffffff', bot: '#3d4b6a', collar: 'apron', apron: '#4f9a6a', skirt: false }),
    apronRed: (l) => ({ top: '#ffffff', bot: '#3d4b6a', collar: 'apron', apron: '#c0392b', skirt: false }),
    chef: (l) => ({ top: '#ffffff', bot: '#3a332b', collar: 'apron', apron: '#dddddd', skirt: false }),
    work: (l) => ({ top: '#6a7b8a', bot: '#4a4a4a', collar: null, skirt: false }),
    coat: (l) => ({ top: '#ffffff', bot: '#3d4b6a', collar: 'coat', skirt: false }),
    pajama: (l) => ({ top: '#a9c7e6', bot: '#a9c7e6', collar: null, extra: null, skirt: false }),
    sport: (l) => ({ top: '#ffffff', bot: '#2c4a7a', collar: null, extra: null, skirt: false }),
    swim: (l) => ({ top: l.sex === 'F' ? '#2c4a7a' : null, bot: '#2c4a7a', collar: null, extra: null, skirt: false, bare: l.sex !== 'F' }),
    farm: (l) => ({ top: '#7d8c5a', bot: '#5a5248', collar: null, skirt: false }),
    gown: (l) => ({ top: '#1d1f26', bot: '#1d1f26', collar: null, skirt: false }),
    casual: (l) => null,
    // 私服（仕事や学校以外の場面）
    home: (l) => { const a = l.alive === false ? l.deathAge : l.age; if (a < 12) return null; const F = l.sex === 'F', k = ((l.born && l.born.d) || 0) % 4; return { top: (F ? ['#e0a46a', '#9fb7d6', '#d98a8a', '#b8c9a0'] : ['#7a8f6a', '#5d7d9a', '#9a5a4a', '#c9c2b4'])[k], bot: F && k % 2 ? '#8a6a7a' : '#3b4f7a', collar: null, extra: a >= 65 ? 'cardigan' : null, skirt: F && k % 2 === 1 }; },
    baseball: (l) => ({ top: '#ffffff', bot: '#ffffff', collar: null, skirt: false }),
    soccer: (l) => ({ top: '#2f6fb0', bot: '#ffffff', collar: null, skirt: false }),
    keeper: (l) => ({ top: '#e8b94a', bot: '#1d1f26', collar: null, skirt: false }),
    basket: (l) => ({ top: '#c0392b', bot: '#c0392b', collar: null, skirt: false }),
    basket2: (l) => ({ top: '#ffffff', bot: '#ffffff', collar: null, skirt: false }),
    volley: (l) => ({ top: '#e07b39', bot: '#1d1f26', collar: null, skirt: false }),
    tennis: (l) => ({ top: '#ffffff', bot: l.sex === 'F' ? '#ffffff' : '#2c4a7a', collar: null, skirt: l.sex === 'F' }),
    pingpong: (l) => ({ top: '#2f6fb0', bot: '#1d1f26', collar: null, skirt: false }),
    track: (l) => ({ top: '#c0392b', bot: '#1d1f26', collar: null, skirt: false }),
    kendo: (l) => ({ top: '#2b3550', bot: '#2b3550', collar: 'kimono', dress: true }),
    judo: (l) => ({ top: '#ffffff', bot: '#ffffff', collar: 'kimono', skirt: false })
  };

  // 出来事 → 場面。上から順に照合する
  // x：主人公の位置（幅に対する割合）、pose：stand/bow/sit/lie/jump/walk、npc：まわりの人、fam：家族も出る、fx：前景の小物
  const coworkers = (n, pose) => Array.from({ length: n }, (_, i) => ({ age: 30 + i * 9, sex: i % 2 ? 'F' : 'M', outfit: 'suit', x: 0.42 + i * 0.12, pose: pose || 'stand' }));
  const SCENES = [
    { re: /葬儀|告別式|お葬式|通夜|お別れ/, bg: 'funeral', out: 'black', pose: 'bow', x: 0.2, fam: true, label: 'お葬式', sad: true },
    { re: /亡くな|他界|永眠|死去|息を引き取/, bg: 'funeral', out: 'black', pose: 'bow', x: 0.2, fam: true, label: 'お別れ', sad: true },
    { re: /墓参り|お墓/, bg: 'grave', out: null, pose: 'bow', x: 0.3, fam: true, label: 'お墓参り' },
    { re: /結婚式|挙式|披露宴/, bg: 'wedding', out: 'bride', pose: 'stand', x: 0.3, partner: 'bride', fx: 'hearts', label: '結婚式' },
    { re: /結婚しました|入籍|夫婦になり|パートナーシップ/, bg: 'wedding', out: 'bride', pose: 'stand', x: 0.3, partner: 'bride', fx: 'hearts', label: '結婚' },
    { re: /付き合い始め|告白|デート|恋人ができ|好きな人/, bg: 'sakura', out: null, pose: 'stand', x: 0.35, partner: 'casual', fx: 'hearts', label: 'ときめき' },
    { re: /離婚|別れ|失恋|ふられ/, bg: 'night', out: null, pose: 'sit', x: 0.45, fx: 'cloud', label: 'ひとりの夜', sad: true },
    { re: /入社式|入社しました|社会人になり|働き始め|就職しました|採用され|研修医/, bg: 'office', out: 'suit', pose: 'bow', x: 0.2, npc: coworkers(2, 'bow'), fx: 'sakura', label: '入社' },
    { re: /内定/, bg: 'office', out: 'suit', pose: 'jump', x: 0.3, fx: 'confetti', label: '内定！' },
    { re: /昇進|課長|部長|係長|取締役|店長に/, bg: 'office', out: 'suit', pose: 'jump', x: 0.3, npc: coworkers(1), fx: 'confetti', label: '昇進' },
    { re: /定年|退職しました|退職の日|退官/, bg: 'office', out: 'suit', pose: 'bow', x: 0.25, npc: coworkers(2), fx: 'bouquet', label: '退職の日' },
    { re: /転職|辞め|失業|リストラ|倒産|解雇|仕事を失/, bg: 'park', out: null, pose: 'sit', x: 0.6, fx: 'cloud', label: 'しょんぼり', sad: true },
    { re: /起業|開業|店を開|お店を|独立/, bg: 'shop', out: 'apronRed', pose: 'stand', x: 0.5, fx: 'confetti', label: '開業！' },
    { re: /コンビニ/, bg: 'konbini', out: 'apron', pose: 'stand', x: 0.55, npc: [{ age: 40, sex: 'M', x: 0.2, out: null }], fx: 'counter', label: 'バイト中' },
    { re: /ファストフード|飲食店のホール|飲食|居酒屋で働|調理/, bg: 'kitchen', out: 'chef', pose: 'stand', x: 0.45, fx: 'tray', label: 'バイト中' },
    { re: /スーパーのレジ|品出し|販売/, bg: 'shop', out: 'apron', pose: 'stand', x: 0.55, npc: [{ age: 60, sex: 'F', x: 0.2 }], fx: 'counter', label: 'バイト中' },
    { re: /塾講師|家庭教師/, bg: 'classroom', out: null, pose: 'stand', x: 0.62, npc: [{ age: 13, sex: 'M', x: 0.25, pose: 'sit' }, { age: 12, sex: 'F', x: 0.4, pose: 'sit' }], label: 'バイト中' },
    { re: /アルバイト|バイト代|バイトを/, bg: 'konbini', out: 'apron', pose: 'stand', x: 0.55, fx: 'counter', label: 'バイト中' },
    { re: /将来の夢|なりたい|夢は/, bg: 'night', out: null, pose: 'stand', x: 0.4, fx: 'confetti', label: '将来の夢' },
    { re: /好きな教科|国語|算数|数学|理科|社会科|図工|家庭科/, bg: 'classroom', out: 'school', pose: 'stand', x: 0.4, fx: 'book', label: '好きな教科' },
    { re: /スイミング|水泳(?!部)/, bg: 'sea', out: 'swim', pose: 'jump', x: 0.3, label: 'スイミング' },
    { re: /野球|サッカー|バスケ|テニス|陸上|バレー|卓球|剣道|柔道|バドミントン|ソフトボール|吹奏楽部|美術部|科学部|パソコン部|合唱部|家庭科部/, club: true },
    { re: /空手|体操|運動部/, bg: 'sports', out: 'sport', pose: 'run', x: 0.25, label: '練習中' },
    { re: /英会話|公文|そろばん|プログラミング|通信教育|書道|習字/, bg: 'classroom', out: null, pose: 'sit', x: 0.4, fx: 'book', label: '習い事' },
    { re: /恐竜|電車|虫|絵本|ブロック|お絵かき|図鑑/, bg: 'homein', out: null, pose: 'sit', x: 0.35, fx: 'book', label: '夢中' },
    { re: /入学式|入学しました|入園/, bg: 'schoolgate', out: 'school', pose: 'stand', x: 0.22, fam: true, label: '入学式' },
    { re: /卒業/, bg: 'schoolgate', out: 'school', pose: 'jump', x: 0.22, fx: 'diploma', label: '卒業' },
    { re: /成人式|二十歳の集い|二十歳/, bg: 'ceremony', out: 'furisode', pose: 'stand', x: 0.4, npc: [{ age: 20, sex: 'F', x: 0.62, outfit: 'furisode' }, { age: 20, sex: 'M', x: 0.78, outfit: 'suit' }], label: '二十歳の集い' },
    { re: /七五三/, bg: 'shrine', out: 'kimonoKid', pose: 'stand', x: 0.3, fam: true, label: '七五三' },
    { re: /初詣|お参り|神社|お宮参り/, bg: 'shrine', out: null, pose: 'bow', x: 0.3, label: 'お参り' },
    { re: /不合格|落ち/, bg: 'night', out: null, pose: 'sit', x: 0.45, fx: 'cloud', label: '不合格', sad: true },
    { re: /合格/, bg: 'schoolgate', out: null, pose: 'jump', x: 0.3, fx: 'confetti', label: '合格！' },
    { re: /受験|模試|共通テスト|塾|勉強/, bg: 'juku', out: null, pose: 'sit', x: 0.5, fx: 'book', label: '勉強中' },
    { re: /花火/, bg: 'fireworks', out: 'yukata', pose: 'stand', x: 0.4, partner: 'yukata', label: '花火' },
    { re: /運動会|体育祭|リレー|マラソン大会/, bg: 'sports', out: 'sport', pose: 'run', x: 0.4, label: '運動会' },
    { re: /甲子園|インターハイ|大会|試合|全国|優勝/, bg: 'sports', out: 'sport', pose: 'jump', x: 0.4, fx: 'medal', label: '大会' },
    { re: /修学旅行|遠足|社会科見学|林間/, bg: 'bus', out: 'school', pose: 'stand', x: 0.2, label: '修学旅行' },
    { re: /文化祭|学園祭|大学祭|模擬店/, bg: 'festival', out: 'school', pose: 'stand', x: 0.4, fx: 'confetti', label: '文化祭' },
    { re: /祭り|ねぶた|竿燈|七夕|阿波おどり|よさこい|山笠|くんち|祇園祭|天神祭|三社祭|エイサー/, bg: 'festival', out: 'yukata', pose: 'jump', x: 0.35, label: 'お祭り' },
    { re: /花見|桜/, bg: 'sakura', out: null, pose: 'sit', x: 0.4, fam: true, label: 'お花見' },
    { re: /海|プール|泳/, bg: 'sea', out: 'swim', pose: 'stand', x: 0.3, label: '海' },
    { re: /雪|スキー|かまくら/, bg: 'snow', out: null, pose: 'stand', x: 0.35, label: '雪' },
    { re: /温泉|旅館|サウナ/, bg: 'onsen', out: 'yukata', pose: 'sit', x: 0.4, label: '温泉' },
    { re: /登山|富士山|山に|キャンプ/, bg: 'mountain', out: null, pose: 'walk', x: 0.2, fx: 'pack', label: '山へ' },
    { re: /海外|留学|ハワイ|台湾|韓国|グアム|ヨーロッパ|ニューヨーク/, bg: 'airport', out: null, pose: 'walk', x: 0.15, fx: 'suitcase', label: '海外へ' },
    { re: /旅行|帰省|新幹線|電車|鉄道/, bg: 'station', out: null, pose: 'stand', x: 0.2, fx: 'suitcase', label: 'おでかけ' },
    { re: /引っ越|一人暮らし|転勤|上京|Uターン/, bg: 'truck', out: null, pose: 'walk', x: 0.12, fx: 'box', label: '引っ越し' },
    { re: /家を買|マイホーム|一戸建て|マンションを(購入|買)|住宅ローン/, bg: 'newhouse', out: null, pose: 'jump', x: 0.2, fam: true, label: 'わが家' },
    { re: /生まれました|出産|誕生しました|第\d子|双子/, bg: 'hospital', out: null, pose: 'stand', x: 0.3, fx: 'baby', fam: true, label: '誕生' },
    { re: /孫/, bg: 'homein', out: null, pose: 'stand', x: 0.35, fx: 'baby', label: '孫' },
    { re: /入院|手術|がん|腫瘍|骨折|脳梗塞|心筋梗塞|肺炎|白血病|NICU/, bg: 'hospital', out: 'pajama', pose: 'lie', x: 0.3, label: '入院', sad: true },
    { re: /介護|車いす|老人ホーム|デイサービス|要介護|ヘルパー/, bg: 'care', out: null, pose: 'sit', x: 0.4, fx: 'wheelchair', label: '介護' },
    { re: /認知症|物忘れ/, bg: 'homein', out: null, pose: 'stand', x: 0.4, fx: 'question', label: '物忘れ' },
    { re: /診断|健康診断|血圧|糖尿病|通院/, bg: 'hospital', out: null, pose: 'sit', x: 0.4, npc: [{ age: 50, sex: 'M', x: 0.7, outfit: 'coat' }], label: '通院' },
    { re: /逮捕|補導|検挙|刑務所|判決/, bg: 'police', out: null, pose: 'bow', x: 0.3, label: '……', sad: true },
    { re: /宝くじ/, bg: 'lottery', out: null, pose: 'stand', x: 0.3, fx: 'coins', label: '宝くじ' },
    { re: /パチンコ|パチスロ|競馬|競艇|ボートレース|競輪/, bg: 'pachinko', out: null, pose: 'sit', x: 0.45, fx: 'coins', label: 'ギャンブル' },
    { re: /地震/, bg: 'quake', out: null, pose: 'sit', x: 0.3, label: '地震', sad: true, shake: true },
    { re: /津波|大雨|浸水|氾濫|台風|豪雨|避難/, bg: 'flood', out: null, pose: 'stand', x: 0.4, label: '避難', sad: true },
    { re: /飲み会|居酒屋|乾杯|お酒|同窓会|再会/, bg: 'izakaya', out: null, pose: 'sit', x: 0.3, npc: [{ age: -1, sex: 'M', x: 0.55, pose: 'sit' }, { age: -1, sex: 'F', x: 0.75, pose: 'sit' }], fx: 'mug', label: '乾杯' },
    { re: /ピアノ|発表会|合唱|吹奏楽|コンクール|演奏|ライブ|バンド/, bg: 'stage', out: 'gown', pose: 'stand', x: 0.3, fx: 'notes', label: 'ステージ' },
    { re: /選挙|立候補|議員/, bg: 'election', out: 'suit', pose: 'bow', x: 0.25, fx: 'mic', label: '選挙' },
    { re: /還暦|古希|喜寿|傘寿|米寿|卒寿|白寿|100歳|誕生日/, bg: 'homein', out: null, pose: 'stand', x: 0.35, fx: 'cake', fam: true, label: 'お祝い' },
    { re: /子犬|子猫|犬を飼|猫を飼|ペット/, bg: 'park', out: null, pose: 'walk', x: 0.3, label: 'ペットと' },
    { re: /農業|田んぼ|畑|収穫/, bg: 'farm', out: 'farm', pose: 'stand', x: 0.3, label: '畑仕事' }
  ];

  // ふだんの場面（学校・仕事・バイト・老後）
  function workplace(l) {
    const t = (l.job && l.job.title) || '';
    if (/医師|看護|薬剤|病院|介護|保健/.test(t)) return { bg: /介護/.test(t) ? 'care' : 'hospital', out: 'coat', label: '仕事中' };
    if (/農|酪農|林業/.test(t)) return { bg: 'farm', out: 'farm', label: '畑仕事' };
    if (/漁/.test(t)) return { bg: 'sea', out: 'work', label: '漁に出る' };
    if (/建設|大工|土木|電気工事|設備/.test(t)) return { bg: 'construction', out: 'work', label: '現場' };
    if (/工場|製造|メーカー|組立|技能/.test(t)) return { bg: 'factory', out: 'work', label: '工場' };
    if (/調理|飲食|料理|シェフ|パン/.test(t)) return { bg: 'kitchen', out: 'chef', label: '厨房' };
    if (/販売|店|スーパー|コンビニ|小売|レジ|経営者/.test(t)) return { bg: 'shop', out: 'apron', label: 'お店' };
    if (/教員|教師|先生|保育|講師/.test(t)) return { bg: /保育/.test(t) ? 'playground' : 'classroom', out: null, label: '授業中' };
    if (/運転|ドライバー|運送|配送|タクシー|バス/.test(t)) return { bg: 'truck', out: 'work', label: '運転中' };
    if (/議員/.test(t)) return { bg: 'election', out: 'suit', label: '議会' };
    return { bg: 'office', out: 'suit', label: '仕事中' };
  }
  function daily(l) {
    const a = l.age, st = l.edu.stage, out = [];
    if (a >= 3 && a <= 5) out.push({ bg: 'playground', out: null, pose: 'jump', label: '園で遊ぶ', w: 3 });
    if (['elem', 'jhs', 'hs'].includes(st)) { out.push({ bg: 'classroom', out: 'school', pose: 'sit', label: '授業中', w: 3, npc: [{ age: a, sex: 'M', x: 0.72, pose: 'sit', outfit: 'school' }, { age: a, sex: 'F', x: 0.86, pose: 'sit', outfit: 'school' }] }); if (a >= 12 && l.flags && l.flags.club) out.push({ ...club(l.flags.club, l), w: 3.5 }); }
    if (a >= 18 && a <= 26 && !['work', 'baby', 'elem', 'jhs', 'hs'].includes(st)) out.push({ bg: 'classroom', out: null, pose: 'sit', label: '講義中', w: 2 });
    if (l.flags && l.flags.baito && !l.job && a >= 15 && a <= 26) { const sc = SCENES.find((s) => s.re.test(l.flags.baito)) || SCENES.find((s) => s.label === 'バイト中'); out.push({ ...sc, w: 3 }); }
    if (l.job && !l.retired && a >= 18) out.push({ ...workplace(l), pose: 'stand', w: 3 });
    if (l.retired || a >= 66) out.push({ bg: 'park', out: null, pose: 'sit', label: 'ひなたぼっこ', w: 2 }, { bg: 'homein', out: null, pose: 'sit', fx: 'tea', label: 'お茶の時間', w: 2 });
    out.push({ bg: 'night', out: 'pajama', pose: 'lie', label: 'おやすみ', w: a <= 1 || a >= 80 ? 2 : 0.6 });
    return out;
  }
  // どの出来事にも場面が出るように：出来事の種類ごとの既定の場面
  function byCat(e, l) {
    const t = e.t || '', bad = e.tone === 'bad' || e.tone === 'grave';
    switch (e.c) {
      case 'school': return l.age <= 5 ? { bg: 'playground', pose: 'jump', x: 0.3, label: '園で' } : { bg: 'classroom', out: 'school', pose: bad ? 'sit' : 'stand', x: 0.4, fx: bad ? 'cloud' : null, label: '学校で' };
      case 'work': return { ...workplace(l), pose: bad ? 'sit' : 'stand', x: 0.3, fx: bad ? 'cloud' : null, label: bad ? 'しょんぼり' : '仕事で' };
      case 'family': return { bg: 'homein', pose: 'stand', x: 0.3, fam: true, fx: bad ? 'cloud' : 'hearts', label: '家族と' };
      case 'health': return bad ? { bg: 'hospital', out: 'pajama', pose: 'lie', x: 0.3, label: '療養中' } : { bg: 'hospital', pose: 'sit', x: 0.35, npc: [{ age: 50, sex: 'M', x: 0.7, outfit: 'coat' }], label: '病院で' };
      case 'money': return { bg: 'homein', pose: bad ? 'sit' : 'jump', x: 0.35, fx: bad ? 'cloud' : 'coins', label: 'お金のこと' };
      case 'love': return { bg: 'sakura', pose: 'stand', x: 0.35, partner: 'casual', fx: bad ? 'cloud' : 'hearts', label: 'ふたりで' };
      case 'world': return { bg: 'homein', pose: 'sit', x: 0.3, fx: 'tv', label: 'ニュース' };
      case 'crime': return { bg: 'police', pose: 'bow', x: 0.3, label: '……' };
      case 'birth': return { bg: 'hospital', pose: 'stand', x: 0.3, fx: 'baby', fam: true, label: '誕生' };
      case 'death': return { bg: 'funeral', out: 'black', pose: 'bow', x: 0.2, fam: true, label: 'お別れ' };
      case 'event': return { bg: 'festival', pose: 'jump', x: 0.35, fx: 'confetti', label: 'できごと' };
      case 'hobby': return null;
      default: return bad ? { bg: 'night', pose: 'sit', x: 0.45, fx: 'cloud', label: 'しょんぼり' } : !l.indep && l.age <= 12 ? { bg: 'park', pose: 'stand', x: 0.3, fam: true, fx: 'talk', label: 'ある日' } : { bg: 'park', pose: 'stand', x: 0.35, npc: [{ age: -1, sex: l.sex, x: 0.55 }], fx: 'talk', label: 'ある日' };
    }
  }
  // ---------- 部活：部ごとの練習風景（背景・ユニフォーム・道具の動き） ----------
  const gymFloor = (h) => { h.r(0, 0, h.W, h.gr, '#e9e2d3'); h.r(0, h.gr - 40, h.W, 40, '#e0d4bb'); for (let x = 0; x < h.W; x += 20) h.r(x, h.gr - 40, 1, 40, '#d4c6aa'); for (let x = 10; x < h.W; x += 46) h.r(x, 6, 26, 12, C.glass); h.r(0, h.gr - 41, h.W, 1, '#c9b48e'); };
  const fieldBg = (h, col) => { h.r(0, 0, h.W, h.gr, '#cfe3f2'); h.r(0, h.gr - 30, h.W, 30, col || '#8fc27a'); for (let x = 0; x < h.W; x += 24) h.r(x, h.gr - 30, 12, 30, 'rgba(255,255,255,.08)'); for (let x = 0; x < h.W; x += 7) h.r(x, h.gr - 44, 1, 14, '#9aa3b5'); h.r(0, h.gr - 44, h.W, 1, '#9aa3b5'); };
  const arc = (h, x0, y0, x1, y1, ht, t) => [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t - Math.sin(t * Math.PI) * ht];
  const pingpong = (t) => { const k = t % 2; return k < 1 ? k : 2 - k; }; // 0→1→0
  const racket = (h, x, y, up, col) => { h.r(x, y - (up ? 7 : 2), 1, 5, C.dark); h.r(x - 2, y - (up ? 12 : 7), 5, 5, col || '#c0392b'); };
  Object.assign(BG, {
    baseball: (h) => { h.r(0, 0, h.W, h.gr, '#cfe3f2'); h.r(0, h.gr - 32, h.W, 32, '#8fc27a'); h.r(0, h.gr - 12, h.W, 12, '#d9b98a'); for (let x = 0; x < 40; x += 4) h.r(x, h.gr - 56, 1, 44, '#6b6b6b'); for (let y = h.gr - 56; y < h.gr - 12; y += 4) h.r(0, y, 40, 1, '#6b6b6b'); h.r(h.W * 0.45, h.gr - 3, 8, 3, '#ffffff'); h.r(h.W * 0.72, h.gr - 15, 14, 3, '#e8d2ad'); },
    soccer: (h) => { fieldBg(h); h.r(h.W * 0.5, h.gr - 30, 1, 30, '#ffffff'); const gx = h.W - 34; h.r(gx, h.gr - 30, 2, 30, '#ffffff'); h.r(gx, h.gr - 30, 30, 2, '#ffffff'); h.r(gx + 28, h.gr - 30, 2, 30, '#ffffff'); for (let x = gx + 4; x < gx + 28; x += 4) h.r(x, h.gr - 28, 1, 28, 'rgba(255,255,255,.55)'); for (let y = h.gr - 24; y < h.gr; y += 4) h.r(gx + 2, y, 26, 1, 'rgba(255,255,255,.55)'); },
    basket: (h) => { gymFloor(h); const bx = h.W - 26; h.r(bx + 14, h.gr - 58, 3, 58, '#6b6b6b'); h.r(bx, h.gr - 64, 18, 14, '#ffffff'); h.r(bx + 4, h.gr - 60, 8, 6, 'rgba(192,57,43,.6)'); h.r(bx - 10, h.gr - 50, 12, 2, C.orange); for (let k = 0; k < 4; k++) h.r(bx - 9 + k * 3, h.gr - 48, 1, 6, '#ffffff'); },
    volley: (h) => { gymFloor(h); const nx = h.W * 0.52; h.r(nx, h.gr - 58, 2, 58, '#6b6b6b'); h.r(nx - 1, h.gr - 58, 4, 14, C.dark); for (let y = h.gr - 56; y < h.gr - 44; y += 3) h.r(nx - 1, y, 4, 1, '#ffffff'); },
    badminton: (h) => { gymFloor(h); const nx = h.W * 0.52; h.r(nx, h.gr - 50, 1, 50, '#6b6b6b'); h.r(nx - 1, h.gr - 50, 3, 10, '#ffffff'); for (let y = h.gr - 50; y < h.gr - 40; y += 2) h.r(nx - 1, y, 3, 1, C.dark); },
    pingpong: (h) => { gymFloor(h); const tx = h.W * 0.34; h.r(tx, h.gr - 20, h.W * 0.36, 4, '#2f6b4f'); h.r(tx, h.gr - 20, h.W * 0.36, 1, '#ffffff'); h.r(tx + h.W * 0.18, h.gr - 25, 1, 5, '#ffffff'); h.r(tx + 4, h.gr - 16, 2, 16, C.dark); h.r(tx + h.W * 0.36 - 6, h.gr - 16, 2, 16, C.dark); },
    tennis: (h) => { h.r(0, 0, h.W, h.gr, '#cfe3f2'); h.r(0, h.gr - 28, h.W, 28, '#c46a4a'); h.r(0, h.gr - 28, h.W, 1, '#ffffff'); h.r(0, h.gr - 14, h.W, 1, 'rgba(255,255,255,.7)'); for (let x = 0; x < h.W; x += 5) h.r(x, h.gr - 60, 1, 32, '#5c8a5a'); for (let y = h.gr - 60; y < h.gr - 28; y += 5) h.r(0, y, h.W, 1, '#5c8a5a'); const nx = h.W * 0.52; h.r(nx, h.gr - 14, 1, 14, C.dark); h.r(nx - 1, h.gr - 15, 3, 2, '#ffffff'); for (let y = h.gr - 13; y < h.gr; y += 2) h.r(nx - 1, y, 3, 1, '#ffffff'); },
    track: (h) => { h.r(0, 0, h.W, h.gr, '#cfe3f2'); h.r(0, h.gr - 46, h.W, 16, '#8fc27a'); h.r(0, h.gr - 30, h.W, 30, '#c0573f'); for (let y = h.gr - 24; y < h.gr; y += 8) h.r(0, y, h.W, 1, '#ffffff'); for (const x of [0.55, 0.8]) { h.r(h.W * x, h.gr - 10, 1, 10, '#ffffff'); h.r(h.W * x + 8, h.gr - 10, 1, 10, '#ffffff'); h.r(h.W * x, h.gr - 11, 9, 2, '#ffffff'); h.r(h.W * x + 2, h.gr - 11, 2, 2, C.dark); h.r(h.W * x + 6, h.gr - 11, 2, 2, C.dark); } },
    dojo: (h) => { h.r(0, 0, h.W, h.gr, '#efe1c4'); for (let x = 0; x < h.W; x += 30) h.r(x, 0, 3, h.gr - 20, '#b08a5a'); h.r(0, h.gr - 20, h.W, 20, '#d6b77e'); for (let x = 0; x < h.W; x += 16) h.r(x, h.gr - 20, 1, 20, '#c29f63'); h.r(h.W * 0.5 - 8, 6, 16, 26, '#fbf8f2'); for (let k = 0; k < 4; k++) h.r(h.W * 0.5 - 1, 10 + k * 5, 3, 3, C.dark); h.r(h.W * 0.5 - 30, 4, 60, 2, C.wood); },
    tatami: (h) => { BG.dojo(h); h.r(0, h.gr - 20, h.W, 20, '#a9b77a'); for (let x = 0; x < h.W; x += 28) h.r(x, h.gr - 20, 1, 20, '#7d8c5a'); h.r(0, h.gr - 20, h.W, 1, '#2f3f6b'); },
    pool: (h) => { h.r(0, 0, h.W, h.gr, '#e6eef2'); h.r(0, h.gr - 26, h.W, 26, '#5fa8d8'); for (let y = h.gr - 20; y < h.gr; y += 7) for (let x = 0; x < h.W; x += 6) h.r(x + (y % 2) * 3, y, 3, 1, x % 12 ? '#e8b94a' : '#c0392b'); h.r(0, h.gr - 32, 26, 6, '#fbf8f2'); h.r(4, h.gr - 32, 12, 2, C.blue); for (let k = 0; k < 10; k++) h.r((k * 37 + h.T * 10) % h.W, h.gr - 25 + (k % 3) * 8, 4, 1, 'rgba(255,255,255,.6)'); },
    music: (h) => { h.r(0, 0, h.W, h.gr, C.wall); h.r(h.W * 0.2, 8, h.W * 0.5, 22, '#2f5d46'); for (let k = 0; k < 5; k++) h.r(h.W * 0.2 + 4, 12 + k * 3, h.W * 0.5 - 8, 1, '#dfe7d8'); h.r(h.W * 0.3, 15, 3, 3, '#ffffff'); h.r(h.W * 0.42, 12, 3, 3, '#ffffff'); h.r(h.W * 0.55, 18, 3, 3, '#ffffff'); h.r(h.W - 40, h.gr - 30, 34, 30, '#1d1f26'); h.r(h.W - 38, h.gr - 18, 30, 4, '#ffffff'); for (let x = h.W - 37; x < h.W - 9; x += 4) h.r(x, h.gr - 18, 2, 2, C.dark); },
    art: (h) => { h.r(0, 0, h.W, h.gr, C.wall); for (let x = 8; x < h.W; x += 40) h.r(x, 10, 22, 16, ['#f4b6c2', '#a9c7e6', '#cfe3b2'][(x / 40 | 0) % 3]); h.r(h.W * 0.62, h.gr - 50, 2, 50, C.wood); h.r(h.W * 0.62 + 28, h.gr - 50, 2, 50, C.wood); h.r(h.W * 0.62 - 2, h.gr - 46, 34, 26, '#ffffff'); h.r(h.W * 0.62 - 4, h.gr - 20, 38, 2, C.wood); },
    lab: (h) => { h.r(0, 0, h.W, h.gr, '#eef2f2'); h.r(h.W * 0.15, 8, 26, 18, C.glass); h.r(h.W * 0.5, h.gr - 18, h.W * 0.45, 4, C.dark); h.r(h.W * 0.52, h.gr - 14, 3, 14, C.gray); h.r(h.W * 0.9, h.gr - 14, 3, 14, C.gray); const bx = h.W * 0.6; h.r(bx, h.gr - 28, 8, 10, 'rgba(127,179,224,.5)'); h.r(bx + 2, h.gr - 24, 4, 6, '#7ee08a'); h.r(bx + 16, h.gr - 32, 4, 14, 'rgba(244,182,194,.7)'); h.r(bx + 15, h.gr - 32, 6, 1, C.gray); for (let k = 0; k < 4; k++) h.r(bx + 3 + Math.sin(h.T * 3 + k) * 2, h.gr - 30 - ((h.T * 10 + k * 5) % 16), 2, 2, 'rgba(126,224,138,.7)'); },
    pcroom: (h) => { h.r(0, 0, h.W, h.gr, C.wall2); for (const x of [0.5, 0.72]) { h.r(h.W * x, h.gr - 16, 46, 3, C.wood); h.r(h.W * x + 10, h.gr - 32, 24, 16, C.dark); for (let k = 0; k < 4; k++) h.r(h.W * x + 12, h.gr - 30 + k * 3, ((h.T * 6 + k * 5 + x * 10) % 18) + 2, 1, k % 2 ? '#7ee08a' : '#7fb3e0'); } },
  });
  const mate = (a, sex, x, out, pose) => ({ age: -1, sex, x, outfit: out, pose: pose || 'stand' });
  // 主人公と同じ制服・ユニフォームの部員
  function club(name, l) {
    const sx = (l && l.sex) || 'M', n = name || '';
    if (/野球|ソフトボール/.test(n)) return { bg: 'baseball', out: 'baseball', pose: 'stand', x: 0.4, label: n.match(/野球部|ソフトボール部/) ? n.match(/野球部|ソフトボール部/)[0] : '練習中', npc: [mate(0, sx, 0.68, 'baseball')], anim: (h, m) => {
      // ピッチャーが投げて、打つ
      const t = (h.e % 1.6) / 1.6, sw = t > 0.75;
      cap(h, m, '#2c4a7a');
      const bx = m.x + m.w - h.P, by = m.hand; h.g.save(); h.g.translate(bx, by); h.g.rotate(sw ? 1.2 : -1.9); h.r(-1, -1, 2, 14, C.wood); h.g.restore();
      const [x, y] = t < 0.75 ? arc(h, h.W * 0.68, m.hand, bx + 4, by, 4, t / 0.75) : arc(h, bx + 4, by, h.W + 20, -10, 10, (t - 0.75) / 0.25);
      h.r(x, y, 3, 3, '#ffffff');
    } };
    if (/サッカー/.test(n)) return { bg: 'soccer', out: 'soccer', pose: 'run', x: 0.08, label: 'サッカー部', npc: [mate(0, sx, 0.8, 'keeper')], anim: (h, m) => {
      const kick = h.e % 5 > 3.6, t = Math.min(1, (h.e % 5 - 3.6) / 0.6);
      if (!kick) { const bounce = Math.abs(Math.sin(h.e * 8)) * 2; h.r(m.x + m.w + 2, h.gr - 5 - bounce, 5, 5, '#ffffff'); h.r(m.x + m.w + 3, h.gr - 4 - bounce, 2, 2, C.dark); }
      else { const [x, y] = arc(h, m.x + m.w + 2, h.gr - 5, h.W - 20, h.gr - 22, 12, t); h.r(x, y, 5, 5, '#ffffff'); h.r(x + 1, y + 1, 2, 2, C.dark); }
    } };
    if (/バスケ/.test(n)) return { bg: 'basket', out: 'basket', pose: 'stand', x: 0.45, label: 'バスケ部', npc: [mate(0, sx, 0.2, 'basket2')], anim: (h, m) => {
      const c = h.e % 3;
      if (c < 1.8) { const d = pingpong(c * 3); h.r(m.x + m.w, m.hand + d * (h.gr - m.hand - 6), 6, 6, C.orange); h.r(m.x + m.w + 2, m.hand + d * (h.gr - m.hand - 6), 1, 6, C.dark); }
      else { const [x, y] = arc(h, m.x + m.w, m.top - 4, h.W - 40, h.gr - 54, 14, Math.min(1, (c - 1.8) / 0.9)); h.r(x, y, 6, 6, C.orange); h.r(x + 2, y, 1, 6, C.dark); if (c > 2.7) h.prop('sparkle', h.W - 46, h.gr - 60); }
    } };
    if (/バレー/.test(n)) return { bg: 'volley', out: 'volley', pose: 'jump', x: 0.28, label: 'バレー部', npc: [mate(0, sx, 0.66, 'volley', 'jump')], anim: (h, m) => {
      const t = pingpong(h.e / 1.2), [x, y] = arc(h, m.x + m.w - 2, m.top + 2, h.W * 0.66 + 4, m.top + 2, 8, t); h.r(x, y, 5, 5, '#ffffff'); h.r(x + 1, y + 2, 3, 1, C.yellow); h.r(x + 2, y, 1, 5, C.blue);
    } };
    if (/バドミントン/.test(n)) return { bg: 'badminton', out: 'sport', pose: 'jump', x: 0.26, label: 'バドミントン部', npc: [mate(0, sx, 0.66, 'sport', 'jump')], anim: (h, m) => {
      const k = h.e / 1.3, t = pingpong(k), [x, y] = arc(h, m.x + m.w + 2, m.top + 4, h.W * 0.66, m.top + 4, 8, t);
      racket(h, m.x + m.w, m.hand, t < 0.2, C.blue); racket(h, h.W * 0.66 + 2, m.hand, t > 0.8, C.blue);
      h.r(x, y, 2, 2, '#ffffff'); h.r(x + (t < pingpong(k + 0.05) ? -2 : 2), y, 2, 1, '#e8e8e8');
    } };
    if (/テニス/.test(n)) return { bg: 'tennis', out: 'tennis', pose: 'stand', x: 0.22, label: n.includes('ソフト') ? 'ソフトテニス部' : 'テニス部', npc: [mate(0, sx, 0.68, 'tennis')], anim: (h, m) => {
      const t = pingpong(h.e / 1.1), [x, y] = arc(h, m.x + m.w + 2, m.hand - 2, h.W * 0.68, m.hand - 2, 12, t);
      racket(h, m.x + m.w, m.hand, t < 0.15, '#c0392b'); racket(h, h.W * 0.68 + 2, m.hand, t > 0.85, '#2c4a7a'); h.r(x, y, 3, 3, n.includes('ソフト') ? '#ffffff' : '#d8e84a');
      cap(h, m, '#ffffff');
    } };
    if (/卓球/.test(n)) return { bg: 'pingpong', out: 'pingpong', pose: 'stand', x: 0.22, label: '卓球部', npc: [mate(0, sx, 0.72, 'pingpong')], anim: (h, m) => {
      const k = h.e / 0.5, t = pingpong(k), tx = h.W * 0.34, tw = h.W * 0.36;
      // 自分のコートで1回はねて、相手のコートで1回はねる
      const x = tx + 4 + t * (tw - 8), y = h.gr - 22 - Math.abs(Math.sin(t * Math.PI * 2)) * 10;
      racket(h, m.x + m.w, m.hand + 4, t < 0.1, '#c0392b'); racket(h, h.W * 0.72 + 2, m.hand + 4, t > 0.9, C.dark); h.r(x, y, 2, 2, '#ffffff');
    } };
    if (/陸上/.test(n)) return { bg: 'track', out: 'track', pose: 'run', x: 0.02, label: '陸上部', npc: [mate(0, sx, 0.68, 'sport')], anim: (h, m) => {
      // ストップウォッチを持ったマネージャー
      h.r(h.W * 0.68 - 4, m.hand, 4, 4, '#ffffff'); h.r(h.W * 0.68 - 3, m.hand + 1, 2, 1, C.dark);
      if (Math.floor(h.e * 6) % 2) h.r(m.x - 4, h.gr - 3, 3, 2, '#d9b98a');
    } };
    if (/剣道/.test(n)) return { bg: 'dojo', out: 'kendo', pose: 'stand', x: 0.3, label: '剣道部', npc: [mate(0, sx, 0.6, 'kendo')], anim: (h, m) => {
      const hit = h.e % 1.4 < 0.35, oh = h.W * 0.6, ow = m.w;
      men(h, m.x, m.top, m.w, h.P); men(h, oh, m.top, ow, h.P);
      h.g.save(); h.g.translate(m.x + m.w - h.P, m.hand); h.g.rotate(hit ? -0.25 : -1.05); h.r(0, -1, 26, 2, '#e8d2ad'); h.r(0, -1, 5, 2, '#ffffff'); h.g.restore();
      h.g.save(); h.g.translate(oh + h.P, m.hand); h.g.rotate(Math.PI + 1.0); h.r(0, -1, 22, 2, '#e8d2ad'); h.g.restore();
      if (hit) { h.g.fillStyle = C.dark; h.g.font = 'bold 9px sans-serif'; h.g.fillText('メン！', m.x + m.w, m.top - 4); }
    } };
    if (/柔道/.test(n)) return { bg: 'tatami', out: 'judo', pose: 'stand', x: 0.36, label: '柔道部', npc: [mate(0, sx, 0.52, 'judo')], anim: (h, m) => { h.r(m.x + 2, m.hand + h.P, m.w - 4, h.P, C.dark); if (h.e % 2 < 1) h.prop('sparkle', m.x + m.w + 2, m.top); } };
    if (/水泳/.test(n)) return { bg: 'pool', out: 'swim', pose: 'jump', x: 0.02, label: '水泳部', npc: [], anim: (h, m) => {
      cap(h, m, '#2c4a7a');
      for (let k = 0; k < 3; k++) { const sx2 = ((h.e * 22 + k * 90) % (h.W - 40)) + 30, sy = h.gr - 18 + k * 7; h.r(sx2, sy, 6, 4, '#f2c9a5'); h.r(sx2, sy, 6, 2, k % 2 ? C.red : C.dark); h.r(sx2 - 6 - Math.sin(h.e * 10 + k) * 2, sy + 1, 4, 2, '#ffffff'); h.r(sx2 + 6 + (Math.floor(h.e * 6 + k) % 2) * 2, sy - 2, 3, 1, '#f2c9a5'); }
    } };
    if (/吹奏楽/.test(n)) return { bg: 'music', out: 'school', pose: 'stand', x: 0.3, label: '吹奏楽部', npc: [mate(0, 'F', 0.5, 'school', 'sit'), mate(0, 'M', 0.66, 'school', 'sit')], anim: (h, m) => {
      // トランペット
      h.r(m.x + m.w - 2 * h.P, m.top + 5 * h.P, 14, 2, '#e8b94a'); h.r(m.x + m.w + 10, m.top + 5 * h.P - 2, 4, 6, '#e8b94a');
      h.r(h.W * 0.5 + m.w - 4, m.hand, 3, 10, '#1d1f26'); h.r(h.W * 0.66 + m.w - 4, m.hand - 4, 4, 12, '#c9a24a');
      for (let k = 0; k < 3; k++) h.prop('note', m.x + m.w + 16 + k * 22 + (h.e * 8) % 10, m.top - 6 - (h.e * 9 + k * 9) % 18);
    } };
    if (/合唱/.test(n)) return { bg: 'stage', out: 'school', pose: 'stand', x: 0.26, label: '合唱部', npc: [mate(0, 'F', 0.38, 'school'), mate(0, 'M', 0.5, 'school'), mate(0, 'F', 0.62, 'school')], anim: (h, m) => { for (let k = 0; k < 3; k++) h.prop('note', m.x + 20 + k * 30 + (h.e * 6) % 10, m.top - 4 - (h.e * 9 + k * 9) % 16); } };
    if (/美術/.test(n)) return { bg: 'art', out: 'school', pose: 'stand', x: 0.42, label: '美術部', anim: (h, m) => {
      // 絵が少しずつできていく
      const p = Math.min(1, h.e / 5), cx = h.W * 0.62;
      h.r(cx + 2, h.gr - 30, 28 * p, 8, '#7fae7c'); h.r(cx + 4, h.gr - 42, 10 * Math.min(1, p * 2), 10, '#a9c7e6'); if (p > 0.5) h.r(cx + 18, h.gr - 40, 6, 6, '#e8b94a');
      const bx = m.x + m.w + Math.sin(h.e * 5) * 2; h.r(bx, m.hand - 4, 1, 6, C.wood); h.r(bx, m.hand - 6, 1, 2, C.red);
    } };
    if (/科学|理科/.test(n)) return { bg: 'lab', out: 'coat', pose: 'stand', x: 0.36, label: '科学部', anim: (h, m) => { if (h.e % 3 < 0.4) h.prop('sparkle', h.W * 0.6 + 2, h.gr - 44); } };
    if (/パソコン|コンピュータ|プログラミング/.test(n)) return { bg: 'pcroom', out: 'school', pose: 'sit', x: 0.42, label: 'パソコン部', npc: [mate(0, sx === 'M' ? 'F' : 'M', 0.64, 'school', 'sit')] };
    if (/家庭科/.test(n)) return { bg: 'kitchen', out: 'apron', pose: 'stand', x: 0.4, fx: 'tray', label: '家庭科部', npc: [mate(0, 'F', 0.22, 'apron')] };
    return { bg: 'sports', out: 'sport', pose: 'run', x: 0.25, label: '練習中' };
  }
  const cap = (h, m, col) => { h.r(m.x + h.P, m.top + h.P, m.w - 2 * h.P, 2 * h.P, col); h.r(m.x + m.w - 2 * h.P, m.top + 3 * h.P - 1, 3 * h.P, h.P, col); };
  // 剣道の面
  const men = (h, x, top, w, P) => { h.r(x + P, top, w - 2 * P, 6 * P, '#2b3550'); for (let k = 0; k < 4; k++) h.r(x + 3 * P, top + (1.5 + k) * P, w - 6 * P, 1, '#c9ccd4'); h.r(x, top + 5 * P, w, 2 * P, '#2b3550'); };
  // ---------- 日常の出来事の場面（下の EXTRA は SCENES の最後に足す） ----------
  const hold = (name, pal, dy) => (h, m) => h.prop(name, m.x + m.w - 2 * h.P, m.hand - (dy == null ? 3 : dy) * h.P, pal);
  const onTable = (name, xr, pal) => (h, m) => h.prop(name, h.W * xr, h.gr - 22, pal);
  const both = (...fs) => (h, m) => fs.forEach((f) => f(h, m));
  const sweat = (h, m) => { for (let k = 0; k < 2; k++) h.r(m.x + m.w + 2 + k * 4, m.top + 4 + ((h.e * 14 + k * 6) % 10), 2, 3, '#7fb3e0'); };
  const zzz = (h, m) => h.prop('z', m.x + m.w, m.top - 8 - (h.e * 6) % 10);
  const mask = (h, m) => h.r(m.x + m.w * 0.3, m.top + 5.5 * h.P, m.w * 0.4, 2 * h.P, '#ffffff');
  const rainFx = (h) => { for (let k = 0; k < 50; k++) h.r((k * 37 + h.T * 60) % h.W, (k * 23 + h.T * 180) % h.gr, 1, 5, 'rgba(127,179,224,.75)'); };
  const sunFx = (h) => { h.r(h.W - 34, 6, 16, 16, '#f2b33d'); for (let k = 0; k < 8; k++) { const an = k / 8 * Math.PI * 2 + h.T; h.r(h.W - 26 + Math.cos(an) * 13, 14 + Math.sin(an) * 13, 2, 2, '#f2b33d'); } h.g.globalAlpha = 0.12 + Math.sin(h.T * 3) * 0.05; h.r(0, 0, h.W, h.gr, '#f2a33d'); h.g.globalAlpha = 1; };
  const leaves = (h, n, cols) => { for (let k = 0; k < n; k++) h.r((k * 41 + h.T * 12 + Math.sin(h.T + k) * 8) % h.W, (k * 17 + h.T * 16) % h.gr, 3, 2, cols[k % cols.length]); };
  const crack = (h, m) => { const x = m.x + m.w - 2 * h.P, y = m.hand - 4 * h.P; h.r(x, y, 7, 11, C.dark); h.r(x + 1, y + 1, 5, 9, '#a9c7e6'); h.g.strokeStyle = '#ffffff'; h.g.lineWidth = 1; h.g.beginPath(); h.g.moveTo(x + 1, y + 2); h.g.lineTo(x + 4, y + 5); h.g.lineTo(x + 2, y + 7); h.g.lineTo(x + 6, y + 10); h.g.stroke(); };
  const bowlFx = (h) => { const x = h.W * 0.62 + 16; h.r(x, h.gr - 22, 14, 5, '#8a3a2a'); h.r(x + 2, h.gr - 17, 10, 1, '#5a2a1a'); h.g.globalAlpha = 0.5; for (let k = 0; k < 3; k++) h.r(x + 3 + k * 4 + Math.sin(h.T * 3 + k) * 1.5, h.gr - 28 - ((h.T * 8 + k * 4) % 8), 1, 3, '#bbbbbb'); h.g.globalAlpha = 1; };
  const tomatoes = (h) => { for (let k = 0; k < 3; k++) { h.r(h.W * 0.62 + k * 12, h.gr - 30, 2, 30, C.green); for (let j = 0; j < 3; j++) h.r(h.W * 0.62 + k * 12 - 2 + (j % 2) * 4, h.gr - 26 + j * 8, 4, 4, j === 1 && Math.floor(h.T) % 2 ? C.orange : C.red); } };
  const carFx = (col) => (h) => { const x = h.W * 0.58; h.r(x, h.gr - 14, 60, 10, col); h.r(x + 12, h.gr - 22, 32, 9, col); h.r(x + 15, h.gr - 20, 12, 6, C.glass); h.r(x + 30, h.gr - 20, 12, 6, C.glass); h.r(x + 8, h.gr - 5, 9, 5, C.dark); h.r(x + 44, h.gr - 5, 9, 5, C.dark); h.r(x + 56, h.gr - 12, 4, 3, '#f6e3a8'); };
  const bills = (h, m) => { h.r(m.x + m.w, m.hand - 6, 10, 12, '#ffffff'); for (let k = 0; k < 4; k++) h.r(m.x + m.w + 2, m.hand - 4 + k * 3, 6, 1, C.gray); h.g.fillStyle = C.red; h.g.font = 'bold 9px sans-serif'; h.g.fillText('！', m.x + m.w / 2 - 3, m.top - 3 - (Math.floor(h.e * 3) % 2) * 2); };
  Object.assign(BG, {
    living: (h) => { BG.homein(h); if ((h.Y || 2026) < 1968) { h.r(0, h.gr - 6, h.W, 6, '#c9b98a'); for (let x = 0; x < h.W; x += 22) h.r(x, h.gr - 6, 1, 6, '#a8985e'); h.r(h.W * 0.14, h.gr - 10, 40, 4, '#7a4e2e'); h.r(h.W * 0.14 + 4, h.gr - 6, 3, 6, '#5a3a22'); h.r(h.W * 0.14 + 33, h.gr - 6, 3, 6, '#5a3a22'); if ((h.Y || 2026) >= 1953) { const tx = h.W * 0.82; h.r(tx, h.gr - 30, 22, 18, '#6a4a2e'); h.r(tx + 3, h.gr - 27, 13, 12, Math.floor(h.T * 3) % 2 ? '#c8ccc8' : '#a8aca8'); h.r(tx + 18, h.gr - 26, 2, 2, '#d8b65a'); h.r(tx + 3, h.gr - 12, 2, 12, '#3a332b'); h.r(tx + 17, h.gr - 12, 2, 12, '#3a332b'); } return; } h.r(h.W * 0.12, h.gr - 14, 44, 10, '#c58a6a'); h.r(h.W * 0.12, h.gr - 20, 44, 6, '#b07a5a'); h.r(h.W * 0.12 + 2, h.gr - 4, 3, 4, C.dark); h.r(h.W * 0.12 + 39, h.gr - 4, 3, 4, C.dark); },
    kotatsu: (h) => { h.r(0, 0, h.W, h.gr, C.wall); for (let x = 0; x < h.W; x += 22) h.r(x, h.gr - 10, 1, 10, '#c9b48e'); h.r(0, h.gr - 10, h.W, 10, '#d9c79c'); h.r(h.W * 0.55, h.gr - 16, 56, 4, C.wood); h.r(h.W * 0.55 - 4, h.gr - 12, 64, 12, '#c0392b'); h.r(h.W * 0.55 + 16, h.gr - 22, 8, 6, C.orange); h.r(h.W * 0.55 + 26, h.gr - 21, 7, 5, C.orange); h.r(h.W * 0.15, 8, 20, 30, '#fbf8f2'); h.r(h.W * 0.15 + 8, 12, 4, 22, C.dark); },
    bedroom: (h) => { h.r(0, 0, h.W, h.gr, '#e6e0ef'); h.r(h.W * 0.7, 8, 26, 20, '#2c3550'); h.r(h.W * 0.7 + 8, 12, 6, 6, '#f6e3a8'); h.r(h.W * 0.05, h.gr - 30, 18, 30, C.wood); },
    library: (h) => { h.r(0, 0, h.W, h.gr, C.wall); for (let x = h.W * 0.45; x < h.W - 4; x += 30) { h.r(x, h.gr - 60, 28, 60, C.wood); for (let y = h.gr - 56; y < h.gr - 4; y += 12) { h.r(x + 2, y + 9, 24, 2, '#8a6a45'); for (let k = 0; k < 7; k++) h.r(x + 3 + k * 3.3, y, 3, 9, ['#c0392b', '#4f86c6', '#e8b94a', '#5c8a5a', '#9a5a7a'][(k + y) % 5]); } } },
    cinema: (h) => { h.r(0, 0, h.W, h.gr, '#1d1f26'); h.g.globalAlpha = 0.85 + Math.sin(h.T * 2) * 0.1; h.r(h.W * 0.1, 6, h.W * 0.8, 34, ['#7fb3e0', '#a9e0b5', '#f2c9a5'][Math.floor(h.T / 2) % 3]); h.g.globalAlpha = 1; for (let x = 0; x < h.W; x += 14) { h.r(x, h.gr - 12, 12, 12, '#8a2a2a'); h.r(x + 2, h.gr - 16, 8, 4, '#a33a3a'); } },
    gym: (h) => { h.r(0, 0, h.W, h.gr, '#e9eef2'); h.r(0, h.gr - 4, h.W, 4, '#3a3f4a'); const x = h.W * 0.6; h.r(x, h.gr - 20, 34, 6, C.dark); h.r(x + 2, h.gr - 14, 30, 2, C.gray); h.r(x + 24, h.gr - 36, 4, 22, C.gray); h.r(x + 18 + Math.sin(h.T * 8) * 1, h.gr - 40, 3, 4, C.dark); h.r(h.W * 0.85, h.gr - 50, 22, 46, '#9aa3b5'); h.r(h.W * 0.85 + 4, h.gr - 46, 14, 8, '#7ee08a'); },
    karaoke: (h) => { h.r(0, 0, h.W, h.gr, '#2a1e3a'); for (let k = 0; k < 12; k++) h.r((k * 53 + h.T * 30) % h.W, (k * 13) % (h.gr - 20), 3, 3, ['#f4b6c2', '#7fb3e0', '#e8b94a'][k % 3]); h.r(h.W * 0.62, 8, 60, 34, '#111'); h.r(h.W * 0.62 + 4, 12, 52, 26, '#3a5a9a'); h.r(h.W * 0.62 + 6, 30, (h.T * 10) % 48, 3, '#e8b94a'); h.r(0, h.gr - 10, h.W, 10, '#5a2a4a'); },
    restaurant: (h) => { h.r(0, 0, h.W, h.gr, '#f1e4cf'); for (let x = 10; x < h.W; x += 40) { h.r(x, 6, 18, 14, '#f6e3a8'); h.r(x + 8, 0, 2, 6, C.dark); } h.r(h.W * 0.55, h.gr - 18, 60, 4, '#ffffff'); h.r(h.W * 0.55 + 4, h.gr - 14, 3, 14, C.wood); h.r(h.W * 0.55 + 53, h.gr - 14, 3, 14, C.wood); h.r(h.W * 0.55 + 22, h.gr - 26, 4, 8, '#9a2a4a'); h.r(h.W * 0.55 + 34, h.gr - 22, 10, 4, '#ffffff'); },
    meeting: (h) => { BG.office(h); h.r(h.W * 0.15, 6, 46, 28, '#ffffff'); h.r(h.W * 0.15 + 4, 26, 6, 6, C.blue); h.r(h.W * 0.15 + 12, 20, 6, 12, C.green); h.r(h.W * 0.15 + 20, 14, 6, 18, C.red); },
    autumn: (h) => { h.r(0, 0, h.W, h.gr, '#f4e6d2'); for (const x of [0.05, 0.4, 0.75]) { h.r(h.W * x + 6, h.gr - 18, 4, 18, C.wood); h.r(h.W * x - 4, h.gr - 36, 24, 20, x === 0.4 ? '#e8b94a' : '#d9663a'); h.r(h.W * x, h.gr - 42, 16, 8, x === 0.4 ? '#e8b94a' : '#c0392b'); } leaves(h, 20, ['#d9663a', '#e8b94a', '#c0392b']); },
    summer: (h) => { h.r(0, 0, h.W, h.gr, '#bfe3f7'); sunFx(h); h.r(0, h.gr - 18, h.W, 18, '#a9d68a'); for (let x = 10; x < h.W; x += 50) { h.r(x + 4, h.gr - 40, 3, 22, C.green); h.r(x, h.gr - 46, 11, 8, '#f2c23d'); h.r(x + 3, h.gr - 43, 5, 3, '#7a4a1a'); } },
    typhoon: (h) => { h.r(0, 0, h.W, h.gr, '#5a6475'); for (let x = 0; x < h.W; x += 50) { h.r(x + 10, h.gr - 40, 30, 40, '#7d8596'); for (let y = h.gr - 34; y < h.gr - 4; y += 10) h.r(x + 14, y, 22, 5, '#f6e3a8'); } h.g.save(); h.g.translate(-((h.T * 40) % 10), 0); rainFx(h); h.g.restore(); h.r(h.W * 0.35 + Math.sin(h.T * 5) * 20, 20 + Math.cos(h.T * 4) * 8, 6, 3, C.leaf); },
    winter: (h) => { BG.kotatsu(h); h.r(h.W * 0.15, 8, 20, 30, '#cfe3f2'); for (let k = 0; k < 6; k++) h.r(h.W * 0.15 + 2 + (k * 7) % 16, 10 + ((h.T * 6 + k * 9) % 26), 2, 2, '#ffffff'); },
    garden: (h) => { h.r(0, 0, h.W, h.gr, '#d7ecd0'); h.r(0, h.gr - 8, h.W, 8, '#8a6a45'); for (let x = 6; x < h.W * 0.5; x += 14) { h.r(x + 3, h.gr - 18, 2, 10, C.green); h.r(x, h.gr - 22, 8, 5, ['#d9667a', '#e8b94a', '#9a7ac6'][(x / 14 | 0) % 3]); } tree(h, h.W - 30, h.gr, false); for (let k = 0; k < 5; k++) h.r(h.W - 26 + (k % 3) * 5, h.gr - 30 + (k % 2) * 6, 3, 3, C.orange); },
    street: (h) => { if ((h.Y || 2026) < 1965) { h.r(0, 0, h.W, h.gr, '#e8e4d8'); for (let x = 0; x < h.W; x += 44) { h.r(x, h.gr - 34, 38, 34, '#8a6a48'); h.r(x - 3, h.gr - 40, 44, 7, '#4a4a52'); h.r(x + 4, h.gr - 26, 12, 10, '#d8d0b8'); for (let k = 0; k < 3; k++) h.r(x + 4 + k * 4, h.gr - 26, 1, 10, '#6a4a2e'); h.r(x + 22, h.gr - 22, 12, 22, '#6a4a2e'); } h.r(x0Pole(h), h.gr - 50, 2, 50, '#6a4a2e'); h.r(0, h.gr - 2, h.W, 2, '#b8a888'); return; } h.r(0, 0, h.W, h.gr, '#e6eef2'); for (let x = 0; x < h.W; x += 48) { h.r(x, h.gr - 46, 40, 46, ['#efe6d6', '#e2d6c2', '#dfe7ea'][(x / 48 | 0) % 3]); h.r(x + 4, h.gr - 38, 12, 10, C.glass); h.r(x + 22, h.gr - 38, 12, 10, C.glass); h.r(x + 14, h.gr - 18, 12, 18, C.wood); } h.r(0, h.gr - 2, h.W, 2, '#bbbbbb'); },
    dealer: (h) => { h.r(0, 0, h.W, h.gr, '#eef2f2'); h.r(0, 4, h.W, 30, C.glass); for (let x = 0; x < h.W; x += 40) h.r(x, 4, 2, 30, '#ffffff'); h.r(0, 0, h.W, 4, C.blue); },
    nursery: (h) => { h.r(0, 0, h.W, h.gr, '#fbefe6'); for (let k = 0; k < 6; k++) { h.r(16 + k * 14, 10 + Math.sin(h.T * 2 + k) * 2, 8, 8, ['#f4b6c2', '#a9c7e6', '#f6e3a8'][k % 3]); h.r(19 + k * 14, 2, 1, 8 + Math.sin(h.T * 2 + k) * 2, C.gray); } h.r(h.W * 0.62, h.gr - 22, 40, 2, '#ffffff'); for (let x = h.W * 0.62; x < h.W * 0.62 + 40; x += 5) h.r(x, h.gr - 22, 1, 22, '#ffffff'); },
    mask: (h) => { BG.street(h); h.g.globalAlpha = 0.18; h.r(0, 0, h.W, h.gr, '#9aa3b5'); h.g.globalAlpha = 1; },
    bath: (h) => { h.r(0, 0, h.W, h.gr, '#e6f0f4'); for (let x = 0; x < h.W; x += 10) for (let y = 0; y < h.gr - 20; y += 10) h.r(x, y, 9, 9, '#d6e6ee'); h.r(h.W * 0.2, h.gr - 18, 70, 18, '#ffffff'); h.r(h.W * 0.2 + 3, h.gr - 15, 64, 6, '#7fb3e0'); h.g.globalAlpha = 0.4; for (let k = 0; k < 4; k++) h.r(h.W * 0.25 + k * 14 + Math.sin(h.T + k) * 3, h.gr - 30 - ((h.T * 6 + k * 5) % 14), 3, 4, '#ffffff'); h.g.globalAlpha = 1; },
    dmv: (h) => { BG.office(h); h.r(h.W * 0.05, 6, 60, 10, C.blue); h.g.fillStyle = '#ffffff'; h.g.font = 'bold 7px sans-serif'; h.g.fillText('運転免許', h.W * 0.05 + 6, 14); }
  });
  const EXTRA = [
    // 赤ちゃん・幼児
    { re: /首がすわり|つかまり立ち|一歩、二歩|初めて「(ママ|パパ)」と言い|寝返り|はいはい/, bg: 'nursery', out: null, pose: 'stand', x: 0.35, fam: true, fx: 'hearts', label: 'できた！' },
    { re: /離乳食|ほおばり|卵ばかり|回転寿司/, bg: 'kitchen', out: null, pose: 'sit', x: 0.35, fam: true, fx: 'cake', label: 'もぐもぐ' },
    { re: /夜泣き|眠れません|寝不足/, bg: 'bedroom', out: 'pajama', pose: 'stand', x: 0.35, fam: true, anim: zzz, label: '夜中' },
    { re: /予防接種|小児科|突発性発疹|高い熱|熱が出/, bg: 'hospital', out: null, pose: 'sit', x: 0.32, fam: true, npc: [{ age: 50, sex: 'F', x: 0.72, outfit: 'coat' }], label: '病院で' },
    { re: /慣らし保育|保育園の送り迎え|保育園に入り/, bg: 'playground', out: null, pose: 'stand', x: 0.3, fam: true, label: '保育園' },
    { re: /アヒル|お風呂/, bg: 'bath', out: 'swim', pose: 'sit', x: 0.32, fam: true, label: 'お風呂' },
    { re: /鳩を追いかけ|ダンゴムシ|水たまり|鬼ごっこ|長靴/, bg: 'park', out: null, pose: 'run', x: 0.1, label: '外遊び' },
    { re: /節分|鬼のお面/, bg: 'homein', out: null, pose: 'jump', x: 0.3, fam: true, anim: (h, m) => { for (let k = 0; k < 5; k++) h.r(m.x + m.w + 4 + ((h.e * 40 + k * 9) % 50), m.hand - 6 + (k % 3) * 3, 2, 2, '#e8d2ad'); }, label: '節分' },
    { re: /サンタ|クリスマス/, bg: 'living', out: null, pose: 'sit', x: 0.4, fam: true, anim: (h) => { const x = h.W * 0.82; h.r(x + 6, h.gr - 8, 4, 8, C.wood); for (let k = 0; k < 4; k++) h.r(x + 8 - k * 3, h.gr - 12 - k * 7, 2 + k * 6, 6, C.green); h.r(x + 6, h.gr - 44, 4, 4, C.yellow); h.r(x - 6, h.gr - 8, 8, 8, C.red); }, label: 'クリスマス' },
    { re: /迷子/, bg: 'shop', out: null, pose: 'stand', x: 0.3, fx: 'question', label: '迷子' },
    { re: /ひらがな|名前を書け|書き初め|お手紙|手紙を書/, bg: 'homein', out: null, pose: 'sit', x: 0.35, anim: hold('note'), label: 'かきかき' },
    { re: /補助輪|一輪車|自転車/, bg: 'park', out: null, pose: 'run', x: 0.1, anim: (h, m) => { h.g.strokeStyle = C.dark; h.g.lineWidth = 1; for (const dx of [-2, m.w + 2]) { h.g.beginPath(); h.g.arc(m.x + dx, h.gr - 5, 5, 0, Math.PI * 2); h.g.stroke(); } h.r(m.x - 2, h.gr - 8, m.w + 4, 1, C.red); }, label: '自転車' },
    { re: /洗濯物|お手伝い/, bg: 'homein', out: null, pose: 'sit', x: 0.35, fam: true, anim: onTable('box', 0.5), label: 'お手伝い' },
    { re: /おゆうぎ会|学芸会|劇/, bg: 'stage', out: 'kimonoKid', pose: 'stand', x: 0.3, fam: false, npc: [{ age: -1, sex: 'F', x: 0.5, outfit: 'kimonoKid' }], label: '発表会' },
    { re: /好きな子|好きな人とLINE/, bg: 'playground', out: null, pose: 'stand', x: 0.3, partner: 'casual', fx: 'hearts', label: 'どきどき' },
    // 小学生〜高校生
    { re: /九九|漢字テスト|100点|二重跳び/, bg: 'classroom', out: 'school', pose: 'jump', x: 0.3, anim: (h, m) => { h.r(m.x + m.w, m.hand - 8, 12, 14, '#ffffff'); h.r(m.x + m.w + 2, m.hand - 6, 8, 8, 'rgba(192,57,43,.8)'); h.r(m.x + m.w + 4, m.hand - 4, 4, 4, '#ffffff'); }, label: 'やった！' },
    { re: /夏休みの宿題|自由研究|観察日記|一夜漬け|徹夜でレポート|レポートを仕上げ/, bg: 'bedroom', out: null, pose: 'sit', x: 0.4, anim: both(hold('book'), sweat), label: '宿題' },
    { re: /アサガオ|メダカ/, bg: 'classroom', out: 'school', pose: 'stand', x: 0.3, anim: (h, m) => { h.r(m.x + m.w + 8, h.gr - 12, 12, 12, C.glass); h.r(m.x + m.w + 12 + Math.sin(h.e * 3) * 3, h.gr - 7, 3, 2, C.orange); }, label: '生きもの係' },
    { re: /25メートル泳げ|プール/, bg: 'pool', out: 'swim', pose: 'jump', x: 0.04, label: 'プール' },
    { re: /給食|揚げパン|学食/, bg: 'classroom', out: 'school', pose: 'sit', x: 0.35, npc: [{ age: -1, sex: 'F', x: 0.62, pose: 'sit', outfit: 'school' }], fx: 'tray', label: 'ごはん' },
    { re: /リレー|運動会|体育祭|騎馬戦|持久走|かけっこ/, bg: 'track', out: 'sport', pose: 'run', x: 0.04, npc: [{ age: -1, sex: 'M', x: 0.75, pose: 'jump', outfit: 'sport' }], label: '運動会' },
    { re: /席替え|学級委員|転校生|放課後の教室|後輩から「先輩」/, bg: 'classroom', out: 'school', pose: 'stand', x: 0.32, npc: [{ age: -1, sex: 'F', x: 0.52, outfit: 'school' }, { age: -1, sex: 'M', x: 0.68, outfit: 'school' }], fx: 'talk', label: '学校で' },
    { re: /インフルエンザ|学級閉鎖|寝込み|風邪/, bg: 'bedroom', out: 'pajama', pose: 'lie', x: 0.3, anim: (h, m) => h.r(m.x + 8, h.gr - 16, 6, 3, '#ffffff'), label: 'おやすみ' },
    { re: /けんかして、?次の日に仲直り|友だちとけんか/, bg: 'playground', out: null, pose: 'stand', x: 0.3, npc: [{ age: -1, sex: 'M', x: 0.52 }], fx: 'hearts', label: '仲直り' },
    { re: /おこづかい|駄菓子屋/, bg: 'shop', out: null, pose: 'stand', x: 0.3, fx: 'coins', label: 'おかいもの' },
    { re: /歯が抜け/, bg: 'homein', out: null, pose: 'jump', x: 0.35, fam: true, anim: (h, m) => { const t = (h.e % 1.5) / 1.5; h.r(m.x + m.w + t * 40, m.top - Math.sin(t * Math.PI) * 30, 2, 2, '#ffffff'); }, label: '歯が抜けた' },
    { re: /職場体験/, bg: 'shop', out: 'apron', pose: 'stand', x: 0.55, fx: 'counter', label: '職場体験' },
    { re: /定期テスト|模試|赤点|判定/, bg: 'classroom', out: 'school', pose: 'sit', x: 0.4, anim: (h, m) => { h.r(m.x + m.w, m.hand - 4, 12, 10, '#ffffff'); for (let k = 0; k < 3; k++) h.r(m.x + m.w + 2, m.hand - 2 + k * 3, 8, 1, C.gray); }, label: 'テスト' },
    { re: /合唱コンクール/, bg: 'stage', out: 'school', pose: 'stand', x: 0.26, npc: [{ age: -1, sex: 'F', x: 0.4, outfit: 'school' }, { age: -1, sex: 'M', x: 0.54, outfit: 'school' }], fx: 'notes', label: '合唱' },
    { re: /スマホを持|スマホを持たせ/, bg: 'homein', out: null, pose: 'jump', x: 0.35, anim: hold('phone'), label: 'スマホ' },
    { re: /声変わり|背が急に伸び|制服がきつく/, bg: 'homein', out: 'school', pose: 'stand', x: 0.4, fam: true, anim: (h, m) => { h.r(m.x - 8, m.top, 3, h.gr - m.top, C.wood); for (let y = m.top; y < h.gr; y += 6) h.r(m.x - 8, y, 5, 1, C.dark); }, label: '成長' },
    { re: /親と進路|三者面談|進路について/, bg: 'classroom', out: 'school', pose: 'sit', x: 0.3, npc: [{ age: 45, sex: 'F', x: 0.5, pose: 'sit' }, { age: 40, sex: 'M', x: 0.7, outfit: 'suit' }], label: '面談' },
    { re: /朝練/, bg: 'track', out: 'sport', pose: 'run', x: 0.04, anim: (h) => { h.r(h.W - 30, 10, 12, 12, '#f6c88a'); }, label: '朝練' },
    { re: /文化祭|模擬店|学園祭|焼きそば/, bg: 'festival', out: 'apron', pose: 'stand', x: 0.4, npc: [{ age: -1, sex: 'F', x: 0.62, outfit: 'school' }], fx: 'counter', label: '文化祭' },
    { re: /カラオケ/, bg: 'karaoke', out: null, pose: 'stand', x: 0.3, fx: 'mic', npc: [{ age: -1, sex: 'F', x: 0.5, pose: 'sit' }], anim: (h, m) => { for (let k = 0; k < 2; k++) h.prop('note', m.x + m.w + 6 + k * 12 + (h.e * 6) % 10, m.top - (h.e * 9 + k * 7) % 16); }, label: 'カラオケ' },
    { re: /通学|片道40分/, bg: 'street', out: 'school', pose: 'run', x: 0.05, anim: (h, m) => { h.g.strokeStyle = C.dark; h.g.lineWidth = 1; for (const dx of [-2, m.w + 2]) { h.g.beginPath(); h.g.arc(m.x + dx, h.gr - 5, 5, 0, Math.PI * 2); h.g.stroke(); } }, label: '通学' },
    { re: /ファストフード店で友だちと勉強|単語帳/, bg: 'restaurant', out: 'school', pose: 'sit', x: 0.35, anim: hold('book'), label: '勉強' },
    { re: /オープンキャンパス|大学の雰囲気/, bg: 'schoolgate', out: null, pose: 'walk', x: 0.1, label: 'キャンパス' },
    { re: /卒業アルバム/, bg: 'schoolgate', out: 'school', pose: 'stand', x: 0.3, npc: [{ age: -1, sex: 'F', x: 0.5, outfit: 'school' }], anim: (h) => { if (h.e % 2 < 0.2) { h.g.globalAlpha = 0.6; h.r(0, 0, h.W, h.gr, '#ffffff'); h.g.globalAlpha = 1; } }, label: 'はいチーズ' },
    // 大学・若いころ
    { re: /サークル|新歓|ゼミの合宿/, bg: 'izakaya', out: null, pose: 'sit', x: 0.3, npc: [{ age: -1, sex: 'F', x: 0.5, pose: 'sit' }, { age: -1, sex: 'M', x: 0.68, pose: 'sit' }], fx: 'mug', label: 'わいわい' },
    { re: /教習所|免許を取り|免許の更新/, bg: 'dmv', out: null, pose: 'stand', x: 0.35, anim: (h, m) => { h.r(m.x + m.w, m.hand - 2, 10, 7, '#e8f0d8'); h.r(m.x + m.w + 1, m.hand - 1, 3, 4, C.blue); }, label: '免許' },
    { re: /自炊|一人暮らしの部屋/, bg: 'kitchen', out: 'apron', pose: 'stand', x: 0.45, anim: hold('pot', null, 1), label: '自炊' },
    { re: /奨学金/, bg: 'classroom', out: null, pose: 'sit', x: 0.4, fx: 'coins', label: '奨学金' },
    { re: /インターン|就活用のスーツ|就活/, bg: 'office', out: 'suit', pose: 'stand', x: 0.3, anim: hold('briefcase', null, 0), label: '就活' },
    { re: /ドライブ|車を買い替え|車を買い/, bg: 'street', out: null, pose: 'stand', x: 0.25, anim: carFx('#4f86c6'), label: 'くるま' },
    // 仕事
    { re: /ボーナス|初任給/, bg: 'restaurant', out: null, pose: 'sit', x: 0.3, fam: true, fx: 'coins', label: 'ごちそう' },
    { re: /ミスをして|謝りに|出し直し/, bg: 'office', out: 'suit', pose: 'bow', x: 0.3, npc: [{ age: 50, sex: 'M', x: 0.55, outfit: 'suit', pose: 'bow' }], anim: sweat, label: 'おわび' },
    { re: /ほめられ|社内表彰|社内の資格|表彰/, bg: 'office', out: 'suit', pose: 'stand', x: 0.3, npc: [{ age: 55, sex: 'M', x: 0.55, outfit: 'suit' }], fx: 'medal', label: '表彰' },
    { re: /終電|ネットカフェ|残業|会議|昼ごはんを食べ損ね/, bg: 'meeting', out: 'suit', pose: 'sit', x: 0.4, anim: both(sweat, (h) => { h.r(h.W - 26, 8, 14, 14, '#ffffff'); h.r(h.W - 19, 10, 1, 6, C.dark); h.r(h.W - 19, 15, 5, 1, C.dark); }), label: '仕事中' },
    { re: /同期と飲み|愚痴|立ち飲み|歓迎会|忘年会|飲み会/, bg: 'izakaya', out: 'suit', pose: 'sit', x: 0.3, npc: [{ age: -1, sex: 'M', x: 0.5, pose: 'sit', outfit: 'suit' }, { age: -1, sex: 'F', x: 0.68, pose: 'sit', outfit: 'suit' }], fx: 'mug', label: 'かんぱい' },
    { re: /後輩ができ|後輩の相談|部下/, bg: 'office', out: 'suit', pose: 'stand', x: 0.3, npc: [{ age: 23, sex: 'F', x: 0.5, outfit: 'suit' }], fx: 'talk', label: '先輩として' },
    { re: /プロジェクト|商談|企画|取引先/, bg: 'meeting', out: 'suit', pose: 'stand', x: 0.3, npc: [{ age: 45, sex: 'M', x: 0.55, outfit: 'suit' }, { age: 35, sex: 'F', x: 0.72, outfit: 'suit' }], label: '会議' },
    { re: /リモートワーク/, bg: 'homein', out: null, pose: 'sit', x: 0.4, anim: (h, m) => { h.r(m.x + m.w + 2, m.hand - 6, 14, 9, C.dark); h.r(m.x + m.w + 3, m.hand - 5, 12, 6, '#7fb3e0'); }, label: '在宅勤務' },
    { re: /満員電車/, bg: 'station', out: 'suit', pose: 'stand', x: 0.35, npc: [{ age: 40, sex: 'M', x: 0.2, outfit: 'suit' }, { age: 30, sex: 'F', x: 0.5, outfit: 'suit' }, { age: 50, sex: 'M', x: 0.6, outfit: 'suit' }], anim: sweat, label: '通勤' },
    { re: /健康診断|人間ドック|再検査|コレステロール|体重が増え/, bg: 'hospital', out: null, pose: 'stand', x: 0.3, npc: [{ age: 50, sex: 'M', x: 0.65, outfit: 'coat' }], anim: (h, m) => { h.r(m.x + m.w, m.hand - 4, 10, 12, '#ffffff'); h.r(m.x + m.w + 2, m.hand - 2, 6, 1, C.red); }, label: '健診' },
    { re: /出張/, bg: 'station', out: 'suit', pose: 'walk', x: 0.1, fx: 'suitcase', label: '出張' },
    { re: /老眼|新聞の字|老眼鏡/, bg: 'living', out: null, pose: 'sit', x: 0.4, anim: (h, m) => { h.r(m.x + 3 * h.P, m.top + 3 * h.P, m.w - 6 * h.P, 1, C.dark); h.r(m.x + m.w, m.hand - 6, 14, 10, '#f4efe4'); for (let k = 0; k < 3; k++) h.r(m.x + m.w + 2, m.hand - 4 + k * 3, 10, 1, C.gray); }, label: '新聞' },
    { re: /システムに慣れ|パソコン/, bg: 'office', out: 'suit', pose: 'sit', x: 0.55, fx: 'question', label: 'むずかしい' },
    { re: /組織変更|部署|異動|定年まであと/, bg: 'office', out: 'suit', pose: 'stand', x: 0.35, fx: 'box', label: '職場' },
    { re: /ハローワーク|求人|不採用|職業訓練|派遣/, bg: 'office', out: 'suit', pose: 'sit', x: 0.3, fx: 'cloud', label: '仕事さがし' },
    // 家族
    { re: /結婚記念日|レストラン/, bg: 'restaurant', out: null, pose: 'sit', x: 0.35, partner: 'casual', fx: 'hearts', label: 'ふたりで' },
    { re: /夫婦げんか|家事の分担|言い合い/, bg: 'living', out: null, pose: 'stand', x: 0.3, partner: 'casual', fx: 'cloud', label: 'けんか' },
    { re: /ホームセンター|スーパーの特売|特売/, bg: 'shop', out: null, pose: 'walk', x: 0.1, partner: 'casual', anim: (h, m) => { h.r(m.x + m.w + 2, m.hand, 12, 8, C.gray); h.r(m.x + m.w + 3, h.gr - 3, 2, 3, C.dark); h.r(m.x + m.w + 11, h.gr - 3, 2, 3, C.dark); }, label: 'おかいもの' },
    { re: /配偶者の実家|帰省|実家に帰|親戚の集まり/, bg: 'kotatsu', out: null, pose: 'sit', x: 0.3, fam: true, npc: [{ age: 70, sex: 'F', x: 0.75, pose: 'sit' }], fx: 'talk', label: '実家で' },
    { re: /映画/, bg: 'cinema', out: null, pose: 'sit', x: 0.4, anim: (h, m) => h.r(m.x + m.w, m.hand - 2, 6, 7, '#e8d27a'), label: '映画' },
    { re: /看病|体調をくずし/, bg: 'bedroom', out: null, pose: 'stand', x: 0.55, anim: (h) => { h.prop('bed', h.W * 0.15, h.gr - 12, { w: '#f4efe4', k: '#b08a5a' }); h.r(h.W * 0.15 + 4, h.gr - 18, 8, 6, '#f2c9a5'); }, label: '看病' },
    { re: /散歩/, bg: 'park', out: null, pose: 'walk', x: 0.1, label: 'おさんぽ' },
    { re: /寝顔/, bg: 'bedroom', out: 'pajama', pose: 'sit', x: 0.45, fam: true, fx: 'hearts', label: 'ねがお' },
    { re: /動物園/, bg: 'park', out: null, pose: 'jump', x: 0.3, fam: true, anim: (h) => { const x = h.W * 0.75; h.r(x, h.gr - 40, 6, 30, '#e8b94a'); h.r(x - 2, h.gr - 46, 10, 8, '#e8b94a'); h.r(x - 6, h.gr - 14, 22, 12, '#e8b94a'); for (let k = 0; k < 5; k++) h.r(x + (k * 5) % 16 - 4, h.gr - 12 - (k % 2) * 20, 3, 3, '#a0702a'); }, label: '動物園' },
    { re: /似顔絵|描いた家族の絵|冷蔵庫に貼/, bg: 'kitchen', out: null, pose: 'stand', x: 0.3, fam: true, anim: (h) => { h.r(h.W * 0.45, h.gr - 50, 22, 50, '#f4f4f4'); h.r(h.W * 0.45 + 4, h.gr - 44, 14, 12, '#ffffff'); h.r(h.W * 0.45 + 7, h.gr - 41, 3, 3, C.red); h.r(h.W * 0.45 + 12, h.gr - 40, 3, 4, C.blue); }, label: 'たからもの' },
    { re: /イヤイヤ期|反抗期|口をきいてもらえ/, bg: 'living', out: null, pose: 'stand', x: 0.3, fam: true, fx: 'cloud', label: 'たいへん' },
    { re: /授業参観|PTA/, bg: 'classroom', out: null, pose: 'stand', x: 0.7, npc: [{ age: 9, sex: 'M', x: 0.25, pose: 'sit', outfit: 'school' }, { age: 9, sex: 'F', x: 0.42, pose: 'sit', outfit: 'school' }], label: '参観日' },
    { re: /場所取り/, bg: 'track', out: null, pose: 'sit', x: 0.3, fam: true, anim: (h) => h.r(h.W * 0.2, h.gr - 2, 60, 2, '#4f86c6'), label: '運動会' },
    { re: /試合を応援|応援に行き/, bg: 'soccer', out: null, pose: 'jump', x: 0.2, anim: (h, m) => h.prop('flag', m.x + m.w - 2 * h.P, m.hand - 8 * h.P), label: 'がんばれ！' },
    { re: /受験で、家じゅう|塾代/, bg: 'juku', out: null, pose: 'sit', x: 0.5, fam: true, fx: 'coins', label: '受験生の親' },
    { re: /子どもに勉強を教え/, bg: 'homein', out: null, pose: 'sit', x: 0.4, fam: true, fx: 'book', label: 'おべんきょう' },
    { re: /電話があり|電話がありました|「ちゃんと食べてるの/, bg: 'homein', out: null, pose: 'stand', x: 0.35, anim: (h, m) => { h.prop('phone', m.x + m.w - 3 * h.P, m.top + 2 * h.P); h.prop('bubble', m.x + m.w + 4, m.top - 14 + (Math.floor(h.e * 2) % 2) * 2); }, label: 'でんわ' },
    { re: /プレゼント|誕生日|花を贈/, bg: 'living', out: null, pose: 'stand', x: 0.35, fam: true, fx: 'bouquet', label: 'おめでとう' },
    { re: /引っ越しを手伝/, bg: 'truck', out: 'work', pose: 'stand', x: 0.3, fx: 'box', label: 'お手伝い' },
    { re: /結婚相手と初めて会/, bg: 'restaurant', out: 'suit', pose: 'sit', x: 0.3, npc: [{ age: 28, sex: 'M', x: 0.55, outfit: 'suit', pose: 'sit' }, { age: 27, sex: 'F', x: 0.72, pose: 'sit' }], label: 'ごあいさつ' },
    { re: /温泉旅行|温泉に行/, bg: 'onsen', out: 'yukata', pose: 'sit', x: 0.35, fam: true, label: '温泉' },
    { re: /スマホの設定|ビデオ通話/, bg: 'living', out: null, pose: 'sit', x: 0.4, anim: (h, m) => { h.prop('phone', m.x + m.w - 3 * h.P, m.hand - 4 * h.P); h.prop('bubble', m.x + m.w + 6, m.top - 14); }, label: 'スマホ' },
    { re: /通院に付き添/, bg: 'hospital', out: null, pose: 'walk', x: 0.12, npc: [{ age: 78, sex: 'F', x: 0.42 }], label: '付き添い' },
    // 季節・暮らし
    { re: /桜並木|花見|桜/, bg: 'sakura', out: null, pose: 'walk', x: 0.1, label: '春' },
    { re: /ミニトマト|家庭菜園|野菜/, bg: 'garden', out: null, pose: 'stand', x: 0.4, anim: both(tomatoes, hold('can', null, 1)), label: '収穫' },
    { re: /猛暑|エアコン/, bg: 'summer', out: null, pose: 'stand', x: 0.35, anim: sweat, label: '暑い！' },
    { re: /台風|大雨/, bg: 'typhoon', out: 'coat', pose: 'walk', x: 0.15, label: '台風' },
    { re: /紅葉/, bg: 'autumn', out: null, pose: 'walk', x: 0.1, partner: 'casual', label: '秋' },
    { re: /大掃除|なつかしい写真|昔の名刺|アルバムを見返/, bg: 'homein', out: null, pose: 'sit', x: 0.35, anim: (h, m) => { h.r(m.x + m.w, m.hand - 4, 14, 10, '#f4efe4'); h.r(m.x + m.w + 2, m.hand - 2, 4, 4, '#a9c7e6'); h.r(m.x + m.w + 8, m.hand - 2, 4, 4, '#f2c9a5'); }, label: 'なつかしい' },
    { re: /年越しそば|大みそか/, bg: 'winter', out: null, pose: 'sit', x: 0.32, fam: true, anim: bowlFx, label: '大みそか' },
    { re: /おみくじ|大吉/, bg: 'shrine', out: null, pose: 'jump', x: 0.3, anim: (h, m) => { h.r(m.x + m.w, m.hand - 6, 5, 14, '#ffffff'); h.r(m.x + m.w + 1, m.hand - 4, 3, 2, C.red); }, label: 'おみくじ' },
    { re: /画面が割れ/, bg: 'street', out: null, pose: 'sit', x: 0.4, anim: crack, label: 'がーん' },
    { re: /新しいスーパー|パン屋に1時間並/, bg: 'shop', out: null, pose: 'stand', x: 0.3, npc: [{ age: 40, sex: 'F', x: 0.15 }, { age: 60, sex: 'M', x: 0.05 }], label: '行列' },
    { re: /宝くじ/, bg: 'lottery', out: null, pose: 'stand', x: 0.3, label: '宝くじ' },
    { re: /友だちの結婚式|結婚式に出席/, bg: 'wedding', out: 'suit', pose: 'stand', x: 0.2, npc: [{ age: -1, sex: 'F', x: 0.6, outfit: 'bride' }, { age: -1, sex: 'M', x: 0.72, outfit: 'suit' }], fx: 'confetti', label: '結婚式' },
    { re: /花粉症/, bg: 'sakura', out: null, pose: 'stand', x: 0.35, anim: both(mask, (h, m) => { if (h.e % 1.5 < 0.25) { h.g.fillStyle = C.dark; h.g.font = 'bold 9px sans-serif'; h.g.fillText('くしゅん', m.x + m.w, m.top); } }), label: '花粉症' },
    { re: /一駅分歩|ラジオ体操|体操教室/, bg: 'street', out: 'sport', pose: 'walk', x: 0.08, label: 'けんこう' },
    { re: /閉店/, bg: 'shop', out: null, pose: 'stand', x: 0.3, fx: 'cloud', anim: (h) => { h.r(h.W * 0.42, h.gr - 36, 40, 14, '#ffffff'); h.g.fillStyle = C.dark; h.g.font = 'bold 8px sans-serif'; h.g.fillText('閉店', h.W * 0.42 + 12, h.gr - 26); }, label: 'さよなら' },
    { re: /ばったり会|同窓会|同級生と/, bg: 'street', out: null, pose: 'stand', x: 0.3, npc: [{ age: -1, sex: 'M', x: 0.5 }], fx: 'talk', label: 'ひさしぶり' },
    { re: /防災訓練/, bg: 'schoolgate', out: null, pose: 'stand', x: 0.3, npc: [{ age: 50, sex: 'M', x: 0.55, outfit: 'work' }], anim: (h) => { h.r(h.W * 0.8, h.gr - 16, 6, 16, C.red); h.r(h.W * 0.8 + 1, h.gr - 20, 4, 4, C.dark); }, label: '防災訓練' },
    { re: /投票/, bg: 'election', out: null, pose: 'stand', x: 0.3, label: '選挙' },
    { re: /ふるさと納税|返礼品|お米が届/, bg: 'homein', out: null, pose: 'jump', x: 0.35, anim: onTable('box', 0.55), label: '届いた！' },
    { re: /電気代|請求額|家賃|ローンの残り|給湯器|急な出費|老後のお金/, bg: 'homein', out: null, pose: 'stand', x: 0.35, anim: bills, label: 'お金のこと' },
    { re: /ドラマの最終回|話題のアニメ|一気見/, bg: 'living', out: null, pose: 'sit', x: 0.25, fx: 'tv', label: 'テレビ' },
    { re: /おすそ分け|近所の人/, bg: 'newhouse', out: null, pose: 'bow', x: 0.3, npc: [{ age: 65, sex: 'F', x: 0.55 }], anim: hold('box', null, 1), label: 'ご近所' },
    { re: /稲刈り|田んぼ|草刈り/, bg: 'farm', out: 'farm', pose: 'bow', x: 0.4, label: '田んぼ' },
    { re: /クマの目撃/, bg: 'mountain', out: null, pose: 'stand', x: 0.25, anim: (h) => { const x = h.W * 0.78; h.r(x, h.gr - 18, 20, 14, '#3a2a1a'); h.r(x + 14, h.gr - 24, 10, 10, '#3a2a1a'); h.r(x + 4, h.gr - 4, 4, 4, '#3a2a1a'); h.r(x + 14, h.gr - 4, 4, 4, '#3a2a1a'); }, fx: 'question', label: 'クマ！？' },
    { re: /バス路線|バスが廃止/, bg: 'bus', out: null, pose: 'stand', x: 0.3, fx: 'cloud', label: 'バス停' },
    { re: /再開発|タワーマンション/, bg: 'street', out: null, pose: 'stand', x: 0.3, anim: (h) => { h.r(h.W * 0.62, 0, 40, h.gr, '#9aa3b5'); for (let y = 4; y < h.gr - 4; y += 6) for (let x = 4; x < 36; x += 8) h.r(h.W * 0.62 + x, y, 4, 3, C.glass); }, label: '街が変わる' },
    { re: /電車の遅延|遅延/, bg: 'station', out: 'suit', pose: 'stand', x: 0.35, anim: sweat, fx: 'question', label: '遅延' },
    { re: /隣の部屋の人/, bg: 'street', out: null, pose: 'walk', x: 0.1, label: 'となり' },
    // 40代〜
    { re: /腰を痛め|膝が痛|整体|足がつって/, bg: 'homein', out: null, pose: 'bow', x: 0.35, anim: (h, m) => { h.g.fillStyle = C.red; h.g.font = 'bold 9px sans-serif'; h.g.fillText('いたた', m.x + m.w, m.top + 4); }, label: 'いたた' },
    { re: /白髪/, bg: 'bath', out: null, pose: 'stand', x: 0.6, fx: 'question', label: '鏡の前' },
    { re: /ジム/, bg: 'gym', out: 'sport', pose: 'run', x: 0.1, anim: sweat, label: 'ジム' },
    { re: /お墓参り/, bg: 'grave', out: null, pose: 'bow', x: 0.3, fam: true, label: 'お墓参り' },
    { re: /物忘れ/, bg: 'living', out: null, pose: 'stand', x: 0.4, fx: 'question', label: 'あれ？' },
    { re: /かかりつけ医|血圧の薬|予防接種を受け|白内障|補聴器|待合室/, bg: 'hospital', out: null, pose: 'sit', x: 0.32, npc: [{ age: 55, sex: 'M', x: 0.7, outfit: 'coat' }], label: '病院で' },
    { re: /朝の散歩|あいさつ/, bg: 'park', out: null, pose: 'walk', x: 0.1, npc: [{ age: 75, sex: 'M', x: 0.7 }], label: 'おはよう' },
    { re: /柿/, bg: 'garden', out: null, pose: 'stand', x: 0.4, label: '秋の庭' },
    { re: /訃報/, bg: 'funeral', out: 'black', pose: 'bow', x: 0.3, label: 'お別れ' },
    { re: /昔住んでいた町|訪ねました/, bg: 'street', out: null, pose: 'walk', x: 0.1, label: 'なつかしい町' },
    { re: /朝早く目が覚め/, bg: 'bedroom', out: 'pajama', pose: 'sit', x: 0.4, anim: (h) => h.r(h.W * 0.7 + 4, 10, 18, 16, '#f6c88a'), label: '早起き' },
    { re: /塩分/, bg: 'kitchen', out: 'apron', pose: 'stand', x: 0.45, anim: hold('pot', null, 1), label: 'うす味' },
    { re: /免許を返納|運転を続け/, bg: 'police', out: null, pose: 'stand', x: 0.3, label: '免許返納' },
    { re: /年金の振込|年金/, bg: 'restaurant', out: null, pose: 'sit', x: 0.35, fx: 'coins', label: 'ちょっとぜいたく' },
    { re: /お茶を飲み|庭の花|コーヒー/, bg: 'garden', out: null, pose: 'sit', x: 0.4, fx: 'tea', label: 'ひと休み' },
    { re: /湯船/, bg: 'bath', out: 'swim', pose: 'sit', x: 0.3, label: 'お風呂' },
    { re: /さびしく|日曜日の夕方/, bg: 'night', out: null, pose: 'sit', x: 0.45, label: 'ひとり' },
    { re: /パジャマで過ごし/, bg: 'living', out: 'pajama', pose: 'sit', x: 0.35, fx: 'tv', label: 'ゴロゴロ' },
    { re: /実家じまい|空き家/, bg: 'newhouse', out: null, pose: 'bow', x: 0.3, fx: 'box', label: '実家じまい' },
    // 趣味
    { re: /【料理|料理|お菓子|ケーキ|ぬか漬け/, bg: 'kitchen', out: 'apron', pose: 'stand', x: 0.45, anim: hold('pot', null, 1), label: '料理' },
    { re: /【読書】|本屋大賞|図書館|冊の本/, bg: 'library', out: null, pose: 'sit', x: 0.25, fx: 'book', label: '読書' },
    { re: /【手芸|ハンドメイド|編み/, bg: 'living', out: null, pose: 'sit', x: 0.4, anim: hold('knit'), label: '手芸' },
    { re: /【ゲーム】|ゲームをクリア|新作のゲーム|友だちの家でゲーム/, bg: 'living', out: null, pose: 'sit', x: 0.35, anim: hold('game', null, 2), fx: 'tv', label: 'ゲーム' },
    { re: /【アニメ|聖地巡礼|マンガ/, bg: 'living', out: null, pose: 'sit', x: 0.3, fx: 'book', label: 'マンガ・アニメ' },
    { re: /【筋トレ|ベンチプレス|トレーニング/, bg: 'gym', out: 'sport', pose: 'stand', x: 0.3, anim: (h, m) => h.prop('dumbbell', m.x + m.w - 2 * h.P, m.hand - (Math.floor(h.e * 1.5) % 2 ? 9 : 2) * h.P), label: '筋トレ' },
    { re: /【将棋|将棋|麻雀|囲碁/, bg: 'kotatsu', out: null, pose: 'sit', x: 0.4, anim: onTable('board', 0.56), npc: [{ age: -1, sex: 'M', x: 0.72, pose: 'sit' }], label: '一局' },
    { re: /【写真】|一眼レフ|カメラ/, bg: 'park', out: null, pose: 'stand', x: 0.35, anim: (h, m) => { h.prop('camera', m.x + m.w - 2 * h.P, m.hand - 4 * h.P); if (h.e % 1.6 < 0.15) { h.g.globalAlpha = 0.6; h.r(0, 0, h.W, h.gr, '#ffffff'); h.g.globalAlpha = 1; } }, label: '写真' },
    { re: /【ジョギング|マラソン|毎朝5km/, bg: 'street', out: 'sport', pose: 'run', x: 0.04, anim: sweat, label: 'ランニング' },
    // 世の中
    { re: /景気後退|業績が悪化|ボーナスが減/, bg: 'office', out: 'suit', pose: 'sit', x: 0.35, fx: 'cloud', anim: (h) => { h.g.strokeStyle = C.red; h.g.lineWidth = 2; h.g.beginPath(); h.g.moveTo(h.W * 0.15, 12); h.g.lineTo(h.W * 0.22, 18); h.g.lineTo(h.W * 0.28, 14); h.g.lineTo(h.W * 0.36, 30); h.g.stroke(); }, label: '不景気' },
    { re: /パンデミック|感染症/, bg: 'mask', out: null, pose: 'walk', x: 0.1, npc: [{ age: 40, sex: 'F', x: 0.6 }], anim: mask, label: 'マスク生活' },
    { re: /日本の人口|人口は約|人口が/, bg: 'station', out: null, pose: 'stand', x: 0.35, npc: [{ age: 80, sex: 'F', x: 0.15 }, { age: 75, sex: 'M', x: 0.6 }, { age: 8, sex: 'M', x: 0.75 }], label: 'これからの日本' },
    { re: /友人がいない|ひとりの夜/, bg: 'night', out: null, pose: 'sit', x: 0.45, label: 'ひとり' },
    { re: /生活保護|切り詰め|貯金が底|貯金が少な/, bg: 'homein', out: null, pose: 'sit', x: 0.4, anim: bills, fx: 'cloud', label: 'やりくり' },
    { re: /寝かしつけ/, bg: 'bedroom', out: 'pajama', pose: 'lie', x: 0.3, label: 'ねんね' },
    { re: /歯医者/, bg: 'hospital', out: null, pose: 'sit', x: 0.32, fam: true, npc: [{ age: 40, sex: 'M', x: 0.65, outfit: 'coat' }], label: '歯医者' },
    { re: /同じ年に日本で生まれた/, bg: 'night', out: null, pose: 'stand', x: 0.4, anim: (h) => { for (let k = 0; k < 30; k++) h.r((k * 37) % h.W, (k * 13) % (h.gr - 10), 1, 1, '#ffffff'); }, label: '同い年のみんな' },
    { re: /背がぐんと|体つきが変わ/, bg: 'homein', out: null, pose: 'stand', x: 0.4, anim: (h, m) => { h.r(m.x - 8, m.top, 3, h.gr - m.top, C.wood); for (let y = m.top; y < h.gr; y += 6) h.r(m.x - 8, y, 5, 1, C.dark); }, label: '成長' },
    { re: /お迎え|子どもの熱|子どもの発熱/, bg: 'street', out: 'suit', pose: 'run', x: 0.05, anim: sweat, label: 'いそげ！' },
    { re: /再雇用/, bg: 'office', out: 'suit', pose: 'stand', x: 0.35, label: '再雇用' },
    { re: /戦隊ヒーロー|プリキュア|変身ポーズ|歌・ダンス|ごっこ遊び|おままごと/, bg: 'living', out: null, pose: 'jump', x: 0.35, fx: 'confetti', label: 'へんしん！' },
    { re: /ウォーキング|1万歩/, bg: 'park', out: 'sport', pose: 'walk', x: 0.08, label: 'ウォーキング' },
    { re: /夜の街の明かり|空を見上げ/, bg: 'night', out: null, pose: 'stand', x: 0.4, label: '夜' },
    { re: /銀婚式|金婚式/, bg: 'restaurant', out: null, pose: 'sit', x: 0.3, partner: 'casual', fam: true, fx: 'cake', label: 'お祝い' },
    { re: /声を出して笑|しゃべった言葉|靴をはけ/, bg: 'nursery', out: null, pose: 'sit', x: 0.35, fam: true, fx: 'hearts', label: 'できた！' },
    { re: /お年玉|ぽち袋/, bg: 'kotatsu', out: null, pose: 'jump', x: 0.3, npc: [{ age: 72, sex: 'F', x: 0.7, pose: 'sit' }], anim: (h, m) => { h.r(m.x + m.w, m.hand - 4, 6, 8, C.red); h.r(m.x + m.w + 1, m.hand - 2, 4, 1, C.yellow); }, label: 'お正月' },
    { re: /食卓を囲|夕ごはん|家族そろって/, bg: 'kitchen', out: null, pose: 'sit', x: 0.3, fam: true, fx: 'cake', label: 'いただきます' },
    { re: /寄り道|帰り道/, bg: 'street', out: 'school', pose: 'walk', x: 0.08, npc: [{ age: -1, sex: 'F', x: 0.6, outfit: 'school' }], label: '帰り道' },
    { re: /交換日記|図書室|読み聞かせ/, bg: 'library', out: null, pose: 'sit', x: 0.25, fx: 'book', label: '本' },
    { re: /進路希望調査/, bg: 'classroom', out: 'school', pose: 'sit', x: 0.4, fx: 'question', label: '進路' },
    { re: /ファミレス/, bg: 'restaurant', out: null, pose: 'sit', x: 0.3, npc: [{ age: -1, sex: 'F', x: 0.5, pose: 'sit' }], fx: 'talk', label: 'おしゃべり' },
    { re: /遺品|形見|レシピのノート/, bg: 'homein', out: null, pose: 'sit', x: 0.35, fx: 'box', label: '遺品の整理' },
    { re: /スカート丈|先生に注意/, bg: 'schoolgate', out: 'school', pose: 'bow', x: 0.3, npc: [{ age: 50, sex: 'M', x: 0.55, outfit: 'suit' }], label: '注意された' },
    { re: /グループLINE|言い争い/, bg: 'bedroom', out: null, pose: 'sit', x: 0.4, anim: (h, m) => h.prop('phone', m.x + m.w - 3 * h.P, m.hand - 4 * h.P), fx: 'cloud', label: 'LINE' },
    { re: /NISA|投資|銀行に預け/, bg: 'homein', out: null, pose: 'sit', x: 0.35, anim: (h, m) => { h.r(m.x + m.w + 2, m.hand - 6, 14, 9, C.dark); h.r(m.x + m.w + 3, m.hand - 5, 12, 6, '#ffffff'); h.g.strokeStyle = C.green; h.g.beginPath(); h.g.moveTo(m.x + m.w + 4, m.hand - 1); h.g.lineTo(m.x + m.w + 9, m.hand - 3); h.g.lineTo(m.x + m.w + 14, m.hand - 5); h.g.stroke(); }, label: '資産づくり' },
    { re: /単位|必修/, bg: 'classroom', out: null, pose: 'sit', x: 0.4, anim: sweat, fx: 'book', label: '大学' },
    { re: /交通事故/, bg: 'street', out: null, pose: 'lie', x: 0.3, anim: carFx('#9aa3b5'), label: '事故' },
    { re: /砂場|知らない子|しがみつい|転んでも/, bg: 'playground', out: null, pose: 'stand', x: 0.3, npc: [{ age: -1, sex: 'F', x: 0.5 }], label: '公園で' },
    { re: /18きっぷ|旅をしました/, bg: 'station', out: null, pose: 'walk', x: 0.1, npc: [{ age: -1, sex: 'M', x: 0.4 }], fx: 'suitcase', label: '旅' },
    { re: /心の調子が.*戻|学校に戻れる/, bg: 'sakura', out: null, pose: 'walk', x: 0.1, label: '少しずつ' },
    { re: /いじめ|不登校|抱え込/, bg: 'bedroom', out: null, pose: 'sit', x: 0.45, fx: 'cloud', label: 'つらい' },
    { re: /保育器|低出生体重/, bg: 'hospital', out: null, pose: 'lie', x: 0.3, label: 'NICU' },
    { re: /推し|グッズ/, bg: 'stage', out: null, pose: 'jump', x: 0.3, anim: (h, m) => h.r(m.x + m.w, m.hand - 10, 2, 12, ['#f4b6c2', '#7fb3e0'][Math.floor(h.e * 2) % 2]), label: '推し活' },
    { re: /フォロワー|SNS|動画|夜更かし/, bg: 'bedroom', out: null, pose: 'sit', x: 0.4, anim: (h, m) => { h.prop('phone', m.x + m.w - 3 * h.P, m.hand - 4 * h.P); h.prop('heart', m.x + m.w + 4, m.top - 6 - (h.e * 10) % 14); }, label: 'スマホ' },
    { re: /リボ払い|カード|課金|ガチャ/, bg: 'bedroom', out: null, pose: 'sit', x: 0.4, anim: (h, m) => h.prop('phone', m.x + m.w - 3 * h.P, m.hand - 4 * h.P), fx: 'coins', label: 'お金' },
    { re: /【釣り】|釣り/, bg: 'sea', out: null, pose: 'stand', x: 0.3, anim: (h, m) => h.prop('rod', m.x + m.w - h.P, m.hand - 7 * h.P), label: '釣り' },
    { re: /ボランティア|子ども食堂|清掃活動/, bg: 'park', out: 'work', pose: 'bow', x: 0.3, npc: [{ age: 60, sex: 'F', x: 0.6, outfit: 'work' }], label: 'ボランティア' },
    { re: /ゴルフ/, bg: 'farm', out: null, pose: 'stand', x: 0.3, anim: (h, m) => h.prop('golf', m.x + m.w - h.P, m.hand - 2 * h.P), label: 'ゴルフ' },
    { re: /老人クラブ|ゼミ|学童/, bg: 'classroom', out: null, pose: 'sit', x: 0.3, npc: [{ age: -1, sex: 'F', x: 0.5, pose: 'sit' }, { age: -1, sex: 'M', x: 0.68, pose: 'sit' }], fx: 'talk', label: 'みんなで' },
    { re: /タバコ/, bg: 'street', out: null, pose: 'stand', x: 0.35, anim: (h, m) => h.prop('cig', m.x + m.w - 2 * h.P, m.top + 5 * h.P), label: 'タバコ' },
    { re: /肉じゃが|おはぎ/, bg: 'kitchen', out: 'apron', pose: 'stand', x: 0.45, anim: hold('pot', null, 1), label: '料理' },
    { re: /育休|育児休業|子どもを望|子どもは持たない|ふたりで過ごす/, bg: 'living', out: null, pose: 'sit', x: 0.35, partner: 'casual', fam: true, label: '家族のこと' },
    { re: /遺言|エンディングノート/, bg: 'homein', out: null, pose: 'sit', x: 0.4, anim: hold('note'), label: '終活' },
    { re: /高齢者向け住宅|住み慣れた家|賃貸|今の街で暮らし/, bg: 'newhouse', out: null, pose: 'stand', x: 0.3, label: '住まい' },
    { re: /親友|友達ができ/, bg: 'schoolgate', out: null, pose: 'jump', x: 0.3, npc: [{ age: -1, sex: 'M', x: 0.5 }], fx: 'hearts', label: '親友' },
    { re: /授業がおもしろい|教科が好き/, bg: 'classroom', out: 'school', pose: 'stand', x: 0.4, fx: 'book', label: '好きな教科' }
,
    { re: /法事/, bg: 'grave', out: 'black', pose: 'bow', x: 0.3, fam: true, label: '法事' },
    { re: /紅白歌合戦|M-1|ドラマにはまり|オリンピックの中継|ワールドカップ|甲子園の決勝/, bg: 'living', out: null, pose: 'sit', x: 0.25, fam: true, fx: 'tv', label: 'テレビ' },
    { re: /球場で観戦/, bg: 'baseball', out: null, pose: 'jump', x: 0.3, fx: 'confetti', label: '観戦' },
    { re: /救急車|救急外来|小児救急|熱性けいれん|尿路結石/, bg: 'hospital', out: 'pajama', pose: 'lie', x: 0.3, anim: (h) => { const x = h.W * 0.7; h.r(x, h.gr - 22, 50, 18, '#ffffff'); h.r(x, h.gr - 16, 50, 3, C.red); h.r(x + 34, h.gr - 28, 8, 6, Math.floor(h.T * 4) % 2 ? C.red : C.orange); h.r(x + 6, h.gr - 5, 8, 5, C.dark); h.r(x + 36, h.gr - 5, 8, 5, C.dark); }, label: '救急' },
    { re: /キャッシュレス|ポイ活|格安スマホ|サブスク/, bg: 'shop', out: null, pose: 'stand', x: 0.35, anim: (h, m) => h.prop('phone', m.x + m.w - 3 * h.P, m.hand - 4 * h.P), fx: 'coins', label: 'スマホで' },
    { re: /確定申告|固定資産税|年末調整/, bg: 'homein', out: null, pose: 'sit', x: 0.4, anim: bills, label: '書類' },
    { re: /ガソリン|車検|車をこすって/, bg: 'street', out: null, pose: 'stand', x: 0.25, anim: carFx('#e8e8e8'), fx: 'cloud', label: 'くるま' },
    { re: /献血|クリーニング|親知らず|内視鏡|胃カメラ|コンタクト|ICL|レーシック/, bg: 'hospital', out: null, pose: 'sit', x: 0.32, npc: [{ age: 45, sex: 'F', x: 0.68, outfit: 'coat' }], label: '病院で' },
    { re: /管理組合|町内会|班長|国勢調査|ごみの分別|裁判員/, bg: 'newhouse', out: null, pose: 'stand', x: 0.3, npc: [{ age: 70, sex: 'M', x: 0.6 }], anim: (h, m) => { h.r(m.x + m.w, m.hand - 4, 10, 12, '#ffffff'); h.r(m.x + m.w + 2, m.hand - 2, 6, 1, C.gray); }, label: 'ご近所' },
    { re: /寝違え|ぎっくり腰|転び|杖/, bg: 'homein', out: null, pose: 'bow', x: 0.35, anim: (h, m) => { h.g.fillStyle = C.red; h.g.font = 'bold 9px sans-serif'; h.g.fillText('いたた', m.x + m.w, m.top + 4); }, label: 'いたた' },
    { re: /子どもから仕事の悩み|子どもが恋人|子どもの就職/, bg: 'living', out: null, pose: 'sit', x: 0.3, npc: [{ age: 25, sex: 'M', x: 0.55, pose: 'sit' }], fx: 'talk', label: '子どもと' },
    { re: /ラーメン|焼肉|食べ歩き/, bg: 'restaurant', out: null, pose: 'sit', x: 0.35, anim: bowlFx, label: 'いただきます' },
    { re: /ディズニー|遊園地/, bg: 'festival', out: null, pose: 'jump', x: 0.3, fam: true, fx: 'confetti', label: 'たのしい！' },
    { re: /御朱印/, bg: 'shrine', out: null, pose: 'bow', x: 0.3, anim: hold('book'), label: '御朱印' },
    { re: /パズル/, bg: 'living', out: null, pose: 'sit', x: 0.35, anim: onTable('board', 0.56), label: 'パズル' },
    { re: /スマホ教室|シルバー人材/, bg: 'classroom', out: null, pose: 'sit', x: 0.35, npc: [{ age: 72, sex: 'F', x: 0.55, pose: 'sit' }], anim: (h, m) => h.prop('phone', m.x + m.w - 3 * h.P, m.hand - 4 * h.P), label: '教室' },
    { re: /薬が.*増え|耳が遠く/, bg: 'living', out: null, pose: 'sit', x: 0.4, fx: 'tv', label: 'ふだんの暮らし' },
    { re: /冷蔵庫|家電量販店|エアコンが壊れ/, bg: 'shop', out: null, pose: 'stand', x: 0.3, anim: (h) => { h.r(h.W * 0.62, h.gr - 40, 22, 40, '#e8e8e8'); h.r(h.W * 0.62, h.gr - 26, 22, 1, C.gray); }, label: 'おかいもの' },
    { re: /懸賞|福引|1万円が当たり/, bg: 'lottery', out: null, pose: 'jump', x: 0.3, fx: 'confetti', label: '当たり！' },
    { re: /給料が少し上が|社長賞|指導係|上司が代わ|オフィスが移転|出向|パワハラ|胃が痛く|サービス残業/, bg: 'office', out: 'suit', pose: 'stand', x: 0.3, npc: [{ age: 50, sex: 'M', x: 0.58, outfit: 'suit' }], label: '職場で' },
    { re: /財布を落とし|スマホをなくし|傘を忘れ/, bg: 'police', out: null, pose: 'bow', x: 0.3, label: '交番' },
    { re: /雨漏り|修理/, bg: 'typhoon', out: 'work', pose: 'stand', x: 0.3, label: '修理' },
    { re: /手足口病|RSウイルス|中耳炎|水ぼうそう|アデノ|ノロ/, bg: 'bedroom', out: 'pajama', pose: 'lie', x: 0.3, fam: true, label: 'おやすみ' },
    { re: /火事|消防車/, bg: 'street', out: null, pose: 'stand', x: 0.2, anim: (h) => { for (let k = 0; k < 6; k++) h.r(h.W * 0.6 + k * 6 + Math.sin(h.T * 8 + k) * 2, h.gr - 50 - ((h.T * 20 + k * 7) % 20), 5, 6, k % 2 ? C.orange : C.red); }, label: '火事' },
    { re: /駐車違反|スピード違反/, bg: 'police', out: null, pose: 'bow', x: 0.3, npc: [{ age: 40, sex: 'M', x: 0.6, outfit: 'suit' }], label: '違反' },
    { re: /いちご狩り|虫とり|海水浴/, bg: 'farm', out: null, pose: 'jump', x: 0.3, fam: true, label: 'おでかけ' },
    { re: /送り迎え|ラン活|保活|ランドセルを/, bg: 'street', out: null, pose: 'walk', x: 0.1, fam: true, label: '子育て' },
    { re: /初めて歩きました|子どもが初めて/, bg: 'nursery', out: null, pose: 'stand', x: 0.35, fam: true, fx: 'hearts', label: 'できた！' },
    { re: /自分史|庭の木/, bg: 'garden', out: null, pose: 'sit', x: 0.4, anim: hold('note'), label: 'ふりかえり' },
    { re: /熱中症/, bg: 'summer', out: null, pose: 'sit', x: 0.35, anim: sweat, label: '暑い！' },
    { re: /ニキビ/, bg: 'bath', out: null, pose: 'stand', x: 0.6, fx: 'cloud', label: '鏡の前' },
    { re: /帯状疱疹|ポリープ/, bg: 'hospital', out: null, pose: 'sit', x: 0.32, label: '病院で' },
    { re: /フェス|合宿|シェアハウス|マッチングアプリ/, bg: 'festival', out: null, pose: 'jump', x: 0.3, npc: [{ age: -1, sex: 'F', x: 0.55 }], label: '若いころ' },
    { re: /お遊戯会|ひつじの役/, bg: 'stage', out: 'kimonoKid', pose: 'stand', x: 0.3, fam: false, label: '発表会' }

  ];;;
  SCENES.push(...EXTRA);
  window.PXS = { BG, OUT, SCENES, daily, workplace, byCat, club, match: (t, l) => { const s = SCENES.find((x) => x.re.test(t)); return !s ? null : s.club ? club(t, l) : s; } };
})();
