import { useMemo, useState } from 'react';
import { type CardCategory } from '../../../shared/lib/cardCategory';
import { lookupTypeLine } from '../../../shared/lib/cardTypeLookup';
import { probabilityOfAtLeast } from '../../../shared/lib/hypergeometric';
import { parseDecklist } from '../../../shared/lib/parseDecklist';
import { expandDecklist, shuffle, type ExpandedCard } from '../model/mulliganUtils';

const SAMPLE_DECKLIST = `4 Counterspell
4 Brainstorm
4 Lightning Bolt
2 Path to Exile
2 Sol Ring
17 Island
17 Mountain
10 Forest`;

export function useMulliganSimulator() {
  const [decklistText, setDecklistText] = useState(SAMPLE_DECKLIST);
  const [infusedText, setInfusedText] = useState(SAMPLE_DECKLIST);
  const [deck, setDeck] = useState<ExpandedCard[]>(() => expandDecklist(parseDecklist(SAMPLE_DECKLIST)));
  const [{ hand, library }, setDrawState] = useState<{ hand: ExpandedCard[]; library: ExpandedCard[] }>(() => {
    const shuffled = shuffle(expandDecklist(parseDecklist(SAMPLE_DECKLIST)));
    return { hand: shuffled.slice(0, 7), library: shuffled.slice(7) };
  });
  const [wellAtLeast, setWellAtLeast] = useState(2);
  const [wellCategory, setWellCategory] = useState<CardCategory>('Land');
  const [wellInNext, setWellInNext] = useState(10);

  const deckSize = deck.length;
  const unknownNames = useMemo(() => {
    const names = new Set<string>();
    parseDecklist(infusedText).forEach((entry) => {
      if (lookupTypeLine(entry.name) === null) names.add(entry.name);
    });
    return [...names];
  }, [infusedText]);

  const categoryCounts = useMemo(() => {
    const counts: Record<CardCategory, number> = {
      Land: 0,
      Creature: 0,
      Instant: 0,
      Sorcery: 0,
      Artifact: 0,
      Enchantment: 0,
      Planeswalker: 0,
      Battle: 0,
      Unknown: 0,
    };
    deck.forEach((card) => {
      counts[card.category] += 1;
    });
    return counts;
  }, [deck]);

  const landInOpenerPct = useMemo(
    () => probabilityOfAtLeast({ deckSize, categoryCount: categoryCounts.Land, cardsSeenByThen: 7, atLeast: 1 }),
    [deckSize, categoryCounts]
  );
  const creatureByT3Pct = useMemo(
    () =>
      probabilityOfAtLeast({ deckSize, categoryCount: categoryCounts.Creature, cardsSeenByThen: 9, atLeast: 1 }),
    [deckSize, categoryCounts]
  );
  const interactionCount = categoryCounts.Instant + categoryCounts.Sorcery;
  const interactionDensity = deckSize > 0 ? interactionCount / deckSize : 0;
  const interactionLabel =
    interactionDensity >= 0.2 ? 'High' : interactionDensity >= 0.1 ? 'Moderate' : 'Low';

  const manaScrewPct = useMemo(() => {
    if (deckSize === 0) return 0;
    const atLeast3 = probabilityOfAtLeast({
      deckSize,
      categoryCount: categoryCounts.Land,
      cardsSeenByThen: 10,
      atLeast: 3,
    });
    return 1 - atLeast3;
  }, [deckSize, categoryCounts]);

  const wellResult = useMemo(() => {
    if (deckSize === 0) return 0;
    return probabilityOfAtLeast({
      deckSize,
      categoryCount: categoryCounts[wellCategory],
      cardsSeenByThen: Math.min(wellInNext, deckSize),
      atLeast: wellAtLeast,
    });
  }, [deckSize, categoryCounts, wellCategory, wellAtLeast, wellInNext]);

  function handleInfuseList() {
    const entries = parseDecklist(decklistText);
    const expanded = expandDecklist(entries);
    const shuffled = shuffle(expanded);
    setDeck(expanded);
    setInfusedText(decklistText);
    setDrawState({ hand: shuffled.slice(0, 7), library: shuffled.slice(7) });
  }

  function handleMulligan() {
    const shuffled = shuffle(deck);
    setDrawState({ hand: shuffled.slice(0, 7), library: shuffled.slice(7) });
  }

  function handleDrawCard() {
    setDrawState((previous) => {
      if (previous.library.length === 0) return previous;
      const [next, ...rest] = previous.library;
      return { hand: [...previous.hand, next], library: rest };
    });
  }

  return {
    decklistText,
    setDecklistText,
    deckSize,
    unknownNames,
    categoryCounts,
    hand,
    librarySize: library.length,
    landInOpenerPct,
    creatureByT3Pct,
    interactionLabel,
    manaScrewPct,
    wellAtLeast,
    setWellAtLeast,
    wellCategory,
    setWellCategory,
    wellInNext,
    setWellInNext,
    wellResult,
    handleInfuseList,
    handleMulligan,
    handleDrawCard,
  };
}
