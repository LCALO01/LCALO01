import React, { useState, useMemo } from 'react';
import { Escuela, Sede } from '../../types.ts';
import { ApiClient } from '../../controllers/apiClient.ts';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  RefreshCw, 
  School, 
  CheckCircle2, 
  X, 
  AlertTriangle,
  Download,
  Building2,
  FileSpreadsheet
} from 'lucide-react';
import { ExportController } from '../../controllers/exportController.ts';

interface EscuelasCrudViewProps {
  escuelas: Escuela[];
  sedes: Sede[];
  onRefresh: () => void;
}

export const EscuelasCrudView: React.FC<EscuelasCrudViewProps> = ({
  escuelas,
  sedes,
  onRefresh
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<string>('TODOS');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEscuela, setEditingEscuela] = useState<Escuela | null>(null);
  const [deleteConfirmEscuela, setDeleteConfirmEscuela] = useState<Escuela | null>(null);
  
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const defaultSedeId = sedes.length > 0 ? sedes[0].id_sede : 1;

  const [formData, setFormData] = useState({
    id_sede: defaultSedeId,
    codigo: '',
    nombre: '',
    descripcion: '',
    estado: 'ACTIVA'
  });

  const sedeMap = useMemo(() => {
    const map = new Map<number, string>();
    sedes.forEach(s => map.set(s.id_sede, s.nombre));
    return map;
  }, [sedes]);

  const filteredEscuelas = useMemo(() => {
    return escuelas.filter(e => {
      const matchSearch = 
        e.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.descripcion && e.descripcion.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchEstado = 
        filterEstado === 'TODOS' ? true : e.estado === filterEstado;

      return matchSearch && matchEstado;
    });
  }, [escuelas, searchTerm, filterEstado]);

  const handleOpenCreate = () => {
    setEditingEscuela(null);
    setFormData({
      id_sede: defaultSedeId,
      codigo: `ESC-0${escuelas.length + 1}`,
      nombre: '',
      descripcion: '',
      estado: 'ACTIVA'
    });
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (e: Escuela) => {
    setEditingEscuela(e);
    setFormData({
      id_sede: e.id_sede || defaultSedeId,
      codigo: e.codigo,
      nombre: e.nombre,
      descripcion: e.descripcion || '',
      estado: e.estado || 'ACTIVA'
    });
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.codigo.trim() || !formData.nombre.trim()) {
      setErrorMessage('Por favor completa código y nombre de la escuela/facultad.');
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage(null);

      if (editingEscuela) {
        await ApiClient.updateCatalogItem('escuela', editingEscuela.id_escuela, formData);
        setSuccessMessage(`Escuela "${formData.nombre}" actualizada con éxito.`);
      } else {
        await ApiClient.createCatalogItem('escuela', formData);
        setSuccessMessage(`Escuela "${formData.nombre}" registrada correctamente.`);
      }

      setIsModalOpen(false);
      onRefresh();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al guardar la escuela');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleEstado = async (e: Escuela) => {
    try {
      const nuevo = e.estado === 'ACTIVA' ? 'INACTIVA' : 'ACTIVA';
      await ApiClient.toggleCatalogItemEstado('escuela', e.id_escuela, nuevo);
      onRefresh();
      setSuccessMessage(`Estado de ${e.nombre} cambiado a ${nuevo}.`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Error al cambiar estado');
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmEscuela) return;
    try {
      setIsSaving(true);
      await ApiClient.deleteCatalogItem('escuela', deleteConfirmEscuela.id_escuela);
      setSuccessMessage(`Escuela "${deleteConfirmEscuela.nombre}" eliminada exitosamente.`);
      setDeleteConfirmEscuela(null);
      onRefresh();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Error al eliminar escuela');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Codigo', 'Escuela', 'Sede', 'Descripcion', 'Estado'];
    const rows = filteredEscuelas.map(e => [
      `"${e.codigo}"`,
      `"${e.nombre}"`,
      `"${sedeMap.get(e.id_sede) || ''}"`,
      `"${e.descripcion || ''}"`,
      `"${e.estado}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `catalogo_escuelas_${new Date().toISOString().split('T')[0]}.csv`);
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
              placeholder="Buscar por código o nombre de facultad/escuela..."
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
            <option value="ACTIVA">Activas</option>
            <option value="INACTIVA">Inactivas</option>
          </select>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => ExportController.exportEscuelasXLSX(filteredEscuelas)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition shadow-xs cursor-pointer"
            title="Exportar escuelas a Microsoft Excel (.xlsx)"
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
            <span>Nueva Escuela</span>
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-medium text-slate-600">
          <span>Escuelas y Facultades Académicas: <strong>{filteredEscuelas.length}</strong> de <strong>{escuelas.length}</strong></span>
          <span className="text-[11px] text-slate-400">Estructura curricular divisional</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-3.5">Código</th>
                <th className="py-3 px-3.5">Escuela / Facultad</th>
                <th className="py-3 px-3.5">Sede Vinculada</th>
                <th className="py-3 px-3.5">Descripción</th>
                <th className="py-3 px-3.5 text-center">Estado</th>
                <th className="py-3 px-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEscuelas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No se encontraron escuelas con los filtros actuales.
                  </td>
                </tr>
              ) : (
                filteredEscuelas.map(e => {
                  const isActiva = e.estado === 'ACTIVA';
                  const sedeName = sedeMap.get(e.id_sede);

                  return (
                    <tr key={e.id_escuela} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-3.5 font-mono font-bold text-[#0099e6] whitespace-nowrap">
                        {e.codigo}
                      </td>
                      <td className="py-3 px-3.5">
                        <div className="font-bold text-slate-900 leading-tight flex items-center gap-1.5">
                          <School className="w-4 h-4 text-slate-500" />
                          <span>{e.nombre}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3.5 text-slate-600">
                        {sedeName ? (
                          <div className="flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            <span>{sedeName}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">Sin sede asignada</span>
                        )}
                      </td>
                      <td className="py-3 px-3.5 text-slate-500 text-xs">
                        {e.descripcion || '—'}
                      </td>
                      <td className="py-3 px-3.5 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleEstado(e)}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold cursor-pointer transition ${
                            isActiva 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100' 
                              : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                          }`}
                        >
                          <span>{e.estado}</span>
                        </button>
                      </td>
                      <td className="py-3 px-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(e)}
                            className="p-1.5 text-slate-600 hover:text-[#0099e6] hover:bg-blue-50 rounded-md transition"
                            title="Editar escuela"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmEscuela(e)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition"
                            title="Eliminar escuela"
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

      {/* Modal Crear / Editar Escuela */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-gradient-to-r from-[#0099e6] to-[#008bd1] text-white p-4.5 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <School className="w-5 h-5" />
                  <span>{editingEscuela ? 'Editar Escuela' : 'Nueva Escuela'}</span>
                </h3>
                <p className="text-xs text-blue-100 mt-0.5">
                  Facultad o escuela encargada de las carreras
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Código de Escuela *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. ESC-ING"
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0099e6] focus:bg-white focus:outline-hidden font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Sede Asociada
                  </label>
                  <select
                    value={formData.id_sede}
                    onChange={(e) => setFormData({ ...formData, id_sede: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0099e6] focus:bg-white focus:outline-hidden"
                  >
                    {sedes.map(s => (
                      <option key={s.id_sede} value={s.id_sede}>
                        {s.nombre} ({s.codigo})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nombre de la Escuela / Facultad *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Escuela de Tecnologías de la Información"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0099e6] focus:bg-white focus:outline-hidden"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Descripción / Misión
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Información sobre la facultad o decanato..."
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0099e6] focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Estado
                </label>
                <div className="flex items-center gap-4 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                    <input
                      type="radio"
                      name="estado_escuela"
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
                      name="estado_escuela"
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
                  className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 text-xs sm:text-sm font-bold text-white bg-[#0099e6] hover:bg-[#008bd1] rounded-lg shadow-xs transition disabled:opacity-50"
                >
                  {isSaving ? 'Guardando...' : editingEscuela ? 'Actualizar Escuela' : 'Guardar Escuela'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmEscuela && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-5 border border-slate-100">
            <div className="w-11 h-11 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">¿Eliminar Escuela?</h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Estás a punto de eliminar <strong>{deleteConfirmEscuela.nombre}</strong> ({deleteConfirmEscuela.codigo}).
            </p>
            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteConfirmEscuela(null)}
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
