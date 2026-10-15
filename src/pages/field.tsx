import { useEffect, useRef, useState } from 'react';
import { Helmet } from '@dr.pogodin/react-helmet';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router';
import { acceptRouteBlock, listActiveJobs, routeBlocks, subscribeToJobs, updateJob, type RouteBlock, type Job as StoredJob } from '../lib/jobs';
import { createAddOnRequest, readAddOnRequests, subscribeToAddOnRequests, updateAddOnStatus } from '../lib/add-on-workflow';
import { readDemoPhoto } from '../lib/demo-photo';
import {
  MapPin, Clock, Camera, CheckCircle,
  Zap, Plus, X, AlertCircle,
  Navigation, TrendingUp, Banknote,
  ChevronDown, ChevronUp, Unlock
} from 'lucide-react';

// ── Demo data ─────────────────────────────────────────────────────────────────
const TODAY = 'Demo session';

interface Job {
  id: string;
  code: string;
  order: number;
  status: 'pending' | 'en_route' | 'arrived' | 'in_progress' | 'complete';
  service: string;
  serviceIcon: string;
  address: string;
  city: string;
  zip: string;
  gateCode: string | null;
  propertyNotes: string;
  customerName: string;
  customerPhone: string;
  batchSize: number;
  payout: number;
  estimatedDuration: string;
  arrivedAt: string | null;
  completedAt: string | null;
  beforePhoto: string | null;
  afterPhoto: string | null;
  addOns: AddOn[];
}

interface AddOn {
  id: string;
  label: string;
  price: number;
  approved: boolean;
}

const FIXED_EXTRAS = [
  { label: 'Add Walkway Wash', price: 40 },
  { label: 'Add Premium Edge Trim', price: 15 },
  { label: 'Add Gutter Debris Haul', price: 25 },
];

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'text-muted-foreground', bg: 'bg-muted', dot: 'bg-muted-foreground' },
  en_route: { label: 'En Route', color: 'text-blue-600', bg: 'bg-blue-50', dot: 'bg-blue-500' },
  arrived: { label: 'Arrived', color: 'text-amber-600', bg: 'bg-amber-50', dot: 'bg-amber-500' },
  in_progress: { label: 'In Progress', color: 'text-accent', bg: 'bg-accent/10', dot: 'bg-accent' },
  complete: { label: 'Complete', color: 'text-primary', bg: 'bg-primary/10', dot: 'bg-primary' },
};

// ── Sub-components ────────────────────────────────────────────────────────────

function AddOnLogger({
  addOns,
  onAdd,
  onRemove,
}: {
  addOns: AddOn[];
  onAdd: (item: { label: string; price: number }) => void;
  onRemove: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);

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
                        <button disabled={a.approved} aria-label={`Withdraw ${a.label}`} onClick={() => onRemove(a.id)} className="text-muted-foreground hover:text-destructive transition-colors disabled:opacity-40">
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <p className="mb-2 text-xs font-medium text-muted-foreground">Fixed-price extras</p>
              <div className="space-y-2">
                {FIXED_EXTRAS.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    disabled={addOns.some((addOn) => addOn.label === item.label)}
                    onClick={() => onAdd(item)}
                    className="flex w-full items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-left transition-all hover:border-accent/50 hover:bg-accent/5 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="text-xs font-semibold text-foreground">{item.label}</span>
                    <span className="text-xs font-bold text-primary">+${item.price}</span>
                  </button>
                ))}
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
  expanded,
  onToggle,
  onAction,
  onPhoto,
  onAddAddOn,
  onRemoveAddOn,
}: {
  job: Job;
  expanded: boolean;
  onToggle: () => void;
  onAction: (jobId: string, action: 'arrive' | 'complete') => void;
  onPhoto: (jobId: string, kind: 'beforePhoto' | 'afterPhoto', file: globalThis.File) => void;
  onAddAddOn: (jobId: string, item: { label: string; price: number }) => void;
  onRemoveAddOn: (jobId: string, addOnId: string) => void;
}) {
  const cfg = STATUS_CONFIG[job.status];
  const addOnTotal = job.addOns.filter((a) => a.approved).reduce((s, a) => s + a.price, 0);
  const totalPayout = job.payout + addOnTotal;
  const completionPhotoInputRef = useRef<HTMLInputElement>(null);
  const beforePhotoInputRef = useRef<HTMLInputElement>(null);
  const [issueReported, setIssueReported] = useState(false);
  const hasArrived = job.status === 'arrived' || job.status === 'in_progress';

  if (job.status === 'complete') {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
        <CheckCircle size={18} className="shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-foreground">{job.service} · {job.address}</p>
          <p className="text-xs text-muted-foreground">Completed {job.completedAt}</p>
        </div>
        <Link to={`/track?code=${encodeURIComponent(job.code)}`} className="shrink-0 text-sm font-extrabold text-primary">${totalPayout} demo earnings · View proof</Link>
      </div>
    );
  }

  return (
    <motion.div
      layout
      className={`rounded-2xl border overflow-hidden transition-all ${
        job.status === 'in_progress'
          ? 'border-accent/40 bg-card shadow-md'
          : 'border-border bg-card'
      }`}
    >
      {/* Card header — always visible */}
      <button onClick={onToggle} className="w-full text-left px-5 py-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground">
            {job.order}
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
            <p className="text-sm text-muted-foreground mt-0.5 truncate">{job.address}, {job.city}</p>
            <div className="flex items-center gap-3 mt-1">
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
                  <p className="text-xs text-muted-foreground">{job.city} {job.zip}</p>
                </div>
                {hasArrived && (
                  <div className="rounded-xl bg-muted/40 p-3">
                    <p className="text-xs text-muted-foreground font-medium mb-1">Customer</p>
                    <p className="text-sm font-semibold text-foreground">{job.customerName}</p>
                    <p className="text-xs text-muted-foreground">Demo customer</p>
                  </div>
                )}
              </div>

              {/* Gate code + notes */}
              {hasArrived && (job.gateCode || job.propertyNotes) && (
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

              {/* Map pin placeholder */}
              <div className="rounded-xl overflow-hidden border border-border h-28 bg-muted/40 flex items-center justify-center relative">
                <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-100" />
                <div className="relative flex flex-col items-center gap-1 text-primary">
                  <MapPin size={24} className="drop-shadow" />
                  <span className="text-xs font-semibold">{job.address}</span>
                  <span className="text-xs text-muted-foreground">Tap to open Maps</span>
                </div>
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(job.address + ', ' + job.city)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute inset-0"
                  aria-label={`Open ${job.address} in Google Maps`}
                />
              </div>

              {/* Timestamps */}
              {(job.arrivedAt || job.completedAt) && (
                <div className="flex gap-3">
                  {job.arrivedAt && (
                    <div className="flex-1 rounded-xl bg-amber-50 border border-amber-200 p-3 text-center">
                      <p className="text-xs text-amber-700 font-medium">Arrived</p>
                      <p className="text-sm font-bold text-amber-900">{job.arrivedAt}</p>
                    </div>
                  )}
                  {job.completedAt && (
                    <div className="flex-1 rounded-xl bg-primary/10 border border-primary/20 p-3 text-center">
                      <p className="text-xs text-primary font-medium">Completed</p>
                      <p className="text-sm font-bold text-primary">{job.completedAt}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Completion photo */}
              {hasArrived && (
                <div>
                  <input ref={beforePhotoInputRef} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" className="sr-only" aria-label="Before photo"
                    onChange={(event) => { const file = event.target.files?.[0]; if (file) onPhoto(job.id, 'beforePhoto', file); event.target.value = ''; }} />
                  <button type="button" onClick={() => beforePhotoInputRef.current?.click()} className="mb-2 w-full rounded-xl border border-primary/30 px-4 py-3 text-sm font-bold text-primary">
                    {job.beforePhoto ? 'Before photo saved' : 'Add before photo'}
                  </button>
                  <input
                    ref={completionPhotoInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    aria-label="After photo"
                    capture="environment"
                    className="sr-only"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) onPhoto(job.id, 'afterPhoto', file);
                      event.target.value = '';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => completionPhotoInputRef.current?.click()}
                    className={`flex min-h-16 w-full items-center justify-center gap-2 rounded-xl border-2 px-4 py-4 text-base font-extrabold transition-colors ${
                      job.afterPhoto ? 'border-primary bg-primary/10 text-primary' : 'border-primary/30 bg-primary/5 text-primary hover:bg-primary/10'
                    }`}
                  >
                    {job.afterPhoto ? <CheckCircle size={22} /> : <Camera size={22} />}
                    {job.afterPhoto ? 'Completion Photo Captured' : '📸 Take Photo to Complete'}
                  </button>
                  <p className="mt-2 text-xs text-muted-foreground">JPEG, PNG or WebP, under 1 MB each. Demo photos stay in this tab.</p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {job.beforePhoto && <img src={job.beforePhoto} alt="Before service" className="h-24 w-full rounded-lg object-cover" />}
                    {job.afterPhoto && <img src={job.afterPhoto} alt="After service" className="h-24 w-full rounded-lg object-cover" />}
                  </div>
                </div>
              )}

              {/* Add-on logger */}
              {job.status !== 'pending' && (
                <AddOnLogger
                  addOns={job.addOns}
                  onAdd={(item) => onAddAddOn(job.id, item)}
                  onRemove={(id) => onRemoveAddOn(job.id, id)}
                />
              )}

              {/* Action buttons */}
              <div className="space-y-2 pt-1">
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(`${job.address}, ${job.city}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  <MapPin size={16} />
                  Get Directions
                </a>
                {(job.status === 'pending' || job.status === 'en_route') && (
                  <button
                    onClick={() => onAction(job.id, 'arrive')}
                    className="w-full rounded-xl border border-amber-300 bg-amber-50 py-3 text-sm font-bold text-amber-800 transition-colors hover:bg-amber-100"
                  >
                    <Navigation size={16} />
                    I have arrived
                  </button>
                )}
                {hasArrived && (
                  <button
                    onClick={() => onAction(job.id, 'complete')}
                    disabled={!job.beforePhoto || !job.afterPhoto}
                    className="w-full rounded-xl bg-primary py-4 text-base font-extrabold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <CheckCircle size={16} />
                    Complete demo job
                  </button>
                )}
              </div>

              {/* Contact buttons */}
              {hasArrived && (
                <div className="space-y-2 text-center">
                  <button type="button" onClick={() => setIssueReported(true)} className="text-xs font-semibold text-muted-foreground hover:text-foreground">
                    {issueReported ? 'Issue noted for this demo' : 'Report Issue / Cannot Access'}
                  </button>
                  <Link to={`/track?code=${encodeURIComponent(job.code)}`} className="block rounded-lg border border-border py-2 text-xs font-semibold text-primary">Switch to customer view</Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function AvailableRoutesPanel({ batches, claimedCodes, onClaim }: { batches: RouteBlock[]; claimedCodes: Set<string>; onClaim: (code: string) => void }) {
  return (
    <>
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-primary">Available routes</p>
        <h2 className="mt-1 text-xl font-extrabold text-foreground">Nearby work, less driving</h2>
        <p className="mt-1 text-sm text-muted-foreground">Same street, service and date. Accept every stop together; no AI or live routing.</p>
      </div>
      <div className="mt-4 space-y-3">
        {batches.map((batch) => {
          const payout = batch.payout;
          const claimed = claimedCodes.has(batch.code);
          const actionLabel = claimed ? 'Route accepted' : `Accept all ${batch.homesBooked} stops — $${payout}`;
          return (
            <article key={batch.code} className="rounded-xl border border-border bg-background p-4">
              <div className="flex items-start justify-between gap-3"><div><p className="font-bold text-foreground">{batch.street} Batch</p><p className="mt-1 text-sm text-muted-foreground">{batch.service} · {batch.homesBooked} stops</p></div><p className="text-lg font-extrabold text-primary">${payout}</p></div>
              <p className="mt-1 text-xs text-muted-foreground">{batch.scheduledWindow}</p>
              <button type="button" onClick={() => onClaim(batch.code)} disabled={claimed} className="mt-3 min-h-11 w-full rounded-lg bg-accent px-3 py-2.5 text-sm font-bold text-white transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground">{actionLabel}</button>
            </article>
          );
        })}
      </div>
    </>
  );
}

// ── Earnings Panel ────────────────────────────────────────────────────────────

export function EarningsPanel({ jobs }: { jobs: Job[] }) {
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
          <p className="font-bold text-foreground text-sm">Today's Earnings — {TODAY}</p>
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
              <p className="text-sm font-bold text-primary">Demo cashout preview</p>
              <p className="text-xs text-muted-foreground">
                ${totalEarnings} simulated earnings. No money was transferred.
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-muted/20 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  <Banknote size={15} className="text-primary" />
                  Preview cashout
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Available: <span className="font-bold text-foreground">${totalEarnings}</span>
                  {pendingJobs > 0 && ` · ${pendingJobs} job${pendingJobs > 1 ? 's' : ''} remaining`}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Demo only · no bank account connected
                </p>
              </div>
              <button
                onClick={handleCashout}
                disabled={totalEarnings === 0 || pendingJobs > 0 || cashoutLoading}
                className="flex-shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground disabled:opacity-40 hover:bg-primary/90 transition-colors"
              >
                {cashoutLoading ? (
                  <span className="w-3.5 h-3.5 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />
                ) : (
                  <Zap size={13} />
                )}
                Preview payout
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

// ── Main page ─────────────────────────────────────────────────────────────────

export default function FieldPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [batches, setBatches] = useState<RouteBlock[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const claimedBatchCodes = new Set(batches.filter((batch) => batch.accepted).map((batch) => batch.code));

  useEffect(() => {
    let active = true;
    async function refresh() {
      try {
        const [stored, extras] = await Promise.all([listActiveJobs(), readAddOnRequests()]);
        if (!active) return;
        setBatches(routeBlocks(stored));
        const accepted: Job[] = stored.filter((job): job is StoredJob & { status: Job['status'] } =>
          Boolean(job.acceptedAt) && job.status !== 'cancelled' && job.status !== 'disputed'
        ).map((job) => ({
          ...job, order: job.position, city: '', customerPhone: '',
          batchSize: stored.filter((other) => other.batchCode === job.batchCode).length,
          addOns: extras.filter((extra) => extra.jobId === job.id && extra.status !== 'declined')
            .map((extra) => ({ id: extra.id, label: extra.service, price: extra.price, approved: extra.status === 'approved' })),
        }));
        setJobs(accepted);
        setExpandedId((current) => accepted.some((job) => job.id === current && job.status !== 'complete')
          ? current : accepted.find((job) => job.status !== 'complete')?.id ?? null);
      } catch (error) {
        if (active) setError(error instanceof Error ? error.message : 'Could not load demo jobs.');
      }
    }
    void refresh();
    const unsubscribeJobs = subscribeToJobs(() => { void refresh(); });
    const unsubscribeExtras = subscribeToAddOnRequests(() => { void refresh(); });
    return () => { active = false; unsubscribeJobs(); unsubscribeExtras(); };
  }, []);

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  async function runAction(action: () => Promise<unknown>) {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await action();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Could not save this demo action.');
    } finally {
      setBusy(false);
    }
  }

  function handleAction(jobId: string, action: 'arrive' | 'complete') {
    void runAction(() => updateJob(jobId, { status: action === 'arrive' ? 'arrived' : 'complete' }));
  }

  function handlePhoto(jobId: string, kind: 'beforePhoto' | 'afterPhoto', file: globalThis.File) {
    void runAction(async () => updateJob(jobId, { [kind]: await readDemoPhoto(file) }));
  }

  function handleAddAddOn(jobId: string, item: { label: string; price: number }) {
    void runAction(() => createAddOnRequest({
      id: window.crypto.randomUUID(), jobId, service: item.label, description: 'Optional fixed-price extra requested by your provider.',
      price: item.price, photo: null, status: 'pending', createdAt: new Date().toISOString(),
    }));
  }

  function handleRemoveAddOn(_jobId: string, addOnId: string) {
    void runAction(() => updateAddOnStatus(addOnId, 'declined'));
  }

  function claimBatch(code: string) {
    void runAction(() => acceptRouteBlock(code));
  }

  const completedCount = jobs.filter((j) => j.status === 'complete').length;
  const inProgressJob = jobs.find((j) => j.status === 'in_progress' || j.status === 'arrived');
  const currentJob = inProgressJob ?? jobs.find((j) => j.status !== 'complete');
  const completedJobs = jobs.filter((j) => j.status === 'complete');

  return (
    <>
      <Helmet>
        <title>Field App — Blokpakt Provider</title>
        <meta name="description" content="Blokpakt provider field execution app — route dispatch, photo verification, add-ons, and earnings." />
        <link rel="canonical" href="https://blokpakt.com/field" />
        <meta name="robots" content="noindex" />
      </Helmet>

      <main className="min-h-screen bg-muted/30 pb-12">
        <h1 className="sr-only">Provider Field Execution App — Blokpakt</h1>

        <header className="sticky top-0 z-30 border-b border-border bg-card shadow-sm">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2.5">
              <img src="/assets/blokpakt-bp-mark.svg" alt="Blokpakt" className="h-8 w-8" />
              <p className="text-sm font-extrabold text-foreground">Field Dispatch</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground">Provider demo</span>
              <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                {completedCount}/{jobs.length} done
              </div>
              {inProgressJob && (
                <span className="flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                  Active
                </span>
              )}
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-6xl px-4 pt-4">
          <p className="text-sm text-muted-foreground">Browser-only demo. Bookings, photos and progress survive reloads in this tab. No live dispatch or payments.</p>
          <Link to="/book" className="text-sm font-bold text-primary">Create a customer booking</Link>
          {error && <p role="alert" className="mt-2 text-sm text-destructive">{error}</p>}
          {busy && <p role="status" className="mt-2 text-sm text-muted-foreground">Saving...</p>}
        </div>
        <div aria-busy={busy} className="mx-auto grid max-w-6xl gap-5 px-4 pt-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)]">
          <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
            <div className="mb-4">
              <p className="text-xs font-bold uppercase tracking-wider text-primary">Active job</p>
              <h2 className="mt-1 text-xl font-extrabold text-foreground">{currentJob ? `Stop ${currentJob.order} of ${jobs.length}` : 'No active jobs'}</h2>
            </div>
            {completedJobs.map((job) => <JobCard key={job.id} job={job} expanded={false} onToggle={() => undefined} onAction={handleAction} onPhoto={handlePhoto} onAddAddOn={handleAddAddOn} onRemoveAddOn={handleRemoveAddOn} />)}
            {currentJob ? (
              <div className="space-y-3">
                <JobCard key={currentJob.id} job={currentJob} expanded={expandedId === currentJob.id} onToggle={() => toggleExpand(currentJob.id)} onAction={handleAction} onPhoto={handlePhoto} onAddAddOn={handleAddAddOn} onRemoveAddOn={handleRemoveAddOn} />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Claim an available route to start a new job.</p>
            )}
          </section>

          <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
            <AvailableRoutesPanel batches={batches} claimedCodes={claimedBatchCodes} onClaim={claimBatch} />
          </section>
          <section className="lg:col-span-2"><EarningsPanel jobs={jobs} /></section>
        </div>
      </main>
    </>
  );
}
