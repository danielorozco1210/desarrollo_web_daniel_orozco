/* ============================================
   CC5002 - Tarea 2: Lógica de la página de registro
   - Cascada Región -> Comuna (consulta el endpoint /api/comunas/<id>)
   - Agregar/eliminar tarjetas de actividad dinámicamente
   ============================================ */

var contadorActividades = 0;

/* ---- Cascada Región -> Comuna ---- */
function cargarComunas(regionId, comunaSeleccionada) {
  var selectComuna = document.getElementById('comuna_id');
  if (!selectComuna) return;

  // Reset
  selectComuna.innerHTML = '<option value="">Cargando...</option>';
  selectComuna.disabled = true;

  if (!regionId) {
    selectComuna.innerHTML = '<option value="">— Primero seleccione una región —</option>';
    selectComuna.disabled = false;
    return;
  }

  fetch('/api/comunas/' + encodeURIComponent(regionId))
    .then(function (resp) {
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      return resp.json();
    })
    .then(function (lista) {
      selectComuna.innerHTML = '<option value="">— Seleccione una comuna —</option>';
      for (var i = 0; i < lista.length; i++) {
        var opt = document.createElement('option');
        opt.value = lista[i].id;
        opt.textContent = lista[i].nombre;
        if (comunaSeleccionada && String(lista[i].id) === String(comunaSeleccionada)) {
          opt.selected = true;
        }
        selectComuna.appendChild(opt);
      }
      selectComuna.disabled = false;
    })
    .catch(function (err) {
      console.error('Error cargando comunas:', err);
      selectComuna.innerHTML = '<option value="">Error al cargar</option>';
      selectComuna.disabled = false;
    });
}

/* ---- Manejo dinámico de actividades ---- */
function actualizarNumerosActividad() {
  var tarjetas = document.querySelectorAll('#contenedor-actividades .tarjeta-actividad');
  for (var i = 0; i < tarjetas.length; i++) {
    var num = tarjetas[i].querySelector('.numero-actividad');
    if (num) num.textContent = String(i + 1);
    tarjetas[i].setAttribute('data-indice', String(i));

    // Re-nombrar el input file con el índice correcto: act_fotos_<i>
    var inputFotos = tarjetas[i].querySelector('.input-fotos');
    if (inputFotos) {
      inputFotos.name = 'act_fotos_' + i;
    }
  }
}

function agregarActividad() {
  var plantilla = document.getElementById('plantilla-actividad');
  var contenedor = document.getElementById('contenedor-actividades');
  if (!plantilla || !contenedor) return;

  // Clonar contenido del template
  var clon = plantilla.content.cloneNode(true);
  contenedor.appendChild(clon);

  contadorActividades++;
  actualizarNumerosActividad();

  // Scroll suave a la nueva tarjeta
  var tarjetas = contenedor.querySelectorAll('.tarjeta-actividad');
  if (tarjetas.length > 0) {
    tarjetas[tarjetas.length - 1].scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function eliminarActividad(boton) {
  var tarjeta = boton.closest('.tarjeta-actividad');
  if (!tarjeta) return;

  var contenedor = document.getElementById('contenedor-actividades');
  // No permitir eliminar la última: debe haber al menos una
  if (contenedor.querySelectorAll('.tarjeta-actividad').length <= 1) {
    alert('Debe haber al menos una actividad. Si desea reiniciarla, use "Limpiar Formulario".');
    return;
  }
  if (confirm('¿Eliminar esta actividad?')) {
    tarjeta.remove();
    actualizarNumerosActividad();
  }
}

/* ---- Inicialización ---- */
document.addEventListener('DOMContentLoaded', function () {

  // Cascada región -> comuna
  var selectRegion = document.getElementById('region_id');
  if (selectRegion) {
    selectRegion.addEventListener('change', function () {
      cargarComunas(this.value, null);
    });

    // Si veníamos de un error de servidor y había región seleccionada, cargar comunas
    var datos = window.DATOS_INICIALES || {};
    if (datos.regionSeleccionada) {
      cargarComunas(datos.regionSeleccionada, datos.comunaSeleccionada);
    }
  }

  // Asegurar que las tarjetas pre-renderizadas (caso de errores del servidor)
  // tengan los inputs file correctamente nombrados.
  actualizarNumerosActividad();

  // Si no hay tarjetas todavía, agregar la primera automáticamente
  var contenedor = document.getElementById('contenedor-actividades');
  if (contenedor && contenedor.querySelectorAll('.tarjeta-actividad').length === 0) {
    agregarActividad();
  }
});
