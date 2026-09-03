import type { Request, Response } from 'express';

const COVERED_ZIPS = new Set([
  '60601','60602','60603','60604','60605','60606','60607','60608','60609','60610',
  '60611','60612','60613','60614','60615','60616','60617','60618','60619','60620',
  '60621','60622','60623','60624','60625','60626','60628','60629','60630','60631',
  '60632','60633','60634','60636','60637','60638','60639','60640','60641','60642',
  '60643','60644','60645','60646','60647','60649','60651','60652','60653','60654',
  '60655','60656','60657','60659','60660','60661','60706','60707','60714',
  '60201','60202','60203','60204','60301','60302','60304','60402','60501','60513',
]);

// Block Captain: first provider per ZIP (in-memory for demo; use DB in production)
const blockCaptainZips: Record<string, boolean> = {};

export default async function handler(req: Request, res: Response) {
  try {
    const { zips } = req.body as { zips: string[] };
    if (!Array.isArray(zips) || zips.length === 0) {
      return res.status(400).json({ error: 'zips array required' });
    }

    const results = zips.map((zip) => {
      const trimmed = zip.trim();
      const covered = COVERED_ZIPS.has(trimmed);
      const isBlockCaptainAvailable = covered && !blockCaptainZips[trimmed];
      return { zip: trimmed, covered, isBlockCaptainAvailable };
    });

    return res.json({ results });
  } catch (err) {
    res.status(500).json({ error: 'Failed to check ZIP coverage' });
  }
}
