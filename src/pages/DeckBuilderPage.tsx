import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { FilterPanel } from '../components/draft-board/FilterPanel';
import { CardGrid } from '../components/draft-board/CardGrid';
import { PoolSidebar, type PoolSidebarTab } from '../components/draft-board/PoolSidebar';
import { StatusScreen } from '../components/common/StatusScreen';
import { useCardFilters } from '../hooks/useCardFilters';
import { gameApi } from '../api/gameApi';
import { buildCard } from '../components/draft-board/importDecklist';
import { BASIC_LAND_FRAME } from '../lib/basicLands';
import { getErrorMessage } from '../lib/errors';
import type { Card } from '../types';

/**
 * Deck builder screen. Reuses almost all of the draft board's UI
 * pieces (FilterPanel, CardGrid, PoolSidebar) but with a different
 * interaction model and no live draft session at all:
 *
 *  - The main grid IS the decklist (not a pack to pick from) — clicking
 *    a card in the grid moves it to the sideboard, no staging/confirm step.
 *  - PoolSidebar's List/Sideboard/Analytics tabs are different views —
 *    List shows the decklist, Sideboard shows cards moved out of it;
 *    clicking a Sideboard row moves the card back to the decklist.
 *  - PoolSidebar's Confirm Pick footer is omitted entirely.
 *
 * Two entry modes:
 *  - /deckbuilder/:gameID/:playerName  — seeds the pool from the player's
 *    drafted cards fetched from the backend.
 *  - /deckbuilder                      — starts empty; user imports via the
 *    Import tab.
 */
export function DeckBuilderPage() {
  const { gameID, playerName } = useParams<{ gameID?: string; playerName?: string }>();

  const [decklist, setDecklist] = useState<Card[]>([]);
  const [sideboard, setSideboard] = useState<Card[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Default to 'import' for the blank mode, 'list' when arriving from a draft
  const [poolTab, setPoolTab] = useState<PoolSidebarTab>(gameID ? 'list' : 'import');

  useEffect(() => {
    if (!gameID || !playerName) return;

    setLoading(true);
    gameApi
      .fetchGameData(gameID)
      .then((info) => {
        const player = info.players.find((p) => p.playerName === decodeURIComponent(playerName));
        if (player) {
          setDecklist(player.cardsDrafted);
        } else {
          setError(`Player "${playerName}" not found in game.`);
        }
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [gameID, playerName]);

  const { filteredCards: visibleCards, filterPanelProps } = useCardFilters(decklist);

  function moveToSideboard(card: Card) {
    setDecklist((prev) => prev.filter((c) => c.cardID !== card.cardID));
    setSideboard((prev) => [...prev, card]);
  }

  function moveToList(card: Card) {
    setSideboard((prev) => prev.filter((c) => c.cardID !== card.cardID));
    setDecklist((prev) => [...prev, card]);
  }

  function addImportedCards(cards: Card[]) {
    setDecklist((prev) => [...prev, ...cards]);
    setPoolTab('list');
  }

  function addLand(name: string) {
    setDecklist((prev) => [...prev, buildCard(name, 'Basic Land', BASIC_LAND_FRAME[name] ?? 'C')]);
  }

  async function exportPool() {
    const text = formatExportText(decklist, sideboard);
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy decklist to clipboard:', err);
    }
  }

  if (loading) {
    return <StatusScreen>Loading drafted cards…</StatusScreen>;
  }

  if (error) {
    return <StatusScreen tone="error">Something went wrong: {error}</StatusScreen>;
  }

  return (
    <div className="font-body-md text-on-surface bg-surface-dim min-h-screen selection:bg-primary-container selection:text-on-primary-container">
      <Header />

      <PoolSidebar
        cards={decklist}
        total={decklist.length}
        tab={poolTab}
        onTabChange={setPoolTab}
        onImportCards={addImportedCards}
        topOffsetPx={64}
        sideboardCards={sideboard}
        onMoveToSideboard={moveToSideboard}
        onMoveToList={moveToList}
        onAddLand={addLand}
        onExport={exportPool}
      />

      <main className="mt-20 mb-16 xl:mr-80 px-margin-mobile md:px-margin-desktop py-lg">
        <FilterPanel {...filterPanelProps} />

        <CardGrid cards={visibleCards} stagedCardID={null} onStage={moveToSideboard} disabled={false} minSlots={0} />

        {decklist.length === 0 && (
          <p className="text-center text-on-surface-variant text-body-md py-xl">
            Your decklist is empty. Use the Import tab in "My Pool" to add cards, or check your Sideboard.
          </p>
        )}

        {decklist.length > 0 && visibleCards.length === 0 && (
          <p className="text-center text-on-surface-variant text-body-md py-xl">
            No cards match these filters.
          </p>
        )}
      </main>
    </div>
  );
}

/** Groups a card list by name and formats it as "QTY Name" lines, one
 * per line, sorted alphabetically — the standard MTG decklist text
 * format. */
function formatGroupAsLines(cards: Card[]): string[] {
  const counts = new Map<string, number>();
  for (const card of cards) {
    counts.set(card.name, (counts.get(card.name) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, count]) => `${count} ${name}`);
}

/** Builds the full export text: MAINBOARD section, blank line,
 * SIDEBOARD section. Sideboard section is omitted if empty. */
function formatExportText(decklist: Card[], sideboard: Card[]): string {
  const sections = [`MAINBOARD\n${formatGroupAsLines(decklist).join('\n')}`];
  if (sideboard.length > 0) {
    sections.push(`SIDEBOARD\n${formatGroupAsLines(sideboard).join('\n')}`);
  }
  return sections.join('\n\n');
}
