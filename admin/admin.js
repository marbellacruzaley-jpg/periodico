// Gestor de contenido: formularios generados desde esquema.js y vista previa editable.
(function () {
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  const esc = Plantilla.esc;
  // Raíz del sitio: «/» con servidor.js, «/periodico/» en GitHub Pages (el gestor en línea está en admin/github.js)
  const RAIZ = new URL('../', location.origin + location.pathname.replace(/\/admin$/, '/admin/')).href;
  const EN_LINEA = !!window.GestorGitHub;
  const enlace = (ruta) => (EN_LINEA && GestorGitHub.vistaPrevia(ruta)) || RAIZ + String(ruta || '').replace(/^\//, '');

  let datos = null;          // contenido que se está editando
  let guardado = '';         // última versión guardada, para saber si hay cambios
  let seccion = 'destacadas';
  const abiertos = new Set(); // tarjetas de lista desplegadas (por ruta)
  let pilaDeshacer = [], pilaRehacer = [], ultimoCambio = 0;

  // Campos que aparecen en varios lugares de la página: al cambiarlos se redibuja todo
  const REPETIDOS = new Set(['general.numeroEdicion', 'general.fechaEdicion', 'general.mancheta', 'general.emblema', 'general.epoca', 'radio.nombre']);

  // ---------- Rutas: «edicion.articulos.2.titulo» ----------
  const unir = (base, c) => (base ? base + '.' + c : c);
  function obtener(obj, ruta) {
    return ruta.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
  }
  function fijar(obj, ruta, valor) {
    const partes = ruta.split('.');
    let o = obj;
    partes.slice(0, -1).forEach((k, i) => {
      if (o[k] == null) o[k] = /^\d+$/.test(partes[i + 1]) ? [] : {};
      o = o[k];
    });
    o[partes[partes.length - 1]] = valor;
  }
  const baseDe = (s) => (s.base != null ? s.base : s.clave);
  function seccionDe(ruta) {
    return ESQUEMA.find((s) => {
      const b = baseDe(s);
      return b ? ruta === b || ruta.startsWith(b + '.') : s.campos.some((c) => c.c && (ruta === c.c || ruta.startsWith(c.c + '.')));
    });
  }

  // ---------- Iconos ----------
  const ICONOS = {
    ajustes: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    rayo: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
    estrella: '<path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z"/>',
    radio: '<rect x="3" y="8" width="18" height="12" rx="2"/><path d="M7 8l10-5"/><circle cx="8" cy="14" r="2"/><path d="M14 12h4M14 16h4"/>',
    periodico: '<path d="M4 4h13v16H6a2 2 0 0 1-2-2z"/><path d="M17 8h3v10a2 2 0 0 1-2 2M8 8h5M8 12h5M8 16h5"/>',
    web: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
    redes: '<circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.2 10.8l7.6-3.6M8.2 13.2l7.6 3.6"/>',
    historia: '<path d="M12 3v18M5 7h7M12 12h7M5 17h7"/>',
    pie: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 15h18"/>',
    chat: '<path d="M4 4h16v12H9l-5 4z"/>',
    arriba: '<path d="M12 19V5M6 11l6-6 6 6"/>', abajo: '<path d="M12 5v14M6 13l6 6 6-6"/>',
    copiar: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
    borrar: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    flecha: '<path d="M9 6l6 6-6 6"/>', mas: '<path d="M12 5v14M5 12h14"/>', ojo: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'
  };
  const ico = (n) => '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">' + (ICONOS[n] || '') + '</svg>';

  // ---------- Avisos ----------
  function aviso(texto, tipo, accion) {
    const el = document.createElement('div');
    el.className = 'aviso ' + (tipo || '');
    el.textContent = texto;
    if (accion) {
      const b = document.createElement('button');
      b.type = 'button'; b.textContent = accion.texto;
      b.addEventListener('click', () => { accion.hacer(); el.remove(); });
      el.appendChild(b);
    }
    $('#avisos').appendChild(el);
    setTimeout(() => el.remove(), accion ? 7000 : tipo === 'error' ? 6000 : 3000);
  }

  // ---------- Servidor ----------
  async function pedir(url, op) {
    if (EN_LINEA) {
      try { return await GestorGitHub.pedir(url, op || {}); } catch (e) {
        if (e.estado === 401 && !url.includes('/api/entrar')) { mostrarEntrada('Tu clave de acceso ya no es válida. Entra de nuevo: tus cambios siguen aquí.'); throw new Error('sesion'); }
        throw e;
      }
    }
    const r = await fetch(url, Object.assign({ credentials: 'same-origin' }, op));
    let cuerpo = null;
    try { cuerpo = await r.json(); } catch (e) {}
    if (r.status === 401 && !url.includes('/api/entrar')) { mostrarEntrada('Tu sesión terminó. Entra de nuevo: tus cambios siguen aquí.'); throw new Error('sesion'); }
    if (!r.ok) throw new Error((cuerpo && cuerpo.error) || 'Error ' + r.status);
    return cuerpo;
  }

  // ---------- Entrada ----------
  function mostrarEntrada(mensaje) {
    $('#entrar').hidden = false;
    $('#entrar-error').textContent = mensaje || '';
    setTimeout(() => ($('#usuario').value ? $('#clave') : $('#usuario')).focus(), 50);
  }
  $('#form-entrar').addEventListener('submit', async (e) => {
    e.preventDefault();
    $('#entrar-error').textContent = '';
    try {
      await pedir('/api/entrar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ usuario: $('#usuario').value, clave: $('#clave').value }) });
      $('#clave').value = '';
      $('#entrar').hidden = true;
      if (!datos) await iniciar();
    } catch (er) { $('#entrar-error').textContent = er.message; }
  });
  $('#salir').addEventListener('click', async () => {
    if (hayCambios() && !confirm('Tienes cambios sin guardar. ¿Salir de todos modos?')) return;
    await pedir('/api/salir', { method: 'POST' }).catch(() => {});
    guardado = JSON.stringify(datos); // evita el aviso del navegador al recargar
    location.reload();
  });

  async function iniciar() {
    datos = await pedir('/api/contenido');
    guardado = JSON.stringify(datos);
    $('#app').hidden = false;
    try { const m = localStorage.getItem('gestor-modo'); if (m) ponerModo(m); } catch (e) {}
    pintarSecciones();
    abrirSeccion(location.hash.slice(1) || seccion, true);
    redibujar();
    pintarEstado();
  }

  // ---------- Cambios, deshacer y estado ----------
  const hayCambios = () => datos && JSON.stringify(datos) !== guardado;
  function pintarEstado() {
    const sucio = hayCambios();
    const el = $('#estado');
    el.classList.toggle('sucio', sucio);
    el.innerHTML = '<span>' + (sucio ? 'Cambios sin guardar' : 'Todo guardado') + '</span>';
    $('#deshacer').disabled = !pilaDeshacer.length;
    $('#rehacer').disabled = !pilaRehacer.length;
  }
  // Los cambios seguidos (escribir una palabra) se agrupan en un solo paso de «deshacer»
  function antesDeCambiar(forzar) {
    const ahora = Date.now();
    if (forzar || ahora - ultimoCambio > 900) {
      pilaDeshacer.push(JSON.stringify(datos));
      if (pilaDeshacer.length > 150) pilaDeshacer.shift();
      pilaRehacer = [];
    }
    ultimoCambio = forzar ? 0 : ahora;
  }
  function restaurar(desde, hacia) {
    if (!desde.length) return;
    hacia.push(JSON.stringify(datos));
    datos = JSON.parse(desde.pop());
    ultimoCambio = 0;
    pintarSecciones();
    pintarFormulario(true);
    redibujar();
    pintarEstado();
  }
  $('#deshacer').addEventListener('click', () => restaurar(pilaDeshacer, pilaRehacer));
  $('#rehacer').addEventListener('click', () => restaurar(pilaRehacer, pilaDeshacer));

  // Cambio de un campo desde el formulario
  function cambiar(ruta, valor, tipo) {
    antesDeCambiar();
    fijar(datos, ruta, valor);
    pintarEstado();
    actualizarVista(ruta, valor, tipo);
    $$('[data-titulo-de="' + ruta + '"]').forEach((el) => { el.textContent = valor || 'Sin título'; el.classList.toggle('vacio', !valor); });
    $$('[data-mini-de="' + ruta + '"]').forEach((el) => { el.src = enlace(valor); el.hidden = !valor; });
    if (ruta.endsWith('.visible')) pintarSecciones();
  }
  // Cambio de estructura (agregar, mover o quitar elementos): se redibujan formulario y vista
  function cambioEstructura(hacer) {
    antesDeCambiar(true);
    hacer();
    pintarFormulario(true);
    redibujar();
    pintarEstado();
  }

  async function guardar() {
    const b = $('#guardar');
    b.disabled = true;
    try {
      const enviado = JSON.stringify(datos);
      const r = await pedir('/api/contenido', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: enviado });
      guardado = enviado; // si se siguió escribiendo mientras se guardaba, eso queda como cambio pendiente
      pintarEstado();
      aviso((r && r.mensaje) || 'Guardado y publicado', 'ok');
    } catch (e) { if (e.message !== 'sesion') aviso('No se pudo guardar: ' + e.message, 'error'); }
    b.disabled = false;
  }
  $('#guardar').addEventListener('click', guardar);
  window.addEventListener('beforeunload', (e) => { if (hayCambios()) { e.preventDefault(); e.returnValue = ''; } });
  document.addEventListener('keydown', (e) => {
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.key.toLowerCase() === 's') { e.preventDefault(); guardar(); }
    // Dentro de un campo, Ctrl+Z deshace la escritura como siempre
    const enCampo = /^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName);
    if (mod && !enCampo && e.key.toLowerCase() === 'z' && !e.shiftKey) { e.preventDefault(); restaurar(pilaDeshacer, pilaRehacer); }
    if (mod && !enCampo && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) { e.preventDefault(); restaurar(pilaRehacer, pilaDeshacer); }
  });

  // ---------- Modo y secciones ----------
  function ponerModo(m) {
    document.body.classList.toggle('modo-visual', m === 'visual');
    $$('[data-modo]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.modo === m)));
    try { localStorage.setItem('gestor-modo', m); } catch (e) {}
    if (m === 'visual') redibujar();
  }
  $$('[data-modo]').forEach((b) => b.addEventListener('click', () => ponerModo(b.dataset.modo)));
  const enVisual = () => document.body.classList.contains('modo-visual');
  const pantallaAngosta = () => matchMedia('(max-width: 760px)').matches;

  $$('[data-dispositivo]').forEach((b) => b.addEventListener('click', () => {
    $$('[data-dispositivo]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    $('#vista-marco').classList.toggle('celular', b.dataset.dispositivo === 'celular');
  }));

  function pintarSecciones() {
    $('#secciones').innerHTML = '<p class="secciones-titulo">Secciones</p>' + ESQUEMA.map((s) => {
      const sv = obtener(datos, baseDe(s) || s.campos[0].c);
      const oculta = sv && sv.visible === false;
      return '<button type="button" data-seccion="' + s.clave + '"' + (s.clave === seccion ? ' aria-current="true"' : '') + ' title="' + esc(s.titulo) + '">' +
        ico(s.icono) + '<span>' + esc(s.titulo) + '</span>' + (oculta ? '<span class="oculta">Oculta</span>' : '') + '</button>';
    }).join('') +
      '<div class="consejos"><strong>Consejos</strong>Haz clic en cualquier texto de la vista previa para editarlo. ' +
      'Guarda con <kbd>Ctrl</kbd>+<kbd>S</kbd>. Si te equivocas, usa <kbd>Ctrl</kbd>+<kbd>Z</kbd> o el Historial.</div>';
    $$('#secciones [data-seccion]').forEach((b) => b.addEventListener('click', () => abrirSeccion(b.dataset.seccion, true)));
  }

  function abrirSeccion(clave, desplazarVista) {
    const s = ESQUEMA.find((x) => x.clave === clave) || ESQUEMA[0];
    if (s.clave !== seccion) abiertos.clear();
    seccion = s.clave;
    history.replaceState(null, '', '#' + s.clave);
    $$('#secciones [data-seccion]').forEach((b) => b.toggleAttribute('aria-current', b.dataset.seccion === s.clave));
    $$('#secciones [aria-current]').forEach((b) => b.setAttribute('aria-current', 'true'));
    pintarFormulario(false);
    if (desplazarVista && s.ancla) llamarVista('irA', s.ancla);
  }

  // ---------- Formulario ----------
  function pintarFormulario(conservarScroll) {
    const s = ESQUEMA.find((x) => x.clave === seccion);
    const panel = $('#panel'), y = panel.scrollTop;
    const cont = $('#panel-interior');
    cont.innerHTML = '';
    const cab = document.createElement('div');
    cab.className = 'panel-cabeza';
    cab.innerHTML = '<h1>' + esc(s.titulo) + '</h1><p>' + esc(s.descripcion) + '</p>';
    if (s.ancla && pantallaAngosta()) {
      const ver = document.createElement('button');
      ver.type = 'button'; ver.className = 'btn btn-chico'; ver.innerHTML = ico('ojo') + 'Ver en la página';
      ver.addEventListener('click', () => { ponerModo('visual'); llamarVista('irA', s.ancla); });
      cab.appendChild(ver);
    }
    cont.appendChild(cab);
    const tarjeta = document.createElement('div');
    tarjeta.className = 'tarjeta-seccion';
    const rej = document.createElement('div');
    rej.className = 'rejilla';
    pintarCampos(s.campos, baseDe(s), rej);
    tarjeta.appendChild(rej);
    cont.appendChild(tarjeta);
    panel.scrollTop = conservarScroll ? y : 0;
  }

  let contadorId = 0;
  function pintarCampos(campos, base, cont) {
    campos.forEach((def) => {
      if (def.tituloGrupo) {
        const t = document.createElement('p');
        t.className = 'titulo-grupo'; t.textContent = def.tituloGrupo;
        cont.appendChild(t);
        return;
      }
      const ruta = def.c ? unir(base, def.c) : null;
      const el = crearCampo(def, ruta);
      if (def.ancho !== 'medio') el.classList.add('completo');
      cont.appendChild(el);
    });
  }

  function crearCampo(def, ruta) {
    const valor = ruta ? obtener(datos, ruta) : undefined;
    const caja = document.createElement('div');
    caja.className = 'campo';
    const id = 'c' + (++contadorId);
    const ayuda = def.ayuda ? '<span class="ayuda">' + esc(def.ayuda) + '</span>' : '';

    switch (def.t) {
      case 'interruptor': {
        caja.innerHTML = '<label class="interruptor' + (def.c === 'visible' ? ' interruptor-seccion' : '') + '"><input type="checkbox" data-ruta="' + ruta + '"' + (valor !== false && (valor || def.c === 'visible') ? ' checked' : '') + '><span class="riel"></span>' + esc(def.e) + '</label>' + ayuda;
        const inp = $('input', caja);
        inp.addEventListener('change', () => { cambiar(ruta, inp.checked, 'interruptor'); });
        break;
      }
      case 'texto': case 'enlace': case 'numero': {
        caja.innerHTML = '<label for="' + id + '">' + esc(def.e) + '</label>' +
          '<input id="' + id + '" class="entrada' + (def.t === 'enlace' ? ' entrada-enlace' : '') + '" type="' + (def.t === 'numero' ? 'number' : 'text') + '"' +
          (def.t === 'enlace' ? ' spellcheck="false" placeholder="https://… o #seccion"' : def.ej ? ' placeholder="Ej.: ' + esc(def.ej) + '"' : '') + ' data-ruta="' + ruta + '">' + ayuda;
        const inp = $('input', caja);
        inp.value = valor == null ? '' : valor;
        inp.addEventListener('input', () => cambiar(ruta, def.t === 'numero' ? Number(inp.value) || 0 : inp.value, def.t));
        break;
      }
      case 'area': case 'md': {
        const barra = def.t === 'md' ? '<div class="formato"><button type="button" data-f="b" title="Negrita"><b>N</b></button><button type="button" data-f="a" title="Agregar enlace">Enlace</button><span>**negrita** · [texto](enlace)</span></div>' : '';
        caja.innerHTML = '<label for="' + id + '">' + esc(def.e) + '</label>' + barra +
          '<textarea id="' + id + '" class="entrada" rows="' + (def.filas || 3) + '"' + (def.ej ? ' placeholder="Ej.: ' + esc(def.ej) + '"' : '') + ' data-ruta="' + ruta + '"></textarea>' + ayuda;
        const ta = $('textarea', caja);
        ta.value = valor == null ? '' : valor;
        ta.addEventListener('input', () => cambiar(ruta, ta.value, def.t));
        $$('[data-f]', caja).forEach((b) => b.addEventListener('click', () => envolver(ta, b.dataset.f)));
        break;
      }
      case 'imagen': caja.appendChild(campoImagen(def, ruta, valor)); caja.insertAdjacentHTML('beforeend', ayuda); break;
      case 'pdf': caja.appendChild(campoPdf(def, ruta, valor)); caja.insertAdjacentHTML('beforeend', ayuda); break;
      case 'grupo': {
        const fs = document.createElement('fieldset');
        fs.className = 'grupo';
        fs.innerHTML = '<legend>' + esc(def.e) + '</legend>';
        const rej = document.createElement('div');
        rej.className = 'rejilla';
        if (def.compacto) def.campos.forEach((c) => { c.ancho = c.ancho || 'medio'; });
        pintarCampos(def.campos, ruta, rej);
        fs.appendChild(rej);
        caja.appendChild(fs);
        break;
      }
      case 'lista': caja.appendChild(campoLista(def, ruta, valor || [])); break;
      case 'accion': {
        caja.innerHTML = '<div class="grupo"><p class="etiqueta-campo" style="margin:0 0 .25rem">' + esc(def.e) + '</p>' + ayuda + '<div style="margin-top:.6rem"><button type="button" class="btn">Leer el PDF de la edición</button></div></div>';
        $('button', caja).addEventListener('click', (e) => indexar(e.currentTarget));
        break;
      }
    }
    // Al entrar en un campo, la vista previa señala dónde aparece
    caja.addEventListener('focusin', (e) => { const r = e.target.dataset && e.target.dataset.ruta; if (r) llamarVista('resaltar', r); });
    return caja;
  }

  // Botones de formato para los textos con enlaces
  function envolver(ta, f) {
    const a = ta.selectionStart, b = ta.selectionEnd, sel = ta.value.slice(a, b);
    let nuevo;
    if (f === 'b') nuevo = '**' + (sel || 'texto') + '**';
    else {
      const u = prompt('Pega el enlace (https://… o contenidos/archivo.pdf#page=3):', 'https://');
      if (!u) return;
      nuevo = '[' + (sel || 'texto del enlace') + '](' + u.trim() + ')';
    }
    ta.setRangeText(nuevo, a, b, 'end');
    ta.focus();
    ta.dispatchEvent(new Event('input'));
  }

  // ----- Imagen -----
  function campoImagen(def, ruta, valor) {
    const el = document.createElement('div');
    el.innerHTML = '<span class="etiqueta-campo">' + esc(def.e) + '</span>' +
      '<div class="imagen-campo" style="margin-top:.3rem">' +
      '<div class="miniatura" title="Arrastra una imagen aquí"></div>' +
      '<div class="imagen-acciones"><div class="fila">' +
      '<label class="btn btn-chico subir">Subir<input type="file" accept="image/jpeg,image/png,image/webp,image/gif"></label>' +
      '<button type="button" class="btn btn-chico" data-a="biblioteca">Biblioteca</button>' +
      '<button type="button" class="btn btn-chico btn-fantasma" data-a="quitar">Quitar</button></div>' +
      '<details class="ruta-archivo"><summary>Ruta del archivo</summary><input class="entrada" type="text" spellcheck="false" data-ruta="' + ruta + '"></details>' +
      '</div></div>';
    const mini = $('.miniatura', el), inp = $('input[type=text]', el);
    function pintar(v) {
      mini.innerHTML = v ? '<img alt="" src="' + esc(enlace(v)) + '">' : '<span class="vacia">Sin imagen<br>Arrastra una aquí</span>';
      inp.value = v || '';
    }
    function poner(v) { pintar(v); cambiar(ruta, v, 'imagen'); }
    pintar(valor);
    inp.addEventListener('input', () => { cambiar(ruta, inp.value, 'imagen'); pintar(inp.value); });
    $('input[type=file]', el).addEventListener('change', async (e) => {
      const f = e.target.files[0]; e.target.value = '';
      if (f) subirImagen(f, mini).then(poner).catch(() => {});
    });
    $('[data-a=biblioteca]', el).addEventListener('click', () => abrirBiblioteca(poner));
    $('[data-a=quitar]', el).addEventListener('click', () => poner(''));
    mini.addEventListener('click', () => abrirBiblioteca(poner));
    mini.addEventListener('dragover', (e) => { e.preventDefault(); mini.classList.add('arrastrando'); });
    mini.addEventListener('dragleave', () => mini.classList.remove('arrastrando'));
    mini.addEventListener('drop', (e) => {
      e.preventDefault(); mini.classList.remove('arrastrando');
      const f = e.dataTransfer.files[0];
      if (f && f.type.startsWith('image/')) subirImagen(f, mini).then(poner).catch(() => {});
    });
    return el;
  }

  // Las fotos grandes (de cámara o celular) se reducen antes de subirlas para que la página cargue rápido
  async function reducir(archivo) {
    const MAX = 1800;
    if (!/^image\/(jpeg|png|webp)$/.test(archivo.type)) return archivo;
    try {
      const bmp = await createImageBitmap(archivo);
      const escala = Math.min(1, MAX / Math.max(bmp.width, bmp.height));
      if (escala === 1 && archivo.size < 1.5e6) return archivo;
      const lienzo = document.createElement('canvas');
      lienzo.width = Math.round(bmp.width * escala); lienzo.height = Math.round(bmp.height * escala);
      lienzo.getContext('2d').drawImage(bmp, 0, 0, lienzo.width, lienzo.height);
      const tipo = archivo.type === 'image/png' ? 'image/png' : 'image/jpeg'; // el PNG conserva la transparencia
      const blob = await new Promise((ok) => lienzo.toBlob(ok, tipo, .86));
      if (!blob || blob.size >= archivo.size) return archivo;
      const nombre = archivo.name.replace(/\.(jpe?g|png|webp)$/i, '') + (tipo === 'image/png' ? '.png' : '.jpg');
      return new File([blob], nombre, { type: tipo });
    } catch (e) { return archivo; }
  }
  async function subirImagen(archivo, mini) {
    if (mini) mini.classList.add('cargando');
    try {
      const f = await reducir(archivo);
      const r = await pedir('/api/subir?nombre=' + encodeURIComponent(f.name), { method: 'POST', body: f });
      aviso('Imagen subida', 'ok');
      return r.ruta;
    } catch (e) {
      if (e.message !== 'sesion') aviso('No se pudo subir: ' + e.message, 'error');
      throw e;
    } finally { if (mini) mini.classList.remove('cargando'); }
  }

  let alElegir = null;
  async function abrirBiblioteca(cb) {
    alElegir = cb;
    const dlg = $('#dlg-biblioteca'), cont = $('#biblioteca');
    cont.innerHTML = '<p class="ayuda">Cargando…</p>';
    dlg.showModal();
    try {
      const lista = await pedir('/api/archivos?tipo=imagen');
      cont.innerHTML = lista.length ? '' : '<p class="ayuda">Todavía no hay imágenes. Sube una con «Subir nueva».</p>';
      lista.forEach((a) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.innerHTML = '<img loading="lazy" alt="" src="' + esc(enlace(a.ruta)) + '"><span>' + esc(a.nombre) + '</span>';
        b.addEventListener('click', () => { dlg.close(); alElegir(decodeURIComponent(a.ruta)); });
        cont.appendChild(b);
      });
    } catch (e) { cont.innerHTML = '<p class="ayuda">' + esc(e.message) + '</p>'; }
  }
  $('#biblioteca-subir').addEventListener('change', async (e) => {
    const f = e.target.files[0]; e.target.value = '';
    if (!f) return;
    try { const ruta = await subirImagen(f); $('#dlg-biblioteca').close(); alElegir(ruta); } catch (er) {}
  });
  $$('dialog [data-cerrar]').forEach((b) => b.addEventListener('click', () => b.closest('dialog').close()));

  // ----- PDF -----
  function campoPdf(def, ruta, valor) {
    const el = document.createElement('div');
    el.innerHTML = '<span class="etiqueta-campo">' + esc(def.e) + '</span>' +
      '<div class="pdf-campo" style="margin-top:.3rem"><span class="pdf-icono">PDF</span><span class="pdf-nombre"></span>' +
      '<div class="fila"><label class="btn btn-chico subir">Subir PDF<input type="file" accept="application/pdf"></label>' +
      '<select class="btn btn-chico" aria-label="Elegir un PDF ya subido"><option value="">Elegir…</option></select></div></div>';
    const nombre = $('.pdf-nombre', el), sel = $('select', el);
    const pintar = (v) => { nombre.textContent = v ? decodeURIComponent(v.split('/').pop()) : 'Ningún archivo'; };
    pintar(valor);
    pedir('/api/archivos?tipo=pdf').then((l) => l.forEach((a) => sel.insertAdjacentHTML('beforeend', '<option value="' + esc(a.ruta) + '" data-bytes="' + a.tamano + '">' + esc(a.nombre) + ' · ' + tamano(a.tamano) + '</option>'))).catch(() => {});
    // Al cambiar el PDF de la edición, su tamaño se anota solo junto al botón de descarga
    const poner = (v, bytes) => {
      pintar(v); cambiar(ruta, v, 'pdf');
      if (ruta === 'general.pdfEdicion' && bytes) cambiar('edicion.pesoPdf', tamano(bytes), 'texto');
    };
    sel.addEventListener('change', () => {
      if (!sel.value) return;
      poner(sel.value, Number(sel.selectedOptions[0].dataset.bytes));
      sel.value = '';
    });
    $('input[type=file]', el).addEventListener('change', async (e) => {
      const f = e.target.files[0]; e.target.value = '';
      if (!f) return;
      nombre.textContent = 'Subiendo ' + f.name + '…';
      try {
        const r = await pedir('/api/subir?nombre=' + encodeURIComponent(f.name), { method: 'POST', body: f });
        poner(r.ruta, r.tamano);
        aviso('PDF subido', 'ok');
      } catch (er) { pintar(obtener(datos, ruta)); if (er.message !== 'sesion') aviso('No se pudo subir: ' + er.message, 'error'); }
    });
    return el;
  }
  const tamano = (b) => (b >= 1048576 ? Math.round(b / 1048576) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB');

  // ----- Lista -----
  function nuevoElemento(campos) {
    const o = {};
    campos.forEach((c) => {
      if (!c.c) return;
      o[c.c] = c.def != null ? c.def : c.t === 'interruptor' ? (c.c === 'visible') : c.t === 'lista' ? [] : c.t === 'grupo' ? nuevoElemento(c.campos) : c.t === 'numero' ? 1 : '';
    });
    return o;
  }
  function campoLista(def, ruta, lista) {
    const el = document.createElement('div');
    const lleno = def.max && lista.length >= def.max;
    el.innerHTML = '<div class="lista-cabeza"><span class="etiqueta-campo">' + esc(def.e) + ' <span class="contador">· ' + lista.length + '</span></span></div>' +
      (def.ayuda ? '<span class="ayuda">' + esc(def.ayuda) + '</span>' : '') + '<div class="lista"></div>';
    const cont = $('.lista', el);
    const agregar = document.createElement('button');
    agregar.type = 'button';
    agregar.className = 'btn agregar';
    agregar.innerHTML = ico('mas') + 'Agregar ' + esc(def.item || 'elemento') + (def.nuevoArriba ? ' al inicio' : '');
    agregar.disabled = !!lleno;
    agregar.addEventListener('click', () => cambioEstructura(() => {
      const arr = obtener(datos, ruta) || [];
      if (!obtener(datos, ruta)) fijar(datos, ruta, arr);
      const i = def.nuevoArriba ? 0 : arr.length;
      arr.splice(i, 0, nuevoElemento(def.campos));
      abiertos.clear();
      abiertos.add(ruta + '.' + i);
      requestAnimationFrame(() => { const p = $('[data-tarjeta="' + ruta + '.' + i + '"] input, [data-tarjeta="' + ruta + '.' + i + '"] textarea'); if (p) p.focus(); });
    }));

    if (!lista.length) cont.innerHTML = '<div class="lista-vacia">Todavía no hay elementos.</div>';
    if (def.nuevoArriba) cont.before(agregar);
    lista.forEach((item, i) => {
      const r = ruta + '.' + i;
      const tit = def.tituloItem ? item[def.tituloItem] : '';
      const img = def.imagenItem ? item[def.imagenItem] : '';
      const t = document.createElement('div');
      t.className = 'tarjeta' + (abiertos.has(r) ? ' abierta' : '');
      t.dataset.tarjeta = r;
      t.innerHTML = '<div class="tarjeta-cabeza" role="button" tabindex="0" aria-expanded="' + abiertos.has(r) + '">' +
        '<span class="flechita">' + ico('flecha') + '</span><span class="tarjeta-num">' + (i + 1) + '</span>' +
        (def.imagenItem ? '<img class="tarjeta-mini" alt="" data-mini-de="' + r + '.' + def.imagenItem + '"' + (img ? ' src="' + esc(enlace(img)) + '"' : ' hidden') + '>' : '') +
        '<span class="tarjeta-titulo' + (tit ? '' : ' vacio') + '"' + (def.tituloItem ? ' data-titulo-de="' + r + '.' + def.tituloItem + '"' : '') + '>' + esc(tit || (def.tituloItem ? 'Sin título' : (def.item || 'Elemento') + ' ' + (i + 1))) + '</span>' +
        '<span class="tarjeta-botones">' +
        '<button type="button" class="btn" data-op="arriba" title="Subir" aria-label="Subir"' + (i === 0 ? ' disabled' : '') + '>' + ico('arriba') + '</button>' +
        '<button type="button" class="btn" data-op="abajo" title="Bajar" aria-label="Bajar"' + (i === lista.length - 1 ? ' disabled' : '') + '>' + ico('abajo') + '</button>' +
        '<button type="button" class="btn" data-op="copiar" title="Duplicar" aria-label="Duplicar"' + (lleno ? ' disabled' : '') + '>' + ico('copiar') + '</button>' +
        '<button type="button" class="btn btn-peligro" data-op="borrar" title="Eliminar" aria-label="Eliminar">' + ico('borrar') + '</button>' +
        '</span></div>';
      const cuerpo = document.createElement('div');
      cuerpo.className = 'tarjeta-cuerpo';
      cuerpo.hidden = !abiertos.has(r);
      const rej = document.createElement('div');
      rej.className = 'rejilla';
      // El cuerpo se arma solo al abrir la tarjeta: las listas largas cargan rápido
      if (abiertos.has(r)) pintarCampos(def.campos, r, rej);
      cuerpo.appendChild(rej);
      t.appendChild(cuerpo);
      const cab = $('.tarjeta-cabeza', t);
      const alternar = () => {
        const abrir = cuerpo.hidden;
        if (abrir && !rej.children.length) pintarCampos(def.campos, r, rej);
        cuerpo.hidden = !abrir;
        t.classList.toggle('abierta', abrir);
        cab.setAttribute('aria-expanded', String(abrir));
        if (abrir) { abiertos.add(r); llamarVista('resaltar', r + '.' + (def.tituloItem || def.campos[0].c)); } else abiertos.delete(r);
      };
      cab.addEventListener('click', (e) => { if (!e.target.closest('[data-op]')) alternar(); });
      cab.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && e.target === cab) { e.preventDefault(); alternar(); } });
      $$('[data-op]', t).forEach((b) => b.addEventListener('click', () => operar(b.dataset.op, ruta, i, def)));
      cont.appendChild(t);
    });
    if (!def.nuevoArriba) el.appendChild(agregar);
    return el;
  }
  function operar(op, ruta, i, def) {
    const arr = obtener(datos, ruta);
    const eraAbierto = abiertos.has(ruta + '.' + i);
    cambioEstructura(() => {
      abiertos.forEach((k) => { if (k.startsWith(ruta + '.')) abiertos.delete(k); });
      if (op === 'arriba' || op === 'abajo') {
        const j = op === 'arriba' ? i - 1 : i + 1;
        [arr[i], arr[j]] = [arr[j], arr[i]];
        if (eraAbierto) abiertos.add(ruta + '.' + j);
      } else if (op === 'copiar') {
        arr.splice(i + 1, 0, JSON.parse(JSON.stringify(arr[i])));
        abiertos.add(ruta + '.' + (i + 1));
      } else if (op === 'borrar') {
        arr.splice(i, 1);
      }
    });
    if (op === 'borrar') aviso('Se eliminó ' + (def.item ? 'el elemento' : 'un elemento'), '', { texto: 'Deshacer', hacer: () => restaurar(pilaDeshacer, pilaRehacer) });
  }

  // ----- Índice del chat -----
  async function indexar(boton) {
    const g = datos.general;
    boton.disabled = true;
    const texto = boton.textContent;
    boton.textContent = 'Leyendo el PDF…';
    try {
      const r = await pedir('/api/indexar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pdf: g.pdfEdicion, numero: g.numeroEdicion, fecha: g.fechaEdicion }) });
      aviso('Listo: el chat ya conoce la edición (' + r.mensaje + ')', 'ok');
    } catch (e) { if (e.message !== 'sesion') aviso(e.message, 'error'); }
    boton.disabled = false;
    boton.textContent = texto;
  }

  // ---------- Historial ----------
  $('#btn-historial').addEventListener('click', async () => {
    const dlg = $('#dlg-historial'), ol = $('#versiones');
    ol.innerHTML = '<li><span class="ayuda">Cargando…</span></li>';
    dlg.showModal();
    try {
      const lista = await pedir('/api/historial');
      const fmt = new Intl.DateTimeFormat('es-MX', { dateStyle: 'full', timeStyle: 'short' });
      ol.innerHTML = lista.length ? '' : '<li><span class="ayuda">Todavía no hay versiones anteriores. Aparecerán aquí después de guardar.</span></li>';
      lista.forEach((v) => {
        const li = document.createElement('li');
        li.innerHTML = '<span>' + esc(fmt.format(new Date(v.fecha))) + '</span><button type="button" class="btn btn-chico">Cargar esta versión</button>';
        $('button', li).addEventListener('click', async () => {
          try {
            const version = await pedir('/api/historial/' + encodeURIComponent(v.archivo));
            antesDeCambiar(true);
            datos = version;
            dlg.close();
            pintarSecciones(); pintarFormulario(false); redibujar(); pintarEstado();
            aviso('Versión cargada. Revísala y presiona «Guardar y publicar» para conservarla.', '', { texto: 'Deshacer', hacer: () => restaurar(pilaDeshacer, pilaRehacer) });
          } catch (e) { if (e.message !== 'sesion') aviso(e.message, 'error'); }
        });
        ol.appendChild(li);
      });
    } catch (e) { if (e.message !== 'sesion') ol.innerHTML = '<li>' + esc(e.message) + '</li>'; }
  });

  // ---------- Vista previa ----------
  // Dos marcos: la página nueva se dibuja en el oculto y se intercambian cuando ya cargó, sin parpadeo
  const marcos = [$('#vista-1'), $('#vista-2')];
  let activo = 0, temporizador = null, ultimoResaltado = null, generacion = 0;
  const vistaActiva = () => marcos[activo].contentWindow;
  function llamarVista(metodo, arg) {
    if (metodo === 'resaltar') ultimoResaltado = arg;
    try { const v = vistaActiva().EditorVista; return v ? v[metodo](arg) : 0; } catch (e) { return 0; }
  }
  function redibujar() {
    clearTimeout(temporizador);
    if (!enVisual() || !datos) return;
    const gen = ++generacion;
    const sig = marcos[1 - activo];
    let y = 0;
    try { y = vistaActiva().scrollY; } catch (e) {}
    sig.onload = () => setTimeout(() => {
      if (gen !== generacion) return; // ya se pidió otro dibujo más reciente
      try { sig.contentWindow.scrollTo(0, y); } catch (e) {}
      sig.classList.add('activo'); sig.removeAttribute('aria-hidden');
      marcos[activo].classList.remove('activo'); marcos[activo].setAttribute('aria-hidden', 'true');
      activo = 1 - activo;
      if (ultimoResaltado) { try { vistaActiva().EditorVista.resaltar(ultimoResaltado); } catch (e) {} }
    }, 350);
    const html = Plantilla.renderizar(datos, { editor: true, base: RAIZ });
    sig.srcdoc = EN_LINEA ? GestorGitHub.ajustarVista(html) : html;
  }
  const programarRedibujo = (ms) => { clearTimeout(temporizador); temporizador = setTimeout(redibujar, ms || 700); };
  function actualizarVista(ruta, valor, tipo) {
    if (!enVisual()) return;
    let n = 0;
    if (tipo === 'texto' || tipo === 'area') n = llamarVista2('actualizar', ruta, valor, null);
    else if (tipo === 'md') n = llamarVista2('actualizar', ruta, valor, Plantilla.md(valor));
    else if (tipo === 'imagen') n = llamarVista2('actualizar', ruta, valor ? enlace(valor) : '', null);
    // Si el cambio no se pudo aplicar en su lugar (o aparece en otros sitios), se redibuja la página
    if (!n || REPETIDOS.has(ruta)) programarRedibujo();
  }
  function llamarVista2(metodo, a, b, c) {
    try { const v = vistaActiva().EditorVista; return v ? v[metodo](a, b, c) : 0; } catch (e) { return 0; }
  }

  // Lo que la vista previa le pide al gestor (ver cms/editor-vista.js)
  window.GestorVisual = {
    vistaLista() {},
    abrirSeccion(clave) { if (clave && clave !== seccion) abrirSeccion(clave, false); },
    // Clic en un elemento de la página: se abre su campo en el formulario
    seleccionar(ruta) {
      const s = seccionDe(ruta);
      if (!s) return;
      if (pantallaAngosta()) ponerModo('contenido');
      if (s.clave !== seccion) abrirSeccion(s.clave, false);
      ultimoResaltado = ruta;
      // Si el campo está dentro de una tarjeta cerrada, se abre
      const partes = ruta.split('.');
      for (let k = partes.length - 1; k > 0; k--) {
        if (/^\d+$/.test(partes[k])) {
          const t = $('[data-tarjeta="' + partes.slice(0, k + 1).join('.') + '"]');
          if (t && !t.classList.contains('abierta')) $('.tarjeta-cabeza', t).click();
        }
      }
      const inp = $('[data-ruta="' + ruta + '"]');
      if (!inp) return;
      const det = inp.closest('details');
      const objetivo = det ? det.closest('.campo') : inp;
      objetivo.scrollIntoView({ block: 'center', behavior: 'smooth' });
      const foco = det ? $('.miniatura', objetivo) : inp;
      foco.classList.remove('destello'); void foco.offsetWidth; foco.classList.add('destello');
      if (!det) inp.focus({ preventScroll: true });
    },
    // Texto escrito directamente sobre la página
    editar(ruta, valor, final) {
      antesDeCambiar();
      fijar(datos, ruta, valor);
      const inp = $('[data-ruta="' + ruta + '"]');
      if (inp && inp !== document.activeElement) inp.value = valor;
      $$('[data-titulo-de="' + ruta + '"]').forEach((el) => { el.textContent = valor || 'Sin título'; });
      pintarEstado();
      if (final && REPETIDOS.has(ruta)) programarRedibujo(100);
    }
  };

  // ---------- Arranque ----------
  pedir('/api/sesion').then((r) => (r.ok ? iniciar() : mostrarEntrada())).catch((e) => mostrarEntrada(EN_LINEA ? e.message : 'No hay conexión con el servidor. ¿Está abierto servidor.js?'));
})();
