import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StrictMode } from 'react';
import { expect, it, vi } from 'vitest';
import FeatureInterestPanel from '../FeatureInterestPanel';
import { featureMetrics, readDemoManagement } from '../../lib/demo-management';

it('measures visible buttons only after opt-in, deduplicates StrictMode effects, and explains unfinished features', async () => {
  const observers: MockObserver[] = [];
  class MockObserver implements globalThis.IntersectionObserver {
    root = null;
    rootMargin = '0px';
    scrollMargin = '0px';
    thresholds = [0.5];
    target: globalThis.Element | null = null;
    constructor(private callback: globalThis.IntersectionObserverCallback) { observers.push(this); }
    observe(target: globalThis.Element) { this.target = target; }
    unobserve() {}
    disconnect() {}
    takeRecords() { return []; }
    emit(ratio: number) {
      if (!this.target) throw new Error('Missing observed button');
      this.callback([{
        target: this.target, isIntersecting: ratio > 0, intersectionRatio: ratio, time: 0,
        boundingClientRect: new window.DOMRect(), intersectionRect: new window.DOMRect(), rootBounds: null,
      }], this);
    }
  }
  vi.stubGlobal('IntersectionObserver', MockObserver);
  try {
    const user = userEvent.setup();
    render(<StrictMode><FeatureInterestPanel /></StrictMode>);
    await screen.findByRole('button', { name: "I'm interested" });
    expect(observers).toHaveLength(0);
    await user.click(screen.getByRole('button', { name: "I'm interested" }));
    expect(screen.getByRole('dialog')).toHaveTextContent('This feature has not been built');
    expect(readDemoManagement().views).toHaveLength(0);
    await user.click(screen.getByRole('button', { name: 'Got it' }));
    await user.click(screen.getByRole('checkbox', { name: /Measure my demo views/ }));
    act(() => { observers.forEach((observer) => observer.emit(0.49)); });
    expect(readDemoManagement().views).toHaveLength(0);
    act(() => { observers.forEach((observer) => { observer.emit(0.5); observer.emit(1); }); });
    expect(readDemoManagement().views).toHaveLength(2);
    await user.click(screen.getByRole('button', { name: "I'm interested" }));
    expect(screen.getByRole('dialog')).toHaveTextContent('Your interest was recorded');
    expect(featureMetrics(readDemoManagement()).find((feature) => feature.id === 'recurring')).toMatchObject({ impressions: 1, clickedViews: 1, clicks: 1, ctr: 100 });
  } finally {
    vi.unstubAllGlobals();
  }
});
