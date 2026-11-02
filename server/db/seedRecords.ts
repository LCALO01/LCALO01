export const SEED_INSERTS = `
-- DIAS DE LA SEMANA
INSERT OR IGNORE INTO dia_semana (id_dia, codigo, nombre, orden, es_laborable, estado) VALUES
(1, 'LUN', 'LUNES', 1, 1, 'ACTIVO'),
(2, 'MAR', 'MARTES', 2, 1, 'ACTIVO'),
(3, 'MIE', 'MIERCOLES', 3, 1, 'ACTIVO'),
(4, 'JUE', 'JUEVES', 4, 1, 'ACTIVO'),
(5, 'VIE', 'VIERNES', 5, 1, 'ACTIVO'),
(6, 'SAB', 'SABADO', 6, 1, 'ACTIVO'),
(7, 'DOM', 'DOMINGO', 7, 1, 'ACTIVO');

-- JORNADAS
INSERT OR IGNORE INTO jornada (id_jornada, codigo, nombre, hora_inicio, hora_fin, estado) VALUES
(1, 'MAT', 'MATUTINA', '08:00:00', '12:00:00', 'ACTIVA'),
(2, 'VES', 'VESPERTINA', '13:00:00', '17:00:00', 'ACTIVA'),
(3, 'NOC', 'NOCTURNA', '18:00:00', '22:00:00', 'ACTIVA'),
(4, 'SAB', 'SABATINA', '07:00:00', '18:00:00', 'ACTIVA'),
(5, 'DOM', 'DOMINICAL', '07:00:00', '18:00:00', 'ACTIVA');

-- FERIADOS 2026
INSERT OR IGNORE INTO feriado (id_feriado, codigo, nombre, desde, hasta, descripcion, estado) VALUES
(1, 'FER-2026-01', 'AÑO NUEVO', '2026-01-01', '2026-01-03', 'Feriado de Año Nuevo', 'ACTIVO'),
(2, 'FER-2026-02', 'CARNAVAL', '2026-02-16', '2026-02-17', 'Feriado de Carnaval', 'ACTIVO'),
(3, 'FER-2026-03', 'SEMANA SANTA', '2026-04-06', '2026-04-08', 'Jueves y Viernes Santo', 'ACTIVO'),
(4, 'FER-2026-04', 'DIA DEL TRABAJO', '2026-05-01', '2026-05-03', 'Feriado por el Día del Trabajo', 'ACTIVO'),
(5, 'FER-2026-05', 'BATALLA DE PICHINCHA', '2026-05-25', '2026-05-25', 'Conmemoración de la Batalla de Pichincha', 'ACTIVO'),
(6, 'FER-2026-06', 'PRIMER GRITO DE INDEPENDENCIA', '2026-08-10', '2026-08-10', 'Primer Grito de la Independencia', 'ACTIVO'),
(7, 'FER-2026-07', 'INDEPENDENCIA DE GUAYAQUIL', '2026-10-09', '2026-10-11', 'Feriado por la Independencia de Guayaquil', 'ACTIVO'),
(8, 'FER-2026-08', 'DIA DE LOS DIFUNTOS', '2026-11-02', '2026-11-02', 'Día de los Difuntos', 'ACTIVO'),
(9, 'FER-2026-09', 'INDEPENDENCIA DE CUENCA', '2026-11-03', '2026-11-03', 'Independencia de Cuenca', 'ACTIVO'),
(10, 'FER-2026-10', 'NAVIDAD', '2026-12-25', '2026-12-25', 'Feriado de Navidad', 'ACTIVO');

-- SEDES
INSERT OR IGNORE INTO sede (id_sede, codigo, nombre, ciudad, provincia, direccion, telefono, correo, estado) VALUES
(1, 'SED-01', 'UIO_NORTE', 'QUITO', 'PICHINCHA', 'CAMPUS NORTE - AV. DE LA PRENSA Y AV. 10 DE AGOSTO', '022345671', 'uio.norte@isuj.edu.ec', 'ACTIVA'),
(2, 'SED-02', 'UIO_VALLE', 'RUMIÑAHUI', 'PICHINCHA', 'CAMPUS VALLE - AV. GENERAL RUMIÑAHUI (LOS CHILLOS)', '022345672', 'uio.valle@isuj.edu.ec', 'ACTIVA'),
(3, 'SED-03', 'UIO_SUR', 'QUITO', 'PICHINCHA', 'CAMPUS SUR - AV. PEDRO VICENTE MALDONADO Y MORÁN VALVERDE', '022345673', 'uio.sur@isuj.edu.ec', 'ACTIVA'),
(4, 'SED-04', 'SANTO DOMINGO', 'SANTO DOMINGO', 'SANTO DOMINGO DE LOS TSÁCHILAS', 'CAMPUS SANTO DOMINGO - AV. QUITO Y AV. RÍO LELIA', '022765432', 'santodomingo@isuj.edu.ec', 'ACTIVA');

-- ESCUELAS
INSERT OR IGNORE INTO escuela (id_escuela, id_sede, codigo, nombre, descripcion, estado) VALUES
(1, 1, 'ESC-01', 'TIC', 'Escuela de Tecnologías de la Información y Comunicación', 'ACTIVA'),
(2, 1, 'ESC-02', 'EDUCACION', 'Escuela de Ciencias de la Educación y Pedagogía', 'ACTIVA'),
(3, 1, 'ESC-03', 'INGENIERIA E INDUSTRIA', 'Escuela de Ingeniería, Producción e Industria', 'ACTIVA'),
(4, 1, 'ESC-04', 'SALUD', 'Escuela de Ciencias de la Salud, Odontología y Rehabilitación', 'ACTIVA'),
(5, 1, 'ESC-05', 'SERVICIOS', 'Escuela de Hospitalidad, Gastronomía y Servicios', 'ACTIVA'),
(6, 1, 'ESC-06', 'ADMINISTRACION', 'Escuela de Ciencias Administrativas, Contables y Gestión', 'ACTIVA');

-- CARRERAS
INSERT OR IGNORE INTO carrera (id_carrera, id_escuela, codigo, nombre, titulo_otorgado, modalidad, duracion_niveles, numero_semanas, estado) VALUES
(1,  1, 'CAR-01', 'DESARROLLO DE SOFTWARE', 'TECNÓLOGO SUPERIOR EN DESARROLLO DE SOFTWARE', 'PRESENCIAL', 5, 16, 'ACTIVA'),
(2,  2, 'CAR-02', 'EDUCACIÓN INICIAL', 'TECNÓLOGO SUPERIOR EN EDUCACIÓN INICIAL', 'PRESENCIAL', 5, 16, 'ACTIVA'),
(3,  3, 'CAR-03', 'ELECTRICIDAD', 'TECNÓLOGO SUPERIOR EN ELECTRICIDAD', 'PRESENCIAL', 5, 16, 'ACTIVA'),
(4,  2, 'CAR-04', 'ENTRENAMIENTO DEPORTIVO', 'TECNÓLOGO SUPERIOR EN ENTRENAMIENTO DEPORTIVO', 'PRESENCIAL', 5, 16, 'ACTIVA'),
(5,  4, 'CAR-05', 'ODONTOLOGÍA', 'TECNÓLOGO SUPERIOR EN ODONTOLOGÍA', 'PRESENCIAL', 6, 16, 'ACTIVA'),
(6,  5, 'CAR-06', 'GASTRONOMÍA', 'TECNÓLOGO SUPERIOR EN GASTRONOMÍA', 'PRESENCIAL', 5, 16, 'ACTIVA'),
(7,  5, 'CAR-07', 'GASTRONOMÍA UNIVERSITARIA', 'LICENCIADO EN GASTRONOMÍA', 'PRESENCIAL', 8, 16, 'ACTIVA'),
(8,  4, 'CAR-08', 'ENFERMERÍA', 'TECNÓLOGO SUPERIOR EN ENFERMERÍA', 'PRESENCIAL', 5, 16, 'ACTIVA'),
(9,  3, 'CAR-09', 'MECÁNICA AUTOMOTRIZ', 'TECNÓLOGO SUPERIOR EN MECÁNICA AUTOMOTRIZ', 'PRESENCIAL', 5, 16, 'ACTIVA'),
(10, 4, 'CAR-10', 'REHABILITACIÓN FÍSICA', 'TECNÓLOGO SUPERIOR EN REHABILITACIÓN FÍSICA', 'PRESENCIAL', 5, 16, 'ACTIVA'),
(11, 6, 'CAR-11', 'CONTABILIDAD Y TRIBUTACIÓN', 'TECNÓLOGO SUPERIOR EN CONTABILIDAD Y TRIBUTACIÓN', 'PRESENCIAL', 5, 16, 'ACTIVA'),
(12, 6, 'CAR-12', 'TECNOLOGÍA SUPERIOR EN CONTABILIDAD', 'TECNÓLOGO SUPERIOR EN CONTABILIDAD', 'PRESENCIAL', 5, 16, 'ACTIVA'),
(13, 6, 'CAR-13', 'GESTIÓN DE TALENTO HUMANO', 'TECNÓLOGO SUPERIOR EN GESTIÓN DE TALENTO HUMANO', 'PRESENCIAL', 5, 16, 'ACTIVA'),
(14, 6, 'CAR-14', 'TECNOLOGÍA SUPERIOR EN ADMINISTRACIÓN', 'TECNÓLOGO SUPERIOR EN ADMINISTRACIÓN', 'PRESENCIAL', 5, 16, 'ACTIVA'),
(15, 6, 'CAR-15', 'TECNOLOGÍA SUPERIOR EN MARKETING', 'TECNÓLOGO SUPERIOR EN MARKETING', 'PRESENCIAL', 5, 16, 'ACTIVA'),
(16, 5, 'CAR-16', 'ESTÉTICA INTEGRAL', 'TECNÓLOGO SUPERIOR EN ESTÉTICA INTEGRAL', 'PRESENCIAL', 5, 16, 'ACTIVA'),
(17, 5, 'CAR-17', 'ESTÉTICA INTEGRAL UNIVERSITARIA', 'LICENCIADO EN ESTÉTICA INTEGRAL', 'PRESENCIAL', 8, 16, 'ACTIVA');

-- NIVELES
INSERT OR IGNORE INTO nivel (id_nivel, numero, nombre, descripcion, estado) VALUES
(1, 1, 'NIVEL 1', 'Primer nivel', 'ACTIVO'),
(2, 2, 'NIVEL 2', 'Segundo nivel', 'ACTIVO'),
(3, 3, 'NIVEL 3', 'Tercer nivel', 'ACTIVO'),
(4, 4, 'NIVEL 4', 'Cuarto nivel', 'ACTIVO');

-- PARALELO
INSERT OR IGNORE INTO paralelo (id_paralelo, codigo, descripcion, cupo_maximo, estado) VALUES
(1, 'A', 'Paralelo A', 35, 'ACTIVO');

-- PERIODO ACADEMICO
INSERT OR IGNORE INTO periodo_academico (id_periodo, codigo, nombre, fecha_inicio, fecha_fin, descripcion, estado) VALUES
(1, 'PER-2026-1', 'PERIODO ACADEMICO 2026-1', '2026-03-01', '2026-08-31', 'Primer periodo académico del año 2026', 'ACTIVO');

-- BLOQUES
INSERT OR IGNORE INTO bloque (id_bloque, id_sede, codigo, nombre, descripcion, numero_pisos, estado) VALUES
(1, 1, 'BLQ-A', 'BLOQUE A', 'Bloque de aulas y laboratorios de computación A', 3, 'ACTIVO'),
(2, 1, 'BLQ-B', 'BLOQUE B', 'Bloque de aulas, laboratorios y talleres B', 4, 'ACTIVO'),
(3, 1, 'BLQ-C', 'BLOQUE C', 'Bloque de aulas generales y Centro Infantil C', 2, 'ACTIVO'),
(4, 1, 'BLQ-D', 'BLOQUE D', 'Laboratorios de salud: Enfermería y Rehabilitación Física D', 3, 'ACTIVO'),
(5, 1, 'BLQ-E', 'BLOQUE E', 'Bloque de aulas y talleres E', 4, 'ACTIVO'),
(6, 1, 'BLQ-F', 'BLOQUE F', 'Laboratorios técnicos: Electrotecnia, Control y Máquinas F', 1, 'ACTIVO'),
(7, 1, 'BLQ-M', 'BLOQUE M', 'Aulas M1, M2, Taller de Transferencia y Taller Matriz M', 1, 'ACTIVO');

-- AULAS Y LABORATORIOS (65 AULAS INSTITUCIONALES)
INSERT OR IGNORE INTO aula_laboratorio (id_aula_laboratorio, id_bloque, codigo, nombre, tipo, capacidad, piso, estado) VALUES
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

-- DOCENTES (50)
INSERT OR IGNORE INTO docente (id_docente, ci, nombres, apellidos, correo, estado, titulo_academico, tipo_contrato) VALUES
(1, '1710000001', 'MARIO FERNANDO', 'FAJARDO VANEGAS', 'mario.fajardo@isuj.edu.ec', 'ACTIVO', 'Magíster en Finanzas', 'TIEMPO COMPLETO'),
(2, '1710000002', 'EDISON ALEXIS', 'TOAPANTA MURILLO', 'edison.toapanta@isuj.edu.ec', 'ACTIVO', 'Ingeniero en Talento Humano', 'MEDIO TIEMPO'),
(3, '1710000003', 'ANDREA LORENA', 'PAZMIÑO MENDOZA', 'andrea.pazmino@isuj.edu.ec', 'ACTIVO', 'Licenciada en Gastronomía', 'TIEMPO COMPLETO'),
(4, '1710000004', 'FREDDY ENRIQUE', 'RUANO CALDERON', 'freddy.ruano@isuj.edu.ec', 'ACTIVO', 'Magíster en Administración', 'TIEMPO COMPLETO'),
(5, '1710000005', 'JOSE GABRIEL', 'CEDEÑO VERA', 'jose.cedeno@isuj.edu.ec', 'ACTIVO', 'Economista y Auditor', 'TIEMPO COMPLETO'),
(6, '1710000006', 'MARIA DOLORES', 'GILER ALVAREZ', 'maria.giler@isuj.edu.ec', 'ACTIVO', 'Doctora en Odontología', 'TIEMPO COMPLETO'),
(7, '1710000007', 'MESIAS GEOVANNY', 'NARANJO ARMIJO', 'mesias.naranjo@isuj.edu.ec', 'ACTIVO', 'Especialista en Bioseguridad', 'MEDIO TIEMPO'),
(8, '1710000008', 'GERMAN RAMIRO', 'MORILLO REINOSO', 'german.morillo@isuj.edu.ec', 'ACTIVO', 'Contador Público Autorizado', 'TIEMPO COMPLETO'),
(9, '1710000009', 'ALEX DAVID', 'CEVALLOS ANGOS', 'alex.cevallos@isuj.edu.ec', 'ACTIVO', 'Chef Ejecutivo Internacional', 'TIEMPO COMPLETO'),
(10, '1710000010', 'JESSICA VANESSA', 'LEIVA MONTALVO', 'jessica.leiva@isuj.edu.ec', 'ACTIVO', 'Psicóloga Organizacional', 'TIEMPO COMPLETO'),
(11, '1710000011', 'JULIA STEFANIA', 'IDROBO PAREDES', 'julia.idrobo@isuj.edu.ec', 'ACTIVO', 'Odontóloga Especialista', 'TIEMPO COMPLETO'),
(12, '1710000012', 'MARIA BELEN', 'MAFLA BUSTOS', 'maria.mafla@isuj.edu.ec', 'ACTIVO', 'Máster en Marketing Digital', 'TIEMPO COMPLETO'),
(13, '1710000013', 'STHEFANNI CAROLINA', 'GOMEZ VALLEJOS', 'sthefanni.gomez@isuj.edu.ec', 'ACTIVO', 'Licenciada en Enfermería', 'TIEMPO COMPLETO'),
(14, '1710000014', 'HENRRY MARIANO', 'ZAMBRANO SOTO', 'henrry.zambrano@isuj.edu.ec', 'ACTIVO', 'Bioquímico Farmacéutico', 'MEDIO TIEMPO'),
(15, '1710000015', 'CRISTIAN ANDRÉS', 'GUERRERO ROSERO', 'cristian.guerrero@isuj.edu.ec', 'ACTIVO', 'Especialista en Salud Pública', 'TIEMPO COMPLETO'),
(16, '1710000016', 'HENRY ISRAEL', 'AUCANCELA MORA', 'henry.aucancela@isuj.edu.ec', 'ACTIVO', 'Médico Cirujano', 'TIEMPO COMPLETO'),
(17, '1710000017', 'VALERIA RAQUEL', 'ANDRADE ORTEGA', 'valeria.andrade@isuj.edu.ec', 'ACTIVO', 'Cosmiatra Médica', 'TIEMPO COMPLETO'),
(18, '1710000018', 'DAYSI ESTEFANIA', 'MASAPANTA CATOTA', 'daysi.masapanta@isuj.edu.ec', 'ACTIVO', 'Microbióloga', 'MEDIO TIEMPO'),
(19, '1710000019', 'SANDY LIZETH', 'ROMERO CANSINO', 'sandy.romero@isuj.edu.ec', 'ACTIVO', 'Morfofisióloga', 'TIEMPO COMPLETO'),
(20, '1710000020', 'CRISTOPHER MIHAIL', 'TUFIÑO PAREDES', 'cristopher.tufino@isuj.edu.ec', 'ACTIVO', 'Nutricionista Dietista', 'TIEMPO COMPLETO'),
(21, '1710000021', 'GENARO NICOLAS', 'AVILES ESTEVEZ', 'genaro.aviles@isuj.edu.ec', 'ACTIVO', 'Ingeniero Mecánico y Estadístico', 'TIEMPO COMPLETO'),
(22, '1710000022', 'TELMO RUBEN', 'AYALA PINTO', 'telmo.ayala@isuj.edu.ec', 'ACTIVO', 'Auditor de Presupuestos', 'TIEMPO COMPLETO'),
(23, '1710000023', 'JANETH ROSALIA', 'RODRIGUEZ MENDOZA', 'janeth.rodriguez@isuj.edu.ec', 'ACTIVO', 'Técnica Quirúrgica', 'TIEMPO COMPLETO'),
(24, '1710000024', 'IVONNE MARCELA', 'TATAYO SIMBAÑA', 'ivonne.tatayo@isuj.edu.ec', 'ACTIVO', 'Terapista Integral', 'TIEMPO COMPLETO'),
(25, '1710000025', 'IRINA ALEJANDRA', 'CEPEDA MOSQUERA', 'irina.cepeda@isuj.edu.ec', 'ACTIVO', 'Especialista en Desarrollo Humano', 'TIEMPO COMPLETO'),
(26, '1710000026', 'ADRIANA ELIZABETH', 'CEPEDA HERNANDEZ', 'adriana.cepeda@isuj.edu.ec', 'ACTIVO', 'Pedagoga Infantil', 'TIEMPO COMPLETO'),
(27, '1710000027', 'MARLENE MARINA', 'NARANJO RECALDE', 'marlene.naranjo@isuj.edu.ec', 'ACTIVO', 'Docente de Matemáticas Iniciales', 'TIEMPO COMPLETO'),
(28, '1710000028', 'GUADALUPE LUCILA', 'SUAREZ VASQUEZ', 'guadalupe.suarez@isuj.edu.ec', 'ACTIVO', 'Licenciada en Ciencias de la Educación', 'TIEMPO COMPLETO'),
(29, '1710000029', 'SANDRA ELIZABETH', 'RIVADENEIRA HERRERA', 'sandra.rivadeneira@isuj.edu.ec', 'ACTIVO', 'Psicóloga Infantil', 'TIEMPO COMPLETO'),
(30, '1710000030', 'ISMAEL GUSTAVO', 'CONRADO CARVAJAL', 'ismael.conrado@isuj.edu.ec', 'ACTIVO', 'Magíster en Contabilidad y Finanzas', 'TIEMPO COMPLETO'),
(31, '1710000031', 'MANUEL ESTEBAN', 'CARRERA ERAZO', 'manuel.carrera@isuj.edu.ec', 'ACTIVO', 'Especialista en Innovación', 'TIEMPO COMPLETO'),
(32, '1710000032', 'KARELYS MIROSLAVA', 'RECALDE LLANOS', 'karelys.recalde@isuj.edu.ec', 'ACTIVO', 'Nutricionista Clínica', 'TIEMPO COMPLETO'),
(33, '1710000033', 'IVÁN DARÍO', 'ORDÓÑEZ YÉPEZ', 'ivan.ordonez@isuj.edu.ec', 'ACTIVO', 'Analista de Investigación de Mercados', 'TIEMPO COMPLETO'),
(34, '1710000034', 'JORGE ROBERTO', 'QUISHPE RIERA', 'jorge.quishpe@isuj.edu.ec', 'ACTIVO', 'Sociólogo e Ingeniero', 'TIEMPO COMPLETO'),
(35, '1710000035', 'JOHANA PAOLA', 'MORENO ANDRANGO', 'johana.moreno@isuj.edu.ec', 'ACTIVO', 'Contadora Tributaria', 'TIEMPO COMPLETO'),
(36, '1710000036', 'DIANA ESTEFANIA', 'MUÑOZ GUERRERO', 'diana.munoz@isuj.edu.ec', 'ACTIVO', 'Educadora Inicial', 'TIEMPO COMPLETO'),
(37, '1710000037', 'SIXTO HIPOLITO', 'BACA PINTO', 'sixto.baca@isuj.edu.ec', 'ACTIVO', 'Abogado Laboralista', 'TIEMPO COMPLETO'),
(38, '1710000038', 'MARÍA JOSÉ', 'MACÍAS BÓSQUEZ', 'maria.macias@isuj.edu.ec', 'ACTIVO', 'Abogada Corporativa', 'TIEMPO COMPLETO'),
(39, '1710000039', 'DENISSE VANESA', 'OLIVO LALALEO', 'denisse.olivo@isuj.edu.ec', 'ACTIVO', 'Investigadora Educativa', 'TIEMPO COMPLETO'),
(40, '1710000040', 'DIANA BEATRIZ', 'VALENCIA JUMA', 'diana.valencia@isuj.edu.ec', 'ACTIVO', 'Psicóloga Clínica', 'TIEMPO COMPLETO'),
(41, '1710000041', 'ROBERTO LENIN', 'RIVADENEIRA HERRERA', 'roberto.rivadeneira@isuj.edu.ec', 'ACTIVO', 'Ingeniero en Sistemas de Información', 'TIEMPO COMPLETO'),
(42, '1710000042', 'LORENA ANABEL', 'RIVADENEIRA HERRERA', 'lorena.rivadeneira@isuj.edu.ec', 'ACTIVO', 'Especialista en Bioética y Emprendimiento', 'TIEMPO COMPLETO'),
(43, '1710000043', 'ANA BELEN', 'LLORE QUEZADA', 'ana.llore@isuj.edu.ec', 'ACTIVO', 'Enfermera Especialista en Cuidados Críticos', 'TIEMPO COMPLETO'),
(44, '1710000044', 'GABRIELA ELIZABETH', 'MORALES COLLAGUAZO', 'gabriela.morales@isuj.edu.ec', 'ACTIVO', 'Pediatra de Enfermería', 'TIEMPO COMPLETO'),
(45, '1710000045', 'VILMA NATALIA', 'CEPEDA LOPEZ', 'vilma.cepeda@isuj.edu.ec', 'ACTIVO', 'Diseñadora de Imagen Corporativa', 'MEDIO TIEMPO'),
(46, '1710000046', 'KARINA MICHELE', 'FONSECA NARANJO', 'karina.fonseca@isuj.edu.ec', 'ACTIVO', 'Especialista en Estrategias Lúdicas', 'TIEMPO COMPLETO'),
(47, '1710000047', 'RUTH ISABEL', 'GALLEGOS MONTERO', 'ruth.gallegos@isuj.edu.ec', 'ACTIVO', 'Consultora de RRHH', 'TIEMPO COMPLETO'),
(48, '1710000048', 'DIEGO MAURICIO', 'TUZO FLORES', 'diego.tuzo@isuj.edu.ec', 'ACTIVO', 'Matemático Aplicado', 'TIEMPO COMPLETO'),
(49, '1710000049', 'JAVIER FERNANDO', 'BALDEÓN CEPEDA', 'javier.baldeon@isuj.edu.ec', 'ACTIVO', 'Ingeniero Automotriz y Metrólogo', 'TIEMPO COMPLETO'),
(50, '1710000050', 'ALEX JAVIER', 'ATAHUALPA ALDAZ', 'alex.atahualpa@isuj.edu.ec', 'ACTIVO', 'Fisioterapeuta y Farmacólogo', 'TIEMPO COMPLETO');

-- ASIGNATURAS (65)
INSERT OR IGNORE INTO asignatura (id_asignatura, codigo_asignatura, nombre, horas_docencia, horas_practicas, horas_autonomas, horas_totales, creditos, estado) VALUES
(1, 'GAS_UP_103', 'MATEMATICA FINANCIERA', 48, 16, 32, 96, 2.0, 'ACTIVA'),
(2, 'GTH_P404', 'SEGURIDAD, SALUD OCUPACIONAL Y ERGONOMÍA', 48, 16, 32, 96, 2.0, 'ACTIVA'),
(3, 'GAS_UP_105', 'SEGURIDAD E HIGIENE ALIMENTARIA', 48, 32, 16, 96, 2.0, 'ACTIVA'),
(4, 'ADM_P104', 'ADMINISTRACION I', 64, 16, 40, 120, 2.5, 'ACTIVA'),
(5, 'ADM_P304', 'ADMINISTRACIÓN FINANCIERA', 64, 32, 44, 140, 3.0, 'ACTIVA'),
(6, 'ODO_P105', 'ANATOMOFISIOLOGIA ODONTOLOGICA', 64, 32, 44, 140, 3.0, 'ACTIVA'),
(7, 'ODO_P202', 'BIOSEGURIDAD Y ESTERILIZACION', 48, 32, 16, 96, 2.0, 'ACTIVA'),
(8, 'ODO_P203', 'CIRUGIA Y ENDODONCIA I', 64, 48, 48, 160, 3.5, 'ACTIVA'),
(9, 'ODO_P303', 'CIRUGÍA Y ENDODONCIA II', 64, 48, 48, 160, 3.5, 'ACTIVA'),
(10, 'ADM_P103', 'CONTABILIDAD GENERAL', 64, 32, 44, 140, 3.0, 'ACTIVA'),
(11, 'DESF_L202', 'CONTABILIDAD GENERAL PARA SOFTWARE', 48, 16, 32, 96, 2.0, 'ACTIVA'),
(12, 'MARK_P104', 'CONTABILIDAD GENERAL DE MARKETING', 48, 16, 32, 96, 2.0, 'ACTIVA'),
(13, 'GAS_UP_104', 'DISEÑO DE MENÚS', 48, 32, 16, 96, 2.0, 'ACTIVA'),
(14, 'ODO_P106', 'ESTRUCTURA Y FUNCION DEL SISTEMA ESTOMATOGNATICO', 64, 32, 44, 140, 3.0, 'ACTIVA'),
(15, 'ADM_P305', 'GESTION DEL TALENTO HUMANO', 64, 16, 40, 120, 2.5, 'ACTIVA'),
(16, 'ODO_P103', 'MANEJO DE EQUIPO E INSTRUMENTAL ODONTOLOGICO', 48, 48, 24, 120, 2.5, 'ACTIVA'),
(17, 'ATH_UP_105', 'MANUAL DE PUESTOS', 48, 16, 32, 96, 2.0, 'ACTIVA'),
(18, 'ODO_P104', 'MICROBIOLOGIA ORAL E INFECTOLOGIA', 48, 32, 20, 100, 2.0, 'ACTIVA'),
(19, 'EST_P201', 'ADMINISTRACION', 48, 16, 32, 96, 2.0, 'ACTIVA'),
(20, 'ENF_P203', 'ATENCION AL ADULTO MAYOR Y CUIDADOS PALEATIVOS', 64, 48, 48, 160, 3.5, 'ACTIVA'),
(21, 'ENF_P105', 'BIOQUÍMICA', 48, 32, 20, 100, 2.0, 'ACTIVA'),
(22, 'ENF_P206', 'ENFERMERIA EN ATENCION PRIMARIA EN SALUD', 64, 48, 48, 160, 3.5, 'ACTIVA'),
(23, 'ENF_P205', 'FARMACOLOGIA APLICADA', 64, 32, 44, 140, 3.0, 'ACTIVA'),
(24, 'ENF_P204', 'FISIOPATOLOGIA Y MORFOLOGIA', 64, 32, 44, 140, 3.0, 'ACTIVA'),
(25, 'EST_P205', 'MASAJE II', 48, 64, 28, 140, 3.0, 'ACTIVA'),
(26, 'ENF_P202', 'MICROBIOLOGIA Y PARASITOLOGIA', 48, 32, 20, 100, 2.0, 'ACTIVA'),
(27, 'ENF_P104', 'MORFOFISIOLOGÍA', 64, 32, 44, 140, 3.0, 'ACTIVA'),
(28, 'EST_P404', 'DIETETICA Y NUTRICION', 48, 16, 32, 96, 2.0, 'ACTIVA'),
(29, 'EST_P301', 'ESTADISTICA DESCRIPTIVA', 48, 32, 20, 100, 2.0, 'ACTIVA'),
(30, 'GTH_P401', 'GESTIÓN PRESUPUESTARIA', 48, 32, 20, 100, 2.0, 'ACTIVA'),
(31, 'CONT_P402', 'PRESUPUESTOS', 64, 32, 44, 140, 3.0, 'ACTIVA'),
(32, 'EST_P305', 'PRIMEROS AUXILIOS', 32, 48, 20, 100, 2.0, 'ACTIVA'),
(33, 'EST_P403', 'TECNICA PRE-POST QUIRURGICA', 48, 48, 24, 120, 2.5, 'ACTIVA'),
(34, 'EST_P402', 'TERAPIAS COMPLEMENTARIAS', 48, 32, 20, 100, 2.0, 'ACTIVA'),
(35, 'GTH_P304', 'DESARROLLO HUMANO', 48, 16, 32, 96, 2.0, 'ACTIVA'),
(36, 'EIN_P203', 'DISEÑO, GESTION Y EVALUACION CURRICULAR', 64, 16, 40, 120, 2.5, 'ACTIVA'),
(37, 'EIN_P205', 'INICIACION A LAS OPERACIONES CONCRETAS / PRE-MATEMATICAS', 64, 32, 44, 140, 3.0, 'ACTIVA'),
(38, 'EIN_P202', 'PEDAGOGIA GENERAL Y CORRIENTES PEDAGOGICAS', 64, 16, 40, 120, 2.5, 'ACTIVA'),
(39, 'EIN_P204', 'PSICOLOGIA GENERAL Y EVOLUTIVA', 64, 16, 40, 120, 2.5, 'ACTIVA'),
(40, 'CT_UP_105', 'CONTABILIDAD COMERCIAL', 64, 32, 44, 140, 3.0, 'ACTIVA'),
(41, 'ADM_P303', 'CREATIVIDAD E INNOVACION EMPRESARIAL', 48, 32, 20, 100, 2.0, 'ACTIVA'),
(42, 'ENF_P402', 'DIETETICA Y NUTRICION CLÍNICA', 48, 32, 20, 100, 2.0, 'ACTIVA'),
(43, 'ADM_P101', 'ESTADISTICA', 64, 32, 44, 140, 3.0, 'ACTIVA'),
(44, 'MARK_P302', 'INVESTIGACION DE MERCADO', 64, 32, 44, 140, 3.0, 'ACTIVA'),
(45, 'ADM_P105', 'INVESTIGACION DE MERCADOS GENERAL', 64, 32, 44, 140, 3.0, 'ACTIVA'),
(46, 'CONT_P301', 'REALIDAD NACIONAL', 32, 16, 48, 96, 2.0, 'ACTIVA'),
(47, 'ATH_UP_103', 'CONTABILIDAD GENERAL RRHH', 64, 32, 44, 140, 3.0, 'ACTIVA'),
(48, 'CT_UP_104', 'CONTABILIDAD GENERAL TRIBUTARIA', 64, 32, 44, 140, 3.0, 'ACTIVA'),
(49, 'EIN_P303', 'DESARROLLO DEL PENSAMIENTO CIENTIFICO DEL NIÑO', 48, 32, 20, 100, 2.0, 'ACTIVA'),
(50, 'GTH_P302', 'LEGISLACIÓN LABORAL Y EMPRESARIAL', 64, 16, 40, 120, 2.5, 'ACTIVA'),
(51, 'EIN_P305', 'MODELOS Y PROCESOS DE INVESTIGACION EDUCATIVA', 48, 32, 20, 100, 2.0, 'ACTIVA'),
(52, 'ATH_UP_106', 'RECLUTAMIENTO Y SELECCIÓN', 64, 32, 44, 140, 3.0, 'ACTIVA'),
(53, 'DESF_L201', 'SISTEMAS OPERATIVOS', 64, 48, 48, 160, 3.5, 'ACTIVA'),
(54, 'ENF_P103', 'DESARROLLO DE EMPRENDIMIENTO Y SOSTENIBILIDAD AMBIENTAL', 32, 16, 48, 96, 2.0, 'ACTIVA'),
(55, 'ADM_P401', 'EMPRENDIMIENTO Y RESPONSABILIDAD SOCIAL', 48, 16, 32, 96, 2.0, 'ACTIVA'),
(56, 'GTH_P402', 'EMPRENDIMIENTO Y RESPONSABILIDAD SOCIAL GTH', 48, 16, 32, 96, 2.0, 'ACTIVA'),
(57, 'ENF_P306', 'ENFERMERIA EN URGENCIAS', 64, 48, 48, 160, 3.5, 'ACTIVA'),
(58, 'ENF_P302', 'ENFERMERIA PEDIATRICA Y ADOLESCENTE', 64, 48, 48, 160, 3.5, 'ACTIVA'),
(59, 'ADM_P403', 'IDENTIDAD E IMAGEN CORPORATIVA', 48, 32, 20, 100, 2.0, 'ACTIVA'),
(60, 'ENF_P102', 'ÉTICA Y BIOÉTICA', 32, 16, 48, 96, 2.0, 'ACTIVA'),
(61, 'DESF_L105', 'LENGUAJE DE PROGRAMACION I', 64, 64, 32, 160, 3.5, 'ACTIVA'),
(62, 'DESF_L101', 'ANALISIS Y DISEÑO DE SISTEMAS', 64, 32, 44, 140, 3.0, 'ACTIVA'),
(63, 'DESF_L104', 'MATEMATICA DISCRETA', 64, 16, 40, 120, 2.5, 'ACTIVA'),
(64, 'REFI_P104', 'MORFOFISIOLOGIA TERAPÉUTICA', 64, 32, 44, 140, 3.0, 'ACTIVA'),
(65, 'REFI_P305', 'REHABILITACION FISICA EN TRAUMATOLOGIA Y ORTOPEDIA', 64, 48, 48, 160, 3.5, 'ACTIVA');

-- ROLES
INSERT OR IGNORE INTO roles (id_rol, nombre, descripcion, estado) VALUES
(1,'SUPERADMIN','Superadministrador con control total sobre todos los módulos','ACTIVO'),
(2,'ADMINISTRADOR','Administrador del sistema con gestión de catálogos y usuarios','ACTIVO'),
(3,'COORDINADOR','Gestión de planificación académica y curricular','ACTIVO'),
(4,'DOCENTE','Acceso a su información y horarios','ACTIVO'),
(5,'OPERADOR','Operación de módulos asignados e infraestructura','ACTIVO'),
(6,'AUDITOR','Auditoría institucional, bitácoras y trazabilidad','ACTIVO'),
(7,'CONDULTA','Acceso a consulta ciudadana y transparencia','ACTIVO');

-- USUARIOS DEL SISTEMA UNIFICADO
INSERT OR IGNORE INTO usuarios (id_usuario, id_docente, nombres, apellidos, username, email, password_hash, cargo, estado, intentos_fallidos, fecha_creacion) VALUES
(1,NULL,'ADMINISTRADOR','DEL SISTEMA','admin','admin@isuj.edu.ec','admin123','Administrador de Sistema','ACTIVO',0,'2026-03-01 08:00:00'),
(2,NULL,'COORDINACION','ACADEMICA','coordinador','coordinacion@isuj.edu.ec','coord123','Coordinador Académico','ACTIVO',0,'2026-03-01 08:00:00'),
(3,NULL,'SECRETARIA','GENERAL','secretaria','secretaria@isuj.edu.ec','secre123','Secretaria','ACTIVO',0,'2026-03-01 08:00:00'),
(4,1,'PORTAL','TRANSPARENCIA','invitado','invitado@isuj.edu.ec','invitado123','Consulta Pública','ACTIVO',0,'2026-03-01 08:00:00'),
(5,1,'MARIO FERNANDO','FAJARDO VANEGAS','mfajardo','mario.fajardo@isuj.edu.ec','docente1','Docente','ACTIVO',0,'2026-03-01 08:00:00');

-- ASIGNACIÓN DE ROLES POR USUARIO
INSERT OR IGNORE INTO usuario_roles (id_usuario, id_rol) VALUES
(1,2), -- admin -> ADMINISTRADOR
(2,3), -- coordinador -> COORDINADOR
(3,3), -- secretaria -> COORDINADOR
(4,7), -- invitado -> CONDULTA
(5,4); -- mfajardo -> DOCENTE

-- USUARIO (Capa compatible para la app existente)
INSERT OR IGNORE INTO usuario (id_usuario, id_docente, nombre_usuario, clave, correo, rol, estado, intentos_fallidos, fecha_creacion) VALUES
(1, NULL, 'admin', 'admin123', 'admin@isuj.edu.ec', 'ADMINISTRADOR', 'ACTIVO', 0, '2026-03-01 08:00:00'),
(2, NULL, 'coordinador', 'coord123', 'coordinacion@isuj.edu.ec', 'COORDINADOR', 'ACTIVO', 0, '2026-03-01 08:00:00'),
(3, NULL, 'secretaria', 'secre123', 'secretaria@isuj.edu.ec', 'COORDINADOR', 'ACTIVO', 0, '2026-03-01 08:00:00'),
(4, 1, 'invitado', 'invitado123', 'invitado@isuj.edu.ec', 'CONDULTA', 'ACTIVO', 0, '2026-03-01 08:00:00'),
(5, 1, 'mfajardo', 'docente1', 'mario.fajardo@isuj.edu.ec', 'DOCENTE', 'ACTIVO', 0, '2026-03-01 08:00:00');

-- PLANIFICACIONES Y HORARIOS REALES (1 a 9)
-- Plan 1: Gastronomía SAB 08:00 - 12:00 en Aula A2 (cap 35, 28 est)
INSERT OR IGNORE INTO planificacion_academica
(id_planificacion, id_sede, id_escuela, id_carrera, id_asignatura, id_docente, id_nivel, id_paralelo, id_jornada, id_bloque, id_aula_laboratorio, id_periodo, numero_estudiantes, curso_unificado, total_clases, observaciones, estado, usuario_registro)
VALUES (1, 1, 5, 6, 1, 1, 1, 1, 4, 1, 1, 1, 28, 0, 16, 'Plan regular sabatino Gastronomía', 'ACTIVO', 'admin');

INSERT OR IGNORE INTO horario (id_horario, id_planificacion, id_dia, hora_inicio, hora_fin, numero_horas, modalidad, estado)
VALUES (1, 1, 6, '08:00', '12:00', 4.0, 'PRESENCIAL', 'ACTIVO');

-- Plan 2: GTH SAB 13:00 - 17:00 en Aula A2 (cap 35, 25 est)
INSERT OR IGNORE INTO planificacion_academica
(id_planificacion, id_sede, id_escuela, id_carrera, id_asignatura, id_docente, id_nivel, id_paralelo, id_jornada, id_bloque, id_aula_laboratorio, id_periodo, numero_estudiantes, curso_unificado, total_clases, observaciones, estado, usuario_registro)
VALUES (2, 1, 6, 13, 2, 2, 4, 1, 4, 1, 1, 1, 25, 0, 16, 'Materia terminal GTH', 'ACTIVO', 'admin');

INSERT OR IGNORE INTO horario (id_horario, id_planificacion, id_dia, hora_inicio, hora_fin, numero_horas, modalidad, estado)
VALUES (2, 2, 6, '13:00', '17:00', 4.0, 'PRESENCIAL', 'ACTIVO');

-- Plan 3: Odontología LUN 08:00 - 11:00 en Aula A4 (cap 32, 22 est)
INSERT OR IGNORE INTO planificacion_academica
(id_planificacion, id_sede, id_escuela, id_carrera, id_asignatura, id_docente, id_nivel, id_paralelo, id_jornada, id_bloque, id_aula_laboratorio, id_periodo, numero_estudiantes, curso_unificado, total_clases, observaciones, estado, usuario_registro)
VALUES (3, 1, 4, 5, 9, 6, 3, 1, 1, 1, 3, 1, 22, 0, 16, 'Cirugía y Endodoncia Odontología', 'ACTIVO', 'admin');

INSERT OR IGNORE INTO horario (id_horario, id_planificacion, id_dia, hora_inicio, hora_fin, numero_horas, modalidad, estado)
VALUES (3, 3, 1, '08:00', '11:00', 3.0, 'PRESENCIAL', 'ACTIVO');

-- Plan 4: Curso Unificado Contabilidad General VIE 10:00 - 13:00 en Aula A4 (cap 32, 30 est)
INSERT OR IGNORE INTO planificacion_academica
(id_planificacion, id_sede, id_escuela, id_carrera, id_asignatura, id_docente, id_nivel, id_paralelo, id_jornada, id_bloque, id_aula_laboratorio, id_periodo, numero_estudiantes, curso_unificado, unificada_carrera, unificada_nivel, unificada_codigo, unificada_asignatura, total_clases, observaciones, estado, usuario_registro)
VALUES (4, 1, 6, 12, 10, 8, 1, 1, 1, 1, 3, 1, 30, 1, 'TECNOLOGIA SUPERIOR EN DESARROLLO DE SOFTWARE', 'NIVEL 1', 'SOF-101', 'FUNDAMENTOS DE CONTABILIDAD Y COSTOS', 16, 'Curso unificado con Desarrollo de Software y Marketing', 'ACTIVO', 'admin');

INSERT OR IGNORE INTO horario (id_horario, id_planificacion, id_dia, hora_inicio, hora_fin, numero_horas, modalidad, estado)
VALUES (4, 4, 5, '10:00', '13:00', 3.0, 'PRESENCIAL', 'ACTIVO');

-- Plan 5: Software - Sistemas Operativos VIE 08:00 - 10:00 en Aula A9 (cap 28, 26 est)
INSERT OR IGNORE INTO planificacion_academica
(id_planificacion, id_sede, id_escuela, id_carrera, id_asignatura, id_docente, id_nivel, id_paralelo, id_jornada, id_bloque, id_aula_laboratorio, id_periodo, numero_estudiantes, curso_unificado, total_clases, observaciones, estado, usuario_registro)
VALUES (5, 1, 1, 1, 53, 41, 2, 1, 1, 1, 8, 1, 26, 0, 16, 'Laboratorio práctico de Sistemas Operativos', 'ACTIVO', 'admin');

INSERT OR IGNORE INTO horario (id_horario, id_planificacion, id_dia, hora_inicio, hora_fin, numero_horas, modalidad, estado)
VALUES (5, 5, 5, '08:00', '10:00', 2.0, 'PRESENCIAL', 'ACTIVO');

-- Plan 6: Enfermería - Fisiopatología y Morfología VIE 11:00 - 14:00 en Aula A5 (cap 30, 28 est)
INSERT OR IGNORE INTO planificacion_academica
(id_planificacion, id_sede, id_escuela, id_carrera, id_asignatura, id_docente, id_nivel, id_paralelo, id_jornada, id_bloque, id_aula_laboratorio, id_periodo, numero_estudiantes, curso_unificado, total_clases, observaciones, estado, usuario_registro)
VALUES (6, 1, 4, 8, 24, 16, 2, 1, 1, 1, 4, 1, 28, 0, 16, 'Enfermería segundo nivel', 'ACTIVO', 'admin');

INSERT OR IGNORE INTO horario (id_horario, id_planificacion, id_dia, hora_inicio, hora_fin, numero_horas, modalidad, estado)
VALUES (6, 6, 5, '11:00', '14:00', 3.0, 'PRESENCIAL', 'ACTIVO');

-- Plan 7: Rehabilitación Física - Biomecánica MIE 09:00 - 12:00 en Aula B8 (cap 30, 24 est)
INSERT OR IGNORE INTO planificacion_academica
(id_planificacion, id_sede, id_escuela, id_carrera, id_asignatura, id_docente, id_nivel, id_paralelo, id_jornada, id_bloque, id_aula_laboratorio, id_periodo, numero_estudiantes, curso_unificado, total_clases, observaciones, estado, usuario_registro)
VALUES (7, 1, 4, 10, 65, 50, 3, 1, 1, 2, 16, 1, 24, 0, 16, 'Clase teórico-práctica con instrumental', 'ACTIVO', 'admin');

INSERT OR IGNORE INTO horario (id_horario, id_planificacion, id_dia, hora_inicio, hora_fin, numero_horas, modalidad, estado)
VALUES (7, 7, 3, '09:00', '12:00', 3.0, 'PRESENCIAL', 'ACTIVO');

-- Plan 8: Educación Inicial - Estimulación Temprana SAB 08:00 - 12:00 en Aula B4 (cap 35, 20 est)
INSERT OR IGNORE INTO planificacion_academica
(id_planificacion, id_sede, id_escuela, id_carrera, id_asignatura, id_docente, id_nivel, id_paralelo, id_jornada, id_bloque, id_aula_laboratorio, id_periodo, numero_estudiantes, curso_unificado, total_clases, observaciones, estado, usuario_registro)
VALUES (8, 1, 2, 2, 49, 46, 3, 1, 4, 2, 12, 1, 20, 0, 16, 'Taller de estimulación en aula infantil', 'ACTIVO', 'admin');

INSERT OR IGNORE INTO horario (id_horario, id_planificacion, id_dia, hora_inicio, hora_fin, numero_horas, modalidad, estado)
VALUES (8, 8, 6, '08:00', '12:00', 4.0, 'PRESENCIAL', 'ACTIVO');

-- Plan 9: Plan Gastronomía Regular LUN 08:00 - 12:00
INSERT OR IGNORE INTO planificacion_academica
(id_planificacion, id_sede, id_escuela, id_carrera, id_asignatura, id_docente, id_nivel, id_paralelo, id_jornada, id_bloque, id_aula_laboratorio, id_periodo, numero_estudiantes, curso_unificado, total_clases, observaciones, estado, usuario_registro)
VALUES (9, 1, 5, 6, 1, 1, 1, 1, 1, 1, 1, 1, 25, 0, 16, '', 'ACTIVO', 'admin');

INSERT OR IGNORE INTO horario (id_horario, id_planificacion, id_dia, hora_inicio, hora_fin, numero_horas, modalidad, estado)
VALUES (9, 9, 1, '08:00', '12:00', 4.0, 'PRESENCIAL', 'ACTIVO');
`;
