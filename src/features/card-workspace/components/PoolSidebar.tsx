import { useEffect, useState } from 'react';
import type { Card } from '../../../shared/model/cardTypes';
import { ImportDecklistTab } from './ImportDecklistTab';
import { PoolAnalytics } from './PoolAnalytics';
import { PoolList } from './PoolList';

export type PoolSidebarTab = 'list' | 'sideboard' | 'analytics' | 'import';

export interface ConfirmPickAction {
  stagedCard: Card | null;
  onConfirmPick: () => void;
  confirming: boolean;
}

export interface PoolSidebarProps {
  cards: Card[];
  total: number;
  tab: PoolSidebarTab;
  onTabChange: (tab: PoolSidebarTab) => void;
  onImportCards?: (cards: Card[]) => void;
  showImportTab?: boolean;
  confirmAction?: ConfirmPickAction;
  topOffsetPx?: number;
  sideboardCards?: Card[];
  onMoveToSideboard?: (card: Card) => void;
  onMoveToList?: (card: Card) => void;
  onAddLand?: (name: string) => void;
  onExport?: () => void;
  onSaveDeck?: () => void;
}

export function PoolSidebar({
  cards,
  total,
  tab,
  onTabChange,
  onImportCards,
  showImportTab = true,
  confirmAction,
  topOffsetPx = 112,
  sideboardCards,
  onMoveToSideboard,
  onMoveToList,
  onAddLand,
  onExport,
  onSaveDeck,
}: PoolSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const showSideboardTab = sideboardCards !== undefined;

  useEffect(() => {
    function onResize() {
      if (window.innerWidth >= 1280) setMobileOpen(false);
    }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [mobileOpen]);

  return (
    <>
      {/* Toggle FAB — visible only below xl */}
      <button
        className="fixed right-4 z-40 xl:hidden bg-primary text-on-primary rounded-full shadow-lg p-3 hover:scale-105 active:scale-95 transition-transform"
        style={{ top: `calc(${topOffsetPx}px + 8px)` }}
        onClick={() => setMobileOpen((v) => !v)}
        aria-label={mobileOpen ? 'Close pool sidebar' : 'Open pool sidebar'}
      >
        <span className="material-symbols-outlined text-[24px]">{mobileOpen ? 'close' : 'side_navigation'}</span>
        <span className="absolute -top-1 -right-1 bg-secondary text-on-secondary text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
          {cards.length}
        </span>
      </button>

      {/* Backdrop — only on mobile when open */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 xl:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar — fixed on xl+, overlay drawer below xl */}
      <aside
        className={`fixed right-0 w-[85vw] max-w-80 flex flex-col glass-panel border-l border-outline-variant/20 shadow-2xl z-30 transition-transform duration-300 ease-out ${
          mobileOpen
            ? 'translate-x-0'
            : 'translate-x-full xl:translate-x-0'
        }`}
        style={{ top: topOffsetPx, height: `calc(100dvh - ${topOffsetPx}px)` }}
      >
        <div className="p-md border-b border-outline-variant/20">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-display text-headline-md text-primary">My Pool</h2>
            <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-md text-label-sm">
              {cards.length}/{total}
            </span>
          </div>
          <div className="flex bg-surface-container-low p-1 rounded-lg border border-outline-variant/20">
            <PoolTabButton active={tab === 'list'} onClick={() => onTabChange('list')}>List</PoolTabButton>
            {showSideboardTab && (
              <PoolTabButton active={tab === 'sideboard'} onClick={() => onTabChange('sideboard')}>
                Sideboard
              </PoolTabButton>
            )}
            <PoolTabButton active={tab === 'analytics'} onClick={() => onTabChange('analytics')}>
              Analytics
            </PoolTabButton>
            {showImportTab && (
              <PoolTabButton active={tab === 'import'} onClick={() => onTabChange('import')}>Import</PoolTabButton>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-md">
          {tab === 'list' && (
            <PoolList cards={cards} onRowClick={onMoveToSideboard} onAddLand={onAddLand} onExport={onExport} onSaveDeck={onSaveDeck} />
          )}
          {tab === 'sideboard' && sideboardCards !== undefined && (
            <PoolList cards={sideboardCards} onRowClick={onMoveToList} emptyMessage="No cards in sideboard" />
          )}
          {tab === 'analytics' && <PoolAnalytics cards={cards} />}
          {tab === 'import' && showImportTab && (
            <ImportDecklistTab onImportCards={(imported) => onImportCards?.(imported)} />
          )}
        </div>

        {confirmAction && (
          <div className="p-md pb-[calc(var(--spacing-md,16px)+env(safe-area-inset-bottom,0px))] bg-surface-container-high border-t border-outline-variant/20 flex flex-col gap-sm">
            {confirmAction.stagedCard && (
              <p className="text-label-sm text-on-surface-variant text-center">
                Staged: <span className="text-primary font-medium">{confirmAction.stagedCard.name}</span>
              </p>
            )}
            <button
              className="w-full bg-primary text-on-primary font-display text-headline-md py-4 rounded-xl shadow-[0_0_20px_rgba(213,186,255,0.4)] hover:shadow-[0_0_30px_rgba(213,186,255,0.6)] transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
              disabled={!confirmAction.stagedCard || confirmAction.confirming}
              onClick={confirmAction.onConfirmPick}
            >
              {confirmAction.confirming ? 'Confirming…' : 'Confirm Pick'}
            </button>
          </div>
        )}
      </aside>
    </>
  );
}

function PoolTabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
  return (
    <button
      className={`flex-1 py-1.5 px-1 text-label-sm rounded-md transition-colors whitespace-nowrap ${
        active ? 'bg-primary text-on-primary font-bold shadow-lg' : 'text-on-surface-variant hover:text-on-surface'
      }`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
