/**
 * Stripe Cancel Payment API
 *
 * Releases a manual-capture authorization hold instantly (no processing
 * fees) when a batch fails to form or a booking is cancelled before the
 * job is completed — the counterpart to /capture-payment.
 *
 * Usage:
 *   POST /api/stripe/cancel-payment
 *   Body: { paymentIntentId }
 */
import type { Request, Response } from 'express';
import Stripe from 'stripe';
import { getSecret } from '#airo/secrets';

function getStripe(): Stripe {
  const secretKey = getSecret('STRIPE_SECRET_KEY');
  if (!secretKey || typeof secretKey !== 'string') {
    throw new Error('STRIPE_SECRET_KEY not provisioned. Re-run Stripe setup or contact support.');
  }
  return new Stripe(secretKey);
}

const CANCELABLE_STATUSES: Stripe.PaymentIntent.Status[] = [
  'requires_payment_method',
  'requires_capture',
  'requires_confirmation',
  'requires_action',
  'processing',
];

export default async function handler(req: Request, res: Response) {
  try {
    const { paymentIntentId } = req.body as { paymentIntentId?: string };
    if (!paymentIntentId || !paymentIntentId.startsWith('pi_')) {
      res.status(400).json({ success: false, error: 'Missing or invalid paymentIntentId' });
      return;
    }

    const stripe = getStripe();
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (intent.status === 'canceled') {
      // Already released (e.g. duplicate cancellation request) — treat as success.
      res.json({ success: true, paymentIntentId: intent.id, status: intent.status });
      return;
    }

    if (!CANCELABLE_STATUSES.includes(intent.status)) {
      res.status(409).json({ success: false, error: `Hold cannot be released from status: ${intent.status}` });
      return;
    }

    const cancelled = await stripe.paymentIntents.cancel(paymentIntentId, {
      cancellation_reason: 'requested_by_customer',
    });
    res.json({ success: true, paymentIntentId: cancelled.id, status: cancelled.status });
  } catch (error) {
    console.error('cancel-payment failed:', error);
    if (error instanceof Stripe.errors.StripeError) {
      res.status(error.statusCode || 500).json({ success: false, error: 'Unable to release the authorization hold' });
      return;
    }
    res.status(500).json({ success: false, error: 'Unable to release the authorization hold' });
  }
}
