import React, { useState, useEffect } from 'react';
import { 
  X, 
  Check, 
  User, 
  Mail, 
  Phone, 
  Briefcase, 
  ShieldCheck, 
  GraduationCap,
  AlertCircle
} from 'lucide-react';
import { RoleType, getGrupoConfig } from '../../types.ts';

export interface UserEditModalProps {
  user: {
    id_usuario: number;
    username: string;
    nombres: string;
    apellidos: string;
    email: string;
    telefono?: string;
    cargo?: string;
    estado: string;
    rol_nombre: RoleType;
    id_rol?: number;
    id_docente?: number | null;
  };
  roles: { id_rol: number; nombre: string; descripcion: string; emoji?: string; color?: string }[];
  docentesList: { id_docente: number; nombres: string; apellidos: string }[];
  onClose: () => void;
  onSaved: () => void;
}

export const UserEditModal: React.FC<UserEditModalProps> = ({
  user,
  roles,
  docentesList,
  onClose,
  onSaved
}) => {
  const [formData, setFormData] = useState({
    nombres: user.nombres,
    apellidos: user.apellidos,
    username: user.username,
    email: user.email,
    telefono: user.telefono || '',
    cargo: user.cargo || '',
    estado: user.estado || 'ACTIVO',
    id_rol: user.id_rol || 5,
    id_docente: user.id_docente || ''
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedRoleName = roles.find(r => r.id_rol === Number(formData.id_rol))?.nombre || user.rol_nombre;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombres || !formData.apellidos || !formData.username || !formData.email) {
      setError('Por favor complete todos los campos obligatorios');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/seguridad/usuarios/${user.id_usuario}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          id_rol: Number(formData.id_rol),
          id_docente: formData.id_docente ? Number(formData.id_docente) : null
        })
      });

      const json = await res.json();
      if (json.success) {
        onSaved();
        onClose();
      } else {
        setError(json.message || 'Error al actualizar usuario');
      }
    } catch (err: any) {
      setError(err.message || 'Error al conectar con el servidor');
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
        {/* Header */}
        <div className="bg-[#1f0533] text-white p-4 flex items-center justify-between border-b border-purple-900">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#e5a800] text-[#1f0533] flex items-center justify-center font-black">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white">
                Editar Usuario &amp; Asignar Rol
              </h3>
              <p className="text-[11px] text-amber-300">
                Usuario #{user.id_usuario} • @{user.username}
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

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs text-slate-700 max-h-[78vh] overflow-y-auto">
          {/* Nombres y Apellidos */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nombres *</label>
              <input
                type="text"
                required
                value={formData.nombres}
                onChange={e => setFormData(p => ({ ...p, nombres: e.target.value }))}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 font-semibold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Apellidos *</label>
              <input
                type="text"
                required
                value={formData.apellidos}
                onChange={e => setFormData(p => ({ ...p, apellidos: e.target.value }))}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 font-semibold"
              />
            </div>
          </div>

          {/* Username y Correo */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Username *</label>
              <input
                type="text"
                required
                value={formData.username}
                onChange={e => setFormData(p => ({ ...p, username: e.target.value.toLowerCase().replace(/\s+/g, '') }))}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 font-mono text-purple-950 font-bold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Correo Institucional *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Teléfono y Cargo */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Teléfono</label>
              <input
                type="text"
                placeholder="099..."
                value={formData.telefono}
                onChange={e => setFormData(p => ({ ...p, telefono: e.target.value }))}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Cargo Institucional</label>
              <input
                type="text"
                value={formData.cargo}
                onChange={e => setFormData(p => ({ ...p, cargo: e.target.value }))}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* ASIGNACIÓN DE ROL */}
          <div className="bg-purple-50/70 p-3.5 rounded-xl border border-purple-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-purple-950 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-purple-700" />
                <span>Rol Institucional Asignado *</span>
              </label>
              <span className="text-[10px] text-purple-700 font-bold uppercase">
                {selectedRoleName}
              </span>
            </div>

            <select
              value={formData.id_rol}
              onChange={e => setFormData(p => ({ ...p, id_rol: Number(e.target.value) }))}
              className="w-full p-2.5 bg-white border border-purple-300 rounded-xl font-bold text-purple-950 focus:ring-2 focus:ring-purple-500"
            >
              {roles.map(r => {
                const grp = getGrupoConfig(r.nombre);
                return (
                  <option key={r.id_rol} value={r.id_rol}>
                    {grp.emoji} {grp.nombre} ({r.nombre}) - {grp.descripcion || r.descripcion}
                  </option>
                );
              })}
            </select>
            <p className="text-[10px] text-slate-500">
              El rol define los módulos accesibles y las operaciones permitidas por defecto según la Matriz Institucional RBAC.
            </p>
          </div>

          {/* ESTADO & DOCENTE VINCULADO */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Estado de Acceso</label>
              <select
                value={formData.estado}
                onChange={e => setFormData(p => ({ ...p, estado: e.target.value }))}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 font-bold"
              >
                <option value="ACTIVO">ACTIVO (Permitido)</option>
                <option value="BLOQUEADO">BLOQUEADO (Denegado)</option>
                <option value="INACTIVO">INACTIVO</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                <span>Docente Vinculado</span>
              </label>
              <select
                value={formData.id_docente}
                onChange={e => setFormData(p => ({ ...p, id_docente: e.target.value }))}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="">-- Sin vincular a docente --</option>
                {docentesList.map(d => (
                  <option key={d.id_docente} value={d.id_docente}>
                    {d.nombres} {d.apellidos}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-[#1f0533] hover:bg-[#350854] text-amber-300 font-black rounded-xl border border-amber-400/50 shadow-xs cursor-pointer flex items-center gap-1.5 transition"
            >
              {saving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-amber-300 border-t-transparent rounded-full animate-spin"></div>
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Guardar Cambios</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
