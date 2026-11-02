import React, { useState, useMemo } from 'react';
import { Sede } from '../../types.ts';
import { ApiClient } from '../../controllers/apiClient.ts';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  RefreshCw, 
  Building2, 
  CheckCircle2, 
  X, 
  AlertTriangle,
  Download,
  MapPin,
  Phone,
  Mail,
  FileSpreadsheet
} from 'lucide-react';
import { ExportController } from '../../controllers/exportController.ts';

interface SedesCrudViewProps {
  sedes: Sede[];
  onRefresh: () => void;
}

export const SedesCrudView: React.FC<SedesCrudViewProps> = ({
  sedes,
  onRefresh
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<string>('TODOS');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSede, setEditingSede] = useState<Sede | null>(null);
  const [deleteConfirmSede, setDeleteConfirmSede] = useState<Sede | null>(null);
  
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    ciudad: 'Quito',
    provincia: 'Pichincha',
    direccion: '',
    telefono: '',
    correo: '',
    estado: 'ACTIVA'
  });

  const filteredSedes = useMemo(() => {
    return sedes.filter(s => {
      const matchSearch = 
        s.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.ciudad && s.ciudad.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchEstado = 
        filterEstado === 'TODOS' ? true : s.estado === filterEstado;

      return matchSearch && matchEstado;
    });
  }, [sedes, searchTerm, filterEstado]);

  const handleOpenCreate = () => {
    setEditingSede(null);
    setFormData({
      codigo: `SED-0${sedes.length + 1}`,
      nombre: '',
      ciudad: 'Quito',
      provincia: 'Pichincha',
      direccion: '',
      telefono: '',
      correo: '',
      estado: 'ACTIVA'
    });
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (s: Sede) => {
    setEditingSede(s);
    setFormData({
      codigo: s.codigo,
      nombre: s.nombre,
      ciudad: s.ciudad || 'Quito',
      provincia: s.provincia || 'Pichincha',
      direccion: s.direccion || '',
      telefono: s.telefono || '',
      correo: s.correo || '',
      estado: s.estado || 'ACTIVA'
    });
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.codigo.trim() || !formData.nombre.trim()) {
      setErrorMessage('Por favor completa código y nombre de la sede.');
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage(null);

      if (editingSede) {
        await ApiClient.updateCatalogItem('sede', editingSede.id_sede, formData);
        setSuccessMessage(`Sede "${formData.nombre}" actualizada con éxito.`);
      } else {
        await ApiClient.createCatalogItem('sede', formData);
        setSuccessMessage(`Sede "${formData.nombre}" registrada correctamente.`);
      }

      setIsModalOpen(false);
      onRefresh();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al guardar la sede');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleEstado = async (s: Sede) => {
    try {
      const nuevo = s.estado === 'ACTIVA' ? 'INACTIVA' : 'ACTIVA';
      await ApiClient.toggleCatalogItemEstado('sede', s.id_sede, nuevo);
      onRefresh();
      setSuccessMessage(`Estado de ${s.nombre} cambiado a ${nuevo}.`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Error al cambiar estado');
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmSede) return;
    try {
      setIsSaving(true);
      await ApiClient.deleteCatalogItem('sede', deleteConfirmSede.id_sede);
      setSuccessMessage(`Sede "${deleteConfirmSede.nombre}" eliminada exitosamente.`);
      setDeleteConfirmSede(null);
      onRefresh();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Error al eliminar sede');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Codigo', 'Sede', 'Ciudad', 'Provincia', 'Direccion', 'Telefono', 'Correo', 'Estado'];
    const rows = filteredSedes.map(s => [
      `"${s.codigo}"`,
      `"${s.nombre}"`,
      `"${s.ciudad || ''}"`,
      `"${s.provincia || ''}"`,
      `"${s.direccion || ''}"`,
      `"${s.telefono || ''}"`,
      `"${s.correo || ''}"`,
      `"${s.estado}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `catalogo_sedes_${new Date().toISOString().split('T')[0]}.csv`);
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
              placeholder="Buscar por código, nombre o ciudad..."
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
            onClick={() => ExportController.exportSedesXLSX(filteredSedes)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition shadow-xs cursor-pointer"
            title="Exportar sedes a Microsoft Excel (.xlsx)"
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
            <span>Nueva Sede</span>
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-medium text-slate-600">
          <span>Campus y Sedes Físicas: <strong>{filteredSedes.length}</strong> de <strong>{sedes.length}</strong></span>
          <span className="text-[11px] text-slate-400">Distribución territorial</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-3.5">Código</th>
                <th className="py-3 px-3.5">Sede / Campus</th>
                <th className="py-3 px-3.5">Ubicación</th>
                <th className="py-3 px-3.5">Contacto</th>
                <th className="py-3 px-3.5 text-center">Estado</th>
                <th className="py-3 px-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSedes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No se encontraron sedes con los filtros actuales.
                  </td>
                </tr>
              ) : (
                filteredSedes.map(s => {
                  const isActiva = s.estado === 'ACTIVA';

                  return (
                    <tr key={s.id_sede} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-3.5 font-mono font-bold text-[#0099e6] whitespace-nowrap">
                        {s.codigo}
                      </td>
                      <td className="py-3 px-3.5">
                        <div className="font-bold text-slate-900 leading-tight flex items-center gap-1.5">
                          <Building2 className="w-4 h-4 text-slate-500" />
                          <span>{s.nombre}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3.5 text-slate-600">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{s.ciudad}, {s.provincia}</span>
                        </div>
                        {s.direccion && (
                          <div className="text-[11px] text-slate-400 pl-4.5 mt-0.5">
                            {s.direccion}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        {s.correo && (
                          <div className="text-xs text-slate-700 flex items-center gap-1">
                            <Mail className="w-3 h-3 text-[#0099e6]" />
                            <span>{s.correo}</span>
                          </div>
                        )}
                        {s.telefono && (
                          <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{s.telefono}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3.5 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleEstado(s)}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold cursor-pointer transition ${
                            isActiva 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100' 
                              : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                          }`}
                        >
                          <span>{s.estado}</span>
                        </button>
                      </td>
                      <td className="py-3 px-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(s)}
                            className="p-1.5 text-slate-600 hover:text-[#0099e6] hover:bg-blue-50 rounded-md transition"
                            title="Editar sede"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmSede(s)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition"
                            title="Eliminar sede"
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

      {/* Modal Crear / Editar Sede */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-gradient-to-r from-[#0099e6] to-[#008bd1] text-white p-4.5 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  <span>{editingSede ? 'Editar Sede' : 'Nueva Sede'}</span>
                </h3>
                <p className="text-xs text-blue-100 mt-0.5">
                  Campus o sede física de la institución
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
                    Código de Sede *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. MAT-01"
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0099e6] focus:bg-white focus:outline-hidden font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ciudad
                  </label>
                  <input
                    type="text"
                    value={formData.ciudad}
                    onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0099e6] focus:bg-white focus:outline-hidden"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nombre del Campus o Sede *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Sede Matriz Campus Norte"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0099e6] focus:bg-white focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Provincia
                  </label>
                  <input
                    type="text"
                    value={formData.provincia}
                    onChange={(e) => setFormData({ ...formData, provincia: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0099e6] focus:bg-white focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. (02) 299-1700"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0099e6] focus:bg-white focus:outline-hidden"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Dirección Exacta
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Av. 10 de Agosto N24-15 y Colón"
                    value={formData.direccion}
                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0099e6] focus:bg-white focus:outline-hidden"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Correo Electrónico de Sede
                  </label>
                  <input
                    type="email"
                    placeholder="campus@isuj.edu.ec"
                    value={formData.correo}
                    onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
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
                      name="estado_sede"
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
                      name="estado_sede"
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
                  {isSaving ? 'Guardando...' : editingSede ? 'Actualizar Sede' : 'Guardar Sede'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmSede && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-5 border border-slate-100">
            <div className="w-11 h-11 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">¿Eliminar Sede?</h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Estás a punto de eliminar <strong>{deleteConfirmSede.nombre}</strong> ({deleteConfirmSede.codigo}).
            </p>
            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteConfirmSede(null)}
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
