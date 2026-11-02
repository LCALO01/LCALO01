import React, { useState, useEffect } from 'react';
import { Catalogos, AulaLaboratorio, PlanificacionCompleta } from '../types.ts';
import { PlanificacionAulasView } from './PlanificacionAulasView.tsx';
import { AsignacionAulasView } from './AsignacionAulasView.tsx';
import { MatrizHorariosView } from './MatrizHorariosView.tsx';
import { GestionAulasView } from './GestionAulasView.tsx';
import { ReportesView } from './ReportesView.tsx';
import { FeriadosView } from './FeriadosView.tsx';
import { CatalogosMaestrosModulo } from './CatalogosMaestrosModulo.tsx';

interface GestionAulasModuloProps {
  catalogos: Catalogos;
  aulas: AulaLaboratorio[];
  planificaciones: PlanificacionCompleta[];
  onOpenNewModal: () => void;
  onEdit: (plan: PlanificacionCompleta) => void;
  onRefresh: () => void;
  onRefreshAulas: () => void;
  onSelectPlan: (plan: PlanificacionCompleta) => void;
  initialSubTab?: 'planificacion_aulas' | 'asignaciones' | 'matriz' | 'inventario' | 'reportes' | 'feriados' | 'catalogos';
  activeSubTab?: 'planificacion_aulas' | 'asignaciones' | 'matriz' | 'inventario' | 'reportes' | 'feriados' | 'catalogos';
  onTabChange?: (tab: string) => void;
  semaforoFilter?: 'TODOS' | 'DISPONIBLE' | 'EN_PROCESO' | 'OCUPADO';
}

export const GestionAulasModulo: React.FC<GestionAulasModuloProps> = ({
  catalogos,
  aulas,
  planificaciones,
  onOpenNewModal,
  onEdit,
  onRefresh,
  onRefreshAulas,
  onSelectPlan,
  initialSubTab = 'planificacion_aulas',
  activeSubTab,
  onTabChange,
  semaforoFilter = 'TODOS'
}) => {
  const currentInitial = activeSubTab || initialSubTab || 'planificacion_aulas';
  const [subTab, setSubTab] = useState<'planificacion_aulas' | 'asignaciones' | 'matriz' | 'inventario' | 'reportes' | 'feriados' | 'catalogos'>(currentInitial);

  useEffect(() => {
    const target = activeSubTab || initialSubTab;
    if (target && target !== subTab) {
      setSubTab(target);
    }
  }, [activeSubTab, initialSubTab]);

  return (
    <div className="w-full">
      {/* Sub-view render - Navigation is handled by the left sidebar and in-view triggers */}
      <div>
        {subTab === 'planificacion_aulas' && (
          <PlanificacionAulasView
            catalogos={catalogos}
            aulas={aulas}
            planificaciones={planificaciones || []}
            onOpenNewModal={onOpenNewModal}
            onSelectPlan={onSelectPlan}
            initialSemaforoFilter={semaforoFilter as any}
          />
        )}

        {subTab === 'asignaciones' && (
          <AsignacionAulasView
            catalogos={catalogos}
            aulas={aulas}
            planificaciones={planificaciones || []}
            onOpenNewModal={onOpenNewModal}
            onEdit={onEdit}
            onRefresh={onRefresh}
            onRefreshAulas={onRefreshAulas}
          />
        )}

        {subTab === 'matriz' && (
          <MatrizHorariosView
            catalogos={catalogos}
            aulas={aulas}
            planificaciones={planificaciones || []}
            onSelectPlan={onSelectPlan}
          />
        )}

        {subTab === 'inventario' && (
          <GestionAulasView
            catalogos={catalogos}
            aulas={aulas}
            planificaciones={planificaciones || []}
            onRefreshAulas={onRefreshAulas}
          />
        )}

        {subTab === 'catalogos' && (
          <CatalogosMaestrosModulo
            catalogos={catalogos}
            planificaciones={planificaciones || []}
            aulas={aulas}
            onRefreshCatalogos={onRefresh}
            onRefreshAulas={onRefreshAulas}
          />
        )}

        {subTab === 'reportes' && (
          <ReportesView
            catalogos={catalogos}
            aulas={aulas}
            planificaciones={planificaciones || []}
          />
        )}

        {subTab === 'feriados' && (
          <FeriadosView catalogos={catalogos} />
        )}
      </div>
    </div>
  );
};
