# Blokpakt: product identity comes first

Blokpakt is an asset-light **home-services marketplace**, starting with a
manually operated US pilot. It connects households with independent service
providers and aims to group nearby demand. It is NOT a trading platform,
investment product, cryptocurrency exchange, or financial marketplace.

"Block" means nearby households and grouped service work. "Provider" means an
independent home-service professional, not a broker or investment provider.

Before changing product behavior, read the [English story](README.md#our-story)
and [product rules](ROADMAP.md). If a proposed change contradicts them, stop,
identify the mismatch, and correct the proposal rather than changing the product
to fit an AI assumption. Ask the owner about genuine changes in business scope.

- Preserve the existing green/orange visual identity and mobile usability.
- Keep verified facts, hypotheses, demo examples, and working features distinct.
  Do not invent founder experiences, customer numbers, earnings, nationwide
  coverage, AI capabilities, or guaranteed cost savings.
- Current live scope: verified email sign-in, private service requests, and
  administrator-led review/confirmation. Service area, contractor availability,
  price, and timing require manual agreement. No online payments or auto-dispatch.
- Demo bookings, providers, prices, photos, and metrics are not real records.
  Do not copy them into production, treat a request as a confirmed booking, or
  fall back to demo data when a live API fails.
- Browser UI is not authorization. Preserve server-side ownership checks,
  administrator allowlists, RLS, and the existing evidence-storage lock.
  Never accept a client-selected role or put secrets in `VITE_` variables.
- Apply additive migrations; never fix setup failures by deleting tables or
  disabling RLS. Follow [pilot setup](supabase/PILOT_SETUP.md).
- Validate changed behavior with targeted Vitest tests, the production build,
  and SQL permission/lifecycle tests when changing database operations.
- Explain work to the owner in Traditional Chinese; keep website copy and the
  product story in English unless asked otherwise.

These are project requirements, not a guarantee that every AI tool loads them.
Confirm the active tool has loaded project context before relying on it.
