import initSqlJs, { Database, Statement } from 'sql.js';
import fs from 'fs';
import path from 'path';
import { SEED_SQL } from './seedData.ts';
import { SEED_INSERTS } from './seedRecords.ts';
import { seedSecurityData } from './seedSecurity.ts';
import { seedCarrerasAsignaturas } from './seedCarrerasAsignaturas.ts';

let dbInstance: Database | null = null;
const DB_PATH = path.join(process.cwd(), 'gestion_academica.sqlite');

export async function getDatabase(): Promise<Database> {
  if (dbInstance) return dbInstance;

  const SQL = await initSqlJs();
  if (fs.existsSync(DB_PATH)) {
    try {
      const filebuffer = fs.readFileSync(DB_PATH);
      dbInstance = new SQL.Database(filebuffer);
      try {
        dbInstance.run("UPDATE dia_semana SET es_laborable = 1, estado = 'ACTIVO' WHERE codigo = 'DOM' OR id_dia = 7;");
        dbInstance.run("INSERT OR IGNORE INTO dia_semana (id_dia, codigo, nombre, orden, es_laborable, estado) VALUES (7, 'DOM', 'DOMINGO', 7, 1, 'ACTIVO');");
        dbInstance.run("INSERT OR IGNORE INTO jornada (id_jornada, codigo, nombre, hora_inicio, hora_fin, estado) VALUES (5, 'DOM', 'DOMINICAL', '07:00:00', '18:00:00', 'ACTIVA');");

        dbInstance.run(`
          CREATE TABLE IF NOT EXISTS hora (
            id_hora INTEGER PRIMARY KEY AUTOINCREMENT,
            codigo TEXT NOT NULL UNIQUE,
            nombre TEXT NOT NULL,
            hora_inicio TEXT NOT NULL,
            hora_fin TEXT NOT NULL,
            id_jornada INTEGER,
            orden INTEGER DEFAULT 1,
            estado TEXT NOT NULL DEFAULT 'ACTIVA' CHECK (estado IN ('ACTIVA', 'INACTIVA'))
          );

          INSERT OR IGNORE INTO hora (id_hora, codigo, nombre, hora_inicio, hora_fin, id_jornada, orden, estado) VALUES
          (1, 'H1', '07:00 - 08:00', '07:00', '08:00', 1, 1, 'ACTIVA'),
          (2, 'H2', '08:00 - 09:00', '08:00', '09:00', 1, 2, 'ACTIVA'),
          (3, 'H3', '09:00 - 10:00', '09:00', '10:00', 1, 3, 'ACTIVA'),
          (4, 'H4', '10:00 - 11:00', '10:00', '11:00', 1, 4, 'ACTIVA'),
          (5, 'H5', '11:00 - 12:00', '11:00', '12:00', 1, 5, 'ACTIVA'),
          (6, 'H6', '12:00 - 13:00', '12:00', '13:00', 1, 6, 'ACTIVA'),
          (7, 'H7', '13:00 - 14:00', '13:00', '14:00', 2, 7, 'ACTIVA'),
          (8, 'H8', '14:00 - 15:00', '14:00', '15:00', 2, 8, 'ACTIVA'),
          (9, 'H9', '15:00 - 16:00', '15:00', '16:00', 2, 9, 'ACTIVA'),
          (10, 'H10', '16:00 - 17:00', '16:00', '17:00', 2, 10, 'ACTIVA'),
          (11, 'H11', '17:00 - 18:00', '17:00', '18:00', 3, 11, 'ACTIVA'),
          (12, 'H12', '18:00 - 19:00', '18:00', '19:00', 3, 12, 'ACTIVA'),
          (13, 'H13', '19:00 - 20:00', '19:00', '20:00', 3, 13, 'ACTIVA'),
          (14, 'H14', '20:00 - 21:00', '20:00', '21:00', 3, 14, 'ACTIVA');
        `);

        // Migración de campo numero_semanas en tabla carrera
        try {
          dbInstance.run("ALTER TABLE carrera ADD COLUMN numero_semanas INTEGER DEFAULT 16;");
        } catch (_) {}
        try {
          dbInstance.run("UPDATE carrera SET numero_semanas = 16 WHERE numero_semanas IS NULL OR numero_semanas = 0;");
        } catch (_) {}

        // Migración y actualización de Escuelas institucionales solicitadas (archivo adjunto)
        try {
          dbInstance.run("DELETE FROM escuela;");
          dbInstance.run(`
            INSERT INTO escuela (id_escuela, id_sede, codigo, nombre, descripcion, estado) VALUES
            (1, 1, 'ESC-01', 'TIC', 'Escuela de Tecnologías de la Información y Comunicación', 'ACTIVA'),
            (2, 1, 'ESC-02', 'EDUCACION', 'Escuela de Ciencias de la Educación y Pedagogía', 'ACTIVA'),
            (3, 1, 'ESC-03', 'INGENIERIA E INDUSTRIA', 'Escuela de Ingeniería, Producción e Industria', 'ACTIVA'),
            (4, 1, 'ESC-04', 'SALUD', 'Escuela de Ciencias de la Salud, Odontología y Rehabilitación', 'ACTIVA'),
            (5, 1, 'ESC-05', 'SERVICIOS', 'Escuela de Hospitalidad, Gastronomía y Servicios', 'ACTIVA'),
            (6, 1, 'ESC-06', 'ADMINISTRACION', 'Escuela de Ciencias Administrativas, Contables y Gestión', 'ACTIVA');
          `);

          // Actualizar carreras para asociarlas a su escuela correspondiente (SALUD = 4, SERVICIOS = 5)
          dbInstance.run(`
            UPDATE carrera SET id_escuela = 1 WHERE codigo IN ('CAR-01') OR nombre LIKE '%SOFTWARE%' OR nombre LIKE '%SISTEMA%';
            UPDATE carrera SET id_escuela = 2 WHERE codigo IN ('CAR-02', 'CAR-04') OR nombre LIKE '%EDUCACION%' OR nombre LIKE '%DEPORTIVO%';
            UPDATE carrera SET id_escuela = 3 WHERE codigo IN ('CAR-03', 'CAR-09') OR nombre LIKE '%ELECTRICIDAD%' OR nombre LIKE '%MECANICA%';
            UPDATE carrera SET id_escuela = 4 WHERE codigo IN ('CAR-05', 'CAR-08', 'CAR-10') OR nombre LIKE '%ODONTOLOGIA%' OR nombre LIKE '%ENFERMERIA%' OR nombre LIKE '%REHABILITACION%';
            UPDATE carrera SET id_escuela = 5 WHERE codigo IN ('CAR-06', 'CAR-07', 'CAR-16', 'CAR-17') OR nombre LIKE '%GASTRONOMIA%' OR nombre LIKE '%ESTETICA%';
            UPDATE carrera SET id_escuela = 6 WHERE codigo IN ('CAR-11', 'CAR-12', 'CAR-13', 'CAR-14', 'CAR-15') OR nombre LIKE '%ADMINISTRACION%' OR nombre LIKE '%TALENTO HUMANO%' OR nombre LIKE '%MARKETING%' OR nombre LIKE '%CONTABILIDAD%';
          `);
        } catch (escErr) {
          console.error('Error al migrar escuelas institucionales:', escErr);
        }

        // Migración de Carreras y Asignaturas solicitadas por la institución (según archivo adjunto)
        try {
          seedCarrerasAsignaturas(dbInstance);
        } catch (carErr) {
          console.error('Error al migrar carreras y asignaturas institucionales:', carErr);
        }

        // Inicializar y cargar modelo de seguridad institucional (grupos, usuarios, roles, permisos, módulos, auditoría)
        seedSecurityData(dbInstance);


        // Migración de Sedes Institucionales: Reemplazo por las sedes solicitadas
        try {
          dbInstance.run(`
            DELETE FROM sede;
            INSERT INTO sede (id_sede, codigo, nombre, ciudad, provincia, direccion, telefono, correo, estado) VALUES
            (1, 'SED-01', 'UIO_NORTE', 'QUITO', 'PICHINCHA', 'CAMPUS NORTE - AV. DE LA PRENSA Y AV. 10 DE AGOSTO', '022345671', 'uio.norte@isuj.edu.ec', 'ACTIVA'),
            (2, 'SED-02', 'UIO_VALLE', 'RUMIÑAHUI', 'PICHINCHA', 'CAMPUS VALLE - AV. GENERAL RUMIÑAHUI (LOS CHILLOS)', '022345672', 'uio.valle@isuj.edu.ec', 'ACTIVA'),
            (3, 'SED-03', 'UIO_SUR', 'QUITO', 'PICHINCHA', 'CAMPUS SUR - AV. PEDRO VICENTE MALDONADO Y MORÁN VALVERDE', '022345673', 'uio.sur@isuj.edu.ec', 'ACTIVA'),
            (4, 'SED-04', 'SANTO DOMINGO', 'SANTO DOMINGO', 'SANTO DOMINGO DE LOS TSÁCHILAS', 'CAMPUS SANTO DOMINGO - AV. QUITO Y AV. RÍO LELIA', '022765432', 'santodomingo@isuj.edu.ec', 'ACTIVA');
          `);
        } catch (sedeErr) {
          console.error('Error al actualizar sedes institucionales:', sedeErr);
        }

        // Migración de Bloques solicitados por la institución (archivo adjunto: A, B, C, D, E, F, M)
        try {
          dbInstance.run("DELETE FROM bloque;");
          dbInstance.run(`
            INSERT INTO bloque (id_bloque, id_sede, codigo, nombre, descripcion, numero_pisos, estado) VALUES
            (1, 1, 'BLQ-A', 'BLOQUE A', 'Bloque de aulas y laboratorios de computación A', 3, 'ACTIVO'),
            (2, 1, 'BLQ-B', 'BLOQUE B', 'Bloque de aulas, laboratorios y talleres B', 4, 'ACTIVO'),
            (3, 1, 'BLQ-C', 'BLOQUE C', 'Bloque de aulas generales y Centro Infantil C', 2, 'ACTIVO'),
            (4, 1, 'BLQ-D', 'BLOQUE D', 'Laboratorios de salud: Enfermería y Rehabilitación Física D', 3, 'ACTIVO'),
            (5, 1, 'BLQ-E', 'BLOQUE E', 'Bloque de aulas y talleres E', 4, 'ACTIVO'),
            (6, 1, 'BLQ-F', 'BLOQUE F', 'Laboratorios técnicos: Electrotecnia, Control y Máquinas F', 1, 'ACTIVO'),
            (7, 1, 'BLQ-M', 'BLOQUE M', 'Aulas M1, M2, Taller de Transferencia y Taller Matriz M', 1, 'ACTIVO');
          `);
        } catch (bloqueErr) {
          console.error('Error al actualizar bloques institucionales:', bloqueErr);
        }

        // Migración de Aulas solicitadas por la institución (archivo adjunto: 65 aulas oficiales)
        try {
          dbInstance.run(`
            CREATE TABLE IF NOT EXISTS aula_laboratorio_v2 (
              id_aula_laboratorio INTEGER PRIMARY KEY AUTOINCREMENT,
              id_bloque INTEGER NOT NULL,
              codigo TEXT NOT NULL UNIQUE,
              nombre TEXT NOT NULL,
              tipo TEXT NOT NULL,
              capacidad INTEGER NOT NULL DEFAULT 0 CHECK (capacidad >= 0),
              piso INTEGER NOT NULL DEFAULT 1,
              recursos TEXT,
              estado TEXT NOT NULL DEFAULT 'DISPONIBLE',
              FOREIGN KEY (id_bloque) REFERENCES bloque(id_bloque)
            );
          `);
          dbInstance.run("DROP TABLE IF EXISTS aula_laboratorio;");
          dbInstance.run("ALTER TABLE aula_laboratorio_v2 RENAME TO aula_laboratorio;");

          dbInstance.run(`
            INSERT INTO aula_laboratorio (id_aula_laboratorio, id_bloque, codigo, nombre, tipo, capacidad, piso, estado) VALUES
            -- Bloque A (11)
            (1, 1, 'A2', 'AULA A2', 'AULA', 35, 1, 'DISPONIBLE'),
            (2, 1, 'A3', 'AULA A3', 'AULA', 35, 1, 'DISPONIBLE'),
            (3, 1, 'A4', 'AULA A4', 'AULA', 34, 1, 'DISPONIBLE'),
            (4, 1, 'A5', 'AULA A5', 'AULA', 39, 2, 'DISPONIBLE'),
            (5, 1, 'A6', 'AULA A6', 'AULA', 59, 2, 'DISPONIBLE'),
            (6, 1, 'A7', 'AULA A7', 'AULA', 46, 3, 'DISPONIBLE'),
            (7, 1, 'A8', 'AULA A8', 'AULA', 17, 3, 'DISPONIBLE'),
            (8, 1, 'A9', 'AULA A9', 'AULA', 24, 3, 'DISPONIBLE'),
            (9, 1, 'A10', 'AULA A10', 'AULA', 55, 3, 'DISPONIBLE'),
            (10, 1, 'LAB-COMP1', 'Laboratorio de computo 1', 'LABORATORIO', 25, 1, 'DISPONIBLE'),
            (11, 1, 'LAB-COMP4', 'Laboratorio de computo 4', 'LABORATORIO', 12, 2, 'DISPONIBLE'),

            -- Bloque B (27)
            (12, 2, 'B2', 'AULA B2', 'AULA', 26, 1, 'DISPONIBLE'),
            (13, 2, 'B3', 'AULA B3', 'AULA', 30, 1, 'DISPONIBLE'),
            (14, 2, 'B4', 'AULA B4', 'AULA', 33, 1, 'DISPONIBLE'),
            (15, 2, 'B5', 'B5 (Coworking)', 'COWORKING', 0, 1, 'DISPONIBLE'),
            (16, 2, 'B6', 'AULA B6', 'AULA', 26, 1, 'DISPONIBLE'),
            (17, 2, 'B7', 'AULA B7', 'AULA', 30, 1, 'DISPONIBLE'),
            (18, 2, 'B8', 'AULA B8', 'AULA', 28, 1, 'DISPONIBLE'),
            (19, 2, 'B9', 'AULA B9', 'AULA', 22, 2, 'DISPONIBLE'),
            (20, 2, 'B10', 'AULA B10', 'AULA', 34, 2, 'DISPONIBLE'),
            (21, 2, 'B11', 'AULA B11', 'AULA', 34, 2, 'DISPONIBLE'),
            (22, 2, 'B12', 'AULA B12', 'AULA', 29, 2, 'DISPONIBLE'),
            (23, 2, 'B13', 'AULA B13', 'AULA', 28, 2, 'DISPONIBLE'),
            (24, 2, 'B14', 'AULA B14', 'AULA', 33, 2, 'DISPONIBLE'),
            (25, 2, 'B15', 'AULA B15', 'AULA', 24, 3, 'DISPONIBLE'),
            (26, 2, 'B16', 'AULA B16', 'AULA', 16, 3, 'DISPONIBLE'),
            (27, 2, 'B17', 'AULA B17', 'AULA', 27, 4, 'DISPONIBLE'),
            (28, 2, 'B20', 'AULA B20', 'AULA', 16, 4, 'DISPONIBLE'),
            (29, 2, 'B21', 'AULA B21', 'AULA', 32, 4, 'DISPONIBLE'),
            (30, 2, 'B22', 'AULA B22', 'AULA', 24, 4, 'DISPONIBLE'),
            (31, 2, 'B23', 'AULA B23', 'AULA', 26, 4, 'DISPONIBLE'),
            (32, 2, 'LAB-COMP2', 'Laboratorio de computo 2', 'LABORATORIO', 22, 3, 'DISPONIBLE'),
            (33, 2, 'LAB-COMP3', 'Laboratorio de computo 3', 'LABORATORIO', 15, 3, 'DISPONIBLE'),
            (34, 2, 'LAB-CONT', 'Laboratorio Contable', 'LABORATORIO', 13, 1, 'DISPONIBLE'),
            (35, 2, 'LAB-REHAB2', 'Laboratorio Rehabilitación Física 2', 'LABORATORIO', 20, 4, 'DISPONIBLE'),
            (36, 2, 'TAL-FACIAL-SPA', 'Taller Facial Maquillaje - SPA Japón', 'LABORATORIO', 25, 3, 'DISPONIBLE'),
            (53, 2, 'TAL-FACIAL', 'Taller Facial', 'LABORATORIO', 20, 3, 'DISPONIBLE'),
            (54, 2, 'TAL-CORP', 'Talleres Corporales', 'LABORATORIO', 20, 3, 'DISPONIBLE'),

            -- Bloque C (13) - C1, C2, C3, C4 marcadas como Aulas No Disponibles
            (37, 3, 'C1', 'AULA C1', 'AULA', 0, 1, 'INACTIVO'),
            (38, 3, 'C2', 'AULA C2', 'AULA', 0, 1, 'INACTIVO'),
            (39, 3, 'C3', 'AULA C3', 'AULA', 0, 1, 'INACTIVO'),
            (40, 3, 'C4', 'AULA C4', 'AULA', 0, 1, 'INACTIVO'),
            (41, 3, 'C5-C6', 'AULA C5-C6', 'AULA', 75, 1, 'DISPONIBLE'),
            (43, 3, 'C7', 'AULA C7', 'AULA', 30, 1, 'DISPONIBLE'),
            (44, 3, 'C8', 'AULA C8', 'AULA', 37, 1, 'DISPONIBLE'),
            (45, 3, 'C9', 'AULA C9', 'AULA', 59, 1, 'DISPONIBLE'),
            (46, 3, 'C10', 'AULA C10', 'AULA', 17, 1, 'DISPONIBLE'),
            (47, 3, 'C11', 'AULA C11', 'AULA', 7, 1, 'DISPONIBLE'),
            (48, 3, 'C12', 'AULA C12', 'AULA', 42, 2, 'DISPONIBLE'),
            (49, 3, 'CENTRO-INF', 'Centro Infantil', 'AULA', 25, 1, 'DISPONIBLE'),

            -- Bloque D (3)
            (50, 4, 'LAB-ENF1', 'Laboratorio Enfermería 1', 'LABORATORIO', 24, 2, 'DISPONIBLE'),
            (51, 4, 'LAB-ENF2', 'Laboratorio Enfermería 2', 'LABORATORIO', 19, 2, 'DISPONIBLE'),
            (52, 4, 'LAB-REHAB1', 'Laboratorio Rehabilitación Física 1', 'LABORATORIO', 20, 3, 'DISPONIBLE'),

            -- Bloque E (3)
            (59, 5, 'E1', 'AULA E1', 'LABORATORIO', 34, 4, 'DISPONIBLE'),
            (60, 5, 'E2', 'AULA E2', 'LABORATORIO', 36, 4, 'DISPONIBLE'),
            (61, 5, 'E3', 'AULA E3', 'LABORATORIO', 37, 4, 'DISPONIBLE'),

            -- Bloque F (4)
            (55, 6, 'ELEC-1', 'Electrotecnia 1', 'LABORATORIO', 20, 1, 'DISPONIBLE'),
            (56, 6, 'ELEC-2', 'Electrotecnia 2', 'LABORATORIO', 20, 1, 'DISPONIBLE'),
            (57, 6, 'CTRL-IND', 'Control Industrial', 'LABORATORIO', 20, 1, 'DISPONIBLE'),
            (58, 6, 'MAQ-ELEC', 'Máquinas Eléctricas', 'LABORATORIO', 20, 1, 'DISPONIBLE'),

            -- Bloque M (4)
            (62, 7, 'M1', 'AULA M1', 'AULA', 25, 1, 'DISPONIBLE'),
            (63, 7, 'M2', 'AULA M2', 'AULA', 30, 1, 'DISPONIBLE'),
            (64, 7, 'TAL-TRANSF', 'Taller de Transferencia', 'LABORATORIO', 40, 1, 'DISPONIBLE'),
            (65, 7, 'TAL-MATRIZ', 'Taller Matriz', 'LABORATORIO', 40, 1, 'DISPONIBLE');
          `);

          // Sincronizar referencias de planificaciones
          dbInstance.run("UPDATE planificacion_academica SET id_aula_laboratorio = 1 WHERE id_planificacion IN (1, 2, 9);");
          dbInstance.run("UPDATE planificacion_academica SET id_aula_laboratorio = 3 WHERE id_planificacion IN (3, 4);");
          dbInstance.run("UPDATE planificacion_academica SET id_aula_laboratorio = 8 WHERE id_planificacion = 5;");
          dbInstance.run("UPDATE planificacion_academica SET id_aula_laboratorio = 4 WHERE id_planificacion = 6;");
          dbInstance.run("UPDATE planificacion_academica SET id_aula_laboratorio = 18 WHERE id_planificacion = 7;");
          dbInstance.run("UPDATE planificacion_academica SET id_aula_laboratorio = 14 WHERE id_planificacion = 8;");

          // Garantizar que C1, C2, C3 y C4 permanezcan como AULAS NO DISPONIBLES (INACTIVO)
          dbInstance.run(`
            UPDATE aula_laboratorio 
            SET estado = 'INACTIVO', recursos = 'Aula no disponible (Fuera de servicio / En adecuación)', capacidad = 0 
            WHERE codigo IN ('C1', 'C2', 'C3', 'C4');
          `);

          // Garantizar que B5 sea registrado como COWORKING (No es un aula de clases)
          dbInstance.run(`
            UPDATE aula_laboratorio 
            SET tipo = 'COWORKING', nombre = 'B5 (Espacio Coworking)', recursos = 'Espacio Coworking institucional colaborativo (No es un aula de clases)', capacidad = 0
            WHERE codigo = 'B5';
          `);

            // Garantizar que A2 y A3 tengan su capacidad reglamentaria
            dbInstance.run(`
              UPDATE aula_laboratorio 
              SET capacidad = 35 
              WHERE codigo IN ('A2', 'A3') AND capacidad = 0;
            `);

            // Garantizar que C5 y C6 se unifiquen en C5-C6 con capacidad 75
            dbInstance.run(`
              UPDATE aula_laboratorio 
              SET codigo = 'C5-C6', nombre = 'AULA C5-C6', capacidad = 75, estado = 'DISPONIBLE'
              WHERE codigo = 'C5' OR id_aula_laboratorio = 41;
            `);
            dbInstance.run(`
              DELETE FROM aula_laboratorio WHERE codigo = 'C6' OR id_aula_laboratorio = 42;
            `);
        } catch (aulaErr) {
          console.error('Error al actualizar aulas institucionales:', aulaErr);
        }

        persistDatabase();
      } catch (migrationErr) {
        console.error('Error al aplicar migraciones de seguridad:', migrationErr);
      }
      console.log('Base de datos SQLite cargada desde archivo persistente.');
    } catch (err) {
      console.error('Error al leer base de datos existente, regenerando...', err);
      dbInstance = new SQL.Database();
      dbInstance.run(SEED_SQL);
      dbInstance.run(SEED_INSERTS);
      seedSecurityData(dbInstance);
      persistDatabase();
    }
  } else {
    console.log('Inicializando nueva base de datos relacional SQLite con datos 100% adjuntos...');
    dbInstance = new SQL.Database();
    dbInstance.run(SEED_SQL);
    dbInstance.run(SEED_INSERTS);
    seedSecurityData(dbInstance);
    persistDatabase();
    console.log('Base de datos inicializada y persistida con éxito en', DB_PATH);
  }

  return dbInstance;
}

export async function reseedSecurity(): Promise<void> {
  const db = await getDatabase();
  seedSecurityData(db);
  persistDatabase();
}

export function persistDatabase(): void {
  if (!dbInstance) return;
  try {
    const data = dbInstance.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
  } catch (err) {
    console.error('Error al persistir base de datos SQLite:', err);
  }
}

export async function queryAll<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const db = await getDatabase();
  const stmt: Statement = db.prepare(sql);
  if (params.length > 0) {
    stmt.bind(params);
  }
  const results: T[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject() as T);
  }
  stmt.free();
  return results;
}

export async function queryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
  const items = await queryAll<T>(sql, params);
  return items.length > 0 ? items[0] : null;
}

export async function runQuery(sql: string, params: any[] = []): Promise<{ changes: number; lastInsertRowid: number }> {
  const db = await getDatabase();
  const stmt: Statement = db.prepare(sql);
  if (params.length > 0) {
    stmt.bind(params);
  }
  stmt.step();
  stmt.free();

  const infoStmt = db.prepare('SELECT changes() as changes, last_insert_rowid() as lastInsertRowid');
  infoStmt.step();
  const info = infoStmt.getAsObject() as { changes: number; lastInsertRowid: number };
  infoStmt.free();

  persistDatabase();
  return info;
}
