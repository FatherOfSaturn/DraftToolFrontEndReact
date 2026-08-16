import { describe, expect, it } from 'vitest';
import {
  ALREADY_IN_LOBBY_MESSAGE,
  findMyPlayer,
  hasDuplicateAccount,
  isAccountInLobby,
  isAlreadyInLobbyError,
} from './lobbyJoinGuard';
import type { LobbyInfo } from '../model/lobbyTypes';

function makeLobby(players: Array<{ accountID: string | null; displayName: string }>): LobbyInfo {
  return {
    lobbyCode: 'ABCDE',
    draftType: 'pyramid',
    config: {},
    hostAccountID: players[0]?.accountID ?? '',
    players: players.map((p, i) => ({
      accountID: p.accountID,
      displayName: p.displayName,
      slotIndex: i,
      playerToken: `token-${i}`,
      lastPollAt: new Date().toISOString(),
    })),
    minPlayers: 2,
    maxPlayers: 2,
    gameID: null,
    status: 'waiting',
    createdAt: new Date().toISOString(),
    hostAloneSince: null,
  };
}

describe('isAlreadyInLobbyError', () => {
  it('matches the conflict message', () => {
    expect(isAlreadyInLobbyError('POST /lobby/X/join failed: 409 Already in lobby')).toBe(true);
  });

  it('matches case-insensitively', () => {
    expect(isAlreadyInLobbyError('ALREADY IN LOBBY')).toBe(true);
  });

  it('rejects unrelated errors', () => {
    expect(isAlreadyInLobbyError('Lobby is full')).toBe(false);
  });
});

describe('isAccountInLobby', () => {
  it('finds a seated account', () => {
    const lobby = makeLobby([
      { accountID: 'acc-1', displayName: 'Host' },
      { accountID: 'acc-2', displayName: 'Guest' },
    ]);
    expect(isAccountInLobby(lobby, 'acc-2')).toBe(true);
  });

  it('misses an unseated account', () => {
    const lobby = makeLobby([{ accountID: 'acc-1', displayName: 'Host' }]);
    expect(isAccountInLobby(lobby, 'acc-9')).toBe(false);
  });

  it('never matches a null accountID', () => {
    const lobby = makeLobby([{ accountID: null, displayName: 'Anon' }]);
    expect(isAccountInLobby(lobby, null)).toBe(false);
  });
});

describe('findMyPlayer', () => {
  it('matches a logged-in user by accountID even when tokens are absent', () => {
    const lobby = makeLobby([
      { accountID: 'acc-1', displayName: 'Host' },
      { accountID: null, displayName: 'Anon' },
    ]);
    const me = findMyPlayer(lobby, {
      accountID: 'acc-1',
      playerToken: 'any-token',
      slotIndex: null,
      displayName: 'Anything',
    });
    expect(me?.slotIndex).toBe(0);
    expect(me?.displayName).toBe('Host');
  });

  it('matches an anonymous user by slotIndex once seated (no token serialized)', () => {
    const lobby = makeLobby([
      { accountID: 'acc-1', displayName: 'Host' },
      { accountID: null, displayName: 'Anon' },
    ]);
    const me = findMyPlayer(lobby, {
      accountID: null,
      playerToken: 'my-token', // not serialized by the real backend
      slotIndex: 1,
      displayName: 'Anon',
    });
    expect(me?.displayName).toBe('Anon');
  });

  it('matches an anonymous host by slotIndex 0', () => {
    const lobby = makeLobby([{ accountID: null, displayName: 'Host' }]);
    const me = findMyPlayer(lobby, {
      accountID: null,
      playerToken: 'host-token',
      slotIndex: 0,
      displayName: 'Host',
    });
    expect(me).toBeTruthy();
  });

  it('matches an anonymous user by displayName as a fallback', () => {
    const lobby = makeLobby([
      { accountID: null, displayName: 'Ace' },
      { accountID: null, displayName: 'Bob' },
    ]);
    const me = findMyPlayer(lobby, {
      accountID: null,
      playerToken: null,
      slotIndex: null,
      displayName: 'Bob',
    });
    expect(me?.slotIndex).toBe(1);
  });

  it('returns undefined when the caller is not seated', () => {
    const lobby = makeLobby([{ accountID: 'acc-1', displayName: 'Host' }]);
    const me = findMyPlayer(lobby, {
      accountID: null,
      playerToken: 'ghost-token',
      slotIndex: 5,
      displayName: 'Ghost',
    });
    expect(me).toBeUndefined();
  });
});

describe('hasDuplicateAccount', () => {
  it('detects two seats for one account (backend failed to dedup)', () => {
    const lobby = makeLobby([
      { accountID: 'acc-1', displayName: 'Old Name' },
      { accountID: 'acc-1', displayName: 'New Name' },
    ]);
    expect(hasDuplicateAccount(lobby, 'acc-1')).toBe(true);
  });

  it('allows a single seat', () => {
    const lobby = makeLobby([{ accountID: 'acc-1', displayName: 'Host' }]);
    expect(hasDuplicateAccount(lobby, 'acc-1')).toBe(false);
  });

  it('is a no-op for anonymous joins', () => {
    const lobby = makeLobby([
      { accountID: null, displayName: 'A' },
      { accountID: null, displayName: 'B' },
    ]);
    expect(hasDuplicateAccount(lobby, null)).toBe(false);
  });
});

describe('ALREADY_IN_LOBBY_MESSAGE', () => {
  it('mentions being logged in and already in the lobby', () => {
    expect(ALREADY_IN_LOBBY_MESSAGE).toContain('logged in');
    expect(ALREADY_IN_LOBBY_MESSAGE).toContain('already in this lobby');
  });
});
