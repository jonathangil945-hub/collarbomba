(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const safeLS = {
    get(k) { try { return localStorage.getItem(k); } catch (_) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (_) {} },
  };

  /* ---------- aparición al hacer scroll ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
    });
  }, { threshold: 0.1 });
  $$('.reveal').forEach((el) => io.observe(el));

  /* ---------- modo linterna ---------- */
  const btnLuz = $('#btn-linterna');
  window.addEventListener('pointermove', (e) => {
    document.documentElement.style.setProperty('--x', e.clientX + 'px');
    document.documentElement.style.setProperty('--y', e.clientY + 'px');
  });
  btnLuz.addEventListener('click', () => {
    const on = document.body.classList.toggle('linterna');
    btnLuz.setAttribute('aria-pressed', on);
    btnLuz.textContent = on ? '💡 Encender luces' : '🔦 Modo linterna';
  });

  /* ---------- reloj del caso ---------- */
  const eventos = JSON.parse($('#data-eventos').textContent);
  const card = $('#reloj-card');
  const total = Number(card.dataset.total);
  const slider = $('#slider');
  const digital = $('#digital');
  const panel = $('#evento-panel');
  const items = $$('#timeline li');
  const marks = $('#marks');
  const btnPlay = $('#btn-play');
  const flash = $('#flash');
  let lastIdx = -1;
  let playing = null;

  eventos.forEach((e) => {
    const m = document.createElement('span');
    m.style.left = (e.min / total) * 100 + '%';
    m.textContent = e.icono;
    marks.appendChild(m);
  });

  const fmt = (min) => {
    const t = 13 * 60 + 30 + min;
    return String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0');
  };

  function actualizarReloj() {
    const v = Number(slider.value);
    digital.textContent = fmt(v);
    let idx = -1;
    eventos.forEach((e, i) => { if (e.min <= v) idx = i; });
    items.forEach((li, i) => {
      li.classList.toggle('on', i <= idx);
      li.classList.toggle('current', i === idx);
    });
    if (idx !== lastIdx) {
      lastIdx = idx;
      if (idx >= 0) {
        const e = eventos[idx];
        panel.innerHTML = '';
        const h = document.createElement('h3');
        h.textContent = e.icono + ' ' + e.titulo;
        const hora = document.createElement('span');
        hora.className = 'hora';
        hora.textContent = (e.aprox ? '~' : '') + e.hora;
        const p = document.createElement('p');
        p.textContent = e.texto;
        panel.append(hora, h, p);
        if (e.min === total) boom();
      }
    }
    if (v < total) card.classList.remove('boom');
  }

  function boom() {
    card.classList.add('boom');
    flash.classList.remove('go'); void flash.offsetWidth; flash.classList.add('go');
    document.body.classList.remove('shake'); void document.body.offsetWidth; document.body.classList.add('shake');
  }

  function detener() {
    if (playing) { cancelAnimationFrame(playing); playing = null; }
    btnPlay.textContent = '▶ Reproducir';
  }

  btnPlay.addEventListener('click', () => {
    if (playing) { detener(); return; }
    if (Number(slider.value) >= total) { slider.value = 0; lastIdx = -1; }
    btnPlay.textContent = '⏸ Pausar';
    const dur = 14000; // ms para recorrer todo el caso
    const start = performance.now() - (Number(slider.value) / total) * dur;
    const paso = (now) => {
      const prog = Math.min((now - start) / dur, 1);
      slider.value = Math.round(prog * total);
      actualizarReloj();
      if (prog < 1) playing = requestAnimationFrame(paso); else detener();
    };
    playing = requestAnimationFrame(paso);
  });
  slider.addEventListener('input', () => { detener(); actualizarReloj(); });
  actualizarReloj();

  /* ---------- tablero de evidencias ---------- */
  const board = $('#board');
  const svg = $('#hilos');
  const detalle = $('#detalle');
  let personajes = [];
  let nodos = {};

  const NS = 'http://www.w3.org/2000/svg';

  function dibujarHilos() {
    svg.innerHTML = '';
    const br = board.getBoundingClientRect();
    if (window.innerWidth <= 760) return;
    personajes.forEach((p) => {
      p.conexiones.forEach((c) => {
        const a = nodos[p.id], b = nodos[c.con];
        if (!a || !b) return;
        const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
        const x1 = ra.left + ra.width / 2 - br.left, y1 = ra.top + 8 - br.top;
        const x2 = rb.left + rb.width / 2 - br.left, y2 = rb.top + 8 - br.top;
        const mx = (x1 + x2) / 2, my = Math.max(y1, y2) + 36; // el hilo "cuelga"
        const path = document.createElementNS(NS, 'path');
        path.setAttribute('d', `M${x1},${y1} Q${mx},${my} ${x2},${y2}`);
        path.setAttribute('class', 'hilo' + (c.disputado ? ' disputado' : ''));
        path.dataset.a = p.id; path.dataset.b = c.con;
        svg.appendChild(path);
        const txt = document.createElementNS(NS, 'text');
        txt.setAttribute('x', (x1 + 2 * mx + x2) / 4);
        txt.setAttribute('y', (y1 + 2 * my + y2) / 4 - 4);
        txt.setAttribute('text-anchor', 'middle');
        txt.setAttribute('class', 'hilo-txt');
        txt.dataset.a = p.id; txt.dataset.b = c.con;
        txt.textContent = c.etiqueta;
        svg.appendChild(txt);
      });
    });
  }

  function enfocar(id) {
    if (!id) {
      board.classList.remove('foco');
      $$('.activo', board).forEach((el) => el.classList.remove('activo'));
      return;
    }
    board.classList.add('foco');
    $$('.activo', board).forEach((el) => el.classList.remove('activo'));
    nodos[id].classList.add('activo');
    $$('.hilo, .hilo-txt', svg).forEach((el) => {
      if (el.dataset.a === id || el.dataset.b === id) {
        el.classList.add('activo');
        nodos[el.dataset.a].classList.add('activo');
        nodos[el.dataset.b].classList.add('activo');
      }
    });
  }

  function mostrarDetalle(p) {
    detalle.innerHTML = '';
    const h = document.createElement('h3'); h.textContent = p.nombre;
    const r = document.createElement('div'); r.className = 'rol'; r.textContent = p.rol;
    const t = document.createElement('p'); t.textContent = p.texto;
    detalle.append(h, r, t);
    p.conexiones.forEach((c) => {
      const o = personajes.find((x) => x.id === c.con);
      const chip = document.createElement('span');
      chip.className = 'chip' + (c.disputado ? ' disp' : '');
      chip.textContent = c.etiqueta + ' → ' + (o ? o.nombre : c.con);
      detalle.appendChild(chip);
    });
  }

  fetch('/api/personajes').then((r) => r.json()).then((data) => {
    personajes = data;
    data.forEach((p, i) => {
      const b = document.createElement('button');
      b.className = 'nodo';
      b.dataset.estado = p.estado;
      b.style.left = p.x + '%';
      b.style.top = p.y + '%';
      b.style.setProperty('--rot', ((i % 5) - 2) * 1.8 + 'deg');
      const av = document.createElement('div'); av.className = 'avatar'; av.textContent = p.icono;
      const n = document.createElement('b'); n.textContent = p.nombre;
      const s = document.createElement('small'); s.textContent = p.rol;
      b.append(av, n, s);
      b.addEventListener('mouseenter', () => enfocar(p.id));
      b.addEventListener('mouseleave', () => { if (!$('.nodo.sel')) enfocar(null); else enfocar($('.nodo.sel').dataset.id); });
      b.addEventListener('focus', () => enfocar(p.id));
      b.addEventListener('click', () => {
        $$('.nodo.sel').forEach((x) => x.classList.remove('sel'));
        b.classList.add('sel');
        enfocar(p.id);
        mostrarDetalle(p);
      });
      b.dataset.id = p.id;
      board.appendChild(b);
      nodos[p.id] = b;
    });
    requestAnimationFrame(dibujarHilos);
  });
  window.addEventListener('resize', () => requestAnimationFrame(dibujarHilos));

  /* ---------- expediente censurado ---------- */
  const redactados = $$('.redactado');
  redactados.forEach((el) => {
    const alt = () => el.classList.toggle('abierto');
    el.addEventListener('click', alt);
    el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); alt(); } });
  });
  const btnRev = $('#btn-revelar');
  btnRev.addEventListener('click', () => {
    const abrir = redactados.some((r) => !r.classList.contains('abierto'));
    redactados.forEach((r, i) => setTimeout(() => r.classList.toggle('abierto', abrir), i * 120));
    btnRev.textContent = abrir ? 'Volver a censurar' : 'Revelar todo';
  });

  /* ---------- debate / votos ---------- */
  const etiquetas = { victima: 'Víctima forzada', enganado: 'Participante engañado', incierto: 'No hay certeza' };
  const barras = $('#barras');
  const notaVoto = $('#nota-voto');
  const botonesVoto = $$('.voto');

  function pintarVotos(v) {
    const suma = Object.values(v).reduce((a, b) => a + b, 0) || 1;
    barras.innerHTML = '';
    Object.keys(etiquetas).forEach((k) => {
      const fila = document.createElement('div'); fila.className = 'barra-fila';
      const l = document.createElement('span'); l.textContent = etiquetas[k];
      const bar = document.createElement('div'); bar.className = 'barra';
      const i = document.createElement('i'); bar.appendChild(i);
      const pct = document.createElement('span'); pct.textContent = Math.round((v[k] / suma) * 100) + '%';
      fila.append(l, bar, pct);
      barras.appendChild(fila);
      requestAnimationFrame(() => requestAnimationFrame(() => { i.style.width = (v[k] / suma) * 100 + '%'; }));
    });
  }
  function yaVoto() { botonesVoto.forEach((b) => (b.disabled = true)); notaVoto.textContent = 'Gracias por votar. Los resultados se actualizan con cada visitante.'; }

  fetch('/api/voto').then((r) => r.json()).then(pintarVotos);
  if (safeLS.get('cb_voto')) yaVoto();
  botonesVoto.forEach((b) => b.addEventListener('click', () => {
    fetch('/api/voto', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ opcion: b.dataset.op }) })
      .then((r) => r.json()).then((v) => { pintarVotos(v); safeLS.set('cb_voto', b.dataset.op); yaVoto(); });
  }));

  /* ---------- quiz ---------- */
  const quizCard = $('#quiz-card');
  const TIEMPO = 15;
  let preguntas = [], qi = 0, puntos = 0, timer = null;

  function renderPregunta() {
    clearInterval(timer);
    const q = preguntas[qi];
    quizCard.innerHTML = '';
    const top = document.createElement('div'); top.className = 'q-top';
    top.innerHTML = `<span>Pregunta ${qi + 1} de ${preguntas.length}</span><span>Puntos: ${puntos}</span>`;
    const tb = document.createElement('div'); tb.className = 'q-timer';
    const ti = document.createElement('i'); tb.appendChild(ti);
    const txt = document.createElement('p'); txt.className = 'q-texto'; txt.textContent = q.pregunta;
    const ops = document.createElement('div'); ops.className = 'q-ops';
    const botones = q.opciones.map((o, idx) => {
      const b = document.createElement('button'); b.className = 'q-op'; b.textContent = o;
      b.addEventListener('click', () => responder(idx, botones, ti));
      ops.appendChild(b);
      return b;
    });
    quizCard.append(top, tb, txt, ops);

    // barra de tiempo
    ti.style.transition = `transform ${TIEMPO}s linear`;
    requestAnimationFrame(() => requestAnimationFrame(() => { ti.style.transform = 'scaleX(0)'; }));
    timer = setTimeout(() => responder(-1, botones, ti), TIEMPO * 1000);
  }

  function responder(idx, botones, ti) {
    clearTimeout(timer);
    botones.forEach((b) => (b.disabled = true));
    const comp = getComputedStyle(ti).transform; ti.style.transition = 'none'; ti.style.transform = comp;
    fetch(`/api/quiz/${preguntas[qi].id}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ respuesta: idx }),
    }).then((r) => r.json()).then((res) => {
      botones[res.correcta].classList.add('ok');
      if (idx >= 0 && !res.acierto) botones[idx].classList.add('mal');
      if (res.acierto) puntos++;
      const ex = document.createElement('p'); ex.className = 'q-expl';
      ex.textContent = (idx === -1 ? '⏱ Se acabó el tiempo. ' : res.acierto ? '✔ Correcto. ' : '✖ Incorrecto. ') + res.explicacion;
      const nx = document.createElement('button'); nx.className = 'btn btn-red q-next';
      nx.textContent = qi + 1 < preguntas.length ? 'Siguiente →' : 'Ver resultado';
      nx.addEventListener('click', () => { qi++; qi < preguntas.length ? renderPregunta() : resultado(); });
      quizCard.append(ex, nx);
    });
  }

  function resultado() {
    const n = preguntas.length;
    const rango = puntos <= 2 ? 'Curioso de sofá' : puntos <= 4 ? 'Aprendiz de detective' : puntos < n ? 'Investigador del FBI' : 'Agente especial: expediente perfecto';
    quizCard.innerHTML = '';
    const d = document.createElement('div'); d.className = 'resultado';
    d.innerHTML = `<div class="puntos">${puntos}/${n}</div><div class="rango"></div>`;
    $('.rango', d).textContent = rango;
    const b = document.createElement('button'); b.className = 'btn btn-red'; b.textContent = 'Intentarlo de nuevo';
    b.addEventListener('click', iniciarQuiz);
    d.appendChild(b);
    quizCard.appendChild(d);
  }

  function iniciarQuiz() {
    fetch('/api/quiz').then((r) => r.json()).then((q) => { preguntas = q; qi = 0; puntos = 0; renderPregunta(); });
  }
  $('#btn-quiz').addEventListener('click', iniciarQuiz);
})();
