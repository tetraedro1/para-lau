ADV_ARCADE.define('duendes', (api) => {
  const { COLORS } = api;
  const TIME = 35;
  let t = 0, holes = [], spawnIn = .6;

  function layout() {
    const size = Math.min(api.W * .9, (api.bottom - api.top - 40) * .82, 460);
    const cell = size / 3;
    const ox = (api.W - size) / 2, oy = api.top + (api.bottom - api.top - size) / 2 + 10;
    holes = Array.from({ length: 9 }, (_, i) => holes[i] ? Object.assign(holes[i], { x: ox + (i % 3 + .5) * cell, y: oy + (Math.floor(i / 3) + .62) * cell, r: cell * .36 })
      : { x: ox + (i % 3 + .5) * cell, y: oy + (Math.floor(i / 3) + .62) * cell, r: cell * .36, who: null, up: 0, life: 0, hit: 0 });
  }
  layout();

  function spawn() {
    const free = holes.filter((h) => !h.who);
    if (!free.length) return;
    const h = api.pick(free);
    const p = t / TIME;
    const r = Math.random();
    h.who = r < .17 + p * .1 ? 'grinch' : r > .95 ? 'oro' : 'duende';
    h.life = (1.0 - .5 * p) * (h.who === 'oro' ? .65 : 1) * api.rand(.85, 1.15);
    h.up = 0; h.hit = 0;
  }

  function drawElf(ctx, h, k) {
    const r = h.r, y = h.y - r * .55 * k;
    ctx.save();
    ctx.beginPath(); ctx.rect(h.x - r * 1.3, h.y - r * 3, r * 2.6, r * 3.05); ctx.clip();
    if (h.who === 'grinch') {
      ctx.fillStyle = '#9CC27E'; ctx.beginPath(); ctx.ellipse(h.x, y, r * .78, r * .7, 0, 0, 6.283); ctx.fill();
      ctx.fillStyle = '#F2D45C';
      ctx.beginPath(); ctx.ellipse(h.x - r * .28, y - r * .12, r * .14, r * .1, .3, 0, 6.283); ctx.fill();
      ctx.beginPath(); ctx.ellipse(h.x + r * .28, y - r * .12, r * .14, r * .1, -.3, 0, 6.283); ctx.fill();
      ctx.fillStyle = COLORS.ink;
      ctx.beginPath(); ctx.arc(h.x - r * .28, y - r * .12, r * .05, 0, 6.283); ctx.arc(h.x + r * .28, y - r * .12, r * .05, 0, 6.283); ctx.fill();
      ctx.strokeStyle = '#5E7F4A'; ctx.lineWidth = r * .08; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(h.x - r * .45, y - r * .32); ctx.lineTo(h.x - r * .12, y - r * .22); ctx.moveTo(h.x + r * .45, y - r * .32); ctx.lineTo(h.x + r * .12, y - r * .22); ctx.stroke();
      ctx.beginPath(); ctx.arc(h.x, y + r * .42, r * .3, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
    } else {
      const face = h.who === 'oro' ? '#F3D98B' : '#F5D7C4';
      ctx.fillStyle = face;
      ctx.beginPath(); ctx.ellipse(h.x - r * .72, y, r * .2, r * .12, -.5, 0, 6.283); ctx.ellipse(h.x + r * .72, y, r * .2, r * .12, .5, 0, 6.283); ctx.fill();
      ctx.beginPath(); ctx.ellipse(h.x, y + r * .05, r * .62, r * .6, 0, 0, 6.283); ctx.fill();
      ctx.fillStyle = h.who === 'oro' ? COLORS.gold : '#8BA586';
      ctx.beginPath(); ctx.moveTo(h.x - r * .66, y - r * .2); ctx.quadraticCurveTo(h.x, y - r * 1.6, h.x + r * .8, y - r * 1.1); ctx.lineTo(h.x + r * .66, y - r * .2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.fillRect(h.x - r * .68, y - r * .32, r * 1.36, r * .18);
      ctx.beginPath(); ctx.arc(h.x + r * .82, y - r * 1.1, r * .14, 0, 6.283); ctx.fill();
      ctx.fillStyle = COLORS.ink;
      if (h.hit) { ctx.lineWidth = r * .07; ctx.strokeStyle = COLORS.ink; for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(h.x + s * r * .3 - r * .08, y - r * .02); ctx.lineTo(h.x + s * r * .3 + r * .08, y + r * .1); ctx.moveTo(h.x + s * r * .3 + r * .08, y - r * .02); ctx.lineTo(h.x + s * r * .3 - r * .08, y + r * .1); ctx.stroke(); } }
      else { ctx.beginPath(); ctx.arc(h.x - r * .24, y + r * .04, r * .065, 0, 6.283); ctx.arc(h.x + r * .24, y + r * .04, r * .065, 0, 6.283); ctx.fill(); }
      ctx.fillStyle = '#E8A0A0'; ctx.globalAlpha = .6;
      ctx.beginPath(); ctx.ellipse(h.x - r * .38, y + r * .24, r * .1, r * .06, 0, 0, 6.283); ctx.ellipse(h.x + r * .38, y + r * .24, r * .1, r * .06, 0, 0, 6.283); ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  return {
    resize: layout,
    start() { t = 0; },
    update(dt) {
      t += dt;
      api.time(1 - t / TIME);
      if (t >= TIME) { api.over(); return; }
      spawnIn -= dt;
      if (spawnIn <= 0) {
        spawn();
        if (t > TIME * .45 && Math.random() < .35) spawn();
        spawnIn = (.75 - .4 * t / TIME) * api.rand(.7, 1.2);
      }
      for (const h of holes) {
        if (!h.who) continue;
        if (h.hit) { h.hit -= dt; h.up = Math.max(0, h.up - dt * 6); if (h.hit <= 0) h.who = null; continue; }
        h.life -= dt;
        h.up = h.life > .12 ? Math.min(1, h.up + dt * 9) : Math.max(0, h.up - dt * 9);
        if (h.life <= 0) h.who = null;
      }
    },
    draw(ctx) {
      for (const h of holes) {
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(h.x, h.y + h.r * .12, h.r * 1.18, h.r * .5, 0, 0, 6.283); ctx.fill();
        ctx.fillStyle = '#C9B8D8'; ctx.beginPath(); ctx.ellipse(h.x, h.y, h.r, h.r * .36, 0, 0, 6.283); ctx.fill();
        if (h.who && h.up > 0) drawElf(ctx, h, h.up);
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(h.x, h.y + h.r * .14, h.r * 1.1, h.r * .22, 0, 0, Math.PI); ctx.fill();
      }
    },
    down(x, y) {
      for (const h of holes) {
        if (!h.who || h.hit || h.up < .4) continue;
        const dx = x - h.x, dy = y - (h.y - h.r * .5);
        if (dx * dx + dy * dy > (h.r * 1.15) ** 2) continue;
        h.hit = .25;
        if (h.who === 'grinch') { api.add(-5, h.x, h.y - h.r * 1.4); api.shake(.35); api.vibrate([40, 30, 40]); api.burst(h.x, h.y - h.r * .5, '#9CC27E', 12); }
        else { const pts = h.who === 'oro' ? 3 : 1; api.add(pts, h.x, h.y - h.r * 1.4); api.vibrate(8); api.burst(h.x, h.y - h.r * .5, h.who === 'oro' ? '#F0CC6A' : '#fff', 10); }
        return;
      }
    },
  };
});
