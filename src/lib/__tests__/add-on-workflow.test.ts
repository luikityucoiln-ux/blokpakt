import { beforeEach, expect, it, vi } from 'vitest';
import type { AddOnRequest } from '../add-on-workflow';

beforeEach(() => {
  window.sessionStorage.clear();
  vi.resetModules();
});

it('requires arrival and customer approval, persists decisions and publishes updates', async () => {
  const jobs = await import('../jobs');
  let extras = await import('../add-on-workflow');
  const request: AddOnRequest = {
    id: 'extra-1', jobId: 'mock-job-1', service: 'Walkway wash', description: '',
    price: 40, photo: null, status: 'pending', createdAt: new Date().toISOString(),
  };
  await expect(extras.createAddOnRequest(request)).rejects.toThrow('after arriving');
  await jobs.acceptRouteBlock('MAPLE-2026');
  await jobs.updateJob('mock-job-1', { status: 'arrived' });
  await expect(extras.createAddOnRequest({ ...request, status: 'approved' })).rejects.toThrow('customer approval');
  await extras.createAddOnRequest(request);
  await expect(extras.createAddOnRequest(request)).rejects.toThrow('already been requested');
  const listener = vi.fn();
  extras.subscribeToAddOnRequests(listener);
  await extras.updateAddOnStatus(request.id, 'approved');
  expect(listener).toHaveBeenCalledWith({ ...request, status: 'approved' });
  await expect(extras.updateAddOnStatus(request.id, 'declined')).rejects.toThrow('no longer pending');
  vi.resetModules();
  extras = await import('../add-on-workflow');
  expect(await extras.readAddOnRequests()).toEqual([{ ...request, status: 'approved' }]);
});

it('rejects missing add-ons instead of reporting success', async () => {
  const extras = await import('../add-on-workflow');
  await expect(extras.updateAddOnStatus('missing', 'approved')).rejects.toThrow('no longer pending');
});
