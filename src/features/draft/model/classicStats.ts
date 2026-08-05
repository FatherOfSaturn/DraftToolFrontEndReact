import type { ClassicPlayer } from './classicGameTypes';

/**
 * Total cards still left for a classic player to draft.
 *
 * Each classic player drafts exactly `packsPerPlayer × cardsPerPack` cards.
 * `dealtCardPacks` stays at the constant `packsPerPlayer` count for the whole
 * game, and every pack reports the same `originalCardsInPack`, so:
 *
 *   cardsLeftToDraft = dealtCardPacks.length × originalCardsInPack − cardsDrafted.length
 */
export function computeClassicCardsLeft(player: ClassicPlayer): number {
  const cardsPerPack = player.dealtCardPacks[0]?.originalCardsInPack ?? 0;
  return player.dealtCardPacks.length * cardsPerPack - player.cardsDrafted.length;
}
