import React, { useState } from 'react';
import { useAuth } from '../controllers/authContext.tsx';
import { 
  Building2, 
  CalendarDays, 
  LayoutGrid, 
  Layers, 
  FileSpreadsheet, 
  ShieldCheck, 
  UserCheck, 
  AlertCircle,
  Database,
  ChevronDown
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onSelectTab }) => {
  const { user, setRole, loginAs, availableAccounts } = useAuth();
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
    { id: 'asignaciones', label: 'Asignación de Aulas', icon: Layers },
    { id: 'matriz', label: 'Matriz de Horarios', icon: CalendarDays },
    { id: 'aulas', label: 'Espacios y Aulas', icon: Building2 },
    { id: 'feriados', label: 'Feriados 2026', icon: AlertCircle },
    { id: 'reportes', label: 'Reportes (PDF/XLSX/CSV)', icon: FileSpreadsheet },
  ];

  const getRoleBadgeStyle = (rol: string) => {
    switch (rol) {
      case 'ADMINISTRADOR':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'OPERADOR':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'INVITADO':
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <header className="bg-[#280740] text-white border-b-2 border-[#e5a800] sticky top-0 z-40 shadow-sm">
      {/* Top institution & metadata banner */}
      <div className="bg-[#1f0533] px-4 py-1 text-xs text-purple-200 flex flex-wrap items-center justify-between border-b border-purple-900/80">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-[#e5a800]"></span>
          <span className="font-semibold text-white">SEDES INSTITUCIONALES (UIO / SANTO DOMINGO)</span>
          <span className="text-purple-400">|</span>
          <span>ESCUELA DE TECNOLOGÍAS</span>
          <span className="text-purple-400">|</span>
          <span className="bg-[#350854] border border-amber-400/40 px-2 py-0.5 rounded text-amber-300 font-mono font-bold">PERIODO 2026-1</span>
        </div>
        <div className="flex items-center gap-3 text-purple-200">
          <span className="flex items-center gap-1">
            <Database className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-white">SQLite Relacional (MVC)</span>
          </span>
          <span className="text-purple-500">•</span>
          <span className="text-amber-300 font-medium">Gestión Académica ISUJ</span>
        </div>
      </div>

      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#e5a800] flex items-center justify-center text-[#280740] font-bold shadow-md shadow-amber-500/20 border border-amber-300">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-white leading-tight">
                  Gestión Académica
                </h1>
                <span className="bg-[#e5a800] text-[#280740] font-black text-xs px-2 py-0.5 rounded font-sans tracking-wider">
                  ISUJ
                </span>
              </div>
              <p className="text-xs text-purple-200">
                Modelo Vista Controlador • Asignación de Espacios Educativos
              </p>
            </div>
          </div>

          {/* User profile & Role switcher */}
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center gap-2.5 bg-slate-800 hover:bg-slate-750 px-3 py-1.5 rounded-lg border border-slate-700 text-left transition cursor-pointer"
            >
              <div className="w-7 h-7 rounded-full bg-indigo-900 border border-indigo-700 flex items-center justify-center text-xs font-bold text-indigo-200">
                {user.nombre_usuario.slice(0, 2).toUpperCase()}
              </div>
              <div className="hidden sm:block">
                <div className="text-xs font-semibold text-white leading-tight flex items-center gap-1.5">
                  <span>{user.nombre_usuario}</span>
                  <span className={`px-1.5 py-0.2 text-[10px] font-bold rounded border ${getRoleBadgeStyle(user.rol)}`}>
                    {user.rol}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 truncate max-w-[130px]">
                  {user.correo}
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 ml-1" />
            </button>

            {showRoleMenu && (
              <div className="absolute right-0 mt-2 w-72 bg-white text-slate-800 rounded-xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3.5 py-2 border-b border-slate-100">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Perfil Activo
                  </div>
                  <div className="font-bold text-slate-900 mt-0.5">{user.nombre_usuario}</div>
                  <div className="text-xs text-slate-500">{user.correo}</div>
                  <div className="mt-1.5 text-[11px] bg-slate-50 p-2 rounded text-slate-600 border border-slate-100 leading-relaxed">
                    {user.permissions.description}
                  </div>
                </div>

                <div className="px-3.5 py-2">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Cambio Rápido de Rol
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {(['ADMINISTRADOR', 'OPERADOR', 'INVITADO'] as const).map(r => (
                      <button
                        key={r}
                        onClick={() => {
                          setRole(r);
                          setShowRoleMenu(false);
                        }}
                        className={`text-xs py-1.5 px-2 rounded font-medium text-center border transition ${
                          user.rol === r
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                            : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                        }`}
                      >
                        {r === 'ADMINISTRADOR' ? 'Admin' : r === 'OPERADOR' ? 'Operador' : 'Invitado'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="px-3.5 pt-2 pb-1 border-t border-slate-100">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Cuentas del Sistema (SQL)
                  </div>
                  <div className="space-y-1">
                    {availableAccounts.map(acc => (
                      <button
                        key={acc.username}
                        onClick={() => {
                          loginAs(acc.username);
                          setShowRoleMenu(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded text-xs flex items-center justify-between transition ${
                          user.nombre_usuario === acc.username
                            ? 'bg-indigo-50 text-indigo-900 font-semibold'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div>
                          <div>{acc.label}</div>
                          <div className="text-[10px] text-slate-400">{acc.username} ({acc.role})</div>
                        </div>
                        {user.nombre_usuario === acc.username && (
                          <ShieldCheck className="w-4 h-4 text-indigo-600" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 overflow-x-auto py-2 no-scrollbar border-t border-slate-800">
          {navItems.map(item => {
            const Icon = item.icon;
            const active = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition cursor-pointer ${
                  active
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
