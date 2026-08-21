import type { Card, CardDetail } from '../../../shared/model/cardTypes';
import type { CardPack, GameCreationInfo, GameInfo, GameStatusMessage, Player } from '../model/gameTypes';
import { getLobbyPlayerToken } from '../../../shared/api/sessionToken';
import { placeholderArt, type ArtFrameKey } from '../../../shared/lib/placeholderArt';

/**
 * A self-contained, in-memory stand-in for the real Java backend. Used
 * when VITE_USE_MOCK_API=true so the whole frontend (Home, Setup, Draft
 * board) can be exercised with zero backend running.
 *
 * This is intentionally simple: a handful of generated packs per player,
 * basic pick/double-pick bookkeeping, and a fake latency on every call so
 * loading states are visible. It does not try to replicate real draft
 * balance or card pool logic — it's a development aid, not a game engine.
 *
 * Card art comes from lib/placeholderArt.ts (shared with the deck
 * builder's decklist-import feature) rather than a local copy, so there's
 * one placeholder-art implementation for the whole app.
 */

const MOCK_DELAY_MS = 350;

interface CardTemplate {
  name: string;
  set: string;
  cmc: number;
  type_line: string;
  cost: string[];
  frame: ArtFrameKey;
}

// A modest pool of named cards so packs don't look identical every time.
const CARD_POOL: CardTemplate[] = [
  { name: 'Sol Ring', set: 'M21', cmc: 1, type_line: 'Artifact', cost: ['1'], frame: 'C' },
  { name: 'Lightning Bolt', set: 'STA', cmc: 1, type_line: 'Instant', cost: ['R'], frame: 'R' },
  { name: 'Rhystic Study', set: 'PCY', cmc: 3, type_line: 'Enchantment', cost: ['2', 'U'], frame: 'U' },
  { name: 'Swords to Plowshares', set: 'STA', cmc: 1, type_line: 'Instant', cost: ['W'], frame: 'W' },
  { name: 'Cultivate', set: 'STA', cmc: 3, type_line: 'Sorcery', cost: ['2', 'G'], frame: 'G' },
  { name: 'Counterspell', set: 'STA', cmc: 2, type_line: 'Instant', cost: ['U', 'U'], frame: 'U' },
  { name: 'Demonic Tutor', set: 'STA', cmc: 2, type_line: 'Sorcery', cost: ['1', 'B'], frame: 'B' },
  { name: 'Wrath of God', set: 'STA', cmc: 4, type_line: 'Sorcery', cost: ['2', 'W', 'W'], frame: 'W' },
  { name: 'Blood Crypt', set: 'RNA', cmc: 0, type_line: 'Land — Swamp Mountain', cost: [], frame: 'C' },
  { name: 'Avenger of Zendikar', set: 'M11', cmc: 7, type_line: 'Creature — Elemental', cost: ['5', 'G', 'G'], frame: 'G' },
  { name: "Teferi's Protection", set: 'CMR', cmc: 3, type_line: 'Instant', cost: ['2', 'W'], frame: 'W' },
  { name: 'Smothering Tithe', set: 'RNA', cmc: 4, type_line: 'Enchantment', cost: ['3', 'W'], frame: 'W' },
  { name: 'Toxic Deluge', set: 'CMA', cmc: 3, type_line: 'Sorcery', cost: ['2', 'B'], frame: 'B' },
  { name: 'Mana Drain', set: 'CMR', cmc: 2, type_line: 'Instant', cost: ['U', 'U'], frame: 'U' },
  { name: 'Birds of Paradise', set: 'M21', cmc: 1, type_line: 'Creature — Bird', cost: ['G'], frame: 'G' },
  { name: 'Vampiric Tutor', set: 'CMR', cmc: 1, type_line: 'Instant', cost: ['B'], frame: 'B' },
  { name: 'Skullclamp', set: 'DMR', cmc: 1, type_line: 'Artifact — Equipment', cost: ['1'], frame: 'C' },
  { name: 'Path to Exile', set: 'CMR', cmc: 1, type_line: 'Instant', cost: ['W'], frame: 'W' },
  { name: 'Fireblast', set: 'STA', cmc: 4, type_line: 'Instant', cost: ['4', 'R'], frame: 'R' },
  { name: 'Brainstorm', set: 'STA', cmc: 1, type_line: 'Instant', cost: ['U'], frame: 'U' },
];

let cardCounter = 0;

function mkCard(template: CardTemplate): Card {
  cardCounter += 1;
  const cardID = `mock-${template.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${cardCounter}`;
  const image = placeholderArt(template.name, template.frame);
  const details: CardDetail = {
    set: template.set,
    set_name: template.set,
    scryfall_id: cardID,
    image_small: image,
    image_normal: image,
    image_flip: null,
    name: template.name,
    parsed_cost: template.cost,
  };
  return {
    cardID,
    name: template.name,
    cmc: template.cmc,
    type_line: template.type_line,
    reveal: true,
    details,
  };
}

function randomPack(size = 10): Card[] {
  const shuffled = [...CARD_POOL].sort(() => Math.random() - 0.5);
  const picks: CardTemplate[] = [];
  while (picks.length < size) {
    picks.push(shuffled[picks.length % shuffled.length]);
  }
  return picks.map(mkCard);
}

/** Shared mock pack generator — used by both the pyramid and classic mock backends. */
export function createRandomPack(size = 10): Card[] {
  return randomPack(size);
}

function buildPlayer(name: string, accountID: string, packCount: number, packSize: number, doublePicks: number): Player {
  const cardPacks: CardPack[] = Array.from({ length: packCount }, (_, i) => ({
    packNumber: i,
    cardsInPack: randomPack(packSize),
    originalCardsInPack: packSize,
    doubleDraftedFlag: false,
  }));

  return {
    playerName: name,
    accountID,
    cardPacks,
    cardsDrafted: [],
    doubleDraftPicksRemaining: doublePicks,
    currentDraftPack: 0,
    readyForMerge: false,
  };
}

// In-memory "database" of mock games, keyed by gameID.
const mockGames = new Map<string, GameInfo>();

// Mirrors the real backend: player identity on draft calls comes from the
// caller's X-Player-Token, not the URL. Maps gameID -> playerToken -> accountID.
const mockGamePlayerTokens = new Map<string, Map<string, string>>();

function registerPlayerTokens(gameID: string, entries: GameCreationInfo['players']): void {
  const map = new Map<string, string>();
  for (const entry of entries) {
    if (entry.playerToken) map.set(entry.playerToken, entry.accountID);
  }
  mockGamePlayerTokens.set(gameID, map);
}

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_DELAY_MS));
}

function generateGameID(): string {
  const part = () => Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${part()}-${part()}`;
}

export const mockGameApi = {
  async createAndStartGame(creationInfo: GameCreationInfo): Promise<GameInfo> {
    const gameID = generateGameID();
    const packCount = creationInfo.packsPerPlayer ?? 15;
    const packSize = creationInfo.cardsPerPack ?? 10;
    const players = creationInfo.players.map((p) =>
      buildPlayer(p.name || 'Player', p.accountID, packCount, packSize, creationInfo.numberOfDoubleDraftPicksPerPlayer)
    );

    const gameInfo: GameInfo = {
      gameID,
      gameState: 'GAME_IN_PROGRESS',
      players,
    };

    mockGames.set(gameID, gameInfo);
    registerPlayerTokens(gameID, creationInfo.players);
    return delay(structuredClone(gameInfo));
  },

  async fetchGameData(gameID: string): Promise<GameInfo> {
    let game = mockGames.get(gameID);
    if (!game) {
      // Allow visiting any gameID in mock mode (e.g. from a bookmarked
      // /draft/:gameID/:playerName URL) by lazily creating a demo game
      // with that ID rather than 404ing.
      game = {
        gameID,
        gameState: 'GAME_IN_PROGRESS',
        players: [
          buildPlayer('You', 'mock-player-you', 15, 10, 3),
          buildPlayer('Opponent', 'mock-player-opponent', 15, 10, 3),
        ],
      };
      mockGames.set(gameID, game);
      const token = getLobbyPlayerToken();
      if (token) {
        registerPlayerTokens(gameID, [{ accountID: 'mock-player-you', name: 'You', playerToken: token }]);
      }
    }
    // Return a deep copy, never the live object stored in mockGames.
    // draftCard() below mutates that live object directly — if callers
    // got the same reference back, the caller's "immutable" state
    // updates (e.g. useDraftGame's setGameInfo) would be appending onto
    // an object that's already been mutated by a previous draftCard
    // call, double-counting every pick.
    return delay(structuredClone(game));
  },

  async draftCard(
    gameID: string,
    packNumber: number,
    cardID: string,
    doublePick: boolean
  ): Promise<Card> {
    const game = mockGames.get(gameID);
    if (!game) throw new Error(`Mock game ${gameID} not found`);

    const token = getLobbyPlayerToken();
    const accountID = token ? mockGamePlayerTokens.get(gameID)?.get(token) : undefined;
    if (!accountID) throw new Error('Mock player token not recognized');

    const player = game.players.find((p) => p.accountID === accountID);
    if (!player) throw new Error(`Mock player ${accountID} not found`);

    const pack = player.cardPacks.find((p) => p.packNumber === packNumber);
    if (!pack) throw new Error(`Mock pack ${packNumber} not found`);

    const card = pack.cardsInPack.find((c) => c.cardID === cardID);
    if (!card) throw new Error(`Mock card ${cardID} not found in pack`);

    pack.cardsInPack = pack.cardsInPack.filter((c) => c.cardID !== cardID);
    player.cardsDrafted = [...player.cardsDrafted, card];

    if (doublePick) {
      pack.doubleDraftedFlag = true;
      player.doubleDraftPicksRemaining = Math.max(0, player.doubleDraftPicksRemaining - 1);
    } else {
      player.currentDraftPack += 1;
    }

    return delay(card);
  },

  async triggerPackMergeAndSwap(gameID: string): Promise<GameStatusMessage | null> {
    const game = mockGames.get(gameID);
    if (!game) return delay(null);
    return delay({ gameID, gameState: game.gameState });
  },

  async endGame(gameID: string): Promise<GameStatusMessage | null> {
    const game = mockGames.get(gameID);
    if (!game) return delay(null);
    game.gameState = 'GAME_COMPLETE';
    return delay({ gameID, gameState: game.gameState });
  },

  async deleteGame(gameID: string): Promise<void> {
    mockGames.delete(gameID);
    return delay(undefined);
  },
};
