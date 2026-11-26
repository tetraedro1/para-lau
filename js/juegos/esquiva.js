ADV_ARCADE.define('esquiva', (api) => {
  const { SPRITES, COLORS } = api;
  const R = 13;
  let t = 0, x = api.W / 2, y = api.H * .65, tx = x, ty = y, balls = [], spawnIn = .8, dead = false, grab = null, keys = {};

  function spawn() {
    const p = Math.min(1, t / 60);
    const side = (Math.random() * 4) | 0;
    const m = 30;
    let bx, by;
    if (side === 0) { bx = Math.random() * api.W; by = api.top - m; }
    else if (side === 1) { bx = api.W + m; by = api.top + Math.random() * (api.bottom - api.top); }
    else if (side === 2) { bx = Math.random() * api.W; by = api.bottom + m; }
    else { bx = -m; by = api.top + Math.random() * (api.bottom - api.top); }
    // most balls aim near the star, some straight at it
    const aim = Math.random() < .35 ? 0 : 90;
    const ax = x + api.rand(-aim, aim), ay = y + api.rand(-aim, aim);
    const d = Math.hypot(ax - bx, ay - by) || 1;
    const sp = (150 + 230 * p) * api.rand(.85, 1.2);
    const size = api.rand(22, 38 + p * 18);
    balls.push({ x: bx, y: by, vx: (ax - bx) / d * sp, vy: (ay - by) / d * sp, size });
  }

  return {
    start() { api.noTime(); t = 0; },
    update(dt) {
      if (dead) return;
      t += dt;
      const s = Math.floor(t);
      if (s !== api.score) api.setScore(s);
      spawnIn -= dt;
      if (spawnIn <= 0) { spawn(); if (t > 20) spawn(); spawnIn = Math.max(.22, .75 - t * .012) * api.rand(.7, 1.2); }
      const kx = (keys.ArrowRight ? 1 : 0) - (keys.ArrowLeft ? 1 : 0), ky = (keys.ArrowDown ? 1 : 0) - (keys.ArrowUp ? 1 : 0);
      if (kx || ky) { tx += kx * 420 * dt; ty += ky * 420 * dt; }
      tx = Math.max(R, Math.min(api.W - R, tx)); ty = Math.max(api.top, Math.min(api.bottom - R, ty));
      x += (tx - x) * Math.min(1, dt * 20); y += (ty - y) * Math.min(1, dt * 20);
      for (const b of balls) {
        b.x += b.vx * dt; b.y += b.vy * dt;
        if (Math.hypot(b.x - x, b.y - y) < b.size * .42 + R * .75) {
          dead = true;
          api.burst(x, y, COLORS.butter, 24); api.shake(.45); api.vibrate([60, 30, 60]);
          setTimeout(() => api.over(), 700);
        }
      }
      balls = balls.filter((b) => b.x > -80 && b.x < api.W + 80 && b.y > api.top - 120 && b.y < api.H + 80);
    },
    draw(ctx) {
      for (const b of balls) ctx.drawImage(SPRITES.snowball, b.x - b.size / 2, b.y - b.size / 2, b.size, b.size);
      if (!dead) {
        ctx.save(); ctx.translate(x, y); ctx.rotate(t * 1.5);
        ctx.drawImage(SPRITES.star, -R * 1.7, -R * 1.7, R * 3.4, R * 3.4);
        ctx.restore();
      }
    },
    // relative drag: the finger never covers the star
    down(px, py) { grab = { px, py, x: tx, y: ty }; },
    move(px, py, isDown) { if (isDown && grab) { tx = grab.x + (px - grab.px) * 1.2; ty = grab.y + (py - grab.py) * 1.2; } },
    up() { grab = null; },
    key(k, d) { if (k.startsWith('Arrow')) keys[k] = d; else return false; },
  };
});
