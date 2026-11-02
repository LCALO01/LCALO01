import React, { useState } from 'react';
import { useAuth, AccountInfo } from '../../controllers/authContext.tsx';
import { RoleType } from '../../types.ts';
import { 
  ShieldCheck, 
  Lock, 
  User, 
  Mail, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ArrowRight,
  GraduationCap,
  Sparkles,
  KeyRound,
  Building2,
  BookOpen,
  UserCheck
} from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login, loginAsProfile, availableAccounts } = useAuth();

  const [identifier, setIdentifier] = useState<string>('superadmin');
  const [password, setPassword] = useState<string>('super123');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [selectedRole, setSelectedRole] = useState<RoleType>('SUPERADMIN');
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!identifier.trim()) {
      setErrorMessage('Por favor ingrese su usuario o correo institucional.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await login(identifier, password);
      if (!result.success) {
        setErrorMessage(result.message || 'Error de autenticación. Verifique sus credenciales.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'No fue posible iniciar sesión. Verifique sus credenciales.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectProfile = (account: AccountInfo) => {
    setSelectedRole(account.role);
    setIdentifier(account.username);
    setPassword(account.defaultPassword || 'super123');
    setErrorMessage(null);
  };

  const handleQuickLoginAsRole = async (account: AccountInfo) => {
    handleSelectProfile(account);
    setIsLoading(true);
    try {
      await loginAsProfile(account.role);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al autenticar por perfil.');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper icons and color themes per role matching canonical institutional groups
  const getRoleBadgeStyle = (role: RoleType) => {
    switch (role) {
      case 'SUPERADMIN':
        return {
          bg: 'bg-red-50 text-red-700 border-red-300',
          activeBg: 'bg-red-700 text-white border-red-700 shadow-md',
          icon: ShieldCheck,
          emoji: '🔴',
          label: 'Superadministrador'
        };
      case 'ADMINISTRADOR':
        return {
          bg: 'bg-orange-50 text-orange-800 border-orange-300',
          activeBg: 'bg-orange-600 text-white border-orange-600 shadow-md',
          icon: UserCheck,
          emoji: '🟠',
          label: 'Administrador'
        };
      case 'COORDINADOR':
        return {
          bg: 'bg-amber-50 text-amber-900 border-amber-300',
          activeBg: 'bg-amber-600 text-white border-amber-600 shadow-md',
          icon: BookOpen,
          emoji: '🟡',
          label: 'Coordinador'
        };
      case 'DOCENTE':
        return {
          bg: 'bg-blue-50 text-blue-900 border-blue-300',
          activeBg: 'bg-blue-700 text-white border-blue-700 shadow-md',
          icon: GraduationCap,
          emoji: '🔵',
          label: 'Docente Titular'
        };
      case 'OPERADOR':
        return {
          bg: 'bg-emerald-50 text-emerald-900 border-emerald-300',
          activeBg: 'bg-emerald-700 text-white border-emerald-700 shadow-md',
          icon: Building2,
          emoji: '🟢',
          label: 'Operador'
        };
      case 'AUDITOR':
        return {
          bg: 'bg-purple-50 text-purple-950 border-purple-300',
          activeBg: 'bg-purple-800 text-white border-purple-800 shadow-md',
          icon: ShieldCheck,
          emoji: '🟣',
          label: 'Auditor Forense'
        };
      case 'INVITADO':
        return {
          bg: 'bg-slate-100 text-slate-800 border-slate-300',
          activeBg: 'bg-slate-700 text-white border-slate-700 shadow-md',
          icon: Sparkles,
          emoji: '⚪',
          label: 'Invitado'
        };
      case 'CONSULTA':
      case 'USUARIO_CONSULTA':
        return {
          bg: 'bg-stone-100 text-stone-900 border-stone-400',
          activeBg: 'bg-stone-700 text-white border-stone-700 shadow-md',
          icon: User,
          emoji: '🟤',
          label: 'Consulta Académica'
        };
      case 'SECRETARIA':
        return {
          bg: 'bg-pink-50 text-pink-800 border-pink-200',
          activeBg: 'bg-pink-900 text-white border-pink-900',
          icon: User,
          emoji: '📋',
          label: 'Secretaría'
        };
      case 'ESTUDIANTE':
        return {
          bg: 'bg-teal-50 text-teal-800 border-teal-200',
          activeBg: 'bg-teal-900 text-white border-teal-900',
          icon: GraduationCap,
          emoji: '🎓',
          label: 'Estudiante'
        };
      default:
        return {
          bg: 'bg-slate-50 text-slate-700 border-slate-200',
          activeBg: 'bg-slate-800 text-white border-slate-800',
          icon: Sparkles,
          emoji: '⚪',
          label: 'Usuario'
        };
    }
  };

  return (
    <div className="min-h-screen w-full bg-linear-to-br from-[#1b032d] via-[#280740] to-[#12021e] flex flex-col justify-between py-6 px-4 sm:px-6 lg:px-8 font-sans select-none overflow-y-auto">
      
      {/* Top Bar / Header Logo */}
      <div className="max-w-5xl w-full mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#e5a800] flex items-center justify-center font-black text-[#280740] text-xl shadow-lg border border-amber-300">
            G
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white font-bold text-lg sm:text-xl tracking-tight">
                Gestión Académica
              </span>
              <span className="bg-[#e5a800] text-[#280740] font-black text-xs px-2 py-0.5 rounded tracking-wider shadow-xs">
                ISUJ
              </span>
            </div>
            <p className="text-[11px] text-purple-200 hidden sm:block">
              Instituto Superior Universitario José Chiriboga Grijalva
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-purple-300 font-medium hidden md:inline">
            Periodo Académico Activo:
          </span>
          <span className="bg-[#1b032d]/80 text-[#e5a800] text-xs font-bold px-3 py-1 rounded-full border border-purple-600/40">
            PER-2026-1
          </span>
        </div>
      </div>

      {/* Main Authentication Grid */}
      <div className="max-w-5xl w-full mx-auto my-auto py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Column: Official Login Form */}
        <div className="lg:col-span-6 bg-white rounded-2xl shadow-2xl border border-purple-100/20 p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Iniciar Sesión
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ingrese con su usuario o correo institucional
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-900 flex items-center justify-center border border-purple-100">
                <Lock className="w-5 h-5 text-[#280740]" />
              </div>
            </div>

            {/* Error Message Box */}
            {errorMessage && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <div className="flex-1">
                  <div className="font-bold">Error de Autenticación</div>
                  <div className="text-[11px] mt-0.5 text-rose-600">{errorMessage}</div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              {/* Field 1: Usuario o Correo Electrónico */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>Usuario o Correo Institucional</span>
                  <span className="text-[10px] font-medium text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
                    user / email
                  </span>
                </label>
                <div className="relative rounded-xl shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    {identifier.includes('@') ? (
                      <Mail className="w-4 h-4 text-purple-600" />
                    ) : (
                      <User className="w-4 h-4 text-purple-600" />
                    )}
                  </div>
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Ej: superadmin o admin@isuj.edu.ec"
                    className="block w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#280740] focus:border-[#280740] focus:bg-white transition"
                    autoComplete="username"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Puede utilizar su identificador o correo electrónico (@isuj.edu.ec)
                </p>
              </div>

              {/* Field 2: Contraseña */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Contraseña / Clave
                  </label>
                  <span className="text-[10px] text-slate-400">
                    Clave del sistema
                  </span>
                </div>
                <div className="relative rounded-xl shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4 text-purple-600" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#280740] focus:border-[#280740] focus:bg-white transition"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember & Info */}
              <div className="flex items-center justify-between pt-1 text-xs">
                <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-300 text-[#280740] focus:ring-[#280740] w-4 h-4 cursor-pointer"
                  />
                  <span className="text-xs font-medium">Recordar en este equipo</span>
                </label>

                <span className="text-[11px] text-slate-400">
                  Rol activo: <strong className="text-purple-900">{selectedRole}</strong>
                </span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 px-4 bg-[#280740] hover:bg-[#3b0b5f] active:bg-[#1a0429] text-amber-300 hover:text-amber-200 font-bold rounded-xl text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 min-h-[44px]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                    <span>Verificando credenciales...</span>
                  </>
                ) : (
                  <>
                    <span>Acceder al Sistema</span>
                    <ArrowRight className="w-4 h-4 text-amber-400" />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Conexión segura y encriptada</span>
            </div>
            <span className="text-slate-300">|</span>
            <span>Versión 4.5 RBAC</span>
          </div>
        </div>

        {/* Right Column: Profile-based Fast Login (Acceso por Perfil) */}
        <div className="lg:col-span-6 bg-[#1f0533]/90 backdrop-blur-md rounded-2xl border border-purple-500/30 p-6 sm:p-8 flex flex-col justify-between text-white shadow-2xl">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-purple-800/60">
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-[#e5a800] text-[#280740] text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                    Acceso por Perfil
                  </span>
                  <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    Cuentas Institucionales
                  </h2>
                </div>
                <p className="text-xs text-purple-200 mt-1">
                  Seleccione un perfil para autocompletar o ingresar directamente
                </p>
              </div>
            </div>

            {/* Grid of Profile Cards */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[380px] overflow-y-auto pr-1">
              {availableAccounts.map((acc) => {
                const style = getRoleBadgeStyle(acc.role);
                const IconComponent = style.icon;
                const isSelected = selectedRole === acc.role;

                return (
                  <div
                    key={acc.username}
                    onClick={() => handleSelectProfile(acc)}
                    className={`p-3 rounded-xl border transition-all text-left flex flex-col justify-between cursor-pointer group ${
                      isSelected
                        ? 'bg-purple-900/80 border-amber-400 ring-1 ring-amber-400 shadow-md'
                        : 'bg-[#2a0845]/60 hover:bg-[#340b54] border-purple-700/50 text-slate-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                            isSelected ? 'bg-[#e5a800] text-[#280740]' : 'bg-purple-800 text-amber-300'
                          }`}>
                            <IconComponent className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white group-hover:text-amber-300 transition flex items-center gap-1.5">
                              <span>{style.emoji}</span>
                              <span>{style.label}</span>
                            </div>
                            <div className="text-[10px] text-purple-300 font-mono">
                              {acc.username}
                            </div>
                          </div>
                        </div>

                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-amber-400" />
                        )}
                      </div>

                      <div className="mt-2 text-[10px] text-purple-200/80 truncate">
                        {acc.email}
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-purple-800/40 flex items-center justify-between">
                      <span className="text-[9px] font-mono text-amber-300/80 bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-800">
                        clave: {acc.defaultPassword || '••••'}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuickLoginAsRole(acc);
                        }}
                        className="text-[10px] font-bold text-amber-300 hover:text-white flex items-center gap-1 hover:underline cursor-pointer"
                      >
                        <span>Entrar</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Institutional footer note */}
          <div className="mt-6 pt-4 border-t border-purple-800/60 flex items-center justify-between text-[11px] text-purple-300">
            <span>Matriz de Permisos CRUD activa por rol</span>
            <div className="flex items-center gap-1 text-amber-300 font-bold">
              <span>SQLite</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
            </div>
          </div>
        </div>

      </div>

      {/* Page Footer */}
      <footer className="max-w-5xl w-full mx-auto text-center text-xs text-purple-300/80 py-2">
        <p>© 2026 Instituto Superior Universitario José Chiriboga Grijalva (ISUJ) · Sistema Oficial de Gestión Académica</p>
      </footer>

    </div>
  );
};
