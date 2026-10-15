import { z } from 'zod';
import { listActiveJobs } from './jobs';

const requestSchema = z.object({
  id: z.string(), jobId: z.string(), service: z.string(), description: z.string(),
  price: z.number().positive(), photo: z.string().nullable(),
  status: z.enum(['pending', 'approved', 'declined']), createdAt: z.string(),
});
export type AddOnRequest = z.infer<typeof requestSchema>;
const STORAGE_KEY = 'blokpakt:demo-addons:v1';
let requests: AddOnRequest[] | undefined;
const createListeners = new Set<(request: AddOnRequest) => void>();

export async function readAddOnRequests(): Promise<AddOnRequest[]> {
  if (!requests) {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    requests = raw ? z.array(requestSchema).parse(JSON.parse(raw)) : [];
  }
  return [...requests];
}

export async function createAddOnRequest(request: AddOnRequest): Promise<AddOnRequest> {
  const current = await readAddOnRequests();
  const job = (await listActiveJobs()).find((item) => item.id === request.jobId);
  if (!job || !['arrived', 'in_progress'].includes(job.status)) throw new Error('Add extras only after arriving at the property.');
  const validated = requestSchema.parse(request);
  if (validated.status !== 'pending') throw new Error('New extras require customer approval.');
  if (current.some((item) => item.id === request.id || (item.jobId === request.jobId && item.service === request.service && item.status !== 'declined'))) {
    throw new Error('This extra has already been requested.');
  }
  const next = [...current, validated];
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  requests = next;
  createListeners.forEach((listener) => listener(request));
  return validated;
}

export async function updateAddOnStatus(id: string, status: AddOnRequest['status']): Promise<void> {
  const current = await readAddOnRequests();
  const request = current.find((item) => item.id === id);
  if (!request || request.status !== 'pending' || status === 'pending') throw new Error('This extra is no longer pending.');
  const updated = { ...request, status };
  const next = current.map((item) => item.id === id ? updated : item);
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  requests = next;
  createListeners.forEach((listener) => listener(updated));
}

export function subscribeToAddOnRequests(listener: (request: AddOnRequest) => void): () => void {
  createListeners.add(listener);
  return () => createListeners.delete(listener);
}