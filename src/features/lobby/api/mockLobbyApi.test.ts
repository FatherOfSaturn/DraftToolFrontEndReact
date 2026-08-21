import { describe, expect, it } from 'vitest';
import { mockLobbyApi } from './mockLobbyApi';

function pyramidLobbyRequest(hostAccountID: string, hostDisplayName: string) {
  return {
    draftType: 'pyramid' as const,
    config: { cubeID: 'mock-cube' },
    hostAccountID,
    hostDisplayName,
  };
}

describe('mockLobbyApi.joinLobby', () => {
  it('rejects a second join from the same account', async () => {
    const created = await mockLobbyApi.createLobby(pyramidLobbyRequest('acc-host', 'Host'));
    await expect(
      mockLobbyApi.joinLobby(created.lobby.lobbyCode, 'acc-host', 'Host 2')
    ).rejects.toThrow('Already in lobby');
  });

  it('rejects a duplicate name (case-insensitive, trimmed)', async () => {
    const created = await mockLobbyApi.createLobby(pyramidLobbyRequest('acc-host', 'Alice'));
    await expect(
      mockLobbyApi.joinLobby(created.lobby.lobbyCode, 'acc-guest', 'alice ')
    ).rejects.toThrow('That name is already taken in this lobby');
  });

  it('allows a fresh name to join', async () => {
    const created = await mockLobbyApi.createLobby(pyramidLobbyRequest('acc-host', 'Alice'));
    const result = await mockLobbyApi.joinLobby(created.lobby.lobbyCode, 'acc-guest', 'Bob');
    expect(result.lobby.players.map((p) => p.displayName)).toEqual(['Alice', 'Bob']);
  });

  it('rejects a join when the lobby is full', async () => {
    const created = await mockLobbyApi.createLobby(pyramidLobbyRequest('acc-host', 'Host'));
    await mockLobbyApi.joinLobby(created.lobby.lobbyCode, 'acc-bob', 'Bob');
    await expect(
      mockLobbyApi.joinLobby(created.lobby.lobbyCode, 'acc-carol', 'Carol')
    ).rejects.toThrow('Lobby is full');
  });

  it('is pollable without a token (used by the rejoin pre-check)', async () => {
    const created = await mockLobbyApi.createLobby(pyramidLobbyRequest('acc-host', 'Host'));
    await mockLobbyApi.joinLobby(created.lobby.lobbyCode, 'acc-guest', 'Guest');
    const polled = await mockLobbyApi.pollLobby(created.lobby.lobbyCode);
    expect(polled.players).toHaveLength(2);
  });

  it('returns the caller\'s own playerToken from createLobby', async () => {
    const created = await mockLobbyApi.createLobby(pyramidLobbyRequest('acc-host', 'Host'));
    expect(created.playerToken).toBeTruthy();
    expect(created.lobby.players[0].playerToken).toBe(created.playerToken);
  });
});

describe('mockLobbyApi.kickPlayer', () => {
  it('removes the targeted player by slot index and marks the host alone', async () => {
    const created = await mockLobbyApi.createLobby(pyramidLobbyRequest('acc-host', 'Host'));
    const join = await mockLobbyApi.joinLobby(created.lobby.lobbyCode, 'acc-guest', 'Guest');
    const hostToken = created.playerToken;
    const guestSlotIndex = join.lobby.players.find((p) => p.slotIndex !== 0)!.slotIndex;

    const result = await mockLobbyApi.kickPlayer(created.lobby.lobbyCode, hostToken, guestSlotIndex);

    expect(result.players.map((p) => p.playerToken)).toEqual([hostToken]);
    expect(result.hostAloneSince).not.toBeNull();
  });

  it('refuses to kick when the caller is not the host', async () => {
    const created = await mockLobbyApi.createLobby(pyramidLobbyRequest('acc-host', 'Host'));
    const join = await mockLobbyApi.joinLobby(created.lobby.lobbyCode, 'acc-guest', 'Guest');
    await expect(
      mockLobbyApi.kickPlayer(created.lobby.lobbyCode, join.playerToken, 0)
    ).rejects.toThrow('Only the host can kick players');
  });

  it('refuses to kick the host', async () => {
    const created = await mockLobbyApi.createLobby(pyramidLobbyRequest('acc-host', 'Host'));
    await expect(
      mockLobbyApi.kickPlayer(created.lobby.lobbyCode, created.playerToken, 0)
    ).rejects.toThrow('Cannot kick the host');
  });

  it('rejects an unknown slot index', async () => {
    const created = await mockLobbyApi.createLobby(pyramidLobbyRequest('acc-host', 'Host'));
    await expect(
      mockLobbyApi.kickPlayer(created.lobby.lobbyCode, created.playerToken, 99)
    ).rejects.toThrow('Player not found');
  });
});
