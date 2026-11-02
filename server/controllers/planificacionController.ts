import { Request, Response } from 'express';
import { PlanificacionModel } from '../models/PlanificacionModel.ts';
import { AulaModel } from '../models/AulaModel.ts';
import { CatalogoModel } from '../models/CatalogoModel.ts';

export class PlanificacionController {
  static async list(req: Request, res: Response) {
    try {
      const { sede, bloque, piso, aula, periodo, jornada, docente, carrera, dia, estado } = req.query;
      const filters = {
        sede: sede ? Number(sede) : undefined,
        bloque: bloque ? Number(bloque) : undefined,
        piso: piso ? Number(piso) : undefined,
        aula: aula ? Number(aula) : undefined,
        periodo: periodo ? Number(periodo) : undefined,
        jornada: jornada ? Number(jornada) : undefined,
        docente: docente ? Number(docente) : undefined,
        carrera: carrera ? Number(carrera) : undefined,
        dia: dia ? Number(dia) : undefined,
        estado: estado ? String(estado) : undefined,
      };

      const data = await PlanificacionModel.getAll(filters);
      res.json({ success: true, count: data.length, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async validarCruces(req: Request, res: Response) {
    try {
      const { id_aula_laboratorio, id_docente, id_asignatura, id_dia, hora_inicio, hora_fin, id_periodo, numero_estudiantes, excludePlanId } = req.body;

      if (!id_aula_laboratorio || !id_docente || !id_dia || !hora_inicio || !hora_fin || !id_periodo) {
        return res.status(400).json({ success: false, message: 'Parámetros incompletos para validación' });
      }

      // 1. Validar conflicto horario en aula y docente
      const cruces = await PlanificacionModel.checkCruces({
        id_aula_laboratorio: Number(id_aula_laboratorio),
        id_docente: Number(id_docente),
        id_asignatura: id_asignatura ? Number(id_asignatura) : undefined,
        id_dia: Number(id_dia),
        hora_inicio: String(hora_inicio),
        hora_fin: String(hora_fin),
        id_periodo: Number(id_periodo),
        excludePlanId: excludePlanId ? Number(excludePlanId) : undefined
      });

      // 2. Validar capacidad
      const aula = await AulaModel.getById(Number(id_aula_laboratorio));
      let sobrecupo = false;
      let capacidadAula = 0;
      if (aula) {
        capacidadAula = aula.capacidad;
        if (numero_estudiantes && Number(numero_estudiantes) > aula.capacidad) {
          sobrecupo = true;
        }
      }

      // 3. Revisar feriados 2026
      const feriados = await CatalogoModel.getFeriados();

      res.json({
        success: true,
        valido: !cruces.conflictoAula && !cruces.conflictoDocente && !sobrecupo,
        cruces,
        sobrecupo,
        capacidadAula,
        numeroEstudiantes: Number(numero_estudiantes || 0),
        feriadosCount: feriados.length
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const body = req.body;

      // Mandatory fields check
      const required = ['id_sede', 'id_escuela', 'id_carrera', 'id_asignatura', 'id_docente', 'id_nivel', 'id_paralelo', 'id_jornada', 'id_bloque', 'id_aula_laboratorio', 'id_periodo', 'id_dia', 'hora_inicio', 'hora_fin', 'numero_estudiantes'];
      for (const field of required) {
        if (body[field] === undefined || body[field] === null || body[field] === '') {
          return res.status(400).json({ success: false, message: `El campo '${field}' es obligatorio.` });
        }
      }

      // Validate room capacity
      const aula = await AulaModel.getById(Number(body.id_aula_laboratorio));
      if (!aula) {
        return res.status(404).json({ success: false, message: 'Aula especificada no existe.' });
      }

      if (Number(body.numero_estudiantes) > aula.capacidad) {
        return res.status(400).json({
          success: false,
          error_code: 'CAPACITY_EXCEEDED',
          message: `Capacidad del aula insuficiente (Ingreso no permitido): El aula '${aula.nombre}' tiene capacidad para ${aula.capacidad} estudiantes, pero se registraron ${body.numero_estudiantes}.`
        });
      }

      // Check collision
      const cruces = await PlanificacionModel.checkCruces({
        id_aula_laboratorio: Number(body.id_aula_laboratorio),
        id_docente: Number(body.id_docente),
        id_asignatura: Number(body.id_asignatura),
        id_dia: Number(body.id_dia),
        hora_inicio: String(body.hora_inicio),
        hora_fin: String(body.hora_fin),
        id_periodo: Number(body.id_periodo)
      });

      if (cruces.conflictoAula) {
        return res.status(409).json({
          success: false,
          message: `Cruce de aula: El aula '${aula.nombre}' ya se encuentra asignada el día indicado entre ${cruces.detallesAula?.hora_inicio} y ${cruces.detallesAula?.hora_fin} para la asignatura '${cruces.detallesAula?.asignatura_nombre}'.`,
          detalles: cruces.detallesAula
        });
      }

      if (cruces.conflictoDocente) {
        return res.status(409).json({
          success: false,
          message: `Cruce de docente: El docente ${cruces.detallesDocente?.docente_nombres} ${cruces.detallesDocente?.docente_apellidos} ya imparte clases ese día de ${cruces.detallesDocente?.hora_inicio} a ${cruces.detallesDocente?.hora_fin}.`,
          detalles: cruces.detallesDocente
        });
      }

      const id = await PlanificacionModel.create(body);
      const nueva = await PlanificacionModel.getById(id);

      res.status(201).json({
        success: true,
        message: 'Asignación de aula y horario registrada exitosamente.',
        id,
        data: nueva
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const body = req.body;

      const existing = await PlanificacionModel.getById(id);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Planificación no encontrada.' });
      }

      // If aula, docente, dia or time changed, check conflicts
      const aulaId = body.id_aula_laboratorio ? Number(body.id_aula_laboratorio) : existing.id_aula_laboratorio;
      const docenteId = body.id_docente ? Number(body.id_docente) : existing.id_docente;
      const diaId = body.id_dia ? Number(body.id_dia) : (existing.id_dia || 1);
      const horaInicio = body.hora_inicio || existing.hora_inicio;
      const horaFin = body.hora_fin || existing.hora_fin;
      const periodoId = body.id_periodo ? Number(body.id_periodo) : existing.id_periodo;
      const numEstudiantes = body.numero_estudiantes !== undefined ? Number(body.numero_estudiantes) : existing.numero_estudiantes;

      // Capacity check
      const aula = await AulaModel.getById(aulaId);
      if (aula && numEstudiantes > aula.capacidad) {
        return res.status(400).json({
          success: false,
          error_code: 'CAPACITY_EXCEEDED',
          message: `Capacidad del aula insuficiente (Ingreso no permitido): El aula '${aula.nombre}' tiene capacidad de ${aula.capacidad}, pero se solicitaron ${numEstudiantes}.`
        });
      }

      // Collision check
      if (horaInicio && horaFin) {
        const cruces = await PlanificacionModel.checkCruces({
          id_aula_laboratorio: aulaId,
          id_docente: docenteId,
          id_asignatura: body.id_asignatura ? Number(body.id_asignatura) : existing.id_asignatura,
          id_dia: diaId,
          hora_inicio: horaInicio,
          hora_fin: horaFin,
          id_periodo: periodoId,
          excludePlanId: id
        });

        if (cruces.conflictoAula) {
          return res.status(409).json({
            success: false,
            message: `Cruce de aula: El aula ya está ocupada en ese intervalo horario.`,
            detalles: cruces.detallesAula
          });
        }

        if (cruces.conflictoDocente) {
          return res.status(409).json({
            success: false,
            message: `Cruce de docente: El docente ya tiene otra clase en ese horario.`,
            detalles: cruces.detallesDocente
          });
        }
      }

      await PlanificacionModel.update(id, body);
      const updated = await PlanificacionModel.getById(id);

      res.json({
        success: true,
        message: 'Planificación actualizada exitosamente.',
        data: updated
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const ok = await PlanificacionModel.delete(id);
      if (!ok) {
        return res.status(404).json({ success: false, message: 'Planificación no encontrada.' });
      }
      await AulaModel.syncAulasOcupadas();
      res.json({ success: true, message: 'Asignación eliminada exitosamente.' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async deleteAll(req: Request, res: Response) {
    try {
      await PlanificacionModel.deleteAll();
      await AulaModel.syncAulasOcupadas();
      res.json({ success: true, message: 'Todos los registros de planificación académica han sido eliminados exitosamente.' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async asignarAulaDirecta(req: Request, res: Response) {
    try {
      const { id_planificacion, id_asignatura, id_aula_laboratorio } = req.body;
      if (!id_aula_laboratorio) {
        return res.status(400).json({ success: false, message: 'Se requiere id_aula_laboratorio' });
      }

      const aula = await AulaModel.getById(Number(id_aula_laboratorio));
      if (!aula) {
        return res.status(404).json({ success: false, message: 'Aula no encontrada' });
      }

      if (id_planificacion) {
        const plan = await PlanificacionModel.getById(Number(id_planificacion));
        if (!plan) return res.status(404).json({ success: false, message: 'Planificación no encontrada' });

        if (plan.numero_estudiantes && plan.numero_estudiantes > aula.capacidad) {
          return res.status(400).json({
            success: false,
            error_code: 'CAPACITY_EXCEEDED',
            message: `Capacidad del aula insuficiente (Ingreso no permitido): El aula '${aula.nombre}' tiene capacidad para ${aula.capacidad} estudiantes, pero se requieren ${plan.numero_estudiantes}.`,
            capacidad: aula.capacidad,
            requerido: plan.numero_estudiantes
          });
        }

        await PlanificacionModel.update(Number(id_planificacion), {
          id_aula_laboratorio: Number(id_aula_laboratorio),
          id_bloque: aula.id_bloque
        });
      } else if (id_asignatura) {
        const plans = await PlanificacionModel.getAll({ asignatura: Number(id_asignatura) });
        for (const p of plans) {
          await PlanificacionModel.update(p.id_planificacion, {
            id_aula_laboratorio: Number(id_aula_laboratorio),
            id_bloque: aula.id_bloque
          });
        }
      }

      await AulaModel.syncAulasOcupadas();
      res.json({
        success: true,
        message: `Aula ${aula.codigo} asignada exitosamente.`,
        aula
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async retirarAulaDirecta(req: Request, res: Response) {
    try {
      const { id_planificacion, id_asignatura } = req.body;
      if (id_planificacion) {
        await PlanificacionModel.update(Number(id_planificacion), {
          id_aula_laboratorio: 1
        });
      } else if (id_asignatura) {
        const plans = await PlanificacionModel.getAll({ asignatura: Number(id_asignatura) });
        for (const p of plans) {
          await PlanificacionModel.update(p.id_planificacion, {
            id_aula_laboratorio: 1
          });
        }
      }
      await AulaModel.syncAulasOcupadas();
      res.json({ success: true, message: 'Aula retirada exitosamente.' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async asignacionAutomatica(req: Request, res: Response) {
    try {
      const { id_periodo, id_carrera, id_sede, simulacion = false } = req.body;
      const periodoId = id_periodo ? Number(id_periodo) : 1;

      // 1. Obtener todas las planificaciones y aulas
      const allPlans = await PlanificacionModel.getAll({
        periodo: periodoId,
        carrera: id_carrera ? Number(id_carrera) : undefined,
        sede: id_sede ? Number(id_sede) : undefined
      });

      const allAulas = await AulaModel.getAll();
      const activasAulas = allAulas.filter(a => a.estado !== 'MANTENIMIENTO' && a.estado !== 'INACTIVO');

      // 2. Mapeo de afinidad carrera -> bloques preferidos para organizar aulas por carrera
      const careerBlockMap: Record<number, number[]> = {
        1: [4, 1], // Gastronomía -> Bloque E (Talleres), Bloque A
        2: [1, 2], // GTH -> Bloque A, B
        3: [1, 2], // Marketing -> Bloque A, B
        4: [1, 2], // Odontología -> Bloque A, B
        5: [1, 2, 3], // Software -> Bloque A (Labs), Bloque B, C
        6: [1, 2], // Comercio Exterior -> Bloque A, B
        7: [2, 3], // Redes -> Bloque B, C
        8: [1, 2], // Contabilidad -> Bloque A, B
        9: [1, 2], // Enfermería -> Bloque A, B
        10: [1, 2], // Estética -> Bloque A, B
        11: [2, 3], // Educación Inicial -> Bloque B, C
        12: [1, 2], // Talento Humano -> Bloque A, B
        13: [1, 2], // Gestión Presupuestaria -> Bloque A, B
        14: [2, 1], // Rehabilitación Física -> Bloque B, A
      };

      // 3. Estructura de rastreo de ocupación por horario: `${id_aula}_${dia}_${horaInicio}_${horaFin}`
      const aulaScheduleUsage: Map<string, { planId: number; isUnificada: boolean; unificadaKey?: string }> = new Map();

      // Función para verificar si dos rangos horarios se cruzan
      const timeOverlaps = (s1: string, e1: string, s2: string, e2: string) => s1 < e2 && e1 > s2;

      const resultados: any[] = [];
      let unificadasCount = 0;
      const aulasOcupadasSet = new Set<number>();

      // Agrupar cursos unificados primero
      const unificadasGroups: Map<string, any[]> = new Map();
      allPlans.forEach(p => {
        if (p.curso_unificado === 1) {
          const key = p.unificada_codigo || `${p.id_dia}_${p.hora_inicio}_${p.hora_fin}`;
          if (!unificadasGroups.has(key)) unificadasGroups.set(key, []);
          unificadasGroups.get(key)!.push(p);
        }
      });

      // Procesar asignaciones
      for (const plan of allPlans) {
        const reqLaboratorio = plan.aula_tipo === 'LABORATORIO' || 
          plan.asignatura_nombre.toUpperCase().includes('LAB') || 
          plan.asignatura_nombre.toUpperCase().includes('TALLER') ||
          plan.asignatura_nombre.toUpperCase().includes('PRÁCTIC') ||
          plan.asignatura_nombre.toUpperCase().includes('PROGRAMACION') ||
          plan.asignatura_nombre.toUpperCase().includes('SISTEMAS OPERATIVOS');

        // Manejo especial de cursos unificados ("las unificadas no es cruce")
        let assignedAula: any = null;
        const unificadaKey = plan.curso_unificado === 1 ? (plan.unificada_codigo || `${plan.id_dia}_${plan.hora_inicio}_${plan.hora_fin}`) : null;

        if (unificadaKey) {
          // Buscar si el grupo unificado ya tiene un aula asignada
          for (const [slotKey, usage] of aulaScheduleUsage.entries()) {
            if (usage.isUnificada && usage.unificadaKey === unificadaKey) {
              const aulaId = Number(slotKey.split('_')[0]);
              assignedAula = activasAulas.find(a => a.id_aula_laboratorio === aulaId);
              if (assignedAula) {
                unificadasCount++;
                break;
              }
            }
          }
        }

        if (!assignedAula) {
          // Filtrar candidatos organizados por carrera y respetando capacidad
          const preferredBlocks = careerBlockMap[plan.id_carrera] || [1, 2, 3, 4];

          // Ordenar aulas: 1) Tipo requerido (Aula o Lab), 2) Bloque afín a la carrera, 3) Mejor ajuste de capacidad (sin sobrecupo)
          const candidateAulas = activasAulas.filter(a => {
            if (reqLaboratorio && a.tipo !== 'LABORATORIO') return false;
            // Capacidad suficiente
            return a.capacidad >= plan.numero_estudiantes;
          }).sort((a, b) => {
            const prefA = preferredBlocks.indexOf(a.id_bloque) !== -1 ? preferredBlocks.indexOf(a.id_bloque) : 99;
            const prefB = preferredBlocks.indexOf(b.id_bloque) !== -1 ? preferredBlocks.indexOf(b.id_bloque) : 99;
            if (prefA !== prefB) return prefA - prefB;

            // Minimizar desperdicio de capacidad (ajuste exacto)
            const diffA = a.capacidad - plan.numero_estudiantes;
            const diffB = b.capacidad - plan.numero_estudiantes;
            return diffA - diffB;
          });

          // Buscar aula sin conflicto de horario
          for (const cand of candidateAulas) {
            let conflict = false;
            if (plan.id_dia && plan.hora_inicio && plan.hora_fin) {
              for (const [slotKey, usage] of aulaScheduleUsage.entries()) {
                const [aId, dId, hStart, hEnd] = slotKey.split('_');
                if (Number(aId) === cand.id_aula_laboratorio && Number(dId) === plan.id_dia) {
                  if (timeOverlaps(plan.hora_inicio, plan.hora_fin, hStart, hEnd)) {
                    // Conflicto horario en el aula
                    conflict = true;
                    break;
                  }
                }
              }
            }

            if (!conflict) {
              assignedAula = cand;
              break;
            }
          }

          // Si no encontró sin conflicto con filtro estricto, tomar la mejor disponible con capacidad
          if (!assignedAula && candidateAulas.length > 0) {
            assignedAula = candidateAulas[0];
          } else if (!assignedAula && activasAulas.length > 0) {
            assignedAula = activasAulas.find(a => a.capacidad >= plan.numero_estudiantes) || activasAulas[0];
          }
        }

        if (assignedAula) {
          aulasOcupadasSet.add(assignedAula.id_aula_laboratorio);
          if (plan.id_dia && plan.hora_inicio && plan.hora_fin) {
            const slotKey = `${assignedAula.id_aula_laboratorio}_${plan.id_dia}_${plan.hora_inicio}_${plan.hora_fin}`;
            aulaScheduleUsage.set(slotKey, {
              planId: plan.id_planificacion,
              isUnificada: plan.curso_unificado === 1,
              unificadaKey: unificadaKey || undefined
            });
          }

          resultados.push({
            id_planificacion: plan.id_planificacion,
            id_aula_laboratorio: assignedAula.id_aula_laboratorio,
            aula_codigo: assignedAula.codigo,
            aula_nombre: assignedAula.nombre,
            aula_tipo: assignedAula.tipo,
            aula_capacidad: assignedAula.capacidad,
            id_bloque: assignedAula.id_bloque,
            bloque_nombre: assignedAula.bloque_nombre,
            bloque_codigo: assignedAula.bloque_codigo,
            aula_piso: assignedAula.piso,
            aula_estado: 'OCUPADO',
            numero_estudiantes: plan.numero_estudiantes,
            curso_unificado: plan.curso_unificado,
            unificada_asignatura: plan.unificada_asignatura,
            asignatura_nombre: plan.asignatura_nombre,
            asignatura_codigo: plan.asignatura_codigo,
            carrera_nombre: plan.carrera_nombre,
            docente_nombres: plan.docente_nombres,
            docente_apellidos: plan.docente_apellidos,
            id_dia: plan.id_dia,
            dia_nombre: plan.dia_nombre,
            hora_inicio: plan.hora_inicio,
            hora_fin: plan.hora_fin,
            total_clases: plan.total_clases || 16,
            sede_nombre: plan.sede_nombre,
            escuela_nombre: plan.escuela_nombre,
            nivel_nombre: plan.nivel_nombre,
            paralelo_codigo: plan.paralelo_codigo,
            jornada_nombre: plan.jornada_nombre
          });

          // Si no es simulación, persistir en SQLite
          if (!simulacion) {
            await PlanificacionModel.update(plan.id_planificacion, {
              id_bloque: assignedAula.id_bloque,
              id_aula_laboratorio: assignedAula.id_aula_laboratorio
            });
          }
        }
      }

      // Sincronizar estados de aulas a 'OCUPADO'
      if (!simulacion) {
        await AulaModel.syncAulasOcupadas();
      }

      const updatedPlans = await PlanificacionModel.getAll({ periodo: periodoId });
      const updatedAulas = await AulaModel.getAll();

      res.json({
        success: true,
        message: 'Asignación automática de aulas por carrera y capacidad completada.',
        resumen: {
          totalProcesadas: allPlans.length,
          totalAsignadas: resultados.length,
          aulasOcupadasCount: aulasOcupadasSet.size,
          cursosUnificadosCount: unificadasCount,
          tasaAsignacion: allPlans.length > 0 ? Math.round((resultados.length / allPlans.length) * 100) : 100
        },
        data: resultados,
        planificaciones: updatedPlans,
        aulas: updatedAulas
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async recomendarAulas(req: Request, res: Response) {
    try {
      const { estudiantes, numero_estudiantes, id_aula_actual, id_bloque, id_dia, hora_inicio, hora_fin } = req.query;
      const numEstudiantes = Number(numero_estudiantes || estudiantes) || 0;
      const allAulas = await AulaModel.getAll();

      // Consultar planificaciones para verificar cruces si se pasa horario
      const allPlans = await PlanificacionModel.getAll();
      const diaId = id_dia ? Number(id_dia) : null;
      const hIni = hora_inicio ? String(hora_inicio) : null;
      const hFin = hora_fin ? String(hora_fin) : null;

      // Filtrar aulas con capacidad suficiente
      const candidatos = allAulas.filter(a => {
        if (a.capacidad < numEstudiantes) return false;
        if (id_aula_actual && a.id_aula_laboratorio === Number(id_aula_actual)) return false;
        return true;
      });

      const resultados = candidatos.map(a => {
        let conflicto = false;
        let detalle = '';
        if (diaId && hIni && hFin) {
          const c = allPlans.find(p => p.id_aula_laboratorio === a.id_aula_laboratorio && p.id_dia === diaId && (
            (hIni >= p.hora_inicio && hIni < p.hora_fin) ||
            (hFin > p.hora_inicio && hFin <= p.hora_fin) ||
            (hIni <= p.hora_inicio && hFin >= p.hora_fin)
          ));
          if (c) {
            conflicto = true;
            detalle = `Ocupada por ${c.asignatura_nombre || 'otra clase'}`;
          }
        }

        const diff = a.capacidad - numEstudiantes;
        const pct = Math.round((numEstudiantes / a.capacidad) * 100);
        return {
          aula: a,
          capacidad: a.capacidad,
          estudiantes: numEstudiantes,
          diferencia: diff,
          porcentajeOcupacion: pct,
          esDisponible: !conflicto,
          motivoNoDisponible: detalle || undefined,
          esMismoBloque: id_bloque ? a.id_bloque === Number(id_bloque) : false,
          nivelAjuste: diff === 0 ? 'EXACTO' : diff <= 5 ? 'OPTIMO' : diff <= 10 ? 'BUENO' : 'AMPLIO',
          ajusteTexto: diff === 0 ? '🎯 Ajuste 100% exacto' : `+${diff} puestos libres (${pct}% ocupación)`
        };
      });

      resultados.sort((a, b) => {
        if (a.esDisponible !== b.esDisponible) return a.esDisponible ? -1 : 1;
        if (a.diferencia !== b.diferencia) return a.diferencia - b.diferencia;
        return a.capacidad - b.capacidad;
      });

      res.json({
        success: true,
        count: resultados.length,
        data: resultados
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}
