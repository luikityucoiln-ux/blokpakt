import { RouteObject } from 'react-router';
import HomePage from './pages/index';
import BookPage from './pages/book';
import TrackPage from './pages/track';
import JoinPage from './pages/join';
import CheckoutSuccess from './pages/checkout/success';
import CheckoutCancel from './pages/checkout/cancel';
import FieldPage from './pages/field';
import AdminPage from './pages/admin';
import LegalPage from './pages/legal';
import FaqPage from './pages/faq';
import BatchPage from './pages/batch';
// Eager import so renderToString doesn't hit a Suspense boundary on 404 routes
// and abort to client rendering. The prod 404 page is tiny; the dev-tools
// variant stays lazy because it pulls in dev-only code we don't want in
// production bundles.
import ProdNotFoundPage from './pages/_404';

const NotFoundPage = ProdNotFoundPage;

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/book',
    element: <BookPage />,
  },
  {
    path: '/batch/:code',
    element: <BatchPage />,
  },
  {
    path: '/track',
    element: <TrackPage />,
  },
  {
    path: '/join',
    element: <JoinPage />,
  },
  {
    path: '/checkout/success',
    element: <CheckoutSuccess />,
  },
  {
    path: '/checkout/cancel',
    element: <CheckoutCancel />,
  },
  {
    path: '/field',
    element: <FieldPage />,
  },
  {
    path: '/admin',
    element: <AdminPage />,
  },
  {
    path: '/legal',
    element: <LegalPage />,
  },
  {
    path: '/faq',
    element: <FaqPage />,
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
];

// Types for type-safe navigation
export type Path = '/' | '/book' | '/batch/:code' | '/track' | '/join' | '/checkout/success' | '/checkout/cancel' | '/legal' | '/faq';

export type Params = Record<string, string | undefined>;
