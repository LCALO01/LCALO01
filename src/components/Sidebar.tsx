import React, { useState, useEffect } from 'react';
import { useAuth } from '../controllers/authContext.tsx';
import { 
  Home, 
  Building2, 
  Layers,
  ChevronRight,
  ChevronDown,
  X,
  Calendar,
  CalendarDays,
  FileSpreadsheet,
  AlertCircle,
  ShieldCheck,
  GraduationCap,
  BookOpen,
  Clock,
  Users,
  Key,
  School,
  Sparkles,
  GitBranch,
  Network,
  FolderKanban,
  LayoutDashboard,
  FolderTree,
  ArrowLeftRight,
  DoorOpen,
  UserCheck,
  Pin
} from 'lucide-react';

export type MainSectionType = 
  | 'dashboard' 
  | 'seguridad' 
  | 'academico' 
  | 'planificacion' 
  | 'horario' 
  | 'asignacion_aulas' 
  | 'reportes'
  // Compatibility aliases
  | 'inicio' 
  | 'catalogos' 
  | 'gestion_aulas';

interface SidebarProps {
  currentTab: MainSectionType;
  onSelectTab: (tab: MainSectionType, subTab?: string, estadoFiltro?: string) => void;
  activeSubTab?: string;
  activeSemaforoFilter?: string;
  isOpen: boolean;
  onCloseMobile?: () => void;
  onOpenStructureModal?: () => void;
  isFixed?: boolean;
  onToggleFixed?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  activeSubTab,
  activeSemaforoFilter,
  isOpen,
  onCloseMobile,
  onOpenStructureModal,
  isFixed = true,
  onToggleFixed
}) => {
  const { user, canAccess, isOwnOnly } = useAuth();
  
  // Section expand states
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    seguridad: false,
    academico: false,
    planificacion: false,
    horario: false,
    asignacion_aulas: true,
  });

  const getRoleBadgeStyle = (rol: string) => {
    switch (rol) {
      case 'SUPERADMIN':
        return 'bg-amber-950 text-amber-300 border-amber-500/60 font-black';
      case 'ADMINISTRADOR':
        return 'bg-purple-900/90 text-amber-300 border-amber-400/40';
      case 'COORDINADOR':
        return 'bg-blue-900/90 text-blue-200 border-blue-400/40';
      case 'DOCENTE':
        return 'bg-indigo-900/90 text-indigo-200 border-indigo-400/40';
      case 'ESTUDIANTE':
        return 'bg-teal-900/90 text-teal-200 border-teal-400/40';
      case 'USUARIO_CONSULTA':
        return 'bg-slate-800 text-slate-200 border-slate-500/40';
      case 'SECRETARIA':
        return 'bg-emerald-900/90 text-emerald-200 border-emerald-400/40';
      case 'OPERADOR':
        return 'bg-amber-900/90 text-amber-200 border-amber-400/40';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-600';
    }
  };

  // Keep the active section open automatically
  useEffect(() => {
    const activeKey = 
      currentTab === 'inicio' ? 'dashboard' :
      currentTab === 'catalogos' ? 'academico' :
      currentTab === 'gestion_aulas' ? 'asignacion_aulas' : currentTab;

    if (activeKey && activeKey !== 'dashboard' && activeKey !== 'reportes') {
      setOpenSections(prev => ({ ...prev, [activeKey]: true }));
    }
  }, [currentTab]);

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleSectionHeaderClick = (section: MainSectionType, defaultSubTab?: string) => {
    if (isSectionActive(section)) {
      // Si ya está activo, alternar apertura del acordeón sin perder la pestaña interna
      toggleSection(section);
      return;
    }
    // Si navega a otra sección principal, abrirla automáticamente
    setOpenSections(prev => ({ ...prev, [section]: true }));
    onSelectTab(section, defaultSubTab);
  };

  const handleChevronClick = (e: React.MouseEvent, section: string) => {
    e.stopPropagation();
    toggleSection(section);
  };

  const handleMobileClose = () => {
    // Si el menú está congelado / fixed (isFixed === true), NO se cierra al interactuar con opciones
    if (isFixed) {
      return;
    }
    if (onCloseMobile && typeof window !== 'undefined' && window.innerWidth < 768) {
      onCloseMobile();
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'AD';
    return name.slice(0, 2).toUpperCase();
  };

  // Check active module
  const isSectionActive = (section: string) => {
    if (section === 'dashboard') return currentTab === 'dashboard' || currentTab === 'inicio';
    if (section === 'academico') return currentTab === 'academico' || currentTab === 'catalogos';
    if (section === 'asignacion_aulas') return currentTab === 'asignacion_aulas' || currentTab === 'gestion_aulas';
    return currentTab === section;
  };

  return (
    <>
      {/* Mobile backdrop - solo visible si el menú no está congelado/fixed */}
      {isOpen && !isFixed && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-xs transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar container - Congelado / Fixed */}
      <aside 
        id="sidebar-menu-principal"
        className={`fixed md:relative top-14 md:top-0 left-0 bottom-0 md:bottom-auto h-[calc(100vh-3.5rem)] md:h-full z-40 md:z-20 bg-[#1f0533] text-white flex flex-col border-r border-[#3a0a5e] transition-all duration-200 ease-in-out shrink-0 select-none shadow-2xl md:shadow-none min-w-0 ${
          isOpen 
            ? 'translate-x-0 w-64 sm:w-72 min-w-[16rem] sm:min-w-[18rem] max-w-[85vw]' 
            : '-translate-x-full md:translate-x-0 md:w-0 md:min-w-0 md:border-none md:p-0 overflow-hidden pointer-events-none'
        }`}
      >
        {/* User Card at the top of Sidebar */}
        <div className="p-3 sm:p-4 border-b border-[#3a0a5e] bg-[#180329]/90 flex items-center justify-between shrink-0 gap-2">
          <div className="flex items-center gap-3 overflow-hidden min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#e5a800] flex items-center justify-center font-bold text-[#1f0533] text-xs sm:text-sm shadow-sm shrink-0 border border-amber-300">
              {getInitials(user.nombre_usuario)}
            </div>
            <div className="overflow-hidden min-w-0">
              <div className="font-bold text-white text-xs sm:text-sm leading-tight truncate">
                {user.nombre_usuario}
              </div>
              <div className="text-[10px] sm:text-[11px] font-bold text-amber-300 tracking-wider uppercase mt-0.5 truncate">
                {user.rol}
              </div>
            </div>
          </div>

          {/* Controls: Pin / Freeze & Close */}
          <div className="flex items-center gap-1 shrink-0">
            {onToggleFixed && (
              <button
                onClick={onToggleFixed}
                type="button"
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
                  isFixed 
                    ? 'bg-amber-400/20 text-amber-300 border border-amber-400/50 hover:bg-amber-400/30' 
                    : 'text-purple-300 hover:text-white hover:bg-purple-900/60'
                }`}
                title={isFixed ? "Menú Congelado / Fixed (Click para descongelar)" : "Congelar / Fijar Menú (Fixed)"}
              >
                <Pin className={`w-3.5 h-3.5 ${isFixed ? 'fill-amber-300 rotate-45 text-amber-300' : ''}`} />
                <span className="text-[10px] uppercase font-bold tracking-wider">
                  {isFixed ? 'FIXED' : 'Fijar'}
                </span>
              </button>
            )}

            {/* Close button for mobile */}
            <button
              onClick={onCloseMobile}
              type="button"
              className="md:hidden p-1.5 text-purple-300 hover:text-white hover:bg-purple-900/80 rounded-lg transition cursor-pointer"
              title="Cerrar menú"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Structure Diagram Quick Action Button */}
        {onOpenStructureModal && (
          <div className="px-3 pt-3 pb-1 shrink-0">
            <button
              onClick={onOpenStructureModal}
              className="w-full py-2 px-3 bg-gradient-to-r from-purple-950 via-[#3a0a5e] to-purple-950 hover:from-purple-900 hover:to-purple-900 border border-amber-400/50 hover:border-amber-300 text-amber-300 rounded-xl text-xs font-bold transition flex items-center justify-between shadow-xs cursor-pointer group"
              title="Ver arquitectura y diagrama del sistema"
            >
              <div className="flex items-center gap-2">
                <Network className="w-4 h-4 text-amber-400 group-hover:rotate-12 transition-transform" />
                <span>Estructura del Sistema</span>
              </div>
              <span className="text-[10px] bg-amber-400/20 text-amber-200 px-1.5 py-0.5 rounded font-mono">
                DIAGRAMA
              </span>
            </button>
          </div>
        )}

        {/* Navigation Section - Scrollable con espaciado compacto para ahorrar espacio */}
        <div className="flex-1 py-1.5 px-2 sm:px-2.5 space-y-0.5 overflow-y-auto">
          
          {/* 1. DASHBOARD */}
          <button
            onClick={() => {
              onSelectTab('dashboard');
              handleMobileClose();
            }}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer group min-h-[36px] ${
              isSectionActive('dashboard')
                ? 'bg-[#3f0a66] text-white font-bold shadow-xs border-l-4 border-[#e5a800]'
                : 'text-purple-200 hover:bg-[#2e074d] hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2 truncate">
              <Home className={`w-3.5 h-3.5 shrink-0 ${isSectionActive('dashboard') ? 'text-amber-300' : 'text-purple-300 group-hover:text-purple-100'}`} />
              <span className="truncate text-left text-xs">
                <span className="opacity-70 mr-1 font-mono">1.</span>
                DASHBOARD
              </span>
            </div>
            <ChevronRight 
              className={`w-3 h-3 shrink-0 transition-transform ${
                isSectionActive('dashboard') ? 'text-amber-300' : 'text-purple-400'
              }`} 
            />
          </button>

          {/* 2. SEGURIDAD (Usuario / Rol / Permiso) - Only for roles with access (Administrador) */}
          {canAccess('seguridad') && (
            <div className="space-y-0.5">
              <button
                onClick={() => handleSectionHeaderClick('seguridad', 'gestion_permisos')}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer group min-h-[36px] ${
                  isSectionActive('seguridad')
                    ? 'bg-[#3f0a66] text-white font-bold shadow-xs border-l-4 border-[#e5a800]'
                    : 'text-purple-200 hover:bg-[#2e074d] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <ShieldCheck className={`w-3.5 h-3.5 shrink-0 ${isSectionActive('seguridad') ? 'text-amber-300' : 'text-purple-300 group-hover:text-purple-100'}`} />
                  <span className="truncate text-left text-xs">
                    <span className="opacity-70 mr-1 font-mono">2.</span>
                    SEGURIDAD
                  </span>
                </div>
                <div 
                  onClick={(e) => handleChevronClick(e, 'seguridad')}
                  className="p-0.5 text-purple-400 hover:text-amber-300 hover:bg-purple-900/60 rounded transition"
                  title={openSections.seguridad ? "Colapsar submenú" : "Expandir submenú"}
                >
                  {openSections.seguridad ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                </div>
              </button>

              {openSections.seguridad && (
                <div className="pl-2.5 pr-1 py-0.5 space-y-0.5 border-l-2 border-[#3a0a5e] ml-3.5 animate-in fade-in duration-150">
                  {[
                    { id: 'gestion_permisos', label: 'Gestión de Permisos', icon: ShieldCheck },
                    { id: 'asignacion_arbol', label: 'Asignación de Usuarios y Grupos', icon: FolderTree },
                    { id: 'asignacion_academico', label: 'Asignación Académico', icon: GraduationCap },
                    { id: 'usuarios', label: 'Directorio de Usuarios', icon: Users },
                    { id: 'roles', label: 'Grupos y Roles', icon: Key },
                    { id: 'auditoria', label: 'Bitácora y Auditoría', icon: Clock }
                  ].map(sub => {
                    const SubIcon = sub.icon;
                    const isActive = isSectionActive('seguridad') && (
                      activeSubTab === sub.id || 
                      (sub.id === 'gestion_permisos' && (activeSubTab === 'permisos' || !activeSubTab))
                    );
                    return (
                      <button
                        key={sub.id}
                        onClick={() => {
                          onSelectTab('seguridad', sub.id);
                          handleMobileClose();
                        }}
                        className={`w-full flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                          isActive 
                            ? 'bg-[#e5a800] text-[#1f0533] font-black shadow-xs' 
                            : 'text-purple-200 hover:bg-[#2e074d] hover:text-white'
                        }`}
                      >
                        <SubIcon className={`w-3 h-3 shrink-0 ${isActive ? 'text-[#1f0533]' : 'text-purple-300'}`} />
                        <span className="truncate">{sub.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 3. ACADÉMICO (Sede / Escuela / Carrera / Asignatura-Nivel) */}
          <div className="space-y-0.5">
            <button
              onClick={() => handleSectionHeaderClick('academico', 'sedes')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer group min-h-[36px] ${
                isSectionActive('academico')
                  ? 'bg-[#3f0a66] text-white font-bold shadow-xs border-l-4 border-[#e5a800]'
                  : 'text-purple-200 hover:bg-[#2e074d] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <GraduationCap className={`w-3.5 h-3.5 shrink-0 ${isSectionActive('academico') ? 'text-amber-300' : 'text-purple-300 group-hover:text-purple-100'}`} />
                <span className="truncate text-left text-xs">
                  <span className="opacity-70 mr-1 font-mono">3.</span>
                  ACADÉMICO
                </span>
              </div>
              <div 
                onClick={(e) => handleChevronClick(e, 'academico')}
                className="p-0.5 text-purple-400 hover:text-amber-300 hover:bg-purple-900/60 rounded transition"
                title={openSections.academico ? "Colapsar submenú" : "Expandir submenú"}
              >
                {openSections.academico ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              </div>
            </button>

            {openSections.academico && (
              <div className="pl-2.5 pr-1 py-0.5 space-y-0.5 border-l-2 border-[#3a0a5e] ml-3.5 animate-in fade-in duration-150">
                {[
                  { id: 'sedes', label: 'Sedes Institucionales', icon: Building2 },
                  { id: 'bloques', label: 'Bloques', icon: Layers },
                  { id: 'aulas', label: 'Aulas / Laboratorios', icon: DoorOpen },
                  { id: 'escuelas', label: 'Escuela', icon: School },
                  { id: 'carreras', label: 'Carrera', icon: GraduationCap },
                  { id: 'asignatura_nivel', label: 'Asignatura / Nivel', icon: BookOpen },
                  { id: 'periodos', label: 'Periodo Lectivo', icon: Calendar }
                ].map(sub => {
                  const SubIcon = sub.icon;
                  const isActive = isSectionActive('academico') && activeSubTab === sub.id;
                  return (
                    <button
                      key={sub.id}
                      onClick={() => {
                        onSelectTab('academico', sub.id);
                        handleMobileClose();
                      }}
                      className={`w-full flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                        isActive 
                          ? 'bg-[#e5a800] text-[#1f0533] font-black shadow-xs' 
                          : 'text-purple-200 hover:bg-[#2e074d] hover:text-white'
                      }`}
                    >
                      <SubIcon className={`w-3 h-3 shrink-0 ${isActive ? 'text-[#1f0533]' : 'text-purple-300'}`} />
                      <span className="truncate">{sub.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 4. PLANIFICACIÓN (Docente / Asignatura / Paralelo) */}
          <div className="space-y-0.5">
            <button
              onClick={() => handleSectionHeaderClick('planificacion', 'planificaciones')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors cursor-pointer group min-h-[40px] ${
                isSectionActive('planificacion')
                  ? 'bg-[#3f0a66] text-white font-bold shadow-xs border-l-4 border-[#e5a800]'
                  : 'text-purple-200 hover:bg-[#2e074d] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <BookOpen className={`w-4 h-4 shrink-0 ${isSectionActive('planificacion') ? 'text-amber-300' : 'text-purple-300 group-hover:text-purple-100'}`} />
                <span className="truncate text-left">
                  <span className="opacity-70 mr-1 font-mono">4.</span>
                  PLANIFICACIÓN
                </span>
              </div>
              <div className="flex items-center gap-1">
                {isOwnOnly('planificacion') && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded font-black bg-indigo-500 text-white shadow-xs">
                    PROPIO
                  </span>
                )}
                <div 
                  onClick={(e) => handleChevronClick(e, 'planificacion')}
                  className="p-1 text-purple-400 hover:text-amber-300 hover:bg-purple-900/60 rounded-md transition"
                  title={openSections.planificacion ? "Colapsar submenú" : "Expandir submenú"}
                >
                  {openSections.planificacion ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </div>
              </div>
            </button>

            {openSections.planificacion && (
              <div className="pl-3 pr-1 py-0.5 space-y-0.5 border-l-2 border-[#3a0a5e] ml-4 animate-in fade-in duration-150">
                {[
                  { id: 'planificaciones', label: isOwnOnly('planificacion') ? 'Mi Carga Académica' : 'Planificación Académica', icon: Layers },
                  { id: 'asignar_asignaturas', label: 'Asignar Asignaturas', icon: ArrowLeftRight },
                  { id: 'asignar_bloques', label: 'Asignar Bloques', icon: Building2 },
                  { id: 'asignar_docentes', label: 'Asignación docentes/aulas', icon: UserCheck },
                  { id: 'docentes', label: 'Docente', icon: Users },
                  { id: 'asignaturas', label: 'Asignatura', icon: BookOpen },
                  { id: 'paralelos', label: 'Paralelo / Nivel / Jornada', icon: Clock }
                ].map(sub => {
                  const SubIcon = sub.icon;
                  const isActive = isSectionActive('planificacion') && activeSubTab === sub.id;
                  return (
                    <button
                      key={sub.id}
                      onClick={() => {
                        onSelectTab('planificacion', sub.id);
                        handleMobileClose();
                      }}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                        isActive 
                          ? 'bg-[#e5a800] text-[#1f0533] font-black shadow-xs' 
                          : 'text-purple-200 hover:bg-[#2e074d] hover:text-white'
                      }`}
                    >
                      <SubIcon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-[#1f0533]' : 'text-purple-300'}`} />
                      <span className="truncate">{sub.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 5. HORARIO */}
          <div className="space-y-0.5">
            <button
              onClick={() => handleSectionHeaderClick('horario', 'matriz')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors cursor-pointer group min-h-[40px] ${
                isSectionActive('horario')
                  ? 'bg-[#3f0a66] text-white font-bold shadow-xs border-l-4 border-[#e5a800]'
                  : 'text-purple-200 hover:bg-[#2e074d] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Clock className={`w-4 h-4 shrink-0 ${isSectionActive('horario') ? 'text-amber-300' : 'text-purple-300 group-hover:text-purple-100'}`} />
                <span className="truncate text-left">
                  <span className="opacity-70 mr-1 font-mono">5.</span>
                  HORARIO
                </span>
              </div>
              <div className="flex items-center gap-1">
                {isOwnOnly('horario') && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded font-black bg-indigo-500 text-white shadow-xs">
                    PROPIO
                  </span>
                )}
                <div 
                  onClick={(e) => handleChevronClick(e, 'horario')}
                  className="p-1 text-purple-400 hover:text-amber-300 hover:bg-purple-900/60 rounded-md transition"
                  title={openSections.horario ? "Colapsar submenú" : "Expandir submenú"}
                >
                  {openSections.horario ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </div>
              </div>
            </button>

            {openSections.horario && (
              <div className="pl-3 pr-1 py-0.5 space-y-0.5 border-l-2 border-[#3a0a5e] ml-4 animate-in fade-in duration-150">
                {[
                  { id: 'matriz', label: isOwnOnly('horario') ? 'Mi Horario Semanal' : 'Matriz Semanal de Horarios', icon: CalendarDays },
                  { id: 'feriados', label: 'Feriados Académicos', icon: AlertCircle }
                ].map(sub => {
                  const SubIcon = sub.icon;
                  const isActive = isSectionActive('horario') && activeSubTab === sub.id;
                  return (
                    <button
                      key={sub.id}
                      onClick={() => {
                        onSelectTab('horario', sub.id);
                        handleMobileClose();
                      }}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                        isActive 
                          ? 'bg-[#e5a800] text-[#1f0533] font-black shadow-xs' 
                          : 'text-purple-200 hover:bg-[#2e074d] hover:text-white'
                      }`}
                    >
                      <SubIcon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-[#1f0533]' : 'text-purple-300'}`} />
                      <span className="truncate">{sub.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 6. ASIGNACIÓN DE AULAS (Disponible / En Proceso / Ocupado) - Only for roles with access */}
          {canAccess('asignacion_aulas') && (
            <div className="space-y-0.5">
              <button
                onClick={() => handleSectionHeaderClick('asignacion_aulas', 'planificacion_aulas')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors cursor-pointer group min-h-[40px] ${
                  isSectionActive('asignacion_aulas')
                    ? 'bg-[#3f0a66] text-white font-bold shadow-xs border-l-4 border-[#e5a800]'
                    : 'text-purple-200 hover:bg-[#2e074d] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Building2 className={`w-4 h-4 shrink-0 ${isSectionActive('asignacion_aulas') ? 'text-amber-300' : 'text-purple-300 group-hover:text-purple-100'}`} />
                  <span className="truncate text-left">
                    <span className="opacity-70 mr-1 font-mono">6.</span>
                    ASIGNACIÓN DE AULAS
                  </span>
                </div>
                <div 
                  onClick={(e) => handleChevronClick(e, 'asignacion_aulas')}
                  className="p-1 text-purple-400 hover:text-amber-300 hover:bg-purple-900/60 rounded-md transition"
                  title={openSections.asignacion_aulas ? "Colapsar submenú" : "Expandir submenú"}
                >
                  {openSections.asignacion_aulas ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </div>
              </button>

              {openSections.asignacion_aulas && (
                <div className="pl-3 pr-1 py-0.5 space-y-1 border-l-2 border-[#3a0a5e] ml-4 animate-in fade-in duration-150">
                  {/* Planificación de Aulas (Vista Semáforo) */}
                  <button
                    onClick={() => {
                      onSelectTab('asignacion_aulas', 'planificacion_aulas', 'TODOS');
                      handleMobileClose();
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      isSectionActive('asignacion_aulas') && activeSubTab === 'planificacion_aulas' && (!activeSemaforoFilter || activeSemaforoFilter === 'TODOS')
                        ? 'bg-[#e5a800] text-[#1f0533] font-black shadow-xs'
                        : 'text-purple-200 hover:bg-[#2e074d] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Calendar className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">Planificación de Aulas</span>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.2 rounded font-black tracking-wider bg-emerald-500 text-white">
                      SEMÁFORO
                    </span>
                  </button>

                  {/* Micro-chips for Estados from diagram: DISPONIBLE, EN PROCESO, OCUPADO */}
                  <div className="grid grid-cols-3 gap-1 px-1 py-0.5">
                    <button
                      onClick={() => {
                        onSelectTab('asignacion_aulas', 'planificacion_aulas', 'DISPONIBLE');
                        handleMobileClose();
                      }}
                      className={`px-1 py-1 rounded text-[10px] font-black transition cursor-pointer border flex flex-col items-center gap-0.5 ${
                        isSectionActive('asignacion_aulas') && activeSemaforoFilter === 'DISPONIBLE'
                          ? 'bg-emerald-600 text-white border-emerald-400 shadow-xs'
                          : 'bg-[#2a0647] text-emerald-300 border-emerald-800/60 hover:bg-[#38095e]'
                      }`}
                      title="Filtrar por Disponibles"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      <span className="truncate">Disponible</span>
                    </button>

                    <button
                      onClick={() => {
                        onSelectTab('asignacion_aulas', 'planificacion_aulas', 'EN_PROCESO');
                        handleMobileClose();
                      }}
                      className={`px-1 py-1 rounded text-[10px] font-black transition cursor-pointer border flex flex-col items-center gap-0.5 ${
                        isSectionActive('asignacion_aulas') && activeSemaforoFilter === 'EN_PROCESO'
                          ? 'bg-amber-600 text-white border-amber-400 shadow-xs'
                          : 'bg-[#2a0647] text-amber-300 border-amber-800/60 hover:bg-[#38095e]'
                      }`}
                      title="Filtrar por En Proceso"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                      <span className="truncate">En Proceso</span>
                    </button>

                    <button
                      onClick={() => {
                        onSelectTab('asignacion_aulas', 'planificacion_aulas', 'OCUPADO');
                        handleMobileClose();
                      }}
                      className={`px-1 py-1 rounded text-[10px] font-black transition cursor-pointer border flex flex-col items-center gap-0.5 ${
                        isSectionActive('asignacion_aulas') && activeSemaforoFilter === 'OCUPADO'
                          ? 'bg-rose-600 text-white border-rose-400 shadow-xs'
                          : 'bg-[#2a0647] text-rose-300 border-rose-800/60 hover:bg-[#38095e]'
                      }`}
                      title="Filtrar por Ocupados"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                      <span className="truncate">Ocupado</span>
                    </button>
                  </div>

                  {/* Asignación y Planificación */}
                  <button
                    onClick={() => {
                      onSelectTab('asignacion_aulas', 'asignaciones');
                      handleMobileClose();
                    }}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      isSectionActive('asignacion_aulas') && activeSubTab === 'asignaciones'
                        ? 'bg-[#e5a800] text-[#1f0533] font-black shadow-xs'
                        : 'text-purple-200 hover:bg-[#2e074d] hover:text-white'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Asignación y Planificación</span>
                  </button>

                  {/* Inventario de Espacios */}
                  <button
                    onClick={() => {
                      onSelectTab('asignacion_aulas', 'inventario');
                      handleMobileClose();
                    }}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      isSectionActive('asignacion_aulas') && activeSubTab === 'inventario'
                        ? 'bg-[#e5a800] text-[#1f0533] font-black shadow-xs'
                        : 'text-purple-200 hover:bg-[#2e074d] hover:text-white'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Inventario de Espacios</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 7. REPORTES */}
          <button
            onClick={() => {
              onSelectTab('reportes');
              handleMobileClose();
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors cursor-pointer group min-h-[40px] ${
              isSectionActive('reportes')
                ? 'bg-[#3f0a66] text-white font-bold shadow-xs border-l-4 border-[#e5a800]'
                : 'text-purple-200 hover:bg-[#2e074d] hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5 truncate">
              <FileSpreadsheet className={`w-4 h-4 shrink-0 ${isSectionActive('reportes') ? 'text-amber-300' : 'text-purple-300 group-hover:text-purple-100'}`} />
              <span className="truncate text-left">
                <span className="opacity-70 mr-1 font-mono">7.</span>
                REPORTES
              </span>
            </div>
            <ChevronRight 
              className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                isSectionActive('reportes') ? 'text-amber-300' : 'text-purple-400'
              }`} 
            />
          </button>

        </div>

        {/* Sidebar Footer info */}
        <div className="p-3 border-t border-[#3a0a5e] text-[10px] text-purple-300/80 flex items-center justify-between bg-[#180329]/70 shrink-0">
          <span>Gestión Académica ISUJ</span>
          <span className="text-amber-400 font-mono font-bold">v2026.1</span>
        </div>
      </aside>
    </>
  );
};
