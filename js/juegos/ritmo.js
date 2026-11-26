ADV_ARCADE.define('ritmo', (api) => {
  const { COLORS, rr } = api;
  const LANES = 3, TIME = 50, MAX_MISS = 8;
  const LC = [COLORS.rose, COLORS.sage, COLORS.sky];
  const NOTE_F = [392, 523.3, 659.3];
  let ac = null, t = -1.2, notes = [], nextBeat = 0, combo = 0, misses = 0, flash = [0, 0, 0], judge = null, ended = false, beatPulse = 0, lastBeatIdx = -1;

  const bpm = () => 96 + 36 * Math.min(1, Math.max(0, t) / TIME);
  const travel = () => 1.55 - .45 * Math.min(1, Math.max(0, t) / TIME);
  const hitY = () => api.bottom - 130;
  const laneW = () => Math.min(api.W / LANES, 130);
  const laneX = (i) => api.W / 2 + (i - 1) * laneW();

  function sound(f, vol = .18, dur = .12, type = 'triangle') {
    if (!ac) return;
    try {
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = type; o.frequency.value = f;
      g.gain.setValueAtTime(vol, ac.currentTime); g.gain.exponentialRampToValueAtTime(.0001, ac.currentTime + dur);
      o.connect(g).connect(ac.destination); o.start(); o.stop(ac.currentTime + dur + .02);
    } catch (_) {}
  }

  function schedule() {
    while (nextBeat < t + travel() + .2 && nextBeat < TIME) {
      const p = Math.min(1, nextBeat / TIME);
      const r = Math.random();
      if (r < .78) {
        const lane = (Math.random() * LANES) | 0;
        notes.push({ lane, at: nextBeat, hit: false, gone: false });
        if (Math.random() < .08 + p * .18) notes.push({ lane: (lane + 1 + ((Math.random() * 2) | 0)) % LANES, at: nextBeat, hit: false, gone: false });
      }
      // later on, notes also land between beats
      nextBeat += 60 / bpm() * (Math.random() < .15 + p * .35 ? .5 : 1);
    }
  }

  function press(lane) {
    if (ended) return;
    flash[lane] = 1;
    let best = null, bd = 1;
    for (const n of notes) if (!n.hit && !n.gone && n.lane === lane) { const d = Math.abs(n.at - t); if (d < bd) { bd = d; best = n; } }
    if (best && bd <= .14) {
      best.hit = true;
      combo++;
      const mult = combo >= 25 ? 3 : combo >= 10 ? 2 : 1;
      const perfect = bd <= .065;
      api.add((perfect ? 3 : 1) * mult);
      judge = { text: perfect ? '¡Perfecto!' : 'Bien', color: perfect ? COLORS.gold : COLORS.sageD, life: .5 };
      api.mult(mult > 1 ? `x${mult}` : '');
      sound(NOTE_F[lane], .2, .25);
      api.burst(laneX(lane), hitY(), LC[lane], perfect ? 12 : 6);
      api.vibrate(6);
    } else {
      miss();
    }
  }
  function miss() {
    combo = 0; misses++;
    api.mult('');
    judge = { text: 'Fallo', color: COLORS.pink, life: .5 };
    api.vibrate([20, 20, 20]);
    if (misses >= MAX_MISS && !ended) { ended = true; api.shake(.3); setTimeout(() => api.over(), 600); }
  }

  return {
    pedirPermiso() { try { const A = window.AudioContext || window.webkitAudioContext; ac = new A(); ac.resume && ac.resume(); } catch (_) {} },
    start() { t = -1.2; },
    stop() { try { ac && ac.close(); } catch (_) {} },
    update(dt) {
      if (ended) return;
      t += dt;
      api.time(1 - Math.max(0, t) / TIME);
      schedule();
      const bi = Math.floor(t * bpm() / 60);
      if (bi !== lastBeatIdx && t > 0) { lastBeatIdx = bi; beatPulse = 1; sound(70, .25, .12, 'sine'); }
      beatPulse = Math.max(0, beatPulse - dt * 4);
      for (const n of notes) if (!n.hit && !n.gone && t - n.at > .14) { n.gone = true; miss(); if (ended) return; }
      notes = notes.filter((n) => !(n.hit || n.gone) || t - n.at < .4);
      for (let i = 0; i < LANES; i++) flash[i] = Math.max(0, flash[i] - dt * 6);
      if (judge) { judge.life -= dt; if (judge.life <= 0) judge = null; }
      if (t >= TIME + .5) { ended = true; api.over(); }
    },
    draw(ctx) {
      const hy = hitY(), lw = laneW(), sp = (hy - api.top) / travel();
      for (let i = 0; i < LANES; i++) {
        const x = laneX(i);
        ctx.fillStyle = `rgba(255,255,255,${.25 + flash[i] * .45})`;
        rr(ctx, x - lw / 2 + 6, api.top, lw - 12, api.bottom - api.top - 20, 18); ctx.fill();
        ctx.strokeStyle = LC[i]; ctx.lineWidth = 3 + beatPulse * 2;
        ctx.beginPath(); ctx.arc(x, hy, lw * .3, 0, 6.283); ctx.stroke();
      }
      ctx.fillStyle = 'rgba(61,56,72,.12)'; ctx.fillRect(api.W / 2 - lw * 1.5, hy - 1, lw * 3, 2);
      for (const n of notes) {
        if (n.hit) continue;
        const y = hy - (n.at - t) * sp;
        if (y < api.top - 30 || y > api.H + 30) continue;
        const x = laneX(n.lane);
        ctx.globalAlpha = n.gone ? .3 : 1;
        ctx.fillStyle = LC[n.lane]; ctx.beginPath(); ctx.arc(x, y, lw * .24, 0, 6.283); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.beginPath(); ctx.arc(x - lw * .07, y - lw * .07, lw * .06, 0, 6.283); ctx.fill();
        ctx.globalAlpha = 1;
      }
      if (judge) {
        ctx.globalAlpha = Math.min(1, judge.life * 3); ctx.fillStyle = judge.color; ctx.textAlign = 'center';
        ctx.font = 'italic 500 30px Fraunces, Georgia, serif'; ctx.fillText(judge.text, api.W / 2, hy - 90); ctx.globalAlpha = 1;
      }
      ctx.fillStyle = COLORS.ink; ctx.globalAlpha = .55; ctx.textAlign = 'center'; ctx.font = '600 13px "DM Sans", sans-serif';
      ctx.fillText(`Fallos ${misses}/${MAX_MISS}`, api.W / 2, api.bottom - 40); ctx.globalAlpha = 1;
      if (t < 0) { ctx.fillStyle = COLORS.ink; ctx.font = '600 16px "DM Sans", sans-serif'; ctx.fillText('Toca cada carril cuando la nota llegue al círculo', api.W / 2, hy + 60); }
    },
    down(x) {
      const lw = laneW();
      const lane = Math.floor((x - (api.W / 2 - lw * 1.5)) / lw);
      press(Math.max(0, Math.min(LANES - 1, lane)));
    },
    key(k, d) {
      const m = { ArrowLeft: 0, a: 0, ArrowDown: 1, s: 1, ArrowUp: 1, ArrowRight: 2, d: 2 }[k];
      if (m == null) return false;
      if (d) press(m);
    },
  };
});
