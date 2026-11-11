  (function () {
    const PAGINA = SITIO.facebook.pagina;
    const PUBLICACIONES_FACEBOOK = SITIO.facebook.publicaciones;
    const cab = document.getElementById('fb-pagina'), lista = document.getElementById('fb-publicaciones');
    const permisos = 'autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share';
    function iframe(src, ancho, alto, titulo) {
      const f = document.createElement('iframe');
      f.src = src; f.width = ancho; f.height = alto; f.title = titulo;
      f.style.cssText = 'border:none;overflow:hidden;display:block;margin:0 auto;max-width:100%';
      f.setAttribute('scrolling', 'no'); f.setAttribute('allowfullscreen', 'true'); f.setAttribute('allow', permisos);
      return f;
    }
    // Cabecera de la página: portada, nombre, seguidores y botón "Seguir página" (sin línea de tiempo)
    let anchoCab = 0, espera;
    function cargarCabecera() {
      const ancho = Math.max(180, Math.min(500, Math.floor(cab.clientWidth)));
      if (ancho === anchoCab) return;
      anchoCab = ancho;
      const p = new URLSearchParams({ href: PAGINA, tabs: '', width: ancho, height: 130, small_header: 'false',
        adapt_container_width: 'true', hide_cover: 'false', show_facepile: 'false', locale: 'es_LA' });
      cab.replaceChildren(iframe('https://www.facebook.com/plugins/page.php?' + p, ancho, 130, 'Página de Comunidad Cristiana en Facebook'));
    }
    // En el gestor visual no se cargan los recuadros de Facebook: la vista previa se redibuja seguido
    if (SITIO.editor) {
      cab.innerHTML = '<div class="foto aspect-[500/130] rounded-sm grid place-items-center text-sm font-semibold" style="color:#fff">Cabecera de la página de Facebook</div>';
      PUBLICACIONES_FACEBOOK.forEach((u) => lista.insertAdjacentHTML('beforeend', '<div class="snap-start shrink-0 w-[260px] border border-linea rounded-sm p-3 text-sm"><p class="etiqueta text-teal-texto">Publicación de Facebook</p><p class="break-all text-tinta-suave"></p></div>'));
      lista.querySelectorAll('.break-all').forEach((p, i) => { p.textContent = PUBLICACIONES_FACEBOOK[i]; });
      return;
    }
    cargarCabecera();
    window.addEventListener('resize', () => { clearTimeout(espera); espera = setTimeout(cargarCabecera, 300); });

    // Publicaciones incrustadas: carrusel horizontal de tarjetas de 350 px
    // (el ancho mínimo con el que Facebook no recorta la publicación).
    if (PUBLICACIONES_FACEBOOK.length) {
      PUBLICACIONES_FACEBOOK.forEach((url) => {
        const esVideo = /\/(videos|reel|watch)\b|fb\.watch/.test(url);
        const p = new URLSearchParams({ href: url, show_text: 'true', width: 350, locale: 'es_LA' });
        const caja = document.createElement('div');
        caja.className = 'snap-start shrink-0 w-[350px] bg-papel border border-linea rounded-sm overflow-hidden';
        caja.appendChild(iframe('https://www.facebook.com/plugins/' + (esVideo ? 'video' : 'post') + '.php?' + p,
          350, 640, 'Publicación de Comunidad Cristiana en Facebook'));
        lista.appendChild(caja);
      });
    } else {
      // Sin enlaces configurados: tarjetas de muestra que llevan a la página
      ['Misa dominical en vivo', 'Avisos parroquiales', 'Edición de la semana', 'Galería de la arquidiócesis'].forEach((t, i) => {
        lista.insertAdjacentHTML('beforeend',
          '<a href="' + PAGINA + '" target="_blank" rel="noopener" class="group block snap-start shrink-0 w-[260px] border border-linea rounded-sm overflow-hidden hover:border-carmesi">' +
          '<div class="' + (i % 2 ? 'foto-teal' : 'foto') + ' aspect-video"></div>' +
          '<div class="p-3"><p class="etiqueta text-teal-texto">Publicación de ejemplo</p>' +
          '<p class="font-lectura font-semibold leading-snug group-hover:underline">' + t + '</p></div></a>');
      });
    }
  })();
