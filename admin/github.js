// Gestor en línea: cuando el gestor se abre desde GitHub Pages (no desde servidor.js), las mismas
// peticiones que atiende servidor.js (/api/...) se resuelven aquí contra el repositorio de GitHub.
// Guardar crea un commit con datos/contenido.json, index.html y la copia en datos/historial/;
// GitHub Pages vuelve a publicar el sitio en uno o dos minutos.
//
// Para entrar se usa una clave de acceso de GitHub (fine-grained token) con permiso sobre este
// repositorio: «Contents: Read and write» y «Actions: Read and write» (para el índice del chat).
(function () {
  if (/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) || location.protocol === 'file:') return;

  // Repositorio: se deduce de la dirección (usuario.github.io/repositorio/admin/)
  const enPages = /^([^.]+)\.github\.io$/i.exec(location.hostname);
  const DUENO = enPages ? enPages[1] : 'marbellacruzaley-jpg';
  const REPO = (enPages && location.pathname.split('/')[1]) || 'periodico';
  const RAMA = 'main';
  const API = 'https://api.github.com/repos/' + DUENO + '/' + REPO;
  const FLUJO_INDICE = 'indexar-chat.yml';
  const MAX_HISTORIAL = 60;
  const MAX_SUBIDA = 40 * 1024 * 1024;
  const EXT_IMAGEN = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
  const LLAVE = 'gestor-github-token';

  let token = '';
  try { token = localStorage.getItem(LLAVE) || ''; } catch (e) {}
  const recordar = (t) => { token = t; try { t ? localStorage.setItem(LLAVE, t) : localStorage.removeItem(LLAVE); } catch (e) {} };
  // Archivos subidos en esta sesión: GitHub Pages tarda en publicarlos, así que la vista previa usa la copia local
  const recientes = new Map();

  // ---------- GitHub ----------
  const error = (mensaje, estado) => Object.assign(new Error(mensaje), { estado });
  async function gh(ruta, op) {
    op = op || {};
    let r;
    try {
      r = await fetch(API + ruta, {
        method: op.method || 'GET',
        cache: 'no-store',
        headers: Object.assign({ Authorization: 'Bearer ' + token, Accept: op.crudo ? 'application/vnd.github.raw' : 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' },
          op.body ? { 'Content-Type': 'application/json' } : {}),
        body: op.body ? JSON.stringify(op.body) : undefined
      });
    } catch (e) { throw error('No hay conexión con GitHub. Revisa tu internet.', 0); }
    if (r.ok) return r.status === 204 ? null : op.crudo === 'texto' ? r.text() : op.crudo ? r.arrayBuffer() : r.json();
    let msg = '';
    try { msg = (await r.json()).message || ''; } catch (e) {}
    if (r.status === 401) throw error('La clave de acceso no es válida o ya caducó.', 401);
    if (r.status === 403 && /rate limit/i.test(msg)) throw error('GitHub pide esperar unos minutos antes de seguir.', 403);
    if (r.status === 403 || (r.status === 404 && op.method && op.method !== 'GET')) {
      throw error('La clave de acceso no tiene permiso para esto. Revisa que tenga «Contents» y «Actions» en «Read and write».', 403);
    }
    throw error(r.status === 404 ? 'No existe: ' + ruta.split('?')[0] : 'GitHub respondió: ' + (msg || 'error ' + r.status), r.status);
  }
  const rutaApi = (p) => p.split('/').map(encodeURIComponent).join('/');
  const leerTexto = (p, ref) => gh('/contents/' + rutaApi(p) + '?ref=' + (ref || RAMA), { crudo: 'texto' });

  function base64(bytes) {
    let s = '';
    for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(s);
  }
  const blob = async (bytes) => (await gh('/git/blobs', { method: 'POST', body: { content: base64(bytes), encoding: 'base64' } })).sha;

  // Un solo commit con varios archivos. «preparar(padre)» devuelve las entradas que dependen del estado
  // actual del repositorio; si alguien más guardó a la vez, se vuelve a intentar sobre la versión nueva.
  async function confirmar(mensaje, archivos, preparar) {
    const fijas = [];
    for (const a of archivos) fijas.push({ path: a.ruta, mode: '100644', type: 'blob', sha: await blob(a.bytes) });
    for (let intento = 0; ; intento++) {
      const padre = (await gh('/git/ref/heads/' + RAMA)).object.sha;
      const arbolPadre = (await gh('/git/commits/' + padre)).tree.sha;
      const extra = preparar ? await preparar(padre) : [];
      const arbol = await gh('/git/trees', { method: 'POST', body: { base_tree: arbolPadre, tree: fijas.concat(extra) } });
      const commit = await gh('/git/commits', { method: 'POST', body: { message: mensaje, tree: arbol.sha, parents: [padre] } });
      try {
        await gh('/git/refs/heads/' + RAMA, { method: 'PATCH', body: { sha: commit.sha, force: false } });
        return commit.sha;
      } catch (e) { if (e.estado !== 422 || intento >= 2) throw e; }
    }
  }

  async function arbol() {
    const r = await gh('/git/trees/' + RAMA + '?recursive=1');
    return r.tree.filter((x) => x.type === 'blob');
  }

  // ---------- Utilidades (iguales a servidor.js) ----------
  const texto = (t) => new TextEncoder().encode(t);
  const sello = () => new Date().toISOString().replace(/[:T]/g, '-').replace(/\..+/, '');
  const fechaDeSello = (n) => { const m = /(\d{4})-(\d\d)-(\d\d)-(\d\d)-(\d\d)-(\d\d)/.exec(n); return m ? Date.UTC(m[1], m[2] - 1, m[3], m[4], m[5], m[6]) : 0; };
  const limpiarNombre = (n) => n.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[^a-z0-9.]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'archivo';
  const extension = (n) => { const i = n.lastIndexOf('.'); return i > 0 ? n.slice(i).toLowerCase() : ''; };
  const esperar = (ms) => new Promise((ok) => setTimeout(ok, ms));
  const cuerpoJSON = (op) => JSON.parse(op.body || '{}');

  // ---------- Las mismas rutas que servidor.js ----------
  async function pedir(url, op) {
    const u = new URL(url, location.href);
    const ruta = u.pathname.replace(/^.*?\/api\//, '/api/');
    const metodo = (op.method || 'GET').toUpperCase();

    if (ruta === '/api/entrar') {
      const clave = String(cuerpoJSON(op).clave || '').trim();
      if (!clave) throw error('Escribe tu clave de acceso de GitHub.', 400);
      const anterior = token;
      token = clave;
      try {
        const repo = await gh('');
        if (repo.permissions && !repo.permissions.push) throw error('Tu cuenta de GitHub no tiene permiso para editar este sitio.', 403);
      } catch (e) {
        token = anterior;
        if (e.estado === 404) throw error('Esta clave no tiene acceso al repositorio ' + DUENO + '/' + REPO + '.', 403);
        throw e;
      }
      recordar(clave);
      return { ok: true };
    }
    if (ruta === '/api/salir') { recordar(''); return { ok: true }; }
    if (ruta === '/api/sesion') {
      if (!token) return { ok: false };
      try { await gh(''); return { ok: true }; } catch (e) { if (e.estado === 401) { recordar(''); return { ok: false }; } throw e; }
    }

    if (!token) throw error('Entra con tu clave de acceso.', 401);

    if (ruta === '/api/contenido' && metodo === 'GET') return JSON.parse(await leerTexto('datos/contenido.json'));

    if (ruta === '/api/contenido' && metodo === 'PUT') {
      const datos = cuerpoJSON(op);
      if (!datos || typeof datos !== 'object' || !datos.general) throw error('El contenido no es válido', 400);
      const archivos = [
        { ruta: 'datos/contenido.json', bytes: texto(JSON.stringify(datos, null, 2)) },
        { ruta: 'index.html', bytes: texto(Plantilla.renderizar(datos)) }
      ];
      // La versión anterior pasa al historial (sin volver a subirla: se reutiliza el mismo archivo)
      await confirmar('Actualizar contenido desde el gestor', archivos, async (padre) => {
        const todos = (await gh('/git/trees/' + padre + '?recursive=1')).tree;
        const previo = todos.find((x) => x.path === 'datos/contenido.json');
        if (!previo) return [];
        const extra = [{ path: 'datos/historial/contenido-' + sello() + '.json', mode: '100644', type: 'blob', sha: previo.sha }];
        const copias = todos.filter((x) => /^datos\/historial\/contenido-[\d-]+\.json$/.test(x.path)).map((x) => x.path).sort();
        copias.slice(0, Math.max(0, copias.length + 1 - MAX_HISTORIAL)).forEach((p) => extra.push({ path: p, mode: '100644', type: 'blob', sha: null }));
        return extra;
      });
      return { ok: true, fecha: Date.now(), mensaje: 'Guardado. El sitio público se actualiza en uno o dos minutos.' };
    }

    if (ruta === '/api/historial' && metodo === 'GET') {
      let lista = [];
      try { lista = await gh('/contents/datos/historial?ref=' + RAMA); } catch (e) { if (e.estado !== 404) throw e; }
      return lista.filter((f) => /^contenido-[\d-]+\.json$/.test(f.name)).map((f) => ({ archivo: f.name, fecha: fechaDeSello(f.name) }))
        .sort((a, b) => b.fecha - a.fecha);
    }
    const mh = /^\/api\/historial\/(contenido-[\d-]+\.json)$/.exec(decodeURIComponent(ruta));
    if (mh && metodo === 'GET') return JSON.parse(await leerTexto('datos/historial/' + mh[1]));

    if (ruta === '/api/archivos' && metodo === 'GET') {
      const pdf = u.searchParams.get('tipo') === 'pdf';
      const lista = (await arbol()).filter((x) => (pdf
        ? /^contenidos\/[^/]+\.pdf$/i.test(x.path)
        : x.path.startsWith('img/') && EXT_IMAGEN.includes(extension(x.path))));
      // Lo subido desde el gestor (img/subidas/AAAA-MM/) primero, lo más reciente arriba
      const peso = (p) => (p.startsWith('img/subidas/') ? 1 : 0);
      lista.sort((a, b) => peso(b.path) - peso(a.path) || (b.path < a.path ? -1 : b.path > a.path ? 1 : 0));
      return lista.map((x) => ({ ruta: x.path.split('/').map(encodeURIComponent).join('/'), nombre: x.path.split('/').pop(), tamano: x.size, fecha: 0 }));
    }

    if (ruta === '/api/subir' && metodo === 'POST') {
      const nombre = limpiarNombre(u.searchParams.get('nombre') || 'archivo');
      const ext = extension(nombre);
      const esPdf = ext === '.pdf';
      if (!esPdf && !EXT_IMAGEN.includes(ext)) throw error('Solo se aceptan imágenes JPG, PNG, WEBP o GIF, y archivos PDF', 400);
      const archivo = op.body;
      if (!archivo || !archivo.size) throw error('El archivo está vacío', 400);
      if (archivo.size > MAX_SUBIDA) throw error('El archivo es demasiado grande (máximo 40 MB)', 413);
      const carpeta = esPdf ? 'contenidos' : 'img/subidas/' + new Date().toISOString().slice(0, 7);
      const existentes = new Set((await arbol()).map((x) => x.path));
      let final = nombre, n = 1;
      while (existentes.has(carpeta + '/' + final)) final = nombre.slice(0, -ext.length) + '-' + (++n) + ext;
      const rel = carpeta + '/' + final;
      await confirmar('Subir ' + (esPdf ? 'PDF' : 'imagen') + ' ' + final, [{ ruta: rel, bytes: new Uint8Array(await archivo.arrayBuffer()) }]);
      recientes.set(rel, URL.createObjectURL(archivo));
      return { ruta: rel, tamano: archivo.size };
    }

    if (ruta === '/api/indexar' && metodo === 'POST') {
      // El índice lo genera pdftotext en GitHub Actions (.github/workflows/indexar-chat.yml)
      const { pdf, numero, fecha } = cuerpoJSON(op);
      const archivo = decodeURIComponent(String(pdf || '').split('#')[0]);
      if (!/^contenidos\/[^/\\]+\.pdf$/i.test(archivo)) throw error('Primero elige el PDF de la edición (en «Datos generales»).', 400);
      const desde = Date.now() - 60000;
      await gh('/actions/workflows/' + FLUJO_INDICE + '/dispatches', { method: 'POST', body: { ref: RAMA, inputs: { pdf: archivo, numero: String(numero || ''), fecha: String(fecha || '').toLowerCase() } } });
      // Se espera a que termine (normalmente menos de un minuto)
      for (let i = 0; i < 60; i++) {
        await esperar(5000);
        const runs = (await gh('/actions/workflows/' + FLUJO_INDICE + '/runs?event=workflow_dispatch&per_page=5')).workflow_runs
          .filter((r) => Date.parse(r.created_at) >= desde);
        const run = runs[0];
        if (!run || run.status !== 'completed') continue;
        if (run.conclusion === 'success') return { ok: true, mensaje: 'el sitio se actualiza en uno o dos minutos' };
        throw error('No se pudo leer el PDF. Detalles en GitHub: ' + run.html_url, 500);
      }
      throw error('El índice sigue en proceso. Revisa en un rato la pestaña «Actions» del repositorio en GitHub.', 504);
    }

    throw error('No encontrado', 404);
  }

  // Dirección de un archivo para mostrarlo en el gestor o en la vista previa
  const vistaPrevia = (ruta) => recientes.get(decodeURIComponent(String(ruta || '').replace(/^\//, ''))) || '';
  function ajustarVista(html) {
    recientes.forEach((url, ruta) => {
      html = html.split('"' + ruta + '"').join('"' + url + '"').split('"' + encodeURI(ruta) + '"').join('"' + url + '"');
    });
    return html;
  }

  // ---------- Pantalla de entrada: clave de acceso de GitHub en lugar de usuario y contraseña ----------
  const usuario = document.getElementById('usuario');
  if (usuario) {
    usuario.required = false;
    usuario.value = 'github';
    usuario.closest('.campo').hidden = true;
    const clave = document.getElementById('clave');
    clave.autocomplete = 'off';
    clave.placeholder = 'github_pat_…';
    document.querySelector('label[for="clave"]').textContent = 'Clave de acceso de GitHub';
    const ayuda = document.createElement('p');
    ayuda.className = 'ayuda entrar-ayuda';
    ayuda.innerHTML = 'Solo la primera vez en esta computadora. ¿No tienes una? ' +
      '<a href="https://github.com/settings/personal-access-tokens/new?name=Gestor+periodico&amp;description=Gestor+en+linea+del+sitio&amp;target_name=' + DUENO + '&amp;expires_in=366&amp;contents=write&amp;actions=write" target="_blank" rel="noopener">Créala en GitHub</a>: ' +
      'elige el repositorio <strong>' + DUENO + '/' + REPO + '</strong> y en permisos marca ' +
      '<strong>Contents</strong> y <strong>Actions</strong> como «Read and write».';
    clave.closest('.campo').appendChild(ayuda);
    document.querySelector('.entrar-tarjeta > p').textContent = 'Gestor de contenido del portal · en línea';
  }

  window.GestorGitHub = { pedir, vistaPrevia, ajustarVista, repo: DUENO + '/' + REPO };
})();
