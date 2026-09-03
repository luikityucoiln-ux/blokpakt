import { join } from 'virtual:content';
import { useState, useCallback } from 'react';
import { Helmet } from '@dr.pogodin/react-helmet';
import { motion, AnimatePresence } from 'motion/react';
import {
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  MapPin,
  Star,
  Zap,
  Users,
  DollarSign,
  Clock,
  AlertCircle,
  X,
  Plus,
} from 'lucide-react';

// ── Animation variants ────────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
};

const slideIn = {
  hidden: { opacity: 0, x: 32 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
  exit: { opacity: 0, x: -32, transition: { duration: 0.25, ease: 'easeIn' as const } },
};

// ── Types ─────────────────────────────────────────────────────────────────────
interface ZipStatus {
  zip: string;
  covered: boolean;
  isBlockCaptainAvailable: boolean;
  checking: boolean;
}

interface FormData {
  services: string[];
  zips: string[];
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  activationMethod: 'deposit' | 'referral' | '';
  referralEmail: string;
}

type SubmitResult =
  | { status: 'pending_payment' | 'pending_referral'; applicationId: string; isBlockCaptain: boolean; blockCaptainZips: string[]; coveredZips: string[]; uncoveredZips: string[] }
  | { status: 'waitlist'; uncoveredZips: string[] }
  | null;

// ── Step indicator ────────────────────────────────────────────────────────────
function StepIndicator({ current, steps }: { current: number; steps: { id: string; label: string }[] }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-10">
      {steps.map((step, i) => (
        <div key={step.id} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all duration-300 ${
                i < current
                  ? 'bg-primary border-primary text-primary-foreground'
                  : i === current
                  ? 'border-primary text-primary bg-background'
                  : 'border-border text-muted-foreground bg-background'
              }`}
            >
              {i < current ? <CheckCircle size={16} /> : i + 1}
            </div>
            <span
              className={`mt-1.5 text-xs font-medium whitespace-nowrap ${
                i === current ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={`w-16 md:w-24 h-0.5 mx-1 mb-5 transition-all duration-300 ${
                i < current ? 'bg-primary' : 'bg-border'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Block Captain badge ───────────────────────────────────────────────────────
function BlockCaptainBadge({ zips }: { zips: string[] }) {
  if (zips.length === 0) return null;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mt-4 p-4 rounded-xl border-2 border-yellow-400 bg-yellow-50 flex gap-3"
    >
      <Star className="text-yellow-500 shrink-0 mt-0.5" size={20} fill="currentColor" />
      <div>
        <p className="font-semibold text-yellow-800 text-sm">Block Captain available in {zips.join(', ')}</p>
        <p className="text-yellow-700 text-xs mt-0.5">
          You'd be the first provider in {zips.length === 1 ? 'this ZIP' : 'these ZIPs'} — earn priority dispatch + $50 bonus after your first 5 jobs.
        </p>
      </div>
    </motion.div>
  );
}

// ── Step 1: Services & ZIP ────────────────────────────────────────────────────
function Step1({
  form,
  setForm,
  zipStatuses,
  setZipStatuses,
  onNext,
}: {
  form: FormData;
  setForm: React.Dispatch<React.SetStateAction<FormData>>;
  zipStatuses: ZipStatus[];
  setZipStatuses: React.Dispatch<React.SetStateAction<ZipStatus[]>>;
  onNext: () => void;
}) {
  const [zipInput, setZipInput] = useState('');
  const [zipError, setZipError] = useState('');

  const toggleService = (id: string) => {
    setForm((f) => ({
      ...f,
      services: f.services.includes(id) ? f.services.filter((s) => s !== id) : [...f.services, id],
    }));
  };

  const checkZip = useCallback(
    async (zip: string) => {
      const trimmed = zip.trim();
      // Demo mode: accept any 5-digit ZIP
      if (!/^\d{5}$/.test(trimmed)) {
        setZipError('Enter a valid 5-digit ZIP code');
        return;
      }
      if (form.zips.includes(trimmed)) {
        setZipError('ZIP already added');
        return;
      }
      setZipError('');
      setZipStatuses((prev) => [...prev, { zip: trimmed, covered: false, isBlockCaptainAvailable: false, checking: true }]);
      setForm((f) => ({ ...f, zips: [...f.zips, trimmed] }));
      setZipInput('');

      try {
        const res = await fetch('/api/provider/check-zip', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ zips: [trimmed] }),
        });
        const data = await res.json();
        const result = data.results?.[0];
        setZipStatuses((prev) =>
          prev.map((z) =>
            z.zip === trimmed
              ? { ...z, covered: result?.covered ?? true, isBlockCaptainAvailable: result?.isBlockCaptainAvailable ?? true, checking: false }
              : z,
          ),
        );
      } catch {
        // Demo fallback: mark as covered
        setZipStatuses((prev) =>
          prev.map((z) => (z.zip === trimmed ? { ...z, checking: false, covered: true, isBlockCaptainAvailable: true } : z)),
        );
      }
    },
    [form.zips, setForm, setZipStatuses],
  );

  const removeZip = (zip: string) => {
    setForm((f) => ({ ...f, zips: f.zips.filter((z) => z !== zip) }));
    setZipStatuses((prev) => prev.filter((z) => z.zip !== zip));
  };

  const blockCaptainZips = zipStatuses.filter((z) => z.isBlockCaptainAvailable).map((z) => z.zip);
  const hasCoveredZip = zipStatuses.some((z) => z.covered) || zipStatuses.length > 0;
  void hasCoveredZip;
  const allChecked = zipStatuses.every((z) => !z.checking);
  void (form.services.length > 0 && form.zips.length > 0 && allChecked); // demo: no blocking

  return (
    <div className="space-y-8">
      {/* Services */}
      <div>
        <h3 className="font-semibold text-foreground mb-1">Which services do you offer?</h3>
        <p className="text-sm text-muted-foreground mb-4">Select all that apply.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {join.services.map((svc) => {
            const selected = form.services.includes(svc.id);
            return (
              <button
                key={svc.id}
                type="button"
                onClick={() => toggleService(svc.id)}
                className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                  selected
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/40 bg-card'
                }`}
              >
                <span className="text-2xl leading-none mt-0.5">{svc.icon}</span>
                <div className="min-w-0">
                  <p className={`font-semibold text-sm ${selected ? 'text-primary' : 'text-foreground'}`}>
                    {svc.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{svc.description}</p>
                </div>
                {selected && (
                  <CheckCircle size={16} className="text-primary shrink-0 ml-auto mt-0.5" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ZIP codes */}
      <div>
        <h3 className="font-semibold text-foreground mb-1">Coverage ZIP codes</h3>
        <p className="text-sm text-muted-foreground mb-4">Add the ZIP codes where you want to work.</p>

        <div className="flex gap-2">
          <input
            type="text"
            inputMode="numeric"
            maxLength={5}
            value={zipInput}
            onChange={(e) => setZipInput(e.target.value.replace(/\D/g, ''))}
            onKeyDown={(e) => e.key === 'Enter' && checkZip(zipInput)}
            placeholder="e.g. 60614"
            className="flex-1 px-4 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <button
            type="button"
            onClick={() => checkZip(zipInput)}
            disabled={zipInput.length !== 5}
            className="px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-40 flex items-center gap-1.5 hover:bg-primary/90 transition-colors"
          >
            <Plus size={15} />
            Add
          </button>
        </div>
        {zipError && <p className="text-destructive text-xs mt-1.5">{zipError}</p>}

        {zipStatuses.length > 0 && (
          <div className="mt-3 space-y-2">
            {zipStatuses.map((z) => (
              <div
                key={z.zip}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border ${
                  z.checking
                    ? 'border-border bg-muted/40 text-muted-foreground'
                    : z.covered
                    ? 'border-green-200 bg-green-50 text-green-800'
                    : 'border-orange-200 bg-orange-50 text-orange-800'
                }`}
              >
                <MapPin size={13} className="shrink-0" />
                <span className="font-mono font-medium">{z.zip}</span>
                {z.checking ? (
                  <span className="text-xs ml-1 text-muted-foreground">Checking…</span>
                ) : z.covered ? (
                  <>
                    <span className="text-xs ml-1">Covered</span>
                    {z.isBlockCaptainAvailable && (
                      <span className="ml-1 px-1.5 py-0.5 rounded text-xs bg-yellow-100 text-yellow-700 font-medium border border-yellow-300">
                        ⭐ Block Captain
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-xs ml-1">Not yet covered — waitlist</span>
                )}
                <button
                  type="button"
                  onClick={() => removeZip(z.zip)}
                  className="ml-auto text-muted-foreground hover:text-foreground"
                >
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
        )}

        {hasCoveredZip && <BlockCaptainBadge zips={blockCaptainZips} />}
      </div>

      <button
        type="button"
        onClick={onNext}
        className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
      >
        Continue <ArrowRight size={16} />
      </button>
    </div>
  );
}

// ── Step 2: Contact Info ──────────────────────────────────────────────────────
function Step2({
  form,
  setForm,
  onNext,
  onBack,
}: {
  form: FormData;
  setForm: React.Dispatch<React.SetStateAction<FormData>>;
  onNext: () => void;
  onBack: () => void;
}) {
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const validate = () => {
    // Demo mode: no blocking validation
    setErrors({});
    return true;
  };

  const handleNext = () => {
    if (validate()) onNext();
  };

  const field = (
    label: string,
    key: keyof FormData,
    type = 'text',
    placeholder = '',
  ) => (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1.5">{label}</label>
      <input
        type={type}
        value={form[key] as string}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        placeholder={placeholder}
        className={`w-full px-4 py-2.5 rounded-lg border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 ${
          errors[key] ? 'border-destructive' : 'border-border'
        }`}
      />
      {errors[key] && <p className="text-destructive text-xs mt-1">{errors[key]}</p>}
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        {field('First name', 'firstName', 'text', 'Jane')}
        {field('Last name', 'lastName', 'text', 'Smith')}
      </div>
      {field('Email address', 'email', 'email', 'jane@example.com')}
      {field('Phone number', 'phone', 'tel', '(312) 555-0100')}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 py-3 rounded-xl border border-border text-foreground font-semibold flex items-center justify-center gap-2 hover:bg-muted/40 transition-colors"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
        >
          Continue <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}

// ── Step 3: Activation ────────────────────────────────────────────────────────
function Step3({
  form,
  setForm,
  onBack,
  onSubmit,
  submitting,
}: {
  form: FormData;
  setForm: React.Dispatch<React.SetStateAction<FormData>>;
  onBack: () => void;
  onSubmit: () => void;
  submitting: boolean;
}) {
  const { depositOption, referralOption } = join.activation;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-foreground mb-1">Choose your activation path</h3>
        <p className="text-sm text-muted-foreground mb-5">Both paths give you full access — pick what works for you.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Deposit option */}
          <button
            type="button"
            onClick={() => setForm((f) => ({ ...f, activationMethod: 'deposit' }))}
            className={`p-5 rounded-xl border-2 text-left transition-all duration-200 ${
              form.activationMethod === 'deposit'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/40 bg-card'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <DollarSign
                size={22}
                className={form.activationMethod === 'deposit' ? 'text-primary' : 'text-muted-foreground'}
              />
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                {depositOption.badge}
              </span>
            </div>
            <p className="font-semibold text-foreground">{depositOption.title}</p>
            <p className="text-2xl font-bold text-primary mt-1 mb-3">${depositOption.amount}</p>
            <ul className="space-y-1.5">
              {depositOption.bullets.map((b, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <CheckCircle size={12} className="text-primary shrink-0 mt-0.5" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </button>

          {/* Referral option */}
          <button
            type="button"
            onClick={() => setForm((f) => ({ ...f, activationMethod: 'referral' }))}
            className={`p-5 rounded-xl border-2 text-left transition-all duration-200 ${
              form.activationMethod === 'referral'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/40 bg-card'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <Users
                size={22}
                className={form.activationMethod === 'referral' ? 'text-primary' : 'text-muted-foreground'}
              />
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                {referralOption.badge}
              </span>
            </div>
            <p className="font-semibold text-foreground">{referralOption.title}</p>
            <p className="text-sm text-muted-foreground mt-1 mb-3">Refer one homeowner</p>
            <ul className="space-y-1.5">
              {referralOption.bullets.map((b, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <CheckCircle size={12} className="text-primary shrink-0 mt-0.5" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </button>
        </div>
      </div>

      {/* Referral email input */}
      <AnimatePresence>
        {form.activationMethod === 'referral' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Homeowner's email to refer
            </label>
            <input
              type="email"
              value={form.referralEmail}
              onChange={(e) => setForm((f) => ({ ...f, referralEmail: e.target.value }))}
              placeholder="neighbor@example.com"
              className="w-full px-4 py-2.5 rounded-lg border border-border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <p className="text-xs text-muted-foreground mt-1.5">
              We'll send them a $25 first-booking credit and notify you when their job completes.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 py-3 rounded-xl border border-border text-foreground font-semibold flex items-center justify-center gap-2 hover:bg-muted/40 transition-colors"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={!form.activationMethod || submitting}
          className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 disabled:opacity-40 hover:bg-primary/90 transition-colors"
        >
          {submitting ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />
              Submitting…
            </span>
          ) : (
            <>Submit Application <ArrowRight size={16} /></>
          )}
        </button>
      </div>
    </div>
  );
}

// ── Waitlist screen ───────────────────────────────────────────────────────────
function WaitlistScreen({ zips, onReset }: { zips: string[]; onReset: () => void }) {
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [joined, setJoined] = useState(false);

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="text-center py-8 px-4"
    >
      <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-5">
        <MapPin size={28} className="text-orange-500" />
      </div>
      <h2 className="text-2xl font-bold text-foreground mb-2">{join.waitlist.headline}</h2>
      <p className="text-muted-foreground mb-2">{join.waitlist.description}</p>
      {zips.length > 0 && (
        <p className="text-sm text-muted-foreground mb-6">
          Requested ZIPs: <span className="font-mono font-medium">{zips.join(', ')}</span>
        </p>
      )}

      {!joined ? (
        <div className="max-w-sm mx-auto space-y-3">
          <input
            type="email"
            value={waitlistEmail}
            onChange={(e) => setWaitlistEmail(e.target.value)}
            placeholder="Your email address"
            className="w-full px-4 py-3 rounded-xl border border-border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <button
            type="button"
            onClick={() => setJoined(true)}
            disabled={!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(waitlistEmail)}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold disabled:opacity-40 hover:bg-primary/90 transition-colors"
          >
            {join.waitlist.ctaLabel}
          </button>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-sm mx-auto p-5 rounded-xl border border-green-200 bg-green-50"
        >
          <CheckCircle size={24} className="text-green-600 mx-auto mb-2" />
          <p className="font-semibold text-green-800">You're on the list!</p>
          <p className="text-sm text-green-700 mt-1">
            We'll email you the moment your ZIP goes live — with first-mover Block Captain status reserved.
          </p>
        </motion.div>
      )}

      <button
        type="button"
        onClick={onReset}
        className="mt-6 text-sm text-muted-foreground hover:text-foreground underline underline-offset-2"
      >
        Try different ZIP codes
      </button>
    </motion.div>
  );
}

// ── Success screen ────────────────────────────────────────────────────────────
function SuccessScreen({ result }: { result: Extract<SubmitResult, { status: 'pending_payment' | 'pending_referral' }> }) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="text-center py-8 px-4"
    >
      <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
        <CheckCircle size={28} className="text-green-600" />
      </div>

      {result.isBlockCaptain && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-100 border border-yellow-300 text-yellow-800 text-sm font-semibold mb-4"
        >
          <Star size={14} fill="currentColor" className="text-yellow-500" />
          Block Captain — {result.blockCaptainZips.join(', ')}
        </motion.div>
      )}

      <h2 className="text-2xl font-bold text-foreground mb-2">Application received!</h2>
      <p className="text-muted-foreground mb-1">Application ID: <span className="font-mono font-medium text-foreground">{result.applicationId}</span></p>

      <div className="mt-6 max-w-sm mx-auto p-5 rounded-xl border border-border bg-card text-left space-y-3">
        {result.status === 'pending_payment' ? (
          <>
            <div className="flex items-start gap-3">
              <DollarSign size={18} className="text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm text-foreground">Next: Complete your $99 deposit</p>
                <p className="text-xs text-muted-foreground mt-0.5">We'll email you a secure payment link within 10 minutes.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Zap size={18} className="text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm text-foreground">Then: Start accepting jobs</p>
                <p className="text-xs text-muted-foreground mt-0.5">Deposit is refunded after 10 completed jobs.</p>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-start gap-3">
              <Users size={18} className="text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm text-foreground">Referral invite sent</p>
                <p className="text-xs text-muted-foreground mt-0.5">Your referred homeowner will receive a $25 booking credit.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock size={18} className="text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm text-foreground">Activation unlocks automatically</p>
                <p className="text-xs text-muted-foreground mt-0.5">We'll notify you the moment their first job completes.</p>
              </div>
            </div>
          </>
        )}
        {result.uncoveredZips.length > 0 && (
          <div className="flex items-start gap-3 pt-1 border-t border-border">
            <AlertCircle size={18} className="text-orange-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm text-foreground">Waitlisted ZIPs</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {result.uncoveredZips.join(', ')} — you'll get first-mover status when we expand there.
              </p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function JoinPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>({
    services: ['lawn', 'gutter'],
    zips: [],
    firstName: 'Marcus',
    lastName: 'Thompson',
    email: 'marcus@example.com',
    phone: '(312) 555-0177',
    activationMethod: '',
    referralEmail: '',
  });
  const [zipStatuses, setZipStatuses] = useState<ZipStatus[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitResult>(null);

  const site = 'https://blokpakt.com';
  const title = join.meta.title;
  const description = join.meta.description;

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/provider/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          services: form.services,
          zips: form.zips,
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
          activationMethod: form.activationMethod,
          referralEmail: form.referralEmail || undefined,
        }),
      });
      const data = await res.json();
      setResult(data);
    } catch {
      setResult(null);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setStep(0);
    setForm({ services: [], zips: [], firstName: '', lastName: '', email: '', phone: '', activationMethod: '', referralEmail: '' });
    setZipStatuses([]);
    setResult(null);
  };

  const isWaitlist = result?.status === 'waitlist';
  const isSuccess = result?.status === 'pending_payment' || result?.status === 'pending_referral';

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={`${site}/join`} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${site}/join`} />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          '@id': `${site}/join#webpage`,
          name: title,
          url: `${site}/join`,
          isPartOf: { '@id': `${site}/#website` },
          about: { '@id': `${site}/#organization` },
        })}</script>
      </Helmet>

      <main>
        {/* Hero */}
        <section className="bg-primary text-primary-foreground py-14 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <motion.p
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="text-sm font-semibold uppercase tracking-wide text-primary-foreground/70 mb-3"
            >
              {join.hero.eyebrow}
            </motion.p>
            <motion.h1
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.05 }}
              className="text-4xl md:text-5xl font-bold mb-4"
            >
              {join.hero.headline}
            </motion.h1>
            <motion.p
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.1 }}
              className="text-lg text-primary-foreground/80"
            >
              {join.hero.subheadline}
            </motion.p>

            {/* Trust stats */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.15 }}
              className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-primary-foreground/80"
            >
              <span className="flex items-center gap-1.5"><Clock size={14} /> Avg 3 min to apply</span>
              <span className="flex items-center gap-1.5"><DollarSign size={14} /> Deposit refunded after 10 jobs</span>
              <span className="flex items-center gap-1.5"><Star size={14} /> Block Captain perks available</span>
            </motion.div>
          </div>
        </section>

        {/* Block Captain callout */}
        <section className="bg-yellow-50 border-b border-yellow-200 py-4 px-4">
          <div className="max-w-2xl mx-auto flex items-start gap-3">
            <Star size={18} className="text-yellow-500 shrink-0 mt-0.5" fill="currentColor" />
            <div>
              <span className="font-semibold text-yellow-800 text-sm">{join.blockCaptain.headline} — </span>
              <span className="text-yellow-700 text-sm">{join.blockCaptain.description}</span>
            </div>
          </div>
        </section>

        {/* Form card */}
        <section className="py-12 px-4">
          <div className="max-w-xl mx-auto">
            {/* Demo banner */}
            <div className="mb-5 flex items-center gap-2 rounded-xl border border-accent/30 bg-accent/5 px-4 py-2.5 text-sm text-accent font-medium">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse flex-shrink-0" />
              Demo mode — fields pre-filled. Click through any step to proceed.
            </div>
            <div className="bg-card border border-border rounded-2xl shadow-sm p-6 md:p-8">
              {isWaitlist ? (
                <WaitlistScreen
                  zips={(result as { status: 'waitlist'; uncoveredZips: string[] }).uncoveredZips}
                  onReset={resetForm}
                />
              ) : isSuccess ? (
                <SuccessScreen result={result as Extract<SubmitResult, { status: 'pending_payment' | 'pending_referral' }>} />
              ) : (
                <>
                  <StepIndicator current={step} steps={[
                    { id: 's1', label: 'Services & Coverage' },
                    { id: 's2', label: 'Contact Info' },
                    { id: 's3', label: 'Activation' },
                  ]} />
                  <AnimatePresence mode="wait">
                    {step === 0 && (
                      <motion.div key="step1" variants={slideIn} initial="hidden" animate="visible" exit="exit">
                        <Step1
                          form={form}
                          setForm={setForm}
                          zipStatuses={zipStatuses}
                          setZipStatuses={setZipStatuses}
                          onNext={() => setStep(1)}
                        />
                      </motion.div>
                    )}
                    {step === 1 && (
                      <motion.div key="step2" variants={slideIn} initial="hidden" animate="visible" exit="exit">
                        <Step2
                          form={form}
                          setForm={setForm}
                          onNext={() => setStep(2)}
                          onBack={() => setStep(0)}
                        />
                      </motion.div>
                    )}
                    {step === 2 && (
                      <motion.div key="step3" variants={slideIn} initial="hidden" animate="visible" exit="exit">
                        <Step3
                          form={form}
                          setForm={setForm}
                          onBack={() => setStep(1)}
                          onSubmit={handleSubmit}
                          submitting={submitting}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </div>

            {/* Block Captain perks detail */}
            {!isWaitlist && !isSuccess && (
              <motion.div
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="mt-6 p-5 rounded-xl border border-yellow-200 bg-yellow-50"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Star size={16} className="text-yellow-500" fill="currentColor" />
                  <span className="font-semibold text-yellow-800 text-sm">{join.blockCaptain.badge} perks</span>
                </div>
                <ul className="space-y-1.5">
                  {join.blockCaptain.perks.map((perk, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-yellow-700">
                      <CheckCircle size={13} className="text-yellow-500 shrink-0" />
                      <span>{perk}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
