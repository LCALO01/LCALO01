import React, { useState, useEffect } from 'react';
import { Catalogos, AulaLaboratorio, AulaRecomendada, PlanificacionCompleta, ValidationCrucesResult } from '../types.ts';
import { ApiClient } from '../controllers/apiClient.ts';
import { validarAsignacionEnTiempoReal } from '../utils/conflictDetector.ts';
import { CapacidadAlertModal } from './CapacidadAlertModal.tsx';
import { getAulasRecomendadas, playCapacityAlertSound } from '../utils/classroomRecommendation.ts';
import { 
  X, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Users, 
  Calendar, 
  Building, 
  GraduationCap, 
  BookOpen, 
  Layers,
  Sparkles,
  HelpCircle,
  AlertOctagon,
  ShieldAlert,
  DoorOpen
} from 'lucide-react';

interface AsignacionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  catalogos: Catalogos;
  aulas: AulaLaboratorio[];
  initialData?: PlanificacionCompleta | null;
  planificaciones?: PlanificacionCompleta[];
}

export const AsignacionModal: React.FC<AsignacionModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  catalogos,
  aulas,
  initialData,
  planificaciones = []
}) => {
  // Form states
  const [sedeId, setSedeId] = useState<number>(initialData?.id_sede || 1);
  const [escuelaId, setEscuelaId] = useState<number>(initialData?.id_escuela || 1);
  const [bloqueId, setBloqueId] = useState<number>(initialData?.id_bloque || 1);
  const [pisoSelected, setPisoSelected] = useState<number>(initialData?.aula_piso || 1);
  const [aulaId, setAulaId] = useState<number>(initialData?.id_aula_laboratorio || 1);
  const [carreraId, setCarreraId] = useState<number>(initialData?.id_carrera || 1);
  const [asignaturaId, setAsignaturaId] = useState<number>(initialData?.id_asignatura || 1);
  const [docenteId, setDocenteId] = useState<number>(initialData?.id_docente || 1);
  const [nivelId, setNivelId] = useState<number>(initialData?.id_nivel || 1);
  const [paraleloId, setParaleloId] = useState<number>(initialData?.id_paralelo || 1);
  const [jornadaId, setJornadaId] = useState<number>(initialData?.id_jornada || 1);
  const [periodoId, setPeriodoId] = useState<number>(initialData?.id_periodo || 1);
  const [diaId, setDiaId] = useState<number>(initialData?.id_dia || 1);
  const [horaInicio, setHoraInicio] = useState<string>(initialData?.hora_inicio || '08:00');
  const [horaFin, setHoraFin] = useState<string>(initialData?.hora_fin || '12:00');
  const [modalidad, setModalidad] = useState<string>(initialData?.modalidad || 'PRESENCIAL');
  const [numeroEstudiantes, setNumeroEstudiantes] = useState<number>(initialData?.numero_estudiantes || 25);
  const [observaciones, setObservaciones] = useState<string>(initialData?.observaciones || '');

  // Curso unificado fields
  const [cursoUnificado, setCursoUnificado] = useState<boolean>(initialData?.curso_unificado === 1);
  const [unificadaCarrera, setUnificadaCarrera] = useState<string>(initialData?.unificada_carrera || '');
  const [unificadaNivel, setUnificadaNivel] = useState<string>(initialData?.unificada_nivel || 'NIVEL 1');
  const [unificadaCodigo, setUnificadaCodigo] = useState<string>(initialData?.unificada_codigo || '');
  const [unificadaAsignatura, setUnificadaAsignatura] = useState<string>(initialData?.unificada_asignatura || '');

  // Validation feedback state
  const [validating, setValidating] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [validationResult, setValidationResult] = useState<ValidationCrucesResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [capacidadModal, setCapacidadModal] = useState<{
    isOpen: boolean;
    mode: 'INSUFICIENTE' | 'RECOMENDACION';
    aula: AulaLaboratorio;
    numeroEstudiantes: number;
    recomendadas: AulaRecomendada[];
  } | null>(null);

  // Sync state whenever modal opens or initialData changes
  useEffect(() => {
    if (isOpen) {
      setSedeId(initialData?.id_sede || 1);
      setEscuelaId(initialData?.id_escuela || 1);
      setBloqueId(initialData?.id_bloque || 1);
      setPisoSelected(initialData?.aula_piso || 1);
      setAulaId(initialData?.id_aula_laboratorio || 1);
      setCarreraId(initialData?.id_carrera || 1);
      setAsignaturaId(initialData?.id_asignatura || 1);
      setDocenteId(initialData?.id_docente || 1);
      setNivelId(initialData?.id_nivel || 1);
      setParaleloId(initialData?.id_paralelo || 1);
      setJornadaId(initialData?.id_jornada || 1);
      setPeriodoId(initialData?.id_periodo || 1);
      setDiaId(initialData?.id_dia || 1);
      setHoraInicio(initialData?.hora_inicio || '08:00');
      setHoraFin(initialData?.hora_fin || '12:00');
      setModalidad(initialData?.modalidad || 'PRESENCIAL');
      setNumeroEstudiantes(initialData?.numero_estudiantes || 25);
      setObservaciones(initialData?.observaciones || '');
      setCursoUnificado(initialData?.curso_unificado === 1);
      setUnificadaCarrera(initialData?.unificada_carrera || '');
      setUnificadaNivel(initialData?.unificada_nivel || 'NIVEL 1');
      setUnificadaCodigo(initialData?.unificada_codigo || '');
      setUnificadaAsignatura(initialData?.unificada_asignatura || '');
      setValidationResult(null);
      setErrorMessage(null);
    }
  }, [isOpen, initialData]);

  // Filter aulas for selected bloque and piso
  const selectedBloque = catalogos.bloques.find(b => b.id_bloque === bloqueId);
  const availablePisos = selectedBloque ? Array.from({ length: selectedBloque.numero_pisos }, (_, i) => i + 1) : [1];

  const filteredAulas = aulas.filter(a => a.id_bloque === bloqueId && a.piso === pisoSelected);

  // Selected aula object
  const currentAula = aulas.find(a => a.id_aula_laboratorio === aulaId) || filteredAulas[0];

  // Auto-adjust aula if not in current block/floor
  useEffect(() => {
    if (filteredAulas.length > 0 && !filteredAulas.some(a => a.id_aula_laboratorio === aulaId)) {
      setAulaId(filteredAulas[0].id_aula_laboratorio);
    }
  }, [bloqueId, pisoSelected]);

  // Selected asignatura and docente
  const currentAsignatura = catalogos.asignaturas.find(a => a.id_asignatura === asignaturaId);
  const currentDocente = catalogos.docentes.find(d => d.id_docente === docenteId);

  // Check capacity oversubscription live
  const hasSobrecupo = currentAula ? numeroEstudiantes > currentAula.capacidad : false;

  // Real-time conflict validation state
  const [realtimeConflict, setRealtimeConflict] = useState<{
    valido: boolean;
    conflictoDocente: boolean;
    conflictoAula: boolean;
    mensajeDocente?: string;
    mensajeAula?: string;
    planDocenteEnConflicto?: PlanificacionCompleta;
    planAulaEnConflicto?: PlanificacionCompleta;
  } | null>(null);

  // Instant in-memory check + debounced server check
  useEffect(() => {
    if (!isOpen) return;

    // 1. Instantaneous client-side conflict check (0ms)
    const clientCheck = validarAsignacionEnTiempoReal({
      id_aula_laboratorio: aulaId,
      id_docente: docenteId,
      id_asignatura: asignaturaId,
      id_dia: diaId,
      hora_inicio: horaInicio,
      hora_fin: horaFin,
      id_periodo: periodoId,
      curso_unificado: cursoUnificado ? 1 : 0,
      unificada_codigo: unificadaCodigo,
      excludePlanId: initialData?.id_planificacion
    }, planificaciones);

    setRealtimeConflict(clientCheck);

    // 2. Debounced server check (covers holidays, database state)
    const timer = setTimeout(() => {
      handleValidate();
    }, 300);

    return () => clearTimeout(timer);
  }, [
    isOpen, 
    aulaId, 
    docenteId, 
    asignaturaId, 
    diaId, 
    horaInicio, 
    horaFin, 
    periodoId, 
    numeroEstudiantes, 
    cursoUnificado, 
    unificadaCodigo, 
    planificaciones
  ]);

  // Real-time conflict validation
  const handleValidate = async () => {
    setValidating(true);
    setErrorMessage(null);
    try {
      const result = await ApiClient.validarCruces({
        id_aula_laboratorio: aulaId,
        id_docente: docenteId,
        id_asignatura: asignaturaId,
        id_dia: diaId,
        hora_inicio: horaInicio,
        hora_fin: horaFin,
        id_periodo: periodoId,
        numero_estudiantes: numeroEstudiantes,
        excludePlanId: initialData?.id_planificacion
      });
      setValidationResult(result);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setValidating(false);
    }
  };

  const handleSelectAulaChange = (newAulaId: number) => {
    const chosenAula = aulas.find(a => a.id_aula_laboratorio === newAulaId);
    if (!chosenAula) {
      setAulaId(newAulaId);
      return;
    }

    // 1. REGLA 1: Si la capacidad del aula es menor al número de estudiantes
    // Debe generar una alerta y NO permitir el ingreso
    if (chosenAula.capacidad < Number(numeroEstudiantes)) {
      playCapacityAlertSound();
      const recs = getAulasRecomendadas(aulas, Number(numeroEstudiantes), chosenAula.id_aula_laboratorio);
      setCapacidadModal({
        isOpen: true,
        mode: 'INSUFICIENTE',
        aula: chosenAula,
        numeroEstudiantes: Number(numeroEstudiantes),
        recomendadas: recs
      });
      // No actualizar aulaId -> ingreso no permitido
      return;
    }

    // 2. REGLA 2: Si la capacidad del aula es mayor al número de estudiantes
    // Ejemplo si el aula es de capacidad 30 y el número de estudiantes es 10 entonces debe lanzar una alerta y listar las aulas apropiadas que ajuste de acuerdo a las capacidades.
    const diferencia = chosenAula.capacidad - Number(numeroEstudiantes);
    const ratioOcupacion = Number(numeroEstudiantes) / chosenAula.capacidad;
    const recsAjustadas = getAulasRecomendadas(
      aulas,
      Number(numeroEstudiantes),
      chosenAula.id_aula_laboratorio,
      undefined,
      { maxCapacidadFiltro: chosenAula.capacidad }
    );

    if ((diferencia >= 5 || ratioOcupacion < 0.8) && recsAjustadas.length > 0) {
      setAulaId(newAulaId);
      setCapacidadModal({
        isOpen: true,
        mode: 'RECOMENDACION',
        aula: chosenAula,
        numeroEstudiantes: Number(numeroEstudiantes),
        recomendadas: recsAjustadas
      });
      return;
    }

    setAulaId(newAulaId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMessage(null);

    // REGLA 1: Si capacidad del aula < número de estudiantes -> Alerta y NO permitir ingreso
    if (currentAula && currentAula.capacidad < Number(numeroEstudiantes)) {
      playCapacityAlertSound();
      setErrorMessage(`⛔ Capacidad insuficiente (Ingreso no permitido): El aula '${currentAula.nombre}' tiene capacidad para ${currentAula.capacidad} estudiantes, pero se registraron ${numeroEstudiantes}. Por favor seleccione un aula con mayor aforo.`);
      setSaving(false);
      return;
    }

    const payload = {
      id_sede: sedeId,
      id_escuela: escuelaId,
      id_carrera: carreraId,
      id_asignatura: asignaturaId,
      id_docente: docenteId,
      id_nivel: nivelId,
      id_paralelo: paraleloId,
      id_jornada: jornadaId,
      id_bloque: bloqueId,
      id_aula_laboratorio: aulaId,
      id_periodo: periodoId,
      numero_estudiantes: Number(numeroEstudiantes),
      curso_unificado: cursoUnificado ? 1 : 0,
      unificada_carrera: cursoUnificado ? unificadaCarrera : null,
      unificada_nivel: cursoUnificado ? unificadaNivel : null,
      unificada_codigo: cursoUnificado ? unificadaCodigo : null,
      unificada_asignatura: cursoUnificado ? unificadaAsignatura : null,
      total_clases: 16,
      observaciones,
      estado: 'ACTIVO',
      id_dia: diaId,
      hora_inicio: horaInicio,
      hora_fin: horaFin,
      modalidad
    };

    try {
      if (initialData?.id_planificacion) {
        await ApiClient.updatePlanificacion(initialData.id_planificacion, payload);
      } else {
        await ApiClient.createPlanificacion(payload);
      }
      onSaved();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const selectedDia = catalogos.diasSemana.find(d => d.id_dia === diaId);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl xl:max-w-7xl w-full max-h-[96vh] flex flex-col border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header Compacto y Elegante */}
        <div className="bg-slate-900 text-white px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0 shadow-2xs">
              <Layers className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white leading-tight">
                  {initialData ? 'Modificar Asignación' : 'Nueva Asignación de Aula'}
                </h2>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-slate-800 text-[11px] font-mono font-medium text-slate-300 border border-slate-700">
                  PER-2026-1
                </span>
              </div>
              <p className="text-[11px] text-slate-300 hidden xs:block">
                Validación de Capacidad, Disponibilidad y Cruces de Horario
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg transition hover:bg-slate-800 cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content form con scroll interno y footer fijo */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          
          {/* Cuerpo con scroll optimizado */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-3.5">
            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Error al procesar: </span>
                  {errorMessage}
                </div>
              </div>
            )}

            {/* ALERTA DE CONFLICTO EN TIEMPO REAL */}
            {realtimeConflict && !realtimeConflict.valido && (
              <div className="p-3.5 bg-rose-50 border-2 border-rose-500 rounded-xl text-xs space-y-2 shadow-md animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-black text-rose-900 uppercase tracking-wide text-xs">
                    <AlertTriangle className="w-4 h-4 text-rose-600 animate-pulse" />
                    <span>🚨 Conflicto de Horario Detectado en Tiempo Real</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-600 text-white uppercase">
                    Incompatible
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {realtimeConflict.conflictoDocente && (
                    <div className="p-2.5 bg-white rounded-lg border border-rose-300 text-rose-950 shadow-2xs">
                      <div className="font-bold flex items-center gap-1.5 text-rose-900 text-xs mb-1">
                        <span>👨‍🏫 Cruce de Docente</span>
                        <span className="text-[9px] bg-rose-100 text-rose-800 px-1.5 py-0.2 rounded font-mono">2 aulas a la vez</span>
                      </div>
                      <p className="text-[11.5px] leading-relaxed text-rose-800">
                        {realtimeConflict.mensajeDocente}
                      </p>
                    </div>
                  )}

                  {realtimeConflict.conflictoAula && (
                    <div className="p-2.5 bg-white rounded-lg border border-rose-300 text-rose-950 shadow-2xs">
                      <div className="font-bold flex items-center gap-1.5 text-rose-900 text-xs mb-1">
                        <span>🏫 Cruce de Aula</span>
                        <span className="text-[9px] bg-rose-100 text-rose-800 px-1.5 py-0.2 rounded font-mono">2 asignaturas a la vez</span>
                      </div>
                      <p className="text-[11.5px] leading-relaxed text-rose-800">
                        {realtimeConflict.mensajeAula}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Layout de 2 columnas en pantallas amplias */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
              
              {/* COLUMNA IZQUIERDA: Ubicación física y Datos Académicos */}
              <div className="space-y-3.5">
                
                {/* SECCIÓN 1: UBICACIÓN FÍSICA Y ESPACIO */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-2.5">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Building className="w-4 h-4 text-indigo-600" />
                      1. Sede, Bloque, Piso y Aula
                    </span>
                    <div className="flex items-center gap-1.5">
                      <label className="text-[11px] font-bold text-slate-500">Sede:</label>
                      <select
                        value={sedeId}
                        onChange={e => setSedeId(Number(e.target.value))}
                        className="text-[11px] font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                      >
                        {catalogos.sedes.map(s => (
                          <option key={s.id_sede} value={s.id_sede}>
                            {s.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Bloque</label>
                      <select
                        value={bloqueId}
                        onChange={e => {
                          setBloqueId(Number(e.target.value));
                          setPisoSelected(1);
                        }}
                        className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      >
                        {catalogos.bloques.map(b => (
                          <option key={b.id_bloque} value={b.id_bloque}>
                            {b.codigo} - {b.nombre}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Piso</label>
                      <select
                        value={pisoSelected}
                        onChange={e => setPisoSelected(Number(e.target.value))}
                        className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      >
                        {availablePisos.map(p => (
                          <option key={p} value={p}>
                            Piso {p}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                        <span>Aula / Laboratorio</span>
                        {realtimeConflict?.conflictoAula && (
                          <span className="text-[10px] text-rose-600 font-bold flex items-center gap-0.5">
                            <AlertTriangle className="w-3 h-3" /> Cruce
                          </span>
                        )}
                      </label>
                      <select
                        value={aulaId}
                        onChange={e => handleSelectAulaChange(Number(e.target.value))}
                        className={`w-full text-xs bg-white border rounded-lg p-2 focus:outline-hidden transition ${
                          realtimeConflict?.conflictoAula
                            ? 'border-2 border-rose-500 bg-rose-50 text-rose-950 font-bold ring-2 ring-rose-200'
                            : 'border-slate-300 focus:ring-2 focus:ring-indigo-500'
                        }`}
                      >
                        {filteredAulas.map(a => (
                          <option key={a.id_aula_laboratorio} value={a.id_aula_laboratorio}>
                            {a.codigo} - {a.nombre} ({a.tipo})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">N° Estudiantes</label>
                      <input
                        type="number"
                        min="1"
                        max="60"
                        value={numeroEstudiantes}
                        onChange={e => setNumeroEstudiantes(Number(e.target.value))}
                        className={`w-full text-xs bg-white border rounded-lg p-2 focus:outline-hidden focus:ring-2 ${
                          hasSobrecupo
                            ? 'border-rose-400 bg-rose-50 text-rose-900 focus:ring-rose-500 font-bold'
                            : 'border-slate-300 focus:ring-indigo-500'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Live Room Specs Card */}
                  {currentAula && (
                    <>
                      <div className="p-2 bg-white rounded-lg border border-slate-200 text-xs flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900">{currentAula.nombre}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            currentAula.tipo === 'LABORATORIO' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {currentAula.tipo}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            currentAula.estado === 'DISPONIBLE' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {currentAula.estado}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-600">
                            Capacidad Máxima: <strong className="text-slate-900">{currentAula.capacidad} puestos</strong>
                          </span>
                          <span className={`font-semibold ${hasSobrecupo ? 'text-rose-600 font-bold' : 'text-emerald-600'}`}>
                            {hasSobrecupo ? '⚠️ Sobrecupo (' + (numeroEstudiantes - currentAula.capacidad) + ' excedentes)' : '✅ Ocupación ' + Math.round((numeroEstudiantes / currentAula.capacidad) * 100) + '%'}
                          </span>
                        </div>
                      </div>

                      {/* Banner de Capacidad Insuficiente (Ingreso no permitido) */}
                      {hasSobrecupo && (
                        <div className="p-2.5 bg-rose-50 border border-rose-300 rounded-lg text-xs text-rose-950 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2 font-bold">
                            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                            <span>⛔ Ingreso No Permitido: El aula ({currentAula.capacidad} puestos) no abastece a {numeroEstudiantes} estudiantes.</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              playCapacityAlertSound();
                              const recs = getAulasRecomendadas(aulas, numeroEstudiantes, currentAula.id_aula_laboratorio);
                              setCapacidadModal({
                                isOpen: true,
                                mode: 'INSUFICIENTE',
                                aula: currentAula,
                                numeroEstudiantes,
                                recomendadas: recs
                              });
                            }}
                            className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 shadow-2xs"
                          >
                            <DoorOpen className="w-3.5 h-3.5" />
                            <span>Buscar Aulas con Capacidad</span>
                          </button>
                        </div>
                      )}

                      {/* Banner de Subutilización (Aulas recomendadas disponibles) */}
                      {!hasSobrecupo && (currentAula.capacidad - numeroEstudiantes >= 5) && (
                        <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-lg text-xs text-amber-950 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2 font-bold">
                            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                            <span>💡 Capacidad holgada: {currentAula.capacidad - numeroEstudiantes} cupos desaprovechados ({Math.round((numeroEstudiantes / currentAula.capacidad) * 100)}% ocupación).</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const recs = getAulasRecomendadas(aulas, numeroEstudiantes, currentAula.id_aula_laboratorio, undefined, { maxCapacidadFiltro: currentAula.capacidad });
                              setCapacidadModal({
                                isOpen: true,
                                mode: 'RECOMENDACION',
                                aula: currentAula,
                                numeroEstudiantes,
                                recomendadas: recs
                              });
                            }}
                            className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 shadow-2xs"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Ver Aulas Recomendadas</span>
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* SECCIÓN 2: DATOS ACADÉMICOS Y DOCENTE */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-2.5">
                  <div className="border-b border-slate-200 pb-1.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4 text-indigo-600" />
                      2. Carrera, Asignatura, Docente y Nivel
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Carrera Académica</label>
                      <select
                        value={carreraId}
                        onChange={e => setCarreraId(Number(e.target.value))}
                        className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      >
                        {catalogos.carreras.map(c => (
                          <option key={c.id_carrera} value={c.id_carrera}>
                            {c.codigo} - {c.nombre} ({c.modalidad})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Nivel & Paralelo</label>
                      <div className="grid grid-cols-2 gap-1.5">
                        <select
                          value={nivelId}
                          onChange={e => setNivelId(Number(e.target.value))}
                          className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500"
                        >
                          {catalogos.niveles.map(n => (
                            <option key={n.id_nivel} value={n.id_nivel}>
                              {n.nombre}
                            </option>
                          ))}
                        </select>
                        <select
                          value={paraleloId}
                          onChange={e => setParaleloId(Number(e.target.value))}
                          className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500"
                        >
                          {catalogos.paralelos.map(p => (
                            <option key={p.id_paralelo} value={p.id_paralelo}>
                              Paralelo {p.codigo}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Asignatura (65 materias del archivo)</label>
                      <select
                        value={asignaturaId}
                        onChange={e => setAsignaturaId(Number(e.target.value))}
                        className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      >
                        {catalogos.asignaturas.map(a => (
                          <option key={a.id_asignatura} value={a.id_asignatura}>
                            [{a.codigo_asignatura}] {a.nombre} ({a.creditos} crd. - {a.horas_totales}h)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                        <span>Docente Asignado (50 docentes)</span>
                        {realtimeConflict?.conflictoDocente && (
                          <span className="text-[10px] text-rose-600 font-bold flex items-center gap-0.5">
                            <AlertTriangle className="w-3 h-3" /> Cruce
                          </span>
                        )}
                      </label>
                      <select
                        value={docenteId}
                        onChange={e => setDocenteId(Number(e.target.value))}
                        className={`w-full text-xs bg-white border rounded-lg p-2 focus:outline-hidden transition ${
                          realtimeConflict?.conflictoDocente
                            ? 'border-2 border-rose-500 bg-rose-50 text-rose-950 font-bold ring-2 ring-rose-200'
                            : 'border-slate-300 focus:ring-2 focus:ring-indigo-500'
                        }`}
                      >
                        {catalogos.docentes.map(d => (
                          <option key={d.id_docente} value={d.id_docente}>
                            {d.apellidos} {d.nombres}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Docente specs card */}
                  {currentDocente && (
                    <div className="p-2 bg-indigo-50/70 border border-indigo-100 rounded-lg text-xs flex flex-wrap items-center justify-between text-indigo-950">
                      <span>
                        <strong>Docente:</strong> {currentDocente.nombres} {currentDocente.apellidos} (CI: {currentDocente.ci})
                      </span>
                      <span>
                        <strong>Título:</strong> {currentDocente.titulo_academico} • {currentDocente.tipo_contrato}
                      </span>
                    </div>
                  )}
                </div>

              </div>

              {/* COLUMNA DERECHA: Horario, Validación, Curso Unificado y Observaciones */}
              <div className="space-y-3.5">
                
                {/* SECCIÓN 3: HORARIOS, JORNADA Y CALENDARIO */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-2.5">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-indigo-600" />
                      3. Horario, Día, Jornada y Periodo Académico
                    </span>
                    <span className="text-[11px] bg-purple-100 border border-purple-200 text-[#350854] px-2 py-0.5 rounded font-semibold">
                      PER-2026-1 (01 Mar - 31 Ago 2026)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Día de la Semana</label>
                      <select
                        value={diaId}
                        onChange={e => setDiaId(Number(e.target.value))}
                        className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500"
                      >
                        {catalogos.diasSemana.map(d => (
                          <option key={d.id_dia} value={d.id_dia}>
                            {d.nombre} {d.es_laborable ? '' : '(No laborable)'}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Jornada</label>
                      <select
                        value={jornadaId}
                        onChange={e => setJornadaId(Number(e.target.value))}
                        className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500"
                      >
                        {catalogos.jornadas.map(j => (
                          <option key={j.id_jornada} value={j.id_jornada}>
                            {j.nombre} ({j.hora_inicio?.slice(0, 5)} - {j.hora_fin?.slice(0, 5)})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Hora Inicio</label>
                      <input
                        type="time"
                        value={horaInicio}
                        onChange={e => setHoraInicio(e.target.value)}
                        className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 font-mono"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Hora Fin</label>
                      <input
                        type="time"
                        value={horaFin}
                        onChange={e => setHoraFin(e.target.value)}
                        className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 font-mono"
                        required
                      />
                    </div>
                  </div>

                  {/* Conflict validation button & result banner */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={handleValidate}
                      disabled={validating}
                      className="w-full px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition cursor-pointer active:scale-98 shadow-2xs"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                      {validating ? 'Comprobando conflictos en base de datos...' : 'Verificar Cruces de Horario y Sobrecupo'}
                    </button>

                    {validationResult && (
                      <div className={`mt-2 p-2.5 rounded-xl border text-xs leading-relaxed ${
                        validationResult.valido
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                          : 'bg-amber-50 border-amber-200 text-amber-950'
                      }`}>
                        <div className="font-bold flex items-center gap-1.5">
                          {validationResult.valido ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                          )}
                          {validationResult.valido ? 'Espacio y horario totalmente disponibles' : 'Se encontraron advertencias o conflictos'}
                        </div>

                        <div className="mt-1 space-y-0.5">
                          {validationResult.cruces.conflictoAula && (
                            <div className="text-rose-700 font-semibold">
                              ❌ Conflicto de Aula: Ocupada por {validationResult.cruces.detallesAula?.asignatura_nombre} ({validationResult.cruces.detallesAula?.hora_inicio} - {validationResult.cruces.detallesAula?.hora_fin})
                            </div>
                          )}
                          {validationResult.cruces.conflictoDocente && (
                            <div className="text-rose-700 font-semibold">
                              ❌ Conflicto de Docente: Ya imparte {validationResult.cruces.detallesDocente?.asignatura_nombre} en ese horario.
                            </div>
                          )}
                          {validationResult.sobrecupo && (
                            <div className="text-amber-700 font-semibold">
                              ⚠️ Sobrecupo: Capacidad del aula ({validationResult.capacidadAula}) menor a {validationResult.numeroEstudiantes} estudiantes.
                            </div>
                          )}
                          {validationResult.valido && (
                            <div className="text-emerald-800">
                              No hay cruces de aula ni de docente en ese intervalo. Capacidad óptima. Feriados del 2026 contemplados.
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* SECCIÓN 4: CURSO UNIFICADO (OPCIONAL) */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="checkUnificado"
                      checked={cursoUnificado}
                      onChange={e => setCursoUnificado(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                    />
                    <label htmlFor="checkUnificado" className="text-xs font-bold text-slate-800 cursor-pointer select-none">
                      ¿Es un Curso Unificado / Compartido entre carreras?
                    </label>
                  </div>

                  {cursoUnificado && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-slate-200 animate-in fade-in">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Carrera Unificada</label>
                        <input
                          type="text"
                          value={unificadaCarrera}
                          onChange={e => setUnificadaCarrera(e.target.value)}
                          placeholder="Ej. TECNOLOGÍA EN DESARROLLO DE SOFTWARE"
                          className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Código Asignatura Unificada</label>
                        <input
                          type="text"
                          value={unificadaCodigo}
                          onChange={e => setUnificadaCodigo(e.target.value)}
                          placeholder="Ej. SOF-101"
                          className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre Asignatura Unificada</label>
                        <input
                          type="text"
                          value={unificadaAsignatura}
                          onChange={e => setUnificadaAsignatura(e.target.value)}
                          placeholder="Ej. FUNDAMENTOS DE CONTABILIDAD Y COSTOS"
                          className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* SECCIÓN 5: OBSERVACIONES */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Observaciones / Requerimientos Técnicos</label>
                  <textarea
                    rows={2}
                    value={observaciones}
                    onChange={e => setObservaciones(e.target.value)}
                    placeholder="Ej. Requiere proyector HDMI y software especializado..."
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-hidden"
                  />
                </div>

              </div>

            </div>
          </div>

          {/* FOOTER FIJO (DOCK) - SIEMPRE VISIBLE */}
          <div className="shrink-0 bg-slate-50 border-t border-slate-200 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-2.5">
            {/* Resumen dinámico en vivo */}
            <div className="flex items-center gap-2 text-xs text-slate-600 flex-wrap">
              <span className="font-semibold text-slate-800">
                Resumen:
              </span>
              <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                {currentAula ? `${currentAula.codigo} (${currentAula.tipo})` : 'Aula no asignada'}
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-medium">
                {selectedDia?.nombre || 'Día'}: {horaInicio} - {horaFin}
              </span>
              <span className="text-slate-500 hidden md:inline">
                • {numeroEstudiantes} estudiantes
              </span>
            </div>

            {/* Botones de acción */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition cursor-pointer min-h-[34px]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving || hasSobrecupo}
                className={`px-5 py-1.5 text-xs font-bold rounded-lg shadow-md transition disabled:opacity-50 cursor-pointer min-h-[34px] flex items-center gap-1.5 text-white ${
                  hasSobrecupo
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'
                }`}
                title={hasSobrecupo ? 'Capacidad del aula menor a los estudiantes. Ingreso no permitido.' : ''}
              >
                {hasSobrecupo ? (
                  <>
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>⛔ Ingreso No Permitido (Sobrecupo)</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{saving ? 'Guardando en Base de Datos...' : (initialData ? 'Guardar Cambios' : 'Registrar Asignación')}</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </form>
      </div>

      {/* Modal de Alerta de Capacidad y Aulas Recomendadas */}
      {capacidadModal && (
        <CapacidadAlertModal
          isOpen={capacidadModal.isOpen}
          mode={capacidadModal.mode}
          aulaSeleccionada={capacidadModal.aula}
          numeroEstudiantes={capacidadModal.numeroEstudiantes}
          aulasRecomendadas={capacidadModal.recomendadas}
          onClose={() => setCapacidadModal(null)}
          onSelectAula={(newAulaId) => {
            const selected = aulas.find(a => a.id_aula_laboratorio === newAulaId);
            if (selected) {
              setBloqueId(selected.id_bloque);
              setPisoSelected(selected.piso);
              setAulaId(selected.id_aula_laboratorio);
            }
            setCapacidadModal(null);
          }}
          onKeepCurrent={() => {
            setCapacidadModal(null);
          }}
        />
      )}
    </div>
  );
};
