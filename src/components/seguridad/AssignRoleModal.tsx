import React, { useState } from 'react';
import { 
  X, 
  Check, 
  ShieldCheck, 
  Users, 
  ArrowRight,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { RoleType, getGrupoConfig } from '../../types.ts';

export interface AssignRoleModalProps {
  user: {
    id_usuario: number;
    username: string;
    nombres: string;
    apellidos: string;
    rol_nombre: RoleType;
    id_rol?: number;
  };
  roles: { id_rol: number; nombre: string; descripcion: string; emoji?: string; color?: string }[];
  onClose: () => void;
  onSaved: () => void;
}

const ROLE_INFO: Record<string, { label: string; desc: string; color: string; modulesSummary: string }> = {
  SUPERADMIN: {
    label: 'Superadministrador General',
    desc: 'Gobierno y control total: gestión exclusiva de usuarios, roles y permisos, auditoría inmutable, catálogos y reportes.',
    color: 'border-amber-500 bg-amber-50 text-amber-950 font-black',
    modulesSummary: 'Control total de la plataforma + administración de usuarios, roles y permisos.'
  },
  ADMINISTRADOR: {
    label: 'Administrador General',
    desc: 'Acceso y gestión operativa completa: CRUD y exportación en catálogos, docentes, estudiantes, planificación y horarios.',
    color: 'border-purple-500 bg-purple-50 text-purple-900',
    modulesSummary: 'CRUD + exportar en Catálogos, Docentes, Estudiantes, Planificación/Horarios; Crear/leer/actualizar usuarios.'
  },
  COORDINADOR: {
    label: 'Coordinador Académico',
    desc: 'Gestión académica y curricular: creación, lectura, actualización y exportación en módulos académicos y reportes.',
    color: 'border-blue-500 bg-blue-50 text-blue-900',
    modulesSummary: 'Crear/leer/actualizar/exportar en Catálogos, Docentes, Estudiantes, Planificación/Horarios y Reportes.'
  },
  DOCENTE: {
    label: 'Docente Titular',
    desc: 'Consulta restringida exclusivamente a sus asignaturas, estudiantes de sus clases y horarios propios (Solo lo propio).',
    color: 'border-indigo-500 bg-indigo-50 text-indigo-900',
    modulesSummary: 'Leer catálogos; Solo lo propio en Docentes, Estudiantes de sus clases, Horarios y Reportes.'
  },
  ESTUDIANTE: {
    label: 'Estudiante Regular',
    desc: 'Acceso a consulta de catálogos y docentes, ficha de datos personales y horarios de clases propios.',
    color: 'border-teal-500 bg-teal-50 text-teal-900',
    modulesSummary: 'Leer catálogos y docentes; Solo lo propio en ficha personal, horarios y reportes.'
  },
  USUARIO_CONSULTA: {
    label: 'Usuario de Consulta / Público',
    desc: 'Consulta y transparencia: lectura de catálogos, visualización y exportación de horarios y consulta de reportes.',
    color: 'border-slate-500 bg-slate-50 text-slate-900',
    modulesSummary: 'Leer catálogos; Leer y exportar horarios; Leer reportes; Sin acceso a datos sensibles.'
  },
  SECRETARIA: {
    label: 'Secretaría de Facultad',
    desc: 'Gestión administrativa de matrículas, paralelos, control de oferta curricular y consulta de programación.',
    color: 'border-emerald-500 bg-emerald-50 text-emerald-900',
    modulesSummary: 'Catálogos (Leer, Editar), Planificación, Horarios y Reportes.'
  },
  OPERADOR: {
    label: 'Operador de Infraestructura',
    desc: 'Monitoreo en tiempo real del estado de aulas (Disponible / Ocupado) y programación física.',
    color: 'border-amber-500 bg-amber-50 text-amber-900',
    modulesSummary: 'Planificación, Horario y Asignación de aulas, Dashboard y Reportes.'
  }
};

export const AssignRoleModal: React.FC<AssignRoleModalProps> = ({
  user,
  roles,
  onClose,
  onSaved
}) => {
  const [selectedRolId, setSelectedRolId] = useState<number>(() => {
    return user.id_rol || roles.find(r => r.nombre === user.rol_nombre)?.id_rol || 5;
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedRole = roles.find(r => r.id_rol === selectedRolId);
  const roleMeta = selectedRole ? ROLE_INFO[selectedRole.nombre] : null;

  const handleAssign = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/seguridad/usuarios/${user.id_usuario}/rol`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_rol: selectedRolId, rol_nombre: selectedRole?.nombre })
      });
      const json = await res.json();
      if (json.success) {
        onSaved();
        onClose();
      } else {
        setError(json.message || 'Error al asignar rol');
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
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white">
                Asignar Rol Institucional
              </h3>
              <p className="text-[11px] text-amber-300">
                {user.nombres} {user.apellidos} (@{user.username})
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
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <div className="text-[10px] text-slate-400 font-bold uppercase">Rol Actual</div>
              <div className="font-black text-slate-800 text-sm">{user.rol_nombre}</div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400" />
            <div className="text-right">
              <div className="text-[10px] text-purple-700 font-bold uppercase">Nuevo Rol</div>
              <div className="font-black text-purple-900 text-sm">{selectedRole?.nombre}</div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block font-bold text-slate-800">
              Seleccione el Grupo / Rol Institucional:
            </label>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {roles.map(r => {
                const isSelected = r.id_rol === selectedRolId;
                const grp = getGrupoConfig(r.nombre);
                return (
                  <div
                    key={r.id_rol}
                    onClick={() => setSelectedRolId(r.id_rol)}
                    className={`p-3 rounded-xl border-2 transition cursor-pointer ${
                      isSelected 
                        ? `${grp.cardBorderClass} ${grp.bgLightClass} shadow-xs border-2` 
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <input
                          type="radio"
                          name="roleOption"
                          checked={isSelected}
                          onChange={() => setSelectedRolId(r.id_rol)}
                          className="text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-base">{grp.emoji}</span>
                        <span className="font-bold text-slate-900">{grp.nombre}</span>
                        <span className="text-[10px] font-mono text-slate-400">({r.nombre})</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${grp.badgeClass}`}>
                        {grp.colorName}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1.5 pl-6 leading-relaxed">
                      {grp.descripcion || r.descripcion}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {roleMeta && (
            <div className="bg-amber-50/80 p-3 rounded-xl border border-amber-200 space-y-1">
              <div className="font-bold text-amber-950 text-[11px] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Privilegios del Rol Seleccionado:</span>
              </div>
              <p className="text-[11px] text-amber-900">
                {roleMeta.modulesSummary}
              </p>
            </div>
          )}

          <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer transition"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleAssign}
              disabled={saving}
              className="px-5 py-2 bg-[#1f0533] hover:bg-[#350854] text-amber-300 font-black rounded-xl border border-amber-400/50 shadow-xs cursor-pointer flex items-center gap-1.5 transition"
            >
              {saving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-amber-300 border-t-transparent rounded-full animate-spin"></div>
                  <span>Asignando...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Confirmar y Asignar Rol</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
