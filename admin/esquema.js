// Qué se puede editar en cada sección del gestor.
// Para agregar un campo: súmalo aquí y úsalo en cms/plantilla.js.
//
// Tipos: texto, area (texto largo), md (texto con **negrita** y [enlaces](url)), enlace, imagen, pdf,
// interruptor, numero, grupo (campos agrupados) y lista (elementos que se agregan, ordenan y borran).
const VISIBLE = { c: 'visible', t: 'interruptor', e: 'Mostrar esta sección en la página' };
const ENLACE_TEXTO = [{ c: 'texto', t: 'texto', e: 'Texto' }, { c: 'enlace', t: 'enlace', e: 'Enlace' }];

window.ESQUEMA = [
  {
    clave: 'general', titulo: 'Datos generales', icono: 'ajustes', ancla: 'header',
    descripcion: 'Nombre del periódico, número y fecha de la edición, PDF y redes sociales.',
    campos: [
      { tituloGrupo: 'Edición actual' },
      { c: 'numeroEdicion', t: 'texto', e: 'Número de edición', ej: '3,264', ancho: 'medio' },
      { c: 'fechaEdicion', t: 'texto', e: 'Fecha de la edición', ej: 'Domingo 18 de octubre de 2026', ancho: 'medio' },
      { c: 'epoca', t: 'texto', e: 'Año y época', ancho: 'medio' },
      { c: 'ciudad', t: 'texto', e: 'Ciudad', ancho: 'medio' },
      { c: 'pdfEdicion', t: 'pdf', e: 'PDF de la edición', ayuda: 'Se usa en «Descargar edición PDF» y en la portada impresa.' },
      { tituloGrupo: 'Identidad' },
      { c: 'mancheta', t: 'texto', e: 'Nombre del periódico (mancheta)' },
      { c: 'lema', t: 'texto', e: 'Lema bajo el nombre' },
      { c: 'aniversario', t: 'texto', e: 'Frase del cintillo superior' },
      { c: 'emblema', t: 'imagen', e: 'Emblema', ayuda: 'PNG blanco con fondo transparente.' },
      { tituloGrupo: 'Redes y enlaces' },
      { c: 'facebook', t: 'enlace', e: 'Facebook' },
      { c: 'instagram', t: 'enlace', e: 'Instagram' },
      { c: 'tiktok', t: 'enlace', e: 'TikTok' },
      { c: 'enlaceSuscribete', t: 'enlace', e: 'Enlace de «Suscríbete»' },
      { tituloGrupo: 'Página' },
      { c: 'mostrarEntrada', t: 'interruptor', e: 'Animación del periódico enrollado al entrar' },
      { c: 'aviso', t: 'grupo', e: 'Aviso superior', campos: [
        { c: 'visible', t: 'interruptor', e: 'Mostrar aviso' },
        { c: 'texto', t: 'md', e: 'Texto del aviso' }
      ] },
      { c: 'tituloPagina', t: 'texto', e: 'Título de la pestaña del navegador' },
      { c: 'descripcion', t: 'area', e: 'Descripción para Google', ayuda: 'Una o dos frases. Aparece en los resultados de búsqueda.' }
    ]
  },
  {
    clave: 'menu', base: '', titulo: 'Menú', icono: 'menu', ancla: 'header',
    descripcion: 'Las opciones del menú principal, bajo el nombre del periódico.',
    campos: [
      { c: 'menu', t: 'lista', e: 'Opciones del menú', item: 'opción', tituloItem: 'texto', campos: ENLACE_TEXTO }
    ]
  },
  {
    clave: 'ultimaHora', titulo: 'Última hora', icono: 'rayo', ancla: '.ticker',
    descripcion: 'La cinta de titulares que se desplaza bajo el menú.',
    campos: [
      VISIBLE,
      { c: 'titulo', t: 'texto', e: 'Etiqueta de la cinta' },
      { c: 'notas', t: 'lista', e: 'Titulares', item: 'titular', tituloItem: 'texto', nuevoArriba: true, campos: ENLACE_TEXTO }
    ]
  },
  {
    clave: 'destacadas', titulo: 'Noticias principales', icono: 'estrella', ancla: '#destacadas',
    descripcion: 'El carrusel grande del inicio. Cambia de nota cada 7 segundos.',
    campos: [
      VISIBLE,
      { c: 'notas', t: 'lista', e: 'Notas del carrusel', item: 'nota', tituloItem: 'titulo', imagenItem: 'imagen', nuevoArriba: true, campos: [
        { c: 'imagen', t: 'imagen', e: 'Fotografía', ayuda: 'Horizontal (3:2). Mínimo 1200 px de ancho.' },
        { c: 'alt', t: 'texto', e: 'Descripción de la foto', ayuda: 'Para personas ciegas y para Google. Describe lo que se ve.' },
        { c: 'pie', t: 'texto', e: 'Pie de foto' },
        { c: 'etiqueta', t: 'texto', e: 'Sección', ej: 'Noticia principal · Acontecer diocesano' },
        { c: 'titulo', t: 'area', e: 'Titular', filas: 2 },
        { c: 'resumen', t: 'area', e: 'Resumen' },
        { c: 'autor', t: 'texto', e: 'Autor', ayuda: 'Opcional.', ancho: 'medio' },
        { c: 'paginas', t: 'texto', e: 'Páginas', ej: 'Págs. 12 y 13', ancho: 'medio' },
        { c: 'fecha', t: 'texto', e: 'Fecha' },
        { c: 'enlace', t: 'enlace', e: 'Enlace de la nota', ayuda: 'Para abrir una página del PDF: contenidos/archivo.pdf#page=12' },
        { c: 'textoBoton', t: 'texto', e: 'Texto del botón', ancho: 'medio' },
        { c: 'nombreCorto', t: 'texto', e: 'Nombre corto', ayuda: 'Aparece junto al número, bajo el carrusel.', ancho: 'medio' }
      ] }
    ]
  },
  {
    clave: 'radio', titulo: 'Radio en vivo', icono: 'radio', ancla: '#radio',
    descripcion: 'El reproductor de la emisora.',
    campos: [
      VISIBLE,
      { c: 'nombre', t: 'texto', e: 'Nombre de la emisora' },
      { c: 'descripcion', t: 'texto', e: 'Descripción' },
      { c: 'etiqueta', t: 'texto', e: 'Etiqueta', ancho: 'medio' },
      { c: 'frecuencia', t: 'texto', e: 'Frecuencia (FM)', ej: '98.1', ancho: 'medio', ayuda: 'Mueve la aguja del sintonizador.' },
      { c: 'logo', t: 'imagen', e: 'Logotipo', ayuda: 'Cuadrado, 256 × 256 px.' },
      { c: 'stream', t: 'enlace', e: 'Dirección de la transmisión', ayuda: 'Usa la dirección estable de la emisora, no un enlace con «?zt=…» (caduca en un minuto).' },
      { c: 'nombreCorto', t: 'texto', e: 'Nombre en el botón flotante', ancho: 'medio' },
      { c: 'sitioOficial', t: 'enlace', e: 'Sitio oficial' },
      { c: 'tunein', t: 'enlace', e: 'TuneIn', ayuda: 'Opcional.' }
    ]
  },
  {
    clave: 'edicion', titulo: 'Edición de la semana', icono: 'periodico', ancla: '#edicion',
    descripcion: 'La portada impresa, el Evangelio, los artículos y las columnas.',
    campos: [
      VISIBLE,
      { c: 'titulo', t: 'texto', e: 'Título de la sección' },
      { tituloGrupo: 'Portada impresa' },
      { c: 'portada', t: 'imagen', e: 'Imagen de la portada', ayuda: 'Vertical. Exporta la página 1 del PDF como JPG.' },
      { c: 'altPortada', t: 'texto', e: 'Descripción de la portada' },
      { c: 'liturgia', t: 'texto', e: 'Domingo litúrgico', ej: 'XXIX Domingo del Tiempo Ordinario' },
      { c: 'pesoPdf', t: 'texto', e: 'Tamaño del PDF', ej: '12 MB', ancho: 'medio' },
      { c: 'enlaceAnteriores', t: 'enlace', e: '«Ver ediciones anteriores»', ancho: 'medio' },
      { c: 'evangelio', t: 'grupo', e: 'El Evangelio del domingo', campos: [
        { c: 'visible', t: 'interruptor', e: 'Mostrar recuadro' },
        { c: 'etiqueta', t: 'texto', e: 'Cita', ej: 'El Evangelio del domingo · Mt 22, 1-14' },
        { c: 'titulo', t: 'area', e: 'Título', filas: 2 },
        { c: 'enlace', t: 'enlace', e: 'Enlace' },
        { c: 'texto', t: 'md', e: 'Texto' },
        { c: 'nota', t: 'texto', e: 'Nota al pie' }
      ] },
      { c: 'articulos', t: 'lista', e: 'Artículos', item: 'artículo', tituloItem: 'titulo', imagenItem: 'imagen', campos: [
        { c: 'etiqueta', t: 'texto', e: 'Sección', ej: 'Editorial' },
        { c: 'titulo', t: 'area', e: 'Titular', filas: 2 },
        { c: 'resumen', t: 'area', e: 'Resumen', filas: 2 },
        { c: 'enlace', t: 'enlace', e: 'Enlace' },
        { c: 'imagen', t: 'imagen', e: 'Foto (opcional)', ayuda: 'Con foto, el artículo ocupa el doble de alto.' },
        { c: 'alt', t: 'texto', e: 'Descripción de la foto' }
      ] },
      { c: 'tituloColumnas', t: 'texto', e: 'Título de las columnas' },
      { c: 'columnas', t: 'lista', e: 'Columnas de opinión', item: 'columna', tituloItem: 'titulo', campos: [
        { c: 'autor', t: 'texto', e: 'Autor', ayuda: 'Las iniciales del círculo salen del nombre.' },
        { c: 'titulo', t: 'texto', e: 'Título' },
        { c: 'enlace', t: 'enlace', e: 'Enlace' }
      ] }
    ]
  },
  {
    clave: 'extra', titulo: 'Más allá del impreso', icono: 'web', ancla: '#extra',
    descripcion: 'Cobertura especial y notas «Al día» que solo salen en la web.',
    campos: [
      VISIBLE,
      { c: 'etiqueta', t: 'texto', e: 'Etiqueta', ancho: 'medio' },
      { c: 'titulo', t: 'texto', e: 'Título', ancho: 'medio' },
      { c: 'subtitulo', t: 'texto', e: 'Subtítulo' },
      { c: 'filtros', t: 'lista', e: 'Etiquetas de tipo', item: 'etiqueta', tituloItem: 'texto', campos: [{ c: 'texto', t: 'texto', e: 'Texto' }] },
      { c: 'cobertura', t: 'grupo', e: 'Cobertura especial', campos: [
        { c: 'imagen', t: 'imagen', e: 'Fotografía' },
        { c: 'alt', t: 'texto', e: 'Descripción de la foto' },
        { c: 'pie', t: 'texto', e: 'Pie de foto' },
        { c: 'etiqueta', t: 'texto', e: 'Sección', ancho: 'medio' },
        { c: 'paginas', t: 'texto', e: 'Páginas', ancho: 'medio' },
        { c: 'titulo', t: 'area', e: 'Titular', filas: 2 },
        { c: 'resumen', t: 'area', e: 'Resumen' },
        { c: 'enlace', t: 'enlace', e: 'Enlace' }
      ] },
      { c: 'tituloAlDia', t: 'texto', e: 'Título de la lista' },
      { c: 'alDia', t: 'lista', e: 'Notas al día', item: 'nota', tituloItem: 'texto', nuevoArriba: true, campos: [
        { c: 'fecha', t: 'texto', e: 'Fecha', ej: '18 oct', ancho: 'medio' },
        { c: 'texto', t: 'area', e: 'Titular', filas: 2 },
        { c: 'enlace', t: 'enlace', e: 'Enlace' }
      ] }
    ]
  },
  {
    clave: 'redes', titulo: 'Redes sociales', icono: 'redes', ancla: '#redes',
    descripcion: 'Publicaciones de Facebook y fotos de Instagram y TikTok.',
    campos: [
      VISIBLE,
      { c: 'titulo', t: 'texto', e: 'Título' },
      { c: 'texto', t: 'md', e: 'Texto' },
      { c: 'facebook', t: 'grupo', e: 'Facebook', campos: [
        { c: 'usuario', t: 'texto', e: 'Usuario', ej: '@comunidadxna' },
        { c: 'texto', t: 'texto', e: 'Descripción' },
        { c: 'publicaciones', t: 'lista', e: 'Publicaciones', item: 'publicación', tituloItem: 'enlace', nuevoArriba: true,
          ayuda: 'En Facebook: abre la publicación → «…» → «Copiar enlace» y pégalo aquí. Sirven publicaciones, fotos, videos y reels.',
          campos: [{ c: 'enlace', t: 'enlace', e: 'Enlace de la publicación' }] }
      ] },
      { c: 'instagram', t: 'grupo', e: 'Instagram', campos: [
        { c: 'texto', t: 'texto', e: 'Descripción' },
        { c: 'fotos', t: 'lista', e: 'Fotos (hasta 6)', item: 'foto', imagenItem: 'imagen', max: 6, ayuda: 'Sin fotos se muestran recuadros de color.', campos: [
          { c: 'imagen', t: 'imagen', e: 'Foto' }, { c: 'enlace', t: 'enlace', e: 'Enlace a la publicación' }
        ] }
      ] },
      { c: 'tiktok', t: 'grupo', e: 'TikTok', campos: [
        { c: 'texto', t: 'texto', e: 'Descripción' },
        { c: 'fotos', t: 'lista', e: 'Portadas de video (hasta 2)', item: 'video', imagenItem: 'imagen', max: 2, campos: [
          { c: 'imagen', t: 'imagen', e: 'Portada (vertical)' }, { c: 'enlace', t: 'enlace', e: 'Enlace al video' }
        ] }
      ] }
    ]
  },
  {
    clave: 'historia', titulo: 'Nuestra historia', icono: 'historia', ancla: '#historia',
    descripcion: 'Quiénes somos y la línea del tiempo del semanario.',
    campos: [
      VISIBLE,
      { c: 'etiqueta', t: 'texto', e: 'Etiqueta' },
      { c: 'titulo', t: 'area', e: 'Título', filas: 2 },
      { c: 'texto', t: 'md', e: 'Texto' },
      { c: 'boton1', t: 'grupo', e: 'Botón principal', compacto: true, campos: ENLACE_TEXTO },
      { c: 'boton2', t: 'grupo', e: 'Botón secundario', compacto: true, campos: ENLACE_TEXTO },
      { c: 'hitos', t: 'lista', e: 'Línea del tiempo', item: 'momento', tituloItem: 'titulo', campos: [
        { c: 'anio', t: 'texto', e: 'Año', ancho: 'medio' },
        { c: 'destacado', t: 'interruptor', e: 'Año en carmesí', ancho: 'medio' },
        { c: 'titulo', t: 'texto', e: 'Título' },
        { c: 'texto', t: 'texto', e: 'Descripción' }
      ] }
    ]
  },
  {
    clave: 'pie', titulo: 'Pie de página', icono: 'pie', ancla: '#pie',
    descripcion: 'Contacto, enlaces de servicios y avisos legales.',
    campos: [
      { c: 'descripcion', t: 'area', e: 'Descripción', filas: 2 },
      { tituloGrupo: 'Contacto' },
      { c: 'direccion', t: 'texto', e: 'Dirección' },
      { c: 'telefono', t: 'texto', e: 'Teléfono', ancho: 'medio' },
      { c: 'correo', t: 'texto', e: 'Correo', ancho: 'medio' },
      { c: 'horario', t: 'texto', e: 'Horario' },
      { tituloGrupo: 'Enlaces' },
      { c: 'secciones', t: 'lista', e: 'Secciones', item: 'enlace', tituloItem: 'texto', campos: ENLACE_TEXTO },
      { c: 'servicios', t: 'lista', e: 'Servicios', item: 'enlace', tituloItem: 'texto', campos: ENLACE_TEXTO },
      { c: 'legales', t: 'lista', e: 'Enlaces legales', item: 'enlace', tituloItem: 'texto', campos: ENLACE_TEXTO },
      { c: 'derechos', t: 'texto', e: 'Derechos reservados' }
    ]
  },
  {
    clave: 'chat', titulo: 'Chat del periódico', icono: 'chat', ancla: null,
    descripcion: 'El asistente «Pregúntale al periódico», que busca en el texto de la edición.',
    campos: [
      VISIBLE,
      { t: 'accion', accion: 'indexar', e: 'Leer la edición nueva', ayuda: 'Cuando subas el PDF de una edición nueva, presiona este botón para que el chat aprenda su contenido. Usa el PDF, número y fecha de «Datos generales».' },
      { c: 'sumario', t: 'lista', e: 'Sumario', item: 'tema', tituloItem: 'titulo',
        ayuda: 'Lo que responde el chat a «¿Qué trae esta edición?».', campos: [
        { c: 'titulo', t: 'texto', e: 'Tema' },
        { c: 'pagina', t: 'texto', e: 'Página impresa', ej: '12 y 13', ancho: 'medio' },
        { c: 'hoja', t: 'numero', e: 'Hoja del PDF', ancho: 'medio', ayuda: 'A veces no coincide con la página impresa.' }
      ] },
      { c: 'sugerencias', t: 'lista', e: 'Preguntas sugeridas', item: 'pregunta', tituloItem: 'texto', campos: [
        { c: 'texto', t: 'texto', e: 'Botón' },
        { c: 'busqueda', t: 'texto', e: 'Palabras que busca', ayuda: '«sumario» muestra el sumario; «director», el directorio.' }
      ] }
    ]
  }
];
