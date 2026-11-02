import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  X, 
  Check, 
  RotateCcw, 
  Sparkles, 
  Sliders, 
  AlertCircle,
  Eye,
  Plus,
  Edit,
  Trash2,
  Ban,
  Download,
  User
} from 'lucide-react';
import { 
  RoleType, 
  SystemModule, 
  ModulePermissionRule, 
  INSTITUTIONAL_RBAC_MATRIX 
} from '../../types.ts';

export interface UsuarioPermisosModalProps {
  user: {
    id_usuario: number;
    username: string;
    nombres: string;
    apellidos: string;
    rol_nombre: RoleType;
    id_rol?: number;
    cargo?: string;
  };
  onClose: () => void;
  onSaved: () => void;
}

const MODULES_CONFIG: {
  id: SystemModule;
  label: string;
  category: string;
  description: string;
  supportedActions: ('ver' | 'crear' | 'editar' | 'eliminar' | 'bloquear' | 'exportar' | 'verPropio' | 'administrar')[];
}[] = [
  {
    id: 'catalogos',
    label: '1. Catálogos (sedes, carreras, aulas, etc.)',
    category: 'Catálogos Base',
    description: 'Sedes, carreras, asignaturas, aulas físicas, tipos de aula y periodos académicos.',
    supportedActions: ['ver', 'crear', 'editar', 'eliminar', 'exportar']
  },
  {
    id: 'docentes',
    label: '2. Docentes',
    category: 'Cuerpo Académico',
    description: 'Ficha y datos del docente, asignación curricular y disponibilidad horaria.',
    supportedActions: ['ver', 'crear', 'editar', 'eliminar', 'exportar', 'verPropio']
  },
  {
    id: 'estudiantes',
    label: '3. Estudiantes',
    category: 'Alumnado',
    description: 'Ficha de estudiantes, matrículas, paralelos y consulta de grupos de clase.',
    supportedActions: ['ver', 'crear', 'editar', 'eliminar', 'exportar', 'verPropio']
  },
  {
    id: 'planificacion_horarios',
    label: '4. Planificación / Horarios',
    category: 'Gestión Horaria',
    description: 'Plantilla de cargas académicas, matriz semanal de horarios, turnos y asignación de aulas.',
    supportedActions: ['ver', 'crear', 'editar', 'eliminar', 'exportar', 'verPropio']
  },
  {
    id: 'usuarios',
    label: '5. Usuarios',
    category: 'Acceso y Cuentas',
    description: 'Gestión de cuentas institucionales, credenciales, estado activo y bloqueo.',
    supportedActions: ['ver', 'crear', 'editar', 'eliminar', 'bloquear', 'administrar', 'verPropio']
  },
  {
    id: 'roles_permisos',
    label: '6. Roles y permisos',
    category: 'Gobierno de Seguridad',
    description: 'Definición de roles de usuario y personalización granular de privilegios.',
    supportedActions: ['ver', 'crear', 'editar', 'eliminar', 'administrar']
  },
  {
    id: 'auditoria',
    label: '7. Auditoría',
    category: 'Trazabilidad',
    description: 'Bitácora inmutable de eventos, modificaciones y trazabilidad de operaciones.',
    supportedActions: ['ver', 'exportar']
  },
  {
    id: 'reportes',
    label: '8. Reportes',
    category: 'Inteligencia Institucional',
    description: 'Estadísticas institucionales, ocupación de aulas y exportaciones oficiales.',
    supportedActions: ['ver', 'exportar', 'verPropio']
  }
];

export const UserPermissionsModal: React.FC<UsuarioPermisosModalProps> = ({
  user,
  onClose,
  onSaved
}) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasCustomOverrides, setHasCustomOverrides] = useState(false);
  const [permissionMode, setPermissionMode] = useState<'ROLE_DEFAULT' | 'CUSTOM'>('ROLE_DEFAULT');
  
  // Custom permissions map: module -> rule
  const [customPerms, setCustomPerms] = useState<Record<SystemModule, ModulePermissionRule>>(() => {
    const base = INSTITUTIONAL_RBAC_MATRIX[user.rol_nombre] || INSTITUTIONAL_RBAC_MATRIX.OPERADOR;
    return JSON.parse(JSON.stringify(base));
  });

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load current overrides from server
  useEffect(() => {
    const fetchPerms = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/seguridad/usuarios/${user.id_usuario}/permisos`);
        const json = await res.json();
        if (json.success && json.data) {
          const overrides = json.data.overrides || {};
          const hasOverrides = json.data.hasOverrides;
          setHasCustomOverrides(hasOverrides);
          
          if (hasOverrides) {
            setPermissionMode('CUSTOM');
            // Merge overrides onto base
            const base = INSTITUTIONAL_RBAC_MATRIX[user.rol_nombre] || INSTITUTIONAL_RBAC_MATRIX.OPERADOR;
            const merged = JSON.parse(JSON.stringify(base));
            Object.entries(overrides).forEach(([k, val]: [string, any]) => {
              if (merged[k as SystemModule]) {
                merged[k as SystemModule] = {
                  ...merged[k as SystemModule],
                  ...val
                };
              }
            });
            setCustomPerms(merged);
          } else {
            setPermissionMode('ROLE_DEFAULT');
            const base = INSTITUTIONAL_RBAC_MATRIX[user.rol_nombre] || INSTITUTIONAL_RBAC_MATRIX.OPERADOR;
            setCustomPerms(JSON.parse(JSON.stringify(base)));
          }
        }
      } catch (err: any) {
        console.error('Error cargando permisos de usuario:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPerms();
  }, [user]);

  const handleToggleAction = (module: SystemModule, action: keyof ModulePermissionRule) => {
    if (permissionMode !== 'CUSTOM') {
      setPermissionMode('CUSTOM');
    }

    setCustomPerms(prev => {
      const currentMod = prev[module] || { ver: false, crear: false, editar: false, eliminar: false, label: '' };
      const currentVal = !!currentMod[action];
      const newVal = !currentVal;

      const updated = {
        ...currentMod,
        [action]: newVal
      };

      // If granting any subaction, ensure 'ver' is also enabled
      if (action !== 'ver' && newVal) {
        updated.ver = true;
      }

      // If disabling 'ver', disable all actions for this module
      if (action === 'ver' && !newVal) {
        updated.crear = false;
        updated.editar = false;
        updated.eliminar = false;
        if ('bloquear' in updated) updated.bloquear = false;
        if ('exportar' in updated) updated.exportar = false;
        if ('verPropio' in updated) updated.verPropio = false;
      }

      return {
        ...prev,
        [module]: updated
      };
    });
  };

  const handleResetToRoleDefault = async () => {
    if (!window.confirm(`¿Desea restaurar todos los permisos de @${user.username} a los valores predeterminados del rol "${user.rol_nombre}"?`)) {
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/seguridad/usuarios/${user.id_usuario}/permisos`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (json.success) {
        const base = INSTITUTIONAL_RBAC_MATRIX[user.rol_nombre] || INSTITUTIONAL_RBAC_MATRIX.OPERADOR;
        setCustomPerms(JSON.parse(JSON.stringify(base)));
        setPermissionMode('ROLE_DEFAULT');
        setHasCustomOverrides(false);
        setMessage({ type: 'success', text: `Permisos restaurados a la configuración estándar del rol ${user.rol_nombre}.` });
        onSaved();
        setTimeout(() => setMessage(null), 3500);
      } else {
        setMessage({ type: 'error', text: json.message || 'Error al restaurar permisos' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error al conectar con el servidor' });
    } finally {
      setSaving(false);
    }
  };

  const handleApplyPreset = (preset: 'FULL_ADMIN' | 'READ_ONLY' | 'DEFAULT') => {
    setPermissionMode('CUSTOM');
    if (preset === 'DEFAULT') {
      const base = INSTITUTIONAL_RBAC_MATRIX[user.rol_nombre] || INSTITUTIONAL_RBAC_MATRIX.OPERADOR;
      setCustomPerms(JSON.parse(JSON.stringify(base)));
    } else if (preset === 'FULL_ADMIN') {
      const adminBase = INSTITUTIONAL_RBAC_MATRIX.ADMINISTRADOR;
      setCustomPerms(JSON.parse(JSON.stringify(adminBase)));
    } else if (preset === 'READ_ONLY') {
      const readOnly: any = {};
      MODULES_CONFIG.forEach(m => {
        readOnly[m.id] = {
          ver: true,
          crear: false,
          editar: false,
          eliminar: false,
          bloquear: false,
          exportar: false,
          verPropio: false,
          label: 'Ver'
        };
      });
      setCustomPerms(readOnly);
    }
  };

  const handleSavePermissions = async () => {
    setSaving(true);
    setMessage(null);

    try {
      if (permissionMode === 'ROLE_DEFAULT') {
        // Remove overrides, return to role default
        const res = await fetch(`/api/seguridad/usuarios/${user.id_usuario}/permisos`, {
          method: 'DELETE'
        });
        const json = await res.json();
        if (json.success) {
          setMessage({ type: 'success', text: 'Permisos sincronizados con el rol asignado.' });
          onSaved();
          setTimeout(() => onClose(), 800);
        } else {
          setMessage({ type: 'error', text: json.message || 'Error al guardar permisos' });
        }
      } else {
        // Save custom overrides
        const res = await fetch(`/api/seguridad/usuarios/${user.id_usuario}/permisos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ permisos: customPerms })
        });
        const json = await res.json();
        if (json.success) {
          setMessage({ type: 'success', text: `Permisos personalizados asignados exitosamente al usuario @${user.username}.` });
          onSaved();
          setTimeout(() => onClose(), 900);
        } else {
          setMessage({ type: 'error', text: json.message || 'Error al guardar asignación de permisos' });
        }
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error al conectar con el servidor' });
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
        className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border-2 border-[#e5a800] overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#1f0533] text-white p-4 sm:p-5 flex items-center justify-between border-b border-purple-900 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#e5a800] text-[#1f0533] flex items-center justify-center font-black shadow-xs">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-white">
                  Asignación de Permisos por Usuario
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-purple-900 text-amber-300 border border-purple-700">
                  {user.rol_nombre}
                </span>
                {hasCustomOverrides && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-purple-950">
                    ★ Personalizado
                  </span>
                )}
              </div>
              <p className="text-xs text-amber-300 mt-0.5">
                {user.nombres} {user.apellidos} • <span className="font-mono">@{user.username}</span> {user.cargo ? `• ${user.cargo}` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-purple-300 hover:text-white hover:bg-purple-900 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal notification message */}
        {message && (
          <div className={`p-3 text-xs font-bold border-b flex items-center justify-between ${
            message.type === 'success' 
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200' 
              : 'bg-rose-50 text-rose-900 border-rose-200'
          }`}>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>{message.text}</span>
            </div>
            <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Body content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          {loading ? (
            <div className="py-12 text-center text-slate-500 font-medium flex flex-col items-center justify-center gap-2">
              <div className="w-7 h-7 border-2 border-purple-700 border-t-transparent rounded-full animate-spin"></div>
              <span>Cargando matriz de permisos del usuario...</span>
            </div>
          ) : (
            <>
              {/* Modalidad de Permisos */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-purple-700" />
                    <span>Régimen de Permisos:</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Seleccione si este usuario hereda exactamente su rol institucional o tiene privilegios a la medida.
                  </p>
                </div>

                <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setPermissionMode('ROLE_DEFAULT');
                      const base = INSTITUTIONAL_RBAC_MATRIX[user.rol_nombre] || INSTITUTIONAL_RBAC_MATRIX.OPERADOR;
                      setCustomPerms(JSON.parse(JSON.stringify(base)));
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                      permissionMode === 'ROLE_DEFAULT'
                        ? 'bg-[#1f0533] text-amber-300 font-black shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <span>Heredar del Rol ({user.rol_nombre})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPermissionMode('CUSTOM')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                      permissionMode === 'CUSTOM'
                        ? 'bg-[#1f0533] text-amber-300 font-black shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Sliders className="w-3 h-3" />
                    <span>Permisos Personalizados</span>
                  </button>
                </div>
              </div>

              {/* Presets rápidos si está en modo personalizado */}
              {permissionMode === 'CUSTOM' && (
                <div className="bg-purple-50/60 p-3 rounded-xl border border-purple-200 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-purple-950 font-bold text-[11px]">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Plantillas rápidas:</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleApplyPreset('DEFAULT')}
                      className="px-2.5 py-1 bg-white hover:bg-purple-100 text-purple-900 border border-purple-200 rounded-lg font-bold text-[11px] transition cursor-pointer"
                    >
                      Copiar valores de {user.rol_nombre}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPreset('READ_ONLY')}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg font-bold text-[11px] transition cursor-pointer"
                    >
                      Solo Lectura (Ver todos)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyPreset('FULL_ADMIN')}
                      className="px-2.5 py-1 bg-purple-900 hover:bg-purple-950 text-amber-300 rounded-lg font-bold text-[11px] transition cursor-pointer"
                    >
                      Control Total (Admin)
                    </button>
                  </div>
                </div>
              )}

              {/* Lista de módulos con acciones granulares */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider px-1">
                  <span>Módulo Institucional &amp; Alcance</span>
                  <span>Acciones Permitidas al Usuario</span>
                </div>

                {MODULES_CONFIG.map((mod) => {
                  const rule = customPerms[mod.id] || { ver: false, crear: false, editar: false, eliminar: false, label: '' };
                  const isAccessible = rule.ver;

                  return (
                    <div 
                      key={mod.id}
                      className={`p-3.5 rounded-xl border transition ${
                        isAccessible 
                          ? 'bg-white border-slate-300 shadow-xs' 
                          : 'bg-slate-50/80 border-slate-200 opacity-80'
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        {/* Info del módulo */}
                        <div className="max-w-md">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-xs">{mod.label}</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
                              {mod.category}
                            </span>
                            {!isAccessible && (
                              <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                                Sin acceso
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                            {mod.description}
                          </p>
                        </div>

                        {/* Botones de acción / switches */}
                        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                          {/* Acción: Ver */}
                          {mod.supportedActions.includes('ver') && (
                            <button
                              type="button"
                              onClick={() => handleToggleAction(mod.id, 'ver')}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer border ${
                                rule.ver
                                  ? 'bg-blue-100 text-blue-900 border-blue-300'
                                  : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'
                              }`}
                              title={rule.ver ? 'Visualización activa' : 'Habilitar visualización'}
                            >
                              <Eye className="w-3 h-3" />
                              <span>Ver</span>
                            </button>
                          )}

                          {/* Acción: Crear */}
                          {mod.supportedActions.includes('crear') && (
                            <button
                              type="button"
                              onClick={() => handleToggleAction(mod.id, 'crear')}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer border ${
                                rule.crear
                                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                  : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'
                              }`}
                              title={rule.crear ? 'Creación permitida' : 'Permitir crear'}
                            >
                              <Plus className="w-3 h-3" />
                              <span>Crear</span>
                            </button>
                          )}

                          {/* Acción: Editar */}
                          {mod.supportedActions.includes('editar') && (
                            <button
                              type="button"
                              onClick={() => handleToggleAction(mod.id, 'editar')}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer border ${
                                rule.editar
                                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                                  : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'
                              }`}
                              title={rule.editar ? 'Edición permitida' : 'Permitir editar'}
                            >
                              <Edit className="w-3 h-3" />
                              <span>Editar</span>
                            </button>
                          )}

                          {/* Acción: Eliminar */}
                          {mod.supportedActions.includes('eliminar') && (
                            <button
                              type="button"
                              onClick={() => handleToggleAction(mod.id, 'eliminar')}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer border ${
                                rule.eliminar
                                  ? 'bg-rose-100 text-rose-900 border-rose-300'
                                  : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'
                              }`}
                              title={rule.eliminar ? 'Eliminación permitida' : 'Permitir eliminar'}
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Eliminar</span>
                            </button>
                          )}

                          {/* Acción: Bloquear (Seguridad) */}
                          {mod.supportedActions.includes('bloquear') && (
                            <button
                              type="button"
                              onClick={() => handleToggleAction(mod.id, 'bloquear')}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer border ${
                                rule.bloquear
                                  ? 'bg-purple-100 text-purple-900 border-purple-300'
                                  : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'
                              }`}
                              title={rule.bloquear ? 'Bloqueo de cuentas permitido' : 'Permitir bloquear'}
                            >
                              <Ban className="w-3 h-3" />
                              <span>Bloquear</span>
                            </button>
                          )}

                          {/* Acción: Exportar (Reportes) */}
                          {mod.supportedActions.includes('exportar') && (
                            <button
                              type="button"
                              onClick={() => handleToggleAction(mod.id, 'exportar')}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer border ${
                                rule.exportar
                                  ? 'bg-teal-100 text-teal-900 border-teal-300'
                                  : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'
                              }`}
                              title={rule.exportar ? 'Exportación PDF/Excel permitida' : 'Permitir exportar'}
                            >
                              <Download className="w-3 h-3" />
                              <span>Exportar</span>
                            </button>
                          )}

                          {/* Acción: Ver Propio (Docente) */}
                          {mod.supportedActions.includes('verPropio') && (
                            <button
                              type="button"
                              onClick={() => handleToggleAction(mod.id, 'verPropio')}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer border ${
                                rule.verPropio
                                  ? 'bg-indigo-100 text-indigo-900 border-indigo-300'
                                  : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'
                              }`}
                              title="Restringir consulta únicamente a sus asignaturas o carga docente propia"
                            >
                              <User className="w-3 h-3" />
                              <span>Ver · propio</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer actions */}
        <div className="bg-slate-100 p-3.5 sm:p-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div>
            {hasCustomOverrides && (
              <button
                type="button"
                onClick={handleResetToRoleDefault}
                disabled={saving}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 rounded-xl text-xs font-bold border border-rose-200 transition flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restaurar Permisos Estándar del Rol</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleSavePermissions}
              disabled={saving || loading}
              className="px-5 py-2 bg-[#1f0533] hover:bg-[#350854] text-amber-300 rounded-xl text-xs font-black border border-amber-400/50 shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-amber-300 border-t-transparent rounded-full animate-spin"></div>
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Guardar Asignación de Permisos</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
