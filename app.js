/* 1億2千万分の1 — 画面 */
(function () {
  const E = window.LifeEngine, D = window.JPDATA;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };

  // ---------- 画面切り替え ----------
  function go(id) {
    if (id === 'home' && typeof resetHome === 'function') resetHome();
    if (id !== 'life') try { const hb = document.getElementById('heldBar'); if (hb) hb.hidden = true; const md = document.getElementById('modal'); if (md) md.hidden = true; S.held = false; S.busy = false; } catch (e) {}
    $$('.view').forEach((v) => v.classList.toggle('active', v.id === id));
    window.scrollTo(0, 0);
    if (id === 'data') renderData();
    if (id === 'past') renderPast();
  }
  // 確認ダイアログ（ブラウザ標準の confirm の代わり）
  function ask(o) {
    return new Promise((res) => {
      const d = $('#dlg');
      $('#dlgTitle').textContent = o.title || ''; $('#dlgText').textContent = o.text || '';
      const ok = $('#dlgOk'), ng = $('#dlgNg');
      ok.textContent = o.ok || 'はい'; ng.textContent = o.ng || 'やめておく';
      ok.classList.toggle('danger', !!o.danger);
      const end = (v) => { d.hidden = true; ok.onclick = ng.onclick = d.onclick = null; document.removeEventListener('keydown', key); SND.sfx('click'); res(v); };
      const key = (e) => { if (e.key === 'Escape') end(false); };
      ok.onclick = () => end(true); ng.onclick = () => end(false);
      d.onclick = (e) => { if (e.target === d) end(false); };
      document.addEventListener('keydown', key);
      d.hidden = false; SND.sfx('open'); ng.focus();
    });
  }
  $$('[data-go]').forEach((a) => a.addEventListener('click', async (e) => {
    e.preventDefault();
    const t = a.dataset.go;
    if (t === 'home' && S.life && S.life.alive && $('#life').classList.contains('active')) {
      const pausedBefore = S.paused; S.paused = true;
      const yes = await ask({ title: 'トップに戻りますか？', text: `${S.life.name.sei} ${S.life.name.mei}さん（${S.life.age}歳）の人生はここで一時停止します。トップの「続きから」で再開できます。`, ok: 'トップに戻る', ng: '人生を続ける' });
      if (!yes) { S.paused = pausedBefore; return; }
    }
    if (t === 'home') { stop(); showResume(); }
    go(t);
  }));

  // テーマ
  const themeBtn = $('#themeBtn');
  const savedTheme = store.get('theme', '');
  if (savedTheme) document.documentElement.dataset.theme = savedTheme;
  themeBtn.addEventListener('click', () => {
    const cur = document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const nx = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = nx; store.set('theme', nx);
  });

  // ---------- 音 ----------
  const SND = window.Sound || { sfx() {}, bgm() {}, init() {}, setEnabled() {}, stopBgm() {}, setMood() {}, enabled: false };
  const sBtn = $('#soundBtn');
  const markSound = () => { sBtn.textContent = SND.enabled ? '♪' : '♪̸'; sBtn.style.opacity = SND.enabled ? 1 : 0.45; sBtn.title = SND.enabled ? '音を消す' : '音を出す'; };
  markSound();
  sBtn.addEventListener('click', () => { SND.setEnabled(!SND.enabled); markSound(); });
  document.addEventListener('click', function first() { document.removeEventListener('click', first); if (SND.enabled) { SND.init(); SND.bgm('home'); } }, { once: true });

  // ---------- ライブカウンター ----------
  const t0 = Date.now();
  const bps = D.BIRTHS_PER_YEAR / (365.25 * 86400), dps = D.DEATHS_PER_YEAR / (365.25 * 86400);
  // 出生数の見出し
  const POP = (D.NATIONAL && D.NATIONAL.population_census_2025) || 122972528;
  const TITLE = '1億2千万分の1';
  const perSec = D.BIRTHS_PER_YEAR / (365.25 * 86400), dPerSec = D.DEATHS_PER_YEAR / (365.25 * 86400);
  $('.lead').innerHTML = `<span class="nb">あなたは、日本に暮らす</span><span class="nb">約${(POP / 1e8).toFixed(2)}億人のうちの、ひとり。</span>`;
  document.title = `${TITLE} — 日本に生まれる人生シミュレーション`;


  const real = $('#optReal');
  E.PREFS.forEach((p) => real.insertAdjacentHTML('beforeend', `<option>${p.n}</option>`));
  real.value = store.get('realPref', '');
  real.addEventListener('change', () => store.set('realPref', real.value));

  // ---------- 日本地図 ----------
  const M = window.JPMAP;
  const maxB = Math.max(...E.PREFS.map((p) => p.b / Math.max(p.p, 1)));
  const fillOf = (p) => `color-mix(in srgb, var(--accent) ${Math.round(8 + 40 * Math.sqrt(p.b / Math.max(...E.PREFS.map((x) => x.b))))}%, var(--tile))`;
  function mapSVG(cls, marks) {
    const ins = Object.values(M.inset || {}).map((i) => `<rect class="inset" x="${i.box[0]}" y="${i.box[1]}" width="${i.box[2] - i.box[0]}" height="${i.box[3] - i.box[1]}" rx="6"/>`).join('');
    const paths = E.PREFS.map((p, i) => `<path data-i="${i}" d="${M.prefs[p.n] || ''}" style="fill:${cls === 'mini' ? 'var(--tile)' : fillOf(p)}"><title>${p.n}：年間出生数 約${p.b.toLocaleString()}人</title></path>`).join('');
    return `<svg viewBox="${M.viewBox}" role="img" aria-label="日本地図">${ins}${paths}<g class="marks">${marks || ''}</g></svg>`;
  }
  function cityXY(pref, city, seedN) {
    const c = M.cities[pref + '/' + city];
    if (c) return c;
    // 座標がない場所は、その都道府県の範囲内のランダムな地点
    const b = M.bbox[pref]; const r = E.R(seedN || 1);
    const path = document.querySelector(`#jmap path[data-i="${E.PREFS.findIndex((p) => p.n === pref)}"]`);
    for (let k = 0; k < 60; k++) {
      const x = b.x0 + r() * (b.x1 - b.x0), y = b.y0 + r() * (b.y1 - b.y0);
      try { if (!path || path.isPointInFill(new DOMPoint(x, y))) return [x, y]; } catch (e) { return [x, y]; }
    }
    return [(b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2];
  }
  function pinSVG(xy, label, big, mini, k = 1) {
    const [x, y] = xy, r = (mini ? 20 : big ? 9 : 7) * k;
    const right = k === 1 ? x > 760 : false;
    const lx = right ? x - 14 * k : x + 14 * k, anchor = right ? 'end' : 'start';
    return `<circle class="pin-ring" cx="${x}" cy="${y}" r="${r * 1.6}" style="stroke-width:${3 * k}"/><circle class="pin" cx="${x}" cy="${y}" r="${r}" style="stroke-width:${2.5 * k}"/>${label ? `<text class="lbl" x="${lx}" y="${y + 7 * k}" text-anchor="${anchor}" style="font-size:${22 * k}px;stroke-width:${5 * k}px">${esc(label)}</text>` : ''}`;
  }

  // ---------- コウノトリ ----------
  const STORK = `<g class="stork-body">
    <path d="M-34 6 C-20 -2 6 -4 22 0 L40 -2 L22 6 C6 12 -18 14 -34 6Z" fill="#fbf8f2" stroke="#2b2620" stroke-width="2.6"/>
    <path d="M22 0 C28 -10 30 -18 26 -24" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round"/>
    <path d="M22 0 C28 -10 30 -18 26 -24" fill="none" stroke="#2b2620" stroke-width="9" stroke-linecap="round" opacity=".25"/>
    <circle cx="26" cy="-26" r="7" fill="#fff" stroke="#2b2620" stroke-width="2"/>
    <circle cx="28" cy="-27" r="1.4" fill="#2b2620"/>
    <path d="M32 -26 L58 -18 L32 -22Z" fill="#e8873a" stroke="#2b2620" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M-30 8 L-56 22 M-26 9 L-50 26" stroke="#c0392b" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M-36 4 L-46 0 L-44 8Z" fill="#2b2620"/>
  </g>
  <g class="stork-wing"><path d="M-6 0 C-10 -30 -30 -46 -52 -50 C-40 -36 -30 -20 -24 2Z" fill="#fbf8f2" stroke="#2b2620" stroke-width="2.6"/><path d="M-52 -50 C-46 -42 -40 -34 -36 -26 L-44 -30Z" fill="#2b2620"/></g>`;
  const BUNDLE = `<g class="bundle"><path d="M-14 0 C-16 -16 16 -16 14 0 C14 14 -14 14 -14 0Z" fill="#f6d3d0" stroke="#2b2620" stroke-width="2"/><circle cx="0" cy="-2" r="7" fill="#f2c9a5" stroke="#2b2620" stroke-width="1.5"/><path d="M-3 -3 h1 M2 -3 h1" stroke="#2b2620" stroke-width="1.5" stroke-linecap="round"/><path d="M-2 1 Q0 3 2 1" fill="none" stroke="#2b2620" stroke-width="1.2"/><path d="M-10 -10 L0 -24 L10 -10" fill="none" stroke="#2b2620" stroke-width="1.5"/></g>`;
  const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  function anim(ms, fn, done) { const t0 = performance.now(); (function f(now) { const t = Math.min(1, (now - t0) / ms); fn(t); if (t < 1) requestAnimationFrame(f); else done && done(); })(t0); }
  function storkDrop(xy, done) {
    const svg = $('svg', map); const NS = 'http://www.w3.org/2000/svg';
    const [tx, ty] = xy, hy = Math.max(110, ty - 210);
    const g = document.createElementNS(NS, 'g'); g.innerHTML = STORK + `<g class="carry" transform="translate(56,-8)">${BUNDLE}</g>`; svg.appendChild(g);
    const wing = $('.stork-wing', g), carry = $('.carry', g);
    let flap = 0; const fl = setInterval(() => { flap ^= 1; wing.setAttribute('transform', flap ? 'scale(1,-0.6) translate(0,6)' : ''); if (flap) SND.sfx('flap'); }, 140);
    SND.sfx('whoosh');
    const sx = 1150, sy = -120, s = 3.4;
    // 鳥は右上から飛んできて、くちばしの包みが目的地の真上に来るところで止まる
    const ax = tx - 56 * s * -1, ay = hy;
    anim(1800, (t) => { const e = ease(t); const x = sx + (tx + 56 * s - sx) * e, y = sy + (hy - sy) * e - Math.sin(e * Math.PI) * 60; g.setAttribute('transform', `translate(${x},${y}) scale(${-s},${s})`); }, () => {
      // 包みを放す
      carry.remove();
      const b = document.createElementNS(NS, 'g'); b.innerHTML = BUNDLE; svg.appendChild(b);
      const bx = tx, by0 = hy - 8 * s;
      anim(900, (t) => { const y = by0 + (ty - by0) * t * t; const sw = Math.sin(t * 10) * 14 * (1 - t); b.setAttribute('transform', `translate(${bx + sw},${y - 22}) rotate(${sw * 1.5}) scale(2.6)`); }, () => {
        b.remove(); SND.sfx('land'); done();
      });
      anim(1400, (t) => { const x = tx + 56 * s - t * 1400, y = hy - t * 420; g.setAttribute('transform', `translate(${x},${y}) scale(${-s},${s})`); }, () => { clearInterval(fl); g.remove(); });
    });
  }
  // 3Dのコウノトリ（three.js）。使えない環境では2Dのコウノトリにする
  function storkDrop3D(xy, done) {
    if (!window.THREE || !window.makeStork3D) return storkDrop(xy, done);
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true }); } catch (e) { return storkDrop(xy, done); }
    const wrap = map.parentElement, svg = $('svg', map);
    const W = wrap.clientWidth, H = wrap.clientHeight;
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); renderer.setSize(W, H);
    const cv = renderer.domElement; cv.className = 'stork3d'; wrap.appendChild(cv);
    const scene = new THREE.Scene();
    const cam = new THREE.OrthographicCamera(0, W, 0, -H, -2000, 2000);
    if (window.addStorkLights) window.addStorkLights(scene, THREE); else { scene.add(new THREE.HemisphereLight(0xffffff, 0x8a7a66, 1.0)); const d = new THREE.DirectionalLight(0xffffff, 0.9); d.position.set(-1, 2, 3); scene.add(d); }
    const st = window.makeStork3D(THREE);
    const S = Math.max(20, W / 17); // 翼を広げると地図幅の半分ほど
    const holder = new THREE.Group(); holder.add(st.group); st.group.scale.setScalar(S); scene.add(holder);
    // 地図上の点 → キャンバスの座標
    const pt = svg.createSVGPoint(); pt.x = xy[0]; pt.y = xy[1];
    const sp = pt.matrixTransform(svg.getScreenCTM()), wr = wrap.getBoundingClientRect();
    const tx = sp.x - wr.left, ty = sp.y - wr.top;
    // 赤ちゃんの顔が見えるよう、いつも左から右へ飛ぶ（包みはくちばしの先＝体の中心から約2.9体長先）
    const hover = { x: tx - S * 2.9, y: Math.max(S * 3, ty - H * 0.28) };
    const from = { x: -S * 7, y: Math.max(-S * 2, hover.y - H * 0.45) }, to = { x: W + S * 9, y: Math.max(-S * 6, hover.y - H * 0.55) };
    const place = (x, y, dx, dy) => { holder.position.set(x, -y, 0); holder.rotation.set(0, 0, 0); holder.rotateZ(Math.max(-0.35, Math.min(0.35, Math.atan2(-dy, Math.max(1, dx))))); holder.rotateX(-0.75); };
    let t0 = performance.now(), last = t0, phase = 'in', dropT = 0, fall = null;
    SND.sfx('whoosh'); const FLAP_HZ = 1.7; let flapN = -1; // 羽ばたき1回ごとに、打ち下ろしの瞬間に羽音を鳴らす
    const bundleWorld = new THREE.Vector3();
    function frame(now) {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      const el = (now - t0) / 1000;
      const fp = el * FLAP_HZ * Math.PI * 2; st.update(dt, fp);
      const n = Math.floor((fp - Math.PI * 0.75) / (Math.PI * 2)); // 翼が上がりきって打ち下ろし始めたところ
      if (n > flapN) { flapN = n; if (n >= 0) SND.sfx('flap'); }
      if (phase === 'in') {
        const k = Math.min(1, el / 1.9), e = ease(k);
        const x = from.x + (hover.x - from.x) * e, y = from.y + (hover.y - from.y) * e - Math.sin(e * Math.PI) * H * 0.08;
        place(x, y, hover.x - from.x, hover.y - from.y);
        if (k >= 1) { phase = 'drop'; dropT = now; const wp = st.releaseBundle(); if (wp) bundleWorld.copy(wp); fall = st.bundle; if (fall && fall.parent !== scene) { scene.attach ? scene.attach(fall) : scene.add(fall); } }
      } else {
        const k2 = Math.min(1, (now - dropT) / 1500), e2 = k2 * k2;
        place(hover.x + (to.x - hover.x) * e2, hover.y + (to.y - hover.y) * e2, to.x - hover.x, to.y - hover.y);
        if (fall) { const kf = Math.min(1, (now - dropT) / 950); const sx = fall.userData.sx ?? (fall.userData.sx = fall.position.x), sy = fall.userData.sy ?? (fall.userData.sy = fall.position.y); fall.position.x = sx + (tx - sx) * kf + Math.sin(kf * 9) * S * 0.15 * (1 - kf); fall.position.y = sy + (-ty - sy) * kf * kf; fall.rotation.z = Math.sin(kf * 8) * 0.4 * (1 - kf); if (kf >= 1 && !fall.userData.landed) { fall.userData.landed = true; fall.visible = false; flapN = Infinity; SND.sfx('land'); done(); } }
        if (k2 >= 1) { renderer.dispose(); cv.remove(); return; }
      }
      renderer.render(scene, cam);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  function zoomTo(box, pref, ms, done) {
    const svg = $('svg', box), b = M.bbox[pref];
    const [vx, vy, vw, vh] = M.viewBox.split(' ').map(Number);
    let w = (b.x1 - b.x0) * 1.9 + 60, h = (b.y1 - b.y0) * 1.9 + 60;
    const ar = vw / vh; if (w / h > ar) h = w / ar; else w = h * ar;
    w = Math.min(w, vw); h = Math.min(h, vh);
    const cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2;
    const to = [cx - w / 2, cy - h / 2, w, h];
    anim(ms, (t) => { const e = ease(t); svg.setAttribute('viewBox', [vx + (to[0] - vx) * e, vy + (to[1] - vy) * e, vw + (to[2] - vw) * e, vh + (to[3] - vh) * e].join(' ')); }, () => done(w / vw));
  }
  const map = $('#jmap');
  map.innerHTML = mapSVG('big');

  // トップの地図：出生数の分布＋直近1時間の出生（市区町村の人口と都道府県の出生数で重み付け）
  const home = $('#homeMap');
  home.innerHTML = mapSVG('big');
  const allCities = [];
  E.PREFS.forEach((p) => p.cityList.forEach((c) => allCities.push({ p: p.n, c: c.n, w: p.b * c.v / p.cityList.reduce((t, x) => t + x.v, 0) })));
  const totW = allCities.reduce((t, x) => t + x.w, 0);
  // 実際の速さで：誕生（赤い点）と死亡（灰色の点がすっと消える）を、実際の比率どおりに地図に出す
  const FAST = 1;
  const cumPick = (arr) => { let x = Math.random() * arr.tot, it = arr[0]; for (const c of arr) { x -= c.w; if (x <= 0) { it = c; break; } } return it; };
  allCities.tot = totW;
  const popCities = []; E.PREFS.forEach((p) => p.cityList.forEach((c) => popCities.push({ p: p.n, c: c.n, w: c.v * p.cityScale })));
  popCities.tot = popCities.reduce((t, x) => t + x.w, 0);
  let nB = 0, nD = 0;
  function dot(it, cls, r) {
    const xy = M.cities[it.p + '/' + it.c]; if (!xy) return null;
    const j = () => (Math.random() - 0.5) * 12;
    const g = $('.marks', home);
    g.insertAdjacentHTML('beforeend', `<circle class="dot ${cls}" cx="${xy[0] + j()}" cy="${xy[1] + j()}" r="${r}"/>`);
    return g.lastElementChild;
  }
  function birth() {
    nB++; $('#cBirth').textContent = nB.toLocaleString();
    const it = cumPick(allCities);
    const el = dot(it, 'new', 7); if (!el) return;
    const t = $('#homeToast'); const r = home.getBoundingClientRect(), hr = $('.hero').getBoundingClientRect(), xy = M.cities[it.p + '/' + it.c], vb = M.viewBox.split(' ').map(Number);
    t.textContent = `いま、${it.p}${it.c}で${Math.random() < 105 / 205 ? '男の子' : '女の子'}が生まれました`;
    t.style.left = `${r.left - hr.left + xy[0] / vb[2] * r.width}px`; t.style.top = `${r.top - hr.top + xy[1] / vb[3] * r.height}px`;
    t.classList.remove('show'); void t.offsetWidth; t.classList.add('show');
    setTimeout(() => el.classList.remove('new'), 1500);
    const all = $$('.dot.b', home); el.classList.add('b'); if (all.length > 200) all[0].remove();
  }
  function death() {
    nD++; $('#cDeath').textContent = nD.toLocaleString();
    const el = dot(cumPick(popCities), 'gone', 6); if (el) setTimeout(() => el.remove(), 2200);
  }
  function resetHome() { nB = 0; nD = 0; $('#cBirth').textContent = '0'; $('#cDeath').textContent = '0'; $$('.dot.new, .dot.gone', home).forEach((d) => d.remove()); }
  const poisson = (rate, fn) => (function loop() { setTimeout(() => { if (!document.hidden) fn(); loop(); }, -Math.log(1 - Math.random()) / rate * 1000); })();
  // 最初に直近1時間の出生分を薄い点で置いておく
  for (let i = 0; i < Math.round(bps * 3600); i++) { const el = dot(cumPick(allCities), 'b', 4); }
  poisson(bps * FAST, birth);
  poisson(dps * FAST, death);

  // ---------- 状態 ----------
  const S = { life: null, peers: [], world: null, timer: null, paused: false, speed: 4, base: 2, auto: false, busy: false, group: null, logN: 0 };

  function seed() { return (crypto.getRandomValues(new Uint32Array(1))[0]) >>> 0; }

  // ---------- 途中保存（乱数の種と選んだ選択肢を保存し、開き直したら同じ人生を再現する） ----------
  function save() { if (S.rec) { S.rec.age = S.life.age; S.rec.savedAt = Date.now(); store.set('current', S.rec); } }
  function clearSave() { store.set('current', null); }
  function makePeers(rec) { return rec.peers.map((p) => E.runAuto(E.createLife({ seed: p.seed, world: S.world, date: p.date, era: rec.era }))); }
  function replayCmds(rec, l) { (rec.uq || []).forEach((x) => { const o = typeof x === 'number' ? { a: x, id: 'shigoto' } : x; if (o.a !== l.age) return; const c = CMDS.find((y) => (y.key || y.id) === o.id); if (c && c.ok(l)) pushCmd(l, c); }); }
  // 保存した選択を再生するとき、版の違いで選択肢が変わっていたら「おまかせ」で埋める
  const validChoice = (l, d, c) => (c != null && c >= 0 && d.options.some((o) => o.i === c) ? c : E.autoChoice(l, d));
  function restore(rec) {
    S.world = E.createWorld(rec.wseed, new Date(rec.date).getFullYear());
    const l = E.createLife({ seed: rec.seed, world: S.world, date: rec.date, era: rec.era });
    l.name.sei = rec.sei; l.name.mei = rec.mei;
    S.peers = makePeers(rec);
    l.peerList = S.peers.map((p) => ({ name: `${p.name.sei}${p.name.mei}`, pref: p.birthPref, city: p.birthCity, deathAge: p.deathAge, cause: p.deathCause }));
    let k = 0, focus = 'バランス';
    while (l.alive && l.age < rec.age) {
      if (rec.focus[l.age]) focus = rec.focus[l.age];
      l.focus = focus;
      replayCmds(rec, l);
      for (let ds = E.pendingDecisions(l); ds.length; ds = E.pendingDecisions(l)) for (const d of ds) { const c = rec.choices[k++]; E.resolve(l, d, validChoice(l, d, c)); }
      E.step(l);
      rec.notes.filter((n) => n.age === l.age).forEach((n) => { l.notes.push(n); l.log.push({ age: l.age, year: l.year, c: 'note', t: `「${n.t}」`, tone: 'note' }); });
    }
    l.focus = rec.focus[l.age] || focus;
    replayCmds(rec, l);
    // 答えている途中で閉じた年：そこまでの答えを当てはめ、残りの問いを覚えておく
    S.resumeQs = null;
    if (rec.asking && l.alive) {
      const part = rec.partial || []; let j = 0, left = [];
      outer: for (let ds = E.pendingDecisions(l); ds.length; ds = E.pendingDecisions(l)) {
        for (let i = 0; i < ds.length; i++) {
          if (j >= part.length) { left = ds.slice(i); break outer; }
          const c = part[j++]; E.resolve(l, ds[i], validChoice(l, ds[i], c));
        }
      }
      S.resumeQs = { left, pend: part.slice(0, j) };
    }
    (rec.stars || []).forEach((i) => { if (l.log[i]) l.log[i].star = true; });
    rec.choices.length = k;
    S.life = l; S.rec = rec; S.base = rec.base || 2; S.auto = !!rec.auto; $('#chkAuto').checked = S.auto;
  }
  function showResume() {
    const rec = store.get('current', null), btn = $('#btnResume'), info = $('#resumeInfo'), born = $('#btnBorn');
    const has = !!(rec && rec.seed);
    btn.hidden = !has; info.hidden = !has;
    born.classList.toggle('secondary', has);
    born.textContent = has ? '新しく生まれる' : '生まれる';
    $('#eraPick').hidden = has; // 時代は新しく生まれるときだけ選べる
    if (has) info.textContent = `続き：${rec.sei} ${rec.mei}（${rec.era && rec.era !== 'modern' ? { showa: '昭和', showa2: '昭和後期', heisei: '平成', senji: '戦時中', edo: '江戸' }[rec.era] + '・' : ''}${rec.age}歳・${rec.pref || ''}生まれ）`;
  }
  $('#btnResume').addEventListener('click', async () => {
    const rec = store.get('current', null); if (!rec || !rec.seed) return;
    try { restore(JSON.parse(JSON.stringify(rec))); startLife(true); }
    catch (er) {
      console.error(er);
      const again = await ask({ title: '続きから再開できませんでした', text: `${rec.sei} ${rec.mei}さんの記録は、古い版で保存されたため読み込めませんでした。同じ生まれ（同じ家・同じ名前）で、最初からもう一度生きますか？`, ok: '同じ生まれでやり直す', ng: '新しく生まれる' });
      try {
        if (again) { const r2 = Object.assign({}, rec, { age: 0, choices: [], focus: {}, notes: [], stars: [], asking: false, partial: null }); store.set('current', r2); restore(r2); startLife(true); }
        else { store.set('current', null); showResume(); $('#btnBorn').click(); }
      } catch (er2) { console.error(er2); store.set('current', null); showResume(); }
    }
  });
  $('#btnBorn').addEventListener('click', (e) => {
    const rec = store.get('current', null);
    if (rec && rec.seed && !S.bornOk) {
      e.stopImmediatePropagation();
      ask({ title: '新しく生まれますか？', text: `途中の人生（${rec.sei} ${rec.mei}さん・${rec.age}歳）は消えて、もう続きからは再開できなくなります。`, ok: '新しく生まれる', ng: 'やめておく', danger: true })
        .then((yes) => { if (!yes) return; S.bornOk = true; $('#btnResume').hidden = true; $('#resumeInfo').hidden = true; const b = $('#btnBorn'); b.classList.remove('secondary'); b.textContent = '生まれる'; const ep = $('#eraPick'); ep.hidden = false; ep.scrollIntoView({ behavior: 'smooth', block: 'center' }); });
    }
  }, true);
  showResume();

  // ---------- 生まれる時代 ----------
  const ERA_RANGE = { modern: null, random: null, heisei: [1990, 2018], showa2: [1980, 1989], showa: [1950, 1965], senji: [1920, 1926], edo: [1830, 1845] };
  S.era = (() => { try { const v = localStorage.getItem('era'); return ERA_RANGE[v] !== undefined && v !== 'edo' ? v : 'modern'; } catch (e) { return 'modern'; } })();
  const markEra = () => $$('#eraPick button').forEach((b) => { const on = b.dataset.era === S.era; b.classList.toggle('on', on); b.setAttribute('aria-checked', String(on)); });
  markEra();
  $('#eraPick').addEventListener('click', (e) => { const b = e.target.closest('button[data-era]'); if (!b) return; S.era = b.dataset.era; try { localStorage.setItem('era', S.era); } catch (er) { } markEra(); SND.sfx('click'); });
  // ---------- ランダム：ルーレットで生まれる時代を決める ----------
  const ROULETTE = [['modern', '現代', '令和・2026年〜'], ['heisei', '平成', '1990〜2018年'], ['showa2', '昭和後期', '1980〜89年'], ['showa', '昭和', '1950〜65年'], ['senji', '戦時中', '1920〜26年']];
  const rollEra = () => { const P = [['modern', 30], ['heisei', 25], ['showa2', 15], ['showa', 15], ['senji', 15]], t = Math.random() * 100; let acc = 0; return P.find(([, w]) => (acc += w) > t)[0]; };
  // 誕生画面の地図の下で、時代ルーレットを回す（地図の抽選と同時に）
  function eraRoulette(target) {
    let box = $('#eraRl');
    if (!box) { box = document.createElement('div'); box.id = 'eraRl'; box.className = 'eraroul'; $('#mapLegend').after(box); }
    box.hidden = false; box.className = 'eraroul';
    box.innerHTML = `<p class="rlttl">生まれる時代は……</p><div class="rllist">${ROULETTE.map(([k, n, y]) => `<div class="rlcell" data-k="${k}"><b>${n}</b><small>${y}</small></div>`).join('')}</div>`;
    const cells = [...box.querySelectorAll('.rlcell')], ti = ROULETTE.findIndex((x) => x[0] === target);
    const steps = ROULETTE.length * 3 + ti + 1; let i = 0;
    const tick = () => {
      if (!document.body.contains(box)) return;
      cells.forEach((c) => c.classList.remove('on')); cells[i % cells.length].classList.add('on');
      if (++i >= steps) { setTimeout(() => { cells[ti].classList.add('hit'); box.classList.add('done'); SND.sfx('send'); }, 120); return; }
      setTimeout(tick, 55 + Math.pow(i / steps, 3) * 420);
    };
    setTimeout(tick, 150);
  }
  // ---------- 誕生 ----------
  $('#btnBorn').addEventListener('click', () => {
    S.bornOk = false; S.base = 2;
    // ランダム：現代・平成・昭和後期・昭和・戦時中から
    let era = S.era;
    const rand = era === 'random';
    if (rand) era = rollEra();
    const rng = ERA_RANGE[era], t0 = new Date();
    const now = rng ? new Date(rng[0] + Math.floor(Math.random() * (rng[1] - rng[0] + 1)), t0.getMonth(), t0.getDate(), t0.getHours(), t0.getMinutes()) : t0;
    const rec = { v: 1, seed: seed(), wseed: seed(), date: now.toISOString(), era: rng ? era : 'modern', base: S.base, choices: [], focus: {}, notes: [], age: 0 };
    rec.peers = [0, 1, 2, 3].map(() => { const d = new Date(now); d.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60)); return { seed: seed(), date: d.toISOString() }; });
    S.world = E.createWorld(rec.wseed, now.getFullYear());
    S.life = E.createLife({ seed: rec.seed, world: S.world, date: now, era: rec.era });
    S.peers = makePeers(rec);
    S.life.peerList = S.peers.map((p) => ({ name: `${p.name.sei}${p.name.mei}`, pref: p.birthPref, city: p.birthCity, deathAge: p.deathAge, cause: p.deathCause }));
    S.rec = rec; S.pend = [];
    go('birth');
    $('#birthCard').hidden = true;
    if ($('#eraRl')) $('#eraRl').hidden = true;
    if (rand) eraRoulette(rec.era);
    roulette(E.PREFS.findIndex((p) => p.n === S.life.birthPref), showBirth);
  });

  function roulette(target, done) {
    map.innerHTML = mapSVG('big');
    $('#mapCap').hidden = true;
    const tiles = $$('path', map);
    tiles.forEach((t) => t.classList.remove('hot', 'final'));
    let n = 0, delay = 30, prev = null;
    const steps = 18;
    $('#mapLegend').textContent = 'どこに生まれるか、出生数の割合で抽選しています…';
    const tick = () => {
      if (prev) prev.classList.remove('hot');
      if (n >= steps) {
        const l = S.life, xy = cityXY(l.birthPref, l.birthCity, l.seed);
        $('#mapLegend').textContent = 'コウノトリが赤ちゃんを運んでいます…';
        storkDrop3D(xy, () => {
          tiles[target].classList.add('final');
          zoomTo(map, l.birthPref, 900, (k) => {
            $('.marks', map).innerHTML = pinSVG(xy, l.birthCity, true, false, k);
            const cap = $('#mapCap'); cap.innerHTML = `<small>${l.born.y}年${l.born.m}月${l.born.d}日 ${l.born.hh}時${String(l.born.mm).padStart(2, '0')}分${l.born.facility ? '・' + esc(l.born.facility.name) : ''}</small>${esc(l.birthPref)}${esc(l.birthCity)}で<br><b>${l.sex === 'M' ? '男の子' : '女の子'}</b>が生まれました`; cap.hidden = false;
            $('#mapLegend').textContent = `${l.birthPref}${l.birthCity}`;
            setTimeout(done, 500);
          });
        });
        return;
      }
      const i = n === steps - 1 ? target : E.PREFS.indexOf(pickW());
      prev = tiles[i]; prev.classList.add('hot');
      n++; delay *= 1.09;
      setTimeout(tick, delay);
    };
    tick();
  }
  function pickW() { let x = Math.random() * E.PREFS.reduce((a, p) => a + p.b, 0); for (const p of E.PREFS) { x -= p.b; if (x <= 0) return p; } return E.PREFS[0]; }

  function famRows(l) {
    const f = l.fam, rows = [];
    const pj = (p) => `${p.age0}歳・${p.job.title}${p.job.income ? `（年収 約${Math.round(p.job.income)}万円・月 約${(p.job.income / 12).toFixed(1)}万円）` : ''}<br><span class="small muted">性格：${esc(p.persona || '')}</span>`;
    if (f.father) rows.push(['父', `${esc(f.father.name)}　${pj(f.father)}`]);
    else rows.push(['父', '—（母は未婚）']);
    rows.push(['母', `${esc(f.mother.name)}　${pj(f.mother)}${f.mother.job.kind === '正社員' || f.mother.job.kind === '公務員' ? '・育休中' : ''}`]);
    rows.push(['世帯年収', `約${E.fmtMan(f.parentHH)}${moM(f.parentHH)}　<span class="muted small">${l.lifestyle ? l.lifestyle.classLabel : ''}</span>`]);
    if (f.siblings.length) rows.push(['きょうだい', f.siblings.map((s) => `${s.rel}（${s.name}${s.diff ? '・' + -s.diff + '歳上' : ''}）`).join('、')]);
    else rows.push(['きょうだい', '第1子（ひとりっ子として生まれました）']);
    rows.push(['家庭の雰囲気', `${esc(f.mood)}<span class="small muted">（夫婦仲：${f.father ? (f.satisfied ? 'よい' : 'ぎくしゃく') : '—'}・家族そろっての夕食：${esc(f.dinner)}${f.eduMama ? '・教育熱心' : ''}）</span>`]);
    rows.push(['住まい', `${l.fam.home}${f.gen3 ? '・祖父母と同居' : ''}`]);
    if (l.congenital && l.congenital.length) rows.push(['生まれつき', l.congenital.map((c) => esc(c[0])).join('、')]);
    rows.push(['体質・気質', `${l.blood}型・${l.lefty ? '左利き' : '右利き'}・${esc(l.temper)}`]);
    if (l.lifestyle) rows.push(['地域', l.lifestyle.areaLabel]);
    return rows;
  }

  // 家庭の雰囲気を1枚の絵に（両親の性格・夫婦仲・夕食・同居・きょうだいから描く）
  function familyScene(l) {
    const f = l.fam, mood = f.mood, W = 340, H = 170, fy = 150;
    const happy = ['仲良し家族', 'にぎやか', '穏やか', '自由'].includes(mood), tense = mood === 'ピリピリしている', quiet = mood === '会話が少ない';
    const face = (x, y, r, kind, look) => {
      const ex = look || 0, e = `<circle cx="${x - r * 0.35 + ex}" cy="${y - r * 0.08}" r="${r * 0.09}" fill="var(--il-ink)"/><circle cx="${x + r * 0.35 + ex}" cy="${y - r * 0.08}" r="${r * 0.09}" fill="var(--il-ink)"/>`;
      const m = kind === 'smile' ? `<path d="M${x - r * 0.32 + ex} ${y + r * 0.3} Q${x + ex} ${y + r * 0.62} ${x + r * 0.32 + ex} ${y + r * 0.3}" fill="none" stroke="var(--il-ink)" stroke-width="1.6" stroke-linecap="round"/>`
        : kind === 'frown' ? `<path d="M${x - r * 0.28 + ex} ${y + r * 0.5} Q${x + ex} ${y + r * 0.25} ${x + r * 0.28 + ex} ${y + r * 0.5}" fill="none" stroke="var(--il-ink)" stroke-width="1.6" stroke-linecap="round"/><path d="M${x - r * 0.55 + ex} ${y - r * 0.4} l${r * 0.3} ${r * 0.12} M${x + r * 0.55 + ex} ${y - r * 0.4} l${-r * 0.3} ${r * 0.12}" stroke="var(--il-ink)" stroke-width="1.4" stroke-linecap="round"/>`
        : `<path d="M${x - r * 0.22 + ex} ${y + r * 0.4} h${r * 0.44}" stroke="var(--il-ink)" stroke-width="1.6" stroke-linecap="round"/>`;
      const cheek = kind === 'smile' ? `<circle cx="${x - r * 0.55 + ex}" cy="${y + r * 0.22}" r="${r * 0.13}" fill="var(--il-accent)" opacity=".3"/><circle cx="${x + r * 0.55 + ex}" cy="${y + r * 0.22}" r="${r * 0.13}" fill="var(--il-accent)" opacity=".3"/>` : '';
      return e + m + cheek;
    };
    const person = (x, h, o) => {
      const r = h * 0.17, hy = fy - h + r, bw = h * 0.36, by = hy + r * 0.9;
      const hair = o.gray ? 'var(--il-soft)' : 'var(--il-ink)';
      const hp = o.sex === 'F' ? `<path d="M${x - r * 1.05} ${hy + r * 0.9} Q${x - r * 1.2} ${hy - r * 1.25} ${x} ${hy - r * 1.05} Q${x + r * 1.2} ${hy - r * 1.25} ${x + r * 1.05} ${hy + r * 0.9} L${x + r * 0.8} ${hy - r * 0.2} Q${x} ${hy - r * 0.55} ${x - r * 0.8} ${hy - r * 0.2}Z" fill="${hair}"/>`
        : `<path d="M${x - r * 1.0} ${hy - r * 0.05} Q${x - r * 0.9} ${hy - r * 1.2} ${x} ${hy - r * 1.05} Q${x + r * 0.95} ${hy - r * 1.15} ${x + r * 1.0} ${hy - r * 0.05} Q${x} ${hy - r * 0.5} ${x - r * 1.0} ${hy - r * 0.05}Z" fill="${hair}"/>`;
      const body = `<path d="M${x - bw / 2} ${fy} L${x - bw / 2} ${by + bw * 0.35} Q${x - bw / 2} ${by} ${x} ${by} Q${x + bw / 2} ${by} ${x + bw / 2} ${by + bw * 0.35} L${x + bw / 2} ${fy}Z" fill="${o.color}"/>`;
      return body + `<circle cx="${x}" cy="${hy}" r="${r}" fill="var(--il-skin)"/>` + hp + face(x, hy, r, o.face, o.look) + (o.phone ? `<rect x="${x - r * 0.5}" y="${by + r * 0.4}" width="${r}" height="${r * 1.4}" rx="2" fill="var(--il-indigo)"/><rect x="${x - r * 0.38}" y="${by + r * 0.55}" width="${r * 0.76}" height="${r * 1.05}" fill="var(--il-sky)"/>` : '');
    };
    const fFace = happy ? 'smile' : tense || mood === '厳格' ? 'frown' : 'flat';
    const ppl = [];
    if (f.gen3) ppl.push({ h: 92, sex: 'M', gray: true, color: 'var(--il-green)', face: happy ? 'smile' : 'flat' }, { h: 86, sex: 'F', gray: true, color: 'var(--il-yellow)', face: happy || mood === '会話が少ない' ? 'smile' : 'flat' });
    if (f.father) ppl.push({ h: 118, sex: 'M', color: 'var(--il-indigo)', face: tense ? 'frown' : fFace, look: tense ? -2 : 0, phone: quiet, dad: 1 });
    ppl.push({ h: 108, sex: 'F', color: 'var(--il-accent)', face: tense ? 'frown' : mood === '厳格' ? 'flat' : fFace === 'flat' && !quiet ? 'smile' : fFace, look: tense ? 2 : 0, mom: 1 });
    f.siblings.filter((x) => x.diff).slice(0, 3).forEach((x) => ppl.push({ h: Math.min(84, 50 - x.diff * 7), sex: x.sex, color: x.sex === 'M' ? 'var(--il-sky)' : 'var(--il-yellow)', face: tense ? 'flat' : happy ? 'smile' : 'flat', phone: quiet && -x.diff >= 6 }));
    // 並べる：夫婦仲が悪いと父と母のあいだがあく
    const gap = (i) => (f.father && !f.satisfied && ppl[i - 1] && ppl[i - 1].dad ? 36 : 0);
    const ws = ppl.map((p) => p.h * 0.46 + 8), tot = ws.reduce((a, b) => a + b, 0) + ppl.reduce((a, _, i) => a + gap(i), 0);
    let x = Math.max(4, (250 - tot) / 2 + 10), figs = '', momX = 0, dadX = 0;
    ppl.forEach((p, i) => { x += gap(i); const cx = x + ws[i] / 2; figs += person(cx, p.h, p); if (p.mom) momX = cx; if (p.dad) dadX = cx; x += ws[i]; });
    // 母が抱く赤ちゃん
    const baby = `<g transform="translate(${momX + 4} ${fy - 108 * 0.5})"><ellipse cx="0" cy="6" rx="15" ry="10" fill="var(--il-paper)" stroke="var(--il-soft)" stroke-width="1.5"/><circle cx="-6" cy="0" r="7.5" fill="var(--il-skin)"/>${face(-6, 0, 7.5, 'smile')}</g>`;
    // 部屋と小物
    let deco = '';
    const win = `<rect x="22" y="22" width="56" height="44" rx="4" fill="var(--il-sky)" opacity=".7"/><path d="M50 22v44M22 44h56" stroke="var(--il-paper)" stroke-width="3"/>`;
    const table = f.dinner === 'ほとんどない' ? `<rect x="262" y="118" width="62" height="6" rx="2" fill="var(--il-soft)"/><path d="M270 124v26M316 124v26" stroke="var(--il-soft)" stroke-width="4"/><circle cx="300" cy="48" r="15" fill="var(--il-paper)" stroke="var(--il-ink)" stroke-width="2"/><path d="M300 48v-9M300 48l6 4" stroke="var(--il-ink)" stroke-width="2" stroke-linecap="round"/>`
      : `<rect x="252" y="116" width="78" height="7" rx="2" fill="var(--il-yellow)"/><path d="M262 123v27M320 123v27" stroke="var(--il-yellow)" stroke-width="4"/>${f.dinner === 'ほぼ毎日' ? '<ellipse cx="270" cy="113" rx="10" ry="4" fill="var(--il-paper)" stroke="var(--il-soft)"/><ellipse cx="292" cy="112" rx="12" ry="5" fill="var(--il-paper)" stroke="var(--il-soft)"/><path d="M286 110q6-6 12 0" fill="var(--il-accent)"/><ellipse cx="314" cy="113" rx="10" ry="4" fill="var(--il-paper)" stroke="var(--il-soft)"/><path d="M286 100q3-6 0-10M296 100q3-6 0-10" stroke="var(--il-soft)" stroke-width="1.5" fill="none" stroke-linecap="round"/>' : '<ellipse cx="292" cy="112" rx="12" ry="5" fill="var(--il-paper)" stroke="var(--il-soft)"/>'}`;
    const heart = (hx, hy, sc) => `<path transform="translate(${hx} ${hy}) scale(${sc})" d="M0 4C-6-4-14 2-7 9L0 15 7 9C14 2 6-4 0 4Z" fill="var(--il-accent)" opacity=".8"/>`;
    if (mood === '仲良し家族') deco += heart(momX - 30, 30, 1) + heart(momX + 18, 18, 0.7) + (dadX ? heart(dadX - 6, 22, 0.8) : '');
    if (mood === 'にぎやか') deco += `<g fill="var(--il-ink)" opacity=".75"><path d="M${momX - 40} 40v-16l10-3v16" stroke="var(--il-ink)" stroke-width="2" fill="none"/><circle cx="${momX - 43}" cy="40" r="4"/><circle cx="${momX - 33}" cy="37" r="4"/></g><g stroke="var(--il-accent)" stroke-width="2.4" stroke-linecap="round"><path d="M${momX + 30} 22l6-8M${momX + 38} 28l9-3M${momX + 24} 18l0-9"/></g>`;
    if (mood === '穏やか') deco += `<circle cx="300" cy="40" r="13" fill="var(--il-yellow)"/><g stroke="var(--il-yellow)" stroke-width="2.5" stroke-linecap="round"><path d="M300 18v-6M300 62v6M278 40h-6M322 40h6M285 25l-4-4M315 25l4-4"/></g>`;
    if (mood === '自由') deco += `<path d="M120 20l14 10-10 14-14-10Z" fill="var(--il-accent)" opacity=".85"/><path d="M118 38q6 14-2 28" stroke="var(--il-ink)" fill="none" stroke-width="1.2"/><path d="M100 130c-6-14 4-26 10-30 4 12-2 24-10 30Z" fill="var(--il-green)"/>`;
    if (tense) deco += `<path d="M${(dadX + momX) / 2 - 6} 28l8 10-6 2 8 12" stroke="var(--il-accent)" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M${dadX - 14} 34q-6-6 0-10M${momX + 14} 34q6-6 0-10" stroke="var(--il-ink)" stroke-width="1.6" fill="none"/>`;
    if (quiet) deco += `<g transform="translate(${(dadX || momX) + 8} 4)"><rect width="44" height="22" rx="11" fill="var(--il-paper)" stroke="var(--il-soft)" stroke-width="1.5"/><circle cx="12" cy="11" r="2.5" fill="var(--il-ink)"/><circle cx="22" cy="11" r="2.5" fill="var(--il-ink)"/><circle cx="32" cy="11" r="2.5" fill="var(--il-ink)"/></g>`;
    if (mood === '厳格') deco += `<rect x="96" y="26" width="10" height="34" fill="var(--il-indigo)"/><rect x="107" y="30" width="9" height="30" fill="var(--il-green)"/><rect x="117" y="24" width="11" height="36" fill="var(--il-accent)"/><path d="M92 60h40" stroke="var(--il-ink)" stroke-width="2"/>`;
    if (f.eduMama) deco += `<g transform="translate(12 120)"><rect width="30" height="8" fill="var(--il-indigo)"/><rect x="3" y="-8" width="26" height="8" fill="var(--il-accent)"/><rect x="1" y="-16" width="28" height="8" fill="var(--il-green)"/><path d="M8 -26l7-4 7 4-7 4z" fill="var(--il-ink)"/></g>`;
    const sub = `${f.father ? (f.satisfied ? '夫婦仲よし' : '夫婦はぎくしゃく') : 'ひとり親'}・夕食${f.dinner === 'ほぼ毎日' ? 'はほぼ毎日いっしょ' : f.dinner === '週に数回' ? 'は週に数回いっしょ' : 'はばらばら'}${f.gen3 ? '・祖父母と同居' : ''}${f.eduMama ? '・教育熱心' : ''}`;
    return `<figure class="famscene"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="家庭の雰囲気：${esc(mood)}"><rect width="${W}" height="${H}" rx="14" fill="var(--il-paper)"/><rect y="${fy}" width="${W}" height="${H - fy}" fill="var(--il-soft)"/>${win}${table}${deco}${figs}${baby}</svg><figcaption><b>${esc(mood)}</b>　<span class="small muted">${sub}</span></figcaption></figure>`;
  }

  // 誕生カードの家族：舞台と同じドット絵で、家族の雰囲気を見せる
  // ドット絵キャンバスの共通処理：端末の画素比に合わせた整数倍率で描き、座標を画素に合わせて、ドットの大きさが不ぞろいにならないようにする
  const pxDpr = () => Math.max(2, Math.round(window.devicePixelRatio || 1));
  function pxSnap(g) {
    if (g._snap) return; g._snap = true;
    const f = g.fillRect.bind(g);
    g.fillRect = (x, y, w, h) => { const X = Math.round(x), Y = Math.round(y); f(X, Y, Math.max(1, Math.round(x + w) - X), Math.max(1, Math.round(y + h) - Y)); };
  }
  // 生まれた直後：地図の下にある「あなたの家・プロフィール」へスクロールするよう案内する
  function birthHint() {
    const h = $('#scrollHint'), card = $('#bScene') || $('#birthCard'); if (!h || !card) return;
    const check = () => { const r = card.getBoundingClientRect(); const need = r.top > window.innerHeight - 60 && $('#birth').classList.contains('active'); h.hidden = !need; if (!need && r.top < window.innerHeight * 0.6) { window.removeEventListener('scroll', check); h.hidden = true; } };
    if (!h._bound) { h._bound = true; h.addEventListener('click', () => { ($('#birthCard').querySelector('h3') || card).scrollIntoView({ behavior: 'smooth', block: 'start' }); h.hidden = true; }); }
    window.addEventListener('scroll', check, { passive: true });
    setTimeout(check, 600); setTimeout(check, 2500);
  }
  function famPixel(l) {
    const cv = $('#famCv'); if (!cv || !window.PXS) return;
    const Wc = Math.max(200, Math.floor((cv.parentElement.clientWidth || 322) - 2)), Hc = 110, sc = pxDpr(), P = 3;
    cv.width = Wc * sc; cv.height = Hc * sc; cv.style.width = Wc + 'px'; cv.style.height = Hc + 'px';
    const tok = cv._tok = {}; pxSnap(cv.getContext('2d'));
    if (window.ResizeObserver && !cv._ro) { cv._ro = new ResizeObserver(() => { const w = Math.floor(cv.parentElement.clientWidth); if (w && Math.abs(w - parseFloat(cv.style.width)) > 2) famPixel(l); }); cv._ro.observe(cv.parentElement); }
    const f = l.fam, mood = f.mood, happy = ['仲良し家族', 'にぎやか', '穏やか', '自由'].includes(mood), tense = mood === 'ピリピリしている';
    const hap = happy ? 85 : tense ? 20 : 45;
    const mk = (age, sex, job, gray) => ({ age, sex, alive: true, stats: { happy: hap, health: 70, know: 40 }, edu: { stage: age <= 5 ? 'baby' : age <= 11 ? 'elem' : age <= 14 ? 'jhs' : age <= 17 ? 'hs' : 'work' }, job: job || null, retired: age >= 65, flags: {} });
    const ppl = [];
    if (f.gen3) ppl.push({ p: mk(Math.max(60, (f.father || f.mother).age0 + 28), 'M') }, { p: mk(Math.max(58, (f.father || f.mother).age0 + 26), 'F') });
    if (f.father) ppl.push({ p: mk(f.father.age0, 'M', f.father.job && f.father.job.kind !== '無職' ? f.father.job : null), dad: true });
    ppl.push({ p: mk(f.mother.age0, 'F', null), mom: true });
    f.siblings.filter((x) => x.diff).slice(0, 3).forEach((x) => ppl.push({ p: mk(-x.diff, x.sex) }));
    const grids = ppl.map((o) => pixelChar(o.p, true));
    const fxFor = { 仲良し家族: 'hearts', にぎやか: 'notes', 穏やか: 'sun', 自由: 'kite', ピリピリしている: 'bolt', 会話が少ない: 'dots', 厳格: 'books' }[mood];
    const g = cv.getContext('2d'), W = Wc, ground = Hc - 8, t0 = performance.now();
    const prop = (name, x, y, pal) => { const [m, extra] = PROPS[name]; const pl = { ...extra, ...(pal || {}) }; m.forEach((row, j) => [...row].forEach((c, i) => { if (c === '.') return; g.fillStyle = pl[c] || pxCol(c); g.fillRect(x + i * P, y + j * P, P, P); })); };
    const frame = (now) => {
      if (cv._tok !== tok || !document.body.contains(cv) || !$('#birth').classList.contains('active')) return;
      const T = now / 1000, e = (now - t0) / 1000;
      g.setTransform(sc, 0, 0, sc, 0, 0); g.imageSmoothingEnabled = false; g.clearRect(0, 0, W, Hc);
      const h = { Y: (S.life && S.life.year) || 2026, g, W, gr: ground, T, e, P, r: (x, y, w, hh, c) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), w, hh); }, prop };
      window.PXS.BG.homein(h);
      // 食卓
      if (f.dinner === 'ほぼ毎日') { h.r(W * 0.6 + 8, ground - 20, 10, 3, '#ffffff'); h.r(W * 0.6 + 22, ground - 21, 12, 4, '#ffffff'); h.r(W * 0.6 + 24, ground - 23, 8, 2, '#c0392b'); }
      if (f.dinner === 'ほとんどない') { h.r(W * 0.88, 10, 14, 14, '#ffffff'); h.r(W * 0.88 + 6, 12, 2, 6, '#3a332b'); h.r(W * 0.88 + 6, 17, 5, 2, '#3a332b'); }
      g.fillStyle = 'rgba(43,38,32,.2)'; g.fillRect(0, ground, W, 1);
      const tot = grids.reduce((t, gd, i) => t + gd.G * P * 0.72 + (ppl[i].mom && !f.satisfied && f.father ? 30 : 0), 0);
      let x = Math.max(4, (W * 0.58 - tot) / 2), momX = 0, dadX = 0, top = ground;
      grids.forEach((gd, i) => {
        if (ppl[i].mom && !f.satisfied && f.father) x += 30; // 夫婦仲が悪いと離れて立つ
        const r = drawFig(g, gd, x, ground, P, { pose: happy && Math.floor(e * 1.2 + i) % 5 === 0 ? 'jump' : 'stand', T, e, ph: i, flip: ppl[i].dad && tense });
        if (ppl[i].mom) momX = x; if (ppl[i].dad) dadX = x; top = Math.min(top, r.top);
        x += gd.G * P * 0.72;
      });
      // 母に抱かれた赤ちゃん（あなた）
      const mg = grids[ppl.findIndex((o) => o.mom)];
      prop('babyb', momX + mg.G * P * 0.45, ground - (mg.R - mg.hand) * P - 4 * P + (Math.floor(e * 2) % 2));
      const cx = (dadX || momX) + 20;
      switch (fxFor) {
        case 'hearts': for (let k = 0; k < 3; k++) prop('heart', cx + Math.sin(e * 2 + k * 2) * 20, top - 4 - ((e * 12 + k * 9) % 24)); break;
        case 'notes': for (let k = 0; k < 3; k++) prop('note', cx - 20 + k * 22 + (e * 6) % 8, top - (e * 9 + k * 7) % 20); break;
        case 'sun': h.r(W * 0.12 + 16, 12, 10, 10, '#e8b94a'); break;
        case 'kite': h.r(W * 0.12 + 10 + Math.sin(e) * 3, 12 + Math.cos(e) * 2, 8, 8, '#c0392b'); break;
        case 'bolt': { const bx = (dadX + momX) / 2 + 12; if (Math.floor(e * 3) % 2) { h.r(bx, top - 4, 3, 6, '#c0392b'); h.r(bx - 3, top + 2, 3, 6, '#c0392b'); h.r(bx, top + 8, 3, 6, '#c0392b'); } break; }
        case 'dots': prop('bubble', cx, top - 14); break;
        case 'books': h.r(6, ground - 6, 18, 6, '#2c4a7a'); h.r(8, ground - 12, 14, 6, '#c0392b'); break;
      }
      if (f.eduMama) prop('book', W * 0.6 + 40, ground - 26);
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }
  function showBirth() {
    const l = S.life, b = l.born;
    SND.sfx('birth');
    $('#birthCard').hidden = false;
    birthHint();
    $('#bPlace').innerHTML = `${esc(l.birthPref)}${esc(l.birthCity)}で<br>${l.sex === 'M' ? '男の子' : '女の子'}が生まれました`;
    $('#bTime').innerHTML = `${b.y}年${b.m}月${b.d}日 ${b.hh}時${String(b.mm).padStart(2, '0')}分　${b.weight.toFixed(2)}kg　${b.order}番目の子<br><b>${esc(b.place)}</b>${b.facility ? `<span class="small">（${esc(b.facility.kind)}${b.facility.addr ? '・' + esc(b.facility.addr) : ''}）</span>` : ''}`;
    $('#inSei').value = l.name.sei; $('#inMei').value = l.name.mei;
    $('#rSei').textContent = l.name.seiY || ''; $('#rMei').textContent = l.name.meiY || '';
    const sn = l.surnameNote || '';
    $('#bSurnameNote').textContent = sn;
    $('#bFamily').innerHTML = famRows(l).map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('');
    $('#bScene').innerHTML = familyScene(l).replace(/<svg[\s\S]*<\/svg>/, '<canvas id="famCv" role="img" aria-label="家庭の雰囲気"></canvas>');
    famPixel(l);
    const rp = real.value, tb = E.PREFS.reduce((s, p) => s + p.b, 0), pc = (n) => (E.prefByName(n).b / tb * 100).toFixed(1);
    $('#bCompare').textContent = !rp ? '' : rp === l.birthPref ? `実際の出身地と同じ${rp}に生まれました（確率 約${pc(rp)}%）。` : `あなたの実際の出身地（${rp}）に生まれる確率は約${pc(rp)}%。今回の${l.birthPref}は約${pc(l.birthPref)}%でした。`;
  }
  $('#btnStart').addEventListener('click', () => {
    const l = S.life;
    l.name.sei = $('#inSei').value.trim() || l.name.sei;
    l.name.mei = $('#inMei').value.trim() || l.name.mei;
    Object.assign(S.rec, { sei: l.name.sei, mei: l.name.mei, pref: l.birthPref });
    save();
    startLife();
  });

  // ---------- 人生 ----------
  const FOCUS_LIST = ['バランス', '健康', '学び', '仕事', '家族・人間関係', 'お金', '趣味'];
  const sel = $('#selFocus');
  FOCUS_LIST.forEach((f) => sel.insertAdjacentHTML('beforeend', `<option>${f}</option>`));
  sel.addEventListener('change', () => { S.life.focus = sel.value; if (S.rec) { S.rec.focus[S.life.age] = sel.value; save(); } });
  const SPEEDS = [1, 2, 4, 16];
  const YEAR_MS = 48000; // 1×で1年48秒、16×で1年3秒
  SPEEDS.forEach((s) => $('#speedBtns').insertAdjacentHTML('beforeend', `<button class="ghost" data-s="${s}" title="1年＝${YEAR_MS / s / 1000}秒">${s}×</button>`));
  $$('#speedBtns button').forEach((b) => b.addEventListener('click', () => { S.speed = +b.dataset.s; markSpeed(); schedule(); if (S.rec) { S.rec.speed = S.speed; save(); } }));
  // 「続きから」で開いたときは、止まっていることが一目でわかるように大きく出す
  function showPauseBig() { const l = S.life; $('#pauseSub').textContent = `${l.name.sei} ${l.name.mei}さん・${l.age}歳（${l.year}年）${S.resumeQs || S.held ? '　答えていない問いがあります' : ''}`; $('#pauseBig').hidden = false; }
  $('#pauseGo').addEventListener('click', () => { $('#pauseBig').hidden = true; S.paused = false; setPlay(); schedule(); if (S.held) unhold(); });
  $('#pauseBig').addEventListener('click', (e) => { if (e.target.id === 'pauseBig') $('#pauseGo').click(); });
  function setPlay() { if (!S.paused) { const pb = $('#pauseBig'); if (pb) pb.hidden = true; } const b = $('#btnPlay'); b.innerHTML = S.paused ? '▶<span class="lbl"> 再生</span>' : '❚❚<span class="lbl"> 一時停止</span>'; b.setAttribute('aria-label', S.paused ? '再生' : '一時停止'); }
  function markSpeed() { $$('#speedBtns button').forEach((b) => b.classList.toggle('on', +b.dataset.s === S.speed)); const t = $('#sbPace'); if (t) t.textContent = `1年＝${YEAR_MS / S.speed / 1000}秒`; }
  // 人生の方針を考えるコマンド：押すと、次の年のはじめにその決断が出る（再開のため、押した年齢と内容を記録）
  const CMDS = [
    { id: 'shigoto', label: '💼 仕事を見直す', ok: (l) => l.job && l.indep },
    { id: 'cmd_shoku', label: '🔎 仕事を探す', ok: (l) => !l.job && l.edu.stage === 'work' && !l.retired && l.age >= 18 && l.age < 70 && !l.queue.some((x) => x.id === 'shushoku') },
    { id: 'sumai', label: '🏠 引っ越す', ok: (l) => l.indep && l.age >= 18, q: { why: 'move' } },
    { id: 'cmd_koi', label: '💕 恋人を探す', ok: (l) => l.age >= 18 && l.age < 70 && !(l.spouse && l.spouse.alive) && !l.flags.dating },
    { id: 'cmd_wakare', label: '💔 恋人と別れる', ok: (l) => !!l.flags.dating && !(l.spouse && l.spouse.alive) },
    { id: 'cmd_rikon', label: '📝 夫婦のこと', ok: (l) => l.spouse && l.spouse.alive },
    { id: 'nisa', label: '📈 お金を運用する', ok: (l) => l.indep && l.savings > 50 && l.age < 80 },
    { id: 'cmd_phone', key: 'phone_off', label: '📵 スマホ・LINEと距離をおく', ok: (l) => l.phone && !l.flags.noPhone && l.age >= 13 },
    { id: 'cmd_phone', key: 'phone_on', label: '📱 スマホ・LINEを再開する', ok: (l) => !!(l.flags.noPhone || l.flags.noLine), q: { mode: 'back' } }
  ];
  function pushCmd(l, c) { if (!l.queue.some((x) => x.id === c.id)) l.queue.push(Object.assign({ id: c.id }, c.q || {})); }
  // 方針のコマンドは「⋯」ボタンひとつにまとめ、押すとメニューから選ぶ
  function renderCmds(l) {
    const bar = $('#cmdBar'); if (!bar) return;
    const list = l.alive ? CMDS.filter((c) => c.ok(l)) : [];
    const pend = list.filter((c) => l.queue.some((x) => x.id === c.id)).length;
    if (!list.length) { bar.innerHTML = ''; return; }
    if (!bar.querySelector('.cmdmore')) bar.innerHTML = '<button type="button" class="profbtn cmdmore" aria-haspopup="menu" aria-expanded="false" title="これからの方針を考える">⋯<span class="cmdbadge"></span></button><div class="cmdmenu" role="menu" hidden></div>';
    bar.querySelector('.cmdbadge').textContent = pend ? pend : '';
    const menu = bar.querySelector('.cmdmenu');
    menu.innerHTML = '<p class="cmdhead">これからの方針</p>' + list.map((c) => { const p2 = l.queue.some((x) => x.id === c.id); return `<button type="button" role="menuitem" data-c="${c.key || c.id}"${p2 ? ' disabled' : ''}>${c.label}${p2 ? '<small>次の年のはじめに考えます</small>' : ''}</button>`; }).join('');
  }
  const closeCmd = () => { const m = $('#cmdBar .cmdmenu'), b = $('#cmdBar .cmdmore'); if (m) m.hidden = true; if (b) b.setAttribute('aria-expanded', 'false'); };
  $('#cmdBar').addEventListener('click', (e) => {
    const l = S.life; if (!l || !l.alive) return;
    if (e.target.closest('.cmdmore')) { const m = $('#cmdBar .cmdmenu'); m.hidden = !m.hidden; e.target.closest('.cmdmore').setAttribute('aria-expanded', String(!m.hidden)); SND.sfx('click'); return; }
    const b = e.target.closest('button[data-c]'); if (!b) return;
    const c = CMDS.find((x) => (x.key || x.id) === b.dataset.c); if (!c || !c.ok(l)) return;
    pushCmd(l, c); if (S.rec) { (S.rec.uq = S.rec.uq || []).push({ a: l.age, id: c.key || c.id }); save(); }
    SND.sfx('click'); renderCmds(l); closeCmd();
  });
  document.addEventListener('click', (e) => { if (!e.target.closest('#cmdBar')) closeCmd(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeCmd(); });
  // いまの自分のプロフィールを、さっと見る（開いている間は時間を止める）
  $('#btnProf').addEventListener('click', () => {
    const l = S.life; if (!l) return;
    renderFam();
    const src = $('#tab-fam'), pf = src.querySelector('.profile'), kv = src.querySelector('dl.kv');
    const was = S.paused; S.paused = true; clearTimeout(S.timer); setPlay();
    const ov = document.createElement('div'); ov.className = 'modal profpop'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-label', 'いまのプロフィール');
    ov.innerHTML = `<div class="sheet"><button type="button" class="mclose" aria-label="閉じる">×</button><p class="eyebrow">${$('#sbAge').textContent}歳・${$('#sbYear').textContent}のプロフィール</p>${pf ? pf.outerHTML : ''}<div class="stats ppstats">${$('#stats').innerHTML.replace(/<b class="[^"]*"/g, '<b')}</div><div class="money">${$('#money').innerHTML.replace(/ class="[^"]*"/g, '')}</div>${kv ? kv.outerHTML : ''}<p class="pphint small muted">家族・お金の詳しい内訳は、下の「家族と暮らし」タブで見られます。</p></div>`;
    document.body.appendChild(ov); SND.sfx('open');
    const close = () => { ov.remove(); document.removeEventListener('keydown', key); if (!was) { S.paused = false; setPlay(); schedule(); } };
    const key = (e) => { if (e.key === 'Escape') close(); };
    ov.addEventListener('click', (e) => { if (e.target === ov || e.target.classList.contains('mclose')) close(); });
    document.addEventListener('keydown', key);
  });
  $('#btnPlay').addEventListener('click', () => { S.paused = !S.paused; setPlay(); if (!S.paused) schedule(); else clearTimeout(S.timer); });
  $('#btnNext').addEventListener('click', () => { if (S.held) return unhold(); S.prog = 0; advance(true); });
  // 決断の保留：いったん閉じてプロフィールや速さを確かめてから答えられる
  function hold() {
    if ($('#modal').hidden) return;
    S.held = true; $('#modal').hidden = true;
    $('#heldTitle').textContent = $('#mTitle').textContent;
    $('#heldBar').hidden = false;
  }
  function unhold() { $('#heldBar').hidden = true; $('#modal').hidden = false; }
  function clearHold() { S.held = false; $('#heldBar').hidden = true; }
  $('#mHold').addEventListener('click', hold);
  $('#modal').addEventListener('click', (e) => { if (e.target.id === 'modal') hold(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('#modal').hidden) hold(); });
  $('#heldGo').addEventListener('click', unhold);
  $('#btnNote').addEventListener('click', () => { if (S.held) return unhold(); if (!S.life || !S.life.alive) return; const was = S.paused; S.paused = true; clearTimeout(S.timer); pauseBreath(`${S.life.age}歳。いまの気持ちは？`, nowOpts(S.life)); S.resumeAfterNote = !was; });
  $('#chkAuto').addEventListener('change', (e) => { S.auto = e.target.checked; if (S.rec) { S.rec.auto = S.auto; save(); } if (S.auto && S.held && S.autoHeld) { const f = S.autoHeld; clearHold(); $('#modal').hidden = true; f(); } });
  $$('.tab').forEach((t) => t.addEventListener('click', () => {
    $$('.tab').forEach((x) => x.classList.toggle('active', x === t));
    $$('.tabpane').forEach((p) => p.classList.toggle('active', p.id === 'tab-' + t.dataset.tab));
  }));

  function startLife(resumed) {
    const l = S.life;
    SND.init(); SND.setMood('child'); SND.bgm('child');
    S.pend = [];
    go('life');
    $('#feed').innerHTML = ''; S.logN = 0; S.group = null; S.lastAge = -1;
    S.paused = false; S.speed = (resumed && S.rec && S.rec.speed) || 4; S.prog = 0; markSpeed(); setPlay();
    sel.value = l.focus;
    flushLog();
    render();
    if (resumed) { S.paused = true; setPlay(); showPauseBig(); }
    schedule();
    // 保留していた問いがあれば、保留のまま再開する（帯の「答える」で開ける）
    if (resumed && S.resumeQs) {
      const q = S.resumeQs; S.resumeQs = null; S.pend = q.pend.slice();
      S.busy = true; runDecisions(q.left, afterDecisions);
      if (!$('#modal').hidden) hold();
    }
  }
  function stop() { clearTimeout(S.timer); S.paused = true; }
  function interval() { return YEAR_MS / S.speed; }
  // 時間の進むバー：止まっている間（一時停止・決断中・別の画面）は進まない
  S.prog = 0;
  function schedule() {
    if (S.raf) return;
    let last = performance.now();
    const loop = (now) => {
      const dt = Math.min(250, now - last); last = now;
      const l = S.life, run = l && l.alive && !S.paused && !S.busy && $('#modal').hidden && $('#life').classList.contains('active');
      if (run) {
        S.prog += dt / interval();
        if (S.yr && S.prog < 1) { const k = S.yr.from + 1 + Math.floor(S.prog * S.yr.n); if (k > S.logN && S.logN < l.log.length) flushLog(k); }
        if (S.prog >= 1) { S.prog = 0; advance(false); }
      }
      const f = $('#yearFill'); if (f) f.style.width = (S.prog * 100).toFixed(2) + '%';
      if (l) showDate(l);
      if (!l || !l.alive || !$('#life').classList.contains('active')) { S.raf = 0; return; }
      S.raf = requestAnimationFrame(loop);
    };
    S.raf = requestAnimationFrame(loop);
  }

  // いまの日付（誕生日から、年のメーターの進み具合で1日ずつ進む）・和暦・年代
  // 元号（江戸の元号は改元の年の1月から数える簡易版）
  const GENGO = [[2019, 4, 1, '令和'], [1989, 0, 8, '平成'], [1926, 11, 25, '昭和'], [1912, 6, 30, '大正'], [1868, 0, 25, '明治'], [1865, 0, 1, '慶応'], [1864, 0, 1, '元治'], [1861, 0, 1, '文久'], [1860, 0, 1, '万延'], [1854, 0, 1, '安政'], [1848, 0, 1, '嘉永'], [1844, 0, 1, '弘化'], [1830, 0, 1, '天保'], [1818, 0, 1, '文政']];
  const kyotsu = (y) => (y >= 2021 ? '大学入学共通テスト' : y >= 1990 ? '大学入試センター試験' : y >= 1979 ? '共通一次試験' : '大学入学試験');
  const wareki = (y) => gengo(new Date(y, 11, 31));
  function gengo(d) { for (const [y, m, dd, n] of GENGO) if (d >= new Date(y, m, dd)) { const k = d.getFullYear() - y + 1; return `${n}${k === 1 ? '元' : k}年`; } return ''; }
  function showDate(l) {
    const el = $('#sbDate'); if (!el || !l.born) return;
    const a = l.alive ? l.age - (S.yr ? 1 : 0) : l.deathAge, b = l.born;
    const d = new Date(b.y + a, b.m - 1, b.d + (l.alive ? Math.floor(S.prog * 365) : 0));
    const y = d.getFullYear(), m = d.getMonth() + 1, dd = d.getDate(), key = `${y}-${m}-${dd}`;
    if (el.dataset.k === key) return; el.dataset.k = key;
    const wa = gengo(d);
    document.body.dataset.tone = y < 1946 ? 'senji' : y < 1970 ? 'showa1' : y < 1990 ? 'showa2' : '';
    el.innerHTML = `<b>${y}年${m}月${dd}日</b>（${wa}・${'日月火水木金土'[d.getDay()]}）<span class="dec">${Math.floor(y / 10) * 10}年代</span>`;
  }
  function advance(manual) {
    const l = S.life;
    if (S.busy || !l || !$('#modal').hidden) return;
    if (!l.alive) return finish();
    if (S.yr) { flushLog(); render(); }
    S.busy = true;
    const decs = E.pendingDecisions(l);
    runDecisions(decs, afterDecisions);
  }
  function afterDecisions() {
    const l = S.life;
    {
      E.step(l);
      S.rec.choices.push(...S.pend); S.pend = []; S.rec.asking = false; S.rec.partial = null;
      if (l.alive) save(); else clearSave();
      // その年の出来事は、年のメーターが進むのに合わせて少しずつ出す（亡くなった年はすぐに全部）
      if (l.alive) { const yr = { from: S.logN, n: l.log.length - S.logN }; flushLog(S.logN + 1); S.yr = yr; } else flushLog();
      render();
      S.busy = false;
      if (!l.alive) { setTimeout(finish, 2200); return; }
      const breath = { 5: `5歳の${l.name.mei}に、いまいちばん必要なものは何でしょう？`, 15: '15歳のあなたにとって、学校はどんな場所でしたか？', 30: '30歳。あのとき別の道を選んでいたら、と思うことはありますか？', 50: '50歳。生まれた場所が違っていたら、何が変わっていたと思いますか？', 70: '70歳。選べなかったこと、選べたことは何でしたか？' }[l.age];
      if (breath && !S.auto) return pauseBreath(breath);
      schedule();
    }
  }

  function runDecisions(list, done) {
    if (!list.length) { const more = S.life.alive ? E.pendingDecisions(S.life) : []; if (!more.length) return done(); list = more; }
    const d = list.shift();
    if (S.auto || !S.life.alive) { S.pend.push(-1); E.resolve(S.life, d, E.autoChoice(S.life, d)); flushLog(); return runDecisions(list, done); }
    S.autoHeld = () => { S.autoHeld = null; phoneOff(); S.pend.push(-1); E.resolve(S.life, d, E.autoChoice(S.life, d)); flushLog(); render(); runDecisions(list, done); };
    if (S.rec) { S.rec.asking = true; S.rec.partial = S.pend.slice(); save(); }
    if (!d.phone && (d.doc || DEC_UI[d.id])) d.ui = d.doc ? { kind: d.doc.kind } : DEC_UI[d.id];
    (d.phone ? showPhone : d.ui ? showPaper : showModal)(d, (i) => { S.autoHeld = null; S.pend.push(i); const n0 = S.life.log.length; E.resolve(S.life, d, i); { const o = d.options.find((x) => x.i === i); const txt = S.life.log.slice(n0).map((x) => x.t).join(' '); S.pxChose = true; pxChoice(d, o && o.label, txt); flushLog(); render(); showResult(d, o, S.life.log.slice(n0), () => runDecisions(list, done)); } });
  }

  const HELP = '<div class="help"><b>つらい気持ちを抱えているときは</b>いのち SOS 0120-061-338（24時間）／よりそいホットライン 0120-279-338（24時間）／こころの健康相談統一ダイヤル 0570-064-556／チャット相談「あなたのいばしょ」</div>';
  const DEC_IL = { kyomi: 'sparkle', kyoka: 'study', yume: 'sparkle', naraigoto: 'swim', juken: 'exam', bukatsu: 'medal', juku: 'study', koukou: 'exam', shinro: 'graduation', ronin: 'study', baito_hs: 'baito', baito_u: 'baito', shumi: 'camera', osake: 'beer', pachinko: 'pachinko', gacha: 'gacha', sumaho: 'smartphone', yoru: 'night', ribo: 'credit-card', moukebanashi: 'warning', nisa: 'chart-up', takarakuji: 'lottery', uwaki: 'heartbreak', fukugyo: 'work', tabako: 'cigarette', shushoku: 'work', sumai: 'home', kekkon: 'ring', kodomo: 'stroller', ikukyu: 'family', ie: 'home', tenshoku: 'suit', kaigo: 'elder', teinen: 'cake', inkyo: 'garden', gan: 'ribbon', kokoro: 'sprout', menkyo: 'car' };
  function showModal(d, cb) {
    clearTimeout(S.timer); phoneOff();
    const l = S.life;
    $('#mAge').textContent = `${l.age}歳・${l.year}年`;
    $('#mTitle').innerHTML = `<span class="mil">${IL[DEC_IL[d.id]] || IL.arrow || ''}</span>${esc(d.title)}`;
    $('#mText').textContent = d.text;
    $('#mHelp').innerHTML = d.help ? HELP : '';
    const box = $('#mOpts'); box.innerHTML = '';
    const tot = d.options.reduce((a, o) => a + o.w, 0) || 1;
    d.options.forEach((o) => {
      const b = document.createElement('button');
      b.innerHTML = `${esc(o.label)}${o.hint ? `<small>${esc(o.hint)}</small>` : ''}`;
      b.addEventListener('click', () => { SND.sfx('click'); clearHold(); $('#modal').hidden = true; cb(o.i); });
      box.appendChild(b);
    });
    const top = d.options.slice().sort((a, b) => b.w - a.w)[0];
    $('#mNote').textContent = top ? `同じ状況の人の多くは「${top.label}」を選びます（約${Math.round(top.w / tot * 100)}%）。` : '';
    $('#modal').hidden = false; SND.sfx('open');
  }
  const KURO_SVG = '<svg viewBox="0 0 200 140" class="krsvg" aria-hidden="true"><ellipse cx="100" cy="128" rx="80" ry="8" fill="rgba(0,0,0,.25)"/><path d="M40 120 L58 62 Q100 48 142 62 L160 120 Z" fill="#1a1a1a"/><circle cx="100" cy="94" r="24" fill="#2b2b2b" stroke="#555" stroke-width="2"/><circle cx="100" cy="94" r="9" fill="#ddd"/>' + Array.from({ length: 10 }, (_, k) => { const a = (k * 30 + 200) * Math.PI / 180; return `<circle cx="${100 + Math.cos(a) * 17}" cy="${94 + Math.sin(a) * 17}" r="3.2" fill="#ddd"/>`; }).join('') + '<g class="krhand"><path d="M30 52 Q30 32 52 34 L148 34 Q170 32 170 52 L160 58 Q156 46 142 46 L58 46 Q44 46 40 58 Z" fill="#111"/><rect x="26" y="44" width="26" height="16" rx="6" fill="#111"/><rect x="148" y="44" width="26" height="16" rx="6" fill="#111"/></g><path d="M160 112 q20 10 10 24" stroke="#111" stroke-width="3" fill="none"/></svg>';
  const KORDLESS_SVG = '<svg viewBox="0 0 200 140" class="krsvg" aria-hidden="true"><ellipse cx="100" cy="128" rx="70" ry="7" fill="rgba(0,0,0,.2)"/><rect x="40" y="70" width="120" height="52" rx="10" fill="#e8e4da" stroke="#aaa"/><rect x="52" y="78" width="40" height="14" rx="2" fill="#9db58a"/>' + Array.from({ length: 12 }, (_, k) => `<rect x="${104 + (k % 3) * 16}" y="${78 + Math.floor(k / 3) * 10}" width="12" height="7" rx="2" fill="#fff" stroke="#bbb"/>`).join('') + '<g class="krhand"><rect x="40" y="26" width="120" height="30" rx="14" fill="#f2efe6" stroke="#aaa"/><rect x="58" y="34" width="30" height="12" rx="2" fill="#9db58a"/></g></svg>';
  // ---------- スマホ：着信画面とLINE風のトーク ----------
  const PH = { timers: [] };
  function phoneOff() { PH.timers.forEach(clearTimeout); PH.timers = []; clearInterval(PH.ring); clearInterval(PH.clock); $('#modal').classList.remove('phonemode', 'papermode'); const m = $('#mPhone'); if (m) m.innerHTML = ''; }
  const phLater = (ms, f) => PH.timers.push(setTimeout(f, ms));
  const hhmm = () => { const n = new Date(); return `${n.getHours()}:${String(n.getMinutes()).padStart(2, '0')}`; };
  function phAvatar(name) { const c = ['#e8a87c', '#85c1a8', '#9bb7e0', '#d9a3c7', '#c9b46b'][[...name].reduce((a, ch) => a + ch.charCodeAt(0), 0) % 5]; const ch = /^[0-9０-９〇△□+]/.test(name) ? '👤' : [...name.replace(/[（(].*$/, '')][0] || '?'; return `<span class="phav" style="background:${c}">${esc(ch)}</span>`; }
  const deEmoji = (t) => (typeof t !== 'string' ? t : t.replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\uFE0F\u200D]/gu, '').replace(/[（(][^（）()]{0,8}[＾^_;´`ω∀・▽＿][^（）()]{0,8}[）)]/g, '').replace(/[（(](笑|汗|泣)[）)]/g, '').replace(/(笑|ｗ+|w{2,})(?=[。！？!?\s」]|$)/g, '').replace(/\s{2,}/g, ' ').trim());
  function showPhone(d, cb) {
    clearTimeout(S.timer); phoneOff();
    const l = S.life, M = $('#modal'), box = $('#mPhone');
    let P = d.phone, xcls = '';
    // 手紙・黒電話・ポケベル・軍事郵便の時代に、絵文字や顔文字、「笑」は出さない
    PH.retro = /^(letter|telegram|gunji|kuro|pager|hikyaku)$/.test(P.kind);
    if (PH.retro && P.msgs) P = Object.assign({}, P, { msgs: P.msgs.map(deEmoji).filter(Boolean) });
    if (P.kind === 'call' && P.kuro) xcls = ' kuro';
    M.classList.add('phonemode');
    const top = `<div class="phtop"><span>${hhmm()}</span><span class="phage">${l.age}歳・${l.year}年</span><span>▮▮▮ 🔋</span></div>`;
    const opts = d.options.filter((o) => !o.decline), dec = d.options.find((o) => o.decline);
    const pick = (o) => { if (PH.done) return; PH.done = true; SND.sfx(o.decline ? 'click' : 'send'); clearInterval(PH.ring); clearHold(); cb(o.i); };
    PH.done = false;
    const chips = (wrap) => { wrap.innerHTML = opts.map((o) => `<button data-i="${o.i}">${esc(o.label)}${o.hint ? `<small>${esc(o.hint)}</small>` : ''}</button>`).join(''); wrap.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => pick(d.options.find((o) => o.i === +b.dataset.i)))); wrap.hidden = false; };
    // 相手の言葉を1つずつ（入力中…のあとに）出す
    const root0 = () => box.firstElementChild;
    const talk = (list, msgs, done, line) => {
      let t = 300;
      msgs.forEach((m, k) => {
        if (line) phLater(t, () => { list.insertAdjacentHTML('beforeend', '<div class="bub them typing"><i></i><i></i><i></i></div>'); list.scrollTop = list.scrollHeight; });
        t += P.fast ? 280 + m.length * 12 : Math.min(1500, 500 + m.length * 28);
        phLater(t, () => { const ty = list.querySelector('.typing'); if (ty) ty.remove();
          if (/^📞/.test(m)) list.insertAdjacentHTML('beforeend', `<div class="phsys miss">${esc(m)}　${hhmm()}</div>`);
          else list.insertAdjacentHTML('beforeend', `<div class="bub them">${line && k === 0 ? phAvatar(P.from) : ''}<span>${esc(m)}</span>${line ? `<time>${hhmm()}</time>` : ''}</div>`);
          list.scrollTop = list.scrollHeight; if (line) { SND.sfx(/^📞/.test(m) ? 'ring' : 'msg'); const bd = root0().querySelector('.lnbadge'); if (bd) { bd.textContent = (+bd.textContent || 0) + 1; } if (P.fast && navigator.vibrate) try { navigator.vibrate(60); } catch (e) { } } });
        t += P.fast ? 120 : 250;
      });
      phLater(t + 200, done);
    };
    // ---- 黒電話（家の電話）：ジリリリンと鳴り、受話器をとって話す ----
    if (P.kind === 'kuro') {
      const cord = P.cordless;
      const yobi = P.yobi, me = S.life ? S.life.name.sei : '';
      box.innerHTML = `<div class="ph retro kurowrap${cord ? ' cordless' : ''}${yobi ? ' yobi' : ''}">${yobi ? `<p class="ybcall">「${esc(me)}さーん、<br>お電話ですよー！」</p>` : ''}<div class="krscene ringing">${cord ? KORDLESS_SVG : KURO_SVG}<span class="krring">${yobi ? 'おーい！' : 'ジリリリン！'}</span></div>
        <div class="krwho"><span class="phst">${yobi ? '呼び出し電話' : cord ? 'プルルルル…' : 'ジリリリン…ジリリリン…'}</span><small>${yobi ? '家に電話がないので、近所のたばこ屋さんが呼びに来てくれました' : `${cord ? '家の電話（子機）' : '家の黒電話'}が鳴っています`}</small></div>
        <div class="phlist krlist" hidden></div><div class="phopts" hidden></div>
        <div class="phbtns">${dec ? `<button class="phno">${yobi ? '行かない' : '出ない'}</button>` : ''}<button class="phyes krpick">${yobi ? '走って行く' : '受話器をとる'}</button></div></div>`;
      const root = box.firstElementChild;
      SND.sfx('ring'); let rings = 0; PH.ring = setInterval(() => { if (++rings > 8 || $('#modal').hidden) return clearInterval(PH.ring); SND.sfx('ring'); }, 1300);
      if (dec) root.querySelector('.phno').addEventListener('click', () => pick(dec));
      root.querySelector('.phyes').addEventListener('click', () => {
        clearInterval(PH.ring); SND.sfx('click'); root.querySelector('.krscene').classList.remove('ringing'); root.querySelector('.krscene').classList.add('lifted'); root.querySelector('.phbtns').remove();
        root.querySelector('.krwho small').textContent = `相手：${P.from}${yobi ? '（たばこ屋の店先で）' : ''}`; const yc = root.querySelector('.ybcall'); if (yc) yc.remove(); const st = root.querySelector('.phst'); st.textContent = 'もしもし…';
        const list = root.querySelector('.phlist'); list.hidden = false;
        talk(list, P.msgs, () => chips(root.querySelector('.phopts')), false);
      });
      M.hidden = false; return;
    }
    // ---- ポケベル：数字の語呂合わせが届き、公衆電話から返事を打つ ----
    if (P.kind === 'pager') {
      box.innerHTML = `<div class="ph retro line pagerwrap"><div class="pgdev"><div class="pglcd"><span class="pgnum">　</span></div><div class="pglabel">POCKET BELL</div><div class="pgbtn"></div></div>
        <p class="pgfrom">${esc(P.from)}からのメッセージ（たぶん）</p><div class="phlist pglist"></div><div class="phopts" hidden></div></div>`;
      const root = box.firstElementChild, list = root.querySelector('.phlist'), lcd = root.querySelector('.pgnum');
      (P.codes || []).forEach(([code, mean], k) => phLater(500 + k * 1300, () => { SND.sfx('send'); setTimeout(() => SND.sfx('send'), 150); setTimeout(() => SND.sfx('send'), 300); lcd.textContent = code; root.querySelector('.pgdev').classList.remove('buzz'); void root.offsetWidth; root.querySelector('.pgdev').classList.add('buzz'); list.insertAdjacentHTML('beforeend', `<div class="bub them pgmsg"><span><b>${esc(code)}</b><small>＝${esc(mean)}</small></span></div>`); list.scrollTop = list.scrollHeight; }));
      phLater(800 + (P.codes || []).length * 1300, () => chips(root.querySelector('.phopts')));
      M.hidden = false; return;
    }
    // ---- ホログラム通話（2040年代〜）：相手が立体で浮かび上がる ----
    if (P.kind === 'holo') {
      const sx = /母|妻|娘|祖母|おばあ|彼女/.test(P.from) ? 'F' : 'M';
      const fig = pixelChar({ age: 40, sex: sx, alive: true, stats: { happy: 70, health: 70, know: 40 }, edu: { stage: 'work' }, job: null, flags: {}, year: 2050 });
      box.innerHTML = `<div class="ph retro holowrap"><div class="hlstage ringing"><div class="hlfig">${fig}</div><div class="hlbeam"></div><div class="hlbase"></div></div>
        <div class="hlwho"><b>${esc(P.from)}</b><span class="phst">ホログラム通話の着信</span></div><div class="phlist hllist" hidden></div><div class="phopts" hidden></div>
        <div class="phbtns">${dec ? '<button class="phno">拒否</button>' : ''}<button class="phyes">投影する</button></div></div>`;
      const root = box.firstElementChild, list = root.querySelector('.phlist');
      SND.sfx('ring'); let rings = 0; PH.ring = setInterval(() => { if (++rings > 6 || $('#modal').hidden) return clearInterval(PH.ring); SND.sfx('ring'); }, 1600);
      if (dec) root.querySelector('.phno').addEventListener('click', () => pick(dec));
      root.querySelector('.phyes').addEventListener('click', () => { clearInterval(PH.ring); SND.sfx('click'); root.querySelector('.phbtns').remove(); const sg = root.querySelector('.hlstage'); sg.classList.remove('ringing'); sg.classList.add('on'); root.querySelector('.hlwho .phst').textContent = '投影中'; list.hidden = false; talk(list, P.msgs, () => chips(root.querySelector('.phopts')), false); });
      M.hidden = false; return;
    }
    // ---- ニューロリンク（2050〜70年代〜）：ことばが頭の中に直接ひびく ----
    if (P.kind === 'neuro') {
      box.innerHTML = `<div class="ph retro neurowrap"><div class="nrwave"><i></i><i></i><i></i><span class="nrcore"></span></div>
        <div class="nrwho"><small>NEURO LINK ${P.voice ? '・思念通話' : '・受信'}</small><b>${esc(P.from)}</b></div><div class="phlist nrlist"></div><div class="phopts" hidden></div></div>`;
      const root = box.firstElementChild, list = root.querySelector('.phlist');
      SND.sfx('msg');
      (P.msgs || []).forEach((m, k) => phLater(600 + k * 1000, () => { list.insertAdjacentHTML('beforeend', `<div class="bub them"><span>${esc(m)}</span></div>`); list.scrollTop = list.scrollHeight; }));
      phLater(800 + (P.msgs || []).length * 1000, () => chips(root.querySelector('.phopts')));
      M.hidden = false; return;
    }
    // ---- ガラケー：折りたたみ携帯の小さな画面 ----
    if (P.kind === 'gara' || P.kind === 'garacall') {
      const call = P.kind === 'garacall', now = hhmm();
      box.innerHTML = `<div class="ph retro garawrap${call ? '' : ' line'}"><div class="gphone"><div class="gtop"><div class="gspeaker"></div><div class="gscreen"><div class="gbar"><span>▂▄▆</span><span>${now}</span><span>▮▮▯</span></div>
        <div class="ghead">${P.phs ? (call ? 'PHS 着信' : 'Pメール受信') : call ? '着信' : '受信メール'}</div>
        ${call ? `<div class="gcall"><b>${esc(P.from)}</b><small>${esc(P.num || '携帯')}</small><span class="phst">♪♪♪ 着信中</span></div>` : `<div class="gmeta">From: ${esc(P.from)}<br>Sub: ${esc((P.msgs[0] || '').slice(0, 10))}</div>`}
        <div class="phlist glist"${call ? ' hidden' : ''}></div></div></div><div class="ghinge"></div><div class="gbottom"><div class="gkeys">${['1', '2', '3', '4', '5', '6', '7', '8', '9', '＊', '0', '#'].map((k) => `<i>${k}</i>`).join('')}</div></div></div>
        <div class="phopts" hidden></div>${call ? `<div class="phbtns">${dec ? '<button class="phno">終話</button>' : ''}<button class="phyes">通話</button></div>` : ''}</div>`;
      const root = box.firstElementChild, list = root.querySelector('.phlist');
      if (call) {
        SND.sfx('ring'); let rings = 0; PH.ring = setInterval(() => { if (++rings > 8 || $('#modal').hidden) return clearInterval(PH.ring); SND.sfx('ring'); }, 1500);
        if (dec) root.querySelector('.phno').addEventListener('click', () => pick(dec));
        root.querySelector('.phyes').addEventListener('click', () => { clearInterval(PH.ring); SND.sfx('click'); root.querySelector('.phbtns').remove(); root.querySelector('.gcall .phst').textContent = '通話中 00:00'; let sec = 0; const st = root.querySelector('.gcall .phst'); PH.clock = setInterval(() => { sec++; st.textContent = `通話中 ${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`; }, 1000); list.hidden = false; talk(list, P.msgs, () => chips(root.querySelector('.phopts')), false); });
      } else {
        SND.sfx('msg'); (P.msgs || []).forEach((m, k) => phLater(400 + k * 700, () => { list.insertAdjacentHTML('beforeend', `<div class="bub them"><span>${esc(m)}</span></div>`); list.scrollTop = list.scrollHeight; }));
        phLater(600 + (P.msgs || []).length * 700, () => chips(root.querySelector('.phopts')));
      }
      M.hidden = false; return;
    }
    if (P.kind === 'letter' || P.kind === 'telegram' || P.kind === 'gunji') {
      const tg = P.kind === 'telegram', gj = P.kind === 'gunji';
      box.innerHTML = `<div class="ph line letterwrap${tg ? ' tgwrap' : ''}${gj ? ' gunji' : ''}${P.fude ? ' fude' : ''}"><div class="ltpaper">${tg ? '<div class="tghead">電　報</div>' : gj ? `<div class="gjhead"><b>軍事郵便</b><span class="gjstamp">検閲済</span></div><div class="lthead">${P.dir === 'front' ? `戦地の${esc(P.from)}より` : `${esc(P.from)}より`}</div>` : `<div class="lthead">${esc(P.from)}より</div>`}<div class="phlist ltlist"></div></div><div class="phopts lnopts" hidden></div></div>`;
      const root = box.firstElementChild, list = root.querySelector('.phlist');
      SND.sfx(tg ? 'alarm' : 'msg');
      (P.msgs || []).forEach((m, k) => phLater(500 + k * (tg ? 400 : 900), () => { list.insertAdjacentHTML('beforeend', `<div class="bub them"><span>${esc(m).replace(/■+/g, (x) => `<i class="cen">${x}</i>`)}</span></div>`); list.scrollTop = list.scrollHeight; }));
      phLater(700 + (P.msgs || []).length * (tg ? 400 : 900), () => chips(root.querySelector('.phopts')));
      M.hidden = false; return;
    }
    if (P.kind === 'mail') {
      box.innerHTML = `<div class="ph mailapp">${top}<div class="mlhead"><b>受信トレイ</b><span>${(P.mails || []).length}件の新着</span></div><div class="phlist mllist"></div><div class="phopts lnopts" hidden></div></div>`;
      const root = box.firstElementChild, list = root.querySelector('.phlist');
      (P.mails || []).forEach((m, k) => phLater(400 + k * 650, () => { list.insertAdjacentHTML('beforeend', `<div class="mlitem${/お祈り|ご期待に添いかね/.test(m.body) ? ' inori' : ''}"><span class="mlfrom">${esc(m.from)}</span><b>${esc(m.subj)}</b><p>${esc(m.body)}</p></div>`); list.scrollTop = list.scrollHeight; SND.sfx('msg'); }));
      phLater(600 + (P.mails || []).length * 650, () => chips(root.querySelector('.phopts')));
      M.hidden = false; return;
    }
    if (P.kind === 'alert') {
      box.innerHTML = `<div class="ph alert ringing">${top}
        <div class="alhead"><b>${esc(P.msgs[0] || P.from)}</b>${P.from !== P.msgs[0] ? `<small>${esc(P.from)}</small>` : ''}<small>${l.year}年 ${hhmm()}</small></div>
        <div class="phlist">${P.msgs.slice(1).map((m) => `<div class="almsg">${esc(m)}</div>`).join('')}</div><div class="phopts alopts" hidden></div></div>`;
      const root = box.firstElementChild;
      SND.sfx('alarm'); let n = 0; PH.ring = setInterval(() => { if (++n > 3 || $('#modal').hidden) return clearInterval(PH.ring); SND.sfx('alarm'); }, 1900);
      if (navigator.vibrate) try { navigator.vibrate([600, 200, 600, 200, 600]); } catch (e) { }
      phLater(1600, () => { root.classList.remove('ringing'); chips(root.querySelector('.phopts')); });
      M.hidden = false; return;
    }
    if (P.kind === 'call') {
      box.innerHTML = `<div class="ph call${P.video ? ' video' : ''}${xcls}">${top}
        <div class="phwho">${phAvatar(P.from)}<b>${esc(P.from)}</b><small>${esc(P.num || '')}</small><span class="phst">${P.video ? 'ビデオ通話の着信' : P.kuro ? 'ジリリリン…ジリリリン…' : '着信中…'}</span></div>
        <div class="phlist" hidden></div><div class="phopts" hidden></div>
        <div class="phbtns">${dec ? '<button class="phno" aria-label="拒否">✕<small>拒否</small></button>' : ''}<button class="phyes" aria-label="応答">✆<small>応答</small></button></div></div>`;
      const root = box.firstElementChild;
      SND.sfx('ring'); let rings = 0; PH.ring = setInterval(() => { if (++rings > 10 || $('#modal').hidden) return clearInterval(PH.ring); SND.sfx('ring'); }, 1600); if (navigator.vibrate) try { navigator.vibrate([400, 200, 400]); } catch (e) { }
      if (dec) root.querySelector('.phno').addEventListener('click', () => { root.classList.remove('ringing'); pick(dec); });
      root.classList.add('ringing');
      root.querySelector('.phyes').addEventListener('click', () => {
        clearInterval(PH.ring); SND.sfx('click'); root.classList.remove('ringing'); root.classList.add('talking');
        root.querySelector('.phbtns').remove();
        const st = root.querySelector('.phst'); let sec = 0; st.textContent = '00:00'; PH.clock = setInterval(() => { sec++; st.textContent = `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`; }, 1000);
        const list = root.querySelector('.phlist'); list.hidden = false;
        talk(list, P.msgs, () => chips(root.querySelector('.phopts')), false);
      });
    } else {
      box.innerHTML = `<div class="ph line${xcls}">${top}
        <div class="lnbanner"><b>${xcls ? '✉ メール' : 'LINE'}</b><span><em>${esc(P.from)}</em>${esc(P.msgs[0] || '')}</span></div>
        <div class="lnhead"><span>‹ <i class="lnbadge"></i></span><b>${esc(P.from)}</b><span>☰</span></div>
        <div class="phlist"></div><div class="phopts lnopts" hidden></div></div>`;
      const root = box.firstElementChild, list = root.querySelector('.phlist');
      SND.sfx('msg'); if (navigator.vibrate) try { navigator.vibrate(200); } catch (e) { }
      const open = () => { if (root.classList.contains('open')) return; root.classList.add('open'); (P.mine || []).forEach((m) => list.insertAdjacentHTML('beforeend', `<div class="bub me"><span>${esc(m)}</span><time>既読 ${hhmm()}</time></div>`)); talk(list, P.msgs, () => chips(root.querySelector('.phopts')), true); };
      root.querySelector('.lnbanner').addEventListener('click', open);
      phLater(1400, open);
    }
    M.hidden = false;
  }
  function phoneResult(d, o, logs, go2) {
    const root = $('#mPhone .ph'), list = root.querySelector('.phlist'), opts = root.querySelector('.phopts'), line = root.classList.contains('line');
    S.autoHeld = go2;
    if (opts) opts.hidden = true;
    const res = logs.filter((x) => x.c !== 'note' && x.c !== 'chapter').map((x) => `<p>${esc(x.t)}</p>`).join('');
    const end = () => { clearInterval(PH.clock); const bt = document.createElement('button'); bt.className = 'phend'; bt.textContent = !res ? '続ける ▸' : line ? '閉じる ▸' : '次へ ▸'; bt.addEventListener('click', () => { SND.sfx('click'); go2(); }); (root.querySelector('.phres') || list.lastElementChild || list).after(bt); setTimeout(() => { list.style.scrollBehavior = 'auto'; list.scrollTop = list.scrollHeight; }, 50); };
    const show = () => { if (res) list.insertAdjacentHTML('beforeend', `<div class="phres"><span class="lbl">${esc(qlab(o.label))}を選んだ結果</span>${res}</div>`); list.hidden = false; list.scrollTop = list.scrollHeight; end(); list.scrollTop = list.scrollHeight; };
    if (o.decline) { root.classList.remove('ringing'); const st = root.querySelector('.phst'); if (st) st.textContent = '不在着信'; const b = root.querySelector('.phbtns'); if (b) b.remove(); return phLater(500, show); }
    if (root.classList.contains('alert')) { phLater(300, show); return; }
    if (o.say && (!PH.retro || deEmoji(o.say))) { list.insertAdjacentHTML('beforeend', `<div class="bub me"><span>${esc(PH.retro ? deEmoji(o.say) : o.say)}</span>${line ? `<time>既読 ${hhmm()}</time>` : ''}</div>`); list.scrollTop = list.scrollHeight; }
    else if (/既読|スルー|放って|返事ができない|言えな/.test(o.label)) list.insertAdjacentHTML('beforeend', `<div class="phsys">${line ? '（既読のまま、返信しなかった）' : '（何も言えなかった）'}</div>`);
    // 相手からの返信（入力中… のあとに届く）
    const re = ((S.life && S.life.lastRe) || []).map((m) => (PH.retro ? deEmoji(m) : m)).filter(Boolean);
    let t = 900;
    re.forEach((m) => {
      if (line) phLater(t, () => { list.insertAdjacentHTML('beforeend', '<div class="bub them typing"><i></i><i></i><i></i></div>'); list.scrollTop = list.scrollHeight; });
      t += Math.min(1400, 450 + m.length * 25);
      phLater(t, () => { const ty = list.querySelector('.typing'); if (ty) ty.remove();
        if (/^（.*）$/.test(m) && !/^（(母|父)）/.test(m)) list.insertAdjacentHTML('beforeend', `<div class="phsys">${esc(m.replace(/^（|）$/g, ''))}</div>`);
        else list.insertAdjacentHTML('beforeend', `<div class="bub them"><span>${esc(m)}</span>${line ? `<time>${hhmm()}</time>` : ''}</div>`);
        list.scrollTop = list.scrollHeight; if (line) SND.sfx('msg'); });
      t += 200;
    });
    phLater(t + (re.length ? 700 : 0), () => { if (!line) { const st = root.querySelector('.phst'); if (st) st.textContent = '通話終了'; clearInterval(PH.clock); } show(); });
  }
  const qlab = (t) => (/^「.*」$/.test(t) ? t : `「${t}」`);
  // ---------- 試験（共通テスト風マークシート）と、重要な書類への署名 ----------
  const DEC_UI = {
    juken: { kind: 'exam', head: (l) => `${wareki(l.year)}度　中学校入学者選抜`, sub: '進路希望調査' },
    koukou: { kind: 'exam', head: (l) => `${wareki(l.year)}度　${l.pref}公立高等学校入学者選抜`, sub: '志願校' },
    shinro: { kind: 'exam', head: (l) => `${wareki(l.year)}度　${kyotsu(l.year)}`, sub: '出願' },
    ronin: { kind: 'exam', head: (l) => `${wareki(l.year)}度　${kyotsu(l.year)}`, sub: '出願（再受験）' },
    kekkon: { kind: 'sign', doc: '婚 姻 届', terms: (l) => [`届出人　${l.name.sei} ${l.name.mei}`, '婚姻後の夫婦の氏　□夫の氏　□妻の氏', '同居を始めたとき　　年　　月', '証人　2名（18歳以上）'] },
    ie: { kind: 'sign', doc: '不動産売買契約書', terms: (l) => ['売買代金　金〇〇〇〇万円也', '手付金　売買代金の5%', '住宅ローン　35年・変動金利', `引渡日　${wareki(l.year).replace(/\d+|元/, '〇')}〇月〇日`] },
    sumai: { kind: 'sign', doc: '建物賃貸借契約書', terms: () => ['契約期間　2年（更新あり）', '敷金　家賃1か月分　礼金　家賃1か月分', '更新料　家賃1か月分', '原状回復　国土交通省ガイドラインによる'] },
    shushoku: { kind: 'sign', doc: '内定承諾書', terms: (l) => [`貴社からの採用内定を承諾し、入社することを誓約いたします。`, '入社予定日　4月1日', '試用期間　3か月', `氏名　${l.name.sei} ${l.name.mei}`] },
    tenshoku: { kind: 'sign', doc: '雇用契約書', terms: () => ['契約期間　期間の定めなし', '就業場所　本社および会社の定める場所', '賃金　月給制（年俸の1/12）', '退職に関する事項　就業規則による'] },
    ribo: { kind: 'sign', doc: 'クレジットカード入会申込書', terms: () => ['お支払い方法　□一括払い　□リボルビング払い', 'リボ払い手数料率　実質年率15.0%', '利用可能枠　ショッピング50万円', '個人情報の取扱いに同意します'] },
    nisa: { kind: 'sign', doc: 'NISA口座開設申込書', terms: () => ['つみたて投資枠　年間120万円', '成長投資枠　年間240万円', '非課税保有限度額　1,800万円', '元本は保証されません'] },
    kigyo: { kind: 'sign', doc: '個人事業の開業届出書', terms: (l) => ['事業の概要', `開業日　${wareki(l.year).replace(/\d+|元/, '〇')}〇月〇日`, '青色申告承認申請　□有　□無', '提出先　〇〇税務署長'] },
    fukugyo: { kind: 'sign', doc: '副業・兼業 届出書', terms: () => ['副業の内容', '1週間の就業時間　〇時間', '本業への影響がないことを誓約します', '会社の許可を得ること'] },
    yuigon: { kind: 'sign', doc: '遺　言　書', terms: () => ['自筆証書遺言', '全文・日付・氏名を自書し、押印すること', '法務局で保管できます（自筆証書遺言書保管制度）', '遺言執行者の指定'] },
    inkyo_sumai: { kind: 'sign', doc: '入居契約書', terms: () => ['入居一時金', '月額利用料（家賃・管理費・食費）', '介護サービスは別途契約', '契約の解除と返還金'] },
    yoshi: { kind: 'sign', doc: '養子縁組届', terms: () => ['養親になる人', '養子になる人', '家庭裁判所の審判（特別養子縁組）', '証人　2名'] },
    senkyo: { kind: 'sign', doc: '立候補届出書', terms: () => ['選挙の種類　市議会議員選挙', '供託金　30万円', '所属党派　無所属', '選挙運動費用収支報告書の提出'] },
    rikon: { kind: 'sign', doc: '離 婚 届', terms: (l) => [`届出人　${l.name.sei} ${l.name.mei}`, `未成年の子の親権者　${(l.kids || []).some((k) => k.alive && l.year - k.by < 18) ? '□夫が親権を行う子　□妻が親権を行う子' : '（該当なし）'}`, '財産分与・養育費の取り決め　□あり　□なし', '証人　2名（協議離婚の場合）'] },
    yameru: { kind: 'sign', doc: '退 職 届', terms: (l) => ['このたび、一身上の都合により、', `${wareki(l.year)}　月　日をもって退職いたします。`, `所属　${(l.job && l.job.title) || ''}`, '代表取締役社長　殿'] },
    intai: { kind: 'sign', doc: '退 職 届', terms: (l) => ['このたび、一身上の都合により、', `${wareki(l.year)}　月　日をもって退職いたします。`, '長い間、大変お世話になりました。', `${l.age}歳`] },
    sumai: { kind: 'madori' },
    akagami: { kind: 'akagami' },
    myoji: { kind: 'sign', doc: '養子縁組届', terms: (l, q) => [`養子になる人　${l.name.sei} ${l.name.mei}（${l.age}歳）`, '養親になる人　（母の再婚相手）', '15歳未満の場合は、法定代理人（親権者）が届け出ます', '縁組後の氏　□養親の氏　□従前の氏'] },
    teinen: { kind: 'sign', doc: '継続雇用（再雇用）契約書', terms: () => ['雇用形態　嘱託社員（1年ごとの更新）', '雇用期間　65歳まで', '賃金　定年前のおよそ6〜7割', '高年齢雇用継続給付'] }
  };
  const NO_SIGN = /しない|やめ|断|見送|まだ|今は|のまま|だけにする|書かない|出ない|預金|賃貸|ほかの道|就職しない|辞退|やり直|争う|眺める|決めてから|がんば|続ける/;
  function showPaper(d, cb) {
    clearTimeout(S.timer); phoneOff();
    const l = S.life, U = d.ui, M = $('#modal'), box = $('#mPhone');
    M.classList.add('papermode');
    const pick = (o, el) => {
      if (PH.done) return; PH.done = true; clearHold(); SND.sfx('click'); (box.querySelector('.paper') || box.firstElementChild).classList.add('picked'); el.classList.add('sel');
      if (U.kind === 'exam') { el.querySelector('.ov').classList.add('on'); phLater(650, () => cb(o.i)); return; }
      if (U.kind !== 'sign') { phLater(U.kind === 'match' ? 900 : 350, () => cb(o.i)); return; }
      const paper = box.querySelector('.paper');
      if (NO_SIGN.test(o.label)) { paper.classList.add('declined'); phLater(900, () => cb(o.i)); return; }
      paper.querySelector('.sig').classList.add('on'); phLater(1100, () => { paper.querySelector('.hanko').classList.add('on'); SND.sfx('land'); }); phLater(1900, () => cb(o.i));
    };
    PH.done = false;
    const num = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨'];
    if (U.kind === 'exam') {
      const no = String(10000 + Math.floor(Math.random() * 89999)); box.dataset.no = no;
      box.innerHTML = `<div class="paper exam"><div class="exhead"><span>${esc(U.head(l))}</span><b>${esc(U.sub)}</b></div>
        <div class="exid"><span>受験番号<b>${no}</b></span><span>氏名<b>${esc(l.name.sei)} ${esc(l.name.mei)}</b></span><span class="extime">試験時間 残り <b>60:00</b></span></div>
        <p class="exq"><b>第1問</b>　${esc(d.text)}</p>
        <p class="exq2">問　あなたの選択として最も適当なものを、次の${num[0]}〜${num[d.options.length - 1]}のうちから一つ選べ。</p>
        <ol class="exopts">${d.options.map((o, k) => `<li><button data-i="${o.i}"><span class="ov">${k + 1}</span><span class="tx">${num[k]}　${esc(o.label)}${o.hint ? `<small>${esc(o.hint)}</small>` : ''}</span></button></li>`).join('')}</ol>
        <p class="exnote">※ 解答は、解答用紙のマーク欄を黒く塗りつぶしなさい。</p></div>`;
      let t = 3600; PH.clock = setInterval(() => { t--; const e = box.querySelector('.extime b'); if (e) e.textContent = `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`; }, 1000);
    } else if (U.kind === 'kenshin') {
      const rows = d.doc.rows, worst = rows.reduce((w, x) => (x[2] > w ? x[2] : w), 'A');
      const JL = { A: '異常なし', B: '軽度異常', C: '要経過観察', D: '要再検査・要精密検査', E: '要治療' };
      box.innerHTML = `<div class="paper kenshin"><div class="kshead"><b>健康診断 結果報告書</b><span>受診日　${wareki(l.year)}　${l.r ? '' : ''}${1 + Math.floor(Math.random() * 12)}月　／　${esc(l.name.sei)} ${esc(l.name.mei)} 様（${l.age}歳・${l.sex === 'M' ? '男' : '女'}）</span></div>
        <table class="kstbl"><tr><th>検査項目</th><th>結果</th><th>判定</th></tr>${rows.map((x) => `<tr><td>${esc(x[0])}</td><td>${esc(x[1])}</td><td><span class="jd j${x[2]}">${x[2]}</span></td></tr>`).join('')}</table>
        <div class="kssum">総合判定 <span class="jd big j${worst}">${worst}</span><small>${JL[worst]}</small></div>
        <p class="kslegend">A 異常なし　B 軽度異常　C 要経過観察　D 要再検査・精密検査　E 要治療</p>
        <div class="popts">${d.options.map((o) => `<button data-i="${o.i}">${esc(o.label)}${o.hint ? `<small>${esc(o.hint)}</small>` : ''}</button>`).join('')}</div></div>`;
    } else if (U.kind === 'payslip') {
      const P = d.doc.p, y = (v) => `${Math.round(v).toLocaleString()}円`, yr = P.mode === 'year';
      const rows = yr ? [['支払金額', P.gross], ['給与所得控除', P.kyuyoKojo], ['社会保険料等の金額', P.shaho], ['源泉徴収税額（所得税）', P.shotoku], ['住民税（年額）', P.jumin]]
        : [['基本給', P.base], ['諸手当', P.teate], ['総支給額', P.gross]];
      const ded = yr ? [] : [['健康保険', P.kenpo], ...(P.kaigo ? [['介護保険', P.kaigo]] : []), ['厚生年金', P.nenkin], ['雇用保険', P.koyo], ['所得税', P.shotoku], ['住民税', P.jumin]];
      box.innerHTML = `<div class="paper payslip"><div class="pshead"><b>${esc(d.doc.title)}</b><span>${yr ? `${wareki(l.year)}分` : `${wareki(l.year)}4月分`}　${esc(l.name.sei)} ${esc(l.name.mei)} 殿</span><span>${esc((l.job && l.job.title) || '')}</span></div>
        <div class="psgrid"><div><h4>${yr ? '内訳' : '支給'}</h4>${rows.map(([k, v]) => `<p><span>${k}</span><b>${y(v)}</b></p>`).join('')}</div>${ded.length ? `<div><h4>控除</h4>${ded.map(([k, v]) => `<p><span>${k}</span><b>${y(v)}</b></p>`).join('')}<p class="tot"><span>控除合計</span><b>${y(ded.reduce((t, x) => t + x[1], 0))}</b></p></div>` : ''}</div>
        <div class="psnet"><span>${yr ? '手取り（年額の目安）' : '差引支給額（手取り）'}</span><b>${y(P.net)}</b><small>額面の約${Math.round(P.net / Math.max(1, P.gross) * 100)}%</small></div>
        ${!yr && !P.jumin ? '<p class="kslegend">※ 住民税は前年の所得にかかるため、2年目の6月から引かれ始めます。</p>' : ''}
        <div class="popts">${d.options.map((o) => `<button data-i="${o.i}">${esc(o.label)}${o.hint ? `<small>${esc(o.hint)}</small>` : ''}</button>`).join('')}</div></div>`;
    } else if (U.kind === 'akagami') {
      box.innerHTML = `<div class="paper akagami"><div class="akhead">臨時召集令状</div><div class="akbody"><p>${esc(l.pref)}${esc(l.city)}</p><p class="akname">${esc(l.name.sei)} ${esc(l.name.mei)}</p><p>右臨時召集ヲ令セラル依テ左記日時到着地ニ参着シ此ノ令状ヲ以テ届出ヅベシ</p><p>到着日時　昭和${l.year - 1925}年　月　日　午前八時</p><p>到着地　　歩兵第〇〇聯隊</p><p class="aksign">${esc(l.pref.replace(/[都道府県]$/, ''))}聯隊区司令部</p></div><div class="popts">${d.options.map((o) => `<button data-i="${o.i}">${esc(o.label)}${o.hint ? `<small>${esc(o.hint)}</small>` : ''}</button>`).join('')}</div></div>`;
    } else if (U.kind === 'madori') {
      const fam = l.spouse && l.spouse.alive, kids = (l.kids || []).filter((k) => k.alive && l.year - k.by < 22).length;
      // 間取り図：物件ごとの間取り（1K・2LDK・和室・ロフトなど）から描く
      const plan = (pr, seed) => {
        const R = (n) => (Math.abs(Math.sin(seed * 9.13 + n * 3.7)) * 1000) % 1, W = 120, Hh = 84;
        const lay = (pr && pr.lay) || '1K', wa = pr && pr.feats && pr.feats.some((f) => /和室/.test(f)), old = pr && /長屋|木造|下宿|間借り|古|文化|借家|団地/.test(pr.type);
        let svg = `<svg viewBox="0 0 ${W} ${Hh}" class="mdsvg"><rect x="2" y="2" width="${W - 4}" height="${Hh - 4}" fill="${old ? '#fbf6ea' : '#fff'}" stroke="#333" stroke-width="2"/>`;
        const T = (x, y, t, fs = 7) => `<text x="${x}" y="${y}" font-size="${fs}" text-anchor="middle" fill="#555">${t}</text>`, L = (x1, y1, x2, y2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#333" stroke-width="1.5"/>`;
        const m = lay.match(/^(\d)(S?LDK|DK|K)$/), n = m ? +m[1] : 1, big = m ? m[2] : (/畳|個室/.test(lay) ? '' : 'K');
        const flip = R(1) < 0.5, horiz = n === 2 && R(2) < 0.5;
        const kx = flip ? 2 : W - 2 - Math.round((W - 4) * (big === 'LDK' ? 0.48 : big === 'DK' ? 0.36 : big === 'K' ? 0.22 : 0));
        const kw = big ? Math.round((W - 4) * (big === 'LDK' ? 0.48 : big === 'DK' ? 0.36 : 0.22)) : 0;
        const rx0 = flip ? 2 + kw : 2, rx1 = flip ? W - 2 : W - 2 - kw;
        if (kw) { svg += L(flip ? 2 + kw : W - 2 - kw, 2, flip ? 2 + kw : W - 2 - kw, Hh - 2) + T(flip ? 2 + kw / 2 : W - 2 - kw / 2, Hh / 2 - 6, big, 8); svg += `<rect x="${(flip ? 4 : W - 2 - kw + 2)}" y="${Hh - 14}" width="${Math.min(22, kw - 4)}" height="5" fill="#dfe7ea" stroke="#999" stroke-width=".5"/>`; }
        for (let k = 0; k < n; k++) {
          const x0 = horiz ? rx0 + (rx1 - rx0) * k / n : rx0, x1 = horiz ? rx0 + (rx1 - rx0) * (k + 1) / n : rx1, y0 = horiz ? 2 : 2 + (Hh - 4) * k / n, y1 = horiz ? Hh - 2 : 2 + (Hh - 4) * (k + 1) / n;
          if (k) svg += horiz ? L(x0, 2, x0, Hh - 2) : L(rx0, y0, rx1, y0);
          const isWa = (wa && k === n - 1) || /畳/.test(lay) || (old && R(k + 9) < 0.6);
          if (isWa) for (let t = 1; t < 3; t++) svg += `<line x1="${x0 + (x1 - x0) * t / 3}" y1="${y0 + 2}" x2="${x0 + (x1 - x0) * t / 3}" y2="${y1 - 2}" stroke="#d8cfae" stroke-width=".6"/>`;
          svg += T((x0 + x1) / 2, (y0 + y1) / 2 + 3, /畳/.test(lay) ? lay : lay === '個室' ? '個室' : `${isWa ? '和' : '洋'}${5 + Math.round(R(k + 4) * 3)}${isWa ? '畳' : '帖'}`);
        }
        // 水まわり・玄関・ベランダ
        const bathless = pr && /風呂なし|下宿|間借り/.test(pr.type);
        if (!bathless) svg += `<rect x="${flip ? W - 24 : 4}" y="4" width="20" height="14" fill="#eef6fb" stroke="#888" stroke-width=".6"/>` + T(flip ? W - 14 : 14, 13, '浴室', 5);
        svg += `<rect x="${flip ? 4 : W - 22}" y="${Hh - 16}" width="18" height="12" fill="#e8f0f8" stroke="#888"/>` + T(flip ? 13 : W - 13, Hh - 7, '玄関', 5);
        if (pr && pr.feats && pr.feats.some((f) => /ロフト/.test(f))) svg += `<rect x="${rx0 + 3}" y="4" width="${Math.min(36, (rx1 - rx0) - 6)}" height="10" fill="none" stroke="#999" stroke-dasharray="2 1"/>` + T(rx0 + 3 + Math.min(18, ((rx1 - rx0) - 6) / 2), 11, 'ロフト', 5);
        if (pr && pr.feats && pr.feats.some((f) => /庭/.test(f))) svg += `<rect x="2" y="${Hh - 2}" width="${W - 4}" height="0" stroke="#5c8a5a" stroke-width="3"/>`;
        if (!/一戸建て|一軒家|古民家|長屋|借家|文化住宅/.test((pr && pr.type) || '')) svg += `<line x1="8" y1="${Hh - 0.5}" x2="${W - 30}" y2="${Hh - 0.5}" stroke="#9ab" stroke-width="2" stroke-dasharray="3 2"/>`;
        return svg + '</svg>';
      };
      const tag = (pr) => (pr ? [pr.old === 0 ? '新築' : `築${pr.old}年`, pr.floor ? `${pr.floor}階` : '', `${pr.m2}㎡`, `駅徒歩${pr.walk}分`].filter(Boolean).join('・') : '');
      box.innerHTML = `<div class="paper madori"><div class="mdhead"><b>物件をさがす</b><span>${esc(d.text)}</span></div><div class="mdlist">${d.options.map((o, k) => { const pr = o.prop; return `<button data-i="${o.i}" class="mdcard${pr && pr.feats.some((f) => /事故/.test(f)) ? ' jiko' : ''}">${plan(pr, k + 1 + o.label.length)}<div class="mdinfo"><b>${esc(o.label)}</b><span class="mdlay">${esc(pr ? `${pr.type}・${pr.lay}` : '')}</span><span class="mdtag">${esc(tag(pr))}</span>${pr && pr.feats.length ? `<span class="mdfeat">${pr.feats.map((f) => `<i>${esc(f)}</i>`).join('')}</span>` : ''}<small>${esc(o.hint || '')}</small></div></button>`; }).join('')}</div></div>`;
    } else if (['meimei', 'teikibin', 'vote', 'invite', 'celebrate', 'tsuchi', 'kuji', 'ending'].includes(U.kind)) {
      const D2 = d.doc, R = `${wareki(l.year)}`, opts = `<div class="popts">${d.options.map((o) => `<button data-i="${o.i}">${esc(o.label)}${o.hint ? `<small>${esc(o.hint)}</small>` : ''}</button>`).join('')}</div>`;
      let body = '';
      if (U.kind === 'meimei') body = `<div class="mmpaper"><span class="mmtt">命名</span><span class="mmname" id="mmName">${esc(D2.cands[0].k)}</span><span class="mmdate">${R}　${l.name.sei}家</span></div><p class="ptext">${esc(d.text)}</p>`;
      if (U.kind === 'teikibin') { const P = D2.p; body = `<div class="tkhead"><b>ねんきん定期便</b><span>日本年金機構　${esc(l.name.sei)} ${esc(l.name.mei)} 様（${l.age}歳）</span></div>
        <dl class="tkdl"><dt>国民年金の加入期間</dt><dd>${P.paidY}年</dd><dt>厚生年金の加入期間</dt><dd>${P.koseiY}年</dd><dt>老齢基礎年金（見込み）</dt><dd>${P.kiso}万円/年</dd><dt>老齢厚生年金（見込み）</dt><dd>${P.kosei}万円/年</dd></dl>
        <div class="psnet tknet"><span>65歳から受け取る見込み額</span><b>年 ${P.total}万円</b><small>月 約${(P.total / 12).toFixed(1)}万円</small></div>
        <div class="tkbar">${[[60, 0.76], [65, 1], [70, 1.42], [75, 1.84]].map(([a2, m]) => `<div><i style="height:${Math.round(m * 46)}px"></i><b>${Math.round(P.total * m / 12 * 10) / 10}万</b><small>${a2}歳〜</small></div>`).join('')}</div>
        <p class="kslegend">受け取り始める年齢で、月額が一生変わります（繰り上げ：1か月0.4%減／繰り下げ：1か月0.7%増）。</p>`; }
      if (U.kind === 'vote') body = `<div class="vtcard"><div class="vthd">投票所入場整理券</div><div class="vtbody"><p class="vtname">${esc(D2.name)}</p><dl><dt>選挙人</dt><dd>${esc(l.name.sei)} ${esc(l.name.mei)} 様</dd><dt>投票日</dt><dd>${R}　〇月〇日（日）午前7時〜午後8時</dd><dt>投票所</dt><dd>${esc(D2.place)}</dd></dl><p class="vtnote">この券がなくても、本人であれば投票できます。</p></div><div class="vtside">${esc(l.city)}選挙管理委員会</div></div>`;
      if (U.kind === 'invite') body = `<div class="ivcard"><div class="ivkoto">寿</div><p class="ivlead">謹啓　皆様にはお健やかにお過ごしのこととお慶び申し上げます</p><p class="ivmain">このたび<br><b>${esc(D2.from)}</b>　と　<b>${esc(D2.partner)}</b><br>は結婚式を挙げることになりました</p><p class="ivlead">ご多用中誠に恐縮ではございますが　ご出席くださいますようご案内申し上げます　謹白</p><div class="ivrsvp"><span>ご出席</span><span>ご欠席</span></div></div>`;
      if (U.kind === 'celebrate') body = `<div class="cbcard"><div class="cbconf">${Array.from({ length: 18 }, (_, k) => `<i style="left:${(k * 37) % 100}%;animation-delay:${(k % 6) * 0.25}s;background:${['#c0392b', '#e8b94a', '#5c8a5a', '#7fb3e0', '#d9667a'][k % 5]}"></i>`).join('')}</div><span class="cbbig">${esc(D2.big)}</span><span class="cbsub">${esc(D2.sub)}</span><p class="ptext">${esc(d.text)}</p></div>`;
      if (U.kind === 'tsuchi') body = `<div class="tshead"><b>通 知 表</b><span>${esc(l.edu.school || '')}　${l.age === 15 ? '3年' : l.age === 12 ? '6年' : '4年'}　${esc(l.name.sei)} ${esc(l.name.mei)}</span></div>
        <table class="tstbl"><tr><th>教科</th><th>${D2.jhs ? '評定（5段階）' : '評価'}</th></tr>${D2.rows.map(([n, v]) => `<tr><td>${esc(n)}</td><td class="tsv v${v}">${D2.jhs ? '●'.repeat(v) + '<span>' + '○'.repeat(5 - v) + '</span> ' + v : esc(v)}</td></tr>`).join('')}</table>
        <p class="tscm">先生から：${esc(l.stats.know >= 60 ? '授業に意欲的に取り組み、よく考えて発言できました。' : l.stats.social >= 55 ? '友だちにやさしく、クラスの雰囲気を明るくしてくれました。' : 'こつこつ取り組む姿が見られました。次の学期も期待しています。')}</p>`;
      if (U.kind === 'kuji') body = `<div class="kjhead">年末ジャンボ宝くじ　当選番号</div><div class="kjwin"><span>1等</span><b>${(D2.kumi + 37) % 200 || 1}組 ${String((D2.no * 7919) % 100000 + 100000)}番</b></div><div class="kjtickets">${Array.from({ length: 10 }, (_, k) => `<div class="kjt"><small>年末ジャンボ</small><b>${D2.kumi}組</b><span>${D2.no + k}番</span></div>`).join('')}</div>`;
      if (U.kind === 'ending') body = `<div class="ednote"><h3>エンディングノート</h3><p class="edsub">もしものときに、家族が迷わないように</p><dl><dt>名前</dt><dd>${esc(l.name.sei)} ${esc(l.name.mei)}</dd><dt>生年月日</dt><dd>${l.born.y}年${l.born.m}月${l.born.d}日</dd><dt>延命治療について</dt><dd class="edblank">　</dd><dt>最期を迎えたい場所</dt><dd class="edblank">　</dd><dt>葬儀・お墓</dt><dd class="edblank">　</dd><dt>家族へのメッセージ</dt><dd class="edblank">　</dd></dl></div><p class="ptext">${esc(d.text)}</p>`;
      box.innerHTML = `<div class="paper ${U.kind}">${body}${opts}</div>`;
      if (U.kind === 'meimei') box.querySelectorAll('button[data-i]').forEach((bt) => { const m = bt.textContent.match(/「(.+?)」/); if (m) { bt.addEventListener('mouseenter', () => { $('#mmName').textContent = m[1]; }); bt.addEventListener('click', () => { $('#mmName').textContent = m[1]; $('#mmName').classList.add('on'); }); } });
    } else if (U.kind === 'card') {
      box.innerHTML = `<div class="paper card"><div class="nenga"><div class="ngstamp">年賀</div><div class="ngto">${esc(l.name.sei)} ${esc(l.name.mei)} 様</div><div class="ngbody"><b>謹賀新年</b><p>${esc(d.doc.msg)}</p><small>${wareki(l.year)} 元旦</small><span class="ngfrom">${esc(d.doc.from)}</span></div><div class="ngeto">${['🐭', '🐮', '🐯', '🐰', '🐲', '🐍', '🐴', '🐑', '🐵', '🐔', '🐶', '🐗'][(l.year - 4) % 12]}</div></div>
        <div class="popts">${d.options.map((o) => `<button data-i="${o.i}">${esc(o.label)}${o.hint ? `<small>${esc(o.hint)}</small>` : ''}</button>`).join('')}</div></div>`;
    } else if (U.kind === 'match') {
      const C = d.doc.cands, likes = d.options.filter((o) => /いいね$/.test(o.label)), skip = d.options.find((o) => !/いいね$/.test(o.label));
      box.innerHTML = `<div class="ph matchapp">${'<div class="phtop"><span>' + hhmm() + '</span><span class="phage">' + l.age + '歳・' + l.year + '年</span><span>▮▮▮</span></div>'}
        <div class="mahead"><b>♡ マッチ</b><small>${esc(d.text.split('。')[0])}。</small></div><div class="mastack">${C.map((c, k) => `<div class="macard" data-k="${k}" style="--h:${c.hue}"><div class="maimg">${phAvatar(c.name)}</div><div class="mainfo"><b>${esc(c.name)}<span>${c.age}歳</span></b><p>${esc(c.pref)}・${esc(c.job)}</p><p>趣味：${esc(c.hobby)}</p><q>${esc(c.cm)}</q></div></div>`).reverse().join('')}<div class="maempty">今日のおすすめは以上です</div></div>
        <div class="mabtns"><button class="mano" aria-label="スキップ">✕</button><button class="mayes" aria-label="いいね">♥</button></div>
        <p class="manote">${esc(d.text.split('。').slice(1).join('。'))}</p></div>`;
      const root = box.firstElementChild; let k = 0;
      const top = () => root.querySelector(`.macard[data-k="${k}"]`);
      const swipe = (like) => { const c = top(); if (!c || PH.done) return; c.classList.add(like ? 'liked' : 'goL'); SND.sfx(like ? 'good' : 'click');
        if (like) return pick(likes[k], c);
        k++; if (k >= C.length) phLater(500, () => pick(skip, root)); };
      root.querySelector('.mano').addEventListener('click', () => swipe(false));
      root.querySelector('.mayes').addEventListener('click', () => swipe(true));
      // 指でスワイプ
      let sx = null; root.querySelector('.mastack').addEventListener('pointerdown', (e) => { sx = e.clientX; });
      root.querySelector('.mastack').addEventListener('pointermove', (e) => { const c = top(); if (sx == null || !c) return; const dx = e.clientX - sx; c.style.transform = `translateX(${dx}px) rotate(${dx / 18}deg)`; });
      const up = (e) => { const c = top(); if (sx == null || !c) return; const dx = e.clientX - sx; sx = null; if (Math.abs(dx) > 70) swipe(dx > 0); else c.style.transform = ''; };
      root.querySelector('.mastack').addEventListener('pointerup', up); root.querySelector('.mastack').addEventListener('pointercancel', () => { sx = null; const c = top(); if (c) c.style.transform = ''; });
      M.classList.remove('papermode'); M.classList.add('phonemode');
    } else {
      const terms = U.terms(l);
      box.innerHTML = `<div class="paper sign"><h3>${esc(U.doc)}</h3><p class="pdate">${wareki(l.year)}　　月　　日</p>
        <p class="ptext">${esc(d.text)}</p><ol class="pterms">${terms.map((t) => `<li>${esc(t)}</li>`).join('')}</ol>
        <div class="psign"><span>署名</span><span class="sig">${esc(l.name.sei)} ${esc(l.name.mei)}</span><span class="hanko">${esc([...l.name.sei].slice(0, 2).join(''))}</span></div>
        <div class="popts">${d.options.map((o) => `<button data-i="${o.i}" class="${NO_SIGN.test(o.label) ? 'nosign' : 'dosign'}">${NO_SIGN.test(o.label) ? '' : '<i>✍</i>'}${esc(o.label)}${o.hint ? `<small>${esc(o.hint)}</small>` : ''}</button>`).join('')}</div>
        <span class="pstamp">見送り</span></div>`;
    }
    box.querySelectorAll('button[data-i]').forEach((b) => b.addEventListener('click', () => pick(d.options.find((o) => o.i === +b.dataset.i), b)));
    M.hidden = false; SND.sfx('open');
  }
  function paperResult(d, o, logs, go2) {
    S.autoHeld = go2; clearInterval(PH.clock);
    const paper = $('#mPhone .paper') || $('#mPhone .ph'), txt = logs.filter((x) => x.c !== 'note' && x.c !== 'chapter').map((x) => x.t).join(' ');
    const res = logs.filter((x) => x.c !== 'note' && x.c !== 'chapter').map((x) => `<p>${esc(x.t)}</p>`).join('') || '<p>そう決めました。</p>';
    let badge = '';
    if (d.ui.kind === 'kuji') { badge = /7億/.test(txt) ? '<div class="pass ok">1等 7億円</div>' : /100万/.test(txt) ? '<div class="pass ok">100万円</div>' : /1万円/.test(txt) ? '<div class="pass ok match">1万円</div>' : '<div class="pass ng" style="font-size:28px">はずれ…</div>'; }
    if (d.ui.kind === 'match' && /マッチングしました/.test(txt)) { badge = '<div class="pass ok match">マッチング成立 ♥</div>'; SND.sfx('good'); }
    if (d.ui.kind === 'exam' && /合格/.test(txt)) {
      const ok = !/不合格/.test(txt) || /併願していた.*合格しました/.test(txt), no = +($('#mPhone').dataset.no || 12345), nums = [];
      for (let k = -14; k <= 15; k++) { const n = no + k * 3 + (k % 2); if (n === no ? ok : Math.random() < 0.68) nums.push(n); }
      if (ok && !nums.includes(no)) nums.push(no);
      nums.sort((a, b) => a - b);
      badge = `<div class="board"><p class="bdhead">合格者受験番号</p><div class="bdnums">${nums.map((n, k) => `<span class="${n === no ? 'mine' : ''}" style="animation-delay:${k * 45}ms">${n}</span>`).join('')}</div><p class="bdmine">あなたの番号：<b>${no}</b></p></div><div class="pass ${ok ? 'ok' : 'ng'} late">${ok ? '合格' : 'ない…'}</div>`;
      if (ok) setTimeout(() => SND.sfx('good'), 1600);
    }
    paper.insertAdjacentHTML('beforeend', `${badge}<div class="phres"><span class="lbl">${esc(qlab(o.label))}を選んだ結果</span>${res}</div><button class="phend">次へ ▸</button>`);
    paper.querySelector('.phend').addEventListener('click', () => { SND.sfx('click'); go2(); });
    paper.scrollTop = paper.scrollHeight;
  }
  // 選んだ結果を見せてから、次の問いへ
  function showResult(d, o, logs, next) {
    const go2 = () => { S.autoHeld = null; clearHold(); $('#modal').hidden = true; phoneOff(); next(); };
    if (d.phone && $('#mPhone .ph')) return phoneResult(d, o, logs, go2);
    if (d.ui && $('#mPhone .paper, #mPhone .matchapp')) return paperResult(d, o, logs, go2);
    S.autoHeld = go2;
    $('#mText').textContent = '';
    $('#mHelp').innerHTML = '';
    $('#mNote').textContent = '';
    const res = logs.filter((x) => x.c !== 'note' && x.c !== 'chapter').map((x) => `<p>${esc(x.t)}${x.note ? `<br><span class="small muted">${esc(x.note)}</span>` : ''}</p>`).join('') || '<p>そう決めました。</p>';
    const box = $('#mOpts');
    box.innerHTML = `<div class="mresult"><span class="lbl">${esc(qlab(o ? o.label : ''))}を選んだ結果</span>${res}</div>`;
    const b = document.createElement('button'); b.className = 'mnext';
    b.textContent = '次へ ▸';
    b.addEventListener('click', () => { SND.sfx('click'); go2(); });
    box.appendChild(b);
    $('#modal').hidden = false;
  }
  // ひと息：文字入力ではなく、選択肢から今の気持ちを選ぶ
  const BREATH_OPTS = {
    5: ['思いきり遊べる時間', '家族と一緒にいる時間', 'たくさんほめてもらうこと', '安心して眠れる家'],
    15: ['友だちに会える楽しい場所', '勉強や部活をがんばる場所', 'なんとなく通う場所', 'できれば行きたくない場所'],
    30: ['あのとき別の道もあったと思う', 'これでよかったと思っている', 'まだ答えは出ていない', 'あまり考えないようにしている'],
    50: ['きっと何もかも違っていた', '仕事や暮らしは変わっていた', 'それでも自分は自分だった', '想像がつかない'],
    70: ['生まれる場所と家族は選べなかった', '仕事や住む場所は選べた', '誰と生きるかは選べた', '選べなかったことのほうが多い']
  };
  function nowOpts(l) {
    if (l.age < 6) return ['遊ぶのがたのしい', 'おうちの人と一緒がいい', 'ねむたい', 'おなかがすいた'];
    const o = [];
    if (l.stats.happy >= 60) o.push('毎日がわりと楽しい'); else o.push('ちょっと疲れている');
    if (l.stats.health < 45) o.push('体のことが心配');
    if (l.age < 18) o.push('早く大人になりたい', '学校のことで頭がいっぱい'); else if (l.age < 65) o.push('先のことが少し不安', 'もっと挑戦してみたい'); else o.push('これまでの人生をふり返っている', 'のんびり過ごしたい');
    o.push(l.spouse || l.kids.length ? '家族に感謝している' : '友だちに感謝している');
    return o;
  }
  function pauseBreath(q, opts) {
    clearTimeout(S.timer); S.autoHeld = null; phoneOff();
    const l = S.life;
    $('#mAge').textContent = 'ひと息';
    $('#mTitle').textContent = q;
    $('#mText').innerHTML = `<span class="reflect">${esc(E.reflect(l))}</span>`;
    $('#mHelp').innerHTML = '';
    $('#mNote').textContent = '選んだ思いは「残した思い」として最後に表示されます。';
    const box = $('#mOpts'); box.innerHTML = '';
    const close = () => { clearHold(); $('#modal').hidden = true; if (S.resumeAfterNote) { S.paused = false; S.resumeAfterNote = false; } schedule(); };
    const list = opts || BREATH_OPTS[l.age] || nowOpts(l);
    list.forEach((v) => {
      const b = document.createElement('button'); b.textContent = v;
      b.addEventListener('click', () => { SND.sfx('click'); S.rec.notes.push({ age: l.age, q, t: v }); save(); l.notes.push({ age: l.age, q, t: v }); l.log.push({ age: l.age, year: l.year, c: 'note', t: `「${v}」`, tone: 'note' }); flushLog(); close(); });
      box.appendChild(b);
    });
    const sk = document.createElement('button'); sk.className = 'ghost'; sk.textContent = '答えずに続ける'; sk.addEventListener('click', close); box.appendChild(sk);
    $('#modal').hidden = false;
  }

  // ---------- アイコン ----------
  // 出来事ごとのイラスト（illust.js）
  const ICONS = [[/生まれました。(男|女)の子|双子/, 'baby'], [/七五三/, 'shichigosan'], [/甲子園|野球/, 'baseball'], [/サッカー/, 'soccer'], [/スイミング|泳ぎ/, 'swim'], [/卒業/, 'graduation'], [/ランドセル|小学校に入学/, 'randoseru'], [/入学|入園|保育園|学童/, 'school'], [/運動会|体育祭|リレー|球技大会/, 'undokai'], [/修学旅行|遠足|林間|宿泊|社会科見学/, 'bus'], [/合唱|音楽会|吹奏楽|ピアノ|楽器|バンド/, 'music'], [/文化祭|学園祭|大学祭|模擬店/, 'bunkasai'], [/インターハイ|大会|全中|完走|自己ベスト/, 'medal'], [/アルバイト/, 'baito'], [/受験|合格|不合格|浪人|共通テスト|偏差値/, 'exam'], [/塾|勉強|通信教育|公文|オープンキャンパス|入学します|大学院|好きな教科/, 'study'], [/昇進|課長|部長|係長|取締役/, 'promotion'], [/夢だった|将来の夢/, 'sparkle'], [/辞め|失業|倒産|リストラ|仕事を失|廃業/, 'quit'], [/離婚/, 'heartbreak'], [/結婚|パートナーシップ/, 'ring'], [/付き合|恋人|好きな人/, 'love'], [/第\d子|孫が|初孫/, 'stroller'], [/命を絶|亡くなり|他界|死去/, 'candle'], [/がん|腫瘍|白血病|リンパ腫/, 'ribbon'], [/車いす|要介護|要支援|デイサービス|ヘルパー|老人ホーム|介護/, 'elder'], [/認知症/, 'elder'], [/入院|手術|脳梗塞|心筋梗塞|NICU|保育器|骨折|けが|インフルエンザ/, 'hospital'], [/診断|血圧|糖尿病|ぜんそく|アレルギー|アトピー|健康診断|肝臓/, 'stethoscope'], [/こころ|うつ|眠れない|心の調子/, 'sprout'], [/津波/, 'tsunami'], [/地震/, 'earthquake'], [/大雨|浸水|氾濫|避難/, 'rain'], [/感染症|パンデミック/, 'mask'], [/パチンコ|カジノ/, 'pachinko'], [/競馬|ボートレース|競輪|馬券/, 'horse'], [/ガチャ|課金/, 'gacha'], [/ゲーム/, 'gamepad'], [/ビール|お酒|飲酒|断酒|居酒屋|飲み会/, 'beer'], [/リボ|カード|借金|債務|ローンで生活費/, 'credit-card'], [/NISA|投資|株価/, 'chart-up'], [/逮捕|検挙|補導|刑務所|出所|判決|服役/, 'warning'], [/詐欺|だまし/, 'warning'], [/フォロワー|バズ/, 'sns'], [/宝くじ/, 'lottery'], [/推し|アイドル/, 'idol'], [/ライブ|フェス/, 'concert'], [/カラオケ/, 'karaoke'], [/キャバクラ|ホストクラブ|夜の店/, 'night'], [/景気|ボーナス/, 'quit'], [/年金|退職金|相続|奨学金|貯金|生活保護|援助|お祝い|ランドセル/, 'yen'], [/住宅ローン|家を|リフォーム|マンション|一戸建て/, 'home'], [/引っ越|一人暮らし|転勤|異動|配属|Uターン|住み続け/, 'truck'], [/車を|免許|ドライブ/, 'car'], [/電車|鉄道|18きっぷ|特急/, 'train'], [/タバコ/, 'cigarette'], [/海外|ハワイ|台湾|韓国|タイ|グアム|シンガポール|ベトナム|イタリア|フランス|ニューヨーク|オーストラリア|留学/, 'plane'], [/旅行|旅館|紅葉|道の駅|聖地巡礼/, 'bus'], [/温泉/, 'onsen'], [/サウナ/, 'sauna'], [/犬|子犬|散歩の時間/, 'pet-dog'], [/猫|子猫/, 'pet-cat'], [/遺品|形見|アルバム|実家じまい/, 'candle'], [/周年|銀婚式|金婚式/, 'ring'], [/反抗期|けんか|チャンネル争い/, 'chat'], [/祭り|エイサー/, 'festival'], [/還暦|古希|喜寿|米寿|白寿|100歳/, 'cake'], [/人口/, 'japan'], [/二十歳/, 'party'], [/スマホ|SNS|動画|フォロワー|炎上/, 'sns'], [/本屋大賞|本を|冊|図書館|読み/, 'book'], [/マンガ|アニメ/, 'manga'], [/映画/, 'movie'], [/ジム|ベンチプレス|体重/, 'gym'], [/走る|マラソン|ジョギング|歩/, 'jogging'], [/釣/, 'fishing'], [/キャンプ|テント/, 'camping'], [/ゴルフ/, 'golf'], [/富士山|登山|縦走|山を/, 'mountain'], [/料理|ケーキ|ぬか漬け|お菓子/, 'cooking'], [/写真|カメラ/, 'camera'], [/菜園|トマト|農園|盆栽/, 'garden'], [/ハンドメイド|セーター|編/, 'crafts'], [/将棋|麻雀|囲碁/, 'shogi'], [/茶道|書道/, 'tea'], [/俳句/, 'pen'], [/ボランティア|子ども食堂|清掃/, 'volunteer'], [/英検|TOEIC|簿記|資格|FP/, 'certificate'], [/神社|お参り/, 'shrine'], [/雪かき|雪/, 'snow'], [/海/, 'beach'], [/副業/, 'work'], [/内定|入社|就職|働き始め|働く|採用|公務員|医師|研修医/, 'work'], [/祖父|祖母|おじいちゃん|おばあちゃん|帰省|お盆|お正月/, 'home'], [/告白|気持ちを伝え|恋人/, 'love'], [/スピーチ|結婚式/, 'ring'], [/先生/, 'pen'], [/同期|入社式/, 'suit'], [/ねぶた|竿燈|七夕|花笠|さんさ|野馬追|三社祭|祇園祭|天神祭|阿波おどり|よさこい|山笠|くんち|風の盆|郡上|御柱|YOSAKOI|とうかさん|手筒|花火|例大祭|おはら/, 'festival'], [/雪かき|かまくら|大雪/, 'snow'], [/友|同窓会|親友|幼なじみ/, 'chat'], [/恐竜|電車|お絵かき|虫|絵本|ブロック|夢中/, 'sparkle']];
  const CAT_ICON = { story: 'chat', crime: 'warning', hobby: 'sparkle', school: 'school', work: 'suit', family: 'family', love: 'love', health: 'stethoscope', money: 'yen', world: 'globe', event: 'sparkle', choice: 'arrow', note: 'pen', birth: 'baby', death: 'candle' };
  const IL = window.ILLUST || {};
  function iconKey(e) { for (const [re, k] of ICONS) if (re.test(e.t)) return k; return CAT_ICON[e.c] || 'sparkle'; }
  function iconFor(e) { return IL[iconKey(e)] || ''; }

  $('#feed').addEventListener('click', (ev) => { const b = ev.target.closest('.star'); if (!b) return; const li = b.closest('li'); const e = S.life.log[+li.dataset.i]; if (!e) return; e.star = !e.star; li.classList.toggle('starred', e.star); S.rec.stars = S.rec.stars || []; const i = S.rec.stars.indexOf(+li.dataset.i); if (e.star && i < 0) S.rec.stars.push(+li.dataset.i); if (!e.star && i >= 0) S.rec.stars.splice(i, 1); save(); });
  // ---------- 描画 ----------
  function typeIn(li, t) {
    const tw = li.querySelector('.tw'), n = li.querySelector('.n'), chars = [...t];
    const ms = Math.max(18, Math.min(60, (interval() / 6) / Math.max(1, chars.length)));
    let i = 0; li.classList.add('typing');
    const tick = () => { i = Math.min(chars.length, i + (ms < 25 ? 2 : 1)); tw.textContent = chars.slice(0, i).join(''); if (i < chars.length) setTimeout(tick, ms); else { li.classList.remove('typing'); if (n) n.hidden = false; } };
    tick();
  }
  // 出来事は新しいものから一定数だけ見せ、それより前は「もっと見る」にまとめる
  const FEED_N = 12;
  function foldFeed() {
    const feed = $('#feed'); if (!feed) return;
    if (S.feedLife !== S.life) { S.feedLife = S.life; S.feedShow = FEED_N; }
    const items = feed.querySelectorAll('ol.sub > li:not(.chapter)');
    let n = 0;
    items.forEach((li) => { li.classList.toggle('fold', n++ >= S.feedShow); });
    feed.querySelectorAll(':scope > li.yearmark').forEach((g) => { g.classList.toggle('fold', !g.querySelector('ol.sub > li:not(.chapter):not(.fold)')); });
    const rest = Math.max(0, items.length - S.feedShow);
    let box = $('#feedMore');
    if (!box) { box = document.createElement('p'); box.id = 'feedMore'; box.className = 'feedmore'; box.innerHTML = '<button type="button" class="ghost" data-m="more"></button><button type="button" class="ghost" data-m="all">すべて表示</button>'; feed.after(box);
      box.addEventListener('click', (e) => { const m = e.target.dataset && e.target.dataset.m; if (!m) return; S.feedShow = m === 'all' ? 1e9 : S.feedShow + 30; foldFeed(); }); }
    box.hidden = !rest;
    box.querySelector('[data-m="more"]').textContent = `もっと見る（残り${rest}件）`;
  }
  function flushLog(upto) {
    const l = S.life, feed = $('#feed'), end = upto == null ? l.log.length : Math.min(upto, l.log.length);
    if (upto == null) S.yr = null;
    // 新しい出来事をすべて順番にドット絵で見せる
    if (S.logN > 0) { const q = PX_SCENE.q; for (let i = S.logN; i < end; i++) { const e = l.log[i]; if (e.c === 'note' || e.c === 'chapter' || (S.pxChose && e.c === 'choice')) continue; q.push(e); } if (q.length > 10) q.splice(0, q.length - 10); if (!PX_SCENE.ev) PX_SCENE.until = 0; }
    S.pxChose = false;
    const live = S.logN > 0 && end - S.logN <= 4; // 少しずつ出るときは、キーボードで打つように1文字ずつ
    let snd = 0; const RANK = { good: 1, bad: 2, award: 3, grave: 4, death: 5 }, NAMES = ['', 'good', 'bad', 'award', 'grave', 'death'];
    for (; S.logN < end; S.logN++) {
      const e = l.log[S.logN];
      if (e.age !== S.lastAge || !S.group) {
        S.lastAge = e.age;
        const g = document.createElement('li'); g.className = 'yearmark';
        g.textContent = `${e.year}年・${e.age}歳`;
        const ul = document.createElement('ol'); ul.className = 'feed sub'; ul.style.maxHeight = 'none';
        g.appendChild(ul);
        feed.insertBefore(g, feed.firstChild);
        S.group = ul;
      }
      const li = document.createElement('li');
      if (e.c === 'chapter') { const h = document.createElement('li'); h.className = 'chapter'; h.textContent = e.t; S.group.insertBefore(h, S.group.firstChild); continue; }
      li.className = `${e.tone} ${e.c}`;
      li.dataset.i = S.logN; if (e.star) li.classList.add('starred');
      li.innerHTML = `<button class="star" title="覚えておく瞬間" aria-label="覚えておく">☆</button><span class="a">${e.age}歳</span><span class="ic" aria-hidden="true">${iconFor(e)}</span><span class="tw">${live ? '' : esc(e.t)}</span>${e.note ? `<span class="n"${live ? ' hidden' : ''}>${esc(e.note)}</span>` : ''}`;
      if (live) typeIn(li, e.t);
      if (e.c === 'death' && /自ら命/.test(e.t)) li.insertAdjacentHTML('beforeend', HELP);
      S.group.insertBefore(li, S.group.firstChild);
      const k = e.c === 'death' ? 'death' : e.tone === 'grave' ? 'grave' : /入賞|優勝|全国|金賞|合格しました！|内定|夢だった/.test(e.t) ? 'award' : e.tone === 'bad' ? 'bad' : e.tone === 'good' ? 'good' : '';
      if (k && RANK[k] > snd) snd = RANK[k];
    }
    if (snd) SND.sfx(NAMES[snd]);
    foldFeed();
    // 場面：直近の大きな出来事をイラストで
    const big = l.log.slice(Math.max(0, end - 12), end).reverse().find((e) => ['death', 'grave', 'choice'].includes(e.c) || e.tone === 'grave' || e.tone === 'good' && /生まれ|入学|卒業|結婚|合格|入社|昇進|夢|優勝|全国|旅行|孫/.test(e.t)) || l.log[end - 1];
    if (big) { $('#sceneIl').innerHTML = iconFor(big); $('#sceneCap').textContent = `${big.age}歳　${big.t}`; }
    if (l.alive) SND.bgm(l.age < 13 ? 'child' : l.age < 22 ? 'youth' : l.age < 65 ? 'adult' : 'old'); else SND.stopBgm();
  }

  const STAT_COL = { 健康: '#2e7d4f', 幸福: '#b07d1a', 知識: '#1f7a7a', 人間関係: '#9b2340' };
  // パラメーターと財産の変化：バーはすーっと伸び縮みし、数字はルーレットのように回って止まる
  const TW = {};
  const moM = (v) => { if (!(v > 0)) return ''; if (S.life) E.setNow(S.life); const n = E.nomV(v) / 12; return `<small class="mo">（月 約${n >= 100 ? Math.round(n).toLocaleString() + '万円' : n >= 1 ? n.toFixed(1) + '万円' : Math.round(n * 10000).toLocaleString() + '円'}）</small>`; };
  const mb = (k, v) => { const cur = TW['m_' + k] && TW['m_' + k].cur != null ? TW['m_' + k].cur : v; return `<b data-k="${k}" data-v="${v}">${E.fmtMan(Math.round(cur))}</b>`; };
  function tweenNum(el, key, to, fmt, minDelta) {
    if (TW._life !== S.life) { for (const k in TW) if (k !== '_life') { cancelAnimationFrame(TW[k].raf); delete TW[k]; } TW._life = S.life; }
    const t = TW[key] || (TW[key] = { cur: to, to }); const from = t.cur;
    cancelAnimationFrame(t.raf); t.to = to;
    if (Math.abs(to - from) < (minDelta || 0.5) || document.hidden) { t.cur = to; el.textContent = fmt(to); return; }
    const up = to > from, t0 = performance.now(), dur = Math.min(1600, 700 + Math.log10(1 + Math.abs(to - from)) * 220);
    el.classList.remove('up', 'down'); el.classList.add('rolling', up ? 'up' : 'down');
    const d = document.createElement('span'); d.className = 'dchip ' + (up ? 'up' : 'down'); d.textContent = (up ? '+' : '−') + fmt(Math.abs(to - from)).replace(/^-/, '');
    (el.closest('.stat, #money > span, #money') || el.parentElement).appendChild(d); setTimeout(() => d.remove(), 1500);
    const st = (now) => { const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 4); t.cur = from + (to - from) * e; el.textContent = fmt(t.cur); if (k < 1) t.raf = requestAnimationFrame(st); else { t.cur = to; el.textContent = fmt(to); el.classList.remove('rolling'); setTimeout(() => el.classList.remove('up', 'down'), 600); } };
    t.raf = requestAnimationFrame(st);
  }
  function statBars(l) {
    const s = l.stats, box = $('#stats');
    if (!box.querySelector('.stat')) box.innerHTML = ['健康', '幸福', '知識', '人間関係'].map((k) => `<div class="stat" data-k="${k}"><span class="lbl">${k}</span><div class="bar"><i style="width:0%;background:${STAT_COL[k] || ''}"></i></div><b>0</b></div>`).join('');
    [['健康', s.health], ['幸福', s.happy], ['知識', s.know], ['人間関係', s.social]].forEach(([k, v]) => {
      const row = box.querySelector(`.stat[data-k="${k}"]`); row.querySelector('.bar i').style.width = Math.max(0, Math.min(100, v)) + '%';
      tweenNum(row.querySelector('b'), 's_' + k, Math.round(v), (x) => String(Math.round(x)), 1);
    });
  }
  function bar(lbl, v) { return `<div class="stat"><span class="lbl">${lbl}</span><div class="bar"><i style="width:${v}%;background:${STAT_COL[lbl] || ''}"></i></div><b>${Math.round(v)}</b></div>`; }

  // ---------- 成長するドット絵（年齢・性別・学校/仕事・幸福度・健康で姿が変わる） ----------
  const PX = { h: '#2b2017', H: '#6b4a2e', g: '#b9b4ab', s: '#f2c9a5', e: '#2b2017', m: '#b5443a', r: '#f19a8e', t: '#7fb3e0', w: '#ffffff', y: '#e8b94a', k: '#8a6a45', f: '#3a332b', z: '#c0392b' };
  function pixelChar(l, asGrid) {
    let hand = 5;
    const a = l.alive ? l.age : l.deathAge, F = l.sex === 'F', hap = l.stats.happy, ill = l.stats.health < 35;
    const G = 14, rows = []; let R = 0;
    const put = (y, x, c) => { if (x < 0 || x >= G) return; (rows[y] = rows[y] || Array(G).fill(null))[x] = c; };
    const hline = (y, x0, x1, c) => { for (let x = x0; x <= x1; x++) put(y, x, c); };
    // 体の寸法：[頭の高さ, 胴, 脚]
    const dims = a <= 1 ? null : a <= 5 ? [5, 3, 2] : a <= 11 ? [5, 4, 3] : a <= 17 ? [6, 5, 4] : a <= 74 ? [6, 6, 5] : a <= 84 ? [6, 5, 4] : [6, 5, 3];
    const st = l.edu.stage, working = !!l.job && !l.retired, suit = working && a >= 22 && a < 65 && !/農|漁|建設|工場|自営|介護|看護|保育|調理|販売|運転/.test(l.job.title || '');
    const Y0 = l.year || (S.life && S.life.year) || 2026;
    const hair = a >= 70 ? 'g' : a >= 55 ? 'G' : (!F && a >= 4 && a <= 15 && Y0 < 1960) ? '#5a5650' : (F && a >= 18 && a < 40) ? 'H' : 'h';
    const cx = 6; // 頭の左端（幅6）は x=4..9
    const bend = a >= 80 ? 1 : 0;
    if (!dims) {
      // 赤ちゃん：おくるみ
      hline(0, 5, 8, 'h'); hline(1, 4, 9, 's'); put(1, 5, 'h');
      hline(2, 4, 9, 's'); put(2, 5, 'e'); put(2, 8, 'e'); hline(3, 4, 9, 's'); hline(3, 6, 7, hap >= 50 ? 'm' : 's'); if (hap >= 50) { put(3, 4, 'r'); put(3, 9, 'r'); }
      hline(4, 3, 10, 'w'); hline(5, 3, 10, 'Y'); hline(6, 3, 10, 'Y'); hline(7, 4, 9, 'w'); R = 8;
    } else {
      const [hh, th, lh] = dims, x0 = 4 + bend, x1 = 9 + bend;
      // 髪
      const hc = (y, x) => hair === 'G' ? ((x + y) % 2 ? 'h' : 'g') : hair;
      for (let x = x0 + 1; x <= x1 - 1; x++) put(0, x, hc(0, x));
      for (let x = x0; x <= x1; x++) put(1, x, hc(1, x));
      // 顔
      for (let y = 2; y < 1 + hh; y++) for (let x = x0; x <= x1; x++) put(y, x, 's');
      if (F && a >= 3) for (let y = 1; y < hh + (a >= 12 ? 2 : 1); y++) { put(y, x0 - 1, hc(y, x0 - 1)); put(y, x1 + 1, hc(y, x1 + 1)); }
      else { put(2, x0, hc(2, x0)); put(2, x1, hc(2, x1)); }
      const ey = 3 + (hh >= 6 ? 0 : 0);
      put(ey, x0 + 1, 'e'); put(ey, x1 - 1, 'e');
      if (a >= 45 && l.stats.know >= 60) { put(ey, x0, 'f'); put(ey, x1, 'f'); hline(ey, x0 + 2, x1 - 2, 'f'); }
      const my = ey + 2;
      if (hap >= 60) { hline(my, x0 + 2, x1 - 2, 'm'); put(my - 1, x0 + 1, 'm'); put(my - 1, x1 - 1, 'm'); put(ey + 1, x0, 'r'); put(ey + 1, x1, 'r'); }
      else if (hap >= 35) hline(my, x0 + 2, x1 - 2, 'm');
      else { put(my, x0 + 2, 'm'); put(my, x1 - 2, 'm'); put(my - 1, x0 + 3, 'm'); put(my - 1, x1 - 3, 'm'); put(ey + 1, x0 + 1, 't'); }
      if (a >= 60) { put(ey + 1, x0 + 2, 'G2'); }
      let y = 1 + hh;
      // 服の色：段階ごと
      let top = F ? '#d9667a' : '#4f86c6', bot = '#3d4b6a', collar = null, extra = null;
      if (a <= 5) { top = F ? '#f3a6b8' : '#8ec3e6'; bot = top; if (st === 'hoiku' || st === 'yochien' || a >= 3) extra = 'smock'; }
      else if (a <= 11) { top = F ? '#e7889b' : '#e2b552'; bot = '#3d4b6a'; extra = 'randoseru'; }
      else if (a <= 17 && st !== 'work') { top = F ? '#22305a' : '#1d1f26'; bot = F ? '#22305a' : '#1d1f26'; collar = F ? 'sailor' : 'gaku'; }
      else if (a <= 27 && !['work', 'baby', 'elem', 'jhs', 'hs'].includes(st)) { top = F ? '#c9a27a' : '#7a9a6a'; bot = '#3b4f7a'; }
      else if (suit) { top = F ? '#3d4250' : '#2f3542'; bot = top; collar = 'tie'; }
      else if (working) { top = F ? '#c5705b' : '#5d7d9a'; bot = '#4a4a4a'; }
      else if (a >= 65) { top = F ? '#b98fb0' : '#8b7a5a'; bot = '#5a5248'; extra = 'cardigan'; }
      // 時代の服装：戦時は国民服・もんぺ、戦前と昭和前半のお年寄りは着物、昭和の主婦は割烹着
      const Y = l.year || (S.life && S.life.year) || 2026;
      if (Y < 1975 && !l.outfit) {
        if (Y < 1946 && a >= 18 && l.flags && l.flags.heieki && l.flags.heieki.alive) { top = '#6b6a3e'; bot = '#6b6a3e'; collar = 'gaku'; extra = 'gunbo'; }
        else if (Y >= 1938 && Y < 1946 && a >= 18 && !F) { top = '#7a6e48'; bot = '#7a6e48'; collar = 'gaku'; extra = null; }
        else if (Y >= 1942 && Y < 1946 && F && a >= 12) { top = a >= 50 ? '#5a5060' : '#8a6a5a'; bot = '#3d4058'; collar = 'kimono'; extra = 'monpe'; }
        else if (a >= 6 && a <= 11 && Y < 1958) { top = F ? '#c9a0a0' : '#e8e2d2'; bot = F ? '#5a4a6a' : '#3d4b6a'; extra = null; }
        else if (F && a >= 18 && (Y < 1940 || (a >= 50 && Y < 1965))) { top = a >= 50 ? '#6a5a6a' : '#8a5a6a'; bot = top; collar = 'kimono'; extra = 'obi'; }
        else if (!F && a >= 60 && Y < 1955) { top = '#5a5248'; bot = '#5a5248'; collar = 'kimono'; extra = null; }
        else if (F && a >= 25 && !working && Y >= 1950) { collar = 'apron'; }
        if (a <= 5 && Y < 1960) extra = null;
      }
      if (l.tint && !collar) top = l.tint;
      const O = l.outfit; // 場面ごとの服装（喪服・エプロン・振袖など）
      if (O) { if (O.top) top = O.top; if (O.bot) bot = O.bot; if ('collar' in O) collar = O.collar; if ('extra' in O) extra = O.extra; if (O.bare) top = PX.s; }
      if (ill) top = '#cfd8dc';
      const tx0 = x0 - (a >= 18 ? 1 : 0), tx1 = x1 + (a >= 18 ? 1 : 0);
      for (let i = 0; i < th; i++, y++) {
        hline(y, tx0, tx1, top);
        put(y, tx0 - 1, i < th - 1 ? top : 's'); put(y, tx1 + 1, i < th - 1 ? top : 's'); // 腕と手
      }
      const ty = 1 + hh;
      if (collar === 'sailor') { hline(ty, tx0, tx1, 'w'); put(ty + 1, cx, 'z'); put(ty + 1, cx + 1, 'z'); }
      if (collar === 'gaku') { put(ty, cx, 'f'); put(ty, cx + 1, 'f'); for (let i = 1; i < th; i++) put(ty + i, cx + (bend ? 1 : 0), 'y'); }
      if (collar === 'blacktie') { put(ty, cx, 'w'); put(ty, cx + 1 + bend, 'w'); for (let i = 1; i < th - 1; i++) put(ty + i, cx + (i % 2) + bend, 'f'); }
      if (collar === 'apron') { const ac = (O && O.apron) || (O ? '#4f9a6a' : '#f4f1ea'); for (let i = 1; i < th; i++) hline(ty + i, tx0 + 1, tx1 - 1, ac); put(ty, tx0 + 1, ac); put(ty, tx1 - 1, ac); }
      if (collar === 'kimono') { put(ty, cx, 'w'); put(ty, cx + 1, 'w'); put(ty + 1, cx + 1, 'w'); hline(ty + th - 2, tx0, tx1, F ? 'y' : 'f'); }
      if (collar === 'coat') { for (let i = 0; i < th; i++) put(ty + i, cx + (i ? 0 : 1), i ? '#c8ccd2' : 't'); }
      if (collar === 'tie') { put(ty, cx, 'w'); put(ty, cx + 1 + bend, 'w'); for (let i = 1; i < th - 1; i++) put(ty + i, cx + (i % 2) + bend, 'z'); }
      if (extra === 'randoseru') { put(ty, tx0 - 1, 'z'); put(ty + 1, tx0 - 1, 'z'); put(ty, tx1 + 1, 'z'); put(ty + 1, tx1 + 1, 'z'); }
      if (extra === 'smock') { hline(ty, tx0, tx1, 'y'); }
      if (extra === 'obi') hline(ty + th - 2, tx0, tx1, '#d8b65a');
      if (extra === 'gunbo') { hline(0, x0, x1, '#6b6a3e'); hline(1, x0 - 1, x1 + 1, '#6b6a3e'); put(0, cx, '#d8b65a'); }
      if (extra === 'cardigan') for (let i = 0; i < th; i++) put(ty + i, cx + bend, 'w');
      // 下半身：女子はスカート（学生・子ども）
      let skirt = F && a >= 3 && (a <= 17 || (suit && a < 40));
      if (O && 'skirt' in O) skirt = !!O.skirt && F;
      const dress = (O && O.dress) || (!O && extra === 'obi');
      if (!O && extra === 'monpe') skirt = false;
      for (let i = 0; i < lh; i++, y++) {
        if (dress) { hline(y, tx0 - (i >= 1 ? 1 : 0), tx1 + (i >= 1 ? 1 : 0), bot); continue; }
        if (skirt && i < 2) { hline(y, tx0 - (i ? 1 : 0), tx1 + (i ? 1 : 0), bot); continue; }
        const lc = skirt ? 's' : bot;
        hline(y, cx - 1 + bend, cx + bend, lc); hline(y, cx + 2 + bend, cx + 3 + bend, lc);
      }
      hline(y, cx - 1 + bend, cx + bend, 'f'); hline(y, cx + 2 + bend, cx + 3 + bend, 'f'); y++;
      // 杖
      if (a >= 75) for (let i = ty + th - 1; i < y; i++) put(i, Math.min(G - 1, tx1 + 2), 'k');
      R = y; hand = ty + th - 1;
    }
    if (asGrid) return { rows, R, G, hand };
    const P = 2.5, col = (c) => c === 'G' ? PX.g : c === 'G2' ? '#e0b896' : c === 'Y' ? '#f6e3a8' : PX[c] || c;
    let out = '';
    for (let y = 0; y < R; y++) if (rows[y]) rows[y].forEach((c, x) => { if (c) out += `<rect x="${x * P}" y="${y * P}" width="${P + 0.05}" height="${P + 0.05}" fill="${col(c)}"/>`; });
    return `<svg class="pxchar" viewBox="0 0 ${G * P} ${R * P}" width="${G * P}" height="${R * P}" shape-rendering="crispEdges" aria-hidden="true">${out}</svg>`;
  }

  // ---------- 名前の横の小さな舞台：ドット絵の人が歩き、眠り、趣味をする ----------
  const pxCol = (c) => c === 'G' ? PX.g : c === 'G2' ? '#e0b896' : c === 'Y' ? '#f6e3a8' : PX[c] || c;
  // 小物のドット絵（1文字＝1ドット、. は透明）
  const PROPS = {
    book: [['wwwww', 'wiiwi', 'wiwiw', 'zzzzz'], { i: '#9aa3b5' }],
    game: [['fffff', 'ftttf', 'fyfzf'], {}],
    guitar: [['....k', '...k.', 'yyk..', 'yyy..', '.y...'], {}],
    mic: [['f', 'f', 'k'], {}],
    dumbbell: [['f...f', 'fkkkf', 'f...f'], {}],
    rod: [['......k', '.....k.', '....k..', '...k...', '..k....', '.k.....'], {}],
    golf: [['.k', '.k', '.k', '.k', 'ff'], {}],
    pot: [['f...f', 'fffff', 'fzzzf', '.fff.'], {}],
    camera: [['.ff..', 'fffff', 'fwtwf', 'fffff'], {}],
    can: [['..ttt', 'tttt.', 'ttt..'], {}],
    sprout: [['g.g', '.g.', '.g.'], { g: '#5c8a5a' }],
    phone: [['ff', 'tt', 'tt', 'ff'], {}],
    flag: [['zzz', 'zzk', 'zz.', '..k', '..k'], {}],
    cup: [['w.w', 'www', '.w.'], {}],
    ball: [['.ww.', 'wfww', 'wwfw', '.ww.'], {}],
    knit: [['.k.k', 'rrrr', 'rrrr'], {}],
    fire: [['.z.', 'zyz', 'kkk'], {}],
    board: [['yyyyy', 'yfyfy', 'yyyyy'], {}],
    briefcase: [['.ff.', 'kkkk', 'kkkk'], {}],
    bag: [['zz', 'zz'], {}],
    note: [['.f', '.f', 'ff'], {}],
    z: [['fff', '.f.', 'fff'], {}],
    heart: [['z.z', 'zzz', '.z.'], {}],
    tv: [['ffffff', 'fttttf', 'fttttf', 'ffffff', '..ff..'], {}],
    dog: [['k...kk', '.kkkkf', '.kkkk.', '.k..k.'], {}],
    cat: [['f.f...', 'fff..f', '.ffff.', '.f..f.'], {}],
    rattle: [['.y.', 'yzy', '.y.', '.k.', '.k.'], {}],
    bed: [['wwwwwwwwwwww', 'kkkkkkkkkkkk', 'k..........k'], {}],
    coin: [['.yy.', 'yyyy', 'yyyy', '.yy.'], {}],
    suitcase: [['.ff.', 'zzzz', 'zzzz', 'zzzz', 'f..f'], {}],
    mug: [['www.', 'yyyw', 'yyy.', 'yyy.'], {}],
    cloud: [['..www...', '.wwwwww.', 'wwwwwwww', '.wwwwww.'], { w: '#9aa3b5' }],
    cross: [['wwwww', 'wwzww', 'wzzzw', 'wwzww', 'wwwww'], {}],
    sparkle: [['.y.', 'yyy', '.y.'], {}],
    babyb: [['.ss.', 'wssw', 'wwww', '.ww.'], {}],
    box: [['kkkk', 'kyyk', 'kkkk'], {}],
    candle: [['.y.', '.z.', 'www', 'www', 'www'], {}],
    plane: [['....w...', 'wwwwwwww', '...ww...'], { w: '#ffffff' }],
    bubble: [['wwwww', 'wfwfw', 'wwwww', '.w...'], {}],
    smoke: [['.g', 'g.', '.g'], { g: '#b9b4ab' }],
    cig: [['wwwz'], {}]
  };
  const HOBBY_ACT = [[/ゲーム/, 'game'], [/読書|マンガ|資格|語学|俳句/, 'read'], [/楽器|ライブ|フェス/, 'guitar'], [/カラオケ/, 'sing'], [/筋トレ/, 'lift'], [/ジョギング|マラソン|ウォーキング|登山/, 'run'], [/釣り/, 'fish'], [/ゴルフ/, 'golf'], [/料理|お菓子/, 'cook'], [/写真/, 'photo'], [/菜園|盆栽/, 'garden'], [/ダンス/, 'dance'], [/SNS|推し/, 'phone'], [/観戦/, 'cheer'], [/キャンプ/, 'camp'], [/将棋|囲碁|麻雀/, 'shogi'], [/茶道|華道|書道|サウナ|温泉/, 'tea'], [/手芸|ハンドメイド/, 'knit'], [/映画|アニメ/, 'tv']];
  const ACT_LABEL = { love: 'ときめき', baby: '子育て中', celebrate: 'おめでとう！', sick: '療養中', sad: 'しょんぼり', money: 'お金が動いた', travel: 'おでかけ中', drink: '乾杯', smoke: '一服', storm: '災害', move: '引っ越し', talk: 'おしゃべり中', walk: '散歩中', sleep: 'おやすみ中', idle: '', game: 'ゲーム中', read: '読書中', guitar: '演奏中', sing: '熱唱中', lift: '筋トレ中', run: 'ランニング中', fish: '釣り中', golf: 'ゴルフ中', cook: '料理中', photo: '撮影中', garden: '水やり中', dance: 'ダンス中', phone: 'スマホ中', cheer: '応援中', camp: 'キャンプ中', shogi: '対局中', tea: 'ひと休み', knit: '手づくり中', tv: '鑑賞中', ball: '部活中', study: '勉強中', work: '仕事中', crawl: 'はいはい中', play: '遊び中' };
  const PX_SCENE = { q: [], act: 'idle', t: 0, until: 0, x: 40, dir: 1, tx: 40, raf: 0, last: 0, key: '', grid: null };
  // 出来事に合わせた動き（フィードのイラスト分類から決める）
  const EV_ACT = { ring: 'love', love: 'love', stroller: 'baby', baby: 'baby', family: 'baby', graduation: 'celebrate', medal: 'celebrate', cake: 'celebrate', party: 'celebrate', sparkle: 'celebrate', promotion: 'celebrate', certificate: 'celebrate', festival: 'celebrate', award: 'celebrate', hospital: 'sick', stethoscope: 'sick', ribbon: 'sick', elder: 'sick', mask: 'sick', sprout: 'sad', candle: 'sad', heartbreak: 'sad', quit: 'sad', warning: 'sad', yen: 'money', lottery: 'money', 'chart-up': 'money', pachinko: 'money', gacha: 'money', horse: 'money', 'credit-card': 'money', plane: 'travel', bus: 'travel', train: 'travel', car: 'travel', onsen: 'tea', truck: 'move', home: 'move', beer: 'drink', cigarette: 'smoke', earthquake: 'storm', tsunami: 'storm', rain: 'storm', snow: 'storm', study: 'study', school: 'study', randoseru: 'study', exam: 'study', work: 'work', suit: 'work', music: 'sing', concert: 'sing', karaoke: 'sing', idol: 'phone', baseball: 'ball', soccer: 'ball', undokai: 'ball', swim: 'ball', camera: 'photo', cooking: 'cook', book: 'read', manga: 'read', gamepad: 'game', jogging: 'run', mountain: 'run', gym: 'lift', fishing: 'fish', golf: 'golf', garden: 'garden', movie: 'tv', sns: 'phone', smartphone: 'phone', shogi: 'shogi', tea: 'tea', sauna: 'tea', crafts: 'knit', chat: 'talk', bunkasai: 'celebrate', 'pet-dog': 'walk', 'pet-cat': 'idle', shichigosan: 'celebrate', bunka: 'celebrate' };
  function pxEvent(e) {
    if (!e || !S.life) return;
    const l0 = S.life;
    if (PX_SCENE.lock && performance.now() / 1000 < PX_SCENE.lock && e.c !== 'x') return;
    if (window.PXS && e.c !== 'choice-fallback') { const sc = window.PXS.match(e.t || '', S.life); if (sc) return pxShow(sc, e.dur || 5); }
    { const ha = HOBBY_ACT.find(([re]) => re.test(e.t || '')); if (ha && (e.c === 'hobby' || !EV_ACT[iconKey(e)])) { const sp = PX_SCENE, T = performance.now() / 1000; sp.withPar = l0.age <= 12 ? Math.random() < 0.7 : Math.random() < 0.3; sp.scene = null; sp.act = ha[1]; sp.t = T; sp.until = T + (e.dur || 4.5); sp.ev = true; $('#pxLabel').textContent = ACT_LABEL[ha[1]] || ''; return; } }
    if (window.PXS && !EV_ACT[iconKey(e)]) { const sc = window.PXS.byCat(e, S.life); if (sc) return pxShow(sc, e.dur || 4.5); }
    const k = iconKey(e); let act = EV_ACT[k];
    if (['exam', 'graduation', 'yen', 'chart-up', 'lottery'].includes(k) && e.tone === 'bad') act = 'sad';
    if (k === 'exam' && e.tone === 'good') act = 'celebrate';
    if (!act) act = e.tone === 'good' || e.tone === 'award' ? 'celebrate' : e.tone === 'bad' ? 'sad' : null;
    if (!act) return;
    const sp = PX_SCENE, T = performance.now() / 1000;
    sp.scene = null; sp.act = act; sp.t = T; sp.until = T + (e.dur || 4.5); sp.ev = true; sp.withPar = l0.age <= 12 ? Math.random() < 0.85 : Math.random() < 0.4;
    if (['travel', 'move'].includes(act)) { sp.tx = sp.x > 60 ? 6 : 140; sp.dir = sp.tx > sp.x ? 1 : -1; }
    const lb = $('#pxLabel'); if (lb) lb.textContent = ACT_LABEL[act] || '';
  }
  // 家族（配偶者・同居の子ども）もドット絵で
  // 性別は1文字で
  function sexWord(l) { return l.sex === 'M' ? '男' : '女'; }
  // 家族の普段着（シャツ・ニット・ジーンズなど。年ごとに少し変わる）
  function casualWear(sex, k) {
    const M = [['#7a8f6a', '#3b4f7a'], ['#c9c2b4', '#4a4a4a'], ['#5d7d9a', '#8a7a5a'], ['#9a5a4a', '#3b4f7a'], ['#e8e2d4', '#5a6a4a']], F = [['#e0a46a', '#3b4f7a'], ['#f2e6d0', '#8a6a7a'], ['#9fb7d6', '#5a5248'], ['#d98a8a', '#3d4b6a'], ['#b8c9a0', '#6a5a4a']];
    const [top, bot] = (sex === 'F' ? F : M)[Math.abs(k) % 5]; return { top, bot, collar: null, extra: null, skirt: sex === 'F' && k % 2 === 0 };
  }
  function pxFamily(l, all) {
    const out = [], base = { stats: { happy: 70, health: 70, know: 40 }, alive: true, flags: {}, hobbies: [] };
    if (l.spouse && l.spouse.alive) out.push({ ...base, age: Math.max(18, l.age - (l.spouse.diff || 0)), sex: l.spouse.sex || (l.sex === 'M' ? 'F' : 'M'), edu: { stage: 'work' }, job: null, retired: l.age >= 65, side: 'ahead', outfit: casualWear(l.spouse.sex || (l.sex === 'M' ? 'F' : 'M'), l.year + 1) });
    for (const k of l.kids || []) { const ka = l.year - k.by; if (k.alive && ka >= 0 && ka < 20 && out.length < 4) out.push({ ...base, age: ka, sex: k.sex, edu: { stage: ka <= 5 ? 'baby' : ka <= 11 ? 'elem' : ka <= 14 ? 'jhs' : ka <= 17 ? 'hs' : 'univ' }, job: null, side: ka <= 9 && out.filter((m) => m.side === 'ahead').length < 2 ? 'ahead' : 'behind' }); }
    // 子どものころ：両親（離婚していれば一緒に暮らす親と再婚相手）ときょうだい。主人公をはさんで歩く
    if (!l.indep && l.age <= 18 && (all || PX_SCENE.withPar)) {
      const f = l.fam, par = (p, side) => p && p.alive !== false && out.push({ ...base, age: p.age0 + l.age, sex: p.sex, edu: { stage: 'work' }, job: null, retired: p.age0 + l.age >= 65, side, outfit: casualWear(p.sex, l.year) });
      if (!f.divorced || !f.custody) { par(f.father, 'ahead'); par(f.mother, 'behind'); }
      else { const p = f.custody === 'M' ? f.father : f.mother; par(p, 'behind'); if (f.remarried) out.push({ ...base, age: p.age0 + l.age + 2, sex: p.sex === 'M' ? 'F' : 'M', edu: { stage: 'work' }, job: null, side: 'ahead', outfit: casualWear(p.sex === 'M' ? 'F' : 'M', l.year + 3) }); }
      f.siblings.forEach((x) => { const sa = l.age - x.diff; if (x.alive !== false && sa >= 0 && sa <= 18 && out.length < 5) out.push({ ...base, age: sa, sex: x.sex, edu: { stage: sa <= 5 ? 'baby' : sa <= 11 ? 'elem' : sa <= 14 ? 'jhs' : 'hs' }, job: null, side: x.diff < 0 ? 'behind' : 'ahead' }); });
    }
    return out;
  }
  // 背景：住んでいる地域（大都市・地方都市・町・農山漁村）と家
  function pxBack(g, l, W, ground, T) {
    const area = (l.lifestyle && l.lifestyle.area) || 'city', dark = document.documentElement.dataset.theme === 'dark' || (!document.documentElement.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches);
    const c1 = dark ? 'rgba(255,255,255,.07)' : 'rgba(43,38,32,.07)', c2 = dark ? 'rgba(255,255,255,.12)' : 'rgba(43,38,32,.12)';
    g.fillStyle = c1;
    if (area === 'metro') { const hs = [30, 44, 22, 52, 36, 26, 48, 34, 40, 28]; let x = 0; for (let i = 0; x < W; i++) { const h = hs[i % hs.length], w = 14 + (i * 7) % 10; g.fillRect(x, ground - h, w, h); x += w + 2; } g.fillStyle = c2; for (let x2 = 4; x2 < W; x2 += 6) for (let y2 = ground - 40; y2 < ground - 6; y2 += 6) if ((x2 * 7 + y2 * 3) % 5 === 0) g.fillRect(x2, y2, 2, 2); }
    else if (area === 'city') { const hs = [18, 26, 14, 30, 20]; let x = 0; for (let i = 0; x < W; i++) { const h = hs[i % hs.length], w = 16; g.fillRect(x, ground - h, w, h); x += w + 10; g.fillStyle = c2; g.fillRect(x - 6, ground - 10, 4, 10); g.fillRect(x - 8, ground - 14, 8, 6); g.fillStyle = c1; } }
    else if (area === 'town') { for (let x = 4; x < W; x += 34) { g.fillRect(x, ground - 12, 18, 12); g.beginPath(); g.moveTo(x - 2, ground - 12); g.lineTo(x + 9, ground - 20); g.lineTo(x + 20, ground - 12); g.fill(); } }
    else { g.beginPath(); g.moveTo(0, ground); for (let x = 0; x <= W; x += 4) g.lineTo(x, ground - 22 - Math.sin(x / 26) * 10 - Math.sin(x / 9) * 2); g.lineTo(W, ground); g.fill(); g.fillStyle = c2; for (let x = 2; x < W; x += 5) g.fillRect(x, ground - 3, 1, 3); }
    // 雲がゆっくり流れる
    g.fillStyle = c1; const cx = ((T * 4) % (W + 40)) - 40; g.fillRect(cx, 8, 22, 4); g.fillRect(cx + 4, 5, 12, 3);
  }
  window.__pxEvent = pxEvent;
  window.__pxAct = (act) => { PX_SCENE.act = act; PX_SCENE.t = performance.now() / 1000; PX_SCENE.until = 1e12; $('#pxLabel').textContent = ACT_LABEL[act] || ''; }; // 確認用
  window.__phone = (q) => S.life && S.life.queue.push(q); // 確認用
  window.__setAge = (age) => { if (S.life) { S.life.year += age - S.life.age; S.life.age = age; S.life.queue.length = 0; } }; // 確認用
  window.__sheet = (ages, outs) => ages.map((a) => outs.map((o) => { const w = lifeAt(S.life, a); const of = o && window.PXS.OUT[o] ? window.PXS.OUT[o](w) : null; return pixelChar(of ? { ...w, outfit: of } : w, true); })); // 確認用
  window.__life = () => S.life; // 確認用
  window.__dec = (id, q) => S.life && S.life.queue.unshift(Object.assign({ id }, q || {})); // 確認用
  function pxActs(l) {
    const a = l.alive ? l.age : l.deathAge, w = { walk: 3, idle: 2, sleep: a <= 1 ? 6 : a >= 80 ? 3 : 1 };
    if (l.stats.health < 35) w.sleep += 3;
    if (a <= 1) return { sleep: 5, crawl: 4, play: 2 };
    if (a <= 5) Object.assign(w, { play: 3, run: 2 });
    if (a >= 6 && a <= 17) w.study = 1.5;
    if (a >= 6 && a <= 11) w.ball = 2;
    if (l.flags && l.flags.clubType === '運動' && a <= 17) w.ball = 3;
    if (l.flags && /吹奏楽|合唱/.test(l.flags.club || '') && a <= 17) w.guitar = 2;
    if (l.job && !l.retired && a >= 18) w.work = 2;
    for (const h of l.hobbies || []) for (const [re, act] of HOBBY_ACT) if (re.test(h)) w[act] = (w[act] || 0) + 3;
    if (a >= 65) { w.tea = (w.tea || 0) + 1.5; w.garden = (w.garden || 0) + 1; }
    return w;
  }
  function pxPick(w) { let x = Math.random() * Object.values(w).reduce((a, b) => a + b, 0); for (const k in w) { x -= w[k]; if (x <= 0) return k; } return 'idle'; }
  function pxScene() {
    const cv = $('#pxStage'); if (!cv || !S.life) return;
    const box = cv.parentElement, P = 3, Wc = Math.max(120, Math.floor(box.clientWidth)), Hc = 72;
    const k = pxDpr();
    if (cv.width !== Wc * k || cv.height !== Hc * k) { cv.width = Wc * k; cv.height = Hc * k; cv._sc = k; cv.style.width = Wc + 'px'; cv.style.height = Hc + 'px'; pxSnap(cv.getContext('2d')); }
    if (window.ResizeObserver && !cv._ro) { cv._ro = new ResizeObserver(() => { if (Math.abs(Math.floor(box.clientWidth) - parseFloat(cv.style.width)) > 2) pxScene(); }); cv._ro.observe(box); }
    if (PX_SCENE.raf) return;
    PX_SCENE.last = performance.now();
    const loop = (now) => {
      const l = S.life;
      if (!l || !$('#life').classList.contains('active')) { PX_SCENE.raf = 0; return; }
      const dt = Math.min(0.1, (now - PX_SCENE.last) / 1000); PX_SCENE.last = now;
      drawPx(cv, l, now / 1000, dt, P);
      PX_SCENE.raf = requestAnimationFrame(loop);
    };
    PX_SCENE.raf = requestAnimationFrame(loop);
  }
  // ドット絵の人を1人描く（ポーズつき）
  function drawFig(g, gd, x, ground, P, o) {
    const pose = o.pose || 'stand', step = o.step || 0, flip = !!o.flip, legs = gd.R - gd.hand - 1;
    let dy = 0; if (pose === 'jump') dy = -Math.round(Math.abs(Math.sin(o.T * 7)) * 8); else if (pose === 'stand') dy = (Math.floor(o.T * 1.5 + (o.ph || 0)) % 2) * -0.5;
    const bowing = pose === 'bow' && Math.floor((o.e || 0) * 0.7) % 2 === 0;
    const sit = pose === 'sit';
    const top = ground - gd.R * P + dy + (sit ? (legs - 1) * P : 0);
    for (let y = 0; y < gd.R; y++) {
      const row = gd.rows[y]; if (!row) continue;
      const isLeg = y > gd.hand;
      if (sit && isLeg && y < gd.R - 1) continue;
      row.forEach((c, xx0) => {
        if (!c) return;
        let xx = xx0, yy = y;
        if ((pose === 'walk' || pose === 'run') && y >= gd.R - 2 && step) xx += xx0 < gd.G / 2 ? -1 : 1;
        if (bowing && y <= gd.hand) { xx += Math.round((gd.hand - y) / 3); yy += 1; } // 頭と上半身はつぶさず、前に傾けるだけ
        if (sit && y === gd.R - 1) { xx += 2; yy = gd.hand + 1; }
        if (flip) xx = gd.G - 1 - xx;
        g.fillStyle = pxCol(c); g.fillRect(x + xx * P, top + yy * P, P, P);
      });
    }
    return { top, hand: top + gd.hand * P, w: gd.G * P };
  }
  function drawLying(g, gd, bx, ground, P) {
    const by = ground - 3 * P;
    for (let y = 0; y < gd.R; y++) if (gd.rows[y]) gd.rows[y].forEach((c, x) => { if (!c) return; g.fillStyle = pxCol(c); const q = Math.max(2, P - 1); g.fillRect(bx + y * q, by - (x - 2) * q, q, q); });
  }
  function personLike(l, m) {
    const age = m.age < 0 ? l.age : m.age, st = age <= 5 ? 'baby' : age <= 11 ? 'elem' : age <= 14 ? 'jhs' : age <= 17 ? 'hs' : 'work';
    return { age, sex: m.sex, alive: true, stats: { happy: 70, health: 70, know: 40 }, edu: { stage: st }, job: m.job || null, retired: age >= 65, flags: {}, tint: m.tint };
  }
  // 出来事・選択の場面
  function drawScene(g, l, W, H, ground, T, P, prop, sc) {
    const sp = PX_SCENE, e = T - sp.t, X = window.PXS;
    if (sc.shake) g.translate(Math.round(Math.sin(T * 40) * 1.5), 0);
    const h = { Y: l.year || (S.life && S.life.year) || 2026, g, W, gr: ground, T, e, P, r: (x, y, w, hh, c) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), w, hh); }, prop: (n, x, y, pal, f) => prop(n, x, y, pal, f) };
    if (X.BG[sc.bg]) X.BG[sc.bg](h);
    g.fillStyle = 'rgba(43,38,32,.18)'; g.fillRect(0, ground, W, 1);
    sp.sg = sp.sg || {};
    const grid = (who, outName, key) => { const k = key + '|' + outName; if (!sp.sg[k]) { const of = outName && X.OUT[outName] ? X.OUT[outName](who) : null; sp.sg[k] = pixelChar(of ? { ...who, outfit: of } : who, true); } return sp.sg[k]; };
    const WORKBG = ['office', 'meeting', 'factory', 'construction', 'konbini', 'classroom', 'schoolgate', 'juku', 'truck', 'election', 'police', 'care'];
    const mainG = grid(l, sc.out || (WORKBG.includes(sc.bg) ? null : 'home'), 'me' + sp.key);
    let mx = Math.round(W * (sc.x || 0.3));
    if (sc.pose === 'walk' || sc.pose === 'run') mx = Math.round(Math.min(W - mainG.G * P - 4, mx + e * (sc.pose === 'run' ? 26 : 10)));
    const step = Math.floor(T * (sc.pose === 'run' ? 8 : 4)) % 2;
    // 家族・まわりの人
    const others = [];
    const famBg = ['homein', 'park', 'station', 'airport', 'sakura', 'sea', 'snow', 'festival', 'fireworks', 'shrine', 'mountain', 'onsen', 'newhouse', 'truck', 'hospital', 'grave', 'bus', 'lottery'];
    if (sc.fam || ((!l.indep && l.age <= 12 || l.age >= 20) && famBg.includes(sc.bg) && sc.pose !== 'lie')) pxFamily(l, true).forEach((m) => others.push({ who: m, out: sc.out === 'black' ? 'black' : null, pose: sc.pose === 'bow' ? 'bow' : 'stand' }));
    (sc.npc || []).forEach((n) => others.push({ who: personLike(l, n), out: n.outfit || n.out || null, pose: n.pose || 'stand', x: n.x }));
    if (sc.partner) { const sx = (l.spouse && l.spouse.sex) || (l.sex === 'M' ? 'F' : 'M'); others.unshift({ who: personLike(l, { age: -1, sex: sx, tint: '#6f9a6a' }), out: sc.partner === 'casual' ? null : sc.partner, pose: 'stand', x: (sc.x || 0.3) + 0.13 }); }
    let fx = mx + mainG.G * P * 0.75;
    others.forEach((o, i) => {
      const gd2 = grid(o.who, o.out, [o.who.age, o.who.sex, o.who.tint || '', o.who.outfit ? o.who.outfit.top : '', o.who.edu.stage].join());
      const x = o.x != null ? Math.round(W * o.x) : (fx += gd2.G * P * 0.62);
      if (x > W) return;
      drawFig(g, gd2, x, ground, P, { pose: o.pose, T, e, ph: i, flip: o.x != null && o.x > (sc.x || 0.3) });
    });
    // 主人公
    let me;
    if (sc.pose === 'lie') { prop('bed', mx - P, ground - 3 * P, { w: '#f4efe4', k: '#b08a5a' }); drawLying(g, mainG, mx, ground, P); me = { top: ground - 12, hand: ground - 10, w: mainG.R * P * 0.9 }; }
    else me = drawFig(g, mainG, mx, ground, P, { pose: sc.pose, T, e, step });
    const rx = mx + me.w - P, hy = me.hand;
    if (sc.anim) { try { sc.anim(h, { x: mx, top: me.top, hand: me.hand, w: me.w }); } catch (er) { } }
    // 前景の小物
    const cols = ['#c0392b', '#e8b94a', '#5c8a5a', '#7fb3e0', '#d9667a'];
    switch (sc.fx) {
      case 'hearts': for (let k = 0; k < 3; k++) prop('heart', mx + me.w + Math.sin(e * 2 + k * 2) * 10, me.top - 4 - ((e * 12 + k * 9) % 24)); break;
      case 'cloud': prop('cloud', mx + me.w / 2 - 4 * P, me.top - 14); g.fillStyle = '#7fb3e0'; for (let k = 0; k < 4; k++) g.fillRect(mx + me.w / 2 - 8 + k * 6, me.top - 1 + ((e * 30 + k * 7) % 14), 1, 3); break;
      case 'confetti': for (let k = 0; k < 22; k++) { g.fillStyle = cols[k % 5]; g.fillRect((k * 29 + Math.sin(e * 3 + k) * 6) % W, (k * 17 + e * 30) % (ground - 4), 3, 3); } break;
      case 'sakura': for (let k = 0; k < 14; k++) { g.fillStyle = '#f4b6c2'; g.fillRect((k * 41 + T * 14) % W, (k * 17 + T * 18) % ground, 2, 2); } break;
      case 'bouquet': prop('sparkle', rx, hy - 4 * P); g.fillStyle = '#d9667a'; g.fillRect(rx, hy - 2 * P, 3 * P, 2 * P); g.fillStyle = '#e8b94a'; g.fillRect(rx + P, hy - 3 * P, P, P); g.fillStyle = '#5c8a5a'; g.fillRect(rx + P, hy, P, 2 * P); break;
      case 'diploma': g.fillStyle = '#ffffff'; g.fillRect(rx - P, hy - 2 * P, 5 * P, 2 * P); g.fillStyle = '#c0392b'; g.fillRect(rx + P, hy - 2 * P, P, 2 * P); for (let k = 0; k < 10; k++) { g.fillStyle = cols[k % 5]; g.fillRect((k * 31 + e * 10) % W, (k * 13 + e * 26) % ground, 2, 2); } break;
      case 'counter': g.fillStyle = '#b08a5a'; g.fillRect(mx - 10, ground - 14, me.w + 20, 14); g.fillStyle = '#8a6a45'; g.fillRect(mx - 10, ground - 14, me.w + 20, 2); g.fillStyle = '#6b6b6b'; g.fillRect(mx - 8, ground - 22, 10, 8); g.fillStyle = '#7ee08a'; g.fillRect(mx - 6, ground - 20, 6, 2); break;
      case 'tray': g.fillStyle = '#9aa3b5'; g.fillRect(rx - P, hy - P, 6 * P, P); prop('mug', rx, hy - 5 * P); break;
      case 'book': prop('book', rx - 2 * P, hy - 3 * P); break;
      case 'medal': g.fillStyle = '#e8b94a'; g.fillRect(mx + me.w / 2 - 3, me.top + 22, 6, 6); g.fillStyle = '#c0392b'; g.fillRect(mx + me.w / 2 - 1, me.top + 16, 2, 6); prop('sparkle', mx + me.w + 4, me.top + (Math.floor(e * 4) % 2) * 4); break;
      case 'pack': g.fillStyle = '#c0392b'; g.fillRect(mx - 3, hy - 6 * P, 3 * P, 5 * P); break;
      case 'suitcase': prop('suitcase', mx + me.w, ground - 5 * P); break;
      case 'box': prop('box', rx - P, hy - 2 * P); break;
      case 'baby': prop('babyb', rx - 2 * P, hy - 3 * P + (Math.floor(e * 2) % 2)); prop('heart', mx + me.w / 2, me.top - 8 - (e * 6) % 10); break;
      case 'wheelchair': g.strokeStyle = '#6b6b6b'; g.lineWidth = 2; g.beginPath(); g.arc(mx + me.w / 2, ground - 7, 7, 0, Math.PI * 2); g.stroke(); break;
      case 'question': g.fillStyle = '#9aa3b5'; g.font = 'bold 12px sans-serif'; g.fillText('?', mx + me.w + 2 + Math.sin(e * 3) * 2, me.top + 4); break;
      case 'coins': for (let k = 0; k < 6; k++) prop('coin', mx - 12 + k * 10, ((e * 40 + k * 13) % (ground - 10)) - 6); break;
      case 'mug': prop('mug', rx - P, hy - (Math.floor(e * 1.2) % 2 ? 6 : 2) * P); break;
      case 'notes': for (let k = 0; k < 2; k++) prop('note', mx + me.w + 4 + k * 12 + (e * 6) % 10, me.top - (e * 9 + k * 7) % 16); break;
      case 'mic': prop('mic', rx - P, hy - 5 * P); break;
      case 'cake': g.fillStyle = '#ffffff'; g.fillRect(W * 0.6 + 12, ground - 22, 18, 6); g.fillStyle = '#f4b6c2'; g.fillRect(W * 0.6 + 12, ground - 18, 18, 2); g.fillStyle = '#e8b94a'; g.fillRect(W * 0.6 + 16 + (Math.floor(e * 6) % 2), ground - 26, 1, 3); g.fillRect(W * 0.6 + 24, ground - 26, 1, 3); break;
      case 'tea': prop('cup', W * 0.6 + 14, ground - 22); break;
      case 'tv': prop('tv', W * 0.62, ground - 24, { t: ['#7fb3e0', '#a9e0b5', '#f2c9a5'][Math.floor(e * 1.5) % 3] }); break;
      case 'talk': prop('bubble', mx + me.w * 0.55, me.top - 15 + (Math.floor(e * 2) % 2) * 2); break;
    }
    if (l.pet && !l.pet.dead && ['park', 'homein', 'newhouse'].includes(sc.bg)) { const dog = /犬/.test(l.pet.kind || ''); prop(dog ? 'dog' : 'cat', mx - 8 * P, ground - 4 * P + (Math.floor(T * 3) % 2 ? -1 : 0), dog ? { k: '#b08a5a' } : { f: '#6b6b6b' }, false); }
    { const k = g.canvas._sc || 2; g.setTransform(k, 0, 0, k, 0, 0); }
  }
  // 選択肢を選んだら、その場面をすぐ出す
  function pxChoice(d, label, out) {
    if (!window.PXS || !S.life) return;
    PX_SCENE.lock = 0;
    const sc = window.PXS.match(`${label || ''} ${out || ''}`, S.life) || window.PXS.match(d.title || '', S.life);
    if (sc) pxShow(sc, 6);
    else { const ha = HOBBY_ACT.find(([re]) => re.test(`${label} ${out}`)); if (ha) { pxEvent({ t: '', c: 'x' }); const sp = PX_SCENE, T = performance.now() / 1000; sp.scene = null; sp.act = ha[1]; sp.t = T; sp.until = T + 6; $('#pxLabel').textContent = ACT_LABEL[ha[1]] || ''; } else pxEvent({ t: `${out || ''}${label || ''}`, c: 'choice', tone: 'good' }); }
    PX_SCENE.lock = performance.now() / 1000 + 3.5; PX_SCENE.q.length = 0; // 選んだ場面をしばらく見せる
  }
  function pxShow(sc, dur) {
    const sp = PX_SCENE, T = performance.now() / 1000;
    sp.scene = sc; sp.act = 'scene'; sp.t = T; sp.until = T + (dur || 5); sp.ev = true;
    const lb = $('#pxLabel'); if (lb) lb.textContent = sc.label || '';
  }

  function drawPx(cv, l, T, dt, P) {
    const g = cv.getContext('2d'), sc = cv._sc || 2, W = cv.width / sc, H = cv.height / sc, ground = H - 6, sp = PX_SCENE;
    g.setTransform(sc, 0, 0, sc, 0, 0); g.imageSmoothingEnabled = false; g.clearRect(0, 0, W, H);
    const a = l.alive ? l.age : l.deathAge;
    const key = [a, Math.round(l.stats.happy / 25), l.stats.health < 35, !!l.job, l.edu.stage].join();
    if (key !== sp.key) { if (sp.key.split(',')[0] !== String(a) && !sp.ev) sp.until = Math.min(sp.until, 0); sp.key = key; sp.grid = pixelChar(l, true); }
    const gd = sp.grid, cw = gd.G * P, ch = gd.R * P;
    // 次の行動
    if (T > sp.until && sp.q.length && !(sp.lock && T < sp.lock)) {
      // 1年の長さを、その年の出来事の数で分けて順番に見せる
      const yr = interval() / 1000, per = Math.max(1.4, Math.min(5, yr / Math.max(1, sp.q.length)));
      const ev = sp.q.shift(); pxEvent({ ...ev, dur: per, c: ev.c === 'x' ? 'story' : ev.c });
      // いま絵にしている出来事を、下の一覧でも示す
      const idx = l.log.indexOf(ev); $$('#feed li.pxnow').forEach((x) => x.classList.remove('pxnow')); const li = idx >= 0 && $(`#feed li[data-i="${idx}"]`); if (li) li.classList.add('pxnow');
    }
    if (T > sp.until) {
      sp.withPar = l.age <= 6 ? Math.random() < 0.9 : l.age <= 12 ? Math.random() < 0.6 : Math.random() < 0.35;
      sp.ev = false; sp.scene = null; sp.act = l.alive ? pxPick(pxActs(l)) : 'sleep'; sp.t = T; sp.until = T + 3 + Math.random() * 4;
      if (l.alive && window.PXS && Math.random() < 0.45) { const ds = window.PXS.daily(l), tw = ds.reduce((t, d) => t + d.w, 0); let x = Math.random() * tw; const pick = ds.find((d) => (x -= d.w) <= 0); if (pick) { sp.scene = pick; sp.act = 'scene'; sp.until = T + 5 + Math.random() * 3; } }
      if (['walk', 'run', 'crawl'].includes(sp.act)) { sp.tx = 4 + Math.random() * Math.max(10, W - cw - 30); sp.dir = sp.tx > sp.x ? 1 : -1; }
      $('#pxLabel').textContent = sp.scene ? sp.scene.label || '' : ACT_LABEL[sp.act] || '';
    }
    const prop0 = (name, x, y, pal, flip) => { const [m, extra] = PROPS[name]; const pl = { ...extra, ...(pal || {}) }; m.forEach((row, j) => [...row].forEach((c, i) => { if (c === '.') return; g.fillStyle = pl[c] || pxCol(c); g.fillRect(x + (flip ? (row.length - 1 - i) : i) * P, y + j * P, P, P); })); };
    if (sp.act === 'scene' && sp.scene && window.PXS) return drawScene(g, l, W, H, ground, T, P, prop0, sp.scene);
    const act = sp.act, e = T - sp.t, step = Math.floor(T * (act === 'run' ? 8 : 4)) % 2;
    if (['walk', 'run', 'crawl'].includes(act)) {
      const v = (act === 'run' ? 40 : act === 'crawl' ? 8 : a >= 75 ? 9 : 16);
      if (Math.abs(sp.tx - sp.x) > 1) sp.x += Math.sign(sp.tx - sp.x) * v * dt; else sp.until = Math.min(sp.until, T + 0.6);
    }
    { const fm = pxFamily(l), u = gd.G * P * 0.62, nA = fm.filter((m) => m.side === 'ahead').length, nB = fm.length - nA, back = nB * u, front = nA * u + (nA ? cw * 0.4 : 0);
      const lo = 2 + (sp.dir < 0 ? front : back), hi = W - cw - 22 - (sp.dir < 0 ? back : front); sp.x = Math.max(lo, Math.min(Math.max(lo, hi), sp.x)); sp.tx = Math.max(lo, Math.min(Math.max(lo, hi), sp.tx)); }
    pxBack(g, l, W, ground, T);
    // 地面
    g.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--line') || '#ddd'; g.fillRect(0, ground, W, 1);
    if (act === 'storm') { g.fillStyle = 'rgba(127,179,224,.6)'; for (let k = 0; k < 40; k++) { const rx2 = (k * 37 + T * 90) % W, ry2 = (k * 23 + T * 160) % ground; g.fillRect(rx2, ry2, 1, 4); } }
    const prop = (name, x, y, pal, flip) => { const [m, extra] = PROPS[name]; const pl = { ...extra, ...(pal || {}) }; m.forEach((row, j) => [...row].forEach((c, i) => { if (c === '.') return; g.fillStyle = pl[c] || pxCol(c); g.fillRect(x + (flip ? (row.length - 1 - i) : i) * P, y + j * P, P, P); })); };
    if (act === 'sick') {
      prop('cross', 6, ground - 30, {});
    }
    if (act === 'sleep' || act === 'sick') {
      // 横になって眠る（体を90度倒して描く）
      const bx = sp.x, by = ground - 3 * P;
      prop('bed', bx - P, by, { w: '#f4efe4', k: '#b08a5a' });
      for (let y = 0; y < gd.R; y++) if (gd.rows[y]) gd.rows[y].forEach((c, x) => { if (!c) return; g.fillStyle = pxCol(c); const q = Math.max(2, P - 1); g.fillRect(bx + y * q, by - (x - 2) * q, q, q); });
      const zf = e % 2.4; g.globalAlpha = Math.max(0, 1 - zf / 2.4); prop('z', bx + gd.R * P * 0.9 * 0.2 - 4, by - 18 - zf * 6, {}); g.globalAlpha = 1;
      return;
    }
    // 体の上下（呼吸・はずみ）
    const bob = act === 'dance' || act === 'cheer' ? (Math.floor(T * 4) % 2) * -2 * P / 3 : act === 'run' || act === 'play' || act === 'ball' ? step * -1 : (Math.floor(T * 1.5) % 2) * -0.5;
    const flip = sp.dir < 0 && ['walk', 'run', 'crawl'].includes(act) ? true : act === 'dance' ? Math.floor(T * 2) % 2 === 1 : false;
    const ox = Math.round(sp.x), oy = ground - ch + bob + (act === 'celebrate' ? -Math.abs(Math.sin(T * 7)) * 8 : 0), cxp = gd.G / 2;
    // 家族：うしろをついて歩く
    const fam = pxFamily(l); sp.famG = sp.famG || {}; let nA = 0, nB = 0;
    fam.forEach((m, i) => {
      const k = [m.age, m.sex, m.edu.stage, m.tint || '', m.job ? m.job.title : '', m.outfit ? m.outfit.top : ''].join(); const fg = sp.famG[k] || (sp.famG[k] = pixelChar(m, true));
      const ahead = m.side === 'ahead', n = ahead ? ++nA : ++nB, u = fg.G * P * 0.62;
      const off = ahead ? (cw * 0.4 + (n - 1) * u + u * 0.6) * (flip ? -1 : 1) : n * u * (flip ? 1 : -1), fx = Math.round(ox + off + (flip && !ahead ? cw * 0.35 : 0)), fy = ground - fg.R * P + (step && ['walk', 'run'].includes(act) && i % 2 === 0 ? -1 : 0);
      if (fx < -fg.G * P || fx > W) return;
      for (let y = 0; y < fg.R; y++) if (fg.rows[y]) fg.rows[y].forEach((c, x) => { if (!c) return; let xx = x; if (['walk', 'run'].includes(act) && y >= fg.R - 2 && step) xx += x < fg.G / 2 ? -1 : 1; if (flip) xx = fg.G - 1 - xx; g.fillStyle = pxCol(c); g.fillRect(fx + xx * P, fy + y * P, P, P); });
    });
    for (let y = 0; y < gd.R; y++) if (gd.rows[y]) gd.rows[y].forEach((c, x) => {
      if (!c) return;
      let xx = x;
      if (['walk', 'run', 'dance'].includes(act) && y >= gd.R - 2 && step) xx += x < cxp ? -1 : 1; // 足を開いて歩く
      if (flip) xx = gd.G - 1 - xx;
      g.fillStyle = pxCol(c); g.fillRect(ox + xx * P, oy + y * P, P, P);
    });
    const hx = ox + (flip ? 0 : cw - 3 * P), hy = oy + gd.hand * P, rx = ox + cw - P; // 手の位置
    const osc = Math.sin(e * 6);
    switch (act) {
      case 'read': case 'study': prop('book', rx - 2 * P, hy - 3 * P); if (act === 'study') prop('note', rx + 4 * P, hy - 9 * P - (Math.floor(e * 2) % 2) * 2); break;
      case 'game': prop('game', rx - 2 * P, hy - 2 * P, { t: Math.floor(e * 3) % 2 ? '#7fb3e0' : '#a9e0b5' }); break;
      case 'guitar': prop('guitar', rx - 3 * P, hy - 3 * P + (Math.floor(e * 4) % 2)); prop('note', rx + 6 * P, hy - 10 * P - (e * 8) % 14); break;
      case 'sing': prop('mic', rx - P, hy - 5 * P); prop('note', rx + 3 * P + (e * 6) % 12, hy - 10 * P - (e * 9) % 14); break;
      case 'lift': prop('dumbbell', rx - 2 * P, hy - (Math.floor(e * 1.5) % 2 ? 9 : 2) * P); break;
      case 'fish': { prop('rod', rx - P, hy - 7 * P); const tx = rx + 6 * P, ty = hy - 7 * P; g.fillStyle = '#8a6a45'; for (let k = 0; k < 8; k++) g.fillRect(tx + k * 0.6, ty + k * 3, 1, 3); g.fillStyle = '#c0392b'; g.fillRect(tx + 5, ground - 2 + Math.round(osc), 3, 3); g.fillStyle = '#7fb3e0'; g.fillRect(tx - 6, ground + 1, 26, 2); break; }
      case 'golf': { const sw = Math.floor(e * 1.2) % 2; g.save(); g.translate(rx, hy); g.rotate(sw ? -2.2 : 0.5); prop('golf', -P, -P, {}); g.restore(); g.fillStyle = '#fff'; g.fillRect(rx + 4 * P + (sw ? e % 1 * 40 : 0), ground - 3 - (sw ? (e % 1) * 20 : 0), 3, 3); break; }
      case 'cook': prop('pot', rx, hy - P); g.globalAlpha = 0.5; g.fillStyle = '#b9b4ab'; for (let k = 0; k < 3; k++) g.fillRect(rx + P * (1 + k * 1.4) + Math.sin(e * 3 + k) * 2, hy - 4 * P - ((e * 10 + k * 5) % 14), 2, 3); g.globalAlpha = 1; break;
      case 'photo': prop('camera', rx - P, hy - 4 * P); if (Math.floor(e * 1.3) % 3 === 0) { g.fillStyle = 'rgba(255,240,170,.85)'; g.fillRect(rx + 4 * P, hy - 7 * P, 6, 6); } break;
      case 'garden': prop('can', rx, hy - P); prop('sprout', rx + 7 * P, ground - 3 * P - (e > 2 ? P : 0)); g.fillStyle = '#7fb3e0'; for (let k = 0; k < 3; k++) g.fillRect(rx + 5 * P + k * 2, hy + P + ((e * 20 + k * 4) % 10), 1, 2); break;
      case 'phone': if (((S.life && S.life.year) || 2026) < 1997) prop('book', rx - P, hy - 3 * P); else prop('phone', rx - P, hy - 3 * P, { t: '#a9c7e6' }); if (Math.floor(e * 2) % 2) prop('heart', rx + 3 * P, hy - 9 * P - (e * 4) % 8); break;
      case 'cheer': prop('flag', rx - P, hy - 9 * P + (Math.floor(e * 4) % 2) * P); break;
      case 'camp': prop('fire', rx + 4 * P, ground - 3 * P, { z: Math.floor(e * 6) % 2 ? '#e0604c' : '#e8b94a' }); break;
      case 'shogi': prop('board', rx + P, hy - P); break;
      case 'tea': prop('cup', rx - P, hy - 2 * P); g.globalAlpha = 0.5; g.fillStyle = '#b9b4ab'; g.fillRect(rx + Math.sin(e * 3) * 2, hy - 4 * P - (e * 6) % 8, 2, 3); g.globalAlpha = 1; break;
      case 'knit': prop('knit', rx - P, hy - 2 * P + (Math.floor(e * 3) % 2)); break;
      case 'tv': prop('tv', rx + 3 * P, ground - 8 * P, { t: ['#7fb3e0', '#a9e0b5', '#f2c9a5'][Math.floor(e * 1.5) % 3] }); break;
      case 'ball': case 'play': { const bh = Math.abs(Math.sin(e * 4)) * 14; prop(a <= 5 && act === 'play' ? 'rattle' : 'ball', rx + 2 * P, (a <= 5 && act === 'play') ? hy - 4 * P + (Math.floor(e * 5) % 2) * 2 : ground - 4 * P - bh); break; }
      case 'work': prop(a >= 22 && l.job && /会社|事務|銀行|IT|営業|公務員|企画|経理|総務/.test(l.job.title || '') ? 'briefcase' : 'bag', hx, hy); break;
      case 'love': for (let k = 0; k < 3; k++) prop('heart', ox + cw / 2 + Math.sin(e * 2 + k * 2) * 14, oy - 6 - ((e * 12 + k * 9) % 26), {}); break;
      case 'baby': prop('babyb', rx - 2 * P, hy - 3 * P + (Math.floor(e * 2) % 2)); prop('heart', ox + cw / 2, oy - 8 - (e * 6) % 10, {}); break;
      case 'celebrate': { const cols = ['#c0392b', '#e8b94a', '#5c8a5a', '#7fb3e0', '#d9667a']; for (let k = 0; k < 18; k++) { g.fillStyle = cols[k % 5]; g.fillRect((ox - 30 + k * 13 + Math.sin(e * 3 + k) * 6) % W, ((k * 17 + e * 30) % (ground - 4)), 3, 3); } prop('sparkle', ox - 10, oy + (Math.floor(e * 4) % 2) * 4); prop('sparkle', ox + cw + 4, oy + 6 - (Math.floor(e * 4) % 2) * 4); break; }
      case 'sad': { prop('cloud', ox + cw / 2 - 4 * P, oy - 16, {}); g.fillStyle = '#7fb3e0'; for (let k = 0; k < 4; k++) g.fillRect(ox + cw / 2 - 8 + k * 6, oy - 2 + ((e * 30 + k * 7) % 16), 1, 3); break; }
      case 'money': for (let k = 0; k < 6; k++) prop('coin', ox - 12 + k * 10, ((e * 40 + k * 13) % (ground - 10)) - 6, {}); break;
      case 'travel': prop('suitcase', flip ? ox - 4 * P : ox + cw, ground - 5 * P); prop('plane', W - ((e * 50) % (W + 30)), 10, {}); break;
      case 'move': prop('box', hx - P, hy - 2 * P); break;
      case 'drink': prop('mug', rx - P, hy - (Math.floor(e * 1.2) % 2 ? 6 : 2) * P); break;
      case 'smoke': prop('cig', rx, hy - P); g.globalAlpha = 0.6; prop('smoke', rx + 3 * P + Math.sin(e * 2) * 2, hy - 6 * P - (e * 5) % 8); g.globalAlpha = 1; break;
      case 'talk': prop('bubble', ox + cw * 0.55, oy - 15 + (Math.floor(e * 2) % 2) * 2, {}); break;
      case 'walk': if (a >= 6 && a <= 11) break; if (l.job && !l.retired && a >= 22 && a < 65) prop('briefcase', hx, hy); break;
    }
    // ペットがついてくる
    if (l.pet && !l.pet.dead && /犬|猫/.test(l.pet.kind || '')) { const dog = /犬/.test(l.pet.kind), px = ox + (flip ? cw + 2 : -7 * P) ; prop(dog ? 'dog' : 'cat', px, ground - 4 * P + (step && act === 'walk' ? -1 : 0), dog ? { k: '#b08a5a' } : { f: '#6b6b6b' }, !flip); }
  }

  function render() {
    const l = S.life, s = l.stats;
    pxScene();
    { const key = [l.alive ? l.age : l.deathAge, Math.round(s.happy / 25), s.health < 35, !!l.job, l.edu.stage].join(); if (key !== S.pxKey) { S.pxKey = key; $('#sbChar').innerHTML = pixelChar(l); } }
    $('#lName').innerHTML = `<ruby>${esc(l.name.sei)}<rt>${esc(l.name.seiY || '')}</rt></ruby> <ruby>${esc(l.name.mei)}<rt>${esc(l.name.meiY || '')}</rt></ruby><small class="sx ${l.sex}">${l.sex === 'M' ? '男' : '女'}</small>`;
    $('#lWhere').textContent = `${l.pref}${l.city}${l.pref !== l.birthPref ? `（${l.birthPref}生まれ）` : ''}`;
    $('#lAge').textContent = l.alive ? l.age : l.deathAge;
    $('#lYear').textContent = `${l.year}年`;
    showDate(l); const yb = l.alive && S.yr ? 1 : 0; $('#sbAge').textContent = l.alive ? l.age - yb : l.deathAge; $('#sbYear').textContent = `${l.year - yb}年`;
    $('#lStatus').textContent = E.statusLabel(l);
    statBars(l);
    renderCmds(l);
    const m = [];
    const adult = (l.alive ? l.age : l.deathAge) >= 18;
    if (!l.indep) m.push(`家の世帯年収 ${mb('phh', l.fam.parentHH)}${moM(l.fam.parentHH)}`);
    if (l.indep || adult) {
      m.push(`年収 ${mb('inc', l.income + (l.retired && l.pensionAmt ? l.pensionAmt : 0))}${moM(l.income + (l.retired && l.pensionAmt ? l.pensionAmt : 0))}`);
      if (l.hh && l.hh !== l.income) m.push(`世帯 ${mb('hh', l.hh)}${moM(l.hh)}`);
      m.push(`貯蓄 ${mb('sav', l.savings)}`);
      if (l.nisa > 0) m.push(`NISA ${mb('nisa', l.nisa)}`);
      if (l.debt > 0) m.push(`借入 ${mb('debt', l.debt)}`);
      if (l.house && l.house.loanLeft > 0) m.push(`住宅ローン 残り<b>${l.house.loanLeft}年</b>`);
    }
    $('#money').innerHTML = m.map((x) => `<span>${x}</span>`).join('');
    $$('#money b[data-k]').forEach((b) => tweenNum(b, 'm_' + b.dataset.k, +b.dataset.v, (v) => E.fmtMan(Math.round(v)), 1));
    renderFam(); renderMap(); renderSurv(); renderPeers(); renderStat();
  }

  // 家族ひとりずつのプロフィール（ドット絵の顔つき）
  function famCards(l) {
    const f = l.fam, a = l.alive ? l.age : l.deathAge, cards = [], E2 = E;
    const fig = (age, sex, job, happy) => pixelChar({ age, sex, alive: true, stats: { happy: happy == null ? 65 : happy, health: 70, know: 40 }, edu: { stage: age <= 5 ? 'baby' : age <= 11 ? 'elem' : age <= 14 ? 'jhs' : age <= 17 ? 'hs' : 'work' }, job: job || null, retired: age >= 65, flags: {}, outfit: sex === 'F' && age >= 18 ? casualWear('F', age + (happy || 0)) : undefined });
    const relTxt = (v) => E2.relLabel(v == null ? 1 : v);
    const card = (role, name, age, lines, svg, gone) => cards.push(`<div class="fcard${gone ? ' gone' : ''}"><div class="fpx">${svg}</div><div><small>${role}</small><b>${esc(name || '')}</b>${age != null ? `<span class="muted">・${age}</span>` : ''}${lines.filter(Boolean).length ? `<p>${lines.filter(Boolean).join('・')}</p>` : ''}</div></div>`);
    const par = (p, role, key) => {
      if (!p) return;
      const age = p.age0 + a, live = f.divorced && f.custody ? ((f.custody === 'F') === (p.sex === 'F') ? '同居' : f.visits ? '別居（ときどき会う）' : '別居') : l.indep ? '離れて暮らす' : '同居';
      card(role, p.name, p.alive ? `${age}歳` : `${p.deathAge}歳で他界`, [p.alive && p.job ? esc(p.job.title) : '', p.persona ? `性格：${esc(p.persona)}` : '', p.alive ? `${live}・${relTxt((l.rel || {})[key])}` : ''], p.alive ? fig(age, p.sex, p.job) : fig(p.deathAge, p.sex, null, 50), !p.alive);
    };
    par(f.father, '父', 'father'); par(f.mother, '母', 'mother');
    if (f.divorced) cards.push(`<p class="small muted fnote">両親は離婚。${f.custody ? (f.custody === 'F' ? '母' : '父') + 'と暮らしました' : ''}${f.remarried ? '。その後、再婚しました' : ''}。</p>`);
    for (const g of [l.cast && l.cast.gpa, l.cast && l.cast.gma]) if (g) card(g.role, g.name, g.alive ? `${g.age0 + a}歳` : `${g.deathAge}歳で他界`, [g.persona ? esc(g.persona) : ''], fig(g.alive ? g.age0 + a : g.deathAge, g.sex), !g.alive);
    f.siblings.forEach((x) => card(x.rel, x.name, x.alive === false ? '他界' : `${a - x.diff}歳`, [relTxt((l.rel || {})['sib_' + x.name])], fig(Math.max(0, a - x.diff), x.sex), x.alive === false));
    if (l.spouse) card(l.spouse.ss ? 'パートナー' : l.spouse.sex === 'M' ? '夫' : '妻', l.spouse.name, `${l.age + l.spouse.diff}歳`, [l.spouse.inc ? `年収 約${E.fmtMan(l.spouse.inc)}（月 約${(l.spouse.inc / 12).toFixed(1)}万円）` : '', `${l.spouse.year}年に結婚`], fig(l.age + l.spouse.diff, l.spouse.sex, l.spouse.inc ? { title: '会社員' } : null, 70));
    l.kids.forEach((k) => { const ka = l.year - k.by; card(k.sex === 'M' ? '息子' : '娘', k.name, k.alive ? `${ka}歳` : '他界', [k.adopted ? '特別養子縁組' : '', k.grand ? `孫${k.grand}人` : '', relTxt((l.rel || {}).kids)], fig(Math.max(0, ka), k.sex), !k.alive); });
    if (l.pet) cards.push(`<div class="fcard${l.pet.dead ? ' gone' : ''}"><div class="fpx">${l.pet.kind === '犬' ? '🐕' : l.pet.kind === '猫' ? '🐈' : '🐾'}</div><div><small>ペット（${esc(l.pet.kind)}）</small><b>${esc(l.pet.name)}</b><span class="muted">・${l.pet.dead ? '虹の橋へ' : (l.age - l.pet.since) + '年いっしょ'}</span></div></div>`);
    if (l.cast && l.cast.best) cards.push(`<div class="fcard"><div class="fpx">${fig(a, l.cast.best.sex || l.sex)}</div><div><small>親友</small><b>${esc(l.cast.best.name)}</b>${l.cast.best.alive === false ? '<span class="muted">・他界</span>' : ''}</div></div>`);
    return `<div class="fcards">${cards.join('')}</div>`;
  }
  function renderFam() {
    const l = S.life, f = l.fam;
    const rows = [];
    const per = (p) => `${esc(p.name)}・${p.alive ? `${p.age0 + l.age}歳` : `${p.deathAge}歳で他界`}`;
    if (f.father) rows.push(['父', per(f.father) + (f.father.alive && l.age < 25 ? `／${f.father.job.title}` : '') + `<br><span class="small muted">${esc(f.father.persona || '')}</span>`]);
    rows.push(['母', per(f.mother) + (f.mother.alive && l.age < 25 ? `／${f.mother.job.title}` : '') + `<br><span class="small muted">${esc(f.mother.persona || '')}</span>`]);
    if (f.divorced) rows.push(['', `両親は離婚（${f.custody === 'F' ? '母' : '父'}と暮らした）`]);
    f.siblings.forEach((s) => rows.push([s.rel, `${esc(s.name)}・${s.alive === false ? '他界' : (l.age - s.diff) + '歳'}<span class="small muted">・${E.relLabel((l.rel || {})['sib_' + s.name] ?? 1)}</span>`]));
    if (l.pet) rows.push([l.pet.kind, `${esc(l.pet.name)}・${l.age - l.pet.since}歳`]);
    if (l.cast && l.cast.best) rows.push(['親友', `${esc(l.cast.best.name)}${l.cast.best.alive ? '' : '（他界）'}`]);
    if (l.spouse) rows.push([l.spouse.ss ? 'パートナー' : l.spouse.sex === 'M' ? '夫' : '妻', `${esc(l.spouse.name)}・${l.age + l.spouse.diff}歳`]);
    l.kids.forEach((k) => rows.push([k.sex === 'M' ? '息子' : '娘', `${esc(k.name)}・${k.alive ? (l.year - k.by) + '歳' : '他界'}${k.grand ? `（孫${k.grand}人）` : ''}`]));
    const life = [];
    life.push(['住まい', `${l.pref}${l.city}／${l.house ? l.house.type + '（持ち家）' : l.indep ? (l.lifestyle && l.lifestyle.area === 'rural' ? '賃貸アパート' : '賃貸') : f.home}`]);
    if (l.lifestyle) { life.push(['地域', l.lifestyle.areaLabel]); life.push(['家の暮らし', l.lifestyle.classLabel]); }
    if (l.edu.school) life.push(['学校', esc(l.edu.school)]);
    if (l.eduName) life.push(['最終学歴', esc(l.eduName)]);
    if (l.jobHist.length) life.push(['職歴', esc(l.jobHist.slice(-4).join(' → '))]);
    const c = l.cond, hc = [];
    if (c.cancer) hc.push(c.cancer.type + (c.cancer.cured ? '（寛解）' : ''));
    if (c.dm) hc.push('糖尿病'); if (c.hbp) hc.push('高血圧'); if (c.stroke) hc.push('脳梗塞の後遺症'); if (c.dementia) hc.push('認知症'); if (c.depression) hc.push('うつ病');
    if (l.smoker) hc.push('喫煙'); if (l.flags.drink === 'heavy') hc.push(l.flags.alc ? 'アルコール依存症' : '毎日飲酒'); if (l.flags.gamble) hc.push(l.flags.gambleName + (l.flags.gamble === 2 ? '（依存）' : '')); if (l.care) hc.push(['', '要支援', '要介護', '施設入所'][Math.min(l.care, 3)]);
    if (hc.length) life.push(['健康', hc.join('、')]);
    const kv = (a) => `<dl class="kv">${a.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl>`;
    const a = l.alive ? l.age : l.deathAge, b = l.born;
    const av = pixelChar(l); // プロフィールの顔もドット絵で
    const prof = [['生年月日', `${b.y}年${b.m}月${b.d}日（${a}歳）`], ['出身', `${l.birthPref}${l.birthCity}`], ['いま住んでいる所', `${l.pref}${l.city}`], ['いま', esc(E.statusLabel(l))]];
    if (l.eduName) prof.push(['学歴', esc(l.eduName)]);
    if (l.indep || a >= 18) prof.push(['年収', E.fmtMan(l.income + (l.retired && l.pensionAmt ? l.pensionAmt : 0)) + moM(l.income + (l.retired && l.pensionAmt ? l.pensionAmt : 0))]);
    if (l.indep || a >= 18) prof.push(['貯蓄', E.fmtMan(l.savings)]);
    if (l.hobbies && l.hobbies.length) prof.push(['趣味', l.hobbies.map((h) => `${esc(h)} Lv.${Math.max(1, (l.hobbyLv || {})[h] || 1)}`).join('、')]);
    if (l.items && l.items.length) prof.push(['持ち物', l.items.map(esc).join('、')]);
    if (l.friends != null) prof.push(['親しい友人', l.friends ? `${l.friends}人` : 'いない']);
    if (l.sns != null) prof.push(['SNSのフォロワー', `${E.fmtNum(l.sns)}人${l.snsIncome && l.sns >= 1e5 ? `（PR収入 年約${E.fmtMan(l.snsIncome)}）` : ''}`]);
    if (l.traits) { const t = Object.entries(l.traits).sort((x, y) => y[1] - x[1]).slice(0, 2).map(([k]) => E.TRAIT_LABEL[k]); prof.push(['好きなこと', t.join('、') + (l.flags.kyomi ? `（小さいころは${esc(l.flags.kyomi)}に夢中）` : '')]); }
    if (a >= 10 && l.bf) prof.push(['性格', esc(E.bfWords(l.bf))]);
    if (l.congenital && l.congenital.length) prof.push(['生まれつき', l.congenital.map((c) => esc(c[0])).join('、')]);
    if (a < 22) prof.push(['家庭の雰囲気', esc(l.fam.mood)]);
    if (l.dream) prof.push(['子どものころの夢', `${esc(l.dream)}${l.flags.dreamDone ? '（叶った！）' : ''}`]);
    prof.push(['家族', l.spouse ? `${l.spouse.ss ? 'パートナー' : '配偶者'}あり・子ども${l.kids.length}人` : l.kids.length ? `子ども${l.kids.length}人` : a >= 18 ? (l.marriages ? (l.widowed ? '配偶者と死別' : '離婚') : '未婚') : `${l.fam.siblings.length ? 'きょうだい' + l.fam.siblings.length + '人' : 'ひとりっ子'}`]);
    $('#tab-fam').innerHTML = `<div class="profile"><div class="av">${av}</div><div><b>${esc(l.name.sei)} ${esc(l.name.mei)}</b><small>${esc(l.name.seiY || '')} ${esc(l.name.meiY || '')}・${sexWord(l)}</small></div></div>${kv(prof)}<h4>家族</h4>${famCards(l)}<h4>暮らし</h4>${kv(life)}${budgetHTML(l)}` + (l.lifestyle && l.lifestyle.notes.length ? `<h4>この家の日常</h4><ul class="small">${l.lifestyle.notes.map((n) => `<li>${esc(n)}</li>`).join('')}</ul>` : '');
  }

  function budgetHTML(l) {
    const B = l.budget; if (!l.indep || !B) return '';
    const rows = Object.entries(B.M).sort((x, y) => y[1] - x[1]).map(([k, v]) => `<dt>${k}</dt><dd>${v.toFixed(1)}万円</dd>`).join('');
    const bal = B.netM - B.totalM;
    return `<h4>家計（1か月）</h4><dl class="kv"><dt><b>手取り</b></dt><dd><b>${B.netM.toFixed(1)}万円</b></dd>${rows}<dt><b>収支</b></dt><dd><b style="color:${bal >= 0 ? 'var(--good)' : 'var(--bad)'}">${bal >= 0 ? '+' : ''}${bal.toFixed(1)}万円</b></dd></dl><p class="small muted">総務省「家計調査」の費目をもとに、世帯人数・地域・収入から計算しています。${l.commute ? `通勤は片道約${l.commute}分。` : ''}</p>`;
  }
  function hue(h) { return `hsl(${Math.round(10 + h * 1.3)}, 45%, ${50}%)`; }
  function renderMap() {
    const l = S.life, max = Math.max(100, l.age + 1);
    let h = '';
    for (let a = 0; a < max; a++) {
      const sn = l.snaps[a];
      if (sn && !sn.alive) h += `<span class="dead" title="${a}歳：死去"></span>`;
      else if (sn) h += `<span style="background:${hue(sn.happy)}" title="${a}歳（${sn.year}年）：${esc(sn.st)}／幸福${sn.happy}"></span>`;
      else h += `<span class="${a === l.age ? 'cur' : ''}"></span>`;
    }
    $('#tab-map').innerHTML = `<p class="small muted">1マス＝1年。色は幸福度（赤いほど低く、緑ほど高い）。</p><div class="lifemap">${h}</div>`;
  }

  // ---------- 統計・研究タブ ----------
  // 全国の平均給与（国税庁「民間給与実態統計調査」2023年、1年を通じて勤務した給与所得者、万円）
  const WAGE_AGE = [[19, 112], [24, 267], [29, 394], [34, 431], [39, 466], [44, 501], [49, 521], [54, 540], [59, 545], [64, 445], [69, 354], [200, 293]];
  const WAGE_ALL = { M: 569, F: 316 };
  function natPref(k) { let w = 0, t = 0; for (const p of E.PREFS) if (p[k] != null && p.p) { w += p.p; t += p.p * p[k]; } return w ? t / w : null; }
  function renderStat() {
    const l = S.life; if (!l || !$('#statLive')) return;
    const a = l.alive ? l.age : l.deathAge, P = E.prefByName(l.pref) || {}, F = l.sex === 'F';
    const row = (k, me, jp, src) => `<tr><th>${k}</th><td>${me}</td><td>${jp}</td><td class="src">${src || ''}</td></tr>`;
    const f1 = (v, d = 1) => (v == null || isNaN(v) ? '—' : (+v).toFixed(d));
    const wage = (WAGE_AGE.find(([hi]) => a <= hi) || [0, 0])[1];
    const inc = l.job && !l.retired ? Math.round(l.income || 0) : 0;
    const rows = [
      row('同じ年生まれで生きている割合', `${f1(E.survivalPct(l.sex, a))}%`, '—', '簡易生命表'),
      row('平均余命', l.alive ? `あと${f1(E.lifeExp(l.sex, a))}年` : '—', `0歳で${f1(E.lifeExp(l.sex, 0))}年`, '令和5年簡易生命表'),
      row('年収（本人）', inc ? E.fmtMan(inc) + moM(inc) : '—', `${a}歳前後の平均 ${wage}万円（${F ? '女性' : '男性'}全体 ${WAGE_ALL[l.sex]}万円）`, '民間給与実態統計調査 2023'),
      row('家の世帯年収', l.age < 20 && l.fam ? E.fmtMan(l.fam.parentHH) + moM(l.fam.parentHH) : '—', '全世帯の中央値 405万円', '国民生活基礎調査 2023'),
      row('貯蓄', E.fmtMan(Math.round(l.savings || 0)), '—', '')
    ];
    const prow = (k, key, unit, d, src) => row(k, `${f1(P[key], d)}${unit}`, `${f1(natPref(key), d)}${unit}`, src);
    const prefRows = [
      prow('大学進学率', 'u', '%', 1, '学校基本調査'),
      row('平均寿命', `${f1(F ? P.le_f : P.le_m)}年`, `${f1(natPref(F ? 'le_f' : 'le_m'))}年`, '都道府県別生命表 2020'),
      prow('合計特殊出生率', 'tfr', '', 2, '人口動態統計'),
      prow('持ち家率', 'own', '%', 1, '住宅・土地統計調査'),
      prow('三世代同居率', 'gen3', '%', 1, '国勢調査'),
      row('喫煙率', `${f1(F ? P.smk_f : P.smk_m)}%`, `${f1(natPref(F ? 'smk_f' : 'smk_m'))}%`, '国民生活基礎調査'),
      row('50歳時の未婚割合', `${f1(F ? P.um_f : P.um_m)}%`, `${f1(natPref(F ? 'um_f' : 'um_m'))}%`, '国勢調査 2020'),
      prow('完全失業率', 'unemp', '%', 1, '労働力調査'),
      row('1人あたり県民所得', `${f1(P.incpc / 10, 0)}万円`, `${f1(natPref('incpc') / 10, 0)}万円`, '県民経済計算'),
      prow('自殺死亡率（10万人あたり）', 'sui', '', 1, '人口動態統計')
    ];
    $('#statLive').innerHTML = `<h4>いまの${esc(l.name.mei)}と日本</h4><table class="stt"><tr><th></th><th>この人</th><th>日本全体</th><th></th></tr>${rows.join('')}</table>
      <h4>${esc(l.pref)}と全国</h4><table class="stt"><tr><th></th><th>${esc(l.pref)}</th><th>全国</th><th></th></tr>${prefRows.join('')}</table>
      <p class="small muted">全国の値は、都道府県の値を人口で重みづけした平均です。数値は「何が実際のデータなのか」のページにある出典にもとづきます。</p>`;
    // この人生で出会った統計（出来事の注）
    const seen = new Set(), notes = [];
    for (let i = l.log.length - 1; i >= 0 && notes.length < 200; i--) { const e = l.log[i]; if (e.note && !seen.has(e.note)) { seen.add(e.note); notes.push(e); } }
    $('#statNotes').innerHTML = `<h4>この人生で出会った統計（${notes.length}件）</h4>` + (notes.length ? `<ul class="stnotes">${notes.map((e) => `<li><span class="muted">${e.age}歳</span> ${esc(e.note)}<br><small class="muted">← ${esc(e.t)}</small></li>`).join('')}</ul>` : '<p class="small muted">まだありません。</p>');
    if (!$('#labRun')) renderLab();
  }
  // 研究：同じ条件の人生をたくさん走らせて、結果を集計する（モンテカルロ）
  function renderLab() {
    const opts = E.PREFS.map((p) => `<option>${p.n}</option>`).join('');
    $('#statLab').innerHTML = `<h4>研究：たくさんの人生を生きてみる</h4>
      <p class="small muted">条件を決めて、何百人もの人生を一気にシミュレーションし、結果を集計します。このゲームの中の統計がどう生まれるかを確かめられます。</p>
      <div class="labform">
        <label>生まれる場所<select id="labPref"><option value="">全国（出生数どおり）</option>${opts}</select></label>
        <label>性別<select id="labSex"><option value="">両方</option><option value="M">男</option><option value="F">女</option></select></label>
        <label>人数<select id="labN"><option>200</option><option selected>500</option><option>1000</option><option>3000</option></select></label>
        <button class="cta" id="labRun">シミュレーション開始</button>
      </div>
      <div class="labprog" id="labProg" hidden><i></i><span></span></div>
      <div id="labOut"></div>`;
    $('#labRun').addEventListener('click', runLab);
  }
  function runLab() {
    const btn = $('#labRun'); if (S.labBusy) { S.labStop = true; return; }
    const pref = $('#labPref').value || undefined, sex = $('#labSex').value || undefined, N = +$('#labN').value;
    const out = [], t0 = Date.now(), seed0 = (Math.random() * 1e9) | 0, yr = new Date().getFullYear();
    S.labBusy = true; S.labStop = false; btn.textContent = '止める'; $('#labProg').hidden = false;
    const step = () => {
      const end = Date.now() + 40;
      while (out.length < N && Date.now() < end) {
        const i = out.length;
        try { const l = E.createLife({ seed: seed0 + i * 7919, world: E.createWorld(seed0 + i, yr), date: new Date().toISOString(), pref, sex }); E.runAuto(l); out.push(l); } catch (e) { out.push(null); }
      }
      const pr = out.length / N; $('#labProg i').style.width = (pr * 100).toFixed(1) + '%'; $('#labProg span').textContent = `${out.length} / ${N}人`;
      if (out.length < N && !S.labStop) return setTimeout(step, 0);
      S.labBusy = false; btn.textContent = 'もう一度'; labReport(out.filter(Boolean), { pref, sex, sec: (Date.now() - t0) / 1000 });
    };
    step();
  }
  function labReport(L, o) {
    const n = L.length; if (!n) return;
    const pct = (k) => (k / n * 100).toFixed(1) + '%', avg = (f) => L.reduce((t, l) => t + f(l), 0) / n;
    const med = (arr) => { const a = arr.slice().sort((x, y) => x - y); return a.length ? a[a.length >> 1] : 0; };
    const cnt = (f) => L.filter(f).length;
    const causes = {}; L.forEach((l) => { causes[l.deathCause] = (causes[l.deathCause] || 0) + 1; });
    const top = Object.entries(causes).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const univ = (l) => ['U', 'G'].includes(l.eduDone);
    const lived50 = L.filter((l) => l.deathAge >= 50);
    const rows = [
      ['平均寿命（このシミュレーション）', avg((l) => l.deathAge).toFixed(1) + '歳', o.sex ? `生命表 ${E.lifeExp(o.sex, 0).toFixed(1)}歳` : `生命表 男${E.lifeExp('M', 0).toFixed(1)}・女${E.lifeExp('F', 0).toFixed(1)}歳`],
      ['寿命の中央値', med(L.map((l) => l.deathAge)) + '歳', ''],
      ['100歳まで生きた人', pct(cnt((l) => l.deathAge >= 100)), ''],
      ['大学・大学院を卒業', pct(cnt(univ)), '大学進学率 約57%（2024）'],
      ['生涯一度も結婚しなかった（50歳以上まで生きた人）', lived50.length ? (lived50.filter((l) => !l.marriages).length / lived50.length * 100).toFixed(1) + '%' : '—', '男28.3%・女17.8%（2020）'],
      ['離婚を経験', pct(cnt((l) => l.divorces > 0)), ''],
      ['子どもの数（平均）', avg((l) => l.kids.length).toFixed(2) + '人', '合計特殊出生率 1.15（2024）'],
      ['子どものころ親が離婚', pct(cnt((l) => l.fam && l.fam.divorced)), ''],
      ['最高年収の中央値', E.fmtMan(med(L.map((l) => (l.peak && l.peak.income) || 0))), ''],
      ['逮捕された経験', pct(cnt((l) => (l.arrests || 0) > 0)), ''],
      ['住んだ都道府県が2つ以上', pct(cnt((l) => new Set(Object.values(l.snaps).map((x) => x.pref)).size >= 2)), '']
    ];
    // 寿命の分布（5歳ごと）
    const bins = Array(23).fill(0); L.forEach((l) => bins[Math.min(22, Math.floor(l.deathAge / 5))]++);
    const mx = Math.max(...bins), W = 320, Hh = 120;
    const bars = bins.map((b, i) => `<rect x="${8 + i * 13.5}" y="${Hh - 18 - b / mx * (Hh - 28)}" width="11" height="${b / mx * (Hh - 28)}" fill="var(--indigo)"><title>${i * 5}〜${i * 5 + 4}歳：${b}人</title></rect>`).join('') + [0, 20, 40, 60, 80, 100].map((x) => `<text x="${8 + x / 5 * 13.5}" y="${Hh - 4}" font-size="9" fill="var(--muted)">${x}</text>`).join('');
    // 生まれた家の豊かさ別
    const byQ = [1, 2, 3, 4, 5].map((q) => { const g = L.filter((l) => l.lifestyle && l.lifestyle.q === q); return g.length ? `<tr><th>${['', '生活が苦しい', 'やりくりが大変', 'ふつう', 'ゆとりがある', '裕福'][q]}</th><td>${g.length}人</td><td>${(g.reduce((t, l) => t + l.deathAge, 0) / g.length).toFixed(1)}歳</td><td>${(g.filter(univ).length / g.length * 100).toFixed(0)}%</td><td>${E.fmtMan(med(g.map((l) => (l.peak && l.peak.income) || 0)))}</td></tr>` : ''; }).join('');
    S.labLast = L;
    $('#labOut').innerHTML = `<p class="small muted">${o.pref || '全国'}・${o.sex === 'M' ? '男' : o.sex === 'F' ? '女' : '男女'}で${n}人の人生を生きました（${o.sec.toFixed(1)}秒）。</p>
      <table class="stt"><tr><th></th><th>結果</th><th>実際の統計</th></tr>${rows.map(([k, v, r]) => `<tr><th>${k}</th><td>${v}</td><td class="ref">${r}</td></tr>`).join('')}</table>
      <h5>亡くなった年齢の分布</h5><svg viewBox="0 0 ${W} ${Hh}" width="100%" role="img" aria-label="寿命の分布">${bars}</svg>
      <h5>死因の上位</h5><ol class="small">${top.map(([c, k]) => `<li>${esc(c)}　${(k / n * 100).toFixed(1)}%</li>`).join('')}</ol>
      <h5>生まれた家の豊かさと、その後</h5><table class="stt"><tr><th>家の暮らし向き</th><th>人数</th><th>平均寿命</th><th>大卒</th><th>最高年収の中央値</th></tr>${byQ}</table>
      <p><button class="ghost" id="labCsv">結果をCSVで保存</button></p>`;
    $('#labCsv').addEventListener('click', () => {
      const head = ['性別', '出生地', '家の暮らし向き', '享年', '死因', '学歴', '最初の仕事', '最高年収万円', '結婚回数', '離婚回数', '子ども', '親の離婚'];
      const lines = [head.join(',')].concat(S.labLast.map((l) => [l.sex, l.birthPref + l.birthCity, l.lifestyle ? l.lifestyle.q : '', l.deathAge, l.deathCause, l.eduName || l.eduDone || '', l.jobHist[0] || '', (l.peak && l.peak.income) || 0, l.marriages || 0, l.divorces || 0, l.kids.length, l.fam && l.fam.divorced ? 1 : 0].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')));
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + lines.join('\n')], { type: 'text/csv' })); a.download = 'lives.csv'; a.click();
    });
  }
  function renderSurv() {
    const l = S.life, a = l.alive ? l.age : l.deathAge, sx = l.sex;
    const W = 320, H = 170, P = 28;
    let pts = '';
    for (let x = 0; x <= 110; x++) pts += `${P + x / 110 * (W - P - 8)},${H - P - E.survivalPct(sx, x) / 100 * (H - P - 8)} `;
    const cx = P + a / 110 * (W - P - 8), cy = H - P - E.survivalPct(sx, a) / 100 * (H - P - 8);
    const pct = E.survivalPct(sx, a);
    const le = E.lifeExp(sx, a);
    $('#tab-surv').innerHTML = `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="生存曲線">
      <line x1="${P}" y1="${H - P}" x2="${W - 8}" y2="${H - P}" stroke="var(--line)"/><line x1="${P}" y1="8" x2="${P}" y2="${H - P}" stroke="var(--line)"/>
      ${[0, 20, 40, 60, 80, 100].map((x) => `<text x="${P + x / 110 * (W - P - 8)}" y="${H - P + 14}" font-size="9" fill="var(--muted)" text-anchor="middle">${x}</text>`).join('')}
      ${[0, 50, 100].map((y) => `<text x="${P - 4}" y="${H - P - y / 100 * (H - P - 8) + 3}" font-size="9" fill="var(--muted)" text-anchor="end">${y}%</text>`).join('')}
      <polyline points="${pts}" fill="none" stroke="var(--indigo)" stroke-width="2"/>
      <circle cx="${cx}" cy="${cy}" r="5" fill="var(--accent)"/>
    </svg>
    <p>同じ年に生まれた${sx === 'M' ? '男性' : '女性'}のうち、${a}歳まで生きている人は<b>約${pct.toFixed(1)}%</b>。</p>
    ${l.alive ? `<p>${a}歳の平均余命は<b>あと約${le.toFixed(1)}年</b>（${E.lifeExp(sx, 0).toFixed(1)}年＝0歳の平均寿命）。</p>` : ''}
    <p class="small muted">厚生労働省「簡易生命表」による。都道府県・健康状態・喫煙などで個人の死亡率は上下します。</p>`;
  }
  function renderPeers() {
    const l = S.life, a = l.alive ? l.age : l.deathAge;
    $('#tab-peers').innerHTML = `<p class="small muted">同じ日に日本で生まれた約${Math.round(D.BIRTHS_PER_YEAR / 365).toLocaleString()}人のうちの4人。同じ時代の出来事を生きています。</p>` +
      S.peers.map((p) => {
        const sn = p.deathAge < a ? null : p.snaps[a];
        const gone = p.deathAge <= a && (p.deathAge < a || !l.alive || true) && p.deathAge <= a && !(sn && sn.alive);
        const st = gone ? `${p.deathAge}歳で死去（${esc(p.deathCause)}）` : sn ? `${a}歳・${esc(sn.st)}（${esc(sn.pref)}）` : '';
        return `<div class="peer ${gone ? 'gone' : ''}"><b>${esc(p.name.sei)} ${esc(p.name.mei)}</b>　<span class="small">${p.sex === 'M' ? '男性' : '女性'}・${esc(p.birthPref)}${esc(p.birthCity)}生まれ</span><div class="st">${st}</div></div>`;
      }).join('');
  }

  // ---------- 最期 ----------
  // 走馬灯：人生の場面の写真が、順に流れていく
  function somato(l, done) {
    const ph = l._photos || (l._photos = lifePhotos(l));
    if (!ph.length) return done();
    const ov = document.createElement('div'); ov.className = 'somato'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-label', '走馬灯');
    ov.innerHTML = `<div class="smfilm"><div class="smtrack">${ph.map((x) => `<figure><img src="${x.img}" alt=""><figcaption>${x.age}歳</figcaption></figure>`).join('')}</div></div><p class="smcap"></p><div class="smend"></div><div class="smvig"></div><button class="smskip">とばす ▸</button>`;
    document.body.appendChild(ov);
    const track = ov.querySelector('.smtrack'), cap = ov.querySelector('.smcap'), figs = [...track.children];
    let raf = 0, end = false, last = -1, t0 = 0;
    const fin = () => { if (end) return; end = true; cancelAnimationFrame(raf); ov.classList.add('out'); setTimeout(() => { ov.remove(); done(); }, 1200); };
    ov.querySelector('.smskip').addEventListener('click', fin);
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const start = () => {
      const vw = ov.clientWidth, tw = track.scrollWidth, dist = vw + tw, dur = Math.min(18, Math.max(8, ph.length * 1.05)) * 1000;
      const step = (now) => {
        if (!t0) t0 = now;
        const k = Math.min(1, (now - t0) / dur), x = vw - dist * k;
        track.style.transform = `translateX(${x}px)`;
        // 画面の中央を通る写真の出来事を、下に映す
        const c = vw / 2 - x; let idx = -1;
        figs.forEach((f, n) => { if (f.offsetLeft <= c && c < f.offsetLeft + f.offsetWidth + 24) idx = n; f.classList.toggle('mid', n === idx); });
        if (idx !== last && idx >= 0) { last = idx; cap.classList.remove('on'); void cap.offsetWidth; cap.innerHTML = `<b>${ph[idx].age}歳</b>　${esc(ph[idx].t)}`; cap.classList.add('on'); }
        if (k < 1) raf = requestAnimationFrame(step);
        else { cap.innerHTML = ''; ov.querySelector('.smend').innerHTML = `<b>${esc(l.name.sei)} ${esc(l.name.mei)}</b><span>${l.born.y} — ${l.deathYear}</span>`; ov.classList.add('ending'); setTimeout(fin, 3200); }
      };
      raf = requestAnimationFrame(step);
    };
    requestAnimationFrame(() => { ov.classList.add('in'); setTimeout(reduce ? () => { cap.textContent = `${ph.length}の場面`; setTimeout(fin, 2500); } : start, 900); });
  }
  function finish() {
    clearTimeout(S.timer);
    const l = S.life;
    if (l._somatoRun) return;
    if (!l._somatoDone && !l.alive) { l._somatoDone = true; l._somatoRun = true; return somato(l, () => { l._somatoRun = false; finish(); }); }
    const nat = E.lifeExp(l.sex, 0);
    const longer = E.survivalPct(l.sex, l.deathAge + 1);
    const edu = l.eduName || { U: '大学卒', G: '大学院修了', S: '短大・専門学校卒', K: '高専卒', H: '高校卒', J: '中学卒' }[l.eduDone] || (l.deathAge < 15 ? '—' : '中学卒');
    const mainJob = l.jobHist.length ? l.jobHist[0] + (l.jobHist.length > 1 ? ` ほか${l.jobHist.length - 1}社` : '') : '—';
    const gk = l.kids.reduce((t, k) => t + k.grand, 0);
    const prefs = [...new Set(Object.values(l.snaps).map((s) => s.pref))];
    const lines = [];
    lines.push(`${l.born.y}年、${l.birthPref}${l.birthCity}に生まれる。`);
    if (l.eduName) lines.push(`${l.eduName}。`);
    if (l.jobHist.length) lines.push(`${l.jobHist[0]}として働く。`);
    if (l.marriages) lines.push(l.kids.length ? `${l.kids.length}人の子どもを育てる。` : '結婚する。');
    lines.push(`${l.deathYear}年、${l.deathAge}歳で亡くなる。`);
    const summary = { at: Date.now(), name: `${l.name.sei} ${l.name.mei}`, sex: l.sex, pref: l.birthPref, city: l.birthCity, born: l.born.y, age: l.deathAge, cause: l.deathCause, job: l.jobHist[0] || '', kids: l.kids.length, notes: l.notes, sprites: [...new Set([Math.min(20, l.deathAge), l.deathAge])].map((a) => spriteAt(l, a)) };
    const first = !l._recorded; l._recorded = true; // finish() が2回呼ばれても、記録と公開は1回だけ
    if (first) { const past = store.get('pastLives', []); past.unshift(summary); store.set('pastLives', past.slice(0, 10)); }
    const share = `${TITLE}｜${l.birthPref}${l.birthCity}に生まれ、${l.deathAge}歳で亡くなりました（${l.deathCause}）。${edu}${l.jobHist[0] ? '・' + l.jobHist[0] : ''}${l.kids.length ? '・子ども' + l.kids.length + '人' : ''}。`;
    $('#endBody').innerHTML = `
      <p class="eyebrow">${l.born.y}年 — ${l.deathYear}年</p>
      <h1>${esc(l.name.sei)} ${esc(l.name.mei)}</h1>
      <p class="muted">${l.birthPref}${l.birthCity}生まれ・${l.sex === 'M' ? '男性' : '女性'}</p>
      <p class="epitaph">${lines.map(esc).join('<br>')}</p>
      ${l.lastWords ? `<p class="muted">最後に残したことばは、${esc(l.lastWords)}でした。</p>` : ''}
      <p class="epi2">${esc(l.epitaph || '')}</p>
      ${l.deathCause === '自殺' ? HELP : ''}
      <div class="endstats">
        <div><small>享年</small><b>${l.deathAge}歳</b></div>
        <div><small>死因</small><b>${esc(l.deathCause)}</b></div>
        <div><small>平均寿命との差</small><b>${l.deathAge - nat >= 0 ? '+' : ''}${(l.deathAge - nat).toFixed(1)}年</b></div>
        <div><small>同じ年生まれで、より長生きする人</small><b>約${longer.toFixed(0)}%</b></div>
        <div><small>最終学歴</small><b>${esc(edu)}</b></div>
        <div><small>おもな仕事</small><b style="font-size:15px">${esc(mainJob)}</b></div>
        <div><small>最高年収</small><b>${E.fmtMan(l.peak.income)}</b></div>
        <div><small>最高貯蓄額</small><b>${E.fmtMan(Math.max(0, l.peak.savings))}</b></div>
        <div><small>結婚・子ども・孫</small><b>${l.marriages ? '既婚' : '未婚'}・${l.kids.length}人・${gk}人</b></div>
        <div><small>親しい友人・SNS</small><b style="font-size:15px">${l.friends || 0}人・フォロワー${E.fmtNum(l.sns || 0)}人</b></div>
        ${l.awards && l.awards.length ? `<div><small>おもな受賞歴</small><b style="font-size:14px">${esc(l.awards.slice().sort((x, y) => y.lv - x.lv)[0].t)}</b></div>` : ''}
        <div><small>暮らした都道府県</small><b style="font-size:15px">${prefs.map(esc).join('、')}</b></div>
      </div>
      <h2>死亡記録</h2>
      <p>${esc(deathSummary(l))}</p>
      <div class="endstats">
        <div><small>ともに生きた人</small><b style="font-size:15px">${l.spouse || l.marriages ? esc((l.spouse && l.spouse.name) || '（離別・死別）') : '—'}${l.kids.length ? `・子ども${l.kids.length}人` : ''}</b></div>
        <div><small>最期を見送った人</small><b style="font-size:15px">${esc(seeOff(l))}</b></div>
        <div><small>いちばん幸せだった年</small><b>${l.happiest ? `${l.happiest.age}歳（${l.happiest.year}年）` : '—'}</b></div>
        <div><small>遺した財産</small><b>${E.fmtMan(Math.max(0, (l.savings || 0) + (l.nisa || 0)))}${l.house ? '＋家' : ''}</b></div>
        <div><small>大人になってから時間を注いだこと</small><b style="font-size:14px">${Object.entries(l.focusYears || {}).sort((x, y) => y[1] - x[1]).slice(0, 3).map(([k, v]) => `${k} ${v}年`).join('・') || '—'}</b></div>
      </div>
      ${l.log.some((e) => e.star) ? `<h2>覚えておく瞬間</h2>${l.log.filter((e) => e.star).map((e) => `<p><span class="muted small">${e.age}歳</span>　${esc(e.t)}</p>`).join('')}` : ''}
      <h2>${esc(l.name.mei)}へ贈ることば</h2><textarea id="giftWord" class="gift" maxlength="140" placeholder="（この端末の「過去の人生」に残ります）"></textarea>
      ${l.notes.length ? `<h2>残した思い</h2>${l.notes.map((n) => `<p><span class="muted small">${n.age}歳</span>　${esc(n.t)}</p>`).join('')}` : ''}
      <h2>同じ日に生まれた4人</h2>
      ${S.peers.map((p) => `<div class="peer"><b>${esc(p.name.sei)} ${esc(p.name.mei)}</b>　<span class="small">${p.sex === 'M' ? '男性' : '女性'}・${esc(p.birthPref)}${esc(p.birthCity)}生まれ</span><div class="st">${p.deathAge}歳で死去（${esc(p.deathCause)}）・${esc(p.eduName || '')}${p.jobHist[0] ? '・' + esc(p.jobHist[0]) : ''}${p.kids.length ? '・子ども' + p.kids.length + '人' : ''}</div></div>`).join('')}
      <div class="sharebox" id="shareBox"><p class="muted small">この人生の記録ページを作っています…</p></div>
      <div class="endbtns">
        <button class="cta" id="btnAgain">もう一度生まれる</button>
        <button class="ghost" id="btnShare">結果をコピー</button>
        <button class="ghost" id="btnLog">人生の記録を見る</button>
      </div>
      <ol class="feed" id="endLog" hidden style="max-height:none;flex-direction:column;margin-top:20px"></ol>`;
    if (first) publishLife(l, edu, lines); else if (l._shareHtml) $('#shareBox').innerHTML = l._shareHtml;
    $('#giftWord').addEventListener('change', (e) => { const past = store.get('pastLives', []); if (past[0]) { past[0].gift = e.target.value; store.set('pastLives', past); } });
    $('#btnAgain').addEventListener('click', () => { showResume(); go('home'); });
    $('#btnShare').addEventListener('click', (e) => { navigator.clipboard && navigator.clipboard.writeText(share + ' ' + location.href); e.target.textContent = 'コピーしました'; });
    $('#btnLog').addEventListener('click', () => {
      const el = $('#endLog'); el.hidden = !el.hidden;
      if (!el.hidden && !el.childElementCount) el.innerHTML = l.log.map((e) => `<li class="${e.tone} ${e.c}"><span class="a">${e.age}歳</span><span class="ic" aria-hidden="true">${iconFor(e)}</span>${esc(e.t)}</li>`).join('');
    });
    go('end');
  }

  // 生きた人生を記録ページとして保存し、共有URL（OGカードつき）を出す
  // 生まれた市区町村の代表点（地図の座標を緯度経度に戻す）
  function birthLatLng(l) {
    const J = window.JPMAP; if (!J) return null;
    const p = J.cities[`${l.birthPref}/${l.birthCity}`]; if (!p) return null;
    let [x, y] = p;
    if (l.birthPref === '沖縄県') { x -= J.inset.okinawa.dx; y -= J.inset.okinawa.dy; }
    else if (l.birthPref === '東京都' && /小笠原/.test(l.birthCity)) { x -= J.inset.ogasawara.dx; y -= J.inset.ogasawara.dy; }
    return [+(J.proj.lat0 - y / J.proj.ky).toFixed(4), +(x / J.proj.kx + J.proj.lng0).toFixed(4)];
  }
  function spriteSvg(rows, px) {
    const w = Math.max(1, ...rows.map((r) => (r || []).length));
    let o = ''; rows.forEach((r, y) => (r || []).forEach((c, x) => { if (c && /^#[0-9a-fA-F]{3,8}$/.test(c)) o += `<rect x="${x}" y="${y}" width="1" height="1" fill="${c}"/>`; }));
    return `<svg viewBox="0 0 ${w} ${rows.length}" width="${w * px}" height="${rows.length * px}" shape-rendering="crispEdges" aria-hidden="true">${o}</svg>`;
  }
  // その年齢のころの自分（見た目を描くための近似）
  function lifeAt(l, age) {
    const st = age <= 5 ? 'hoiku' : age <= 11 ? 'elem' : age <= 14 ? 'jhs' : age <= 17 ? 'hs' : 'work';
    return age === (l.alive ? l.age : l.deathAge) ? { ...l, alive: true } : { ...l, age, year: l.born.y + age, alive: true, edu: { ...l.edu, stage: st }, retired: age >= 65, job: age >= 22 && age < 65 ? (l.job || { title: l.jobHist[0] || '', kind: '正社員' }) : null, stats: { ...l.stats, happy: 70, health: 80 }, indep: age >= 22 ? l.indep : false, spouse: age >= 30 ? l.spouse : null };
  }
  // 出来事ごとの「写真」：舞台と同じドット絵の場面を小さな画像にする
  function lifePhotos(l, max = 18) {
    if (!window.PXS) return [];
    // 嬉しい場面を中心に。つらい場面は少しだけ
    const HAPPY = /生まれ|誕生|入学|卒業|合格|結婚|入社|内定|初任給|昇進|優勝|入賞|全国|旅行|孫|マッチング|付き合|告白|夢|ライブ|当た|お祝い|二十歳|還暦|喜寿|米寿|百寿|再会|ほめ|新しい家|家を買|マイホーム|運動会|修学旅行|花火|初詣|ディズニー|海外/;
    const sad = (e) => e.tone === 'bad' || e.tone === 'grave';
    const pri = (e) => (e.star ? 4 : 0) + (e.c === 'death' ? 5 : 0) + (e.tone === 'award' ? 3.5 : e.tone === 'good' ? 2.5 : e.tone === 'grave' ? 1.2 : e.tone === 'bad' ? 0.6 : 0) + (HAPPY.test(e.t) && !sad(e) ? 1.5 : 0);
    const cand = l.log.filter((e) => e.t && !['note', 'chapter'].includes(e.c) && pri(e) > 0).map((e) => ({ e, p: pri(e) + Math.random() * 0.9 })).sort((a, b) => b.p - a.p);
    const picked = [];
    for (const { e } of cand) {
      if (picked.length >= max) break;
      const who = lifeAt(l, e.age), sc = window.PXS.match(e.t, who); if (!sc) continue;
      const key = (sc.label || '') + sc.bg;
      if (picked.some((x) => x.key === key && Math.abs(x.e.age - e.age) < 8) || picked.filter((x) => Math.abs(x.e.age - e.age) < 2).length >= 2) continue;
      if (sad(e) && e.c !== 'death' && !e.star && picked.filter((x) => sad(x.e)).length >= 4) continue;
      picked.push({ e, sc, who, key });
    }
    picked.sort((a, b) => a.e.age - b.e.age || l.log.indexOf(a.e) - l.log.indexOf(b.e));
    const sp = PX_SCENE, saved = { t: sp.t, key: sp.key, withPar: sp.withPar }, lb = $('#pxLabel'), lbT = lb ? lb.textContent : '';
    const out = [];
    for (const { e, sc, who } of picked) {
      try {
        const W = 180, Hc = 76, k = 2, P = 3, cv = document.createElement('canvas'); cv.width = W * k; cv.height = Hc * k; cv._sc = k;
        const g = cv.getContext('2d'); pxSnap(g); g.imageSmoothingEnabled = false; g.setTransform(k, 0, 0, k, 0, 0);
        g.fillStyle = '#f6f2ea'; g.fillRect(0, 0, W, Hc);
        const prop = (name, x, y, pal, flip) => { const [m, extra] = PROPS[name]; const pl = { ...extra, ...(pal || {}) }; m.forEach((row, j) => [...row].forEach((c, i) => { if (c === '.') return; g.fillStyle = pl[c] || pxCol(c); g.fillRect(x + (flip ? (row.length - 1 - i) : i) * P, y + j * P, P, P); })); };
        sp.t = 0; sp.key = 'photo' + e.age; sp.withPar = e.age <= 12;
        drawScene(g, who, W, Hc, Hc - 6, 1.3, P, prop, sc);
        out.push({ age: e.age, t: e.t, label: sc.label || '', img: cv.toDataURL('image/png') });
      } catch (er) { }
    }
    Object.assign(sp, saved); if (lb) lb.textContent = lbT;
    return out;
  }
  function spriteAt(l, age) {
    const who = lifeAt(l, age);
    const g = pixelChar(who, true);
    return { age, rows: g.rows.map((r) => (r || []).map((c) => (c ? pxCol(c) : ''))) };
  }
  document.addEventListener('click', (e) => { if (e.target.id !== 'shareCopy') return; const u = $('#shareUrl'); if (u && navigator.clipboard) navigator.clipboard.writeText(u.value); e.target.textContent = 'コピーしました'; });
  document.addEventListener('focusin', (e) => { if (e.target.id === 'shareUrl') e.target.select(); });
  async function publishLife(l, edu, lines) {
    const box = $('#shareBox'); if (!box) return;
    const past = store.get('pastLives', []);
    try {
      const ages = [...new Set([Math.min(6, l.deathAge), Math.min(30, l.deathAge), l.deathAge])];
      const rec = {
        sei: l.name.sei, mei: l.name.mei, seiY: l.name.seiY, meiY: l.name.meiY, sex: l.sex, pref: l.birthPref, city: l.birthCity,
        bornY: l.born.y, bornM: l.born.m, bornD: l.born.d, deathYear: l.deathYear, deathAge: l.deathAge, cause: l.deathCause,
        edu, job: l.jobHist[0] || '', kids: l.kids.length, grand: l.kids.reduce((t, k) => t + k.grand, 0), classLabel: l.lifestyle ? l.lifestyle.classLabel : '',
        lines, epitaph: l.epitaph || '', lastWords: l.lastWords || '', summary: deathSummary(l),
        stats: $$('#endBody .endstats > div').map((d) => [d.querySelector('small').textContent, d.querySelector('b').textContent]),
        notes: l.notes.map((n) => [n.age, n.t]), stars: l.log.filter((e) => e.star).map((e) => [e.age, e.t]),
        log: l.log.filter((e) => e.c !== 'note').map((e) => [e.age, e.t, e.tone || '', e.c || '']),
        sprites: ages.map((a) => spriteAt(l, a)),
        rank: { income: l.peak.income || 0, assets: Math.round(l.peak.savings || 0), final: Math.round((l.savings || 0) + (l.nisa || 0)), prefs: new Set(Object.values(l.snaps).map((x) => x.pref)).size, jobs: new Set(l.jobHist).size, marriages: l.marriages || 0, divorces: l.divorces || 0, hobbies: (l.hobbies || []).length, friends: l.peak.friends || l.friends || 0, debt: l.peak.debt || 0, arrests: l.arrests || 0, sns: l.peak.sns || l.sns || 0, happy: Math.round(l.stats.happy), stars: l.log.filter((e) => e.star).length },
        lived: [...new Set(Object.values(l.snaps).map((x) => x.pref))],
        birthLL: birthLatLng(l),
        photos: l._photos || lifePhotos(l)
      };
      const res = await fetch('/api/life', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(rec) });
      if (!res.ok) throw new Error(res.status);
      const { url } = await res.json();
      if (past[0]) { past[0].url = url; store.set('pastLives', past); }
      const txt = `${l.name.sei} ${l.name.mei}は${l.born.y}年、${l.birthPref}${l.birthCity}に生まれ、${l.deathAge}歳で亡くなりました（${l.deathCause}）。#1億2千万分の1`;
      l._shareHtml = `<p class="small muted">この人生の記録ページができました。URLを貼ると、カードつきで共有できます。</p>
        <div class="shareurl"><input readonly value="${esc(url)}" id="shareUrl"><button class="cta" id="shareCopy">URLをコピー</button></div>
        <div class="sharebtns"><a class="ghostbtn" href="${esc(url)}" target="_blank" rel="noopener">記録ページを開く</a><a class="ghostbtn" href="/lives" target="_blank" rel="noopener">みんなの人生</a><a class="ghostbtn" href="/rank" target="_blank" rel="noopener">ランキング</a><a class="ghostbtn" target="_blank" rel="noopener" href="https://x.com/intent/post?text=${encodeURIComponent(txt)}&url=${encodeURIComponent(url)}">Xでシェア</a><a class="ghostbtn" target="_blank" rel="noopener" href="https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}">LINEで送る</a></div>`;
      const bx = $('#shareBox'); if (bx) bx.innerHTML = l._shareHtml;
    } catch (er) { const bx = $('#shareBox'); if (bx) bx.innerHTML = '<p class="small muted">記録ページを作れませんでした（通信エラー）。</p>'; }
  }
  function deathSummary(l) {
    const p = [];
    p.push(`${l.birthPref}${l.birthCity}の、${l.lifestyle ? l.lifestyle.classLabel : ''}に${l.sex === 'M' ? '男の子' : '女の子'}として生まれました。`);
    if (l.eduName) p.push(`${l.eduName.replace(/卒$/, '')}で学びました。`);
    if (l.jobHist.length) p.push(`${l.jobHist[l.jobHist.length - 1]}として働き${l.retired ? '、引退しました' : 'ました'}。`);
    if (l.spouse || l.marriages) p.push(l.spouse && l.spouse.alive ? `${l.spouse.name}と${l.deathYear - l.spouse.year}年連れ添いました。` : '結婚生活もありました。');
    if (l.kids.length) p.push(`${l.kids.length}人の子どもを育てました。${l.kids.reduce((t, k) => t + k.grand, 0) ? `孫${l.kids.reduce((t, k) => t + k.grand, 0)}人に恵まれました。` : ''}`);
    p.push(`${l.deathAge}歳のとき、${l.deathCause}で亡くなりました。`);
    return p.join('');
  }
  function seeOff(l) {
    const w = [];
    if (l.spouse && l.spouse.alive) w.push(`配偶者の${l.spouse.name}`);
    const k = l.kids.filter((x) => x.alive).length; if (k) w.push(`子ども${k}人`);
    const g = l.kids.reduce((t, x) => t + x.grand, 0); if (g) w.push(`孫${g}人`);
    if (l.cast && l.cast.best && l.cast.best.alive) w.push(`親友の${l.cast.best.name}`);
    if (l.pet) w.push(`${l.pet.kind}の${l.pet.name}`);
    if (!w.length) w.push(l.care >= 3 ? '施設の職員の人たち' : l.deathAge < 30 && l.fam.mother.alive ? '両親' : '病院のスタッフ');
    return w.join('、');
  }

  // ---------- 過去の人生 ----------
  function renderPast() {
    const past = store.get('pastLives', []);
    $('#pastBody').innerHTML = `<h1>過去の人生</h1><p class="muted">この端末に、最近の10人生まで保存されます。</p>` +
      (past.length ? `<table class="pasttbl"><tr><th></th><th>名前</th><th>生まれ</th><th>享年</th><th>死因</th><th>仕事</th></tr>${past.map((p) => `<tr><td class="pastsp">${(p.sprites || []).map((g) => spriteSvg(g.rows, 2)).join('') || '<span class="muted small">—</span>'}</td><td>${p.url ? `<a href="${esc(p.url)}" target="_blank" rel="noopener">${esc(p.name)}</a>` : esc(p.name)}</td><td>${p.born}年・${esc(p.pref)}${esc(p.city)}</td><td>${p.age}歳</td><td>${esc(p.cause)}</td><td>${esc(p.job || '—')}</td></tr>`).join('')}</table><p><button class="ghost" id="btnClear">記録を消す</button></p>` : '<p>まだありません。</p>');
    const c = $('#btnClear'); if (c) c.addEventListener('click', () => { store.set('pastLives', []); renderPast(); });
  }

  // ---------- 何が実際のデータなのか ----------
  function renderData() {
    const src = D.SOURCES || [];
    $('#dataBody').innerHTML = `<h1>何が実際のデータなのか</h1>
      <p>このシミュレーションは、日本の公的統計をもとに一人ひとりの人生を確率的に組み立てています。統計は「その条件の人のうち何%に起こるか」を表すもので、あなたの選択はその確率を動かしますが、統計そのものを覆すことはできません。</p>
      <h2>使っているデータ</h2>
      <table class="datatbl">${src.map((s) => `<tr><th>${esc(s.what)}</th><td>${esc(s.src)}${s.url ? ` <a href="${esc(s.url)}" target="_blank" rel="noopener">出典</a>` : ''}</td></tr>`).join('')}</table>
      <h2>モデルのしくみ</h2>
      <p>亡くなる時期は男女別の生命表をもとに、都道府県別の平均寿命の差、健康度、喫煙、持病などで個人差をつけています。個人差を入れても集団全体では生命表と一致するよう、年齢帯ごとに較正しています（平均寿命 男性${E.lifeExp('M').toFixed(1)}歳・女性${E.lifeExp('F').toFixed(1)}歳）。死因は人口動態統計の年齢階級別死因構成に従います。</p>
      <p>将来の出来事（南海トラフ地震、首都直下地震、景気後退、感染症など）は、政府の発生確率をもとに「世界」ごとに一度だけ抽選され、同じ日に生まれた4人も同じ世界を生きます。将来の人口は国立社会保障・人口問題研究所の将来推計人口（中位推計）を参照しています。</p>
      <p>簡略化している部分：市区町村は人口比で抽選しており、病院・学校・会社の一部は架空の名前です。所得や物価は2020年代の水準のままで、インフレは考慮していません。</p>`;
  }
})();
// ヘッダーの高さに合わせて、年齢と速さの帯を貼りつける位置を決める
(function () { const f = () => { const h = document.querySelector('header.top'); if (h) document.documentElement.style.setProperty('--hdr-h', h.offsetHeight + 'px'); }; f(); window.addEventListener('resize', f); })();
