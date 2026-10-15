/* 1億2千万分の1 — BGMと効果音（Web Audioでその場で合成。音源ファイルは使わない） */
(function () {
  let ctx = null, master = null, bgmGain = null, sfxGain = null, verb = null, bgmTimer = null, mood = 'child';
  const S = { enabled: true };
  try { const v = localStorage.getItem('sound'); if (v === '0') S.enabled = false; } catch (e) {}

  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return true; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = S.enabled ? 0.9 : 0; master.connect(ctx.destination);
    // 簡易リバーブ（減衰するノイズのインパルス）
    verb = ctx.createConvolver();
    const len = ctx.sampleRate * 2.6, ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.8); }
    verb.buffer = ir;
    const wet = ctx.createGain(); wet.gain.value = 0.35; verb.connect(wet); wet.connect(master);
    bgmGain = ctx.createGain(); bgmGain.gain.value = 0.16; bgmGain.connect(master); bgmGain.connect(verb);
    sfxGain = ctx.createGain(); sfxGain.gain.value = 0.5; sfxGain.connect(master); sfxGain.connect(verb);
    return true;
  }
  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
  // ピアノ風の音（倍音つき・すぐ減衰）
  function note(m, t, dur, vel, dest, type) {
    const o1 = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
    o1.type = type || 'triangle'; o2.type = 'sine'; o1.frequency.value = hz(m); o2.frequency.value = hz(m) * 2.001;
    const g2 = ctx.createGain(); g2.gain.value = 0.25;
    f.type = 'lowpass'; f.frequency.value = 2400;
    o1.connect(g); o2.connect(g2); g2.connect(g); g.connect(f); f.connect(dest);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vel, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o1.start(t); o2.start(t); o1.stop(t + dur + 0.05); o2.stop(t + dur + 0.05);
  }
  // 静かなピアノの音：基音と倍音を重ね、高い倍音ほど早く消える。打鍵の瞬間だけ少し明るく
  function piano(m, t, dur, vel, dest, soft) {
    const f0 = hz(m), out = ctx.createGain(), lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.Q.value = 0.3;
    const bright = soft ? 900 : 1800, base = Math.min(bright * 2.2, f0 * (soft ? 3 : 5));
    lp.frequency.setValueAtTime(Math.max(base, 400) * 1.6, t); lp.frequency.exponentialRampToValueAtTime(Math.max(base, 300), t + 0.25);
    out.gain.value = vel; out.connect(lp); lp.connect(dest);
    const len = Math.min(dur, 7 - Math.max(0, (m - 60) / 10)); // 高い音ほど早く減衰
    [[1, 1, 1], [2, 0.38, 0.55], [3, 0.16, 0.35], [4, 0.07, 0.25]].forEach(([h, a, d]) => {
      if (f0 * h > 9000) return;
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = f0 * h * (1 + (h - 1) * 0.0007); // わずかな非調和性
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(a, t + 0.006);
      g.gain.exponentialRampToValueAtTime(a * 0.45, t + 0.12 * d + 0.05); g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(0.3, len * d));
      o.connect(g); g.connect(out); o.start(t); o.stop(t + Math.max(0.3, len * d) + 0.05);
    });
  }
  function noise(t, dur, vol, freq, q) {
    const b = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = b; f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q || 1;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + dur * 0.3); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(sfxGain); s.start(t); s.stop(t + dur);
  }
  // お寺の鐘（非整数倍音がゆっくり減衰）
  function bell(t, base, len, vol) {
    for (const [r, a] of [[1, 1], [2.76, 0.5], [5.4, 0.25], [8.93, 0.12], [0.5, 0.6]]) {
      const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.value = base * r;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol * a, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + len / Math.sqrt(r));
      o.connect(g); g.connect(sfxGain); o.start(t); o.stop(t + len);
    }
  }

  // ---------- BGM：ドビュッシー「月の光」（clair.js の楽譜データを、その場で合成したピアノの音で演奏） ----------
  // 人生の時期で、速さと音量だけ少し変える
  const MOODS = { child: { sp: 1.0, vel: 0.2 }, youth: { sp: 1.0, vel: 0.2 }, adult: { sp: 0.97, vel: 0.19 }, old: { sp: 0.92, vel: 0.18 }, home: { sp: 0.97, vel: 0.17 } };
  let SCORE = null;
  function score() {
    if (SCORE || !window.CLAIR) return SCORE;
    const c = window.CLAIR, ev = []; let t = 0;
    for (let i = 0; i < c.length; i += 3) { t += c[i]; ev.push([t / 100, c[i + 1], c[i + 2] / 100, false]); }
    // 旋律（同時に鳴る音のうちいちばん高い音）とそれ以外の伴奏を分ける
    for (let i = 0; i < ev.length;) { let j = i, top = i; while (j < ev.length && ev[j][0] - ev[i][0] < 0.04) { if (ev[j][1] > ev[top][1]) top = j; j++; } if (ev[top][1] >= 63) ev[top][3] = true; i = j; }
    SCORE = { ev, len: t / 100 + 5 }; // 終わったら5秒おいて最初から
    return SCORE;
  }
  let pos = 0, idx = 0, wall = 0; // pos：曲の中の位置（秒）、wall：それに対応する AudioContext の時刻
  function scheduleBar() {
    if (!ctx || !S.enabled) return;
    const sc = score(); if (!sc) { bgmTimer = setTimeout(scheduleBar, 500); return; }
    const M = MOODS[mood], now = ctx.currentTime;
    // 止めていた後や、タブが長く裏にあった後は、いまの時刻から続きを鳴らす
    if (!wall) wall = now + 0.08;
    else if (idx < sc.ev.length && wall + (sc.ev[idx][0] - pos) / M.sp < now - 2) wall = now + 0.08 - (sc.ev[idx][0] - pos) / M.sp;
    const ahead = 1.5; // 1.5秒先まで予約
    while (true) {
      if (idx >= sc.ev.length) { const gap = (sc.len - pos) / M.sp; if (wall + gap > now + ahead) break; wall += gap; pos = 0; idx = 0; continue; }
      const [t, m, len, mel] = sc.ev[idx], at = wall + (t - pos) / M.sp;
      if (at > now + ahead) break;
      // 低い音はやや控えめに、高い音は少し明るく。ペダルを踏んだように長めに響かせる
      // 旋律ははっきり、伴奏は静かでやわらかいピアノの音に
      const v = M.vel * (mel ? 0.95 : m < 48 ? 0.32 : 0.38);
      piano(m, Math.max(now, at), Math.min(6.5, Math.max(1.2, len / M.sp * 2)), v, bgmGain, !mel);
      wall = at; pos = t; idx++;
    }
    bgmTimer = setTimeout(scheduleBar, 400);
  }
  function bgm(m) {
    if (m) mood = MOODS[m] ? m : mood;
    if (!S.enabled || !init()) return;
    if (!bgmTimer) scheduleBar();
  }
  function stopBgm() { clearTimeout(bgmTimer); bgmTimer = null; wall = 0; }

  // ---------- 効果音 ----------
  const SFX = {
    click: () => { const t = ctx.currentTime; note(84, t, 0.12, 0.12, sfxGain, 'sine'); },
    open: () => { const t = ctx.currentTime; note(76, t, 0.5, 0.18, sfxGain, 'sine'); note(83, t + 0.07, 0.6, 0.15, sfxGain, 'sine'); },
    good: () => { const t = ctx.currentTime; [79, 84, 88].forEach((m, i) => note(m, t + i * 0.07, 0.9, 0.12, sfxGain, 'sine')); },
    bad: () => { const t = ctx.currentTime; note(52, t, 1.2, 0.2, sfxGain, 'triangle'); note(55, t + 0.04, 1.2, 0.12, sfxGain, 'triangle'); },
    grave: () => bell(ctx.currentTime, 110, 6, 0.25),
    death: () => { const t = ctx.currentTime; bell(t, 98, 9, 0.32); bell(t + 3.2, 98, 9, 0.22); },
    birth: () => { const t = ctx.currentTime; [72, 76, 79, 84, 88].forEach((m, i) => note(m, t + i * 0.11, 1.6, 0.14, sfxGain, 'sine')); },
    award: () => { const t = ctx.currentTime; [[72, 0], [76, 0.12], [79, 0.24], [84, 0.42]].forEach(([m, d]) => note(m, t + d, d > 0.3 ? 1.4 : 0.4, 0.16, sfxGain, 'square')); },
    flap: () => { const t = ctx.currentTime; noise(t, 0.22, 0.25, 500, 0.8); },
    land: () => { const t = ctx.currentTime; noise(t, 0.25, 0.3, 160, 0.7); note(60, t + 0.05, 0.4, 0.1, sfxGain, 'sine'); },
    whoosh: () => { const t = ctx.currentTime; noise(t, 0.8, 0.15, 900, 0.5); },
    year: () => { const t = ctx.currentTime; note(96, t, 0.08, 0.03, sfxGain, 'sine'); },
    // 着信音（1回分のフレーズ）・メッセージの通知音・送信音
    ring: () => { const t = ctx.currentTime; for (let k = 0; k < 8; k++) note(k % 2 ? 79 : 84, t + k * 0.09, 0.09, 0.07, sfxGain, 'square'); },
    msg: () => { const t = ctx.currentTime; note(88, t, 0.25, 0.08, sfxGain, 'sine'); note(93, t + 0.08, 0.35, 0.07, sfxGain, 'sine'); },
    send: () => { const t = ctx.currentTime; note(81, t, 0.15, 0.06, sfxGain, 'sine'); },
    // 緊急速報の警報音（上下する2音のくり返し）
    alarm: () => { const t = ctx.currentTime; for (let k = 0; k < 6; k++) { note(k % 2 ? 86 : 91, t + k * 0.28, 0.26, 0.09, sfxGain, 'square'); } }
  };
  function sfx(name) { if (!S.enabled || !init() || !SFX[name]) return; try { SFX[name](); } catch (e) {} }
  function setEnabled(on) {
    S.enabled = on; try { localStorage.setItem('sound', on ? '1' : '0'); } catch (e) {}
    if (on) { init(); master.gain.setTargetAtTime(0.9, ctx.currentTime, 0.1); bgm(); } else { if (master) master.gain.setTargetAtTime(0, ctx.currentTime, 0.1); stopBgm(); }
  }
  window.Sound = { get enabled() { return S.enabled; }, init, bgm, stopBgm, sfx, setEnabled, setMood: (m) => { mood = MOODS[m] ? m : mood; } };
})();
