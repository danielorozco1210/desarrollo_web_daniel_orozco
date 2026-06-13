/* ============================================
   CC5002 - Tarea 2: Validaciones JavaScript (cliente)
   Las MISMAS validaciones se replican en el servidor (app.py).
   ============================================ */

/* ---- Utilidades genéricas para marcar/limpiar errores ---- */
function marcarError(elemento, mensaje) {
  if (!elemento) return;
  elemento.classList.add('campo-error');
  var contenedor = elemento.closest('.grupo-campo') || elemento.parentElement;
  if (contenedor) {
    var span = contenedor.querySelector('.mensaje-error');
    if (span) {
      span.textContent = mensaje;
      span.classList.add('visible');
    }
  }
}

function limpiarErrorElemento(elemento) {
  if (!elemento) return;
  elemento.classList.remove('campo-error');
  var contenedor = elemento.closest('.grupo-campo') || elemento.parentElement;
  if (contenedor) {
    var span = contenedor.querySelector('.mensaje-error');
    if (span) {
      span.textContent = '';
      span.classList.remove('visible');
    }
  }
}

function limpiarTodosLosErrores(idFormulario) {
  var form = document.getElementById(idFormulario);
  if (!form) return;
  var campos = form.querySelectorAll('.campo-error');
  for (var i = 0; i < campos.length; i++) {
    campos[i].classList.remove('campo-error');
  }
  var mensajes = form.querySelectorAll('.mensaje-error');
  for (var j = 0; j < mensajes.length; j++) {
    mensajes[j].textContent = '';
    mensajes[j].classList.remove('visible');
  }
}

/* ---- Validadores de formato ---- */
function esTextoValido(valor) {
  return valor !== null && valor !== undefined && String(valor).trim().length > 0;
}

function esNombrePersonaValido(nombre) {
  if (!esTextoValido(nombre)) return false;
  var limpio = nombre.trim();
  if (limpio.length < 3 || limpio.length > 255) return false;
  return /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s\.\-']+$/.test(limpio);
}

function esEmailValido(email) {
  var patron = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
  return patron.test((email || '').trim());
}

function esTelefonoValido(telefono) {
  var patron = /^(\+56)?9\d{8}$/;
  return patron.test((telefono || '').trim().replace(/\s/g, ''));
}

function esHoraValida(hora) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test((hora || '').trim());
}

function esArchivoMultimediaValido(inputFile) {
  if (!inputFile.files || inputFile.files.length === 0) return false;
  var permitidas = [
    '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp',
    '.mp4', '.avi', '.mov', '.mkv', '.webm'
  ];
  for (var i = 0; i < inputFile.files.length; i++) {
    var nombre = inputFile.files[i].name.toLowerCase();
    var ok = false;
    for (var j = 0; j < permitidas.length; j++) {
      if (nombre.indexOf(permitidas[j], nombre.length - permitidas[j].length) !== -1) {
        ok = true;
        break;
      }
    }
    if (!ok) return false;
  }
  return true;
}

/* ============================================
   Validación del formulario completo
   ============================================ */
function validarFormularioRegistro() {
  var form = document.getElementById('form-registro');
  if (!form) return false;

  limpiarTodosLosErrores('form-registro');
  var esValido = true;

  /* --- Miembro --- */
  var nombre = document.getElementById('nombre');
  if (!esTextoValido(nombre.value)) {
    marcarError(nombre, 'El nombre es obligatorio.');
    esValido = false;
  } else if (!esNombrePersonaValido(nombre.value)) {
    marcarError(nombre, 'Sólo letras y espacios. Largo entre 3 y 255 caracteres.');
    esValido = false;
  }

  var email = document.getElementById('email');
  if (!esTextoValido(email.value)) {
    marcarError(email, 'El correo es obligatorio.');
    esValido = false;
  } else if (!esEmailValido(email.value)) {
    marcarError(email, 'Formato de correo inválido.');
    esValido = false;
  } else if (email.value.trim().length > 80) {
    marcarError(email, 'Máximo 80 caracteres.');
    esValido = false;
  }

  var telefono = document.getElementById('telefono');
  if (!esTextoValido(telefono.value)) {
    marcarError(telefono, 'El teléfono es obligatorio.');
    esValido = false;
  } else if (!esTelefonoValido(telefono.value)) {
    marcarError(telefono, 'Formato inválido. Use +569XXXXXXXX o 9XXXXXXXX.');
    esValido = false;
  }

  var region = document.getElementById('region_id');
  if (!region.value) {
    marcarError(region, 'Debe seleccionar una región.');
    esValido = false;
  }

  var comuna = document.getElementById('comuna_id');
  if (!comuna.value) {
    marcarError(comuna, 'Debe seleccionar una comuna.');
    esValido = false;
  }

  /* --- Actividades --- */
  var tarjetas = document.querySelectorAll('#contenedor-actividades .tarjeta-actividad');
  if (tarjetas.length === 0) {
    alert('Debe registrar al menos una actividad.');
    esValido = false;
  } else {
    for (var i = 0; i < tarjetas.length; i++) {
      if (!validarTarjetaActividad(tarjetas[i])) {
        esValido = false;
      }
    }
  }

  if (!esValido) {
    // Hacer scroll al primer error
    var primerError = form.querySelector('.campo-error, .mensaje-error.visible');
    if (primerError) {
      primerError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  return esValido;
}

function validarTarjetaActividad(tarjeta) {
  var ok = true;

  var nombre = tarjeta.querySelector('input[name="act_nombre[]"]');
  if (!esTextoValido(nombre.value)) {
    marcarError(nombre, 'Nombre obligatorio.');
    ok = false;
  } else if (nombre.value.trim().length < 3) {
    marcarError(nombre, 'Mínimo 3 caracteres.');
    ok = false;
  } else if (nombre.value.trim().length > 45) {
    marcarError(nombre, 'Máximo 45 caracteres.');
    ok = false;
  }

  var tipo = tarjeta.querySelector('select[name="act_tipo[]"]');
  if (!tipo.value) {
    marcarError(tipo, 'Seleccione un tipo.');
    ok = false;
  }

  var dia = tarjeta.querySelector('select[name="act_dia[]"]');
  if (!dia.value) {
    marcarError(dia, 'Seleccione un día.');
    ok = false;
  }

  var hora = tarjeta.querySelector('input[name="act_hora_inicio[]"]');
  if (!esHoraValida(hora.value)) {
    marcarError(hora, 'Hora inválida (HH:MM).');
    ok = false;
  }

  var duracion = tarjeta.querySelector('input[name="act_duracion[]"]');
  if (!esHoraValida(duracion.value)) {
    marcarError(duracion, 'Duración inválida (HH:MM).');
    ok = false;
  }

  var descripcion = tarjeta.querySelector('textarea[name="act_descripcion[]"]');
  if (descripcion && descripcion.value.length > 500) {
    marcarError(descripcion, 'Máximo 500 caracteres.');
    ok = false;
  }

  var fotos = tarjeta.querySelector('.input-fotos');
  if (!fotos.files || fotos.files.length === 0) {
    marcarError(fotos, 'Debe subir al menos una foto o video.');
    ok = false;
  } else if (!esArchivoMultimediaValido(fotos)) {
    marcarError(fotos, 'Archivos no permitidos. Use jpg, png, gif, webp, mp4, avi, mov, mkv, webm.');
    ok = false;
  }

  return ok;
}

/* Limpiar errores en vivo cuando el usuario edita */
document.addEventListener('input', function (e) {
  if (e.target && (e.target.matches('input, select, textarea'))) {
    limpiarErrorElemento(e.target);
  }
});

function resetearFormularioCompleto() {
  // Lo deja con sólo una tarjeta vacía
  var contenedor = document.getElementById('contenedor-actividades');
  if (contenedor) contenedor.innerHTML = '';
  // Pequeño delay para que reset() del form ocurra primero
  setTimeout(function () {
    if (typeof agregarActividad === 'function') agregarActividad();
    limpiarTodosLosErrores('form-registro');
  }, 0);
}
