(() => {
  'use strict';

  // Capi the capybara, the hidden clover and the "under the sea" title trick
  const C = window.ADVIENTO;
  const P = C.personaje || {};
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fx = () => window.ADV_FX;
  const vibrate = (p) => { try { navigator.vibrate && navigator.vibrate(p); } catch (_) {} };

  const FRASES = P.frases || [
    'Hoy huele a ramen.',
    'Un duendecillo me ha dicho que hoy tienes suerte.',
    '¿Has encontrado ya el trébol? Está más cerca de lo que crees.',
    'Soy experta en abrazos. Y en mandarinas.',
    'Rosa, azul y verde. Si ves tres estrellas a la vez, pide un deseo.',
    'Dicen que bajo el mar también es Navidad. Toca tu nombre cinco veces.',
    'Lazo rojo puesto. Lista para diciembre.',
    '¿Sushi o pizza? Es broma. Sushi.',
    'La puerta de mañana no se puede abrir. Lo he intentado.',
    'Me han dejado aquí para cuidarte hasta Navidad.',
    'Si te aburres, abajo hay recreativos.',
  ];

  const CAPI_SVG = `<svg viewBox="0 0 120 104" aria-hidden="true">
    <ellipse cx="60" cy="100" rx="50" ry="8" fill="rgba(61,56,72,.12)"/>
    <ellipse cx="60" cy="96" rx="48" ry="26" fill="#B4875F"/>
    <ellipse cx="33" cy="30" rx="8" ry="7" fill="#9E7350"/>
    <ellipse cx="87" cy="30" rx="8" ry="7" fill="#9E7350"/>
    <rect x="22" y="28" width="76" height="62" rx="28" fill="#C29470"/>
    <ellipse cx="60" cy="70" rx="27" ry="18" fill="#A87B57"/>
    <ellipse cx="52" cy="65" rx="2.6" ry="3.2" fill="#5A3F2C"/>
    <ellipse cx="68" cy="65" rx="2.6" ry="3.2" fill="#5A3F2C"/>
    <path d="M54 76q6 4 12 0" stroke="#5A3F2C" stroke-width="2" fill="none" stroke-linecap="round"/>
    <g class="capi-eyes"><circle cx="41" cy="50" r="3.6" fill="#3D3848"/><circle cx="79" cy="50" r="3.6" fill="#3D3848"/></g>
    <ellipse cx="34" cy="62" rx="6" ry="3.5" fill="#E8A0A0" opacity=".55"/>
    <ellipse cx="86" cy="62" rx="6" ry="3.5" fill="#E8A0A0" opacity=".55"/>
    <circle cx="60" cy="20" r="12" fill="#F2A65A"/>
    <circle cx="56" cy="16" r="3" fill="#F7C08A"/>
    <path d="M60 8q6-6 12-2q-6 4-12 2z" fill="#8BA586"/>
    <path d="M90 22l9-7v14zM90 22l-8-8v15z" fill="#E26D6D"/>
    <circle cx="90" cy="22" r="3" fill="#C94F4F"/>
  </svg>`;

  function initCapi() {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'capi';
    el.setAttribute('aria-label', 'Capi');
    el.innerHTML = `<span class="capi-bubble"></span>${CAPI_SVG}`;
    document.body.appendChild(el);
    const bubble = el.querySelector('.capi-bubble');
    let hideT = 0, order = [], shown = false;

    const nextFrase = () => {
      if (!order.length) order = FRASES.map((_, i) => i).sort(() => Math.random() - .5);
      return FRASES[order.pop()];
    };
    function show(talk) {
      if (document.body.style.overflow === 'hidden') return; // a card or the game is open
      shown = true;
      el.classList.add('peek');
      if (talk) say(nextFrase());
      clearTimeout(hideT);
      hideT = setTimeout(hide, talk ? 6500 : 4500);
    }
    function hide() { shown = false; el.classList.remove('peek', 'talk'); }
    function say(text) {
      bubble.textContent = text;
      el.classList.remove('talk'); void el.offsetWidth; el.classList.add('talk');
    }
    el.addEventListener('click', () => {
      const r = el.getBoundingClientRect();
      fx() && fx().sparkle(r.left + r.width / 2, r.top + 20, 10);
      el.classList.remove('boing'); void el.offsetWidth; el.classList.add('boing');
      vibrate(12);
      say(nextFrase());
      clearTimeout(hideT);
      hideT = setTimeout(hide, 6500);
    });

    // peeks out now and then, and always when she reaches the bottom of the page
    setTimeout(() => show(true), 6000);
    setInterval(() => { if (!shown && Math.random() < .5) show(Math.random() < .6); }, 22000);
    let bottomShown = false;
    addEventListener('scroll', () => {
      const atBottom = innerHeight + scrollY > document.documentElement.scrollHeight - 140;
      if (atBottom && !bottomShown) { bottomShown = true; show(true); }
      if (!atBottom) bottomShown = false;
    }, { passive: true });
    document.addEventListener('adv:game', (e) => { if (e.detail) hide(); });
  }

  function initClover() {
    const foot = $('.foot');
    if (!foot) return;
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'trebol';
    b.setAttribute('aria-label', 'Trébol');
    b.innerHTML = '<svg viewBox="0 0 24 24"><circle cx="9.5" cy="9.5" r="3"/><circle cx="14.5" cy="9.5" r="3"/><circle cx="9.5" cy="14.5" r="3"/><circle cx="14.5" cy="14.5" r="3"/><path d="M14.5 16.5c1.8 1.6 2.5 3.4 2.5 5" fill="none" stroke-width="1.6" stroke-linecap="round"/></svg>';
    foot.appendChild(b);
    b.addEventListener('click', () => {
      const r = b.getBoundingClientRect();
      // a shower of gold coins
      for (let i = 0; i < 4; i++) setTimeout(() => fx() && fx().confetti(r.left + r.width / 2, r.top, 40, ['#E9C46A', '#D4A73C', '#F3D98B', '#C8A26A'], .85), i * 120);
      vibrate([20, 40, 20, 40, 60]);
      const msg = (C.secretos && C.secretos.trebol) || 'Has encontrado el trébol de cuatro hojas. El duende te concede un deseo: pídemelo cuando quieras.';
      setTimeout(() => window.ADV_SHOW && window.ADV_SHOW(`<div class="reveal"><p class="reveal-date">Secreto encontrado</p><div class="secret-ic">${b.innerHTML}</div><h2 class="reveal-title">El trébol del duende</h2><p class="reveal-text">${esc(msg)}</p></div>`), 500);
      try { localStorage.setItem('adv-trebol', '1'); } catch (_) {}
    });
  }

  function initBubbles() {
    const title = $('h1 em');
    if (!title) return;
    let taps = 0, t0 = 0;
    title.addEventListener('click', () => {
      const now = Date.now();
      if (now - t0 > 1500) taps = 0;
      t0 = now;
      taps++;
      title.classList.remove('wiggle'); void title.offsetWidth; title.classList.add('wiggle');
      if (taps >= 5) {
        taps = 0;
        window.ADV_BUBBLES && window.ADV_BUBBLES(14);
        vibrate([15, 30, 15, 30, 15]);
        const r = title.getBoundingClientRect();
        fx() && fx().sparkle(r.left + r.width / 2, r.top + r.height / 2, 16);
      }
    });
  }

  initCapi();
  initClover();
  initBubbles();
})();
