/* Accessible navigation, learning tabs, and a browser-local regression demo. */
(() => {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if ('IntersectionObserver' in window && !reducedMotion) {
    document.documentElement.classList.add('js-motion');
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    $$('.reveal').forEach(el => observer.observe(el));
  }

  const menu = $('.menu-toggle');
  const nav = $('#main-nav');
  function closeMenu() {
    nav.classList.remove('open');
    menu.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-label', 'Abrir menú');
  }
  menu.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    nav.classList.toggle('open', open);
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  });
  $$('#main-nav a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && nav.classList.contains('open')) { closeMenu(); menu.focus(); }
  });
  document.addEventListener('click', e => { if (!e.target.closest('.header')) closeMenu(); });
  window.matchMedia('(min-width: 701px)').addEventListener('change', e => { if (e.matches) closeMenu(); });

  if ('IntersectionObserver' in window) {
    const sectionObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const id = entry.target.id;
        $$('#main-nav a').forEach(link => {
          const active = link.getAttribute('href') === '#' + id;
          link.classList.toggle('active', active);
          if (active) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-12% 0px -62% 0px', threshold: 0 });
    ['inicio', 'ruta', 'laboratorio', 'comunidad'].forEach(id => sectionObserver.observe(document.getElementById(id)));
  }

  const tabs = $$('[role="tab"]');
  function setTab(tab) {
    tabs.forEach(t => {
      const active = t === tab;
      t.setAttribute('aria-selected', String(active));
      t.tabIndex = active ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !active;
    });
  }
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => setTab(tab));
    tab.addEventListener('keydown', e => {
      let next;
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') next = tabs[(i + 1) % tabs.length];
      if (e.key === 'Home') next = tabs[0];
      if (e.key === 'End') next = tabs[tabs.length - 1];
      if (next) { e.preventDefault(); setTab(next); next.focus(); }
    });
  });

  let toastTimer;
  function toast(message) {
    $('#toast').textContent = message;
    $('#toast').classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => $('#toast').classList.remove('show'), 3200);
  }

  const Model = window.LinearModel;
  const xs = [1, 2, 3, 4, 5, 6];
  const defaults = [2, 4, 5, 4, 5, 7];
  let ys = [...defaults];
  let model = null;
  const testXs = [1.5, 3.5, 5.5], testYs = [3, 4, 6];
  const fmt = (n, digits = 2) => n.toLocaleString('es-PE', { minimumFractionDigits: digits, maximumFractionDigits: digits });
  const hour = () => Number($('#hours').value);
  const escapeHtml = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  function renderCode() {
    const code = Model.python(xs, ys, hour());
    $('#python-code').innerHTML = code.split('\n').map(line => {
      if (line.trimStart().startsWith('#')) return '<span class="code-comment">' + escapeHtml(line) + '</span>';
      const token = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\b(?:def|return|for|in|if|raise)\b|\b\d+(?:\.\d+)?\b)/g;
      let result = '', last = 0;
      for (const match of line.matchAll(token)) {
        result += escapeHtml(line.slice(last, match.index));
        const kind = /^['"]/.test(match[0]) ? 'string' : /^\d/.test(match[0]) ? 'number' : 'keyword';
        result += '<span class="code-' + kind + '">' + escapeHtml(match[0]) + '</span>';
        last = match.index + match[0].length;
      }
      return result + escapeHtml(line.slice(last));
    }).join('\n');
  }
  const ns = 'http://www.w3.org/2000/svg';
  function svgEl(tag, attrs, content) {
    const el = document.createElementNS(ns, tag);
    Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
    if (content !== undefined) el.textContent = content;
    return el;
  }
  function drawChart() {
    const grid = $('#chart-grid'), dots = $('#chart-dots');
    grid.replaceChildren(); dots.replaceChildren();
    const endpointYs = model ? [Model.predict(model, 1), Model.predict(model, 6)] : [];
    const yMin = Math.floor(Math.min(0, ...endpointYs) / 2) * 2;
    const yMax = Math.ceil(Math.max(8, ...ys, ...endpointYs) / 2) * 2;
    const px = x => 52 + x / 7 * 510;
    const py = y => 264 - (y - yMin) / (yMax - yMin) * 226;
    const yStep = yMax - yMin > 12 ? 4 : 2;
    for (let y = yMin; y <= yMax; y += yStep) {
      grid.append(svgEl('line', { x1: 52, x2: 562, y1: py(y), y2: py(y), stroke: '#e0e7d7', 'stroke-dasharray': '3 5' }));
      grid.append(svgEl('text', { x: 39, y: py(y) + 3, 'text-anchor': 'end' }, String(y)));
    }
    xs.forEach(x => {
      grid.append(svgEl('line', { x1: px(x), x2: px(x), y1: 38, y2: 264, stroke: '#e8eddf', 'stroke-dasharray': '3 5' }));
      grid.append(svgEl('text', { x: px(x), y: 284, 'text-anchor': 'middle' }, String(x)));
    });
    grid.append(svgEl('text', { x: 306, y: 310, 'text-anchor': 'middle', class: 'axis-label' }, 'Horas de práctica (x)'));
    grid.append(svgEl('text', { x: 52, y: 19, class: 'axis-label' }, 'Ejercicios resueltos (y)'));
    xs.forEach((x, i) => {
      const dot = svgEl('circle', { cx: px(x), cy: py(ys[i]), r: 6, fill: '#9cb77c', stroke: '#f9fbf5', 'stroke-width': 2, class: 'data-dot' });
      dot.append(svgEl('title', {}, x + ' horas: ' + ys[i] + ' ejercicios'));
      dots.append(dot);
    });
    const line = $('#fit-line');
    if (model) {
      line.setAttribute('d', `M ${px(1)} ${py(Model.predict(model, 1))} L ${px(6)} ${py(Model.predict(model, 6))}`);
      const cx = px(hour()), cy = py(Model.predict(model, hour()));
      const pred = $('#prediction-dot');
      pred.hidden = false; pred.removeAttribute('hidden');
      pred.querySelector('circle').setAttribute('cx', cx);
      pred.querySelector('circle').setAttribute('cy', cy);
      $('#prediction-guide').setAttribute('d', `M ${cx} 264 L ${cx} ${cy} L 52 ${cy}`);
      $('#chart-svg-desc').textContent = `Seis datos ficticios y su recta de mínimos cuadrados. Para ${fmt(hour(), 1)} horas, el modelo estima ${fmt(Model.predict(model, hour()))} ejercicios.`;
    } else {
      line.setAttribute('d', '');
      $('#prediction-dot').setAttribute('hidden', '');
      $('#chart-svg-desc').textContent = 'Seis pares de datos ficticios. Entrena el modelo para mostrar la recta de mínimos cuadrados.';
    }
  }
  function updatePrediction() {
    $('#hours-output').textContent = fmt(hour(), Number.isInteger(hour()) ? 0 : 1) + ' h';
    $('#hours').setAttribute('aria-valuetext', fmt(hour(), 1) + ' horas de práctica');
    $('#prediction-value').textContent = model ? fmt(Model.predict(model, hour())) : '—';
    $('#equation-value').textContent = model ? `ŷ = ${fmt(model.intercept)} ${model.slope < 0 ? '−' : '+'} ${fmt(Math.abs(model.slope))}x` : 'Aún sin entrenar';
    drawChart(); renderCode();
  }
  function setUntrained(message) {
    model = null;
    $('#model-status').classList.remove('trained');
    $('#model-status').textContent = message;
    $('#train-model').innerHTML = '<span aria-hidden="true">▶</span> Entrenar modelo';
    updatePrediction();
  }
  function renderDataset() {
    const body = $('#dataset-body');
    body.replaceChildren();
    xs.forEach((x, i) => {
      const row = document.createElement('tr');
      const xCell = document.createElement('th');
      xCell.scope = 'row'; xCell.textContent = x;
      const yCell = document.createElement('td');
      const input = document.createElement('input');
      input.type = 'number'; input.min = '0'; input.max = '15'; input.step = '1'; input.value = ys[i]; input.required = true;
      input.setAttribute('aria-label', 'Ejercicios resueltos en ' + x + (x === 1 ? ' hora' : ' horas'));
      input.addEventListener('change', () => {
        if (!input.checkValidity()) {
          input.reportValidity(); input.value = ys[i];
          return;
        }
        ys[i] = Number(input.value);
        setUntrained('Datos actualizados. Vuelve a entrenar el modelo.');
      });
      yCell.append(input); row.append(xCell, yCell); body.append(row);
    });
  }
  $('#train-model').addEventListener('click', () => {
    model = Model.fit(xs, ys);
    updatePrediction();
    const error = Model.mae(model, testXs, testYs);
    $('#model-status').classList.add('trained');
    $('#model-status').textContent = '✓ Modelo entrenado · Error absoluto medio de prueba: ' + fmt(error, 3) + ' ejercicios.';
    $('#train-model').innerHTML = '<span aria-hidden="true">↻</span> Volver a entrenar';
    if (!reducedMotion && $('#fit-line').animate) $('#fit-line').animate([{ opacity: 0 }, { opacity: 1 }], { duration: 550 });
  });
  $('#hours').addEventListener('input', updatePrediction);
  $('#reset-model').addEventListener('click', () => {
    ys = [...defaults]; $('#hours').value = '4'; renderDataset();
    setUntrained('Datos iniciales restaurados. Entrena tu modelo.');
    toast('Se restauraron los datos iniciales.');
  });
  $('#copy-code').addEventListener('click', async () => {
    const code = Model.python(xs, ys, hour());
    try {
      if (!navigator.clipboard) throw new Error('No clipboard');
      await navigator.clipboard.writeText(code);
      toast('Código Python copiado.');
    } catch (_) {
      const range = document.createRange();
      range.selectNodeContents($('#python-code'));
      const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range);
      toast('Código seleccionado. Usa Ctrl+C o Cmd+C para copiar.');
    }
  });
  $('#download-code').addEventListener('click', () => {
    const url = URL.createObjectURL(new Blob([Model.python(xs, ys, hour())], { type: 'text/x-python;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = 'regresion_simple.py';
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast('Se inició la descarga de regresion_simple.py.');
  });
  $('#current-year').textContent = new Date().getFullYear();
  renderDataset(); updatePrediction();
})();
