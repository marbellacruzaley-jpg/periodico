  (function () {
    const raiz = document.documentElement;
    const cubierta = document.getElementById('cubierta'), rollo = document.getElementById('rollo');
    let terminado = false, abriendo = false;
    function terminar() {
      if (terminado) return;
      terminado = true;
      try { cubierta.remove(); rollo.remove(); } catch (e) { cubierta.style.display = rollo.style.display = 'none'; }
      raiz.classList.remove('cerrado'); raiz.classList.add('abierto');
      try { document.dispatchEvent(new Event('periodico-abierto')); } catch (e) {}
    }
    const espera = (ms) => new Promise((r) => setTimeout(r, ms));
    // Cada paso se encadena por tiempo (no por la promesa .finished, que algunas vistas previas no resuelven)
    function animar(el, cuadros, op) {
      try { el.animate(cuadros, op); } catch (e) {}
      return espera(op.duration);
    }
    async function abrir() {
      if (abriendo || terminado) return;
      abriendo = true;
      setTimeout(terminar, 3000); // seguro: pase lo que pase, el periódico queda abierto
      try {
        rollo.classList.remove('meciendo');
        cubierta.classList.add('saliendo');
        const vh = innerHeight, rh = rollo.offsetHeight, arriba = rh / 2 + 8, fin = vh + rh;
        const hoja = document.querySelector('.hoja');
        const ancho = Math.min((hoja ? hoja.getBoundingClientRect().width : innerWidth) + 20, innerWidth);
        // a) Se suelta la liga
        await animar(rollo.querySelector('.rollo-liga'),
          [{ transform: 'none', opacity: 1 }, { transform: 'translateY(-70px) rotate(30deg) scaleY(.5)', opacity: 0 }],
          { duration: 320, easing: 'cubic-bezier(.5,0,.75,0)', fill: 'forwards' });
        // b) El rollo se endereza, sube al borde superior y se extiende al ancho de la hoja
        await animar(rollo,
          [{ top: '50%', width: rollo.offsetWidth + 'px', transform: 'translate(-50%, -50%) rotate(-10deg)' },
           { top: arriba + 'px', width: ancho + 'px', transform: 'translate(-50%, -50%) rotate(0deg)' }],
          { duration: 550, easing: 'cubic-bezier(.3,.7,.2,1)', fill: 'forwards' });
        // c) Rueda hacia abajo desenrollando la página; el rollo adelgaza a medida que se acaba el papel
        const ritmo = { duration: 1150, easing: 'cubic-bezier(.45,.05,.35,1)', fill: 'forwards' };
        animar(rollo, [{ top: arriba + 'px', height: rh + 'px' }, { top: fin + 'px', height: rh * .5 + 'px' }], ritmo);
        await animar(cubierta, [{ clipPath: 'inset(0px 0 0 0)' }, { clipPath: 'inset(' + fin + 'px 0 0 0)' }], ritmo);
      } catch (e) {}
      terminar();
    }

    // Primero se conectan los eventos; después, lo demás
    cubierta.addEventListener('click', abrir);
    rollo.addEventListener('click', abrir);
    document.addEventListener('keydown', (e) => {
      if (!terminado && ['Escape', 'Enter', ' '].includes(e.key)) { e.preventDefault(); abrir(); }
    });

    if (!raiz.classList.contains('js-anim') || typeof rollo.animate !== 'function') { terminar(); return; }
    raiz.classList.add('cerrado');
    try { if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; } catch (e) {}
    try { scrollTo(0, 0); } catch (e) {}
  })();
