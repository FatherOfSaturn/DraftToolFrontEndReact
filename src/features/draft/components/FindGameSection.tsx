import { getErrorMessage } from '../../../shared/lib/errors';
import { gameApi } from '../api/gameApi';
import { classicGameApi } from '../api/classicGameApi';
import { ApiError } from '../../../shared/api/httpClient';
import { useState } from 'react';

interface FindGameSectionProps {
  onEnterDraft: (gameID: string, playerName: string) => void;
  /** Which backend to validate against first. Classic tries draftData first. */
  mode?: 'pyramid' | 'classic';
}

export function FindGameSection({ onEnterDraft, mode = 'pyramid' }: FindGameSectionProps) {
  const [joinGameID, setJoinGameID] = useState('');
  const [joinName, setJoinName] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  async function joinPyramidGame(gameID: string, name: string) {
    const info = await gameApi.fetchGameData(gameID);
    const matchesPlayer = info.players.some((p) => p.playerName === name);
    if (!matchesPlayer) {
      throw new Error(`No player named "${name}" found in game ${gameID}.`);
    }
    onEnterDraft(info.gameID, name);
  }

  async function joinClassicGame(gameID: string, name: string) {
    // Classic draft data requires the caller's X-Player-Token (only issued on
    // lobby join), so an in-progress game can't be validated by name here.
    // The public fetchGameData endpoint returns the game only once it's
    // complete — use it to confirm the player existed.
    const info = await classicGameApi.fetchGameData(gameID);
    const matchesPlayer = info.players.some((p) => p.playerName === name);
    if (!matchesPlayer) {
      throw new Error(`No player named "${name}" found in game ${gameID}.`);
    }
    onEnterDraft(info.gameID, name);
  }

  async function handleEnterGrimoire() {
    if (!joinGameID.trim() || !joinName.trim()) {
      setJoinError('Game ID and your name are required.');
      return;
    }
    const gameID = joinGameID.trim();
    const name = joinName.trim();
    setJoining(true);
    setJoinError(null);
    try {
      if (mode === 'classic') {
        try {
          await joinClassicGame(gameID, name);
        } catch (err) {
          // Not a classic game — fall back to the pyramid lookup so a
          // pyramid game entered here still works.
          if (err instanceof ApiError && err.status === 404) {
            await joinPyramidGame(gameID, name);
          } else {
            throw err;
          }
        }
      } else {
        await joinPyramidGame(gameID, name);
      }
    } catch (err) {
      setJoinError(getErrorMessage(err));
    } finally {
      setJoining(false);
    }
  }

  return (
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
        <div>
          <label className="block font-label-md text-label-md text-secondary mb-2">GAME ID</label>
          <input
            className="w-full bg-surface-container-lowest border border-outline-variant/40 rounded-lg px-4 py-3 text-on-surface focus:outline-none input-glow transition-all font-label-md uppercase"
            placeholder="RITUAL-XXXX-XXXX"
            type="text"
            value={joinGameID}
            onChange={(e) => setJoinGameID(e.target.value)}
            maxLength={64}
          />
        </div>
        <div>
          <label className="block font-label-md text-label-md text-secondary mb-2">YOUR NAME</label>
          <input
            className="w-full bg-surface-container-lowest border border-outline-variant/40 rounded-lg px-4 py-3 text-on-surface focus:outline-none input-glow transition-all font-label-md"
            placeholder="Master Artificer"
            type="text"
            value={joinName}
            onChange={(e) => setJoinName(e.target.value)}
            maxLength={50}
          />
        </div>

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
        {joining ? 'Joining…' : 'Join Game'}
      </button>
    </div>
  );
}
