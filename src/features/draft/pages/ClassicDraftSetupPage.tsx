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
  findMyPlayer,
  hasDuplicateAccount,
  isAlreadyInLobbyError,
} from '../../lobby/lib/lobbyJoinGuard';

interface ClassicDraftSetupPageProps {
  onEnterDraft: (gameID: string, playerName: string) => void;
}

export function ClassicDraftSetupPage({ onEnterDraft }: ClassicDraftSetupPageProps) {
  const { account, isLoading } = useAuth();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();

  // Setup form state
  const [cubeID, setCubeID] = useState(() => searchParams.get('cubeID') ?? '');
  const [yourName, setYourName] = useState('');
  const [numberOfPlayers, setNumberOfPlayers] = useState(4);

  // Autofill your name from the account once it loads (async). Uses the
  // display name with email as a fallback, and skips if the user already typed.
  useEffect(() => {
    if (!account) return;
    const displayName = account.displayName || account.email || '';
    if (displayName && !yourName) {
      setYourName(displayName);
    }
  }, [account, yourName]);
  const [packsPerPlayer, setPacksPerPlayer] = useState(3);
  const [cardsPerPack, setCardsPerPack] = useState(15);
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
  // needs this fallback. The backend never serializes player tokens, so a
  // logged-in user is matched by accountID; token matching only works in mock
  // mode.
  useEffect(() => {
    if (!currentLobby || mySlotIndex !== null || !playerToken) return;
    const me = findMyPlayer(currentLobby, {
      accountID: account?.accountID ?? null,
      playerToken,
      slotIndex: mySlotIndex,
      displayName: myName,
    });
    if (me) {
      setMySlotIndex(me.slotIndex);
      setMyName(me.displayName);
      setIsHost(me.accountID === currentLobby.hostAccountID);
    }
  }, [currentLobby, mySlotIndex, playerToken, account?.accountID, myName]);

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
            await lobbyApi.leaveLobby(code!, result.playerToken);
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
    // The backend never serializes player tokens, so match "me" by accountID
    // (logged in), then by slotIndex/displayName (anonymous, once seated).
    const stillThere = findMyPlayer(currentLobby, {
      accountID: account?.accountID ?? null,
      playerToken,
      slotIndex: mySlotIndex,
      displayName: myName,
    });
    if (stillThere) return;

    markLeft();
    showToast('You were removed from the lobby');
    resetLobbyState();
  }, [lobbyCode, playerToken, currentLobby, mySlotIndex, myName, account?.accountID, markLeft, showToast]);

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
        numberOfPlayers,
        packsPerPlayer,
        cardsPerPack,
      };
      const hostAccountID = account?.accountID ?? crypto.randomUUID();
      const hostDisplayName = yourName.trim();

      const result = await lobbyApi.createLobby({
        draftType: 'classic',
        config,
        hostAccountID,
        hostDisplayName,
        minPlayers: numberOfPlayers,
        maxPlayers: numberOfPlayers,
      });

      // The create response carries the host's own playerToken — the lobby
      // player list never serializes tokens.
      const hostToken = result.playerToken;
      sessionStorage.setItem('lobby_player_token', hostToken);
      setLobbyCode(result.lobby.lobbyCode);
      setPlayerToken(hostToken);
      setMySlotIndex(0);
      setMyName(hostDisplayName);
      setIsHost(true);
    } catch (err) {
      setCreateError(getErrorMessage(err));
    } finally {
      setCreating(false);
    }
  }

  async function handleStartGame() {
    if (!lobbyCode || !playerToken) return;
    setIsStarting(true);
    try {
      const result = await lobbyApi.startLobby(lobbyCode, playerToken);
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
    if (playerToken) {
      try {
        await lobbyApi.leaveLobby(lobbyCode, playerToken);
      } catch {
        // lobby may already be gone
      }
    }
    resetLobbyState();
  }

  async function handleKickPlayer(targetSlotIndex: number) {
    if (!lobbyCode || !playerToken) return;
    try {
      await lobbyApi.kickPlayer(lobbyCode, playerToken, targetSlotIndex);
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
          await lobbyApi.leaveLobby(namePrompt, result.playerToken);
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
        <div className="max-w-[1200px] mx-auto relative z-10 px-margin-mobile md:px-margin-desktop">
          <section className="text-center mb-xl">
            <h1 className="font-display text-display mb-4 text-on-surface">Classic Draft</h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto">
              The traditional draft experience. Gather up to 12 players, set your cube and pack
              configuration, and draft like the pros.
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
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg items-stretch">
              {/* Left Column: Create Lobby */}
              <div className="lg:col-span-7 flex flex-col gap-lg">
                <div className="glass-panel p-lg rounded-xl flex flex-col">
                  <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="material-symbols-outlined text-primary text-3xl">auto_awesome</span>
                      <h2 className="font-headline-md text-headline-md text-on-surface">Create Classic Draft</h2>
                    </div>
                    <p className="text-on-surface-variant font-body-md">
                      Create a lobby and share the link with other players. They'll join automatically.
                    </p>
                  </div>

                  <div className="space-y-6 flex-grow">
                    <LabeledTextField
                      label="CUBE ID"
                      placeholder="e.g. arcane-legacy-77"
                      value={cubeID}
                      onChange={setCubeID}
                      tooltip={CUBE_ID_TOOLTIP}
                    />
                    <LabeledTextField
                      label={account ? 'YOUR NAME (AUTO-POPULATED)' : 'YOUR NAME'}
                      placeholder="Chandra Nalaar"
                      value={yourName}
                      onChange={setYourName}
                      error={joinError}
                    />
                    <div className="grid grid-cols-3 gap-4">
                      <StepperInput
                        label="PLAYERS"
                        value={numberOfPlayers}
                        min={4}
                        max={12}
                        onChange={setNumberOfPlayers}
                      />
                      <StepperInput
                        label="PACKS PER PLAYER"
                        value={packsPerPlayer}
                        min={1}
                        max={20}
                        onChange={setPacksPerPlayer}
                      />
                      <StepperInput
                        label="CARDS PER PACK"
                        value={cardsPerPack}
                        min={5}
                        max={30}
                        onChange={setCardsPerPack}
                      />
                    </div>
                  </div>

                  {createError && <p className="mt-4 text-sm text-error">{createError}</p>}

                  <button
                    className="w-full mt-lg bg-primary hover:bg-primary-container text-on-primary font-bold py-4 rounded-xl border border-[color:var(--glass-border)] shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleCreateLobby}
                    disabled={creating}
                  >
                    <span className="material-symbols-outlined">lan</span>
                    {creating ? 'Creating…' : 'Create Lobby'}
                  </button>
                </div>
              </div>

              {/* Right Column: Find Game */}
              <div className="lg:col-span-5">
                <FindGameSection onEnterDraft={onEnterDraft} mode="classic" />
              </div>
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
          maxLength={50}
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

interface StepperInputProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}

function StepperInput({ label, value, min, max, onChange }: StepperInputProps) {
  return (
    <div className="flex flex-col gap-xs">
      <span className="font-label-sm text-outline">{label}</span>
      <div className="flex items-center bg-surface-container-lowest rounded-lg overflow-hidden border border-outline/20">
        <button
          className="px-2 py-1 hover:bg-surface-container-high text-on-surface transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          type="button"
        >
          <span className="material-symbols-outlined text-[18px]">remove</span>
        </button>
        <input
          className="w-full bg-transparent text-center font-display text-[18px] text-on-surface border-none focus:ring-0"
          readOnly
          type="number"
          value={value}
        />
        <button
          className="px-2 py-1 hover:bg-surface-container-high text-on-surface transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          type="button"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
        </button>
      </div>
    </div>
  );
}
