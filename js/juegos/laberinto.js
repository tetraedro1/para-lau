ADV_ARCADE.define('laberinto', (api) => {
  const { COLORS, SPRITES } = api;
  const TIME = 60;
  let t = 0, level = 0, cols, rows, walls, cell, ox, oy, ball, want = null, tilt = null, drag = null, keyDir = null, moving = null, ended = false;

  // walls[y][x] = {n,e,s,w} true when closed; carved with an iterative backtracker
  function makeMaze(c, r) {
    const w = Array.from({ length: r }, () => Array.from({ length: c }, () => ({ n: 1, e: 1, s: 1, w: 1 })));
    const seen = Array.from({ length: r }, () => Array(c).fill(false));
    const stack = [[0, 0]]; seen[0][0] = true;
    while (stack.length) {
      const [x, y] = stack[stack.length - 1];
      const opts = [[0, -1, 'n', 's'], [1, 0, 'e', 'w'], [0, 1, 's', 'n'], [-1, 0, 'w', 'e']].filter(([dx, dy]) => {
        const nx = x + dx, ny = y + dy; return nx >= 0 && ny >= 0 && nx < c && ny < r && !seen[ny][nx];
      });
      if (!opts.length) { stack.pop(); continue; }
      const [dx, dy, a, b] = api.pick(opts);
      w[y][x][a] = 0; w[y + dy][x + dx][b] = 0; seen[y + dy][x + dx] = true;
      stack.push([x + dx, y + dy]);
    }
    return w;
  }
  function newLevel() {
    cols = 5 + level; rows = Math.round(cols * 1.45);
    walls = makeMaze(cols, rows);
    layout();
    ball = { x: 0, y: 0, px: 0, py: 0 };
    moving = null;
  }
  function layout() {
    const availH = api.bottom - api.top - 30;
    cell = Math.floor(Math.min((api.W - 30) / cols, availH / rows));
    ox = Math.round((api.W - cell * cols) / 2); oy = Math.round(api.top + 10 + (availH - cell * rows) / 2);
  }

  const DIRS = { n: [0, -1], e: [1, 0], s: [0, 1], w: [-1, 0] };
  function inputDir() {
    if (keyDir) return keyDir;
    if (drag && drag.dir) return drag.dir;
    if (tilt) {
      const { x, y } = tilt;
      if (Math.max(Math.abs(x), Math.abs(y)) < 6) return null;
      return Math.abs(x) > Math.abs(y) ? (x > 0 ? 'e' : 'w') : (y > 0 ? 's' : 'n');
    }
    return null;
  }
  function onOrient(e) { if (e.gamma != null) tilt = { x: e.gamma, y: e.beta - 35 }; }

  newLevel();
  return {
    pedirPermiso() {
      try {
        if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
          DeviceOrientationEvent.requestPermission().then((r) => { if (r === 'granted') addEventListener('deviceorientation', onOrient); }).catch(() => {});
        } else addEventListener('deviceorientation', onOrient);
      } catch (_) {}
    },
    stop() { removeEventListener('deviceorientation', onOrient); },
    resize: layout,
    start() { t = 0; },
    update(dt) {
      if (ended) return;
      t += dt;
      api.time(1 - t / TIME);
      if (t >= TIME) { ended = true; api.over(); return; }
      // move cell by cell, like on rails
      if (!moving) {
        const d = inputDir();
        if (d && !walls[ball.y][ball.x][d]) moving = { d, k: 0 };
      }
      if (moving) {
        moving.k += dt * 9;
        if (moving.k >= 1) {
          ball.x += DIRS[moving.d][0]; ball.y += DIRS[moving.d][1];
          const keep = moving.d;
          moving = null;
          if (ball.x === cols - 1 && ball.y === rows - 1) {
            level++;
            api.add(1, api.W / 2, api.H * .4);
            api.float(api.W / 2, api.H * .45, '¡Salida!', COLORS.gold, true);
            api.burst(ox + (cols - .5) * cell, oy + (rows - .5) * cell, COLORS.butter, 20);
            api.vibrate([20, 30, 20]);
            newLevel();
            return;
          }
          const d = inputDir();
          if (d === keep && !walls[ball.y][ball.x][d]) moving = { d, k: 0 };
        }
      }
    },
    draw(ctx) {
      const bx = ball.x + (moving ? DIRS[moving.d][0] * moving.k : 0), by = ball.y + (moving ? DIRS[moving.d][1] * moving.k : 0);
      ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fillRect(ox, oy, cols * cell, rows * cell);
      const gs = cell * .9;
      ctx.drawImage(SPRITES.gifts[0], ox + (cols - .5) * cell - gs / 2, oy + (rows - .5) * cell - gs / 2, gs, gs);
      ctx.strokeStyle = '#B9A7CF'; ctx.lineWidth = Math.max(2, cell * .12); ctx.lineCap = 'round';
      ctx.beginPath();
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
        const c = walls[y][x], X = ox + x * cell, Y = oy + y * cell;
        if (c.n) { ctx.moveTo(X, Y); ctx.lineTo(X + cell, Y); }
        if (c.w) { ctx.moveTo(X, Y); ctx.lineTo(X, Y + cell); }
        if (y === rows - 1 && c.s) { ctx.moveTo(X, Y + cell); ctx.lineTo(X + cell, Y + cell); }
        if (x === cols - 1 && c.e) { ctx.moveTo(X + cell, Y); ctx.lineTo(X + cell, Y + cell); }
      }
      ctx.stroke();
      const r = cell * .3;
      ctx.fillStyle = COLORS.roseD; ctx.beginPath(); ctx.arc(ox + (bx + .5) * cell, oy + (by + .5) * cell, r, 0, 6.283); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.beginPath(); ctx.arc(ox + (bx + .4) * cell, oy + (by + .4) * cell, r * .3, 0, 6.283); ctx.fill();
      ctx.fillStyle = COLORS.ink; ctx.globalAlpha = .5; ctx.textAlign = 'center'; ctx.font = '600 13px "DM Sans", sans-serif';
      ctx.fillText(tilt ? 'Inclina el móvil' : 'Arrastra el dedo hacia donde quieras ir', api.W / 2, api.bottom - 14); ctx.globalAlpha = 1;
    },
    // touch: drag like a joystick, the ball keeps going while you hold
    down(x, y) { drag = { x, y, dir: null }; },
    move(x, y, isDown) {
      if (!isDown || !drag) return;
      const dx = x - drag.x, dy = y - drag.y;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 14) return;
      drag.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'e' : 'w') : (dy > 0 ? 's' : 'n');
      drag.x = x - Math.sign(dx) * Math.min(Math.abs(dx), 14); drag.y = y - Math.sign(dy) * Math.min(Math.abs(dy), 14);
    },
    up() { drag = null; },
    key(k, d) {
      const m = { ArrowUp: 'n', ArrowRight: 'e', ArrowDown: 's', ArrowLeft: 'w' }[k];
      if (!m) return false;
      keyDir = d ? m : (keyDir === m ? null : keyDir);
    },
  };
});
