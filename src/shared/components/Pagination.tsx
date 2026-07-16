interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPrev: () => void;
  onNext: () => void;
}

export function Pagination({ currentPage, totalPages, totalItems, onPrev, onNext }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="p-4 bg-surface-container-high/30 border-t border-outline-variant/20 flex items-center justify-between">
      <span className="font-label-sm text-on-surface-variant">
        {totalItems} total · Page {currentPage} of {totalPages}
      </span>
      <div className="flex items-center gap-2">
        <button
          className="font-label-sm text-label-sm px-3 py-1.5 rounded-lg border border-outline-variant/30 hover:bg-surface-container-high/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          onClick={onPrev}
          disabled={currentPage <= 1}
        >
          ← Previous
        </button>
        <button
          className="font-label-sm text-label-sm px-3 py-1.5 rounded-lg border border-outline-variant/30 hover:bg-surface-container-high/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          onClick={onNext}
          disabled={currentPage >= totalPages}
        >
          Next →
        </button>
      </div>
    </div>
  );
}
