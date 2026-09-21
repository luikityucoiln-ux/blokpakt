import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { Helmet } from '@dr.pogodin/react-helmet';
import { CheckCircle } from 'lucide-react';
import { readPendingBooking, clearPendingBooking } from '../../lib/pending-booking';
import { createJob } from '../../lib/jobs';

export default function CheckoutSuccess() {
  const [trackHref, setTrackHref] = useState('/track?code=BLK-DEMO1');
  const createdRef = useRef(false);

  useEffect(() => {
    if (createdRef.current) return;
    createdRef.current = true;

    const booking = readPendingBooking();
    if (!booking) return;

    void createJob({
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
      customerName: booking.customerName,
      customerEmail: booking.customerEmail || null,
      customerPhone: booking.customerPhone || null,
      providerName: booking.providerName,
      payoutCents: booking.payoutCents,
      paymentIntentId: null,
      checkoutSessionId: null,
    }).then(() => {
      setTrackHref(`/track?code=${encodeURIComponent(booking.jobCode)}`);
      clearPendingBooking();
    });
  }, []);

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
          <h1 className="mt-6 text-2xl font-extrabold text-foreground">Booking confirmed</h1>
          <p className="mt-2 text-sm text-muted-foreground">Your booking has been saved in this browser for the UI demo. No payment was taken.</p>
          <div className="mt-6 space-y-3">
            <Link to={trackHref} className="block w-full rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90">
              Track your service
            </Link>
            <Link to="/" className="block w-full rounded-xl bg-muted px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted/80">
              Return home
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
