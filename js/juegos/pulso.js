ADV_ARCADE.define('pulso', (api) => {
  const { COLORS } = api;
  const STEP = 8;            // px between path samples
  let pts, scroll = 0, speed = 90, x, tx, dead = false, grab = null, keyDir = 0, dist = 0, phase = 0, drift = 0;

  const flakeY = () => api.bottom - 150;
  const widthAt = (d) => Math.max(46, 130 - d * .028);   // the path narrows as you go

  // the path is a list of centre x positions going up the screen
  function nextPoint(prev, d) {
    phase += .045 + Math.min(.06, d / 60000);
    drift += api.rand(-1, 1) * (2 + Math.min(6, d / 1500));
    drift *= .96;
    const amp = Math.min(api.W * .3, 40 + d * .02);
    const cx = api.W / 2 + Math.sin(phase) * amp + Math.sin(phase * .37) * amp * .5 + drift * 4;
    const w = widthAt(d);
    return Math.max(w / 2 + 8, Math.min(api.W - w / 2 - 8, prev == null ? cx : prev + Math.max(-14, Math.min(14, cx - prev))));
  }
  function reset() {
    pts = [];
    const n = Math.ceil(api.H / STEP) + 4;
    let p = api.W / 2;
    for (let i = 0; i < n; i++) { pts.push({ x: p, d: 0 }); if (i > n * .4) p = nextPoint(p, 0); }
    x = tx = api.W / 2;
  }
  // sample index 0 is at flakeY, higher indexes are further up
  const yOf = (i) => flakeY() - i * STEP + (scroll % STEP);

  reset();
  return {
    start() { api.noTime(); },
    update(dt) {
      if (dead) return;
      speed = Math.min(300, 90 + dist * .05);
      scroll += speed * dt; dist += speed * dt;
      while (scroll >= STEP) {
        scroll -= STEP;
        pts.shift();
        // extend below the flake too so the trail stays drawn
        const last = pts[pts.length - 1];
        pts.push({ x: nextPoint(last.x, dist), d: dist });
      }
      const s = Math.floor(dist / 20);
      if (s !== api.score) api.setScore(s);
      if (keyDir) tx += keyDir * 380 * dt;
      tx = Math.max(6, Math.min(api.W - 6, tx));
      x += (tx - x) * Math.min(1, dt * 25);
      // interpolate the path at the flake's y
      const k = (scroll % STEP) / STEP;
      const cx = pts[0].x * (1 - k) + pts[1].x * k;
      const w = widthAt(dist);
      if (Math.abs(x - cx) > w / 2 - 9) {
        dead = true;
        api.shake(.4); api.burst(x, flakeY(), '#fff', 20); api.vibrate([60, 30, 60]);
        setTimeout(() => api.over(), 700);
      }
    },
    draw(ctx) {
      const w = widthAt(dist);
      ctx.fillStyle = 'rgba(255,255,255,.75)';
      ctx.beginPath();
      pts.forEach((p, i) => { const y = yOf(i); i ? ctx.lineTo(p.x - w / 2, y) : ctx.moveTo(p.x - w / 2, y); });
      for (let i = pts.length - 1; i >= 0; i--) ctx.lineTo(pts[i].x + w / 2, yOf(i));
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = COLORS.lilac; ctx.lineWidth = 3;
      for (const sgn of [-1, 1]) {
        ctx.beginPath();
        pts.forEach((p, i) => { const y = yOf(i); i ? ctx.lineTo(p.x + sgn * w / 2, y) : ctx.moveTo(p.x + sgn * w / 2, y); });
        ctx.stroke();
      }
      // the snowflake
      const fy = flakeY();
      ctx.save(); ctx.translate(x, fy); ctx.rotate(dist / 60);
      ctx.strokeStyle = dead ? COLORS.pink : '#7FA3CC'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
      for (let i = 0; i < 6; i++) {
        ctx.rotate(Math.PI / 3);
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -10); ctx.moveTo(0, -6); ctx.lineTo(-3.5, -9); ctx.moveTo(0, -6); ctx.lineTo(3.5, -9); ctx.stroke();
      }
      ctx.restore();
      if (dist < 200) { ctx.fillStyle = COLORS.ink; ctx.globalAlpha = .55; ctx.textAlign = 'center'; ctx.font = '600 14px "DM Sans", sans-serif'; ctx.fillText('arrastra el dedo en cualquier parte', api.W / 2, fy + 70); ctx.globalAlpha = 1; }
    },
    // relative drag so the finger never hides the flake
    down(px) { grab = { px, x: tx }; },
    move(px, py, isDown) { if (isDown && grab) tx = grab.x + (px - grab.px) * 1.1; },
    up() { grab = null; },
    key(k, d) {
      if (k === 'ArrowLeft') keyDir = d ? -1 : (keyDir < 0 ? 0 : keyDir);
      else if (k === 'ArrowRight') keyDir = d ? 1 : (keyDir > 0 ? 0 : keyDir);
      else return false;
    },
  };
});
