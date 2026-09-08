import type { Request, Response } from 'express';
import Stripe from 'stripe';
import { getSecret } from '#airo/secrets';

function getStripe(): Stripe {
  const secretKey = getSecret('STRIPE_SECRET_KEY');
  if (!secretKey || typeof secretKey !== 'string') throw new Error('Stripe is not configured');
  return new Stripe(secretKey);
}

export default async function handler(req: Request, res: Response) {
  try {
    const { paymentIntentId, amount, addOnId } = req.body as { paymentIntentId?: string; amount?: number; addOnId?: string };
    if (!paymentIntentId || !paymentIntentId.startsWith('pi_') || typeof amount !== 'number' || !Number.isInteger(amount) || amount <= 0 || !addOnId) {
      res.status(400).json({ success: false, error: 'Invalid authorization update' });
      return;
    }

    const stripe = getStripe();
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (intent.status !== 'requires_capture') {
      res.status(409).json({ success: false, error: 'Authorization is no longer adjustable' });
      return;
    }

    const updated = await stripe.paymentIntents.update(paymentIntentId, {
      amount: intent.amount + amount,
      metadata: { ...intent.metadata, [`add_on_${addOnId}`]: String(amount) },
    });
    res.json({ success: true, paymentIntentId: updated.id, authorizedAmount: updated.amount });
  } catch (error) {
    console.error('update-authorization failed:', error);
    res.status(500).json({ success: false, error: 'Unable to update authorization' });
  }
}