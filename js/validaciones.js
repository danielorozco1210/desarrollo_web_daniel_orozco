/* ============================================
   CC5002 - Tarea 1: Validaciones JavaScript
   Todas las validaciones de formularios
   ============================================ */

/**
 * Muestra un mensaje de error bajo un campo.
 * @param {string} idCampo - ID del input.
 * @param {string} mensaje - Texto del error.
 */
function mostrarError(idCampo, mensaje) {
  var campo = document.getElementById(idCampo);
  var contenedor = campo.closest(".grupo-campo") || campo.parentElement;
  var errorSpan = contenedor.querySelector(".mensaje-error");

  campo.classList.add("campo-error");
  if (errorSpan) {
    errorSpan.textContent = mensaje;
    errorSpan.classList.add("visible");
  }
}

/**
 * Limpia el estado de error de un campo.
 * @param {string} idCampo - ID del input.
 */
function limpiarError(idCampo) {
  var campo = document.getElementById(idCampo);
  if (!campo) return;
  var contenedor = campo.closest(".grupo-campo") || campo.parentElement;
  var errorSpan = contenedor.querySelector(".mensaje-error");

  campo.classList.remove("campo-error");
  if (errorSpan) {
    errorSpan.textContent = "";
    errorSpan.classList.remove("visible");
  }
}

/**
 * Limpia todos los errores del formulario.
 * @param {string} idFormulario - ID del formulario.
 */
function limpiarTodosLosErrores(idFormulario) {
  var form = document.getElementById(idFormulario);
  var campos = form.querySelectorAll(".campo-error");
  for (var i = 0; i < campos.length; i++) {
    campos[i].classList.remove("campo-error");
  }
  var mensajes = form.querySelectorAll(".mensaje-error");
  for (var j = 0; j < mensajes.length; j++) {
    mensajes[j].textContent = "";
    mensajes[j].classList.remove("visible");
  }
}

/**
 * Valida que un campo de texto no esté vacío.
 * @param {string} valor
 * @returns {boolean}
 */
function esTextoValido(valor) {
  return valor !== null && valor.trim().length > 0;
}

/**
 * Valida formato de email.
 * @param {string} email
 * @returns {boolean}
 */
function esEmailValido(email) {
  var patron = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
  return patron.test(email.trim());
}

/**
 * Valida formato de teléfono chileno (+569XXXXXXXX o 9XXXXXXXX).
 * @param {string} telefono
 * @returns {boolean}
 */
function esTelefonoValido(telefono) {
  var patron = /^(\+56)?9\d{8}$/;
  return patron.test(telefono.trim().replace(/\s/g, ""));
}

/**
 * Valida formato de RUT chileno (XX.XXX.XXX-X o XXXXXXXX-X).
 * @param {string} rut
 * @returns {boolean}
 */
function esRutValido(rut) {
  var rutLimpio = rut.trim().replace(/\./g, "").replace(/-/g, "");
  if (rutLimpio.length < 8 || rutLimpio.length > 9) return false;

  var cuerpo = rutLimpio.slice(0, -1);
  var digitoVerificador = rutLimpio.slice(-1).toUpperCase();

  if (!/^\d+$/.test(cuerpo)) return false;

  var suma = 0;
  var multiplo = 2;
  for (var i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo[i]) * multiplo;
    multiplo = multiplo === 7 ? 2 : multiplo + 1;
  }

  var dvEsperado = 11 - (suma % 11);
  var dvCalculado;
  if (dvEsperado === 11) {
    dvCalculado = "0";
  } else if (dvEsperado === 10) {
    dvCalculado = "K";
  } else {
    dvCalculado = String(dvEsperado);
  }

  return digitoVerificador === dvCalculado;
}

/**
 * Valida que una URL tenga formato correcto.
 * @param {string} url
 * @returns {boolean}
 */
function esUrlValida(url) {
  var patron = /^https?:\/\/[a-zA-Z0-9\-]+(\.[a-zA-Z0-9\-]+)+([/?#].*)?$/;
  return patron.test(url.trim());
}

/**
 * Valida que el archivo seleccionado sea de tipo imagen o video.
 * @param {HTMLInputElement} inputFile
 * @returns {boolean}
 */
function esArchivoMultimediaValido(inputFile) {
  if (!inputFile.files || inputFile.files.length === 0) return false;
  var extensionesPermitidas = [
    ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp",
    ".mp4", ".avi", ".mov", ".mkv", ".webm"
  ];
  for (var i = 0; i < inputFile.files.length; i++) {
    var nombre = inputFile.files[i].name.toLowerCase();
    var extensionValida = false;
    for (var j = 0; j < extensionesPermitidas.length; j++) {
      if (nombre.endsWith(extensionesPermitidas[j])) {
        extensionValida = true;
        break;
      }
    }
    if (!extensionValida) return false;
  }
  return true;
}

/**
 * Valida que un nombre solo contenga letras y espacios, con largo mínimo.
 * @param {string} nombre
 * @param {number} minLargo
 * @returns {boolean}
 */
function esNombreValido(nombre, minLargo) {
  if (!minLargo) minLargo = 2;
  var patron = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/;
  return nombre.trim().length >= minLargo && patron.test(nombre.trim());
}

/**
 * Valida que se haya seleccionado al menos una opción en un grupo de checkboxes.
 * @param {string} nombre - Atributo name de los checkboxes.
 * @returns {boolean}
 */
function hayCheckboxSeleccionado(nombre) {
  var checkboxes = document.querySelectorAll('input[name="' + nombre + '"]');
  for (var i = 0; i < checkboxes.length; i++) {
    if (checkboxes[i].checked) return true;
  }
  return false;
}

/**
 * Valida que se haya seleccionado una opción de un select.
 * @param {string} idSelect
 * @returns {boolean}
 */
function esSeleccionValida(idSelect) {
  var select = document.getElementById(idSelect);
  return select.value !== "" && select.value !== null;
}

/* ============================================
   Validación del formulario de registro
   ============================================ */
function validarRegistro() {
  var formulario = document.getElementById("form-registro");
  if (!formulario) return false;

  limpiarTodosLosErrores("form-registro");
  var esValido = true;

  // RUT
  var rut = document.getElementById("rut").value;
  if (!esTextoValido(rut)) {
    mostrarError("rut", "El RUT es obligatorio.");
    esValido = false;
  } else if (!esRutValido(rut)) {
    mostrarError("rut", "Ingrese un RUT válido (ej: 12.345.678-5).");
    esValido = false;
  }

  // Nombres
  var nombres = document.getElementById("nombres").value;
  if (!esTextoValido(nombres)) {
    mostrarError("nombres", "Los nombres son obligatorios.");
    esValido = false;
  } else if (!esNombreValido(nombres, 2)) {
    mostrarError("nombres", "Solo se permiten letras y espacios (mín. 2 caracteres).");
    esValido = false;
  }

  // Apellidos
  var apellidos = document.getElementById("apellidos").value;
  if (!esTextoValido(apellidos)) {
    mostrarError("apellidos", "Los apellidos son obligatorios.");
    esValido = false;
  } else if (!esNombreValido(apellidos, 2)) {
    mostrarError("apellidos", "Solo se permiten letras y espacios (mín. 2 caracteres).");
    esValido = false;
  }

  // Email
  var email = document.getElementById("email").value;
  if (!esTextoValido(email)) {
    mostrarError("email", "El correo electrónico es obligatorio.");
    esValido = false;
  } else if (!esEmailValido(email)) {
    mostrarError("email", "Ingrese un correo electrónico válido.");
    esValido = false;
  }

  // Teléfono (opcional pero si se ingresa debe ser válido)
  var telefono = document.getElementById("telefono").value;
  if (esTextoValido(telefono) && !esTelefonoValido(telefono)) {
    mostrarError("telefono", "Formato inválido. Use +569XXXXXXXX o 9XXXXXXXX.");
    esValido = false;
  }

  // Tipo de miembro
  if (!esSeleccionValida("tipo-miembro")) {
    mostrarError("tipo-miembro", "Debe seleccionar un tipo de miembro.");
    esValido = false;
  }

  // Campos condicionales según tipo
  var tipo = document.getElementById("tipo-miembro").value;

  if (tipo === "pregrado" || tipo === "postgrado") {
    var carrera = document.getElementById("carrera");
    if (carrera && !esTextoValido(carrera.value)) {
      mostrarError("carrera", "La carrera o programa es obligatorio para estudiantes.");
      esValido = false;
    }
    var anioIngreso = document.getElementById("anio-ingreso");
    if (anioIngreso && esTextoValido(anioIngreso.value)) {
      var anio = parseInt(anioIngreso.value);
      var anioActual = new Date().getFullYear();
      if (isNaN(anio) || anio < 1990 || anio > anioActual) {
        mostrarError("anio-ingreso", "Ingrese un año válido entre 1990 y " + anioActual + ".");
        esValido = false;
      }
    }
  }

  if (tipo === "funcionario" || tipo === "academico") {
    var cargo = document.getElementById("cargo");
    if (cargo && !esTextoValido(cargo.value)) {
      mostrarError("cargo", "El cargo es obligatorio para funcionarios y académicos.");
      esValido = false;
    }
  }

  if (esValido) {
    mostrarAlerta("form-registro", "exito", "¡Registro exitoso! El miembro ha sido registrado correctamente.");
    formulario.reset();
    ocultarCamposCondicionales();
  }

  return false; // Prevenir envío real del formulario
}

/**
 * Muestra/oculta campos condicionales según el tipo de miembro seleccionado.
 */
function actualizarCamposCondicionales() {
  var tipo = document.getElementById("tipo-miembro").value;
  var camposEstudiante = document.getElementById("campos-estudiante");
  var camposFuncionario = document.getElementById("campos-funcionario");

  if (camposEstudiante) {
    camposEstudiante.style.display = (tipo === "pregrado" || tipo === "postgrado") ? "block" : "none";
  }
  if (camposFuncionario) {
    camposFuncionario.style.display = (tipo === "funcionario" || tipo === "academico") ? "block" : "none";
  }
}

function ocultarCamposCondicionales() {
  var camposEstudiante = document.getElementById("campos-estudiante");
  var camposFuncionario = document.getElementById("campos-funcionario");
  if (camposEstudiante) camposEstudiante.style.display = "none";
  if (camposFuncionario) camposFuncionario.style.display = "none";
}

/* ============================================
   Validación del formulario de actividades
   ============================================ */
function validarActividad() {
  var formulario = document.getElementById("form-actividad");
  if (!formulario) return false;

  limpiarTodosLosErrores("form-actividad");
  var esValido = true;

  // RUT del miembro
  var rutMiembro = document.getElementById("rut-miembro").value;
  if (!esTextoValido(rutMiembro)) {
    mostrarError("rut-miembro", "Debe identificar al miembro con su RUT.");
    esValido = false;
  } else if (!esRutValido(rutMiembro)) {
    mostrarError("rut-miembro", "Ingrese un RUT válido.");
    esValido = false;
  }

  // Nombre de la actividad
  var nombreActividad = document.getElementById("nombre-actividad").value;
  if (!esTextoValido(nombreActividad)) {
    mostrarError("nombre-actividad", "El nombre de la actividad es obligatorio.");
    esValido = false;
  } else if (nombreActividad.trim().length < 3) {
    mostrarError("nombre-actividad", "El nombre debe tener al menos 3 caracteres.");
    esValido = false;
  }

  // Tipo de actividad
  if (!esSeleccionValida("tipo-actividad")) {
    mostrarError("tipo-actividad", "Debe seleccionar un tipo de actividad.");
    esValido = false;
  }

  // Descripción
  var descripcion = document.getElementById("descripcion-actividad").value;
  if (!esTextoValido(descripcion)) {
    mostrarError("descripcion-actividad", "La descripción es obligatoria.");
    esValido = false;
  } else if (descripcion.trim().length < 10) {
    mostrarError("descripcion-actividad", "La descripción debe tener al menos 10 caracteres.");
    esValido = false;
  }

  // Horarios: al menos un bloque seleccionado
  if (!hayCheckboxSeleccionado("horario")) {
    mostrarError("tabla-horarios-contenedor", "Debe seleccionar al menos un bloque horario.");
    esValido = false;
  }

  // Archivo multimedia
  var archivoInput = document.getElementById("archivo-multimedia");
  if (!archivoInput.files || archivoInput.files.length === 0) {
    mostrarError("archivo-multimedia", "Debe adjuntar al menos un archivo de foto o video.");
    esValido = false;
  } else if (!esArchivoMultimediaValido(archivoInput)) {
    mostrarError("archivo-multimedia", "Solo se permiten archivos de imagen (jpg, png, gif, webp) o video (mp4, avi, mov, mkv, webm).");
    esValido = false;
  }

  // Enlace a contenido
  var enlace = document.getElementById("enlace-contenido").value;
  if (!esTextoValido(enlace)) {
    mostrarError("enlace-contenido", "Debe incluir un enlace a contenido de la actividad.");
    esValido = false;
  } else if (!esUrlValida(enlace)) {
    mostrarError("enlace-contenido", "Ingrese una URL válida (ej: https://ejemplo.com).");
    esValido = false;
  }

  if (esValido) {
    mostrarAlerta("form-actividad", "exito", "¡Actividad registrada exitosamente!");
    formulario.reset();
  }

  return false;
}

/* ============================================
   Utilidad: mostrar alerta en formulario
   ============================================ */
function mostrarAlerta(idFormulario, tipo, mensaje) {
  var form = document.getElementById(idFormulario);
  // Eliminar alerta previa si existe
  var alertaPrevia = form.parentElement.querySelector(".alerta");
  if (alertaPrevia) alertaPrevia.remove();

  var alerta = document.createElement("p");
  alerta.className = "alerta alerta-" + (tipo === "exito" ? "exito" : "error");
  alerta.textContent = mensaje;
  form.parentElement.insertBefore(alerta, form);

  // Auto-ocultar después de 5 segundos
  setTimeout(function () {
    if (alerta.parentElement) alerta.remove();
  }, 5000);

  // Scroll hacia arriba para ver el mensaje
  window.scrollTo({ top: 0, behavior: "smooth" });
}
