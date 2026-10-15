import { beforeEach, expect, it, vi } from 'vitest';
import { requestInput, submitRequest, usdToCents, updateRequest, isPilotAdmin, type ServiceRequest } from '../service-requests';

const rpc = vi.hoisted(() => vi.fn());
vi.mock('../supabase-client', () => ({ getSupabaseClient: async () => ({ rpc }) }));
const input = {
  service_id: 'lawn', full_name: 'Customer', phone: '', address: '1 Example Street',
  city: 'Austin', state_code: 'TX', postal_code: '78701', availability: '', details: '', contact_consent: true as const,
};
const record: ServiceRequest = {
  ...input, id: '22000000-0000-4000-8000-000000000001', customer_id: '11000000-0000-4000-8000-000000000001',
  contact_email: 'customer@example.test', country_code: 'US', status: 'reviewing',
  agreed_total_cents: null, scheduled_date: null, customer_update: '', version: 1,
  created_at: '2026-10-15T12:00:00Z', updated_at: '2026-10-15T12:00:00Z',
};
beforeEach(() => { vi.resetAllMocks(); });

it('normalizes required fields and rejects missing consent, invalid states and ZIPs', () => {
  expect(requestInput.parse({ ...input, full_name: '  Customer  ' }).full_name).toBe('Customer');
  for (const invalid of [{ contact_consent: false }, { state_code: 'XX' }, { postal_code: 'abcde' }, { full_name: '   ' }]) {
    expect(requestInput.safeParse({ ...input, ...invalid }).success).toBe(false);
  }
  expect(requestInput.safeParse({ ...input, postal_code: '78701-1234' }).success).toBe(true);
});

it('submits only allowed fields and passes an idempotency key, not a client identity or price', async () => {
  rpc.mockResolvedValue({ data: record, error: null });
  await submitRequest({ ...input, full_name: ' Customer ' }, record.id);
  const [name, args] = rpc.mock.calls[0];
  expect(name).toBe('submit_service_request');
  expect(args).toEqual({
    p_key: record.id, p_service_id: 'lawn', p_full_name: 'Customer', p_phone: '',
    p_address: '1 Example Street', p_city: 'Austin', p_state_code: 'TX',
    p_postal_code: '78701', p_availability: '', p_details: '', p_contact_consent: true,
  });
});

it('does not substitute a demo record when the API fails or returns an invalid shape', async () => {
  rpc.mockResolvedValueOnce({ data: null, error: { message: 'New service requests are paused.' } });
  await expect(submitRequest(input, record.id)).rejects.toThrow('paused');
  const logger = vi.spyOn(console, 'error').mockImplementation(() => {});
  try {
    rpc.mockResolvedValueOnce({ data: {}, error: null });
    await expect(submitRequest(input, record.id)).rejects.toThrow('unexpected response');
    expect(logger).toHaveBeenCalled();
  } finally { logger.mockRestore(); }
});

it('validates exact USD cent amounts without rounding excess decimals', () => {
  expect(usdToCents('12.34')).toBe(1234);
  expect(usdToCents('0.01')).toBe(1);
  expect(usdToCents('1000000')).toBe(100000000);
  for (const value of ['0', '-1', '1.999', '1e3', 'NaN', '1000000.01']) {
    expect(() => usdToCents(value)).toThrow();
  }
});

it('requires customer agreement before confirmation and sends the expected version', async () => {
  const update = { request: record, status: 'confirmed' as const, note: 'Agreed by phone', total: '45.10', date: '2026-11-01', agreed: false };
  await expect(updateRequest(update)).rejects.toThrow('agreement');
  expect(rpc).not.toHaveBeenCalled();
  rpc.mockResolvedValue({ data: record, error: null });
  await updateRequest({ ...update, agreed: true });
  expect(rpc).toHaveBeenCalledWith('update_service_request', {
    p_id: record.id, p_version: 1, p_status: 'confirmed', p_update: 'Agreed by phone',
    p_total_cents: 4510, p_scheduled_date: '2026-11-01', p_customer_agreed: true,
  });
});

it('gets operator authorization from the API and surfaces failures', async () => {
  rpc.mockResolvedValueOnce({ data: false, error: null });
  expect(await isPilotAdmin()).toBe(false);
  rpc.mockResolvedValueOnce({ data: null, error: { message: 'Permission check failed' } });
  await expect(isPilotAdmin()).rejects.toThrow('Permission check failed');
});
