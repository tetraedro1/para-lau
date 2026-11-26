(() => {
  'use strict';

  const C = window.ADVIENTO;
  const TOTAL = 24;
  const TZ = 'Europe/Madrid';
  const params = new URLSearchParams(location.search);
  // Preview mode needs the secret code: ?elfo=CODE (and optionally &dia=N)
  let PREVIEW = false;
  let SIM_DAY = null;
  let STORE_KEY = 'adv-' + C.year;
  async function checkPreview() {
    const code = params.get('elfo');
    if (!code || !C.clavePrueba || !crypto.subtle) return;
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(code));
    const hex = [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
    if (hex !== C.clavePrueba) return;
    PREVIEW = true;
    STORE_KEY = 'adv-preview';
    if (params.get('dia')) SIM_DAY = Math.max(0, Math.min(TOTAL, parseInt(params.get('dia'), 10) || 0));
  }
  const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const $ = (s, el = document) => el.querySelector(s);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const vibrate = (p) => { try { navigator.vibrate && navigator.vibrate(p); } catch (_) {} };

  /* ---------- Icons ---------- */

  const ICONS = {
    estrella: '<path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6l-5.4 2.9 1.2-6-4.5-4.2 6.1-.7z"/>',
    arbol: '<path d="M12 3l5 6h-3l4 5h-3l4 5H5l4-5H6l4-5H7z"/><path d="M12 19v2.5"/>',
    copo: '<path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9M9.5 4.5L12 6.5l2.5-2M9.5 19.5l2.5-2 2.5 2M4.6 10.4l3.1-.9-.9-3.1M19.4 13.6l-3.1.9.9 3.1M4.6 13.6l3.1.9-.9 3.1M19.4 10.4l-3.1-.9.9-3.1"/>',
    corazon: '<path d="M12 20s-7.5-4.6-7.5-10.1A4.3 4.3 0 0 1 12 7.1a4.3 4.3 0 0 1 7.5 2.8C19.5 15.4 12 20 12 20z"/>',
    regalo: '<path d="M4.5 11h15v9h-15zM3 7.5h18V11H3zM12 7.5V20M12 7.5C10.5 4.5 7 4 7 6s3 1.5 5 1.5zM12 7.5c1.5-3 5-3.5 5-1.5s-3 1.5-5 1.5z"/>',
    luna: '<path d="M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5z"/><path d="M17 4v3M15.5 5.5h3"/>',
    campana: '<path d="M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20.5a2 2 0 0 0 4 0M12 5V3"/>',
    taza: '<path d="M5 9.5h11V15a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4zM16 10.5h1.5a2.5 2.5 0 0 1 0 5H16M8.5 3.5c-.8 1 .8 2 0 3.2M12.5 3.5c-.8 1 .8 2 0 3.2"/>',
    vela: '<path d="M9 11h6v10H9zM12 11V8.5M12 3c1.6 1.7 1.6 3.6 0 4.6-1.6-1-1.6-2.9 0-4.6z"/>',
    carta: '<path d="M3 6h18v12H3zM3 6l9 7 9-7"/>',
    billete: '<path d="M3 7h18v3a2 2 0 0 0 0 4v3H3v-3a2 2 0 0 0 0-4zM15 7v2M15 11v2M15 15v2"/>',
    plato: '<path d="M7 3v6.5a2 2 0 0 0 2 2V21M11 3v6.5a2 2 0 0 1-2 2M9 3v5M16.5 21V3C18.5 4 19.5 7 19.5 11h-3"/>',
  };
  const ORN_ORDER = ['estrella', 'copo', 'arbol', 'luna', 'campana', 'corazon', 'regalo', 'vela'];
  const svg = (name, vb = '0 0 24 24') => `<svg viewBox="${vb}" aria-hidden="true">${ICONS[name] || ICONS.estrella}</svg>`;
  const LOCK_SVG = '<svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
  const CLOCK_SVG = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>';
  const TREE_SVG = '<svg viewBox="0 0 60 70"><path d="M30 2l14 18h-8l12 16h-8l12 18H8l12-18h-8l12-16h-8z"/><rect x="26" y="54" width="8" height="10" rx="1" fill="#C8A26A" stroke="none"/></svg>';

  /* ---------- Layout ---------- */

  // Fixed shuffled order so the grid feels like a real advent calendar
  const ORDER = [7, 19, 2, 24, 11, 4, 15, 22, 9, 1, 17, 13, 5, 21, 8, 3, 18, 12, 23, 6, 14, 20, 10, 16];
  const SHAPES = { 24: 'big', 12: 'big', 3: 'wide', 15: 'wide', 20: 'wide', 6: 'tall', 18: 'tall', 9: 'tall' };
  const PALETTE = [
    ['#F2D4CC', '#E2B3A8'], // blush
    ['#D3E2D0', '#AFC8AA'], // sage
    ['#D6E2EF', '#B0C6DF'], // powder blue
    ['#F3E6C4', '#E2CD99'], // butter
    ['#E2DAEE', '#C4B6DD'], // lilac
    ['#F6DCE3', '#E6B9C6'], // pink
    ['#E4ECE6', '#C3D3C7'], // mint grey
  ];

  /* ---------- Storage ---------- */

  const store = {
    load() { try { return new Set(JSON.parse(localStorage.getItem(STORE_KEY)) || []); } catch (_) { return new Set(); } },
    save(set) { try { localStorage.setItem(STORE_KEY, JSON.stringify([...set])); } catch (_) {} },
  };
  let opened = new Set();

  /* ---------- Day content (encoded at build time) ---------- */

  const dayCache = {};
  function getDay(day) {
    if (dayCache[day]) return dayCache[day];
    const raw = C.dias[day];
    let d = { titulo: `Día ${day}` };
    if (raw && typeof raw === 'object') d = raw;
    else if (raw) {
      try {
        const key = new TextEncoder().encode(C.sal + ':' + day);
        const bytes = Uint8Array.from(atob(raw), (c) => c.charCodeAt(0));
        for (let i = 0; i < bytes.length; i++) bytes[i] ^= key[i % key.length];
        d = JSON.parse(new TextDecoder().decode(bytes));
      } catch (_) {}
    }
    return (dayCache[day] = d);
  }

  /* ---------- Time (server-synced, Madrid) ---------- */

  let offset = 0;
  async function syncTime() {
    if (location.protocol === 'file:') return;
    try {
      const t0 = Date.now();
      const res = await fetch(location.pathname + '?t=' + t0, { method: 'HEAD', cache: 'no-store' });
      const t1 = Date.now();
      const d = res.headers.get('date');
      if (d) offset = new Date(d).getTime() + 500 - (t0 + t1) / 2;
    } catch (_) {}
  }
  const now = () => new Date(Date.now() + offset);
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ, year: 'numeric', month: 'numeric', day: 'numeric',
    hour: 'numeric', minute: 'numeric', second: 'numeric', hourCycle: 'h23',
  });
  function madrid() {
    const o = {};
    for (const p of fmt.formatToParts(now())) if (p.type !== 'literal') o[p.type] = +p.value;
    return o;
  }
  function unlockedDay() {
    if (PREVIEW) return SIM_DAY ?? TOTAL;
    const p = madrid();
    if (p.year > C.year) return TOTAL;
    if (p.year === C.year && p.month === 12) return Math.min(p.day, TOTAL);
    return 0;
  }
  function daysToStart() {
    const p = madrid();
    return Math.round((Date.UTC(C.year, 11, 1) - Date.UTC(p.year, p.month - 1, p.day)) / 864e5);
  }
  function secsToMidnight() {
    if (PREVIEW) return 0;
    const p = madrid();
    return 86400 - (p.hour * 3600 + p.minute * 60 + p.second);
  }

  /* ---------- Snow ---------- */

  function initSnow() {
    const cv = $('#snow');
    const ctx = cv.getContext('2d');
    let w, h, dpr, flakes = [], px = 0, tx = 0, running = true;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = innerWidth; h = innerHeight;
      cv.width = w * dpr; cv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(Math.min(110, (w * h) / 9000));
      flakes = Array.from({ length: n }, () => makeFlake(true));
    }
    function makeFlake(anywhere) {
      const z = Math.random();
      return {
        x: Math.random() * w, y: anywhere ? Math.random() * h : -10,
        r: .8 + z * 2.6, z, vy: .25 + z * .9, phase: Math.random() * 6.28, sway: .3 + Math.random() * .8,
      };
    }
    function frame(t) {
      if (!running) return;
      px += (tx - px) * .04;
      ctx.clearRect(0, 0, w, h);
      for (const f of flakes) {
        f.y += f.vy;
        f.x += Math.sin(t / 1600 + f.phase) * f.sway * .35;
        if (f.y > h + 10) Object.assign(f, makeFlake(false));
        const x = ((f.x + px * f.z * 30) % (w + 20) + w + 20) % (w + 20) - 10;
        ctx.globalAlpha = .45 + f.z * .5;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(x, f.y, f.r, 0, 6.283);
        ctx.fill();
      }
      requestAnimationFrame(frame);
    }
    addEventListener('resize', resize);
    addEventListener('pointermove', (e) => { tx = e.clientX / w - .5; }, { passive: true });
    addEventListener('deviceorientation', (e) => { if (e.gamma != null) tx = Math.max(-1, Math.min(1, e.gamma / 45)) * .5; }, { passive: true });
    document.addEventListener('visibilitychange', () => {
      running = !document.hidden;
      if (running) requestAnimationFrame(frame);
    });
    resize();
    if (!REDUCED) requestAnimationFrame(frame);
  }

  /* ---------- Confetti ---------- */

  const confetti = (() => {
    const cv = $('#confetti');
    const ctx = cv.getContext('2d');
    const colors = ['#E2B3A8', '#AFC8AA', '#B0C6DF', '#E2CD99', '#C4B6DD', '#C8A26A', '#ffffff'];
    let parts = [], raf = 0;

    function size() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function tick() {
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      parts = parts.filter((p) => p.life > 0);
      for (const p of parts) {
        p.vy += .18; p.vx *= .985; p.vy *= .985;
        p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life -= 1;
        ctx.save();
        ctx.globalAlpha = Math.min(1, p.life / 40);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.c;
        if (p.round) { ctx.beginPath(); ctx.arc(0, 0, p.s / 2, 0, 6.283); ctx.fill(); }
        else ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2 * Math.abs(Math.cos(p.rot * 2)) + 1);
        ctx.restore();
      }
      raf = parts.length ? requestAnimationFrame(tick) : 0;
    }
    addEventListener('resize', size);
    size();

    return function burst(x = innerWidth / 2, y = innerHeight / 2, n = 90) {
      if (REDUCED) return;
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const v = 4 + Math.random() * 9;
        parts.push({
          x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 6,
          s: 6 + Math.random() * 7, rot: Math.random() * 6, vr: (Math.random() - .5) * .3,
          c: colors[(Math.random() * colors.length) | 0], round: Math.random() < .3,
          life: 90 + Math.random() * 60,
        });
      }
      if (!raf) raf = requestAnimationFrame(tick);
    };
  })();

  /* ---------- Toast ---------- */

  let toastTimer;
  function toast(msg) {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
  }

  /* ---------- Grid ---------- */

  const grid = $('#grid');
  const doors = {};

  function buildGrid() {
    grid.innerHTML = ORDER.map((day, i) => {
      const [c, c2] = PALETTE[(day * 5 + i) % PALETTE.length];
      return `<button class="door ${SHAPES[day] || ''}" data-day="${day}" style="--c:${c};--c2:${c2};--i:${i}" aria-label="Día ${day}">
        <span class="door-inside"></span>
        <span class="door-front">
          <span class="num">${day}</span>
          <span class="orn">${svg(ORN_ORDER[day % ORN_ORDER.length])}</span>
          <span class="lock">${LOCK_SVG}</span>
        </span>
      </button>`;
    }).join('');
    grid.querySelectorAll('.door').forEach((el) => { doors[el.dataset.day] = el; });
    grid.addEventListener('click', onDoorClick);
  }

  let unlocked = 0;

  // Only unlocked days ever get their content into the page
  function fillInside(day) {
    const inside = $('.door-inside', doors[day]);
    if (inside.childElementCount || day > unlocked) return;
    const d = getDay(day);
    inside.innerHTML = `<span class="inside-icon">${svg(d.icono)}</span><span class="inside-title">${esc(d.titulo)}</span>`;
  }

  function refreshDoors() {
    unlocked = unlockedDay();
    for (let day = 1; day <= TOTAL; day++) {
      const el = doors[day];
      if (opened.has(day)) fillInside(day);
      el.classList.toggle('locked', day > unlocked);
      el.classList.toggle('opened', opened.has(day));
      el.classList.toggle('today', day === unlocked && !opened.has(day) && !PREVIEW);
      el.setAttribute('aria-label', `Día ${day}${day > unlocked ? ', bloqueado' : opened.has(day) ? ', abierto' : ''}`);
    }
    renderProgress();
  }

  function renderProgress() {
    const el = $('#progress');
    if (!el.children.length) el.innerHTML = '<i></i>'.repeat(TOTAL);
    [...el.children].forEach((dot, i) => {
      const day = i + 1;
      dot.className = opened.has(day) ? 'done' : day <= unlocked ? 'ready' : '';
    });
    el.setAttribute('aria-label', `${opened.size} de ${TOTAL} puertas abiertas`);
  }

  const DENIED = [
    (n) => n === 1 ? 'Esta se abre mañana' : `Faltan ${n} días para esta`,
    () => 'Todavía no, paciencia',
    () => 'Esta puerta aún está dormida',
    () => 'Nada de trampas',
  ];
  let deniedCount = 0;

  function onDoorClick(e) {
    const el = e.target.closest('.door');
    if (!el) return;
    const day = +el.dataset.day;

    if (day > unlocked) {
      el.classList.remove('shake', 'denied');
      void el.offsetWidth;
      el.classList.add('shake', 'denied');
      setTimeout(() => el.classList.remove('shake', 'denied'), 900);
      vibrate([20, 40, 20]);
      const n = unlocked === 0 ? daysToStart() + day - 1 : day - unlocked;
      toast(DENIED[deniedCount++ % DENIED.length](n));
      return;
    }
    openDay(day, el);
  }

  /* ---------- Sheet ---------- */

  const sheet = $('#sheet');
  const body = $('#sheet-body');
  let currentDay = null;
  let cleanup = null;

  function showSheet(html) {
    body.innerHTML = html;
    sheet.hidden = false;
    $('.sheet-card', sheet).scrollTop = 0;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => requestAnimationFrame(() => sheet.classList.add('show')));
  }
  function swapSheet(html) {
    body.innerHTML = html;
    $('.sheet-card', sheet).scrollTop = 0;
  }
  async function closeSheet() {
    if (sheet.hidden) return;
    if (cleanup) { cleanup(); cleanup = null; }
    sheet.classList.remove('show');
    document.body.style.overflow = '';
    const day = currentDay;
    currentDay = null;
    await wait(450);
    sheet.hidden = true;
    body.innerHTML = '';
    if (day && opened.has(day)) {
      const el = doors[day];
      if (!el.classList.contains('opened')) {
        el.classList.add('opening');
        await wait(800);
        el.classList.remove('opening');
      }
      refreshDoors();
    }
  }
  sheet.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) closeSheet(); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSheet(); });

  function revealHTML(day, d) {
    return `<div class="reveal">
      <p class="reveal-date">${day} de diciembre</p>
      <h2 class="reveal-title">${esc(d.titulo)}</h2>
      ${d.foto ? `<figure class="reveal-photo"><img src="${esc(d.foto)}" alt=""></figure>` : ''}
      ${d.texto ? `<p class="reveal-text">${esc(d.texto)}</p>` : ''}
      ${d.plan ? `<div class="reveal-plan">${CLOCK_SVG}<span>${esc(d.plan)}</span></div>` : ''}
      ${d.nota ? `<p class="reveal-note">${esc(d.nota)}</p>` : ''}
    </div>`;
  }

  function markOpened(day) {
    if (opened.has(day)) return;
    opened.add(day);
    store.save(opened);
    renderProgress();
    const dot = $('#progress').children[day - 1];
    dot.classList.add('pop');
    setTimeout(() => dot.classList.remove('pop'), 400);
    updateStatus();
  }

  function celebrate() {
    vibrate([30, 50, 60]);
    const card = $('.sheet-card').getBoundingClientRect();
    confetti(card.left + card.width / 2, card.top + 80, 110);
  }

  async function revealNow(day, d, fresh) {
    swapSheet(`<div class="fade-in">${revealHTML(day, d)}</div>`);
    if (fresh) { markOpened(day); celebrate(); }
  }

  async function openDay(day, el) {
    const d = getDay(day);
    currentDay = day;
    fillInside(day);

    if (opened.has(day)) {
      showSheet(`<div class="fade-in">${revealHTML(day, d)}</div>`);
      return;
    }

    const head = (title, sub) => `<p class="ch-label">Día ${day}</p><h2 class="ch-title">${title}</h2>${sub ? `<p class="ch-sub">${sub}</p>` : ''}`;

    switch (d.tipo) {
      case 'rasca': {
        showSheet(`<div class="fade-in">${head('Rasca para descubrirlo', 'Con el dedo o el ratón')}
          <div class="scratch">${revealHTML(day, d)}<canvas></canvas></div></div>`);
        await wait(80);
        cleanup = initScratch($('.scratch canvas', body), () => { markOpened(day); celebrate(); });
        break;
      }
      case 'regalo': {
        showSheet(`<div class="fade-in">${head('Hay un regalo para ti', 'Mantén pulsado para desenvolverlo')}
          <div class="gift"><div class="gift-box"></div><div class="gift-lid"></div></div>
          <button class="hold-btn" type="button"><svg viewBox="0 0 106 106"><circle cx="53" cy="53" r="49" stroke-dasharray="308" stroke-dashoffset="308"/></svg><span>Mantén</span></button></div>`);
        cleanup = initHold(async () => {
          $('.gift', body).classList.add('popped');
          vibrate(40);
          await wait(650);
          revealNow(day, d, true);
        });
        break;
      }
      case 'bola': {
        const flakes = Array.from({ length: 26 }, () =>
          `<i style="--x:${12 + Math.random() * 76}%;--y:${80 + Math.random() * 9}%;--s:${3 + Math.random() * 3.5}px;--sx:${(Math.random() - .5) * 70}px;--d:${1.6 + Math.random() * 1.4}s;--dl:${Math.random() * .2}s"></i>`).join('');
        showSheet(`<div class="fade-in">${head('Agita la bola de nieve', 'Mueve el móvil o toca la bola')}
          <button class="globe" type="button" aria-label="Agitar"><span class="globe-glass"><span class="globe-tree">${TREE_SVG}</span>${flakes}</span><span class="globe-base"></span></button>
          <div class="shake-count">${'<i></i>'.repeat(5)}</div></div>`);
        cleanup = initGlobe(() => revealNow(day, d, true));
        break;
      }
      case 'pregunta': {
        const q = d.pregunta || { texto: '', opciones: ['Abrir'], correcta: 0 };
        showSheet(`<div class="fade-in">${head('Primero, una pregunta')}
          <p class="quiz-q">${esc(q.texto)}</p>
          <div class="quiz-opts">${q.opciones.map((o, i) => `<button type="button" data-i="${i}">${esc(o)}</button>`).join('')}</div></div>`);
        const opts = $('.quiz-opts', body);
        opts.addEventListener('click', async (e) => {
          const b = e.target.closest('button');
          if (!b) return;
          if (+b.dataset.i === q.correcta) {
            b.classList.add('right');
            vibrate(30);
            await wait(550);
            revealNow(day, d, true);
          } else {
            b.classList.remove('wrong'); void b.offsetWidth; b.classList.add('wrong');
            vibrate([20, 40, 20]);
            toast(q.fallo || 'Casi… prueba otra vez');
          }
        });
        break;
      }
      default: {
        el.classList.add('opening');
        vibrate(25);
        await wait(REDUCED ? 0 : 650);
        el.classList.remove('opening');
        markOpened(day);
        el.classList.add('opened');
        showSheet(`<div class="fade-in">${revealHTML(day, d)}</div>`);
        await wait(250);
        celebrate();
      }
    }
  }

  /* ---------- Interactions ---------- */

  function initScratch(cv, done) {
    const rect = cv.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = rect.width * dpr; cv.height = rect.height * dpr;
    const ctx = cv.getContext('2d');
    ctx.scale(dpr, dpr);

    // pastel foil with sparkles
    const g = ctx.createLinearGradient(0, 0, rect.width, rect.height);
    g.addColorStop(0, '#E2DAEE'); g.addColorStop(.5, '#F2D4CC'); g.addColorStop(1, '#D6E2EF');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, rect.width, rect.height);
    ctx.fillStyle = 'rgba(255,255,255,.55)';
    for (let i = 0; i < 70; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * rect.width, Math.random() * rect.height, Math.random() * 1.8 + .4, 0, 6.283);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(61,56,72,.55)';
    ctx.font = '600 30px Caveat, cursive';
    ctx.textAlign = 'center';
    ctx.fillText('rasca aquí', rect.width / 2, rect.height / 2 + 10);

    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 46;

    let drawing = false, last = null, moves = 0, finished = false;
    const pos = (e) => { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };

    function cleared() {
      const data = ctx.getImageData(0, 0, cv.width, cv.height).data;
      let clear = 0, total = 0;
      for (let i = 3; i < data.length; i += 4 * 40) { total++; if (data[i] < 20) clear++; }
      return clear / total;
    }
    function down(e) { drawing = true; last = pos(e); cv.setPointerCapture(e.pointerId); move(e); }
    function move(e) {
      if (!drawing || finished) return;
      const p = pos(e);
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(p.x + .01, p.y);
      ctx.stroke();
      last = p;
      if (++moves % 12 === 0) {
        vibrate(4);
        if (cleared() > .5) {
          finished = true;
          cv.classList.add('gone');
          done();
        }
      }
    }
    function up() { drawing = false; }
    cv.addEventListener('pointerdown', down);
    cv.addEventListener('pointermove', move);
    cv.addEventListener('pointerup', up);
    cv.addEventListener('pointercancel', up);
    return () => {};
  }

  function initHold(done) {
    const btn = $('.hold-btn', body);
    const ring = $('circle', btn);
    const gift = $('.gift', body);
    const label = $('span', btn);
    const DURATION = 1600;
    let progress = 0, pressing = false, lastT = 0, raf = 0, finished = false;

    function loop(t) {
      const dt = lastT ? t - lastT : 16;
      lastT = t;
      progress += (pressing ? dt / DURATION : -dt / 600);
      progress = Math.max(0, Math.min(1, progress));
      ring.style.strokeDashoffset = 308 * (1 - progress);
      gift.classList.toggle('wobble', progress > 0);
      gift.classList.toggle('fast', progress > .6);
      if (progress >= 1 && !finished) {
        finished = true;
        gift.classList.remove('wobble', 'fast');
        label.textContent = '¡Ya!';
        done();
        return;
      }
      if (pressing || progress > 0) raf = requestAnimationFrame(loop);
      else { raf = 0; lastT = 0; }
    }
    function start(e) {
      if (finished) return;
      e.preventDefault();
      pressing = true;
      btn.classList.add('pressing');
      vibrate(15);
      if (!raf) { lastT = 0; raf = requestAnimationFrame(loop); }
    }
    function stop() { pressing = false; btn.classList.remove('pressing'); }
    btn.addEventListener('pointerdown', start);
    btn.addEventListener('pointerup', stop);
    btn.addEventListener('pointerleave', stop);
    btn.addEventListener('pointercancel', stop);
    btn.addEventListener('contextmenu', (e) => e.preventDefault());
    return () => cancelAnimationFrame(raf);
  }

  function initGlobe(done) {
    const globe = $('.globe', body);
    const dots = [...body.querySelectorAll('.shake-count i')];
    const NEEDED = dots.length;
    let count = 0, lastShake = 0, finished = false, listening = false;

    function shake() {
      const t = Date.now();
      if (finished || t - lastShake < 450) return;
      lastShake = t;
      count++;
      dots.slice(0, count).forEach((d) => d.classList.add('on'));
      globe.classList.remove('shook', 'swirl');
      void globe.offsetWidth;
      globe.classList.add('shook', 'swirl');
      vibrate(25);
      if (count >= NEEDED) {
        finished = true;
        setTimeout(done, 1300);
      }
    }
    function onMotion(e) {
      const a = e.accelerationIncludingGravity || e.acceleration;
      if (!a) return;
      const mag = Math.sqrt((a.x || 0) ** 2 + (a.y || 0) ** 2 + (a.z || 0) ** 2);
      if (mag > 22) shake();
    }
    async function listen() {
      if (listening) return;
      listening = true;
      try {
        if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
          const r = await DeviceMotionEvent.requestPermission();
          if (r !== 'granted') return;
        }
        addEventListener('devicemotion', onMotion);
      } catch (_) {}
    }
    globe.addEventListener('click', () => { listen(); shake(); });
    // Android doesn't need permission, start straight away
    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission !== 'function') listen();
    return () => removeEventListener('devicemotion', onMotion);
  }

  /* ---------- Status & countdown ---------- */

  const pad = (n) => String(n).padStart(2, '0');

  function updateStatus() {
    const el = $('#status');
    if (PREVIEW) {
      el.innerHTML = `Modo prueba · día <b>${unlocked}</b> desbloqueado`;
      return;
    }
    if (unlocked === 0) {
      const n = daysToStart();
      if (n > 1) { el.innerHTML = `Faltan <b>${n} días</b> para la primera puerta`; return; }
    }
    if (unlocked >= TOTAL) {
      el.innerHTML = opened.size >= TOTAL ? `Feliz Navidad, <b>${esc(C.nombre)}</b>` : 'Todas las puertas están abiertas';
      return;
    }
    const s = secsToMidnight();
    const next = unlocked + 1;
    el.innerHTML = `La puerta <b>${next}</b> se abre en <b>${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}</b>`;
  }

  function startClock() {
    let last = unlocked;
    setInterval(() => {
      const u = unlockedDay();
      if (u !== last) {
        last = u;
        refreshDoors();
        if (u >= 1) {
          toast(`Ya puedes abrir la puerta ${u}`);
          const r = doors[u].getBoundingClientRect();
          confetti(r.left + r.width / 2, r.top + r.height / 2, 60);
        }
      }
      updateStatus();
    }, 1000);
    // Re-sync with the server when she comes back to the tab
    document.addEventListener('visibilitychange', async () => {
      if (!document.hidden) { await syncTime(); refreshDoors(); updateStatus(); }
    });
  }

  /* ---------- Music ---------- */

  async function initMusic() {
    const btn = $('#music');
    const audio = $('#audio');
    const src = 'assets/musica.mp3';
    try {
      const r = await fetch(src, { method: 'HEAD' });
      if (!r.ok) return;
    } catch (_) { return; }
    audio.src = src;
    audio.volume = .35;
    btn.hidden = false;
    btn.addEventListener('click', () => {
      if (audio.paused) { audio.play().catch(() => {}); btn.classList.add('playing'); }
      else { audio.pause(); btn.classList.remove('playing'); }
    });
    return () => { audio.play().then(() => btn.classList.add('playing')).catch(() => {}); };
  }

  /* ---------- Intro ---------- */

  function initIntro(startMusic) {
    const intro = $('#intro');
    const env = $('#envelope');
    $('#letter-msg').textContent = C.bienvenida;

    function open() {
      if (env.classList.contains('open')) return;
      env.classList.add('open');
      intro.classList.add('opened');
      vibrate(20);
    }
    env.addEventListener('click', open);
    env.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });

    $('#enter').addEventListener('click', async (e) => {
      e.stopPropagation();
      startMusic && startMusic();
      intro.classList.add('leaving');
      try { sessionStorage.setItem('adv-intro', '1'); } catch (_) {}
      await wait(500);
      intro.remove();
      showApp();
    });

    let seen = false;
    try { seen = sessionStorage.getItem('adv-intro') === '1'; } catch (_) {}
    if (seen) { intro.remove(); showApp(); }
  }

  function showApp() {
    $('#app').hidden = false;
    if (unlocked >= 1 && !opened.has(unlocked) && !PREVIEW) {
      setTimeout(() => doors[unlocked].scrollIntoView({ behavior: 'smooth', block: 'center' }), 1200);
    }
  }

  function initPreviewBar() {
    if (!PREVIEW) return;
    const bar = document.createElement('div');
    bar.className = 'preview-bar';
    bar.innerHTML = `Modo prueba <button type="button" data-a="reset">Reiniciar</button><button type="button" data-a="intro">Ver sobre</button>`;
    bar.addEventListener('click', (e) => {
      const a = e.target.dataset.a;
      if (a === 'reset') { opened = new Set(); store.save(opened); refreshDoors(); updateStatus(); toast('Puertas cerradas otra vez'); }
      if (a === 'intro') { try { sessionStorage.removeItem('adv-intro'); } catch (_) {} location.reload(); }
    });
    document.body.appendChild(bar);
  }

  /* ---------- Boot ---------- */

  async function boot() {
    document.querySelectorAll('[data-nombre]').forEach((el) => { el.textContent = C.nombre; });
    $('#eyebrow').textContent = `Diciembre ${C.year}`;
    $('#firma').textContent = C.firma || '';
    initSnow();
    await checkPreview();
    opened = store.load();
    buildGrid();
    await syncTime();
    refreshDoors();
    updateStatus();
    let startMusic = null;
    initIntro(() => startMusic && startMusic());
    initMusic().then((fn) => { startMusic = fn; });
    initPreviewBar();
    startClock();
  }

  boot();
})();
