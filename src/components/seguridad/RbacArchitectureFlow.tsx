import React, { useState, useMemo, useEffect } from 'react';
import { 
  Users, 
  ShieldCheck, 
  Key, 
  Layers, 
  ArrowDown, 
  CheckCircle2, 
  XCircle, 
  Building2, 
  Sparkles, 
  Search, 
  Info, 
  ChevronRight,
  UserCheck,
  FolderKanban,
  LayoutDashboard,
  GraduationCap,
  CalendarCheck,
  Clock,
  BarChart3,
  FileText,
  Eye,
  Plus,
  Edit,
  Trash2,
  Copy,
  Check,
  Filter,
  CheckSquare,
  GripVertical,
  Save,
  RotateCcw,
  AlertCircle,
  X,
  Lock,
  Unlock,
  Shield,
  Move
} from 'lucide-react';
import { GrupoSeguridad, RolItem } from '../../views/SeguridadView';
import { INSTITUTIONAL_RBAC_MATRIX, RoleType, SystemModule, SeguridadUser, ModulePermissionRule } from '../../types';

interface RbacArchitectureFlowProps {
  usuarios: SeguridadUser[];
  roles: RolItem[];
  grupos: GrupoSeguridad[];
  onSelectUserForEdit?: (user: SeguridadUser) => void;
  onSelectUserForPerms?: (user: SeguridadUser) => void;
  onOpenAssignGroupModal?: (grupo: GrupoSeguridad) => void;
  onRefresh?: (msg?: string) => void;
}

const MODULOS_SISTEMA: { id: SystemModule; codigo: string; nombre: string; desc: string; icono: any }[] = [
  { id: 'dashboard', codigo: 'MOD-01', nombre: 'Dashboard', desc: 'Métricas de ocupación, campus y kpis institucionales', icono: LayoutDashboard },
  { id: 'seguridad', codigo: 'MOD-02', nombre: 'Seguridad & RBAC', desc: 'Gobierno de identidades, roles, grupos y permisos', icono: ShieldCheck },
  { id: 'academico', codigo: 'MOD-03', nombre: 'Académico', desc: 'Sedes, facultades, carreras, mallas y periodos', icono: GraduationCap },
  { id: 'planificacion', codigo: 'MOD-04', nombre: 'Planificación', desc: 'Carga horaria, asignaturas y paralelos', icono: CalendarCheck },
  { id: 'horario', codigo: 'MOD-05', nombre: 'Horarios', desc: 'Grillas semanales horarias y validación de cruces', icono: Clock },
  { id: 'asignacion_aulas', codigo: 'MOD-06', nombre: 'Aulas & Lab', desc: 'Espacios físicos, laboratorios y control de aforo', icono: Building2 },
  { id: 'reportes', codigo: 'MOD-07', nombre: 'Reportes', desc: 'Exportación de mallas, estadísticas e indicadores', icono: BarChart3 },
  { id: 'auditoria', codigo: 'MOD-08', nombre: 'Auditoría', desc: 'Bitácora forense de operaciones del sistema', icono: FileText }
];

type CrudPermisoKey = 'ver' | 'crear' | 'editar' | 'eliminar' | 'exportar' | 'administrar';

const CRUD_ACTIONS_CONFIG: { key: CrudPermisoKey; label: string; icon: string; color: string; desc: string }[] = [
  { key: 'ver', label: 'Ver', icon: '👁️', color: 'blue', desc: 'Lectura y consulta de información' },
  { key: 'crear', label: 'Crear', icon: '➕', color: 'emerald', desc: 'Alta y registro de nuevas entidades' },
  { key: 'editar', label: 'Editar', icon: '✏️', color: 'amber', desc: 'Modificación y actualización de datos' },
  { key: 'eliminar', label: 'Eliminar', icon: '🗑️', color: 'rose', desc: 'Baja, anulación y desvinculación' },
  { key: 'exportar', label: 'Exportar', icon: '📤', color: 'purple', desc: 'Descarga en Excel, PDF y reportes' },
  { key: 'administrar', label: 'Admin', icon: '⚙️', color: 'indigo', desc: 'Privilegios de gestión y configuración' }
];

export const RbacArchitectureFlow: React.FC<RbacArchitectureFlowProps> = ({
  usuarios,
  roles,
  grupos,
  onSelectUserForEdit,
  onSelectUserForPerms,
  onOpenAssignGroupModal,
  onRefresh
}) => {
  // Estado local sincronizado de grupos y usuarios
  const [localGrupos, setLocalGrupos] = useState<GrupoSeguridad[]>(grupos);
  const [localUsuarios, setLocalUsuarios] = useState<SeguridadUser[]>(usuarios);

  useEffect(() => {
    setLocalGrupos(grupos);
  }, [grupos]);

  useEffect(() => {
    setLocalUsuarios(usuarios);
  }, [usuarios]);

  // Selección activa a lo largo del pipeline
  const [selectedUserId, setSelectedUserId] = useState<number | null>(usuarios[0]?.id_usuario || 1);
  const [selectedGrupoId, setSelectedGrupoId] = useState<number | null>(null);
  const [selectedRolNombre, setSelectedRolNombre] = useState<string | null>(null);

  // Filtros de búsqueda
  const [searchTermUser, setSearchTermUser] = useState('');
  const [searchTermGroup, setSearchTermGroup] = useState('');
  const [filterRoleUser, setFilterRoleUser] = useState('TODOS');

  // Drag and drop state
  const [draggedUser, setDraggedUser] = useState<SeguridadUser | null>(null);
  const [dragOverGroupId, setDragOverGroupId] = useState<number | null>(null);
  const [dragOverRoleId, setDragOverRoleId] = useState<number | null>(null);

  // Modal para Crear Grupo
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [newGroupCodigo, setNewGroupCodigo] = useState('');
  const [newGroupNombre, setNewGroupNombre] = useState('');
  const [newGroupDescripcion, setNewGroupDescripcion] = useState('');
  const [newGroupEmoji, setNewGroupEmoji] = useState('👥');
  const [newGroupColor, setNewGroupColor] = useState('purple');
  const [newGroupIdRolDefecto, setNewGroupIdRolDefecto] = useState<number | ''>(roles[0]?.id_rol || 5);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [groupError, setGroupError] = useState<string | null>(null);

  // Permisos personalizados del usuario seleccionado (overrides)
  const [userOverrides, setUserOverrides] = useState<Record<string, ModulePermissionRule>>({});
  const [loadingOverrides, setLoadingOverrides] = useState(false);
  const [hasCustomOverrides, setHasCustomOverrides] = useState(false);
  const [savingOverrides, setSavingOverrides] = useState(false);
  const [permissionSuccessMsg, setPermissionSuccessMsg] = useState<string | null>(null);

  // Toast de retroalimentación
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3800);
  };

  // Diagrama ASCII solicitado canónicamente por el usuario
  const canonicalDiagramAscii = `                         ┌─────────────────┐
                         │     GRUPOS      │
                         └────────┬────────┘
                                  │
                       agrupan usuarios
                                  │
                                  ▼
                         ┌─────────────────┐
                         │    USUARIOS     │
                         └────────┬────────┘
                                  │
                         asignación de roles
                                  │
                                  ▼
                         ┌─────────────────┐
                         │      ROLES      │
                         └────────┬────────┘
                                  │
                       contienen permisos
                                  │
                                  ▼
                         ┌─────────────────┐
                         │    PERMISOS     │
                         └────────┬────────┘
                                  │
                         sobre los módulos
                                  │
                                  ▼
                         ┌─────────────────┐
                         │    MÓDULOS      │
                         └─────────────────┘`;

  const [copiedAscii, setCopiedAscii] = useState(false);
  const [showAsciiModal, setShowAsciiModal] = useState(false);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleCopyAscii = () => {
    navigator.clipboard.writeText(canonicalDiagramAscii);
    setCopiedAscii(true);
    setTimeout(() => setCopiedAscii(false), 2000);
  };

  // Usuario seleccionado actual
  const selectedUser = useMemo(() => {
    return localUsuarios.find(u => u.id_usuario === selectedUserId) || localUsuarios[0] || null;
  }, [localUsuarios, selectedUserId]);

  // Cargar overrides del usuario seleccionado desde el backend
  useEffect(() => {
    if (!selectedUser) return;
    let isCancelled = false;

    const fetchUserOverrides = async () => {
      setLoadingOverrides(true);
      try {
        const res = await fetch(`/api/seguridad/usuarios/${selectedUser.id_usuario}/permisos`);
        if (!res.ok) throw new Error('Error al consultar permisos');
        const json = await res.json();
        if (!isCancelled && json.success) {
          setUserOverrides(json.data.overrides || {});
          setHasCustomOverrides(Boolean(json.data.hasOverrides));
        }
      } catch (err) {
        console.error('Error fetching user permissions override:', err);
      } finally {
        if (!isCancelled) setLoadingOverrides(false);
      }
    };

    fetchUserOverrides();
    return () => {
      isCancelled = true;
    };
  }, [selectedUser?.id_usuario]);

  // Grupo(s) a los que pertenece el usuario seleccionado
  const userAssignedGroups = useMemo(() => {
    if (!selectedUser) return [];
    return localGrupos.filter(g => g.usuarios?.some(u => u.id_usuario === selectedUser.id_usuario));
  }, [localGrupos, selectedUser]);

  // Rol activo a inspeccionar (o el del usuario seleccionado, o el seleccionado manualmente)
  const activeRoleName = useMemo(() => {
    if (selectedRolNombre) return selectedRolNombre;
    return selectedUser?.rol_nombre || 'CONDULTA';
  }, [selectedRolNombre, selectedUser]);

  // Matriz de permisos base del rol
  const roleBaseMatrix = useMemo(() => {
    const rol = (activeRoleName || 'CONDULTA') as RoleType;
    return INSTITUTIONAL_RBAC_MATRIX[rol] || INSTITUTIONAL_RBAC_MATRIX['CONDULTA'];
  }, [activeRoleName]);

  // Permisos efectivos para cada módulo (combinando base del rol + overrides del usuario si aplica)
  const effectivePermissions = useMemo(() => {
    const result: Record<string, ModulePermissionRule> = {};

    MODULOS_SISTEMA.forEach(m => {
      const baseRule = (roleBaseMatrix as any)[m.id] || {
        ver: false,
        crear: false,
        editar: false,
        eliminar: false,
        exportar: false,
        administrar: false,
        label: 'Sin acceso'
      };

      // Si el usuario seleccionado tiene override para este módulo
      if (userOverrides[m.id]) {
        result[m.id] = { ...baseRule, ...userOverrides[m.id] };
      } else {
        result[m.id] = { ...baseRule };
      }
    });

    return result;
  }, [roleBaseMatrix, userOverrides]);

  // =========================================================================
  // HANDLERS: CREAR GRUPO
  // =========================================================================
  const handleOpenCreateGroup = () => {
    setNewGroupCodigo(`GRP-${Date.now().toString().slice(-4)}`);
    setNewGroupNombre('');
    setNewGroupDescripcion('');
    setNewGroupEmoji('👥');
    setNewGroupColor('purple');
    setNewGroupIdRolDefecto(roles[0]?.id_rol || 5);
    setGroupError(null);
    setShowCreateGroupModal(true);
  };

  const handleSaveNewGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupCodigo.trim() || !newGroupNombre.trim()) {
      setGroupError('El código y el nombre del grupo son obligatorios');
      return;
    }

    setCreatingGroup(true);
    setGroupError(null);

    try {
      const res = await fetch('/api/seguridad/grupos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codigo: newGroupCodigo.trim().toUpperCase(),
          nombre: newGroupNombre.trim(),
          descripcion: newGroupDescripcion.trim(),
          emoji: newGroupEmoji,
          color: newGroupColor,
          id_rol_defecto: newGroupIdRolDefecto ? Number(newGroupIdRolDefecto) : null
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Error al registrar grupo institucional');
      }

      setShowCreateGroupModal(false);
      showToast(`¡Grupo "${newGroupNombre}" creado exitosamente!`, 'success');
      if (onRefresh) onRefresh(`Grupo ${newGroupNombre} registrado`);
    } catch (err: any) {
      setGroupError(err.message || 'Error inesperado al crear grupo');
    } finally {
      setCreatingGroup(false);
    }
  };

  // =========================================================================
  // HANDLERS: DRAG & DROP (ASIGNAR USUARIOS AL GRUPO)
  // =========================================================================
  const handleDragStartUser = (e: React.DragEvent, user: SeguridadUser) => {
    setDraggedUser(user);
    e.dataTransfer.setData('text/plain', String(user.id_usuario));
    e.dataTransfer.setData('application/json', JSON.stringify({
      id_usuario: user.id_usuario,
      username: user.username,
      nombres: user.nombres,
      apellidos: user.apellidos
    }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEndUser = () => {
    setDraggedUser(null);
    setDragOverGroupId(null);
    setDragOverRoleId(null);
  };

  const handleDragOverGroup = (e: React.DragEvent, grupoId: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    if (dragOverGroupId !== grupoId) {
      setDragOverGroupId(grupoId);
    }
  };

  const handleDragLeaveGroup = (grupoId: number) => {
    if (dragOverGroupId === grupoId) {
      setDragOverGroupId(null);
    }
  };

  const handleDropOnGroup = async (e: React.DragEvent, targetGrupo: GrupoSeguridad) => {
    e.preventDefault();
    setDragOverGroupId(null);

    const userIdStr = e.dataTransfer.getData('text/plain');
    const userId = Number(userIdStr) || draggedUser?.id_usuario;

    if (!userId) {
      showToast('No se identificó el usuario a asignar', 'error');
      return;
    }

    const userObj = localUsuarios.find(u => u.id_usuario === userId);
    if (!userObj) return;

    // Verificar si ya pertenece al grupo
    const alreadyIn = targetGrupo.usuarios?.some(u => u.id_usuario === userId);
    if (alreadyIn) {
      showToast(`El usuario @${userObj.username} ya pertenece al grupo "${targetGrupo.nombre}"`, 'info');
      return;
    }

    try {
      const res = await fetch(`/api/seguridad/grupos/${targetGrupo.id_grupo}/usuarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_usuarios: [userId],
          asignar_rol_defecto: true
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Error al asignar usuario al grupo');
      }

      // Actualizar localmente la lista del grupo
      setLocalGrupos(prev => prev.map(g => {
        if (g.id_grupo === targetGrupo.id_grupo) {
          const currentUsers = g.usuarios || [];
          return {
            ...g,
            total_usuarios: currentUsers.length + 1,
            usuarios: [
              ...currentUsers,
              {
                id_usuario: userObj.id_usuario,
                username: userObj.username,
                nombres: userObj.nombres,
                apellidos: userObj.apellidos,
                email: userObj.email,
                cargo: userObj.cargo,
                rol_nombre: targetGrupo.rol_defecto_nombre || userObj.rol_nombre
              }
            ]
          };
        }
        return g;
      }));

      // Si el grupo tenía un rol por defecto, actualizar el rol del usuario localmente
      if (targetGrupo.rol_defecto_nombre) {
        setLocalUsuarios(prev => prev.map(u => {
          if (u.id_usuario === userId) {
            return {
              ...u,
              rol_nombre: targetGrupo.rol_defecto_nombre as RoleType,
              id_rol: targetGrupo.id_rol_defecto || u.id_rol
            };
          }
          return u;
        }));
      }

      showToast(`¡Usuario @${userObj.username} asignado al grupo "${targetGrupo.nombre}"!`, 'success');
      if (onRefresh) onRefresh(`Usuario asignado al grupo ${targetGrupo.nombre}`);
    } catch (err: any) {
      showToast(err.message || 'Error al asignar usuario', 'error');
    }
  };

  // Remover usuario de un grupo
  const handleRemoveUserFromGroup = async (grupoId: number, userId: number, username: string) => {
    try {
      const res = await fetch(`/api/seguridad/grupos/${grupoId}/usuarios/${userId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Error al remover usuario del grupo');
      }

      setLocalGrupos(prev => prev.map(g => {
        if (g.id_grupo === grupoId) {
          const filtered = (g.usuarios || []).filter(u => u.id_usuario !== userId);
          return {
            ...g,
            total_usuarios: filtered.length,
            usuarios: filtered
          };
        }
        return g;
      }));

      showToast(`Usuario @${username} removido del grupo`, 'info');
      if (onRefresh) onRefresh('Usuario removido del grupo');
    } catch (err: any) {
      showToast(err.message || 'Error al remover usuario', 'error');
    }
  };

  // =========================================================================
  // HANDLERS: ASIGNACIÓN DE ROLES (DRAG O SELECT)
  // =========================================================================
  const handleChangeUserRole = async (userId: number, newRoleId: number, newRoleName: RoleType) => {
    try {
      const res = await fetch(`/api/seguridad/usuarios/${userId}/rol`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_rol: newRoleId, rol_nombre: newRoleName })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Error al cambiar rol institucional');
      }

      // Actualizar localmente
      setLocalUsuarios(prev => prev.map(u => {
        if (u.id_usuario === userId) {
          return {
            ...u,
            id_rol: newRoleId,
            rol_nombre: newRoleName
          };
        }
        return u;
      }));

      showToast(`Rol actualizado a "${newRoleName}" para el usuario`, 'success');
      if (onRefresh) onRefresh(`Rol actualizado a ${newRoleName}`);
    } catch (err: any) {
      showToast(err.message || 'Error al asignar rol', 'error');
    }
  };

  // Drag user directly onto a Role card
  const handleDropOnRole = async (e: React.DragEvent, targetRole: RolItem) => {
    e.preventDefault();
    setDragOverRoleId(null);

    const userIdStr = e.dataTransfer.getData('text/plain');
    const userId = Number(userIdStr) || draggedUser?.id_usuario;
    if (!userId) return;

    await handleChangeUserRole(userId, targetRole.id_rol, targetRole.nombre);
  };

  // =========================================================================
  // HANDLERS: PERMISOS (TOGGLE Y GUARDAR OVERRIDES)
  // =========================================================================
  const handleTogglePermission = (moduloId: string, actionKey: CrudPermisoKey) => {
    if (!selectedUser) return;

    setUserOverrides(prev => {
      const currentModuleRule = prev[moduloId] || {
        ...((roleBaseMatrix as any)[moduloId] || {
          ver: false,
          crear: false,
          editar: false,
          eliminar: false,
          exportar: false,
          administrar: false,
          label: 'Personalizado'
        })
      };

      const nextVal = !Boolean((currentModuleRule as any)[actionKey]);
      const updatedRule = {
        ...currentModuleRule,
        [actionKey]: nextVal,
        label: 'Personalizado'
      };

      return {
        ...prev,
        [moduloId]: updatedRule
      };
    });
  };

  // Guardar permisos personalizados en BD
  const handleSaveCustomPermissions = async () => {
    if (!selectedUser) return;
    setSavingOverrides(true);
    setPermissionSuccessMsg(null);

    try {
      const res = await fetch(`/api/seguridad/usuarios/${selectedUser.id_usuario}/permisos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          permisos: userOverrides
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Error al persistir permisos en base de datos');
      }

      setHasCustomOverrides(true);
      setPermissionSuccessMsg('Permisos asignados y guardados correctamente en BD');
      showToast('¡Permisos personalizados guardados exitosamente!', 'success');
      setTimeout(() => setPermissionSuccessMsg(null), 3000);
      if (onRefresh) onRefresh('Permisos de usuario actualizados');
    } catch (err: any) {
      showToast(err.message || 'Error al guardar permisos', 'error');
    } finally {
      setSavingOverrides(false);
    }
  };

  // Restaurar a permisos por defecto del Rol
  const handleResetToRoleDefaults = async () => {
    if (!selectedUser) return;
    setSavingOverrides(true);

    try {
      const res = await fetch(`/api/seguridad/usuarios/${selectedUser.id_usuario}/permisos`, {
        method: 'DELETE'
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Error al restaurar permisos');
      }

      setUserOverrides({});
      setHasCustomOverrides(false);
      showToast('Permisos restaurados a la configuración estándar del rol', 'info');
      if (onRefresh) onRefresh('Permisos restaurados');
    } catch (err: any) {
      showToast(err.message || 'Error al restaurar', 'error');
    } finally {
      setSavingOverrides(false);
    }
  };

  // Filtrado de usuarios
  const filteredUsers = useMemo(() => {
    return localUsuarios.filter(u => {
      const q = searchTermUser.toLowerCase();
      const matchSearch = 
        u.nombres?.toLowerCase().includes(q) ||
        u.apellidos?.toLowerCase().includes(q) ||
        u.username?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.rol_nombre?.toLowerCase().includes(q);

      const matchRole = filterRoleUser === 'TODOS' || u.rol_nombre === filterRoleUser;
      return matchSearch && matchRole;
    });
  }, [localUsuarios, searchTermUser, filterRoleUser]);

  // Filtrado de grupos
  const filteredGrupos = useMemo(() => {
    return localGrupos.filter(g => {
      const q = searchTermGroup.toLowerCase();
      return (
        g.nombre.toLowerCase().includes(q) ||
        g.codigo.toLowerCase().includes(q) ||
        (g.descripcion && g.descripcion.toLowerCase().includes(q))
      );
    });
  }, [localGrupos, searchTermGroup]);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 border text-sm font-semibold transition-all ${
          toastMessage.type === 'success' ? 'bg-emerald-950 text-emerald-100 border-emerald-500' :
          toastMessage.type === 'error' ? 'bg-rose-950 text-rose-100 border-rose-500' :
          'bg-indigo-950 text-indigo-100 border-indigo-500'
        }`}>
          {toastMessage.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
          {toastMessage.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />}
          {toastMessage.type === 'info' && <Info className="w-5 h-5 text-indigo-400 shrink-0" />}
          <span>{toastMessage.text}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CABECERA ARQUITECTURAL CON LA GRÁFICA SOLICITADA */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-purple-800/40 relative overflow-hidden">
        <div className="relative z-10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-[#e5a800] text-[#1f0533] uppercase tracking-wider">
                  Pipeline de Autorización Canónico
                </span>
                <span className="text-xs text-purple-300 font-mono flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Arquitectura 5 Fases
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Flujo Estructurado de Control de Accesos
              </h2>
              <p className="text-xs sm:text-sm text-purple-200/90 max-w-3xl leading-relaxed">
                Gestione grupos institucionales, asigne usuarios arrastrándolos con <span className="text-amber-300 font-bold">Drag &amp; Drop</span>, configure roles y administre los permisos de acción sobre los 8 módulos del campus.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowAsciiModal(true)}
                className="px-3 py-2 bg-purple-900/70 hover:bg-purple-800 text-purple-200 border border-purple-700/60 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="Ver Gráfica Estructurada ASCII"
              >
                <Layers className="w-4 h-4 text-amber-400" />
                <span>Ver Gráfica Canónica</span>
              </button>
              
              <button
                onClick={handleOpenCreateGroup}
                className="px-4 py-2 bg-[#e5a800] hover:bg-amber-400 text-[#1f0533] rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>+ Crear Grupo</span>
              </button>
            </div>
          </div>

          {/* Stepper visual horizontal representativo de la gráfica de 5 bloques */}
          <div className="bg-black/30 p-2.5 rounded-xl border border-purple-800/40 grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
            <button
              type="button"
              onClick={() => scrollToSection('bloque-grupos')}
              className="flex items-center gap-2 p-2 bg-purple-950/80 hover:bg-purple-900 rounded-lg border border-purple-700/60 transition cursor-pointer text-left group"
              title="Ir al Bloque 1: Grupos"
            >
              <div className="w-6 h-6 rounded-md bg-purple-600 group-hover:bg-purple-500 text-white font-black flex items-center justify-center text-xs shrink-0">1</div>
              <div className="truncate">
                <div className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-1">
                  <span>GRUPOS</span>
                  <ChevronRight className="w-3 h-3 text-purple-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <div className="text-[10px] text-purple-300 font-mono truncate">{localGrupos.length} creados</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => scrollToSection('bloque-usuarios')}
              className="flex items-center gap-2 p-2 bg-slate-900/80 hover:bg-sky-950 rounded-lg border border-slate-700/60 hover:border-sky-600 transition cursor-pointer text-left group"
              title="Ir al Bloque 2: Usuarios"
            >
              <div className="w-6 h-6 rounded-md bg-sky-600 group-hover:bg-sky-500 text-white font-black flex items-center justify-center text-xs shrink-0">2</div>
              <div className="truncate">
                <div className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-1">
                  <span>USUARIOS</span>
                  <ChevronRight className="w-3 h-3 text-sky-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <div className="text-[10px] text-sky-300 font-mono truncate">{localUsuarios.length} cuentas</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => scrollToSection('bloque-roles')}
              className="flex items-center gap-2 p-2 bg-slate-900/80 hover:bg-amber-950 rounded-lg border border-slate-700/60 hover:border-amber-600 transition cursor-pointer text-left group"
              title="Ir al Bloque 3: Roles"
            >
              <div className="w-6 h-6 rounded-md bg-amber-600 group-hover:bg-amber-500 text-white font-black flex items-center justify-center text-xs shrink-0">3</div>
              <div className="truncate">
                <div className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-1">
                  <span>ROLES</span>
                  <ChevronRight className="w-3 h-3 text-amber-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <div className="text-[10px] text-amber-300 font-mono truncate">{roles.length} perfiles</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => scrollToSection('bloque-permisos')}
              className="flex items-center gap-2 p-2 bg-slate-900/80 hover:bg-emerald-950 rounded-lg border border-slate-700/60 hover:border-emerald-600 transition cursor-pointer text-left group"
              title="Ir al Bloque 4: Permisos"
            >
              <div className="w-6 h-6 rounded-md bg-emerald-600 group-hover:bg-emerald-500 text-white font-black flex items-center justify-center text-xs shrink-0">4</div>
              <div className="truncate">
                <div className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-1">
                  <span>PERMISOS</span>
                  <ChevronRight className="w-3 h-3 text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <div className="text-[10px] text-emerald-300 font-mono truncate">CRUD + Admin</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => scrollToSection('bloque-modulos')}
              className="flex items-center gap-2 p-2 bg-slate-900/80 hover:bg-rose-950 rounded-lg border border-slate-700/60 hover:border-rose-600 transition cursor-pointer text-left group col-span-2 md:col-span-1"
              title="Ir al Bloque 5: Módulos"
            >
              <div className="w-6 h-6 rounded-md bg-rose-600 group-hover:bg-rose-500 text-white font-black flex items-center justify-center text-xs shrink-0">5</div>
              <div className="truncate">
                <div className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-1">
                  <span>MÓDULOS</span>
                  <ChevronRight className="w-3 h-3 text-rose-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <div className="text-[10px] text-rose-300 font-mono truncate">8 campus</div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. BLOQUE I: GRUPOS (agrupan usuarios) */}
      {/* ========================================================================= */}
      <section id="bloque-grupos" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4 scroll-mt-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold shrink-0">
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900 uppercase tracking-wide">
                  1. GRUPOS
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                  {localGrupos.length} Grupos
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                  <Move className="w-3 h-3" />
                  Dropzones activos para arrastrar usuarios
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Los grupos agrupan usuarios institucionales (Docentes, Coordinadores, Planificadores, etc.).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-48 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar grupo..."
                value={searchTermGroup}
                onChange={(e) => setSearchTermGroup(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-purple-500 focus:bg-white outline-none"
              />
            </div>

            <button
              onClick={handleOpenCreateGroup}
              className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nuevo Grupo</span>
            </button>
          </div>
        </div>

        {/* Rejilla de Tarjetas de Grupo (Cada una es un DROPZONE de Drag & Drop) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGrupos.map((grupo) => {
            const isHovered = dragOverGroupId === grupo.id_grupo;
            const isSelected = selectedGrupoId === grupo.id_grupo;
            const memberCount = grupo.usuarios?.length || grupo.total_usuarios || 0;

            return (
              <div
                key={grupo.id_grupo}
                onDragOver={(e) => handleDragOverGroup(e, grupo.id_grupo)}
                onDragLeave={() => handleDragLeaveGroup(grupo.id_grupo)}
                onDrop={(e) => handleDropOnGroup(e, grupo)}
                onClick={() => setSelectedGrupoId(isSelected ? null : grupo.id_grupo)}
                className={`rounded-xl p-4 transition-all duration-150 border-2 cursor-pointer flex flex-col justify-between relative ${
                  isHovered
                    ? 'border-purple-600 bg-purple-50 ring-4 ring-purple-200 shadow-md scale-[1.01]'
                    : isSelected
                    ? 'border-purple-800 bg-purple-50/40 shadow-sm'
                    : 'border-slate-200 hover:border-purple-300 bg-slate-50/50 hover:bg-white'
                }`}
              >
                {/* Visual Cue on Drag Over */}
                {isHovered && (
                  <div className="absolute inset-0 bg-purple-700/90 text-white rounded-xl flex flex-col items-center justify-center gap-2 z-20 animate-in fade-in duration-100">
                    <div className="w-10 h-10 rounded-full bg-white text-purple-800 flex items-center justify-center font-black text-lg shadow-lg animate-bounce">
                      📥
                    </div>
                    <p className="text-xs font-black uppercase tracking-wider">
                      Soltar usuario aquí
                    </p>
                    <p className="text-[11px] text-purple-200">
                      para asignar al grupo {grupo.nombre}
                    </p>
                  </div>
                )}

                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl p-1.5 bg-white rounded-lg border border-slate-200 shadow-xs">
                        {grupo.emoji || '👥'}
                      </span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                            {grupo.codigo}
                          </span>
                          <span className="text-xs font-black text-slate-800">
                            {grupo.nombre}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-1">
                          {grupo.descripcion || 'Grupo institucional de usuarios'}
                        </p>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-200 text-slate-700 shrink-0">
                      {memberCount} usuarios
                    </span>
                  </div>

                  {/* Rol por defecto si aplica */}
                  {grupo.rol_defecto_nombre && (
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-600 bg-white p-1.5 rounded-lg border border-slate-100">
                      <Shield className="w-3 h-3 text-purple-600" />
                      <span className="font-medium">Rol por defecto:</span>
                      <span className="font-bold text-purple-900 bg-purple-50 px-1.5 py-0.2 rounded text-[10px]">
                        {grupo.rol_defecto_emoji || '🛡️'} {grupo.rol_defecto_nombre}
                      </span>
                    </div>
                  )}

                  {/* Miembros actuales como Chips interactivos */}
                  <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400">
                      <span>Usuarios adscritos:</span>
                      <span className="text-[9px] text-purple-600 font-bold">Arrastra usuarios aquí ➔</span>
                    </div>

                    {grupo.usuarios && grupo.usuarios.length > 0 ? (
                      <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
                        {grupo.usuarios.map((m) => (
                          <div
                            key={m.id_usuario}
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-slate-200 rounded-md text-[10px] text-slate-700 group hover:border-rose-300"
                            title={`${m.nombres} ${m.apellidos} (@${m.username})`}
                          >
                            <span className="w-3.5 h-3.5 rounded-full bg-purple-700 text-white text-[8px] font-bold flex items-center justify-center">
                              {m.username.charAt(0).toUpperCase()}
                            </span>
                            <span className="font-medium truncate max-w-[90px]">{m.username}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveUserFromGroup(grupo.id_grupo, m.id_usuario, m.username);
                              }}
                              className="text-slate-300 hover:text-rose-600 ml-0.5 cursor-pointer"
                              title="Remover usuario del grupo"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-2.5 border border-dashed border-slate-200 rounded-lg text-center bg-slate-50/70 text-[11px] text-slate-400">
                        Ningún usuario en este grupo. Arrastre un usuario aquí para asignarlo.
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 text-[10px]">
                    {isSelected ? '✓ Grupo activo en filtro' : 'Click para filtrar'}
                  </span>
                  
                  {onOpenAssignGroupModal && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenAssignGroupModal(grupo);
                      }}
                      className="text-purple-700 hover:text-purple-900 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                    >
                      <span>+ Asignar manual</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* CONECTOR I -> II: "agrupan usuarios" */}
      {/* ========================================================================= */}
      <div className="flex flex-col items-center justify-center my-2 space-y-1">
        <div className="h-4 w-0.5 bg-purple-300"></div>
        <div className="px-3 py-1 bg-purple-100 text-purple-900 border border-purple-300 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-xs">
          <ArrowDown className="w-3.5 h-3.5 text-purple-700" />
          <span>agrupan usuarios</span>
        </div>
        <div className="h-4 w-0.5 bg-purple-300"></div>
      </div>

      {/* ========================================================================= */}
      {/* 2. BLOQUE II: USUARIOS (asignación de roles) */}
      {/* ========================================================================= */}
      <section id="bloque-usuarios" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4 scroll-mt-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center font-bold shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900 uppercase tracking-wide">
                  2. USUARIOS
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800">
                  {filteredUsers.length} de {localUsuarios.length} Usuarios
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 flex items-center gap-1">
                  <GripVertical className="w-3 h-3" />
                  Arrastrables con el cursor
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Seleccione un usuario para auditar o arrastre su tarjeta a un <span className="font-semibold text-purple-700">Grupo</span> o <span className="font-semibold text-amber-700">Rol</span>.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-40 sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar usuario..."
                value={searchTermUser}
                onChange={(e) => setSearchTermUser(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-sky-500 focus:bg-white outline-none"
              />
            </div>

            <select
              value={filterRoleUser}
              onChange={(e) => setFilterRoleUser(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none cursor-pointer"
            >
              <option value="TODOS">Todos los roles</option>
              {roles.map(r => (
                <option key={r.id_rol} value={r.nombre}>{r.nombre}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Lista de Usuarios Arrastrables (Draggable Cards) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredUsers.map((user) => {
            const isSelected = selectedUserId === user.id_usuario;
            const isBeingDragged = draggedUser?.id_usuario === user.id_usuario;

            return (
              <div
                key={user.id_usuario}
                draggable={true}
                onDragStart={(e) => handleDragStartUser(e, user)}
                onDragEnd={handleDragEndUser}
                onClick={() => setSelectedUserId(user.id_usuario)}
                className={`p-3.5 rounded-xl border transition-all cursor-grab active:cursor-grabbing relative flex flex-col justify-between ${
                  isBeingDragged
                    ? 'opacity-40 border-dashed border-sky-500 bg-sky-50'
                    : isSelected
                    ? 'border-sky-600 bg-sky-50/50 shadow-sm ring-2 ring-sky-200'
                    : 'border-slate-200 hover:border-sky-300 bg-white hover:bg-slate-50/60'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="text-slate-400 hover:text-sky-600 cursor-grab active:cursor-grabbing" title="Arrastra a un Grupo o Rol">
                        <GripVertical className="w-4 h-4" />
                      </div>
                      <div className="w-8 h-8 rounded-full bg-sky-700 text-white text-xs font-black flex items-center justify-center shadow-xs">
                        {user.username.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-slate-900">
                            {user.nombres} {user.apellidos}
                          </span>
                        </div>
                        <p className="text-[11px] font-mono text-slate-500">
                          @{user.username}
                        </p>
                      </div>
                    </div>

                    <span className="text-[10px] font-semibold text-slate-400">
                      ID #{user.id_usuario}
                    </span>
                  </div>

                  {/* Asignación directa de Rol mediante Selector */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <span className="text-[10px] text-slate-500 font-medium">Rol Asignado:</span>
                    <select
                      value={user.id_rol || 5}
                      onChange={(e) => {
                        const targetId = Number(e.target.value);
                        const roleObj = roles.find(r => r.id_rol === targetId);
                        if (roleObj) {
                          handleChangeUserRole(user.id_usuario, roleObj.id_rol, roleObj.nombre);
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="px-2 py-1 bg-amber-50 border border-amber-200 text-amber-900 rounded-md text-[10px] font-bold outline-none cursor-pointer hover:bg-amber-100"
                    >
                      {roles.map(r => (
                        <option key={r.id_rol} value={r.id_rol}>
                          {r.emoji || '🛡️'} {r.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Badges de Grupos a los que pertenece */}
                  <div className="flex flex-wrap items-center gap-1 text-[10px] text-slate-600 pt-1">
                    <span className="text-slate-400 text-[9px]">Grupos:</span>
                    {user.grupos_nombres ? (
                      user.grupos_nombres.split(',').map((gName, idx) => (
                        <span key={idx} className="px-1.5 py-0.2 bg-purple-50 text-purple-800 border border-purple-200 rounded font-medium text-[9px]">
                          👥 {gName.trim()}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400 italic text-[9px]">Sin grupo asignado</span>
                    )}
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                  <span className={`font-semibold ${isSelected ? 'text-sky-700' : 'text-slate-400'}`}>
                    {isSelected ? '● Usuario Seleccionado' : 'Click para auditar'}
                  </span>
                  
                  {onSelectUserForEdit && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectUserForEdit(user);
                      }}
                      className="text-slate-500 hover:text-sky-700 font-bold flex items-center gap-1"
                    >
                      <Edit className="w-3 h-3" />
                      <span>Editar</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* CONECTOR II -> III: "asignación de roles" */}
      {/* ========================================================================= */}
      <div className="flex flex-col items-center justify-center my-2 space-y-1">
        <div className="h-4 w-0.5 bg-amber-300"></div>
        <div className="px-3 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-xs">
          <ArrowDown className="w-3.5 h-3.5 text-amber-700" />
          <span>asignación de roles</span>
        </div>
        <div className="h-4 w-0.5 bg-amber-300"></div>
      </div>

      {/* ========================================================================= */}
      {/* 3. BLOQUE III: ROLES (contienen permisos) */}
      {/* ========================================================================= */}
      <section id="bloque-roles" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4 scroll-mt-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold shrink-0">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900 uppercase tracking-wide">
                  3. ROLES INSTITUCIONALES
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                  {roles.length} Roles
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-900">
                  Rol Activo en Inspección: {activeRoleName}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Los roles contienen y empaquetan permisos granulares para gobernar las acciones institucionales.
              </p>
            </div>
          </div>
        </div>

        {/* Rejilla de Roles (También actúan como dropzones para asignar rol a usuario arrastrado) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {roles.map((r) => {
            const isRoleActive = activeRoleName === r.nombre;
            const isHovered = dragOverRoleId === r.id_rol;
            const usersInRole = localUsuarios.filter(u => u.rol_nombre === r.nombre).length;

            return (
              <div
                key={r.id_rol}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'copy';
                  setDragOverRoleId(r.id_rol);
                }}
                onDragLeave={() => setDragOverRoleId(null)}
                onDrop={(e) => handleDropOnRole(e, r)}
                onClick={() => setSelectedRolNombre(isRoleActive ? null : r.nombre)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer relative ${
                  isHovered
                    ? 'border-amber-600 bg-amber-50 ring-4 ring-amber-200 scale-[1.02]'
                    : isRoleActive
                    ? 'border-amber-600 bg-amber-50/50 shadow-sm ring-2 ring-amber-200'
                    : 'border-slate-200 hover:border-amber-300 bg-slate-50/40 hover:bg-white'
                }`}
              >
                {isHovered && (
                  <div className="absolute inset-0 bg-amber-600/90 text-white rounded-xl flex items-center justify-center font-bold text-xs p-2 text-center z-10 animate-in fade-in">
                    🎯 Soltar para asignar rol {r.nombre}
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-lg p-1 bg-white rounded-lg border border-slate-200">
                      {r.emoji || '🛡️'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                      {usersInRole} usuarios
                    </span>
                  </div>

                  <div>
                    <h4 className="text-xs font-black text-slate-900 tracking-tight">
                      {r.nombre}
                    </h4>
                    <p className="text-[11px] text-slate-500 line-clamp-2">
                      {r.descripcion}
                    </p>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                  <span className={`font-semibold ${isRoleActive ? 'text-amber-700' : 'text-slate-400'}`}>
                    {isRoleActive ? '✓ Seleccionado' : 'Click para auditar'}
                  </span>
                  <span className="text-amber-700 font-bold">Ver permisos ➔</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* CONECTOR III -> IV: "contienen permisos" */}
      {/* ========================================================================= */}
      <div className="flex flex-col items-center justify-center my-2 space-y-1">
        <div className="h-4 w-0.5 bg-emerald-300"></div>
        <div className="px-3 py-1 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-xs">
          <ArrowDown className="w-3.5 h-3.5 text-emerald-700" />
          <span>contienen permisos</span>
        </div>
        <div className="h-4 w-0.5 bg-emerald-300"></div>
      </div>

      {/* ========================================================================= */}
      {/* 4. BLOQUE IV: PERMISOS (sobre los módulos) */}
      {/* ========================================================================= */}
      <section id="bloque-permisos" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4 scroll-mt-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900 uppercase tracking-wide">
                  4. PERMISOS GRANULARES
                </h3>
                {selectedUser && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-900">
                    Evaluando para: @{selectedUser.username} ({selectedUser.rol_nombre})
                  </span>
                )}
                {hasCustomOverrides && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-600" />
                    Permisos Personalizados
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Active o desactive permisos (Ver, Crear, Editar, Eliminar, Exportar, Admin) por cada módulo institucional.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {hasCustomOverrides && (
              <button
                onClick={handleResetToRoleDefaults}
                disabled={savingOverrides}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                title="Restaurar a los permisos estándar del rol"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restaurar al Rol</span>
              </button>
            )}

            <button
              onClick={handleSaveCustomPermissions}
              disabled={savingOverrides}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savingOverrides ? 'Guardando...' : 'Guardar Permisos en BD'}</span>
            </button>
          </div>
        </div>

        {permissionSuccessMsg && (
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{permissionSuccessMsg}</span>
          </div>
        )}

        {/* Matriz Interactiva de Permisos */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 uppercase font-black tracking-wider text-[10px]">
              <tr>
                <th className="p-3">Módulo Institucional</th>
                {CRUD_ACTIONS_CONFIG.map(act => (
                  <th key={act.key} className="p-3 text-center">
                    <span className="inline-flex items-center gap-1">
                      <span>{act.icon}</span>
                      <span>{act.label}</span>
                    </span>
                  </th>
                ))}
                <th className="p-3 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {MODULOS_SISTEMA.map(mod => {
                const rule = effectivePermissions[mod.id] || {
                  ver: false,
                  crear: false,
                  editar: false,
                  eliminar: false,
                  exportar: false,
                  administrar: false,
                  label: 'Sin acceso'
                };
                const hasAny = rule.ver || rule.crear || rule.editar || rule.eliminar;
                const isCustom = Boolean(userOverrides[mod.id]);

                return (
                  <tr key={mod.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-semibold text-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                          {mod.codigo}
                        </span>
                        <span>{mod.nombre}</span>
                        {isCustom && (
                          <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-bold">
                            Modificado
                          </span>
                        )}
                      </div>
                    </td>

                    {CRUD_ACTIONS_CONFIG.map(act => {
                      const isChecked = Boolean((rule as any)[act.key]);

                      return (
                        <td key={act.key} className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleTogglePermission(mod.id, act.key)}
                            className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-all cursor-pointer ${
                              isChecked
                                ? 'bg-emerald-600 text-white font-bold shadow-xs scale-105'
                                : 'bg-slate-100 text-slate-300 hover:bg-slate-200'
                            }`}
                            title={`Alternar ${act.label} en ${mod.nombre}`}
                          >
                            {isChecked ? <Check className="w-4 h-4" /> : <X className="w-3.5 h-3.5" />}
                          </button>
                        </td>
                      );
                    })}

                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        hasAny ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {hasAny ? 'Habilitado' : 'Bloqueado'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* CONECTOR IV -> V: "sobre los módulos" */}
      {/* ========================================================================= */}
      <div className="flex flex-col items-center justify-center my-2 space-y-1">
        <div className="h-4 w-0.5 bg-rose-300"></div>
        <div className="px-3 py-1 bg-rose-100 text-rose-900 border border-rose-300 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-xs">
          <ArrowDown className="w-3.5 h-3.5 text-rose-700" />
          <span>sobre los módulos</span>
        </div>
        <div className="h-4 w-0.5 bg-rose-300"></div>
      </div>

      {/* ========================================================================= */}
      {/* 5. BLOQUE V: MÓDULOS */}
      {/* ========================================================================= */}
      <section id="bloque-modulos" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4 scroll-mt-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center font-bold shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900 uppercase tracking-wide">
                  5. MÓDULOS INSTITUCIONALES DEL CAMPUS
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                  8 Módulos de Operación
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Resultado de acceso efectivo sobre cada módulo del sistema para el rol o usuario evaluado.
              </p>
            </div>
          </div>
        </div>

        {/* Rejilla de los 8 Módulos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {MODULOS_SISTEMA.map(mod => {
            const ModIcon = mod.icono;
            const perms = effectivePermissions[mod.id] || {
              ver: false,
              crear: false,
              editar: false,
              eliminar: false,
              exportar: false,
              administrar: false
            };

            const isFullAccess = perms.ver && perms.crear && perms.editar && perms.eliminar;
            const isReadOnly = perms.ver && !perms.crear && !perms.editar && !perms.eliminar;
            const isNoAccess = !perms.ver && !perms.crear && !perms.editar && !perms.eliminar;

            return (
              <div
                key={mod.id}
                className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                  isFullAccess
                    ? 'border-emerald-300 bg-emerald-50/40 shadow-xs'
                    : isReadOnly
                    ? 'border-sky-300 bg-sky-50/40 shadow-xs'
                    : isNoAccess
                    ? 'border-rose-200 bg-rose-50/30 opacity-70'
                    : 'border-amber-300 bg-amber-50/40 shadow-xs'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-lg ${
                        isNoAccess ? 'bg-rose-100 text-rose-700' : 'bg-white text-slate-700 border border-slate-200 shadow-xs'
                      }`}>
                        <ModIcon className="w-4 h-4" />
                      </div>
                      <span className="font-mono text-[10px] font-bold text-slate-500">
                        {mod.codigo}
                      </span>
                    </div>

                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                      isFullAccess
                        ? 'bg-emerald-200 text-emerald-900'
                        : isReadOnly
                        ? 'bg-sky-200 text-sky-900'
                        : isNoAccess
                        ? 'bg-rose-200 text-rose-900'
                        : 'bg-amber-200 text-amber-900'
                    }`}>
                      {isFullAccess ? 'Total' : isReadOnly ? 'Lectura' : isNoAccess ? 'Sin acceso' : 'Operativo'}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-xs font-black text-slate-900">
                      {mod.nombre}
                    </h4>
                    <p className="text-[11px] text-slate-500 leading-tight line-clamp-2">
                      {mod.desc}
                    </p>
                  </div>

                  {/* Acciones permitidas */}
                  <div className="pt-2 flex flex-wrap gap-1">
                    {perms.ver && (
                      <span className="px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded text-[9px] font-bold">
                        👁️ Ver
                      </span>
                    )}
                    {perms.crear && (
                      <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded text-[9px] font-bold">
                        ➕ Crear
                      </span>
                    )}
                    {perms.editar && (
                      <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded text-[9px] font-bold">
                        ✏️ Editar
                      </span>
                    )}
                    {perms.eliminar && (
                      <span className="px-1.5 py-0.2 bg-rose-100 text-rose-800 rounded text-[9px] font-bold">
                        🗑️ Eliminar
                      </span>
                    )}
                    {perms.exportar && (
                      <span className="px-1.5 py-0.2 bg-purple-100 text-purple-800 rounded text-[9px] font-bold">
                        📤 Exportar
                      </span>
                    )}
                    {perms.administrar && (
                      <span className="px-1.5 py-0.2 bg-indigo-100 text-indigo-800 rounded text-[9px] font-bold">
                        ⚙️ Admin
                      </span>
                    )}
                    {isNoAccess && (
                      <span className="px-1.5 py-0.2 bg-rose-100 text-rose-800 rounded text-[9px] font-bold">
                        🔒 Módulo Bloqueado
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-200/60 text-[10px] text-slate-400">
                  {isNoAccess ? 'Acceso denegado según rol' : 'Operaciones autorizadas'}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* MODAL: CREAR GRUPO INSTITUCIONAL */}
      {/* ========================================================================= */}
      {showCreateGroupModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-xl p-2 bg-purple-100 rounded-xl">👥</span>
                <div>
                  <h3 className="text-base font-black text-slate-900">Crear Nuevo Grupo</h3>
                  <p className="text-xs text-slate-500">Agrupación institucional de usuarios</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateGroupModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {groupError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{groupError}</span>
              </div>
            )}

            <form onSubmit={handleSaveNewGroup} className="space-y-3.5">
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1 space-y-1">
                  <label className="text-xs font-bold text-slate-700">Emoji</label>
                  <input
                    type="text"
                    value={newGroupEmoji}
                    onChange={(e) => setNewGroupEmoji(e.target.value)}
                    maxLength={2}
                    className="w-full text-center py-2 bg-slate-50 border border-slate-200 rounded-xl text-lg outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-bold text-slate-700">Código del Grupo</label>
                  <input
                    type="text"
                    required
                    placeholder="GRP-DOCENTES"
                    value={newGroupCodigo}
                    onChange={(e) => setNewGroupCodigo(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Nombre del Grupo</label>
                <input
                  type="text"
                  required
                  placeholder="Cuerpo Docente de Cátedra"
                  value={newGroupNombre}
                  onChange={(e) => setNewGroupNombre(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Descripción</label>
                <textarea
                  rows={2}
                  placeholder="Docentes adscritos para impartir materias y registrar horas..."
                  value={newGroupDescripcion}
                  onChange={(e) => setNewGroupDescripcion(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Rol por Defecto para Miembros</label>
                <select
                  value={newGroupIdRolDefecto}
                  onChange={(e) => setNewGroupIdRolDefecto(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                >
                  {roles.map(r => (
                    <option key={r.id_rol} value={r.id_rol}>
                      {r.emoji || '🛡️'} {r.nombre} ({r.descripcion})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400">
                  Al arrastrar un usuario a este grupo, se le puede asignar este rol automáticamente.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateGroupModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creatingGroup}
                  className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  {creatingGroup ? 'Creando...' : 'Crear Grupo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: GRÁFICA CANÓNICA ASCII SOLICITADA */}
      {/* ========================================================================= */}
      {showAsciiModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-950 text-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-purple-800/60 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-purple-900/60">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-black text-white">Especificación Gráfica Canónica</h3>
              </div>
              <button
                onClick={() => setShowAsciiModal(false)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-purple-200">
              Esta es la estructura jerárquica de 5 niveles que rige este servicio:
            </p>

            <pre className="p-4 bg-black/60 border border-purple-900/60 rounded-xl text-amber-300 font-mono text-xs overflow-x-auto leading-relaxed">
              {canonicalDiagramAscii}
            </pre>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-purple-300">
                {copiedAscii ? '✓ Copiado al portapapeles' : 'Diagrama oficial RBAC'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyAscii}
                  className="px-3.5 py-1.5 bg-purple-800 hover:bg-purple-700 text-purple-100 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedAscii ? '¡Copiado!' : 'Copiar Diagrama'}</span>
                </button>
                <button
                  onClick={() => setShowAsciiModal(false)}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
