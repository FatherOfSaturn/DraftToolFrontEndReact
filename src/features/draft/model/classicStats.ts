import type { DraftPlayerSnapshot } from './classicGameTypes';

/**
 * Total cards still left for a classic player to draft.
 *
 * Prefers the backend's `cardsLeftToDraft` field when present (the current
 * contract for `DraftPlayerSnapshot`). Falls back to a defensive computation
 * from `dealtCardPacks` — used by the mock and by snapshots that omit both
 * fields — so this never throws on a minimal player view:
 *
 *   cardsLeftToDraft = dealtCardPacks.length × originalCardsInPack − cardsDrafted.length
 */
export function computeClassicCardsLeft(player: DraftPlayerSnapshot): number {
  if (player.cardsLeftToDraft !== undefined) {
    return player.cardsLeftToDraft;
  }
  const cardsPerPack = player.dealtCardPacks?.[0]?.originalCardsInPack ?? 0;
  return (player.dealtCardPacks?.length ?? 0) * cardsPerPack - player.cardsDrafted.length;
}
