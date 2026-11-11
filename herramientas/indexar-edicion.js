// Genera el índice que usa el chat del periódico a partir del PDF de una edición.
//
// Uso (desde la carpeta del proyecto; requiere pdftotext, incluido en Git para Windows):
//   node herramientas/indexar-edicion.js "contenidos/Edicion 3263.pdf" 3,263 "domingo 11 de octubre de 2026"
//
// Crea contenidos/edicion-chat.js. Las reglas para armar el índice están en herramientas/indice-chat.js.
const { execFileSync } = require('child_process');
const fs = require('fs');
const { generar } = require('./indice-chat.js');

const [pdf, numero, fecha] = process.argv.slice(2);
if (!pdf || !numero || !fecha) {
  console.error('Uso: node herramientas/indexar-edicion.js <pdf> <numero> <fecha>');
  process.exit(1);
}

const hojas = execFileSync('pdftotext', ['-enc', 'UTF-8', pdf, '-'], { maxBuffer: 1e8 }).toString('utf8').split('\f');
const r = generar(hojas, numero, fecha, pdf);
fs.writeFileSync('contenidos/edicion-chat.js', r.contenido);
console.log(r.mensaje);
