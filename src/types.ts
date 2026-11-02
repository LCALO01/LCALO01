export interface AulaLaboratorio {
  id_aula_laboratorio: number;
  id_bloque: number;
  bloque_codigo: string;
  bloque_nombre: string;
  sede_nombre: string;
  id_sede: number;
  codigo: string;
  nombre: string;
  tipo: 'AULA' | 'LABORATORIO' | 'COWORKING';
  capacidad: number;
  piso: number;
  recursos?: string;
  estado: 'DISPONIBLE' | 'OCUPADO' | 'MANTENIMIENTO' | 'INACTIVO';
  clases_activas_count?: number;
  total_estudiantes?: number;
  max_estudiantes?: number;
}

export interface PlanificacionCompleta {
  id_planificacion: number;
  id_sede: number;
  sede_codigo: string;
  sede_nombre: string;
  id_escuela: number;
  escuela_nombre: string;
  id_carrera: number;
  carrera_codigo: string;
  carrera_nombre: string;
  id_asignatura: number;
  asignatura_codigo: string;
  asignatura_nombre: string;
  asignatura_creditos: number;
  asignatura_horas_totales: number;
  id_docente: number;
  docente_ci: string;
  docente_nombres: string;
  docente_apellidos: string;
  docente_correo: string;
  id_nivel: number;
  nivel_nombre: string;
  id_paralelo: number;
  paralelo_codigo: string;
  id_jornada: number;
  jornada_codigo: string;
  jornada_nombre: string;
  id_bloque: number;
  bloque_codigo: string;
  bloque_nombre: string;
  id_aula_laboratorio: number;
  aula_codigo: string;
  aula_nombre: string;
  aula_tipo: string;
  aula_capacidad: number;
  aula_piso: number;
  aula_estado: string;
  id_periodo: number;
  periodo_codigo: string;
  periodo_nombre: string;
  numero_estudiantes: number;
  curso_unificado: number;
  unificada_carrera?: string;
  unificada_nivel?: string;
  unificada_codigo?: string;
  unificada_asignatura?: string;
  total_clases: number;
  observaciones?: string;
  estado: string;
  fecha_registro: string;
  usuario_registro?: string;

  // Horario
  id_horario?: number;
  id_dia?: number;
  dia_codigo?: string;
  dia_nombre?: string;
  hora_inicio?: string;
  hora_fin?: string;
  numero_horas?: number;
  modalidad?: string;
}

export interface Sede {
  id_sede: number;
  codigo: string;
  nombre: string;
  ciudad: string;
  provincia: string;
  direccion: string;
  telefono: string;
  correo: string;
  estado: string;
}

export interface Escuela {
  id_escuela: number;
  id_sede: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  estado: string;
}

export interface Carrera {
  id_carrera: number;
  id_escuela: number;
  codigo: string;
  nombre: string;
  titulo_otorgado: string;
  modalidad: string;
  duracion_niveles: number;
  numero_semanas?: number;
  estado: string;
}

export interface Asignatura {
  id_asignatura: number;
  codigo_asignatura: string;
  nombre: string;
  horas_docencia: number;
  horas_practicas: number;
  horas_autonomas: number;
  horas_totales: number;
  creditos: number;
  descripcion?: string;
  estado: string;
  id_carrera?: number;
  carrera_nombre?: string;
  carrera_codigo?: string;
}

export interface Docente {
  id_docente: number;
  ci: string;
  nombres: string;
  apellidos: string;
  correo: string;
  telefono?: string;
  titulo_academico?: string;
  especialidad?: string;
  tipo_contrato?: string;
  estado: string;
  id_carrera?: number;
  carrera_nombre?: string;
  carrera_codigo?: string;
}

export interface Nivel {
  id_nivel: number;
  numero: number;
  nombre: string;
  descripcion: string;
  estado: string;
}

export interface Paralelo {
  id_paralelo: number;
  codigo: string;
  descripcion: string;
  cupo_maximo: number;
  estado: string;
}

export interface Jornada {
  id_jornada: number;
  codigo: string;
  nombre: string;
  hora_inicio: string;
  hora_fin: string;
  estado: string;
}

export interface Hora {
  id_hora: number;
  codigo: string;
  nombre: string;
  hora_inicio: string;
  hora_fin: string;
  id_jornada?: number;
  jornada_nombre?: string;
  jornada_codigo?: string;
  orden?: number;
  estado: string;
}

export interface Bloque {
  id_bloque: number;
  id_sede: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  numero_pisos: number;
  estado: string;
  sede_nombre?: string;
  aulas_count?: number;
}

export interface PeriodoAcademico {
  id_periodo: number;
  codigo: string;
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  descripcion: string;
  estado: string;
}

export interface Feriado {
  id_feriado: number;
  codigo: string;
  nombre: string;
  desde: string;
  hasta: string;
  id_periodo?: number;
  descripcion: string;
  estado: string;
}

export type FeriadoNacional = Feriado;

export interface DiaSemana {
  id_dia: number;
  codigo: string;
  nombre: string;
  orden: number;
  es_laborable: number;
  estado: string;
}

export interface Usuario {
  id_usuario: number;
  id_docente: number | null;
  nombre_usuario: string;
  correo: string;
  rol: 'ADMINISTRADOR' | 'OPERADOR' | 'INVITADO' | 'COORDINADOR' | 'SECRETARIA' | 'DOCENTE';
  estado: string;
  intentos_fallidos: number;
  fecha_creacion: string;
  ultimo_acceso?: string;
  docente_nombre?: string;
}

export interface Catalogos {
  sedes: Sede[];
  escuelas: Escuela[];
  carreras: Carrera[];
  asignaturas: Asignatura[];
  docentes: Docente[];
  niveles: Nivel[];
  paralelos: Paralelo[];
  jornadas: Jornada[];
  bloques: Bloque[];
  periodos: PeriodoAcademico[];
  feriados: Feriado[];
  diasSemana: DiaSemana[];
  usuarios?: Usuario[];
  horas?: Hora[];
}

export type RoleType = 
  | 'SUPERADMIN' 
  | 'ADMINISTRADOR' 
  | 'COORDINADOR' 
  | 'DOCENTE'
  | 'OPERADOR'
  | 'AUDITOR'
  | 'CONDULTA'
  | 'CONSULTA'
  | 'INVITADO'
  | 'ESTUDIANTE' 
  | 'USUARIO_CONSULTA'
  | 'SECRETARIA';

export interface GrupoConfig {
  codigo: RoleType;
  nombre: string;
  emoji: string;
  colorName: string;
  badgeClass: string;
  borderClass: string;
  bgLightClass: string;
  textClass: string;
  cardBorderClass: string;
  cardHoverClass: string;
  descripcion: string;
  alcance: string;
  modulosPermitidos: string[];
}

export const GRUPOS_CANONICOS: Record<string, GrupoConfig> = {
  SUPERADMIN: {
    codigo: 'SUPERADMIN',
    nombre: 'Superadministrador',
    emoji: '🔴',
    colorName: 'Rojo Institucional',
    badgeClass: 'bg-red-50 text-red-700 border-red-300 font-black',
    borderClass: 'border-red-500',
    bgLightClass: 'bg-red-50',
    textClass: 'text-red-700',
    cardBorderClass: 'border-red-200 hover:border-red-400',
    cardHoverClass: 'hover:shadow-red-100',
    descripcion: 'Máxima autoridad técnica y de gobierno del sistema. Control total de usuarios, roles, permisos y bitácoras inmutables.',
    alcance: 'Gobierno global, gestión total de accesos, seguridad y auditoría inmutable.',
    modulosPermitidos: ['Catálogos', 'Docentes', 'Estudiantes', 'Planificación/Horarios', 'Usuarios', 'Roles/Permisos', 'Auditoría', 'Reportes']
  },
  ADMINISTRADOR: {
    codigo: 'ADMINISTRADOR',
    nombre: 'Administrador',
    emoji: '🟠',
    colorName: 'Naranja Institucional',
    badgeClass: 'bg-orange-50 text-orange-800 border-orange-300 font-black',
    borderClass: 'border-orange-500',
    bgLightClass: 'bg-orange-50',
    textClass: 'text-orange-800',
    cardBorderClass: 'border-orange-200 hover:border-orange-400',
    cardHoverClass: 'hover:shadow-orange-100',
    descripcion: 'Gestión operativa institucional completa: CRUD en catálogos, docentes, estudiantes, planificación, horarios y mantenimiento de usuarios.',
    alcance: 'Operación institucional transversal, emisión de horarios y altas de usuarios.',
    modulosPermitidos: ['Catálogos', 'Docentes', 'Estudiantes', 'Planificación/Horarios', 'Usuarios (Crear/Editar)', 'Auditoría', 'Reportes']
  },
  COORDINADOR: {
    codigo: 'COORDINADOR',
    nombre: 'Coordinador',
    emoji: '🟡',
    colorName: 'Amarillo / Ámbar',
    badgeClass: 'bg-amber-50 text-amber-900 border-amber-300 font-bold',
    borderClass: 'border-amber-500',
    bgLightClass: 'bg-amber-50',
    textClass: 'text-amber-900',
    cardBorderClass: 'border-amber-200 hover:border-amber-400',
    cardHoverClass: 'hover:shadow-amber-100',
    descripcion: 'Gestión curricular y directiva académica: configuración de planes de estudio, asignación docente y mallas horarias por carrera.',
    alcance: 'Planificación curricular, diseño de oferta académica y reportes oficiales.',
    modulosPermitidos: ['Catálogos', 'Docentes', 'Estudiantes', 'Planificación/Horarios', 'Reportes']
  },
  DOCENTE: {
    codigo: 'DOCENTE',
    nombre: 'Docente',
    emoji: '🔵',
    colorName: 'Azul Institucional',
    badgeClass: 'bg-blue-50 text-blue-900 border-blue-300 font-bold',
    borderClass: 'border-blue-500',
    bgLightClass: 'bg-blue-50',
    textClass: 'text-blue-900',
    cardBorderClass: 'border-blue-200 hover:border-blue-400',
    cardHoverClass: 'hover:shadow-blue-100',
    descripcion: 'Cuerpo docente institucional: consulta de asignaturas asignadas, listas de estudiantes de sus clases y su horario propio semanal.',
    alcance: 'Solo lo propio: asignaturas asignadas, horario individual y fichas de clase.',
    modulosPermitidos: ['Catálogos (Leer)', 'Docentes (Propio)', 'Estudiantes (Sus Clases)', 'Horario Personal', 'Reportes Propios']
  },
  OPERADOR: {
    codigo: 'OPERADOR',
    nombre: 'Operador',
    emoji: '🟢',
    colorName: 'Verde / Esmeralda',
    badgeClass: 'bg-emerald-50 text-emerald-900 border-emerald-300 font-bold',
    borderClass: 'border-emerald-500',
    bgLightClass: 'bg-emerald-50',
    textClass: 'text-emerald-900',
    cardBorderClass: 'border-emerald-200 hover:border-emerald-400',
    cardHoverClass: 'hover:shadow-emerald-100',
    descripcion: 'Operación técnica y física de infraestructura: monitoreo en tiempo real del semáforo de aulas, laboratorios y bloques asignados.',
    alcance: 'Aulas, laboratorios, monitoreo de ocupación física e inventario de espacios.',
    modulosPermitidos: ['Catálogos', 'Planificación (Aulas)', 'Horarios (Espacios)', 'Dashboard Infraestructura']
  },
  AUDITOR: {
    codigo: 'AUDITOR',
    nombre: 'Auditor',
    emoji: '🟣',
    colorName: 'Morado Institucional',
    badgeClass: 'bg-purple-50 text-purple-950 border-purple-300 font-bold',
    borderClass: 'border-purple-500',
    bgLightClass: 'bg-purple-50',
    textClass: 'text-purple-950',
    cardBorderClass: 'border-purple-200 hover:border-purple-400',
    cardHoverClass: 'hover:shadow-purple-100',
    descripcion: 'Supervisión de control interno y auditoría forense: acceso de solo lectura e inmutable a bitácoras de eventos, logs y reportes.',
    alcance: 'Trazabilidad inmutable de eventos, auditoría de cambios y supervisión de accesos.',
    modulosPermitidos: ['Bitácora de Auditoría', 'Reportes Institucionales', 'Catálogos (Lectura)', 'Planificación (Lectura)', 'Usuarios (Lectura)']
  },
  INVITADO: {
    codigo: 'INVITADO',
    nombre: 'Invitado',
    emoji: '⚪',
    colorName: 'Blanco / Neutro',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-300 font-bold',
    borderClass: 'border-slate-400',
    bgLightClass: 'bg-slate-100',
    textClass: 'text-slate-800',
    cardBorderClass: 'border-slate-200 hover:border-slate-400',
    cardHoverClass: 'hover:shadow-slate-100',
    descripcion: 'Acceso público y de transparencia: visualización básica de ofertas académicas y horarios aprobados sin privilegios de modificación.',
    alcance: 'Consulta pública y transparencia de horarios aprobados.',
    modulosPermitidos: ['Dashboard (Público)', 'Catálogos (Lectura)', 'Horarios Aprobados']
  },
  CONDULTA: {
    codigo: 'CONDULTA',
    nombre: 'Consulta Institucional',
    emoji: '🟤',
    colorName: 'Marrón / Bronce',
    badgeClass: 'bg-stone-100 text-stone-900 border-stone-400 font-bold',
    borderClass: 'border-stone-500',
    bgLightClass: 'bg-stone-100',
    textClass: 'text-stone-900',
    cardBorderClass: 'border-stone-300 hover:border-stone-500',
    cardHoverClass: 'hover:shadow-stone-100',
    descripcion: 'Consulta institucional especializada: lectura y exportación de mallas horarias y oferta sin privilegios de modificación.',
    alcance: 'Lectura y exportación de información académica oficial.',
    modulosPermitidos: ['Dashboard', 'Académico', 'Planificación', 'Horario', 'Asignación de Aulas', 'Reportes']
  }
};

export const getGrupoConfig = (rol: string): GrupoConfig => {
  const normalized = (rol || '').toUpperCase().trim();
  if (normalized === 'USUARIO_CONSULTA' || normalized === 'CONSULTA' || normalized === 'CONDULTA') return GRUPOS_CANONICOS['CONDULTA'];
  if (normalized === 'SISTEMAS' || normalized === 'ADMIN_TI') return GRUPOS_CANONICOS['SUPERADMIN'];
  if (normalized === 'ADMINISTRADOR DEL SISTEMA' || normalized === 'VICERRECTORADO_ACAD' || normalized === 'DIRECCION_ACAD') return GRUPOS_CANONICOS['ADMINISTRADOR'];
  if (normalized === 'COORDINACION ACADEMICA' || normalized === 'COORDINACION_ACAD') return GRUPOS_CANONICOS['COORDINADOR'];
  if (normalized === 'DOCENTES_TITULARES' || normalized === 'DOCENTES_OCASIONALES') return GRUPOS_CANONICOS['DOCENTE'];
  if (normalized === 'AUDITORIA') return GRUPOS_CANONICOS['AUDITOR'];
  if (normalized === 'INVITADOS') return GRUPOS_CANONICOS['INVITADO'];
  if (GRUPOS_CANONICOS[normalized]) return GRUPOS_CANONICOS[normalized];
  
  // Default fallback for legacy or custom roles
  return {
    codigo: normalized as RoleType,
    nombre: normalized.charAt(0) + normalized.slice(1).toLowerCase(),
    emoji: '🔵',
    colorName: 'Personalizado',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-300 font-medium',
    borderClass: 'border-slate-400',
    bgLightClass: 'bg-slate-50',
    textClass: 'text-slate-700',
    cardBorderClass: 'border-slate-200 hover:border-slate-400',
    cardHoverClass: 'hover:shadow-slate-100',
    descripcion: 'Perfil y grupo institucional asignado.',
    alcance: 'Acceso regulado según matriz de permisos.',
    modulosPermitidos: ['Catálogos']
  };
};

export interface SeguridadUser {
  id_usuario: number;
  id_docente: number | null;
  nombres: string;
  apellidos: string;
  username: string;
  email: string;
  telefono?: string;
  cargo?: string;
  estado: string;
  intentos_fallidos: number;
  ultimo_acceso?: string;
  fecha_creacion?: string;
  rol_nombre: RoleType;
  id_rol: number;
  docente_nombre?: string;
  custom_perms_count?: number;
  grupos?: GrupoSeguridad[];
  grupos_nombres?: string;
  grupos_ids?: string;
}

export interface GrupoSeguridad {
  id_grupo: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  emoji: string;
  color: string;
  id_rol_defecto: number | null;
  rol_defecto_nombre?: string;
  rol_defecto_emoji?: string;
  estado: 'ACTIVO' | 'INACTIVO';
  fecha_creacion?: string;
  total_usuarios?: number;
  usuarios?: {
    id_usuario: number;
    username: string;
    nombres: string;
    apellidos: string;
    email: string;
    cargo?: string;
    rol_nombre?: string;
    rol_emoji?: string;
  }[];
}

export interface ModuloSeguridadItem {
  id_modulo: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  icono: string;
  orden: number;
  estado: string;
}

export interface PermisoSeguridadItem {
  id_permiso: number;
  codigo: string;
  nombre: string;
  descripcion: string;
}

export interface ArquitecturaRBACData {
  usuarios: SeguridadUser[];
  grupos: GrupoSeguridad[];
  roles: {
    id_rol: number;
    nombre: RoleType;
    descripcion: string;
    emoji?: string;
    color?: string;
    estado: string;
    total_usuarios?: number;
  }[];
  permisos: PermisoSeguridadItem[];
  modulos: ModuloSeguridadItem[];
  stats: {
    totalUsuarios: number;
    totalGrupos: number;
    totalRoles: number;
    totalPermisos: number;
    totalModulos: number;
  };
}

export type SystemModule = 
  | 'catalogos'
  | 'docentes'
  | 'estudiantes'
  | 'planificacion_horarios'
  | 'usuarios'
  | 'roles_permisos'
  | 'auditoria'
  | 'reportes'
  // Compatibilidad con vistas preexistentes
  | 'dashboard'
  | 'seguridad'
  | 'academico'
  | 'planificacion'
  | 'horario'
  | 'asignacion_aulas';

export interface ModulePermissionRule {
  ver: boolean;
  crear: boolean;
  editar: boolean;
  eliminar: boolean;
  exportar?: boolean;
  bloquear?: boolean;
  administrar?: boolean;
  verPropio?: boolean; // Solo lo propio
  editarPropio?: boolean; // Solo lo propio (leer/actualizar)
  verClases?: boolean; // Solo los de sus clases (leer)
  soloSuCuenta?: boolean; // Solo su cuenta
  label: string; // Representación ejecutiva: "CRUD + exportar", "Crear/leer/actualizar/exportar", etc.
}

export const INSTITUTIONAL_RBAC_MATRIX: Record<RoleType, Record<SystemModule, ModulePermissionRule>> = {
  SUPERADMIN: {
    catalogos: { ver: true, crear: true, editar: true, eliminar: true, exportar: true, label: 'CRUD + exportar' },
    docentes: { ver: true, crear: true, editar: true, eliminar: true, exportar: true, label: 'CRUD + exportar' },
    estudiantes: { ver: true, crear: true, editar: true, eliminar: true, exportar: true, label: 'CRUD + exportar' },
    planificacion_horarios: { ver: true, crear: true, editar: true, eliminar: true, exportar: true, label: 'CRUD + exportar' },
    usuarios: { ver: true, crear: true, editar: true, eliminar: true, bloquear: true, administrar: true, exportar: true, label: 'Superadmin: todo + administrar' },
    roles_permisos: { ver: true, crear: true, editar: true, eliminar: true, administrar: true, label: 'Solo Superadmin (administrar)' },
    auditoria: { ver: true, crear: false, editar: false, eliminar: false, exportar: true, label: 'Leer/exportar' },
    reportes: { ver: true, crear: false, editar: false, eliminar: false, exportar: true, label: 'Leer/exportar' },
    // Aliases
    dashboard: { ver: true, crear: false, editar: false, eliminar: false, label: 'Ver' },
    seguridad: { ver: true, crear: true, editar: true, eliminar: true, bloquear: true, administrar: true, label: 'Ver, Crear, Editar, Eliminar, Administrar' },
    academico: { ver: true, crear: true, editar: true, eliminar: true, exportar: true, label: 'CRUD + exportar' },
    planificacion: { ver: true, crear: true, editar: true, eliminar: true, exportar: true, label: 'CRUD + exportar' },
    horario: { ver: true, crear: true, editar: true, eliminar: true, exportar: true, label: 'CRUD + exportar' },
    asignacion_aulas: { ver: true, crear: true, editar: true, eliminar: true, exportar: true, label: 'CRUD + exportar' },
  },
  ADMINISTRADOR: {
    catalogos: { ver: true, crear: true, editar: true, eliminar: true, exportar: true, label: 'CRUD + exportar' },
    docentes: { ver: true, crear: true, editar: true, eliminar: true, exportar: true, label: 'CRUD + exportar' },
    estudiantes: { ver: true, crear: true, editar: true, eliminar: true, exportar: true, label: 'CRUD + exportar' },
    planificacion_horarios: { ver: true, crear: true, editar: true, eliminar: true, exportar: true, label: 'CRUD + exportar' },
    usuarios: { ver: true, crear: true, editar: true, eliminar: false, bloquear: false, administrar: false, label: 'Admin: crear/leer/actualizar' },
    roles_permisos: { ver: false, crear: false, editar: false, eliminar: false, label: '—' },
    auditoria: { ver: true, crear: false, editar: false, eliminar: false, exportar: true, label: 'Leer/exportar' },
    reportes: { ver: true, crear: false, editar: false, eliminar: false, exportar: true, label: 'Leer/exportar' },
    // Aliases
    dashboard: { ver: true, crear: false, editar: false, eliminar: false, label: 'Ver' },
    seguridad: { ver: true, crear: true, editar: true, eliminar: false, bloquear: false, label: 'Crear, Leer, Actualizar' },
    academico: { ver: true, crear: true, editar: true, eliminar: true, exportar: true, label: 'CRUD + exportar' },
    planificacion: { ver: true, crear: true, editar: true, eliminar: true, exportar: true, label: 'CRUD + exportar' },
    horario: { ver: true, crear: true, editar: true, eliminar: true, exportar: true, label: 'CRUD + exportar' },
    asignacion_aulas: { ver: true, crear: true, editar: true, eliminar: true, exportar: true, label: 'CRUD + exportar' },
  },
  COORDINADOR: {
    catalogos: { ver: true, crear: true, editar: true, eliminar: false, exportar: true, label: 'Crear/leer/actualizar/exportar' },
    docentes: { ver: true, crear: true, editar: true, eliminar: false, exportar: true, label: 'Crear/leer/actualizar/exportar' },
    estudiantes: { ver: true, crear: true, editar: true, eliminar: false, exportar: true, label: 'Crear/leer/actualizar/exportar' },
    planificacion_horarios: { ver: true, crear: true, editar: true, eliminar: false, exportar: true, label: 'Crear/leer/actualizar/exportar' },
    usuarios: { ver: false, crear: false, editar: false, eliminar: false, label: 'Sin acceso' },
    roles_permisos: { ver: false, crear: false, editar: false, eliminar: false, label: '—' },
    auditoria: { ver: false, crear: false, editar: false, eliminar: false, label: '—' },
    reportes: { ver: true, crear: false, editar: false, eliminar: false, exportar: true, label: 'Leer/exportar' },
    // Aliases
    dashboard: { ver: true, crear: false, editar: false, eliminar: false, label: 'Ver' },
    seguridad: { ver: false, crear: false, editar: false, eliminar: false, label: 'Sin acceso' },
    academico: { ver: true, crear: true, editar: true, eliminar: false, exportar: true, label: 'Crear/leer/actualizar/exportar' },
    planificacion: { ver: true, crear: true, editar: true, eliminar: false, exportar: true, label: 'Crear/leer/actualizar/exportar' },
    horario: { ver: true, crear: true, editar: true, eliminar: false, exportar: true, label: 'Crear/leer/actualizar/exportar' },
    asignacion_aulas: { ver: true, crear: true, editar: true, eliminar: false, exportar: true, label: 'Crear/leer/actualizar/exportar' },
  },
  DOCENTE: {
    catalogos: { ver: true, crear: false, editar: false, eliminar: false, label: 'Leer' },
    docentes: { ver: true, crear: false, editar: false, eliminar: false, verPropio: true, editarPropio: true, label: 'Solo lo propio (leer/actualizar)' },
    estudiantes: { ver: true, crear: false, editar: false, eliminar: false, verClases: true, label: 'Solo los de sus clases (leer)' },
    planificacion_horarios: { ver: true, crear: false, editar: false, eliminar: false, verPropio: true, label: 'Solo lo propio' },
    usuarios: { ver: true, crear: false, editar: false, eliminar: false, soloSuCuenta: true, label: 'Solo su cuenta' },
    roles_permisos: { ver: false, crear: false, editar: false, eliminar: false, label: '—' },
    auditoria: { ver: false, crear: false, editar: false, eliminar: false, label: '—' },
    reportes: { ver: true, crear: false, editar: false, eliminar: false, verPropio: true, label: 'Solo los propios' },
    // Aliases
    dashboard: { ver: true, crear: false, editar: false, eliminar: false, label: 'Ver' },
    seguridad: { ver: false, crear: false, editar: false, eliminar: false, label: 'Sin acceso' },
    academico: { ver: true, crear: false, editar: false, eliminar: false, label: 'Leer' },
    planificacion: { ver: true, crear: false, editar: false, eliminar: false, verPropio: true, label: 'Solo lo propio' },
    horario: { ver: true, crear: false, editar: false, eliminar: false, verPropio: true, label: 'Solo lo propio' },
    asignacion_aulas: { ver: false, crear: false, editar: false, eliminar: false, label: '—' },
  },
  ESTUDIANTE: {
    catalogos: { ver: true, crear: false, editar: false, eliminar: false, label: 'Leer' },
    docentes: { ver: true, crear: false, editar: false, eliminar: false, label: 'Leer' },
    estudiantes: { ver: true, crear: false, editar: false, eliminar: false, verPropio: true, editarPropio: true, label: 'Solo lo propio (leer/actualizar)' },
    planificacion_horarios: { ver: true, crear: false, editar: false, eliminar: false, verPropio: true, label: 'Solo lo propio' },
    usuarios: { ver: true, crear: false, editar: false, eliminar: false, soloSuCuenta: true, label: 'Solo su cuenta' },
    roles_permisos: { ver: false, crear: false, editar: false, eliminar: false, label: '—' },
    auditoria: { ver: false, crear: false, editar: false, eliminar: false, label: '—' },
    reportes: { ver: true, crear: false, editar: false, eliminar: false, verPropio: true, label: 'Solo los propios' },
    // Aliases
    dashboard: { ver: true, crear: false, editar: false, eliminar: false, label: 'Ver' },
    seguridad: { ver: false, crear: false, editar: false, eliminar: false, label: 'Sin acceso' },
    academico: { ver: true, crear: false, editar: false, eliminar: false, label: 'Leer' },
    planificacion: { ver: true, crear: false, editar: false, eliminar: false, verPropio: true, label: 'Solo lo propio' },
    horario: { ver: true, crear: false, editar: false, eliminar: false, verPropio: true, label: 'Solo lo propio' },
    asignacion_aulas: { ver: false, crear: false, editar: false, eliminar: false, label: '—' },
  },
  USUARIO_CONSULTA: {
    catalogos: { ver: true, crear: false, editar: false, eliminar: false, label: 'Leer' },
    docentes: { ver: false, crear: false, editar: false, eliminar: false, label: 'Sin acceso' },
    estudiantes: { ver: false, crear: false, editar: false, eliminar: false, label: 'Sin acceso' },
    planificacion_horarios: { ver: true, crear: false, editar: false, eliminar: false, exportar: true, label: 'Leer (horarios también exportar)' },
    usuarios: { ver: true, crear: false, editar: false, eliminar: false, soloSuCuenta: true, label: 'Solo su cuenta' },
    roles_permisos: { ver: false, crear: false, editar: false, eliminar: false, label: '—' },
    auditoria: { ver: false, crear: false, editar: false, eliminar: false, label: '—' },
    reportes: { ver: true, crear: false, editar: false, eliminar: false, label: 'Leer' },
    // Aliases
    dashboard: { ver: true, crear: false, editar: false, eliminar: false, label: 'Ver' },
    seguridad: { ver: false, crear: false, editar: false, eliminar: false, label: 'Sin acceso' },
    academico: { ver: true, crear: false, editar: false, eliminar: false, label: 'Leer' },
    planificacion: { ver: true, crear: false, editar: false, eliminar: false, label: 'Leer' },
    horario: { ver: true, crear: false, editar: false, eliminar: false, exportar: true, label: 'Leer (exportar)' },
    asignacion_aulas: { ver: true, crear: false, editar: false, eliminar: false, label: 'Leer' },
  },
  SECRETARIA: {
    catalogos: { ver: true, crear: false, editar: true, eliminar: false, label: 'Leer, Actualizar' },
    docentes: { ver: true, crear: false, editar: false, eliminar: false, label: 'Leer' },
    estudiantes: { ver: true, crear: true, editar: true, eliminar: false, exportar: true, label: 'Crear/leer/actualizar/exportar' },
    planificacion_horarios: { ver: true, crear: true, editar: false, eliminar: false, label: 'Leer, Crear' },
    usuarios: { ver: false, crear: false, editar: false, eliminar: false, label: 'Sin acceso' },
    roles_permisos: { ver: false, crear: false, editar: false, eliminar: false, label: '—' },
    auditoria: { ver: false, crear: false, editar: false, eliminar: false, label: '—' },
    reportes: { ver: true, crear: false, editar: false, eliminar: false, label: 'Leer' },
    // Aliases
    dashboard: { ver: true, crear: false, editar: false, eliminar: false, label: 'Ver' },
    seguridad: { ver: false, crear: false, editar: false, eliminar: false, label: 'Sin acceso' },
    academico: { ver: true, crear: false, editar: true, eliminar: false, label: 'Ver, Editar' },
    planificacion: { ver: true, crear: true, editar: false, eliminar: false, label: 'Ver, Crear' },
    horario: { ver: true, crear: false, editar: false, eliminar: false, label: 'Ver' },
    asignacion_aulas: { ver: true, crear: false, editar: false, eliminar: false, label: 'Ver' },
  },
  OPERADOR: {
    catalogos: { ver: true, crear: false, editar: false, eliminar: false, label: 'Leer' },
    docentes: { ver: true, crear: false, editar: false, eliminar: false, label: 'Leer' },
    estudiantes: { ver: true, crear: false, editar: false, eliminar: false, label: 'Leer' },
    planificacion_horarios: { ver: true, crear: false, editar: true, eliminar: false, label: 'Leer, Editar' },
    usuarios: { ver: false, crear: false, editar: false, eliminar: false, label: 'Sin acceso' },
    roles_permisos: { ver: false, crear: false, editar: false, eliminar: false, label: '—' },
    auditoria: { ver: false, crear: false, editar: false, eliminar: false, label: '—' },
    reportes: { ver: true, crear: false, editar: false, eliminar: false, label: 'Leer' },
    // Aliases
    dashboard: { ver: true, crear: false, editar: false, eliminar: false, label: 'Ver' },
    seguridad: { ver: false, crear: false, editar: false, eliminar: false, label: 'Sin acceso' },
    academico: { ver: true, crear: false, editar: false, eliminar: false, label: 'Ver' },
    planificacion: { ver: true, crear: false, editar: true, eliminar: false, label: 'Ver, Editar' },
    horario: { ver: true, crear: false, editar: true, eliminar: false, label: 'Ver, Editar' },
    asignacion_aulas: { ver: true, crear: false, editar: true, eliminar: false, label: 'Ver, Editar' },
  },
  INVITADO: {
    catalogos: { ver: true, crear: false, editar: false, eliminar: false, label: 'Ver (público)' },
    docentes: { ver: false, crear: false, editar: false, eliminar: false, label: '✗' },
    estudiantes: { ver: false, crear: false, editar: false, eliminar: false, label: '✗' },
    planificacion_horarios: { ver: true, crear: false, editar: false, eliminar: false, label: 'Ver (público)' },
    usuarios: { ver: false, crear: false, editar: false, eliminar: false, label: '✗' },
    roles_permisos: { ver: false, crear: false, editar: false, eliminar: false, label: '✗' },
    auditoria: { ver: false, crear: false, editar: false, eliminar: false, label: '✗' },
    reportes: { ver: false, crear: false, editar: false, eliminar: false, label: '✗' },
    // Aliases
    dashboard: { ver: true, crear: false, editar: false, eliminar: false, label: 'Ver (público, limitado)' },
    seguridad: { ver: false, crear: false, editar: false, eliminar: false, label: '✗' },
    academico: { ver: true, crear: false, editar: false, eliminar: false, label: 'Ver' },
    planificacion: { ver: false, crear: false, editar: false, eliminar: false, label: '✗' },
    horario: { ver: true, crear: false, editar: false, eliminar: false, label: 'Ver (público)' },
    asignacion_aulas: { ver: false, crear: false, editar: false, eliminar: false, label: '✗' },
  },
  AUDITOR: {
    catalogos: { ver: true, crear: false, editar: false, eliminar: false, exportar: true, label: 'Supervisión (Leer/Exportar)' },
    docentes: { ver: true, crear: false, editar: false, eliminar: false, exportar: true, label: 'Supervisión (Leer/Exportar)' },
    estudiantes: { ver: true, crear: false, editar: false, eliminar: false, exportar: true, label: 'Supervisión (Leer/Exportar)' },
    planificacion_horarios: { ver: true, crear: false, editar: false, eliminar: false, exportar: true, label: 'Supervisión (Leer/Exportar)' },
    usuarios: { ver: true, crear: false, editar: false, eliminar: false, exportar: true, label: 'Supervisión (Leer/Exportar)' },
    roles_permisos: { ver: true, crear: false, editar: false, eliminar: false, label: 'Ver matriz' },
    auditoria: { ver: true, crear: false, editar: false, eliminar: false, exportar: true, label: 'Auditoría Completa (Leer/Exportar)' },
    reportes: { ver: true, crear: false, editar: false, eliminar: false, exportar: true, label: 'Reportes y Métricas (Leer/Exportar)' },
    // Aliases
    dashboard: { ver: true, crear: false, editar: false, eliminar: false, label: 'Ver' },
    seguridad: { ver: true, crear: false, editar: false, eliminar: false, label: 'Ver / Auditar' },
    academico: { ver: true, crear: false, editar: false, eliminar: false, exportar: true, label: 'Leer/Exportar' },
    planificacion: { ver: true, crear: false, editar: false, eliminar: false, exportar: true, label: 'Leer/Exportar' },
    horario: { ver: true, crear: false, editar: false, eliminar: false, exportar: true, label: 'Leer/Exportar' },
    asignacion_aulas: { ver: true, crear: false, editar: false, eliminar: false, exportar: true, label: 'Leer/Exportar' },
  },
  CONSULTA: {
    catalogos: { ver: true, crear: false, editar: false, eliminar: false, label: 'Leer' },
    docentes: { ver: false, crear: false, editar: false, eliminar: false, label: 'Sin acceso' },
    estudiantes: { ver: false, crear: false, editar: false, eliminar: false, label: 'Sin acceso' },
    planificacion_horarios: { ver: true, crear: false, editar: false, eliminar: false, exportar: true, label: 'Leer / Exportar Horarios' },
    usuarios: { ver: false, crear: false, editar: false, eliminar: false, label: 'Sin acceso' },
    roles_permisos: { ver: false, crear: false, editar: false, eliminar: false, label: '—' },
    auditoria: { ver: false, crear: false, editar: false, eliminar: false, label: '—' },
    reportes: { ver: true, crear: false, editar: false, eliminar: false, label: 'Leer' },
    // Aliases
    dashboard: { ver: true, crear: false, editar: false, eliminar: false, label: 'Ver' },
    seguridad: { ver: false, crear: false, editar: false, eliminar: false, label: 'Sin acceso' },
    academico: { ver: true, crear: false, editar: false, eliminar: false, label: 'Leer' },
    planificacion: { ver: true, crear: false, editar: false, eliminar: false, label: 'Leer' },
    horario: { ver: true, crear: false, editar: false, eliminar: false, exportar: true, label: 'Leer (exportar)' },
    asignacion_aulas: { ver: true, crear: false, editar: false, eliminar: false, label: 'Leer' },
  },
  CONDULTA: {
    catalogos: { ver: true, crear: false, editar: false, eliminar: false, label: 'Leer' },
    docentes: { ver: false, crear: false, editar: false, eliminar: false, label: 'Sin acceso' },
    estudiantes: { ver: false, crear: false, editar: false, eliminar: false, label: 'Sin acceso' },
    planificacion_horarios: { ver: true, crear: false, editar: false, eliminar: false, exportar: true, label: 'Leer / Exportar Horarios' },
    usuarios: { ver: false, crear: false, editar: false, eliminar: false, label: 'Sin acceso' },
    roles_permisos: { ver: false, crear: false, editar: false, eliminar: false, label: '—' },
    auditoria: { ver: false, crear: false, editar: false, eliminar: false, label: '—' },
    reportes: { ver: true, crear: false, editar: false, eliminar: false, label: 'Leer' },
    // Aliases
    dashboard: { ver: true, crear: false, editar: false, eliminar: false, label: 'Ver' },
    seguridad: { ver: false, crear: false, editar: false, eliminar: false, label: 'Sin acceso' },
    academico: { ver: true, crear: false, editar: false, eliminar: false, label: 'Leer' },
    planificacion: { ver: true, crear: false, editar: false, eliminar: false, label: 'Leer' },
    horario: { ver: true, crear: false, editar: false, eliminar: false, exportar: true, label: 'Leer (exportar)' },
    asignacion_aulas: { ver: true, crear: false, editar: false, eliminar: false, label: 'Leer' },
  },
};

export interface SubmoduloPermisoMatriz {
  id: string;
  categoriaId: string;
  moduloPadre: string;
  submodulo: string;
  descripcion: string;
  permisos: {
    SUPERADMIN: string;
    ADMINISTRADOR: string;
    COORDINADOR: string;
    DOCENTE: string;
    OPERADOR: string;
    AUDITOR: string;
    CONDULTA: string;
    INVITADO?: string;
    CONSULTA?: string;
  };
}

export const MATRIZ_PERMISOS_OFICIAL_6_ROLES: SubmoduloPermisoMatriz[] = [
  {
    id: '1_dashboard',
    categoriaId: '1. Dashboard',
    moduloPadre: 'Dashboard',
    submodulo: '1. Dashboard',
    descripcion: 'Métricas ejecutivas de ocupación, estado del campus, alertas y KPIs generales',
    permisos: {
      SUPERADMIN: 'CRUD total',
      ADMINISTRADOR: 'Ver (todos los indicadores)',
      COORDINADOR: 'Ver (su sede/escuela)',
      DOCENTE: 'Ver (su carga académica)',
      OPERADOR: 'Ver (infraestructura)',
      AUDITOR: 'Ver (auditoría)',
      CONDULTA: 'Ver (consulta)',
      INVITADO: 'Ver (público)',
      CONSULTA: 'Ver (consulta)'
    }
  },
  {
    id: '2_seguridad',
    categoriaId: '2. Seguridad',
    moduloPadre: 'Seguridad',
    submodulo: '2. Seguridad',
    descripcion: 'Administración de usuarios, grupos canónicos, roles y matriz granular de permisos',
    permisos: {
      SUPERADMIN: 'CRUD total + Gobierno',
      ADMINISTRADOR: 'Crear, Leer, Actualizar',
      COORDINADOR: '✗ Sin acceso',
      DOCENTE: '✗ Sin acceso',
      OPERADOR: '✗ Sin acceso',
      AUDITOR: 'Leer (auditoría)',
      CONDULTA: '✗ Sin acceso',
      INVITADO: '✗',
      CONSULTA: '✗'
    }
  },
  {
    id: '3_academico',
    categoriaId: '3. Académico',
    moduloPadre: 'Académico',
    submodulo: '3. Académico',
    descripcion: 'Sedes, facultades, escuelas, carreras, asignaturas, mallas curriculares y periodos',
    permisos: {
      SUPERADMIN: 'CRUD total',
      ADMINISTRADOR: 'CRUD total',
      COORDINADOR: 'Crear, Leer, Actualizar',
      DOCENTE: 'Leer (catálogos)',
      OPERADOR: 'Leer (catálogos)',
      AUDITOR: 'Leer / Supervisar',
      CONDULTA: 'Leer',
      INVITADO: 'Leer',
      CONSULTA: 'Leer'
    }
  },
  {
    id: '4_planificacion',
    categoriaId: '4. Planificación',
    moduloPadre: 'Planificación',
    submodulo: '4. Planificación',
    descripcion: 'Cargas docentes, distributivos académicos, paralelos y distribución horaria',
    permisos: {
      SUPERADMIN: 'CRUD total',
      ADMINISTRADOR: 'CRUD total',
      COORDINADOR: 'Crear, Leer, Actualizar',
      DOCENTE: 'Leer (su distributivo)',
      OPERADOR: 'Leer, Actualizar (operativo)',
      AUDITOR: 'Leer / Supervisar',
      CONDULTA: 'Leer',
      INVITADO: '✗',
      CONSULTA: 'Leer'
    }
  },
  {
    id: '5_horario',
    categoriaId: '5. Horario',
    moduloPadre: 'Horario',
    submodulo: '5. Horario',
    descripcion: 'Generación, publicación de grillas horarias semanales y algoritmo de cruces',
    permisos: {
      SUPERADMIN: 'CRUD total',
      ADMINISTRADOR: 'CRUD total',
      COORDINADOR: 'Crear, Leer, Actualizar',
      DOCENTE: 'Leer (su horario semanal)',
      OPERADOR: 'Leer, Actualizar (turnos)',
      AUDITOR: 'Leer / Supervisar',
      CONDULTA: 'Leer (exportar)',
      INVITADO: 'Leer (público)',
      CONSULTA: 'Leer (exportar)'
    }
  },
  {
    id: '6_asignacion_aulas',
    categoriaId: '6. Asignación de Aulas',
    moduloPadre: 'Asignación de Aulas',
    submodulo: '6. Asignación de Aulas',
    descripcion: 'Administración de espacios físicos, laboratorios, aforo y semáforo de disponibilidad',
    permisos: {
      SUPERADMIN: 'CRUD total',
      ADMINISTRADOR: 'CRUD total',
      COORDINADOR: 'Crear, Leer, Actualizar',
      DOCENTE: 'Leer (aulas asignadas)',
      OPERADOR: 'CRUD total',
      AUDITOR: 'Leer / Supervisar',
      CONDULTA: 'Leer',
      INVITADO: '✗',
      CONSULTA: 'Leer'
    }
  },
  {
    id: '7_reportes',
    categoriaId: '7. Reportes',
    moduloPadre: 'Reportes',
    submodulo: '7. Reportes',
    descripcion: 'Generación, exportación y descarga de informes oficiales, nóminas y horarios en Excel/PDF',
    permisos: {
      SUPERADMIN: 'Crear, Leer, Actualizar, Eliminar',
      ADMINISTRADOR: 'Crear, Leer, Actualizar, Eliminar',
      COORDINADOR: 'Crear, Leer (exportar)',
      DOCENTE: 'Leer (reporte propio)',
      OPERADOR: 'Leer (infraestructura)',
      AUDITOR: 'Leer (institucional/auditoría)',
      CONDULTA: 'Leer (reportes oficiales)',
      INVITADO: '✗',
      CONSULTA: 'Leer'
    }
  }
];

export const MATRIZ_PERMISOS_OFICIAL_7_ROLES = MATRIZ_PERMISOS_OFICIAL_6_ROLES;

export type CrudActionType = 'Crear' | 'Leer' | 'Actualizar' | 'Eliminar' | 'Exportar';

export interface PermisoCrudFila {
  id: string;
  categoriaId: string;
  moduloPadre: string;
  submodulo: string;
  accion: CrudActionType;
  permisos: {
    SUPERADMIN: string;
    ADMINISTRADOR: string;
    COORDINADOR: string;
    DOCENTE: string;
    OPERADOR: string;
    AUDITOR: string;
    CONDULTA: string;
    INVITADO?: string;
    CONSULTA?: string;
  };
  nota?: string;
}

export const MATRIZ_CRUD_ACCION_ROLES: PermisoCrudFila[] = [
  // 1. Dashboard
  {
    id: 'crud-1-dashboard-crear',
    categoriaId: '1. Dashboard',
    moduloPadre: 'Dashboard',
    submodulo: '1. Dashboard',
    accion: 'Crear',
    permisos: { SUPERADMIN: '✔', ADMINISTRADOR: '✘', COORDINADOR: '✘', DOCENTE: '✘', OPERADOR: '✘', AUDITOR: '✘', CONDULTA: '✘' }
  },
  {
    id: 'crud-1-dashboard-leer',
    categoriaId: '1. Dashboard',
    moduloPadre: 'Dashboard',
    submodulo: '1. Dashboard',
    accion: 'Leer',
    permisos: { SUPERADMIN: '✔', ADMINISTRADOR: '✔', COORDINADOR: '✔*', DOCENTE: '✔*', OPERADOR: '✔*', AUDITOR: '✔', CONDULTA: '✔*' },
    nota: '* Limitado a su ámbito (sede, infraestructura, carga o consulta)'
  },
  {
    id: 'crud-1-dashboard-actualizar',
    categoriaId: '1. Dashboard',
    moduloPadre: 'Dashboard',
    submodulo: '1. Dashboard',
    accion: 'Actualizar',
    permisos: { SUPERADMIN: '✔', ADMINISTRADOR: '✘', COORDINADOR: '✘', DOCENTE: '✘', OPERADOR: '✘', AUDITOR: '✘', CONDULTA: '✘' }
  },
  {
    id: 'crud-1-dashboard-eliminar',
    categoriaId: '1. Dashboard',
    moduloPadre: 'Dashboard',
    submodulo: '1. Dashboard',
    accion: 'Eliminar',
    permisos: { SUPERADMIN: '✔', ADMINISTRADOR: '✘', COORDINADOR: '✘', DOCENTE: '✘', OPERADOR: '✘', AUDITOR: '✘', CONDULTA: '✘' }
  },

  // 2. Seguridad
  {
    id: 'crud-2-seguridad-crear',
    categoriaId: '2. Seguridad',
    moduloPadre: 'Seguridad',
    submodulo: '2. Seguridad',
    accion: 'Crear',
    permisos: { SUPERADMIN: '✔', ADMINISTRADOR: '✔', COORDINADOR: '✘', DOCENTE: '✘', OPERADOR: '✘', AUDITOR: '✘', CONDULTA: '✘' }
  },
  {
    id: 'crud-2-seguridad-leer',
    categoriaId: '2. Seguridad',
    moduloPadre: 'Seguridad',
    submodulo: '2. Seguridad',
    accion: 'Leer',
    permisos: { SUPERADMIN: '✔', ADMINISTRADOR: '✔', COORDINADOR: '✘', DOCENTE: '✘', OPERADOR: '✘', AUDITOR: '✔', CONDULTA: '✘' }
  },
  {
    id: 'crud-2-seguridad-actualizar',
    categoriaId: '2. Seguridad',
    moduloPadre: 'Seguridad',
    submodulo: '2. Seguridad',
    accion: 'Actualizar',
    permisos: { SUPERADMIN: '✔', ADMINISTRADOR: '✔**', COORDINADOR: '✘', DOCENTE: '✘', OPERADOR: '✘', AUDITOR: '✘', CONDULTA: '✘' },
    nota: '** Excepto cuentas y privilegios de Superadministrador'
  },
  {
    id: 'crud-2-seguridad-eliminar',
    categoriaId: '2. Seguridad',
    moduloPadre: 'Seguridad',
    submodulo: '2. Seguridad',
    accion: 'Eliminar',
    permisos: { SUPERADMIN: '✔', ADMINISTRADOR: '✘', COORDINADOR: '✘', DOCENTE: '✘', OPERADOR: '✘', AUDITOR: '✘', CONDULTA: '✘' },
    nota: 'Exclusivo SUPERADMIN'
  },

  // 3. Académico
  {
    id: 'crud-3-academico-crear',
    categoriaId: '3. Académico',
    moduloPadre: 'Académico',
    submodulo: '3. Académico',
    accion: 'Crear',
    permisos: { SUPERADMIN: '✔', ADMINISTRADOR: '✔', COORDINADOR: '✔', DOCENTE: '✘', OPERADOR: '✘', AUDITOR: '✘', CONDULTA: '✘' }
  },
  {
    id: 'crud-3-academico-leer',
    categoriaId: '3. Académico',
    moduloPadre: 'Académico',
    submodulo: '3. Académico',
    accion: 'Leer',
    permisos: { SUPERADMIN: '✔', ADMINISTRADOR: '✔', COORDINADOR: '✔', DOCENTE: '✔', OPERADOR: '✔', AUDITOR: '✔', CONDULTA: '✔' }
  },
  {
    id: 'crud-3-academico-actualizar',
    categoriaId: '3. Académico',
    moduloPadre: 'Académico',
    submodulo: '3. Académico',
    accion: 'Actualizar',
    permisos: { SUPERADMIN: '✔', ADMINISTRADOR: '✔', COORDINADOR: '✔', DOCENTE: '✘', OPERADOR: '✘', AUDITOR: '✘', CONDULTA: '✘' }
  },
  {
    id: 'crud-3-academico-eliminar',
    categoriaId: '3. Académico',
    moduloPadre: 'Académico',
    submodulo: '3. Académico',
    accion: 'Eliminar',
    permisos: { SUPERADMIN: '✔', ADMINISTRADOR: '✔', COORDINADOR: '✘', DOCENTE: '✘', OPERADOR: '✘', AUDITOR: '✘', CONDULTA: '✘' }
  },

  // 4. Planificación
  {
    id: 'crud-4-planificacion-crear',
    categoriaId: '4. Planificación',
    moduloPadre: 'Planificación',
    submodulo: '4. Planificación',
    accion: 'Crear',
    permisos: { SUPERADMIN: '✔', ADMINISTRADOR: '✔', COORDINADOR: '✔', DOCENTE: '✘', OPERADOR: '✘', AUDITOR: '✘', CONDULTA: '✘' }
  },
  {
    id: 'crud-4-planificacion-leer',
    categoriaId: '4. Planificación',
    moduloPadre: 'Planificación',
    submodulo: '4. Planificación',
    accion: 'Leer',
    permisos: { SUPERADMIN: '✔', ADMINISTRADOR: '✔', COORDINADOR: '✔', DOCENTE: '✔*', OPERADOR: '✔', AUDITOR: '✔', CONDULTA: '✔' },
    nota: '* Docente: consulta de carga y distributivo asignado'
  },
  {
    id: 'crud-4-planificacion-actualizar',
    categoriaId: '4. Planificación',
    moduloPadre: 'Planificación',
    submodulo: '4. Planificación',
    accion: 'Actualizar',
    permisos: { SUPERADMIN: '✔', ADMINISTRADOR: '✔', COORDINADOR: '✔', DOCENTE: '✘', OPERADOR: '✔*', AUDITOR: '✘', CONDULTA: '✘' },
    nota: '* Operador: actualización de infraestructura en planificación'
  },
  {
    id: 'crud-4-planificacion-eliminar',
    categoriaId: '4. Planificación',
    moduloPadre: 'Planificación',
    submodulo: '4. Planificación',
    accion: 'Eliminar',
    permisos: { SUPERADMIN: '✔', ADMINISTRADOR: '✔', COORDINADOR: '✘', DOCENTE: '✘', OPERADOR: '✘', AUDITOR: '✘', CONDULTA: '✘' }
  },

  // 5. Horario
  {
    id: 'crud-5-horario-crear',
    categoriaId: '5. Horario',
    moduloPadre: 'Horario',
    submodulo: '5. Horario',
    accion: 'Crear',
    permisos: { SUPERADMIN: '✔', ADMINISTRADOR: '✔', COORDINADOR: '✔', DOCENTE: '✘', OPERADOR: '✘', AUDITOR: '✘', CONDULTA: '✘' }
  },
  {
    id: 'crud-5-horario-leer',
    categoriaId: '5. Horario',
    moduloPadre: 'Horario',
    submodulo: '5. Horario',
    accion: 'Leer',
    permisos: { SUPERADMIN: '✔', ADMINISTRADOR: '✔', COORDINADOR: '✔', DOCENTE: '✔*', OPERADOR: '✔', AUDITOR: '✔', CONDULTA: '✔' },
    nota: '* Docente: horario individual de clases y de cátedra'
  },
  {
    id: 'crud-5-horario-actualizar',
    categoriaId: '5. Horario',
    moduloPadre: 'Horario',
    submodulo: '5. Horario',
    accion: 'Actualizar',
    permisos: { SUPERADMIN: '✔', ADMINISTRADOR: '✔', COORDINADOR: '✔', DOCENTE: '✘', OPERADOR: '✔*', AUDITOR: '✘', CONDULTA: '✘' },
    nota: '* Operador: ajuste de turnos operativos en grillas'
  },
  {
    id: 'crud-5-horario-eliminar',
    categoriaId: '5. Horario',
    moduloPadre: 'Horario',
    submodulo: '5. Horario',
    accion: 'Eliminar',
    permisos: { SUPERADMIN: '✔', ADMINISTRADOR: '✔', COORDINADOR: '✘', DOCENTE: '✘', OPERADOR: '✘', AUDITOR: '✘', CONDULTA: '✘' }
  },

  // 6. Asignación de Aulas
  {
    id: 'crud-6-aulas-crear',
    categoriaId: '6. Asignación de Aulas',
    moduloPadre: 'Asignación de Aulas',
    submodulo: '6. Asignación de Aulas',
    accion: 'Crear',
    permisos: { SUPERADMIN: '✔', ADMINISTRADOR: '✔', COORDINADOR: '✔', DOCENTE: '✘', OPERADOR: '✔', AUDITOR: '✘', CONDULTA: '✘' }
  },
  {
    id: 'crud-6-aulas-leer',
    categoriaId: '6. Asignación de Aulas',
    moduloPadre: 'Asignación de Aulas',
    submodulo: '6. Asignación de Aulas',
    accion: 'Leer',
    permisos: { SUPERADMIN: '✔', ADMINISTRADOR: '✔', COORDINADOR: '✔', DOCENTE: '✔*', OPERADOR: '✔', AUDITOR: '✔', CONDULTA: '✔' },
    nota: '* Docente: consulta de aula asignada a sus materias'
  },
  {
    id: 'crud-6-aulas-actualizar',
    categoriaId: '6. Asignación de Aulas',
    moduloPadre: 'Asignación de Aulas',
    submodulo: '6. Asignación de Aulas',
    accion: 'Actualizar',
    permisos: { SUPERADMIN: '✔', ADMINISTRADOR: '✔', COORDINADOR: '✔', DOCENTE: '✘', OPERADOR: '✔', AUDITOR: '✘', CONDULTA: '✘' }
  },
  {
    id: 'crud-6-aulas-eliminar',
    categoriaId: '6. Asignación de Aulas',
    moduloPadre: 'Asignación de Aulas',
    submodulo: '6. Asignación de Aulas',
    accion: 'Eliminar',
    permisos: { SUPERADMIN: '✔', ADMINISTRADOR: '✔', COORDINADOR: '✘', DOCENTE: '✘', OPERADOR: '✔', AUDITOR: '✘', CONDULTA: '✘' }
  },

  // 7. Reportes
  {
    id: 'crud-7-reportes-crear',
    categoriaId: '7. Reportes',
    moduloPadre: 'Reportes',
    submodulo: '7. Reportes',
    accion: 'Crear',
    permisos: { SUPERADMIN: '✔', ADMINISTRADOR: '✔', COORDINADOR: '✔', DOCENTE: '✘', OPERADOR: '✘', AUDITOR: '✘', CONDULTA: '✘' }
  },
  {
    id: 'crud-7-reportes-leer',
    categoriaId: '7. Reportes',
    moduloPadre: 'Reportes',
    submodulo: '7. Reportes',
    accion: 'Leer',
    permisos: { SUPERADMIN: '✔', ADMINISTRADOR: '✔', COORDINADOR: '✔', DOCENTE: '✔*', OPERADOR: '✔', AUDITOR: '✔', CONDULTA: '✔*' },
    nota: '* Según alcance (institucional, sede, infraestructura o carga propia)'
  },
  {
    id: 'crud-7-reportes-actualizar',
    categoriaId: '7. Reportes',
    moduloPadre: 'Reportes',
    submodulo: '7. Reportes',
    accion: 'Actualizar',
    permisos: { SUPERADMIN: '✔', ADMINISTRADOR: '✔', COORDINADOR: '✘', DOCENTE: '✘', OPERADOR: '✘', AUDITOR: '✘', CONDULTA: '✘' }
  },
  {
    id: 'crud-7-reportes-eliminar',
    categoriaId: '7. Reportes',
    moduloPadre: 'Reportes',
    submodulo: '7. Reportes',
    accion: 'Eliminar',
    permisos: { SUPERADMIN: '✔', ADMINISTRADOR: '✔', COORDINADOR: '✘', DOCENTE: '✘', OPERADOR: '✘', AUDITOR: '✘', CONDULTA: '✘' }
  }
];

export interface UserPermissions {
  rol: RoleType;
  modules: Record<SystemModule, ModulePermissionRule>;
  canCreateAssignment: boolean;
  canEditAssignment: boolean;
  canDeleteAssignment: boolean;
  canChangeAulaStatus: boolean;
  canExportReports: boolean;
  canManageUsers: boolean;
  description: string;
}

export interface UserSession {
  id_usuario: number;
  id_docente?: number;
  nombre_usuario: string;
  correo: string;
  rol: RoleType;
  rolOriginal: string;
  docente_nombre?: string;
  permissions: UserPermissions;
}

export interface ValidationCrucesResult {
  valido: boolean;
  cruces: {
    conflictoAula: boolean;
    conflictoDocente: boolean;
    detallesAula?: PlanificacionCompleta;
    detallesDocente?: PlanificacionCompleta;
  };
  sobrecupo: boolean;
  capacidadAula: number;
  numeroEstudiantes: number;
  feriadosCount: number;
}

export interface AulaRecomendada {
  aula: AulaLaboratorio;
  capacidad: number;
  estudiantes: number;
  diferencia: number; // capacidad - estudiantes (>= 0)
  porcentajeOcupacion: number; // Math.round((estudiantes / capacidad) * 100)
  esDisponible: boolean;
  motivoNoDisponible?: string;
  esMismoBloque: boolean;
  esMismoPiso: boolean;
  nivelAjuste: 'EXACTO' | 'OPTIMO' | 'BUENO' | 'AMPLIO';
  ajusteTexto: string;
}

