import React, { useState } from 'react';
import { Catalogos, AulaLaboratorio, PlanificacionCompleta } from '../types.ts';
import { ExportController } from '../controllers/exportController.ts';
import { 
  FileSpreadsheet, 
  FileText, 
  Download, 
  Building2, 
  Users, 
  Calendar, 
  Layers, 
  PieChart, 
  BarChart3, 
  CheckCircle, 
  ShieldCheck,
  Sparkles
} from 'lucide-react';

interface ReportesViewProps {
  catalogos: Catalogos;
  aulas: AulaLaboratorio[];
  planificaciones: PlanificacionCompleta[];
}

export const ReportesView: React.FC<ReportesViewProps> = ({
  catalogos,
  aulas,
  planificaciones
}) => {
  const totalCapacidad = aulas.reduce((sum, a) => sum + a.capacidad, 0);
  const aulasDisponibles = aulas.filter(a => a.estado === 'DISPONIBLE').length;
  const totalEstudiantes = planificaciones.reduce((sum, p) => sum + p.numero_estudiantes, 0);
  const cursosUnificados = planificaciones.filter(p => p.curso_unificado === 1);

  // Group by Bloque
  const aulasPorBloque = catalogos.bloques.map(b => {
    const aulasB = aulas.filter(a => a.id_bloque === b.id_bloque);
    const capB = aulasB.reduce((s, a) => s + a.capacidad, 0);
    const planB = planificaciones.filter(p => p.id_bloque === b.id_bloque);
    return {
      bloque: b,
      totalAulas: aulasB.length,
      capacidad: capB,
      asignaciones: planB.length
    };
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
            Centro de Reportes y Toma de Decisiones
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Generación y descarga de informes ejecutivos en formatos PDF Oficial, Planilla Excel (XLSX) y Archivo Plano (CSV).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            Datos 100% Verificados SQLite
          </span>
        </div>
      </div>

      {/* THREE EXPORT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Asignaciones de Aulas */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between hover:shadow-md transition">
          <div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              Reporte Integral de Asignación de Aulas
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Detalla cada espacio educativo asignado con sede, bloque, piso, aula, tipo, capacidad, número de estudiantes, asignatura, docente, día, horario, jornada y cursos unificados.
            </p>
            <div className="mt-3 text-[11px] font-semibold text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
              Total registros: <strong>{planificaciones.length} asignaciones</strong>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 flex flex-col gap-2">
            <button
              onClick={() => ExportController.exportPlanificacionesDetallePDF({
                planificaciones,
                titulo: 'REPORTE OFICIAL DE ASIGNACIÓN DE AULAS Y ESPACIOS EDUCATIVOS',
                subtitulo: 'Periodo Académico 2026-1 • Sede Matriz Quito • Instituto Superior Universitario'
              })}
              className="w-full py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
            >
              <FileText className="w-4 h-4" />
              <span>Descargar Reporte PDF (jsPDF)</span>
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => ExportController.exportAsignacionesXLSX(planificaciones)}
                className="py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Excel (XLSX)</span>
              </button>
              <button
                onClick={() => ExportController.exportAsignacionesCSV(planificaciones)}
                className="py-1.5 px-2 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV Plano</span>
              </button>
            </div>
          </div>
        </div>

        {/* Card 2: Inventario de Aulas */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between hover:shadow-md transition">
          <div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
              <Building2 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              Inventario de Aulas y Laboratorios
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Consolidado de las 40 aulas y laboratorios de los Bloques A, B, C y E, especificando piso, tipo, capacidad en puestos, estado operativo y número de clases en curso.
            </p>
            <div className="mt-3 text-[11px] font-semibold text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
              Capacidad total: <strong>{totalCapacidad} puestos ({aulas.length} espacios)</strong>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 flex flex-col gap-2">
            <button
              onClick={() => ExportController.exportAulasPDF(aulas)}
              className="w-full py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
            >
              <FileText className="w-4 h-4" />
              <span>Descargar Inventario PDF</span>
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => ExportController.exportAulasXLSX(aulas)}
                className="py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Excel (XLSX)</span>
              </button>
              <button
                onClick={() => ExportController.exportAulasCSV(aulas)}
                className="py-1.5 px-2 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV Plano</span>
              </button>
            </div>
          </div>
        </div>

        {/* Card 3: Cursos Unificados y Optimización */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between hover:shadow-md transition">
          <div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              Cursos Unificados y Compartidos
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Reporte de asignaturas fusionadas entre carreras para optimizar el uso de infraestructura física y evitar subutilización de aulas de gran capacidad.
            </p>
            <div className="mt-3 text-[11px] font-semibold text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
              Total unificados: <strong>{cursosUnificados.length} grupos fusionados</strong>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 flex flex-col gap-2">
            <button
              onClick={() => ExportController.exportAsignacionesPDF(cursosUnificados, 'reporte_cursos_unificados_isuj.pdf')}
              className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
            >
              <FileText className="w-4 h-4" />
              <span>Exportar Unificados PDF</span>
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => ExportController.exportAsignacionesXLSX(cursosUnificados, 'cursos_unificados_isuj.xlsx')}
                className="py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Excel (XLSX)</span>
              </button>
              <button
                onClick={() => ExportController.exportAsignacionesCSV(cursosUnificados, 'cursos_unificados_isuj.csv')}
                className="py-1.5 px-2 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* INFRAESTRUCTURA STATS TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              Resumen Gerencial de Ocupación por Bloque Físico
            </h3>
            <p className="text-xs text-slate-500">
              Indicadores cuantitativos de soporte a la toma de decisiones para distribución de grupos en Sede Matriz Quito
            </p>
          </div>
          <button
            onClick={() => ExportController.exportBloquesXLSX(catalogos.bloques, aulas, 'reporte_gerencial_bloques_isuj.xlsx')}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto shrink-0 shadow-xs"
            title="Exportar reporte de ocupación de bloques a Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Exportar Bloques (XLSX)</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 border-y border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Bloque</th>
                <th className="py-2.5 px-3">Código</th>
                <th className="py-2.5 px-3">Número de Pisos</th>
                <th className="py-2.5 px-3">Espacios Físicos</th>
                <th className="py-2.5 px-3">Capacidad Instalada</th>
                <th className="py-2.5 px-3">Asignaciones Actuales</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {aulasPorBloque.map(item => (
                <tr key={item.bloque.id_bloque} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-3 font-bold text-slate-900">{item.bloque.nombre}</td>
                  <td className="py-3 px-3 font-mono text-indigo-700">{item.bloque.codigo}</td>
                  <td className="py-3 px-3 text-slate-700">{item.bloque.numero_pisos} pisos</td>
                  <td className="py-3 px-3 text-slate-800">{item.totalAulas} aulas / labs</td>
                  <td className="py-3 px-3 font-bold text-slate-900">{item.capacidad} estudiantes</td>
                  <td className="py-3 px-3 font-semibold text-emerald-700">{item.asignaciones} asignadas</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
