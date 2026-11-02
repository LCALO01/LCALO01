import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Catalogos, PlanificacionCompleta, AulaLaboratorio, Docente, Asignatura } from '../../types.ts';
import { ApiClient } from '../../controllers/apiClient.ts';
import { 
  Users, 
  Trash2, 
  Search, 
  ArrowLeftRight, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  X, 
  Plus, 
  Building2, 
  DoorOpen,
  Layers,
  Filter,
  Info,
  Calendar,
  Clock,
  Save,
  Copy,
  RefreshCw,
  Sparkles,
  Download,
  FileSpreadsheet,
  AlertCircle,
  Check,
  RotateCcw,
  GraduationCap,
  ChevronDown
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { getCarreraOfAsignatura } from './AsignarAsignaturasView.tsx';
import { getDocenteCarreraId } from './DocentesCrudView.tsx';
import { CapacidadAlertModal } from '../../components/CapacidadAlertModal.tsx';
import { getAulasRecomendadas, playCapacityAlertSound } from '../../utils/classroomRecommendation.ts';
import { AulaRecomendada } from '../../types.ts';

// Helper para deducir el nivel a partir del código de la materia (ej. 103 -> 1, 203 -> 2, 303 -> 3)
export function getNivelFromCodigo(codigo: string): number {
  if (!codigo) return 1;
  const match = codigo.match(/(\d+)/);
  if (match) {
    const num = parseInt(match[1], 10);
    if (num >= 100 && num < 200) return 1;
    if (num >= 200 && num < 300) return 2;
    if (num >= 300 && num < 400) return 3;
    if (num >= 400 && num < 500) return 4;
    if (num >= 500 && num < 600) return 5;
    if (num >= 600 && num < 700) return 6;
    if (num >= 1 && num <= 6) return num;
  }
  return 1;
}

// Helper para calcular la disponibilidad y estado de un aula para una fila dada
export function getAulaDisponibilidad(
  aula: AulaLaboratorio,
  currentRow: AsignacionDocenteAulaRow,
  allRows: AsignacionDocenteAulaRow[]
): { estadoTexto: string; esDisponible: boolean } {
  // 1. Estado administrativo y validaciones especiales
  if (aula.codigo === 'B5' || aula.tipo === 'COWORKING') {
    return { estadoTexto: 'Coworking (No es aula)', esDisponible: false };
  }
  if (['C1', 'C2', 'C3', 'C4'].includes(aula.codigo) || aula.estado === 'INACTIVO') {
    return { estadoTexto: 'No Disponible', esDisponible: false };
  }
  if (aula.estado === 'MANTENIMIENTO') {
    return { estadoTexto: 'Mantenimiento', esDisponible: false };
  }

  // 2. Días y horarios activos configurados en la fila actual
  const activeDays: Array<{ day: 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado' | 'domingo'; time: string }> = [
    { day: 'lunes', time: currentRow.lunes },
    { day: 'martes', time: currentRow.martes },
    { day: 'miercoles', time: currentRow.miercoles },
    { day: 'jueves', time: currentRow.jueves },
    { day: 'viernes', time: currentRow.viernes },
    { day: 'sabado', time: currentRow.sabado },
    { day: 'domingo', time: currentRow.domingo }
  ].filter(d => Boolean(d.time)) as any;

  if (activeDays.length > 0) {
    // Si la fila actual tiene horario, verificar si otra fila diferente ocupa la misma aula en esos días y horas
    const conflict = allRows.some(other => {
      if (other.id === currentRow.id) return false;
      if (other.id_aula_laboratorio !== aula.id_aula_laboratorio) return false;
      return activeDays.some(d => other[d.day] && other[d.day] === d.time);
    });

    if (conflict) {
      return { estadoTexto: 'Ocupado', esDisponible: false };
    }
    return { estadoTexto: 'Disponible', esDisponible: true };
  }

  // 3. Si la fila no tiene horas fijadas aún, verificar si otra fila en la misma jornada ya tiene asignada esta aula
  const occupiedInSameJornada = allRows.some(other => {
    if (other.id === currentRow.id) return false;
    if (other.id_aula_laboratorio !== aula.id_aula_laboratorio) return false;
    return other.id_jornada === currentRow.id_jornada;
  });

  if (occupiedInSameJornada) {
    return { estadoTexto: 'Ocupado', esDisponible: false };
  }

  return { estadoTexto: 'Disponible', esDisponible: true };
}

// Componente Combo Box interactivo para Selección de Aula / Lab con colores verde (Disponible) y rojo (Ocupado)
interface AulaComboBoxProps {
  value: number | null;
  aulas: AulaLaboratorio[];
  currentRow: AsignacionDocenteAulaRow;
  allRows: AsignacionDocenteAulaRow[];
  hasConflict?: boolean;
  onChange: (id_aula: number | null) => void;
  onOccupiedAlert?: (msg: string) => void;
}

export function AulaComboBox({
  value,
  aulas,
  currentRow,
  allRows,
  hasConflict,
  onChange,
  onOccupiedAlert
}: AulaComboBoxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [occupiedAlert, setOccupiedAlert] = useState<{
    aulaNombre: string;
    capacidad: number;
    motivo: string;
  } | null>(null);

  const [capacidadAlert, setCapacidadAlert] = useState<{
    isOpen: boolean;
    mode: 'INSUFICIENTE' | 'RECOMENDACION';
    aula: AulaLaboratorio;
    numeroEstudiantes: number;
    recomendadas: AulaRecomendada[];
  } | null>(null);

  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const [coords, setCoords] = useState<{ top: number; left: number; width: number; openUpwards: boolean }>({
    top: 0,
    left: 0,
    width: 290,
    openUpwards: false
  });

  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpwards = spaceBelow < 270 && rect.top > 270;
    setCoords({
      top: openUpwards ? rect.top : rect.bottom,
      left: Math.max(10, Math.min(rect.left, window.innerWidth - 340)),
      width: Math.max(rect.width, 300),
      openUpwards
    });
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e: MouseEvent) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node) &&
        menuRef.current &&
        !menuRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    const handleScroll = (e: Event) => {
      if (menuRef.current && menuRef.current.contains(e.target as Node)) {
        return;
      }
      updatePosition();
    };

    window.addEventListener('mousedown', handleOutsideClick);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen]);

  const selectedAula = aulas.find(a => a.id_aula_laboratorio === value);
  const selectedDisp = selectedAula ? getAulaDisponibilidad(selectedAula, currentRow, allRows) : null;

  const filteredAulas = useMemo(() => {
    if (!searchTerm.trim()) return aulas;
    const s = searchTerm.toLowerCase();
    return aulas.filter(a =>
      a.nombre.toLowerCase().includes(s) ||
      a.codigo.toLowerCase().includes(s) ||
      String(a.capacidad).includes(s)
    );
  }, [aulas, searchTerm]);

  return (
    <div className="relative w-full">
      {/* Botón disparador del Combo Box */}
      <div
        ref={triggerRef}
        onClick={() => {
          updatePosition();
          setIsOpen(!isOpen);
          setSearchTerm('');
        }}
        className={`w-full bg-white border rounded-lg px-2 py-1 text-xs font-semibold shadow-2xs cursor-pointer flex items-center justify-between gap-1 transition-all select-none ${
          hasConflict
            ? 'border-rose-400 bg-rose-50/50 text-rose-900 ring-2 ring-rose-400/40'
            : isOpen
            ? 'border-indigo-600 ring-2 ring-indigo-500/20 text-slate-800'
            : 'border-slate-200 hover:border-indigo-400 text-slate-800'
        }`}
        title={selectedAula ? `${selectedAula.nombre} (Cap: ${selectedAula.capacidad}, ${selectedDisp?.estadoTexto})` : 'Seleccionar Aula'}
      >
        <div className="flex items-center gap-1 min-w-0">
          {selectedAula ? (
            <>
              <span className="font-bold text-slate-900 shrink-0">{selectedAula.nombre}</span>
              <span className="text-slate-500 font-medium shrink-0 text-[11px]">(Cap: {selectedAula.capacidad},</span>
              <span
                className={`font-black text-[11px] shrink-0 ${
                  selectedDisp?.esDisponible ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {selectedDisp?.estadoTexto}
              </span>
              <span className="text-slate-500 font-medium shrink-0 text-[11px]">)</span>
            </>
          ) : (
            <span className="text-slate-400 font-normal">-- Seleccionar Aula --</span>
          )}
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ml-auto ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {/* Menú Flotante Portal del Combo Box */}
      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: 'fixed',
              top: coords.openUpwards ? 'auto' : `${coords.top + 4}px`,
              bottom: coords.openUpwards ? `${window.innerHeight - coords.top + 4}px` : 'auto',
              left: `${coords.left}px`,
              width: `${coords.width}px`,
              maxHeight: '340px',
              zIndex: 99999
            }}
            className="bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100"
            onClick={e => e.stopPropagation()}
          >
            {aulas.length > 4 && (
              <div className="p-2 border-b border-slate-100 bg-slate-50/80">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2" />
                  <input
                    type="text"
                    placeholder="Buscar aula o laboratorio..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-7 pr-2 py-1 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-600 font-medium"
                    autoFocus
                  />
                </div>
              </div>
            )}

            <div className="overflow-y-auto max-h-[260px] p-1 divide-y divide-slate-100/60">
              <button
                type="button"
                onClick={() => {
                  onChange(null);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between hover:bg-slate-100 transition-colors ${
                  !value ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-500'
                }`}
              >
                <span>-- Sin Aula --</span>
                {!value && <Check className="w-3.5 h-3.5 text-indigo-600" />}
              </button>

              {filteredAulas.map(a => {
                const disp = getAulaDisponibilidad(a, currentRow, allRows);
                const isSelected = a.id_aula_laboratorio === value;
                const isNoDisponible = !disp.esDisponible || disp.estadoTexto === 'Ocupado';
                const isSobrecupo = a.capacidad < currentRow.numero_estudiantes;
                const isDisparidadAlta = a.capacidad > currentRow.numero_estudiantes && (a.capacidad - currentRow.numero_estudiantes >= 5);

                return (
                  <button
                    key={a.id_aula_laboratorio}
                    type="button"
                    onClick={() => {
                      // 1. REGLA 1: Si la capacidad del aula es menor al número de estudiantes
                      // Debe generar una alerta y NO permitir el ingreso
                      if (a.capacidad < currentRow.numero_estudiantes) {
                        playCapacityAlertSound();
                        const recomendadasSuficientes = getAulasRecomendadas(
                          aulas,
                          currentRow.numero_estudiantes,
                          a.id_aula_laboratorio,
                          (other) => getAulaDisponibilidad(other, currentRow, allRows),
                          { id_bloque: currentRow.id_bloque }
                        );
                        setCapacidadAlert({
                          isOpen: true,
                          mode: 'INSUFICIENTE',
                          aula: a,
                          numeroEstudiantes: currentRow.numero_estudiantes,
                          recomendadas: recomendadasSuficientes
                        });
                        setIsOpen(false);
                        return; // INGRESO NO PERMITIDO
                      }

                      // 2. DISPONIBILIDAD: Si está ocupada
                      if (isNoDisponible) {
                        setOccupiedAlert({
                          aulaNombre: a.nombre,
                          capacidad: a.capacidad,
                          motivo: disp.estadoTexto
                        });
                        if (onOccupiedAlert) {
                          onOccupiedAlert('Aula ocupado no se puede hacer uso elija una aula disponible gracias');
                        }
                        return;
                      }

                      // 3. REGLA 2: Si la capacidad del aula es mayor al número de estudiantes
                      // Verificar cuál es el aula recomendada. Ejemplo si el aula es de capacidad 30 y el número de estudiantes es 10
                      // entonces debe lanzar una alerta y listar las aulas apropiadas que ajuste de acuerdo a las capacidades.
                      const diferencia = a.capacidad - currentRow.numero_estudiantes;
                      const ratioOcupacion = currentRow.numero_estudiantes / a.capacidad;
                      const recomendadasAjustadas = getAulasRecomendadas(
                        aulas,
                        currentRow.numero_estudiantes,
                        a.id_aula_laboratorio,
                        (other) => getAulaDisponibilidad(other, currentRow, allRows),
                        { id_bloque: currentRow.id_bloque, maxCapacidadFiltro: a.capacidad }
                      );

                      if ((diferencia >= 5 || ratioOcupacion < 0.8) && recomendadasAjustadas.length > 0) {
                        setCapacidadAlert({
                          isOpen: true,
                          mode: 'RECOMENDACION',
                          aula: a,
                          numeroEstudiantes: currentRow.numero_estudiantes,
                          recomendadas: recomendadasAjustadas
                        });
                        setIsOpen(false);
                        return;
                      }

                      onChange(a.id_aula_laboratorio);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                      isSobrecupo
                        ? 'bg-rose-50/70 hover:bg-rose-100 border border-rose-300 text-rose-950'
                        : isNoDisponible
                        ? 'bg-rose-50/40 hover:bg-rose-100/70 border border-transparent hover:border-rose-300'
                        : isSelected
                        ? 'bg-indigo-50/80 ring-1 ring-indigo-200 hover:bg-indigo-100/50'
                        : isDisparidadAlta
                        ? 'hover:bg-amber-50/60'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          isSobrecupo ? 'bg-rose-600 ring-2 ring-rose-300' : disp.esDisponible ? 'bg-emerald-500' : 'bg-rose-500'
                        }`}
                      />
                      <span className={`font-bold shrink-0 ${isSobrecupo ? 'text-rose-950 font-black' : isNoDisponible ? 'text-rose-950' : 'text-slate-800'}`}>
                        {a.nombre}
                      </span>
                      <span className="text-slate-500 font-medium shrink-0 text-xs">
                        (Cap: {a.capacidad},
                      </span>
                      {/* Disponibilidad o Advertencia de Capacidad */}
                      {isSobrecupo ? (
                        <span className="font-black text-rose-700 shrink-0 text-[11px] bg-rose-200/80 px-1 rounded">
                          ⛔ Cap. insuficiente
                        </span>
                      ) : (
                        <span
                          className={`font-black text-xs shrink-0 ${
                            disp.esDisponible ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {disp.estadoTexto}
                        </span>
                      )}
                      <span className="text-slate-500 font-medium shrink-0 text-xs">)</span>

                      {/* Badge indicador de ajuste si hay mucha diferencia */}
                      {isDisparidadAlta && disp.esDisponible && (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1 py-0.2 rounded shrink-0">
                          💡 +{a.capacidad - currentRow.numero_estudiantes} libres
                        </span>
                      )}
                    </div>

                    {isSelected && <Check className="w-4 h-4 text-indigo-600 shrink-0 ml-auto" />}
                  </button>
                );
              })}

              {filteredAulas.length === 0 && (
                <div className="py-4 text-center text-xs text-slate-400 font-medium">
                  No se encontraron aulas con ese criterio
                </div>
              )}
            </div>
          </div>,
          document.body
        )}

      {/* Modal de Alerta Inmediata si el Aula está Ocupada */}
      {occupiedAlert &&
        createPortal(
          <div className="fixed inset-0 z-[100000] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border-2 border-rose-500 overflow-hidden animate-in zoom-in-95 duration-150">
              {/* Cabecera de Alerta */}
              <div className="bg-rose-600 text-white p-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-black">
                    <AlertTriangle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm uppercase tracking-wider">
                      ¡Aula No Disponible!
                    </h3>
                    <span className="text-[11px] text-rose-100 font-medium">
                      Control de Ocupación de Espacios
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOccupiedAlert(null)}
                  className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Contenido Principal con el mensaje exacto solicitado */}
              <div className="p-5 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto border-2 border-rose-200 shadow-xs">
                  <ShieldAlert className="w-8 h-8" />
                </div>

                <div className="space-y-1.5">
                  <div className="inline-block px-3 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-300">
                    {occupiedAlert.aulaNombre} (Capacidad: {occupiedAlert.capacidad} est.)
                  </div>
                  <p className="text-base font-black text-rose-700 leading-snug">
                    Aula ocupado no se puede hacer uso elija una aula disponible gracias
                  </p>
                </div>

                <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200 text-left space-y-1">
                  <p className="font-semibold text-slate-700">
                    ℹ️ Esta aula ya está asignada a otra asignatura en este mismo horario o jornada.
                  </p>
                  <p className="text-slate-500">
                    Para evitar cruces de horario, por favor seleccione cualquiera de las aulas marcadas en <b>color verde (Disponible)</b>.
                  </p>
                </div>

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setOccupiedAlert(null)}
                    className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-98 text-white font-black text-xs uppercase tracking-wider transition shadow-md cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>Entendido, Elegir Aula Disponible</span>
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Modal de Alerta de Capacidad Insuficiente o Recomendación de Aulas */}
      {capacidadAlert && (
        <CapacidadAlertModal
          isOpen={capacidadAlert.isOpen}
          mode={capacidadAlert.mode}
          aulaSeleccionada={capacidadAlert.aula}
          numeroEstudiantes={capacidadAlert.numeroEstudiantes}
          aulasRecomendadas={capacidadAlert.recomendadas}
          onClose={() => setCapacidadAlert(null)}
          onSelectAula={(newAulaId) => {
            onChange(newAulaId);
            setCapacidadAlert(null);
          }}
          onKeepCurrent={() => {
            onChange(capacidadAlert.aula.id_aula_laboratorio);
            setCapacidadAlert(null);
          }}
        />
      )}
    </div>
  );
}

export interface AsignacionDocenteAulaRow {
  id: string; // unique local ID
  id_planificacion?: number; // DB ID if saved
  id_sede: number;
  id_escuela: number;
  id_carrera: number;
  id_asignatura: number;
  asignatura_codigo: string;
  asignatura_nombre: string;
  id_docente: number | null;
  id_nivel: number;
  id_paralelo: number;
  id_jornada: number;
  id_bloque: number | null;
  id_piso: number | null;
  id_aula_laboratorio: number | null;
  numero_estudiantes: number;
  lunes: string;
  martes: string;
  miercoles: string;
  jueves: string;
  viernes: string;
  sabado: string;
  domingo: string;
  fecha_inicio: string;
  fecha_fin: string;
  total_clases: number;
  estado: 'PLANIFICADO' | 'ASIGNADO' | 'EN CUADRE' | 'UNIFICADO' | 'CONFIRMADO';
  curso_unificado: number;
  isDirty?: boolean;
}

export const TIME_SLOT_OPTIONS = [
  { value: '', label: '-- Sin clase --' },
  { value: '07:00 - 09:00', label: '07:00 - 09:00 (2h)' },
  { value: '09:00 - 11:00', label: '09:00 - 11:00 (2h)' },
  { value: '11:00 - 13:00', label: '11:00 - 13:00 (2h)' },
  { value: '13:00 - 15:00', label: '13:00 - 15:00 (2h)' },
  { value: '15:00 - 17:00', label: '15:00 - 17:00 (2h)' },
  { value: '17:00 - 19:00', label: '17:00 - 19:00 (2h)' },
  { value: '18:00 - 20:00', label: '18:00 - 20:00 (2h)' },
  { value: '19:00 - 21:00', label: '19:00 - 21:00 (2h)' },
  { value: '20:00 - 22:00', label: '20:00 - 22:00 (2h)' },
  { value: '08:00 - 12:00', label: '08:00 - 12:00 (4h Intensivo)' },
  { value: '13:00 - 17:00', label: '13:00 - 17:00 (4h Intensivo)' },
];

export const ESTADO_OPTIONS = [
  { value: 'PLANIFICADO', label: 'Planificado' },
  { value: 'ASIGNADO', label: 'Asignado' },
  { value: 'EN CUADRE', label: 'En Cuadre' },
  { value: 'UNIFICADO', label: 'Unificado' },
  { value: 'CONFIRMADO', label: 'Confirmado' },
];

interface AsignarDocentesAulasViewProps {
  catalogos: Catalogos;
  planificaciones: PlanificacionCompleta[];
  aulas: AulaLaboratorio[];
  onRefresh?: () => void;
  onRefreshAulas?: () => void;
}

export const AsignarDocentesAulasView: React.FC<AsignarDocentesAulasViewProps> = ({
  catalogos,
  planificaciones,
  aulas,
  onRefresh,
  onRefreshAulas
}) => {
  // Filtros superiores con Combo Box exactamente como en la imagen
  const [selectedSedeId, setSelectedSedeId] = useState<number>(catalogos.sedes[0]?.id_sede || 1);
  const [selectedEscuelaId, setSelectedEscuelaId] = useState<number | 'TODAS'>(catalogos.escuelas[0]?.id_escuela || 1);
  const [selectedJornadaId, setSelectedJornadaId] = useState<string>('TODAS');
  const [selectedCarreraId, setSelectedCarreraId] = useState<number | 'TODAS'>('TODAS');
  const [selectedNivelId, setSelectedNivelId] = useState<number | 'TODOS'>('TODOS');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Filas del cuadre manual
  const [rows, setRows] = useState<AsignacionDocenteAulaRow[]>([]);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'warning' } | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [validationModalOpen, setValidationModalOpen] = useState<boolean>(false);
  const [tableCapacidadAlert, setTableCapacidadAlert] = useState<{
    isOpen: boolean;
    mode: 'INSUFICIENTE' | 'RECOMENDACION';
    rowId: string;
    aula: AulaLaboratorio;
    numeroEstudiantes: number;
    recomendadas: AulaRecomendada[];
  } | null>(null);

  // Período activo por defecto
  const periodoActivo = useMemo(() => {
    return catalogos.periodos.find(p => p.estado === 'ACTIVO') || catalogos.periodos[0];
  }, [catalogos.periodos]);

  const defaultFechaInicio = periodoActivo?.fecha_inicio || '2026-05-04';
  const defaultFechaFin = periodoActivo?.fecha_fin || '2026-09-18';

  const showToast = (text: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Convertir planificaciones existentes y asignaturas del catálogo en filas iniciales
  const initializeRows = () => {
    const savedLocal = localStorage.getItem('isuj_asignacion_docentes_aulas_grid');
    if (savedLocal) {
      try {
        const parsed = JSON.parse(savedLocal);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const validated = parsed.map((r: any) => {
            const matchCarrera = getCarreraOfAsignatura(r.asignatura_codigo);
            return {
              ...r,
              id_carrera: matchCarrera?.id_carrera || r.id_carrera || 1,
              id_nivel: r.id_nivel || getNivelFromCodigo(r.asignatura_codigo) || 1
            };
          });
          setRows(validated);
          return;
        }
      } catch (err) {
        console.error('Error al restaurar asignaciones de localStorage', err);
      }
    }

    // Si no hay local, generar a partir de las planificaciones de BD
    const initialList: AsignacionDocenteAulaRow[] = [];
    const processedAsigIds = new Set<string>();

    if (planificaciones && planificaciones.length > 0) {
      planificaciones.forEach(p => {
        const key = `${p.id_asignatura}_${p.id_paralelo}`;
        if (!processedAsigIds.has(key)) {
          processedAsigIds.add(key);

          // Determinar franja horaria para el día asignado
          const timeSlot = p.hora_inicio && p.hora_fin ? `${p.hora_inicio} - ${p.hora_fin}` : '';
          const diaCode = (p.dia_codigo || '').toUpperCase();
          const deducedNivel = p.id_nivel || getNivelFromCodigo(p.asignatura_codigo) || 1;
          const matchCarrera = getCarreraOfAsignatura(p.asignatura_codigo || '');
          const finalCarreraId = matchCarrera?.id_carrera || p.id_carrera || 1;

          const row: AsignacionDocenteAulaRow = {
            id: `plan_${p.id_planificacion}`,
            id_planificacion: p.id_planificacion,
            id_sede: p.id_sede || 1,
            id_escuela: p.id_escuela || 1,
            id_carrera: finalCarreraId,
            id_asignatura: p.id_asignatura,
            asignatura_codigo: p.asignatura_codigo || '',
            asignatura_nombre: p.asignatura_nombre || '',
            id_docente: p.id_docente || null,
            id_nivel: deducedNivel,
            id_paralelo: p.id_paralelo || 1,
            id_jornada: p.id_jornada || 1,
            id_bloque: p.id_bloque || null,
            id_piso: p.aula_piso || null,
            id_aula_laboratorio: p.id_aula_laboratorio || null,
            numero_estudiantes: p.numero_estudiantes || 30,
            lunes: diaCode === 'LUN' ? timeSlot : '',
            martes: diaCode === 'MAR' ? timeSlot : '',
            miercoles: diaCode === 'MIE' ? timeSlot : '',
            jueves: diaCode === 'JUE' ? timeSlot : '',
            viernes: diaCode === 'VIE' ? timeSlot : '',
            sabado: diaCode === 'SAB' ? timeSlot : '',
            domingo: diaCode === 'DOM' ? timeSlot : '',
            fecha_inicio: defaultFechaInicio,
            fecha_fin: defaultFechaFin,
            total_clases: p.total_clases || 32,
            estado: (p.estado as any) || 'ASIGNADO',
            curso_unificado: p.curso_unificado || 0,
            isDirty: false
          };
          initialList.push(row);
        }
      });
    }

    // Agregar asignaturas del catálogo que aún no estén en el cuadre para que el usuario pueda cuadrar manualmente
    catalogos.asignaturas.forEach(asig => {
      const matchCarrera = getCarreraOfAsignatura(asig.codigo_asignatura);
      const carreraId = matchCarrera?.id_carrera || catalogos.carreras[0]?.id_carrera || 1;
      const key = `${asig.id_asignatura}_1`;
      const deducedNivel = getNivelFromCodigo(asig.codigo_asignatura) || 1;

      if (!processedAsigIds.has(key)) {
        processedAsigIds.add(key);
        initialList.push({
          id: `asig_${asig.id_asignatura}`,
          id_sede: 1,
          id_escuela: 1,
          id_carrera: carreraId,
          id_asignatura: asig.id_asignatura,
          asignatura_codigo: asig.codigo_asignatura,
          asignatura_nombre: asig.nombre,
          id_docente: null,
          id_nivel: deducedNivel,
          id_paralelo: 1,
          id_jornada: 1,
          id_bloque: 1,
          id_piso: 1,
          id_aula_laboratorio: null,
          numero_estudiantes: 30,
          lunes: '',
          martes: '',
          miercoles: '',
          jueves: '',
          viernes: '',
          sabado: '',
          domingo: '',
          fecha_inicio: defaultFechaInicio,
          fecha_fin: defaultFechaFin,
          total_clases: 32,
          estado: 'PLANIFICADO',
          curso_unificado: 0,
          isDirty: false
        });
      }
    });

    setRows(initialList);
    localStorage.setItem('isuj_asignacion_docentes_aulas_grid', JSON.stringify(initialList));
  };

  useEffect(() => {
    initializeRows();
  }, [catalogos, planificaciones]);

  // Guardar en localStorage ante cualquier cambio
  const updateRowsState = (newRows: AsignacionDocenteAulaRow[]) => {
    setRows(newRows);
    localStorage.setItem('isuj_asignacion_docentes_aulas_grid', JSON.stringify(newRows));
  };

  // Cálculo de horas acumuladas por docente en la grilla para ayudar a cuadrar la carga
  const horasDocentesMap = useMemo(() => {
    const map = new Map<number, number>();
    rows.forEach(r => {
      if (r.id_docente) {
        let weeklyHours = 0;
        const days = [r.lunes, r.martes, r.miercoles, r.jueves, r.viernes, r.sabado, r.domingo];
        days.forEach(d => {
          if (d) {
            if (d.includes('4h')) weeklyHours += 4;
            else weeklyHours += 2;
          }
        });
        map.set(r.id_docente, (map.get(r.id_docente) || 0) + weeklyHours);
      }
    });
    return map;
  }, [rows]);

  // Detección en tiempo real de cruces de docentes y aulas
  const conflicts = useMemo(() => {
    const aulaConflicts: Array<{
      rowIdA: string;
      rowIdB: string;
      dia: string;
      aulaNombre: string;
      hora: string;
      asigA: string;
      asigB: string;
    }> = [];

    const docenteConflicts: Array<{
      rowIdA: string;
      rowIdB: string;
      dia: string;
      docenteNombre: string;
      hora: string;
      asigA: string;
      asigB: string;
    }> = [];

    const daysKey: Array<keyof Pick<AsignacionDocenteAulaRow, 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado' | 'domingo'>> = [
      'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'
    ];

    for (let i = 0; i < rows.length; i++) {
      for (let j = i + 1; j < rows.length; j++) {
        const rowA = rows[i];
        const rowB = rows[j];

        daysKey.forEach(day => {
          const timeA = rowA[day];
          const timeB = rowB[day];

          if (timeA && timeB && timeA === timeB) {
            // Verificar cruce de aula
            if (rowA.id_aula_laboratorio && rowB.id_aula_laboratorio && rowA.id_aula_laboratorio === rowB.id_aula_laboratorio) {
              const aula = aulas.find(a => a.id_aula_laboratorio === rowA.id_aula_laboratorio);
              aulaConflicts.push({
                rowIdA: rowA.id,
                rowIdB: rowB.id,
                dia: day.toUpperCase(),
                aulaNombre: aula?.nombre || `Aula #${rowA.id_aula_laboratorio}`,
                hora: timeA,
                asigA: rowA.asignatura_nombre,
                asigB: rowB.asignatura_nombre
              });
            }

            // Verificar cruce de docente
            if (rowA.id_docente && rowB.id_docente && rowA.id_docente === rowB.id_docente) {
              const doc = catalogos.docentes.find(d => d.id_docente === rowA.id_docente);
              docenteConflicts.push({
                rowIdA: rowA.id,
                rowIdB: rowB.id,
                dia: day.toUpperCase(),
                docenteNombre: doc ? `${doc.nombres} ${doc.apellidos}` : `Docente #${rowA.id_docente}`,
                hora: timeA,
                asigA: rowA.asignatura_nombre,
                asigB: rowB.asignatura_nombre
              });
            }
          }
        });
      }
    }

    return {
      aulaConflicts,
      docenteConflicts,
      total: aulaConflicts.length + docenteConflicts.length
    };
  }, [rows, aulas, catalogos.docentes]);

  // Manejar edición de campo individual en una fila
  const handleCellChange = (rowId: string, field: keyof AsignacionDocenteAulaRow, value: any) => {
    const updated = rows.map(r => {
      if (r.id !== rowId) return r;

      const nextRow = { ...r, [field]: value, isDirty: true };

      // Si cambia de bloque, verificar si el aula actual pertenece al nuevo bloque
      if (field === 'id_bloque') {
        const nuevoBloqueId = Number(value);
        if (nuevoBloqueId) {
          const aulaActual = aulas.find(a => a.id_aula_laboratorio === nextRow.id_aula_laboratorio);
          if (aulaActual && aulaActual.id_bloque !== nuevoBloqueId) {
            // Seleccionar la primera aula de ese bloque
            const primerAula = aulas.find(a => a.id_bloque === nuevoBloqueId);
            nextRow.id_aula_laboratorio = primerAula ? primerAula.id_aula_laboratorio : null;
            nextRow.id_piso = primerAula ? primerAula.piso : 1;
          }
        }
      }

      // Si cambia de aula, actualizar bloque y piso automáticamente
      if (field === 'id_aula_laboratorio') {
        const aulaId = Number(value);
        if (aulaId) {
          const aula = aulas.find(a => a.id_aula_laboratorio === aulaId);
          if (aula) {
            nextRow.id_bloque = aula.id_bloque;
            nextRow.id_piso = aula.piso;
          }
        } else {
          nextRow.id_aula_laboratorio = null;
        }
      }

      // Si cambia de docente y pasa a tener docente, cambiar estado a 'ASIGNADO' si estaba 'PLANIFICADO'
      if (field === 'id_docente') {
        const docId = value ? Number(value) : null;
        nextRow.id_docente = docId;
        if (docId && nextRow.estado === 'PLANIFICADO') {
          nextRow.estado = 'ASIGNADO';
        }
      }

      // Si cambia el número de estudiantes, verificar coherencia de aforo
      if (field === 'numero_estudiantes') {
        const nuevoNum = Number(value) || 0;
        nextRow.numero_estudiantes = nuevoNum;
        if (nextRow.id_aula_laboratorio) {
          const aulaActual = aulas.find(a => a.id_aula_laboratorio === nextRow.id_aula_laboratorio);
          if (aulaActual && aulaActual.capacidad < nuevoNum) {
            playCapacityAlertSound();
            showToast(`⛔ Capacidad insuficiente en ${aulaActual.nombre} (${aulaActual.capacidad} puestos para ${nuevoNum} estudiantes). ¡Ingreso no permitido!`, 'error');
            const recsSuficientes = getAulasRecomendadas(
              aulas,
              nuevoNum,
              aulaActual.id_aula_laboratorio,
              (other) => getAulaDisponibilidad(other, nextRow, rows),
              { id_bloque: nextRow.id_bloque }
            );
            setTableCapacidadAlert({
              isOpen: true,
              mode: 'INSUFICIENTE',
              rowId,
              aula: aulaActual,
              numeroEstudiantes: nuevoNum,
              recomendadas: recsSuficientes
            });
          } else if (aulaActual && (aulaActual.capacidad - nuevoNum >= 5)) {
            const recsAjustadas = getAulasRecomendadas(
              aulas,
              nuevoNum,
              aulaActual.id_aula_laboratorio,
              (other) => getAulaDisponibilidad(other, nextRow, rows),
              { id_bloque: nextRow.id_bloque, maxCapacidadFiltro: aulaActual.capacidad }
            );
            if (recsAjustadas.length > 0) {
              setTableCapacidadAlert({
                isOpen: true,
                mode: 'RECOMENDACION',
                rowId,
                aula: aulaActual,
                numeroEstudiantes: nuevoNum,
                recomendadas: recsAjustadas
              });
            }
          }
        }
      }

      // Recalcular total clases / horas semanales si cambian días
      if (['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'].includes(field as string)) {
        let weeklyHours = 0;
        const days = [nextRow.lunes, nextRow.martes, nextRow.miercoles, nextRow.jueves, nextRow.viernes, nextRow.sabado, nextRow.domingo];
        days.forEach(d => {
          if (d) {
            if (d.includes('4h')) weeklyHours += 4;
            else weeklyHours += 2;
          }
        });
        nextRow.total_clases = weeklyHours * 16; // 16 semanas por periodo
      }

      return nextRow;
    });

    updateRowsState(updated);
  };

  // Guardar fila individual en la base de datos
  const handleSaveRow = async (row: AsignacionDocenteAulaRow) => {
    try {
      setIsSaving(true);
      // Validar campos mínimos
      if (!row.id_docente) {
        showToast(`Por favor asigne un docente a la materia "${row.asignatura_nombre}" antes de guardar.`, 'warning');
        setIsSaving(false);
        return;
      }
      if (!row.id_aula_laboratorio) {
        showToast(`Por favor asigne un aula a la materia "${row.asignatura_nombre}" antes de guardar.`, 'warning');
        setIsSaving(false);
        return;
      }

      // Validar regla estricta: Capacidad menor al número de estudiantes -> INGRESO NO PERMITIDO
      const aulaRow = aulas.find(a => a.id_aula_laboratorio === row.id_aula_laboratorio);
      if (aulaRow && aulaRow.capacidad < row.numero_estudiantes) {
        playCapacityAlertSound();
        showToast(`⛔ No se puede guardar: Capacidad insuficiente en aula ${aulaRow.nombre} (${aulaRow.capacidad} cupos para ${row.numero_estudiantes} estudiantes). Ingreso no permitido.`, 'error');
        setIsSaving(false);
        return;
      }

      // Determinar primer día activo
      let idDia = 1;
      let horaInicio = '07:00';
      let horaFin = '09:00';

      const daysArr: Array<{ id: number; val: string }> = [
        { id: 1, val: row.lunes },
        { id: 2, val: row.martes },
        { id: 3, val: row.miercoles },
        { id: 4, val: row.jueves },
        { id: 5, val: row.viernes },
        { id: 6, val: row.sabado },
        { id: 7, val: row.domingo },
      ];

      const activeDay = daysArr.find(d => Boolean(d.val));
      if (activeDay) {
        idDia = activeDay.id;
        const parts = activeDay.val.split(' - ');
        if (parts.length === 2) {
          horaInicio = parts[0].trim();
          horaFin = parts[1].split(' ')[0].trim();
        }
      }

      const payload = {
        id_sede: row.id_sede,
        id_escuela: row.id_escuela,
        id_carrera: row.id_carrera,
        id_asignatura: row.id_asignatura,
        id_docente: row.id_docente,
        id_nivel: row.id_nivel || 1,
        id_paralelo: row.id_paralelo,
        id_jornada: row.id_jornada,
        id_bloque: row.id_bloque || 1,
        id_aula_laboratorio: row.id_aula_laboratorio,
        id_periodo: periodoActivo?.id_periodo || 1,
        numero_estudiantes: row.numero_estudiantes,
        total_clases: row.total_clases,
        estado: row.estado,
        id_dia: idDia,
        hora_inicio: horaInicio,
        hora_fin: horaFin,
        modalidad: 'PRESENCIAL'
      };

      if (row.id_planificacion) {
        await ApiClient.updatePlanificacion(row.id_planificacion, payload);
      } else {
        const created = await ApiClient.createPlanificacion(payload);
        row.id_planificacion = created.id_planificacion;
      }

      // Marcar como limpia
      const updated = rows.map(r => r.id === row.id ? { ...r, id_planificacion: row.id_planificacion, isDirty: false } : r);
      updateRowsState(updated);
      showToast(`Asignación de "${row.asignatura_nombre}" guardada con éxito en la base de datos.`);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      showToast(err.message || 'Error al guardar asignación', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Guardar todas las filas que tienen cambios
  const handleSaveAll = async () => {
    setIsSaving(true);
    let savedCount = 0;
    let errorCount = 0;

    for (const row of rows) {
      if (row.isDirty && row.id_docente && row.id_aula_laboratorio) {
        try {
          const aulaRow = aulas.find(a => a.id_aula_laboratorio === row.id_aula_laboratorio);
          if (aulaRow && aulaRow.capacidad < row.numero_estudiantes) {
            errorCount++;
            continue; // No permitir guardar aula con capacidad menor a estudiantes
          }

          const daysArr: Array<{ id: number; val: string }> = [
            { id: 1, val: row.lunes },
            { id: 2, val: row.martes },
            { id: 3, val: row.miercoles },
            { id: 4, val: row.jueves },
            { id: 5, val: row.viernes },
            { id: 6, val: row.sabado },
            { id: 7, val: row.domingo },
          ];
          const activeDay = daysArr.find(d => Boolean(d.val)) || { id: 1, val: '07:00 - 09:00' };
          const parts = activeDay.val.split(' - ');

          const payload = {
            id_sede: row.id_sede,
            id_escuela: row.id_escuela,
            id_carrera: row.id_carrera,
            id_asignatura: row.id_asignatura,
            id_docente: row.id_docente,
            id_nivel: row.id_nivel || 1,
            id_paralelo: row.id_paralelo,
            id_jornada: row.id_jornada,
            id_bloque: row.id_bloque || 1,
            id_aula_laboratorio: row.id_aula_laboratorio,
            id_periodo: periodoActivo?.id_periodo || 1,
            numero_estudiantes: row.numero_estudiantes,
            total_clases: row.total_clases,
            estado: row.estado,
            id_dia: activeDay.id,
            hora_inicio: parts[0]?.trim() || '07:00',
            hora_fin: parts[1]?.split(' ')[0]?.trim() || '09:00',
            modalidad: 'PRESENCIAL'
          };

          if (row.id_planificacion) {
            await ApiClient.updatePlanificacion(row.id_planificacion, payload);
          } else {
            const created = await ApiClient.createPlanificacion(payload);
            row.id_planificacion = created.id_planificacion;
          }
          row.isDirty = false;
          savedCount++;
        } catch (e) {
          errorCount++;
        }
      }
    }

    updateRowsState([...rows]);
    setIsSaving(false);
    if (onRefresh) onRefresh();

    if (errorCount === 0) {
      showToast(`Se han guardado ${savedCount} asignaciones cuadradas correctamente.`);
    } else {
      showToast(`Guardadas ${savedCount} filas. ${errorCount} no pudieron guardarse por falta de datos o cruces.`, 'warning');
    }
  };

  // Duplicar fila para otro paralelo
  const handleDuplicateRow = (row: AsignacionDocenteAulaRow) => {
    // Siguiente paralelo
    const nextParaleloId = (row.id_paralelo % catalogos.paralelos.length) + 1;
    const newRow: AsignacionDocenteAulaRow = {
      ...row,
      id: `copy_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      id_planificacion: undefined,
      id_paralelo: nextParaleloId,
      estado: 'PLANIFICADO',
      isDirty: true
    };
    const updated = [newRow, ...rows];
    updateRowsState(updated);
    showToast(`Fila duplicada para el paralelo #${nextParaleloId}. Ajuste docente y horario.`);
  };

  // Limpiar campos de horario y docente de una fila
  const handleClearRow = (rowId: string) => {
    const updated = rows.map(r => {
      if (r.id !== rowId) return r;
      return {
        ...r,
        id_docente: null,
        id_aula_laboratorio: null,
        lunes: '',
        martes: '',
        miercoles: '',
        jueves: '',
        viernes: '',
        sabado: '',
        domingo: '',
        estado: 'PLANIFICADO' as const,
        isDirty: true
      };
    });
    updateRowsState(updated);
    showToast('Asignación reseteada.');
  };

  // Eliminar fila
  const handleDeleteRow = async (row: AsignacionDocenteAulaRow) => {
    if (row.id_planificacion) {
      if (!confirm(`¿Eliminar la asignación de "${row.asignatura_nombre}" de la base de datos?`)) return;
      try {
        await ApiClient.deletePlanificacion(row.id_planificacion);
        showToast('Asignación eliminada de la base de datos.');
        if (onRefresh) onRefresh();
      } catch (err: any) {
        showToast(err.message || 'Error al eliminar', 'error');
      }
    }
    const filtered = rows.filter(r => r.id !== row.id);
    updateRowsState(filtered);
  };

  // Auto-Cuadrar inteligente: busca docentes y aulas disponibles sin conflicto
  const handleAutoCuadrar = () => {
    let assignedCount = 0;
    const updated = rows.map(row => {
      if (row.id_docente && row.id_aula_laboratorio && (row.lunes || row.martes || row.miercoles || row.jueves || row.viernes)) {
        return row; // ya tiene cuadre
      }

      const next = { ...row, isDirty: true };

      // 1. Docente sugerido si no tiene (filtrado estrictamente por la carrera correspondiente)
      if (!next.id_docente) {
        const targetCarreraId = (selectedCarreraId !== 'TODAS') ? selectedCarreraId : next.id_carrera;
        const carreraDocs = catalogos.docentes.filter(d => getDocenteCarreraId(d) === targetCarreraId);
        const docsPool = carreraDocs.length > 0 ? carreraDocs : catalogos.docentes;

        // Encontrar un docente con menor carga horaria dentro de su carrera
        const sortedDocs = [...docsPool].sort((a, b) => {
          const hA = horasDocentesMap.get(a.id_docente) || 0;
          const hB = horasDocentesMap.get(b.id_docente) || 0;
          return hA - hB;
        });
        if (sortedDocs.length > 0) {
          next.id_docente = sortedDocs[0].id_docente;
        }
      }

      // 2. Aula sugerida con capacidad >= estudiantes y que esté disponible
      if (!next.id_aula_laboratorio) {
        const matchingAula = aulas.find(a => 
          (next.id_bloque ? a.id_bloque === next.id_bloque : true) && 
          a.capacidad >= next.numero_estudiantes && 
          a.estado !== 'MANTENIMIENTO' &&
          a.estado !== 'INACTIVO' &&
          getAulaDisponibilidad(a, next, rows).esDisponible
        ) || aulas.find(a => 
          (next.id_bloque ? a.id_bloque === next.id_bloque : true) && 
          a.capacidad >= next.numero_estudiantes && 
          a.estado !== 'MANTENIMIENTO'
        ) || aulas[0];

        if (matchingAula) {
          next.id_aula_laboratorio = matchingAula.id_aula_laboratorio;
          next.id_bloque = matchingAula.id_bloque;
          next.id_piso = matchingAula.piso;
        }
      }

      // 3. Horario por defecto si no tiene ningún día
      if (!next.lunes && !next.martes && !next.miercoles && !next.jueves && !next.viernes) {
        // Asignar Lunes y Miércoles 07:00 - 09:00 o según jornada
        if (next.id_jornada === 2) {
          next.lunes = '13:00 - 15:00';
          next.miercoles = '13:00 - 15:00';
        } else if (next.id_jornada === 3) {
          next.lunes = '18:00 - 20:00';
          next.miercoles = '18:00 - 20:00';
        } else {
          next.lunes = '07:00 - 09:00';
          next.miercoles = '07:00 - 09:00';
        }
        next.total_clases = 64;
      }

      next.estado = 'EN CUADRE';
      assignedCount++;
      return next;
    });

    updateRowsState(updated);
    showToast(`Auto-cuadre completado. Se sugirieron docentes, aulas y horarios para ${assignedCount} materias.`);
  };

  // Exportar cuadre a Microsoft Excel (.xlsx)
  const handleExportXLSX = () => {
    try {
      const data = filteredRows.map((r, idx) => {
        const doc = catalogos.docentes.find(d => d.id_docente === r.id_docente);
        const niv = catalogos.niveles.find(n => n.id_nivel === r.id_nivel);
        const par = catalogos.paralelos.find(p => p.id_paralelo === r.id_paralelo);
        const jor = catalogos.jornadas.find(j => j.id_jornada === r.id_jornada);
        const bloq = catalogos.bloques.find(b => b.id_bloque === r.id_bloque);
        const car = catalogos.carreras.find(c => c.id_carrera === r.id_carrera);
        const aula = aulas.find(a => a.id_aula_laboratorio === r.id_aula_laboratorio);
        const cap = aula?.capacidad || 0;
        const aforoPct = cap > 0 ? `${Math.round((r.numero_estudiantes / cap) * 100)}%` : 'N/A';

        return {
          '#': idx + 1,
          'Código': r.asignatura_codigo || '',
          'Asignatura': r.asignatura_nombre || '',
          'Carrera': car?.nombre || 'General',
          'Docente Asignado': doc ? `${doc.nombres} ${doc.apellidos}` : 'Sin Asignar',
          'Cédula Docente': doc?.ci || '',
          'Nivel': niv?.nombre || `Nivel ${r.id_nivel || 1}`,
          'Paralelo': par?.codigo || 'A',
          'Jornada': jor?.nombre || 'Matutina',
          'Bloque': bloq?.nombre || 'Bloque Central',
          'Piso': r.id_piso ? `Piso ${r.id_piso}` : 'PB',
          'Aula / Laboratorio': aula ? `${aula.nombre} (${aula.codigo || ''})` : 'Sin Aula',
          'Capacidad Aula': cap,
          'N° Estudiantes': r.numero_estudiantes,
          'Aforo %': aforoPct,
          'Lunes': r.lunes || '-',
          'Martes': r.martes || '-',
          'Miércoles': r.miercoles || '-',
          'Jueves': r.jueves || '-',
          'Viernes': r.viernes || '-',
          'Sábado': r.sabado || '-',
          'Domingo': r.domingo || '-',
          'Fecha Inicio': r.fecha_inicio || '',
          'Fecha Fin': r.fecha_fin || '',
          'Total Clases': r.total_clases || 64,
          'Estado': r.estado || 'REGULAR'
        };
      });

      const ws = XLSX.utils.json_to_sheet(data);

      // Auto-ajuste de anchos de columna
      ws['!cols'] = [
        { wch: 5 },  // #
        { wch: 14 }, // Código
        { wch: 36 }, // Asignatura
        { wch: 28 }, // Carrera
        { wch: 32 }, // Docente Asignado
        { wch: 14 }, // Cédula Docente
        { wch: 10 }, // Nivel
        { wch: 10 }, // Paralelo
        { wch: 14 }, // Jornada
        { wch: 16 }, // Bloque
        { wch: 8 },  // Piso
        { wch: 24 }, // Aula
        { wch: 15 }, // Capacidad Aula
        { wch: 15 }, // N° Estudiantes
        { wch: 12 }, // Aforo %
        { wch: 16 }, // Lunes
        { wch: 16 }, // Martes
        { wch: 16 }, // Miércoles
        { wch: 16 }, // Jueves
        { wch: 16 }, // Viernes
        { wch: 14 }, // Sábado
        { wch: 14 }, // Domingo
        { wch: 14 }, // Fecha Inicio
        { wch: 14 }, // Fecha Fin
        { wch: 12 }, // Total Clases
        { wch: 14 }  // Estado
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Docentes y Aulas');
      const filename = `cuadre_docentes_aulas_${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(wb, filename);

      showToast('Archivo Excel (.xlsx) generado y descargado con éxito.');
    } catch (err: any) {
      console.error('Error exportando a XLSX:', err);
      showToast('Error al exportar a Excel: ' + (err.message || ''), 'error');
    }
  };

  // Exportar cuadre a CSV
  const handleExportCSV = () => {
    const headers = [
      'Asignatura Código',
      'Asignatura Nombre',
      'Docente',
      'Nivel',
      'Paralelo',
      'Jornada',
      'Bloque',
      'Piso',
      'Aula / Lab.',
      'Capacidad Aula',
      'Número Estudiantes',
      'Aforo %',
      'Lunes',
      'Martes',
      'Miércoles',
      'Jueves',
      'Viernes',
      'Sábado',
      'Domingo',
      'Fecha Inicio',
      'Fecha Fin',
      'Total Clases',
      'Estado'
    ];

    const lines = filteredRows.map(r => {
      const doc = catalogos.docentes.find(d => d.id_docente === r.id_docente);
      const niv = catalogos.niveles.find(n => n.id_nivel === r.id_nivel);
      const par = catalogos.paralelos.find(p => p.id_paralelo === r.id_paralelo);
      const jor = catalogos.jornadas.find(j => j.id_jornada === r.id_jornada);
      const bloq = catalogos.bloques.find(b => b.id_bloque === r.id_bloque);
      const aula = aulas.find(a => a.id_aula_laboratorio === r.id_aula_laboratorio);
      const cap = aula?.capacidad || 0;
      const aforoPct = cap > 0 ? ((r.numero_estudiantes / cap) * 100).toFixed(1) + '%' : 'N/A';

      return [
        `"${r.asignatura_codigo}"`,
        `"${r.asignatura_nombre}"`,
        `"${doc ? doc.nombres + ' ' + doc.apellidos : 'Sin Asignar'}"`,
        `"${niv?.nombre || 'Nivel ' + (r.id_nivel || 1)}"`,
        `"${par?.codigo || 'A'}"`,
        `"${jor?.nombre || 'Matutina'}"`,
        `"${bloq?.nombre || 'Bloque Central'}"`,
        `"${r.id_piso || 1}"`,
        `"${aula?.nombre || 'Sin Aula'}"`,
        cap,
        r.numero_estudiantes,
        `"${aforoPct}"`,
        `"${r.lunes}"`,
        `"${r.martes}"`,
        `"${r.miercoles}"`,
        `"${r.jueves}"`,
        `"${r.viernes}"`,
        `"${r.sabado}"`,
        `"${r.domingo}"`,
        `"${r.fecha_inicio}"`,
        `"${r.fecha_fin}"`,
        r.total_clases,
        `"${r.estado}"`
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...lines].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cuadre_docentes_aulas_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Archivo CSV generado y descargado con éxito.');
  };

  // Filtrado de filas según los combo box superiores
  const filteredRows = useMemo(() => {
    return rows.filter(r => {
      // Filtro Sede
      if (selectedSedeId && r.id_sede !== selectedSedeId) {
        // Si no coincide estrictamente se permite si es la sede activa
      }

      // Filtro Escuela
      if (selectedEscuelaId !== 'TODAS' && r.id_escuela !== selectedEscuelaId) {
        // Comprobar si la carrera de la fila pertenece a esa escuela
        const carr = catalogos.carreras.find(c => c.id_carrera === r.id_carrera);
        if (carr && carr.id_escuela !== selectedEscuelaId) return false;
      }

      // Filtro Jornada
      if (selectedJornadaId !== 'TODAS' && String(r.id_jornada) !== selectedJornadaId) {
        return false;
      }

      // Filtro Carrera
      if (selectedCarreraId !== 'TODAS' && r.id_carrera !== selectedCarreraId) {
        return false;
      }

      // Filtro Nivel
      if (selectedNivelId !== 'TODOS' && r.id_nivel !== selectedNivelId) {
        return false;
      }

      // Búsqueda por texto
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const asigMatch = r.asignatura_nombre.toLowerCase().includes(query) || r.asignatura_codigo.toLowerCase().includes(query);
        const doc = catalogos.docentes.find(d => d.id_docente === r.id_docente);
        const docMatch = doc ? `${doc.nombres} ${doc.apellidos}`.toLowerCase().includes(query) : false;
        if (!asigMatch && !docMatch) return false;
      }

      return true;
    });
  }, [rows, selectedSedeId, selectedEscuelaId, selectedJornadaId, selectedCarreraId, selectedNivelId, searchTerm, catalogos.carreras, catalogos.docentes]);

  // Indicador de carrera activa para mostrar demanda y aforo general
  const carreraActual = useMemo(() => {
    if (selectedCarreraId !== 'TODAS') {
      return catalogos.carreras.find(c => c.id_carrera === selectedCarreraId);
    }
    return catalogos.carreras[0];
  }, [selectedCarreraId, catalogos.carreras]);

  const demandaEstimada = 30; // Demanda estimada típica por cohortes según imagen

  // Métricas de resumen
  const metricas = useMemo(() => {
    const total = filteredRows.length;
    const conDocente = filteredRows.filter(r => Boolean(r.id_docente)).length;
    const conAula = filteredRows.filter(r => Boolean(r.id_aula_laboratorio)).length;
    const conHorario = filteredRows.filter(r => Boolean(r.lunes || r.martes || r.miercoles || r.jueves || r.viernes)).length;
    const dirtyCount = filteredRows.filter(r => r.isDirty).length;
    return { total, conDocente, conAula, conHorario, dirtyCount };
  }, [filteredRows]);

  return (
    <div className="space-y-4">
      {/* Toast Notificación */}
      {toastMessage && (
        <div className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs sm:text-sm font-bold border animate-in slide-in-from-bottom duration-200 ${
          toastMessage.type === 'error'
            ? 'bg-rose-900 text-white border-rose-700'
            : toastMessage.type === 'warning'
            ? 'bg-amber-900 text-amber-100 border-amber-600'
            : 'bg-emerald-900 text-emerald-100 border-emerald-600'
        }`}>
          {toastMessage.type === 'error' ? <AlertCircle className="w-5 h-5 shrink-0" /> : <CheckCircle2 className="w-5 h-5 shrink-0" />}
          <span>{toastMessage.text}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-white/70 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Alerta de cruces si existen */}
      {conflicts.total > 0 && (
        <div className="bg-amber-500/10 border-2 border-amber-500/40 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-[#1f0533] flex items-center justify-center font-black shrink-0 shadow-xs">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-black text-amber-950 flex items-center gap-2">
                <span>Atención: {conflicts.total} conflicto(s) detectado(s) en la cuadrícula</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-mono font-bold">
                  {conflicts.aulaConflicts.length} de Aula • {conflicts.docenteConflicts.length} de Docente
                </span>
              </h4>
              <p className="text-xs text-amber-900/80 mt-0.5">
                Revise las celdas resaltadas en amarillo/rojo o abra el inspector de conflictos para resolverlos de inmediato.
              </p>
            </div>
          </div>
          <button
            onClick={() => setValidationModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500 text-[#1f0533] hover:bg-amber-400 font-black text-xs transition cursor-pointer shrink-0 shadow-xs flex items-center justify-center gap-1.5"
          >
            <Info className="w-4 h-4" />
            <span>Ver Detalles de Cruces ({conflicts.total})</span>
          </button>
        </div>
      )}

      {/* =========================================================================
          ENCABEZADO DE FILTROS SUPERIORES: Sede, Escuela, Jornada, Carrera
          (Exacto como en la imagen adjunta)
      ========================================================================= */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 uppercase tracking-wider mb-1">
              <Layers className="w-4 h-4 text-[#e5a800]" />
              <span>SISTEMA &gt; 4. PLANIFICACIÓN &gt; ASIGNACION_DOCENTES_AULAS</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>Asignar Asignatura</span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                Cuadre Interactivo
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Asignación manual de docentes, paralelos, jornadas, bloques, pisos, aulas y horarios mediante combo box para cuadrar capacidades y aforos.
            </p>
          </div>

          {/* Botones de acción principales */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleAutoCuadrar}
              className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
              title="Sugerir automáticamente docentes y aulas sin cruces para las materias pendientes"
            >
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span>Auto-Cuadrar</span>
            </button>

            <button
              onClick={() => setValidationModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition cursor-pointer flex items-center gap-1.5"
            >
              <Info className="w-4 h-4 text-slate-600" />
              <span>Validar ({conflicts.total})</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
              title="Exportar datos en formato CSV"
            >
              <Download className="w-4 h-4 text-emerald-700" />
              <span>Exportar CSV</span>
            </button>

            <button
              onClick={handleExportXLSX}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-sm"
              title="Exportar en formato Microsoft Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4 text-white" />
              <span>Exportar Excel</span>
            </button>

            <button
              onClick={handleSaveAll}
              disabled={isSaving}
              className="px-4 py-1.5 rounded-xl bg-[#1f0533] hover:bg-[#340954] text-[#e5a800] font-black text-xs transition cursor-pointer flex items-center gap-1.5 shadow-md disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Guardando...' : `Guardar Cambios ${metricas.dirtyCount > 0 ? `(${metricas.dirtyCount})` : ''}`}</span>
            </button>
          </div>
        </div>

        {/* Fila de Filtros Combo Box: Sede, Escuela, Jornada, Carrera, Nivel */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 pt-1">
          {/* Sede */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>Sede</span>
            </label>
            <div className="relative">
              <select
                value={selectedSedeId}
                onChange={e => setSelectedSedeId(Number(e.target.value))}
                className="w-full appearance-none bg-white border border-slate-300 rounded-xl px-3 py-2 pr-8 text-xs sm:text-sm font-bold text-slate-800 shadow-2xs focus:outline-hidden focus:border-indigo-600 cursor-pointer"
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
          <div className="flex flex-col gap-1">
            <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
              <span>Escuela</span>
            </label>
            <div className="relative">
              <select
                value={selectedEscuelaId}
                onChange={e => setSelectedEscuelaId(e.target.value === 'TODAS' ? 'TODAS' : Number(e.target.value))}
                className="w-full appearance-none bg-white border border-slate-300 rounded-xl px-3 py-2 pr-8 text-xs sm:text-sm font-bold text-slate-800 shadow-2xs focus:outline-hidden focus:border-indigo-600 cursor-pointer"
              >
                <option value="TODAS">Todas las Escuelas</option>
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
          <div className="flex flex-col gap-1">
            <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-indigo-600" />
              <span>Jornada</span>
            </label>
            <div className="relative">
              <select
                value={selectedJornadaId}
                onChange={e => setSelectedJornadaId(e.target.value)}
                className="w-full appearance-none bg-white border border-slate-300 rounded-xl px-3 py-2 pr-8 text-xs sm:text-sm font-bold text-slate-800 shadow-2xs focus:outline-hidden focus:border-indigo-600 cursor-pointer"
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
          <div className="flex flex-col gap-1">
            <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-indigo-600" />
              <span>Carrera</span>
            </label>
            <div className="relative">
              <select
                value={selectedCarreraId}
                onChange={e => setSelectedCarreraId(e.target.value === 'TODAS' ? 'TODAS' : Number(e.target.value))}
                className="w-full appearance-none bg-white border border-slate-300 rounded-xl px-3 py-2 pr-8 text-xs sm:text-sm font-bold text-slate-800 shadow-2xs focus:outline-hidden focus:border-indigo-600 cursor-pointer"
              >
                <option value="TODAS">Todas las Carreras ({catalogos.carreras.length})</option>
                {catalogos.carreras.map(c => (
                  <option key={c.id_carrera} value={c.id_carrera}>
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

          {/* Nivel */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              <span>Nivel</span>
            </label>
            <div className="relative">
              <select
                value={selectedNivelId}
                onChange={e => setSelectedNivelId(e.target.value === 'TODOS' ? 'TODOS' : Number(e.target.value))}
                className="w-full appearance-none bg-white border border-slate-300 rounded-xl px-3 py-2 pr-8 text-xs sm:text-sm font-bold text-slate-800 shadow-2xs focus:outline-hidden focus:border-indigo-600 cursor-pointer"
              >
                <option value="TODOS">Todos los Niveles</option>
                {catalogos.niveles.map(n => (
                  <option key={n.id_nivel} value={n.id_nivel}>
                    {n.nombre}
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

        {/* Barra de Estado Rápido y Búsqueda */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="font-extrabold text-slate-800 flex items-center gap-1.5">
              <span>DEMANDA CARRERA:</span>
              <span className="font-mono font-black text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                {demandaEstimada} estudiantes
              </span>
            </div>
            <span className="text-slate-300">|</span>
            <div className="font-semibold text-slate-600">
              Total Materias: <b className="text-slate-900">{metricas.total}</b>
            </div>
            <span className="text-slate-300">|</span>
            <div className="font-semibold text-slate-600">
              Docentes Asignados: <b className="text-emerald-700">{metricas.conDocente}/{metricas.total}</b>
            </div>
            <span className="text-slate-300">|</span>
            <div className="font-semibold text-slate-600">
              Aulas Asignadas: <b className="text-indigo-700">{metricas.conAula}/{metricas.total}</b>
            </div>
          </div>

          {/* Input de búsqueda rápida */}
          <div className="relative min-w-[240px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar materia o docente..."
              className="w-full pl-8 pr-7 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-indigo-600 shadow-2xs"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* =========================================================================
          TABLA / MATRIZ DE CUADRE MANUAL CON COMBO BOX EN CADA COLUMNA
          (Exactamente los campos solicitados en la imagen)
      ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Cabecera de la tabla con barra de scroll horizontal y vertical inmovilizada */}
        <div className="overflow-auto max-h-[calc(100vh-270px)] min-h-[480px]">
          <table className="w-full text-left border-separate border-spacing-0 text-xs">
            <thead className="bg-[#1f0533] text-white text-[11px] font-black uppercase tracking-wider select-none shadow-sm">
              <tr className="divide-x divide-purple-900/60">
                <th className="py-3 px-3 min-w-[210px] w-[210px] max-w-[210px] sticky top-0 left-0 z-50 bg-[#1f0533] border-b-2 border-purple-800 border-r border-purple-900/80 shadow-xs">
                  Asignatura
                </th>
                <th className="py-3 px-3 min-w-[220px] w-[220px] max-w-[220px] sticky top-0 left-[210px] z-50 bg-[#1f0533] border-b-2 border-purple-800 border-r-2 border-purple-800 shadow-[3px_0_6px_-2px_rgba(0,0,0,0.35)]">
                  Docente
                </th>
                <th className="py-3 px-2 min-w-[95px] text-center sticky top-0 z-30 bg-[#1f0533] border-b-2 border-purple-800">
                  Nivel
                </th>
                <th className="py-3 px-2 min-w-[85px] text-center sticky top-0 z-30 bg-[#1f0533] border-b-2 border-purple-800">
                  Paralelo
                </th>
                <th className="py-3 px-2.5 min-w-[130px] sticky top-0 z-30 bg-[#1f0533] border-b-2 border-purple-800">
                  Jornada
                </th>
                <th className="py-3 px-2.5 min-w-[140px] sticky top-0 z-30 bg-[#1f0533] border-b-2 border-purple-800">
                  Bloque
                </th>
                <th className="py-3 px-2 min-w-[75px] text-center sticky top-0 z-30 bg-[#1f0533] border-b-2 border-purple-800">
                  Piso
                </th>
                <th className="py-3 px-2.5 min-w-[240px] sticky top-0 z-30 bg-[#1f0533] border-b-2 border-purple-800">
                  Aula / Lab.
                </th>
                <th className="py-3 px-2 min-w-[90px] text-center sticky top-0 z-30 bg-[#1f0533] border-b-2 border-purple-800">
                  Capacidad
                </th>
                <th className="py-3 px-2 min-w-[95px] text-center sticky top-0 z-30 bg-[#1f0533] border-b-2 border-purple-800">
                  N° Estudiantes
                </th>
                <th className="py-3 px-2.5 min-w-[150px] text-center sticky top-0 z-30 bg-[#1f0533] border-b-2 border-purple-800">
                  Aforo / Ocupación
                </th>
                <th className="py-3 px-2 min-w-[130px] text-center bg-purple-950/90 sticky top-0 z-30 border-b-2 border-purple-800">
                  Lunes
                </th>
                <th className="py-3 px-2 min-w-[130px] text-center bg-purple-950/90 sticky top-0 z-30 border-b-2 border-purple-800">
                  Martes
                </th>
                <th className="py-3 px-2 min-w-[130px] text-center bg-purple-950/90 sticky top-0 z-30 border-b-2 border-purple-800">
                  Miércoles
                </th>
                <th className="py-3 px-2 min-w-[130px] text-center bg-purple-950/90 sticky top-0 z-30 border-b-2 border-purple-800">
                  Jueves
                </th>
                <th className="py-3 px-2 min-w-[130px] text-center bg-purple-950/90 sticky top-0 z-30 border-b-2 border-purple-800">
                  Viernes
                </th>
                <th className="py-3 px-2 min-w-[130px] text-center bg-purple-950/80 sticky top-0 z-30 border-b-2 border-purple-800">
                  Sábado
                </th>
                <th className="py-3 px-2 min-w-[130px] text-center bg-purple-950/80 sticky top-0 z-30 border-b-2 border-purple-800">
                  Domingo
                </th>
                <th className="py-3 px-2 min-w-[110px] text-center sticky top-0 z-30 bg-[#1f0533] border-b-2 border-purple-800">
                  Fecha Inicio
                </th>
                <th className="py-3 px-2 min-w-[110px] text-center sticky top-0 z-30 bg-[#1f0533] border-b-2 border-purple-800">
                  Fecha Fin
                </th>
                <th className="py-3 px-2 min-w-[85px] text-center sticky top-0 z-30 bg-[#1f0533] border-b-2 border-purple-800">
                  Total Clases
                </th>
                <th className="py-3 px-2.5 min-w-[130px] text-center sticky top-0 z-30 bg-[#1f0533] border-b-2 border-purple-800">
                  Estado / Unificado
                </th>
                <th className="py-3 px-3 min-w-[130px] w-[130px] text-center sticky top-0 right-0 z-50 bg-[#1f0533] border-b-2 border-purple-800 border-l border-purple-900/80 shadow-[-3px_0_6px_-2px_rgba(0,0,0,0.2)]">
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={23} className="py-12 text-center text-slate-400">
                    <Layers className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-bold text-sm text-slate-700">No hay asignaturas que coincidan con los filtros</p>
                    <p className="text-xs text-slate-400 mt-1">Pruebe seleccionando "Todas las Carreras" o limpiando el texto de búsqueda.</p>
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, index) => {
                  const aula = aulas.find(a => a.id_aula_laboratorio === row.id_aula_laboratorio);
                  const capacidadAula = aula?.capacidad || 0;
                  const porcentajeOcupacion = capacidadAula > 0 ? (row.numero_estudiantes / capacidadAula) * 100 : 0;
                  const sobreAforo = capacidadAula > 0 && row.numero_estudiantes > capacidadAula;

                  // Aulas disponibles para el bloque seleccionado
                  const aulasFiltradas = aulas.filter(a => {
                    if (row.id_bloque) return a.id_bloque === row.id_bloque;
                    return true;
                  });

                  // Detectar si esta fila tiene algún conflicto de aula o docente
                  const hasAulaConflict = conflicts.aulaConflicts.some(c => c.rowIdA === row.id || c.rowIdB === row.id);
                  const hasDocenteConflict = conflicts.docenteConflicts.some(c => c.rowIdA === row.id || c.rowIdB === row.id);

                  // Color de fondo consistente para columnas inmovilizadas / congeladas (sticky)
                  const rowBg = row.isDirty
                    ? 'bg-amber-50 group-hover:bg-amber-100/90'
                    : index % 2 === 0
                    ? 'bg-white group-hover:bg-indigo-50/70'
                    : 'bg-slate-50 group-hover:bg-indigo-50/70';

                  return (
                    <tr
                      key={row.id}
                      className={`group hover:bg-indigo-50/40 transition-colors divide-x divide-slate-100 ${
                        index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                      } ${row.isDirty ? 'bg-amber-50/40' : ''}`}
                    >
                      {/* 1. Asignatura (INMOVILIZADO / STICKY IZQUIERDA) */}
                      <td className={`py-2 px-3 sticky left-0 z-20 font-black text-slate-900 border-r border-slate-200 min-w-[210px] w-[210px] max-w-[210px] ${rowBg}`}>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono font-black px-1.5 py-0.2 rounded bg-slate-100 text-slate-800 border border-slate-200 shrink-0">
                            {row.asignatura_codigo}
                          </span>
                          <span className="truncate max-w-[140px] uppercase text-xs font-black" title={row.asignatura_nombre}>
                            {row.asignatura_nombre}
                          </span>
                        </div>
                      </td>

                      {/* 2. Docente (INMOVILIZADO / STICKY IZQUIERDA A CONTINUACIÓN) */}
                      <td className={`py-1.5 px-2 sticky left-[210px] z-20 border-r-2 border-slate-300 shadow-[3px_0_6px_-2px_rgba(0,0,0,0.12)] min-w-[220px] w-[220px] max-w-[220px] ${
                        hasDocenteConflict ? 'bg-amber-100/95 ring-2 ring-amber-400 inset-0' : rowBg
                      }`}>
                        <div className="relative">
                          <select
                            value={row.id_docente || ''}
                            onChange={e => handleCellChange(row.id, 'id_docente', e.target.value ? Number(e.target.value) : null)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 pr-6 text-xs font-semibold text-slate-800 shadow-2xs focus:outline-hidden focus:border-indigo-600 cursor-pointer"
                          >
                            <option value="">-- Sin Docente --</option>
                            {(() => {
                              const targetCarreraId = (selectedCarreraId !== 'TODAS') ? selectedCarreraId : row.id_carrera;
                              const docsCarrera = catalogos.docentes.filter(d => {
                                // Solo docentes que pertenecen a la carrera seleccionada
                                if (getDocenteCarreraId(d) === targetCarreraId) return true;
                                // Mantener el docente asignado si ya estaba fijado previamente en esta fila
                                if (row.id_docente && d.id_docente === row.id_docente) return true;
                                return false;
                              });

                              if (docsCarrera.length === 0) {
                                return (
                                  <option value="" disabled>-- Sin docentes disponibles para esta carrera --</option>
                                );
                              }

                              return docsCarrera.map(d => {
                                const hrs = horasDocentesMap.get(d.id_docente) || 0;
                                return (
                                  <option key={d.id_docente} value={d.id_docente}>
                                    {d.apellidos} {d.nombres} ({hrs}h)
                                  </option>
                                );
                              });
                            })()}
                          </select>
                        </div>
                        {hasDocenteConflict && (
                          <div className="text-[9px] font-bold text-amber-800 flex items-center gap-1 mt-0.5">
                            <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
                            <span>Cruce de horario del docente</span>
                          </div>
                        )}
                      </td>

                      {/* 3. Nivel (Combo Box) */}
                      <td className="py-1.5 px-1.5 text-center">
                        <select
                          value={row.id_nivel || 1}
                          onChange={e => handleCellChange(row.id, 'id_nivel', Number(e.target.value))}
                          className="w-full bg-white border border-slate-200 rounded-lg px-1.5 py-1 text-xs font-bold text-center text-slate-800 shadow-2xs focus:outline-hidden focus:border-indigo-600 cursor-pointer"
                        >
                          {catalogos.niveles.map(n => (
                            <option key={n.id_nivel} value={n.id_nivel}>
                              {n.nombre}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* 4. Paralelo (Combo Box) */}
                      <td className="py-1.5 px-1.5 text-center">
                        <select
                          value={row.id_paralelo}
                          onChange={e => handleCellChange(row.id, 'id_paralelo', Number(e.target.value))}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-black text-center text-slate-800 shadow-2xs focus:outline-hidden focus:border-indigo-600 cursor-pointer"
                        >
                          {catalogos.paralelos.map(p => (
                            <option key={p.id_paralelo} value={p.id_paralelo}>
                              {p.codigo}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* 4. Jornada (Combo Box) */}
                      <td className="py-1.5 px-2">
                        <select
                          value={row.id_jornada}
                          onChange={e => handleCellChange(row.id, 'id_jornada', Number(e.target.value))}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-800 shadow-2xs focus:outline-hidden focus:border-indigo-600 cursor-pointer"
                        >
                          {catalogos.jornadas.map(j => (
                            <option key={j.id_jornada} value={j.id_jornada}>
                              {j.nombre}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* 5. Bloque (Combo Box) */}
                      <td className="py-1.5 px-2">
                        <select
                          value={row.id_bloque || ''}
                          onChange={e => handleCellChange(row.id, 'id_bloque', e.target.value ? Number(e.target.value) : null)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-800 shadow-2xs focus:outline-hidden focus:border-indigo-600 cursor-pointer"
                        >
                          <option value="">-- Sin Bloque --</option>
                          {catalogos.bloques.map(b => (
                            <option key={b.id_bloque} value={b.id_bloque}>
                              {b.nombre}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* 6. Piso (Combo Box / Badge) */}
                      <td className="py-1.5 px-1.5 text-center">
                        <span className="inline-block px-2 py-1 rounded bg-slate-100 text-slate-800 font-mono font-bold text-xs">
                          {row.id_piso ? `Piso ${row.id_piso}` : 'PB'}
                        </span>
                      </td>

                      {/* 7. Aula / Lab. (Combo Box con Capacidad, Disponible en Verde y Ocupado en Rojo) */}
                      <td className={`py-1.5 px-2 ${hasAulaConflict ? 'bg-rose-100/60 ring-2 ring-rose-400 inset-0' : ''}`}>
                        <AulaComboBox
                          value={row.id_aula_laboratorio}
                          aulas={aulasFiltradas}
                          currentRow={row}
                          allRows={rows}
                          hasConflict={hasAulaConflict}
                          onChange={aulaId => handleCellChange(row.id, 'id_aula_laboratorio', aulaId)}
                          onOccupiedAlert={msg => showToast(msg, 'error')}
                        />
                        {hasAulaConflict && (
                          <div className="text-[9px] font-bold text-rose-800 flex items-center gap-1 mt-0.5">
                            <AlertCircle className="w-2.5 h-2.5 shrink-0" />
                            <span>Aula ocupada a esta misma hora</span>
                          </div>
                        )}
                      </td>

                      {/* 8. Capacidad del aula (Display) */}
                      <td className="py-2 px-2 text-center font-mono font-black text-xs text-slate-700">
                        {capacidadAula > 0 ? `${capacidadAula} est.` : '-'}
                      </td>

                      {/* 9. Número de estudiantes (Input numérico) */}
                      <td className="py-1.5 px-1.5 text-center">
                        <input
                          type="number"
                          min={1}
                          max={150}
                          value={row.numero_estudiantes}
                          onChange={e => handleCellChange(row.id, 'numero_estudiantes', Number(e.target.value) || 0)}
                          className={`w-16 px-1.5 py-1 text-center font-mono font-bold text-xs rounded-lg border focus:outline-hidden focus:border-indigo-600 shadow-2xs ${
                            sobreAforo ? 'border-rose-400 bg-rose-50 text-rose-900' : 'border-slate-200 bg-white text-slate-800'
                          }`}
                        />
                      </td>

                      {/* 10. Aforo / Ocupación (Barra de progreso y estado) */}
                      <td className="py-2 px-2.5 text-center">
                        {capacidadAula > 0 ? (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[10px] font-mono font-bold">
                              <span className={sobreAforo ? 'text-rose-700 font-black' : 'text-slate-700'}>
                                {row.numero_estudiantes}/{capacidadAula}
                              </span>
                              <span className={sobreAforo ? 'text-rose-700 font-black' : 'text-emerald-700'}>
                                {porcentajeOcupacion.toFixed(0)}%
                              </span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  sobreAforo
                                    ? 'bg-rose-600'
                                    : porcentajeOcupacion > 85
                                    ? 'bg-amber-500'
                                    : 'bg-emerald-500'
                                }`}
                                style={{ width: `${Math.min(porcentajeOcupacion, 100)}%` }}
                              />
                            </div>
                            {sobreAforo ? (
                              <button
                                type="button"
                                onClick={() => {
                                  const curAula = aulas.find(a => a.id_aula_laboratorio === row.id_aula_laboratorio);
                                  if (curAula) {
                                    const recs = getAulasRecomendadas(
                                      aulas,
                                      row.numero_estudiantes,
                                      curAula.id_aula_laboratorio,
                                      (other) => getAulaDisponibilidad(other, row, rows),
                                      { id_bloque: row.id_bloque }
                                    );
                                    setTableCapacidadAlert({
                                      isOpen: true,
                                      mode: 'INSUFICIENTE',
                                      rowId: row.id,
                                      aula: curAula,
                                      numeroEstudiantes: row.numero_estudiantes,
                                      recomendadas: recs
                                    });
                                  }
                                }}
                                className="inline-flex items-center gap-1 text-[9px] font-black text-rose-700 bg-rose-100 hover:bg-rose-200 border border-rose-300 px-1.5 py-0.5 rounded cursor-pointer uppercase transition"
                                title="Capacidad insuficiente. Clic para ver aulas con aforo suficiente"
                              >
                                <ShieldAlert className="w-2.5 h-2.5 shrink-0" />
                                <span>⛔ Sobrecupo (+{row.numero_estudiantes - capacidadAula})</span>
                              </button>
                            ) : (capacidadAula - row.numero_estudiantes >= 5) ? (
                              <button
                                type="button"
                                onClick={() => {
                                  const curAula = aulas.find(a => a.id_aula_laboratorio === row.id_aula_laboratorio);
                                  if (curAula) {
                                    const recs = getAulasRecomendadas(
                                      aulas,
                                      row.numero_estudiantes,
                                      curAula.id_aula_laboratorio,
                                      (other) => getAulaDisponibilidad(other, row, rows),
                                      { id_bloque: row.id_bloque, maxCapacidadFiltro: curAula.capacidad }
                                    );
                                    setTableCapacidadAlert({
                                      isOpen: true,
                                      mode: 'RECOMENDACION',
                                      rowId: row.id,
                                      aula: curAula,
                                      numeroEstudiantes: row.numero_estudiantes,
                                      recomendadas: recs
                                    });
                                  }
                                }}
                                className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-1.5 py-0.5 rounded cursor-pointer transition shadow-2xs"
                                title="Capacidad desaprovechada. Clic para ver aulas recomendadas que se ajustan mejor"
                              >
                                <Sparkles className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                                <span>Aulas recomendadas</span>
                              </button>
                            ) : null}
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-400 italic">
                            Sin aula
                          </span>
                        )}
                      </td>

                      {/* 11 - 17. Días de la semana con Combo Box */}
                      {(['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'] as const).map(day => {
                        const dayValue = row[day];
                        const isDayConflict = (hasAulaConflict || hasDocenteConflict) && Boolean(dayValue);

                        return (
                          <td key={day} className={`py-1 px-1.5 ${isDayConflict ? 'bg-amber-100/50' : ''}`}>
                            <select
                              value={dayValue}
                              onChange={e => handleCellChange(row.id, day, e.target.value)}
                              className={`w-full text-[11px] font-semibold rounded-lg px-1.5 py-1 shadow-2xs border cursor-pointer focus:outline-hidden focus:border-indigo-600 ${
                                dayValue
                                  ? 'bg-indigo-50 border-indigo-300 text-indigo-950 font-bold'
                                  : 'bg-white border-slate-200 text-slate-400'
                              }`}
                            >
                              {TIME_SLOT_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </td>
                        );
                      })}

                      {/* 18. Fecha inicio */}
                      <td className="py-1 px-1.5 text-center">
                        <input
                          type="date"
                          value={row.fecha_inicio}
                          onChange={e => handleCellChange(row.id, 'fecha_inicio', e.target.value)}
                          className="w-24 text-[11px] font-mono px-1 py-1 rounded border border-slate-200 text-slate-700 bg-white"
                        />
                      </td>

                      {/* 19. Fecha fin */}
                      <td className="py-1 px-1.5 text-center">
                        <input
                          type="date"
                          value={row.fecha_fin}
                          onChange={e => handleCellChange(row.id, 'fecha_fin', e.target.value)}
                          className="w-24 text-[11px] font-mono px-1 py-1 rounded border border-slate-200 text-slate-700 bg-white"
                        />
                      </td>

                      {/* 20. Total clases */}
                      <td className="py-1.5 px-1.5 text-center">
                        <input
                          type="number"
                          value={row.total_clases}
                          onChange={e => handleCellChange(row.id, 'total_clases', Number(e.target.value) || 0)}
                          className="w-14 text-center font-mono font-bold text-xs px-1 py-1 rounded border border-slate-200 bg-white text-slate-800"
                        />
                      </td>

                      {/* 21. Estado / Unificado (Combo Box) */}
                      <td className="py-1.5 px-2 text-center">
                        <select
                          value={row.estado}
                          onChange={e => handleCellChange(row.id, 'estado', e.target.value as any)}
                          className={`w-full text-[11px] font-black uppercase rounded-lg px-2 py-1 shadow-2xs border cursor-pointer focus:outline-hidden ${
                            row.estado === 'ASIGNADO'
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                              : row.estado === 'EN CUADRE'
                              ? 'bg-amber-50 border-amber-300 text-amber-800'
                              : row.estado === 'UNIFICADO'
                              ? 'bg-purple-50 border-purple-300 text-purple-800'
                              : 'bg-slate-100 border-slate-300 text-slate-700'
                          }`}
                        >
                          {ESTADO_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* 22. Acciones (STICKY DERECHA) */}
                      <td className={`py-1.5 px-2 sticky right-0 z-20 border-l border-slate-200 shadow-[-3px_0_6px_-2px_rgba(0,0,0,0.08)] text-center min-w-[130px] w-[130px] ${rowBg}`}>
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleSaveRow(row)}
                            disabled={isSaving}
                            className={`p-1.5 rounded-lg transition cursor-pointer ${
                              row.isDirty
                                ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                            title="Guardar esta fila en base de datos"
                          >
                            <Save className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDuplicateRow(row)}
                            className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition cursor-pointer"
                            title="Duplicar para otro paralelo"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleClearRow(row.id)}
                            className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition cursor-pointer"
                            title="Limpiar asignación"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteRow(row)}
                            className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition cursor-pointer"
                            title="Eliminar fila"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer de resumen inferior */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-4">
            <span>
              Mostrando <b>{filteredRows.length}</b> de <b>{rows.length}</b> asignaturas registradas
            </span>
            {metricas.dirtyCount > 0 && (
              <span className="font-bold text-amber-700 flex items-center gap-1 bg-amber-100 px-2 py-0.5 rounded-full">
                <AlertCircle className="w-3.5 h-3.5" />
                {metricas.dirtyCount} fila(s) con cambios pendientes de guardar
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (confirm('¿Desea restablecer todas las asignaciones a los valores de la base de datos?')) {
                  localStorage.removeItem('isuj_asignacion_docentes_aulas_grid');
                  initializeRows();
                  showToast('Grilla restablecida desde base de datos.');
                }
              }}
              className="text-slate-500 hover:text-slate-800 flex items-center gap-1 font-semibold cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Restablecer inicial</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal Inspector de Cruces y Validación */}
      {validationModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="bg-[#1f0533] text-white p-4 flex items-center justify-between border-b-2 border-[#e5a800]">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-[#e5a800]" />
                <h3 className="font-black text-sm uppercase tracking-wide">
                  Inspector de Cruces de Horario y Aforos
                </h3>
              </div>
              <button onClick={() => setValidationModalOpen(false)} className="text-white/70 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-4">
              {conflicts.total === 0 ? (
                <div className="p-8 text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h4 className="font-black text-slate-900 text-base">¡Cuadre Perfecto! Sin Cruces Detectados</h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Todas las materias tienen horarios asignados sin solapamientos entre docentes ni sobreocupación de aulas.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 font-medium">
                    Se encontraron <b>{conflicts.total} conflicto(s)</b>. Corrija los días y franjas horarias con los combo box correspondientes:
                  </div>

                  {conflicts.aulaConflicts.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="text-xs font-black text-rose-900 uppercase tracking-wide flex items-center gap-1.5">
                        <DoorOpen className="w-4 h-4 text-rose-600" />
                        <span>Cruces de Aula ({conflicts.aulaConflicts.length})</span>
                      </h5>
                      <div className="space-y-1.5">
                        {conflicts.aulaConflicts.map((c, idx) => (
                          <div key={idx} className="p-2.5 rounded-lg border border-rose-200 bg-rose-50 text-xs flex items-start justify-between gap-2">
                            <div>
                              <div className="font-black text-rose-950">
                                {c.aulaNombre} • {c.dia} ({c.hora})
                              </div>
                              <div className="text-rose-800 text-[11px] mt-0.5">
                                Solapamiento entre: <b>"{c.asigA}"</b> y <b>"{c.asigB}"</b>
                              </div>
                            </div>
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-rose-200 text-rose-900">
                              Aula Duplicada
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {conflicts.docenteConflicts.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <h5 className="text-xs font-black text-amber-900 uppercase tracking-wide flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-amber-600" />
                        <span>Cruces de Docente ({conflicts.docenteConflicts.length})</span>
                      </h5>
                      <div className="space-y-1.5">
                        {conflicts.docenteConflicts.map((c, idx) => (
                          <div key={idx} className="p-2.5 rounded-lg border border-amber-200 bg-amber-50 text-xs flex items-start justify-between gap-2">
                            <div>
                              <div className="font-black text-amber-950">
                                {c.docenteNombre} • {c.dia} ({c.hora})
                              </div>
                              <div className="text-amber-800 text-[11px] mt-0.5">
                                Asignado simultáneamente en: <b>"{c.asigA}"</b> y <b>"{c.asigB}"</b>
                              </div>
                            </div>
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-200 text-amber-900">
                              Docente en 2 clases
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setValidationModalOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition cursor-pointer"
              >
                Cerrar Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Global de Aforo / Alerta y Recomendación de Capacidad para la Tabla */}
      {tableCapacidadAlert && (
        <CapacidadAlertModal
          isOpen={tableCapacidadAlert.isOpen}
          mode={tableCapacidadAlert.mode}
          aulaSeleccionada={tableCapacidadAlert.aula}
          numeroEstudiantes={tableCapacidadAlert.numeroEstudiantes}
          aulasRecomendadas={tableCapacidadAlert.recomendadas}
          onClose={() => setTableCapacidadAlert(null)}
          onSelectAula={(newAulaId) => {
            handleCellChange(tableCapacidadAlert.rowId, 'id_aula_laboratorio', newAulaId);
            setTableCapacidadAlert(null);
          }}
          onKeepCurrent={() => {
            setTableCapacidadAlert(null);
          }}
        />
      )}
    </div>
  );
};
