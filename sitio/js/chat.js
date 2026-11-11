  (function () {
    const SUMARIO = SITIO.chat.sumario; // [título, página impresa, hoja del PDF]
    const INICIO = SITIO.chat.sugerencias;
    const NO_BUSCAR = new Set(('a al algo alguien ante aqui asi ay cada como con cual cuales cuando cuanto cuanta cuantos cuantas de del dice dicen donde dame dijo el ella ellos en entre era es esa ese eso esta estan estas este esto estos fue habla hablan hablar hay hizo la las le les lo los mas me mi mis muy nos o para pero periodico por porque puedes puedo que quien quienes quiero saber se segun sea ser si sobre son su sus te tiene tienen tu un una uno unos unas y ya yo edicion articulo nota noticia dime cuentame informacion').split(' '));

    const normalizar = (t) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    // Reduce cada palabra a su raíz, para que «fundó», «fundada» y «fundación» coincidan
    function raiz(w) {
      if (w.length <= 3) return w;
      const s = w.length > 4 && w.endsWith('es') ? w.slice(0, -2) : w.endsWith('s') ? w.slice(0, -1) : w;
      const m = s.match(/^(.{3,}?)(acion|amiento|imiento|ando|iendo|aron|ieron|ada|ado|ida|ido|aba|ar|er|ir|a|e|o)$/);
      return m ? m[1] : s;
    }
    const palabras = (t) => normalizar(t).match(/[a-zñ0-9]+/g) || [];
    const raices = (t) => palabras(t).filter((w) => !NO_BUSCAR.has(w)).map(raiz);
    const escapar = (t) => t.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

    let datos = null, indice = null;
    // El índice se descarga solo cuando alguien abre el chat
    let cargando = null;
    function cargar() {
      if (cargando) return cargando;
      cargando = new Promise((ok, mal) => {
        const s = document.createElement('script');
        s.src = 'contenidos/edicion-chat.js';
        s.onload = () => { datos = window.EDICION_CHAT; preparar(); ok(); };
        s.onerror = () => { cargando = null; mal(new Error('sin índice')); };
        document.head.appendChild(s);
      });
      return cargando;
    }
    function preparar() {
      const df = new Map();
      const docs = datos.pasajes.map((d) => {
        const tf = new Map();
        raices(d.h + ' ' + (d.k || '')).forEach((w) => tf.set(w, (tf.get(w) || 0) + 3)); // los títulos pesan más que el cuerpo
        raices(d.t).forEach((w) => tf.set(w, (tf.get(w) || 0) + 1));
        let largo = 0; tf.forEach((n, w) => { df.set(w, (df.get(w) || 0) + 1); largo += n; });
        return { d, tf, largo, plano: palabras(d.h + ' ' + d.t).join(' ') };
      });
      const media = docs.reduce((a, x) => a + x.largo, 0) / docs.length;
      indice = { docs, df, media, vocab: [...df.keys()], N: docs.length };
    }
    function distanciaUno(a, b) { // ¿difieren en una sola letra? (faltas de ortografía)
      if (Math.abs(a.length - b.length) > 1 || a === b) return false;
      let i = 0; while (i < a.length && a[i] === b[i]) i++;
      if (a.length === b.length) return a.slice(i + 1) === b.slice(i + 1);
      return a.length > b.length ? a.slice(i + 1) === b.slice(i) : a.slice(i) === b.slice(i + 1);
    }
    const corregir = (w) => (indice.df.has(w) || w.length < 5 ? w : indice.vocab.find((v) => distanciaUno(w, v)) || w);
    const idf = (w) => Math.log(1 + (indice.N + .5) / ((indice.df.get(w) || 0) + .5));

    function buscar(pregunta) {
      const terminos = [...new Set(raices(pregunta).map(corregir))];
      if (!terminos.length) return { terminos, hallados: [] };
      // Una palabra que no aparece en la edición cuenta menos: «¿cuántas habitaciones estrenó el hospital?»
      // debe encontrar la nota aunque el texto no diga «estrenó»
      const pesoTotal = terminos.reduce((a, w) => a + idf(w) * (indice.df.has(w) ? 1 : .5), 0);
      const frase = palabras(pregunta).filter((w) => !NO_BUSCAR.has(w)).join(' ');
      const hallados = [];
      indice.docs.forEach((x) => {
        let s = 0, cubierto = 0;
        terminos.forEach((w) => {
          const n = x.tf.get(w);
          if (!n) return;
          cubierto += idf(w);
          s += idf(w) * (n * 2.2) / (n + 1.2 * (.5 + .5 * x.largo / indice.media));
        });
        // Debe aparecer la mayor parte de lo importante de la pregunta; si no, es mejor decir que no se encontró
        const cobertura = cubierto / pesoTotal;
        if (cobertura < .6) return;
        s *= cobertura * cobertura; // gana el pasaje que contiene toda la pregunta, no el que repite parte de ella
        if (terminos.length > 1 && x.plano.includes(frase)) s *= 1.5;
        hallados.push({ d: x.d, s });
      });
      hallados.sort((a, b) => b.s - a.s);
      return { terminos, hallados };
    }
    // Recorta el pasaje a las oraciones que mejor responden, sin cortar ninguna a la mitad
    function extracto(texto, terminos) {
      const oraciones = texto.match(/[^.!?]+[.!?»”"]*\s*/g) || [texto];
      const valor = oraciones.map((o) => { const r = new Set(raices(o)); return terminos.filter((w) => r.has(w)).length; });
      const largos = oraciones.map((o) => o.split(/\s+/).length);
      let mejor = 0, mejorValor = -1;
      for (let i = 0; i < oraciones.length; i++) {
        let v = 0, n = 0;
        for (let j = i; j < oraciones.length && n + largos[j] <= 70; j++) { v += valor[j]; n += largos[j]; }
        if (v > mejorValor) { mejorValor = v; mejor = i; }
      }
      let fin = mejor, n = 0;
      while (fin < oraciones.length && (n === 0 || n + largos[fin] <= 70)) { n += largos[fin]; fin++; }
      return (mejor > 0 ? '… ' : '') + oraciones.slice(mejor, fin).join('').trim() + (fin < oraciones.length ? ' …' : '');
    }
    function resaltar(texto, terminos) {
      return escapar(texto).replace(/[\p{L}\p{N}]+/gu, (w) => (terminos.includes(raiz(normalizar(w))) ? '<mark>' + w + '</mark>' : w));
    }
    const enlacePDF = (hoja, texto) => '<a href="' + datos.pdf + '#page=' + hoja + '" target="_blank" rel="noopener">' + texto + '</a>';

    const CRISIS = ['suicid', 'quitarme la vida', 'quiero morir', 'quisiera morir', 'no quiero vivir', 'matarme', 'hacerme dano', 'me golpean', 'me abusan', 'abusan de mi', 'me violaron', 'me quieren matar'];
    function responder(pregunta) {
      const n = palabras(pregunta).join(' ');
      if (CRISIS.some((c) => n.includes(c))) return { html: 'Lamento que estés pasando por esto. Soy un chat automático del periódico y no puedo darte el apoyo que mereces, pero hay personas que sí pueden hacerlo ahora mismo:<br><br><strong>Línea de la Vida: <a href="tel:8009112000">800 911 2000</a></strong><br>Gratuita y confidencial, las 24 horas.<br><br>Si estás en peligro inmediato, llama al <strong><a href="tel:911">911</a></strong>.' };
      if (n === 'sumario' || /\b(que trae|que hay|que viene|de que (trata|habla)|resumen|sumario|indice|temas|secciones|contenido)\b/.test(n)) {
        return { html: 'La edición N.º ' + escapar(datos.numero) + ', del ' + escapar(datos.fecha) + ', trae:<ul>' + SUMARIO.map((s) => '<li>' + enlacePDF(s[2], s[0]) + ' <span class="chat-fuente num">· pág. ' + s[1] + '</span></li>').join('') + '</ul>' };
      }
      const breve = n.split(' ').length <= 4;
      if (breve && /\b(hola|buenas|buenos|saludos)\b/.test(n)) return { html: '¡Hola! Pregúntame sobre lo que publica esta edición: notas, columnas, personas o lugares.', chips: INICIO };
      if (breve && /\b(gracias|bendiciones)\b/.test(n)) return { html: '¡Con gusto! Que tengas un buen día.' };
      // Director, domicilio y teléfono salen del directorio impreso de la propia edición
      if (/\b(director|dirige|directorio|domicilio|direccion|telefono|contacto|contactar|redaccion|oficina|oficinas)\b/.test(n)) {
        const dir = datos.pasajes.find((d) => d.t.includes('Domicilio de la Publicación'));
        if (dir) {
          const datosDir = dir.t.split('•').map((s) => s.trim()).filter((s) => /^(Director|Domicilio|Tel)/.test(s));
          if (datosDir.length) return { html: 'Según el directorio de la edición:<div class="chat-recorte">' + datosDir.map(escapar).join('<br>') + '</div>' + enlacePDF(dir.p, 'Leer en el PDF, pág. ' + dir.i) };
        }
      }
      const r = buscar(pregunta);
      if (r.hallados.length) {
        const m = r.hallados[0], paginas = new Set([m.d.i]), otros = [];
        for (const h of r.hallados.slice(1)) {
          if (otros.length === 2 || h.s < m.s * .5) break;
          if (!paginas.has(h.d.i)) { paginas.add(h.d.i); otros.push(enlacePDF(h.d.p, 'pág. ' + h.d.i)); }
        }
        return { html: 'Esto dice la edición:' +
          '<div class="chat-recorte">' + resaltar(extracto(m.d.t, r.terminos), r.terminos) + '</div>' +
          (m.d.h ? '<p class="chat-tambien"><strong>' + escapar(m.d.h) + '</strong></p>' : '') +
          enlacePDF(m.d.p, 'Leer en el PDF, pág. ' + m.d.i) +
          (otros.length ? '<p class="chat-tambien">También aparece en ' + otros.join(' y ') + '.</p>' : '') };
      }
      return { html: 'No encontré eso en la edición N.º ' + escapar(datos.numero) + ', que es la única que conozco por ahora. Prueba con otras palabras, como el nombre de una persona, un lugar o una sección.', chips: INICIO };
    }

    const boton = document.getElementById('chat-boton'), panel = document.getElementById('chat-panel');
    const log = document.getElementById('chat-log'), form = document.getElementById('chat-form'), entrada = document.getElementById('chat-texto');
    let iniciado = false;
    function agregar(clase, contenido, comoHTML) {
      const d = document.createElement('div');
      d.className = 'chat-msg ' + clase;
      if (comoHTML) d.innerHTML = contenido; else d.textContent = contenido; // lo que escribe el lector nunca se trata como HTML
      log.appendChild(d);
      return d;
    }
    function ponerChips(lista) {
      log.querySelectorAll('.chat-chips').forEach((c) => c.remove());
      if (!lista) return;
      const c = document.createElement('div');
      c.className = 'chat-chips';
      lista.forEach(([texto, consulta]) => {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'chat-chip'; b.textContent = texto;
        b.addEventListener('click', () => preguntar(texto, consulta));
        c.appendChild(b);
      });
      log.appendChild(c);
    }
    async function preguntar(visible, consulta) {
      agregar('chat-yo', visible);
      ponerChips(null);
      let res;
      try { await cargar(); res = responder(consulta); }
      catch (e) { res = { html: 'No pude abrir la edición. Revisa tu conexión e inténtalo de nuevo.' }; }
      const burbuja = agregar('chat-bot', res.html, true);
      ponerChips(res.chips);
      // La respuesta se muestra desde su inicio, aunque sea más larga que la ventana
      log.scrollTop = burbuja.offsetTop - log.offsetTop - 8;
    }
    const btnContraer = document.getElementById('chat-contraer');
    function contraer(si) {
      panel.classList.toggle('contraido', si);
      document.documentElement.classList.toggle('chat-contraido', si);
      btnContraer.setAttribute('aria-expanded', String(!si));
      btnContraer.setAttribute('aria-label', si ? 'Expandir el chat' : 'Contraer el chat');
    }
    btnContraer.addEventListener('click', (e) => {
      e.stopPropagation();
      const si = !panel.classList.contains('contraido');
      contraer(si);
      if (!si && matchMedia('(pointer: fine)').matches) entrada.focus();
    });
    // Contraído, toda la barra sirve para volver a expandirlo
    panel.querySelector('.chat-cabeza').addEventListener('click', (e) => {
      if (panel.classList.contains('contraido') && !e.target.closest('button')) {
        contraer(false);
        if (matchMedia('(pointer: fine)').matches) entrada.focus();
      }
    });
    function abrir() {
      panel.hidden = false; boton.hidden = true; boton.setAttribute('aria-expanded', 'true');
      contraer(false);
      if (!iniciado) {
        iniciado = true;
        agregar('chat-bot', 'Hola, soy el chat de <strong>Comunidad Cristiana</strong>. Pregúntame sobre esta edición y te muestro lo que dice y en qué página.', true);
        ponerChips(INICIO);
        cargar().catch(() => {});
      }
      // En pantallas táctiles no se enfoca el texto, para que el teclado no tape la conversación
      if (matchMedia('(pointer: fine)').matches) entrada.focus(); else document.getElementById('chat-cerrar').focus();
    }
    function cerrar() {
      contraer(false);
      panel.hidden = true; boton.hidden = false; boton.setAttribute('aria-expanded', 'false');
      boton.focus();
    }
    boton.addEventListener('click', abrir);
    document.getElementById('chat-cerrar').addEventListener('click', cerrar);
    panel.addEventListener('keydown', (e) => { if (e.key === 'Escape') cerrar(); });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const t = entrada.value.trim();
      if (!t) return;
      entrada.value = '';
      preguntar(t, t);
    });
  })();
