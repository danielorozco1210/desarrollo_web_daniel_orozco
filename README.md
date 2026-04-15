# CC5002 - Tarea 1: Sistema de Gestión de Actividades DCC

## Descripción

Prototipo de un sistema web para gestionar las actividades extracurriculares (artísticas, deportivas, tecnológicas, sociales y recreativas) que realizan los miembros de la comunidad del Departamento de Ciencias de la Computación, Universidad de Chile.

## Estructura del Proyecto

```
tarea1/
├── index.html              # Página de inicio con accesos principales
├── registro.html           # Formulario de registro de miembros
├── actividades.html        # Formulario para informar actividades
├── listado.html            # Listado de miembros con filtros y paginación
├── indicadores.html        # Dashboard con gráficos y métricas
├── css/
│   └── styles.css          # Hoja de estilos compartida
├── js/
│   ├── validaciones.js     # Funciones de validación de formularios
│   ├── listado.js          # Lógica de filtrado, ordenamiento y paginación
│   └── indicadores.js      # Lógica de generación de gráficos
└── README.md               # Este archivo
```

## Decisiones de Diseño

### Tipos de Miembros
Se consideran 4 tipos de miembros:
- **Estudiante de Pregrado**: requiere carrera y opcionalmente año de ingreso.
- **Estudiante de Postgrado**: requiere programa y opcionalmente año de ingreso.
- **Funcionario/a**: requiere cargo y opcionalmente unidad/departamento.
- **Académico/a**: requiere cargo y opcionalmente unidad/departamento.

Los campos específicos se muestran/ocultan dinámicamente según el tipo seleccionado.

### Validaciones
Todas las validaciones se realizan con JavaScript (no se usa el atributo `required`). Se implementaron validaciones para:
- **RUT**: verificación de formato y dígito verificador (algoritmo módulo 11).
- **Email**: validación de formato con expresión regular.
- **Teléfono**: formato chileno (+569XXXXXXXX o 9XXXXXXXX).
- **Nombres y apellidos**: solo letras, espacios y caracteres con tilde, largo mínimo 2.
- **URL**: formato válido con protocolo http/https.
- **Archivos multimedia**: solo extensiones de imagen y video permitidas.
- **Horarios**: al menos un bloque horario seleccionado.

### Horarios
Se implementó una tabla-grilla semanal con bloques de 2 horas (08:00–22:00) donde el usuario marca los bloques en que realiza la actividad. Esto permite representar horarios de forma visual e intuitiva.

### Listado de Miembros
- Datos de ejemplo precargados (15 miembros) para simular el funcionamiento.
- Filtrado por tipo de miembro y búsqueda de texto libre.
- Ordenamiento por columna (clic en encabezados).
- Paginación con 5 registros por página.

### Gráficos
Se implementaron gráficos sin librerías externas, usando solo CSS y JavaScript:
- **Gráfico de torta** con `conic-gradient` CSS.
- **Gráfico de barras verticales** para actividades por mes.
- **Gráfico de barras horizontales** para distribución por tipo de actividad.

### Etiquetas Semánticas
Se utilizan: `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<aside>`, `<footer>`, `<fieldset>`, `<legend>`, `<caption>`, atributos `aria-label` y `aria-live`.

### Responsividad
El diseño es responsivo mediante media queries para pantallas de hasta 768px y 480px.

## Cómo Ejecutar

Abra el archivo `index.html` directamente en un navegador web. No se requiere servidor.

## Tecnologías

- HTML5
- CSS3
- JavaScript (ES5, sin frameworks ni librerías externas)
