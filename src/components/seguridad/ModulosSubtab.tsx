import React, { useState, useMemo } from 'react';
import {
  Layers,
  LayoutDashboard,
  ShieldCheck,
  GraduationCap,
  CalendarCheck,
  Clock,
  Building2,
  BarChart3,
  FileText,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Eye,
  Key,
  Users,
  Lock,
  ArrowRight,
  ExternalLink,
  ShieldAlert,
  ChevronRight
} from 'lucide-react';
import { INSTITUTIONAL_RBAC_MATRIX, RoleType, SystemModule, SeguridadUser, GRUPOS_CANONICOS } from '../../types.ts';
import { RolItem } from '../../views/SeguridadView.tsx';

interface ModulosSubtabProps {
  roles: RolItem[];
  usuarios: SeguridadUser[];
  onNavigateToPermisos?: (roleName?: string) => void;
  onNavigateToFlujo?: () => void;
}

interface ModuloInfo {
  id: SystemModule;
  codigo: string;
  nombre: string;
  categoria: 'Gobernanza' | 'Gestión Académica' | 'Infraestructura' | 'Inteligencia & Control';
  descripcion: string;
  icono: any;
  subfunciones: string[];
}

export const MODULOS_CATALOGO: ModuloInfo[] = [
  {
    id: 'dashboard',
    codigo: 'MOD-01',
    nombre: 'Dashboard Institucional',
    categoria: 'Inteligencia & Control',
    descripcion: 'Métricas ejecutivas de ocupación de campus, resumen de carga docente, semáforo de espacios y KPIs institucionales.',
    icono: LayoutDashboard,
    subfunciones: ['Resumen ejecutivo', 'Ocupación de aulas', 'Horas dictadas vs planificadas', 'Alertas operativas']
  },
  {
    id: 'seguridad',
    codigo: 'MOD-02',
    nombre: 'Seguridad & Gobierno RBAC',
    categoria: 'Gobernanza',
    descripcion: 'Administración de usuarios, grupos canónicos (SISTEMAS, Administrador, Coordinación), 7 roles canónicos y permisos CRUD.',
    icono: ShieldCheck,
    subfunciones: ['Gestión de usuarios', 'Grupos canónicos', '7 Roles canónicos', 'Matriz CRUD por módulo', 'Auditoría inmutable']
  },
  {
    id: 'academico',
    codigo: 'MOD-03',
    nombre: 'Académico',
    categoria: 'Gestión Académica',
    descripcion: 'Configuración curricular de sedes, facultades, escuelas, carreras, mallas curriculares y periodos lectivos.',
    icono: GraduationCap,
    subfunciones: ['Sedes y campus', 'Facultades y carreras', 'Mallas curriculares', 'Periodos académicos']
  },
  {
    id: 'planificacion',
    codigo: 'MOD-04',
    nombre: 'Planificación',
    categoria: 'Gestión Académica',
    descripcion: 'Estructuración de carga horaria, asignación de docentes a cátedras, distribución de paralelos y distributivo académico.',
    icono: CalendarCheck,
    subfunciones: ['Asignación docente', 'Carga horaria semanal', 'Paralelos y comisiones', 'Distributivo académico']
  },
  {
    id: 'horario',
    codigo: 'MOD-05',
    nombre: 'Horario',
    categoria: 'Gestión Académica',
    descripcion: 'Generación, ajuste y publicación de grillas horarias semanales con algoritmo de prevención y detección de cruces.',
    icono: Clock,
    subfunciones: ['Matriz semanal interactiva', 'Control de cruces de horario', 'Disponibilidad docente', 'Horarios por paralelo']
  },
  {
    id: 'asignacion_aulas',
    codigo: 'MOD-06',
    nombre: 'Asignación de Aulas',
    categoria: 'Infraestructura',
    descripcion: 'Administración de espacios físicos, tipologías de aulas, laboratorios especializados, aforos y semáforo de disponibilidad.',
    icono: Building2,
    subfunciones: ['Inventario de aulas y labs', 'Semáforo de disponibilidad', 'Aforo y equipamiento', 'Asignación física de espacios']
  },
  {
    id: 'reportes',
    codigo: 'MOD-07',
    nombre: 'Reportes',
    categoria: 'Inteligencia & Control',
    descripcion: 'Emisión y descarga de informes oficiales, nóminas docentes, horarios por carrera o aula en formatos Excel y PDF.',
    icono: BarChart3,
    subfunciones: ['Horarios por carrera y aula', 'Distributivo de carga docente', 'Exportación Excel/PDF', 'Consolidado institucional']
  }
];

export const ModulosSubtab: React.FC<ModulosSubtabProps> = ({
  roles,
  usuarios,
  onNavigateToPermisos,
  onNavigateToFlujo
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState<string>('TODAS');
  const [selectedModulo, setSelectedModulo] = useState<ModuloInfo>(MODULOS_CATALOGO[0]);

  // Roles institucionales para evaluar accesos (7 roles canónicos)
  const canonicalRolesList: RoleType[] = [
    'SUPERADMIN',
    'ADMINISTRADOR',
    'COORDINADOR',
    'DOCENTE',
    'OPERADOR',
    'AUDITOR',
    'CONDULTA'
  ];

  // Filtrado de módulos
  const filteredModulos = useMemo(() => {
    return MODULOS_CATALOGO.filter(m => {
      const matchSearch =
        m.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.descripcion.toLowerCase().includes(searchTerm.toLowerCase());

      const matchCat = selectedCategoria === 'TODAS' || m.categoria === selectedCategoria;
      return matchSearch && matchCat;
    });
  }, [searchTerm, selectedCategoria]);

  // Resumen de permisos del módulo seleccionado para cada rol
  const roleAccessSummary = useMemo(() => {
    return canonicalRolesList.map(role => {
      const perms = INSTITUTIONAL_RBAC_MATRIX[role]?.[selectedModulo.id] || {
        ver: false,
        crear: false,
        editar: false,
        eliminar: false,
        exportar: false,
        administrar: false,
        label: 'Sin acceso'
      };

      const hasFull = perms.ver && perms.crear && perms.editar && perms.eliminar;
      const hasRead = perms.ver && !perms.crear && !perms.editar;
      const hasNone = !perms.ver && !perms.crear && !perms.editar && !perms.eliminar;

      const userCount = usuarios.filter(u => u.rol_nombre === role || (role === 'CONSULTA' && u.rol_nombre === 'USUARIO_CONSULTA')).length;

      return {
        role,
        perms,
        hasFull,
        hasRead,
        hasNone,
        userCount,
        config: GRUPOS_CANONICOS[role] || {
          nombre: role,
          emoji: '🛡️',
          badgeClass: 'bg-slate-100 text-slate-800'
        }
      };
    });
  }, [selectedModulo, usuarios]);

  return (
    <div id="subtab-modulos-container" className="space-y-6 animate-in fade-in duration-200">
      {/* Banner Informativo Superior */}
      <div className="bg-gradient-to-r from-[#1f0533] via-[#350854] to-[#1f0533] text-white p-6 rounded-2xl shadow-md border-l-4 border-rose-500 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-500 text-white uppercase tracking-wider">
              Nivel 5 de la Arquitectura RBAC
            </span>
            <span className="text-xs text-purple-200 font-mono">
              8 Módulos de Operación Institucional
            </span>
          </div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-rose-400" />
            <span>Catálogo y Gobierno de Módulos del Campus</span>
          </h2>
          <p className="text-xs sm:text-sm text-purple-200 max-w-2xl leading-relaxed">
            Consulte las capacidades operativas de cada módulo del sistema y verifique la política de acceso de roles y permisos sobre ellos.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onNavigateToFlujo && (
            <button
              onClick={onNavigateToFlujo}
              className="px-4 py-2 bg-purple-900/80 hover:bg-purple-800 text-purple-200 border border-purple-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <ArrowRight className="w-3.5 h-3.5 text-amber-300" />
              <span>Ver Flujo Canónico</span>
            </button>
          )}

          {onNavigateToPermisos && (
            <button
              onClick={() => onNavigateToPermisos()}
              className="px-4 py-2 bg-[#e5a800] hover:bg-amber-400 text-[#1f0533] rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Key className="w-3.5 h-3.5" />
              <span>Matriz de Permisos</span>
            </button>
          )}
        </div>
      </div>

      {/* Métricas Rápidas de Módulos */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Total Módulos</div>
          <div className="text-2xl font-black text-slate-900 mt-1">8</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Catálogo oficial del campus</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] text-purple-600 font-bold uppercase tracking-wider">Roles Evaluados</div>
          <div className="text-2xl font-black text-purple-900 mt-1">{roles.length}</div>
          <div className="text-[10px] text-purple-600/80 mt-0.5">Perfiles con políticas RBAC</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] text-emerald-600 font-bold uppercase tracking-wider">Acciones Estándar</div>
          <div className="text-2xl font-black text-emerald-700 mt-1">6</div>
          <div className="text-[10px] text-emerald-600/80 mt-0.5">CRUD + Exportar + Admin</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] text-rose-600 font-bold uppercase tracking-wider">Cuentas Cubiertas</div>
          <div className="text-2xl font-black text-rose-700 mt-1">{usuarios.length}</div>
          <div className="text-[10px] text-rose-600/80 mt-0.5">Usuarios gobernados por RBAC</div>
        </div>
      </div>

      {/* Barra de Búsqueda y Categorías */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar módulo por código o nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {['TODAS', 'Gobernanza', 'Gestión Académica', 'Infraestructura', 'Inteligencia & Control'].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategoria(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                selectedCategoria === cat
                  ? 'bg-[#1f0533] text-amber-300 shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Principal: Lista de Módulos (Izquierda) + Detalle de Accesos por Rol (Derecha) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Rejilla de Tarjetas de Módulos */}
        <div className="lg:col-span-7 space-y-3">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between px-1">
            <span>Seleccione un módulo para auditar sus políticas de acceso</span>
            <span className="font-mono">{filteredModulos.length} módulos</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredModulos.map(mod => {
              const Icon = mod.icono;
              const isSelected = selectedModulo.id === mod.id;

              return (
                <div
                  key={mod.id}
                  onClick={() => setSelectedModulo(mod)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                    isSelected
                      ? 'border-purple-600 bg-purple-50/50 shadow-md ring-2 ring-purple-400/40'
                      : 'border-slate-200 bg-white hover:border-purple-300 hover:shadow-xs'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-xl ${
                          isSelected ? 'bg-[#1f0533] text-amber-300' : 'bg-slate-100 text-slate-700'
                        }`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="font-mono text-xs font-black text-purple-900 bg-purple-100/80 px-2 py-0.5 rounded-md">
                          {mod.codigo}
                        </span>
                      </div>

                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        {mod.categoria}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-xs font-black text-slate-900 leading-tight">
                        {mod.nombre}
                      </h4>
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-snug">
                        {mod.descripcion}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-purple-700 font-bold flex items-center gap-1">
                      <span>Ver políticas</span>
                      <ChevronRight className="w-3 h-3" />
                    </span>

                    {isSelected && (
                      <span className="text-[10px] font-black text-purple-900 bg-amber-300 px-2 py-0.5 rounded-full">
                        Activo
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Panel Lateral: Detalle del Módulo Seleccionado y Políticas de Acceso */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4 sticky top-4">
            {/* Cabecera del Módulo */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-[#1f0533] text-amber-300 rounded-2xl shadow-xs">
                  {React.createElement(selectedModulo.icono, { className: 'w-6 h-6' })}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black text-purple-900 bg-purple-100 px-2 py-0.5 rounded">
                      {selectedModulo.codigo}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">
                      {selectedModulo.categoria}
                    </span>
                  </div>
                  <h3 className="text-sm font-black text-slate-900 mt-1">
                    {selectedModulo.nombre}
                  </h3>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {selectedModulo.descripcion}
            </p>

            {/* Subfunciones operativas */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Capacidades Operativas del Módulo:
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {selectedModulo.subfunciones.map((sub, idx) => (
                  <div key={idx} className="p-2 bg-slate-50 border border-slate-100 rounded-xl text-[11px] text-slate-700 flex items-center gap-1.5 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-600 shrink-0"></span>
                    <span className="truncate">{sub}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Matriz de Accesos por Rol para este Módulo */}
            <div className="space-y-2 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Políticas por Rol Institucional:
                </span>
                <span className="text-[10px] text-slate-400">
                  {roleAccessSummary.length} roles evaluados
                </span>
              </div>

              <div className="space-y-1.5 max-h-[340px] overflow-y-auto pr-1">
                {roleAccessSummary.map((item, idx) => (
                  <div
                    key={`role-access-item-${item.role}-${idx}`}
                    className="p-2.5 bg-slate-50/80 hover:bg-slate-100 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs transition"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{item.config.emoji}</span>
                      <div>
                        <div className="font-bold text-slate-900 leading-tight">
                          {item.config.nombre}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {item.userCount} usuario(s)
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        item.hasFull
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : item.hasRead
                          ? 'bg-sky-100 text-sky-800 border border-sky-300'
                          : item.hasNone
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}>
                        {item.hasFull ? 'Total' : item.hasRead ? 'Lectura' : item.hasNone ? 'Denegado' : 'Parcial'}
                      </span>

                      {/* Micro-pills de CRUD */}
                      <div className="flex items-center gap-0.5">
                        <span className={`w-4 h-4 rounded flex items-center justify-center text-[9px] font-black ${
                          item.perms.ver ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-400'
                        }`} title="Ver">V</span>
                        <span className={`w-4 h-4 rounded flex items-center justify-center text-[9px] font-black ${
                          item.perms.crear ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400'
                        }`} title="Crear">C</span>
                        <span className={`w-4 h-4 rounded flex items-center justify-center text-[9px] font-black ${
                          item.perms.editar ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-400'
                        }`} title="Editar">E</span>
                        <span className={`w-4 h-4 rounded flex items-center justify-center text-[9px] font-black ${
                          item.perms.eliminar ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-400'
                        }`} title="Eliminar">D</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Botón de acción */}
            {onNavigateToPermisos && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => onNavigateToPermisos()}
                  className="w-full py-2.5 bg-[#1f0533] hover:bg-[#350854] text-amber-300 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Key className="w-4 h-4" />
                  <span>Ajustar Permisos de este Módulo en Matriz</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
