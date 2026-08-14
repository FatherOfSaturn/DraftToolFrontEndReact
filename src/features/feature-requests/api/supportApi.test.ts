import { beforeEach, describe, expect, it, vi } from 'vitest';
import { normalizeSupportRequest, supportApi } from './supportApi';
import type { SupportRequest } from './supportApi';

const { requestJsonMock, requestVoidMock } = vi.hoisted(() => ({
  requestJsonMock: vi.fn(),
  requestVoidMock: vi.fn(),
}));

vi.mock('../../../shared/api/httpClient', () => ({
  requestJson: requestJsonMock,
  requestVoid: requestVoidMock,
}));

type RawOverrides = Omit<Partial<SupportRequest>, 'status' | 'type'> & {
  status?: string;
  type?: string;
};

function rawRequest(overrides: RawOverrides = {}): SupportRequest {
  return {
    id: '1',
    title: 'Test ticket',
    description: 'Details',
    contactEmail: 'a@b.com',
    priority: 'LOW',
    accountID: null,
    status: 'NEW',
    type: 'BUG_FIX',
    createdOnDate: '2024-01-01T00:00:00Z',
    lastStatusChangeDate: '2024-01-01T00:00:00Z',
    ...overrides,
  } as SupportRequest;
}

describe('normalizeSupportRequest', () => {
  it('lowercases status, type, and priority from the backend enum names', () => {
    const normalized = normalizeSupportRequest(rawRequest({ status: 'IN_PROGRESS', type: 'NEW_FEATURE', priority: 'HIGH' }));
    expect(normalized).toMatchObject({
      status: 'in_progress',
      type: 'new_feature',
      priority: 'high',
    });
  });

  it('passes through already-lowercase values unchanged', () => {
    const normalized = normalizeSupportRequest(rawRequest({ status: 'deleted', type: 'misc_support', priority: 'critical' }));
    expect(normalized).toMatchObject({
      status: 'deleted',
      type: 'misc_support',
      priority: 'critical',
    });
  });
});

describe('supportApi', () => {
  beforeEach(() => {
    requestJsonMock.mockReset();
    requestVoidMock.mockReset();
  });

  it('normalizes every request returned by getAll', async () => {
    requestJsonMock.mockResolvedValue([
      rawRequest({ id: '1', status: 'BLOCKED', type: 'BUG_FIX' }),
      rawRequest({ id: '2', status: 'COMPLETED', type: 'NEW_FEATURE' }),
    ]);
    const result = await supportApi.getAll();
    expect(requestJsonMock).toHaveBeenCalledWith('/support/');
    expect(result.map((r) => r.status)).toEqual(['blocked', 'completed']);
    expect(result.map((r) => r.type)).toEqual(['bug_fix', 'new_feature']);
  });

  it('fetches the public backlog from /support/public', async () => {
    requestJsonMock.mockResolvedValue([
      rawRequest({ id: '7', status: 'COMPLETED', type: 'NEW_FEATURE' }),
    ]);
    const result = await supportApi.getPublic();
    expect(requestJsonMock).toHaveBeenCalledWith('/support/public');
    expect(result.map((r) => r.id)).toEqual(['7']);
    expect(result[0].status).toBe('completed');
  });

  it('PATCHes the status to the update endpoint and normalizes the response', async () => {
    requestJsonMock.mockResolvedValue(rawRequest({ status: 'COMPLETED' }));
    const result = await supportApi.updateStatus('1', 'completed');
    expect(requestJsonMock).toHaveBeenCalledWith('/support/1/status', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'completed' }),
    });
    expect(result.status).toBe('completed');
  });

  it('DELETEs by id', async () => {
    await supportApi.delete('42');
    expect(requestVoidMock).toHaveBeenCalledWith('/support/42', { method: 'DELETE' });
  });
});
