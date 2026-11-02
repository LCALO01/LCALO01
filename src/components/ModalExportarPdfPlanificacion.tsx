import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  X, 
  Calendar, 
  Layers, 
  CheckCircle2, 
  Filter, 
  Loader2,
  Table as TableIcon
} from 'lucide-react';
import { 
  PdfReportService, 
  WeeklyMatrixRowData, 
  WeeklyMatrixDay, 
  SemaforoStats 
} from '../services/pdfReportService.ts';
import { PlanificacionCompleta } from '../types.ts';

interface ModalExportarPdfPlanificacionProps {
  isOpen: boolean;
  onClose: () => void;
  matrixData: WeeklyMatrixRowData[];
  weekDays: WeeklyMatrixDay[];
  columnTotals: number[];
  totalGridHours: number;
  semaforoStats: SemaforoStats;
  planificaciones: PlanificacionCompleta[];
  activeFilters: {
    bloque: string;
    tipo: string;
    semaforo: string;
    busqueda: string;
  };
}

export const ModalExportarPdfPlanificacion: React.FC<ModalExportarPdfPlanificacionProps> = ({
  isOpen,
  onClose,
  matrixData,
  weekDays,
  columnTotals,
  totalGridHours,
  semaforoStats,
  planificaciones,
  activeFilters
}) => {
  const [reportType, setReportType] = useState<'matriz' | 'detalle'>('matriz');
  const [includeOnlyFiltered, setIncludeOnlyFiltered] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const fechaInicio = weekDays[0]?.formattedDate || '';
  const fechaFin = weekDays[6]?.formattedDate || '';

  const handleGeneratePdf = () => {
    setIsGenerating(true);
    setSuccessMessage(null);

    // Short timeout to allow loader render
    setTimeout(() => {
      try {
        if (reportType === 'matriz') {
          // Export weekly matrix with traffic lights
          PdfReportService.exportPlanificacionSemanalPDF({
            matrixData,
            weekDays,
            columnTotals,
            totalGridHours,
            semaforoStats,
            filtros: includeOnlyFiltered ? activeFilters : undefined,
            filename: `Planificacion_Aulas_Semaforo_${fechaInicio}.pdf`
          });
          setSuccessMessage('¡Reporte de Matriz Semanal con Semaforización generado exitosamente!');
        } else {
          // Export detailed list of active class schedules
          PdfReportService.exportPlanificacionesDetallePDF({
            planificaciones,
            titulo: 'REPORTE OFICIAL DE ASIGNACIONES Y PLANIFICACIÓN DE AULAS',
            subtitulo: `Periodo Académico 2026-1 • Semana del ${fechaInicio} al ${fechaFin} • Sede Matriz`,
            filtrosAplicados: includeOnlyFiltered ? {
              'Bloque': activeFilters.bloque !== 'TODOS' ? activeFilters.bloque : '',
              'Tipo': activeFilters.tipo !== 'TODOS' ? activeFilters.tipo : '',
              'Semáforo': activeFilters.semaforo !== 'TODOS' ? activeFilters.semaforo : '',
              'Búsqueda': activeFilters.busqueda
            } : undefined,
            filename: `Planificaciones_Aulas_Detalle_${fechaInicio}.pdf`
          });
          setSuccessMessage('¡Reporte Detallado de Planificaciones generado exitosamente!');
        }
      } catch (err: any) {
        console.error('Error al exportar PDF:', err);
        alert('Hubo un error al generar el archivo PDF: ' + (err?.message || 'Error desconocido'));
      } finally {
        setIsGenerating(false);
      }
    }, 150);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#280740] text-white p-4 flex items-center justify-between border-b-2 border-[#e5a800]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center border border-white/20">
              <FileText className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">
                Exportar Reporte en PDF (jsPDF)
              </h3>
              <p className="text-[11px] text-amber-200">
                Planificación Actual de Aulas • Semana {fechaInicio} al {fechaFin}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-lg transition text-slate-300 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto">
          
          {/* Tipo de reporte Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-2">
              Seleccione el formato de reporte:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              {/* Option 1: Matriz Semanal con Semaforización */}
              <button
                type="button"
                onClick={() => setReportType('matriz')}
                className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  reportType === 'matriz'
                    ? 'border-[#280740] bg-purple-50/50 ring-2 ring-[#280740]/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-[#280740]">
                    <TableIcon className="w-4 h-4 text-[#e5a800]" />
                    <span>Matriz Semanal</span>
                  </div>
                  {reportType === 'matriz' && (
                    <span className="w-2 h-2 rounded-full bg-[#280740]"></span>
                  )}
                </div>
                <p className="text-[10.5px] text-slate-600 leading-snug">
                  Cuadrícula de aulas por fecha con colores de <strong>Semaforización</strong> (Rojo, Amarillo, Verde), horas y totales.
                </p>
                <div className="mt-2 text-[9.5px] font-bold text-purple-700 bg-purple-100/60 px-1.5 py-0.5 rounded w-fit">
                  {matrixData.length} aulas incluidas
                </div>
              </button>

              {/* Option 2: Detalle de Planificaciones */}
              <button
                type="button"
                onClick={() => setReportType('detalle')}
                className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  reportType === 'detalle'
                    ? 'border-[#280740] bg-purple-50/50 ring-2 ring-[#280740]/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-[#280740]">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    <span>Listado Detallado</span>
                  </div>
                  {reportType === 'detalle' && (
                    <span className="w-2 h-2 rounded-full bg-[#280740]"></span>
                  )}
                </div>
                <p className="text-[10.5px] text-slate-600 leading-snug">
                  Tabla exhaustiva de cursos activos con docente, asignatura, horario, cupos, jornada y estado.
                </p>
                <div className="mt-2 text-[9.5px] font-bold text-indigo-700 bg-indigo-100/60 px-1.5 py-0.5 rounded w-fit">
                  {planificaciones.length} asignaciones
                </div>
              </button>
            </div>
          </div>

          {/* Resumen del contenido a exportar */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-2">
            <div className="font-bold text-slate-800 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#e5a800]" />
                Rango y Parámetros del Reporte
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Orientación: Paisaje (Landscape)</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-200/80">
              <div>
                <span className="text-slate-500">Semana académica:</span>
                <p className="font-bold text-slate-800">{fechaInicio} al {fechaFin}</p>
              </div>
              <div>
                <span className="text-slate-500">Horas registradas:</span>
                <p className="font-bold text-purple-900">{totalGridHours.toFixed(1)} :Hrs semanales</p>
              </div>
            </div>

            {/* Semaforización Pill preview */}
            <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between flex-wrap gap-1.5">
              <span className="text-[10.5px] font-semibold text-slate-600">Semaforización:</span>
              <div className="flex items-center gap-1.5 text-[10px] font-bold">
                <span className="px-1.5 py-0.5 rounded bg-[#f8d7da] text-[#842029] border border-[#f5c2c7]">
                  🔴 Ocupado: {semaforoStats.rojoCount}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-[#fff3cd] text-[#664d03] border border-[#ffe69c]">
                  🟡 Proceso: {semaforoStats.amarilloCount}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-[#d4f8d3] text-[#0f5132] border border-[#a3e9a4]">
                  🟢 Libre: {semaforoStats.verdeCount}
                </span>
              </div>
            </div>
          </div>

          {/* Opción de Filtros */}
          <div className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-slate-200 text-xs">
            <label htmlFor="chk-filtros" className="flex items-center gap-2 cursor-pointer select-none">
              <input 
                id="chk-filtros"
                type="checkbox"
                checked={includeOnlyFiltered}
                onChange={e => setIncludeOnlyFiltered(e.target.checked)}
                className="w-4 h-4 rounded text-purple-700 focus:ring-purple-600 border-slate-300 cursor-pointer"
              />
              <span className="text-slate-700 font-medium">
                Aplicar filtros activos en pantalla (Bloque, Tipo, Búsqueda)
              </span>
            </label>
            <Filter className="w-3.5 h-3.5 text-slate-400" />
          </div>

          {/* Mensaje de confirmación o éxito */}
          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition cursor-pointer"
          >
            Cerrar
          </button>

          <button
            type="button"
            onClick={handleGeneratePdf}
            disabled={isGenerating}
            className="px-5 py-2 bg-[#280740] hover:bg-[#3b0b5e] text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50 active:scale-95 border-b-2 border-[#e5a800]"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                <span>Generando Documento...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 text-amber-300" />
                <span>Descargar PDF</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
