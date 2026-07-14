import { useState } from 'react';
import { Header } from '../../../shared/components/layout/Header';
import { Footer } from '../../../shared/components/layout/Footer';
import { gameApi } from '../api/gameApi';
import { getErrorMessage } from '../../../shared/lib/errors';
import { useAuth } from '../../auth/AuthContext';
import type { GameCreationInfo } from '../model/gameTypes';

interface DraftSetupPageProps {
  /** Called once a game is successfully created or joined, with the
   * gameID and the name this browser should play as. Wire this to
   * your router (e.g. navigate(`/draft/${gameID}/${playerName}`)). */
  onEnterDraft: (gameID: string, playerName: string) => void;
}

const MAX_EXTRA_PICKS = 8;

/**
 * Landing page for starting or joining a draft: two side-by-side forms
 * (Create / Find a Game) plus a purely decorative server-status strip.
 * The five near-identical label+input fields across both forms share
 * the local `LabeledTextField` component below, rather than each
 * repeating the same ~10 lines of markup.
 */
export function DraftSetupPage({ onEnterDraft }: DraftSetupPageProps) {
  const { account } = useAuth();

  // --- Manifest Ritual (create game) form state ---
  const [cubeID, setCubeID] = useState('');
  const [yourName, setYourName] = useState(account?.email ?? '');
  const [partnerTag, setPartnerTag] = useState('');
  const [extraPicks, setExtraPicks] = useState(2);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [gameID] = useState(() => crypto.randomUUID());

  // --- Enter the Grimoire (join game) form state ---
  const [joinGameID, setJoinGameID] = useState('');
  const [joinName, setJoinName] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  async function handleManifestRitual() {
    if (!cubeID.trim() || !yourName.trim()) {
      setCreateError('Cube ID and your name are required.');
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      // Frontend generates accountID as a UUID before calling POST /game.
      // If the user is signed in, Player 1 uses their real accountID.
      const payload: GameCreationInfo = {
        gameID,
        cubeID: cubeID.trim(),
        numberOfDoubleDraftPicksPerPlayer: extraPicks,
        players: [
          { accountID: account?.accountID ?? crypto.randomUUID(), name: yourName.trim() },
          { accountID: crypto.randomUUID(), name: partnerTag.trim() },
        ],
      };
      const created = await gameApi.createAndStartGame(payload);
      onEnterDraft(created.gameID, yourName.trim());
    } catch (err) {
      setCreateError(getErrorMessage(err));
    } finally {
      setCreating(false);
    }
  }

  async function handleEnterGrimoire() {
    if (!joinGameID.trim() || !joinName.trim()) {
      setJoinError('Game ID and your name are required.');
      return;
    }
    setJoining(true);
    setJoinError(null);
    try {
      const info = await gameApi.fetchGameData(joinGameID.trim());
      const matchesPlayer = info.players.some((p) => p.playerName === joinName.trim());
      if (!matchesPlayer) {
        throw new Error(`No player named "${joinName.trim()}" found in game ${joinGameID.trim()}.`);
      }
      onEnterDraft(info.gameID, joinName.trim());
    } catch (err) {
      setJoinError(getErrorMessage(err));
    } finally {
      setJoining(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col font-body-md">
      <Header />

      <main className="flex-grow pt-24 pb-xl relative">
        <div className="max-w-[1200px] mx-auto relative z-10 px-4">
          <section className="text-center mb-xl">
            <h1 className="font-display text-display mb-4 text-on-surface">Pyramid Draft</h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto">
              Two person draft of a cube. Hate drafting is more difficult. Easier to have a plan going in to a draft. Will see over 90% of a standard cube size. See the <a href="https://www.google.com">wordpress</a> here for more information.
            </p>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-lg items-stretch">
            {/* Path 1: Create a Game */}
            <div className="glass-panel p-lg rounded-xl flex flex-col">
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                  <span className="material-symbols-outlined text-primary text-3xl">auto_fix_high</span>
                  <h2 className="font-headline-md text-headline-md text-on-surface">Create Pyramid Draft</h2>
                </div>
                <p className="text-on-surface-variant font-body-md">
                  Supply a cube ID and your name, as well as your partner's name or account number.
                </p>
              </div>

              <div className="space-y-6 flex-grow">
                <LabeledTextField
                  label="CUBE ID"
                  placeholder="e.g. arcane-vintage-303"
                  value={cubeID}
                  onChange={setCubeID}
                />
                <LabeledTextField
                  label={account ? 'YOUR NAME (AUTO-POPULATED)' : 'YOUR NAME'}
                  placeholder="Archmage Jace"
                  value={yourName}
                  onChange={setYourName}
                />
                <LabeledTextField
                  label="PARTNER'S ACCOUNT"
                  placeholder="@planeswalker_tag"
                  value={partnerTag}
                  onChange={setPartnerTag}
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
                className="w-full mt-lg mana-gradient text-on-primary-container font-bold py-4 rounded-xl shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleManifestRitual}
                disabled={creating}
              >
                <span className="material-symbols-outlined">flare</span>
                {creating ? 'Manifesting…' : 'Create Pyramid Draft'}
              </button>
            </div>

            {/* Path 2: Find a Game */}
            <div className="glass-panel p-lg rounded-xl flex flex-col">
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                  <span className="material-symbols-outlined text-secondary text-3xl">explore</span>
                  <h2 className="font-headline-md text-headline-md text-on-surface">Find Game</h2>
                </div>
                <p className="text-on-surface-variant font-body-md">
                  If a draft is already in progress, enter the below to join. You can also find the game under your account if you have one.
                </p>
              </div>

              <div className="space-y-6 flex-grow">
                <LabeledTextField
                  label="GAME ID"
                  placeholder="RITUAL-XXXX-XXXX"
                  value={joinGameID}
                  onChange={setJoinGameID}
                  accentClassName="text-secondary"
                  inputClassName="uppercase"
                />
                <LabeledTextField
                  label="YOUR NAME"
                  placeholder="Master Artificer"
                  value={joinName}
                  onChange={setJoinName}
                  accentClassName="text-secondary"
                />

                <div className="mt-8 border border-outline-variant/20 rounded-xl overflow-hidden relative h-32 group">
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                    style={{
                      backgroundImage:
                        "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBV0m0MYNttVVRfcTbOO0D78N4_dPJWAmnnDbLBWPudlvPwsIX4WYYv6SD1dMeKzQrVIrSgM6hesdRkQvKkhJA51VenA0gUqM069Z_5QS0hmZebGt2dcxRI9rDOHOakmFyCSJt84LsKlwnPwvgudgJkHNIIjqbQTxJkOKngVZPx-sl3DJFHkTiMZyyqFMm1L1zTB1IPQfoQnvUC5VYi_Ft0KVqmbH0T6iEmIg3p_-qyca99GvV4VJ6PdJ9xoI7Hx2v20N3A6zx6jCs')",
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest to-transparent flex items-end p-4">
                    <span className="text-xs font-label-md text-outline tracking-widest uppercase">
                      Game in Progress
                    </span>
                  </div>
                </div>
              </div>

              {joinError && <p className="mt-4 text-sm text-error">{joinError}</p>}

              <button
                className="w-full mt-lg border-2 border-secondary text-secondary font-bold py-4 rounded-xl hover:bg-secondary/10 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleEnterGrimoire}
                disabled={joining}
              >
                <span className="material-symbols-outlined">auto_stories</span>
                {joining ? 'Entering…' : 'Join Game'}
              </button>
            </div>
          </div>

          {/* Status section is presentational only — these numbers are
              placeholders from the mockup. Wire to a real status/health
              endpoint if you have one, or remove this section. */}
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
        </div>
      </main>

      <Footer />
    </div>
  );
}

interface LabeledTextFieldProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  /** Label accent color — the Create form uses primary, the Find form
   * uses secondary. Defaults to primary. */
  accentClassName?: 'text-primary' | 'text-secondary';
  /** Extra input classes, e.g. 'uppercase' for the Game ID field. */
  inputClassName?: string;
}

/** A label + text input pair, styled to match this page's mockup. The
 * five near-identical fields across the Create/Find forms all render
 * through this one component instead of each repeating the same
 * ~10-line block. */
function LabeledTextField({
  label,
  placeholder,
  value,
  onChange,
  accentClassName = 'text-primary',
  inputClassName = '',
}: LabeledTextFieldProps) {
  return (
    <div>
      <label className={`block font-label-md text-label-md ${accentClassName} mb-2`}>{label}</label>
      <input
        className={`w-full bg-surface-container-lowest border border-outline-variant/40 rounded-lg px-4 py-3 text-on-surface focus:outline-none input-glow transition-all font-label-md ${inputClassName}`}
        placeholder={placeholder}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
