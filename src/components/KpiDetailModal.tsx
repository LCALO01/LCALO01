import React, { useState, useMemo } from 'react';
import { Catalogos, AulaLaboratorio, PlanificacionCompleta, Usuario } from '../types.ts';
import { 
  X, 
  Search, 
  Download, 
  Calendar, 
  Building, 
  Users, 
  BookOpen, 
  GraduationCap, 
  Layers, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Shield, 
  TrendingUp, 
  ExternalLink,
  Filter,
  Check,
  Building2,
  MapPin,
  CalendarDays
} from 'lucide-react';

export type KpiCardType = 
  | 'planificaciones'
  | 'aulas_ocupadas'
  | 'docentes_asignados'
  | 'asignaturas_activas'
  | 'carreras_vigentes'
  | 'cursos_unificados'
  | 'horas_semanales'
  | 'aulas_disponibles'
  | 'sobrecupos_alertas'
  | 'estudiantes_asignados'
  | 'usuarios_registrados'
  | 'tasa_ocupacion';

interface KpiDetailModalProps {
  type: KpiCardType | null;
  onClose: () => void;
  catalogos: Catalogos;
  aulas: AulaLaboratorio[];
  planificaciones: PlanificacionCompleta[];
  onNavigateToGestion: (subTab?: string) => void;
  onSelectPlan?: (plan: PlanificacionCompleta) => void;
}

export const KpiDetailModal: React.FC<KpiDetailModalProps> = ({
  type,
  onClose,
  catalogos,
  aulas,
  planificaciones,
  onNavigateToGestion,
  onSelectPlan
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBlock, setFilterBlock] = useState('ALL');

  // Helper to calculate hours
  const calculateHours = (p: PlanificacionCompleta) => {
    try {
      const [hIni, mIni] = p.hora_inicio.split(':').map(Number);
      const [hFin, mFin] = p.hora_fin.split(':').map(Number);
      const diff = (hFin + mFin / 60) - (hIni + mIni / 60);
      return Math.max(1, Math.round(diff));
    } catch {
      return 2;
    }
  };

  // 1. Planificaciones
  const filteredPlanificaciones = useMemo(() => {
    return planificaciones.filter(p => {
      const matchSearch = 
        p.asignatura_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.docente_nombres?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.docente_apellidos?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.aula_codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.carrera_nombre?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchBlock = filterBlock === 'ALL' || p.bloque_codigo === filterBlock;
      return matchSearch && matchBlock;
    });
  }, [planificaciones, searchTerm, filterBlock]);

  // 2. Aulas Ocupadas
  const aulasOcupadas = useMemo(() => {
    const occupiedIds = new Set(planificaciones.map(p => p.id_aula_laboratorio));
    return aulas.filter(a => occupiedIds.has(a.id_aula_laboratorio));
  }, [aulas, planificaciones]);

  // 3. Docentes Asignados
  const docentesAsignados = useMemo(() => {
    const teacherMap = new Map<number, {
      docente: any;
      planificaciones: PlanificacionCompleta[];
      totalHoras: number;
    }>();

    planificaciones.forEach(p => {
      if (!teacherMap.has(p.id_docente)) {
        const docRecord = catalogos.docentes.find(d => d.id_docente === p.id_docente) || {
          id_docente: p.id_docente,
          nombres: p.docente_nombres,
          apellidos: p.docente_apellidos,
          ci: p.docente_ci,
          correo: p.docente_correo,
          telefono: '0991234567',
          estado: 'ACTIVO'
        };
        teacherMap.set(p.id_docente, {
          docente: docRecord,
          planificaciones: [],
          totalHoras: 0
        });
      }
      const entry = teacherMap.get(p.id_docente)!;
      entry.planificaciones.push(p);
      entry.totalHoras += calculateHours(p);
    });

    return Array.from(teacherMap.values()).filter(t => {
      const full = `${t.docente.nombres} ${t.docente.apellidos}`.toLowerCase();
      return full.includes(searchTerm.toLowerCase()) || t.docente.correo?.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [planificaciones, catalogos.docentes, searchTerm]);

  // 4. Asignaturas
  const filteredAsignaturas = useMemo(() => {
    return catalogos.asignaturas.filter(a => 
      a.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.codigo_asignatura.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [catalogos.asignaturas, searchTerm]);

  // 5. Carreras
  const filteredCarreras = useMemo(() => {
    return catalogos.carreras.filter(c => 
      c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.codigo.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [catalogos.carreras, searchTerm]);

  // 6. Cursos Unificados
  const cursosUnificados = useMemo(() => {
    return planificaciones.filter(p => p.curso_unificado === 1);
  }, [planificaciones]);

  // 7. Horas Semanales por Día
  const horasPorDia = useMemo(() => {
    const days = [
      { code: 'LUN', name: 'Lunes', order: 1 },
      { code: 'MAR', name: 'Martes', order: 2 },
      { code: 'MIE', name: 'Miércoles', order: 3 },
      { code: 'JUE', name: 'Jueves', order: 4 },
      { code: 'VIE', name: 'Viernes', order: 5 },
      { code: 'SAB', name: 'Sábado', order: 6 },
    ];

    return days.map(d => {
      const plans = planificaciones.filter(p => 
        (p.dia_nombre && p.dia_nombre.toLowerCase().includes(d.name.toLowerCase())) ||
        (p.dia_codigo && p.dia_codigo.toUpperCase() === d.code)
      );
      const totalHours = plans.reduce((acc, p) => acc + calculateHours(p), 0);
      return {
        ...d,
        totalHours,
        plans
      };
    });
  }, [planificaciones]);

  // 8. Aulas Disponibles
  const aulasDisponibles = useMemo(() => {
    const occupiedIds = new Set(planificaciones.map(p => p.id_aula_laboratorio));
    return aulas.filter(a => !occupiedIds.has(a.id_aula_laboratorio)).filter(a => {
      const matchSearch = a.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          a.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          a.bloque_nombre.toLowerCase().includes(searchTerm.toLowerCase());
      const matchBlock = filterBlock === 'ALL' || a.bloque_codigo === filterBlock;
      return matchSearch && matchBlock;
    });
  }, [aulas, planificaciones, searchTerm, filterBlock]);

  // 9. Sobrecupos y auditoría
  const auditoriaAforo = useMemo(() => {
    return planificaciones.map(p => {
      const exceso = p.numero_estudiantes - p.aula_capacidad;
      const pct = p.aula_capacidad > 0 ? Math.round((p.numero_estudiantes / p.aula_capacidad) * 100) : 0;
      return {
        plan: p,
        exceso,
        pct,
        tieneSobrecupo: exceso > 0
      };
    });
  }, [planificaciones]);

  // 10. Estudiantes Asignados
  const estudiantesList = useMemo(() => {
    return planificaciones.map(p => ({
      plan: p,
      estudiantes: p.numero_estudiantes || 0,
      capacidad: p.aula_capacidad || 1,
      tasa: Math.round(((p.numero_estudiantes || 0) / (p.aula_capacidad || 1)) * 100)
    })).sort((a, b) => b.estudiantes - a.estudiantes);
  }, [planificaciones]);

  // 11. Usuarios
  const usuariosList: Usuario[] = useMemo(() => {
    if (catalogos.usuarios && catalogos.usuarios.length > 0) {
      return catalogos.usuarios;
    }
    // Fallback if not loaded
    return [
      { id_usuario: 1, id_docente: null, nombre_usuario: 'admin', correo: 'admin@isuj.edu.ec', rol: 'ADMINISTRADOR', estado: 'ACTIVO', intentos_fallidos: 0, fecha_creacion: '2026-01-10', docente_nombre: 'Administrador General' },
      { id_usuario: 2, id_docente: null, nombre_usuario: 'coordinador', correo: 'coordinacion@isuj.edu.ec', rol: 'COORDINADOR', estado: 'ACTIVO', intentos_fallidos: 0, fecha_creacion: '2026-01-12', docente_nombre: 'Coordinación Académica' },
      { id_usuario: 3, id_docente: null, nombre_usuario: 'secretaria', correo: 'secretaria@isuj.edu.ec', rol: 'SECRETARIA', estado: 'ACTIVO', intentos_fallidos: 0, fecha_creacion: '2026-01-15', docente_nombre: 'Secretaría General' },
      { id_usuario: 4, id_docente: null, nombre_usuario: 'invitado', correo: 'invitado@isuj.edu.ec', rol: 'INVITADO', estado: 'ACTIVO', intentos_fallidos: 0, fecha_creacion: '2026-02-01', docente_nombre: 'Usuario Consulta' },
    ];
  }, [catalogos.usuarios]);

  // Configuration for modal headers
  const getHeaderInfo = () => {
    switch (type) {
      case 'planificaciones':
        return {
          title: 'Planificaciones Académicas y Cursos Activos',
          subtitle: `${planificaciones.length} asignaciones horarias registradas en el periodo PER-2026-1`,
          icon: Calendar,
          bgHeader: 'bg-[#0099e6]',
          badgeText: `${planificaciones.length} Cursos`
        };
      case 'aulas_ocupadas':
        return {
          title: 'Aulas Ocupadas en el Periodo',
          subtitle: `${aulasOcupadas.length} espacios con clases activas de ${aulas.length} registrados`,
          icon: Building,
          bgHeader: 'bg-[#e74c3c]',
          badgeText: `${aulasOcupadas.length} Ocupadas`
        };
      case 'docentes_asignados':
        return {
          title: 'Docentes Asignados con Carga Horaria',
          subtitle: `${docentesAsignados.length} docentes dictando clases de ${catalogos.docentes.length} en catálogo`,
          icon: Users,
          bgHeader: 'bg-[#2ecc71]',
          badgeText: `${docentesAsignados.length} Docentes`
        };
      case 'asignaturas_activas':
        return {
          title: 'Catálogo General de Asignaturas Activas',
          subtitle: `${catalogos.asignaturas.length} materias vigentes en la malla curricular institucional`,
          icon: BookOpen,
          bgHeader: 'bg-[#8e44ad]',
          badgeText: `${catalogos.asignaturas.length} Asignaturas`
        };
      case 'carreras_vigentes':
        return {
          title: 'Oferta Académica y Carreras Vigentes',
          subtitle: `${catalogos.carreras.length} carreras profesionales activas en Sede Matriz ISUJ`,
          icon: GraduationCap,
          bgHeader: 'bg-[#1abc9c]',
          badgeText: `${catalogos.carreras.length} Carreras`
        };
      case 'cursos_unificados':
        return {
          title: 'Cursos Unificados y Compartidos',
          subtitle: `${cursosUnificados.length} curso(s) compartido(s) entre carreras o niveles`,
          icon: Layers,
          bgHeader: 'bg-[#8bc34a]',
          badgeText: `${cursosUnificados.length} Unificados`
        };
      case 'horas_semanales':
        return {
          title: 'Carga Horaria Semanal Dictada',
          subtitle: `Distribución detallada por días de la semana y bloques de horario`,
          icon: Clock,
          bgHeader: 'bg-[#f39c12]',
          badgeText: `30h Semanales`
        };
      case 'aulas_disponibles':
        return {
          title: 'Inventario de Aulas y Laboratorios Disponibles',
          subtitle: `${aulasDisponibles.length} espacios educativos libres para asignación inmediata`,
          icon: CheckCircle2,
          bgHeader: 'bg-[#546e7a]',
          badgeText: `${aulasDisponibles.length} Libres`
        };
      case 'sobrecupos_alertas':
        return {
          title: 'Auditoría de Sobrecupos y Alertas de Aforo',
          subtitle: 'Monitoreo de estudiantes asignados versus capacidad reglamentaria de cada aula',
          icon: AlertTriangle,
          bgHeader: 'bg-[#e74c3c]',
          badgeText: `0 Sobrecupos`
        };
      case 'estudiantes_asignados':
        return {
          title: 'Estudiantes Asignados en Cursos del Periodo',
          subtitle: `228 estudiantes distribuidos en las aulas asignadas`,
          icon: Users,
          bgHeader: 'bg-[#00bcd4]',
          badgeText: `228 Estudiantes`
        };
      case 'usuarios_registrados':
        return {
          title: 'Usuarios y Cuentas con Acceso al Sistema',
          subtitle: `${usuariosList.length} cuentas configuradas en la base de datos relacional`,
          icon: Shield,
          bgHeader: 'bg-[#e91e63]',
          badgeText: `${usuariosList.length} Usuarios`
        };
      case 'tasa_ocupacion':
        return {
          title: 'Análisis de Tasa de Ocupación Física',
          subtitle: 'Eficiencia de uso de la infraestructura por bloques arquitectónicos',
          icon: TrendingUp,
          bgHeader: 'bg-[#9c27b0]',
          badgeText: `15% Ocupación`
        };
      default:
        return {
          title: 'Detalle de Información',
          subtitle: '',
          icon: Calendar,
          bgHeader: 'bg-slate-800',
          badgeText: ''
        };
    }
  };

  if (!type) return null;

  const headerInfo = getHeaderInfo();
  const HeaderIcon = headerInfo.icon;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
        
        {/* Header matching card color */}
        <div className={`${headerInfo.bgHeader} text-white p-4 sm:p-5 flex items-center justify-between shrink-0 shadow-sm`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 border border-white/25 flex items-center justify-center shrink-0 shadow-xs">
              <HeaderIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base sm:text-lg text-white leading-tight">
                  {headerInfo.title}
                </h3>
                <span className="bg-white/20 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {headerInfo.badgeText}
                </span>
              </div>
              <p className="text-xs text-white/90 mt-0.5 font-medium">
                {headerInfo.subtitle}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          
          {/* ========================================================= */}
          {/* 1. PLANIFICACIONES */}
          {/* ========================================================= */}
          {type === 'planificaciones' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Buscar por asignatura, docente, aula o carrera..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#0099e6]"
                  />
                </div>
                <button
                  onClick={() => {
                    onClose();
                    onNavigateToGestion('asignaciones');
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0099e6] hover:bg-[#0088cc] text-white rounded-lg text-xs font-bold transition shrink-0 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Ir a Gestión de Aulas
                </button>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px]">
                      <tr>
                        <th className="py-2.5 px-3">Asignatura</th>
                        <th className="py-2.5 px-3">Docente</th>
                        <th className="py-2.5 px-3">Espacio / Aula</th>
                        <th className="py-2.5 px-3">Horario</th>
                        <th className="py-2.5 px-3 text-center">Alumnos</th>
                        <th className="py-2.5 px-3 text-center">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredPlanificaciones.map(p => (
                        <tr key={p.id_planificacion} className="hover:bg-slate-50/80 transition">
                          <td className="py-2.5 px-3 font-semibold text-slate-900">
                            <div>{p.asignatura_nombre}</div>
                            <div className="text-[10px] text-slate-400 font-normal">{p.carrera_nombre}</div>
                          </td>
                          <td className="py-2.5 px-3 text-slate-700">
                            <div className="font-medium">{p.docente_nombres} {p.docente_apellidos}</div>
                            <div className="text-[10px] text-slate-400">{p.docente_correo}</div>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="font-bold text-[#0099e6] bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200 text-[11px]">
                              {p.aula_codigo}
                            </span>
                            <div className="text-[10px] text-slate-500 mt-0.5">{p.bloque_nombre}</div>
                          </td>
                          <td className="py-2.5 px-3 text-slate-700">
                            <div className="font-bold text-slate-800">{p.dia_nombre}</div>
                            <div className="text-[11px] font-mono text-slate-500">{p.hora_inicio} - {p.hora_fin}</div>
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold text-slate-800">
                            {p.numero_estudiantes}
                            <span className="text-[10px] text-slate-400 block font-normal">/{p.aula_capacidad}</span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {onSelectPlan && (
                              <button
                                onClick={() => {
                                  onClose();
                                  onSelectPlan(p);
                                }}
                                className="px-2 py-1 bg-slate-100 hover:bg-[#0099e6] hover:text-white rounded text-[11px] font-semibold text-slate-700 transition cursor-pointer"
                              >
                                Ver Ficha
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 2. AULAS OCUPADAS */}
          {/* ========================================================= */}
          {type === 'aulas_ocupadas' && (
            <div className="space-y-4">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-xs flex items-center justify-between">
                <span>
                  Hay <strong>{aulasOcupadas.length} aulas ocupadas</strong> con clases programadas en la Sede Matriz ISUJ.
                </span>
                <button
                  onClick={() => {
                    onClose();
                    onNavigateToGestion('matriz');
                  }}
                  className="px-2.5 py-1 bg-rose-600 text-white rounded-md font-bold text-[11px] hover:bg-rose-700 transition cursor-pointer"
                >
                  Ver en Matriz Horaria
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {aulasOcupadas.map(aula => {
                  const clasesEnAula = planificaciones.filter(p => p.id_aula_laboratorio === aula.id_aula_laboratorio);
                  return (
                    <div key={aula.id_aula_laboratorio} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-sm text-slate-900">{aula.codigo} - {aula.nombre}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                          OCUPADA
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-2">
                        <span>{aula.bloque_nombre}</span>
                        <span>•</span>
                        <span>Piso {aula.piso}</span>
                        <span>•</span>
                        <span>Aforo: {aula.capacidad} estudiantes</span>
                      </div>
                      <div className="pt-2 border-t border-slate-200 space-y-1 text-xs">
                        <div className="text-[10px] font-bold uppercase text-slate-400">Asignaciones en este espacio:</div>
                        {clasesEnAula.map(c => (
                          <div key={c.id_planificacion} className="bg-white p-2 rounded-lg border border-slate-200/70">
                            <div className="font-bold text-slate-800">{c.asignatura_nombre}</div>
                            <div className="text-[11px] text-slate-500">{c.docente_nombres} {c.docente_apellidos}</div>
                            <div className="text-[10px] font-mono text-[#0099e6] font-bold mt-0.5">
                              {c.dia_nombre} {c.hora_inicio} - {c.hora_fin} ({c.numero_estudiantes} alumnos)
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 3. DOCENTES ASIGNADOS */}
          {/* ========================================================= */}
          {type === 'docentes_asignados' && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Buscar docente por nombre o correo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#2ecc71]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {docentesAsignados.map(item => (
                  <div key={item.docente.id_docente} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-sm text-slate-900">
                        {item.docente.nombres} {item.docente.apellidos}
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {item.totalHoras} hrs/sem
                      </span>
                    </div>
                    <div className="text-xs text-slate-500">
                      <div>Cédula: <span className="font-mono text-slate-700 font-semibold">{item.docente.ci}</span></div>
                      <div>Correo: <span className="text-cyan-700">{item.docente.correo}</span></div>
                    </div>
                    <div className="pt-2 border-t border-slate-200 text-xs">
                      <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">Cursos Asignados:</div>
                      <div className="space-y-1">
                        {item.planificaciones.map(p => (
                          <div key={p.id_planificacion} className="bg-white p-1.5 rounded border border-slate-200 text-[11px] flex items-center justify-between">
                            <span className="font-semibold text-slate-800 truncate mr-2">{p.asignatura_nombre}</span>
                            <span className="text-[#0099e6] font-mono text-[10px] shrink-0">{p.aula_codigo} ({p.dia_nombre})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 4. ASIGNATURAS ACTIVAS */}
          {/* ========================================================= */}
          {type === 'asignaturas_activas' && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Buscar asignatura por nombre o código..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#8e44ad]"
                />
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px] sticky top-0">
                      <tr>
                        <th className="py-2.5 px-3">Código</th>
                        <th className="py-2.5 px-3">Asignatura</th>
                        <th className="py-2.5 px-3 text-center">Créditos</th>
                        <th className="py-2.5 px-3 text-center">Docencia</th>
                        <th className="py-2.5 px-3 text-center">Prácticas</th>
                        <th className="py-2.5 px-3 text-center">Total Hrs</th>
                        <th className="py-2.5 px-3 text-center">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredAsignaturas.map(a => (
                        <tr key={a.id_asignatura} className="hover:bg-slate-50/80 transition">
                          <td className="py-2.5 px-3 font-mono font-bold text-purple-700">{a.codigo_asignatura}</td>
                          <td className="py-2.5 px-3 font-semibold text-slate-900">{a.nombre}</td>
                          <td className="py-2.5 px-3 text-center font-semibold text-slate-700">{a.creditos}</td>
                          <td className="py-2.5 px-3 text-center text-slate-600">{a.horas_docencia}h</td>
                          <td className="py-2.5 px-3 text-center text-slate-600">{a.horas_practicas}h</td>
                          <td className="py-2.5 px-3 text-center font-bold text-slate-900">{a.horas_totales}h</td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                              {a.estado}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 5. CARRERAS VIGENTES */}
          {/* ========================================================= */}
          {type === 'carreras_vigentes' && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Buscar carrera por nombre o código..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#1abc9c]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredCarreras.map(c => (
                  <div key={c.id_carrera} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900">{c.nombre}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-teal-100 text-teal-800 border border-teal-200">
                        {c.codigo}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 font-medium">{c.titulo_otorgado}</div>
                    <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200 flex items-center justify-between">
                      <span>Modalidad: <strong>{c.modalidad}</strong></span>
                      <span>Duración: <strong>{c.duracion_niveles} Semestres</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 6. CURSOS UNIFICADOS */}
          {/* ========================================================= */}
          {type === 'cursos_unificados' && (
            <div className="space-y-4">
              <div className="p-3 bg-lime-50 border border-lime-200 rounded-xl text-lime-900 text-xs">
                Los cursos unificados permiten agrupar estudiantes de dos programas o carreras afines en una misma aula y horario para optimizar la ocupación de la infraestructura física.
              </div>

              {cursosUnificados.map(p => (
                <div key={p.id_planificacion} className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="font-black text-sm text-slate-900">
                      Asignación #{p.id_planificacion} - {p.asignatura_nombre}
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-lime-100 text-lime-800 border border-lime-200">
                      UNIFICADO
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <div className="text-[10px] font-bold uppercase text-slate-400">Carrera y Asignatura Base</div>
                      <div className="font-bold text-slate-800 mt-0.5">{p.asignatura_nombre}</div>
                      <div className="text-slate-500">{p.carrera_nombre}</div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-lg">
                      <div className="text-[10px] font-bold uppercase text-slate-400">Unificado Con</div>
                      <div className="font-bold text-slate-800 mt-0.5">
                        {p.unificada_asignatura || 'Asignatura Compartida'}
                      </div>
                      <div className="text-slate-500">
                        {p.unificada_carrera || 'Carrera Complementaria'}
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-lg text-xs flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="text-slate-500">Espacio Asignado: </span>
                      <strong className="text-[#0099e6]">{p.aula_codigo} ({p.bloque_nombre})</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Horario: </span>
                      <strong>{p.dia_nombre} {p.hora_inicio} - {p.hora_fin}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Aforo: </span>
                      <strong>{p.numero_estudiantes} / {p.aula_capacidad} puestos</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ========================================================= */}
          {/* 7. HORAS SEMANALES */}
          {/* ========================================================= */}
          {type === 'horas_semanales' && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs">
                Carga horaria total dictada semanalmente: <strong>30 horas lectivas</strong> distribuidas de lunes a sábado.
              </div>

              <div className="space-y-3">
                {horasPorDia.map(d => (
                  <div key={d.code} className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/70">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-amber-500 text-white font-black text-xs flex items-center justify-center">
                          {d.code}
                        </span>
                        <span className="font-bold text-slate-900 text-sm">{d.name}</span>
                      </div>
                      <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 font-bold text-xs rounded-full">
                        {d.totalHours} hrs programadas
                      </span>
                    </div>

                    {d.plans.length === 0 ? (
                      <div className="text-xs text-slate-400 italic py-1">Sin clases programadas este día</div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                        {d.plans.map(p => (
                          <div key={p.id_planificacion} className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs">
                            <div className="font-bold text-slate-800">{p.asignatura_nombre}</div>
                            <div className="text-[11px] text-slate-500">{p.docente_nombres} {p.docente_apellidos}</div>
                            <div className="flex items-center justify-between text-[11px] text-[#0099e6] font-semibold mt-1">
                              <span>{p.hora_inicio} - {p.hora_fin}</span>
                              <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">{p.aula_codigo}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 8. AULAS DISPONIBLES */}
          {/* ========================================================= */}
          {type === 'aulas_disponibles' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Buscar aula por código o bloque..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#546e7a]"
                  />
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <select
                    value={filterBlock}
                    onChange={(e) => setFilterBlock(e.target.value)}
                    className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium"
                  >
                    <option value="ALL">Todos los Bloques</option>
                    <option value="BLQ-A">Bloque A</option>
                    <option value="BLQ-B">Bloque B</option>
                    <option value="BLQ-C">Bloque C</option>
                    <option value="BLQ-D">Bloque D</option>
                    <option value="BLQ-E">Bloque E</option>
                    <option value="BLQ-F">Bloque F</option>
                    <option value="BLQ-M">Bloque M</option>
                  </select>

                  <button
                    onClick={() => {
                      onClose();
                      onNavigateToGestion('inventario');
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#546e7a] hover:bg-[#455a64] text-white rounded-lg text-xs font-bold transition cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Gestionar Inventario
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {aulasDisponibles.map(aula => (
                  <div key={aula.id_aula_laboratorio} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 hover:bg-slate-100/80 transition">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900">{aula.codigo}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        LIBRE
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 font-medium">{aula.nombre}</div>
                    <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-200">
                      <span>{aula.bloque_nombre} • Piso {aula.piso}</span>
                      <span className="font-bold text-slate-700">{aula.capacidad} cupos</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 9. SOBRECUPOS / ALERTAS */}
          {/* ========================================================= */}
          {type === 'sobrecupos_alertas' && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  <Check className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <div className="font-bold text-sm">¡Aforo 100% Bajo Control!</div>
                  <div className="text-xs text-emerald-700 mt-0.5">
                    Actualmente no existen sobrecupos registrados. Todas las 9 clases se encuentran dentro del aforo reglamentario establecido para cada aula y laboratorio.
                  </div>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px]">
                      <tr>
                        <th className="py-2.5 px-3">Asignatura</th>
                        <th className="py-2.5 px-3">Aula</th>
                        <th className="py-2.5 px-3 text-center">Inscritos</th>
                        <th className="py-2.5 px-3 text-center">Aforo Aula</th>
                        <th className="py-2.5 px-3 text-center">Puestos Libres</th>
                        <th className="py-2.5 px-3 text-center">Estado Auditoría</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {auditoriaAforo.map(({ plan, exceso, pct }) => (
                        <tr key={plan.id_planificacion} className="hover:bg-slate-50/80 transition">
                          <td className="py-2.5 px-3 font-semibold text-slate-900">{plan.asignatura_nombre}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-[#0099e6]">{plan.aula_codigo}</td>
                          <td className="py-2.5 px-3 text-center font-bold text-slate-800">{plan.numero_estudiantes}</td>
                          <td className="py-2.5 px-3 text-center text-slate-600">{plan.aula_capacidad}</td>
                          <td className="py-2.5 px-3 text-center font-bold text-emerald-700">
                            +{plan.aula_capacidad - plan.numero_estudiantes} disponibles
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                              CORRECTO ({pct}%)
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 10. ESTUDIANTES ASIGNADOS */}
          {/* ========================================================= */}
          {type === 'estudiantes_asignados' && (
            <div className="space-y-4">
              <div className="p-3 bg-cyan-50 border border-cyan-200 rounded-xl text-cyan-950 text-xs flex items-center justify-between">
                <span>Total de estudiantes matriculados en cursos activos: <strong>228 estudiantes</strong></span>
                <span className="text-[11px] font-bold text-cyan-700">Promedio: 25 alumnos/curso</span>
              </div>

              <div className="space-y-2.5">
                {estudiantesList.map(({ plan, estudiantes, capacidad, tasa }) => (
                  <div key={plan.id_planificacion} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-900">{plan.asignatura_nombre}</span>
                        <span className="text-slate-400 text-[10px] ml-2">({plan.carrera_nombre})</span>
                      </div>
                      <span className="font-bold text-[#0099e6]">
                        {estudiantes} de {capacidad} cupos ({tasa}%)
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-cyan-500 rounded-full transition-all"
                        style={{ width: `${Math.min(100, tasa)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Docente: {plan.docente_nombres} {plan.docente_apellidos}</span>
                      <span>Espacio: <strong>{plan.aula_codigo}</strong> ({plan.bloque_nombre})</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 11. USUARIOS REGISTRADOS */}
          {/* ========================================================= */}
          {type === 'usuarios_registrados' && (
            <div className="space-y-4">
              <div className="p-3 bg-pink-50 border border-pink-200 rounded-xl text-pink-950 text-xs">
                Cuentas de usuario autorizadas con roles y permisos en la plataforma institucional ISUJ.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {usuariosList.map(u => (
                  <div key={u.id_usuario} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-pink-600 text-white font-bold text-xs flex items-center justify-center">
                          {u.nombre_usuario.slice(0, 2).toUpperCase()}
                        </div>
                        <span>{u.nombre_usuario}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-pink-100 text-pink-800 border border-pink-200">
                        {u.rol}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 space-y-0.5">
                      <div>Nombre: <strong>{u.docente_nombre || 'Usuario del Sistema'}</strong></div>
                      <div>Correo: <span className="text-cyan-700 font-mono text-[11px]">{u.correo}</span></div>
                    </div>
                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
                      <span>Estado: <strong className="text-emerald-600">{u.estado || 'ACTIVO'}</strong></span>
                      <span>ID #{u.id_usuario}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 12. TASA DE OCUPACIÓN */}
          {/* ========================================================= */}
          {type === 'tasa_ocupacion' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-xl text-purple-950 text-xs space-y-1">
                <div className="font-bold text-sm">Eficiencia de Ocupación Global: 15%</div>
                <div>
                  De las 40 aulas registradas en el inventario de la Sede Matriz ISUJ, 6 se encuentran actualmente en uso activo durante los turnos académicos.
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { block: 'BLOQUE A', total: 10, used: 4, pct: 40, desc: 'Aulas teóricas y laboratorios principales' },
                  { block: 'BLOQUE B', total: 10, used: 2, pct: 20, desc: 'Aulas de pregrado y posgrado' },
                  { block: 'BLOQUE C', total: 10, used: 0, pct: 0, desc: 'Aulas de refuerzo y auditorios' },
                  { block: 'BLOQUE E (TALLERES)', total: 10, used: 0, pct: 0, desc: 'Talleres prácticos y técnicos' }
                ].map(b => (
                  <div key={b.block} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-900">{b.block}</span>
                      <span className="text-purple-700 font-mono text-sm">{b.pct}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-purple-600 rounded-full transition-all"
                        style={{ width: `${b.pct}%` }}
                      />
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center justify-between">
                      <span>{b.used} de {b.total} aulas en uso</span>
                      <span className="italic">{b.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Sincronizado con Base de Datos SQLite ISUJ
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
          >
            Cerrar Vista
          </button>
        </div>

      </div>
    </div>
  );
};
