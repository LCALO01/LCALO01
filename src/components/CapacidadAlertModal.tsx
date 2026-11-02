import React from 'react';
import { createPortal } from 'react-dom';
import { AulaLaboratorio, AulaRecomendada } from '../types.ts';
import { 
  AlertTriangle, 
  ShieldAlert, 
  Check, 
  X, 
  Sparkles, 
  Users, 
  DoorOpen, 
  Maximize2,
  Building,
  Layers,
  ArrowRight
} from 'lucide-react';

export interface CapacidadAlertModalProps {
  isOpen: boolean;
  mode: 'INSUFICIENTE' | 'RECOMENDACION';
  aulaSeleccionada: AulaLaboratorio;
  numeroEstudiantes: number;
  aulasRecomendadas: AulaRecomendada[];
  onClose: () => void;
  onSelectAula: (id_aula: number) => void;
  onKeepCurrent?: () => void;
}

export const CapacidadAlertModal: React.FC<CapacidadAlertModalProps> = ({
  isOpen,
  mode,
  aulaSeleccionada,
  numeroEstudiantes,
  aulasRecomendadas,
  onClose,
  onSelectAula,
  onKeepCurrent
}) => {
  if (!isOpen) return null;

  const capacidad = aulaSeleccionada.capacidad;
  const diferencia = capacidad - numeroEstudiantes;
  const porcentajeOcupacion = capacidad > 0 ? Math.round((numeroEstudiantes / capacidad) * 100) : 0;
  const isInsuficiente = mode === 'INSUFICIENTE';

  return createPortal(
    <div className="fixed inset-0 z-[100000] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div 
        className={`bg-white rounded-2xl max-w-2xl w-full shadow-2xl border-2 overflow-hidden animate-in zoom-in-95 duration-150 my-auto ${
          isInsuficiente ? 'border-rose-500' : 'border-amber-500'
        }`}
        onClick={e => e.stopPropagation()}
      >
        {/* ENCABEZADO DE ALERTA */}
        <div className={`p-4 text-white flex items-center justify-between ${
          isInsuficiente 
            ? 'bg-gradient-to-r from-rose-700 via-rose-600 to-red-700' 
            : 'bg-gradient-to-r from-amber-600 via-amber-500 to-indigo-700'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-black shadow-inner">
              {isInsuficiente ? (
                <ShieldAlert className="w-6 h-6 text-white" />
              ) : (
                <Sparkles className="w-6 h-6 text-white" />
              )}
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base uppercase tracking-wider flex items-center gap-2">
                <span>
                  {isInsuficiente 
                    ? '¡ALERTA DE CAPACIDAD INSUFICIENTE — INGRESO NO PERMITIDO!' 
                    : '¡ALERTA DE AJUSTE DE CAPACIDAD — AULAS RECOMENDADAS!'}
                </span>
              </h3>
              <span className="text-xs text-white/90 font-medium">
                {isInsuficiente
                  ? 'Normativa Institucional de Aforo y Bioseguridad'
                  : 'Verificación y Optimización de Capacidad de Espacios Físicos'}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/15 transition cursor-pointer"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CUERPO DEL MODAL */}
        <div className="p-4 sm:p-5 space-y-4 max-h-[82vh] overflow-y-auto">
          
          {/* TARJETA RESUMEN DE LA DISPARIDAD O SOBRECUPO */}
          <div className={`p-3.5 rounded-xl border ${
            isInsuficiente 
              ? 'bg-rose-50 border-rose-200 text-rose-950' 
              : 'bg-amber-50/80 border-amber-200 text-amber-950'
          }`}>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2 mb-2 border-black/10">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Aula Evaluada:</span>
                <span className="font-black text-sm text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-300">
                  {aulaSeleccionada.nombre} ({aulaSeleccionada.codigo})
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                  {aulaSeleccionada.tipo}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold">
                <span className="text-slate-600">Capacidad Máxima:</span>
                <span className="font-black text-indigo-900">{capacidad} puestos</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-white/80 p-2 rounded-lg border border-black/5">
                <span className="text-slate-500 block text-[11px]">Estudiantes a cursar</span>
                <strong className="text-slate-900 text-sm font-black">{numeroEstudiantes}</strong>
              </div>
              <div className="bg-white/80 p-2 rounded-lg border border-black/5">
                <span className="text-slate-500 block text-[11px]">
                  {isInsuficiente ? 'Sobrecupo excedente' : 'Puestos sin ocupar'}
                </span>
                <strong className={`text-sm font-black ${isInsuficiente ? 'text-rose-600' : 'text-amber-600'}`}>
                  {isInsuficiente ? `+${Math.abs(diferencia)} alumnos` : `${diferencia} puestos`}
                </strong>
              </div>
              <div className="col-span-2 sm:col-span-1 bg-white/80 p-2 rounded-lg border border-black/5">
                <span className="text-slate-500 block text-[11px]">Tasa de ocupación</span>
                <strong className={`text-sm font-black ${isInsuficiente ? 'text-rose-600' : 'text-indigo-600'}`}>
                  {porcentajeOcupacion}%
                </strong>
              </div>
            </div>

            {/* MENSAJE EXPLICATIVO EXACTO */}
            <div className="mt-3 pt-2 border-t border-black/10 text-xs leading-relaxed font-semibold">
              {isInsuficiente ? (
                <div className="flex items-start gap-2 text-rose-800">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                  <p>
                    <strong>Ingreso No Permitido:</strong> La capacidad del aula ({capacidad} puestos) es <strong>menor al número de estudiantes ({numeroEstudiantes})</strong>. 
                    El sistema bloquea la asignación para salvaguardar el orden y cumplimiento de aforos. Por favor asigne un aula con capacidad suficiente.
                  </p>
                </div>
              ) : (
                <div className="flex items-start gap-2 text-amber-900">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                  <p>
                    <strong>Subutilización Detectada:</strong> La capacidad del aula ({capacidad} puestos) es <strong>mayor al número de estudiantes ({numeroEstudiantes})</strong>, 
                    dejando <strong>{diferencia} puestos desaprovechados</strong> ({porcentajeOcupacion}% de ocupación). 
                    A continuación se listan las aulas recomendadas que se ajustan óptimamente a esta capacidad:
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* LISTADO DE AULAS APROPIADAS / RECOMENDADAS */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <DoorOpen className="w-4 h-4 text-indigo-600" />
                {isInsuficiente
                  ? `Aulas Disponibles con Capacidad Suficiente (>= ${numeroEstudiantes} est.):`
                  : `Aulas Apropiadas Recomendadas que Ajustan a la Capacidad (${numeroEstudiantes} est.):`}
              </span>
              <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                {aulasRecomendadas.length} encontrada{aulasRecomendadas.length === 1 ? '' : 's'}
              </span>
            </div>

            {aulasRecomendadas.length === 0 ? (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-500">
                No se encontraron otras aulas activas que cumplan con la capacidad requerida en este momento.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2 max-h-[290px] overflow-y-auto pr-1">
                {aulasRecomendadas.map(rec => {
                  const esExacto = rec.diferencia === 0;
                  const esOptimo = rec.nivelAjuste === 'OPTIMO';

                  return (
                    <div
                      key={rec.aula.id_aula_laboratorio}
                      className={`p-3 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                        rec.esDisponible
                          ? esExacto
                            ? 'bg-emerald-50/70 border-emerald-300 hover:border-emerald-400'
                            : esOptimo
                            ? 'bg-indigo-50/60 border-indigo-200 hover:border-indigo-400'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                          : 'bg-slate-50 border-slate-200 opacity-75'
                      }`}
                    >
                      {/* Información del Aula */}
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-slate-900 text-sm">
                            {rec.aula.nombre}
                          </span>
                          <span className="font-mono text-[11px] px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 font-bold">
                            {rec.aula.codigo}
                          </span>
                          <span className={`px-2 py-0.2 rounded text-[10px] font-black ${
                            rec.aula.tipo === 'LABORATORIO' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {rec.aula.tipo}
                          </span>
                          <span className={`px-2 py-0.2 rounded text-[10px] font-black ${
                            rec.esDisponible 
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                              : 'bg-rose-100 text-rose-800 border border-rose-300'
                          }`}>
                            {rec.esDisponible ? '● DISPONIBLE' : '● OCUPADA'}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-slate-600 text-[11px] flex-wrap">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3 text-slate-400" />
                            Capacidad: <strong className="text-slate-900 font-bold">{rec.capacidad} puestos</strong>
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Building className="w-3 h-3 text-slate-400" />
                            Bloque {rec.aula.id_bloque}, Piso {rec.aula.piso}
                          </span>
                        </div>

                        {/* Indicador de ajuste a la capacidad */}
                        <div className="pt-0.5">
                          <span className={`inline-block font-bold text-[11px] px-2 py-0.5 rounded ${
                            esExacto
                              ? 'bg-emerald-200/80 text-emerald-900 font-black'
                              : esOptimo
                              ? 'bg-indigo-100 text-indigo-900'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {rec.ajusteTexto}
                          </span>
                        </div>
                      </div>

                      {/* Botón de Asignación Rápida */}
                      <div className="shrink-0 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            onSelectAula(rec.aula.id_aula_laboratorio);
                            onClose();
                          }}
                          disabled={!rec.esDisponible}
                          className={`w-full sm:w-auto px-3 py-2 rounded-xl text-xs font-black shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 ${
                            rec.esDisponible
                              ? esExacto
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Asignar Esta Aula</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* PIE DEL MODAL CON ACCIONES SECUNDARIAS */}
        <div className="bg-slate-50 border-t border-slate-200 px-4 py-3 flex flex-wrap items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 rounded-xl transition cursor-pointer"
          >
            {isInsuficiente ? 'Cerrar y Elegir Otra Aula' : 'Cancelar'}
          </button>

          {!isInsuficiente && onKeepCurrent && (
            <button
              type="button"
              onClick={() => {
                onKeepCurrent();
                onClose();
              }}
              className="px-4 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <span>Mantener Asignación de {aulaSeleccionada.nombre} ({capacidad} puestos)</span>
            </button>
          )}
        </div>

      </div>
    </div>,
    document.body
  );
};
