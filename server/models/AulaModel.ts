import { queryAll, queryOne, runQuery } from '../db/database.ts';

export interface AulaLaboratorio {
  id_aula_laboratorio: number;
  id_bloque: number;
  bloque_codigo: string;
  bloque_nombre: string;
  sede_nombre: string;
  id_sede: number;
  codigo: string;
  nombre: string;
  tipo: 'AULA' | 'LABORATORIO';
  capacidad: number;
  piso: number;
  recursos?: string;
  estado: 'DISPONIBLE' | 'OCUPADO' | 'MANTENIMIENTO' | 'INACTIVO';
  clases_activas_count?: number;
  total_estudiantes?: number;
  max_estudiantes?: number;
}

export class AulaModel {
  static async getAll(filters: { bloque?: number; piso?: number; tipo?: string; estado?: string; sede?: number } = {}): Promise<AulaLaboratorio[]> {
    let sql = `
      SELECT 
        a.id_aula_laboratorio,
        a.id_bloque,
        b.codigo AS bloque_codigo,
        b.nombre AS bloque_nombre,
        s.id_sede,
        s.nombre AS sede_nombre,
        a.codigo,
        a.nombre,
        a.tipo,
        a.capacidad,
        a.piso,
        a.recursos,
        a.estado,
        (SELECT COUNT(*) FROM planificacion_academica p WHERE p.id_aula_laboratorio = a.id_aula_laboratorio AND p.estado = 'ACTIVO') AS clases_activas_count,
        COALESCE((SELECT SUM(p.numero_estudiantes) FROM planificacion_academica p WHERE p.id_aula_laboratorio = a.id_aula_laboratorio AND p.estado = 'ACTIVO'), 0) AS total_estudiantes,
        COALESCE((SELECT MAX(p.numero_estudiantes) FROM planificacion_academica p WHERE p.id_aula_laboratorio = a.id_aula_laboratorio AND p.estado = 'ACTIVO'), 0) AS max_estudiantes
      FROM aula_laboratorio a
      JOIN bloque b ON a.id_bloque = b.id_bloque
      JOIN sede s ON b.id_sede = s.id_sede
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters.bloque) {
      sql += ' AND a.id_bloque = ?';
      params.push(filters.bloque);
    }
    if (filters.piso) {
      sql += ' AND a.piso = ?';
      params.push(filters.piso);
    }
    if (filters.tipo) {
      sql += ' AND a.tipo = ?';
      params.push(filters.tipo);
    }
    if (filters.estado) {
      sql += ' AND a.estado = ?';
      params.push(filters.estado);
    }
    if (filters.sede) {
      sql += ' AND b.id_sede = ?';
      params.push(filters.sede);
    }

    sql += ' ORDER BY b.nombre, a.piso, a.codigo';

    return queryAll<AulaLaboratorio>(sql, params);
  }

  static async getById(id: number): Promise<AulaLaboratorio | null> {
    const sql = `
      SELECT 
        a.id_aula_laboratorio,
        a.id_bloque,
        b.codigo AS bloque_codigo,
        b.nombre AS bloque_nombre,
        s.id_sede,
        s.nombre AS sede_nombre,
        a.codigo,
        a.nombre,
        a.tipo,
        a.capacidad,
        a.piso,
        a.recursos,
        a.estado,
        (SELECT COUNT(*) FROM planificacion_academica p WHERE p.id_aula_laboratorio = a.id_aula_laboratorio AND p.estado = 'ACTIVO') AS clases_activas_count,
        COALESCE((SELECT SUM(p.numero_estudiantes) FROM planificacion_academica p WHERE p.id_aula_laboratorio = a.id_aula_laboratorio AND p.estado = 'ACTIVO'), 0) AS total_estudiantes,
        COALESCE((SELECT MAX(p.numero_estudiantes) FROM planificacion_academica p WHERE p.id_aula_laboratorio = a.id_aula_laboratorio AND p.estado = 'ACTIVO'), 0) AS max_estudiantes
      FROM aula_laboratorio a
      JOIN bloque b ON a.id_bloque = b.id_bloque
      JOIN sede s ON b.id_sede = s.id_sede
      WHERE a.id_aula_laboratorio = ?
    `;
    return queryOne<AulaLaboratorio>(sql, [id]);
  }

  static async updateEstado(id: number, estado: string): Promise<boolean> {
    const sql = `UPDATE aula_laboratorio SET estado = ? WHERE id_aula_laboratorio = ?`;
    const res = await runQuery(sql, [estado, id]);
    return res.changes > 0;
  }

  static async syncAulasOcupadas(): Promise<void> {
    const sql = `
      UPDATE aula_laboratorio
      SET estado = CASE
        WHEN codigo IN ('C1', 'C2', 'C3', 'C4') THEN 'INACTIVO'
        WHEN id_aula_laboratorio IN (
          SELECT DISTINCT id_aula_laboratorio
          FROM planificacion_academica
          WHERE estado = 'ACTIVO'
        ) AND estado NOT IN ('MANTENIMIENTO', 'INACTIVO') THEN 'OCUPADO'
        WHEN estado = 'OCUPADO' AND id_aula_laboratorio NOT IN (
          SELECT DISTINCT id_aula_laboratorio
          FROM planificacion_academica
          WHERE estado = 'ACTIVO'
        ) AND estado NOT IN ('MANTENIMIENTO', 'INACTIVO') THEN 'DISPONIBLE'
        ELSE estado
      END
    `;
    await runQuery(sql);
  }
}
