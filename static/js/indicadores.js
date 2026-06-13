/* ============================================
   CC5002 - Tarea 3: Gráficos de indicadores
   Usa fetch para pedir datos al servidor y
   Chart.js para dibujar los gráficos.
   ============================================ */

/* Colores base para los gráficos */
var COLORES = [
  '#2c3e7b', '#4a90d9', '#e67e22', '#27ae60',
  '#c0392b', '#8e44ad', '#16a085', '#d4a017'
];

/* ---- Helper: hace fetch a una URL y devuelve el JSON ---- */
function fetchJSON(url) {
  return fetch(url).then(function(resp) {
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    return resp.json();
  });
}

/* ---- Gráfico 1: Líneas — Miembros registrados por día ---- */
function cargarGraficoLineas() {
  fetchJSON('/api/indicadores/miembros-por-dia')
    .then(function(datos) {
      var ctx = document.getElementById('grafico-lineas').getContext('2d');
      new Chart(ctx, {
        type: 'line',
        data: {
          labels: datos.labels,        // fechas en el eje X
          datasets: [{
            label: 'Miembros registrados',
            data: datos.valores,       // cantidad en el eje Y
            borderColor: '#2c3e7b',
            backgroundColor: 'rgba(44,62,123,0.1)',
            fill: true,               // área bajo la curva sombreada
            tension: 0.3,             // suavizado de línea
            pointRadius: 4
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: 'top' }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: { stepSize: 1 }   // enteros (no fraccionarios)
            }
          }
        }
      });
    })
    .catch(function(err) {
      console.error('Error cargando gráfico de líneas:', err);
      document.getElementById('grafico-lineas').insertAdjacentHTML(
        'afterend', '<p class="alerta alerta-error">Error al cargar el gráfico.</p>'
      );
    });
}

/* ---- Gráfico 2: Torta — Actividades por tipo ---- */
function cargarGraficoTorta() {
  fetchJSON('/api/indicadores/actividades-por-tipo')
    .then(function(datos) {
      var ctx = document.getElementById('grafico-torta').getContext('2d');
      new Chart(ctx, {
        type: 'pie',
        data: {
          labels: datos.labels,        // tipos de actividad
          datasets: [{
            data: datos.valores,       // totales por tipo
            backgroundColor: COLORES.slice(0, datos.labels.length)
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: 'right' }   // leyenda a la derecha
          }
        }
      });
    })
    .catch(function(err) {
      console.error('Error cargando gráfico de torta:', err);
      document.getElementById('grafico-torta').insertAdjacentHTML(
        'afterend', '<p class="alerta alerta-error">Error al cargar el gráfico.</p>'
      );
    });
}

/* ---- Gráfico 3: Barras — Actividades por comuna ---- */
function cargarGraficoBarras() {
  fetchJSON('/api/indicadores/actividades-por-comuna')
    .then(function(datos) {
      var ctx = document.getElementById('grafico-barras').getContext('2d');
      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: datos.labels,        // nombres de comunas en el eje X
          datasets: [{
            label: 'Total actividades',
            data: datos.valores,       // cantidad en el eje Y
            backgroundColor: '#4a90d9'
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: false }  // no se necesita leyenda en barras simples
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: { stepSize: 1 }
            },
            x: {
              ticks: {
                maxRotation: 45,        // rotar etiquetas para que quepan
                minRotation: 30
              }
            }
          }
        }
      });
    })
    .catch(function(err) {
      console.error('Error cargando gráfico de barras:', err);
      document.getElementById('grafico-barras').insertAdjacentHTML(
        'afterend', '<p class="alerta alerta-error">Error al cargar el gráfico.</p>'
      );
    });
}

/* ---- Inicializar los 3 gráficos al cargar la página ---- */
document.addEventListener('DOMContentLoaded', function() {
  cargarGraficoLineas();
  cargarGraficoTorta();
  cargarGraficoBarras();
});
