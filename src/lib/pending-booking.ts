/**
 * Bridges booking form data between the booking and confirmation screens.
 */
const STORAGE_KEY = 'blokpakt:pending_booking';

export interface PendingBooking {
  jobCode: string;
  service: string;
  serviceIcon: string;
  payoutCents: number;
  address: string;
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
