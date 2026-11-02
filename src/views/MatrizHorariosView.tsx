import React, { useState, useMemo } from 'react';
import { Catalogos, AulaLaboratorio, PlanificacionCompleta } from '../types.ts';
import { Calendar, Building, Clock, Users, BookOpen, Layers, Info } from 'lucide-react';
import { PaginationControls } from '../components/common/PaginationControls.tsx';

interface MatrizHorariosViewProps {
  catalogos: Catalogos;
  aulas: AulaLaboratorio[];
  planificaciones: PlanificacionCompleta[];
  onSelectPlan: (plan: PlanificacionCompleta) => void;
}

export const MatrizHorariosView: React.FC<MatrizHorariosViewProps> = ({
  catalogos,
  aulas,
  planificaciones,
  onSelectPlan
}) => {
  const [selectedBloque, setSelectedBloque] = useState<number>(1);
  const [selectedPiso, setSelectedPiso] = useState<string>('');
  const [selectedAula, setSelectedAula] = useState<string>('');
  const [selectedEstado, setSelectedEstado] = useState<string>('');
  const [selectedJornada, setSelectedJornada] = useState<string>('');
  const [selectedDiaFilter, setSelectedDiaFilter] = useState<number | 'TODOS'>('TODOS');

  // Paginación de aulas
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number | 'all'>(5);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [selectedBloque, selectedPiso, selectedAula, selectedEstado, selectedJornada, selectedDiaFilter]);

  const dias = [...catalogos.diasSemana].sort((a, b) => a.orden - b.orden); // Lunes a Domingo completo
  const diasToDisplay = selectedDiaFilter === 'TODOS' 
    ? dias 
    : dias.filter(d => d.id_dia === selectedDiaFilter);

  // Helper to render color-coded status badge
  const renderEstadoBadge = (estado: string, isCompact: boolean = false) => {
    const norm = (estado || '').toUpperCase();
    let bg = 'bg-slate-100 text-slate-700 border-slate-300';
    let dot = 'bg-slate-500';
    let label = estado || 'DESCONOCIDO';

    if (norm === 'DISPONIBLE') {
      bg = 'bg-emerald-50 text-emerald-800 border-emerald-300';
      dot = 'bg-emerald-500';
      label = 'Disponible';
    } else if (norm.includes('PROCESO') || norm.includes('PENDIENTE') || norm.includes('BORRADOR')) {
      bg = 'bg-amber-50 text-amber-900 border-amber-300';
      dot = 'bg-amber-500';
      label = 'En Proceso';
    } else if (norm === 'OCUPADO' || norm === 'ACTIVO' || norm === 'PLANIFICADO') {
      bg = 'bg-rose-50 text-rose-800 border-rose-300';
      dot = 'bg-rose-600';
      label = 'Ocupado';
    } else if (norm === 'MANTENIMIENTO') {
      bg = 'bg-amber-50 text-amber-800 border-amber-300';
      dot = 'bg-amber-600';
      label = 'Mantenimiento';
    } else if (norm === 'INACTIVO') {
      bg = 'bg-rose-50 text-rose-800 border-rose-300';
      dot = 'bg-rose-600';
      label = 'Inactivo';
    }

    return (
      <span
        className={`inline-flex items-center gap-1 font-bold border rounded-full uppercase tracking-tight whitespace-nowrap shrink-0 ${bg} ${
          isCompact ? 'text-[7.5px] px-1.5 py-0.2 leading-none' : 'text-[10px] px-2 py-0.5'
        }`}
      >
        <span className={`w-1 h-1 rounded-full ${dot} shrink-0`} />
        <span>{label}</span>
      </span>
    );
  };

  // Filter classrooms in selected block, piso, and aula
  const filteredAulas = useMemo(() => {
    return aulas.filter(a => {
      if (a.id_bloque !== selectedBloque) return false;
      if (selectedPiso && a.piso !== Number(selectedPiso)) return false;
      if (selectedAula && a.id_aula_laboratorio !== Number(selectedAula)) return false;
      if (selectedEstado && a.estado !== selectedEstado) return false;
      return true;
    });
  }, [aulas, selectedBloque, selectedPiso, selectedAula, selectedEstado]);

  const totalAulasCount = filteredAulas.length;
  const numericPageSize = pageSize === 'all' ? totalAulasCount || 1 : pageSize;
  const totalPages = pageSize === 'all' ? 1 : Math.max(1, Math.ceil(totalAulasCount / numericPageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedAulas = useMemo(() => {
    if (pageSize === 'all') return filteredAulas;
    const start = (safeCurrentPage - 1) * numericPageSize;
    return filteredAulas.slice(start, start + numericPageSize);
  }, [filteredAulas, safeCurrentPage, numericPageSize, pageSize]);

  return (
    <div className="space-y-5">
      {/* Header & Filter Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            Matriz Semanal de Ocupación de Aulas
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Visualización de horarios y disponibilidad de espacios por día de la semana (Lunes a Domingo)
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Bloque Selector */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            {catalogos.bloques.map(b => (
              <button
                key={b.id_bloque}
                onClick={() => {
                  setSelectedBloque(b.id_bloque);
                  setSelectedPiso('');
                  setSelectedAula('');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  selectedBloque === b.id_bloque
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {b.codigo}
              </button>
            ))}
          </div>

          {/* Piso */}
          <select
            value={selectedPiso}
            onChange={e => setSelectedPiso(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-700 focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Todos los Pisos</option>
            <option value="1">Piso 1</option>
            <option value="2">Piso 2</option>
            <option value="3">Piso 3</option>
          </select>

          {/* Aula */}
          <select
            value={selectedAula}
            onChange={e => setSelectedAula(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-700 focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Todas las Aulas del Bloque</option>
            {aulas.filter(a => a.id_bloque === selectedBloque).map(a => (
              <option key={a.id_aula_laboratorio} value={a.id_aula_laboratorio}>
                {a.codigo} ({a.capacidad} est. - {a.estado})
              </option>
            ))}
          </select>

          {/* Estado Filter */}
          <select
            value={selectedEstado}
            onChange={e => setSelectedEstado(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-700 focus:ring-2 focus:ring-indigo-500 font-medium"
          >
            <option value="">Todos los Estados</option>
            <option value="DISPONIBLE">Disponible</option>
            <option value="OCUPADO">Ocupado</option>
            <option value="MANTENIMIENTO">Mantenimiento</option>
            <option value="INACTIVO">Inactivo</option>
          </select>

          {/* Jornada Filter */}
          <select
            value={selectedJornada}
            onChange={e => setSelectedJornada(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-700 focus:ring-2 focus:ring-indigo-500 font-medium"
          >
            <option value="">Todas las Jornadas</option>
            <option value="MATUTINA">Matutina</option>
            <option value="VESPERTINA">Vespertina</option>
            <option value="NOCTURNA">Nocturna</option>
          </select>
          {/* Combo Box de Selección de Día */}
          <div className="flex items-center gap-1.5">
            <label htmlFor="select-dia-horario" className="text-xs font-bold text-slate-600 whitespace-nowrap">
              Día:
            </label>
            <select
              id="select-dia-horario"
              value={selectedDiaFilter}
              onChange={e => {
                const val = e.target.value;
                setSelectedDiaFilter(val === 'TODOS' ? 'TODOS' : Number(val));
              }}
              className="text-xs bg-indigo-50 hover:bg-indigo-100/70 border border-indigo-200 rounded-xl p-2 text-indigo-950 font-bold focus:ring-2 focus:ring-indigo-500 shadow-2xs cursor-pointer min-w-[180px]"
            >
              <option value="TODOS">Semana Completa (Todos)</option>
              {dias.map(d => (
                <option key={d.id_dia} value={d.id_dia}>
                  {d.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Classroom by Classroom Matrix */}
      <div className="space-y-4">
        {totalAulasCount === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
            No se encontraron aulas en el bloque y filtros seleccionados.
          </div>
        ) : (
          paginatedAulas.map(aula => {
          const clasesAula = planificaciones.filter(p => p.id_aula_laboratorio === aula.id_aula_laboratorio);
          const aulaGeneralEstado = aula.estado || (clasesAula.length > 0 ? 'OCUPADO' : 'DISPONIBLE');

          return (
            <div key={aula.id_aula_laboratorio} className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              {/* Classroom header banner */}
              <div className="bg-slate-50 px-3.5 sm:px-5 py-2.5 sm:py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 sm:gap-3">
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  <span className="text-xs sm:text-sm font-bold text-slate-900">{aula.codigo} - {aula.nombre}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-bold ${
                    aula.tipo === 'LABORATORIO' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {aula.tipo}
                  </span>
                  <span className="text-[11px] sm:text-xs text-slate-500 font-medium">
                    {aula.bloque_nombre} • Piso {aula.piso}
                  </span>
                  {renderEstadoBadge(aulaGeneralEstado, false)}
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[11px] sm:text-xs">
                  <span className="text-slate-600">
                    Capacidad: <strong className="text-slate-900 font-mono">{aula.capacidad}</strong>
                  </span>
                  <span className="text-indigo-700 font-medium">
                    Nº Estudiantes: <strong className="text-indigo-900 font-mono">{clasesAula.length > 0 ? `${Math.max(...clasesAula.map(p => p.numero_estudiantes))} máx` : '0'}</strong>
                  </span>
                  <span className="bg-slate-200/80 px-2 py-0.5 rounded text-slate-700 font-semibold text-[10px] sm:text-[11px]">
                    {clasesAula.length} asignaciones
                  </span>
                </div>
              </div>

              {/* Day Columns Grid */}
              <div className={
                selectedDiaFilter === 'TODOS'
                  ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 border-t border-slate-200 divide-y sm:divide-y-0 sm:divide-x divide-slate-200"
                  : "border-t border-slate-200"
              }>
                {diasToDisplay.map(dia => {
                  const clasesDia = planificaciones.filter(p => {
                    if (p.id_aula_laboratorio !== aula.id_aula_laboratorio || p.id_dia !== dia.id_dia) return false;
                    if (selectedJornada && (p.jornada_nombre || '').toUpperCase() !== selectedJornada.toUpperCase()) return false;
                    return true;
                  });

                  return (
                    <div 
                      key={dia.id_dia} 
                      className={`bg-white overflow-hidden ${
                        selectedDiaFilter === 'TODOS' 
                          ? 'p-2 min-h-[160px] flex flex-col' 
                          : 'p-3 flex flex-col'
                      }`}
                    >
                      <div className="pb-1.5 mb-2 border-b border-slate-100 flex items-center justify-between max-w-2xl">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[11px] sm:text-xs text-slate-800 uppercase tracking-wide">{dia.nombre}</span>
                          {selectedDiaFilter !== 'TODOS' && (
                            <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                              Día seleccionado
                            </span>
                          )}
                        </div>
                        <span className="text-[9px] sm:text-[10px] text-slate-500 font-medium">
                          {clasesDia.length} {clasesDia.length === 1 ? 'clase' : 'clases'}
                        </span>
                      </div>

                      <div className={
                        selectedDiaFilter === 'TODOS'
                          ? "space-y-1.5 flex-1"
                          : "flex flex-wrap gap-3 items-start"
                      }>
                        {clasesDia.length === 0 ? (
                          selectedDiaFilter === 'TODOS' ? (
                            <div className="h-full flex flex-col items-center justify-center text-[10px] text-slate-400 py-6 gap-1.5">
                              <span>Sin clases</span>
                              {renderEstadoBadge(
                                aula.estado === 'MANTENIMIENTO' || aula.estado === 'INACTIVO' ? aula.estado : 'DISPONIBLE',
                                true
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center gap-2.5 text-xs text-slate-500 py-2.5 px-3 bg-slate-50 rounded-xl border border-dashed border-slate-200 max-w-sm">
                              <span>Sin clases programadas este día</span>
                              {renderEstadoBadge(
                                aula.estado === 'MANTENIMIENTO' || aula.estado === 'INACTIVO' ? aula.estado : 'DISPONIBLE',
                                true
                              )}
                            </div>
                          )
                        ) : (
                          clasesDia.map(p => {
                            const percent = p.aula_capacidad > 0 ? Math.round((p.numero_estudiantes / p.aula_capacidad) * 100) : 0;
                            const cardEstado = aula.estado === 'MANTENIMIENTO' || aula.estado === 'INACTIVO'
                              ? aula.estado
                              : (p.estado === 'INACTIVO' ? 'INACTIVO' : 'OCUPADO');

                            return (
                              <div
                                key={p.id_planificacion}
                                onClick={() => onSelectPlan(p)}
                                className={`p-2.5 rounded-xl border border-indigo-200 bg-indigo-50/40 hover:bg-indigo-100/60 hover:border-indigo-300 transition-all cursor-pointer text-left shadow-2xs group flex flex-col gap-1.5 overflow-hidden box-border ${
                                  selectedDiaFilter === 'TODOS'
                                    ? 'w-full'
                                    : 'w-full sm:w-[300px] max-w-[320px]'
                                }`}
                              >
                                {/* Horario & Estado */}
                                <div className="flex items-center justify-between gap-1 w-full">
                                  <span className="inline-flex items-center gap-1 font-mono text-[9.5px] font-bold text-indigo-950 whitespace-nowrap">
                                    <Clock className="w-2.5 h-2.5 text-indigo-600 shrink-0" />
                                    <span>{p.hora_inicio} - {p.hora_fin}</span>
                                  </span>
                                  {renderEstadoBadge(cardEstado, true)}
                                </div>

                                {/* Código de Asignatura & Carrera */}
                                <div className="flex items-center gap-1.5 w-full overflow-hidden">
                                  <span className="font-mono font-bold text-[8.5px] px-1.5 py-0.5 rounded bg-white text-indigo-900 border border-indigo-200 shadow-2xs shrink-0">
                                    {p.asignatura_codigo || 'ASIG'}
                                  </span>
                                  <span className="text-[8.5px] text-slate-500 font-medium truncate" title={p.carrera_nombre}>
                                    {p.carrera_nombre}
                                  </span>
                                </div>

                                {/* Nombre Completo de la Asignatura */}
                                <div className="text-[10.5px] font-bold text-slate-900 leading-snug group-hover:text-indigo-600 transition-colors break-words">
                                  {p.asignatura_nombre}
                                </div>

                                {/* Nombres y Apellidos Completos del Docente */}
                                <div className="text-slate-800 bg-white/90 p-1.5 rounded-lg border border-indigo-100/80 w-full overflow-hidden">
                                  <span className="text-[7.5px] uppercase font-bold text-slate-400 block leading-none mb-0.5">Docente:</span>
                                  <span className="font-semibold text-slate-800 text-[9px] leading-snug block break-words">
                                    {p.docente_nombres} {p.docente_apellidos}
                                  </span>
                                </div>

                                {/* Jornada */}
                                <div className="flex items-center justify-between gap-1 text-[8.5px] pt-0.5 w-full">
                                  <span className="text-slate-400 uppercase font-semibold text-[8px]">Jornada:</span>
                                  <span className="font-bold text-slate-700 uppercase bg-white px-1.5 py-0.2 rounded border border-slate-200 text-[8px] shadow-2xs whitespace-nowrap">
                                    {p.jornada_nombre || p.jornada_codigo || 'MATUTINA'}
                                  </span>
                                </div>

                                {/* Cursos unificados badge if applicable */}
                                {p.curso_unificado === 1 && (
                                  <div className="text-[8px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300 text-center uppercase tracking-tight">
                                    Curso Unificado
                                  </div>
                                )}

                                {/* Capacidad & Ocupación */}
                                <div className="mt-0.5 pt-1 border-t border-indigo-100 flex items-center justify-between text-[8.5px] w-full">
                                  <span className="text-slate-600 font-medium">
                                    <strong className="text-slate-900 font-bold font-mono">{p.numero_estudiantes}</strong> / {p.aula_capacidad} est.
                                  </span>
                                  <span className={`font-bold font-mono text-[9px] ${
                                    percent > 100 ? 'text-rose-600' : percent > 85 ? 'text-amber-600' : 'text-indigo-700'
                                  }`}>
                                    {percent}%
                                  </span>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        }))}
      </div>

      {/* Paginación de aulas al abarcar la pantalla */}
      {totalAulasCount > 0 && (
        <PaginationControls
          currentPage={safeCurrentPage}
          totalItems={totalAulasCount}
          pageSize={pageSize}
          pageSizeOptions={[3, 5, 10, 15, 'all']}
          itemName="aulas"
          onPageChange={page => setCurrentPage(page)}
          onPageSizeChange={size => {
            setPageSize(size);
            setCurrentPage(1);
          }}
        />
      )}
    </div>
  );
};
