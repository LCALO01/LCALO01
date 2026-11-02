import React, { useState, useMemo } from 'react';
import { 
  X, 
  Check, 
  Search, 
  UserCheck, 
  Users, 
  UserMinus, 
  ShieldCheck, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw,
  Sparkles,
  UserPlus
} from 'lucide-react';
import { SeguridadUser, getGrupoConfig, RoleType } from '../../types.ts';

export interface AssignUsersToGroupModalProps {
  group: {
    id_grupo?: number;
    id_rol?: number;
    nombre: string;
    descripcion: string;
    emoji?: string;
    color?: string;
  };
  allUsers: SeguridadUser[];
  roles: { id_rol: number; nombre: string; descripcion: string; emoji?: string; color?: string }[];
  onClose: () => void;
  onSaved: (msg: string) => void;
}

export const AssignUsersToGroupModal: React.FC<AssignUsersToGroupModalProps> = ({
  group,
  allUsers,
  roles,
  onClose,
  onSaved
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'assign' | 'current'>('assign');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const groupConfig = getGrupoConfig(group.nombre);

  // Usuarios que ya pertenecen a este grupo
  const currentMembers = useMemo(() => {
    return allUsers.filter(u => {
      if (group.nombre === 'CONSULTA') {
        return u.rol_nombre === 'CONSULTA' || u.rol_nombre === 'USUARIO_CONSULTA';
      }
      return u.rol_nombre === group.nombre || u.id_rol === group.id_rol;
    });
  }, [allUsers, group.nombre, group.id_rol]);

  // Usuarios disponibles para asignar (que no están ya en este grupo)
  const availableUsers = useMemo(() => {
    return allUsers.filter(u => {
      const isAlreadyIn = currentMembers.some(m => m.id_usuario === u.id_usuario);
      return !isAlreadyIn;
    });
  }, [allUsers, currentMembers]);

  // Filtrado de usuarios disponibles por término de búsqueda
  const filteredAvailableUsers = useMemo(() => {
    if (!searchTerm.trim()) return availableUsers;
    const q = searchTerm.toLowerCase();
    return availableUsers.filter(u => 
      u.nombres.toLowerCase().includes(q) ||
      u.apellidos.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.cargo && u.cargo.toLowerCase().includes(q)) ||
      u.rol_nombre.toLowerCase().includes(q)
    );
  }, [availableUsers, searchTerm]);

  // Filtrado de miembros actuales
  const filteredCurrentMembers = useMemo(() => {
    if (!searchTerm.trim()) return currentMembers;
    const q = searchTerm.toLowerCase();
    return currentMembers.filter(u => 
      u.nombres.toLowerCase().includes(q) ||
      u.apellidos.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
  }, [currentMembers, searchTerm]);

  // Manejador para toggle de selección individual
  const toggleUserSelection = (userId: number) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  // Seleccionar todos los visibles
  const handleSelectAllFiltered = () => {
    const idsToAdd = filteredAvailableUsers.map(u => u.id_usuario);
    setSelectedUserIds(prev => Array.from(new Set([...prev, ...idsToAdd])));
  };

  // Limpiar selección
  const handleClearSelection = () => {
    setSelectedUserIds([]);
  };

  // Asignar los usuarios seleccionados al grupo
  const handleAssignSelected = async () => {
    if (selectedUserIds.length === 0) return;
    setIsSubmitting(true);
    setError(null);
    try {
      if (group.id_grupo) {
        await fetch(`/api/seguridad/grupos/${group.id_grupo}/usuarios`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id_usuarios: selectedUserIds,
            asignar_rol_defecto: true
          })
        });
      }

      const res = await fetch('/api/seguridad/roles/asignar-usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_rol: group.id_rol,
          rol_nombre: group.nombre,
          id_usuarios: selectedUserIds
        })
      });
      const json = await res.json();
      if (json.success) {
        setSuccessMsg(json.message);
        onSaved(json.message);
        setSelectedUserIds([]);
        setTimeout(() => {
          onClose();
        }, 800);
      } else {
        setError(json.message || 'Error al asignar usuarios al rol');
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Asignar un solo usuario de inmediato
  const handleAssignSingle = async (userId: number, username: string) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/seguridad/usuarios/${userId}/rol`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_rol: group.id_rol,
          rol_nombre: group.nombre
        })
      });
      const json = await res.json();
      if (json.success) {
        setSuccessMsg(`Usuario @${username} asignado al grupo ${group.nombre}`);
        onSaved(`Usuario @${username} asignado al grupo ${group.nombre}`);
        setSelectedUserIds(prev => prev.filter(id => id !== userId));
      } else {
        setError(json.message || 'Error al asignar usuario');
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Remover / Reasignar un miembro actual a perfil base
  const handleRemoveMember = async (userId: number, username: string) => {
    if (!confirm(`¿Desea desvincular a @${username} del grupo ${group.nombre}? El usuario será reasignado al perfil base CONDULTA.`)) {
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/seguridad/roles/remover-usuario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_usuario: userId,
          nuevo_rol_nombre: 'CONDULTA'
        })
      });
      const json = await res.json();
      if (json.success) {
        onSaved(`Usuario @${username} desvinculado de ${group.nombre}`);
      } else {
        setError(json.message || 'Error al desvincular usuario');
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border-2 border-[#e5a800] overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Cabecera del Modal */}
        <div className="bg-[#1f0533] text-white p-4 sm:p-5 flex items-center justify-between border-b border-purple-900 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#e5a800] text-[#1f0533] flex items-center justify-center font-black text-2xl shadow-sm">
              {group.emoji || groupConfig.emoji}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">
                  Asignar Usuarios al Grupo / Rol:
                </h3>
                <span className={`px-2 py-0.5 rounded-md text-xs font-black border ${groupConfig.badgeClass}`}>
                  {group.nombre}
                </span>
              </div>
              <p className="text-[11px] text-amber-300 mt-0.5 max-w-md line-clamp-1">
                {group.descripcion || groupConfig.descripcion}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 rounded-lg text-purple-300 hover:text-white hover:bg-purple-900 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Messages */}
        {error && (
          <div className="p-3 bg-rose-50 border-b border-rose-200 text-rose-800 text-xs flex items-center gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-50 border-b border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 shrink-0">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Pestañas internas del Modal */}
        <div className="bg-slate-100 px-4 pt-3 flex items-center justify-between border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveSubTab('assign')}
              className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === 'assign'
                  ? 'border-[#1f0533] text-[#1f0533]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Asignar Nuevos Usuarios ({availableUsers.length})</span>
            </button>
            <button
              onClick={() => setActiveSubTab('current')}
              className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === 'current'
                  ? 'border-[#1f0533] text-[#1f0533]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Miembros Actuales ({currentMembers.length})</span>
            </button>
          </div>

          <div className="text-[11px] font-bold text-slate-500 pb-2">
            Total en sistema: {allUsers.length}
          </div>
        </div>

        {/* Buscador & Controles rápidos */}
        <div className="p-3 sm:px-5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={activeSubTab === 'assign' ? "Buscar usuario por nombre, usuario, rol o correo..." : "Buscar entre los miembros actuales..."}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {activeSubTab === 'assign' && filteredAvailableUsers.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAllFiltered}
                className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 rounded-lg text-[11px] font-bold transition cursor-pointer"
              >
                Seleccionar todos ({filteredAvailableUsers.length})
              </button>
              {selectedUserIds.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearSelection}
                  className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-[11px] font-bold transition cursor-pointer"
                >
                  Limpiar ({selectedUserIds.length})
                </button>
              )}
            </div>
          )}
        </div>

        {/* Contenido scrolleable */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2 text-xs">
          {/* VISTA 1: ASIGNAR NUEVOS USUARIOS */}
          {activeSubTab === 'assign' && (
            <>
              {filteredAvailableUsers.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <UserCheck className="w-10 h-10 mx-auto text-slate-300 stroke-[1.5]" />
                  <p className="font-medium text-slate-600">
                    {availableUsers.length === 0
                      ? `¡Todos los usuarios registrados en el sistema ya pertenecen a ${group.nombre}!`
                      : 'No se encontraron usuarios disponibles con el filtro actual.'}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Puede revisar la lista de miembros actuales en la pestaña superior.
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {filteredAvailableUsers.map(u => {
                    const isChecked = selectedUserIds.includes(u.id_usuario);
                    const userRoleConf = getGrupoConfig(u.rol_nombre);

                    return (
                      <div
                        key={u.id_usuario}
                        onClick={() => toggleUserSelection(u.id_usuario)}
                        className={`p-3 rounded-xl border transition flex items-center justify-between gap-3 cursor-pointer ${
                          isChecked
                            ? 'bg-purple-50/80 border-purple-400 shadow-xs'
                            : 'bg-white border-slate-200 hover:border-purple-200 hover:bg-slate-50/70'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}} // controlado por el click del contenedor
                            className="w-4 h-4 text-purple-600 rounded-sm border-slate-300 focus:ring-purple-500 cursor-pointer shrink-0"
                          />
                          <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                            {u.nombres.charAt(0)}{u.apellidos.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5 truncate">
                              <span>{u.nombres} {u.apellidos}</span>
                              <span className="font-mono font-bold text-purple-900 text-[11px]">@{u.username}</span>
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-2 truncate">
                              <span>{u.email}</span>
                              {u.cargo && <span className="text-slate-400">• {u.cargo}</span>}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <div className="text-right">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${userRoleConf.badgeClass}`}>
                              <span>{userRoleConf.emoji}</span>
                              <span>{u.rol_nombre}</span>
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAssignSingle(u.id_usuario, u.username);
                            }}
                            disabled={isSubmitting}
                            className="px-2 py-1 bg-purple-100 hover:bg-purple-200 text-purple-900 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                            title={`Asignar de inmediato a ${group.nombre}`}
                          >
                            <span>+ Asignar</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* VISTA 2: MIEMBROS ACTUALES */}
          {activeSubTab === 'current' && (
            <>
              {filteredCurrentMembers.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-3">
                  <Users className="w-10 h-10 mx-auto text-slate-300 stroke-[1.5]" />
                  <p className="font-medium text-slate-600">
                    No hay usuarios vinculados actualmente a este rol/grupo.
                  </p>
                  <button
                    onClick={() => setActiveSubTab('assign')}
                    className="px-4 py-1.5 bg-[#1f0533] text-amber-300 rounded-xl text-xs font-bold hover:bg-[#350854] cursor-pointer"
                  >
                    Asignar Usuarios Ahora
                  </button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {filteredCurrentMembers.map(u => (
                    <div
                      key={u.id_usuario}
                      className="p-3 bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-900 border border-purple-200 flex items-center justify-center font-bold text-xs shrink-0">
                          {u.nombres.charAt(0)}{u.apellidos.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5 truncate">
                            <span>{u.nombres} {u.apellidos}</span>
                            <span className="font-mono font-bold text-purple-900 text-[11px]">@{u.username}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-2 truncate">
                            <span>{u.email}</span>
                            {u.cargo && <span className="text-slate-400">• {u.cargo}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          u.estado === 'ACTIVO' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {u.estado}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleRemoveMember(u.id_usuario, u.username)}
                          disabled={isSubmitting || u.id_usuario === 1}
                          className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition cursor-pointer disabled:opacity-30"
                          title={u.id_usuario === 1 ? "El administrador principal no puede ser desvinculado" : "Desvincular del grupo"}
                        >
                          <UserMinus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer con botón principal */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-600">
            {activeSubTab === 'assign' && (
              <span>
                <strong className="text-purple-900">{selectedUserIds.length}</strong> usuario(s) seleccionado(s)
              </span>
            )}
            {activeSubTab === 'current' && (
              <span>
                <strong className="text-purple-900">{currentMembers.length}</strong> miembro(s) activo(s) en este grupo
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer transition text-xs"
            >
              Cerrar
            </button>

            {activeSubTab === 'assign' && (
              <button
                type="button"
                onClick={handleAssignSelected}
                disabled={isSubmitting || selectedUserIds.length === 0}
                className="px-5 py-2 bg-[#1f0533] hover:bg-[#350854] text-amber-300 font-bold rounded-xl border border-amber-400/50 shadow-xs cursor-pointer flex items-center gap-1.5 transition text-xs disabled:opacity-40"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Asignando...</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Asignar {selectedUserIds.length} a {group.nombre}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
