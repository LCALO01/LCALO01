import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './controllers/authContext.tsx';
import { ApiClient } from './controllers/apiClient.ts';
import { Catalogos, AulaLaboratorio, PlanificacionCompleta } from './types.ts';
import { Topbar } from './components/Topbar.tsx';
import { Sidebar, MainSectionType } from './components/Sidebar.tsx';
import { AsignacionModal } from './components/AsignacionModal.tsx';
import { ModalEstructuraSistema } from './components/ModalEstructuraSistema.tsx';
import { DashboardOverview } from './views/DashboardOverview.tsx';
import { SeguridadView } from './views/SeguridadView.tsx';
import { AcademicoModulo } from './views/AcademicoModulo.tsx';
import { PlanificacionModulo } from './views/PlanificacionModulo.tsx';
import { HorariosModulo } from './views/HorariosModulo.tsx';
import { GestionAulasModulo } from './views/GestionAulasModulo.tsx';
import { CatalogosMaestrosModulo } from './views/CatalogosMaestrosModulo.tsx';
import { ReportesView } from './views/ReportesView.tsx';
import { LoginView } from './components/auth/LoginView.tsx';
import { 
  Loader2, 
  AlertCircle, 
  RefreshCw, 
  X,
  Home,
  ShieldCheck,
  GraduationCap,
  BookOpen,
  Building2,
  Network
} from 'lucide-react';

function AppContent() {
  const { isAuthenticated } = useAuth();
  const [currentSection, setCurrentSection] = useState<MainSectionType>('asignacion_aulas');
  const [currentSubSection, setCurrentSubSection] = useState<string>('planificacion_aulas');
  const [currentSemaforoFilter, setCurrentSemaforoFilter] = useState<'TODOS' | 'DISPONIBLE' | 'EN_PROCESO' | 'OCUPADO'>('TODOS');
  
  const [isStructureModalOpen, setIsStructureModalOpen] = useState<boolean>(false);
  
  // Menú congelado / fixed (por defecto activo como solicita el usuario)
  const [isSidebarFixed, setIsSidebarFixed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('isuj_sidebar_fixed');
      return saved !== null ? saved === 'true' : true; // Por defecto siempre congelado / fixed
    }
    return true;
  });

  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('isuj_sidebar_fixed');
      if (saved === 'false') return window.innerWidth >= 768;
      return true; // Predeterminado: abierto y congelado
    }
    return true;
  });

  const handleToggleSidebarFixed = () => {
    setIsSidebarFixed(prev => {
      const next = !prev;
      localStorage.setItem('isuj_sidebar_fixed', String(next));
      if (next) {
        setSidebarOpen(true);
      }
      return next;
    });
  };
  const [loading, setLoading] = useState<boolean>(true);
  const [isRestoring, setIsRestoring] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [catalogos, setCatalogos] = useState<Catalogos | null>(null);
  const [aulas, setAulas] = useState<AulaLaboratorio[]>([]);
  const [planificaciones, setPlanificaciones] = useState<PlanificacionCompleta[]>([]);

  // Modal controls
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingPlan, setEditingPlan] = useState<PlanificacionCompleta | null>(null);

  // Detail modal for viewing full assignment specs
  const [viewingPlan, setViewingPlan] = useState<PlanificacionCompleta | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [cats, aulList, planList] = await Promise.all([
        ApiClient.getCatalogos(),
        ApiClient.getAulas(),
        ApiClient.getPlanificaciones()
      ]);
      setCatalogos(cats);
      setAulas(aulList);
      setPlanificaciones(planList);
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError(err.message || 'Error al conectar con la base de datos SQLite.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRestoreData = async () => {
    setIsRestoring(true);
    try {
      const [cats, aulList, planList] = await Promise.all([
        ApiClient.getCatalogos(),
        ApiClient.getAulas(),
        ApiClient.getPlanificaciones()
      ]);
      setCatalogos(cats);
      setAulas(aulList);
      setPlanificaciones(planList);
    } catch (err) {
      console.error('Error restoring data:', err);
    } finally {
      setIsRestoring(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenNewModal = () => {
    setEditingPlan(null);
    setIsModalOpen(true);
  };

  const handleEditPlan = (plan: PlanificacionCompleta) => {
    setEditingPlan(plan);
    setIsModalOpen(true);
  };

  const handleRefreshAulas = async () => {
    try {
      const aulList = await ApiClient.getAulas();
      setAulas(aulList);
    } catch (err) {
      console.error(err);
    }
  };

  const handleNavigate = (modulo: string, subModulo?: string, estadoFiltro?: string) => {
    const isSameModule = currentSection === modulo;
    setCurrentSection(modulo as MainSectionType);
    if (subModulo) {
      setCurrentSubSection(subModulo);
    } else if (!isSameModule) {
      if (modulo === 'seguridad') setCurrentSubSection('gestion_permisos');
      else if (modulo === 'academico' || modulo === 'catalogos') setCurrentSubSection('sedes');
      else if (modulo === 'planificacion') setCurrentSubSection('planificaciones');
      else if (modulo === 'horario') setCurrentSubSection('matriz');
      else if (modulo === 'asignacion_aulas' || modulo === 'gestion_aulas') setCurrentSubSection('planificacion_aulas');
      else setCurrentSubSection('');
    }
    if (estadoFiltro) {
      setCurrentSemaforoFilter(estadoFiltro as any);
    }
  };

  if (!isAuthenticated) {
    return <LoginView />;
  }

  if (loading && !catalogos) {
    return (
      <div className="min-h-screen bg-[#280740] flex flex-col items-center justify-center p-4 text-white">
        <div className="w-12 h-12 rounded-xl bg-[#e5a800] flex items-center justify-center mb-4 shadow-lg shadow-amber-500/20 text-[#280740]">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
        <h2 className="text-lg font-bold text-white">Cargando Gestión Académica ISUJ</h2>
        <p className="text-xs text-purple-200 mt-1">Conectando a base de datos SQLite y módulos institucionales...</p>
      </div>
    );
  }

  if (error && !catalogos) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-2xl border border-rose-200 max-w-md w-full shadow-lg text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Error de Conexión</h3>
            <p className="text-xs text-slate-600 mt-1">{error}</p>
          </div>
          <button
            onClick={loadData}
            className="w-full py-2 bg-[#350854] hover:bg-[#4a0e78] text-amber-300 border border-amber-400/50 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-[#f1f5f9] text-slate-900 flex flex-col font-sans">
      {/* Top Navigation Bar with Quick Estructura Button */}
      <Topbar 
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onRestoreData={handleRestoreData}
        isRestoring={isRestoring}
        onOpenStructureModal={() => setIsStructureModalOpen(true)}
        isSidebarFixed={isSidebarFixed}
      />

      {/* Main Layout: Sidebar + Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Hierarchical Sidebar based on user's structural diagram */}
        <Sidebar 
          currentTab={currentSection}
          onSelectTab={(tab, subTab, estadoFiltro) => {
            handleNavigate(tab, subTab, estadoFiltro);
          }}
          activeSubTab={currentSubSection}
          activeSemaforoFilter={currentSemaforoFilter}
          isOpen={sidebarOpen}
          onCloseMobile={() => setSidebarOpen(false)}
          onOpenStructureModal={() => setIsStructureModalOpen(true)}
          isFixed={isSidebarFixed}
          onToggleFixed={handleToggleSidebarFixed}
        />

        {/* Scrollable Main Area */}
        <main className="flex-1 overflow-y-auto p-2 sm:p-3 lg:p-3.5 2xl:max-w-[1700px] w-full mx-auto">
          {catalogos && (
            <>
              {/* 1. DASHBOARD */}
              {(currentSection === 'dashboard' || currentSection === 'inicio') && (
                <DashboardOverview
                  catalogos={catalogos}
                  aulas={aulas}
                  planificaciones={planificaciones}
                  onNavigate={(tab, subTab) => {
                    handleNavigate(tab, subTab);
                  }}
                  onOpenNewModal={handleOpenNewModal}
                  onSelectPlan={setViewingPlan}
                />
              )}

              {/* 2. SEGURIDAD (Gestión de Permisos / Usuarios / Grupos / Roles) */}
              {currentSection === 'seguridad' && (
                <SeguridadView 
                  initialSubTab={(currentSubSection as any) || 'gestion_permisos'}
                  activeSubTab={(currentSubSection as any) || 'gestion_permisos'}
                  onTabChange={(tab) => handleNavigate('seguridad', tab)}
                />
              )}

              {/* 3. ACADÉMICO (Sede / Escuela / Carrera / Periodo) */}
              {(currentSection === 'academico' || currentSection === 'catalogos') && (
                <AcademicoModulo
                  catalogos={catalogos}
                  planificaciones={planificaciones}
                  aulas={aulas}
                  onRefreshCatalogos={loadData}
                  initialSubTab={currentSubSection as any || 'sedes'}
                  activeSubTab={currentSubSection as any || 'sedes'}
                  onTabChange={(tab) => handleNavigate(currentSection, tab)}
                />
              )}

              {/* 4. PLANIFICACIÓN (Docente / Asignatura / Paralelo) */}
              {currentSection === 'planificacion' && (
                <PlanificacionModulo
                  catalogos={catalogos}
                  planificaciones={planificaciones}
                  aulas={aulas}
                  onOpenNewModal={handleOpenNewModal}
                  onEdit={handleEditPlan}
                  onRefresh={loadData}
                  onRefreshAulas={handleRefreshAulas}
                  initialSubTab={currentSubSection as any || 'planificaciones'}
                  activeSubTab={currentSubSection as any || 'planificaciones'}
                  onTabChange={(tab) => handleNavigate('planificacion', tab)}
                />
              )}

              {/* 5. HORARIO (Matriz / Feriados) */}
              {currentSection === 'horario' && (
                <HorariosModulo
                  catalogos={catalogos}
                  planificaciones={planificaciones}
                  aulas={aulas}
                  onSelectPlan={setViewingPlan}
                  onRefreshCatalogos={loadData}
                  initialSubTab={currentSubSection as any || 'matriz'}
                  activeSubTab={currentSubSection as any || 'matriz'}
                  onTabChange={(tab) => handleNavigate('horario', tab)}
                />
              )}

              {/* 6. ASIGNACIÓN DE AULAS (Disponible / En Proceso / Ocupado / Asignación / Inventario) */}
              {(currentSection === 'asignacion_aulas' || currentSection === 'gestion_aulas') && (
                <GestionAulasModulo
                  catalogos={catalogos}
                  aulas={aulas}
                  planificaciones={planificaciones}
                  onOpenNewModal={handleOpenNewModal}
                  onEdit={handleEditPlan}
                  onRefresh={loadData}
                  onRefreshAulas={handleRefreshAulas}
                  onSelectPlan={setViewingPlan}
                  initialSubTab={currentSubSection as any || 'planificacion_aulas'}
                  activeSubTab={currentSubSection as any || 'planificacion_aulas'}
                  onTabChange={(tab) => handleNavigate(currentSection, tab)}
                  semaforoFilter={currentSemaforoFilter}
                />
              )}

              {/* 7. REPORTES */}
              {currentSection === 'reportes' && (
                <ReportesView
                  catalogos={catalogos}
                  aulas={aulas}
                  planificaciones={planificaciones}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (< 640px) */}
      <nav className="sm:hidden sticky bottom-0 z-30 bg-[#280740] border-t-2 border-[#e5a800] px-1 py-1 flex items-center justify-around text-[9px] text-purple-200 select-none shadow-lg">
        <button
          onClick={() => handleNavigate('dashboard')}
          className={`flex flex-col items-center justify-center gap-0.5 px-2 py-1 rounded-xl transition min-w-[50px] min-h-[44px] ${
            currentSection === 'dashboard' || currentSection === 'inicio' ? 'text-amber-300 font-bold bg-purple-900/80' : 'hover:text-white'
          }`}
        >
          <Home className="w-4 h-4" />
          <span>Inicio</span>
        </button>

        <button
          onClick={() => handleNavigate('seguridad', 'gestion_permisos')}
          className={`flex flex-col items-center justify-center gap-0.5 px-2 py-1 rounded-xl transition min-w-[50px] min-h-[44px] ${
            currentSection === 'seguridad' ? 'text-amber-300 font-bold bg-purple-900/80' : 'hover:text-white'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Seguridad</span>
        </button>

        <button
          onClick={() => handleNavigate('academico', 'sedes')}
          className={`flex flex-col items-center justify-center gap-0.5 px-2 py-1 rounded-xl transition min-w-[50px] min-h-[44px] ${
            currentSection === 'academico' || currentSection === 'catalogos' ? 'text-amber-300 font-bold bg-purple-900/80' : 'hover:text-white'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Académico</span>
        </button>

        <button
          onClick={() => handleNavigate('planificacion', 'planificaciones')}
          className={`flex flex-col items-center justify-center gap-0.5 px-2 py-1 rounded-xl transition min-w-[50px] min-h-[44px] ${
            currentSection === 'planificacion' ? 'text-amber-300 font-bold bg-purple-900/80' : 'hover:text-white'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Planif.</span>
        </button>

        <button
          onClick={() => handleNavigate('asignacion_aulas', 'planificacion_aulas')}
          className={`flex flex-col items-center justify-center gap-0.5 px-2 py-1 rounded-xl transition min-w-[50px] min-h-[44px] ${
            currentSection === 'asignacion_aulas' || currentSection === 'gestion_aulas' ? 'text-amber-300 font-bold bg-purple-900/80' : 'hover:text-white'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Aulas</span>
        </button>

        <button
          onClick={() => setIsStructureModalOpen(true)}
          className="flex flex-col items-center justify-center gap-0.5 px-2 py-1 rounded-xl transition min-w-[50px] min-h-[44px] text-amber-400 hover:text-amber-200"
          title="Ver estructura institucional"
        >
          <Network className="w-4 h-4" />
          <span>Estructura</span>
        </button>
      </nav>

      {/* Interactive System Structure Diagram Modal */}
      <ModalEstructuraSistema
        isOpen={isStructureModalOpen}
        onClose={() => setIsStructureModalOpen(false)}
        onNavigateTo={(modulo, subModulo, estadoFiltro) => {
          handleNavigate(modulo, subModulo, estadoFiltro);
        }}
      />

      {/* Assignment Form Modal */}
      {catalogos && (
        <AsignacionModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingPlan(null);
          }}
          onSaved={loadData}
          catalogos={catalogos}
          aulas={aulas}
          initialData={editingPlan}
          planificaciones={planificaciones}
        />
      )}

      {/* Detail Drawer Modal for Inspecting Any Assignment */}
      {viewingPlan && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto p-4 sm:p-6 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Ficha #{viewingPlan.id_planificacion}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-100 text-cyan-800">
                  {viewingPlan.periodo_codigo}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${
                  viewingPlan.aula_estado === 'MANTENIMIENTO'
                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                    : viewingPlan.aula_estado === 'INACTIVO' || viewingPlan.estado === 'INACTIVO'
                    ? 'bg-rose-100 text-rose-800 border-rose-300'
                    : 'bg-blue-100 text-blue-800 border-blue-300'
                }`}>
                  {viewingPlan.aula_estado === 'MANTENIMIENTO' ? 'Mantenimiento' : viewingPlan.aula_estado === 'INACTIVO' || viewingPlan.estado === 'INACTIVO' ? 'Inactivo' : 'Ocupado'}
                </span>
              </div>
              <button
                onClick={() => setViewingPlan(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-mono font-bold text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-900 border border-indigo-200">
                    {viewingPlan.asignatura_codigo}
                  </span>
                  <span className="text-slate-500 text-xs font-medium">{viewingPlan.carrera_nombre}</span>
                </div>
                <div className="font-bold text-slate-900 text-sm leading-snug">{viewingPlan.asignatura_nombre}</div>
                <div className="text-[11px] text-slate-400 mt-1 font-mono">
                  Créditos: {viewingPlan.asignatura_creditos} • Horas totales: {viewingPlan.asignatura_horas_totales}h
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-slate-400 text-[10px] uppercase font-semibold">Aula / Espacio</div>
                  <div className="font-bold text-slate-800 text-sm mt-0.5 flex items-center gap-1.5">
                    <span>{viewingPlan.aula_codigo}</span>
                    <span className="text-[10px] font-bold text-slate-500">({viewingPlan.aula_tipo})</span>
                  </div>
                  <div className="text-slate-500 text-[11px]">{viewingPlan.bloque_nombre} • Piso {viewingPlan.aula_piso}</div>
                  <div className="text-[10px] font-bold text-[#350854] mt-1">
                    Capacidad: {viewingPlan.aula_capacidad} puestos
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-slate-400 text-[10px] uppercase font-semibold">Horario & Día</div>
                  <div className="font-bold text-slate-800 text-sm mt-0.5">{viewingPlan.dia_nombre}</div>
                  <div className="text-slate-600 font-mono text-[11px]">{viewingPlan.hora_inicio} - {viewingPlan.hora_fin}</div>
                  <div className="text-[10px] text-slate-600 mt-1 font-semibold">
                    Jornada: <span className="uppercase text-slate-900 font-bold">{viewingPlan.jornada_nombre || viewingPlan.jornada_codigo}</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="text-slate-400 text-[10px] uppercase font-semibold">Docente Titular</div>
                <div className="font-bold text-slate-900 mt-0.5 text-sm">
                  {viewingPlan.docente_nombres} {viewingPlan.docente_apellidos}
                </div>
                <div className="text-slate-500 text-[11px] mt-0.5 break-all">
                  Cédula: {viewingPlan.docente_ci} • Correo: {viewingPlan.docente_correo}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <div className="text-slate-400 text-[10px] uppercase font-semibold">Estudiantes Asignados</div>
                  <div className="font-bold text-slate-900 text-sm">{viewingPlan.numero_estudiantes} inscritos</div>
                </div>
                <div className="text-right">
                  <div className="text-slate-400 text-[10px] uppercase font-semibold">Tasa de Ocupación</div>
                  <div className="font-bold text-[#350854] text-sm">
                    {Math.round((viewingPlan.numero_estudiantes / viewingPlan.aula_capacidad) * 100)}%
                  </div>
                </div>
              </div>

              {viewingPlan.curso_unificado === 1 && (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-950">
                  <div className="font-bold">Curso Unificado / Compartido</div>
                  <div className="text-[11px] mt-0.5">
                    Compartido con: {viewingPlan.unificada_carrera || viewingPlan.unificada_asignatura}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setViewingPlan(null);
                  handleEditPlan(viewingPlan);
                }}
                className="px-3.5 py-2 bg-[#350854] hover:bg-[#4a0e78] text-amber-300 border border-amber-400/40 rounded-lg text-xs font-bold cursor-pointer min-h-[38px] shadow-sm"
              >
                Editar Asignación
              </button>
              <button
                onClick={() => setViewingPlan(null)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium cursor-pointer min-h-[38px]"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
