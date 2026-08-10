import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Header } from '../../../shared/components/layout/Header';
import { Footer } from '../../../shared/components/layout/Footer';
import { FindGameSection } from '../components/FindGameSection';
import { LabeledTextField } from '../components/LabeledTextField';
import { LobbyView } from '../../lobby/components/LobbyView';
import { useLobbyPoller } from '../../lobby/hooks/useLobbyPoller';
import { useLobbyLeaveGuard } from '../../lobby/hooks/useLobbyLeaveGuard';
import { lobbyApi } from '../../lobby/api/lobbyApi';
import { getErrorMessage } from '../../../shared/lib/errors';
import { CUBE_ID_TOOLTIP } from '../../../shared/lib/cubeTooltip';
import { useToast } from '../../../shared/components/Toast';
import { useAuth } from '../../auth/AuthContext';

interface DraftSetupPageProps {
  onEnterDraft: (gameID: string, playerName: string) => void;
}

const MAX_EXTRA_PICKS = 8;

export function DraftSetupPage({ onEnterDraft }: DraftSetupPageProps) {
  const { account } = useAuth();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();

  // Setup form state
  const [cubeID, setCubeID] = useState(() => searchParams.get('cubeID') ?? '');
  const [yourName, setYourName] = useState(account?.email ?? '');
  const [extraPicks, setExtraPicks] = useState(2);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Lobby state
  const [lobbyCode, setLobbyCode] = useState<string | null>(() => searchParams.get('lobby') ?? null);
  const [playerToken, setPlayerToken] = useState<string | null>(null);
  const [mySlotIndex, setMySlotIndex] = useState<number | null>(null);
  const [myName, setMyName] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  // Name prompt for anonymous joiners
  const [namePrompt, setNamePrompt] = useState<string | null>(null);
  const [namePromptError, setNamePromptError] = useState<string | null>(null);

  // Polling
  const { lobby: polledLobby } = useLobbyPoller({
    lobbyCode: lobbyCode && playerToken ? lobbyCode : null,
    intervalMs: 3000,
    enabled: !!lobbyCode && !!playerToken,
  });

  const currentLobby = polledLobby ?? null;

  // Leave guard
  const { markLeft } = useLobbyLeaveGuard(
    lobbyCode,
    playerToken,
    currentLobby?.status ?? null
  );

  // Navigate when game starts
  useEffect(() => {
    if (currentLobby?.status === 'started' && currentLobby.gameID && myName) {
      const gid: string = currentLobby.gameID;
      onEnterDraft(gid, myName);
    }
  }, [currentLobby?.status, currentLobby?.gameID, myName, onEnterDraft]);

  // Auto-join when lobby param is present
  useEffect(() => {
    const code = lobbyCode;
    if (!code || playerToken) return;

    async function doJoin() {
      setJoinError(null);
      try {
        const accountID = account?.accountID ?? null;
        const displayName = account?.displayName || account?.email || '';

        // Rejoin/resume: if the account is already in this lobby, adopt the
        // existing entry instead of joining again. This stops the same person
        // from appearing twice (and spuriously filling a 2-player lobby) when
        // they open their own invite link.
        if (accountID) {
          try {
            const existing = await lobbyApi.pollLobby(code!);
            const myPlayer = existing.players.find((p) => p.accountID === accountID);
            if (myPlayer) {
              sessionStorage.setItem('lobby_player_token', myPlayer.playerToken);
              if (myPlayer.accountID === existing.hostAccountID) {
                sessionStorage.setItem('lobby_host_account_id', myPlayer.accountID);
              }
              setPlayerToken(myPlayer.playerToken);
              setMySlotIndex(myPlayer.slotIndex);
              setMyName(myPlayer.displayName);
              setIsHost(myPlayer.accountID === existing.hostAccountID);
              showToast('You are already in this lobby');
              return;
            }
          } catch {
            // Poll failed (e.g. tokenless poll unsupported) — fall through to
            // a normal join and let its own error surface.
          }
        }

        const result = await lobbyApi.joinLobby(code!, accountID, displayName);
        sessionStorage.setItem('lobby_player_token', result.playerToken);
        setPlayerToken(result.playerToken);
        const myPlayer = result.lobby.players.find(
          (p) => accountID ? p.accountID === accountID : p.slotIndex === result.lobby.players.length - 1
        );
        if (myPlayer) {
          setMySlotIndex(myPlayer.slotIndex);
          setMyName(myPlayer.displayName);
          setIsHost(myPlayer.accountID === result.lobby.hostAccountID);
        }
      } catch (err) {
        const message = getErrorMessage(err);
        setJoinError(message);
        showToast(message);
        setLobbyCode(null);
      }
    }

    if (account) {
      doJoin();
    } else {
      setNamePrompt(lobbyCode);
      setNamePromptError(null);
    }
  }, [lobbyCode, playerToken, account, showToast]);

  // Auto-exit when the host removes us
  useEffect(() => {
    if (!lobbyCode || !playerToken || !currentLobby) return;
    if (currentLobby.status !== 'waiting') return;
    const stillThere = currentLobby.players.some((p) => p.playerToken === playerToken);
    if (stillThere) return;

    markLeft();
    showToast('You were removed from the lobby');
    sessionStorage.removeItem('lobby_player_token');
    sessionStorage.removeItem('lobby_host_account_id');
    setLobbyCode(null);
    setPlayerToken(null);
    setMySlotIndex(null);
    setMyName('');
    setIsHost(false);
  }, [lobbyCode, playerToken, currentLobby, markLeft, showToast]);

  async function handleCreateLobby() {
    if (!cubeID.trim() || !yourName.trim()) {
      setCreateError('Cube ID and your name are required.');
      return;
    }

    setCreating(true);
    setCreateError(null);
    try {
      const config: Record<string, unknown> = {
        cubeID: cubeID.trim(),
        numberOfDoubleDraftPicksPerPlayer: extraPicks,
      };
      const hostAccountID = account?.accountID ?? crypto.randomUUID();
      sessionStorage.setItem('lobby_host_account_id', hostAccountID);

      const lobby = await lobbyApi.createLobby({
        draftType: 'pyramid',
        config,
        hostAccountID,
        hostDisplayName: yourName.trim(),
      });

      const hostToken = lobby.players[0].playerToken;
      sessionStorage.setItem('lobby_player_token', hostToken);
      setLobbyCode(lobby.lobbyCode);
      setPlayerToken(hostToken);
      setMySlotIndex(0);
      setMyName(yourName.trim());
      setIsHost(true);
    } catch (err) {
      setCreateError(getErrorMessage(err));
    } finally {
      setCreating(false);
    }
  }

  async function handleStartGame() {
    if (!lobbyCode) return;
    const hostAccountID =
      sessionStorage.getItem('lobby_host_account_id') ?? account?.accountID ?? '';
    setIsStarting(true);
    try {
      const result = await lobbyApi.startLobby(lobbyCode, hostAccountID);
      setIsStarting(false);
      if (result.status === 'started' && result.gameID && myName) {
        onEnterDraft(result.gameID, myName);
      }
    } catch (err) {
      setCreateError(getErrorMessage(err));
      setIsStarting(false);
    }
  }

  async function handleLeaveLobby() {
    if (!lobbyCode) return;
    markLeft();
    try {
      await lobbyApi.leaveLobby(lobbyCode, account?.accountID ?? null, playerToken);
    } catch {
      // lobby may already be gone
    }
    sessionStorage.removeItem('lobby_player_token');
    sessionStorage.removeItem('lobby_host_account_id');
    setLobbyCode(null);
    setPlayerToken(null);
    setMySlotIndex(null);
    setMyName('');
    setIsHost(false);
  }

  async function handleKickPlayer(targetPlayerToken: string) {
    if (!lobbyCode) return;
    const hostAccountID =
      sessionStorage.getItem('lobby_host_account_id') ?? account?.accountID ?? '';
    try {
      await lobbyApi.kickPlayer(lobbyCode, hostAccountID, targetPlayerToken);
      showToast('Player removed from lobby');
    } catch (err) {
      showToast(getErrorMessage(err));
    }
  }

  async function handleNamePromptSubmit(name: string) {
    if (!namePrompt) return;
    setNamePromptError(null);
    try {
      const result = await lobbyApi.joinLobby(namePrompt, null, name);
      sessionStorage.setItem('lobby_player_token', result.playerToken);
      setPlayerToken(result.playerToken);
      const myPlayer = result.lobby.players.find((p) => p.displayName === name);
      if (myPlayer) {
        setMySlotIndex(myPlayer.slotIndex);
        setMyName(myPlayer.displayName);
        setIsHost(false);
      }
      setNamePrompt(null);
    } catch (err) {
      const message = getErrorMessage(err);
      setJoinError(message);
      setNamePromptError(message);
      showToast(message);
    }
  }

  const inLobby = !!lobbyCode && !!playerToken;

  return (
    <div className="min-h-screen flex flex-col font-body-md">
      <Header />

      <main className="flex-grow pt-24 pb-xl relative">
        <div className="max-w-[1200px] mx-auto relative z-10 px-4">
          <section className="text-center mb-xl">
            <h1 className="font-display text-display mb-4 text-on-surface">Pyramid Draft</h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto">
              Two person draft of a cube. Hate drafting is more difficult. Easier to have a plan going in to a draft. Will see over 90% of a standard cube size. See the <a href="https://desolatelighthouse.wordpress.com/2020/12/21/pyramid-draft/" className="text-primary hover:underline">
                wordpress here
              </a> for more information.
            </p>
          </section>

          {inLobby && currentLobby && mySlotIndex !== null ? (
            <div className="max-w-[700px] mx-auto">
              <LobbyView
                lobbyInfo={currentLobby}
                mySlotIndex={mySlotIndex}
                isHost={isHost}
                onStart={handleStartGame}
                onLeave={handleLeaveLobby}
                onKickPlayer={handleKickPlayer}
                isStarting={isStarting}
                error={createError}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-lg items-stretch">
              {/* Path 1: Create a Game */}
              <div className="glass-panel p-lg rounded-xl flex flex-col">
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="material-symbols-outlined text-primary text-3xl">auto_fix_high</span>
                    <h2 className="font-headline-md text-headline-md text-on-surface">Create Pyramid Draft</h2>
                  </div>
                  <p className="text-on-surface-variant font-body-md">
                    Create a lobby and share the link with your partner. They'll join automatically.
                  </p>
                </div>

                <div className="space-y-6 flex-grow">
                  <LabeledTextField
                    label="CUBE ID"
                    placeholder="e.g. arcane-vintage-303"
                    value={cubeID}
                    onChange={setCubeID}
                    tooltip={CUBE_ID_TOOLTIP}
                  />
                  <LabeledTextField
                    label={account ? 'YOUR NAME (AUTO-POPULATED)' : 'YOUR NAME'}
                    placeholder="Archmage Jace"
                    value={yourName}
                    onChange={setYourName}
                  />
                  <div>
                    <label className="block font-label-md text-label-md text-primary mb-2">EXTRA PICKS</label>
                    <div className="flex items-center gap-4">
                      <input
                        className="flex-grow accent-primary"
                        max={MAX_EXTRA_PICKS}
                        min={0}
                        type="range"
                        value={extraPicks}
                        onChange={(e) => setExtraPicks(Number(e.target.value))}
                      />
                      <span className="bg-surface-container-high px-3 py-1 rounded-md font-label-md text-tertiary">
                        {extraPicks}
                      </span>
                    </div>
                  </div>
                </div>

                {createError && <p className="mt-4 text-sm text-error">{createError}</p>}
                {joinError && <p className="mt-4 text-sm text-error">{joinError}</p>}

                <button
                  className="w-full mt-lg mana-gradient text-on-primary-container font-bold py-4 rounded-xl shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleCreateLobby}
                  disabled={creating}
                >
                  <span className="material-symbols-outlined">lan</span>
                  {creating ? 'Creating…' : 'Create Lobby'}
                </button>
              </div>

              {/* Path 2: Find a Game */}
              <FindGameSection onEnterDraft={onEnterDraft} />
            </div>
          )}

          {/* Name Prompt Modal */}
          {namePrompt && (
            <NamePromptModal
              error={namePromptError}
              onSubmit={handleNamePromptSubmit}
              onCancel={() => {
                setNamePrompt(null);
                setLobbyCode(null);
              }}
            />
          )}

          {/* Status section */}
          {!inLobby && (
            <section className="mt-xl glass-panel p-md rounded-xl border-outline-variant/20">
              <div className="flex flex-col md:flex-row justify-between items-center gap-md">
                <div className="flex items-center gap-8">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-tertiary-container animate-pulse" />
                    <span className="font-label-md text-label-sm text-on-surface-variant">SERVERS: STABLE</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-outline text-sm">groups</span>
                    <span className="font-label-md text-label-sm text-on-surface-variant">
                      ACTIVE DRAFTS: 1,248
                    </span>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="bg-surface-container px-4 py-2 rounded-lg border border-outline-variant/30 flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary text-sm">bolt</span>
                    <span className="font-label-md text-label-sm text-on-surface">LATENCY: 24MS</span>
                  </div>
                  <div className="bg-surface-container px-4 py-2 rounded-lg border border-outline-variant/30 flex items-center gap-3">
                    <span className="material-symbols-outlined text-tertiary text-sm">history</span>
                    <span className="font-label-md text-label-sm text-on-surface">LAST DRAFT: 2M AGO</span>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

function NamePromptModal({
  error,
  onSubmit,
  onCancel,
}: {
  error?: string | null;
  onSubmit: (name: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim());
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="bg-surface-container rounded-xl p-lg shadow-xl w-full max-w-sm mx-4"
      >
        <h3 className="font-headline-md text-headline-md text-on-surface mb-sm">Join Lobby</h3>
        <p className="font-body-md text-on-surface-variant mb-md">
          Enter your name to join the draft lobby.
        </p>
        <input
          className="w-full bg-surface-container-lowest border border-outline-variant/40 rounded-lg px-4 py-3 text-on-surface focus:outline-none input-glow transition-all font-label-md mb-md"
          placeholder="Your name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
        {error && <p className="mb-md text-sm text-error">{error}</p>}
        <div className="flex gap-sm">
          <button
            className="flex-1 bg-primary hover:bg-primary-container text-on-primary py-md rounded-xl font-label-md transition-all active:scale-95"
            type="submit"
            disabled={!name.trim()}
          >
            Join
          </button>
          <button
            className="flex-1 border border-outline/30 text-outline hover:text-on-surface py-md rounded-xl font-label-md transition-all active:scale-95"
            type="button"
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
