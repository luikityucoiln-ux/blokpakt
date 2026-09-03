import type { Request, Response } from 'express';

// Coverage ZIP codes — in production this would be a DB lookup
const COVERED_ZIPS = new Set([
  '60601','60602','60603','60604','60605','60606','60607','60608','60609','60610',
  '60611','60612','60613','60614','60615','60616','60617','60618','60619','60620',
  '60621','60622','60623','60624','60625','60626','60628','60629','60630','60631',
  '60632','60633','60634','60636','60637','60638','60639','60640','60641','60642',
  '60643','60644','60645','60646','60647','60649','60651','60652','60653','60654',
  '60655','60656','60657','60659','60660','60661','60706','60707','60714',
  // Sample suburban ZIPs
  '60201','60202','60203','60204','60301','60302','60304','60402','60501','60513',
]);

// Block Captain: first provider per ZIP
const blockCaptainZips: Record<string, string> = {};

export default async function handler(req: Request, res: Response) {
  try {
    const {
      services,
      zips,
      firstName,
      lastName,
      email,
      phone,
      activationMethod, // 'deposit' | 'referral'
      referralEmail,
    } = req.body as {
      services: string[];
      zips: string[];
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      activationMethod: 'deposit' | 'referral';
      referralEmail?: string;
    };

    // Validate required fields
    if (!services?.length || !zips?.length || !firstName || !lastName || !email || !phone || !activationMethod) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check coverage
    const coveredZips = zips.filter((z) => COVERED_ZIPS.has(z.trim()));
    const uncoveredZips = zips.filter((z) => !COVERED_ZIPS.has(z.trim()));

    if (coveredZips.length === 0) {
      // All ZIPs out of coverage — add to waitlist
      return res.status(200).json({
        status: 'waitlist',
        message: 'Your ZIP codes are not yet in our coverage area. You have been added to the waitlist.',
        uncoveredZips,
      });
    }

    // Determine Block Captain status for each covered ZIP
    const blockCaptainZipsEarned: string[] = [];
    for (const zip of coveredZips) {
      if (!blockCaptainZips[zip]) {
        blockCaptainZips[zip] = email;
        blockCaptainZipsEarned.push(zip);
      }
    }

    const isBlockCaptain = blockCaptainZipsEarned.length > 0;

    // Referral validation
    if (activationMethod === 'referral' && !referralEmail) {
      return res.status(400).json({ error: 'Referral email is required for referral activation' });
    }

    // In production: save to DB, send confirmation email, trigger Stripe Connect onboarding
    const applicationId = `BP-${Date.now().toString(36).toUpperCase()}`;

    return res.status(201).json({
      status: activationMethod === 'deposit' ? 'pending_payment' : 'pending_referral',
      applicationId,
      isBlockCaptain,
      blockCaptainZips: blockCaptainZipsEarned,
      coveredZips,
      uncoveredZips,
      message:
        activationMethod === 'deposit'
          ? 'Application received. Complete your $99 activation deposit to start accepting jobs.'
          : 'Application received. Your activation will unlock once your referred homeowner completes their first job.',
    });
  } catch (err) {
    console.error('provider.apply.error', err);
    res.status(500).json({ error: 'Failed to submit application' });
  }
}
