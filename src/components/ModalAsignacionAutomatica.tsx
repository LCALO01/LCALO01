import React, { useState } from 'react';
import { 
  Wand2, 
  Sparkles, 
  CheckCircle2, 
  X, 
  Building2, 
  Users, 
  Layers, 
  Maximize2, 
  AlertTriangle,
  RotateCw,
  Search,
  Filter,
  Check,
  Calendar,
  Clock,
  Briefcase
} from 'lucide-react';
import { Catalogos, AulaLaboratorio, PlanificacionCompleta } from '../types.ts';
import { ApiClient } from '../controllers/apiClient.ts';

interface ModalAsignacionAutomaticaProps {
  isOpen: boolean;
  onClose: () => void;
  catalogos: Catalogos;
  aulas: AulaLaboratorio[];
  planificaciones: PlanificacionCompleta[];
  onSuccess: () => void;
  onRefreshAulas?: () => void;
}

export const ModalAsignacionAutomatica: React.FC<ModalAsignacionAutomaticaProps> = ({
  isOpen,
  onClose,
  catalogos,
  aulas,
  planificaciones,
  onSuccess,
  onRefreshAulas
}) => {
  const [selectedPeriodo, setSelectedPeriodo] = useState<number>(
    catalogos.periodos[0]?.id_periodo || 1
  );
  const [selectedSede, setSelectedSede] = useState<string>('TODAS');
  const [selectedCarrera, setSelectedCarrera] = useState<string>('TODAS');
  const [loading, setLoading] = useState<boolean>(false);
  const [applying, setApplying] = useState<boolean>(false);
  const [results, setResults] = useState<any[] | null>(null);
  const [resumen, setResumen] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterCarreraResults, setFilterCarreraResults] = useState<string>('TODAS');
  const [appliedSuccess, setAppliedSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentPeriodoObj = catalogos.periodos.find(p => p.id_periodo === selectedPeriodo);
  const fechaInicioDefault = currentPeriodoObj?.fecha_inicio || '2026-03-01';
  const fechaFinDefault = currentPeriodoObj?.fecha_fin || '2026-08-31';

  const handleSimular = async () => {
    setLoading(true);
    setAppliedSuccess(false);
    try {
      const resp = await ApiClient.asignacionAutomatica({
        id_periodo: selectedPeriodo,
        id_carrera: selectedCarrera !== 'TODAS' ? Number(selectedCarrera) : undefined,
        id_sede: selectedSede !== 'TODAS' ? Number(selectedSede) : undefined,
        simulacion: true
      });
      if (resp.success) {
        setResults(resp.data);
        setResumen(resp.resumen);
      }
    } catch (err: any) {
      alert('Error en simulación: ' + (err.message || 'Error de conexión'));
    } finally {
      setLoading(false);
    }
  };

  const handleAplicar = async () => {
    setApplying(true);
    try {
      const resp = await ApiClient.asignacionAutomatica({
        id_periodo: selectedPeriodo,
        id_carrera: selectedCarrera !== 'TODAS' ? Number(selectedCarrera) : undefined,
        id_sede: selectedSede !== 'TODAS' ? Number(selectedSede) : undefined,
        simulacion: false
      });
      if (resp.success) {
        setResults(resp.data);
        setResumen(resp.resumen);
        setAppliedSuccess(true);
        if (onRefreshAulas) onRefreshAulas();
        onSuccess();
      }
    } catch (err: any) {
      alert('Error al aplicar asignación: ' + (err.message || 'Error de conexión'));
    } finally {
      setApplying(false);
    }
  };

  // Filtrado de la tabla de resultados
  const filteredRows = (results || []).filter(item => {
    const matchesSearch = 
      item.asignatura_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.carrera_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.aula_codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${item.docente_nombres} ${item.docente_apellidos}`.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCarrera = filterCarreraResults === 'TODAS' || String(item.carrera_nombre) === filterCarreraResults;
    return matchesSearch && matchesCarrera;
  });

  // Lista única de carreras presentes en resultados
  const uniqueCarrerasResults = Array.from(
    new Set((results || []).map(r => r.carrera_nombre).filter(Boolean))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-3 md:p-6 overflow-y-auto">
      <div className="relative w-full max-w-7xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight">
                  Motor de Asignación Automática de Aulas y Laboratorios
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Algoritmo de Optimización
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Organización de aulas por carrera, validación estricta de aforo por número de estudiantes y compatibilidad unificada sin cruces.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Configuration & Rules Panel */}
        <div className="p-5 bg-slate-50 border-b border-slate-200 space-y-4 shrink-0">
          {/* Active Rules Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs flex items-start gap-2.5">
              <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 mt-0.5">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Organización por Carrera</p>
                <p className="text-[11px] text-slate-500">Agrupa aulas y bloques por afinidad de carrera y laboratorios técnicos.</p>
              </div>
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs flex items-start gap-2.5">
              <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 mt-0.5">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Ajuste de Capacidad / Aforo</p>
                <p className="text-[11px] text-slate-500">Garantiza Capacidad &ge; N° Estudiantes minimizando puestos ociosos.</p>
              </div>
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs flex items-start gap-2.5">
              <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600 mt-0.5">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Unificadas: No es Cruce</p>
                <p className="text-[11px] text-slate-500">Materia unificada comparte aula y horario legítimamente sin conflicto.</p>
              </div>
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs flex items-start gap-2.5">
              <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600 mt-0.5">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Aulas Usadas &rarr; Ocupadas</p>
                <p className="text-[11px] text-slate-500">Las aulas con clases asignadas pasan automáticamente a estado OCUPADO.</p>
              </div>
            </div>
          </div>

          {/* Form Controls */}
          <div className="flex flex-wrap items-end gap-3 pt-1">
            <div className="flex-1 min-w-[180px]">
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Periodo Académico
              </label>
              <select
                value={selectedPeriodo}
                onChange={e => setSelectedPeriodo(Number(e.target.value))}
                className="w-full h-9 px-3 text-xs bg-white border border-slate-300 rounded-lg font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              >
                {catalogos.periodos.map(p => (
                  <option key={p.id_periodo} value={p.id_periodo}>
                    {p.codigo} - {p.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1 min-w-[160px]">
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Sede
              </label>
              <select
                value={selectedSede}
                onChange={e => setSelectedSede(e.target.value)}
                className="w-full h-9 px-3 text-xs bg-white border border-slate-300 rounded-lg font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              >
                <option value="TODAS">Todas las Sedes</option>
                {catalogos.sedes.map(s => (
                  <option key={s.id_sede} value={s.id_sede}>
                    {s.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1 min-w-[220px]">
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Carrera
              </label>
              <select
                value={selectedCarrera}
                onChange={e => setSelectedCarrera(e.target.value)}
                className="w-full h-9 px-3 text-xs bg-white border border-slate-300 rounded-lg font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              >
                <option value="TODAS">Todas las Carreras (Global)</option>
                {catalogos.carreras.map(c => (
                  <option key={c.id_carrera} value={c.id_carrera}>
                    {c.codigo} - {c.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSimular}
                disabled={loading || applying}
                className="h-9 px-4 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-sky-600' : ''}`} />
                <span>{loading ? 'Simulando...' : 'Simular Asignación'}</span>
              </button>

              <button
                type="button"
                onClick={handleAplicar}
                disabled={loading || applying}
                className="h-9 px-4 rounded-lg bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 text-white text-xs font-bold shadow-md shadow-sky-600/20 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {applying ? (
                  <>
                    <RotateCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Guardando Asignaciones...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    <span>Ejecutar y Guardar Asignación</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Success Banner */}
        {appliedSuccess && (
          <div className="px-6 py-3 bg-emerald-50 border-b border-emerald-200 flex items-center justify-between text-emerald-900 text-xs font-medium">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>
                <strong>¡Asignación automática completada exitosamente!</strong> Se han guardado los horarios, las aulas utilizadas han quedado marcadas como <strong>OCUPADA</strong> y los cursos unificados han sido agrupados sin cruces.
              </span>
            </div>
            <span className="px-2.5 py-1 bg-emerald-600 text-white rounded-md text-[11px] font-bold">
              Base de Datos Actualizada
            </span>
          </div>
        )}

        {/* Metrics Summary Bar */}
        {resumen && (
          <div className="px-6 py-3 bg-slate-100/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">Clases Planificadas:</span>
                <span className="font-extrabold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {resumen.totalProcesadas}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">Aulas Asignadas:</span>
                <span className="font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {resumen.totalAsignadas}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">Aulas en Estado OCUPADO:</span>
                <span className="font-extrabold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                  {resumen.aulasOcupadasCount} espacios
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">Grupos Unificados:</span>
                <span className="font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  {resumen.cursosUnificadosCount} (0 cruces)
                </span>
              </div>
            </div>

            {/* Table Search & Filter in Results */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar en resultados..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-48 h-7 pl-8 pr-2.5 text-[11px] bg-white border border-slate-300 rounded-md focus:outline-hidden focus:ring-1 focus:ring-sky-500"
                />
              </div>
              {uniqueCarrerasResults.length > 1 && (
                <select
                  value={filterCarreraResults}
                  onChange={e => setFilterCarreraResults(e.target.value)}
                  className="h-7 px-2 text-[11px] bg-white border border-slate-300 rounded-md font-medium text-slate-700"
                >
                  <option value="TODAS">Todas las carreras</option>
                  {uniqueCarrerasResults.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
        )}

        {/* Results Table Body */}
        <div className="flex-1 overflow-auto bg-slate-50">
          {!results ? (
            <div className="h-72 flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                <Wand2 className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-bold text-slate-700">Listo para generar la Asignación Automática</h3>
              <p className="text-xs text-slate-500 max-w-md mt-1">
                Seleccione el periodo académico y haga clic en <strong>"Simular Asignación"</strong> para revisar la propuesta de distribución o <strong>"Ejecutar y Guardar Asignación"</strong> para aplicar directamente.
              </p>
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <p className="text-xs font-semibold text-slate-600">No hay registros que coincidan con la búsqueda.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold text-[11px] uppercase tracking-wider border-b border-slate-800">
                    <th className="py-3 px-2.5 text-center w-10">#</th>
                    <th className="py-3 px-3">SEDE</th>
                    <th className="py-3 px-3">ESCUELA</th>
                    <th className="py-3 px-3">CARRERA</th>
                    <th className="py-3 px-3">ASIGNATURAS</th>
                    <th className="py-3 px-3">DOCENTE</th>
                    <th className="py-3 px-2.5 text-center">NIVEL</th>
                    <th className="py-3 px-2 text-center">PAR</th>
                    <th className="py-3 px-3">JORNADA</th>
                    <th className="py-3 px-3">BLOQUE</th>
                    <th className="py-3 px-3 text-center">AULA O LAB</th>
                    <th className="py-3 px-2 text-center">N° EST</th>
                    <th className="py-3 px-2 text-center">CAP AULA</th>
                    <th className="py-3 px-3">AFORO / OCUPACIÓN</th>
                    <th className="py-3 px-2.5 text-center">LUNES</th>
                    <th className="py-3 px-2.5 text-center">MARTES</th>
                    <th className="py-3 px-2.5 text-center">MIÉRCOLES</th>
                    <th className="py-3 px-2.5 text-center">JUEVES</th>
                    <th className="py-3 px-2.5 text-center">VIERNES</th>
                    <th className="py-3 px-2.5 text-center">SÁBADO</th>
                    <th className="py-3 px-2.5 text-center">DOMINGO</th>
                    <th className="py-3 px-3">FECHA INICIO</th>
                    <th className="py-3 px-3">FECHA FIN</th>
                    <th className="py-3 px-2.5 text-center">TOTAL CLASES</th>
                    <th className="py-3 px-3 text-center">ESTADO / UNIFICADO</th>
                    <th className="py-3 px-2.5 text-center">ACCIONES</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {filteredRows.map((row, idx) => {
                    const pct = row.aula_capacidad > 0 
                      ? Math.round((row.numero_estudiantes / row.aula_capacidad) * 100) 
                      : 0;
                    
                    const isOver = pct > 100;
                    const isLab = row.aula_tipo === 'LABORATORIO';

                    // Día de la clase
                    const diaNombre = (row.dia_nombre || '').toUpperCase();
                    const idDia = row.id_dia;
                    const scheduleText = `${row.hora_inicio || ''} - ${row.hora_fin || ''}`;

                    return (
                      <tr 
                        key={row.id_planificacion || idx} 
                        className={`hover:bg-sky-50/50 transition-colors ${
                          row.curso_unificado === 1 ? 'bg-amber-50/30' : ''
                        }`}
                      >
                        {/* 1. # */}
                        <td className="py-2.5 px-2.5 text-center text-slate-500 font-semibold text-[11px]">
                          {idx + 1}
                        </td>

                        {/* 2. SEDE */}
                        <td className="py-2.5 px-3 font-semibold text-slate-800">
                          {row.sede_nombre || 'UIO_NORTE'}
                        </td>

                        {/* 3. ESCUELA */}
                        <td className="py-2.5 px-3 text-slate-700">
                          {row.escuela_nombre || 'TECNOLOGÍAS'}
                        </td>

                        {/* 4. CARRERA */}
                        <td className="py-2.5 px-3 font-semibold text-slate-900 max-w-[200px] truncate" title={row.carrera_nombre}>
                          {row.carrera_nombre}
                        </td>

                        {/* 5. ASIGNATURAS */}
                        <td className="py-2.5 px-3 text-slate-900 font-medium max-w-[220px] truncate" title={row.asignatura_nombre}>
                          <div className="flex flex-col">
                            <span className="font-semibold">{row.asignatura_nombre}</span>
                            {row.asignatura_codigo && (
                              <span className="text-[10px] text-slate-400 font-mono">{row.asignatura_codigo}</span>
                            )}
                          </div>
                        </td>

                        {/* 6. DOCENTE */}
                        <td className="py-2.5 px-3 text-slate-800 font-medium">
                          {row.docente_nombres ? `${row.docente_nombres} ${row.docente_apellidos}` : 'POR ASIGNAR'}
                        </td>

                        {/* 7. NIVEL */}
                        <td className="py-2.5 px-2.5 text-center text-slate-700 font-medium">
                          {row.nivel_nombre || 'Nivel 1'}
                        </td>

                        {/* 8. PAR */}
                        <td className="py-2.5 px-2 text-center">
                          <span className="inline-block px-1.5 py-0.5 text-[10px] font-bold rounded bg-slate-100 text-slate-700 border border-slate-300">
                            {row.paralelo_codigo || 'A'}
                          </span>
                        </td>

                        {/* 9. JORNADA */}
                        <td className="py-2.5 px-3 text-slate-700 font-medium">
                          {row.jornada_nombre || 'MATUTINA'}
                        </td>

                        {/* 10. BLOQUE */}
                        <td className="py-2.5 px-3 text-slate-700 font-medium">
                          {row.bloque_nombre || 'BLOQUE A'}
                        </td>

                        {/* 11. AULA O LAB */}
                        <td className="py-2.5 px-3 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold border ${
                            isLab
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : 'bg-sky-50 text-sky-700 border-sky-200'
                          }`}>
                            <span>{row.aula_codigo}</span>
                            <span className="text-[9px] uppercase px-1 py-0.2 rounded bg-white font-extrabold shadow-2xs">
                              {isLab ? 'LAB' : 'AULA'}
                            </span>
                          </span>
                        </td>

                        {/* 12. N° EST */}
                        <td className="py-2.5 px-2 text-center font-bold text-slate-900">
                          {row.numero_estudiantes}
                        </td>

                        {/* 13. CAP AULA */}
                        <td className="py-2.5 px-2 text-center font-semibold text-slate-700">
                          {row.aula_capacidad}
                        </td>

                        {/* 14. AFORO / OCUPACIÓN */}
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2 min-w-[110px]">
                            <div className="flex-1 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                              <div 
                                className={`h-1.5 rounded-full transition-all ${
                                  isOver ? 'bg-rose-500' : pct > 85 ? 'bg-amber-500' : 'bg-emerald-500'
                                }`}
                                style={{ width: `${Math.min(pct, 100)}%` }}
                              />
                            </div>
                            <span className={`text-[11px] font-bold ${
                              isOver ? 'text-rose-600' : pct > 85 ? 'text-amber-700' : 'text-emerald-700'
                            }`}>
                              {pct}%
                            </span>
                          </div>
                        </td>

                        {/* 15. LUNES */}
                        <td className="py-2.5 px-2.5 text-center">
                          {idDia === 1 || diaNombre === 'LUNES' ? (
                            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold font-mono">
                              {scheduleText}
                            </span>
                          ) : (
                            <span className="text-slate-300 font-bold">-</span>
                          )}
                        </td>

                        {/* 16. MARTES */}
                        <td className="py-2.5 px-2.5 text-center">
                          {idDia === 2 || diaNombre === 'MARTES' ? (
                            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold font-mono">
                              {scheduleText}
                            </span>
                          ) : (
                            <span className="text-slate-300 font-bold">-</span>
                          )}
                        </td>

                        {/* 17. MIÉRCOLES */}
                        <td className="py-2.5 px-2.5 text-center">
                          {idDia === 3 || diaNombre === 'MIÉRCOLES' || diaNombre === 'MIERCOLES' ? (
                            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold font-mono">
                              {scheduleText}
                            </span>
                          ) : (
                            <span className="text-slate-300 font-bold">-</span>
                          )}
                        </td>

                        {/* 18. JUEVES */}
                        <td className="py-2.5 px-2.5 text-center">
                          {idDia === 4 || diaNombre === 'JUEVES' ? (
                            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold font-mono">
                              {scheduleText}
                            </span>
                          ) : (
                            <span className="text-slate-300 font-bold">-</span>
                          )}
                        </td>

                        {/* 19. VIERNES */}
                        <td className="py-2.5 px-2.5 text-center">
                          {idDia === 5 || diaNombre === 'VIERNES' ? (
                            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold font-mono">
                              {scheduleText}
                            </span>
                          ) : (
                            <span className="text-slate-300 font-bold">-</span>
                          )}
                        </td>

                        {/* 20. SÁBADO */}
                        <td className="py-2.5 px-2.5 text-center">
                          {idDia === 6 || diaNombre === 'SÁBADO' || diaNombre === 'SABADO' ? (
                            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold font-mono">
                              {scheduleText}
                            </span>
                          ) : (
                            <span className="text-slate-300 font-bold">-</span>
                          )}
                        </td>

                        {/* 21. DOMINGO */}
                        <td className="py-2.5 px-2.5 text-center">
                          {idDia === 7 || diaNombre === 'DOMINGO' ? (
                            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold font-mono">
                              {scheduleText}
                            </span>
                          ) : (
                            <span className="text-slate-300 font-bold">-</span>
                          )}
                        </td>

                        {/* 22. FECHA INICIO */}
                        <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">
                          {fechaInicioDefault}
                        </td>

                        {/* 23. FECHA FIN */}
                        <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">
                          {fechaFinDefault}
                        </td>

                        {/* 24. TOTAL CLASES */}
                        <td className="py-2.5 px-2.5 text-center font-bold text-slate-800">
                          {row.total_clases || 16}
                        </td>

                        {/* 25. ESTADO / UNIFICADO */}
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {row.curso_unificado === 1 ? (
                              <span 
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300"
                                title={`Curso unificado con: ${row.unificada_asignatura || 'Sección compartida'}`}
                              >
                                <Sparkles className="w-3 h-3 text-amber-600" />
                                <span>UNIFICADO</span>
                              </span>
                            ) : null}
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              ACTIVO
                            </span>
                          </div>
                        </td>

                        {/* 26. ACCIONES */}
                        <td className="py-2.5 px-2.5 text-center">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-semibold border border-slate-200">
                            <Check className="w-3 h-3 text-emerald-600" /> Asignada
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs shrink-0">
          <p className="text-slate-500">
            {results ? `Mostrando ${filteredRows.length} de ${results.length} asignaciones automáticas generadas.` : 'Configuración de parámetros lista.'}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold transition cursor-pointer"
            >
              Cerrar
            </button>
            {results && !appliedSuccess && (
              <button
                type="button"
                onClick={handleAplicar}
                disabled={applying}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/20 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Aplicar a Base de Datos</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
