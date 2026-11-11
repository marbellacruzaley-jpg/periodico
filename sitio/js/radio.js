  (function () {
    const STREAM = SITIO.radio.stream;
    const NOMBRE = SITIO.radio.nombre;
    const MAX_REINTENTOS = 3;
    const caja = document.querySelector('.radio');
    const audio = document.getElementById('radio-audio');
    const btn = document.getElementById('radio-play');
    const mini = document.getElementById('mini-radio');
    const textoEstado = document.getElementById('radio-estado');
    const volumen = document.getElementById('radio-volumen');
    let quiereSonar = false, reintentos = 0, temporizador, moduloVisible = true;

    function pintar(estado, texto) {
      caja.dataset.estado = estado;
      textoEstado.textContent = texto;
      btn.setAttribute('aria-label', quiereSonar ? 'Detener ' + NOMBRE : 'Escuchar ' + NOMBRE + ' en vivo');
      pintarMini();
    }
    function pintarMini() { mini.hidden = !(quiereSonar && !moduloVisible); }

    function conectar() {
      audio.src = STREAM; // cada conexión pide un enlace nuevo
      const intento = audio.play();
      // Los fallos de red llegan por el evento "error"; aquí solo importa si el navegador bloqueó el audio
      if (intento) intento.catch((e) => { if (e.name === 'NotAllowedError') detener(); });
    }
    function escuchar() {
      quiereSonar = true; reintentos = 0;
      pintar('cargando', 'Conectando…');
      conectar();
    }
    function detener(texto) {
      quiereSonar = false;
      clearTimeout(temporizador);
      // En una transmisión en vivo se corta la conexión: así no gasta datos y, al volver, suena lo actual
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
      pintar('detenida', texto || 'Toca para escuchar');
    }
    function fallo() {
      if (!quiereSonar) return;
      if (reintentos++ < MAX_REINTENTOS) {
        pintar('cargando', 'Reconectando…');
        clearTimeout(temporizador);
        temporizador = setTimeout(conectar, 1500 * reintentos);
      } else {
        detener('Sin señal. Intenta más tarde');
      }
    }

    btn.addEventListener('click', () => { quiereSonar ? detener() : escuchar(); });
    mini.addEventListener('click', () => detener());
    audio.addEventListener('playing', () => { reintentos = 0; pintar('vivo', 'En vivo'); });
    audio.addEventListener('waiting', () => { if (quiereSonar) pintar('cargando', 'Cargando…'); });
    audio.addEventListener('error', () => { if (audio.getAttribute('src')) fallo(); });
    audio.addEventListener('ended', fallo); // el servidor cerró la conexión
    // Pausa desde fuera de la página (auriculares, pantalla de bloqueo)
    audio.addEventListener('pause', () => { if (quiereSonar && !audio.ended && !audio.error) detener(); });

    // Volumen recordado por visitante
    try { const v = localStorage.getItem('radio-volumen'); if (v !== null) volumen.value = v; } catch (e) {}
    audio.volume = Number(volumen.value);
    volumen.addEventListener('input', () => {
      audio.volume = Number(volumen.value);
      try { localStorage.setItem('radio-volumen', volumen.value); } catch (e) {}
    });

    // Controles en la pantalla de bloqueo del celular
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({ title: NOMBRE, artist: 'En vivo',
        artwork: [{ src: new URL(SITIO.radio.logo, location.href).href }] });
      navigator.mediaSession.setActionHandler('play', escuchar);
      navigator.mediaSession.setActionHandler('pause', () => detener());
    }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver((e) => { moduloVisible = e[e.length - 1].isIntersecting; pintarMini(); }).observe(caja);
    }
  })();
