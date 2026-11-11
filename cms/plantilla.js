// Plantilla de la portada: convierte datos/contenido.json en el HTML del sitio.
// La usan el servidor (para generar index.html al guardar) y el gestor visual (para la vista previa).
// Con { editor: true } marca cada texto con data-campo="ruta.del.campo" para poder editarlo desde la vista.
(function (raiz) {
  const esc = (t) => String(t == null ? '' : t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // Enlaces: se descartan los que ejecutarían código
  const url = (u) => (/^\s*(javascript|data|vbscript):/i.test(u || '') ? '#' : esc(u || '#'));
  const externo = (u) => (/^https?:\/\//i.test(u || '') ? ' target="_blank" rel="noopener"' : '');
  // Texto con formato sencillo: **negrita** y [texto](enlace)
  const md = (t) => esc(t)
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-tinta">$1</strong>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, txt, u) => '<a href="' + url(u.replace(/&amp;/g, '&')) + '"' + externo(u) + ' class="titular-link">' + txt + '</a>');
  // Iniciales para el círculo del columnista: se saltan títulos como «P.» o «Fr.»
  const iniciales = (autor) => (String(autor || '').split(/\s+/).filter((w) => /^[A-ZÁÉÍÓÚÑ]/.test(w) && !w.endsWith('.')).slice(0, 2).map((w) => w[0]).join('')) || '·';
  const visible = (s) => s && s.visible !== false;
  // «COMUNIDAD CRISTIANA» → «Comunidad Cristiana»
  const capitalizar = (t) => String(t || '').toLowerCase().replace(/(^|\s)(\S)/g, (m, s, l) => s + l.toUpperCase());

  function renderizar(d, op) {
    op = op || {};
    const ed = !!op.editor;
    // Atributo que conecta cada elemento con su campo del formulario
    const c = (ruta, tipo) => (ed ? ' data-campo="' + ruta + '"' + (tipo ? ' data-tipo="' + tipo + '"' : '') : '');
    const g = d.general || {};
    const pdf = g.pdfEdicion || '#';
    const entrada = g.mostrarEntrada !== false && !ed;
    const svgMarca = '<svg width="12" height="16" viewBox="0 0 34 40"><rect x="15" width="4" height="40" fill="#fff"/><rect x="5" y="11" width="24" height="4" fill="#fff"/></svg>';
    const marcaRed = '<span class="w-8 h-8 rounded-full bg-carmesi flex items-center justify-center shrink-0" aria-hidden="true">' + svgMarca + '</span>';

    // Configuración que leen los scripts del sitio (sitio/js/*.js)
    const r = d.radio || {}, ch = d.chat || {}, fb = (d.redes || {}).facebook || {};
    const SITIO = {
      editor: ed,
      facebook: { pagina: g.facebook || '', publicaciones: (fb.publicaciones || []).map((p) => p.enlace).filter(Boolean) },
      radio: { stream: r.stream || '', nombre: r.nombre || 'la radio', logo: r.logo || '' },
      chat: {
        sumario: (ch.sumario || []).map((s) => [s.titulo, s.pagina, Number(s.hoja) || 1]),
        sugerencias: (ch.sugerencias || []).map((s) => [s.texto, s.busqueda || s.texto])
      }
    };
    const json = (o) => JSON.stringify(o).replace(/</g, '\\u003c');

    const h = [];
    h.push(`<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
${op.base ? '<base href="' + esc(op.base) + '">' : ''}
<title>${esc(g.tituloPagina)}</title>
<link rel="icon" type="image/png" href="${url(g.emblema)}">
<meta name="description" content="${esc(g.descripcion)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700&family=Literata:ital,opsz,wght@0,7..72,400;0,7..72,600;0,7..72,700;1,7..72,400&family=Source+Sans+3:wght@400;600;700&display=swap">
<link rel="stylesheet" href="sitio/estilos.css">
<script>
  window.SITIO = ${json(SITIO)};
  // Activa las animaciones antes del primer pintado (evita el parpadeo del contenido)
  try { if (!SITIO.editor && !matchMedia('(prefers-reduced-motion: reduce)').matches) document.documentElement.classList.add('js-anim'); } catch (e) {}
  ${entrada ? '' : "document.documentElement.classList.add('abierto');"}
</script>
<script src="https://cdn.tailwindcss.com/3.4.17"></script>
<script>
  tailwind.config = {
    theme: {
      extend: {
        colors: {
          papel: 'var(--papel)', superficie: 'var(--superficie)', tinta: 'var(--tinta)', 'tinta-suave': 'var(--tinta-suave)',
          carmesi: 'var(--carmesi)', 'carmesi-texto': 'var(--carmesi-texto)', 'rosa-suave': 'var(--rosa-suave)',
          'sobre-carmesi': 'var(--sobre-carmesi)', teal: 'var(--teal)', 'teal-texto': 'var(--teal-texto)', linea: 'var(--linea)'
        },
        fontFamily: { mancheta: 'var(--font-mancheta)', lectura: 'var(--font-lectura)', ui: 'var(--font-ui)' }
      }
    }
  };
</script>
${ed ? '<link rel="stylesheet" href="cms/editor-vista.css">' : ''}
</head>
<body>
`);

    // ============ ENTRADA: PERIÓDICO ENROLLADO ============
    if (entrada) {
      h.push(`<div id="cubierta" class="cubierta" aria-hidden="true">
  <p class="cubierta-texto cubierta-arriba etiqueta">Edición N.º ${esc(g.numeroEdicion)} · ${esc(g.fechaEdicion)}</p>
  <p class="cubierta-texto cubierta-pista etiqueta"><span>Haz clic para abrir el periódico ↓</span></p>
</div>
<button id="rollo" class="rollo meciendo" type="button" aria-label="Abrir el periódico">
  <span class="rollo-cuerpo"><span class="rollo-mancheta" aria-hidden="true">${esc(g.mancheta)}</span></span>
  <span class="rollo-liga" aria-hidden="true"></span>
</button>
<script src="sitio/js/entrada.js"></script>
`);
    }

    if (g.aviso && g.aviso.visible) {
      h.push(`<div class="bg-superficie text-tinta-suave text-sm px-4 py-2 text-center"${c('general.aviso.texto', 'md')}>${md(g.aviso.texto)}</div>\n`);
    }

    // ============ HEADER ============
    const ut = d.ultimaHora || {};
    h.push(`<div class="hoja">

<div class="folio folio-arriba px-4 md:px-0 pt-3 md:pt-0">
  <span${c('general.ciudad')}>${esc(g.ciudad)}</span>
  <span class="num">Edición N.º <span${c('general.numeroEdicion')}>${esc(g.numeroEdicion)}</span> · <span${c('general.fechaEdicion')}>${esc(g.fechaEdicion)}</span></span>
  <span class="hidden sm:inline"${c('general.epoca')}>${esc(g.epoca)}</span>
</div>

<header>
  <div class="bg-teal text-sobre-carmesi">
    <div class="max-w-6xl mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm">
      <p><span id="fecha-hoy" class="capitalize">Hoy</span> · <span class="font-semibold"${c('general.aniversario')}>${esc(g.aniversario)}</span></p>
      <nav aria-label="Redes sociales" class="flex items-center gap-3">
        <a href="${url(g.facebook)}"${externo(g.facebook)} class="hover:opacity-80" aria-label="Facebook">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M14 8h3V4h-3c-2.8 0-4.5 1.8-4.5 4.6V11H7v4h2.5v9h4v-9h3l.6-4h-3.6V8.9c0-.6.3-.9.9-.9z"/></svg>
        </a>
        <a href="${url(g.instagram)}"${externo(g.instagram)} class="hover:opacity-80" aria-label="Instagram">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>
        </a>
        <a href="${url(g.tiktok)}"${externo(g.tiktok)} class="hover:opacity-80" aria-label="TikTok">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16.5 3c.4 2.3 1.9 3.8 4.2 4v3.3c-1.6 0-3-.5-4.2-1.3v6.4a5.6 5.6 0 1 1-5.6-5.6c.3 0 .6 0 .9.1v3.4a2.3 2.3 0 1 0 1.5 2.1V3h3.2z"/></svg>
        </a>
        <span class="w-px h-4 bg-sobre-carmesi opacity-40 mx-1"></span>
        <a href="${url(g.enlaceSuscribete)}" class="font-semibold underline-offset-2 hover:underline">Suscríbete</a>${ed ? '' : `
        <a id="abrir-editor" href="admin" hidden class="items-center gap-1 px-2 py-0.5 rounded-full border border-white/50 text-xs font-semibold hover:bg-white hover:text-[color:var(--teal-texto)] transition-colors" title="Abrir el editor del sitio">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>Editar
        </a>`}
      </nav>
    </div>
  </div>

  <div class="bg-carmesi text-sobre-carmesi">
    <div class="max-w-6xl mx-auto px-4">
      <div class="py-6 md:py-8 text-center">
        <a href="#" class="inline-flex items-center gap-3 sm:gap-5">
          <img src="${url(g.emblema)}" alt="" class="emblema h-16 sm:h-24 md:h-28 w-auto shrink-0"${c('general.emblema', 'imagen')}>
          <span class="flex flex-col items-start gap-2 text-left">
            <span class="mancheta font-mancheta text-3xl sm:text-5xl md:text-6xl font-bold tracking-wide leading-none"${c('general.mancheta')}>${esc(g.mancheta)}</span>
            <span class="lema etiqueta opacity-90"${c('general.lema')}>${esc(g.lema)}</span>
          </span>
        </a>
      </div>

      <div class="flex items-center justify-between md:justify-center py-2 border-t border-white/30">
        <button id="btn-menu" class="md:hidden etiqueta py-2" aria-expanded="false" aria-controls="menu">☰ Menú</button>
        <nav id="menu" aria-label="Principal" class="hidden md:block w-full md:w-auto">
          <ul class="flex flex-col md:flex-row md:flex-wrap md:items-center md:justify-center md:whitespace-nowrap gap-1 md:gap-x-4 lg:gap-x-7 py-2 md:py-0 etiqueta">
${(d.menu || []).map((m, i) => `            <li><a class="block py-2 hover:opacity-75" href="${url(m.enlace)}"${externo(m.enlace)}${c('menu.' + i + '.texto')}>${esc(m.texto)}</a></li>`).join('\n')}
          </ul>
        </nav>
        <a href="#" class="md:hidden etiqueta" aria-label="Buscar">Buscar</a>
      </div>
    </div>
  </div>
`);
    if (visible(ut) && (ut.notas || []).length) {
      h.push(`
  <div class="ticker border-b border-linea bg-papel" role="region" aria-label="${esc(ut.titulo)}">
    <div class="max-w-6xl mx-auto px-4 flex items-stretch">
      <p class="etiqueta bg-carmesi text-sobre-carmesi px-3 py-2 shrink-0 flex items-center gap-2"><span class="punto-vivo" aria-hidden="true"></span><span${c('ultimaHora.titulo')}>${esc(ut.titulo)}</span></p>
      <div class="ticker-ventana overflow-hidden flex-1 min-w-0 py-2 pl-4 font-lectura text-[0.95rem]">
        <ul class="ticker-cinta">
${ut.notas.map((n, i) => `          <li><a href="${url(n.enlace)}"${externo(n.enlace)} class="titular-link"${c('ultimaHora.notas.' + i + '.texto')}>${esc(n.texto)}</a></li>`).join('\n')}
        </ul>
      </div>
    </div>
  </div>
`);
    }
    h.push(`</header>

<main class="max-w-6xl mx-auto px-4">
`);

    // ============ NOTICIAS PRINCIPALES (CARRUSEL) ============
    const ds = d.destacadas || {}, notas = ds.notas || [];
    if (visible(ds) && notas.length) {
      h.push(`
  <section id="destacadas" class="carrusel py-8 md:py-12 border-b border-linea" aria-roledescription="carrusel" aria-labelledby="principal"${ed ? ' data-seccion="destacadas"' : ''}>
    <h1 id="principal" class="sr-only">Noticias principales</h1>
    <div class="relative">
    <div class="overflow-hidden">
      <div class="carrusel-pista">
${notas.map((n, i) => {
  const p = 'destacadas.notas.' + i + '.';
  return `
        <article class="diapositiva grid md:grid-cols-12 gap-6 md:gap-10" role="group" aria-roledescription="diapositiva" aria-label="${i + 1} de ${notas.length}">
          <figure class="md:col-span-7 min-w-0">
            <img src="${url(n.imagen)}" alt="${esc(n.alt)}" class="w-full max-w-full aspect-[3/2] object-cover rounded-sm bg-superficie"${c(p + 'imagen', 'imagen')}>
            <figcaption class="text-sm text-tinta-suave mt-2"${c(p + 'pie')}>${esc(n.pie)}</figcaption>
          </figure>
          <div class="md:col-span-5 md:pr-8 flex flex-col justify-center gap-4 min-w-0">
            <p class="etiqueta text-carmesi-texto"${c(p + 'etiqueta')}>${esc(n.etiqueta)}</p>
            <h2 class="sin-barra font-lectura text-3xl md:text-[2.6rem] leading-tight font-bold">
              <a href="${url(n.enlace)}"${externo(n.enlace)} class="titular-link"${c(p + 'titulo')}>${esc(n.titulo)}</a>
            </h2>
            <p class="font-lectura text-lg text-tinta-suave"${c(p + 'resumen')}>${esc(n.resumen)}</p>
            <p class="text-sm text-tinta-suave">${n.autor ? `Por <strong class="text-tinta"${c(p + 'autor')}>${esc(n.autor)}</strong> · ` : ''}<span class="num text-teal-texto font-semibold"${c(p + 'fecha')}>${esc(n.fecha)}</span>${n.paginas ? ` · <span${c(p + 'paginas')}>${esc(n.paginas)}</span>` : ''}</p>
            <div class="flex flex-wrap gap-3 pt-1">
              <a href="${url(n.enlace)}"${externo(n.enlace)} class="btn px-5 py-3 font-semibold rounded-sm"${c(p + 'textoBoton')}>${esc(n.textoBoton || 'Leer nota completa')}</a>
              <a href="${url(g.facebook)}" target="_blank" rel="noopener" class="px-5 py-3 font-semibold text-carmesi-texto border border-carmesi rounded-sm hover:bg-rosa-suave">Compartir</a>
            </div>
          </div>
        </article>`;
}).join('\n')}

      </div>
    </div>

    <button type="button" class="flecha flecha-izq" data-mover="-1" aria-label="Noticia anterior"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button>
    <button type="button" class="flecha flecha-der" data-mover="1" aria-label="Noticia siguiente"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg></button>
    </div>

    <div class="mt-6 flex items-end justify-between gap-4 border-t-2 border-[color:var(--tinta)] pt-3">
      <div class="flex gap-4 sm:gap-6 min-w-0" role="group" aria-label="Elegir noticia">
${notas.map((n, i) => `        <button type="button" class="punto" data-ir="${i}" aria-label="Noticia ${i + 1}: ${esc(n.nombreCorto)}"><span class="num">${String(i + 1).padStart(2, '0')}</span><span class="hidden sm:inline"> ${esc(n.nombreCorto)}</span><span class="barra" aria-hidden="true"></span></button>`).join('\n')}
      </div>
      <div class="flex gap-2 shrink-0">
        <button type="button" class="control" id="carrusel-pausa" aria-label="Pausar el carrusel">
          <svg class="icono-pausa" width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true"><rect x="2" y="1" width="3.5" height="12"/><rect x="8.5" y="1" width="3.5" height="12"/></svg>
          <svg class="icono-play" width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true"><path d="M3 1l10 6-10 6z"/></svg>
        </button>
      </div>
    </div>
  </section>
  <script src="sitio/js/carrusel.js"></script>
`);
    }

    // ============ RADIO EN VIVO ============
    if (visible(r)) {
      // La aguja del sintonizador se coloca según la frecuencia, en la escala de 88 a 108 FM
      const f = parseFloat(r.frecuencia);
      const pos = isNaN(f) ? 50 : Math.max(0, Math.min(100, (f - 88) / 20 * 100));
      h.push(`
  <section id="radio" aria-labelledby="t-radio" class="py-8 md:py-10 border-b border-linea scroll-mt-4">
    <div class="radio" data-estado="detenida">
      <div class="flex flex-col md:flex-row md:items-center gap-5 md:gap-8">
        <div class="flex items-center gap-4 min-w-0 md:flex-1">
          <img src="${url(r.logo)}" width="256" height="256" alt="Logotipo de ${esc(r.nombre)}" class="radio-logo"${c('radio.logo', 'imagen')}>
          <div class="min-w-0">
            <p class="etiqueta" style="color:var(--radio-ambar)"${c('radio.etiqueta')}>${esc(r.etiqueta)}</p>
            <h2 id="t-radio" class="sin-barra font-lectura text-2xl md:text-3xl font-bold leading-tight"${c('radio.nombre')}>${esc(r.nombre)}</h2>
            <p class="text-sm opacity-90"${c('radio.descripcion')}>${esc(r.descripcion)}</p>
          </div>
        </div>
        <div class="flex items-center gap-4 shrink-0">
          <button type="button" id="radio-play" class="radio-play" aria-label="Escuchar ${esc(r.nombre)} en vivo">
            <svg class="i-play" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4l14 8-14 8z"/></svg>
            <svg class="i-pausa" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="5" y="4" width="5" height="16"/><rect x="14" y="4" width="5" height="16"/></svg>
            <span class="i-carga" aria-hidden="true"></span>
          </button>
          <div class="flex flex-col gap-1.5">
            <p class="radio-estado etiqueta flex items-center gap-2" role="status"><span class="radio-eq" aria-hidden="true"><i></i><i></i><i></i></span><span id="radio-estado">Toca para escuchar</span></p>
            <label class="flex items-center gap-2 text-sm"><span class="sr-only">Volumen</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 9v6h4l6 5V4L7 9zm13 3a4 4 0 0 0-2-3.5v7a4 4 0 0 0 2-3.5z"/></svg>
              <input type="range" id="radio-volumen" class="radio-volumen" min="0" max="1" step="0.05" value="0.8">
            </label>
          </div>
        </div>
      </div>

      <div class="radio-dial" aria-hidden="true">
        <span class="radio-marcas"></span><span class="radio-marcas-fin"></span>
        <span class="radio-mhz num" style="left:0;transform:none">88</span>
        <span class="radio-mhz num" style="left:25%">93</span>
        <span class="radio-mhz num" style="left:75%">103</span>
        <span class="radio-mhz num" style="left:100%;transform:translateX(-100%)">108</span>
        <span class="radio-aguja" style="left:${pos}%"></span>
        <span class="radio-sintonia num" style="left:${pos}%"${c('radio.frecuencia')}>${esc(r.frecuencia)} FM</span>
      </div>

      <p id="radio-ayuda" class="text-sm opacity-90">¿Prefieres otra opción? <a class="radio-enlace" href="${url(r.sitioOficial)}" target="_blank" rel="noopener">Sitio oficial</a>${r.tunein ? ` · <a class="radio-enlace" href="${url(r.tunein)}" target="_blank" rel="noopener">TuneIn</a>` : ''}</p>
      <audio id="radio-audio" preload="none"></audio>
    </div>
  </section>
`);
    }

    // ============ EDICIÓN DE LA SEMANA ============
    const e = d.edicion || {};
    if (visible(e)) {
      const ev = e.evangelio || {};
      const arts = e.articulos || [];
      h.push(`
  <section id="edicion" aria-labelledby="t-edicion" class="py-10 md:py-14 border-b border-linea">
    <div class="flex flex-wrap items-baseline justify-between gap-2 mb-8">
      <h2 id="t-edicion" class="font-lectura text-2xl md:text-3xl font-bold"${c('edicion.titulo')}>${esc(e.titulo)}</h2>
      <a href="${url(e.enlaceAnteriores)}" class="text-carmesi-texto font-semibold hover:underline">Ver ediciones anteriores →</a>
    </div>

    <div class="grid md:grid-cols-12 gap-8 md:gap-10">
      <aside class="md:col-span-4 min-w-0">
        <div class="bg-superficie p-5 rounded-sm flex flex-col gap-4">
          <a href="${url(pdf)}" class="block">
            <img src="${url(e.portada)}" alt="${esc(e.altPortada)}" class="w-full max-w-full border border-linea shadow-sm bg-papel"${c('edicion.portada', 'imagen')}>
          </a>
          <div>
            <p class="etiqueta text-teal-texto">Edición N.º ${esc(g.numeroEdicion)} · ${esc(g.epoca)}</p>
            <p class="font-lectura font-semibold text-lg num"${c('general.fechaEdicion')}>${esc(g.fechaEdicion)}</p>
            <p class="text-sm text-tinta-suave"${c('edicion.liturgia')}>${esc(e.liturgia)}</p>
          </div>
          <div class="flex flex-col gap-2">
            <a href="${url(pdf)}" download class="btn text-center px-4 py-3 font-semibold rounded-sm">Descargar edición PDF${e.pesoPdf ? ` <span class="font-normal opacity-85">(${esc(e.pesoPdf)})</span>` : ''}</a>
            <a href="#articulos" class="text-center px-4 py-3 font-semibold text-carmesi-texto border border-carmesi rounded-sm bg-papel hover:bg-rosa-suave">Leer artículos en línea</a>
          </div>
        </div>
      </aside>

      <div id="articulos" class="md:col-span-8 min-w-0 flex flex-col gap-8">
${visible(ev) ? `        <article class="bg-rosa-suave p-5 rounded-sm">
          <p class="etiqueta text-carmesi-texto mb-1"${c('edicion.evangelio.etiqueta')}>${esc(ev.etiqueta)}</p>
          <h3 class="font-lectura text-xl font-semibold"><a href="${url(ev.enlace)}" class="titular-link"${c('edicion.evangelio.titulo')}>${esc(ev.titulo)}</a></h3>
          <p class="font-lectura text-tinta-suave mt-2"${c('edicion.evangelio.texto', 'md')}>${md(ev.texto)}</p>
          <p class="text-sm text-tinta-suave mt-1"${c('edicion.evangelio.nota')}>${esc(ev.nota)}</p>
        </article>
` : ''}
        <div class="grid sm:grid-cols-2 gap-x-8 gap-y-7">
${arts.map((a, i) => {
  const p = 'edicion.articulos.' + i + '.';
  return a.imagen ? `          <article class="flex flex-col gap-2 min-w-0 sm:row-span-2">
            <img src="${url(a.imagen)}" alt="${esc(a.alt)}" class="w-full max-w-full aspect-[16/9] object-cover rounded-sm bg-superficie"${c(p + 'imagen', 'imagen')}>
            <p class="etiqueta text-carmesi-texto"${c(p + 'etiqueta')}>${esc(a.etiqueta)}</p>
            <h3 class="font-lectura text-lg font-semibold leading-snug"><a href="${url(a.enlace)}"${externo(a.enlace)} class="titular-link"${c(p + 'titulo')}>${esc(a.titulo)}</a></h3>
            <p class="text-sm text-tinta-suave"${c(p + 'resumen')}>${esc(a.resumen)}</p>
          </article>` : `          <article class="flex flex-col gap-1 min-w-0">
            <p class="etiqueta text-carmesi-texto"${c(p + 'etiqueta')}>${esc(a.etiqueta)}</p>
            <h3 class="font-lectura text-lg font-semibold leading-snug"><a href="${url(a.enlace)}"${externo(a.enlace)} class="titular-link"${c(p + 'titulo')}>${esc(a.titulo)}</a></h3>
            <p class="text-sm text-tinta-suave"${c(p + 'resumen')}>${esc(a.resumen)}</p>
          </article>`;
}).join('\n')}
        </div>
${(e.columnas || []).length ? `
        <div class="border-t border-linea pt-6">
          <p class="etiqueta text-tinta-suave mb-4"${c('edicion.tituloColumnas')}>${esc(e.tituloColumnas)}</p>
          <ul class="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
${e.columnas.map((col, i) => {
  const p = 'edicion.columnas.' + i + '.';
  return `            <li class="flex gap-3 items-start min-w-0">
              <span class="w-11 h-11 shrink-0 rounded-full foto-teal flex items-center justify-center text-sm font-bold" style="color:#fff" aria-hidden="true">${esc(iniciales(col.autor))}</span>
              <div class="min-w-0"><p class="text-sm font-semibold"${c(p + 'autor')}>${esc(col.autor)}</p><a href="${url(col.enlace)}"${externo(col.enlace)} class="font-lectura text-[0.95rem] leading-snug titular-link"${c(p + 'titulo')}>${esc(col.titulo)}</a></div>
            </li>`;
}).join('\n')}
          </ul>
        </div>` : ''}
      </div>
    </div>
  </section>
`);
    }

    // ============ MÁS ALLÁ DEL IMPRESO ============
    const x = d.extra || {};
    if (visible(x)) {
      const cb = x.cobertura || {};
      h.push(`
  <section id="extra" aria-labelledby="t-extra" class="py-10 md:py-14 border-b border-linea">
    <div class="flex flex-wrap items-end justify-between gap-3 mb-8">
      <div>
        <p class="etiqueta text-teal-texto mb-1"${c('extra.etiqueta')}>${esc(x.etiqueta)}</p>
        <h2 id="t-extra" class="font-lectura text-2xl md:text-3xl font-bold"${c('extra.titulo')}>${esc(x.titulo)}</h2>
        <p class="text-tinta-suave mt-1 max-w-2xl"${c('extra.subtitulo')}>${esc(x.subtitulo)}</p>
      </div>
      <div class="flex flex-wrap gap-2 text-sm" role="list" aria-label="Filtrar por tipo">
${(x.filtros || []).map((fi, i) => `        <span role="listitem" class="px-3 py-1 rounded-full ${i === 0 ? 'bg-carmesi text-sobre-carmesi font-semibold' : 'border border-linea'}"${c('extra.filtros.' + i + '.texto')}>${esc(fi.texto)}</span>`).join('\n')}
      </div>
    </div>

    <div class="grid md:grid-cols-3 gap-8">
      <article class="md:col-span-2 grid sm:grid-cols-2 gap-5 min-w-0">
        <figure id="galeria" class="min-w-0">
          <img src="${url(cb.imagen)}" alt="${esc(cb.alt)}" class="w-full max-w-full aspect-[4/3] object-cover rounded-sm bg-superficie"${c('extra.cobertura.imagen', 'imagen')}>
          <figcaption class="text-xs text-tinta-suave mt-1"${c('extra.cobertura.pie')}>${esc(cb.pie)}</figcaption>
        </figure>
        <div class="flex flex-col gap-2 min-w-0">
          <p class="etiqueta text-carmesi-texto"${c('extra.cobertura.etiqueta')}>${esc(cb.etiqueta)}</p>
          <h3 class="font-lectura text-2xl font-semibold leading-snug"><a href="${url(cb.enlace)}"${externo(cb.enlace)} class="titular-link"${c('extra.cobertura.titulo')}>${esc(cb.titulo)}</a></h3>
          <p class="text-tinta-suave text-[0.95rem]"${c('extra.cobertura.resumen')}>${esc(cb.resumen)}</p>
          <p class="text-sm text-teal-texto font-semibold num"${c('extra.cobertura.paginas')}>${esc(cb.paginas)}</p>
        </div>
      </article>

      <div class="min-w-0">
        <p class="etiqueta text-tinta-suave mb-3"${c('extra.tituloAlDia')}>${esc(x.tituloAlDia)}</p>
        <ol class="flex flex-col divide-y divide-[color:var(--linea)] border-y border-linea">
${(x.alDia || []).map((n, i) => `          <li class="py-3 flex gap-4"><span class="num text-sm font-semibold text-teal-texto w-14 shrink-0"${c('extra.alDia.' + i + '.fecha')}>${esc(n.fecha)}</span><a href="${url(n.enlace)}"${externo(n.enlace)} class="font-lectura leading-snug titular-link"${c('extra.alDia.' + i + '.texto')}>${esc(n.texto)}</a></li>`).join('\n')}
        </ol>
      </div>
    </div>
  </section>
`);
    }

    // ============ REDES SOCIALES ============
    const rd = d.redes || {};
    if (visible(rd)) {
      const ig = rd.instagram || {}, tk = rd.tiktok || {};
      // Sin fotos cargadas se muestran recuadros de color, como en el prototipo
      const igFotos = (ig.fotos || []).filter((f) => f.imagen);
      const tkFotos = (tk.fotos || []).filter((f) => f.imagen);
      const cuadro = (i, extra) => `<div class="${i % 2 ? 'foto-teal' : 'foto'} ${extra}"></div>`;
      h.push(`
  <section id="redes" aria-labelledby="t-redes" class="py-10 md:py-14 border-b border-linea">
    <h2 id="t-redes" class="font-lectura text-2xl md:text-3xl font-bold mb-2"${c('redes.titulo')}>${esc(rd.titulo)}</h2>
    <p class="text-tinta-suave mb-6"${c('redes.texto', 'md')}>${md(rd.texto)}</p>
    <div class="grid md:grid-cols-12 gap-5">
      <div class="md:col-span-7 border border-linea rounded-sm p-4 flex flex-col gap-3 min-w-0">
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            ${marcaRed}
            <p class="etiqueta text-carmesi-texto">Facebook · <span${c('redes.facebook.usuario')}>${esc(fb.usuario)}</span></p>
          </div>
          <a href="${url(g.facebook)}" target="_blank" rel="noopener" class="btn text-sm px-3 py-1.5 font-semibold rounded-sm">Seguir</a>
        </div>
        <div id="fb-pagina" class="w-full max-w-[500px] mx-auto min-h-[130px]"></div>
        <div id="fb-publicaciones" class="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2" tabindex="0" aria-label="Publicaciones recientes en Facebook (desliza para ver más)"></div>
        <p class="text-sm"${c('redes.facebook.texto')}>${esc(fb.texto)}</p>
        <a href="${url(g.facebook)}" target="_blank" rel="noopener" class="text-sm font-semibold text-carmesi-texto hover:underline">Ir a Facebook →</a>
      </div>

      <div class="md:col-span-5 grid sm:grid-cols-2 md:grid-cols-1 gap-5 content-start min-w-0">
      <div class="border border-linea rounded-sm p-4 flex flex-col gap-3 min-w-0">
        <div class="flex items-center gap-2">
          ${marcaRed}
          <p class="etiqueta text-carmesi-texto">Instagram</p>
        </div>
        <div class="grid grid-cols-3 gap-1">
          ${igFotos.length ? igFotos.slice(0, 6).map((f) => `<a href="${url(f.enlace || g.instagram)}"${externo(f.enlace || g.instagram)}><img src="${url(f.imagen)}" alt="" class="w-full aspect-square object-cover"></a>`).join('') : [0, 1, 2, 3, 4, 5].map((i) => cuadro(i, 'aspect-square')).join('')}
        </div>
        <p class="text-sm"${c('redes.instagram.texto')}>${esc(ig.texto)}</p>
        <a href="${url(g.instagram)}"${externo(g.instagram)} class="text-sm font-semibold text-carmesi-texto hover:underline">Ir a Instagram →</a>
      </div>
      <div class="border border-linea rounded-sm p-4 flex flex-col gap-3 min-w-0">
        <div class="flex items-center gap-2">
          ${marcaRed}
          <p class="etiqueta text-carmesi-texto">TikTok</p>
        </div>
        <div class="flex gap-2">
          ${tkFotos.length ? tkFotos.slice(0, 2).map((f) => `<a href="${url(f.enlace || g.tiktok)}"${externo(f.enlace || g.tiktok)} class="flex-1"><img src="${url(f.imagen)}" alt="" class="w-full aspect-[9/16] object-cover rounded-sm"></a>`).join('') : [1, 0].map((i) => cuadro(i, 'aspect-[9/16] flex-1 rounded-sm')).join('')}
        </div>
        <p class="text-sm"${c('redes.tiktok.texto')}>${esc(tk.texto)}</p>
        <a href="${url(g.tiktok)}"${externo(g.tiktok)} class="text-sm font-semibold text-carmesi-texto hover:underline">Ir a TikTok →</a>
      </div>
      </div>
    </div>
  </section>
`);
    }

    // ============ NUESTRA HISTORIA ============
    const hi = d.historia || {};
    if (visible(hi)) {
      const b1 = hi.boton1 || {}, b2 = hi.boton2 || {};
      h.push(`
  <section id="historia" aria-labelledby="t-historia" class="py-10 md:py-14 grid md:grid-cols-12 gap-8">
    <div class="md:col-span-5 flex flex-col gap-4 min-w-0">
      <p class="etiqueta text-teal-texto"${c('historia.etiqueta')}>${esc(hi.etiqueta)}</p>
      <h2 id="t-historia" class="font-lectura text-2xl md:text-3xl font-bold"${c('historia.titulo')}>${esc(hi.titulo)}</h2>
      <p class="font-lectura text-tinta-suave"${c('historia.texto', 'md')}>${md(hi.texto)}</p>
      <div class="flex flex-wrap gap-3">
        ${b1.texto ? `<a href="${url(b1.enlace)}"${externo(b1.enlace)} class="btn px-5 py-3 font-semibold rounded-sm"${c('historia.boton1.texto')}>${esc(b1.texto)}</a>` : ''}
        ${b2.texto ? `<a href="${url(b2.enlace)}"${externo(b2.enlace)} class="px-5 py-3 font-semibold text-carmesi-texto border border-carmesi rounded-sm hover:bg-rosa-suave"${c('historia.boton2.texto')}>${esc(b2.texto)}</a>` : ''}
      </div>
    </div>
    <ol class="md:col-span-7 relative border-l-2 border-teal pl-6 flex flex-col gap-6 min-w-0">
${(hi.hitos || []).map((t, i) => {
  const p = 'historia.hitos.' + i + '.';
  return `      <li><p class="etiqueta ${t.destacado ? 'text-carmesi-texto' : 'text-teal-texto'} num"${c(p + 'anio')}>${esc(t.anio)}</p><p class="font-lectura font-semibold"${c(p + 'titulo')}>${esc(t.titulo)}</p><p class="text-sm text-tinta-suave"${c(p + 'texto')}>${esc(t.texto)}</p></li>`;
}).join('\n')}
    </ol>
  </section>
`);
    }

    // ============ FOOTER ============
    const pi = d.pie || {};
    const enlaces = (lista, ruta) => (lista || []).map((l, i) => `      <a href="${url(l.enlace)}"${externo(l.enlace)} class="hover:underline"${c(ruta + '.' + i + '.texto')}>${esc(l.texto)}</a>`).join('\n');
    h.push(`</main>

<footer id="pie" class="bg-carmesi text-sobre-carmesi mt-4">
  <div class="max-w-6xl mx-auto px-4 py-12 grid sm:grid-cols-2 md:grid-cols-4 gap-8 text-[0.95rem]">
    <div class="sm:col-span-2 md:col-span-1 flex flex-col gap-2">
      <p class="font-mancheta text-2xl font-bold leading-tight">${esc(g.mancheta)}</p>
      <p class="opacity-90"${c('pie.descripcion')}>${esc(pi.descripcion)}</p>
    </div>
    <nav aria-label="Secciones" class="flex flex-col gap-1">
      <p class="etiqueta opacity-80 mb-1">Secciones</p>
${enlaces(pi.secciones, 'pie.secciones')}
    </nav>
    <div class="flex flex-col gap-1">
      <p class="etiqueta opacity-80 mb-1">Servicios</p>
${enlaces(pi.servicios, 'pie.servicios')}
    </div>
    <div class="flex flex-col gap-1">
      <p class="etiqueta opacity-80 mb-1">Contacto</p>
      <p${c('pie.direccion')}>${esc(pi.direccion)}</p>
      <p class="num"${c('pie.telefono')}>${esc(pi.telefono)}</p>
      <p${c('pie.correo')}>${esc(pi.correo)}</p>
      <p class="opacity-90 text-sm"${c('pie.horario')}>${esc(pi.horario)}</p>
    </div>
  </div>
  <div class="bg-teal">
    <div class="max-w-6xl mx-auto px-4 py-3 flex flex-wrap justify-between gap-2 text-sm">
      <p${c('pie.derechos')}>${esc(pi.derechos)}</p>
      <p>${(pi.legales || []).map((l, i) => `<a href="${url(l.enlace)}"${externo(l.enlace)} class="hover:underline"${c('pie.legales.' + i + '.texto')}>${esc(l.texto)}</a>`).join(' · ')}</p>
    </div>
  </div>
</footer>

<div class="folio folio-abajo px-4 md:px-0 pb-3 md:pb-0">
  <span>${esc(capitalizar(g.mancheta))}</span>
  <span class="num">Página 1</span>
</div>

</div><!-- /hoja -->

<script src="sitio/js/pagina.js"></script>
<script src="sitio/js/facebook.js"></script>
`);

    if (visible(r)) {
      h.push(`
<button type="button" id="mini-radio" class="mini-radio" aria-label="Detener ${esc(r.nombre)}" hidden>
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="5" y="4" width="5" height="16"/><rect x="14" y="4" width="5" height="16"/></svg>
  ${esc(r.nombreCorto || r.nombre)}
</button>
<script src="sitio/js/radio.js"></script>
`);
    }

    if (visible(ch)) {
      h.push(`
<button type="button" id="chat-boton" class="chat-boton" aria-label="Pregúntale al periódico" aria-expanded="false" aria-controls="chat-panel">
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4 3h16a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H9l-5 4v-4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/></svg>
  <span class="chat-boton-texto">Pregúntale al periódico</span>
</button>
<div id="chat-panel" class="chat-panel" role="dialog" aria-labelledby="chat-titulo" hidden>
  <div class="chat-cabeza">
    <img src="${url(g.emblema)}" alt="" class="h-9 w-auto shrink-0">
    <div class="min-w-0">
      <p id="chat-titulo" class="font-semibold leading-tight">Pregúntale al periódico</p>
      <p class="chat-subtitulo text-xs opacity-90">${esc(capitalizar(g.mancheta))} · Edición N.º ${esc(g.numeroEdicion)}</p>
    </div>
    <button type="button" id="chat-contraer" class="chat-cerrar" aria-expanded="true" aria-label="Contraer el chat">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 9l7 7 7-7"/></svg>
    </button>
    <button type="button" id="chat-cerrar" class="chat-cerrar" aria-label="Cerrar el chat">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19"/></svg>
    </button>
  </div>
  <div id="chat-log" class="chat-log" role="log" aria-live="polite" tabindex="0" aria-label="Conversación"></div>
  <form id="chat-form" class="chat-form">
    <label for="chat-texto" class="sr-only">Escribe tu pregunta sobre el periódico</label>
    <input id="chat-texto" type="text" maxlength="200" autocomplete="off" placeholder="¿Qué quieres saber de esta edición?">
    <button type="submit" class="btn">Enviar</button>
  </form>
  <p class="chat-nota">Busco en el texto de la edición y cito lo que encuentro. Soy automático y puedo equivocarme de pasaje. Lo que escribes no se guarda ni se envía.</p>
</div>
<script src="sitio/js/chat.js"></script>
`);
    }

    if (ed) h.push('<script src="cms/editor-vista.js"></script>\n');
    h.push('</body>\n</html>\n');
    return h.join('');
  }

  const api = { renderizar, md, esc };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else raiz.Plantilla = api;
})(this);
