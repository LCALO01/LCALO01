import React, { useState, useEffect } from 'react';
import { Catalogos, PlanificacionCompleta, AulaLaboratorio } from '../types.ts';
import { 
  BookOpen, 
  Users, 
  Layers, 
  CalendarCheck,
  Clock, 
  GraduationCap,
  Plus,
  ArrowLeftRight,
  Building2,
  UserCheck
} from 'lucide-react';
import { DocentesCrudView } from './catalogos/DocentesCrudView.tsx';
import { AsignaturasCrudView } from './catalogos/AsignaturasCrudView.tsx';
import { NivelesParalelosJornadasCrudView } from './catalogos/NivelesParalelosJornadasCrudView.tsx';
import { AsignacionAulasView } from './AsignacionAulasView.tsx';
import { AsignarAsignaturasView } from './catalogos/AsignarAsignaturasView.tsx';
import { AsignarBloquesView } from './catalogos/AsignarBloquesView.tsx';
import { AsignarDocentesAulasView } from './catalogos/AsignarDocentesAulasView.tsx';

export type PlanificacionSubTabType = 
  | 'planificaciones' 
  | 'asignar_asignaturas' 
  | 'asignar_bloques' 
  | 'asignar_docentes' 
  | 'docentes' 
  | 'asignaturas' 
  | 'paralelos';

interface PlanificacionModuloProps {
  catalogos: Catalogos;
  planificaciones: PlanificacionCompleta[];
  aulas: AulaLaboratorio[];
  onOpenNewModal: () => void;
  onEdit: (plan: PlanificacionCompleta) => void;
  onRefresh: () => void;
  onRefreshAulas?: () => void;
  initialSubTab?: PlanificacionSubTabType;
  activeSubTab?: PlanificacionSubTabType;
  onTabChange?: (tab: PlanificacionSubTabType) => void;
}

export const PlanificacionModulo: React.FC<PlanificacionModuloProps> = ({
  catalogos,
  planificaciones,
  aulas,
  onOpenNewModal,
  onEdit,
  onRefresh,
  onRefreshAulas,
  initialSubTab = 'planificaciones',
  activeSubTab,
  onTabChange
}) => {
  const currentInitial = activeSubTab || initialSubTab || 'planificaciones';
  const [subTab, setSubTab] = useState<PlanificacionSubTabType>(currentInitial);

  useEffect(() => {
    const target = activeSubTab || initialSubTab;
    if (target && target !== subTab) {
      setSubTab(target);
    }
  }, [activeSubTab, initialSubTab]);

  const handleSubTabChange = (newTab: PlanificacionSubTabType) => {
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
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 uppercase tracking-wider mb-1">
            <BookOpen className="w-4 h-4 text-[#e5a800]" />
            <span>SISTEMA &gt; 4. PLANIFICACIÓN &gt; {subTab.toUpperCase()}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">
            {subTab === 'planificaciones' && 'Planificación Académica y Carga Horaria'}
            {subTab === 'asignar_asignaturas' && 'Asignación Curricular de Asignaturas por Carrera'}
            {subTab === 'asignar_bloques' && 'Asignación de Bloques por Carrera'}
            {subTab === 'asignar_docentes' && 'Asignación de Docentes y Aulas por Carrera'}
            {subTab === 'docentes' && 'Planta Docente Institucional'}
            {subTab === 'asignaturas' && 'Catálogo de Asignaturas y Malla'}
            {subTab === 'paralelos' && 'Paralelos, Niveles y Jornadas'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {subTab === 'planificaciones' && 'Asignación integral de materias, docentes, paralelos, jornadas y espacios físicos con aforo institucional'}
            {subTab === 'asignar_asignaturas' && 'Distribución interactiva con Drag & Drop y control estricto de pertenencia por carrera'}
            {subTab === 'asignar_bloques' && 'Distribución interactiva de acuerdo a la capacidad de aforo del bloque vs capacidad de estudiantes'}
            {subTab === 'asignar_docentes' && 'Asignación interactiva manual con combo box para cuadraturas de docentes, paralelos, jornadas, bloques, pisos, aulas y horarios vs aforo'}
            {subTab === 'docentes' && 'Registro de profesores, especialidades, carga horaria acumulada y horarios individuales'}
            {subTab === 'asignaturas' && 'Distribución de horas docentes, prácticas y autónomas por asignatura y créditos'}
            {subTab === 'paralelos' && 'Gestión de cupos, paralelos por nivel y jornadas de estudio (Matutina, Vespertina, Nocturna)'}
          </p>
        </div>

        {/* Sub-tab pills - CONGELADO / FIXED */}
        <div className="sticky top-0 z-30 bg-[#f1f5f9]/95 backdrop-blur-md py-2 px-1 rounded-2xl border-b border-slate-200/90 shadow-2xs flex flex-wrap items-center gap-1.5 self-start md:self-auto">
          <button
            onClick={() => handleSubTabChange('planificaciones')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              subTab === 'planificaciones'
                ? 'bg-[#1f0533] text-[#e5a800] shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <CalendarCheck className="w-3.5 h-3.5" />
            Planificación Académica ({planificaciones?.length || 0})
          </button>
          <button
            onClick={() => handleSubTabChange('asignar_asignaturas')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              subTab === 'asignar_asignaturas'
                ? 'bg-[#1f0533] text-[#e5a800] shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            Asignar Asignaturas
          </button>
          <button
            onClick={() => handleSubTabChange('asignar_bloques')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              subTab === 'asignar_bloques'
                ? 'bg-[#1f0533] text-[#e5a800] shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            Asignar Bloques
          </button>
          <button
            onClick={() => handleSubTabChange('asignar_docentes')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              subTab === 'asignar_docentes'
                ? 'bg-[#1f0533] text-[#e5a800] shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            Asignación docentes/aulas
          </button>
          <button
            onClick={() => handleSubTabChange('docentes')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              subTab === 'docentes'
                ? 'bg-[#1f0533] text-[#e5a800] shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Docente ({catalogos?.docentes?.length || 0})
          </button>
          <button
            onClick={() => handleSubTabChange('asignaturas')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              subTab === 'asignaturas'
                ? 'bg-[#1f0533] text-[#e5a800] shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Asignatura ({catalogos?.asignaturas?.length || 0})
          </button>
          <button
            onClick={() => handleSubTabChange('paralelos')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              subTab === 'paralelos'
                ? 'bg-[#1f0533] text-[#e5a800] shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Paralelo / Nivel / Jornada
          </button>
        </div>
      </div>

      {/* Sub-view render */}
      <div>
        {subTab === 'planificaciones' && (
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

        {subTab === 'asignar_asignaturas' && (
          <AsignarAsignaturasView
            catalogos={catalogos}
            onRefresh={onRefresh}
          />
        )}

        {subTab === 'asignar_bloques' && (
          <AsignarBloquesView
            catalogos={catalogos}
            planificaciones={planificaciones || []}
            aulas={aulas}
            onRefresh={onRefresh}
          />
        )}

        {subTab === 'asignar_docentes' && (
          <AsignarDocentesAulasView
            catalogos={catalogos}
            planificaciones={planificaciones || []}
            aulas={aulas}
            onRefresh={onRefresh}
            onRefreshAulas={onRefreshAulas}
          />
        )}

        {subTab === 'docentes' && (
          <DocentesCrudView
            docentes={catalogos?.docentes || []}
            planificaciones={planificaciones || []}
            carreras={catalogos?.carreras || []}
            onRefresh={onRefresh}
          />
        )}

        {subTab === 'asignaturas' && (
          <AsignaturasCrudView
            asignaturas={catalogos?.asignaturas || []}
            planificaciones={planificaciones || []}
            carreras={catalogos?.carreras || []}
            onRefresh={onRefresh}
          />
        )}

        {subTab === 'paralelos' && (
          <NivelesParalelosJornadasCrudView
            niveles={catalogos?.niveles || []}
            paralelos={catalogos?.paralelos || []}
            jornadas={catalogos?.jornadas || []}
            horas={catalogos?.horas || []}
            onRefresh={onRefresh}
          />
        )}
      </div>
    </div>
  );
};
