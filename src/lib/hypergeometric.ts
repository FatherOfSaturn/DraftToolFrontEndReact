/**
 * Hypergeometric distribution helpers for "what's the chance of drawing
 * at least K of a category in N draws from a deck of size D containing
 * K_total copies of that category" — the standard MTG draw-probability
 * question.
 *
 * All functions are pure and deck-shape-agnostic: they take plain numbers,
 * not Card objects, so they're easy to unit test and reuse anywhere
 * (opening hand odds, "by turn N" odds, mulligan odds, etc).
 */

/** log(n!) via the Lanczos approximation of log-gamma, for numerically
 * stable factorials/combinations on decks with hundreds of cards —
 * naive factorials overflow well before a 99-card Commander deck. */
function logGamma(x: number): number {
  const g = 7;
  const c = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
  ];
  if (x < 0.5) {
    return Math.log(Math.PI / Math.sin(Math.PI * x)) - logGamma(1 - x);
  }
  x -= 1;
  let a = c[0];
  const t = x + g + 0.5;
  for (let i = 1; i < g + 2; i++) {
    a += c[i] / (x + i);
  }
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}

function logFactorial(n: number): number {
  return logGamma(n + 1);
}

/** log(nCr) — log of "n choose r", 0 if r is out of range. */
function logChoose(n: number, r: number): number {
  if (r < 0 || r > n) return -Infinity;
  if (r === 0 || r === n) return 0;
  return logFactorial(n) - logFactorial(r) - logFactorial(n - r);
}

/**
 * P(X = k) for the hypergeometric distribution: drawing exactly k
 * successes in `draws` draws (without replacement) from a population of
 * `populationSize` containing `successStates` successes.
 */
export function hypergeometricPMF(
  populationSize: number,
  successStates: number,
  draws: number,
  k: number
): number {
  if (k < 0 || k > draws || k > successStates) return 0;
  if (draws - k > populationSize - successStates) return 0;

  const logP =
    logChoose(successStates, k) +
    logChoose(populationSize - successStates, draws - k) -
    logChoose(populationSize, draws);

  return Math.exp(logP);
}

/**
 * P(X >= atLeast) — the question players actually ask ("what's my chance
 * of having at least 2 lands in my opening 7").
 */
export function hypergeometricAtLeast(
  populationSize: number,
  successStates: number,
  draws: number,
  atLeast: number
): number {
  if (atLeast <= 0) return 1;

  const maxK = Math.min(draws, successStates);
  let total = 0;
  for (let k = atLeast; k <= maxK; k++) {
    total += hypergeometricPMF(populationSize, successStates, draws, k);
  }
  // Clamp for float drift — sums of many small probabilities can creep
  // slightly past 1 or below 0 at the edges.
  return Math.min(1, Math.max(0, total));
}

/** P(X <= atMost) — e.g. "chance of mana screw" (fewer than N lands). */
export function hypergeometricAtMost(
  populationSize: number,
  successStates: number,
  draws: number,
  atMost: number
): number {
  return 1 - hypergeometricAtLeast(populationSize, successStates, draws, atMost + 1);
}

export interface DeckCategoryProbabilityInput {
  deckSize: number;
  categoryCount: number;
  cardsSeenByThen: number;
  atLeast: number;
}

/** Convenience wrapper matching the "Probability Well" calculator's
 * exact framing: "probability of drawing at least N of [category] in
 * the next M cards", given the deck's total size and how many copies of
 * that category remain in the deck. */
export function probabilityOfAtLeast({
  deckSize,
  categoryCount,
  cardsSeenByThen,
  atLeast,
}: DeckCategoryProbabilityInput): number {
  return hypergeometricAtLeast(deckSize, categoryCount, cardsSeenByThen, atLeast);
}
