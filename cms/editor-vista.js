// Corre dentro de la vista previa del gestor (no en el sitio público).
// Clic en un texto o imagen: abre su campo en el formulario. Doble clic en un texto: se escribe ahí mismo.
(function () {
  const gestor = window.parent && window.parent.GestorVisual;
  if (!gestor) return;
  // Secciones de la página → secciones del gestor
  const SECCIONES = { destacadas: 'destacadas', radio: 'radio', edicion: 'edicion', extra: 'extra', redes: 'redes', historia: 'historia', pie: 'pie' };

  // Etiqueta flotante que indica qué se puede hacer con el elemento señalado
  const pista = document.createElement('div');
  pista.className = 'ev-pista';
  document.body.appendChild(pista);
  let editando = null;

  function mostrarPista(el) {
    const r = el.getBoundingClientRect();
    pista.textContent = el.dataset.tipo === 'imagen' ? 'Clic: cambiar imagen' : el.dataset.tipo === 'md' ? 'Clic: editar texto' : 'Clic: editar · Doble clic: escribir aquí';
    pista.style.top = Math.max(4, r.top - 26) + 'px';
    pista.style.left = Math.max(4, Math.min(r.left, innerWidth - 230)) + 'px';
    pista.classList.add('ev-visible');
  }
  document.addEventListener('mouseover', (e) => {
    const el = e.target.closest('[data-campo]');
    if (el && el !== editando) mostrarPista(el); else if (!el) pista.classList.remove('ev-visible');
  });
  document.addEventListener('scroll', () => pista.classList.remove('ev-visible'), true);

  // En la vista previa ningún enlace navega ni ningún formulario se envía
  document.addEventListener('click', (e) => {
    if (e.target.closest('[contenteditable]')) return;
    const enlace = e.target.closest('a');
    if (enlace) e.preventDefault();
    const el = e.target.closest('[data-campo]');
    if (el) { e.preventDefault(); e.stopPropagation(); marcar(el.dataset.campo); gestor.seleccionar(el.dataset.campo); return; }
    // Clic en una zona sin campo propio: se abre la sección
    if (enlace || e.target.closest('button')) return;
    const sec = e.target.closest('section[id], footer, header');
    if (sec) gestor.abrirSeccion(sec.tagName === 'HEADER' ? 'general' : sec.tagName === 'FOOTER' ? 'pie' : SECCIONES[sec.id]);
  }, true);
  document.addEventListener('submit', (e) => e.preventDefault(), true);

  document.addEventListener('dblclick', (e) => {
    const el = e.target.closest('[data-campo]');
    if (!el || el.dataset.tipo) return; // imágenes y textos con formato se editan en el formulario
    e.preventDefault();
    empezarEdicion(el);
  });
  function empezarEdicion(el) {
    if (editando) terminarEdicion();
    editando = el;
    pista.classList.remove('ev-visible');
    try { el.contentEditable = 'plaintext-only'; } catch (er) { el.contentEditable = 'true'; }
    if (el.contentEditable !== 'plaintext-only') el.contentEditable = 'true';
    el.focus();
    // Selecciona todo el texto para reemplazarlo de inmediato
    const rango = document.createRange(); rango.selectNodeContents(el);
    const sel = getSelection(); sel.removeAllRanges(); sel.addRange(rango);
  }
  function terminarEdicion() {
    if (!editando) return;
    const el = editando; editando = null;
    el.removeAttribute('contenteditable');
    gestor.editar(el.dataset.campo, el.textContent.replace(/\s+/g, ' ').trim(), true);
  }
  document.addEventListener('input', (e) => {
    if (e.target === editando) {
      const valor = editando.textContent.replace(/\s+/g, ' ');
      // Los demás lugares donde aparece el mismo campo se actualizan al momento
      document.querySelectorAll('[data-campo="' + editando.dataset.campo + '"]').forEach((o) => { if (o !== editando) o.textContent = valor; });
      gestor.editar(editando.dataset.campo, valor.trim(), false);
    }
  });
  document.addEventListener('keydown', (e) => {
    if (!editando) return;
    if (e.key === 'Enter' || e.key === 'Escape') { e.preventDefault(); editando.blur(); }
  });
  document.addEventListener('focusout', (e) => { if (e.target === editando) terminarEdicion(); });

  function marcar(campo) {
    document.querySelectorAll('.ev-activo').forEach((x) => x.classList.remove('ev-activo'));
    document.querySelectorAll('[data-campo="' + campo + '"]').forEach((x) => x.classList.add('ev-activo'));
  }

  // Lo que el gestor puede pedirle a la vista previa
  window.EditorVista = {
    // Cambia un texto o imagen sin redibujar toda la página. Devuelve cuántos elementos cambió.
    actualizar(campo, valor, html) {
      const els = document.querySelectorAll('[data-campo="' + campo + '"]');
      els.forEach((el) => {
        if (el === editando) return;
        if (el.dataset.tipo === 'imagen') el.src = valor;
        else if (html != null) el.innerHTML = html;
        else el.textContent = valor;
      });
      return els.length;
    },
    // Señala el elemento del campo que se está editando en el formulario
    resaltar(campo) {
      marcar(campo);
      const m = /^destacadas\.notas\.(\d+)\./.exec(campo);
      if (m && window.carruselIr) window.carruselIr(Number(m[1]));
      const el = document.querySelector('[data-campo="' + campo + '"]');
      if (!el) return;
      const r = el.getBoundingClientRect();
      if (r.top < 60 || r.bottom > innerHeight - 40) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    },
    irA(selector) {
      const el = document.querySelector(selector);
      if (el) el.scrollIntoView({ block: 'start', behavior: 'smooth' });
    },
    limpiar() { marcar('__ninguno__'); }
  };
  gestor.vistaLista(window);
})();
