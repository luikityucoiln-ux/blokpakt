import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CreateJobInput } from '../jobs';

const photo = 'data:image/png;base64,aGVsbG8=';
const input = (code: string, overrides: Partial<CreateJobInput> = {}): CreateJobInput => ({
  id: `job-${code}`, code, batchCode: null, service: 'Lawn Care', serviceIcon: 'L',
  address: '20 Oak Street', zip: '62701', gateCode: null, propertyNotes: '',
  scheduledWindow: '8am - 12pm', serviceDate: '2026-11-01',
  customerName: 'Demo', customerEmail: null, customerPhone: null,
  providerName: 'Provider pending confirmation', payoutCents: 4500,
  paymentIntentId: null, checkoutSessionId: null, ...overrides,
});

beforeEach(() => {
  window.sessionStorage.clear();
  vi.resetModules();
  vi.restoreAllMocks();
});

describe('connected demo jobs', () => {
  it('groups normalized streets and splits blocks at exactly six stops', async () => {
    const store = await import('../jobs');
    for (let i = 0; i < 8; i++) {
      await store.createJob(input(`NEW-${i}`, { address: `${20 + i} Oak ${i % 2 ? 'St.' : 'Street'}` }));
    }
    const blocks = store.routeBlocks((await store.listActiveJobs()).filter((job) => job.code.startsWith('NEW-')));
    expect(blocks.map((block) => block.homesBooked)).toEqual([6, 2]);
    expect(blocks.map((block) => block.payout)).toEqual([270, 90]);
  });

  it.each([
    { address: '10 Pine Street' }, { zip: '62702' }, { service: 'Gutter Cleaning' },
    { serviceDate: '2026-11-02' }, { scheduledWindow: '12pm - 4pm' }, { providerName: 'Priya S.' },
  ])('never groups incompatible jobs, even with a matching referral: %j', async (override) => {
    const store = await import('../jobs');
    const first = await store.createJob(input('FIRST'));
    const second = await store.createJob(input('SECOND', { ...override, batchCode: first.batchCode }));
    expect(first.batchCode).not.toBe(second.batchCode);
  });

  it('accepts all stops atomically and prevents new jobs entering a claimed block', async () => {
    const store = await import('../jobs');
    const first = await store.createJob(input('FIRST'));
    await store.createJob(input('SECOND'));
    await store.acceptRouteBlock(first.batchCode!);
    const members = await store.listJobsByBatchCode(first.batchCode!);
    expect(members).toHaveLength(2);
    expect(members.every((job) => job.acceptedAt && job.providerName === 'Marcus T.')).toBe(true);
    expect(new Set(members.map((job) => job.acceptedAt)).size).toBe(1);
    await expect(store.acceptRouteBlock(first.batchCode!)).rejects.toThrow('no longer available');
    const third = await store.createJob(input('THIRD'));
    expect(third.batchCode).not.toBe(first.batchCode);
  });

  it('requires route acceptance, stop order, arrival and both photos', async () => {
    const store = await import('../jobs');
    await expect(store.updateJob('mock-job-1', { status: 'arrived' })).rejects.toThrow('whole route');
    await store.acceptRouteBlock('MAPLE-2026');
    await expect(store.updateJob('mock-job-2', { status: 'arrived' })).rejects.toThrow('previous stop');
    await expect(store.updateJob('mock-job-1', { beforePhoto: photo })).rejects.toThrow('Arrive');
    await expect(store.updateJob('mock-job-1', { status: 'complete' })).rejects.toThrow('not allowed');
    await store.updateJob('mock-job-1', { status: 'arrived' });
    await expect(store.updateJob('mock-job-1', { status: 'complete' })).rejects.toThrow('Before and after');
    await store.updateJob('mock-job-1', { beforePhoto: photo });
    await expect(store.updateJob('mock-job-1', { status: 'complete' })).rejects.toThrow('Before and after');
    await store.updateJob('mock-job-1', { afterPhoto: photo });
    await store.updateJob('mock-job-1', { status: 'complete' });
    expect(await store.getJobByCode('BLK-DEMO1')).toMatchObject({ status: 'complete', beforePhoto: photo, afterPhoto: photo, completedAt: expect.any(String) });
    await store.updateJob('mock-job-2', { status: 'arrived' });
  });

  it('persists bookings and progress across a module reload and creates only once', async () => {
    let store = await import('../jobs');
    await store.createJob(input('SAVED'));
    await store.createJob(input('SAVED'));
    expect((await store.listActiveJobs()).filter((job) => job.code === 'SAVED')).toHaveLength(1);
    await store.acceptRouteBlock('MAPLE-2026');
    await store.updateJob('mock-job-1', { status: 'arrived' });
    vi.resetModules();
    store = await import('../jobs');
    expect(await store.getJobByCode('SAVED')).toMatchObject({ address: '20 Oak Street' });
    expect(await store.getJobByCode('BLK-DEMO1')).toMatchObject({ status: 'arrived', acceptedAt: expect.any(String) });
    expect(await store.getJobByCode('UNKNOWN')).toBeNull();
  });

  it('does not publish or mutate state when browser storage rejects a save', async () => {
    const store = await import('../jobs');
    const listener = vi.fn();
    store.subscribeToJobs(listener);
    const storage = vi.spyOn(window.Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Storage full'); });
    await expect(store.acceptRouteBlock('MAPLE-2026')).rejects.toThrow('Storage full');
    storage.mockRestore();
    expect(listener).not.toHaveBeenCalled();
    expect((await store.listActiveJobs()).every((job) => !job.acceptedAt)).toBe(true);
  });

  it('surfaces corrupt stored data instead of silently replacing it with fixtures', async () => {
    window.sessionStorage.setItem('blokpakt:demo-jobs:v1', '{"broken":true}');
    const store = await import('../jobs');
    await expect(store.listActiveJobs()).rejects.toThrow();
  });

  it('notifies only the matching booking and supports unsubscribe', async () => {
    const store = await import('../jobs');
    const listener = vi.fn();
    const unsubscribe = store.subscribeToJob('BLK-DEMO1', listener);
    await store.acceptRouteBlock('MAPLE-2026');
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
    await store.updateJob('mock-job-1', { status: 'arrived' });
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
