import { useState, useMemo } from 'react';
import { admin } from 'virtual:content';
import { Helmet } from '@dr.pogodin/react-helmet';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, XCircle, Clock, AlertTriangle, Star, ChevronDown, ChevronUp, DollarSign, Users, Shield, Camera, BarChart2, Zap, Search, RefreshCw, Eye, Flag, ThumbsUp, ThumbsDown } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

// ── Types ─────────────────────────────────────────────────────────────────────

type JobStatus = 'complete' | 'in_progress' | 'pending' | 'disputed';
type PayoutStatus = 'pending_approval' | 'approved' | 'rejected' | 'released';
type RatingFlag = 'none' | 'suspicious' | 'blocked';

interface TimelineJob {
  id: string;
  providerId: string;
  providerName: string;
  service: string;
  address: string;
  startHour: number; // 0–23
  durationHours: number;
  status: JobStatus;
  payout: number;
  payoutStatus: PayoutStatus;
  beforePhoto: boolean;
  afterPhoto: boolean;
  customerRating: number | null;
  ratingFlag: RatingFlag;
  ratingNote: string;
  fixItWindowOpen: boolean; // 24-hr window still open
  addOns: number; // extra $ from add-ons
}

interface Provider {
  id: string;
  name: string;
  zip: string;
  services: string[];
  trimmedMeanRating: number;
  rawRatings: number[];
  totalJobs: number;
  totalEarned: number;
  pendingPayout: number;
  ratingFlag: RatingFlag;
  isBlockCaptain: boolean;
  joinedDate: string;
}

// ── Demo data ─────────────────────────────────────────────────────────────────

const PROVIDERS: Provider[] = [
  {
    id: 'p1', name: 'Marcus Thompson', zip: '62701',
    services: ['Lawn Care', 'Leaf Removal'],
    trimmedMeanRating: 4.8, rawRatings: [5, 5, 4, 5, 5, 4, 5, 1, 5, 5],
    totalJobs: 47, totalEarned: 6820, pendingPayout: 562,
    ratingFlag: 'none', isBlockCaptain: true, joinedDate: 'Aug 1, 2026',
  },
  {
    id: 'p2', name: 'Destiny Williams', zip: '62702',
    services: ['Gutter Cleaning', 'Pressure Washing'],
    trimmedMeanRating: 4.6, rawRatings: [5, 4, 5, 4, 5, 4, 5, 4],
    totalJobs: 31, totalEarned: 4150, pendingPayout: 390,
    ratingFlag: 'none', isBlockCaptain: false, joinedDate: 'Aug 5, 2026',
  },
  {
    id: 'p3', name: 'Jordan Lee', zip: '62701',
    services: ['Lawn Care'],
    trimmedMeanRating: 3.1, rawRatings: [5, 5, 5, 1, 1, 2, 5, 5, 1, 1],
    totalJobs: 18, totalEarned: 2340, pendingPayout: 288,
    ratingFlag: 'suspicious', isBlockCaptain: false, joinedDate: 'Aug 12, 2026',
  },
  {
    id: 'p4', name: 'Aaliyah Brooks', zip: '62703',
    services: ['Window Cleaning', 'Gutter Cleaning'],
    trimmedMeanRating: 4.9, rawRatings: [5, 5, 5, 5, 5, 4, 5],
    totalJobs: 22, totalEarned: 3100, pendingPayout: 260,
    ratingFlag: 'none', isBlockCaptain: false, joinedDate: 'Aug 8, 2026',
  },
];

const TIMELINE_JOBS: TimelineJob[] = [
  { id: 'tj1', providerId: 'p1', providerName: 'Marcus Thompson', service: 'Lawn Care', address: '112 Maple Ave', startHour: 8, durationHours: 1, status: 'complete', payout: 144, payoutStatus: 'pending_approval', beforePhoto: true, afterPhoto: true, customerRating: 5, ratingFlag: 'none', ratingNote: '', fixItWindowOpen: false, addOns: 35 },
  { id: 'tj2', providerId: 'p1', providerName: 'Marcus Thompson', service: 'Lawn Care', address: '247 Oak St', startHour: 9, durationHours: 1, status: 'in_progress', payout: 144, payoutStatus: 'pending_approval', beforePhoto: true, afterPhoto: false, customerRating: null, ratingFlag: 'none', ratingNote: '', fixItWindowOpen: true, addOns: 0 },
  { id: 'tj3', providerId: 'p1', providerName: 'Marcus Thompson', service: 'Lawn Care', address: '389 Elm Dr', startHour: 10, durationHours: 1, status: 'pending', payout: 144, payoutStatus: 'pending_approval', beforePhoto: false, afterPhoto: false, customerRating: null, ratingFlag: 'none', ratingNote: '', fixItWindowOpen: true, addOns: 0 },
  { id: 'tj4', providerId: 'p2', providerName: 'Destiny Williams', service: 'Gutter Cleaning', address: '501 Pine Ct', startHour: 8, durationHours: 1.5, status: 'complete', payout: 130, payoutStatus: 'approved', beforePhoto: true, afterPhoto: true, customerRating: 4, ratingFlag: 'none', ratingNote: '', fixItWindowOpen: false, addOns: 0 },
  { id: 'tj5', providerId: 'p2', providerName: 'Destiny Williams', service: 'Pressure Washing', address: '620 Cedar Ln', startHour: 10, durationHours: 2, status: 'complete', payout: 160, payoutStatus: 'pending_approval', beforePhoto: true, afterPhoto: true, customerRating: 5, ratingFlag: 'none', ratingNote: '', fixItWindowOpen: false, addOns: 30 },
  { id: 'tj6', providerId: 'p3', providerName: 'Jordan Lee', service: 'Lawn Care', address: '78 Birch Blvd', startHour: 9, durationHours: 1, status: 'complete', payout: 144, payoutStatus: 'pending_approval', beforePhoto: true, afterPhoto: true, customerRating: 1, ratingFlag: 'suspicious', ratingNote: 'Pattern: 5 consecutive 1-star ratings from same ZIP cluster. Trimmed mean below 3.0 floor.', fixItWindowOpen: true, addOns: 0 },
  { id: 'tj7', providerId: 'p4', providerName: 'Aaliyah Brooks', service: 'Window Cleaning', address: '215 Spruce Ave', startHour: 8, durationHours: 1.5, status: 'complete', payout: 120, payoutStatus: 'released', beforePhoto: true, afterPhoto: true, customerRating: 5, ratingFlag: 'none', ratingNote: '', fixItWindowOpen: false, addOns: 0 },
  { id: 'tj8', providerId: 'p3', providerName: 'Jordan Lee', service: 'Lawn Care', address: '99 Walnut Way', startHour: 11, durationHours: 1, status: 'disputed', payout: 144, payoutStatus: 'rejected', beforePhoto: false, afterPhoto: false, customerRating: 1, ratingFlag: 'suspicious', ratingNote: 'No photo proof submitted. Customer reports work not done.', fixItWindowOpen: false, addOns: 0 },
];

const HOURS = Array.from({ length: 12 }, (_, i) => i + 7); // 7 AM – 6 PM

const PROVIDER_COLORS: Record<string, string> = {
  p1: 'bg-primary',
  p2: 'bg-blue-500',
  p3: 'bg-amber-500',
  p4: 'bg-purple-500',
};

const STATUS_COLORS: Record<JobStatus, string> = {
  complete: 'bg-primary',
  in_progress: 'bg-accent',
  pending: 'bg-muted-foreground',
  disputed: 'bg-destructive',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function trimmedMean(ratings: number[]): number {
  if (ratings.length < 4) return ratings.reduce((a, b) => a + b, 0) / ratings.length;
  const sorted = [...ratings].sort((a, b) => a - b);
  const trim = Math.floor(sorted.length * 0.1);
  const trimmed = sorted.slice(trim, sorted.length - trim);
  return trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
}

function formatHour(h: number) {
  if (h === 12) return '12 PM';
  if (h > 12) return `${h - 12} PM`;
  return `${h} AM`;
}

// ── Gantt Timeline ────────────────────────────────────────────────────────────

function GanttTimeline({ jobs }: { jobs: TimelineJob[] }) {
  const [hoveredJob, setHoveredJob] = useState<string | null>(null);
  const uniqueProviders = [...new Set(jobs.map((j) => j.providerId))];
  const providerNames: Record<string, string> = {};
  jobs.forEach((j) => { providerNames[j.providerId] = j.providerName; });

  const totalHours = HOURS.length;

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart2 size={16} className="text-primary" />
          <p className="font-bold text-foreground text-sm">Dispatch Timeline — Sep 2, 2026</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {(['complete', 'in_progress', 'pending', 'disputed'] as JobStatus[]).map((s) => (
            <span key={s} className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-sm ${STATUS_COLORS[s]}`} />
              {s.replace('_', ' ')}
            </span>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[700px]">
          {/* Hour header */}
          <div className="flex border-b border-border bg-muted/30">
            <div className="w-36 flex-shrink-0 px-3 py-2 text-xs font-semibold text-muted-foreground">Provider</div>
            <div className="flex-1 flex">
              {HOURS.map((h) => (
                <div key={h} className="flex-1 text-center text-xs text-muted-foreground py-2 border-l border-border/40">
                  {formatHour(h)}
                </div>
              ))}
            </div>
          </div>

          {/* Provider rows */}
          {uniqueProviders.map((pid) => {
            const providerJobs = jobs.filter((j) => j.providerId === pid);
            return (
              <div key={pid} className="flex border-b border-border/40 hover:bg-muted/10 transition-colors min-h-[48px]">
                <div className="w-36 flex-shrink-0 px-3 py-3 flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${PROVIDER_COLORS[pid] || 'bg-muted'}`} />
                  <span className="text-xs font-semibold text-foreground truncate">{providerNames[pid]?.split(' ')[0]}</span>
                </div>
                <div className="flex-1 relative py-2">
                  {/* Grid lines */}
                  <div className="absolute inset-0 flex pointer-events-none">
                    {HOURS.map((h) => (
                      <div key={h} className="flex-1 border-l border-border/20" />
                    ))}
                  </div>
                  {/* Job bars */}
                  {providerJobs.map((job) => {
                    const leftPct = ((job.startHour - HOURS[0]) / totalHours) * 100;
                    const widthPct = (job.durationHours / totalHours) * 100;
                    const isHovered = hoveredJob === job.id;
                    return (
                      <div
                        key={job.id}
                        className="absolute top-1 bottom-1 rounded-md cursor-pointer transition-all"
                        style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                        onMouseEnter={() => setHoveredJob(job.id)}
                        onMouseLeave={() => setHoveredJob(null)}
                      >
                        <div className={`h-full rounded-md ${STATUS_COLORS[job.status]} ${isHovered ? 'opacity-100 ring-2 ring-foreground/30' : 'opacity-80'} flex items-center px-1.5 overflow-hidden relative`}>
                          {job.ratingFlag === 'suspicious' && (
                            <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-yellow-300" />
                          )}
                          <span className="text-white text-xs font-semibold truncate">{job.service.split(' ')[0]}</span>
                        </div>
                        {/* Tooltip */}
                        {isHovered && (
                          <div className="absolute z-20 top-full mt-1 left-0 bg-popover border border-border rounded-xl shadow-lg p-3 min-w-[200px] text-xs">
                            <p className="font-bold text-foreground">{job.service}</p>
                            <p className="text-muted-foreground">{job.address}</p>
                            <p className="text-muted-foreground">{formatHour(job.startHour)} · {job.durationHours}h</p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className={`rounded-full px-2 py-0.5 font-semibold ${STATUS_COLORS[job.status]} text-white`}>{job.status.replace('_', ' ')}</span>
                              <span className="font-bold text-primary">${job.payout + job.addOns}</span>
                            </div>
                            {job.ratingFlag !== 'none' && (
                              <p className="mt-1 text-amber-600 font-semibold flex items-center gap-1">
                                <AlertTriangle size={11} /> Rating flagged
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Payout Approval Table ─────────────────────────────────────────────────────

function PayoutTable({ jobs, onApprove, onReject }: {
  jobs: TimelineJob[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const [filter, setFilter] = useState<'all' | 'pending_approval' | 'approved' | 'rejected' | 'released'>('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    return jobs.filter((j) => {
      const matchFilter = filter === 'all' || j.payoutStatus === filter;
      const matchSearch = j.providerName.toLowerCase().includes(search.toLowerCase()) ||
        j.address.toLowerCase().includes(search.toLowerCase());
      return matchFilter && matchSearch;
    });
  }, [jobs, filter, search]);

  const pendingCount = jobs.filter((j) => j.payoutStatus === 'pending_approval').length;

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <DollarSign size={16} className="text-primary" />
            <p className="font-bold text-foreground text-sm">Timesheet & Payout Approval</p>
            {pendingCount > 0 && (
              <span className="rounded-full bg-accent text-white text-xs px-2 py-0.5 font-bold">{pendingCount} pending</span>
            )}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[160px]">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search provider or address…"
              className="w-full pl-8 pr-3 py-2 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="flex gap-1">
            {(['all', 'pending_approval', 'approved', 'rejected', 'released'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${filter === f ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
              >
                {f === 'all' ? 'All' : f.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              {['Provider', 'Service / Address', 'Photos', 'Rating', 'Payout', 'Status', 'Actions'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((job) => (
              <tr key={job.id} className={`border-b border-border/40 hover:bg-muted/10 transition-colors ${job.ratingFlag !== 'none' ? 'bg-amber-50/40' : ''}`}>
                <td className="px-4 py-3">
                  <p className="text-xs font-semibold text-foreground">{job.providerName}</p>
                  <p className="text-xs text-muted-foreground">{formatHour(job.startHour)}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="text-xs font-semibold text-foreground">{job.service}</p>
                  <p className="text-xs text-muted-foreground truncate max-w-[140px]">{job.address}</p>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1.5">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${job.beforePhoto ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                      <Camera size={10} /> B
                    </span>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${job.afterPhoto ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                      <Camera size={10} /> A
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {job.customerRating !== null ? (
                    <div className="flex items-center gap-1">
                      <Star size={12} className={job.ratingFlag !== 'none' ? 'text-amber-500' : 'text-primary'} fill="currentColor" />
                      <span className={`text-xs font-bold ${job.ratingFlag !== 'none' ? 'text-amber-600' : 'text-foreground'}`}>{job.customerRating}</span>
                      {job.ratingFlag !== 'none' && <AlertTriangle size={12} className="text-amber-500" />}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <p className="text-xs font-bold text-primary">${job.payout + job.addOns}</p>
                  {job.addOns > 0 && <p className="text-xs text-accent">+${job.addOns} add-on</p>}
                </td>
                <td className="px-4 py-3">
                  <PayoutBadge status={job.payoutStatus} />
                </td>
                <td className="px-4 py-3">
                  {job.payoutStatus === 'pending_approval' && (
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => onApprove(job.id)}
                        disabled={!job.beforePhoto || !job.afterPhoto}
                        title={!job.beforePhoto || !job.afterPhoto ? 'Photos required before approval' : 'Approve & release payout'}
                        className="inline-flex items-center gap-1 rounded-lg bg-primary/10 text-primary px-2.5 py-1.5 text-xs font-semibold hover:bg-primary/20 disabled:opacity-30 transition-colors"
                      >
                        <ThumbsUp size={11} /> Approve
                      </button>
                      <button
                        onClick={() => onReject(job.id)}
                        className="inline-flex items-center gap-1 rounded-lg bg-destructive/10 text-destructive px-2.5 py-1.5 text-xs font-semibold hover:bg-destructive/20 transition-colors"
                      >
                        <ThumbsDown size={11} /> Reject
                      </button>
                    </div>
                  )}
                  {job.payoutStatus === 'approved' && (
                    <button
                      onClick={() => onApprove(job.id)}
                      className="inline-flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      <Zap size={11} /> Release
                    </button>
                  )}
                  {(job.payoutStatus === 'released' || job.payoutStatus === 'rejected') && (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">No jobs match this filter.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PayoutBadge({ status }: { status: PayoutStatus }) {
  const cfg = {
    pending_approval: { label: 'Pending', cls: 'bg-amber-100 text-amber-700' },
    approved: { label: 'Approved', cls: 'bg-blue-100 text-blue-700' },
    rejected: { label: 'Rejected', cls: 'bg-destructive/10 text-destructive' },
    released: { label: 'Released', cls: 'bg-primary/10 text-primary' },
  }[status];
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${cfg.cls}`}>{cfg.label}</span>
  );
}

// ── Rating Engine Panel ───────────────────────────────────────────────────────

function RatingEngine({ providers }: { providers: Provider[] }) {
  const [expanded, setExpanded] = useState<string | null>('p3');

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center gap-2">
        <Shield size={16} className="text-primary" />
        <p className="font-bold text-foreground text-sm">Anti-Sabotage Rating Engine</p>
        <span className="ml-auto text-xs text-muted-foreground">Trimmed mean · 3.0★ floor · 24-hr fix-it window</span>
      </div>

      {/* Legend */}
      <div className="px-5 py-3 border-b border-border bg-muted/20 grid grid-cols-3 gap-3 text-xs">
        {admin.ratingLegend.map((item, i) => (
          <div key={i} className="flex items-start gap-2">
            <div className={`w-2 h-2 rounded-full mt-0.5 flex-shrink-0 ${i === 0 ? 'bg-primary' : i === 1 ? 'bg-amber-500' : 'bg-destructive'}`} />
            <div>
              <p className="font-semibold text-foreground">{item.title}</p>
              <p className="text-muted-foreground">{item.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="divide-y divide-border">
        {providers.map((p) => {
          const isExpanded = expanded === p.id;
          const belowFloor = p.trimmedMeanRating < 3.0;
          const recalculated = parseFloat(trimmedMean(p.rawRatings).toFixed(2));

          return (
            <div key={p.id} className={belowFloor ? 'bg-destructive/5' : p.ratingFlag === 'suspicious' ? 'bg-amber-50/40' : ''}>
              <button
                onClick={() => setExpanded(isExpanded ? null : p.id)}
                className="w-full px-5 py-4 flex items-center gap-3 hover:bg-muted/10 transition-colors text-left"
              >
                <div className="flex-1 flex items-center gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-foreground">{p.name}</p>
                      {p.isBlockCaptain && <span className="text-xs bg-primary/10 text-primary rounded-full px-2 py-0.5 font-semibold">⭐ Block Captain</span>}
                      {belowFloor && <span className="text-xs bg-destructive/10 text-destructive rounded-full px-2 py-0.5 font-semibold flex items-center gap-1"><AlertTriangle size={10} /> Below floor</span>}
                      {p.ratingFlag === 'suspicious' && !belowFloor && <span className="text-xs bg-amber-100 text-amber-700 rounded-full px-2 py-0.5 font-semibold flex items-center gap-1"><Flag size={10} /> Flagged</span>}
                    </div>
                    <p className="text-xs text-muted-foreground">{p.zip} · {p.totalJobs} jobs · joined {p.joinedDate}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="flex items-center gap-1 justify-end">
                      <Star size={13} className={belowFloor ? 'text-destructive' : 'text-primary'} fill="currentColor" />
                      <span className={`text-sm font-extrabold ${belowFloor ? 'text-destructive' : 'text-foreground'}`}>{recalculated}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">trimmed mean</p>
                  </div>
                  {isExpanded ? <ChevronUp size={15} className="text-muted-foreground" /> : <ChevronDown size={15} className="text-muted-foreground" />}
                </div>
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 space-y-4 border-t border-border pt-4">
                      {/* Raw ratings visualization */}
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-2">Raw ratings (most recent {p.rawRatings.length})</p>
                        <div className="flex gap-1.5 flex-wrap">
                          {p.rawRatings.map((r, i) => {
                            const sorted = [...p.rawRatings].sort((a, b) => a - b);
                            const trim = Math.floor(sorted.length * 0.1);
                            const isTrimmed = i < trim || i >= p.rawRatings.length - trim;
                            return (
                              <div
                                key={i}
                                title={isTrimmed ? 'Trimmed (excluded from mean)' : 'Included in mean'}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold border-2 ${
                                  isTrimmed
                                    ? 'border-dashed border-muted-foreground/40 text-muted-foreground bg-muted/30'
                                    : r <= 2
                                    ? 'border-destructive/40 bg-destructive/10 text-destructive'
                                    : r >= 5
                                    ? 'border-primary/40 bg-primary/10 text-primary'
                                    : 'border-border bg-muted/40 text-foreground'
                                }`}
                              >
                                {r}
                              </div>
                            );
                          })}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1.5">Dashed = trimmed out · Solid = counted in mean</p>
                      </div>

                      {/* Flagged jobs */}
                      {TIMELINE_JOBS.filter((j) => j.providerId === p.id && j.ratingFlag !== 'none').map((j) => (
                        <div key={j.id} className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                          <div className="flex items-start gap-2">
                            <AlertTriangle size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-xs font-semibold text-amber-900">{j.service} · {j.address}</p>
                              <p className="text-xs text-amber-700 mt-0.5">{j.ratingNote}</p>
                              <div className="flex items-center gap-2 mt-2">
                                {j.fixItWindowOpen && (
                                  <span className="text-xs bg-amber-200 text-amber-800 rounded-full px-2 py-0.5 font-semibold flex items-center gap-1">
                                    <Clock size={10} /> Fix-it window open
                                  </span>
                                )}
                                {!j.beforePhoto || !j.afterPhoto ? (
                                  <span className="text-xs bg-destructive/10 text-destructive rounded-full px-2 py-0.5 font-semibold flex items-center gap-1">
                                    <Camera size={10} /> Missing photo proof
                                  </span>
                                ) : (
                                  <span className="text-xs bg-primary/10 text-primary rounded-full px-2 py-0.5 font-semibold flex items-center gap-1">
                                    <Camera size={10} /> Photos on file
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Actions */}
                      <div className="flex gap-2">
                        {belowFloor && (
                          <button className="flex-1 py-2.5 rounded-xl bg-destructive text-white text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-destructive/90 transition-colors">
                            <XCircle size={13} /> Suspend Provider
                          </button>
                        )}
                        <button className="flex-1 py-2.5 rounded-xl border border-border text-xs font-semibold text-foreground flex items-center justify-center gap-1.5 hover:bg-muted transition-colors">
                          <Eye size={13} /> Review Full History
                        </button>
                        {p.ratingFlag === 'suspicious' && (
                          <button className="flex-1 py-2.5 rounded-xl bg-amber-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-amber-600 transition-colors">
                            <RefreshCw size={13} /> Reset Flag
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── KPI Strip ─────────────────────────────────────────────────────────────────

function KpiStrip({ jobs, providers }: { jobs: TimelineJob[]; providers: Provider[] }) {
  const totalPendingPayout = providers.reduce((s, p) => s + p.pendingPayout, 0);
  const completedToday = jobs.filter((j) => j.status === 'complete').length;
  const flaggedJobs = jobs.filter((j) => j.ratingFlag !== 'none').length;
  const avgRating = (providers.reduce((s, p) => s + p.trimmedMeanRating, 0) / providers.length).toFixed(1);

  const kpis = [
    { label: 'Pending payout', value: `$${totalPendingPayout.toLocaleString()}`, icon: DollarSign, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Jobs completed today', value: String(completedToday), icon: CheckCircle, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Active providers', value: String(providers.length), icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Flagged jobs', value: String(flaggedJobs), icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Network avg rating', value: `${avgRating}★`, icon: Star, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Below 3.0 floor', value: String(providers.filter((p) => p.trimmedMeanRating < 3.0).length), icon: Shield, color: 'text-destructive', bg: 'bg-destructive/10' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {kpis.map((k) => (
        <div key={k.label} className="rounded-2xl border border-border bg-card p-4">
          <div className={`w-8 h-8 rounded-xl ${k.bg} flex items-center justify-center mb-2`}>
            <k.icon size={15} className={k.color} />
          </div>
          <p className="text-xl font-extrabold text-foreground">{k.value}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{k.label}</p>
        </div>
      ))}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [jobs, setJobs] = useState<TimelineJob[]>(TIMELINE_JOBS);
  const [activeTab, setActiveTab] = useState<'timeline' | 'payouts' | 'ratings'>('timeline');

  function handleApprove(jobId: string) {
    setJobs((prev) =>
      prev.map((j) => {
        if (j.id !== jobId) return j;
        if (j.payoutStatus === 'pending_approval') return { ...j, payoutStatus: 'approved' };
        if (j.payoutStatus === 'approved') return { ...j, payoutStatus: 'released' };
        return j;
      }),
    );
  }

  function handleReject(jobId: string) {
    setJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, payoutStatus: 'rejected' } : j)),
    );
  }

  return (
    <>
      <Helmet>
        <title>Admin Operations — Blokpakt</title>
        <meta name="description" content="Blokpakt admin dashboard — dispatch timeline, payout approvals, and provider rating management." />
        <link rel="canonical" href="https://blokpakt.com/admin" />
        <meta name="robots" content="noindex" />
      </Helmet>

      <main className="min-h-screen bg-muted/30 pb-20">
        <h1 className="sr-only">Admin Operations Dashboard — Blokpakt</h1>

        {/* Top bar */}
        <div className="sticky top-0 z-30 bg-card border-b border-border shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">{admin.pageSubtitle}</p>
              <p className="text-sm font-bold text-foreground">{admin.pageTitle}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{admin.dateLabel}</span>
              <span className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                {admin.liveLabel}
              </span>
            </div>
          </div>

          {/* Tabs */}
          <div className="max-w-7xl mx-auto px-4 pb-3 flex gap-2">
            {admin.tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'timeline' | 'payouts' | 'ratings')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 pt-5 space-y-5">
          {/* Demo banner */}
          <div className="flex items-center gap-2 rounded-xl border border-accent/30 bg-accent/5 px-4 py-2.5 text-sm text-accent font-medium">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse flex-shrink-0" />
            {admin.demoBanner}
          </div>

          {/* KPI strip — always visible */}
          <KpiStrip jobs={jobs} providers={PROVIDERS} />

          <AnimatePresence mode="wait">
            {activeTab === 'timeline' && (
              <motion.div key="timeline" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                <GanttTimeline jobs={jobs} />
              </motion.div>
            )}
            {activeTab === 'payouts' && (
              <motion.div key="payouts" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                <PayoutTable jobs={jobs} onApprove={handleApprove} onReject={handleReject} />
              </motion.div>
            )}
            {activeTab === 'ratings' && (
              <motion.div key="ratings" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                <RatingEngine providers={PROVIDERS} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </>
  );
}
