    (function () {
      const DURACION = 7000;
      const car = document.getElementById('destacadas');
      const pista = car.querySelector('.carrusel-pista');
      const diapos = Array.from(car.querySelectorAll('.diapositiva'));
      const puntos = Array.from(car.querySelectorAll('.punto'));
      const btnPausa = document.getElementById('carrusel-pausa');
      let actual = 0, transcurrido = 0, ultimo = Date.now(), pausaManual = !!SITIO.editor, pestanaOculta = false;

      function ir(n) {
        actual = (n + diapos.length) % diapos.length;
        transcurrido = 0;
        pista.style.transform = 'translateX(' + (-100 * actual) + '%)';
        diapos.forEach((d, i) => {
          const activa = i === actual;
          d.setAttribute('aria-hidden', String(!activa));
          try { d.inert = !activa; } catch (e) {} // los enlaces de las notas ocultas no reciben foco
        });
        puntos.forEach((p, i) => {
          if (i === actual) p.setAttribute('aria-current', 'true'); else p.removeAttribute('aria-current');
          p.querySelector('.barra').style.transform = 'scaleX(0)';
        });
      }
      function pintarPausa() {
        btnPausa.classList.toggle('en-pausa', pausaManual);
        btnPausa.setAttribute('aria-label', pausaManual ? 'Reanudar el carrusel' : 'Pausar el carrusel');
      }
      // Reloj: suma el tiempo solo mientras corre; al llegar a 7 s pasa a la siguiente nota
      function tic() {
        const ahora = Date.now();
        const corre = !pausaManual && !pestanaOculta && !document.documentElement.classList.contains('cerrado');
        if (corre) transcurrido += Math.min(ahora - ultimo, 200);
        ultimo = ahora;
        if (transcurrido >= DURACION) ir(actual + 1);
        puntos[actual].querySelector('.barra').style.transform = 'scaleX(' + Math.min(transcurrido / DURACION, 1) + ')';
      }

      puntos.forEach((p) => p.addEventListener('click', () => ir(Number(p.dataset.ir))));
      car.querySelectorAll('[data-mover]').forEach((b) => b.addEventListener('click', () => ir(actual + Number(b.dataset.mover))));
      btnPausa.addEventListener('click', () => { pausaManual = !pausaManual; pintarPausa(); });
      document.addEventListener('visibilitychange', () => { pestanaOculta = document.visibilityState === 'hidden'; });
      car.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') { e.preventDefault(); ir(actual + 1); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); ir(actual - 1); }
      });
      // Deslizar con el dedo en celulares
      let x0 = null;
      pista.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') x0 = e.clientX; });
      pista.addEventListener('pointerup', (e) => {
        if (x0 === null) return;
        const dx = e.clientX - x0; x0 = null;
        if (Math.abs(dx) > 50) ir(actual + (dx < 0 ? 1 : -1));
      });

      window.carruselIr = ir; // el gestor visual lo usa para mostrar la nota que se está editando
      ir(0);
      pintarPausa();
      setInterval(tic, 50);
    })();
