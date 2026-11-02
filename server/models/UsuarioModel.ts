import { queryAll, queryOne, runQuery } from '../db/database.ts';

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

export class UsuarioModel {
  static async getAll(): Promise<Usuario[]> {
    const sql = `
      SELECT 
        u.id_usuario,
        u.id_docente,
        u.nombre_usuario,
        u.correo,
        u.rol,
        u.estado,
        u.intentos_fallidos,
        u.fecha_creacion,
        u.ultimo_acceso,
        d.nombres || ' ' || d.apellidos AS docente_nombre
      FROM usuario u
      LEFT JOIN docente d ON u.id_docente = d.id_docente
      ORDER BY u.id_usuario
    `;
    return queryAll<Usuario>(sql);
  }

  static async findByUsername(identifier: string): Promise<any | null> {
    if (!identifier) return null;
    const clean = identifier.trim();

    // 1. Buscar primero en tabla usuario
    const sql1 = `
      SELECT 
        u.id_usuario,
        u.id_docente,
        u.nombre_usuario,
        u.clave,
        u.correo,
        u.rol,
        u.estado,
        u.intentos_fallidos,
        u.ultimo_acceso,
        u.fecha_creacion,
        d.nombres || ' ' || d.apellidos AS docente_nombre
      FROM usuario u
      LEFT JOIN docente d ON u.id_docente = d.id_docente
      WHERE LOWER(u.nombre_usuario) = LOWER(?) OR LOWER(u.correo) = LOWER(?)
      LIMIT 1
    `;
    let user = await queryOne<any>(sql1, [clean, clean]);
    if (user) return user;

    // 2. Fallback de búsqueda en tabla usuarios con roles
    const sql2 = `
      SELECT 
        u.id_usuario,
        u.id_docente,
        u.username AS nombre_usuario,
        u.password_hash AS clave,
        u.email AS correo,
        COALESCE(r.nombre, 'OPERADOR') AS rol,
        u.estado,
        u.intentos_fallidos,
        u.ultimo_acceso,
        u.fecha_creacion,
        d.nombres || ' ' || d.apellidos AS docente_nombre
      FROM usuarios u
      LEFT JOIN usuario_roles ur ON u.id_usuario = ur.id_usuario
      LEFT JOIN roles r ON ur.id_rol = r.id_rol
      LEFT JOIN docente d ON u.id_docente = d.id_docente
      WHERE LOWER(u.username) = LOWER(?) OR LOWER(u.email) = LOWER(?)
      LIMIT 1
    `;
    user = await queryOne<any>(sql2, [clean, clean]);
    return user;
  }

  static async updateLastAccess(id: number) {
    await runQuery('UPDATE usuario SET ultimo_acceso = datetime("now") WHERE id_usuario = ?', [id]);
  }
}
