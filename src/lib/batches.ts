export interface Batch {
  code: string;
  street: string;
  service: string;
  batchPrice: number;
  soloPrice: number;
  homesBooked: number;
  targetHomes: number;
}

const batches: Batch[] = [
  { code: 'MAPLE-2026', street: 'Maple Ave', service: 'Lawn Care', batchPrice: 45, soloPrice: 50, homesBooked: 2, targetHomes: 4 },
  { code: 'OAK-2026', street: 'Oak Street', service: 'Gutter Cleaning', batchPrice: 162, soloPrice: 180, homesBooked: 3, targetHomes: 4 },
];

export async function getBatchByCode(code: string): Promise<Batch | null> {
  return batches.find((batch) => batch.code === code) ?? null;
}

export async function listBatches(): Promise<Batch[]> {
  return [...batches];
}
