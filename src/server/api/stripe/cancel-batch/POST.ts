/**
 * Stripe Cancel Batch API
 *
 * Releases every still-open authorization hold in a neighborhood batch when
 * the batch fails to reach minimum volume or is otherwise called off. This
 * is the batch-level counterpart to /cancel-payment, which releases a
 * single job's hold.
 *
 * Usage:
 *   POST /api/stripe/cancel-batch
 *   Body: { batchCode }
 */
import type { Request, Response } from 'express';
import Stripe from 'stripe';
import { getSecret } from '#airo/secrets';
import { listJobsByBatchCode, updateJob } from '../../../../lib/jobs.js';

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

const CLOSED_JOB_STATUSES = new Set(['complete', 'cancelled']);

export default async function handler(req: Request, res: Response) {
  try {
    const { batchCode } = req.body as { batchCode?: string };
    if (!batchCode) {
      res.status(400).json({ success: false, error: 'Missing required field: batchCode' });
      return;
    }

    const jobs = await listJobsByBatchCode(batchCode);
    const openJobs = jobs.filter((job) => !CLOSED_JOB_STATUSES.has(job.status));
    if (openJobs.length === 0) {
      res.json({ success: true, cancelled: [], skipped: [] });
      return;
    }

    const stripe = getStripe();
    const cancelled: string[] = [];
    const skipped: Array<{ jobId: string; reason: string }> = [];

    for (const job of openJobs) {
      try {
        if (job.paymentIntentId) {
          const intent = await stripe.paymentIntents.retrieve(job.paymentIntentId);
          if (intent.status !== 'canceled' && !CANCELABLE_STATUSES.includes(intent.status)) {
            skipped.push({ jobId: job.id, reason: `Hold cannot be released from status: ${intent.status}` });
            continue;
          }
          if (intent.status !== 'canceled') {
            await stripe.paymentIntents.cancel(job.paymentIntentId, { cancellation_reason: 'requested_by_customer' });
          }
        }
        await updateJob(job.id, { status: 'cancelled' });
        cancelled.push(job.id);
      } catch (jobError) {
        console.error('cancel-batch: failed to release job', job.id, jobError);
        skipped.push({ jobId: job.id, reason: 'Unable to release this job\'s hold' });
      }
    }

    res.json({ success: true, cancelled, skipped });
  } catch (error) {
    console.error('cancel-batch failed:', error);
    if (error instanceof Stripe.errors.StripeError) {
      res.status(error.statusCode || 500).json({ success: false, error: 'Unable to release the batch holds' });
      return;
    }
    res.status(500).json({ success: false, error: 'Unable to release the batch holds' });
  }
}
