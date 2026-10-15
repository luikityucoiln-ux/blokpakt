import { StrictMode } from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HelmetProvider } from '@dr.pogodin/react-helmet';
import { createMemoryRouter, Outlet, RouterProvider } from 'react-router';
import { beforeEach, expect, it, vi } from 'vitest';
import type { Session, User } from '@supabase/supabase-js';
import AuthProvider from '../AuthProvider';
import RouteErrorPage from '../RouteErrorPage';
import Header from '../../layouts/parts/Header';
import LoginPage from '../../pages/login';
import AuthCallbackPage from '../../pages/auth-callback';

const auth = vi.hoisted(() => ({
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
  signInWithOtp: vi.fn(),
  exchangeCodeForSession: vi.fn(),
  signOut: vi.fn(),
  unsubscribe: vi.fn(),
}));
vi.mock('../../lib/supabase-client', () => ({ getSupabaseClient: () => ({ auth }) }));

const account: User = { id: 'test-user', email: 'neighbor@example.com', aud: 'authenticated', created_at: '2026-10-15T00:00:00Z', app_metadata: {}, user_metadata: {} };
const session: Session = { user: account, access_token: 'test-access', refresh_token: 'test-refresh', token_type: 'bearer', expires_in: 3600 };

beforeEach(() => {
  vi.resetAllMocks();
  window.history.replaceState({}, '', '/login');
  auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
  auth.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: auth.unsubscribe } } });
  auth.signInWithOtp.mockResolvedValue({ data: {}, error: null });
  auth.signOut.mockResolvedValue({ error: null });
  auth.exchangeCodeForSession.mockResolvedValue({ data: { user: account, session }, error: null });
});

function show(path = '/login') {
  const router = createMemoryRouter([{
    element: <><Header /><Outlet /></>,
    errorElement: <RouteErrorPage />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/auth/callback', element: <AuthCallbackPage /> },
      { path: '/book', element: <p>Guest booking</p> },
      { path: '/broken', lazy: async () => { throw new Error('Importing a module script failed.'); } },
    ],
  }], { initialEntries: [path] });
  render(<StrictMode><HelmetProvider><AuthProvider><RouterProvider router={router} /></AuthProvider></HelmetProvider></StrictMode>);
  return router;
}

it('sends an email link with the current callback origin and never calls it a signed-in session', async () => {
  const user = userEvent.setup();
  show();
  const button = await screen.findByRole('button', { name: 'Email me a sign-in link' });
  await user.type(screen.getByLabelText('Email address'), 'Neighbor@Example.com');
  await user.click(button);
  expect(auth.signInWithOtp).toHaveBeenCalledExactlyOnceWith({
    email: 'neighbor@example.com',
    options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
  });
  expect(await screen.findByRole('heading', { name: 'Check your inbox' })).toBeVisible();
  expect(screen.getByText(/You are not signed in yet/)).toBeVisible();
  expect(screen.getByRole('link', { name: 'Log in' })).toBeVisible();
});

it('shows mail errors without displaying success and permits retry', async () => {
  auth.signInWithOtp.mockResolvedValueOnce({ error: new Error('Email rate limit exceeded') });
  const user = userEvent.setup();
  show();
  await user.type(screen.getByLabelText('Email address'), 'neighbor@example.com');
  await user.click(await screen.findByRole('button', { name: 'Email me a sign-in link' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Email rate limit exceeded');
  expect(screen.queryByText('Check your inbox')).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Email me a sign-in link' }));
  expect(await screen.findByText('Check your inbox')).toBeVisible();
});

it('shows initialization errors with a reload action while preserving guest access', async () => {
  const logger = vi.spyOn(console, 'error').mockImplementation(() => {});
  auth.getSession.mockRejectedValue(new Error('Session storage is unavailable'));
  try {
    show();
    expect(await screen.findByRole('alert')).toHaveTextContent('Session storage is unavailable');
    expect(screen.getByRole('button', { name: 'Reload sign-in' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Email me a sign-in link' })).toBeDisabled();
    expect(screen.getByRole('link', { name: 'Continue without signing in' })).toBeVisible();
    expect(logger).toHaveBeenCalled();
  } finally {
    logger.mockRestore();
  }
});

it('exchanges a callback once in StrictMode, removes its code, and signs out', async () => {
  window.history.replaceState({}, '', '/auth/callback?code=single-use-code&next=https://untrusted.example');
  const router = show('/auth/callback');
  expect(await screen.findByRole('heading', { name: "You're signed in" })).toBeVisible();
  expect(auth.exchangeCodeForSession).toHaveBeenCalledExactlyOnceWith('single-use-code');
  expect(window.location.search).toBe('');
  expect(router.state.location.pathname).toBe('/login');
  expect(screen.getByRole('link', { name: 'My account' })).toBeVisible();
  await userEvent.setup().click(screen.getByRole('button', { name: 'Sign out of this browser' }));
  expect(await screen.findByRole('heading', { name: 'Log in or get started' })).toBeVisible();
  expect(auth.signOut).toHaveBeenCalledExactlyOnceWith({ scope: 'local' });
});

it('recovers from expired and missing callback codes without redirecting to an account', async () => {
  window.history.replaceState({}, '', '/auth/callback#error=access_denied&error_description=expired');
  show('/auth/callback');
  expect(await screen.findByRole('alert')).toHaveTextContent(/missing, expired, or invalid/);
  expect(auth.exchangeCodeForSession).not.toHaveBeenCalled();
  expect(window.location.hash).toBe('');
  expect(screen.getByRole('link', { name: 'Request a new sign-in link' })).toHaveAttribute('href', '/login');
});

it('surfaces code-exchange errors rather than claiming successful sign-in', async () => {
  window.history.replaceState({}, '', '/auth/callback?code=expired-code');
  auth.exchangeCodeForSession.mockResolvedValue({ error: new Error('PKCE verifier missing'), data: {} });
  show('/auth/callback');
  expect(await screen.findByRole('alert')).toHaveTextContent('PKCE verifier missing');
  expect(auth.exchangeCodeForSession).toHaveBeenCalledTimes(1);
});

it('restores a session and retains account state if sign-out fails', async () => {
  auth.getSession.mockResolvedValue({ data: { session }, error: null });
  auth.signOut.mockResolvedValue({ error: new Error('Could not reach the sign-out service') });
  show();
  await userEvent.setup().click(await screen.findByRole('button', { name: 'Sign out of this browser' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Could not reach the sign-out service');
  expect(screen.getByRole('heading', { name: "You're signed in" })).toBeVisible();
});

it('keeps guest booking available and closes the mobile menu on login navigation', async () => {
  const user = userEvent.setup();
  const router = show('/book');
  await user.click(screen.getByRole('button', { name: 'Toggle menu' }));
  expect(screen.getByRole('button', { name: 'Toggle menu' })).toHaveAttribute('aria-expanded', 'true');
  await user.click(screen.getByRole('link', { name: 'Log in' }));
  expect(router.state.location.pathname).toBe('/login');
  expect(screen.getByRole('button', { name: 'Toggle menu' })).toHaveAttribute('aria-expanded', 'false');
  await user.click(screen.getByRole('link', { name: 'Continue without signing in' }));
  expect(router.state.location.pathname).toBe('/book');
});

it('uses branded recovery for failed lazy imports and logs the underlying error', async () => {
  const logger = vi.spyOn(console, 'error').mockImplementation(() => {});
  try {
    const router = show();
    await act(async () => { await router.navigate('/broken'); });
    expect(await screen.findByRole('heading', { name: "This page couldn't load" })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Reload page' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Back to home' })).toHaveAttribute('href', '/');
    await waitFor(() => expect(logger).toHaveBeenCalledWith('Page loading failed', expect.any(Error)));
  } finally {
    logger.mockRestore();
  }
});
