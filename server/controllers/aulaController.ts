import { Request, Response } from 'express';
import { AulaModel } from '../models/AulaModel.ts';

export class AulaController {
  static async list(req: Request, res: Response) {
    try {
      // Sincronizar automáticamente estados para que aulas asignadas figuren como OCUPADO
      await AulaModel.syncAulasOcupadas();

      const { bloque, piso, tipo, estado, sede } = req.query;
      const filters = {
        bloque: bloque ? Number(bloque) : undefined,
        piso: piso ? Number(piso) : undefined,
        tipo: tipo ? String(tipo) : undefined,
        estado: estado ? String(estado) : undefined,
        sede: sede ? Number(sede) : undefined,
      };
      const data = await AulaModel.getAll(filters);
      res.json({ success: true, count: data.length, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async syncEstados(req: Request, res: Response) {
    try {
      await AulaModel.syncAulasOcupadas();
      const aulas = await AulaModel.getAll();
      res.json({ success: true, message: 'Estados de aulas sincronizados con éxito', data: aulas });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const data = await AulaModel.getById(id);
      if (!data) {
        return res.status(404).json({ success: false, message: 'Aula no encontrada' });
      }
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async updateEstado(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const { estado } = req.body;
      const valid = ['DISPONIBLE', 'OCUPADO', 'MANTENIMIENTO', 'INACTIVO'];
      if (!valid.includes(estado)) {
        return res.status(400).json({ success: false, message: `Estado inválido. Debe ser: ${valid.join(', ')}` });
      }
      const ok = await AulaModel.updateEstado(id, estado);
      if (!ok) {
        return res.status(404).json({ success: false, message: 'No se pudo actualizar el aula' });
      }
      res.json({ success: true, message: 'Estado de aula actualizado exitosamente', id, nuevoEstado: estado });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
