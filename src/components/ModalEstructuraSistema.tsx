import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  GraduationCap, 
  BookOpen, 
  Clock, 
  Building2, 
  FileSpreadsheet, 
  LayoutDashboard,
  Users,
  School,
  Calendar,
  Layers,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Maximize2,
  Minimize2,
  ExternalLink,
  Sparkles,
  MousePointerClick
} from 'lucide-react';

interface ModalEstructuraSistemaProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTo: (modulo: string, subModulo?: string, estadoFiltro?: string) => void;
}

// Reusable SVG Arrow Components
const DownArrow: React.FC<{ color?: string; height?: number }> = ({ 
  color = '#3b0764', 
  height = 20 
}) => (
  <div className="flex justify-center items-center my-0.5" style={{ height }}>
    <svg width="18" height={height} viewBox="0 0 18 20" fill="none">
      <line x1="9" y1="0" x2="9" y2="13" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <polygon points="4,11 9,19 14,11" fill={color} />
    </svg>
  </div>
);

const Split2Arrow: React.FC<{ color?: string }> = ({ color = '#3b0764' }) => (
  <div className="w-full flex justify-center my-0.5">
    <svg className="w-full max-w-md h-5" viewBox="0 0 360 22" fill="none" preserveAspectRatio="none">
      {/* Center drop from top */}
      <line x1="180" y1="0" x2="180" y2="8" stroke={color} strokeWidth="2" />
      {/* Horizontal bridge */}
      <line x1="90" y1="8" x2="270" y2="8" stroke={color} strokeWidth="2" strokeLinecap="round" />
      {/* Left branch down with arrowhead */}
      <line x1="90" y1="8" x2="90" y2="14" stroke={color} strokeWidth="2" />
      <polygon points="85,12 90,20 95,12" fill={color} />
      {/* Right branch down with arrowhead */}
      <line x1="270" y1="8" x2="270" y2="14" stroke={color} strokeWidth="2" />
      <polygon points="265,12 270,20 275,12" fill={color} />
    </svg>
  </div>
);

const Converge2Arrow: React.FC<{ color?: string }> = ({ color = '#3b0764' }) => (
  <div className="w-full flex justify-center my-0.5">
    <svg className="w-full max-w-md h-5" viewBox="0 0 360 22" fill="none" preserveAspectRatio="none">
      {/* Left & Right stems coming down */}
      <line x1="90" y1="0" x2="90" y2="8" stroke={color} strokeWidth="2" />
      <line x1="270" y1="0" x2="270" y2="8" stroke={color} strokeWidth="2" />
      {/* Horizontal bridge */}
      <line x1="90" y1="8" x2="270" y2="8" stroke={color} strokeWidth="2" strokeLinecap="round" />
      {/* Central drop with arrowhead */}
      <line x1="180" y1="8" x2="180" y2="14" stroke={color} strokeWidth="2" />
      <polygon points="175,12 180,20 185,12" fill={color} />
    </svg>
  </div>
);

const Split3Arrow: React.FC<{ color?: string }> = ({ color = '#3b0764' }) => (
  <div className="w-full flex justify-center my-0.5">
    <svg className="w-full max-w-md h-5" viewBox="0 0 360 22" fill="none" preserveAspectRatio="none">
      {/* Center drop from top */}
      <line x1="180" y1="0" x2="180" y2="8" stroke={color} strokeWidth="2" />
      {/* Horizontal bridge */}
      <line x1="60" y1="8" x2="300" y2="8" stroke={color} strokeWidth="2" strokeLinecap="round" />
      {/* Left branch */}
      <line x1="60" y1="8" x2="60" y2="14" stroke={color} strokeWidth="2" />
      <polygon points="55,12 60,20 65,12" fill={color} />
      {/* Center branch */}
      <line x1="180" y1="8" x2="180" y2="14" stroke={color} strokeWidth="2" />
      <polygon points="175,12 180,20 185,12" fill={color} />
      {/* Right branch */}
      <line x1="300" y1="8" x2="300" y2="14" stroke={color} strokeWidth="2" />
      <polygon points="295,12 300,20 305,12" fill={color} />
    </svg>
  </div>
);

const Converge3Arrow: React.FC<{ color?: string }> = ({ color = '#3b0764' }) => (
  <div className="w-full flex justify-center my-0.5">
    <svg className="w-full max-w-md h-5" viewBox="0 0 360 22" fill="none" preserveAspectRatio="none">
      {/* 3 stems coming down */}
      <line x1="60" y1="0" x2="60" y2="8" stroke={color} strokeWidth="2" />
      <line x1="180" y1="0" x2="180" y2="8" stroke={color} strokeWidth="2" />
      <line x1="300" y1="0" x2="300" y2="8" stroke={color} strokeWidth="2" />
      {/* Horizontal bridge */}
      <line x1="60" y1="8" x2="300" y2="8" stroke={color} strokeWidth="2" strokeLinecap="round" />
      {/* Central drop with arrowhead */}
      <line x1="180" y1="8" x2="180" y2="14" stroke={color} strokeWidth="2" />
      <polygon points="175,12 180,20 185,12" fill={color} />
    </svg>
  </div>
);

export const ModalEstructuraSistema: React.FC<ModalEstructuraSistemaProps> = ({
  isOpen,
  onClose,
  onNavigateTo,
}) => {
  const [isMaximized, setIsMaximized] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSelect = (modulo: string, subModulo?: string, estadoFiltro?: string) => {
    onNavigateTo(modulo, subModulo, estadoFiltro);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-3 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className={`bg-white flex flex-col shadow-2xl border-2 border-[#e5a800] overflow-hidden transition-all duration-200 ${
          isMaximized 
            ? 'w-full h-full max-w-none max-h-none rounded-none' 
            : 'rounded-2xl max-w-xl w-full max-h-[85vh]'
        }`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#1f0533] text-white px-4 py-2.5 sm:py-3 flex items-center justify-between border-b-2 border-[#e5a800] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#e5a800] text-[#1f0533] flex items-center justify-center font-black shadow-md border border-amber-300 text-sm">
              S
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-white tracking-tight flex items-center gap-2">
                Estructura Organizacional del SISTEMA ISUJ
              </h2>
              <p className="text-[11px] text-purple-200 hidden sm:block">
                Flujo jerárquico completo con flechas direccionales y accesos directos
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Toggle Fullscreen button */}
            <button
              onClick={() => setIsMaximized(!isMaximized)}
              className="p-1.5 text-purple-200 hover:text-white hover:bg-purple-900/60 rounded-lg transition cursor-pointer"
              title={isMaximized ? 'Restaurar tamaño' : 'Pantalla completa'}
            >
              {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-purple-200 hover:text-white hover:bg-purple-900/60 rounded-lg transition cursor-pointer"
              title="Cerrar ventana"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content: Entire Flowchart fitting cleanly without cutoffs */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-3.5 bg-gradient-to-b from-slate-50 to-purple-50/30 flex flex-col items-center select-none">
          
          <div className="w-full max-w-xl flex flex-col items-center">
            
            {/* 1. NODO SUPERIOR: SISTEMA */}
            <div className="w-full flex justify-center">
              <div 
                className="px-6 py-1.5 bg-[#1f0533] text-white rounded-xl shadow-md border-2 border-[#e5a800] font-black tracking-widest text-xs sm:text-sm flex items-center gap-2"
              >
                <span className="w-2 h-2 rounded-full bg-[#e5a800] animate-ping"></span>
                <span>SISTEMA</span>
              </div>
            </div>

            {/* FLECHAS QUE DIVIDEN A SEGURIDAD Y ACADÉMICO */}
            <Split2Arrow color="#3b0764" />

            {/* 2. NIVEL: SEGURIDAD & ACADÉMICO */}
            <div className="w-full grid grid-cols-2 gap-2 sm:gap-3">
              {/* SEGURIDAD */}
              <button
                onClick={() => handleSelect('seguridad', 'usuarios')}
                className="bg-white hover:bg-purple-50/90 p-2 sm:p-2.5 rounded-xl border-2 border-purple-800 shadow-xs transition text-center cursor-pointer group hover:shadow-md hover:border-purple-950"
              >
                <div className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-purple-900 text-amber-300 mb-1 group-hover:scale-105 transition-transform">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <div className="font-black text-purple-950 text-xs tracking-wide">
                  SEGURIDAD
                </div>
                <div className="text-[10px] font-semibold text-purple-700 bg-purple-100/70 py-0.5 px-1.5 rounded mt-0.5 truncate">
                  Usuario / Rol / Permiso
                </div>
              </button>

              {/* ACADÉMICO */}
              <button
                onClick={() => handleSelect('academico', 'sedes')}
                className="bg-white hover:bg-blue-50/90 p-2 sm:p-2.5 rounded-xl border-2 border-blue-800 shadow-xs transition text-center cursor-pointer group hover:shadow-md hover:border-blue-950"
              >
                <div className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-blue-900 text-blue-200 mb-1 group-hover:scale-105 transition-transform">
                  <GraduationCap className="w-3.5 h-3.5" />
                </div>
                <div className="font-black text-blue-950 text-xs tracking-wide">
                  ACADÉMICO
                </div>
                <div className="text-[10px] font-semibold text-blue-700 bg-blue-100/70 py-0.5 px-1.5 rounded mt-0.5 truncate">
                  Sede / Escuela / Carrera
                </div>
              </button>
            </div>

            {/* FLECHAS QUE CONVERGEN A PLANIFICACIÓN */}
            <Converge2Arrow color="#3b0764" />

            {/* 3. NIVEL: PLANIFICACIÓN (DOCENTE / ASIGNATURA / PARALELO) */}
            <div className="w-full bg-white p-2 sm:p-2.5 rounded-xl border-2 border-indigo-700 shadow-xs text-center">
              <button
                onClick={() => handleSelect('planificacion', 'planificaciones')}
                className="inline-flex items-center gap-1.5 font-black text-indigo-950 text-xs tracking-wide hover:text-indigo-700 cursor-pointer mb-1.5"
              >
                <BookOpen className="w-3.5 h-3.5 text-indigo-700" />
                <span>PLANIFICACIÓN</span>
              </button>

              {/* FLECHAS INTERNAS DE PLANIFICACIÓN A SUB-ELEMENTOS */}
              <Split3Arrow color="#4338ca" />

              <div className="grid grid-cols-4 gap-1 pt-0.5">
                <button
                  onClick={() => handleSelect('planificacion', 'asignar_docentes')}
                  className="py-1 px-1 bg-amber-50 hover:bg-amber-100 rounded-lg text-[9px] sm:text-[10px] font-black text-amber-950 transition text-center cursor-pointer border border-amber-300 truncate"
                  title="Asignación manual e interactiva de docentes y aulas con combo box"
                >
                  DOCENTES/AULAS
                </button>
                <button
                  onClick={() => handleSelect('planificacion', 'docentes')}
                  className="py-1 px-1 bg-indigo-50 hover:bg-indigo-100 rounded-lg text-[9px] sm:text-[10px] font-bold text-indigo-900 transition text-center cursor-pointer border border-indigo-200 truncate"
                >
                  DOCENTE
                </button>
                <button
                  onClick={() => handleSelect('planificacion', 'asignaturas')}
                  className="py-1 px-1 bg-indigo-50 hover:bg-indigo-100 rounded-lg text-[9px] sm:text-[10px] font-bold text-indigo-900 transition text-center cursor-pointer border border-indigo-200 truncate"
                >
                  ASIGNATURA
                </button>
                <button
                  onClick={() => handleSelect('planificacion', 'paralelos')}
                  className="py-1 px-1 bg-indigo-50 hover:bg-indigo-100 rounded-lg text-[9px] sm:text-[10px] font-bold text-indigo-900 transition text-center cursor-pointer border border-indigo-200 truncate"
                >
                  PARALELO
                </button>
              </div>
            </div>

            {/* FLECHA DE CONVERGENCIA A HORARIO */}
            <Converge3Arrow color="#3b0764" />

            {/* 4. NIVEL: HORARIO */}
            <div className="w-full max-w-sm">
              <button
                onClick={() => handleSelect('horario', 'matriz')}
                className="w-full bg-white hover:bg-amber-50/90 py-1.5 px-3 rounded-xl border-2 border-amber-600 shadow-xs transition text-center cursor-pointer group flex items-center justify-center gap-2 hover:shadow-md"
              >
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span className="font-black text-amber-950 text-xs tracking-wide">HORARIO</span>
                <span className="text-[10px] text-amber-800 font-medium hidden sm:inline">• Matriz &amp; Feriados</span>
              </button>
            </div>

            {/* FLECHA DE HORARIO A ASIGNACIÓN DE AULAS */}
            <DownArrow color="#b45309" height={18} />

            {/* 5. NIVEL: ASIGNACIÓN DE AULAS (DISPONIBLE / EN PROCESO / OCUPADO) */}
            <div className="w-full bg-white p-2 sm:p-2.5 rounded-xl border-2 border-emerald-700 shadow-xs text-center">
              <button
                onClick={() => handleSelect('asignacion_aulas', 'planificacion_aulas')}
                className="inline-flex items-center gap-1.5 font-black text-emerald-950 text-xs tracking-wide hover:text-emerald-700 cursor-pointer mb-1.5"
              >
                <Building2 className="w-3.5 h-3.5 text-emerald-700" />
                <span>ASIGNACIÓN DE AULAS</span>
              </button>

              {/* FLECHAS A LOS 3 ESTADOS */}
              <Split3Arrow color="#047857" />

              <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                <button
                  onClick={() => handleSelect('asignacion_aulas', 'planificacion_aulas', 'DISPONIBLE')}
                  className="py-1 px-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg text-[10px] sm:text-xs font-black text-emerald-800 transition text-center cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                  <span className="truncate">DISPONIBLE</span>
                </button>
                <button
                  onClick={() => handleSelect('asignacion_aulas', 'planificacion_aulas', 'EN_PROCESO')}
                  className="py-1 px-1 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg text-[10px] sm:text-xs font-black text-amber-800 transition text-center cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
                  <span className="truncate">EN PROCESO</span>
                </button>
                <button
                  onClick={() => handleSelect('asignacion_aulas', 'planificacion_aulas', 'OCUPADO')}
                  className="py-1 px-1 bg-rose-50 hover:bg-rose-100 border border-rose-300 rounded-lg text-[10px] sm:text-xs font-black text-rose-800 transition text-center cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
                  <span className="truncate">OCUPADO</span>
                </button>
              </div>
            </div>

            {/* FLECHA DE CONVERGENCIA A REPORTES */}
            <Converge3Arrow color="#047857" />

            {/* 6. NIVEL: REPORTES */}
            <div className="w-full max-w-sm">
              <button
                onClick={() => handleSelect('reportes')}
                className="w-full bg-white hover:bg-slate-100 py-1.5 px-3 rounded-xl border-2 border-slate-700 shadow-xs transition text-center cursor-pointer group flex items-center justify-center gap-2 hover:shadow-md"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-slate-700" />
                <span className="font-black text-slate-900 text-xs tracking-wide">REPORTES</span>
                <span className="text-[10px] text-slate-600 font-medium hidden sm:inline">• Ocupación &amp; Excel/PDF</span>
              </button>
            </div>

            {/* FLECHA DE REPORTES A DASHBOARD */}
            <DownArrow color="#334155" height={18} />

            {/* 7. NIVEL FINAL: DASHBOARD */}
            <div className="w-full max-w-sm">
              <button
                onClick={() => handleSelect('dashboard')}
                className="w-full bg-[#1f0533] hover:bg-[#340954] text-white py-2 px-3 rounded-xl border-2 border-[#e5a800] shadow-md transition text-center cursor-pointer group flex items-center justify-center gap-2"
              >
                <LayoutDashboard className="w-4 h-4 text-amber-400" />
                <span className="font-black text-amber-300 text-xs sm:text-sm tracking-wider">DASHBOARD</span>
                <span className="text-[10px] text-purple-200 font-medium hidden sm:inline">• Tablero General</span>
              </button>
            </div>

          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-100 px-3 py-2 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 shrink-0">
          <div className="flex items-center gap-1.5 text-[11px]">
            <MousePointerClick className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden sm:inline">Haga clic en cualquier bloque para ingresar directamente al módulo.</span>
            <span className="sm:hidden">Toque cualquier bloque para ir al módulo.</span>
          </div>
          <button
            onClick={onClose}
            className="px-3.5 py-1 bg-[#1f0533] hover:bg-purple-900 text-amber-300 font-bold rounded-lg transition cursor-pointer text-xs"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
