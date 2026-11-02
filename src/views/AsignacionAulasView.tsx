import React, { useState, useMemo } from 'react';
import { Catalogos, AulaLaboratorio, PlanificacionCompleta } from '../types.ts';
import { useAuth } from '../controllers/authContext.tsx';
import { ExportController } from '../controllers/exportController.ts';
import { ApiClient } from '../controllers/apiClient.ts';
import { ModalAsignacionAutomatica } from '../components/ModalAsignacionAutomatica.tsx';
import { detectarConflictosPlanificacion, ConflictoRegistro, ResumenConflictosGlobal } from '../utils/conflictDetector.ts';
import { 
  Plus, 
  Search, 
  Filter, 
  FileText, 
  FileSpreadsheet, 
  Download, 
  Edit3, 
  Trash2, 
  Building2, 
  Users, 
  Clock, 
  GraduationCap, 
  AlertTriangle, 
  Layers,
  ChevronDown,
  Sparkles,
  Check,
  LayoutGrid,
  Table,
  AlertOctagon,
  ShieldAlert,
  Info,
  Flame,
  RefreshCw,
  Eye,
  CheckCircle2,
  CalendarCheck,
  X
} from 'lucide-react';

interface AsignacionAulasViewProps {
  catalogos: Catalogos;
  aulas: AulaLaboratorio[];
  planificaciones: PlanificacionCompleta[];
  onOpenNewModal: () => void;
  onEdit: (plan: PlanificacionCompleta) => void;
  onRefresh: () => void;
  onRefreshAulas?: () => void;
}

export const AsignacionAulasView: React.FC<AsignacionAulasViewProps> = ({
  catalogos,
  aulas,
  planificaciones,
  onOpenNewModal,
  onEdit,
  onRefresh,
  onRefreshAulas
}) => {
  const { user } = useAuth();

  // Filters state
  const [search, setSearch] = useState('');
  const [selectedBloque, setSelectedBloque] = useState<string>('');
  const [selectedPiso, setSelectedPiso] = useState<string>('');
  const [selectedTipoAula, setSelectedTipoAula] = useState<string>('');
  const [selectedJornada, setSelectedJornada] = useState<string>('');
  const [selectedDia, setSelectedDia] = useState<string>('');
  const [selectedCarrera, setSelectedCarrera] = useState<string>('');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isAutoAssignModalOpen, setIsAutoAssignModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'tabla' | 'tarjetas'>('tabla');

  // Real-Time Conflict Detection States
  const [simulatedConflicts, setSimulatedConflicts] = useState<PlanificacionCompleta[]>([]);
  const [filterOnlyConflicts, setFilterOnlyConflicts] = useState(false);
  const [selectedConflictDetail, setSelectedConflictDetail] = useState<ConflictoRegistro | null>(null);

  // Combine real planificaciones with simulated test conflicts
  const allPlanificaciones = useMemo(() => {
    return [...planificaciones, ...simulatedConflicts];
  }, [planificaciones, simulatedConflicts]);

  // Real-time conflict engine execution
  const conflictosGlobales: ResumenConflictosGlobal = useMemo(() => {
    return detectarConflictosPlanificacion(allPlanificaciones);
  }, [allPlanificaciones]);

  // Simular Cruce de Docente (Mismo docente en 2 aulas simultáneamente)
  const handleSimularCruceDocente = () => {
    const base = planificaciones[0] || {
      id_sede: 1,
      id_escuela: 1,
      id_carrera: 1,
      id_asignatura: 1,
      id_docente: 1,
      id_nivel: 1,
      id_paralelo: 1,
      id_jornada: 1,
      id_bloque: 1,
      id_aula_laboratorio: 1,
      id_periodo: 1,
      id_dia: 1,
      hora_inicio: '08:00',
      hora_fin: '12:00',
      dia_nombre: 'Lunes',
      aula_codigo: 'A1',
      docente_nombres: 'MARIO',
      docente_apellidos: 'FAJARDO'
    };

    // Pick a different classroom to place the same teacher at the same day & time
    const simAula = aulas.find(a => a.id_aula_laboratorio !== base.id_aula_laboratorio) || aulas[1] || {
      id_aula_laboratorio: 999,
      codigo: 'LAB-02',
      nombre: 'Laboratorio Multimedia',
      tipo: 'LABORATORIO',
      capacidad: 30
    };

    const nuevoCruce: PlanificacionCompleta = {
      ...base,
      id_planificacion: -9991,
      id_aula_laboratorio: simAula.id_aula_laboratorio,
      aula_codigo: simAula.codigo,
      aula_nombre: simAula.nombre,
      aula_tipo: simAula.tipo as any,
      aula_capacidad: simAula.capacidad,
      bloque_nombre: 'BLOQUE B',
      asignatura_codigo: 'RED-201',
      asignatura_nombre: 'REDES DE COMUNICACIÓN Y TELEMÁTICA',
      curso_unificado: 0,
      observaciones: '⚠️ CASO DE PRUEBA: Docente asignado a 2 aulas simultáneamente'
    };

    setSimulatedConflicts([nuevoCruce]);
  };

  // Simular Cruce de Aula (Misma aula con 2 asignaturas simultáneamente)
  const handleSimularCruceAula = () => {
    const base = planificaciones[0] || {
      id_sede: 1,
      id_escuela: 1,
      id_carrera: 1,
      id_asignatura: 1,
      id_docente: 1,
      id_nivel: 1,
      id_paralelo: 1,
      id_jornada: 1,
      id_bloque: 1,
      id_aula_laboratorio: 1,
      id_periodo: 1,
      id_dia: 1,
      hora_inicio: '08:00',
      hora_fin: '12:00',
      dia_nombre: 'Lunes',
      aula_codigo: 'A1'
    };

    const otraAsignatura = catalogos.asignaturas.find(a => a.id_asignatura !== base.id_asignatura) || {
      id_asignatura: 999,
      codigo_asignatura: 'CON-301',
      nombre: 'AUDITORÍA Y CONTROL DE GESTIÓN'
    };

    const otroDocente = catalogos.docentes.find(d => d.id_docente !== base.id_docente) || {
      id_docente: 999,
      nombres: 'CARLOS',
      apellidos: 'MENDOZA'
    };

    const nuevoCruce: PlanificacionCompleta = {
      ...base,
      id_planificacion: -9992,
      id_asignatura: otraAsignatura.id_asignatura,
      asignatura_codigo: otraAsignatura.codigo_asignatura,
      asignatura_nombre: otraAsignatura.nombre,
      id_docente: otroDocente.id_docente,
      docente_nombres: otroDocente.nombres,
      docente_apellidos: otroDocente.apellidos,
      curso_unificado: 0,
      observaciones: '⚠️ CASO DE PRUEBA: Misma aula asignada a 2 asignaturas diferentes'
    };

    setSimulatedConflicts([nuevoCruce]);
  };

  const handleLimpiarSimulacion = () => {
    setSimulatedConflicts([]);
    setFilterOnlyConflicts(false);
  };

  // Filter logic
  const filtered = allPlanificaciones.filter(p => {
    // Filter only conflicts if toggled
    if (filterOnlyConflicts) {
      const conf = conflictosGlobales.registrosPorId[p.id_planificacion];
      if (!conf?.tieneConflicto) return false;
    }

    if (search) {
      const q = search.toLowerCase();
      const matchText = 
        p.asignatura_nombre.toLowerCase().includes(q) ||
        p.asignatura_codigo.toLowerCase().includes(q) ||
        p.docente_nombres.toLowerCase().includes(q) ||
        p.docente_apellidos.toLowerCase().includes(q) ||
        p.aula_codigo.toLowerCase().includes(q) ||
        p.carrera_nombre.toLowerCase().includes(q);
      if (!matchText) return false;
    }
    if (selectedBloque && p.id_bloque !== Number(selectedBloque)) return false;
    if (selectedPiso && p.aula_piso !== Number(selectedPiso)) return false;
    if (selectedTipoAula && p.aula_tipo !== selectedTipoAula) return false;
    if (selectedJornada && p.id_jornada !== Number(selectedJornada)) return false;
    if (selectedDia && p.id_dia !== Number(selectedDia)) return false;
    if (selectedCarrera && p.id_carrera !== Number(selectedCarrera)) return false;
    return true;
  });

  const handleDelete = async (id: number) => {
    if (id < 0) {
      // Remove simulated
      setSimulatedConflicts(prev => prev.filter(p => p.id_planificacion !== id));
      return;
    }

    if (!window.confirm('¿Está seguro de eliminar esta asignación de aula y horario?')) return;
    try {
      setDeletingId(id);
      await ApiClient.deletePlanificacion(id);
      if (onRefreshAulas) onRefreshAulas();
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Error al eliminar');
    } finally {
      setDeletingId(null);
    }
  };

  const getPeriodoDates = (idPeriodo: number) => {
    const per = catalogos.periodos.find(p => p.id_periodo === idPeriodo);
    return {
      inicio: per?.fecha_inicio || '2026-03-01',
      fin: per?.fecha_fin || '2026-08-31'
    };
  };

  const renderScheduleCell = (p: PlanificacionCompleta, diaNum: number, diaKey: string) => {
    const diaUpper = (p.dia_nombre || '').toUpperCase();
    const isDay = p.id_dia === diaNum || diaUpper.includes(diaKey);
    const conf = conflictosGlobales.registrosPorId[p.id_planificacion];
    const isDayInConflict = isDay && conf?.tieneConflicto;

    if (isDay && p.hora_inicio && p.hora_fin) {
      if (isDayInConflict) {
        return (
          <span 
            onClick={() => setSelectedConflictDetail(conf)}
            className="inline-block px-1.5 py-0.5 rounded bg-rose-600 hover:bg-rose-700 text-white border border-rose-700 text-[9px] font-extrabold font-mono whitespace-nowrap shadow-xs animate-pulse cursor-pointer transition"
            title={`🚨 CONFLICTO EN ESTE HORARIO: ${conf.resumen}. Haga clic para inspeccionar.`}
          >
            ⚠️ {p.hora_inicio} - {p.hora_fin}
          </span>
        );
      }
      return (
        <span className="inline-block px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 text-[9px] font-bold font-mono whitespace-nowrap shadow-2xs">
          {p.hora_inicio} - {p.hora_fin}
        </span>
      );
    }
    return <span className="text-slate-300 font-bold text-center select-none">-</span>;
  };

  return (
    <div className="space-y-5">
      {/* Header with Title & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-purple-100 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">
              Asignación Integral de Aulas y Espacios
            </h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-900 border border-purple-200">
              {filtered.length} asignaciones
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Planificación académica por sede, carrera, docente, aforo, unificaciones y horario semanal completo.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Asignación Automática Button */}
          {user.permissions.canCreateAssignment && (
            <button
              onClick={() => setIsAutoAssignModalOpen(true)}
              className="px-3.5 py-2 bg-gradient-to-r from-purple-800 to-[#280740] hover:from-purple-900 hover:to-black text-white rounded-xl text-xs font-bold shadow-md shadow-purple-900/20 flex items-center gap-1.5 transition cursor-pointer border border-amber-400/40"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Asignación Automática</span>
            </button>
          )}

          {/* Export button with dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border border-slate-200"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Exportar Reporte</span>
              <ChevronDown className="w-3.5 h-3.5 ml-0.5 text-slate-500" />
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-1.5 w-52 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-30 animate-in fade-in">
                <button
                  onClick={() => {
                    ExportController.exportAsignacionesPDF(filtered);
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-medium"
                >
                  <FileText className="w-4 h-4 text-rose-600" />
                  Descargar Reporte PDF
                </button>
                <button
                  onClick={() => {
                    ExportController.exportAsignacionesXLSX(filtered);
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-medium"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  Descargar Excel (XLSX)
                </button>
                <button
                  onClick={() => {
                    ExportController.exportAsignacionesCSV(filtered);
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-medium"
                >
                  <Download className="w-4 h-4 text-[#e5a800]" />
                  Descargar CSV (Excel UTF-8)
                </button>
              </div>
            )}
          </div>

          {/* New Assignment Button */}
          {user.permissions.canCreateAssignment ? (
            <button
              onClick={onOpenNewModal}
              className="px-4 py-2 bg-[#e5a800] hover:bg-[#d97706] text-[#280740] rounded-xl text-xs font-black shadow-md shadow-amber-500/20 flex items-center gap-1.5 transition cursor-pointer border border-amber-300"
            >
              <Plus className="w-4 h-4 text-[#280740]" />
              <span>Nueva Asignación</span>
            </button>
          ) : (
            <div className="text-xs text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
              Modo Solo Lectura ({user.rol})
            </div>
          )}
        </div>
      </div>

      {/* PANEL DE DETECCIÓN DE CONFLICTOS EN TIEMPO REAL */}
      <div className={`p-4 rounded-2xl border transition-all shadow-xs ${
        conflictosGlobales.totalRegistrosConConflicto > 0
          ? 'bg-rose-50/90 border-2 border-rose-500 shadow-rose-200'
          : 'bg-emerald-50/60 border border-emerald-200'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div className={`p-2.5 rounded-xl text-white shrink-0 ${
              conflictosGlobales.totalRegistrosConConflicto > 0
                ? 'bg-rose-600 shadow-md shadow-rose-300 animate-pulse'
                : 'bg-emerald-600'
            }`}>
              {conflictosGlobales.totalRegistrosConConflicto > 0 ? (
                <ShieldAlert className="w-5 h-5" />
              ) : (
                <CheckCircle2 className="w-5 h-5" />
              )}
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <span>Detección de Conflictos en Tiempo Real</span>
                  <span className="relative flex h-2 w-2">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      conflictosGlobales.totalRegistrosConConflicto > 0 ? 'bg-rose-400' : 'bg-emerald-400'
                    }`} />
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${
                      conflictosGlobales.totalRegistrosConConflicto > 0 ? 'bg-rose-500' : 'bg-emerald-500'
                    }`} />
                  </span>
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                  conflictosGlobales.totalRegistrosConConflicto > 0
                    ? 'bg-rose-600 text-white'
                    : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {conflictosGlobales.totalRegistrosConConflicto > 0 
                    ? `${conflictosGlobales.totalRegistrosConConflicto} en conflicto` 
                    : 'Sistema sin cruces'}
                </span>
              </div>

              <p className="text-[11.5px] text-slate-600">
                {conflictosGlobales.totalRegistrosConConflicto > 0 ? (
                  <span>
                    Se han resaltado en <strong className="text-rose-700 font-black">rojo</strong> los registros con solapamiento horario: docente en 2 aulas o aula asignada a 2 materias simultáneamente.
                  </span>
                ) : (
                  <span>
                    Todos los docentes y aulas se encuentran correctamente asignados sin cruces simultáneos (los cursos unificados se validan legítimamente).
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Badges and Interactive Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {conflictosGlobales.totalCrucesDocente > 0 && (
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-100 border border-rose-300 text-rose-900 flex items-center gap-1">
                <span>👨‍🏫 Cruces Docente:</span>
                <strong className="font-mono font-black">{conflictosGlobales.totalCrucesDocente}</strong>
              </span>
            )}

            {conflictosGlobales.totalCrucesAula > 0 && (
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-100 border border-rose-300 text-rose-900 flex items-center gap-1">
                <span>🏫 Cruces Aula:</span>
                <strong className="font-mono font-black">{conflictosGlobales.totalCrucesAula}</strong>
              </span>
            )}

            {conflictosGlobales.totalRegistrosConConflicto > 0 && (
              <button
                onClick={() => setFilterOnlyConflicts(!filterOnlyConflicts)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
                  filterOnlyConflicts
                    ? 'bg-rose-700 text-white hover:bg-rose-800'
                    : 'bg-white border border-rose-300 text-rose-800 hover:bg-rose-100'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{filterOnlyConflicts ? 'Ver Todos los Registros' : 'Filtrar Sólo Conflictos'}</span>
              </button>
            )}

            {/* Test Simulation Tools for Real-time Verification */}
            {simulatedConflicts.length > 0 ? (
              <button
                onClick={handleLimpiarSimulacion}
                className="px-3 py-1.5 bg-slate-800 hover:bg-black text-white rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer shadow-xs"
                title="Quitar simulación de prueba"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Quitar Prueba</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleSimularCruceDocente}
                  className="px-2.5 py-1.5 bg-white hover:bg-rose-50 text-rose-800 border border-rose-300 rounded-xl text-[11px] font-bold flex items-center gap-1 transition cursor-pointer shadow-2xs"
                  title="Simular un docente asignado a 2 aulas simultáneamente"
                >
                  <Flame className="w-3.5 h-3.5 text-rose-600" />
                  <span>🧪 Probar Cruce Docente</span>
                </button>
                <button
                  onClick={handleSimularCruceAula}
                  className="px-2.5 py-1.5 bg-white hover:bg-rose-50 text-rose-800 border border-rose-300 rounded-xl text-[11px] font-bold flex items-center gap-1 transition cursor-pointer shadow-2xs"
                  title="Simular una misma aula asignada a 2 asignaturas a la vez"
                >
                  <Flame className="w-3.5 h-3.5 text-rose-600" />
                  <span>🧪 Probar Cruce Aula</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FILTER CONTROLS BAR */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por asignatura, código, docente, aula o carrera..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>
          {(selectedBloque || selectedPiso || selectedTipoAula || selectedJornada || selectedDia || selectedCarrera || search) && (
            <button
              onClick={() => {
                setSearch('');
                setSelectedBloque('');
                setSelectedPiso('');
                setSelectedTipoAula('');
                setSelectedJornada('');
                setSelectedDia('');
                setSelectedCarrera('');
              }}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold px-2 py-1 cursor-pointer"
            >
              Limpiar filtros
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 pt-1">
          {/* Bloque */}
          <select
            value={selectedBloque}
            onChange={e => setSelectedBloque(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">Todos los Bloques</option>
            {catalogos.bloques.map(b => (
              <option key={b.id_bloque} value={b.id_bloque}>{b.nombre}</option>
            ))}
          </select>

          {/* Piso */}
          <select
            value={selectedPiso}
            onChange={e => setSelectedPiso(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">Todos los Pisos</option>
            <option value="1">Piso 1</option>
            <option value="2">Piso 2</option>
            <option value="3">Piso 3</option>
          </select>

          {/* Tipo Aula */}
          <select
            value={selectedTipoAula}
            onChange={e => setSelectedTipoAula(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">Tipo de Aula</option>
            <option value="AULA">AULA</option>
            <option value="LABORATORIO">LABORATORIO</option>
          </select>

          {/* Jornada */}
          <select
            value={selectedJornada}
            onChange={e => setSelectedJornada(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">Todas las Jornadas</option>
            {catalogos.jornadas.map(j => (
              <option key={j.id_jornada} value={j.id_jornada}>{j.nombre}</option>
            ))}
          </select>

          {/* Día */}
          <select
            value={selectedDia}
            onChange={e => setSelectedDia(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">Todos los Días</option>
            {catalogos.diasSemana.map(d => (
              <option key={d.id_dia} value={d.id_dia}>{d.nombre}</option>
            ))}
          </select>

          {/* Carrera */}
          <select
            value={selectedCarrera}
            onChange={e => setSelectedCarrera(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">Todas las Carreras</option>
            {catalogos.carreras.map(c => (
              <option key={c.id_carrera} value={c.id_carrera}>{c.nombre}</option>
            ))}
          </select>
        </div>
      </div>

      {/* VIEW CONTROLS & STATS BAR */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 px-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700">
            {filtered.length} {filtered.length === 1 ? 'asignación' : 'asignaciones'}
          </span>
          {viewMode === 'tabla' && (
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              (↔ Desliza horizontalmente para ver las 28 columnas)
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 bg-purple-50 p-1 rounded-xl border border-purple-200">
          <button
            onClick={() => setViewMode('tabla')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer min-h-[32px] ${
              viewMode === 'tabla'
                ? 'bg-[#280740] text-amber-300 shadow-xs'
                : 'text-purple-900 hover:text-purple-950'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>Tabla (28 col.)</span>
          </button>
          <button
            onClick={() => setViewMode('tarjetas')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer min-h-[32px] ${
              viewMode === 'tarjetas'
                ? 'bg-[#280740] text-amber-300 shadow-xs'
                : 'text-purple-900 hover:text-purple-950'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Tarjetas</span>
          </button>
        </div>
      </div>

      {viewMode === 'tarjetas' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
              No se encontraron asignaciones con los filtros seleccionados.
            </div>
          ) : (
            filtered.map((p) => {
              const percent = p.aula_capacidad > 0 
                ? Math.round((p.numero_estudiantes / p.aula_capacidad) * 100) 
                : 0;
              const diff = p.aula_capacidad - p.numero_estudiantes;
              const isLab = p.aula_tipo === 'LABORATORIO';
              const dates = getPeriodoDates(p.id_periodo);

              let statusIcon = '🟢';
              let statusLabel = 'Óptimo';
              let barColor = 'bg-emerald-500';
              if (percent > 100) {
                statusIcon = '🔴';
                statusLabel = 'Sobrecupo';
                barColor = 'bg-rose-500';
              } else if (percent >= 85) {
                statusIcon = '🟡';
                statusLabel = 'Alto';
                barColor = 'bg-amber-500';
              } else if (percent < 50 && percent > 0) {
                statusIcon = '🔵';
                statusLabel = 'Bajo';
                barColor = 'bg-sky-500';
              }
              const diffText = diff > 0 ? `+${diff} libres` : diff === 0 ? '0 libres' : `${Math.abs(diff)} sobrecupo`;

              const fullSede = (p.sede_nombre || 'UIO_NORTE').toUpperCase().replace(/\s*ISPADE/g, '').trim();
              const conf = conflictosGlobales.registrosPorId[p.id_planificacion];
              const hasConflict = !!conf?.tieneConflicto;

              return (
                <div 
                  key={p.id_planificacion}
                  className={`rounded-2xl transition p-3 flex flex-col justify-between gap-2.5 text-[11px] ${
                    hasConflict
                      ? 'bg-rose-50/80 border-2 border-rose-500 shadow-md shadow-rose-200 ring-2 ring-rose-300'
                      : 'bg-white border border-slate-200 shadow-xs hover:shadow-md'
                  }`}
                >
                  <div className="space-y-2">
                    {/* Alerta de Conflicto en Tiempo Real */}
                    {hasConflict && (
                      <div 
                        onClick={() => setSelectedConflictDetail(conf)}
                        className="cursor-pointer p-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold flex flex-col gap-1 shadow-sm transition animate-in fade-in"
                      >
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1 uppercase tracking-wide text-[9.5px]">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                            <span>Conflicto Horario Detectado</span>
                          </span>
                          <span className="text-[8.5px] bg-rose-800 px-1 py-0.2 rounded font-mono">Ver detalle →</span>
                        </div>
                        <p className="text-[9.5px] font-normal leading-tight text-rose-100">
                          {conf?.resumen}
                        </p>
                      </div>
                    )}

                    {/* Header: Código + Periodo + Estado */}
                    <div className="flex items-center justify-between gap-1.5 flex-wrap">
                      <span className="font-mono font-bold text-[9px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-800 border border-indigo-200">
                        {p.asignatura_codigo || 'ASIG_00'}
                      </span>
                      <div className="flex items-center gap-1">
                        {hasConflict ? (
                          <span className="px-1.5 py-0.2 rounded text-[8.5px] font-black bg-rose-600 text-white animate-pulse">
                            🚨 EN CRUCE
                          </span>
                        ) : p.curso_unificado === 1 ? (
                          <span className="px-1.5 py-0.2 rounded text-[8.5px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300">
                            🔀 UNIFICADO
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.2 rounded text-[8.5px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                            ✅ Regular
                          </span>
                        )}
                        <span className="px-1.5 py-0.2 rounded text-[8.5px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {p.estado || 'ACTIVO'}
                        </span>
                      </div>
                    </div>

                    {/* Asignatura & Carrera */}
                    <div>
                      <div className={`text-xs leading-snug ${hasConflict ? 'font-black text-rose-950' : 'font-bold text-slate-900'}`}>
                        {p.asignatura_nombre.toUpperCase()}
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium truncate mt-0.5">
                        {p.carrera_nombre.toUpperCase()} • {fullSede}
                      </div>
                    </div>

                    {/* Docente */}
                    <div className={`p-2 rounded-xl border ${
                      conf?.conflictoDocente
                        ? 'bg-rose-100 border-rose-300 text-rose-950 font-bold'
                        : 'bg-slate-50 border-slate-100'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] uppercase font-bold text-slate-400">Docente</span>
                        {conf?.conflictoDocente && (
                          <span className="text-[8.5px] font-black text-rose-700 bg-rose-200/80 px-1 py-0.2 rounded">
                            🚨 2 AULAS A LA VEZ
                          </span>
                        )}
                      </div>
                      <div className="font-bold text-slate-800 text-[10.5px] truncate">
                        {(`${p.docente_nombres} ${p.docente_apellidos}`).toUpperCase()}
                      </div>
                    </div>

                    {/* Aula & Horario */}
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div className={`p-2 rounded-xl border ${
                        conf?.conflictoAula
                          ? 'bg-rose-100 border-rose-300 text-rose-950 font-bold'
                          : 'bg-slate-50 border-slate-100'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="text-[8.5px] uppercase font-bold text-slate-400">Aula</span>
                          {conf?.conflictoAula && (
                            <span className="text-[8px] font-black text-rose-700 bg-rose-200/80 px-1 py-0.2 rounded">
                              🚨 2 MATERIAS
                            </span>
                          )}
                        </div>
                        <div className="font-bold text-slate-800 truncate">
                          {p.aula_codigo} - {p.aula_nombre || (isLab ? `LAB ${p.aula_codigo}` : `AULA ${p.aula_codigo}`)}
                        </div>
                        <div className="text-[9px] text-slate-500 truncate">
                          {(p.bloque_nombre || 'BLOQUE A').toUpperCase()} • {isLab ? 'LABORATORIO' : 'AULA'}
                        </div>
                      </div>
                      <div className={`p-2 rounded-xl border ${
                        hasConflict
                          ? 'bg-rose-100/70 border-rose-300'
                          : 'bg-slate-50 border-slate-100'
                      }`}>
                        <div className="text-[8.5px] uppercase font-bold text-slate-400">Jornada / Horario</div>
                        <div className="font-bold text-slate-800 truncate">
                          {(p.jornada_nombre || p.jornada_codigo || 'MATUTINA').toUpperCase()}
                        </div>
                        <div className={`text-[9.5px] font-mono truncate ${hasConflict ? 'text-rose-800 font-bold' : 'text-slate-600'}`}>
                          📅 {p.hora_inicio ? p.hora_inicio.replace(':', 'h') : '08h00'} a {p.hora_fin ? p.hora_fin.replace(':', 'h') : '12h00'}
                        </div>
                      </div>
                    </div>

                    {/* Aforo & Ocupación */}
                    <div className="space-y-1 p-2 bg-slate-50/80 rounded-xl border border-slate-100">
                      <div className="flex justify-between items-center text-[10px] text-slate-600 font-semibold">
                        <span>{percent}% ocupado ({diffText})</span>
                        <span className="text-[9.5px] font-bold">{statusIcon} {statusLabel}</span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${barColor}`}
                          style={{ width: `${Math.min(percent, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[9px] text-slate-400">
                        <span>Estudiantes: <strong className="text-slate-700">{p.numero_estudiantes}</strong></span>
                        <span>Capacidad: <strong className="text-slate-700">{p.aula_capacidad} puestos</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                    <span className="text-slate-500 font-medium">
                      Nivel: <strong className="text-slate-800">{p.nivel_nombre || `NIVEL ${p.id_nivel}`}</strong> (Par. {p.paralelo_codigo || 'A'})
                    </span>
                    <div className="flex items-center gap-1">
                      {user.permissions.canEditAssignment && (
                        <button
                          onClick={() => onEdit(p)}
                          className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-bold text-[10px] flex items-center gap-1 transition cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Editar</span>
                        </button>
                      )}
                      {user.permissions.canDeleteAssignment && (
                        <button
                          onClick={() => handleDelete(p.id_planificacion)}
                          disabled={deletingId === p.id_planificacion}
                          className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* TABLE OF ASSIGNMENTS WITH THE 28 REQUESTED COLUMNS */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto touch-pan-x">
            <table className="w-full text-left text-[10.5px] whitespace-nowrap border-collapse border border-slate-300">
            <thead className="bg-[#280740] text-white font-bold text-[10px] tracking-tight border-b-2 border-[#e5a800]">
              <tr>
                <th className="py-2.5 px-2 text-center w-8 border-r border-purple-900/80">#</th>
                <th className="py-2.5 px-2.5 text-center border-r border-purple-900/80">Asignar</th>
                <th className="py-2.5 px-2.5 border-r border-purple-900/80">Sede</th>
                <th className="py-2.5 px-2.5 border-r border-purple-900/80">Escuela</th>
                <th className="py-2.5 px-2.5 border-r border-purple-900/80">Carrera</th>
                <th className="py-2.5 px-2 text-center border-r border-purple-900/80">Nivel</th>
                <th className="py-2.5 px-3 border-r border-purple-900/80">Asignatura</th>
                <th className="py-2.5 px-3 border-r border-purple-900/80">Docente</th>
                <th className="py-2.5 px-2 text-center border-r border-purple-900/80">Paralelo</th>
                <th className="py-2.5 px-3 border-r border-purple-900/80">Jornada</th>
                <th className="py-2.5 px-2.5 border-r border-purple-900/80">Bloque</th>
                <th className="py-2.5 px-2 text-center border-r border-purple-900/80">Piso</th>
                <th className="py-2.5 px-3 text-center border-r border-purple-900/80">Aula / Lab.</th>
                <th className="py-2.5 px-2 text-center border-r border-purple-900/80">Capacidad del aula</th>
                <th className="py-2.5 px-2 text-center border-r border-purple-900/80">Número de estudiantes</th>
                <th className="py-2.5 px-3 border-r border-purple-900/80">Aforo / Ocupación</th>
                <th className="py-2.5 px-2 text-center border-r border-purple-900/80">Lunes</th>
                <th className="py-2.5 px-2 text-center border-r border-purple-900/80">Martes</th>
                <th className="py-2.5 px-2 text-center border-r border-purple-900/80">Miércoles</th>
                <th className="py-2.5 px-2 text-center border-r border-purple-900/80">Jueves</th>
                <th className="py-2.5 px-2 text-center border-r border-purple-900/80">Viernes</th>
                <th className="py-2.5 px-2 text-center border-r border-purple-900/80">Sábado</th>
                <th className="py-2.5 px-2 text-center border-r border-purple-900/80">Domingo</th>
                <th className="py-2.5 px-2.5 text-center border-r border-purple-900/80">Fecha inicio</th>
                <th className="py-2.5 px-2.5 text-center border-r border-purple-900/80">Fecha fin</th>
                <th className="py-2.5 px-2 text-center border-r border-purple-900/80">Total clases</th>
                <th className="py-2.5 px-3 text-center border-r border-purple-900/80">Estado / Unificado</th>
                <th className="py-2.5 px-2.5 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={28} className="py-12 text-center text-slate-400">
                    No se encontraron asignaciones con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filtered.map((p, idx) => {
                  const percent = p.aula_capacidad > 0 
                    ? Math.round((p.numero_estudiantes / p.aula_capacidad) * 100) 
                    : 0;
                  const diff = p.aula_capacidad - p.numero_estudiantes;
                  const isSobrecupo = p.numero_estudiantes > p.aula_capacidad;
                  const isLab = p.aula_tipo === 'LABORATORIO';
                  const dates = getPeriodoDates(p.id_periodo);
                  const conf = conflictosGlobales.registrosPorId[p.id_planificacion];
                  const hasConflict = !!conf?.tieneConflicto;

                  // Status badge logic
                  let statusIcon = '🟢';
                  let statusLabel = 'Óptimo';
                  let barColor = 'bg-emerald-500';
                  let textColor = 'text-emerald-700';
                  if (percent > 100) {
                    statusIcon = '🔴';
                    statusLabel = 'Sobrecupo';
                    barColor = 'bg-rose-500';
                    textColor = 'text-rose-700';
                  } else if (percent >= 85) {
                    statusIcon = '🟡';
                    statusLabel = 'Alto';
                    barColor = 'bg-amber-500';
                    textColor = 'text-amber-700';
                  } else if (percent < 50 && percent > 0) {
                    statusIcon = '🔵';
                    statusLabel = 'Bajo';
                    barColor = 'bg-sky-500';
                    textColor = 'text-sky-700';
                  }
                  const diffText = diff > 0 ? `+${diff} libres` : diff === 0 ? '0 libres' : `${Math.abs(diff)} sobrecupo`;

                  // Sede name formatted
                  const fullSede = (p.sede_nombre || 'UIO_NORTE').toUpperCase().replace(/\s*ISPADE/g, '').trim();

                  // Escuela name formatted
                  const fullEscuela = p.escuela_nombre 
                    ? (p.escuela_nombre.toUpperCase().startsWith('ESCUELA') ? p.escuela_nombre.toUpperCase() : `ESCUELA DE ${p.escuela_nombre.toUpperCase()}`)
                    : 'ESCUELA DE TECNOLOGIAS';

                  return (
                    <tr 
                      key={p.id_planificacion} 
                      className={`transition-colors ${
                        hasConflict
                          ? 'bg-rose-100/90 text-rose-950 font-semibold hover:bg-rose-200/90 border-y-2 border-rose-400 border-l-4 border-l-rose-600 shadow-2xs'
                          : p.curso_unificado === 1 ? 'bg-amber-50/20 hover:bg-sky-50/40' : 'hover:bg-sky-50/40'
                      }`}
                    >
                      {/* 1. # */}
                      <td className="py-2 px-2 text-center text-slate-500 font-bold text-[10px] border-r border-slate-200">
                        <div className="flex items-center justify-center gap-1">
                          {hasConflict && (
                            <span 
                              onClick={() => setSelectedConflictDetail(conf)}
                              className="cursor-pointer"
                              title={`🚨 REGISTRO EN CONFLICTO: ${conf.resumen}. Clic para inspeccionar.`}
                            >
                              <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600"></span>
                              </span>
                            </span>
                          )}
                          <span className={hasConflict ? 'font-black text-rose-900' : ''}>
                            {idx + 1}
                          </span>
                        </div>
                      </td>

                      {/* 2. ASIGNAR */}
                      <td className="py-2 px-2 text-center border-r border-slate-200">
                        <button
                          type="button"
                          onClick={() => onEdit(p)}
                          title={p.id_aula_laboratorio ? `Reasignar espacio/horario (${p.aula_codigo})` : "Asignar aula y horario"}
                          className="inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-[#1f0533] hover:bg-purple-900 text-[#e5a800] border border-[#e5a800]/50 shadow-2xs hover:shadow transition-all cursor-pointer whitespace-nowrap active:scale-95"
                        >
                          <CalendarCheck className="w-3 h-3 text-[#e5a800] shrink-0" />
                          <span>Asignar</span>
                        </button>
                      </td>

                      {/* 3. SEDE */}
                      <td className="py-2 px-2.5 font-bold text-slate-800 text-[10px] border-r border-slate-200">
                        {fullSede}
                      </td>

                      {/* 4. ESCUELA */}
                      <td className="py-2 px-2.5 text-slate-700 font-semibold text-[10px] border-r border-slate-200">
                        {fullEscuela}
                      </td>

                      {/* 5. CARRERA */}
                      <td className="py-2 px-2.5 font-bold text-slate-900 text-[10.5px] max-w-[180px] truncate border-r border-slate-200" title={p.carrera_nombre}>
                        {p.carrera_nombre.toUpperCase()}
                      </td>

                      {/* 6. NIVEL */}
                      <td className="py-2 px-2 text-center text-slate-800 font-bold text-[10px] border-r border-slate-200">
                        {(p.nivel_nombre || `NIVEL ${p.id_nivel}`).toUpperCase()}
                      </td>

                      {/* 7. ASIGNATURA */}
                      <td className="py-2 px-2.5 text-slate-900 max-w-[220px] border-r border-slate-200" title={p.asignatura_nombre}>
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1 flex-wrap">
                            <span className="text-[9px] font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1 py-0.2 rounded w-fit leading-none tracking-tight">
                              {p.asignatura_codigo || 'ASIG_00'}
                            </span>
                            {conf?.conflictoAula && (
                              <span 
                                onClick={() => setSelectedConflictDetail(conf)}
                                className="cursor-pointer inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-rose-600 text-white font-extrabold text-[8px] uppercase shadow-2xs animate-pulse hover:bg-rose-700"
                                title="🚨 Misma aula asignada a 2 asignaturas a la vez"
                              >
                                🚨 Cruce Aula
                              </span>
                            )}
                          </div>
                          <span className={`text-[10px] leading-tight truncate ${hasConflict ? 'font-black text-rose-950' : 'font-bold text-slate-900'}`}>
                            {p.asignatura_nombre.toUpperCase()}
                          </span>
                        </div>
                      </td>

                      {/* 8. DOCENTE */}
                      <td className="py-2 px-2.5 text-slate-800 font-bold text-[10px] border-r border-slate-200">
                        <div className="flex flex-col gap-0.5">
                          <span className={hasConflict ? 'font-black text-rose-950' : ''}>
                            {(`${p.docente_nombres} ${p.docente_apellidos}`).toUpperCase()}
                          </span>
                          {conf?.conflictoDocente && (
                            <span 
                              onClick={() => setSelectedConflictDetail(conf)}
                              className="cursor-pointer inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-rose-600 text-white font-extrabold text-[8px] uppercase shadow-2xs animate-pulse hover:bg-rose-700 w-fit"
                              title="🚨 Docente asignado a 2 aulas a la vez"
                            >
                              🚨 2 Aulas Simultáneas
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 9. PARALELO */}
                      <td className="py-2 px-2 text-center border-r border-slate-200">
                        <span className="inline-block px-1.5 py-0.2 text-[9px] font-extrabold rounded bg-slate-100 text-slate-800 border border-slate-300">
                          {p.paralelo_codigo || 'A'}
                        </span>
                      </td>

                      {/* 10. JORNADA */}
                      <td className="py-2 px-2.5 border-r border-slate-200">
                        <div className="flex flex-col gap-0.5 leading-tight">
                          <span className="font-bold text-slate-800 text-[10px]">
                            {(p.jornada_nombre || p.jornada_codigo || 'MATUTINA').toUpperCase()}
                          </span>
                          <span className={`text-[9px] font-mono flex items-center gap-0.5 whitespace-nowrap ${hasConflict ? 'text-rose-800 font-bold' : 'text-slate-500'}`}>
                            <span>📅</span>
                            <span>{p.hora_inicio ? p.hora_inicio.replace(':', 'h') : '08h00'} a {p.hora_fin ? p.hora_fin.replace(':', 'h') : '12h00'}</span>
                          </span>
                        </div>
                      </td>

                      {/* 11. BLOQUE */}
                      <td className="py-2 px-2.5 text-slate-800 font-bold text-[10px] border-r border-slate-200">
                        {(p.bloque_nombre || 'BLOQUE A').toUpperCase()}
                      </td>

                      {/* 12. PISO */}
                      <td className="py-2 px-2 text-center border-r border-slate-200">
                        <span className="inline-block px-2 py-0.5 text-[9.5px] font-bold rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                          {p.aula_piso === 0 ? 'PB' : p.aula_piso ? `Piso ${p.aula_piso}` : 'Piso 1'}
                        </span>
                      </td>

                      {/* 13. AULA / LAB. */}
                      <td className="py-2 px-2.5 text-center border-r border-slate-200">
                        <div className={`flex flex-col items-center gap-0.5 p-1 rounded-lg ${
                          conf?.conflictoAula ? 'bg-rose-200/80 border border-rose-400' : ''
                        }`}>
                          <span className={`text-[10px] leading-tight ${hasConflict ? 'font-black text-rose-950' : 'font-bold text-slate-900'}`}>
                            {p.aula_codigo} - {p.aula_nombre || (isLab ? `LAB ${p.aula_codigo}` : `AULA ${p.aula_codigo}`)}
                          </span>
                          <span className={`inline-block text-[8px] uppercase px-1.5 py-0.2 rounded font-extrabold border leading-none ${
                            isLab
                              ? 'bg-purple-100 text-purple-800 border-purple-300'
                              : 'bg-sky-100 text-sky-800 border-sky-300'
                          }`}>
                            {isLab ? 'LABORATORIO' : 'AULA'}
                          </span>
                        </div>
                      </td>

                      {/* 14. CAPACIDAD DEL AULA */}
                      <td className="py-2 px-2 text-center border-r border-slate-200">
                        <div className="flex flex-col items-center leading-none">
                          <span className="font-bold text-slate-800 text-[10.5px]">{p.aula_capacidad}</span>
                          <span className="text-[8px] text-slate-400 font-medium mt-0.5">puestos</span>
                        </div>
                      </td>

                      {/* 15. NÚMERO DE ESTUDIANTES */}
                      <td className="py-2 px-2 text-center font-extrabold text-slate-900 text-[10.5px] border-r border-slate-200">
                        {p.numero_estudiantes}
                      </td>

                      {/* 16. AFORO / OCUPACIÓN */}
                      <td className="py-2 px-2.5 border-r border-slate-200">
                        <div className="flex flex-col gap-1 min-w-[110px] text-[9.5px]">
                          <div className="flex items-center justify-between gap-1 leading-none">
                            <span className={`font-bold ${textColor}`}>{percent}% ocupado</span>
                            <span className="text-slate-400 font-mono text-[8.5px]">{diffText}</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className={`h-1.5 rounded-full transition-all ${barColor}`}
                              style={{ width: `${Math.min(percent, 100)}%` }}
                            />
                          </div>
                          <div className="flex items-center gap-1 text-[9px] font-bold text-slate-700 leading-none">
                            <span>{statusIcon}</span>
                            <span>{statusLabel}</span>
                          </div>
                        </div>
                      </td>

                      {/* 17. LUNES */}
                      <td className="py-2 px-2 text-center border-r border-slate-200">
                        {renderScheduleCell(p, 1, 'LUN')}
                      </td>

                      {/* 18. MARTES */}
                      <td className="py-2 px-2 text-center border-r border-slate-200">
                        {renderScheduleCell(p, 2, 'MAR')}
                      </td>

                      {/* 19. MIÉRCOLES */}
                      <td className="py-2 px-2 text-center border-r border-slate-200">
                        {renderScheduleCell(p, 3, 'MIE')}
                      </td>

                      {/* 20. JUEVES */}
                      <td className="py-2 px-2 text-center border-r border-slate-200">
                        {renderScheduleCell(p, 4, 'JUE')}
                      </td>

                      {/* 21. VIERNES */}
                      <td className="py-2 px-2 text-center border-r border-slate-200">
                        {renderScheduleCell(p, 5, 'VIE')}
                      </td>

                      {/* 22. SÁBADO */}
                      <td className="py-2 px-2 text-center border-r border-slate-200">
                        {renderScheduleCell(p, 6, 'SAB')}
                      </td>

                      {/* 23. DOMINGO */}
                      <td className="py-2 px-2 text-center border-r border-slate-200">
                        {renderScheduleCell(p, 7, 'DOM')}
                      </td>

                      {/* 24. FECHA INICIO */}
                      <td className="py-2 px-2.5 text-slate-600 font-mono text-[9.5px] text-center border-r border-slate-200">
                        {dates.inicio}
                      </td>

                      {/* 25. FECHA FIN */}
                      <td className="py-2 px-2.5 text-slate-600 font-mono text-[9.5px] text-center border-r border-slate-200">
                        {dates.fin}
                      </td>

                      {/* 26. TOTAL CLASES */}
                      <td className="py-2 px-2 text-center font-bold text-slate-800 text-[10px] border-r border-slate-200">
                        {p.total_clases || 16}
                      </td>

                      {/* 27. ESTADO / UNIFICADO */}
                      <td className="py-2 px-2.5 text-center border-r border-slate-200">
                        <div className="flex items-center justify-center">
                          {hasConflict ? (
                            <span 
                              onClick={() => setSelectedConflictDetail(conf)}
                              className="cursor-pointer inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[8.5px] font-black bg-rose-600 text-white border border-rose-700 shadow-xs uppercase tracking-wider animate-pulse hover:bg-rose-700 transition"
                              title={`🚨 CLIC PARA VER CONFLICTO: ${conf.resumen}`}
                            >
                              <span>🚨</span>
                              <span>Cruce Horario</span>
                            </span>
                          ) : p.curso_unificado === 1 ? (
                            <span 
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[8.5px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 whitespace-nowrap"
                              title={`Curso unificado: ${p.unificada_asignatura || p.unificada_carrera || 'Sección unificada'}`}
                            >
                              <span>🔀</span>
                              <span>Unificado {p.unificada_carrera ? `(${p.unificada_carrera})` : ''}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[8.5px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 whitespace-nowrap">
                              <span>✅</span>
                              <span>Regular (Sin Duplicado)</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 28. ACCIONES */}
                      <td className="py-2 px-2 text-center">
                        <div className="flex items-center justify-center gap-0.5">
                          {user.permissions.canEditAssignment && (
                            <button
                              onClick={() => onEdit(p)}
                              title="Editar Asignación"
                              className="p-1 hover:bg-indigo-50 rounded-md text-slate-500 hover:text-indigo-600 transition cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {user.permissions.canDeleteAssignment && (
                            <button
                              onClick={() => handleDelete(p.id_planificacion)}
                              disabled={deletingId === p.id_planificacion}
                              title="Eliminar Asignación"
                              className="p-1 hover:bg-rose-50 rounded-md text-slate-400 hover:text-rose-600 transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* MODAL INSPECTOR DE CONFLICTO EN TIEMPO REAL */}
      {selectedConflictDetail && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-5 border-2 border-rose-500 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-rose-200">
              <div className="flex items-center gap-2 text-rose-900">
                <ShieldAlert className="w-6 h-6 text-rose-600 animate-pulse shrink-0" />
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider">
                    Inspector de Conflicto en Tiempo Real
                  </h3>
                  <p className="text-xs text-rose-700 font-medium">
                    {selectedConflictDetail.resumen}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedConflictDetail(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Asignación Actual en Conflicto */}
            <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-200 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-rose-900">
                <span>Ficha Académica #{selectedConflictDetail.planificacion.id_planificacion}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-600 text-white font-extrabold uppercase">
                  Registro Analizado
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white p-2 rounded-lg border border-rose-100">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Asignatura</span>
                  <strong className="text-slate-900 block truncate">
                    {selectedConflictDetail.planificacion.asignatura_nombre}
                  </strong>
                  <span className="text-[10px] text-indigo-700 font-mono">
                    [{selectedConflictDetail.planificacion.asignatura_codigo}]
                  </span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-rose-100">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Docente</span>
                  <strong className="text-slate-900 block truncate">
                    {selectedConflictDetail.planificacion.docente_nombres} {selectedConflictDetail.planificacion.docente_apellidos}
                  </strong>
                </div>
                <div className="bg-white p-2 rounded-lg border border-rose-100">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Aula / Bloque</span>
                  <strong className="text-slate-900 block truncate">
                    {selectedConflictDetail.planificacion.aula_codigo} - {selectedConflictDetail.planificacion.aula_nombre}
                  </strong>
                </div>
                <div className="bg-white p-2 rounded-lg border border-rose-100">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Día y Horario</span>
                  <strong className="text-slate-900 block">
                    {selectedConflictDetail.planificacion.dia_nombre}: {selectedConflictDetail.planificacion.hora_inicio} - {selectedConflictDetail.planificacion.hora_fin}
                  </strong>
                </div>
              </div>
            </div>

            {/* Cruces Específicos Detectados */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Detalle de Colisiones Horarias:
              </span>
              {selectedConflictDetail.detallesCruces.map((c, i) => (
                <div key={i} className="p-3 bg-white border border-rose-300 rounded-xl shadow-2xs space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="flex items-center gap-1.5 text-rose-800">
                      <AlertOctagon className="w-4 h-4 text-rose-600" />
                      {c.tipo === 'CRUCE_DOCENTE' 
                        ? '🚨 DOCENTE ASIGNADO A 2 AULAS SIMULTÁNEAMENTE' 
                        : '🚨 MISMA AULA CON 2 ASIGNATURAS SIMULTÁNEAMENTE'}
                    </span>
                  </div>
                  <p className="text-xs text-rose-950 font-medium">
                    {c.mensaje}
                  </p>
                  <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Registro colisionante ID: <strong className="text-slate-800 font-mono">#{c.conRegistroId}</strong></span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const colisionante = allPlanificaciones.find(p => p.id_planificacion === c.conRegistroId);
                          if (colisionante) {
                            setSelectedConflictDetail(null);
                            onEdit(colisionante);
                          }
                        }}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-[10px] transition cursor-pointer"
                      >
                        Editar #{c.conRegistroId}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Acciones de Resolución */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => setSelectedConflictDetail(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cerrar Inspector
              </button>

              <button
                onClick={() => {
                  const plan = selectedConflictDetail.planificacion;
                  setSelectedConflictDetail(null);
                  onEdit(plan);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-md flex items-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Modificar Horario de Esta Asignación</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE ASIGNACIÓN AUTOMÁTICA */}
      <ModalAsignacionAutomatica
        isOpen={isAutoAssignModalOpen}
        onClose={() => setIsAutoAssignModalOpen(false)}
        catalogos={catalogos}
        aulas={aulas}
        planificaciones={planificaciones}
        onSuccess={() => {
          onRefresh();
          if (onRefreshAulas) onRefreshAulas();
        }}
        onRefreshAulas={onRefreshAulas}
      />
    </div>
  );
};
