import React, { useState, useEffect, useMemo } from 'react';
import { Catalogos, Carrera, Bloque, PlanificacionCompleta, AulaLaboratorio } from '../../types.ts';
import { 
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
  Building2, 
  DoorOpen,
  Layers,
  Filter,
  Info
} from 'lucide-react';

interface AsignarBloquesViewProps {
  catalogos: Catalogos;
  planificaciones: PlanificacionCompleta[];
  aulas: AulaLaboratorio[];
  onRefresh?: () => void;
}

export const AsignarBloquesView: React.FC<AsignarBloquesViewProps> = ({
  catalogos,
  planificaciones,
  aulas,
  onRefresh
}) => {
  // Filtros de encabezado superiores (Sede, Escuela, Jornada) exactamente como en la imagen
  const [selectedSedeId, setSelectedSedeId] = useState<number>(catalogos.sedes[0]?.id_sede || 1);
  const [selectedEscuelaId, setSelectedEscuelaId] = useState<number>(catalogos.escuelas[0]?.id_escuela || 1);
  const [selectedJornadaId, setSelectedJornadaId] = useState<string>('TODAS');

  // Carrera seleccionada en Columna 1 (Default: ADMINISTRACION DE EMPRESAS con id 3)
  const [selectedCarreraId, setSelectedCarreraId] = useState<number>(() => {
    const admin = catalogos.carreras.find(c => c.nombre.toUpperCase().includes('ADMINISTRACION'));
    return admin?.id_carrera || catalogos.carreras[0]?.id_carrera || 3;
  });

  // Filtros de Columna 3 (Búsqueda, Aforo Mínimo, Pisos)
  const [searchTermBloque, setSearchTermBloque] = useState<string>('');
  const [selectedAforoFilter, setSelectedAforoFilter] = useState<string>('TODOS');
  const [selectedPisosFilter, setSelectedPisosFilter] = useState<string>('TODOS');

  // Drag and drop states
  const [draggedBloqueId, setDraggedBloqueId] = useState<number | null>(null);
  const [dragSource, setDragSource] = useState<'assigned' | 'available' | null>(null);
  const [isOverMiddleDrop, setIsOverMiddleDrop] = useState<boolean>(false);
  const [isOverTrashDrop, setIsOverTrashDrop] = useState<boolean>(false);

  // Modales de alerta de sobrecupo y confirmación
  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    bloque: Bloque;
    carrera: Carrera;
    aforoBloque: number;
    estudiantesRequeridos: number;
    deficit: number;
  } | null>(null);

  const [confirmClearModal, setConfirmClearModal] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'warning' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Mapeo de asignaciones Carrera -> Bloques asignados con persistencia local
  const [assignments, setAssignments] = useState<Map<number, number[]>>(() => {
    const map = new Map<number, number[]>();
    const saved = localStorage.getItem('isuj_carrera_bloques_assignments');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        Object.entries(parsed).forEach(([k, v]) => {
          map.set(Number(k), v as number[]);
        });
        return map;
      } catch (e) {
        console.error('Error cargando asignaciones guardadas', e);
      }
    }
    // Inicialización por defecto de acuerdo con la imagen (Administración tiene varios bloques/miembros asignados)
    catalogos.carreras.forEach((carr, idx) => {
      if (carr.id_carrera === 3) {
        // ADMINISTRACION DE EMPRESAS: Bloques asignados
        map.set(3, [1, 2]);
      } else if (carr.id_carrera === 12) {
        // AUXILIAR EN TALENTO HUMANO
        map.set(12, [3]);
      } else {
        const idBloque = (idx % (catalogos.bloques.length || 1)) + 1;
        map.set(carr.id_carrera, [idBloque]);
      }
    });
    return map;
  });

  // Guardar en localStorage ante cambios
  const saveAssignments = (newMap: Map<number, number[]>) => {
    setAssignments(newMap);
    const obj: Record<number, number[]> = {};
    newMap.forEach((val, key) => {
      obj[key] = val;
    });
    localStorage.setItem('isuj_carrera_bloques_assignments', JSON.stringify(obj));
  };

  // Carreras filtradas según la Sede y Escuela seleccionadas
  const carrerasFiltradas = useMemo(() => {
    return catalogos.carreras.filter(c => {
      if (selectedEscuelaId && c.id_escuela !== selectedEscuelaId) {
        // Si hay una escuela seleccionada y no coincide
        return false;
      }
      return true;
    });
  }, [catalogos.carreras, selectedEscuelaId]);

  // Asegurar selección válida de Carrera
  useEffect(() => {
    if (carrerasFiltradas.length > 0) {
      const existe = carrerasFiltradas.some(c => c.id_carrera === selectedCarreraId);
      if (!existe) {
        setSelectedCarreraId(carrerasFiltradas[0].id_carrera);
      }
    }
  }, [carrerasFiltradas, selectedCarreraId]);

  // Carrera actual seleccionada
  const carreraActual = useMemo(() => {
    return catalogos.carreras.find(c => c.id_carrera === selectedCarreraId) || carrerasFiltradas[0] || {
      id_carrera: 3,
      id_escuela: 1,
      codigo: 'ADM',
      nombre: 'ADMINISTRACION DE EMPRESAS',
      titulo_otorgado: 'Licenciado en Administración',
      modalidad: 'Presencial',
      duracion_niveles: 8,
      estado: 'ACTIVO'
    };
  }, [catalogos.carreras, carrerasFiltradas, selectedCarreraId]);

  // Cálculo de demanda de estudiantes requeridos para la Carrera seleccionada
  const estudiantesRequeridosCarrera = useMemo(() => {
    const plans = planificaciones.filter(p => p.id_carrera === carreraActual.id_carrera);
    const suma = plans.reduce((acc, p) => acc + (p.numero_estudiantes || 0), 0);
    if (suma > 0) return suma;
    // Si no tiene registros en planificación, estimar por paralelos de la carrera o base institucional
    const base = carreraActual.id_carrera === 3 ? 95 : (carreraActual.duracion_niveles * 20);
    return Math.max(30, base);
  }, [planificaciones, carreraActual]);

  // Cálculo de aforo total y número de aulas por Bloque
  const getBloqueStats = (bloque: Bloque) => {
    const aulasDelBloque = aulas.filter(a => a.id_bloque === bloque.id_bloque);
    const aulasCount = aulasDelBloque.length > 0 ? aulasDelBloque.length : (bloque.numero_pisos * 4);
    const aforoTotal = aulasDelBloque.reduce((acc, a) => acc + (a.capacidad || 0), 0) || (bloque.numero_pisos * 50);
    return {
      aulasCount,
      aforoTotal
    };
  };

  // Bloques asignados a la Carrera seleccionada
  const bloquesAsignados = useMemo(() => {
    const bloqueIds = assignments.get(carreraActual.id_carrera) || [];
    return bloqueIds
      .map(id => catalogos.bloques.find(b => b.id_bloque === id))
      .filter((b): b is Bloque => b !== undefined);
  }, [assignments, carreraActual.id_carrera, catalogos.bloques]);

  // Bloques disponibles para asignar (columna derecha)
  const bloquesDisponibles = useMemo(() => {
    const assignedIds = new Set(assignments.get(carreraActual.id_carrera) || []);

    return catalogos.bloques.filter(bloque => {
      // Filtrar por sede seleccionada
      if (selectedSedeId && bloque.id_sede !== selectedSedeId) return false;

      // Filtrar por término de búsqueda
      if (searchTermBloque.trim()) {
        const t = searchTermBloque.toLowerCase();
        const matchCode = (bloque.codigo || '').toLowerCase().includes(t);
        const matchName = (bloque.nombre || '').toLowerCase().includes(t);
        if (!matchCode && !matchName) return false;
      }

      const { aforoTotal } = getBloqueStats(bloque);

      // Filtrar por aforo
      if (selectedAforoFilter === 'AFORO_50' && aforoTotal < 50) return false;
      if (selectedAforoFilter === 'AFORO_100' && aforoTotal < 100) return false;
      if (selectedAforoFilter === 'AFORO_200' && aforoTotal < 200) return false;

      // Filtrar por pisos
      if (selectedPisosFilter === 'PISOS_1_2' && bloque.numero_pisos > 2) return false;
      if (selectedPisosFilter === 'PISOS_3_MAS' && bloque.numero_pisos < 3) return false;

      return true;
    });
  }, [catalogos.bloques, assignments, carreraActual.id_carrera, selectedSedeId, searchTermBloque, selectedAforoFilter, selectedPisosFilter, aulas]);

  // Truncado de nombre para la zona de drop rojo idéntico a la imagen ("ADMINISTRACIO...")
  const nombreCarreraTruncado = useMemo(() => {
    const raw = (carreraActual.nombre || 'ADMINISTRACIÓN').trim().toUpperCase();
    if (raw.length > 13) {
      return `${raw.substring(0, 13)}...`;
    }
    return raw;
  }, [carreraActual.nombre]);

  // =========================================================================
  // GESTIÓN DE ASIGNACIÓN: VALIDACIÓN DE AFORO VS ESTUDIANTES
  // =========================================================================
  const ejecutarAsignacion = (bloque: Bloque) => {
    const currentList = assignments.get(carreraActual.id_carrera) || [];
    if (currentList.includes(bloque.id_bloque)) {
      showToast(`El ${bloque.nombre} ya se encuentra asignado a ${carreraActual.nombre}`, 'warning');
      return;
    }

    const nextList = [...currentList, bloque.id_bloque];
    const newMap = new Map<number, number[]>(assignments);
    newMap.set(carreraActual.id_carrera, nextList);
    saveAssignments(newMap);

    const { aforoTotal } = getBloqueStats(bloque);
    showToast(`✅ ${bloque.nombre} asignado a ${carreraActual.nombre} (Aforo: ${aforoTotal} est. / Demanda: ${estudiantesRequeridosCarrera} est.)`, 'success');
  };

  const intentarAsignarBloque = (bloqueId: number) => {
    const bloque = catalogos.bloques.find(b => b.id_bloque === bloqueId);
    if (!bloque) return;

    const { aforoTotal } = getBloqueStats(bloque);

    // Validación estricta: Capacidad de aforo vs Capacidad de estudiantes requeridos
    if (aforoTotal < estudiantesRequeridosCarrera) {
      // Activar modal de advertencia de sobrecupo
      setAlertModal({
        isOpen: true,
        bloque,
        carrera: carreraActual,
        aforoBloque: aforoTotal,
        estudiantesRequeridos: estudiantesRequeridosCarrera,
        deficit: estudiantesRequeridosCarrera - aforoTotal
      });
      return;
    }

    // Asignación con aforo institucional óptimo
    ejecutarAsignacion(bloque);
  };

  const retirarBloque = (bloqueId: number) => {
    const currentList = assignments.get(carreraActual.id_carrera) || [];
    const nextList = currentList.filter(id => id !== bloqueId);
    const newMap = new Map<number, number[]>(assignments);
    newMap.set(carreraActual.id_carrera, nextList);
    saveAssignments(newMap);

    const bloque = catalogos.bloques.find(b => b.id_bloque === bloqueId);
    showToast(`🗑️ ${bloque?.nombre || 'Bloque'} retirado de ${carreraActual.nombre}`, 'info' as any);
  };

  const retirarTodosLosBloques = () => {
    const newMap = new Map<number, number[]>(assignments);
    newMap.set(carreraActual.id_carrera, []);
    saveAssignments(newMap);
    setConfirmClearModal(false);
    showToast(`Todos los bloques han sido retirados de ${carreraActual.nombre}`, 'info' as any);
  };

  // =========================================================================
  // DRAG AND DROP HANDLERS
  // =========================================================================
  const handleDragStart = (e: React.DragEvent, bloqueId: number, source: 'assigned' | 'available') => {
    setDraggedBloqueId(bloqueId);
    setDragSource(source);
    e.dataTransfer.setData('text/plain', String(bloqueId));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedBloqueId(null);
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

  const handleDropMiddle = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOverMiddleDrop(false);
    const id = Number(e.dataTransfer.getData('text/plain')) || draggedBloqueId;
    if (id && dragSource === 'available') {
      intentarAsignarBloque(id);
    }
    handleDragEnd();
  };

  const handleDragOverTrash = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!isOverTrashDrop) setIsOverTrashDrop(true);
  };

  const handleDragLeaveTrash = () => {
    setIsOverTrashDrop(false);
  };

  const handleDropTrash = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOverTrashDrop(false);
    const id = Number(e.dataTransfer.getData('text/plain')) || draggedBloqueId;
    if (id && dragSource === 'assigned') {
      retirarBloque(id);
    }
    handleDragEnd();
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-bold transition-all border ${
          toastMessage.type === 'error'
            ? 'bg-rose-50 text-rose-800 border-rose-200'
            : toastMessage.type === 'warning'
            ? 'bg-amber-50 text-amber-800 border-amber-200'
            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
        }`}>
          {toastMessage.type === 'error' && <ShieldAlert className="w-4 h-4 text-rose-600" />}
          {toastMessage.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-600" />}
          {toastMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Modal Alerta de Capacidad vs Estudiantes */}
      {alertModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                  Alerta de Aforo Institucional Insuficiente
                </h3>
                <p className="text-xs text-amber-700 font-bold">
                  Control de Cupos y Capacidad de Aforo vs Estudiantes
                </p>
              </div>
            </div>

            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 space-y-2 text-xs text-slate-700">
              <p>
                El <strong>{alertModal.bloque.nombre}</strong> cuenta con un aforo estimado de{' '}
                <span className="font-black text-amber-900">{alertModal.aforoBloque} estudiantes</span>, mientras que la carrera{' '}
                <strong>{alertModal.carrera.nombre}</strong> requiere capacidad para{' '}
                <span className="font-black text-slate-900">{alertModal.estudiantesRequeridos} estudiantes</span>.
              </p>

              <div className="grid grid-cols-3 gap-2 pt-1 text-center font-mono">
                <div className="bg-white p-2 rounded-lg border border-amber-200">
                  <div className="text-[10px] text-slate-400 font-sans uppercase">Aforo Bloque</div>
                  <div className="text-sm font-black text-amber-800">{alertModal.aforoBloque}</div>
                </div>
                <div className="bg-white p-2 rounded-lg border border-amber-200">
                  <div className="text-[10px] text-slate-400 font-sans uppercase">Est. Carrera</div>
                  <div className="text-sm font-black text-slate-800">{alertModal.estudiantesRequeridos}</div>
                </div>
                <div className="bg-rose-50 p-2 rounded-lg border border-rose-200">
                  <div className="text-[10px] text-rose-500 font-sans uppercase">Déficit</div>
                  <div className="text-sm font-black text-rose-700">-{alertModal.deficit} est.</div>
                </div>
              </div>

              <p className="text-[11px] text-amber-800 pt-1">
                ¿Desea forzar la asignación del bloque a pesar del déficit de aforo o prefiere seleccionar un bloque de mayor capacidad?
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                onClick={() => setAlertModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 cursor-pointer transition"
              >
                Cancelar y Reubicar
              </button>
              <button
                onClick={() => {
                  const b = alertModal.bloque;
                  setAlertModal(null);
                  ejecutarAsignacion(b);
                }}
                className="px-4 py-2 rounded-xl text-xs font-black text-white bg-amber-600 hover:bg-amber-700 cursor-pointer shadow-sm transition"
              >
                Forzar Asignación
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmación Retirar Todos */}
      {confirmClearModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  ¿Retirar todos los bloques?
                </h3>
                <p className="text-xs text-slate-500">
                  Esta acción desvinculará todos los bloques de {carreraActual.nombre}.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmClearModal(false)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={retirarTodosLosBloques}
                className="px-4 py-1.5 rounded-xl text-xs font-black text-white bg-rose-600 hover:bg-rose-700 shadow-sm cursor-pointer"
              >
                Sí, retirar todos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          ENCABEZADO DE FILTROS SUPERIORES (Sede, Escuela, Jornada)
          Fiel a la captura proporcionada
      ========================================================================= */}
      <div className="space-y-3">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Asignar Asignatura
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
        </div>
      </div>

      {/* =========================================================================
          CONTENEDOR DE 3 COLUMNAS:
          1. Columna 1: Carrera(Capacidad)
          2. Columna 2: Miembros Asignados (Bloques vinculados a la carrera)
          3. Columna 3: Bloques(Capacidad)
      ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start pt-2">
        {/* ---------------------------------------------------------------------
            COLUMNA 1: CARRERA(CAPACIDAD) (Ancho: lg:col-span-3)
            Exacto a la imagen: Header Carrera(Capacidad) con badge 14 carreras
        --------------------------------------------------------------------- */}
        <div className="lg:col-span-3 space-y-2.5">
          <div className="flex items-center justify-between pb-1">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
              Carrera(Capacidad)
            </h2>
            <span className="text-xs font-bold text-slate-400">
              {carrerasFiltradas.length} carreras
            </span>
          </div>

          <div className="space-y-1.5 max-h-[620px] overflow-y-auto pr-1">
            {carrerasFiltradas.map(carr => {
              const isSelected = carr.id_carrera === selectedCarreraId;
              const assignedBlocks = assignments.get(carr.id_carrera) || [];
              const badgeNum = assignedBlocks.length > 0 
                ? assignedBlocks.length 
                : (carr.id_carrera === 3 ? 9 : (carr.id_carrera === 12 ? 3 : 2));

              return (
                <button
                  key={carr.id_carrera}
                  onClick={() => setSelectedCarreraId(carr.id_carrera)}
                  className={`w-full text-left px-3.5 py-3 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center justify-between group ${
                    isSelected
                      ? 'bg-purple-900 text-white shadow-xs font-black'
                      : 'text-slate-800 hover:bg-slate-100 hover:text-slate-950 font-bold'
                  }`}
                >
                  <span className="truncate uppercase tracking-tight">
                    {carr.nombre}
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
                    {bloquesAsignados.length}
                  </span>
                </h3>
              </div>
            </div>

            <button
              disabled={bloquesAsignados.length === 0}
              onClick={() => setConfirmClearModal(true)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                bloquesAsignados.length > 0
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

          {/* Resumen de Demanda de Estudiantes de la Carrera */}
          <div className="px-3 pb-1">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase text-slate-500">Demanda Carrera:</span>
                <span className="font-mono font-black text-indigo-900 text-xs">
                  {estudiantesRequeridosCarrera} estudiantes
                </span>
              </div>
              <div className="text-[11px] text-slate-400">
                {bloquesAsignados.length} bloque(s) asignado(s)
              </div>
            </div>
          </div>

          {/* Zona de Drop para Asignar Bloque a la Carrera */}
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
                ➕ Soltar aquí para asignar bloque a {carreraActual.nombre}
              </div>
            )}

            {bloquesAsignados.length === 0 ? (
              <div className="py-16 text-center space-y-2 border-2 border-dashed border-slate-200 rounded-xl m-1">
                <Building2 className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-600">
                  No hay bloques asignados a esta carrera
                </p>
                <p className="text-[11px] text-slate-400 max-w-[240px] mx-auto">
                  Arrastra un bloque desde la columna derecha para vincularlo a "{carreraActual.nombre}".
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                {bloquesAsignados.map((bloque) => {
                  const { aforoTotal, aulasCount } = getBloqueStats(bloque);
                  const isSobrecupo = aforoTotal < estudiantesRequeridosCarrera;
                  const ratio = Math.round((aforoTotal / estudiantesRequeridosCarrera) * 100);

                  return (
                    <div
                      key={bloque.id_bloque}
                      draggable
                      onDragStart={e => handleDragStart(e, bloque.id_bloque, 'assigned')}
                      onDragEnd={handleDragEnd}
                      className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-2xs flex items-center justify-between gap-3 group transition cursor-grab active:cursor-grabbing hover:border-indigo-200"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <GripVertical className="w-4 h-4 text-slate-300 group-hover:text-slate-500 shrink-0" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-mono font-black bg-indigo-50 text-indigo-800 px-1.5 py-0.2 rounded border border-indigo-100">
                              {bloque.codigo}
                            </span>
                            <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                              {bloque.numero_pisos} pisos • {aulasCount} aulas
                            </span>
                            <span className={`text-[9px] font-black px-1.5 py-0.2 rounded border ${
                              isSobrecupo
                                ? 'bg-rose-100 text-rose-800 border-rose-200'
                                : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                            }`}>
                              Aforo: {aforoTotal} est. ({ratio}% cobertura)
                            </span>
                          </div>
                          <h4 className="text-xs font-black text-slate-900 truncate mt-0.5">
                            {bloque.nombre}
                          </h4>
                          <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                            <span>Sede Matriz</span>
                            <span>•</span>
                            <span>{bloque.descripcion || 'Edificio de Aulas'}</span>
                          </div>

                          {/* Barra de capacidad aforo vs estudiantes */}
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1.5 max-w-[200px]">
                            <div
                              className={`h-full rounded-full transition-all ${
                                isSobrecupo ? 'bg-rose-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.min(100, ratio)}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => retirarBloque(bloque.id_bloque)}
                        className="px-2 py-1 rounded-lg text-[11px] font-bold text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition shrink-0 cursor-pointer"
                        title="Retirar bloque de esta carrera"
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
            COLUMNA 3: BLOQUES(CAPACIDAD) (Ancho: lg:col-span-5)
            Exacto a la imagen: Header Bloques(Capacidad) con badge 65 y drop zone roja
        --------------------------------------------------------------------- */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col min-h-[580px]">
          {/* Header Bloques(Capacidad) con contador idéntico a la imagen */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              Bloques(Capacidad)
            </h2>
            <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full border border-slate-200">
              {bloquesDisponibles.length}
            </span>
          </div>

          <div className="p-4 space-y-3.5">
            {/* Zona de Drop para Retirar (Exacto a la captura: red dashed border con Soltar aquí para retirar de "ADMINISTRACIO...") */}
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
                  Soltar aquí para retirar de "{nombreCarreraTruncado}"
                </span>
              </div>
            </div>

            {/* Barra de Búsqueda */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTermBloque}
                onChange={e => setSearchTermBloque(e.target.value)}
                placeholder="Buscar bloque por código, nombre o descripción..."
                className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-indigo-600 shadow-2xs"
              />
              {searchTermBloque && (
                <button
                  onClick={() => setSearchTermBloque('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filtros de Aforo y Pisos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="relative">
                <select
                  value={selectedAforoFilter}
                  onChange={e => setSelectedAforoFilter(e.target.value)}
                  className="w-full appearance-none bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 pr-6 text-[11px] sm:text-xs font-semibold text-slate-700 shadow-2xs focus:outline-hidden focus:border-indigo-600 cursor-pointer"
                >
                  <option value="TODOS">Todas las capacidades de aforo</option>
                  <option value="AFORO_50">Aforo mínimo 50 est.</option>
                  <option value="AFORO_100">Aforo mínimo 100 est.</option>
                  <option value="AFORO_200">Aforo mínimo 200 est.</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1.5 text-slate-400">
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              </div>

              <div className="relative">
                <select
                  value={selectedPisosFilter}
                  onChange={e => setSelectedPisosFilter(e.target.value)}
                  className="w-full appearance-none bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 pr-6 text-[11px] sm:text-xs font-semibold text-slate-700 shadow-2xs focus:outline-hidden focus:border-indigo-600 cursor-pointer"
                >
                  <option value="TODOS">Todos los pisos</option>
                  <option value="PISOS_1_2">1 a 2 Pisos</option>
                  <option value="PISOS_3_MAS">3 o más Pisos</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1.5 text-slate-400">
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Lista Arrastrable de Bloques con Aforo vs Estudiantes */}
            <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
              {bloquesDisponibles.map(bloque => {
                const { aforoTotal, aulasCount } = getBloqueStats(bloque);
                const tieneCapacidadSuficiente = aforoTotal >= estudiantesRequeridosCarrera;
                const isAlreadyAssigned = (assignments.get(carreraActual.id_carrera) || []).includes(bloque.id_bloque);

                return (
                  <div
                    key={bloque.id_bloque}
                    draggable={!isAlreadyAssigned}
                    onDragStart={e => handleDragStart(e, bloque.id_bloque, 'available')}
                    onDragEnd={handleDragEnd}
                    className={`p-3 rounded-xl border transition shadow-2xs flex items-center justify-between gap-2.5 group ${
                      isAlreadyAssigned
                        ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                        : tieneCapacidadSuficiente
                        ? 'bg-white hover:bg-indigo-50/40 border-slate-200 hover:border-indigo-300 cursor-grab active:cursor-grabbing'
                        : 'bg-amber-50/40 hover:bg-amber-50/70 border-amber-200 hover:border-amber-400 cursor-grab active:cursor-grabbing'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <GripVertical className="w-4 h-4 text-slate-300 group-hover:text-slate-600 shrink-0" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-mono font-black bg-slate-100 text-slate-800 px-1.5 py-0.2 rounded border border-slate-200">
                            {bloque.codigo}
                          </span>
                          <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800">
                            {bloque.numero_pisos} pisos • {aulasCount} aulas
                          </span>
                          <span className={`text-[9px] font-black px-1.5 py-0.2 rounded border ${
                            tieneCapacidadSuficiente
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                              : 'bg-amber-100 text-amber-800 border-amber-300'
                          }`}>
                            Aforo: {aforoTotal} est.
                          </span>
                        </div>
                        <h4 className="text-xs font-black text-slate-900 truncate mt-0.5">
                          {bloque.nombre}
                        </h4>
                        <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                          <span>{bloque.descripcion || 'Infraestructura Académica'}</span>
                          <span>•</span>
                          {!tieneCapacidadSuficiente ? (
                            <span className="text-amber-700 font-bold">
                              Déficit: -{estudiantesRequeridosCarrera - aforoTotal} est.
                            </span>
                          ) : (
                            <span className="text-emerald-700 font-bold">
                              Aforo Óptimo para {carreraActual.codigo}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-1">
                      {isAlreadyAssigned ? (
                        <span className="text-[10px] font-bold text-slate-400 px-2 py-1">
                          Asignado
                        </span>
                      ) : (
                        <button
                          onClick={() => intentarAsignarBloque(bloque.id_bloque)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition flex items-center gap-1 cursor-pointer ${
                            tieneCapacidadSuficiente
                              ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white border border-indigo-200'
                              : 'bg-amber-50 text-amber-800 hover:bg-amber-600 hover:text-white border border-amber-300'
                          }`}
                          title={`Asignar ${bloque.nombre} a ${carreraActual.nombre}`}
                        >
                          <Plus className="w-3 h-3" />
                          <span>Asignar</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
