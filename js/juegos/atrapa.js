ADV_ARCADE.define('atrapa', (api) => {
  const { SPRITES, COLORS, rr, sprite } = api;
  // the leprechaun's gold coin: rare and worth a lot
  const COIN = sprite(64, (x, s) => {
    x.fillStyle = '#D4A73C'; x.beginPath(); x.arc(s / 2, s / 2, s * .4, 0, 6.283); x.fill();
    x.fillStyle = '#F0CC6A'; x.beginPath(); x.arc(s / 2, s / 2, s * .32, 0, 6.283); x.fill();
    x.fillStyle = '#D4A73C';
    for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { x.beginPath(); x.arc(s / 2 + dx * s * .07, s / 2 + dy * s * .07, s * .075, 0, 6.283); x.fill(); }
  });
  const DURATION = 40;
  const TYPES = [
    { key: 'gift', pts: 1, w: 52 },
    { key: 'star', pts: 2, w: 20, img: SPRITES.star, color: COLORS.butter },
    { key: 'heart', pts: 5, w: 6, img: SPRITES.heart, color: COLORS.pink },
    { key: 'coin', pts: 10, w: 2.5, img: COIN, color: '#F0CC6A' },
    { key: 'coal', pts: -4, w: 22, img: SPRITES.coal, color: COLORS.coal },
  ];
  const TOTAL_W = TYPES.reduce((a, t) => a + t.w, 0);
  let t = 0, items = [], spawnIn = .5, px = api.W / 2, tx = api.W / 2, keyDir = 0, combo = 0, mult = 1, squash = 0;

  const scale = () => Math.max(.85, Math.min(1.25, Math.min(api.W, api.H * .7) / 480));
  const pw = () => Math.max(80, Math.min(120, api.W * .22));
  const py = () => api.bottom - 90;

  function pick() {
    let r = Math.random() * TOTAL_W;
    for (const ty of TYPES) if ((r -= ty.w) < 0) return ty;
    return TYPES[0];
  }
  function spawn() {
    const type = pick();
    const size = 44 * scale();
    const p = t / DURATION;
    items.push({
      type, size, img: type.img || api.pick(SPRITES.gifts),
      x: size / 2 + Math.random() * (api.W - size), y: -size,
      vy: (190 + 300 * p) * scale() * (.8 + Math.random() * .45),
      vx: (Math.random() - .5) * 60 * p,
      rot: (Math.random() - .5) * .6, vr: (Math.random() - .5) * 2.4, phase: Math.random() * 6.28,
    });
  }

  return {
    start() { t = 0; },
    update(dt) {
      t += dt;
      api.time(1 - t / DURATION);
      if (t >= DURATION) { api.over(); return; }
      spawnIn -= dt;
      if (spawnIn <= 0) { spawn(); spawnIn = (.62 - .36 * t / DURATION) * (.6 + Math.random() * .7); }
      const w = pw();
      if (keyDir) tx += keyDir * 720 * dt;
      tx = Math.max(w / 2, Math.min(api.W - w / 2, tx));
      px += (tx - px) * Math.min(1, dt * 16);
      squash = Math.max(0, squash - dt * 5);
      const y0 = py();
      for (const it of items) {
        it.y += it.vy * dt;
        it.x += it.vx * dt + Math.sin(t * 2.6 + it.phase) * 26 * dt;
        if (it.x < it.size / 2 || it.x > api.W - it.size / 2) it.vx *= -1;
        it.rot += it.vr * dt;
        if (!it.done && it.y + it.size * .35 >= y0 && it.y - it.size * .35 <= y0 + 22 && Math.abs(it.x - px) < w / 2 + it.size * .15) {
          it.done = true;
          if (it.type.pts > 0) {
            combo++;
            mult = Math.min(4, 1 + Math.floor(combo / 8));
            api.add(it.type.pts * mult, it.x, y0 - 20);
            api.burst(it.x, y0, it.type.color || '#fff', it.type.pts >= 5 ? 24 : 10);
            squash = 1;
            api.vibrate(10);
            if (combo % 8 === 0 && mult > 1) api.float(api.W / 2, api.H * .35, `Combo x${mult}`, COLORS.gold, true);
          } else {
            combo = 0; mult = 1;
            api.add(it.type.pts, it.x, y0 - 20);
            api.burst(it.x, y0, COLORS.coal, 14);
            api.shake(.35);
            api.vibrate([40, 30, 40]);
          }
          api.mult(mult > 1 ? `x${mult}` : '');
        } else if (!it.done && it.type.pts > 0 && it.y > api.H + it.size) {
          // dropping a good item breaks the combo too
          combo = 0; mult = 1; api.mult('');
        }
      }
      items = items.filter((it) => !it.done && it.y < api.H + it.size * 2);
    },
    draw(ctx) {
      for (const it of items) {
        ctx.save(); ctx.translate(it.x, it.y); ctx.rotate(it.rot);
        ctx.drawImage(it.img, -it.size / 2, -it.size / 2, it.size, it.size);
        ctx.restore();
      }
      const w = pw(), y = py();
      const tilt = Math.max(-.18, Math.min(.18, (tx - px) * .004));
      const sq = 1 + Math.sin(squash * Math.PI) * .12;
      ctx.save(); ctx.translate(px, y + 12); ctx.rotate(tilt); ctx.scale(sq, 2 - sq);
      ctx.fillStyle = COLORS.lilac; rr(ctx, -w * .3, -24, w * .26, 22, 5); ctx.fill();
      ctx.fillStyle = COLORS.sage; rr(ctx, -w * .02, -30, w * .3, 28, 5); ctx.fill();
      ctx.fillStyle = COLORS.rose; rr(ctx, -w / 2, -10, w, 26, 10); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.35)'; rr(ctx, -w / 2 + 6, -7, w - 12, 6, 3); ctx.fill();
      ctx.strokeStyle = COLORS.gold; ctx.lineWidth = 4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-w / 2 + 4, 26); ctx.lineTo(w / 2 - 8, 26); ctx.quadraticCurveTo(w / 2 + 8, 26, w / 2 + 4, 12); ctx.stroke();
      ctx.restore();
    },
    down(x) { tx = x; },
    move(x) { tx = x; },
    key(k, d) {
      if (k === 'ArrowLeft' || k === 'a') keyDir = d ? -1 : (keyDir < 0 ? 0 : keyDir);
      else if (k === 'ArrowRight' || k === 'd') keyDir = d ? 1 : (keyDir > 0 ? 0 : keyDir);
      else return false;
    },
  };
});
