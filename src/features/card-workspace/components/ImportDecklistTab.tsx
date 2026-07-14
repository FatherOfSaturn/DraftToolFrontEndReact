import { useState } from 'react';
import type { Card } from '../../../shared/model/cardTypes';
import { importDecklist } from '../utils/importDecklist';

interface ImportDecklistTabProps {
  onImportCards: (cards: Card[]) => void;
}

export function ImportDecklistTab({ onImportCards }: ImportDecklistTabProps) {
  const [text, setText] = useState('');
  const [unknownNames, setUnknownNames] = useState<string[]>([]);
  const [lastImportCount, setLastImportCount] = useState<number | null>(null);

  function handleImportClick() {
    const { cards, unknownNames: unknown } = importDecklist(text);
    setUnknownNames(unknown);
    setLastImportCount(cards.length);
    if (cards.length > 0) onImportCards(cards);
  }

  return (
    <div className="flex flex-col gap-sm h-full">
      <p className="text-on-surface-variant font-label-sm text-label-sm opacity-70">
        Paste a decklist (Standard MTG format) to add every card straight to your pool. (Ephemeral)
      </p>
      <textarea
        className="flex-1 min-h-[240px] w-full bg-surface-container-lowest/50 border border-outline-variant/30 rounded-lg p-sm font-label-sm text-label-sm text-on-surface focus:outline-none focus:border-primary-container transition-all resize-none"
        placeholder={'4 Counterspell\n4 Brainstorm\n20 Island...'}
        value={text}
        onChange={(event) => setText(event.target.value)}
      />
      {unknownNames.length > 0 && (
        <p className="text-[11px] text-on-surface-variant/80 leading-snug">
          <span className="text-tertiary font-semibold">{unknownNames.length}</span> card
          {unknownNames.length === 1 ? '' : 's'} not in the local type lookup yet (added as Unknown):{' '}
          {unknownNames.slice(0, 4).join(', ')}
          {unknownNames.length > 4 ? '…' : ''}
        </p>
      )}
      {lastImportCount !== null && (
        <p className="text-label-sm text-secondary text-center">
          {lastImportCount > 0
            ? `Added ${lastImportCount} card${lastImportCount === 1 ? '' : 's'}.`
            : 'No cards found in that text.'}
        </p>
      )}
      <button
        className="w-full bg-primary py-sm rounded-lg text-on-primary font-bold font-headline-md text-headline-md active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        onClick={handleImportClick}
        disabled={text.trim().length === 0}
      >
        Import Decklist
      </button>
    </div>
  );
}
