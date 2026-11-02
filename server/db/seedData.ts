/**
 * 100% de los datos exactos del archivo SQL proporcionado (Paste September 06-2026-12:04am)
 * Sede, Escuela, Carreras, Niveles, Paralelos, Jornadas, Bloques, Aulas/Laboratorios,
 * Docentes, Asignaturas, Periodos, Feriados 2026, Usuarios, Planificaciones y Horarios.
 */

export const SEED_SQL = `
-- TABLA: SEDE
CREATE TABLE IF NOT EXISTS sede (
    id_sede INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo TEXT NOT NULL UNIQUE,
    nombre TEXT NOT NULL UNIQUE,
    ciudad TEXT NOT NULL,
    provincia TEXT NOT NULL,
    direccion TEXT,
    telefono TEXT,
    correo TEXT,
    estado TEXT NOT NULL DEFAULT 'ACTIVA' CHECK (estado IN ('ACTIVA', 'INACTIVA'))
);

-- TABLA: ESCUELA
CREATE TABLE IF NOT EXISTS escuela (
    id_escuela INTEGER PRIMARY KEY AUTOINCREMENT,
    id_sede INTEGER NOT NULL,
    codigo TEXT NOT NULL UNIQUE,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    estado TEXT NOT NULL DEFAULT 'ACTIVA' CHECK (estado IN ('ACTIVA', 'INACTIVA')),
    FOREIGN KEY (id_sede) REFERENCES sede(id_sede)
);

-- TABLA: CARRERA
CREATE TABLE IF NOT EXISTS carrera (
    id_carrera INTEGER PRIMARY KEY AUTOINCREMENT,
    id_escuela INTEGER NOT NULL,
    codigo TEXT NOT NULL UNIQUE,
    nombre TEXT NOT NULL,
    titulo_otorgado TEXT,
    modalidad TEXT NOT NULL CHECK (modalidad IN ('PRESENCIAL', 'VIRTUAL', 'HIBRIDA')),
    duracion_niveles INTEGER NOT NULL CHECK (duracion_niveles > 0),
    numero_semanas INTEGER NOT NULL DEFAULT 16 CHECK (numero_semanas > 0),
    estado TEXT NOT NULL DEFAULT 'ACTIVA' CHECK (estado IN ('ACTIVA', 'INACTIVA')),
    FOREIGN KEY (id_escuela) REFERENCES escuela(id_escuela)
);

-- TABLA: ASIGNATURA
CREATE TABLE IF NOT EXISTS asignatura (
    id_asignatura INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo_asignatura TEXT NOT NULL UNIQUE,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    horas_docencia INTEGER NOT NULL DEFAULT 0,
    horas_practicas INTEGER NOT NULL DEFAULT 0,
    horas_autonomas INTEGER NOT NULL DEFAULT 0,
    horas_totales INTEGER NOT NULL DEFAULT 0,
    creditos REAL NOT NULL DEFAULT 0,
    estado TEXT NOT NULL DEFAULT 'ACTIVA' CHECK (estado IN ('ACTIVA', 'INACTIVA'))
);

-- TABLA: DOCENTE
CREATE TABLE IF NOT EXISTS docente (
    id_docente INTEGER PRIMARY KEY AUTOINCREMENT,
    ci TEXT NOT NULL UNIQUE,
    nombres TEXT NOT NULL,
    apellidos TEXT NOT NULL,
    correo TEXT NOT NULL UNIQUE,
    telefono TEXT,
    titulo_academico TEXT,
    especialidad TEXT,
    tipo_contrato TEXT,
    estado TEXT NOT NULL DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'INACTIVO'))
);

-- TABLA: NIVEL
CREATE TABLE IF NOT EXISTS nivel (
    id_nivel INTEGER PRIMARY KEY AUTOINCREMENT,
    numero INTEGER NOT NULL UNIQUE,
    nombre TEXT NOT NULL UNIQUE,
    descripcion TEXT,
    estado TEXT NOT NULL DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'INACTIVO'))
);

-- TABLA: PARALELO
CREATE TABLE IF NOT EXISTS paralelo (
    id_paralelo INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo TEXT NOT NULL UNIQUE,
    descripcion TEXT,
    cupo_maximo INTEGER,
    estado TEXT NOT NULL DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'INACTIVO'))
);

-- TABLA: JORNADA
CREATE TABLE IF NOT EXISTS jornada (
    id_jornada INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo TEXT NOT NULL UNIQUE,
    nombre TEXT NOT NULL UNIQUE,
    hora_inicio TEXT,
    hora_fin TEXT,
    estado TEXT NOT NULL DEFAULT 'ACTIVA' CHECK (estado IN ('ACTIVA', 'INACTIVA'))
);

-- TABLA: HORA / FRANJA HORARIA ACADÉMICA
CREATE TABLE IF NOT EXISTS hora (
    id_hora INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo TEXT NOT NULL UNIQUE,
    nombre TEXT NOT NULL,
    hora_inicio TEXT NOT NULL,
    hora_fin TEXT NOT NULL,
    id_jornada INTEGER,
    orden INTEGER DEFAULT 1,
    estado TEXT NOT NULL DEFAULT 'ACTIVA' CHECK (estado IN ('ACTIVA', 'INACTIVA')),
    FOREIGN KEY (id_jornada) REFERENCES jornada(id_jornada)
);

-- TABLA: BLOQUE
CREATE TABLE IF NOT EXISTS bloque (
    id_bloque INTEGER PRIMARY KEY AUTOINCREMENT,
    id_sede INTEGER NOT NULL,
    codigo TEXT NOT NULL UNIQUE,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    numero_pisos INTEGER NOT NULL DEFAULT 1,
    estado TEXT NOT NULL DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'INACTIVO')),
    FOREIGN KEY (id_sede) REFERENCES sede(id_sede)
);

-- TABLA: AULA_LABORATORIO
CREATE TABLE IF NOT EXISTS aula_laboratorio (
    id_aula_laboratorio INTEGER PRIMARY KEY AUTOINCREMENT,
    id_bloque INTEGER NOT NULL,
    codigo TEXT NOT NULL UNIQUE,
    nombre TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('AULA', 'LABORATORIO')),
    capacidad INTEGER NOT NULL CHECK (capacidad > 0),
    piso INTEGER NOT NULL DEFAULT 1,
    recursos TEXT,
    estado TEXT NOT NULL DEFAULT 'DISPONIBLE' CHECK (estado IN ('DISPONIBLE', 'OCUPADO', 'MANTENIMIENTO', 'INACTIVO')),
    FOREIGN KEY (id_bloque) REFERENCES bloque(id_bloque)
);

-- TABLA: PERIODO_ACADEMICO
CREATE TABLE IF NOT EXISTS periodo_academico (
    id_periodo INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo TEXT NOT NULL UNIQUE,
    nombre TEXT NOT NULL UNIQUE,
    fecha_inicio TEXT NOT NULL,
    fecha_fin TEXT NOT NULL,
    descripcion TEXT,
    estado TEXT NOT NULL DEFAULT 'PLANIFICADO' CHECK (estado IN ('PLANIFICADO', 'ACTIVO', 'FINALIZADO', 'INACTIVO'))
);

-- TABLA: FERIADO
CREATE TABLE IF NOT EXISTS feriado (
    id_feriado INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo TEXT NOT NULL UNIQUE,
    nombre TEXT NOT NULL,
    desde TEXT NOT NULL,
    hasta TEXT NOT NULL,
    id_periodo INTEGER,
    descripcion TEXT,
    estado TEXT NOT NULL DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'INACTIVO')),
    FOREIGN KEY (id_periodo) REFERENCES periodo_academico(id_periodo)
);

-- TABLA: DIA_SEMANA
CREATE TABLE IF NOT EXISTS dia_semana (
    id_dia INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo TEXT NOT NULL UNIQUE,
    nombre TEXT NOT NULL UNIQUE,
    orden INTEGER NOT NULL UNIQUE,
    es_laborable INTEGER NOT NULL DEFAULT 1,
    estado TEXT NOT NULL DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'INACTIVO'))
);

-- TABLA: PLANIFICACION_ACADEMICA
CREATE TABLE IF NOT EXISTS planificacion_academica (
    id_planificacion INTEGER PRIMARY KEY AUTOINCREMENT,
    id_sede INTEGER NOT NULL,
    id_escuela INTEGER NOT NULL,
    id_carrera INTEGER NOT NULL,
    id_asignatura INTEGER NOT NULL,
    id_docente INTEGER NOT NULL,
    id_nivel INTEGER NOT NULL,
    id_paralelo INTEGER NOT NULL,
    id_jornada INTEGER NOT NULL,
    id_bloque INTEGER NOT NULL,
    id_aula_laboratorio INTEGER NOT NULL,
    id_periodo INTEGER NOT NULL,
    numero_estudiantes INTEGER NOT NULL DEFAULT 0,
    curso_unificado INTEGER NOT NULL DEFAULT 0,
    unificada_carrera TEXT,
    unificada_nivel TEXT,
    unificada_codigo TEXT,
    unificada_asignatura TEXT,
    total_clases INTEGER NOT NULL DEFAULT 0,
    observaciones TEXT,
    estado TEXT NOT NULL DEFAULT 'PLANIFICADO' CHECK (estado IN ('PLANIFICADO', 'ACTIVO', 'FINALIZADO', 'CANCELADO')),
    fecha_registro TEXT DEFAULT CURRENT_TIMESTAMP,
    usuario_registro TEXT,
    FOREIGN KEY (id_sede) REFERENCES sede(id_sede),
    FOREIGN KEY (id_escuela) REFERENCES escuela(id_escuela),
    FOREIGN KEY (id_carrera) REFERENCES carrera(id_carrera),
    FOREIGN KEY (id_asignatura) REFERENCES asignatura(id_asignatura),
    FOREIGN KEY (id_docente) REFERENCES docente(id_docente),
    FOREIGN KEY (id_nivel) REFERENCES nivel(id_nivel),
    FOREIGN KEY (id_paralelo) REFERENCES paralelo(id_paralelo),
    FOREIGN KEY (id_jornada) REFERENCES jornada(id_jornada),
    FOREIGN KEY (id_bloque) REFERENCES bloque(id_bloque),
    FOREIGN KEY (id_aula_laboratorio) REFERENCES aula_laboratorio(id_aula_laboratorio),
    FOREIGN KEY (id_periodo) REFERENCES periodo_academico(id_periodo)
);

-- TABLA: HORARIO
CREATE TABLE IF NOT EXISTS horario (
    id_horario INTEGER PRIMARY KEY AUTOINCREMENT,
    id_planificacion INTEGER NOT NULL,
    id_dia INTEGER NOT NULL,
    hora_inicio TEXT NOT NULL,
    hora_fin TEXT NOT NULL,
    numero_horas REAL NOT NULL DEFAULT 0,
    modalidad TEXT NOT NULL DEFAULT 'PRESENCIAL' CHECK (modalidad IN ('PRESENCIAL', 'VIRTUAL', 'HIBRIDA')),
    observacion TEXT,
    estado TEXT NOT NULL DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'INACTIVO')),
    FOREIGN KEY (id_planificacion) REFERENCES planificacion_academica(id_planificacion) ON DELETE CASCADE,
    FOREIGN KEY (id_dia) REFERENCES dia_semana(id_dia)
);

-- =====================================================================
-- SISTEMA DE SEGURIDAD (ROLES, MÓDULOS, PERMISOS, USUARIOS, AUDITORÍA)
-- =====================================================================

-- TABLA: ROLES
CREATE TABLE IF NOT EXISTS roles (
    id_rol INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL UNIQUE,
    descripcion TEXT,
    estado TEXT NOT NULL DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'INACTIVO')),
    fecha_creacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- TABLA: MODULOS
CREATE TABLE IF NOT EXISTS modulos (
    id_modulo INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    codigo TEXT NOT NULL UNIQUE,
    descripcion TEXT,
    icono TEXT,
    ruta TEXT,
    id_modulo_padre INTEGER NULL,
    orden INTEGER NOT NULL DEFAULT 0,
    estado TEXT NOT NULL DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'INACTIVO')),
    FOREIGN KEY (id_modulo_padre) REFERENCES modulos(id_modulo) ON DELETE SET NULL ON UPDATE CASCADE
);

-- TABLA: PERMISOS
CREATE TABLE IF NOT EXISTS permisos (
    id_permiso INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL UNIQUE,
    codigo TEXT NOT NULL UNIQUE,
    descripcion TEXT
);

-- TABLA: USUARIOS
CREATE TABLE IF NOT EXISTS usuarios (
    id_usuario INTEGER PRIMARY KEY AUTOINCREMENT,
    id_docente INTEGER NULL,
    nombres TEXT NOT NULL,
    apellidos TEXT NOT NULL,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    telefono TEXT,
    cargo TEXT,
    foto TEXT,
    estado TEXT NOT NULL DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'INACTIVO', 'BLOQUEADO')),
    ultimo_acceso TEXT NULL,
    intentos_fallidos INTEGER NOT NULL DEFAULT 0,
    fecha_creacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_docente) REFERENCES docente(id_docente) ON DELETE SET NULL ON UPDATE CASCADE
);

-- TABLA: USUARIO_ROLES
CREATE TABLE IF NOT EXISTS usuario_roles (
    id_usuario INTEGER NOT NULL,
    id_rol INTEGER NOT NULL,
    PRIMARY KEY (id_usuario, id_rol),
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (id_rol) REFERENCES roles(id_rol) ON DELETE CASCADE ON UPDATE CASCADE
);

-- TABLA: ROL_MODULO_PERMISOS
CREATE TABLE IF NOT EXISTS rol_modulo_permisos (
    id_rol INTEGER NOT NULL,
    id_modulo INTEGER NOT NULL,
    id_permiso INTEGER NOT NULL,
    PRIMARY KEY (id_rol, id_modulo, id_permiso),
    FOREIGN KEY (id_rol) REFERENCES roles(id_rol) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (id_modulo) REFERENCES modulos(id_modulo) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (id_permiso) REFERENCES permisos(id_permiso) ON DELETE CASCADE ON UPDATE CASCADE
);

-- TABLA: AUDITORIA
CREATE TABLE IF NOT EXISTS auditoria (
    id_auditoria INTEGER PRIMARY KEY AUTOINCREMENT,
    id_usuario INTEGER NULL,
    modulo TEXT,
    accion TEXT NOT NULL,
    descripcion TEXT,
    ip TEXT,
    fecha TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE SET NULL ON UPDATE CASCADE
);

-- TABLA: USUARIO (Capa compatible para la aplicación desarrollada)
CREATE TABLE IF NOT EXISTS usuario (
    id_usuario INTEGER PRIMARY KEY AUTOINCREMENT,
    id_docente INTEGER,
    nombre_usuario TEXT NOT NULL UNIQUE,
    clave TEXT NOT NULL,
    correo TEXT NOT NULL UNIQUE,
    rol TEXT NOT NULL DEFAULT 'DOCENTE' CHECK (rol IN ('SUPERADMIN', 'ADMINISTRADOR', 'COORDINADOR', 'DOCENTE', 'OPERADOR', 'AUDITOR', 'CONDULTA', 'CONSULTA', 'INVITADO', 'ESTUDIANTE', 'USUARIO_CONSULTA', 'SECRETARIA')),
    estado TEXT NOT NULL DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'INACTIVO', 'BLOQUEADO')),
    intentos_fallidos INTEGER NOT NULL DEFAULT 0,
    fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP,
    ultimo_acceso TEXT,
    FOREIGN KEY (id_docente) REFERENCES docente(id_docente)
);

-- TRIGGERS DE SINCRONIZACIÓN BIDIRECCIONAL
CREATE TRIGGER IF NOT EXISTS trg_sync_usuario_from_usuarios
AFTER INSERT ON usuarios
BEGIN
    INSERT OR REPLACE INTO usuario (id_usuario, id_docente, nombre_usuario, clave, correo, rol, estado, intentos_fallidos, fecha_creacion, ultimo_acceso)
    VALUES (
        NEW.id_usuario,
        NEW.id_docente,
        NEW.username,
        NEW.password_hash,
        NEW.email,
        COALESCE((SELECT r.nombre FROM usuario_roles ur JOIN roles r ON ur.id_rol = r.id_rol WHERE ur.id_usuario = NEW.id_usuario LIMIT 1), 'INVITADO'),
        NEW.estado,
        NEW.intentos_fallidos,
        NEW.fecha_creacion,
        NEW.ultimo_acceso
    );
END;

CREATE TRIGGER IF NOT EXISTS trg_sync_usuario_update_from_usuarios
AFTER UPDATE ON usuarios
BEGIN
    UPDATE usuario
    SET id_docente = NEW.id_docente,
        nombre_usuario = NEW.username,
        clave = NEW.password_hash,
        correo = NEW.email,
        rol = COALESCE((SELECT r.nombre FROM usuario_roles ur JOIN roles r ON ur.id_rol = r.id_rol WHERE ur.id_usuario = NEW.id_usuario LIMIT 1), 'INVITADO'),
        estado = NEW.estado,
        intentos_fallidos = NEW.intentos_fallidos,
        ultimo_acceso = NEW.ultimo_acceso
    WHERE id_usuario = OLD.id_usuario;
END;

CREATE TRIGGER IF NOT EXISTS trg_sync_usuarios_from_usuario_update
AFTER UPDATE ON usuario
BEGIN
    UPDATE usuarios
    SET ultimo_acceso = NEW.ultimo_acceso,
        intentos_fallidos = NEW.intentos_fallidos,
        estado = NEW.estado,
        password_hash = NEW.clave,
        fecha_actualizacion = CURRENT_TIMESTAMP
    WHERE id_usuario = OLD.id_usuario;
END;

CREATE TRIGGER IF NOT EXISTS trg_sync_usuario_from_usuario_roles
AFTER INSERT ON usuario_roles
BEGIN
    UPDATE usuario
    SET rol = COALESCE((SELECT r.nombre FROM roles r WHERE r.id_rol = NEW.id_rol), rol)
    WHERE id_usuario = NEW.id_usuario;
END;

CREATE TRIGGER IF NOT EXISTS trg_sync_usuario_from_usuario_roles_update
AFTER UPDATE ON usuario_roles
BEGIN
    UPDATE usuario
    SET rol = COALESCE((SELECT r.nombre FROM roles r WHERE r.id_rol = NEW.id_rol), rol)
    WHERE id_usuario = NEW.id_usuario;
END;
`;
