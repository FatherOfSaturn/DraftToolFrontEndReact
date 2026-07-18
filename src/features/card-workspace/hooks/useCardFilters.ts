import { useMemo, useState } from 'react';
import {
  filterCards,
  type CardFilterControls,
  type CmcBucket,
  type ManaColor,
} from '../model/cardFilters';
import type { Card } from '../../../shared/model/cardTypes';

export interface UseCardFiltersResult {
  search: string;
  setSearch: (value: string) => void;
  activeColors: ManaColor[];
  toggleColor: (color: ManaColor) => void;
  activeCmc: CmcBucket[];
  toggleCmc: (bucket: CmcBucket) => void;
  activeType: string[];
  toggleType: (type: string) => void;
  /** `cards`, filtered by the current search/color/CMC/type state. */
  filteredCards: Card[];
  /** Spread directly onto `<FilterPanel {...filterPanelProps} />`. */
  filterPanelProps: CardFilterControls;
}

/**
 * Search/color/CMC/type filter state for any screen that pairs a
 * `<FilterPanel/>` with a filterable card list — currently the draft
 * board (filters the current pack) and the deck builder (filters the
 * decklist). Both screens previously kept their own copy of this exact
 * state shape and filter predicate; this hook is the single
 * implementation both now share.
 *
 * @param cards The unfiltered card list to filter (e.g. the current
 *   pack's cards, or the full decklist). Recomputes `filteredCards`
 *   whenever this array or the filter state changes.
 */
export function useCardFilters(cards: Card[]): UseCardFiltersResult {
  const [search, setSearch] = useState('');
  const [activeColors, setActiveColors] = useState<ManaColor[]>([]);
  const [activeCmc, setActiveCmc] = useState<CmcBucket[]>([]);
  const [activeType, setActiveType] = useState<string[]>([]);

  function toggleColor(color: ManaColor) {
    setActiveColors((prev) => (prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]));
  }

  function toggleCmc(bucket: CmcBucket) {
    setActiveCmc((prev) => (prev.includes(bucket) ? prev.filter((b) => b !== bucket) : [...prev, bucket]));
  }

  function toggleType(type: string) {
    setActiveType((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]));
  }

  const filteredCards = useMemo(
    () => filterCards(cards, { search, activeColors, activeCmc, activeType }),
    [cards, search, activeColors, activeCmc, activeType]
  );

  return {
    search,
    setSearch,
    activeColors,
    toggleColor,
    activeCmc,
    toggleCmc,
    activeType,
    toggleType,
    filteredCards,
    filterPanelProps: {
      search,
      onSearchChange: setSearch,
      activeColors,
      onToggleColor: toggleColor,
      activeCmc,
      onToggleCmc: toggleCmc,
      activeType,
      onToggleType: toggleType,
    },
  };
}
