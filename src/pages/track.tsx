import { useState, useEffect, type ReactNode } from 'react';
import { track } from 'virtual:content';
import { Helmet } from '@dr.pogodin/react-helmet';
import { motion, AnimatePresence } from 'motion/react';
import {
  Share2,
  MapPin,
  Clock,
  CheckCircle,
  AlertTriangle,
  MessageSquare,
  Users,
  Zap,
  ChevronRight,
  X,
  Bell,
  Plus,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────
type JobStatus = 'scheduled' | 'en_route' | 'arrived' | 'in_progress' | 'completed' | 'disputed';

interface AddOnRequest {
  id: string;
  service: string;
  price: number;
  note: string;
}

// ── Mock data ─────────────────────────────────────────────────────────────────
const MOCK_JOB = {
  id: 'BLK-20240912-0042',
  service: 'Lawn Care — Street Batch',
  address: '247 Oak Street, Springfield, IL',
  scheduledWindow: 'Thursday 8am–12pm',
  contractorName: 'Marcus T.',
  batchCount: 4,
  batchStreet: 'Oak Street',
  status: 'en_route' as JobStatus,
  estimatedArrival: '9:15 AM',
  referralCode: 'OAK-2024',
  referralSavings: 18,
  neighborsSaved: 3,
};

const STATUS_STEPS: { key: JobStatus; label: string }[] = [
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'en_route', label: 'Contractor en route' },
  { key: 'arrived', label: 'Arrived' },
  { key: 'in_progress', label: 'In progress' },
  { key: 'completed', label: 'Completed' },
];

const MOCK_ADDONS: AddOnRequest[] = [
  { id: 'ao1', service: 'Edge trimming — driveway border', price: 25, note: 'Contractor noticed overgrowth along your driveway edge.' },
  { id: 'ao2', service: 'Bag & haul clippings', price: 15, note: 'Clippings are heavy today — bagging recommended.' },
];

// ── Share hub component ───────────────────────────────────────────────────────
function ShareHub({ referralCode, batchStreet, savings }: { referralCode: string; batchStreet: string; savings: number }) {
  const [copied, setCopied] = useState(false);
  const shareText = `I just booked lawn care on Blokpakt — if you're on ${batchStreet}, use my code ${referralCode} and we both save $${savings}! blokpakt.com/book`;

  function copyCode() {
    navigator.clipboard.writeText(referralCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 mb-1">
        <Share2 size={16} className="text-accent" />
        <p className="text-sm font-bold text-foreground">Invite neighbors — you both save</p>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Every neighbor who books with your code locks in the batch rate for the whole street.
      </p>
      <div className="flex items-center gap-2 mb-4">
        <div className="flex-1 rounded-lg border border-dashed border-primary/40 bg-primary/5 px-4 py-2.5 text-center">
          <p className="text-xs text-muted-foreground mb-0.5">Your referral code</p>
          <p className="text-lg font-extrabold tracking-widest text-primary">{referralCode}</p>
        </div>
        <button
          onClick={copyCode}
          className="rounded-lg border border-border px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <a
          href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-3 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
        >
          <span className="text-xl">💬</span>
          WhatsApp
        </a>
        <a
          href={`https://nextdoor.com/news_feed/?post=${encodeURIComponent(shareText)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-3 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
        >
          <span className="text-xl">🏘️</span>
          Nextdoor
        </a>
        <a
          href={`sms:?body=${encodeURIComponent(shareText)}`}
          className="flex flex-col items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-3 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
        >
          <span className="text-xl">📱</span>
          SMS
        </a>
      </div>
      <div className="mt-3 flex items-center gap-2 rounded-lg bg-accent/10 px-3 py-2">
        <Users size={12} className="text-accent flex-shrink-0" />
        <p className="text-xs text-accent font-medium">
          3 neighbors already saved using your code this month
        </p>
      </div>
    </div>
  );
}

// ── Add-on approval modal ─────────────────────────────────────────────────────
function AddOnModal({
  addon,
  onApprove,
  onDecline,
}: {
  addon: AddOnRequest;
  onApprove: (id: string) => void;
  onDecline: (id: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50"
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1, transition: { duration: 0.25, ease: 'easeOut' as const } }}
        exit={{ y: 40, opacity: 0 }}
        className="w-full max-w-sm rounded-2xl bg-card border border-border shadow-xl p-6"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10">
              <Plus size={16} className="text-accent" />
            </span>
            <p className="text-sm font-bold text-foreground">Add-on request</p>
          </div>
          <button onClick={() => onDecline(addon.id)} className="text-muted-foreground hover:text-foreground" aria-label="Dismiss">
            <X size={18} />
          </button>
        </div>
        <div className="rounded-xl border border-border bg-muted/30 p-4 mb-4">
          <p className="text-sm font-semibold text-foreground mb-1">{addon.service}</p>
          <p className="text-xs text-muted-foreground mb-3">{addon.note}</p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Additional charge</span>
            <span className="text-lg font-extrabold text-foreground">+${addon.price}</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Your contractor is on-site and requesting approval. Approving adds this to your Stripe authorization hold.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onDecline(addon.id)}
            className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
          >
            Decline
          </button>
          <button
            onClick={() => onApprove(addon.id)}
            className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Approve +${addon.price}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Status banner ─────────────────────────────────────────────────────────────
function StatusBanner({ status, eta }: { status: JobStatus; eta: string }) {
  const config: Record<JobStatus, { color: string; bg: string; icon: ReactNode; label: string; sub: string }> = {
    scheduled: { color: 'text-primary', bg: 'bg-primary/10 border-primary/20', icon: <Clock size={18} />, label: 'Job scheduled', sub: 'Your contractor has confirmed the booking.' },
    en_route: { color: 'text-accent', bg: 'bg-accent/10 border-accent/20', icon: <MapPin size={18} />, label: `Contractor en route — ETA ${eta}`, sub: 'Marcus T. is on the way to your property.' },
    arrived: { color: 'text-primary', bg: 'bg-primary/10 border-primary/20', icon: <CheckCircle size={18} />, label: 'Contractor has arrived', sub: 'Work is about to begin.' },
    in_progress: { color: 'text-accent', bg: 'bg-accent/10 border-accent/20', icon: <Zap size={18} />, label: 'Job in progress', sub: 'Your contractor is working on your property now.' },
    completed: { color: 'text-primary', bg: 'bg-primary/10 border-primary/20', icon: <CheckCircle size={18} />, label: 'Job completed', sub: 'Before & after photos uploaded. Payment will be captured shortly.' },
    disputed: { color: 'text-destructive', bg: 'bg-destructive/10 border-destructive/20', icon: <AlertTriangle size={18} />, label: 'Dispute under review', sub: 'Payment capture is frozen. Our team is reviewing your case.' },
  };
  const c = config[status];
  return (
    <motion.div key={status} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className={`rounded-xl border px-4 py-3 flex items-start gap-3 ${c.bg}`}>
      <span className={`mt-0.5 flex-shrink-0 ${c.color}`}>{c.icon}</span>
      <div>
        <p className={`text-sm font-bold ${c.color}`}>{c.label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{c.sub}</p>
      </div>
    </motion.div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function TrackPage() {
  const job = MOCK_JOB;
  const [currentStatus, setCurrentStatus] = useState<JobStatus>(job.status);
  const [pendingAddons, setPendingAddons] = useState<AddOnRequest[]>(MOCK_ADDONS);
  const [activeAddon, setActiveAddon] = useState<AddOnRequest | null>(null);
  const [approvedAddons, setApprovedAddons] = useState<string[]>([]);
  const [showDispute, setShowDispute] = useState(false);
  const [disputeFiled, setDisputeFiled] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeDetails, setDisputeDetails] = useState('');
  const [disputeSubmitted, setDisputeSubmitted] = useState(false);

  useEffect(() => {
    if (pendingAddons.length > 0) {
      const t = setTimeout(() => setActiveAddon(pendingAddons[0]), 2000);
      return () => clearTimeout(t);
    }
  }, []);

  function handleApproveAddon(id: string) {
    setApprovedAddons((prev) => [...prev, id]);
    setPendingAddons((prev) => prev.filter((a) => a.id !== id));
    setActiveAddon(null);
  }

  function handleDeclineAddon(id: string) {
    setPendingAddons((prev) => prev.filter((a) => a.id !== id));
    setActiveAddon(null);
  }

  function handleDisputeSubmit() {
    if (!disputeReason) return;
    setDisputeSubmitted(true);
    setTimeout(() => {
      setShowDispute(false);
      setDisputeFiled(true);
      setCurrentStatus('disputed');
      setDisputeSubmitted(false);
    }, 1800);
  }

  const currentStepIndex = STATUS_STEPS.findIndex((s) => s.key === currentStatus);

  return (
    <>
      <Helmet>
        <title>Track Your Job — Blokpakt</title>
        <meta name="description" content="Track your Blokpakt service job in real time. See contractor status, approve on-site add-ons, share your referral code, and flag any issues within 48 hours." />
        <link rel="canonical" href="https://blokpakt.com/track" />
      </Helmet>

      {/* Add-on modal */}
      <AnimatePresence>
        {activeAddon && (
          <AddOnModal addon={activeAddon} onApprove={handleApproveAddon} onDecline={handleDeclineAddon} />
        )}
      </AnimatePresence>

      {/* Dispute modal */}
      <AnimatePresence>
        {showDispute && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50"
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1, transition: { duration: 0.25, ease: 'easeOut' as const } }}
              exit={{ y: 40, opacity: 0 }}
              className="w-full max-w-md rounded-2xl bg-card border border-border shadow-xl p-6"
            >
              {disputeSubmitted ? (
                <div className="text-center py-6">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                    <CheckCircle size={28} className="text-primary" />
                  </div>
                  <p className="text-base font-bold text-foreground mb-2">Dispute filed</p>
                  <p className="text-sm text-muted-foreground">Payment capture is frozen for 48 hours while we review. You'll hear from us within 4 hours.</p>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-destructive/10">
                        <AlertTriangle size={16} className="text-destructive" />
                      </span>
                      <div>
                        <p className="text-sm font-bold text-foreground">Flag an issue</p>
                        <p className="text-xs text-muted-foreground">48-hour dispute window</p>
                      </div>
                    </div>
                    <button onClick={() => setShowDispute(false)} className="text-muted-foreground hover:text-foreground">
                      <X size={18} />
                    </button>
                  </div>
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-foreground mb-2">What went wrong?</p>
                    <div className="grid grid-cols-1 gap-2">
                      {track.reasons.map((r) => (
                        <button
                          key={r}
                          onClick={() => setDisputeReason(r)}
                          className={`text-left rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                            disputeReason === r
                              ? 'border-destructive bg-destructive/5 text-destructive'
                              : 'border-border text-foreground hover:border-destructive/40'
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mb-5">
                    <p className="text-xs font-semibold text-foreground mb-1.5">Additional details</p>
                    <textarea
                      value={disputeDetails}
                      onChange={(e) => setDisputeDetails(e.target.value)}
                      placeholder="Describe the issue in detail…"
                      rows={3}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-destructive/30 resize-none"
                    />
                  </div>
                  <div className="rounded-lg bg-muted/40 border border-border px-3 py-2 mb-4 text-xs text-muted-foreground">
                    Filing a dispute immediately freezes the Stripe payment capture. Our team reviews within 4 hours using contractor photo proof.
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setShowDispute(false)} className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors">
                      Cancel
                    </button>
                    <button
                      disabled={!disputeReason}
                      onClick={handleDisputeSubmit}
                      className="rounded-xl bg-destructive px-4 py-2.5 text-sm font-bold text-white disabled:opacity-40 hover:bg-destructive/90 transition-colors"
                    >
                      File dispute
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="min-h-screen bg-muted/30 py-10 lg:py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">

          {/* Page header */}
          <div className="mb-8">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Booking {job.id}</p>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">{job.service}</h1>
                <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                  <MapPin size={13} />
                  {job.address}
                </p>
              </div>
              {!disputeFiled && currentStatus === 'completed' && (
                <button
                  onClick={() => setShowDispute(true)}
                  className="inline-flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-2 text-sm font-semibold text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <AlertTriangle size={14} />
                  Flag an issue
                </button>
              )}
            </div>
          </div>

          {/* Status banner */}
          <div className="mb-6">
            <StatusBanner status={currentStatus} eta={job.estimatedArrival} />
          </div>

          {/* Progress stepper */}
          <div className="bg-card rounded-xl border border-border p-5 mb-6">
            <p className="text-xs font-semibold text-muted-foreground mb-4">Job progress</p>
            <div className="flex items-center">
              {STATUS_STEPS.map((step, i) => {
                const done = i < currentStepIndex;
                const active = i === currentStepIndex;
                return (
                  <div key={step.key} className="flex items-center flex-1 min-w-0">
                    <div className="flex flex-col items-center flex-shrink-0">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${done ? 'bg-primary text-primary-foreground' : active ? 'bg-accent text-white ring-4 ring-accent/20' : 'bg-muted text-muted-foreground border border-border'}`}>
                        {done ? <CheckCircle size={13} /> : i + 1}
                      </div>
                      <p className={`mt-1.5 text-[10px] font-medium text-center leading-tight max-w-[60px] hidden sm:block ${active ? 'text-accent' : done ? 'text-primary' : 'text-muted-foreground'}`}>
                        {step.label}
                      </p>
                    </div>
                    {i < STATUS_STEPS.length - 1 && (
                      <div className={`flex-1 h-px mx-1 mb-4 transition-all ${i < currentStepIndex ? 'bg-primary' : 'bg-border'}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Two-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* ── Left column ── */}
            <div className="flex flex-col gap-6">

              {/* Activity timeline — content from virtual:content */}
              <div className="bg-card rounded-xl border border-border p-5">
                <p className="text-sm font-bold text-foreground mb-4">Activity timeline</p>
                <div className="relative">
                  <div className="absolute left-3 top-0 bottom-0 w-px bg-border" />
                  <div className="flex flex-col gap-4">
                    {track.MOCK_UPDATES.map((u, i) => (
                      <div key={u.id} className="flex items-start gap-4 pl-8 relative">
                        <div className={`absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${u.done ? 'bg-primary' : 'bg-muted border border-border'}`}>
                          {u.done
                            ? <CheckCircle size={12} className="text-primary-foreground" />
                            : <Clock size={11} className="text-muted-foreground" />
                          }
                        </div>
                        <div>
                          <p className={`text-xs font-semibold ${u.done ? 'text-foreground' : 'text-muted-foreground'}`}>{u.label}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{u.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Approved add-ons */}
              {approvedAddons.length > 0 && (
                <div className="bg-card rounded-xl border border-border p-5">
                  <p className="text-sm font-bold text-foreground mb-3">Approved add-ons</p>
                  {MOCK_ADDONS.filter((a) => approvedAddons.includes(a.id)).map((a) => (
                    <div key={a.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div className="flex items-center gap-2">
                        <CheckCircle size={13} className="text-primary flex-shrink-0" />
                        <p className="text-xs font-medium text-foreground">{a.service}</p>
                      </div>
                      <p className="text-xs font-bold text-foreground">+${a.price}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Pending add-on notification */}
              {pendingAddons.length > 0 && !activeAddon && (
                <button
                  onClick={() => setActiveAddon(pendingAddons[0])}
                  className="flex items-center gap-3 rounded-xl border border-accent/30 bg-accent/5 p-4 text-left hover:bg-accent/10 transition-colors"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20 flex-shrink-0">
                    <Bell size={14} className="text-accent" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-accent">Add-on request pending</p>
                    <p className="text-xs text-muted-foreground truncate">{pendingAddons[0].service}</p>
                  </div>
                  <ChevronRight size={14} className="text-accent flex-shrink-0" />
                </button>
              )}

              {/* Dispute trigger (during active job) */}
              {!disputeFiled && currentStatus !== 'completed' && currentStatus !== 'disputed' && (
                <button
                  onClick={() => setShowDispute(true)}
                  className="flex items-center gap-3 rounded-xl border border-border p-4 text-left hover:bg-muted transition-colors"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted flex-shrink-0">
                    <AlertTriangle size={14} className="text-muted-foreground" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-foreground">Something wrong?</p>
                    <p className="text-xs text-muted-foreground">Flag an issue — freezes payment capture for 48 hours</p>
                  </div>
                </button>
              )}
            </div>

            {/* ── Right column ── */}
            <div className="flex flex-col gap-6">

              {/* Share hub */}
              <ShareHub referralCode={job.referralCode} batchStreet={job.batchStreet} savings={job.referralSavings} />

              {/* Neighborhood zone map — homes from virtual:content */}
              <div className="rounded-xl border border-border bg-muted/30 overflow-hidden">
                <div className="px-4 pt-4 pb-2 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{job.batchStreet} batch zone</p>
                    <p className="text-xs text-muted-foreground mt-0.5">4 homes booked · 4 spots open</p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                    <Zap size={10} />
                    Batch active
                  </span>
                </div>
                <svg viewBox="0 0 420 200" className="w-full" aria-label="Neighborhood zone map">
                  <rect x="0" y="90" width="420" height="20" fill="hsl(var(--muted))" />
                  <text x="210" y="103" textAnchor="middle" fontSize="9" fill="hsl(var(--muted-foreground))" fontFamily="sans-serif">
                    {job.batchStreet}
                  </text>
                  {track.homes.map((h) => (
                    <g key={h.id}>
                      <rect
                        x={h.x - 24}
                        y={h.y < 90 ? h.y : h.y + 10}
                        width={48}
                        height={36}
                        rx={4}
                        fill={h.active ? 'hsl(var(--accent))' : h.booked ? 'hsl(var(--primary))' : 'hsl(var(--card))'}
                        stroke={h.booked ? 'hsl(var(--primary))' : 'hsl(var(--border))'}
                        strokeWidth={h.active ? 2.5 : 1.5}
                        opacity={h.booked ? 1 : 0.5}
                      />
                      <polygon
                        points={`${h.x - 28},${h.y < 90 ? h.y : h.y + 10} ${h.x + 28},${h.y < 90 ? h.y : h.y + 10} ${h.x},${h.y < 90 ? h.y - 14 : h.y - 4}`}
                        fill={h.active ? 'hsl(var(--accent))' : h.booked ? 'hsl(var(--primary))' : 'hsl(var(--muted))'}
                        opacity={h.booked ? 0.7 : 0.4}
                      />
                      <text
                        x={h.x}
                        y={h.y < 90 ? h.y + 22 : h.y + 32}
                        textAnchor="middle"
                        fontSize="8"
                        fill={h.booked ? 'white' : 'hsl(var(--muted-foreground))'}
                        fontFamily="sans-serif"
                        fontWeight={h.active ? 'bold' : 'normal'}
                      >
                        {h.label}
                      </text>
                    </g>
                  ))}
                  <rect x="10" y="170" width="10" height="10" rx="2" fill="hsl(var(--accent))" />
                  <text x="24" y="179" fontSize="8" fill="hsl(var(--muted-foreground))" fontFamily="sans-serif">You</text>
                  <rect x="60" y="170" width="10" height="10" rx="2" fill="hsl(var(--primary))" />
                  <text x="74" y="179" fontSize="8" fill="hsl(var(--muted-foreground))" fontFamily="sans-serif">Booked</text>
                  <rect x="120" y="170" width="10" height="10" rx="2" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="1" opacity="0.5" />
                  <text x="134" y="179" fontSize="8" fill="hsl(var(--muted-foreground))" fontFamily="sans-serif">Available</text>
                </svg>
              </div>

              {/* Batch stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-border bg-card p-3 text-center">
                  <span className="text-primary flex justify-center mb-1"><Users size={14} /></span>
                  <p className="text-lg font-extrabold text-foreground">{job.batchCount}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight">Homes in batch</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-3 text-center">
                  <span className="text-primary flex justify-center mb-1"><Zap size={14} /></span>
                  <p className="text-lg font-extrabold text-foreground">${job.referralSavings}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight">Your savings</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-3 text-center">
                  <span className="text-primary flex justify-center mb-1"><MessageSquare size={14} /></span>
                  <p className="text-lg font-extrabold text-foreground">{job.neighborsSaved}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight">Neighbors saved</p>
                </div>
              </div>

              {/* Dev: status switcher */}
              <div className="rounded-xl border border-dashed border-border p-4">
                <p className="text-xs font-semibold text-muted-foreground mb-2">Preview: change status</p>
                <div className="flex flex-wrap gap-2">
                  {STATUS_STEPS.map((s) => (
                    <button
                      key={s.key}
                      onClick={() => setCurrentStatus(s.key)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${currentStatus === s.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>
    </>
  );
}
