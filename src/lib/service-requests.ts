import { z } from 'zod';
import { getSupabaseClient } from './supabase-client';

export const liveRequestsEnabled = import.meta.env.VITE_ENABLE_LIVE_REQUESTS === 'true';
export const US_STATES = 'AL AK AZ AR CA CO CT DE FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY DC'.split(' ');
export const requestStatuses = ['received', 'reviewing', 'confirmed', 'completed', 'declined', 'cancelled'] as const;
export const requestStatus = z.enum(requestStatuses);
export type RequestStatus = z.infer<typeof requestStatus>;
export const nextRequestStatuses: Record<RequestStatus, RequestStatus[]> = {
  received: ['reviewing', 'declined', 'cancelled'],
  reviewing: ['confirmed', 'declined', 'cancelled'],
  confirmed: ['completed', 'cancelled'],
  completed: [], declined: [], cancelled: [],
};

export const requestInput = z.object({
  service_id: z.string().min(1, 'Choose a service.'),
  full_name: z.string().trim().min(1, 'Enter your name.').max(150),
  phone: z.string().trim().max(40),
  address: z.string().trim().min(1, 'Enter a street address.').max(300),
  city: z.string().trim().min(1, 'Enter a city.').max(100),
  state_code: z.string().refine((value) => US_STATES.includes(value), 'Choose a US state or DC.'),
  postal_code: z.string().trim().regex(/^\d{5}(-\d{4})?$/, 'Enter a US ZIP code, such as 12345 or 12345-6789.'),
  availability: z.string().trim().max(300),
  details: z.string().trim().max(3000),
  contact_consent: z.literal(true, { errorMap: () => ({ message: 'Please allow us to contact you about this request.' }) }),
});
export type RequestInput = z.infer<typeof requestInput>;

const requestRecord = requestInput.omit({ contact_consent: true }).extend({
  id: z.string().uuid(),
  customer_id: z.string().uuid(),
  contact_email: z.string().email(),
  country_code: z.literal('US'),
  status: requestStatus,
  agreed_total_cents: z.number().int().min(1).max(100000000).nullable(),
  scheduled_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  customer_update: z.string(),
  version: z.number().int().positive(),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
});
export type ServiceRequest = z.infer<typeof requestRecord>;
const count = z.number().int().nonnegative();
const requestCounts = z.object({
  total: count, received: count, reviewing: count, confirmed: count,
  completed: count, declined: count, cancelled: count,
});
const columns = 'id,customer_id,service_id,full_name,contact_email,phone,address,city,state_code,postal_code,country_code,availability,details,status,agreed_total_cents,scheduled_date,customer_update,version,created_at,updated_at';
export const REQUEST_PAGE_SIZE = 20;

function decode<T>(result: { data: unknown; error: { message: string } | null }, schema: z.ZodType<T>): T {
  if (result.error) throw new Error(result.error.message);
  const parsed = schema.safeParse(result.data);
  if (!parsed.success) {
    console.error('Invalid service-request API response', parsed.error.issues.map(({ path, code }) => ({ path, code })));
    throw new Error('The service returned an unexpected response. Refresh or contact the operator.');
  }
  return parsed.data;
}

export function requestError(error: unknown): string {
  if (error instanceof z.ZodError) return error.issues[0].message;
  return error instanceof Error ? error.message : 'The request failed. Please try again.';
}

export async function loadRequestCatalog() {
  const client = await getSupabaseClient();
  const [settings, services] = await Promise.all([
    client.from('pilot_settings').select('intake_open').eq('id', true).single(),
    client.from('services').select('id,name').eq('active', true).order('name').limit(50),
  ]);
  return {
    open: decode(settings, z.object({ intake_open: z.boolean() })).intake_open,
    services: decode(services, z.array(z.object({ id: z.string(), name: z.string() }))),
  };
}

export async function submitRequest(input: RequestInput, key: string): Promise<ServiceRequest> {
  const parsed = requestInput.parse(input);
  const client = await getSupabaseClient();
  return decode(await client.rpc('submit_service_request', {
    p_key: z.string().uuid().parse(key), p_service_id: parsed.service_id,
    p_full_name: parsed.full_name, p_phone: parsed.phone, p_address: parsed.address,
    p_city: parsed.city, p_state_code: parsed.state_code, p_postal_code: parsed.postal_code,
    p_availability: parsed.availability, p_details: parsed.details, p_contact_consent: parsed.contact_consent,
  }), requestRecord);
}

export async function isPilotAdmin(): Promise<boolean> {
  return decode(await (await getSupabaseClient()).rpc('is_pilot_admin'), z.boolean());
}

export async function listRequests(page: number, status: RequestStatus | '', customerId?: string) {
  z.number().int().nonnegative().parse(page);
  const client = await getSupabaseClient();
  let query = client.from('service_requests').select(columns, { count: 'exact' });
  if (customerId) query = query.eq('customer_id', z.string().uuid().parse(customerId));
  if (status) query = query.eq('status', requestStatus.parse(status));
  const result = await query.order('created_at', { ascending: false }).order('id')
    .range(page * REQUEST_PAGE_SIZE, (page + 1) * REQUEST_PAGE_SIZE - 1);
  const rows = decode(result, z.array(requestRecord));
  return { rows, total: count.parse(result.count) };
}

export async function loadRequestCounts() {
  return decode(await (await getSupabaseClient()).rpc('pilot_request_counts'), requestCounts);
}

export async function cancelRequest(request: ServiceRequest) {
  return decode(await (await getSupabaseClient()).rpc('cancel_service_request', {
    p_id: request.id, p_version: request.version,
  }), requestRecord);
}

export function usdToCents(value: string): number {
  if (!/^\d+(\.\d{1,2})?$/.test(value)) throw new Error('Enter a positive USD amount with at most two decimal places.');
  const [dollars, cents = ''] = value.split('.');
  const total = Number(dollars) * 100 + Number(cents.padEnd(2, '0'));
  if (!Number.isSafeInteger(total) || total < 1 || total > 100000000) throw new Error('The agreed USD quote must be between $0.01 and $1,000,000.');
  return total;
}

export interface RequestUpdate {
  request: ServiceRequest;
  status: RequestStatus;
  note: string;
  total: string;
  date: string;
  agreed: boolean;
}

export async function updateRequest(update: RequestUpdate) {
  const confirming = update.status === 'confirmed';
  if (confirming && (!update.agreed || !/^\d{4}-\d{2}-\d{2}$/.test(update.date))) {
    throw new Error('Record the agreed service date and confirm customer agreement.');
  }
  return decode(await (await getSupabaseClient()).rpc('update_service_request', {
    p_id: update.request.id, p_version: update.request.version, p_status: update.status,
    p_update: z.string().trim().min(1).max(1000).parse(update.note),
    p_total_cents: confirming ? usdToCents(update.total) : null,
    p_scheduled_date: confirming ? update.date : null,
    p_customer_agreed: confirming && update.agreed,
  }), requestRecord);
}
