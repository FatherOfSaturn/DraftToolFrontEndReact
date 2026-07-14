import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { triggerPackMergeAndSwap } = vi.hoisted(() => ({
  triggerPackMergeAndSwap: vi.fn(),
}));

vi.mock('../api/gameApi', () => ({
  gameApi: { triggerPackMergeAndSwap },
}));

import { usePackMergePoller } from './usePackMergePoller';

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((nextResolve) => {
    resolve = nextResolve;
  });
  return { promise, resolve };
}

describe('usePackMergePoller', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    triggerPackMergeAndSwap.mockReset();
  });

  afterEach(() => vi.useRealTimers());

  it('does not overlap slow polls', async () => {
    const first = deferred<null>();
    triggerPackMergeAndSwap.mockReturnValueOnce(first.promise).mockResolvedValue(null);

    renderHook(() => usePackMergePoller({ gameID: 'game-1', active: true, intervalMs: 1000, onMerged: vi.fn() }));
    expect(triggerPackMergeAndSwap).toHaveBeenCalledTimes(1);

    await act(() => vi.advanceTimersByTimeAsync(3000));
    expect(triggerPackMergeAndSwap).toHaveBeenCalledTimes(1);

    await act(async () => first.resolve(null));
    await act(() => vi.advanceTimersByTimeAsync(1000));
    expect(triggerPackMergeAndSwap).toHaveBeenCalledTimes(2);
  });

  it('announces a merged game only once', async () => {
    const onMerged = vi.fn();
    triggerPackMergeAndSwap.mockResolvedValue({ gameID: 'game-1', gameState: 'GAME_MERGED' });

    renderHook(() => usePackMergePoller({ gameID: 'game-1', active: true, intervalMs: 1000, onMerged }));
    await act(() => vi.advanceTimersByTimeAsync(3000));

    expect(onMerged).toHaveBeenCalledTimes(1);
    expect(triggerPackMergeAndSwap).toHaveBeenCalledTimes(1);
  });
});
