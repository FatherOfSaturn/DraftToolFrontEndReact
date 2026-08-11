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
import {
  ALREADY_IN_LOBBY_MESSAGE,
  accountIsSeatedInLobby,
  hasDuplicateAccount,
  isAlreadyInLobbyError,
} from '../../lobby/lib/lobbyJoinGuard';

interface DraftSetupPageProps {
  onEnterDraft: (gameID: string, playerName: string) => void;
}

const MAX_EXTRA_PICKS = 8;

export function DraftSetupPage({ onEnterDraft }: DraftSetupPageProps) {
  const { account, isLoading } = useAuth();
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
  // Resume the same session on a page reload (sessionStorage survives reloads but
  // a fresh tab/device starts empty, so a fresh join still gets a hard error).
  const [playerToken, setPlayerToken] = useState<string | null>(() =>
    searchParams.get('lobby') ? sessionStorage.getItem('lobby_player_token') : null
  );
  const [mySlotIndex, setMySlotIndex] = useState<number | null>(null);
  const [myName, setMyName] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  // Set when the account is already seated in this lobby: the join controls
  // (e.g. the name-prompt Join button) must not be usable.
  const [joinConflict, setJoinConflict] = useState(false);

  // Name prompt for anonymous joiners
  const [namePrompt, setNamePrompt] = useState<string | null>(null);
  const [namePromptError, setNamePromptError] = useState<string | null>(null);

  // Polling
  const { lobby: polledLobby } = useLobbyPoller({
    lobbyCode: lobbyCode && playerToken ? lobbyCode : null,
    intervalMs: 3000,
    enabled: !!lobbyCode && !!playerToken,
  });

  // Only treat a polled lobby as current if its code matches — the previous
  // lobby lingers in the poller for a beat after creating/joining a new one,
  // and must not trigger "removed from lobby" or render stale players.
  const currentLobby = polledLobby && polledLobby.lobbyCode === lobbyCode ? polledLobby : null;

  // Leave guard
  const { markLeft } = useLobbyLeaveGuard(
    lobbyCode,
    playerToken,
    currentLobby?.status ?? null
  );

  // Tear down any joined/joined-into lobby state, in or out of a lobby.
  function resetLobbyState() {
    sessionStorage.removeItem('lobby_player_token');
    sessionStorage.removeItem('lobby_host_account_id');
    setLobbyCode(null);
    setPlayerToken(null);
    setMySlotIndex(null);
    setMyName('');
    setIsHost(false);
  }

  // A logged-in account already seated in this lobby: refuse the join, show
  // the message under the name field, and leave the join controls unusable.
  function failAlreadyInLobby() {
    const message = ALREADY_IN_LOBBY_MESSAGE;
    setJoinError(message);
    setJoinConflict(true);
    showToast(message);
    resetLobbyState();
  }

  // Navigate when game starts
  useEffect(() => {
    if (currentLobby?.status === 'started' && currentLobby.gameID && myName) {
      const gid: string = currentLobby.gameID;
      onEnterDraft(gid, myName);
    }
  }, [currentLobby?.status, currentLobby?.gameID, myName, onEnterDraft]);

  // Recover slot/host/name from the polled lobby. Normally the join/create
  // response supplies these; only the reload-resume path (no join response)
  // needs this fallback.
  useEffect(() => {
    if (!currentLobby || mySlotIndex !== null || !playerToken) return;
    const me = currentLobby.players.find((p) => p.playerToken === playerToken);
    if (me) {
      setMySlotIndex(me.slotIndex);
      setMyName(me.displayName);
      setIsHost(me.accountID === currentLobby.hostAccountID);
    }
  }, [currentLobby, mySlotIndex, playerToken]);

  // Auto-join when lobby param is present
  useEffect(() => {
    const code = lobbyCode;
    if (!code || playerToken) return;
    // Wait for the account to settle first: auto-joining as an anonymous
    // name-prompt before the account loads lets a logged-in user slip through
    // the join with accountID null (bypassing the backend's account dedup).
    if (isLoading) return;

    async function doJoin() {
      setJoinError(null);
      setJoinConflict(false);
      try {
        const accountID = account?.accountID ?? null;
        const displayName = account?.displayName || account?.email || '';

        // Fail loudly if this account is already in the lobby instead of
        // adopting the existing entry. Adopting used to share the host's
        // playerToken with a second session, which let that session's leave
        // guard later remove the real host. A fresh join must not happen at
        // all — otherwise a non-deduping backend could add a duplicate row.
        if (accountID) {
          if (await accountIsSeatedInLobby(code!, accountID)) {
            failAlreadyInLobby();
            return;
          }
        }

        const result = await lobbyApi.joinLobby(code!, accountID, displayName);

        // Safety net: if the backend allowed a duplicate join, undo it and
        // surface the conflict instead of leaving two seats for one account.
        if (hasDuplicateAccount(result.lobby, accountID)) {
          try {
            await lobbyApi.leaveLobby(code!, accountID, result.playerToken);
          } catch {
            // best-effort cleanup
          }
          failAlreadyInLobby();
          return;
        }

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
        const raw = getErrorMessage(err);
        const isConflict = isAlreadyInLobbyError(raw);
        const message = isConflict ? ALREADY_IN_LOBBY_MESSAGE : raw;
        setJoinError(message);
        setJoinConflict(isConflict);
        showToast(message);
        resetLobbyState();
      }
    }

    if (account) {
      // A logged-in user joins with their account; never leave the anonymous
      // name-prompt open on top of that join.
      setNamePrompt(null);
      doJoin();
    } else {
      setNamePrompt(lobbyCode);
      setNamePromptError(null);
    }
  }, [lobbyCode, playerToken, account, isLoading, showToast]);

  // Auto-exit when the host removes us
  useEffect(() => {
    if (!lobbyCode || !playerToken || !currentLobby) return;
    if (currentLobby.status !== 'waiting') return;
    const stillThere = currentLobby.players.some((p) => p.playerToken === playerToken);
    if (stillThere) return;

    markLeft();
    showToast('You were removed from the lobby');
    resetLobbyState();
  }, [lobbyCode, playerToken, currentLobby, markLeft, showToast]);

  async function handleCreateLobby() {
    if (!cubeID.trim() || !yourName.trim()) {
      setCreateError('Cube ID and your name are required.');
      return;
    }

    setCreating(true);
    setCreateError(null);
    setJoinError(null);
    setJoinConflict(false);
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
    resetLobbyState();
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
    setJoinConflict(false);

    const accountID = account?.accountID ?? null;

    // A logged-in account must never slip through the anonymous name-prompt
    // path: joining with accountID null bypasses the backend's account dedup
    // and would seat the same account twice under different names.
    if (accountID) {
      if (await accountIsSeatedInLobby(namePrompt, accountID)) {
        const message = ALREADY_IN_LOBBY_MESSAGE;
        setJoinError(message);
        setNamePromptError(message);
        setJoinConflict(true);
        showToast(message);
        return;
      }
    }

    try {
      const result = await lobbyApi.joinLobby(namePrompt, accountID, name);

      // Safety net for backends that allow the duplicate join instead of
      // rejecting — undo it and surface the conflict.
      if (hasDuplicateAccount(result.lobby, accountID)) {
        try {
          await lobbyApi.leaveLobby(namePrompt, accountID, result.playerToken);
        } catch {
          // best-effort cleanup
        }
        const message = ALREADY_IN_LOBBY_MESSAGE;
        setJoinError(message);
        setNamePromptError(message);
        setJoinConflict(true);
        showToast(message);
        return;
      }

      sessionStorage.setItem('lobby_player_token', result.playerToken);
      setPlayerToken(result.playerToken);
      const myPlayer = result.lobby.players.find(
        (p) => accountID ? p.accountID === accountID : p.displayName === name
      );
      if (myPlayer) {
        setMySlotIndex(myPlayer.slotIndex);
        setMyName(myPlayer.displayName);
        setIsHost(false);
      }
      setNamePrompt(null);
    } catch (err) {
      const raw = getErrorMessage(err);
      const isConflict = isAlreadyInLobbyError(raw);
      const message = isConflict ? ALREADY_IN_LOBBY_MESSAGE : raw;
      setJoinError(message);
      setNamePromptError(message);
      setJoinConflict(isConflict);
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
                    error={joinError}
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

                <button
                  className="w-full mt-lg mana-gradient text-on-primary-container font-bold py-4 rounded-xl border border-[color:var(--glass-border)] shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
              disabled={joinConflict}
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
  disabled = false,
  onSubmit,
  onCancel,
}: {
  error?: string | null;
  /** When true the join is refused (e.g. account already in lobby). */
  disabled?: boolean;
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
            className="flex-1 bg-primary hover:bg-primary-container text-on-primary py-md rounded-xl font-label-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            type="submit"
            disabled={!name.trim() || disabled}
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
