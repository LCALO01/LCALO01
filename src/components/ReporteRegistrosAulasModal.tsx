import React from 'react';
import { AulaLaboratorio, PlanificacionCompleta } from '../types.ts';
import { ExportController } from '../controllers/exportController.ts';
import { 
  Building2, 
  X, 
  Printer, 
  Download, 
  FileText, 
  FileSpreadsheet, 
  CheckCircle2, 
  Layers, 
  Users,
  ShieldCheck,
  Calendar
} from 'lucide-react';

interface ReporteRegistrosAulasModalProps {
  isOpen: boolean;
  onClose: () => void;
  aulas: AulaLaboratorio[];
  planificaciones?: PlanificacionCompleta[];
  filtroBloque?: string;
  filtroTipo?: string;
  filtroEstado?: string;
}

export const ReporteRegistrosAulasModal: React.FC<ReporteRegistrosAulasModalProps> = ({
  isOpen,
  onClose,
  aulas,
  planificaciones = [],
  filtroBloque,
  filtroTipo,
  filtroEstado
}) => {
  if (!isOpen) return null;

  const getEstudiantesAula = (aula: AulaLaboratorio) => {
    if (planificaciones && planificaciones.length > 0) {
      const plans = planificaciones.filter(p => p.id_aula_laboratorio === aula.id_aula_laboratorio && p.estado === 'ACTIVO');
      if (plans.length > 0) {
        return Math.max(...plans.map(p => p.numero_estudiantes));
      }
    }
    return aula.max_estudiantes || aula.total_estudiantes || 0;
  };

  const totalPuestos = aulas.reduce((acc, a) => acc + a.capacidad, 0);
  const totalEstudiantes = aulas.reduce((acc, a) => acc + getEstudiantesAula(a), 0);
  const totalDisponibles = aulas.filter(a => a.estado === 'DISPONIBLE').length;
  const totalOcupadas = aulas.filter(a => a.estado === 'OCUPADO').length;
  const totalMantenimiento = aulas.filter(a => a.estado === 'MANTENIMIENTO').length;
  const totalInactivas = aulas.filter(a => a.estado === 'INACTIVO').length;

  const handlePrint = () => {
    window.print();
  };

  const fechaActual = new Date().toLocaleDateString('es-EC', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Top Modal Controls (No print) */}
        <div className="print:hidden bg-[#280740] text-white p-4 flex items-center justify-between border-b-2 border-[#e5a800] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-400/20 text-amber-300 rounded-xl border border-amber-400/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>Reporte de Registros: Inventario de Aulas y Espacios</span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-[#e5a800] text-[#280740]">
                  Oficial ISUJ
                </span>
              </h3>
              <p className="text-xs text-purple-200">
                Formato institucional en registros tabulares con detalle de capacidad y estado
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg border border-slate-700 transition cursor-pointer"
              title="Imprimir documento"
            >
              <Printer className="w-3.5 h-3.5 text-sky-400" />
              <span>Imprimir</span>
            </button>

            <button
              type="button"
              onClick={() => ExportController.exportAulasPDF(aulas)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg transition cursor-pointer"
              title="Descargar PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span>PDF</span>
            </button>

            <button
              type="button"
              onClick={() => ExportController.exportAulasXLSX(aulas)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition cursor-pointer"
              title="Descargar Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Excel</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-slate-800 bg-white">
          
          {/* Institutional Document Header */}
          <div className="border-b-2 border-slate-900 pb-5">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-black tracking-widest text-[#350854] uppercase">
                  <span>Instituto Superior Universitario Japón</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#e5a800]"></span>
                  <span className="text-[#e5a800] bg-[#350854] px-1.5 py-0.5 rounded font-bold">Gestión Académica ISUJ</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1 uppercase tracking-tight">
                  Reporte de Registros: Aulas, Talleres y Laboratorios
                </h1>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Dirección de Planificación Curricular e Infraestructura Física • Sede Matriz
                </p>
              </div>

              <div className="text-left sm:text-right text-xs text-slate-500 font-mono space-y-0.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200 shrink-0">
                <div><strong>Periodo:</strong> PER-2026-1 (ACTIVO)</div>
                <div><strong>Fecha de Emisión:</strong> {fechaActual}</div>
                <div><strong>Generado por:</strong> Administrador (admin)</div>
                <div><strong>Registros:</strong> {aulas.length} espacios</div>
              </div>
            </div>

            {/* Filter tags applied */}
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
              <span className="font-semibold text-slate-700">Filtros de emisión:</span>
              <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-medium">
                Bloque: {filtroBloque || 'Todos los bloques'}
              </span>
              <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-medium">
                Tipo: {filtroTipo || 'Aulas y Laboratorios'}
              </span>
              <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-medium">
                Estado: {filtroEstado || 'Todos los estados'}
              </span>
            </div>
          </div>

          {/* KPI Mini Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center text-xs">
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="text-slate-500 text-[11px] font-medium">Total Espacios</div>
              <div className="text-base font-black text-slate-900 mt-0.5 font-mono">{aulas.length}</div>
            </div>
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="text-slate-500 text-[11px] font-medium">Capacidad Aula</div>
              <div className="text-base font-black text-[#350854] mt-0.5 font-mono">{totalPuestos} est.</div>
            </div>
            <div className="p-2.5 bg-indigo-50 border border-indigo-200 rounded-xl">
              <div className="text-indigo-700 text-[11px] font-medium">Nº Estudiantes</div>
              <div className="text-base font-black text-indigo-900 mt-0.5 font-mono">{totalEstudiantes} est.</div>
            </div>
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl">
              <div className="text-emerald-700 text-[11px] font-medium">Disponibles</div>
              <div className="text-base font-black text-emerald-800 mt-0.5 font-mono">{totalDisponibles}</div>
            </div>
            <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="text-blue-700 text-[11px] font-medium">Ocupadas</div>
              <div className="text-base font-black text-blue-800 mt-0.5 font-mono">{totalOcupadas}</div>
            </div>
            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="text-amber-700 text-[11px] font-medium">Mant. / Inactivas</div>
              <div className="text-base font-black text-amber-800 mt-0.5 font-mono">{totalMantenimiento + totalInactivas}</div>
            </div>
          </div>

          {/* Official Registros Table */}
          <div className="border border-slate-300 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900 text-white uppercase text-[10px] font-bold tracking-wider">
                  <th className="py-2.5 px-2 text-center border-r border-slate-800 w-10">Nº</th>
                  <th className="py-2.5 px-3 border-r border-slate-800">Sede</th>
                  <th className="py-2.5 px-3 border-r border-slate-800">Bloque</th>
                  <th className="py-2.5 px-2 text-center border-r border-slate-800">Piso</th>
                  <th className="py-2.5 px-2.5 border-r border-slate-800">Código</th>
                  <th className="py-2.5 px-3 border-r border-slate-800">Nombre del Espacio</th>
                  <th className="py-2.5 px-3 text-center border-r border-slate-800">Tipología</th>
                  <th className="py-2.5 px-3 text-center border-r border-slate-800">Capacidad</th>
                  <th className="py-2.5 px-3 text-center border-r border-slate-800">Nº Estudiantes</th>
                  <th className="py-2.5 px-3 text-center border-r border-slate-800">Estado</th>
                  <th className="py-2.5 px-3 text-center">Clases</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {aulas.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-8 text-center text-slate-400">
                      No existen registros para los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  aulas.map((aula, idx) => {
                    const isCoworking = aula.codigo === 'B5' || aula.tipo === 'COWORKING';
                    const isC1toC4 = ['C1', 'C2', 'C3', 'C4'].includes(aula.codigo);
                    const isNoDisponible = aula.estado === 'INACTIVO' || isC1toC4;
                    const isDisponible = aula.estado === 'DISPONIBLE' && !isC1toC4;
                    const isMantenimiento = aula.estado === 'MANTENIMIENTO';
                    const isOcupado = aula.estado === 'OCUPADO';
                    const estudiantes = getEstudiantesAula(aula);

                    return (
                      <tr key={aula.id_aula_laboratorio} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                        <td className="py-2 px-2 text-center font-mono text-slate-500 font-bold border-r border-slate-200">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-3 font-semibold text-slate-700 border-r border-slate-200 whitespace-nowrap">
                          <span className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-[10px] font-bold border border-slate-200">
                            {aula.sede_nombre || 'UIO_NORTE'}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-800 font-medium border-r border-slate-200 whitespace-nowrap">
                          {aula.bloque_nombre}
                        </td>
                        <td className="py-2 px-2 text-center text-slate-600 font-mono font-bold border-r border-slate-200 whitespace-nowrap">
                          Piso {aula.piso}
                        </td>
                        <td className="py-2 px-2.5 font-mono font-bold text-[#350854] border-r border-slate-200 whitespace-nowrap">
                          <span className={`px-1.5 py-0.5 rounded border ${
                            isCoworking 
                              ? 'bg-amber-100 text-amber-900 border-amber-300' 
                              : isNoDisponible 
                              ? 'bg-rose-100 text-rose-900 border-rose-300' 
                              : 'bg-slate-100 text-slate-900 border-slate-200'
                          }`}>
                            {aula.codigo}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-semibold text-slate-900 border-r border-slate-200">
                          <span>{aula.nombre}</span>
                          {isCoworking && (
                            <span className="ml-1 text-[9px] bg-amber-50 text-amber-800 border border-amber-200 px-1 py-0.2 rounded font-bold">
                              Coworking (No es aula)
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-center border-r border-slate-200 whitespace-nowrap">
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            isCoworking
                              ? 'bg-amber-100 text-amber-900 border border-amber-200'
                              : aula.tipo === 'LABORATORIO' 
                              ? 'bg-purple-100 text-purple-800' 
                              : 'bg-blue-50 text-blue-800'
                          }`}>
                            {isCoworking ? '🏢 Coworking' : aula.tipo === 'LABORATORIO' ? '🔬 Laboratorio' : '📚 Aula Regular'}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center font-mono font-bold text-slate-900 border-r border-slate-200 whitespace-nowrap">
                          {isCoworking ? (
                            <span className="text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded text-[10px] border border-amber-200">
                              0 (Coworking)
                            </span>
                          ) : isNoDisponible ? (
                            <span className="text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[10px] border border-slate-300 font-bold font-mono">
                              N/A
                            </span>
                          ) : (
                            <span>{aula.capacidad} est.</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-center font-mono font-bold text-indigo-950 border-r border-slate-200">
                          {isC1toC4 ? (
                            <span className="text-slate-500 font-mono font-medium text-xs">N/A</span>
                          ) : estudiantes > 0 ? (
                            <span>{estudiantes} est.</span>
                          ) : (
                            <span className="text-slate-400 font-normal">0 est.</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-center border-r border-slate-200 whitespace-nowrap">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            isC1toC4
                              ? 'bg-rose-100 text-rose-800 border-rose-300 font-mono font-black'
                              : isDisponible
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : isOcupado
                              ? 'bg-blue-100 text-blue-800 border-blue-300'
                              : isMantenimiento
                              ? 'bg-amber-100 text-amber-800 border-amber-300'
                              : 'bg-rose-100 text-rose-800 border-rose-300'
                          }`}>
                            {isC1toC4 ? 'N/A' : isNoDisponible ? 'NO DISPONIBLE' : aula.estado}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center font-mono font-semibold text-slate-700">
                          {aula.clases_activas_count || 0}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-800">
                  <td colSpan={6} className="py-2.5 px-3 text-right">
                    Totales Consolidados ({aulas.length} registros):
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono text-[#350854] font-black">
                    {totalPuestos} est.
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono text-indigo-900">
                    {totalEstudiantes} est.
                  </td>
                  <td className="py-2.5 px-3 text-center text-[11px] text-emerald-700">
                    {totalDisponibles} disp.
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono">
                    {aulas.reduce((sum, a) => sum + (a.clases_activas_count || 0), 0)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Institutional Signatures */}
          <div className="pt-8 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-2 gap-8 text-center text-xs text-slate-600">
            <div>
              <div className="w-48 mx-auto border-b border-slate-400 mb-2"></div>
              <p className="font-bold text-slate-900">Coordinación de Infraestructura y Aulas</p>
              <p className="text-[11px] text-slate-500">Gestión de Espacios Físicos ISUJ</p>
            </div>
            <div>
              <div className="w-48 mx-auto border-b border-slate-400 mb-2"></div>
              <p className="font-bold text-slate-900">Vicerrectorado Académico</p>
              <p className="text-[11px] text-slate-500">Aprobación y Validación Institucional</p>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 text-center pt-2">
            Este reporte fue generado de manera automática por el sistema GesNet Académico con firma electrónica institucional.
          </div>
        </div>
      </div>
    </div>
  );
};
