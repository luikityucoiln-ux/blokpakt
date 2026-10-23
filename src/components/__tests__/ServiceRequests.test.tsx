import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router';
import { HelmetProvider } from '@dr.pogodin/react-helmet';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import RequestServicePage from '../../pages/request-service';
import RequestsPage from '../../pages/requests';
import OperationsPage from '../../pages/ops';
import type { ReactNode } from 'react';
import type { ServiceRequest } from '../../lib/service-requests';

const api = vi.hoisted(() => ({
  loadRequestCatalog: vi.fn(), submitRequest: vi.fn(), listRequests: vi.fn(),
  isPilotAdmin: vi.fn(), loadRequestCounts: vi.fn(), cancelRequest: vi.fn(), updateRequest: vi.fn(),
}));
const auth = vi.hoisted(() => ({ signedIn: true, id: '11000000-0000-4000-8000-000000000001' }));
vi.mock('../../hooks/use-auth', () => ({ useAuth: () => ({
  user: auth.signedIn ? { id: auth.id, email: 'customer@example.test' } : null,
  status: auth.signedIn ? 'signed-in' : 'signed-out', error: '',
}) }));
vi.mock('../../lib/service-requests', async (importOriginal) => ({
  ...await importOriginal<typeof import('../../lib/service-requests')>(), ...api,
}));
const record: ServiceRequest = {
  id: '22000000-0000-4000-8000-000000000001', customer_id: auth.id,
  service_id: 'lawn', full_name: 'Customer', contact_email: 'customer@example.test',
  phone: '', address: '1 Example Street', city: 'Austin', state_code: 'TX', postal_code: '78701',
  country_code: 'US', availability: '', details: '', status: 'received', agreed_total_cents: null,
  scheduled_date: null, customer_update: '', version: 1, created_at: '2026-10-15T12:00:00Z', updated_at: '2026-10-15T12:00:00Z',
};
beforeEach(() => {
  vi.resetAllMocks();
  auth.signedIn = true;
  auth.id = record.customer_id;
  api.loadRequestCatalog.mockResolvedValue({ open: true, services: [{ id: 'lawn', name: 'Lawn Care' }] });
  api.submitRequest.mockResolvedValue(record);
  api.listRequests.mockResolvedValue({ rows: [record], total: 1 });
  api.isPilotAdmin.mockResolvedValue(true);
  api.loadRequestCounts.mockResolvedValue({ total: 1, received: 1, reviewing: 0, confirmed: 0, completed: 0, declined: 0, cancelled: 0 });
  api.cancelRequest.mockResolvedValue({ ...record, status: 'cancelled' });
  api.updateRequest.mockResolvedValue({ ...record, status: 'reviewing', version: 2 });
});
function show(element: ReactNode) {
  const cache = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  function Wrapper({ children }: { children: ReactNode }) {
    return <HelmetProvider><QueryClientProvider client={cache}><MemoryRouter>{children}</MemoryRouter></QueryClientProvider></HelmetProvider>;
  }
  return render(element, { wrapper: Wrapper });
}
async function fillRequest() {
  const user = userEvent.setup();
  await user.selectOptions(await screen.findByLabelText('Service'), 'lawn');
  await user.type(screen.getByLabelText('Full name'), 'Customer');
  await user.type(screen.getByLabelText('Street address'), '1 Example Street');
  await user.type(screen.getByLabelText('City'), 'Austin');
  await user.selectOptions(screen.getByLabelText('State / DC'), 'TX');
  await user.type(screen.getByLabelText('ZIP code'), '78701');
  await user.click(screen.getByRole('checkbox'));
  return user;
}

it('requires sign-in before loading private requests or a request form', async () => {
  auth.signedIn = false;
  show(<RequestServicePage />);
  expect(screen.getByRole('link', { name: 'Log in with email' })).toHaveAttribute('href', '/login');
  expect(api.loadRequestCatalog).not.toHaveBeenCalled();
  expect(api.listRequests).not.toHaveBeenCalled();
});

it('shows paused intake without displaying an order form', async () => {
  api.loadRequestCatalog.mockResolvedValue({ open: false, services: [] });
  show(<RequestServicePage />);
  expect(await screen.findByText('New requests are not open yet')).toBeVisible();
  expect(screen.queryByRole('button', { name: 'Submit service request' })).not.toBeInTheDocument();
});

it('submits real input and distinguishes a received request from a confirmed booking', async () => {
  show(<RequestServicePage />);
  const user = await fillRequest();
  await user.click(screen.getByRole('button', { name: 'Submit service request' }));
  expect(await screen.findByText('Your request was received')).toBeVisible();
  expect(screen.getByText(/This is not yet a confirmed booking/)).toBeVisible();
  expect(api.submitRequest).toHaveBeenCalledTimes(1);
  expect(api.submitRequest.mock.calls[0][0]).toMatchObject({ state_code: 'TX', contact_consent: true });
  expect(screen.getByText(/We have not charged you/)).toBeVisible();
});

it('reuses a submission reference after a failure and does not claim success', async () => {
  api.submitRequest.mockRejectedValueOnce(new Error('Connection lost'));
  show(<RequestServicePage />);
  const user = await fillRequest();
  await user.click(screen.getByRole('button', { name: 'Submit service request' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Connection lost');
  expect(screen.queryByText('Your request was received')).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Submit service request' }));
  await screen.findByText('Your request was received');
  expect(api.submitRequest.mock.calls[0][1]).toBe(api.submitRequest.mock.calls[1][1]);
});

it('denies non-admin accounts without fetching all-customer data or counts', async () => {
  api.isPilotAdmin.mockResolvedValue(false);
  show(<OperationsPage />);
  expect(await screen.findByText('Administrator access required')).toBeVisible();
  expect(api.listRequests).not.toHaveBeenCalled();
  expect(api.loadRequestCounts).not.toHaveBeenCalled();
});

it('keeps operator sign-in ahead of private records in the styled workspace', () => {
  auth.signedIn = false;
  show(<OperationsPage />);
  expect(screen.getByRole('heading', { level: 1, name: 'Service request management' })).toBeVisible();
  expect(screen.getByText('Operator workspace')).toBeVisible();
  expect(screen.getByRole('link', { name: 'Log in with email' })).toHaveAttribute('href', '/login');
  expect(api.isPilotAdmin).not.toHaveBeenCalled();
  expect(api.listRequests).not.toHaveBeenCalled();
  expect(api.loadRequestCounts).not.toHaveBeenCalled();
});

it('filters customer requests by signed-in identity and confirms before cancellation', async () => {
  show(<RequestsPage />);
  const button = await screen.findByRole('button', { name: 'Cancel request' });
  expect(api.listRequests).toHaveBeenCalledWith(0, '', record.customer_id);
  const confirmation = vi.spyOn(window, 'confirm').mockReturnValue(false);
  try {
    await userEvent.setup().click(button);
    expect(api.cancelRequest).not.toHaveBeenCalled();
    confirmation.mockReturnValue(true);
    await userEvent.setup().click(button);
    await waitFor(() => expect(api.cancelRequest).toHaveBeenCalledWith(record));
  } finally { confirmation.mockRestore(); }
});

it('shows persisted dashboard counts and saves a customer-visible operator update', async () => {
  show(<OperationsPage />);
  expect(await screen.findByRole('region', { name: 'Request counts' })).toHaveTextContent('received');
  expect(await screen.findByText(/1 new request/)).toBeVisible();
  await userEvent.setup().type(screen.getByLabelText('Update visible to the customer'), 'Checking local coverage.');
  await userEvent.setup().click(screen.getByRole('button', { name: 'Save customer update' }));
  await waitFor(() => expect(api.updateRequest).toHaveBeenCalledWith(expect.objectContaining({ status: 'reviewing', note: 'Checking local coverage.', request: record })));
});

it('does not show demo or stale customer records after a fetch error', async () => {
  api.listRequests.mockRejectedValue(new Error('Access denied'));
  show(<RequestsPage />);
  expect(await screen.findByRole('alert')).toHaveTextContent('Access denied');
  expect(screen.queryByText(/1 Example Street/)).not.toBeInTheDocument();
});

it('removes private records on sign-out and does not reuse them for another account', async () => {
  const view = show(<RequestsPage />);
  await screen.findByText(/1 Example Street/);
  auth.signedIn = false;
  view.rerender(<RequestsPage />);
  expect(screen.queryByText(/1 Example Street/)).not.toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Log in with email' })).toBeVisible();
  auth.id = '11000000-0000-4000-8000-000000000002';
  auth.signedIn = true;
  api.listRequests.mockResolvedValue({ rows: [], total: 0 });
  view.rerender(<RequestsPage />);
  expect(await screen.findByText('No requests on this page.')).toBeVisible();
  expect(screen.queryByText(/1 Example Street/)).not.toBeInTheDocument();
  expect(api.listRequests).toHaveBeenLastCalledWith(0, '', auth.id);
});
