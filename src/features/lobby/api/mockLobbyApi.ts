import type { LobbyInfo, LobbyPlayer, JoinLobbyResponse } from '../model/lobbyTypes';
import type { GameCreationInfo } from '../../draft/model/gameTypes';
import { mockGameApi } from '../../draft/api/mockGameApi';

const MOCK_DELAY_MS = 300;

const LOBBY_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

interface StoredLobby {
  info: LobbyInfo;
  createdAt: number;
}

const store = new Map<string, StoredLobby>();

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_DELAY_MS));
}

function nowISO(): string {
  return new Date().toISOString();
}

function generateCode(): string {
  let code: string;
  do {
    code = '';
    for (let i = 0; i < 5; i++) {
      code += LOBBY_CODE_CHARS[Math.floor(Math.random() * LOBBY_CODE_CHARS.length)];
    }
  } while (store.has(code));
  return code;
}

function cloneInfo(info: LobbyInfo): LobbyInfo {
  return JSON.parse(JSON.stringify(info));
}

export const mockLobbyApi = {
  async createLobby(req: {
    draftType: string;
    config: Record<string, unknown>;
    hostAccountID: string;
    hostDisplayName: string;
    minPlayers?: number;
    maxPlayers?: number;
  }): Promise<JoinLobbyResponse> {
    const lobbyCode = generateCode();
    const now = nowISO();
    const playerToken = crypto.randomUUID();

    const hostPlayer: LobbyPlayer = {
      accountID: req.hostAccountID,
      displayName: req.hostDisplayName,
      slotIndex: 0,
      playerToken,
      lastPollAt: now,
    };

    const minPlayers = req.minPlayers ?? (req.draftType === 'pyramid' ? 2 : 4);
    const maxPlayers = req.maxPlayers ?? (req.draftType === 'pyramid' ? 2 : 12);

    const info: LobbyInfo = {
      lobbyCode,
      draftType: req.draftType as LobbyInfo['draftType'],
      config: req.config,
      hostAccountID: req.hostAccountID,
      players: [hostPlayer],
      minPlayers,
      maxPlayers,
      gameID: null,
      status: 'waiting',
      createdAt: now,
      hostAloneSince: null,
    };

    store.set(lobbyCode, { info, createdAt: Date.now() });

    return delay({ lobby: cloneInfo(info), playerToken });
  },

  async joinLobby(
    lobbyCode: string,
    accountID: string | null,
    displayName: string
  ): Promise<{ lobby: LobbyInfo; playerToken: string }> {
    const stored = store.get(lobbyCode);
    if (!stored) throw new Error('Lobby not found');
    if (stored.info.status !== 'waiting') throw new Error('Lobby already started');

    if (accountID) {
      const existing = stored.info.players.find((p) => p.accountID === accountID);
      if (existing) throw new Error('Already in lobby');
    }

    const normalizedName = displayName.trim().toLowerCase();
    const nameTaken = stored.info.players.some(
      (p) => p.displayName.trim().toLowerCase() === normalizedName
    );
    if (nameTaken) throw new Error('That name is already taken in this lobby');

    if (stored.info.players.length >= stored.info.maxPlayers) {
      throw new Error('Lobby is full');
    }

    const taken = new Set(stored.info.players.map((p) => p.slotIndex));
    let slotIndex = 0;
    while (taken.has(slotIndex)) slotIndex++;

    const playerToken = crypto.randomUUID();
    const now = nowISO();

    const player: LobbyPlayer = {
      accountID,
      displayName,
      slotIndex,
      playerToken,
      lastPollAt: now,
    };

    stored.info.players.push(player);

    // Clear hostAloneSince since there's more than the host now
    stored.info.hostAloneSince = null;

    return delay({ lobby: cloneInfo(stored.info), playerToken });
  },

  async leaveLobby(lobbyCode: string, playerToken: string): Promise<LobbyInfo> {
    const stored = store.get(lobbyCode);
    if (!stored) throw new Error('Lobby not found');
    if (stored.info.status !== 'waiting') throw new Error('Lobby already started');

    const playerIndex = stored.info.players.findIndex((p) => p.playerToken === playerToken);

    if (playerIndex === -1) throw new Error('Player not found');

    const removed = stored.info.players[playerIndex];
    stored.info.players.splice(playerIndex, 1);

    if (stored.info.players.length === 0) {
      store.delete(lobbyCode);
      // Return the last known state — caller should handle this as "lobby gone"
      return delay(cloneInfo(stored.info));
    }

    // Reassign host if needed
    if (removed.accountID === stored.info.hostAccountID) {
      stored.info.hostAccountID = stored.info.players[0].accountID ?? '';
      stored.info.hostAloneSince = null;
    }

    // Set hostAloneSince if only host remains
    if (stored.info.players.length === 1) {
      stored.info.hostAloneSince = nowISO();
    }

    return delay(cloneInfo(stored.info));
  },

  async kickPlayer(
    lobbyCode: string,
    playerToken: string,
    targetSlotIndex: number
  ): Promise<LobbyInfo> {
    const stored = store.get(lobbyCode);
    if (!stored) throw new Error('Lobby not found');
    if (stored.info.status !== 'waiting') throw new Error('Lobby already started');

    const caller = stored.info.players.find((p) => p.playerToken === playerToken);
    if (!caller || caller.accountID !== stored.info.hostAccountID) {
      throw new Error('Only the host can kick players');
    }

    const playerIndex = stored.info.players.findIndex((p) => p.slotIndex === targetSlotIndex);
    if (playerIndex === -1) throw new Error('Player not found');

    const target = stored.info.players[playerIndex];
    if (target.accountID === stored.info.hostAccountID) {
      throw new Error('Cannot kick the host');
    }

    stored.info.players.splice(playerIndex, 1);

    // Set hostAloneSince if only the host remains
    if (stored.info.players.length === 1) {
      stored.info.hostAloneSince = nowISO();
    }

    return delay(cloneInfo(stored.info));
  },

  async pollLobby(lobbyCode: string, playerToken?: string): Promise<LobbyInfo> {
    const stored = store.get(lobbyCode);
    if (!stored) throw new Error('Lobby not found');

    if (playerToken) {
      const player = stored.info.players.find((p) => p.playerToken === playerToken);
      if (player) {
        player.lastPollAt = nowISO();
      }
    }

    return delay(cloneInfo(stored.info));
  },

  async startLobby(
    lobbyCode: string,
    playerToken: string
  ): Promise<LobbyInfo> {
    const stored = store.get(lobbyCode);
    if (!stored) throw new Error('Lobby not found');
    if (stored.info.status !== 'waiting') throw new Error('Lobby already starting or started');

    const caller = stored.info.players.find((p) => p.playerToken === playerToken);
    if (!caller || caller.accountID !== stored.info.hostAccountID) throw new Error('Only the host can start');
    if (stored.info.players.length < stored.info.minPlayers) throw new Error('Not enough players');

    stored.info.status = 'starting';

    const config = stored.info.config as Record<string, unknown>;

    const gamePayload: GameCreationInfo = {
      gameID: crypto.randomUUID(),
      cubeID: (config.cubeID as string) ?? 'mock-cube',
      numberOfDoubleDraftPicksPerPlayer:
        stored.info.draftType === 'pyramid'
          ? ((config.numberOfDoubleDraftPicksPerPlayer as number) ?? 3)
          : 0,
      packsPerPlayer:
        stored.info.draftType === 'classic'
          ? ((config.packsPerPlayer as number) ?? 3)
          : undefined,
      cardsPerPack:
        stored.info.draftType === 'classic'
          ? ((config.cardsPerPack as number) ?? 15)
          : undefined,
      players: stored.info.players.map((p) => ({
        accountID: p.accountID ?? crypto.randomUUID(),
        name: p.displayName,
        playerToken: p.playerToken,
      })),
    };

    try {
      const created = await mockGameApi.createAndStartGame(gamePayload);
      stored.info.gameID = created.gameID;
      stored.info.status = 'started';
    } catch {
      stored.info.status = 'waiting';
      throw new Error('Game creation failed: mock backend error');
    }

    return delay(cloneInfo(stored.info));
  },
};
