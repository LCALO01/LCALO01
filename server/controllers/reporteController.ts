import { Request, Response } from 'express';
import { PlanificacionModel } from '../models/PlanificacionModel.ts';
import { AulaModel } from '../models/AulaModel.ts';
import { CatalogoModel } from '../models/CatalogoModel.ts';
import { queryAll } from '../db/database.ts';

export class ReporteController {
  static async getEstadisticas(req: Request, res: Response) {
    try {
      const [aulas, planificaciones, docentes, asignaturas, feriados] = await Promise.all([
        AulaModel.getAll({}),
        PlanificacionModel.getAll({}),
        CatalogoModel.getDocentes(),
        CatalogoModel.getAsignaturas(),
        CatalogoModel.getFeriados()
      ]);

      const totalAulas = aulas.length;
      const capacidadTotal = aulas.reduce((sum, a) => sum + a.capacidad, 0);
      const aulasDisponibles = aulas.filter(a => a.estado === 'DISPONIBLE').length;
      const aulasOcupadas = aulas.filter(a => a.estado === 'OCUPADO' || (a.clases_activas_count && a.clases_activas_count > 0)).length;
      const aulasMantenimiento = aulas.filter(a => a.estado === 'MANTENIMIENTO').length;
      const aulasInactivas = aulas.filter(a => a.estado === 'INACTIVO').length;

      const totalEstudiantesAtendidos = planificaciones.reduce((acc, p) => acc + (p.numero_estudiantes || 0), 0);
      const cursosUnificados = planificaciones.filter(p => p.curso_unificado === 1).length;

      // Desglose por bloque
      const porBloqueSql = `
        SELECT 
          b.nombre AS bloque,
          COUNT(a.id_aula_laboratorio) AS total_aulas,
          SUM(a.capacidad) AS capacidad_bloque,
          SUM(CASE WHEN a.tipo = 'LABORATORIO' THEN 1 ELSE 0 END) AS laboratorios,
          SUM(CASE WHEN a.tipo = 'AULA' THEN 1 ELSE 0 END) AS aulas
        FROM bloque b
        LEFT JOIN aula_laboratorio a ON b.id_bloque = a.id_bloque
        GROUP BY b.id_bloque, b.nombre
        ORDER BY b.codigo
      `;
      const porBloque = await queryAll(porBloqueSql);

      // Desglose por jornada
      const porJornadaSql = `
        SELECT 
          j.nombre AS jornada,
          COUNT(p.id_planificacion) AS total_clases,
          SUM(p.numero_estudiantes) AS total_estudiantes
        FROM jornada j
        LEFT JOIN planificacion_academica p ON j.id_jornada = p.id_jornada AND p.estado = 'ACTIVO'
        GROUP BY j.id_jornada, j.nombre
        ORDER BY j.id_jornada
      `;
      const porJornada = await queryAll(porJornadaSql);

      res.json({
        success: true,
        data: {
          totales: {
            totalAulas,
            capacidadTotal,
            aulasDisponibles,
            aulasOcupadas,
            aulasMantenimiento,
            aulasInactivas,
            totalPlanificaciones: planificaciones.length,
            totalEstudiantesAtendidos,
            cursosUnificados,
            totalDocentes: docentes.length,
            totalAsignaturas: asignaturas.length,
            totalFeriados: feriados.length
          },
          porBloque,
          porJornada
        }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
