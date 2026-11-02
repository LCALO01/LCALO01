import React, { useState, useEffect } from 'react';
import { Catalogos, PlanificacionCompleta, AulaLaboratorio } from '../types.ts';
import { 
  GraduationCap, 
  Building2, 
  School, 
  Calendar, 
  Layers, 
  Sparkles,
  Info,
  DoorOpen,
  FileSpreadsheet,
  Download,
  ChevronDown,
  Pin,
  BookOpen
} from 'lucide-react';
import { ExportController } from '../controllers/exportController.ts';
import { SedesCrudView } from './catalogos/SedesCrudView.tsx';
import { BloquesCrudView } from './catalogos/BloquesCrudView.tsx';
import { AulasCrudView } from './catalogos/AulasCrudView.tsx';
import { EscuelasCrudView } from './catalogos/EscuelasCrudView.tsx';
import { CarrerasCrudView } from './catalogos/CarrerasCrudView.tsx';
import { PeriodosCrudView } from './catalogos/PeriodosCrudView.tsx';
import { AsignaturaNivelCrudView } from './catalogos/AsignaturaNivelCrudView.tsx';

export type AcademicoSubTab = 'sedes' | 'bloques' | 'aulas' | 'escuelas' | 'carreras' | 'asignatura_nivel' | 'periodos';

interface AcademicoModuloProps {
  catalogos: Catalogos;
  planificaciones: PlanificacionCompleta[];
  aulas: AulaLaboratorio[];
  onRefreshCatalogos: () => void;
  initialSubTab?: AcademicoSubTab;
  activeSubTab?: AcademicoSubTab;
  onTabChange?: (tab: AcademicoSubTab) => void;
}

export const AcademicoModulo: React.FC<AcademicoModuloProps> = ({
  catalogos,
  planificaciones,
  aulas,
  onRefreshCatalogos,
  initialSubTab = 'sedes',
  activeSubTab,
  onTabChange
}) => {
  const currentInitial = activeSubTab || initialSubTab || 'sedes';
  const [subTab, setSubTab] = useState<AcademicoSubTab>(currentInitial);

  useEffect(() => {
    const target = activeSubTab || initialSubTab;
    if (target && target !== subTab) {
      setSubTab(target);
    }
  }, [activeSubTab, initialSubTab]);

  const handleSubTabChange = (newTab: AcademicoSubTab) => {
    setSubTab(newTab);
    if (onTabChange) {
      onTabChange(newTab);
    }
  };

  const [showExportMenu, setShowExportMenu] = useState(false);

  const handleExportCurrent = () => {
    setShowExportMenu(false);
    switch (subTab) {
      case 'sedes':
        ExportController.exportSedesXLSX(catalogos?.sedes || []);
        break;
      case 'bloques':
        ExportController.exportBloquesXLSX(catalogos?.bloques || [], aulas || []);
        break;
      case 'aulas':
        ExportController.exportAulasXLSX(aulas || []);
        break;
      case 'escuelas':
        ExportController.exportEscuelasXLSX(catalogos?.escuelas || []);
        break;
      case 'carreras':
        ExportController.exportCarrerasXLSX(catalogos?.carreras || []);
        break;
      case 'asignatura_nivel':
        ExportController.exportAsignaturasNivelXLSX(catalogos?.asignaturas || [], catalogos?.carreras || [], planificaciones || []);
        break;
      case 'periodos':
        ExportController.exportPeriodosXLSX(catalogos?.periodos || []);
        break;
    }
  };

  const handleExportAll = () => {
    setShowExportMenu(false);
    ExportController.exportCatalogoAcademicoCompletoXLSX(catalogos, aulas || []);
  };

  return (
    <div className="space-y-3">
      {/* MENÚ ACADÉMICO UNIFICADO Y REDUCIDO */}
      <div className="bg-white/95 backdrop-blur-md rounded-xl border border-slate-200/90 shadow-sm px-3 py-2 sm:px-4 sm:py-2.5 transition-all mb-2">
        {/* Fila 1: Título compacto, Miga de pan e Indicador FIXED + Exportar Excel */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="p-1 bg-amber-500/10 text-[#e5a800] rounded-lg shrink-0">
              <GraduationCap className="w-4 h-4 text-[#e5a800]" />
            </span>
            <div className="flex items-center gap-1.5 flex-wrap min-w-0">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                SISTEMA &gt; 3. ACADÉMICO &gt;
              </span>
              <span className="text-sm font-extrabold text-slate-900 tracking-tight uppercase">
                {subTab}
              </span>
              <span className="text-[10px] font-bold text-red-700 bg-red-100/90 px-2 py-0.5 rounded-md border border-red-300 font-mono inline-flex items-center gap-1 shadow-2xs">
                <Pin className="w-2.5 h-2.5 fill-red-600 text-red-600" />
                MENÚ CONGELADO
              </span>
            </div>
            <span className="text-slate-300 hidden lg:inline">|</span>
            <span className="text-[11px] text-slate-400 hidden lg:inline truncate">
              Gestión unificada de sedes, bloques, aulas, escuelas, carreras y periodos
            </span>
          </div>

          {/* Botón Exportar Excel Compacto */}
          <div className="relative self-end sm:self-auto shrink-0">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                title="Exportar información académica a Microsoft Excel (.xlsx)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Exportar Excel</span>
                <ChevronDown className="w-3 h-3 opacity-80" />
              </button>
            </div>

            {showExportMenu && (
              <div className="absolute right-0 mt-1 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-40 animate-in fade-in text-xs">
                <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  Opciones de Exportación (.xlsx)
                </div>
                <button
                  onClick={handleExportAll}
                  className="w-full text-left px-3 py-2 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 font-semibold flex items-center gap-2 transition cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <div className="font-bold">Catálogo Completo (Multi-Hoja)</div>
                    <div className="text-[10px] text-slate-500 font-normal">Sedes, Bloques, Aulas, Escuelas, Carreras y Periodos</div>
                  </div>
                </button>
                <button
                  onClick={handleExportCurrent}
                  className="w-full text-left px-3 py-2 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 font-semibold flex items-center gap-2 border-t border-slate-100 transition cursor-pointer"
                >
                  <Download className="w-4 h-4 text-blue-600 shrink-0" />
                  <div>
                    <div className="font-bold">Exportar {subTab.toUpperCase()} Actual</div>
                    <div className="text-[10px] text-slate-500 font-normal">Solo los registros de la pestaña activa</div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Fila 2: Sub-pestañas reducidas marcadas con estilo rojo en la activa */}
        <div className="flex items-center gap-1 sm:gap-1.5 pt-2 overflow-x-auto no-scrollbar flex-wrap">
          {[
            { id: 'sedes', label: 'Sedes', count: catalogos?.sedes?.length || 0, icon: Building2 },
            { id: 'bloques', label: 'Bloques', count: catalogos?.bloques?.length || 0, icon: Layers },
            { id: 'aulas', label: 'Aulas', count: aulas?.length || 0, icon: DoorOpen },
            { id: 'escuelas', label: 'Escuelas', count: catalogos?.escuelas?.length || 0, icon: School },
            { id: 'carreras', label: 'Carreras', count: catalogos?.carreras?.length || 0, icon: GraduationCap },
            { id: 'asignatura_nivel', label: 'Asignatura / Nivel', count: catalogos?.asignaturas?.length || 0, icon: BookOpen },
            { id: 'periodos', label: 'Periodos', count: catalogos?.periodos?.length || 0, icon: Calendar }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = subTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleSubTabChange(tab.id as AcademicoSubTab)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-red-600 text-white shadow-xs font-black ring-1 ring-red-700 scale-[1.02]'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                }`}
                title={`Ver catálogo de ${tab.label}`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isActive 
                    ? 'bg-red-800 text-white font-extrabold' 
                    : 'bg-slate-200 text-slate-600'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sub-view render */}
      <div>
        {subTab === 'sedes' && (
          <SedesCrudView
            sedes={catalogos?.sedes || []}
            onRefresh={onRefreshCatalogos}
          />
        )}

        {subTab === 'bloques' && (
          <BloquesCrudView
            bloques={catalogos?.bloques || []}
            sedes={catalogos?.sedes || []}
            aulas={aulas || []}
            onRefresh={onRefreshCatalogos}
          />
        )}

        {subTab === 'aulas' && (
          <AulasCrudView
            aulas={aulas || []}
            bloques={catalogos?.bloques || []}
            sedes={catalogos?.sedes || []}
            planificaciones={planificaciones || []}
            onRefresh={onRefreshCatalogos}
          />
        )}

        {subTab === 'escuelas' && (
          <EscuelasCrudView
            escuelas={catalogos?.escuelas || []}
            sedes={catalogos?.sedes || []}
            onRefresh={onRefreshCatalogos}
          />
        )}

        {subTab === 'carreras' && (
          <CarrerasCrudView
            carreras={catalogos?.carreras || []}
            escuelas={catalogos?.escuelas || []}
            onRefresh={onRefreshCatalogos}
          />
        )}

        {subTab === 'asignatura_nivel' && (
          <AsignaturaNivelCrudView
            asignaturas={catalogos?.asignaturas || []}
            carreras={catalogos?.carreras || []}
            planificaciones={planificaciones || []}
            niveles={catalogos?.niveles || []}
            sedes={catalogos?.sedes || []}
            escuelas={catalogos?.escuelas || []}
            jornadas={catalogos?.jornadas || []}
            bloques={catalogos?.bloques || []}
            aulas={aulas && aulas.length > 0 ? aulas : (catalogos?.aulas || [])}
            onRefresh={onRefreshCatalogos}
          />
        )}

        {subTab === 'periodos' && (
          <PeriodosCrudView
            periodos={catalogos?.periodos || []}
            onRefresh={onRefreshCatalogos}
          />
        )}
      </div>
    </div>
  );
};
