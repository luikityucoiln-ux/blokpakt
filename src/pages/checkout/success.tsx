import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Helmet } from '@dr.pogodin/react-helmet';
import { CheckCircle } from 'lucide-react';
import { readPendingBooking, clearPendingBooking } from '../../lib/pending-booking';
import { createJob, getJobByCode } from '../../lib/jobs';

export default function CheckoutSuccess() {
  const [params, setParams] = useSearchParams();
  const [trackHref, setTrackHref] = useState<string | null>(null);
  const [error, setError] = useState('');
  const createdRef = useRef(false);

  useEffect(() => {
    if (createdRef.current) return;
    createdRef.current = true;

    async function confirm() {
    const code = params.get('code');
    if (code) {
      const existing = await getJobByCode(code);
      if (!existing) throw new Error('This demo booking is not saved in this tab.');
      setTrackHref(`/track?code=${encodeURIComponent(code)}`);
      return;
    }
    const booking = readPendingBooking();
    if (!booking) {
      throw new Error('No pending booking. Start a new demo booking to continue.');
    }

    await createJob({
      id: `job-${booking.jobCode}`,
      code: booking.jobCode,
      batchCode: booking.batchCode,
      service: booking.service,
      serviceIcon: booking.serviceIcon,
      address: booking.address,
      zip: booking.zip,
      gateCode: booking.gateCode || null,
      propertyNotes: booking.propertyNotes,
      scheduledWindow: booking.scheduledWindow || null,
      serviceDate: booking.serviceDate,
      customerName: booking.customerName,
      customerEmail: booking.customerEmail || null,
      customerPhone: booking.customerPhone || null,
      providerName: booking.providerName,
      payoutCents: booking.payoutCents,
      paymentIntentId: null,
      checkoutSessionId: null,
    });
      setTrackHref(`/track?code=${encodeURIComponent(booking.jobCode)}`);
      clearPendingBooking();
      setParams({ code: booking.jobCode }, { replace: true });
    }
    void confirm().catch((error: unknown) => setError(error instanceof Error ? error.message : 'Could not save your booking.'));
  }, [params, setParams]);

  return (
    <>
      <Helmet>
        <title>Booking Confirmed - Blokpakt</title>
        <meta name="description" content="Your demo booking is confirmed." />
        <meta name="robots" content="noindex" />
      </Helmet>
      <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-12">
        <section className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-lg">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle aria-hidden="true" className="size-8 text-primary" />
          </div>
          <h1 className="mt-6 text-2xl font-extrabold text-foreground">{error ? 'Booking unavailable' : trackHref ? 'Demo booking saved' : 'Saving your booking...'}</h1>
          {error && <p role="alert" className="mt-2 text-sm text-destructive">{error}</p>}
          {trackHref && <p className="mt-2 text-sm text-muted-foreground">Saved in this browser tab for the demo. No payment was taken. Switch to the provider view to accept the route and complete the work.</p>}
          <div className="mt-6 space-y-3">
            {trackHref && <Link to={trackHref} className="block w-full rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90">
              Track your service
            </Link>}
            <Link to="/field" className="block text-sm font-semibold text-primary">Open provider demo</Link>
            <Link to="/" className="block w-full rounded-xl bg-muted px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted/80">
              Return home
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
