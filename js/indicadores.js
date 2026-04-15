/* ============================================
   CC5002 - Tarea 1: Indicadores y Métricas
   Gráficos con datos de ejemplo
   ============================================ */

/* Datos de ejemplo para indicadores */
var datosMiembros = {
  pregrado: 45,
  postgrado: 18,
  funcionario: 12,
  academico: 25
};

var datosActividades = {
  artistica: 22,
  deportiva: 35,
  tecnologica: 28,
  social: 15,
  recreativa: 20
};

var actividadesPorMes = [
  { mes: "Ene", cantidad: 8 },
  { mes: "Feb", cantidad: 5 },
  { mes: "Mar", cantidad: 15 },
  { mes: "Abr", cantidad: 22 },
  { mes: "May", cantidad: 18 },
  { mes: "Jun", cantidad: 25 },
  { mes: "Jul", cantidad: 12 },
  { mes: "Ago", cantidad: 20 },
  { mes: "Sep", cantidad: 30 },
  { mes: "Oct", cantidad: 28 },
  { mes: "Nov", cantidad: 24 },
  { mes: "Dic", cantidad: 10 }
];

/**
 * Renderiza las tarjetas de indicadores numéricos.
 */
function renderizarIndicadores() {
  var totalMiembros = datosMiembros.pregrado + datosMiembros.postgrado +
    datosMiembros.funcionario + datosMiembros.academico;
  var totalActividades = datosActividades.artistica + datosActividades.deportiva +
    datosActividades.tecnologica + datosActividades.social + datosActividades.recreativa;

  document.getElementById("total-miembros").textContent = totalMiembros;
  document.getElementById("total-actividades").textContent = totalActividades;
  document.getElementById("total-estudiantes").textContent =
    datosMiembros.pregrado + datosMiembros.postgrado;
  document.getElementById("promedio-actividades").textContent =
    (totalActividades / totalMiembros).toFixed(1);
}

/**
 * Renderiza el gráfico de barras de actividades por mes.
 */
function renderizarGraficoBarras() {
  var contenedor = document.getElementById("grafico-barras-mensual");
  contenedor.innerHTML = "";

  var maxValor = 0;
  for (var i = 0; i < actividadesPorMes.length; i++) {
    if (actividadesPorMes[i].cantidad > maxValor) {
      maxValor = actividadesPorMes[i].cantidad;
    }
  }

  var colores = ["#3498db", "#2ecc71", "#e74c3c", "#f39c12", "#9b59b6",
    "#1abc9c", "#e67e22", "#2c3e50", "#16a085", "#c0392b",
    "#8e44ad", "#d35400"];

  for (var j = 0; j < actividadesPorMes.length; j++) {
    var item = actividadesPorMes[j];
    var alturaPorcentaje = maxValor > 0 ? (item.cantidad / maxValor) * 100 : 0;

    var barraItem = document.createElement("span");
    barraItem.className = "barra-item";

    var barraValor = document.createElement("span");
    barraValor.className = "barra-valor";
    barraValor.textContent = item.cantidad;

    var barra = document.createElement("span");
    barra.className = "barra";
    barra.style.height = alturaPorcentaje + "%";
    barra.style.backgroundColor = colores[j % colores.length];

    var barraEtiqueta = document.createElement("span");
    barraEtiqueta.className = "barra-etiqueta";
    barraEtiqueta.textContent = item.mes;

    barraItem.appendChild(barraValor);
    barraItem.appendChild(barra);
    barraItem.appendChild(barraEtiqueta);
    contenedor.appendChild(barraItem);
  }
}

/**
 * Renderiza el gráfico de torta de distribución por tipo de miembro usando CSS conic-gradient.
 */
function renderizarGraficoTorta() {
  var tortaElemento = document.getElementById("grafico-torta-miembros");
  var leyenda = document.getElementById("leyenda-torta-miembros");

  var total = datosMiembros.pregrado + datosMiembros.postgrado +
    datosMiembros.funcionario + datosMiembros.academico;

  var segmentos = [
    { nombre: "Pregrado", valor: datosMiembros.pregrado, color: "#3498db" },
    { nombre: "Postgrado", valor: datosMiembros.postgrado, color: "#2ecc71" },
    { nombre: "Funcionarios", valor: datosMiembros.funcionario, color: "#e74c3c" },
    { nombre: "Académicos", valor: datosMiembros.academico, color: "#f39c12" }
  ];

  // Construir conic-gradient
  var gradientParts = [];
  var acumulado = 0;

  for (var i = 0; i < segmentos.length; i++) {
    var porcentaje = (segmentos[i].valor / total) * 100;
    var inicio = acumulado;
    var fin = acumulado + porcentaje;
    gradientParts.push(segmentos[i].color + " " + inicio.toFixed(1) + "% " + fin.toFixed(1) + "%");
    acumulado = fin;
  }

  tortaElemento.style.background = "conic-gradient(" + gradientParts.join(", ") + ")";

  // Leyenda
  leyenda.innerHTML = "";
  for (var j = 0; j < segmentos.length; j++) {
    var li = document.createElement("li");

    var colorBox = document.createElement("span");
    colorBox.className = "leyenda-color";
    colorBox.style.backgroundColor = segmentos[j].color;

    var porcentajeTexto = ((segmentos[j].valor / total) * 100).toFixed(1);
    var textoLi = document.createTextNode(
      segmentos[j].nombre + ": " + segmentos[j].valor + " (" + porcentajeTexto + "%)"
    );

    li.appendChild(colorBox);
    li.appendChild(textoLi);
    leyenda.appendChild(li);
  }
}

/**
 * Renderiza el gráfico de barras horizontales para tipos de actividades.
 */
function renderizarGraficoActividades() {
  var contenedor = document.getElementById("grafico-tipos-actividad");
  contenedor.innerHTML = "";

  var tipos = [
    { nombre: "Artísticas", valor: datosActividades.artistica, color: "#9b59b6" },
    { nombre: "Deportivas", valor: datosActividades.deportiva, color: "#3498db" },
    { nombre: "Tecnológicas", valor: datosActividades.tecnologica, color: "#2ecc71" },
    { nombre: "Sociales", valor: datosActividades.social, color: "#e74c3c" },
    { nombre: "Recreativas", valor: datosActividades.recreativa, color: "#f39c12" }
  ];

  var maxValor = 0;
  for (var i = 0; i < tipos.length; i++) {
    if (tipos[i].valor > maxValor) maxValor = tipos[i].valor;
  }

  for (var j = 0; j < tipos.length; j++) {
    var fila = document.createElement("p");
    fila.style.marginBottom = "0.75rem";

    var etiqueta = document.createElement("strong");
    etiqueta.textContent = tipos[j].nombre + " (" + tipos[j].valor + ")";
    etiqueta.style.display = "block";
    etiqueta.style.fontSize = "0.85rem";
    etiqueta.style.marginBottom = "0.25rem";

    var barraFondo = document.createElement("span");
    barraFondo.style.display = "block";
    barraFondo.style.width = "100%";
    barraFondo.style.height = "22px";
    barraFondo.style.backgroundColor = "#ecf0f1";
    barraFondo.style.borderRadius = "4px";
    barraFondo.style.overflow = "hidden";

    var barraRelleno = document.createElement("span");
    barraRelleno.style.display = "block";
    var anchoPorcentaje = maxValor > 0 ? (tipos[j].valor / maxValor) * 100 : 0;
    barraRelleno.style.width = anchoPorcentaje + "%";
    barraRelleno.style.height = "100%";
    barraRelleno.style.backgroundColor = tipos[j].color;
    barraRelleno.style.borderRadius = "4px";
    barraRelleno.style.transition = "width 0.8s ease";

    barraFondo.appendChild(barraRelleno);
    fila.appendChild(etiqueta);
    fila.appendChild(barraFondo);
    contenedor.appendChild(fila);
  }
}

/* Inicializar al cargar la página */
document.addEventListener("DOMContentLoaded", function () {
  if (document.getElementById("total-miembros")) {
    renderizarIndicadores();
    renderizarGraficoBarras();
    renderizarGraficoTorta();
    renderizarGraficoActividades();
  }
});
