# Version 2 Ideas

Deferred so Phase 1–4 (real checkout, capture, live data, env keys) could ship without scope creep. Do not build these until the MVP payment flow is verified in production.

1. **Provider Stripe Connect payouts** — [field.tsx](src/pages/field.tsx)'s "Cash out" button and [admin.tsx](src/pages/admin.tsx)'s payout approval flow are still simulated. Needs contractor onboarding (Connect Express/Standard), KYC, and real transfers tied to captured payments.
2. **Dispatch/route assignment system** — jobs currently have no real provider assignment or routing logic; `position` on `jobs` is a placeholder. Needs a dispatcher UI and algorithm to assign jobs to providers and order routes.
3. **Real photo upload/storage** — before/after photos are stored as the literal string `'captured'`, not actual images. Needs Supabase Storage (or similar) integration with signed uploads.
4. **Batch homes-booked increments** — `batches.homes_booked` doesn't auto-increment when a neighbor books via a referral code; needs booking-time logic to join/update the batch row.
5. **Admin dashboard live data** — [admin.tsx](src/pages/admin.tsx) (`PROVIDERS`, `TIMELINE_JOBS`) is still hardcoded demo data; wire it to the same `jobs`/providers tables once a providers table exists.
6. **Dispute review workflow** — filing a dispute just sets `status: 'disputed'`; there's no admin queue to resolve disputes, release/refund captured or authorized payments, or notify the customer of an outcome.
7. **Products.tsx** — page is unrouted and its `PRODUCTS` array is empty; either wire it to real Stripe products or remove it.

Add new ideas below as they come up during MVP testing:
