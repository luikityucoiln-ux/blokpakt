import { supabase } from './supabase';

export interface Batch {
  code: string;
  street: string;
  service: string;
  batchPrice: number;
  soloPrice: number;
  homesBooked: number;
  targetHomes: number;
}

interface BatchRow {
  code: string;
  street: string;
  service: string;
  batch_price_cents: number;
  solo_price_cents: number;
  homes_booked: number;
  target_homes: number;
}

function fromRow(row: BatchRow): Batch {
  return {
    code: row.code,
    street: row.street,
    service: row.service,
    batchPrice: row.batch_price_cents / 100,
    soloPrice: row.solo_price_cents / 100,
    homesBooked: row.homes_booked,
    targetHomes: row.target_homes,
  };
}

export async function getBatchByCode(code: string): Promise<Batch | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('batches')
    .select('code, street, service, batch_price_cents, solo_price_cents, homes_booked, target_homes')
    .eq('code', code)
    .maybeSingle();
  if (error) throw error;
  return data ? fromRow(data as BatchRow) : null;
}

export async function listBatches(): Promise<Batch[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('batches')
    .select('code, street, service, batch_price_cents, solo_price_cents, homes_booked, target_homes')
    .order('code', { ascending: true });
  if (error) throw error;
  return (data as BatchRow[]).map(fromRow);
}

