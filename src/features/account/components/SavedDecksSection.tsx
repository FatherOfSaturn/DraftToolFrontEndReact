import { useEffect, useRef, useState } from 'react';
import { Pagination } from '../../../shared/components/Pagination';
import type { DeckPagination } from '../hooks/useAccountDecks';
import type { Deck } from '../model/accountTypes';

interface SavedDecksSectionProps {
  decks: Deck[];
  loading: boolean;
  error: string | null;
  onDelete: (deckID: string) => void;
  onUpdate: (deckID: string, name: string, description: string, cardIds: string[]) => void;
  onCreateNew: () => void;
  pagination: DeckPagination;
}

function formatISODate(iso: string): string {
  return new Date(iso)
    .toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
    .toUpperCase()
    .replace(',', '');
}

interface EditableCellProps {
  value: string;
  onSave: (value: string) => void;
  emptyFallback?: string;
  truncate?: boolean;
}

function EditableCell({ value, onSave, emptyFallback = '—', truncate }: EditableCellProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  function commit() {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== value) onSave(trimmed);
    else setDraft(value);
    setEditing(false);
  }

  function cancel() {
    setDraft(value);
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <input
          ref={inputRef}
          className="bg-surface-container-lowest border border-outline-variant/40 rounded-lg px-2 py-1 text-on-surface font-body-md text-sm focus:outline-none input-glow transition-all w-full"
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') cancel();
          }}
        />
        <button
          className="material-symbols-outlined text-primary text-[16px] shrink-0 hover:scale-110 transition-transform"
          title="Save"
          onClick={commit}
        >
          check
        </button>
        <button
          className="material-symbols-outlined text-outline-variant text-[16px] shrink-0 hover:text-error hover:scale-110 transition-all"
          title="Cancel"
          onClick={cancel}
        >
          close
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-2 group/edit min-w-0">
      <span className={`font-body-md text-on-surface ${truncate ? 'text-sm max-w-[160px] truncate' : 'font-semibold'}`}>
        {value || emptyFallback}
      </span>
      <button
        className="material-symbols-outlined text-outline-variant hover:text-primary transition-colors text-[16px] shrink-0 opacity-0 group-hover/edit:opacity-100"
        title="Edit"
        onClick={() => setEditing(true)}
      >
        edit
      </button>
    </div>
  );
}

export function SavedDecksSection({ decks, loading, error, onDelete, onUpdate, onCreateNew, pagination }: SavedDecksSectionProps) {
  return (
    <section className="xl:col-span-5 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-headline-lg text-headline-lg flex items-center gap-3">
          <span className="material-symbols-outlined text-secondary text-[32px]">auto_fix_high</span>
          Saved Decks
        </h2>
        <span className="font-label-sm text-label-sm bg-surface-container-high px-3 py-1 rounded-full text-outline-variant">
          Total: {pagination.totalItems}
        </span>
      </div>

      <div className="glass-panel rounded-xl overflow-hidden arcane-glow">
        {error && <div className="px-4 py-3 bg-error/10 text-error font-label-sm border-b border-error/20">{error}</div>}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-high/50 border-b border-outline-variant/30">
                <th className="px-4 py-3 font-label-md text-label-md text-outline">Name</th>
                <th className="px-4 py-3 font-label-md text-label-md text-outline">Description</th>
                <th className="px-4 py-3 font-label-md text-label-md text-outline">Cards</th>
                <th className="px-4 py-3 font-label-md text-label-md text-outline">Updated</th>
                <th className="px-4 py-3 font-label-md text-label-md text-outline text-right" />
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {loading && <tr><td colSpan={5} className="px-4 py-10 text-center text-on-surface-variant font-body-md">Loading decks…</td></tr>}
              {!loading && decks.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-on-surface-variant font-body-md">No saved decks yet. Create one to get started.</td></tr>}
              {!loading && decks.map((deck) => (
                <tr key={deck.deckID} className="group hover:bg-surface-container/50 transition-colors">
                  <td className="px-4 py-4">
                    <EditableCell
                      value={deck.name}
                      onSave={(name) => onUpdate(deck.deckID, name, deck.description, deck.cardIds)}
                    />
                  </td>
                  <td className="px-4 py-4 max-w-[200px]">
                    <EditableCell
                      value={deck.description}
                      onSave={(description) => onUpdate(deck.deckID, deck.name, description, deck.cardIds)}
                      truncate
                    />
                  </td>
                  <td className="px-4 py-4 font-label-sm text-primary">{deck.cardIds.length}</td>
                  <td className="px-4 py-4 font-label-sm text-on-surface-variant">{formatISODate(deck.updatedAt)}</td>
                  <td className="px-4 py-4 text-right">
                    <button className="material-symbols-outlined text-on-surface-variant hover:text-error transition-colors text-[18px]" title="Delete deck" onClick={() => onDelete(deck.deckID)}>delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          onPrev={pagination.prevPage}
          onNext={pagination.nextPage}
        />
        <div className="p-4 bg-surface-container-high/30 border-t border-outline-variant/20">
          <button className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-dashed border-outline-variant/50 hover:border-primary/50 hover:bg-primary/5 transition-all group" onClick={onCreateNew}>
            <span className="material-symbols-outlined text-primary text-[20px]">add</span>
            <span className="font-label-md text-on-surface-variant group-hover:text-primary">Create New Deck</span>
          </button>
        </div>
      </div>
    </section>
  );
}
