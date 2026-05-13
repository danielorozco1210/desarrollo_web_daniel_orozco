"""
CC5002 - Desarrollo de Aplicaciones Web
Tarea 2: Sistema de Gestión de Actividades DCC
Aplicación Flask + SQLAlchemy + MySQL
"""

import os
import re
import uuid
from datetime import datetime

from flask import (Flask, render_template, request, redirect, url_for,
                   flash, jsonify, send_from_directory, abort)
from werkzeug.utils import secure_filename

from models import db, Region, Comuna, Miembro, Actividad, Foto


# ---------------------------------------------------------------------------
# Configuración de la aplicación
# ---------------------------------------------------------------------------
app = Flask(__name__)

app.config['SQLALCHEMY_DATABASE_URI'] = (
    'mysql+pymysql://cc5002:programacionweb@localhost:3306/tarea2?charset=utf8mb4'
)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Carpeta donde se almacenarán los archivos subidos
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
app.config['UPLOAD_FOLDER'] = os.path.join(BASE_DIR, 'uploads')
app.config['MAX_CONTENT_LENGTH'] = 64 * 1024 * 1024   # 64 MB en total por request
app.secret_key = 'cc5002-tarea2-clave-secreta-cambiar-en-produccion'

os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

db.init_app(app)


# ---------------------------------------------------------------------------
# Constantes de validación
# ---------------------------------------------------------------------------
EXTENSIONES_IMAGEN = {'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'}
EXTENSIONES_VIDEO = {'mp4', 'avi', 'mov', 'mkv', 'webm'}
EXTENSIONES_PERMITIDAS = EXTENSIONES_IMAGEN | EXTENSIONES_VIDEO

DIAS_VALIDOS = ['lunes', 'martes', 'miércoles', 'jueves',
                'viernes', 'sábado', 'domingo']
TIPOS_ACTIVIDAD = ['arte', 'deporte', 'tecnología',
                   'social', 'recreación', 'otra']

REGEX_EMAIL = re.compile(r'^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$')
REGEX_TELEFONO = re.compile(r'^(\+56)?9\d{8}$')
REGEX_HORA = re.compile(r'^([01]\d|2[0-3]):[0-5]\d$')


# ---------------------------------------------------------------------------
# Funciones auxiliares de validación
# ---------------------------------------------------------------------------
def extension_permitida(nombre_archivo):
    """Retorna True si la extensión del archivo está dentro de la lista permitida."""
    if not nombre_archivo or '.' not in nombre_archivo:
        return False
    extension = nombre_archivo.rsplit('.', 1)[1].lower()
    return extension in EXTENSIONES_PERMITIDAS


def validar_email(email):
    return bool(email and REGEX_EMAIL.match(email.strip()))


def validar_telefono(telefono):
    if not telefono:
        return False
    limpio = telefono.strip().replace(' ', '')
    return bool(REGEX_TELEFONO.match(limpio))


def validar_hora(hora):
    return bool(hora and REGEX_HORA.match(hora.strip()))


def validar_nombre_persona(nombre):
    """Permite letras, espacios y caracteres con tilde/ñ. Largo entre 3 y 255."""
    if not nombre:
        return False
    nombre = nombre.strip()
    if len(nombre) < 3 or len(nombre) > 255:
        return False
    return bool(re.match(r'^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s\.\-\']+$', nombre))


# ---------------------------------------------------------------------------
# Rutas
# ---------------------------------------------------------------------------
@app.route('/')
def index():
    """Portada: muestra los últimos 5 miembros agregados a la base de datos."""
    ultimos = (Miembro.query
               .order_by(Miembro.fecha_registro.desc())
               .limit(5)
               .all())
    return render_template('index.html', ultimos=ultimos, activo='index')


@app.route('/registro', methods=['GET', 'POST'])
def registro():
    """Formulario de registro de miembro + sus actividades + fotos."""
    if request.method == 'GET':
        regiones = Region.query.order_by(Region.nombre).all()
        return render_template('registro.html', regiones=regiones,
                               errores={}, datos={}, actividades_previas=[],
                               activo='registro')

    # ---------- POST: validar lado del servidor ----------
    errores = {}
    errores_actividades = []   # lista paralela a las actividades enviadas

    nombre = (request.form.get('nombre') or '').strip()
    email = (request.form.get('email') or '').strip()
    telefono = (request.form.get('telefono') or '').strip()
    comuna_id_raw = (request.form.get('comuna_id') or '').strip()

    # Validar miembro
    if not nombre:
        errores['nombre'] = 'El nombre es obligatorio.'
    elif not validar_nombre_persona(nombre):
        errores['nombre'] = ('Nombre inválido. Sólo letras, espacios, '
                             'apóstrofo, guión y punto. Largo 3 a 255.')

    if not email:
        errores['email'] = 'El correo es obligatorio.'
    elif not validar_email(email):
        errores['email'] = 'Formato de correo inválido.'
    elif len(email) > 80:
        errores['email'] = 'El correo no puede exceder 80 caracteres.'

    if not telefono:
        errores['telefono'] = 'El teléfono es obligatorio.'
    elif not validar_telefono(telefono):
        errores['telefono'] = 'Formato chileno inválido (+569XXXXXXXX o 9XXXXXXXX).'

    comuna_obj = None
    if not comuna_id_raw:
        errores['comuna_id'] = 'Debe seleccionar una comuna.'
    else:
        try:
            comuna_obj = Comuna.query.get(int(comuna_id_raw))
            if comuna_obj is None:
                errores['comuna_id'] = 'La comuna seleccionada no existe.'
        except (ValueError, TypeError):
            errores['comuna_id'] = 'Comuna inválida.'

    # Validar actividades (arrays paralelos)
    dias = request.form.getlist('act_dia[]')
    horas = request.form.getlist('act_hora_inicio[]')
    duraciones = request.form.getlist('act_duracion[]')
    tipos = request.form.getlist('act_tipo[]')
    nombres_act = request.form.getlist('act_nombre[]')
    descripciones = request.form.getlist('act_descripcion[]')

    total_actividades = len(dias)

    if total_actividades == 0:
        errores['actividades'] = 'Debe registrar al menos una actividad.'

    actividades_validas = []   # tuplas (dict_actividad, list_archivos)
    actividades_previas = []   # para re-renderizar el form con los datos

    for i in range(total_actividades):
        err_i = {}
        dia_i = (dias[i] if i < len(dias) else '').strip().lower()
        hora_i = (horas[i] if i < len(horas) else '').strip()
        dur_i = (duraciones[i] if i < len(duraciones) else '').strip()
        tipo_i = (tipos[i] if i < len(tipos) else '').strip().lower()
        nombre_i = (nombres_act[i] if i < len(nombres_act) else '').strip()
        desc_i = (descripciones[i] if i < len(descripciones) else '').strip()

        if dia_i not in DIAS_VALIDOS:
            err_i['dia'] = 'Día inválido.'
        if not validar_hora(hora_i):
            err_i['hora_inicio'] = 'Hora inválida (HH:MM 00:00 a 23:59).'
        if not validar_hora(dur_i):
            err_i['duracion'] = 'Duración inválida (HH:MM).'
        if tipo_i not in TIPOS_ACTIVIDAD:
            err_i['tipo'] = 'Tipo inválido.'
        if not nombre_i:
            err_i['nombre'] = 'El nombre de la actividad es obligatorio.'
        elif len(nombre_i) > 45:
            err_i['nombre'] = 'Máximo 45 caracteres.'
        elif len(nombre_i) < 3:
            err_i['nombre'] = 'Mínimo 3 caracteres.'

        if desc_i and len(desc_i) > 500:
            err_i['descripcion'] = 'Máximo 500 caracteres.'

        # Archivos para esta actividad: act_fotos_<i>
        fotos_field = 'act_fotos_{}'.format(i)
        archivos = [f for f in request.files.getlist(fotos_field)
                    if f and f.filename]

        if len(archivos) == 0:
            err_i['fotos'] = 'Debe subir al menos una foto o video.'
        else:
            for archivo in archivos:
                if not extension_permitida(archivo.filename):
                    err_i['fotos'] = ('Sólo se permiten archivos: '
                                      + ', '.join(sorted(EXTENSIONES_PERMITIDAS))
                                      + '.')
                    break

        actividades_previas.append({
            'dia': dia_i, 'hora_inicio': hora_i, 'duracion': dur_i,
            'tipo': tipo_i, 'nombre': nombre_i, 'descripcion': desc_i,
            'fotos_nombres': [a.filename for a in archivos]
        })
        errores_actividades.append(err_i)

        if not err_i:
            actividades_validas.append((
                {'dia': dia_i, 'hora_inicio': hora_i, 'duracion': dur_i,
                 'tipo': tipo_i, 'nombre': nombre_i, 'descripcion': desc_i},
                archivos
            ))

    hay_errores_act = any(errores_actividades)
    if hay_errores_act:
        errores['actividades_detalle'] = errores_actividades

    if errores:
        regiones = Region.query.order_by(Region.nombre).all()
        # Para que el select Region pre-seleccione la región de la comuna elegida
        region_id_sel = None
        if comuna_obj is not None:
            region_id_sel = comuna_obj.region_id
        return render_template('registro.html',
                               errores=errores,
                               errores_actividades=errores_actividades,
                               regiones=regiones,
                               datos=request.form,
                               region_id_sel=region_id_sel,
                               actividades_previas=actividades_previas,
                               activo='registro'), 400

    # ---------- Inserción en la base de datos ----------
    try:
        miembro = Miembro(
            nombre=nombre,
            email=email,
            telefono=telefono,
            fecha_registro=datetime.now(),
            comuna_id=comuna_obj.id
        )
        db.session.add(miembro)
        db.session.flush()   # obtenemos miembro.id sin commit todavía

        for act_data, archivos in actividades_validas:
            actividad = Actividad(
                miembro_id=miembro.id,
                dia=act_data['dia'],
                hora_inicio=act_data['hora_inicio'],
                duracion=act_data['duracion'],
                tipo=act_data['tipo'],
                nombre=act_data['nombre'],
                descripcion=act_data['descripcion'] or None
            )
            db.session.add(actividad)
            db.session.flush()

            for archivo in archivos:
                nombre_original = secure_filename(archivo.filename)
                # Nombre único en disco para evitar colisiones
                extension = nombre_original.rsplit('.', 1)[-1].lower()
                nombre_unico = '{}.{}'.format(uuid.uuid4().hex, extension)
                ruta_disco = os.path.join(app.config['UPLOAD_FOLDER'],
                                          nombre_unico)
                archivo.save(ruta_disco)

                foto = Foto(
                    ruta_archivo=nombre_unico,   # guardamos sólo el nombre relativo
                    nombre_archivo=nombre_original,
                    actividad_id=actividad.id
                )
                db.session.add(foto)

        db.session.commit()
        flash('¡Miembro "{}" y sus {} actividad(es) registrados '
              'exitosamente!'.format(miembro.nombre, len(actividades_validas)),
              'exito')
        return redirect(url_for('index'))

    except Exception as exc:
        db.session.rollback()
        app.logger.exception('Error al guardar en la BD')
        regiones = Region.query.order_by(Region.nombre).all()
        errores['general'] = ('Ocurrió un error al guardar en la base de datos: '
                              + str(exc))
        return render_template('registro.html',
                               errores=errores,
                               errores_actividades=errores_actividades,
                               regiones=regiones,
                               datos=request.form,
                               actividades_previas=actividades_previas,
                               activo='registro'), 500


@app.route('/api/comunas/<int:region_id>')
def api_comunas(region_id):
    """Endpoint JSON para cargar comunas según región (cascada en el formulario)."""
    comunas = (Comuna.query
               .filter_by(region_id=region_id)
               .order_by(Comuna.nombre)
               .all())
    return jsonify([{'id': c.id, 'nombre': c.nombre} for c in comunas])


@app.route('/listado')
def listado():
    """Listado paginado de miembros (5 por página)."""
    try:
        pagina = max(1, int(request.args.get('pagina', 1)))
    except (TypeError, ValueError):
        pagina = 1
    busqueda = (request.args.get('q') or '').strip()

    query = Miembro.query
    if busqueda:
        like = '%{}%'.format(busqueda)
        query = query.filter(db.or_(
            Miembro.nombre.ilike(like),
            Miembro.email.ilike(like)
        ))
    query = query.order_by(Miembro.nombre.asc())

    paginacion = query.paginate(page=pagina, per_page=5, error_out=False)
    return render_template('listado.html',
                           paginacion=paginacion,
                           busqueda=busqueda,
                           activo='listado')


@app.route('/miembro/<int:miembro_id>')
def miembro_detalle(miembro_id):
    """Muestra el detalle de un miembro con sus actividades."""
    miembro = Miembro.query.get_or_404(miembro_id)
    return render_template('detalle.html', miembro=miembro, activo='listado')


@app.route('/indicadores')
def indicadores():
    """Página placeholder para las estadísticas (Tarea 3)."""
    return render_template('indicadores.html', activo='indicadores')


@app.route('/uploads/<path:nombre>')
def serve_upload(nombre):
    """Sirve los archivos almacenados en la carpeta uploads/."""
    # secure_filename garantiza que no se pueda salir de la carpeta
    nombre_seguro = secure_filename(nombre)
    if nombre_seguro != nombre:
        abort(404)
    return send_from_directory(app.config['UPLOAD_FOLDER'], nombre_seguro)


# ---------------------------------------------------------------------------
# Manejo de errores
# ---------------------------------------------------------------------------
@app.errorhandler(404)
def not_found(_e):
    return render_template('index.html', ultimos=[], activo='index',
                           mensaje_error='Página no encontrada (404).'), 404


@app.errorhandler(413)
def file_too_large(_e):
    flash('Los archivos enviados superan el tamaño máximo permitido (64 MB).',
          'error')
    return redirect(url_for('registro'))


# ---------------------------------------------------------------------------
if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1', port=5000)
