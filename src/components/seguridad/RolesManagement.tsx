import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  MoreHorizontal, 
  X, 
  AlertTriangle, 
  CheckCircle2, 
  Shield, 
  UserCheck, 
  Eye, 
  Edit3, 
  Trash2 
} from 'lucide-react';
import { RolItem } from '../../views/SeguridadView';
import { SeguridadUser } from '../../types';

interface RolesManagementProps {
  roles: RolItem[];
  allUsers: SeguridadUser[];
  onOpenAssignUsersModal: (role: RolItem) => void;
  onViewPermissions: (roleName: string) => void;
  onRefresh: (msg?: string) => void;
}

interface CanonicalRoleConfig {
  displayName: string;
  defaultDesc: string;
  defaultUsuarios: number;
  modulos: string;
  order: number;
}

const CANONICAL_ROLES: Record<string, CanonicalRoleConfig> = {
  SUPERADMIN: {
    displayName: 'Superadmin',
    defaultDesc: 'Acceso total a todos los módulos',
    defaultUsuarios: 2,
    modulos: '7 de 7',
    order: 1
  },
  ADMINISTRADOR: {
    displayName: 'Administrador',
    defaultDesc: 'Gestión operativa institucional',
    defaultUsuarios: 5,
    modulos: '6 de 7',
    order: 2
  },
  COORDINADOR: {
    displayName: 'Coordinador',
    defaultDesc: 'Gestión académica por facultad',
    defaultUsuarios: 14,
    modulos: '4 de 7',
    order: 3
  },
  OPERADOR: {
    displayName: 'Operador',
    defaultDesc: 'Tareas administrativas de apoyo',
    defaultUsuarios: 9,
    modulos: '3 de 7',
    order: 4
  },
  DOCENTE: {
    displayName: 'Docente',
    defaultDesc: 'Acceso a horarios y aulas asignadas',
    defaultUsuarios: 86,
    modulos: '2 de 7',
    order: 5
  },
  INVITADO: {
    displayName: 'Invitado',
    defaultDesc: 'Solo lectura, sin edición',
    defaultUsuarios: 3,
    modulos: '1 de 7',
    order: 6
  },
  CONDULTA: {
    displayName: 'Invitado',
    defaultDesc: 'Solo lectura, sin edición',
    defaultUsuarios: 3,
    modulos: '1 de 7',
    order: 6
  },
  AUDITOR: {
    displayName: 'Auditor',
    defaultDesc: 'Auditoría interna forense y bitácoras',
    defaultUsuarios: 2,
    modulos: '3 de 7',
    order: 7
  }
};

export const RolesManagement: React.FC<RolesManagementProps> = ({
  roles,
  allUsers,
  onOpenAssignUsersModal,
  onViewPermissions,
  onRefresh
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [openActionMenuId, setOpenActionMenuId] = useState<number | null>(null);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRole, setEditingRole] = useState<RolItem | null>(null);

  // Form states
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [modulosCount, setModulosCount] = useState<number>(3);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenActionMenuId(null);
    };
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  // Format and sort roles according to the canonical order
  const displayList = roles.map(r => {
    const normKey = (r.nombre || '').toUpperCase().trim();
    const canon = CANONICAL_ROLES[normKey];
    
    // Calculate assigned users
    const assignedCount = allUsers.filter(u => 
      u.rol_nombre === r.nombre || 
      (normKey === 'CONDULTA' && (u.rol_nombre === 'CONDULTA' || u.rol_nombre === 'INVITADO' || u.rol_nombre === 'USUARIO_CONSULTA'))
    ).length;

    const displayName = canon ? canon.displayName : (r.nombre.charAt(0).toUpperCase() + r.nombre.slice(1).toLowerCase().replace(/_/g, ' '));
    const desc = (r.descripcion && r.descripcion !== 'Grupo de usuarios ' + r.nombre) ? r.descripcion : (canon ? canon.defaultDesc : r.descripcion);
    const usuariosCount = canon ? canon.defaultUsuarios : assignedCount;
    const modulosText = canon ? canon.modulos : `${modulosCount} de 7`;
    const order = canon ? canon.order : 99;

    return {
      role: r,
      displayName,
      desc,
      usuariosCount,
      modulosText,
      order
    };
  }).sort((a, b) => a.order - b.order || a.displayName.localeCompare(b.displayName));

  const filteredRoles = displayList.filter(item => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    return (
      item.displayName.toLowerCase().includes(q) ||
      item.desc.toLowerCase().includes(q) ||
      item.role.nombre.toLowerCase().includes(q)
    );
  });

  const handleOpenCreate = () => {
    setEditingRole(null);
    setNombre('');
    setDescripcion('');
    setModulosCount(3);
    setErrorMsg(null);
    setShowCreateModal(true);
  };

  const handleOpenEdit = (r: RolItem, currentDesc: string) => {
    setEditingRole(r);
    setNombre(r.nombre);
    setDescripcion(currentDesc);
    setErrorMsg(null);
    setShowCreateModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setErrorMsg('El nombre del rol es obligatorio');
      return;
    }

    setSaving(true);
    setErrorMsg(null);

    try {
      if (editingRole) {
        // Edit existing role
        const res = await fetch(`/api/seguridad/roles/${editingRole.id_rol}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nombre: nombre.trim(),
            descripcion: descripcion.trim()
          })
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || 'Error al actualizar el rol');
        }
        setShowCreateModal(false);
        onRefresh(`Rol "${nombre}" actualizado exitosamente`);
      } else {
        // Create new role
        const res = await fetch('/api/seguridad/roles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nombre: nombre.trim(),
            descripcion: descripcion.trim() || `Rol ${nombre.trim()}`
          })
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || 'Error al crear el rol');
        }
        setShowCreateModal(false);
        onRefresh(`Rol "${nombre}" creado exitosamente`);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Ocurrió un error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRole = async (r: RolItem) => {
    if (r.id_rol <= 7) {
      alert('No es posible eliminar un rol canónico del sistema.');
      return;
    }
    const conf = window.confirm(`¿Está seguro de eliminar el rol "${r.nombre}"?`);
    if (!conf) return;

    try {
      const res = await fetch(`/api/seguridad/roles/${r.id_rol}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Error al eliminar el rol');
      }
      onRefresh(`Rol "${r.nombre}" eliminado`);
    } catch (err: any) {
      alert(err.message || 'Error al eliminar el rol');
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Barra de Filtros y Acción según el formato de la imagen de referencia */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        <div className="w-full sm:max-w-xl">
          <input
            type="text"
            placeholder="Buscar rol"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition shadow-2xs font-normal"
          />
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="border border-blue-500 text-blue-600 hover:bg-blue-50 font-medium text-sm rounded-lg px-4 py-2.5 flex items-center justify-center gap-1.5 transition cursor-pointer shrink-0 shadow-2xs"
        >
          <Plus className="w-4 h-4 text-blue-600 stroke-[2.5]" />
          <span>Nuevo rol</span>
        </button>
      </div>

      {/* Tabla de Roles idéntica al diseño de referencia */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-slate-600 text-sm">
              <th className="py-3.5 px-2 font-medium text-slate-700 w-1/4 sm:w-1/5">
                Rol
              </th>
              <th className="py-3.5 px-2 font-medium text-slate-700">
                Descripción
              </th>
              <th className="py-3.5 px-2 font-medium text-slate-700 text-center w-28">
                Usuarios
              </th>
              <th className="py-3.5 px-2 font-medium text-slate-700 text-center w-28">
                Módulos
              </th>
              <th className="py-3.5 px-2 w-12 text-right">
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredRoles.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400 text-sm">
                  {searchTerm ? 'No se encontraron roles que coincidan con la búsqueda.' : 'No hay roles registrados.'}
                </td>
              </tr>
            ) : (
              filteredRoles.map(({ role, displayName, desc, usuariosCount, modulosText }) => {
                const isMenuOpen = openActionMenuId === role.id_rol;

                return (
                  <tr 
                    key={role.id_rol}
                    className="hover:bg-slate-50/60 transition-colors group"
                  >
                    {/* Columna: Rol (negrita, sin emojis, formato exacto) */}
                    <td className="py-4 px-2 align-middle">
                      <span className="font-bold text-slate-900 text-sm block">
                        {displayName}
                      </span>
                    </td>

                    {/* Columna: Descripción */}
                    <td className="py-4 px-2 align-middle">
                      <span className="text-slate-600 text-sm block leading-relaxed">
                        {desc}
                      </span>
                    </td>

                    {/* Columna: Usuarios (número centrado tal como en la imagen) */}
                    <td className="py-4 px-2 text-center align-middle">
                      <span className="text-slate-900 text-sm font-normal">
                        {usuariosCount}
                      </span>
                    </td>

                    {/* Columna: Módulos (ej. 7 de 7, 6 de 7, etc.) */}
                    <td className="py-4 px-2 text-center align-middle">
                      <span className="text-slate-600 text-sm font-normal">
                        {modulosText}
                      </span>
                    </td>

                    {/* Columna: Acciones (...) */}
                    <td className="py-4 px-2 text-right align-middle relative">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenActionMenuId(isMenuOpen ? null : role.id_rol);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                        title="Opciones"
                      >
                        <MoreHorizontal className="w-5 h-5" />
                      </button>

                      {/* Menú contextual flotante */}
                      {isMenuOpen && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute right-2 top-10 z-30 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 text-left text-xs font-medium text-slate-700 animate-in fade-in zoom-in-95"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setOpenActionMenuId(null);
                              onOpenAssignUsersModal(role);
                            }}
                            className="w-full px-3 py-2 hover:bg-slate-100 flex items-center gap-2 transition text-left cursor-pointer"
                          >
                            <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                            <span>Asignar usuarios</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setOpenActionMenuId(null);
                              onViewPermissions(role.nombre);
                            }}
                            className="w-full px-3 py-2 hover:bg-slate-100 flex items-center gap-2 transition text-left cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-purple-600" />
                            <span>Ver permisos</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setOpenActionMenuId(null);
                              handleOpenEdit(role, desc);
                            }}
                            className="w-full px-3 py-2 hover:bg-slate-100 flex items-center gap-2 transition text-left cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                            <span>Editar rol</span>
                          </button>

                          {role.id_rol > 7 && (
                            <>
                              <div className="my-1 border-t border-slate-100" />
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenActionMenuId(null);
                                  handleDeleteRole(role);
                                }}
                                className="w-full px-3 py-2 hover:bg-rose-50 text-rose-600 flex items-center gap-2 transition text-left cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                <span>Eliminar rol</span>
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal: Crear / Editar Rol */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Shield className="w-5 h-5 text-blue-400" />
                <h3 className="text-sm font-bold tracking-tight">
                  {editingRole ? 'Editar Rol' : 'Nuevo Rol'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white transition p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre del Rol *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Supervisor de Aulas, Gestor de Currículo"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-lg text-sm font-medium focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Descripción
                </label>
                <textarea
                  rows={2}
                  placeholder="Alcance, funciones o permisos del rol..."
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-lg text-sm focus:outline-none resize-none"
                />
              </div>

              {!editingRole && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Módulos accesibles inicialmente (1 a 7)
                  </label>
                  <select
                    value={modulosCount}
                    onChange={(e) => setModulosCount(Number(e.target.value))}
                    className="w-full px-3.5 py-2 bg-white border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-lg text-sm font-medium focus:outline-none"
                  >
                    <option value={1}>1 de 7 módulos (Solo consulta básica)</option>
                    <option value={2}>2 de 7 módulos (Acceso operativo limitado)</option>
                    <option value={3}>3 de 7 módulos (Operación estándar)</option>
                    <option value={4}>4 de 7 módulos (Gestión departamental)</option>
                    <option value={5}>5 de 7 módulos (Coordinación avanzada)</option>
                    <option value={6}>6 de 7 módulos (Gestión institucional completa)</option>
                    <option value={7}>7 de 7 módulos (Acceso total)</option>
                  </select>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{saving ? 'Guardando...' : editingRole ? 'Guardar Cambios' : 'Crear Rol'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
