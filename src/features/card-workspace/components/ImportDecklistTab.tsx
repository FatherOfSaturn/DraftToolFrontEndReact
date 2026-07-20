import { useState } from 'react';
import { CollapsibleSection } from '../../../shared/components/CollapsibleSection';
import { importDecklist } from '../utils/importDecklist';
import type { Card } from '../../../shared/model/cardTypes';

interface ImportDecklistTabProps {
  onImportCards: (cards: Card[]) => void;
}

export function ImportDecklistTab({ onImportCards }: ImportDecklistTabProps) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [unknownNames, setUnknownNames] = useState<string[]>([]);
  const [importedCount, setImportedCount] = useState<number | null>(null);

  async function handleImport() {
    if (!text.trim()) return;
    setLoading(true);
    setUnknownNames([]);
    setImportedCount(null);
    try {
      const result = await importDecklist(text);
      setUnknownNames(result.unknownNames);
      setImportedCount(result.cards.length);
      if (result.cards.length > 0) {
        onImportCards(result.cards);
      }
    } catch {
      setUnknownNames(['Failed to fetch cards from the server.']);
    } finally {
      setLoading(false);
    }
  }

  return (
    <CollapsibleSection title="Import Decklist" icon="upload" defaultOpen={false}>
      <div className="p-md flex flex-col gap-sm">
        <p className="text-on-surface-variant font-label-sm text-label-sm opacity-70">
          Paste your Decklist here (EX: 2 Lightning Bolt)
        </p>
        <textarea
          className="w-full max-h-[40dvh] bg-surface-container-lowest/50 border border-outline-variant/30 rounded-lg p-sm font-label-sm text-label-sm text-on-surface focus:outline-none focus:border-primary-container transition-all resize-none"
          placeholder={'4 Counterspell\n4 Brainstorm\n20 Island...'}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        {unknownNames.length > 0 && (
          <p className="text-[11px] text-on-surface-variant/80 leading-snug">
            <span className="text-tertiary font-semibold">{unknownNames.length}</span> card
            {unknownNames.length === 1 ? '' : 's'} not found:{' '}
            {unknownNames.slice(0, 4).join(', ')}
            {unknownNames.length > 4 ? '…' : ''}
          </p>
        )}
        {importedCount !== null && importedCount > 0 && (
          <p className="text-[11px] text-green-400/80 leading-snug">
            Imported {importedCount} card{importedCount === 1 ? '' : 's'} successfully.
          </p>
        )}
        <button
          className="w-full sticky bottom-0 bg-primary py-sm rounded-lg text-on-primary font-bold font-headline-md text-headline-md active:scale-95 transition-all arcane-glow disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleImport}
          disabled={loading || !text.trim()}
        >
          {loading ? 'Importing…' : 'Import'}
        </button>
      </div>
    </CollapsibleSection>
  );
}
