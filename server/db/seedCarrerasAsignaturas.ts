export interface CarreraSeed {
  id_carrera: number;
  id_escuela: number;
  codigo: string;
  nombre: string;
  titulo_otorgado: string;
  modalidad: string;
  duracion_niveles: number;
  numero_semanas: number;
  prefix: string;
  estado: string;
}

export interface AsignaturaSeed {
  id_asignatura: number;
  id_carrera: number;
  codigo_asignatura: string;
  nombre: string;
  descripcion: string;
  horas_docencia: number;
  horas_practicas: number;
  horas_autonomas: number;
  horas_totales: number;
  creditos: number;
  estado: string;
}

export const SEED_CARRERAS: CarreraSeed[] = [
  { id_carrera: 1,  id_escuela: 1, codigo: 'CAR-01', nombre: 'DESARROLLO DE SOFTWARE', titulo_otorgado: 'TECNÓLOGO SUPERIOR EN DESARROLLO DE SOFTWARE', modalidad: 'PRESENCIAL', duracion_niveles: 5, numero_semanas: 16, prefix: 'SOF', estado: 'ACTIVA' },
  { id_carrera: 2,  id_escuela: 2, codigo: 'CAR-02', nombre: 'EDUCACIÓN INICIAL', titulo_otorgado: 'TECNÓLOGO SUPERIOR EN EDUCACIÓN INICIAL', modalidad: 'PRESENCIAL', duracion_niveles: 5, numero_semanas: 16, prefix: 'EIN', estado: 'ACTIVA' },
  { id_carrera: 3,  id_escuela: 3, codigo: 'CAR-03', nombre: 'ELECTRICIDAD', titulo_otorgado: 'TECNÓLOGO SUPERIOR EN ELECTRICIDAD', modalidad: 'PRESENCIAL', duracion_niveles: 5, numero_semanas: 16, prefix: 'ELE', estado: 'ACTIVA' },
  { id_carrera: 4,  id_escuela: 2, codigo: 'CAR-04', nombre: 'ENTRENAMIENTO DEPORTIVO', titulo_otorgado: 'TECNÓLOGO SUPERIOR EN ENTRENAMIENTO DEPORTIVO', modalidad: 'PRESENCIAL', duracion_niveles: 5, numero_semanas: 16, prefix: 'DEP', estado: 'ACTIVA' },
  { id_carrera: 5,  id_escuela: 4, codigo: 'CAR-05', nombre: 'ODONTOLOGIA', titulo_otorgado: 'TECNÓLOGO SUPERIOR EN ODONTOLOGÍA', modalidad: 'PRESENCIAL', duracion_niveles: 6, numero_semanas: 16, prefix: 'ODO', estado: 'ACTIVA' },
  { id_carrera: 6,  id_escuela: 5, codigo: 'CAR-06', nombre: 'GASTRONOMIA', titulo_otorgado: 'TECNÓLOGO SUPERIOR EN GASTRONOMÍA', modalidad: 'PRESENCIAL', duracion_niveles: 5, numero_semanas: 16, prefix: 'GAS', estado: 'ACTIVA' },
  { id_carrera: 7,  id_escuela: 5, codigo: 'CAR-07', nombre: 'GASTRONOMIA UNIVERSITARIA', titulo_otorgado: 'LICENCIADO EN GASTRONOMÍA', modalidad: 'PRESENCIAL', duracion_niveles: 8, numero_semanas: 16, prefix: 'GASU', estado: 'ACTIVA' },
  { id_carrera: 8,  id_escuela: 4, codigo: 'CAR-08', nombre: 'ENFERMERÍA', titulo_otorgado: 'TECNÓLOGO SUPERIOR EN ENFERMERÍA', modalidad: 'PRESENCIAL', duracion_niveles: 5, numero_semanas: 16, prefix: 'ENF', estado: 'ACTIVA' },
  { id_carrera: 9,  id_escuela: 3, codigo: 'CAR-09', nombre: 'MECÁNICA AUTOMOTRIZ', titulo_otorgado: 'TECNÓLOGO SUPERIOR EN MECÁNICA AUTOMOTRIZ', modalidad: 'PRESENCIAL', duracion_niveles: 5, numero_semanas: 16, prefix: 'MEC', estado: 'ACTIVA' },
  { id_carrera: 10, id_escuela: 4, codigo: 'CAR-10', nombre: 'REHABILITACIÓN FÍSICA', titulo_otorgado: 'TECNÓLOGO SUPERIOR EN REHABILITACIÓN FÍSICA', modalidad: 'PRESENCIAL', duracion_niveles: 5, numero_semanas: 16, prefix: 'REF', estado: 'ACTIVA' },
  { id_carrera: 11, id_escuela: 6, codigo: 'CAR-11', nombre: 'CONTABILIDAD Y TRIBUTACIÓN', titulo_otorgado: 'TECNÓLOGO SUPERIOR EN CONTABILIDAD Y TRIBUTACIÓN', modalidad: 'PRESENCIAL', duracion_niveles: 5, numero_semanas: 16, prefix: 'CT', estado: 'ACTIVA' },
  { id_carrera: 12, id_escuela: 6, codigo: 'CAR-12', nombre: 'TECNOLOGIA SUPERIOR EN CONTABILIDAD', titulo_otorgado: 'TECNÓLOGO SUPERIOR EN CONTABILIDAD', modalidad: 'PRESENCIAL', duracion_niveles: 5, numero_semanas: 16, prefix: 'CONT', estado: 'ACTIVA' },
  { id_carrera: 13, id_escuela: 6, codigo: 'CAR-13', nombre: 'GESTIÓN DE TALENTO HUMANO', titulo_otorgado: 'TECNÓLOGO SUPERIOR EN GESTIÓN DE TALENTO HUMANO', modalidad: 'PRESENCIAL', duracion_niveles: 5, numero_semanas: 16, prefix: 'GTH', estado: 'ACTIVA' },
  { id_carrera: 14, id_escuela: 6, codigo: 'CAR-14', nombre: 'TECNOLOGIA SUPERIOR EN ADMINISTRACIÓN', titulo_otorgado: 'TECNÓLOGO SUPERIOR EN ADMINISTRACIÓN', modalidad: 'PRESENCIAL', duracion_niveles: 5, numero_semanas: 16, prefix: 'ADM', estado: 'ACTIVA' },
  { id_carrera: 15, id_escuela: 6, codigo: 'CAR-15', nombre: 'TECNOLOGIA SUPERIOR EN MARKETING', titulo_otorgado: 'TECNÓLOGO SUPERIOR EN MARKETING', modalidad: 'PRESENCIAL', duracion_niveles: 5, numero_semanas: 16, prefix: 'MKT', estado: 'ACTIVA' },
  { id_carrera: 16, id_escuela: 5, codigo: 'CAR-16', nombre: 'ESTETICA INTEGRAL', titulo_otorgado: 'TECNÓLOGO SUPERIOR EN ESTÉTICA INTEGRAL', modalidad: 'PRESENCIAL', duracion_niveles: 5, numero_semanas: 16, prefix: 'EST', estado: 'ACTIVA' },
  { id_carrera: 17, id_escuela: 5, codigo: 'CAR-17', nombre: 'ESTETICA INTEGRAL UNIVERSITARIA', titulo_otorgado: 'LICENCIADO EN ESTÉTICA INTEGRAL', modalidad: 'PRESENCIAL', duracion_niveles: 8, numero_semanas: 16, prefix: 'ESTU', estado: 'ACTIVA' }
];

export const RAW_ASIGNATURAS_POR_CARRERA: Record<string, string[]> = {
  'CONTABILIDAD Y TRIBUTACIÓN': [
    'ADMINISTRACION GENERAL',
    'CONTABILIDAD COMERCIAL',
    'CONTABILIDAD GENERAL',
    'MATEMATICA FINANCIERA',
    'NEURO-ORATORIA',
    'TIC PARA LA GESTIÓN CONTABLE'
  ],
  'DESARROLLO DE SOFTWARE': [
    'ANALISIS Y DISEÑO DE SISTEMAS',
    'APLICACION DISTRIBUIDAS',
    'APLICACIONES MOVILES I',
    'APLICACIONES MOVILES II',
    'APLICACIONES WEB I',
    'APLICACIONES WEB II',
    'AUDITORIA INFORMATICA',
    'BASE DE DATOS I',
    'BASE DE DATOS II',
    'COMUNICACION ORAL Y ESCRITA',
    'CONTABILIDAD GENERAL',
    'DESARROLLO DE PORTALES EMPRESARIALES O CORPORATIVOS',
    'DISEÑO Y GESTION DE PROYECTOS',
    'GESTION Y ADMINISTRACION DE REDES',
    'LENGUAJE DE PROGRAMACION I',
    'LENGUAJE DE PROGRAMACION II',
    'MATEMATICA DISCRETA',
    'METODOLOGIA DE DESARROLLO DE SOFTWARE',
    'METODOLOGÍA DE LA INVESTIGACIÓN',
    'PROGRAMACION ORIENTADA A OBJETOS I',
    'PROGRAMACION ORIENTADA A OBJETOS II',
    'REDES I',
    'SISTEMA OPERATIVO',
    'USABILIDAD Y ACCESIBILIDAD'
  ],
  'EDUCACIÓN INICIAL': [
    'COMUNICACIÓN ORAL Y ESCRITA',
    'DESARROLLO DEL PENSAMIENTO CIENTÍFICO DEL NIÑO',
    'DISEÑO, GESTION Y EVALUACION CURRICULAR',
    'EMPRENDIMIENTO Y TICS APLICADAS',
    'ESTIMULACIÓN TEMPRANA',
    'EVALUACIÓN INSTITUCIONAL DE LOGROS A NIVEL INICIAL Y PRIMER DE BÁSICA',
    'EXPRESIÓN PLÁSTICA Y PSICOMOTRICIDAD',
    'FUNDAMENTOS Y ESTATÉGIAS METODOLÓGICAS DE APRENDIZAJE SUBNIVEL II(3-6 AÑOS)',
    'FUNDAMENTOS Y ESTATÉGIAS METODOLÓGICAS DE APRENDIZAJE SUBNIVEL I(0-3 AÑOS)',
    'GERENCIA EDUCATIVA',
    'GESTION DE RECURSOS Y ESTRATEGIAS',
    'INICIACIÓN A LA PRE- LECTURY PRE- ESCRITURA',
    'INICIACIÓN A LAS OPERACIONES CONCRETAS / PRE-MATEMÁTICAS',
    'LITERATURA INFANTIL',
    'MODELOS Y PROCESOS DE INVESTIGACIÓN EDUCATIVA',
    'PEDAGOGÍA GENERAL Y CORRIENTES PEDAGÓGICAS',
    'PROBLEMAS EN EL DESARROLLO Y NECESIDADES EDUCATIVAS',
    'PSICOLOGÍA GENERAL Y EVOLUTIVA',
    'PSICOMOTRICIDAD Y EXPRESIÓN CORPORAL'
  ],
  'ELECTRICIDAD': [
    'ALTO VOLTAJE',
    'CIRCUITOS ELECTRICOS',
    'COMUNICACION ORAL Y ESCRITA',
    'CONTROL INDUSTRIAL',
    'DESARROLLO DE EMPRENDEDORES Y SOSTENIBILIDAD AMBIENTAL',
    'DESARROLLO DEL PENSAMIENTO Y BIENESTAR PSICOSOCIAL',
    'ELECTRICIDAD',
    'ELECTRONICA DE POTENCIA',
    'ELEMENTOS ELECTRICOS',
    'FISICA',
    'FUNDAMENTOS DE ELECTRICIDAD',
    'INSTALACIONES ELECTRICAS DE ALTO VOLTAJE',
    'INSTALACIONES ELECTRICAS DE MEDIO VOLTAJE',
    'LOGICA DIGITAL',
    'MAQUINAS ELECTRICAS I',
    'MAQUINAS ELECTRICAS II',
    'METODOLOGIA DE LA INVESTIGACION',
    'PLC\'S',
    'REDES ELECTRICAS',
    'SEGURIDAD INDUSTRIAL',
    'SISTEMAS DIGITALES',
    'SISTEMAS ELECTRICOS DE DISTRIBUCION',
    'TIC\'S'
  ],
  'ENFERMERÍA': [
    'ATENCION AL ADULTO MAYOR Y CUIDADOS PALEATIVOS',
    'BIOQUIMICA',
    'COMUNICACIÓN ORAL Y ESCRITA',
    'CUIDADOS BASICOS EN ENFERMERIA ONCOLOGICA',
    'DESARROLLO DE EMPRENDIMIENTO Y SOSTENIBILIDAD AMBEINTAL',
    'DIETETICA Y NUTRICION',
    'ENFERMERIA BASICA',
    'ENFERMERIA CLINICA',
    'ENFERMERIA EN ATENCION PRIMARIA EN SALUD',
    'ENFERMERIA EN SALUD PUBLICA',
    'ENFERMERIA EN URGENCIAS',
    'ENFERMERIA MATERNO INFANTIL',
    'ENFERMERIA OCUPACIONAL',
    'ENFERMERIA PEDIATRICA Y ADOLESCENTE',
    'ENFERMERIA QUIRURGICA',
    'ETICA Y BIOETICA',
    'FARMACOLOGIA APLICADA',
    'FISIOPATOLOGIA Y MORFOLOGIA',
    'METODOLOGIA DE INVESTIGACION',
    'MICROBIOLOGIA Y PARASITOLOGIA',
    'MORFOFISIOLOGIA',
    'OFIMATICA',
    'PSICOLOGIA DEL PACIENTE'
  ],
  'ENTRENAMIENTO DEPORTIVO': [
    'ANÁLISIS Y MEJORA DE LA TÉCNICA DEPORTIVA',
    'BIOMECÁNICA DEL MOVIMIENTO',
    'COACHING DEPORTIVO',
    'DESARROLLO DE EMPRENDIMIENTOS Y RESPONSABILIDAD SOCIAL',
    'ENTRENAMIENTO FUNCIONAL Y ACONDICIONAMIENTO FÍSICO',
    'ENTRENAMIENTO PARA POBLACIONES ESPECIALES',
    'EVALUACIÓN Y PRUEBAS DEPORTIVAS',
    'FUNDAMENTOS DEL ENTRENAMIENTO DEPORTIVO',
    'PLANIFICACIÓN ESPECIALIZADA DEL ENTRENAMIENTO',
    'PLANIFICACIÓN Y PROGRAMACIÓN DEL ENTRENAMIENTO',
    'PRIMEROS AUXILIOS Y PREVENCIÓN DE LESIONES',
    'REHABILITACIÓN DE LESIONES DEPORTIVAS',
    'TÉCNICAS Y MÉTODOS DE ENTRENAMIENTO DEPORTIVO'
  ],
  'ESTETICA INTEGRAL': [
    'ADMINISTRACION DE CENTROS DE ESTETICA',
    'ANATOMOFISIOLOGIA Y DERMATOLOGIA',
    'APARATOLOGIA ESTETICA',
    'BIOSEGURIDAD Y ESTERILIZACION',
    'COSMETOLOGIA Y QUIMICA COSMETICA',
    'COSMIATRIA CORPORAL',
    'COSMIATRIA FACIAL',
    'DIETETICA Y NUTRICION',
    'DRENAJE LINFATICO MANUAL',
    'ESTADISTICA DESCRIPTIVA',
    'ETICA Y BIOETICA',
    'MASAJE I',
    'MASAJE II',
    'OFIMATICA',
    'PRIMEROS AUXILIOS',
    'TECNICA PRE-POST QUIRURGICA',
    'TERAPIAS COMPLEMENTARIAS'
  ],
  'ESTETICA INTEGRAL UNIVERSITARIA': [
    'ADMINISTRACION Y GESTION DE SPAS Y CENTROS ESTETICOS',
    'BIOESTADISTICA APLICADA A LA SALUD ESTETICA',
    'BIOSEGURIDAD Y PROTOCOLOS CLINICOS',
    'DERMATOLOGIA Y LESIONES CUTANEAS',
    'DIETOTERAPIA Y ASESORIA NUTRICIONAL',
    'METODOLOGIA DE LA INVESTIGACION EN ESTETICA',
    'QUIMICA COSMETICA AVANZADA',
    'TERAPIAS PRE Y POST QUIRURGICAS AVANZADAS'
  ],
  'GASTRONOMIA': [
    'ADMINISTRACION DE ALIMENTOS Y BEBIDAS',
    'COCINA CREATIVA',
    'COCINA EUROPEA Y ASIATICA',
    'COCINA LATINOAMERICANA',
    'COCINA NACIONAL',
    'COCTELERIA Y ENOLOGIA',
    'CONTABILIDAD BASICA',
    'DIETETICA Y NUTRICION',
    'MATEMATICA FINANCIERA',
    'OFIMATICA',
    'PANADERIA',
    'PASTELERIA Y REPOSTERIA',
    'PRESUPUESTOS',
    'SEGURIDAD E HIGIENE EN LA COCINA',
    'TECNICAS DE BARES Y RESTAURANTES',
    'TECNICAS DE COMUNICACION Y MARKETING'
  ],
  'GASTRONOMIA UNIVERSITARIA': [
    'DISEÑO DE MENÚS',
    'HISTORIA DE LA GASTRONOMIA',
    'MATEMATICA FINANCIERA',
    'SEGURIDAD E HIGIENE ALIMENTARIA',
    'TECNICAS CULINARIAS BASICAS'
  ],
  'GESTIÓN DE TALENTO HUMANO': [
    'BIENESTAR Y COMPENSACIÓN EN EL TRABAJO',
    'COACHING Y PROGRAMACIÓN NEUROLINGUISTICA',
    'DESARROLLO HUMANO',
    'EMPRENDIMIENTO Y RESPONSABILIDAD SOCIAL',
    'ETICA PROFESIONAL Y VALORES',
    'EVALUACIÓN DEL DESEMPEÑO LABORAL',
    'GESTIÓN INTEGRAL DEL TALENTO HUMANO',
    'GESTIÓN PRESUPUESTARIA',
    'LEGISLACIÓN LABORAL Y EMPRESARIAL',
    'SEGURIDAD, SALUD OCUPACIONAL Y ERGONOMÍA'
  ],
  'MECÁNICA AUTOMOTRIZ': [
    'ALGEBRA',
    'ANALISIS MATEMATICO',
    'AUTOTRONICA',
    'ELECTRICIDAD AUTOMOTRIZ',
    'ELECTRONICA AUTOMOTRIZ',
    'ESTRUCTURAS Y ACABADOS AUTOMOTRICES',
    'FISICA',
    'LENGUAJE Y COMUNICACION',
    'MANTENIMIENTO Y REPARACION DE MOTORES',
    'MECANICA DE MATERIALES',
    'MECANICA DE PATIO',
    'METODOLOGIA A LA INVESTIGACION',
    'METROLOGIA',
    'MOTORES DE COMBUSTION INTERNA',
    'NUEVAS TECNOLOGIAS',
    'OFIMATICA Y DIBUJO ASISTIDO POR COMPUTADOR',
    'SISTEMA DE INYECCION A GASOLINA Y DIESEL',
    'SOFTWARE AUTOMOTRIZ',
    'TRANSMISIONES AUTOMATICAS',
    'TREN DE RODAJE'
  ],
  'ODONTOLOGIA': [
    'ANATOMOFISIOLOGIA ODONTOLOGICA',
    'ASISTENCIA CLINICA POR ESPECIALIDAD',
    'BIOSEGURIDAD Y ESTERILIZACION',
    'CIRUGIA Y ENDODONCIA I',
    'CIRUGIA Y ENDODONCIA II',
    'COMUNICACION ORAL Y ESCRITA',
    'ESTRUCTURA Y FUNCION DEL SISTEMA ESTOMATOGNATICO',
    'ETICA Y BIOETICA',
    'MANEJO DE EQUIPOS E INSTRUMENTAL ODONTOLOGICO',
    'MICROBIOLOGIA ORAL E INFECTOLOGIA',
    'ODONTOPEDIATRIA',
    'OFIMATICA',
    'ORTODONCIA',
    'PATOLOGIA BUCODENTAL',
    'PERIODONCIA',
    'RADIOLOGIA DENTAL'
  ],
  'REHABILITACIÓN FÍSICA': [
    'COMUNICACION ORAL Y ESCRITA',
    'DESARROLLO DE EMPRENDIMIENTO Y SOSTENIBILIDAD AMBIENTAL',
    'EJERCICIOS FISIOTERAPEUTICOS',
    'ETICA Y BIOETICA',
    'EVALUACION TERAPEUTICA INICIAL',
    'FARMACOLOGIA APLICADA A LA REHABILITACION FISICA',
    'FISIOTERAPIA TECNICA Y NEUROLOGIA',
    'FUNDAMENTOS DE REHABILITACION FISICA',
    'KINESIOLOGIA I',
    'KINESIOLOGIA II',
    'MASAJE TERAPEUTICO I',
    'MASAJE TERAPEUTICO II',
    'MEDIOS DE DIAGNOSTICO Y EVALUACION FUNCIONAL',
    'MORFOFISIOLOGIA',
    'NUTRICION',
    'PSICOLOGIA APLICADA A LA REHABILITACION',
    'REHABILITACION CARDIORESPIRATORIA',
    'REHABILITACION DEPORTIVA',
    'REHABILITACION FISICA EN TRAUMATOLOGIA Y ORTOPEDIA',
    'REHABILITACION FISICA INFANTIL Y GERIATRICA',
    'REHABILITACION NEUROLOGICA'
  ],
  'TECNOLOGIA SUPERIOR EN ADMINISTRACIÓN': [
    'ADMINISTRACION ESTRATEGICA',
    'ADMINISTRACION FINANCIERA',
    'ADMINISTRACION I',
    'CONTABILIDAD DE COSTOS',
    'CONTABILIDAD GENERAL',
    'CREATIVIDAD E INNOVACION EMPRESARIAL',
    'EMPRENDIMIENTO Y RESPONSABILIDAD SOCIAL',
    'ESTADISTICA',
    'GESTION DEL TALENTO HUMANO',
    'IDENTIDAD E IMAGEN CORPORATIVA',
    'INVESTIGACION DE MERCADO',
    'INVESTIGACION OPERATIVA',
    'LEGISLACION EMPRESARIAL',
    'LEGISLACION TRIBUTARIA',
    'MACROECONOMIA',
    'MARKETING',
    'MICROENOMIA',
    'REDACCION CIENTIFICA',
    'SIMULACION DE NEGOCIOS'
  ],
  'TECNOLOGIA SUPERIOR EN CONTABILIDAD': [
    'CONTABILIDAD GUBERNAMENTAL',
    'CONTABILIDAD SUPERIOR I - NIIF I',
    'CONTABILIDAD SUPERIOR II NIIF II',
    'EMPRENDIMIENTO',
    'FINANZAS',
    'LEGISLACION LABORAL',
    'METODOLOGIA A LA INVESTIGACION',
    'PRESUPUESTOS',
    'REALIDAD NACIONAL',
    'SOFTWARE CONTABLE'
  ],
  'TECNOLOGIA SUPERIOR EN MARKETING': [
    'CONTABILIDAD GENERAL',
    'ETICA PROFESIONAL Y VALORES',
    'FUNDAMENTOS DE MARKETING',
    'INVESTIGACION DE MERCADO',
    'MARKETING ESTRATEGICO',
    'MATEMATICA APLICADA',
    'NEUROMARKETING',
    'OFIMATICA',
    'SOCIAL MEDIA Y COMMUNITY MANANGER',
    'TECNICAS PUBLICITARIAS',
    'TECNOLOGIAS DE DISEÑO',
    'TECNOLOGIAS DEL DISEÑO'
  ]
};

export function buildSeedAsignaturas(): AsignaturaSeed[] {
  const result: AsignaturaSeed[] = [];
  let currentId = 1;

  for (const carrera of SEED_CARRERAS) {
    const list = RAW_ASIGNATURAS_POR_CARRERA[carrera.nombre] || [];
    let idx = 1;
    for (const nombre of list) {
      const codeNum = 100 + idx;
      const codigo = `${carrera.prefix}_${codeNum}`;
      result.push({
        id_asignatura: currentId,
        id_carrera: carrera.id_carrera,
        codigo_asignatura: codigo,
        nombre,
        descripcion: `Asignatura de formación profesional para la carrera de ${carrera.nombre}`,
        horas_docencia: 64,
        horas_practicas: 32,
        horas_autonomas: 44,
        horas_totales: 140,
        creditos: 3.0,
        estado: 'ACTIVA'
      });
      currentId++;
      idx++;
    }
  }

  return result;
}

export function seedCarrerasAsignaturas(db: any): void {
  try {
    db.run('CREATE TABLE IF NOT EXISTS carrera_asignatura (id_carrera INTEGER NOT NULL, id_asignatura INTEGER NOT NULL, PRIMARY KEY (id_carrera, id_asignatura));');
    db.run('DELETE FROM carrera_asignatura;');
    db.run('DELETE FROM asignatura;');
    db.run('DELETE FROM carrera;');

    // Insertar Carreras
    const insertCarrera = db.prepare('INSERT INTO carrera (id_carrera, id_escuela, codigo, nombre, titulo_otorgado, modalidad, duracion_niveles, numero_semanas, estado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
    for (const c of SEED_CARRERAS) {
      insertCarrera.run([c.id_carrera, c.id_escuela, c.codigo, c.nombre, c.titulo_otorgado, c.modalidad, c.duracion_niveles, c.numero_semanas, c.estado]);
    }
    insertCarrera.free();

    // Insertar Asignaturas y Enlaces
    const asignaturas = buildSeedAsignaturas();
    const insertAsig = db.prepare('INSERT INTO asignatura (id_asignatura, codigo_asignatura, nombre, descripcion, horas_docencia, horas_practicas, horas_autonomas, horas_totales, creditos, estado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    const insertCarrAsig = db.prepare('INSERT INTO carrera_asignatura (id_carrera, id_asignatura) VALUES (?, ?)');

    for (const a of asignaturas) {
      insertAsig.run([
        a.id_asignatura,
        a.codigo_asignatura,
        a.nombre,
        a.descripcion,
        a.horas_docencia,
        a.horas_practicas,
        a.horas_autonomas,
        a.horas_totales,
        a.creditos,
        a.estado
      ]);
      insertCarrAsig.run([a.id_carrera, a.id_asignatura]);
    }
    insertAsig.free();
    insertCarrAsig.free();

    // Actualizar planificaciones académicas existentes con asignaturas y carreras válidas
    try {
      db.run("UPDATE planificacion_academica SET id_carrera = 6, id_escuela = 5, id_asignatura = (SELECT id_asignatura FROM asignatura WHERE codigo_asignatura = 'GAS_101') WHERE id_planificacion = 1;");
      db.run("UPDATE planificacion_academica SET id_carrera = 13, id_escuela = 6, id_asignatura = (SELECT id_asignatura FROM asignatura WHERE codigo_asignatura = 'GTH_101') WHERE id_planificacion = 2;");
      db.run("UPDATE planificacion_academica SET id_carrera = 5, id_escuela = 4, id_asignatura = (SELECT id_asignatura FROM asignatura WHERE codigo_asignatura = 'ODO_104') WHERE id_planificacion = 3;");
      db.run("UPDATE planificacion_academica SET id_carrera = 12, id_escuela = 6, id_asignatura = (SELECT id_asignatura FROM asignatura WHERE codigo_asignatura = 'CONT_102') WHERE id_planificacion = 4;");
      db.run("UPDATE planificacion_academica SET id_carrera = 1, id_escuela = 1, id_asignatura = (SELECT id_asignatura FROM asignatura WHERE codigo_asignatura = 'SOF_123') WHERE id_planificacion = 5;");
      db.run("UPDATE planificacion_academica SET id_carrera = 8, id_escuela = 4, id_asignatura = (SELECT id_asignatura FROM asignatura WHERE codigo_asignatura = 'ENF_118') WHERE id_planificacion = 6;");
      db.run("UPDATE planificacion_academica SET id_carrera = 10, id_escuela = 4, id_asignatura = (SELECT id_asignatura FROM asignatura WHERE codigo_asignatura = 'REF_109') WHERE id_planificacion = 7;");
      db.run("UPDATE planificacion_academica SET id_carrera = 2, id_escuela = 2, id_asignatura = (SELECT id_asignatura FROM asignatura WHERE codigo_asignatura = 'EIN_105') WHERE id_planificacion = 8;");
      db.run("UPDATE planificacion_academica SET id_carrera = 6, id_escuela = 5, id_asignatura = (SELECT id_asignatura FROM asignatura WHERE codigo_asignatura = 'GAS_105') WHERE id_planificacion = 9;");
    } catch (_) {}

  } catch (err) {
    console.error('Error al poblar carreras y asignaturas oficiales:', err);
  }
}
