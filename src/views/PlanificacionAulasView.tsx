import React, { useState, useMemo } from 'react';
import { Catalogos, AulaLaboratorio, PlanificacionCompleta } from '../types.ts';
import { 
  Calendar, 
  CalendarDays, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Filter, 
  Building2, 
  Clock, 
  Users, 
  BookOpen, 
  Plus, 
  FileSpreadsheet, 
  FileText,
  X,
  Info,
  CheckCircle2,
  AlertTriangle,
  Download,
  CircleDot,
  Check,
  RotateCcw,
  LayoutGrid,
  List
} from 'lucide-react';
import { ModalExportarPdfPlanificacion } from '../components/ModalExportarPdfPlanificacion.tsx';
import { PdfReportService } from '../services/pdfReportService.ts';
import { ExportController } from '../controllers/exportController.ts';
import { PaginationControls } from '../components/common/PaginationControls.tsx';

export type SemaforoEstado = 'DISPONIBLE' | 'EN_PROCESO' | 'OCUPADO';

interface PlanificacionAulasViewProps {
  catalogos: Catalogos;
  aulas: AulaLaboratorio[];
  planificaciones: PlanificacionCompleta[];
  onOpenNewModal: () => void;
  onSelectPlan?: (plan: PlanificacionCompleta) => void;
  initialSemaforoFilter?: 'TODOS' | SemaforoEstado;
}

export const PlanificacionAulasView: React.FC<PlanificacionAulasViewProps> = ({
  catalogos,
  aulas,
  planificaciones,
  onOpenNewModal,
  onSelectPlan,
  initialSemaforoFilter = 'TODOS'
}) => {
  // Base reference date - defaults to September 8, 2026 (matching the user's screenshot: 08-09-2026)
  const [baseDate, setBaseDate] = useState<Date>(() => new Date('2026-09-08T00:00:00'));
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBloque, setSelectedBloque] = useState<string>('TODOS');
  const [selectedTipo, setSelectedTipo] = useState<string>('TODOS');
  const [selectedSede, setSelectedSede] = useState<string>('TODOS');
  const [selectedSemaforoFilter, setSelectedSemaforoFilter] = useState<'TODOS' | SemaforoEstado>(initialSemaforoFilter);

  // Sync with initialSemaforoFilter if provided
  React.useEffect(() => {
    if (initialSemaforoFilter) {
      setSelectedSemaforoFilter(initialSemaforoFilter);
    }
  }, [initialSemaforoFilter]);

  // Manual status overrides for specific aula-date slots: key = `${id_aula}_${formattedDate}`
  const [slotStatusOverrides, setSlotStatusOverrides] = useState<Record<string, SemaforoEstado>>(() => {
    // Initial sample demonstration for "EN PROCESO" if desired
    return {
      '10_10-09-2026': 'EN_PROCESO', // Example aula A10 on 10-09-2026
      '7_09-09-2026': 'EN_PROCESO',  // Example aula A1 SUR on 09-09-2026
    };
  });

  // Modal for cell details
  const [selectedCell, setSelectedCell] = useState<{
    aula: AulaLaboratorio;
    date: Date;
    dateStr: string;
    dayIndex: number;
    dayName: string;
    hours: number;
    classes: PlanificacionCompleta[];
    semaforo: SemaforoEstado;
    slotKey: string;
  } | null>(null);

  // Quick jump date picker input toggle
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customDateInput, setCustomDateInput] = useState('2026-09-08');

  // PDF Export Modal toggle
  const [showPdfExportModal, setShowPdfExportModal] = useState(false);

  // View mode when filtering by a specific color: 'matriz' (only that color rendered) or 'detalle' (cards list)
  const [semaforoViewMode, setSemaforoViewMode] = useState<'matriz' | 'detalle'>('matriz');

  // Paginación para la matriz principal (por defecto 10 aulas para ajustarse al alto de pantalla)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number | 'all'>(10);

  // Paginación para vista de tarjetas de detalle
  const [detailPage, setDetailPage] = useState<number>(1);
  const [detailPageSize, setDetailPageSize] = useState<number | 'all'>(12);

  // Reiniciar paginación al cambiar filtros o fechas
  React.useEffect(() => {
    setCurrentPage(1);
    setDetailPage(1);
  }, [searchTerm, selectedBloque, selectedTipo, selectedSede, selectedSemaforoFilter, baseDate]);

  // Compute 7 days of the week starting from baseDate
  const weekDays = useMemo(() => {
    const days = [];
    const dayNames = ['LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO', 'DOMINGO'];
    const shortNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + i);

      const dayNum = String(d.getDate()).padStart(2, '0');
      const monthNum = String(d.getMonth() + 1).padStart(2, '0');
      const yearNum = d.getFullYear();
      const formattedDate = `${dayNum}-${monthNum}-${yearNum}`; // DD-MM-YYYY format matching screenshot

      const jsDay = d.getDay();
      const systemDayId = jsDay === 0 ? 7 : jsDay;
      const dayName = dayNames[systemDayId - 1];
      const shortName = shortNames[systemDayId - 1];

      days.push({
        date: d,
        formattedDate,
        dayId: systemDayId,
        dayName,
        shortName,
      });
    }
    return days;
  }, [baseDate]);

  // Week navigation helpers
  const handlePrevWeek = () => {
    setBaseDate(prev => {
      const d = new Date(prev);
      d.setDate(prev.getDate() - 7);
      return d;
    });
  };

  const handleNextWeek = () => {
    setBaseDate(prev => {
      const d = new Date(prev);
      d.setDate(prev.getDate() + 7);
      return d;
    });
  };

  const handleToday = () => {
    setBaseDate(new Date('2026-09-08T00:00:00'));
  };

  const handleCustomDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomDateInput(val);
    if (val) {
      const [y, m, d] = val.split('-').map(Number);
      const newD = new Date(y, m - 1, d);
      setBaseDate(newD);
      setShowDatePicker(false);
    }
  };

  // Helper to calculate hours for a plan
  const getPlanHours = (p: PlanificacionCompleta): number => {
    if (p.numero_horas && p.numero_horas > 0) {
      return p.numero_horas;
    }
    if (p.hora_inicio && p.hora_fin) {
      const [h1, m1] = p.hora_inicio.split(':').map(Number);
      const [h2, m2] = p.hora_fin.split(':').map(Number);
      const diff = (h2 * 60 + m2) - (h1 * 60 + m1);
      if (diff > 0) return diff / 60;
    }
    return 4.0; // fallback standard 4 hours block
  };

  // Determine traffic light state for an aula slot
  const computeSemaforo = (
    aula: AulaLaboratorio,
    formattedDate: string,
    hours: number,
    classes: PlanificacionCompleta[]
  ): SemaforoEstado => {
    const slotKey = `${aula.id_aula_laboratorio}_${formattedDate}`;
    
    // Check manual override first
    if (slotStatusOverrides[slotKey]) {
      return slotStatusOverrides[slotKey];
    }

    // If there are no classes scheduled, it is DISPONIBLE (Verde)
    if (classes.length === 0 || hours === 0) {
      return 'DISPONIBLE';
    }

    // If any class has status 'EN PROCESO', 'PENDIENTE', 'BORRADOR', 'RESERVADO', it is EN_PROCESO (Amarillo)
    const hasInProcessClass = classes.some(c => {
      const st = (c.estado || '').toUpperCase();
      return st.includes('PROCESO') || st.includes('PENDIENTE') || st.includes('BORRADOR') || st.includes('RESERVA');
    });

    if (hasInProcessClass) {
      return 'EN_PROCESO';
    }

    // Otherwise, with confirmed classes assigned, it is OCUPADO (Rojo)
    return 'OCUPADO';
  };

  // Filter classrooms
  const filteredAulas = useMemo(() => {
    return aulas.filter(a => {
      if (selectedBloque !== 'TODOS' && a.bloque_codigo !== selectedBloque) return false;
      if (selectedTipo !== 'TODOS' && a.tipo !== selectedTipo) return false;
      if (selectedSede !== 'TODOS' && a.sede_nombre !== selectedSede) return false;
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchCode = a.codigo.toLowerCase().includes(term);
        const matchName = a.nombre.toLowerCase().includes(term);
        const matchBloque = (a.bloque_nombre || '').toLowerCase().includes(term);
        if (!matchCode && !matchName && !matchBloque) return false;
      }
      return true;
    });
  }, [aulas, selectedBloque, selectedTipo, selectedSede, searchTerm]);

  // Map classrooms and calculate daily hours, classes and semáforo for ALL matching classrooms
  const allRowsData = useMemo(() => {
    return filteredAulas.map(aula => {
      const dayData = weekDays.map(wd => {
        // Find plans for this classroom and day
        const matchedClasses = planificaciones.filter(p => {
          const matchAula = p.id_aula_laboratorio === aula.id_aula_laboratorio || 
                            p.aula_codigo === aula.codigo;
          if (!matchAula) return false;

          // Match day by ID or name
          if (p.id_dia && p.id_dia === wd.dayId) return true;
          if (p.dia_nombre && p.dia_nombre.toUpperCase().includes(wd.dayName)) return true;
          if (p.dia_codigo && wd.dayName.startsWith(p.dia_codigo.toUpperCase())) return true;
          return false;
        });

        // Sum hours
        const totalHours = matchedClasses.reduce((sum, p) => sum + getPlanHours(p), 0);
        const slotKey = `${aula.id_aula_laboratorio}_${wd.formattedDate}`;
        const semaforo = computeSemaforo(aula, wd.formattedDate, totalHours, matchedClasses);

        return {
          wd,
          totalHours,
          classes: matchedClasses,
          semaforo,
          slotKey
        };
      });

      const totalWeeklyHours = dayData.reduce((sum, d) => sum + d.totalHours, 0);

      return {
        aula,
        dayData,
        totalWeeklyHours
      };
    });
  }, [filteredAulas, weekDays, planificaciones, slotStatusOverrides]);

  // Overall Semaforo Statistics across all cells (accurate regardless of which semaforo is filtered)
  const semaforoStats = useMemo(() => {
    let verdeCount = 0;
    let amarilloCount = 0;
    let rojoCount = 0;

    allRowsData.forEach(row => {
      row.dayData.forEach(d => {
        if (d.semaforo === 'DISPONIBLE') verdeCount++;
        else if (d.semaforo === 'EN_PROCESO') amarilloCount++;
        else if (d.semaforo === 'OCUPADO') rojoCount++;
      });
    });

    return { verdeCount, amarilloCount, rojoCount, total: verdeCount + amarilloCount + rojoCount };
  }, [allRowsData]);

  // Matrix data filtered by semaforo
  const matrixData = useMemo(() => {
    if (selectedSemaforoFilter === 'TODOS') return allRowsData;
    return allRowsData.filter(row => row.dayData.some(d => d.semaforo === selectedSemaforoFilter));
  }, [allRowsData, selectedSemaforoFilter]);

  // List of exact matching cells according to selected color filter
  const matchingCells = useMemo(() => {
    if (selectedSemaforoFilter === 'TODOS') return [];
    const list: Array<{
      aula: AulaLaboratorio;
      wd: typeof weekDays[0];
      dayIdx: number;
      totalHours: number;
      classes: PlanificacionCompleta[];
      semaforo: SemaforoEstado;
      slotKey: string;
    }> = [];

    matrixData.forEach(row => {
      row.dayData.forEach((d, dayIdx) => {
        if (d.semaforo === selectedSemaforoFilter) {
          list.push({
            aula: row.aula,
            wd: d.wd,
            dayIdx,
            totalHours: d.totalHours,
            classes: d.classes,
            semaforo: d.semaforo,
            slotKey: d.slotKey
          });
        }
      });
    });

    return list;
  }, [matrixData, selectedSemaforoFilter, weekDays]);

  // Cálculos de paginación para la matriz de aulas
  const totalMatrixItems = matrixData.length;
  const numericPageSize = pageSize === 'all' ? totalMatrixItems || 1 : pageSize;
  const totalMatrixPages = pageSize === 'all' ? 1 : Math.max(1, Math.ceil(totalMatrixItems / numericPageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalMatrixPages);

  const paginatedMatrixData = useMemo(() => {
    if (pageSize === 'all') return matrixData;
    const startIndex = (safeCurrentPage - 1) * numericPageSize;
    return matrixData.slice(startIndex, startIndex + numericPageSize);
  }, [matrixData, safeCurrentPage, numericPageSize, pageSize]);

  // Cálculos de paginación para vista de tarjetas
  const totalDetailItems = matchingCells.length;
  const numericDetailPageSize = detailPageSize === 'all' ? totalDetailItems || 1 : detailPageSize;
  const totalDetailPages = detailPageSize === 'all' ? 1 : Math.max(1, Math.ceil(totalDetailItems / numericDetailPageSize));
  const safeDetailPage = Math.min(Math.max(1, detailPage), totalDetailPages);

  const paginatedMatchingCells = useMemo(() => {
    if (detailPageSize === 'all') return matchingCells;
    const startIndex = (safeDetailPage - 1) * numericDetailPageSize;
    return matchingCells.slice(startIndex, startIndex + numericDetailPageSize);
  }, [matchingCells, safeDetailPage, numericDetailPageSize, detailPageSize]);

  // Column totals across all displayed aulas (only counting matching cells when filtered by color)
  const columnTotals = useMemo(() => {
    return weekDays.map((_, dayIdx) => {
      return matrixData.reduce((sum, row) => {
        const cell = row.dayData[dayIdx];
        if (selectedSemaforoFilter !== 'TODOS' && cell.semaforo !== selectedSemaforoFilter) {
          return sum;
        }
        return sum + cell.totalHours;
      }, 0);
    });
  }, [matrixData, weekDays, selectedSemaforoFilter]);

  // Overall total weekly hours
  const totalGridHours = useMemo(() => {
    return columnTotals.reduce((sum, h) => sum + h, 0);
  }, [columnTotals]);

  // Helper to determine styling strictly matching the user's traffic light rule:
  // - ROJO si está ocupado
  // - VERDE si está disponible
  // - AMARILLO si está en proceso de asignación
  const getSemaforoCellClasses = (semaforo: SemaforoEstado) => {
    switch (semaforo) {
      case 'DISPONIBLE':
        // VERDE - DISPONIBLE
        return {
          bg: 'bg-[#d4f8d3] text-[#0f5132] hover:bg-[#bcf0bc]',
          badge: 'bg-[#2e9c5d] text-white',
          dot: 'bg-[#2e9c5d]',
          label: 'Disponible',
          border: 'border-emerald-300'
        };
      case 'EN_PROCESO':
        // AMARILLO - EN PROCESO DE ASIGNACIÓN
        return {
          bg: 'bg-[#fff3cd] text-[#664d03] hover:bg-[#ffe69c]',
          badge: 'bg-[#d97706] text-white',
          dot: 'bg-[#f59e0b]',
          label: 'En Proceso',
          border: 'border-amber-300'
        };
      case 'OCUPADO':
        // ROJO - OCUPADO
        return {
          bg: 'bg-[#f8d7da] text-[#842029] hover:bg-[#f5c2c7]',
          badge: 'bg-[#dc2626] text-white',
          dot: 'bg-[#ef4444]',
          label: 'Ocupado',
          border: 'border-rose-300'
        };
    }
  };

  // Handle status override from modal
  const handleSetSlotStatus = (slotKey: string, newStatus: SemaforoEstado) => {
    setSlotStatusOverrides(prev => ({
      ...prev,
      [slotKey]: newStatus
    }));

    if (selectedCell && selectedCell.slotKey === slotKey) {
      setSelectedCell({
        ...selectedCell,
        semaforo: newStatus
      });
    }
  };

  const handleResetSlotStatus = (slotKey: string) => {
    setSlotStatusOverrides(prev => {
      const next = { ...prev };
      delete next[slotKey];
      return next;
    });

    if (selectedCell && selectedCell.slotKey === slotKey) {
      const autoSt = computeSemaforo(selectedCell.aula, selectedCell.dateStr, selectedCell.hours, selectedCell.classes);
      setSelectedCell({
        ...selectedCell,
        semaforo: autoSt
      });
    }
  };

  // Generate badges for aula tag (e.g. CAB, CQN, MATRIZ, LAB)
  const getAulaTagBadges = (aula: AulaLaboratorio) => {
    const badges: { text: string; bg: string; textCol: string }[] = [];
    
    if (aula.bloque_codigo) {
      const tag = aula.bloque_codigo === 'BLQ-A' ? 'CAB' :
                  aula.bloque_codigo === 'BLQ-B' ? 'CQS' :
                  aula.bloque_codigo === 'BLQ-C' ? 'CQN' :
                  aula.bloque_codigo === 'BLQ-D' ? 'CQV' : aula.bloque_codigo;
      badges.push({ text: tag, bg: 'bg-[#0099e6]', textCol: 'text-white' });
    }

    if (aula.tipo === 'LABORATORIO') {
      badges.push({ text: 'LAB', bg: 'bg-purple-700', textCol: 'text-white' });
    }

    return badges;
  };

  // Export to CSV
  const handleExportCSV = () => {
    let csv = 'Aula,Sede,Bloque,Tipo,Capacidad,' + 
      weekDays.map(d => `${d.dayName} (${d.formattedDate}) [Horas],Estado Semáforo`).join(',') + 
      ',Total Horas Semanal\n';
    
    matrixData.forEach(row => {
      const aulaStr = `"${row.aula.codigo} - ${row.aula.nombre}"`;
      const sedeStr = `"${row.aula.sede_nombre || ''}"`;
      const blqStr = `"${row.aula.bloque_nombre || ''}"`;
      const tipoStr = `"${row.aula.tipo}"`;
      const capStr = row.aula.capacidad;
      const daysStr = row.dayData.map(d => `${d.totalHours.toFixed(1)} Hrs,${d.semaforo}`).join(',');
      const totStr = `${row.totalWeeklyHours.toFixed(1)} Hrs`;

      csv += `${aulaStr},${sedeStr},${blqStr},${tipoStr},${capStr},${daysStr},${totStr}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Planificacion_Aulas_Semaforo_${weekDays[0].formattedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-2">
      
      {/* Top Controls Bar - Completamente unificado, ordenado y sin quiebres de línea */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-2 sm:p-2.5 shadow-2xs space-y-2">
        
        {/* Fila 1: Navegación de semana y botones de acción unificados */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-1.5">
          
          {/* Botones de navegación semanal */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <div className="inline-flex rounded-md border border-[#237847] bg-[#2e9c5d] shadow-2xs overflow-hidden">
              <button
                onClick={handlePrevWeek}
                className="px-2.5 py-1 text-white hover:bg-[#25824d] text-xs font-bold transition flex items-center gap-1 cursor-pointer active:scale-95"
                title="Semana anterior"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Semana</span>
              </button>

              <button
                onClick={handleToday}
                className="px-2.5 py-1 text-white hover:bg-[#25824d] text-xs font-bold transition flex items-center gap-1 border-l border-emerald-600 cursor-pointer active:scale-95"
                title="Ir a fecha actual / 08-09-2026"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Hoy</span>
              </button>

              <button
                onClick={handleNextWeek}
                className="px-2.5 py-1 text-white hover:bg-[#25824d] text-xs font-bold transition flex items-center gap-1 border-l border-emerald-600 cursor-pointer active:scale-95"
                title="Siguiente semana"
              >
                <span>Semana</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              <div className="relative border-l border-emerald-600">
                <button
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className="px-2.5 py-1 text-white hover:bg-[#25824d] text-xs font-bold transition flex items-center gap-1 cursor-pointer active:scale-95"
                  title="Seleccionar fecha específica"
                >
                  <CalendarDays className="w-3.5 h-3.5" />
                  <span>Fecha</span>
                </button>

                {showDatePicker && (
                  <div className="absolute left-0 mt-1 z-40 bg-white p-2.5 rounded-xl shadow-xl border border-slate-200 animate-in fade-in">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Seleccionar semana a partir de:
                    </label>
                    <input
                      type="date"
                      value={customDateInput}
                      onChange={handleCustomDateChange}
                      className="w-full text-xs p-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2e9c5d] outline-hidden font-mono"
                    />
                    <div className="flex justify-end gap-2 mt-1.5">
                      <button
                        onClick={() => setShowDatePicker(false)}
                        className="px-2 py-0.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 rounded cursor-pointer"
                      >
                        Cerrar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Date range badge */}
            <div className="px-2.5 py-1 bg-purple-50 border border-purple-200 text-[#280740] rounded-md text-xs font-bold flex items-center gap-1.5 shadow-2xs">
              <CalendarDays className="w-3.5 h-3.5 text-[#e5a800]" />
              <span>Semana: {weekDays[0].formattedDate} al {weekDays[6].formattedDate}</span>
            </div>
          </div>

          {/* Acciones principales derecha */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setShowPdfExportModal(true)}
              className="bg-rose-50 hover:bg-rose-100 text-rose-800 px-2.5 py-1 rounded-md text-xs font-bold transition flex items-center gap-1 border border-rose-200 cursor-pointer shadow-2xs hover:border-rose-300 active:scale-95"
              title="Generar y descargar reporte oficial en PDF con jsPDF"
            >
              <FileText className="w-3.5 h-3.5 text-rose-600" />
              <span>Exportar PDF</span>
            </button>

            <button
              onClick={() => ExportController.exportSemaforoAulasXLSX(
                aulas, 
                planificaciones, 
                selectedSemaforoFilter, 
                `Planificacion_Aulas_Semaforo_${weekDays[0].formattedDate}.xlsx`
              )}
              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-md text-xs font-bold transition flex items-center gap-1 border border-emerald-300 cursor-pointer shadow-2xs hover:border-emerald-400 active:scale-95"
              title="Exportar planificación y semáforo de aulas a Microsoft Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Exportar Excel</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-md text-xs font-semibold transition flex items-center gap-1 border border-slate-200 cursor-pointer active:scale-95"
              title="Descargar datos en formato CSV con semaforización"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Exportar CSV</span>
            </button>

            <button
              onClick={onOpenNewModal}
              className="bg-[#e5a800] hover:bg-[#d97706] text-[#280740] px-3 py-1 rounded-md text-xs font-black transition flex items-center gap-1 border border-amber-300 shadow-2xs cursor-pointer active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 text-[#280740]" />
              <span>Nueva Asignación</span>
            </button>
          </div>
        </div>

        {/* Fila 2: Semaforización interactiva unificada (muestra semáforos, conteos y filtra en 1 clic) */}
        <div className="bg-slate-50/90 rounded-lg px-2.5 py-1.5 border border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1 mr-1">
              <CircleDot className="w-3.5 h-3.5 text-[#350854]" />
              Semaforización de Aulas:
            </span>

            {/* Filtro TODOS */}
            <button
              type="button"
              onClick={() => setSelectedSemaforoFilter('TODOS')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold transition cursor-pointer shadow-2xs ${
                selectedSemaforoFilter === 'TODOS'
                  ? 'bg-[#350854] text-white ring-2 ring-purple-300'
                  : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
              }`}
            >
              <span>Todos</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                selectedSemaforoFilter === 'TODOS' ? 'bg-purple-900 text-purple-100' : 'bg-slate-200 text-slate-700'
              }`}>
                {semaforoStats.total}
              </span>
            </button>

            {/* 🔴 ROJO - OCUPADO */}
            <button
              type="button"
              onClick={() => setSelectedSemaforoFilter(selectedSemaforoFilter === 'OCUPADO' ? 'TODOS' : 'OCUPADO')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold transition cursor-pointer shadow-2xs ${
                selectedSemaforoFilter === 'OCUPADO'
                  ? 'bg-[#dc2626] text-white ring-2 ring-red-400 font-black'
                  : 'bg-[#f8d7da] border border-[#f5c2c7] text-[#842029] hover:bg-[#f5c2c7]'
              }`}
              title="Clic para filtrar por aulas ocupadas"
            >
              <span className={`w-2 h-2 rounded-full ${selectedSemaforoFilter === 'OCUPADO' ? 'bg-white' : 'bg-[#dc2626]'} animate-pulse`}></span>
              <span>Rojo: Ocupado</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                selectedSemaforoFilter === 'OCUPADO' ? 'bg-red-900 text-white' : 'bg-[#dc2626] text-white'
              }`}>
                {semaforoStats.rojoCount}
              </span>
            </button>

            {/* 🟡 AMARILLO - EN PROCESO DE ASIGNACIÓN */}
            <button
              type="button"
              onClick={() => setSelectedSemaforoFilter(selectedSemaforoFilter === 'EN_PROCESO' ? 'TODOS' : 'EN_PROCESO')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold transition cursor-pointer shadow-2xs ${
                selectedSemaforoFilter === 'EN_PROCESO'
                  ? 'bg-[#d97706] text-white ring-2 ring-amber-400 font-black'
                  : 'bg-[#fff3cd] border border-[#ffe69c] text-[#664d03] hover:bg-[#ffe69c]'
              }`}
              title="Clic para filtrar por aulas en proceso de asignación"
            >
              <span className={`w-2 h-2 rounded-full ${selectedSemaforoFilter === 'EN_PROCESO' ? 'bg-white' : 'bg-[#f59e0b]'}`}></span>
              <span>Amarillo: En Proceso de Asignación</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                selectedSemaforoFilter === 'EN_PROCESO' ? 'bg-amber-900 text-white' : 'bg-[#d97706] text-white'
              }`}>
                {semaforoStats.amarilloCount}
              </span>
            </button>

            {/* 🟢 VERDE - DISPONIBLE */}
            <button
              type="button"
              onClick={() => setSelectedSemaforoFilter(selectedSemaforoFilter === 'DISPONIBLE' ? 'TODOS' : 'DISPONIBLE')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold transition cursor-pointer shadow-2xs ${
                selectedSemaforoFilter === 'DISPONIBLE'
                  ? 'bg-[#2e9c5d] text-white ring-2 ring-emerald-400 font-black'
                  : 'bg-[#d4f8d3] border border-[#a3e9a4] text-[#0f5132] hover:bg-[#bcf0bc]'
              }`}
              title="Clic para filtrar por aulas disponibles"
            >
              <span className={`w-2 h-2 rounded-full ${selectedSemaforoFilter === 'DISPONIBLE' ? 'bg-white' : 'bg-[#2e9c5d]'}`}></span>
              <span>Verde: Disponible</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                selectedSemaforoFilter === 'DISPONIBLE' ? 'bg-emerald-900 text-white' : 'bg-[#2e9c5d] text-white'
              }`}>
                {semaforoStats.verdeCount}
              </span>
            </button>
          </div>

          {/* Indicador y control de paginación superior */}
          <div className="flex items-center gap-2">
            {selectedSemaforoFilter !== 'TODOS' && (
              <button
                type="button"
                onClick={() => setSelectedSemaforoFilter('TODOS')}
                className="text-[11px] text-[#350854] hover:text-[#550c85] font-bold flex items-center gap-1 bg-purple-100 hover:bg-purple-200 px-2 py-0.5 rounded cursor-pointer transition"
              >
                <span>Mostrar todos</span>
                <X className="w-3 h-3" />
              </button>
            )}

            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2 py-0.5 shadow-2xs">
              <span className="text-[11px] text-slate-600 font-medium">
                <strong className="text-slate-900 font-mono font-bold">{totalMatrixItems}</strong> aulas
                {pageSize !== 'all' && totalMatrixPages > 1 && (
                  <span className="text-slate-500 ml-1">
                    • Pág. <strong className="text-purple-900 font-mono font-bold">{safeCurrentPage}</strong>/{totalMatrixPages}
                  </span>
                )}
              </span>

              {totalMatrixPages > 1 && pageSize !== 'all' && (
                <div className="flex items-center gap-0.5 ml-1 border-l border-slate-200 pl-1">
                  <button
                    type="button"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={safeCurrentPage <= 1}
                    className="p-0.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed transition"
                    title="Página anterior"
                    aria-label="Página anterior"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentPage(p => Math.min(totalMatrixPages, p + 1))}
                    disabled={safeCurrentPage >= totalMatrixPages}
                    className="p-0.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed transition"
                    title="Página siguiente"
                    aria-label="Página siguiente"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Fila 3: Filtros de búsqueda, bloque y tipo integrados compactos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 items-center text-xs">
          {/* Input de búsqueda */}
          <div className="relative lg:col-span-2">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
            <input
              type="text"
              placeholder="Buscar aula por código o nombre (ej: A1, LAB, MATRIZ)..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-[#350854] focus:bg-white outline-hidden"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Bloque selector */}
          <div>
            <select
              value={selectedBloque}
              onChange={e => setSelectedBloque(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-md px-2 py-1.5 text-xs text-slate-700 focus:ring-1 focus:ring-[#350854] outline-hidden font-medium cursor-pointer"
            >
              <option value="TODOS">Todos los Bloques</option>
              {catalogos.bloques.map(b => (
                <option key={b.id_bloque} value={b.codigo}>
                  {b.codigo} - {b.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Tipo selector */}
          <div>
            <select
              value={selectedTipo}
              onChange={e => setSelectedTipo(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-md px-2 py-1.5 text-xs text-slate-700 focus:ring-1 focus:ring-[#350854] outline-hidden font-medium cursor-pointer"
            >
              <option value="TODOS">Todos los Tipos</option>
              <option value="AULA">Solo Aulas Regulares</option>
              <option value="LABORATORIO">Solo Laboratorios</option>
            </select>
          </div>
        </div>
      </div>

      {/* Active Color Filter Banner & View Switcher */}
      {selectedSemaforoFilter !== 'TODOS' && (
        <div className={`p-3 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs ${
          selectedSemaforoFilter === 'OCUPADO'
            ? 'bg-red-50/90 border-red-200 text-red-950'
            : selectedSemaforoFilter === 'EN_PROCESO'
            ? 'bg-amber-50/90 border-amber-200 text-amber-950'
            : 'bg-emerald-50/90 border-emerald-200 text-emerald-950'
        }`}>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold">Desplegando exclusivamente por color:</span>
            <span className={`px-2.5 py-1 rounded-lg text-xs font-black text-white shadow-2xs ${
              selectedSemaforoFilter === 'OCUPADO'
                ? 'bg-[#dc2626]'
                : selectedSemaforoFilter === 'EN_PROCESO'
                ? 'bg-[#d97706]'
                : 'bg-[#2e9c5d]'
            }`}>
              {selectedSemaforoFilter === 'OCUPADO'
                ? '🔴 ROJO: OCUPADO'
                : selectedSemaforoFilter === 'EN_PROCESO'
                ? '🟡 AMARILLO: EN PROCESO'
                : '🟢 VERDE: DISPONIBLE'} ({matchingCells.length} espacios)
            </span>
            <span className="text-[11px] text-slate-600 font-medium hidden md:inline">
              • Solo se muestran los espacios con este estado
            </span>
          </div>

          <div className="flex items-center gap-1.5 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setSemaforoViewMode('matriz')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                semaforoViewMode === 'matriz'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-300 font-black'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Vista Matriz</span>
            </button>
            <button
              type="button"
              onClick={() => setSemaforoViewMode('detalle')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                semaforoViewMode === 'detalle'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-300 font-black'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Lista de Espacios ({matchingCells.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedSemaforoFilter('TODOS')}
              className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-white text-slate-700 hover:bg-slate-100 border border-slate-300 transition cursor-pointer flex items-center gap-1 ml-1"
              title="Restablecer y mostrar todos los colores"
            >
              <X className="w-3.5 h-3.5" />
              <span>Todos</span>
            </button>
          </div>
        </div>
      )}

      {/* Conditionally Render List of Matching Spaces when in 'detalle' view mode */}
      {selectedSemaforoFilter !== 'TODOS' && semaforoViewMode === 'detalle' ? (
        <div className="bg-white rounded-2xl border border-slate-300 shadow-xs p-4 space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <span>Espacios filtrados con estado:</span>
                <span className={`px-2 py-0.5 rounded-lg text-xs font-bold text-white ${
                  selectedSemaforoFilter === 'OCUPADO' ? 'bg-[#dc2626]' : selectedSemaforoFilter === 'EN_PROCESO' ? 'bg-[#d97706]' : 'bg-[#2e9c5d]'
                }`}>
                  {selectedSemaforoFilter}
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Total de {matchingCells.length} espacios encontrados en la semana seleccionada
              </p>
            </div>
          </div>

          {matchingCells.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              No hay espacios que coincidan con este estado en el rango de fechas seleccionado.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {paginatedMatchingCells.map(({ aula, wd, dayIdx, totalHours, classes, semaforo, slotKey }) => {
                const semStyle = getSemaforoCellClasses(semaforo);

                return (
                  <div
                    key={slotKey}
                    onClick={() => {
                      setSelectedCell({
                        aula,
                        date: wd.date,
                        dateStr: wd.formattedDate,
                        dayIndex: dayIdx,
                        dayName: wd.dayName,
                        hours: totalHours,
                        classes,
                        semaforo,
                        slotKey
                      });
                    }}
                    className={`p-3 rounded-xl border transition-all cursor-pointer text-left shadow-2xs hover:shadow-md flex flex-col justify-between gap-2 ${
                      semaforo === 'OCUPADO'
                        ? 'bg-red-50/50 border-red-200 hover:border-red-400'
                        : semaforo === 'EN_PROCESO'
                        ? 'bg-amber-50/50 border-amber-200 hover:border-amber-400'
                        : 'bg-emerald-50/50 border-emerald-200 hover:border-emerald-400'
                    }`}
                  >
                    <div>
                      {/* Top row: Aula code and status badge */}
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-white text-slate-900 border border-slate-200 shadow-2xs">
                          {aula.codigo}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${semStyle.badge}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                          {semStyle.label}
                        </span>
                      </div>

                      {/* Day and date */}
                      <div className="mt-2 text-xs font-bold text-slate-800">
                        {wd.dayName}, {wd.formattedDate}
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium">
                        {aula.nombre} • Cap. {aula.capacidad} est.
                      </div>

                      {/* Classes summary */}
                      {classes.length > 0 ? (
                        <div className="mt-2 pt-2 border-t border-slate-200/80 space-y-1">
                          {classes.map(p => (
                            <div key={p.id_planificacion} className="text-[10px] bg-white/80 p-1.5 rounded border border-slate-200/60">
                              <div className="font-bold text-slate-900 truncate">
                                {p.asignatura_nombre}
                              </div>
                              <div className="text-slate-600 font-mono text-[9px]">
                                {p.hora_inicio} - {p.hora_fin} • {p.docente_apellidos}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="mt-2 pt-2 border-t border-slate-200/80 text-[10px] text-slate-400 italic">
                          Sin clases asignadas ({totalHours.toFixed(1)} :Hrs)
                        </div>
                      )}
                    </div>

                    <div className="mt-1 pt-1.5 border-t border-slate-200/60 flex items-center justify-between text-[10px]">
                      <span className="font-mono font-bold text-slate-700">
                        {totalHours.toFixed(1)} :Hrs
                      </span>
                      <span className="text-indigo-600 font-bold hover:underline">
                        Gestionar &rarr;
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Paginación para vista de tarjetas */}
            {totalDetailItems > 0 && (
              <PaginationControls
                currentPage={safeDetailPage}
                totalItems={totalDetailItems}
                pageSize={detailPageSize}
                pageSizeOptions={[8, 12, 16, 24, 'all']}
                itemName="espacios"
                onPageChange={page => setDetailPage(page)}
                onPageSizeChange={size => {
                  setDetailPageSize(size);
                  setDetailPage(1);
                }}
              />
            )}
          </div>
          )}
        </div>
      ) : (
        /* Main Matrix Table with SEMAFORIZACIÓN: displays strictly according to selected color */
        <div className="space-y-3">
          <div className="bg-white rounded-2xl border border-slate-300 shadow-xs overflow-hidden">
          <div className="overflow-x-auto touch-pan-x">
            <table className="table-planificacion-aulas w-full text-left text-xs whitespace-nowrap border-collapse border border-slate-300">
              
              {/* Header row: Aula + 7 dates (DD-MM-YYYY) */}
              <thead className="bg-[#f8fafc] text-slate-700 select-none text-[11px]">
                <tr>
                  {/* Column 1: Aula */}
                  <th className="py-3 px-3.5 font-bold uppercase tracking-wider w-48 sm:w-64 border-r border-slate-300 border-b-2 border-slate-300 bg-white shadow-2xs">
                    AULA
                  </th>

                  {/* 7 Date columns */}
                  {weekDays.map(wd => (
                    <th
                      key={wd.dayId}
                      className="py-3 px-3 font-semibold text-center border-r border-slate-300 border-b-2 border-slate-300 min-w-[110px] sm:min-w-[130px] bg-[#f8fafc]"
                    >
                      <div className="text-[11px] font-mono font-bold text-slate-800">
                        {wd.formattedDate}
                      </div>
                      <div className="text-[9.5px] text-slate-500 font-semibold tracking-wider">
                        {wd.dayName}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              {/* Table Rows (Classrooms) */}
              <tbody className="text-xs">
                {matrixData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 border-b border-slate-300">
                      No se encontraron aulas con el estado de semaforización seleccionado.
                    </td>
                  </tr>
                ) : (
                  paginatedMatrixData.map(({ aula, dayData }) => {
                    const tagBadges = getAulaTagBadges(aula);

                    return (
                      <tr 
                        key={aula.id_aula_laboratorio}
                        className="hover:bg-slate-50/50 transition-colors group"
                      >
                        {/* Aula Column */}
                        <td className="py-2.5 px-3.5 border-r border-slate-300 border-b border-slate-300 bg-white font-medium">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-slate-900 text-xs">
                              {aula.codigo}
                            </span>

                            {tagBadges.map((badge, idx) => (
                              <span 
                                key={idx}
                                className={`text-[9.5px] font-bold px-1.5 py-0.2 rounded ${badge.bg} ${badge.textCol} tracking-tight`}
                              >
                                {badge.text}
                              </span>
                            ))}
                          </div>

                          <div className="text-[10px] text-slate-400 truncate max-w-[200px] mt-0.5">
                            {aula.nombre} • Cap. {aula.capacidad} est.
                          </div>
                        </td>

                        {/* 7 Daily Hour Cells formatted with SEMAFORIZACIÓN:
                            Displays STRICTLY according to the selected color filter.
                            Non-matching cells are displayed as neutral empty dashes (—)
                            so other colors do not appear.
                        */}
                        {dayData.map((d, dayIdx) => {
                          const semStyle = getSemaforoCellClasses(d.semaforo);
                          const isMatch = selectedSemaforoFilter === 'TODOS' || d.semaforo === selectedSemaforoFilter;

                          if (!isMatch) {
                            return (
                              <td
                                key={d.wd.dayId}
                                className="py-2 px-2 text-center border-r border-slate-200 border-b border-slate-200 bg-slate-50/40 select-none text-slate-300"
                                title={`Estado diferente a ${selectedSemaforoFilter}`}
                              >
                                <span className="font-mono text-xs text-slate-300 select-none">—</span>
                              </td>
                            );
                          }

                          return (
                            <td
                              key={d.wd.dayId}
                              onClick={() => {
                                setSelectedCell({
                                  aula,
                                  date: d.wd.date,
                                  dateStr: d.wd.formattedDate,
                                  dayIndex: dayIdx,
                                  dayName: d.wd.dayName,
                                  hours: d.totalHours,
                                  classes: d.classes,
                                  semaforo: d.semaforo,
                                  slotKey: d.slotKey
                                });
                              }}
                              className={`py-2 px-2 text-center border-r border-slate-300 border-b border-slate-300 cursor-pointer transition-all ${semStyle.bg} select-none group/cell`}
                              title={`Haga clic para gestionar: ${aula.codigo} - ${d.wd.dayName} (${semStyle.label} - ${d.totalHours.toFixed(1)} :Hrs)`}
                            >
                              <div className="flex flex-col items-center justify-center">
                                {/* Hours display matching X.X :Hrs */}
                                <div className="font-mono text-xs font-bold tracking-tight">
                                  {d.totalHours.toFixed(1)} :Hrs
                                </div>

                                {/* Semaforización Badge with colored dot */}
                                <div className="flex items-center gap-1 mt-0.5">
                                  <span className={`w-1.5 h-1.5 rounded-full ${semStyle.dot}`}></span>
                                  <span className="text-[9.5px] font-bold tracking-tight opacity-90">
                                    {semStyle.label}
                                  </span>
                                </div>

                                {/* Class count if occupied or in process */}
                                {d.classes.length > 0 && (
                                  <div className="text-[8.5px] opacity-75 leading-none mt-0.5">
                                    {d.classes.length} {d.classes.length === 1 ? 'clase' : 'clases'}
                                  </div>
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })
                )}
              </tbody>

              {/* Table Footer: Column totals */}
              <tfoot className="bg-[#f1f5f9] font-bold text-xs text-slate-800">
                <tr>
                  <td className="py-2.5 px-3.5 border-r border-slate-300 border-b border-slate-300">
                    <div className="flex items-center justify-between">
                      <span>Total ({matrixData.length} aulas)</span>
                      <span className="text-[10px] font-mono text-purple-900 bg-purple-100 px-1.5 py-0.5 rounded border border-purple-200">
                        {totalGridHours.toFixed(1)} hrs/sem
                      </span>
                    </div>
                  </td>

                  {columnTotals.map((tot, idx) => (
                    <td
                      key={idx}
                      className="py-2.5 px-2 text-center font-mono border-r border-slate-300 border-b border-slate-300 text-slate-900 font-bold"
                    >
                      <div>{tot.toFixed(1)} :Hrs</div>
                      <div className="text-[9px] text-slate-500 font-normal">
                        {weekDays[idx].shortName}
                      </div>
                    </td>
                  ))}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Barra de Paginación de Aulas una vez que abarca la pantalla */}
        {totalMatrixItems > 0 && (
          <div className="pt-0.5">
            <PaginationControls
              currentPage={safeCurrentPage}
              totalItems={totalMatrixItems}
              pageSize={pageSize}
              pageSizeOptions={[10, 15, 20, 25, 40, 'all']}
              itemName="aulas"
              onPageChange={page => setCurrentPage(page)}
              onPageSizeChange={size => {
                setPageSize(size);
                setCurrentPage(1);
              }}
            />
          </div>
        )}
        </div>
      )}

      {/* Cell Detail & Status Management Modal */}
      {selectedCell && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            {/* Header */}
            <div className="bg-[#280740] text-white p-4 flex items-center justify-between border-b-2 border-[#e5a800]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-400/20 text-amber-300 rounded-xl border border-amber-400/30">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                    <span>{selectedCell.aula.codigo} - {selectedCell.aula.nombre}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#e5a800] text-[#280740]">
                      {selectedCell.hours.toFixed(1)} :Hrs
                    </span>
                  </h3>
                  <p className="text-xs text-purple-200">
                    {selectedCell.dayName}, {selectedCell.dateStr} • {selectedCell.aula.bloque_nombre}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedCell(null)}
                className="text-purple-300 hover:text-white p-1 rounded-lg hover:bg-purple-900/60 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              
              {/* CURRENT SEMAFORO STATE & CONTROL BUTTONS */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Estado de Semaforización:</span>
                  
                  {/* Current Status Badge */}
                  {selectedCell.semaforo === 'OCUPADO' && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#f8d7da] border border-[#f5c2c7] text-[#842029] font-bold text-xs">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#dc2626]"></span>
                      🔴 Ocupado
                    </span>
                  )}
                  {selectedCell.semaforo === 'EN_PROCESO' && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#fff3cd] border border-[#ffe69c] text-[#664d03] font-bold text-xs">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]"></span>
                      🟡 En Proceso de Asignación
                    </span>
                  )}
                  {selectedCell.semaforo === 'DISPONIBLE' && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#d4f8d3] border border-[#a3e9a4] text-[#0f5132] font-bold text-xs">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#2e9c5d]"></span>
                      🟢 Disponible
                    </span>
                  )}
                </div>

                {/* Quick actions to change or override semaforo */}
                <div className="pt-2 border-t border-slate-200">
                  <p className="text-[11px] text-slate-500 mb-1.5">
                    Modificar estado del espacio para esta fecha:
                  </p>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      onClick={() => handleSetSlotStatus(selectedCell.slotKey, 'OCUPADO')}
                      className={`px-2 py-1.5 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1 border cursor-pointer ${
                        selectedCell.semaforo === 'OCUPADO'
                          ? 'bg-[#dc2626] text-white border-red-600 shadow-xs'
                          : 'bg-white text-rose-700 border-rose-200 hover:bg-rose-50'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-red-500"></span>
                      <span>Ocupado</span>
                    </button>

                    <button
                      onClick={() => handleSetSlotStatus(selectedCell.slotKey, 'EN_PROCESO')}
                      className={`px-2 py-1.5 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1 border cursor-pointer ${
                        selectedCell.semaforo === 'EN_PROCESO'
                          ? 'bg-[#d97706] text-white border-amber-600 shadow-xs'
                          : 'bg-white text-amber-800 border-amber-200 hover:bg-amber-50'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      <span>En Proceso</span>
                    </button>

                    <button
                      onClick={() => handleSetSlotStatus(selectedCell.slotKey, 'DISPONIBLE')}
                      className={`px-2 py-1.5 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1 border cursor-pointer ${
                        selectedCell.semaforo === 'DISPONIBLE'
                          ? 'bg-[#2e9c5d] text-white border-emerald-600 shadow-xs'
                          : 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>Disponible</span>
                    </button>
                  </div>

                  {slotStatusOverrides[selectedCell.slotKey] && (
                    <button
                      onClick={() => handleResetSlotStatus(selectedCell.slotKey)}
                      className="mt-2 text-[10px] text-slate-500 hover:text-slate-800 flex items-center gap-1 underline"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Restablecer a cálculo automático por clases</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Classroom specs bar */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <div className="text-slate-400 text-[10px] font-semibold">Tipo</div>
                  <div className="font-bold text-slate-800">{selectedCell.aula.tipo}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px] font-semibold">Capacidad</div>
                  <div className="font-bold text-[#280740] font-mono">{selectedCell.aula.capacidad} est.</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px] font-semibold">Estado Base</div>
                  <div className="font-bold text-emerald-700">{selectedCell.aula.estado}</div>
                </div>
              </div>

              {/* List of classes scheduled on this day */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Clases Asignadas ({selectedCell.classes.length})</span>
                  <span className="text-slate-400 text-[11px] font-mono font-normal">
                    Total: {selectedCell.hours.toFixed(1)} hrs
                  </span>
                </h4>

                {selectedCell.classes.length === 0 ? (
                  <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                    <p className="text-xs font-bold text-slate-700">Espacio Disponible (Verde)</p>
                    <p className="text-[11px] text-slate-500">
                      No hay clases planificadas para este día en {selectedCell.aula.codigo}.
                    </p>
                    <button
                      onClick={() => {
                        setSelectedCell(null);
                        onOpenNewModal();
                      }}
                      className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#e5a800] hover:bg-[#d97706] text-[#280740] font-black rounded-lg text-xs transition shadow-xs cursor-pointer border border-amber-300"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Asignar Clase Aquí</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {selectedCell.classes.map((plan, idx) => (
                      <div
                        key={plan.id_planificacion || idx}
                        className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-purple-300 transition space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-bold font-mono text-[#350854] bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                              {plan.asignatura_codigo}
                            </span>
                            <h5 className="text-xs font-bold text-slate-900 mt-1">
                              {plan.asignatura_nombre}
                            </h5>
                          </div>

                          <div className="text-right">
                            <span className="text-[11px] font-bold font-mono text-purple-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                              🕒 {plan.hora_inicio || '08:00'} - {plan.hora_fin || '12:00'}
                            </span>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              {getPlanHours(plan).toFixed(1)} hrs
                            </div>
                          </div>
                        </div>

                        <div className="text-[11px] text-slate-600 space-y-0.5 pt-1 border-t border-slate-100">
                          <div>
                            <strong>Docente:</strong> {plan.docente_nombres} {plan.docente_apellidos}
                          </div>
                          <div>
                            <strong>Carrera:</strong> {plan.carrera_nombre} • {plan.nivel_nombre} (Paralelo {plan.paralelo_codigo})
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                            <span>Estudiantes: <strong>{plan.numero_estudiantes}</strong></span>
                            <span>Aforo ocupado: <strong>{Math.round((plan.numero_estudiantes / (selectedCell.aula.capacidad || 1)) * 100)}%</strong></span>
                          </div>
                        </div>

                        {onSelectPlan && (
                          <button
                            onClick={() => {
                              setSelectedCell(null);
                              onSelectPlan(plan);
                            }}
                            className="w-full text-center text-[11px] font-bold text-[#350854] hover:text-[#280740] bg-purple-50 hover:bg-purple-100 py-1 rounded-lg transition cursor-pointer"
                          >
                            Ver Ficha Completa de Asignación →
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
              <div className="text-[11px] text-slate-500">
                Semáforo: <strong className="font-semibold">{selectedCell.semaforo}</strong>
              </div>
              <button
                onClick={() => setSelectedCell(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs rounded-xl transition cursor-pointer"
              >
                Cerrar
              </button>
            </div>

          </div>
        </div>
      )}

      {/* PDF Export Modal (jsPDF service) */}
      <ModalExportarPdfPlanificacion
        isOpen={showPdfExportModal}
        onClose={() => setShowPdfExportModal(false)}
        matrixData={matrixData}
        weekDays={weekDays}
        columnTotals={columnTotals}
        totalGridHours={totalGridHours}
        semaforoStats={semaforoStats}
        planificaciones={planificaciones}
        activeFilters={{
          bloque: selectedBloque,
          tipo: selectedTipo,
          semaforo: selectedSemaforoFilter,
          busqueda: searchTerm
        }}
      />
    </div>
  );
};
