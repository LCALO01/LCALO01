import React, { useState, useEffect, useMemo } from 'react';
import { Catalogos, Asignatura, Carrera } from '../../types.ts';
import { ApiClient } from '../../controllers/apiClient.ts';
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
  BookOpen, 
  Building2,
  GraduationCap
} from 'lucide-react';

// Mapeo oficial de prefijos de códigos de asignaturas a su carrera correspondiente
export const CODIGO_CARRERA_MAP: Record<string, { id_carrera: number; nombre_carrera: string }> = {
  'DESF': { id_carrera: 1, nombre_carrera: 'DESARROLLO DE SOFTWARE' },
  'DES': { id_carrera: 1, nombre_carrera: 'DESARROLLO DE SOFTWARE' },
  'DSW': { id_carrera: 1, nombre_carrera: 'DESARROLLO DE SOFTWARE' },
  'SOF': { id_carrera: 1, nombre_carrera: 'DESARROLLO DE SOFTWARE' },
  'EIN': { id_carrera: 2, nombre_carrera: 'EDUCACIÓN INICIAL' },
  'EDU': { id_carrera: 2, nombre_carrera: 'EDUCACIÓN INICIAL' },
  'ELE': { id_carrera: 3, nombre_carrera: 'ELECTRICIDAD' },
  'ELC': { id_carrera: 3, nombre_carrera: 'ELECTRICIDAD' },
  'DEP': { id_carrera: 4, nombre_carrera: 'ENTRENAMIENTO DEPORTIVO' },
  'EDP': { id_carrera: 4, nombre_carrera: 'ENTRENAMIENTO DEPORTIVO' },
  'ODO': { id_carrera: 5, nombre_carrera: 'ODONTOLOGÍA' },
  'GAS': { id_carrera: 6, nombre_carrera: 'GASTRONOMÍA' },
  'GASU': { id_carrera: 7, nombre_carrera: 'GASTRONOMÍA UNIVERSITARIA' },
  'ENF': { id_carrera: 8, nombre_carrera: 'ENFERMERÍA' },
  'MEC': { id_carrera: 9, nombre_carrera: 'MECÁNICA AUTOMOTRIZ' },
  'AUT': { id_carrera: 9, nombre_carrera: 'MECÁNICA AUTOMOTRIZ' },
  'REFI': { id_carrera: 10, nombre_carrera: 'REHABILITACIÓN FÍSICA' },
  'REF': { id_carrera: 10, nombre_carrera: 'REHABILITACIÓN FÍSICA' },
  'CT': { id_carrera: 11, nombre_carrera: 'CONTABILIDAD Y TRIBUTACIÓN' },
  'CONT': { id_carrera: 12, nombre_carrera: 'TECNOLOGÍA SUPERIOR EN CONTABILIDAD' },
  'GTH': { id_carrera: 13, nombre_carrera: 'GESTIÓN DE TALENTO HUMANO' },
  'ATH': { id_carrera: 13, nombre_carrera: 'GESTIÓN DE TALENTO HUMANO' },
  'ADM': { id_carrera: 14, nombre_carrera: 'TECNOLOGÍA SUPERIOR EN ADMINISTRACIÓN' },
  'GP': { id_carrera: 14, nombre_carrera: 'TECNOLOGÍA SUPERIOR EN ADMINISTRACIÓN' },
  'MARK': { id_carrera: 15, nombre_carrera: 'TECNOLOGÍA SUPERIOR EN MARKETING' },
  'MKT': { id_carrera: 15, nombre_carrera: 'TECNOLOGÍA SUPERIOR EN MARKETING' },
  'EST': { id_carrera: 16, nombre_carrera: 'ESTÉTICA INTEGRAL' },
  'ESTU': { id_carrera: 17, nombre_carrera: 'ESTÉTICA INTEGRAL UNIVERSITARIA' }
};

export function getCarreraOfAsignatura(codigoAsignatura: string): { id_carrera: number; nombre_carrera: string } | null {
  const code = (codigoAsignatura || '').toUpperCase().trim();
  const prefix = code.split('_')[0] || '';
  if (CODIGO_CARRERA_MAP[prefix]) {
    return CODIGO_CARRERA_MAP[prefix];
  }
  for (const [key, val] of Object.entries(CODIGO_CARRERA_MAP)) {
    if (code.startsWith(key)) {
      return val;
    }
  }
  return null;
}

// Extractor del nivel académico a partir del código de la asignatura (ej. ADM_P304 -> Nivel 3)
export function getNivelOfAsignatura(codigoAsignatura: string): string {
  const code = (codigoAsignatura || '').toUpperCase().trim();
  const match = code.match(/([1-5])\d{2}/);
  if (match && match[1]) {
    return `Nivel ${match[1]}`;
  }
  return 'Nivel 1';
}

// Reproductor de alerta sonora de violación curricular
function playCurricularAlertSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.35);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch {
    // Ignorar si el navegador bloquea audio sin interacción previa
  }
}

interface AsignarAsignaturasViewProps {
  catalogos: Catalogos;
  onRefresh?: () => void;
}

export const AsignarAsignaturasView: React.FC<AsignarAsignaturasViewProps> = ({
  catalogos,
  onRefresh
}) => {
  // Filtros de encabezado
  const [selectedSedeId, setSelectedSedeId] = useState<number>(catalogos.sedes[0]?.id_sede || 1);
  const [selectedEscuelaId, setSelectedEscuelaId] = useState<number>(catalogos.escuelas[0]?.id_escuela || 1);
  const [selectedJornadaId, setSelectedJornadaId] = useState<string>('TODAS');

  // Carrera seleccionada (por defecto ADMINISTRACION DE EMPRESAS, id 3)
  const [selectedCarreraId, setSelectedCarreraId] = useState<number>(3);

  // Asignaciones en estado local sincronizadas con backend (carreraId -> [asignaturaId])
  const [assignments, setAssignments] = useState<Map<number, number[]>>(new Map());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Estados de arrastre Drag & Drop
  const [draggedAsignaturaId, setDraggedAsignaturaId] = useState<number | null>(null);
  const [dragSource, setDragSource] = useState<'assigned' | 'available' | null>(null);
  const [isOverMiddleDrop, setIsOverMiddleDrop] = useState<boolean>(false);
  const [isOverTrashDrop, setIsOverTrashDrop] = useState<boolean>(false);

  // Filtros de la columna derecha (Asignaturas disponibles)
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('TODOS');
  const [soloSinGrupo, setSoloSinGrupo] = useState<boolean>(true);

  // Modales de alerta institucional y confirmación
  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    asignaturaNombre: string;
    asignaturaCodigo: string;
    carreraCorrectaNombre: string;
    carreraDestinoNombre: string;
  } | null>(null);

  const [confirmClearModal, setConfirmClearModal] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Cargar asignaciones iniciales desde el servidor
  const loadAssignments = async () => {
    try {
      setIsLoading(true);
      const data = await ApiClient.getCarreraAsignaturas();
      const map = new Map<number, number[]>();

      // Inicializar todas las carreras con array vacío
      catalogos.carreras.forEach(c => map.set(c.id_carrera, []));

      // Llenar con lo que venga de BD
      if (Array.isArray(data) && data.length > 0) {
        data.forEach((item: any) => {
          const list = map.get(item.id_carrera) || [];
          if (!list.includes(item.id_asignatura)) {
            list.push(item.id_asignatura);
            map.set(item.id_carrera, list);
          }
        });
      } else {
        // Sembrado por defecto automático basado en prefijos oficiales de las asignaturas
        catalogos.asignaturas.forEach(a => {
          const carr = getCarreraOfAsignatura(a.codigo_asignatura);
          if (carr) {
            const list = map.get(carr.id_carrera) || [];
            if (!list.includes(a.id_asignatura)) {
              list.push(a.id_asignatura);
              map.set(carr.id_carrera, list);
            }
          }
        });
      }

      setAssignments(map);
    } catch (err) {
      console.warn('Cargando asignaciones locales por defecto:', err);
      const fallbackMap = new Map<number, number[]>();
      catalogos.carreras.forEach(c => fallbackMap.set(c.id_carrera, []));
      catalogos.asignaturas.forEach(a => {
        const carr = getCarreraOfAsignatura(a.codigo_asignatura);
        if (carr) {
          const list = fallbackMap.get(carr.id_carrera) || [];
          if (!list.includes(a.id_asignatura)) {
            list.push(a.id_asignatura);
            fallbackMap.set(carr.id_carrera, list);
          }
        }
      });
      setAssignments(fallbackMap);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAssignments();
  }, [catalogos.carreras, catalogos.asignaturas]);

  // Carrera actual seleccionada
  const carreraActual = useMemo(() => {
    return catalogos.carreras.find(c => c.id_carrera === selectedCarreraId) || catalogos.carreras[0] || {
      id_carrera: 3,
      nombre: 'ADMINISTRACION DE EMPRESAS',
      codigo: 'CAR-03'
    };
  }, [catalogos.carreras, selectedCarreraId]);

  // IDs de asignaturas asignadas a la carrera actual
  const asignadasIds = useMemo(() => {
    return assignments.get(carreraActual.id_carrera) || [];
  }, [assignments, carreraActual.id_carrera]);

  // 1. REQUERIMIENTO ESTRICTO: En "Miembros Asignados", SOLO asignaturas ASIGNADAS de ESA carrera
  const asignadasList = useMemo(() => {
    return catalogos.asignaturas.filter(a => {
      if (!asignadasIds.includes(a.id_asignatura)) return false;
      const carr = getCarreraOfAsignatura(a.codigo_asignatura);
      return carr?.id_carrera === carreraActual.id_carrera;
    }).sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [catalogos.asignaturas, asignadasIds, carreraActual.id_carrera]);

  // 2. REQUERIMIENTO ESTRICTO: En "Asignaturas", SOLO las asignaturas DISPONIBLES que TODAVÍA NO SON ASIGNADAS
  // y que pertenezcan ÚNICAMENTE a esa carrera (no visualizar asignaturas ajenas)
  const availableList = useMemo(() => {
    return catalogos.asignaturas.filter(a => {
      // Pertenencia curricular estricta a la carrera actual
      const carr = getCarreraOfAsignatura(a.codigo_asignatura);
      if (!carr || carr.id_carrera !== carreraActual.id_carrera) {
        return false;
      }

      // Solo disponibles (que aún no han sido asignadas a esta carrera)
      if (asignadasIds.includes(a.id_asignatura)) {
        return false;
      }

      // Filtro de búsqueda por texto (nombre, código o nivel)
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesName = a.nombre.toLowerCase().includes(term);
        const matchesCode = a.codigo_asignatura.toLowerCase().includes(term);
        const matchesLevel = getNivelOfAsignatura(a.codigo_asignatura).toLowerCase().includes(term);
        if (!matchesName && !matchesCode && !matchesLevel) return false;
      }

      // Filtro por nivel académico / rol
      if (selectedRoleFilter !== 'TODOS') {
        const nivel = getNivelOfAsignatura(a.codigo_asignatura);
        if (selectedRoleFilter === 'NIVEL_1' && nivel !== 'Nivel 1') return false;
        if (selectedRoleFilter === 'NIVEL_2' && nivel !== 'Nivel 2') return false;
        if (selectedRoleFilter === 'NIVEL_3' && nivel !== 'Nivel 3') return false;
        if (selectedRoleFilter === 'NIVEL_4' && nivel !== 'Nivel 4') return false;
        if (selectedRoleFilter === 'NIVEL_5' && nivel !== 'Nivel 5') return false;
      }

      return true;
    }).sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [catalogos.asignaturas, asignadasIds, carreraActual.id_carrera, searchTerm, selectedRoleFilter]);

  // Intentar asignar una asignatura a la carrera actual
  const intentarAsignar = async (asignaturaId: number) => {
    const asignatura = catalogos.asignaturas.find(a => a.id_asignatura === asignaturaId);
    if (!asignatura) return false;

    // Obtener la carrera oficial a la que pertenece esta asignatura
    const carreraOficial = getCarreraOfAsignatura(asignatura.codigo_asignatura);

    // Si no pertenece a la carrera actual -> BLOQUEAR COMPLETAMENTE Y MOSTRAR ALERTA
    if (carreraOficial && carreraOficial.id_carrera !== carreraActual.id_carrera) {
      playCurricularAlertSound();
      setAlertModal({
        isOpen: true,
        asignaturaNombre: asignatura.nombre,
        asignaturaCodigo: asignatura.codigo_asignatura,
        carreraCorrectaNombre: carreraOficial.nombre_carrera,
        carreraDestinoNombre: carreraActual.nombre
      });
      showToast(`¡Acceso denegado! [${asignatura.codigo_asignatura}] no pertenece a ${carreraActual.nombre}`, 'error');
      return false;
    }

    // Verificar si ya está asignada
    if (asignadasIds.includes(asignaturaId)) {
      showToast(`La asignatura [${asignatura.codigo_asignatura}] ya se encuentra asignada a esta carrera`, 'info');
      return true;
    }

    // Si es válida y pertenece a la carrera -> Asignar
    try {
      await ApiClient.assignAsignaturaToCarrera(carreraActual.id_carrera, asignaturaId);
    } catch (err: any) {
      if (err.errorCode === 'CURRICULAR_MISMATCH') {
        playCurricularAlertSound();
        setAlertModal({
          isOpen: true,
          asignaturaNombre: asignatura.nombre,
          asignaturaCodigo: asignatura.codigo_asignatura,
          carreraCorrectaNombre: err.details?.carrera_correcta?.nombre_carrera || 'Otra carrera',
          carreraDestinoNombre: carreraActual.nombre
        });
        return false;
      }
    }

    // Actualizar estado local
    setAssignments(prev => {
      const next = new Map<number, number[]>(prev);
      const currentList: number[] = [...(next.get(carreraActual.id_carrera) || [])];
      if (!currentList.includes(asignaturaId)) {
        currentList.push(asignaturaId);
        next.set(carreraActual.id_carrera, currentList);
      }
      return next;
    });

    showToast(`Asignatura [${asignatura.codigo_asignatura}] asignada a ${carreraActual.nombre}`, 'success');
    return true;
  };

  // Retirar asignatura de la carrera actual (pasa a estar disponible)
  const retirarAsignatura = async (asignaturaId: number) => {
    const asignatura = catalogos.asignaturas.find(a => a.id_asignatura === asignaturaId);
    try {
      await ApiClient.unassignAsignaturaFromCarrera(carreraActual.id_carrera, asignaturaId);
    } catch (err) {
      console.warn('Retiro local ejecutado:', err);
    }

    setAssignments(prev => {
      const next = new Map<number, number[]>(prev);
      const currentList: number[] = (next.get(carreraActual.id_carrera) || []).filter(id => id !== asignaturaId);
      next.set(carreraActual.id_carrera, currentList);
      return next;
    });

    showToast(`Asignatura [${asignatura?.codigo_asignatura || ''}] retirada y puesta disponible`, 'info');
  };

  // Retirar todas las asignaturas de la carrera actual
  const confirmarRetirarTodas = async () => {
    try {
      await ApiClient.unassignAllAsignaturasFromCarrera(carreraActual.id_carrera);
    } catch (err) {
      console.warn('Retiro masivo local ejecutado:', err);
    }

    setAssignments(prev => {
      const next = new Map<number, number[]>(prev);
      next.set(carreraActual.id_carrera, []);
      return next;
    });

    setConfirmClearModal(false);
    showToast(`Todas las asignaturas de ${carreraActual.nombre} han sido retiradas y están disponibles`, 'info');
  };

  // Drag & Drop HTML5
  const handleDragStart = (e: React.DragEvent, id: number, source: 'assigned' | 'available') => {
    setDraggedAsignaturaId(id);
    setDragSource(source);
    e.dataTransfer.setData('text/plain', JSON.stringify({ id, source }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedAsignaturaId(null);
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
    if (!draggedAsignaturaId) return;

    if (dragSource === 'available') {
      await intentarAsignar(draggedAsignaturaId);
    }
    setDraggedAsignaturaId(null);
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
    if (!draggedAsignaturaId) return;

    if (dragSource === 'assigned') {
      await retirarAsignatura(draggedAsignaturaId);
    }
    setDraggedAsignaturaId(null);
    setDragSource(null);
  };

  return (
    <div className="space-y-4 pb-12 animate-in fade-in duration-200">
      {/* Toast Flotante */}
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

      {/* Modal de Bloqueo de Violación Curricular */}
      {alertModal?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full border-4 border-rose-500 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 p-5 text-white flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0 border border-white/30 shadow-inner">
                <ShieldAlert className="w-7 h-7 text-white animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest bg-rose-900/50 px-2 py-0.5 rounded-full border border-white/20">
                  RESTRICCIÓN CURRICULAR CRÍTICA
                </span>
                <h3 className="text-xl font-black tracking-tight leading-tight mt-0.5">
                  ¡ASIGNATURA NO CORRESPONDE A LA CARRERA!
                </h3>
              </div>
            </div>

            <div className="p-6 space-y-4 text-slate-800">
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 space-y-2">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <p className="text-sm leading-relaxed font-semibold">
                    Se ha impedido el movimiento. La asignatura seleccionada no pertenece a la malla académica de la carrera destino.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2.5 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 font-bold uppercase tracking-wider block text-[10px]">
                    Asignatura que intentó mover:
                  </span>
                  <span className="text-sm font-black text-slate-900">
                    [{alertModal.asignaturaCodigo}] {alertModal.asignaturaNombre}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200">
                    <span className="text-rose-600 font-bold uppercase tracking-wider block text-[10px]">
                      Carrera Destino (Inválida):
                    </span>
                    <span className="font-extrabold text-rose-900 line-through">
                      {alertModal.carreraDestinoNombre}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300">
                    <span className="text-emerald-700 font-bold uppercase tracking-wider block text-[10px]">
                      Carrera Oficial Permitida:
                    </span>
                    <span className="font-black text-emerald-900">
                      ✓ {alertModal.carreraCorrectaNombre}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex items-center gap-2">
                <span className="text-base font-bold">⚠️</span>
                <span>
                  <strong>Control estricto de integridad:</strong> Por nada del mundo el sistema permitirá vincular asignaturas ajenas a la carrera seleccionada.
                </span>
              </div>
            </div>

            <div className="bg-slate-100 px-6 py-4 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setAlertModal(null)}
                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-black text-sm rounded-xl shadow-md transition cursor-pointer flex items-center gap-2"
              >
                <span>Entendido y Cerrar Alerta</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación para Retirar Todas */}
      {confirmClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <h3 className="text-lg font-black text-slate-900">
                ¿Retirar todas las asignaturas?
              </h3>
            </div>
            <p className="text-sm text-slate-600">
              ¿Está seguro de retirar todas las asignaturas asignadas a la carrera{' '}
              <strong className="text-slate-900 font-black">"{carreraActual.nombre}"</strong>?
              Pasarán a estar disponibles para asignación.
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

      {/* ENCABEZADO PRINCIPAL (Filtros de Sede, Escuela y Jornada como en la imagen) */}
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

      {/* CONTENEDOR PRINCIPAL DE 3 COLUMNAS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start pt-2">
        {/* COLUMNA 1: CARRERA (Lista de 14 Carreras) */}
        <div className="lg:col-span-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
              Carrera
            </h2>
            <span className="text-[11px] font-bold text-slate-400">
              {catalogos.carreras.length} carreras
            </span>
          </div>

          <div className="space-y-1">
            {catalogos.carreras.map(carrera => {
              const isSelected = carrera.id_carrera === selectedCarreraId;
              // Conteo de asignaturas pertenecientes a esta carrera que están asignadas
              const numAsignadas = (assignments.get(carrera.id_carrera) || []).filter(id => {
                const asig = catalogos.asignaturas.find(a => a.id_asignatura === id);
                if (!asig) return false;
                const carr = getCarreraOfAsignatura(asig.codigo_asignatura);
                return carr?.id_carrera === carrera.id_carrera;
              }).length;

              return (
                <button
                  key={carrera.id_carrera}
                  onClick={() => setSelectedCarreraId(carrera.id_carrera)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center justify-between group ${
                    isSelected
                      ? 'bg-purple-900 text-white shadow-xs font-black'
                      : 'text-slate-800 hover:bg-slate-100 hover:text-slate-950 font-bold'
                  }`}
                >
                  <span className="truncate uppercase tracking-tight">
                    {carrera.nombre}
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold shrink-0 ml-2 ${
                      isSelected
                        ? 'bg-[#e5a800] text-[#1f0533]'
                        : 'bg-slate-200 text-slate-600 group-hover:bg-slate-300'
                    }`}
                  >
                    {numAsignadas}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* COLUMNA 2: MIEMBROS ASIGNADOS (Asignaturas Asignadas de esta Carrera) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col min-h-[580px]">
          {/* Header Miembros Asignados */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                <Users className="w-4 h-4 text-purple-700" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <span>Miembros Asignados</span>
                  <span className="text-[11px] font-mono font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full border border-purple-200">
                    {asignadasList.length}
                  </span>
                </h3>
              </div>
            </div>

            {/* Botón Retirar todos */}
            <button
              disabled={asignadasList.length === 0}
              onClick={() => setConfirmClearModal(true)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                asignadasList.length > 0
                  ? 'bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100'
                  : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Retirar todos</span>
            </button>
          </div>

          {/* Aviso Amarillo de Ayuda */}
          <div className="p-3">
            <div className="bg-amber-50/80 border border-amber-300 rounded-xl p-3 flex items-center gap-2.5 text-amber-900 text-xs shadow-2xs">
              <ArrowLeftRight className="w-4 h-4 text-amber-600 shrink-0" />
              <p className="leading-snug font-medium">
                Para retirar: arrastra hacia la derecha o presiona el botón <strong>"Retirar"</strong>.
              </p>
            </div>
          </div>

          {/* Zona Central de Drop y Lista de Asignaturas Asignadas */}
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
                ➕ Soltar aquí para asignar a {carreraActual.nombre}
              </div>
            )}

            {isLoading ? (
              <div className="py-20 text-center text-slate-400 text-xs font-semibold">
                Cargando asignaturas asignadas...
              </div>
            ) : asignadasList.length === 0 ? (
              <div className="py-16 text-center space-y-2 border-2 border-dashed border-slate-200 rounded-xl m-1">
                <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-600">
                  No hay asignaturas vinculadas a esta carrera
                </p>
                <p className="text-[11px] text-slate-400 max-w-[240px] mx-auto">
                  Presiona el botón <strong>"+ Asignar"</strong> en la columna derecha o arrastra las asignaturas disponibles.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[560px] overflow-y-auto pr-1">
                {asignadasList.map(item => {
                  const nivel = getNivelOfAsignatura(item.codigo_asignatura);
                  const carrOficial = getCarreraOfAsignatura(item.codigo_asignatura);

                  return (
                    <div
                      key={item.id_asignatura}
                      draggable
                      onDragStart={e => handleDragStart(e, item.id_asignatura, 'assigned')}
                      onDragEnd={handleDragEnd}
                      className="p-3 bg-white hover:bg-slate-50/80 border border-slate-200 rounded-xl shadow-2xs flex items-center justify-between gap-3 group transition cursor-grab active:cursor-grabbing hover:border-purple-300"
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <GripVertical className="w-4 h-4 text-slate-300 group-hover:text-slate-500 shrink-0 mt-0.5" />
                        <div className="min-w-0 space-y-1">
                          {/* Metadatos: Código | Créditos | Carrera | Nivel */}
                          <div className="flex items-center gap-1.5 flex-wrap text-xs">
                            <span className="text-[10px] font-mono font-bold bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200">
                              {item.codigo_asignatura}
                            </span>
                            <span className="text-[11px] text-slate-500 font-semibold">
                              {item.creditos} Créditos
                            </span>
                            <span className="text-[9.5px] font-bold uppercase px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 truncate max-w-[130px]">
                              {carrOficial?.nombre_carrera || carreraActual.nombre}
                            </span>
                            <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                              {nivel}
                            </span>
                          </div>

                          {/* Título de la Asignatura */}
                          <h4 className="text-xs sm:text-sm font-black text-slate-900 leading-tight truncate max-w-[240px]" title={item.nombre}>
                            {item.nombre}
                          </h4>
                        </div>
                      </div>

                      {/* Botón Retirar */}
                      <button
                        type="button"
                        onClick={() => retirarAsignatura(item.id_asignatura)}
                        className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline px-2 py-1 rounded transition shrink-0 cursor-pointer"
                        title="Retirar esta asignatura de la carrera"
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

        {/* COLUMNA 3: ASIGNATURAS (Disponibles / Sin Asignar de esta Carrera) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col min-h-[580px]">
          {/* Header Asignaturas con Subtítulo y Contador */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                Asignaturas
              </h3>
              <span className="text-xs text-slate-500 font-medium">
                disponibles (sin asignar)
              </span>
            </div>
            <span className="text-xs font-mono font-black bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full border border-slate-200">
              {availableList.length}
            </span>
          </div>

          <div className="p-4 space-y-3.5">
            {/* Zona de Drop para Retirar */}
            <div
              onDragOver={handleDragOverTrash}
              onDragLeave={handleDragLeaveTrash}
              onDrop={handleDropTrash}
              className={`border-2 border-dashed rounded-xl p-3 text-center transition-all cursor-default ${
                isOverTrashDrop
                  ? 'border-rose-500 bg-rose-100/80 scale-[1.01] shadow-md'
                  : 'border-rose-200 bg-rose-50/50 hover:bg-rose-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2 text-rose-600">
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span className="text-xs font-black truncate max-w-[280px]">
                  Soltar aquí para retirar de "{carreraActual.nombre}"
                </span>
              </div>
            </div>

            {/* Barra de Búsqueda */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre, usuario o cargo..."
                className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-indigo-600 shadow-2xs"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Fila de Filtros: Dropdown 'Todos los roles' + Checkbox 'Sin grupo' */}
            <div className="flex items-center justify-between gap-3 text-xs">
              <div className="relative flex-1">
                <select
                  value={selectedRoleFilter}
                  onChange={e => setSelectedRoleFilter(e.target.value)}
                  className="w-full appearance-none bg-white border border-slate-200 rounded-lg px-3 py-1.5 pr-7 text-xs font-semibold text-slate-700 shadow-2xs focus:outline-hidden focus:border-indigo-600 cursor-pointer"
                >
                  <option value="TODOS">Todos los roles</option>
                  <option value="NIVEL_1">Nivel 1</option>
                  <option value="NIVEL_2">Nivel 2</option>
                  <option value="NIVEL_3">Nivel 3</option>
                  <option value="NIVEL_4">Nivel 4</option>
                  <option value="NIVEL_5">Nivel 5</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              </div>

              <label className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold cursor-pointer shrink-0 select-none">
                <input
                  type="checkbox"
                  checked={soloSinGrupo}
                  onChange={e => setSoloSinGrupo(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                />
                <span>Sin grupo</span>
              </label>
            </div>

            {/* Lista Arrastrable de Asignaturas Disponibles */}
            <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
              {availableList.length === 0 ? (
                <div className="py-12 px-4 text-center border-2 border-dashed border-slate-200 rounded-xl space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                  <p className="text-xs font-black text-slate-700">
                    {searchTerm || selectedRoleFilter !== 'TODOS'
                      ? 'No hay asignaturas que coincidan con la búsqueda'
                      : `Todas las asignaturas de ${carreraActual.nombre} están asignadas`}
                  </p>
                  <p className="text-[11px] text-slate-400 max-w-[280px] mx-auto">
                    {searchTerm || selectedRoleFilter !== 'TODOS'
                      ? 'Prueba limpiando los filtros o el texto de búsqueda.'
                      : 'Para liberar alguna asignatura y moverla a disponibles, presiona "Retirar" en Miembros Asignados.'}
                  </p>
                </div>
              ) : (
                availableList.map(item => {
                  const nivel = getNivelOfAsignatura(item.codigo_asignatura);
                  const carrOficial = getCarreraOfAsignatura(item.codigo_asignatura);

                  return (
                    <div
                      key={item.id_asignatura}
                      draggable
                      onDragStart={e => handleDragStart(e, item.id_asignatura, 'available')}
                      onDragEnd={handleDragEnd}
                      className="p-3 bg-white hover:bg-indigo-50/30 border border-slate-200 hover:border-indigo-300 rounded-xl shadow-2xs flex items-center justify-between gap-3 group transition cursor-grab active:cursor-grabbing"
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <GripVertical className="w-4 h-4 text-slate-300 group-hover:text-slate-600 shrink-0 mt-0.5" />
                        <div className="min-w-0 space-y-1">
                          {/* Metadatos: Código | Carrera | Nivel | Créditos */}
                          <div className="flex items-center gap-1.5 flex-wrap text-xs">
                            <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded border border-slate-200">
                              {item.codigo_asignatura}
                            </span>
                            <span className="text-[9.5px] font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 truncate max-w-[130px]">
                              {carrOficial?.nombre_carrera || carreraActual.nombre}
                            </span>
                            <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                              {nivel}
                            </span>
                            <span className="text-[10px] text-slate-500 font-semibold">
                              {item.creditos} Créditos
                            </span>
                          </div>

                          {/* Título de la Asignatura */}
                          <h4 className="text-xs sm:text-sm font-black text-slate-900 leading-tight truncate max-w-[230px]" title={item.nombre}>
                            {item.nombre}
                          </h4>
                        </div>
                      </div>

                      {/* Botón + Asignar */}
                      <button
                        type="button"
                        onClick={() => intentarAsignar(item.id_asignatura)}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200 hover:border-rose-600 transition flex items-center gap-1 shrink-0 cursor-pointer shadow-2xs"
                        title={`Asignar a ${carreraActual.nombre}`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Asignar</span>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
