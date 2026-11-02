-- =====================================================================
-- BASE DE DATOS UNIFICADA: ISUJ + SISTEMA DE USUARIOS, ROLES Y PERMISOS
-- MOTOR: SQLite 3 / sql.js (Adaptado 100% para SQLite desde MySQL 8.0+)
--
-- Combina:
--   1) Modelo académico ISUJ (sedes, escuelas, carreras, aulas, docentes,
--      asignaturas, planificación académica, horarios, feriados, etc.)
--   2) Sistema de seguridad unificado (usuarios, roles, módulos, permisos,
--      usuario_roles, rol_modulo_permisos, auditoría).
--   3) Capa de compatibilidad (tabla/sincronización `usuario`) para asegurar
--      que la aplicación web continúe funcionando sin interrupciones.
-- =====================================================================

PRAGMA foreign_keys = OFF;

-- =====================================================================
-- BLOQUE 1: CATÁLOGOS BASE (sin dependencias)
-- =====================================================================

-- ---------------------------------------------------------------------
-- Tabla: sede
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS sede;
CREATE TABLE sede (
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

-- ---------------------------------------------------------------------
-- Tabla: asignatura
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS asignatura;
CREATE TABLE asignatura (
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

-- ---------------------------------------------------------------------
-- Tabla: dia_semana
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS dia_semana;
CREATE TABLE dia_semana (
    id_dia INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo TEXT NOT NULL UNIQUE,
    nombre TEXT NOT NULL UNIQUE,
    orden INTEGER NOT NULL UNIQUE,
    es_laborable INTEGER NOT NULL DEFAULT 1,
    estado TEXT NOT NULL DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'INACTIVO'))
);

-- ---------------------------------------------------------------------
-- Tabla: docente
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS docente;
CREATE TABLE docente (
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

-- ---------------------------------------------------------------------
-- Tabla: jornada
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS jornada;
CREATE TABLE jornada (
    id_jornada INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo TEXT NOT NULL UNIQUE,
    nombre TEXT NOT NULL UNIQUE,
    hora_inicio TEXT,
    hora_fin TEXT,
    estado TEXT NOT NULL DEFAULT 'ACTIVA' CHECK (estado IN ('ACTIVA', 'INACTIVA'))
);

-- ---------------------------------------------------------------------
-- Tabla: nivel
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS nivel;
CREATE TABLE nivel (
    id_nivel INTEGER PRIMARY KEY AUTOINCREMENT,
    numero INTEGER NOT NULL UNIQUE,
    nombre TEXT NOT NULL UNIQUE,
    descripcion TEXT,
    estado TEXT NOT NULL DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'INACTIVO'))
);

-- ---------------------------------------------------------------------
-- Tabla: paralelo
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS paralelo;
CREATE TABLE paralelo (
    id_paralelo INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo TEXT NOT NULL UNIQUE,
    descripcion TEXT,
    cupo_maximo INTEGER,
    estado TEXT NOT NULL DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'INACTIVO'))
);

-- ---------------------------------------------------------------------
-- Tabla: periodo_academico
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS periodo_academico;
CREATE TABLE periodo_academico (
    id_periodo INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo TEXT NOT NULL UNIQUE,
    nombre TEXT NOT NULL UNIQUE,
    fecha_inicio TEXT NOT NULL,
    fecha_fin TEXT NOT NULL,
    descripcion TEXT,
    estado TEXT NOT NULL DEFAULT 'PLANIFICADO' CHECK (estado IN ('PLANIFICADO', 'ACTIVO', 'FINALIZADO', 'INACTIVO'))
);

-- =====================================================================
-- BLOQUE 2: TABLAS DE SEGURIDAD (roles, módulos, permisos)
-- =====================================================================

-- ---------------------------------------------------------------------
-- Tabla: roles
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS roles;
CREATE TABLE roles (
    id_rol INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL UNIQUE,
    descripcion TEXT,
    estado TEXT NOT NULL DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'INACTIVO')),
    fecha_creacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- Tabla: modulos
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS modulos;
CREATE TABLE modulos (
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

-- ---------------------------------------------------------------------
-- Tabla: permisos
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS permisos;
CREATE TABLE permisos (
    id_permiso INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL UNIQUE,
    codigo TEXT NOT NULL UNIQUE,
    descripcion TEXT
);

-- ---------------------------------------------------------------------
-- Tabla: usuarios
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS usuarios;
CREATE TABLE usuarios (
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

-- ---------------------------------------------------------------------
-- Tabla: usuario_roles (uno o varios roles por usuario)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS usuario_roles;
CREATE TABLE usuario_roles (
    id_usuario INTEGER NOT NULL,
    id_rol INTEGER NOT NULL,
    PRIMARY KEY (id_usuario, id_rol),
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (id_rol) REFERENCES roles(id_rol) ON DELETE CASCADE ON UPDATE CASCADE
);

-- ---------------------------------------------------------------------
-- Tabla: rol_modulo_permisos
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS rol_modulo_permisos;
CREATE TABLE rol_modulo_permisos (
    id_rol INTEGER NOT NULL,
    id_modulo INTEGER NOT NULL,
    id_permiso INTEGER NOT NULL,
    PRIMARY KEY (id_rol, id_modulo, id_permiso),
    FOREIGN KEY (id_rol) REFERENCES roles(id_rol) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (id_modulo) REFERENCES modulos(id_modulo) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (id_permiso) REFERENCES permisos(id_permiso) ON DELETE CASCADE ON UPDATE CASCADE
);

-- ---------------------------------------------------------------------
-- Tabla: auditoria
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS auditoria;
CREATE TABLE auditoria (
    id_auditoria INTEGER PRIMARY KEY AUTOINCREMENT,
    id_usuario INTEGER NULL,
    modulo TEXT,
    accion TEXT NOT NULL,
    descripcion TEXT,
    ip TEXT,
    fecha TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE SET NULL ON UPDATE CASCADE
);

-- =====================================================================
-- TABLA COMPATIBLE Y SINCRONIZADA: usuario
-- Mantiene intacta la aplicación web desarrollada y sincroniza cambios
-- =====================================================================
DROP TABLE IF EXISTS usuario;
CREATE TABLE usuario (
    id_usuario INTEGER PRIMARY KEY AUTOINCREMENT,
    id_docente INTEGER,
    nombre_usuario TEXT NOT NULL UNIQUE,
    clave TEXT NOT NULL,
    correo TEXT NOT NULL UNIQUE,
    rol TEXT NOT NULL DEFAULT 'DOCENTE' CHECK (rol IN ('ADMINISTRADOR', 'COORDINADOR', 'SECRETARIA', 'DOCENTE', 'OPERADOR', 'INVITADO')),
    estado TEXT NOT NULL DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'INACTIVO', 'BLOQUEADO')),
    intentos_fallidos INTEGER NOT NULL DEFAULT 0,
    fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP,
    ultimo_acceso TEXT,
    FOREIGN KEY (id_docente) REFERENCES docente(id_docente)
);

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

-- =====================================================================
-- BLOQUE 3: JERARQUÍA ACADÉMICA (dependen de sede y unas de otras)
-- =====================================================================

-- ---------------------------------------------------------------------
-- Tabla: escuela (depende de sede)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS escuela;
CREATE TABLE escuela (
    id_escuela INTEGER PRIMARY KEY AUTOINCREMENT,
    id_sede INTEGER NOT NULL,
    codigo TEXT NOT NULL UNIQUE,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    estado TEXT NOT NULL DEFAULT 'ACTIVA' CHECK (estado IN ('ACTIVA', 'INACTIVA')),
    FOREIGN KEY (id_sede) REFERENCES sede(id_sede)
);

-- ---------------------------------------------------------------------
-- Tabla: carrera (depende de escuela)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS carrera;
CREATE TABLE carrera (
    id_carrera INTEGER PRIMARY KEY AUTOINCREMENT,
    id_escuela INTEGER NOT NULL,
    codigo TEXT NOT NULL UNIQUE,
    nombre TEXT NOT NULL,
    titulo_otorgado TEXT,
    modalidad TEXT NOT NULL CHECK (modalidad IN ('PRESENCIAL', 'VIRTUAL', 'HIBRIDA')),
    duracion_niveles INTEGER NOT NULL CHECK (duracion_niveles > 0),
    estado TEXT NOT NULL DEFAULT 'ACTIVA' CHECK (estado IN ('ACTIVA', 'INACTIVA')),
    FOREIGN KEY (id_escuela) REFERENCES escuela(id_escuela)
);

-- ---------------------------------------------------------------------
-- Tabla: bloque (depende de sede)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS bloque;
CREATE TABLE bloque (
    id_bloque INTEGER PRIMARY KEY AUTOINCREMENT,
    id_sede INTEGER NOT NULL,
    codigo TEXT NOT NULL UNIQUE,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    numero_pisos INTEGER NOT NULL DEFAULT 1,
    estado TEXT NOT NULL DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'INACTIVO')),
    FOREIGN KEY (id_sede) REFERENCES sede(id_sede)
);

-- ---------------------------------------------------------------------
-- Tabla: aula_laboratorio (depende de bloque)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS aula_laboratorio;
CREATE TABLE aula_laboratorio (
    id_aula_laboratorio INTEGER PRIMARY KEY AUTOINCREMENT,
    id_bloque INTEGER NOT NULL,
    codigo TEXT NOT NULL UNIQUE,
    nombre TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('AULA', 'LABORATORIO')),
    capacidad INTEGER NOT NULL DEFAULT 0 CHECK (capacidad >= 0),
    piso INTEGER NOT NULL DEFAULT 1,
    recursos TEXT,
    estado TEXT NOT NULL DEFAULT 'DISPONIBLE' CHECK (estado IN ('DISPONIBLE', 'OCUPADO', 'MANTENIMIENTO', 'INACTIVO')),
    FOREIGN KEY (id_bloque) REFERENCES bloque(id_bloque)
);

-- ---------------------------------------------------------------------
-- Tabla: feriado (depende de periodo_academico)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS feriado;
CREATE TABLE feriado (
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

-- =====================================================================
-- BLOQUE 4: PLANIFICACIÓN Y HORARIOS
-- =====================================================================

-- ---------------------------------------------------------------------
-- Tabla: planificacion_academica
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS planificacion_academica;
CREATE TABLE planificacion_academica (
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
    FOREIGN KEY (id_periodo) REFERENCES periodo_academico(id_periodo),
    FOREIGN KEY (usuario_registro) REFERENCES usuarios(username) ON DELETE SET NULL ON UPDATE CASCADE
);

-- ---------------------------------------------------------------------
-- Tabla: horario (depende de planificacion_academica y dia_semana)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS horario;
CREATE TABLE horario (
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

PRAGMA foreign_keys = ON;

-- =====================================================================
-- DATOS INICIALES (POBLACIÓN EXACTA)
-- =====================================================================

INSERT OR IGNORE INTO sede (id_sede, codigo, nombre, ciudad, provincia, direccion, telefono, correo, estado) VALUES
(1, 'SED-01', 'UIO_NORTE', 'QUITO', 'PICHINCHA', 'CAMPUS NORTE - AV. DE LA PRENSA Y AV. 10 DE AGOSTO', '022345671', 'uio.norte@isuj.edu.ec', 'ACTIVA'),
(2, 'SED-02', 'UIO_VALLE', 'RUMIÑAHUI', 'PICHINCHA', 'CAMPUS VALLE - AV. GENERAL RUMIÑAHUI (LOS CHILLOS)', '022345672', 'uio.valle@isuj.edu.ec', 'ACTIVA'),
(3, 'SED-03', 'UIO_SUR', 'QUITO', 'PICHINCHA', 'CAMPUS SUR - AV. PEDRO VICENTE MALDONADO Y MORÁN VALVERDE', '022345673', 'uio.sur@isuj.edu.ec', 'ACTIVA'),
(4, 'SED-04', 'SANTO DOMINGO', 'SANTO DOMINGO', 'SANTO DOMINGO DE LOS TSÁCHILAS', 'CAMPUS SANTO DOMINGO - AV. QUITO Y AV. RÍO LELIA', '022765432', 'santodomingo@isuj.edu.ec', 'ACTIVA');

INSERT OR IGNORE INTO escuela (id_escuela, id_sede, codigo, nombre, descripcion, estado) VALUES
(1, 1, 'ESC-01', 'TIC', 'Escuela de Tecnologías de la Información y Comunicación', 'ACTIVA'),
(2, 1, 'ESC-02', 'EDUCACION', 'Escuela de Ciencias de la Educación y Pedagogía', 'ACTIVA'),
(3, 1, 'ESC-03', 'INGENIERIA E INDUSTRIA', 'Escuela de Ingeniería, Producción e Industria', 'ACTIVA'),
(4, 1, 'ESC-04', 'SALUD', 'Escuela de Ciencias de la Salud, Odontología y Rehabilitación', 'ACTIVA'),
(5, 1, 'ESC-05', 'SERVICIOS', 'Escuela de Hospitalidad, Gastronomía y Servicios', 'ACTIVA'),
(6, 1, 'ESC-06', 'ADMINISTRACION', 'Escuela de Ciencias Administrativas, Contables y Gestión', 'ACTIVA');

INSERT OR IGNORE INTO carrera (id_carrera, id_escuela, codigo, nombre, titulo_otorgado, modalidad, duracion_niveles, estado) VALUES
(1,  1, 'CAR-01', 'DESARROLLO DE SOFTWARE', 'TECNÓLOGO SUPERIOR EN DESARROLLO DE SOFTWARE', 'PRESENCIAL', 5, 'ACTIVA'),
(2,  2, 'CAR-02', 'EDUCACIÓN INICIAL', 'TECNÓLOGO SUPERIOR EN EDUCACIÓN INICIAL', 'PRESENCIAL', 5, 'ACTIVA'),
(3,  3, 'CAR-03', 'ELECTRICIDAD', 'TECNÓLOGO SUPERIOR EN ELECTRICIDAD', 'PRESENCIAL', 5, 'ACTIVA'),
(4,  2, 'CAR-04', 'ENTRENAMIENTO DEPORTIVO', 'TECNÓLOGO SUPERIOR EN ENTRENAMIENTO DEPORTIVO', 'PRESENCIAL', 5, 'ACTIVA'),
(5,  4, 'CAR-05', 'ODONTOLOGÍA', 'TECNÓLOGO SUPERIOR EN ODONTOLOGÍA', 'PRESENCIAL', 6, 'ACTIVA'),
(6,  5, 'CAR-06', 'GASTRONOMÍA', 'TECNÓLOGO SUPERIOR EN GASTRONOMÍA', 'PRESENCIAL', 5, 'ACTIVA'),
(7,  5, 'CAR-07', 'GASTRONOMÍA UNIVERSITARIA', 'LICENCIADO EN GASTRONOMÍA', 'PRESENCIAL', 8, 'ACTIVA'),
(8,  4, 'CAR-08', 'ENFERMERÍA', 'TECNÓLOGO SUPERIOR EN ENFERMERÍA', 'PRESENCIAL', 5, 'ACTIVA'),
(9,  3, 'CAR-09', 'MECÁNICA AUTOMOTRIZ', 'TECNÓLOGO SUPERIOR EN MECÁNICA AUTOMOTRIZ', 'PRESENCIAL', 5, 'ACTIVA'),
(10, 4, 'CAR-10', 'REHABILITACIÓN FÍSICA', 'TECNÓLOGO SUPERIOR EN REHABILITACIÓN FÍSICA', 'PRESENCIAL', 5, 'ACTIVA'),
(11, 6, 'CAR-11', 'CONTABILIDAD Y TRIBUTACIÓN', 'TECNÓLOGO SUPERIOR EN CONTABILIDAD Y TRIBUTACIÓN', 'PRESENCIAL', 5, 'ACTIVA'),
(12, 6, 'CAR-12', 'TECNOLOGÍA SUPERIOR EN CONTABILIDAD', 'TECNÓLOGO SUPERIOR EN CONTABILIDAD', 'PRESENCIAL', 5, 'ACTIVA'),
(13, 6, 'CAR-13', 'GESTIÓN DE TALENTO HUMANO', 'TECNÓLOGO SUPERIOR EN GESTIÓN DE TALENTO HUMANO', 'PRESENCIAL', 5, 'ACTIVA'),
(14, 6, 'CAR-14', 'TECNOLOGÍA SUPERIOR EN ADMINISTRACIÓN', 'TECNÓLOGO SUPERIOR EN ADMINISTRACIÓN', 'PRESENCIAL', 5, 'ACTIVA'),
(15, 6, 'CAR-15', 'TECNOLOGÍA SUPERIOR EN MARKETING', 'TECNÓLOGO SUPERIOR EN MARKETING', 'PRESENCIAL', 5, 'ACTIVA'),
(16, 5, 'CAR-16', 'ESTÉTICA INTEGRAL', 'TECNÓLOGO SUPERIOR EN ESTÉTICA INTEGRAL', 'PRESENCIAL', 5, 'ACTIVA'),
(17, 5, 'CAR-17', 'ESTÉTICA INTEGRAL UNIVERSITARIA', 'LICENCIADO EN ESTÉTICA INTEGRAL', 'PRESENCIAL', 8, 'ACTIVA');

INSERT OR IGNORE INTO bloque (id_bloque, id_sede, codigo, nombre, descripcion, numero_pisos, estado) VALUES
(1,1,'BLQ-A','BLOQUE A','Bloque de aulas y laboratorios de computación A',3,'ACTIVO'),
(2,1,'BLQ-B','BLOQUE B','Bloque de aulas, laboratorios y talleres B',4,'ACTIVO'),
(3,1,'BLQ-C','BLOQUE C','Bloque de aulas generales y Centro Infantil C',2,'ACTIVO'),
(4,1,'BLQ-D','BLOQUE D','Laboratorios de salud: Enfermería y Rehabilitación Física D',3,'ACTIVO'),
(5,1,'BLQ-E','BLOQUE E','Bloque de aulas y talleres E',4,'ACTIVO'),
(6,1,'BLQ-F','BLOQUE F','Laboratorios técnicos: Electrotecnia, Control y Máquinas F',1,'ACTIVO'),
(7,1,'BLQ-M','BLOQUE M','Aulas M1, M2, Taller de Transferencia y Taller Matriz M',1,'ACTIVO');

INSERT OR IGNORE INTO aula_laboratorio (id_aula_laboratorio, id_bloque, codigo, nombre, tipo, capacidad, piso, recursos, estado) VALUES
-- Bloque A (11)
(1,1,'A2','AULA A2','AULA',0,1,NULL,'DISPONIBLE'),
(2,1,'A3','AULA A3','AULA',0,1,NULL,'DISPONIBLE'),
(3,1,'A4','AULA A4','AULA',34,1,NULL,'DISPONIBLE'),
(4,1,'A5','AULA A5','AULA',39,2,NULL,'DISPONIBLE'),
(5,1,'A6','AULA A6','AULA',59,2,NULL,'DISPONIBLE'),
(6,1,'A7','AULA A7','AULA',46,3,NULL,'DISPONIBLE'),
(7,1,'A8','AULA A8','AULA',17,3,NULL,'DISPONIBLE'),
(8,1,'A9','AULA A9','AULA',24,3,NULL,'DISPONIBLE'),
(9,1,'A10','AULA A10','AULA',55,3,NULL,'DISPONIBLE'),
(10,1,'LAB-COMP1','Laboratorio de computo 1','LABORATORIO',25,1,NULL,'DISPONIBLE'),
(11,1,'LAB-COMP4','Laboratorio de computo 4','LABORATORIO',12,2,NULL,'DISPONIBLE'),
-- Bloque B (27)
(12,2,'B2','AULA B2','AULA',26,1,NULL,'DISPONIBLE'),
(13,2,'B3','AULA B3','AULA',30,1,NULL,'DISPONIBLE'),
(14,2,'B4','AULA B4','AULA',33,1,NULL,'DISPONIBLE'),
(15,2,'B5','B5 (Coworking)','COWORKING',0,1,NULL,'DISPONIBLE'),
(16,2,'B6','AULA B6','AULA',26,1,NULL,'DISPONIBLE'),
(17,2,'B7','AULA B7','AULA',30,1,NULL,'DISPONIBLE'),
(18,2,'B8','AULA B8','AULA',28,1,NULL,'DISPONIBLE'),
(19,2,'B9','AULA B9','AULA',22,2,NULL,'DISPONIBLE'),
(20,2,'B10','AULA B10','AULA',34,2,NULL,'DISPONIBLE'),
(21,2,'B11','AULA B11','AULA',34,2,NULL,'DISPONIBLE'),
(22,2,'B12','AULA B12','AULA',29,2,NULL,'DISPONIBLE'),
(23,2,'B13','AULA B13','AULA',28,2,NULL,'DISPONIBLE'),
(24,2,'B14','AULA B14','AULA',33,2,NULL,'DISPONIBLE'),
(25,2,'B15','AULA B15','AULA',24,3,NULL,'DISPONIBLE'),
(26,2,'B16','AULA B16','AULA',16,3,NULL,'DISPONIBLE'),
(27,2,'B17','AULA B17','AULA',27,4,NULL,'DISPONIBLE'),
(28,2,'B20','AULA B20','AULA',16,4,NULL,'DISPONIBLE'),
(29,2,'B21','AULA B21','AULA',32,4,NULL,'DISPONIBLE'),
(30,2,'B22','AULA B22','AULA',24,4,NULL,'DISPONIBLE'),
(31,2,'B23','AULA B23','AULA',26,4,NULL,'DISPONIBLE'),
(32,2,'LAB-COMP2','Laboratorio de computo 2','LABORATORIO',22,3,NULL,'DISPONIBLE'),
(33,2,'LAB-COMP3','Laboratorio de computo 3','LABORATORIO',15,3,NULL,'DISPONIBLE'),
(34,2,'LAB-CONT','Laboratorio Contable','LABORATORIO',13,1,NULL,'DISPONIBLE'),
(35,2,'LAB-REHAB2','Laboratorio Rehabilitación Física 2','LABORATORIO',20,4,NULL,'DISPONIBLE'),
(36,2,'TAL-FACIAL-SPA','Taller Facial Maquillaje - SPA Japón','LABORATORIO',25,3,NULL,'DISPONIBLE'),
(53,2,'TAL-FACIAL','Taller Facial','LABORATORIO',20,3,NULL,'DISPONIBLE'),
(54,2,'TAL-CORP','Talleres Corporales','LABORATORIO',20,3,NULL,'DISPONIBLE'),
-- Bloque C (13)
(37,3,'C1','AULA C1','AULA',0,1,NULL,'DISPONIBLE'),
(38,3,'C2','AULA C2','AULA',0,1,NULL,'DISPONIBLE'),
(39,3,'C3','AULA C3','AULA',0,1,NULL,'DISPONIBLE'),
(40,3,'C4','AULA C4','AULA',0,1,NULL,'DISPONIBLE'),
(41,3,'C5-C6','AULA C5-C6','AULA',75,1,NULL,'DISPONIBLE'),
(43,3,'C7','AULA C7','AULA',30,1,NULL,'DISPONIBLE'),
(44,3,'C8','AULA C8','AULA',37,1,NULL,'DISPONIBLE'),
(45,3,'C9','AULA C9','AULA',59,1,NULL,'DISPONIBLE'),
(46,3,'C10','AULA C10','AULA',17,1,NULL,'DISPONIBLE'),
(47,3,'C11','AULA C11','AULA',7,1,NULL,'DISPONIBLE'),
(48,3,'C12','AULA C12','AULA',42,2,NULL,'DISPONIBLE'),
(49,3,'CENTRO-INF','Centro Infantil','AULA',25,1,NULL,'DISPONIBLE'),
-- Bloque D (3)
(50,4,'LAB-ENF1','Laboratorio Enfermería 1','LABORATORIO',24,2,NULL,'DISPONIBLE'),
(51,4,'LAB-ENF2','Laboratorio Enfermería 2','LABORATORIO',19,2,NULL,'DISPONIBLE'),
(52,4,'LAB-REHAB1','Laboratorio Rehabilitación Física 1','LABORATORIO',20,3,NULL,'DISPONIBLE'),
-- Bloque E (3)
(59,5,'E1','AULA E1','LABORATORIO',34,4,NULL,'DISPONIBLE'),
(60,5,'E2','AULA E2','LABORATORIO',36,4,NULL,'DISPONIBLE'),
(61,5,'E3','AULA E3','LABORATORIO',37,4,NULL,'DISPONIBLE'),
-- Bloque F (4)
(55,6,'ELEC-1','Electrotecnia 1','LABORATORIO',20,1,NULL,'DISPONIBLE'),
(56,6,'ELEC-2','Electrotecnia 2','LABORATORIO',20,1,NULL,'DISPONIBLE'),
(57,6,'CTRL-IND','Control Industrial','LABORATORIO',20,1,NULL,'DISPONIBLE'),
(58,6,'MAQ-ELEC','Máquinas Eléctricas','LABORATORIO',20,1,NULL,'DISPONIBLE'),
-- Bloque M (4)
(62,7,'M1','AULA M1','AULA',25,1,NULL,'DISPONIBLE'),
(63,7,'M2','AULA M2','AULA',30,1,NULL,'DISPONIBLE'),
(64,7,'TAL-TRANSF','Taller de Transferencia','LABORATORIO',40,1,NULL,'DISPONIBLE'),
(65,7,'TAL-MATRIZ','Taller Matriz','LABORATORIO',40,1,NULL,'DISPONIBLE');

INSERT OR IGNORE INTO asignatura (id_asignatura, codigo_asignatura, nombre, descripcion, horas_docencia, horas_practicas, horas_autonomas, horas_totales, creditos, estado) VALUES
(1,'GAS_UP_103','MATEMATICA FINANCIERA',NULL,48,16,32,96,2.0,'ACTIVA'),
(2,'GTH_P404','SEGURIDAD, SALUD OCUPACIONAL Y ERGONOMÍA',NULL,48,16,32,96,2.0,'ACTIVA'),
(3,'GAS_UP_105','SEGURIDAD E HIGIENE ALIMENTARIA',NULL,48,32,16,96,2.0,'ACTIVA'),
(4,'ADM_P104','ADMINISTRACION I',NULL,64,16,40,120,2.5,'ACTIVA'),
(5,'ADM_P304','ADMINISTRACIÓN FINANCIERA',NULL,64,32,44,140,3.0,'ACTIVA'),
(6,'ODO_P105','ANATOMOFISIOLOGIA ODONTOLOGICA',NULL,64,32,44,140,3.0,'ACTIVA'),
(7,'ODO_P202','BIOSEGURIDAD Y ESTERILIZACION',NULL,48,32,16,96,2.0,'ACTIVA'),
(8,'ODO_P203','CIRUGIA Y ENDODONCIA I',NULL,64,48,48,160,3.5,'ACTIVA'),
(9,'ODO_P303','CIRUGÍA Y ENDODONCIA II',NULL,64,48,48,160,3.5,'ACTIVA'),
(10,'ADM_P103','CONTABILIDAD GENERAL',NULL,64,32,44,140,3.0,'ACTIVA'),
(11,'DESF_L202','CONTABILIDAD GENERAL PARA SOFTWARE',NULL,48,16,32,96,2.0,'ACTIVA'),
(12,'MARK_P104','CONTABILIDAD GENERAL DE MARKETING',NULL,48,16,32,96,2.0,'ACTIVA'),
(13,'GAS_UP_104','DISEÑO DE MENÚS',NULL,48,32,16,96,2.0,'ACTIVA'),
(14,'ODO_P106','ESTRUCTURA Y FUNCION DEL SISTEMA ESTOMATOGNATICO',NULL,64,32,44,140,3.0,'ACTIVA'),
(15,'ADM_P305','GESTION DEL TALENTO HUMANO',NULL,64,16,40,120,2.5,'ACTIVA'),
(16,'ODO_P103','MANEJO DE EQUIPO E INSTRUMENTAL ODONTOLOGICO',NULL,48,48,24,120,2.5,'ACTIVA'),
(17,'ATH_UP_105','MANUAL DE PUESTOS',NULL,48,16,32,96,2.0,'ACTIVA'),
(18,'ODO_P104','MICROBIOLOGIA ORAL E INFECTOLOGIA',NULL,48,32,20,100,2.0,'ACTIVA'),
(19,'EST_P201','ADMINISTRACION',NULL,48,16,32,96,2.0,'ACTIVA'),
(20,'ENF_P203','ATENCION AL ADULTO MAYOR Y CUIDADOS PALEATIVOS',NULL,64,48,48,160,3.5,'ACTIVA'),
(21,'ENF_P105','BIOQUÍMICA',NULL,48,32,20,100,2.0,'ACTIVA'),
(22,'ENF_P206','ENFERMERIA EN ATENCION PRIMARIA EN SALUD',NULL,64,48,48,160,3.5,'ACTIVA'),
(23,'ENF_P205','FARMACOLOGIA APLICADA',NULL,64,32,44,140,3.0,'ACTIVA'),
(24,'ENF_P204','FISIOPATOLOGIA Y MORFOLOGIA',NULL,64,32,44,140,3.0,'ACTIVA'),
(25,'EST_P205','MASAJE II',NULL,48,64,28,140,3.0,'ACTIVA'),
(26,'ENF_P202','MICROBIOLOGIA Y PARASITOLOGIA',NULL,48,32,20,100,2.0,'ACTIVA'),
(27,'ENF_P104','MORFOFISIOLOGÍA',NULL,64,32,44,140,3.0,'ACTIVA'),
(28,'EST_P404','DIETETICA Y NUTRICION',NULL,48,16,32,96,2.0,'ACTIVA'),
(29,'EST_P301','ESTADISTICA DESCRIPTIVA',NULL,48,32,20,100,2.0,'ACTIVA'),
(30,'GTH_P401','GESTIÓN PRESUPUESTARIA',NULL,48,32,20,100,2.0,'ACTIVA'),
(31,'CONT_P402','PRESUPUESTOS',NULL,64,32,44,140,3.0,'ACTIVA'),
(32,'EST_P305','PRIMEROS AUXILIOS',NULL,32,48,20,100,2.0,'ACTIVA'),
(33,'EST_P403','TECNICA PRE-POST QUIRURGICA',NULL,48,48,24,120,2.5,'ACTIVA'),
(34,'EST_P402','TERAPIAS COMPLEMENTARIAS',NULL,48,32,20,100,2.0,'ACTIVA'),
(35,'GTH_P304','DESARROLLO HUMANO',NULL,48,16,32,96,2.0,'ACTIVA'),
(36,'EIN_P203','DISEÑO, GESTION Y EVALUACION CURRICULAR',NULL,64,16,40,120,2.5,'ACTIVA'),
(37,'EIN_P205','INICIACION A LAS OPERACIONES CONCRETAS / PRE-MATEMATICAS',NULL,64,32,44,140,3.0,'ACTIVA'),
(38,'EIN_P202','PEDAGOGIA GENERAL Y CORRIENTES PEDAGOGICAS',NULL,64,16,40,120,2.5,'ACTIVA'),
(39,'EIN_P204','PSICOLOGIA GENERAL Y EVOLUTIVA',NULL,64,16,40,120,2.5,'ACTIVA'),
(40,'CT_UP_105','CONTABILIDAD COMERCIAL',NULL,64,32,44,140,3.0,'ACTIVA'),
(41,'ADM_P303','CREATIVIDAD E INNOVACION EMPRESARIAL',NULL,48,32,20,100,2.0,'ACTIVA'),
(42,'ENF_P402','DIETETICA Y NUTRICION CLÍNICA',NULL,48,32,20,100,2.0,'ACTIVA'),
(43,'ADM_P101','ESTADISTICA',NULL,64,32,44,140,3.0,'ACTIVA'),
(44,'MARK_P302','INVESTIGACION DE MERCADO',NULL,64,32,44,140,3.0,'ACTIVA'),
(45,'ADM_P105','INVESTIGACION DE MERCADOS GENERAL',NULL,64,32,44,140,3.0,'ACTIVA'),
(46,'CONT_P301','REALIDAD NACIONAL',NULL,32,16,48,96,2.0,'ACTIVA'),
(47,'ATH_UP_103','CONTABILIDAD GENERAL RRHH',NULL,64,32,44,140,3.0,'ACTIVA'),
(48,'CT_UP_104','CONTABILIDAD GENERAL TRIBUTARIA',NULL,64,32,44,140,3.0,'ACTIVA'),
(49,'EIN_P303','DESARROLLO DEL PENSAMIENTO CIENTIFICO DEL NIÑO',NULL,48,32,20,100,2.0,'ACTIVA'),
(50,'GTH_P302','LEGISLACIÓN LABORAL Y EMPRESARIAL',NULL,64,16,40,120,2.5,'ACTIVA'),
(51,'EIN_P305','MODELOS Y PROCESOS DE INVESTIGACION EDUCATIVA',NULL,48,32,20,100,2.0,'ACTIVA'),
(52,'ATH_UP_106','RECLUTAMIENTO Y SELECCIÓN',NULL,64,32,44,140,3.0,'ACTIVA'),
(53,'DESF_L201','SISTEMAS OPERATIVOS',NULL,64,48,48,160,3.5,'ACTIVA'),
(54,'ENF_P103','DESARROLLO DE EMPRENDIMIENTO Y SOSTENIBILIDAD AMBIENTAL',NULL,32,16,48,96,2.0,'ACTIVA'),
(55,'ADM_P401','EMPRENDIMIENTO Y RESPONSABILIDAD SOCIAL',NULL,48,16,32,96,2.0,'ACTIVA'),
(56,'GTH_P402','EMPRENDIMIENTO Y RESPONSABILIDAD SOCIAL GTH',NULL,48,16,32,96,2.0,'ACTIVA'),
(57,'ENF_P306','ENFERMERIA EN URGENCIAS',NULL,64,48,48,160,3.5,'ACTIVA'),
(58,'ENF_P302','ENFERMERIA PEDIATRICA Y ADOLESCENTE',NULL,64,48,48,160,3.5,'ACTIVA'),
(59,'ADM_P403','IDENTIDAD E IMAGEN CORPORATIVA',NULL,48,32,20,100,2.0,'ACTIVA'),
(60,'ENF_P102','ÉTICA Y BIOÉTICA',NULL,32,16,48,96,2.0,'ACTIVA'),
(61,'DESF_L105','LENGUAJE DE PROGRAMACION I',NULL,64,64,32,160,3.5,'ACTIVA'),
(62,'DESF_L101','ANALISIS Y DISEÑO DE SISTEMAS',NULL,64,32,44,140,3.0,'ACTIVA'),
(63,'DESF_L104','MATEMATICA DISCRETA',NULL,64,16,40,120,2.5,'ACTIVA'),
(64,'REFI_P104','MORFOFISIOLOGIA TERAPÉUTICA',NULL,64,32,44,140,3.0,'ACTIVA'),
(65,'REFI_P305','REHABILITACION FISICA EN TRAUMATOLOGIA Y ORTOPEDIA',NULL,64,48,48,160,3.5,'ACTIVA');

INSERT OR IGNORE INTO dia_semana (id_dia, codigo, nombre, orden, es_laborable, estado) VALUES
(1,'LUN','LUNES',1,1,'ACTIVO'),
(2,'MAR','MARTES',2,1,'ACTIVO'),
(3,'MIE','MIERCOLES',3,1,'ACTIVO'),
(4,'JUE','JUEVES',4,1,'ACTIVO'),
(5,'VIE','VIERNES',5,1,'ACTIVO'),
(6,'SAB','SABADO',6,1,'ACTIVO'),
(7,'DOM','DOMINGO',7,1,'ACTIVO');

INSERT OR IGNORE INTO docente (id_docente, ci, nombres, apellidos, correo, telefono, titulo_academico, especialidad, tipo_contrato, estado) VALUES
(1,'1710000001','MARIO FERNANDO','FAJARDO VANEGAS','mario.fajardo@isuj.edu.ec',NULL,'Magíster en Finanzas',NULL,'TIEMPO COMPLETO','ACTIVO'),
(2,'1710000002','EDISON ALEXIS','TOAPANTA MURILLO','edison.toapanta@isuj.edu.ec',NULL,'Ingeniero en Talento Humano',NULL,'MEDIO TIEMPO','ACTIVO'),
(3,'1710000003','ANDREA LORENA','PAZMIÑO MENDOZA','andrea.pazmino@isuj.edu.ec',NULL,'Licenciada en Gastronomía',NULL,'TIEMPO COMPLETO','ACTIVO'),
(4,'1710000004','FREDDY ENRIQUE','RUANO CALDERON','freddy.ruano@isuj.edu.ec',NULL,'Magíster en Administración',NULL,'TIEMPO COMPLETO','ACTIVO'),
(5,'1710000005','JOSE GABRIEL','CEDEÑO VERA','jose.cedeno@isuj.edu.ec',NULL,'Economista y Auditor',NULL,'TIEMPO COMPLETO','ACTIVO'),
(6,'1710000006','MARIA DOLORES','GILER ALVAREZ','maria.giler@isuj.edu.ec',NULL,'Doctora en Odontología',NULL,'TIEMPO COMPLETO','ACTIVO'),
(7,'1710000007','MESIAS GEOVANNY','NARANJO ARMIJO','mesias.naranjo@isuj.edu.ec',NULL,'Especialista en Bioseguridad',NULL,'MEDIO TIEMPO','ACTIVO'),
(8,'1710000008','GERMAN RAMIRO','MORILLO REINOSO','german.morillo@isuj.edu.ec',NULL,'Contador Público Autorizado',NULL,'TIEMPO COMPLETO','ACTIVO'),
(9,'1710000009','ALEX DAVID','CEVALLOS ANGOS','alex.cevallos@isuj.edu.ec',NULL,'Chef Ejecutivo Internacional',NULL,'TIEMPO COMPLETO','ACTIVO'),
(10,'1710000010','JESSICA VANESSA','LEIVA MONTALVO','jessica.leiva@isuj.edu.ec',NULL,'Psicóloga Organizacional',NULL,'TIEMPO COMPLETO','ACTIVO'),
(11,'1710000011','JULIA STEFANIA','IDROBO PAREDES','julia.idrobo@isuj.edu.ec',NULL,'Odontóloga Especialista',NULL,'TIEMPO COMPLETO','ACTIVO'),
(12,'1710000012','MARIA BELEN','MAFLA BUSTOS','maria.mafla@isuj.edu.ec',NULL,'Máster en Marketing Digital',NULL,'TIEMPO COMPLETO','ACTIVO'),
(13,'1710000013','STHEFANNI CAROLINA','GOMEZ VALLEJOS','sthefanni.gomez@isuj.edu.ec',NULL,'Licenciada en Enfermería',NULL,'TIEMPO COMPLETO','ACTIVO'),
(14,'1710000014','HENRRY MARIANO','ZAMBRANO SOTO','henrry.zambrano@isuj.edu.ec',NULL,'Bioquímico Farmacéutico',NULL,'MEDIO TIEMPO','ACTIVO'),
(15,'1710000015','CRISTIAN ANDRÉS','GUERRERO ROSERO','cristian.guerrero@isuj.edu.ec',NULL,'Especialista en Salud Pública',NULL,'TIEMPO COMPLETO','ACTIVO'),
(16,'1710000016','HENRY ISRAEL','AUCANCELA MORA','henry.aucancela@isuj.edu.ec',NULL,'Médico Cirujano',NULL,'TIEMPO COMPLETO','ACTIVO'),
(17,'1710000017','VALERIA RAQUEL','ANDRADE ORTEGA','valeria.andrade@isuj.edu.ec',NULL,'Cosmiatra Médica',NULL,'TIEMPO COMPLETO','ACTIVO'),
(18,'1710000018','DAYSI ESTEFANIA','MASAPANTA CATOTA','daysi.masapanta@isuj.edu.ec',NULL,'Microbióloga',NULL,'MEDIO TIEMPO','ACTIVO'),
(19,'1710000019','SANDY LIZETH','ROMERO CANSINO','sandy.romero@isuj.edu.ec',NULL,'Morfofisióloga',NULL,'TIEMPO COMPLETO','ACTIVO'),
(20,'1710000020','CRISTOPHER MIHAIL','TUFIÑO PAREDES','cristopher.tufino@isuj.edu.ec',NULL,'Nutricionista Dietista',NULL,'TIEMPO COMPLETO','ACTIVO'),
(21,'1710000021','GENARO NICOLAS','AVILES ESTEVEZ','genaro.aviles@isuj.edu.ec',NULL,'Ingeniero Mecánico y Estadístico',NULL,'TIEMPO COMPLETO','ACTIVO'),
(22,'1710000022','TELMO RUBEN','AYALA PINTO','telmo.ayala@isuj.edu.ec',NULL,'Auditor de Presupuestos',NULL,'TIEMPO COMPLETO','ACTIVO'),
(23,'1710000023','JANETH ROSALIA','RODRIGUEZ MENDOZA','janeth.rodriguez@isuj.edu.ec',NULL,'Técnica Quirúrgica',NULL,'TIEMPO COMPLETO','ACTIVO'),
(24,'1710000024','IVONNE MARCELA','TATAYO SIMBAÑA','ivonne.tatayo@isuj.edu.ec',NULL,'Terapista Integral',NULL,'TIEMPO COMPLETO','ACTIVO'),
(25,'1710000025','IRINA ALEJANDRA','CEPEDA MOSQUERA','irina.cepeda@isuj.edu.ec',NULL,'Especialista en Desarrollo Humano',NULL,'TIEMPO COMPLETO','ACTIVO'),
(26,'1710000026','ADRIANA ELIZABETH','CEPEDA HERNANDEZ','adriana.cepeda@isuj.edu.ec',NULL,'Pedagoga Infantil',NULL,'TIEMPO COMPLETO','ACTIVO'),
(27,'1710000027','MARLENE MARINA','NARANJO RECALDE','marlene.naranjo@isuj.edu.ec',NULL,'Docente de Matemáticas Iniciales',NULL,'TIEMPO COMPLETO','ACTIVO'),
(28,'1710000028','GUADALUPE LUCILA','SUAREZ VASQUEZ','guadalupe.suarez@isuj.edu.ec',NULL,'Licenciada en Ciencias de la Educación',NULL,'TIEMPO COMPLETO','ACTIVO'),
(29,'1710000029','SANDRA ELIZABETH','RIVADENEIRA HERRERA','sandra.rivadeneira@isuj.edu.ec',NULL,'Psicóloga Infantil',NULL,'TIEMPO COMPLETO','ACTIVO'),
(30,'1710000030','ISMAEL GUSTAVO','CONRADO CARVAJAL','ismael.conrado@isuj.edu.ec',NULL,'Magíster en Contabilidad y Finanzas',NULL,'TIEMPO COMPLETO','ACTIVO'),
(31,'1710000031','MANUEL ESTEBAN','CARRERA ERAZO','manuel.carrera@isuj.edu.ec',NULL,'Especialista en Innovación',NULL,'TIEMPO COMPLETO','ACTIVO'),
(32,'1710000032','KARELYS MIROSLAVA','RECALDE LLANOS','karelys.recalde@isuj.edu.ec',NULL,'Nutricionista Clínica',NULL,'TIEMPO COMPLETO','ACTIVO'),
(33,'1710000033','IVÁN DARÍO','ORDÓÑEZ YÉPEZ','ivan.ordonez@isuj.edu.ec',NULL,'Analista de Investigación de Mercados',NULL,'TIEMPO COMPLETO','ACTIVO'),
(34,'1710000034','JORGE ROBERTO','QUISHPE RIERA','jorge.quishpe@isuj.edu.ec',NULL,'Sociólogo e Ingeniero',NULL,'TIEMPO COMPLETO','ACTIVO'),
(35,'1710000035','JOHANA PAOLA','MORENO ANDRANGO','johana.moreno@isuj.edu.ec',NULL,'Contadora Tributaria',NULL,'TIEMPO COMPLETO','ACTIVO'),
(36,'1710000036','DIANA ESTEFANIA','MUÑOZ GUERRERO','diana.munoz@isuj.edu.ec',NULL,'Educadora Inicial',NULL,'TIEMPO COMPLETO','ACTIVO'),
(37,'1710000037','SIXTO HIPOLITO','BACA PINTO','sixto.baca@isuj.edu.ec',NULL,'Abogado Laboralista',NULL,'TIEMPO COMPLETO','ACTIVO'),
(38,'1710000038','MARÍA JOSÉ','MACÍAS BÓSQUEZ','maria.macias@isuj.edu.ec',NULL,'Abogada Corporativa',NULL,'TIEMPO COMPLETO','ACTIVO'),
(39,'1710000039','DENISSE VANESA','OLIVO LALALEO','denisse.olivo@isuj.edu.ec',NULL,'Investigadora Educativa',NULL,'TIEMPO COMPLETO','ACTIVO'),
(40,'1710000040','DIANA BEATRIZ','VALENCIA JUMA','diana.valencia@isuj.edu.ec',NULL,'Psicóloga Clínica',NULL,'TIEMPO COMPLETO','ACTIVO'),
(41,'1710000041','ROBERTO LENIN','RIVADENEIRA HERRERA','roberto.rivadeneira@isuj.edu.ec',NULL,'Ingeniero en Sistemas de Información',NULL,'TIEMPO COMPLETO','ACTIVO'),
(42,'1710000042','LORENA ANABEL','RIVADENEIRA HERRERA','lorena.rivadeneira@isuj.edu.ec',NULL,'Especialista en Bioética y Emprendimiento',NULL,'TIEMPO COMPLETO','ACTIVO'),
(43,'1710000043','ANA BELEN','LLORE QUEZADA','ana.llore@isuj.edu.ec',NULL,'Enfermera Especialista en Cuidados Críticos',NULL,'TIEMPO COMPLETO','ACTIVO'),
(44,'1710000044','GABRIELA ELIZABETH','MORALES COLLAGUAZO','gabriela.morales@isuj.edu.ec',NULL,'Pediatra de Enfermería',NULL,'TIEMPO COMPLETO','ACTIVO'),
(45,'1710000045','VILMA NATALIA','CEPEDA LOPEZ','vilma.cepeda@isuj.edu.ec',NULL,'Diseñadora de Imagen Corporativa',NULL,'MEDIO TIEMPO','ACTIVO'),
(46,'1710000046','KARINA MICHELE','FONSECA NARANJO','karina.fonseca@isuj.edu.ec',NULL,'Especialista en Estrategias Lúdicas',NULL,'TIEMPO COMPLETO','ACTIVO'),
(47,'1710000047','RUTH ISABEL','GALLEGOS MONTERO','ruth.gallegos@isuj.edu.ec',NULL,'Consultora de RRHH',NULL,'TIEMPO COMPLETO','ACTIVO'),
(48,'1710000048','DIEGO MAURICIO','TUZO FLORES','diego.tuzo@isuj.edu.ec',NULL,'Matemático Aplicado',NULL,'TIEMPO COMPLETO','ACTIVO'),
(49,'1710000049','JAVIER FERNANDO','BALDEÓN CEPEDA','javier.baldeon@isuj.edu.ec',NULL,'Ingeniero Automotriz y Metrólogo',NULL,'TIEMPO COMPLETO','ACTIVO'),
(50,'1710000050','ALEX JAVIER','ATAHUALPA ALDAZ','alex.atahualpa@isuj.edu.ec',NULL,'Fisioterapeuta y Farmacólogo',NULL,'TIEMPO COMPLETO','ACTIVO');

INSERT OR IGNORE INTO jornada (id_jornada, codigo, nombre, hora_inicio, hora_fin, estado) VALUES
(1,'MAT','MATUTINA','08:00:00','12:00:00','ACTIVA'),
(2,'VES','VESPERTINA','13:00:00','17:00:00','ACTIVA'),
(3,'NOC','NOCTURNA','18:00:00','22:00:00','ACTIVA'),
(4,'SAB','SABATINA','07:00:00','18:00:00','ACTIVA'),
(5,'DOM','DOMINICAL','07:00:00','18:00:00','ACTIVA');

INSERT OR IGNORE INTO nivel (id_nivel, numero, nombre, descripcion, estado) VALUES
(1,1,'NIVEL 1','Primer nivel','ACTIVO'),
(2,2,'NIVEL 2','Segundo nivel','ACTIVO'),
(3,3,'NIVEL 3','Tercer nivel','ACTIVO'),
(4,4,'NIVEL 4','Cuarto nivel','ACTIVO');

INSERT OR IGNORE INTO paralelo (id_paralelo, codigo, descripcion, cupo_maximo, estado) VALUES
(1,'A','Paralelo A',35,'ACTIVO');

INSERT OR IGNORE INTO periodo_academico (id_periodo, codigo, nombre, fecha_inicio, fecha_fin, descripcion, estado) VALUES
(1,'PER-2026-1','PERIODO ACADEMICO 2026-1','2026-03-01','2026-08-31','Primer periodo académico del año 2026','ACTIVO');

INSERT OR IGNORE INTO feriado (id_feriado, codigo, nombre, desde, hasta, id_periodo, descripcion, estado) VALUES
(1,'FER-2026-01','AÑO NUEVO','2026-01-01','2026-01-03',NULL,'Feriado de Año Nuevo','ACTIVO'),
(2,'FER-2026-02','CARNAVAL','2026-02-16','2026-02-17',NULL,'Feriado de Carnaval','ACTIVO'),
(3,'FER-2026-03','SEMANA SANTA','2026-04-06','2026-04-08',NULL,'Jueves y Viernes Santo','ACTIVO'),
(4,'FER-2026-04','DIA DEL TRABAJO','2026-05-01','2026-05-03',NULL,'Feriado por el Día del Trabajo','ACTIVO'),
(5,'FER-2026-05','BATALLA DE PICHINCHA','2026-05-25','2026-05-25',NULL,'Conmemoración de la Batalla de Pichincha','ACTIVO'),
(6,'FER-2026-06','PRIMER GRITO DE INDEPENDENCIA','2026-08-10','2026-08-10',NULL,'Primer Grito de la Independencia','ACTIVO'),
(7,'FER-2026-07','INDEPENDENCIA DE GUAYAQUIL','2026-10-09','2026-10-11',NULL,'Feriado por la Independencia de Guayaquil','ACTIVO'),
(8,'FER-2026-08','DIA DE LOS DIFUNTOS','2026-11-02','2026-11-02',NULL,'Día de los Difuntos','ACTIVO'),
(9,'FER-2026-09','INDEPENDENCIA DE CUENCA','2026-11-03','2026-11-03',NULL,'Independencia de Cuenca','ACTIVO'),
(10,'FER-2026-10','NAVIDAD','2026-12-25','2026-12-25',NULL,'Feriado de Navidad','ACTIVO');

-- ---------------------------------------------------------------------
-- Roles
-- ---------------------------------------------------------------------
INSERT OR IGNORE INTO roles (id_rol, nombre, descripcion, estado) VALUES
(1,'ADMINISTRADOR','Control total del sistema','ACTIVO'),
(2,'COORDINADOR','Gestión de planificación académica','ACTIVO'),
(3,'SECRETARIA','Gestión administrativa y de matrículas','ACTIVO'),
(4,'DOCENTE','Acceso a su información y horarios','ACTIVO'),
(5,'OPERADOR','Operación de módulos asignados','ACTIVO'),
(6,'INVITADO','Acceso de solo lectura','ACTIVO');

-- ---------------------------------------------------------------------
-- Usuarios
-- ---------------------------------------------------------------------
INSERT OR IGNORE INTO usuarios (id_usuario, id_docente, nombres, apellidos, username, email, password_hash, cargo, estado, intentos_fallidos, fecha_creacion, ultimo_acceso) VALUES
(1,NULL,'ADMINISTRADOR','DEL SISTEMA','admin','admin@isuj.edu.ec','admin123','Administrador de Sistema','ACTIVO',0,'2026-03-01 08:00:00',NULL),
(2,NULL,'COORDINACION','ACADEMICA','coordinador','coordinacion@isuj.edu.ec','coord123','Coordinador Académico','ACTIVO',0,'2026-03-01 08:00:00',NULL),
(3,NULL,'SECRETARIA','GENERAL','secretaria','secretaria@isuj.edu.ec','secre123','Secretaria','ACTIVO',0,'2026-03-01 08:00:00',NULL),
(4,1,'INVITADO','DEL SISTEMA','invitado','invitado@isuj.edu.ec','invitado123','Invitado','ACTIVO',0,'2026-03-01 08:00:00',NULL),
(5,1,'MARIO FERNANDO','FAJARDO VANEGAS','mfajardo','mario.fajardo@isuj.edu.ec','docente1','Docente','ACTIVO',0,'2026-03-01 08:00:00',NULL);

-- ---------------------------------------------------------------------
-- Usuario Roles
-- ---------------------------------------------------------------------
INSERT OR IGNORE INTO usuario_roles (id_usuario, id_rol) VALUES
(1,1), -- admin -> ADMINISTRADOR
(2,5), -- coordinador -> OPERADOR
(3,5), -- secretaria -> OPERADOR
(4,6), -- invitado -> INVITADO
(5,4); -- mfajardo -> DOCENTE

-- ---------------------------------------------------------------------
-- Población en tabla compatible usuario
-- ---------------------------------------------------------------------
INSERT OR IGNORE INTO usuario (id_usuario, id_docente, nombre_usuario, clave, correo, rol, estado, intentos_fallidos, fecha_creacion) VALUES
(1, NULL, 'admin', 'admin123', 'admin@isuj.edu.ec', 'ADMINISTRADOR', 'ACTIVO', 0, '2026-03-01 08:00:00'),
(2, NULL, 'coordinador', 'coord123', 'coordinacion@isuj.edu.ec', 'OPERADOR', 'ACTIVO', 0, '2026-03-01 08:00:00'),
(3, NULL, 'secretaria', 'secre123', 'secretaria@isuj.edu.ec', 'OPERADOR', 'ACTIVO', 0, '2026-03-01 08:00:00'),
(4, 1, 'invitado', 'invitado123', 'invitado@isuj.edu.ec', 'INVITADO', 'ACTIVO', 0, '2026-03-01 08:00:00'),
(5, 1, 'mfajardo', 'docente1', 'mario.fajardo@isuj.edu.ec', 'DOCENTE', 'ACTIVO', 0, '2026-03-01 08:00:00');

-- ---------------------------------------------------------------------
-- Planificaciones y Horarios (Limpios por petición del usuario)

