import { useState, useEffect, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router';
import { getJobByCode, listJobsByBatchCode, subscribeToJobs, type Job } from '../lib/jobs';
import { readDemoPhoto } from '../lib/demo-photo';
import { track } from 'virtual:content';
import { readAddOnRequests, subscribeToAddOnRequests, updateAddOnStatus, type AddOnRequest } from '../lib/add-on-workflow';
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
type JobStatus = 'scheduled' | 'en_route' | 'arrived' | 'in_progress' | 'completed' | 'disputed' | 'cancelled';

// ── Mock data ─────────────────────────────────────────────────────────────────
const STATUS_STEPS: { key: JobStatus; label: string }[] = [
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'en_route', label: 'Contractor en route' },
  { key: 'arrived', label: 'Arrived' },
  { key: 'in_progress', label: 'In progress' },
  { key: 'completed', label: 'Completed' },
];

// ── Share hub component ───────────────────────────────────────────────────────
function ShareHub({ referralCode, batchStreet }: { referralCode: string; batchStreet: string }) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState('');
  const batchUrl = `https://blokpakt.com/book?batch=${encodeURIComponent(referralCode)}`;
  const shareText = `Try the Blokpakt neighborhood booking demo for ${batchStreet}.\n\n${batchUrl}\nThis is a prototype, not a confirmed service invitation.`;

  function copyCode() {
    if (!navigator.clipboard) {
      setCopyError('Clipboard unavailable. Select and copy the code below.');
      return;
    }
    navigator.clipboard.writeText(referralCode).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }).catch(() => setCopyError('Could not copy. Select and copy the code below.'));
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 mb-1">
        <Share2 size={16} className="text-accent" />
        <p className="text-sm font-bold text-foreground">Preview a neighbor invitation</p>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Demo data is private to this tab. Shared links open the booking form, not your saved jobs.
      </p>
      <div className="flex items-center gap-2 mb-4">
        <div className="flex-1 rounded-lg border border-dashed border-primary/40 bg-primary/5 px-4 py-2.5 text-center">
          <p className="text-xs text-muted-foreground mb-0.5">Your referral code</p>
          <p className="text-lg font-extrabold tracking-widest text-primary">{referralCode}</p>
        </div>
        {copyError && <p role="alert" className="mb-2 text-xs text-destructive">{copyError}</p>}
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
          Matching uses street, service and date, not the referral code alone.
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
          <p className="text-xs text-muted-foreground mb-3">{addon.description || 'Your contractor added a service after inspecting the property.'}</p>
          {addon.photo && <img src={addon.photo} alt="Area photographed by contractor" className="mb-3 max-h-44 w-full rounded-lg object-cover" />}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Additional charge</span>
            <span className="text-lg font-extrabold text-foreground">+${addon.price}</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Your contractor is requesting approval. This demo records your choice only; no payment or authorization is made.
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
    scheduled: { color: 'text-primary', bg: 'bg-primary/10 border-primary/20', icon: <Clock size={18} />, label: 'Demo booking scheduled', sub: 'See provider acceptance and your requested date below.' },
    en_route: { color: 'text-accent', bg: 'bg-accent/10 border-accent/20', icon: <MapPin size={18} />, label: `Contractor en route — ${eta}`, sub: 'Status updated from the provider demo.' },
    arrived: { color: 'text-primary', bg: 'bg-primary/10 border-primary/20', icon: <CheckCircle size={18} />, label: 'Contractor has arrived', sub: 'Work is about to begin.' },
    in_progress: { color: 'text-accent', bg: 'bg-accent/10 border-accent/20', icon: <Zap size={18} />, label: 'Job in progress', sub: 'Your contractor is working on your property now.' },
    completed: { color: 'text-primary', bg: 'bg-primary/10 border-primary/20', icon: <CheckCircle size={18} />, label: 'Demo job completed', sub: 'Before and after photos saved. No payment was captured.' },
    disputed: { color: 'text-destructive', bg: 'bg-destructive/10 border-destructive/20', icon: <AlertTriangle size={18} />, label: 'Demo issue preview', sub: 'No report has been sent and no payment is affected.' },
    cancelled: { color: 'text-muted-foreground', bg: 'bg-muted border-border', icon: <AlertTriangle size={18} />, label: 'Booking cancelled', sub: 'This demo booking is no longer active.' },
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
  const [searchParams] = useSearchParams();
  const code = searchParams.get('code') ?? 'BLK-DEMO1';
  const [storedJob, setStoredJob] = useState<Job | null>(null);
  const [batchCount, setBatchCount] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [pendingAddons, setPendingAddons] = useState<AddOnRequest[]>([]);
  const [activeAddon, setActiveAddon] = useState<AddOnRequest | null>(null);
  const [approvedAddons, setApprovedAddons] = useState<string[]>([]);
  const [approvedRequests, setApprovedRequests] = useState<AddOnRequest[]>([]);
  const [showDispute, setShowDispute] = useState(false);
  const [disputeFiled, setDisputeFiled] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeDetails, setDisputeDetails] = useState('');
  const [disputeSubmitted, setDisputeSubmitted] = useState(false);
  const [disputePhoto, setDisputePhoto] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    setStoredJob(null);
    setActiveAddon(null);
    setDisputeFiled(false);
    setShowDispute(false);
    async function refresh() {
      try {
        const found = await getJobByCode(code);
        if (!found) throw new Error('Booking not found in this tab. Check the code or create a demo booking.');
        const [members, requests] = await Promise.all([
          found.batchCode ? listJobsByBatchCode(found.batchCode) : Promise.resolve([found]),
          readAddOnRequests(),
        ]);
        if (!active) return;
        setStoredJob(found);
        setBatchCount(members.length);
        setPendingAddons(requests.filter((addon) => addon.jobId === found.id && addon.status === 'pending'));
        const approved = requests.filter((addon) => addon.jobId === found.id && addon.status === 'approved');
        setApprovedRequests(approved);
        setApprovedAddons(approved.map((addon) => addon.id));
      } catch (error) {
        if (active) setError(error instanceof Error ? error.message : 'Could not load your demo booking.');
      } finally {
        if (active) setLoading(false);
      }
    }
    void refresh();
    const unsubscribeJobs = subscribeToJobs(() => { void refresh(); });
    const unsubscribeAddons = subscribeToAddOnRequests(() => { void refresh(); });
    return () => { active = false; unsubscribeJobs(); unsubscribeAddons(); };
  }, [code]);

  async function handleApproveAddon(id: string) {
    const addon = pendingAddons.find((item) => item.id === id);
    if (!addon) return;
    try {
      await updateAddOnStatus(id, 'approved');
      setActiveAddon(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Could not approve the extra.');
    }
  }

  async function handleDeclineAddon(id: string) {
    try {
      await updateAddOnStatus(id, 'declined');
      setActiveAddon(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Could not decline the extra.');
    }
  }

  function handleDisputeSubmit() {
    if (!disputeReason || !disputePhoto) return;
    setDisputeSubmitted(true);
    window.setTimeout(() => {
      setShowDispute(false);
      setDisputeFiled(true);
      setDisputeSubmitted(false);
    }, 1800);
  }

  const currentStatus: JobStatus = disputeFiled ? 'disputed' : storedJob?.status === 'complete' ? 'completed'
    : storedJob?.status === 'pending' ? 'scheduled' : storedJob?.status ?? 'scheduled';
  const currentStepIndex = STATUS_STEPS.findIndex((s) => s.key === currentStatus);
  if (loading || !storedJob) {
    return <main className="mx-auto min-h-screen max-w-5xl px-4 py-12">
      <h1 className="text-2xl font-extrabold">Track your demo booking</h1>
      {loading ? <p role="status">Loading booking...</p> : <p role="alert" className="mt-4 text-destructive">{error}</p>}
      <Link to="/book" className="mt-4 inline-block font-bold text-primary">Create a demo booking</Link>
    </main>;
  }
  const job = {
    id: storedJob.code, service: storedJob.service, address: storedJob.address,
    batchStreet: storedJob.address.replace(/^\d+\s+/, ''), batchCount,
    referralCode: storedJob.batchCode ?? storedJob.code,
    referralSavings: 0, neighborsSaved: Math.max(0, batchCount - 1),
    estimatedArrival: 'ETA unavailable in demo',
  };

  return (
    <>
      <Helmet>
        <title>Track Your Job — Blokpakt</title>
        <meta name="description" content="Track your Blokpakt service job in real time. See contractor status, approve on-site add-ons, share your referral code, and flag any issues within 48 hours." />
        <link rel="canonical" href="https://blokpakt.com/track" />
        <meta name="robots" content="noindex, nofollow" />
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
                  <p className="text-base font-bold text-foreground mb-2">Issue preview complete</p>
                  <p className="text-sm text-muted-foreground">No report was sent. This local preview resets when you leave the page; no payment is affected.</p>
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
                    Demo only. A real report would be reviewed by support; this preview does not send a report or freeze a payment.
                  </div>
                  <label className="mb-4 block text-xs font-semibold">
                    Issue photo (required, under 1 MB)
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="mt-2 block w-full"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        setDisputePhoto(null);
                        if (file) void readDemoPhoto(file).then(setDisputePhoto).catch((error: unknown) => setError(error instanceof Error ? error.message : 'Could not read photo.'));
                      }} />
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setShowDispute(false)} className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors">
                      Cancel
                    </button>
                    <button
                      disabled={!disputeReason || !disputePhoto}
                      onClick={handleDisputeSubmit}
                      className="rounded-xl bg-destructive px-4 py-2.5 text-sm font-bold text-white disabled:opacity-40 hover:bg-destructive/90 transition-colors"
                    >
                      Preview issue report
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
          <div className="mb-6 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">
            <p>Browser-only demo. No real dispatch, payment, or notifications.</p>
            <Link to="/field" className="mt-1 inline-block font-bold text-primary">Switch to provider view</Link>
          </div>
          {error && <p role="alert" className="mb-4 text-sm text-destructive">{error}</p>}

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
                <p className="mt-2 text-sm text-muted-foreground">{storedJob.serviceDate} · {storedJob.scheduledWindow}</p>
                <p className="mt-1 text-sm text-muted-foreground">{storedJob.acceptedAt ? `Accepted by ${storedJob.providerName}` : 'Awaiting whole-route acceptance'}</p>
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
                    {[
                      { id: 'booked', label: 'Demo booking saved', time: storedJob.createdAt, done: true },
                      { id: 'accepted', label: 'Whole route accepted', time: storedJob.acceptedAt, done: Boolean(storedJob.acceptedAt) },
                      { id: 'arrived', label: 'Provider arrived', time: storedJob.arrivedAt, done: Boolean(storedJob.arrivedAt) },
                      { id: 'complete', label: 'Photos saved and job completed', time: storedJob.completedAt, done: Boolean(storedJob.completedAt) },
                    ].map((u) => (
                      <div key={u.id} className="flex items-start gap-4 pl-8 relative">
                        <div className={`absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${u.done ? 'bg-primary' : 'bg-muted border border-border'}`}>
                          {u.done
                            ? <CheckCircle size={12} className="text-primary-foreground" />
                            : <Clock size={11} className="text-muted-foreground" />
                          }
                        </div>
                        <div>
                          <p className={`text-xs font-semibold ${u.done ? 'text-foreground' : 'text-muted-foreground'}`}>{u.label}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{u.time ? new Date(u.time).toLocaleString() : 'Not yet'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Approved add-ons */}
              {(storedJob.beforePhoto || storedJob.afterPhoto) && <section className="rounded-xl border border-border bg-card p-5">
                <h2 className="mb-3 text-sm font-bold">Service photos</h2>
                <div className="grid grid-cols-2 gap-3">
                  {storedJob.beforePhoto && <figure><img src={storedJob.beforePhoto} alt="Before service" className="w-full rounded-lg" /><figcaption className="mt-1 text-xs">Before</figcaption></figure>}
                  {storedJob.afterPhoto && <figure><img src={storedJob.afterPhoto} alt="After service" className="w-full rounded-lg" /><figcaption className="mt-1 text-xs">After</figcaption></figure>}
                </div>
              </section>}

              {approvedAddons.length > 0 && (
                <div className="bg-card rounded-xl border border-border p-5">
                  <p className="text-sm font-bold text-foreground mb-3">Approved add-ons</p>
                  {approvedRequests.map((a) => (
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
                    <p className="text-xs text-muted-foreground">Preview the issue-reporting flow — no report is sent</p>
                  </div>
                </button>
              )}
            </div>

            {/* ── Right column ── */}
            <div className="flex flex-col gap-6">

              {/* Share hub */}
              <ShareHub referralCode={job.referralCode} batchStreet={job.batchStreet} />

              {/* Neighborhood zone map — homes from virtual:content */}
              <div className="rounded-xl border border-border bg-muted/30 overflow-hidden">
                <div className="px-4 pt-4 pb-2 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Example neighborhood layout</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Illustration only — not a map of your booking</p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                    <Zap size={10} />
                    Demo map
                  </span>
                </div>
                <div className="flex w-full flex-col items-center gap-4 px-4 pb-4" aria-label="Neighborhood zone map">
                  <div className="grid w-full grid-cols-4 gap-2" aria-label="Top houses">
                    {track.homes.filter((h) => h.y < 90).map((h) => (
                      <div key={h.id} className="flex flex-col items-center">
                        <div className={`flex h-9 w-12 items-center justify-center rounded-md border text-[11px] ${h.active ? 'border-accent bg-accent text-accent-foreground' : 'border-primary bg-primary text-primary-foreground'} ${h.active ? 'font-bold' : ''}`}>
                          {h.label}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="my-4 flex w-full items-center justify-center rounded-full bg-stone-200/50 py-2">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-amber-900/60">{job.batchStreet}</span>
                  </div>

                  <div className="grid w-full grid-cols-4 gap-2" aria-label="Bottom houses">
                    {track.homes.filter((h) => h.y >= 90).map((h) => (
                      <div key={h.id} className="flex flex-col items-center">
                        <div className="flex h-9 w-12 items-center justify-center rounded-md border border-border bg-card text-[11px] text-muted-foreground opacity-60">
                          {h.label}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex w-full items-center justify-center gap-4 pt-2" aria-label="Map legend">
                    <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                      <span className="h-2.5 w-2.5 rounded-sm bg-accent" />
                      You
                    </span>
                    <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                      <span className="h-2.5 w-2.5 rounded-sm bg-primary" />
                      Booked
                    </span>
                    <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                      <span className="h-2.5 w-2.5 rounded-sm border border-border bg-card opacity-60" />
                      Available
                    </span>
                  </div>
                </div>
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
                  <p className="text-lg font-extrabold text-foreground">${storedJob.payout}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight">Demo base price</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-3 text-center">
                  <span className="text-primary flex justify-center mb-1"><MessageSquare size={14} /></span>
                  <p className="text-lg font-extrabold text-foreground">{job.neighborsSaved}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight">Other stops</p>
                </div>
              </div>

              {/* Dev: status switcher */}
              <div className="rounded-xl border border-dashed border-border p-4">
                <p className="text-xs font-semibold text-muted-foreground mb-2">Preview: change status</p>
                <div className="flex flex-wrap gap-2">
                  <Link to="/field" className="text-sm font-semibold text-primary">Update progress in the provider demo</Link>
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>
    </>
  );
}
