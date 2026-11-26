(() => {
  'use strict';

  /*
    Arcade engine. Each game lives in js/juegos/<id>.js and calls ADV_ARCADE.define(id, factory).
    factory(api) returns an object with any of:
      start()            called when the countdown ends
      update(dt)         every frame while playing (seconds)
      draw(ctx)          every frame (canvas is cleared before)
      down(x, y), move(x, y), up(x, y)   pointer input in CSS pixels
      key(k, isDown)     keyboard
      stop()             cleanup when the game closes
  */

  const C = window.ADVIENTO;
  const CFG = C.juegos || {};
  const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const DPR = Math.min(window.devicePixelRatio || 1, 2);

  const LISTA = [
    { id: 'atrapa', titulo: 'Atrapa la Navidad', desc: 'Mueve el trineo y atrapa regalos, estrellas y corazones. El carbón resta y rompe el combo.', meta: 110 },
    { id: 'reno', titulo: 'Reno volador', desc: 'Toca para aletear y pasa entre las chimeneas sin chocar.', meta: 20 },
    { id: 'parejas', titulo: 'Parejas', desc: 'Encuentra las 10 parejas en 60 segundos. Cada segundo que sobre vale 3 puntos.', meta: 125 },
    { id: 'campanas', titulo: 'Campanas', desc: 'Memoriza la melodía de luces y repítela. Cada ronda es una nota más larga y más rápida.', meta: 12 },
    { id: 'torre', titulo: 'Torre de regalos', desc: 'Toca para soltar cada regalo justo encima del anterior. Lo que sobresale se cae.', meta: 22 },
    { id: 'reflejos', titulo: 'Reflejos', desc: 'Toca en cuanto la luz se ponga verde. Si tocas antes, pierdes la ronda.', meta: 700 },
    { id: 'duendes', titulo: 'Caza duendes', desc: 'Toca a los duendes antes de que se escondan. Al Grinch ni lo toques.', meta: 48 },
    { id: 'esquiva', titulo: 'Esquiva', desc: 'Arrastra la estrella y esquiva las bolas de nieve todo el tiempo que puedas.', meta: 40 },
    { id: 'fusion', titulo: '2048 navideño', desc: 'Desliza para juntar adornos iguales. Llega lo más alto posible.', meta: 4000 },
    { id: 'serpiente', titulo: 'Serpiente de luces', desc: 'Desliza para girar. Come estrellas y no choques contigo ni con los bordes.', meta: 28 },
    { id: 'ritmo', titulo: 'Ritmo', desc: 'Toca cada carril justo cuando la nota llega a la línea.', meta: 160 },
    { id: 'laberinto', titulo: 'Laberinto', desc: 'Inclina el móvil (o desliza) para llevar la bola a la salida. ¿Cuántos haces en 60 segundos?', meta: 5 },
    { id: 'puzle', titulo: 'Puzle deslizante', desc: 'Ordena las piezas del 1 al 15 moviéndolas al hueco. Te quedan puntos según el tiempo que sobre.', meta: 60 },
    { id: 'adornos', titulo: 'Rompe adornos', desc: 'Mueve la barra y rompe todos los adornos con la bola sin dejarla caer.', meta: 45 },
    { id: 'encesta', titulo: 'Encesta', desc: 'Lanza los regalos a la chimenea deslizando hacia arriba. Ojo con el viento.', meta: 12 },
    { id: 'sopa', titulo: 'Sopa de letras', desc: 'Encuentra las palabras navideñas arrastrando sobre las letras.', meta: 700 },
    { id: 'trineo', titulo: 'Trineo sin frenos', desc: 'Toca para saltar los obstáculos. Cada vez va más rápido.', meta: 900 },
    { id: 'pulso', titulo: 'Pulso firme', desc: 'Mantén el copo dentro del camino sin tocar los bordes.', meta: 120 },
    { id: 'ahorcado', titulo: 'Adivina la palabra', desc: 'Adivina palabras navideñas letra a letra. Seis fallos y se acabó.', meta: 6 },
    { id: 'pinguino', titulo: 'Pingüino saltarín', desc: 'Inclina el móvil o toca a los lados para llevar al pingüino cada vez más alto.', meta: 250 },
  ];
  const BY_ID = Object.fromEntries(LISTA.map((g) => [g.id, g]));
  const factories = {};

  const $ = (s) => document.querySelector(s);
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const vibrate = (p) => { try { navigator.vibrate && navigator.vibrate(p); } catch (_) {} };
  const fx = () => window.ADV_FX;

  /* ---------- Persistence ---------- */

  const KEY = 'adv-arcade';
  function loadState() {
    try { return Object.assign({ records: {}, superados: [], ultimo: null, final: false }, JSON.parse(localStorage.getItem(KEY)) || {}); }
    catch (_) { return { records: {}, superados: [], ultimo: null, final: false }; }
  }
  let state = loadState();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (_) {} };
  const metaOf = (id) => (CFG.metas && CFG.metas[id] != null ? CFG.metas[id] : BY_ID[id].meta);

  /* ---------- Shared drawing helpers & sprites ---------- */

  const COLORS = {
    ink: '#3D3848', rose: '#E2B3A8', roseD: '#D99A90', sage: '#AFC8AA', sageD: '#8BA586', sky: '#B0C6DF',
    butter: '#EBCB86', lilac: '#C4B6DD', pink: '#E3A0A0', gold: '#C8A26A', coal: '#5E5869', paper: '#FCF8F3',
  };
  function rr(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function sprite(size, draw) {
    const c = document.createElement('canvas');
    c.width = c.height = Math.ceil(size * DPR);
    const x = c.getContext('2d');
    x.scale(DPR, DPR);
    draw(x, size);
    return c;
  }
  const S = 64;
  const drawGift = (body, ribbon) => sprite(S, (x, s) => {
    rr(x, s * .14, s * .36, s * .72, s * .52, 6); x.fillStyle = body; x.fill();
    rr(x, s * .08, s * .26, s * .84, s * .16, 5); x.fill();
    x.fillStyle = 'rgba(255,255,255,.35)'; x.fillRect(s * .1, s * .27, s * .8, s * .04);
    x.fillStyle = ribbon; x.fillRect(s * .44, s * .26, s * .12, s * .62);
    x.strokeStyle = ribbon; x.lineWidth = s * .07;
    x.beginPath(); x.ellipse(s * .38, s * .19, s * .1, s * .07, -.4, 0, 6.283); x.stroke();
    x.beginPath(); x.ellipse(s * .62, s * .19, s * .1, s * .07, .4, 0, 6.283); x.stroke();
  });
  const starPath = (x, cx, cy, R, r, n = 5) => {
    x.beginPath();
    for (let i = 0; i < n * 2; i++) {
      const rad = i % 2 ? r : R, a = -Math.PI / 2 + i * Math.PI / n;
      x.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad);
    }
    x.closePath();
  };
  const heartPath = (x, s, ox = 0, oy = 0) => {
    x.beginPath();
    x.moveTo(ox + s / 2, oy + s * .84);
    x.bezierCurveTo(ox + s * .1, oy + s * .56, ox + s * .04, oy + s * .2, ox + s * .3, oy + s * .17);
    x.bezierCurveTo(ox + s * .42, oy + s * .16, ox + s * .5, oy + s * .26, ox + s / 2, oy + s * .32);
    x.bezierCurveTo(ox + s * .5, oy + s * .26, ox + s * .58, oy + s * .16, ox + s * .7, oy + s * .17);
    x.bezierCurveTo(ox + s * .96, oy + s * .2, ox + s * .9, oy + s * .56, ox + s / 2, oy + s * .84);
  };
  const SPRITES = {
    gifts: [drawGift(COLORS.sky, COLORS.rose), drawGift(COLORS.rose, '#F3E6C4'), drawGift(COLORS.sage, '#F2D4CC'), drawGift(COLORS.lilac, '#F3E6C4')],
    star: sprite(S, (x, s) => { starPath(x, s / 2, s / 2, s * .44, s * .2); x.fillStyle = COLORS.butter; x.fill(); x.strokeStyle = '#D9B26C'; x.lineWidth = 2.5; x.lineJoin = 'round'; x.stroke(); }),
    heart: sprite(S, (x, s) => { heartPath(x, s); x.fillStyle = COLORS.pink; x.fill(); x.fillStyle = 'rgba(255,255,255,.45)'; x.beginPath(); x.ellipse(s * .34, s * .34, s * .07, s * .04, -.6, 0, 6.283); x.fill(); }),
    coal: sprite(S, (x, s) => {
      x.beginPath();
      [[.5, .18], [.74, .26], [.84, .5], [.76, .76], [.5, .84], [.24, .78], [.15, .52], [.26, .26]].forEach(([a, b], i) => (i ? x.lineTo : x.moveTo).call(x, a * s, b * s));
      x.closePath(); x.fillStyle = COLORS.coal; x.fill();
      x.fillStyle = 'rgba(255,255,255,.18)'; x.beginPath(); x.arc(s * .38, s * .38, s * .07, 0, 6.283); x.fill();
    }),
    snowball: sprite(S, (x, s) => {
      const g = x.createRadialGradient(s * .4, s * .38, s * .05, s / 2, s / 2, s * .45);
      g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#D6E0EE');
      x.fillStyle = g; x.beginPath(); x.arc(s / 2, s / 2, s * .44, 0, 6.283); x.fill();
    }),
  };

  /* ---------- DOM ---------- */

  const overlay = $('#game');
  const cv = $('#game-cv');
  const ctx = cv.getContext('2d');
  const layer = $('#g-layer');
  const scoreEl = $('#g-score');
  const multEl = $('#g-mult');
  const timeWrap = $('.g-time');
  const bar = $('#g-bar');
  const panel = $('#g-panel');
  const nameEl = $('#g-name');

  let W = 0, H = 0, safeB = 0, safeT = 0;
  let open = false, playing = false, paused = false, raf = 0, last = 0;
  let current = null, game = null, score = 0, runId = 0;
  let parts = [], floaters = [];

  function resize() {
    W = innerWidth; H = innerHeight;
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    const cs = getComputedStyle(overlay);
    safeB = parseFloat(cs.paddingBottom) || 0;
    safeT = parseFloat(cs.paddingTop) || 0;
    if (game && game.resize) game.resize();
  }

  /* ---------- API given to games ---------- */

  const api = {
    get W() { return W; },
    get H() { return H; },
    get top() { return safeT + 70; },          // below the HUD
    get bottom() { return H - safeB; },
    get score() { return score; },
    ctx, layer, COLORS, SPRITES, rr, starPath, heartPath, sprite, DPR, REDUCED,
    rand: (a, b) => a + Math.random() * (b - a),
    randInt: (a, b) => Math.floor(a + Math.random() * (b - a + 1)),
    pick: (arr) => arr[(Math.random() * arr.length) | 0],
    shuffle(arr) { for (let i = arr.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; },
    setScore(n) { if (n !== score) { score = Math.max(0, Math.round(n)); scoreEl.textContent = score; bump(scoreEl); } },
    add(n, x, y, color) {
      api.setScore(score + n);
      if (x != null) api.float(x, y, (n > 0 ? '+' : '') + n, color || (n > 0 ? COLORS.ink : '#8A8494'));
    },
    float(x, y, text, color = COLORS.ink, big = false) { floaters.push({ x, y, text, color, life: big ? 1.3 : .9, big }); },
    burst(x, y, color, n = 12, speed = 180) {
      if (REDUCED) return;
      for (let i = 0; i < n; i++) {
        const a = Math.random() * 6.283, v = speed * (.35 + Math.random() * .8);
        parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - speed * .4, life: .5 + Math.random() * .35, max: .85, r: 2 + Math.random() * 3, color });
      }
    },
    mult(text) { multEl.textContent = text || ''; multEl.classList.toggle('on', !!text); },
    time(frac) { timeWrap.classList.remove('off'); bar.style.transform = `scaleX(${Math.max(0, Math.min(1, frac))})`; },
    noTime() { timeWrap.classList.add('off'); },
    shake(amount = .35) { shakeT = Math.max(shakeT, amount); },
    vibrate,
    over() { if (playing) end(); },
    get playing() { return playing; },
  };
  let shakeT = 0;
  function bump(el) { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }

  /* ---------- Loading games on demand ---------- */

  const loading = {};
  function loadGame(id) {
    if (factories[id]) return Promise.resolve();
    if (!loading[id]) {
      loading[id] = new Promise((res, rej) => {
        const s = document.createElement('script');
        s.src = `js/juegos/${id}.js`;
        s.onload = () => (factories[id] ? res() : rej(new Error('no define')));
        s.onerror = rej;
        document.head.appendChild(s);
      });
    }
    return loading[id];
  }

  /* ---------- Flow ---------- */

  async function openGame(id) {
    current = id;
    open = true;
    overlay.hidden = false;
    document.body.style.overflow = 'hidden';
    document.dispatchEvent(new CustomEvent('adv:game', { detail: true }));
    resize();
    requestAnimationFrame(() => overlay.classList.add('show'));
    nameEl.textContent = BY_ID[id].titulo;
    panel.innerHTML = '<div class="g-count g-loading">…</div>';
    panel.hidden = false;
    try { await loadGame(id); } catch (_) {
      panel.innerHTML = '<div class="g-end"><p class="g-end-sub">No se ha podido cargar el juego. Revisa la conexión.</p><div class="g-end-btns"><button class="btn" data-g="exit" type="button">Volver</button></div></div>';
      return;
    }
    if (!open) return;
    play();
  }

  async function play() {
    const id = current;
    const run = ++runId;
    if (game && game.stop) game.stop();
    layer.innerHTML = '';
    layer.className = 'g-layer';
    parts = []; floaters = []; shakeT = 0;
    score = 0; scoreEl.textContent = '0'; api.mult('');
    api.time(1);
    playing = false;
    game = factories[id](api) || {};
    if (!raf) { last = performance.now(); raf = requestAnimationFrame(loop); }
    // intro card with the rules, then countdown
    const meta = metaOf(id);
    const rec = state.records[id] || 0;
    panel.innerHTML = `<div class="g-end g-intro">
      <p class="g-end-label">${state.superados.includes(id) ? 'Superado' : 'Reto'}</p>
      <h3 class="g-intro-title">${esc(BY_ID[id].titulo)}</h3>
      <p class="g-intro-desc">${esc(BY_ID[id].desc)}</p>
      <p class="g-end-sub">Objetivo: <b>${meta}</b> · Tu récord: <b>${rec}</b></p>
      <div class="g-end-btns"><button class="btn" type="button" data-g="go">Empezar</button></div>
    </div>`;
    panel.hidden = false;
    await new Promise((res) => { goResolve = res; });
    if (run !== runId || !open) return;
    if (game.permiso) { try { await game.permiso(); } catch (_) {} }
    for (const n of ['3', '2', '1']) {
      panel.innerHTML = `<div class="g-count">${n}</div>`;
      vibrate(8);
      await wait(600);
      if (run !== runId || !open) return;
    }
    panel.hidden = true;
    playing = true;
    if (game.start) game.start();
  }
  let goResolve = null;

  function end() {
    playing = false;
    const id = current;
    const meta = metaOf(id);
    const prev = state.records[id] || 0;
    const record = score > prev;
    if (record) state.records[id] = score;
    const beatenNow = score >= meta && !state.superados.includes(id);
    if (beatenNow) state.superados.push(id);
    const allNow = state.superados.length >= LISTA.length && !state.final;
    if (allNow) state.final = true;
    save();
    renderMedals();

    const premio = CFG.premios && CFG.premios[id];
    const won = score >= meta;
    panel.innerHTML = `<div class="g-end">
      <p class="g-end-label">${won ? (beatenNow ? '¡Reto superado!' : 'Superado otra vez') : record && prev > 0 ? 'Nuevo récord' : 'Casi…'}</p>
      <p class="g-end-score">${score}</p>
      <p class="g-end-sub">objetivo ${meta} · récord ${Math.max(prev, score)}</p>
      ${won && premio ? premioHTML(premio) : ''}
      ${!won ? `<p class="g-end-hint">Te faltan ${meta - score} para superarlo</p>` : ''}
      ${allNow && CFG.premioFinal ? `<div class="g-final"><p class="g-end-label">Has superado los ${LISTA.length} juegos</p><p class="g-prize">${esc(CFG.premioFinal)}</p></div>` : ''}
      <div class="g-end-btns"><button class="btn" type="button" data-g="again">Otra vez</button><button class="btn ghost" type="button" data-g="exit">Volver</button></div>
    </div>`;
    panel.hidden = false;
    vibrate(won ? [30, 50, 30, 50, 60] : [30, 40, 30]);
    if (won || record) fx() && fx().confetti(W / 2, H * .35, allNow ? 260 : won ? 150 : 70);
  }

  // a prize is either plain text or a recommendation {tipo, titulo, autor, nota}
  const REC = {
    musica: ['Te recomiendo escuchar', '<path d="M9 18V6l10-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/>', 'Escuchar en Spotify', (q) => `https://open.spotify.com/search/${encodeURIComponent(q)}`],
    serie: ['Te recomiendo ver la serie', '<rect x="3" y="5" width="18" height="12" rx="2"/><path d="M8 21h8M12 17v4"/>', 'Dónde verla', (q) => `https://www.justwatch.com/es/buscar?q=${encodeURIComponent(q)}`],
    peli: ['Te recomiendo ver la peli', '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M8 4l-2 5M13 4l-2 5M18 4l-2 5"/>', 'Dónde verla', (q) => `https://www.justwatch.com/es/buscar?q=${encodeURIComponent(q)}`],
  };
  function premioHTML(p) {
    if (typeof p === 'string') return `<p class="g-prize">${esc(p)}</p>`;
    const r = REC[p.tipo] || REC.musica;
    const q = [p.titulo, p.tipo === 'musica' ? p.autor : ''].filter(Boolean).join(' ');
    return `<div class="g-rec">
      <div class="g-rec-ic"><svg viewBox="0 0 24 24">${r[1]}</svg></div>
      <div class="g-rec-txt">
        <p class="g-rec-label">${r[0]}</p>
        <p class="g-rec-title">${esc(p.titulo)}</p>
        ${p.autor ? `<p class="g-rec-author">${esc(p.autor)}</p>` : ''}
        ${p.nota ? `<p class="g-rec-note">${esc(p.nota)}</p>` : ''}
        <a class="g-rec-link" href="${r[3](q)}" target="_blank" rel="noopener">${r[2]}</a>
      </div>
    </div>`;
  }

  function closeGame() {
    open = false;
    playing = false;
    runId++;
    if (game && game.stop) game.stop();
    game = null;
    overlay.classList.remove('show');
    document.body.style.overflow = '';
    document.dispatchEvent(new CustomEvent('adv:game', { detail: false }));
    setTimeout(() => {
      overlay.hidden = true;
      panel.hidden = true;
      layer.innerHTML = '';
      cancelAnimationFrame(raf);
      raf = 0;
    }, 400);
    renderCard(false);
  }

  /* ---------- Loop ---------- */

  function loop(now) {
    const dt = Math.min(.033, (now - last) / 1000);
    last = now;
    if (!paused) {
      if (playing && game && game.update) game.update(dt);
      for (const p of parts) { p.vy += 420 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; }
      parts = parts.filter((p) => p.life > 0);
      for (const f of floaters) { f.y -= 50 * dt; f.life -= dt; }
      floaters = floaters.filter((f) => f.life > 0);
      shakeT = Math.max(0, shakeT - dt);
    }
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    if (shakeT > 0 && !REDUCED) ctx.translate((Math.random() - .5) * 16 * shakeT, (Math.random() - .5) * 16 * shakeT);
    if (game && game.draw) game.draw(ctx);
    for (const p of parts) {
      ctx.globalAlpha = Math.max(0, p.life / p.max);
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    for (const f of floaters) {
      ctx.globalAlpha = Math.min(1, f.life * 2);
      ctx.fillStyle = f.color;
      ctx.font = f.big ? 'italic 500 34px Fraunces, Georgia, serif' : '600 20px "DM Sans", system-ui, sans-serif';
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.restore();
    ctx.globalAlpha = 1;
    raf = open ? requestAnimationFrame(loop) : 0;
  }

  /* ---------- Input ---------- */

  const stopTouch = (e) => { if (e.cancelable) e.preventDefault(); };
  cv.addEventListener('touchstart', stopTouch, { passive: false });
  cv.addEventListener('touchmove', stopTouch, { passive: false });
  let pointerDown = false;
  cv.addEventListener('pointerdown', (e) => { pointerDown = true; if (playing && game && game.down) game.down(e.clientX, e.clientY, e); });
  cv.addEventListener('pointermove', (e) => { if (playing && game && game.move) game.move(e.clientX, e.clientY, pointerDown, e); });
  addEventListener('pointerup', (e) => { if (!pointerDown) return; pointerDown = false; if (playing && game && game.up) game.up(e.clientX, e.clientY, e); });
  addEventListener('pointercancel', (e) => { pointerDown = false; if (playing && game && game.up) game.up(e.clientX, e.clientY, e); });
  addEventListener('keydown', (e) => {
    if (!open) return;
    if (e.key === 'Escape') { closeGame(); return; }
    if (playing && game && game.key) { if (game.key(e.key, true) !== false) e.preventDefault(); }
  });
  addEventListener('keyup', (e) => { if (open && playing && game && game.key) game.key(e.key, false); });
  addEventListener('resize', () => { if (open) resize(); });
  document.addEventListener('visibilitychange', () => { paused = document.hidden; last = performance.now(); });

  panel.addEventListener('click', (e) => {
    const a = e.target.closest('[data-g]');
    if (!a) return;
    const act = a.dataset.g;
    if (act === 'go') {
      // device-motion permission must be requested inside the tap itself (iOS)
      if (game && game.pedirPermiso) game.pedirPermiso();
      goResolve && goResolve();
    } else if (act === 'again') play();
    else closeGame();
  });
  $('#g-close').addEventListener('click', closeGame);

  /* ---------- Arcade card: random pick + medals ---------- */

  // games whose file exists; the rest still show as medals
  const LISTOS = new Set(['atrapa', 'reno', 'parejas', 'campanas', 'torre', 'reflejos']);
  function pickRandom() {
    const pool = LISTA.filter((g) => LISTOS.has(g.id) && g.id !== state.ultimo);
    const g = pool[(Math.random() * pool.length) | 0];
    state.ultimo = g.id;
    save();
    return g;
  }

  let chosen = null;
  async function renderCard(roll) {
    const nameBox = $('#arc-name');
    const desc = $('#arc-desc');
    const info = $('#arc-info');
    if (roll) {
      // slot-machine style roll through titles
      const steps = REDUCED ? 1 : 16;
      for (let i = 0; i < steps; i++) {
        nameBox.textContent = LISTA[(Math.random() * LISTA.length) | 0].titulo;
        nameBox.classList.remove('tick'); void nameBox.offsetWidth; nameBox.classList.add('tick');
        await wait(40 + i * i * 1.2);
      }
    }
    nameBox.textContent = chosen.titulo;
    nameBox.classList.remove('tick'); void nameBox.offsetWidth; nameBox.classList.add('tick', 'final');
    desc.textContent = chosen.desc;
    const rec = state.records[chosen.id] || 0;
    info.innerHTML = `Objetivo <b>${metaOf(chosen.id)}</b> · Récord <b>${rec}</b>${state.superados.includes(chosen.id) ? ' · <span class="ok">superado</span>' : ''}`;
    $('#play').disabled = false;
  }

  function renderMedals() {
    const box = $('#arc-medals');
    const done = state.superados.length;
    $('#arc-progress').textContent = `${done} de ${LISTA.length} superados`;
    box.innerHTML = LISTA.map((g, i) => {
      const ok = state.superados.includes(g.id);
      const tried = state.records[g.id] != null;
      return `<i class="${ok ? 'ok' : tried ? 'tried' : ''}" title="${ok || tried ? esc(g.titulo) : '?'}">${ok ? '★' : i + 1}</i>`;
    }).join('');
  }

  function init() {
    if (!overlay) return;
    chosen = pickRandom();
    renderMedals();
    const card = $('#game-card');
    let rolled = false;
    const io = 'IntersectionObserver' in window && new IntersectionObserver((en) => {
      if (en[0].isIntersecting && !rolled) { rolled = true; io.disconnect(); renderCard(true); loadGame(chosen.id).catch(() => {}); }
    }, { threshold: .4 });
    if (io) io.observe(card); else renderCard(false);
    // pause the card's falling-icons loop while it's off screen
    if ('IntersectionObserver' in window) {
      card.classList.add('paused-off');
      new IntersectionObserver((en) => card.classList.toggle('paused-off', !en[0].isIntersecting)).observe(card);
    }
    $('#play').addEventListener('click', () => openGame(chosen.id));
    if (CFG.premioFinal) $('#arc-final').textContent = 'Supera los 20 y hay premio gordo';
  }

  window.ADV_ARCADE = {
    define(id, factory) { factories[id] = factory; },
    list: LISTA,
    open: openGame,
  };
  init();
})();
