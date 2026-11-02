import type { Database } from 'sql.js';

export function seedSecurityData(db: Database): void {
  // 1. Crear tablas si no existen
  db.run(`
    CREATE TABLE IF NOT EXISTS roles (
        id_rol INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL UNIQUE,
        descripcion TEXT,
        emoji TEXT,
        color TEXT,
        estado TEXT NOT NULL DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'INACTIVO')),
        fecha_creacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

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

    CREATE TABLE IF NOT EXISTS permisos (
        id_permiso INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL UNIQUE,
        codigo TEXT NOT NULL UNIQUE,
        descripcion TEXT
    );

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

    CREATE TABLE IF NOT EXISTS usuario_roles (
        id_usuario INTEGER NOT NULL,
        id_rol INTEGER NOT NULL,
        PRIMARY KEY (id_usuario, id_rol),
        FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY (id_rol) REFERENCES roles(id_rol) ON DELETE CASCADE ON UPDATE CASCADE
    );

    CREATE TABLE IF NOT EXISTS usuario_permisos_override (
        id_usuario INTEGER NOT NULL,
        modulo TEXT NOT NULL,
        permisos_json TEXT NOT NULL,
        fecha_actualizacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id_usuario, modulo),
        FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE ON UPDATE CASCADE
    );

    CREATE TABLE IF NOT EXISTS rol_modulo_permisos (
        id_rol INTEGER NOT NULL,
        id_modulo INTEGER NOT NULL,
        id_permiso INTEGER NOT NULL,
        PRIMARY KEY (id_rol, id_modulo, id_permiso),
        FOREIGN KEY (id_rol) REFERENCES roles(id_rol) ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY (id_modulo) REFERENCES modulos(id_modulo) ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY (id_permiso) REFERENCES permisos(id_permiso) ON DELETE CASCADE ON UPDATE CASCADE
    );

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

    CREATE TABLE IF NOT EXISTS grupos (
        id_grupo INTEGER PRIMARY KEY AUTOINCREMENT,
        codigo TEXT NOT NULL UNIQUE,
        nombre TEXT NOT NULL,
        descripcion TEXT,
        emoji TEXT DEFAULT '👥',
        color TEXT DEFAULT 'purple',
        id_rol_defecto INTEGER NULL,
        estado TEXT NOT NULL DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'INACTIVO')),
        fecha_creacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (id_rol_defecto) REFERENCES roles(id_rol) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS usuario_grupos (
        id_usuario INTEGER NOT NULL,
        id_grupo INTEGER NOT NULL,
        fecha_asignacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id_usuario, id_grupo),
        FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
        FOREIGN KEY (id_grupo) REFERENCES grupos(id_grupo) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS grupo_permisos (
        id_grupo INTEGER NOT NULL,
        id_modulo INTEGER NOT NULL,
        id_permiso INTEGER NOT NULL,
        PRIMARY KEY (id_grupo, id_modulo, id_permiso),
        FOREIGN KEY (id_grupo) REFERENCES grupos(id_grupo) ON DELETE CASCADE,
        FOREIGN KEY (id_modulo) REFERENCES modulos(id_modulo) ON DELETE CASCADE,
        FOREIGN KEY (id_permiso) REFERENCES permisos(id_permiso) ON DELETE CASCADE
    );
  `);

  // Asegurar columnas opcionales sin romper si ya existen
  try { db.run("ALTER TABLE roles ADD COLUMN emoji TEXT;"); } catch (_) {}
  try { db.run("ALTER TABLE roles ADD COLUMN color TEXT;"); } catch (_) {}
  try { db.run("ALTER TABLE usuarios ADD COLUMN telefono TEXT;"); } catch (_) {}
  try { db.run("ALTER TABLE usuarios ADD COLUMN cargo TEXT;"); } catch (_) {}

  // Triggers de sincronización con tabla legacy usuario
  db.run(`
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

    CREATE TRIGGER IF NOT EXISTS trg_sync_usuario_from_usuario_roles
    AFTER INSERT ON usuario_roles
    BEGIN
        UPDATE usuario
        SET rol = COALESCE((SELECT r.nombre FROM roles r WHERE r.id_rol = NEW.id_rol), rol)
        WHERE id_usuario = NEW.id_usuario;
    END;
  `);

  // 2. Roles Institucionales Oficiales (7 roles de acuerdo a la matriz normativa)
  db.run(`
    DELETE FROM usuario_permisos_override;
    DELETE FROM rol_modulo_permisos;
    DELETE FROM grupo_permisos;
    DELETE FROM usuario_grupos;
    DELETE FROM usuario_roles;
    DELETE FROM grupos;
    DELETE FROM modulos;
    DELETE FROM permisos;
    DELETE FROM roles;

    INSERT INTO roles (id_rol, nombre, descripcion, emoji, color, estado) VALUES
    (1, 'SUPERADMIN', 'Acceso total a todos los módulos', '🔴', 'red', 'ACTIVO'),
    (2, 'ADMINISTRADOR', 'Gestión operativa institucional', '🟠', 'orange', 'ACTIVO'),
    (3, 'COORDINADOR', 'Gestión académica por facultad', '🟡', 'amber', 'ACTIVO'),
    (4, 'DOCENTE', 'Acceso a horarios y aulas asignadas', '🔵', 'blue', 'ACTIVO'),
    (5, 'OPERADOR', 'Tareas administrativas de apoyo', '🟢', 'emerald', 'ACTIVO'),
    (6, 'AUDITOR', 'Auditoría interna forense y bitácoras', '🟣', 'purple', 'ACTIVO'),
    (7, 'CONDULTA', 'Solo lectura, sin edición', '🟤', 'stone', 'ACTIVO');
  `);

  // 3. Grupos Institucionales (incluyendo los grupos de la imagen de referencia)
  db.run(`
    INSERT INTO grupos (id_grupo, codigo, nombre, descripcion, emoji, color, id_rol_defecto, estado) VALUES
    (1, 'ADMIN_TI', 'Administración TI', 'Infraestructura, sistemas y soporte técnico', '💻', 'purple', 1, 'ACTIVO'),
    (2, 'COORDINACIONES', 'Coordinaciones', 'Coordinadores académicos por facultad', '📚', 'amber', 3, 'ACTIVO'),
    (3, 'VICERRECTORADO', 'Vicerrectorado', 'Dirección académica y administrativa', '🏛️', 'indigo', 2, 'ACTIVO'),
    (4, 'DIRECCION_ACAD', 'Dirección Académica', 'Dirección general y gestión operativa de carreras y facultades', '🎓', 'blue', 2, 'ACTIVO'),
    (5, 'DOCENTES_TITULARES', 'Docentes Titulares', 'Cuerpo docente titular de la institución con carga horaria regular', '👨‍🏫', 'teal', 4, 'ACTIVO'),
    (6, 'DOCENTES_OCASIONALES', 'Docentes Ocasionales', 'Cuerpo docente contratado u ocasional por periodo académico', '👩‍🏫', 'cyan', 4, 'ACTIVO'),
    (7, 'AUDITORIA', 'Auditoría', 'Órgano de control, auditoría interna forense e inspección de bitácoras', '🟣', 'purple', 6, 'ACTIVO'),
    (8, 'INVITADOS', 'Invitados', 'Usuarios externos, estudiantes o personal en modalidad de solo consulta', '👥', 'stone', 7, 'ACTIVO');
  `);

  // 4. Módulos del Sistema (7 módulos canónicos oficiales)
  db.run(`
    INSERT INTO modulos (id_modulo, codigo, nombre, descripcion, icono, orden, estado) VALUES
    (1, 'DASHBOARD', 'Dashboard', 'Métricas ejecutivas de ocupación, estado del campus y KPIs generales', 'LayoutDashboard', 1, 'ACTIVO'),
    (2, 'SEGURIDAD', 'Seguridad', 'Gestión de usuarios, grupos organizacionales, roles y permisos RBAC', 'ShieldCheck', 2, 'ACTIVO'),
    (3, 'ACADEMICO', 'Académico', 'Sedes, facultades, escuelas, carreras y periodos académicos lectivos', 'GraduationCap', 3, 'ACTIVO'),
    (4, 'PLANIFICACION', 'Planificación', 'Carga horaria, asignación curricular y programación de paralelos', 'CalendarCheck', 4, 'ACTIVO'),
    (5, 'HORARIOS', 'Horario', 'Grilla semanal horaria, turnos, jornadas y validación de cruces', 'Clock', 5, 'ACTIVO'),
    (6, 'AULAS', 'Asignación de Aulas', 'Gestión de espacios físicos, semáforo de ocupación y laboratorios', 'Building2', 6, 'ACTIVO'),
    (7, 'REPORTES', 'Reportes', 'Exportación de mallas, análisis de ocupación y estadísticas oficiales', 'BarChart3', 7, 'ACTIVO');
  `);

  // 5. Permisos Canónicos (4 operaciones: CREAR, LEER, ACTUALIZAR, ELIMINAR)
  db.run(`
    INSERT INTO permisos (id_permiso, codigo, nombre, descripcion) VALUES
    (1, 'CREAR', 'Crear', 'Capacidad para crear y dar de alta registros'),
    (2, 'LEER', 'Leer', 'Acceso de lectura, consulta y visualización de datos'),
    (3, 'ACTUALIZAR', 'Actualizar', 'Capacidad para editar y actualizar registros existentes'),
    (4, 'ELIMINAR', 'Eliminar', 'Capacidad para archivar, dar de baja o eliminar registros');
  `);

  // 6. Usuarios Institucionales Completos (21 usuarios representativos)
  db.run(`
    INSERT OR REPLACE INTO usuarios (id_usuario, id_docente, nombres, apellidos, username, email, password_hash, telefono, cargo, estado, intentos_fallidos, fecha_creacion, ultimo_acceso) VALUES
    (10, NULL, 'CARLOS ENRIQUE', 'MENDOZA VITERI', 'superadmin', 'superadmin@isuj.edu.ec', 'super123', '0991234501', 'Rector / Superadministrador General', 'ACTIVO', 0, '2026-03-01 08:00:00', '2026-09-17 10:15:00'),
    (1, NULL, 'ROBERTO CARLOS', 'CARDENAS LOPEZ', 'admin', 'admin@isuj.edu.ec', 'admin123', '0991234502', 'Director de Tecnologías e Información', 'ACTIVO', 0, '2026-03-01 08:00:00', '2026-09-17 09:30:00'),
    (12, NULL, 'LUCIA MARGARITA', 'PAREDES SANTILLAN', 'lparedes', 'lparedes@isuj.edu.ec', 'admin123', '0991234503', 'Administradora Operativa de Sistemas', 'ACTIVO', 0, '2026-03-02 08:00:00', '2026-09-16 16:45:00'),
    (2, NULL, 'ELENA BEATRIZ', 'MORALES AGUIRRE', 'coordinador', 'coordinacion@isuj.edu.ec', 'coord123', '0991234504', 'Coordinadora Académica Matriz', 'ACTIVO', 0, '2026-03-01 08:00:00', '2026-09-17 08:20:00'),
    (13, NULL, 'DAVID ALEJANDRO', 'ALARCON SILVA', 'dalarcon', 'dalarcon@isuj.edu.ec', 'coord123', '0991234505', 'Coordinador Carrera Software', 'ACTIVO', 0, '2026-03-02 08:00:00', '2026-09-16 11:10:00'),
    (14, NULL, 'GABRIELA FERNANDA', 'ESPINOZA RAMOS', 'gespinoza', 'gespinoza@isuj.edu.ec', 'coord123', '0991234506', 'Coordinadora Carrera Salud y Enfermería', 'ACTIVO', 0, '2026-03-02 08:00:00', '2026-09-15 14:00:00'),
    (3, NULL, 'MONICA CECILIA', 'SILVA CEVALLOS', 'secretaria', 'secretaria@isuj.edu.ec', 'secre123', '0991234507', 'Secretaria General Institucional', 'ACTIVO', 0, '2026-03-01 08:00:00', '2026-09-17 07:50:00'),
    (15, NULL, 'SOFIA ESTEFANIA', 'BENITEZ MONCAYO', 'sbenitez', 'sbenitez@isuj.edu.ec', 'secre123', '0991234508', 'Analista de Matrículas y Registro', 'ACTIVO', 0, '2026-03-03 08:00:00', '2026-09-16 15:30:00'),
    (7, NULL, 'FERNANDO GABRIEL', 'GUAYASAMIN PINTO', 'operador', 'operador@isuj.edu.ec', 'oper123', '0991234509', 'Operador de Campus e Infraestructura', 'ACTIVO', 0, '2026-03-01 08:00:00', '2026-09-17 08:05:00'),
    (16, NULL, 'ANDREA CAROLINA', 'VELASCO CARRERA', 'avelasco', 'avelasco@isuj.edu.ec', 'oper123', '0991234510', 'Administradora de Laboratorios y Redes', 'ACTIVO', 0, '2026-03-03 08:00:00', '2026-09-16 17:20:00'),
    (11, NULL, 'PATRICIA ELENA', 'ANDRADE MORALES', 'auditor', 'auditor@isuj.edu.ec', 'auditor123', '0991234511', 'Auditora Interna Institucional', 'ACTIVO', 0, '2026-03-01 08:00:00', '2026-09-17 09:10:00'),
    (17, NULL, 'XAVIER MAURICIO', 'QUINTANA RIOS', 'xquintana', 'xquintana@isuj.edu.ec', 'auditor123', '0991234512', 'Auditor Forense de Procesos y Control', 'ACTIVO', 0, '2026-03-04 08:00:00', '2026-09-15 16:15:00'),
    (5, 1, 'MARIO FERNANDO', 'FAJARDO VANEGAS', 'mfajardo', 'mario.fajardo@isuj.edu.ec', 'docente1', '0991234513', 'Docente Titular de Programación Web', 'ACTIVO', 0, '2026-03-01 08:00:00', '2026-09-17 08:00:00'),
    (18, 2, 'BEATRIZ ALEXANDRA', 'ZAMBRANO CASTILLO', 'bzambrano', 'bzambrano@isuj.edu.ec', 'docente2', '0991234514', 'Docente Titular de Redes y Conectividad', 'ACTIVO', 0, '2026-03-02 08:00:00', '2026-09-16 10:20:00'),
    (19, 3, 'CARLOS EDUARDO', 'CEVALLOS PAREDES', 'ccevallos', 'ccevallos@isuj.edu.ec', 'docente3', '0991234515', 'Docente de Electrónica y Microcontroladores', 'ACTIVO', 0, '2026-03-02 08:00:00', '2026-09-16 12:45:00'),
    (20, 4, 'DIANA MARICELA', 'QUISHPE LOACHAMIN', 'dquishpe', 'dquishpe@isuj.edu.ec', 'docente4', '0991234516', 'Docente de Bases de Datos y Algoritmos', 'ACTIVO', 0, '2026-03-03 08:00:00', '2026-09-15 09:30:00'),
    (21, 5, 'JORGE LUIS', 'VILLACIS ENRIQUEZ', 'jvillacis', 'jvillacis@isuj.edu.ec', 'docente5', '0991234517', 'Docente de Comunicación e Investigación', 'ACTIVO', 0, '2026-03-03 08:00:00', '2026-09-14 11:00:00'),
    (8, NULL, 'JUAN CARLOS', 'PEREZ MORA', 'estudiante', 'estudiante@isuj.edu.ec', 'estud123', '0991234518', 'Presidente Federación Estudiantil FEISUJ', 'ACTIVO', 0, '2026-03-01 08:00:00', '2026-09-17 07:15:00'),
    (22, NULL, 'MARIA JOSE', 'TORRES NARVAEZ', 'mtorres', 'mtorres@isuj.edu.ec', 'estud123', '0991234519', 'Representante de Carrera Estudiantil', 'ACTIVO', 0, '2026-03-04 08:00:00', '2026-09-16 14:10:00'),
    (6, NULL, 'VENTANILLA', 'DE ATENCION CIUDADANA', 'consulta', 'consulta@isuj.edu.ec', 'consulta123', '0991234520', 'Oficina de Información y Trámites', 'ACTIVO', 0, '2026-03-01 08:00:00', '2026-09-17 08:30:00'),
    (4, NULL, 'PORTAL', 'TRANSPARENCIA PUBLICA', 'invitado', 'invitado@isuj.edu.ec', 'invitado123', '0991234521', 'Acceso Ciudadano / Transparencia', 'ACTIVO', 0, '2026-03-01 08:00:00', '2026-09-17 06:00:00');
  `);

  // Tabla legacy usuario
  db.run(`
    INSERT OR REPLACE INTO usuario (id_usuario, id_docente, nombre_usuario, clave, correo, rol, estado, intentos_fallidos, fecha_creacion, ultimo_acceso) VALUES
    (10, NULL, 'superadmin', 'super123', 'superadmin@isuj.edu.ec', 'SUPERADMIN', 'ACTIVO', 0, '2026-03-01 08:00:00', '2026-09-17 10:15:00'),
    (1, NULL, 'admin', 'admin123', 'admin@isuj.edu.ec', 'ADMINISTRADOR', 'ACTIVO', 0, '2026-03-01 08:00:00', '2026-09-17 09:30:00'),
    (12, NULL, 'lparedes', 'admin123', 'lparedes@isuj.edu.ec', 'ADMINISTRADOR', 'ACTIVO', 0, '2026-03-02 08:00:00', '2026-09-16 16:45:00'),
    (2, NULL, 'coordinador', 'coord123', 'coordinacion@isuj.edu.ec', 'COORDINADOR', 'ACTIVO', 0, '2026-03-01 08:00:00', '2026-09-17 08:20:00'),
    (13, NULL, 'dalarcon', 'coord123', 'dalarcon@isuj.edu.ec', 'COORDINADOR', 'ACTIVO', 0, '2026-03-02 08:00:00', '2026-09-16 11:10:00'),
    (14, NULL, 'gespinoza', 'coord123', 'gespinoza@isuj.edu.ec', 'COORDINADOR', 'ACTIVO', 0, '2026-03-02 08:00:00', '2026-09-15 14:00:00'),
    (3, NULL, 'secretaria', 'secre123', 'secretaria@isuj.edu.ec', 'COORDINADOR', 'ACTIVO', 0, '2026-03-01 08:00:00', '2026-09-17 07:50:00'),
    (15, NULL, 'sbenitez', 'secre123', 'sbenitez@isuj.edu.ec', 'COORDINADOR', 'ACTIVO', 0, '2026-03-03 08:00:00', '2026-09-16 15:30:00'),
    (7, NULL, 'operador', 'oper123', 'operador@isuj.edu.ec', 'OPERADOR', 'ACTIVO', 0, '2026-03-01 08:00:00', '2026-09-17 08:05:00'),
    (16, NULL, 'avelasco', 'oper123', 'avelasco@isuj.edu.ec', 'OPERADOR', 'ACTIVO', 0, '2026-03-03 08:00:00', '2026-09-16 17:20:00'),
    (11, NULL, 'auditor', 'auditor123', 'auditor@isuj.edu.ec', 'AUDITOR', 'ACTIVO', 0, '2026-03-01 08:00:00', '2026-09-17 09:10:00'),
    (17, NULL, 'xquintana', 'auditor123', 'xquintana@isuj.edu.ec', 'AUDITOR', 'ACTIVO', 0, '2026-03-04 08:00:00', '2026-09-15 16:15:00'),
    (5, 1, 'mfajardo', 'docente1', 'mario.fajardo@isuj.edu.ec', 'DOCENTE', 'ACTIVO', 0, '2026-03-01 08:00:00', '2026-09-17 08:00:00'),
    (18, 2, 'bzambrano', 'docente2', 'bzambrano@isuj.edu.ec', 'DOCENTE', 'ACTIVO', 0, '2026-03-02 08:00:00', '2026-09-16 10:20:00'),
    (19, 3, 'ccevallos', 'docente3', 'ccevallos@isuj.edu.ec', 'DOCENTE', 'ACTIVO', 0, '2026-03-02 08:00:00', '2026-09-16 12:45:00'),
    (20, 4, 'dquishpe', 'docente4', 'dquishpe@isuj.edu.ec', 'DOCENTE', 'ACTIVO', 0, '2026-03-03 08:00:00', '2026-09-15 09:30:00'),
    (21, 5, 'jvillacis', 'docente5', 'jvillacis@isuj.edu.ec', 'DOCENTE', 'ACTIVO', 0, '2026-03-03 08:00:00', '2026-09-14 11:00:00'),
    (8, NULL, 'estudiante', 'estud123', 'estudiante@isuj.edu.ec', 'CONDULTA', 'ACTIVO', 0, '2026-03-01 08:00:00', '2026-09-17 07:15:00'),
    (22, NULL, 'mtorres', 'estud123', 'mtorres@isuj.edu.ec', 'CONDULTA', 'ACTIVO', 0, '2026-03-04 08:00:00', '2026-09-16 14:10:00'),
    (6, NULL, 'consulta', 'consulta123', 'consulta@isuj.edu.ec', 'CONDULTA', 'ACTIVO', 0, '2026-03-01 08:00:00', '2026-09-17 08:30:00'),
    (4, NULL, 'invitado', 'invitado123', 'invitado@isuj.edu.ec', 'CONDULTA', 'ACTIVO', 0, '2026-03-01 08:00:00', '2026-09-17 06:00:00');
  `);

  // 7. Asignación de Roles Oficiales (usuario_roles)
  db.run(`
    DELETE FROM usuario_roles;
    INSERT INTO usuario_roles (id_usuario, id_rol) VALUES
    (10, 1), -- Superadmin -> SUPERADMIN
    (1, 2),  -- Admin Ti -> ADMINISTRADOR
    (12, 2), -- Admin Sistemas -> ADMINISTRADOR
    (2, 3),  -- Coord Matriz -> COORDINADOR
    (13, 3), -- Coord Software -> COORDINADOR
    (14, 3), -- Coord Salud -> COORDINADOR
    (3, 3),  -- Secretaria General -> COORDINADOR
    (15, 3), -- Secretaria Registro -> COORDINADOR
    (7, 5),  -- Operador Campus -> OPERADOR
    (16, 5), -- Operadora Laboratorios -> OPERADOR
    (11, 6), -- Auditora Interna -> AUDITOR
    (17, 6), -- Auditor Forense -> AUDITOR
    (5, 4),  -- Docente Fajardo -> DOCENTE
    (18, 4), -- Docente Zambrano -> DOCENTE
    (19, 4), -- Docente Cevallos -> DOCENTE
    (20, 4), -- Docente Quishpe -> DOCENTE
    (21, 4), -- Docente Villacis -> DOCENTE
    (8, 7),  -- Estudiante -> CONDULTA
    (22, 7), -- Estudiante -> CONDULTA
    (6, 7),  -- Consulta -> CONDULTA
    (4, 7);  -- Invitado -> CONDULTA
  `);

  // 8. Asignación de Grupos (8 Grupos Institucionales)
  db.run(`
    DELETE FROM usuario_grupos;
    INSERT INTO usuario_grupos (id_usuario, id_grupo) VALUES
    -- Grupo 1: Administración TI (12 miembros)
    (10, 1),
    (1, 1),
    (12, 1),
    (7, 1),
    (16, 1),
    (11, 1),
    (17, 1),
    (2, 1),
    (13, 1),
    (14, 1),
    (3, 1),
    (15, 1),
    -- Grupo 2: Coordinaciones (8 miembros)
    (2, 2),
    (13, 2),
    (14, 2),
    (3, 2),
    (15, 2),
    (7, 2),
    (16, 2),
    (5, 2),
    -- Grupo 3: Vicerrectorado (5 miembros)
    (10, 3),
    (1, 3),
    (12, 3),
    (2, 3),
    (13, 3),
    -- Grupo 4: Dirección Académica
    (2, 4),
    (13, 4),
    (14, 4),
    (3, 4),
    -- Grupo 5: Docentes Titulares
    (5, 5),
    (18, 5),
    (19, 5),
    (20, 5),
    -- Grupo 6: Docentes Ocasionales
    (21, 6),
    (22, 6),
    (8, 6),
    -- Grupo 7: Auditoría
    (11, 7),
    (17, 7),
    -- Grupo 8: Invitados
    (6, 8),
    (4, 8);
  `);

  // 9. Matriz Oficial de Permisos por Rol (rol_modulo_permisos)
  // Permisos: 1=CREAR, 2=LEER, 3=ACTUALIZAR, 4=ELIMINAR
  // Modulos: 1=Dashboard, 2=Seguridad, 3=Académico, 4=Planificación, 5=Horario, 6=Asignación de Aulas, 7=Reportes
  db.run(`
    DELETE FROM rol_modulo_permisos;

    -- 1. SUPERADMIN (id_rol = 1): Control total sobre los 7 módulos y los 4 permisos (CREAR, LEER, ACTUALIZAR, ELIMINAR)
    INSERT OR IGNORE INTO rol_modulo_permisos (id_rol, id_modulo, id_permiso)
    SELECT 1, m.id_modulo, p.id_permiso FROM modulos m CROSS JOIN permisos p;

    -- 2. ADMINISTRADOR (id_rol = 2): Gestión completa y CRUD sobre catálogos
    INSERT OR IGNORE INTO rol_modulo_permisos (id_rol, id_modulo, id_permiso) VALUES
    -- Dashboard (Leer)
    (2, 1, 2),
    -- Seguridad (Crear, Leer, Actualizar)
    (2, 2, 1), (2, 2, 2), (2, 2, 3),
    -- Académico (CRUD completo)
    (2, 3, 1), (2, 3, 2), (2, 3, 3), (2, 3, 4),
    -- Planificación (CRUD completo)
    (2, 4, 1), (2, 4, 2), (2, 4, 3), (2, 4, 4),
    -- Horario (CRUD completo)
    (2, 5, 1), (2, 5, 2), (2, 5, 3), (2, 5, 4),
    -- Asignación de Aulas (CRUD completo)
    (2, 6, 1), (2, 6, 2), (2, 6, 3), (2, 6, 4),
    -- Reportes (Leer)
    (2, 7, 2);

    -- 3. COORDINADOR (id_rol = 3): Gestión curricular y distributivos
    INSERT OR IGNORE INTO rol_modulo_permisos (id_rol, id_modulo, id_permiso) VALUES
    -- Dashboard (Leer)
    (3, 1, 2),
    -- Académico (Crear, Leer, Actualizar)
    (3, 3, 1), (3, 3, 2), (3, 3, 3),
    -- Planificación (Crear, Leer, Actualizar)
    (3, 4, 1), (3, 4, 2), (3, 4, 3),
    -- Horario (Crear, Leer, Actualizar)
    (3, 5, 1), (3, 5, 2), (3, 5, 3),
    -- Asignación de Aulas (Crear, Leer, Actualizar)
    (3, 6, 1), (3, 6, 2), (3, 6, 3),
    -- Reportes (Leer)
    (3, 7, 2);

    -- 4. DOCENTE (id_rol = 4): Visualización de horarios y asignaturas asignadas
    INSERT OR IGNORE INTO rol_modulo_permisos (id_rol, id_modulo, id_permiso) VALUES
    (4, 1, 2),
    (4, 3, 2),
    (4, 4, 2),
    (4, 5, 2),
    (4, 6, 2),
    (4, 7, 2);

    -- 5. OPERADOR (id_rol = 5): Infraestructura, asignación de aulas y semáforo
    INSERT OR IGNORE INTO rol_modulo_permisos (id_rol, id_modulo, id_permiso) VALUES
    (5, 1, 2),
    (5, 4, 2), (5, 4, 3),
    (5, 5, 2), (5, 5, 3),
    (5, 6, 1), (5, 6, 2), (5, 6, 3),
    (5, 7, 2);

    -- 6. AUDITOR (id_rol = 6): Auditoría, bitácoras y supervisión de accesos
    INSERT OR IGNORE INTO rol_modulo_permisos (id_rol, id_modulo, id_permiso) VALUES
    (6, 1, 2),
    (6, 2, 2),
    (6, 3, 2),
    (6, 4, 2),
    (6, 5, 2),
    (6, 6, 2),
    (6, 7, 2);

    -- 7. CONDULTA (id_rol = 7): Consulta ciudadana y horarios públicos
    INSERT OR IGNORE INTO rol_modulo_permisos (id_rol, id_modulo, id_permiso) VALUES
    (7, 1, 2),
    (7, 3, 2),
    (7, 4, 2),
    (7, 5, 2),
    (7, 6, 2),
    (7, 7, 2);
  `);

  // 10. Matriz de Permisos por Grupo (grupo_permisos)
  db.run(`
    DELETE FROM grupo_permisos;

    -- Grupo 1: Administra TI -> Permisos totales en todos los módulos
    INSERT OR IGNORE INTO grupo_permisos (id_grupo, id_modulo, id_permiso)
    SELECT 1, m.id_modulo, p.id_permiso FROM modulos m CROSS JOIN permisos p;

    -- Grupo 2: Vicerrectorado Academico -> Gestión completa académica, planificación, aulas y reportes
    INSERT OR IGNORE INTO grupo_permisos (id_grupo, id_modulo, id_permiso) VALUES
    (2, 1, 2),
    (2, 2, 2),
    (2, 3, 1), (2, 3, 2), (2, 3, 3), (2, 3, 4),
    (2, 4, 1), (2, 4, 2), (2, 4, 3), (2, 4, 4),
    (2, 5, 1), (2, 5, 2), (2, 5, 3), (2, 5, 4),
    (2, 6, 1), (2, 6, 2), (2, 6, 3), (2, 6, 4),
    (2, 7, 1), (2, 7, 2), (2, 7, 3);

    -- Grupo 3: Direccion Academica -> Académico, Planificación, Horarios, Aulas y Reportes
    INSERT OR IGNORE INTO grupo_permisos (id_grupo, id_modulo, id_permiso) VALUES
    (3, 1, 2),
    (3, 3, 1), (3, 3, 2), (3, 3, 3), (3, 3, 4),
    (3, 4, 1), (3, 4, 2), (3, 4, 3), (3, 4, 4),
    (3, 5, 1), (3, 5, 2), (3, 5, 3), (3, 5, 4),
    (3, 6, 1), (3, 6, 2), (3, 6, 3), (3, 6, 4),
    (3, 7, 1), (3, 7, 2);

    -- Grupo 4: Coordinacion Academica -> Académico, Planificación, Horarios, Aulas
    INSERT OR IGNORE INTO grupo_permisos (id_grupo, id_modulo, id_permiso) VALUES
    (4, 1, 2),
    (4, 3, 1), (4, 3, 2), (4, 3, 3),
    (4, 4, 1), (4, 4, 2), (4, 4, 3),
    (4, 5, 1), (4, 5, 2), (4, 5, 3),
    (4, 6, 1), (4, 6, 2), (4, 6, 3),
    (4, 7, 2);

    -- Grupo 5: Docentes Titulares -> Lectura de módulos asignados y horario
    INSERT OR IGNORE INTO grupo_permisos (id_grupo, id_modulo, id_permiso) VALUES
    (5, 1, 2),
    (5, 3, 2),
    (5, 4, 2),
    (5, 5, 2),
    (5, 6, 2),
    (5, 7, 2);

    -- Grupo 6: Docentes Ocacionales -> Lectura de módulos curriculares y horario
    INSERT OR IGNORE INTO grupo_permisos (id_grupo, id_modulo, id_permiso) VALUES
    (6, 1, 2),
    (6, 3, 2),
    (6, 4, 2),
    (6, 5, 2),
    (6, 7, 2);

    -- Grupo 7: Auditoria -> Supervisión y lectura forense en todos los módulos
    INSERT OR IGNORE INTO grupo_permisos (id_grupo, id_modulo, id_permiso) VALUES
    (7, 1, 2),
    (7, 2, 2),
    (7, 3, 2),
    (7, 4, 2),
    (7, 5, 2),
    (7, 6, 2),
    (7, 7, 2);

    -- Grupo 8: Invitados -> Consulta básica de horarios y dashboard
    INSERT OR IGNORE INTO grupo_permisos (id_grupo, id_modulo, id_permiso) VALUES
    (8, 1, 2),
    (8, 5, 2);
  `);

  // 11. Auditoría Inicial Representativa
  db.run(`
    DELETE FROM auditoria;
    INSERT INTO auditoria (id_usuario, modulo, accion, descripcion, ip, fecha) VALUES
    (10, 'SEGURIDAD', 'INICIALIZACION_SISTEMA', 'Inicialización completa del modelo de gobierno institucional ISUJ (8 grupos, 21 usuarios, 10 roles, matriz RBAC)', '127.0.0.1', '2026-03-01 08:00:00'),
    (10, 'SEGURIDAD', 'ASIGNACION_ROLES', 'Asignación jerárquica de roles directivos, coordinadores y docentes titulares', '192.168.1.10', '2026-03-01 08:30:00'),
    (1, 'ACADEMICO', 'APROBACION_MALLAS', 'Registro y validación de carreras tecnológicas de Software, Enfermería y Electrónica', '192.168.1.25', '2026-03-02 09:15:00'),
    (2, 'PLANIFICACION', 'DISTRIBUCION_CARGA', 'Distribución inicial de carga horaria semestral y asignación de paralelos académicos', '192.168.1.30', '2026-03-02 11:45:00'),
    (7, 'AULAS', 'INSPECCION_CAMPUS', 'Actualización del inventario de laboratorios de cómputo y aulas del Bloque A y Bloque B', '192.168.1.55', '2026-03-03 14:20:00'),
    (11, 'AUDITORIA', 'VERIFICACION_FORENSE', 'Auditoría interna de accesos y cumplimiento de permisos RBAC institucionales', '192.168.1.90', '2026-03-04 16:00:00'),
    (1, 'SEGURIDAD', 'SINCRONIZACION_GRUPOS', 'Carga institucional de grupos canónicos y miembros organizacionales completada exitosamente', '127.0.0.1', '2026-09-17 10:00:00');
  `);
}
