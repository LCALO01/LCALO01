import React, { useState, useEffect } from 'react';
import { 
  FolderTree, 
  ChevronRight, 
  ChevronDown, 
  Folder, 
  FolderOpen, 
  Users, 
  User, 
  UserPlus, 
  UserMinus, 
  Plus, 
  Search, 
  RefreshCw, 
  Shield, 
  Lock, 
  HardDrive, 
  Cpu, 
  Share2, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  GripVertical, 
  ArrowRightLeft, 
  X, 
  Trash2,
  UserX,
  Filter,
  Check,
  Server,
  Layers,
  Sparkles
} from 'lucide-react';
import { GrupoSeguridad, RolItem } from '../../views/SeguridadView';
import { SeguridadUser } from '../../types';

interface AsignacionArbolViewProps {
  grupos: GrupoSeguridad[];
  roles: RolItem[];
  allUsers: SeguridadUser[];
  onRefresh: (msg?: string) => void;
}

type TreeNodeType = 
  | 'root'
  | 'herramientas'
  | 'usuarios_grupos_locales'
  | 'usuarios'
  | 'grupos'
  | 'grupo_item';

export const AsignacionArbolView: React.FC<AsignacionArbolViewProps> = ({
  grupos,
  roles,
  allUsers,
  onRefresh
}) => {
  // Tree expansion state (initially expand root, herramientas, usuarios_grupos_locales, grupos)
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    root: true,
    herramientas: true,
    usuarios_grupos_locales: true,
    grupos: true,
    almacenamiento: false,
    servicios: false
  });

  // Selected node in tree
  const [selectedNodeType, setSelectedNodeType] = useState<TreeNodeType>('grupos');
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);

  // Drag and Drop State
  const [draggingUser, setDraggingUser] = useState<{
    id_usuario: number;
    username: string;
    nombres: string;
    apellidos: string;
    fromGroupId?: number;
  } | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('TODOS');
  const [onlyWithoutGroup, setOnlyWithoutGroup] = useState(false);

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  // Modal: Crear Nuevo Grupo
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [newGroupCodigo, setNewGroupCodigo] = useState('');
  const [newGroupNombre, setNewGroupNombre] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupRol, setNewGroupRol] = useState<number | ''>('');
  const [creatingGroup, setCreatingGroup] = useState(false);

  // Modal: Confirmar Retirar Todos los Miembros
  const [confirmRemoveAllModal, setConfirmRemoveAllModal] = useState<{
    groupId: number;
    groupName: string;
    count: number;
  } | null>(null);
  const [isRemovingAll, setIsRemovingAll] = useState(false);

  // Group quick info
  const selectedGroup = grupos.find(g => g.id_grupo === selectedGroupId) || null;

  // Toggle tree node expansion
  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  // Toast timer
  useEffect(() => {
    if (toastMessage) {
      const t = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(t);
    }
  }, [toastMessage]);

  // Handle Drag Start
  const handleDragStart = (
    e: React.DragEvent,
    user: { id_usuario: number; username: string; nombres: string; apellidos: string },
    fromGroupId?: number
  ) => {
    const payload = {
      id_usuario: user.id_usuario,
      username: user.username,
      nombres: user.nombres,
      apellidos: user.apellidos,
      fromGroupId
    };
    setDraggingUser(payload);
    e.dataTransfer.setData('text/plain', JSON.stringify(payload));
    e.dataTransfer.effectAllowed = 'copyMove';
  };

  const handleDragEnd = () => {
    setDraggingUser(null);
    setDragOverTarget(null);
  };

  // Assign user to group via API
  const assignUserToGroup = async (userId: number, targetGroupId: number, targetGroupName: string) => {
    try {
      const res = await fetch(`/api/seguridad/grupos/${targetGroupId}/usuarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_usuarios: [userId] })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Error al asignar usuario al grupo');
      }

      setToastMessage({
        type: 'success',
        text: `Usuario asignado exitosamente al grupo "${targetGroupName}"`
      });
      onRefresh(`Usuario asignado al grupo "${targetGroupName}"`);
    } catch (err: any) {
      setToastMessage({
        type: 'error',
        text: err.message || 'Error al asignar usuario al grupo'
      });
    }
  };

  // Remove user from group via API
  const removeUserFromGroup = async (userId: number, groupId: number, groupName: string) => {
    try {
      const res = await fetch(`/api/seguridad/grupos/${groupId}/usuarios/${userId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Error al retirar usuario del grupo');
      }

      setToastMessage({
        type: 'info',
        text: `Usuario retirado del grupo "${groupName}"`
      });
      onRefresh(`Usuario retirado del grupo "${groupName}"`);
    } catch (err: any) {
      setToastMessage({
        type: 'error',
        text: err.message || 'Error al retirar usuario del grupo'
      });
    }
  };

  // Remove ALL users from a group
  const handleConfirmRemoveAll = async () => {
    if (!confirmRemoveAllModal) return;
    const { groupId, groupName, count } = confirmRemoveAllModal;
    setIsRemovingAll(true);
    try {
      const res = await fetch(`/api/seguridad/grupos/${groupId}/usuarios`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Error al retirar los miembros del grupo');
      }

      setToastMessage({
        type: 'info',
        text: `Se retiraron exitosamente todos los ${count} miembros del grupo "${groupName}"`
      });
      setConfirmRemoveAllModal(null);
      onRefresh(`Se retiraron todos los miembros del grupo "${groupName}"`);
    } catch (err: any) {
      setToastMessage({
        type: 'error',
        text: err.message || 'Error al retirar todos los miembros del grupo'
      });
    } finally {
      setIsRemovingAll(false);
    }
  };

  // Drag over target handler
  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    if (dragOverTarget !== targetId) {
      setDragOverTarget(targetId);
    }
  };

  const handleDragLeave = (_e: React.DragEvent, targetId: string) => {
    if (dragOverTarget === targetId) {
      setDragOverTarget(null);
    }
  };

  // Drop on a group (either in tree node or in members zone)
  const handleDropOnGroup = async (e: React.DragEvent, targetGroup: GrupoSeguridad) => {
    e.preventDefault();
    setDragOverTarget(null);

    let payload = draggingUser;
    if (!payload) {
      try {
        const raw = e.dataTransfer.getData('text/plain');
        if (raw) payload = JSON.parse(raw);
      } catch (err) {
        // ignore
      }
    }

    if (!payload || !payload.id_usuario) return;

    // Check if user is already in this group
    const alreadyMember = targetGroup.usuarios?.some(u => u.id_usuario === payload!.id_usuario);
    if (alreadyMember) {
      setToastMessage({
        type: 'info',
        text: `El usuario ya es miembro del grupo "${targetGroup.nombre}"`
      });
      return;
    }

    // If moved from another group, we can assign to the new one
    await assignUserToGroup(payload.id_usuario, targetGroup.id_grupo, targetGroup.nombre);
    
    // Automatically select the target group so user sees the change
    setSelectedGroupId(targetGroup.id_grupo);
    setSelectedNodeType('grupo_item');
  };

  // Drop on "Remove" zone or "Available Users" zone
  const handleDropToRemove = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverTarget(null);

    let payload = draggingUser;
    if (!payload) {
      try {
        const raw = e.dataTransfer.getData('text/plain');
        if (raw) payload = JSON.parse(raw);
      } catch (err) {
        // ignore
      }
    }

    if (!payload || !payload.id_usuario) return;

    // If dragged from a specific group, remove from that group
    const sourceGroupId = payload.fromGroupId || selectedGroupId;
    if (sourceGroupId) {
      const srcGroup = grupos.find(g => g.id_grupo === sourceGroupId);
      const grpName = srcGroup ? srcGroup.nombre : `Grupo #${sourceGroupId}`;
      await removeUserFromGroup(payload.id_usuario, sourceGroupId, grpName);
    }
  };

  // Handle Create New Group
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupCodigo.trim() || !newGroupNombre.trim()) {
      alert('Código y nombre son obligatorios');
      return;
    }

    setCreatingGroup(true);
    try {
      const res = await fetch('/api/seguridad/grupos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codigo: newGroupCodigo.trim().toUpperCase(),
          nombre: newGroupNombre.trim(),
          descripcion: newGroupDesc.trim(),
          emoji: '👥',
          color: 'blue',
          id_rol_defecto: newGroupRol ? Number(newGroupRol) : null
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Error al crear el grupo');
      }

      setShowCreateGroupModal(false);
      setNewGroupCodigo('');
      setNewGroupNombre('');
      setNewGroupDesc('');
      setNewGroupRol('');
      setToastMessage({
        type: 'success',
        text: `Grupo "${newGroupNombre.trim()}" creado exitosamente`
      });
      onRefresh(`Grupo "${newGroupNombre.trim()}" creado`);
    } catch (err: any) {
      alert(err.message || 'Error al crear el grupo');
    } finally {
      setCreatingGroup(false);
    }
  };

  // Filtered available users (for group assignment panel)
  const groupMemberIds = new Set(selectedGroup?.usuarios?.map(u => u.id_usuario) || []);
  const availableUsers = allUsers.filter(u => {
    // If a group is selected, exclude users that are already members
    if (selectedGroup && groupMemberIds.has(u.id_usuario)) {
      return false;
    }

    // Role filter
    if (userRoleFilter !== 'TODOS' && u.rol_nombre !== userRoleFilter) {
      return false;
    }

    // Only without group filter
    if (onlyWithoutGroup) {
      const hasAnyGroup = grupos.some(g => g.usuarios?.some(m => m.id_usuario === u.id_usuario));
      if (hasAnyGroup) return false;
    }

    // Text search
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchName = `${u.nombres} ${u.apellidos}`.toLowerCase().includes(q);
      const matchUser = u.username.toLowerCase().includes(q);
      const matchEmail = (u.email || '').toLowerCase().includes(q);
      const matchCargo = (u.cargo || '').toLowerCase().includes(q);
      return matchName || matchUser || matchEmail || matchCargo;
    }

    return true;
  });

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div 
          className={`p-3.5 rounded-xl text-xs font-bold flex items-center justify-between shadow-md border animate-in fade-in slide-in-from-top-2 ${
            toastMessage.type === 'success' 
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900' 
              : toastMessage.type === 'info'
              ? 'bg-blue-50 border-blue-300 text-blue-900'
              : 'bg-rose-50 border-rose-300 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {toastMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
            {toastMessage.type === 'info' && <ArrowRightLeft className="w-4 h-4 text-blue-600 shrink-0" />}
            {toastMessage.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
            <span>{toastMessage.text}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setToastMessage(null)} 
            className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Modern Windows Management Console Container */}
      <div className="bg-white rounded-2xl border border-slate-300 shadow-sm overflow-hidden">
        {/* MMC Title Bar */}
        <div className="bg-gradient-to-r from-slate-900 via-[#1f0533] to-slate-900 text-white px-4 py-2.5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-1 rounded-md bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <FolderTree className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-black tracking-wide uppercase text-amber-300">
                Administración de Equipos e Identidad
              </span>
              <span className="text-[11px] text-slate-300 ml-2 hidden sm:inline">
                Usuarios y Grupos Locales / RBAC Institucional
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowCreateGroupModal(true)}
              className="px-3 py-1 bg-[#e5a800] hover:bg-amber-400 text-[#1f0533] rounded-lg text-xs font-black transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Crear Grupo</span>
            </button>
            <button
              type="button"
              onClick={() => onRefresh('Estructura sincronizada')}
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
              title="Actualizar datos"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Action Toolbar / Breadcrumbs */}
        <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1 text-slate-600 font-medium truncate">
            <span className="text-slate-400 font-semibold">Ubicación:</span>
            <span className="text-slate-700 font-bold">Administración del equipo (local)</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-700">Herramientas del sistema</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-blue-700 font-bold">Usuarios y grupos locales</span>
            {selectedGroupId && selectedGroup && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold">
                  {selectedGroup.nombre}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
            <span className="font-semibold text-blue-700">💡 Instrucción:</span>
            <span>Arrastra usuarios sobre los grupos para agregarlos o arrástralos a "Retirar del grupo" para desasignarlos.</span>
          </div>
        </div>

        {/* Dynamic Drag Alert for Retiring */}
        {draggingUser && draggingUser.fromGroupId && (
          <div className="bg-rose-50 border-b border-rose-200 px-4 py-2 flex items-center justify-between text-xs text-rose-900 animate-in fade-in">
            <div className="flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>
                Arrastrando a <strong>{draggingUser.nombres} {draggingUser.apellidos}</strong>. Suéltalo sobre <strong>"Retirar del Grupo"</strong>, <strong>"Usuarios"</strong> o la columna de disponibles para desasignarlo.
              </span>
            </div>
            <span className="text-[10px] bg-rose-200 text-rose-900 font-mono font-bold px-2 py-0.5 rounded">
              Acción: Retirar
            </span>
          </div>
        )}

        {/* Split View: Tree (Left) and Content (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
          
          {/* ========================================================================= */}
          {/* PANEL IZQUIERDO: ÁRBOL DE CONSOLA (MMC STYLE) */}
          {/* ========================================================================= */}
          <div className="lg:col-span-4 border-r border-slate-200 bg-[#fbfcfd] p-3 space-y-1 select-none overflow-y-auto max-h-[750px]">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 flex items-center justify-between">
              <span>Árbol de Directorio</span>
              <span className="font-mono text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded">
                {grupos.length} grupos
              </span>
            </div>

            {/* Nodo Raíz: Administración del equipo (local) */}
            <div className="space-y-0.5 text-xs font-medium">
              <div 
                onClick={() => {
                  setSelectedNodeType('root');
                  setSelectedGroupId(null);
                }}
                className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer transition ${
                  selectedNodeType === 'root' 
                    ? 'bg-blue-100 text-blue-950 font-bold' 
                    : 'text-slate-800 hover:bg-slate-100'
                }`}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleNode('root');
                  }}
                  className="p-0.5 hover:bg-slate-200 rounded text-slate-500"
                >
                  {expandedNodes.root ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>
                <Server className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="truncate">Administración del equipo (local)</span>
              </div>

              {/* Hijos de Raíz */}
              {expandedNodes.root && (
                <div className="pl-4 space-y-0.5 border-l-2 border-slate-200 ml-2.5">
                  
                  {/* Rama: Herramientas del sistema */}
                  <div>
                    <div 
                      onClick={() => {
                        setSelectedNodeType('herramientas');
                        setSelectedGroupId(null);
                      }}
                      className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer transition ${
                        selectedNodeType === 'herramientas' 
                          ? 'bg-blue-100 text-blue-950 font-bold' 
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleNode('herramientas');
                        }}
                        className="p-0.5 hover:bg-slate-200 rounded text-slate-500"
                      >
                        {expandedNodes.herramientas ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      </button>
                      <Cpu className="w-4 h-4 text-amber-600 shrink-0" />
                      <span className="truncate">Herramientas del sistema</span>
                    </div>

                    {expandedNodes.herramientas && (
                      <div className="pl-4 space-y-0.5 border-l-2 border-slate-200 ml-2.5">
                        {/* Sub-nodo: Programador de tareas (decorativo como MMC) */}
                        <div className="flex items-center gap-2 px-2 py-1 text-slate-400 text-[11px]">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>Programador de tareas</span>
                        </div>
                        {/* Sub-nodo: Visor de eventos */}
                        <div className="flex items-center gap-2 px-2 py-1 text-slate-400 text-[11px]">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>Visor de eventos</span>
                        </div>
                        {/* Sub-nodo: Carpetas compartidas */}
                        <div className="flex items-center gap-2 px-2 py-1 text-slate-400 text-[11px]">
                          <Share2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>Carpetas compartidas</span>
                        </div>

                        {/* NODO 4: Usuarios y grupos locales (DESTACADO EN ROJO EN LA IMAGEN) */}
                        <div>
                          <div 
                            onClick={() => {
                              setSelectedNodeType('usuarios_grupos_locales');
                              setSelectedGroupId(null);
                            }}
                            className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer transition border ${
                              selectedNodeType === 'usuarios_grupos_locales' 
                                ? 'bg-blue-50 border-blue-300 text-blue-900 font-bold' 
                                : 'border-transparent text-slate-800 hover:bg-slate-100'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleNode('usuarios_grupos_locales');
                              }}
                              className="p-0.5 hover:bg-slate-200 rounded text-slate-500"
                            >
                              {expandedNodes.usuarios_grupos_locales ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                            </button>
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4 text-blue-600 shrink-0" />
                              <span className="font-bold text-xs truncate text-slate-900">
                                Usuarios y grupos locales
                              </span>
                            </div>
                          </div>

                          {expandedNodes.usuarios_grupos_locales && (
                            <div className="pl-4 space-y-0.5 border-l-2 border-blue-200 ml-2.5 mt-0.5">
                              
                              {/* Sub-nodo: Usuarios (Drop Target para retirar usuarios de un grupo) */}
                              <div
                                onClick={() => {
                                  setSelectedNodeType('usuarios');
                                  setSelectedGroupId(null);
                                }}
                                onDragOver={(e) => {
                                  if (draggingUser?.fromGroupId) {
                                    handleDragOver(e, 'tree-node-usuarios');
                                  }
                                }}
                                onDragLeave={(e) => handleDragLeave(e, 'tree-node-usuarios')}
                                onDrop={(e) => {
                                  if (draggingUser?.fromGroupId) {
                                    handleDropToRemove(e);
                                  }
                                }}
                                className={`flex items-center justify-between px-2 py-1.5 rounded-lg cursor-pointer transition text-xs ${
                                  dragOverTarget === 'tree-node-usuarios'
                                    ? 'bg-rose-100 ring-2 ring-rose-500 text-rose-950 font-bold scale-[1.02]'
                                    : selectedNodeType === 'usuarios'
                                    ? 'bg-blue-600 text-white font-bold'
                                    : 'text-slate-700 hover:bg-slate-100'
                                }`}
                                title="Ver todos los usuarios o arrastra un miembro aquí para retirarlo de su grupo"
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <User className={`w-3.5 h-3.5 ${
                                    dragOverTarget === 'tree-node-usuarios'
                                      ? 'text-rose-600'
                                      : selectedNodeType === 'usuarios'
                                      ? 'text-white'
                                      : 'text-slate-500'
                                  }`} />
                                  <span className="truncate">
                                    {dragOverTarget === 'tree-node-usuarios' ? 'Soltar para retirar del grupo' : 'Usuarios'}
                                  </span>
                                </div>
                                <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                                  selectedNodeType === 'usuarios' ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-600'
                                }`}>
                                  {allUsers.length}
                                </span>
                              </div>

                              {/* Zona explícita de Retirar del Grupo en el Árbol */}
                              <div
                                onDragOver={(e) => handleDragOver(e, 'tree-drop-remove')}
                                onDragLeave={(e) => handleDragLeave(e, 'tree-drop-remove')}
                                onDrop={handleDropToRemove}
                                className={`flex items-center justify-between px-2 py-1.5 rounded-lg transition text-xs border border-dashed cursor-pointer ${
                                  dragOverTarget === 'tree-drop-remove'
                                    ? 'border-rose-500 bg-rose-100 text-rose-950 ring-2 ring-rose-400 font-bold scale-[1.02] shadow-sm'
                                    : draggingUser?.fromGroupId
                                    ? 'border-rose-400 bg-rose-50 text-rose-800 animate-pulse font-bold'
                                    : 'border-slate-200 bg-slate-50/70 text-slate-500 hover:border-rose-300 hover:text-rose-700 hover:bg-rose-50/50'
                                }`}
                                title="Arrastra cualquier usuario aquí para retirarlo de su grupo actual"
                              >
                                <div className="flex items-center gap-1.5 truncate">
                                  <UserMinus className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                  <span className="truncate font-semibold">Retirar del Grupo</span>
                                </div>
                                <span className="text-[9px] px-1.5 py-0.2 rounded font-mono bg-rose-100 text-rose-700 font-bold shrink-0">
                                  Soltar aquí
                                </span>
                              </div>

                              {/* NODO 5: Grupos (DESTACADO EN ROJO EN LA IMAGEN) */}
                              <div>
                                <div
                                  onClick={() => {
                                    setSelectedNodeType('grupos');
                                    setSelectedGroupId(null);
                                  }}
                                  className={`flex items-center justify-between px-2 py-1.5 rounded-lg cursor-pointer transition text-xs ${
                                    selectedNodeType === 'grupos'
                                      ? 'bg-blue-600 text-white font-bold shadow-xs'
                                      : 'text-slate-900 hover:bg-slate-100 font-semibold'
                                  }`}
                                >
                                  <div className="flex items-center gap-1.5 truncate">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleNode('grupos');
                                      }}
                                      className="p-0.5 hover:bg-black/10 rounded text-inherit cursor-pointer"
                                    >
                                      {expandedNodes.grupos ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                                    </button>
                                    <Folder className={`w-3.5 h-3.5 ${selectedNodeType === 'grupos' ? 'text-amber-300' : 'text-amber-500'}`} />
                                    <span className="truncate">Grupos</span>
                                  </div>
                                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                                    selectedNodeType === 'grupos' ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'
                                  }`}>
                                    {grupos.length}
                                  </span>
                                </div>

                                {/* LISTA DE GRUPOS COMO SUB-NODOS (SOLO NOMBRES DE GRUPO) */}
                                {expandedNodes.grupos && (
                                  <div className="pl-3 space-y-0.5 border-l-2 border-amber-300 ml-2.5 mt-0.5">
                                    {grupos.map(g => {
                                      const isSelected = selectedNodeType === 'grupo_item' && selectedGroupId === g.id_grupo;
                                      const isDropTarget = dragOverTarget === `tree-group-${g.id_grupo}`;
                                      const memberCount = g.usuarios?.length || 0;

                                      return (
                                        <div
                                          key={`tree-node-group-${g.id_grupo}`}
                                          onClick={() => {
                                            setSelectedGroupId(g.id_grupo);
                                            setSelectedNodeType('grupo_item');
                                          }}
                                          onDragOver={(e) => handleDragOver(e, `tree-group-${g.id_grupo}`)}
                                          onDragLeave={(e) => handleDragLeave(e, `tree-group-${g.id_grupo}`)}
                                          onDrop={(e) => handleDropOnGroup(e, g)}
                                          className={`flex items-center justify-between px-2 py-1.5 rounded-lg cursor-pointer transition text-xs relative ${
                                            isDropTarget
                                              ? 'bg-blue-100 ring-2 ring-blue-500 text-blue-950 font-bold scale-[1.02] shadow-sm'
                                              : isSelected
                                              ? 'bg-blue-50 text-blue-900 font-bold border border-blue-200'
                                              : 'text-slate-700 hover:bg-slate-100'
                                          }`}
                                          title={`Clic para administrar o arrastra usuarios aquí`}
                                        >
                                          <div className="flex items-center gap-1.5 truncate">
                                            <Users className="w-3.5 h-3.5 shrink-0 text-blue-500" />
                                            <span className="truncate">
                                              {g.nombre}
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-1 shrink-0">
                                            {isDropTarget && (
                                              <span className="animate-pulse text-[10px] text-blue-700 font-bold">
                                                Soltar
                                              </span>
                                            )}
                                            <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-slate-100 text-slate-600">
                                              {memberCount}
                                            </span>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Sub-nodo: Rendimiento */}
                        <div className="flex items-center gap-2 px-2 py-1 text-slate-400 text-[11px]">
                          <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>Rendimiento</span>
                        </div>
                        {/* Sub-nodo: Administrador de dispositivos */}
                        <div className="flex items-center gap-2 px-2 py-1 text-slate-400 text-[11px]">
                          <HardDrive className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>Administrador de dispositivos</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Rama: Almacenamiento (decorativo) */}
                  <div className="flex items-center gap-2 px-2 py-1.5 text-slate-400 text-xs">
                    <HardDrive className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Almacenamiento</span>
                  </div>

                  {/* Rama: Servicios y Aplicaciones (decorativo) */}
                  <div className="flex items-center gap-2 px-2 py-1.5 text-slate-400 text-xs">
                    <Server className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Servicios y Aplicaciones</span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick helper box at bottom of tree */}
            <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px] space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-amber-800">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Asignación Inteligente:</span>
              </div>
              <p className="leading-relaxed text-amber-800">
                Arrastra cualquier usuario de la derecha y suéltalo sobre cualquier grupo del árbol para transferirlo de inmediato.
              </p>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* PANEL DERECHO: CONTENIDO Y GESTIÓN DE ARRASTRE (DRAG & DROP) */}
          {/* ========================================================================= */}
          <div className="lg:col-span-8 p-4 sm:p-5 flex flex-col space-y-4 bg-white overflow-x-hidden">
            
            {/* VISTA 1: CUANDO SE SELECCIONA UN GRUPO ESPECÍFICO -> TABLERO DE ARRASTRE */}
            {selectedGroupId && selectedGroup ? (
              <div className="space-y-4 animate-in fade-in duration-150">
                {/* Header del Grupo Seleccionado */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{selectedGroup.emoji || '👥'}</span>
                      <h2 className="text-base font-black text-slate-900">
                        {selectedGroup.nombre}
                      </h2>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-bold">
                        {selectedGroup.codigo}
                      </span>
                      {selectedGroup.rol_defecto_nombre && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold border border-purple-200">
                          Rol: {selectedGroup.rol_defecto_nombre}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {selectedGroup.descripcion || 'Sin descripción'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedNodeType('grupos');
                        setSelectedGroupId(null);
                      }}
                      className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold border border-slate-300 transition cursor-pointer"
                    >
                      Ver todos los grupos
                    </button>
                  </div>
                </div>

                {/* Tablero Dual de Arrastre: Miembros del Grupo vs Usuarios Disponibles */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* COLUMNA IZQUIERDA: MIEMBROS EN EL GRUPO (DROP TARGET PARA AGREGAR) */}
                  <div 
                    onDragOver={(e) => handleDragOver(e, 'zone-members')}
                    onDragLeave={(e) => handleDragLeave(e, 'zone-members')}
                    onDrop={(e) => handleDropOnGroup(e, selectedGroup)}
                    className={`rounded-2xl border-2 transition-all p-4 flex flex-col min-h-[420px] ${
                      dragOverTarget === 'zone-members'
                        ? 'border-blue-500 bg-blue-50/60 ring-2 ring-blue-300 shadow-md'
                        : 'border-slate-200 bg-white shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 gap-2">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-600" />
                        <h3 className="text-xs font-bold text-slate-900">
                          Miembros Asignados
                        </h3>
                      </div>

                      <div className="flex items-center gap-2">
                        {selectedGroup.usuarios && selectedGroup.usuarios.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setConfirmRemoveAllModal({
                              groupId: selectedGroup.id_grupo,
                              groupName: selectedGroup.nombre,
                              count: selectedGroup.usuarios.length
                            })}
                            disabled={isRemovingAll}
                            className="px-2.5 py-1 text-xs font-bold bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white rounded-lg border border-rose-200 shadow-2xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                            title={`Retirar todos los ${selectedGroup.usuarios.length} miembros del grupo "${selectedGroup.nombre}"`}
                          >
                            <UserX className="w-3.5 h-3.5" />
                            <span>Retirar todos los miembros</span>
                          </button>
                        )}
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 font-mono">
                          {selectedGroup.usuarios?.length || 0}
                        </span>
                      </div>
                    </div>

                    <div className="mt-2 text-[11px] text-slate-600 bg-amber-50/80 p-2.5 rounded-xl border border-amber-200 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <ArrowRightLeft className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                        <span>Para retirar: arrastra hacia la derecha o presiona el botón <strong>"Retirar"</strong>.</span>
                      </div>
                    </div>

                    {/* Lista de Miembros */}
                    <div className="flex-1 mt-3 space-y-2 overflow-y-auto max-h-[380px] pr-1">
                      {(!selectedGroup.usuarios || selectedGroup.usuarios.length === 0) ? (
                        <div className="h-48 flex flex-col items-center justify-center text-center p-4 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                          <Users className="w-8 h-8 text-slate-300 mb-2" />
                          <p className="text-xs font-semibold text-slate-600">
                            No hay miembros asignados
                          </p>
                          <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
                            Arrastra usuarios desde la columna derecha o suéltalos aquí para incorporarlos a este grupo.
                          </p>
                        </div>
                      ) : (
                        selectedGroup.usuarios.map(member => (
                          <div
                            key={`member-${member.id_usuario}`}
                            draggable
                            onDragStart={(e) => handleDragStart(e, member, selectedGroup.id_grupo)}
                            onDragEnd={handleDragEnd}
                            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:border-rose-400 hover:shadow-xs transition group flex items-center justify-between gap-2 cursor-grab active:cursor-grabbing"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="text-slate-400 group-hover:text-slate-600">
                                <GripVertical className="w-3.5 h-3.5" />
                              </div>
                              <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-xs font-black shrink-0">
                                {member.nombres.charAt(0)}{member.apellidos.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-slate-900 truncate">
                                  {member.nombres} {member.apellidos}
                                </div>
                                <div className="text-[10px] text-slate-500 truncate flex items-center gap-1.5">
                                  <span className="font-mono text-purple-700">@{member.username}</span>
                                  {member.rol_nombre && (
                                    <span className="text-slate-400">· {member.rol_nombre}</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Botón explícito para Retirar del Grupo */}
                            <button
                              type="button"
                              onClick={() => removeUserFromGroup(member.id_usuario, selectedGroup.id_grupo, selectedGroup.nombre)}
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white rounded-lg text-xs font-bold transition flex items-center gap-1 border border-rose-200 shrink-0 cursor-pointer shadow-2xs"
                              title={`Retirar a ${member.nombres} ${member.apellidos} del grupo "${selectedGroup.nombre}"`}
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Retirar</span>
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* COLUMNA DERECHA: USUARIOS DISPONIBLES (DRAGGABLE PARA AGREGAR, DROP TARGET PARA RETIRAR) */}
                  <div 
                    onDragOver={(e) => handleDragOver(e, 'zone-available')}
                    onDragLeave={(e) => handleDragLeave(e, 'zone-available')}
                    onDrop={handleDropToRemove}
                    className={`rounded-2xl border-2 transition-all p-4 flex flex-col min-h-[420px] ${
                      dragOverTarget === 'zone-available'
                        ? 'border-rose-400 bg-rose-50/50 ring-2 ring-rose-200 shadow-md'
                        : 'border-slate-200 bg-white shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <UserPlus className="w-4 h-4 text-emerald-600" />
                        <h3 className="text-xs font-bold text-slate-900">
                          Usuarios Disponibles para Asignar
                        </h3>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 font-mono">
                        {availableUsers.length}
                      </span>
                    </div>

                    {/* Banner explícito de Zona de Retiro */}
                    <div 
                      onDragOver={(e) => handleDragOver(e, 'zone-available')}
                      onDragLeave={(e) => handleDragLeave(e, 'zone-available')}
                      onDrop={handleDropToRemove}
                      className={`mt-2 p-2.5 rounded-xl border-2 border-dashed transition-all flex items-center justify-center gap-2 text-xs font-bold cursor-pointer ${
                        dragOverTarget === 'zone-available'
                          ? 'border-rose-500 bg-rose-100 text-rose-900 ring-2 ring-rose-300 scale-[1.01] shadow-sm'
                          : draggingUser?.fromGroupId
                          ? 'border-rose-400 bg-rose-50 text-rose-700 animate-pulse'
                          : 'border-slate-200 bg-slate-50/70 text-slate-500 hover:border-rose-300 hover:text-rose-700'
                      }`}
                      title={`Arrastra y suelta aquí cualquier miembro para retirarlo de "${selectedGroup.nombre}"`}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      <span>Soltar aquí para retirar de "{selectedGroup.nombre}"</span>
                    </div>

                    {/* Filtros y Búsqueda */}
                    <div className="mt-2 space-y-2">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                        <input
                          type="text"
                          placeholder="Buscar por nombre, usuario o cargo..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div className="flex items-center justify-between gap-2 text-[11px]">
                        <select
                          value={userRoleFilter}
                          onChange={(e) => setUserRoleFilter(e.target.value)}
                          className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-[11px] focus:outline-none"
                        >
                          <option value="TODOS">Todos los roles</option>
                          {roles.map(r => (
                            <option key={r.id_rol} value={r.nombre}>{r.nombre}</option>
                          ))}
                        </select>

                        <label className="flex items-center gap-1.5 cursor-pointer text-slate-600">
                          <input
                            type="checkbox"
                            checked={onlyWithoutGroup}
                            onChange={(e) => setOnlyWithoutGroup(e.target.checked)}
                            className="rounded text-blue-600 focus:ring-0 w-3.5 h-3.5"
                          />
                          <span>Sin grupo</span>
                        </label>
                      </div>

                      {dragOverTarget === 'zone-available' && (
                        <div className="p-2 rounded-lg bg-rose-100 border border-rose-300 text-rose-900 text-xs font-bold flex items-center justify-center gap-2 animate-pulse">
                          <UserMinus className="w-4 h-4 text-rose-600" />
                          <span>Soltar aquí para retirar al usuario del grupo</span>
                        </div>
                      )}
                    </div>

                    {/* Lista de Usuarios Disponibles */}
                    <div className="flex-1 mt-2 space-y-2 overflow-y-auto max-h-[340px] pr-1">
                      {availableUsers.length === 0 ? (
                        <div className="h-40 flex flex-col items-center justify-center text-center p-4 text-slate-400 text-xs">
                          <p>No se encontraron usuarios con ese filtro.</p>
                        </div>
                      ) : (
                        availableUsers.map(user => (
                          <div
                            key={`avail-${user.id_usuario}`}
                            draggable
                            onDragStart={(e) => handleDragStart(e, user)}
                            onDragEnd={handleDragEnd}
                            className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-blue-50/60 hover:border-blue-400 hover:shadow-xs transition group flex items-center justify-between gap-2 cursor-grab active:cursor-grabbing"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="text-slate-400 group-hover:text-blue-600">
                                <GripVertical className="w-3.5 h-3.5" />
                              </div>
                              <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold shrink-0">
                                {user.nombres.charAt(0)}{user.apellidos.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-slate-900 truncate">
                                  {user.nombres} {user.apellidos}
                                </div>
                                <div className="text-[10px] text-slate-500 truncate flex items-center gap-1.5">
                                  <span className="font-mono text-purple-700">@{user.username}</span>
                                  {user.rol_nombre && (
                                    <span className="text-slate-500 font-semibold">· {user.rol_nombre}</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => assignUserToGroup(user.id_usuario, selectedGroup.id_grupo, selectedGroup.nombre)}
                              className="px-2 py-1 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 rounded-lg text-[11px] font-bold transition flex items-center gap-1 shrink-0 cursor-pointer shadow-2xs"
                              title="Asignar a este grupo"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Asignar</span>
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : selectedNodeType === 'usuarios' ? (
              /* VISTA 2: CUANDO SE SELECCIONA EL NODO "USUARIOS" EN EL ÁRBOL */
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div>
                    <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-600" />
                      <span>Directorio General de Usuarios</span>
                    </h2>
                    <p className="text-xs text-slate-500">
                      Arrastra cualquier usuario sobre los grupos en el árbol de la izquierda para vincularlo.
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">
                    {allUsers.length} usuarios totales
                  </span>
                </div>

                {/* Grid de Usuarios Arrastrables */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[580px] overflow-y-auto pr-1">
                  {allUsers.map(user => {
                    // Find which groups this user belongs to
                    const userGroups = grupos.filter(g => g.usuarios?.some(m => m.id_usuario === user.id_usuario));

                    return (
                      <div
                        key={`user-card-tree-${user.id_usuario}`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, user)}
                        onDragEnd={handleDragEnd}
                        className="p-3 bg-white rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-xs transition group cursor-grab active:cursor-grabbing flex flex-col justify-between space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="text-slate-400 group-hover:text-blue-600">
                              <GripVertical className="w-4 h-4" />
                            </div>
                            <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-xs font-black">
                              {user.nombres.charAt(0)}{user.apellidos.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-xs text-slate-900 block truncate">
                                {user.nombres} {user.apellidos}
                              </span>
                              <span className="font-mono text-[11px] text-purple-700 font-bold block truncate">
                                @{user.username}
                              </span>
                            </div>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-slate-100 text-slate-600">
                            {user.rol_nombre || 'INVITADO'}
                          </span>
                        </div>

                        {/* Chips de Grupos del Usuario */}
                        <div className="pt-2 border-t border-slate-100">
                          <span className="text-[10px] font-bold text-slate-500 block mb-1">
                            Grupos asignados:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {userGroups.length === 0 ? (
                              <span className="text-[10px] text-slate-400 italic">Sin grupos asignados</span>
                            ) : (
                              userGroups.map(ug => (
                                <span
                                  key={ug.id_grupo}
                                  className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200"
                                >
                                  <span>{ug.nombre}</span>
                                  <button
                                    type="button"
                                    onClick={() => removeUserFromGroup(user.id_usuario, ug.id_grupo, ug.nombre)}
                                    className="text-slate-400 hover:text-rose-600 ml-0.5 cursor-pointer"
                                    title="Remover de este grupo"
                                  >
                                    ×
                                  </button>
                                </span>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* VISTA 3: CUANDO SE SELECCIONA EL NODO "GRUPOS" (ESTILO IDÉNTICO A LA IMAGEN 1 DE REFERENCIA) */
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                  <div>
                    <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
                      <Folder className="w-4 h-4 text-amber-500" />
                      <span>Catálogo de Grupos Locales e Institucionales</span>
                    </h2>
                    <p className="text-xs text-slate-500">
                      Visualización idéntica a la administración de equipos. Haz clic en un grupo para gestionar sus miembros o arrastra usuarios directamente sobre las filas.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowCreateGroupModal(true)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Nuevo Grupo</span>
                    </button>
                  </div>
                </div>

                {/* Tabla de Grupos estilo Consola Windows (Image 1) */}
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                        <th className="py-2.5 px-3 font-semibold w-1/3">Nombre</th>
                        <th className="py-2.5 px-3 font-semibold">Descripción</th>
                        <th className="py-2.5 px-3 font-semibold text-center w-24">Miembros</th>
                        <th className="py-2.5 px-3 font-semibold text-center w-32">Rol por Defecto</th>
                        <th className="py-2.5 px-3 font-semibold text-right w-24">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {grupos.map(g => {
                        const isDropTarget = dragOverTarget === `table-row-${g.id_grupo}`;

                        return (
                          <tr
                            key={`table-group-${g.id_grupo}`}
                            onClick={() => {
                              setSelectedGroupId(g.id_grupo);
                              setSelectedNodeType('grupo_item');
                            }}
                            onDragOver={(e) => handleDragOver(e, `table-row-${g.id_grupo}`)}
                            onDragLeave={(e) => handleDragLeave(e, `table-row-${g.id_grupo}`)}
                            onDrop={(e) => handleDropOnGroup(e, g)}
                            className={`cursor-pointer transition group ${
                              isDropTarget
                                ? 'bg-blue-100 ring-2 ring-blue-500 font-bold'
                                : 'hover:bg-slate-50'
                            }`}
                          >
                            {/* Nombre del Grupo */}
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 shrink-0 text-slate-600" />
                                <span className="text-slate-900 font-semibold">
                                  {g.nombre}
                                </span>
                              </div>
                            </td>

                            {/* Descripción */}
                            <td className="py-3 px-3 text-slate-600">
                              <span className="line-clamp-1">{g.descripcion}</span>
                            </td>

                            {/* Miembros */}
                            <td className="py-3 px-3 text-center">
                              <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">
                                {g.usuarios?.length || 0}
                              </span>
                            </td>

                            {/* Rol por defecto */}
                            <td className="py-3 px-3 text-center">
                              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-50 text-purple-800 border border-purple-200">
                                {g.rol_defecto_nombre || 'PERSONALIZADO'}
                              </span>
                            </td>

                            {/* Acciones */}
                            <td className="py-3 px-3 text-right">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedGroupId(g.id_grupo);
                                  setSelectedNodeType('grupo_item');
                                }}
                                className="px-2.5 py-1 bg-white hover:bg-blue-50 text-blue-600 border border-blue-200 rounded-lg text-[11px] font-bold transition shadow-2xs"
                              >
                                Administrar
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal: Crear Grupo (Objetivo imagen 2) */}
      {showCreateGroupModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold">Crear Nuevo Grupo de Seguridad</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateGroupModal(false)}
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Código de Grupo (ej. permitidos-CONTABILIDAD) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. permitidos-COMPRAS o DOCENTES_HORAS"
                  value={newGroupCodigo}
                  onChange={(e) => setNewGroupCodigo(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nombre descriptivo del Grupo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. Personal de Compras o Gestores de Aula"
                  value={newGroupNombre}
                  onChange={(e) => setNewGroupNombre(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Descripción
                </label>
                <textarea
                  rows={2}
                  placeholder="Finalidad del grupo, restricciones o carpetas asociadas..."
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Rol Asociado por Defecto
                </label>
                <select
                  value={newGroupRol}
                  onChange={(e) => setNewGroupRol(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value="">Sin rol específico (mantener roles individuales)</option>
                  {roles.map(r => (
                    <option key={r.id_rol} value={r.id_rol}>{r.nombre} ({r.descripcion})</option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateGroupModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creatingGroup}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{creatingGroup ? 'Creando...' : 'Crear Grupo'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmación de Retirar Todos los Miembros */}
      {confirmRemoveAllModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-rose-50 px-5 py-4 border-b border-rose-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                  <UserX className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Retirar todos los miembros
                  </h3>
                  <p className="text-xs text-rose-800">
                    Grupo: {confirmRemoveAllModal.groupName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !isRemovingAll && setConfirmRemoveAllModal(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <p className="text-xs text-slate-600 leading-relaxed">
                ¿Estás seguro de que deseas retirar a <strong>todos los {confirmRemoveAllModal.count} miembros</strong> del grupo <strong>"{confirmRemoveAllModal.groupName}"</strong>?
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Los usuarios desvinculados ya no pertenecerán a este grupo ni tendrán sus accesos específicos.
                </span>
              </div>
            </div>

            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={isRemovingAll}
                onClick={() => setConfirmRemoveAllModal(null)}
                className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isRemovingAll}
                onClick={handleConfirmRemoveAll}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {isRemovingAll ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Retirando miembros...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Sí, retirar todos</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
