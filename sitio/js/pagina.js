  // Fecha actual en español (México)
  try {
    const f = new Intl.DateTimeFormat('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
    document.getElementById('fecha-hoy').textContent = f;
  } catch (e) {}
  // Botón discreto «Editar»: aparece en la computadora de la redacción (archivo abierto con doble clic o localhost)
  // y donde la página la sirva el gestor. En un hosting sin gestor queda oculto para los visitantes.
  (function () {
    const lapiz = document.getElementById('abrir-editor');
    if (!lapiz) return;
    const mostrar = () => { lapiz.hidden = false; lapiz.style.display = 'inline-flex'; };
    const local = location.protocol === 'file:' || /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
    // Abierto como archivo, el editor solo existe en el servidor local
    if (location.protocol === 'file:') lapiz.href = 'http://localhost:3000/admin';
    if (local) { mostrar(); return; }
    fetch('api/sesion', { credentials: 'same-origin' })
      .then((r) => (r.ok ? r.json() : null))
      .then((s) => { if (s && 'ok' in s) mostrar(); })
      .catch(() => {});
  })();
  // Menú móvil
  const btn = document.getElementById('btn-menu'), menu = document.getElementById('menu');
  btn.addEventListener('click', () => {
    const abierto = menu.classList.toggle('hidden') === false;
    btn.setAttribute('aria-expanded', String(abierto));
  });
  // ============ ANIMACIONES ============
  // Cintillo: se duplica la lista para que el desplazamiento sea un bucle continuo (la copia queda oculta a lectores de pantalla)
  (function () {
    const cinta = document.querySelector('.ticker-cinta');
    if (!cinta) return;
    Array.from(cinta.children).forEach((li) => {
      const copia = li.cloneNode(true);
      copia.setAttribute('aria-hidden', 'true');
      copia.querySelectorAll('a').forEach((a) => a.tabIndex = -1);
      cinta.appendChild(copia);
    });
  })();
  // Notas que "se imprimen" al entrar en pantalla, en cascada
  (function () {
    if (!document.documentElement.classList.contains('js-anim')) return;
    const piezas = document.querySelectorAll([
      'main > section > figure', 'main > section > div:not(.grid)', 'main > section > h2', 'main > section > p',
      '#edicion aside', '#articulos > article', '#articulos > .grid > article', '#articulos > div:last-child li',
      '#extra .grid > article > *', '#extra .grid > div', '#redes .grid > div', '#historia li'
    ].join(','));
    piezas.forEach((el) => el.classList.add('revelar'));
    if (!('IntersectionObserver' in window)) { piezas.forEach((el) => el.classList.add('visto')); return; }
    const obs = new IntersectionObserver((entradas) => {
      entradas.filter((e) => e.isIntersecting).forEach((e, i) => {
        e.target.style.transitionDelay = (i * 90) + 'ms';
        e.target.classList.add('visto');
        obs.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: .12 });
    // Se empieza a observar cuando el periódico queda abierto, para que lo visible se imprima después
    const observar = () => piezas.forEach((el) => obs.observe(el));
    if (document.documentElement.classList.contains('abierto')) observar();
    else document.addEventListener('periodico-abierto', observar, { once: true });
  })();

