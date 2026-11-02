import { Request, Response } from 'express';
import { runQuery, queryOne, queryAll } from '../db/database.ts';

type ValidEntity = 
  | 'docente' 
  | 'asignatura' 
  | 'carrera' 
  | 'periodo' 
  | 'feriado' 
  | 'sede' 
  | 'escuela' 
  | 'nivel' 
  | 'paralelo' 
  | 'jornada'
  | 'bloque'
  | 'aula'
  | 'hora';

interface EntityConfig {
  tableName: string;
  idField: string;
  nameField: string;
  allowedFields: string[];
  requiredFields: string[];
  checkReferences?: (id: number) => Promise<string | null>;
}

const ENTITY_CONFIGS: Record<string, EntityConfig> = {
  docente: {
    tableName: 'docente',
    idField: 'id_docente',
    nameField: 'nombres',
    allowedFields: ['ci', 'nombres', 'apellidos', 'correo', 'telefono', 'titulo_academico', 'especialidad', 'tipo_contrato', 'estado'],
    requiredFields: ['ci', 'nombres', 'apellidos', 'correo'],
    checkReferences: async (id) => {
      const plan = await queryOne('SELECT id_planificacion FROM planificacion_academica WHERE id_docente = ? LIMIT 1', [id]);
      if (plan) return 'No se puede eliminar el docente porque tiene cursos/planificaciones asignadas. Puede desactivarlo cambiando su estado a INACTIVO.';
      return null;
    }
  },
  asignatura: {
    tableName: 'asignatura',
    idField: 'id_asignatura',
    nameField: 'nombre',
    allowedFields: ['codigo_asignatura', 'nombre', 'descripcion', 'horas_docencia', 'horas_practicas', 'horas_autonomas', 'horas_totales', 'creditos', 'estado'],
    requiredFields: ['codigo_asignatura', 'nombre'],
    checkReferences: async (id) => {
      const plan = await queryOne('SELECT id_planificacion FROM planificacion_academica WHERE id_asignatura = ? LIMIT 1', [id]);
      if (plan) return 'No se puede eliminar la asignatura porque está asignada en planificaciones vigentes. Puede cambiar su estado a INACTIVA.';
      return null;
    }
  },
  carrera: {
    tableName: 'carrera',
    idField: 'id_carrera',
    nameField: 'nombre',
    allowedFields: ['id_escuela', 'codigo', 'nombre', 'titulo_otorgado', 'modalidad', 'duracion_niveles', 'numero_semanas', 'estado'],
    requiredFields: ['id_escuela', 'codigo', 'nombre', 'modalidad', 'duracion_niveles'],
    checkReferences: async (id) => {
      const plan = await queryOne('SELECT id_planificacion FROM planificacion_academica WHERE id_carrera = ? LIMIT 1', [id]);
      if (plan) return 'No se puede eliminar la carrera porque tiene asignaciones en la planificación académica.';
      return null;
    }
  },
  periodo: {
    tableName: 'periodo_academico',
    idField: 'id_periodo',
    nameField: 'nombre',
    allowedFields: ['codigo', 'nombre', 'fecha_inicio', 'fecha_fin', 'descripcion', 'estado'],
    requiredFields: ['codigo', 'nombre', 'fecha_inicio', 'fecha_fin'],
    checkReferences: async (id) => {
      const plan = await queryOne('SELECT id_planificacion FROM planificacion_academica WHERE id_periodo = ? LIMIT 1', [id]);
      if (plan) return 'No se puede eliminar el periodo porque contiene planificaciones académicas registradas.';
      return null;
    }
  },
  feriado: {
    tableName: 'feriado',
    idField: 'id_feriado',
    nameField: 'nombre',
    allowedFields: ['codigo', 'nombre', 'desde', 'hasta', 'id_periodo', 'descripcion', 'estado'],
    requiredFields: ['codigo', 'nombre', 'desde', 'hasta'],
    checkReferences: async () => null
  },
  sede: {
    tableName: 'sede',
    idField: 'id_sede',
    nameField: 'nombre',
    allowedFields: ['codigo', 'nombre', 'ciudad', 'provincia', 'direccion', 'telefono', 'correo', 'estado'],
    requiredFields: ['codigo', 'nombre', 'ciudad', 'provincia'],
    checkReferences: async (id) => {
      const esc = await queryOne('SELECT id_escuela FROM escuela WHERE id_sede = ? LIMIT 1', [id]);
      if (esc) return 'No se puede eliminar la sede porque contiene escuelas académicas asociadas.';
      const bloq = await queryOne('SELECT id_bloque FROM bloque WHERE id_sede = ? LIMIT 1', [id]);
      if (bloq) return 'No se puede eliminar la sede porque tiene bloques arquitectónicos registrados.';
      return null;
    }
  },
  escuela: {
    tableName: 'escuela',
    idField: 'id_escuela',
    nameField: 'nombre',
    allowedFields: ['id_sede', 'codigo', 'nombre', 'descripcion', 'estado'],
    requiredFields: ['id_sede', 'codigo', 'nombre'],
    checkReferences: async (id) => {
      const car = await queryOne('SELECT id_carrera FROM carrera WHERE id_escuela = ? LIMIT 1', [id]);
      if (car) return 'No se puede eliminar la escuela porque tiene carreras profesionales registradas.';
      return null;
    }
  },
  nivel: {
    tableName: 'nivel',
    idField: 'id_nivel',
    nameField: 'nombre',
    allowedFields: ['numero', 'nombre', 'descripcion', 'estado'],
    requiredFields: ['numero', 'nombre'],
    checkReferences: async (id) => {
      const plan = await queryOne('SELECT id_planificacion FROM planificacion_academica WHERE id_nivel = ? LIMIT 1', [id]);
      if (plan) return 'No se puede eliminar el nivel porque está asignado en planificaciones académicas.';
      return null;
    }
  },
  paralelo: {
    tableName: 'paralelo',
    idField: 'id_paralelo',
    nameField: 'codigo',
    allowedFields: ['codigo', 'descripcion', 'cupo_maximo', 'estado'],
    requiredFields: ['codigo'],
    checkReferences: async (id) => {
      const plan = await queryOne('SELECT id_planificacion FROM planificacion_academica WHERE id_paralelo = ? LIMIT 1', [id]);
      if (plan) return 'No se puede eliminar el paralelo porque contiene planificaciones asignadas.';
      return null;
    }
  },
  jornada: {
    tableName: 'jornada',
    idField: 'id_jornada',
    nameField: 'nombre',
    allowedFields: ['codigo', 'nombre', 'hora_inicio', 'hora_fin', 'estado'],
    requiredFields: ['codigo', 'nombre'],
    checkReferences: async (id) => {
      const plan = await queryOne('SELECT id_planificacion FROM planificacion_academica WHERE id_jornada = ? LIMIT 1', [id]);
      if (plan) return 'No se puede eliminar la jornada porque tiene horarios asignados en la planificación.';
      return null;
    }
  },
  bloque: {
    tableName: 'bloque',
    idField: 'id_bloque',
    nameField: 'nombre',
    allowedFields: ['id_sede', 'codigo', 'nombre', 'descripcion', 'numero_pisos', 'estado'],
    requiredFields: ['id_sede', 'codigo', 'nombre'],
    checkReferences: async (id) => {
      const aula = await queryOne('SELECT id_aula_laboratorio FROM aula_laboratorio WHERE id_bloque = ? LIMIT 1', [id]);
      if (aula) return 'No se puede eliminar el bloque porque tiene aulas o laboratorios asociados. Puede cambiar su estado a INACTIVO.';
      return null;
    }
  },
  aula: {
    tableName: 'aula_laboratorio',
    idField: 'id_aula_laboratorio',
    nameField: 'nombre',
    allowedFields: ['id_bloque', 'codigo', 'nombre', 'tipo', 'capacidad', 'piso', 'recursos', 'estado'],
    requiredFields: ['id_bloque', 'codigo', 'nombre', 'tipo', 'capacidad', 'piso'],
    checkReferences: async (id) => {
      const plan = await queryOne('SELECT id_planificacion FROM planificacion_academica WHERE id_aula_laboratorio = ? LIMIT 1', [id]);
      if (plan) return 'No se puede eliminar el aula porque tiene horarios asignados en la planificación académica. Puede cambiar su estado a MANTENIMIENTO o INACTIVO.';
      return null;
    }
  },
  hora: {
    tableName: 'hora',
    idField: 'id_hora',
    nameField: 'nombre',
    allowedFields: ['codigo', 'nombre', 'hora_inicio', 'hora_fin', 'id_jornada', 'orden', 'estado'],
    requiredFields: ['codigo', 'nombre', 'hora_inicio', 'hora_fin'],
    checkReferences: async () => null
  }
};

export class CatalogoCrudController {
  private static getConfig(entityParam: string): EntityConfig | null {
    // Normalizar plural a singular o alias
    const key = entityParam.toLowerCase().trim();
    if (ENTITY_CONFIGS[key]) return ENTITY_CONFIGS[key];
    
    // Plurales comunes
    const map: Record<string, string> = {
      'docentes': 'docente',
      'asignaturas': 'asignatura',
      'carreras': 'carrera',
      'periodos': 'periodo',
      'feriados': 'feriado',
      'sedes': 'sede',
      'escuelas': 'escuela',
      'niveles': 'nivel',
      'paralelos': 'paralelo',
      'jornadas': 'jornada',
      'bloques': 'bloque',
      'aulas': 'aula',
      'aula_laboratorio': 'aula',
      'horas': 'hora'
    };
    const mapped = map[key];
    return mapped && ENTITY_CONFIGS[mapped] ? ENTITY_CONFIGS[mapped] : null;
  }

  // GET /api/catalogos/:entity
  static async list(req: Request, res: Response) {
    try {
      const config = CatalogoCrudController.getConfig(req.params.entity);
      if (!config) {
        return res.status(400).json({ success: false, message: `Catálogo '${req.params.entity}' no reconocido.` });
      }

      const rows = await queryAll(`SELECT * FROM ${config.tableName} ORDER BY ${config.idField} DESC`);
      res.json({ success: true, count: rows.length, data: rows });
    } catch (error: any) {
      console.error('Error listando catálogo:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // POST /api/catalogos/:entity
  static async create(req: Request, res: Response) {
    try {
      const config = CatalogoCrudController.getConfig(req.params.entity);
      if (!config) {
        return res.status(400).json({ success: false, message: `Catálogo '${req.params.entity}' no reconocido.` });
      }

      const body = req.body || {};

      // Validar campos requeridos
      for (const field of config.requiredFields) {
        if (body[field] === undefined || body[field] === null || body[field] === '') {
          return res.status(400).json({
            success: false,
            message: `El campo requerido '${field}' no puede estar vacío.`
          });
        }
      }

      // Si es asignatura y se mandan horas, calcular horas_totales automáticamente
      if (config.tableName === 'asignatura') {
        const hDoc = Number(body.horas_docencia) || 0;
        const hPrac = Number(body.horas_practicas) || 0;
        const hAut = Number(body.horas_autonomas) || 0;
        if (!body.horas_totales) {
          body.horas_totales = hDoc + hPrac + hAut;
        }
      }

      // Construir columnas e insert
      const insertCols: string[] = [];
      const insertPlaceholders: string[] = [];
      const insertValues: any[] = [];

      for (const field of config.allowedFields) {
        if (body[field] !== undefined) {
          insertCols.push(field);
          insertPlaceholders.push('?');
          insertValues.push(body[field]);
        }
      }

      if (insertCols.length === 0) {
        return res.status(400).json({ success: false, message: 'No se enviaron datos válidos para registrar.' });
      }

      const sql = `INSERT INTO ${config.tableName} (${insertCols.join(', ')}) VALUES (${insertPlaceholders.join(', ')})`;
      const result = await runQuery(sql, insertValues);

      const createdItem = await queryOne(
        `SELECT * FROM ${config.tableName} WHERE ${config.idField} = ?`,
        [result.lastInsertRowid]
      );

      res.status(201).json({
        success: true,
        message: 'Registro creado con éxito.',
        data: createdItem
      });
    } catch (error: any) {
      console.error('Error creando registro en catálogo:', error);
      // SQLite UNIQUE constraint failure handling
      if (error.message && error.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({
          success: false,
          message: 'Error de unicidad: Ya existe un registro con el mismo código, CI o nombre.'
        });
      }
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // PUT /api/catalogos/:entity/:id
  static async update(req: Request, res: Response) {
    try {
      const config = CatalogoCrudController.getConfig(req.params.entity);
      if (!config) {
        return res.status(400).json({ success: false, message: `Catálogo '${req.params.entity}' no reconocido.` });
      }

      const id = Number(req.params.id);
      if (!id) {
        return res.status(400).json({ success: false, message: 'Identificador ID no válido.' });
      }

      // Verificar que el registro exista
      const existing = await queryOne(`SELECT * FROM ${config.tableName} WHERE ${config.idField} = ?`, [id]);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'El registro no fue encontrado.' });
      }

      const body = req.body || {};

      // Si es asignatura, recalcular horas_totales
      if (config.tableName === 'asignatura') {
        const hDoc = body.horas_docencia !== undefined ? Number(body.horas_docencia) : existing.horas_docencia;
        const hPrac = body.horas_practicas !== undefined ? Number(body.horas_practicas) : existing.horas_practicas;
        const hAut = body.horas_autonomas !== undefined ? Number(body.horas_autonomas) : existing.horas_autonomas;
        body.horas_totales = (hDoc || 0) + (hPrac || 0) + (hAut || 0);
      }

      const updateCols: string[] = [];
      const updateValues: any[] = [];

      for (const field of config.allowedFields) {
        if (body[field] !== undefined) {
          updateCols.push(`${field} = ?`);
          updateValues.push(body[field]);
        }
      }

      if (updateCols.length === 0) {
        return res.status(400).json({ success: false, message: 'No se enviaron campos para actualizar.' });
      }

      updateValues.push(id);
      const sql = `UPDATE ${config.tableName} SET ${updateCols.join(', ')} WHERE ${config.idField} = ?`;
      await runQuery(sql, updateValues);

      const updatedItem = await queryOne(
        `SELECT * FROM ${config.tableName} WHERE ${config.idField} = ?`,
        [id]
      );

      res.json({
        success: true,
        message: 'Registro actualizado correctamente.',
        data: updatedItem
      });
    } catch (error: any) {
      console.error('Error actualizando registro:', error);
      if (error.message && error.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({
          success: false,
          message: 'Error de unicidad: Ya existe otro registro con el mismo código, CI o nombre.'
        });
      }
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // PATCH /api/catalogos/:entity/:id/estado
  static async toggleEstado(req: Request, res: Response) {
    try {
      const config = CatalogoCrudController.getConfig(req.params.entity);
      if (!config) {
        return res.status(400).json({ success: false, message: `Catálogo '${req.params.entity}' no reconocido.` });
      }

      const id = Number(req.params.id);
      const existing = await queryOne(`SELECT * FROM ${config.tableName} WHERE ${config.idField} = ?`, [id]);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'El registro no fue encontrado.' });
      }

      let nuevoEstado = req.body?.estado;
      if (!nuevoEstado) {
        // Toggle por defecto
        const current = String(existing.estado || '').toUpperCase();
        if (current.includes('ACT')) {
          nuevoEstado = current.endsWith('A') ? 'INACTIVA' : 'INACTIVO';
        } else {
          nuevoEstado = current.endsWith('A') ? 'ACTIVA' : 'ACTIVO';
        }
      }

      await runQuery(
        `UPDATE ${config.tableName} SET estado = ? WHERE ${config.idField} = ?`,
        [nuevoEstado, id]
      );

      res.json({
        success: true,
        message: `Estado actualizado a ${nuevoEstado}.`,
        nuevoEstado
      });
    } catch (error: any) {
      console.error('Error alternando estado:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // DELETE /api/catalogos/:entity/:id
  static async delete(req: Request, res: Response) {
    try {
      const config = CatalogoCrudController.getConfig(req.params.entity);
      if (!config) {
        return res.status(400).json({ success: false, message: `Catálogo '${req.params.entity}' no reconocido.` });
      }

      const id = Number(req.params.id);
      const existing = await queryOne(`SELECT * FROM ${config.tableName} WHERE ${config.idField} = ?`, [id]);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'El registro no existe o ya fue eliminado.' });
      }

      // Validar referencias foráneas
      if (config.checkReferences) {
        const referenceError = await config.checkReferences(id);
        if (referenceError) {
          return res.status(409).json({
            success: false,
            message: referenceError
          });
        }
      }

      await runQuery(`DELETE FROM ${config.tableName} WHERE ${config.idField} = ?`, [id]);

      res.json({
        success: true,
        message: 'Registro eliminado exitosamente.'
      });
    } catch (error: any) {
      console.error('Error eliminando registro:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
