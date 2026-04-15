/* ============================================
   CC5002 - Tarea 1: Listado de Miembros
   Filtrado, ordenamiento y paginación
   ============================================ */

/* Datos de ejemplo para simular el listado */
var miembrosEjemplo = [
  { rut: "11.222.333-4", nombres: "Carlos", apellidos: "Muñoz Soto", email: "carlos.munoz@ug.uchile.cl", telefono: "+56922334455", tipo: "postgrado", carrera: "Magíster en Ciencias de la Computación", añoIngreso: 2023 },
  { rut: "20.326.386-6", nombres: "Daniel", apellidos: "Orozco Saavedra", email: "daniel.orozco@ug.uchile.cl", telefono: "+56975827647", tipo: "pregrado", carrera: "Ingeniería Civil Industrial", añoIngreso: 2018 },
  { rut: "16.444.555-6", nombres: "Felipe", apellidos: "Rojas Tapia", email: "felipe.rojas@ug.uchile.cl", telefono: "+56966778899", tipo: "pregrado", carrera: "Ingeniería Civil en Computación", añoIngreso: 2020 },
  { rut: "13.555.666-7", nombres: "Hugo", apellidos: "Castro Díaz", email: "hugo.castro@ug.uchile.cl", telefono: "+56988990011", tipo: "funcionario", cargo: "Administrador de Sistemas" },
  { rut: "18.999.000-9", nombres: "Javier", apellidos: "Araya Molina", email: "javier.araya@ug.uchile.cl", telefono: "+56900112233", tipo: "pregrado", carrera: "Ingeniería Civil en Computación", añoIngreso: 2023 },
  { rut: "19.123.456-0", nombres: "Luis", apellidos: "Vega Ramírez", email: "luis.vega@ug.uchile.cl", telefono: "+56922113344", tipo: "pregrado", carrera: "Ingeniería Civil en Computación", añoIngreso: 2024 },
  { rut: "7.654.321-K", nombres: "Nicolás", apellidos: "Herrera Guzmán", email: "nicolas.herrera@ug.uchile.cl", telefono: "+56944335566", tipo: "academico", cargo: "Profesor Asistente" }
];

var ITEMS_POR_PAGINA = 5;
var paginaActual = 1;
var columnaOrden = "apellidos";
var direccionOrden = "asc";

/**
 * Obtiene los miembros filtrados según los criterios actuales.
 * @returns {Array}
 */
function obtenerMiembrosFiltrados() {
  var filtroTipo = document.getElementById("filtro-tipo").value;
  var filtroBusqueda = document.getElementById("filtro-busqueda").value.toLowerCase().trim();

  var resultado = miembrosEjemplo.filter(function (m) {
    var coincideTipo = (filtroTipo === "" || m.tipo === filtroTipo);
    var coincideBusqueda = true;
    if (filtroBusqueda.length > 0) {
      coincideBusqueda = (
        m.nombres.toLowerCase().indexOf(filtroBusqueda) !== -1 ||
        m.apellidos.toLowerCase().indexOf(filtroBusqueda) !== -1 ||
        m.email.toLowerCase().indexOf(filtroBusqueda) !== -1 ||
        m.rut.indexOf(filtroBusqueda) !== -1
      );
    }
    return coincideTipo && coincideBusqueda;
  });

  return resultado;
}

/**
 * Ordena un arreglo de miembros según la columna y dirección actuales.
 * @param {Array} miembros
 * @returns {Array}
 */
function ordenarMiembros(miembros) {
  var col = columnaOrden;
  var dir = direccionOrden === "asc" ? 1 : -1;

  return miembros.slice().sort(function (a, b) {
    var valA = a[col] || "";
    var valB = b[col] || "";

    if (typeof valA === "string") valA = valA.toLowerCase();
    if (typeof valB === "string") valB = valB.toLowerCase();

    if (valA < valB) return -1 * dir;
    if (valA > valB) return 1 * dir;
    return 0;
  });
}

/**
 * Traduce el código de tipo a texto legible.
 * @param {string} tipo
 * @returns {string}
 */
function traducirTipo(tipo) {
  var tipos = {
    pregrado: "Estudiante Pregrado",
    postgrado: "Estudiante Postgrado",
    funcionario: "Funcionario/a",
    academico: "Académico/a"
  };
  return tipos[tipo] || tipo;
}

/**
 * Renderiza la tabla con los datos filtrados, ordenados y paginados.
 */
function renderizarTabla() {
  var miembros = obtenerMiembrosFiltrados();
  miembros = ordenarMiembros(miembros);

  var totalPaginas = Math.ceil(miembros.length / ITEMS_POR_PAGINA) || 1;
  if (paginaActual > totalPaginas) paginaActual = totalPaginas;

  var inicio = (paginaActual - 1) * ITEMS_POR_PAGINA;
  var fin = inicio + ITEMS_POR_PAGINA;
  var miembrosPagina = miembros.slice(inicio, fin);

  var tbody = document.getElementById("cuerpo-tabla");
  tbody.innerHTML = "";

  if (miembrosPagina.length === 0) {
    var fila = document.createElement("tr");
    var celda = document.createElement("td");
    celda.setAttribute("colspan", "6");
    celda.textContent = "No se encontraron miembros con los filtros aplicados.";
    celda.style.textAlign = "center";
    celda.style.padding = "2rem";
    celda.style.color = "#7f8c8d";
    fila.appendChild(celda);
    tbody.appendChild(fila);
  } else {
    for (var i = 0; i < miembrosPagina.length; i++) {
      var m = miembrosPagina[i];
      var tr = document.createElement("tr");

      var celdaRut = document.createElement("td");
      celdaRut.textContent = m.rut;
      tr.appendChild(celdaRut);

      var celdaNombre = document.createElement("td");
      celdaNombre.textContent = m.nombres + " " + m.apellidos;
      tr.appendChild(celdaNombre);

      var celdaEmail = document.createElement("td");
      celdaEmail.textContent = m.email;
      tr.appendChild(celdaEmail);

      var celdaTelefono = document.createElement("td");
      celdaTelefono.textContent = m.telefono || "—";
      tr.appendChild(celdaTelefono);

      var celdaTipo = document.createElement("td");
      celdaTipo.textContent = traducirTipo(m.tipo);
      tr.appendChild(celdaTipo);

      var celdaDetalle = document.createElement("td");
      celdaDetalle.textContent = m.carrera || m.cargo || "—";
      tr.appendChild(celdaDetalle);

      tbody.appendChild(tr);
    }
  }

  // Info de resultados
  var info = document.getElementById("info-resultados");
  if (info) {
    info.textContent = "Mostrando " + (miembros.length > 0 ? inicio + 1 : 0) +
      "–" + Math.min(fin, miembros.length) +
      " de " + miembros.length + " miembros";
  }

  renderizarPaginacion(totalPaginas);
  actualizarIndicadoresOrden();
}

/**
 * Renderiza los controles de paginación.
 * @param {number} totalPaginas
 */
function renderizarPaginacion(totalPaginas) {
  var contenedor = document.getElementById("paginacion");
  contenedor.innerHTML = "";

  // Botón anterior
  var btnAnterior = document.createElement("button");
  btnAnterior.textContent = "« Anterior";
  btnAnterior.disabled = (paginaActual <= 1);
  btnAnterior.addEventListener("click", function () {
    if (paginaActual > 1) {
      paginaActual--;
      renderizarTabla();
    }
  });
  contenedor.appendChild(btnAnterior);

  // Botones de página
  for (var i = 1; i <= totalPaginas; i++) {
    (function (pagina) {
      var btn = document.createElement("button");
      btn.textContent = pagina;
      if (pagina === paginaActual) btn.classList.add("activo");
      btn.addEventListener("click", function () {
        paginaActual = pagina;
        renderizarTabla();
      });
      contenedor.appendChild(btn);
    })(i);
  }

  // Botón siguiente
  var btnSiguiente = document.createElement("button");
  btnSiguiente.textContent = "Siguiente »";
  btnSiguiente.disabled = (paginaActual >= totalPaginas);
  btnSiguiente.addEventListener("click", function () {
    if (paginaActual < totalPaginas) {
      paginaActual++;
      renderizarTabla();
    }
  });
  contenedor.appendChild(btnSiguiente);
}

/**
 * Cambia la columna y dirección de ordenamiento al hacer clic en un encabezado.
 * @param {string} columna
 */
function cambiarOrden(columna) {
  if (columnaOrden === columna) {
    direccionOrden = (direccionOrden === "asc") ? "desc" : "asc";
  } else {
    columnaOrden = columna;
    direccionOrden = "asc";
  }
  paginaActual = 1;
  renderizarTabla();
}

/**
 * Actualiza los indicadores de orden (flechas) en los encabezados.
 */
function actualizarIndicadoresOrden() {
  var encabezados = document.querySelectorAll("th[data-columna]");
  for (var i = 0; i < encabezados.length; i++) {
    var th = encabezados[i];
    var col = th.getAttribute("data-columna");
    // Remover indicador previo
    var textoBase = th.textContent.replace(/ [▲▼]/g, "");
    if (col === columnaOrden) {
      th.textContent = textoBase + (direccionOrden === "asc" ? " ▲" : " ▼");
    } else {
      th.textContent = textoBase;
    }
  }
}

/**
 * Aplica filtros y resetea a página 1.
 */
function aplicarFiltros() {
  paginaActual = 1;
  renderizarTabla();
}

/* Inicializar al cargar la página */
document.addEventListener("DOMContentLoaded", function () {
  if (document.getElementById("cuerpo-tabla")) {
    renderizarTabla();

    // Eventos de filtros
    var filtroTipo = document.getElementById("filtro-tipo");
    var filtroBusqueda = document.getElementById("filtro-busqueda");

    if (filtroTipo) filtroTipo.addEventListener("change", aplicarFiltros);
    if (filtroBusqueda) filtroBusqueda.addEventListener("input", aplicarFiltros);

    // Eventos de ordenamiento
    var encabezados = document.querySelectorAll("th[data-columna]");
    for (var i = 0; i < encabezados.length; i++) {
      (function (th) {
        th.addEventListener("click", function () {
          cambiarOrden(th.getAttribute("data-columna"));
        });
      })(encabezados[i]);
    }
  }
});
