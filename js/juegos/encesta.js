ADV_ARCADE.define('encesta', (api) => {
  const { COLORS, SPRITES, rr } = api;
  const TIME = 45, G = 1100, GS = 46;
  let t = 0, chim, gift, wind = 0, swipe = null, streak = 0, img;

  const startPos = () => ({ x: api.W / 2, y: api.bottom - 110 });
  function newGift() {
    const p = startPos();
    gift = { x: p.x, y: p.y, vx: 0, vy: 0, flying: false, rot: 0, scored: false };
    img = api.pick(SPRITES.gifts);
    const lvl = Math.min(1, api.score / 14);
    wind = api.rand(-1, 1) * (40 + 220 * lvl);
  }
  function layoutChim() {
    chim = chim || { x: api.W / 2, dir: 1 };
    chim.y = api.top + 120; chim.w = Math.max(62, 92 - api.score * 1.6);
  }

  layoutChim(); newGift();
  return {
    start() { t = 0; },
    update(dt) {
      t += dt;
      api.time(1 - t / TIME);
      if (t >= TIME && !gift.flying) { api.over(); return; }
      if (t >= TIME + 3) { api.over(); return; }
      layoutChim();
      const sp = 40 + api.score * 9;
      chim.x += chim.dir * sp * dt;
      if (chim.x > api.W - chim.w) chim.dir = -1;
      if (chim.x < chim.w) chim.dir = 1;
      if (!gift.flying) return;
      const prevY = gift.y;
      gift.vx += wind * dt; gift.vy += G * dt;
      gift.x += gift.vx * dt; gift.y += gift.vy * dt; gift.rot += gift.vx * dt * .01;
      const top = chim.y, half = chim.w / 2;
      if (gift.vy > 0 && prevY < top && gift.y >= top) {
        const off = Math.abs(gift.x - chim.x);
        if (off < half - GS * .25) {
          gift.scored = true; streak++;
          const pts = streak >= 3 ? 2 : 1;
          api.add(pts, chim.x, top - 30);
          if (streak >= 3) api.float(chim.x, top - 60, 'Racha', COLORS.gold, true);
          api.burst(chim.x, top, '#fff', 18); api.vibrate([15, 25, 15]);
          newGift(); return;
        } else if (off < half + GS * .3) {
          // hits the rim and bounces away
          gift.vy = -Math.abs(gift.vy) * .45; gift.vx += (gift.x < chim.x ? -1 : 1) * 160;
          api.vibrate(10);
        }
      }
      if (gift.y > api.H + 60 || gift.x < -80 || gift.x > api.W + 80) { streak = 0; newGift(); }
    },
    draw(ctx) {
      // wind flag
      const wx = api.W / 2, wy = api.top + 30;
      ctx.fillStyle = COLORS.ink; ctx.globalAlpha = .6; ctx.textAlign = 'center'; ctx.font = '600 13px "DM Sans", sans-serif';
      ctx.fillText(Math.abs(wind) < 15 ? 'Sin viento' : `Viento ${wind > 0 ? '→' : '←'} ${Math.round(Math.abs(wind) / 25)}`, wx, wy);
      ctx.globalAlpha = 1;
      const top = chim.y, w = chim.w;
      ctx.fillStyle = COLORS.rose; ctx.fillRect(chim.x - w / 2 + 6, top + 10, w - 12, api.H);
      ctx.fillStyle = 'rgba(255,255,255,.22)';
      for (let r = top + 22; r < api.bottom; r += 16) ctx.fillRect(chim.x - w / 2 + 6, r, w - 12, 2);
      ctx.fillStyle = COLORS.roseD; rr(ctx, chim.x - w / 2, top, w, 16, 5); ctx.fill();
      ctx.fillStyle = '#fff'; rr(ctx, chim.x - w / 2, top - 4, w, 8, 4); ctx.fill();
      ctx.fillStyle = '#3D3848'; ctx.globalAlpha = .35; ctx.fillRect(chim.x - w / 2 + 8, top + 4, w - 16, 6); ctx.globalAlpha = 1;
      ctx.save(); ctx.translate(gift.x, gift.y); ctx.rotate(gift.rot);
      ctx.drawImage(img, -GS / 2, -GS / 2, GS, GS); ctx.restore();
      if (!gift.flying) {
        ctx.fillStyle = COLORS.ink; ctx.globalAlpha = .5; ctx.font = '600 14px "DM Sans", sans-serif';
        ctx.fillText('desliza hacia arriba para lanzar', api.W / 2, api.bottom - 50); ctx.globalAlpha = 1;
        if (swipe) {
          ctx.strokeStyle = 'rgba(61,56,72,.25)'; ctx.setLineDash([6, 6]); ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(gift.x, gift.y); ctx.lineTo(gift.x - (swipe.cx - swipe.x) * .6, gift.y - (swipe.cy - swipe.y) * .6); ctx.stroke(); ctx.setLineDash([]);
        }
      }
    },
    down(x, y) { if (!gift.flying) swipe = { x, y, cx: x, cy: y, t: performance.now(), hist: [{ x, y, t: performance.now() }] }; },
    move(x, y, isDown) {
      if (!swipe || !isDown) return;
      swipe.cx = x; swipe.cy = y;
      swipe.hist.push({ x, y, t: performance.now() });
      if (swipe.hist.length > 6) swipe.hist.shift();
    },
    up(x, y) {
      if (!swipe || gift.flying) { swipe = null; return; }
      const h = swipe.hist, a = h[0], now = performance.now();
      const dt = Math.max(16, now - a.t) / 1000;
      const vx = (x - a.x) / dt, vy = (y - a.y) / dt;
      swipe = null;
      if (vy > -300) return;
      const sp = Math.min(1, 1500 / Math.hypot(vx, vy));
      gift.vx = vx * sp * .55; gift.vy = vy * sp * 1.05;
      gift.flying = true;
      api.vibrate(6);
    },
  };
});
