import { RouteObject } from 'react-router';
import { lazy } from 'react';
import HomePage from './pages/index';
import BookPage from './pages/book';
import CartPage from './pages/cart';
import TrackPage from './pages/track';
import JoinPage from './pages/join';
import CheckoutSuccess from './pages/checkout/success';
import CheckoutCancel from './pages/checkout/cancel';
import FieldPage from './pages/field';
import AdminPage from './pages/admin';
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
    path: '/track',
    element: <TrackPage />,
  },
  {
    path: '/cart',
    element: <CartPage />,
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
    path: '*',
    element: <NotFoundPage />,
  },
];

// Types for type-safe navigation
export type Path = '/' | '/book' | '/cart' | '/track' | '/join' | '/checkout/success' | '/checkout/cancel';

export type Params = Record<string, string | undefined>;
