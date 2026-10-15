import { beforeEach, describe, expect, it, vi } from 'vitest';

beforeEach(() => {
  window.sessionStorage.clear();
  vi.resetModules();
  vi.restoreAllMocks();
});

describe('demo feature interest', () => {
  it('starts with zero measurements and requires explicit opt-in', async () => {
    const store = await import('../demo-management');
    expect(store.recordFeatureInteraction('recurring', 'view-1', 'click')).toBe(false);
    expect(store.featureMetrics(store.readDemoManagement()).find((item) => item.id === 'recurring')).toMatchObject({ impressions: 0, clicks: 0, ctr: null });
    store.setDemoMeasurement(true);
    store.recordFeatureInteraction('recurring', 'view-1', 'impression');
    store.recordFeatureInteraction('recurring', 'view-1', 'impression');
    store.recordFeatureInteraction('recurring', 'view-1', 'click');
    store.recordFeatureInteraction('recurring', 'view-1', 'click');
    store.recordFeatureInteraction('recurring', 'view-2', 'impression');
    expect(store.featureMetrics(store.readDemoManagement()).find((item) => item.id === 'recurring')).toMatchObject({
      impressions: 2, clickedViews: 1, clicks: 2, ctr: 50,
    });
  });

  it('counts a click before the observer callback as one visible view', async () => {
    const store = await import('../demo-management');
    store.setDemoMeasurement(true);
    store.recordFeatureInteraction('recurring', 'fast-click', 'click');
    store.recordFeatureInteraction('recurring', 'fast-click', 'impression');
    expect(store.featureMetrics(store.readDemoManagement()).find((item) => item.id === 'recurring')).toMatchObject({ impressions: 1, clickedViews: 1, clicks: 1, ctr: 100 });
  });

  it('stops measurement when paused or opted out without deleting prior counts', async () => {
    const store = await import('../demo-management');
    store.setDemoMeasurement(true);
    store.recordFeatureInteraction('recurring', 'view-1', 'click');
    store.setFeatureActive('recurring', false);
    expect(store.recordFeatureInteraction('recurring', 'view-2', 'click')).toBe(false);
    store.setFeatureActive('recurring', true);
    store.setDemoMeasurement(false);
    expect(store.recordFeatureInteraction('recurring', 'view-3', 'impression')).toBe(false);
    expect(store.readDemoManagement().views).toHaveLength(1);
  });

  it('persists tests, preferences and counters; clearing metrics keeps notes and ideas', async () => {
    let store = await import('../demo-management');
    store.createFeatureTest({ name: 'New idea', description: 'Not available', buttonLabel: 'Explore' });
    store.saveRecordNote('service:lawn', 'Check the scope', true);
    store.setDemoMeasurement(true);
    store.recordFeatureInteraction('recurring', 'view-1', 'click');
    vi.resetModules();
    store = await import('../demo-management');
    expect(store.readDemoManagement().measurementEnabled).toBe(true);
    expect(store.readDemoManagement().views).toHaveLength(1);
    store.clearDemoMeasurements();
    expect(store.readDemoManagement().features).toHaveLength(3);
    expect(store.readDemoManagement().notes['service:lawn'].followUp).toBe(true);
    expect(store.readDemoManagement().views).toHaveLength(0);
  });

  it('validates test names and reports unknown records rather than succeeding', async () => {
    const store = await import('../demo-management');
    expect(() => store.createFeatureTest({ name: ' ', description: 'x', buttonLabel: 'x' })).toThrow();
    expect(() => store.createFeatureTest({ name: 'Recurring service plans', description: 'x', buttonLabel: 'x' })).toThrow('already exists');
    expect(() => store.setFeatureActive('missing', false)).toThrow('not found');
    expect(() => store.recordFeatureInteraction('missing', 'view', 'click')).toThrow('not found');
  });

  it('surfaces storage failure without changing counters or notifying subscribers', async () => {
    const store = await import('../demo-management');
    store.setDemoMeasurement(true);
    const listener = vi.fn();
    store.subscribeToDemoManagement(listener);
    vi.spyOn(window.Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Storage full'); });
    expect(() => store.recordFeatureInteraction('recurring', 'view-1', 'click')).toThrow('Storage full');
    expect(store.readDemoManagement().views).toHaveLength(0);
    expect(listener).not.toHaveBeenCalled();
  });

  it('surfaces corrupt data without overwriting it with empty metrics', async () => {
    window.sessionStorage.setItem('blokpakt:demo-management:v1', '{"views":"broken"}');
    const store = await import('../demo-management');
    expect(() => store.readDemoManagement()).toThrow();
  });

  it('keeps the 1,000-view limit explicit without losing existing measurements', async () => {
    let store = await import('../demo-management');
    window.sessionStorage.setItem('blokpakt:demo-management:v1', JSON.stringify({
      ...store.readDemoManagement(), measurementEnabled: true,
      views: Array.from({ length: 1000 }, (_, index) => ({ id: `view-${index}`, featureId: 'recurring', clicks: 0 })),
    }));
    vi.resetModules();
    store = await import('../demo-management');
    expect(() => store.recordFeatureInteraction('recurring', 'extra-view', 'impression')).toThrow('limit reached');
    store.recordFeatureInteraction('recurring', 'view-0', 'click');
    expect(store.readDemoManagement().views).toHaveLength(1000);
    expect(store.featureMetrics(store.readDemoManagement()).find((feature) => feature.id === 'recurring')).toMatchObject({ clickedViews: 1, ctr: 0.1 });
  });
});

describe('managed demo records', () => {
  it('records application intake, prevents pending duplicates and persists review decisions', async () => {
    let store = await import('../demo-management');
    const application = { name: 'Demo Provider', email: 'TEST@example.com ', services: ['lawn'], zips: [] };
    const id = store.submitDemoApplication(application);
    expect(store.readDemoManagement().applications[0]).toMatchObject({ id, email: 'test@example.com', status: 'pending' });
    expect(() => store.submitDemoApplication(application)).toThrow('already awaiting review');
    expect(() => store.submitDemoApplication({ ...application, services: ['unknown'] })).toThrow('supported services');
    store.reviewDemoApplication(id);
    vi.resetModules();
    store = await import('../demo-management');
    expect(store.readDemoManagement().applications[0].status).toBe('reviewed');
    expect(() => store.reviewDemoApplication('unknown')).toThrow('not found');
  });

  it('derives all four lists from shared data with consistent contact grouping', async () => {
    const store = await import('../demo-management');
    const { listActiveJobs } = await import('../jobs');
    const jobs = await listActiveJobs();
    jobs[0] = { ...jobs[0], customerEmail: 'Person@Example.com' };
    jobs[1] = { ...jobs[1], customerEmail: 'person@example.com' };
    store.submitDemoApplication({ name: 'Applicant', email: 'new@example.com', services: ['lawn'], zips: [] });
    const records = store.managementRecords(jobs, store.readDemoManagement());
    expect(records.filter((record) => record.kind === 'bookings')).toHaveLength(4);
    expect(records.filter((record) => record.kind === 'providers')).toHaveLength(4);
    expect(records.filter((record) => record.kind === 'customers')).toHaveLength(3);
    expect(records.filter((record) => record.kind === 'services')).toHaveLength(4);
    expect(records.find((record) => record.id === 'service:lawn')?.detail).toContain('4 bookings');
  });
});
