import { queryAll, queryOne, runQuery } from '../db/database.ts';

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

  // Horario data
  id_horario?: number;
  id_dia?: number;
  dia_codigo?: string;
  dia_nombre?: string;
  hora_inicio?: string;
  hora_fin?: string;
  numero_horas?: number;
  modalidad?: string;
}

export class PlanificacionModel {
  static async getAll(filters: {
    sede?: number;
    bloque?: number;
    piso?: number;
    aula?: number;
    periodo?: number;
    jornada?: number;
    docente?: number;
    carrera?: number;
    asignatura?: number;
    dia?: number;
    estado?: string;
  } = {}): Promise<PlanificacionCompleta[]> {
    let sql = `
      SELECT 
        p.id_planificacion,
        p.id_sede,
        s.codigo AS sede_codigo,
        s.nombre AS sede_nombre,
        p.id_escuela,
        e.nombre AS escuela_nombre,
        p.id_carrera,
        c.codigo AS carrera_codigo,
        c.nombre AS carrera_nombre,
        p.id_asignatura,
        a.codigo_asignatura AS asignatura_codigo,
        a.nombre AS asignatura_nombre,
        a.creditos AS asignatura_creditos,
        a.horas_totales AS asignatura_horas_totales,
        p.id_docente,
        d.ci AS docente_ci,
        d.nombres AS docente_nombres,
        d.apellidos AS docente_apellidos,
        d.correo AS docente_correo,
        p.id_nivel,
        n.nombre AS nivel_nombre,
        p.id_paralelo,
        par.codigo AS paralelo_codigo,
        p.id_jornada,
        j.codigo AS jornada_codigo,
        j.nombre AS jornada_nombre,
        p.id_bloque,
        b.codigo AS bloque_codigo,
        b.nombre AS bloque_nombre,
        p.id_aula_laboratorio,
        al.codigo AS aula_codigo,
        al.nombre AS aula_nombre,
        al.tipo AS aula_tipo,
        al.capacidad AS aula_capacidad,
        al.piso AS aula_piso,
        al.estado AS aula_estado,
        p.id_periodo,
        per.codigo AS periodo_codigo,
        per.nombre AS periodo_nombre,
        p.numero_estudiantes,
        p.curso_unificado,
        p.unificada_carrera,
        p.unificada_nivel,
        p.unificada_codigo,
        p.unificada_asignatura,
        p.total_clases,
        p.observaciones,
        p.estado,
        p.fecha_registro,
        p.usuario_registro,
        h.id_horario,
        h.id_dia,
        ds.codigo AS dia_codigo,
        ds.nombre AS dia_nombre,
        h.hora_inicio,
        h.hora_fin,
        h.numero_horas,
        h.modalidad
      FROM planificacion_academica p
      JOIN sede s ON p.id_sede = s.id_sede
      JOIN escuela e ON p.id_escuela = e.id_escuela
      JOIN carrera c ON p.id_carrera = c.id_carrera
      JOIN asignatura a ON p.id_asignatura = a.id_asignatura
      JOIN docente d ON p.id_docente = d.id_docente
      JOIN nivel n ON p.id_nivel = n.id_nivel
      JOIN paralelo par ON p.id_paralelo = par.id_paralelo
      JOIN jornada j ON p.id_jornada = j.id_jornada
      JOIN bloque b ON p.id_bloque = b.id_bloque
      JOIN aula_laboratorio al ON p.id_aula_laboratorio = al.id_aula_laboratorio
      JOIN periodo_academico per ON p.id_periodo = per.id_periodo
      LEFT JOIN horario h ON p.id_planificacion = h.id_planificacion AND h.estado = 'ACTIVO'
      LEFT JOIN dia_semana ds ON h.id_dia = ds.id_dia
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters.sede) {
      sql += ' AND p.id_sede = ?';
      params.push(filters.sede);
    }
    if (filters.bloque) {
      sql += ' AND p.id_bloque = ?';
      params.push(filters.bloque);
    }
    if (filters.piso) {
      sql += ' AND al.piso = ?';
      params.push(filters.piso);
    }
    if (filters.aula) {
      sql += ' AND p.id_aula_laboratorio = ?';
      params.push(filters.aula);
    }
    if (filters.periodo) {
      sql += ' AND p.id_periodo = ?';
      params.push(filters.periodo);
    }
    if (filters.jornada) {
      sql += ' AND p.id_jornada = ?';
      params.push(filters.jornada);
    }
    if (filters.docente) {
      sql += ' AND p.id_docente = ?';
      params.push(filters.docente);
    }
    if (filters.carrera) {
      sql += ' AND p.id_carrera = ?';
      params.push(filters.carrera);
    }
    if (filters.asignatura) {
      sql += ' AND p.id_asignatura = ?';
      params.push(filters.asignatura);
    }
    if (filters.dia) {
      sql += ' AND h.id_dia = ?';
      params.push(filters.dia);
    }
    if (filters.estado) {
      sql += ' AND p.estado = ?';
      params.push(filters.estado);
    }

    sql += ' ORDER BY ds.orden, h.hora_inicio, b.nombre, al.codigo';

    return queryAll<PlanificacionCompleta>(sql, params);
  }

  static async getById(id: number): Promise<PlanificacionCompleta | null> {
    const list = await this.getAll({});
    return list.find(p => p.id_planificacion === id) || null;
  }

  static async checkCruces(data: {
    id_aula_laboratorio: number;
    id_docente: number;
    id_dia: number;
    hora_inicio: string;
    hora_fin: string;
    id_periodo: number;
    id_asignatura?: number;
    excludePlanId?: number;
    curso_unificado?: number;
    unificada_codigo?: string;
  }): Promise<{
    conflictoAula: boolean;
    conflictoDocente: boolean;
    detallesAula?: PlanificacionCompleta;
    detallesDocente?: PlanificacionCompleta;
    mensajeAula?: string;
    mensajeDocente?: string;
  }> {
    const all = await this.getAll({ periodo: data.id_periodo, dia: data.id_dia });
    
    // Check time overlap: (startA < endB && endA > startB)
    const overlaps = (start1: string, end1: string, start2: string, end2: string) => {
      return start1 < end2 && end1 > start2;
    };

    let aulaConflict: PlanificacionCompleta | undefined;
    let docenteConflict: PlanificacionCompleta | undefined;
    let mensajeAula: string | undefined;
    let mensajeDocente: string | undefined;

    for (const p of all) {
      if (data.excludePlanId && p.id_planificacion === data.excludePlanId) continue;
      if (p.estado === 'CANCELADO') continue;
      if (!p.hora_inicio || !p.hora_fin) continue;

      const hasTimeOverlap = overlaps(data.hora_inicio, data.hora_fin, p.hora_inicio, p.hora_fin);
      if (hasTimeOverlap) {
        // Regla: "las unificadas no es cruce" (Cursos unificados comparten legítimamente aula y docente)
        const esUnificada = (data.curso_unificado === 1 || p.curso_unificado === 1);

        // Caso 1: Misma aula asignada a dos asignaturas diferentes (o conflicto de aula simultánea)
        if (p.id_aula_laboratorio === data.id_aula_laboratorio && !aulaConflict) {
          const esMismaAsignatura = data.id_asignatura && p.id_asignatura === data.id_asignatura;
          if (!esUnificada || !esMismaAsignatura) {
            aulaConflict = p;
            mensajeAula = `Cruce de aula: El aula ya está asignada el ${p.dia_nombre || 'día seleccionado'} de ${p.hora_inicio} a ${p.hora_fin} para la asignatura "${p.asignatura_nombre}".`;
          }
        }

        // Caso 2: Un docente es asignado a dos aulas simultáneamente
        if (p.id_docente === data.id_docente && !docenteConflict) {
          if (!esUnificada || p.id_aula_laboratorio !== data.id_aula_laboratorio) {
            docenteConflict = p;
            const aulaNombre = p.aula_codigo ? `Aula ${p.aula_codigo}` : (p.aula_nombre || 'otra aula');
            mensajeDocente = `Cruce de docente: El docente ${p.docente_nombres} ${p.docente_apellidos} ya está asignado a ${aulaNombre} (${p.asignatura_nombre}) de ${p.hora_inicio} a ${p.hora_fin}.`;
          }
        }
      }
    }

    return {
      conflictoAula: !!aulaConflict,
      conflictoDocente: !!docenteConflict,
      detallesAula: aulaConflict,
      detallesDocente: docenteConflict,
      mensajeAula,
      mensajeDocente
    };
  }

  static async create(data: {
    id_sede: number;
    id_escuela: number;
    id_carrera: number;
    id_asignatura: number;
    id_docente: number;
    id_nivel: number;
    id_paralelo: number;
    id_jornada: number;
    id_bloque: number;
    id_aula_laboratorio: number;
    id_periodo: number;
    numero_estudiantes: number;
    curso_unificado?: number;
    unificada_carrera?: string;
    unificada_nivel?: string;
    unificada_codigo?: string;
    unificada_asignatura?: string;
    total_clases?: number;
    observaciones?: string;
    estado?: string;
    usuario_registro?: string;
    // Horario
    id_dia: number;
    hora_inicio: string;
    hora_fin: string;
    numero_horas?: number;
    modalidad?: string;
  }): Promise<number> {
    const planSql = `
      INSERT INTO planificacion_academica (
        id_sede, id_escuela, id_carrera, id_asignatura, id_docente,
        id_nivel, id_paralelo, id_jornada, id_bloque, id_aula_laboratorio, id_periodo,
        numero_estudiantes, curso_unificado, unificada_carrera, unificada_nivel,
        unificada_codigo, unificada_asignatura, total_clases, observaciones, estado,
        usuario_registro
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const planRes = await runQuery(planSql, [
      data.id_sede,
      data.id_escuela,
      data.id_carrera,
      data.id_asignatura,
      data.id_docente,
      data.id_nivel,
      data.id_paralelo,
      data.id_jornada,
      data.id_bloque,
      data.id_aula_laboratorio,
      data.id_periodo,
      data.numero_estudiantes,
      data.curso_unificado ? 1 : 0,
      data.unificada_carrera || null,
      data.unificada_nivel || null,
      data.unificada_codigo || null,
      data.unificada_asignatura || null,
      data.total_clases || 16,
      data.observaciones || '',
      data.estado || 'ACTIVO',
      data.usuario_registro || 'admin'
    ]);

    const planId = planRes.lastInsertRowid;

    // Calcular numero de horas si no viene
    let numHoras = data.numero_horas;
    if (!numHoras && data.hora_inicio && data.hora_fin) {
      const [h1, m1] = data.hora_inicio.split(':').map(Number);
      const [h2, m2] = data.hora_fin.split(':').map(Number);
      numHoras = (h2 * 60 + m2 - (h1 * 60 + m1)) / 60;
    }

    const horSql = `
      INSERT INTO horario (
        id_planificacion, id_dia, hora_inicio, hora_fin, numero_horas, modalidad, estado
      ) VALUES (?, ?, ?, ?, ?, ?, 'ACTIVO')
    `;

    await runQuery(horSql, [
      planId,
      data.id_dia,
      data.hora_inicio,
      data.hora_fin,
      numHoras || 2,
      data.modalidad || 'PRESENCIAL'
    ]);

    return planId;
  }

  static async update(id: number, data: Partial<{
    id_sede: number;
    id_escuela: number;
    id_carrera: number;
    id_asignatura: number;
    id_docente: number;
    id_nivel: number;
    id_paralelo: number;
    id_jornada: number;
    id_bloque: number;
    id_aula_laboratorio: number;
    id_periodo: number;
    numero_estudiantes: number;
    curso_unificado: number;
    unificada_carrera: string;
    unificada_nivel: string;
    unificada_codigo: string;
    unificada_asignatura: string;
    total_clases: number;
    observaciones: string;
    estado: string;
    // Horario
    id_dia: number;
    hora_inicio: string;
    hora_fin: string;
    numero_horas: number;
    modalidad: string;
  }>): Promise<boolean> {
    const planFields: string[] = [];
    const planParams: any[] = [];

    const allowed = [
      'id_sede', 'id_escuela', 'id_carrera', 'id_asignatura', 'id_docente',
      'id_nivel', 'id_paralelo', 'id_jornada', 'id_bloque', 'id_aula_laboratorio',
      'id_periodo', 'numero_estudiantes', 'curso_unificado', 'unificada_carrera',
      'unificada_nivel', 'unificada_codigo', 'unificada_asignatura', 'total_clases',
      'observaciones', 'estado'
    ];

    for (const key of allowed) {
      if ((data as any)[key] !== undefined) {
        planFields.push(`${key} = ?`);
        planParams.push((data as any)[key]);
      }
    }

    if (planFields.length > 0) {
      planParams.push(id);
      await runQuery(`UPDATE planificacion_academica SET ${planFields.join(', ')} WHERE id_planificacion = ?`, planParams);
    }

    // Update horario
    if (data.id_dia !== undefined || data.hora_inicio !== undefined || data.hora_fin !== undefined) {
      const hor = await queryOne(`SELECT id_horario FROM horario WHERE id_planificacion = ?`, [id]);
      if (hor) {
        const horFields: string[] = [];
        const horParams: any[] = [];
        if (data.id_dia !== undefined) { horFields.push('id_dia = ?'); horParams.push(data.id_dia); }
        if (data.hora_inicio !== undefined) { horFields.push('hora_inicio = ?'); horParams.push(data.hora_inicio); }
        if (data.hora_fin !== undefined) { horFields.push('hora_fin = ?'); horParams.push(data.hora_fin); }
        if (data.modalidad !== undefined) { horFields.push('modalidad = ?'); horParams.push(data.modalidad); }
        if (data.numero_horas !== undefined) { horFields.push('numero_horas = ?'); horParams.push(data.numero_horas); }
        
        if (horFields.length > 0) {
          horParams.push(hor.id_horario);
          await runQuery(`UPDATE horario SET ${horFields.join(', ')} WHERE id_horario = ?`, horParams);
        }
      }
    }

    return true;
  }

  static async delete(id: number): Promise<boolean> {
    await runQuery(`DELETE FROM horario WHERE id_planificacion = ?`, [id]);
    const res = await runQuery(`DELETE FROM planificacion_academica WHERE id_planificacion = ?`, [id]);
    return res.changes > 0;
  }

  static async deleteAll(): Promise<boolean> {
    await runQuery(`DELETE FROM horario`);
    await runQuery(`DELETE FROM planificacion_academica`);
    return true;
  }
}
