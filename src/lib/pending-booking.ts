/**
 * Bridges booking form data across the Stripe-hosted checkout redirect.
 * Stripe Checkout takes the browser to a different origin and back, so any
 * in-memory React state from book.tsx is lost — sessionStorage survives the
 * round trip and lets checkout/success.tsx create the job record once the
 * payment authorization is confirmed.
 */
const STORAGE_KEY = 'blokpakt:pending_booking';

export interface PendingBooking {
  jobCode: string;
  service: string;
  serviceIcon: string;
  payoutCents: number;
  address: string;
  city: string;
  zip: string;
  gateCode: string;
  propertyNotes: string;
  scheduledWindow: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  batchCode: string | null;
  providerName: string;
}

export function savePendingBooking(booking: PendingBooking): void {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(booking));
}

export function readPendingBooking(): PendingBooking | null {
  if (typeof sessionStorage === 'undefined') return null;
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PendingBooking;
  } catch {
    return null;
  }
}

export function clearPendingBooking(): void {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.removeItem(STORAGE_KEY);
}
