import { AulaLaboratorio, AulaRecomendada } from '../types.ts';

// Reproductor de alerta sonora para alertas de aforo y sobrecupo
export function playCapacityAlertSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(420, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.35);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch (e) {
    // Ignorar si el navegador bloquea audio sin interacción previa
  }
}

export interface EvaluacionCapacidadResultado {
  esInsuficiente: boolean; // capacidad < numeroEstudiantes (NO PERMITIR INGRESO)
  esExcesiva: boolean; // capacidad > numeroEstudiantes (SUBUTILIZACIÓN - RECOMENDAR AULAS)
  capacidad: number;
  numeroEstudiantes: number;
  diferencia: number; // capacidad - numeroEstudiantes
  porcentajeOcupacion: number; // Math.round((numeroEstudiantes / capacidad) * 100)
  aulasRecomendadas: AulaRecomendada[];
  mensajeResumen: string;
}

/**
 * Recomienda aulas que se ajustan óptimamente al número de estudiantes.
 * Garantiza:
 * 1. Capacidad del aula >= número de estudiantes (sin sobrecupo).
 * 2. Prioriza las aulas con menor desperdicio de capacidad (más cercanas al número de estudiantes).
 * 3. Prioriza aulas disponibles en el horario indicado.
 */
export function getAulasRecomendadas(
  aulas: AulaLaboratorio[],
  numeroEstudiantes: number,
  currentAulaId?: number | null,
  disponibilidadChecker?: (aula: AulaLaboratorio) => { esDisponible: boolean; estadoTexto?: string },
  options?: {
    id_bloque?: number;
    id_piso?: number;
    tipo?: string;
    maxCapacidadFiltro?: number; // Para sugerir aulas menores al aula actual
  }
): AulaRecomendada[] {
  if (!aulas || aulas.length === 0 || numeroEstudiantes <= 0) return [];

  // Filtrar exclusivamente aulas con capacidad suficiente
  const candidatos = aulas.filter(a => {
    // Debe tener capacidad suficiente para todos los estudiantes
    if (a.capacidad < numeroEstudiantes) return false;
    // Si se pasa currentAulaId, excluir la misma aula de las recomendaciones
    if (currentAulaId && a.id_aula_laboratorio === currentAulaId) return false;
    // Si se especificó límite superior (ej. menor a la capacidad del aula actual)
    if (options?.maxCapacidadFiltro && a.capacidad >= options.maxCapacidadFiltro) return false;
    return true;
  });

  const recomendadas: AulaRecomendada[] = candidatos.map(aula => {
    const disp = disponibilidadChecker ? disponibilidadChecker(aula) : { esDisponible: true, estadoTexto: 'Disponible' };
    const diferencia = aula.capacidad - numeroEstudiantes;
    const porcentajeOcupacion = Math.round((numeroEstudiantes / aula.capacidad) * 100);
    const esMismoBloque = Boolean(options?.id_bloque && aula.id_bloque === options.id_bloque);
    const esMismoPiso = Boolean(options?.id_piso && aula.piso === options.id_piso);

    let nivelAjuste: 'EXACTO' | 'OPTIMO' | 'BUENO' | 'AMPLIO' = 'AMPLIO';
    let ajusteTexto = '';

    if (diferencia === 0) {
      nivelAjuste = 'EXACTO';
      ajusteTexto = '🎯 Ajuste 100% exacto (0 puestos sobrantes)';
    } else if (diferencia <= 5 || porcentajeOcupacion >= 80) {
      nivelAjuste = 'OPTIMO';
      ajusteTexto = `✨ Ajuste óptimo (+${diferencia} puestos libres, ${porcentajeOcupacion}% ocupación)`;
    } else if (diferencia <= 10 || porcentajeOcupacion >= 60) {
      nivelAjuste = 'BUENO';
      ajusteTexto = `👍 Buen ajuste (+${diferencia} puestos libres, ${porcentajeOcupacion}% ocupación)`;
    } else {
      nivelAjuste = 'AMPLIO';
      ajusteTexto = `Espacioso (+${diferencia} puestos libres, ${porcentajeOcupacion}% ocupación)`;
    }

    return {
      aula,
      capacidad: aula.capacidad,
      estudiantes: numeroEstudiantes,
      diferencia,
      porcentajeOcupacion,
      esDisponible: disp.esDisponible,
      motivoNoDisponible: !disp.esDisponible ? disp.estadoTexto : undefined,
      esMismoBloque,
      esMismoPiso,
      nivelAjuste,
      ajusteTexto
    };
  });

  // Ordenamiento inteligente:
  // 1. Aulas disponibles primero
  // 2. Menor diferencia de capacidad (ajuste más exacto al número de estudiantes)
  // 3. Mismo bloque/edificio
  // 4. Mismo tipo (ej. Aula vs Laboratorio si aplica)
  recomendadas.sort((a, b) => {
    // Disponibilidad
    if (a.esDisponible !== b.esDisponible) {
      return a.esDisponible ? -1 : 1;
    }
    // Diferencia respecto a los estudiantes requeridos (más cercano a 0 gana)
    if (a.diferencia !== b.diferencia) {
      return a.diferencia - b.diferencia;
    }
    // Mismo bloque
    if (a.esMismoBloque !== b.esMismoBloque) {
      return a.esMismoBloque ? -1 : 1;
    }
    // Capacidad absoluta
    return a.capacidad - b.capacidad;
  });

  return recomendadas;
}

/**
 * Evalúa las dos reglas solicitadas:
 * 1. Capacidad < Estudiantes: Generar alerta y no permitir el ingreso.
 * 2. Capacidad > Estudiantes: Generar alerta de subutilización y listar aulas apropiadas recomendadas.
 */
export function evaluarCapacidadAula(
  currentAula: AulaLaboratorio | null | undefined,
  numeroEstudiantes: number,
  allAulas: AulaLaboratorio[],
  disponibilidadChecker?: (aula: AulaLaboratorio) => { esDisponible: boolean; estadoTexto?: string },
  options?: { id_bloque?: number; id_piso?: number; tipo?: string }
): EvaluacionCapacidadResultado {
  if (!currentAula) {
    return {
      esInsuficiente: false,
      esExcesiva: false,
      capacidad: 0,
      numeroEstudiantes,
      diferencia: 0,
      porcentajeOcupacion: 0,
      aulasRecomendadas: [],
      mensajeResumen: 'Sin aula asignada'
    };
  }

  const capacidad = currentAula.capacidad;
  const diferencia = capacidad - numeroEstudiantes;
  const porcentajeOcupacion = capacidad > 0 ? Math.round((numeroEstudiantes / capacidad) * 100) : 0;

  // Regla 1: Capacidad menor a los estudiantes
  if (capacidad < numeroEstudiantes) {
    // Obtener aulas con capacidad suficiente como alternativas
    const alternativasSuficientes = getAulasRecomendadas(
      allAulas,
      numeroEstudiantes,
      currentAula.id_aula_laboratorio,
      disponibilidadChecker,
      options
    );

    return {
      esInsuficiente: true,
      esExcesiva: false,
      capacidad,
      numeroEstudiantes,
      diferencia,
      porcentajeOcupacion,
      aulasRecomendadas: alternativasSuficientes,
      mensajeResumen: `Capacidad insuficiente (${capacidad} < ${numeroEstudiantes}). Ingreso no permitido.`
    };
  }

  // Regla 2: Capacidad mayor a los estudiantes (verificar si amerita recomendación)
  // Ejemplo dado por el usuario: aula de 30 y estudiantes 10 (diferencia 20)
  // Se considera excesiva si hay al menos 5 puestos desaprovechados o la ocupación es menor al 80%
  // y además existen aulas alternativas con capacidad más ajustada.
  const aulasMasAjustadas = getAulasRecomendadas(
    allAulas,
    numeroEstudiantes,
    currentAula.id_aula_laboratorio,
    disponibilidadChecker,
    {
      ...options,
      maxCapacidadFiltro: capacidad // Solo aulas de menor capacidad que la actual
    }
  );

  const esExcesiva = (diferencia >= 5 || porcentajeOcupacion < 80) && aulasMasAjustadas.length > 0;

  return {
    esInsuficiente: false,
    esExcesiva,
    capacidad,
    numeroEstudiantes,
    diferencia,
    porcentajeOcupacion,
    aulasRecomendadas: esExcesiva ? aulasMasAjustadas : [],
    mensajeResumen: esExcesiva
      ? `Subutilización: Aula para ${capacidad} con solo ${numeroEstudiantes} estudiantes (${diferencia} cupos libres).`
      : `Capacidad adecuada (${numeroEstudiantes}/${capacidad}, ${porcentajeOcupacion}% de ocupación).`
  };
}
