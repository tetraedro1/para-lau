ADV_ARCADE.define('fusion', (api) => {
  const N = 4;
  const COL = {
    2: ['#FBF3EE', '#6E6879'], 4: ['#F6E3DC', '#6E6879'], 8: ['#F2D4CC', '#3D3848'], 16: ['#E8B9AE', '#fff'],
    32: ['#D99A90', '#fff'], 64: ['#C9827A', '#fff'], 128: ['#D3E2D0', '#3D3848'], 256: ['#AFC8AA', '#fff'],
    512: ['#8BA586', '#fff'], 1024: ['#C4B6DD', '#fff'], 2048: ['#C8A26A', '#fff'], 4096: ['#3D3848', '#fff'],
  };
  const css = `
    .f48 { position:absolute; left:50%; top:50%; transform:translate(-50%,-46%); width:min(90vw, 400px); aspect-ratio:1; padding:10px; border-radius:20px; background:rgba(196,182,221,.35); touch-action:none; }
    .f48 .cell, .f48 .tile { position:absolute; width:calc((100% - 50px) / 4); height:calc((100% - 50px) / 4); border-radius:12px; }
    .f48 .cell { background:rgba(255,255,255,.45); }
    .f48 .tile { display:grid; place-items:center; font:600 26px "DM Sans",sans-serif; transition:transform .11s ease-out; box-shadow:0 3px 8px -4px rgba(61,56,72,.3); }
    .f48 .tile.small { font-size:21px; } .f48 .tile.xs { font-size:17px; }
    .f48 .tile.new { animation:fnew .18s ease-out; }
    .f48 .tile.merged { animation:fpop .2s cubic-bezier(.34,1.56,.64,1); z-index:2; }
    @keyframes fnew { from { scale:.2; opacity:0; } }
    @keyframes fpop { 50% { scale:1.18; } }`;

  let board, tiles = [], nextId = 1, moving = false, ended = false;
  const style = document.createElement('style'); style.textContent = css; api.layer.appendChild(style);
  board = document.createElement('div'); board.className = 'f48'; api.layer.appendChild(board);
  const pos = (r, c) => `translate(calc(${c} * (100% + 10px) + 10px - 10px), calc(${r} * (100% + 10px) + 10px - 10px))`;
  for (let i = 0; i < N * N; i++) {
    const d = document.createElement('div'); d.className = 'cell';
    d.style.left = '10px'; d.style.top = '10px'; d.style.transform = pos(Math.floor(i / N), i % N);
    board.appendChild(d);
  }

  function addTile() {
    const free = [];
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (!tiles.some((t) => t.r === r && t.c === c)) free.push([r, c]);
    if (!free.length) return;
    const [r, c] = api.pick(free);
    const t = { id: nextId++, v: Math.random() < .88 ? 2 : 4, r, c, el: document.createElement('div') };
    t.el.className = 'tile new'; t.el.style.left = '10px'; t.el.style.top = '10px';
    paint(t); board.appendChild(t.el); tiles.push(t);
  }
  function paint(t) {
    const [bg, fg] = COL[t.v] || COL[4096];
    t.el.style.background = bg; t.el.style.color = fg;
    t.el.textContent = t.v;
    t.el.classList.toggle('small', t.v >= 128 && t.v < 1024);
    t.el.classList.toggle('xs', t.v >= 1024);
    t.el.style.transform = pos(t.r, t.c);
  }

  function move(dir) {
    if (moving || ended || !api.playing) return;
    const dr = dir === 'up' ? -1 : dir === 'down' ? 1 : 0, dc = dir === 'left' ? -1 : dir === 'right' ? 1 : 0;
    const order = [...tiles].sort((a, b) => (dr ? (dr > 0 ? b.r - a.r : a.r - b.r) : (dc > 0 ? b.c - a.c : a.c - b.c)));
    const grid = {}; for (const t of tiles) grid[t.r + ',' + t.c] = t;
    let moved = false, gained = 0;
    const merged = new Set(), dead = [];
    for (const t of order) {
      let r = t.r, c = t.c;
      while (true) {
        const nr = r + dr, nc = c + dc;
        if (nr < 0 || nr >= N || nc < 0 || nc >= N) break;
        const o = grid[nr + ',' + nc];
        if (!o) { r = nr; c = nc; continue; }
        if (o.v === t.v && !merged.has(o.id) && !o.dying) {
          // t slides into o and disappears, o doubles
          delete grid[t.r + ',' + t.c];
          t.r = nr; t.c = nc; t.dying = true; dead.push(t);
          o.v *= 2; gained += o.v; merged.add(o.id);
          moved = true;
          r = null;
        }
        break;
      }
      if (r === null) { t.el.style.transform = pos(t.r, t.c); continue; }
      if (r !== t.r || c !== t.c) { delete grid[t.r + ',' + t.c]; t.r = r; t.c = c; grid[r + ',' + c] = t; moved = true; t.el.style.transform = pos(r, c); }
    }
    if (!moved) return;
    moving = true;
    api.vibrate(5);
    setTimeout(() => {
      for (const t of dead) t.el.remove();
      tiles = tiles.filter((t) => !t.dying);
      for (const t of tiles) {
        if (merged.has(t.id)) { paint(t); t.el.classList.remove('merged', 'new'); void t.el.offsetWidth; t.el.classList.add('merged'); }
      }
      if (gained) {
        const rect = board.getBoundingClientRect();
        api.add(gained, rect.left + rect.width / 2, rect.top - 8);
        if (Math.max(...tiles.map((t) => t.v)) >= 512 && gained >= 512) api.burst(rect.left + rect.width / 2, rect.top + rect.height / 2, api.COLORS.gold, 20);
      }
      addTile();
      moving = false;
      if (!canMove()) { ended = true; api.shake(.3); setTimeout(() => api.over(), 700); }
    }, 115);
  }
  function canMove() {
    if (tiles.length < N * N) return true;
    const g = {}; for (const t of tiles) g[t.r + ',' + t.c] = t.v;
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      if (g[r + ',' + c] === g[r + ',' + (c + 1)] || g[r + ',' + c] === g[(r + 1) + ',' + c]) return true;
    }
    return false;
  }

  let sx = 0, sy = 0, swiping = false;
  board.addEventListener('pointerdown', (e) => { swiping = true; sx = e.clientX; sy = e.clientY; board.setPointerCapture(e.pointerId); });
  board.addEventListener('pointermove', (e) => {
    if (!swiping) return;
    const dx = e.clientX - sx, dy = e.clientY - sy;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
    swiping = false;
    move(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
  });
  board.addEventListener('pointerup', () => { swiping = false; });
  board.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });

  addTile(); addTile();
  return {
    start() { api.noTime(); },
    key(k, d) {
      const m = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' }[k];
      if (!m) return false;
      if (d) move(m);
    },
  };
});
