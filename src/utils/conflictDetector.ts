import { PlanificacionCompleta } from '../types.ts';

export type TipoConflicto = 'DOCENTE_DOS_AULAS' | 'AULA_DOS_ASIGNATURAS';

export interface DetalleConflicto {
  tipo: TipoConflicto;
  titulo: string;
  descripcion: string;
  contraparteId: number;
  contraparte: PlanificacionCompleta;
  aulaNombreActual: string;
  aulaNombreContraparte: string;
  asignaturaActual: string;
  asignaturaContraparte: string;
  docenteActual: string;
  docenteContraparte: string;
  diaNombre: string;
  horarioSolapado: string;
}

export interface ConflictoRegistroInfo {
  tieneConflicto: boolean;
  conflictoDocente: boolean;
  conflictoAula: boolean;
  detalles: DetalleConflicto[];
  resumen: string;
}

export type ConflictoRegistro = ConflictoRegistroInfo;

export interface ResumenConflictosGlobal {
  totalRegistrosConConflicto: number;
  totalCrucesDocente: number;
  totalCrucesAula: number;
  registrosPorId: Record<number, ConflictoRegistroInfo>;
  listaParesConflictivos: Array<{
    tipo: TipoConflicto;
    registroA: PlanificacionCompleta;
    registroB: PlanificacionCompleta;
    descripcion: string;
  }>;
}

/**
 * Convierte un string de hora tipo "08:00", "08h00" o "8:30" a minutos desde medianoche
 */
export function timeToMinutes(timeStr?: string): number {
  if (!timeStr) return 0;
  const clean = timeStr.replace('h', ':').replace('H', ':').trim();
  const parts = clean.split(':');
  const h = parseInt(parts[0] || '0', 10);
  const m = parseInt(parts[1] || '0', 10);
  return (isNaN(h) ? 0 : h) * 60 + (isNaN(m) ? 0 : m);
}

/**
 * Determina si dos intervalos de horario se solapan en tiempo
 * (startA < endB && endA > startB)
 */
export function haySolapamientoHorario(
  startA?: string,
  endA?: string,
  startB?: string,
  endB?: string
): boolean {
  if (!startA || !endA || !startB || !endB) return false;
  const minStartA = timeToMinutes(startA);
  const minEndA = timeToMinutes(endA);
  const minStartB = timeToMinutes(startB);
  const minEndB = timeToMinutes(endB);

  return minStartA < minEndB && minEndA > minStartB;
}

/**
 * Comprueba si dos registros ocurren el mismo día de la semana
 */
export function mismoDiaSemana(p1: PlanificacionCompleta, p2: PlanificacionCompleta): boolean {
  if (p1.id_dia && p2.id_dia) {
    return p1.id_dia === p2.id_dia;
  }
  const dia1 = (p1.dia_nombre || p1.dia_codigo || '').toUpperCase().trim();
  const dia2 = (p2.dia_nombre || p2.dia_codigo || '').toUpperCase().trim();
  if (dia1 && dia2) {
    return dia1 === dia2 || dia1.includes(dia2) || dia2.includes(dia1);
  }
  return false;
}

/**
 * Analiza en tiempo real todo el listado de planificaciones y detecta:
 * 1. Docente asignado a dos aulas simultáneamente
 * 2. Misma aula asignada a dos asignaturas diferentes simultáneamente
 */
export function detectarConflictosPlanificacion(
  planificaciones: PlanificacionCompleta[]
): ResumenConflictosGlobal {
  const mapa: Record<number, ConflictoRegistroInfo> = {};
  const pares: Array<{
    tipo: TipoConflicto;
    registroA: PlanificacionCompleta;
    registroB: PlanificacionCompleta;
    descripcion: string;
  }> = [];

  // Inicializar mapa para todos los registros
  planificaciones.forEach(p => {
    mapa[p.id_planificacion] = {
      tieneConflicto: false,
      conflictoDocente: false,
      conflictoAula: false,
      detalles: [],
      resumen: ''
    };
  });

  const n = planificaciones.length;
  for (let i = 0; i < n; i++) {
    const p1 = planificaciones[i];
    if (p1.estado === 'CANCELADO' || p1.estado === 'INACTIVO') continue;

    for (let j = i + 1; j < n; j++) {
      const p2 = planificaciones[j];
      if (p2.estado === 'CANCELADO' || p2.estado === 'INACTIVO') continue;

      // Deben compartir el mismo día
      if (!mismoDiaSemana(p1, p2)) continue;

      // Deben solaparse en horario
      if (!haySolapamientoHorario(p1.hora_inicio, p1.hora_fin, p2.hora_inicio, p2.hora_fin)) {
        continue;
      }

      // Si ambos son exactamente cursos unificados compartidos de la misma sección, no es conflicto
      const sonUnificadosLegitimos =
        p1.curso_unificado === 1 &&
        p2.curso_unificado === 1 &&
        p1.id_aula_laboratorio === p2.id_aula_laboratorio &&
        p1.id_docente === p2.id_docente;

      if (sonUnificadosLegitimos) continue;

      const horarioDesc = `${p1.hora_inicio || '08:00'}-${p1.hora_fin || '12:00'} vs ${p2.hora_inicio || '08:00'}-${p2.hora_fin || '12:00'}`;
      const diaTxt = p1.dia_nombre || p2.dia_nombre || 'Día';
      const doc1 = `${p1.docente_nombres || ''} ${p1.docente_apellidos || ''}`.trim() || 'Docente 1';
      const doc2 = `${p2.docente_nombres || ''} ${p2.docente_apellidos || ''}`.trim() || 'Docente 2';
      const aula1 = p1.aula_codigo ? `Aula ${p1.aula_codigo}` : (p1.aula_nombre || 'Aula 1');
      const aula2 = p2.aula_codigo ? `Aula ${p2.aula_codigo}` : (p2.aula_nombre || 'Aula 2');
      const asig1 = p1.asignatura_nombre || 'Asignatura 1';
      const asig2 = p2.asignatura_nombre || 'Asignatura 2';

      // =======================================================================
      // CASO 1: Un docente es asignado a dos aulas simultáneamente
      // Mismo docente, solapamiento horario, asignado a aulas diferentes (o clases distintas en paralelo)
      // =======================================================================
      if (p1.id_docente && p2.id_docente && p1.id_docente === p2.id_docente) {
        if (p1.id_aula_laboratorio !== p2.id_aula_laboratorio || (!p1.curso_unificado && !p2.curso_unificado)) {
          const desc = `El docente ${doc1} está asignado simultáneamente a dos aulas (${aula1} y ${aula2}) el ${diaTxt} (${horarioDesc})`;

          // Registrar en p1
          mapa[p1.id_planificacion].tieneConflicto = true;
          mapa[p1.id_planificacion].conflictoDocente = true;
          mapa[p1.id_planificacion].detalles.push({
            tipo: 'DOCENTE_DOS_AULAS',
            titulo: 'Docente en dos aulas a la vez',
            descripcion: desc,
            contraparteId: p2.id_planificacion,
            contraparte: p2,
            aulaNombreActual: aula1,
            aulaNombreContraparte: aula2,
            asignaturaActual: asig1,
            asignaturaContraparte: asig2,
            docenteActual: doc1,
            docenteContraparte: doc2,
            diaNombre: diaTxt,
            horarioSolapado: horarioDesc
          });

          // Registrar en p2
          mapa[p2.id_planificacion].tieneConflicto = true;
          mapa[p2.id_planificacion].conflictoDocente = true;
          mapa[p2.id_planificacion].detalles.push({
            tipo: 'DOCENTE_DOS_AULAS',
            titulo: 'Docente en dos aulas a la vez',
            descripcion: desc,
            contraparteId: p1.id_planificacion,
            contraparte: p1,
            aulaNombreActual: aula2,
            aulaNombreContraparte: aula1,
            asignaturaActual: asig2,
            asignaturaContraparte: asig1,
            docenteActual: doc2,
            docenteContraparte: doc1,
            diaNombre: diaTxt,
            horarioSolapado: horarioDesc
          });

          pares.push({
            tipo: 'DOCENTE_DOS_AULAS',
            registroA: p1,
            registroB: p2,
            descripcion: desc
          });
        }
      }

      // =======================================================================
      // CASO 2: Una misma aula se asigna a dos asignaturas diferentes simultáneamente
      // Misma aula, solapamiento horario, asignaturas distintas (no unificadas)
      // =======================================================================
      if (p1.id_aula_laboratorio && p2.id_aula_laboratorio && p1.id_aula_laboratorio === p2.id_aula_laboratorio) {
        const sonDistintasAsignaturas = p1.id_asignatura !== p2.id_asignatura || p1.asignatura_codigo !== p2.asignatura_codigo;
        const noUnificadasCompartidas = !(p1.curso_unificado === 1 && p2.curso_unificado === 1);

        if (sonDistintasAsignaturas && noUnificadasCompartidas) {
          const desc = `El aula ${aula1} está asignada simultáneamente a dos asignaturas diferentes ("${asig1}" y "${asig2}") el ${diaTxt} (${horarioDesc})`;

          // Registrar en p1
          mapa[p1.id_planificacion].tieneConflicto = true;
          mapa[p1.id_planificacion].conflictoAula = true;
          mapa[p1.id_planificacion].detalles.push({
            tipo: 'AULA_DOS_ASIGNATURAS',
            titulo: 'Aula asignada a dos asignaturas',
            descripcion: desc,
            contraparteId: p2.id_planificacion,
            contraparte: p2,
            aulaNombreActual: aula1,
            aulaNombreContraparte: aula2,
            asignaturaActual: asig1,
            asignaturaContraparte: asig2,
            docenteActual: doc1,
            docenteContraparte: doc2,
            diaNombre: diaTxt,
            horarioSolapado: horarioDesc
          });

          // Registrar en p2
          mapa[p2.id_planificacion].tieneConflicto = true;
          mapa[p2.id_planificacion].conflictoAula = true;
          mapa[p2.id_planificacion].detalles.push({
            tipo: 'AULA_DOS_ASIGNATURAS',
            titulo: 'Aula asignada a dos asignaturas',
            descripcion: desc,
            contraparteId: p1.id_planificacion,
            contraparte: p1,
            aulaNombreActual: aula2,
            aulaNombreContraparte: aula1,
            asignaturaActual: asig2,
            asignaturaContraparte: asig1,
            docenteActual: doc2,
            docenteContraparte: doc1,
            diaNombre: diaTxt,
            horarioSolapado: horarioDesc
          });

          pares.push({
            tipo: 'AULA_DOS_ASIGNATURAS',
            registroA: p1,
            registroB: p2,
            descripcion: desc
          });
        }
      }
    }
  }

  // Generar resumen textual por registro
  let totalCrucesDocente = 0;
  let totalCrucesAula = 0;
  let totalRegistrosConConflicto = 0;

  Object.values(mapa).forEach(info => {
    if (info.tieneConflicto) {
      totalRegistrosConConflicto++;
      if (info.conflictoDocente) totalCrucesDocente++;
      if (info.conflictoAula) totalCrucesAula++;

      const res: string[] = [];
      if (info.conflictoDocente && info.conflictoAula) {
        res.push('Cruce de Docente en 2 aulas + Cruce de Aula en 2 asignaturas');
      } else if (info.conflictoDocente) {
        res.push('Docente en 2 aulas simultáneamente');
      } else if (info.conflictoAula) {
        res.push('Aula asignada a 2 asignaturas simultáneamente');
      }
      info.resumen = res.join(' • ');
    }
  });

  return {
    totalRegistrosConConflicto,
    totalCrucesDocente,
    totalCrucesAula,
    registrosPorId: mapa,
    listaParesConflictivos: pares
  };
}

/**
 * Valida en tiempo real los datos de un formulario de asignación contra la lista existente
 */
export function validarAsignacionEnTiempoReal(
  formulario: {
    id_aula_laboratorio: number;
    id_docente: number;
    id_asignatura: number;
    id_dia: number;
    hora_inicio: string;
    hora_fin: string;
    id_periodo?: number;
    excludePlanId?: number;
    curso_unificado?: number;
    unificada_codigo?: string;
  },
  planificaciones: PlanificacionCompleta[]
): {
  valido: boolean;
  conflictoDocente: boolean;
  conflictoAula: boolean;
  mensajeDocente?: string;
  mensajeAula?: string;
  planDocenteEnConflicto?: PlanificacionCompleta;
  planAulaEnConflicto?: PlanificacionCompleta;
} {
  let conflictoDocente = false;
  let conflictoAula = false;
  let mensajeDocente: string | undefined;
  let mensajeAula: string | undefined;
  let planDocenteEnConflicto: PlanificacionCompleta | undefined;
  let planAulaEnConflicto: PlanificacionCompleta | undefined;

  for (const p of planificaciones) {
    if (formulario.excludePlanId && p.id_planificacion === formulario.excludePlanId) continue;
    if (p.estado === 'CANCELADO' || p.estado === 'INACTIVO') continue;

    // Mismo día
    if (p.id_dia !== formulario.id_dia) continue;

    // Solapamiento de horario
    if (!haySolapamientoHorario(formulario.hora_inicio, formulario.hora_fin, p.hora_inicio, p.hora_fin)) {
      continue;
    }

    // Regla de unificadas: no es cruce si ambos son unificados y comparten aula y docente
    const sonUnificadosLegitimos =
      formulario.curso_unificado === 1 &&
      p.curso_unificado === 1 &&
      formulario.id_aula_laboratorio === p.id_aula_laboratorio &&
      formulario.id_docente === p.id_docente;

    if (sonUnificadosLegitimos) continue;

    const docNombre = `${p.docente_nombres || ''} ${p.docente_apellidos || ''}`.trim() || 'El docente';
    const aulaNombre = p.aula_codigo ? `Aula ${p.aula_codigo}` : (p.aula_nombre || 'El aula');
    const asigNombre = p.asignatura_nombre || 'otra asignatura';
    const horarioTxt = `${p.hora_inicio} a ${p.hora_fin}`;

    // Caso 1: Docente asignado a dos aulas simultáneamente
    if (p.id_docente === formulario.id_docente && p.id_aula_laboratorio !== formulario.id_aula_laboratorio) {
      conflictoDocente = true;
      planDocenteEnConflicto = p;
      mensajeDocente = `El docente ${docNombre} ya está asignado a ${aulaNombre} (${asigNombre}) de ${horarioTxt}.`;
    }

    // Caso 2: Misma aula asignada a dos asignaturas diferentes
    if (p.id_aula_laboratorio === formulario.id_aula_laboratorio && p.id_asignatura !== formulario.id_asignatura) {
      conflictoAula = true;
      planAulaEnConflicto = p;
      mensajeAula = `El aula ya está ocupada por "${asigNombre}" con ${docNombre} de ${horarioTxt}.`;
    }
  }

  return {
    valido: !conflictoDocente && !conflictoAula,
    conflictoDocente,
    conflictoAula,
    mensajeDocente,
    mensajeAula,
    planDocenteEnConflicto,
    planAulaEnConflicto
  };
}
