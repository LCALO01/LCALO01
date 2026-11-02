import { Request, Response } from 'express';
import { CatalogoModel } from '../models/CatalogoModel.ts';
import { UsuarioModel } from '../models/UsuarioModel.ts';

export class CatalogoController {
  static async getAll(req: Request, res: Response) {
    try {
      const [
        sedes,
        escuelas,
        carreras,
        asignaturas,
        docentes,
        niveles,
        paralelos,
        jornadas,
        bloques,
        periodos,
        feriados,
        diasSemana,
        usuarios,
        horas
      ] = await Promise.all([
        CatalogoModel.getSedes(),
        CatalogoModel.getEscuelas(),
        CatalogoModel.getCarreras(),
        CatalogoModel.getAsignaturas(),
        CatalogoModel.getDocentes(),
        CatalogoModel.getNiveles(),
        CatalogoModel.getParalelos(),
        CatalogoModel.getJornadas(),
        CatalogoModel.getBloques(),
        CatalogoModel.getPeriodos(),
        CatalogoModel.getFeriados(),
        CatalogoModel.getDiasSemana(),
        UsuarioModel.getAll(),
        CatalogoModel.getHoras()
      ]);

      res.json({
        success: true,
        data: {
          sedes,
          escuelas,
          carreras,
          asignaturas,
          docentes,
          niveles,
          paralelos,
          jornadas,
          bloques,
          periodos,
          feriados,
          diasSemana,
          usuarios,
          horas
        }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
