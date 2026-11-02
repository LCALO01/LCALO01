import React from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight 
} from 'lucide-react';

export interface PaginationControlsProps {
  currentPage: number;
  totalItems: number;
  pageSize: number | 'all';
  pageSizeOptions?: Array<number | 'all'>;
  itemName?: string; // e.g. "aulas", "registros"
  onPageChange: (newPage: number) => void;
  onPageSizeChange?: (newSize: number | 'all') => void;
  showPageSizeSelector?: boolean;
  className?: string;
}

export const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  totalItems,
  pageSize,
  pageSizeOptions = [10, 15, 20, 25, 40, 'all'],
  itemName = 'aulas',
  onPageChange,
  onPageSizeChange,
  showPageSizeSelector = true,
  className = ''
}) => {
  const numericPageSize = pageSize === 'all' ? totalItems || 1 : pageSize;
  const totalPages = pageSize === 'all' ? 1 : Math.max(1, Math.ceil(totalItems / numericPageSize));
  
  // Safe clamped current page
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const startItem = totalItems === 0 ? 0 : (safeCurrentPage - 1) * numericPageSize + 1;
  const endItem = pageSize === 'all' ? totalItems : Math.min(safeCurrentPage * numericPageSize, totalItems);

  // Generate page numbers array with smart ellipsis (...)
  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | string)[] = [1];

    if (safeCurrentPage > 3) {
      pages.push('...');
    }

    const start = Math.max(2, safeCurrentPage - 1);
    const end = Math.min(totalPages - 1, safeCurrentPage + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (safeCurrentPage < totalPages - 2) {
      pages.push('...');
    }

    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div 
      className={`bg-white rounded-xl border border-slate-200/90 px-3.5 py-2.5 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs ${className}`}
      id="pagination-controls-container"
    >
      {/* Left: Range and total information */}
      <div className="flex items-center gap-2 text-slate-600 order-2 md:order-1 select-none">
        <span className="font-medium">
          Mostrando{' '}
          <strong className="text-slate-900 font-mono font-bold">
            {totalItems === 0 ? 0 : `${startItem} - ${endItem}`}
          </strong>{' '}
          de{' '}
          <strong className="text-slate-900 font-mono font-bold">
            {totalItems}
          </strong>{' '}
          {itemName}
        </span>
        {totalPages > 1 && (
          <span className="text-slate-400 hidden sm:inline">
            • Página <strong className="text-slate-800 font-mono">{safeCurrentPage}</strong> de{' '}
            <strong className="text-slate-800 font-mono">{totalPages}</strong>
          </span>
        )}
      </div>

      {/* Center: Numeric Navigation Buttons */}
      <div className="flex items-center gap-1 order-1 md:order-2 flex-wrap justify-center">
        {/* First Page */}
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={safeCurrentPage <= 1}
          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-35 disabled:hover:bg-transparent disabled:cursor-not-allowed transition cursor-pointer"
          title="Primera página"
          aria-label="Primera página"
        >
          <ChevronsLeft className="w-3.5 h-3.5" />
        </button>

        {/* Previous Page */}
        <button
          type="button"
          onClick={() => onPageChange(safeCurrentPage - 1)}
          disabled={safeCurrentPage <= 1}
          className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-35 disabled:hover:bg-transparent disabled:cursor-not-allowed transition flex items-center gap-1 font-semibold cursor-pointer"
          title="Página anterior"
          aria-label="Página anterior"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline text-[11px]">Anterior</span>
        </button>

        {/* Page pills */}
        <div className="flex items-center gap-1">
          {pages.map((p, idx) => {
            if (p === '...') {
              return (
                <span key={`dots-${idx}`} className="px-1.5 text-slate-400 font-mono select-none">
                  ...
                </span>
              );
            }

            const pageNum = Number(p);
            const isActive = pageNum === safeCurrentPage;

            return (
              <button
                key={pageNum}
                type="button"
                onClick={() => onPageChange(pageNum)}
                className={`min-w-[28px] h-7 px-2 rounded-lg text-xs font-mono font-bold transition flex items-center justify-center cursor-pointer ${
                  isActive
                    ? 'bg-[#280740] text-white ring-2 ring-[#e5a800] shadow-2xs'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
                aria-label={`Página ${pageNum}`}
                aria-current={isActive ? 'page' : undefined}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        {/* Next Page */}
        <button
          type="button"
          onClick={() => onPageChange(safeCurrentPage + 1)}
          disabled={safeCurrentPage >= totalPages}
          className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-35 disabled:hover:bg-transparent disabled:cursor-not-allowed transition flex items-center gap-1 font-semibold cursor-pointer"
          title="Página siguiente"
          aria-label="Página siguiente"
        >
          <span className="hidden sm:inline text-[11px]">Siguiente</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        {/* Last Page */}
        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={safeCurrentPage >= totalPages}
          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-35 disabled:hover:bg-transparent disabled:cursor-not-allowed transition cursor-pointer"
          title="Última página"
          aria-label="Última página"
        >
          <ChevronsRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Right: Items per page selector & Jump */}
      {showPageSizeSelector && onPageSizeChange && (
        <div className="flex items-center gap-2 order-3 select-none">
          <label htmlFor="select-page-size" className="text-slate-500 text-[11px] font-medium hidden sm:inline">
            Mostrar:
          </label>
          <select
            id="select-page-size"
            value={pageSize}
            onChange={e => {
              const val = e.target.value === 'all' ? 'all' : Number(e.target.value);
              onPageSizeChange(val);
            }}
            className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold rounded-lg px-2 py-1 outline-hidden focus:ring-1 focus:ring-[#350854] cursor-pointer"
          >
            {pageSizeOptions.map(opt => (
              <option key={String(opt)} value={opt}>
                {opt === 'all' ? `Todas (${totalItems})` : `${opt} por pantalla`}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};
