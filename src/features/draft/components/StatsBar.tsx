export interface StatsBarProps {
  playerName: string;
  partnerName: string | null;
  doublePicksRemaining: number;
  packsLeft: number;
  packsTotal: number;
  gameID: string;
}

function copyDraftLink(gameID: string, partnerName: string) {
  const url = `${window.location.origin}/draft/${encodeURIComponent(gameID)}/${encodeURIComponent(partnerName)}`;
  navigator.clipboard.writeText(url).catch(() => {});
}

/** The fixed stat strip under the header showing player/partner names,
 * extra picks remaining, overall pick progress, and the game ID. */
export function StatsBar({ playerName, partnerName, doublePicksRemaining, packsLeft, packsTotal, gameID }: StatsBarProps) {
  const pct = packsTotal > 0 ? Math.round(((packsTotal - packsLeft) / packsTotal) * 100) : 0;
  return (
    <section className="fixed top-16 w-full z-40 bg-surface-container-lowest/90 backdrop-blur-md border-b border-outline-variant/10 px-margin-mobile md:px-margin-desktop h-12 flex items-center justify-between overflow-x-auto whitespace-nowrap gap-lg md:gap-lg no-scrollbar">
      <div className="flex gap-md items-center">
        <div className="flex items-center gap-xs">
          <span className="text-on-surface-variant font-label-sm text-label-sm hidden sm:inline">PLAYER:</span>
          <span className="text-secondary font-label-md text-label-md uppercase tracking-wider">
            {playerName}
          </span>
        </div>
        <div className="w-px h-4 bg-outline-variant/30 hidden md:block" />
        <div className="hidden md:flex items-center gap-xs">
          <span className="text-on-surface-variant font-label-sm text-label-sm">PARTNER:</span>
          <span className="text-tertiary font-label-md text-label-md uppercase tracking-wider">
            {partnerName ?? '—'}
          </span>
          {partnerName && (
            <button
              className="material-symbols-outlined text-[14px] text-outline-variant hover:text-primary transition-colors ml-1"
              title="Copy partner draft link"
              onClick={() => copyDraftLink(gameID, partnerName)}
            >
              share
            </button>
          )}
        </div>
        <div className="w-px h-4 bg-outline-variant/30 hidden md:block" />
        <div className="flex items-center gap-xs bg-primary/10 px-sm py-0.5 rounded-full border border-primary/20">
          <span className="material-symbols-outlined text-[16px] text-primary">bolt</span>
          <span className="text-on-surface-variant font-label-sm text-label-sm hidden sm:inline">EXTRA PICKS:</span>
          <span className="text-primary font-bold text-label-md">{doublePicksRemaining}</span>
        </div>
      </div>
      <div className="flex gap-lg items-center">
        <div className="flex items-center gap-base">
          <div className="bg-primary-container/20 px-sm py-1 rounded-full border border-primary-container/30">
            <span className="text-primary font-label-sm text-label-sm">
              PACKS LEFT: {packsLeft}/{packsTotal}
            </span>
          </div>
          <div className="h-1.5 w-20 md:w-32 bg-surface-variant rounded-full overflow-hidden">
            <div
              className="h-full bg-primary shadow-[0_0_8px_rgba(213,186,255,0.6)] transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        <div className="hidden lg:flex items-center gap-xs">
          <span className="text-on-surface-variant font-label-sm text-label-sm">GAME ID:</span>
          <span className="text-on-surface font-label-sm text-label-sm opacity-60">{gameID}</span>
        </div>
      </div>
    </section>
  );
}
