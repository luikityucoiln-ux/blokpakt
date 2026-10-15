import { RouteObject } from 'react-router';
import HomePage from './pages/index';
import LoginPage from './pages/login';
import AuthCallbackPage from './pages/auth-callback';
import { liveRequestsEnabled } from './lib/service-requests';
// Eager import so renderToString doesn't hit a Suspense boundary on 404 routes
// and abort to client rendering. The prod 404 page is tiny; the dev-tools
// variant stays lazy because it pulls in dev-only code we don't want in
// production bundles.
import ProdNotFoundPage from './pages/_404';

const NotFoundPage = ProdNotFoundPage;

export const routes: RouteObject[] = [
  { path: '/login', element: <LoginPage /> },
  { path: '/auth/callback', element: <AuthCallbackPage /> },
  { path: '/request-service', lazy: async () => ({ Component: (await import('./pages/request-service')).default }) },
  { path: '/requests', lazy: async () => ({ Component: (await import('./pages/requests')).default }) },
  { path: '/ops', lazy: async () => ({ Component: (await import('./pages/ops')).default }) },
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/book',
    lazy: async () => ({ Component: liveRequestsEnabled ? (await import('./pages/request-service')).default : (await import('./pages/book')).default }),
  },
  {
    path: '/batch/:code',
    lazy: async () => ({ Component: (await import('./pages/batch')).default }),
  },
  {
    path: '/track',
    lazy: async () => ({ Component: liveRequestsEnabled ? (await import('./pages/requests')).default : (await import('./pages/track')).default }),
  },
  {
    path: '/join',
    lazy: async () => ({ Component: (await import('./pages/join')).default }),
  },
  {
    path: '/checkout/success',
    lazy: async () => ({ Component: (await import('./pages/checkout/success')).default }),
  },
  {
    path: '/checkout/cancel',
    lazy: async () => ({ Component: (await import('./pages/checkout/cancel')).default }),
  },
  {
    path: '/field',
    lazy: async () => ({ Component: (await import('./pages/field')).default }),
  },
  {
    path: '/admin',
    lazy: async () => ({ Component: liveRequestsEnabled ? (await import('./pages/ops')).default : (await import('./pages/admin')).default }),
  },
  {
    path: '/legal',
    lazy: async () => ({ Component: (await import('./pages/legal')).default }),
  },
  {
    path: '/faq',
    lazy: async () => ({ Component: (await import('./pages/faq')).default }),
  },
  {
    path: '/our-story',
    lazy: async () => ({ Component: (await import('./pages/our-story')).default }),
  },
  {
    path: '/completed',
    lazy: async () => ({ Component: (await import('./pages/completed')).default }),
  },
  {
    path: '/products',
    lazy: async () => ({ Component: (await import('./pages/Products')).default }),
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
];

// Types for type-safe navigation
export type Path =
  | '/'
  | '/login'
  | '/auth/callback'
  | '/request-service'
  | '/requests'
  | '/ops'
  | '/book'
  | '/batch/:code'
  | '/track'
  | '/join'
  | '/checkout/success'
  | '/checkout/cancel'
  | '/field'
  | '/admin'
  | '/legal'
  | '/faq'
  | '/our-story'
  | '/completed'
  | '/products';

export type Params = Record<string, string | undefined>;
