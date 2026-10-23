import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { Bell, Search, ArrowRight, CalendarDays, Users, ContactRound, Layers } from 'lucide-react';
import { listActiveJobs, subscribeToJobs, type Job } from '../lib/jobs';
import { useDemoManagement } from '../hooks/use-demo-management';
import {
  managementRecords, featureMetrics, saveRecordNote, reviewDemoApplication,
  createFeatureTest, setFeatureActive, setDemoMeasurement, clearDemoMeasurements,
  type ManagedRecord, type DemoManagement,
} from '../lib/demo-management';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';

const CATEGORIES = [
  { id: 'bookings', label: 'Bookings', icon: CalendarDays }, { id: 'providers', label: 'Providers & applications', icon: Users },
  { id: 'customers', label: 'Customer records', icon: ContactRound }, { id: 'services', label: 'Service listings', icon: Layers },
] as const;
type Filter = 'all' | 'follow-up' | 'pending';
const inputStyle = 'min-h-11 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40';

function RecordEditor({ record, note, onClose, onSaved }: {
  record: ManagedRecord; note: DemoManagement['notes'][string] | undefined;
  onClose: () => void; onSaved: () => void;
}) {
  const [text, setText] = useState(note?.text ?? '');
  const [followUp, setFollowUp] = useState(note?.followUp ?? false);
  const [error, setError] = useState('');
  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
    <DialogContent>
      <DialogHeader><DialogTitle>Manage record</DialogTitle><DialogDescription>{record.title}. These notes stay in this browser tab and do not change a booking or grant provider access.</DialogDescription></DialogHeader>
      <form className="space-y-4" onSubmit={(event) => {
        event.preventDefault();
        try { saveRecordNote(record.id, text, followUp); onSaved(); }
        catch (error) { setError(error instanceof Error ? error.message : 'Could not save this note.'); }
      }}>
        <label className="block text-sm font-semibold">Internal note
          <textarea className={`${inputStyle} mt-2`} rows={4} maxLength={1000} value={text} onChange={(event) => setText(event.target.value)} />
        </label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={followUp} onChange={(event) => setFollowUp(event.target.checked)} />Needs follow-up</label>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <button type="submit" className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground">Save record note</button>
      </form>
    </DialogContent>
  </Dialog>;
}

export default function ManagementPanel() {
  const { data, error: managementError } = useDemoManagement();
  const [jobs, setJobs] = useState<Job[] | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState<ManagedRecord['kind']>('bookings');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<ManagedRecord | null>(null);
  const [featureName, setFeatureName] = useState('');
  const [featureDescription, setFeatureDescription] = useState('');
  const [buttonLabel, setButtonLabel] = useState("I'm interested");

  useEffect(() => {
    let active = true;
    function refresh() {
      void listActiveJobs().then((rows) => { if (active) setJobs(rows); })
        .catch((error: unknown) => { if (active) setError(error instanceof Error ? error.message : 'Could not load demo bookings.'); });
    }
    refresh();
    const unsubscribe = subscribeToJobs(refresh);
    return () => { active = false; unsubscribe(); };
  }, []);

  const records = useMemo(() => jobs && data ? managementRecords(jobs, data) : [], [jobs, data]);
  const filtered = useMemo(() => records.filter((record) =>
    record.kind === category
    && (filter === 'all' || (filter === 'follow-up' ? data?.notes[record.id]?.followUp : record.status === 'pending'))
    && `${record.title} ${record.detail} ${data?.notes[record.id]?.text ?? ''}`.toLowerCase().includes(query.trim().toLowerCase())
  ), [records, category, filter, query, data]);
  const lastPage = Math.max(0, Math.ceil(filtered.length / 10) - 1);
  const currentPage = Math.min(page, lastPage);

  function run(action: () => void, success: string) {
    setError('');
    setMessage('');
    try { action(); setMessage(success); }
    catch (error) { setError(error instanceof Error ? error.message : 'Could not save the demo change.'); }
  }

  function showCategory(next: ManagedRecord['kind'], nextFilter: Filter = 'all') {
    setCategory(next); setFilter(nextFilter); setQuery(''); setPage(0);
  }

  if (!data || !jobs) {
    return <div className="rounded-xl border border-border bg-card p-6">
      {managementError || error ? <p role="alert" className="text-destructive">{managementError || error}</p> : <p role="status">Loading management records...</p>}
    </div>;
  }
  const followUps = records.filter((record) => data.notes[record.id]?.followUp);
  const pendingJobs = jobs.filter((job) => job.status === 'pending');
  const pendingApplications = data.applications.filter((application) => application.status === 'pending');
  const metrics = featureMetrics(data);

  return <div className="space-y-6">
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div><h2 className="text-2xl font-extrabold">Management overview</h2>
        <p className="mt-1 text-sm text-muted-foreground">{records.length} managed records across 4 lists. Counts come from this tab's demo data.</p>
      </div>
      <a href="#feature-tests" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-primary/20 bg-card px-4 py-3 text-sm font-bold text-primary transition-colors hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">View feature demand <ArrowRight size={16} aria-hidden="true" /></a>
    </header>
    <p className="text-sm text-muted-foreground">No live database access or admin login yet. Use sample information only. Notes and reviews survive reloads in this tab; they do not approve real providers or modify real services.</p>
    {(managementError || error) && <p role="alert" className="rounded-xl border border-destructive/30 p-3 text-sm text-destructive">{managementError || error}</p>}
    {message && <p role="status" className="rounded-xl bg-primary/10 p-3 text-sm text-primary">{message}</p>}

    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {CATEGORIES.map((item) => <button key={item.id} type="button" aria-pressed={category === item.id} onClick={() => showCategory(item.id)}
        className={`group rounded-2xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:p-5 ${category === item.id ? 'border-primary bg-primary text-primary-foreground shadow-sm' : 'border-border bg-card hover:border-primary/40'}`}>
        <span className="mb-5 flex items-center justify-between gap-2">
          <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${category === item.id ? 'bg-white/10 text-orange-200' : 'bg-primary/5 text-primary'}`}><item.icon size={20} aria-hidden="true" /></span>
          <ArrowRight size={16} aria-hidden="true" className={category === item.id ? 'text-orange-200' : 'text-muted-foreground'} />
        </span>
        <span className="block text-3xl font-extrabold tabular-nums">{records.filter((record) => record.kind === item.id).length}</span>
        <span className={`mt-2 block text-xs font-semibold ${category === item.id ? 'text-white/80' : 'text-muted-foreground'}`}>{item.label}</span>
      </button>)}
    </div>

    <section aria-label="Management alerts" className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
      <h3 className="flex items-center gap-2 font-bold text-amber-900"><Bell size={17} />Needs attention</h3>
      <p className="mt-1 text-xs text-amber-800">In-dashboard reminders only. Counts can overlap; nothing is emailed or sent as a push notification.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-amber-900" onClick={() => showCategory('bookings', 'pending')}>{pendingJobs.length} pending bookings</button>
        <button className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-amber-900" onClick={() => showCategory('providers', 'pending')}>{pendingApplications.length} applications to review</button>
        <span className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-amber-900">{followUps.length} records marked for follow-up</span>
      </div>
      {followUps.length > 0 && <div className="mt-3 flex flex-wrap gap-2">
        {CATEGORIES.filter((item) => followUps.some((record) => record.kind === item.id)).map((item) =>
          <button key={item.id} className="text-xs font-bold text-amber-900 underline" onClick={() => showCategory(item.id, 'follow-up')}>View {item.label.toLowerCase()} follow-ups</button>)}
      </div>}
    </section>

    <section className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-bold">{CATEGORIES.find((item) => item.id === category)?.label}</h3>
        <div className="flex w-full flex-wrap gap-2 sm:w-auto">
          <label className="relative min-w-0 flex-1"><span className="sr-only">Search managed records</span><Search size={15} className="absolute left-3 top-3 text-muted-foreground" />
            <input className={`${inputStyle} pl-9`} placeholder="Search records or notes" value={query} onChange={(event) => { setQuery(event.target.value); setPage(0); }} />
          </label>
          <label><span className="sr-only">Record filter</span><select className={inputStyle} value={filter} onChange={(event) => {
            const next = event.target.value;
            if (next === 'all' || next === 'pending' || next === 'follow-up') { setFilter(next); setPage(0); }
          }}><option value="all">All records</option><option value="follow-up">Needs follow-up</option><option value="pending">Pending</option></select></label>
        </div>
      </div>
      {category === 'customers' && <p className="mt-3 text-xs text-muted-foreground">Contact groups use email when available, otherwise name + address. These are not verified unique customer accounts.</p>}
      {category === 'providers' && <p className="mt-3 text-xs text-muted-foreground">Includes the three sample catalog providers and applications submitted through Join. Marking an application reviewed does not grant access or add it to the booking catalog.</p>}
      <p className="mt-3 text-xs text-muted-foreground">{filtered.length} matching records</p>
      <div className="mt-3 divide-y divide-border">
        {filtered.slice(currentPage * 10, currentPage * 10 + 10).map((record) => <article key={record.id} className="flex flex-wrap items-start justify-between gap-3 py-5">
          <div className="min-w-0 flex-1">
            <p className="break-words text-sm font-bold">{record.title}</p>
            <p className="mt-1 break-words text-xs text-muted-foreground">{record.detail}</p>
            <span className={`mt-2 inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${record.status === 'pending' ? 'bg-accent/10 text-amber-900' : 'bg-primary/5 text-primary'}`}>{record.status}</span>
            {data.notes[record.id]?.followUp && <span className="ml-2 text-xs font-bold text-amber-700">Follow-up needed</span>}
            {data.notes[record.id]?.text && <p className="mt-2 whitespace-pre-wrap break-words text-xs text-muted-foreground">{data.notes[record.id].text}</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            {record.href && <Link to={record.href} className="inline-flex min-h-11 items-center rounded-xl border border-border px-3 py-2 text-xs font-semibold hover:bg-muted">View booking</Link>}
            {record.applicationId && record.status === 'pending' && <button type="button" onClick={() => {
              const id = record.applicationId;
              if (id) run(() => reviewDemoApplication(id), 'Demo application marked reviewed. No provider access was granted.');
            }} className="min-h-11 rounded-xl bg-primary/10 px-3 py-2 text-xs font-bold text-primary hover:bg-primary/15">Mark reviewed</button>}
            <button type="button" onClick={() => setSelected(record)} className="min-h-11 rounded-xl border border-border px-3 py-2 text-xs font-semibold hover:bg-muted">Manage note</button>
          </div>
        </article>)}
        {!filtered.length && <p className="py-8 text-center text-sm text-muted-foreground">No records match this search or filter.</p>}
      </div>
      <div className="mt-3 flex items-center justify-between gap-3 text-xs">
        <button type="button" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)} className="rounded-lg border px-3 py-2 disabled:opacity-40">Previous</button>
        <span>Page {currentPage + 1} of {lastPage + 1}</span>
        <button type="button" disabled={currentPage === lastPage} onClick={() => setPage(currentPage + 1)} className="rounded-lg border px-3 py-2 disabled:opacity-40">Next</button>
      </div>
    </section>

    <section id="feature-tests" className="scroll-mt-32 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h3 className="text-lg font-extrabold">Feature demand tests</h3><p className="mt-1 text-sm text-muted-foreground">Discover interest in ideas that are not implemented. Results are this tab's test interactions, not website-wide analytics.</p></div>
        <Link to="/#feature-ideas" className="rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground">Try the homepage buttons</Link>
      </div>
      <label className="mt-4 flex items-start gap-2 text-sm"><input className="mt-1" type="checkbox" checked={data.measurementEnabled}
        onChange={(event) => run(() => setDemoMeasurement(event.target.checked), event.target.checked ? 'Local demo measurement enabled.' : 'Local demo measurement stopped. Existing counts are retained.')} />
        Enable local demo measurement (off by default; no network requests)
      </label>
      <p className="mt-3 text-xs text-muted-foreground">A view counts once per button mount when at least 50% is visible. CTR = views with a click / measured views. Repeated clicks increase total clicks, not CTR. Views are not unique people; small samples cannot predict a successful launch.</p>
      <div className="relative mt-4 overflow-x-auto">
        <table className="w-full min-w-[600px] text-left text-sm">
          <thead><tr className="border-b border-border text-xs text-muted-foreground"><th className="py-3 pr-3">Idea (most clicked first)</th><th className="pr-3">Views</th><th className="pr-3">Clicked views</th><th className="pr-3">Total clicks</th><th className="pr-3">CTR</th><th>Test</th></tr></thead>
          <tbody>{metrics.map((feature) => <tr key={feature.id} className="border-b border-border">
            <td className="max-w-xs py-4 pr-3"><p className="font-semibold">{feature.name}</p><p className="mt-1 text-xs text-muted-foreground">Not implemented · {feature.buttonLabel}</p></td>
            <td>{feature.impressions}</td><td>{feature.clickedViews}</td><td>{feature.clicks}</td><td>{feature.ctr === null ? '—' : `${feature.ctr.toFixed(1)}%`}</td>
            <td><button type="button" onClick={() => run(() => setFeatureActive(feature.id, !feature.active), feature.active ? 'Feature test paused; homepage button hidden.' : 'Feature test resumed.')} className="rounded-lg border border-border px-3 py-2 text-xs font-semibold">{feature.active ? 'Pause' : 'Resume'}<span className="sr-only"> {feature.name}</span></button></td>
          </tr>)}</tbody>
        </table>
      </div>
      <button type="button" className="mt-3 text-xs font-semibold text-destructive underline" onClick={() => {
        if (window.confirm('Clear only the demo view and click counts? Bookings, notes and feature tests will be kept.')) {
          run(clearDemoMeasurements, 'Demo measurements cleared. Revisit the homepage to measure a new view.');
        }
      }}>Clear demo metrics</button>
      <form className="mt-6 space-y-3 border-t border-border pt-5" onSubmit={(event) => {
        event.preventDefault();
        run(() => { createFeatureTest({ name: featureName, description: featureDescription, buttonLabel }); setFeatureName(''); setFeatureDescription(''); }, 'Feature test created. Preview it on the homepage in this tab.');
      }}>
        <h4 className="font-bold">Test another idea</h4>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-semibold">Feature name<input required maxLength={80} className={`${inputStyle} mt-1`} value={featureName} onChange={(event) => setFeatureName(event.target.value)} placeholder="What might we build?" /></label>
          <label className="text-xs font-semibold">Button text<input required maxLength={40} className={`${inputStyle} mt-1`} value={buttonLabel} onChange={(event) => setButtonLabel(event.target.value)} /></label>
        </div>
        <label className="block text-xs font-semibold">Description<textarea required maxLength={300} className={`${inputStyle} mt-1`} value={featureDescription} onChange={(event) => setFeatureDescription(event.target.value)} placeholder="Explain the idea without promising it is available." /></label>
        <button type="submit" className="rounded-xl bg-accent px-4 py-3 text-sm font-bold text-white">Create demo feature test</button>
      </form>
    </section>
    {selected && <RecordEditor key={selected.id} record={selected} note={data.notes[selected.id]} onClose={() => setSelected(null)} onSaved={() => { setSelected(null); setMessage('Record note saved in this tab.'); }} />}
  </div>;
}
