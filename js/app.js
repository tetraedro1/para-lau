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
  // Stops the browser from treating a drag as "go back" / scroll / refresh
  const lockTouch = (el) => {
    const stop = (e) => { if (e.cancelable) e.preventDefault(); };
    el.addEventListener('touchstart', stop, { passive: false });
    el.addEventListener('touchmove', stop, { passive: false });
  };
  window.ADV_LOCK_TOUCH = lockTouch;
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
    onigiri: '<path d="M12 4c-2 0-8 9-8 12.5C4 19 6 20 12 20s8-1 8-3.5C20 13 14 4 12 4z"/><path d="M9 14.5h6V20H9z"/>',
    sushi: '<ellipse cx="12" cy="8" rx="7" ry="3"/><path d="M5 8v8c0 1.7 3.1 3 7 3s7-1.3 7-3V8"/><ellipse cx="12" cy="8" rx="3" ry="1.2"/>',
    dango: '<path d="M7 21l10-18"/><circle cx="9.6" cy="16.2" r="2.7"/><circle cx="12" cy="12" r="2.7"/><circle cx="14.4" cy="7.8" r="2.7"/>',
    concha: '<path d="M12 20L4.5 12.5a7.5 7.5 0 0 1 15 0z"/><path d="M12 20l-4.2-9.5M12 20V8.5M12 20l4.2-9.5"/>',
    lazo: '<path d="M12 12L5 7.5v9zM12 12l7-4.5v9z"/><circle cx="12" cy="12" r="1.8"/>',
    trebol: '<circle cx="9.5" cy="9.5" r="2.7"/><circle cx="14.5" cy="9.5" r="2.7"/><circle cx="9.5" cy="14.5" r="2.7"/><circle cx="14.5" cy="14.5" r="2.7"/><path d="M14.5 16.5c1.8 1.6 2.5 3.4 2.5 5"/>',
    capibara: '<path d="M4 15.5c0-4 3-7 8-7h3c3 0 5 2 5 5v1.5c0 2.2-2 4-5 4H8c-2.2 0-4-1.6-4-3.5z"/><circle cx="16.5" cy="12" r=".7"/><path d="M8 19v2M15 19v2M14 8.5l.8-1.8"/><circle cx="12" cy="5.5" r="1.8"/>',
  };
  const ORN_ORDER = ['estrella', 'copo', 'onigiri', 'arbol', 'concha', 'campana', 'corazon', 'lazo', 'regalo', 'sushi', 'luna', 'dango'];
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
    const bg = $('#bg');
    let w, h, dpr, flakes = [], px = 0, tx = 0, ty = 0, py = 0;
    let visible = true, gameOn = false, raf = 0, last = 0;
    let shoot = null, nextShoot = 4 + Math.random() * 6, bubblesUntil = 0, lastBx = 0, lastBy = 0;

    // one soft flake sprite, drawn scaled: much cheaper than arcs every frame
    const sprite = document.createElement('canvas');
    sprite.width = sprite.height = 32;
    const sg = sprite.getContext('2d');
    const grad = sg.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(.45, 'rgba(255,255,255,.9)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    sg.fillStyle = grad;
    sg.fillRect(0, 0, 32, 32);

    function resize() {
      dpr = 1;
      w = innerWidth; h = innerHeight;
      cv.width = w * dpr; cv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(Math.min(w < 640 ? 55 : 95, (w * h) / 9000));
      flakes = Array.from({ length: n }, () => makeFlake(true));
    }
    function makeFlake(anywhere) {
      const z = Math.random();
      return {
        x: Math.random() * w, y: anywhere ? Math.random() * h : -10,
        s: 3 + z * 7, z, vy: 18 + z * 55, phase: Math.random() * 6.28, sway: .3 + Math.random() * .8,
      };
    }
    function frame(now) {
      const dt = Math.min(.05, (now - (last || now)) / 1000);
      last = now;
      px += (tx - px) * Math.min(1, dt * 3);
      py += (ty - py) * Math.min(1, dt * 3);
      const bx = Math.round(px * -240) / 10, by = Math.round(py * -160) / 10;
      if (bx !== lastBx || by !== lastBy) { lastBx = bx; lastBy = by; bg.style.transform = `translate3d(${bx}px, ${by}px, 0)`; }
      ctx.clearRect(0, 0, w, h);
      const bub = now < bubblesUntil;
      if (bub) { ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 1.2; }
      for (const f of flakes) {
        // under the sea the snow turns into bubbles that rise
        f.y += (bub ? -f.vy * 1.4 : f.vy) * dt;
        f.x += Math.sin(now / 1600 + f.phase) * f.sway * 20 * dt;
        if (f.y > h + 10) Object.assign(f, makeFlake(false));
        if (f.y < -20) { Object.assign(f, makeFlake(false)); f.y = h + 10; }
        const x = ((f.x + px * f.z * 40) % (w + 20) + w + 20) % (w + 20) - 10;
        ctx.globalAlpha = .5 + f.z * .5;
        if (bub) {
          ctx.beginPath(); ctx.arc(x, f.y, f.s * .9, 0, 6.283); ctx.stroke();
          ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.beginPath(); ctx.arc(x - f.s * .3, f.y - f.s * .3, f.s * .18, 0, 6.283); ctx.fill();
        } else ctx.drawImage(sprite, x - f.s / 2, f.y - f.s / 2, f.s, f.s);
      }
      // the odd shooting star
      nextShoot -= dt;
      if (!shoot && nextShoot <= 0) {
        shoot = { x: w * (.2 + Math.random() * .7), y: h * Math.random() * .3, life: 0, trio: Math.random() < .35 };
        nextShoot = 9 + Math.random() * 10;
      }
      if (shoot) {
        shoot.life += dt / .9;
        const p = shoot.life, len = 90;
        const hx = shoot.x - p * 260, hy = shoot.y + p * 130;
        ctx.globalAlpha = Math.sin(Math.min(1, p) * Math.PI);
        ctx.lineCap = 'round';
        // sometimes three trails: pink, blue and green
        const trails = shoot.trio ? [['242,150,190', -5], ['130,180,235', 0], ['140,205,140', 5]] : [['255,255,255', 0]];
        for (const [rgb, off] of trails) {
          const ox = off * .45, oy = off;
          const g = ctx.createLinearGradient(hx + ox, hy + oy, hx + ox + len * 1.3, hy + oy - len * .65);
          g.addColorStop(0, `rgba(${rgb},.95)`);
          g.addColorStop(1, `rgba(${rgb},0)`);
          ctx.strokeStyle = g;
          ctx.lineWidth = shoot.trio ? 3 : 2;
          ctx.beginPath(); ctx.moveTo(hx + ox, hy + oy); ctx.lineTo(hx + ox + len * (shoot.trio ? 1.3 : 1), hy + oy - len * (shoot.trio ? .65 : .5)); ctx.stroke();
        }
        if (p >= 1) shoot = null;
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(frame);
    }
    function sync() {
      const should = visible && !gameOn && !REDUCED;
      if (should && !raf) { last = 0; raf = requestAnimationFrame(frame); }
      if (!should && raf) { cancelAnimationFrame(raf); raf = 0; }
    }
    addEventListener('resize', resize);
    addEventListener('pointermove', (e) => { tx = e.clientX / w - .5; ty = e.clientY / h - .5; }, { passive: true });
    addEventListener('deviceorientation', (e) => {
      if (e.gamma != null) tx = Math.max(-1, Math.min(1, e.gamma / 40)) * .5;
      if (e.beta != null) ty = Math.max(-1, Math.min(1, (e.beta - 45) / 40)) * .5;
    }, { passive: true });
    document.addEventListener('visibilitychange', () => { visible = !document.hidden; sync(); });
    document.addEventListener('adv:game', (e) => { gameOn = e.detail; sync(); });
    window.ADV_BUBBLES = (secs) => { bubblesUntil = performance.now() + secs * 1000; };
    resize();
    sync();
  }

  /* ---------- Confetti & sparkles ---------- */

  const fx = (() => {
    const cv = $('#confetti');
    const ctx = cv.getContext('2d');
    const colors = ['#E2B3A8', '#AFC8AA', '#B0C6DF', '#E2CD99', '#C4B6DD', '#C8A26A', '#ffffff'];
    let parts = [], raf = 0, last = 0;

    function size() {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function star(r) {
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const rad = i % 2 ? r * .35 : r;
        const a = i * Math.PI / 4;
        ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
      }
      ctx.closePath();
      ctx.fill();
    }
    // time-based so it runs at the same speed on 60 Hz and 120 Hz screens
    function tick(now) {
      const k = Math.min(3, (now - (last || now)) / 16.67);
      last = now;
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      parts = parts.filter((p) => p.life > 0);
      for (const p of parts) {
        if (p.spark) { p.vx *= Math.pow(.9, k); p.vy *= Math.pow(.9, k); }
        else { p.vy += .18 * k; p.vx *= Math.pow(.985, k); p.vy *= Math.pow(.985, k); }
        p.x += p.vx * k; p.y += p.vy * k; p.rot += p.vr * k; p.life -= k;
        ctx.save();
        ctx.globalAlpha = Math.min(1, p.life / (p.spark ? 14 : 40));
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.c;
        if (p.spark) star(p.s * Math.min(1, p.life / 20));
        else if (p.round) { ctx.beginPath(); ctx.arc(0, 0, p.s / 2, 0, 6.283); ctx.fill(); }
        else ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2 * Math.abs(Math.cos(p.rot * 2)) + 1);
        ctx.restore();
      }
      if (parts.length) raf = requestAnimationFrame(tick);
      else { raf = 0; last = 0; }
    }
    const run = () => { if (!raf) raf = requestAnimationFrame(tick); };
    addEventListener('resize', size);
    size();

    return {
      confetti(x = innerWidth / 2, y = innerHeight / 2, n = 90, pal = colors, round = .3) {
        if (REDUCED) return;
        for (let i = 0; i < n; i++) {
          const a = Math.random() * Math.PI * 2;
          const v = 4 + Math.random() * 9;
          parts.push({
            x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 6,
            s: 6 + Math.random() * 7, rot: Math.random() * 6, vr: (Math.random() - .5) * .3,
            c: pal[(Math.random() * pal.length) | 0], round: Math.random() < round,
            life: 90 + Math.random() * 60,
          });
        }
        run();
      },
      sparkle(x, y, n = 7) {
        if (REDUCED) return;
        for (let i = 0; i < n; i++) {
          const a = Math.random() * Math.PI * 2;
          const v = 1.5 + Math.random() * 3.5;
          parts.push({
            x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, spark: true,
            s: 3 + Math.random() * 4, rot: Math.random() * 3, vr: (Math.random() - .5) * .2,
            c: Math.random() < .5 ? '#ffffff' : colors[(Math.random() * 6) | 0],
            life: 26 + Math.random() * 16,
          });
        }
        run();
      },
    };
  })();
  const confetti = fx.confetti;
  window.ADV_FX = fx;

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
      return `<button class="door intro ${SHAPES[day] || ''}" data-day="${day}" style="--c:${c};--c2:${c2};--i:${i}" aria-label="Día ${day}">
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
    // the entrance animation runs once; dropping the class keeps later animations from replaying it
    grid.addEventListener('animationend', (e) => {
      if (e.animationName === 'doorIn') e.target.classList.remove('intro');
    });
    initTilt();
  }

  // 3D tilt that follows the cursor (mouse/trackpad only)
  function initTilt() {
    if (!matchMedia('(hover: hover) and (pointer: fine)').matches || REDUCED) return;
    let active = null, raf = 0, ev = null;
    const release = (el) => {
      el.style.removeProperty('--rx'); el.style.removeProperty('--ry');
      clearTimeout(el._untilt);
      el._untilt = setTimeout(() => el.classList.remove('tilt'), 500);
    };
    // pointermove can fire faster than the screen refreshes; apply once per frame
    function apply() {
      raf = 0;
      const e = ev, el = e.target.closest && e.target.closest('.door');
      if (active && active !== el) release(active);
      active = el;
      if (!el) return;
      clearTimeout(el._untilt);
      el.classList.add('tilt');
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5;
      const y = (e.clientY - r.top) / r.height - .5;
      el.style.setProperty('--rx', `${(-y * 10).toFixed(1)}deg`);
      el.style.setProperty('--ry', `${(x * 12).toFixed(1)}deg`);
      el.style.setProperty('--mx', `${Math.round((x + .5) * 100)}%`);
      el.style.setProperty('--my', `${Math.round((y + .5) * 100)}%`);
    }
    grid.addEventListener('pointermove', (e) => { ev = e; if (!raf) raf = requestAnimationFrame(apply); });
    grid.addEventListener('pointerleave', () => { if (active) { release(active); active = null; } });
  }

  let unlocked = 0;
  let booted = false;

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
      if (opened.has(day) && !el.classList.contains('opened') && booted) {
        el.classList.add('just-opened');
        setTimeout(() => el.classList.remove('just-opened'), 900);
      }
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
  window.ADV_SHOW = (html) => { currentDay = null; showSheet(`<div class="fade-in">${html}</div>`); };
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
    card.style.transform = '';
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

  // Swipe the card down to close it (touch only, and not while scratching/holding/shaking)
  const card = $('.sheet-card', sheet);
  (() => {
    let startY = null, dy = 0, startT = 0;
    card.addEventListener('touchstart', (e) => {
      if (card.scrollTop > 0 || e.target.closest('canvas, .hold-btn, .globe, .quiz-opts')) return;
      startY = e.touches[0].clientY; dy = 0; startT = Date.now();
    }, { passive: true });
    card.addEventListener('touchmove', (e) => {
      if (startY == null) return;
      dy = Math.max(0, e.touches[0].clientY - startY);
      card.style.transition = 'none';
      card.style.transform = `translateY(${dy}px)`;
    }, { passive: true });
    card.addEventListener('touchend', () => {
      if (startY == null) return;
      startY = null;
      card.style.transition = '';
      const fast = dy > 40 && Date.now() - startT < 250;
      if (dy > 120 || fast) { card.style.transform = 'translateY(110%)'; closeSheet(); }
      else card.style.transform = '';
    });
  })();
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
    const ctx = cv.getContext('2d', { willReadFrequently: true });
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
      if (moves % 3 === 0) fx.sparkle(e.clientX, e.clientY, 2);
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
    lockTouch(cv);
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
      if (pressing && Math.random() < .25 + progress * .5) {
        const r = gift.getBoundingClientRect();
        fx.sparkle(r.left + Math.random() * r.width, r.top + Math.random() * r.height, 1);
      }
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
    lockTouch(btn);
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
      const r = globe.getBoundingClientRect();
      fx.sparkle(r.left + r.width / 2, r.top + r.width / 2, 6);
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

  let lastStatus = '';
  function updateStatus() {
    const el = { set innerHTML(v) { if (v !== lastStatus) { lastStatus = v; $('#status').innerHTML = v; } } };
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
    if (!C.musica) return;
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
    $('#app').classList.remove('waiting');
    // sections below the grid fade up when they scroll into view
    const io = 'IntersectionObserver' in window && new IntersectionObserver((entries) => {
      for (const en of entries) if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    }, { threshold: .15 });
    document.querySelectorAll('.on-scroll').forEach((el) => (io ? io.observe(el) : el.classList.add('in')));
    // a little sparkle wherever she taps
    $('#app').addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse' || e.target.closest('.door, .btn')) fx.sparkle(e.clientX, e.clientY, 6);
    });
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
    // name in the title drops in letter by letter
    const em = $('h1 em');
    em.innerHTML = [...C.nombre].map((ch, i) => `<span class="ltr" style="--d:${i}">${esc(ch)}</span>`).join('');
    em.setAttribute('aria-label', C.nombre);
    initSnow();
    await checkPreview();
    opened = store.load();
    buildGrid();
    await syncTime();
    refreshDoors();
    updateStatus();
    booted = true;
    let startMusic = null;
    initIntro(() => startMusic && startMusic());
    initMusic().then((fn) => { startMusic = fn; });
    initPreviewBar();
    startClock();
  }

  boot();
})();
