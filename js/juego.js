(() => {
  'use strict';

  const C = window.ADVIENTO;
  const G = Object.assign({ titulo: 'Atrapa la Navidad', meta: 60, premio: '' }, C.juego || {});
  const DURATION = 40;
  const BEST_KEY = 'adv-juego-record';
  const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const $ = (s) => document.querySelector(s);
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const vibrate = (p) => { try { navigator.vibrate && navigator.vibrate(p); } catch (_) {} };
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const lerp = (a, b, t) => a + (b - a) * t;
  const getBest = () => { try { return +localStorage.getItem(BEST_KEY) || 0; } catch (_) { return 0; } };
  const setBest = (v) => { try { localStorage.setItem(BEST_KEY, v); } catch (_) {} };

  /* ---------- Sprites (pre-rendered once, drawn with drawImage) ---------- */

  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  const SIZE = 46;

  function rr(ctx, l, t, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(l + r, t);
    ctx.arcTo(l + w, t, l + w, t + h, r);
    ctx.arcTo(l + w, t + h, l, t + h, r);
    ctx.arcTo(l, t + h, l, t, r);
    ctx.arcTo(l, t, l + w, t, r);
    ctx.closePath();
  }
  function makeSprite(draw) {
    const c = document.createElement('canvas');
    c.width = c.height = SIZE * DPR;
    const ctx = c.getContext('2d');
    ctx.scale(DPR, DPR);
    draw(ctx, SIZE);
    return c;
  }
  const gift = (body, ribbon) => makeSprite((x, s) => {
    rr(x, s * .14, s * .36, s * .72, s * .52, 6); x.fillStyle = body; x.fill();
    rr(x, s * .08, s * .26, s * .84, s * .16, 5); x.fillStyle = body; x.fill();
    x.fillStyle = 'rgba(255,255,255,.35)'; x.fillRect(s * .1, s * .27, s * .8, s * .04);
    x.fillStyle = ribbon; x.fillRect(s * .44, s * .26, s * .12, s * .62);
    x.strokeStyle = ribbon; x.lineWidth = 4; x.lineJoin = 'round';
    x.beginPath(); x.ellipse(s * .38, s * .19, s * .1, s * .07, -.4, 0, 6.283); x.stroke();
    x.beginPath(); x.ellipse(s * .62, s * .19, s * .1, s * .07, .4, 0, 6.283); x.stroke();
  });
  const star = makeSprite((x, s) => {
    x.beginPath();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 ? s * .2 : s * .44;
      const a = -Math.PI / 2 + i * Math.PI / 5;
      x.lineTo(s / 2 + Math.cos(a) * r, s / 2 + Math.sin(a) * r);
    }
    x.closePath();
    x.fillStyle = '#EBCB86'; x.fill();
    x.strokeStyle = '#D9B26C'; x.lineWidth = 2; x.lineJoin = 'round'; x.stroke();
  });
  const heart = makeSprite((x, s) => {
    x.beginPath();
    x.moveTo(s / 2, s * .84);
    x.bezierCurveTo(s * .1, s * .56, s * .04, s * .2, s * .3, s * .17);
    x.bezierCurveTo(s * .42, s * .16, s * .5, s * .26, s / 2, s * .32);
    x.bezierCurveTo(s * .5, s * .26, s * .58, s * .16, s * .7, s * .17);
    x.bezierCurveTo(s * .96, s * .2, s * .9, s * .56, s / 2, s * .84);
    x.fillStyle = '#E3A0A0'; x.fill();
    x.fillStyle = 'rgba(255,255,255,.45)';
    x.beginPath(); x.ellipse(s * .34, s * .34, s * .07, s * .04, -.6, 0, 6.283); x.fill();
  });
  const coal = makeSprite((x, s) => {
    x.beginPath();
    const pts = [[.5, .18], [.74, .26], [.84, .5], [.76, .76], [.5, .84], [.24, .78], [.15, .52], [.26, .26]];
    pts.forEach(([a, b], i) => (i ? x.lineTo : x.moveTo).call(x, a * s, b * s));
    x.closePath();
    x.fillStyle = '#5E5869'; x.fill();
    x.fillStyle = 'rgba(255,255,255,.18)';
    x.beginPath(); x.arc(s * .38, s * .38, s * .07, 0, 6.283); x.fill();
    x.beginPath(); x.arc(s * .6, s * .62, s * .04, 0, 6.283); x.fill();
  });

  const GIFTS = [gift('#B0C6DF', '#E2B3A8'), gift('#E2B3A8', '#F3E6C4'), gift('#AFC8AA', '#F2D4CC'), gift('#C4B6DD', '#F3E6C4')];
  const TYPES = [
    { key: 'gift', pts: 1, w: 58, color: '#B0C6DF' },
    { key: 'star', pts: 2, w: 22, color: '#EBCB86', img: star },
    { key: 'heart', pts: 5, w: 5, color: '#E3A0A0', img: heart },
    { key: 'coal', pts: -3, w: 15, color: '#5E5869', img: coal },
  ];
  const TOTAL_W = TYPES.reduce((a, t) => a + t.w, 0);
  function pickType() {
    let r = Math.random() * TOTAL_W;
    for (const t of TYPES) { if ((r -= t.w) < 0) return t; }
    return TYPES[0];
  }

  /* ---------- DOM ---------- */

  const overlay = $('#game');
  const cv = $('#game-cv');
  const ctx = cv.getContext('2d');
  const scoreEl = $('#g-score');
  const multEl = $('#g-mult');
  const bar = $('#g-bar');
  const panel = $('#g-panel');

  let W = 0, H = 0, scale = 1;
  let open = false, running = false, paused = false, raf = 0, last = 0;
  let t = 0, score = 0, combo = 0, mult = 1, spawnIn = 0, shake = 0, squash = 0;
  let px = 0, targetX = 0, keyDir = 0;
  let items = [], parts = [], floaters = [], flakes = [];

  function resize() {
    W = innerWidth; H = innerHeight;
    cv.width = W * DPR; cv.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    safeB = parseFloat(getComputedStyle(overlay).paddingBottom) || 0;
    scale = Math.max(.85, Math.min(1.25, Math.min(W, H * .7) / 480));
    flakes = Array.from({ length: Math.round(Math.min(60, W * H / 14000)) }, () => ({
      x: Math.random() * W, y: Math.random() * H, r: .8 + Math.random() * 2.2, v: 15 + Math.random() * 35, p: Math.random() * 6,
    }));
  }
  const playerW = () => Math.max(84, Math.min(130, W * .24));
  let safeB = 0;
  const playerY = () => H - 96 - safeB;

  /* ---------- Game flow ---------- */

  function setHud() {
    scoreEl.textContent = score;
    multEl.textContent = mult > 1 ? `x${mult}` : '';
    multEl.classList.toggle('on', mult > 1);
  }
  function bump(el) {
    el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump');
  }

  function reset() {
    t = 0; score = 0; combo = 0; mult = 1; spawnIn = .6; shake = 0; squash = 0;
    items = []; parts = []; floaters = [];
    px = targetX = W / 2;
    bar.style.transform = 'scaleX(1)';
    setHud();
  }

  async function countdown() {
    for (const n of ['3', '2', '1', '¡Ya!']) {
      panel.innerHTML = `<div class="g-count">${n}</div>`;
      panel.hidden = false;
      vibrate(10);
      await wait(n === '¡Ya!' ? 450 : 650);
      if (!open) return false;
    }
    panel.hidden = true;
    return true;
  }

  async function openGame() {
    open = true;
    overlay.hidden = false;
    document.body.style.overflow = 'hidden';
    document.dispatchEvent(new CustomEvent('adv:game', { detail: true }));
    resize();
    requestAnimationFrame(() => overlay.classList.add('show'));
    play();
  }

  async function play() {
    reset();
    running = false;
    if (!raf) { last = performance.now(); raf = requestAnimationFrame(loop); }
    if (!(await countdown())) return;
    running = true;
  }

  function closeGame() {
    open = false;
    running = false;
    overlay.classList.remove('show');
    document.body.style.overflow = '';
    document.dispatchEvent(new CustomEvent('adv:game', { detail: false }));
    setTimeout(() => {
      overlay.hidden = true;
      panel.hidden = true;
      cancelAnimationFrame(raf);
      raf = 0;
    }, 400);
    $('#best').textContent = getBest();
  }

  function end() {
    running = false;
    const best = getBest();
    const record = score > best;
    if (record) setBest(score);
    const won = G.premio && score >= G.meta;
    panel.innerHTML = `<div class="g-end">
      <p class="g-end-label">${record && best > 0 ? 'Nuevo récord' : 'Fin del juego'}</p>
      <p class="g-end-score">${score}</p>
      <p class="g-end-sub">puntos · récord ${Math.max(best, score)}</p>
      ${won ? `<p class="g-prize">${esc(G.premio)}</p>` : G.premio ? `<p class="g-end-hint">Consigue ${G.meta} puntos para desbloquear un premio</p>` : ''}
      <div class="g-end-btns"><button class="btn" type="button" data-g="again">Otra vez</button><button class="btn ghost" type="button" data-g="exit">Volver</button></div>
    </div>`;
    panel.hidden = false;
    vibrate([30, 40, 30]);
    if ((record || won) && window.ADV_FX) window.ADV_FX.confetti(W / 2, H * .4, 140);
  }

  /* ---------- Loop ---------- */

  function spawn() {
    const type = pickType();
    const size = SIZE * scale * (type.key === 'heart' ? .9 : 1);
    items.push({
      type, size,
      img: type.img || GIFTS[(Math.random() * GIFTS.length) | 0],
      x: size / 2 + Math.random() * (W - size),
      y: -size,
      vy: lerp(170, 400, t / DURATION) * scale * (.85 + Math.random() * .3),
      rot: (Math.random() - .5) * .6,
      vr: (Math.random() - .5) * 2.2,
      phase: Math.random() * 6.28,
    });
  }

  function burst(x, y, color, n = 12) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * 6.283, v = 60 + Math.random() * 180;
      parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 80, life: .6 + Math.random() * .3, max: .9, r: 2 + Math.random() * 3, color });
    }
  }

  function catchItem(it) {
    const y = playerY();
    if (it.type.pts > 0) {
      combo++;
      mult = Math.min(4, 1 + Math.floor(combo / 6));
      const pts = it.type.pts * mult;
      score += pts;
      floaters.push({ x: it.x, y: y - 20, text: `+${pts}`, color: '#3D3848', life: .9 });
      burst(it.x, y, it.type.key === 'gift' ? '#ffffff' : it.type.color, it.type.key === 'heart' ? 22 : 12);
      squash = 1;
      vibrate(it.type.key === 'heart' ? [15, 30, 15] : 10);
      bump(scoreEl);
      if (mult > 1 && combo % 6 === 0) {
        floaters.push({ x: W / 2, y: H * .35, text: `Combo x${mult}`, color: '#C8A26A', life: 1.2, big: true });
      }
    } else {
      score = Math.max(0, score + it.type.pts);
      combo = 0; mult = 1;
      shake = .35;
      floaters.push({ x: it.x, y: y - 20, text: `${it.type.pts}`, color: '#8A8494', life: .9 });
      burst(it.x, y, '#5E5869', 14);
      vibrate([40, 30, 40]);
    }
    setHud();
  }

  function update(dt) {
    t += dt;
    if (t >= DURATION) { bar.style.transform = 'scaleX(0)'; end(); return; }
    bar.style.transform = `scaleX(${1 - t / DURATION})`;

    spawnIn -= dt;
    if (spawnIn <= 0) {
      spawn();
      spawnIn = lerp(.72, .3, t / DURATION) * (.7 + Math.random() * .6);
    }

    const pw = playerW();
    if (keyDir) targetX += keyDir * 700 * dt;
    targetX = Math.max(pw / 2, Math.min(W - pw / 2, targetX));
    px += (targetX - px) * Math.min(1, dt * 16);

    const py = playerY();
    for (const it of items) {
      it.y += it.vy * dt;
      it.x += Math.sin(t * 2.4 + it.phase) * 22 * dt;
      it.rot += it.vr * dt;
      if (!it.done && it.y + it.size * .35 >= py && it.y - it.size * .35 <= py + 22 && Math.abs(it.x - px) < pw / 2 + it.size * .2) {
        it.done = true;
        catchItem(it);
      }
    }
    items = items.filter((it) => !it.done && it.y < H + it.size);
  }

  function updateFx(dt) {
    for (const p of parts) { p.vy += 420 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; }
    parts = parts.filter((p) => p.life > 0);
    for (const f of floaters) { f.y -= 50 * dt; f.life -= dt; }
    floaters = floaters.filter((f) => f.life > 0);
    if (!running && items.length) {
      for (const it of items) { it.y += it.vy * dt; it.rot += it.vr * dt; }
      items = items.filter((it) => it.y < H + it.size);
    }
    shake = Math.max(0, shake - dt);
    squash = Math.max(0, squash - dt * 5);
    for (const f of flakes) {
      f.y += f.v * dt; f.x += Math.sin(t + f.p) * 8 * dt;
      if (f.y > H) { f.y = -5; f.x = Math.random() * W; }
    }
  }

  function drawPlayer() {
    const pw = playerW(), py = playerY();
    const tilt = Math.max(-.18, Math.min(.18, (targetX - px) * .004));
    const sq = 1 + Math.sin(squash * Math.PI) * .12;
    ctx.save();
    ctx.translate(px, py + 12);
    ctx.rotate(tilt);
    ctx.scale(sq, 2 - sq);
    // sack of gifts peeking out
    ctx.fillStyle = '#C4B6DD';
    rr(ctx, -pw * .3, -24, pw * .26, 22, 5); ctx.fill();
    ctx.fillStyle = '#AFC8AA';
    rr(ctx, -pw * .02, -30, pw * .3, 28, 5); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.6)';
    ctx.fillRect(pw * .11, -30, pw * .04, 28);
    // sled body
    ctx.fillStyle = '#E2B3A8';
    rr(ctx, -pw / 2, -10, pw, 26, 10); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.35)';
    rr(ctx, -pw / 2 + 6, -7, pw - 12, 6, 3); ctx.fill();
    // runners
    ctx.strokeStyle = '#C8A26A';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-pw / 2 + 4, 26);
    ctx.lineTo(pw / 2 - 8, 26);
    ctx.quadraticCurveTo(pw / 2 + 8, 26, pw / 2 + 4, 12);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-pw * .3, 16); ctx.lineTo(-pw * .3, 26);
    ctx.moveTo(pw * .25, 16); ctx.lineTo(pw * .25, 26);
    ctx.stroke();
    ctx.restore();
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    if (shake > 0 && !REDUCED) ctx.translate((Math.random() - .5) * 14 * shake, (Math.random() - .5) * 14 * shake);

    ctx.fillStyle = '#fff';
    for (const f of flakes) {
      ctx.globalAlpha = .7;
      ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 6.283); ctx.fill();
    }
    ctx.globalAlpha = 1;

    for (const it of items) {
      ctx.save();
      ctx.translate(it.x, it.y);
      ctx.rotate(it.rot);
      ctx.drawImage(it.img, -it.size / 2, -it.size / 2, it.size, it.size);
      ctx.restore();
    }

    drawPlayer();

    for (const p of parts) {
      ctx.globalAlpha = Math.max(0, p.life / p.max);
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
    }
    ctx.textAlign = 'center';
    for (const f of floaters) {
      ctx.globalAlpha = Math.min(1, f.life * 2);
      ctx.fillStyle = f.color;
      ctx.font = f.big ? 'italic 500 34px Fraunces, Georgia, serif' : '600 20px "DM Sans", system-ui, sans-serif';
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  function loop(now) {
    const dt = Math.min(.033, (now - last) / 1000);
    last = now;
    if (!paused) {
      if (running) update(dt);
      updateFx(dt);
    }
    draw();
    if (open) raf = requestAnimationFrame(loop);
    else raf = 0;
  }

  /* ---------- Input ---------- */

  const setTarget = (e) => { targetX = e.clientX; };
  if (window.ADV_LOCK_TOUCH) window.ADV_LOCK_TOUCH(cv);
  cv.addEventListener('pointerdown', setTarget);
  cv.addEventListener('pointermove', setTarget);
  addEventListener('keydown', (e) => {
    if (!open) return;
    if (e.key === 'ArrowLeft' || e.key === 'a') keyDir = -1;
    if (e.key === 'ArrowRight' || e.key === 'd') keyDir = 1;
    if (e.key === 'Escape') closeGame();
  });
  addEventListener('keyup', (e) => {
    if ((e.key === 'ArrowLeft' || e.key === 'a') && keyDir < 0) keyDir = 0;
    if ((e.key === 'ArrowRight' || e.key === 'd') && keyDir > 0) keyDir = 0;
  });
  addEventListener('resize', () => { if (open) resize(); });
  document.addEventListener('visibilitychange', () => { paused = document.hidden; last = performance.now(); });

  panel.addEventListener('click', (e) => {
    const a = e.target.closest('[data-g]');
    if (!a) return;
    if (a.dataset.g === 'again') play();
    else closeGame();
  });
  $('#g-close').addEventListener('click', closeGame);
  $('#play').addEventListener('click', openGame);

  $('#game-title').textContent = G.titulo;
  $('#best').textContent = getBest();
})();
