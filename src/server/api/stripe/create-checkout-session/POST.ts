/**
 * Stripe Checkout Session API
 *
 * Creates a Stripe Checkout session for one-time payments or subscriptions.
 * Automatically determines mode based on price type (recurring vs one-time).
 *
 * Security: Redirect URLs are derived from request origin - NOT accepted from frontend.
 *
 * Usage:
 *   POST /api/stripe/create-checkout-session
 *   Body: { priceId, quantity? }
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

interface CreateCheckoutSessionRequest {
  priceId?: string; // For single item checkout
  quantity?: number;
  metadata?: Record<string, string>; // Optional booking/order metadata
  // Note: successUrl/cancelUrl NOT accepted - derived from request origin (security)
}

const VALID_TIME_WINDOWS = new Set(['morning', 'afternoon', 'flexible']);

function parseDateKey(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? date : null;
}

function utcDateAfterDays(days: number): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + days));
}

export default async function handler(req: Request, res: Response) {
  try {
    const {
      priceId,
      quantity = 1,
      metadata,
    } = req.body as CreateCheckoutSessionRequest;

    if (!priceId) {
      res.status(400).json({
        success: false,
        error: 'Missing required field: priceId',
      });
      return;
    }

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
      res.status(400).json({
        success: false,
        error: 'Invalid quantity',
      });
      return;
    }

    if (metadata && (!Object.values(metadata).every((value) => typeof value === 'string') || Object.keys(metadata).length > 50)) {
      res.status(400).json({
        success: false,
        error: 'Invalid checkout metadata',
      });
      return;
    }

    if (metadata?.jobCode) {
      const scheduledDate = metadata.scheduledDate ? parseDateKey(metadata.scheduledDate) : null;
      const timeWindow = metadata.timeWindow;
      if (!scheduledDate || !timeWindow || !VALID_TIME_WINDOWS.has(timeWindow)) {
        res.status(400).json({ success: false, error: 'Missing or invalid booking schedule' });
        return;
      }
      if (scheduledDate < utcDateAfterDays(7) || scheduledDate > utcDateAfterDays(90)) {
        res.status(400).json({ success: false, error: 'Bookings must be scheduled 7 to 90 days in advance' });
        return;
      }
    }

    // Derive redirect URLs from request origin (security - not from frontend body)
    const origin = req.headers.origin || `https://${req.headers.host}`;
    const successUrl = `${origin}/checkout/success`;
    const cancelUrl = `${origin}/checkout/cancel`;

    const stripe = getStripe();
    const price = await stripe.prices.retrieve(priceId);
    const mode: Stripe.Checkout.SessionCreateParams.Mode = price.recurring ? 'subscription' : 'payment';
    const isFlexibleSlot = metadata?.flexibleSlot === 'true';
    if (isFlexibleSlot && mode !== 'payment') {
      res.status(400).json({ success: false, error: 'Flexible slots are only available for one-time payments' });
      return;
    }

    const sessionLineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = isFlexibleSlot
      ? [{
          price_data: {
            currency: price.currency,
            product: typeof price.product === 'string' ? price.product : price.product.id,
            unit_amount: (price.unit_amount ?? 0) - 200,
          },
          quantity,
        }]
      : [{ price: priceId, quantity }];

    if (isFlexibleSlot && (price.unit_amount ?? 0) <= 200) {
      res.status(400).json({ success: false, error: 'Flexible discount cannot be applied to this price' });
      return;
    }

    // Build session parameters
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      line_items: sessionLineItems,
      mode,
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      billing_address_collection: 'required', // Always collect billing address
      phone_number_collection: { enabled: true }, // Always collect phone number
      ...(mode === 'payment' ? { payment_intent_data: { capture_method: 'manual' as const } } : {}),
      ...(metadata && Object.keys(metadata).length > 0 ? { metadata } : {}),
    };

    const session = await stripe.checkout.sessions.create(sessionParams);

    res.json({
      success: true,
      url: session.url,
      sessionId: session.id,
      mode,
    });
  } catch (error) {
    // Log the real error server-side for debugging; never echo internal detail
    // (missing-key messages, Stripe account state) back to the shopper, who
    // sees this string rendered as the checkout error.
    console.error('create-checkout-session failed:', error);

    if (error instanceof Stripe.errors.StripeError) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: 'Unable to start checkout. Please try again or contact support.',
        code: error.code,
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Unable to start checkout. Please try again or contact support.',
    });
  }
}

