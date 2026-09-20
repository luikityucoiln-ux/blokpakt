export interface AddOnRequest {
  id: string;
  jobId: string;
  service: string;
  description: string;
  price: number;
  photo: string | null;
  status: 'pending' | 'approved' | 'declined';
  createdAt: string;
}

let requests: AddOnRequest[] = [];
const insertListeners = new Set<(request: AddOnRequest) => void>();
const statusListeners = new Set<(request: AddOnRequest) => void>();

export async function readAddOnRequests(): Promise<AddOnRequest[]> {
  return [...requests];
}

export async function listAddOnRequestsForJob(jobId: string): Promise<AddOnRequest[]> {
  return requests.filter((request) => request.jobId === jobId);
}

export async function createAddOnRequest(request: AddOnRequest): Promise<AddOnRequest> {
  requests = [...requests, request];
  insertListeners.forEach((listener) => listener(request));
  return request;
}

export async function updateAddOnStatus(id: string, status: AddOnRequest['status']): Promise<void> {
  const request = requests.find((item) => item.id === id);
  if (!request) throw new Error('Add-on request not found');
  const updated = { ...request, status };
  requests = requests.map((item) => item.id === id ? updated : item);
  statusListeners.forEach((listener) => listener(updated));
}

export async function deleteAddOnRequest(id: string): Promise<void> {
  requests = requests.filter((request) => request.id !== id);
}

export function subscribeToAddOnRequests(listener: (request: AddOnRequest) => void): () => void {
  insertListeners.add(listener);
  return () => insertListeners.delete(listener);
}

export function subscribeToAddOnStatusChanges(listener: (request: AddOnRequest) => void): () => void {
  statusListeners.add(listener);
  return () => statusListeners.delete(listener);
}
