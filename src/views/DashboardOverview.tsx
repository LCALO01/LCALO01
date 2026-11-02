import React, { useState } from 'react';
import { Catalogos, AulaLaboratorio, PlanificacionCompleta } from '../types.ts';
import { KpiDetailModal, KpiCardType } from '../components/KpiDetailModal.tsx';
import { 
  Calendar,
  Building, 
  Users, 
  BookOpen, 
  GraduationCap, 
  Layers, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Shield, 
  TrendingUp,
  Plus,
  ChevronRight
} from 'lucide-react';

interface DashboardOverviewProps {
  catalogos: Catalogos;
  aulas: AulaLaboratorio[];
  planificaciones: PlanificacionCompleta[];
  onNavigate: (tab: string, subTab?: string) => void;
  onOpenNewModal: () => void;
  onSelectPlan?: (plan: PlanificacionCompleta) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  catalogos,
  aulas,
  planificaciones,
  onNavigate,
  onOpenNewModal,
  onSelectPlan
}) => {
  const [selectedKpi, setSelectedKpi] = useState<KpiCardType | null>(null);

  // Calculations
  const totalAulas = aulas.length || 40;
  const occupiedAulaIds = new Set(planificaciones.map(p => p.id_aula_laboratorio));
  const aulasOcupadasCount = occupiedAulaIds.size;
  const aulasDisponiblesCount = Math.max(0, totalAulas - aulasOcupadasCount);

  const uniqueDocentes = new Set(planificaciones.map(p => p.id_docente));
  const docentesAsignadosCount = uniqueDocentes.size;
  const totalDocentes = catalogos.docentes.length || 50;

  const totalAsignaturas = catalogos.asignaturas.length || 65;
  const totalCarreras = catalogos.carreras.length || 14;
  const cursosUnificadosCount = planificaciones.filter(p => p.curso_unificado === 1).length;

  // Weekly hours calculated from planificaciones
  const calculateHours = (p: PlanificacionCompleta) => {
    try {
      const [hIni, mIni] = p.hora_inicio.split(':').map(Number);
      const [hFin, mFin] = p.hora_fin.split(':').map(Number);
      const diff = (hFin + mFin / 60) - (hIni + mIni / 60);
      return Math.max(1, Math.round(diff));
    } catch {
      return 2;
    }
  };

  const totalHorasSemanales = planificaciones.reduce((acc, p) => acc + calculateHours(p), 0) || 30;
  const totalEstudiantes = planificaciones.reduce((acc, p) => acc + (p.numero_estudiantes || 0), 0) || 228;

  // Sobrecupos: cases where students > classroom capacity
  const sobrecuposCount = planificaciones.filter(p => p.numero_estudiantes > p.aula_capacidad).length;

  const usuariosCount = catalogos.usuarios?.length || 4;
  const tasaOcupacion = totalAulas > 0 ? Math.round((aulasOcupadasCount / totalAulas) * 100) : 15;

  // Block distribution calculations
  const blockStats = [
    { key: 'A', name: 'BLOQUE A', filterMatch: (c: string, n: string) => c.includes('A') || n.includes('A') },
    { key: 'B', name: 'BLOQUE B', filterMatch: (c: string, n: string) => c.includes('B') || n.includes('B') },
    { key: 'C', name: 'BLOQUE C', filterMatch: (c: string, n: string) => c.includes('C') || n.includes('C') },
    { key: 'E', name: 'BLOQUE E (TALLERES)', filterMatch: (c: string, n: string) => c.includes('E') || n.includes('E') || n.toLowerCase().includes('taller') },
  ].map(b => {
    const plansInBlock = planificaciones.filter(p => 
      b.filterMatch(p.bloque_codigo || '', p.bloque_nombre || '')
    );
    const hours = plansInBlock.reduce((acc, p) => acc + calculateHours(p), 0);
    const percentage = totalHorasSemanales > 0 ? Math.round((hours / totalHorasSemanales) * 100) : 0;
    return {
      name: b.name,
      hours,
      plansCount: plansInBlock.length,
      percentage
    };
  });

  return (
    <div className="space-y-5">
      
      {/* Top Banner: Panel de Control General + Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Panel de Control General
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Resumen operacional del{' '}
            <span className="text-[#280740] bg-amber-100 border border-amber-300 px-2 py-0.5 rounded font-bold">
              PERIODO ACADÉMICO 2026-1
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            onClick={() => onNavigate('catalogos')}
            className="flex items-center gap-2 bg-[#350854] hover:bg-[#4a0e78] text-amber-300 border border-amber-400/40 px-3.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold shadow-xs transition cursor-pointer"
          >
            <Layers className="w-4 h-4 text-amber-400" />
            <span>Módulo Catálogos (CRUDs)</span>
          </button>

          <button
            onClick={onOpenNewModal}
            className="flex items-center gap-2 bg-[#e5a800] hover:bg-[#d97706] text-[#280740] border border-amber-300 px-3.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-black shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#280740]" />
            <span>Nueva Planificación</span>
          </button>

          <button
            onClick={() => onNavigate('gestion_aulas', 'matriz')}
            className="flex items-center gap-2 bg-white hover:bg-purple-50 text-[#350854] border border-purple-300 px-3.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold shadow-xs transition cursor-pointer"
          >
            <Clock className="w-4 h-4 text-[#350854]" />
            <span>Ver Horarios</span>
          </button>
        </div>
      </div>

      {/* 12 Colorful KPI Cards Grid (4 columns x 3 rows) - All interactive to visualize data */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* 1. PLANIFICACIONES (Morado Institucional con borde Amarillo) */}
        <button
          type="button"
          onClick={() => setSelectedKpi('planificaciones')}
          className="group text-left bg-[#350854] hover:bg-[#450b6d] border-b-4 border-[#e5a800] rounded-xl p-4 text-white shadow-xs hover:shadow-md flex items-center justify-between relative overflow-hidden transition-all duration-200 cursor-pointer hover:scale-[1.015] active:scale-[0.99] focus:outline-hidden"
          title="Ver detalle de todas las planificaciones del periodo"
        >
          <div className="z-10">
            <div className="text-[11px] font-bold tracking-wider uppercase opacity-90 text-amber-300">
              PLANIFICACIONES
            </div>
            <div className="text-3xl font-black my-0.5 leading-none">
              {planificaciones.length}
            </div>
            <div className="text-xs opacity-85 flex items-center gap-1 text-purple-200">
              <span>Cursos activos periodo</span>
              <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
          <div className="w-11 h-11 rounded-lg bg-white/15 border border-white/20 flex items-center justify-center shrink-0 group-hover:bg-white/25 transition">
            <Calendar className="w-6 h-6 text-amber-300" />
          </div>
        </button>

        {/* 2. AULAS OCUPADAS (Coral Red) */}
        <button
          type="button"
          onClick={() => setSelectedKpi('aulas_ocupadas')}
          className="group text-left bg-[#e74c3c] hover:bg-[#d63b2a] rounded-xl p-4 text-white shadow-xs hover:shadow-md flex items-center justify-between relative overflow-hidden transition-all duration-200 cursor-pointer hover:scale-[1.015] active:scale-[0.99] focus:outline-hidden"
          title="Ver detalle de aulas ocupadas y clases asignadas"
        >
          <div className="z-10">
            <div className="text-[11px] font-bold tracking-wider uppercase opacity-90">
              AULAS OCUPADAS
            </div>
            <div className="text-3xl font-black my-0.5 leading-none">
              {aulasOcupadasCount}
            </div>
            <div className="text-xs opacity-85 flex items-center gap-1">
              <span>De {totalAulas} aulas registradas</span>
              <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
          <div className="w-11 h-11 rounded-lg bg-white/15 border border-white/20 flex items-center justify-center shrink-0 group-hover:bg-white/25 transition">
            <Building className="w-6 h-6 text-white" />
          </div>
        </button>

        {/* 3. DOCENTES ASIGNADOS (Green) */}
        <button
          type="button"
          onClick={() => setSelectedKpi('docentes_asignados')}
          className="group text-left bg-[#2ecc71] hover:bg-[#27ae60] rounded-xl p-4 text-white shadow-xs hover:shadow-md flex items-center justify-between relative overflow-hidden transition-all duration-200 cursor-pointer hover:scale-[1.015] active:scale-[0.99] focus:outline-hidden"
          title="Ver lista de docentes con carga horaria"
        >
          <div className="z-10">
            <div className="text-[11px] font-bold tracking-wider uppercase opacity-90">
              DOCENTES ASIGNADOS
            </div>
            <div className="text-3xl font-black my-0.5 leading-none">
              {docentesAsignadosCount}
            </div>
            <div className="text-xs opacity-85 flex items-center gap-1">
              <span>De {totalDocentes} disponibles</span>
              <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
          <div className="w-11 h-11 rounded-lg bg-white/15 border border-white/20 flex items-center justify-center shrink-0 group-hover:bg-white/25 transition">
            <Users className="w-6 h-6 text-white" />
          </div>
        </button>

        {/* 4. ASIGNATURAS ACTIVAS (Purple) */}
        <button
          type="button"
          onClick={() => setSelectedKpi('asignaturas_activas')}
          className="group text-left bg-[#8e44ad] hover:bg-[#7d3c98] rounded-xl p-4 text-white shadow-xs hover:shadow-md flex items-center justify-between relative overflow-hidden transition-all duration-200 cursor-pointer hover:scale-[1.015] active:scale-[0.99] focus:outline-hidden"
          title="Ver catálogo de 65 asignaturas activas"
        >
          <div className="z-10">
            <div className="text-[11px] font-bold tracking-wider uppercase opacity-90">
              ASIGNATURAS ACTIVAS
            </div>
            <div className="text-3xl font-black my-0.5 leading-none">
              {totalAsignaturas}
            </div>
            <div className="text-xs opacity-85 flex items-center gap-1">
              <span>Catálogo general</span>
              <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
          <div className="w-11 h-11 rounded-lg bg-white/15 border border-white/20 flex items-center justify-center shrink-0 group-hover:bg-white/25 transition">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
        </button>

        {/* 5. CARRERAS VIGENTES (Teal) */}
        <button
          type="button"
          onClick={() => setSelectedKpi('carreras_vigentes')}
          className="group text-left bg-[#1abc9c] hover:bg-[#16a085] rounded-xl p-4 text-white shadow-xs hover:shadow-md flex items-center justify-between relative overflow-hidden transition-all duration-200 cursor-pointer hover:scale-[1.015] active:scale-[0.99] focus:outline-hidden"
          title="Ver oferta académica de 14 carreras"
        >
          <div className="z-10">
            <div className="text-[11px] font-bold tracking-wider uppercase opacity-90">
              CARRERAS VIGENTES
            </div>
            <div className="text-3xl font-black my-0.5 leading-none">
              {totalCarreras}
            </div>
            <div className="text-xs opacity-85 flex items-center gap-1">
              <span>Oferta académica sede</span>
              <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
          <div className="w-11 h-11 rounded-lg bg-white/15 border border-white/20 flex items-center justify-center shrink-0 group-hover:bg-white/25 transition">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
        </button>

        {/* 6. CURSOS UNIFICADOS (Lime Green) */}
        <button
          type="button"
          onClick={() => setSelectedKpi('cursos_unificados')}
          className="group text-left bg-[#8bc34a] hover:bg-[#7cb342] rounded-xl p-4 text-white shadow-xs hover:shadow-md flex items-center justify-between relative overflow-hidden transition-all duration-200 cursor-pointer hover:scale-[1.015] active:scale-[0.99] focus:outline-hidden"
          title="Ver cursos compartidos y unificados"
        >
          <div className="z-10">
            <div className="text-[11px] font-bold tracking-wider uppercase opacity-90">
              CURSOS UNIFICADOS
            </div>
            <div className="text-3xl font-black my-0.5 leading-none">
              {cursosUnificadosCount}
            </div>
            <div className="text-xs opacity-85 flex items-center gap-1">
              <span>Cursos compartidos</span>
              <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
          <div className="w-11 h-11 rounded-lg bg-white/15 border border-white/20 flex items-center justify-center shrink-0 group-hover:bg-white/25 transition">
            <Layers className="w-6 h-6 text-white" />
          </div>
        </button>

        {/* 7. HORAS SEMANALES (Orange / Amber) */}
        <button
          type="button"
          onClick={() => setSelectedKpi('horas_semanales')}
          className="group text-left bg-[#f39c12] hover:bg-[#e67e22] rounded-xl p-4 text-white shadow-xs hover:shadow-md flex items-center justify-between relative overflow-hidden transition-all duration-200 cursor-pointer hover:scale-[1.015] active:scale-[0.99] focus:outline-hidden"
          title="Ver distribución de carga horaria semanal por día"
        >
          <div className="z-10">
            <div className="text-[11px] font-bold tracking-wider uppercase opacity-90">
              HORAS SEMANALES
            </div>
            <div className="text-3xl font-black my-0.5 leading-none">
              {totalHorasSemanales}h
            </div>
            <div className="text-xs opacity-85 flex items-center gap-1">
              <span>Carga horaria dictada</span>
              <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
          <div className="w-11 h-11 rounded-lg bg-white/15 border border-white/20 flex items-center justify-center shrink-0 group-hover:bg-white/25 transition">
            <Clock className="w-6 h-6 text-white" />
          </div>
        </button>

        {/* 8. AULAS DISPONIBLES (Slate Blue) */}
        <button
          type="button"
          onClick={() => setSelectedKpi('aulas_disponibles')}
          className="group text-left bg-[#546e7a] hover:bg-[#455a64] rounded-xl p-4 text-white shadow-xs hover:shadow-md flex items-center justify-between relative overflow-hidden transition-all duration-200 cursor-pointer hover:scale-[1.015] active:scale-[0.99] focus:outline-hidden"
          title="Ver aulas libres disponibles para asignar"
        >
          <div className="z-10">
            <div className="text-[11px] font-bold tracking-wider uppercase opacity-90">
              AULAS DISPONIBLES
            </div>
            <div className="text-3xl font-black my-0.5 leading-none">
              {aulasDisponiblesCount}
            </div>
            <div className="text-xs opacity-85 flex items-center gap-1">
              <span>Capacidad libre para asignar</span>
              <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
          <div className="w-11 h-11 rounded-lg bg-white/15 border border-white/20 flex items-center justify-center shrink-0 group-hover:bg-white/25 transition">
            <CheckCircle2 className="w-6 h-6 text-white" />
          </div>
        </button>

        {/* 9. SOBRECUPOS / ALERTAS (Coral Red) */}
        <button
          type="button"
          onClick={() => setSelectedKpi('sobrecupos_alertas')}
          className="group text-left bg-[#e74c3c] hover:bg-[#d63b2a] rounded-xl p-4 text-white shadow-xs hover:shadow-md flex items-center justify-between relative overflow-hidden transition-all duration-200 cursor-pointer hover:scale-[1.015] active:scale-[0.99] focus:outline-hidden"
          title="Ver auditoría de capacidad y alertas de aforo"
        >
          <div className="z-10">
            <div className="text-[11px] font-bold tracking-wider uppercase opacity-90">
              SOBRECUPOS / ALERTAS
            </div>
            <div className="text-3xl font-black my-0.5 leading-none">
              {sobrecuposCount}
            </div>
            <div className="text-xs opacity-85 flex items-center gap-1">
              <span>Aulas excedidas en cupo</span>
              <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
          <div className="w-11 h-11 rounded-lg bg-white/15 border border-white/20 flex items-center justify-center shrink-0 group-hover:bg-white/25 transition">
            <AlertTriangle className="w-6 h-6 text-white" />
          </div>
        </button>

        {/* 10. ESTUDIANTES ASIGNADOS (Cyan) */}
        <button
          type="button"
          onClick={() => setSelectedKpi('estudiantes_asignados')}
          className="group text-left bg-[#00bcd4] hover:bg-[#00acc1] rounded-xl p-4 text-white shadow-xs hover:shadow-md flex items-center justify-between relative overflow-hidden transition-all duration-200 cursor-pointer hover:scale-[1.015] active:scale-[0.99] focus:outline-hidden"
          title="Ver lista y distribución de estudiantes en cursos"
        >
          <div className="z-10">
            <div className="text-[11px] font-bold tracking-wider uppercase opacity-90">
              ESTUDIANTES ASIGNADOS
            </div>
            <div className="text-3xl font-black my-0.5 leading-none">
              {totalEstudiantes}
            </div>
            <div className="text-xs opacity-85 flex items-center gap-1">
              <span>En cursos del periodo</span>
              <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
          <div className="w-11 h-11 rounded-lg bg-white/15 border border-white/20 flex items-center justify-center shrink-0 group-hover:bg-white/25 transition">
            <Users className="w-6 h-6 text-white" />
          </div>
        </button>

        {/* 11. USUARIOS REGISTRADOS (Magenta Pink) */}
        <button
          type="button"
          onClick={() => setSelectedKpi('usuarios_registrados')}
          className="group text-left bg-[#e91e63] hover:bg-[#d81b60] rounded-xl p-4 text-white shadow-xs hover:shadow-md flex items-center justify-between relative overflow-hidden transition-all duration-200 cursor-pointer hover:scale-[1.015] active:scale-[0.99] focus:outline-hidden"
          title="Ver cuentas de usuarios y roles en el sistema"
        >
          <div className="z-10">
            <div className="text-[11px] font-bold tracking-wider uppercase opacity-90">
              USUARIOS REGISTRADOS
            </div>
            <div className="text-3xl font-black my-0.5 leading-none">
              {usuariosCount}
            </div>
            <div className="text-xs opacity-85 flex items-center gap-1">
              <span>Con permisos en el sistema</span>
              <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
          <div className="w-11 h-11 rounded-lg bg-white/15 border border-white/20 flex items-center justify-center shrink-0 group-hover:bg-white/25 transition">
            <Shield className="w-6 h-6 text-white" />
          </div>
        </button>

        {/* 12. TASA OCUPACIÓN FÍSICA (Violet) */}
        <button
          type="button"
          onClick={() => setSelectedKpi('tasa_ocupacion')}
          className="group text-left bg-[#9c27b0] hover:bg-[#8e24aa] rounded-xl p-4 text-white shadow-xs hover:shadow-md flex items-center justify-between relative overflow-hidden transition-all duration-200 cursor-pointer hover:scale-[1.015] active:scale-[0.99] focus:outline-hidden"
          title="Ver análisis de ocupación física por bloques"
        >
          <div className="z-10">
            <div className="text-[11px] font-bold tracking-wider uppercase opacity-90">
              TASA OCUPACIÓN FÍSICA
            </div>
            <div className="text-3xl font-black my-0.5 leading-none">
              {tasaOcupacion}%
            </div>
            <div className="text-xs opacity-85 flex items-center gap-1">
              <span>Uso de infraestructura</span>
              <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
          <div className="w-11 h-11 rounded-lg bg-white/15 border border-white/20 flex items-center justify-center shrink-0 group-hover:bg-white/25 transition">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
        </button>

      </div>

      {/* DISTRIBUTION CARD: DISTRIBUCIÓN DE HORAS Y CURSOS POR BLOQUE ARQUITECTÓNICO */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
          <div>
            <h3 className="text-sm font-black text-slate-800 tracking-wider uppercase">
              DISTRIBUCIÓN DE HORAS Y CURSOS POR BLOQUE ARQUITECTÓNICO
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Haz clic en cualquier métrica para auditar sus asignaciones y capacidad libre.
            </p>
          </div>
          <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md font-mono self-start sm:self-auto border border-slate-200">
            Sede: UIO_NORTE (QUITO)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {blockStats.map((b, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setSelectedKpi('tasa_ocupacion')}
              className="text-left space-y-2 p-2.5 rounded-xl hover:bg-slate-50 transition cursor-pointer group"
            >
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-800 group-hover:text-[#350854] transition">{b.name}</span>
                <span className={b.hours > 0 ? 'text-[#350854] font-bold' : 'text-slate-400'}>
                  {b.hours} hrs
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    b.hours > 0 ? 'bg-[#350854]' : 'bg-slate-200'
                  }`}
                  style={{ width: `${Math.max(b.percentage, b.hours > 0 ? 5 : 0)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>{b.plansCount} planificaciones</span>
                <span>{b.percentage}% total</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* KPI Detail Modal rendering all information when clicking any card */}
      {selectedKpi && (
        <KpiDetailModal
          type={selectedKpi}
          onClose={() => setSelectedKpi(null)}
          catalogos={catalogos}
          aulas={aulas}
          planificaciones={planificaciones}
          onNavigateToGestion={(subTab) => {
            setSelectedKpi(null);
            onNavigate('gestion_aulas', subTab);
          }}
          onSelectPlan={onSelectPlan}
        />
      )}

    </div>
  );
};
