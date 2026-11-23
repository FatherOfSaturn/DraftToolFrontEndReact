import type { BurnPlayerSnapshot, BurnRemainderPolicy } from './burnGameTypes';

/** How many cards a player drafts and burns from the pack they hold this turn. */
export interface TurnPlan {
  draft: number;
  burn: number;
}

/**
 * The required turn logic from the Burn Draft API spec.
 *
 * Given the number of cards left in the held pack (`remaining`), the draft
 * quota `N` and burn quota `M`:
 *
 *  - Full pass:     R >= N + M  -> draft N, burn M
 *  - Short pass:    R <= N      -> draft everything, burn nothing
 *  - Partial pass:  N < R < N+M -> draft N and either burn or draft the
 *                                  leftovers, per the remainder policy.
 */
export function planTurn(
  remaining: number,
  draftQuota: number,
  burnQuota: number,
  policy: BurnRemainderPolicy
): TurnPlan {
  if (remaining >= draftQuota + burnQuota) {
    return { draft: draftQuota, burn: burnQuota };
  }
  const draft = Math.min(draftQuota, remaining);
  const extras = remaining - draft;
  return policy === 'DRAFT_EXTRAS'
    ? { draft: draft + extras, burn: 0 }
    : { draft, burn: extras };
}

/**
 * Total cards still left for a burn player to act on (neither drafted nor
 * burned yet).
 *
 * Prefers the backend's `cardsLeftToDraft`; falls back to deriving it from
 * `dealtCardPacks` so minimal snapshots still produce a number:
 *
 *   cardsLeftToDraft = dealtCardPacks.length × originalCardsInPack
 *                      − cardsDrafted.length − cardsBurned.length
 */
export function computeBurnCardsLeft(player: BurnPlayerSnapshot): number {
  if (player.cardsLeftToDraft !== undefined) {
    return player.cardsLeftToDraft;
  }
  const cardsPerPack = player.dealtCardPacks?.[0]?.originalCardsInPack ?? 0;
  return (
    (player.dealtCardPacks?.length ?? 0) * cardsPerPack -
    player.cardsDrafted.length -
    player.cardsBurned.length
  );
}

/** How one pack is consumed across its full lifetime (all turns it is held). */
export interface PackOutcome {
  drafted: number;
  burned: number;
  leftover: number;
}

/**
 * Simulates a single pack of `packSize` cards being worked through turn after
 * turn (draft N, burn M, pass remainder) until fewer than N + M remain, then
 * applies the remainder policy to the final partial turn.
 *
 * This powers the live setup calculator (mirrors the standalone
 * burn-calculator page) and is pure so it can be unit tested.
 */
export function packOutcome(
  packSize: number,
  draftQuota: number,
  burnQuota: number,
  policy: BurnRemainderPolicy
): PackOutcome {
  const cycle = draftQuota + burnQuota;
  if (cycle <= 0 || packSize <= 0) {
    return { drafted: 0, burned: 0, leftover: Math.max(0, packSize) };
  }

  const fullCycles = Math.floor(packSize / cycle);
  const remainder = packSize % cycle;

  let drafted = fullCycles * draftQuota;
  let burned = fullCycles * burnQuota;

  if (remainder > 0) {
    const partial = planTurn(remainder, draftQuota, burnQuota, policy);
    drafted += partial.draft;
    burned += partial.burn;
  }

  return { drafted, burned, leftover: packSize - drafted - burned };
}
