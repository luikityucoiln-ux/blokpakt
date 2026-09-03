/**
 * Checkout Success Page
 *
 * Displayed after Stripe payment redirect.
 * VALIDATES payment via S2S call before showing success.
 *
 * URL: /checkout/success?session_id=cs_xxx
 *
 * Stripe enum values (for reference):
 *   session.status: "open" | "complete" | "expired"
 *   session.payment_status: "paid" | "unpaid" | "no_payment_required"
 */
import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Helmet } from '@dr.pogodin/react-helmet';
import { checkout_success as cs } from 'virtual:content';

import { useCart } from '@/contexts/use-cart';
import { formatPrice } from '@/lib/stripe/format';

interface SessionDetails {
  customerName?: string;
  amountTotal?: number;
  currency?: string;
  paymentStatus?: string; // "paid" | "unpaid" | "no_payment_required"
  status?: string; // "open" | "complete" | "expired"
}

// Verification states
type VerificationState = 'verifying' | 'verified' | 'failed' | 'no_session';

export default function CheckoutSuccess() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const { clearCart } = useCart();
  const [details, setDetails] = useState<SessionDetails | null>(null);
  const [verification, setVerification] = useState<VerificationState>('verifying');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const firedRef = useRef(false);

  // MANDATORY: Verify payment status with Stripe before showing success
  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;

    // No session_id in URL
    if (!sessionId) {
      setVerification('no_session');
      setErrorMessage('No payment session found. Please try again.');
      return;
    }

    // DEMO MODE: bypass Stripe validation for prototype sessions
    if (sessionId.startsWith('demo_session')) {
      setDetails({
        customerName: 'Alex Johnson',
        amountTotal: 18000,
        currency: 'usd',
        paymentStatus: 'paid',
        status: 'complete',
      });
      setVerification('verified');
      return;
    }

    // Validate session_id format (Stripe checkout sessions start with "cs_")
    if (!sessionId.startsWith('cs_')) {
      setVerification('failed');
      setErrorMessage('Invalid session format.');
      return;
    }

    // Fetch session from backend (which calls Stripe API)
    fetch(`/api/stripe/session/${sessionId}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error('Failed to retrieve session');
        }
        return res.json();
      })
      .then((data) => {
        if (!data?.success || !data?.session) {
          throw new Error('Invalid session response');
        }

        const session = data.session;
        setDetails(session);

        // ROBUST CHECK: Verify BOTH status AND payment_status per Stripe docs
        // status: "complete" means checkout flow finished
        // payment_status: "paid" means payment was successful
        const isComplete = session.status === 'complete';
        const isPaid = session.paymentStatus === 'paid';

        if (isComplete && isPaid) {
          const marker = sessionStorage.getItem('stripe-buy-now-session');
          sessionStorage.removeItem('stripe-buy-now-session');
          if (marker !== sessionId) {
            clearCart();
          }
          setVerification('verified');
        } else if (session.paymentStatus === 'unpaid') {
          setVerification('failed');
          setErrorMessage('Payment was not completed. Please try again.');
        } else if (session.status === 'expired') {
          setVerification('failed');
          setErrorMessage('Payment session expired. Please try again.');
        } else if (session.status === 'open') {
          setVerification('failed');
          setErrorMessage('Payment is still processing. Please wait or contact support.');
        } else {
          // Fallback for any unexpected state
          setVerification('failed');
          setErrorMessage('Unable to verify payment. Please contact support.');
        }
      })
      .catch((error) => {
        console.error('Payment verification failed:', error);
        setVerification('failed');
        setErrorMessage('Unable to verify payment. Please contact support if you were charged.');
      });
  }, [sessionId, clearCart]);

  // VERIFYING STATE - Show loading spinner
  if (verification === 'verifying') {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-card border border-border rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">{cs.verifyingTitle}</h1>
          <p className="text-muted-foreground text-sm">{cs.verifyingSubtitle}</p>
        </div>
      </div>
    );
  }

  // FAILED or NO_SESSION STATE - Show error
  if (verification === 'failed' || verification === 'no_session') {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-card border border-border rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">{cs.failedTitle}</h1>
          <p className="text-muted-foreground text-sm mb-6">{errorMessage}</p>
          <div className="space-y-3">
            <Link to="/book" className="block w-full bg-accent text-white py-3 px-4 rounded-xl font-semibold text-sm hover:bg-accent/90 transition-colors">
              {cs.failedTryAgainLabel}
            </Link>
            <Link to="/" className="block w-full bg-muted text-foreground py-3 px-4 rounded-xl font-semibold text-sm hover:bg-muted/80 transition-colors">
              {cs.failedReturnHomeLabel}
            </Link>
          </div>
          {sessionId && (
            <p className="mt-6 text-xs text-muted-foreground">{cs.refLabel}: {sessionId.slice(0, 20)}…</p>
          )}
        </div>
      </div>
    );
  }

  // VERIFIED STATE - Payment confirmed! Show success
  return (
    <>
      <Helmet>
        <title>Booking Confirmed — Blokpakt</title>
        <meta name="description" content="Your Blokpakt service booking is confirmed. Your card is authorized and will only be charged after photo-verified completion." />
        <link rel="canonical" href="https://blokpakt.com/checkout/success" />
        <meta name="robots" content="noindex" />
      </Helmet>
    <div className="min-h-screen bg-muted/30 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-card border border-border rounded-2xl shadow-lg p-8 text-center">
        {/* Success icon */}
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-2xl font-extrabold text-foreground mb-2">{cs.successTitle}</h1>
        <p className="text-muted-foreground text-sm mb-6">
          {cs.successSubtitle}
        </p>

        {/* Order details */}
        {details && (
          <div className="bg-muted/40 rounded-xl p-4 mb-6 text-left space-y-1.5">
            {details.customerName && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{cs.detailCustomerLabel}</span>
                <span className="font-semibold text-foreground">{details.customerName}</span>
              </div>
            )}
            {details.amountTotal != null && details.currency && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{cs.detailAmountLabel}</span>
                <span className="font-semibold text-foreground">{formatPrice(details.amountTotal, details.currency)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{cs.detailStatusLabel}</span>
              <span className="font-semibold text-primary">{cs.detailStatusValue}</span>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <Link
            to="/track"
            className="block w-full bg-primary text-primary-foreground py-3 px-4 rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors"
          >
            {cs.trackCtaLabel}
          </Link>
          <Link
            to="/"
            className="block w-full bg-muted text-foreground py-3 px-4 rounded-xl font-semibold text-sm hover:bg-muted/80 transition-colors"
          >
            {cs.returnHomeLabel}
          </Link>
        </div>

        {sessionId && (
          <p className="mt-6 text-xs text-muted-foreground">{cs.refLabel}: {sessionId.slice(0, 20)}…</p>
        )}
      </div>
    </div>
    </>
  );
}
