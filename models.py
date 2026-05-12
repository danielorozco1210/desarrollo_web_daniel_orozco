# -*- coding: utf-8 -*-
"""
Modelos SQLAlchemy correspondientes al esquema tarea2.sql.
"""

from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class Region(db.Model):
    __tablename__ = 'region'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nombre = db.Column(db.String(200), nullable=False)

    comunas = db.relationship('Comuna', backref='region',
                              lazy='dynamic')

    def __repr__(self):
        return '<Region {}: {}>'.format(self.id, self.nombre)


class Comuna(db.Model):
    __tablename__ = 'comuna'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nombre = db.Column(db.String(200), nullable=False)
    region_id = db.Column(db.Integer,
                          db.ForeignKey('region.id'),
                          nullable=False)

    miembros = db.relationship('Miembro', backref='comuna',
                               lazy='dynamic')

    def __repr__(self):
        return '<Comuna {}: {}>'.format(self.id, self.nombre)


class Miembro(db.Model):
    __tablename__ = 'miembro'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nombre = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(80), nullable=False)
    telefono = db.Column(db.String(15), nullable=False)
    fecha_registro = db.Column(db.DateTime, nullable=False,
                               default=datetime.now)
    comuna_id = db.Column(db.Integer,
                          db.ForeignKey('comuna.id'),
                          nullable=False)

    actividades = db.relationship('Actividad', backref='miembro',
                                  lazy='select',
                                  cascade='all, delete-orphan')

    def __repr__(self):
        return '<Miembro {}: {}>'.format(self.id, self.nombre)


class Actividad(db.Model):
    __tablename__ = 'actividad'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    miembro_id = db.Column(db.Integer,
                           db.ForeignKey('miembro.id'),
                           nullable=False)
    # ENUM en MySQL — declaramos como Enum
    dia = db.Column(db.Enum('lunes', 'martes', 'miércoles', 'jueves',
                            'viernes', 'sábado', 'domingo'),
                    nullable=False)
    hora_inicio = db.Column(db.String(5), nullable=False)
    duracion = db.Column(db.String(5), nullable=False)
    tipo = db.Column(db.Enum('arte', 'deporte', 'tecnología',
                             'social', 'recreación', 'otra'),
                     nullable=False)
    nombre = db.Column(db.String(45), nullable=False)
    descripcion = db.Column(db.Text, nullable=True)

    fotos = db.relationship('Foto', backref='actividad',
                            lazy='select',
                            cascade='all, delete-orphan')

    def __repr__(self):
        return '<Actividad {}: {}>'.format(self.id, self.nombre)


class Foto(db.Model):
    __tablename__ = 'foto'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    ruta_archivo = db.Column(db.String(300), nullable=False)
    nombre_archivo = db.Column(db.String(300), nullable=False)
    actividad_id = db.Column(db.Integer,
                             db.ForeignKey('actividad.id'),
                             nullable=False)

    def __repr__(self):
        return '<Foto {}: {}>'.format(self.id, self.nombre_archivo)
