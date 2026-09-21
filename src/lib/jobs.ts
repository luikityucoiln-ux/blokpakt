export type JobStatus = 'pending' | 'en_route' | 'arrived' | 'in_progress' | 'complete' | 'disputed' | 'cancelled';

export interface Job {
  id: string;
  code: string;
  batchCode: string | null;
  position: number;
  status: JobStatus;
  service: string;
  serviceIcon: string;
  address: string;
  zip: string;
  gateCode: string | null;
  propertyNotes: string;
  scheduledWindow: string | null;
  providerName: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  payout: number;
  estimatedDuration: string;
  beforePhoto: string | null;
  afterPhoto: string | null;
  arrivedAt: string | null;
  completedAt: string | null;
  paymentIntentId: string | null;
  checkoutSessionId: string | null;
  createdAt: string;
}

export interface CreateJobInput {
  id: string;
  code: string;
  batchCode: string | null;
  service: string;
  serviceIcon: string;
  address: string;
  zip: string;
  gateCode: string | null;
  propertyNotes: string;
  scheduledWindow: string | null;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  providerName: string;
  payoutCents: number;
  paymentIntentId: string | null;
  checkoutSessionId: string | null;
}

export interface JobUpdate {
  status?: JobStatus;
  beforePhoto?: string | null;
  afterPhoto?: string | null;
  arrivedAt?: string | null;
  completedAt?: string | null;
}

const now = new Date().toISOString();
let jobs: Job[] = [
  {
    id: 'mock-job-1', code: 'BLK-DEMO1', batchCode: 'MAPLE-2026', position: 1, status: 'en_route', service: 'Lawn Care', serviceIcon: '🌱',
    address: '112 Maple Ave', zip: '62701', gateCode: null, propertyNotes: 'Gate opens from the side path.', scheduledWindow: '8am - 12pm',
    providerName: 'Marcus T.', customerName: 'Alex Johnson', customerEmail: 'alex@example.com', customerPhone: '(312) 555-0100', payout: 45, estimatedDuration: '30 min',
    beforePhoto: null, afterPhoto: null, arrivedAt: null, completedAt: null, paymentIntentId: null, checkoutSessionId: null, createdAt: now,
  },
  {
    id: 'mock-job-2', code: 'BLK-DEMO2', batchCode: 'MAPLE-2026', position: 2, status: 'pending', service: 'Gutter Cleaning', serviceIcon: '🍂',
    address: '247 Oak St', zip: '62701', gateCode: null, propertyNotes: '', scheduledWindow: '12pm - 4pm',
    providerName: 'Devon R.', customerName: 'Taylor Morgan', customerEmail: 'taylor@example.com', customerPhone: '(312) 555-0112', payout: 162, estimatedDuration: '90 min',
    beforePhoto: null, afterPhoto: null, arrivedAt: null, completedAt: null, paymentIntentId: null, checkoutSessionId: null, createdAt: now,
  },
];

const jobListeners = new Set<(job: Job) => void>();

function publish(job: Job): void {
  jobListeners.forEach((listener) => listener(job));
}

export async function createJob(input: CreateJobInput): Promise<Job> {
  const job: Job = {
    ...input,
    position: jobs.length + 1,
    status: 'pending',
    payout: input.payoutCents / 100,
    estimatedDuration: '30 min',
    beforePhoto: null,
    afterPhoto: null,
    arrivedAt: null,
    completedAt: null,
    createdAt: new Date().toISOString(),
  };
  jobs = [...jobs.filter((item) => item.id !== job.id), job];
  publish(job);
  return job;
}

export async function getJobByCode(code: string): Promise<Job | null> {
  return jobs.find((job) => job.code === code) ?? null;
}

export async function listJobsByBatchCode(batchCode: string): Promise<Job[]> {
  return jobs.filter((job) => job.batchCode === batchCode);
}

export async function listActiveJobs(): Promise<Job[]> {
  return [...jobs].sort((first, second) => first.position - second.position);
}

export async function updateJob(id: string, patch: JobUpdate): Promise<void> {
  const index = jobs.findIndex((job) => job.id === id);
  if (index === -1) throw new Error('Job not found');
  const updated = { ...jobs[index], ...patch };
  jobs = jobs.map((job) => job.id === id ? updated : job);
  publish(updated);
}

export function subscribeToJobs(listener: (job: Job) => void): () => void {
  jobListeners.add(listener);
  return () => jobListeners.delete(listener);
}

export function subscribeToJob(code: string, listener: (job: Job) => void): () => void {
  return subscribeToJobs((job) => {
    if (job.code === code) listener(job);
  });
}
