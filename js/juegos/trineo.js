ADV_ARCADE.define('trineo', (api) => {
  const { COLORS, SPRITES, rr } = api;
  const G = 2600, JUMP = -880;
  let dist = 0, speed = 320, y = 0, vy = 0, onGround = true, holding = false, obs = [], nextIn = 1, dead = false, hills = [], tAll = 0;

  const ground = () => api.bottom - 120;
  const sx = () => Math.min(110, api.W * .22);

  function spawn() {
    const p = Math.min(1, dist / 12000);
    const r = Math.random();
    const gx = api.W + 40;
    if (r < .4) obs.push({ kind: 'muneco', x: gx, w: 34, h: 58 });
    else if (r < .75) obs.push({ kind: 'regalos', x: gx, w: 52 + Math.random() * 30, h: 30 });
    else obs.push({ kind: 'bola', x: gx, w: 30, h: 30, roll: 120 + Math.random() * 120 });
    // pairs that need a well-timed long jump
    if (p > .3 && Math.random() < .3) obs.push({ kind: 'regalos', x: gx + 70 + Math.random() * 30, w: 40, h: 30 });
    const gap = api.rand(.85, 1.6) * Math.max(.55, 1.05 - p * .45);
    nextIn = gap;
  }

  function jump() {
    if (dead || !onGround) return;
    vy = JUMP; onGround = false; holding = true;
    api.vibrate(6);
  }

  for (let i = 0; i < 6; i++) hills.push({ x: i * 160, h: api.rand(30, 70) });
  return {
    start() { api.noTime(); },
    update(dt) {
      if (dead) return;
      tAll += dt;
      speed = Math.min(760, 320 + dist * .028);
      dist += speed * dt;
      const sc = Math.floor(dist / 10);
      if (sc !== api.score) api.setScore(sc);
      // short tap = small hop, holding = full jump
      if (!onGround) {
        vy += G * dt * (holding && vy < 0 ? .55 : 1);
        y += vy * dt;
        if (y >= 0) { y = 0; vy = 0; onGround = true; }
      }
      nextIn -= dt;
      if (nextIn <= 0) spawn();
      const px = sx(), gy = ground();
      for (const o of obs) {
        o.x -= (speed + (o.roll || 0)) * dt;
        const pw = 46, ph = 22;
        if (px + pw / 2 - 6 > o.x && px - pw / 2 + 6 < o.x + o.w && gy + y > gy - o.h + 6) {
          dead = true;
          api.shake(.45); api.burst(px, gy + y - 10, '#fff', 22); api.vibrate([60, 30, 60]);
          setTimeout(() => api.over(), 700);
        }
      }
      obs = obs.filter((o) => o.x > -120);
      for (const h of hills) { h.x -= speed * .25 * dt; if (h.x < -200) { h.x += 960; h.h = api.rand(30, 70); } }
    },
    draw(ctx) {
      const gy = ground();
      ctx.fillStyle = 'rgba(214,226,239,.8)';
      for (const h of hills) { ctx.beginPath(); ctx.ellipse(h.x, gy + 4, 140, h.h, 0, Math.PI, 0); ctx.fill(); }
      ctx.fillStyle = '#fff'; ctx.fillRect(0, gy, api.W, api.H - gy);
      ctx.fillStyle = 'rgba(176,198,223,.5)';
      for (let i = 0; i < 12; i++) { const x = ((i * 97 - dist * .9) % (api.W + 60) + api.W + 60) % (api.W + 60) - 30; ctx.fillRect(x, gy + 16 + (i % 3) * 14, 18, 3); }
      for (const o of obs) {
        if (o.kind === 'muneco') {
          ctx.fillStyle = '#fff'; ctx.strokeStyle = '#C9D4E3'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(o.x + o.w / 2, gy - 16, 17, 0, 6.283); ctx.fill(); ctx.stroke();
          ctx.beginPath(); ctx.arc(o.x + o.w / 2, gy - 44, 12, 0, 6.283); ctx.fill(); ctx.stroke();
          ctx.fillStyle = COLORS.ink; ctx.beginPath(); ctx.arc(o.x + o.w / 2 - 4, gy - 46, 1.8, 0, 6.283); ctx.arc(o.x + o.w / 2 + 4, gy - 46, 1.8, 0, 6.283); ctx.fill();
          ctx.fillStyle = '#F2A65A'; ctx.beginPath(); ctx.moveTo(o.x + o.w / 2, gy - 42); ctx.lineTo(o.x + o.w / 2 + 10, gy - 40); ctx.lineTo(o.x + o.w / 2, gy - 38); ctx.fill();
          ctx.fillStyle = COLORS.rose; ctx.fillRect(o.x + o.w / 2 - 12, gy - 34, 24, 5);
        } else if (o.kind === 'regalos') {
          const n = Math.max(1, Math.round(o.w / 30));
          for (let i = 0; i < n; i++) ctx.drawImage(SPRITES.gifts[i % 4], o.x + i * (o.w / n) - 4, gy - o.h - 8, o.w / n + 8, o.w / n + 8);
        } else {
          ctx.save(); ctx.translate(o.x + o.w / 2, gy - o.h / 2); ctx.rotate(-tAll * 8);
          ctx.drawImage(SPRITES.snowball, -o.w / 2 - 2, -o.h / 2 - 2, o.w + 4, o.h + 4);
          ctx.strokeStyle = 'rgba(176,198,223,.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, o.w * .25, 0, 2); ctx.stroke();
          ctx.restore();
        }
      }
      const px = sx(), py = gy + y;
      const tilt = onGround ? Math.sin(tAll * 20) * .03 : Math.max(-.3, Math.min(.3, vy / 2500));
      ctx.save(); ctx.translate(px, py); ctx.rotate(tilt);
      ctx.fillStyle = '#C29470'; ctx.beginPath(); ctx.ellipse(-4, -30, 15, 12, 0, 0, 6.283); ctx.fill();
      ctx.fillStyle = '#F2A65A'; ctx.beginPath(); ctx.arc(-4, -44, 6, 0, 6.283); ctx.fill();
      ctx.fillStyle = COLORS.ink; ctx.beginPath(); ctx.arc(3, -32, 1.8, 0, 6.283); ctx.fill();
      ctx.fillStyle = COLORS.rose; rr(ctx, -24, -20, 48, 14, 6); ctx.fill();
      ctx.strokeStyle = COLORS.gold; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-24, -2); ctx.lineTo(18, -2); ctx.quadraticCurveTo(30, -2, 27, -12); ctx.stroke();
      ctx.restore();
      if (dist < 400) { ctx.fillStyle = COLORS.ink; ctx.globalAlpha = .55; ctx.textAlign = 'center'; ctx.font = '600 15px "DM Sans", sans-serif'; ctx.fillText('toca para saltar · mantén para saltar más', api.W / 2, gy + 70); ctx.globalAlpha = 1; }
    },
    down: jump,
    up() { holding = false; },
    key(k, d) {
      if (k === ' ' || k === 'ArrowUp') { if (d) jump(); else holding = false; }
      else return false;
    },
  };
});
