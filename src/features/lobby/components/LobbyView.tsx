import { useToast } from '../../../shared/components/Toast';
import type { LobbyInfo } from '../model/lobbyTypes';

interface LobbyViewProps {
  lobbyInfo: LobbyInfo;
  mySlotIndex: number;
  isHost: boolean;
  onStart: () => void;
  onLeave: () => void;
  isStarting: boolean;
  error?: string | null;
}

const DRAFT_TYPE_LABELS: Record<string, string> = {
  pyramid: 'Pyramid Draft',
  classic: 'Classic Draft',
};

export function LobbyView({
  lobbyInfo,
  mySlotIndex,
  isHost,
  onStart,
  onLeave,
  isStarting,
  error,
}: LobbyViewProps) {
  const { showToast } = useToast();
  const basePath =
    lobbyInfo.draftType === 'pyramid' ? '/draft-setup' : `/draft-setup/${lobbyInfo.draftType}`;
  const shareUrl = `${window.location.origin}${basePath}?lobby=${lobbyInfo.lobbyCode}`;
  const emptySlots = lobbyInfo.maxPlayers - lobbyInfo.players.length;
  const canStart = lobbyInfo.players.length >= lobbyInfo.minPlayers && !isStarting;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      showToast('Copied lobby link');
    } catch {
      // fallback
    }
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(lobbyInfo.lobbyCode);
      showToast('Copied lobby code');
    } catch {
      // fallback
    }
  }

  return (
    <section className="bg-surface-container rounded-xl p-lg shadow-xl relative overflow-hidden">
      <div className="relative z-10">
        <h2 className="font-display text-headline-lg text-on-surface mb-md flex items-center gap-sm">
          <span className="material-symbols-outlined text-primary">lan</span>
          Lobby
        </h2>

        {/* Lobby Info */}
        <div className="flex flex-wrap items-center gap-sm mb-lg">
          <span className="bg-primary/10 text-primary font-label-sm px-3 py-1 rounded-full">
            {DRAFT_TYPE_LABELS[lobbyInfo.draftType] ?? lobbyInfo.draftType}
          </span>
          <span className="font-label-sm text-on-surface-variant">
            Code:
          </span>
          <button
            className="font-label-md text-primary bg-primary/10 px-3 py-1 rounded-md hover:bg-primary/20 transition-colors flex items-center gap-1"
            onClick={copyCode}
            type="button"
          >
            {lobbyInfo.lobbyCode}
            <span className="material-symbols-outlined text-[14px]">content_copy</span>
          </button>
        </div>

        {/* Share Link */}
        <div className="bg-surface-container-low rounded-lg p-sm mb-lg flex items-center gap-sm">
          <span className="material-symbols-outlined text-outline text-[18px] shrink-0">link</span>
          <span className="font-body-sm text-outline truncate flex-1">{shareUrl}</span>
          <button
            className="bg-primary/10 text-primary font-label-sm px-3 py-1 rounded-md hover:bg-primary/20 transition-colors shrink-0"
            onClick={copyLink}
            type="button"
          >
            Copy Link
          </button>
        </div>

        {/* Player Slots */}
        <div className="space-y-xs mb-lg">
          <div className="flex justify-between items-end mb-sm">
            <label className="font-label-sm text-on-surface-variant uppercase tracking-widest">
              Players
            </label>
            <span className="font-label-sm text-primary">
              {lobbyInfo.players.length} / {lobbyInfo.maxPlayers}
              {emptySlots > 0 && (
                <span className="text-outline"> ({emptySlots} open)</span>
              )}
            </span>
          </div>

          {Array.from({ length: lobbyInfo.maxPlayers }, (_, i) => {
            const player = lobbyInfo.players.find((p) => p.slotIndex === i);
            const isMe = i === mySlotIndex;
            const isSlotEmpty = !player;

            return (
              <div
                key={i}
                className={`flex items-center gap-sm rounded-lg p-xs transition-all ${
                  isMe
                    ? 'bg-primary/10 border border-primary/30'
                    : isSlotEmpty
                      ? 'bg-surface-container-low/50 border border-dashed border-outline-variant/20'
                      : 'bg-surface-container-low border border-transparent'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded flex items-center justify-center font-label-md shrink-0 ${
                    isSlotEmpty
                      ? 'bg-surface-container-high text-outline'
                      : 'bg-primary/10 text-primary'
                  }`}
                >
                  {i + 1}
                </div>

                {isSlotEmpty ? (
                  <span className="font-body-md text-outline/50 italic">Waiting…</span>
                ) : (
                  <span className="font-body-md text-on-surface">
                    {player.displayName}
                    {isMe && (
                      <span className="font-label-sm text-primary ml-1">(You)</span>
                    )}
                    {player.accountID === lobbyInfo.hostAccountID && (
                      <span className="font-label-sm text-secondary ml-1">Host</span>
                    )}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex gap-sm">
          {isHost && (
            <button
              className="flex-1 bg-primary hover:bg-primary-container text-on-primary py-md rounded-xl font-label-md text-label-md transition-all transform hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              onClick={onStart}
              disabled={!canStart}
            >
              {isStarting ? (
                <>
                  <span className="material-symbols-outlined animate-spin">sync</span>
                  Starting…
                </>
              ) : (
                <>
                  Start Draft
                  <span className="material-symbols-outlined">play_arrow</span>
                </>
              )}
            </button>
          )}

          {!isHost && (
            <div className="flex-1 bg-surface-container-high rounded-xl py-md text-center font-body-md text-on-surface-variant">
              Waiting for host to start…
              <span className="material-symbols-outlined text-[18px] ml-1 animate-pulse">more_horiz</span>
            </div>
          )}

          <button
            className="border border-outline/30 text-outline hover:text-error hover:border-error/50 py-md px-lg rounded-xl font-label-sm transition-all active:scale-95 flex items-center justify-center gap-sm"
            onClick={onLeave}
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            Leave
          </button>
        </div>

        {error && (
          <p className="mt-md text-sm text-error text-center">{error}</p>
        )}
      </div>
    </section>
  );
}
