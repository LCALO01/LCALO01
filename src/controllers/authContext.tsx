import React, { createContext, useContext, useState } from 'react';
import { UserSession, RoleType, UserPermissions, SystemModule, INSTITUTIONAL_RBAC_MATRIX, ModulePermissionRule } from '../types.ts';
import { ApiClient } from './apiClient.ts';

const ROLE_DESCRIPTIONS: Record<RoleType, string> = {
  SUPERADMIN: '🔴 Superadministrador: Gobierno total de la plataforma: administración integral de usuarios, asignación de roles y permisos, auditoría inmutable, catálogos, docentes, estudiantes, planificación y reportes.',
  ADMINISTRADOR: '🟠 Administrador: Gestión operativa institucional: CRUD y exportación en catálogos, docentes, estudiantes, planificación y horarios; creación, lectura y actualización de usuarios; auditoría y reportes.',
  COORDINADOR: '🟡 Coordinador: Gestión curricular y académica: creación, lectura, actualización y exportación en catálogos, docentes, estudiantes, planificación y horarios; exportación de reportes.',
  OPERADOR: '🟢 Operador: Operación técnica y física: gestión integral de aulas, bloques, laboratorios, semáforo de asignación e inventario de espacios.',
  DOCENTE: '🔵 Docente: Perfil docente titular: lectura de catálogos; acceso y actualización a sus datos y clases asignadas; consulta de su horario propio y reportes personales.',
  AUDITOR: '🟣 Auditor: Supervisión de control interno y forense: acceso inmutable a logs de eventos, trazabilidad de cambios, auditoría de seguridad y exportación de reportes analíticos.',
  CONDULTA: '🟤 Condulta / Consulta: Consulta y visualización institucional de horarios, catálogos y reportes oficiales sin privilegios de modificación de datos.',
  INVITADO: '⚪ Invitado: Acceso de consulta pública y transparencia: visualización limitada del dashboard, lectura de catálogos y consulta pública de horarios.',
  CONSULTA: '🟤 Consulta: Consulta académica especializada: lectura y exportación de catálogos y mallas horarias sin privilegios de edición de datos.',
  ESTUDIANTE: 'Perfil estudiantil: consulta de catálogos y docentes; acceso y actualización a su ficha personal y consulta de horarios y reportes propios.',
  USUARIO_CONSULTA: '🟤 Consulta: Acceso de consulta pública y transparencia: lectura de catálogos, visualización y exportación de horarios académicos, y consulta de reportes.',
  SECRETARIA: 'Gestión administrativa: consulta y edición de mallas, matrículas, paralelos y asistencia curricular.'
};

export function buildPermissionsForRole(rol: RoleType, customOverrides?: Record<string, Partial<ModulePermissionRule>>): UserPermissions {
  const baseModules = INSTITUTIONAL_RBAC_MATRIX[rol] || INSTITUTIONAL_RBAC_MATRIX.ADMINISTRADOR;
  
  // Clone all authoritative and compatibility modules to avoid mutating base matrix
  const modules: Record<SystemModule, ModulePermissionRule> = {
    catalogos: { ...baseModules.catalogos },
    docentes: { ...baseModules.docentes },
    estudiantes: { ...baseModules.estudiantes },
    planificacion_horarios: { ...baseModules.planificacion_horarios },
    usuarios: { ...baseModules.usuarios },
    roles_permisos: { ...baseModules.roles_permisos },
    auditoria: { ...baseModules.auditoria },
    reportes: { ...baseModules.reportes },
    dashboard: { ...baseModules.dashboard },
    seguridad: { ...baseModules.seguridad },
    academico: { ...baseModules.academico },
    planificacion: { ...baseModules.planificacion },
    horario: { ...baseModules.horario },
    asignacion_aulas: { ...baseModules.asignacion_aulas },
  };

  // Merge any custom user overrides
  if (customOverrides) {
    Object.entries(customOverrides).forEach(([modKey, rules]) => {
      const moduleName = modKey as SystemModule;
      if (modules[moduleName] && rules) {
        modules[moduleName] = {
          ...modules[moduleName],
          ...rules,
        };
      }
      // Keep aliases in sync with custom overrides
      if (modKey === 'catalogos' && rules) {
        if (modules.academico) modules.academico = { ...modules.academico, ...rules };
      }
      if (modKey === 'planificacion_horarios' && rules) {
        if (modules.planificacion) modules.planificacion = { ...modules.planificacion, ...rules };
        if (modules.horario) modules.horario = { ...modules.horario, ...rules };
        if (modules.asignacion_aulas) modules.asignacion_aulas = { ...modules.asignacion_aulas, ...rules };
      }
      if (modKey === 'usuarios' && rules) {
        if (modules.seguridad) modules.seguridad = { ...modules.seguridad, ...rules };
      }
    });
  }

  return {
    rol,
    modules,
    canCreateAssignment: !!modules.planificacion_horarios?.crear || !!modules.asignacion_aulas?.crear,
    canEditAssignment: !!modules.planificacion_horarios?.editar || !!modules.asignacion_aulas?.editar,
    canDeleteAssignment: !!modules.planificacion_horarios?.eliminar || !!modules.asignacion_aulas?.eliminar,
    canChangeAulaStatus: !!modules.planificacion_horarios?.editar || !!modules.asignacion_aulas?.editar,
    canExportReports: !!modules.reportes?.exportar,
    canManageUsers: !!modules.usuarios?.administrar || !!modules.usuarios?.crear || !!modules.seguridad?.crear,
    description: ROLE_DESCRIPTIONS[rol] || 'Usuario del sistema'
  };
}

export interface AccountInfo {
  id_usuario?: number;
  username: string; 
  label: string; 
  role: RoleType; 
  email: string;
  defaultPassword?: string;
  id_docente?: number;
  docente_nombre?: string;
}

interface AuthContextType {
  user: UserSession;
  isAuthenticated: boolean;
  setRole: (rol: RoleType) => void;
  login: (identifier: string, password?: string) => Promise<{ success: boolean; message?: string }>;
  loginAs: (username: string) => Promise<void>;
  loginAsProfile: (role: RoleType) => Promise<void>;
  logout: () => void;
  availableAccounts: AccountInfo[];
  refreshAccounts: () => Promise<void>;
  refreshSession: () => Promise<void>;
  canAccess: (module: SystemModule) => boolean;
  can: (module: SystemModule, action: 'ver' | 'crear' | 'editar' | 'eliminar' | 'bloquear' | 'exportar') => boolean;
  isOwnOnly: (module: SystemModule) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'isuj_auth_session_v2';

const DEFAULT_ACCOUNTS: AccountInfo[] = [
  { 
    id_usuario: 1,
    username: 'superadmin', 
    label: 'Superadministrador General', 
    role: 'SUPERADMIN', 
    email: 'superadmin@isuj.edu.ec',
    defaultPassword: 'super123'
  },
  { 
    id_usuario: 2,
    username: 'admin', 
    label: 'Administrador del Sistema', 
    role: 'ADMINISTRADOR', 
    email: 'admin@isuj.edu.ec',
    defaultPassword: 'admin123'
  },
  { 
    id_usuario: 3,
    username: 'coordinador', 
    label: 'Coordinación Académica', 
    role: 'COORDINADOR', 
    email: 'coordinacion@isuj.edu.ec',
    defaultPassword: 'coord123'
  },
  { 
    id_usuario: 7,
    username: 'operador', 
    label: 'Operador de Infraestructura', 
    role: 'OPERADOR', 
    email: 'operador@isuj.edu.ec',
    defaultPassword: 'oper123'
  },
  { 
    id_usuario: 4,
    username: 'mfajardo', 
    label: 'Docente Titular (Mario Fajardo)', 
    role: 'DOCENTE', 
    email: 'mario.fajardo@isuj.edu.ec',
    defaultPassword: 'docente1',
    id_docente: 1,
    docente_nombre: 'Ing. Mario Fernando Fajardo Vanegas'
  },
  { 
    id_usuario: 9,
    username: 'invitado', 
    label: 'Usuario Invitado', 
    role: 'INVITADO', 
    email: 'invitado@isuj.edu.ec',
    defaultPassword: 'invitado123'
  },
  { 
    id_usuario: 11,
    username: 'auditor', 
    label: 'Auditor Forense / Control Interno', 
    role: 'AUDITOR', 
    email: 'auditor@isuj.edu.ec',
    defaultPassword: 'auditor123'
  },
  { 
    id_usuario: 6,
    username: 'consulta', 
    label: 'Usuario Consulta Académica', 
    role: 'CONSULTA', 
    email: 'consulta@isuj.edu.ec',
    defaultPassword: 'consulta123'
  },
  { 
    id_usuario: 5,
    username: 'estudiante', 
    label: 'Estudiante Regular', 
    role: 'ESTUDIANTE', 
    email: 'estudiante@isuj.edu.ec',
    defaultPassword: 'estud123'
  },
  { 
    id_usuario: 8,
    username: 'secretaria', 
    label: 'Secretaría General', 
    role: 'SECRETARIA', 
    email: 'secretaria@isuj.edu.ec',
    defaultPassword: 'secre123'
  }
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [availableAccounts, setAvailableAccounts] = useState<AccountInfo[]>(DEFAULT_ACCOUNTS);

  // Inicializar sesión desde localStorage si existe
  const [sessionState, setSessionState] = useState<{ user: UserSession; isAuthenticated: boolean }>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.rol) {
            return {
              user: {
                ...parsed,
                permissions: buildPermissionsForRole(parsed.rol, parsed.overrides)
              },
              isAuthenticated: true
            };
          }
        }
      } catch (_) {}
    }
    // Estado por defecto: usuario invitado sin autenticar o primer login
    return {
      user: {
        id_usuario: 1,
        nombre_usuario: 'superadmin',
        correo: 'superadmin@isuj.edu.ec',
        rol: 'SUPERADMIN',
        rolOriginal: 'SUPERADMIN',
        permissions: buildPermissionsForRole('SUPERADMIN')
      },
      isAuthenticated: false
    };
  });

  const [user, setUser] = useState<UserSession>(sessionState.user);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(sessionState.isAuthenticated);

  const saveSession = (sessionUser: UserSession, overrides?: Record<string, any>) => {
    setUser(sessionUser);
    setIsAuthenticated(true);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          id_usuario: sessionUser.id_usuario,
          id_docente: sessionUser.id_docente,
          docente_nombre: sessionUser.docente_nombre,
          nombre_usuario: sessionUser.nombre_usuario,
          correo: sessionUser.correo,
          rol: sessionUser.rol,
          rolOriginal: sessionUser.rolOriginal,
          overrides
        }));
      } catch (_) {}
    }
  };

  const logout = () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (_) {}
    }
    setIsAuthenticated(false);
  };

  const login = async (identifier: string, password?: string): Promise<{ success: boolean; message?: string }> => {
    const cleanId = (identifier || '').trim();
    const cleanPass = (password || '').trim();

    if (!cleanId) {
      return { success: false, message: 'Ingrese su nombre de usuario o correo electrónico' };
    }

    try {
      const logged = await ApiClient.login(cleanId, cleanPass);
      const canonicalRol = (logged.rol as RoleType) in INSTITUTIONAL_RBAC_MATRIX 
        ? (logged.rol as RoleType) 
        : 'DOCENTE';

      let overrides: Record<string, any> | undefined;
      try {
        const permsRes = await fetch(`/api/seguridad/usuarios/${logged.id_usuario}/permisos`).then(r => r.json());
        if (permsRes?.success && permsRes.data?.hasOverrides) {
          overrides = permsRes.data.overrides;
        }
      } catch (_) {}

      const sessionUser: UserSession = {
        ...logged,
        rol: canonicalRol,
        permissions: buildPermissionsForRole(canonicalRol, overrides)
      };

      saveSession(sessionUser, overrides);
      return { success: true };
    } catch (err: any) {
      // Fallback local con cuentas conocidas si la API devuelve error o está en modo offline
      const match = availableAccounts.find(
        a => a.username.toLowerCase() === cleanId.toLowerCase() || a.email.toLowerCase() === cleanId.toLowerCase()
      );

      if (match) {
        if (cleanPass && match.defaultPassword && cleanPass !== match.defaultPassword) {
          return { success: false, message: 'Contraseña incorrecta. Por favor verifique sus datos.' };
        }

        const sessionUser: UserSession = {
          id_usuario: match.id_usuario || match.id_docente || 1,
          id_docente: match.id_docente,
          docente_nombre: match.docente_nombre,
          nombre_usuario: match.username,
          correo: match.email,
          rol: match.role,
          rolOriginal: match.role,
          permissions: buildPermissionsForRole(match.role)
        };

        saveSession(sessionUser);
        return { success: true };
      }

      return { success: false, message: err.message || 'Usuario o correo no registrado en el sistema' };
    }
  };

  const loginAsProfile = async (targetRole: RoleType) => {
    const account = availableAccounts.find(a => a.role === targetRole) || availableAccounts[0];
    if (account) {
      await login(account.username, account.defaultPassword);
    } else {
      setRole(targetRole);
      setIsAuthenticated(true);
    }
  };

  const loginAs = async (username: string) => {
    await login(username);
  };

  const setRole = (rol: RoleType) => {
    setUser(prev => {
      const perms = buildPermissionsForRole(rol);
      const isDoc = rol === 'DOCENTE';
      return {
        ...prev,
        rol,
        id_docente: isDoc ? 1 : prev.id_docente,
        docente_nombre: isDoc ? 'Ing. Mario Fernando Fajardo Vanegas' : prev.docente_nombre,
        permissions: perms
      };
    });
  };

  const refreshAccounts = async () => {
    try {
      const res = await fetch('/api/seguridad/usuarios');
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        const mapped: AccountInfo[] = json.data.map((u: any) => ({
          id_usuario: u.id_usuario,
          username: u.username,
          label: `${u.nombres} ${u.apellidos} (${u.rol_nombre})`,
          role: (u.rol_nombre as RoleType) || 'OPERADOR',
          email: u.email,
          defaultPassword: u.username === 'superadmin' ? 'super123' : `${u.username}123`,
          id_docente: u.id_docente,
          docente_nombre: u.docente_nombre
        }));
        setAvailableAccounts(mapped);
      }
    } catch (_) {}
  };

  const refreshSession = async () => {
    try {
      if (!user.id_usuario) return;
      const resPerms = await fetch(`/api/seguridad/usuarios/${user.id_usuario}/permisos`).then(r => r.json());
      const overrides = resPerms?.success ? resPerms.data?.overrides : undefined;
      const roleFromBackend = (resPerms?.data?.usuario?.rol_nombre as RoleType) || user.rol;
      
      setUser(prev => ({
        ...prev,
        rol: roleFromBackend,
        permissions: buildPermissionsForRole(roleFromBackend, overrides)
      }));
    } catch (_) {}
  };

  const canAccess = (module: SystemModule): boolean => {
    const modRule = user.permissions.modules[module];
    return !!modRule && modRule.ver;
  };

  const can = (
    module: SystemModule, 
    action: 'ver' | 'crear' | 'editar' | 'eliminar' | 'bloquear' | 'exportar'
  ): boolean => {
    const modRule = user.permissions.modules[module];
    if (!modRule) return false;
    return !!modRule[action];
  };

  const isOwnOnly = (module: SystemModule): boolean => {
    const modRule = user.permissions.modules[module];
    return !!modRule && !!modRule.verPropio;
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated,
      setRole, 
      login,
      loginAs, 
      loginAsProfile,
      logout,
      availableAccounts,
      refreshAccounts,
      refreshSession,
      canAccess,
      can,
      isOwnOnly
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

