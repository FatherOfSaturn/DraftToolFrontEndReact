export interface StatsBarProps {
  playerName: string;
  /** Pyramid only — omitting hides the partner block (and share link). */
  partnerName?: string | null;
  /** Pyramid only — omitting hides the extra-picks pill. */
  doublePicksRemaining?: number;
  /** Pyramid only — pack progress (used when cardsLeftToDraft is omitted). */
  packsLeft?: number;
  /** Pyramid only — pack progress total. */
  packsTotal?: number;
  /** Classic only — replaces "PACKS LEFT" with "CARDS LEFT TO DRAFT". */
  cardsLeftToDraft?: number;
  /** Classic only — total cards this player will draft, for the progress bar. */
  cardsToDraftTotal?: number;
  gameID: string;
}

function copyDraftLink(gameID: string, partnerName: string) {
  const url = `${window.location.origin}/draft/${encodeURIComponent(gameID)}/${encodeURIComponent(partnerName)}`;
  navigator.clipboard.writeText(url).catch(() => {});
}

/** The fixed stat strip under the header showing player/partner names,
 * extra picks remaining, overall pick progress, and the game ID. */
export function StatsBar({
  playerName,
  partnerName,
  doublePicksRemaining,
  packsLeft = 0,
  packsTotal = 0,
  cardsLeftToDraft,
  cardsToDraftTotal,
  gameID,
}: StatsBarProps) {
  const isClassic = cardsLeftToDraft !== undefined;
  const cardsDrafted = cardsToDraftTotal !== undefined ? Math.max(0, cardsToDraftTotal - cardsLeftToDraft!) : 0;
  const pct =
    cardsToDraftTotal !== undefined
      ? cardsToDraftTotal > 0
        ? Math.round((cardsDrafted / cardsToDraftTotal) * 100)
        : 0
      : packsTotal > 0
        ? Math.round(((packsTotal - packsLeft) / packsTotal) * 100)
        : 0;
  return (
    <section className="fixed top-16 w-full z-40 bg-surface-container-lowest/90 backdrop-blur-md border-b border-outline-variant/10 px-margin-mobile md:px-margin-desktop h-12 flex items-center justify-between overflow-x-auto whitespace-nowrap gap-md lg:gap-lg no-scrollbar">
      <div className="flex gap-md items-center">
        <div className="flex items-center gap-xs">
          <span className="text-on-surface-variant font-label-sm text-label-sm hidden sm:inline">PLAYER:</span>
          <span className="text-secondary font-label-md text-label-md uppercase tracking-wider">
            {playerName}
          </span>
        </div>
        {partnerName !== undefined && (
          <>
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
          </>
        )}
        {doublePicksRemaining !== undefined && (
          <>
            <div className="w-px h-4 bg-outline-variant/30 hidden md:block" />
            <div className="flex items-center gap-xs bg-primary/10 px-sm py-0.5 rounded-full border border-primary/20">
              <span className="material-symbols-outlined text-[16px] text-primary">bolt</span>
              <span className="text-on-surface-variant font-label-sm text-label-sm hidden sm:inline">EXTRA PICKS:</span>
              <span className="text-primary font-bold text-label-md">{doublePicksRemaining}</span>
            </div>
          </>
        )}
      </div>
      <div className="flex gap-md lg:gap-lg items-center">
        <div className="flex items-center gap-base">
          <div className="bg-primary-container/20 px-sm py-1 rounded-full border border-primary-container/30">
            <span className="text-primary font-label-sm text-label-sm">
              {isClassic ? (
                <>
                  <span className="hidden sm:inline">CARDS LEFT TO DRAFT: </span>
                  {cardsLeftToDraft}
                </>
              ) : (
                <>
                  <span className="hidden sm:inline">PACKS LEFT: </span>
                  {packsLeft}/{packsTotal}
                </>
              )}
            </span>
          </div>
          <div className="h-1.5 w-20 md:w-32 bg-surface-variant rounded-full overflow-hidden">
            <div
              className="h-full bg-primary shadow-[0_0_8px_var(--glow-primary-light)] transition-all duration-300"
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
