import React, { useState, useMemo, useEffect } from 'react';
import { Docente, PlanificacionCompleta, Carrera } from '../../types.ts';
import { ApiClient } from '../../controllers/apiClient.ts';
import { DEFAULT_CARRERAS } from './AsignaturasCrudView.tsx';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  RefreshCw, 
  UserCheck, 
  UserX, 
  Mail, 
  Phone, 
  Briefcase, 
  GraduationCap, 
  X, 
  AlertTriangle,
  Download,
  CheckCircle2,
  Clock,
  Eye,
  Building2,
  Calendar,
  Layers,
  List,
  FolderTree,
  ChevronDown,
  ChevronRight,
  Filter,
  Check,
  Award
} from 'lucide-react';

// Mapeo oficial de los 50 docentes de la institución a su carrera académica de adscripción
export const DOCENTE_CARRERA_MAP: Record<number, number> = {
  // CAR-01: GASTRONOMIA
  1: 1,   // MARIO FERNANDO FAJARDO VANEGAS (Matemática Financiera Gastronomía / Plan 1)
  3: 1,   // ANDREA LORENA PAZMIÑO MENDOZA (Licenciada en Gastronomía)
  9: 1,   // ALEX DAVID CEVALLOS ANGOS (Chef Ejecutivo Internacional)
  20: 1,  // CRISTOPHER MIHAIL TUFIÑO PAREDES (Nutricionista Dietista)
  32: 1,  // KARELYS MIROSLAVA RECALDE LLANOS (Nutricionista Clínica)

  // CAR-02: GESTION DEL TALENTO HUMANO
  2: 2,   // EDISON ALEXIS TOAPANTA MURILLO (Ingeniero en Talento Humano / Plan 2)
  10: 2,  // JESSICA VANESSA LEIVA MONTALVO (Psicóloga Organizacional)
  34: 2,  // JORGE ROBERTO QUISHPE RIERA (Sociólogo e Ingeniero)
  40: 2,  // DIANA BEATRIZ VALENCIA JUMA (Psicóloga Clínica)
  47: 2,  // RUTH ISABEL GALLEGOS MONTERO (Consultora de RRHH)

  // CAR-03: ADMINISTRACION DE EMPRESAS
  4: 3,   // FREDDY ENRIQUE RUANO CALDERON (Magíster en Administración)
  38: 3,  // MARÍA JOSÉ MACÍAS BÓSQUEZ (Abogada Corporativa)
  42: 3,  // LORENA ANABEL RIVADENEIRA HERRERA (Especialista en Bioética y Emprendimiento)

  // CAR-04: ODONTOLOGIA
  6: 4,   // MARIA DOLORES GILER ALVAREZ (Doctora en Odontología / Plan 3)
  7: 4,   // MESIAS GEOVANNY NARANJO ARMIJO (Especialista en Bioseguridad)
  11: 4,  // JULIA STEFANIA IDROBO PAREDES (Odontóloga Especialista)

  // CAR-05: DESARROLLO DE SOFTWARE
  21: 5,  // GENARO NICOLAS AVILES ESTEVEZ (Ingeniero Mecánico y Estadístico)
  31: 5,  // MANUEL ESTEBAN CARRERA ERAZO (Especialista en Innovación)
  41: 5,  // ROBERTO LENIN RIVADENEIRA HERRERA (Ingeniero en Sistemas de Información / Plan 5)
  48: 5,  // DIEGO MAURICIO TUZO FLORES (Matemático Aplicado)
  49: 5,  // JAVIER FERNANDO BALDEÓN CEPEDA (Ingeniero Automotriz y Metrólogo)

  // CAR-06: MARKETING
  12: 6,  // MARIA BELEN MAFLA BUSTOS (Máster en Marketing Digital)
  33: 6,  // IVÁN DARÍO ORDÓÑEZ YÉPEZ (Analista de Investigación de Mercados)

  // CAR-07: CONTABILIDAD Y AUDITORIA
  5: 7,   // JOSE GABRIEL CEDEÑO VERA (Economista y Auditor)
  30: 7,  // ISMAEL GUSTAVO CONRADO CARVAJAL (Magíster en Contabilidad y Finanzas)

  // CAR-08: CONTABILIDAD Y TRIBUTACION
  8: 8,   // GERMAN RAMIRO MORILLO REINOSO (Contador Público Autorizado / Plan 4)
  35: 8,  // JOHANA PAOLA MORENO ANDRANGO (Contadora Tributaria)

  // CAR-09: ENFERMERIA
  13: 9,  // STHEFANNI CAROLINA GOMEZ VALLEJOS (Licenciada en Enfermería)
  14: 9,  // HENRRY MARIANO ZAMBRANO SOTO (Bioquímico Farmacéutico)
  15: 9,  // CRISTIAN ANDRÉS GUERRERO ROSERO (Especialista en Salud Pública)
  16: 9,  // HENRY ISRAEL AUCANCELA MORA (Médico Cirujano / Plan 6)
  18: 9,  // DAYSI ESTEFANIA MASAPANTA CATOTA (Microbióloga)
  23: 9,  // JANETH ROSALIA RODRIGUEZ MENDOZA (Técnica Quirúrgica)
  43: 9,  // ANA BELEN LLORE QUEZADA (Enfermera Especialista en Cuidados Críticos)
  44: 9,  // GABRIELA ELIZABETH MORALES COLLAGUAZO (Pediatra de Enfermería)

  // CAR-10: ESTETICA
  17: 10, // VALERIA RAQUEL ANDRADE ORTEGA (Cosmiatra Médica)
  45: 10, // VILMA NATALIA CEPEDA LOPEZ (Diseñadora de Imagen Corporativa)

  // CAR-11: EDUCACION INICIAL
  26: 11, // ADRIANA ELIZABETH CEPEDA HERNANDEZ (Pedagoga Infantil)
  27: 11, // MARLENE MARINA NARANJO RECALDE (Docente de Matemáticas Iniciales)
  28: 11, // GUADALUPE LUCILA SUAREZ VASQUEZ (Licenciada en Ciencias de la Educación)
  29: 11, // SANDRA ELIZABETH RIVADENEIRA HERRERA (Psicóloga Infantil)
  36: 11, // DIANA ESTEFANIA MUÑOZ GUERRERO (Educadora Inicial)
  39: 11, // DENISSE VANESA OLIVO LALALEO (Investigadora Educativa)
  46: 11, // KARINA MICHELE FONSECA NARANJO (Especialista en Estrategias Lúdicas / Plan 8)

  // CAR-12: AUXILIAR EN TALENTO HUMANO
  25: 12, // IRINA ALEJANDRA CEPEDA MOSQUERA (Especialista en Desarrollo Humano)
  37: 12, // SIXTO HIPOLITO BACA PINTO (Abogado Laboralista)

  // CAR-13: GESTION PRESUPUESTARIA
  22: 13, // TELMO RUBEN AYALA PINTO (Auditor de Presupuestos)

  // CAR-14: REHABILITACION FISICA
  19: 14, // SANDY LIZETH ROMERO CANSINO (Morfofisióloga)
  24: 14, // IVONNE MARCELA TATAYO SIMBAÑA (Terapista Integral)
  50: 14  // ALEX JAVIER ATAHUALPA ALDAZ (Fisioterapeuta y Farmacólogo / Plan 7)
};

// Resolver la carrera a la que pertenece un docente
export function getDocenteCarreraId(d: Docente): number {
  if (d.id_carrera) return d.id_carrera;
  try {
    const saved = localStorage.getItem('docente_carrera_overrides');
    if (saved) {
      const overrides = JSON.parse(saved);
      if (overrides[d.id_docente]) return Number(overrides[d.id_docente]);
    }
  } catch {}
  if (DOCENTE_CARRERA_MAP[d.id_docente]) {
    return DOCENTE_CARRERA_MAP[d.id_docente];
  }
  const texto = `${d.titulo_academico || ''} ${d.especialidad || ''}`.toLowerCase();
  if (/software|sistemas|programac|inform/i.test(texto)) return 5;
  if (/odontolog|denta/i.test(texto)) return 4;
  if (/enferm|salud|quirúrg|cuidados|médic/i.test(texto)) return 9;
  if (/gastronom|chef|cocin|alimentos/i.test(texto)) return 1;
  if (/talento humano|rrhh|personal|recursos humanos/i.test(texto)) return 2;
  if (/market|mercad/i.test(texto)) return 6;
  if (/tribut/i.test(texto)) return 8;
  if (/contab|auditor|financ/i.test(texto)) return 7;
  if (/cosmiat|estétic|imagen/i.test(texto)) return 10;
  if (/educac|infantil|pedagog|lúdica/i.test(texto)) return 11;
  if (/rehabilit|terap|fisioterap|morfofis/i.test(texto)) return 14;
  if (/presupuest/i.test(texto)) return 13;
  return 1;
}

interface DocentesCrudViewProps {
  docentes?: Docente[];
  planificaciones?: PlanificacionCompleta[];
  carreras?: Carrera[];
  onRefresh: () => void;
}

export const DocentesCrudView: React.FC<DocentesCrudViewProps> = ({
  docentes = [],
  planificaciones = [],
  carreras = [],
  onRefresh
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<string>('TODOS');
  const [filterContrato, setFilterContrato] = useState<string>('TODOS');
  const [filterCarrera, setFilterCarrera] = useState<string>('TODAS');
  const [viewMode, setViewMode] = useState<'tabla' | 'carrera'>('tabla');
  const [expandedCarreras, setExpandedCarreras] = useState<Record<number, boolean>>({});

  // Sobrescrituras manuales guardadas en localStorage
  const [carreraOverrides, setCarreraOverrides] = useState<Record<number, number>>(() => {
    try {
      const saved = localStorage.getItem('docente_carrera_overrides');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDocente, setEditingDocente] = useState<Docente | null>(null);
  const [deleteConfirmDocente, setDeleteConfirmDocente] = useState<Docente | null>(null);
  const [selectedDocenteForDetail, setSelectedDocenteForDetail] = useState<Docente | null>(null);

  // Loading & alerts
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Lista unificada de carreras
  const carrerasList: Carrera[] = useMemo(() => {
    return carreras && carreras.length > 0 ? carreras : DEFAULT_CARRERAS;
  }, [carreras]);

  // Form state
  const [formData, setFormData] = useState({
    ci: '',
    nombres: '',
    apellidos: '',
    correo: '',
    telefono: '',
    titulo_academico: '',
    especialidad: '',
    tipo_contrato: 'TIEMPO COMPLETO',
    estado: 'ACTIVO',
    id_carrera: 1
  });

  // Calculate assigned hours and subjects for each teacher
  const docenteHoursMap = useMemo(() => {
    const map = new Map<number, { hours: number; subjects: string[]; carreras: string[] }>();
    (planificaciones || []).forEach(p => {
      if (!p.id_docente) return;
      let h = 2;
      try {
        const [hIni, mIni] = p.hora_inicio.split(':').map(Number);
        const [hFin, mFin] = p.hora_fin.split(':').map(Number);
        h = Math.max(1, Math.round((hFin + mFin / 60) - (hIni + mIni / 60)));
      } catch {}

      const current = map.get(p.id_docente) || { hours: 0, subjects: [], carreras: [] };
      current.hours += h;
      if (p.asignatura_nombre && !current.subjects.includes(p.asignatura_nombre)) {
        current.subjects.push(p.asignatura_nombre);
      }
      if (p.carrera_nombre && !current.carreras.includes(p.carrera_nombre)) {
        current.carreras.push(p.carrera_nombre);
      }
      map.set(p.id_docente, current);
    });
    return map;
  }, [planificaciones]);

  // Resolver la carrera de un docente
  const getDocenteCarrera = useMemo(() => {
    return (d: Docente): Carrera => {
      // 1. Si tiene override local en el navegador
      if (carreraOverrides[d.id_docente]) {
        const found = carrerasList.find(c => c.id_carrera === carreraOverrides[d.id_docente]);
        if (found) return found;
      }

      // 2. Si el objeto docente trae id_carrera
      if (d.id_carrera) {
        const found = carrerasList.find(c => c.id_carrera === d.id_carrera);
        if (found) return found;
      }

      // 3. Si tiene clases asignadas en planificaciones
      const planDoc = (planificaciones || []).find(p => p.id_docente === d.id_docente && p.id_carrera);
      if (planDoc && planDoc.id_carrera) {
        const found = carrerasList.find(c => c.id_carrera === planDoc.id_carrera);
        if (found) return found;
      }

      // 4. Mapeo institucional oficial por ID de docente
      if (DOCENTE_CARRERA_MAP[d.id_docente]) {
        const targetId = DOCENTE_CARRERA_MAP[d.id_docente];
        const found = carrerasList.find(c => c.id_carrera === targetId);
        if (found) return found;
      }

      // 5. Inferencia por título o especialidad
      const texto = `${d.titulo_academico || ''} ${d.especialidad || ''}`.toLowerCase();
      if (/software|sistemas|programac|inform/i.test(texto)) {
        const c = carrerasList.find(x => x.id_carrera === 5);
        if (c) return c;
      }
      if (/odontolog|denta/i.test(texto)) {
        const c = carrerasList.find(x => x.id_carrera === 4);
        if (c) return c;
      }
      if (/enferm|salud|quirúrg|cuidados|médic/i.test(texto)) {
        const c = carrerasList.find(x => x.id_carrera === 9);
        if (c) return c;
      }
      if (/gastronom|chef|cocin|alimentos/i.test(texto)) {
        const c = carrerasList.find(x => x.id_carrera === 1);
        if (c) return c;
      }
      if (/talento humano|rrhh|personal|recursos humanos/i.test(texto)) {
        const c = carrerasList.find(x => x.id_carrera === 2);
        if (c) return c;
      }
      if (/market|mercad/i.test(texto)) {
        const c = carrerasList.find(x => x.id_carrera === 6);
        if (c) return c;
      }
      if (/contab|auditor|financ|tribut/i.test(texto)) {
        const c = carrerasList.find(x => x.id_carrera === 7 || x.id_carrera === 8);
        if (c) return c;
      }
      if (/cosmiat|estétic|imagen/i.test(texto)) {
        const c = carrerasList.find(x => x.id_carrera === 10);
        if (c) return c;
      }
      if (/educac|infantil|pedagog|lúdica/i.test(texto)) {
        const c = carrerasList.find(x => x.id_carrera === 11);
        if (c) return c;
      }
      if (/rehabilit|terap|fisioterap|morfofis/i.test(texto)) {
        const c = carrerasList.find(x => x.id_carrera === 14);
        if (c) return c;
      }
      if (/presupuest/i.test(texto)) {
        const c = carrerasList.find(x => x.id_carrera === 13);
        if (c) return c;
      }

      // Fallback
      return carrerasList[0] || DEFAULT_CARRERAS[0];
    };
  }, [carreraOverrides, carrerasList, planificaciones]);

  // Conteo de docentes por carrera
  const docentesPorCarreraCount = useMemo(() => {
    const counts: Record<number, number> = {};
    carrerasList.forEach(c => { counts[c.id_carrera] = 0; });
    docentes.forEach(d => {
      const carr = getDocenteCarrera(d);
      counts[carr.id_carrera] = (counts[carr.id_carrera] || 0) + 1;
    });
    return counts;
  }, [carrerasList, docentes, getDocenteCarrera]);

  // Filtered teachers
  const filteredDocentes = useMemo(() => {
    return docentes.filter(d => {
      const matchSearch = 
        d.ci.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.nombres.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.correo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.titulo_academico && d.titulo_academico.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (d.especialidad && d.especialidad.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchEstado = 
        filterEstado === 'TODOS' ? true : d.estado === filterEstado;

      const matchContrato = 
        filterContrato === 'TODOS' ? true : d.tipo_contrato === filterContrato;

      const carr = getDocenteCarrera(d);
      const matchCarrera = 
        filterCarrera === 'TODAS' ? true : carr.id_carrera === Number(filterCarrera);

      return matchSearch && matchEstado && matchContrato && matchCarrera;
    });
  }, [docentes, searchTerm, filterEstado, filterContrato, filterCarrera, getDocenteCarrera]);

  // Estructura agrupada para "Desplegar por Carrera"
  const carrerasAgrupadas = useMemo(() => {
    return carrerasList.map(carrera => {
      const docentesDeEstaCarrera = filteredDocentes.filter(d => getDocenteCarrera(d).id_carrera === carrera.id_carrera);
      const totalHoras = docentesDeEstaCarrera.reduce((acc, d) => {
        const info = docenteHoursMap.get(d.id_docente);
        return acc + (info ? info.hours : 0);
      }, 0);
      const activos = docentesDeEstaCarrera.filter(d => d.estado === 'ACTIVO').length;

      return {
        carrera,
        docentes: docentesDeEstaCarrera,
        totalHoras,
        activos
      };
    }).filter(group => {
      if (filterCarrera !== 'TODAS') {
        return group.carrera.id_carrera === Number(filterCarrera);
      }
      return true;
    });
  }, [carrerasList, filteredDocentes, getDocenteCarrera, docenteHoursMap, filterCarrera]);

  // Carrera seleccionada para el banner informativo
  const selectedCarreraInfo = useMemo(() => {
    if (filterCarrera === 'TODAS') return null;
    return carrerasList.find(c => c.id_carrera === Number(filterCarrera)) || null;
  }, [filterCarrera, carrerasList]);

  // Inicializar todos los acordeones abiertos al cambiar a modo carrera
  const toggleAllAccordions = (expand: boolean) => {
    const newState: Record<number, boolean> = {};
    carrerasList.forEach(c => {
      newState[c.id_carrera] = expand;
    });
    setExpandedCarreras(newState);
  };

  const toggleAccordion = (id_carrera: number) => {
    setExpandedCarreras(prev => ({
      ...prev,
      [id_carrera]: prev[id_carrera] === undefined ? false : !prev[id_carrera]
    }));
  };

  const handleOpenCreate = () => {
    setEditingDocente(null);
    const initialCarrera = filterCarrera !== 'TODAS' ? Number(filterCarrera) : 1;
    setFormData({
      ci: '',
      nombres: '',
      apellidos: '',
      correo: '',
      telefono: '',
      titulo_academico: '',
      especialidad: '',
      tipo_contrato: 'TIEMPO COMPLETO',
      estado: 'ACTIVO',
      id_carrera: initialCarrera
    });
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (docente: Docente) => {
    setEditingDocente(docente);
    const carr = getDocenteCarrera(docente);
    setFormData({
      ci: docente.ci,
      nombres: docente.nombres,
      apellidos: docente.apellidos,
      correo: docente.correo,
      telefono: docente.telefono || '',
      titulo_academico: docente.titulo_academico || '',
      especialidad: docente.especialidad || '',
      tipo_contrato: docente.tipo_contrato || 'TIEMPO COMPLETO',
      estado: docente.estado || 'ACTIVO',
      id_carrera: carr.id_carrera
    });
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.ci.trim() || !formData.nombres.trim() || !formData.apellidos.trim() || !formData.correo.trim()) {
      setErrorMessage('Por favor completa todos los campos requeridos (*).');
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage(null);

      let savedId: number;

      if (editingDocente) {
        await ApiClient.updateCatalogItem('docente', editingDocente.id_docente, formData);
        savedId = editingDocente.id_docente;
        setSuccessMessage(`Docente "${formData.nombres} ${formData.apellidos}" actualizado correctamente.`);
      } else {
        const created = await ApiClient.createCatalogItem('docente', formData);
        savedId = created?.id_docente || Date.now();
        setSuccessMessage(`Docente "${formData.nombres} ${formData.apellidos}" registrado con éxito.`);
      }

      // Guardar la adscripción a la carrera seleccionada
      if (formData.id_carrera) {
        const newOverrides = { ...carreraOverrides, [savedId]: formData.id_carrera };
        setCarreraOverrides(newOverrides);
        try {
          localStorage.setItem('docente_carrera_overrides', JSON.stringify(newOverrides));
        } catch {}
      }

      setIsModalOpen(false);
      onRefresh();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al guardar el docente');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleEstado = async (docente: Docente) => {
    try {
      const nuevo = docente.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
      await ApiClient.toggleCatalogItemEstado('docente', docente.id_docente, nuevo);
      onRefresh();
      setSuccessMessage(`Estado del docente actualizado a ${nuevo}.`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Error al cambiar estado');
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmDocente) return;
    try {
      setIsSaving(true);
      await ApiClient.deleteCatalogItem('docente', deleteConfirmDocente.id_docente);
      setSuccessMessage(`Docente "${deleteConfirmDocente.nombres} ${deleteConfirmDocente.apellidos}" eliminado correctamente.`);
      setDeleteConfirmDocente(null);
      onRefresh();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Error al eliminar el docente');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'CI',
      'Apellidos',
      'Nombres',
      'Correo Institucional',
      'Telefono',
      'Carrera Adscripcion',
      'Codigo Carrera',
      'Titulo Academico',
      'Especialidad',
      'Tipo Contrato',
      'Estado',
      'Horas Asignadas 2026-1'
    ];
    const rows = filteredDocentes.map(d => {
      const info = docenteHoursMap.get(d.id_docente);
      const carr = getDocenteCarrera(d);
      return [
        `"${d.ci}"`,
        `"${d.apellidos}"`,
        `"${d.nombres}"`,
        `"${d.correo}"`,
        `"${d.telefono || ''}"`,
        `"${carr.nombre}"`,
        `"${carr.codigo}"`,
        `"${d.titulo_academico || ''}"`,
        `"${d.especialidad || ''}"`,
        `"${d.tipo_contrato || ''}"`,
        `"${d.estado}"`,
        info ? info.hours : 0
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `catalogo_docentes_por_carrera_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Notifications */}
      {successMessage && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-xl animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Control Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
        {/* Search & Filters */}
        <div className="flex-1 flex flex-wrap items-center gap-2.5">
          {/* Buscador */}
          <div className="relative min-w-[240px] flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="search-docente-input"
              type="text"
              placeholder="Buscar por cédula, nombre, correo o especialidad..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#0099e6] focus:bg-white transition"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                title="Limpiar búsqueda"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filtro Estado */}
          <select
            id="filter-estado-docente"
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 font-medium text-slate-700 focus:outline-hidden cursor-pointer"
          >
            <option value="TODOS">Todos los estados</option>
            <option value="ACTIVO">Activos</option>
            <option value="INACTIVO">Inactivos</option>
          </select>

          {/* Filtro Contrato */}
          <select
            id="filter-contrato-docente"
            value={filterContrato}
            onChange={(e) => setFilterContrato(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 font-medium text-slate-700 focus:outline-hidden hidden sm:block cursor-pointer"
          >
            <option value="TODOS">Todos los contratos</option>
            <option value="TIEMPO COMPLETO">Tiempo Completo</option>
            <option value="MEDIO TIEMPO">Medio Tiempo</option>
            <option value="TIEMPO PARCIAL">Tiempo Parcial</option>
            <option value="OCASIONAL">Ocasional</option>
          </select>

          {/* Selector de Carreras (Requerimiento Principal) */}
          <div className="relative min-w-[200px] max-w-[280px]">
            <select
              id="filter-carrera-docente"
              value={filterCarrera}
              onChange={(e) => setFilterCarrera(e.target.value)}
              className={`w-full text-xs rounded-lg px-2.5 py-2 font-semibold border transition cursor-pointer focus:outline-hidden ${
                filterCarrera !== 'TODAS'
                  ? 'bg-purple-50 text-purple-900 border-purple-300 ring-2 ring-purple-200/50'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <option value="TODAS">Todas las carreras ({docentes.length})</option>
              {carrerasList.map((c) => {
                const count = docentesPorCarreraCount[c.id_carrera] || 0;
                return (
                  <option key={c.id_carrera} value={c.id_carrera.toString()}>
                    {c.nombre} ({count})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Switch de Modo: Tabla / Desplegar por Carrera */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 shrink-0">
            <button
              id="btn-view-mode-tabla"
              type="button"
              onClick={() => setViewMode('tabla')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer ${
                viewMode === 'tabla'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Vista en tabla general"
            >
              <List className="w-3.5 h-3.5 text-slate-500" />
              <span>Tabla</span>
            </button>
            <button
              id="btn-view-mode-carrera"
              type="button"
              onClick={() => {
                setViewMode('carrera');
                // Al entrar a vista carrera, expandir las carreras
                toggleAllAccordions(true);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer ${
                viewMode === 'carrera'
                  ? 'bg-purple-900 text-[#e5a800] shadow-xs'
                  : 'text-slate-600 hover:text-purple-900'
              }`}
              title="Desplegar y agrupar los docentes por carrera académica"
            >
              <FolderTree className="w-3.5 h-3.5 text-[#e5a800]" />
              <span>Desplegar por Carrera</span>
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-end xl:self-auto shrink-0">
          <button
            id="btn-exportar-docentes"
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition cursor-pointer"
            title="Exportar docentes a CSV con adscripción de carrera"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">Exportar</span>
          </button>

          <button
            id="btn-refrescar-docentes"
            type="button"
            onClick={onRefresh}
            className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition cursor-pointer"
            title="Recargar catálogo institucional"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            id="btn-nuevo-docente"
            type="button"
            onClick={handleOpenCreate}
            className="flex items-center gap-2 bg-[#0099e6] hover:bg-[#008bd1] text-white px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Docente</span>
          </button>
        </div>
      </div>

      {/* Banner de Carrera Seleccionada */}
      {selectedCarreraInfo && (
        <div className="p-4 bg-gradient-to-r from-purple-900 to-[#1f0533] text-white rounded-xl shadow-md border-l-4 border-[#e5a800] flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in duration-150">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#e5a800] text-[#1f0533] font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white/20 text-[#e5a800]">
                  {selectedCarreraInfo.codigo}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/10 text-purple-200 uppercase tracking-wider">
                  {selectedCarreraInfo.modalidad || 'PRESENCIAL'}
                </span>
              </div>
              <h3 className="text-base font-black text-white mt-0.5">
                {selectedCarreraInfo.nombre}
              </h3>
              <p className="text-xs text-purple-200">
                Título: {selectedCarreraInfo.titulo_otorgado || 'TECNOLOGÍA SUPERIOR'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="bg-white/10 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-white/10 text-center">
              <span className="block text-[10px] text-purple-200 uppercase font-bold">Docentes</span>
              <span className="text-sm font-black text-[#e5a800]">{filteredDocentes.length}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-white/10 text-center">
              <span className="block text-[10px] text-purple-200 uppercase font-bold">Activos</span>
              <span className="text-sm font-black text-emerald-300">
                {filteredDocentes.filter(d => d.estado === 'ACTIVO').length}
              </span>
            </div>
            <div className="bg-white/10 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-white/10 text-center">
              <span className="block text-[10px] text-purple-200 uppercase font-bold">Carga Total</span>
              <span className="text-sm font-black text-white">
                {filteredDocentes.reduce((acc, d) => acc + (docenteHoursMap.get(d.id_docente)?.hours || 0), 0)}h
              </span>
            </div>

            <button
              type="button"
              onClick={() => setFilterCarrera('TODAS')}
              className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Ver Todas las Carreras</span>
            </button>
          </div>
        </div>
      )}

      {/* VISTA 1: TABLA GENERAL */}
      {viewMode === 'tabla' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs font-medium text-slate-600">
            <div className="flex items-center gap-2">
              <span>
                Mostrando <strong>{filteredDocentes.length}</strong> de <strong>{docentes.length}</strong> docentes registrados
              </span>
              {filterCarrera !== 'TODAS' && (
                <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded font-semibold text-[11px]">
                  Filtrado por carrera
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-[11px] text-slate-500">
              <span>Total activos: <strong className="text-emerald-700">{filteredDocentes.filter(d => d.estado === 'ACTIVO').length}</strong></span>
              <span>•</span>
              <button
                type="button"
                onClick={() => {
                  setViewMode('carrera');
                  toggleAllAccordions(true);
                }}
                className="text-purple-700 hover:text-purple-900 font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <FolderTree className="w-3 h-3 text-[#e5a800]" />
                <span>Desplegar agrupados por carrera</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-3.5">Cédula (CI)</th>
                  <th className="py-3 px-3.5">Docente</th>
                  <th className="py-3 px-3.5">Carrera Académica</th>
                  <th className="py-3 px-3.5">Contacto Institucional</th>
                  <th className="py-3 px-3.5">Título & Especialidad</th>
                  <th className="py-3 px-3.5">Contrato</th>
                  <th className="py-3 px-3.5 text-center">Carga 2026-1</th>
                  <th className="py-3 px-3.5 text-center">Estado</th>
                  <th className="py-3 px-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDocentes.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      <GraduationCap className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-slate-600">No se encontraron docentes con el criterio seleccionado.</p>
                      <p className="text-xs text-slate-400 mt-0.5">Prueba cambiando la carrera seleccionada o limpiando los filtros.</p>
                      {filterCarrera !== 'TODAS' && (
                        <button
                          type="button"
                          onClick={() => setFilterCarrera('TODAS')}
                          className="mt-3 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition cursor-pointer"
                        >
                          Restablecer a todas las carreras
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredDocentes.map(docente => {
                    const carga = docenteHoursMap.get(docente.id_docente);
                    const carr = getDocenteCarrera(docente);
                    const isActivo = docente.estado === 'ACTIVO';

                    return (
                      <tr 
                        key={docente.id_docente} 
                        onClick={() => setSelectedDocenteForDetail(docente)}
                        className="hover:bg-purple-50/50 transition cursor-pointer group"
                      >
                        {/* CI */}
                        <td className="py-3 px-3.5 font-mono font-semibold text-slate-700 whitespace-nowrap">
                          {docente.ci}
                        </td>

                        {/* Docente */}
                        <td className="py-3 px-3.5">
                          <div className="font-bold text-slate-900 group-hover:text-purple-900 leading-tight">
                            {docente.apellidos}, {docente.nombres}
                          </div>
                          {docente.titulo_academico && (
                            <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <GraduationCap className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate max-w-[200px]">{docente.titulo_academico}</span>
                            </div>
                          )}
                        </td>

                        {/* Carrera */}
                        <td className="py-3 px-3.5" onClick={e => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => setFilterCarrera(carr.id_carrera.toString())}
                            className="text-left group/carr inline-flex flex-col cursor-pointer"
                            title={`Filtrar únicamente docentes de ${carr.nombre}`}
                          >
                            <span className="font-semibold text-slate-800 text-xs flex items-center gap-1.5 group-hover/carr:text-[#0099e6] transition">
                              <Building2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                              <span className="truncate max-w-[180px]">{carr.nombre}</span>
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                              {carr.codigo} • {carr.modalidad || 'PRESENCIAL'}
                            </span>
                          </button>
                        </td>

                        {/* Contacto */}
                        <td className="py-3 px-3.5 whitespace-nowrap">
                          <div className="text-slate-700 flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-[#0099e6] shrink-0" />
                            <span>{docente.correo}</span>
                          </div>
                          {docente.telefono && (
                            <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{docente.telefono}</span>
                            </div>
                          )}
                        </td>

                        {/* Título & Especialidad */}
                        <td className="py-3 px-3.5">
                          <span className="inline-block bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-medium">
                            {docente.especialidad || 'General'}
                          </span>
                        </td>

                        {/* Contrato */}
                        <td className="py-3 px-3.5 whitespace-nowrap">
                          <span className="text-xs font-medium text-slate-600 flex items-center gap-1">
                            <Briefcase className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{docente.tipo_contrato || 'TIEMPO COMPLETO'}</span>
                          </span>
                        </td>

                        {/* Carga Horaria */}
                        <td className="py-3 px-3.5 text-center whitespace-nowrap">
                          {carga && carga.hours > 0 ? (
                            <div className="inline-flex items-center gap-1 bg-blue-50 border border-blue-200 text-blue-800 px-2 py-0.5 rounded-full text-xs font-bold">
                              <Clock className="w-3 h-3" />
                              <span>{carga.hours}h ({carga.subjects.length} mat.)</span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">Sin carga</span>
                          )}
                        </td>

                        {/* Estado */}
                        <td className="py-3 px-3.5 text-center whitespace-nowrap" onClick={e => e.stopPropagation()}>
                          <span 
                            onClick={() => handleToggleEstado(docente)}
                            title="Clic para cambiar estado del docente"
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold cursor-pointer transition ${
                              isActivo 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100' 
                                : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                            }`}
                          >
                            {isActivo ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                            <span>{docente.estado}</span>
                          </span>
                        </td>

                        {/* Acciones */}
                        <td className="py-3 px-3.5 text-right whitespace-nowrap" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedDocenteForDetail(docente)}
                              className="px-2 py-1 bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                              title="Ver información académica completa y carga horaria"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Ficha</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(docente)}
                              className="p-1.5 text-slate-600 hover:text-[#0099e6] hover:bg-blue-50 rounded-md transition cursor-pointer"
                              title="Editar datos del docente"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmDocente(docente)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition cursor-pointer"
                              title="Eliminar docente"
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
        </div>
      )}

      {/* VISTA 2: DESPLEGAR POR CARRERA (ACORDEÓN AGRUPADO) */}
      {viewMode === 'carrera' && (
        <div className="space-y-3">
          {/* Barra de control para acordeones */}
          <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <FolderTree className="w-4 h-4 text-purple-700" />
                <span>Despliegue Agrupado por Carrera Académica</span>
              </span>
              <span className="px-2 py-0.5 bg-purple-50 border border-purple-200 text-purple-800 rounded font-semibold text-[11px]">
                {carrerasAgrupadas.length} Carreras
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => toggleAllAccordions(true)}
                className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-md transition flex items-center gap-1 cursor-pointer"
              >
                <ChevronDown className="w-3.5 h-3.5" />
                <span>Expandir todas</span>
              </button>
              <button
                type="button"
                onClick={() => toggleAllAccordions(false)}
                className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-md transition flex items-center gap-1 cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
                <span>Colapsar todas</span>
              </button>
            </div>
          </div>

          {/* Listado de Acordeones por Carrera */}
          {carrerasAgrupadas.map(({ carrera, docentes: docentesCarrera, totalHoras, activos }) => {
            const isExpanded = expandedCarreras[carrera.id_carrera] ?? true;

            return (
              <div 
                key={carrera.id_carrera} 
                className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden transition"
              >
                {/* Cabecera del Acordeón de Carrera */}
                <div
                  onClick={() => toggleAccordion(carrera.id_carrera)}
                  className="p-3.5 bg-slate-50 hover:bg-purple-50/40 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 cursor-pointer transition select-none"
                >
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      className="p-1 rounded text-slate-400 hover:text-slate-700 transition"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-purple-700" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      )}
                    </button>

                    <div className="w-8 h-8 rounded-lg bg-purple-900 text-[#e5a800] font-bold text-xs flex items-center justify-center shrink-0">
                      {carrera.codigo.replace('CAR-', '')}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-[#0099e6]">
                          {carrera.codigo}
                        </span>
                        <span className="text-[10px] uppercase font-semibold text-slate-400">
                          • {carrera.modalidad || 'PRESENCIAL'}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm hover:text-purple-900 transition">
                        {carrera.nombre}
                      </h4>
                    </div>
                  </div>

                  {/* Resumen de Métricas de la Carrera */}
                  <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                    <span className="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-bold shadow-2xs">
                      {docentesCarrera.length} {docentesCarrera.length === 1 ? 'docente' : 'docentes'}
                    </span>
                    <span className="px-2.5 py-1 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg text-xs font-bold">
                      {totalHoras} hrs asignadas
                    </span>
                    <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-bold">
                      {activos} activos
                    </span>
                    <button
                      type="button"
                      onClick={() => setFilterCarrera(carrera.id_carrera.toString())}
                      className="p-1.5 text-slate-500 hover:text-purple-700 hover:bg-purple-100 rounded-lg text-xs font-semibold transition ml-1"
                      title="Filtrar solo esta carrera"
                    >
                      <Filter className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Contenido desplegado: Tabla de Docentes de esta Carrera */}
                {isExpanded && (
                  <div className="overflow-x-auto">
                    {docentesCarrera.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 text-xs">
                        No hay docentes adscritos a esta carrera que coincidan con la búsqueda.
                      </div>
                    ) : (
                      <table className="w-full text-left border-collapse text-xs sm:text-sm">
                        <thead>
                          <tr className="bg-slate-50/70 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            <th className="py-2.5 px-3.5">Cédula</th>
                            <th className="py-2.5 px-3.5">Docente</th>
                            <th className="py-2.5 px-3.5">Contacto Institucional</th>
                            <th className="py-2.5 px-3.5">Título & Especialidad</th>
                            <th className="py-2.5 px-3.5">Régimen</th>
                            <th className="py-2.5 px-3.5 text-center">Carga 2026-1</th>
                            <th className="py-2.5 px-3.5 text-center">Estado</th>
                            <th className="py-2.5 px-3.5 text-right">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {docentesCarrera.map(docente => {
                            const carga = docenteHoursMap.get(docente.id_docente);
                            const isActivo = docente.estado === 'ACTIVO';

                            return (
                              <tr 
                                key={docente.id_docente} 
                                onClick={() => setSelectedDocenteForDetail(docente)}
                                className="hover:bg-purple-50/40 transition cursor-pointer"
                              >
                                <td className="py-2.5 px-3.5 font-mono font-semibold text-slate-700 whitespace-nowrap">
                                  {docente.ci}
                                </td>
                                <td className="py-2.5 px-3.5">
                                  <div className="font-bold text-slate-900 leading-tight">
                                    {docente.apellidos}, {docente.nombres}
                                  </div>
                                  {docente.titulo_academico && (
                                    <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                                      <GraduationCap className="w-3 h-3 text-slate-400 shrink-0" />
                                      <span className="truncate max-w-[200px]">{docente.titulo_academico}</span>
                                    </div>
                                  )}
                                </td>
                                <td className="py-2.5 px-3.5 whitespace-nowrap">
                                  <div className="text-slate-700 flex items-center gap-1">
                                    <Mail className="w-3 h-3 text-[#0099e6] shrink-0" />
                                    <span>{docente.correo}</span>
                                  </div>
                                </td>
                                <td className="py-2.5 px-3.5">
                                  <span className="inline-block bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-medium">
                                    {docente.especialidad || 'General'}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3.5 whitespace-nowrap">
                                  <span className="text-xs text-slate-600 font-medium">
                                    {docente.tipo_contrato || 'TIEMPO COMPLETO'}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                                  {carga && carga.hours > 0 ? (
                                    <span className="inline-flex items-center gap-1 bg-blue-50 border border-blue-200 text-blue-800 px-2 py-0.5 rounded-full text-xs font-bold">
                                      <Clock className="w-3 h-3" />
                                      <span>{carga.hours}h ({carga.subjects.length} mat.)</span>
                                    </span>
                                  ) : (
                                    <span className="text-xs text-slate-400">Sin carga</span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3.5 text-center whitespace-nowrap" onClick={e => e.stopPropagation()}>
                                  <span 
                                    onClick={() => handleToggleEstado(docente)}
                                    title="Clic para cambiar estado"
                                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold cursor-pointer transition ${
                                      isActivo 
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100' 
                                        : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                                    }`}
                                  >
                                    {isActivo ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                                    <span>{docente.estado}</span>
                                  </span>
                                </td>
                                <td className="py-2.5 px-3.5 text-right whitespace-nowrap" onClick={e => e.stopPropagation()}>
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => setSelectedDocenteForDetail(docente)}
                                      className="px-2 py-1 bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                                      title="Ficha completa"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                      <span className="hidden sm:inline">Ficha</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEdit(docente)}
                                      className="p-1.5 text-slate-600 hover:text-[#0099e6] hover:bg-blue-50 rounded-md transition cursor-pointer"
                                      title="Editar"
                                    >
                                      <Edit className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setDeleteConfirmDocente(docente)}
                                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition cursor-pointer"
                                      title="Eliminar"
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

      {/* Modal Crear / Editar Docente */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-900 to-[#1f0533] text-white p-4 flex items-center justify-between border-b-2 border-[#e5a800]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#e5a800] text-[#1f0533] flex items-center justify-center font-bold">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">
                    {editingDocente ? 'Editar Docente' : 'Nuevo Docente Institucional'}
                  </h3>
                  <p className="text-xs text-purple-200">
                    {editingDocente ? `Actualizando datos de ${editingDocente.nombres} ${editingDocente.apellidos}` : 'Ingresa la información personal y académica del docente'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {errorMessage && (
                <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Carrera de Adscripción */}
              <div className="bg-purple-50/70 border border-purple-200/70 p-3 rounded-xl">
                <label className="block text-xs font-bold text-purple-950 mb-1 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-purple-700" />
                  <span>Carrera Académica de Adscripción *</span>
                </label>
                <select
                  value={formData.id_carrera}
                  onChange={(e) => setFormData({ ...formData, id_carrera: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:outline-hidden font-medium text-slate-800"
                >
                  {carrerasList.map((c) => (
                    <option key={c.id_carrera} value={c.id_carrera}>
                      {c.codigo} - {c.nombre} ({c.modalidad || 'PRESENCIAL'})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-purple-700 mt-1">
                  Define a qué carrera pertenece este docente para organización, filtros y reportes académicos.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* CI */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Cédula de Identidad (CI) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. 1712345678"
                    value={formData.ci}
                    onChange={(e) => setFormData({ ...formData, ci: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0099e6] focus:bg-white focus:outline-hidden font-mono"
                  />
                </div>

                {/* Tipo Contrato */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tipo de Contrato
                  </label>
                  <select
                    value={formData.tipo_contrato}
                    onChange={(e) => setFormData({ ...formData, tipo_contrato: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0099e6] focus:bg-white focus:outline-hidden"
                  >
                    <option value="TIEMPO COMPLETO">TIEMPO COMPLETO (40h)</option>
                    <option value="MEDIO TIEMPO">MEDIO TIEMPO (20h)</option>
                    <option value="TIEMPO PARCIAL">TIEMPO PARCIAL (10h)</option>
                    <option value="OCASIONAL">OCASIONAL / POR HORAS</option>
                  </select>
                </div>

                {/* Nombres */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nombres *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Carlos Andrés"
                    value={formData.nombres}
                    onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0099e6] focus:bg-white focus:outline-hidden"
                  />
                </div>

                {/* Apellidos */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Apellidos *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Mendoza Salgado"
                    value={formData.apellidos}
                    onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0099e6] focus:bg-white focus:outline-hidden"
                  />
                </div>

                {/* Correo */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Correo Institucional *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="ejemplo@isuj.edu.ec"
                    value={formData.correo}
                    onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0099e6] focus:bg-white focus:outline-hidden"
                  />
                </div>

                {/* Teléfono */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Teléfono Móvil
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. 0998765432"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0099e6] focus:bg-white focus:outline-hidden"
                  />
                </div>

                {/* Título Académico */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Título Académico
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Magíster en Software, Doctor en Odontología"
                    value={formData.titulo_academico}
                    onChange={(e) => setFormData({ ...formData, titulo_academico: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0099e6] focus:bg-white focus:outline-hidden"
                  />
                </div>

                {/* Especialidad */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Área / Especialidad
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Redes de Datos, Bioética, Cirugía Oral"
                    value={formData.especialidad}
                    onChange={(e) => setFormData({ ...formData, especialidad: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0099e6] focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Estado */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Estado en el Sistema
                </label>
                <div className="flex items-center gap-4 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                    <input
                      type="radio"
                      name="estado"
                      value="ACTIVO"
                      checked={formData.estado === 'ACTIVO'}
                      onChange={() => setFormData({ ...formData, estado: 'ACTIVO' })}
                      className="text-[#0099e6] focus:ring-[#0099e6]"
                    />
                    <span>ACTIVO</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                    <input
                      type="radio"
                      name="estado"
                      value="INACTIVO"
                      checked={formData.estado === 'INACTIVO'}
                      onChange={() => setFormData({ ...formData, estado: 'INACTIVO' })}
                      className="text-[#0099e6] focus:ring-[#0099e6]"
                    />
                    <span>INACTIVO</span>
                  </label>
                </div>
              </div>

              {/* Modal Footer */}
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
                  {isSaving ? 'Guardando...' : editingDocente ? 'Actualizar Docente' : 'Guardar Docente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmDocente && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-5 border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-11 h-11 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">¿Eliminar Docente?</h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Estás a punto de eliminar a <strong>{deleteConfirmDocente.nombres} {deleteConfirmDocente.apellidos}</strong> (CI: {deleteConfirmDocente.ci}). Esta acción no se puede deshacer si no tiene historial.
            </p>
            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteConfirmDocente(null)}
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

      {/* Ficha / Detalle Completo del Docente Modal */}
      {selectedDocenteForDetail && (() => {
        const docenteCarrera = getDocenteCarrera(selectedDocenteForDetail);
        const assignedPlans = (planificaciones || []).filter(
          p => p.id_docente === selectedDocenteForDetail.id_docente
        );
        const totalHours = assignedPlans.reduce((acc, p) => {
          try {
            const [hIni, mIni] = p.hora_inicio.split(':').map(Number);
            const [hFin, mFin] = p.hora_fin.split(':').map(Number);
            return acc + Math.max(1, Math.round((hFin + mFin / 60) - (hIni + mIni / 60)));
          } catch {
            return acc + 2;
          }
        }, 0);

        return (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] shadow-2xl overflow-hidden border border-slate-100 flex flex-col animate-in fade-in zoom-in-95 duration-150">
              {/* Header */}
              <div className="bg-gradient-to-r from-[#1f0533] to-[#3a0a60] text-white p-5 flex items-center justify-between border-b-2 border-[#e5a800]">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#e5a800] text-[#1f0533] font-black text-xl flex items-center justify-center shadow-md">
                    {selectedDocenteForDetail.nombres.charAt(0)}{selectedDocenteForDetail.apellidos.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/20 text-[#e5a800] uppercase tracking-wider">
                        Ficha Docente Institucional
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        selectedDocenteForDetail.estado === 'ACTIVO' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                      }`}>
                        ● {selectedDocenteForDetail.estado}
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-white mt-0.5">
                      {selectedDocenteForDetail.titulo_academico ? `${selectedDocenteForDetail.titulo_academico} ` : ''}
                      {selectedDocenteForDetail.apellidos} {selectedDocenteForDetail.nombres}
                    </h3>
                    <p className="text-xs text-purple-200">
                      CI: <span className="font-mono font-bold text-white">{selectedDocenteForDetail.ci}</span> • {selectedDocenteForDetail.tipo_contrato || 'TIEMPO COMPLETO'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedDocenteForDetail(null)}
                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-6">
                {/* Carrera y Adscripción Institucional */}
                <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-xl flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-900 text-[#e5a800] flex items-center justify-center font-bold text-xs shrink-0">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-purple-200 text-purple-900">
                          {docenteCarrera.codigo}
                        </span>
                        <span className="text-[10px] font-bold text-purple-600 uppercase">
                          Carrera de Adscripción
                        </span>
                      </div>
                      <h4 className="text-sm font-black text-purple-950 mt-0.5">
                        {docenteCarrera.nombre}
                      </h4>
                      <p className="text-xs text-purple-700">
                        {docenteCarrera.titulo_otorgado || 'TECNOLOGÍA SUPERIOR'} ({docenteCarrera.modalidad || 'PRESENCIAL'})
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDocenteForDetail(null);
                      setFilterCarrera(docenteCarrera.id_carrera.toString());
                    }}
                    className="px-3 py-1.5 bg-purple-900 hover:bg-purple-800 text-[#e5a800] rounded-lg text-xs font-bold transition flex items-center gap-1 shrink-0 cursor-pointer shadow-xs"
                  >
                    <Filter className="w-3 h-3" />
                    <span>Ver docentes de esta carrera</span>
                  </button>
                </div>

                {/* Información Personal y de Contacto */}
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-[#e5a800]" />
                    <span>Datos Generales y Contacto</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Cédula / Identificación</span>
                      <span className="font-mono font-bold text-slate-800 text-sm">{selectedDocenteForDetail.ci}</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Correo Institucional</span>
                      <div className="flex items-center gap-1.5 font-medium text-slate-800 text-xs truncate mt-0.5">
                        <Mail className="w-3.5 h-3.5 text-[#0099e6] shrink-0" />
                        <span className="truncate">{selectedDocenteForDetail.correo}</span>
                      </div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Teléfono Móvil</span>
                      <div className="flex items-center gap-1.5 font-medium text-slate-800 text-xs truncate mt-0.5">
                        <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{selectedDocenteForDetail.telefono || 'No registrado'}</span>
                      </div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Título Académico</span>
                      <div className="flex items-center gap-1.5 font-medium text-slate-800 text-xs truncate mt-0.5">
                        <GraduationCap className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                        <span>{selectedDocenteForDetail.titulo_academico || 'Tercer Nivel'}</span>
                      </div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Especialidad</span>
                      <span className="font-medium text-slate-800 text-xs block mt-0.5">
                        {selectedDocenteForDetail.especialidad || 'General / Malla Troncal'}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Régimen Laboral</span>
                      <div className="flex items-center gap-1.5 font-medium text-slate-800 text-xs truncate mt-0.5">
                        <Briefcase className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>{selectedDocenteForDetail.tipo_contrato || 'TIEMPO COMPLETO'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Asignación y Carga Horaria */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-[#e5a800]" />
                      <span>Carga Horaria y Asignaciones Semanales</span>
                    </h4>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-800 rounded-lg font-bold text-xs">
                        {totalHours} Horas Asignadas
                      </span>
                      <span className="px-2.5 py-1 bg-purple-50 border border-purple-200 text-purple-800 rounded-lg font-bold text-xs">
                        {assignedPlans.length} Clases
                      </span>
                    </div>
                  </div>

                  {assignedPlans.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
                      Este docente aún no tiene materias ni horarios asignados en el periodo lectivo actual.
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
                                {plan.asignatura_nombre}
                              </span>
                              <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                                {plan.asignatura_codigo}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500">
                              {plan.carrera_nombre} • Nivel {plan.nivel_nombre || plan.id_nivel} (Paralelo {plan.paralelo_codigo})
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
                  Registrado en sistema académico ISUJ
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const doc = selectedDocenteForDetail;
                      setSelectedDocenteForDetail(null);
                      handleOpenEdit(doc);
                    }}
                    className="px-4 py-2 bg-[#0099e6] hover:bg-[#008bd1] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Editar Docente</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedDocenteForDetail(null)}
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
    </div>
  );
};
