import React, { useState, useMemo } from 'react';
import { FeriadoNacional, PeriodoAcademico } from '../../types.ts';
import { ApiClient } from '../../controllers/apiClient.ts';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  RefreshCw, 
  Flag, 
  CheckCircle2, 
  X, 
  AlertTriangle,
  Download,
  CalendarRange
} from 'lucide-react';

interface FeriadosCrudViewProps {
  feriados: FeriadoNacional[];
  periodos: PeriodoAcademico[];
  onRefresh: () => void;
}

export const FeriadosCrudView: React.FC<FeriadosCrudViewProps> = ({
  feriados,
  periodos,
  onRefresh
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<string>('TODOS');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFeriado, setEditingFeriado] = useState<FeriadoNacional | null>(null);
  const [deleteConfirmFeriado, setDeleteConfirmFeriado] = useState<FeriadoNacional | null>(null);
  
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const defaultPeriodoId = periodos.length > 0 ? periodos[0].id_periodo : 1;

  const [formData, setFormData] = useState({
    id_periodo: defaultPeriodoId,
    codigo: '',
    nombre: '',
    desde: '',
    hasta: '',
    descripcion: '',
    estado: 'ACTIVO'
  });

  const periodoMap = useMemo(() => {
    const map = new Map<number, string>();
    periodos.forEach(p => map.set(p.id_periodo, p.nombre));
    return map;
  }, [periodos]);

  const filteredFeriados = useMemo(() => {
    return feriados.filter(f => {
      const matchSearch = 
        f.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (f.descripcion && f.descripcion.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchEstado = 
        filterEstado === 'TODOS' ? true : f.estado === filterEstado;

      return matchSearch && matchEstado;
    });
  }, [feriados, searchTerm, filterEstado]);

  const calculateDays = (desde: string, hasta: string) => {
    try {
      const d1 = new Date(desde);
      const d2 = new Date(hasta);
      const diff = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      return diff > 0 ? diff : 1;
    } catch {
      return 1;
    }
  };

  const handleOpenCreate = () => {
    setEditingFeriado(null);
    setFormData({
      id_periodo: defaultPeriodoId,
      codigo: `FER-2026-${String(feriados.length + 1).padStart(2, '0')}`,
      nombre: '',
      desde: '2026-05-01',
      hasta: '2026-05-01',
      descripcion: '',
      estado: 'ACTIVO'
    });
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (f: FeriadoNacional) => {
    setEditingFeriado(f);
    setFormData({
      id_periodo: f.id_periodo || defaultPeriodoId,
      codigo: f.codigo,
      nombre: f.nombre,
      desde: f.desde,
      hasta: f.hasta,
      descripcion: f.descripcion || '',
      estado: f.estado || 'ACTIVO'
    });
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.codigo.trim() || !formData.nombre.trim() || !formData.desde || !formData.hasta) {
      setErrorMessage('Por favor completa código, festividad, y fechas.');
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage(null);

      if (editingFeriado) {
        await ApiClient.updateCatalogItem('feriado', editingFeriado.id_feriado, formData);
        setSuccessMessage(`Feriado "${formData.nombre}" modificado correctamente.`);
      } else {
        await ApiClient.createCatalogItem('feriado', formData);
        setSuccessMessage(`Feriado "${formData.nombre}" registrado exitosamente.`);
      }

      setIsModalOpen(false);
      onRefresh();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al guardar feriado');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleEstado = async (f: FeriadoNacional) => {
    try {
      const nuevo = f.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
      await ApiClient.toggleCatalogItemEstado('feriado', f.id_feriado, nuevo);
      onRefresh();
      setSuccessMessage(`Feriado "${f.nombre}" marcado como ${nuevo}.`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Error al cambiar estado');
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmFeriado) return;
    try {
      setIsSaving(true);
      await ApiClient.deleteCatalogItem('feriado', deleteConfirmFeriado.id_feriado);
      setSuccessMessage(`Feriado "${deleteConfirmFeriado.nombre}" eliminado exitosamente.`);
      setDeleteConfirmFeriado(null);
      onRefresh();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Error al eliminar feriado');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Codigo', 'Festividad', 'Desde', 'Hasta', 'Dias', 'Estado'];
    const rows = filteredFeriados.map(f => [
      `"${f.codigo}"`,
      `"${f.nombre}"`,
      `"${f.desde}"`,
      `"${f.hasta}"`,
      calculateDays(f.desde, f.hasta),
      `"${f.estado}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `catalogo_feriados_2026_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {successMessage && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-xl">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Control Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex-1 flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar feriado por nombre o fecha..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#0099e6] focus:bg-white transition"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 font-medium text-slate-700 focus:outline-hidden"
          >
            <option value="TODOS">Todos los estados</option>
            <option value="ACTIVO">Activos</option>
            <option value="INACTIVO">Inactivos</option>
          </select>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">Exportar</span>
          </button>

          <button
            type="button"
            onClick={onRefresh}
            className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
            title="Recargar catálogo"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="flex items-center gap-2 bg-[#0099e6] hover:bg-[#008bd1] text-white px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Feriado</span>
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-medium text-slate-600">
          <span className="flex items-center gap-2">
            <Flag className="w-4 h-4 text-amber-500" />
            <span>Calendario Oficial Ecuador 2026: <strong>{filteredFeriados.length}</strong> feriados registrados</span>
          </span>
          <span className="text-[11px] text-slate-400">Suspensión obligatoria de actividades académicas</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-3.5">Código</th>
                <th className="py-3 px-3.5">Festividad / Motivo</th>
                <th className="py-3 px-3.5">Fecha Inicio</th>
                <th className="py-3 px-3.5">Fecha Fin</th>
                <th className="py-3 px-3.5 text-center">Duración</th>
                <th className="py-3 px-3.5 text-center">Estado</th>
                <th className="py-3 px-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredFeriados.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No se encontraron feriados con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredFeriados.map(f => {
                  const isActivo = f.estado === 'ACTIVO';
                  const days = calculateDays(f.desde, f.hasta);

                  return (
                    <tr key={f.id_feriado} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-3.5 font-mono font-bold text-[#0099e6] whitespace-nowrap">
                        {f.codigo}
                      </td>
                      <td className="py-3 px-3.5">
                        <div className="font-bold text-slate-900 leading-tight flex items-center gap-2">
                          <Flag className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span>{f.nombre}</span>
                        </div>
                        {f.descripcion && (
                          <div className="text-[11px] text-slate-500 mt-0.5 pl-5.5">
                            {f.descripcion}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap font-mono text-slate-700">
                        {f.desde}
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap font-mono text-slate-700">
                        {f.hasta}
                      </td>
                      <td className="py-3 px-3.5 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-800 px-2.5 py-0.5 rounded-full text-xs font-bold">
                          <CalendarRange className="w-3 h-3 text-amber-600" />
                          <span>{days} {days === 1 ? 'día' : 'días'}</span>
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleEstado(f)}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold cursor-pointer transition ${
                            isActivo 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100' 
                              : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                          }`}
                        >
                          <span>{f.estado}</span>
                        </button>
                      </td>
                      <td className="py-3 px-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(f)}
                            className="p-1.5 text-slate-600 hover:text-[#0099e6] hover:bg-blue-50 rounded-md transition"
                            title="Editar feriado"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmFeriado(f)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition"
                            title="Eliminar feriado"
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

      {/* Modal Crear / Editar Feriado */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-gradient-to-r from-[#0099e6] to-[#008bd1] text-white p-4.5 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <Flag className="w-5 h-5 text-amber-300" />
                  <span>{editingFeriado ? 'Editar Feriado Nacional' : 'Nuevo Feriado Nacional'}</span>
                </h3>
                <p className="text-xs text-blue-100 mt-0.5">
                  Día no laborable del calendario académico ecuatoriano
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
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

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Código de Identificación *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. FER-2026-05"
                  value={formData.codigo}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0099e6] focus:bg-white focus:outline-hidden font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nombre de la Festividad / Feriado *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Día Internacional del Trabajo"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0099e6] focus:bg-white focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Fecha Desde *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.desde}
                    onChange={(e) => setFormData({ ...formData, desde: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0099e6] focus:bg-white focus:outline-hidden font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Fecha Hasta *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.hasta}
                    onChange={(e) => setFormData({ ...formData, hasta: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0099e6] focus:bg-white focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Descripción o Decretos
                </label>
                <textarea
                  rows={2}
                  placeholder="Ej. Feriado no recuperable establecido por la Ley de Feriados del Ecuador"
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
                      name="estado_fer"
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
                      name="estado_fer"
                      value="INACTIVO"
                      checked={formData.estado === 'INACTIVO'}
                      onChange={() => setFormData({ ...formData, estado: 'INACTIVO' })}
                      className="text-[#0099e6] focus:ring-[#0099e6]"
                    />
                    <span>INACTIVO</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 text-xs sm:text-sm font-bold text-white bg-[#0099e6] hover:bg-[#008bd1] rounded-lg shadow-xs transition disabled:opacity-50"
                >
                  {isSaving ? 'Guardando...' : editingFeriado ? 'Actualizar Feriado' : 'Guardar Feriado'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmFeriado && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-5 border border-slate-100">
            <div className="w-11 h-11 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">¿Eliminar Feriado Nacional?</h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Estás a punto de eliminar <strong>{deleteConfirmFeriado.nombre}</strong> ({deleteConfirmFeriado.desde}).
            </p>
            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteConfirmFeriado(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSaving}
                className="px-3.5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition disabled:opacity-50"
              >
                {isSaving ? 'Eliminando...' : 'Sí, Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
