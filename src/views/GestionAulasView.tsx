import React, { useState, useMemo } from 'react';
import { Catalogos, AulaLaboratorio, PlanificacionCompleta } from '../types.ts';
import { useAuth } from '../controllers/authContext.tsx';
import { ApiClient } from '../controllers/apiClient.ts';
import { ExportController } from '../controllers/exportController.ts';
import { ReporteRegistrosAulasModal } from '../components/ReporteRegistrosAulasModal.tsx';
import { 
  Building2, 
  Layers, 
  Users, 
  CheckCircle, 
  Wrench, 
  Ban, 
  Download, 
  Search, 
  Filter,
  FileSpreadsheet,
  FileText,
  Printer,
  Table as TableIcon,
  LayoutGrid,
  ArrowUpDown,
  Laptop,
  BookOpen,
  Eye,
  SlidersHorizontal,
  Loader2
} from 'lucide-react';

interface GestionAulasViewProps {
  catalogos: Catalogos;
  aulas: AulaLaboratorio[];
  planificaciones?: PlanificacionCompleta[];
  onRefreshAulas: () => void;
}

export const GestionAulasView: React.FC<GestionAulasViewProps> = ({
  catalogos,
  aulas,
  planificaciones = [],
  onRefreshAulas
}) => {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [selectedBloque, setSelectedBloque] = useState<string>('');
  const [selectedTipo, setSelectedTipo] = useState<string>('');
  const [selectedEstado, setSelectedEstado] = useState<string>('');
  const [sortBy, setSortBy] = useState<'codigo' | 'capacidad' | 'estudiantes' | 'bloque' | 'piso' | 'estado'>('codigo');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'registros' | 'tarjetas'>('registros'); // Default to records view
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [isReporteModalOpen, setIsReporteModalOpen] = useState(false);

  // Helper to compute live student and class stats per classroom
  const getAulaStats = (aula: AulaLaboratorio) => {
    const plans = planificaciones.filter(
      p => p.id_aula_laboratorio === aula.id_aula_laboratorio && p.estado === 'ACTIVO'
    );
    const totalEst = plans.length > 0 
      ? plans.reduce((s, p) => s + p.numero_estudiantes, 0)
      : (aula.total_estudiantes || 0);
    const maxEst = plans.length > 0 
      ? Math.max(...plans.map(p => p.numero_estudiantes))
      : (aula.max_estudiantes || 0);
    const clasesCount = plans.length > 0 ? plans.length : (aula.clases_activas_count || 0);
    const pctOcupacion = aula.capacidad > 0 && maxEst > 0 
      ? Math.round((maxEst / aula.capacidad) * 100) 
      : 0;
    return { totalEst, maxEst, clasesCount, pctOcupacion, plans };
  };

  // Filtered & Sorted records
  const filtered = useMemo(() => {
    let result = aulas.filter(a => {
      if (search) {
        const q = search.toLowerCase();
        if (
          !a.codigo.toLowerCase().includes(q) && 
          !a.nombre.toLowerCase().includes(q) && 
          !a.bloque_nombre.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      if (selectedBloque && a.id_bloque !== Number(selectedBloque)) return false;
      if (selectedTipo) {
        const isCoworking = a.tipo === 'COWORKING' || a.codigo === 'B5';
        if (selectedTipo === 'COWORKING') {
          if (!isCoworking) return false;
        } else if (selectedTipo === 'AULA') {
          if (a.tipo !== 'AULA' || isCoworking) return false;
        } else if (a.tipo !== selectedTipo) {
          return false;
        }
      }
      if (selectedEstado && a.estado !== selectedEstado) return false;
      return true;
    });

    result.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'codigo') {
        comparison = a.codigo.localeCompare(b.codigo);
      } else if (sortBy === 'capacidad') {
        comparison = a.capacidad - b.capacidad;
      } else if (sortBy === 'estudiantes') {
        const statsA = getAulaStats(a);
        const statsB = getAulaStats(b);
        comparison = statsA.maxEst - statsB.maxEst;
      } else if (sortBy === 'bloque') {
        comparison = a.bloque_nombre.localeCompare(b.bloque_nombre);
      } else if (sortBy === 'piso') {
        comparison = a.piso - b.piso;
      } else if (sortBy === 'estado') {
        comparison = a.estado.localeCompare(b.estado);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [aulas, planificaciones, search, selectedBloque, selectedTipo, selectedEstado, sortBy, sortOrder]);

  // Statistics
  const totalCapacidad = useMemo(() => filtered.reduce((sum, a) => sum + a.capacidad, 0), [filtered]);
  const totalEstudiantesAsignados = useMemo(() => {
    return filtered.reduce((sum, a) => {
      const stats = getAulaStats(a);
      return sum + stats.maxEst;
    }, 0);
  }, [filtered, planificaciones]);
  const disponiblesCount = useMemo(() => filtered.filter(a => a.estado === 'DISPONIBLE').length, [filtered]);
  const ocupadasCount = useMemo(() => filtered.filter(a => a.estado === 'OCUPADO').length, [filtered]);
  const mantenimientoCount = useMemo(() => filtered.filter(a => a.estado === 'MANTENIMIENTO').length, [filtered]);
  const inactivasCount = useMemo(() => filtered.filter(a => a.estado === 'INACTIVO').length, [filtered]);

  const handleStateChange = async (id: number, newEstado: string) => {
    try {
      setUpdatingId(id);
      await ApiClient.updateAulaEstado(id, newEstado);
      onRefreshAulas();
    } catch (err: any) {
      alert(err.message || 'Error al actualizar estado');
    } finally {
      setUpdatingId(null);
    }
  };

  const toggleSort = (field: 'codigo' | 'capacidad' | 'estudiantes' | 'bloque' | 'piso' | 'estado') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getStatusBadge = (estado: string) => {
    const norm = (estado || '').toUpperCase();
    if (norm === 'DISPONIBLE') {
      return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    }
    if (norm.includes('PROCESO') || norm.includes('PENDIENTE')) {
      return 'bg-amber-100 text-amber-900 border-amber-300';
    }
    if (norm === 'OCUPADO' || norm === 'ACTIVO') {
      return 'bg-rose-100 text-rose-800 border-rose-300';
    }
    if (norm === 'MANTENIMIENTO') {
      return 'bg-amber-50 text-amber-800 border-amber-300';
    }
    if (norm === 'INACTIVO' || norm.includes('NO DISPONIBLE')) {
      return 'bg-rose-100 text-rose-800 border-rose-300 font-bold';
    }
    return 'bg-slate-100 text-slate-800 border-slate-300';
  };

  const getSelectedBloqueNombre = () => {
    if (!selectedBloque) return undefined;
    const b = catalogos.bloques.find(x => x.id_bloque === Number(selectedBloque));
    return b?.nombre;
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-700">
            <span>Módulo de Infraestructura Física</span>
            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
            <span className="text-slate-500 font-normal">Sede Matriz ISUJ</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 mt-0.5">
            <Building2 className="w-6 h-6 text-indigo-600" />
            <span>Catálogo e Inventario de Aulas y Laboratorios</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Gestión de capacidad física, pisos, tipología y estados de mantenimiento por bloque en forma de registros detallados.
          </p>
        </div>

        {/* Action Buttons: Generate Institutional Report, PDF, Excel, CSV */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsReporteModalOpen(true)}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            title="Generar Reporte Oficial de Registros con formato institucional y firmas"
          >
            <Printer className="w-4 h-4 text-indigo-200" />
            <span>Generar Reporte Oficial</span>
          </button>

          <button
            type="button"
            onClick={() => ExportController.exportAulasPDF(filtered)}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border border-slate-200"
            title="Descargar Reporte en PDF apaisado con tabla de registros"
          >
            <FileText className="w-3.5 h-3.5 text-rose-600" />
            <span>PDF</span>
          </button>

          <button
            type="button"
            onClick={() => ExportController.exportAulasXLSX(filtered)}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border border-slate-200"
            title="Descargar Reporte en Excel XLSX"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Excel</span>
          </button>

          <button
            type="button"
            onClick={() => ExportController.exportAulasCSV(filtered)}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border border-slate-200"
            title="Descargar Reporte en CSV plano"
          >
            <Download className="w-3.5 h-3.5 text-sky-600" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Summary Ribbon of Records */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Registros</div>
          <div className="text-xl font-black text-slate-900 mt-1 font-mono">{filtered.length} <span className="text-xs font-normal text-slate-400">/ {aulas.length}</span></div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/20 shadow-xs">
          <div className="text-[11px] font-semibold text-indigo-700 uppercase tracking-wider">Capacidad Total</div>
          <div className="text-xl font-black text-indigo-600 mt-1 font-mono">{totalCapacidad} <span className="text-xs font-normal text-slate-400">puestos</span></div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-blue-200 bg-blue-50/30 shadow-xs">
          <div className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider">Nº Estudiantes</div>
          <div className="text-xl font-black text-blue-900 mt-1 font-mono">{totalEstudiantesAsignados} <span className="text-xs font-normal text-slate-400">est.</span></div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40 shadow-xs">
          <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">Disponibles</div>
          <div className="text-xl font-black text-emerald-800 mt-1 font-mono">{disponiblesCount}</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-rose-200 bg-rose-50/40 shadow-xs">
          <div className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider">Ocupadas (Rojo)</div>
          <div className="text-xl font-black text-rose-800 mt-1 font-mono">{ocupadasCount}</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-amber-200 bg-amber-50/40 shadow-xs">
          <div className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">Mant. / Inactivas</div>
          <div className="text-xl font-black text-amber-800 mt-1 font-mono">{mantenimientoCount + inactivasCount}</div>
        </div>
      </div>

      {/* Filter Bar & View Mode Toggle */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por código (ej. A2, B4, E1) o nombre..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
            />
          </div>

          {/* Bloque */}
          <select
            value={selectedBloque}
            onChange={e => setSelectedBloque(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Todos los Bloques</option>
            {catalogos.bloques.map(b => (
              <option key={b.id_bloque} value={b.id_bloque}>{b.nombre}</option>
            ))}
          </select>

          {/* Tipo */}
          <select
            value={selectedTipo}
            onChange={e => setSelectedTipo(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
          >
            <option value="">Todos los Tipos</option>
            <option value="AULA">Solo Aulas Regulares</option>
            <option value="LABORATORIO">Solo Laboratorios</option>
            <option value="COWORKING">Espacio Coworking (B5 - No es aula)</option>
          </select>

          {/* Estado */}
          <select
            value={selectedEstado}
            onChange={e => setSelectedEstado(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Todos los Estados</option>
            <option value="DISPONIBLE">DISPONIBLE</option>
            <option value="OCUPADO">OCUPADO</option>
            <option value="MANTENIMIENTO">MANTENIMIENTO</option>
            <option value="INACTIVO">INACTIVO</option>
          </select>
        </div>

        {/* View Mode Toggle: Forma de Registros (Tabla) vs Forma de Tarjetas (Cuadrícula) */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => setViewMode('registros')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              viewMode === 'registros'
                ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Mostrar reporte en forma de registros detallados"
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>Forma de Registros</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('tarjetas')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              viewMode === 'tarjetas'
                ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Mostrar en forma de cuadrícula de tarjetas"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Tarjetas</span>
          </button>
        </div>
      </div>

      {/* VIEW MODE 1: FORMA DE REGISTROS (TABULAR / DETALLADA) */}
      {viewMode === 'registros' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
            <div className="font-semibold text-slate-700 flex items-center gap-2">
              <span>Listado Oficial de Registros</span>
              <span className="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full font-mono font-bold text-[11px]">
                {filtered.length} registros
              </span>
            </div>
            <div className="text-slate-500 text-[11px]">
              Haga clic en las columnas para ordenar • Cambie estados directamente en cada fila
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 uppercase text-[10px] font-bold border-b border-slate-200">
                  <th className="py-3 px-3 text-center w-12 text-slate-500">Nº</th>
                  <th 
                    onClick={() => toggleSort('codigo')}
                    className="py-3 px-3 cursor-pointer hover:bg-slate-200 transition select-none"
                  >
                    <div className="flex items-center gap-1">
                      <span>Código</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-3">Nombre del Espacio</th>
                  <th 
                    onClick={() => toggleSort('bloque')}
                    className="py-3 px-3 cursor-pointer hover:bg-slate-200 transition select-none"
                  >
                    <div className="flex items-center gap-1">
                      <span>Bloque</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th 
                    onClick={() => toggleSort('piso')}
                    className="py-3 px-3 text-center cursor-pointer hover:bg-slate-200 transition select-none"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Piso</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-3">Tipología</th>
                  <th 
                    onClick={() => toggleSort('capacidad')}
                    className="py-3 px-3 text-center cursor-pointer hover:bg-slate-200 transition select-none"
                    title="Ordenar por capacidad física del aula"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Capacidad Aula</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th 
                    onClick={() => toggleSort('estudiantes')}
                    className="py-3 px-3 text-center cursor-pointer hover:bg-slate-200 transition select-none"
                    title="Ordenar por número de estudiantes asignados"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Nº Estudiantes</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th 
                    onClick={() => toggleSort('estado')}
                    className="py-3 px-3 text-center cursor-pointer hover:bg-slate-200 transition select-none"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Estado Operativo</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-3 text-center">Clases</th>
                  <th className="py-3 px-3 text-center">Cambiar Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-slate-400">
                      <Building2 className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="font-semibold text-slate-600">No se encontraron registros de aulas o laboratorios</p>
                      <p className="text-xs text-slate-400 mt-0.5">Intente modificar los filtros o el texto de búsqueda</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((aula, idx) => {
                    const isUpdating = updatingId === aula.id_aula_laboratorio;
                    const stats = getAulaStats(aula);
                    const pctCapacidad = Math.min(100, Math.round((aula.capacidad / 50) * 100));

                    return (
                      <tr 
                        key={aula.id_aula_laboratorio}
                        className={`hover:bg-indigo-50/40 transition duration-100 ${
                          idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                        }`}
                      >
                        {/* Nº */}
                        <td className="py-2.5 px-3 text-center font-mono text-slate-400 text-[11px] font-semibold">
                          {idx + 1}
                        </td>

                        {/* Código */}
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className="font-mono font-bold text-slate-900 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-xs">
                            {aula.codigo}
                          </span>
                        </td>

                        {/* Nombre */}
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-900">{aula.nombre}</div>
                          <div className="text-[10px] text-slate-400 font-mono">ID: {aula.id_aula_laboratorio} • Sede Matriz</div>
                        </td>

                        {/* Bloque */}
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            <span>{aula.bloque_nombre}</span>
                          </div>
                        </td>

                        {/* Piso */}
                        <td className="py-2.5 px-3 text-center whitespace-nowrap text-slate-600 font-medium">
                          Piso {aula.piso}
                        </td>

                        {/* Tipo */}
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {aula.tipo === 'COWORKING' || aula.codigo === 'B5' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                              <Users className="w-3 h-3 text-amber-700" />
                              Coworking (No es aula)
                            </span>
                          ) : aula.tipo === 'LABORATORIO' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                              <Laptop className="w-3 h-3 text-purple-600" />
                              Laboratorio
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                              <BookOpen className="w-3 h-3 text-slate-600" />
                              Aula Regular
                            </span>
                          )}
                        </td>

                        {/* Capacidad del Aula */}
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          {aula.tipo === 'COWORKING' || aula.codigo === 'B5' ? (
                            <span className="text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[10px]">
                              Espacio Coworking
                            </span>
                          ) : ['C1', 'C2', 'C3', 'C4'].includes(aula.codigo) ? (
                            <span className="text-slate-700 font-bold bg-slate-100 px-2.5 py-0.5 rounded border border-slate-300 text-xs font-mono">
                              N/A
                            </span>
                          ) : (
                            <>
                              <div className="font-bold text-slate-900 font-mono">
                                {aula.capacidad} <span className="text-[10px] font-normal text-slate-500">puestos</span>
                              </div>
                              <div className="text-[10px] text-slate-400 font-medium">
                                Cap. física
                              </div>
                            </>
                          )}
                        </td>

                        {/* Nº Estudiantes */}
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          {['C1', 'C2', 'C3', 'C4'].includes(aula.codigo) ? (
                            <span className="text-slate-500 font-medium bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200 text-xs font-mono">
                              N/A
                            </span>
                          ) : stats.maxEst > 0 ? (
                            <div>
                              <div className="font-bold text-indigo-900 font-mono text-xs flex items-center justify-center gap-1">
                                <Users className="w-3.5 h-3.5 text-indigo-600 inline" />
                                <span>{stats.maxEst}</span>
                                <span className="text-[10px] font-normal text-slate-500">est.</span>
                              </div>
                              <div className="flex items-center justify-center gap-1.5 mt-0.5">
                                <div className="w-14 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full ${
                                      stats.pctOcupacion > 90 ? 'bg-amber-500' : 'bg-indigo-600'
                                    }`} 
                                    style={{ width: `${Math.min(100, stats.pctOcupacion)}%` }}
                                  ></div>
                                </div>
                                <span className={`text-[10px] font-bold ${
                                  stats.pctOcupacion > 90 ? 'text-amber-700' : 'text-indigo-700'
                                }`}>
                                  {stats.pctOcupacion}%
                                </span>
                              </div>
                              {stats.clasesCount > 1 && (
                                <div className="text-[9px] text-slate-400 mt-0.5">
                                  {stats.totalEst} est. total
                                </div>
                              )}
                            </div>
                          ) : (
                            <div>
                              <span className="text-slate-400 font-mono text-xs">0 est.</span>
                              <div className="text-[9px] text-slate-400">Sin asignar</div>
                            </div>
                          )}
                        </td>

                        {/* Estado */}
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          {(() => {
                            const isC1toC4 = ['C1', 'C2', 'C3', 'C4'].includes(aula.codigo);
                            const isNoDisp = aula.estado === 'INACTIVO' || isC1toC4;
                            if (isC1toC4) {
                              return (
                                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-rose-100 text-rose-800 border-rose-300 font-mono font-black">
                                  N/A
                                </span>
                              );
                            }
                            if (aula.estado === 'DISPONIBLE') {
                              return (
                                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-emerald-50 text-emerald-700 border-emerald-300">
                                  DISPONIBLE
                                </span>
                              );
                            }
                            return (
                              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(isNoDisp ? 'INACTIVO' : aula.estado)}`}>
                                {isNoDisp ? 'NO DISPONIBLE' : aula.estado}
                              </span>
                            );
                          })()}
                        </td>

                        {/* Clases asignadas */}
                        <td className="py-2.5 px-3 text-center whitespace-nowrap font-mono font-bold text-slate-700">
                          {stats.clasesCount ? (
                            <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full text-[10px]">
                              {stats.clasesCount} clases
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">0</span>
                          )}
                        </td>

                        {/* Acciones / Cambiar Estado */}
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          {user.permissions.canChangeAulaStatus ? (
                            <div className="flex items-center justify-center gap-1">
                              {isUpdating ? (
                                <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                              ) : (
                                <select
                                  value={aula.estado}
                                  onChange={e => handleStateChange(aula.id_aula_laboratorio, e.target.value)}
                                  className="text-[11px] bg-white border border-slate-300 rounded-md py-1 px-1.5 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-2xs"
                                >
                                  <option value="DISPONIBLE">DISPONIBLE</option>
                                  <option value="OCUPADO">OCUPADO</option>
                                  <option value="MANTENIMIENTO">MANTENIMIENTO</option>
                                  <option value="INACTIVO">INACTIVO</option>
                                </select>
                              )}
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400">Lectura</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              {filtered.length > 0 && (
                <tfoot>
                  <tr className="bg-slate-100 font-bold border-t border-slate-300 text-slate-800 text-[11px]">
                    <td colSpan={6} className="py-3 px-3 text-right">
                      Total Resumen ({filtered.length} registros seleccionados):
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-indigo-700 font-bold">
                      {totalCapacidad} puestos
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-blue-900 font-bold">
                      {totalEstudiantesAsignados} est.
                    </td>
                    <td className="py-3 px-3 text-center text-emerald-700 font-semibold">
                      {disponiblesCount} libres
                    </td>
                    <td className="py-3 px-3 text-center font-mono">
                      {filtered.reduce((sum, a) => sum + (getAulaStats(a).clasesCount || 0), 0)}
                    </td>
                    <td className="py-3 px-3 text-center text-slate-500 font-normal">
                      -
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      ) : (
        /* VIEW MODE 2: FORMA DE TARJETAS (CUADRÍCULA) */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(aula => {
            const stats = getAulaStats(aula);
            return (
              <div
                key={aula.id_aula_laboratorio}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex flex-col justify-between hover:border-indigo-300 transition duration-150"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-slate-900 font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {aula.codigo}
                    </span>
                    {(() => {
                      const isC1toC4 = ['C1', 'C2', 'C3', 'C4'].includes(aula.codigo);
                      const isNoDisp = aula.estado === 'INACTIVO' || isC1toC4;
                      if (isC1toC4) {
                        return (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold border bg-rose-100 text-rose-800 border-rose-300 font-mono font-black">
                            N/A
                          </span>
                        );
                      }
                      if (aula.estado === 'DISPONIBLE') {
                        return (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold border bg-emerald-50 text-emerald-700 border-emerald-300">
                            DISPONIBLE
                          </span>
                        );
                      }
                      return (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadge(isNoDisp ? 'INACTIVO' : aula.estado)}`}>
                          {isNoDisp ? 'NO DISPONIBLE' : aula.estado}
                        </span>
                      );
                    })()}
                  </div>

                  <div className="text-xs font-semibold text-slate-700 mb-1">
                    {aula.nombre}
                  </div>

                  <div className="text-[11px] text-slate-500 mb-3 space-y-0.5">
                    <div>{aula.bloque_nombre} • Piso {aula.piso}</div>
                    <div className="font-semibold text-indigo-700 flex items-center gap-1 mt-1">
                      {aula.tipo === 'COWORKING' || aula.codigo === 'B5' ? (
                        <>
                          <Users className="w-3.5 h-3.5 text-amber-600" />
                          <span className="text-amber-800 font-bold">Espacio Coworking (No es aula)</span>
                        </>
                      ) : aula.tipo === 'LABORATORIO' ? (
                        <>
                          <Laptop className="w-3.5 h-3.5 text-purple-600" />
                          <span>Laboratorio / Taller</span>
                        </>
                      ) : (
                        <>
                          <BookOpen className="w-3.5 h-3.5 text-slate-600" />
                          <span>Aula Regular</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Capacidad del Aula y Número de Estudiantes */}
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 space-y-1.5 text-xs mb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 font-medium">Capacidad Aula:</span>
                      <span className="font-bold text-slate-900 font-mono">
                        {['C1', 'C2', 'C3', 'C4'].includes(aula.codigo) 
                          ? 'N/A' 
                          : (aula.tipo === 'COWORKING' || aula.codigo === 'B5')
                          ? 'Coworking (No es aula)'
                          : `${aula.capacidad} puestos`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/60">
                      <span className="text-slate-600 font-medium">Nº Estudiantes:</span>
                      <span className="font-bold text-indigo-900 font-mono flex items-center gap-1">
                        <Users className="w-3 h-3 text-indigo-600" />
                        {stats.maxEst > 0 ? (
                          <span>{stats.maxEst} est. <span className="text-[10px] font-semibold text-indigo-600">({stats.pctOcupacion}%)</span></span>
                        ) : (
                          <span className="text-slate-400 font-normal">0 est.</span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Change status control */}
                {user.permissions.canChangeAulaStatus ? (
                  <div className="pt-2 border-t border-slate-100">
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1">Cambiar Estado:</label>
                    <div className="grid grid-cols-2 gap-1">
                      {(['DISPONIBLE', 'OCUPADO', 'MANTENIMIENTO', 'INACTIVO'] as const).map(st => (
                        <button
                          key={st}
                          disabled={updatingId === aula.id_aula_laboratorio || aula.estado === st}
                          onClick={() => handleStateChange(aula.id_aula_laboratorio, st)}
                          className={`text-[10px] py-1 px-1.5 rounded font-medium transition cursor-pointer border ${
                            aula.estado === st
                              ? 'bg-slate-800 text-white border-slate-800 font-bold'
                              : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-[10px] text-slate-400 text-center py-1">
                    Solo administradores pueden cambiar estados.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Official Institutional Report Modal */}
      <ReporteRegistrosAulasModal
        isOpen={isReporteModalOpen}
        onClose={() => setIsReporteModalOpen(false)}
        aulas={filtered}
        planificaciones={planificaciones}
        filtroBloque={getSelectedBloqueNombre()}
        filtroTipo={selectedTipo}
        filtroEstado={selectedEstado}
      />
    </div>
  );
};
