ADV_ARCADE.define('ahorcado', (api) => {
  const MAX = 6;
  const WORDS = [
    ['VILLANCICO', 'Navidad'], ['POLVORON', 'Dulce'], ['MAZAPAN', 'Dulce'], ['CHIMENEA', 'Casa'], ['GUIRNALDA', 'Adorno'],
    ['ESPUMILLON', 'Adorno'], ['NOCHEBUENA', 'Fecha'], ['CAPIBARA', 'Animal'], ['MANDARINA', 'Fruta'], ['DUENDE', 'Ser mágico'],
    ['TREBOL', 'Suerte'], ['SIRENA', 'Bajo el mar'], ['CARACOLA', 'Bajo el mar'], ['ONIGIRI', 'Japón'], ['TEMPURA', 'Japón'],
    ['WASABI', 'Japón'], ['EDAMAME', 'Japón'], ['GYOZAS', 'Japón'], ['MUÑECO', 'Nieve'], ['BUFANDA', 'Ropa'],
    ['CALCETINES', 'Regalo'], ['ESTRELLA', 'Cielo'], ['TRINEO', 'Transporte'], ['RENO', 'Animal'], ['ROSCON', 'Dulce'],
    ['UVAS', 'Nochevieja'], ['CAMPANADAS', 'Nochevieja'], ['MUERDAGO', 'Planta'], ['ACEBO', 'Planta'], ['LAZO', 'Adorno'],
    ['GATITO', 'Animal'], ['PELICULA', 'Plan'], ['CHOCOLATE', 'Bebida'], ['MANTA', 'Plan de sofá'], ['PIJAMA', 'Ropa'],
  ];
  const KEYS = 'QWERTYUIOPASDFGHJKLÑZXCVBNM';
  const css = `
    .hg { position:absolute; left:0; right:0; top:${api.top}px; bottom:0; display:flex; flex-direction:column; align-items:center; gap:10px; padding:0 10px calc(14px + env(safe-area-inset-bottom)); }
    .hg svg { width:min(38vw, 150px); height:auto; flex:none; }
    .hg svg .p { opacity:0; transform:scale(.6); transform-origin:center; transform-box:fill-box; transition:opacity .3s, transform .4s cubic-bezier(.34,1.56,.64,1); }
    .hg svg .p.on { opacity:1; transform:none; }
    .hg-hint { margin:0; font:600 12px "DM Sans",sans-serif; letter-spacing:.14em; text-transform:uppercase; color:#8BA586; }
    .hg-word { display:flex; flex-wrap:wrap; justify-content:center; gap:6px; min-height:44px; }
    .hg-word span { width:clamp(22px,7vw,32px); height:40px; border-bottom:3px solid #C4B6DD; display:grid; place-items:end center; padding-bottom:4px; font:400 28px Fraunces,Georgia,serif; color:#3D3848; }
    .hg-word span.show { animation:hgpop .35s cubic-bezier(.34,1.56,.64,1); }
    .hg-word.solved span { border-color:#8BA586; color:#8BA586; }
    .hg-lives { margin:0; font:600 13px "DM Sans",sans-serif; color:#6E6879; }
    .hg-keys { margin-top:auto; display:grid; grid-template-columns:repeat(10,1fr); gap:5px; width:min(100%, 460px); }
    .hg-keys button { height:46px; border:0; border-radius:10px; background:#fff; font:600 17px "DM Sans",sans-serif; color:#3D3848; box-shadow:0 2px 6px -3px rgba(61,56,72,.35); touch-action:manipulation; padding:0; }
    .hg-keys button:nth-child(n+11) { }
    .hg-keys button.ok { background:#D3E2D0; color:#5E7F4A; }
    .hg-keys button.no { background:#F2D4CC; color:#C9827A; opacity:.6; }
    .hg-keys .sp { grid-column:span 1; visibility:hidden; }
    @keyframes hgpop { from { transform:translateY(-10px); opacity:0; } }`;

  // the snowman gets one piece per mistake
  const SNOW = `<svg viewBox="0 0 120 140">
    <ellipse cx="60" cy="134" rx="46" ry="5" fill="rgba(61,56,72,.1)"/>
    <circle class="p" cx="60" cy="106" r="28" fill="#fff" stroke="#C9D4E3" stroke-width="2"/>
    <circle class="p" cx="60" cy="64" r="21" fill="#fff" stroke="#C9D4E3" stroke-width="2"/>
    <circle class="p" cx="60" cy="31" r="15" fill="#fff" stroke="#C9D4E3" stroke-width="2"/>
    <g class="p"><circle cx="55" cy="28" r="2" fill="#3D3848"/><circle cx="65" cy="28" r="2" fill="#3D3848"/><path d="M60 32l12 3-12 2z" fill="#F2A65A"/></g>
    <path class="p" d="M42 44h36v8H42zM66 50h8v18h-8z" fill="#E2B3A8"/>
    <path class="p" d="M44 18h32v-4c0-2-2-4-4-4h-4V2H52v8h-4c-2 0-4 2-4 4z" fill="#3D3848"/>
  </svg>`;

  const style = document.createElement('style'); style.textContent = css; api.layer.appendChild(style);
  const root = document.createElement('div'); root.className = 'hg';
  root.innerHTML = `${SNOW}<p class="hg-hint"></p><div class="hg-word"></div><p class="hg-lives"></p><div class="hg-keys"></div>`;
  api.layer.appendChild(root);
  const parts = [...root.querySelectorAll('.p')];
  const hintEl = root.querySelector('.hg-hint'), wordEl = root.querySelector('.hg-word'), livesEl = root.querySelector('.hg-lives'), keysEl = root.querySelector('.hg-keys');

  let misses = 0, word = '', guessed = new Set(), pool = api.shuffle([...WORDS]), busy = false, over = false;

  function newWord() {
    const [w, h] = pool.pop() || api.pick(WORDS);
    word = w; guessed = new Set();
    hintEl.textContent = h;
    wordEl.classList.remove('solved');
    wordEl.innerHTML = [...word].map(() => '<span></span>').join('');
    keysEl.innerHTML = [...KEYS].map((k) => `<button type="button" data-k="${k}">${k}</button>`).join('');
    busy = false;
  }
  function lives() { livesEl.textContent = `Fallos ${misses} de ${MAX}`; parts.forEach((p, i) => p.classList.toggle('on', i < misses)); }

  function press(k) {
    if (busy || over || !api.playing || guessed.has(k)) return;
    guessed.add(k);
    const btn = keysEl.querySelector(`[data-k="${k}"]`);
    if (word.includes(k)) {
      btn && btn.classList.add('ok');
      [...word].forEach((c, i) => { if (c === k) { const s = wordEl.children[i]; s.textContent = c; s.classList.add('show'); } });
      api.vibrate(5);
      if ([...word].every((c) => guessed.has(c))) {
        busy = true;
        wordEl.classList.add('solved');
        const r = wordEl.getBoundingClientRect();
        api.add(1, r.left + r.width / 2, r.top - 8);
        api.burst(r.left + r.width / 2, r.top + r.height / 2, api.COLORS.sage, 16);
        api.vibrate([10, 20, 10]);
        setTimeout(newWord, 900);
      }
    } else {
      btn && btn.classList.add('no');
      misses++;
      lives();
      api.shake(.2); api.vibrate([25, 20, 25]);
      if (misses >= MAX) {
        over = true;
        // show the word she missed
        [...word].forEach((c, i) => { const s = wordEl.children[i]; if (!s.textContent) { s.textContent = c; s.style.color = '#D99A90'; } });
        setTimeout(() => api.over(), 1300);
      }
    }
  }
  keysEl.addEventListener('pointerdown', (e) => { const b = e.target.closest('button'); if (b) { e.preventDefault(); press(b.dataset.k); } });

  newWord(); lives();
  return {
    start() { api.noTime(); },
    key(k, d) {
      const u = k.length === 1 ? k.toUpperCase() : '';
      if (!u || !KEYS.includes(u)) return false;
      if (d) press(u);
    },
  };
});
