import React, { useState, useEffect } from 'react';
import { Catalogos, PlanificacionCompleta, AulaLaboratorio } from '../types.ts';
import { 
  Clock, 
  CalendarDays, 
  Calendar, 
  AlertCircle, 
  Layers 
} from 'lucide-react';
import { MatrizHorariosView } from './MatrizHorariosView.tsx';
import { FeriadosView } from './FeriadosView.tsx';
import { FeriadosCrudView } from './catalogos/FeriadosCrudView.tsx';

interface HorariosModuloProps {
  catalogos: Catalogos;
  planificaciones: PlanificacionCompleta[];
  aulas: AulaLaboratorio[];
  onSelectPlan: (plan: PlanificacionCompleta) => void;
  onRefreshCatalogos: () => void;
  initialSubTab?: 'matriz' | 'feriados' | 'gestion_feriados';
  activeSubTab?: 'matriz' | 'feriados' | 'gestion_feriados';
  onTabChange?: (tab: 'matriz' | 'feriados' | 'gestion_feriados') => void;
}

export const HorariosModulo: React.FC<HorariosModuloProps> = ({
  catalogos,
  planificaciones,
  aulas,
  onSelectPlan,
  onRefreshCatalogos,
  initialSubTab = 'matriz',
  activeSubTab,
  onTabChange
}) => {
  const currentInitial = activeSubTab || initialSubTab || 'matriz';
  const [subTab, setSubTab] = useState<'matriz' | 'feriados' | 'gestion_feriados'>(currentInitial);

  useEffect(() => {
    const target = activeSubTab || initialSubTab;
    if (target && target !== subTab) {
      setSubTab(target);
    }
  }, [activeSubTab, initialSubTab]);

  const handleSubTabChange = (newTab: 'matriz' | 'feriados' | 'gestion_feriados') => {
    setSubTab(newTab);
    if (onTabChange) {
      onTabChange(newTab);
    }
  };

  return (
    <div className="space-y-4">
      {/* Module Title & Hierarchy Header */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">
            <Clock className="w-4 h-4 text-[#e5a800]" />
            <span>SISTEMA &gt; 5. HORARIO &gt; {subTab.toUpperCase()}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">
            Módulo de Horarios y Calendario Académico
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Matriz semanal de distribución por aulas, bloques, jornadas y control de feriados 2026
          </p>
        </div>

        {/* Sub-tab pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200 self-start md:self-auto">
          <button
            onClick={() => handleSubTabChange('matriz')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              subTab === 'matriz'
                ? 'bg-[#1f0533] text-[#e5a800] shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            Matriz Semanal de Horarios
          </button>
          <button
            onClick={() => handleSubTabChange('feriados')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              subTab === 'feriados'
                ? 'bg-[#1f0533] text-[#e5a800] shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            Calendario de Feriados 2026
          </button>
          <button
            onClick={() => handleSubTabChange('gestion_feriados')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              subTab === 'gestion_feriados'
                ? 'bg-[#1f0533] text-[#e5a800] shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Gestión de Feriados
          </button>
        </div>
      </div>

      {/* Sub-view render */}
      <div>
        {subTab === 'matriz' && (
          <MatrizHorariosView
            catalogos={catalogos}
            aulas={aulas}
            planificaciones={planificaciones || []}
            onSelectPlan={onSelectPlan}
          />
        )}

        {subTab === 'feriados' && (
          <FeriadosView
            catalogos={catalogos}
          />
        )}

        {subTab === 'gestion_feriados' && (
          <FeriadosCrudView
            feriados={catalogos?.feriados || []}
            periodos={catalogos?.periodos || []}
            onRefresh={onRefreshCatalogos}
          />
        )}
      </div>
    </div>
  );
};
