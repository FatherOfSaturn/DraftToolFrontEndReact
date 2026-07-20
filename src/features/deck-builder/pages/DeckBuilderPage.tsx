import { useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { Header } from '../../../shared/components/layout/Header';
import { FilterPanel } from '../../card-workspace/components/FilterPanel';
import { CardGrid } from '../../card-workspace/components/CardGrid';
import { PoolSidebar, type PoolSidebarTab } from '../../card-workspace/components/PoolSidebar';
import { StatusScreen } from '../../../shared/components/StatusScreen';
import { useCardFilters } from '../../card-workspace/hooks/useCardFilters';
import { gameApi } from '../../draft/api/gameApi';
import { buildCard } from '../../card-workspace/utils/importDecklist';
import { BASIC_LANDS } from '../../../shared/lib/basicLands';
import { getErrorMessage } from '../../../shared/lib/errors';
import { useAuth } from '../../auth/AuthContext';
import { accountApi } from '../../account/api/accountApi';
import { scryfallApi } from '../../card-workspace/api/scryfallApi';
import { useToast } from '../../../shared/components/Toast';
import type { Card } from '../../../shared/model/cardTypes';

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
  const location = useLocation();
  const { account } = useAuth();
  const { showToast } = useToast();

  const deckCardIds = (location.state as { deckCardIds?: string[] } | null)?.deckCardIds;

  const [decklist, setDecklist] = useState<Card[]>([]);
  const [sideboard, setSideboard] = useState<Card[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Default to 'import' for the blank mode, 'list' when arriving from a draft
  const [poolTab, setPoolTab] = useState<PoolSidebarTab>(gameID ? 'list' : 'import');

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setDecklist([]);
    setSideboard([]);
    setPoolTab(gameID && playerName ? 'list' : deckCardIds ? 'list' : 'import');

    // If we received card IDs from navigation state (e.g. "View in Deckbuilder"),
    // fetch real card data from the backend Scryfall API.
    if (deckCardIds && deckCardIds.length > 0) {
      setLoading(true);
      Promise.allSettled(
        deckCardIds.map((id) => scryfallApi.getCardById(id))
      ).then((results) => {
        if (cancelled) return;
        const resolved: Card[] = [];
        let failed = 0;
        for (const r of results) {
          if (r.status === 'fulfilled') resolved.push(r.value);
          else failed++;
        }
        setDecklist(resolved);
        if (resolved.length === 0) {
          setError('None of the saved cards could be loaded.');
        } else if (failed > 0) {
          showToast(`${failed} card(s) could not be found and were skipped.`);
        }
      }).catch((err) => {
        if (!cancelled) setError(getErrorMessage(err));
      }).finally(() => {
        if (!cancelled) setLoading(false);
      });
      return () => { cancelled = true; };
    }

    if (!gameID || !playerName) {
      setLoading(false);
      return;
    }

    setLoading(true);
    gameApi
      .fetchGameData(gameID)
      .then((info) => {
        if (cancelled) return;
        const player = info.players.find((p) => p.playerName === playerName);
        if (player) {
          setDecklist(player.cardsDrafted);
        } else {
          setError(`Player "${playerName}" not found in game.`);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [gameID, playerName, deckCardIds]);

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
    const land = BASIC_LANDS.find((l) => l.name === name);
    const card = buildCard(name, 'Basic Land');
    if (land) {
      card.details.image_small = land.imageUrl;
      card.details.image_normal = land.imageUrl;
    }
    setDecklist((prev) => [...prev, card]);
  }

  async function exportPool() {
    const text = formatExportText(decklist, sideboard);
    try {
      await navigator.clipboard.writeText(text);
      showToast('Saved to clipboard');
    } catch (err) {
      console.error('Failed to copy decklist to clipboard:', err);
    }
  }

  async function saveDeck() {
    if (!account || !gameID) return;
    try {
      const cardIds = decklist.map((c) => c.cardID);
      await accountApi.createDeck(account.accountID, gameID, `Deck created from Draft: ${gameID}`, cardIds);
      showToast('Successfully Saved Deck');
    } catch (err) {
      setError(getErrorMessage(err));
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
        onSaveDeck={account ? saveDeck : undefined}
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
