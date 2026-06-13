"""
CC5002 - Desarrollo de Aplicaciones Web
Tarea 3: Se agregan al app.py de Tarea 2 los siguientes endpoints:

  GET  /api/indicadores/miembros-por-dia      -> JSON para gráfico de líneas
  GET  /api/indicadores/actividades-por-tipo  -> JSON para gráfico de torta
  GET  /api/indicadores/actividades-por-comuna-> JSON para gráfico de barras
  GET  /api/comentarios/<actividad_id>         -> JSON lista de comentarios
  POST /api/comentarios/<actividad_id>         -> JSON inserta comentario

El resto del archivo es idéntico al de la Tarea 2.
"""

import os
import re
import uuid
from datetime import datetime

from flask import (Flask, render_template, request, redirect, url_for,
                   flash, jsonify, send_from_directory, abort)
from werkzeug.utils import secure_filename
from sqlalchemy import func   # func.date(), func.count() para las consultas de indicadores

from models import db, Region, Comuna, Miembro, Actividad, Foto, Comentario


# ---------------------------------------------------------------------------
# Configuración de la aplicación (igual que Tarea 2)
# ---------------------------------------------------------------------------
app = Flask(__name__)

app.config['SQLALCHEMY_DATABASE_URI'] = (
    'mysql+pymysql://cc5002:programacionweb@localhost:3306/tarea2?charset=utf8mb4'
)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
app.config['UPLOAD_FOLDER'] = os.path.join(BASE_DIR, 'uploads')
app.config['MAX_CONTENT_LENGTH'] = 64 * 1024 * 1024   # 64 MB
app.secret_key = 'cc5002-tarea2-clave-secreta-cambiar-en-produccion'

os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

db.init_app(app)


# ---------------------------------------------------------------------------
# Constantes de validación (igual que Tarea 2)
# ---------------------------------------------------------------------------
EXTENSIONES_IMAGEN = {'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'}
EXTENSIONES_VIDEO = {'mp4', 'avi', 'mov', 'mkv', 'webm'}
EXTENSIONES_PERMITIDAS = EXTENSIONES_IMAGEN | EXTENSIONES_VIDEO

DIAS_VALIDOS = ['lunes', 'martes', 'miércoles', 'jueves',
                'viernes', 'sábado', 'domingo']
TIPOS_ACTIVIDAD = ['arte', 'deporte', 'tecnología',
                   'social', 'recreación', 'otra']

REGEX_EMAIL    = re.compile(r'^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$')
REGEX_TELEFONO = re.compile(r'^(\+56)?9\d{8}$')
REGEX_HORA     = re.compile(r'^([01]\d|2[0-3]):[0-5]\d$')


# ---------------------------------------------------------------------------
# Funciones auxiliares de validación (igual que Tarea 2)
# ---------------------------------------------------------------------------
def extension_permitida(nombre_archivo):
    if not nombre_archivo or '.' not in nombre_archivo:
        return False
    return nombre_archivo.rsplit('.', 1)[1].lower() in EXTENSIONES_PERMITIDAS

def validar_email(email):
    return bool(email and REGEX_EMAIL.match(email.strip()))

def validar_telefono(telefono):
    if not telefono:
        return False
    return bool(REGEX_TELEFONO.match(telefono.strip().replace(' ', '')))

def validar_hora(hora):
    return bool(hora and REGEX_HORA.match(hora.strip()))

def validar_nombre_persona(nombre):
    if not nombre:
        return False
    nombre = nombre.strip()
    if len(nombre) < 3 or len(nombre) > 255:
        return False
    return bool(re.match(r'^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s\.\-\']+$', nombre))


# ---------------------------------------------------------------------------
# Rutas existentes de Tarea 2 (sin cambios)
# ---------------------------------------------------------------------------
@app.route('/')
def index():
    ultimos = (Miembro.query
               .order_by(Miembro.fecha_registro.desc())
               .limit(5).all())
    return render_template('index.html', ultimos=ultimos, activo='index')


@app.route('/registro', methods=['GET', 'POST'])
def registro():
    if request.method == 'GET':
        regiones = Region.query.order_by(Region.nombre).all()
        return render_template('registro.html', regiones=regiones,
                               errores={}, datos={}, actividades_previas=[],
                               activo='registro')

    errores = {}
    errores_actividades = []

    nombre     = (request.form.get('nombre') or '').strip()
    email      = (request.form.get('email') or '').strip()
    telefono   = (request.form.get('telefono') or '').strip()
    comuna_id_raw = (request.form.get('comuna_id') or '').strip()

    if not nombre:
        errores['nombre'] = 'El nombre es obligatorio.'
    elif not validar_nombre_persona(nombre):
        errores['nombre'] = 'Nombre inválido. Sólo letras, espacios, apóstrofo, guión y punto. Largo 3 a 255.'

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

    dias        = request.form.getlist('act_dia[]')
    horas       = request.form.getlist('act_hora_inicio[]')
    duraciones  = request.form.getlist('act_duracion[]')
    tipos       = request.form.getlist('act_tipo[]')
    nombres_act = request.form.getlist('act_nombre[]')
    descripciones = request.form.getlist('act_descripcion[]')

    total_actividades = len(dias)
    if total_actividades == 0:
        errores['actividades'] = 'Debe registrar al menos una actividad.'

    actividades_validas = []
    actividades_previas = []

    for i in range(total_actividades):
        err_i     = {}
        dia_i     = (dias[i] if i < len(dias) else '').strip().lower()
        hora_i    = (horas[i] if i < len(horas) else '').strip()
        dur_i     = (duraciones[i] if i < len(duraciones) else '').strip()
        tipo_i    = (tipos[i] if i < len(tipos) else '').strip().lower()
        nombre_i  = (nombres_act[i] if i < len(nombres_act) else '').strip()
        desc_i    = (descripciones[i] if i < len(descripciones) else '').strip()

        if dia_i not in DIAS_VALIDOS:      err_i['dia']       = 'Día inválido.'
        if not validar_hora(hora_i):       err_i['hora_inicio'] = 'Hora inválida (HH:MM).'
        if not validar_hora(dur_i):        err_i['duracion']  = 'Duración inválida (HH:MM).'
        if tipo_i not in TIPOS_ACTIVIDAD:  err_i['tipo']      = 'Tipo inválido.'
        if not nombre_i:
            err_i['nombre'] = 'El nombre de la actividad es obligatorio.'
        elif len(nombre_i) > 45:
            err_i['nombre'] = 'Máximo 45 caracteres.'
        elif len(nombre_i) < 3:
            err_i['nombre'] = 'Mínimo 3 caracteres.'
        if desc_i and len(desc_i) > 500:
            err_i['descripcion'] = 'Máximo 500 caracteres.'

        fotos_field = 'act_fotos_{}'.format(i)
        archivos = [f for f in request.files.getlist(fotos_field) if f and f.filename]

        if len(archivos) == 0:
            err_i['fotos'] = 'Debe subir al menos una foto o video.'
        else:
            for archivo in archivos:
                if not extension_permitida(archivo.filename):
                    err_i['fotos'] = ('Sólo se permiten: '
                                      + ', '.join(sorted(EXTENSIONES_PERMITIDAS)) + '.')
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

    if any(errores_actividades):
        errores['actividades_detalle'] = errores_actividades

    if errores:
        regiones = Region.query.order_by(Region.nombre).all()
        region_id_sel = comuna_obj.region_id if comuna_obj else None
        return render_template('registro.html',
                               errores=errores,
                               errores_actividades=errores_actividades,
                               regiones=regiones,
                               datos=request.form,
                               region_id_sel=region_id_sel,
                               actividades_previas=actividades_previas,
                               activo='registro'), 400

    try:
        miembro = Miembro(
            nombre=nombre, email=email, telefono=telefono,
            fecha_registro=datetime.now(), comuna_id=comuna_obj.id
        )
        db.session.add(miembro)
        db.session.flush()

        for act_data, archivos in actividades_validas:
            actividad = Actividad(
                miembro_id=miembro.id,
                dia=act_data['dia'], hora_inicio=act_data['hora_inicio'],
                duracion=act_data['duracion'], tipo=act_data['tipo'],
                nombre=act_data['nombre'],
                descripcion=act_data['descripcion'] or None
            )
            db.session.add(actividad)
            db.session.flush()

            for archivo in archivos:
                nombre_original = secure_filename(archivo.filename)
                extension  = nombre_original.rsplit('.', 1)[-1].lower()
                nombre_unico = '{}.{}'.format(uuid.uuid4().hex, extension)
                archivo.save(os.path.join(app.config['UPLOAD_FOLDER'], nombre_unico))

                db.session.add(Foto(
                    ruta_archivo=nombre_unico,
                    nombre_archivo=nombre_original,
                    actividad_id=actividad.id
                ))

        db.session.commit()
        flash('¡Miembro "{}" y sus {} actividad(es) registrados exitosamente!'.format(
              miembro.nombre, len(actividades_validas)), 'exito')
        return redirect(url_for('index'))

    except Exception as exc:
        db.session.rollback()
        app.logger.exception('Error al guardar en la BD')
        regiones = Region.query.order_by(Region.nombre).all()
        errores['general'] = 'Ocurrió un error al guardar en la base de datos: ' + str(exc)
        return render_template('registro.html',
                               errores=errores,
                               errores_actividades=errores_actividades,
                               regiones=regiones,
                               datos=request.form,
                               actividades_previas=actividades_previas,
                               activo='registro'), 500


@app.route('/api/comunas/<int:region_id>')
def api_comunas(region_id):
    comunas = (Comuna.query
               .filter_by(region_id=region_id)
               .order_by(Comuna.nombre).all())
    return jsonify([{'id': c.id, 'nombre': c.nombre} for c in comunas])


@app.route('/listado')
def listado():
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
                           paginacion=paginacion, busqueda=busqueda,
                           activo='listado')


@app.route('/miembro/<int:miembro_id>')
def miembro_detalle(miembro_id):
    miembro = Miembro.query.get_or_404(miembro_id)
    return render_template('detalle.html', miembro=miembro, activo='listado')


@app.route('/uploads/<path:nombre>')
def serve_upload(nombre):
    nombre_seguro = secure_filename(nombre)
    if nombre_seguro != nombre:
        abort(404)
    return send_from_directory(app.config['UPLOAD_FOLDER'], nombre_seguro)


# ---------------------------------------------------------------------------
# TAREA 3: Endpoints de Indicadores (para los gráficos con Chart.js)
# ---------------------------------------------------------------------------

@app.route('/indicadores')
def indicadores():
    """Página de indicadores. Los datos los pide el JS via fetch."""
    return render_template('indicadores.html', activo='indicadores')


@app.route('/api/indicadores/miembros-por-dia')
def api_miembros_por_dia():
    """
    Retorna JSON con la cantidad de miembros registrados por día.
    Formato: { "labels": ["2026-05-01", ...], "valores": [3, ...] }
    """
    # Agrupa por la parte de fecha de fecha_registro y cuenta filas
    resultados = (db.session.query(
                      func.date(Miembro.fecha_registro).label('dia'),
                      func.count(Miembro.id).label('total')
                  )
                  .group_by('dia')
                  .order_by('dia')
                  .all())

    labels  = [str(r.dia) for r in resultados]
    valores = [r.total for r in resultados]
    return jsonify({'labels': labels, 'valores': valores})


@app.route('/api/indicadores/actividades-por-tipo')
def api_actividades_por_tipo():
    """
    Retorna JSON con el total de actividades agrupadas por tipo.
    Formato: { "labels": ["arte", ...], "valores": [10, ...] }
    """
    resultados = (db.session.query(
                      Actividad.tipo,
                      func.count(Actividad.id).label('total')
                  )
                  .group_by(Actividad.tipo)
                  .order_by(Actividad.tipo)
                  .all())

    labels  = [r.tipo for r in resultados]
    valores = [r.total for r in resultados]
    return jsonify({'labels': labels, 'valores': valores})


@app.route('/api/indicadores/actividades-por-comuna')
def api_actividades_por_comuna():
    """
    Retorna JSON con el total de actividades por comuna del miembro.
    Formato: { "labels": ["Santiago", ...], "valores": [5, ...] }
    """
    # JOIN: actividad -> miembro -> comuna
    resultados = (db.session.query(
                      Comuna.nombre.label('comuna'),
                      func.count(Actividad.id).label('total')
                  )
                  .join(Miembro, Miembro.comuna_id == Comuna.id)
                  .join(Actividad, Actividad.miembro_id == Miembro.id)
                  .group_by(Comuna.nombre)
                  .order_by(func.count(Actividad.id).desc())
                  .all())

    labels  = [r.comuna for r in resultados]
    valores = [r.total for r in resultados]
    return jsonify({'labels': labels, 'valores': valores})


# ---------------------------------------------------------------------------
# TAREA 3: Endpoints de Comentarios (GET lista, POST nuevo)
# ---------------------------------------------------------------------------

@app.route('/api/comentarios/<int:actividad_id>', methods=['GET'])
def api_comentarios_get(actividad_id):
    """
    GET /api/comentarios/<actividad_id>
    Retorna JSON con la lista de comentarios de la actividad, ordenados
    del más reciente al más antiguo.
    """
    # Verificar que la actividad exista para devolver 404 si no
    actividad = Actividad.query.get_or_404(actividad_id)

    comentarios = (Comentario.query
                   .filter_by(actividad_id=actividad.id)
                   .order_by(Comentario.fecha.desc())
                   .all())

    resultado = []
    for c in comentarios:
        resultado.append({
            'id':     c.id,
            'nombre': c.nombre,
            'texto':  c.texto,
            # Formato legible para el usuario
            'fecha':  c.fecha.strftime('%d-%m-%Y %H:%M')
        })
    return jsonify(resultado)


@app.route('/api/comentarios/<int:actividad_id>', methods=['POST'])
def api_comentarios_post(actividad_id):
    """
    POST /api/comentarios/<actividad_id>
    Recibe JSON { "nombre": "...", "texto": "..." },
    valida en el servidor e inserta en la tabla comentario.
    Retorna 201 con el comentario creado, o 400 con mensaje de error.
    """
    # Verificar que la actividad exista
    actividad = Actividad.query.get_or_404(actividad_id)

    # Leer el JSON del cuerpo de la petición
    datos = request.get_json(silent=True)
    if not datos:
        return jsonify({'error': 'Datos JSON inválidos.'}), 400

    nombre = (datos.get('nombre') or '').strip()
    texto  = (datos.get('texto') or '').strip()

    # Validación servidor: nombre (3-80 chars), texto (5-300 chars)
    if len(nombre) < 3:
        return jsonify({'error': 'El nombre debe tener al menos 3 caracteres.'}), 400
    if len(nombre) > 80:
        return jsonify({'error': 'El nombre no puede superar 80 caracteres.'}), 400
    if len(texto) < 5:
        return jsonify({'error': 'El comentario debe tener al menos 5 caracteres.'}), 400
    if len(texto) > 300:
        return jsonify({'error': 'El comentario no puede superar 300 caracteres.'}), 400

    # Insertar en la base de datos
    try:
        comentario = Comentario(
            nombre=nombre,
            texto=texto,
            fecha=datetime.now(),
            actividad_id=actividad.id
        )
        db.session.add(comentario)
        db.session.commit()

        # Retornar el comentario recién creado con status 201 Created
        return jsonify({
            'id':     comentario.id,
            'nombre': comentario.nombre,
            'texto':  comentario.texto,
            'fecha':  comentario.fecha.strftime('%d-%m-%Y %H:%M')
        }), 201

    except Exception as exc:
        db.session.rollback()
        app.logger.exception('Error al guardar comentario')
        return jsonify({'error': 'Error interno al guardar el comentario.'}), 500


# ---------------------------------------------------------------------------
# Manejo de errores (igual que Tarea 2)
# ---------------------------------------------------------------------------
@app.errorhandler(404)
def not_found(_e):
    return render_template('index.html', ultimos=[], activo='index'), 404

@app.errorhandler(413)
def file_too_large(_e):
    flash('Los archivos enviados superan el tamaño máximo (64 MB).', 'error')
    return redirect(url_for('registro'))


# ---------------------------------------------------------------------------
if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1', port=5000)
