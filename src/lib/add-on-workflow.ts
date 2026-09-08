import { supabase } from './supabase';

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

interface AddOnRow {
  id: string;
  job_id: string;
  service_title: string;
  description: string;
  price_cents: number;
  photo_data: string | null;
  status: AddOnRequest['status'];
  created_at: string;
}

function fromRow(row: AddOnRow): AddOnRequest {
  return { id: row.id, jobId: row.job_id, service: row.service_title, description: row.description, price: row.price_cents / 100, photo: row.photo_data, status: row.status, createdAt: row.created_at };
}

export async function readAddOnRequests(): Promise<AddOnRequest[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from('addon_requests').select('id, job_id, service_title, description, price_cents, photo_data, status, created_at').order('created_at', { ascending: true });
  if (error) throw error;
  return (data as AddOnRow[]).map(fromRow);
}

export async function createAddOnRequest(request: AddOnRequest): Promise<AddOnRequest> {
  if (!supabase) throw new Error('Supabase is not configured');
  const { data, error } = await supabase.from('addon_requests').insert({ id: request.id, job_id: request.jobId, service_title: request.service, description: request.description, price_cents: Math.round(request.price * 100), photo_data: request.photo, status: request.status, created_at: request.createdAt }).select('id, job_id, service_title, description, price_cents, photo_data, status, created_at').single();
  if (error) throw error;
  return fromRow(data as AddOnRow);
}

export async function updateAddOnStatus(id: string, status: AddOnRequest['status']): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured');
  const { error } = await supabase.from('addon_requests').update({ status }).eq('id', id);
  if (error) throw error;
}

export function subscribeToAddOnRequests(listener: (request: AddOnRequest) => void): () => void {
  if (!supabase) return () => undefined;
  const channel = supabase.channel('addon-requests').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'addon_requests' }, (payload) => listener(fromRow(payload.new as AddOnRow))).subscribe();
  return () => { void supabase.removeChannel(channel); };
}