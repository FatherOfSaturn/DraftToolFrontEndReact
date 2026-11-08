import { useState, useEffect, useMemo } from 'react';
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
import { packOutcome } from '../model/burnStats';
import type { BurnRemainderPolicy } from '../model/burnGameTypes';

interface BurnDraftSetupPageProps {
  onEnterDraft: (gameID: string, playerName: string) => void;
}

type PolicyInput = 'burn_extras' | 'draft_extras';

export function BurnDraftSetupPage({ onEnterDraft }: BurnDraftSetupPageProps) {
  const { account, isLoading } = useAuth();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();

  // Setup form state
  const [cubeID, setCubeID] = useState(() => searchParams.get('cubeID') ?? '');
  const [yourName, setYourName] = useState('');
  const [cubeSize, setCubeSize] = useState(540);
  const [numberOfPlayers, setNumberOfPlayers] = useState(4);
  const [packsPerPlayer, setPacksPerPlayer] = useState(3);
  const [cardsPerPack, setCardsPerPack] = useState(15);
  const [cardsDraftedPerPack, setCardsDraftedPerPack] = useState(2);
  const [cardsBurnedPerPack, setCardsBurnedPerPack] = useState(1);
  const [remainderPolicy, setRemainderPolicy] = useState<PolicyInput>('burn_extras');

  // Autofill your name from the account once it loads (async).
  useEffect(() => {
    if (!account) return;
    const displayName = account.displayName || account.email || '';
    if (displayName && !yourName) {
      setYourName(displayName);
    }
  }, [account, yourName]);

  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Lobby state
  const [lobbyCode, setLobbyCode] = useState<string | null>(() => searchParams.get('lobby') ?? null);
  const [playerToken, setPlayerToken] = useState<string | null>(() =>
    searchParams.get('lobby') ? sessionStorage.getItem('lobby_player_token') : null
  );
  const [mySlotIndex, setMySlotIndex] = useState<number | null>(null);
  const [myName, setMyName] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
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

  const currentLobby = polledLobby && polledLobby.lobbyCode === lobbyCode ? polledLobby : null;

  const { markLeft } = useLobbyLeaveGuard(
    lobbyCode,
    playerToken,
    currentLobby?.status ?? null
  );

  function resetLobbyState() {
    sessionStorage.removeItem('lobby_player_token');
    setLobbyCode(null);
    setPlayerToken(null);
    setMySlotIndex(null);
    setMyName('');
    setIsHost(false);
  }

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

  // Recover slot/host/name from the polled lobby (reload-resume path).
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
    if (isLoading) return;

    async function doJoin() {
      setJoinError(null);
      setJoinConflict(false);
      try {
        const accountID = account?.accountID ?? null;
        const displayName = account?.displayName || account?.email || '';

        if (accountID) {
          if (await accountIsSeatedInLobby(code!, accountID)) {
            failAlreadyInLobby();
            return;
          }
        }

        const result = await lobbyApi.joinLobby(code!, accountID, displayName);

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

  // ---- Live calculator + validation (mirrors the standalone burn-calculator) ----
  const closedPolicy: BurnRemainderPolicy =
    remainderPolicy === 'draft_extras' ? 'DRAFT_EXTRAS' : 'BURN_EXTRAS';

  const calc = useMemo(() => {
    const outcome = packOutcome(cardsPerPack, cardsDraftedPerPack, cardsBurnedPerPack, closedPolicy);
    const numberOfPacks = numberOfPlayers * packsPerPlayer;
    const distributed = numberOfPacks * cardsPerPack;
    const coverage = cubeSize > 0 ? Math.min(100, (distributed / cubeSize) * 100) : 0;
    const cycle = cardsDraftedPerPack + cardsBurnedPerPack;
    const fullCycles = cycle > 0 ? Math.floor(cardsPerPack / cycle) : 0;
    const remainder = cycle > 0 ? cardsPerPack % cycle : cardsPerPack;

    return {
      outcome,
      numberOfPacks,
      distributed,
      cubeSize,
      coverage,
      fullCycles,
      remainder,
      perPlayerDrafted: outcome.drafted * packsPerPlayer,
      perPlayerBurned: outcome.burned * packsPerPlayer,
      tableDrafted: outcome.drafted * numberOfPacks,
      tableBurned: outcome.burned * numberOfPacks,
      tableLeft: outcome.leftover * numberOfPacks,
    };
  }, [cardsPerPack, cardsDraftedPerPack, cardsBurnedPerPack, closedPolicy, numberOfPlayers, packsPerPlayer, cubeSize]);

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    const trimmedCube = cubeID.trim();
    if (!trimmedCube) e.cubeID = 'Cube ID is required.';
    else if (!/^[A-Za-z0-9._-]{1,64}$/.test(trimmedCube)) {
      e.cubeID = 'Use 1–64 letters, digits, dots, underscores or dashes.';
    }
    if (!yourName.trim()) e.yourName = 'Your name is required.';
    if (!Number.isInteger(cubeSize) || cubeSize < 1) e.cubeSize = 'Cube size must be at least 1.';
    if (numberOfPlayers < 2 || numberOfPlayers > 12) e.players = 'Choose 2–12 players.';
    if (packsPerPlayer < 1 || packsPerPlayer > 30) e.packsPerPlayer = 'Choose 1–30 packs per player.';
    if (cardsPerPack < 1 || cardsPerPack > 25) e.cardsPerPack = 'Choose 1–25 cards per pack.';
    if (cardsDraftedPerPack < 1) e.cardsDraftedPerPack = 'Draft at least 1 card per turn.';
    if (cardsBurnedPerPack < 0) e.cardsBurnedPerPack = 'Burn count cannot be negative.';
    if (cardsDraftedPerPack + cardsBurnedPerPack > cardsPerPack) {
      e.quota = 'Draft + burn per turn cannot exceed cards per pack.';
    }
    if (cardsDraftedPerPack + cardsBurnedPerPack < 1) {
      e.quota = 'Set at least one draft or burn per turn.';
    }
    if (calc.distributed > cubeSize) {
      e.cubeSizeFit = `Not enough cards! This draft needs ${calc.distributed.toLocaleString()} but the cube only has ${cubeSize.toLocaleString()}.`;
    }
    return e;
  }, [
    cubeID,
    yourName,
    cubeSize,
    numberOfPlayers,
    packsPerPlayer,
    cardsPerPack,
    cardsDraftedPerPack,
    cardsBurnedPerPack,
    calc.distributed,
  ]);

  const errorList = Object.values(errors);
  const isValid = errorList.length === 0;

  function applyPreset(draft: number, burn: number, pack: number) {
    setCardsDraftedPerPack(draft);
    setCardsBurnedPerPack(burn);
    setCardsPerPack(pack);
  }

  async function handleCreateLobby() {
    if (!isValid) {
      setCreateError('Fix the highlighted fields before creating the lobby.');
      return;
    }

    setCreating(true);
    setCreateError(null);
    setJoinError(null);
    setJoinConflict(false);
    try {
      const config: Record<string, unknown> = {
        cubeID: cubeID.trim(),
        packsPerPlayer,
        cardsPerPack,
        cardsDraftedPerPack,
        cardsBurnedPerPack,
        remainderPolicy,
      };
      const hostAccountID = account?.accountID ?? crypto.randomUUID();
      const hostDisplayName = yourName.trim();

      const result = await lobbyApi.createLobby({
        draftType: 'burn',
        config,
        hostAccountID,
        hostDisplayName,
        minPlayers: numberOfPlayers,
        maxPlayers: numberOfPlayers,
      });

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
  const validTone = calc.distributed <= cubeSize;

  return (
    <div className="min-h-screen flex flex-col font-body-md">
      <Header />

      <main className="flex-grow pt-24 pb-xl relative">
        <div className="max-w-[1200px] mx-auto relative z-10 px-margin-mobile md:px-margin-desktop">
          <section className="text-center mb-xl">
            <h1 className="font-display text-display mb-4 text-on-surface">Burn Draft</h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto">
              A rotisserie with a twist: on every turn you draft cards and burn the rest of your
              picks. Tune the numbers below and watch the outcome update live before you open the
              lobby.
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
              {/* Left Column: Create Lobby + live calculator */}
              <div className="lg:col-span-7 flex flex-col gap-lg">
                <div className="glass-panel p-lg rounded-xl flex flex-col">
                  <div className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="material-symbols-outlined text-primary text-3xl">local_fire_department</span>
                      <h2 className="font-headline-md text-headline-md text-on-surface">Create Burn Draft</h2>
                    </div>
                    <p className="text-on-surface-variant font-body-md">
                      Create a lobby and share the link with other players. They'll join automatically.
                    </p>
                  </div>

                  <div className="space-y-6">
                    <LabeledTextField
                      label="CUBE ID"
                      placeholder="e.g. arcane-legacy-77"
                      value={cubeID}
                      onChange={setCubeID}
                      tooltip={CUBE_ID_TOOLTIP}
                      error={errors.cubeID}
                    />
                    <LabeledTextField
                      label={account ? 'YOUR NAME (AUTO-POPULATED)' : 'YOUR NAME'}
                      placeholder="Chandra Nalaar"
                      value={yourName}
                      onChange={setYourName}
                      error={errors.yourName ?? joinError}
                    />

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      <NumberInput
                        label="CUBE SIZE"
                        value={cubeSize}
                        min={1}
                        max={100000}
                        onChange={setCubeSize}
                        error={errors.cubeSize}
                      />
                      <StepperInput
                        label="PLAYERS"
                        value={numberOfPlayers}
                        min={2}
                        max={12}
                        onChange={setNumberOfPlayers}
                        error={errors.players}
                      />
                      <StepperInput
                        label="PACKS / PLAYER"
                        value={packsPerPlayer}
                        min={1}
                        max={30}
                        onChange={setPacksPerPlayer}
                        error={errors.packsPerPlayer}
                      />
                      <StepperInput
                        label="CARDS / PACK"
                        value={cardsPerPack}
                        min={1}
                        max={25}
                        onChange={setCardsPerPack}
                        error={errors.cardsPerPack}
                      />
                      <StepperInput
                        label="DRAFT / TURN"
                        value={cardsDraftedPerPack}
                        min={1}
                        max={Math.max(1, cardsPerPack)}
                        onChange={setCardsDraftedPerPack}
                        error={errors.cardsDraftedPerPack}
                      />
                      <StepperInput
                        label="BURN / TURN"
                        value={cardsBurnedPerPack}
                        min={0}
                        max={Math.max(0, cardsPerPack)}
                        onChange={setCardsBurnedPerPack}
                        error={errors.cardsBurnedPerPack}
                      />
                    </div>

                    <div>
                      <span className="block font-label-sm text-outline mb-2">REMAINDER POLICY</span>
                      <div className="grid grid-cols-2 gap-3">
                        <PolicyButton
                          active={remainderPolicy === 'burn_extras'}
                          title="Burn extras"
                          description="Partial final turn: burn the leftovers."
                          icon="local_fire_department"
                          tone="burn"
                          onClick={() => setRemainderPolicy('burn_extras')}
                        />
                        <PolicyButton
                          active={remainderPolicy === 'draft_extras'}
                          title="Draft extras"
                          description="Partial final turn: draft the leftovers."
                          icon="content_copy"
                          tone="draft"
                          onClick={() => setRemainderPolicy('draft_extras')}
                        />
                      </div>
                      {errors.quota && <p className="mt-2 text-sm text-error">{errors.quota}</p>}
                    </div>

                    <div>
                      <span className="block font-label-sm text-outline mb-2">QUICK PRESETS</span>
                      <div className="flex flex-wrap gap-2">
                        <PresetButton onClick={() => applyPreset(1, 1, 6)}>1 draft / 1 burn</PresetButton>
                        <PresetButton onClick={() => applyPreset(2, 2, 6)}>2 draft / 2 burn</PresetButton>
                        <PresetButton onClick={() => applyPreset(2, 1, 6)}>2 draft / 1 burn</PresetButton>
                        <PresetButton onClick={() => applyPreset(1, 1, 9)}>More exposure</PresetButton>
                      </div>
                    </div>
                  </div>

                  {createError && <p className="mt-4 text-sm text-error">{createError}</p>}

                  <button
                    className="w-full mt-lg bg-primary hover:bg-primary-container text-on-primary font-bold py-4 rounded-xl border border-[color:var(--glass-border)] shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleCreateLobby}
                    disabled={creating || !isValid}
                  >
                    <span className="material-symbols-outlined">lan</span>
                    {creating ? 'Creating…' : 'Create Lobby'}
                  </button>
                </div>

                <BurnCalculatorPanel calc={calc} validTone={validTone} errors={errorList} />
              </div>

              {/* Right Column: Find Game */}
              <div className="lg:col-span-5">
                <FindGameSection onEnterDraft={onEnterDraft} mode="burn" />
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

interface CalcSummary {
  outcome: { drafted: number; burned: number; leftover: number };
  numberOfPacks: number;
  distributed: number;
  cubeSize: number;
  coverage: number;
  fullCycles: number;
  remainder: number;
  perPlayerDrafted: number;
  perPlayerBurned: number;
  tableDrafted: number;
  tableBurned: number;
  tableLeft: number;
}

function BurnCalculatorPanel({
  calc,
  validTone,
  errors,
}: {
  calc: CalcSummary;
  validTone: boolean;
  errors: string[];
}) {
  return (
    <div className="glass-panel p-lg rounded-xl flex flex-col gap-md">
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-secondary text-3xl">calculate</span>
        <h2 className="font-headline-md text-headline-md text-on-surface">Live Results</h2>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="font-label-sm text-on-surface-variant">CUBE COVERAGE</span>
          <span className={`font-display text-[22px] ${validTone ? 'text-primary' : 'text-error'}`}>
            {calc.coverage.toFixed(1)}%
          </span>
        </div>
        <div className="h-3 bg-surface-variant rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${validTone ? 'bg-primary' : 'bg-error'}`}
            style={{ width: `${calc.coverage}%` }}
          />
        </div>
        <p className="mt-1 font-label-sm text-on-surface-variant">
          {calc.distributed.toLocaleString()} of {calc.cubeSize.toLocaleString()} cards distributed
          {' · '}
          {calc.numberOfPacks.toLocaleString()} packs
          {calc.tableDrafted + calc.tableBurned > 0
            ? ` · ${(calc.tableDrafted + calc.tableBurned).toLocaleString()} cards consumed`
            : ''}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatTile label="DRAFTED / PACK" value={calc.outcome.drafted} tone="draft" />
        <StatTile label="BURNED / PACK" value={calc.outcome.burned} tone="burn" />
        <StatTile label="DRAFTED / PLAYER" value={calc.perPlayerDrafted} tone="draft" />
        <StatTile label="BURNED / PLAYER" value={calc.perPlayerBurned} tone="burn" />
      </div>

      <div className="rounded-lg border border-outline-variant/20 overflow-hidden">
        <table className="w-full text-sm">
          <tbody>
            <SummaryRow label="Cards distributed (table)" value={calc.distributed} />
            <SummaryRow label="Cards drafted (table)" value={calc.tableDrafted} />
            <SummaryRow label="Cards burned (table)" value={calc.tableBurned} />
            <SummaryRow label="Cards left in packs" value={calc.tableLeft} />
            <SummaryRow label="Full cycles per pack" value={calc.fullCycles} />
            <SummaryRow label="Cards in final partial turn" value={calc.remainder} />
          </tbody>
        </table>
      </div>

      {errors.length > 0 ? (
        <div className="rounded-lg border border-error/40 bg-error/10 p-3">
          <p className="font-label-md text-error flex items-center gap-1 mb-1">
            <span className="material-symbols-outlined text-[18px]">error</span>
            Fix these before starting:
          </p>
          <ul className="list-disc list-inside space-y-0.5 text-sm text-error/90">
            {errors.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="rounded-lg border border-primary/40 bg-primary/10 p-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>
          <p className="font-label-md text-primary">Configuration looks good.</p>
        </div>
      )}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: number }) {
  return (
    <tr className="border-b border-outline-variant/10 last:border-b-0">
      <td className="py-1.5 px-3 text-on-surface-variant">{label}</td>
      <td className="py-1.5 px-3 text-right font-bold text-on-surface">{value.toLocaleString()}</td>
    </tr>
  );
}

function StatTile({ label, value, tone }: { label: string; value: number; tone: 'draft' | 'burn' }) {
  const toneClass = tone === 'burn' ? 'text-error' : 'text-primary';
  return (
    <div className="bg-surface-container-lowest rounded-lg p-3 border border-outline-variant/20">
      <div className="font-label-sm text-label-sm text-on-surface-variant">{label}</div>
      <div className={`font-display text-[24px] ${toneClass}`}>{value.toLocaleString()}</div>
    </div>
  );
}

function PresetButton({ onClick, children }: { onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-3 py-1.5 rounded-lg border border-outline-variant/40 text-on-surface-variant font-label-sm hover:border-primary/50 hover:text-primary transition-colors"
    >
      {children}
    </button>
  );
}

function PolicyButton({
  active,
  title,
  description,
  icon,
  tone,
  onClick,
}: {
  active: boolean;
  title: string;
  description: string;
  icon: string;
  tone: 'draft' | 'burn';
  onClick: () => void;
}) {
  const activeClass =
    tone === 'burn'
      ? 'border-error bg-error/10 text-error'
      : 'border-primary bg-primary/10 text-primary';
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`text-left rounded-lg border-2 p-3 transition-all ${
        active ? activeClass : 'border-outline-variant/30 text-on-surface-variant hover:border-primary/40'
      }`}
    >
      <span className="flex items-center gap-1 font-label-md">
        <span className="material-symbols-outlined text-[18px]">{icon}</span>
        {title}
      </span>
      <span className="block mt-1 text-[11px] leading-tight opacity-80">{description}</span>
    </button>
  );
}

interface StepperInputProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  error?: string;
}

function StepperInput({ label, value, min, max, onChange, error }: StepperInputProps) {
  const invalid = Boolean(error);
  return (
    <div className="flex flex-col gap-xs">
      <span className="font-label-sm text-outline">{label}</span>
      <div
        className={`flex items-center bg-surface-container-lowest rounded-lg overflow-hidden border ${
          invalid ? 'border-error' : 'border-outline/20'
        }`}
      >
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
      {error && <span className="text-[11px] text-error leading-tight">{error}</span>}
    </div>
  );
}

interface NumberInputProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  error?: string;
}

function NumberInput({ label, value, min, max, onChange, error }: NumberInputProps) {
  const invalid = Boolean(error);
  return (
    <div className="flex flex-col gap-xs">
      <span className="font-label-sm text-outline">{label}</span>
      <input
        className={`w-full bg-surface-container-lowest rounded-lg px-3 py-2 font-display text-[18px] text-on-surface focus:outline-none input-glow transition-all border ${
          invalid ? 'border-error' : 'border-outline/20'
        }`}
        type="number"
        min={min}
        max={max}
        value={Number.isNaN(value) ? '' : value}
        onChange={(e) => {
          const next = Math.floor(Number(e.target.value));
          onChange(Number.isNaN(next) ? min : next);
        }}
      />
      {error && <span className="text-[11px] text-error leading-tight">{error}</span>}
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
