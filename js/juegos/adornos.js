ADV_ARCADE.define('adornos', (api) => {
  const { COLORS, rr } = api;
  const PAL = [COLORS.rose, COLORS.butter, COLORS.sage, COLORS.sky, COLORS.lilac, COLORS.pink];
  let level = 1, bricks, ball, padX, padTarget, lives = 2, launched = false, keyDir = 0, ended = false;

  const padW = () => Math.max(70, Math.min(110, api.W * .22) - (level - 1) * 8);
  const padY = () => api.bottom - 70;
  const R = 8;

  function build() {
    const cols = 8, rows = 4 + Math.min(3, level);
    const area = Math.min(api.W - 24, 440);
    const bw = area / cols;
    const x0 = (api.W - area) / 2, y0 = api.top + 30;
    bricks = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      if (level > 1 && Math.random() < .12) continue;
      bricks.push({ x: x0 + c * bw + bw / 2, y: y0 + r * bw * .78 + bw / 2, r: bw * .36, c: PAL[(r + c) % PAL.length], hp: level >= 3 && r < 2 ? 2 : 1 });
    }
  }
  function resetBall() {
    launched = false;
    ball = { x: padX, y: padY() - 14, vx: 0, vy: 0 };
  }
  const speed = () => Math.min(620, 360 + level * 50 + (40 - bricks.length) * 2);

  function launch() {
    if (launched || ended) return;
    launched = true;
    const a = -Math.PI / 2 + api.rand(-.5, .5);
    ball.vx = Math.cos(a) * speed(); ball.vy = Math.sin(a) * speed();
  }

  padX = padTarget = api.W / 2;
  build(); resetBall();
  return {
    start() { api.noTime(); },
    update(dt) {
      if (ended) return;
      if (keyDir) padTarget += keyDir * 640 * dt;
      const pw = padW();
      padTarget = Math.max(pw / 2, Math.min(api.W - pw / 2, padTarget));
      padX += (padTarget - padX) * Math.min(1, dt * 22);
      if (!launched) { ball.x = padX; ball.y = padY() - 14; return; }
      // sub-steps so a fast ball can't tunnel through a brick
      const steps = Math.ceil(speed() * dt / (R * .8));
      for (let s = 0; s < steps; s++) {
        const h = dt / steps;
        ball.x += ball.vx * h; ball.y += ball.vy * h;
        if (ball.x < R) { ball.x = R; ball.vx = Math.abs(ball.vx); }
        if (ball.x > api.W - R) { ball.x = api.W - R; ball.vx = -Math.abs(ball.vx); }
        if (ball.y < api.top) { ball.y = api.top; ball.vy = Math.abs(ball.vy); }
        const py = padY();
        if (ball.vy > 0 && ball.y + R >= py && ball.y + R <= py + 16 && Math.abs(ball.x - padX) < pw / 2 + R) {
          // where it hits the bar decides the angle
          const k = (ball.x - padX) / (pw / 2);
          const a = -Math.PI / 2 + k * 1.05;
          const sp = speed();
          ball.vx = Math.cos(a) * sp; ball.vy = Math.sin(a) * sp;
          ball.y = py - R;
          api.vibrate(4);
        }
        for (const b of bricks) {
          if (b.dead) continue;
          const dx = ball.x - b.x, dy = ball.y - b.y, d = Math.hypot(dx, dy);
          if (d < b.r + R) {
            const nx = dx / d, ny = dy / d, dot = ball.vx * nx + ball.vy * ny;
            if (dot < 0) { ball.vx -= 2 * dot * nx; ball.vy -= 2 * dot * ny; }
            b.hp--;
            if (b.hp <= 0) {
              b.dead = true;
              api.add(1);
              api.burst(b.x, b.y, b.c, 10);
              api.vibrate(6);
            } else api.burst(b.x, b.y, '#fff', 5);
            break;
          }
        }
      }
      bricks = bricks.filter((b) => !b.dead);
      if (!bricks.length) {
        level++;
        api.float(api.W / 2, api.H * .45, `Nivel ${level}`, COLORS.gold, true);
        build(); resetBall();
      }
      if (ball.y > api.H + 20) {
        lives--;
        api.shake(.35); api.vibrate([40, 30, 40]);
        if (lives <= 0) { ended = true; setTimeout(() => api.over(), 500); }
        else resetBall();
      }
    },
    draw(ctx) {
      for (const b of bricks) {
        ctx.strokeStyle = 'rgba(61,56,72,.25)'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(b.x, b.y - b.r - 8); ctx.lineTo(b.x, b.y - b.r); ctx.stroke();
        ctx.fillStyle = COLORS.gold; ctx.fillRect(b.x - 3, b.y - b.r - 4, 6, 5);
        ctx.fillStyle = b.c; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 6.283); ctx.fill();
        if (b.hp > 1) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(b.x, b.y, b.r * .6, 0, 6.283); ctx.stroke(); }
        ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.arc(b.x - b.r * .3, b.y - b.r * .3, b.r * .22, 0, 6.283); ctx.fill();
      }
      const pw = padW(), py = padY();
      ctx.fillStyle = COLORS.ink; rr(ctx, padX - pw / 2, py, pw, 12, 6); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ball.x, ball.y, R, 0, 6.283); ctx.fill();
      ctx.strokeStyle = '#C9D4E3'; ctx.lineWidth = 1.5; ctx.stroke();
      for (let i = 0; i < lives; i++) { ctx.fillStyle = COLORS.pink; ctx.beginPath(); ctx.arc(20 + i * 18, api.bottom - 20, 6, 0, 6.283); ctx.fill(); }
      if (!launched) { ctx.fillStyle = COLORS.ink; ctx.globalAlpha = .55; ctx.textAlign = 'center'; ctx.font = '600 15px "DM Sans", sans-serif'; ctx.fillText('toca para lanzar', api.W / 2, py - 50); ctx.globalAlpha = 1; }
    },
    down(x) { padTarget = x; if (!launched) launch(); },
    move(x) { padTarget = x; },
    key(k, d) {
      if (k === 'ArrowLeft') keyDir = d ? -1 : (keyDir < 0 ? 0 : keyDir);
      else if (k === 'ArrowRight') keyDir = d ? 1 : (keyDir > 0 ? 0 : keyDir);
      else if (k === ' ' && d) launch();
      else return false;
    },
  };
});
