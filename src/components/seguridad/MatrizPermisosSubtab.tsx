import React, { useState, useMemo, useEffect } from 'react';
import { 
  ShieldCheck, 
  Copy, 
  Download, 
  Search, 
  X, 
  Check, 
  Sliders, 
  Sparkles, 
  Info,
  TableProperties,
  ListTree,
  Filter,
  Crown,
  Save,
  RotateCcw,
  Lock,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  Edit3,
  MoreHorizontal,
  Layers,
  CheckSquare
} from 'lucide-react';
import { useAuth } from '../../controllers/authContext.tsx';
import { 
  MATRIZ_PERMISOS_OFICIAL_6_ROLES, 
  MATRIZ_CRUD_ACCION_ROLES,
  PermisoCrudFila,
  CrudActionType,
  SeguridadUser,
  RoleType
} from '../../types.ts';

const STORAGE_KEY_CRUD_PERMISOS = 'isuj_matriz_crud_permisos_v2_7roles';

export type MatrizRoleKey = 'SUPERADMIN' | 'ADMINISTRADOR' | 'COORDINADOR' | 'DOCENTE' | 'OPERADOR' | 'AUDITOR' | 'CONDULTA';

export const CANONICAL_MATRIX_ROLES: {
  key: MatrizRoleKey;
  label: string;
  sublabel: string;
  headerColor: string;
  bgCell: string;
}[] = [
  { key: 'SUPERADMIN', label: 'SUPERADMIN', sublabel: 'Gobierno Total', headerColor: 'text-amber-300', bgCell: 'bg-amber-50/40' },
  { key: 'ADMINISTRADOR', label: 'ADMINISTRADOR', sublabel: 'Gestión Institucional', headerColor: 'text-purple-200', bgCell: 'bg-white/40' },
  { key: 'COORDINADOR', label: 'COORDINADOR', sublabel: 'Ámbito Sede/Escuela', headerColor: 'text-sky-300', bgCell: 'bg-white/40' },
  { key: 'DOCENTE', label: 'DOCENTE', sublabel: 'Carga Propia', headerColor: 'text-indigo-300', bgCell: 'bg-indigo-50/30' },
  { key: 'OPERADOR', label: 'OPERADOR', sublabel: 'Infraestructura/Aulas', headerColor: 'text-amber-400', bgCell: 'bg-amber-50/30' },
  { key: 'AUDITOR', label: 'AUDITOR', sublabel: 'Control y Auditoría', headerColor: 'text-teal-300', bgCell: 'bg-teal-50/30' },
  { key: 'CONDULTA', label: 'CONDULTA', sublabel: 'Consulta Institucional', headerColor: 'text-slate-300', bgCell: 'bg-slate-100/50' }
];

interface ModuloTheme {
  number: string;
  name: string;
  badgeBg: string;
  badgeText: string;
  bannerBg: string;
  bannerBorder: string;
  bannerText: string;
  bannerSubtext: string;
  rowBg: string;
  rowHover: string;
  accentBorder: string;
  chipBg: string;
  chipActive: string;
}

const MODULO_THEMES: Record<string, ModuloTheme> = {
  '1. Dashboard': {
    number: '1',
    name: 'Dashboard',
    badgeBg: 'bg-sky-600',
    badgeText: 'text-white',
    bannerBg: 'bg-sky-100 text-sky-950',
    bannerBorder: 'border-y border-sky-300',
    bannerText: 'text-sky-950',
    bannerSubtext: 'text-sky-700',
    rowBg: 'bg-sky-50/40',
    rowHover: 'hover:bg-sky-100/70',
    accentBorder: 'border-l-4 border-sky-500',
    chipBg: 'bg-sky-50 text-sky-800 border-sky-300 hover:bg-sky-100',
    chipActive: 'bg-sky-600 text-white border-sky-600 font-bold shadow-xs',
  },
  '2. Seguridad': {
    number: '2',
    name: 'Seguridad',
    badgeBg: 'bg-purple-700',
    badgeText: 'text-white',
    bannerBg: 'bg-purple-100 text-purple-950',
    bannerBorder: 'border-y border-purple-300',
    bannerText: 'text-purple-950',
    bannerSubtext: 'text-purple-700',
    rowBg: 'bg-purple-50/40',
    rowHover: 'hover:bg-purple-100/70',
    accentBorder: 'border-l-4 border-purple-600',
    chipBg: 'bg-purple-50 text-purple-800 border-purple-300 hover:bg-purple-100',
    chipActive: 'bg-purple-700 text-white border-purple-700 font-bold shadow-xs',
  },
  '3. Académico': {
    number: '3',
    name: 'Académico',
    badgeBg: 'bg-teal-700',
    badgeText: 'text-white',
    bannerBg: 'bg-teal-100 text-teal-950',
    bannerBorder: 'border-y border-teal-300',
    bannerText: 'text-teal-950',
    bannerSubtext: 'text-teal-700',
    rowBg: 'bg-teal-50/40',
    rowHover: 'hover:bg-teal-100/70',
    accentBorder: 'border-l-4 border-teal-600',
    chipBg: 'bg-teal-50 text-teal-800 border-teal-300 hover:bg-teal-100',
    chipActive: 'bg-teal-700 text-white border-teal-700 font-bold shadow-xs',
  },
  '4. Planificación': {
    number: '4',
    name: 'Planificación',
    badgeBg: 'bg-indigo-700',
    badgeText: 'text-white',
    bannerBg: 'bg-indigo-100 text-indigo-950',
    bannerBorder: 'border-y border-indigo-300',
    bannerText: 'text-indigo-950',
    bannerSubtext: 'text-indigo-700',
    rowBg: 'bg-indigo-50/40',
    rowHover: 'hover:bg-indigo-100/70',
    accentBorder: 'border-l-4 border-indigo-600',
    chipBg: 'bg-indigo-50 text-indigo-800 border-indigo-300 hover:bg-indigo-100',
    chipActive: 'bg-indigo-700 text-white border-indigo-700 font-bold shadow-xs',
  },
  '5. Horario': {
    number: '5',
    name: 'Horario',
    badgeBg: 'bg-amber-500',
    badgeText: 'text-slate-950 font-black',
    bannerBg: 'bg-amber-100 text-amber-950',
    bannerBorder: 'border-y border-amber-300',
    bannerText: 'text-amber-950',
    bannerSubtext: 'text-amber-700',
    rowBg: 'bg-amber-50/40',
    rowHover: 'hover:bg-amber-100/70',
    accentBorder: 'border-l-4 border-amber-500',
    chipBg: 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100',
    chipActive: 'bg-amber-500 text-slate-950 border-amber-500 font-bold shadow-xs',
  },
  '6. Asignación de Aulas': {
    number: '6',
    name: 'Asignación de Aulas',
    badgeBg: 'bg-emerald-700',
    badgeText: 'text-white',
    bannerBg: 'bg-emerald-100 text-emerald-950',
    bannerBorder: 'border-y border-emerald-300',
    bannerText: 'text-emerald-950',
    bannerSubtext: 'text-emerald-700',
    rowBg: 'bg-emerald-50/40',
    rowHover: 'hover:bg-emerald-100/70',
    accentBorder: 'border-l-4 border-emerald-600',
    chipBg: 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100',
    chipActive: 'bg-emerald-700 text-white border-emerald-700 font-bold shadow-xs',
  },
  '7. Reportes': {
    number: '7',
    name: 'Reportes',
    badgeBg: 'bg-slate-700',
    badgeText: 'text-white',
    bannerBg: 'bg-slate-200 text-slate-950',
    bannerBorder: 'border-y border-slate-300',
    bannerText: 'text-slate-950',
    bannerSubtext: 'text-slate-700',
    rowBg: 'bg-slate-50/50',
    rowHover: 'hover:bg-slate-100/80',
    accentBorder: 'border-l-4 border-slate-500',
    chipBg: 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200',
    chipActive: 'bg-slate-700 text-white border-slate-700 font-bold shadow-xs',
  }
};

const getModuloTheme = (categoriaId: string, moduloPadre?: string): ModuloTheme => {
  if (MODULO_THEMES[categoriaId]) return MODULO_THEMES[categoriaId];
  if (moduloPadre && MODULO_THEMES[moduloPadre]) return MODULO_THEMES[moduloPadre];

  // Try matching by number prefix (e.g. "1. Dashboard" -> "1")
  const numMatch = categoriaId.match(/^(\d+)/)?.[1];
  if (numMatch) {
    const byNum = Object.values(MODULO_THEMES).find(t => t.number === numMatch);
    if (byNum) return byNum;
  }

  // Try matching by name
  const catLower = categoriaId.toLowerCase();
  const modLower = (moduloPadre || '').toLowerCase();
  for (const t of Object.values(MODULO_THEMES)) {
    if (catLower.includes(t.name.toLowerCase()) || modLower.includes(t.name.toLowerCase())) {
      return t;
    }
  }

  return MODULO_THEMES['1. Dashboard'];
};

interface MatrizPermisosSubtabProps {
  usuarios: SeguridadUser[];
  inspectedUserId: number | '';
  setInspectedUserId: (id: number | '') => void;
  inspectedUserPerms: {
    usuario: SeguridadUser;
    hasOverrides: boolean;
    effectivePermissions: any;
  } | null;
  setUserForPerms: (u: SeguridadUser) => void;
  roleFilter?: string;
  onRoleFilterChange?: (r: string) => void;
}

export const MatrizPermisosSubtab: React.FC<MatrizPermisosSubtabProps> = ({
  usuarios,
  inspectedUserId,
  setInspectedUserId,
  inspectedUserPerms,
  setUserForPerms,
  roleFilter,
  onRoleFilterChange
}) => {
  // Autenticación y perfil activo
  const { user: currentUser } = useAuth();
  const isSuperadmin = currentUser?.rol === 'SUPERADMIN';
  const isAdmin = currentUser?.rol === 'ADMINISTRADOR';
  const canEditMatrix = isSuperadmin || isAdmin;

  // Estado mutable de la Matriz CRUD con persistencia
  const [matrizCrudData, setMatrizCrudData] = useState<PermisoCrudFila[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CRUD_PERMISOS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading stored matrix:', e);
    }
    return MATRIZ_CRUD_ACCION_ROLES;
  });

  // Modo de vista: 'crud_detallada' (Matriz CRUD por Rol y Acción) o 'resumida_modulo' (15 submódulos)
  const [vistaMatriz, setVistaMatriz] = useState<'crud_detallada' | 'resumida_modulo'>('crud_detallada');

  // Filtros comunes
  const [matrixSearchTerm, setMatrixSearchTerm] = useState('');
  const [matrixCategoryFilter, setMatrixCategoryFilter] = useState('TODOS');
  const [crudActionFilter, setCrudActionFilter] = useState<'TODAS' | CrudActionType>('TODAS');
  const [localRoleFilter, setLocalRoleFilter] = useState<string>('TODOS');
  const [matrixCopiedToast, setMatrixCopiedToast] = useState(false);

  // Estado del Popover de asignación detallada
  const [activePopover, setActivePopover] = useState<{
    rowId: string;
    role: MatrizRoleKey;
    submodulo: string;
    accion: CrudActionType;
    currentVal: string;
    currentNota?: string;
    x: number;
    y: number;
  } | null>(null);

  // Menú de asignación por lote para toda una fila
  const [activeRowMenu, setActiveRowMenu] = useState<{
    rowId: string;
    submodulo: string;
    accion: CrudActionType;
    x: number;
    y: number;
  } | null>(null);

  // Notificación tipo toast
  const [toastMsg, setToastMsg] = useState<{ text: string; type?: 'success' | 'info' | 'warning' } | null>(null);

  const activeRoleFilter = roleFilter !== undefined ? roleFilter : localRoleFilter;
  const handleRoleFilterChange = (val: string) => {
    if (onRoleFilterChange) {
      onRoleFilterChange(val);
    } else {
      setLocalRoleFilter(val);
    }
  };

  // Detectar celdas modificadas respecto a la línea base oficial (7 roles canónicos)
  const modifiedCells = useMemo(() => {
    const map: Record<string, boolean> = {};
    const originalMap = new Map(MATRIZ_CRUD_ACCION_ROLES.map(r => [r.id, r]));

    matrizCrudData.forEach(row => {
      const orig = originalMap.get(row.id);
      if (!orig) return;
      CANONICAL_MATRIX_ROLES.forEach(({ key: roleKey }) => {
        if (row.permisos[roleKey] !== orig.permisos[roleKey]) {
          map[`${row.id}-${roleKey}`] = true;
        }
      });
    });

    return map;
  }, [matrizCrudData]);

  const totalModifiedCount = Object.keys(modifiedCells).length;

  // Asignar un permiso específico
  const handleAssignPermission = (
    rowId: string, 
    role: MatrizRoleKey, 
    newVal: string, 
    newNota?: string
  ) => {
    if (!canEditMatrix) {
      setToastMsg({ text: 'Acción no permitida: Se requiere perfil SUPERADMIN o ADMINISTRADOR.', type: 'warning' });
      setTimeout(() => setToastMsg(null), 3000);
      return;
    }
    if (!isSuperadmin && role === 'SUPERADMIN') {
      setToastMsg({ text: 'Los permisos de SUPERADMIN están blindados institucionalmente.', type: 'warning' });
      setTimeout(() => setToastMsg(null), 3000);
      return;
    }

    setMatrizCrudData(prev => {
      const updated = prev.map(r => {
        if (r.id === rowId) {
          return {
            ...r,
            permisos: {
              ...r.permisos,
              [role]: newVal
            },
            ...(newNota !== undefined ? { nota: newNota } : {})
          };
        }
        return r;
      });

      try {
        localStorage.setItem(STORAGE_KEY_CRUD_PERMISOS, JSON.stringify(updated));
      } catch (_) {}

      return updated;
    });

    setToastMsg({
      text: `Permiso asignado: ${role} ➔ ${newVal}`,
      type: 'success'
    });
    setTimeout(() => setToastMsg(null), 2500);
  };

  // Alternar rápidamente permiso al hacer clic directo en la celda
  const handleCellClick = (
    row: PermisoCrudFila, 
    role: MatrizRoleKey
  ) => {
    if (!canEditMatrix) return;
    if (!isSuperadmin && role === 'SUPERADMIN') return;

    const currentVal = row.permisos[role];
    // Alternancia directa: si está permitido (✔, ✔*, ✔**) pasa a denegado (✘); si está denegado (✘, ✘***) pasa a permitido (✔)
    const isPermitted = currentVal.includes('✔');
    const nextVal = isPermitted ? '✘' : '✔';

    handleAssignPermission(row.id, role, nextVal);
  };

  // Asignar en lote para una fila completa
  const handleBatchRowAssign = (
    rowId: string, 
    mode: 'allow_all' | 'deny_all' | 'allow_operativos' | 'deny_consultivos' | 'only_superadmin'
  ) => {
    if (!canEditMatrix) return;

    setMatrizCrudData(prev => {
      const updated = prev.map(r => {
        if (r.id !== rowId) return r;

        const newPerms = { ...r.permisos };

        if (mode === 'allow_all') {
          if (isSuperadmin) newPerms.SUPERADMIN = '✔';
          newPerms.ADMINISTRADOR = '✔';
          newPerms.COORDINADOR = '✔';
          newPerms.DOCENTE = '✔';
          newPerms.OPERADOR = '✔';
          newPerms.AUDITOR = '✔';
          newPerms.CONDULTA = '✔';
        } else if (mode === 'deny_all') {
          // Si no es superadmin, no toca superadmin
          if (isSuperadmin) newPerms.SUPERADMIN = '✔'; // Se mantiene total para superadmin
          newPerms.ADMINISTRADOR = '✘';
          newPerms.COORDINADOR = '✘';
          newPerms.DOCENTE = '✘';
          newPerms.OPERADOR = '✘';
          newPerms.AUDITOR = '✘';
          newPerms.CONDULTA = '✘';
        } else if (mode === 'allow_operativos') {
          newPerms.ADMINISTRADOR = '✔';
          newPerms.COORDINADOR = '✔';
          newPerms.OPERADOR = '✔';
        } else if (mode === 'deny_consultivos') {
          newPerms.DOCENTE = '✘';
          newPerms.AUDITOR = '✘';
          newPerms.CONDULTA = '✘';
        } else if (mode === 'only_superadmin') {
          newPerms.SUPERADMIN = '✔';
          newPerms.ADMINISTRADOR = '✘';
          newPerms.COORDINADOR = '✘';
          newPerms.DOCENTE = '✘';
          newPerms.OPERADOR = '✘';
          newPerms.AUDITOR = '✘';
          newPerms.CONDULTA = '✘';
        }

        return { ...r, permisos: newPerms };
      });

      try {
        localStorage.setItem(STORAGE_KEY_CRUD_PERMISOS, JSON.stringify(updated));
      } catch (_) {}

      return updated;
    });

    setActiveRowMenu(null);
    setToastMsg({ text: 'Asignación en lote aplicada a la fila con éxito.', type: 'success' });
    setTimeout(() => setToastMsg(null), 2500);
  };

  // Guardar matriz explícitamente
  const handleSaveMatrix = () => {
    try {
      localStorage.setItem(STORAGE_KEY_CRUD_PERMISOS, JSON.stringify(matrizCrudData));
      setToastMsg({
        text: `Matriz guardada exitosamente (${totalModifiedCount} asignaciones personalizadas activas).`,
        type: 'success'
      });
    } catch (e) {
      setToastMsg({ text: 'Error al persistir la matriz de permisos.', type: 'warning' });
    }
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Restablecer valores originales oficiales
  const handleResetToOfficial = () => {
    if (window.confirm('¿Deseas restablecer todos los permisos de la matriz a los valores normativos institucionales originales? Se descartarán las modificaciones asignadas.')) {
      setMatrizCrudData(MATRIZ_CRUD_ACCION_ROLES);
      try {
        localStorage.removeItem(STORAGE_KEY_CRUD_PERMISOS);
      } catch (_) {}
      setToastMsg({
        text: 'Matriz restablecida a los valores oficiales normativos.',
        type: 'info'
      });
      setTimeout(() => setToastMsg(null), 3000);
    }
  };

  // 1. Filtrado de la Matriz Resumida de 15 submódulos
  const filteredMatrizResumida = useMemo(() => {
    return MATRIZ_PERMISOS_OFICIAL_6_ROLES.filter(row => {
      const q = matrixSearchTerm.toLowerCase().trim();
      const matchesSearch = 
        !q ||
        row.submodulo.toLowerCase().includes(q) ||
        row.moduloPadre.toLowerCase().includes(q) ||
        (row.descripcion && row.descripcion.toLowerCase().includes(q)) ||
        Object.values(row.permisos).some(p => p.toLowerCase().includes(q));

      const matchesCat = matrixCategoryFilter === 'TODOS' || row.categoriaId === matrixCategoryFilter;
      return matchesSearch && matchesCat;
    });
  }, [matrixSearchTerm, matrixCategoryFilter]);

  // 2. Filtrado de la Matriz CRUD Detallada (52 filas por acción con datos mutables)
  const filteredMatrizCrud = useMemo(() => {
    return matrizCrudData.filter(row => {
      const q = matrixSearchTerm.toLowerCase().trim();
      const matchesSearch = 
        !q ||
        row.submodulo.toLowerCase().includes(q) ||
        row.moduloPadre.toLowerCase().includes(q) ||
        row.accion.toLowerCase().includes(q) ||
        (row.nota && row.nota.toLowerCase().includes(q)) ||
        Object.values(row.permisos).some((p: any) => typeof p === 'string' && p.toLowerCase().includes(q));

      const matchesCat = matrixCategoryFilter === 'TODOS' || row.categoriaId === matrixCategoryFilter;
      const matchesAction = crudActionFilter === 'TODAS' || row.accion === crudActionFilter;

      return matchesSearch && matchesCat && matchesAction;
    });
  }, [matrizCrudData, matrixSearchTerm, matrixCategoryFilter, crudActionFilter]);

  // Exportar a CSV según la matriz activa y actualizada (7 roles canónicos)
  const exportMatrixToCSV = () => {
    let csvContent = '';

    if (vistaMatriz === 'crud_detallada') {
      const headers = ['Módulo', 'Acción', 'SUPERADMIN', 'ADMINISTRADOR', 'COORDINADOR', 'DOCENTE', 'OPERADOR', 'AUDITOR', 'CONDULTA', 'Nota'];
      const rows = matrizCrudData.map(r => [
        `"${r.submodulo.replace(/"/g, '""')}"`,
        `"${r.accion.replace(/"/g, '""')}"`,
        `"${r.permisos.SUPERADMIN.replace(/"/g, '""')}"`,
        `"${r.permisos.ADMINISTRADOR.replace(/"/g, '""')}"`,
        `"${r.permisos.COORDINADOR.replace(/"/g, '""')}"`,
        `"${r.permisos.DOCENTE.replace(/"/g, '""')}"`,
        `"${r.permisos.OPERADOR.replace(/"/g, '""')}"`,
        `"${r.permisos.AUDITOR.replace(/"/g, '""')}"`,
        `"${r.permisos.CONDULTA.replace(/"/g, '""')}"`,
        `"${(r.nota || '').replace(/"/g, '""')}"`
      ]);
      csvContent = '\uFEFF' + [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    } else {
      const headers = ['Módulo', 'SUPERADMIN', 'ADMINISTRADOR', 'COORDINADOR', 'DOCENTE', 'OPERADOR', 'AUDITOR', 'CONDULTA'];
      const rows = MATRIZ_PERMISOS_OFICIAL_6_ROLES.map(r => [
        `"${r.submodulo.replace(/"/g, '""')}"`,
        `"${r.permisos.SUPERADMIN.replace(/"/g, '""')}"`,
        `"${r.permisos.ADMINISTRADOR.replace(/"/g, '""')}"`,
        `"${r.permisos.COORDINADOR.replace(/"/g, '""')}"`,
        `"${r.permisos.DOCENTE.replace(/"/g, '""')}"`,
        `"${r.permisos.OPERADOR.replace(/"/g, '""')}"`,
        `"${r.permisos.AUDITOR.replace(/"/g, '""')}"`,
        `"${r.permisos.CONDULTA.replace(/"/g, '""')}"`
      ]);
      csvContent = '\uFEFF' + [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', vistaMatriz === 'crud_detallada' ? 'Matriz_Permisos_CRUD_Accion_7Roles_ISUJ.csv' : 'Matriz_Permisos_Modulo_7Roles_ISUJ.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Copiar al portapapeles en formato TSV (7 roles canónicos)
  const copyMatrixToClipboard = async () => {
    let lines: string[] = [];

    if (vistaMatriz === 'crud_detallada') {
      const headers = ['Módulo', 'Acción', 'SUPERADMIN', 'ADMINISTRADOR', 'COORDINADOR', 'DOCENTE', 'OPERADOR', 'AUDITOR', 'CONDULTA', 'Nota'];
      lines = [
        headers.join('\t'),
        ...matrizCrudData.map(r => 
          [r.submodulo, r.accion, r.permisos.SUPERADMIN, r.permisos.ADMINISTRADOR, r.permisos.COORDINADOR, r.permisos.DOCENTE, r.permisos.OPERADOR, r.permisos.AUDITOR, r.permisos.CONDULTA, r.nota || ''].join('\t')
        )
      ];
    } else {
      const headers = ['Módulo', 'SUPERADMIN', 'ADMINISTRADOR', 'COORDINADOR', 'DOCENTE', 'OPERADOR', 'AUDITOR', 'CONDULTA'];
      lines = [
        headers.join('\t'),
        ...MATRIZ_PERMISOS_OFICIAL_6_ROLES.map(r => 
          [r.submodulo, r.permisos.SUPERADMIN, r.permisos.ADMINISTRADOR, r.permisos.COORDINADOR, r.permisos.DOCENTE, r.permisos.OPERADOR, r.permisos.AUDITOR, r.permisos.CONDULTA].join('\t')
        )
      ];
    }

    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setMatrixCopiedToast(true);
      setTimeout(() => setMatrixCopiedToast(false), 2500);
    } catch (_) {}
  };

  // Renderizar celda de la matriz resumida
  const renderPermisoBadgeResumido = (val: string) => {
    if (!val || val === '✗') {
      return (
        <span 
          className="inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded-md bg-rose-50 text-rose-600 border border-rose-200 text-xs font-black select-none shadow-2xs"
          title="Sin acceso o privilegio denegado normativamente"
        >
          ✗
        </span>
      );
    }

    if (val.includes('CRUD total')) {
      return (
        <span className="inline-block px-2.5 py-1 rounded-md text-[11px] bg-purple-100 text-purple-950 border border-purple-300 font-black shadow-2xs whitespace-nowrap">
          {val}
        </span>
      );
    }

    if (val.includes('CRUD')) {
      return (
        <span className="inline-block px-2.5 py-1 rounded-md text-[11px] bg-emerald-100 text-emerald-950 border border-emerald-300 font-black shadow-2xs whitespace-nowrap">
          {val}
        </span>
      );
    }

    if (val.includes('Crear') || val.includes('Editar') || val.includes('Solicitar')) {
      return (
        <span className="inline-block px-2.5 py-1 rounded-md text-[11px] bg-amber-100 text-amber-950 border border-amber-300 font-bold shadow-2xs whitespace-nowrap">
          {val}
        </span>
      );
    }

    if (val.includes('Exportar') || val.includes('exportar')) {
      return (
        <span className="inline-block px-2.5 py-1 rounded-md text-[11px] bg-teal-100 text-teal-950 border border-teal-300 font-bold shadow-2xs whitespace-nowrap">
          {val}
        </span>
      );
    }

    if (val.startsWith('Ver')) {
      return (
        <span className="inline-block px-2.5 py-1 rounded-md text-[11px] bg-blue-100 text-blue-950 border border-blue-200 font-medium shadow-2xs whitespace-nowrap">
          {val}
        </span>
      );
    }

    return (
      <span className="inline-block px-2.5 py-1 rounded-md text-[11px] bg-slate-100 text-slate-800 border border-slate-200 font-medium shadow-2xs whitespace-nowrap">
        {val}
      </span>
    );
  };

  // Renderizar celda de la matriz CRUD por Acción (✔, ✘, ✔*, ✔**, ✘***)
  const renderPermisoBadgeCrud = (val: string, nota?: string) => {
    if (!val || val === '✘') {
      return (
        <span 
          className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 text-sm font-black select-none shadow-2xs"
          title="Denegado / Sin permiso"
        >
          ✘
        </span>
      );
    }

    if (val === '✘***') {
      return (
        <span 
          className="inline-flex items-center justify-center px-2 h-7 rounded-lg bg-amber-50 text-amber-900 border border-amber-300 text-xs font-black select-none shadow-2xs cursor-help"
          title="Solicitud / Trámite requerido (no modifica directamente, requiere visto bueno)"
        >
          ✘***
        </span>
      );
    }

    if (val === '✔**') {
      return (
        <span 
          className="inline-flex items-center justify-center px-2 h-7 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-300 text-xs font-black select-none shadow-2xs cursor-help"
          title="Permitido excepto sobre cuentas/roles Superadmin"
        >
          ✔**
        </span>
      );
    }

    if (val === '✔*') {
      return (
        <span 
          className="inline-flex items-center justify-center px-2 h-7 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-300 text-xs font-black select-none shadow-2xs cursor-help"
          title={nota ? `Ámbito delimitado: ${nota}` : 'Permitido con alcance limitado a su sede, carga o infraestructura'}
        >
          ✔*
        </span>
      );
    }

    if (val === '✔') {
      return (
        <span 
          className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-500 text-white text-sm font-black select-none shadow-xs"
          title="Permitido total sin restricción"
        >
          ✔
        </span>
      );
    }

    return (
      <span className="inline-flex items-center justify-center px-2 h-7 rounded-lg bg-slate-100 text-slate-800 border border-slate-200 text-xs font-bold">
        {val}
      </span>
    );
  };

  // Badge para la acción CRUD
  const renderAccionBadge = (accion: CrudActionType) => {
    switch (accion) {
      case 'Crear':
        return (
          <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-black bg-blue-100 text-blue-900 border border-blue-200">
            Crear
          </span>
        );
      case 'Leer':
        return (
          <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 text-sky-900 border border-sky-200">
            Leer
          </span>
        );
      case 'Actualizar':
        return (
          <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-950 border border-amber-300">
            Actualizar
          </span>
        );
      case 'Eliminar':
        return (
          <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-900 border border-rose-200">
            Eliminar
          </span>
        );
      case 'Exportar':
        return (
          <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-black bg-teal-100 text-teal-950 border border-teal-300">
            Exportar
          </span>
        );
      default:
        return (
          <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700">
            {accion}
          </span>
        );
    }
  };

  // Renderizar celda interactiva para la matriz CRUD (7 roles canónicos)
  const renderInteractiveCell = (
    row: PermisoCrudFila,
    role: MatrizRoleKey
  ) => {
    const val = row.permisos[role];
    const isLockedForAdmin = !isSuperadmin && role === 'SUPERADMIN';
    const isEditable = canEditMatrix && !isLockedForAdmin;
    const isModified = !!modifiedCells[`${row.id}-${role}`];

    const isPermitted = val.startsWith('✔');
    const isSpecialScope = val === '✔*' || val === '✔**';
    const isSpecialDenied = val === '✘***';

    if (!isEditable) {
      return (
        <div className="inline-flex items-center justify-center gap-1 group">
          {renderPermisoBadgeCrud(val, row.nota)}
          {isLockedForAdmin && canEditMatrix && (
            <span 
              className="text-amber-600/70 hover:text-amber-800 transition cursor-help" 
              title="Permiso de SUPERADMIN blindado institucionalmente contra edición de administradores"
            >
              <Lock className="w-3 h-3" />
            </span>
          )}
        </div>
      );
    }

    return (
      <div className="relative inline-flex items-center justify-center">
        {/* Indicador de celda asignada / modificada */}
        {isModified && (
          <span 
            className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 border-2 border-white shadow-xs z-10 animate-pulse pointer-events-none" 
            title="Permiso asignado/personalizado en esta sesión"
          />
        )}

        <div className="inline-flex items-center rounded-lg shadow-2xs group/btn">
          {/* Botón rápido: clic directo para alternar ✔ y ✘ */}
          <button
            type="button"
            onClick={() => handleCellClick(row, role)}
            className={`h-7 px-2 min-w-[32px] flex items-center justify-center rounded-l-lg font-black text-xs transition cursor-pointer select-none ${
              isPermitted
                ? isSpecialScope
                  ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-950 border border-emerald-300'
                  : 'bg-emerald-500 hover:bg-emerald-600 text-white border border-emerald-600 shadow-xs'
                : isSpecialDenied
                  ? 'bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300'
                  : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
            } active:scale-95`}
            title={`Clic para alternar ${val === '✘' ? 'a Permitido (✔)' : 'a Denegado (✘)'}`}
          >
            <span>{val}</span>
          </button>

          {/* Botón desplegable para opciones avanzadas (alcance, nota, condición) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              const rect = e.currentTarget.getBoundingClientRect();
              setActivePopover({
                rowId: row.id,
                role,
                submodulo: row.submodulo,
                accion: row.accion,
                currentVal: val,
                currentNota: row.nota,
                x: rect.left,
                y: rect.bottom + 4
              });
            }}
            className={`h-7 px-1 flex items-center justify-center rounded-r-lg border-l-0 transition cursor-pointer text-[10px] ${
              isPermitted
                ? isSpecialScope
                  ? 'bg-emerald-200 hover:bg-emerald-300 text-emerald-950 border border-emerald-300'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-600'
                : isSpecialDenied
                  ? 'bg-amber-200 hover:bg-amber-300 text-amber-950 border border-amber-300'
                  : 'bg-rose-100 hover:bg-rose-200 text-rose-700 border border-rose-200'
            }`}
            title="Opciones avanzadas: Ámbito (✔*), Condicional (✔**), Trámite (✘***)"
          >
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div id="subtab-matriz-permisos-container" className="space-y-4">
      {/* Banner Principal de la Matriz Oficial */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#280740] text-[#e5a800] flex items-center justify-center shrink-0 shadow-xs border border-amber-400/40">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-slate-900 text-base sm:text-lg tracking-tight">
                  {vistaMatriz === 'crud_detallada' ? 'Matriz de Permisos (CRUD) por Rol' : 'Matriz Institucional RBAC por Módulo'}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                  {vistaMatriz === 'crud_detallada' ? `${matrizCrudData.length} Operaciones CRUD × 7 Roles` : `${MATRIZ_PERMISOS_OFICIAL_6_ROLES.length} Módulos × 7 Roles`}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Definición normativa de privilegios institucionales para SUPERADMIN, ADMINISTRADOR, COORDINADOR, DOCENTE, OPERADOR, AUDITOR y CONDULTA.
              </p>
            </div>
          </div>

          {/* Selector de Vista y Botones de Acción */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Toggle de Modo de Matriz */}
            <div className="p-1 bg-slate-100 rounded-xl border border-slate-200 flex items-center text-xs font-bold shadow-2xs">
              <button
                type="button"
                onClick={() => setVistaMatriz('crud_detallada')}
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                  vistaMatriz === 'crud_detallada'
                    ? 'bg-[#1f0533] text-amber-300 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <TableProperties className="w-3.5 h-3.5" />
                <span>Matriz CRUD por Acción</span>
              </button>

              <button
                type="button"
                onClick={() => setVistaMatriz('resumida_modulo')}
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                  vistaMatriz === 'resumida_modulo'
                    ? 'bg-[#1f0533] text-amber-300 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ListTree className="w-3.5 h-3.5" />
                <span>Vista Resumida por Módulo</span>
              </button>
            </div>

            <button
              onClick={copyMatrixToClipboard}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-slate-300 shadow-2xs"
              title="Copiar tabla en formato tabulado para Excel o Google Sheets"
            >
              {matrixCopiedToast ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">¡Copiada!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-600" />
                  <span>Copiar Tabla</span>
                </>
              )}
            </button>

            <button
              onClick={exportMatrixToCSV}
              className="px-3.5 py-2 bg-[#1f0533] hover:bg-[#350854] text-amber-300 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer border border-purple-900 shadow-xs"
              title="Descargar matriz activa en archivo CSV oficial"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Exportar CSV</span>
            </button>
          </div>
        </div>

        {/* BARRA DE FILTROS Y BÚSQUEDA */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 pt-2 border-t border-slate-100">
          {/* Buscador */}
          <div className={`${vistaMatriz === 'crud_detallada' ? 'md:col-span-4' : 'md:col-span-5'} relative`}>
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder={vistaMatriz === 'crud_detallada' ? 'Buscar módulo, acción (Crear, Leer...), nota...' : 'Buscar módulo, submódulo o privilegio...'}
              value={matrixSearchTerm}
              onChange={e => setMatrixSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-hidden transition"
            />
            {matrixSearchTerm && (
              <button
                onClick={() => setMatrixSearchTerm('')}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filtro por Módulo Padre */}
          <div className={`${vistaMatriz === 'crud_detallada' ? 'md:col-span-3' : 'md:col-span-4'}`}>
            <select
              value={matrixCategoryFilter}
              onChange={e => setMatrixCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
            >
              <option value="TODOS">Todos los módulos (7)</option>
              <option value="1. Dashboard">1. Dashboard</option>
              <option value="2. Seguridad">2. Seguridad (Usuario, Rol, Permiso, Auditoría)</option>
              <option value="3. Académico">3. Académico (Sede, Escuela, Carrera, Periodo)</option>
              <option value="4. Planificación">4. Planificación (Planificación, Docente, Paralelo)</option>
              <option value="5. Horario">5. Horario</option>
              <option value="6. Asignación de Aulas">6. Aulas (Bloque, Aula, Semáforo, Inventario)</option>
              <option value="7. Reportes">7. Reportes</option>
            </select>
          </div>

          {/* Filtro por Acción CRUD (solo visible en vista CRUD detallada) */}
          {vistaMatriz === 'crud_detallada' && (
            <div className="md:col-span-2">
              <select
                value={crudActionFilter}
                onChange={e => setCrudActionFilter(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
              >
                <option value="TODAS">Todas las acciones</option>
                <option value="Crear">Crear</option>
                <option value="Leer">Leer</option>
                <option value="Actualizar">Actualizar</option>
                <option value="Eliminar">Eliminar</option>
                <option value="Exportar">Exportar</option>
              </select>
            </div>
          )}

          {/* Filtro por Columna de Rol */}
          <div className="md:col-span-3">
            <select
              value={activeRoleFilter}
              onChange={e => handleRoleFilterChange(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
            >
              <option value="TODOS">Mostrar los 7 roles canónicos</option>
              <option value="SUPERADMIN">Solo SUPERADMIN</option>
              <option value="ADMINISTRADOR">Solo ADMINISTRADOR</option>
              <option value="COORDINADOR">Solo COORDINADOR</option>
              <option value="DOCENTE">Solo DOCENTE</option>
              <option value="OPERADOR">Solo OPERADOR</option>
              <option value="AUDITOR">Solo AUDITOR</option>
              <option value="CONDULTA">Solo CONDULTA</option>
            </select>
          </div>
        </div>

        {/* CHIPS DE ACCESO RÁPIDO CON COLOR DE FONDO PARA LOS ÍTEMS PRINCIPALES 1 AL 6 */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] font-bold text-slate-500 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3 text-slate-400" />
            Módulos principales:
          </span>
          <button
            onClick={() => setMatrixCategoryFilter('TODOS')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer border ${
              matrixCategoryFilter === 'TODOS'
                ? 'bg-[#1f0533] text-amber-300 border-[#1f0533] shadow-xs'
                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
            }`}
          >
            Todos (7)
          </button>
          
          {Object.entries(MODULO_THEMES).map(([modKey, theme]) => {
            const isSelected = matrixCategoryFilter === modKey;
            return (
              <button
                key={modKey}
                onClick={() => setMatrixCategoryFilter(isSelected ? 'TODOS' : modKey)}
                className={`px-2.5 py-1 rounded-lg text-xs transition cursor-pointer flex items-center gap-1.5 border shadow-2xs ${
                  isSelected ? theme.chipActive : theme.chipBg
                }`}
                title={`Filtrar solo ${modKey}`}
              >
                <span className={`w-4 h-4 rounded text-[10px] font-black flex items-center justify-center shrink-0 ${
                  isSelected ? 'bg-white/30 text-white' : `${theme.badgeBg} ${theme.badgeText}`
                }`}>
                  {theme.number}
                </span>
                <span className="font-bold">{theme.name}</span>
              </button>
            );
          })}
        </div>

        {/* SECCIÓN INTERACTIVA: INSPECTOR & PERSONALIZADOR DE USUARIOS */}
        <div className="bg-gradient-to-r from-purple-50 via-slate-50 to-amber-50/40 p-4 rounded-xl border border-purple-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-700 text-white flex items-center justify-center shrink-0">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-purple-950 text-xs">
                Inspeccionar o Personalizar Excepciones por Usuario:
              </div>
              <div className="text-[11px] text-slate-600">
                Verifique cómo aplican los roles base o configure excepciones individuales de privilegios.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={inspectedUserId}
              onChange={e => setInspectedUserId(e.target.value ? Number(e.target.value) : '')}
              className="px-3 py-1.5 bg-white border border-purple-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-purple-500 shadow-2xs"
            >
              <option value="">-- Seleccionar usuario a inspeccionar --</option>
              {usuarios.map(u => (
                <option key={u.id_usuario} value={u.id_usuario}>
                  {u.nombres} {u.apellidos} (@{u.username} - {u.rol_nombre})
                </option>
              ))}
            </select>

            {inspectedUserId && (
              <button
                onClick={() => {
                  const target = usuarios.find(u => u.id_usuario === inspectedUserId);
                  if (target) setUserForPerms(target);
                }}
                className="px-3.5 py-1.5 bg-[#1f0533] hover:bg-[#350854] text-amber-300 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Personalizar</span>
              </button>
            )}
          </div>
        </div>

        {/* Alerta de excepciones personalizadas si aplica */}
        {inspectedUserPerms && inspectedUserPerms.hasOverrides && (
          <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 font-bold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>
                El usuario @{inspectedUserPerms.usuario.username} cuenta con excepciones personalizadas registradas que alteran su rol base ({inspectedUserPerms.usuario.rol_nombre}).
              </span>
            </div>
            <button
              onClick={() => {
                const target = usuarios.find(u => u.id_usuario === inspectedUserId);
                if (target) setUserForPerms(target);
              }}
              className="px-2.5 py-1 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700 cursor-pointer"
            >
              Ajustar Permisos
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VISTA 1: MATRIZ DE PERMISOS (CRUD) POR ROL (SOLICITADA)                   */}
        {/* ========================================================================= */}
        {vistaMatriz === 'crud_detallada' && (
          <div className="space-y-3">
            {/* Banner de Asignación Directa de Permisos (para SUPERADMIN y ADMINISTRADOR) */}
            {canEditMatrix ? (
              <div className="p-3.5 bg-gradient-to-r from-purple-950 via-[#2a0740] to-[#1a042b] rounded-2xl text-white flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-md border border-purple-800/80">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center justify-center shrink-0">
                    <Crown className="w-5 h-5 text-amber-300" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black uppercase tracking-wider text-amber-300">
                        Asignación Directa en Matriz (CRUD) Activa
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-800 text-purple-200 border border-purple-600">
                        Usuario con Rol: {currentUser?.rol}
                      </span>
                      {totalModifiedCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-400/40 animate-pulse">
                          {totalModifiedCount} {totalModifiedCount === 1 ? 'permiso personalizado' : 'permisos personalizados'}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-purple-200/90 mt-0.5">
                      Haz clic directo en cualquier celda para alternar el permiso (✔ / ✘) o despliega el menú (▼) para fijar alcances (✔*, ✔**, ✘***) en la misma ventana.
                      {!isSuperadmin && ' Por política de seguridad institucional, la columna SUPERADMIN se mantiene blindada.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                  {totalModifiedCount > 0 && (
                    <button
                      type="button"
                      onClick={handleResetToOfficial}
                      className="px-3 py-1.5 bg-purple-900/60 hover:bg-rose-900/60 text-purple-200 hover:text-rose-200 border border-purple-700/60 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                      title="Revertir cambios y restaurar la matriz oficial inicial"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restablecer Oficial</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleSaveMatrix}
                    className="px-3.5 py-1.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                    title="Guardar asignaciones actuales de la matriz de permisos"
                  >
                    <Save className="w-3.5 h-3.5 text-slate-950" />
                    <span>Guardar Matriz</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 font-medium flex items-center gap-2.5">
                <Info className="w-4 h-4 text-purple-700 shrink-0" />
                <span>
                  Vista normativa de consulta. Para modificar y asignar permisos directamente en esta matriz, inicie sesión con perfil <strong>SUPERADMINISTRADOR</strong> o <strong>ADMINISTRADOR</strong>.
                </span>
              </div>
            )}

            <div className="rounded-2xl border border-slate-300 overflow-hidden shadow-sm bg-white">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#1f0533] text-white select-none">
                    <tr>
                      <th className="p-3.5 pl-4 font-black uppercase text-[11px] border-r border-purple-900 min-w-[220px]">
                        <div className="flex items-center justify-between">
                          <span>Módulo</span>
                          <span className="text-[10px] text-purple-300 font-normal">
                            ({filteredMatrizCrud.length} filas)
                          </span>
                        </div>
                      </th>

                      <th className="p-3 text-center border-r border-purple-900 min-w-[120px]">
                        <span className="font-black text-amber-300 uppercase text-[11px] tracking-wider">
                          Acción
                        </span>
                      </th>

                      {CANONICAL_MATRIX_ROLES.filter(r => activeRoleFilter === 'TODOS' || activeRoleFilter === r.key).map(roleItem => (
                        <th 
                          key={roleItem.key} 
                          className={`p-3 text-center border-r border-purple-900 min-w-[130px] ${roleItem.key === 'SUPERADMIN' ? 'bg-[#280740]' : ''}`}
                        >
                          <div className="flex flex-col items-center gap-0.5">
                            <span className={`font-black ${roleItem.headerColor} uppercase text-[11px] tracking-wider flex items-center gap-1`}>
                              {roleItem.label}
                              {roleItem.key === 'SUPERADMIN' && !isSuperadmin && canEditMatrix && (
                                <Lock className="w-3 h-3 text-amber-400/80" title="Blindado contra edición de Administrador" />
                              )}
                            </span>
                            <span className="text-[9px] text-slate-300/80 font-normal">
                              {roleItem.key === 'SUPERADMIN' 
                                ? (canEditMatrix ? (isSuperadmin ? 'Editable con 1 clic' : 'Blindado institucional') : 'Control Total') 
                                : (canEditMatrix ? 'Asignable con 1 clic' : roleItem.sublabel)}
                            </span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-200">
                    {filteredMatrizCrud.length === 0 ? (
                      <tr>
                        <td colSpan={activeRoleFilter === 'TODOS' ? (2 + CANONICAL_MATRIX_ROLES.length) : 3} className="p-8 text-center text-slate-400">
                          No se encontraron operaciones con los filtros seleccionados.
                        </td>
                      </tr>
                    ) : (
                      filteredMatrizCrud.map((row, idx) => {
                        // Determinar si es la primera fila de un módulo principal para mostrar el banner con su color de fondo
                        const prevRow = idx > 0 ? filteredMatrizCrud[idx - 1] : null;
                        const isNewCategory = !prevRow || prevRow.moduloPadre !== row.moduloPadre;
                        const isNewSubmodule = !prevRow || prevRow.submodulo !== row.submodulo;
                        const theme = getModuloTheme(row.moduloPadre, row.moduloPadre);
                        const totalCols = activeRoleFilter === 'TODOS' ? (2 + CANONICAL_MATRIX_ROLES.length) : 3;

                        return (
                          <React.Fragment key={row.id}>
                            {/* BANNER SEPARADOR DEL ÍTEM PRINCIPAL CON SU COLOR DE FONDO */}
                            {isNewCategory && (
                              <tr className={`${theme.bannerBg} ${theme.bannerBorder} font-bold select-none`}>
                                <td colSpan={totalCols} className="py-2.5 px-4 shadow-2xs">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                      <span className={`w-5 h-5 rounded flex items-center justify-center font-mono font-black text-xs ${theme.badgeBg} ${theme.badgeText} shadow-xs`}>
                                        {theme.number}
                                      </span>
                                      <span className={`text-xs font-black uppercase tracking-wider ${theme.bannerText}`}>
                                        {theme.number}. {theme.name}
                                      </span>
                                    </div>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/80 ${theme.bannerSubtext} border border-slate-300/60 shadow-2xs`}>
                                      Ítem Principal {theme.number}
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            )}

                            <tr 
                              className={`transition ${theme.rowBg} ${theme.rowHover} ${theme.accentBorder} ${isNewSubmodule && !isNewCategory ? 'border-t border-slate-300' : ''}`}
                            >
                              {/* Columna Módulo con indicador de color */}
                              <td className="p-2.5 pl-3 border-r border-slate-200 align-middle">
                                <div className="flex items-start gap-2">
                                  <span className={`w-4 h-4 rounded text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5 shadow-2xs ${theme.badgeBg} ${theme.badgeText}`}>
                                    {theme.number}
                                  </span>
                                  <div>
                                    <div className="font-bold text-slate-900 text-xs tracking-tight">
                                      {row.submodulo}
                                    </div>
                                    {row.nota && (
                                      <div className="text-[10px] text-slate-500 mt-0.5 leading-tight italic">
                                        {row.nota}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>

                              {/* Columna Acción con botón de menú por lote */}
                              <td className="p-2 text-center border-r border-slate-200 align-middle bg-white/60">
                                <div className="inline-flex items-center justify-center gap-1">
                                  {renderAccionBadge(row.accion)}
                                  {canEditMatrix && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        setActiveRowMenu({
                                          rowId: row.id,
                                          submodulo: row.submodulo,
                                          accion: row.accion,
                                          x: rect.left,
                                          y: rect.bottom + 4
                                        });
                                      }}
                                      className="w-5 h-5 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-800 flex items-center justify-center transition cursor-pointer"
                                      title="Asignación rápida en lote para esta fila"
                                    >
                                      <MoreHorizontal className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </td>

                              {CANONICAL_MATRIX_ROLES.filter(r => activeRoleFilter === 'TODOS' || activeRoleFilter === r.key).map(roleItem => (
                                <td 
                                  key={roleItem.key} 
                                  className={`p-2 text-center border-r border-slate-200 align-middle ${roleItem.bgCell}`}
                                >
                                  {renderInteractiveCell(row, roleItem.key)}
                                </td>
                              ))}
                            </tr>
                          </React.Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VISTA 2: MATRIZ RESUMIDA POR MÓDULO (15 SUBMÓDULOS)                       */}
        {/* ========================================================================= */}
        {vistaMatriz === 'resumida_modulo' && (
          <div className="rounded-2xl border border-slate-300 overflow-hidden shadow-sm bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#1f0533] text-white select-none">
                  <tr>
                    <th className="p-3.5 pl-4 font-black uppercase text-[11px] border-r border-purple-900 min-w-[240px] w-1/4">
                      <div className="flex items-center justify-between">
                        <span>Módulo</span>
                        <span className="text-[10px] text-purple-300 font-normal">
                          ({filteredMatrizResumida.length} de {MATRIZ_PERMISOS_OFICIAL_6_ROLES.length})
                        </span>
                      </div>
                    </th>

                    {CANONICAL_MATRIX_ROLES.filter(r => activeRoleFilter === 'TODOS' || activeRoleFilter === r.key).map(roleItem => (
                      <th 
                        key={roleItem.key} 
                        className={`p-3 text-center border-r border-purple-900 min-w-[150px] ${roleItem.key === 'SUPERADMIN' ? 'bg-[#280740]' : ''}`}
                      >
                        <div className="flex flex-col items-center gap-0.5">
                          <span className={`font-black ${roleItem.headerColor} uppercase text-[11px] tracking-wider`}>
                            {roleItem.label}
                          </span>
                          <span className="text-[9px] text-slate-300/80 font-normal">
                            {roleItem.sublabel}
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200">
                  {filteredMatrizResumida.length === 0 ? (
                    <tr>
                      <td colSpan={activeRoleFilter === 'TODOS' ? (1 + CANONICAL_MATRIX_ROLES.length) : 2} className="p-8 text-center text-slate-400">
                        No se encontraron submódulos con los filtros seleccionados.
                      </td>
                    </tr>
                  ) : (
                    filteredMatrizResumida.map((row, idx) => {
                      const prevRow = idx > 0 ? filteredMatrizResumida[idx - 1] : null;
                      const isNewCategory = !prevRow || prevRow.moduloPadre !== row.moduloPadre;
                      const theme = MODULO_THEMES[row.moduloPadre] || MODULO_THEMES['1. Dashboard'];
                      const totalCols = activeRoleFilter === 'TODOS' ? (1 + CANONICAL_MATRIX_ROLES.length) : 2;

                      return (
                        <React.Fragment key={row.id}>
                          {/* BANNER SEPARADOR DEL ÍTEM PRINCIPAL CON SU COLOR DE FONDO */}
                          {isNewCategory && (
                            <tr className={`${theme.bannerBg} ${theme.bannerBorder} font-bold select-none`}>
                              <td colSpan={totalCols} className="py-2.5 px-4 shadow-2xs">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2.5">
                                    <span className={`w-5 h-5 rounded flex items-center justify-center font-mono font-black text-xs ${theme.badgeBg} ${theme.badgeText} shadow-xs`}>
                                      {theme.number}
                                    </span>
                                    <span className={`text-xs font-black uppercase tracking-wider ${theme.bannerText}`}>
                                      {row.moduloPadre}
                                    </span>
                                  </div>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/80 ${theme.bannerSubtext} border border-slate-300/60 shadow-2xs`}>
                                    Ítem Principal {theme.number}
                                  </span>
                                </div>
                              </td>
                            </tr>
                          )}

                          <tr 
                            className={`transition ${theme.rowBg} ${theme.rowHover} ${theme.accentBorder}`}
                          >
                            <td className="p-3.5 pl-3 border-r border-slate-200">
                              <div className="flex items-start gap-2">
                                <span className={`w-4 h-4 rounded text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5 shadow-2xs ${theme.badgeBg} ${theme.badgeText}`}>
                                  {theme.number}
                                </span>
                                <div>
                                  <div className="font-black text-slate-900 text-xs tracking-tight">
                                    {row.submodulo}
                                  </div>
                                  <div className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                                    {row.descripcion}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {CANONICAL_MATRIX_ROLES.filter(r => activeRoleFilter === 'TODOS' || activeRoleFilter === r.key).map(roleItem => (
                              <td 
                                key={roleItem.key} 
                                className={`p-3 text-center border-r border-slate-200 ${roleItem.bgCell}`}
                              >
                                {renderPermisoBadgeResumido((row.permisos as any)[roleItem.key] || '✗')}
                              </td>
                            ))}
                          </tr>
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* GUÍA, SIMBOLOGÍA Y CONVENCIONES DE PRIVILEGIOS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          {/* Leyenda de Símbolos y Asteriscos */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
            <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
              <Info className="w-4 h-4 text-purple-700" />
              <span>Simbología y Convenciones CRUD:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-700">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-emerald-500 text-white flex items-center justify-center font-black text-xs shrink-0">
                  ✔
                </span>
                <span><strong>Permitido:</strong> Acceso total a la acción</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center font-black text-xs shrink-0">
                  ✘
                </span>
                <span><strong>Denegado:</strong> Sin privilegios en el módulo</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-1.5 h-6 rounded-md bg-emerald-50 text-emerald-900 border border-emerald-300 flex items-center justify-center font-black text-[11px] shrink-0">
                  ✔*
                </span>
                <span><strong>Ámbito limitado:</strong> Su sede, su carga o su área</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-1.5 h-6 rounded-md bg-emerald-50 text-emerald-900 border border-emerald-300 flex items-center justify-center font-black text-[11px] shrink-0">
                  ✔**
                </span>
                <span><strong>Jerarquía:</strong> Excepto cuentas de Superadmin</span>
              </div>
              <div className="flex items-center gap-2 sm:col-span-2">
                <span className="px-1.5 h-6 rounded-md bg-amber-50 text-amber-900 border border-amber-300 flex items-center justify-center font-black text-[11px] shrink-0">
                  ✘***
                </span>
                <span><strong>Solicitud requerida:</strong> No asigna directamente; genera requerimiento/trámite al Operador</span>
              </div>
            </div>
          </div>

          {/* Notas Normativas por Rol (7 Roles Canónicos) */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-[11px] text-slate-600">
            <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Alcance Normativo de Competencias (7 Roles Canónicos):</span>
            </div>
            <ul className="space-y-1 leading-relaxed list-disc list-inside">
              <li><strong className="text-slate-900">SUPERADMIN:</strong> Dominio y gobierno absoluto sobre todos los módulos, roles y auditoría inmutable.</li>
              <li><strong className="text-slate-900">ADMINISTRADOR:</strong> Operación integral institucional (excluyendo blindaje de seguridad del Superadmin).</li>
              <li><strong className="text-slate-900">COORDINADOR:</strong> Planificación, horarios y docentes en su sede/escuela; lectura de auditoría de su ámbito.</li>
              <li><strong className="text-slate-900">DOCENTE:</strong> Consulta de su carga académica, su horario asignado y ficha de distributivo docente.</li>
              <li><strong className="text-slate-900">OPERADOR:</strong> Gobierno físico de bloques, aulas, laboratorios, semáforo de asignación e inventario.</li>
              <li><strong className="text-slate-900">AUDITOR:</strong> Supervisión de bitácoras de seguridad, logs de acceso y trazabilidad de operaciones.</li>
              <li><strong className="text-slate-900">CONDULTA:</strong> Consulta y visualización institucional de horarios, catálogos y reportes oficiales.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Popover flotante para asignación avanzada de celda */}
      {activePopover && (
        <>
          <div 
            className="fixed inset-0 z-40 bg-black/10" 
            onClick={() => setActivePopover(null)} 
          />
          <div 
            className="fixed z-50 bg-white rounded-xl border border-slate-300 shadow-xl p-3 w-72 text-xs space-y-2 animate-in fade-in zoom-in-95 duration-100"
            style={{ 
              top: Math.min(activePopover.y, window.innerHeight - 300), 
              left: Math.min(activePopover.x, window.innerWidth - 300) 
            }}
          >
            <div className="border-b border-slate-200 pb-2">
              <div className="font-black text-slate-900 text-xs flex items-center justify-between">
                <span>{activePopover.role}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-900">
                  {activePopover.accion}
                </span>
              </div>
              <div className="text-[10px] text-slate-500 truncate mt-0.5">
                {activePopover.submodulo}
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Seleccionar Privilegio
              </span>
              <button
                type="button"
                onClick={() => handleAssignPermission(activePopover.rowId, activePopover.role, '✔')}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition cursor-pointer ${
                  activePopover.currentVal === '✔' ? 'bg-emerald-100 text-emerald-900 font-bold' : 'hover:bg-slate-100 text-slate-700'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded bg-emerald-500 text-white flex items-center justify-center font-black text-xs">✔</span>
                  <span>Permitido Total</span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleAssignPermission(activePopover.rowId, activePopover.role, '✔*')}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition cursor-pointer ${
                  activePopover.currentVal === '✔*' ? 'bg-emerald-100 text-emerald-900 font-bold' : 'hover:bg-slate-100 text-slate-700'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="px-1 h-5 rounded bg-emerald-100 border border-emerald-300 text-emerald-900 flex items-center justify-center font-black text-[10px]">✔*</span>
                  <span>Ámbito Limitado (Sede / Carga)</span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleAssignPermission(activePopover.rowId, activePopover.role, '✔**')}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition cursor-pointer ${
                  activePopover.currentVal === '✔**' ? 'bg-emerald-100 text-emerald-900 font-bold' : 'hover:bg-slate-100 text-slate-700'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="px-1 h-5 rounded bg-emerald-100 border border-emerald-300 text-emerald-900 flex items-center justify-center font-black text-[10px]">✔**</span>
                  <span>Jerarquía (Excepto Superadmin)</span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleAssignPermission(activePopover.rowId, activePopover.role, '✘***')}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition cursor-pointer ${
                  activePopover.currentVal === '✘***' ? 'bg-amber-100 text-amber-900 font-bold' : 'hover:bg-slate-100 text-slate-700'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="px-1 h-5 rounded bg-amber-100 border border-amber-300 text-amber-900 flex items-center justify-center font-black text-[10px]">✘***</span>
                  <span>Trámite / Solicitud previa</span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleAssignPermission(activePopover.rowId, activePopover.role, '✘')}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition cursor-pointer ${
                  activePopover.currentVal === '✘' ? 'bg-rose-100 text-rose-900 font-bold' : 'hover:bg-slate-100 text-slate-700'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded bg-rose-100 border border-rose-300 text-rose-700 flex items-center justify-center font-black text-xs">✘</span>
                  <span>Denegado (Sin acceso)</span>
                </span>
              </button>
            </div>

            <div className="pt-2 border-t border-slate-200">
              <label className="text-[10px] font-bold text-slate-500 block mb-1">
                Nota / Condición normativa:
              </label>
              <input
                type="text"
                defaultValue={activePopover.currentNota || ''}
                placeholder="Ej. Requiere visto bueno de Dirección"
                onBlur={(e) => {
                  const val = e.target.value;
                  handleAssignPermission(activePopover.rowId, activePopover.role, activePopover.currentVal, val);
                }}
                className="w-full px-2 py-1 border border-slate-300 rounded text-xs text-slate-800"
              />
            </div>
          </div>
        </>
      )}

      {/* Menú por lote de fila */}
      {activeRowMenu && (
        <>
          <div 
            className="fixed inset-0 z-40 bg-black/10" 
            onClick={() => setActiveRowMenu(null)} 
          />
          <div 
            className="fixed z-50 bg-white rounded-xl border border-slate-300 shadow-xl p-2.5 w-64 text-xs space-y-1 animate-in fade-in zoom-in-95 duration-100"
            style={{ 
              top: Math.min(activeRowMenu.y, window.innerHeight - 250), 
              left: Math.min(activeRowMenu.x, window.innerWidth - 270) 
            }}
          >
            <div className="font-bold text-slate-800 px-2 py-1 text-[11px] border-b border-slate-200">
              Asignación en lote: {activeRowMenu.accion}
            </div>
            <button
              type="button"
              onClick={() => handleBatchRowAssign(activeRowMenu.rowId, 'allow_all')}
              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-emerald-50 text-emerald-800 font-bold transition cursor-pointer"
            >
              Permitir a todos (✔)
            </button>
            <button
              type="button"
              onClick={() => handleBatchRowAssign(activeRowMenu.rowId, 'allow_operativos')}
              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-purple-50 text-purple-800 font-medium transition cursor-pointer"
            >
              Habilitar Operativos (Admin, Coord, Operador)
            </button>
            <button
              type="button"
              onClick={() => handleBatchRowAssign(activeRowMenu.rowId, 'deny_consultivos')}
              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-slate-700 font-medium transition cursor-pointer"
            >
              Denegar Consultivos (Docente, Auditor, Condulta)
            </button>
            <button
              type="button"
              onClick={() => handleBatchRowAssign(activeRowMenu.rowId, 'only_superadmin')}
              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-amber-50 text-amber-900 font-medium transition cursor-pointer"
            >
              Exclusivo Superadmin
            </button>
            <button
              type="button"
              onClick={() => handleBatchRowAssign(activeRowMenu.rowId, 'deny_all')}
              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-rose-50 text-rose-800 font-bold transition cursor-pointer"
            >
              Denegar a todos (✘)
            </button>
          </div>
        </>
      )}
    </div>
  );
};
