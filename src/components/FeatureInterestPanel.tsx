import { useEffect, useRef, useState } from 'react';
import { useDemoManagement } from '../hooks/use-demo-management';
import { recordFeatureInteraction, setDemoMeasurement, type FeatureTest } from '../lib/demo-management';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';

function FeatureButton({ feature, enabled, onOpen, onError }: {
  feature: FeatureTest; enabled: boolean;
  onOpen: (feature: FeatureTest, recorded: boolean) => void; onError: (message: string) => void;
}) {
  const button = useRef<HTMLButtonElement>(null);
  const viewId = useRef('');
  useEffect(() => {
    if (!viewId.current) viewId.current = window.crypto.randomUUID();
    if (!enabled || !button.current) return;
    if (!window.IntersectionObserver) {
      onError('Automatic view measurement is unavailable in this browser. Clicks still record their visible view.');
      return;
    }
    const observer = new window.IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting && entry.intersectionRatio >= 0.5)) return;
      try {
        recordFeatureInteraction(feature.id, viewId.current, 'impression');
        observer.disconnect();
      } catch (error) {
        onError(error instanceof Error ? error.message : 'Could not record this demo view.');
        observer.disconnect();
      }
    }, { threshold: 0.5 });
    observer.observe(button.current);
    return () => observer.disconnect();
  }, [feature.id, enabled, onError]);

  return <button ref={button} type="button" onClick={() => {
    try {
      if (!viewId.current) viewId.current = window.crypto.randomUUID();
      const recorded = recordFeatureInteraction(feature.id, viewId.current, 'click');
      onOpen(feature, recorded);
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Could not record your demo interest.');
      onOpen(feature, false);
    }
  }} className="mt-4 min-h-11 w-full rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90">
    {feature.buttonLabel}
  </button>;
}

export default function FeatureInterestPanel() {
  const { data, error: loadError } = useDemoManagement();
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<{ feature: FeatureTest; recorded: boolean } | null>(null);
  return <section id="feature-ideas" className="border-t border-border bg-muted/30 px-4 py-12">
    <div className="mx-auto max-w-5xl">
      <p className="text-xs font-bold uppercase tracking-wide text-accent">Coming soon · demo ideas</p>
      <h2 className="mt-2 text-2xl font-extrabold text-foreground">What should Blokpakt build next?</h2>
      <p className="mt-2 text-sm text-muted-foreground">These features are not available yet. Buttons open an explanation, not a booking or waitlist.</p>
      <label className="mt-4 flex items-start gap-2 text-sm text-muted-foreground">
        <input type="checkbox" className="mt-1" checked={data?.measurementEnabled ?? false} disabled={!data}
          onChange={(event) => {
            try { setDemoMeasurement(event.target.checked); setError(''); }
            catch (error) { setError(error instanceof Error ? error.message : 'Could not save measurement preference.'); }
          }} />
        Measure my demo views and clicks in this tab only. Demo counters are not uploaded.
      </label>
      {(loadError || error) && <p role="alert" className="mt-3 text-sm text-destructive">{loadError || error}</p>}
      {!data && !loadError && <p role="status" className="mt-3 text-sm text-muted-foreground">Loading demo ideas...</p>}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {data?.features.filter((feature) => feature.active).map((feature) => <article key={feature.id} className="rounded-2xl border border-border bg-card p-5">
          <span className="rounded-full bg-accent/10 px-2 py-1 text-xs font-semibold text-accent">Not available yet</span>
          <h3 className="mt-3 text-lg font-bold">{feature.name}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
          <FeatureButton feature={feature} enabled={data.measurementEnabled} onError={setError}
            onOpen={(feature, recorded) => setSelected({ feature, recorded })} />
        </article>)}
      </div>
      {data && !data.features.some((feature) => feature.active) && <p className="mt-4 text-sm text-muted-foreground">No feature tests are currently running.</p>}
    </div>
    <Dialog open={Boolean(selected)} onOpenChange={(open) => { if (!open) setSelected(null); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{selected?.feature.name} — coming soon</DialogTitle>
          <DialogDescription>This feature has not been built. No service was booked, no payment was taken, and no waitlist registration was created.</DialogDescription>
        </DialogHeader>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <p className="text-sm" role="status">{selected?.recorded ? 'Your interest was recorded in this tab for the demo dashboard.' : 'No click was recorded. Demo measurement is off or unavailable.'}</p>
        <button type="button" onClick={() => setSelected(null)} className="rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground">Got it</button>
      </DialogContent>
    </Dialog>
  </section>;
}
