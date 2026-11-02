import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Folder,
  Shield,
  Lock,
  FolderTree,
  Plus,
  RotateCcw,
  Check,
  Building2,
  School,
  GraduationCap,
  DoorOpen,
  Boxes,
  Layers,
  Search,
  CheckCircle2,
  X,
  Sparkles,
  Filter,
  CheckSquare,
  Square
} from 'lucide-react';
import { RoleType, SeguridadUser, GrupoSeguridad } from '../../types.ts';
import { useAuth } from '../../controllers/authContext.tsx';

export type ApartadoAcademico =
  | 'TODOS'
  | 'SEDE'
  | 'ESCUELA'
  | 'CARRERA'
  | 'AULA'
  | 'BLOQUE';

interface AsignacionItem {
  id_asignacion: number;
  rol_codigo: string;
  grupo_nombre: string;
  apartado: ApartadoAcademico;
  id_entidad: number;
  codigo_entidad?: string;
  nombre_entidad: string;
  crear: number;
  leer: number;
  actualizar: number;
  eliminar: number;
  fecha_actualizacion?: string;
}

interface AsignacionAcademicoViewProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  usuarios?: SeguridadUser[];
  roles?: any[];
  grupos?: GrupoSeguridad[];
}

export const AsignacionAcademicoView: React.FC<AsignacionAcademicoViewProps> = ({
  activeTab = 'asignacion_academico',
  onTabChange,
  usuarios = [],
  roles = [],
  grupos = []
}) => {
  const { user } = useAuth();
  const canEdit = user?.rol === 'SUPERADMIN' || user?.rol === 'ADMINISTRADOR';

  // Filtros principales (idénticos a la imagen)
  const [selectedRol, setSelectedRol] = useState<string>('SUPERADMIN');
  const [selectedGrupo, setSelectedGrupo] = useState<string>('Administra TI');
  
  // Apartados académicos
  const [activeApartado, setActiveApartado] = useState<ApartadoAcademico>('SEDE');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Lista de datos
  const [items, setItems] = useState<AsignacionItem[]>([]);
  const [counts, setCounts] = useState({
    sedes: 0,
    escuelas: 0,
    carreras: 0,
    aulas: 0,
    bloques: 0
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Modal Nueva Asignación
  const [showNewModal, setShowNewModal] = useState<boolean>(false);
  const [newApartado, setNewApartado] = useState<ApartadoAcademico>('SEDE');
  const [newNombre, setNewNombre] = useState<string>('');
  const [newCodigo, setNewCodigo] = useState<string>('');
  const [newPerms, setNewPerms] = useState({
    crear: true,
    leer: true,
    actualizar: true,
    eliminar: false
  });

  // Lista canónica de roles y grupos para los selectores
  const listaRoles = [
    { codigo: 'SUPERADMIN', label: 'Superadmin' },
    { codigo: 'ADMINISTRADOR', label: 'Administrador' },
    { codigo: 'COORDINADOR', label: 'Coordinador' },
    { codigo: 'DOCENTE', label: 'Docente' },
    { codigo: 'OPERADOR', label: 'Operador' },
    { codigo: 'AUDITOR', label: 'Auditor' },
    { codigo: 'CONDULTA', label: 'Consulta' }
  ];

  const listaGrupos = useMemo(() => {
    if (grupos && grupos.length > 0) {
      return grupos.map(g => g.nombre);
    }
    return [
      'Administra TI',
      'Coordinaciones',
      'Vicerrectorado',
      'Dirección Académica',
      'Docentes Titulares',
      'Docentes Ocasionales',
      'Auditoría',
      'Invitados'
    ];
  }, [grupos]);

  // Cargar asignaciones desde API
  const fetchAsignaciones = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/seguridad/asignacion-academica?rol=${encodeURIComponent(selectedRol)}&grupo=${encodeURIComponent(selectedGrupo)}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setItems(data.data);
        if (data.counts) {
          setCounts(data.counts);
        }
      }
    } catch (err) {
      console.error('Error fetching academic assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAsignaciones();
  }, [selectedRol, selectedGrupo]);

  // Conmutar un permiso en tiempo real
  const handleToggle = async (id_asignacion: number, campo: 'crear' | 'leer' | 'actualizar' | 'eliminar', entidadNombre: string) => {
    if (!canEdit) {
      setNotification('Solo usuarios con perfil SUPERADMIN o ADMINISTRADOR pueden modificar asignaciones.');
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    // Actualización optimista inmediata
    setItems(prev => prev.map(item => {
      if (item.id_asignacion === id_asignacion) {
        return {
          ...item,
          [campo]: item[campo] === 1 ? 0 : 1
        };
      }
      return item;
    }));

    try {
      const res = await fetch('/api/seguridad/asignacion-academica/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_asignacion, campo })
      });
      const result = await res.json();
      if (result.success && result.data) {
        setItems(prev => prev.map(item => item.id_asignacion === id_asignacion ? result.data : item));
        setNotification(`Permiso '${campo.toUpperCase()}' actualizado en '${entidadNombre}' para ${selectedRol}.`);
        setTimeout(() => setNotification(null), 2500);
      }
    } catch (err) {
      console.error('Error toggling assignment permission:', err);
      // Revertir si falló
      fetchAsignaciones();
    }
  };

  // Crear nueva asignación
  const handleCreateNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNombre.trim()) return;

    try {
      const res = await fetch('/api/seguridad/asignacion-academica/nueva', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rol_codigo: selectedRol,
          grupo_nombre: selectedGrupo,
          apartado: newApartado,
          codigo_entidad: newCodigo.trim(),
          nombre_entidad: newNombre.trim(),
          crear: newPerms.crear,
          leer: newPerms.leer,
          actualizar: newPerms.actualizar,
          eliminar: newPerms.eliminar
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowNewModal(false);
        setNewNombre('');
        setNewCodigo('');
        fetchAsignaciones();
        setNotification(`Nueva asignación académica registrada con éxito.`);
        setTimeout(() => setNotification(null), 3000);
      }
    } catch (err) {
      console.error('Error creating assignment:', err);
    }
  };

  // Restablecer valores
  const handleReset = async () => {
    if (!window.confirm(`¿Restablecer las asignaciones académicas por defecto para el rol ${selectedRol} y grupo ${selectedGrupo}?`)) return;
    try {
      await fetch('/api/seguridad/asignacion-academica/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rol: selectedRol, grupo: selectedGrupo })
      });
      fetchAsignaciones();
      setNotification(`Asignaciones académicas restablecidas correctamente.`);
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      console.error('Error resetting assignments:', err);
    }
  };

  // Marcar/desmarcar todos los de una columna en el apartado actual
  const handleBatchColumn = async (campo: 'crear' | 'leer' | 'actualizar' | 'eliminar', valor: boolean) => {
    const currentFiltered = filteredItems;
    if (currentFiltered.length === 0) return;

    setItems(prev => prev.map(item => {
      const inFiltered = currentFiltered.some(f => f.id_asignacion === item.id_asignacion);
      if (inFiltered) {
        return { ...item, [campo]: valor ? 1 : 0 };
      }
      return item;
    }));

    for (const item of currentFiltered) {
      fetch('/api/seguridad/asignacion-academica/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_asignacion: item.id_asignacion, campo, valor })
      }).catch(console.error);
    }

    setNotification(`Columna '${campo.toUpperCase()}' ${valor ? 'activada' : 'desactivada'} para todos los elementos visibles.`);
    setTimeout(() => setNotification(null), 2500);
  };

  // Filtrado de elementos por apartado y búsqueda
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchApartado = activeApartado === 'TODOS' || item.apartado === activeApartado;
      const matchSearch = !searchTerm.trim() || 
        item.nombre_entidad.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.codigo_entidad && item.codigo_entidad.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchApartado && matchSearch;
    });
  }, [items, activeApartado, searchTerm]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-6 space-y-5 animate-in fade-in duration-200">
      
      {/* 1. Barra Superior de Pestañas: Usuarios | Grupos | Roles | Permisos | Árbol | Asignación Académico */}
      <div className="flex items-center gap-6 sm:gap-8 border-b border-slate-200 text-sm font-medium overflow-x-auto">
        <button
          type="button"
          onClick={() => onTabChange && onTabChange('usuarios')}
          className="flex items-center gap-2 pb-3 text-slate-600 hover:text-slate-900 transition cursor-pointer shrink-0"
        >
          <Users className="w-4 h-4 text-slate-500" />
          <span>Usuarios</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange && onTabChange('grupos')}
          className="flex items-center gap-2 pb-3 text-slate-600 hover:text-slate-900 transition cursor-pointer shrink-0"
        >
          <Folder className="w-4 h-4 text-slate-500" />
          <span>Grupos</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange && onTabChange('roles')}
          className="flex items-center gap-2 pb-3 text-slate-600 hover:text-slate-900 transition cursor-pointer shrink-0"
        >
          <Shield className="w-4 h-4 text-slate-500" />
          <span>Roles</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange && onTabChange('gestion_permisos')}
          className="flex items-center gap-2 pb-3 text-slate-600 hover:text-slate-900 transition cursor-pointer shrink-0"
        >
          <Lock className="w-4 h-4 text-slate-500" />
          <span>Permisos</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange && onTabChange('asignacion_arbol')}
          className="flex items-center gap-2 pb-3 text-slate-600 hover:text-slate-900 transition cursor-pointer shrink-0"
        >
          <FolderTree className="w-4 h-4 text-slate-500" />
          <span>Árbol de Asignación</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange && onTabChange('asignacion_academico')}
          className="flex items-center gap-2 pb-3 text-blue-600 border-b-2 border-blue-600 font-semibold transition cursor-pointer shrink-0"
        >
          <GraduationCap className="w-4 h-4 text-blue-600" />
          <span>Asignación Académico</span>
        </button>
      </div>

      {/* 2. Barra de Filtros y Acción: Rol, Grupo, Búsqueda y Botón "+ Nueva asignación" - Idéntica a la imagen */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-1">
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          {/* Selector de Rol */}
          <div className="flex items-center gap-2.5">
            <label htmlFor="select-rol-acad" className="text-sm font-medium text-slate-700">
              Rol
            </label>
            <select
              id="select-rol-acad"
              value={selectedRol}
              onChange={(e) => setSelectedRol(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-800 shadow-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer min-w-[150px]"
            >
              {listaRoles.map(r => (
                <option key={r.codigo} value={r.codigo}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* Selector de Grupo */}
          <div className="flex items-center gap-2.5">
            <label htmlFor="select-grupo-acad" className="text-sm font-medium text-slate-700">
              Grupo
            </label>
            <select
              id="select-grupo-acad"
              value={selectedGrupo}
              onChange={(e) => {
                const nuevoGrupo = e.target.value;
                setSelectedGrupo(nuevoGrupo);
                if (nuevoGrupo.includes('TI')) setSelectedRol('SUPERADMIN');
                else if (nuevoGrupo.includes('Vicerrectorado')) setSelectedRol('ADMINISTRADOR');
                else if (nuevoGrupo.includes('Coordinacion') || nuevoGrupo.includes('Dirección')) setSelectedRol('COORDINADOR');
                else if (nuevoGrupo.includes('Docente')) setSelectedRol('DOCENTE');
                else if (nuevoGrupo.includes('Auditor')) setSelectedRol('AUDITOR');
                else if (nuevoGrupo.includes('Invitado')) setSelectedRol('CONDULTA');
              }}
              className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-800 shadow-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer min-w-[210px]"
            >
              {listaGrupos.map((nombre) => (
                <option key={nombre} value={nombre}>
                  {nombre}
                </option>
              ))}
            </select>
          </div>

            {/* Buscador de entidad */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar sede, escuela, carrera, aula, bloque..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Botón "+ Nueva asignación" y Reset */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowNewModal(true)}
            className="border border-blue-500 text-blue-600 hover:bg-blue-50/80 px-4 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Nueva asignación</span>
          </button>

          <button
            type="button"
            onClick={handleReset}
            title="Restablecer asignaciones por defecto"
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3. Submenú / Apartados Académicos: Sede, Escuela, Carrera, Aulas, Bloque, Todas las Entidades */}
      <div className="bg-slate-50 p-1.5 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'SEDE' as ApartadoAcademico, label: 'Sede', icon: Building2, count: counts.sedes },
            { id: 'ESCUELA' as ApartadoAcademico, label: 'Escuela', icon: School, count: counts.escuelas },
            { id: 'CARRERA' as ApartadoAcademico, label: 'Carrera', icon: GraduationCap, count: counts.carreras },
            { id: 'AULA' as ApartadoAcademico, label: 'Aulas', icon: DoorOpen, count: counts.aulas },
            { id: 'BLOQUE' as ApartadoAcademico, label: 'Bloque', icon: Boxes, count: counts.bloques },
            { id: 'TODOS' as ApartadoAcademico, label: 'Todas las Entidades', icon: Layers, count: items.length },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeApartado === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveApartado(tab.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  isActive
                    ? tab.id === 'TODOS'
                      ? 'bg-slate-800 text-white shadow-xs'
                      : 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-white hover:text-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isActive
                    ? tab.id === 'TODOS'
                      ? 'bg-slate-700 text-slate-100'
                      : 'bg-blue-800 text-blue-100'
                    : 'bg-slate-200 text-slate-700'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Acciones en lote para la vista actual */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <span className="text-[11px] font-medium hidden sm:inline">Acción rápida:</span>
          <button
            type="button"
            onClick={() => {
              ['crear', 'leer', 'actualizar', 'eliminar'].forEach((campo: any) => handleBatchColumn(campo, true));
            }}
            className="px-2 py-0.5 bg-white hover:bg-blue-50 hover:text-blue-700 border border-slate-300 rounded text-[11px] font-semibold transition cursor-pointer"
            title="Conceder todos los permisos en el apartado visible"
          >
            Marcar todo
          </button>
          <button
            type="button"
            onClick={() => {
              ['crear', 'leer', 'actualizar', 'eliminar'].forEach((campo: any) => handleBatchColumn(campo, false));
            }}
            className="px-2 py-0.5 bg-white hover:bg-rose-50 hover:text-rose-700 border border-slate-300 rounded text-[11px] font-semibold transition cursor-pointer"
            title="Quitar todos los permisos en el apartado visible"
          >
            Desmarcar todo
          </button>
        </div>
      </div>

      {/* Mensaje de Notificación */}
      {notification && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-xs font-semibold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-blue-400 hover:text-blue-700 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 4. Tabla de Permisos CRUD Académicos (Módulo/Entidad | Crear | Leer | Actualizar | Eliminar) */}
      <div className="border-t border-slate-200 overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[650px]">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 text-sm font-medium">
              <th className="py-3.5 pr-6 w-1/3 text-slate-600">
                {activeApartado === 'SEDE' && 'Sede Institucional'}
                {activeApartado === 'ESCUELA' && 'Escuela / Facultad'}
                {activeApartado === 'CARRERA' && 'Carrera Académica'}
                {activeApartado === 'AULA' && 'Aula o Laboratorio'}
                {activeApartado === 'BLOQUE' && 'Bloque / Pabellón'}
                {activeApartado === 'TODOS' && 'Entidad Académica'}
              </th>
              
              <th className="py-3.5 px-4 text-center w-1/6 font-medium text-slate-600">
                <div className="flex items-center justify-center gap-1">
                  <span>Crear</span>
                  <button
                    type="button"
                    onClick={() => handleBatchColumn('crear', true)}
                    className="text-slate-400 hover:text-blue-600 cursor-pointer"
                    title="Marcar todos Crear"
                  >
                    <CheckSquare className="w-3 h-3" />
                  </button>
                </div>
              </th>

              <th className="py-3.5 px-4 text-center w-1/6 font-medium text-slate-600">
                <div className="flex items-center justify-center gap-1">
                  <span>Leer</span>
                  <button
                    type="button"
                    onClick={() => handleBatchColumn('leer', true)}
                    className="text-slate-400 hover:text-blue-600 cursor-pointer"
                    title="Marcar todos Leer"
                  >
                    <CheckSquare className="w-3 h-3" />
                  </button>
                </div>
              </th>

              <th className="py-3.5 px-4 text-center w-1/6 font-medium text-slate-600">
                <div className="flex items-center justify-center gap-1">
                  <span>Actualizar</span>
                  <button
                    type="button"
                    onClick={() => handleBatchColumn('actualizar', true)}
                    className="text-slate-400 hover:text-blue-600 cursor-pointer"
                    title="Marcar todos Actualizar"
                  >
                    <CheckSquare className="w-3 h-3" />
                  </button>
                </div>
              </th>

              <th className="py-3.5 px-4 text-center w-1/6 font-medium text-slate-600">
                <div className="flex items-center justify-center gap-1">
                  <span>Eliminar</span>
                  <button
                    type="button"
                    onClick={() => handleBatchColumn('eliminar', true)}
                    className="text-slate-400 hover:text-blue-600 cursor-pointer"
                    title="Marcar todos Eliminar"
                  >
                    <CheckSquare className="w-3 h-3" />
                  </button>
                </div>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-sm text-slate-400">
                  Cargando asignaciones académicas...
                </td>
              </tr>
            ) : filteredItems.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-sm text-slate-400">
                  No se encontraron asignaciones en el apartado <strong>{activeApartado}</strong>
                  {searchTerm && ` con el término "${searchTerm}"`}.
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => {
                return (
                  <tr key={item.id_asignacion} className="hover:bg-slate-50/60 transition-colors">
                    {/* Nombre de la Entidad Académica con su icono correspondiente */}
                    <td className="py-4 pr-6 text-sm">
                      <div className="flex items-center gap-2">
                        {item.apartado === 'SEDE' && <Building2 className="w-4 h-4 text-blue-600 shrink-0" />}
                        {item.apartado === 'ESCUELA' && <School className="w-4 h-4 text-emerald-600 shrink-0" />}
                        {item.apartado === 'CARRERA' && <GraduationCap className="w-4 h-4 text-purple-600 shrink-0" />}
                        {item.apartado === 'AULA' && <DoorOpen className="w-4 h-4 text-amber-600 shrink-0" />}
                        {item.apartado === 'BLOQUE' && <Boxes className="w-4 h-4 text-indigo-600 shrink-0" />}

                        <div className="min-w-0">
                          <span className="font-bold text-slate-900 block truncate">
                            {item.nombre_entidad}
                          </span>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                            {item.codigo_entidad && (
                              <span>Código: {item.codigo_entidad}</span>
                            )}
                            {activeApartado === 'TODOS' && (
                              <span className="text-blue-600 font-sans font-semibold">[{item.apartado}]</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Checkbox Crear */}
                    <td className="py-4 px-4 text-center">
                      <button
                        type="button"
                        aria-label={`Permiso Crear en ${item.nombre_entidad}`}
                        onClick={() => handleToggle(item.id_asignacion, 'crear', item.nombre_entidad)}
                        className={`w-5 h-5 rounded flex items-center justify-center transition cursor-pointer mx-auto shadow-2xs ${
                          item.crear === 1
                            ? 'bg-blue-600 border border-blue-600 text-white'
                            : 'bg-white border-2 border-slate-300 hover:border-blue-400 text-transparent'
                        }`}
                      >
                        {item.crear === 1 && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>
                    </td>

                    {/* Checkbox Leer */}
                    <td className="py-4 px-4 text-center">
                      <button
                        type="button"
                        aria-label={`Permiso Leer en ${item.nombre_entidad}`}
                        onClick={() => handleToggle(item.id_asignacion, 'leer', item.nombre_entidad)}
                        className={`w-5 h-5 rounded flex items-center justify-center transition cursor-pointer mx-auto shadow-2xs ${
                          item.leer === 1
                            ? 'bg-blue-600 border border-blue-600 text-white'
                            : 'bg-white border-2 border-slate-300 hover:border-blue-400 text-transparent'
                        }`}
                      >
                        {item.leer === 1 && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>
                    </td>

                    {/* Checkbox Actualizar */}
                    <td className="py-4 px-4 text-center">
                      <button
                        type="button"
                        aria-label={`Permiso Actualizar en ${item.nombre_entidad}`}
                        onClick={() => handleToggle(item.id_asignacion, 'actualizar', item.nombre_entidad)}
                        className={`w-5 h-5 rounded flex items-center justify-center transition cursor-pointer mx-auto shadow-2xs ${
                          item.actualizar === 1
                            ? 'bg-blue-600 border border-blue-600 text-white'
                            : 'bg-white border-2 border-slate-300 hover:border-blue-400 text-transparent'
                        }`}
                      >
                        {item.actualizar === 1 && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>
                    </td>

                    {/* Checkbox Eliminar */}
                    <td className="py-4 px-4 text-center">
                      <button
                        type="button"
                        aria-label={`Permiso Eliminar en ${item.nombre_entidad}`}
                        onClick={() => handleToggle(item.id_asignacion, 'eliminar', item.nombre_entidad)}
                        className={`w-5 h-5 rounded flex items-center justify-center transition cursor-pointer mx-auto shadow-2xs ${
                          item.eliminar === 1
                            ? 'bg-blue-600 border border-blue-600 text-white'
                            : 'bg-white border-2 border-slate-300 hover:border-blue-400 text-transparent'
                        }`}
                      >
                        {item.eliminar === 1 && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 5. Pie de Página Informativo (idéntico a la imagen) */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <span className="text-blue-600 font-bold">ℹ️</span>
          <span>
            Los cambios en las asignaciones académicas se aplican en tiempo real para el rol seleccionado (<strong>{selectedRol}</strong>) y grupo (<strong>{selectedGrupo}</strong>).
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 font-semibold text-slate-600 text-xs">
          <span>{counts.sedes} Sede</span>
          <span>·</span>
          <span>{counts.escuelas} Escuela</span>
          <span>·</span>
          <span>{counts.carreras} Carreras</span>
          <span>·</span>
          <span>{counts.aulas} Aulas</span>
          <span>·</span>
          <span>{counts.bloques} Bloques</span>
        </div>
      </div>

      {/* Modal "+ Nueva Asignación" */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-base">Nueva Asignación Académica</h3>
              </div>
              <button
                onClick={() => setShowNewModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNew} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Apartado Académico
                </label>
                <select
                  value={newApartado}
                  onChange={(e) => setNewApartado(e.target.value as any)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold text-slate-800"
                >
                  <option value="SEDE">🏛️ Sede</option>
                  <option value="ESCUELA">🏫 Escuela</option>
                  <option value="CARRERA">🎓 Carrera</option>
                  <option value="AULA">🚪 Aula / Laboratorio</option>
                  <option value="BLOQUE">🏢 Bloque / Pabellón</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nombre de la Entidad
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Campus Norte, Carrera de Robótica, Aula 302..."
                  value={newNombre}
                  onChange={(e) => setNewNombre(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Código (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej. SEDE-02, ESC-03, A-302..."
                  value={newCodigo}
                  onChange={(e) => setNewCodigo(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Permisos Iniciales para {selectedRol}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'crear', label: 'Crear' },
                    { key: 'leer', label: 'Leer' },
                    { key: 'actualizar', label: 'Actualizar' },
                    { key: 'eliminar', label: 'Eliminar' }
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer text-xs font-bold text-slate-800 hover:bg-blue-50">
                      <input
                        type="checkbox"
                        checked={(newPerms as any)[key]}
                        onChange={(e) => setNewPerms(prev => ({ ...prev, [key]: e.target.checked }))}
                        className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 shadow-sm cursor-pointer"
                >
                  Guardar Asignación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
