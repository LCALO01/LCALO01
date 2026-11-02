import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../controllers/authContext.tsx';
import { getGrupoConfig } from '../types.ts';
import { 
  Menu, 
  RotateCcw, 
  ChevronDown, 
  ShieldCheck, 
  User, 
  Calendar,
  CheckCircle2,
  Network,
  LogOut,
  Pin
} from 'lucide-react';

interface TopbarProps {
  onToggleSidebar: () => void;
  onRestoreData?: () => void;
  isRestoring?: boolean;
  onOpenStructureModal?: () => void;
  isSidebarFixed?: boolean;
}

export const Topbar: React.FC<TopbarProps> = ({ 
  onToggleSidebar, 
  onRestoreData,
  isRestoring = false,
  onOpenStructureModal,
  isSidebarFixed = true
}) => {
  const { user, setRole, loginAs, availableAccounts, logout } = useAuth();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showPeriodMenu, setShowPeriodMenu] = useState(false);
  const [currentPeriod, setCurrentPeriod] = useState('PER-2026-1 (ACTIVO)');

  const periodMenuRef = useRef<HTMLDivElement>(null);
  const roleMenuRef = useRef<HTMLDivElement>(null);

  // Close menus on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (periodMenuRef.current && !periodMenuRef.current.contains(event.target as Node)) {
        setShowPeriodMenu(false);
      }
      if (roleMenuRef.current && !roleMenuRef.current.contains(event.target as Node)) {
        setShowRoleMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getInitials = (name: string) => {
    if (!name) return 'AD';
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header className="bg-[#280740] text-white border-b-2 border-[#e5a800] sticky top-0 z-40 h-14 shadow-md select-none shrink-0 w-full">
      <div className="h-full px-3 sm:px-5 flex items-center justify-between max-w-[1920px] mx-auto">
        
        {/* Left: Brand Logo & Hamburger */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#e5a800] flex items-center justify-center font-black text-[#280740] text-lg shadow-sm border border-amber-300">
              G
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-bold text-base sm:text-lg tracking-tight text-white">
                Gestión Académica
              </span>
              <span className="bg-[#e5a800] text-[#280740] font-black text-[10px] sm:text-[11px] px-1.5 sm:px-2 py-0.5 rounded font-sans tracking-wider shadow-xs">
                ISUJ
              </span>
            </div>
          </div>

          {/* Hamburger toggle button - Fixeado y congelado */}
          <button
            onClick={onToggleSidebar}
            className="flex items-center gap-1.5 px-2 py-1.5 sm:px-2.5 sm:py-1.5 ml-0.5 sm:ml-1 bg-[#1f0533] hover:bg-[#380b59] active:bg-[#4a0e78] text-amber-300 hover:text-amber-200 border border-purple-700/80 hover:border-amber-400/60 rounded-lg transition-all cursor-pointer shadow-xs active:scale-95 group min-h-[34px]"
            title={isSidebarFixed ? "Menú lateral congelado (fixed) en pantalla" : "Mostrar / Ocultar menú de navegación"}
            aria-label="Alternar menú de navegación"
          >
            <Menu className="w-4 h-4 text-amber-300 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-purple-100 group-hover:text-amber-300 hidden sm:inline">
              Menú
            </span>
            {isSidebarFixed && (
              <span className="text-[10px] bg-amber-400/20 text-amber-300 font-extrabold px-1.5 py-0.2 rounded border border-amber-400/30 font-mono hidden md:inline-flex items-center gap-0.5">
                <Pin className="w-2.5 h-2.5 fill-amber-300 rotate-45" />
                FIXED
              </span>
            )}
          </button>
        </div>

        {/* Center: Period Selector */}
        <div ref={periodMenuRef} className="hidden md:flex items-center relative">
          <button
            onClick={() => setShowPeriodMenu(!showPeriodMenu)}
            className="flex items-center gap-1.5 bg-[#1f0533] hover:bg-[#320852] text-xs font-semibold px-3.5 py-1.5 rounded-full border border-purple-700/60 text-purple-200 transition cursor-pointer shadow-inner"
          >
            <span className="text-purple-300">Periodo:</span>
            <span className="text-[#facc15] font-bold">{currentPeriod}</span>
            <ChevronDown className="w-3.5 h-3.5 text-purple-300 ml-0.5" />
          </button>

          {showPeriodMenu && (
            <div className="absolute top-10 left-1/2 -translate-x-1/2 w-64 bg-[#230638] text-slate-200 rounded-xl shadow-2xl border border-purple-800 py-1.5 z-50 text-xs">
              <div className="px-3 py-1.5 text-[10px] text-amber-300 font-bold uppercase tracking-wider border-b border-purple-900">
                Periodos Académicos
              </div>
              {[
                { id: 'PER-2026-1 (ACTIVO)', label: 'PER-2026-1 (ACTIVO)', sub: 'Marzo - Agosto 2026', active: true },
                { id: 'PER-2026-2 (FUTURO)', label: 'PER-2026-2 (FUTURO)', sub: 'Septiembre - Enero 2027', active: false },
                { id: 'PER-2025-2 (HISTÓRICO)', label: 'PER-2025-2 (HISTÓRICO)', sub: 'Septiembre - Febrero 2026', active: false }
              ].map(p => (
                <button
                  key={p.id}
                  onClick={() => {
                    setCurrentPeriod(p.id);
                    setShowPeriodMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-purple-900/70 transition ${
                    currentPeriod === p.id ? 'bg-purple-900/90 text-amber-300 font-bold' : 'text-purple-100'
                  }`}
                >
                  <div>
                    <div>{p.label}</div>
                    <div className="text-[10px] text-purple-300">{p.sub}</div>
                  </div>
                  {currentPeriod === p.id && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Restaurar Datos & User Pill */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Estructura del Sistema button */}
          {onOpenStructureModal && (
            <button
              onClick={onOpenStructureModal}
              className="flex items-center gap-1.5 bg-[#1f0533] hover:bg-[#380b59] border border-amber-400/60 text-amber-300 text-xs px-2 sm:px-3 py-1.5 rounded-lg transition font-bold cursor-pointer shadow-xs min-h-[36px]"
              title="Ver organigrama y arquitectura del sistema"
            >
              <Network className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden md:inline">Estructura</span>
            </button>
          )}

          {/* Restaurar Datos button */}
          <button
            onClick={onRestoreData}
            disabled={isRestoring}
            className="flex items-center gap-1.5 bg-[#380b59] hover:bg-[#4a0f76] border border-amber-500/40 text-amber-200 text-xs p-1.5 sm:px-3 sm:py-1.5 rounded-lg transition font-medium cursor-pointer shadow-xs disabled:opacity-50 min-h-[36px] min-w-[36px] justify-center"
            title="Recargar y sincronizar datos de SQLite"
          >
            <RotateCcw className={`w-3.5 h-3.5 text-amber-400 ${isRestoring ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isRestoring ? 'Restaurando...' : 'Restaurar'}</span>
          </button>

          {/* User badge with dropdown */}
          <div ref={roleMenuRef} className="relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center gap-1.5 sm:gap-2 bg-[#1f0533] hover:bg-[#320852] p-1 sm:px-2.5 sm:py-1 rounded-full border border-purple-700/80 text-left transition cursor-pointer min-h-[36px]"
              aria-label="Menú de usuario"
            >
              <div className="w-7 h-7 rounded-full bg-[#e5a800] flex items-center justify-center text-xs font-black text-[#280740] shadow-xs shrink-0">
                {getInitials(user.nombre_usuario)}
              </div>
              <span className="text-xs font-bold text-white hidden md:inline truncate max-w-[120px]">
                {user.nombre_usuario}
              </span>
              <span className="bg-amber-400/20 border border-amber-400/40 text-amber-300 text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.2 rounded-full uppercase tracking-wider hidden xs:inline">
                {user.rol}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-purple-300 shrink-0" />
            </button>

            {/* Dropdown for role & user selection */}
            {showRoleMenu && (
              <div className="absolute right-0 mt-2 w-72 max-w-[calc(100vw-16px)] bg-white text-slate-800 rounded-xl shadow-2xl border border-purple-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3.5 py-2 border-b border-purple-50 bg-purple-50/50">
                  <div className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">
                    Usuario Actual
                  </div>
                  <div className="font-bold text-slate-900 mt-0.5 flex items-center justify-between">
                    <span>{user.nombre_usuario}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-900 border border-purple-200 flex items-center gap-1">
                      <span>{getGrupoConfig(user.rol).emoji}</span>
                      <span>{user.rol}</span>
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">{user.correo}</div>
                </div>

                <div className="px-3.5 py-2">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>Simular Grupo / Rol</span>
                    <span className="text-[9px] text-purple-600 font-semibold">8 Grupos</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {([
                      { id: 'SUPERADMIN', emoji: '🔴', label: 'Superadmin' },
                      { id: 'ADMINISTRADOR', emoji: '🟠', label: 'Admin' },
                      { id: 'COORDINADOR', emoji: '🟡', label: 'Coordinador' },
                      { id: 'DOCENTE', emoji: '🔵', label: 'Docente' },
                      { id: 'OPERADOR', emoji: '🟢', label: 'Operador' },
                      { id: 'AUDITOR', emoji: '🟣', label: 'Auditor' },
                      { id: 'INVITADO', emoji: '⚪', label: 'Invitado' },
                      { id: 'CONSULTA', emoji: '🟤', label: 'Consulta' }
                    ] as const).map(r => (
                      <button
                        key={r.id}
                        onClick={() => {
                          setRole(r.id as any);
                          setShowRoleMenu(false);
                        }}
                        className={`text-xs py-1.5 px-2 rounded font-medium text-left flex items-center gap-1.5 border transition ${
                          user.rol === r.id
                            ? 'bg-[#350854] text-amber-300 border-[#350854] shadow-sm font-bold'
                            : 'bg-slate-50 text-slate-700 hover:bg-purple-50 hover:text-purple-900 border-slate-200'
                        }`}
                      >
                        <span className="text-xs">{r.emoji}</span>
                        <span className="truncate">{r.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="px-3.5 pt-2 pb-1 border-t border-slate-100">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Cambiar Cuenta (Base de Datos)
                  </div>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {availableAccounts.map(acc => (
                      <button
                        key={acc.username}
                        onClick={() => {
                          loginAs(acc.username);
                          setShowRoleMenu(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded text-xs flex items-center justify-between transition ${
                          user.nombre_usuario === acc.username
                            ? 'bg-purple-50 text-purple-950 font-bold border border-purple-200'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div>
                          <div>{acc.label}</div>
                          <div className="text-[10px] text-slate-400">{acc.username} ({acc.role})</div>
                        </div>
                        {user.nombre_usuario === acc.username && (
                          <ShieldCheck className="w-4 h-4 text-[#e5a800]" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Logout Option in Dropdown */}
                <div className="p-2 border-t border-slate-100 bg-slate-50/70">
                  <button
                    onClick={() => {
                      setShowRoleMenu(false);
                      logout();
                    }}
                    className="w-full py-1.5 px-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg text-xs flex items-center justify-center gap-2 border border-rose-200 transition cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-600" />
                    <span>Cerrar Sesión / Salir</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Logout Button */}
          <button
            onClick={logout}
            className="flex items-center gap-1.5 bg-[#1f0533] hover:bg-rose-950/60 border border-purple-700/60 hover:border-rose-500/60 text-purple-300 hover:text-rose-300 text-xs p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg transition font-medium cursor-pointer shadow-xs min-h-[36px]"
            title="Cerrar sesión de usuario"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden lg:inline text-[11px]">Salir</span>
          </button>
        </div>

      </div>
    </header>
  );
};
