import React, { useState } from 'react';
import { 
  X, 
  Check, 
  ShieldCheck, 
  Users, 
  ArrowRight, 
  Sparkles, 
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { getGrupoConfig, SeguridadUser } from '../../types.ts';

export interface BatchAssignRoleModalProps {
  selectedUsers: SeguridadUser[];
  roles: { id_rol: number; nombre: string; descripcion: string; emoji?: string; color?: string }[];
  onClose: () => void;
  onSaved: (msg: string) => void;
}

export const BatchAssignRoleModal: React.FC<BatchAssignRoleModalProps> = ({
  selectedUsers,
  roles,
  onClose,
  onSaved
}) => {
  const [selectedRolId, setSelectedRolId] = useState<number>(() => {
    return roles.length > 0 ? roles[0].id_rol : 5;
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedRole = roles.find(r => r.id_rol === selectedRolId);
  const grpConfig = selectedRole ? getGrupoConfig(selectedRole.nombre) : null;

  const handleBatchAssign = async () => {
    if (!selectedRole || selectedUsers.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/seguridad/roles/asignar-usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_rol: selectedRole.id_rol,
          rol_nombre: selectedRole.nombre,
          id_usuarios: selectedUsers.map(u => u.id_usuario)
        })
      });
      const json = await res.json();
      if (json.success) {
        onSaved(json.message);
        onClose();
      } else {
        setError(json.message || 'Error al asignar rol a los usuarios');
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border-2 border-[#e5a800] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="bg-[#1f0533] text-white p-4 sm:p-5 flex items-center justify-between border-b border-purple-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#e5a800] text-[#1f0533] flex items-center justify-center font-black">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white">
                Asignación Masiva de Rol / Grupo
              </h3>
              <p className="text-[11px] text-amber-300">
                Se actualizarán {selectedUsers.length} usuario(s) seleccionados simultáneamente
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

        {error && (
          <div className="p-3 bg-rose-50 border-b border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-5 space-y-4 text-xs">
          {/* Resumen de usuarios seleccionados */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              Usuarios seleccionados ({selectedUsers.length}):
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
              {selectedUsers.map(u => (
                <span 
                  key={u.id_usuario}
                  className="px-2 py-0.5 bg-purple-100 text-purple-900 font-medium rounded-md text-[11px] border border-purple-200 inline-flex items-center gap-1"
                >
                  <span className="font-bold">@{u.username}</span>
                  <span className="text-[10px] text-slate-500">({u.rol_nombre})</span>
                </span>
              ))}
            </div>
          </div>

          {/* Selector de nuevo rol */}
          <div className="space-y-2">
            <label className="block font-bold text-slate-800">
              Seleccione el nuevo Rol / Grupo institucional de destino:
            </label>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {roles.map(r => {
                const isSelected = r.id_rol === selectedRolId;
                const grp = getGrupoConfig(r.nombre);
                return (
                  <div
                    key={r.id_rol}
                    onClick={() => setSelectedRolId(r.id_rol)}
                    className={`p-2.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? `${grp.cardBorderClass} ${grp.bgLightClass} shadow-xs border-2`
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="batchRoleOption"
                        checked={isSelected}
                        onChange={() => setSelectedRolId(r.id_rol)}
                        className="text-purple-600 focus:ring-purple-500 cursor-pointer"
                      />
                      <span className="text-lg">{grp.emoji}</span>
                      <div>
                        <div className="font-bold text-slate-900">{grp.nombre}</div>
                        <div className="text-[10px] text-slate-500 line-clamp-1">{grp.descripcion || r.descripcion}</div>
                      </div>
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${grp.badgeClass}`}>
                      {grp.codigo}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {grpConfig && (
            <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-[11px] text-purple-900 leading-relaxed">
              Todos los <strong>{selectedUsers.length}</strong> usuarios seleccionados recibirán de inmediato las autorizaciones y privilegios del grupo <strong>{grpConfig.nombre}</strong>.
            </div>
          )}

          <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer transition text-xs"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleBatchAssign}
              disabled={saving || !selectedRole}
              className="px-5 py-2 bg-[#1f0533] hover:bg-[#350854] text-amber-300 font-bold rounded-xl border border-amber-400/50 shadow-xs cursor-pointer flex items-center gap-1.5 transition text-xs disabled:opacity-40"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Aplicando a {selectedUsers.length} usuarios...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Asignar {selectedUsers.length} usuarios a {selectedRole?.nombre}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
