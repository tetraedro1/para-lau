ADV_ARCADE.define('reflejos', (api) => {
  const { COLORS } = api;
  const ROUNDS = 8;
  // states: wait (red), go (green), trap (yellow: don't touch), result
  let round = 0, st = 'idle', timer = 0, goAt = 0, times = [], text = '', sub = '', pulse = 0;

  function next() {
    if (round >= ROUNDS) { finish(); return; }
    round++;
    st = 'wait'; text = 'Espera…'; sub = `Ronda ${round} de ${ROUNDS}`;
    timer = 1.1 + Math.random() * 2.9;
  }
  function finish() {
    st = 'done';
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    api.setScore(Math.max(0, Math.round(1000 - avg)));
    text = `${Math.round(avg)} ms`; sub = 'de media';
    setTimeout(() => api.over(), 1100);
  }
  function result(ms, label) {
    times.push(ms);
    st = 'result'; text = label; sub = `Ronda ${round} de ${ROUNDS}`;
    timer = .9;
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    api.setScore(Math.max(0, Math.round(1000 - avg)));
  }

  function tap() {
    if (st === 'wait') { api.shake(.3); api.vibrate([40, 30, 40]); result(1000, '¡Demasiado pronto!'); }
    else if (st === 'trap') { api.shake(.3); api.vibrate([40, 30, 40]); result(1000, 'Era amarillo…'); }
    else if (st === 'go') {
      const ms = Math.round(performance.now() - goAt);
      api.vibrate(10);
      api.burst(api.W / 2, api.H / 2, COLORS.sage, 16);
      result(ms, `${ms} ms`);
    }
  }

  return {
    start() { api.noTime(); next(); },
    update(dt) {
      pulse += dt;
      if (st === 'wait' || st === 'result' || st === 'trap') timer -= dt;
      if (st === 'wait' && timer <= 0) {
        // one in four rounds starts with a yellow trap
        if (Math.random() < .25 && !sub.includes('trampa')) { st = 'trap'; text = 'Ni se te ocurra'; timer = .7 + Math.random() * .5; sub = sub + ' · trampa'; }
        else { st = 'go'; text = '¡YA!'; goAt = performance.now(); }
      } else if (st === 'trap' && timer <= 0) {
        st = 'wait'; text = 'Espera…'; timer = .5 + Math.random() * 1.5;
      } else if (st === 'go' && performance.now() - goAt > 1000) {
        result(1000, 'Muy lento');
      } else if (st === 'result' && timer <= 0) next();
    },
    draw(ctx) {
      const cx = api.W / 2, cy = api.H / 2, R = Math.min(api.W, api.H) * .3;
      const col = st === 'go' ? '#7FC27A' : st === 'trap' ? '#F2C14E' : st === 'wait' ? '#E8968A' : COLORS.lilac;
      const s = st === 'go' ? 1.04 : 1 + Math.sin(pulse * 3) * .015;
      ctx.fillStyle = col; ctx.globalAlpha = .25;
      ctx.beginPath(); ctx.arc(cx, cy, R * s * 1.18, 0, 6.283); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.beginPath(); ctx.arc(cx, cy, R * s, 0, 6.283); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = `italic 500 ${Math.round(R * .3)}px Fraunces, Georgia, serif`;
      ctx.fillText(text, cx, cy - 6);
      ctx.font = '600 14px "DM Sans", sans-serif'; ctx.globalAlpha = .9;
      ctx.fillText(sub, cx, cy + R * .32);
      ctx.globalAlpha = 1; ctx.textBaseline = 'alphabetic';
      // dots with each round's time
      times.forEach((ms, i) => {
        ctx.fillStyle = ms >= 1000 ? COLORS.pink : ms < 300 ? COLORS.sageD : COLORS.gold;
        ctx.beginPath(); ctx.arc(cx + (i - (ROUNDS - 1) / 2) * 18, cy + R + 40, 5, 0, 6.283); ctx.fill();
      });
    },
    down: tap,
    key(k, d) { if (d && k === ' ') tap(); else return false; },
  };
});
