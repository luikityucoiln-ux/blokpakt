import { z } from 'zod';

const photoSchema = z.string().max(1_500_000).regex(/^data:image\/(?:jpeg|png|webp);base64,/).nullable();
const jobSchema = z.object({
  id: z.string(), code: z.string(), batchCode: z.string().nullable(),
  position: z.number().int().positive(),
  status: z.enum(['pending', 'en_route', 'arrived', 'in_progress', 'complete', 'disputed', 'cancelled']),
  service: z.string(), serviceIcon: z.string(), address: z.string(), zip: z.string(),
  gateCode: z.string().nullable(), propertyNotes: z.string(), scheduledWindow: z.string().nullable(),
  serviceDate: z.string(), providerName: z.string(), customerName: z.string(),
  customerEmail: z.string().nullable(), customerPhone: z.string().nullable(),
  payout: z.number().nonnegative(), estimatedDuration: z.string(),
  beforePhoto: photoSchema, afterPhoto: photoSchema,
  arrivedAt: z.string().nullable(), completedAt: z.string().nullable(),
  paymentIntentId: z.string().nullable(), checkoutSessionId: z.string().nullable(),
  createdAt: z.string(), acceptedAt: z.string().nullable(),
});

export type Job = z.infer<typeof jobSchema>;
export type JobStatus = Job['status'];
export type CreateJobInput = Omit<Job, 'position' | 'status' | 'payout' | 'estimatedDuration' | 'beforePhoto' | 'afterPhoto' | 'arrivedAt' | 'completedAt' | 'createdAt' | 'acceptedAt'> & { payoutCents: number };
export type JobUpdate = Partial<Pick<Job, 'status' | 'beforePhoto' | 'afterPhoto' | 'arrivedAt' | 'completedAt'>>;

const STORAGE_KEY = 'blokpakt:demo-jobs:v1';
let jobs: Job[] | undefined;
const jobListeners = new Set<(job: Job) => void>();

function seedJobs(): Job[] {
  return [112, 118, 124, 130].map((number, index) => ({
    id: `mock-job-${index + 1}`, code: `BLK-DEMO${index + 1}`, batchCode: 'MAPLE-2026',
    position: index + 1, status: 'pending', service: 'Lawn Care', serviceIcon: '🌱',
    address: `${number} Maple Ave`, zip: '62701', gateCode: null,
    propertyNotes: index === 0 ? 'Gate opens from the side path.' : '',
    scheduledWindow: '8am - 12pm', serviceDate: 'Demo day',
    providerName: 'Provider pending confirmation', customerName: `Demo customer ${index + 1}`,
    customerEmail: null, customerPhone: null, payout: 45, estimatedDuration: '30 min',
    beforePhoto: null, afterPhoto: null, arrivedAt: null, completedAt: null,
    paymentIntentId: null, checkoutSessionId: null, createdAt: new Date().toISOString(),
    acceptedAt: null,
  }));
}

function readJobs(): Job[] {
  if (typeof window === 'undefined') return seedJobs();
  if (!jobs) {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    jobs = raw ? z.array(jobSchema).parse(JSON.parse(raw)) : seedJobs();
  }
  return jobs;
}

function commit(next: Job[], changed: Job[]): void {
  if (typeof window === 'undefined') throw new Error('Demo jobs can only be changed in a browser.');
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  jobs = next;
  changed.forEach((job) => jobListeners.forEach((listener) => listener(job)));
}

export function normalizeStreet(address: string): string {
  return address.toLowerCase().trim().replace(/^\d+[a-z]?(?:-\d+)?\s+/, '')
    .replace(/[.,]/g, '').replace(/\b(street|avenue|road|drive|lane|court)\b/g,
      (word) => ({ street: 'st', avenue: 'ave', road: 'rd', drive: 'dr', lane: 'ln', court: 'ct' })[word]!)
    .replace(/\s+/g, ' ');
}

function groupingKey(job: Pick<Job, 'address' | 'zip' | 'service' | 'serviceDate' | 'scheduledWindow' | 'providerName'>): string {
  return JSON.stringify([normalizeStreet(job.address), job.zip.trim(), job.service, job.serviceDate, job.scheduledWindow, job.providerName]);
}

export async function createJob(input: CreateJobInput): Promise<Job> {
  const current = readJobs();
  const existing = current.find((job) => job.code === input.code);
  if (existing) return existing;
  if (!input.address.trim() || !input.serviceDate || !Number.isInteger(input.payoutCents) || input.payoutCents < 0) {
    throw new Error('A valid address, service date, and price are required.');
  }
  // Referral text never overrides street, service, date, or provider eligibility.
  const compatible = current.filter((job) => !job.acceptedAt && job.status === 'pending' && groupingKey(job) === groupingKey(input));
  const batchCode = compatible.find((candidate) => compatible.filter((job) => job.batchCode === candidate.batchCode).length < 6)?.batchCode;
  const job = jobSchema.parse({
    ...input, batchCode: batchCode ?? `ROUTE-${input.code}`,
    position: current.length + 1, status: 'pending', payout: input.payoutCents / 100,
    estimatedDuration: input.service === 'Gutter Cleaning' ? '90 min' : input.service === 'Pressure Washing' ? '90 min' : '30 min',
    beforePhoto: null, afterPhoto: null, arrivedAt: null, completedAt: null,
    acceptedAt: null, createdAt: new Date().toISOString(),
  });
  commit([...current, job], [job]);
  return job;
}

export async function getJobByCode(code: string): Promise<Job | null> {
  return readJobs().find((job) => job.code === code) ?? null;
}

export async function listJobsByBatchCode(batchCode: string): Promise<Job[]> {
  return readJobs().filter((job) => job.batchCode === batchCode);
}

export async function listActiveJobs(): Promise<Job[]> {
  return [...readJobs()].sort((a, b) => a.position - b.position);
}

export interface RouteBlock {
  code: string;
  street: string;
  service: string;
  scheduledWindow: string;
  homesBooked: number;
  payout: number;
  accepted: boolean;
}

export function routeBlocks(items: Job[]): RouteBlock[] {
  const groups = new Map<string, Job[]>();
  items.filter((job) => job.status !== 'cancelled').forEach((job) => {
    const key = job.batchCode ?? job.code;
    groups.set(key, [...(groups.get(key) ?? []), job]);
  });
  return [...groups].map(([code, members]) => ({
    code, street: members[0].address.replace(/^\d+[a-z]?(?:-\d+)?\s+/i, ''),
    service: members[0].service,
    scheduledWindow: `${members[0].serviceDate} · ${members[0].scheduledWindow ?? 'Flexible window'}`,
    homesBooked: members.length, payout: members.reduce((sum, job) => sum + job.payout, 0),
    accepted: members.every((job) => Boolean(job.acceptedAt)),
  }));
}

export async function acceptRouteBlock(code: string): Promise<void> {
  const current = readJobs();
  const members = current.filter((job) => (job.batchCode ?? job.code) === code);
  if (!members.length) throw new Error('Route block not found.');
  if (members.some((job) => job.acceptedAt || job.status !== 'pending')) throw new Error('This route is no longer available.');
  const acceptedAt = new Date().toISOString();
  const updated = members.map((job) => ({ ...job, acceptedAt, providerName: job.providerName === 'Provider pending confirmation' ? 'Marcus T.' : job.providerName }));
  commit(current.map((job) => updated.find((item) => item.id === job.id) ?? job), updated);
}

export async function updateJob(id: string, patch: JobUpdate): Promise<void> {
  const current = readJobs();
  const job = current.find((item) => item.id === id);
  if (!job) throw new Error('Job not found.');
  if (!job.acceptedAt) throw new Error('Accept the whole route before starting a job.');
  const next = current.find((item) => item.batchCode === job.batchCode && !['complete', 'cancelled'].includes(item.status));
  if (next?.id !== id) throw new Error('Complete the previous stop first.');
  const transitions: Record<JobStatus, JobStatus[]> = {
    pending: ['en_route', 'arrived'], en_route: ['arrived'], arrived: ['in_progress', 'complete'],
    in_progress: ['complete'], complete: [], disputed: [], cancelled: [],
  };
  if (patch.status && patch.status !== job.status && !transitions[job.status].includes(patch.status)) {
    throw new Error('This job status change is not allowed.');
  }
  if ((patch.beforePhoto || patch.afterPhoto) && !['arrived', 'in_progress'].includes(job.status)) {
    throw new Error('Arrive at the property before adding photos.');
  }
  const updated = jobSchema.parse({ ...job, ...patch });
  if (updated.status === 'complete' && (!updated.beforePhoto || !updated.afterPhoto)) {
    throw new Error('Before and after photos are required to complete a job.');
  }
  if (patch.status === 'arrived') updated.arrivedAt = new Date().toISOString();
  if (patch.status === 'complete') updated.completedAt = new Date().toISOString();
  commit(current.map((item) => item.id === id ? updated : item), [updated]);
}

export function subscribeToJobs(listener: (job: Job) => void): () => void {
  jobListeners.add(listener);
  return () => { jobListeners.delete(listener); };
}

export function subscribeToJob(code: string, listener: (job: Job) => void): () => void {
  return subscribeToJobs((job) => { if (job.code === code) listener(job); });
}
