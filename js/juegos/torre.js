ADV_ARCADE.define('torre', (api) => {
  const { COLORS, rr } = api;
  const BH = 34;
  const PAL = [COLORS.rose, COLORS.sage, COLORS.sky, COLORS.butter, COLORS.lilac, COLORS.pink];
  let stack, cur, falling, camY, camTarget, speed, perfectRun, over;

  const baseY = () => api.bottom - 80;
  function reset() {
    const w = Math.min(api.W * .62, 260);
    stack = [{ x: (api.W - w) / 2, w, c: PAL[0] }];
    falling = []; camY = 0; camTarget = 0; speed = 150; perfectRun = 0; over = false;
    spawn();
  }
  function spawn() {
    const top = stack[stack.length - 1];
    const fromLeft = stack.length % 2 === 0;
    cur = { x: fromLeft ? -top.w : api.W, w: top.w, dir: fromLeft ? 1 : -1, c: PAL[stack.length % PAL.length] };
    speed = Math.min(430, 150 + stack.length * 11);
  }
  const yOf = (i) => baseY() - i * BH;

  function drop() {
    if (over || !cur) return;
    const top = stack[stack.length - 1];
    const left = Math.max(cur.x, top.x), right = Math.min(cur.x + cur.w, top.x + top.w);
    const overlap = right - left;
    const y = yOf(stack.length);
    if (overlap <= 0) {
      falling.push({ ...cur, y, vy: 0, vr: (Math.random() - .5) * 3, rot: 0 });
      cur = null; over = true;
      api.shake(.4); api.vibrate([50, 30, 50]);
      setTimeout(() => api.over(), 900);
      return;
    }
    if (Math.abs(cur.x - top.x) <= 5) {
      // perfect: snap and keep the width
      perfectRun++;
      stack.push({ x: top.x, w: top.w, c: cur.c });
      const bonus = perfectRun >= 3 ? 2 : 1;
      api.add(bonus, api.W / 2, y - camY - 20, COLORS.gold);
      if (perfectRun >= 3) api.float(api.W / 2, y - camY - 50, '¡Perfecto!', COLORS.gold, true);
      api.burst(top.x + top.w / 2, y - camY + BH / 2, '#fff', 16);
      api.vibrate([10, 20, 10]);
    } else {
      perfectRun = 0;
      const cut = cur.w - overlap;
      const cutX = cur.x < top.x ? cur.x : right;
      falling.push({ x: cutX, w: cut, c: cur.c, y, vy: 0, vr: (cur.x < top.x ? -1 : 1) * (1 + Math.random() * 2), rot: 0 });
      stack.push({ x: left, w: overlap, c: cur.c });
      api.add(1);
      api.vibrate(8);
    }
    camTarget = Math.min(0, -(stack.length - 7) * BH);
    spawn();
  }

  reset();
  return {
    start() { api.noTime(); },
    update(dt) {
      if (cur) {
        cur.x += cur.dir * speed * dt;
        if (cur.x > api.W - cur.w * .15 && cur.dir > 0) cur.dir = -1;
        if (cur.x < -cur.w * .85 && cur.dir < 0) cur.dir = 1;
      }
      camY += (camTarget - camY) * Math.min(1, dt * 6);
      for (const f of falling) { f.vy += 1400 * dt; f.y += f.vy * dt; f.rot += f.vr * dt; }
      falling = falling.filter((f) => f.y - camY < api.H + 200);
    },
    draw(ctx) {
      ctx.save(); ctx.translate(0, -camY);
      ctx.fillStyle = '#fff'; ctx.fillRect(0, baseY() + BH, api.W, 400);
      const box = (b, y) => {
        ctx.fillStyle = b.c; rr(ctx, b.x, y, b.w, BH - 3, 6); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(b.x + 4, y + 3, Math.max(0, b.w - 8), 4);
        if (b.w > 18) { ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fillRect(b.x + b.w / 2 - 4, y, 8, BH - 3); }
      };
      stack.forEach((b, i) => box(b, yOf(i)));
      if (cur) box(cur, yOf(stack.length));
      for (const f of falling) {
        ctx.save(); ctx.translate(f.x + f.w / 2, f.y + BH / 2); ctx.rotate(f.rot);
        ctx.globalAlpha = .9; box({ ...f, x: -f.w / 2 }, -BH / 2); ctx.restore();
      }
      ctx.restore();
    },
    down: drop,
    key(k, d) { if (d && (k === ' ' || k === 'Enter')) drop(); else return false; },
  };
});
