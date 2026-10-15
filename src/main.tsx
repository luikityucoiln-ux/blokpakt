import './lib/i18n';
import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { HelmetProvider } from '@dr.pogodin/react-helmet';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AiroErrorBoundary from '../export-plugins/AiroErrorBoundary';
import App from './App';
import { router } from './app-router';
import AuthProvider from './components/AuthProvider';
import './styles/globals.css';

if (import.meta.env.MODE === 'development') {
  const meta = document.createElement('meta');
  meta.name = 'robots';
  meta.content = 'noindex, nofollow';
  document.head.appendChild(meta);
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: { retry: 0 },
  },
});

const rootElement = document.getElementById('app');
if (!rootElement) throw new Error('Root element not found');

const providers = (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider><App /></AuthProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

// Root-level dev error boundary. The inner boundary in App.tsx lives
// inside the route element (so it can catch route render errors before
// React Router swaps in its own error UI), which leaves everything
// OUTSIDE the router uncaught: provider crashes, errors in App itself,
// and render errors in components mounted as siblings of <RouterProvider>
// (e.g. an analytics loader calling useLocation() outside the router).
// Those throw on first render before the inner boundary ever mounts, so
// only an ancestor boundary above the providers can catch them. This
// boundary also owns the global window.onerror/unhandledrejection
// handlers (the inner one opts out via captureGlobalErrors={false}).
const tree = (
  <StrictMode>
    <AiroErrorBoundary>{providers}</AiroErrorBoundary>
  </StrictMode>
);

// SSR markup is detected via a child element inside the #app root. hydrateRoot
// reattaches to the server-rendered tree; createRoot mounts fresh for dev/
// pre-SSR fallback.
function mount(element: HTMLElement) {
  if (element.firstElementChild && !router.state.errors) {
    hydrateRoot(element, tree);
  } else {
    element.replaceChildren();
    createRoot(element).render(tree);
  }
}

// Resolve the matched page module before hydrating its server-rendered markup.
if (router.state.initialized) {
  mount(rootElement);
} else {
  const unsubscribe = router.subscribe((state) => {
    if (state.initialized) {
      unsubscribe();
      mount(rootElement);
    }
  });
}
