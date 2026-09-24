import { useEffect, useState } from 'react';
import { Helmet } from '@dr.pogodin/react-helmet';
import { motion, AnimatePresence } from 'motion/react';
import 'leaflet/dist/leaflet.css';
import { field } from 'virtual:content';
import {
  createAddOnRequest,
  deleteAddOnRequest,
  listAddOnRequestsForJob,
  subscribeToAddOnRequests,
  subscribeToAddOnStatusChanges,
  type AddOnRequest,
} from '../lib/add-on-workflow';
import { listBatches, type Batch } from '../lib/batches';
import { listActiveJobs, subscribeToJobs, updateJob, type Job, type JobStatus } from '../lib/jobs';
import {
  MapPin, Clock, Camera, CheckCircle,
  Zap, Plus, X, AlertCircle, ArrowRight,
  Navigation, Phone, MessageSquare, TrendingUp, Banknote,
  CalendarDays, ChevronDown, ChevronUp, Unlock
} from 'lucide-react';

interface DisplayAddOn {
  id: string;
  label: string;
  price: number;
  approved: boolean;
}

type FieldJob = Job & { addOns: DisplayAddOn[] };

type DiscoverMapModules = {
  leaflet: typeof import('leaflet');
  reactLeaflet: typeof import('react-leaflet');
};

type BatchMapPin = Batch & {
  coordinates: [number, number];
};

const SPRINGFIELD_CENTER: [number, number] = [39.78, -89.65];

const BATCH_PIN_COORDINATES: [number, number][] = [
  [39.789, -89.661],
  [39.785, -89.642],
  [39.773, -89.657],
  [39.776, -89.635],
];

const STATUS_CONFIG: Record<JobStatus, { label: string; color: string; bg: string; dot: string }> = {
  pending: { label: 'Pending', color: 'text-muted-foreground', bg: 'bg-muted', dot: 'bg-muted-foreground' },
  en_route: { label: 'En Route', color: 'text-blue-600', bg: 'bg-blue-50', dot: 'bg-blue-500' },
  arrived: { label: 'Arrived', color: 'text-amber-600', bg: 'bg-amber-50', dot: 'bg-amber-500' },
  in_progress: { label: 'In Progress', color: 'text-accent', bg: 'bg-accent/10', dot: 'bg-accent' },
  complete: { label: 'Complete', color: 'text-primary', bg: 'bg-primary/10', dot: 'bg-primary' },
  disputed: { label: 'Disputed', color: 'text-destructive', bg: 'bg-destructive/10', dot: 'bg-destructive' },
  cancelled: { label: 'Cancelled', color: 'text-muted-foreground', bg: 'bg-muted', dot: 'bg-muted-foreground' },
};

function now() {
  return new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function today() {
  return new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatTime(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

// ── Sub-components ────────────────────────────────────────────────────────────

function AddOnLogger({
  addOns,
  onAdd,
  onRemove,
}: {
  addOns: DisplayAddOn[];
  onAdd: (item: { label: string; description: string; price: number; photo: string | null }) => void;
  onRemove: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);

  function submitPitch() {
    const amount = Number(price);
    if (!title.trim() || !Number.isFinite(amount) || amount <= 0) return;
    onAdd({ label: title.trim(), description: description.trim(), price: amount, photo });
    setTitle('');
    setDescription('');
    setPrice('');
    setPhoto(null);
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-foreground hover:bg-muted/40 transition-colors"
      >
        <span className="flex items-center gap-2">
          <Plus size={15} className="text-accent" />
          Add on-site extras
          {addOns.length > 0 && (
            <span className="rounded-full bg-accent text-white text-xs px-2 py-0.5 font-bold">
              {addOns.length}
            </span>
          )}
        </span>
        {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-border pt-3">
              {addOns.length > 0 && (
                <div className="mb-3 space-y-2">
                  {addOns.map((a) => (
                    <div key={a.id} className="flex items-center justify-between rounded-lg bg-accent/5 border border-accent/20 px-3 py-2">
                      <div>
                        <p className="text-xs font-semibold text-foreground">{a.label}</p>
                        <p className="text-xs text-accent font-bold">+${a.price}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${a.approved ? 'bg-primary/10 text-primary' : 'bg-amber-100 text-amber-700'}`}>
                          {a.approved ? 'Approved' : 'Pending'}
                        </span>
                        <button onClick={() => onRemove(a.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground mb-2 font-medium">On-site pitch: you set the price</p>
              <div className="grid grid-cols-2 gap-2">
                {field.ADDON_CATALOG.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => setTitle(item.label)}
                    className="text-left rounded-lg border border-border bg-background px-3 py-2 hover:border-accent/50 hover:bg-accent/5 transition-all"
                  >
                    <p className="text-xs font-semibold text-foreground leading-tight">{item.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Use label</p>
                  </button>
                ))}
              </div>
              <div className="mt-3 space-y-2">
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Custom service title" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What did you find on-site?" rows={2} className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                <div className="flex gap-2">
                  <label className="flex-1 cursor-pointer rounded-lg border border-dashed border-border px-3 py-2 text-xs font-semibold text-muted-foreground hover:border-accent/50">
                    <Camera size={14} className="mr-1 inline" /> {photo ? 'Photo attached' : 'Attach site photo'}
                    <input type="file" accept="image/*" className="sr-only" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new globalThis.FileReader();
                      reader.onload = () => setPhoto(typeof reader.result === 'string' ? reader.result : null);
                      reader.readAsDataURL(file);
                    }} />
                  </label>
                  <input required type="number" min="0.01" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Your price ($)" className="w-36 rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                </div>
                <button type="button" onClick={submitPitch} disabled={!title.trim() || !price || Number(price) <= 0} className="w-full rounded-lg bg-accent px-3 py-2.5 text-sm font-bold text-white disabled:opacity-40">Send pitch to customer</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Job Card ──────────────────────────────────────────────────────────────────

function JobCard({
  job,
  order,
  expanded,
  onToggle,
  onAction,
  onPhoto,
  onAddAddOn,
  onRemoveAddOn,
  isCompleting,
}: {
  job: FieldJob;
  order: number;
  expanded: boolean;
  onToggle: () => void;
  onAction: (jobId: string, action: 'arrive' | 'start' | 'complete') => void;
  onPhoto: (jobId: string) => void;
  onAddAddOn: (jobId: string, item: { label: string; description: string; price: number; photo: string | null }) => void;
  onRemoveAddOn: (jobId: string, addOnId: string) => void;
  isCompleting: boolean;
}) {
  const cfg = STATUS_CONFIG[job.status];
  const addOnTotal = job.addOns.filter((a) => a.approved).reduce((s, a) => s + a.price, 0);
  const totalPayout = job.payout + addOnTotal;

  return (
    <motion.div
      layout
      className={`rounded-2xl border overflow-hidden transition-all ${
        job.status === 'complete'
          ? 'border-primary/30 bg-primary/5'
          : job.status === 'in_progress'
          ? 'border-accent/40 bg-card shadow-md'
          : 'border-border bg-card'
      }`}
    >
      {/* Card header — always visible */}
      <button onClick={onToggle} className="w-full text-left px-5 py-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground">
            {order}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-base">{job.serviceIcon}</span>
              <p className="font-bold text-foreground text-sm">{job.service}</p>
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${cfg.bg} ${cfg.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                {cfg.label}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5 truncate">{job.address}, {job.zip}</p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
              {job.scheduledWindow && (
                <span className="text-xs font-semibold text-accent flex items-center gap-1">
                  <CalendarDays size={11} /> {job.scheduledWindow}
                </span>
              )}
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock size={11} /> {job.estimatedDuration}
              </span>
              <span className="text-xs font-bold text-primary">${totalPayout}</span>
              {job.gateCode && (
                <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 rounded px-1.5 py-0.5 font-mono font-semibold">
                  Gate: {job.gateCode}
                </span>
              )}
            </div>
          </div>
          <div className="flex-shrink-0 text-muted-foreground">
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </div>
      </button>

      <div className="border-t border-border px-5 pb-4 pt-3">
        <p className="mb-3 text-xs text-muted-foreground">
          {job.propertyNotes ? `Note: ${job.propertyNotes}` : 'No access notes provided.'}
        </p>
        <div className="grid grid-cols-2 gap-2">
          <a
            href={`https://maps.google.com/?q=${encodeURIComponent(`${job.address}, ${job.zip}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
          >
            <MapPin size={14} />
            Get Directions
          </a>
          <button
            type="button"
            disabled={job.status === 'complete' || isCompleting}
            onClick={() => onPhoto(job.id)}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2.5 text-xs font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {job.status === 'complete' ? <CheckCircle size={14} /> : <Camera size={14} />}
            {job.status === 'complete' ? 'Payment released' : isCompleting ? 'Capturing payment…' : 'Upload Completion Photo'}
          </button>
        </div>
      </div>

      {/* Expanded detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 border-t border-border pt-4 space-y-4">
              {/* Property info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-muted/40 p-3">
                  <p className="text-xs text-muted-foreground font-medium mb-1">Address</p>
                  <p className="text-sm font-semibold text-foreground">{job.address}</p>
                  <p className="text-xs text-muted-foreground">ZIP {job.zip}</p>
                </div>
                <div className="rounded-xl bg-muted/40 p-3">
                  <p className="text-xs text-muted-foreground font-medium mb-1">Customer</p>
                  <p className="text-sm font-semibold text-foreground">{job.customerName}</p>
                  <p className="text-xs text-muted-foreground">{job.customerPhone}</p>
                </div>
              </div>

              {/* Gate code + notes */}
              {(job.gateCode || job.propertyNotes) && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 space-y-1.5">
                  {job.gateCode && (
                    <div className="flex items-center gap-2">
                      <Unlock size={13} className="text-amber-600 flex-shrink-0" />
                      <span className="text-xs font-semibold text-amber-800">Gate code: </span>
                      <span className="font-mono text-sm font-bold text-amber-900">{job.gateCode}</span>
                    </div>
                  )}
                  {job.propertyNotes && (
                    <div className="flex items-start gap-2">
                      <AlertCircle size={13} className="text-amber-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-800">{job.propertyNotes}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Timestamps */}
              {(job.arrivedAt || job.completedAt) && (
                <div className="flex gap-3">
                  {job.arrivedAt && (
                    <div className="flex-1 rounded-xl bg-amber-50 border border-amber-200 p-3 text-center">
                      <p className="text-xs text-amber-700 font-medium">Arrived</p>
                      <p className="text-sm font-bold text-amber-900">{formatTime(job.arrivedAt)}</p>
                    </div>
                  )}
                  {job.completedAt && (
                    <div className="flex-1 rounded-xl bg-primary/10 border border-primary/20 p-3 text-center">
                      <p className="text-xs text-primary font-medium">Completed</p>
                      <p className="text-sm font-bold text-primary">{formatTime(job.completedAt)}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Add-on logger */}
              {job.status !== 'pending' && job.status !== 'complete' && (
                <AddOnLogger
                  addOns={job.addOns}
                  onAdd={(item) => onAddAddOn(job.id, item)}
                  onRemove={(id) => onRemoveAddOn(job.id, id)}
                />
              )}

              {/* Action buttons */}
              <div className="pt-1">
                {job.status === 'pending' && (
                  <button
                    onClick={() => onAction(job.id, 'arrive')}
                    className="w-full py-3 rounded-xl bg-amber-500 text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-amber-600 transition-colors"
                  >
                    <Navigation size={16} />
                    Mark Arrived — {now()}
                  </button>
                )}
                {job.status === 'arrived' && (
                  <button
                    onClick={() => onAction(job.id, 'start')}
                    className="w-full py-3 rounded-xl bg-accent text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-accent/90 transition-colors"
                  >
                    <Zap size={16} />
                    Start Job
                  </button>
                )}
                {job.status === 'in_progress' && (
                  <button
                    onClick={() => onAction(job.id, 'complete')}
                    disabled={isCompleting}
                    className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-40 hover:bg-primary/90 transition-colors"
                  >
                    <CheckCircle size={16} />
                    {isCompleting
                      ? 'Capturing payment…'
                      : `Mark Complete — ${now()}`}
                  </button>
                )}
                {job.status === 'complete' && (
                  <div className="flex items-center justify-center gap-2 py-2 text-primary text-sm font-semibold">
                    <CheckCircle size={16} />
                    Completed · Payment released
                  </div>
                )}
              </div>

              {/* Contact buttons */}
              {job.status !== 'complete' && (
                <div className="flex gap-2">
                  <a
                    href={`tel:${job.customerPhone}`}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-border py-2.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
                  >
                    <Phone size={13} /> Call
                  </a>
                  <a
                    href={`sms:${job.customerPhone}`}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-border py-2.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
                  >
                    <MessageSquare size={13} /> Text
                  </a>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Earnings Panel ────────────────────────────────────────────────────────────

function EarningsPanel({ jobs }: { jobs: FieldJob[] }) {
  const [cashoutLoading, setCashoutLoading] = useState(false);
  const [cashoutDone, setCashoutDone] = useState(false);

  const completed = jobs.filter((j) => j.status === 'complete');
  const baseEarnings = completed.reduce((s, j) => s + j.payout, 0);
  const addOnEarnings = completed.reduce(
    (s, j) => s + j.addOns.filter((a) => a.approved).reduce((x, a) => x + a.price, 0),
    0,
  );
  const totalEarnings = baseEarnings + addOnEarnings;
  const pendingJobs = jobs.filter((j) => j.status !== 'complete').length;
  const projectedTotal = jobs.reduce((s, j) => s + j.payout, 0);

  function handleCashout() {
    setCashoutLoading(true);
    window.setTimeout(() => {
      setCashoutLoading(false);
      setCashoutDone(true);
    }, 1200);
  }

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp size={16} className="text-primary" />
          <p className="font-bold text-foreground text-sm">Today's Earnings — {today()}</p>
        </div>
        <span className="text-xs text-muted-foreground">{completed.length}/{jobs.length} jobs done</span>
      </div>

      <div className="px-5 py-4 space-y-3">
        {/* Earnings breakdown */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-muted/40 p-3 text-center">
            <p className="text-xs text-muted-foreground">Base pay</p>
            <p className="text-lg font-extrabold text-foreground">${baseEarnings}</p>
          </div>
          <div className="rounded-xl bg-accent/10 p-3 text-center">
            <p className="text-xs text-muted-foreground">Add-ons</p>
            <p className="text-lg font-extrabold text-accent">+${addOnEarnings}</p>
          </div>
          <div className="rounded-xl bg-primary/10 p-3 text-center">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-lg font-extrabold text-primary">${totalEarnings}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
            <span>Route progress</span>
            <span>${totalEarnings} of ${projectedTotal} projected</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${projectedTotal > 0 ? (totalEarnings / projectedTotal) * 100 : 0}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Cashout */}
        {cashoutDone ? (
          <div className="rounded-xl bg-primary/10 border border-primary/20 p-4 flex items-center gap-3">
            <CheckCircle size={20} className="text-primary flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-primary">Cashout initiated!</p>
              <p className="text-xs text-muted-foreground">
                ${totalEarnings} marked as paid in this UI demo.
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-muted/20 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  <Banknote size={15} className="text-primary" />
                  Instant cashout
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Available: <span className="font-bold text-foreground">${totalEarnings}</span>
                  {pendingJobs > 0 && ` · ${pendingJobs} job${pendingJobs > 1 ? 's' : ''} remaining`}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Demo payout · no real transfer
                </p>
              </div>
              <button
                onClick={handleCashout}
                disabled={totalEarnings === 0 || cashoutLoading}
                className="flex-shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground disabled:opacity-40 hover:bg-primary/90 transition-colors"
              >
                {cashoutLoading ? (
                  <span className="w-3.5 h-3.5 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />
                ) : (
                  <Zap size={13} />
                )}
                Cash out
              </button>
            </div>
          </div>
        )}

        {/* Per-job breakdown */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2">Job breakdown</p>
          <div className="space-y-1.5">
            {jobs.map((j) => {
              const addOnTotal = j.addOns.filter((a) => a.approved).reduce((s, a) => s + a.price, 0);
              return (
                <div key={j.id} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <span>{j.serviceIcon}</span>
                    {j.address}
                  </span>
                  <span className={`font-semibold ${j.status === 'complete' ? 'text-primary' : 'text-muted-foreground'}`}>
                    {j.status === 'complete' ? `$${j.payout + addOnTotal}` : `$${j.payout} pending`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function BatchDiscovery({
  batches,
  claimedCodes,
  onClaim,
}: {
  batches: Batch[];
  claimedCodes: Set<string>;
  onClaim: (code: string) => void;
}) {
  const [mapModules, setMapModules] = useState<DiscoverMapModules | null>(null);
  const [mapError, setMapError] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<BatchMapPin | null>(null);
  const mapPins: BatchMapPin[] = batches.slice(0, BATCH_PIN_COORDINATES.length).map((batch, index) => ({
    ...batch,
    coordinates: BATCH_PIN_COORDINATES[index],
  }));

  useEffect(() => {
    let cancelled = false;

    void Promise.all([import('leaflet'), import('react-leaflet')])
      .then(([leaflet, reactLeaflet]) => {
        if (!cancelled) setMapModules({ leaflet, reactLeaflet });
      })
      .catch(() => {
        if (!cancelled) setMapError(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
      <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
        <div className="mb-4">
          <p className="text-xs font-bold uppercase tracking-wider text-primary">Batch discovery</p>
          <h2 className="mt-1 text-xl font-extrabold text-foreground">Claim nearby route density</h2>
          <p className="mt-1 text-sm text-muted-foreground">Pick up grouped work where every stop earns more per mile.</p>
        </div>
        <div className="space-y-3">
          {batches.map((batch) => {
            const totalPayout = batch.batchPrice * batch.homesBooked;
            const claimed = claimedCodes.has(batch.code);
            return (
              <article key={batch.code} className="rounded-lg border border-border bg-background p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-bold text-foreground">{batch.street} Batch - 62701</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{batch.service} · {batch.homesBooked} homes</p>
                  </div>
                  <p className="shrink-0 text-lg font-extrabold text-primary">${totalPayout.toFixed(2)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onClaim(batch.code)}
                  disabled={claimed}
                  className="mt-4 w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:bg-primary"
                >
                  {claimed ? 'Batch claimed' : 'Claim Batch'}
                </button>
              </article>
            );
          })}
        </div>
      </section>

      <section className="relative min-h-[360px] overflow-hidden rounded-xl border border-border bg-muted sm:min-h-[440px]" aria-label="Available batch map">
        <div className="absolute left-5 right-5 top-5 z-10 flex items-start justify-between gap-3 pointer-events-none">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-primary drop-shadow-sm">62701 availability</p>
            <h2 className="mt-1 text-lg font-extrabold text-foreground drop-shadow-sm">Neighborhood batch map</h2>
          </div>
          <span className="rounded-full border border-white bg-white/95 px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm">{batches.length} live batches</span>
        </div>

        {mapModules ? (
          <DiscoverMap mapModules={mapModules} pins={mapPins} onSelect={setSelectedBatch} />
        ) : (
          <div className="flex min-h-[360px] items-center justify-center text-sm font-medium text-muted-foreground sm:min-h-[440px]">
            {mapError ? 'Map unavailable. Please refresh to try again.' : 'Loading nearby batches...'}
          </div>
        )}

        <AnimatePresence>
          {selectedBatch && (() => {
            const totalPayout = selectedBatch.batchPrice * selectedBatch.homesBooked;
            const estimatedHours = Math.max(0.75, selectedBatch.homesBooked * 0.375);
            const claimed = claimedCodes.has(selectedBatch.code);

            return (
              <motion.aside
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 24 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-x-4 bottom-4 z-20 rounded-xl border border-primary/20 bg-card p-4 shadow-xl sm:inset-x-auto sm:right-4 sm:w-80"
                aria-label={`${selectedBatch.street} route details`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-primary">Route density</p>
                    <h3 className="mt-1 text-lg font-extrabold text-foreground">{selectedBatch.street} Batch</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedBatch(null)}
                    className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    aria-label="Close route details"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-3 divide-x divide-border rounded-lg border border-border bg-muted/40 py-3 text-center">
                  <div className="px-2">
                    <p className="text-xs text-muted-foreground">Payout</p>
                    <p className="mt-1 text-base font-extrabold text-primary">${totalPayout}</p>
                  </div>
                  <div className="px-2">
                    <p className="text-xs text-muted-foreground">Stops</p>
                    <p className="mt-1 text-base font-extrabold text-foreground">{selectedBatch.homesBooked}</p>
                  </div>
                  <div className="px-2">
                    <p className="text-xs text-muted-foreground">Est. time</p>
                    <p className="mt-1 text-base font-extrabold text-foreground">{estimatedHours}h</p>
                  </div>
                </div>

                <p className="mt-3 text-sm text-muted-foreground">
                  {selectedBatch.homesBooked} {selectedBatch.service} stop{selectedBatch.homesBooked === 1 ? '' : 's'} across one street.
                </p>
                <button
                  type="button"
                  onClick={() => onClaim(selectedBatch.code)}
                  disabled={claimed}
                  className="mt-4 min-h-11 w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:bg-primary"
                >
                  {claimed ? 'Route claimed' : 'Claim Route'}
                </button>
              </motion.aside>
            );
          })()}
        </AnimatePresence>

        <div className="absolute bottom-5 left-5 z-10 rounded-lg border border-white/80 bg-white/95 px-3 py-2 text-xs text-muted-foreground shadow-sm pointer-events-none">
          Select a route pin to compare payout and density.
        </div>
      </section>
    </div>
  );
}

function DiscoverMap({
  mapModules,
  pins,
  onSelect,
}: {
  mapModules: DiscoverMapModules;
  pins: BatchMapPin[];
  onSelect: (pin: BatchMapPin) => void;
}) {
  const { MapContainer, Marker, TileLayer } = mapModules.reactLeaflet;

  return (
    <MapContainer
      center={SPRINGFIELD_CENTER}
      zoom={13}
      scrollWheelZoom
      className="h-[360px] w-full sm:h-[440px]"
      aria-label="Interactive map of available Springfield service batches"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {pins.map((pin) => {
        const totalPayout = Math.round(pin.batchPrice * pin.homesBooked);
        const priceIcon = mapModules.leaflet.divIcon({
          className: 'discover-price-pin-container',
          html: `<span class="discover-price-pin"><span>$${totalPayout}</span><span class="discover-price-pin-density"><span class="discover-price-pin-divider"></span>${pin.homesBooked} Houses</span></span>`,
          iconSize: [158, 38],
          iconAnchor: [79, 19],
        });

        return (
          <Marker
            key={pin.code}
            position={pin.coordinates}
            icon={priceIcon}
            eventHandlers={{ click: () => onSelect(pin) }}
            title={`${pin.street} batch: $${totalPayout}, ${pin.homesBooked} houses`}
          />
        );
      })}
    </MapContainer>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function FieldPage() {
  const [jobs, setJobs] = useState<FieldJob[]>([]);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'unavailable'>('loading');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'route' | 'discover' | 'earnings'>('route');
  const [batches, setBatches] = useState<Batch[]>([]);
  const [claimedBatchCodes, setClaimedBatchCodes] = useState<Set<string>>(() => new Set());
  const [actionError, setActionError] = useState('');
  const [completingId, setCompletingId] = useState<string | null>(null);

  // Load today's route and merge in any add-on requests already filed per job.
  useEffect(() => {
    let cancelled = false;
    listActiveJobs()
      .then(async (found) => {
        if (cancelled) return;
        const withAddOns = await Promise.all(
          found.map(async (j) => {
            const requests = await listAddOnRequestsForJob(j.id).catch(() => []);
            return {
              ...j,
              addOns: requests
                .filter((r) => r.status !== 'declined')
                .map((r) => ({ id: r.id, label: r.service, price: r.price, approved: r.status === 'approved' })),
            };
          }),
        );
        if (cancelled) return;
        setJobs(withAddOns);
        setLoadState('ready');
        setExpandedId((current) => current ?? withAddOns.find((j) => j.status === 'in_progress' || j.status === 'arrived')?.id ?? null);
      })
      .catch(() => {
        if (!cancelled) setLoadState('unavailable');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    void listBatches().then(setBatches).catch(() => setBatches([]));
  }, []);

  // Reflect job changes made elsewhere (e.g. a new booking landing on the route).
  useEffect(() => {
    const unsubscribe = subscribeToJobs((updated) => {
      setJobs((prev) => {
        if (!prev.some((j) => j.id === updated.id)) return [...prev, { ...updated, addOns: [] }];
        return prev.map((j) => (j.id === updated.id ? { ...updated, addOns: j.addOns } : j));
      });
    });
    return () => unsubscribe();
  }, []);

  // Keep add-on approval status in sync with the customer tracking page.
  useEffect(() => {
    const unsubscribeInsert = subscribeToAddOnRequests((request) => {
      setJobs((prev) =>
        prev.map((j) => {
          if (j.id !== request.jobId || j.addOns.some((a) => a.id === request.id)) return j;
          return { ...j, addOns: [...j.addOns, { id: request.id, label: request.service, price: request.price, approved: false }] };
        }),
      );
    });
    const unsubscribeStatus = subscribeToAddOnStatusChanges((request) => {
      setJobs((prev) =>
        prev.map((j) => {
          if (j.id !== request.jobId) return j;
          if (request.status === 'declined') return { ...j, addOns: j.addOns.filter((a) => a.id !== request.id) };
          return { ...j, addOns: j.addOns.map((a) => (a.id === request.id ? { ...a, approved: request.status === 'approved' } : a)) };
        }),
      );
    });
    return () => {
      unsubscribeInsert();
      unsubscribeStatus();
    };
  }, []);

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  function claimBatch(code: string) {
    setClaimedBatchCodes((current) => new Set(current).add(code));
  }

  async function handleAction(jobId: string, action: 'arrive' | 'start' | 'complete') {
    const job = jobs.find((j) => j.id === jobId);
    if (!job) return;
    setActionError('');

    if (action === 'complete') {
      setCompletingId(jobId);
      try {
        const completedAt = new Date().toISOString();
        await updateJob(jobId, { status: 'complete', completedAt });
        setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, status: 'complete', completedAt } : j)));
      } catch (error) {
        console.error('complete job failed', error);
        setActionError(error instanceof Error ? error.message : 'Unable to capture payment for this job.');
      } finally {
        setCompletingId(null);
      }
      return;
    }

    const patch = action === 'arrive'
      ? { status: 'arrived' as const, arrivedAt: new Date().toISOString() }
      : { status: 'in_progress' as const };
    try {
      await updateJob(jobId, patch);
      setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, ...patch } : j)));
    } catch (error) {
      console.error('job update failed', error);
      setActionError('Unable to update this job. Please try again.');
    }
  }

  async function handlePhoto(jobId: string) {
    setCompletingId(jobId);
    try {
      const completedAt = new Date().toISOString();
      await updateJob(jobId, { afterPhoto: 'captured', status: 'complete', completedAt });
      setJobs((prev) => prev.map((job) => (job.id === jobId ? { ...job, afterPhoto: 'captured', status: 'complete', completedAt } : job)));
    } catch (error) {
      console.error('photo update failed', error);
    } finally {
      setCompletingId(null);
    }
  }

  async function handleAddAddOn(jobId: string, item: { label: string; description: string; price: number; photo: string | null }) {
    const request: AddOnRequest = {
      id: globalThis.crypto?.randomUUID?.() ?? `pitch-${Date.now()}`,
      jobId,
      service: item.label,
      description: item.description,
      price: item.price,
      photo: item.photo,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    await createAddOnRequest(request);
    setJobs((prev) =>
      prev.map((j) => {
        if (j.id !== jobId) return j;
        if (j.addOns.some((a) => a.label === item.label)) return j;
        return { ...j, addOns: [...j.addOns, { id: request.id, label: item.label, price: item.price, approved: false }] };
      }),
    );
  }

  async function handleRemoveAddOn(jobId: string, addOnId: string) {
    try {
      await deleteAddOnRequest(addOnId);
    } catch (error) {
      console.error('remove add-on failed', error);
    }
    setJobs((prev) =>
      prev.map((j) => {
        if (j.id !== jobId) return j;
        return { ...j, addOns: j.addOns.filter((a) => a.id !== addOnId) };
      }),
    );
  }

  const completedCount = jobs.filter((j) => j.status === 'complete').length;
  const inProgressJob = jobs.find((j) => j.status === 'in_progress' || j.status === 'arrived');
  const providerLabel = jobs[0]?.providerName ?? 'Your route';
  const activeBatch = batches.find((batch) => batch.code === jobs[0]?.batchCode);
  const routeTitle = activeBatch ? `${activeBatch.street} Batch` : 'Today\'s Route';
  const routePayout = jobs.reduce((total, job) => total + job.payout + job.addOns.filter((addOn) => addOn.approved).reduce((sum, addOn) => sum + addOn.price, 0), 0);

  return (
    <>
      <Helmet>
        <title>Field App — Blokpakt Provider</title>
        <meta name="description" content="Blokpakt provider field execution app — route dispatch, photo verification, add-ons, and earnings." />
        <link rel="canonical" href="https://blokpakt.com/field" />
        <meta name="robots" content="noindex" />
      </Helmet>

      <main className="min-h-screen bg-muted/30 pb-20">
        {/* Visually hidden h1 for SEO/a11y */}
        <h1 className="sr-only">Provider Field Execution App — Blokpakt</h1>
        {/* Top bar */}
        <div className="sticky top-0 z-30 bg-card border-b border-border shadow-sm">
          <div className={`${activeTab === 'discover' ? 'max-w-6xl' : 'max-w-lg'} mx-auto px-4 py-3 flex items-center justify-between`}>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Provider App</p>
              <p className="text-sm font-bold text-foreground">{activeTab === 'route' ? `Today's Route: ${routeTitle}` : `${providerLabel} · ${today()}`}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                {activeTab === 'route' ? `${jobs.length} jobs · $${routePayout.toFixed(2)}` : `${completedCount}/${jobs.length} done`}
              </div>
              {inProgressJob && (
                <span className="flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                  Active
                </span>
              )}
            </div>
          </div>

          {/* Tab switcher */}
          <div className={`${activeTab === 'discover' ? 'max-w-6xl' : 'max-w-lg'} mx-auto px-4 pb-3 flex gap-2`}>
            {(['route', 'discover', 'earnings'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === tab
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                  {tab === 'route' ? '📍 Route' : tab === 'discover' ? '🗺️ Discover' : '💰 Earnings'}
              </button>
            ))}
          </div>
        </div>

        <div className={`${activeTab === 'discover' ? 'max-w-6xl' : 'max-w-lg'} mx-auto px-4 pt-5 space-y-4`}>
          {actionError && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-2.5 text-sm text-destructive font-medium">
              {actionError}
            </div>
          )}

          <AnimatePresence mode="wait">
            {activeTab === 'route' && (
              <motion.div
                key="route"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                {loadState === 'loading' && (
                  <div className="flex justify-center py-10">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                )}

                {loadState === 'unavailable' && (
                  <div className="rounded-xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
                    Couldn't reach the database. Please try again shortly.
                  </div>
                )}

                {loadState === 'ready' && jobs.length === 0 && (
                  <div className="rounded-xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
                    No jobs on your route today.
                  </div>
                )}

                {loadState === 'ready' && jobs.length > 0 && (
                  <>
                    {/* Route summary strip */}
                    <div className="rounded-xl border border-border bg-card px-4 py-3 flex items-center gap-4 overflow-x-auto">
                      {jobs.map((j, i) => (
                        <div key={j.id} className="flex items-center gap-2 flex-shrink-0">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                            j.status === 'complete' ? 'bg-primary text-primary-foreground' :
                            j.status === 'in_progress' || j.status === 'arrived' ? 'bg-accent text-white' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {j.status === 'complete' ? '✓' : i + 1}
                          </div>
                          {i < jobs.length - 1 && (
                            <ArrowRight size={12} className="text-muted-foreground" />
                          )}
                        </div>
                      ))}
                      <div className="ml-auto flex-shrink-0 text-xs text-muted-foreground">
                        ~{jobs.reduce((s, j) => s + (parseInt(j.estimatedDuration, 10) || 0), 0)} min total
                      </div>
                    </div>

                    {/* Job cards */}
                    {jobs.map((job, index) => (
                      <JobCard
                        key={job.id}
                        job={job}
                        order={index + 1}
                        expanded={expandedId === job.id}
                        onToggle={() => toggleExpand(job.id)}
                        onAction={handleAction}
                        onPhoto={handlePhoto}
                        onAddAddOn={handleAddAddOn}
                        onRemoveAddOn={handleRemoveAddOn}
                        isCompleting={completingId === job.id}
                      />
                    ))}
                  </>
                )}
              </motion.div>
            )}

            {activeTab === 'earnings' && (
              <motion.div
                key="earnings"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <EarningsPanel jobs={jobs} />
              </motion.div>
            )}

            {activeTab === 'discover' && (
              <motion.div
                key="discover"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <BatchDiscovery batches={batches} claimedCodes={claimedBatchCodes} onClaim={claimBatch} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </>
  );
}

