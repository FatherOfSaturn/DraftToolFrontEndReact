import { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { type CardCategory } from '../../../shared/lib/cardCategory';
import { probabilityOfAtLeast } from '../../../shared/lib/hypergeometric';
import { importDecklist } from '../../card-workspace/utils/importDecklist';
import { scryfallApi } from '../../card-workspace/api/scryfallApi';
import { expandFromCards, shuffle, type ExpandedCard } from '../model/mulliganUtils';
import type { Card } from '../../../shared/model/cardTypes';

const SAMPLE_DECKLIST = `4 Counterspell
4 Brainstorm
4 Lightning Bolt
2 Path to Exile
2 Sol Ring
17 Island
17 Mountain
10 Forest`;

export function useMulliganSimulator() {
  const location = useLocation();
  const deckCardIds = (location.state as { deckCardIds?: string[] } | null)?.deckCardIds;

  const [decklistText, setDecklistText] = useState(SAMPLE_DECKLIST);
  const [deck, setDeck] = useState<ExpandedCard[]>(() => expandFromCards([]));
  const [loading, setLoading] = useState(false);
  const [unknownNames, setUnknownNames] = useState<string[]>([]);
  const [{ hand, library }, setDrawState] = useState<{ hand: ExpandedCard[]; library: ExpandedCard[] }>(() => {
    return { hand: [], library: [] };
  });
  const [wellAtLeast, setWellAtLeast] = useState(2);
  const [wellCategory, setWellCategory] = useState<CardCategory>('Land');
  const [wellInNext, setWellInNext] = useState(10);

  // Load deck on first render: either from nav state card IDs, or sample decklist
  const [initialized, setInitialized] = useState(false);
  if (!initialized) {
    setInitialized(true);
    setLoading(true);

    if (deckCardIds && deckCardIds.length > 0) {
      // Resolve saved deck card IDs via the Scryfall API
      Promise.allSettled(
        deckCardIds.map((id) => scryfallApi.getCardById(id))
      ).then((results) => {
        const resolved: Card[] = [];
        let failed = 0;
        for (const r of results) {
          if (r.status === 'fulfilled') {
            resolved.push(r.value);
          } else {
            failed++;
          }
        }
        const expanded = expandFromCards(resolved);
        const shuffled = shuffle(expanded);
        setDeck(expanded);
        setUnknownNames(failed > 0 ? [`${failed} card${failed === 1 ? '' : 's'} could not be loaded`] : []);
        setDrawState({ hand: shuffled.slice(0, 7), library: shuffled.slice(7) });
        setLoading(false);
      });
    } else {
      // Load sample decklist via the batch API
      importDecklist(SAMPLE_DECKLIST).then((result) => {
        const expanded = expandFromCards(result.cards);
        const shuffled = shuffle(expanded);
        setDeck(expanded);
        setUnknownNames(result.unknownNames);
        setDrawState({ hand: shuffled.slice(0, 7), library: shuffled.slice(7) });
        setLoading(false);
      });
    }
  }

  const deckSize = deck.length;

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

  async function handleInfuseList() {
    setLoading(true);
    try {
      const result = await importDecklist(decklistText);
      const expanded = expandFromCards(result.cards);
      const shuffled = shuffle(expanded);
      setDeck(expanded);
      setUnknownNames(result.unknownNames);
      setDrawState({ hand: shuffled.slice(0, 7), library: shuffled.slice(7) });
    } catch {
      setDeck([]);
      setDrawState({ hand: [], library: [] });
    } finally {
      setLoading(false);
    }
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
    loading,
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
