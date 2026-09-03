import { useState, useRef } from 'react';
import { Helmet } from '@dr.pogodin/react-helmet';
import { motion, AnimatePresence } from 'motion/react';
import { field } from 'virtual:content';
import {
  MapPin, Clock, Camera, CheckCircle,
  Zap, Plus, X, AlertCircle, ArrowRight,
  Navigation, Phone, MessageSquare, TrendingUp, Banknote,
  ChevronDown, ChevronUp, Lock, Unlock
} from 'lucide-react';

// ── Demo data ─────────────────────────────────────────────────────────────────
const TODAY = 'Wed, Sep 2';

interface Job {
  id: string;
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
  pin: { lat: number; lng: number };
}

interface AddOn {
  id: string;
  label: string;
  price: number;
  approved: boolean;
}

const INITIAL_JOBS: Job[] = [
  {
    id: 'j1',
    order: 1,
    status: 'complete',
    service: 'Lawn Care',
    serviceIcon: '🌿',
    address: '112 Maple Ave',
    city: 'Springfield, IL',
    zip: '62701',
    gateCode: null,
    propertyNotes: 'Side gate unlocked. Avoid flower bed on left.',
    customerName: 'Sarah Chen',
    customerPhone: '(312) 555-0141',
    batchSize: 4,
    payout: 36,
    estimatedDuration: '45 min',
    arrivedAt: '8:02 AM',
    completedAt: '8:51 AM',
    beforePhoto: 'before',
    afterPhoto: 'after',
    addOns: [{ id: 'a1', label: 'Fertilizer application', price: 35, approved: true }],
    pin: { lat: 39.7817, lng: -89.6501 },
  },
  {
    id: 'j2',
    order: 2,
    status: 'in_progress',
    service: 'Lawn Care',
    serviceIcon: '🌿',
    address: '247 Oak Street',
    city: 'Springfield, IL',
    zip: '62701',
    gateCode: '#4821',
    propertyNotes: 'Dog in backyard — keep gate closed.',
    customerName: 'Alex Johnson',
    customerPhone: '(312) 555-0100',
    batchSize: 4,
    payout: 36,
    estimatedDuration: '40 min',
    arrivedAt: '9:05 AM',
    completedAt: null,
    beforePhoto: 'before',
    afterPhoto: null,
    addOns: [],
    pin: { lat: 39.7820, lng: -89.6498 },
  },
  {
    id: 'j3',
    order: 3,
    status: 'pending',
    service: 'Lawn Care',
    serviceIcon: '🌿',
    address: '389 Elm Drive',
    city: 'Springfield, IL',
    zip: '62701',
    gateCode: null,
    propertyNotes: '',
    customerName: 'Marcus Brown',
    customerPhone: '(312) 555-0188',
    batchSize: 4,
    payout: 36,
    estimatedDuration: '35 min',
    arrivedAt: null,
    completedAt: null,
    beforePhoto: null,
    afterPhoto: null,
    addOns: [],
    pin: { lat: 39.7825, lng: -89.6492 },
  },
  {
    id: 'j4',
    order: 4,
    status: 'pending',
    service: 'Gutter Cleaning',
    serviceIcon: '🏠',
    address: '501 Pine Court',
    city: 'Springfield, IL',
    zip: '62701',
    gateCode: '#0099',
    propertyNotes: '2-story home. Bring tall ladder.',
    customerName: 'Linda Park',
    customerPhone: '(312) 555-0155',
    batchSize: 3,
    payout: 130,
    estimatedDuration: '60 min',
    arrivedAt: null,
    completedAt: null,
    beforePhoto: null,
    afterPhoto: null,
    addOns: [],
    pin: { lat: 39.7830, lng: -89.6485 },
  },
];

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'text-muted-foreground', bg: 'bg-muted', dot: 'bg-muted-foreground' },
  en_route: { label: 'En Route', color: 'text-blue-600', bg: 'bg-blue-50', dot: 'bg-blue-500' },
  arrived: { label: 'Arrived', color: 'text-amber-600', bg: 'bg-amber-50', dot: 'bg-amber-500' },
  in_progress: { label: 'In Progress', color: 'text-accent', bg: 'bg-accent/10', dot: 'bg-accent' },
  complete: { label: 'Complete', color: 'text-primary', bg: 'bg-primary/10', dot: 'bg-primary' },
};

function now() {
  return new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

// ── Sub-components ────────────────────────────────────────────────────────────

function PhotoSlot({
  label,
  hasPhoto,
  onCapture,
}: {
  label: string;
  hasPhoto: boolean;
  onCapture: () => void;
}) {
  return (
    <button
      onClick={onCapture}
      className={`flex-1 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 py-5 transition-all ${
        hasPhoto
          ? 'border-primary bg-primary/5 text-primary'
          : 'border-border bg-muted/30 text-muted-foreground hover:border-primary/40'
      }`}
    >
      {hasPhoto ? (
        <>
          <CheckCircle size={22} className="text-primary" />
          <span className="text-xs font-semibold text-primary">{label} ✓</span>
        </>
      ) : (
        <>
          <Camera size={22} />
          <span className="text-xs font-semibold">{label}</span>
          <span className="text-xs text-muted-foreground">Tap to capture</span>
        </>
      )}
    </button>
  );
}

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
                        <button onClick={() => onRemove(a.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground mb-2 font-medium">Quick-add catalog</p>
              <div className="grid grid-cols-2 gap-2">
                {field.ADDON_CATALOG.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => onAdd(item)}
                    className="text-left rounded-lg border border-border bg-background px-3 py-2 hover:border-accent/50 hover:bg-accent/5 transition-all"
                  >
                    <p className="text-xs font-semibold text-foreground leading-tight">{item.label}</p>
                    <p className="text-xs text-accent font-bold mt-0.5">+${item.price}</p>
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
  onAction: (jobId: string, action: 'arrive' | 'start' | 'complete') => void;
  onPhoto: (jobId: string, type: 'before' | 'after') => void;
  onAddAddOn: (jobId: string, item: { label: string; price: number }) => void;
  onRemoveAddOn: (jobId: string, addOnId: string) => void;
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

              {/* Photo upload — show when arrived or in_progress or complete */}
              {(job.status === 'arrived' || job.status === 'in_progress' || job.status === 'complete') && (
                <div>
                  <p className="text-xs font-semibold text-foreground mb-2">Photo verification</p>
                  <div className="flex gap-3">
                    <PhotoSlot
                      label="Before"
                      hasPhoto={!!job.beforePhoto}
                      onCapture={() => onPhoto(job.id, 'before')}
                    />
                    <PhotoSlot
                      label="After"
                      hasPhoto={!!job.afterPhoto}
                      onCapture={() => onPhoto(job.id, 'after')}
                    />
                  </div>
                  {job.status !== 'complete' && !job.afterPhoto && (
                    <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                      <Lock size={10} />
                      After photo required to mark complete
                    </p>
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
                    disabled={!job.beforePhoto || !job.afterPhoto}
                    className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-40 hover:bg-primary/90 transition-colors"
                  >
                    <CheckCircle size={16} />
                    {!job.beforePhoto || !job.afterPhoto
                      ? 'Upload both photos to complete'
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

function EarningsPanel({ jobs }: { jobs: Job[] }) {
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
    setTimeout(() => {
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
              <p className="text-sm font-bold text-primary">Cashout initiated!</p>
              <p className="text-xs text-muted-foreground">
                ${totalEarnings} sent to your bank via Stripe Connect. Arrives in 1–2 business days.
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
                  Stripe Connect · 1% fee · arrives in minutes
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

// ── Main page ─────────────────────────────────────────────────────────────────

export default function FieldPage() {
  const [jobs, setJobs] = useState<Job[]>(INITIAL_JOBS);
  const [expandedId, setExpandedId] = useState<string | null>('j2');
  const [activeTab, setActiveTab] = useState<'route' | 'earnings'>('route');
  const addOnCounter = useRef(100);

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  function handleAction(jobId: string, action: 'arrive' | 'start' | 'complete') {
    setJobs((prev) =>
      prev.map((j) => {
        if (j.id !== jobId) return j;
        if (action === 'arrive') return { ...j, status: 'arrived', arrivedAt: now() };
        if (action === 'start') return { ...j, status: 'in_progress' };
        if (action === 'complete') return { ...j, status: 'complete', completedAt: now() };
        return j;
      }),
    );
  }

  function handlePhoto(jobId: string, type: 'before' | 'after') {
    setJobs((prev) =>
      prev.map((j) => {
        if (j.id !== jobId) return j;
        return { ...j, [type === 'before' ? 'beforePhoto' : 'afterPhoto']: 'captured' };
      }),
    );
  }

  function handleAddAddOn(jobId: string, item: { label: string; price: number }) {
    addOnCounter.current += 1;
    setJobs((prev) =>
      prev.map((j) => {
        if (j.id !== jobId) return j;
        if (j.addOns.some((a) => a.label === item.label)) return j;
        return {
          ...j,
          addOns: [
            ...j.addOns,
            { id: `ao${addOnCounter.current}`, label: item.label, price: item.price, approved: true },
          ],
        };
      }),
    );
  }

  function handleRemoveAddOn(jobId: string, addOnId: string) {
    setJobs((prev) =>
      prev.map((j) => {
        if (j.id !== jobId) return j;
        return { ...j, addOns: j.addOns.filter((a) => a.id !== addOnId) };
      }),
    );
  }

  const completedCount = jobs.filter((j) => j.status === 'complete').length;
  const inProgressJob = jobs.find((j) => j.status === 'in_progress' || j.status === 'arrived');

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
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Provider App</p>
              <p className="text-sm font-bold text-foreground">Marcus Thompson · {TODAY}</p>
            </div>
            <div className="flex items-center gap-2">
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

          {/* Tab switcher */}
          <div className="max-w-lg mx-auto px-4 pb-3 flex gap-2">
            {(['route', 'earnings'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === tab
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {tab === 'route' ? '📍 Route' : '💰 Earnings'}
              </button>
            ))}
          </div>
        </div>

        <div className="max-w-lg mx-auto px-4 pt-5 space-y-4">
          {/* Demo banner */}
          <div className="flex items-center gap-2 rounded-xl border border-accent/30 bg-accent/5 px-4 py-2.5 text-sm text-accent font-medium">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse flex-shrink-0" />
            Demo mode — tap job cards to expand, use action buttons to advance status.
          </div>

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
                {/* Route summary strip */}
                <div className="rounded-xl border border-border bg-card px-4 py-3 flex items-center gap-4 overflow-x-auto">
                  {jobs.map((j, i) => (
                    <div key={j.id} className="flex items-center gap-2 flex-shrink-0">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                        j.status === 'complete' ? 'bg-primary text-primary-foreground' :
                        j.status === 'in_progress' || j.status === 'arrived' ? 'bg-accent text-white' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {j.status === 'complete' ? '✓' : j.order}
                      </div>
                      {i < jobs.length - 1 && (
                        <ArrowRight size={12} className="text-muted-foreground" />
                      )}
                    </div>
                  ))}
                  <div className="ml-auto flex-shrink-0 text-xs text-muted-foreground">
                    ~{jobs.reduce((s, j) => s + parseInt(j.estimatedDuration), 0)} min total
                  </div>
                </div>

                {/* Job cards */}
                {jobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    expanded={expandedId === job.id}
                    onToggle={() => toggleExpand(job.id)}
                    onAction={handleAction}
                    onPhoto={handlePhoto}
                    onAddAddOn={handleAddAddOn}
                    onRemoveAddOn={handleRemoveAddOn}
                  />
                ))}
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
          </AnimatePresence>
        </div>
      </main>
    </>
  );
}
