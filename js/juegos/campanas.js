ADV_ARCADE.define('campanas', (api) => {
  const PADS = [
    { c: '#E2B3A8', on: '#F08E7E', f: 329.6 },
    { c: '#AFC8AA', on: '#7FC27A', f: 392.0 },
    { c: '#B0C6DF', on: '#6FA2DD', f: 493.9 },
    { c: '#EBCB86', on: '#F2B83C', f: 587.3 },
  ];
  const BELL = '<svg viewBox="0 0 24 24"><path d="M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20a2 2 0 0 0 4 0z" fill="rgba(255,255,255,.85)"/></svg>';
  const css = `
    .sim { position:absolute; left:50%; top:50%; transform:translate(-50%,-46%); width:min(84vw, 380px); aspect-ratio:1; display:grid; grid-template-columns:1fr 1fr; gap:14px; }
    .sim button { border:0; border-radius:50%; background:var(--c); box-shadow:0 10px 24px -12px rgba(61,56,72,.5), inset 0 -6px 0 rgba(0,0,0,.08); display:grid; place-items:center; touch-action:none; transition:transform .12s, background .12s, box-shadow .12s; }
    .sim button svg { width:40%; transition:transform .2s; }
    .sim button.on { background:var(--on); transform:scale(1.06); box-shadow:0 0 0 8px rgba(255,255,255,.6), 0 14px 30px -10px var(--on); }
    .sim button.on svg { transform:rotate(-14deg); }
    .sim-msg { position:absolute; left:0; right:0; top:calc(${api.top}px + 6px); text-align:center; font:500 15px "DM Sans",sans-serif; color:#6E6879; }`;

  let ac = null, seq = [], idx = 0, listening = false, gap = 560, alive = true, msg;
  const btns = [];

  function tone(f, dur = .28) {
    if (!ac) return;
    try {
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = 'triangle'; o.frequency.value = f;
      g.gain.setValueAtTime(.0001, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(.25, ac.currentTime + .02);
      g.gain.exponentialRampToValueAtTime(.0001, ac.currentTime + dur);
      o.connect(g).connect(ac.destination); o.start(); o.stop(ac.currentTime + dur + .02);
    } catch (_) {}
  }
  function light(i, ms) {
    btns[i].classList.add('on'); tone(PADS[i].f, ms / 1000 + .05);
    setTimeout(() => btns[i].classList.remove('on'), ms);
  }
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  async function playSeq() {
    listening = false;
    msg.textContent = 'Mira y escucha…';
    await wait(700);
    for (const i of seq) {
      if (!alive) return;
      light(i, gap * .62);
      await wait(gap);
    }
    msg.textContent = 'Tu turno';
    idx = 0; listening = true;
  }
  function nextRound() {
    seq.push((Math.random() * 4) | 0);
    gap = Math.max(260, 560 - seq.length * 22);
    playSeq();
  }

  const style = document.createElement('style'); style.textContent = css; api.layer.appendChild(style);
  msg = document.createElement('p'); msg.className = 'sim-msg'; api.layer.appendChild(msg);
  const wrap = document.createElement('div'); wrap.className = 'sim';
  PADS.forEach((p, i) => {
    const b = document.createElement('button'); b.type = 'button';
    b.style.setProperty('--c', p.c); b.style.setProperty('--on', p.on); b.innerHTML = BELL;
    b.addEventListener('pointerdown', (e) => { e.preventDefault(); press(i); });
    btns.push(b); wrap.appendChild(b);
  });
  api.layer.appendChild(wrap);

  function press(i) {
    if (!listening || !api.playing) return;
    light(i, 180);
    api.vibrate(6);
    if (i !== seq[idx]) {
      listening = false; alive = false;
      msg.textContent = 'Esa no era…';
      api.shake(.35); api.vibrate([50, 30, 50]);
      btns[seq[idx]].classList.add('on');
      setTimeout(() => api.over(), 900);
      return;
    }
    idx++;
    if (idx === seq.length) {
      listening = false;
      const r = wrap.getBoundingClientRect();
      api.add(1, r.left + r.width / 2, r.top - 10);
      setTimeout(nextRound, 450);
    }
  }

  return {
    pedirPermiso() {
      try { const A = window.AudioContext || window.webkitAudioContext; ac = new A(); ac.resume && ac.resume(); } catch (_) {}
    },
    start() { api.noTime(); nextRound(); },
    stop() { alive = false; try { ac && ac.close(); } catch (_) {} },
  };
});
