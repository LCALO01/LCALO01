import { Request, Response } from 'express';
import { queryAll, runQuery, persistDatabase } from '../db/database.ts';

// Mapa oficial de prefijos de códigos de asignatura a su carrera correspondiente
export const CODIGO_CARRERA_MAP: Record<string, { id_carrera: number; nombre_carrera: string }> = {
  'DESF': { id_carrera: 1, nombre_carrera: 'DESARROLLO DE SOFTWARE' },
  'DES': { id_carrera: 1, nombre_carrera: 'DESARROLLO DE SOFTWARE' },
  'DSW': { id_carrera: 1, nombre_carrera: 'DESARROLLO DE SOFTWARE' },
  'SOF': { id_carrera: 1, nombre_carrera: 'DESARROLLO DE SOFTWARE' },
  'EIN': { id_carrera: 2, nombre_carrera: 'EDUCACIÓN INICIAL' },
  'EDU': { id_carrera: 2, nombre_carrera: 'EDUCACIÓN INICIAL' },
  'ELE': { id_carrera: 3, nombre_carrera: 'ELECTRICIDAD' },
  'ELC': { id_carrera: 3, nombre_carrera: 'ELECTRICIDAD' },
  'DEP': { id_carrera: 4, nombre_carrera: 'ENTRENAMIENTO DEPORTIVO' },
  'EDP': { id_carrera: 4, nombre_carrera: 'ENTRENAMIENTO DEPORTIVO' },
  'ODO': { id_carrera: 5, nombre_carrera: 'ODONTOLOGÍA' },
  'GAS': { id_carrera: 6, nombre_carrera: 'GASTRONOMÍA' },
  'GASU': { id_carrera: 7, nombre_carrera: 'GASTRONOMÍA UNIVERSITARIA' },
  'ENF': { id_carrera: 8, nombre_carrera: 'ENFERMERÍA' },
  'MEC': { id_carrera: 9, nombre_carrera: 'MECÁNICA AUTOMOTRIZ' },
  'AUT': { id_carrera: 9, nombre_carrera: 'MECÁNICA AUTOMOTRIZ' },
  'REFI': { id_carrera: 10, nombre_carrera: 'REHABILITACIÓN FÍSICA' },
  'REF': { id_carrera: 10, nombre_carrera: 'REHABILITACIÓN FÍSICA' },
  'CT': { id_carrera: 11, nombre_carrera: 'CONTABILIDAD Y TRIBUTACIÓN' },
  'CONT': { id_carrera: 12, nombre_carrera: 'TECNOLOGÍA SUPERIOR EN CONTABILIDAD' },
  'GTH': { id_carrera: 13, nombre_carrera: 'GESTIÓN DE TALENTO HUMANO' },
  'ATH': { id_carrera: 13, nombre_carrera: 'GESTIÓN DE TALENTO HUMANO' },
  'ADM': { id_carrera: 14, nombre_carrera: 'TECNOLOGÍA SUPERIOR EN ADMINISTRACIÓN' },
  'GP': { id_carrera: 14, nombre_carrera: 'TECNOLOGÍA SUPERIOR EN ADMINISTRACIÓN' },
  'MARK': { id_carrera: 15, nombre_carrera: 'TECNOLOGÍA SUPERIOR EN MARKETING' },
  'MKT': { id_carrera: 15, nombre_carrera: 'TECNOLOGÍA SUPERIOR EN MARKETING' },
  'EST': { id_carrera: 16, nombre_carrera: 'ESTÉTICA INTEGRAL' },
  'ESTU': { id_carrera: 17, nombre_carrera: 'ESTÉTICA INTEGRAL UNIVERSITARIA' }
};

export function getCarreraOfAsignatura(codigoAsignatura: string): { id_carrera: number; nombre_carrera: string } | null {
  const code = (codigoAsignatura || '').toUpperCase().trim();
  const prefix = code.split('_')[0] || '';
  if (CODIGO_CARRERA_MAP[prefix]) {
    return CODIGO_CARRERA_MAP[prefix];
  }
  // Búsqueda por sub-prefijos
  for (const [key, val] of Object.entries(CODIGO_CARRERA_MAP)) {
    if (code.startsWith(key)) {
      return val;
    }
  }
  return null;
}

export class CarreraAsignaturaController {
  // Inicializar tabla si no existe y poblar si está vacía
  static async initTable(): Promise<void> {
    await runQuery(`
      CREATE TABLE IF NOT EXISTS carrera_asignatura (
        id_carrera INTEGER NOT NULL,
        id_asignatura INTEGER NOT NULL,
        PRIMARY KEY (id_carrera, id_asignatura),
        FOREIGN KEY (id_carrera) REFERENCES carrera(id_carrera) ON DELETE CASCADE,
        FOREIGN KEY (id_asignatura) REFERENCES asignatura(id_asignatura) ON DELETE CASCADE
      );
    `);

    const existing = await queryAll('SELECT COUNT(*) as count FROM carrera_asignatura');
    if (existing[0]?.count === 0) {
      // Sembrar todas las asignaturas a su carrera oficial correspondiente
      const asignaturas = await queryAll('SELECT id_asignatura, codigo_asignatura FROM asignatura');
      for (const a of asignaturas) {
        const info = getCarreraOfAsignatura(a.codigo_asignatura);
        if (info) {
          await runQuery(
            'INSERT OR IGNORE INTO carrera_asignatura (id_carrera, id_asignatura) VALUES (?, ?)',
            [info.id_carrera, a.id_asignatura]
          );
        }
      }
      persistDatabase();
    }
  }

  // Obtener todas las asignaciones
  static async list(req: Request, res: Response) {
    try {
      await CarreraAsignaturaController.initTable();
      const rows = await queryAll(`
        SELECT ca.id_carrera, ca.id_asignatura, 
               c.nombre as carrera_nombre, c.codigo as carrera_codigo,
               a.codigo_asignatura, a.nombre as asignatura_nombre,
               a.creditos, a.horas_totales, a.estado as asignatura_estado
        FROM carrera_asignatura ca
        JOIN carrera c ON ca.id_carrera = c.id_carrera
        JOIN asignatura a ON ca.id_asignatura = a.id_asignatura
        ORDER BY c.nombre, a.nombre
      `);
      res.json({ success: true, data: rows });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Asignar asignatura a carrera CON ESTRICTA VALIDACIÓN
  static async assign(req: Request, res: Response) {
    try {
      await CarreraAsignaturaController.initTable();
      const { id_carrera, id_asignatura } = req.body;

      if (!id_carrera || !id_asignatura) {
        return res.status(400).json({ 
          success: false, 
          message: 'Se requiere id_carrera y id_asignatura' 
        });
      }

      // Obtener datos de la carrera y asignatura
      const carrera = await queryAll('SELECT id_carrera, codigo, nombre FROM carrera WHERE id_carrera = ?', [id_carrera]);
      const asignatura = await queryAll('SELECT id_asignatura, codigo_asignatura, nombre FROM asignatura WHERE id_asignatura = ?', [id_asignatura]);

      if (!carrera.length) {
        return res.status(404).json({ success: false, message: 'Carrera no encontrada' });
      }
      if (!asignatura.length) {
        return res.status(404).json({ success: false, message: 'Asignatura no encontrada' });
      }

      const cObj = carrera[0];
      const aObj = asignatura[0];

      // VALIDACIÓN ESTRICTA: ¿Pertenece la asignatura a esta carrera?
      const carreraValida = getCarreraOfAsignatura(aObj.codigo_asignatura);
      if (carreraValida && carreraValida.id_carrera !== Number(id_carrera)) {
        return res.status(403).json({
          success: false,
          error_code: 'CURRICULAR_MISMATCH',
          message: `¡ALERTA CRÍTICA! La asignatura [${aObj.codigo_asignatura}] ${aObj.nombre} pertenece formalmente a la carrera '${carreraValida.nombre_carrera}'. Por nada del mundo puede ser asignada a '${cObj.nombre}'.`,
          asignatura: aObj,
          carrera_solicitada: cObj,
          carrera_correcta: carreraValida
        });
      }

      // Si es válida, registrar
      await runQuery(
        'INSERT OR IGNORE INTO carrera_asignatura (id_carrera, id_asignatura) VALUES (?, ?)',
        [id_carrera, id_asignatura]
      );
      persistDatabase();

      res.json({
        success: true,
        message: `Asignatura [${aObj.codigo_asignatura}] ${aObj.nombre} asignada exitosamente a ${cObj.nombre}`,
        data: { id_carrera, id_asignatura }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Retirar asignatura de una carrera
  static async unassign(req: Request, res: Response) {
    try {
      await CarreraAsignaturaController.initTable();
      const { id_carrera, id_asignatura } = req.body;

      await runQuery(
        'DELETE FROM carrera_asignatura WHERE id_carrera = ? AND id_asignatura = ?',
        [id_carrera, id_asignatura]
      );
      persistDatabase();

      res.json({ success: true, message: 'Asignatura retirada de la carrera' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Retirar todas las asignaturas de una carrera
  static async unassignAll(req: Request, res: Response) {
    try {
      await CarreraAsignaturaController.initTable();
      const { id_carrera } = req.params;

      await runQuery(
        'DELETE FROM carrera_asignatura WHERE id_carrera = ?',
        [id_carrera]
      );
      persistDatabase();

      res.json({ success: true, message: 'Todas las asignaturas de la carrera han sido retiradas' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
