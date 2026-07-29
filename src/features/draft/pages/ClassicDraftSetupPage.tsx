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
import { useAuth } from '../../auth/AuthContext';

interface ClassicDraftSetupPageProps {
  onEnterDraft: (gameID: string, playerName: string) => void;
}

export function ClassicDraftSetupPage({ onEnterDraft }: ClassicDraftSetupPageProps) {
  const { account } = useAuth();
  const [searchParams] = useSearchParams();

  // Setup form state
  const [cubeID, setCubeID] = useState(() => searchParams.get('cubeID') ?? '');
  const [yourName, setYourName] = useState(account?.email ?? '');
  const [numberOfPlayers, setNumberOfPlayers] = useState(4);
  const [packsPerPlayer, setPacksPerPlayer] = useState(3);
  const [cardsPerPack, setCardsPerPack] = useState(15);
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

  // Polling
  const { lobby: polledLobby } = useLobbyPoller({
    lobbyCode: lobbyCode && playerToken ? lobbyCode : null,
    intervalMs: 3000,
    enabled: !!lobbyCode && !!playerToken,
  });

  const currentLobby = polledLobby ?? null;

  // Leave guard
  useLobbyLeaveGuard(
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
      try {
        const displayName = account?.displayName || account?.email || '';
        const result = await lobbyApi.joinLobby(
          code!,
          account?.accountID ?? null,
          displayName
        );
        sessionStorage.setItem('lobby_player_token', result.playerToken);
        setPlayerToken(result.playerToken);
        const myPlayer = result.lobby.players.find(
          (p) => account ? p.accountID === account.accountID : p.slotIndex === result.lobby.players.length - 1
        );
        if (myPlayer) {
          setMySlotIndex(myPlayer.slotIndex);
          setMyName(myPlayer.displayName);
          setIsHost(myPlayer.accountID === result.lobby.hostAccountID);
        }
      } catch (err) {
        setJoinError(getErrorMessage(err));
        setLobbyCode(null);
      }
    }

    if (account) {
      doJoin();
    } else {
      setNamePrompt(lobbyCode);
    }
  }, [lobbyCode, playerToken, account]);

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
        numberOfPlayers,
        packsPerPlayer,
        cardsPerPack,
      };
      const hostAccountID = account?.accountID ?? crypto.randomUUID();
      const hostDisplayName = yourName.trim();
      sessionStorage.setItem('lobby_host_account_id', hostAccountID);

      const lobby = await lobbyApi.createLobby({
        draftType: 'classic',
        config,
        hostAccountID,
        hostDisplayName,
        minPlayers: numberOfPlayers,
        maxPlayers: numberOfPlayers,
      });

      const hostToken = lobby.players[0].playerToken;
      sessionStorage.setItem('lobby_player_token', hostToken);
      setLobbyCode(lobby.lobbyCode);
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

  async function handleNamePromptSubmit(name: string) {
    if (!namePrompt) return;
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
      setJoinError(getErrorMessage(err));
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
                    />
                    <LabeledTextField
                      label={account ? 'YOUR NAME (AUTO-POPULATED)' : 'YOUR NAME'}
                      placeholder="Chandra Nalaar"
                      value={yourName}
                      onChange={setYourName}
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
                  {joinError && <p className="mt-4 text-sm text-error">{joinError}</p>}

                  <button
                    className="w-full mt-lg bg-primary hover:bg-primary-container text-on-primary font-bold py-4 rounded-xl shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                <FindGameSection onEnterDraft={onEnterDraft} />
              </div>
            </div>
          )}

          {/* Name Prompt Modal */}
          {namePrompt && (
            <NamePromptModal
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
  onSubmit,
  onCancel,
}: {
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
