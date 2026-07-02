import { Header } from '../layout/Header';
import { Footer } from '../layout/Footer';

export interface RitualDefinition {
  id: string;
  name: string;
  tag: string;
  tagTextClass: string;
  tagBorderClass: string;
  description: string;
  icon: string;
  cardBorderClass: string;
  artGradientClass: string;
  glowClass?: string;
}

const RITUALS: RitualDefinition[] = [
  {
    id: 'ancient-archive',
    name: 'Pyramid Draft',
    tag: 'CUBE DRAFT',
    tagTextClass: 'text-primary',
    tagBorderClass: 'border-primary/30',
    description:
      "Most Popular Draft format here. Two Players. >90% of cube seen by both players.",
    icon: 'auto_fix',
    cardBorderClass: '',
    artGradientClass: 'bg-gradient-to-br from-tertiary-container/40 via-surface-container to-primary-container/30',
    glowClass: 'ritual-gradient',
  },
  {
    id: 'chaos-manifest',
    name: 'Chaos Draft',
    tag: 'RANDOMIZED',
    tagTextClass: 'text-secondary',
    tagBorderClass: 'border-secondary/30',
    description:
      'Embrace the unpredictable. Open randomized packs from across time and space in a chaotic clash of sets.',
    icon: 'cyclone',
    cardBorderClass: 'border-secondary/20',
    artGradientClass: 'bg-gradient-to-br from-secondary-container/40 via-surface-container to-primary-container/40',
  },
  {
    id: 'alchemists-lab',
    name: "Winston Draft",
    tag: 'CUSTOM SET',
    tagTextClass: 'text-tertiary',
    tagBorderClass: 'border-tertiary/30',
    description:
      'A space for creation. Forge your own destiny by drafting custom set configurations and experimental brews.',
    icon: 'science',
    cardBorderClass: 'border-tertiary/20',
    artGradientClass: 'bg-gradient-to-br from-tertiary-container/50 via-surface-container to-surface-container-high',
  },
  {
    id: 'planeswalkers-trial',
    name: "Classic Draft",
    tag: 'LEGACY',
    tagTextClass: 'text-primary',
    tagBorderClass: 'border-primary/30',
    description:
      'A test of legends. Draft from the most powerful legacy cards ever printed in a high-stakes competitive environment.',
    icon: 'military_tech',
    cardBorderClass: '',
    artGradientClass: 'bg-gradient-to-br from-primary-container/30 via-surface-container to-secondary-container/20',
  },
];

export interface DraftSelectionPageProps {
  /** Called when a ritual card's "Start Draft" is clicked. Currently
   * inert by design — there's no real cube-selection wiring into Draft
   * Setup yet, so this just lets a consumer log/observe the choice
   * without the component itself navigating anywhere. */
  onSelectRitual?: (ritual: RitualDefinition) => void;
  /** Called when the dashed "Manifest New Ritual" card is clicked. Also
   * inert by design for the same reason. */
  onCreateNewRitual?: () => void;
}

/**
 * Draft-mode picker ("choose your ritual") shown before Draft Setup.
 * There's no real cube-selection wiring yet — per App.tsx's
 * DraftSelectionRoute, clicking any ritual card (or "Manifest New
 * Ritual") just navigates on to /draft-setup; the chosen ritual isn't
 * currently carried forward into that form. All four ritual cards are
 * visually complete and equally clickable in the meantime.
 */
export function DraftSelectionPage({ onSelectRitual, onCreateNewRitual }: DraftSelectionPageProps) {
  return (
    <div className="min-h-screen relative selection:bg-primary-container selection:text-on-primary-container">
      <DecorativeGlow />
      <Header />

      <main className="relative z-10 pt-24 pb-xl px-margin-mobile md:px-margin-desktop max-w-[1200px] mx-auto">
        <section className="text-center mb-xl">
          <span className="inline-block px-4 py-1 rounded-full bg-primary-container/10 border border-primary/20 text-primary font-label-sm text-label-sm mb-md uppercase tracking-widest">
            Draft Selection
          </span>
          <h2 className="font-display text-display text-on-surface mb-sm">Choose Your Draft</h2>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl mx-auto">
            Choose from a variety of draft formats. Each has its own quirks, and has their own fun. Some cubes do better with different draft styles.
          </p>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
          {RITUALS.map((ritual) => (
            <RitualCard key={ritual.id} ritual={ritual} onSelect={() => onSelectRitual?.(ritual)} />
          ))}
          <ManifestNewRitualCard onClick={() => onCreateNewRitual?.()} />
        </div>
      </main>

      <Footer />
    </div>
  );
}

function DecorativeGlow() {
  return (
    <>
      <div className="fixed top-1/4 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-1/4 -right-32 w-80 h-80 bg-secondary/10 rounded-full blur-[100px] pointer-events-none z-0" />
    </>
  );
}

interface RitualCardProps {
  ritual: RitualDefinition;
  onSelect: () => void;
}

function RitualCard({ ritual, onSelect }: RitualCardProps) {
  return (
    <div
      className={`glass-card rounded-xl p-md flex flex-col h-full ${ritual.cardBorderClass} ${ritual.glowClass ?? ''}`}
    >
      <div className="h-48 w-full rounded-lg mb-md overflow-hidden relative border border-outline-variant/30">
        <div className={`w-full h-full ${ritual.artGradientClass}`} />
        <div
          className={`absolute top-sm right-sm bg-surface/80 backdrop-blur-md px-3 py-1 rounded-full border ${ritual.tagBorderClass}`}
        >
          <span className={`font-label-sm text-label-sm ${ritual.tagTextClass}`}>{ritual.tag}</span>
        </div>
      </div>
      <h3 className="font-headline-md text-headline-md text-on-surface mb-xs">{ritual.name}</h3>
      <p className="font-body-md text-body-md text-on-surface-variant mb-xl flex-grow">{ritual.description}</p>
      <button
        type="button"
        className="w-full py-md bg-primary text-on-primary font-label-md text-label-md rounded-lg flex items-center justify-center gap-sm hover:brightness-110 active:scale-[0.98] transition-all shadow-[0_4px_12px_rgba(169,116,255,0.4)]"
        onClick={onSelect}
      >
        START DRAFT
        <span className="material-symbols-outlined text-sm mana-glow">{ritual.icon}</span>
      </button>
    </div>
  );
}

function ManifestNewRitualCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="glass-card rounded-xl p-md flex flex-col items-center justify-center h-full border-dashed border-2 border-outline-variant/50 min-h-[400px] hover:border-primary/50 group cursor-pointer"
    >
      <div className="w-16 h-16 rounded-full bg-surface-container-high border border-outline-variant/30 flex items-center justify-center mb-md group-hover:scale-110 group-hover:bg-primary-container/20 group-hover:border-primary/50 transition-all duration-300">
        <span className="material-symbols-outlined text-4xl text-on-surface-variant group-hover:text-primary">
          add
        </span>
      </div>
      <h3 className="font-headline-md text-headline-md text-on-surface mb-xs">Manifest New Ritual</h3>
      <p className="font-body-md text-body-md text-on-surface-variant text-center px-lg">
        Compose a new drafting format from the aether. Custom rules, restrictions, and card pools
        await.
      </p>
    </button>
  );
}

