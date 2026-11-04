// Genera el índice que usa el chat del periódico a partir del PDF de una edición.
//
// Uso (desde la carpeta del proyecto; requiere pdftotext, incluido en Git para Windows):
//   node herramientas/indexar-edicion.js "contenidos/Edicion 3263.pdf" 3,263 "domingo 11 de octubre de 2026"
//
// Crea contenidos/edicion-chat.js. Después, confirma en el PDF que la numeración de páginas siga
// la regla de paginaImpresa (abajo): cambia si la edición trae una doble página en otro lugar.
const { execFileSync } = require('child_process');
const fs = require('fs');

const [pdf, numero, fecha] = process.argv.slice(2);
if (!pdf || !numero || !fecha) {
  console.error('Uso: node herramientas/indexar-edicion.js <pdf> <numero> <fecha>');
  process.exit(1);
}

// La doble página 12-13 ocupa una sola hoja del PDF: desde ahí, la página impresa es la del PDF + 1
const paginaImpresa = (p) => (p <= 12 ? p : p + 1);
const OMITIR = new Set([1]); // la portada solo repite titulares

const MIN_PALABRAS = 12, MAX_PALABRAS = 110;
const contar = (t) => t.split(/\s+/).filter(Boolean).length;
const hojas = execFileSync('pdftotext', ['-enc', 'UTF-8', pdf, '-'], { maxBuffer: 1e8 }).toString('utf8').split('\f');

const pasajes = [];
hojas.forEach((hoja, i) => {
  const p = i + 1;
  if (OMITIR.has(p) || !hoja.trim()) return;
  const lineas = hoja.normalize('NFKC').split(/\r?\n/).map((l) => l.replace(/\s+/g, ' ').trim());

  // 1. Quitar folios y unir las líneas que un cambio de columna dejó partidas
  const parrafos = [];
  let abierto = false;
  for (const l of lineas) {
    if (!l) continue;
    if (/^Comunidad Cristiana, domingo/i.test(l) || /^\d{1,2}$/.test(l)) continue;
    if (/^\d{1,2} [A-ZÁÉÍÓÚÑ ]+$/.test(l) || /^[A-ZÁÉÍÓÚÑ ]+ \d{1,2}$/.test(l)) continue;
    const previo = parrafos[parrafos.length - 1];
    if (abierto && previo && /^[a-záéíóúñ(«"“]/.test(l)) {
      parrafos[parrafos.length - 1] = previo.replace(/-$/, '') + (previo.endsWith('-') ? '' : ' ') + l;
    } else parrafos.push(l);
    abierto = !/[.!?:;»”"]$/.test(parrafos[parrafos.length - 1]);
  }

  // 2. Agrupar en pasajes; las líneas cortas sin punto final funcionan como título del pasaje siguiente
  let titulo = '', subtitulos = '', actual = [], enTitulos = false;
  const cerrar = () => {
    const t = actual.join(' ');
    // El sumario impreso ("16-19 PASTORAL") solo repite títulos: no debe ganarle a los artículos
    if (contar(t) >= MIN_PALABRAS && !/^\d+(-\d+)? /.test(titulo)) {
      pasajes.push(Object.assign({ p, i: paginaImpresa(p), h: titulo, t }, subtitulos ? { k: subtitulos } : {}));
    }
    actual = [];
  };
  for (const par of parrafos) {
    const esTitulo = par.length < 100 && contar(par) <= 16 && !/[.!?;:,]$/.test(par);
    if (esTitulo) {
      cerrar();
      // En una serie de líneas cortas, la primera es el titular; las siguientes (balazo, autor) solo sirven para buscar.
      // DIRECTORIO abre siempre su propio bloque: en la hoja viene justo después del sumario.
      if (!enTitulos || par === 'DIRECTORIO') { titulo = par; subtitulos = ''; }
      else subtitulos = (subtitulos + ' ' + par).trim();
      enTitulos = true;
      continue;
    }
    // Una línea corta con coma suele ser la firma del autor: no interrumpe la serie de títulos
    if (contar(par) >= MIN_PALABRAS) enTitulos = false;
    if (contar(actual.join(' ')) + contar(par) > MAX_PALABRAS && actual.length) cerrar();
    actual.push(par);
  }
  cerrar();
});

const salida = '// Generado por herramientas/indexar-edicion.js. No editar a mano.\n' +
  'window.EDICION_CHAT = ' + JSON.stringify({ numero, fecha, pdf: 'contenidos/' + encodeURIComponent(pdf.split('/').pop()), pasajes }) + ';\n';
fs.writeFileSync('contenidos/edicion-chat.js', salida);
console.log(pasajes.length + ' pasajes, ' + Math.round(salida.length / 1024) + ' KB');
