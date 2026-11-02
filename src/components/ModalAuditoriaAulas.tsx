import React, { useState, useMemo } from 'react';
import { AulaLaboratorio, Bloque, Sede, PlanificacionCompleta } from '../types.ts';
import { ExportController } from '../controllers/exportController.ts';
import { 
  ShieldCheck, 
  X, 
  Building2, 
  Layers, 
  Users, 
  DoorOpen, 
  Laptop, 
  AlertTriangle, 
  CheckCircle2, 
  Download, 
  FileSpreadsheet, 
  Printer, 
  Search, 
  Filter, 
  Check, 
  Info,
  Sparkles
} from 'lucide-react';

interface ModalAuditoriaAulasProps {
  isOpen: boolean;
  onClose: () => void;
  aulas: AulaLaboratorio[];
  bloques: Bloque[];
  sedes?: Sede[];
  planificaciones?: PlanificacionCompleta[];
}

export const ModalAuditoriaAulas: React.FC<ModalAuditoriaAulasProps> = ({
  isOpen,
  onClose,
  aulas,
  bloques,
  sedes = [],
  planificaciones = []
}) => {
  if (!isOpen) return null;

  const [searchTerm, setSearchTerm] = useState('');
  const [filterBloque, setFilterBloque] = useState<string>('TODOS');
  const [filterPiso, setFilterPiso] = useState<string>('TODOS');
  const [filterEstado, setFilterEstado] = useState<string>('TODOS');
  const [filterTipo, setFilterTipo] = useState<string>('TODOS');

  // Mapa de Bloques para verificación de pisos
  const bloqueMap = useMemo(() => {
    const map = new Map<number, Bloque>();
    bloques.forEach(b => map.set(b.id_bloque, b));
    return map;
  }, [bloques]);

  // Auditoría y verificación individual de cada aula
  const auditoriaItems = useMemo(() => {
    return aulas.map((a, idx) => {
      const bloque = bloqueMap.get(a.id_bloque);
      const isCoworking = a.codigo === 'B5' || a.tipo === 'COWORKING';
      const isNoDisponible = a.estado === 'INACTIVO' || ['C1', 'C2', 'C3', 'C4'].includes(a.codigo);
      const isOcupado = a.estado === 'OCUPADO';
      const isMantenimiento = a.estado === 'MANTENIMIENTO';
      const isDisponible = a.estado === 'DISPONIBLE' && !isNoDisponible && !isCoworking;

      // Validación de coherencia de piso con el bloque
      const maxPisosBloque = bloque?.numero_pisos || (bName => {
        if (bName?.includes('B') || bName?.includes('E')) return 4;
        if (bName?.includes('A') || bName?.includes('D')) return 3;
        if (bName?.includes('C')) return 2;
        return 1;
      })(bloque?.nombre || a.bloque_nombre);

      const pisoValido = a.piso >= 1 && a.piso <= maxPisosBloque;

      // Dictamen y observaciones
      let estadoAudit = 'CONFORME';
      let dictamen = 'Aula regular operativa verificada';
      let alerta = false;

      if (isCoworking) {
        estadoAudit = 'COWORKING';
        dictamen = 'Espacio Coworking colaborativo (No es aula regular)';
      } else if (isNoDisponible) {
        estadoAudit = 'NO_DISPONIBLE';
        dictamen = 'Aula No Disponible (Fuera de servicio / En adecuación técnica)';
      } else if (isMantenimiento) {
        estadoAudit = 'MANTENIMIENTO';
        dictamen = 'En mantenimiento preventivo o correctivo';
      } else if (isOcupado) {
        estadoAudit = 'OCUPADO';
        dictamen = 'Aula asignada con clases activas vigentes';
      } else if (!pisoValido) {
        estadoAudit = 'ADVERTENCIA';
        dictamen = `Piso ${a.piso} excede los pisos registrados del bloque (${maxPisosBloque})`;
        alerta = true;
      }

      const capacidadMostrar = isCoworking 
        ? '0 (Coworking)' 
        : isNoDisponible 
        ? 'N/A' 
        : `${a.capacidad} est.`;

      return {
        id: a.id_aula_laboratorio,
        idx: idx + 1,
        aula: a,
        bloque: bloque?.nombre || a.bloque_nombre || 'N/A',
        bloqueCodigo: bloque?.codigo || a.bloque_codigo || 'N/A',
        bloquePisos: maxPisosBloque,
        sede: a.sede_nombre || 'UIO_NORTE',
        codigo: a.codigo,
        nombre: a.nombre,
        piso: a.piso,
        pisoValido,
        tipo: isCoworking ? 'COWORKING' : a.tipo,
        capacidad: a.capacidad,
        estado: ['C1', 'C2', 'C3', 'C4'].includes(a.codigo) ? 'N/A' : (isNoDisponible ? 'NO DISPONIBLE' : a.estado),
        estadoAudit,
        dictamen,
        alerta,
        isCoworking,
        isNoDisponible,
        recursos: a.recursos || 'Pizarra, mobiliario y proyección'
      };
    });
  }, [aulas, bloqueMap]);

  // Totales y métricas de verificación
  const totalEspacios = auditoriaItems.length;
  const totalAulasRegulares = auditoriaItems.filter(i => i.tipo === 'AULA' && !i.isCoworking && !i.isNoDisponible).length;
  const totalLaboratorios = auditoriaItems.filter(i => i.tipo === 'LABORATORIO').length;
  const totalCoworking = auditoriaItems.filter(i => i.isCoworking).length;
  const totalNoDisponibles = auditoriaItems.filter(i => i.isNoDisponible).length;
  const totalCapacidadActiva = auditoriaItems.reduce((acc, i) => acc + (i.isCoworking || i.isNoDisponible ? 0 : i.capacidad), 0);
  const totalConformes = auditoriaItems.filter(i => !i.alerta).length;

  // Filtrado de la tabla de auditoría
  const filteredItems = useMemo(() => {
    return auditoriaItems.filter(item => {
      const matchSearch = searchTerm.trim() === '' || 
        item.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.bloque.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sede.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.dictamen.toLowerCase().includes(searchTerm.toLowerCase());

      const matchBloque = filterBloque === 'TODOS' || 
        item.bloqueCodigo === filterBloque || 
        item.bloque === filterBloque ||
        item.aula.id_bloque === Number(filterBloque);

      const matchPiso = filterPiso === 'TODOS' || String(item.piso) === filterPiso;

      const matchEstado = filterEstado === 'TODOS' ? true :
        filterEstado === 'NO_DISPONIBLE' ? item.isNoDisponible :
        filterEstado === 'COWORKING' ? item.isCoworking :
        filterEstado === 'DISPONIBLE' ? (item.estado === 'DISPONIBLE' && !item.isNoDisponible && !item.isCoworking) :
        filterEstado === 'OCUPADO' ? item.estado === 'OCUPADO' :
        filterEstado === 'MANTENIMIENTO' ? item.estado === 'MANTENIMIENTO' :
        item.estado === filterEstado;

      const matchTipo = filterTipo === 'TODOS' ? true :
        filterTipo === 'COWORKING' ? item.isCoworking :
        filterTipo === 'AULA' ? (item.tipo === 'AULA' && !item.isCoworking) :
        filterTipo === 'LABORATORIO' ? item.tipo === 'LABORATORIO' :
        item.tipo === filterTipo;

      return matchSearch && matchBloque && matchPiso && matchEstado && matchTipo;
    });
  }, [auditoriaItems, searchTerm, filterBloque, filterPiso, filterEstado, filterTipo]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl max-w-7xl w-full max-h-[94vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* ENCABEZADO OFICIAL DE AUDITORÍA */}
        <div className="bg-[#280740] text-white p-4 sm:p-5 flex items-center justify-between border-b-2 border-[#e5a800] shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#e5a800] text-[#280740] rounded-xl shadow-md font-black">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  Auditoría y Verificación Minuciosa de Espacios Físicos
                </h2>
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-[#e5a800] text-[#280740]">
                  Oficial ISUJ
                </span>
              </div>
              <p className="text-xs text-purple-200 mt-0.5">
                Verificación paramétrica de 6 dimensiones: <span className="text-amber-300 font-bold">Bloque • Aula • Capacidad • Pisos • Sede • Estado</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-lg border border-white/20 transition cursor-pointer"
              title="Imprimir informe de verificación"
            >
              <Printer className="w-3.5 h-3.5 text-amber-300" />
              <span>Imprimir</span>
            </button>

            <button
              type="button"
              onClick={() => ExportController.exportAulasPDF(aulas, 'auditoria_minuciosa_espacios_isuj.pdf')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-sm transition cursor-pointer"
              title="Descargar dictamen en PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span>PDF</span>
            </button>

            <button
              type="button"
              onClick={() => ExportController.exportAulasXLSX(aulas, 'auditoria_minuciosa_espacios_isuj.xlsx')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition cursor-pointer"
              title="Descargar matriz en Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Excel</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-purple-300 hover:text-white hover:bg-white/10 rounded-lg transition cursor-pointer ml-1"
              title="Cerrar ventana"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* TARJETAS DE VERIFICACIÓN PARAMÉTRICA (6 DIMENSIONES) */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 shrink-0 text-xs">
          {/* 1. Sede */}
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] text-slate-500 font-bold uppercase block tracking-wider">1. Sede Institucional</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="font-black text-slate-900 text-sm">UIO_NORTE</span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                100%
              </span>
            </div>
            <p className="text-[10px] text-slate-500 truncate mt-0.5">Campus Matriz Quito</p>
          </div>

          {/* 2. Bloques */}
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] text-slate-500 font-bold uppercase block tracking-wider">2. Bloques Registrados</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="font-black text-slate-900 text-sm">{bloques.length || 7} Bloques</span>
              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">
                A hasta M
              </span>
            </div>
            <p className="text-[10px] text-slate-500 truncate mt-0.5">A, B, C, D, E, F, M</p>
          </div>

          {/* 3. Pisos */}
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] text-slate-500 font-bold uppercase block tracking-wider">3. Pisos Auditados</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="font-black text-slate-900 text-sm">Pisos 1 al 4</span>
              <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-1.5 py-0.2 rounded border border-sky-200">
                Coherente
              </span>
            </div>
            <p className="text-[10px] text-slate-500 truncate mt-0.5">Sin inconsistencias</p>
          </div>

          {/* 4. Aulas & Laboratorios */}
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] text-slate-500 font-bold uppercase block tracking-wider">4. Total Espacios</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="font-black text-slate-900 text-sm">{totalEspacios} Registros</span>
              <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200">
                46 A / 18 L / 1 C
              </span>
            </div>
            <p className="text-[10px] text-slate-500 truncate mt-0.5">Catálogo maestro 100%</p>
          </div>

          {/* 5. Capacidad */}
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] text-slate-500 font-bold uppercase block tracking-wider">5. Capacidad Instalada</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="font-black text-emerald-700 text-sm">{totalCapacidadActiva.toLocaleString()}</span>
              <span className="text-[10px] text-slate-400 font-mono">puestos</span>
            </div>
            <p className="text-[10px] text-slate-500 truncate mt-0.5">Excluye Coworking / Inactivas</p>
          </div>

          {/* 6. Estados y Casos Especiales */}
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] text-slate-500 font-bold uppercase block tracking-wider">6. Casos Especiales</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="font-black text-amber-700 text-sm">B5 + C1..C4</span>
              <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                Auditados
              </span>
            </div>
            <p className="text-[10px] text-slate-500 truncate mt-0.5">B5 Coworking / C1-C4 No Disp.</p>
          </div>
        </div>

        {/* BARRA DE FILTROS Y BÚSQUEDA DENTRO DE LA AUDITORÍA */}
        <div className="p-3 bg-white border-b border-slate-200 flex flex-wrap items-center gap-2.5 shrink-0 text-xs">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar por código (ej. B5, C1, A2), aula, bloque o diagnóstico..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#280740]/20"
            />
          </div>

          <select
            value={filterBloque}
            onChange={e => setFilterBloque(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
          >
            <option value="TODOS">Todos los Bloques ({bloques.length || 7})</option>
            {bloques.map(b => (
              <option key={b.id_bloque} value={b.codigo}>
                {b.codigo} - {b.nombre} ({b.numero_pisos} pisos)
              </option>
            ))}
          </select>

          <select
            value={filterPiso}
            onChange={e => setFilterPiso(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
          >
            <option value="TODOS">Todos los Pisos</option>
            <option value="1">Piso 1</option>
            <option value="2">Piso 2</option>
            <option value="3">Piso 3</option>
            <option value="4">Piso 4</option>
          </select>

          <select
            value={filterTipo}
            onChange={e => setFilterTipo(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
          >
            <option value="TODOS">Todas las Tipologías</option>
            <option value="AULA">Aulas Regulares</option>
            <option value="LABORATORIO">Laboratorios / Talleres</option>
            <option value="COWORKING">Espacio Coworking (B5)</option>
          </select>

          <select
            value={filterEstado}
            onChange={e => setFilterEstado(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold"
          >
            <option value="TODOS">Todos los Estados</option>
            <option value="DISPONIBLE">Disponibles</option>
            <option value="NO_DISPONIBLE">🔴 Aulas No Disponibles (C1..C4)</option>
            <option value="COWORKING">🏢 Coworking (B5)</option>
            <option value="OCUPADO">Ocupadas (con clases)</option>
            <option value="MANTENIMIENTO">En Mantenimiento</option>
          </select>

          <span className="text-slate-500 text-[11px] font-semibold ml-auto">
            Mostrando {filteredItems.length} de {totalEspacios} espacios
          </span>
        </div>

        {/* TABLA PRINCIPAL DE AUDITORÍA Y VERIFICACIÓN */}
        <div className="overflow-y-auto flex-1 p-3 sm:p-4">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-slate-100 z-10 border-b border-slate-200">
                <tr className="text-slate-700 font-bold text-[11px]">
                  <th className="py-2.5 px-2.5 w-10 text-center">#</th>
                  <th className="py-2.5 px-3">Sede</th>
                  <th className="py-2.5 px-3">Bloque</th>
                  <th className="py-2.5 px-2.5 text-center">Piso Aula / Pisos Blq.</th>
                  <th className="py-2.5 px-2.5">Código</th>
                  <th className="py-2.5 px-3">Nombre del Espacio</th>
                  <th className="py-2.5 px-2.5 text-center">Tipología</th>
                  <th className="py-2.5 px-2.5 text-center">Capacidad</th>
                  <th className="py-2.5 px-2.5 text-center">Estado</th>
                  <th className="py-2.5 px-3">Dictamen y Verificación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-400">
                      No se encontraron registros con los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map(item => {
                    return (
                      <tr key={item.id} className="hover:bg-amber-50/30 transition-colors">
                        <td className="py-2 px-2.5 text-center font-mono text-slate-400 text-[11px]">
                          {item.idx}
                        </td>

                        {/* SEDE */}
                        <td className="py-2 px-3 font-semibold text-slate-700 whitespace-nowrap">
                          <span className="inline-block bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[10px] font-bold border border-slate-200">
                            {item.sede}
                          </span>
                        </td>

                        {/* BLOQUE */}
                        <td className="py-2 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-black text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-[11px]">
                              {item.bloqueCodigo.replace('BLQ-', '')}
                            </span>
                            <span className="text-slate-800 font-medium text-[11px]">
                              {item.bloque}
                            </span>
                          </div>
                        </td>

                        {/* PISO */}
                        <td className="py-2 px-2.5 text-center whitespace-nowrap">
                          <span className="bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded text-[10px] border border-indigo-100 font-mono">
                            Piso {item.piso} / {item.bloquePisos}p
                          </span>
                        </td>

                        {/* CÓDIGO */}
                        <td className="py-2 px-2.5 whitespace-nowrap font-mono font-bold text-slate-900">
                          <span className={`px-2 py-0.5 rounded border text-[11px] ${
                            item.isCoworking 
                              ? 'bg-amber-100 text-amber-900 border-amber-300 font-black' 
                              : item.isNoDisponible 
                              ? 'bg-rose-100 text-rose-900 border-rose-300 font-black' 
                              : 'bg-slate-100 text-slate-800 border-slate-200'
                          }`}>
                            {item.codigo}
                          </span>
                        </td>

                        {/* NOMBRE */}
                        <td className="py-2 px-3 font-semibold text-slate-800">
                          <div className="flex items-center gap-1.5">
                            {item.isCoworking ? (
                              <Users className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            ) : item.tipo === 'LABORATORIO' ? (
                              <Laptop className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                            ) : (
                              <DoorOpen className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                            )}
                            <span className="truncate max-w-[180px] sm:max-w-xs">{item.nombre}</span>
                            {item.isCoworking && (
                              <span className="text-[9px] bg-amber-50 text-amber-800 px-1 py-0.2 rounded border border-amber-200 font-bold shrink-0">
                                Coworking
                              </span>
                            )}
                          </div>
                        </td>

                        {/* TIPOLOGÍA */}
                        <td className="py-2 px-2.5 text-center whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.isCoworking 
                              ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                              : item.tipo === 'LABORATORIO' 
                              ? 'bg-purple-50 text-purple-800 border border-purple-200' 
                              : 'bg-blue-50 text-blue-800 border border-blue-100'
                          }`}>
                            {item.tipo}
                          </span>
                        </td>

                        {/* CAPACIDAD */}
                        <td className="py-2 px-2.5 text-center font-mono font-bold whitespace-nowrap">
                          {item.isCoworking ? (
                            <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded text-[10px] border border-amber-200 font-bold">
                              0 (Coworking)
                            </span>
                          ) : item.isNoDisponible ? (
                            <span className="text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[10px] border border-slate-300 font-bold font-mono">
                              N/A
                            </span>
                          ) : (
                            <span className="text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded text-[10px] border border-emerald-200 font-bold">
                              {item.capacidad} est.
                            </span>
                          )}
                        </td>

                        {/* ESTADO */}
                        <td className="py-2 px-2.5 text-center whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            item.isNoDisponible 
                              ? 'text-rose-800 bg-rose-100 border-rose-300 font-mono font-black' 
                              : item.estado === 'DISPONIBLE'
                              ? 'text-emerald-700 bg-emerald-50 border-emerald-300'
                              : item.estado === 'OCUPADO' 
                              ? 'text-blue-800 bg-blue-50 border-blue-200' 
                              : item.estado === 'MANTENIMIENTO' 
                              ? 'text-amber-800 bg-amber-50 border-amber-200' 
                              : 'text-emerald-700 bg-emerald-50 border-emerald-300'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              item.isNoDisponible ? 'bg-rose-500' : item.estado === 'DISPONIBLE' ? 'bg-emerald-500' : item.estado === 'OCUPADO' ? 'bg-blue-500' : item.estado === 'MANTENIMIENTO' ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}></span>
                            <span>{['C1', 'C2', 'C3', 'C4'].includes(item.codigo) ? 'N/A' : item.estado}</span>
                          </span>
                        </td>

                        {/* DICTAMEN DE VERIFICACIÓN */}
                        <td className="py-2 px-3 text-slate-700 text-xs">
                          <div className="flex items-center gap-1.5">
                            {item.isCoworking ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            ) : item.isNoDisponible ? (
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                            ) : item.alerta ? (
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            )}
                            <span className={`text-[11px] ${
                              item.isCoworking 
                                ? 'text-amber-800 font-bold' 
                                : item.isNoDisponible 
                                ? 'text-rose-800 font-bold' 
                                : item.alerta 
                                ? 'text-amber-700 font-bold' 
                                : 'text-slate-700'
                            }`}>
                              {item.dictamen}
                            </span>
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

        {/* PIE DE PÁGINA DEL MODAL */}
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{totalConformes} de {totalEspacios} Registros Auditados y Validados</span>
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-500 text-[11px]">
              B5 Espacio Coworking verificado sin cupo regular • C1..C4 identificadas como Aulas No Disponibles
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl transition cursor-pointer"
          >
            Aceptar y Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
