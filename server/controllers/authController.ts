import { Request, Response } from 'express';
import { UsuarioModel } from '../models/UsuarioModel.ts';

export const ROLE_PERMISSIONS: Record<string, {
  rol: string;
  canCreateAssignment: boolean;
  canEditAssignment: boolean;
  canDeleteAssignment: boolean;
  canChangeAulaStatus: boolean;
  canExportReports: boolean;
  canManageUsers: boolean;
  description: string;
}> = {
  SUPERADMIN: {
    rol: 'SUPERADMIN',
    canCreateAssignment: true,
    canEditAssignment: true,
    canDeleteAssignment: true,
    canChangeAulaStatus: true,
    canExportReports: true,
    canManageUsers: true,
    description: 'Gobierno total de la plataforma: seguridad institucional, usuarios, roles, auditoría y catálogos.'
  },
  ADMINISTRADOR: {
    rol: 'ADMINISTRADOR',
    canCreateAssignment: true,
    canEditAssignment: true,
    canDeleteAssignment: true,
    canChangeAulaStatus: true,
    canExportReports: true,
    canManageUsers: true,
    description: 'Acceso total y gobierno del sistema (usuarios, roles, auditoría, configuración y reportes).'
  },
  COORDINADOR: {
    rol: 'COORDINADOR',
    canCreateAssignment: true,
    canEditAssignment: true,
    canDeleteAssignment: false,
    canChangeAulaStatus: true,
    canExportReports: true,
    canManageUsers: false,
    description: 'Gestión académica y directiva: diseño curricular, asignación de aulas y exportación de reportes.'
  },
  SECRETARIA: {
    rol: 'SECRETARIA',
    canCreateAssignment: false,
    canEditAssignment: false,
    canDeleteAssignment: false,
    canChangeAulaStatus: false,
    canExportReports: false,
    canManageUsers: false,
    description: 'Gestión administrativa: consulta de información, edición curricular y registro de planificación.'
  },
  OPERADOR: {
    rol: 'OPERADOR',
    canCreateAssignment: false,
    canEditAssignment: true,
    canDeleteAssignment: false,
    canChangeAulaStatus: true,
    canExportReports: false,
    canManageUsers: false,
    description: 'Operación técnica: edición de planificaciones, matriz de horarios y actualización de semáforos de aula.'
  },
  DOCENTE: {
    rol: 'DOCENTE',
    canCreateAssignment: false,
    canEditAssignment: false,
    canDeleteAssignment: false,
    canChangeAulaStatus: false,
    canExportReports: false,
    canManageUsers: false,
    description: 'Perfil docente titular: consulta exclusiva de carga y horarios propios (Ver · propio).'
  },
  INVITADO: {
    rol: 'INVITADO',
    canCreateAssignment: false,
    canEditAssignment: false,
    canDeleteAssignment: false,
    canChangeAulaStatus: false,
    canExportReports: false,
    canManageUsers: false,
    description: 'Consulta pública y transparencia de horarios y catálogos.'
  },
  ESTUDIANTE: {
    rol: 'ESTUDIANTE',
    canCreateAssignment: false,
    canEditAssignment: false,
    canDeleteAssignment: false,
    canChangeAulaStatus: false,
    canExportReports: false,
    canManageUsers: false,
    description: 'Consulta de horarios y datos estudiantiles.'
  },
  AUDITOR: {
    rol: 'AUDITOR',
    canCreateAssignment: false,
    canEditAssignment: false,
    canDeleteAssignment: false,
    canChangeAulaStatus: false,
    canExportReports: true,
    canManageUsers: false,
    description: 'Supervisión de control interno y forense: bitácoras inmutables de auditoría, trazabilidad y reportes analíticos.'
  },
  CONSULTA: {
    rol: 'CONSULTA',
    canCreateAssignment: false,
    canEditAssignment: false,
    canDeleteAssignment: false,
    canChangeAulaStatus: false,
    canExportReports: true,
    canManageUsers: false,
    description: 'Consulta académica especializada: lectura y exportación de catálogos y mallas horarias oficiales.'
  },
  USUARIO_CONSULTA: {
    rol: 'USUARIO_CONSULTA',
    canCreateAssignment: false,
    canEditAssignment: false,
    canDeleteAssignment: false,
    canChangeAulaStatus: false,
    canExportReports: false,
    canManageUsers: false,
    description: 'Consulta pública de catálogos y horarios.'
  }
};

export class AuthController {
  static async listUsers(req: Request, res: Response) {
    try {
      const users = await UsuarioModel.getAll();
      res.json({ success: true, data: users });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const identifier = req.body.username || req.body.email || req.body.correo || '';
      const password = req.body.password || req.body.clave || '';

      if (!identifier) {
        return res.status(400).json({ 
          success: false, 
          message: 'Debe ingresar su nombre de usuario o correo electrónico institucional' 
        });
      }

      const user = await UsuarioModel.findByUsername(identifier);
      if (!user) {
        return res.status(401).json({ 
          success: false, 
          message: 'Usuario o correo electrónico no encontrado en el sistema' 
        });
      }

      if (password && user.clave && user.clave !== password) {
        return res.status(401).json({ 
          success: false, 
          message: 'Contraseña incorrecta. Por favor verifique sus credenciales.' 
        });
      }

      await UsuarioModel.updateLastAccess(user.id_usuario);

      let canonicalRol = 'OPERADOR';
      const uRol = (user.rol || '').toUpperCase();
      const validRoles = [
        'SUPERADMIN', 
        'ADMINISTRADOR', 
        'COORDINADOR', 
        'SECRETARIA', 
        'OPERADOR', 
        'DOCENTE', 
        'INVITADO', 
        'ESTUDIANTE', 
        'USUARIO_CONSULTA'
      ];

      if (validRoles.includes(uRol)) {
        canonicalRol = uRol;
      } else {
        canonicalRol = 'OPERADOR';
      }

      const permissions = ROLE_PERMISSIONS[canonicalRol] || ROLE_PERMISSIONS['OPERADOR'];

      res.json({
        success: true,
        message: 'Sesión iniciada correctamente',
        user: {
          id_usuario: user.id_usuario,
          nombre_usuario: user.nombre_usuario,
          correo: user.correo,
          rol: canonicalRol,
          rolOriginal: user.rol,
          docente_nombre: user.docente_nombre,
          permissions
        }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async switchRole(req: Request, res: Response) {
    try {
      const { rol } = req.body;
      const targetRol = (rol || 'ADMINISTRADOR').toUpperCase();
      const valid = ['ADMINISTRADOR', 'COORDINADOR', 'SECRETARIA', 'OPERADOR', 'DOCENTE'];
      if (!valid.includes(targetRol)) {
        return res.status(400).json({ success: false, message: 'Rol no válido' });
      }

      const permissions = ROLE_PERMISSIONS[targetRol];
      res.json({
        success: true,
        rol: targetRol,
        permissions
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
