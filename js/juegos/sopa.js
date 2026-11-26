ADV_ARCADE.define('sopa', (api) => {
  const N = 10, TIME = 120, COUNT = 7;
  const BANK = ['NAVIDAD', 'ESTRELLA', 'REGALO', 'TURRON', 'SUSHI', 'CAPIBARA', 'DUENDE', 'SIRENA', 'ABETO', 'NIEVE', 'MANDARINA', 'LAZO', 'CAMPANA', 'RAMEN', 'TREBOL', 'RENO', 'BELEN', 'VELA', 'ONIGIRI', 'MOCHI', 'TRINEO', 'GALLETA'];
  const HL = ['#F2D4CC', '#D3E2D0', '#D6E2EF', '#F3E6C4', '#E2DAEE', '#F6DCE3', '#E4ECE6'];
  const css = `
    .sopa-words { position:absolute; left:16px; right:16px; top:${api.top}px; display:flex; flex-wrap:wrap; justify-content:center; gap:6px 12px; font:600 13px "DM Sans",sans-serif; letter-spacing:.06em; color:#6E6879; }
    .sopa-words span.ok { text-decoration:line-through; color:#8BA586; }
    .sopa { position:absolute; left:50%; top:calc(${api.top}px + 60px); transform:translateX(-50%); width:min(94vw, 420px); aspect-ratio:1; display:grid; grid-template-columns:repeat(${N},1fr); gap:2px; padding:6px; border-radius:16px; background:rgba(255,255,255,.55); touch-action:none; user-select:none; -webkit-user-select:none; }
    .sopa i { display:grid; place-items:center; font:500 clamp(15px,4.6vw,21px) "DM Sans",sans-serif; font-style:normal; color:#3D3848; border-radius:8px; transition:background .15s, transform .15s; }
    .sopa i.sel { background:#C4B6DD; color:#fff; transform:scale(1.08); }
    .sopa i.found { color:#3D3848; }`;

  const DIRS = [[1, 0], [0, 1], [1, 1], [-1, 0], [0, -1], [1, -1], [-1, -1], [-1, 1]];
  const grid = Array.from({ length: N }, () => Array(N).fill(''));
  const words = [];
  for (const w of api.shuffle([...BANK])) {
    if (words.length >= COUNT) break;
    if (w.length > N) continue;
    for (let tries = 0; tries < 150; tries++) {
      // straight words are more common; reversed and diagonal ones make it hard
      const [dx, dy] = Math.random() < .5 ? api.pick(DIRS.slice(0, 3)) : api.pick(DIRS);
      const x0 = api.randInt(0, N - 1), y0 = api.randInt(0, N - 1);
      const x1 = x0 + dx * (w.length - 1), y1 = y0 + dy * (w.length - 1);
      if (x1 < 0 || y1 < 0 || x1 >= N || y1 >= N) continue;
      let ok = true;
      for (let i = 0; i < w.length; i++) { const c = grid[y0 + dy * i][x0 + dx * i]; if (c && c !== w[i]) { ok = false; break; } }
      if (!ok) continue;
      for (let i = 0; i < w.length; i++) grid[y0 + dy * i][x0 + dx * i] = w[i];
      words.push({ w, found: false });
      break;
    }
  }
  const FILL = 'AAAEEEIIOOUURRSSNNLLTTDDCCMMBGPVZ';
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (!grid[y][x]) grid[y][x] = api.pick([...FILL]);

  const style = document.createElement('style'); style.textContent = css; api.layer.appendChild(style);
  const list = document.createElement('div'); list.className = 'sopa-words';
  list.innerHTML = words.map((o) => `<span>${o.w}</span>`).join('');
  api.layer.appendChild(list);
  const box = document.createElement('div'); box.className = 'sopa';
  box.innerHTML = grid.flat().map((c, i) => `<i data-i="${i}">${c}</i>`).join('');
  api.layer.appendChild(box);
  const cells = [...box.children];

  let t = 0, start = null, sel = [], done = false, found = 0;
  const cellAt = (x, y) => { const el = document.elementFromPoint(x, y); return el && el.parentNode === box ? +el.dataset.i : null; };
  function lineTo(end) {
    const sx = start % N, sy = Math.floor(start / N), ex = end % N, ey = Math.floor(end / N);
    const dx = Math.sign(ex - sx), dy = Math.sign(ey - sy);
    const len = Math.max(Math.abs(ex - sx), Math.abs(ey - sy));
    if (!(sx === ex || sy === ey || Math.abs(ex - sx) === Math.abs(ey - sy))) return null;
    return Array.from({ length: len + 1 }, (_, i) => (sy + dy * i) * N + sx + dx * i);
  }
  function show(arr) { cells.forEach((c) => c.classList.remove('sel')); arr.forEach((i) => cells[i].classList.add('sel')); }

  box.addEventListener('pointerdown', (e) => {
    if (!api.playing || done) return;
    const i = cellAt(e.clientX, e.clientY);
    if (i == null) return;
    start = i; sel = [i]; show(sel);
    try { box.setPointerCapture(e.pointerId); } catch (_) {}
  });
  box.addEventListener('pointermove', (e) => {
    if (start == null) return;
    const i = cellAt(e.clientX, e.clientY);
    if (i == null) return;
    const l = lineTo(i);
    if (l) { sel = l; show(sel); }
  });
  const finish = () => {
    if (start == null) return;
    const s = sel.map((i) => grid[Math.floor(i / N)][i % N]).join('');
    const rev = [...s].reverse().join('');
    const hit = words.find((o) => !o.found && (o.w === s || o.w === rev));
    show([]);
    if (hit) {
      hit.found = true; found++;
      const col = HL[found % HL.length];
      sel.forEach((i) => { cells[i].style.background = col; cells[i].classList.add('found'); });
      list.children[words.indexOf(hit)].classList.add('ok');
      const r = cells[sel[Math.floor(sel.length / 2)]].getBoundingClientRect();
      api.add(90, r.left + r.width / 2, r.top - 6);
      api.burst(r.left + r.width / 2, r.top + r.height / 2, api.COLORS.gold, 12);
      api.vibrate([10, 20, 10]);
      if (found === words.length) {
        done = true;
        const bonus = Math.ceil(TIME - t) * 2;
        api.add(bonus);
        api.float(api.W / 2, api.H * .5, `+${bonus} por tiempo`, api.COLORS.gold, true);
        setTimeout(() => api.over(), 1000);
      }
    } else if (sel.length > 1) api.vibrate(15);
    start = null; sel = [];
  };
  box.addEventListener('pointerup', finish);
  box.addEventListener('pointercancel', finish);
  box.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });

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
