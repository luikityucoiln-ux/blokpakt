import { Suspense } from 'react';
import { Outlet, createBrowserRouter } from 'react-router';
import AiroErrorBoundary from '../export-plugins/AiroErrorBoundary';
import RootLayout from './layouts/RootLayout';
import Spinner from './components/Spinner';
import { routes } from './routes';
import RouteErrorPage from './components/RouteErrorPage';

// Client-only: the SSR entry builds a static router without touching window.
export const router = createBrowserRouter([
  {
    errorElement: <RouteErrorPage />,
    element: (
      <AiroErrorBoundary captureGlobalErrors={false}>
        <Suspense fallback={<div className="flex justify-center py-8 h-screen items-center"><Spinner /></div>}>
          <RootLayout><Outlet /></RootLayout>
        </Suspense>
      </AiroErrorBoundary>
    ),
    children: routes,
  },
]);
