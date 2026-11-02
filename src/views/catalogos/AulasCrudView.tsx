import React, { useState, useMemo } from 'react';
import { AulaLaboratorio, Bloque, Sede, PlanificacionCompleta } from '../../types.ts';
import { ApiClient } from '../../controllers/apiClient.ts';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  RefreshCw, 
  DoorOpen, 
  Laptop, 
  CheckCircle2, 
  X, 
  AlertTriangle,
  Download,
  Building2,
  Users,
  Wrench,
  Ban,
  ListPlus,
  Sparkles,
  PlusCircle,
  FileText,
  Check,
  Layers,
  ArrowRight,
  FileSpreadsheet,
  Pin,
  ShieldCheck
} from 'lucide-react';
import { ExportController } from '../../controllers/exportController.ts';
import { PaginationControls } from '../../components/common/PaginationControls.tsx';
import { ModalAuditoriaAulas } from '../../components/ModalAuditoriaAulas.tsx';

export interface BulkAulaRow {
  id: string;
  codigo: string;
  nombre: string;
  id_bloque: number;
  piso: number;
  tipo: 'AULA' | 'LABORATORIO' | 'COWORKING';
  capacidad: number;
  recursos: string;
}

interface AulasCrudViewProps {
  aulas: AulaLaboratorio[];
  bloques: Bloque[];
  sedes?: Sede[];
  planificaciones?: PlanificacionCompleta[];
  onRefresh: () => void;
}

export const AulasCrudView: React.FC<AulasCrudViewProps> = ({
  aulas,
  bloques,
  sedes = [],
  planificaciones = [],
  onRefresh
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSede, setFilterSede] = useState<string>('TODOS');
  const [filterTipo, setFilterTipo] = useState<string>('TODOS');
  const [filterBloque, setFilterBloque] = useState<string>('TODOS');
  const [filterPiso, setFilterPiso] = useState<string>('TODOS');
  const [filterEstado, setFilterEstado] = useState<string>('TODOS');
  const [isAuditoriaModalOpen, setIsAuditoriaModalOpen] = useState(false);
  
  // Paginación y visualización completa
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number | 'all'>('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAula, setEditingAula] = useState<AulaLaboratorio | null>(null);
  const [deleteConfirmAula, setDeleteConfirmAula] = useState<AulaLaboratorio | null>(null);
  
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const defaultBloqueId = bloques.length > 0 ? bloques[0].id_bloque : 1;

  // Estados de Ingreso Masivo / Múltiple
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkActiveTab, setBulkActiveTab] = useState<'generator' | 'table' | 'paste'>('generator');
  const [bulkRows, setBulkRows] = useState<BulkAulaRow[]>([]);
  const [bulkPasteText, setBulkPasteText] = useState('');
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{ current: number; total: number } | null>(null);
  const [bulkError, setBulkError] = useState<string | null>(null);

  const [bulkGeneratorConfig, setBulkGeneratorConfig] = useState({
    id_bloque: defaultBloqueId,
    piso: 1,
    tipo: 'AULA' as 'AULA' | 'LABORATORIO' | 'COWORKING',
    prefijo: '',
    desdeNumero: 1,
    hastaNumero: 5,
    capacidad: 35,
    recursos: 'Proyector HDMI, Pizarra blanca, Wi-Fi 6'
  });

  const [formData, setFormData] = useState({
    id_bloque: defaultBloqueId,
    codigo: '',
    nombre: '',
    tipo: 'AULA' as 'AULA' | 'LABORATORIO' | 'COWORKING',
    capacidad: 30,
    piso: 1,
    recursos: 'Proyector HDMI, Pizarra, Conectividad Wi-Fi',
    estado: 'DISPONIBLE' as 'DISPONIBLE' | 'OCUPADO' | 'MANTENIMIENTO' | 'INACTIVO'
  });

  const bloqueMap = useMemo(() => {
    const map = new Map<number, Bloque>();
    bloques.forEach(b => map.set(b.id_bloque, b));
    return map;
  }, [bloques]);

  const maxPisosBloqueSeleccionado = useMemo(() => {
    const blq = bloqueMap.get(formData.id_bloque);
    return blq?.numero_pisos || 3;
  }, [formData.id_bloque, bloqueMap]);

  // Obtener estudiantes asignados por aula en tiempo real
  const estudiantesPorAula = useMemo(() => {
    const map = new Map<number, number>();
    if (planificaciones && planificaciones.length > 0) {
      planificaciones.forEach(p => {
        if (p.estado === 'ACTIVO') {
          const current = map.get(p.id_aula_laboratorio) || 0;
          if (p.numero_estudiantes > current) {
            map.set(p.id_aula_laboratorio, p.numero_estudiantes);
          }
        }
      });
    }
    return map;
  }, [planificaciones]);

  const filteredAulas = useMemo(() => {
    return aulas.filter(a => {
      const matchSearch = 
        a.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.bloque_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.recursos && a.recursos.toLowerCase().includes(searchTerm.toLowerCase()));

      const isCoworking = a.tipo === 'COWORKING' || a.codigo === 'B5';
      const matchTipo = filterTipo === 'TODOS' 
        ? true 
        : filterTipo === 'COWORKING'
        ? isCoworking
        : filterTipo === 'AULA'
        ? (a.tipo === 'AULA' && !isCoworking)
        : a.tipo === filterTipo;

      const matchSede = filterSede === 'TODOS' 
        ? true 
        : (a.sede_nombre === filterSede || String(a.id_sede) === filterSede);

      const matchBloque = filterBloque === 'TODOS' ? true : String(a.id_bloque) === filterBloque;
      const matchPiso = filterPiso === 'TODOS' ? true : String(a.piso) === filterPiso;
      const matchEstado = filterEstado === 'TODOS' 
        ? true 
        : filterEstado === 'NO_DISPONIBLE'
        ? (a.estado !== 'DISPONIBLE' || ['C1', 'C2', 'C3', 'C4'].includes(a.codigo))
        : a.estado === filterEstado;

      return matchSearch && matchSede && matchTipo && matchBloque && matchPiso && matchEstado;
    });
  }, [aulas, searchTerm, filterSede, filterTipo, filterBloque, filterPiso, filterEstado]);

  // Reset pagination on filter change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterSede, filterTipo, filterBloque, filterPiso, filterEstado]);

  const totalFilteredCount = filteredAulas.length;
  const numericPageSize = pageSize === 'all' ? totalFilteredCount || 1 : pageSize;
  const totalPages = pageSize === 'all' ? 1 : Math.max(1, Math.ceil(totalFilteredCount / numericPageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedAulas = useMemo(() => {
    if (pageSize === 'all') return filteredAulas;
    const start = (safeCurrentPage - 1) * numericPageSize;
    return filteredAulas.slice(start, start + numericPageSize);
  }, [filteredAulas, safeCurrentPage, numericPageSize, pageSize]);

  // Pisos únicos disponibles para filtro
  const pisosDisponibles = useMemo(() => {
    const set = new Set<number>();
    aulas.forEach(a => set.add(a.piso));
    return Array.from(set).sort((a, b) => a - b);
  }, [aulas]);

  // KPIs
  const totalCapacidad = aulas.reduce((acc, a) => acc + (a.codigo === 'B5' || a.tipo === 'COWORKING' ? 0 : a.capacidad), 0);
  const totalAulasCount = aulas.filter(a => a.tipo === 'AULA' && a.codigo !== 'B5').length;
  const totalLabsCount = aulas.filter(a => a.tipo === 'LABORATORIO').length;
  const totalCoworkingCount = aulas.filter(a => a.tipo === 'COWORKING' || a.codigo === 'B5').length;
  const totalDisponibles = aulas.filter(a => a.estado === 'DISPONIBLE' && !['C1', 'C2', 'C3', 'C4'].includes(a.codigo)).length;
  const totalNoDisponibles = aulas.filter(a => a.estado !== 'DISPONIBLE' || ['C1', 'C2', 'C3', 'C4'].includes(a.codigo)).length;

  const getNextSuggestedAulaCode = (currentCode?: string, idBloque?: number, pisoNum?: number) => {
    if (currentCode) {
      const match = currentCode.match(/^(.*?)(\d+)$/);
      if (match) {
        const prefix = match[1];
        const numStr = match[2];
        const nextNum = parseInt(numStr, 10) + 1;
        const padded = String(nextNum).padStart(numStr.length, '0');
        return `${prefix}${padded}`;
      }
    }
    const blq = bloqueMap.get(idBloque || defaultBloqueId);
    const pref = blq ? blq.codigo.replace('BLQ-', '').trim() : 'A';
    const piso = pisoNum || 1;
    const countInPiso = aulas.filter(a => a.id_bloque === (idBloque || defaultBloqueId) && a.piso === piso).length;
    return `${pref}${piso}${String(countInPiso + 1).padStart(2, '0')}`;
  };

  const handleOpenCreate = () => {
    setEditingAula(null);
    const blq = bloques.length > 0 ? bloques[0] : null;
    const prefijo = blq?.codigo.replace('BLQ-', '').trim() || 'A';
    const suggestedCode = getNextSuggestedAulaCode(undefined, defaultBloqueId, 1);
    setFormData({
      id_bloque: defaultBloqueId,
      codigo: suggestedCode,
      nombre: `AULA ${suggestedCode}`,
      tipo: 'AULA',
      capacidad: 35,
      piso: 1,
      recursos: 'Proyector HDMI, Pizarra blanca, Wi-Fi 6',
      estado: 'DISPONIBLE'
    });
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (aula: AulaLaboratorio) => {
    setEditingAula(aula);
    setFormData({
      id_bloque: aula.id_bloque || defaultBloqueId,
      codigo: aula.codigo,
      nombre: aula.nombre,
      tipo: aula.tipo,
      capacidad: aula.capacidad,
      piso: aula.piso,
      recursos: aula.recursos || '',
      estado: aula.estado
    });
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e?: React.FormEvent, andAddAnother: boolean = false) => {
    if (e) e.preventDefault();
    if (!formData.codigo.trim() || !formData.nombre.trim()) {
      setErrorMessage('Por favor completa el código y nombre del espacio.');
      return;
    }

    if (formData.capacidad < 0) {
      setErrorMessage('La capacidad de puestos no puede ser negativa.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      if (editingAula) {
        await ApiClient.updateCatalogItem('aulas', editingAula.id_aula_laboratorio, formData);
        setSuccessMessage(`Espacio "${formData.nombre}" actualizado correctamente.`);
        setIsModalOpen(false);
      } else {
        await ApiClient.createCatalogItem('aulas', formData);
        setSuccessMessage(`Espacio "${formData.nombre}" registrado exitosamente.`);
        if (andAddAnother) {
          const nextCode = getNextSuggestedAulaCode(formData.codigo, formData.id_bloque, formData.piso);
          setFormData(prev => ({
            ...prev,
            codigo: nextCode,
            nombre: `${prev.tipo === 'AULA' ? 'AULA' : 'LABORATORIO'} ${nextCode}`,
            estado: 'DISPONIBLE'
          }));
          setIsModalOpen(true);
        } else {
          setIsModalOpen(false);
        }
      }
      onRefresh();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al guardar aula/laboratorio.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handlers para Ingreso Masivo
  const handleOpenBulkModal = () => {
    setBulkError(null);
    setBulkProgress(null);
    setBulkActiveTab('generator');
    const blq = bloques.length > 0 ? bloques[0] : null;
    const pref = blq ? blq.codigo.replace('BLQ-', '').trim() : 'A';
    setBulkGeneratorConfig({
      id_bloque: defaultBloqueId,
      piso: 1,
      tipo: 'AULA',
      prefijo: `${pref}10`,
      desdeNumero: 1,
      hastaNumero: 5,
      capacidad: 35,
      recursos: 'Proyector HDMI, Pizarra blanca, Wi-Fi 6'
    });
    if (bulkRows.length === 0) {
      setBulkRows([
        {
          id: 'row-1',
          codigo: `${pref}101`,
          nombre: `AULA ${pref}101`,
          id_bloque: defaultBloqueId,
          piso: 1,
          tipo: 'AULA',
          capacidad: 35,
          recursos: 'Proyector HDMI, Pizarra blanca, Wi-Fi 6'
        },
        {
          id: 'row-2',
          codigo: `${pref}102`,
          nombre: `AULA ${pref}102`,
          id_bloque: defaultBloqueId,
          piso: 1,
          tipo: 'AULA',
          capacidad: 35,
          recursos: 'Proyector HDMI, Pizarra blanca, Wi-Fi 6'
        }
      ]);
    }
    setIsBulkModalOpen(true);
  };

  const handleGenerateSeries = () => {
    setBulkError(null);
    const { id_bloque, piso, tipo, desdeNumero, hastaNumero, capacidad, recursos } = bulkGeneratorConfig;
    if (desdeNumero > hastaNumero) {
      setBulkError('El número inicial debe ser menor o igual al número final.');
      return;
    }
    const count = hastaNumero - desdeNumero + 1;
    if (count > 50) {
      setBulkError('El rango no puede superar las 50 aulas por lote.');
      return;
    }

    const blq = bloqueMap.get(id_bloque);
    const blqLetter = blq ? blq.codigo.replace('BLQ-', '').trim() : 'A';
    const basePref = bulkGeneratorConfig.prefijo.trim() || `${blqLetter}${piso}0`;

    const newRows: BulkAulaRow[] = [];
    let idCounter = Date.now();
    for (let n = desdeNumero; n <= hastaNumero; n++) {
      const codigo = `${basePref}${n}`;
      const nombre = `${tipo === 'AULA' ? 'AULA' : 'LABORATORIO'} ${codigo}`;
      newRows.push({
        id: `gen-${idCounter++}`,
        codigo,
        nombre,
        id_bloque,
        piso,
        tipo,
        capacidad: capacidad || 35,
        recursos: recursos || ''
      });
    }

    setBulkRows(newRows);
    setBulkActiveTab('table');
  };

  const handleParsePasteText = () => {
    if (!bulkPasteText.trim()) {
      setBulkError('Por favor pega texto con los datos de las aulas.');
      return;
    }
    setBulkError(null);
    const lines = bulkPasteText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    const parsedRows: BulkAulaRow[] = [];
    let idCounter = Date.now();

    for (const line of lines) {
      const parts = line.split(/[,\t;]/).map(p => p.trim());
      if (parts.length === 0 || !parts[0]) continue;

      let codigo = parts[0];
      let nombre = parts[1] || `AULA ${codigo}`;
      let tipoStr = (parts[2] || 'AULA').toUpperCase();
      let tipo: 'AULA' | 'LABORATORIO' = tipoStr.includes('LAB') ? 'LABORATORIO' : 'AULA';
      let cap = parseInt(parts[3], 10) || 35;
      let pisoNum = parseInt(parts[4], 10) || 1;
      let recs = parts[5] || 'Proyector HDMI, Pizarra, Wi-Fi';

      parsedRows.push({
        id: `paste-${idCounter++}`,
        codigo,
        nombre,
        id_bloque: defaultBloqueId,
        piso: pisoNum,
        tipo,
        capacidad: cap,
        recursos: recs
      });
    }

    if (parsedRows.length === 0) {
      setBulkError('No se pudieron reconocer aulas válidas del texto ingresado.');
      return;
    }

    setBulkRows(parsedRows);
    setBulkActiveTab('table');
  };

  const handleAddEmptyBulkRow = () => {
    const blq = bloqueMap.get(defaultBloqueId);
    const pref = blq ? blq.codigo.replace('BLQ-', '').trim() : 'A';
    const lastRow = bulkRows[bulkRows.length - 1];
    const nextCode = lastRow 
      ? getNextSuggestedAulaCode(lastRow.codigo, lastRow.id_bloque, lastRow.piso)
      : `${pref}10${bulkRows.length + 1}`;
    
    setBulkRows(prev => [
      ...prev,
      {
        id: `row-${Date.now()}`,
        codigo: nextCode,
        nombre: `AULA ${nextCode}`,
        id_bloque: lastRow ? lastRow.id_bloque : defaultBloqueId,
        piso: lastRow ? lastRow.piso : 1,
        tipo: lastRow ? lastRow.tipo : 'AULA',
        capacidad: lastRow ? lastRow.capacidad : 35,
        recursos: lastRow ? lastRow.recursos : 'Proyector HDMI, Pizarra blanca, Wi-Fi 6'
      }
    ]);
  };

  const handleUpdateBulkRow = (id: string, field: keyof BulkAulaRow, value: any) => {
    setBulkRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const handleDeleteBulkRow = (id: string) => {
    setBulkRows(prev => prev.filter(r => r.id !== id));
  };

  const handleSaveAllBulk = async () => {
    if (bulkRows.length === 0) {
      setBulkError('No hay aulas para registrar en la lista.');
      return;
    }

    for (let i = 0; i < bulkRows.length; i++) {
      const r = bulkRows[i];
      if (!r.codigo.trim() || !r.nombre.trim()) {
        setBulkError(`Fila #${i + 1}: El código y el nombre son obligatorios.`);
        return;
      }
      if (r.capacidad < 1) {
        setBulkError(`Fila #${i + 1} (${r.codigo}): La capacidad debe ser mayor a 0.`);
        return;
      }
    }

    setBulkSaving(true);
    setBulkError(null);
    let createdCount = 0;

    try {
      for (let i = 0; i < bulkRows.length; i++) {
        setBulkProgress({ current: i + 1, total: bulkRows.length });
        const r = bulkRows[i];
        await ApiClient.createCatalogItem('aulas', {
          id_bloque: r.id_bloque,
          codigo: r.codigo.trim(),
          nombre: r.nombre.trim(),
          tipo: r.tipo,
          capacidad: r.capacidad,
          piso: r.piso,
          recursos: r.recursos.trim(),
          estado: 'DISPONIBLE'
        });
        createdCount++;
      }

      setSuccessMessage(`¡Se ingresaron exitosamente ${createdCount} espacios físicos (aulas/laboratorios)!`);
      setIsBulkModalOpen(false);
      setBulkRows([]);
      onRefresh();
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      setBulkError(err.message || `Error al guardar en la fila ${createdCount + 1}.`);
    } finally {
      setBulkSaving(false);
      setBulkProgress(null);
    }
  };

  const handleToggleEstado = async (aula: AulaLaboratorio, nuevoEstado: string) => {
    try {
      await ApiClient.updateAulaEstado(aula.id_aula_laboratorio, nuevoEstado);
      setSuccessMessage(`Estado de ${aula.codigo} actualizado a ${nuevoEstado}.`);
      onRefresh();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al cambiar estado.');
      setTimeout(() => setErrorMessage(null), 4000);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmAula) return;
    setIsSaving(true);
    setErrorMessage(null);

    try {
      await ApiClient.deleteCatalogItem('aulas', deleteConfirmAula.id_aula_laboratorio);
      setSuccessMessage(`Aula/Laboratorio "${deleteConfirmAula.nombre}" eliminada.`);
      setDeleteConfirmAula(null);
      onRefresh();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al eliminar aula.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Codigo', 'Nombre_Espacio', 'Bloque', 'Piso', 'Tipo', 'Capacidad_Puestos', 'Estudiantes_Asignados', 'Estado', 'Recursos'];
    const rows = filteredAulas.map(a => [
      a.id_aula_laboratorio,
      `"${a.codigo}"`,
      `"${a.nombre}"`,
      `"${a.bloque_nombre}"`,
      a.piso,
      `"${a.tipo}"`,
      a.capacidad,
      estudiantesPorAula.get(a.id_aula_laboratorio) || a.max_estudiantes || a.total_estudiantes || 0,
      `"${a.estado}"`,
      `"${(a.recursos || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `aulas_laboratorios_isuj_${new Date().toISOString().slice(0, 10)}.csv`);
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

      {/* SECCIÓN CONGELADA / FIXED (MARCADA EN ROJO): CABECERA, KPIS Y BUSCADOR/FILTROS */}
      <div className="sticky top-0 z-20 bg-[#f1f5f9] -mx-1 px-1 pt-0.5 pb-2 space-y-2 shadow-2xs">
        {/* Header card & KPI Ribbon */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 sm:p-4 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-[#0099e6]/10 text-[#0099e6] rounded-lg border border-sky-100">
                <DoorOpen className="w-4 h-4" />
              </span>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base font-bold text-slate-900">Catálogo de Aulas y Laboratorios</h2>
                  <span className="text-[10px] font-bold text-red-700 bg-red-100/90 border border-red-300 px-2 py-0.5 rounded-md font-mono inline-flex items-center gap-1 shadow-2xs">
                    <Pin className="w-2.5 h-2.5 fill-red-600 text-red-600" />
                    CONGELADO
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Mantenimiento del inventario físico: Aulas teóricas, talleres técnicos y laboratorios de computación.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
            <button
              onClick={() => setIsAuditoriaModalOpen(true)}
              type="button"
              className="px-3 py-1.5 bg-[#280740] hover:bg-[#3d0a63] text-[#e5a800] text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-2xs transition cursor-pointer border border-[#e5a800]/50"
              title="Abrir auditoría minuciosa oficial: Bloque, Aula, Capacidad, Pisos, Sede, Estado"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#e5a800]" />
              <span>Auditoría Minuciosa (6 Dim.)</span>
            </button>

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
              onClick={() => ExportController.exportAulasXLSX(filteredAulas, `aulas_laboratorios_isuj_${new Date().toISOString().slice(0, 10)}.xlsx`)}
              type="button"
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
              title="Exportar aulas y laboratorios filtrados a formato Microsoft Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Exportar Excel</span>
            </button>

            <button
              onClick={handleOpenBulkModal}
              type="button"
              className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
              title="Registrar múltiples aulas/laboratorios en lote"
            >
              <ListPlus className="w-3.5 h-3.5 text-emerald-200" />
              <span>Ingreso Múltiple</span>
            </button>

            <button
              onClick={handleOpenCreate}
              type="button"
              className="px-3.5 py-1.5 bg-[#0099e6] hover:bg-[#0088cc] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nueva Aula / Lab</span>
            </button>
          </div>
        </div>

        {/* KPIs Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5 mt-3 pt-3 border-t border-slate-100 text-xs">
          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/70">
            <span className="text-slate-500 font-medium block text-[11px]">Total Espacios</span>
            <span className="text-base font-bold text-slate-900 font-mono mt-0.5 block">{aulas.length}</span>
          </div>
          <div className="p-2.5 bg-blue-50/70 rounded-lg border border-blue-100">
            <span className="text-blue-700 font-medium block text-[11px]">Aulas Regulares</span>
            <span className="text-base font-bold text-blue-900 font-mono mt-0.5 block">{totalAulasCount}</span>
          </div>
          <div className="p-2.5 bg-purple-50/70 rounded-lg border border-purple-100">
            <span className="text-purple-700 font-medium block text-[11px]">Laboratorios</span>
            <span className="text-base font-bold text-purple-900 font-mono mt-0.5 block">{totalLabsCount}</span>
          </div>
          <div className="p-2.5 bg-cyan-50/70 rounded-lg border border-cyan-100">
            <span className="text-cyan-700 font-medium block text-[11px]">Capacidad Instalada</span>
            <span className="text-base font-bold text-[#0088cc] font-mono mt-0.5 block">{totalCapacidad} puestos</span>
          </div>
          <div className="p-2.5 bg-emerald-50/70 rounded-lg border border-emerald-100">
            <span className="text-emerald-700 font-medium block text-[11px]">Disponibles</span>
            <span className="text-base font-bold text-emerald-800 font-mono mt-0.5 block">{totalDisponibles} libres</span>
          </div>
          <button
            type="button"
            onClick={() => setFilterEstado(filterEstado === 'NO_DISPONIBLE' ? 'TODOS' : 'NO_DISPONIBLE')}
            className={`p-2.5 rounded-lg border text-left transition cursor-pointer ${
              filterEstado === 'NO_DISPONIBLE'
                ? 'bg-rose-100 border-rose-300 ring-2 ring-rose-400'
                : 'bg-rose-50/80 border-rose-200 hover:bg-rose-100/70'
            }`}
            title="Clic para filtrar por Aulas No Disponibles (C1, C2, C3, C4, mantenimiento o inactivas)"
          >
            <span className="text-rose-700 font-bold block text-[11px] flex items-center justify-between">
              <span>No Disponibles</span>
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
            </span>
            <span className="text-base font-bold text-rose-900 font-mono mt-0.5 block">{totalNoDisponibles}</span>
          </button>
        </div>
      </div>

      {/* Filtros y Buscador */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por código, nombre o recursos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0099e6]/20 focus:border-[#0099e6]"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
          <select
            value={filterTipo}
            onChange={(e) => setFilterTipo(e.target.value)}
            aria-label="Filtrar por tipología"
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#0099e6]/20 font-bold"
          >
            <option value="TODOS">Todos los Tipos</option>
            <option value="AULA">Solo Aulas Regulares</option>
            <option value="LABORATORIO">Solo Laboratorios</option>
            <option value="COWORKING">Espacio Coworking (B5 - No es aula)</option>
          </select>

          <select
            value={filterSede}
            onChange={(e) => setFilterSede(e.target.value)}
            aria-label="Filtrar por sede"
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#0099e6]/20 font-bold"
          >
            <option value="TODOS">Todas las Sedes</option>
            {sedes && sedes.length > 0 ? (
              sedes.map(s => (
                <option key={s.id_sede} value={s.nombre}>{s.nombre}</option>
              ))
            ) : (
              <option value="UIO_NORTE">UIO_NORTE (Sede Matriz)</option>
            )}
          </select>

          <select
            value={filterBloque}
            onChange={(e) => setFilterBloque(e.target.value)}
            aria-label="Filtrar por bloque"
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#0099e6]/20"
          >
            <option value="TODOS">Todos los Bloques</option>
            {bloques.map(b => (
              <option key={b.id_bloque} value={b.id_bloque}>{b.nombre}</option>
            ))}
          </select>

          <select
            value={filterPiso}
            onChange={(e) => setFilterPiso(e.target.value)}
            aria-label="Filtrar por piso"
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#0099e6]/20"
          >
            <option value="TODOS">Todos los Pisos</option>
            {pisosDisponibles.map(p => (
              <option key={p} value={p}>Piso {p}</option>
            ))}
          </select>

          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            aria-label="Filtrar por estado"
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#0099e6]/20 font-bold"
          >
            <option value="TODOS">Todos los Estados</option>
            <option value="DISPONIBLE">Disponibles</option>
            <option value="NO_DISPONIBLE">🔴 Aulas No Disponibles ({totalNoDisponibles})</option>
            <option value="OCUPADO">Ocupados</option>
            <option value="MANTENIMIENTO">En Mantenimiento</option>
            <option value="INACTIVO">Inactivos (C1, C2, C3, C4)</option>
          </select>

          <button
            type="button"
            onClick={() => setPageSize(pageSize === 'all' ? 10 : 'all')}
            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200 flex items-center gap-1.5 transition cursor-pointer"
            title="Desplegar todas las aulas sin paginación o paginar"
          >
            {pageSize === 'all' ? 'Paginar de 10 en 10' : 'Desplegar todos los campos (65)'}
          </button>

          <span className="text-xs text-slate-500 ml-auto md:ml-0 font-medium whitespace-nowrap">
            {filteredAulas.length} registros
          </span>
        </div>
      </div>
      </div>

      {/* Tabla de Registros */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-slate-50/95 backdrop-blur-xs z-10 shadow-2xs">
              <tr className="text-slate-700 font-semibold border-b border-slate-200">
                <th className="py-3 px-2.5 w-10 text-center">#</th>
                <th className="py-3 px-3">Sede</th>
                <th className="py-3 px-3">Bloque</th>
                <th className="py-3 px-2.5 text-center">Piso</th>
                <th className="py-3 px-3 w-20">Código</th>
                <th className="py-3 px-3">Nombre del Espacio</th>
                <th className="py-3 px-3 text-center">Tipología</th>
                <th className="py-3 px-3 text-center">Capacidad Aula</th>
                <th className="py-3 px-3 text-center">Nº Estudiantes</th>
                <th className="py-3 px-3">Recursos y Equipamiento</th>
                <th className="py-3 px-3 text-center">Estado</th>
                <th className="py-3 px-3 text-center w-24">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAulas.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-10 text-center text-slate-400">
                    <DoorOpen className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="text-sm font-medium">No se encontraron espacios físicos registrados.</p>
                    <p className="text-xs text-slate-400 mt-0.5">Ajusta los filtros o crea una nueva aula.</p>
                  </td>
                </tr>
              ) : (
                paginatedAulas.map((aula, idx) => {
                  const isCoworking = aula.tipo === 'COWORKING' || aula.codigo === 'B5';
                  const isLab = aula.tipo === 'LABORATORIO' && !isCoworking;
                  const isC1toC4 = ['C1', 'C2', 'C3', 'C4'].includes(aula.codigo);
                  const isNoDisponible = aula.estado === 'INACTIVO' || isC1toC4;
                  const isDisponible = aula.estado === 'DISPONIBLE' && !isC1toC4;
                  const isMantenimiento = aula.estado === 'MANTENIMIENTO';
                  const isOcupado = aula.estado === 'OCUPADO';
                  const estudiantes = estudiantesPorAula.get(aula.id_aula_laboratorio) || aula.max_estudiantes || aula.total_estudiantes || 0;
                  const itemIndex = pageSize === 'all' ? idx + 1 : (safeCurrentPage - 1) * numericPageSize + idx + 1;

                  return (
                    <tr key={aula.id_aula_laboratorio} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-2.5 text-center text-slate-400 font-mono">
                        {itemIndex}
                      </td>

                      {/* 1. SEDE */}
                      <td className="py-3 px-3 text-slate-700 font-semibold whitespace-nowrap">
                        <span className="inline-block bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[10px] font-bold border border-slate-200">
                          {aula.sede_nombre || 'UIO_NORTE'}
                        </span>
                      </td>

                      {/* 2. BLOQUE */}
                      <td className="py-3 px-3 text-slate-700 font-medium whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-black text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-[10px]">
                            {(aula.bloque_codigo || '').replace('BLQ-', '') || aula.bloque_nombre?.charAt(aula.bloque_nombre.length - 1)}
                          </span>
                          <span className="text-slate-800 text-xs font-semibold">{aula.bloque_nombre}</span>
                        </div>
                      </td>

                      {/* 3. PISO */}
                      <td className="py-3 px-2.5 text-center whitespace-nowrap">
                        <span className="bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded text-[10px] border border-indigo-100 font-mono">
                          Piso {aula.piso}
                        </span>
                      </td>

                      {/* 4. CÓDIGO */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`font-mono font-bold px-2 py-0.5 rounded border ${
                          isCoworking 
                            ? 'bg-amber-100 text-amber-900 border-amber-300 font-black' 
                            : isC1toC4 || isNoDisponible
                            ? 'bg-rose-100 text-rose-900 border-rose-300 font-black' 
                            : 'bg-slate-100 text-slate-900 border-slate-200'
                        }`}>
                          {aula.codigo}
                        </span>
                      </td>

                      {/* 5. NOMBRE ESPACIO */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          {isCoworking ? (
                            <Users className="w-4 h-4 text-amber-600 shrink-0" />
                          ) : isLab ? (
                            <Laptop className="w-4 h-4 text-purple-600 shrink-0" />
                          ) : (
                            <DoorOpen className="w-4 h-4 text-sky-600 shrink-0" />
                          )}
                          <span className="font-semibold text-slate-800">
                            {aula.nombre}
                            {isCoworking && (
                              <span className="ml-1.5 text-[10px] text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded font-bold">
                                Coworking (No es aula)
                              </span>
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          isCoworking
                            ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold'
                            : isLab 
                            ? 'bg-purple-50 text-purple-700 border-purple-200' 
                            : 'bg-sky-50 text-sky-700 border-sky-200'
                        }`}>
                          {isCoworking ? 'Coworking (No es aula)' : isLab ? 'Laboratorio' : 'Aula Regular'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-900">
                        {isCoworking ? (
                          <span className="text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[10px]">
                            Espacio Coworking
                          </span>
                        ) : isC1toC4 ? (
                          <span className="text-slate-700 font-bold bg-slate-100 px-2.5 py-0.5 rounded border border-slate-300 text-xs font-mono">
                            N/A
                          </span>
                        ) : aula.capacidad === 0 ? (
                          <span className="text-slate-400 font-normal">0 est.</span>
                        ) : (
                          <span>{aula.capacidad} est.</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-indigo-950">
                        {isC1toC4 ? (
                          <span className="text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-xs font-mono">
                            N/A
                          </span>
                        ) : estudiantes > 0 ? (
                          <span className="inline-flex items-center gap-1 text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                            <Users className="w-3 h-3" />
                            <span>{estudiantes} est.</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal">0 est.</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-600 text-xs">
                        {aula.recursos || <span className="text-slate-300 italic">Pizarra y mobiliario estándar</span>}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {(() => {
                          if (isC1toC4) {
                            return (
                              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-rose-100 text-rose-800 border-rose-300 font-mono font-black">
                                N/A
                              </span>
                            );
                          }
                          if (aula.estado === 'DISPONIBLE') {
                            return (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-emerald-50 text-emerald-700 border-emerald-300">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                DISPONIBLE
                              </span>
                            );
                          }
                          if (aula.estado === 'OCUPADO') {
                            return (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-blue-50 text-blue-700 border-blue-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                OCUPADO
                              </span>
                            );
                          }
                          if (aula.estado === 'MANTENIMIENTO') {
                            return (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-amber-50 text-amber-700 border-amber-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                MANTENIMIENTO
                              </span>
                            );
                          }
                          return (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-rose-100 text-rose-800 border-rose-300 font-mono font-black">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                              NO DISPONIBLE
                            </span>
                          );
                        })()}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(aula)}
                            className="p-1.5 text-slate-500 hover:text-[#0099e6] hover:bg-blue-50 rounded-lg transition cursor-pointer"
                            title="Editar espacio"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {/* Quick estado switch */}
                          <button
                            type="button"
                            onClick={() => handleToggleEstado(aula, isDisponible ? 'MANTENIMIENTO' : 'DISPONIBLE')}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                            title={isDisponible ? 'Marcar en mantenimiento' : 'Marcar disponible'}
                          >
                            <Wrench className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeleteConfirmAula(aula)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Eliminar espacio"
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

        {/* Paginación */}
        {totalFilteredCount > 0 && (
          <div className="p-3 border-t border-slate-100 bg-slate-50/50">
            <PaginationControls
              currentPage={safeCurrentPage}
              totalItems={totalFilteredCount}
              pageSize={pageSize}
              pageSizeOptions={[5, 10, 15, 20, 25, 'all']}
              itemName="aulas"
              onPageChange={page => setCurrentPage(page)}
              onPageSizeChange={size => {
                setPageSize(size);
                setCurrentPage(1);
              }}
            />
          </div>
        )}
      </div>

      {/* Modal Crear / Editar Aula */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-sky-50 border border-sky-100 flex items-center justify-center text-[#0099e6]">
                  <DoorOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    {editingAula ? 'Editar Aula / Laboratorio' : 'Nueva Aula / Laboratorio'}
                  </h3>
                  <p className="text-[11px] text-slate-500">Mantenimiento de infraestructura física por bloque</p>
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

            <form onSubmit={handleSave} className="p-5 space-y-3.5">
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Bloque <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.id_bloque}
                    onChange={(e) => setFormData({ ...formData, id_bloque: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0099e6]/20"
                  >
                    {bloques.map(b => (
                      <option key={b.id_bloque} value={b.id_bloque}>{b.nombre} ({b.codigo})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tipología de Espacio <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.tipo}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0099e6]/20 font-medium"
                  >
                    <option value="AULA">Aula Teórica Regular</option>
                    <option value="LABORATORIO">Laboratorio / Taller Especializado</option>
                    <option value="COWORKING">Espacio Coworking (No es aula de clases)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Código <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
                    placeholder="Ej. A11, LAB-01"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0099e6]/20 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Piso / Nivel <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={maxPisosBloqueSeleccionado}
                    required
                    value={formData.piso}
                    onChange={(e) => setFormData({ ...formData, piso: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0099e6]/20 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Capacidad (Puestos) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="200"
                    required
                    value={formData.capacidad}
                    onChange={(e) => setFormData({ ...formData, capacidad: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0099e6]/20 font-mono font-bold text-[#0088cc]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre Oficial del Espacio <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Ej. AULA A11, LABORATORIO DE MULTIMEDIA"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0099e6]/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Estado Operativo <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.estado}
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value as any })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0099e6]/20"
                >
                  <option value="DISPONIBLE">DISPONIBLE (Listo para asignar)</option>
                  <option value="OCUPADO">OCUPADO (Con clases activas)</option>
                  <option value="MANTENIMIENTO">MANTENIMIENTO (Temporalmente no operable)</option>
                  <option value="INACTIVO">INACTIVO (Fuera de servicio)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Recursos, Equipamiento y Tecnologías
                </label>
                <textarea
                  rows={2}
                  value={formData.recursos}
                  onChange={(e) => setFormData({ ...formData, recursos: e.target.value })}
                  placeholder="Ej. 30 Computadoras Core i7, Proyector HDMI, Pizarra táctil, Climatización."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0099e6]/20 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>

                {!editingAula && (
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={(e) => handleSave(e, true)}
                    className="px-3.5 py-2 text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    title="Guarda esta aula e incrementa el código para ingresar la siguiente sin cerrar la ventana"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-sky-600" />
                    <span>Guardar y Agregar Otra</span>
                  </button>
                )}

                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 text-xs font-bold text-white bg-[#0099e6] hover:bg-[#0088cc] rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>{editingAula ? 'Actualizar Espacio' : 'Crear Aula / Laboratorio'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmar Eliminación */}
      {deleteConfirmAula && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-200 p-5 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">¿Eliminar Espacio Físico?</h3>
                <p className="text-xs text-slate-500">Esta acción no se puede deshacer.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
              ¿Estás seguro de que deseas eliminar <strong className="text-slate-900 font-mono">{deleteConfirmAula.codigo} - {deleteConfirmAula.nombre}</strong> ({deleteConfirmAula.bloque_nombre})?
            </p>

            {((estudiantesPorAula.get(deleteConfirmAula.id_aula_laboratorio) || 0) > 0 || (deleteConfirmAula.clases_activas_count || 0) > 0) && (
              <p className="text-[11px] text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                ⚠️ Este espacio tiene asignaciones académicas vigentes. Considere cambiar su estado a MANTENIMIENTO o INACTIVO.
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmAula(null)}
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

      {/* Modal Ingreso Múltiple de Aulas */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95">
            {/* Header del Modal */}
            <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-xs">
                  <ListPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">
                    Ingreso Múltiple de Aulas y Laboratorios
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    Genera secuencias completas por bloque o añade múltiples espacios físicos a la vez
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !bulkSaving && setIsBulkModalOpen(false)}
                disabled={bulkSaving}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Pestañas del Modal */}
            <div className="flex items-center gap-1.5 px-5 pt-3 border-b border-slate-200 bg-slate-50 shrink-0">
              <button
                type="button"
                onClick={() => setBulkActiveTab('generator')}
                className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition flex items-center gap-2 cursor-pointer border-b-2 ${
                  bulkActiveTab === 'generator'
                    ? 'bg-white text-emerald-700 border-emerald-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-100'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generador por Serie y Piso</span>
              </button>
              <button
                type="button"
                onClick={() => setBulkActiveTab('table')}
                className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition flex items-center gap-2 cursor-pointer border-b-2 ${
                  bulkActiveTab === 'table'
                    ? 'bg-white text-emerald-700 border-emerald-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-100'
                }`}
              >
                <DoorOpen className="w-3.5 h-3.5" />
                <span>Tabla de Filas ({bulkRows.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setBulkActiveTab('paste')}
                className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition flex items-center gap-2 cursor-pointer border-b-2 ${
                  bulkActiveTab === 'paste'
                    ? 'bg-white text-emerald-700 border-emerald-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-100'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Pegar Lista de Texto</span>
              </button>
            </div>

            {/* Contenido scrolleable */}
            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              {bulkError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{bulkError}</span>
                </div>
              )}

              {/* TAB 1: GENERADOR */}
              {bulkActiveTab === 'generator' && (
                <div className="space-y-4">
                  <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-xs text-emerald-900 flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Generador automático por piso y serie</p>
                      <p className="text-emerald-700 mt-0.5">
                        Define el bloque, piso y rango numérico (ej. 1 a 6). El sistema generará instantáneamente la serie de aulas con sus puestos y recursos estandarizados.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Bloque Destino</label>
                      <select
                        value={bulkGeneratorConfig.id_bloque}
                        onChange={(e) => {
                          const newBlqId = Number(e.target.value);
                          const b = bloqueMap.get(newBlqId);
                          const blqLetter = b ? b.codigo.replace('BLQ-', '').trim() : 'A';
                          setBulkGeneratorConfig(prev => ({
                            ...prev,
                            id_bloque: newBlqId,
                            prefijo: `${blqLetter}${prev.piso}0`
                          }));
                        }}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                      >
                        {bloques.map(b => (
                          <option key={b.id_bloque} value={b.id_bloque}>
                            {b.codigo} - {b.nombre} ({b.numero_pisos} pisos)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Piso o Nivel</label>
                      <select
                        value={bulkGeneratorConfig.piso}
                        onChange={(e) => {
                          const newPiso = Number(e.target.value);
                          const b = bloqueMap.get(bulkGeneratorConfig.id_bloque);
                          const blqLetter = b ? b.codigo.replace('BLQ-', '').trim() : 'A';
                          setBulkGeneratorConfig(prev => ({
                            ...prev,
                            piso: newPiso,
                            prefijo: `${blqLetter}${newPiso}0`
                          }));
                        }}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                      >
                        {Array.from({ length: (bloqueMap.get(bulkGeneratorConfig.id_bloque)?.numero_pisos || 3) }).map((_, idx) => (
                          <option key={idx + 1} value={idx + 1}>Piso {idx + 1}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Tipo de Espacio</label>
                      <select
                        value={bulkGeneratorConfig.tipo}
                        onChange={(e) => setBulkGeneratorConfig(prev => ({ ...prev, tipo: e.target.value as any }))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                      >
                        <option value="AULA">AULA (Clase Teórica / Cátedra)</option>
                        <option value="LABORATORIO">LABORATORIO (Computación / Taller)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Prefijo del Código
                      </label>
                      <input
                        type="text"
                        value={bulkGeneratorConfig.prefijo}
                        onChange={(e) => setBulkGeneratorConfig(prev => ({ ...prev, prefijo: e.target.value }))}
                        placeholder="Ej. A10, B20, LAB-"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono uppercase"
                      />
                      <span className="text-[10px] text-slate-400 mt-0.5 block">Ejemplo de resultado: {bulkGeneratorConfig.prefijo || 'A10'}1, {bulkGeneratorConfig.prefijo || 'A10'}2</span>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Rango Numérico</label>
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <input
                            type="number"
                            min={1}
                            max={99}
                            value={bulkGeneratorConfig.desdeNumero}
                            onChange={(e) => setBulkGeneratorConfig(prev => ({ ...prev, desdeNumero: Math.max(1, Number(e.target.value)) }))}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-center font-bold"
                          />
                          <span className="text-[10px] text-slate-400 text-center block">Desde</span>
                        </div>
                        <span className="text-slate-400 font-bold">a</span>
                        <div className="flex-1">
                          <input
                            type="number"
                            min={1}
                            max={99}
                            value={bulkGeneratorConfig.hastaNumero}
                            onChange={(e) => setBulkGeneratorConfig(prev => ({ ...prev, hastaNumero: Math.max(1, Number(e.target.value)) }))}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-center font-bold"
                          />
                          <span className="text-[10px] text-slate-400 text-center block">Hasta</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Capacidad Estándar (Puestos)</label>
                      <input
                        type="number"
                        min={1}
                        max={300}
                        value={bulkGeneratorConfig.capacidad}
                        onChange={(e) => setBulkGeneratorConfig(prev => ({ ...prev, capacidad: Math.max(1, Number(e.target.value)) }))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                      />
                      <span className="text-[10px] text-slate-400 mt-0.5 block">Capacidad de aforo por espacio</span>
                    </div>

                    <div className="sm:col-span-2 md:col-span-3">
                      <label className="block font-semibold text-slate-700 mb-1">Recursos y Equipamiento Estándar</label>
                      <input
                        type="text"
                        value={bulkGeneratorConfig.recursos}
                        onChange={(e) => setBulkGeneratorConfig(prev => ({ ...prev, recursos: e.target.value }))}
                        placeholder="Ej. Proyector HDMI, Pizarra blanca, Wi-Fi 6"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                      />
                    </div>
                  </div>

                  {/* Previsualización */}
                  <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="font-semibold text-slate-800">Previsualización:</span>{' '}
                      <span className="text-slate-600">
                        Se generarán {Math.max(0, bulkGeneratorConfig.hastaNumero - bulkGeneratorConfig.desdeNumero + 1)} espacios:
                      </span>{' '}
                      <strong className="text-emerald-700 font-mono">
                        {bulkGeneratorConfig.prefijo || 'A10'}{bulkGeneratorConfig.desdeNumero} ... {bulkGeneratorConfig.prefijo || 'A10'}{bulkGeneratorConfig.hastaNumero}
                      </strong>
                    </div>

                    <button
                      type="button"
                      onClick={handleGenerateSeries}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer self-end sm:self-auto shrink-0"
                    >
                      <Sparkles className="w-4 h-4 text-emerald-200" />
                      <span>Generar y Previsualizar en Tabla</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: TABLA DE FILAS */}
              {bulkActiveTab === 'table' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                    <span className="text-slate-600 font-medium">
                      Listado de espacios a registrar ({bulkRows.length} aulas/laboratorios):
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleAddEmptyBulkRow}
                        className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Agregar Fila</span>
                      </button>
                      {bulkRows.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setBulkRows([])}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg font-medium transition cursor-pointer"
                        >
                          Limpiar Todo
                        </button>
                      )}
                    </div>
                  </div>

                  {bulkRows.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl space-y-2">
                      <DoorOpen className="w-8 h-8 text-slate-400 mx-auto" />
                      <p className="text-xs font-semibold text-slate-700">No hay aulas en la lista para registrar</p>
                      <p className="text-[11px] text-slate-500">
                        Usa la pestaña "Generador por Serie y Piso" para crearlas automáticamente o agrega filas manualmente.
                      </p>
                      <button
                        type="button"
                        onClick={handleAddEmptyBulkRow}
                        className="mt-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Agregar Primera Aula</span>
                      </button>
                    </div>
                  ) : (
                    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                      <div className="overflow-x-auto max-h-[380px]">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-slate-100 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider sticky top-0 z-10">
                            <tr>
                              <th className="py-2.5 px-3 w-10 text-center">#</th>
                              <th className="py-2.5 px-3 min-w-[100px]">Código *</th>
                              <th className="py-2.5 px-3 min-w-[140px]">Nombre *</th>
                              <th className="py-2.5 px-3 min-w-[140px]">Bloque *</th>
                              <th className="py-2.5 px-2 w-20 text-center">Piso</th>
                              <th className="py-2.5 px-3 min-w-[120px]">Tipo</th>
                              <th className="py-2.5 px-2 w-24 text-center">Capacidad</th>
                              <th className="py-2.5 px-3 min-w-[160px]">Recursos</th>
                              <th className="py-2.5 px-2 w-10 text-center"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {bulkRows.map((row, idx) => (
                              <tr key={row.id} className="hover:bg-slate-50/80 transition">
                                <td className="py-2 px-3 text-center text-slate-400 font-mono text-[11px]">
                                  {idx + 1}
                                </td>
                                <td className="py-2 px-3">
                                  <input
                                    type="text"
                                    value={row.codigo}
                                    onChange={(e) => handleUpdateBulkRow(row.id, 'codigo', e.target.value.toUpperCase())}
                                    className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-900 uppercase focus:bg-white"
                                  />
                                </td>
                                <td className="py-2 px-3">
                                  <input
                                    type="text"
                                    value={row.nombre}
                                    onChange={(e) => handleUpdateBulkRow(row.id, 'nombre', e.target.value)}
                                    className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white"
                                  />
                                </td>
                                <td className="py-2 px-3">
                                  <select
                                    value={row.id_bloque}
                                    onChange={(e) => handleUpdateBulkRow(row.id, 'id_bloque', Number(e.target.value))}
                                    className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white"
                                  >
                                    {bloques.map(b => (
                                      <option key={b.id_bloque} value={b.id_bloque}>{b.codigo} - {b.nombre}</option>
                                    ))}
                                  </select>
                                </td>
                                <td className="py-2 px-2 text-center">
                                  <input
                                    type="number"
                                    min={1}
                                    max={10}
                                    value={row.piso}
                                    onChange={(e) => handleUpdateBulkRow(row.id, 'piso', Math.max(1, Number(e.target.value)))}
                                    className="w-14 px-1.5 py-1 text-center bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white"
                                  />
                                </td>
                                <td className="py-2 px-3">
                                  <select
                                    value={row.tipo}
                                    onChange={(e) => handleUpdateBulkRow(row.id, 'tipo', e.target.value as any)}
                                    className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:bg-white"
                                  >
                                    <option value="AULA">AULA</option>
                                    <option value="LABORATORIO">LABORATORIO</option>
                                  </select>
                                </td>
                                <td className="py-2 px-2 text-center">
                                  <input
                                    type="number"
                                    min={1}
                                    max={300}
                                    value={row.capacidad}
                                    onChange={(e) => handleUpdateBulkRow(row.id, 'capacidad', Math.max(1, Number(e.target.value)))}
                                    className="w-16 px-1.5 py-1 text-center font-bold bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white"
                                  />
                                </td>
                                <td className="py-2 px-3">
                                  <input
                                    type="text"
                                    value={row.recursos}
                                    onChange={(e) => handleUpdateBulkRow(row.id, 'recursos', e.target.value)}
                                    className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-[11px] focus:bg-white"
                                    placeholder="Equipamiento"
                                  />
                                </td>
                                <td className="py-2 px-2 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteBulkRow(row.id)}
                                    className="text-slate-400 hover:text-rose-600 p-1 rounded-md transition cursor-pointer"
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
                </div>
              )}

              {/* TAB 3: PEGAR LISTA */}
              {bulkActiveTab === 'paste' && (
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 space-y-1">
                    <p className="font-semibold">Pega una lista de aulas (un aula por línea):</p>
                    <p className="text-blue-700 text-[11px]">
                      Formato recomendado: <code className="bg-blue-100 px-1 py-0.5 rounded font-mono">CÓDIGO, NOMBRE, TIPO, CAPACIDAD, PISO, RECURSOS</code>
                    </p>
                    <p className="text-blue-600 text-[11px]">
                      Ejemplo:
                    </p>
                    <pre className="bg-white/80 p-2 rounded-lg text-[11px] font-mono text-slate-700 border border-blue-200/60 overflow-x-auto">
{`A101, AULA 101, AULA, 35, 1, Proyector HDMI Wi-Fi
A102, AULA 102, AULA, 35, 1, Proyector HDMI Wi-Fi
LAB-REDES, LABORATORIO DE REDES, LABORATORIO, 28, 2, 28 PCs i7`}
                    </pre>
                  </div>

                  <textarea
                    rows={6}
                    value={bulkPasteText}
                    onChange={(e) => setBulkPasteText(e.target.value)}
                    placeholder="Pega aquí el listado de aulas..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white resize-y"
                  />

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleParsePasteText}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                    >
                      <ArrowRight className="w-4 h-4" />
                      <span>Convertir en Filas de Tabla</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer del Modal */}
            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
              <div className="text-xs text-slate-500">
                {bulkProgress ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Registrando espacio {bulkProgress.current} de {bulkProgress.total}...</span>
                    </div>
                    <div className="w-48 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-emerald-500 h-full transition-all duration-200" 
                        style={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <span>
                    Total listo para registrar: <strong className="text-slate-900 font-bold">{bulkRows.length}</strong> espacios
                  </span>
                )}
              </div>

              <div className="flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsBulkModalOpen(false)}
                  disabled={bulkSaving}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition cursor-pointer disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={handleSaveAllBulk}
                  disabled={bulkSaving || bulkRows.length === 0}
                  className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 rounded-xl transition flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {bulkSaving ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>Registrar todas las aulas ({bulkRows.length})</span>
                </button>
              </div>
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
        planificaciones={planificaciones}
      />
    </div>
  );
};
