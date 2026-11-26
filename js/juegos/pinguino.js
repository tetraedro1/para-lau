ADV_ARCADE.define('pinguino', (api) => {
  const { COLORS, rr } = api;
  const G = 1500, BOUNCE = -820, PW = 64, PH = 14;
  let px, py, vx = 0, vy = BOUNCE, cam = 0, best = 0, plats = [], tilt = null, side = 0, keyDir = 0, dead = false, face = 1;

  function addPlat(y) {
    const h = -y;                                   // height climbed at that point
    const r = Math.random();
    const kind = h > 2500 && r < .2 ? 'rompe' : h > 1200 && r < .45 ? 'mueve' : 'fija';
    plats.push({ x: api.rand(PW / 2 + 6, api.W - PW / 2 - 6), y, kind, dir: Math.random() < .5 ? -1 : 1, broken: 0, w: Math.max(46, PW - h / 300) });
  }
  function reset() {
    plats = [];
    const base = api.bottom - 60;
    plats.push({ x: api.W / 2, y: base, kind: 'fija', w: PW * 1.6, dir: 1, broken: 0 });
    let y = base;
    while (y > api.top - 400) { y -= api.rand(60, 100); addPlat(y); }
    px = api.W / 2; py = base - 30;
  }
  const gapFor = (h) => Math.min(175, 70 + h / 60);
  function onOrient(e) { if (e.gamma != null) tilt = e.gamma; }

  reset();
  return {
    pedirPermiso() {
      try {
        if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
          DeviceOrientationEvent.requestPermission().then((r) => { if (r === 'granted') addEventListener('deviceorientation', onOrient); }).catch(() => {});
        } else addEventListener('deviceorientation', onOrient);
      } catch (_) {}
    },
    stop() { removeEventListener('deviceorientation', onOrient); },
    start() { api.noTime(); },
    update(dt) {
      if (dead) { vy += G * dt; py += vy * dt; return; }
      // steering: tilt, or hold a side of the screen, or arrows
      let target = 0;
      if (keyDir) target = keyDir * 380;
      else if (side) target = side * 380;
      else if (tilt != null) target = Math.max(-1, Math.min(1, tilt / 25)) * 420;
      vx += (target - vx) * Math.min(1, dt * 10);
      if (Math.abs(vx) > 20) face = Math.sign(vx);
      px += vx * dt;
      if (px < -15) px = api.W + 15; if (px > api.W + 15) px = -15;
      const prevY = py;
      vy += G * dt; py += vy * dt;
      if (vy > 0) {
        for (const p of plats) {
          if (p.broken) continue;
          if (prevY <= p.y - 14 && py >= p.y - 14 && Math.abs(px - p.x) < p.w / 2 + 10) {
            if (p.kind === 'rompe') { p.broken = 1; api.burst(p.x, p.y, '#D6E2EF', 10); continue; }
            py = p.y - 14; vy = BOUNCE; api.vibrate(4);
            break;
          }
        }
      }
      for (const p of plats) {
        if (p.kind === 'mueve') { p.x += p.dir * (60 + -p.y / 40) * dt; if (p.x < p.w / 2 || p.x > api.W - p.w / 2) p.dir *= -1; }
        if (p.broken) { p.broken += dt * 3; p.y += 200 * dt; }
      }
      // camera follows upwards only
      const line = api.top + (api.bottom - api.top) * .42;
      if (py - cam < line) cam = py - line;
      const h = Math.round((api.bottom - 90 - py) / 10);
      if (h > best) { best = h; api.setScore(best); }
      plats = plats.filter((p) => p.y - cam < api.H + 60 && p.broken < 3);
      let top = Math.min(...plats.map((p) => p.y));
      while (top - cam > api.top - 300) { top -= api.rand(gapFor(best * 10) * .6, gapFor(best * 10)); addPlat(top); }
      if (py - cam > api.H + 40) {
        dead = true; api.shake(.3); api.vibrate([50, 30, 50]);
        setTimeout(() => api.over(), 600);
      }
    },
    draw(ctx) {
      ctx.save(); ctx.translate(0, -cam);
      for (const p of plats) {
        ctx.globalAlpha = p.broken ? Math.max(0, 1 - p.broken / 3) : 1;
        ctx.fillStyle = p.kind === 'mueve' ? COLORS.sky : p.kind === 'rompe' ? '#EAF0F7' : '#fff';
        rr(ctx, p.x - p.w / 2, p.y - PH / 2, p.w, PH, 7); ctx.fill();
        ctx.strokeStyle = p.kind === 'rompe' ? '#B9C9DE' : 'rgba(176,198,223,.9)'; ctx.lineWidth = 2; ctx.stroke();
        if (p.kind === 'rompe') { ctx.beginPath(); ctx.moveTo(p.x - 6, p.y - 6); ctx.lineTo(p.x + 2, p.y); ctx.lineTo(p.x - 3, p.y + 6); ctx.stroke(); }
        ctx.globalAlpha = 1;
      }
      // penguin with a little red scarf
      const squash = vy < -600 ? .9 : 1;
      ctx.save(); ctx.translate(px, py); ctx.scale(face * (2 - squash), squash);
      ctx.fillStyle = '#3D3848'; ctx.beginPath(); ctx.ellipse(0, -2, 15, 18, 0, 0, 6.283); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(3, 1, 10, 13, 0, 0, 6.283); ctx.fill();
      ctx.fillStyle = '#3D3848'; ctx.beginPath(); ctx.arc(6, -9, 2, 0, 6.283); ctx.fill();
      ctx.fillStyle = '#F2A65A'; ctx.beginPath(); ctx.moveTo(10, -6); ctx.lineTo(18, -4); ctx.lineTo(10, -2); ctx.fill();
      ctx.fillStyle = '#E26D6D'; ctx.fillRect(-12, 3, 24, 4); ctx.fillRect(-10, 5, 5, 9);
      ctx.fillStyle = '#F2A65A'; ctx.beginPath(); ctx.ellipse(-5, 16, 5, 2.5, 0, 0, 6.283); ctx.ellipse(6, 16, 5, 2.5, 0, 0, 6.283); ctx.fill();
      ctx.restore();
      ctx.restore();
      if (best < 5) { ctx.fillStyle = COLORS.ink; ctx.globalAlpha = .55; ctx.textAlign = 'center'; ctx.font = '600 14px "DM Sans", sans-serif'; ctx.fillText(tilt != null ? 'inclina el móvil' : 'mantén pulsado un lado de la pantalla', api.W / 2, api.bottom - 20); ctx.globalAlpha = 1; }
    },
    down(x) { side = x < api.W / 2 ? -1 : 1; },
    move(x, y, isDown) { if (isDown) side = x < api.W / 2 ? -1 : 1; },
    up() { side = 0; },
    key(k, d) {
      if (k === 'ArrowLeft') keyDir = d ? -1 : (keyDir < 0 ? 0 : keyDir);
      else if (k === 'ArrowRight') keyDir = d ? 1 : (keyDir > 0 ? 0 : keyDir);
      else return false;
    },
  };
});
