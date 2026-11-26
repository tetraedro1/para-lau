ADV_ARCADE.define('puzle', (api) => {
  const N = 3, TIME = 120;
  const PAL = ['#F2D4CC', '#D3E2D0', '#D6E2EF', '#F3E6C4', '#E2DAEE', '#F6DCE3', '#E4ECE6', '#EBCB86'];
  const css = `
    .pz { position:absolute; left:50%; top:50%; transform:translate(-50%,-46%); width:min(86vw, 360px); aspect-ratio:1; border-radius:20px; background:rgba(196,182,221,.35); padding:8px; touch-action:none; }
    .pz button { position:absolute; left:8px; top:8px; width:calc((100% - 32px) / 3); height:calc((100% - 32px) / 3); border:0; border-radius:14px; font:400 44px Fraunces,Georgia,serif; color:#3D3848; box-shadow:0 4px 10px -5px rgba(61,56,72,.35), inset 0 0 0 1px rgba(255,255,255,.6); transition:transform .12s ease-out; touch-action:manipulation; }
    .pz button.ok { box-shadow:0 0 0 3px rgba(139,165,134,.6) inset, 0 4px 10px -5px rgba(61,56,72,.35); }
    .pz.won button { animation:pzwin .5s cubic-bezier(.34,1.56,.64,1); }
    @keyframes pzwin { 50% { scale:1.08; } }`;
  let board, cells, empty, t = 0, done = false;
  const style = document.createElement('style'); style.textContent = css; api.layer.appendChild(style);
  board = document.createElement('div'); board.className = 'pz'; api.layer.appendChild(board);

  // solvable shuffle: random legal moves from the solved state
  cells = [...Array(N * N).keys()].map((i) => (i === N * N - 1 ? 0 : i + 1));
  empty = N * N - 1;
  let prev = -1;
  for (let k = 0; k < 160 || isSolved(); k++) {
    const opts = neighbours(empty).filter((n) => n !== prev);
    const n = api.pick(opts);
    [cells[empty], cells[n]] = [cells[n], cells[empty]];
    prev = empty; empty = n;
  }
  function neighbours(i) {
    const r = Math.floor(i / N), c = i % N, out = [];
    if (r > 0) out.push(i - N); if (r < N - 1) out.push(i + N); if (c > 0) out.push(i - 1); if (c < N - 1) out.push(i + 1);
    return out;
  }
  function isSolved() { return cells.every((v, i) => (i === N * N - 1 ? v === 0 : v === i + 1)); }
  const tiles = {};
  for (let v = 1; v < N * N; v++) {
    const b = document.createElement('button'); b.type = 'button'; b.textContent = v; b.style.background = PAL[v - 1];
    b.addEventListener('pointerdown', (e) => { e.preventDefault(); tap(v); });
    tiles[v] = b; board.appendChild(b);
  }
  function place() {
    cells.forEach((v, i) => {
      if (!v) return;
      const r = Math.floor(i / N), c = i % N;
      tiles[v].style.transform = `translate(calc(${c} * (100% + 8px)), calc(${r} * (100% + 8px)))`;
      tiles[v].classList.toggle('ok', v === i + 1);
    });
  }
  // tapping any tile in the empty's row/column slides the whole line
  function tap(v) {
    if (done || !api.playing) return;
    const i = cells.indexOf(v);
    const r = Math.floor(i / N), c = i % N, er = Math.floor(empty / N), ec = empty % N;
    if (r !== er && c !== ec) { api.vibrate(15); return; }
    const step = r === er ? (c < ec ? -1 : 1) : (r < er ? -N : N);
    while (empty !== i) { const n = empty + step; cells[empty] = cells[n]; cells[n] = 0; empty = n; }
    place();
    api.vibrate(5);
    if (isSolved()) {
      done = true;
      const left = Math.ceil(TIME - t);
      api.setScore(left);
      board.classList.add('won');
      const rect = board.getBoundingClientRect();
      api.burst(rect.left + rect.width / 2, rect.top + rect.height / 2, api.COLORS.gold, 26);
      api.float(api.W / 2, rect.top - 10, `¡Resuelto! +${left}`, api.COLORS.gold, true);
      setTimeout(() => api.over(), 1100);
    }
  }
  place();
  return {
    start() { t = 0; },
    update(dt) {
      if (done) return;
      t += dt;
      api.time(1 - t / TIME);
      if (t >= TIME) { done = true; api.over(); }
    },
  };
});
