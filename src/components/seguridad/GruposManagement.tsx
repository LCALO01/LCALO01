import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Users, 
  Edit3, 
  Trash2, 
  MoreHorizontal,
  X, 
  AlertTriangle, 
  CheckCircle2,
  FolderKanban,
  UserCheck
} from 'lucide-react';
import { GrupoSeguridad, RolItem } from '../../views/SeguridadView';
import { SeguridadUser } from '../../types';

interface GruposManagementProps {
  grupos: GrupoSeguridad[];
  roles: RolItem[];
  allUsers: SeguridadUser[];
  onOpenAssignUsersModal: (grupo: GrupoSeguridad) => void;
  onRefresh: (msg?: string) => void;
}

export const GruposManagement: React.FC<GruposManagementProps> = ({
  grupos,
  roles,
  allUsers,
  onOpenAssignUsersModal,
  onRefresh
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingGrupo, setEditingGrupo] = useState<GrupoSeguridad | null>(null);
  const [openActionMenuId, setOpenActionMenuId] = useState<number | null>(null);

  // Form state
  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [emoji, setEmoji] = useState('👥');
  const [color, setColor] = useState('purple');
  const [idRolDefecto, setIdRolDefecto] = useState<number | ''>('');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Cerrar menú contextual al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenActionMenuId(null);
    };
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const filteredGrupos = grupos.filter(g => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    return (
      g.nombre.toLowerCase().includes(q) ||
      g.codigo.toLowerCase().includes(q) ||
      (g.descripcion && g.descripcion.toLowerCase().includes(q))
    );
  });

  const handleOpenCreate = () => {
    setEditingGrupo(null);
    setCodigo('');
    setNombre('');
    setDescripcion('');
    setEmoji('👥');
    setColor('purple');
    setIdRolDefecto(roles[0]?.id_rol || '');
    setErrorMsg(null);
    setShowModal(true);
  };

  const handleOpenEdit = (g: GrupoSeguridad) => {
    setEditingGrupo(g);
    setCodigo(g.codigo);
    setNombre(g.nombre);
    setDescripcion(g.descripcion || '');
    setEmoji(g.emoji || '👥');
    setColor(g.color || 'purple');
    setIdRolDefecto(g.id_rol_defecto || '');
    setErrorMsg(null);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setErrorMsg('El nombre del grupo es obligatorio');
      return;
    }

    const genCodigo = codigo.trim() || nombre.trim().toUpperCase().replace(/[^A-Z0-9]/g, '_').slice(0, 20);

    setSaving(true);
    setErrorMsg(null);

    try {
      if (editingGrupo) {
        // Actualizar grupo
        const res = await fetch(`/api/seguridad/grupos/${editingGrupo.id_grupo}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nombre: nombre.trim(),
            descripcion: descripcion.trim(),
            emoji,
            color,
            id_rol_defecto: idRolDefecto ? Number(idRolDefecto) : null
          })
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || 'Error al actualizar el grupo');
        }
        setShowModal(false);
        onRefresh(`Grupo "${nombre}" actualizado correctamente`);
      } else {
        // Crear grupo
        const res = await fetch('/api/seguridad/grupos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            codigo: genCodigo,
            nombre: nombre.trim(),
            descripcion: descripcion.trim(),
            emoji,
            color,
            id_rol_defecto: idRolDefecto ? Number(idRolDefecto) : null
          })
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || 'Error al crear el grupo');
        }
        setShowModal(false);
        onRefresh(`Grupo "${nombre}" creado exitosamente`);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Ocurrió un error inesperado');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGrupo = async (g: GrupoSeguridad) => {
    if (g.id_grupo === 1) {
      alert('No es posible eliminar el grupo institucional principal.');
      return;
    }

    const conf = window.confirm(`¿Confirma eliminar el grupo "${g.nombre}"? Los usuarios asignados permanecerán en el sistema.`);
    if (!conf) return;

    try {
      const res = await fetch(`/api/seguridad/grupos/${g.id_grupo}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Error al eliminar el grupo');
      }
      onRefresh(`Grupo "${g.nombre}" eliminado`);
    } catch (err: any) {
      alert(err.message || 'Error al eliminar el grupo');
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Barra de Filtros y Acción según el formato de la imagen de referencia */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        <div className="w-full sm:max-w-xl">
          <input
            type="text"
            placeholder="Buscar grupo o departamento"
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
          <span>Nuevo grupo</span>
        </button>
      </div>

      {/* Tabla de Grupos según el formato de la imagen de referencia */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-slate-600 text-sm">
              <th className="py-3.5 px-2 font-medium text-slate-700 w-1/4 sm:w-1/3">
                Grupo
              </th>
              <th className="py-3.5 px-2 font-medium text-slate-700">
                Descripción
              </th>
              <th className="py-3.5 px-2 font-medium text-slate-700 text-center w-28">
                Miembros
              </th>
              <th className="py-3.5 px-2 w-12 text-right">
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredGrupos.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-12 text-center text-slate-400 text-sm">
                  {searchTerm ? 'No se encontraron grupos o departamentos que coincidan con la búsqueda.' : 'No hay grupos registrados.'}
                </td>
              </tr>
            ) : (
              filteredGrupos.map((g) => {
                const membersCount = g.total_usuarios ?? g.usuarios?.length ?? 0;
                const isMenuOpen = openActionMenuId === g.id_grupo;

                return (
                  <tr 
                    key={g.id_grupo}
                    className="hover:bg-slate-50/60 transition-colors group"
                  >
                    {/* Columna: Grupo (negrita tal como en la imagen) */}
                    <td className="py-4 px-2 align-middle">
                      <span className="font-bold text-slate-900 text-sm block">
                        {g.nombre}
                      </span>
                    </td>

                    {/* Columna: Descripción */}
                    <td className="py-4 px-2 align-middle">
                      <span className="text-slate-600 text-sm block leading-relaxed">
                        {g.descripcion || '—'}
                      </span>
                    </td>

                    {/* Columna: Miembros (número centrado tal como en la imagen) */}
                    <td className="py-4 px-2 text-center align-middle">
                      <span className="text-slate-900 text-sm font-normal">
                        {membersCount}
                      </span>
                    </td>

                    {/* Columna: Acciones (...) */}
                    <td className="py-4 px-2 text-right align-middle relative">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenActionMenuId(isMenuOpen ? null : g.id_grupo);
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
                              onOpenAssignUsersModal(g);
                            }}
                            className="w-full px-3 py-2 hover:bg-slate-100 flex items-center gap-2 transition text-left cursor-pointer"
                          >
                            <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                            <span>Asignar miembros ({membersCount})</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setOpenActionMenuId(null);
                              handleOpenEdit(g);
                            }}
                            className="w-full px-3 py-2 hover:bg-slate-100 flex items-center gap-2 transition text-left cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                            <span>Editar grupo</span>
                          </button>

                          {g.id_grupo !== 1 && (
                            <>
                              <div className="my-1 border-t border-slate-100" />
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenActionMenuId(null);
                                  handleDeleteGrupo(g);
                                }}
                                className="w-full px-3 py-2 hover:bg-rose-50 text-rose-600 flex items-center gap-2 transition text-left cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                <span>Eliminar</span>
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

      {/* Modal: Crear / Editar Grupo */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FolderKanban className="w-5 h-5 text-blue-400" />
                <h3 className="text-sm font-bold tracking-tight">
                  {editingGrupo ? 'Editar Grupo o Departamento' : 'Nuevo Grupo o Departamento'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
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
                  Nombre del Grupo o Departamento *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Administración TI, Coordinaciones, etc."
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
                  placeholder="Descripción de funciones, responsabilidades o área..."
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-lg text-sm focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Rol por Defecto para los Miembros
                </label>
                <select
                  value={idRolDefecto}
                  onChange={(e) => setIdRolDefecto(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-lg text-sm font-medium focus:outline-none"
                >
                  <option value="">-- Sin rol específico predeterminado --</option>
                  {roles.map((r) => (
                    <option key={r.id_rol} value={r.id_rol}>
                      {r.nombre} - {r.descripcion}
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Los miembros asignados a este grupo podrán heredar este rol.
                </span>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
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
                  <span>{saving ? 'Guardando...' : editingGrupo ? 'Guardar Cambios' : 'Crear Grupo'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
