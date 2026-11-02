import React, { useState } from 'react';
import { Nivel, Paralelo, Jornada, Hora } from '../../types.ts';
import { ApiClient } from '../../controllers/apiClient.ts';
import { 
  Layers, 
  ListOrdered, 
  Clock, 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle2, 
  X, 
  AlertTriangle, 
  Download, 
  RefreshCw 
} from 'lucide-react';

interface NivelesParalelosJornadasCrudViewProps {
  niveles?: Nivel[];
  paralelos?: Paralelo[];
  jornadas?: Jornada[];
  horas?: Hora[];
  onRefresh: () => void;
  initialTab?: 'niveles' | 'paralelos' | 'jornadas' | 'horas';
}

export const NivelesParalelosJornadasCrudView: React.FC<NivelesParalelosJornadasCrudViewProps> = ({
  niveles = [],
  paralelos = [],
  jornadas = [],
  horas = [],
  onRefresh,
  initialTab = 'niveles'
}) => {
  const [activeSubSection, setActiveSubSection] = useState<'niveles' | 'paralelos' | 'jornadas' | 'horas'>(initialTab);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Modales
  const [modalType, setModalType] = useState<'nivel' | 'paralelo' | 'jornada' | 'hora' | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'nivel' | 'paralelo' | 'jornada' | 'hora'; item: any } | null>(null);

  // Form states
  const [nivelForm, setNivelForm] = useState({ numero: 1, nombre: '', descripcion: '', estado: 'ACTIVO' });
  const [paraleloForm, setParaleloForm] = useState({ codigo: '', descripcion: '', cupo_maximo: 35, estado: 'ACTIVO' });
  const [jornadaForm, setJornadaForm] = useState({ codigo: '', nombre: '', hora_inicio: '07:00', hora_fin: '13:00', estado: 'ACTIVA' });
  const [horaForm, setHoraForm] = useState({
    codigo: '',
    nombre: '',
    hora_inicio: '07:00',
    hora_fin: '08:00',
    id_jornada: 1,
    orden: 1,
    estado: 'ACTIVA'
  });

  // Handlers para Niveles
  const handleOpenNivel = (item?: Nivel) => {
    if (item) {
      setEditingItem(item);
      setNivelForm({
        numero: item.numero,
        nombre: item.nombre,
        descripcion: item.descripcion || '',
        estado: item.estado || 'ACTIVO'
      });
    } else {
      setEditingItem(null);
      setNivelForm({
        numero: (niveles.length > 0 ? Math.max(...niveles.map(n => n.numero)) + 1 : 1),
        nombre: `${niveles.length + 1}º Semestre`,
        descripcion: '',
        estado: 'ACTIVO'
      });
    }
    setModalType('nivel');
    setErrorMessage(null);
  };

  const handleSaveNivel = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      if (editingItem) {
        await ApiClient.updateCatalogItem('nivel', editingItem.id_nivel, nivelForm);
        setSuccessMessage(`Nivel ${nivelForm.nombre} actualizado.`);
      } else {
        await ApiClient.createCatalogItem('nivel', nivelForm);
        setSuccessMessage(`Nivel ${nivelForm.nombre} creado.`);
      }
      setModalType(null);
      onRefresh();
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error guardando nivel');
    } finally {
      setIsSaving(false);
    }
  };

  // Handlers para Paralelos
  const handleOpenParalelo = (item?: Paralelo) => {
    if (item) {
      setEditingItem(item);
      setParaleloForm({
        codigo: item.codigo,
        descripcion: item.descripcion || '',
        cupo_maximo: item.cupo_maximo || 35,
        estado: item.estado || 'ACTIVO'
      });
    } else {
      setEditingItem(null);
      const nextChar = String.fromCharCode(65 + paralelos.length);
      setParaleloForm({
        codigo: nextChar,
        descripcion: `Paralelo ${nextChar}`,
        cupo_maximo: 35,
        estado: 'ACTIVO'
      });
    }
    setModalType('paralelo');
    setErrorMessage(null);
  };

  const handleSaveParalelo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      if (editingItem) {
        await ApiClient.updateCatalogItem('paralelo', editingItem.id_paralelo, paraleloForm);
        setSuccessMessage(`Paralelo ${paraleloForm.codigo} actualizado.`);
      } else {
        await ApiClient.createCatalogItem('paralelo', paraleloForm);
        setSuccessMessage(`Paralelo ${paraleloForm.codigo} creado.`);
      }
      setModalType(null);
      onRefresh();
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error guardando paralelo');
    } finally {
      setIsSaving(false);
    }
  };

  // Handlers para Jornadas
  const handleOpenJornada = (item?: Jornada) => {
    if (item) {
      setEditingItem(item);
      setJornadaForm({
        codigo: item.codigo,
        nombre: item.nombre,
        hora_inicio: item.hora_inicio,
        hora_fin: item.hora_fin,
        estado: item.estado || 'ACTIVA'
      });
    } else {
      setEditingItem(null);
      setJornadaForm({
        codigo: `JOR-0${jornadas.length + 1}`,
        nombre: '',
        hora_inicio: '14:00',
        hora_fin: '20:00',
        estado: 'ACTIVA'
      });
    }
    setModalType('jornada');
    setErrorMessage(null);
  };

  const handleSaveJornada = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      if (editingItem) {
        await ApiClient.updateCatalogItem('jornada', editingItem.id_jornada, jornadaForm);
        setSuccessMessage(`Jornada ${jornadaForm.nombre} actualizada.`);
      } else {
        await ApiClient.createCatalogItem('jornada', jornadaForm);
        setSuccessMessage(`Jornada ${jornadaForm.nombre} creada.`);
      }
      setModalType(null);
      onRefresh();
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error guardando jornada');
    } finally {
      setIsSaving(false);
    }
  };

  // Handlers para Horas
  const handleOpenHora = (item?: Hora) => {
    if (item) {
      setEditingItem(item);
      setHoraForm({
        codigo: item.codigo,
        nombre: item.nombre,
        hora_inicio: item.hora_inicio || '07:00',
        hora_fin: item.hora_fin || '08:00',
        id_jornada: item.id_jornada || (jornadas.length > 0 ? jornadas[0].id_jornada : 1),
        orden: item.orden || 1,
        estado: item.estado || 'ACTIVA'
      });
    } else {
      setEditingItem(null);
      const nextNum = (horas.length > 0 ? Math.max(...horas.map(h => h.id_hora || 0)) + 1 : 1);
      setHoraForm({
        codigo: `H${nextNum}`,
        nombre: `${nextNum}ª Hora`,
        hora_inicio: '08:00',
        hora_fin: '09:00',
        id_jornada: jornadas.length > 0 ? jornadas[0].id_jornada : 1,
        orden: nextNum,
        estado: 'ACTIVA'
      });
    }
    setModalType('hora');
    setErrorMessage(null);
  };

  const handleSaveHora = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const dataToSave = {
        ...horaForm,
        nombre: horaForm.nombre || `${horaForm.hora_inicio} - ${horaForm.hora_fin}`
      };
      if (editingItem) {
        await ApiClient.updateCatalogItem('hora', editingItem.id_hora, dataToSave);
        setSuccessMessage(`Franja horaria ${dataToSave.codigo} (${dataToSave.hora_inicio} - ${dataToSave.hora_fin}) actualizada.`);
      } else {
        await ApiClient.createCatalogItem('hora', dataToSave);
        setSuccessMessage(`Franja horaria ${dataToSave.codigo} (${dataToSave.hora_inicio} - ${dataToSave.hora_fin}) creada.`);
      }
      setModalType(null);
      onRefresh();
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error guardando franja horaria');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      setIsSaving(true);
      const { type, item } = deleteConfirm;
      const id = type === 'nivel' 
        ? item.id_nivel 
        : type === 'paralelo' 
        ? item.id_paralelo 
        : type === 'jornada' 
        ? item.id_jornada 
        : item.id_hora;
      await ApiClient.deleteCatalogItem(type, id);
      setSuccessMessage(`Elemento eliminado correctamente.`);
      setDeleteConfirm(null);
      onRefresh();
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err: any) {
      alert(err.message || 'Error al eliminar elemento');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {successMessage && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-xl">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Sub-selector bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg">
          <button
            type="button"
            onClick={() => setActiveSubSection('niveles')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition ${
              activeSubSection === 'niveles'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-[#0099e6]" />
            <span>Niveles Semestrales ({niveles.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubSection('paralelos')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition ${
              activeSubSection === 'paralelos'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ListOrdered className="w-3.5 h-3.5 text-[#0099e6]" />
            <span>Paralelos ({paralelos.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubSection('jornadas')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition ${
              activeSubSection === 'jornadas'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-[#0099e6]" />
            <span>Jornadas y Turnos ({jornadas.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubSection('horas')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition ${
              activeSubSection === 'horas'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-[#0099e6]" />
            <span>Horas ({horas.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={onRefresh}
            className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
            title="Recargar catálogo"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {activeSubSection === 'niveles' && (
            <button
              type="button"
              onClick={() => handleOpenNivel()}
              className="flex items-center gap-1.5 bg-[#0099e6] hover:bg-[#008bd1] text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-xs transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nuevo Nivel</span>
            </button>
          )}

          {activeSubSection === 'paralelos' && (
            <button
              type="button"
              onClick={() => handleOpenParalelo()}
              className="flex items-center gap-1.5 bg-[#0099e6] hover:bg-[#008bd1] text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-xs transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nuevo Paralelo</span>
            </button>
          )}

          {activeSubSection === 'jornadas' && (
            <button
              type="button"
              onClick={() => handleOpenJornada()}
              className="flex items-center gap-1.5 bg-[#0099e6] hover:bg-[#008bd1] text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-xs transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nueva Jornada</span>
            </button>
          )}

          {activeSubSection === 'horas' && (
            <button
              type="button"
              onClick={() => handleOpenHora()}
              className="flex items-center gap-1.5 bg-[#0099e6] hover:bg-[#008bd1] text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-xs transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nueva Hora</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub-view: Niveles */}
      {activeSubSection === 'niveles' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-3 bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-600">
            Niveles y Semestres Académicos
          </div>
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                <th className="py-2.5 px-3.5 text-center">Nº</th>
                <th className="py-2.5 px-3.5">Nombre</th>
                <th className="py-2.5 px-3.5">Descripción</th>
                <th className="py-2.5 px-3.5 text-center">Estado</th>
                <th className="py-2.5 px-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {niveles.map(n => (
                <tr key={n.id_nivel} className="hover:bg-slate-50 transition">
                  <td className="py-2.5 px-3.5 text-center font-bold font-mono text-[#0099e6]">
                    {n.numero}
                  </td>
                  <td className="py-2.5 px-3.5 font-semibold text-slate-900">
                    {n.nombre}
                  </td>
                  <td className="py-2.5 px-3.5 text-slate-500">
                    {n.descripcion || '—'}
                  </td>
                  <td className="py-2.5 px-3.5 text-center">
                    <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {n.estado}
                    </span>
                  </td>
                  <td className="py-2.5 px-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenNivel(n)}
                        className="p-1 text-slate-600 hover:text-[#0099e6] rounded"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm({ type: 'nivel', item: n })}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Sub-view: Paralelos */}
      {activeSubSection === 'paralelos' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-3 bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-600">
            Paralelos y Secciones
          </div>
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                <th className="py-2.5 px-3.5 text-center">Código</th>
                <th className="py-2.5 px-3.5">Descripción</th>
                <th className="py-2.5 px-3.5 text-center">Cupo Sugerido</th>
                <th className="py-2.5 px-3.5 text-center">Estado</th>
                <th className="py-2.5 px-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paralelos.map(p => (
                <tr key={p.id_paralelo} className="hover:bg-slate-50 transition">
                  <td className="py-2.5 px-3.5 text-center font-mono font-bold text-[#0099e6]">
                    {p.codigo}
                  </td>
                  <td className="py-2.5 px-3.5 font-semibold text-slate-900">
                    {p.descripcion || `Paralelo ${p.codigo}`}
                  </td>
                  <td className="py-2.5 px-3.5 text-center font-mono text-slate-700">
                    {p.cupo_maximo || 35} est.
                  </td>
                  <td className="py-2.5 px-3.5 text-center">
                    <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {p.estado}
                    </span>
                  </td>
                  <td className="py-2.5 px-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenParalelo(p)}
                        className="p-1 text-slate-600 hover:text-[#0099e6] rounded"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm({ type: 'paralelo', item: p })}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Sub-view: Jornadas */}
      {activeSubSection === 'jornadas' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-3 bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-600">
            Jornadas y Turnos Horarios
          </div>
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                <th className="py-2.5 px-3.5">Código</th>
                <th className="py-2.5 px-3.5">Jornada</th>
                <th className="py-2.5 px-3.5 text-center">Hora Inicio</th>
                <th className="py-2.5 px-3.5 text-center">Hora Fin</th>
                <th className="py-2.5 px-3.5 text-center">Estado</th>
                <th className="py-2.5 px-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {jornadas.map(j => (
                <tr key={j.id_jornada} className="hover:bg-slate-50 transition">
                  <td className="py-2.5 px-3.5 font-mono font-bold text-[#0099e6]">
                    {j.codigo}
                  </td>
                  <td className="py-2.5 px-3.5 font-semibold text-slate-900">
                    {j.nombre}
                  </td>
                  <td className="py-2.5 px-3.5 text-center font-mono text-slate-700">
                    {j.hora_inicio}
                  </td>
                  <td className="py-2.5 px-3.5 text-center font-mono text-slate-700">
                    {j.hora_fin}
                  </td>
                  <td className="py-2.5 px-3.5 text-center">
                    <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {j.estado}
                    </span>
                  </td>
                  <td className="py-2.5 px-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenJornada(j)}
                        className="p-1 text-slate-600 hover:text-[#0099e6] rounded"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm({ type: 'jornada', item: j })}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Sub-view: Horas / Franjas Horarias */}
      {activeSubSection === 'horas' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-3 bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-600 flex items-center justify-between">
            <span>Franjas Horarias Académicas (Horas de Inicio y Fin)</span>
            <span className="text-[11px] text-slate-500 font-mono">
              Total: {horas.length} {horas.length === 1 ? 'hora registrada' : 'horas registradas'}
            </span>
          </div>
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                <th className="py-2.5 px-3.5">Código</th>
                <th className="py-2.5 px-3.5">Franja / Etiqueta</th>
                <th className="py-2.5 px-3.5 text-center">Hora Inicio</th>
                <th className="py-2.5 px-3.5 text-center">Hora Fin</th>
                <th className="py-2.5 px-3.5">Jornada / Turno</th>
                <th className="py-2.5 px-3.5 text-center">Estado</th>
                <th className="py-2.5 px-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {horas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    <Clock className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="text-xs">No hay franjas de horas configuradas.</p>
                    <button
                      type="button"
                      onClick={() => handleOpenHora()}
                      className="mt-2 text-xs font-bold text-[#0099e6] hover:underline"
                    >
                      + Crear la primera franja horaria
                    </button>
                  </td>
                </tr>
              ) : (
                horas.map(h => (
                  <tr key={h.id_hora} className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-3.5 font-mono font-bold text-[#0099e6]">
                      {h.codigo}
                    </td>
                    <td className="py-2.5 px-3.5 font-semibold text-slate-900">
                      {h.nombre}
                    </td>
                    <td className="py-2.5 px-3.5 text-center font-mono font-bold text-slate-800">
                      <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {h.hora_inicio}
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5 text-center font-mono font-bold text-slate-800">
                      <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-100">
                        {h.hora_fin}
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5 text-slate-600">
                      {h.jornada_nombre || jornadas.find(j => j.id_jornada === h.id_jornada)?.nombre || 'General'}
                    </td>
                    <td className="py-2.5 px-3.5 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        h.estado === 'ACTIVA' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {h.estado}
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenHora(h)}
                          className="p-1 text-slate-600 hover:text-[#0099e6] rounded"
                          title="Editar hora"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm({ type: 'hora', item: h })}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded"
                          title="Eliminar hora"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Nivel */}
      {modalType === 'nivel' && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 border border-slate-100 shadow-2xl">
            <h3 className="text-sm font-bold text-slate-900 mb-3">
              {editingItem ? 'Editar Nivel' : 'Nuevo Nivel'}
            </h3>
            <form onSubmit={handleSaveNivel} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Número de Nivel</label>
                <input
                  type="number"
                  required
                  min="1"
                  max="12"
                  value={nivelForm.numero}
                  onChange={(e) => setNivelForm({ ...nivelForm, numero: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0099e6]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nombre</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Primer Semestre"
                  value={nivelForm.nombre}
                  onChange={(e) => setNivelForm({ ...nivelForm, nombre: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0099e6]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Descripción</label>
                <input
                  type="text"
                  value={nivelForm.descripcion}
                  onChange={(e) => setNivelForm({ ...nivelForm, descripcion: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-3 py-1.5 text-xs font-bold text-white bg-[#0099e6] hover:bg-[#008bd1] rounded-lg"
                >
                  {isSaving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Paralelo */}
      {modalType === 'paralelo' && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 border border-slate-100 shadow-2xl">
            <h3 className="text-sm font-bold text-slate-900 mb-3">
              {editingItem ? 'Editar Paralelo' : 'Nuevo Paralelo'}
            </h3>
            <form onSubmit={handleSaveParalelo} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Letra / Código *</label>
                <input
                  type="text"
                  required
                  maxLength={5}
                  value={paraleloForm.codigo}
                  onChange={(e) => setParaleloForm({ ...paraleloForm, codigo: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono uppercase"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Descripción</label>
                <input
                  type="text"
                  placeholder="Ej. Paralelo A"
                  value={paraleloForm.descripcion}
                  onChange={(e) => setParaleloForm({ ...paraleloForm, descripcion: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Cupo Máximo</label>
                <input
                  type="number"
                  min="5"
                  max="100"
                  value={paraleloForm.cupo_maximo}
                  onChange={(e) => setParaleloForm({ ...paraleloForm, cupo_maximo: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-3 py-1.5 text-xs font-bold text-white bg-[#0099e6] hover:bg-[#008bd1] rounded-lg"
                >
                  {isSaving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Jornada */}
      {modalType === 'jornada' && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 border border-slate-100 shadow-2xl">
            <h3 className="text-sm font-bold text-slate-900 mb-3">
              {editingItem ? 'Editar Jornada' : 'Nueva Jornada'}
            </h3>
            <form onSubmit={handleSaveJornada} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Código</label>
                <input
                  type="text"
                  required
                  value={jornadaForm.codigo}
                  onChange={(e) => setJornadaForm({ ...jornadaForm, codigo: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono uppercase"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nombre</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. MATUTINA, VESPERTINA, NOCTURNA"
                  value={jornadaForm.nombre}
                  onChange={(e) => setJornadaForm({ ...jornadaForm, nombre: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg uppercase"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Hora Inicio</label>
                  <input
                    type="time"
                    required
                    value={jornadaForm.hora_inicio}
                    onChange={(e) => setJornadaForm({ ...jornadaForm, hora_inicio: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Hora Fin</label>
                  <input
                    type="time"
                    required
                    value={jornadaForm.hora_fin}
                    onChange={(e) => setJornadaForm({ ...jornadaForm, hora_fin: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-3 py-1.5 text-xs font-bold text-white bg-[#0099e6] hover:bg-[#008bd1] rounded-lg"
                >
                  {isSaving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Hora */}
      {modalType === 'hora' && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 border border-slate-100 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900">
                {editingItem ? 'Editar Franja Horaria' : 'Nueva Franja Horaria'}
              </h3>
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {errorMessage && (
              <div className="p-2 mb-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
                {errorMessage}
              </div>
            )}
            <form onSubmit={handleSaveHora} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Código</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. H1, MAT-1, 07:00-08:00"
                  value={horaForm.codigo}
                  onChange={(e) => setHoraForm({ ...horaForm, codigo: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono uppercase focus:ring-2 focus:ring-[#0099e6]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nombre / Franja</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. 07:00 - 08:00 ó 1ra Hora"
                  value={horaForm.nombre}
                  onChange={(e) => setHoraForm({ ...horaForm, nombre: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0099e6]"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Hora Inicio</label>
                  <input
                    type="time"
                    required
                    value={horaForm.hora_inicio}
                    onChange={(e) => {
                      const newStart = e.target.value;
                      setHoraForm(prev => ({
                        ...prev,
                        hora_inicio: newStart,
                        nombre: prev.nombre.includes('-') || !prev.nombre ? `${newStart} - ${prev.hora_fin}` : prev.nombre
                      }));
                    }}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Hora Fin</label>
                  <input
                    type="time"
                    required
                    value={horaForm.hora_fin}
                    onChange={(e) => {
                      const newEnd = e.target.value;
                      setHoraForm(prev => ({
                        ...prev,
                        hora_fin: newEnd,
                        nombre: prev.nombre.includes('-') || !prev.nombre ? `${prev.hora_inicio} - ${newEnd}` : prev.nombre
                      }));
                    }}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-800"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Jornada / Turno</label>
                <select
                  value={horaForm.id_jornada || ''}
                  onChange={(e) => setHoraForm({ ...horaForm, id_jornada: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                >
                  {jornadas.map(j => (
                    <option key={j.id_jornada} value={j.id_jornada}>
                      {j.nombre} ({j.hora_inicio} - {j.hora_fin})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Orden</label>
                  <input
                    type="number"
                    min="1"
                    value={horaForm.orden}
                    onChange={(e) => setHoraForm({ ...horaForm, orden: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Estado</label>
                  <select
                    value={horaForm.estado}
                    onChange={(e) => setHoraForm({ ...horaForm, estado: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-bold"
                  >
                    <option value="ACTIVA">ACTIVA</option>
                    <option value="INACTIVA">INACTIVA</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-3 py-1.5 text-xs font-bold text-white bg-[#0099e6] hover:bg-[#008bd1] rounded-lg shadow-xs"
                >
                  {isSaving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 border border-slate-100 shadow-2xl">
            <AlertTriangle className="w-8 h-8 text-rose-600 mb-2" />
            <h3 className="text-sm font-bold text-slate-900">¿Confirmar eliminación?</h3>
            <p className="text-xs text-slate-500 mt-1">
              Esta acción no se puede deshacer si no existen asignaciones vinculadas.
            </p>
            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSaving}
                className="px-3 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg"
              >
                {isSaving ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
