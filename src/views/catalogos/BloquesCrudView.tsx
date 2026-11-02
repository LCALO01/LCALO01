import React, { useState, useMemo, useEffect } from 'react';
import { Bloque, Sede, AulaLaboratorio } from '../../types.ts';
import { ApiClient } from '../../controllers/apiClient.ts';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  RefreshCw, 
  Layers, 
  Building2, 
  CheckCircle2, 
  X, 
  AlertTriangle,
  Download,
  School,
  DoorOpen,
  ListPlus,
  Sparkles,
  Copy,
  PlusCircle,
  FileText,
  Check,
  Eye,
  Table,
  Filter,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Maximize2,
  Minimize2,
  Laptop,
  FileSpreadsheet,
  Pin,
  Users,
  ShieldCheck
} from 'lucide-react';
import { ExportController } from '../../controllers/exportController.ts';
import { ModalAuditoriaAulas } from '../../components/ModalAuditoriaAulas.tsx';

interface BulkBloqueRow {
  id: string;
  codigo: string;
  nombre: string;
  id_sede: number;
  numero_pisos: number;
  descripcion: string;
}

interface BloquesCrudViewProps {
  bloques: Bloque[];
  sedes: Sede[];
  aulas?: AulaLaboratorio[];
  onRefresh: () => void;
}

export const BloquesCrudView: React.FC<BloquesCrudViewProps> = ({
  bloques,
  sedes,
  aulas = [],
  onRefresh
}) => {
  const [activeMainTab, setActiveMainTab] = useState<'bloques' | 'distribucion' | 'desplegada'>('bloques');
  const [selectedBloqueForAulas, setSelectedBloqueForAulas] = useState<Bloque | null>(null);
  const [modalSearchTerm, setModalSearchTerm] = useState('');
  const [distribucionSearch, setDistribucionSearch] = useState('');
  const [distribucionBloqueFilter, setDistribucionBloqueFilter] = useState<string>('TODOS');
  const [isAuditoriaModalOpen, setIsAuditoriaModalOpen] = useState(false);

  // Estado para desplegar aulas opcionalmente por bloque si el usuario lo requiere
  const [expandedBloqueIds, setExpandedBloqueIds] = useState<Set<number>>(new Set());

  const isAllExpanded = bloques.length > 0 && expandedBloqueIds.size === bloques.length;

  const handleToggleExpandAll = () => {
    if (isAllExpanded) {
      setExpandedBloqueIds(new Set());
    } else {
      setExpandedBloqueIds(new Set(bloques.map(b => b.id_bloque)));
    }
  };

  const handleToggleBloqueExpand = (id_bloque: number) => {
    setExpandedBloqueIds(prev => {
      const next = new Set(prev);
      if (next.has(id_bloque)) {
        next.delete(id_bloque);
      } else {
        next.add(id_bloque);
      }
      return next;
    });
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<string>('TODOS');
  const [filterSede, setFilterSede] = useState<string>('TODOS');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBloque, setEditingBloque] = useState<Bloque | null>(null);
  const [deleteConfirmBloque, setDeleteConfirmBloque] = useState<Bloque | null>(null);

  // Modal de ingreso masivo / múltiple
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkActiveTab, setBulkActiveTab] = useState<'generator' | 'table' | 'paste'>('generator');
  const [bulkRows, setBulkRows] = useState<BulkBloqueRow[]>([]);
  const [bulkPasteText, setBulkPasteText] = useState('');
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{ current: number; total: number } | null>(null);
  const [bulkError, setBulkError] = useState<string | null>(null);
  
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const defaultSedeId = sedes.length > 0 ? sedes[0].id_sede : 1;

  const [bulkGeneratorConfig, setBulkGeneratorConfig] = useState({
    id_sede: defaultSedeId,
    prefijo: 'BLQ-',
    desdeLetra: 'A',
    hastaLetra: 'F',
    nombreBase: 'BLOQUE',
    pisos: 3
  });

  const [formData, setFormData] = useState({
    id_sede: defaultSedeId,
    codigo: '',
    nombre: '',
    descripcion: '',
    numero_pisos: 3,
    estado: 'ACTIVO'
  });

  const sedeMap = useMemo(() => {
    const map = new Map<number, string>();
    sedes.forEach(s => map.set(s.id_sede, s.nombre));
    return map;
  }, [sedes]);

  // Contar aulas asociadas a cada bloque
  const aulasPorBloque = useMemo(() => {
    const counts = new Map<number, number>();
    aulas.forEach(a => {
      counts.set(a.id_bloque, (counts.get(a.id_bloque) || 0) + 1);
    });
    return counts;
  }, [aulas]);

  // Helper para formatear capacidad como en el archivo institucional
  const formatCapacidadDisplay = (aula: AulaLaboratorio) => {
    if (aula.codigo === 'B5') return 'Coworking';
    if (['C1', 'C2', 'C3', 'C4'].includes(aula.codigo)) return 'N/A';
    return String(aula.capacidad);
  };

  // Mapa de bloques por ID
  const bloqueMap = useMemo(() => {
    const map = new Map<number, Bloque>();
    bloques.forEach(b => map.set(b.id_bloque, b));
    return map;
  }, [bloques]);

  // Lista de aulas asociadas a un bloque específico para el modal de detalle
  const aulasDelBloqueSeleccionado = useMemo(() => {
    if (!selectedBloqueForAulas) return [];
    return aulas.filter(a => a.id_bloque === selectedBloqueForAulas.id_bloque).filter(a => {
      if (!modalSearchTerm) return true;
      const s = modalSearchTerm.toLowerCase();
      return a.codigo.toLowerCase().includes(s) || a.nombre.toLowerCase().includes(s) || String(a.piso).includes(s);
    });
  }, [aulas, selectedBloqueForAulas, modalSearchTerm]);

  // Lista de aulas para la vista de Distribución General (65 espacios)
  const filteredDistribucionAulas = useMemo(() => {
    return aulas.filter(a => {
      const blq = bloqueMap.get(a.id_bloque);
      const blqCodigo = blq?.codigo || '';
      const blqNombre = blq?.nombre || '';
      const matchBloque = distribucionBloqueFilter === 'TODOS' || blqCodigo === distribucionBloqueFilter;
      const matchSearch = 
        !distribucionSearch ||
        a.codigo.toLowerCase().includes(distribucionSearch.toLowerCase()) ||
        a.nombre.toLowerCase().includes(distribucionSearch.toLowerCase()) ||
        blqCodigo.toLowerCase().includes(distribucionSearch.toLowerCase()) ||
        blqNombre.toLowerCase().includes(distribucionSearch.toLowerCase()) ||
        String(a.piso).includes(distribucionSearch);
      return matchBloque && matchSearch;
    });
  }, [aulas, bloqueMap, distribucionBloqueFilter, distribucionSearch]);

  const handleExportDistribucionCSV = () => {
    const headers = ['ORD', 'Bloque', 'Aula', 'Capacidad', 'Pisos', 'Sede', 'Tipo', 'Estado'];
    const rows = filteredDistribucionAulas.map(a => {
      const blq = bloqueMap.get(a.id_bloque);
      const sede = blq?.id_sede ? sedeMap.get(blq.id_sede) || 'UIO_NORTE' : 'UIO_NORTE';
      return [
        a.id_aula_laboratorio,
        blq ? blq.codigo.replace('BLQ-', '') : 'A',
        a.nombre,
        formatCapacidadDisplay(a),
        a.piso,
        sede,
        a.tipo,
        a.estado
      ];
    });
    const csvContent = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `distribucion_oficial_aulas_bloques_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const filteredBloques = useMemo(() => {
    return bloques.filter(b => {
      const sedeNombre = b.sede_nombre || sedeMap.get(b.id_sede) || '';
      const matchSearch = 
        b.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (b.descripcion && b.descripcion.toLowerCase().includes(searchTerm.toLowerCase())) ||
        sedeNombre.toLowerCase().includes(searchTerm.toLowerCase());

      const matchEstado = filterEstado === 'TODOS' ? true : b.estado === filterEstado;
      const matchSede = filterSede === 'TODOS' ? true : String(b.id_sede) === filterSede;

      return matchSearch && matchEstado && matchSede;
    });
  }, [bloques, searchTerm, filterEstado, filterSede, sedeMap]);

  // KPIs
  const totalPisos = bloques.reduce((acc, b) => acc + (b.numero_pisos || 1), 0);
  const totalActivos = bloques.filter(b => b.estado === 'ACTIVO').length;
  const totalAulasCount = aulas.length > 0 
    ? aulas.length 
    : bloques.reduce((acc, b) => acc + (b.aulas_count || 0), 0);

  // Función para autogenerar el siguiente código sugerido
  const getNextSuggestedCode = (currentCode?: string, offset: number = 0) => {
    if (currentCode) {
      const match = currentCode.match(/^([A-Za-z0-9_-]+-?)([A-Za-z]+|\d+)$/);
      if (match) {
        const prefix = match[1];
        const suffix = match[2];
        if (/^\d+$/.test(suffix)) {
          const num = parseInt(suffix, 10) + 1;
          const padded = String(num).padStart(suffix.length, '0');
          return `${prefix}${padded}`;
        } else if (/^[A-Za-z]+$/.test(suffix) && suffix.length === 1) {
          const charCode = suffix.toUpperCase().charCodeAt(0);
          if (charCode < 90) {
            return `${prefix}${String.fromCharCode(charCode + 1)}`;
          }
        }
      }
    }
    const idx = bloques.length + offset;
    const letter = String.fromCharCode(65 + (idx % 26));
    const cycle = Math.floor(idx / 26);
    return cycle > 0 ? `BLQ-${letter}${cycle + 1}` : `BLQ-${letter}`;
  };

  const handleOpenCreate = () => {
    setEditingBloque(null);
    setFormData({
      id_sede: defaultSedeId,
      codigo: getNextSuggestedCode(),
      nombre: '',
      descripcion: '',
      numero_pisos: 3,
      estado: 'ACTIVO'
    });
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (b: Bloque) => {
    setEditingBloque(b);
    setFormData({
      id_sede: b.id_sede || defaultSedeId,
      codigo: b.codigo,
      nombre: b.nombre,
      descripcion: b.descripcion || '',
      numero_pisos: b.numero_pisos || 1,
      estado: b.estado || 'ACTIVO'
    });
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent, andAddAnother: boolean = false) => {
    e.preventDefault();
    if (!formData.codigo.trim() || !formData.nombre.trim()) {
      setErrorMessage('Por favor ingresa el código y nombre del bloque.');
      return;
    }

    if (formData.numero_pisos < 1) {
      setErrorMessage('El número de pisos debe ser al menos 1.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      if (editingBloque) {
        await ApiClient.updateCatalogItem('bloques', editingBloque.id_bloque, formData);
        setSuccessMessage(`Bloque "${formData.nombre}" actualizado correctamente.`);
        setIsModalOpen(false);
      } else {
        await ApiClient.createCatalogItem('bloques', formData);
        setSuccessMessage(`Bloque "${formData.nombre}" registrado exitosamente.`);
        if (andAddAnother) {
          const nextCode = getNextSuggestedCode(formData.codigo, 1);
          setFormData({
            id_sede: formData.id_sede,
            codigo: nextCode,
            nombre: '',
            descripcion: '',
            numero_pisos: formData.numero_pisos,
            estado: 'ACTIVO'
          });
          setIsModalOpen(true);
        } else {
          setIsModalOpen(false);
        }
      }
      onRefresh();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al guardar bloque.');
    } finally {
      setIsSaving(false);
    }
  };

  // Apertura y generación del modal masivo
  const handleOpenBulkModal = () => {
    setBulkError(null);
    setBulkProgress(null);
    setBulkActiveTab('generator');
    setBulkGeneratorConfig({
      id_sede: defaultSedeId,
      prefijo: 'BLQ-',
      desdeLetra: 'A',
      hastaLetra: 'F',
      nombreBase: 'BLOQUE',
      pisos: 3
    });
    // Inicializar con filas vacías por si desea agregar directamente
    setBulkRows([
      { id: '1', codigo: getNextSuggestedCode(undefined, 0), nombre: '', id_sede: defaultSedeId, numero_pisos: 3, descripcion: '' },
      { id: '2', codigo: getNextSuggestedCode(undefined, 1), nombre: '', id_sede: defaultSedeId, numero_pisos: 3, descripcion: '' },
      { id: '3', codigo: getNextSuggestedCode(undefined, 2), nombre: '', id_sede: defaultSedeId, numero_pisos: 3, descripcion: '' }
    ]);
    setIsBulkModalOpen(true);
  };

  const handleGenerateSeries = () => {
    const startChar = (bulkGeneratorConfig.desdeLetra || 'A').toUpperCase().charCodeAt(0);
    const endChar = (bulkGeneratorConfig.hastaLetra || 'F').toUpperCase().charCodeAt(0);

    if (startChar > endChar) {
      setBulkError('La letra inicial debe ser menor o igual a la letra final.');
      return;
    }

    const rows: BulkBloqueRow[] = [];
    let counter = 1;
    for (let c = startChar; c <= endChar; c++) {
      const letter = String.fromCharCode(c);
      rows.push({
        id: String(counter++),
        codigo: `${bulkGeneratorConfig.prefijo}${letter}`,
        nombre: `${bulkGeneratorConfig.nombreBase} ${letter}`,
        id_sede: bulkGeneratorConfig.id_sede,
        numero_pisos: bulkGeneratorConfig.pisos,
        descripcion: `Instalaciones del ${bulkGeneratorConfig.nombreBase.toLowerCase()} ${letter}`
      });
    }

    setBulkRows(rows);
    setBulkActiveTab('table');
    setBulkError(null);
  };

  const handleAddBulkRow = () => {
    const lastRow = bulkRows[bulkRows.length - 1];
    const nextCode = lastRow ? getNextSuggestedCode(lastRow.codigo) : getNextSuggestedCode();
    setBulkRows([
      ...bulkRows,
      {
        id: Date.now().toString(),
        codigo: nextCode,
        nombre: '',
        id_sede: lastRow ? lastRow.id_sede : defaultSedeId,
        numero_pisos: lastRow ? lastRow.numero_pisos : 3,
        descripcion: ''
      }
    ]);
  };

  const handleUpdateBulkRow = (id: string, field: keyof BulkBloqueRow, value: any) => {
    setBulkRows(bulkRows.map(row => row.id === id ? { ...row, [field]: value } : row));
  };

  const handleRemoveBulkRow = (id: string) => {
    if (bulkRows.length <= 1) {
      setBulkRows([{ id: '1', codigo: getNextSuggestedCode(), nombre: '', id_sede: defaultSedeId, numero_pisos: 3, descripcion: '' }]);
      return;
    }
    setBulkRows(bulkRows.filter(row => row.id !== id));
  };

  const handleParsePasteText = () => {
    if (!bulkPasteText.trim()) {
      setBulkError('Ingresa o pega texto para procesar los bloques.');
      return;
    }

    const lines = bulkPasteText.split('\n').map(l => l.trim()).filter(Boolean);
    const newRows: BulkBloqueRow[] = [];
    let count = 1;

    lines.forEach(line => {
      // Intentar dividir por comas o tabuladores: "BLQ-A, BLOQUE A, 3, Descripción"
      const parts = line.split(/[,;\t]/).map(p => p.trim());
      let codigo = '';
      let nombre = '';
      let pisos = 3;
      let desc = '';

      if (parts.length >= 2) {
        codigo = parts[0].toUpperCase();
        nombre = parts[1];
        if (parts[2] && !isNaN(Number(parts[2]))) {
          pisos = Number(parts[2]);
        }
        if (parts[3]) {
          desc = parts[3];
        }
      } else {
        // Una sola palabra o nombre: e.g. "BLOQUE D" o "AUDITORIO"
        nombre = line;
        codigo = `BLQ-${line.slice(0, 3).toUpperCase()}${count}`;
      }

      newRows.push({
        id: `paste-${count++}`,
        codigo: codigo || `BLQ-${count}`,
        nombre: nombre || `Bloque ${count}`,
        id_sede: defaultSedeId,
        numero_pisos: pisos > 0 ? pisos : 3,
        descripcion: desc
      });
    });

    if (newRows.length === 0) {
      setBulkError('No se identificaron bloques válidos en el texto.');
      return;
    }

    setBulkRows(newRows);
    setBulkActiveTab('table');
    setBulkError(null);
  };

  const handleSaveAllBulk = async () => {
    // Validar que todas las filas tengan código y nombre
    const invalid = bulkRows.find(r => !r.codigo.trim() || !r.nombre.trim());
    if (invalid) {
      setBulkError('Todos los bloques deben tener código y nombre.');
      setBulkActiveTab('table');
      return;
    }

    setBulkSaving(true);
    setBulkError(null);
    setBulkProgress({ current: 0, total: bulkRows.length });

    let createdCount = 0;
    try {
      for (let i = 0; i < bulkRows.length; i++) {
        const row = bulkRows[i];
        await ApiClient.createCatalogItem('bloques', {
          codigo: row.codigo.trim().toUpperCase(),
          nombre: row.nombre.trim(),
          id_sede: row.id_sede,
          numero_pisos: Number(row.numero_pisos) || 1,
          descripcion: row.descripcion.trim(),
          estado: 'ACTIVO'
        });
        createdCount++;
        setBulkProgress({ current: createdCount, total: bulkRows.length });
      }

      setSuccessMessage(`¡Se ingresaron exitosamente ${createdCount} bloques en el sistema!`);
      setIsBulkModalOpen(false);
      onRefresh();
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      setBulkError(`Error al guardar en el bloque ${createdCount + 1}: ${err.message || 'Fallo de conexión'}`);
    } finally {
      setBulkSaving(false);
      setBulkProgress(null);
    }
  };

  const handleToggleEstado = async (b: Bloque) => {
    try {
      const nuevo = b.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
      await ApiClient.toggleCatalogItemEstado('bloques', b.id_bloque, nuevo);
      setSuccessMessage(`Estado del bloque ${b.codigo} cambiado a ${nuevo}.`);
      onRefresh();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al cambiar estado.');
      setTimeout(() => setErrorMessage(null), 4000);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmBloque) return;
    setIsSaving(true);
    setErrorMessage(null);

    try {
      await ApiClient.deleteCatalogItem('bloques', deleteConfirmBloque.id_bloque);
      setSuccessMessage(`Bloque "${deleteConfirmBloque.nombre}" eliminado.`);
      setDeleteConfirmBloque(null);
      onRefresh();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al eliminar bloque.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Codigo', 'Nombre', 'Sede', 'Numero_Pisos', 'Aulas_Asociadas', 'Descripcion', 'Estado'];
    const rows = filteredBloques.map(b => [
      b.id_bloque,
      `"${b.codigo}"`,
      `"${b.nombre}"`,
      `"${b.sede_nombre || sedeMap.get(b.id_sede) || ''}"`,
      b.numero_pisos,
      aulasPorBloque.get(b.id_bloque) || b.aulas_count || 0,
      `"${b.descripcion || ''}"`,
      `"${b.estado}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `bloques_isuj_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Alert Banners */}
      {successMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs sm:text-sm flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-600 hover:text-emerald-900 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs sm:text-sm flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-600 hover:text-rose-900 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* SECCIÓN CONGELADA / FIXED: CABECERA, KPIS Y SELECTOR DE VISTAS */}
      <div className="sticky top-0 z-20 bg-[#f1f5f9] -mx-1 px-1 pt-0.5 pb-2.5 shadow-2xs">
        {/* Header card & KPI Ribbon */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 sm:p-4 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100">
                  <Layers className="w-4 h-4" />
                </span>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base font-bold text-slate-900">Catálogo de Bloques Arquitectónicos</h2>
                    <span className="text-[10px] font-bold text-red-700 bg-red-100/90 border border-red-300 px-2 py-0.5 rounded-md font-mono inline-flex items-center gap-1 shadow-2xs">
                      <Pin className="w-2.5 h-2.5 fill-red-600 text-red-600" />
                      CONGELADO
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Infraestructura física por sedes, plantas, niveles y distribución de espacios del ISUJ.
                  </p>
                </div>
              </div>
            </div>

          <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
            <button
              onClick={handleExportCSV}
              type="button"
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition cursor-pointer border border-slate-200"
              title="Descargar lista en CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Exportar CSV</span>
            </button>

            <button
              onClick={onRefresh}
              type="button"
              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition cursor-pointer border border-slate-200"
              title="Recargar datos"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleOpenBulkModal}
              type="button"
              className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition cursor-pointer border border-purple-200"
              title="Ingresar múltiples bloques en lote o por serie"
            >
              <ListPlus className="w-3.5 h-3.5 text-purple-600" />
              <span>Ingreso Múltiple</span>
            </button>

            <button
              onClick={() => setIsAuditoriaModalOpen(true)}
              type="button"
              className="px-3 py-1.5 bg-[#280740] hover:bg-[#3d0a63] text-[#e5a800] text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-2xs transition cursor-pointer border border-[#e5a800]/50"
              title="Abrir panel oficial de verificación minuciosa: Bloque, Aula, Capacidad, Pisos, Sede, Estado"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#e5a800]" />
              <span>Auditoría Minuciosa (6 Dim.)</span>
            </button>

            <button
              onClick={() => ExportController.exportBloquesXLSX(bloques, aulas, 'bloques_institucionales_isuj.xlsx')}
              type="button"
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
              title="Exportar todos los bloques y distribución de aulas a formato Microsoft Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Exportar Excel</span>
            </button>

            <button
              onClick={handleOpenCreate}
              type="button"
              className="px-3.5 py-1.5 bg-[#0099e6] hover:bg-[#0088cc] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nuevo Bloque</span>
            </button>
          </div>
        </div>

        {/* KPIs Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3 pt-3 border-t border-slate-100 text-xs">
          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/70">
            <span className="text-slate-500 font-medium block text-[11px]">Total Bloques</span>
            <span className="text-base font-bold text-slate-900 font-mono mt-0.5 block">{bloques.length}</span>
          </div>
          <div className="p-2.5 bg-emerald-50/70 rounded-lg border border-emerald-100">
            <span className="text-emerald-700 font-medium block text-[11px]">Bloques Activos</span>
            <span className="text-base font-bold text-emerald-800 font-mono mt-0.5 block">{totalActivos}</span>
          </div>
          <div className="p-2.5 bg-indigo-50/70 rounded-lg border border-indigo-100">
            <span className="text-indigo-700 font-medium block text-[11px]">Pisos Totales</span>
            <span className="text-base font-bold text-indigo-900 font-mono mt-0.5 block">{totalPisos} plantas</span>
          </div>
          <div className="p-2.5 bg-cyan-50/70 rounded-lg border border-cyan-100">
            <span className="text-cyan-700 font-medium block text-[11px]">Espacios / Aulas</span>
            <span className="text-base font-bold text-[#0088cc] font-mono mt-0.5 block">{totalAulasCount} espacios</span>
          </div>
        </div>

        {/* Selector de Vistas: Catálogo de Bloques (sin división), Distribución Oficial de Espacios y Vista Detallada */}
        <div className="flex items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-100 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveMainTab('bloques')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeMainTab === 'bloques'
                  ? 'bg-[#1f0533] text-[#e5a800] shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Lista de Bloques ({bloques.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMainTab('distribucion')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeMainTab === 'distribucion'
                  ? 'bg-[#1f0533] text-[#e5a800] shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Distribución de Aulas ({aulas.length} Espacios)</span>
              <span className="bg-[#1b436b] text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                Oficial
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMainTab('desplegada')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeMainTab === 'desplegada'
                  ? 'bg-[#1f0533] text-[#e5a800] shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Vista Expandida por Bloque</span>
            </button>
          </div>

          {activeMainTab === 'desplegada' && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleExpandAll}
                className="px-3.5 py-1.5 bg-[#1b436b] hover:bg-[#13304d] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                title="Desplegar o colapsar todos los campos de todos los bloques"
              >
                {isAllExpanded ? (
                  <>
                    <ChevronUp className="w-3.5 h-3.5 text-amber-300" />
                    <span>Colapsar Todos</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3.5 h-3.5 text-amber-300" />
                    <span>Desplegar Todos</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
      </div>

      {/* VISTA 1: VISTA DESPLEGADA CON TODOS LOS CAMPOS DE TODOS LOS BLOQUES */}
      {activeMainTab === 'desplegada' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Barra de Filtros y Herramientas */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por aula, bloque, código, piso o recursos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0099e6]/20 focus:border-[#0099e6]"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto flex-wrap justify-between md:justify-end">
              <select
                value={filterEstado}
                onChange={(e) => setFilterEstado(e.target.value)}
                aria-label="Filtrar por estado"
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#0099e6]/20"
              >
                <option value="TODOS">Todos los Estados</option>
                <option value="ACTIVO">Activos</option>
                <option value="INACTIVO">Inactivos</option>
              </select>

              <button
                type="button"
                onClick={handleToggleExpandAll}
                className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold rounded-xl border border-amber-200 flex items-center gap-1.5 transition cursor-pointer"
              >
                {isAllExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                <span>{isAllExpanded ? 'Colapsar todos' : 'Desplegar todos los campos'}</span>
              </button>

              <button
                onClick={handleExportDistribucionCSV}
                type="button"
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition cursor-pointer border border-slate-200"
                title="Descargar todos los campos en formato CSV"
              >
                <Download className="w-3.5 h-3.5 text-slate-600" />
                <span>Exportar CSV</span>
              </button>
            </div>
          </div>

          {/* Listado de Bloques Desplegados con Todos sus Campos y Aulas */}
          {filteredBloques.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-400">
              <Layers className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-700">No se encontraron bloques con los filtros seleccionados.</p>
              <p className="text-xs text-slate-400 mt-1">Intenta modificar la búsqueda o los filtros.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredBloques.map((bloque) => {
                const isExpanded = expandedBloqueIds.has(bloque.id_bloque);
                const blockAulas = aulas.filter(a => a.id_bloque === bloque.id_bloque);
                const matchingAulas = blockAulas.filter(a => {
                  if (!searchTerm) return true;
                  const s = searchTerm.toLowerCase();
                  return (
                    a.codigo.toLowerCase().includes(s) ||
                    a.nombre.toLowerCase().includes(s) ||
                    bloque.codigo.toLowerCase().includes(s) ||
                    bloque.nombre.toLowerCase().includes(s) ||
                    String(a.piso).includes(s) ||
                    (a.recursos && a.recursos.toLowerCase().includes(s))
                  );
                });

                const sedeNombre = bloque.sede_nombre || sedeMap.get(bloque.id_sede) || 'UIO_NORTE';
                const totalCap = blockAulas.reduce((acc, a) => acc + (a.capacidad || 0), 0);
                const countLabs = blockAulas.filter(a => a.tipo === 'LABORATORIO' || a.tipo === 'TALLER').length;
                const countTeoricas = blockAulas.filter(a => a.tipo === 'AULA').length;

                return (
                  <div 
                    key={bloque.id_bloque} 
                    className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden transition-all duration-200 hover:border-slate-300"
                  >
                    {/* Header del Bloque (Desplegable) */}
                    <div className="p-4 bg-gradient-to-r from-slate-50 via-white to-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start sm:items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleToggleBloqueExpand(bloque.id_bloque)}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition cursor-pointer mt-0.5 sm:mt-0"
                          title={isExpanded ? 'Colapsar bloque' : 'Desplegar todos los campos de este bloque'}
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-slate-800" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-800" />
                          )}
                        </button>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-black text-xs bg-[#1f0533] text-[#e5a800] px-2.5 py-0.5 rounded shadow-2xs">
                              {bloque.codigo}
                            </span>
                            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                              {bloque.nombre}
                            </h3>
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                              <School className="w-3 h-3 text-slate-500" />
                              <span>Sede {sedeNombre}</span>
                            </span>
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                              <span>{bloque.numero_pisos} {bloque.numero_pisos === 1 ? 'planta' : 'plantas'}</span>
                            </span>
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded-full border border-cyan-100">
                              <DoorOpen className="w-3 h-3 text-cyan-600" />
                              <span>{blockAulas.length} espacios registrados</span>
                            </span>
                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              bloque.estado === 'ACTIVO'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${bloque.estado === 'ACTIVO' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                              <span>{bloque.estado}</span>
                            </span>
                          </div>

                          {/* Descripción completa (sin truncar) */}
                          <p className="text-xs text-slate-600 mt-1">
                            {bloque.descripcion || <span className="text-slate-400 italic">Infraestructura institucional para docencia, prácticas y laboratorios.</span>}
                          </p>
                        </div>
                      </div>

                      {/* Acciones del Bloque */}
                      <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                        <button
                          type="button"
                          onClick={() => handleToggleBloqueExpand(bloque.id_bloque)}
                          className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition cursor-pointer"
                        >
                          {isExpanded ? 'Ocultar Aulas' : `Ver ${blockAulas.length} Aulas`}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(bloque)}
                          className="p-1.5 text-slate-500 hover:text-[#0099e6] hover:bg-blue-50 rounded-lg transition cursor-pointer"
                          title="Editar bloque"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmBloque(bloque)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Eliminar bloque"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Tabla de Aulas Desplegada para este bloque */}
                    {isExpanded && (
                      <div className="p-3 sm:p-4 bg-slate-50/50 space-y-3">
                        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                          <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                            <Table className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Campos Completos y Distribución de Espacios ({matchingAulas.length} de {blockAulas.length})</span>
                          </span>
                          <span className="text-[11px]">
                            Capacidad Total Estimada: <strong className="text-slate-800 font-mono">{totalCap}</strong> puestos | <strong className="text-blue-700 font-mono">{countTeoricas}</strong> aulas teóricas | <strong className="text-amber-700 font-mono">{countLabs}</strong> laboratorios/talleres
                          </span>
                        </div>

                        {matchingAulas.length === 0 ? (
                          <div className="p-6 bg-white rounded-xl border border-slate-200 text-center text-slate-400 text-xs">
                            No hay espacios que coincidan con la búsqueda dentro de este bloque.
                          </div>
                        ) : (
                          <div className="bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-2xs">
                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                  <tr className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200">
                                    <th className="py-2 px-3 w-12 text-center">ORD</th>
                                    <th className="py-2 px-3 w-20 text-center">Bloque</th>
                                    <th className="py-2 px-3">Aula / Nombre Espacio</th>
                                    <th className="py-2 px-3 w-28">Código</th>
                                    <th className="py-2 px-3 w-24 text-center">Capacidad</th>
                                    <th className="py-2 px-3 w-20 text-center">Piso</th>
                                    <th className="py-2 px-3 w-28">Sede</th>
                                    <th className="py-2 px-3 w-28 text-center">Tipo</th>
                                    <th className="py-2 px-4">Recursos / Equipamiento</th>
                                    <th className="py-2 px-3 w-24 text-center">Estado</th>
                                    <th className="py-2 px-3 w-16 text-center">Acciones</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {matchingAulas.map((aula) => {
                                    const blqLetra = bloque.codigo.replace('BLQ-', '');
                                    const capText = formatCapacidadDisplay(aula);
                                    const isLab = aula.tipo === 'LABORATORIO' || aula.tipo === 'TALLER';

                                    return (
                                      <tr key={aula.id_aula_laboratorio} className="hover:bg-blue-50/40 transition-colors">
                                        <td className="py-2 px-3 text-center font-mono font-bold text-slate-600 bg-slate-50/50">
                                          {aula.id_aula_laboratorio}
                                        </td>
                                        <td className="py-2 px-3 text-center">
                                          <span className="font-mono font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                            {blqLetra}
                                          </span>
                                        </td>
                                        <td className="py-2 px-3 font-semibold text-slate-900">
                                          <div className="flex items-center gap-1.5">
                                            {aula.codigo === 'B5' || aula.tipo === 'COWORKING' ? (
                                              <Users className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                            ) : isLab ? (
                                              <Laptop className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                                            ) : (
                                              <DoorOpen className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                            )}
                                            <span>{aula.nombre}</span>
                                          </div>
                                        </td>
                                        <td className="py-2 px-3 font-mono font-bold text-slate-700">
                                          <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[11px] border border-slate-200">
                                            {aula.codigo}
                                          </span>
                                        </td>
                                        <td className="py-2 px-3 text-center font-mono font-bold">
                                          {capText === 'Coworking' || aula.codigo === 'B5' ? (
                                            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] bg-amber-50 text-amber-800 border border-amber-200 font-bold">
                                              Coworking (No es aula)
                                            </span>
                                          ) : capText === 'N/A' ? (
                                            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-500 border border-slate-200">
                                              N/A
                                            </span>
                                          ) : capText === '0' ? (
                                            <span className="text-slate-400">0</span>
                                          ) : (
                                            <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                                              {capText}
                                            </span>
                                          )}
                                        </td>
                                        <td className="py-2 px-3 text-center font-mono text-slate-700">
                                          <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[11px] font-bold border border-indigo-100">
                                            Piso {aula.piso}
                                          </span>
                                        </td>
                                        <td className="py-2 px-3 text-slate-600 font-medium text-[11px]">
                                          {sedeNombre}
                                        </td>
                                        <td className="py-2 px-3 text-center">
                                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                            aula.codigo === 'B5' || aula.tipo === 'COWORKING'
                                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                              : isLab 
                                              ? 'bg-purple-50 text-purple-800 border border-purple-200' 
                                              : 'bg-blue-50 text-blue-800 border border-blue-100'
                                          }`}>
                                            {aula.codigo === 'B5' || aula.tipo === 'COWORKING' ? 'COWORKING' : aula.tipo}
                                          </span>
                                        </td>
                                        <td className="py-2 px-4 text-slate-600 text-xs">
                                          {aula.recursos ? (
                                            <span className="text-slate-700">{aula.recursos}</span>
                                          ) : (
                                            <span className="text-slate-400 italic">Pizarra, mobiliario y proyección</span>
                                          )}
                                        </td>
                                        <td className="py-2 px-3 text-center">
                                          {(() => {
                                            const isC1toC4 = ['C1', 'C2', 'C3', 'C4'].includes(aula.codigo);
                                            const isNoDisp = aula.estado === 'INACTIVO' || isC1toC4;
                                            const isOcup = aula.estado === 'OCUPADO';
                                            const isMant = aula.estado === 'MANTENIMIENTO';
                                            const isDisp = aula.estado === 'DISPONIBLE' && !isC1toC4;
                                            return (
                                              <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                                isNoDisp 
                                                  ? 'text-rose-800 bg-rose-100 border-rose-300 font-mono font-black' 
                                                  : isDisp 
                                                  ? 'text-emerald-700 bg-emerald-50 border-emerald-300' 
                                                  : isOcup 
                                                  ? 'text-blue-800 bg-blue-50 border-blue-200'
                                                  : isMant
                                                  ? 'text-amber-800 bg-amber-50 border-amber-200'
                                                  : 'text-emerald-700 bg-emerald-50 border-emerald-300'
                                              }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${
                                                  isNoDisp ? 'bg-rose-500' : isDisp ? 'bg-emerald-500' : isOcup ? 'bg-blue-500' : isMant ? 'bg-amber-500' : 'bg-emerald-500'
                                                }`}></span>
                                                <span>{isC1toC4 ? 'N/A' : isNoDisp ? 'NO DISPONIBLE' : aula.estado}</span>
                                              </span>
                                            );
                                          })()}
                                        </td>
                                        <td className="py-2 px-3 text-center">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setModalSearchTerm(aula.codigo);
                                              setSelectedBloqueForAulas(bloque);
                                            }}
                                            className="p-1 text-slate-400 hover:text-cyan-700 hover:bg-cyan-50 rounded transition cursor-pointer"
                                            title="Ver detalles completos del aula"
                                          >
                                            <Eye className="w-3.5 h-3.5" />
                                          </button>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VISTA 2: DISTRIBUCIÓN OFICIAL DE AULAS (65 ESPACIOS) */}
      {activeMainTab === 'distribucion' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Barra de filtros de la distribución */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
              <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1 shrink-0">
                <Filter className="w-3.5 h-3.5" /> Bloque:
              </span>
              {['TODOS', 'BLQ-A', 'BLQ-B', 'BLQ-C', 'BLQ-D', 'BLQ-E', 'BLQ-F', 'BLQ-M'].map(blqKey => {
                const isActive = distribucionBloqueFilter === blqKey;
                const count = blqKey === 'TODOS' 
                  ? aulas.length 
                  : aulas.filter(a => bloqueMap.get(a.id_bloque)?.codigo === blqKey).length;
                return (
                  <button
                    key={blqKey}
                    type="button"
                    onClick={() => setDistribucionBloqueFilter(blqKey)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition shrink-0 cursor-pointer ${
                      isActive 
                        ? 'bg-[#1b436b] text-white shadow-xs' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {blqKey === 'TODOS' ? 'Todos' : blqKey.replace('BLQ-', 'Bloque ')} ({count})
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative w-full md:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar aula, laboratorio, piso o recurso..."
                  value={distribucionSearch}
                  onChange={(e) => setDistribucionSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0099e6]/20 focus:border-[#0099e6]"
                />
              </div>

              <button
                onClick={handleExportDistribucionCSV}
                type="button"
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition cursor-pointer border border-slate-200 shrink-0"
                title="Descargar esta tabla en formato CSV"
              >
                <Download className="w-3.5 h-3.5 text-slate-600" />
                <span className="hidden sm:inline">Exportar CSV</span>
              </button>
            </div>
          </div>

          {/* Tabla idéntica a la hoja institucional con TODOS los campos */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 z-10 shadow-xs">
                  <tr className="bg-[#1b436b] text-white font-bold border-b border-[#265380]">
                    <th className="py-2.5 px-3 w-16 text-center border-r border-[#265380]">ORD</th>
                    <th className="py-2.5 px-3 w-20 text-center border-r border-[#265380]">Bloque</th>
                    <th className="py-2.5 px-4 border-r border-[#265380]">Aula</th>
                    <th className="py-2.5 px-3 w-24 text-center border-r border-[#265380]">Código</th>
                    <th className="py-2.5 px-4 w-28 text-center border-r border-[#265380]">Capacidad</th>
                    <th className="py-2.5 px-3 w-24 text-center border-r border-[#265380]">Pisos</th>
                    <th className="py-2.5 px-4 w-32 border-r border-[#265380]">Sede</th>
                    <th className="py-2.5 px-3 w-24 text-center border-r border-[#265380]">Tipo</th>
                    <th className="py-2.5 px-4 border-r border-[#265380]">Recursos</th>
                    <th className="py-2.5 px-3 w-24 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {filteredDistribucionAulas.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-10 text-center text-slate-400">
                        <DoorOpen className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                        <p className="text-sm font-medium">No se encontraron aulas con los filtros seleccionados.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredDistribucionAulas.map((aula, idx) => {
                      const blq = bloqueMap.get(aula.id_bloque);
                      const blqLetra = blq ? blq.codigo.replace('BLQ-', '') : 'A';
                      const capText = formatCapacidadDisplay(aula);
                      const sedeText = blq?.id_sede ? sedeMap.get(blq.id_sede) || 'UIO_NORTE' : 'UIO_NORTE';
                      const isLab = aula.tipo === 'LABORATORIO' || aula.tipo === 'TALLER';

                      return (
                        <tr 
                          key={aula.id_aula_laboratorio}
                          className={`hover:bg-blue-50/50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}
                        >
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-600 border-r border-slate-100">
                            {aula.id_aula_laboratorio}
                          </td>
                          <td className="py-2.5 px-3 text-center border-r border-slate-100">
                            <span className="font-mono font-black text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
                              {blqLetra}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 font-semibold text-slate-800 border-r border-slate-100">
                            <div className="flex items-center gap-2">
                              <span className={isLab ? 'text-indigo-700 font-bold' : 'text-slate-900'}>
                                {aula.nombre}
                              </span>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-center text-slate-600 border-r border-slate-100 font-bold">
                            <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] border border-slate-200">
                              {aula.codigo}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-center font-mono font-bold border-r border-slate-100">
                            {capText === 'Coworking' ? (
                              <span className="inline-block px-2 py-0.5 rounded-full text-[10px] bg-purple-50 text-purple-700 border border-purple-200 font-bold">
                                Coworking
                              </span>
                            ) : capText === 'N/A' ? (
                              <span className="inline-block px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-500 border border-slate-200">
                                N/A
                              </span>
                            ) : capText === '0' ? (
                              <span className="text-slate-400">0</span>
                            ) : (
                              <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                                {capText}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono text-slate-700 border-r border-slate-100">
                            <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[11px] font-bold border border-indigo-100">
                              {aula.piso}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-slate-600 font-medium text-[11px] border-r border-slate-100">
                            {sedeText}
                          </td>
                          <td className="py-2.5 px-3 text-center border-r border-slate-100">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isLab 
                                ? 'bg-amber-50 text-amber-800 border border-amber-200' 
                                : 'bg-blue-50 text-blue-800 border border-blue-100'
                            }`}>
                              {aula.tipo}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-slate-600 text-xs border-r border-slate-100">
                            {aula.recursos || <span className="text-slate-300 italic">Pizarra y mobiliario</span>}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {(() => {
                              const isC1toC4 = ['C1', 'C2', 'C3', 'C4'].includes(aula.codigo);
                              const isNoDisp = aula.estado === 'INACTIVO' || isC1toC4;
                              const isOcup = aula.estado === 'OCUPADO';
                              const isMant = aula.estado === 'MANTENIMIENTO';
                              const isDisp = aula.estado === 'DISPONIBLE' && !isC1toC4;
                              return (
                                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                                  isNoDisp 
                                    ? 'text-rose-800 bg-rose-100 border-rose-300 font-mono font-black' 
                                    : isDisp
                                    ? 'text-emerald-700 bg-emerald-50 border-emerald-300'
                                    : isOcup 
                                    ? 'text-blue-800 bg-blue-50 border-blue-200'
                                    : isMant
                                    ? 'text-amber-800 bg-amber-50 border-amber-200'
                                    : 'text-emerald-700 bg-emerald-50 border-emerald-300'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${
                                    isNoDisp ? 'bg-rose-500' : isDisp ? 'bg-emerald-500' : isOcup ? 'bg-blue-500' : isMant ? 'bg-amber-500' : 'bg-emerald-500'
                                  }`}></span>
                                  <span>{isC1toC4 ? 'N/A' : isNoDisp ? 'NO DISPONIBLE' : aula.estado}</span>
                                </span>
                              );
                            })()}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer de resumen */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600">
              <span>
                Mostrando <strong className="font-mono text-slate-900">{filteredDistribucionAulas.length}</strong> de <strong className="font-mono text-slate-900">{aulas.length}</strong> espacios educativos registrados.
              </span>
              <div className="flex items-center gap-3">
                <span>Sede: <strong className="text-slate-800 font-semibold">UIO_NORTE</strong></span>
                <span className="text-slate-300">|</span>
                <span>7 Bloques Oficiales (A, B, C, D, E, F, M)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VISTA 3: CATÁLOGO RESUMEN DE BLOQUES CON FILAS EXPANDIBLES */}
      {activeMainTab === 'bloques' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Filtros y Buscador */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por código, nombre o sede..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0099e6]/20 focus:border-[#0099e6]"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap">
              {sedes.length > 1 && (
                <select
                  value={filterSede}
                  onChange={(e) => setFilterSede(e.target.value)}
                  aria-label="Filtrar por sede"
                  className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#0099e6]/20"
                >
                  <option value="TODOS">Todas las Sedes</option>
                  {sedes.map(s => (
                    <option key={s.id_sede} value={s.id_sede}>{s.nombre}</option>
                  ))}
                </select>
              )}

              <select
                value={filterEstado}
                onChange={(e) => setFilterEstado(e.target.value)}
                aria-label="Filtrar por estado"
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#0099e6]/20"
              >
                <option value="TODOS">Todos los Estados</option>
                <option value="ACTIVO">Activos</option>
                <option value="INACTIVO">Inactivos</option>
              </select>

              <button
                type="button"
                onClick={handleToggleExpandAll}
                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200 flex items-center gap-1.5 transition cursor-pointer"
              >
                {isAllExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                <span>{isAllExpanded ? 'Colapsar filas' : 'Desplegar filas'}</span>
              </button>

              <span className="text-xs text-slate-500 ml-auto sm:ml-0 font-medium">
                {filteredBloques.length} registros
              </span>
            </div>
          </div>

          {/* Tabla de Registros */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/90 text-slate-700 font-semibold border-b border-slate-200">
                    <th className="py-3 px-3 w-10 text-center"></th>
                    <th className="py-3 px-3 w-12 text-center">#</th>
                    <th className="py-3 px-4 w-28">Código</th>
                    <th className="py-3 px-4">Nombre del Bloque</th>
                    <th className="py-3 px-4">Sede</th>
                    <th className="py-3 px-4 text-center">Pisos</th>
                    <th className="py-3 px-4 text-center">Aulas</th>
                    <th className="py-3 px-4">Descripción</th>
                    <th className="py-3 px-4 text-center">Estado</th>
                    <th className="py-3 px-4 text-center w-28">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBloques.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-10 text-center text-slate-400">
                        <Layers className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                        <p className="text-sm font-medium">No se encontraron bloques registrados.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredBloques.map((bloque, idx) => {
                      const aulasCount = aulasPorBloque.get(bloque.id_bloque) || bloque.aulas_count || 0;
                      const isActivo = bloque.estado === 'ACTIVO';
                      const sedeNombre = bloque.sede_nombre || sedeMap.get(bloque.id_sede) || 'Sede Principal';
                      const isRowExpanded = expandedBloqueIds.has(bloque.id_bloque);
                      const blockAulas = aulas.filter(a => a.id_bloque === bloque.id_bloque);

                      return (
                        <React.Fragment key={bloque.id_bloque}>
                          <tr className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleToggleBloqueExpand(bloque.id_bloque)}
                                className="p-1 hover:bg-slate-200 text-slate-600 rounded cursor-pointer"
                                title={isRowExpanded ? 'Colapsar detalles' : 'Desplegar todos los campos de este bloque'}
                              >
                                {isRowExpanded ? (
                                  <ChevronUp className="w-3.5 h-3.5" />
                                ) : (
                                  <ChevronDown className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </td>
                            <td className="py-3 px-3 text-center text-slate-400 font-mono">
                              {idx + 1}
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                {bloque.codigo}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                                <span className="font-semibold text-slate-800">{bloque.nombre}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-slate-600">
                              <div className="flex items-center gap-1.5 text-[11px]">
                                <School className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span>{sedeNombre}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center font-mono font-semibold text-slate-700">
                              <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full text-[11px] font-bold border border-indigo-100">
                                {bloque.numero_pisos} {bloque.numero_pisos === 1 ? 'piso' : 'pisos'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center font-mono font-semibold text-slate-700">
                              <button
                                type="button"
                                onClick={() => handleToggleBloqueExpand(bloque.id_bloque)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-cyan-50 text-cyan-800 border border-cyan-200 hover:bg-cyan-100 transition cursor-pointer"
                                title={`Clic para desplegar los ${aulasCount} espacios`}
                              >
                                <DoorOpen className="w-3.5 h-3.5 text-cyan-600" />
                                <span>{aulasCount} {aulasCount === 1 ? 'espacio' : 'espacios'}</span>
                                {isRowExpanded ? <ChevronUp className="w-3 h-3 ml-0.5" /> : <ChevronDown className="w-3 h-3 ml-0.5" />}
                              </button>
                            </td>
                            <td className="py-3 px-4 text-slate-600 text-xs">
                              {bloque.descripcion || <span className="text-slate-300 italic">Sin descripción</span>}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <button
                                type="button"
                                onClick={() => handleToggleEstado(bloque)}
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition cursor-pointer ${
                                  isActivo 
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                                    : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                                }`}
                                title="Clic para cambiar estado"
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${isActivo ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                                <span>{bloque.estado}</span>
                              </button>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleToggleBloqueExpand(bloque.id_bloque)}
                                  className="p-1.5 text-slate-500 hover:text-cyan-700 hover:bg-cyan-50 rounded-lg transition cursor-pointer"
                                  title="Desplegar o colapsar aulas"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEdit(bloque)}
                                  className="p-1.5 text-slate-500 hover:text-[#0099e6] hover:bg-blue-50 rounded-lg transition cursor-pointer"
                                  title="Editar bloque"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeleteConfirmBloque(bloque)}
                                  className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                  title="Eliminar bloque"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* Subfila desplegable con todos los campos de las aulas del bloque */}
                          {isRowExpanded && (
                            <tr className="bg-slate-50/80">
                              <td colSpan={10} className="p-4 border-b border-slate-200">
                                <div className="bg-white rounded-xl border border-slate-200 p-3 space-y-2">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                                      <DoorOpen className="w-4 h-4 text-indigo-600" />
                                      <span>Espacios y Aulas pertenecientes a {bloque.nombre} ({blockAulas.length})</span>
                                    </span>
                                    <span className="text-slate-500 font-mono text-[11px]">
                                      Sede {sedeNombre} | {bloque.numero_pisos} pisos
                                    </span>
                                  </div>

                                  <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs border-collapse">
                                      <thead>
                                        <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                                          <th className="py-1.5 px-2 w-12 text-center">ORD</th>
                                          <th className="py-1.5 px-3">Aula</th>
                                          <th className="py-1.5 px-3 w-24">Código</th>
                                          <th className="py-1.5 px-3 w-20 text-center">Piso</th>
                                          <th className="py-1.5 px-3 w-24 text-center">Tipo</th>
                                          <th className="py-1.5 px-3 w-24 text-center">Capacidad</th>
                                          <th className="py-1.5 px-3">Recursos</th>
                                          <th className="py-1.5 px-3 w-24 text-center">Estado</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100">
                                        {blockAulas.map(a => {
                                          const cap = formatCapacidadDisplay(a);
                                          return (
                                            <tr key={a.id_aula_laboratorio} className="hover:bg-slate-50">
                                              <td className="py-1.5 px-2 text-center font-mono font-bold text-slate-500">
                                                {a.id_aula_laboratorio}
                                              </td>
                                              <td className="py-1.5 px-3 font-semibold text-slate-800">
                                                {a.nombre}
                                              </td>
                                              <td className="py-1.5 px-3 font-mono font-bold text-slate-700">
                                                <span className="bg-slate-100 px-1 py-0.5 rounded text-[10px] border border-slate-200">
                                                  {a.codigo}
                                                </span>
                                              </td>
                                              <td className="py-1.5 px-3 text-center font-mono text-slate-600">
                                                Piso {a.piso}
                                              </td>
                                              <td className="py-1.5 px-3 text-center">
                                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                                  a.tipo === 'LABORATORIO' ? 'bg-amber-50 text-amber-800' : 'bg-blue-50 text-blue-800'
                                                }`}>
                                                  {a.tipo}
                                                </span>
                                              </td>
                                              <td className="py-1.5 px-3 text-center font-mono font-bold">
                                                {cap === 'Coworking' || cap === 'N/A' ? (
                                                  <span className="text-purple-700">{cap}</span>
                                                ) : (
                                                  <span className="text-emerald-700">{cap} est.</span>
                                                )}
                                              </td>
                                              <td className="py-1.5 px-3 text-slate-600 text-[11px]">
                                                {a.recursos || 'Estándar'}
                                              </td>
                                              <td className="py-1.5 px-3 text-center">
                                                {(() => {
                                                  const isC1toC4 = ['C1', 'C2', 'C3', 'C4'].includes(a.codigo);
                                                  const isNoDisp = a.estado === 'INACTIVO' || isC1toC4;
                                                  const isDisp = a.estado === 'DISPONIBLE' && !isC1toC4;
                                                  return (
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                                      isNoDisp 
                                                        ? 'text-rose-800 bg-rose-100 border-rose-300 font-mono font-black' 
                                                        : isDisp
                                                        ? 'text-emerald-700 bg-emerald-50 border-emerald-300'
                                                        : a.estado === 'OCUPADO' 
                                                        ? 'text-blue-800 bg-blue-50 border-blue-200' 
                                                        : 'text-emerald-700 bg-emerald-50 border-emerald-300'
                                                    }`}>
                                                      {isC1toC4 ? 'N/A' : isNoDisp ? 'NO DISPONIBLE' : a.estado}
                                                    </span>
                                                  );
                                                })()}
                                              </td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal Crear / Editar Bloque */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    {editingBloque ? 'Editar Bloque Arquitectónico' : 'Nuevo Bloque Arquitectónico'}
                  </h3>
                  <p className="text-[11px] text-slate-500">Mantenimiento de infraestructura y distribución física</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4">
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Código <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
                    placeholder="Ej. BLQ-A"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0099e6]/20 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Sede <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.id_sede}
                    onChange={(e) => setFormData({ ...formData, id_sede: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0099e6]/20"
                  >
                    {sedes.map(s => (
                      <option key={s.id_sede} value={s.id_sede}>{s.nombre} ({s.ciudad})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre del Bloque <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Ej. BLOQUE A, BLOQUE DE TALLERES"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0099e6]/20"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Número de Pisos <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="15"
                    required
                    value={formData.numero_pisos}
                    onChange={(e) => setFormData({ ...formData, numero_pisos: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0099e6]/20 font-mono"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Cantidad de plantas arquitectónicas disponibles.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Estado <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0099e6]/20"
                  >
                    <option value="ACTIVO">ACTIVO (Habilitado)</option>
                    <option value="INACTIVO">INACTIVO (En remodelación)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Descripción o Referencia de Ubicación
                </label>
                <textarea
                  rows={2}
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Ej. Bloque principal frente a la biblioteca central, incluye laboratorios de informática."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0099e6]/20 resize-none"
                />
              </div>

              <div className="flex items-center justify-between gap-2.5 pt-3 border-t border-slate-100">
                <div>
                  {!editingBloque && (
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={(e) => handleSave(e, true)}
                      className="px-3.5 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      title="Guarda este bloque y deja el formulario listo para ingresar el siguiente"
                    >
                      <PlusCircle className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Guardar y Agregar Otro</span>
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-4 py-2 text-xs font-bold text-white bg-[#0099e6] hover:bg-[#0088cc] rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    <span>{editingBloque ? 'Actualizar Bloque' : 'Crear y Salir'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Ingreso Múltiple de Bloques */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <ListPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Ingreso Rápido Múltiple de Bloques</h3>
                  <p className="text-xs text-slate-500">
                    Crea todos los bloques que requiera el campus de una sola vez por serie, tabla o texto.
                  </p>
                </div>
              </div>
              <button
                onClick={() => !bulkSaving && setIsBulkModalOpen(false)}
                disabled={bulkSaving}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Bulk Tab Selector */}
            <div className="flex border-b border-slate-200 px-6 bg-slate-50/30 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setBulkActiveTab('generator')}
                className={`py-3 px-4 border-b-2 flex items-center gap-2 cursor-pointer transition ${
                  bulkActiveTab === 'generator'
                    ? 'border-purple-600 text-purple-700 font-bold bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>1. Generador por Serie (A-Z)</span>
              </button>
              <button
                type="button"
                onClick={() => setBulkActiveTab('table')}
                className={`py-3 px-4 border-b-2 flex items-center gap-2 cursor-pointer transition ${
                  bulkActiveTab === 'table'
                    ? 'border-purple-600 text-purple-700 font-bold bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Layers className="w-4 h-4 text-purple-600" />
                <span>2. Tabla de Bloques ({bulkRows.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setBulkActiveTab('paste')}
                className={`py-3 px-4 border-b-2 flex items-center gap-2 cursor-pointer transition ${
                  bulkActiveTab === 'paste'
                    ? 'border-purple-600 text-purple-700 font-bold bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <FileText className="w-4 h-4 text-purple-600" />
                <span>3. Pegar Lista de Texto</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {bulkError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{bulkError}</span>
                  </div>
                  <button onClick={() => setBulkError(null)} className="text-rose-600 hover:text-rose-900 cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Progress Bar when saving */}
              {bulkProgress && (
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl space-y-2">
                  <div className="flex justify-between text-xs font-bold text-purple-900">
                    <span>Guardando bloques en la base de datos...</span>
                    <span>{bulkProgress.current} de {bulkProgress.total}</span>
                  </div>
                  <div className="w-full bg-purple-200 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-purple-600 h-full transition-all duration-300"
                      style={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* TAB 1: GENERATOR */}
              {bulkActiveTab === 'generator' && (
                <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200/80">
                  <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <span>Generador Automático de Secuencia de Bloques</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Define la sede, el rango de letras o identificadores y genera todos los bloques necesarios con un solo clic.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Sede de Destino</label>
                      <select
                        value={bulkGeneratorConfig.id_sede}
                        onChange={(e) => setBulkGeneratorConfig({ ...bulkGeneratorConfig, id_sede: Number(e.target.value) })}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-purple-500/20"
                      >
                        {sedes.map(s => (
                          <option key={s.id_sede} value={s.id_sede}>{s.nombre} ({s.codigo})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Prefijo de Código</label>
                      <input
                        type="text"
                        value={bulkGeneratorConfig.prefijo}
                        onChange={(e) => setBulkGeneratorConfig({ ...bulkGeneratorConfig, prefijo: e.target.value.toUpperCase() })}
                        placeholder="Ej. BLQ-"
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl font-mono uppercase font-bold focus:ring-2 focus:ring-purple-500/20"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre Base</label>
                      <input
                        type="text"
                        value={bulkGeneratorConfig.nombreBase}
                        onChange={(e) => setBulkGeneratorConfig({ ...bulkGeneratorConfig, nombreBase: e.target.value })}
                        placeholder="Ej. BLOQUE"
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-purple-500/20"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Desde la Letra</label>
                      <input
                        type="text"
                        maxLength={1}
                        value={bulkGeneratorConfig.desdeLetra}
                        onChange={(e) => setBulkGeneratorConfig({ ...bulkGeneratorConfig, desdeLetra: e.target.value.toUpperCase() })}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl font-mono text-center uppercase font-bold focus:ring-2 focus:ring-purple-500/20"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Hasta la Letra</label>
                      <input
                        type="text"
                        maxLength={1}
                        value={bulkGeneratorConfig.hastaLetra}
                        onChange={(e) => setBulkGeneratorConfig({ ...bulkGeneratorConfig, hastaLetra: e.target.value.toUpperCase() })}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl font-mono text-center uppercase font-bold focus:ring-2 focus:ring-purple-500/20"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Pisos por Bloque</label>
                      <input
                        type="number"
                        min={1}
                        max={20}
                        value={bulkGeneratorConfig.pisos}
                        onChange={(e) => setBulkGeneratorConfig({ ...bulkGeneratorConfig, pisos: Number(e.target.value) })}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-purple-500/20"
                      />
                    </div>
                  </div>

                  <div className="pt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={handleGenerateSeries}
                      className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Generar Secuencia y Previsualizar Tabla</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: TABLE */}
              {bulkActiveTab === 'table' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Listado de Bloques a Registrar ({bulkRows.length})</h4>
                      <p className="text-[11px] text-slate-500">Puedes editar cualquier dato antes de guardarlos definitivamente.</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddBulkRow}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition cursor-pointer border border-slate-200"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Agregar Fila</span>
                    </button>
                  </div>

                  <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-72">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50 text-slate-600 font-semibold sticky top-0 border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3 w-10 text-center">#</th>
                          <th className="py-2.5 px-3 w-32">Código *</th>
                          <th className="py-2.5 px-3">Nombre del Bloque *</th>
                          <th className="py-2.5 px-3 w-44">Sede</th>
                          <th className="py-2.5 px-3 w-20 text-center">Pisos</th>
                          <th className="py-2.5 px-3">Descripción</th>
                          <th className="py-2.5 px-3 w-10 text-center"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {bulkRows.map((row, index) => (
                          <tr key={row.id} className="hover:bg-slate-50/50">
                            <td className="py-2 px-3 text-center text-slate-400 font-mono text-[11px]">
                              {index + 1}
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="text"
                                value={row.codigo}
                                onChange={(e) => handleUpdateBulkRow(row.id, 'codigo', e.target.value.toUpperCase())}
                                placeholder="BLQ-A"
                                className="w-full px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono uppercase font-bold focus:bg-white"
                              />
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="text"
                                value={row.nombre}
                                onChange={(e) => handleUpdateBulkRow(row.id, 'nombre', e.target.value)}
                                placeholder="BLOQUE A"
                                className="w-full px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium focus:bg-white"
                              />
                            </td>
                            <td className="py-2 px-3">
                              <select
                                value={row.id_sede}
                                onChange={(e) => handleUpdateBulkRow(row.id, 'id_sede', Number(e.target.value))}
                                className="w-full px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                              >
                                {sedes.map(s => (
                                  <option key={s.id_sede} value={s.id_sede}>{s.nombre}</option>
                                ))}
                              </select>
                            </td>
                            <td className="py-2 px-3 text-center">
                              <input
                                type="number"
                                min={1}
                                max={20}
                                value={row.numero_pisos}
                                onChange={(e) => handleUpdateBulkRow(row.id, 'numero_pisos', Number(e.target.value))}
                                className="w-16 mx-auto px-2 py-1 text-xs text-center bg-slate-50 border border-slate-200 rounded-lg font-mono focus:bg-white"
                              />
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="text"
                                value={row.descripcion}
                                onChange={(e) => handleUpdateBulkRow(row.id, 'descripcion', e.target.value)}
                                placeholder="Referencia opcional"
                                className="w-full px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-600 focus:bg-white"
                              />
                            </td>
                            <td className="py-2 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveBulkRow(row.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                                title="Eliminar fila"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 3: PASTE */}
              {bulkActiveTab === 'paste' && (
                <div className="space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-200/80">
                  <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                    <FileText className="w-4 h-4 text-purple-600" />
                    <span>Pegar Lista de Bloques en Texto</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Pega un bloque por línea. Puedes escribir solo el nombre o formato separado por coma: <code>CÓDIGO, NOMBRE, PISOS, DESCRIPCIÓN</code>.
                  </p>

                  <textarea
                    rows={6}
                    value={bulkPasteText}
                    onChange={(e) => setBulkPasteText(e.target.value)}
                    placeholder={`Ejemplo:\nBLQ-A, BLOQUE A - CIENCIAS, 3, Aulas generales\nBLQ-B, BLOQUE B - INGENIERÍA, 4, Laboratorios especializados\nBLQ-C, BLOQUE C - SALUD, 3\nBLQ-D, BLOQUE D - IDIOMAS, 2`}
                    className="w-full p-3 font-mono text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 resize-none"
                  />

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={handleParsePasteText}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Convertir en Filas de Tabla</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/60">
              <div className="text-xs text-slate-500">
                Total a registrar: <strong className="text-purple-700 font-mono text-sm">{bulkRows.length}</strong> bloques
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsBulkModalOpen(false)}
                  disabled={bulkSaving}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer disabled:opacity-50"
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  onClick={handleSaveAllBulk}
                  disabled={bulkSaving || bulkRows.length === 0}
                  className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {bulkSaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Guardando ({bulkProgress?.current || 0}/{bulkProgress?.total || bulkRows.length})...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Registrar todos los bloques ({bulkRows.length})</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmar Eliminación */}
      {deleteConfirmBloque && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-200 p-5 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">¿Eliminar Bloque?</h3>
                <p className="text-xs text-slate-500">Esta acción no se puede deshacer.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
              ¿Estás seguro de que deseas eliminar el bloque <strong className="text-slate-900 font-mono">{deleteConfirmBloque.codigo} - {deleteConfirmBloque.nombre}</strong>?
            </p>

            {(aulasPorBloque.get(deleteConfirmBloque.id_bloque) || 0) > 0 && (
              <p className="text-[11px] text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                ⚠️ Este bloque tiene {aulasPorBloque.get(deleteConfirmBloque.id_bloque)} espacios/aulas asociadas. Debe reubicarlas antes de poder eliminarlo.
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmBloque(null)}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSaving}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Confirmar Eliminación</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Aulas del Bloque Seleccionado */}
      {selectedBloqueForAulas && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
            
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-slate-900 to-[#1f0533] text-white">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-400/20 border border-amber-300/30 flex items-center justify-center text-amber-300">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-white">
                      {selectedBloqueForAulas.nombre}
                    </h3>
                    <span className="font-mono text-xs bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded">
                      {selectedBloqueForAulas.codigo}
                    </span>
                  </div>
                  <p className="text-xs text-purple-200">
                    Distribución de espacios y aulas en Sede {selectedBloqueForAulas.sede_nombre || sedeMap.get(selectedBloqueForAulas.id_sede) || 'UIO_NORTE'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBloqueForAulas(null)}
                className="text-purple-200 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Ribbon de estadísticas del Bloque */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-4 bg-slate-50 border-b border-slate-200 text-xs">
              <div className="p-2.5 bg-white rounded-xl border border-slate-200/80">
                <span className="text-slate-500 text-[11px] block">Total Espacios</span>
                <span className="text-base font-bold text-slate-900 font-mono mt-0.5 block">
                  {aulasDelBloqueSeleccionado.length} aulas
                </span>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-slate-200/80">
                <span className="text-slate-500 text-[11px] block">Pisos / Plantas</span>
                <span className="text-base font-bold text-indigo-700 font-mono mt-0.5 block">
                  {selectedBloqueForAulas.numero_pisos} {selectedBloqueForAulas.numero_pisos === 1 ? 'piso' : 'pisos'}
                </span>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-slate-200/80">
                <span className="text-slate-500 text-[11px] block">Aulas Teóricas</span>
                <span className="text-base font-bold text-blue-700 font-mono mt-0.5 block">
                  {aulasDelBloqueSeleccionado.filter(a => a.tipo === 'AULA').length}
                </span>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-slate-200/80">
                <span className="text-slate-500 text-[11px] block">Laboratorios/Talleres</span>
                <span className="text-base font-bold text-amber-700 font-mono mt-0.5 block">
                  {aulasDelBloqueSeleccionado.filter(a => a.tipo !== 'AULA').length}
                </span>
              </div>
            </div>

            {/* Buscador interno */}
            <div className="p-3 border-b border-slate-200 flex items-center justify-between gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filtrar por código o nombre de aula..."
                  value={modalSearchTerm}
                  onChange={(e) => setModalSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0099e6]/20 focus:border-[#0099e6]"
                />
              </div>
              <span className="text-xs text-slate-500 font-medium shrink-0">
                {aulasDelBloqueSeleccionado.length} espacios
              </span>
            </div>

            {/* Tabla de Aulas del bloque */}
            <div className="overflow-y-auto flex-1 p-4">
              {aulasDelBloqueSeleccionado.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <DoorOpen className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="text-xs font-semibold">No hay aulas asignadas a este bloque con el filtro actual.</p>
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <th className="py-2.5 px-3 w-14 text-center">ORD</th>
                      <th className="py-2.5 px-3">Código</th>
                      <th className="py-2.5 px-3">Nombre Espacio</th>
                      <th className="py-2.5 px-3 text-center">Piso</th>
                      <th className="py-2.5 px-3 text-center">Tipo</th>
                      <th className="py-2.5 px-3 text-center">Capacidad</th>
                      <th className="py-2.5 px-3 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {aulasDelBloqueSeleccionado.map((a) => {
                      const cap = formatCapacidadDisplay(a);
                      return (
                        <tr key={a.id_aula_laboratorio} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2 px-3 text-center font-mono font-bold text-slate-500">
                            {a.id_aula_laboratorio}
                          </td>
                          <td className="py-2 px-3">
                            <span className="font-mono font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                              {a.codigo}
                            </span>
                          </td>
                          <td className="py-2 px-3 font-semibold text-slate-800">
                            {a.nombre}
                          </td>
                          <td className="py-2 px-3 text-center font-mono">
                            <span className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-bold text-[11px]">
                              Piso {a.piso}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              a.tipo === 'LABORATORIO' 
                                ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}>
                              {a.tipo}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-center font-mono font-bold">
                            {cap === 'Coworking' || cap === 'N/A' ? (
                              <span className="text-purple-700 bg-purple-50 px-2 py-0.5 rounded text-[11px] border border-purple-200">
                                {cap}
                              </span>
                            ) : (
                              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                                {cap} puestos
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              <span>{a.estado}</span>
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Sede Principal: <strong className="text-slate-800">UIO_NORTE</strong>
              </span>
              <button
                type="button"
                onClick={() => setSelectedBloqueForAulas(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE AUDITORÍA Y VERIFICACIÓN MINUCIOSA (6 DIMENSIONES) */}
      <ModalAuditoriaAulas
        isOpen={isAuditoriaModalOpen}
        onClose={() => setIsAuditoriaModalOpen(false)}
        aulas={aulas}
        bloques={bloques}
        sedes={sedes}
      />
    </div>
  );
};
