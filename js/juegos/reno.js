ADV_ARCADE.define('reno', (api) => {
  const { COLORS, rr } = api;
  const G = 1500, FLAP = -470, R = 15;
  let y, vy, pipes, spawnX, speed, dead, wing, started, passed;

  const top = () => api.top;
  const ground = () => api.bottom - 40;
  const gap = () => Math.max(132, 178 - passed * 2.2);
  const birdX = () => Math.min(api.W * .3, 140);

  function reset() {
    y = (top() + ground()) / 2; vy = 0; pipes = []; spawnX = 0; speed = 175; dead = false; wing = 0; started = false; passed = 0;
  }
  reset();

  function addPipe() {
    const g = gap();
    const minY = top() + 40, maxY = ground() - 40 - g;
    const prev = pipes.length ? pipes[pipes.length - 1].gy : (minY + maxY) / 2;
    // gaps can jump far, but not impossibly far
    const range = Math.min(maxY - minY, 120 + passed * 6);
    const gy = Math.max(minY, Math.min(maxY, prev + (Math.random() - .5) * 2 * range));
    pipes.push({ x: api.W + 40, gy, g, w: 62, scored: false });
  }

  function flap() {
    if (dead) return;
    started = true;
    vy = FLAP;
    wing = 1;
    api.vibrate(6);
  }

  function crash() {
    dead = true;
    api.shake(.4);
    api.burst(birdX(), y, '#A97C5D', 18);
    api.vibrate([50, 30, 50]);
    setTimeout(() => api.over(), 650);
  }

  return {
    start() { api.noTime(); flap(); },
    update(dt) {
      wing = Math.max(0, wing - dt * 5);
      if (!started) return;
      vy += G * dt;
      y += vy * dt;
      if (dead) return;
      speed = 175 + Math.min(110, passed * 4);
      spawnX -= speed * dt;
      if (spawnX <= 0) { addPipe(); spawnX = 210 + Math.random() * 40; }
      const bx = birdX();
      for (const p of pipes) {
        p.x -= speed * dt;
        if (!p.scored && p.x + p.w < bx - R) {
          p.scored = true; passed++;
          api.add(1, bx, y - 30);
        }
        // circle vs the two rects
        const hit = (rx, ry, rw, rh) => {
          const cx = Math.max(rx, Math.min(bx, rx + rw)), cy = Math.max(ry, Math.min(y, ry + rh));
          return (bx - cx) ** 2 + (y - cy) ** 2 < (R - 2) ** 2;
        };
        if (hit(p.x, 0, p.w, p.gy) || hit(p.x - 6, p.gy + p.g, p.w + 12, api.H)) crash();
      }
      pipes = pipes.filter((p) => p.x > -100);
      if (y > ground() - R || y < top() - 40) crash();
    },
    draw(ctx) {
      const gr = ground();
      for (const p of pipes) {
        // icicle column from the top
        ctx.fillStyle = '#D6E2EF'; rr(ctx, p.x, -20, p.w, p.gy + 20, 10); ctx.fill();
        ctx.fillStyle = '#fff';
        for (let i = 0; i < 4; i++) {
          const ix = p.x + 6 + i * (p.w - 12) / 3;
          ctx.beginPath(); ctx.moveTo(ix - 5, p.gy - 2); ctx.lineTo(ix + 5, p.gy - 2); ctx.lineTo(ix, p.gy + 10 + (i % 2) * 6); ctx.fill();
        }
        // chimney from the bottom
        const cy = p.gy + p.g;
        ctx.fillStyle = COLORS.rose; ctx.fillRect(p.x, cy + 14, p.w, gr - cy);
        ctx.fillStyle = 'rgba(255,255,255,.22)';
        for (let r = cy + 26; r < gr; r += 16) ctx.fillRect(p.x, r, p.w, 2);
        ctx.fillStyle = COLORS.roseD; rr(ctx, p.x - 6, cy, p.w + 12, 18, 5); ctx.fill();
        ctx.fillStyle = '#fff'; rr(ctx, p.x - 6, cy - 4, p.w + 12, 8, 4); ctx.fill();
      }
      ctx.fillStyle = '#fff'; ctx.fillRect(0, gr, api.W, api.H - gr);
      ctx.fillStyle = 'rgba(176,198,223,.35)'; ctx.fillRect(0, gr, api.W, 3);

      // reindeer
      const bx = birdX();
      const rot = Math.max(-.5, Math.min(1.1, vy / 700));
      ctx.save(); ctx.translate(bx, y); ctx.rotate(rot);
      ctx.strokeStyle = '#8C6A50'; ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-2, -12); ctx.lineTo(-6, -24); ctx.moveTo(-5, -20); ctx.lineTo(-12, -24); ctx.moveTo(4, -12); ctx.lineTo(6, -25); ctx.moveTo(5, -20); ctx.lineTo(12, -23); ctx.stroke();
      ctx.fillStyle = '#B98B68'; ctx.beginPath(); ctx.ellipse(0, 0, R + 2, R, 0, 0, 6.283); ctx.fill();
      ctx.fillStyle = '#E8D3C0'; ctx.beginPath(); ctx.ellipse(6, 4, 9, 7, 0, 0, 6.283); ctx.fill();
      ctx.fillStyle = COLORS.ink; ctx.beginPath(); ctx.arc(5, -4, 2.4, 0, 6.283); ctx.fill();
      ctx.fillStyle = '#E26D6D'; ctx.beginPath(); ctx.arc(15, 3, 4.2, 0, 6.283); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.beginPath(); ctx.arc(14, 2, 1.3, 0, 6.283); ctx.fill();
      // little wing/scarf flapping
      ctx.fillStyle = COLORS.sage;
      ctx.beginPath(); ctx.ellipse(-8, 4 - wing * 8, 9, 5, -.5 - wing * .6, 0, 6.283); ctx.fill();
      ctx.restore();

      if (!started && !dead) {
        ctx.fillStyle = COLORS.ink; ctx.globalAlpha = .6; ctx.textAlign = 'center'; ctx.font = '600 16px "DM Sans", sans-serif';
        ctx.fillText('toca para volar', api.W / 2, y + 60); ctx.globalAlpha = 1;
      }
    },
    down: flap,
    key(k, d) { if (d && (k === ' ' || k === 'ArrowUp')) flap(); else return false; },
  };
});
