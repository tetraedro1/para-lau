ADV_ARCADE.define('parejas', (api) => {
  const TIME = 60;
  const ICONS = {
    estrella: ['#EBCB86', '<path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6l-5.4 2.9 1.2-6-4.5-4.2 6.1-.7z"/>'],
    arbol: ['#AFC8AA', '<path d="M12 3l5 6h-3l4 5h-3l4 5H5l4-5H6l4-5H7z"/>'],
    corazon: ['#E3A0A0', '<path d="M12 20s-7.5-4.6-7.5-10.1A4.3 4.3 0 0 1 12 7.1a4.3 4.3 0 0 1 7.5 2.8C19.5 15.4 12 20 12 20z"/>'],
    regalo: ['#B0C6DF', '<path d="M4.5 11h15v9h-15zM3 7.5h18V11H3z"/>'],
    luna: ['#C4B6DD', '<path d="M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5z"/>'],
    campana: ['#E2CD99', '<path d="M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20a2 2 0 0 0 4 0z"/>'],
    copo: ['#9DB7D5', '<path d="M11 3h2v18h-2zM3.8 7.7l1-1.7 15.4 9-1 1.7zM3.8 16.3l15.4-9 1 1.7-15.4 9z"/>'],
    onigiri: ['#3D3848', '<path d="M12 3.5c-2.2 0-8.5 9.3-8.5 13C3.5 19 5.7 20.5 12 20.5s8.5-1.5 8.5-4c0-3.7-6.3-13-8.5-13z" fill="#fff" stroke="#D8D2CC" stroke-width=".8"/><path d="M8.5 14.5h7v6h-7z"/>'],
    sushi: ['#4E6B4A', '<path d="M5 8v8c0 1.7 3.1 3 7 3s7-1.3 7-3V8z"/><ellipse cx="12" cy="8" rx="7" ry="3" fill="#fff"/><ellipse cx="12" cy="8" rx="3" ry="1.3" fill="#F0A07A"/>'],
    dango: ['#C8A26A', '<path d="M6.5 21.5l11-19" stroke="#C8A26A" stroke-width="1.4"/><circle cx="9.4" cy="16.5" r="3" fill="#AFC8AA"/><circle cx="12" cy="12" r="3" fill="#fff"/><circle cx="14.6" cy="7.5" r="3" fill="#F2B8C6"/>'],
  };
  const css = `
    .mem { position:absolute; left:50%; top:calc(${api.top}px + 10px); transform:translateX(-50%); display:grid; grid-template-columns:repeat(4,1fr); gap:10px; width:min(92vw, 420px); }
    .mem button { position:relative; aspect-ratio:1/1.12; border:0; padding:0; background:none; touch-action:manipulation; }
    .mem .f, .mem .b { position:absolute; inset:0; border-radius:14px; display:grid; place-items:center; transition:opacity 0s .12s; }
    .mem .b { background:linear-gradient(145deg,#F2D4CC,#E2DAEE); box-shadow:0 4px 12px -6px rgba(61,56,72,.35), inset 0 0 0 1px rgba(255,255,255,.5); }
    .mem .b::after { content:""; width:30%; aspect-ratio:1; border-radius:50%; border:2px solid rgba(255,255,255,.7); }
    .mem .f { background:#fff; opacity:0; box-shadow:0 4px 12px -6px rgba(61,56,72,.3); }
    .mem .f svg { width:58%; }
    /* flip = squash to zero width, swap faces at the midpoint (no 3D, works the same in Safari) */
    .mem button.up, .mem button.flipback { animation:memflip .26s ease-in-out; }
    .mem button.up .f { opacity:1; }
    .mem button.up .b { opacity:0; }
    .mem button.done .f { box-shadow:0 0 0 3px #AFC8AA inset; }
    .mem button.done { animation:memok .5s cubic-bezier(.34,1.56,.64,1); }
    .mem button.bad .f { box-shadow:0 0 0 3px #E3A0A0 inset; }
    @keyframes memflip { 50% { transform:scaleX(0); } }
    @keyframes memok { 50% { transform:scale(1.12); } }`;

  let grid, cards = [], first = null, lock = false, pairs = 0, t = 0, misses = 0;

  function build() {
    const style = document.createElement('style'); style.textContent = css; api.layer.appendChild(style);
    grid = document.createElement('div'); grid.className = 'mem';
    const keys = api.shuffle([...Object.keys(ICONS), ...Object.keys(ICONS)]);
    grid.innerHTML = keys.map((k) => `<button type="button" data-k="${k}"><span class="b"></span><span class="f"><svg viewBox="0 0 24 24" fill="${ICONS[k][0]}">${ICONS[k][1]}</svg></span></button>`).join('');
    api.layer.appendChild(grid);
    cards = [...grid.children];
    grid.addEventListener('click', onTap);
  }

  function onTap(e) {
    const b = e.target.closest('button');
    if (!b || !api.playing || lock || b.classList.contains('up')) return;
    b.classList.add('up');
    api.vibrate(5);
    if (!first) { first = b; return; }
    const a = first; first = null;
    if (a.dataset.k === b.dataset.k) {
      a.classList.add('done'); b.classList.add('done');
      pairs++;
      const r = b.getBoundingClientRect();
      api.add(5, r.left + r.width / 2, r.top);
      api.burst(r.left + r.width / 2, r.top + r.height / 2, ICONS[b.dataset.k][0], 12);
      if (pairs === cards.length / 2) {
        const bonus = Math.ceil(TIME - t) * 3;
        api.add(bonus);
        api.float(api.W / 2, api.H * .45, `+${bonus} por tiempo`, api.COLORS.gold, true);
        setTimeout(() => api.over(), 900);
      }
    } else {
      misses++;
      lock = true;
      a.classList.add('bad'); b.classList.add('bad');
      setTimeout(() => { [a, b].forEach((el) => { el.classList.remove('up', 'bad'); el.classList.add('flipback'); setTimeout(() => el.classList.remove('flipback'), 300); }); lock = false; }, 650);
    }
  }

  build();
  return {
    start() { t = 0; },
    update(dt) {
      if (pairs === cards.length / 2) return;
      t += dt;
      api.time(1 - t / TIME);
      if (t >= TIME) api.over();
    },
  };
});
