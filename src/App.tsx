import { lazy, Suspense, useEffect, useState } from 'react';
import { RouterProvider } from 'react-router/dom';

import CookieBannerErrorBoundary from '@/components/CookieBannerErrorBoundary';
import { router } from './app-router';

const CookieBanner = lazy(() =>
  import('@/components/CookieBanner').catch((error) => {
    console.warn('Failed to load CookieBanner:', error);
    return { default: () => null };
  })
);

export default function App() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  return (
    <>
      <RouterProvider router={router} />
      {/* Match the server tree on the first render, before adding browser-only UI. */}
      {mounted && <CookieBannerErrorBoundary>
        <Suspense fallback={null}>
          <CookieBanner />
        </Suspense>
      </CookieBannerErrorBoundary>}
    </>
  );
}
