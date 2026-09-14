/**
 * Stripe Capture Payment API
 *
 * Captures a previously authorized (manual capture) PaymentIntent once a
 * contractor marks a job complete with photo verification. This is the
 * counterpart to the `capture_method: 'manual'` hold created at checkout.
 *
 * Usage:
 *   POST /api/stripe/capture-payment
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

export default async function handler(req: Request, res: Response) {
  try {
    const { paymentIntentId } = req.body as { paymentIntentId?: string };
    if (!paymentIntentId || !paymentIntentId.startsWith('pi_')) {
      res.status(400).json({ success: false, error: 'Missing or invalid paymentIntentId' });
      return;
    }

    const stripe = getStripe();
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (intent.status === 'succeeded') {
      // Already captured (e.g. duplicate "Job Complete" tap) — treat as success.
      res.json({ success: true, paymentIntentId: intent.id, status: intent.status, amountCaptured: intent.amount_received });
      return;
    }

    if (intent.status !== 'requires_capture') {
      res.status(409).json({ success: false, error: `Payment cannot be captured from status: ${intent.status}` });
      return;
    }

    const captured = await stripe.paymentIntents.capture(paymentIntentId);
    res.json({
      success: true,
      paymentIntentId: captured.id,
      status: captured.status,
      amountCaptured: captured.amount_received,
    });
  } catch (error) {
    console.error('capture-payment failed:', error);
    if (error instanceof Stripe.errors.StripeError) {
      res.status(error.statusCode || 500).json({ success: false, error: 'Unable to capture payment' });
      return;
    }
    res.status(500).json({ success: false, error: 'Unable to capture payment' });
  }
}
