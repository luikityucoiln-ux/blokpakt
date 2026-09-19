import { supabase } from './supabase';

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
  city: string;
  zip: string;
  gateCode: string | null;
  propertyNotes: string;
  scheduledWindow: string | null;
  providerName: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  payout: number;
  scheduledDate: string | null;
  timeWindow: 'morning' | 'afternoon' | 'flexible' | null;
  flexibleSlot: boolean;
  estimatedDuration: string;
  beforePhoto: string | null;
  afterPhoto: string | null;
  arrivedAt: string | null;
  completedAt: string | null;
  paymentIntentId: string | null;
  checkoutSessionId: string | null;
  createdAt: string;
}

interface JobRow {
  id: string;
  code: string;
  batch_code: string | null;
  position: number;
  status: JobStatus;
  service: string;
  service_icon: string;
  address: string;
  city: string;
  zip: string;
  gate_code: string | null;
  property_notes: string;
  scheduled_window: string | null;
  provider_name: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  payout_cents: number;
  scheduled_date: string | null;
  time_window: 'morning' | 'afternoon' | 'flexible' | null;
  flexible_slot: boolean;
  estimated_duration: string;
  before_photo: string | null;
  after_photo: string | null;
  arrived_at: string | null;
  completed_at: string | null;
  payment_intent_id: string | null;
  checkout_session_id: string | null;
  created_at: string;
}

const JOB_COLUMNS =
  'id, code, batch_code, position, status, service, service_icon, address, city, zip, gate_code, property_notes, scheduled_window, provider_name, customer_name, customer_email, customer_phone, payout_cents, scheduled_date, time_window, flexible_slot, estimated_duration, before_photo, after_photo, arrived_at, completed_at, payment_intent_id, checkout_session_id, created_at';

function fromRow(row: JobRow): Job {
  return {
    id: row.id,
    code: row.code,
    batchCode: row.batch_code,
    position: row.position,
    status: row.status,
    service: row.service,
    serviceIcon: row.service_icon,
    address: row.address,
    city: row.city,
    zip: row.zip,
    gateCode: row.gate_code,
    propertyNotes: row.property_notes,
    scheduledWindow: row.scheduled_window,
    providerName: row.provider_name,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    customerPhone: row.customer_phone,
    payout: row.payout_cents / 100,
    scheduledDate: row.scheduled_date,
    timeWindow: row.time_window,
    flexibleSlot: row.flexible_slot,
    estimatedDuration: row.estimated_duration,
    beforePhoto: row.before_photo,
    afterPhoto: row.after_photo,
    arrivedAt: row.arrived_at,
    completedAt: row.completed_at,
    paymentIntentId: row.payment_intent_id,
    checkoutSessionId: row.checkout_session_id,
    createdAt: row.created_at,
  };
}

export interface CreateJobInput {
  id: string;
  code: string;
  batchCode: string | null;
  service: string;
  serviceIcon: string;
  address: string;
  city: string;
  zip: string;
  gateCode: string | null;
  propertyNotes: string;
  scheduledWindow: string | null;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  payoutCents: number;
  scheduledDate: string | null;
  timeWindow: 'morning' | 'afternoon' | 'flexible' | null;
  flexibleSlot: boolean;
  paymentIntentId: string | null;
  checkoutSessionId: string | null;
}

export async function createJob(input: CreateJobInput): Promise<Job> {
  if (!supabase) throw new Error('Supabase is not configured');
  const { data, error } = await supabase
    .from('jobs')
    .insert({
      id: input.id,
      code: input.code,
      batch_code: input.batchCode,
      service: input.service,
      service_icon: input.serviceIcon,
      address: input.address,
      city: input.city,
      zip: input.zip,
      gate_code: input.gateCode,
      property_notes: input.propertyNotes,
      scheduled_window: input.scheduledWindow,
      customer_name: input.customerName,
      customer_email: input.customerEmail,
      customer_phone: input.customerPhone,
      payout_cents: input.payoutCents,
      scheduled_date: input.scheduledDate,
      time_window: input.timeWindow,
      flexible_slot: input.flexibleSlot,
      payment_intent_id: input.paymentIntentId,
      checkout_session_id: input.checkoutSessionId,
    })
    .select(JOB_COLUMNS)
    .single();
  if (error) throw error;
  return fromRow(data as JobRow);
}

export async function getJobByCode(code: string): Promise<Job | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from('jobs').select(JOB_COLUMNS).eq('code', code).maybeSingle();
  if (error) throw error;
  return data ? fromRow(data as JobRow) : null;
}

export async function listJobsByBatchCode(batchCode: string): Promise<Job[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from('jobs').select(JOB_COLUMNS).eq('batch_code', batchCode);
  if (error) throw error;
  return (data as JobRow[]).map(fromRow);
}

export async function listActiveJobs(): Promise<Job[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from('jobs').select(JOB_COLUMNS).order('position', { ascending: true });
  if (error) throw error;
  return (data as JobRow[]).map(fromRow);
}

export interface JobUpdate {
  status?: JobStatus;
  beforePhoto?: string | null;
  afterPhoto?: string | null;
  arrivedAt?: string | null;
  completedAt?: string | null;
}

export async function updateJob(id: string, patch: JobUpdate): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured');
  const row: Record<string, unknown> = {};
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.beforePhoto !== undefined) row.before_photo = patch.beforePhoto;
  if (patch.afterPhoto !== undefined) row.after_photo = patch.afterPhoto;
  if (patch.arrivedAt !== undefined) row.arrived_at = patch.arrivedAt;
  if (patch.completedAt !== undefined) row.completed_at = patch.completedAt;
  const { error } = await supabase.from('jobs').update(row).eq('id', id);
  if (error) throw error;
}

export function subscribeToJobs(listener: (job: Job) => void): () => void {
  if (!supabase) return () => undefined;
  const client = supabase;
  const channel = client
    .channel('jobs-all')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, (payload) => {
      listener(fromRow(payload.new as JobRow));
    })
    .subscribe();
  return () => {
    void client.removeChannel(channel);
  };
}

export function subscribeToJob(code: string, listener: (job: Job) => void): () => void {
  if (!supabase) return () => undefined;
  const client = supabase;
  const channel = client
    .channel(`job-${code}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'jobs', filter: `code=eq.${code}` },
      (payload) => listener(fromRow(payload.new as JobRow)),
    )
    .subscribe();
  return () => {
    void client.removeChannel(channel);
  };
}
