import React, { useState, useEffect, useMemo } from 'react';
import { Asignatura, Carrera, Nivel, PlanificacionCompleta, Sede, Escuela, Jornada, Bloque, AulaLaboratorio } from '../../types.ts';
import { ExportController } from '../../controllers/exportController.ts';
import { ApiClient } from '../../controllers/apiClient.ts';
import { PaginationControls } from '../../components/common/PaginationControls.tsx';
import { 
  Building2, 
  GraduationCap, 
  Clock, 
  Users, 
  Layers, 
  Plus, 
  Trash2, 
  Save, 
  FileSpreadsheet, 
  RotateCcw, 
  CheckCircle2, 
  Lock, 
  Pencil, 
  ChevronDown, 
  Sparkles,
  Info,
  ShieldAlert,
  DoorClosed,
  Search,
  Filter,
  BookOpen,
  AlertTriangle,
  XCircle,
  ArrowRight,
  ListFilter,
  Check,
  CheckCircle,
  Eye,
  School,
  Download,
  Pin,
  PinOff,
  RefreshCw,
  Edit,
  X
} from 'lucide-react';

export interface RegistroFila {
  id: string;
  asignatura: string;
  codigo_asignatura?: string;
  numero_estudiantes: number | '';
  aulas_no_disponibles?: string;
}

export interface AsignaturaDisponibilidadItem {
  id: number;
  codigo: string;
  nombre: string;
  id_carrera?: number;
  carrera_nombre: string;
  escuela_codigo: string;
  escuela_nombre: string;
  escuela_label: string;
  nivel_numero: number;
  nivel_nombre: string;
  modalidad: string;
  horas_docencia: number;
  horas_practicas: number;
  horas_totales: number;
  creditos: number;
  disponible: boolean;
  motivo: string;
  aula_asignada?: string;
  docente_asignado?: string;
  estado_original: string;
}

interface AsignaturaNivelCrudViewProps {
  asignaturas?: Asignatura[];
  carreras?: Carrera[];
  planificaciones?: PlanificacionCompleta[];
  niveles?: Nivel[];
  sedes?: Sede[];
  escuelas?: Escuela[];
  jornadas?: Jornada[];
  bloques?: Bloque[];
  aulas?: AulaLaboratorio[];
  onRefresh?: () => void;
}

export const AsignaturaNivelCrudView: React.FC<AsignaturaNivelCrudViewProps> = ({
  asignaturas = [],
  carreras = [],
  planificaciones = [],
  niveles = [],
  sedes = [],
  escuelas = [],
  jornadas = [],
  bloques = [],
  aulas = [],
  onRefresh
}) => {
  // Pestaña principal de visualización dentro de Asignaturas / Nivel
  // 'listado' = Listado completo de Asignaturas Disponibles y No Disponibles
  // 'matriz' = Matriz de Planificación y Registro por Nivel
  const [activeSubTab, setActiveSubTab] = useState<'listado' | 'matriz'>('listado');

  // =========================================================================
  // 1. SELECTORES DE LA MATRIZ POR NIVEL
  // =========================================================================
  const [selectedSede, setSelectedSede] = useState<string>('UIO_NORTE');
  const [selectedEscuela, setSelectedEscuela] = useState<string>('TIC');
  const [selectedJornada, setSelectedJornada] = useState<string>('MATUTINA');
  const [selectedCarrera, setSelectedCarrera] = useState<string>('DESARROLLO DE SOFTWARE');
  const [selectedNivel, setSelectedNivel] = useState<string>('NIVEL 1');

  // =========================================================================
  // 2. FILTROS PARA EL LISTADO DE ASIGNATURAS (Exactos como en el archivo adjunto)
  // =========================================================================
  const [filtroEscuela, setFiltroEscuela] = useState<string>('TODAS');
  const [filtroModalidad, setFiltroModalidad] = useState<string>('TODAS');
  const [filtroEstado, setFiltroEstado] = useState<string>('TODOS');
  const [filtroCarreraListado, setFiltroCarreraListado] = useState<string>('TODAS');
  const [filtroNivelListado, setFiltroNivelListado] = useState<string>('TODOS');
  const [filtroDisponibilidad, setFiltroDisponibilidad] = useState<'TODAS' | 'DISPONIBLES' | 'NO_DISPONIBLES'>('TODAS');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Control de congelado / fixed (por defecto activo como solicita el usuario)
  const [isHeaderFixed, setIsHeaderFixed] = useState<boolean>(true);

  // Paginación cada 10 registros (por defecto 10 registros por pantalla)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number | 'all'>(10);

  // Modales y control de acciones
  const [isModalNuevaAsignaturaOpen, setIsModalNuevaAsignaturaOpen] = useState<boolean>(false);
  const [isModalEliminarTodosOpen, setIsModalEliminarTodosOpen] = useState<boolean>(false);
  const [isSavingAsignatura, setIsSavingAsignatura] = useState<boolean>(false);
  const [deletingAsignaturaItem, setDeletingAsignaturaItem] = useState<AsignaturaDisponibilidadItem | null>(null);

  const [formAsignatura, setFormAsignatura] = useState({
    codigo_asignatura: '',
    nombre: '',
    descripcion: '',
    horas_docencia: 64,
    horas_practicas: 32,
    horas_autonomas: 44,
    horas_totales: 140,
    creditos: 3.5,
    estado: 'ACTIVA',
    id_carrera: 1
  });

  // Reiniciar a página 1 cuando cualquier filtro cambie
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filtroEscuela, filtroModalidad, filtroEstado, filtroDisponibilidad, filtroCarreraListado, filtroNivelListado]);

  // Mensaje de guardado y feedback
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  // Lista de sedes institucionales
  const sedesList = useMemo(() => {
    if (sedes.length > 0) return sedes.map(s => s.codigo || s.nombre);
    return ['UIO_NORTE', 'UIO_SUR', 'MATRIZ_CENTRO'];
  }, [sedes]);

  // Lista de escuelas institucionales con código y nombre oficial
  const escuelasList = useMemo(() => {
    if (escuelas.length > 0) return escuelas.map(e => e.codigo || e.nombre);
    return ['TIC', 'EDUCACION', 'INGENIERIA E INDUSTRIA', 'SALUD', 'SERVICIOS', 'ADMINISTRACION'];
  }, [escuelas]);

  const escuelasOptions = useMemo(() => {
    if (escuelas && escuelas.length > 0) {
      return escuelas.map(e => ({
        id_escuela: e.id_escuela,
        codigo: e.codigo,
        nombre: e.nombre,
        label: `${e.codigo} - ${e.nombre}`
      }));
    }
    return [
      { id_escuela: 1, codigo: 'ESC-01', nombre: 'TIC', label: 'ESC-01 - TIC' },
      { id_escuela: 2, codigo: 'ESC-02', nombre: 'EDUCACION', label: 'ESC-02 - EDUCACION' },
      { id_escuela: 3, codigo: 'ESC-03', nombre: 'INGENIERIA E INDUSTRIA', label: 'ESC-03 - INGENIERIA E INDUSTRIA' },
      { id_escuela: 4, codigo: 'ESC-04', nombre: 'SALUD', label: 'ESC-04 - SALUD' },
      { id_escuela: 5, codigo: 'ESC-05', nombre: 'SERVICIOS', label: 'ESC-05 - SERVICIOS' },
      { id_escuela: 6, codigo: 'ESC-06', nombre: 'ADMINISTRACION', label: 'ESC-06 - ADMINISTRACION' }
    ];
  }, [escuelas]);

  // Lista de jornadas
  const jornadasList = useMemo(() => {
    if (jornadas.length > 0) return jornadas.map(j => j.nombre || j.codigo);
    return ['MATUTINA', 'VESPERTINA', 'NOCTURNA', 'DOMINICAL'];
  }, [jornadas]);

  // Lista de carreras
  const carrerasList = useMemo(() => {
    if (carreras.length > 0) return carreras.map(c => c.nombre);
    return [
      'DESARROLLO DE SOFTWARE',
      'EDUCACIÓN INICIAL',
      'ELECTRICIDAD',
      'ENTRENAMIENTO DEPORTIVO',
      'ODONTOLOGÍA',
      'GASTRONOMÍA',
      'GASTRONOMÍA UNIVERSITARIA',
      'ENFERMERÍA',
      'MECÁNICA AUTOMOTRIZ',
      'REHABILITACIÓN FÍSICA',
      'CONTABILIDAD Y TRIBUTACIÓN',
      'TECNOLOGÍA SUPERIOR EN CONTABILIDAD',
      'GESTIÓN DE TALENTO HUMANO',
      'TECNOLOGÍA SUPERIOR EN ADMINISTRACIÓN',
      'TECNOLOGÍA SUPERIOR EN MARKETING',
      'ESTÉTICA INTEGRAL',
      'ESTÉTICA INTEGRAL UNIVERSITARIA'
    ];
  }, [carreras]);

  // Lista de niveles (Nivel 1 al 6)
  const nivelesList = useMemo(() => {
    if (niveles.length > 0) return niveles.map(n => n.nombre || `NIVEL ${n.numero}`);
    return ['NIVEL 1', 'NIVEL 2', 'NIVEL 3', 'NIVEL 4', 'NIVEL 5', 'NIVEL 6'];
  }, [niveles]);

  // Helper para deducir la carrera de una asignatura
  const getCarreraAsignatura = (asig: Asignatura): string => {
    if (asig.carrera_nombre) return asig.carrera_nombre;
    if (asig.id_carrera) {
      const carr = carreras.find(c => c.id_carrera === asig.id_carrera);
      if (carr) return carr.nombre;
    }
    const code = (asig.codigo_asignatura || '').toUpperCase();
    if (code.startsWith('SOF') || code.startsWith('DESF') || code.startsWith('DSW')) return 'DESARROLLO DE SOFTWARE';
    if (code.startsWith('EIN') || code.startsWith('EDU')) return 'EDUCACIÓN INICIAL';
    if (code.startsWith('ELE') || code.startsWith('ELC')) return 'ELECTRICIDAD';
    if (code.startsWith('DEP') || code.startsWith('EDP')) return 'ENTRENAMIENTO DEPORTIVO';
    if (code.startsWith('ODO')) return 'ODONTOLOGÍA';
    if (code.startsWith('GASU')) return 'GASTRONOMÍA UNIVERSITARIA';
    if (code.startsWith('GAS')) return 'GASTRONOMÍA';
    if (code.startsWith('ENF')) return 'ENFERMERÍA';
    if (code.startsWith('MEC') || code.startsWith('AUT')) return 'MECÁNICA AUTOMOTRIZ';
    if (code.startsWith('REF') || code.startsWith('REFI')) return 'REHABILITACIÓN FÍSICA';
    if (code.startsWith('CT')) return 'CONTABILIDAD Y TRIBUTACIÓN';
    if (code.startsWith('CONT')) return 'TECNOLOGÍA SUPERIOR EN CONTABILIDAD';
    if (code.startsWith('GTH') || code.startsWith('ATH')) return 'GESTIÓN DE TALENTO HUMANO';
    if (code.startsWith('ADM') || code.startsWith('GP')) return 'TECNOLOGÍA SUPERIOR EN ADMINISTRACIÓN';
    if (code.startsWith('MKT') || code.startsWith('MARK')) return 'TECNOLOGÍA SUPERIOR EN MARKETING';
    if (code.startsWith('ESTU')) return 'ESTÉTICA INTEGRAL UNIVERSITARIA';
    if (code.startsWith('EST')) return 'ESTÉTICA INTEGRAL';

    // Buscar si hay planificaciones previas
    const plan = planificaciones.find(p => p.id_asignatura === asig.id_asignatura || p.asignatura_codigo === asig.codigo_asignatura);
    if (plan && plan.carrera_nombre) return plan.carrera_nombre;

    return 'DESARROLLO DE SOFTWARE';
  };

  // Helper para deducir la escuela de una asignatura
  const getEscuelaAsignatura = (asig: Asignatura, carrName: string): { codigo: string; nombre: string; label: string } => {
    const carr = carreras.find(c => c.nombre.toUpperCase() === carrName.toUpperCase() || c.id_carrera === asig.id_carrera);
    if (carr && carr.id_escuela) {
      const esc = escuelas.find(e => e.id_escuela === carr.id_escuela);
      if (esc) {
        return {
          codigo: esc.codigo,
          nombre: esc.nombre,
          label: `${esc.codigo} - ${esc.nombre}`
        };
      }
    }
    const name = carrName.toUpperCase();
    if (name.includes('SOFTWARE') || name.includes('SISTEMA')) return { codigo: 'ESC-01', nombre: 'TIC', label: 'ESC-01 - TIC' };
    if (name.includes('EDUCACION') || name.includes('INICIAL') || name.includes('DEPORTIVO')) return { codigo: 'ESC-02', nombre: 'EDUCACION', label: 'ESC-02 - EDUCACION' };
    if (name.includes('ELECTRICIDAD') || name.includes('MECANICA')) return { codigo: 'ESC-03', nombre: 'INGENIERIA E INDUSTRIA', label: 'ESC-03 - INGENIERIA E INDUSTRIA' };
    if (name.includes('ODONTOLOGIA') || name.includes('ENFERMERIA') || name.includes('REHABILITACION')) return { codigo: 'ESC-04', nombre: 'SALUD', label: 'ESC-04 - SALUD' };
    if (name.includes('GASTRONOMIA') || name.includes('ESTETICA')) return { codigo: 'ESC-05', nombre: 'SERVICIOS', label: 'ESC-05 - SERVICIOS' };
    return { codigo: 'ESC-06', nombre: 'ADMINISTRACION', label: 'ESC-06 - ADMINISTRACION' };
  };

  // Helper para deducir la modalidad de una asignatura
  const getModalidadAsignatura = (asig: Asignatura, carrName: string): string => {
    const carr = carreras.find(c => c.nombre.toUpperCase() === carrName.toUpperCase() || c.id_carrera === asig.id_carrera);
    return carr?.modalidad || 'PRESENCIAL';
  };

  // Helper para deducir el nivel de una asignatura
  const getNivelAsignatura = (asig: Asignatura): { numero: number; nombre: string } => {
    const code = (asig.codigo_asignatura || '').toUpperCase();
    // Extraer dígitos (ej: SOF_101 -> 1, SOF_203 -> 2, etc.)
    const match = code.match(/_?(\d)(\d\d)/);
    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      if (num >= 1 && num <= 8) {
        return { numero: num, nombre: `Nivel ${num}` };
      }
    }
    // Buscar en planificaciones
    const plan = planificaciones.find(p => p.id_asignatura === asig.id_asignatura || p.asignatura_codigo === asig.codigo_asignatura);
    if (plan && plan.id_nivel) {
      return { numero: plan.id_nivel, nombre: plan.nivel_nombre ? (plan.nivel_nombre.toLowerCase().includes('nivel') ? plan.nivel_nombre : `Nivel ${plan.id_nivel}`) : `Nivel ${plan.id_nivel}` };
    }
    // Asignar por posición de ID
    const modulo = ((asig.id_asignatura - 1) % 5) + 1;
    return { numero: modulo, nombre: `Nivel ${modulo}` };
  };

  // Lista oficial de Aulas No Disponibles identificadas en el sistema (C1, C2, C3, C4 y aquellas inactivas)
  const unavailableAulasList = useMemo(() => {
    const list: string[] = [];
    aulas.forEach(a => {
      const code = a.codigo?.trim();
      if (!code) return;
      if (a.estado === 'INACTIVO' || a.estado === 'MANTENIMIENTO' || ['C1', 'C2', 'C3', 'C4'].includes(code)) {
        if (!list.includes(code)) list.push(code);
      }
    });

    ['C1', 'C2', 'C3', 'C4'].forEach(c => {
      if (!list.includes(c)) list.push(c);
    });

    return list.sort();
  }, [aulas]);

  const getUnavailableAulaForRow = (idx: number): string => {
    if (unavailableAulasList.length === 0) return 'C1';
    return unavailableAulasList[idx % unavailableAulasList.length];
  };

  // =========================================================================
  // 3. CLASIFICACIÓN Y LISTADO COMPLETO: ASIGNATURAS DISPONIBLES Y NO DISPONIBLES
  // =========================================================================
  const listaAsignaturasDisponibilidad = useMemo<AsignaturaDisponibilidadItem[]>(() => {
    return asignaturas.map(a => {
      const carrName = getCarreraAsignatura(a);
      const niv = getNivelAsignatura(a);
      const esc = getEscuelaAsignatura(a, carrName);
      const mod = getModalidadAsignatura(a, carrName);

      // Buscar si la asignatura ya está planificada en el sistema
      const plan = planificaciones.find(p => 
        p.id_asignatura === a.id_asignatura || 
        p.asignatura_codigo === a.codigo_asignatura || 
        (p.asignatura_nombre && p.asignatura_nombre.toUpperCase() === a.nombre.toUpperCase())
      );

      const isInactiva = a.estado === 'INACTIVA' || a.estado === 'DESACTIVADA';
      const aulaCodigo = plan?.aula_codigo || '';
      const isAulaBloqueada = ['C1', 'C2', 'C3', 'C4'].includes(aulaCodigo);

      let disponible = true;
      let motivo = '✅ Disponible para asignación y programación de horario';

      if (isInactiva) {
        disponible = false;
        motivo = '🔴 Asignatura inactiva en el catálogo institucional';
      } else if (isAulaBloqueada) {
        disponible = false;
        motivo = `🔴 Asociada a aula no disponible (${aulaCodigo})`;
      } else if (plan && plan.id_docente && plan.id_aula_laboratorio) {
        disponible = false;
        motivo = `🔴 Planificada y asignada en ${plan.aula_codigo || 'Aula'} con ${plan.docente_apellidos || 'Docente'}`;
      }

      return {
        id: a.id_asignatura,
        codigo: a.codigo_asignatura,
        nombre: a.nombre,
        id_carrera: a.id_carrera,
        carrera_nombre: carrName,
        escuela_codigo: esc.codigo,
        escuela_nombre: esc.nombre,
        escuela_label: esc.label,
        nivel_numero: niv.numero,
        nivel_nombre: niv.nombre,
        modalidad: mod,
        horas_docencia: a.horas_docencia || 64,
        horas_practicas: a.horas_practicas || 32,
        horas_totales: a.horas_totales || 140,
        creditos: a.creditos || 3.5,
        disponible,
        motivo,
        aula_asignada: plan?.aula_codigo,
        docente_asignado: plan ? `${plan.docente_apellidos || ''} ${plan.docente_nombres || ''}`.trim() : undefined,
        estado_original: a.estado || 'ACTIVA'
      };
    });
  }, [asignaturas, planificaciones, carreras, escuelas]);

  // Contadores y métricas globales de disponibilidad
  const metricasDisponibilidad = useMemo(() => {
    const total = listaAsignaturasDisponibilidad.length;
    const disponibles = listaAsignaturasDisponibilidad.filter(i => i.disponible).length;
    const noDisponibles = total - disponibles;
    const totalHoras = listaAsignaturasDisponibilidad.reduce((acc, curr) => acc + (curr.horas_totales || 0), 0);
    return { total, disponibles, noDisponibles, totalHoras };
  }, [listaAsignaturasDisponibilidad]);

  // Lista filtrada según los controles de búsqueda y selectores exactos del archivo adjunto
  const asignaturasFiltradasListado = useMemo(() => {
    return listaAsignaturasDisponibilidad.filter(item => {
      // 1. Filtro por Escuela
      if (filtroEscuela !== 'TODAS') {
        if (item.escuela_codigo !== filtroEscuela && item.escuela_label !== filtroEscuela && item.escuela_nombre !== filtroEscuela) {
          return false;
        }
      }

      // 2. Filtro por Modalidad
      if (filtroModalidad !== 'TODAS') {
        if (item.modalidad.toUpperCase() !== filtroModalidad.toUpperCase()) {
          return false;
        }
      }

      // 3. Filtro por Estado
      if (filtroEstado !== 'TODOS') {
        if (filtroEstado === 'ACTIVA' && item.estado_original !== 'ACTIVA') return false;
        if (filtroEstado === 'INACTIVA' && item.estado_original !== 'INACTIVA') return false;
        if (filtroEstado === 'DISPONIBLES' && !item.disponible) return false;
        if (filtroEstado === 'NO_DISPONIBLES' && item.disponible) return false;
      }

      // 4. Filtro por Disponibilidad tradicional (si se usan las pastillas)
      if (filtroDisponibilidad === 'DISPONIBLES' && !item.disponible) return false;
      if (filtroDisponibilidad === 'NO_DISPONIBLES' && item.disponible) return false;

      // 5. Filtro por Carrera
      if (filtroCarreraListado !== 'TODAS') {
        if (item.carrera_nombre.toUpperCase() !== filtroCarreraListado.toUpperCase()) return false;
      }

      // 6. Filtro por Nivel
      if (filtroNivelListado !== 'TODOS') {
        const nivelNorm = filtroNivelListado.toUpperCase().replace(/\s+/g, '');
        const itemNivelNorm = item.nivel_nombre.toUpperCase().replace(/\s+/g, '');
        if (itemNivelNorm !== nivelNorm && !item.nivel_nombre.toUpperCase().includes(filtroNivelListado.toUpperCase())) {
          return false;
        }
      }

      // 7. Búsqueda por texto (código, nombre, carrera, escuela, motivo...)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchCode = item.codigo.toLowerCase().includes(query);
        const matchName = item.nombre.toLowerCase().includes(query);
        const matchCarr = item.carrera_nombre.toLowerCase().includes(query);
        const matchEsc = item.escuela_label.toLowerCase().includes(query);
        const matchMotivo = item.motivo.toLowerCase().includes(query);
        if (!matchCode && !matchName && !matchCarr && !matchEsc && !matchMotivo) return false;
      }

      return true;
    });
  }, [listaAsignaturasDisponibilidad, filtroEscuela, filtroModalidad, filtroEstado, filtroDisponibilidad, filtroCarreraListado, filtroNivelListado, searchQuery]);

  // Paginación calculada (cada 10 registros por defecto)
  const totalItems = asignaturasFiltradasListado.length;
  const numericPageSize = pageSize === 'all' ? totalItems || 1 : pageSize;
  const totalPages = pageSize === 'all' ? 1 : Math.max(1, Math.ceil(totalItems / numericPageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedAsignaturas = useMemo(() => {
    if (pageSize === 'all') return asignaturasFiltradasListado;
    const start = (safeCurrentPage - 1) * numericPageSize;
    return asignaturasFiltradasListado.slice(start, start + numericPageSize);
  }, [asignaturasFiltradasListado, safeCurrentPage, numericPageSize, pageSize]);

  // =========================================================================
  // 4. ASIGNATURAS DISPONIBLES DEL NIVEL SELECCIONADO (PARA LA MATRIZ)
  // =========================================================================
  const asignaturasDisponiblesNivelActual = useMemo(() => {
    return listaAsignaturasDisponibilidad.filter(item => {
      const matchCarrera = item.carrera_nombre.toUpperCase() === selectedCarrera.toUpperCase();
      const matchNivel = item.nivel_nombre.toUpperCase() === selectedNivel.toUpperCase();
      return matchCarrera && matchNivel;
    });
  }, [listaAsignaturasDisponibilidad, selectedCarrera, selectedNivel]);

  // Storage key para persistir la matriz por combinación
  const storageKey = useMemo(() => {
    return `isuj_grid_v2_${selectedSede}_${selectedEscuela}_${selectedJornada}_${selectedCarrera.replace(/\s+/g, '_')}_${selectedNivel.replace(/\s+/g, '_')}`;
  }, [selectedSede, selectedEscuela, selectedJornada, selectedCarrera, selectedNivel]);

  // Obtener sugerencias iniciales de asignaturas para la carrera y nivel seleccionados
  const getInitialSuggestedRows = (): RegistroFila[] => {
    const nivelNumMatch = selectedNivel.match(/\d+/);
    const nivelNum = nivelNumMatch ? parseInt(nivelNumMatch[0], 10) : 1;

    // 1. Filtrar asignaturas disponibles de este nivel y carrera
    const disponiblesDeCarrera = listaAsignaturasDisponibilidad.filter(a => 
      a.carrera_nombre.toUpperCase() === selectedCarrera.toUpperCase() && 
      a.nivel_numero === nivelNum &&
      a.disponible
    );

    if (disponiblesDeCarrera.length > 0) {
      return disponiblesDeCarrera.slice(0, 5).map((a, idx) => ({
        id: `asig-${a.id}-${idx}`,
        asignatura: a.nombre,
        codigo_asignatura: a.codigo,
        numero_estudiantes: 30,
        aulas_no_disponibles: getUnavailableAulaForRow(idx)
      }));
    }

    // 2. Si no hay disponibles, sugerir de la malla completa
    const todasDeCarrera = listaAsignaturasDisponibilidad.filter(a => 
      a.carrera_nombre.toUpperCase() === selectedCarrera.toUpperCase() &&
      a.nivel_numero === nivelNum
    );

    if (todasDeCarrera.length > 0) {
      return todasDeCarrera.slice(0, 5).map((a, idx) => ({
        id: `asig-${a.id}-${idx}`,
        asignatura: a.nombre,
        codigo_asignatura: a.codigo,
        numero_estudiantes: 30,
        aulas_no_disponibles: getUnavailableAulaForRow(idx)
      }));
    }

    // 3. Fallback: 5 filas vacías con aulas no disponibles asignadas
    return [
      { id: '1', asignatura: '', numero_estudiantes: '', aulas_no_disponibles: 'C1' },
      { id: '2', asignatura: '', numero_estudiantes: '', aulas_no_disponibles: 'C2' },
      { id: '3', asignatura: '', numero_estudiantes: '', aulas_no_disponibles: 'C3' },
      { id: '4', asignatura: '', numero_estudiantes: '', aulas_no_disponibles: 'C4' },
      { id: '5', asignatura: '', numero_estudiantes: '', aulas_no_disponibles: 'C1, C2, C3, C4' },
    ];
  };

  // Estado de las filas de la matriz
  const [filas, setFilas] = useState<RegistroFila[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_) {}
    return getInitialSuggestedRows();
  });

  // Recargar al cambiar combinación
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setFilas(parsed);
          return;
        }
      }
    } catch (_) {}
    setFilas(getInitialSuggestedRows());
  }, [storageKey]);

  // Manejar cambios en las celdas editables (Asignatura y Número de Estudiantes)
  const handleCellChange = (id: string, field: 'asignatura' | 'numero_estudiantes', value: any) => {
    setFilas(prev => prev.map(f => {
      if (f.id === id) {
        return {
          ...f,
          [field]: field === 'numero_estudiantes' ? (value === '' ? '' : Math.max(0, parseInt(value, 10) || 0)) : value
        };
      }
      return f;
    }));
  };

  // Agregar una nueva fila de registro
  const handleAddFila = (asigNombre?: string, asigCodigo?: string) => {
    const newIdx = filas.length;
    const newId = `row-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setFilas(prev => [
      ...prev,
      {
        id: newId,
        asignatura: asigNombre || '',
        codigo_asignatura: asigCodigo || '',
        numero_estudiantes: 30,
        aulas_no_disponibles: getUnavailableAulaForRow(newIdx)
      }
    ]);
  };

  // Eliminar una fila
  const handleDeleteFila = (id: string) => {
    setFilas(prev => {
      const filtered = prev.filter(f => f.id !== id);
      if (filtered.length === 0) {
        return [{ id: `row-${Date.now()}`, asignatura: '', numero_estudiantes: '', aulas_no_disponibles: 'C1' }];
      }
      return filtered;
    });
  };

  // Guardar registros en localStorage
  const handleGuardarRegistros = () => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(filas));
      setSavedNotice(`Registros guardados con éxito para ${selectedCarrera} - ${selectedNivel}.`);
      setTimeout(() => setSavedNotice(null), 3500);
    } catch (e) {
      console.error('Error guardando registros en localStorage:', e);
    }
  };

  // Restablecer o recargar sugerencias
  const handleResetSugerencias = () => {
    const suggested = getInitialSuggestedRows();
    setFilas(suggested);
    try {
      localStorage.setItem(storageKey, JSON.stringify(suggested));
    } catch (_) {}
    setSavedNotice('Se cargaron las asignaturas sugeridas de la malla curricular.');
    setTimeout(() => setSavedNotice(null), 3000);
  };

  // Seleccionar asignatura desde el listado y transferir a la matriz
  const handleCargarAsignaturaAMatriz = (item: AsignaturaDisponibilidadItem) => {
    // Sincronizar selectores si son diferentes
    if (item.carrera_nombre) setSelectedCarrera(item.carrera_nombre);
    if (item.nivel_nombre) setSelectedNivel(item.nivel_nombre);

    // Si hay una fila vacía, llenarla; si no, agregar una nueva fila
    setFilas(prev => {
      const emptyIdx = prev.findIndex(f => !f.asignatura.trim());
      if (emptyIdx >= 0) {
        const updated = [...prev];
        updated[emptyIdx] = {
          ...updated[emptyIdx],
          asignatura: item.nombre,
          codigo_asignatura: item.codigo,
          numero_estudiantes: updated[emptyIdx].numero_estudiantes || 30
        };
        return updated;
      }
      return [
        ...prev,
        {
          id: `row-${Date.now()}`,
          asignatura: item.nombre,
          codigo_asignatura: item.codigo,
          numero_estudiantes: 30,
          aulas_no_disponibles: getUnavailableAulaForRow(prev.length)
        }
      ];
    });

    setSavedNotice(`Asignatura "${item.nombre}" cargada a la matriz del nivel.`);
    setActiveSubTab('matriz');
    setTimeout(() => setSavedNotice(null), 3500);
  };

  // Exportar a Excel la Matriz
  const handleExportarExcelMatriz = () => {
    const dataExport = filas.map((f, idx) => ({
      'Nº': idx + 1,
      'Sede': selectedSede,
      'Escuela': selectedEscuela,
      'Carrera': selectedCarrera,
      'Nivel': selectedNivel,
      'Asignatura': f.asignatura || 'Sin asignar',
      'Número de Estudiantes': f.numero_estudiantes || 0,
      'Jornada': selectedJornada,
      'Aulas no disponibles': f.aulas_no_disponibles || getUnavailableAulaForRow(idx)
    }));

    ExportController.exportAsignaturasNivelXLSX(
      dataExport.map((d, i) => ({
        id_asignatura: i + 1,
        codigo_asignatura: `ASIG_${i + 1}`,
        nombre: d.Asignatura,
        carrera_nombre: d.Carrera,
        id_nivel: parseInt(selectedNivel.replace(/\D/g, '') || '1', 10),
        nivel_nombre: d.Nivel,
        numero_estudiantes: d['Número de Estudiantes'],
        horas_docencia: 64,
        horas_practicas: 32,
        horas_autonomas: 44,
        horas_totales: 140,
        creditos: 3.5,
        estado: 'ACTIVA'
      })),
      carreras,
      planificaciones,
      `asignaturas_nivel_${selectedCarrera.replace(/\s+/g, '_')}_${selectedNivel}.xlsx`
    );
  };

  // Exportar a Excel el Listado de Disponibilidad
  const handleExportarExcelDisponibilidad = () => {
    const dataExport = asignaturasFiltradasListado.map((item, idx) => ({
      'Nº': idx + 1,
      'Código Asignatura': item.codigo,
      'Nombre de la Asignatura': item.nombre,
      'Carrera': item.carrera_nombre,
      'Nivel Académico': item.nivel_nombre,
      'Horas Docencia': item.horas_docencia,
      'Horas Prácticas': item.horas_practicas,
      'Horas Totales': item.horas_totales,
      'Créditos': item.creditos,
      'Disponibilidad': item.disponible ? 'DISPONIBLE' : 'NO DISPONIBLE',
      'Detalle y Diagnóstico': item.motivo,
      'Aula Asignada': item.aula_asignada || 'Sin aula',
      'Docente Asignado': item.docente_asignado || 'Sin docente'
    }));

    ExportController.exportAsignaturasNivelXLSX(
      asignaturasFiltradasListado.map((item, i) => ({
        id_asignatura: item.id,
        codigo_asignatura: item.codigo,
        nombre: item.nombre,
        carrera_nombre: item.carrera_nombre,
        id_nivel: item.nivel_numero,
        nivel_nombre: item.nivel_nombre,
        numero_estudiantes: 30,
        horas_docencia: item.horas_docencia,
        horas_practicas: item.horas_practicas,
        horas_autonomas: 44,
        horas_totales: item.horas_totales,
        creditos: item.creditos,
        estado: item.disponible ? 'DISPONIBLE' : 'NO DISPONIBLE'
      })),
      carreras,
      planificaciones,
      `catalogo_asignaturas_disponibles_no_disponibles.xlsx`
    );
  };

  const handleSaveNuevaAsignatura = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAsignatura.codigo_asignatura.trim() || !formAsignatura.nombre.trim()) {
      alert('Por favor ingresa el código y nombre de la asignatura.');
      return;
    }
    try {
      setIsSavingAsignatura(true);
      await ApiClient.createCatalogItem('asignatura', {
        codigo_asignatura: formAsignatura.codigo_asignatura.toUpperCase().trim(),
        nombre: formAsignatura.nombre.toUpperCase().trim(),
        descripcion: formAsignatura.descripcion,
        horas_docencia: Number(formAsignatura.horas_docencia) || 64,
        horas_practicas: Number(formAsignatura.horas_practicas) || 32,
        horas_autonomas: Number(formAsignatura.horas_autonomas) || 44,
        horas_totales: Number(formAsignatura.horas_totales) || 140,
        creditos: Number(formAsignatura.creditos) || 3.5,
        estado: formAsignatura.estado || 'ACTIVA'
      });
      setIsModalNuevaAsignaturaOpen(false);
      setSavedNotice(`Asignatura "${formAsignatura.nombre}" creada con éxito.`);
      setTimeout(() => setSavedNotice(null), 3500);
      onRefresh?.();
    } catch (err: any) {
      alert(err.message || 'Error al crear asignatura');
    } finally {
      setIsSavingAsignatura(false);
    }
  };

  const handleConfirmEliminarTodos = async () => {
    try {
      setIsSavingAsignatura(true);
      const toDelete = paginatedAsignaturas.slice(0, 10);
      for (const item of toDelete) {
        try {
          await ApiClient.deleteCatalogItem('asignatura', item.id);
        } catch (_) {}
      }
      setIsModalEliminarTodosOpen(false);
      setSavedNotice(`Se han eliminado ${toDelete.length} asignaturas seleccionadas.`);
      setTimeout(() => setSavedNotice(null), 3500);
      onRefresh?.();
    } catch (err: any) {
      alert(err.message || 'Error al eliminar asignaturas');
    } finally {
      setIsSavingAsignatura(false);
    }
  };

  const handleConfirmEliminarIndividual = async () => {
    if (!deletingAsignaturaItem) return;
    try {
      await ApiClient.deleteCatalogItem('asignatura', deletingAsignaturaItem.id);
      setSavedNotice(`Asignatura "${deletingAsignaturaItem.nombre}" eliminada exitosamente.`);
      setDeletingAsignaturaItem(null);
      setTimeout(() => setSavedNotice(null), 3500);
      onRefresh?.();
    } catch (err: any) {
      alert(err.message || 'Error al eliminar asignatura');
    }
  };

  return (
    <div className="space-y-4">
      {/* =========================================================================
          BANNER / NOTIFICACIÓN DE ÉXITO
      ========================================================================= */}
      {savedNotice && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-3.5 py-2.5 rounded-xl text-xs flex items-center justify-between shadow-2xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-bold">{savedNotice}</span>
          </div>
          <button onClick={() => setSavedNotice(null)} className="text-emerald-700 hover:text-emerald-900 font-bold cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* =========================================================================
          CABECERA Y SELECTOR DE VISTA DENTRO DE "Asignaturas / Nivel"
          (1. Listado de Disponibles y No Disponibles | 2. Matriz de Registro por Nivel)
      ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-100 text-purple-900 font-bold">
              <BookOpen className="w-5 h-5 text-purple-800" />
            </span>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Gestión de Asignaturas por Nivel</span>
                <span className="text-xs bg-purple-50 text-purple-900 border border-purple-200 px-2 py-0.5 rounded-full font-bold">
                  {metricasDisponibilidad.total} Asignaturas
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Consulta y audita las <b>asignaturas disponibles</b> y <b>no disponibles</b> en la malla institucional.
              </p>
            </div>
          </div>
        </div>

        {/* BOTONES CONMUTADORES DE SUB-VISTA */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setActiveSubTab('listado')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'listado'
                ? 'bg-purple-900 text-white shadow-2xs font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" />
            <span>Listado Disponibles & No Disponibles</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              activeSubTab === 'listado' ? 'bg-purple-950 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {metricasDisponibilidad.total}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('matriz')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'matriz'
                ? 'bg-purple-900 text-white shadow-2xs font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <Pencil className="w-3.5 h-3.5" />
            <span>Matriz de Captura por Nivel</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              activeSubTab === 'matriz' ? 'bg-purple-950 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {filas.length}
            </span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          SUB-VISTA 1: LISTADO OFICIAL DE ASIGNATURAS DISPONIBLES Y NO DISPONIBLES
      ========================================================================= */}
      {activeSubTab === 'listado' && (
        <div className="space-y-4">
          {/* TARJETAS RESUMEN KPI */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Total Asignaturas</span>
                <div className="text-xl font-black text-slate-900 font-mono mt-0.5">{metricasDisponibilidad.total}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Catálogo oficial institucional</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                <BookOpen className="w-5 h-5" />
              </div>
            </div>

            {/* 🟢 DISPONIBLES (SIEMPRE COLOR VERDE) */}
            <div className="bg-white rounded-xl border border-emerald-200 p-3 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wide flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Asignaturas Disponibles
                </span>
                <div className="text-xl font-black text-emerald-700 font-mono mt-0.5">{metricasDisponibilidad.disponibles}</div>
                <div className="text-[10px] text-emerald-800 font-medium mt-0.5">Listas para asignación y programación</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
            </div>

            {/* 🔴 NO DISPONIBLES (COLOR ROJO) */}
            <div className="bg-white rounded-xl border border-rose-200 p-3 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wide flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  Asignaturas No Disponibles
                </span>
                <div className="text-xl font-black text-rose-700 font-mono mt-0.5">{metricasDisponibilidad.noDisponibles}</div>
                <div className="text-[10px] text-rose-600 font-medium mt-0.5">Planificadas / Aulas bloqueadas (C1..C4)</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
            </div>

            {/* HORAS TOTALES */}
            <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Carga Curricular</span>
                <div className="text-xl font-black text-indigo-950 font-mono mt-0.5">{metricasDisponibilidad.totalHoras.toLocaleString()}h</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Horas totales de formación</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* BARRA DE FILTROS Y CONTROLES DEL LISTADO - CONGELADA / FIXED (Exacta al archivo adjunto) */}
          <div className={`${isHeaderFixed ? 'sticky top-0 z-30 shadow-md' : ''} bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-3.5 space-y-3 transition-all`}>
            {/* Fila 1: Buscador y Filtros exactos como en el archivo adjunto */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* 1. Buscador */}
              <div className="relative flex-1 min-w-[200px] max-w-xs">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por código, nombre o títu..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-8.5 pr-7 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#0099e6] focus:bg-white transition"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* 2. Filtro Escuela (ej. ESC-01 - TIC) */}
              <div className="relative">
                <select
                  value={filtroEscuela}
                  onChange={e => setFiltroEscuela(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-lg pl-3 pr-7 py-2 font-medium text-slate-700 hover:border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#0099e6] transition cursor-pointer appearance-none max-w-[190px] truncate"
                >
                  <option value="TODAS">Todas las escuelas</option>
                  {escuelasOptions.map(esc => (
                    <option key={esc.codigo} value={esc.codigo}>
                      {esc.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* 3. Filtro Modalidad */}
              <div className="relative">
                <select
                  value={filtroModalidad}
                  onChange={e => setFiltroModalidad(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-lg pl-3 pr-7 py-2 font-medium text-slate-700 hover:border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#0099e6] transition cursor-pointer appearance-none"
                >
                  <option value="TODAS">Todas las modalidades</option>
                  <option value="PRESENCIAL">Presencial</option>
                  <option value="SEMIPRESENCIAL">Semipresencial</option>
                  <option value="EN LINEA">En Línea</option>
                  <option value="HIBRIDA">Híbrida</option>
                  <option value="DUAL">Dual</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* 4. Filtro Estado */}
              <div className="relative">
                <select
                  value={filtroEstado}
                  onChange={e => setFiltroEstado(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-lg pl-3 pr-7 py-2 font-medium text-slate-700 hover:border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#0099e6] transition cursor-pointer appearance-none"
                >
                  <option value="TODOS">Todos los estados</option>
                  <option value="ACTIVA">Activa</option>
                  <option value="INACTIVA">Inactiva</option>
                  <option value="DISPONIBLES">Disponibles</option>
                  <option value="NO_DISPONIBLES">No Disponibles</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* 5. Filtro Carrera (ej. DESARROLLO DE SOFTWARE) */}
              <div className="relative">
                <select
                  value={filtroCarreraListado}
                  onChange={e => setFiltroCarreraListado(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-lg pl-3 pr-7 py-2 font-semibold text-slate-700 hover:border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#0099e6] transition cursor-pointer appearance-none max-w-[210px] truncate"
                >
                  <option value="TODAS">Todas las Carreras</option>
                  {carrerasList.map(c => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* 6. Filtro Nivel (ej. Nivel 1) */}
              <div className="relative">
                <select
                  value={filtroNivelListado}
                  onChange={e => setFiltroNivelListado(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-lg pl-3 pr-7 py-2 font-medium text-slate-700 hover:border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#0099e6] transition cursor-pointer appearance-none"
                >
                  <option value="TODOS">Todos los Niveles</option>
                  {['Nivel 1', 'Nivel 2', 'Nivel 3', 'Nivel 4', 'Nivel 5', 'Nivel 6'].map(n => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* 7. Botón Exportar Excel Verde */}
              <button
                type="button"
                onClick={handleExportarExcelDisponibilidad}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer ml-auto"
                title="Exportar catálogo filtrado a Excel (.xlsx)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Exportar Excel</span>
              </button>

              {/* 8. Botón Recargar */}
              <button
                type="button"
                onClick={() => onRefresh?.()}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 rounded-lg transition cursor-pointer border border-slate-200"
                title="Recargar catálogo de asignaturas"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Fila 2: Botón + Nueva Asignatura (azul) y Botón Eliminar Todos (rojo) */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2">
                {/* Botón + Nueva Asignatura */}
                <button
                  type="button"
                  onClick={() => setIsModalNuevaAsignaturaOpen(true)}
                  className="px-3.5 py-2 bg-[#0099e6] hover:bg-[#008bd1] text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Nueva Asignatura</span>
                </button>

                {/* Botón Eliminar Todos */}
                <button
                  type="button"
                  onClick={() => setIsModalEliminarTodosOpen(true)}
                  className="px-3.5 py-2 bg-[#e11d48] hover:bg-[#be123c] text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Eliminar Todos</span>
                </button>
              </div>

              {/* Indicador de Estado Congelado / Fixed con Pin Toggle */}
              <div className="flex items-center gap-2.5 text-xs">
                <button
                  type="button"
                  onClick={() => setIsHeaderFixed(!isHeaderFixed)}
                  className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition ${
                    isHeaderFixed
                      ? 'bg-purple-50 text-purple-900 border-purple-200 shadow-2xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                  title="Fijar o desfijar las opciones y el encabezado superior"
                >
                  <Pin className={`w-3.5 h-3.5 ${isHeaderFixed ? 'text-purple-700' : 'text-slate-400'}`} />
                  <span>{isHeaderFixed ? 'Opciones y Encabezado Fixed (Congelado)' : 'Fijar Opciones'}</span>
                </button>

                <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
                  Mostrando <strong className="text-slate-900">{totalItems === 0 ? 0 : (safeCurrentPage - 1) * numericPageSize + 1} - {Math.min(safeCurrentPage * numericPageSize, totalItems)}</strong> de <strong className="text-slate-900">{totalItems}</strong> registros
                </span>
              </div>
            </div>
          </div>

          {/* TABLA PRINCIPAL DE ASIGNATURAS DISPONIBLES Y NO DISPONIBLES - ENCABEZADO CONGELADO / FIXED */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto max-h-[70vh] overflow-y-auto">
              <table className="w-full border-collapse text-xs text-left">
                <thead className={`${isHeaderFixed ? 'sticky top-0 z-20 shadow-xs' : ''} bg-slate-900 text-white`}>
                  <tr className="bg-slate-900 text-white border-b border-slate-800">
                    <th className="py-3 px-3 text-center font-bold text-slate-400 w-12 sticky top-0 bg-slate-900 z-10">#</th>
                    <th className="py-3 px-3 font-bold text-slate-200 w-28 sticky top-0 bg-slate-900 z-10">Código</th>
                    <th className="py-3 px-4 font-bold text-white min-w-[200px] sticky top-0 bg-slate-900 z-10">Nombre de la Asignatura</th>
                    <th className="py-3 px-3 font-bold text-slate-200 min-w-[170px] sticky top-0 bg-slate-900 z-10">Carrera</th>
                    <th className="py-3 px-3 font-bold text-slate-200 min-w-[140px] sticky top-0 bg-slate-900 z-10">Escuela</th>
                    <th className="py-3 px-3 text-center font-bold text-slate-200 w-24 sticky top-0 bg-slate-900 z-10">Nivel</th>
                    <th className="py-3 px-3 text-center font-bold text-slate-200 w-28 sticky top-0 bg-slate-900 z-10">Modalidad</th>
                    <th className="py-3 px-3 text-center font-bold text-slate-200 w-28 sticky top-0 bg-slate-900 z-10">Horas / Créd.</th>
                    <th className="py-3 px-3 text-center font-bold text-slate-200 w-36 sticky top-0 bg-slate-900 z-10">
                      Disponibilidad
                    </th>
                    <th className="py-3 px-4 font-bold text-slate-200 min-w-[200px] sticky top-0 bg-slate-900 z-10">
                      Diagnóstico y Detalle
                    </th>
                    <th className="py-3 px-3 text-center font-bold text-slate-300 w-28 sticky top-0 bg-slate-900 z-10">Acción</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {paginatedAsignaturas.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-12 text-center text-slate-400">
                        <BookOpen className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                        <p className="text-sm font-semibold text-slate-600">No se encontraron asignaturas con los filtros seleccionados.</p>
                        <p className="text-xs text-slate-400 mt-1">Prueba modificando la búsqueda o el filtro de escuela, carrera o nivel.</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedAsignaturas.map((item, idx) => {
                      const globalIndex = (safeCurrentPage - 1) * numericPageSize + idx + 1;
                      return (
                        <tr 
                          key={item.id} 
                          className={`hover:bg-purple-50/20 transition-colors ${
                            !item.disponible ? 'bg-rose-50/15' : ''
                          }`}
                        >
                          {/* 1. Nº */}
                          <td className="py-3 px-3 text-center font-mono text-slate-400 font-bold">
                            {globalIndex}
                          </td>

                          {/* 2. Código */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] border ${
                              item.disponible
                                ? 'bg-slate-100 text-slate-800 border-slate-200'
                                : 'bg-rose-100 text-rose-800 border-rose-300 font-black'
                            }`}>
                              {item.codigo}
                            </span>
                          </td>

                          {/* 3. Nombre */}
                          <td className="py-3 px-4 font-bold text-slate-900">
                            <div className="flex items-center gap-1.5">
                              <span className="truncate">{item.nombre}</span>
                            </div>
                          </td>

                          {/* 4. Carrera */}
                          <td className="py-3 px-3 text-slate-700 font-medium whitespace-nowrap">
                            <span className="inline-block bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[10px] font-bold border border-slate-200 truncate max-w-[180px]">
                              {item.carrera_nombre}
                            </span>
                          </td>

                          {/* 5. Escuela */}
                          <td className="py-3 px-3 text-slate-700 whitespace-nowrap">
                            <span className="inline-block bg-indigo-50 text-indigo-800 px-2 py-0.5 rounded text-[10.5px] font-mono font-bold border border-indigo-200">
                              {item.escuela_label}
                            </span>
                          </td>

                          {/* 6. Nivel */}
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <span className="bg-purple-50 text-purple-800 font-black px-2 py-0.5 rounded text-[10px] border border-purple-200 font-mono">
                              {item.nivel_nombre}
                            </span>
                          </td>

                          {/* 7. Modalidad */}
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <span className="bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded text-[10px] border border-slate-200">
                              {item.modalidad}
                            </span>
                          </td>

                          {/* 8. Horas / Créditos */}
                          <td className="py-3 px-3 text-center font-mono whitespace-nowrap">
                            <span className="font-bold text-slate-800">{item.horas_totales}h</span>
                            <span className="text-[10px] text-slate-400 ml-1 font-normal">({item.creditos} cr.)</span>
                          </td>

                          {/* 9. Disponibilidad: 🟢 DISPONIBLE / 🔴 NO DISPONIBLE */}
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            {item.disponible ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-emerald-50 text-emerald-700 border-emerald-300">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                DISPONIBLE
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-rose-100 text-rose-800 border-rose-300 font-black">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                NO DISPONIBLE
                              </span>
                            )}
                          </td>

                          {/* 10. Diagnóstico y Detalle */}
                          <td className="py-3 px-4 text-xs">
                            <div className="flex items-center gap-1.5">
                              {item.disponible ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              ) : (
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                              )}
                              <span className={`text-[11px] ${
                                item.disponible ? 'text-slate-600' : 'text-rose-700 font-semibold'
                              }`}>
                                {item.motivo}
                              </span>
                            </div>
                          </td>

                          {/* 11. Acción rápida: Cargar a Matriz y Eliminar individual */}
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleCargarAsignaturaAMatriz(item)}
                                className={`px-2 py-1 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                                  item.disponible
                                    ? 'bg-purple-900 hover:bg-purple-950 text-white shadow-2xs'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                                }`}
                                title={`Cargar ${item.nombre} a la matriz de planificación`}
                              >
                                <Plus className="w-3 h-3" />
                                <span>Cargar</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setDeletingAsignaturaItem(item)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                                title={`Eliminar ${item.nombre}`}
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

            {/* CONTROL DE PAGINACIÓN CADA 10 REGISTROS (Requerimiento Principal) */}
            <PaginationControls
              currentPage={safeCurrentPage}
              totalItems={totalItems}
              pageSize={pageSize}
              pageSizeOptions={[10, 15, 20, 25, 40, 'all']}
              itemName="asignaturas"
              onPageChange={newPage => setCurrentPage(newPage)}
              onPageSizeChange={newSize => {
                setPageSize(newSize);
                setCurrentPage(1);
              }}
              showPageSizeSelector={true}
              className="border-t border-slate-200 rounded-none rounded-b-2xl"
            />
          </div>
        </div>
      )}

      {/* =========================================================================
          SUB-VISTA 2: MATRIZ DE PLANIFICACIÓN Y REGISTRO POR NIVEL
      ========================================================================= */}
      {activeSubTab === 'matriz' && (
        <div className="space-y-4">
          {/* SELECTORES SUPERIORES (SEDE, ESCUELA, JORNADA, CARRERA, NIVEL) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* 1. SEDE */}
            <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-purple-700" />
                <span>Sede</span>
              </label>
              <div className="relative">
                <select
                  value={selectedSede}
                  onChange={e => setSelectedSede(e.target.value)}
                  className="w-full pl-2.5 pr-7 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-200 appearance-none cursor-pointer"
                >
                  {sedesList.map(sede => (
                    <option key={sede} value={sede}>
                      {sede}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-purple-600 absolute right-2.5 top-2 pointer-events-none" />
              </div>
            </div>

            {/* 2. ESCUELA */}
            <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                <School className="w-3.5 h-3.5 text-purple-700" />
                <span>Escuela</span>
              </label>
              <div className="relative">
                <select
                  value={selectedEscuela}
                  onChange={e => setSelectedEscuela(e.target.value)}
                  className="w-full pl-2.5 pr-7 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-200 appearance-none cursor-pointer"
                >
                  {escuelasList.map(esc => (
                    <option key={esc} value={esc}>
                      {esc}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-purple-600 absolute right-2.5 top-2 pointer-events-none" />
              </div>
            </div>

            {/* 3. JORNADA */}
            <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-purple-700" />
                <span>Jornada</span>
              </label>
              <div className="relative">
                <select
                  value={selectedJornada}
                  onChange={e => setSelectedJornada(e.target.value)}
                  className="w-full pl-2.5 pr-7 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-200 appearance-none cursor-pointer"
                >
                  {jornadasList.map(jornada => (
                    <option key={jornada} value={jornada}>
                      {jornada}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-purple-600 absolute right-2.5 top-2 pointer-events-none" />
              </div>
            </div>

            {/* 4. CARRERA */}
            <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5 text-purple-700" />
                <span>Carrera</span>
              </label>
              <div className="relative">
                <select
                  value={selectedCarrera}
                  onChange={e => setSelectedCarrera(e.target.value)}
                  className="w-full pl-2.5 pr-7 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-200 appearance-none cursor-pointer truncate"
                >
                  {carrerasList.map(carrera => (
                    <option key={carrera} value={carrera}>
                      {carrera}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-purple-600 absolute right-2.5 top-2 pointer-events-none" />
              </div>
            </div>

            {/* 5. NIVEL */}
            <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-purple-700" />
                <span>Nivel</span>
              </label>
              <div className="relative">
                <select
                  value={selectedNivel}
                  onChange={e => setSelectedNivel(e.target.value)}
                  className="w-full pl-2.5 pr-7 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-purple-900 font-mono focus:outline-none focus:ring-2 focus:ring-purple-200 appearance-none cursor-pointer"
                >
                  {nivelesList.map(nivel => (
                    <option key={nivel} value={nivel}>
                      {nivel}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-purple-600 absolute right-2.5 top-2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* BARRA RÁPIDA: ASIGNATURAS DISPONIBLES DE ESTE NIVEL */}
          <div className="bg-gradient-to-r from-purple-50 via-indigo-50/50 to-white border border-purple-200 rounded-xl p-3 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs font-black text-slate-900 uppercase tracking-tight">
                  Asignaturas Disponibles para {selectedCarrera} ({selectedNivel}):
                </span>
                <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.2 rounded-full text-[10px] font-bold">
                  {asignaturasDisponiblesNivelActual.filter(a => a.disponible).length} Disponibles
                </span>
              </div>
              <span className="text-[10px] text-slate-500">
                Haz clic en una asignatura para insertarla directamente en la tabla
              </span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {asignaturasDisponiblesNivelActual.length === 0 ? (
                <span className="text-xs text-slate-400 italic">No hay asignaturas registradas específicamente para este nivel en el catálogo.</span>
              ) : (
                asignaturasDisponiblesNivelActual.map(asigItem => (
                  <button
                    key={asigItem.id}
                    type="button"
                    onClick={() => handleAddFila(asigItem.nombre, asigItem.codigo)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer border ${
                      asigItem.disponible
                        ? 'bg-white hover:bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs hover:scale-[1.02]'
                        : 'bg-rose-50 text-rose-800 border-rose-300 opacity-80'
                    }`}
                    title={asigItem.motivo}
                  >
                    <span>{asigItem.disponible ? '🟢' : '🔴'}</span>
                    <span className="font-mono text-[10px] font-bold">{asigItem.codigo}</span>
                    <span className="truncate max-w-[160px]">{asigItem.nombre}</span>
                    <Plus className="w-3 h-3 text-slate-500" />
                  </button>
                ))
              )}
            </div>
          </div>

          {/* BARRA DE HERRAMIENTAS Y ACCIONES DE REGISTRO */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 sm:p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                Registros Activos:
                <span className="bg-purple-900 text-white font-mono text-[11px] px-2 py-0.5 rounded-md font-bold">
                  {filas.length} FILAS
                </span>
              </span>
              <span className="text-slate-300 hidden sm:inline">|</span>
              <span className="text-[11px] text-slate-500 hidden md:inline">
                <span className="font-bold text-slate-700">Regla de Captura:</span> Solo se permite digitar en <b>Asignatura</b> y <b>Número de Estudiantes</b>. Las columnas institucionales y <span className="font-bold text-rose-700">Aulas no disponibles</span> permanecen bloqueadas.
              </span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap self-end sm:self-auto">
              {/* Botón Guardar Registros */}
              <button
                onClick={handleGuardarRegistros}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                title="Guardar los registros digitados en la memoria del sistema"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Guardar Registros</span>
              </button>

              {/* Botón Agregar Fila */}
              <button
                onClick={() => handleAddFila()}
                className="px-3 py-1.5 bg-[#1f0533] hover:bg-[#390b5a] active:bg-[#4f107c] text-[#e5a800] hover:text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                title="Agregar una nueva fila de registro para digitar"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Agregar Fila</span>
              </button>

              {/* Botón Cargar Sugerencias */}
              <button
                onClick={handleResetSugerencias}
                className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-medium transition flex items-center gap-1 cursor-pointer"
                title="Cargar asignaturas oficiales correspondientes a este nivel"
              >
                <RotateCcw className="w-3 h-3 text-slate-500" />
                <span className="hidden sm:inline">Sugerir Asignaturas</span>
              </button>

              {/* Botón Exportar Excel */}
              <button
                onClick={handleExportarExcelMatriz}
                className="p-1.5 bg-white border border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 rounded-lg text-xs transition cursor-pointer"
                title="Exportar esta tabla a Excel (.xlsx)"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              </button>
            </div>
          </div>

          {/* Datalist para sugerencias de autocompletado en Asignatura */}
          <datalist id="lista-asignaturas-sugeridas">
            {asignaturas.map((asig, i) => (
              <option key={`${asig.nombre}-${i}`} value={asig.nombre} />
            ))}
          </datalist>

          {/* TABLA DE REGISTROS DE LA MATRIZ */}
          <div className="bg-white border-2 border-slate-400 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs text-left">
                {/* ENCABEZADOS DE LA TABLA */}
                <thead>
                  <tr className="border-b-2 border-slate-400 bg-white">
                    <th className="py-3 px-3 text-center border-r-2 border-slate-400 font-black text-slate-900 text-sm w-12 select-none">
                      Nº
                    </th>
                    <th className="py-3 px-3 text-center border-r-2 border-slate-400 font-bold text-slate-800 text-xs w-28 select-none">
                      Sede
                    </th>
                    <th className="py-3 px-3 text-center border-r-2 border-slate-400 font-bold text-slate-800 text-xs w-24 select-none">
                      Escuela
                    </th>
                    <th className="py-3 px-4 text-center border-r-2 border-slate-400 font-bold text-slate-800 text-xs min-w-[200px] select-none">
                      Carrera
                    </th>
                    <th className="py-3 px-3 text-center border-r-2 border-slate-400 font-bold text-slate-800 text-xs w-24 select-none">
                      Nivel
                    </th>
                    <th className="py-2.5 px-3 text-center border-r-2 border-slate-400 min-w-[260px]">
                      <div className="inline-flex items-center justify-between gap-2 px-3 py-1 bg-white border border-slate-300 rounded-full shadow-2xs font-bold text-slate-900 text-xs cursor-default">
                        <span className="flex items-center gap-1.5">
                          <Pencil className="w-3 h-3 text-purple-600" />
                          <span>Asignatura</span>
                        </span>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </th>
                    <th className="py-2.5 px-3 text-center border-r-2 border-slate-400 min-w-[180px]">
                      <div className="inline-flex items-center justify-between gap-2 px-3 py-1 bg-white border border-slate-300 rounded-full shadow-2xs font-bold text-slate-900 text-xs cursor-default">
                        <span className="flex items-center gap-1.5">
                          <Pencil className="w-3 h-3 text-emerald-600" />
                          <span>Numero de Estudiantes</span>
                        </span>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </th>
                    <th className="py-3 px-3 text-center border-r-2 border-slate-400 font-bold text-slate-800 text-xs w-28 select-none">
                      Jornada
                    </th>
                    <th className="py-3 px-3 text-center border-r border-slate-400 font-bold text-rose-800 text-xs w-36 select-none bg-rose-50/40">
                      <div className="flex items-center justify-center gap-1.5">
                        <DoorClosed className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        <span>Aulas no disponibles</span>
                        <Lock className="w-2.5 h-2.5 text-rose-500 opacity-80" />
                      </div>
                    </th>
                    <th className="py-3 px-2 text-center font-bold text-slate-500 text-[10px] w-12 select-none">
                      Acción
                    </th>
                  </tr>
                </thead>

                {/* CUERPO DE LA TABLA (FILAS DE REGISTROS) */}
                <tbody className="divide-y border-b border-slate-400">
                  {filas.map((fila, index) => {
                    const aulaNoDisponibleTexto = fila.aulas_no_disponibles || getUnavailableAulaForRow(index);
                    const asigEncontrada = listaAsignaturasDisponibilidad.find(a => 
                      a.nombre.toUpperCase() === fila.asignatura.trim().toUpperCase()
                    );

                    return (
                      <tr key={fila.id} className="hover:bg-purple-50/20 transition-colors">
                        {/* 1. Nº - Solo lectura */}
                        <td className="py-2.5 px-3 text-center border-r-2 border-slate-400 font-mono font-bold text-slate-800 text-xs bg-slate-50/60 select-none">
                          {index + 1}
                        </td>

                        {/* 2. Sede - Bloqueado */}
                        <td className="py-2.5 px-3 text-center border-r-2 border-slate-400 font-bold text-slate-700 bg-slate-50/60 select-none">
                          <div className="flex items-center justify-center gap-1" title="Campo bloqueado">
                            <span>{selectedSede}</span>
                            <Lock className="w-2.5 h-2.5 text-slate-400 opacity-60" />
                          </div>
                        </td>

                        {/* 3. Escuela - Bloqueado */}
                        <td className="py-2.5 px-3 text-center border-r-2 border-slate-400 font-bold text-slate-700 bg-slate-50/60 select-none">
                          <div className="flex items-center justify-center gap-1" title="Campo bloqueado">
                            <span>{selectedEscuela}</span>
                            <Lock className="w-2.5 h-2.5 text-slate-400 opacity-60" />
                          </div>
                        </td>

                        {/* 4. Carrera - Bloqueado */}
                        <td className="py-2.5 px-3 text-center border-r-2 border-slate-400 font-bold text-slate-800 bg-slate-50/60 select-none">
                          <div className="flex items-center justify-center gap-1 truncate" title="Campo bloqueado">
                            <span className="truncate">{selectedCarrera}</span>
                            <Lock className="w-2.5 h-2.5 text-slate-400 opacity-60 shrink-0" />
                          </div>
                        </td>

                        {/* 5. Nivel - Bloqueado */}
                        <td className="py-2.5 px-3 text-center border-r-2 border-slate-400 font-black text-purple-900 bg-slate-50/60 select-none">
                          <div className="flex items-center justify-center gap-1" title="Campo bloqueado">
                            <span>{selectedNivel}</span>
                            <Lock className="w-2.5 h-2.5 text-purple-400 opacity-60" />
                          </div>
                        </td>

                        {/* 6. Asignatura - EDITABLE / PERMITE DIGITAR + INDICADOR DE DISPONIBILIDAD */}
                        <td className="py-1.5 px-2.5 border-r-2 border-slate-400 bg-white">
                          <div className="space-y-1">
                            <div className="relative">
                              <input
                                type="text"
                                list="lista-asignaturas-sugeridas"
                                value={fila.asignatura}
                                onChange={e => handleCellChange(fila.id, 'asignatura', e.target.value)}
                                placeholder="Digitar asignatura..."
                                className="w-full px-2.5 py-1.5 bg-amber-50/30 hover:bg-amber-50/60 focus:bg-white border border-amber-300 focus:border-purple-600 rounded-lg text-xs font-bold text-slate-900 uppercase focus:outline-none focus:ring-2 focus:ring-purple-200 transition"
                              />
                            </div>
                            {fila.asignatura.trim() && (
                              <div className="flex items-center justify-between text-[10px]">
                                {asigEncontrada ? (
                                  asigEncontrada.disponible ? (
                                    <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                      DISPONIBLE
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-rose-700 font-bold bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                      NO DISPONIBLE
                                    </span>
                                  )
                                ) : (
                                  <span className="text-slate-400 italic">Nueva asignatura digitada</span>
                                )}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* 7. Numero de Estudiantes - EDITABLE / PERMITE DIGITAR */}
                        <td className="py-1.5 px-2.5 border-r-2 border-slate-400 bg-white">
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              max="200"
                              value={fila.numero_estudiantes}
                              onChange={e => handleCellChange(fila.id, 'numero_estudiantes', e.target.value)}
                              placeholder="Nº est."
                              className="w-full px-2.5 py-1.5 bg-emerald-50/30 hover:bg-emerald-50/60 focus:bg-white border border-emerald-300 focus:border-emerald-600 rounded-lg text-xs font-black text-slate-900 font-mono text-center focus:outline-none focus:ring-2 focus:ring-emerald-200 transition"
                            />
                          </div>
                        </td>

                        {/* 8. Jornada - Bloqueado */}
                        <td className="py-2.5 px-3 text-center border-r-2 border-slate-400 font-bold text-slate-700 bg-slate-50/60 select-none">
                          <div className="flex items-center justify-center gap-1" title="Campo bloqueado">
                            <span>{selectedJornada}</span>
                            <Lock className="w-2.5 h-2.5 text-slate-400 opacity-60" />
                          </div>
                        </td>

                        {/* 9. AULAS NO DISPONIBLES - Bloqueado */}
                        <td className="py-2.5 px-3 text-center border-r border-slate-400 bg-rose-50/30 select-none">
                          <div className="flex items-center justify-center gap-1.5" title="Aula no disponible o fuera de servicio (C1, C2, C3, C4)">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-mono font-black text-rose-800 bg-rose-100/90 border border-rose-300 shadow-2xs">
                              {aulaNoDisponibleTexto}
                            </span>
                            <Lock className="w-2.5 h-2.5 text-rose-500 opacity-60 shrink-0" />
                          </div>
                        </td>

                        {/* Botón para remover fila */}
                        <td className="py-2.5 px-2 text-center bg-white">
                          <button
                            onClick={() => handleDeleteFila(fila.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                            title="Eliminar esta fila de registro"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* PIE DE TABLA DE LA MATRIZ */}
            <div className="p-3 bg-slate-50 border-t-2 border-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-3 text-slate-600 flex-wrap">
                <span className="flex items-center gap-1 font-semibold text-slate-800">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span>Columna <b>Asignatura</b>:</span>
                  <span className="text-emerald-700 font-bold">Editable (Permite digitar)</span>
                </span>
                <span className="flex items-center gap-1 font-semibold text-slate-800">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>Columna <b>Número de Estudiantes</b>:</span>
                  <span className="text-emerald-700 font-bold">Editable (Permite digitar)</span>
                </span>
                <span className="flex items-center gap-1 font-semibold text-rose-800">
                  <DoorClosed className="w-3 h-3 text-rose-600" />
                  <span>Columna <b>Aulas no disponibles</b>:</span>
                  <span className="text-rose-700 font-bold">Bloqueada (C1, C2, C3, C4 inactivos)</span>
                </span>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  onClick={() => handleAddFila()}
                  className="px-2.5 py-1 text-xs font-bold text-purple-900 hover:bg-purple-100 rounded-lg transition border border-purple-300 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Insertar Fila</span>
                </button>
                <button
                  onClick={handleGuardarRegistros}
                  className="px-3 py-1 text-xs font-bold text-white bg-purple-900 hover:bg-purple-950 rounded-lg transition flex items-center gap-1 shadow-2xs cursor-pointer"
                >
                  <Save className="w-3 h-3" />
                  <span>Guardar</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: NUEVA ASIGNATURA
      ========================================================================= */}
      {isModalNuevaAsignaturaOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-5 py-4 bg-gradient-to-r from-[#280740] to-[#390b5a] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#e5a800] text-[#280740] flex items-center justify-center font-bold">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Registrar Nueva Asignatura</h3>
                  <p className="text-[11px] text-purple-200">Ingreso al catálogo institucional de asignaturas</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalNuevaAsignaturaOpen(false)}
                className="p-1 rounded-lg text-purple-200 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNuevaAsignatura} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Código de Asignatura *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. SOF_101"
                    value={formAsignatura.codigo_asignatura}
                    onChange={e => setFormAsignatura({ ...formAsignatura, codigo_asignatura: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold focus:ring-2 focus:ring-[#0099e6] uppercase"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Carrera *</label>
                  <select
                    value={formAsignatura.id_carrera}
                    onChange={e => setFormAsignatura({ ...formAsignatura, id_carrera: Number(e.target.value) })}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-[#0099e6]"
                  >
                    {carreras.map(c => (
                      <option key={c.id_carrera} value={c.id_carrera}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nombre de la Asignatura *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. PROGRAMACIÓN ORIENTADA A OBJETOS"
                  value={formAsignatura.nombre}
                  onChange={e => setFormAsignatura({ ...formAsignatura, nombre: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold focus:ring-2 focus:ring-[#0099e6] uppercase"
                />
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">H. Docencia</label>
                  <input
                    type="number"
                    min="0"
                    value={formAsignatura.horas_docencia}
                    onChange={e => {
                      const hd = Number(e.target.value);
                      const tot = hd + Number(formAsignatura.horas_practicas) + Number(formAsignatura.horas_autonomas);
                      setFormAsignatura({ ...formAsignatura, horas_docencia: hd, horas_totales: tot });
                    }}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-center font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">H. Prácticas</label>
                  <input
                    type="number"
                    min="0"
                    value={formAsignatura.horas_practicas}
                    onChange={e => {
                      const hp = Number(e.target.value);
                      const tot = Number(formAsignatura.horas_docencia) + hp + Number(formAsignatura.horas_autonomas);
                      setFormAsignatura({ ...formAsignatura, horas_practicas: hp, horas_totales: tot });
                    }}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-center font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">H. Autónomas</label>
                  <input
                    type="number"
                    min="0"
                    value={formAsignatura.horas_autonomas}
                    onChange={e => {
                      const ha = Number(e.target.value);
                      const tot = Number(formAsignatura.horas_docencia) + Number(formAsignatura.horas_practicas) + ha;
                      setFormAsignatura({ ...formAsignatura, horas_autonomas: ha, horas_totales: tot });
                    }}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-center font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Total Horas</label>
                  <input
                    type="number"
                    value={formAsignatura.horas_totales}
                    readOnly
                    className="w-full px-2.5 py-1.5 bg-slate-100 border border-slate-300 rounded-lg text-xs text-center font-mono font-black text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Créditos</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={formAsignatura.creditos}
                    onChange={e => setFormAsignatura({ ...formAsignatura, creditos: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-center font-mono font-bold text-amber-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Estado</label>
                  <select
                    value={formAsignatura.estado}
                    onChange={e => setFormAsignatura({ ...formAsignatura, estado: e.target.value })}
                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-800"
                  >
                    <option value="ACTIVA">ACTIVA</option>
                    <option value="INACTIVA">INACTIVA</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalNuevaAsignaturaOpen(false)}
                  className="px-3.5 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingAsignatura}
                  className="px-4 py-2 rounded-lg bg-[#0099e6] hover:bg-[#008bd1] text-white font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSavingAsignatura ? 'Guardando...' : 'Guardar Asignatura'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: CONFIRMAR ELIMINAR TODOS
      ========================================================================= */}
      {isModalEliminarTodosOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-rose-200 shadow-2xl max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">¿Eliminar registros de asignaturas?</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Estás a punto de eliminar las asignaturas visibles en la página actual (<b>{paginatedAsignaturas.length}</b> registros). Esta acción no se puede deshacer.
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsModalEliminarTodosOpen(false)}
                className="px-3.5 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmEliminarTodos}
                disabled={isSavingAsignatura}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isSavingAsignatura ? 'Eliminando...' : `Sí, Eliminar (${paginatedAsignaturas.length})`}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: CONFIRMAR ELIMINAR INDIVIDUAL
      ========================================================================= */}
      {deletingAsignaturaItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-rose-200 shadow-2xl max-w-sm w-full p-5 space-y-3.5 animate-in fade-in zoom-in-95">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-4 h-4 text-rose-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">¿Eliminar Asignatura?</h3>
                <p className="text-xs text-slate-500 mt-1">
                  ¿Deseas eliminar la asignatura <b>{deletingAsignaturaItem.nombre}</b> ({deletingAsignaturaItem.codigo})?
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingAsignaturaItem(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmEliminarIndividual}
                className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition flex items-center gap-1 shadow-xs cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Eliminar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
