import React, { useState, useMemo } from 'react';
import { PeriodoAcademico } from '../../types.ts';
import { ApiClient } from '../../controllers/apiClient.ts';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  RefreshCw, 
  Calendar, 
  CheckCircle2, 
  X, 
  AlertTriangle,
  Download,
  CalendarCheck2,
  FileSpreadsheet
} from 'lucide-react';
import { ExportController } from '../../controllers/exportController.ts';

interface PeriodosCrudViewProps {
  periodos: PeriodoAcademico[];
  onRefresh: () => void;
}

export const PeriodosCrudView: React.FC<PeriodosCrudViewProps> = ({
  periodos,
  onRefresh
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<string>('TODOS');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPeriodo, setEditingPeriodo] = useState<PeriodoAcademico | null>(null);
  const [deleteConfirmPeriodo, setDeleteConfirmPeriodo] = useState<PeriodoAcademico | null>(null);
  
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    fecha_inicio: '',
    fecha_fin: '',
    descripcion: '',
    estado: 'ACTIVO'
  });

  const filteredPeriodos = useMemo(() => {
    return periodos.filter(p => {
      const matchSearch = 
        p.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase());

      const matchEstado = 
        filterEstado === 'TODOS' ? true : p.estado === filterEstado;

      return matchSearch && matchEstado;
    });
  }, [periodos, searchTerm, filterEstado]);

  const handleOpenCreate = () => {
    setEditingPeriodo(null);
    setFormData({
      codigo: '',
      nombre: '',
      fecha_inicio: '2026-03-01',
      fecha_fin: '2026-08-15',
      descripcion: '',
      estado: 'ACTIVO'
    });
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: PeriodoAcademico) => {
    setEditingPeriodo(p);
    setFormData({
      codigo: p.codigo,
      nombre: p.nombre,
      fecha_inicio: p.fecha_inicio,
      fecha_fin: p.fecha_fin,
      descripcion: p.descripcion || '',
      estado: p.estado || 'ACTIVO'
    });
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.codigo.trim() || !formData.nombre.trim() || !formData.fecha_inicio || !formData.fecha_fin) {
      setErrorMessage('Por favor completa código, nombre, fecha de inicio y fin.');
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage(null);

      if (editingPeriodo) {
        await ApiClient.updateCatalogItem('periodo', editingPeriodo.id_periodo, formData);
        setSuccessMessage(`Periodo "${formData.nombre}" actualizado correctamente.`);
      } else {
        await ApiClient.createCatalogItem('periodo', formData);
        setSuccessMessage(`Periodo "${formData.nombre}" registrado con éxito.`);
      }

      setIsModalOpen(false);
      onRefresh();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al guardar el periodo');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleEstado = async (p: PeriodoAcademico) => {
    try {
      const nuevo = p.estado === 'ACTIVO' ? 'FINALIZADO' : 'ACTIVO';
      await ApiClient.toggleCatalogItemEstado('periodo', p.id_periodo, nuevo);
      onRefresh();
      setSuccessMessage(`Estado de ${p.nombre} cambiado a ${nuevo}.`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Error al cambiar estado');
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmPeriodo) return;
    try {
      setIsSaving(true);
      await ApiClient.deleteCatalogItem('periodo', deleteConfirmPeriodo.id_periodo);
      setSuccessMessage(`Periodo "${deleteConfirmPeriodo.nombre}" eliminado exitosamente.`);
      setDeleteConfirmPeriodo(null);
      onRefresh();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Error al eliminar periodo');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Codigo', 'Nombre', 'Fecha Inicio', 'Fecha Fin', 'Estado'];
    const rows = filteredPeriodos.map(p => [
      `"${p.codigo}"`,
      `"${p.nombre}"`,
      `"${p.fecha_inicio}"`,
      `"${p.fecha_fin}"`,
      `"${p.estado}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `catalogo_periodos_${new Date().toISOString().split('T')[0]}.csv`);
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
              placeholder="Buscar por código o nombre de periodo..."
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
            <option value="PLANIFICADO">Planificados</option>
            <option value="FINALIZADO">Finalizados</option>
          </select>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => ExportController.exportPeriodosXLSX(filteredPeriodos)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition shadow-xs cursor-pointer"
            title="Exportar periodos lectivos a Microsoft Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Exportar Excel</span>
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
            <span>Nuevo Periodo</span>
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-medium text-slate-600">
          <span>Ciclos Académicos Registrados: <strong>{filteredPeriodos.length}</strong> de <strong>{periodos.length}</strong></span>
          <span className="text-[11px] text-slate-400">Periodo activo vigente en producción</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-3.5">Código</th>
                <th className="py-3 px-3.5">Nombre del Periodo</th>
                <th className="py-3 px-3.5">Fecha Inicio</th>
                <th className="py-3 px-3.5">Fecha Fin</th>
                <th className="py-3 px-3.5 text-center">Estado</th>
                <th className="py-3 px-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPeriodos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No se encontraron periodos académicos con el criterio indicado.
                  </td>
                </tr>
              ) : (
                filteredPeriodos.map(p => {
                  const isActivo = p.estado === 'ACTIVO';

                  return (
                    <tr key={p.id_periodo} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-3.5 font-mono font-bold text-[#0099e6] whitespace-nowrap">
                        {p.codigo}
                      </td>
                      <td className="py-3 px-3.5">
                        <div className="font-bold text-slate-900 leading-tight">
                          {p.nombre}
                        </div>
                        {p.descripcion && (
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {p.descripcion}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap font-mono text-slate-700">
                        {p.fecha_inicio}
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap font-mono text-slate-700">
                        {p.fecha_fin}
                      </td>
                      <td className="py-3 px-3.5 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleEstado(p)}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold cursor-pointer transition ${
                            isActivo 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100' 
                              : p.estado === 'PLANIFICADO'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          <CalendarCheck2 className="w-3 h-3" />
                          <span>{p.estado}</span>
                        </button>
                      </td>
                      <td className="py-3 px-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(p)}
                            className="p-1.5 text-slate-600 hover:text-[#0099e6] hover:bg-blue-50 rounded-md transition"
                            title="Editar periodo"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmPeriodo(p)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition"
                            title="Eliminar periodo"
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

      {/* Modal Crear / Editar Periodo */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-gradient-to-r from-[#0099e6] to-[#008bd1] text-white p-4.5 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  <span>{editingPeriodo ? 'Editar Periodo' : 'Nuevo Periodo'}</span>
                </h3>
                <p className="text-xs text-blue-100 mt-0.5">
                  Ciclo académico oficial para planificación y horarios
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
                  Código de Periodo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. 2026-2"
                  value={formData.codigo}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0099e6] focus:bg-white focus:outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nombre Oficial del Periodo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. PERIODO ACADEMICO 2026-2"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0099e6] focus:bg-white focus:outline-hidden uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Fecha de Inicio *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.fecha_inicio}
                    onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0099e6] focus:bg-white focus:outline-hidden font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Fecha de Fin *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.fecha_fin}
                    onChange={(e) => setFormData({ ...formData, fecha_fin: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0099e6] focus:bg-white focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Estado del Periodo
                </label>
                <select
                  value={formData.estado}
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0099e6] focus:bg-white focus:outline-hidden"
                >
                  <option value="ACTIVO">ACTIVO (En curso)</option>
                  <option value="PLANIFICADO">PLANIFICADO (Próximo)</option>
                  <option value="FINALIZADO">FINALIZADO (Histórico)</option>
                  <option value="INACTIVO">INACTIVO</option>
                </select>
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
                  {isSaving ? 'Guardando...' : editingPeriodo ? 'Actualizar Periodo' : 'Guardar Periodo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmPeriodo && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-5 border border-slate-100">
            <div className="w-11 h-11 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">¿Eliminar Periodo Académico?</h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Estás a punto de eliminar <strong>{deleteConfirmPeriodo.nombre}</strong> ({deleteConfirmPeriodo.codigo}).
            </p>
            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteConfirmPeriodo(null)}
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
