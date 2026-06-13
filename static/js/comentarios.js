/* ============================================
   CC5002 - Tarea 3: Comentarios en actividades
   - cargarComentarios(actividadId): GET /api/comentarios/<id>
   - agregarComentario(actividadId): POST /api/comentarios/<id>
   Ambas funciones usan fetch (asíncrono).
   ============================================ */

/* ---- Cargar y mostrar comentarios de una actividad ---- */
function cargarComentarios(actividadId) {
  var contenedor = document.getElementById('listado-comentarios-' + actividadId);
  if (!contenedor) return;

  fetch('/api/comentarios/' + actividadId)
    .then(function(resp) {
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      return resp.json();
    })
    .then(function(comentarios) {
      // Si no hay comentarios, mostrar mensaje
      if (comentarios.length === 0) {
        contenedor.innerHTML = '<p class="nota-campo">Aún no hay comentarios.</p>';
        return;
      }

      // Construir HTML con la lista de comentarios
      var html = '<ul class="lista-comentarios">';
      for (var i = 0; i < comentarios.length; i++) {
        var c = comentarios[i];
        html += '<li class="item-comentario">'
              +   '<span class="comentario-nombre">' + escaparHTML(c.nombre) + '</span>'
              +   '<span class="comentario-fecha">' + c.fecha + '</span>'
              +   '<p class="comentario-texto">' + escaparHTML(c.texto) + '</p>'
              + '</li>';
      }
      html += '</ul>';
      contenedor.innerHTML = html;
    })
    .catch(function(err) {
      console.error('Error cargando comentarios:', err);
      contenedor.innerHTML = '<p class="alerta alerta-error">Error al cargar comentarios.</p>';
    });
}

/* ---- Validar campos del formulario de comentario (lado cliente) ---- */
function validarComentario(nombre, texto, contenedorForm) {
  var esValido = true;

  // Limpiar errores previos
  var spans = contenedorForm.querySelectorAll('.mensaje-error');
  for (var i = 0; i < spans.length; i++) {
    spans[i].textContent = '';
    spans[i].classList.remove('visible');
  }

  var inputNombre = contenedorForm.querySelector('.input-nombre-comentario');
  var inputTexto  = contenedorForm.querySelector('.input-texto-comentario');

  // Validar nombre: obligatorio, 3-80 caracteres
  if (!nombre || nombre.trim().length < 3) {
    mostrarErrorCampo(inputNombre, 'El nombre debe tener al menos 3 caracteres.');
    esValido = false;
  } else if (nombre.trim().length > 80) {
    mostrarErrorCampo(inputNombre, 'El nombre no puede superar 80 caracteres.');
    esValido = false;
  }

  // Validar texto: obligatorio, mínimo 5 caracteres
  if (!texto || texto.trim().length < 5) {
    mostrarErrorCampo(inputTexto, 'El comentario debe tener al menos 5 caracteres.');
    esValido = false;
  } else if (texto.trim().length > 300) {
    mostrarErrorCampo(inputTexto, 'El comentario no puede superar 300 caracteres.');
    esValido = false;
  }

  return esValido;
}

/* ---- Marcar un campo con error ---- */
function mostrarErrorCampo(input, mensaje) {
  if (!input) return;
  input.classList.add('campo-error');
  // El span de error es el siguiente elemento hermano
  var span = input.nextElementSibling;
  if (span && span.classList.contains('mensaje-error')) {
    span.textContent = mensaje;
    span.classList.add('visible');
  }
}

/* ---- Enviar un nuevo comentario al servidor ---- */
function agregarComentario(actividadId) {
  // Buscar el formulario de esta actividad
  var seccion = document.getElementById('comentarios-act-' + actividadId);
  if (!seccion) return;

  var inputNombre = seccion.querySelector('.input-nombre-comentario');
  var inputTexto  = seccion.querySelector('.input-texto-comentario');
  var pResultado  = seccion.querySelector('.mensaje-resultado-comentario');

  var nombre = inputNombre ? inputNombre.value : '';
  var texto  = inputTexto  ? inputTexto.value  : '';

  // Limpiar clase de error de los inputs antes de re-validar
  seccion.querySelectorAll('.campo-error').forEach(function(el) {
    el.classList.remove('campo-error');
  });

  // Validación en el cliente antes de enviar
  var formularioContenedor = seccion.querySelector('.formulario-comentario');
  if (!validarComentario(nombre, texto, formularioContenedor)) return;

  // Enviar datos al servidor con fetch (POST JSON)
  fetch('/api/comentarios/' + actividadId, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre: nombre.trim(), texto: texto.trim() })
  })
    .then(function(resp) {
      return resp.json().then(function(data) {
        // Adjuntamos el status HTTP al objeto para manejarlo después
        data._status = resp.status;
        return data;
      });
    })
    .then(function(data) {
      if (data._status === 201) {
        // Éxito: limpiar campos y recargar la lista de comentarios
        inputNombre.value = '';
        inputTexto.value  = '';
        pResultado.textContent = '¡Comentario agregado!';
        pResultado.className = 'mensaje-resultado-comentario alerta alerta-exito';
        cargarComentarios(actividadId);   // recargar lista

        // Ocultar el mensaje de éxito después de 3 segundos
        setTimeout(function() {
          pResultado.textContent = '';
          pResultado.className = 'mensaje-resultado-comentario';
        }, 3000);

      } else {
        // Error de validación del servidor
        var msg = data.error || 'Error al guardar el comentario.';
        pResultado.textContent = msg;
        pResultado.className = 'mensaje-resultado-comentario alerta alerta-error';
      }
    })
    .catch(function(err) {
      console.error('Error enviando comentario:', err);
      pResultado.textContent = 'Error de red. Intente nuevamente.';
      pResultado.className = 'mensaje-resultado-comentario alerta alerta-error';
    });
}

/* ---- Escapar HTML para evitar XSS al insertar texto del usuario ---- */
function escaparHTML(str) {
  var div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

/* ---- Al cargar la página, cargar comentarios de todas las actividades ---- */
document.addEventListener('DOMContentLoaded', function() {
  // Busca todos los contenedores de comentarios y carga cada uno
  var contenedores = document.querySelectorAll('[id^="listado-comentarios-"]');
  for (var i = 0; i < contenedores.length; i++) {
    // Extraer el id de actividad del id del elemento
    var actId = contenedores[i].id.replace('listado-comentarios-', '');
    cargarComentarios(actId);
  }
});
