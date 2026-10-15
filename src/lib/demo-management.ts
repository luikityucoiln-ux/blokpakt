import { z } from 'zod';
import { SERVICES, PROVIDERS } from './marketplace-catalog';
import type { Job } from './jobs';

const applicationSchema = z.object({
  id: z.string(), name: z.string().trim().min(1).max(150), email: z.string().trim().email(),
  services: z.array(z.string()).min(1), zips: z.array(z.string()),
  status: z.enum(['pending', 'reviewed']), createdAt: z.string(),
});
const featureSchema = z.object({
  id: z.string(), name: z.string().trim().min(1).max(80),
  description: z.string().trim().min(1).max(300),
  buttonLabel: z.string().trim().min(1).max(40), active: z.boolean(),
});
const stateSchema = z.object({
  applications: z.array(applicationSchema),
  notes: z.record(z.object({ text: z.string().max(1000), followUp: z.boolean() })),
  features: z.array(featureSchema),
  measurementEnabled: z.boolean(),
  views: z.array(z.object({
    id: z.string(), featureId: z.string(), clicks: z.number().int().nonnegative(),
  })).max(1000),
});
export type DemoManagement = z.infer<typeof stateSchema>;
export type FeatureTest = z.infer<typeof featureSchema>;
export type ManagedRecord = {
  id: string; kind: 'bookings' | 'providers' | 'customers' | 'services';
  title: string; detail: string; status: string; href?: string; applicationId?: string;
};

const STORAGE_KEY = 'blokpakt:demo-management:v1';
let cached: DemoManagement | undefined;
const listeners = new Set<() => void>();

function initialState(): DemoManagement {
  return {
    applications: [], notes: {}, measurementEnabled: false, views: [],
    features: [
      { id: 'recurring', name: 'Recurring service plans', description: 'An idea for repeating neighborhood services. Not available to book.', buttonLabel: "I'm interested", active: true },
      { id: 'rescheduling', name: 'Self-service rescheduling', description: 'An idea for changing appointments online. This does not change any booking.', buttonLabel: 'Explore this idea', active: true },
    ],
  };
}

export function readDemoManagement(): DemoManagement {
  if (typeof window === 'undefined') throw new Error('Demo management is only available in a browser.');
  if (!cached) {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    cached = raw ? stateSchema.parse(JSON.parse(raw)) : initialState();
  }
  return cached;
}

function save(next: DemoManagement): void {
  const validated = stateSchema.parse(next);
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(validated));
  cached = validated;
  listeners.forEach((listener) => listener());
}

export function subscribeToDemoManagement(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function submitDemoApplication(input: { name: string; email: string; services: string[]; zips: string[] }): string {
  const state = readDemoManagement();
  if (input.services.some((id) => !SERVICES.some((service) => service.id === id))) {
    throw new Error('Please select supported services.');
  }
  const application = applicationSchema.parse({
    ...input, email: input.email.trim().toLowerCase(), id: window.crypto.randomUUID(),
    status: 'pending', createdAt: new Date().toISOString(),
  });
  if (state.applications.some((item) => item.email === application.email && item.status === 'pending')) {
    throw new Error('A demo application for this email is already awaiting review in Management.');
  }
  save({ ...state, applications: [...state.applications, application] });
  return application.id;
}

export function reviewDemoApplication(id: string): void {
  const state = readDemoManagement();
  if (!state.applications.some((item) => item.id === id)) throw new Error('Application not found.');
  save({ ...state, applications: state.applications.map((item) => item.id === id ? { ...item, status: 'reviewed' } : item) });
}

export function saveRecordNote(recordId: string, text: string, followUp: boolean): void {
  if (!/^(booking|provider|application|customer|service):/.test(recordId)) throw new Error('Invalid record reference.');
  const state = readDemoManagement();
  save({ ...state, notes: { ...state.notes, [recordId]: { text: text.trim(), followUp } } });
}

export function createFeatureTest(input: Pick<FeatureTest, 'name' | 'description' | 'buttonLabel'>): void {
  const state = readDemoManagement();
  const feature = featureSchema.parse({ ...input, id: window.crypto.randomUUID(), active: true });
  if (state.features.some((item) => item.name.toLowerCase() === feature.name.toLowerCase())) throw new Error('A feature test with this name already exists.');
  save({ ...state, features: [...state.features, feature] });
}

export function setFeatureActive(id: string, active: boolean): void {
  const state = readDemoManagement();
  if (!state.features.some((item) => item.id === id)) throw new Error('Feature test not found.');
  save({ ...state, features: state.features.map((item) => item.id === id ? { ...item, active } : item) });
}

export function setDemoMeasurement(enabled: boolean): void {
  save({ ...readDemoManagement(), measurementEnabled: enabled });
}

export function clearDemoMeasurements(): void {
  save({ ...readDemoManagement(), views: [] });
}

export function recordFeatureInteraction(featureId: string, viewId: string, kind: 'impression' | 'click'): boolean {
  const state = readDemoManagement();
  const feature = state.features.find((item) => item.id === featureId);
  if (!feature) throw new Error('Feature test not found.');
  if (!state.measurementEnabled || !feature.active) return false;
  const existing = state.views.find((view) => view.featureId === featureId && view.id === viewId);
  if (existing && kind === 'impression') return false;
  if (!existing && state.views.length >= 1000) throw new Error('Demo measurement limit reached. Clear demo metrics in Management to continue.');
  const views = existing
    ? state.views.map((view) => view === existing ? { ...view, clicks: view.clicks + 1 } : view)
    : [...state.views, { id: viewId, featureId, clicks: kind === 'click' ? 1 : 0 }];
  save({ ...state, views });
  return true;
}

export function featureMetrics(state: DemoManagement) {
  return state.features.map((feature) => {
    const views = state.views.filter((view) => view.featureId === feature.id);
    const clickedViews = views.filter((view) => view.clicks > 0).length;
    return {
      ...feature, impressions: views.length, clickedViews,
      clicks: views.reduce((sum, view) => sum + view.clicks, 0),
      ctr: views.length ? clickedViews / views.length * 100 : null,
    };
  }).sort((a, b) => b.clickedViews - a.clickedViews || b.clicks - a.clicks || a.name.localeCompare(b.name));
}

export function managementRecords(jobs: Job[], state: DemoManagement): ManagedRecord[] {
  const customers = new Map<string, { name: string; count: number }>();
  jobs.forEach((job) => {
    const key = job.customerEmail?.trim().toLowerCase() || `${job.customerName.trim().toLowerCase()}|${job.address.trim().toLowerCase()}`;
    const existing = customers.get(key);
    customers.set(key, { name: job.customerName, count: (existing?.count ?? 0) + 1 });
  });
  return [
    ...jobs.map((job): ManagedRecord => ({
      id: `booking:${job.id}`, kind: 'bookings', title: `${job.code} · ${job.service}`,
      detail: `${job.customerName} · ${job.address} · ${job.serviceDate}`, status: job.status,
      href: `/track?code=${encodeURIComponent(job.code)}`,
    })),
    ...PROVIDERS.map((provider): ManagedRecord => ({
      id: `provider:${provider.id}`, kind: 'providers', title: provider.name,
      detail: `${provider.publicId} · ${provider.services.length} services`, status: 'sample provider',
    })),
    ...state.applications.map((application): ManagedRecord => ({
      id: `application:${application.id}`, kind: 'providers', title: application.name,
      detail: `${application.email} · ${application.services.join(', ')}`,
      status: application.status, applicationId: application.id,
    })),
    ...[...customers].map(([key, customer]): ManagedRecord => ({
      id: `customer:${key}`, kind: 'customers', title: customer.name,
      detail: `${customer.count} booking${customer.count === 1 ? '' : 's'}`, status: 'derived contact',
    })),
    ...SERVICES.map((service): ManagedRecord => ({
      id: `service:${service.id}`, kind: 'services', title: service.label,
      detail: `${jobs.filter((job) => job.service === service.label).length} bookings · $${service.batchPrice} demo batch price`,
      status: 'demo catalog',
    })),
  ];
}
