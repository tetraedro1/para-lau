ADV_ARCADE.define('serpiente', (api) => {
  const { COLORS, SPRITES, rr } = api;
  const COLS = 14;
  const LIGHTS = ['#E2B3A8', '#EBCB86', '#AFC8AA', '#B0C6DF', '#C4B6DD', '#E3A0A0'];
  let rows, cell, ox, oy, snake, dir, queue, food, stepT, acc, dead, grow, sx = null, sy = null;

  function layout() {
    const availH = api.bottom - api.top - 30;
    cell = Math.floor(Math.min((api.W - 24) / COLS, availH / 18, 34));
    rows = Math.max(12, Math.floor(availH / cell));
    ox = Math.round((api.W - cell * COLS) / 2); oy = Math.round(api.top + 10 + (availH - rows * cell) / 2);
  }
  function reset() {
    layout();
    const r = Math.floor(rows / 2);
    snake = [{ x: 5, y: r }, { x: 4, y: r }, { x: 3, y: r }];
    dir = { x: 1, y: 0 }; queue = []; dead = false; grow = 0; acc = 0;
    stepT = .2;
    placeFood();
  }
  function placeFood() {
    let f;
    do { f = { x: api.randInt(0, COLS - 1), y: api.randInt(0, rows - 1) }; } while (snake.some((s) => s.x === f.x && s.y === f.y));
    food = f;
  }
  function turn(nx, ny) {
    const last = queue.length ? queue[queue.length - 1] : dir;
    if ((nx === -last.x && ny === -last.y) || (nx === last.x && ny === last.y)) return;
    if (queue.length < 3) queue.push({ x: nx, y: ny });
  }
  function step() {
    if (queue.length) dir = queue.shift();
    const h = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
    if (h.x < 0 || h.y < 0 || h.x >= COLS || h.y >= rows || snake.some((s, i) => i < snake.length - (grow ? 0 : 1) && s.x === h.x && s.y === h.y)) {
      dead = true; api.shake(.4); api.vibrate([50, 30, 50]);
      setTimeout(() => api.over(), 700);
      return;
    }
    snake.unshift(h);
    if (h.x === food.x && h.y === food.y) {
      grow += 2;
      const px = ox + (h.x + .5) * cell, py = oy + (h.y + .5) * cell;
      api.add(1, px, py - 14);
      api.burst(px, py, COLORS.butter, 10);
      api.vibrate(8);
      stepT = Math.max(.075, .2 - api.score * .0045);
      placeFood();
    }
    if (grow > 0) grow--; else snake.pop();
  }

  reset();
  return {
    resize: layout,
    start() { api.noTime(); },
    update(dt) {
      if (dead) return;
      acc += dt;
      while (acc >= stepT && !dead) { acc -= stepT; step(); }
    },
    draw(ctx) {
      ctx.fillStyle = 'rgba(255,255,255,.4)'; rr(ctx, ox - 4, oy - 4, COLS * cell + 8, rows * cell + 8, 14); ctx.fill();
      ctx.strokeStyle = 'rgba(61,56,72,.12)'; ctx.lineWidth = 2; ctx.stroke();
      const fs = cell * 1.05 * (1 + Math.sin(performance.now() / 200) * .06);
      ctx.drawImage(SPRITES.star, ox + (food.x + .5) * cell - fs / 2, oy + (food.y + .5) * cell - fs / 2, fs, fs);
      // the wire, then a bulb on every segment
      ctx.strokeStyle = '#7C9A78'; ctx.lineWidth = 2.5; ctx.lineJoin = 'round';
      ctx.beginPath();
      snake.forEach((s, i) => { const px = ox + (s.x + .5) * cell, py = oy + (s.y + .5) * cell; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); });
      ctx.stroke();
      const tw = performance.now() / 300;
      snake.forEach((s, i) => {
        const px = ox + (s.x + .5) * cell, py = oy + (s.y + .5) * cell;
        const col = LIGHTS[i % LIGHTS.length];
        ctx.globalAlpha = .3 + .25 * Math.sin(tw + i);
        ctx.fillStyle = col; ctx.beginPath(); ctx.arc(px, py, cell * .55, 0, 6.283); ctx.fill();
        ctx.globalAlpha = 1;
        ctx.beginPath(); ctx.ellipse(px, py, cell * (i ? .3 : .38), cell * (i ? .36 : .44), 0, 0, 6.283); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.beginPath(); ctx.arc(px - cell * .1, py - cell * .12, cell * .08, 0, 6.283); ctx.fill();
      });
      const h = snake[0];
      ctx.fillStyle = COLORS.ink;
      const ex = dir.y ? cell * .14 : 0, ey = dir.x ? cell * .14 : 0;
      for (const sgn of [-1, 1]) { ctx.beginPath(); ctx.arc(ox + (h.x + .5) * cell + dir.x * cell * .12 + sgn * ex, oy + (h.y + .5) * cell + dir.y * cell * .12 + sgn * ey, cell * .06, 0, 6.283); ctx.fill(); }
    },
    down(x, y) { sx = x; sy = y; },
    move(x, y, isDown) {
      if (!isDown || sx == null) return;
      const dx = x - sx, dy = y - sy;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 22) return;
      if (Math.abs(dx) > Math.abs(dy)) turn(dx > 0 ? 1 : -1, 0); else turn(0, dy > 0 ? 1 : -1);
      sx = x; sy = y;
    },
    up() { sx = null; },
    key(k, d) {
      const m = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }[k];
      if (!m) return false;
      if (d) turn(m[0], m[1]);
    },
  };
});
