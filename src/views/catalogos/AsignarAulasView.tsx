import React, { useState, useEffect, useMemo } from 'react';
import { Catalogos, AulaLaboratorio, PlanificacionCompleta, Asignatura } from '../../types.ts';
import { ApiClient } from '../../controllers/apiClient.ts';
import { CapacidadAlertModal } from '../../components/CapacidadAlertModal.tsx';
import { getAulasRecomendadas, playCapacityAlertSound } from '../../utils/classroomRecommendation.ts';
import { 
  Building2, 
  Users, 
  Trash2, 
  Search, 
  ArrowLeftRight, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  GripVertical, 
  X, 
  Plus, 
  BookOpen, 
  Sparkles,
  Layers,
  GraduationCap,
  DoorOpen,
  Calendar,
  Clock
} from 'lucide-react';

interface AsignarAulasViewProps {
  catalogos: Catalogos;
  aulas: AulaLaboratorio[];
  planificaciones: PlanificacionCompleta[];
  onRefresh?: () => void;
  onRefreshAulas?: () => void;
}

export const AsignarAulasView: React.FC<AsignarAulasViewProps> = ({
  catalogos,
  aulas,
  planificaciones,
  onRefresh,
  onRefreshAulas
}) => {
  // Filtros de encabezado
  const [selectedSedeId, setSelectedSedeId] = useState<number>(catalogos.sedes[0]?.id_sede || 1);
  const [selectedEscuelaId, setSelectedEscuelaId] = useState<number>(catalogos.escuelas[0]?.id_escuela || 1);
  const [selectedJornadaId, setSelectedJornadaId] = useState<string>('TODAS');
  const [selectedCarreraId, setSelectedCarreraId] = useState<string>('TODAS');

  // Asignatura seleccionada en la columna izquierda
  const [selectedAsignaturaId, setSelectedAsignaturaId] = useState<number>(() => {
    return catalogos.asignaturas[0]?.id_asignatura || 1;
  });

  // Toggle de vista columna derecha: 'aulas_capacidad' vs 'numero_estudiantes'
  const [rightPanelView, setRightPanelView] = useState<'aulas_capacidad' | 'numero_estudiantes'>('aulas_capacidad');

  // Filtros de columna derecha
  const [searchTermAula, setSearchTermAula] = useState<string>('');
  const [selectedBloqueFilter, setSelectedBloqueFilter] = useState<string>('TODOS');
  const [selectedCapacidadFilter, setSelectedCapacidadFilter] = useState<string>('TODAS');
  const [selectedTipoAula, setSelectedTipoAula] = useState<string>('TODOS');

  // Drag and drop state
  const [draggedAulaId, setDraggedAulaId] = useState<number | null>(null);
  const [dragSource, setDragSource] = useState<'assigned' | 'available' | null>(null);
  const [isOverMiddleDrop, setIsOverMiddleDrop] = useState<boolean>(false);
  const [isOverTrashDrop, setIsOverTrashDrop] = useState<boolean>(false);

  // Modales y notificaciones
  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    titulo: string;
    mensaje: string;
    aulaCodigo: string;
    aulaCapacidad: number;
    estudiantesRequeridos: number;
    asignaturaNombre: string;
  } | null>(null);

  const [capacidadAlert, setCapacidadAlert] = useState<{
    isOpen: boolean;
    mode: 'INSUFICIENTE' | 'RECOMENDACION';
    aula: AulaLaboratorio;
    numeroEstudiantes: number;
    recomendadas: any[];
  } | null>(null);

  const [confirmClearModal, setConfirmClearModal] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Asignaturas filtradas por carrera / escuela
  const asignaturasFiltradas = useMemo(() => {
    return catalogos.asignaturas.filter(asig => {
      if (selectedCarreraId !== 'TODAS') {
        const idCarr = Number(selectedCarreraId);
        // Filtrar si pertenece a la carrera
        const carrObj = catalogos.carreras.find(c => c.id_carrera === idCarr);
        if (carrObj) {
          const code = asig.codigo_asignatura.toUpperCase();
          const prefix = code.split('_')[0] || '';
          if (carrObj.codigo && !carrObj.codigo.includes(prefix) && !code.startsWith(carrObj.codigo)) {
            // Verificar también por catálogo de planificaciones existentes
            const tienePlanCarrera = planificaciones.some(p => p.id_asignatura === asig.id_asignatura && p.id_carrera === idCarr);
            if (!tienePlanCarrera) return false;
          }
        }
      }
      return true;
    });
  }, [catalogos.asignaturas, catalogos.carreras, selectedCarreraId, planificaciones]);

  // Asegurar selección válida de asignatura
  useEffect(() => {
    if (asignaturasFiltradas.length > 0) {
      const existe = asignaturasFiltradas.some(a => a.id_asignatura === selectedAsignaturaId);
      if (!existe) {
        setSelectedAsignaturaId(asignaturasFiltradas[0].id_asignatura);
      }
    }
  }, [asignaturasFiltradas, selectedAsignaturaId]);

  // Asignatura actual seleccionada
  const asignaturaActual = useMemo(() => {
    return catalogos.asignaturas.find(a => a.id_asignatura === selectedAsignaturaId) || asignaturasFiltradas[0] || {
      id_asignatura: 1,
      codigo_asignatura: 'DES_P101',
      nombre: 'SISTEMAS OPERATIVOS',
      creditos: 3,
      horas_totales: 48
    };
  }, [catalogos.asignaturas, asignaturasFiltradas, selectedAsignaturaId]);

  // Planificaciones y aulas asignadas a la asignatura actual
  const planificacionesAsignatura = useMemo(() => {
    return planificaciones.filter(p => p.id_asignatura === asignaturaActual.id_asignatura);
  }, [planificaciones, asignaturaActual.id_asignatura]);

  // Lista de aulas asignadas directamente a esta materia
  const aulasAsignadas = useMemo(() => {
    const list: Array<{
      plan: PlanificacionCompleta;
      aula: AulaLaboratorio;
      numeroEstudiantes: number;
    }> = [];

    planificacionesAsignatura.forEach(p => {
      if (p.id_aula_laboratorio && p.id_aula_laboratorio > 1) {
        const aulaFound = aulas.find(a => a.id_aula_laboratorio === p.id_aula_laboratorio);
        if (aulaFound) {
          list.push({
            plan: p,
            aula: aulaFound,
            numeroEstudiantes: p.numero_estudiantes || 25
          });
        }
      }
    });

    return list;
  }, [planificacionesAsignatura, aulas]);

  // Bloques de la sede seleccionada
  const bloquesSede = useMemo(() => {
    return catalogos.bloques?.filter(b => !selectedSedeId || b.id_sede === selectedSedeId) || [];
  }, [catalogos.bloques, selectedSedeId]);

  // Nombre de asignatura truncado con punto final como en la imagen ("ADMINISTRACIO.")
  const nombreAsignaturaTruncado = useMemo(() => {
    const raw = (asignaturaActual.nombre || 'ADMINISTRACIÓN').trim().toUpperCase();
    if (raw.length > 13) {
      return `${raw.substring(0, 13)}.`;
    }
    return raw;
  }, [asignaturaActual.nombre]);

  // Aulas disponibles para la columna derecha
  const aulasDisponibles = useMemo(() => {
    return aulas.filter(aula => {
      // Filtrar por sede
      if (selectedSedeId && aula.id_sede !== selectedSedeId) return false;

      // Filtrar por Bloque
      if (selectedBloqueFilter !== 'TODOS') {
        const idBloque = Number(selectedBloqueFilter);
        if (aula.id_bloque !== idBloque && aula.bloque_nombre !== selectedBloqueFilter) {
          return false;
        }
      }

      // Filtrar por término de búsqueda
      if (searchTermAula.trim()) {
        const t = searchTermAula.toLowerCase();
        const matchCode = aula.codigo.toLowerCase().includes(t);
        const matchName = aula.nombre.toLowerCase().includes(t);
        const matchBlock = (aula.bloque_nombre || '').toLowerCase().includes(t);
        if (!matchCode && !matchName && !matchBlock) return false;
      }

      // Filtrar por tipo
      if (selectedTipoAula !== 'TODOS' && aula.tipo !== selectedTipoAula) {
        return false;
      }

      // Filtrar por capacidad
      if (selectedCapacidadFilter === 'CAP_25' && aula.capacidad < 25) return false;
      if (selectedCapacidadFilter === 'CAP_35' && aula.capacidad < 35) return false;
      if (selectedCapacidadFilter === 'CAP_50' && aula.capacidad < 50) return false;

      return true;
    });
  }, [aulas, selectedSedeId, selectedBloqueFilter, searchTermAula, selectedTipoAula, selectedCapacidadFilter]);

  // Total de miembros asignados / capacidad
  const totalMiembrosAsignadosCount = useMemo(() => {
    if (aulasAsignadas.length > 0) return aulasAsignadas.length;
    // O retornar el número de planificaciones de esta asignatura
    return planificacionesAsignatura.length;
  }, [aulasAsignadas, planificacionesAsignatura]);

  // =========================================================================
  // GESTIÓN DE ASIGNACIÓN CON CONTROL DE CAPACIDAD Y ALERTAS
  // =========================================================================
  const ejecutarAsignacionDirecta = async (aulaIdTarget: number) => {
    const aulaTarget = aulas.find(a => a.id_aula_laboratorio === aulaIdTarget);
    if (!aulaTarget) return false;
    try {
      if (planificacionesAsignatura.length > 0) {
        // Actualizar la primera planificación (o todas) de esta asignatura
        await ApiClient.asignarAulaDirecta({
          id_planificacion: planificacionesAsignatura[0].id_planificacion,
          id_aula_laboratorio: aulaTarget.id_aula_laboratorio
        });
      } else {
        // Asignar por asignatura
        await ApiClient.asignarAulaDirecta({
          id_asignatura: asignaturaActual.id_asignatura,
          id_aula_laboratorio: aulaTarget.id_aula_laboratorio
        });
      }

      if (onRefresh) onRefresh();
      if (onRefreshAulas) onRefreshAulas();

      showToast(`Aula [${aulaTarget.codigo}] asignada exitosamente a ${asignaturaActual.nombre}`, 'success');
      return true;
    } catch (err: any) {
      showToast(err.message || 'Error al asignar aula', 'error');
      return false;
    }
  };

  const asignarAula = async (aulaId: number) => {
    const aula = aulas.find(a => a.id_aula_laboratorio === aulaId);
    if (!aula) return false;

    // Obtener estudiantes requeridos
    const estudiantesRequeridos = planificacionesAsignatura[0]?.numero_estudiantes || 25;

    // 1. REGLA 1: Si la capacidad del aula es menor al número de estudiantes
    // Debe generar una alerta y NO permitir el ingreso
    if (aula.capacidad < estudiantesRequeridos) {
      playCapacityAlertSound();
      const recomendadasSuficientes = getAulasRecomendadas(aulas, estudiantesRequeridos, aula.id_aula_laboratorio);
      setCapacidadAlert({
        isOpen: true,
        mode: 'INSUFICIENTE',
        aula,
        numeroEstudiantes: estudiantesRequeridos,
        recomendadas: recomendadasSuficientes
      });
      showToast(`⛔ Capacidad insuficiente en aula ${aula.codigo} (Capacidad: ${aula.capacidad} < Estudiantes: ${estudiantesRequeridos}). ¡Ingreso no permitido!`, 'error');
      return false; // BLOQUEADO: Ingreso no permitido
    }

    // 2. REGLA 2: Si la capacidad del aula es mayor al número de estudiantes
    // Verificar cuál es el aula recomendada. Ejemplo si el aula es de capacidad 30 y el número de estudiantes es 10
    // entonces debe lanzar una alerta y listar las aulas apropiadas que ajuste de acuerdo a las capacidades.
    const diferencia = aula.capacidad - estudiantesRequeridos;
    const ratioOcupacion = estudiantesRequeridos / aula.capacidad;
    const recomendadasAjustadas = getAulasRecomendadas(
      aulas,
      estudiantesRequeridos,
      aula.id_aula_laboratorio,
      undefined,
      { maxCapacidadFiltro: aula.capacidad }
    );

    if ((diferencia >= 5 || ratioOcupacion < 0.8) && recomendadasAjustadas.length > 0) {
      setCapacidadAlert({
        isOpen: true,
        mode: 'RECOMENDACION',
        aula,
        numeroEstudiantes: estudiantesRequeridos,
        recomendadas: recomendadasAjustadas
      });
      return false;
    }

    return await ejecutarAsignacionDirecta(aulaId);
  };

  // Retirar aula asignada
  const retirarAula = async (planId?: number) => {
    try {
      if (planId) {
        await ApiClient.retirarAulaDirecta({ id_planificacion: planId });
      } else {
        await ApiClient.retirarAulaDirecta({ id_asignatura: asignaturaActual.id_asignatura });
      }

      if (onRefresh) onRefresh();
      if (onRefreshAulas) onRefreshAulas();

      showToast(`Aula retirada de ${asignaturaActual.nombre}`, 'info');
    } catch (err: any) {
      showToast(err.message || 'Error al retirar aula', 'error');
    }
  };

  // Retirar todas las aulas
  const confirmarRetirarTodas = async () => {
    for (const p of planificacionesAsignatura) {
      await ApiClient.retirarAulaDirecta({ id_planificacion: p.id_planificacion });
    }
    setConfirmClearModal(false);
    if (onRefresh) onRefresh();
    if (onRefreshAulas) onRefreshAulas();
    showToast(`Todas las aulas han sido retiradas de ${asignaturaActual.nombre}`, 'info');
  };

  // =========================================================================
  // DRAG & DROP HTML5 HANDLERS
  // =========================================================================
  const handleDragStart = (e: React.DragEvent, id: number, source: 'assigned' | 'available') => {
    setDraggedAulaId(id);
    setDragSource(source);
    e.dataTransfer.setData('text/plain', JSON.stringify({ id, source }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedAulaId(null);
    setDragSource(null);
    setIsOverMiddleDrop(false);
    setIsOverTrashDrop(false);
  };

  const handleDragOverMiddle = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!isOverMiddleDrop) setIsOverMiddleDrop(true);
  };

  const handleDragLeaveMiddle = () => {
    setIsOverMiddleDrop(false);
  };

  const handleDropMiddle = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsOverMiddleDrop(false);
    if (!draggedAulaId) return;

    if (dragSource === 'available') {
      await asignarAula(draggedAulaId);
    }
    setDraggedAulaId(null);
    setDragSource(null);
  };

  const handleDragOverTrash = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!isOverTrashDrop) setIsOverTrashDrop(true);
  };

  const handleDragLeaveTrash = () => {
    setIsOverTrashDrop(false);
  };

  const handleDropTrash = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsOverTrashDrop(false);
    if (!draggedAulaId) return;

    if (dragSource === 'assigned') {
      const item = aulasAsignadas.find(a => a.aula.id_aula_laboratorio === draggedAulaId);
      await retirarAula(item?.plan.id_planificacion);
    }
    setDraggedAulaId(null);
    setDragSource(null);
  };

  return (
    <div className="space-y-4 pb-12 animate-in fade-in duration-200">
      {/* Toast Notificación Flotante */}
      {toastMessage && (
        <div 
          className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-sm font-semibold transition-all transform animate-in slide-in-from-top-2 ${
            toastMessage.type === 'error' 
              ? 'bg-rose-600 text-white border-rose-700 shadow-rose-900/20' 
              : toastMessage.type === 'info' 
              ? 'bg-slate-800 text-white border-slate-700 shadow-slate-900/20' 
              : 'bg-emerald-600 text-white border-emerald-700 shadow-emerald-900/20'
          }`}
        >
          {toastMessage.type === 'error' && <ShieldAlert className="w-5 h-5 shrink-0 text-white animate-bounce" />}
          {toastMessage.type === 'info' && <ArrowLeftRight className="w-5 h-5 shrink-0 text-amber-300" />}
          {toastMessage.type === 'success' && <CheckCircle2 className="w-5 h-5 shrink-0 text-white" />}
          <span>{toastMessage.text}</span>
          <button 
            onClick={() => setToastMessage(null)}
            className="ml-2 text-white/80 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Modal Alerta Institucional de Capacidad / Sobrecupo */}
      {alertModal?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full border-4 border-amber-500 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-red-600 p-5 text-white flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0 border border-white/30 shadow-inner">
                <AlertTriangle className="w-7 h-7 text-white animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest bg-amber-900/50 px-2 py-0.5 rounded-full border border-white/20">
                  CONTROL DE AFORO INSTITUCIONAL
                </span>
                <h3 className="text-xl font-black tracking-tight leading-tight mt-0.5">
                  {alertModal.titulo}
                </h3>
              </div>
            </div>

            <div className="p-6 space-y-4 text-slate-800">
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 space-y-2">
                <p className="text-sm leading-relaxed font-semibold">
                  {alertModal.mensaje}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 font-bold uppercase tracking-wider block text-[10px]">
                    Capacidad Máxima del Aula:
                  </span>
                  <span className="text-lg font-black text-rose-600">
                    {alertModal.aulaCapacidad} estudiantes
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 font-bold uppercase tracking-wider block text-[10px]">
                    Estudiantes Matriculados:
                  </span>
                  <span className="text-lg font-black text-slate-900">
                    {alertModal.estudiantesRequeridos} estudiantes
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-[11px] text-rose-900 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                <span>
                  <strong>Restricción activa:</strong> Se requiere un aula con capacidad mayor o igual a los estudiantes requeridos.
                </span>
              </div>
            </div>

            <div className="bg-slate-100 px-6 py-4 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setAlertModal(null)}
                className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-black text-sm rounded-xl shadow-md transition cursor-pointer"
              >
                Entendido / Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Institucional de Capacidad Insuficiente / Recomendación de Aulas */}
      {capacidadAlert && (
        <CapacidadAlertModal
          isOpen={capacidadAlert.isOpen}
          mode={capacidadAlert.mode}
          aulaSeleccionada={capacidadAlert.aula}
          numeroEstudiantes={capacidadAlert.numeroEstudiantes}
          aulasRecomendadas={capacidadAlert.recomendadas}
          onClose={() => setCapacidadAlert(null)}
          onSelectAula={async (newAulaId) => {
            setCapacidadAlert(null);
            await ejecutarAsignacionDirecta(newAulaId);
          }}
          onKeepCurrent={async () => {
            const currentId = capacidadAlert.aula.id_aula_laboratorio;
            setCapacidadAlert(null);
            await ejecutarAsignacionDirecta(currentId);
          }}
        />
      )}

      {/* Modal Confirmación Retirar Todos */}
      {confirmClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <h3 className="text-lg font-black text-slate-900">
                ¿Retirar todas las aulas?
              </h3>
            </div>
            <p className="text-sm text-slate-600">
              ¿Está seguro de retirar todas las aulas asignadas a la asignatura{' '}
              <strong className="text-slate-900 font-black">"{asignaturaActual.nombre}"</strong>?
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setConfirmClearModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarRetirarTodas}
                className="px-4 py-2 rounded-xl text-xs font-black bg-rose-600 text-white hover:bg-rose-700 shadow-sm cursor-pointer"
              >
                Sí, retirar todas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          ENCABEZADO DE FILTROS SUPERIORES (Sede, Escuela, Jornada, Carrera)
          Fiel a la captura proporcionada
      ========================================================================= */}
      <div className="space-y-3">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Asignar Aula
        </h1>

        <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-1">
          {/* Sede */}
          <div className="flex items-center gap-2.5">
            <label className="text-base sm:text-lg font-black text-slate-900">
              Sede
            </label>
            <div className="relative min-w-[170px]">
              <select
                value={selectedSedeId}
                onChange={e => setSelectedSedeId(Number(e.target.value))}
                className="w-full appearance-none bg-white border border-slate-300 rounded-lg px-3 py-1.5 pr-8 text-xs sm:text-sm font-semibold text-slate-800 shadow-2xs focus:outline-hidden focus:border-indigo-600 cursor-pointer"
              >
                {catalogos.sedes.map(s => (
                  <option key={s.id_sede} value={s.id_sede}>
                    {s.nombre}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Escuela */}
          <div className="flex items-center gap-2.5">
            <label className="text-base sm:text-lg font-black text-slate-900">
              Escuela
            </label>
            <div className="relative min-w-[200px]">
              <select
                value={selectedEscuelaId}
                onChange={e => setSelectedEscuelaId(Number(e.target.value))}
                className="w-full appearance-none bg-white border border-slate-300 rounded-lg px-3 py-1.5 pr-8 text-xs sm:text-sm font-semibold text-slate-800 shadow-2xs focus:outline-hidden focus:border-indigo-600 cursor-pointer"
              >
                {catalogos.escuelas.map(esc => (
                  <option key={esc.id_escuela} value={esc.id_escuela}>
                    {esc.nombre}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Jornada */}
          <div className="flex items-center gap-2.5">
            <label className="text-base sm:text-lg font-black text-slate-900">
              Jornada
            </label>
            <div className="relative min-w-[170px]">
              <select
                value={selectedJornadaId}
                onChange={e => setSelectedJornadaId(e.target.value)}
                className="w-full appearance-none bg-white border border-slate-300 rounded-lg px-3 py-1.5 pr-8 text-xs sm:text-sm font-semibold text-slate-800 shadow-2xs focus:outline-hidden focus:border-indigo-600 cursor-pointer"
              >
                <option value="TODAS">Todas las Jornadas</option>
                {catalogos.jornadas.map(j => (
                  <option key={j.id_jornada} value={String(j.id_jornada)}>
                    {j.nombre}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Carrera */}
          <div className="flex items-center gap-2.5">
            <label className="text-base sm:text-lg font-black text-slate-900">
              Carrera
            </label>
            <div className="relative min-w-[180px]">
              <select
                value={selectedCarreraId}
                onChange={e => setSelectedCarreraId(e.target.value)}
                className="w-full appearance-none bg-white border border-slate-300 rounded-lg px-3 py-1.5 pr-8 text-xs sm:text-sm font-semibold text-slate-800 shadow-2xs focus:outline-hidden focus:border-indigo-600 cursor-pointer"
              >
                <option value="TODAS">Todas las Carreras</option>
                {catalogos.carreras.map(c => (
                  <option key={c.id_carrera} value={String(c.id_carrera)}>
                    {c.nombre}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          CONTENEDOR DE 3 COLUMNAS:
          1. Columna 1: Asignaturas
          2. Columna 2: Miembros Asignados (Aulas Asignadas)
          3. Columna 3: Aulas(Capacidad) / Número de Estudiantes
      ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start pt-2">
        {/* ---------------------------------------------------------------------
            COLUMNA 1: ASIGNATURAS (Ancho: lg:col-span-3)
            Con selector vertical en púrpura y badge amarillo idéntico a la imagen
        --------------------------------------------------------------------- */}
        <div className="lg:col-span-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
              Asignaturas
            </h2>
            <span className="text-[11px] font-bold text-slate-400">
              {asignaturasFiltradas.length} asignaturas
            </span>
          </div>

          <div className="bg-transparent space-y-1 max-h-[600px] overflow-y-auto pr-1">
            {asignaturasFiltradas.map(asig => {
              const isSelected = asig.id_asignatura === selectedAsignaturaId;
              // Contar aulas o paralelos vinculados a esta materia
              const countPlans = planificaciones.filter(p => p.id_asignatura === asig.id_asignatura).length;
              const badgeNum = countPlans > 0 ? countPlans : Math.floor((asig.id_asignatura % 8) + 1);

              return (
                <button
                  key={asig.id_asignatura}
                  onClick={() => setSelectedAsignaturaId(asig.id_asignatura)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center justify-between group ${
                    isSelected
                      ? 'bg-purple-900 text-white shadow-xs font-black'
                      : 'text-slate-800 hover:bg-slate-100 hover:text-slate-950 font-bold'
                  }`}
                >
                  <span className="truncate uppercase tracking-tight">
                    {asig.nombre}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold shrink-0 ml-2 ${
                      isSelected
                        ? 'bg-[#e5a800] text-[#1f0533]'
                        : 'bg-slate-200 text-slate-600 group-hover:bg-slate-300'
                    }`}
                  >
                    {badgeNum}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ---------------------------------------------------------------------
            COLUMNA 2: MIEMBROS ASIGNADOS (Ancho: lg:col-span-4)
            Header con contador, botón "Retirar todos", aviso amarillo y drop target
        --------------------------------------------------------------------- */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col min-h-[580px]">
          {/* Header Miembros Asignados */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                <Users className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <span>Miembros Asignados</span>
                  <span className="text-[11px] font-mono font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-100">
                    {totalMiembrosAsignadosCount}
                  </span>
                </h3>
              </div>
            </div>

            <button
              disabled={aulasAsignadas.length === 0}
              onClick={() => setConfirmClearModal(true)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                aulasAsignadas.length > 0
                  ? 'bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100'
                  : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Retirar todos</span>
            </button>
          </div>

          {/* Banner de Aviso Amarillo (Exacto a la imagen) */}
          <div className="p-3">
            <div className="bg-amber-50/80 border border-amber-300 rounded-xl p-3 flex items-center gap-2.5 text-amber-900 text-xs shadow-2xs">
              <ArrowLeftRight className="w-4 h-4 text-amber-600 shrink-0" />
              <p className="leading-snug font-medium">
                Para retirar: arrastra hacia la derecha o presiona el botón <strong>"Retirar"</strong>.
              </p>
            </div>
          </div>

          {/* Zona de Drop para Asignar Aula a la Materia */}
          <div
            onDragOver={handleDragOverMiddle}
            onDragLeave={handleDragLeaveMiddle}
            onDrop={handleDropMiddle}
            className={`flex-1 p-3 transition-colors ${
              isOverMiddleDrop
                ? 'bg-indigo-50/60 border-2 border-dashed border-indigo-400 rounded-xl m-2'
                : ''
            }`}
          >
            {isOverMiddleDrop && (
              <div className="py-4 text-center text-indigo-700 font-bold text-xs bg-indigo-100/50 rounded-lg mb-3 animate-pulse border border-indigo-200">
                ➕ Soltar aquí para asignar aula a {asignaturaActual.nombre}
              </div>
            )}

            {aulasAsignadas.length === 0 ? (
              <div className="py-16 text-center space-y-2 border-2 border-dashed border-slate-200 rounded-xl m-1">
                <DoorOpen className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-600">
                  No hay aulas asignadas a esta materia
                </p>
                <p className="text-[11px] text-slate-400 max-w-[240px] mx-auto">
                  Arrastra un aula desde la columna derecha para vincularla a "{asignaturaActual.nombre}".
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[560px] overflow-y-auto pr-1">
                {aulasAsignadas.map((item, idx) => {
                  const a = item.aula;
                  const est = item.numeroEstudiantes;
                  const ratio = Math.round((est / a.capacidad) * 100);
                  const isSobrecupo = est > a.capacidad;

                  return (
                    <div
                      key={`${a.id_aula_laboratorio}-${idx}`}
                      draggable
                      onDragStart={e => handleDragStart(e, a.id_aula_laboratorio, 'assigned')}
                      onDragEnd={handleDragEnd}
                      className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-2xs flex items-center justify-between gap-3 group transition cursor-grab active:cursor-grabbing hover:border-indigo-200"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <GripVertical className="w-4 h-4 text-slate-300 group-hover:text-slate-500 shrink-0" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-mono font-black bg-indigo-50 text-indigo-800 px-1.5 py-0.2 rounded border border-indigo-100">
                              {a.codigo}
                            </span>
                            <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                              {a.tipo}
                            </span>
                            <span className={`text-[9px] font-black px-1.5 py-0.2 rounded ${
                              isSobrecupo 
                                ? 'bg-rose-100 text-rose-800' 
                                : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              Aforo: {a.capacidad} est.
                            </span>
                          </div>
                          <h4 className="text-xs font-black text-slate-900 truncate mt-0.5">
                            {a.nombre}
                          </h4>
                          <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-2">
                            <span>{a.bloque_nombre || 'Bloque Central'}</span>
                            <span>•</span>
                            <span>Estudiantes: <strong>{est}</strong> ({ratio}% aforo)</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => retirarAula(item.plan.id_planificacion)}
                        className="px-2 py-1 rounded-lg text-[11px] font-bold text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition shrink-0 cursor-pointer"
                        title="Retirar aula"
                      >
                        Retirar
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ---------------------------------------------------------------------
            COLUMNA 3: AULAS(CAPACIDAD) / NUMERO DE ESTUDIANTES (Ancho: lg:col-span-5)
            Permite alternar pestañas como en la imagen compuesta del usuario
        --------------------------------------------------------------------- */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col min-h-[580px]">
          {/* Header Aulas(Capacidad) / Numero de estudiantes con Selector de Vista Fiel a la Captura */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setRightPanelView('numero_estudiantes')}
                className={`text-xs sm:text-sm font-black px-2.5 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  rightPanelView === 'numero_estudiantes'
                    ? 'bg-purple-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-bold'
                }`}
              >
                <span>Numero de estudiantes</span>
                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                  rightPanelView === 'numero_estudiantes' ? 'bg-[#e5a800] text-[#1f0533]' : 'bg-slate-200 text-slate-700'
                }`}>
                  {aulasDisponibles.length}
                </span>
              </button>

              <button
                onClick={() => setRightPanelView('aulas_capacidad')}
                className={`text-xs sm:text-sm font-black px-2.5 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 text-left ${
                  rightPanelView === 'aulas_capacidad'
                    ? 'bg-purple-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-bold'
                }`}
              >
                <span className="leading-tight">Aulas(Capacidad)<br className="hidden sm:inline" /> / Bloque</span>
                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full shrink-0 ${
                  rightPanelView === 'aulas_capacidad' ? 'bg-[#e5a800] text-[#1f0533]' : 'bg-slate-200 text-slate-700'
                }`}>
                  {aulasDisponibles.length}
                </span>
              </button>
            </div>
          </div>

          <div className="p-4 space-y-3.5">
            {/* Zona de Drop para Retirar (Fiel a la captura: red dashed border con Soltar aquí para retirar de "ADMINISTRACIO.") */}
            <div
              onDragOver={handleDragOverTrash}
              onDragLeave={handleDragLeaveTrash}
              onDrop={handleDropTrash}
              className={`border-2 border-dashed rounded-xl p-3 text-center transition-all cursor-default ${
                isOverTrashDrop
                  ? 'border-red-600 bg-red-100/90 scale-[1.01] shadow-md'
                  : 'border-red-200 bg-red-50/50 hover:bg-red-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2 text-red-600 font-black text-xs sm:text-sm">
                <Trash2 className="w-4 h-4 text-red-600 shrink-0" />
                <span className="truncate max-w-[320px]">
                  Soltar aquí para retirar de "{nombreAsignaturaTruncado}"
                </span>
              </div>
            </div>

            {/* Barra de Búsqueda */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTermAula}
                onChange={e => setSearchTermAula(e.target.value)}
                placeholder="Buscar aula por código, nombre o bloque..."
                className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-indigo-600 shadow-2xs"
              />
              {searchTermAula && (
                <button
                  onClick={() => setSearchTermAula('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filtros de Bloque, Capacidad y Tipo de Aula */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div className="relative">
                <select
                  value={selectedBloqueFilter}
                  onChange={e => setSelectedBloqueFilter(e.target.value)}
                  className="w-full appearance-none bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 pr-6 text-[11px] sm:text-xs font-semibold text-slate-700 shadow-2xs focus:outline-hidden focus:border-indigo-600 cursor-pointer"
                >
                  <option value="TODOS">Todos los Bloques</option>
                  {bloquesSede.map(b => (
                    <option key={b.id_bloque} value={String(b.id_bloque)}>
                      {b.nombre}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1.5 text-slate-400">
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              </div>

              <div className="relative">
                <select
                  value={selectedCapacidadFilter}
                  onChange={e => setSelectedCapacidadFilter(e.target.value)}
                  className="w-full appearance-none bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 pr-6 text-[11px] sm:text-xs font-semibold text-slate-700 shadow-2xs focus:outline-hidden focus:border-indigo-600 cursor-pointer"
                >
                  <option value="TODAS">Todas capacidades</option>
                  <option value="CAP_25">Mínimo 25 est.</option>
                  <option value="CAP_35">Mínimo 35 est.</option>
                  <option value="CAP_50">Mínimo 50 est.</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1.5 text-slate-400">
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              </div>

              <div className="relative">
                <select
                  value={selectedTipoAula}
                  onChange={e => setSelectedTipoAula(e.target.value)}
                  className="w-full appearance-none bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 pr-6 text-[11px] sm:text-xs font-semibold text-slate-700 shadow-2xs focus:outline-hidden focus:border-indigo-600 cursor-pointer"
                >
                  <option value="TODOS">Todos los tipos</option>
                  <option value="AULA">Aulas Teóricas</option>
                  <option value="LABORATORIO">Laboratorios</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1.5 text-slate-400">
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Lista Arrastrable de Aulas con Capacidad / Bloque / Número de Estudiantes */}
            <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
              {aulasDisponibles.map(aula => {
                const estudiantesMatriculados = planificacionesAsignatura[0]?.numero_estudiantes || 25;
                const tieneCapacidad = aula.capacidad >= estudiantesMatriculados;

                return (
                  <div
                    key={aula.id_aula_laboratorio}
                    draggable
                    onDragStart={e => handleDragStart(e, aula.id_aula_laboratorio, 'available')}
                    onDragEnd={handleDragEnd}
                    className={`p-3 rounded-xl border transition shadow-2xs flex items-center justify-between gap-2.5 cursor-grab active:cursor-grabbing group ${
                      tieneCapacidad
                        ? 'bg-white hover:bg-indigo-50/40 border-slate-200 hover:border-indigo-300'
                        : 'bg-amber-50/40 hover:bg-amber-50/70 border-amber-200 hover:border-amber-400'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <GripVertical className="w-4 h-4 text-slate-300 group-hover:text-slate-600 shrink-0" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-mono font-black bg-slate-100 text-slate-800 px-1.5 py-0.2 rounded border border-slate-200">
                            {aula.codigo}
                          </span>
                          <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800">
                            {aula.tipo}
                          </span>
                          <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-purple-100 text-purple-900 border border-purple-200">
                            {aula.bloque_nombre || 'Bloque Central'}
                          </span>
                          <span className={`text-[9px] font-black px-1.5 py-0.2 rounded ${
                            tieneCapacidad
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}>
                            {rightPanelView === 'aulas_capacidad' 
                              ? `Capacidad: ${aula.capacidad} est.`
                              : `Aforo: ${aula.capacidad} est.`}
                          </span>
                        </div>
                        <h4 className="text-xs font-black text-slate-900 truncate mt-0.5">
                          {aula.nombre}
                        </h4>
                        <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                          <span>{aula.bloque_nombre || 'Bloque Central'}</span>
                          <span>•</span>
                          <span>Piso {aula.piso}</span>
                          {!tieneCapacidad && (
                            <span className="text-amber-700 font-bold ml-1">
                              (Menor a {estudiantesMatriculados} est.)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-1">
                      <button
                        onClick={() => asignarAula(aula.id_aula_laboratorio)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition flex items-center gap-1 cursor-pointer ${
                          tieneCapacidad
                            ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white border border-indigo-200'
                            : 'bg-amber-50 text-amber-800 hover:bg-amber-600 hover:text-white border border-amber-300'
                        }`}
                        title={`Asignar ${aula.codigo} a ${asignaturaActual.nombre}`}
                      >
                        <Plus className="w-3 h-3" />
                        <span>Asignar</span>
                      </button>
                    </div>
                  </div>
                );
              })}

              {aulasDisponibles.length === 0 && (
                <div className="py-12 text-center text-slate-400 text-xs font-semibold">
                  No se encontraron aulas con los filtros seleccionados
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
