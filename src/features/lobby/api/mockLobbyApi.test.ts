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
    const lobby = await mockLobbyApi.createLobby(pyramidLobbyRequest('acc-host', 'Host'));
    await expect(
      mockLobbyApi.joinLobby(lobby.lobbyCode, 'acc-host', 'Host 2')
    ).rejects.toThrow('Already in lobby');
  });

  it('rejects a duplicate name (case-insensitive, trimmed)', async () => {
    const lobby = await mockLobbyApi.createLobby(pyramidLobbyRequest('acc-host', 'Alice'));
    await expect(
      mockLobbyApi.joinLobby(lobby.lobbyCode, 'acc-guest', 'alice ')
    ).rejects.toThrow('That name is already taken in this lobby');
  });

  it('allows a fresh name to join', async () => {
    const lobby = await mockLobbyApi.createLobby(pyramidLobbyRequest('acc-host', 'Alice'));
    const result = await mockLobbyApi.joinLobby(lobby.lobbyCode, 'acc-guest', 'Bob');
    expect(result.lobby.players.map((p) => p.displayName)).toEqual(['Alice', 'Bob']);
  });

  it('rejects a join when the lobby is full', async () => {
    const lobby = await mockLobbyApi.createLobby(pyramidLobbyRequest('acc-host', 'Host'));
    await mockLobbyApi.joinLobby(lobby.lobbyCode, 'acc-bob', 'Bob');
    await expect(
      mockLobbyApi.joinLobby(lobby.lobbyCode, 'acc-carol', 'Carol')
    ).rejects.toThrow('Lobby is full');
  });

  it('is pollable without a token (used by the rejoin pre-check)', async () => {
    const lobby = await mockLobbyApi.createLobby(pyramidLobbyRequest('acc-host', 'Host'));
    await mockLobbyApi.joinLobby(lobby.lobbyCode, 'acc-guest', 'Guest');
    const polled = await mockLobbyApi.pollLobby(lobby.lobbyCode);
    expect(polled.players).toHaveLength(2);
  });
});

describe('mockLobbyApi.kickPlayer', () => {
  it('removes the targeted player and marks the host alone', async () => {
    const lobby = await mockLobbyApi.createLobby(pyramidLobbyRequest('acc-host', 'Host'));
    const join = await mockLobbyApi.joinLobby(lobby.lobbyCode, 'acc-guest', 'Guest');
    const hostToken = lobby.players[0].playerToken;

    const result = await mockLobbyApi.kickPlayer(lobby.lobbyCode, 'acc-host', join.playerToken);

    expect(result.players.map((p) => p.playerToken)).toEqual([hostToken]);
    expect(result.hostAloneSince).not.toBeNull();
  });

  it('refuses to kick when the caller is not the host', async () => {
    const lobby = await mockLobbyApi.createLobby(pyramidLobbyRequest('acc-host', 'Host'));
    const join = await mockLobbyApi.joinLobby(lobby.lobbyCode, 'acc-guest', 'Guest');
    await expect(
      mockLobbyApi.kickPlayer(lobby.lobbyCode, 'acc-guest', join.playerToken)
    ).rejects.toThrow('Only the host can kick players');
  });

  it('refuses to kick the host', async () => {
    const lobby = await mockLobbyApi.createLobby(pyramidLobbyRequest('acc-host', 'Host'));
    const hostToken = lobby.players[0].playerToken;
    await expect(
      mockLobbyApi.kickPlayer(lobby.lobbyCode, 'acc-host', hostToken)
    ).rejects.toThrow('Cannot kick the host');
  });

  it('rejects an unknown player token', async () => {
    const lobby = await mockLobbyApi.createLobby(pyramidLobbyRequest('acc-host', 'Host'));
    await expect(
      mockLobbyApi.kickPlayer(lobby.lobbyCode, 'acc-host', 'no-such-token')
    ).rejects.toThrow('Player not found');
  });
});
