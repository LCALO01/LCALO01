import React from 'react';
import { Catalogos } from '../types.ts';
import { Calendar, AlertCircle, CheckCircle2, ShieldAlert, Sparkles, Building2 } from 'lucide-react';

interface FeriadosViewProps {
  catalogos: Catalogos;
}

export const FeriadosView: React.FC<FeriadosViewProps> = ({ catalogos }) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            Calendario Oficial de Feriados y Suspensión de Clases 2026
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Integrado en el motor de asignación MVC para prevenir cruces con días festivos nacionales en la Sede Matriz.
          </p>
        </div>

        <div className="px-3.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-600" />
          <span>Periodo Lectivo Activo: PER-2026-1</span>
        </div>
      </div>

      {/* Info card */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-5 rounded-2xl text-white shadow-md border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs text-indigo-300 font-bold uppercase tracking-wider">Normativa Académica ISUJ</span>
          <h3 className="text-base font-bold text-white mt-0.5">
            Protección Automática de Jornadas y Carga Horaria
          </h3>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Las asignaciones programadas para los días coincidentes con días feriados son auditadas automáticamente en el backend por el controlador de colisiones, permitiendo programar reprogramaciones o clases de recuperación sin afectar la ocupación regular de los laboratorios.
          </p>
        </div>
        <div className="bg-white/10 px-4 py-3 rounded-xl border border-white/20 text-center shrink-0">
          <div className="text-2xl font-bold text-white">{catalogos.feriados.length}</div>
          <div className="text-[11px] text-slate-300">Feriados Oficiales 2026</div>
        </div>
      </div>

      {/* Feriados Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {catalogos.feriados.map((f, idx) => {
          const fechaStr = f.desde || f.hasta || '2026-01-01';
          const fechaParts = fechaStr.split('-');
          const anio = fechaParts[0] || '2026';
          const mes = parseInt(fechaParts[1] || '1', 10);
          const dia = parseInt(fechaParts[2] || '1', 10);

          const mesesNombre = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
          ];

          // Check if in period 2026-1 (March to August)
          const isInPeriodo = mes >= 3 && mes <= 8;

          return (
            <div
              key={f.id_feriado || idx}
              className={`bg-white rounded-2xl border p-4 shadow-xs flex flex-col justify-between transition ${
                isInPeriodo ? 'border-indigo-300 ring-2 ring-indigo-50/50' : 'border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                    {dia} de {mesesNombre[mes - 1] || 'Mes'} {anio}
                  </span>
                  {isInPeriodo ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
                      Periodo 2026-1
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                      Periodo 2026-2
                    </span>
                  )}
                </div>

                <h4 className="text-sm font-bold text-slate-900 mb-1">
                  {f.nombre || f.descripcion}
                </h4>

                <p className="text-xs text-slate-500 mb-3">
                  {f.descripcion && f.nombre !== f.descripcion && <span className="block mb-1">{f.descripcion}</span>}
                  Rango oficial: <strong className="text-slate-800 font-mono">{f.desde === f.hasta ? f.desde : `${f.desde} a ${f.hasta}`}</strong>
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Feriado Oficial</span>
                </span>
                <span className="text-[11px] text-slate-400 font-mono">{f.codigo}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
