import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldCheck, 
  Users, 
  Key, 
  Lock, 
  History, 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Ban, 
  UserCheck, 
  Shield, 
  Sparkles,
  Info,
  X,
  Plus,
  Eye,
  Phone,
  Mail,
  User,
  Building,
  Calendar,
  ChevronRight,
  Check,
  AlertCircle,
  FileText,
  Clock,
  Sliders,
  Edit,
  Trash2,
  Download,
  Filter,
  ArrowRight,
  GraduationCap,
  Copy,
  Layers,
  FolderKanban,
  Folder,
  ChevronDown,
  MoreHorizontal,
  LayoutDashboard,
  FolderTree,
  FileSpreadsheet
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useAuth } from '../controllers/authContext.tsx';
import { 
  RoleType, 
  SystemModule, 
  INSTITUTIONAL_RBAC_MATRIX,
  SeguridadUser,
  GrupoSeguridad,
  getGrupoConfig,
  GRUPOS_CANONICOS
} from '../types.ts';
import { UserPermissionsModal } from '../components/seguridad/UserPermissionsModal.tsx';
import { UserEditModal } from '../components/seguridad/UserEditModal.tsx';
import { AssignRoleModal } from '../components/seguridad/AssignRoleModal.tsx';
import { AssignUsersToGroupModal } from '../components/seguridad/AssignUsersToGroupModal.tsx';
import { BatchAssignRoleModal } from '../components/seguridad/BatchAssignRoleModal.tsx';
import { MatrizPermisosSubtab } from '../components/seguridad/MatrizPermisosSubtab.tsx';
import { RbacArchitectureFlow } from '../components/seguridad/RbacArchitectureFlow.tsx';
import { GruposManagement } from '../components/seguridad/GruposManagement.tsx';
import { RolesManagement } from '../components/seguridad/RolesManagement.tsx';
import { ModulosSubtab } from '../components/seguridad/ModulosSubtab.tsx';
import { GestionPermisosView } from '../components/seguridad/GestionPermisosView.tsx';
import { AsignacionArbolView } from '../components/seguridad/AsignacionArbolView.tsx';
import { AsignacionAcademicoView } from '../components/seguridad/AsignacionAcademicoView.tsx';
import { PaginationControls } from '../components/common/PaginationControls.tsx';

export type { SeguridadUser, GrupoSeguridad };

export interface AuditoriaRegistro {
  id_auditoria: number;
  id_usuario?: number;
  usuario_nombre?: string;
  modulo: string;
  accion: string;
  descripcion: string;
  ip?: string;
  fecha: string;
}

export interface RolItem {
  id_rol: number;
  nombre: RoleType;
  descripcion: string;
  estado: string;
  emoji?: string;
  color?: string;
}

export type SeguridadSubTab = 'flujo' | 'arquitectura' | 'grupos' | 'usuarios' | 'roles' | 'permisos' | 'gestion_permisos' | 'modulos' | 'auditoria' | 'asignacion_arbol' | 'asignacion_academico';

interface SeguridadViewProps {
  initialSubTab?: SeguridadSubTab;
  initialTab?: SeguridadSubTab;
  activeSubTab?: SeguridadSubTab;
  onTabChange?: (tab: SeguridadSubTab) => void;
}

export const SeguridadView: React.FC<SeguridadViewProps> = ({ 
  initialSubTab, 
  initialTab, 
  activeSubTab, 
  onTabChange 
}) => {
  const rawInitial = activeSubTab || initialSubTab || initialTab || 'gestion_permisos';
  const currentInitial = rawInitial === 'arquitectura' || rawInitial === 'flujo' || rawInitial === 'permisos' ? 'gestion_permisos' : rawInitial;
  const [subTab, setSubTab] = useState<SeguridadSubTab>(currentInitial as SeguridadSubTab);

  useEffect(() => {
    if (activeSubTab) {
      const normalized = activeSubTab === 'arquitectura' || activeSubTab === 'flujo' || activeSubTab === 'permisos' ? 'gestion_permisos' : activeSubTab;
      setSubTab(normalized as SeguridadSubTab);
    }
  }, [activeSubTab]);
  
  const { user: currentUser, refreshAccounts, refreshSession } = useAuth();

  const [usuarios, setUsuarios] = useState<SeguridadUser[]>([]);
  const [roles, setRoles] = useState<RolItem[]>([]);
  const [grupos, setGrupos] = useState<GrupoSeguridad[]>([]);
  const [docentesList, setDocentesList] = useState<{ id_docente: number; nombres: string; apellidos: string }[]>([]);
  const [auditoria, setAuditoria] = useState<AuditoriaRegistro[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('TODOS');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Modals state
  const [userForPerms, setUserForPerms] = useState<SeguridadUser | null>(null);
  const [userForEdit, setUserForEdit] = useState<SeguridadUser | null>(null);
  const [userForRole, setUserForRole] = useState<SeguridadUser | null>(null);
  const [selectedUserForDetail, setSelectedUserForDetail] = useState<SeguridadUser | null>(null);
  const [selectedRoleForDetail, setSelectedRoleForDetail] = useState<RolItem | null>(null);
  const [selectedAuditForDetail, setSelectedAuditForDetail] = useState<AuditoriaRegistro | null>(null);
  const [showNewUserModal, setShowNewUserModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<SeguridadUser | null>(null);

  // Modal para Asignar Usuarios al Grupo/Rol (gestión integral y asignación múltiple)
  const [groupForUserAssignment, setGroupForUserAssignment] = useState<{
    id_grupo?: number;
    id_rol?: number;
    nombre: string;
    descripcion: string;
    emoji?: string;
    color?: string;
  } | null>(null);

  // Selección múltiple de usuarios en la tabla
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [showBatchAssignModal, setShowBatchAssignModal] = useState(false);
  const [openActionMenuId, setOpenActionMenuId] = useState<number | null>(null);

  // Quick Role Assignment from Roles Tab
  const [quickRoleTarget, setQuickRoleTarget] = useState<RolItem | null>(null);
  const [quickRoleUserId, setQuickRoleUserId] = useState<number | ''>('');

  // Inspector de Usuario en Pestaña Permisos
  const [inspectedUserId, setInspectedUserId] = useState<number | ''>('');
  const [inspectedUserPerms, setInspectedUserPerms] = useState<any | null>(null);
  const [loadingInspectedPerms, setLoadingInspectedPerms] = useState(false);

  // Filtros de Auditoría
  const [auditSearchTerm, setAuditSearchTerm] = useState('');
  const [auditModuleFilter, setAuditModuleFilter] = useState('TODOS');
  const [auditActionFilter, setAuditActionFilter] = useState('TODOS');

  // Filtro de Rol para Matriz de Permisos
  const [permisoRoleFilter, setPermisoRoleFilter] = useState<string>('TODOS');

  // Paginación de Usuarios
  const [userPage, setUserPage] = useState<number>(1);
  const [userPageSize, setUserPageSize] = useState<number | 'all'>(10);

  // Paginación de Auditoría
  const [auditPage, setAuditPage] = useState<number>(1);
  const [auditPageSize, setAuditPageSize] = useState<number | 'all'>(15);

  // Modal para Crear Nuevo Grupo / Rol
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);
  const [newGroupForm, setNewGroupForm] = useState({
    nombre: '',
    descripcion: '',
    emoji: '🔵',
    color: 'blue'
  });
  const [isSubmittingGroup, setIsSubmittingGroup] = useState(false);

  // Formulario nuevo usuario
  const [newUserForm, setNewUserForm] = useState({
    nombres: '',
    apellidos: '',
    username: '',
    email: '',
    telefono: '',
    cargo: 'Docente Titular',
    id_rol: 5, // Docente por defecto
    id_docente: ''
  });
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);

  // Sincronizar tab con props externas
  useEffect(() => {
    const target = activeSubTab || initialSubTab || initialTab;
    if (target && target !== subTab) {
      setSubTab(target);
    }
  }, [activeSubTab, initialSubTab, initialTab]);

  const handleSwitchTab = (newTab: SeguridadSubTab) => {
    setSubTab(newTab);
    if (onTabChange) {
      onTabChange(newTab);
    }
  };

  // Carga inicial y refresco de datos
  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [resUsers, resRoles, resAuditoria, resDocentes, resGrupos] = await Promise.all([
        fetch('/api/seguridad/usuarios').then(r => r.json()),
        fetch('/api/seguridad/roles').then(r => r.json()),
        fetch('/api/seguridad/auditoria').then(r => r.json()),
        fetch('/api/docentes').then(r => r.json()).catch(() => ({ success: false, data: [] })),
        fetch('/api/seguridad/grupos').then(r => r.json()).catch(() => ({ success: false, data: [] }))
      ]);

      if (resUsers.success) setUsuarios(resUsers.data || []);
      if (resRoles.success) setRoles(resRoles.data || []);
      if (resAuditoria.success) setAuditoria(resAuditoria.data || []);
      if (resGrupos?.success) setGrupos(resGrupos.data || []);
      if (resDocentes.success && Array.isArray(resDocentes.data)) {
        setDocentesList(resDocentes.data);
      }
    } catch (err: any) {
      setError(err.message || 'Error cargando datos de seguridad');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleDataChanged = async (msg?: string) => {
    await fetchAllData();
    await refreshAccounts();
    await refreshSession();
    if (msg) {
      setActionSuccess(msg);
      setTimeout(() => setActionSuccess(null), 3500);
    }
  };

  // Toggle estado de usuario (Bloquear / Activar)
  const handleToggleEstado = async (u: SeguridadUser) => {
    if (u.id_usuario === 1) {
      alert('La cuenta de Administrador Principal no puede ser bloqueada.');
      return;
    }

    const nuevoEstado = u.estado === 'ACTIVO' ? 'BLOQUEADO' : 'ACTIVO';
    try {
      const res = await fetch(`/api/seguridad/usuarios/${u.id_usuario}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado })
      });
      const json = await res.json();
      if (json.success) {
        handleDataChanged(`Usuario @${u.username} ${nuevoEstado === 'ACTIVO' ? 'desbloqueado y activado' : 'bloqueado'} con éxito.`);
      } else {
        alert(json.message || 'Error al modificar estado del usuario');
      }
    } catch (err: any) {
      alert(err.message || 'Error de conexión');
    }
  };

  // Eliminar usuario
  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      const res = await fetch(`/api/seguridad/usuarios/${userToDelete.id_usuario}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (json.success) {
        handleDataChanged(`Usuario @${userToDelete.username} eliminado correctamente.`);
        setUserToDelete(null);
      } else {
        alert(json.message || 'Error al eliminar usuario');
      }
    } catch (err: any) {
      alert(err.message || 'Error de conexión');
    }
  };

  // Registrar nuevo usuario
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserForm.nombres || !newUserForm.apellidos || !newUserForm.username || !newUserForm.email) {
      alert('Complete los campos obligatorios (*)');
      return;
    }

    setIsSubmittingUser(true);
    try {
      const res = await fetch('/api/seguridad/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newUserForm,
          id_rol: Number(newUserForm.id_rol),
          id_docente: newUserForm.id_docente ? Number(newUserForm.id_docente) : null
        })
      });
      const json = await res.json();
      if (json.success) {
        setShowNewUserModal(false);
        setNewUserForm({
          nombres: '',
          apellidos: '',
          username: '',
          email: '',
          telefono: '',
          cargo: 'Docente Titular',
          id_rol: 5,
          id_docente: ''
        });
        handleDataChanged('Nuevo usuario registrado y credenciales asignadas exitosamente.');
      } else {
        alert(json.message || 'Error al registrar usuario');
      }
    } catch (err: any) {
      alert(err.message || 'Error de conexión');
    } finally {
      setIsSubmittingUser(false);
    }
  };

  // Multi-selección de usuarios en tabla
  const toggleUserSelection = (userId: number) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleSelectAllVisibleUsers = () => {
    const visibleIds = paginatedUsers.map(u => u.id_usuario);
    const allSelected = visibleIds.length > 0 && visibleIds.every(id => selectedUserIds.includes(id));
    if (allSelected) {
      setSelectedUserIds(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      setSelectedUserIds(prev => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  // Asignar rol rápido desde la pestaña Roles
  const handleAssignRoleToUser = async () => {
    if (!quickRoleTarget || !quickRoleUserId) return;
    try {
      const res = await fetch(`/api/seguridad/usuarios/${quickRoleUserId}/rol`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id_rol: quickRoleTarget.id_rol,
          rol_nombre: quickRoleTarget.nombre 
        })
      });
      const json = await res.json();
      if (json.success) {
        setQuickRoleTarget(null);
        setQuickRoleUserId('');
        handleDataChanged(json.message || `Rol ${quickRoleTarget.nombre} asignado correctamente.`);
      } else {
        alert(json.message || 'Error al asignar rol');
      }
    } catch (err: any) {
      alert(err.message || 'Error de conexión');
    }
  };

  // Inspector de permisos en pestaña de matriz
  useEffect(() => {
    if (!inspectedUserId) {
      setInspectedUserPerms(null);
      return;
    }
    const loadInspected = async () => {
      setLoadingInspectedPerms(true);
      try {
        const res = await fetch(`/api/seguridad/usuarios/${inspectedUserId}/permisos`);
        const json = await res.json();
        if (json.success) {
          setInspectedUserPerms(json.data);
        }
      } catch (_) {}
      setLoadingInspectedPerms(false);
    };
    loadInspected();
  }, [inspectedUserId]);

  // Lista filtrada de usuarios
  const filteredUsers = useMemo(() => {
    return usuarios.filter(u => {
      const matchesSearch = 
        u.nombres.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.cargo && u.cargo.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesRole = selectedRoleFilter === 'TODOS' || u.rol_nombre === selectedRoleFilter;
      return matchesSearch && matchesRole;
    });
  }, [usuarios, searchTerm, selectedRoleFilter]);

  // Resetear página de usuarios cuando cambian los filtros
  useEffect(() => {
    setUserPage(1);
  }, [searchTerm, selectedRoleFilter]);

  // Usuarios paginados para no desbordar la pantalla
  const paginatedUsers = useMemo(() => {
    if (userPageSize === 'all') return filteredUsers;
    const start = (userPage - 1) * userPageSize;
    return filteredUsers.slice(start, start + userPageSize);
  }, [filteredUsers, userPage, userPageSize]);

  // Lista filtrada de auditoría
  const filteredAuditoria = useMemo(() => {
    return auditoria.filter(a => {
      const matchesSearch = 
        (a.descripcion && a.descripcion.toLowerCase().includes(auditSearchTerm.toLowerCase())) ||
        (a.usuario_nombre && a.usuario_nombre.toLowerCase().includes(auditSearchTerm.toLowerCase())) ||
        (a.ip && a.ip.toLowerCase().includes(auditSearchTerm.toLowerCase()));
      
      const matchesModule = auditModuleFilter === 'TODOS' || a.modulo === auditModuleFilter;
      const matchesAction = auditActionFilter === 'TODOS' || a.accion === auditActionFilter;

      return matchesSearch && matchesModule && matchesAction;
    });
  }, [auditoria, auditSearchTerm, auditModuleFilter, auditActionFilter]);

  // Resetear página de auditoría cuando cambian los filtros
  useEffect(() => {
    setAuditPage(1);
  }, [auditSearchTerm, auditModuleFilter, auditActionFilter]);

  // Auditoría paginada
  const paginatedAuditoria = useMemo(() => {
    if (auditPageSize === 'all') return filteredAuditoria;
    const start = (auditPage - 1) * auditPageSize;
    return filteredAuditoria.slice(start, start + auditPageSize);
  }, [filteredAuditoria, auditPage, auditPageSize]);

  // Crear nuevo grupo / rol
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupForm.nombre.trim()) {
      alert('El nombre del grupo o rol es obligatorio.');
      return;
    }
    setIsSubmittingGroup(true);
    try {
      const res = await fetch('/api/seguridad/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: newGroupForm.nombre,
          descripcion: newGroupForm.descripcion,
          emoji: newGroupForm.emoji,
          color: newGroupForm.color
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowNewGroupModal(false);
        setNewGroupForm({
          nombre: '',
          descripcion: '',
          emoji: '🔵',
          color: 'blue'
        });
        handleDataChanged(`Grupo ${newGroupForm.emoji} ${newGroupForm.nombre} creado exitosamente.`);
      } else {
        alert(data.message || 'Error al crear el grupo');
      }
    } catch (err: any) {
      alert(err.message || 'Error al conectar con el servidor');
    } finally {
      setIsSubmittingGroup(false);
    }
  };

  // Matriz institucional oficial de 7 módulos canónicos según normativa
  const modulosMatrizOficial = [
    {
      id: 'dashboard' as SystemModule,
      nombre: 'Dashboard',
      categoria: 'Inteligencia & Control',
      desc: 'Métricas institucionales, KPIs de ocupación y resumen ejecutivo'
    },
    {
      id: 'seguridad' as SystemModule,
      nombre: 'Seguridad',
      categoria: 'Gobernanza',
      desc: 'Gestión de usuarios, grupos canónicos, 7 roles canónicos y permisos CRUD'
    },
    {
      id: 'academico' as SystemModule,
      nombre: 'Académico',
      categoria: 'Gestión Académica',
      desc: 'Sedes, carreras, asignaturas, aulas físicas y periodos lectivos'
    },
    {
      id: 'planificacion' as SystemModule,
      nombre: 'Planificación',
      categoria: 'Gestión Académica',
      desc: 'Estructuración de cargas docentes, comisiones y distributivo académico'
    },
    {
      id: 'horario' as SystemModule,
      nombre: 'Horario',
      categoria: 'Gestión Horaria',
      desc: 'Matriz semanal interactiva, control de cruces de horarios y publicación'
    },
    {
      id: 'asignacion_aulas' as SystemModule,
      nombre: 'Asignación de Aulas',
      categoria: 'Infraestructura',
      desc: 'Aulas físicas, laboratorios, aforos y semáforo de disponibilidad'
    },
    {
      id: 'reportes' as SystemModule,
      nombre: 'Reportes',
      categoria: 'Estadísticas e Informes',
      desc: 'Emisión de reportes oficiales de horarios, ocupación y exportaciones'
    }
  ];

  useEffect(() => {
    const handleCloseActionMenu = () => setOpenActionMenuId(null);
    window.addEventListener('click', handleCloseActionMenu);
    return () => window.removeEventListener('click', handleCloseActionMenu);
  }, []);

  const formatUserRoleName = (rol: string) => {
    const normalized = (rol || '').toUpperCase().trim();
    if (normalized === 'SUPERADMIN' || normalized === 'SISTEMAS') return 'Superadministrador';
    if (normalized === 'ADMINISTRADOR' || normalized === 'ADMIN') return 'Administrador';
    if (normalized === 'COORDINADOR') return 'Coordinador';
    if (normalized === 'DOCENTE') return 'Docente';
    if (normalized === 'OPERADOR') return 'Operador';
    if (normalized === 'AUDITOR') return 'Auditor';
    if (normalized === 'CONDULTA' || normalized === 'CONSULTA') return 'Consulta';
    if (normalized === 'INVITADO') return 'Invitado';
    return rol || 'Sin Rol';
  };

  const getUserGroupDisplay = (u: SeguridadUser) => {
    if (u.grupos_nombres && u.grupos_nombres.trim() !== '') {
      return u.grupos_nombres;
    }
    const roleName = (u.rol_nombre || '').toUpperCase().trim();
    if (roleName.includes('SUPERADMIN') || roleName.includes('SISTEMAS')) return 'Administra TI';
    if (roleName.includes('ADMIN')) return 'Dirección Académica';
    if (roleName.includes('COORD') || roleName.includes('SECRETARIA')) return 'Coordinación Académica';
    if (roleName.includes('DOCENTE')) return 'Docentes Titulares';
    if (roleName.includes('OPERADOR')) return 'Operaciones Campus';
    if (roleName.includes('AUDITOR')) return 'Auditoría Interna';
    if (roleName.includes('CONDULTA') || roleName.includes('CONSULTA') || roleName.includes('INVITADO')) return 'Invitados';
    return 'General Institucional';
  };

  const getRoleBadge = (rol: string) => {
    const config = getGrupoConfig(rol);
    return config.badgeClass;
  };

  const getRoleDescription = (rol: string) => {
    const config = getGrupoConfig(rol);
    return config.descripcion;
  };

  return (
    <div id="modulo-seguridad-container" className="space-y-4 max-w-7xl mx-auto pb-10 animate-in fade-in duration-200">
      {/* Header Institucional */}
      <div className="bg-[#1f0533] text-white p-5 sm:p-6 rounded-2xl shadow-md border-b-4 border-[#e5a800] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-[#e5a800] text-[#1f0533] uppercase tracking-wider">
              Control de Accesos &amp; RBAC
            </span>
            <span className="text-purple-300 text-xs flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Base de Datos Institucional
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
            <Shield className="w-6 h-6 text-[#e5a800]" />
            <span>Módulo de Seguridad y Asignación de Permisos</span>
          </h1>
          <p className="text-xs sm:text-sm text-purple-200 max-w-2xl leading-relaxed">
            Matriz institucional de privilegios y permisos de acceso por módulo para los 7 roles canónicos.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => handleDataChanged('Datos actualizados correctamente.')}
            className="px-3.5 py-2 bg-purple-900/60 hover:bg-purple-800 text-purple-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-purple-700 cursor-pointer"
            title="Refrescar catálogo"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sincronizar</span>
          </button>
        </div>
      </div>

      {/* Banner de éxito */}
      {actionSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs font-bold flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Subtab Selector Bar & Exportar Excel */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
          {[
            { id: 'gestion_permisos' as SeguridadSubTab, label: 'Gestión de Permisos', icon: ShieldCheck },
            { id: 'asignacion_arbol' as SeguridadSubTab, label: 'Asignación de Usuarios y Grupos', icon: FolderTree },
            { id: 'asignacion_academico' as SeguridadSubTab, label: 'Asignación Académico', icon: GraduationCap },
            { id: 'usuarios' as SeguridadSubTab, label: `Usuarios (${usuarios.length})`, icon: Users },
            { id: 'roles' as SeguridadSubTab, label: `Grupos y Roles (${grupos.length})`, icon: Key },
            { id: 'auditoria' as SeguridadSubTab, label: `Auditoría (${auditoria.length})`, icon: Clock }
          ].map((tabItem) => {
            const Icon = tabItem.icon;
            const isActive = subTab === tabItem.id || (tabItem.id === 'gestion_permisos' && (subTab === 'permisos' || subTab === 'flujo' || subTab === 'arquitectura'));
            return (
              <button
                key={tabItem.id}
                onClick={() => {
                  setSubTab(tabItem.id);
                  if (onTabChange) onTabChange(tabItem.id);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-[#1f0533] text-[#e5a800] shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#e5a800]' : 'text-slate-500'}`} />
                <span>{tabItem.label}</span>
              </button>
            );
          })}
        </div>

        {/* Action: Exportar a Excel */}
        <button
          onClick={() => {
            const wb = XLSX.utils.book_new();
            const dataUsers = usuarios.map((u, idx) => ({
              'Nº': idx + 1,
              'Usuario': u.username,
              'Nombres': u.nombres,
              'Apellidos': u.apellidos,
              'Correo': u.email,
              'Rol': u.rol_nombre,
              'Grupo': getUserGroupDisplay(u),
              'Cargo': u.cargo || 'Funcionario',
              'Estado': u.estado,
              'Último Acceso': u.ultimo_acceso || 'N/A'
            }));
            const wsUsers = XLSX.utils.json_to_sheet(dataUsers);
            XLSX.utils.book_append_sheet(wb, wsUsers, 'Usuarios');

            if (auditoria && auditoria.length > 0) {
              const dataAudit = auditoria.map((a, idx) => ({
                'Nº': idx + 1,
                'Fecha': a.fecha,
                'Usuario': a.usuario_nombre || 'Sistema',
                'Módulo': a.modulo,
                'Acción': a.accion,
                'Descripción': a.descripcion,
                'IP': a.ip || 'Local'
              }));
              const wsAudit = XLSX.utils.json_to_sheet(dataAudit);
              XLSX.utils.book_append_sheet(wb, wsAudit, 'Auditoría');
            }

            XLSX.writeFile(wb, `seguridad_usuarios_isuj_${new Date().toISOString().slice(0, 10)}.xlsx`);
          }}
          type="button"
          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer self-start md:self-auto shrink-0"
          title="Exportar directorio de usuarios y bitácora de seguridad a Microsoft Excel (.xlsx)"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Exportar Excel</span>
        </button>
      </div>
      {/* 0. SUBTAB: ARQUITECTURA & FLUJO RBAC (USUARIO -> GRUPOS / ROLES -> PERMISOS -> MÓDULOS) */}
      {/* ========================================================================= */}
      {(subTab === 'flujo' || subTab === 'arquitectura') && (
        <RbacArchitectureFlow
          usuarios={usuarios}
          roles={roles}
          grupos={grupos}
          onSelectUserForEdit={(u) => setUserForEdit(u)}
          onSelectUserForPerms={(u) => setUserForPerms(u)}
          onOpenAssignGroupModal={(g) => {
            setGroupForUserAssignment({
              id_grupo: g.id_grupo,
              id_rol: g.id_rol_defecto || undefined,
              nombre: g.nombre,
              descripcion: g.descripcion,
              emoji: g.emoji,
              color: g.color
            });
          }}
          onRefresh={(msg) => handleDataChanged(msg)}
        />
      )}

      {/* ========================================================================= */}
      {/* 0B. SUBTAB: GRUPOS INSTITUCIONALES */}
      {/* ========================================================================= */}
      {subTab === 'grupos' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-6 space-y-5 animate-in fade-in duration-200">
          {/* Barra Superior de Pestañas (Usuarios | Grupos | Roles | Permisos | Árbol) */}
          <div className="flex items-center gap-6 sm:gap-8 border-b border-slate-200 text-sm font-medium overflow-x-auto">
            <button
              type="button"
              onClick={() => handleSwitchTab('usuarios')}
              className="flex items-center gap-2 pb-3 text-slate-600 hover:text-slate-900 transition cursor-pointer shrink-0"
            >
              <Users className="w-4 h-4 text-slate-500" />
              <span>Usuarios</span>
            </button>

            <button
              type="button"
              onClick={() => handleSwitchTab('grupos')}
              className="flex items-center gap-2 pb-3 text-blue-600 border-b-2 border-blue-600 font-semibold transition cursor-pointer shrink-0"
            >
              <Folder className="w-4 h-4 text-blue-600" />
              <span>Grupos</span>
            </button>

            <button
              type="button"
              onClick={() => handleSwitchTab('roles')}
              className="flex items-center gap-2 pb-3 text-slate-600 hover:text-slate-900 transition cursor-pointer shrink-0"
            >
              <Shield className="w-4 h-4 text-slate-500" />
              <span>Roles</span>
            </button>

            <button
              type="button"
              onClick={() => handleSwitchTab('gestion_permisos')}
              className="flex items-center gap-2 pb-3 text-slate-600 hover:text-slate-900 transition cursor-pointer shrink-0"
            >
              <Lock className="w-4 h-4 text-slate-500" />
              <span>Permisos</span>
            </button>

            <button
              type="button"
              onClick={() => handleSwitchTab('asignacion_arbol')}
              className="flex items-center gap-2 pb-3 text-slate-600 hover:text-slate-900 transition cursor-pointer shrink-0"
            >
              <FolderTree className="w-4 h-4 text-slate-500" />
              <span>Árbol de Asignación</span>
            </button>

            <button
              type="button"
              onClick={() => handleSwitchTab('asignacion_academico')}
              className="flex items-center gap-2 pb-3 text-slate-600 hover:text-slate-900 transition cursor-pointer shrink-0"
            >
              <GraduationCap className="w-4 h-4 text-slate-500" />
              <span>Asignación Académico</span>
            </button>
          </div>

          <GruposManagement
            grupos={grupos}
            roles={roles}
            allUsers={usuarios}
            onOpenAssignUsersModal={(g) => {
              setGroupForUserAssignment({
                id_grupo: g.id_grupo,
                id_rol: g.id_rol_defecto || undefined,
                nombre: g.nombre,
                descripcion: g.descripcion,
                emoji: g.emoji,
                color: g.color
              });
            }}
            onRefresh={(msg) => handleDataChanged(msg)}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. SUBTAB: USUARIOS (NUEVO FORMATO SEGÚN LA IMAGEN DE REFERENCIA) */}
      {/* ========================================================================= */}
      {subTab === 'usuarios' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-6 space-y-5 animate-in fade-in duration-200">
          {/* 1. Barra Superior de Pestañas (Usuarios | Grupos | Roles | Permisos | Árbol) */}
          <div className="flex items-center gap-6 sm:gap-8 border-b border-slate-200 text-sm font-medium overflow-x-auto">
            <button
              type="button"
              onClick={() => handleSwitchTab('usuarios')}
              className="flex items-center gap-2 pb-3 text-blue-600 border-b-2 border-blue-600 font-semibold transition cursor-pointer shrink-0"
            >
              <Users className="w-4 h-4 text-blue-600" />
              <span>Usuarios</span>
            </button>

            <button
              type="button"
              onClick={() => handleSwitchTab('grupos')}
              className="flex items-center gap-2 pb-3 text-slate-600 hover:text-slate-900 transition cursor-pointer shrink-0"
            >
              <Folder className="w-4 h-4 text-slate-500" />
              <span>Grupos</span>
            </button>

            <button
              type="button"
              onClick={() => handleSwitchTab('roles')}
              className="flex items-center gap-2 pb-3 text-slate-600 hover:text-slate-900 transition cursor-pointer shrink-0"
            >
              <Shield className="w-4 h-4 text-slate-500" />
              <span>Roles</span>
            </button>

            <button
              type="button"
              onClick={() => handleSwitchTab('gestion_permisos')}
              className="flex items-center gap-2 pb-3 text-slate-600 hover:text-slate-900 transition cursor-pointer shrink-0"
            >
              <Lock className="w-4 h-4 text-slate-500" />
              <span>Permisos</span>
            </button>

            <button
              type="button"
              onClick={() => handleSwitchTab('asignacion_arbol')}
              className="flex items-center gap-2 pb-3 text-slate-600 hover:text-slate-900 transition cursor-pointer shrink-0"
            >
              <FolderTree className="w-4 h-4 text-slate-500" />
              <span>Árbol de Asignación</span>
            </button>

            <button
              type="button"
              onClick={() => handleSwitchTab('asignacion_academico')}
              className="flex items-center gap-2 pb-3 text-slate-600 hover:text-slate-900 transition cursor-pointer shrink-0"
            >
              <GraduationCap className="w-4 h-4 text-slate-500" />
              <span>Asignación Académico</span>
            </button>
          </div>

          {/* 2. Barra de Filtros y Acción: Casilla, Rol, Búsqueda y Botón "+ Nuevo usuario" */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 flex-1">
              {/* Casilla de selección múltiple visible */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={paginatedUsers.length > 0 && paginatedUsers.every(u => selectedUserIds.includes(u.id_usuario))}
                  onChange={handleSelectAllVisibleUsers}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                  title="Seleccionar todos los visibles"
                />
              </div>

              {/* Selector de Rol */}
              <div className="relative min-w-[170px]">
                <select
                  value={selectedRoleFilter}
                  onChange={e => {
                    setSelectedRoleFilter(e.target.value);
                    setUserPage(1);
                  }}
                  className="w-full pl-3 pr-8 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-700 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer appearance-none"
                >
                  <option value="TODOS">Rol</option>
                  <option value="SUPERADMIN">Superadmin</option>
                  <option value="ADMINISTRADOR">Administrador</option>
                  <option value="COORDINADOR">Coordinador</option>
                  <option value="DOCENTE">Docente</option>
                  <option value="OPERADOR">Operador</option>
                  <option value="AUDITOR">Auditor</option>
                  <option value="CONDULTA">Consulta / Invitado</option>
                  {roles.filter(r => !['SUPERADMIN', 'ADMINISTRADOR', 'COORDINADOR', 'DOCENTE', 'OPERADOR', 'AUDITOR', 'CONDULTA', 'CONSULTA'].includes(r.nombre)).map(r => (
                    <option key={`opt-custom-rol-${r.id_rol}`} value={r.nombre}>
                      {r.nombre}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
              </div>

              {/* Buscador de Usuarios */}
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Buscar usuario o correo..."
                  value={searchTerm}
                  onChange={e => {
                    setSearchTerm(e.target.value);
                    setUserPage(1);
                  }}
                  className="w-full pl-9 pr-8 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Botón "+ Nuevo usuario" */}
            <button
              type="button"
              onClick={() => setShowNewUserModal(true)}
              className="border border-blue-500 text-blue-600 hover:bg-blue-50 font-medium text-sm rounded-lg px-4 py-2 flex items-center gap-1.5 transition cursor-pointer shrink-0 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo usuario</span>
            </button>
          </div>

          {/* Barra de Acciones Masivas cuando hay usuarios seleccionados */}
          {selectedUserIds.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 text-blue-900 px-4 py-3 rounded-xl flex flex-wrap items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                  {selectedUserIds.length}
                </span>
                <span className="text-sm font-medium">
                  {selectedUserIds.length} usuario(s) seleccionado(s)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowBatchAssignModal(true)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>Asignar Rol / Grupo en lote</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedUserIds([])}
                  className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg transition cursor-pointer"
                >
                  Deseleccionar
                </button>
              </div>
            </div>
          )}

          {/* Tabla de Usuarios - Formato idéntico a la imagen */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-white text-slate-600 font-medium">
                  <tr>
                    <th className="p-3.5 pl-4 w-12 text-center">
                      <input
                        type="checkbox"
                        checked={paginatedUsers.length > 0 && paginatedUsers.every(u => selectedUserIds.includes(u.id_usuario))}
                        onChange={handleSelectAllVisibleUsers}
                        className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                      />
                    </th>
                    <th className="p-3.5 font-semibold text-slate-700">Nombre</th>
                    <th className="p-3.5 font-semibold text-slate-700">Rol</th>
                    <th className="p-3.5 font-semibold text-slate-700">Grupo</th>
                    <th className="p-3.5 pr-4 w-16 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400 text-sm">
                        No se encontraron usuarios registrados con el filtro aplicado.
                      </td>
                    </tr>
                  ) : (
                    paginatedUsers.map(u => {
                      const isSelected = selectedUserIds.includes(u.id_usuario);
                      const isCurrentUser = currentUser?.id_usuario === u.id_usuario;
                      const roleDisplay = formatUserRoleName(u.rol_nombre);
                      const groupDisplay = getUserGroupDisplay(u);
                      const isMenuOpen = openActionMenuId === u.id_usuario;

                      return (
                        <tr
                          key={`user-row-canonical-${u.id_usuario}`}
                          className={`hover:bg-slate-50/70 transition-colors ${isSelected ? 'bg-blue-50/40' : ''}`}
                        >
                          <td className="p-3.5 pl-4 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                e.stopPropagation();
                                toggleUserSelection(u.id_usuario);
                              }}
                              className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                            />
                          </td>
                          <td className="p-3.5">
                            <div>
                              <div className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
                                <span>{u.nombres} {u.apellidos}</span>
                                {isCurrentUser && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-100 text-blue-700 font-bold">
                                    Tú
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-slate-500 mt-0.5">
                                {u.email}
                              </div>
                            </div>
                          </td>
                          <td className="p-3.5">
                            <span className="text-sm font-medium text-slate-800">
                              {roleDisplay}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <span className="text-sm text-slate-600">
                              {groupDisplay}
                            </span>
                          </td>
                          <td className="p-3.5 pr-4 text-right relative">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenActionMenuId(isMenuOpen ? null : u.id_usuario);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                              title="Opciones de usuario"
                            >
                              <MoreHorizontal className="w-5 h-5" />
                            </button>

                            {/* Menú de Acciones Desplegable */}
                            {isMenuOpen && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="absolute right-4 top-10 z-30 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 text-left text-xs font-medium text-slate-700 animate-in fade-in zoom-in-95"
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenActionMenuId(null);
                                    setUserForEdit(u);
                                  }}
                                  className="w-full px-3 py-2 hover:bg-slate-100 flex items-center gap-2 transition text-left cursor-pointer"
                                >
                                  <Edit className="w-3.5 h-3.5 text-slate-500" />
                                  <span>Editar usuario</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenActionMenuId(null);
                                    setUserForRole(u);
                                  }}
                                  className="w-full px-3 py-2 hover:bg-slate-100 flex items-center gap-2 transition text-left cursor-pointer"
                                >
                                  <Key className="w-3.5 h-3.5 text-blue-600" />
                                  <span>Asignar Rol</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenActionMenuId(null);
                                    setUserForPerms(u);
                                  }}
                                  className="w-full px-3 py-2 hover:bg-slate-100 flex items-center gap-2 transition text-left cursor-pointer"
                                >
                                  <Sliders className="w-3.5 h-3.5 text-purple-600" />
                                  <span>Gestionar Permisos</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenActionMenuId(null);
                                    setGroupForUserAssignment({
                                      id_grupo: 1,
                                      nombre: 'Administra TI',
                                      descripcion: 'Departamento de TI',
                                      emoji: '💻',
                                      color: 'purple'
                                    });
                                  }}
                                  className="w-full px-3 py-2 hover:bg-slate-100 flex items-center gap-2 transition text-left cursor-pointer"
                                >
                                  <Users className="w-3.5 h-3.5 text-teal-600" />
                                  <span>Asignar a Grupo</span>
                                </button>
                                <div className="my-1 border-t border-slate-100" />
                                <button
                                  type="button"
                                  disabled={u.id_usuario === 1}
                                  onClick={() => {
                                    setOpenActionMenuId(null);
                                    handleToggleEstado(u);
                                  }}
                                  className={`w-full px-3 py-2 hover:bg-slate-100 flex items-center gap-2 transition text-left cursor-pointer ${
                                    u.estado === 'ACTIVO' ? 'text-amber-700' : 'text-emerald-700'
                                  }`}
                                >
                                  {u.estado === 'ACTIVO' ? (
                                    <>
                                      <Ban className="w-3.5 h-3.5 text-amber-600" />
                                      <span>Bloquear usuario</span>
                                    </>
                                  ) : (
                                    <>
                                      <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                                      <span>Activar usuario</span>
                                    </>
                                  )}
                                </button>
                                <button
                                  type="button"
                                  disabled={u.id_usuario === 1}
                                  onClick={() => {
                                    setOpenActionMenuId(null);
                                    setUserToDelete(u);
                                  }}
                                  className="w-full px-3 py-2 hover:bg-rose-50 text-rose-600 flex items-center gap-2 transition text-left cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                  <span>Eliminar</span>
                                </button>
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
          </div>

          {/* Paginación */}
          <PaginationControls
            currentPage={userPage}
            totalItems={filteredUsers.length}
            pageSize={userPageSize}
            pageSizeOptions={[5, 10, 15, 25, 50, 'all']}
            itemName="usuarios registrados"
            onPageChange={setUserPage}
            onPageSizeChange={newSize => {
              setUserPageSize(newSize);
              setUserPage(1);
            }}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. SUBTAB: ROLES */}
      {/* ========================================================================= */}
      {subTab === 'roles' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-6 space-y-5 animate-in fade-in duration-200">
          {/* Barra Superior de Pestañas (Usuarios | Grupos | Roles | Permisos | Árbol) */}
          <div className="flex items-center gap-6 sm:gap-8 border-b border-slate-200 text-sm font-medium overflow-x-auto">
            <button
              type="button"
              onClick={() => handleSwitchTab('usuarios')}
              className="flex items-center gap-2 pb-3 text-slate-600 hover:text-slate-900 transition cursor-pointer shrink-0"
            >
              <Users className="w-4 h-4 text-slate-500" />
              <span>Usuarios</span>
            </button>

            <button
              type="button"
              onClick={() => handleSwitchTab('grupos')}
              className="flex items-center gap-2 pb-3 text-slate-600 hover:text-slate-900 transition cursor-pointer shrink-0"
            >
              <Folder className="w-4 h-4 text-slate-500" />
              <span>Grupos</span>
            </button>

            <button
              type="button"
              onClick={() => handleSwitchTab('roles')}
              className="flex items-center gap-2 pb-3 text-blue-600 border-b-2 border-blue-600 font-semibold transition cursor-pointer shrink-0"
            >
              <Shield className="w-4 h-4 text-blue-600" />
              <span>Roles</span>
            </button>

            <button
              type="button"
              onClick={() => handleSwitchTab('gestion_permisos')}
              className="flex items-center gap-2 pb-3 text-slate-600 hover:text-slate-900 transition cursor-pointer shrink-0"
            >
              <Lock className="w-4 h-4 text-slate-500" />
              <span>Permisos</span>
            </button>

            <button
              type="button"
              onClick={() => handleSwitchTab('asignacion_arbol')}
              className="flex items-center gap-2 pb-3 text-slate-600 hover:text-slate-900 transition cursor-pointer shrink-0"
            >
              <FolderTree className="w-4 h-4 text-slate-500" />
              <span>Árbol de Asignación</span>
            </button>

            <button
              type="button"
              onClick={() => handleSwitchTab('asignacion_academico')}
              className="flex items-center gap-2 pb-3 text-slate-600 hover:text-slate-900 transition cursor-pointer shrink-0"
            >
              <GraduationCap className="w-4 h-4 text-slate-500" />
              <span>Asignación Académico</span>
            </button>
          </div>

          <RolesManagement
            roles={roles}
            allUsers={usuarios}
            onOpenAssignUsersModal={(r) => {
              setGroupForUserAssignment({
                id_rol: r.id_rol,
                nombre: r.nombre,
                descripcion: r.descripcion,
                emoji: r.emoji,
                color: r.color
              });
            }}
            onViewPermissions={(roleName) => {
              setPermisoRoleFilter(roleName);
              handleSwitchTab('gestion_permisos');
            }}
            onRefresh={(msg) => handleDataChanged(msg)}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. SUBTAB: GESTIÓN DE PERMISOS (SEGÚN IMAGEN DEL USUARIO)                */}
      {/* ========================================================================= */}
      {(subTab === "permisos" || subTab === "gestion_permisos") && (
        <GestionPermisosView
          activeTab="permisos"
          onTabChange={(tab) => {
            if (tab === 'usuarios') handleSwitchTab('usuarios');
            else if (tab === 'grupos') handleSwitchTab('grupos');
            else if (tab === 'roles') handleSwitchTab('roles');
            else if (tab === 'asignacion_arbol') handleSwitchTab('asignacion_arbol');
            else if (tab === 'asignacion_academico') handleSwitchTab('asignacion_academico');
            else handleSwitchTab('gestion_permisos');
          }}
          usuarios={usuarios}
          roles={roles}
          grupos={grupos}
        />
      )}

      {/* ========================================================================= */}
      {/* 3B. SUBTAB: ASIGNACIÓN DE USUARIOS Y GRUPOS EN ÁRBOL (DRAG & DROP)       */}
      {/* ========================================================================= */}
      {subTab === 'asignacion_arbol' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-6 space-y-5 animate-in fade-in duration-200">
          {/* Barra Superior de Pestañas (Usuarios | Grupos | Roles | Permisos | Árbol) */}
          <div className="flex items-center gap-6 sm:gap-8 border-b border-slate-200 text-sm font-medium overflow-x-auto">
            <button
              type="button"
              onClick={() => handleSwitchTab('usuarios')}
              className="flex items-center gap-2 pb-3 text-slate-600 hover:text-slate-900 transition cursor-pointer shrink-0"
            >
              <Users className="w-4 h-4 text-slate-500" />
              <span>Usuarios</span>
            </button>

            <button
              type="button"
              onClick={() => handleSwitchTab('grupos')}
              className="flex items-center gap-2 pb-3 text-slate-600 hover:text-slate-900 transition cursor-pointer shrink-0"
            >
              <Folder className="w-4 h-4 text-slate-500" />
              <span>Grupos</span>
            </button>

            <button
              type="button"
              onClick={() => handleSwitchTab('roles')}
              className="flex items-center gap-2 pb-3 text-slate-600 hover:text-slate-900 transition cursor-pointer shrink-0"
            >
              <Shield className="w-4 h-4 text-slate-500" />
              <span>Roles</span>
            </button>

            <button
              type="button"
              onClick={() => handleSwitchTab('gestion_permisos')}
              className="flex items-center gap-2 pb-3 text-slate-600 hover:text-slate-900 transition cursor-pointer shrink-0"
            >
              <Lock className="w-4 h-4 text-slate-500" />
              <span>Permisos</span>
            </button>

            <button
              type="button"
              onClick={() => handleSwitchTab('asignacion_arbol')}
              className="flex items-center gap-2 pb-3 text-blue-600 border-b-2 border-blue-600 font-semibold transition cursor-pointer shrink-0"
            >
              <FolderTree className="w-4 h-4 text-blue-600" />
              <span>Árbol de Asignación</span>
            </button>

            <button
              type="button"
              onClick={() => handleSwitchTab('asignacion_academico')}
              className="flex items-center gap-2 pb-3 text-slate-600 hover:text-slate-900 transition cursor-pointer shrink-0"
            >
              <GraduationCap className="w-4 h-4 text-slate-500" />
              <span>Asignación Académico</span>
            </button>
          </div>

          <AsignacionArbolView
            grupos={grupos}
            roles={roles}
            allUsers={usuarios}
            onRefresh={(msg) => handleDataChanged(msg)}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3C. SUBTAB: ASIGNACIÓN ACADÉMICO (SEDE, ESCUELA, CARRERA, AULAS)          */}
      {/* ========================================================================= */}
      {subTab === 'asignacion_academico' && (
        <AsignacionAcademicoView
          activeTab="asignacion_academico"
          onTabChange={(tab) => handleSwitchTab(tab as SeguridadSubTab)}
          usuarios={usuarios}
          roles={roles}
          grupos={grupos}
        />
      )}

      {/* ========================================================================= */}
      {/* 5. SUBTAB: MÓDULOS (CATÁLOGO INSTITUCIONAL Y GOBIERNO DE ACCESOS)       */}
      {/* ========================================================================= */}
      {subTab === 'modulos' && (
        <ModulosSubtab
          roles={roles}
          usuarios={usuarios}
          onNavigateToPermisos={(role) => {
            if (role) setPermisoRoleFilter(role);
            handleSwitchTab('permisos');
          }}
          onNavigateToFlujo={() => handleSwitchTab('flujo')}
        />
      )}

      {/* ========================================================================= */}
      {/* 4. SUBTAB: AUDITORÍA */}
      {/* ========================================================================= */}
      {subTab === 'auditoria' && (
        <div className="space-y-4">
          {/* Filtros de Auditoría */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar por usuario, acción, IP..."
                value={auditSearchTerm}
                onChange={e => setAuditSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={auditModuleFilter}
                onChange={e => setAuditModuleFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-purple-500 cursor-pointer"
              >
                <option value="TODOS">Todos los módulos</option>
                <option value="SEGURIDAD">Seguridad</option>
                <option value="USUARIOS">Usuarios</option>
                <option value="ROLES">Roles</option>
                <option value="PERMISOS">Permisos</option>
                <option value="HORARIOS">Horarios</option>
                <option value="AULAS">Aulas</option>
              </select>

              <select
                value={auditActionFilter}
                onChange={e => setAuditActionFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-purple-500 cursor-pointer"
              >
                <option value="TODOS">Todas las acciones</option>
                <option value="LOGIN">LOGIN</option>
                <option value="ASIGNAR_ROL">ASIGNAR_ROL</option>
                <option value="ACTUALIZAR_PERMISOS">ACTUALIZAR_PERMISOS</option>
                <option value="RESET_PERMISOS">RESET_PERMISOS</option>
                <option value="MODIFICAR">MODIFICAR</option>
                <option value="BLOQUEO">BLOQUEO</option>
              </select>
            </div>
          </div>

          {/* Tabla de Bitácora */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#1f0533] text-amber-300 font-bold text-[11px] uppercase tracking-wider border-b border-purple-900">
                  <tr>
                    <th className="p-3.5 pl-4">ID</th>
                    <th className="p-3.5">Fecha &amp; Hora</th>
                    <th className="p-3.5">Usuario Ejecutor</th>
                    <th className="p-3.5">Módulo</th>
                    <th className="p-3.5">Acción</th>
                    <th className="p-3.5">Descripción del Registro</th>
                    <th className="p-3.5 pr-4 text-right">Detalle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {paginatedAuditoria.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        No se registraron eventos con los filtros seleccionados.
                      </td>
                    </tr>
                  ) : (
                    paginatedAuditoria.map(a => (
                      <tr key={a.id_auditoria} className="hover:bg-slate-50 transition">
                        <td className="p-3.5 pl-4 font-mono font-bold text-slate-500">
                          #{a.id_auditoria}
                        </td>
                        <td className="p-3.5 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                          {a.fecha}
                        </td>
                        <td className="p-3.5 font-bold text-purple-950">
                          @{a.usuario_nombre || 'sistema'}
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {a.modulo}
                          </span>
                        </td>
                        <td className="p-3.5 font-bold text-slate-800">
                          {a.accion}
                        </td>
                        <td className="p-3.5 text-slate-600 max-w-md truncate">
                          {a.descripcion}
                        </td>
                        <td className="p-3.5 pr-4 text-right">
                          <button
                            onClick={() => setSelectedAuditForDetail(a)}
                            className="p-1.5 hover:bg-purple-100 text-purple-900 rounded-lg transition cursor-pointer"
                            title="Ver registro completo"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Paginación de Auditoría */}
          <PaginationControls
            currentPage={auditPage}
            totalItems={filteredAuditoria.length}
            pageSize={auditPageSize}
            pageSizeOptions={[10, 15, 25, 50, 100, 'all']}
            itemName="registros de auditoría"
            onPageChange={setAuditPage}
            onPageSizeChange={newSize => {
              setAuditPageSize(newSize);
              setAuditPage(1);
            }}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: ASIGNACIÓN Y PERSONALIZACIÓN DE PERMISOS */}
      {/* ========================================================================= */}
      {userForPerms && (
        <UserPermissionsModal
          user={userForPerms}
          onClose={() => setUserForPerms(null)}
          onSaved={() => handleDataChanged(`Permisos actualizados para @${userForPerms.username}`)}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ASIGNAR ROL INSTITUCIONAL RÁPIDO */}
      {/* ========================================================================= */}
      {userForRole && (
        <AssignRoleModal
          user={userForRole}
          roles={roles}
          onClose={() => setUserForRole(null)}
          onSaved={() => handleDataChanged(`Rol institucional reasignado a @${userForRole.username}`)}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: EDITAR PERFIL Y ASIGNAR ROL AL USUARIO */}
      {/* ========================================================================= */}
      {userForEdit && (
        <UserEditModal
          user={userForEdit}
          roles={roles}
          docentesList={docentesList}
          onClose={() => setUserForEdit(null)}
          onSaved={() => handleDataChanged(`Información del usuario @${userForEdit.username} guardada.`)}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: ASIGNAR USUARIO DESDE PESTAÑA ROLES */}
      {/* ========================================================================= */}
      {quickRoleTarget && (
        <div 
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs animate-in fade-in"
          onClick={() => setQuickRoleTarget(null)}
        >
          <div 
            className="bg-white rounded-2xl max-w-md w-full shadow-2xl border-2 border-[#e5a800] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-[#1f0533] text-white p-4 flex items-center justify-between border-b border-purple-900">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-amber-300" />
                <div>
                  <h3 className="font-bold text-sm text-white">Asignar a {quickRoleTarget.nombre}</h3>
                  <p className="text-[10px] text-amber-300">Seleccione el usuario que recibirá este rol</p>
                </div>
              </div>
              <button onClick={() => setQuickRoleTarget(null)} className="text-purple-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Seleccione el usuario a asignar:
                </label>
                <select
                  value={quickRoleUserId}
                  onChange={e => setQuickRoleUserId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">-- Seleccionar usuario --</option>
                  {usuarios.map(u => (
                    <option key={u.id_usuario} value={u.id_usuario}>
                      {u.nombres} {u.apellidos} (@{u.username} - Rol actual: {u.rol_nombre})
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-[11px] text-purple-900 leading-relaxed">
                Al confirmar, el usuario heredará de inmediato las autorizaciones y capacidades del perfil institucional <strong>{quickRoleTarget.nombre}</strong>.
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setQuickRoleTarget(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleAssignRoleToUser}
                  disabled={!quickRoleUserId}
                  className="px-5 py-2 bg-[#1f0533] hover:bg-[#350854] text-amber-300 font-bold rounded-xl border border-amber-400/50 shadow-xs cursor-pointer disabled:opacity-40"
                >
                  Confirmar Asignación
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: REGISTRO DE NUEVO USUARIO */}
      {/* ========================================================================= */}
      {showNewUserModal && (
        <div 
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs animate-in fade-in"
          onClick={() => setShowNewUserModal(false)}
        >
          <div 
            className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border-2 border-[#e5a800] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-[#1f0533] text-white p-4 flex items-center justify-between border-b border-purple-900">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#e5a800] text-[#1f0533] flex items-center justify-center font-bold">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Registrar Nuevo Usuario</h3>
                  <p className="text-[10px] text-amber-300">Asigne credenciales y perfil de acceso</p>
                </div>
              </div>
              <button onClick={() => setShowNewUserModal(false)} className="text-purple-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-4 sm:p-5 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nombres *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Juan Carlos"
                    value={newUserForm.nombres}
                    onChange={e => setNewUserForm(p => ({ ...p, nombres: e.target.value }))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Apellidos *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Pérez Silva"
                    value={newUserForm.apellidos}
                    onChange={e => setNewUserForm(p => ({ ...p, apellidos: e.target.value }))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Username *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. jperez"
                    value={newUserForm.username}
                    onChange={e => setNewUserForm(p => ({ ...p, username: e.target.value.toLowerCase().replace(/\s+/g, '') }))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Correo Institucional *</label>
                  <input
                    type="email"
                    required
                    placeholder="Ej. jperez@isuj.edu.ec"
                    value={newUserForm.email}
                    onChange={e => setNewUserForm(p => ({ ...p, email: e.target.value }))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Rol Asignado *</label>
                  <select
                    value={newUserForm.id_rol}
                    onChange={e => setNewUserForm(p => ({ ...p, id_rol: Number(e.target.value) }))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 font-bold"
                  >
                    {roles.map(r => (
                      <option key={r.id_rol} value={r.id_rol}>
                        {r.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cargo Institucional</label>
                  <input
                    type="text"
                    placeholder="Ej. Docente Tiempo Completo"
                    value={newUserForm.cargo}
                    onChange={e => setNewUserForm(p => ({ ...p, cargo: e.target.value }))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Teléfono</label>
                  <input
                    type="text"
                    placeholder="Ej. 0991234567"
                    value={newUserForm.telefono}
                    onChange={e => setNewUserForm(p => ({ ...p, telefono: e.target.value }))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Vincular a Docente</label>
                  <select
                    value={newUserForm.id_docente}
                    onChange={e => setNewUserForm(p => ({ ...p, id_docente: e.target.value }))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">-- Sin vincular --</option>
                    {docentesList.map(d => (
                      <option key={d.id_docente} value={d.id_docente}>
                        {d.nombres} {d.apellidos}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewUserModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingUser}
                  className="px-5 py-2 bg-[#1f0533] hover:bg-[#350854] text-amber-300 font-black rounded-xl border border-amber-400/50 shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  {isSubmittingUser ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Guardar Usuario</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: CONFIRMAR ELIMINACIÓN DE USUARIO */}
      {/* ========================================================================= */}
      {userToDelete && (
        <div 
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs animate-in fade-in"
          onClick={() => setUserToDelete(null)}
        >
          <div 
            className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border-2 border-rose-500 overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-rose-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-300" />
                <h3 className="font-bold text-sm text-white">Confirmar Eliminación</h3>
              </div>
              <button onClick={() => setUserToDelete(null)} className="text-rose-200 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-3 text-xs text-slate-700">
              <p>
                ¿Está seguro de que desea eliminar permanentemente al usuario <strong>@{userToDelete.username}</strong> ({userToDelete.nombres} {userToDelete.apellidos})?
              </p>
              <div className="p-2.5 bg-rose-50 text-rose-800 rounded-xl border border-rose-200 text-[11px]">
                Esta acción eliminará sus roles y permisos asignados en el sistema.
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setUserToDelete(null)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleDeleteUser}
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Eliminar</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 7: DETALLE DE EVENTO DE AUDITORÍA */}
      {/* ========================================================================= */}
      {selectedAuditForDetail && (
        <div 
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs animate-in fade-in"
          onClick={() => setSelectedAuditForDetail(null)}
        >
          <div 
            className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border-2 border-[#e5a800] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-[#1f0533] text-white p-4 flex items-center justify-between border-b border-purple-900">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#e5a800] text-[#1f0533] flex items-center justify-center font-bold">
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Evento de Auditoría #{selectedAuditForDetail.id_auditoria}</h3>
                  <p className="text-[10px] text-amber-300">{selectedAuditForDetail.fecha}</p>
                </div>
              </div>
              <button onClick={() => setSelectedAuditForDetail(null)} className="text-purple-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs text-slate-700">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Usuario Ejecutor</div>
                  <div className="font-bold text-slate-900 text-sm">@{selectedAuditForDetail.usuario_nombre}</div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Módulo del Sistema</div>
                  <div className="font-bold text-purple-950 text-sm">{selectedAuditForDetail.modulo}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Tipo de Acción</div>
                  <div className="font-bold text-amber-900">{selectedAuditForDetail.accion}</div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Dirección IP</div>
                  <div className="font-mono text-slate-800">{selectedAuditForDetail.ip || '127.0.0.1 (Local)'}</div>
                </div>
              </div>

              <div className="p-3 bg-purple-50 rounded-xl border border-purple-200">
                <div className="text-[10px] text-purple-700 font-bold uppercase mb-1">Descripción del Registro:</div>
                <div className="font-medium text-slate-800 leading-relaxed">
                  {selectedAuditForDetail.descripcion}
                </div>
              </div>
            </div>

            <div className="bg-slate-100 p-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedAuditForDetail(null)}
                className="px-4 py-1.5 bg-[#1f0533] text-white rounded-xl text-xs font-bold transition hover:bg-[#350854]"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 8: FICHA DE DETALLE DE USUARIO */}
      {/* ========================================================================= */}
      {selectedUserForDetail && (
        <div 
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs animate-in fade-in"
          onClick={() => setSelectedUserForDetail(null)}
        >
          <div 
            className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border-2 border-[#e5a800] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-[#1f0533] text-white p-4 flex items-center justify-between border-b border-purple-900">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#e5a800] text-[#1f0533] flex items-center justify-center font-bold">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Ficha Técnica de Usuario</h3>
                  <p className="text-[10px] text-amber-300">Usuario #{selectedUserForDetail.id_usuario}</p>
                </div>
              </div>
              <button onClick={() => setSelectedUserForDetail(null)} className="text-purple-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs text-slate-700">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <div className="font-bold text-slate-900 text-sm">
                    {selectedUserForDetail.nombres} {selectedUserForDetail.apellidos}
                  </div>
                  <div className="font-mono text-purple-900 font-bold">
                    @{selectedUserForDetail.username}
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-md text-xs border ${getRoleBadge(selectedUserForDetail.rol_nombre)}`}>
                  {selectedUserForDetail.rol_nombre}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Correo Electrónico</div>
                  <div className="font-semibold text-slate-800">{selectedUserForDetail.email}</div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Teléfono</div>
                  <div className="font-semibold text-slate-800">{selectedUserForDetail.telefono || 'No registrado'}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Cargo</div>
                  <div className="font-semibold text-slate-800">{selectedUserForDetail.cargo || 'Funcionario'}</div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Estado</div>
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                    selectedUserForDetail.estado === 'ACTIVO' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {selectedUserForDetail.estado}
                  </span>
                </div>
              </div>

              {selectedUserForDetail.docente_nombre && (
                <div className="p-2.5 bg-indigo-50 rounded-xl border border-indigo-200">
                  <div className="text-[10px] text-indigo-700 font-bold uppercase">Docente Vinculado:</div>
                  <div className="font-bold text-indigo-950">{selectedUserForDetail.docente_nombre}</div>
                </div>
              )}
            </div>

            <div className="bg-slate-100 p-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedUserForDetail(null)}
                className="px-4 py-1.5 bg-[#1f0533] text-white rounded-xl text-xs font-bold transition hover:bg-[#350854]"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 9: CREAR NUEVO GRUPO O ROL INSTITUCIONAL */}
      {/* ========================================================================= */}
      {showNewGroupModal && (
        <div 
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs animate-in fade-in"
          onClick={() => setShowNewGroupModal(false)}
        >
          <div 
            className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border-2 border-[#e5a800] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-[#1f0533] text-white p-5 flex items-center justify-between border-b border-purple-900">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#e5a800] text-[#1f0533] flex items-center justify-center font-black text-lg shadow-sm">
                  {newGroupForm.emoji}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Crear Nuevo Grupo de Seguridad</h3>
                  <p className="text-[10px] text-amber-300">Defina el identificador, color distintivo y responsabilidades</p>
                </div>
              </div>
              <button 
                onClick={() => setShowNewGroupModal(false)} 
                className="text-purple-300 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nombre del Grupo / Rol <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: AUDITOR, OPERADOR, VICERRECTORADO..."
                  value={newGroupForm.nombre}
                  onChange={e => setNewGroupForm(prev => ({ ...prev, nombre: e.target.value.toUpperCase() }))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono uppercase text-xs focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                />
                <span className="text-[10px] text-slate-400">Se guardará en mayúsculas como identificador RBAC.</span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Emoji Representativo
                </label>
                <div className="flex flex-wrap gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200">
                  {['🔴', '🟠', '🟡', '🔵', '🟢', '🟣', '⚪', '🟤', '🎓', '📋', '🛡️', '⚙️', '🏛️', '📊', '💼'].map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setNewGroupForm(prev => ({ ...prev, emoji }))}
                      className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg transition cursor-pointer ${
                        newGroupForm.emoji === emoji 
                          ? 'bg-purple-100 border-2 border-purple-600 shadow-xs scale-105' 
                          : 'hover:bg-slate-200 border border-transparent'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Color Distintivo del Grupo
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'red', name: 'Rojo (🔴)', class: 'bg-rose-100 text-rose-800 border-rose-300' },
                    { id: 'orange', name: 'Naranja (🟠)', class: 'bg-orange-100 text-orange-800 border-orange-300' },
                    { id: 'amber', name: 'Amarillo (🟡)', class: 'bg-amber-100 text-amber-800 border-amber-300' },
                    { id: 'blue', name: 'Azul (🔵)', class: 'bg-blue-100 text-blue-800 border-blue-300' },
                    { id: 'green', name: 'Verde (🟢)', class: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
                    { id: 'purple', name: 'Morado (🟣)', class: 'bg-purple-100 text-purple-800 border-purple-300' },
                    { id: 'slate', name: 'Gris/Blanco (⚪)', class: 'bg-slate-100 text-slate-800 border-slate-300' },
                    { id: 'brown', name: 'Marrón (🟤)', class: 'bg-stone-100 text-stone-800 border-stone-300' },
                  ].map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setNewGroupForm(prev => ({ ...prev, color: c.id }))}
                      className={`p-2 rounded-lg text-[10px] font-bold border transition text-center cursor-pointer ${c.class} ${
                        newGroupForm.color === c.id ? 'ring-2 ring-purple-600 shadow-xs' : 'opacity-80 hover:opacity-100'
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Descripción y Ámbito de Responsabilidad
                </label>
                <textarea
                  rows={3}
                  placeholder="Describa el alcance de funciones asignadas a este grupo o rol..."
                  value={newGroupForm.descripcion}
                  onChange={e => setNewGroupForm(prev => ({ ...prev, descripcion: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewGroupModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingGroup}
                  className="px-5 py-2 bg-[#1f0533] hover:bg-[#350854] text-amber-300 font-black rounded-xl border border-amber-400/50 shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  {isSubmittingGroup ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Crear Grupo</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ASIGNACIÓN Y GESTIÓN DE USUARIOS DEL GRUPO / ROL */}
      {/* ========================================================================= */}
      {groupForUserAssignment && (
        <AssignUsersToGroupModal
          group={groupForUserAssignment}
          allUsers={usuarios}
          roles={roles}
          onClose={() => setGroupForUserAssignment(null)}
          onSaved={(msg) => handleDataChanged(msg)}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL: ASIGNACIÓN MASIVA DE ROL A USUARIOS SELECCIONADOS */}
      {/* ========================================================================= */}
      {showBatchAssignModal && (
        <BatchAssignRoleModal
          selectedUsers={usuarios.filter(u => selectedUserIds.includes(u.id_usuario))}
          roles={roles}
          onClose={() => setShowBatchAssignModal(false)}
          onSaved={(msg) => {
            setSelectedUserIds([]);
            handleDataChanged(msg);
          }}
        />
      )}
    </div>
  );
};
