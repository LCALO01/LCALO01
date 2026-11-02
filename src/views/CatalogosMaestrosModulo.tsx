import React, { useState, useEffect } from 'react';
import { Catalogos, PlanificacionCompleta, AulaLaboratorio } from '../types.ts';
import { 
  Layers, 
  Users, 
  BookOpen, 
  GraduationCap, 
  Calendar, 
  Flag, 
  Building2, 
  School, 
  Clock,
  DoorOpen
} from 'lucide-react';
import { DocentesCrudView } from './catalogos/DocentesCrudView.tsx';
import { AsignaturasCrudView } from './catalogos/AsignaturasCrudView.tsx';
import { CarrerasCrudView } from './catalogos/CarrerasCrudView.tsx';
import { PeriodosCrudView } from './catalogos/PeriodosCrudView.tsx';
import { FeriadosCrudView } from './catalogos/FeriadosCrudView.tsx';
import { SedesCrudView } from './catalogos/SedesCrudView.tsx';
import { EscuelasCrudView } from './catalogos/EscuelasCrudView.tsx';
import { NivelesParalelosJornadasCrudView } from './catalogos/NivelesParalelosJornadasCrudView.tsx';
import { BloquesCrudView } from './catalogos/BloquesCrudView.tsx';
import { AulasCrudView } from './catalogos/AulasCrudView.tsx';
import { ApiClient } from '../controllers/apiClient.ts';

interface CatalogosMaestrosModuloProps {
  catalogos: Catalogos;
  planificaciones: PlanificacionCompleta[];
  aulas?: AulaLaboratorio[];
  onRefreshCatalogos: () => void;
  onRefreshAulas?: () => void;
  initialTab?: CatalogSubTab;
}

export type CatalogSubTab = 
  | 'docentes' 
  | 'asignaturas' 
  | 'carreras' 
  | 'aulas'
  | 'bloques'
  | 'periodos' 
  | 'feriados' 
  | 'sedes' 
  | 'escuelas' 
  | 'otros';

export const CatalogosMaestrosModulo: React.FC<CatalogosMaestrosModuloProps> = ({
  catalogos,
  planificaciones,
  aulas: aulasProp,
  onRefreshCatalogos,
  onRefreshAulas,
  initialTab = 'periodos'
}) => {
  const [activeTab, setActiveTab] = useState<CatalogSubTab>(initialTab);
  const [localAulas, setLocalAulas] = useState<AulaLaboratorio[]>(aulasProp || []);

  useEffect(() => {
    if (aulasProp && aulasProp.length > 0) {
      setLocalAulas(aulasProp);
    }
  }, [aulasProp]);

  const handleRefreshAll = async () => {
    onRefreshCatalogos();
    if (onRefreshAulas) {
      onRefreshAulas();
    }
    try {
      const freshAulas = await ApiClient.getAulas();
      setLocalAulas(freshAulas);
    } catch {
      // Ignorar si falla la sincronización local
    }
  };

  const effectiveAulas = localAulas.length > 0 ? localAulas : (aulasProp || []);

  const tabsConfig = [
    {
      id: 'periodos' as const,
      label: `Periodo (${catalogos.periodos?.length || 0})`,
      icon: Calendar,
      iconColor: 'text-indigo-500',
    },
    {
      id: 'sedes' as const,
      label: `Sedes (${catalogos.sedes?.length || 0})`,
      icon: Building2,
      iconColor: '',
    },
    {
      id: 'escuelas' as const,
      label: `Escuela (${catalogos.escuelas?.length || 0})`,
      icon: School,
      iconColor: '',
    },
    {
      id: 'bloques' as const,
      label: `Bloques (${catalogos.bloques?.length || 0})`,
      icon: Layers,
      iconColor: 'text-indigo-500',
    },
    {
      id: 'aulas' as const,
      label: `Aulas y Labs (${effectiveAulas.length})`,
      icon: DoorOpen,
      iconColor: 'text-sky-500',
    },
    {
      id: 'otros' as const,
      label: 'Niveles, Paralelos y Jornadas',
      icon: Clock,
      iconColor: '',
    },
    {
      id: 'carreras' as const,
      label: `Carreras (${catalogos.carreras?.length || 0})`,
      icon: GraduationCap,
      iconColor: '',
    },
    {
      id: 'asignaturas' as const,
      label: `Asignaturas (${catalogos.asignaturas?.length || 0})`,
      icon: BookOpen,
      iconColor: '',
    },
    {
      id: 'docentes' as const,
      label: `Docentes (${catalogos.docentes?.length || 0})`,
      icon: Users,
      iconColor: '',
    },
    {
      id: 'feriados' as const,
      label: `Feriados (${catalogos.feriados?.length || 0})`,
      icon: Flag,
      iconColor: 'text-amber-500',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header Banner Módulo 2 */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-[#280740] shrink-0 shadow-xs">
            <Layers className="w-6 h-6 text-[#280740]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Módulo 2: Catálogos Maestros (CRUDs)
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Mantenimiento de tablas base: Aulas, Bloques, Docentes, Asignaturas, Carreras, Periodos, Feriados y Sedes.
            </p>
          </div>
        </div>

        {/* Mobile dropdown selector (< sm) */}
        <div className="sm:hidden mt-4 pt-3 border-t border-slate-100">
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Seleccionar Catálogo:
          </label>
          <select
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value as any)}
            className="w-full text-xs font-bold bg-slate-100 border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#280740]"
          >
            {tabsConfig.map(tab => (
              <option key={tab.id} value={tab.id}>
                {tab.label}
              </option>
            ))}
          </select>
        </div>

        {/* Subtabs Bar agrupadas en 2 filas (sm and above) */}
        <div className="hidden sm:block mt-5 pt-4 border-t border-slate-100 space-y-2">
          {/* Fila 1: Periodo, Sedes, Escuela, Bloques, Aulas y Labs */}
          <div className="flex items-center gap-2 flex-wrap">
            {tabsConfig.slice(0, 5).map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  id={`tab-catalogo-${tab.id}`}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-[#280740] text-amber-300 shadow-xs font-bold border border-[#e5a800]'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200/70'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${tab.iconColor && !isActive ? tab.iconColor : isActive ? 'text-amber-300' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Fila 2: Niveles, Paralelos y Jornadas, Carreras, Asignaturas, Docentes, Feriados */}
          <div className="flex items-center gap-2 flex-wrap">
            {tabsConfig.slice(5).map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  id={`tab-catalogo-${tab.id}`}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-[#280740] text-amber-300 shadow-xs font-bold border border-[#e5a800]'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200/70'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${tab.iconColor && !isActive ? tab.iconColor : isActive ? 'text-amber-300' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Area based on Tab */}
      <div className="transition-all duration-150">
        {activeTab === 'docentes' && (
          <DocentesCrudView 
            docentes={catalogos.docentes || []} 
            planificaciones={planificaciones}
            carreras={catalogos.carreras || []}
            onRefresh={handleRefreshAll}
          />
        )}

        {activeTab === 'asignaturas' && (
          <AsignaturasCrudView 
            asignaturas={catalogos.asignaturas || []} 
            planificaciones={planificaciones}
            carreras={catalogos.carreras || []}
            escuelas={catalogos.escuelas || []}
            niveles={catalogos.niveles || []}
            onRefresh={handleRefreshAll}
          />
        )}

        {activeTab === 'carreras' && (
          <CarrerasCrudView 
            carreras={catalogos.carreras || []} 
            escuelas={catalogos.escuelas || []}
            planificaciones={planificaciones}
            onRefresh={handleRefreshAll}
          />
        )}

        {activeTab === 'aulas' && (
          <AulasCrudView
            aulas={effectiveAulas}
            bloques={catalogos.bloques || []}
            sedes={catalogos.sedes || []}
            planificaciones={planificaciones}
            onRefresh={handleRefreshAll}
          />
        )}

        {activeTab === 'bloques' && (
          <BloquesCrudView
            bloques={catalogos.bloques || []}
            sedes={catalogos.sedes || []}
            aulas={effectiveAulas}
            onRefresh={handleRefreshAll}
          />
        )}

        {activeTab === 'periodos' && (
          <PeriodosCrudView 
            periodos={catalogos.periodos || []} 
            onRefresh={handleRefreshAll}
          />
        )}

        {activeTab === 'feriados' && (
          <FeriadosCrudView 
            feriados={catalogos.feriados || []} 
            periodos={catalogos.periodos || []}
            onRefresh={handleRefreshAll}
          />
        )}

        {activeTab === 'sedes' && (
          <SedesCrudView 
            sedes={catalogos.sedes || []} 
            onRefresh={handleRefreshAll}
          />
        )}

        {activeTab === 'escuelas' && (
          <EscuelasCrudView 
            escuelas={catalogos.escuelas || []} 
            sedes={catalogos.sedes || []}
            onRefresh={handleRefreshAll}
          />
        )}

        {activeTab === 'otros' && (
          <NivelesParalelosJornadasCrudView 
            niveles={catalogos.niveles || []} 
            paralelos={catalogos.paralelos || []}
            jornadas={catalogos.jornadas || []}
            horas={catalogos.horas || []}
            onRefresh={handleRefreshAll}
          />
        )}
      </div>
    </div>
  );
};
