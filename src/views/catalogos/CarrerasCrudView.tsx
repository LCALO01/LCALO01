import React, { useState, useMemo } from 'react';
import { Carrera, Escuela, PlanificacionCompleta } from '../../types.ts';
import { ApiClient } from '../../controllers/apiClient.ts';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  RefreshCw, 
  GraduationCap, 
  CheckCircle2, 
  X, 
  AlertTriangle,
  Download,
  Building,
  FileSpreadsheet
} from 'lucide-react';
import { ExportController } from '../../controllers/exportController.ts';

interface CarrerasCrudViewProps {
  carreras: Carrera[];
  escuelas: Escuela[];
  planificaciones: PlanificacionCompleta[];
  onRefresh: () => void;
}

export const CarrerasCrudView: React.FC<CarrerasCrudViewProps> = ({
  carreras,
  escuelas,
  planificaciones,
  onRefresh
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEscuela, setFilterEscuela] = useState<string>('TODAS');
  const [filterModalidad, setFilterModalidad] = useState<string>('TODAS');
  const [filterEstado, setFilterEstado] = useState<string>('TODOS');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCarrera, setEditingCarrera] = useState<Carrera | null>(null);
  const [deleteConfirmCarrera, setDeleteConfirmCarrera] = useState<Carrera | null>(null);
  
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const defaultEscuelaId = escuelas.length > 0 ? escuelas[0].id_escuela : 1;

  const [formData, setFormData] = useState({
    id_escuela: defaultEscuelaId,
    codigo: '',
    nombre: '',
    titulo_otorgado: '',
    modalidad: 'PRESENCIAL',
    duracion_niveles: 5,
    numero_semanas: 16,
    estado: 'ACTIVA'
  });

  const escuelaMap = useMemo(() => {
    const map = new Map<number, string>();
    escuelas.forEach(e => map.set(e.id_escuela, e.nombre));
    return map;
  }, [escuelas]);

  const filteredCarreras = useMemo(() => {
    return carreras.filter(c => {
      const matchSearch = 
        c.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.titulo_otorgado && c.titulo_otorgado.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchEscuela = 
        filterEscuela === 'TODAS' ? true : String(c.id_escuela) === filterEscuela;

      const matchModalidad = 
        filterModalidad === 'TODAS' ? true : c.modalidad === filterModalidad;

      const matchEstado = 
        filterEstado === 'TODOS' ? true : c.estado === filterEstado;

      return matchSearch && matchEscuela && matchModalidad && matchEstado;
    });
  }, [carreras, searchTerm, filterEscuela, filterModalidad, filterEstado]);

  const handleOpenCreate = () => {
    setEditingCarrera(null);
    setFormData({
      id_escuela: defaultEscuelaId,
      codigo: '',
      nombre: '',
      titulo_otorgado: '',
      modalidad: 'PRESENCIAL',
      duracion_niveles: 5,
      numero_semanas: 16,
      estado: 'ACTIVA'
    });
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Carrera) => {
    setEditingCarrera(c);
    setFormData({
      id_escuela: c.id_escuela || defaultEscuelaId,
      codigo: c.codigo,
      nombre: c.nombre,
      titulo_otorgado: c.titulo_otorgado || '',
      modalidad: c.modalidad || 'PRESENCIAL',
      duracion_niveles: c.duracion_niveles || 5,
      numero_semanas: c.numero_semanas || 16,
      estado: c.estado || 'ACTIVA'
    });
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.codigo.trim() || !formData.nombre.trim()) {
      setErrorMessage('Código y nombre de carrera son obligatorios.');
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage(null);

      if (editingCarrera) {
        await ApiClient.updateCatalogItem('carrera', editingCarrera.id_carrera, formData);
        setSuccessMessage(`Carrera "${formData.nombre}" actualizada exitosamente.`);
      } else {
        await ApiClient.createCatalogItem('carrera', formData);
        setSuccessMessage(`Carrera "${formData.nombre}" registrada correctamente.`);
      }

      setIsModalOpen(false);
      onRefresh();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al guardar carrera');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleEstado = async (c: Carrera) => {
    try {
      const nuevo = c.estado === 'ACTIVA' ? 'INACTIVA' : 'ACTIVA';
      await ApiClient.toggleCatalogItemEstado('carrera', c.id_carrera, nuevo);
      onRefresh();
      setSuccessMessage(`Estado de ${c.nombre} actualizado a ${nuevo}.`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Error al alternar estado');
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmCarrera) return;
    try {
      setIsSaving(true);
      await ApiClient.deleteCatalogItem('carrera', deleteConfirmCarrera.id_carrera);
      setSuccessMessage(`Carrera "${deleteConfirmCarrera.nombre}" eliminada exitosamente.`);
      setDeleteConfirmCarrera(null);
      onRefresh();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Error al eliminar carrera');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Codigo', 'Carrera', 'Titulo Otorgado', 'Modalidad', 'Duracion Niveles', '# de Semanas', 'Estado'];
    const rows = filteredCarreras.map(c => [
      `"${c.codigo}"`,
      `"${c.nombre}"`,
      `"${c.titulo_otorgado || ''}"`,
      `"${c.modalidad}"`,
      c.duracion_niveles,
      c.numero_semanas || 16,
      `"${c.estado}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `catalogo_carreras_${new Date().toISOString().split('T')[0]}.csv`);
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
              placeholder="Buscar por código, nombre o título..."
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
            value={filterEscuela}
            onChange={(e) => setFilterEscuela(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 font-medium text-slate-700 focus:outline-hidden"
          >
            <option value="TODAS">Todas las escuelas ({escuelas.length})</option>
            {escuelas.map((esc) => (
              <option key={esc.id_escuela} value={String(esc.id_escuela)}>
                {esc.codigo} - {esc.nombre}
              </option>
            ))}
          </select>

          <select
            value={filterModalidad}
            onChange={(e) => setFilterModalidad(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 font-medium text-slate-700 focus:outline-hidden"
          >
            <option value="TODAS">Todas las modalidades</option>
            <option value="PRESENCIAL">Presencial</option>
            <option value="VIRTUAL">Virtual</option>
            <option value="HIBRIDA">Híbrida</option>
          </select>

          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 font-medium text-slate-700 focus:outline-hidden hidden sm:block"
          >
            <option value="TODOS">Todos los estados</option>
            <option value="ACTIVA">Activas</option>
            <option value="INACTIVA">Inactivas</option>
          </select>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => ExportController.exportCarrerasXLSX(filteredCarreras)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition shadow-xs cursor-pointer"
            title="Exportar carreras a Microsoft Excel (.xlsx)"
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
            <span>Nueva Carrera</span>
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-medium text-slate-600">
          <span>Oferta Académica: <strong>{filteredCarreras.length}</strong> de <strong>{carreras.length}</strong> carreras vigentes</span>
          <span className="text-[11px] text-slate-400">Total activas: {carreras.filter(c => c.estado === 'ACTIVA').length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-3.5">Código</th>
                <th className="py-3 px-3.5">Carrera Profesional</th>
                <th className="py-3 px-3.5">Título Otorgado</th>
                <th className="py-3 px-3.5 text-center">Modalidad</th>
                <th className="py-3 px-3.5 text-center">Duración</th>
                <th className="py-3 px-3.5 text-center"># de Semanas</th>
                <th className="py-3 px-3.5 text-center">Estado</th>
                <th className="py-3 px-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCarreras.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No se encontraron carreras con el criterio seleccionado.
                  </td>
                </tr>
              ) : (
                filteredCarreras.map(c => {
                  const isActiva = c.estado === 'ACTIVA';
                  const escName = escuelaMap.get(c.id_escuela);

                  return (
                    <tr key={c.id_carrera} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-3.5 font-mono font-bold text-[#0099e6] whitespace-nowrap">
                        {c.codigo}
                      </td>
                      <td className="py-3 px-3.5">
                        <div className="font-bold text-slate-900 leading-tight">
                          {c.nombre}
                        </div>
                        {escName && (
                          <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Building className="w-3 h-3 text-slate-400" />
                            <span>{escName.toUpperCase().startsWith('ESCUELA') ? escName : `ESCUELA DE ${escName}`}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3.5 text-slate-600">
                        {c.titulo_otorgado || 'Tecnólogo Superior'}
                      </td>
                      <td className="py-3 px-3.5 text-center whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          c.modalidad === 'PRESENCIAL' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                          c.modalidad === 'HIBRIDA' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                          'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {c.modalidad}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-center font-bold text-slate-700 whitespace-nowrap">
                        {c.duracion_niveles} Semestres
                      </td>
                      <td className="py-3 px-3.5 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200 font-mono">
                          {c.numero_semanas || 16} Semanas
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleEstado(c)}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold cursor-pointer transition ${
                            isActiva 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100' 
                              : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                          }`}
                        >
                          <span>{c.estado}</span>
                        </button>
                      </td>
                      <td className="py-3 px-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(c)}
                            className="p-1.5 text-slate-600 hover:text-[#0099e6] hover:bg-blue-50 rounded-md transition"
                            title="Editar carrera"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmCarrera(c)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition"
                            title="Eliminar carrera"
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

      {/* Modal Crear / Editar Carrera */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-gradient-to-r from-[#0099e6] to-[#008bd1] text-white p-4.5 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <GraduationCap className="w-5 h-5" />
                  <span>{editingCarrera ? 'Editar Carrera' : 'Nueva Carrera'}</span>
                </h3>
                <p className="text-xs text-blue-100 mt-0.5">
                  Registro de programa académico oficial de la institución
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
                    Código de Carrera *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. DS"
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0099e6] focus:bg-white focus:outline-hidden font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Modalidad de Estudio
                  </label>
                  <select
                    value={formData.modalidad}
                    onChange={(e) => setFormData({ ...formData, modalidad: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0099e6] focus:bg-white focus:outline-hidden"
                  >
                    <option value="PRESENCIAL">PRESENCIAL</option>
                    <option value="HIBRIDA">HÍBRIDA</option>
                    <option value="VIRTUAL">VIRTUAL</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nombre de la Carrera *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Desarrollo de Software"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0099e6] focus:bg-white focus:outline-hidden"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Título que Otorga
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Tecnólogo/a Superior en Desarrollo de Software"
                    value={formData.titulo_otorgado}
                    onChange={(e) => setFormData({ ...formData, titulo_otorgado: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0099e6] focus:bg-white focus:outline-hidden"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Escuela / Facultad Perteneciente
                  </label>
                  <select
                    value={formData.id_escuela}
                    onChange={(e) => setFormData({ ...formData, id_escuela: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0099e6] focus:bg-white focus:outline-hidden"
                  >
                    {escuelas.map(esc => (
                      <option key={esc.id_escuela} value={esc.id_escuela}>
                        {esc.nombre} ({esc.codigo})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Duración (Semestres) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    required
                    value={formData.duracion_niveles}
                    onChange={(e) => setFormData({ ...formData, duracion_niveles: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0099e6] focus:bg-white focus:outline-hidden"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Cantidad total de semestres
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    # de Semanas (por Semestre) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    required
                    placeholder="16"
                    value={formData.numero_semanas}
                    onChange={(e) => setFormData({ ...formData, numero_semanas: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0099e6] focus:bg-white focus:outline-hidden font-bold text-slate-800"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Duración del semestre en semanas (ej. 16)
                  </p>
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
                      name="estado_car"
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
                      name="estado_car"
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
                  {isSaving ? 'Guardando...' : editingCarrera ? 'Actualizar Carrera' : 'Guardar Carrera'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmCarrera && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-5 border border-slate-100">
            <div className="w-11 h-11 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">¿Eliminar Carrera?</h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Estás a punto de eliminar la carrera <strong>{deleteConfirmCarrera.nombre}</strong> ({deleteConfirmCarrera.codigo}).
            </p>
            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteConfirmCarrera(null)}
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
