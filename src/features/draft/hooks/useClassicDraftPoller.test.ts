import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { draftCheck } = vi.hoisted(() => ({
  draftCheck: vi.fn(),
}));

vi.mock('../api/classicGameApi', () => ({
  classicGameApi: { draftCheck },
}));

import { useClassicDraftPoller } from './useClassicDraftPoller';

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((nextResolve) => {
    resolve = nextResolve;
  });
  return { promise, resolve };
}

describe('useClassicDraftPoller', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    draftCheck.mockReset();
  });

  afterEach(() => vi.useRealTimers());

  it('does not overlap slow polls', async () => {
    const first = deferred<{ canDraft: boolean; gameState: string }>();
    draftCheck.mockReturnValueOnce(first.promise).mockResolvedValue({ canDraft: false, gameState: 'GAME_STARTED' });

    renderHook(() =>
      useClassicDraftPoller({ gameID: 'game-1', playerName: 'Alice', active: true, intervalMs: 1000, onCanDraft: vi.fn(), onComplete: vi.fn() })
    );
    expect(draftCheck).toHaveBeenCalledTimes(1);

    await act(() => vi.advanceTimersByTimeAsync(3000));
    expect(draftCheck).toHaveBeenCalledTimes(1);

    await act(async () => first.resolve({ canDraft: false, gameState: 'GAME_STARTED' }));
    await act(() => vi.advanceTimersByTimeAsync(1000));
    expect(draftCheck).toHaveBeenCalledTimes(2);
  });

  it('announces a completed game only once and stops polling', async () => {
    const onComplete = vi.fn();
    draftCheck.mockResolvedValue({ canDraft: false, gameState: 'GAME_COMPLETE' });

    renderHook(() =>
      useClassicDraftPoller({ gameID: 'game-1', playerName: 'Alice', active: true, intervalMs: 1000, onCanDraft: vi.fn(), onComplete })
    );
    await act(() => vi.advanceTimersByTimeAsync(3000));

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(draftCheck).toHaveBeenCalledTimes(1);
  });

  it('calls onCanDraft when a pack becomes available', async () => {
    const onCanDraft = vi.fn();
    draftCheck.mockResolvedValue({ canDraft: true, gameState: 'GAME_STARTED' });

    renderHook(() =>
      useClassicDraftPoller({ gameID: 'game-1', playerName: 'Alice', active: true, intervalMs: 1000, onCanDraft, onComplete: vi.fn() })
    );
    await act(() => vi.advanceTimersByTimeAsync(2000));

    expect(onCanDraft).toHaveBeenCalled();
  });

  it('does not poll while inactive', async () => {
    renderHook(() =>
      useClassicDraftPoller({ gameID: 'game-1', playerName: 'Alice', active: false, intervalMs: 1000, onCanDraft: vi.fn(), onComplete: vi.fn() })
    );
    await act(() => vi.advanceTimersByTimeAsync(3000));

    expect(draftCheck).not.toHaveBeenCalled();
  });
});
