import { queryAll } from '../db/database.ts';

export class CatalogoModel {
  static async getSedes() {
    return queryAll('SELECT * FROM sede ORDER BY nombre');
  }

  static async getEscuelas() {
    return queryAll('SELECT * FROM escuela ORDER BY codigo');
  }

  static async getCarreras() {
    return queryAll('SELECT * FROM carrera ORDER BY codigo');
  }

  static async getAsignaturas() {
    return queryAll(`
      SELECT a.*, ca.id_carrera, c.nombre AS carrera_nombre, c.codigo AS carrera_codigo
      FROM asignatura a
      LEFT JOIN carrera_asignatura ca ON a.id_asignatura = ca.id_asignatura
      LEFT JOIN carrera c ON ca.id_carrera = c.id_carrera
      ORDER BY a.nombre
    `);
  }

  static async getDocentes() {
    return queryAll('SELECT * FROM docente ORDER BY apellidos, nombres');
  }

  static async getNiveles() {
    return queryAll('SELECT * FROM nivel ORDER BY numero');
  }

  static async getParalelos() {
    return queryAll('SELECT * FROM paralelo ORDER BY codigo');
  }

  static async getJornadas() {
    return queryAll('SELECT * FROM jornada ORDER BY hora_inicio');
  }

  static async getBloques() {
    return queryAll(`
      SELECT b.*, s.nombre AS sede_nombre,
        (SELECT COUNT(*) FROM aula_laboratorio a WHERE a.id_bloque = b.id_bloque) AS aulas_count
      FROM bloque b
      LEFT JOIN sede s ON b.id_sede = s.id_sede
      ORDER BY b.codigo
    `);
  }

  static async getPeriodos() {
    return queryAll('SELECT * FROM periodo_academico ORDER BY fecha_inicio DESC');
  }

  static async getFeriados() {
    return queryAll('SELECT * FROM feriado ORDER BY desde');
  }

  static async getDiasSemana() {
    return queryAll('SELECT * FROM dia_semana ORDER BY orden');
  }

  static async getHoras() {
    return queryAll(`
      SELECT h.*, j.nombre AS jornada_nombre, j.codigo AS jornada_codigo
      FROM hora h
      LEFT JOIN jornada j ON h.id_jornada = j.id_jornada
      ORDER BY h.hora_inicio, h.orden
    `);
  }
}
