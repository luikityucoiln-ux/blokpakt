import { useState, type FormEvent } from 'react';
import { Helmet } from '@dr.pogodin/react-helmet';
import { CircleCheck, Home, Mail, MapPin, ShieldCheck, Sparkles, UsersRound } from 'lucide-react';

type SubmissionState = 'idle' | 'checking' | 'success' | 'error';

interface SmokeTestLead {
  address: string;
  email: string;
  postcode: string | null;
  source: 'smoke-test-landing-page';
  submittedAt: string;
}

function getPostcode(address: string): string | null {
  return address.match(/\b[A-Z]\d[A-Z][ -]?\d[A-Z]\d\b|\b\d{5}(?:-\d{4})?\b/i)?.[0]?.toUpperCase().replace(/\s+/g, ' ') ?? null;
}

async function submitSmokeTestLead(lead: SmokeTestLead): Promise<void> {
  const endpoint = import.meta.env.VITE_SMOKE_TEST_LEAD_ENDPOINT;
  if (!endpoint) return;

  const response = await window.fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(lead),
  });
  if (!response.ok) throw new Error('Lead capture request failed');
}

export default function HomePage() {
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [submissionState, setSubmissionState] = useState<SubmissionState>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const title = 'Blokpakt | Save together on home maintenance';
  const description = 'Unlock 20% off gutter cleaning and pressure washing when three homes on your street book together.';

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmedAddress = address.trim();
    const trimmedEmail = email.trim();

    if (!trimmedAddress || !trimmedEmail) {
      setErrorMessage('Enter your street address and email to check your street.');
      return;
    }

    setErrorMessage('');
    setSubmissionState('checking');
    try {
      const lead: SmokeTestLead = {
        address: trimmedAddress,
        email: trimmedEmail,
        postcode: getPostcode(trimmedAddress),
        source: 'smoke-test-landing-page',
        submittedAt: new Date().toISOString(),
      };
      await Promise.all([
        submitSmokeTestLead(lead),
        new Promise<void>((resolve) => window.setTimeout(resolve, 1500)),
      ]);
      setSubmissionState('success');
    } catch {
      setSubmissionState('error');
      setErrorMessage('We could not secure your address. Please try again.');
    }
  }

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href="https://blokpakt.com/" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://blokpakt.com/" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
      </Helmet>

      <main>
        <section className="relative overflow-hidden border-b border-primary/20 bg-primary text-primary-foreground">
          <div className="absolute inset-0 opacity-20" aria-hidden="true">
            <div className="absolute -left-20 top-10 h-80 w-80 rounded-full border-[48px] border-white/20" />
            <div className="absolute -right-24 bottom-[-7rem] h-96 w-96 rounded-full border-[64px] border-accent/70" />
            <div className="absolute inset-0 bg-[linear-gradient(115deg,transparent_0%,transparent_46%,rgba(255,255,255,0.08)_46%,rgba(255,255,255,0.08)_48%,transparent_48%)]" />
          </div>
          <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-20">
            <div className="max-w-2xl">
              <p className="inline-flex items-center gap-2 border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white">
                <Sparkles size={15} aria-hidden="true" />
                Neighbourhood group rates
              </p>
              <h1 className="mt-6 text-4xl font-extrabold leading-[1.08] text-white sm:text-5xl lg:text-6xl">Stop Overpaying for Home Maintenance.</h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-primary-foreground/80 sm:text-xl">
                Save 20% on gutter cleaning and pressure washing when 3 houses on your street book together.
              </p>

              <div id="eligibility" className="mt-9 max-w-xl border border-white/15 bg-card p-5 text-foreground shadow-2xl sm:p-6">
                {submissionState === 'success' ? (
                  <div className="py-3" role="status" aria-live="polite">
                    <CircleCheck className="text-primary" size={42} aria-hidden="true" />
                    <h2 className="mt-4 text-2xl font-extrabold text-foreground">Address secured!</h2>
                    <p className="mt-3 leading-relaxed text-muted-foreground">You are the first on your block. We will email you the moment two more neighbors join so we can unlock your 20% discount.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} noValidate>
                    <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                      <ShieldCheck className="text-primary" size={19} aria-hidden="true" />
                      Check your street's availability
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">No payment details. No obligation.</p>
                    <label className="mt-5 block text-sm font-semibold text-foreground" htmlFor="street-address">Street address</label>
                    <div className="relative mt-2">
                      <MapPin className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-primary" size={19} aria-hidden="true" />
                      <input id="street-address" value={address} onChange={(event) => setAddress(event.target.value)} autoComplete="street-address" placeholder="123 Maple Avenue, Toronto, ON" required className="h-12 w-full border border-input bg-background pl-10 pr-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" />
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">Your address is used to match your street and postcode service area.</p>
                    <label className="mt-5 block text-sm font-semibold text-foreground" htmlFor="email">Email address</label>
                    <div className="relative mt-2">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-primary" size={19} aria-hidden="true" />
                      <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="you@example.com" required className="h-12 w-full border border-input bg-background pl-10 pr-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" />
                    </div>
                    {errorMessage && <p className="mt-3 text-sm font-medium text-destructive" role="alert">{errorMessage}</p>}
                    <button type="submit" disabled={submissionState === 'checking'} className="mt-6 flex h-12 w-full items-center justify-center gap-2 bg-accent px-5 text-sm font-bold text-white transition hover:bg-accent/90 disabled:cursor-wait disabled:opacity-80">
                      {submissionState === 'checking' && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />}
                      {submissionState === 'checking' ? 'Checking neighborhood density...' : "Check My Street's Eligibility"}
                    </button>
                  </form>
                )}
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-lg" aria-hidden="true">
              <div className="absolute inset-x-0 bottom-0 h-4/5 border border-white/20 bg-white/10" />
              <div className="relative grid grid-cols-3 gap-3 p-5 sm:gap-5 sm:p-9">
                {[true, false, false].map((joined, index) => (
                  <div key={index} className="border border-white/25 bg-white/95 p-3 shadow-lg sm:p-4">
                    <Home className={joined ? 'text-primary' : 'text-muted-foreground'} size={31} />
                    <div className="mt-6 h-2 w-3/4 bg-muted" />
                    <div className="mt-2 h-2 w-1/2 bg-muted" />
                    <div className={`mt-5 h-2 ${joined ? 'bg-accent' : 'bg-border'}`} />
                  </div>
                ))}
              </div>
              <div className="relative mx-5 mb-5 border border-accent bg-accent p-5 text-accent-foreground shadow-xl sm:mx-9 sm:mb-9">
                <div className="flex items-start gap-3">
                  <UsersRound size={24} aria-hidden="true" />
                  <div><p className="text-sm font-bold">One home is in</p><p className="mt-1 text-sm text-accent-foreground/80">Two more neighbours unlock the street rate.</p></div>
                </div>
                <div className="mt-5 flex gap-2">{[true, false, false].map((filled, index) => <span key={index} className={`h-2 flex-1 ${filled ? 'bg-primary' : 'bg-white/35'}`} />)}</div>
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="bg-muted/40 py-14 lg:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="text-sm font-bold uppercase tracking-wide text-primary">Designed around your street</p>
            <div className="mt-7 grid gap-8 md:grid-cols-3">
              {[
                ['1', 'Claim your address', 'Tell us where you live so we can start the local group.'],
                ['2', 'Neighbours join', 'We notify you as your block gets closer to the discount.'],
                ['3', 'Save 20%', 'Once three homes join, your group rate is ready to book.'],
              ].map(([number, heading, copy]) => (
                <article key={number} className="border-t-2 border-primary pt-4"><p className="text-sm font-bold text-accent">0{number}</p><h2 className="mt-3 text-xl font-extrabold text-foreground">{heading}</h2><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{copy}</p></article>
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}