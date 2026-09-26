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
const createListeners = new Set<(request: AddOnRequest) => void>();

export async function readAddOnRequests(): Promise<AddOnRequest[]> {
  return [...requests];
}

export async function createAddOnRequest(request: AddOnRequest): Promise<AddOnRequest> {
  requests = [...requests, request];
  createListeners.forEach((listener) => listener(request));
  return request;
}

export async function updateAddOnStatus(id: string, status: AddOnRequest['status']): Promise<void> {
  requests = requests.map((request) => request.id === id ? { ...request, status } : request);
}

export function subscribeToAddOnRequests(listener: (request: AddOnRequest) => void): () => void {
  createListeners.add(listener);
  return () => createListeners.delete(listener);
}