import React, { useState, useMemo, useEffect } from 'react';
import { Asignatura, PlanificacionCompleta, Carrera, Escuela, Nivel } from '../../types.ts';
import { ApiClient } from '../../controllers/apiClient.ts';
import { PaginationControls } from '../../components/common/PaginationControls.tsx';
import { ExportController } from '../../controllers/exportController.ts';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  RefreshCw, 
  BookOpen, 
  CheckCircle2, 
  X, 
  AlertTriangle,
  AlertCircle,
  Loader2,
  Download,
  Clock,
  Award,
  Eye,
  Users,
  Building2,
  Calendar,
  Layers,
  GraduationCap,
  ChevronDown,
  ChevronRight,
  List,
  FolderTree,
  Filter,
  Check,
  Pin,
  PinOff,
  FileSpreadsheet
} from 'lucide-react';

// Mapeo oficial de prefijos de códigos de asignaturas a carrera académica
export const CODIGO_CARRERA_MAP: Record<string, { id_carrera: number; nombre_carrera: string; codigo_carrera: string }> = {
  'DESF': { id_carrera: 1, nombre_carrera: 'DESARROLLO DE SOFTWARE', codigo_carrera: 'CAR-01' },
  'DES': { id_carrera: 1, nombre_carrera: 'DESARROLLO DE SOFTWARE', codigo_carrera: 'CAR-01' },
  'DSW': { id_carrera: 1, nombre_carrera: 'DESARROLLO DE SOFTWARE', codigo_carrera: 'CAR-01' },
  'SOF': { id_carrera: 1, nombre_carrera: 'DESARROLLO DE SOFTWARE', codigo_carrera: 'CAR-01' },
  'EIN': { id_carrera: 2, nombre_carrera: 'EDUCACIÓN INICIAL', codigo_carrera: 'CAR-02' },
  'EDU': { id_carrera: 2, nombre_carrera: 'EDUCACIÓN INICIAL', codigo_carrera: 'CAR-02' },
  'ELE': { id_carrera: 3, nombre_carrera: 'ELECTRICIDAD', codigo_carrera: 'CAR-03' },
  'ELC': { id_carrera: 3, nombre_carrera: 'ELECTRICIDAD', codigo_carrera: 'CAR-03' },
  'DEP': { id_carrera: 4, nombre_carrera: 'ENTRENAMIENTO DEPORTIVO', codigo_carrera: 'CAR-04' },
  'EDP': { id_carrera: 4, nombre_carrera: 'ENTRENAMIENTO DEPORTIVO', codigo_carrera: 'CAR-04' },
  'ODO': { id_carrera: 5, nombre_carrera: 'ODONTOLOGÍA', codigo_carrera: 'CAR-05' },
  'GAS': { id_carrera: 6, nombre_carrera: 'GASTRONOMÍA', codigo_carrera: 'CAR-06' },
  'GASU': { id_carrera: 7, nombre_carrera: 'GASTRONOMÍA UNIVERSITARIA', codigo_carrera: 'CAR-07' },
  'ENF': { id_carrera: 8, nombre_carrera: 'ENFERMERÍA', codigo_carrera: 'CAR-08' },
  'MEC': { id_carrera: 9, nombre_carrera: 'MECÁNICA AUTOMOTRIZ', codigo_carrera: 'CAR-09' },
  'AUT': { id_carrera: 9, nombre_carrera: 'MECÁNICA AUTOMOTRIZ', codigo_carrera: 'CAR-09' },
  'REFI': { id_carrera: 10, nombre_carrera: 'REHABILITACIÓN FÍSICA', codigo_carrera: 'CAR-10' },
  'REF': { id_carrera: 10, nombre_carrera: 'REHABILITACIÓN FÍSICA', codigo_carrera: 'CAR-10' },
  'CT': { id_carrera: 11, nombre_carrera: 'CONTABILIDAD Y TRIBUTACIÓN', codigo_carrera: 'CAR-11' },
  'CONT': { id_carrera: 12, nombre_carrera: 'TECNOLOGÍA SUPERIOR EN CONTABILIDAD', codigo_carrera: 'CAR-12' },
  'GTH': { id_carrera: 13, nombre_carrera: 'GESTIÓN DE TALENTO HUMANO', codigo_carrera: 'CAR-13' },
  'ATH': { id_carrera: 13, nombre_carrera: 'GESTIÓN DE TALENTO HUMANO', codigo_carrera: 'CAR-13' },
  'ADM': { id_carrera: 14, nombre_carrera: 'TECNOLOGÍA SUPERIOR EN ADMINISTRACIÓN', codigo_carrera: 'CAR-14' },
  'GP': { id_carrera: 14, nombre_carrera: 'TECNOLOGÍA SUPERIOR EN ADMINISTRACIÓN', codigo_carrera: 'CAR-14' },
  'MARK': { id_carrera: 15, nombre_carrera: 'TECNOLOGÍA SUPERIOR EN MARKETING', codigo_carrera: 'CAR-15' },
  'MKT': { id_carrera: 15, nombre_carrera: 'TECNOLOGÍA SUPERIOR EN MARKETING', codigo_carrera: 'CAR-15' },
  'EST': { id_carrera: 16, nombre_carrera: 'ESTÉTICA INTEGRAL', codigo_carrera: 'CAR-16' },
  'ESTU': { id_carrera: 17, nombre_carrera: 'ESTÉTICA INTEGRAL UNIVERSITARIA', codigo_carrera: 'CAR-17' }
};

export const DEFAULT_CARRERAS: Carrera[] = [
  { id_carrera: 1, id_escuela: 1, codigo: 'CAR-01', nombre: 'DESARROLLO DE SOFTWARE', titulo_otorgado: 'TECNÓLOGO SUPERIOR EN DESARROLLO DE SOFTWARE', modalidad: 'PRESENCIAL', duracion_niveles: 5, numero_semanas: 16, estado: 'ACTIVA' },
  { id_carrera: 2, id_escuela: 2, codigo: 'CAR-02', nombre: 'EDUCACIÓN INICIAL', titulo_otorgado: 'TECNÓLOGO SUPERIOR EN EDUCACIÓN INICIAL', modalidad: 'PRESENCIAL', duracion_niveles: 5, numero_semanas: 16, estado: 'ACTIVA' },
  { id_carrera: 3, id_escuela: 3, codigo: 'CAR-03', nombre: 'ELECTRICIDAD', titulo_otorgado: 'TECNÓLOGO SUPERIOR EN ELECTRICIDAD', modalidad: 'PRESENCIAL', duracion_niveles: 5, numero_semanas: 16, estado: 'ACTIVA' },
  { id_carrera: 4, id_escuela: 2, codigo: 'CAR-04', nombre: 'ENTRENAMIENTO DEPORTIVO', titulo_otorgado: 'TECNÓLOGO SUPERIOR EN ENTRENAMIENTO DEPORTIVO', modalidad: 'PRESENCIAL', duracion_niveles: 5, numero_semanas: 16, estado: 'ACTIVA' },
  { id_carrera: 5, id_escuela: 4, codigo: 'CAR-05', nombre: 'ODONTOLOGÍA', titulo_otorgado: 'TECNÓLOGO SUPERIOR EN ODONTOLOGÍA', modalidad: 'PRESENCIAL', duracion_niveles: 6, numero_semanas: 16, estado: 'ACTIVA' },
  { id_carrera: 6, id_escuela: 5, codigo: 'CAR-06', nombre: 'GASTRONOMÍA', titulo_otorgado: 'TECNÓLOGO SUPERIOR EN GASTRONOMÍA', modalidad: 'PRESENCIAL', duracion_niveles: 5, numero_semanas: 16, estado: 'ACTIVA' },
  { id_carrera: 7, id_escuela: 5, codigo: 'CAR-07', nombre: 'GASTRONOMÍA UNIVERSITARIA', titulo_otorgado: 'LICENCIADO EN GASTRONOMÍA', modalidad: 'PRESENCIAL', duracion_niveles: 8, numero_semanas: 16, estado: 'ACTIVA' },
  { id_carrera: 8, id_escuela: 4, codigo: 'CAR-08', nombre: 'ENFERMERÍA', titulo_otorgado: 'TECNÓLOGO SUPERIOR EN ENFERMERÍA', modalidad: 'PRESENCIAL', duracion_niveles: 5, numero_semanas: 16, estado: 'ACTIVA' },
  { id_carrera: 9, id_escuela: 3, codigo: 'CAR-09', nombre: 'MECÁNICA AUTOMOTRIZ', titulo_otorgado: 'TECNÓLOGO SUPERIOR EN MECÁNICA AUTOMOTRIZ', modalidad: 'PRESENCIAL', duracion_niveles: 5, numero_semanas: 16, estado: 'ACTIVA' },
  { id_carrera: 10, id_escuela: 4, codigo: 'CAR-10', nombre: 'REHABILITACIÓN FÍSICA', titulo_otorgado: 'TECNÓLOGO SUPERIOR EN REHABILITACIÓN FÍSICA', modalidad: 'PRESENCIAL', duracion_niveles: 5, numero_semanas: 16, estado: 'ACTIVA' },
  { id_carrera: 11, id_escuela: 6, codigo: 'CAR-11', nombre: 'CONTABILIDAD Y TRIBUTACIÓN', titulo_otorgado: 'TECNÓLOGO SUPERIOR EN CONTABILIDAD Y TRIBUTACIÓN', modalidad: 'PRESENCIAL', duracion_niveles: 5, numero_semanas: 16, estado: 'ACTIVA' },
  { id_carrera: 12, id_escuela: 6, codigo: 'CAR-12', nombre: 'TECNOLOGÍA SUPERIOR EN CONTABILIDAD', titulo_otorgado: 'TECNÓLOGO SUPERIOR EN CONTABILIDAD', modalidad: 'PRESENCIAL', duracion_niveles: 5, numero_semanas: 16, estado: 'ACTIVA' },
  { id_carrera: 13, id_escuela: 6, codigo: 'CAR-13', nombre: 'GESTIÓN DE TALENTO HUMANO', titulo_otorgado: 'TECNÓLOGO SUPERIOR EN GESTIÓN DE TALENTO HUMANO', modalidad: 'PRESENCIAL', duracion_niveles: 5, numero_semanas: 16, estado: 'ACTIVA' },
  { id_carrera: 14, id_escuela: 6, codigo: 'CAR-14', nombre: 'TECNOLOGÍA SUPERIOR EN ADMINISTRACIÓN', titulo_otorgado: 'TECNÓLOGO SUPERIOR EN ADMINISTRACIÓN', modalidad: 'PRESENCIAL', duracion_niveles: 5, numero_semanas: 16, estado: 'ACTIVA' },
  { id_carrera: 15, id_escuela: 6, codigo: 'CAR-15', nombre: 'TECNOLOGÍA SUPERIOR EN MARKETING', titulo_otorgado: 'TECNÓLOGO SUPERIOR EN MARKETING', modalidad: 'PRESENCIAL', duracion_niveles: 5, numero_semanas: 16, estado: 'ACTIVA' },
  { id_carrera: 16, id_escuela: 5, codigo: 'CAR-16', nombre: 'ESTÉTICA INTEGRAL', titulo_otorgado: 'TECNÓLOGO SUPERIOR EN ESTÉTICA INTEGRAL', modalidad: 'PRESENCIAL', duracion_niveles: 5, numero_semanas: 16, estado: 'ACTIVA' },
  { id_carrera: 17, id_escuela: 5, codigo: 'CAR-17', nombre: 'ESTÉTICA INTEGRAL UNIVERSITARIA', titulo_otorgado: 'LICENCIADO EN ESTÉTICA INTEGRAL', modalidad: 'PRESENCIAL', duracion_niveles: 8, numero_semanas: 16, estado: 'ACTIVA' }
];

interface AsignaturasCrudViewProps {
  asignaturas?: Asignatura[];
  planificaciones?: PlanificacionCompleta[];
  carreras?: Carrera[];
  escuelas?: Escuela[];
  niveles?: Nivel[];
  onRefresh: () => void;
}

export const AsignaturasCrudView: React.FC<AsignaturasCrudViewProps> = ({
  asignaturas = [],
  planificaciones = [],
  carreras = [],
  escuelas = [],
  niveles = [],
  onRefresh
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEscuela, setFilterEscuela] = useState<string>('TODAS');
  const [filterModalidad, setFilterModalidad] = useState<string>('TODAS');
  const [filterEstado, setFilterEstado] = useState<string>('TODOS');
  const [filterCarrera, setFilterCarrera] = useState<string>('TODAS');
  const [filterNivel, setFilterNivel] = useState<string>('TODOS');
  const [isHeaderFixed, setIsHeaderFixed] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number | 'all'>(10);
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState<boolean>(false);

  const [viewMode, setViewMode] = useState<'tabla' | 'carreras'>('tabla');
  const [expandedCarreras, setExpandedCarreras] = useState<Set<number>>(new Set());
  
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterEscuela, filterModalidad, filterEstado, filterCarrera, filterNivel]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAsignatura, setEditingAsignatura] = useState<Asignatura | null>(null);
  const [deleteConfirmAsignatura, setDeleteConfirmAsignatura] = useState<Asignatura | null>(null);
  const [selectedAsignaturaForDetail, setSelectedAsignaturaForDetail] = useState<Asignatura | null>(null);
  
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    codigo_asignatura: '',
    nombre: '',
    descripcion: '',
    horas_docencia: 64,
    horas_practicas: 32,
    horas_autonomas: 64,
    horas_totales: 160,
    creditos: 3.5,
    estado: 'ACTIVA',
    id_carrera: 1
  });

  // Lista definitiva de carreras (utiliza las provistas o el catálogo estándar institucional)
  const carrerasList = useMemo(() => {
    if (carreras && carreras.length > 0) return carreras;
    return DEFAULT_CARRERAS;
  }, [carreras]);

  // Función para determinar la carrera de una asignatura
  const getAsignaturaCarrera = (asig: Asignatura): { id_carrera: number; nombre: string; codigo: string } => {
    // 1. Si la asignatura ya tiene id_carrera explícito
    if (asig.id_carrera) {
      const c = carrerasList.find(item => item.id_carrera === asig.id_carrera);
      if (c) return { id_carrera: c.id_carrera, nombre: c.nombre, codigo: c.codigo };
    }

    // 2. Si existe en las planificaciones académicas
    const plan = (planificaciones || []).find(p => p.id_asignatura === asig.id_asignatura && p.id_carrera);
    if (plan && plan.id_carrera) {
      const carr = carrerasList.find(c => c.id_carrera === plan.id_carrera);
      if (carr) return { id_carrera: carr.id_carrera, nombre: carr.nombre, codigo: carr.codigo };
    }

    // 3. Resolución por prefijo de código institucional
    const code = (asig.codigo_asignatura || '').toUpperCase().trim();
    const prefix = code.split('_')[0] || '';
    if (CODIGO_CARRERA_MAP[prefix]) {
      const m = CODIGO_CARRERA_MAP[prefix];
      const carr = carrerasList.find(c => c.id_carrera === m.id_carrera);
      return { 
        id_carrera: m.id_carrera, 
        nombre: carr?.nombre || m.nombre_carrera, 
        codigo: carr?.codigo || m.codigo_carrera 
      };
    }

    for (const [k, m] of Object.entries(CODIGO_CARRERA_MAP)) {
      if (code.startsWith(k)) {
        const carr = carrerasList.find(c => c.id_carrera === m.id_carrera);
        return { 
          id_carrera: m.id_carrera, 
          nombre: carr?.nombre || m.nombre_carrera, 
          codigo: carr?.codigo || m.codigo_carrera 
        };
      }
    }

    return { id_carrera: 1, nombre: 'GASTRONOMIA', codigo: 'CAR-01' };
  };

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

  const getEscuelaAsignatura = (asig: Asignatura, carrName: string): { codigo: string; nombre: string; label: string } => {
    const carr = carrerasList.find(c => c.nombre.toUpperCase() === carrName.toUpperCase() || c.id_carrera === asig.id_carrera);
    if (carr && carr.id_escuela) {
      const esc = (escuelas || []).find(e => e.id_escuela === carr.id_escuela);
      if (esc) {
        return { codigo: esc.codigo, nombre: esc.nombre, label: `${esc.codigo} - ${esc.nombre}` };
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

  const getModalidadAsignatura = (asig: Asignatura, carrName: string): string => {
    const carr = carrerasList.find(c => c.nombre.toUpperCase() === carrName.toUpperCase() || c.id_carrera === asig.id_carrera);
    return carr?.modalidad || 'PRESENCIAL';
  };

  const getNivelAsignatura = (asig: Asignatura): { numero: number; nombre: string } => {
    const code = (asig.codigo_asignatura || '').toUpperCase();
    const match = code.match(/_?(\d)(\d\d)/);
    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      if (num >= 1 && num <= 8) return { numero: num, nombre: `Nivel ${num}` };
    }
    const plan = (planificaciones || []).find(p => p.id_asignatura === asig.id_asignatura || p.asignatura_codigo === asig.codigo_asignatura);
    if (plan && plan.id_nivel) {
      return { numero: plan.id_nivel, nombre: plan.nivel_nombre ? (plan.nivel_nombre.toLowerCase().includes('nivel') ? plan.nivel_nombre : `Nivel ${plan.id_nivel}`) : `Nivel ${plan.id_nivel}` };
    }
    const modulo = ((asig.id_asignatura - 1) % 5) + 1;
    return { numero: modulo, nombre: `Nivel ${modulo}` };
  };

  // Conteo de asignaturas por carrera
  const carreraCounts = useMemo(() => {
    const counts = new Map<number, number>();
    asignaturas.forEach(a => {
      const carr = getAsignaturaCarrera(a);
      counts.set(carr.id_carrera, (counts.get(carr.id_carrera) || 0) + 1);
    });
    return counts;
  }, [asignaturas, carrerasList, planificaciones]);

  // Calculate occurrences in planificaciones
  const asignaturaPlanMap = useMemo(() => {
    const map = new Map<number, number>();
    (planificaciones || []).forEach(p => {
      if (!p.id_asignatura) return;
      map.set(p.id_asignatura, (map.get(p.id_asignatura) || 0) + 1);
    });
    return map;
  }, [planificaciones]);

  // Filtrado de asignaturas por texto, estado, escuela, modalidad, nivel y carrera
  const filteredAsignaturas = useMemo(() => {
    return asignaturas.filter(a => {
      const carr = getAsignaturaCarrera(a);
      const esc = getEscuelaAsignatura(a, carr.nombre);
      const mod = getModalidadAsignatura(a, carr.nombre);
      const niv = getNivelAsignatura(a);

      const matchSearch = 
        a.codigo_asignatura.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        carr.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        esc.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.descripcion && a.descripcion.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchEstado = 
        filterEstado === 'TODOS' ? true : a.estado === filterEstado;

      const matchCarrera = 
        filterCarrera === 'TODAS' ? true : carr.id_carrera === Number(filterCarrera);

      const matchEscuela = 
        filterEscuela === 'TODAS' ? true : esc.codigo === filterEscuela || esc.label === filterEscuela;

      const matchModalidad = 
        filterModalidad === 'TODAS' ? true : mod.toUpperCase() === filterModalidad.toUpperCase();

      const matchNivel = 
        filterNivel === 'TODOS' ? true : niv.nombre.toUpperCase().replace(/\s+/g, '') === filterNivel.toUpperCase().replace(/\s+/g, '');

      return matchSearch && matchEstado && matchCarrera && matchEscuela && matchModalidad && matchNivel;
    });
  }, [asignaturas, searchTerm, filterEstado, filterCarrera, filterEscuela, filterModalidad, filterNivel, carrerasList, planificaciones, escuelas]);

  // Paginación calculada (cada 10 registros por defecto)
  const totalItems = filteredAsignaturas.length;
  const numericPageSize = pageSize === 'all' ? totalItems || 1 : pageSize;
  const totalPages = pageSize === 'all' ? 1 : Math.max(1, Math.ceil(totalItems / numericPageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedAsignaturas = useMemo(() => {
    if (pageSize === 'all') return filteredAsignaturas;
    const start = (safeCurrentPage - 1) * numericPageSize;
    return filteredAsignaturas.slice(start, start + numericPageSize);
  }, [filteredAsignaturas, safeCurrentPage, numericPageSize, pageSize]);

  // Agrupamiento por carrera para la vista desplegable
  const asignaturasPorCarrera = useMemo(() => {
    const grouped = new Map<number, { carrera: Carrera; asignaturas: Asignatura[]; totalHoras: number; totalCreditos: number }>();
    
    // Inicializar carreras activas
    carrerasList.forEach(c => {
      if (filterCarrera === 'TODAS' || c.id_carrera === Number(filterCarrera)) {
        grouped.set(c.id_carrera, {
          carrera: c,
          asignaturas: [],
          totalHoras: 0,
          totalCreditos: 0
        });
      }
    });

    // Distribuir asignaturas filtradas
    filteredAsignaturas.forEach(a => {
      const carrInfo = getAsignaturaCarrera(a);
      const group = grouped.get(carrInfo.id_carrera);
      if (group) {
        group.asignaturas.push(a);
        group.totalHoras += (a.horas_totales || 0);
        group.totalCreditos += (a.creditos || 0);
      }
    });

    return Array.from(grouped.values()).filter(g => filterCarrera !== 'TODAS' || g.asignaturas.length > 0 || searchTerm === '');
  }, [carrerasList, filteredAsignaturas, filterCarrera, searchTerm]);

  // Objeto de la carrera actualmente seleccionada en el filtro
  const selectedCarreraObj = useMemo(() => {
    if (filterCarrera === 'TODAS') return null;
    return carrerasList.find(c => c.id_carrera === Number(filterCarrera)) || null;
  }, [filterCarrera, carrerasList]);

  // Resumen numérico para la carrera seleccionada
  const carreraStats = useMemo(() => {
    const totalHoras = filteredAsignaturas.reduce((acc, curr) => acc + (curr.horas_totales || 0), 0);
    const totalCred = filteredAsignaturas.reduce((acc, curr) => acc + (curr.creditos || 0), 0);
    const activas = filteredAsignaturas.filter(a => a.estado === 'ACTIVA').length;
    return { totalHoras, totalCred, activas };
  }, [filteredAsignaturas]);

  const toggleCarreraAccordion = (carreraId: number) => {
    setExpandedCarreras(prev => {
      const next = new Set(prev);
      if (next.has(carreraId)) {
        next.delete(carreraId);
      } else {
        next.add(carreraId);
      }
      return next;
    });
  };

  const expandAllCarreras = () => {
    setExpandedCarreras(new Set(carrerasList.map(c => c.id_carrera)));
  };

  const collapseAllCarreras = () => {
    setExpandedCarreras(new Set());
  };

  const handleOpenCreate = () => {
    setEditingAsignatura(null);
    const defaultCarreraId = filterCarrera !== 'TODAS' ? Number(filterCarrera) : 1;
    const defaultCarrera = carrerasList.find(c => c.id_carrera === defaultCarreraId);
    const prefix = defaultCarrera ? Object.keys(CODIGO_CARRERA_MAP).find(k => CODIGO_CARRERA_MAP[k].id_carrera === defaultCarreraId) || 'ASIG' : 'ASIG';

    setFormData({
      codigo_asignatura: `${prefix}_`,
      nombre: '',
      descripcion: '',
      horas_docencia: 64,
      horas_practicas: 32,
      horas_autonomas: 64,
      horas_totales: 160,
      creditos: 3.5,
      estado: 'ACTIVA',
      id_carrera: defaultCarreraId
    });
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (a: Asignatura) => {
    const carr = getAsignaturaCarrera(a);
    setEditingAsignatura(a);
    setFormData({
      codigo_asignatura: a.codigo_asignatura,
      nombre: a.nombre,
      descripcion: a.descripcion || '',
      horas_docencia: a.horas_docencia || 0,
      horas_practicas: a.horas_practicas || 0,
      horas_autonomas: a.horas_autonomas || 0,
      horas_totales: a.horas_totales || 0,
      creditos: a.creditos || 0,
      estado: a.estado || 'ACTIVA',
      id_carrera: carr.id_carrera
    });
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleHoursChange = (field: 'horas_docencia' | 'horas_practicas' | 'horas_autonomas', val: number) => {
    const next = { ...formData, [field]: val };
    next.horas_totales = Number(next.horas_docencia || 0) + Number(next.horas_practicas || 0) + Number(next.horas_autonomas || 0);
    setFormData(next);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.codigo_asignatura.trim() || !formData.nombre.trim()) {
      setErrorMessage('Por favor ingresa el código y nombre de la asignatura.');
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage(null);

      const payload = {
        codigo_asignatura: formData.codigo_asignatura.toUpperCase().trim(),
        nombre: formData.nombre.toUpperCase().trim(),
        descripcion: formData.descripcion,
        horas_docencia: formData.horas_docencia,
        horas_practicas: formData.horas_practicas,
        horas_autonomas: formData.horas_autonomas,
        horas_totales: formData.horas_totales,
        creditos: formData.creditos,
        estado: formData.estado
      };

      if (editingAsignatura) {
        await ApiClient.updateCatalogItem('asignatura', editingAsignatura.id_asignatura, payload);
        // Vincular con la carrera seleccionada
        try {
          await fetch('/api/carrera-asignaturas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_carrera: formData.id_carrera, id_asignatura: editingAsignatura.id_asignatura })
          });
        } catch {
          // Si ya existe la relación, continúa
        }
        setSuccessMessage(`Asignatura "${payload.nombre}" actualizada con éxito.`);
      } else {
        const res = await ApiClient.createCatalogItem('asignatura', payload);
        if (res && res.id_asignatura) {
          try {
            await fetch('/api/carrera-asignaturas', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id_carrera: formData.id_carrera, id_asignatura: res.id_asignatura })
            });
          } catch {
            // Ignorar duplicados
          }
        }
        setSuccessMessage(`Asignatura "${payload.nombre}" registrada correctamente.`);
      }

      setIsModalOpen(false);
      onRefresh();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al guardar la asignatura');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleEstado = async (a: Asignatura) => {
    try {
      const nuevo = a.estado === 'ACTIVA' ? 'INACTIVA' : 'ACTIVA';
      await ApiClient.toggleCatalogItemEstado('asignatura', a.id_asignatura, nuevo);
      onRefresh();
      setSuccessMessage(`Estado de ${a.nombre} actualizado a ${nuevo}.`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Error al cambiar estado');
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmAsignatura) return;
    try {
      setIsSaving(true);
      await ApiClient.deleteCatalogItem('asignatura', deleteConfirmAsignatura.id_asignatura);
      setSuccessMessage(`Asignatura "${deleteConfirmAsignatura.nombre}" eliminada exitosamente.`);
      setDeleteConfirmAsignatura(null);
      onRefresh();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Error al eliminar asignatura');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Codigo', 'Asignatura', 'Carrera', 'Docencia (h)', 'Practicas (h)', 'Autonomas (h)', 'Total Horas', 'Creditos', 'Estado'];
    const rows = filteredAsignaturas.map(a => {
      const carr = getAsignaturaCarrera(a);
      return [
        `"${a.codigo_asignatura}"`,
        `"${a.nombre}"`,
        `"${carr.nombre}"`,
        a.horas_docencia,
        a.horas_practicas,
        a.horas_autonomas,
        a.horas_totales,
        a.creditos,
        `"${a.estado}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const carreraSuffix = selectedCarreraObj ? `_${selectedCarreraObj.codigo}` : '_todas';
    link.setAttribute('download', `catalogo_asignaturas${carreraSuffix}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {successMessage && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-xl animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Control Bar con Buscador, Escuelas, Modalidades, Estados, Carreras, Niveles, Exportar Excel y Acciones (Congelado/Fixed) */}
      <div className={`bg-white rounded-xl border border-slate-200 p-3.5 shadow-sm transition-all duration-200 ${
        isHeaderFixed ? 'sticky top-0 z-30 shadow-md backdrop-blur-md bg-white/95' : ''
      }`}>
        <div className="flex flex-col gap-3">
          {/* Fila 1: Filtros principales tal como aparecen en el diseño adjunto */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Buscador */}
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="input-buscar-asignatura"
                type="text"
                placeholder="Buscar por código, nombre o títu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-7 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#0099e6] transition placeholder:text-slate-400 shadow-2xs"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Dropdown Escuela */}
            <select
              id="filter-escuela-asignatura"
              value={filterEscuela}
              onChange={(e) => setFilterEscuela(e.target.value)}
              className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-2 font-medium text-slate-700 hover:border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#0099e6] transition cursor-pointer max-w-[190px] truncate shadow-2xs"
              title="Filtrar por Escuela"
            >
              <option value="TODAS">Todas las escuelas</option>
              {escuelasOptions.map(esc => (
                <option key={esc.codigo} value={esc.codigo}>
                  {esc.codigo} - {esc.nombre}
                </option>
              ))}
            </select>

            {/* Dropdown Modalidad */}
            <select
              id="filter-modalidad-asignatura"
              value={filterModalidad}
              onChange={(e) => setFilterModalidad(e.target.value)}
              className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-2 font-medium text-slate-700 hover:border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#0099e6] transition cursor-pointer shadow-2xs"
              title="Filtrar por Modalidad"
            >
              <option value="TODAS">Todas las modalidades</option>
              <option value="Presencial">Presencial</option>
              <option value="Semipresencial">Semipresencial</option>
              <option value="Híbrida">Híbrida</option>
              <option value="En Línea">En Línea</option>
              <option value="Dual">Dual</option>
            </select>

            {/* Dropdown Estado */}
            <select
              id="filter-estado-asignatura"
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-2 font-medium text-slate-700 hover:border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#0099e6] transition cursor-pointer shadow-2xs"
              title="Filtrar por Estado"
            >
              <option value="ACTIVA">Activa</option>
              <option value="INACTIVA">Inactiva</option>
              <option value="TODOS">Todos los estados</option>
            </select>

            {/* Dropdown Carrera */}
            <select
              id="filter-carrera-asignatura"
              value={filterCarrera}
              onChange={(e) => {
                const val = e.target.value;
                setFilterCarrera(val);
                if (val !== 'TODAS') {
                  setExpandedCarreras(new Set([Number(val)]));
                }
              }}
              className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-2 font-semibold text-slate-700 hover:border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#0099e6] transition cursor-pointer max-w-[210px] truncate shadow-2xs"
              title="Filtrar por Carrera"
            >
              <option value="TODAS">Todas las Carreras</option>
              {carrerasList.map((c) => (
                <option key={c.id_carrera} value={c.id_carrera}>
                  {c.nombre}
                </option>
              ))}
            </select>

            {/* Dropdown Nivel */}
            <select
              id="filter-nivel-asignatura"
              value={filterNivel}
              onChange={(e) => setFilterNivel(e.target.value)}
              className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-2 font-medium text-slate-700 hover:border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#0099e6] transition cursor-pointer max-w-[130px] shadow-2xs"
              title="Filtrar por Nivel"
            >
              <option value="TODOS">Todos los niveles</option>
              {niveles.map(n => (
                <option key={n.id_nivel} value={String(n.id_nivel)}>
                  {n.nombre}
                </option>
              ))}
            </select>

            {/* Botón Exportar Excel Verde */}
            <button
              type="button"
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition cursor-pointer"
              title="Exportar a formato Excel (.csv / .xlsx compatible)"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Exportar Excel</span>
            </button>

            {/* Botón Recargar */}
            <button
              type="button"
              onClick={onRefresh}
              className="p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-2xs transition cursor-pointer"
              title="Recargar catálogo de asignaturas"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Fila 2: Sub-acciones (+ Nueva Asignatura, Eliminar Todos, Congelar/Fijo toggle, Modos de vista) */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleOpenCreate}
                className="flex items-center gap-1.5 bg-[#0099e6] hover:bg-[#008bd1] text-white px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-xs transition cursor-pointer"
                title="Crear nueva asignatura"
              >
                <Plus className="w-4 h-4" />
                <span>+ Nueva Asignatura</span>
              </button>

              <button
                type="button"
                onClick={() => setIsDeleteAllModalOpen(true)}
                className="flex items-center gap-1.5 bg-[#e11d48] hover:bg-[#be123c] text-white px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-xs transition cursor-pointer"
                title="Eliminar asignaturas seleccionadas o del catálogo"
              >
                <Trash2 className="w-4 h-4" />
                <span>🗑 Eliminar Todos</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              {/* Botón Congelar / Fijar Controles */}
              <button
                type="button"
                onClick={() => setIsHeaderFixed(!isHeaderFixed)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition cursor-pointer ${
                  isHeaderFixed
                    ? 'bg-blue-50 text-[#0099e6] border-blue-200'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
                title={isHeaderFixed ? 'Descongelar barra y encabezados' : 'Congelar / Fijar barra y encabezados'}
              >
                {isHeaderFixed ? <Pin className="w-3.5 h-3.5 text-[#0099e6]" /> : <PinOff className="w-3.5 h-3.5 text-slate-400" />}
                <span className="hidden sm:inline">{isHeaderFixed ? 'Opciones Congeladas (Fixed)' : 'Congelar Opciones'}</span>
              </button>

              {/* Selector de modo de vista */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setViewMode('tabla')}
                  className={`px-2 py-1 rounded-md font-semibold flex items-center gap-1 transition ${
                    viewMode === 'tabla'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Vista de tabla continua con paginación"
                >
                  <List className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Tabla</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('carreras');
                    if (filterCarrera !== 'TODAS') {
                      setExpandedCarreras(new Set([Number(filterCarrera)]));
                    } else if (expandedCarreras.size === 0) {
                      setExpandedCarreras(new Set(carrerasList.map(c => c.id_carrera)));
                    }
                  }}
                  className={`px-2 py-1 rounded-md font-semibold flex items-center gap-1 transition ${
                    viewMode === 'carreras'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Desplegar asignaturas agrupadas por carrera"
                >
                  <FolderTree className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Por Carrera</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Banner Informativo cuando se filtra por una carrera específica */}
      {selectedCarreraObj && (
        <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-blue-50/90 border border-blue-200/90 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0099e6] to-blue-700 text-white flex items-center justify-center font-black shadow-xs shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-slate-900 text-sm">{selectedCarreraObj.nombre}</span>
                <span className="font-mono text-[11px] font-bold text-[#0099e6] bg-blue-100/90 px-2 py-0.5 rounded border border-blue-200">
                  {selectedCarreraObj.codigo}
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  • Modalidad {selectedCarreraObj.modalidad} ({selectedCarreraObj.duracion_niveles} niveles)
                </span>
              </div>
              <p className="text-slate-600 text-[11px] mt-0.5">
                Mostrando <strong className="text-slate-900">{filteredAsignaturas.length}</strong> asignaturas registradas para esta carrera • <strong className="text-slate-900">{carreraStats.totalHoras}</strong> horas lectivas totales • <strong className="text-slate-900">{carreraStats.totalCred}</strong> créditos
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setFilterCarrera('TODAS')}
            className="text-xs text-blue-700 hover:text-blue-900 bg-white hover:bg-blue-100/80 font-bold px-3 py-1.5 rounded-lg border border-blue-200 transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer shadow-2xs"
          >
            <span>Ver Todas las Carreras</span>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* MODO 1: TABLA GENERAL FILTRADA POR CARRERA */}
      {viewMode === 'tabla' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs font-medium text-slate-600">
            <div className="flex items-center gap-2">
              <span>
                Mostrando página <strong>{currentPage}</strong> de <strong>{totalPages || 1}</strong> ({filteredAsignaturas.length} registros encontrados)
              </span>
              {filterCarrera !== 'TODAS' && selectedCarreraObj && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0099e6] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                  <GraduationCap className="w-3 h-3" />
                  {selectedCarreraObj.nombre}
                </span>
              )}
            </div>
            <span className="text-[11px] text-slate-500">
              Paginación: <strong>{pageSize} registros por página</strong>
            </span>
          </div>

          <div className="overflow-x-auto max-h-[680px]">
            <table className="w-full text-left text-xs border-collapse">
              <thead className={isHeaderFixed ? 'sticky top-0 z-20' : ''}>
                <tr className="bg-slate-900 text-white font-bold uppercase tracking-wider text-[10.5px]">
                  <th className="py-3 px-3 w-10 text-center text-slate-400">#</th>
                  <th className="py-3 px-3">Código</th>
                  <th className="py-3 px-3.5">Nombre de la Asignatura</th>
                  <th className="py-3 px-3.5">Carrera</th>
                  <th className="py-3 px-3.5">Escuela</th>
                  <th className="py-3 px-3 text-center">Nivel</th>
                  <th className="py-3 px-3 text-center">Modalidad</th>
                  <th className="py-3 px-3 text-center">Horas / Créd.</th>
                  <th className="py-3 px-3 text-center">Disponibilidad</th>
                  <th className="py-3 px-3.5">Diagnóstico y Detalle</th>
                  <th className="py-3 px-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedAsignaturas.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <BookOpen className="w-8 h-8 text-slate-300" />
                        <p className="font-semibold text-slate-600">No se encontraron asignaturas con los filtros seleccionados.</p>
                        {filterCarrera !== 'TODAS' && (
                          <button
                            type="button"
                            onClick={() => setFilterCarrera('TODAS')}
                            className="mt-1 text-xs text-[#0099e6] hover:underline font-bold"
                          >
                            Mostrar todas las carreras
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedAsignaturas.map((a, idx) => {
                    const planCount = asignaturaPlanMap.get(a.id_asignatura) || 0;
                    const carr = getAsignaturaCarrera(a);
                    const escuela = getEscuelaAsignatura(a, carr.nombre);
                    const modalidad = getModalidadAsignatura(a, carr.nombre);
                    const nivel = getNivelAsignatura(a);
                    const rowNumber = (currentPage - 1) * pageSize + idx + 1;

                    return (
                      <tr 
                        key={a.id_asignatura} 
                        onClick={() => setSelectedAsignaturaForDetail(a)}
                        className="hover:bg-blue-50/40 transition cursor-pointer group"
                      >
                        <td className="py-3 px-3 text-center text-slate-400 font-mono text-[11px]">
                          {rowNumber}
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-[#0099e6] whitespace-nowrap">
                          {a.codigo_asignatura}
                        </td>
                        <td className="py-3 px-3.5">
                          <div className="font-bold text-slate-900 group-hover:text-blue-900 leading-tight">
                            {a.nombre}
                          </div>
                          {a.descripcion && (
                            <div className="text-[11px] text-slate-500 truncate max-w-xs mt-0.5">
                              {a.descripcion}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3.5 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFilterCarrera(String(carr.id_carrera));
                            }}
                            className="inline-flex items-center gap-1 text-[10.5px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 hover:bg-blue-100 hover:text-blue-800 border border-slate-200 transition cursor-pointer"
                            title={`Filtrar únicamente por carrera ${carr.nombre}`}
                          >
                            <GraduationCap className="w-3 h-3 text-slate-500" />
                            <span>{carr.nombre}</span>
                          </button>
                        </td>
                        <td className="py-3 px-3.5 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {escuela.codigo} - {escuela.nombre}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap font-medium text-slate-700">
                          {nivel}
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap font-medium text-slate-700">
                          {modalidad}
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <div className="font-bold text-slate-800">{a.horas_totales || 0} hrs</div>
                          <div className="text-[10px] text-amber-600 font-semibold">{a.creditos || 0} créd.</div>
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          {planCount > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                              {planCount} en curso
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Disponible
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3.5">
                          <div className="text-[11px] text-slate-600 max-w-xs truncate">
                            {planCount > 0 
                              ? `Asignada en ${planCount} paralelo(s) del periodo actual.` 
                              : `Sin conflicto de horarios. Lista para asignación de aula.`}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right whitespace-nowrap" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => setSelectedAsignaturaForDetail(a)}
                              className="px-2 py-1 bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                              title="Ver ficha técnica y paralelos"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Ficha</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(a)}
                              className="p-1.5 text-slate-600 hover:text-[#0099e6] hover:bg-blue-50 rounded-md transition cursor-pointer"
                              title="Editar asignatura"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmAsignatura(a)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition cursor-pointer"
                              title="Eliminar asignatura"
                            >
                              <Trash2 className="w-4 h-4" />
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

          {/* Paginación cada 10 registros por defecto */}
          <div className="border-t border-slate-200 bg-white">
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredAsignaturas.length}
              pageSize={pageSize}
              pageSizeOptions={[10, 20, 50, 100]}
              onPageChange={setCurrentPage}
              onPageSizeChange={(sz) => {
                setPageSize(sz);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>
      )}

      {/* MODO 2: DESPLEGAR ASIGNATURAS AGRUPADAS POR CARRERA (Acordeón expandible) */}
      {viewMode === 'carreras' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-white px-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-600">
            <span className="font-semibold">
              Mostrando <strong>{asignaturasPorCarrera.length}</strong> carreras académicas ({filteredAsignaturas.length} asignaturas totales)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={expandAllCarreras}
                className="text-xs font-semibold text-[#0099e6] hover:underline cursor-pointer"
              >
                Expandir Todas
              </button>
              <span className="text-slate-300">|</span>
              <button
                type="button"
                onClick={collapseAllCarreras}
                className="text-xs font-semibold text-slate-500 hover:underline cursor-pointer"
              >
                Colapsar Todas
              </button>
            </div>
          </div>

          {asignaturasPorCarrera.map(group => {
            const isExpanded = expandedCarreras.has(group.carrera.id_carrera);

            return (
              <div 
                key={group.carrera.id_carrera}
                className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden transition"
              >
                {/* Cabecera Desplegable de Carrera */}
                <div 
                  onClick={() => toggleCarreraAccordion(group.carrera.id_carrera)}
                  className="p-3.5 bg-slate-50/80 hover:bg-blue-50/40 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-[#0099e6] flex items-center justify-center font-bold shrink-0">
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-sm">{group.carrera.nombre}</span>
                        <span className="font-mono text-[11px] font-bold text-[#0099e6] bg-blue-100/70 px-2 py-0.5 rounded border border-blue-200">
                          {group.carrera.codigo}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          ({group.carrera.modalidad})
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {group.carrera.titulo_otorgado || 'Título tecnológico oficial'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto text-xs">
                    <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg font-bold text-slate-700 shadow-2xs">
                      {group.asignaturas.length} asignaturas
                    </span>
                    <span className="px-2.5 py-1 bg-blue-50 border border-blue-200 text-blue-900 rounded-lg font-bold">
                      {group.totalHoras} hrs
                    </span>
                    <span className="px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg font-bold flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-amber-500" />
                      {group.totalCreditos.toFixed(1)} cred.
                    </span>
                  </div>
                </div>

                {/* Contenido desplegado de las asignaturas de la carrera */}
                {isExpanded && (
                  <div className="overflow-x-auto">
                    {group.asignaturas.length === 0 ? (
                      <div className="py-6 text-center text-slate-400 text-xs">
                        No hay materias asignadas a esta carrera con los filtros actuales.
                      </div>
                    ) : (
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-100 bg-white text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                            <th className="py-2.5 px-3.5">Código</th>
                            <th className="py-2.5 px-3.5">Asignatura</th>
                            <th className="py-2.5 px-3.5 text-center">H. Docencia</th>
                            <th className="py-2.5 px-3.5 text-center">H. Prácticas</th>
                            <th className="py-2.5 px-3.5 text-center">H. Autónomas</th>
                            <th className="py-2.5 px-3.5 text-center">Total Horas</th>
                            <th className="py-2.5 px-3.5 text-center">Créditos</th>
                            <th className="py-2.5 px-3.5 text-center">Estado</th>
                            <th className="py-2.5 px-3.5 text-right">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {group.asignaturas.map(a => {
                            const isActiva = a.estado === 'ACTIVA';
                            const planCount = asignaturaPlanMap.get(a.id_asignatura) || 0;

                            return (
                              <tr 
                                key={a.id_asignatura}
                                onClick={() => setSelectedAsignaturaForDetail(a)}
                                className="hover:bg-slate-50 transition cursor-pointer group"
                              >
                                <td className="py-2.5 px-3.5 font-mono font-bold text-[#0099e6] whitespace-nowrap">
                                  {a.codigo_asignatura}
                                </td>
                                <td className="py-2.5 px-3.5 font-bold text-slate-900 group-hover:text-blue-900">
                                  <div>{a.nombre}</div>
                                  {planCount > 0 && (
                                    <span className="text-[10.5px] text-blue-600 font-medium inline-flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {planCount} paralelos activos
                                    </span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3.5 text-center font-mono text-slate-700">
                                  {a.horas_docencia}h
                                </td>
                                <td className="py-2.5 px-3.5 text-center font-mono text-slate-700">
                                  {a.horas_practicas}h
                                </td>
                                <td className="py-2.5 px-3.5 text-center font-mono text-slate-700">
                                  {a.horas_autonomas}h
                                </td>
                                <td className="py-2.5 px-3.5 text-center font-bold text-slate-800">
                                  {a.horas_totales} hrs
                                </td>
                                <td className="py-2.5 px-3.5 text-center font-bold text-amber-600">
                                  {a.creditos}
                                </td>
                                <td className="py-2.5 px-3.5 text-center" onClick={e => e.stopPropagation()}>
                                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10.5px] font-bold ${
                                    isActiva ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                                  }`}>
                                    {a.estado}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3.5 text-right whitespace-nowrap" onClick={e => e.stopPropagation()}>
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => setSelectedAsignaturaForDetail(a)}
                                      className="px-2 py-1 bg-purple-50 text-purple-800 hover:bg-purple-100 rounded text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                      <span>Ficha</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEdit(a)}
                                      className="p-1 text-slate-500 hover:text-[#0099e6] rounded transition cursor-pointer"
                                    >
                                      <Edit className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setDeleteConfirmAsignatura(a)}
                                      className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Crear / Editar Asignatura (Con Selector de Carrera) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-gradient-to-r from-[#0099e6] to-[#008bd1] text-white p-4.5 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  <span>{editingAsignatura ? 'Editar Asignatura' : 'Nueva Asignatura'}</span>
                </h3>
                <p className="text-xs text-blue-100 mt-0.5">
                  Especifica la carrera, código curricular y horas académicas
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4">
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Selector de Carrera en el Modal */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Carrera Académica *
                </label>
                <select
                  value={formData.id_carrera}
                  onChange={(e) => {
                    const cid = Number(e.target.value);
                    const prefix = Object.keys(CODIGO_CARRERA_MAP).find(k => CODIGO_CARRERA_MAP[k].id_carrera === cid) || 'ASIG';
                    setFormData({
                      ...formData,
                      id_carrera: cid,
                      codigo_asignatura: !editingAsignatura ? `${prefix}_` : formData.codigo_asignatura
                    });
                  }}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0099e6] focus:bg-white focus:outline-hidden font-medium"
                >
                  {carrerasList.map(c => (
                    <option key={c.id_carrera} value={c.id_carrera}>
                      {c.nombre} ({c.codigo})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Código de Asignatura *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. DESF_L101"
                    value={formData.codigo_asignatura}
                    onChange={(e) => setFormData({ ...formData, codigo_asignatura: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0099e6] focus:bg-white focus:outline-hidden font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Créditos Académicos
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder="Ej. 3.5"
                    value={formData.creditos}
                    onChange={(e) => setFormData({ ...formData, creditos: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0099e6] focus:bg-white focus:outline-hidden"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nombre de la Asignatura *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. LENGUAJE DE PROGRAMACIÓN I"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0099e6] focus:bg-white focus:outline-hidden uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Horas Docencia (H.D.)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.horas_docencia}
                    onChange={(e) => handleHoursChange('horas_docencia', Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0099e6] focus:bg-white focus:outline-hidden font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Horas Prácticas (H.P.)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.horas_practicas}
                    onChange={(e) => handleHoursChange('horas_practicas', Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0099e6] focus:bg-white focus:outline-hidden font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Horas Autónomas (H.A.)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.horas_autonomas}
                    onChange={(e) => handleHoursChange('horas_autonomas', Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0099e6] focus:bg-white focus:outline-hidden font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Total Horas (Auto)
                  </label>
                  <input
                    type="number"
                    readOnly
                    value={formData.horas_totales}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-100 border border-slate-200 rounded-lg font-bold text-slate-800 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Descripción Curricular (Opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Resumen o sílabo de la materia..."
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0099e6] focus:bg-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Estado
                </label>
                <div className="flex items-center gap-4 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                    <input
                      type="radio"
                      name="estado_asig"
                      value="ACTIVA"
                      checked={formData.estado === 'ACTIVA'}
                      onChange={() => setFormData({ ...formData, estado: 'ACTIVA' })}
                      className="text-[#0099e6] focus:ring-[#0099e6]"
                    />
                    <span>ACTIVA</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                    <input
                      type="radio"
                      name="estado_asig"
                      value="INACTIVA"
                      checked={formData.estado === 'INACTIVA'}
                      onChange={() => setFormData({ ...formData, estado: 'INACTIVA' })}
                      className="text-[#0099e6] focus:ring-[#0099e6]"
                    />
                    <span>INACTIVA</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 text-xs sm:text-sm font-bold text-white bg-[#0099e6] hover:bg-[#008bd1] rounded-lg shadow-xs transition disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? 'Guardando...' : editingAsignatura ? 'Actualizar Asignatura' : 'Guardar Asignatura'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmAsignatura && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-5 border border-slate-100">
            <div className="w-11 h-11 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">¿Eliminar Asignatura?</h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Estás a punto de eliminar <strong>{deleteConfirmAsignatura.nombre}</strong> ({deleteConfirmAsignatura.codigo_asignatura}).
            </p>
            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteConfirmAsignatura(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSaving}
                className="px-3.5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? 'Eliminando...' : 'Sí, Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ficha / Detalle Completo de la Asignatura Modal */}
      {selectedAsignaturaForDetail && (() => {
        const detailCarrera = getAsignaturaCarrera(selectedAsignaturaForDetail);
        const assignedPlans = (planificaciones || []).filter(
          p => p.id_asignatura === selectedAsignaturaForDetail.id_asignatura
        );

        return (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] shadow-2xl overflow-hidden border border-slate-100 flex flex-col animate-in fade-in zoom-in-95 duration-150">
              {/* Header con información de la carrera */}
              <div className="bg-gradient-to-r from-[#1f0533] to-[#3a0a60] text-white p-5 flex items-center justify-between border-b-2 border-[#e5a800]">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#e5a800] text-[#1f0533] font-black text-xl flex items-center justify-center shadow-md shrink-0">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/20 text-[#e5a800] uppercase tracking-wider">
                        Ficha Curricular
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30 flex items-center gap-1">
                        <GraduationCap className="w-3 h-3" />
                        {detailCarrera.nombre} ({detailCarrera.codigo})
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        selectedAsignaturaForDetail.estado === 'ACTIVA' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                      }`}>
                        ● {selectedAsignaturaForDetail.estado}
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-white mt-0.5">
                      {selectedAsignaturaForDetail.nombre}
                    </h3>
                    <p className="text-xs text-purple-200">
                      Código: <span className="font-mono font-bold text-white">{selectedAsignaturaForDetail.codigo_asignatura}</span> • {selectedAsignaturaForDetail.creditos} Créditos Académicos
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedAsignaturaForDetail(null)}
                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-6">
                {/* Desglose Horario y Créditos */}
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-[#e5a800]" />
                    <span>Estructura Horaria y Componentes de Aprendizaje</span>
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200 text-center">
                      <span className="text-[10px] uppercase font-bold text-blue-600 block">Docencia</span>
                      <span className="font-mono font-black text-blue-900 text-lg">{selectedAsignaturaForDetail.horas_docencia}h</span>
                    </div>
                    <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-200 text-center">
                      <span className="text-[10px] uppercase font-bold text-indigo-600 block">Prácticas</span>
                      <span className="font-mono font-black text-indigo-900 text-lg">{selectedAsignaturaForDetail.horas_practicas}h</span>
                    </div>
                    <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 text-center">
                      <span className="text-[10px] uppercase font-bold text-amber-600 block">Autónomas</span>
                      <span className="font-mono font-black text-amber-900 text-lg">{selectedAsignaturaForDetail.horas_autonomas}h</span>
                    </div>
                    <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-200 text-center">
                      <span className="text-[10px] uppercase font-bold text-purple-600 block">Total Horas</span>
                      <span className="font-mono font-black text-purple-900 text-lg">{selectedAsignaturaForDetail.horas_totales}h</span>
                    </div>
                  </div>
                </div>

                {/* Descripción */}
                {selectedAsignaturaForDetail.descripcion && (
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
                      Descripción / Sinopsis
                    </h4>
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 leading-relaxed">
                      {selectedAsignaturaForDetail.descripcion}
                    </div>
                  </div>
                )}

                {/* Cursos y Docentes asignados */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-[#e5a800]" />
                      <span>Cursos y Docentes Asignados en Periodo Actual</span>
                    </h4>
                    <span className="px-2.5 py-1 bg-purple-50 border border-purple-200 text-purple-800 rounded-lg font-bold text-xs">
                      {assignedPlans.length} Paralelos Dictándose
                    </span>
                  </div>

                  {assignedPlans.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
                      Esta asignatura no tiene paralelos ni horarios asignados en el periodo lectivo actual.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {assignedPlans.map((plan, idx) => (
                        <div 
                          key={idx}
                          className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-purple-300 transition"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-sm">
                                {plan.docente_nombres} {plan.docente_apellidos}
                              </span>
                              <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded border border-indigo-200">
                                Paralelo {plan.paralelo_codigo}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500">
                              {plan.carrera_nombre} • Nivel {plan.nivel_nombre || plan.id_nivel} • {plan.jornada_nombre || plan.jornada_codigo}
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="px-2.5 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-lg font-bold flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-amber-600" />
                              <span>{plan.dia_semana || 'Lunes'}</span>
                            </span>
                            <span className="px-2.5 py-1 bg-blue-50 text-blue-900 border border-blue-200 rounded-lg font-mono font-bold flex items-center gap-1">
                              <Clock className="w-3 h-3 text-blue-600" />
                              <span>{plan.hora_inicio} - {plan.hora_fin}</span>
                            </span>
                            <span className="px-2.5 py-1 bg-purple-50 text-purple-900 border border-purple-200 rounded-lg font-bold flex items-center gap-1">
                              <Building2 className="w-3 h-3 text-purple-600" />
                              <span>{plan.aula_codigo} ({plan.bloque_nombre || 'Bloque A'})</span>
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Malla Curricular Institucional ISUJ
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const asig = selectedAsignaturaForDetail;
                      setSelectedAsignaturaForDetail(null);
                      handleOpenEdit(asig);
                    }}
                    className="px-4 py-2 bg-[#0099e6] hover:bg-[#008bd1] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Editar Asignatura</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedAsignaturaForDetail(null)}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal Confirmación de Eliminar Todos */}
      {isDeleteAllModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 text-rose-600 mb-4">
              <div className="p-3 bg-rose-100 rounded-xl">
                <Trash2 className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Eliminar Asignaturas</h3>
                <p className="text-xs text-slate-500">Acción de borrado masivo o selectivo</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              ¿Está seguro que desea eliminar las asignaturas actualmente filtradas (<strong>{filteredAsignaturas.length}</strong> registradas)? 
              Esta operación eliminará del catálogo los registros que no tengan horarios o paralelos activos dependientes.
            </p>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs mb-4 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Para proteger la integridad de datos, las materias con paralelos o cursos activos no serán eliminadas.</span>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsDeleteAllModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    setIsSaving(true);
                    let deletedCount = 0;
                    for (const a of filteredAsignaturas) {
                      const planCount = asignaturaPlanMap.get(a.id_asignatura) || 0;
                      if (planCount === 0) {
                        try {
                          await ApiClient.deleteCatalogItem('asignatura', a.id_asignatura);
                          deletedCount++;
                        } catch {
                          // Omitir si tiene restricciones
                        }
                      }
                    }
                    setIsDeleteAllModalOpen(false);
                    onRefresh();
                    setSuccessMessage(`Se procesó el borrado de ${deletedCount} asignaturas sin dependencias.`);
                    setTimeout(() => setSuccessMessage(null), 4000);
                  } catch (err: any) {
                    alert(err.message || 'Error al eliminar');
                  } finally {
                    setIsSaving(false);
                  }
                }}
                disabled={isSaving}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Confirmar Eliminación</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
