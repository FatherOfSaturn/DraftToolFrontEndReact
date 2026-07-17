import { useMediaQuery } from '../../../shared/hooks/useMediaQuery';
import { CollapsibleSection } from '../../../shared/components/CollapsibleSection';

interface DecklistPaneProps {
  decklistText: string;
  onDecklistTextChange: (value: string) => void;
  onInfuseList: () => void;
  deckSize: number;
  landInOpenerPct: number;
  creatureByT3Pct: number;
  interactionLabel: string;
  unknownNames: string[];
}

export function DecklistPane({
  decklistText,
  onDecklistTextChange,
  onInfuseList,
  deckSize,
  landInOpenerPct,
  creatureByT3Pct,
  interactionLabel,
  unknownNames,
}: DecklistPaneProps) {
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  return (
    <section className="col-span-12 lg:col-span-3 flex flex-col gap-sm">
      <div className="glass-panel rounded-xl overflow-hidden">
        <CollapsibleSection
          title="Decklist"
          icon="edit_note"
          badge={
            <span className="text-on-surface-variant font-label-sm text-label-sm">
              {deckSize}
            </span>
          }
          defaultOpen={isDesktop}
        >
          <div className="p-md flex flex-col gap-sm h-[400px] md:h-[600px]">
            <p className="text-on-surface-variant font-label-sm text-label-sm opacity-70">
              Paste your Decklist here (EX: 2 Lightning Bolt)
            </p>
            <textarea
              className="flex-1 w-full bg-surface-container-lowest/50 border border-outline-variant/30 rounded-lg p-sm font-label-sm text-label-sm text-on-surface focus:outline-none focus:border-primary-container transition-all resize-none"
              placeholder={'4 Counterspell\n4 Brainstorm\n20 Island...'}
              value={decklistText}
              onChange={(event) => onDecklistTextChange(event.target.value)}
            />
            {unknownNames.length > 0 && (
              <p className="text-[11px] text-on-surface-variant/80 leading-snug">
                <span className="text-tertiary font-semibold">{unknownNames.length}</span> card
                {unknownNames.length === 1 ? '' : 's'} not in the local type lookup yet (treated as
                Unknown): {unknownNames.slice(0, 4).join(', ')}
                {unknownNames.length > 4 ? '…' : ''}
              </p>
            )}
            <button
              className="w-full bg-primary py-sm rounded-lg text-on-primary font-bold font-headline-md text-headline-md active:scale-95 transition-all arcane-glow"
              onClick={onInfuseList}
            >
              Load Deck
            </button>
            <p className="text-center text-on-surface-variant font-label-sm text-label-sm">
              {deckSize} cards in deck
            </p>
          </div>
        </CollapsibleSection>
      </div>

      <div className="glass-panel rounded-xl overflow-hidden">
        <CollapsibleSection
          title="Quick Stats"
          icon="monitoring"
          defaultOpen={isDesktop}
          contentClassName="px-md pb-md"
        >
          <div className="space-y-sm">
            <div className="flex justify-between items-center py-xs border-b border-outline-variant/10">
              <span className="font-label-sm text-label-sm text-on-surface-variant">Land in Opener</span>
              <span className="font-label-sm text-label-sm text-secondary">
                {(landInOpenerPct * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-center py-xs border-b border-outline-variant/10">
              <span className="font-label-sm text-label-sm text-on-surface-variant">Creature by T3</span>
              <span className="font-label-sm text-label-sm text-secondary">
                {(creatureByT3Pct * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-center py-xs">
              <span className="font-label-sm text-label-sm text-on-surface-variant">Interaction Density</span>
              <span className="font-label-sm text-label-sm text-secondary">{interactionLabel}</span>
            </div>
          </div>
        </CollapsibleSection>
      </div>
    </section>
  );
}
