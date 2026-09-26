import { Component, type ErrorInfo, type ReactNode } from 'react';

interface AiroErrorBoundaryProps {
  children: ReactNode;
  captureGlobalErrors?: boolean;
}

interface AiroErrorBoundaryState {
  hasError: boolean;
}

export default class AiroErrorBoundary extends Component<AiroErrorBoundaryProps, AiroErrorBoundaryState> {
  state: AiroErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): AiroErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Application render failed', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-background px-6 text-center">
          <div className="max-w-sm">
            <img src="/assets/blokpakt-bp-mark.svg" alt="Blokpakt" className="mx-auto h-12 w-12" />
            <h1 className="mt-5 text-xl font-extrabold text-foreground">Unable to load Blokpakt</h1>
            <p className="mt-2 text-sm text-muted-foreground">Please refresh the page. If the problem continues, try again shortly.</p>
            <button type="button" onClick={() => window.location.reload()} className="mt-5 min-h-11 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90">
              Refresh page
            </button>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
