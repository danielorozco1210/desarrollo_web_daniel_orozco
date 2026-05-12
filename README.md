# CC5002 — Tarea 2: Sistema de Gestión de Actividades DCC

Implementación con **Python + Flask + SQLAlchemy + MySQL** del sistema cuyo prototipo
fue desarrollado en la Tarea 1.

---

## 1. Cómo ejecutar

### 1.1. Preparar la base de datos

Con MySQL ya instalado y un usuario `cc5002` con password `programacionweb` y
permisos sobre el schema `tarea2` (según indica el enunciado):

```bash
# 1) Crear el esquema y las tablas
mysql -u cc5002 -p < sql/tarea2.sql

# 2) Cargar regiones y comunas
mysql -u cc5002 -p tarea2 < sql/region-comuna.sql
```

### 1.2. Crear el entorno Python e instalar dependencias

```bash
python3 -m venv venv
source venv/bin/activate          # En Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 1.3. Levantar la aplicación

```bash
python app.py
```

Por defecto queda escuchando en <http://127.0.0.1:5000>.

---

## 2. Estructura del proyecto

```
tarea2/
├── app.py                  # Rutas Flask, validaciones del servidor, manejo de archivos
├── models.py               # Modelos SQLAlchemy (Region, Comuna, Miembro, Actividad, Foto)
├── requirements.txt
├── README.md
├── sql/
│   ├── tarea2.sql              # Esquema entregado por el curso
│   └── region-comuna.sql       # Datos de regiones y comunas
├── templates/              # Plantillas Jinja2
│   ├── base.html               # Layout compartido (header, nav, footer, flash)
│   ├── index.html              # Portada con últimos 5 miembros
│   ├── registro.html           # Form combinado: miembro + N actividades
│   ├── listado.html            # Listado paginado de miembros
│   ├── detalle.html            # Detalle del miembro con sus actividades y fotos
│   └── indicadores.html        # Placeholder (queda para Tarea 3)
├── static/
│   ├── css/styles.css          # Estilos (extensión del CSS de Tarea 1)
│   └── js/
│       ├── validaciones.js     # Validaciones cliente
│       └── registro.js         # Cascada Región-Comuna + tarjetas dinámicas
└── uploads/                # Carpeta donde se almacenan las fotos/videos subidos
```

---

## 3. Decisiones de diseño relevantes para la corrección

### 3.1. Adaptación del formulario de Tarea 1 al modelo de datos entregado

El esquema `tarea2.sql` define un modelo más reducido que el del prototipo de Tarea 1:
no incluye RUT, tipo de miembro, carrera, cargo, etc. En su lugar, `miembro` tiene una
sola columna `nombre` (255) y una FK a `comuna`. Aprovechando que el enunciado dice
expresamente *"Este enunciado propone un modelo de datos que usted puede ajustar para
adaptarlo a las decisiones que usted tomó"*, opté por **adaptar el formulario al
esquema entregado** (en vez de modificar el SQL del curso). Concretamente:

- El campo *"Nombres" + "Apellidos"* de Tarea 1 se fusionó en un único *"Nombre Completo"*.
- Se eliminaron *RUT*, *Tipo de miembro*, *Carrera*, *Año de ingreso*, *Cargo*, *Departamento*,
  porque no tienen columnas en la base de datos.
- Se agregó un selector en cascada **Región → Comuna**, ya que `miembro.comuna_id` es FK
  obligatoria. Las comunas se cargan vía AJAX desde `GET /api/comunas/<region_id>`.

### 3.2. Formulario combinado "Registrar Miembro y Actividades"

El enunciado pide un único flujo *Registrar miembro y actividades* que inserte en las
tres tablas (`miembro`, `actividad`, `foto`), considerando que pueden haber múltiples
inserciones en `actividad` y `foto`. Por eso:

- Hay **un solo formulario** (`/registro`) con datos del miembro arriba y, debajo, una
  o más **"tarjetas de actividad"** que se agregan/eliminan dinámicamente con JS.
- Cada tarjeta tiene su propio `<input type="file" name="act_fotos_<i>" multiple>` con
  índice `i` correlativo a la actividad. Los demás campos van como **arrays paralelos**
  (`act_dia[]`, `act_hora_inicio[]`, etc.), garantizando el orden.
- El input file se renombra automáticamente cuando se agrega/elimina una tarjeta para
  mantener consistencia con la posición de la actividad en los arrays.

### 3.3. Validaciones (cliente Y servidor)

| Campo               | Regla                                                                          |
| ------------------- | ------------------------------------------------------------------------------ |
| nombre              | Sólo letras (incluye tildes/ñ), espacios, apóstrofo, guión, punto. 3–255 chars |
| email               | Regex estándar, máx. 80 chars                                                  |
| teléfono            | `+569XXXXXXXX` o `9XXXXXXXX` (formato chileno)                                 |
| comuna              | FK válida (existe en BD)                                                       |
| actividad.nombre    | 3–45 chars                                                                     |
| actividad.tipo      | ∈ {arte, deporte, tecnología, social, recreación, otra}                        |
| actividad.dia       | ∈ {lunes…domingo}                                                              |
| hora_inicio/duración | `HH:MM` (00:00–23:59)                                                          |
| descripción         | máx. 500 chars                                                                 |
| archivos            | ≥ 1 por actividad; sólo extensiones jpg/jpeg/png/gif/bmp/webp/mp4/avi/mov/mkv/webm |

**Las MISMAS validaciones se ejecutan en el servidor** (`app.py`). Si alguna falla,
se vuelve a renderizar `registro.html` con los datos previamente ingresados y los
mensajes de error junto a cada campo. **Excepción:** los `<input type="file">` no
pueden re-poblarse por seguridad del navegador; en ese caso se muestra un aviso
indicando que el usuario debe volver a seleccionar los archivos.

Las validaciones del servidor también protegen contra:

- **SQL Injection**: se usa SQLAlchemy ORM (parametrización automática).
- **XSS**: Jinja2 escapa todo el contenido por defecto.
- **Path Traversal en uploads**: se usa `werkzeug.utils.secure_filename` + un nombre
  único generado con `uuid.uuid4().hex` al guardar en disco. El endpoint
  `GET /uploads/<nombre>` valida que el nombre solicitado coincida con su versión
  segura antes de servirlo.
- **Tamaño excesivo**: `MAX_CONTENT_LENGTH = 64 MB` por request.

### 3.4. Almacenamiento de archivos

Cada archivo subido se guarda en la carpeta `uploads/` con un **nombre único**
(`uuid.hex + extensión`) para evitar colisiones entre archivos del mismo nombre. En
la tabla `foto` se almacenan:

- `ruta_archivo`: el nombre único en disco (sirve como referencia al archivo físico).
- `nombre_archivo`: el nombre original tal como el usuario lo subió (para mostrarlo).

Si la validación falla en cualquier punto del registro, se hace `db.session.rollback()`
y no se inserta nada parcial en la BD; sin embargo, hay que tener cuidado con archivos
ya guardados en disco antes del rollback — en esta implementación los archivos se
guardan **solo después** de validar todos los campos del request, por lo que no
quedan archivos huérfanos en disco.

### 3.5. Listado paginado de miembros

- **5 miembros por página** (configurable en `app.py`, `per_page=5`).
- La paginación es **server-side** usando `Query.paginate()` de SQLAlchemy.
- Se incluye un buscador opcional por nombre o correo (`?q=...`).
- Cada fila es **clickeable** (`onclick` + `tabindex` para accesibilidad por teclado)
  y navega a `/miembro/<id>`, que muestra todas las actividades del miembro con sus
  fotos/videos.

### 3.6. Portada

Muestra los **últimos 5 miembros** agregados (`ORDER BY fecha_registro DESC LIMIT 5`),
también con filas clickeables hacia el detalle.

### 3.7. `fecha_registro`

Se setea explícitamente con `datetime.now()` al momento de hacer `db.session.add(miembro)`,
y la columna también tiene `default=datetime.now` en el modelo como respaldo.

---

## 4. Endpoints disponibles

| Método | Ruta                          | Descripción                                |
| ------ | ----------------------------- | ------------------------------------------ |
| GET    | `/`                           | Portada con últimos 5 miembros             |
| GET    | `/registro`                   | Formulario de registro                     |
| POST   | `/registro`                   | Procesa el registro (valida + inserta)     |
| GET    | `/api/comunas/<region_id>`    | JSON con comunas de la región (AJAX)       |
| GET    | `/listado?pagina=N&q=texto`   | Listado paginado de miembros               |
| GET    | `/miembro/<id>`               | Detalle del miembro con actividades        |
| GET    | `/uploads/<nombre>`           | Sirve un archivo subido                    |
| GET    | `/indicadores`                | Placeholder (Tarea 3)                      |

---

## 5. Notas para el evaluador

- Las plantillas HTML están validadas para HTML5; el CSS también es válido CSS3.
- El diseño es responsivo (media queries para 768px y 480px, heredadas de Tarea 1).
- Para reproducir el flujo más fácilmente: ir a *Registrar Miembro y Actividades*,
  llenar el formulario, agregar 2 o más actividades con varias fotos cada una, y
  presionar *Registrar*. Luego ver *Listado* y hacer click sobre el miembro para
  ver sus actividades y galería.
