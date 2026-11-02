import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Folder, 
  Shield, 
  Lock, 
  FolderTree,
  GraduationCap,
  Plus, 
  Check, 
  RotateCcw, 
  Save, 
  CheckCircle2, 
  AlertCircle,
  X,
  SlidersHorizontal,
  Info
} from 'lucide-react';
import { useAuth } from '../../controllers/authContext';
import { SeguridadUser, GrupoSeguridad } from '../../types';

export interface RolItem {
  id_rol: number;
  nombre: string;
  descripcion: string;
  estado: string;
  emoji?: string;
  color?: string;
}

// Definición de módulos de la tabla según la imagen exacta
export interface ModuloPermisoRow {
  id: string;
  nombre: string;
  crear: boolean;
  leer: boolean;
  actualizar: boolean;
  eliminar: boolean;
}

// 7 Módulos canónicos según la imagen del usuario
const MODULOS_INICIALES: { id: string; nombre: string }[] = [
  { id: 'dashboard', nombre: 'Dashboard' },
  { id: 'seguridad', nombre: 'Seguridad' },
  { id: 'academico', nombre: 'Académico' },
  { id: 'planificacion', nombre: 'Planificación' },
  { id: 'horarios', nombre: 'Horarios' },
  { id: 'asignacion_aulas', nombre: 'Asignación de aulas' },
  { id: 'reportes', nombre: 'Reportes' }
];

// 8 Grupos Institucionales solicitados por el usuario
export const GRUPOS_GESTION_PERMISOS: string[] = [
  'Administra TI',
  'Vicerrectorado Academico',
  'Direccion Academica',
  'Coordinacion Academica',
  'Docentes Titulares',
  'Docentes Ocacionales',
  'Auditoria',
  'Invitados'
];

// Matriz inicial por Rol
const DEFAULT_PERMISOS_POR_ROL: Record<string, Record<string, { crear: boolean; leer: boolean; actualizar: boolean; eliminar: boolean }>> = {
  SUPERADMIN: {
    dashboard: { crear: true, leer: true, actualizar: true, eliminar: true },
    seguridad: { crear: true, leer: true, actualizar: true, eliminar: true },
    academico: { crear: true, leer: true, actualizar: true, eliminar: true },
    planificacion: { crear: true, leer: true, actualizar: true, eliminar: true },
    horarios: { crear: true, leer: true, actualizar: true, eliminar: true },
    asignacion_aulas: { crear: true, leer: true, actualizar: true, eliminar: true },
    reportes: { crear: true, leer: true, actualizar: true, eliminar: true }
  },
  ADMINISTRADOR: {
    dashboard: { crear: true, leer: true, actualizar: true, eliminar: false },
    seguridad: { crear: true, leer: true, actualizar: true, eliminar: false },
    academico: { crear: true, leer: true, actualizar: true, eliminar: true },
    planificacion: { crear: true, leer: true, actualizar: true, eliminar: true },
    horarios: { crear: true, leer: true, actualizar: true, eliminar: true },
    asignacion_aulas: { crear: true, leer: true, actualizar: true, eliminar: true },
    reportes: { crear: true, leer: true, actualizar: true, eliminar: false }
  },
  COORDINADOR: {
    dashboard: { crear: false, leer: true, actualizar: false, eliminar: false },
    seguridad: { crear: false, leer: true, actualizar: false, eliminar: false },
    academico: { crear: true, leer: true, actualizar: true, eliminar: false },
    planificacion: { crear: true, leer: true, actualizar: true, eliminar: false },
    horarios: { crear: true, leer: true, actualizar: true, eliminar: false },
    asignacion_aulas: { crear: true, leer: true, actualizar: true, eliminar: false },
    reportes: { crear: true, leer: true, actualizar: false, eliminar: false }
  },
  DOCENTE: {
    dashboard: { crear: false, leer: true, actualizar: false, eliminar: false },
    seguridad: { crear: false, leer: false, actualizar: false, eliminar: false },
    academico: { crear: false, leer: true, actualizar: false, eliminar: false },
    planificacion: { crear: false, leer: true, actualizar: false, eliminar: false },
    horarios: { crear: false, leer: true, actualizar: false, eliminar: false },
    asignacion_aulas: { crear: false, leer: true, actualizar: false, eliminar: false },
    reportes: { crear: false, leer: true, actualizar: false, eliminar: false }
  },
  OPERADOR: {
    dashboard: { crear: false, leer: true, actualizar: false, eliminar: false },
    seguridad: { crear: false, leer: false, actualizar: false, eliminar: false },
    academico: { crear: false, leer: true, actualizar: false, eliminar: false },
    planificacion: { crear: false, leer: true, actualizar: false, eliminar: false },
    horarios: { crear: false, leer: true, actualizar: false, eliminar: false },
    asignacion_aulas: { crear: true, leer: true, actualizar: true, eliminar: false },
    reportes: { crear: false, leer: true, actualizar: false, eliminar: false }
  },
  AUDITOR: {
    dashboard: { crear: false, leer: true, actualizar: false, eliminar: false },
    seguridad: { crear: false, leer: true, actualizar: false, eliminar: false },
    academico: { crear: false, leer: true, actualizar: false, eliminar: false },
    planificacion: { crear: false, leer: true, actualizar: false, eliminar: false },
    horarios: { crear: false, leer: true, actualizar: false, eliminar: false },
    asignacion_aulas: { crear: false, leer: true, actualizar: false, eliminar: false },
    reportes: { crear: false, leer: true, actualizar: false, eliminar: false }
  },
  CONDULTA: {
    dashboard: { crear: false, leer: true, actualizar: false, eliminar: false },
    seguridad: { crear: false, leer: false, actualizar: false, eliminar: false },
    academico: { crear: false, leer: true, actualizar: false, eliminar: false },
    planificacion: { crear: false, leer: true, actualizar: false, eliminar: false },
    horarios: { crear: false, leer: true, actualizar: false, eliminar: false },
    asignacion_aulas: { crear: false, leer: true, actualizar: false, eliminar: false },
    reportes: { crear: false, leer: true, actualizar: false, eliminar: false }
  }
};

const STORAGE_KEY_GESTION_PERMISOS = 'isuj_gestion_permisos_v1';

interface GestionPermisosViewProps {
  onTabChange?: (tab: 'usuarios' | 'grupos' | 'roles' | 'permisos') => void;
  activeTab?: string;
  usuarios?: SeguridadUser[];
  roles?: RolItem[];
  grupos?: GrupoSeguridad[];
}

export const GestionPermisosView: React.FC<GestionPermisosViewProps> = ({
  onTabChange,
  activeTab = 'permisos',
  usuarios = [],
  roles = [],
  grupos = []
}) => {
  const { user: currentUser } = useAuth();
  const canEdit = currentUser?.rol === 'SUPERADMIN' || currentUser?.rol === 'ADMINISTRADOR';

  // Selección de Rol y Grupo (como en la imagen: Rol "Superadmin", Grupo "Administra TI")
  const [selectedRol, setSelectedRol] = useState<string>('SUPERADMIN');
  const [selectedGrupo, setSelectedGrupo] = useState<string>('Administra TI');

  // Lista unificada con los 8 grupos oficiales solicitados por el usuario
  const listaGrupos = React.useMemo(() => {
    const list = [...GRUPOS_GESTION_PERMISOS];
    if (grupos && grupos.length > 0) {
      grupos.forEach(g => {
        if (g.nombre && !list.includes(g.nombre)) {
          list.push(g.nombre);
        }
      });
    }
    return list;
  }, [grupos]);

  // Estado de permisos estructurado por Rol
  const [permisosPorRol, setPermisosPorRol] = useState<typeof DEFAULT_PERMISOS_POR_ROL>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_GESTION_PERMISOS);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error loading permissions:', e);
    }
    return DEFAULT_PERMISOS_POR_ROL;
  });

  const [notification, setNotification] = useState<string | null>(null);
  const [showNewPermModal, setShowNewPermModal] = useState(false);
  const [newPermModulo, setNewPermModulo] = useState('');
  const [newPermAction, setNewPermAction] = useState({
    crear: true,
    leer: true,
    actualizar: false,
    eliminar: false
  });

  // Guardar en localStorage ante cambios
  const savePermissions = (updated: typeof DEFAULT_PERMISOS_POR_ROL) => {
    setPermisosPorRol(updated);
    try {
      localStorage.setItem(STORAGE_KEY_GESTION_PERMISOS, JSON.stringify(updated));
    } catch (e) {
      console.error('Error saving permissions:', e);
    }
  };

  // Conmutar permiso específico
  const handleToggle = (moduloId: string, action: 'crear' | 'leer' | 'actualizar' | 'eliminar') => {
    if (!canEdit) {
      setNotification('Solo usuarios con perfil SUPERADMIN o ADMINISTRADOR pueden modificar permisos.');
      setTimeout(() => setNotification(null), 3500);
      return;
    }

    const currentRolPerms = permisosPorRol[selectedRol] || DEFAULT_PERMISOS_POR_ROL[selectedRol] || {};
    const currentModPerms = currentRolPerms[moduloId] || { crear: false, leer: false, actualizar: false, eliminar: false };

    const updated = {
      ...permisosPorRol,
      [selectedRol]: {
        ...currentRolPerms,
        [moduloId]: {
          ...currentModPerms,
          [action]: !currentModPerms[action]
        }
      }
    };

    savePermissions(updated);
    setNotification(`Permiso '${action.toUpperCase()}' en '${moduloId}' actualizado para rol ${selectedRol}.`);
    setTimeout(() => setNotification(null), 2500);
  };

  // Crear nuevo permiso para un módulo personalizado
  const handleCreateNewPerm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPermModulo.trim()) return;

    const modId = newPermModulo.trim().toLowerCase().replace(/\s+/g, '_');
    const currentRolPerms = permisosPorRol[selectedRol] || {};

    const updated = {
      ...permisosPorRol,
      [selectedRol]: {
        ...currentRolPerms,
        [modId]: {
          crear: newPermAction.crear,
          leer: newPermAction.leer,
          actualizar: newPermAction.actualizar,
          eliminar: newPermAction.eliminar
        }
      }
    };

    savePermissions(updated);
    setShowNewPermModal(false);
    setNewPermModulo('');
    setNotification(`Nuevo permiso creado para '${newPermModulo}' exitosamente.`);
    setTimeout(() => setNotification(null), 3000);
  };

  // Resetear a valores canónicos
  const handleResetDefaults = () => {
    if (!window.confirm('¿Restablecer los permisos a la configuración canónica predeterminada?')) return;
    savePermissions(DEFAULT_PERMISOS_POR_ROL);
    setNotification('Permisos restablecidos a los valores canónicos.');
    setTimeout(() => setNotification(null), 3000);
  };

  // Obtener estado actual de los módulos para el rol seleccionado
  const rolPerms = permisosPorRol[selectedRol] || DEFAULT_PERMISOS_POR_ROL[selectedRol] || {};

  return (
    <div id="gestion-permisos-container" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-6">
      
      {/* 1. Barra Superior de Pestañas (Usuarios | Grupos | Roles | Permisos) - Idéntica a la imagen */}
      <div className="flex items-center gap-6 sm:gap-8 border-b border-slate-200 text-sm font-medium">
        <button
          type="button"
          onClick={() => onTabChange && onTabChange('usuarios')}
          className={`flex items-center gap-2 pb-3 transition cursor-pointer ${
            activeTab === 'usuarios'
              ? 'text-blue-600 border-b-2 border-blue-600 font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4 text-slate-500" />
          <span>Usuarios</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange && onTabChange('grupos')}
          className={`flex items-center gap-2 pb-3 transition cursor-pointer ${
            activeTab === 'grupos'
              ? 'text-blue-600 border-b-2 border-blue-600 font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Folder className="w-4 h-4 text-slate-500" />
          <span>Grupos</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange && onTabChange('roles')}
          className={`flex items-center gap-2 pb-3 transition cursor-pointer ${
            activeTab === 'roles'
              ? 'text-blue-600 border-b-2 border-blue-600 font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Shield className="w-4 h-4 text-slate-500" />
          <span>Roles</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange && onTabChange('permisos')}
          className={`flex items-center gap-2 pb-3 transition cursor-pointer ${
            activeTab === 'permisos' || activeTab === 'gestion_permisos'
              ? 'text-blue-600 border-b-2 border-blue-600 font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Lock className="w-4 h-4 text-blue-600" />
          <span>Permisos</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange && onTabChange('asignacion_arbol')}
          className={`flex items-center gap-2 pb-3 transition cursor-pointer ${
            activeTab === 'asignacion_arbol'
              ? 'text-blue-600 border-b-2 border-blue-600 font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FolderTree className="w-4 h-4 text-slate-500" />
          <span>Árbol de Asignación</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange && onTabChange('asignacion_academico' as any)}
          className={`flex items-center gap-2 pb-3 transition cursor-pointer ${
            activeTab === 'asignacion_academico'
              ? 'text-blue-600 border-b-2 border-blue-600 font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <GraduationCap className={`w-4 h-4 ${activeTab === 'asignacion_academico' ? 'text-blue-600' : 'text-slate-500'}`} />
          <span>Asignación Académico</span>
        </button>
      </div>

      {/* 2. Barra de Filtros y Acción: Rol, Grupo y Botón "+ Nuevo permiso" - Idéntica a la imagen */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          {/* Selector de Rol */}
          <div className="flex items-center gap-2.5">
            <label htmlFor="select-rol" className="text-sm font-medium text-slate-700">
              Rol
            </label>
            <select
              id="select-rol"
              value={selectedRol}
              onChange={(e) => setSelectedRol(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-800 shadow-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer min-w-[150px]"
            >
              <option value="SUPERADMIN">Superadmin</option>
              <option value="ADMINISTRADOR">Administrador</option>
              <option value="COORDINADOR">Coordinador</option>
              <option value="DOCENTE">Docente</option>
              <option value="OPERADOR">Operador</option>
              <option value="AUDITOR">Auditor</option>
              <option value="CONDULTA">Condulta</option>
            </select>
          </div>

          {/* Selector de Grupo */}
          <div className="flex items-center gap-2.5">
            <label htmlFor="select-grupo" className="text-sm font-medium text-slate-700">
              Grupo
            </label>
            <select
              id="select-grupo"
              value={selectedGrupo}
              onChange={(e) => {
                const nuevoGrupo = e.target.value;
                setSelectedGrupo(nuevoGrupo);
                // Sugerir rol alineado si es un grupo conocido
                if (nuevoGrupo === 'Administra TI') setSelectedRol('SUPERADMIN');
                else if (nuevoGrupo === 'Vicerrectorado Academico') setSelectedRol('ADMINISTRADOR');
                else if (nuevoGrupo === 'Direccion Academica' || nuevoGrupo === 'Coordinacion Academica') setSelectedRol('COORDINADOR');
                else if (nuevoGrupo === 'Docentes Titulares' || nuevoGrupo === 'Docentes Ocacionales') setSelectedRol('DOCENTE');
                else if (nuevoGrupo === 'Auditoria') setSelectedRol('AUDITOR');
                else if (nuevoGrupo === 'Invitados') setSelectedRol('CONDULTA');
              }}
              className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-800 shadow-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer min-w-[210px]"
            >
              {listaGrupos.map((nombre) => (
                <option key={nombre} value={nombre}>
                  {nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Botón "+ Nuevo permiso" */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowNewPermModal(true)}
            className="border border-blue-500 text-blue-600 hover:bg-blue-50/80 px-4 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Nuevo permiso</span>
          </button>

          <button
            type="button"
            onClick={handleResetDefaults}
            title="Restablecer valores predeterminados"
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mensaje de Notificación / Feedback */}
      {notification && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-xs font-semibold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-blue-400 hover:text-blue-700">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 3. Tabla de Permisos CRUD (Módulo | Crear | Leer | Actualizar | Eliminar) - Idéntica a la imagen */}
      <div className="border-t border-slate-200 overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[650px]">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 text-sm font-medium">
              <th className="py-3.5 pr-6 w-1/3 text-slate-600">Módulo</th>
              <th className="py-3.5 px-4 text-center w-1/6 font-medium text-slate-600">Crear</th>
              <th className="py-3.5 px-4 text-center w-1/6 font-medium text-slate-600">Leer</th>
              <th className="py-3.5 px-4 text-center w-1/6 font-medium text-slate-600">Actualizar</th>
              <th className="py-3.5 px-4 text-center w-1/6 font-medium text-slate-600">Eliminar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {MODULOS_INICIALES.map((mod) => {
              const modPerm = rolPerms[mod.id] || {
                crear: false,
                leer: false,
                actualizar: false,
                eliminar: false
              };

              return (
                <tr key={mod.id} className="hover:bg-slate-50/60 transition-colors">
                  {/* Nombre del Módulo (Bold y limpio como en la imagen) */}
                  <td className="py-4 pr-6 text-sm font-bold text-slate-900">
                    {mod.nombre}
                  </td>

                  {/* Checkbox Crear */}
                  <td className="py-4 px-4 text-center">
                    <button
                      type="button"
                      aria-label={`Permiso Crear en ${mod.nombre}`}
                      onClick={() => handleToggle(mod.id, 'crear')}
                      className={`w-5 h-5 rounded flex items-center justify-center transition cursor-pointer mx-auto shadow-2xs ${
                        modPerm.crear
                          ? 'bg-blue-600 border border-blue-600 text-white'
                          : 'bg-white border-2 border-slate-300 hover:border-blue-400 text-transparent'
                      }`}
                    >
                      {modPerm.crear && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>
                  </td>

                  {/* Checkbox Leer */}
                  <td className="py-4 px-4 text-center">
                    <button
                      type="button"
                      aria-label={`Permiso Leer en ${mod.nombre}`}
                      onClick={() => handleToggle(mod.id, 'leer')}
                      className={`w-5 h-5 rounded flex items-center justify-center transition cursor-pointer mx-auto shadow-2xs ${
                        modPerm.leer
                          ? 'bg-blue-600 border border-blue-600 text-white'
                          : 'bg-white border-2 border-slate-300 hover:border-blue-400 text-transparent'
                      }`}
                    >
                      {modPerm.leer && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>
                  </td>

                  {/* Checkbox Actualizar */}
                  <td className="py-4 px-4 text-center">
                    <button
                      type="button"
                      aria-label={`Permiso Actualizar en ${mod.nombre}`}
                      onClick={() => handleToggle(mod.id, 'actualizar')}
                      className={`w-5 h-5 rounded flex items-center justify-center transition cursor-pointer mx-auto shadow-2xs ${
                        modPerm.actualizar
                          ? 'bg-blue-600 border border-blue-600 text-white'
                          : 'bg-white border-2 border-slate-300 hover:border-blue-400 text-transparent'
                      }`}
                    >
                      {modPerm.actualizar && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>
                  </td>

                  {/* Checkbox Eliminar */}
                  <td className="py-4 px-4 text-center">
                    <button
                      type="button"
                      aria-label={`Permiso Eliminar en ${mod.nombre}`}
                      onClick={() => handleToggle(mod.id, 'eliminar')}
                      className={`w-5 h-5 rounded flex items-center justify-center transition cursor-pointer mx-auto shadow-2xs ${
                        modPerm.eliminar
                          ? 'bg-blue-600 border border-blue-600 text-white'
                          : 'bg-white border-2 border-slate-300 hover:border-blue-400 text-transparent'
                      }`}
                    >
                      {modPerm.eliminar && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Nota informativa en la parte inferior */}
      <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100">
        <div className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-blue-500" />
          <span>Los cambios en los permisos se aplican en tiempo real para el rol seleccionado ({selectedRol}).</span>
        </div>
        <span className="font-semibold text-slate-700">7 Módulos Oficiales Parametrizados</span>
      </div>

      {/* Modal: + Nuevo Permiso */}
      {showNewPermModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600" />
                <span>Nuevo Permiso de Módulo</span>
              </h3>
              <button 
                type="button"
                onClick={() => setShowNewPermModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNewPerm} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nombre del Módulo o Función:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Trámites Estudiantiles"
                  value={newPermModulo}
                  onChange={(e) => setNewPermModulo(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="font-bold text-slate-600 block mb-1">Rol de asignación:</span>
                  <div className="px-3 py-1.5 bg-slate-100 rounded-lg font-semibold text-slate-800">
                    {selectedRol}
                  </div>
                </div>
                <div>
                  <span className="font-bold text-slate-600 block mb-1">Grupo asociado:</span>
                  <div className="px-3 py-1.5 bg-slate-100 rounded-lg font-semibold text-slate-800 truncate">
                    {selectedGrupo}
                  </div>
                </div>
              </div>

              <div>
                <span className="block text-xs font-bold text-slate-700 mb-2">
                  Privilegios de Acceso:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {(['crear', 'leer', 'actualizar', 'eliminar'] as const).map((act) => (
                    <label key={act} className="flex items-center gap-2 p-2 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={newPermAction[act]}
                        onChange={(e) => setNewPermAction({ ...newPermAction, [act]: e.target.checked })}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="capitalize font-semibold text-xs text-slate-800">{act}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewPermModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-xs cursor-pointer"
                >
                  Guardar Permiso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
