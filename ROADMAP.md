# Blokpakt Product Roadmap

## Purpose

This file is the source of truth for product rules that must survive UI iteration and guide future backend work. Read this file before changing booking, routing, contractor selection, reviews, payments, or database design.

## Current Phase: Demo Marketplace + Guarded Service-Request Pilot

- Marketplace workflows use local mock data and browser-only interactions. Email
  sign-in is connected to Supabase Auth, subject to redirect and email-delivery
  configuration on the deployed site.
- The owner approved a US pilot and delegated the first launch scope: real
  requests, private customer records, and operator-led review, with manual quotes
  and no online payments. The city/coverage and contractors are not established.
  Do not claim a live deployment before setup and real-account checks pass.
- The connected booking, tracking, provider and add-on demo uses tab-scoped `sessionStorage`. Saved jobs, route acceptance, photos, and add-on decisions survive reloads in the same tab, but are not shared between devices or browser tabs.
- The booking, tracking, field, and admin screens exist to validate the user experience, not to process real work.

### Real Service-Request Pilot

- Read [the story](README.md#our-story) and [AI product guidance](AGENTS.md):
  Blokpakt is a home-services marketplace, never a trading/investment platform.
- Apply the additive second migration and follow [pilot setup](supabase/PILOT_SETUP.md).
  New requests start paused; an operator must activate intake and supported services.
- `/request-service`, `/requests`, and `/ops` use Supabase, not demo stores.
  A verified customer creates a request; ownership and an explicit admin allowlist
  govern reads. Browsers cannot write tables or promote themselves directly.
- An initial request is not a confirmed booking. Review coverage, contractor
  availability, and customer agreement manually before recording a USD quote/date.
  All operator updates are customer-visible and audited; conflicting edits fail.
- Customers can cancel unconfirmed requests. The operator handles confirmed work.
  No real charges, provider assignment APIs, evidence uploads, or automatic mail
  notifications are added by this pilot.
- `VITE_ENABLE_LIVE_REQUESTS=true` switches `/book`, `/track`, and `/admin` to the
  pilot after deployment checks. Default false preserves the existing demo.
  Marketing prices/providers and other demo screens are not automatically made live.

### Email Sign-In

- `/login` sends real email links; `/auth/callback` exchanges a PKCE code once
  per mounted callback and returns to the account screen. Use the same browser
  to request and open the link. Errors must not be presented as success.
- Keep login optional for the marketplace demo. Signed-in users see their email
  and can sign out, but demo data remains local and is neither migrated nor
  protected by authentication. Never use real customer records in the demo.
- No client-selected role or sign-in grants provider approval or admin access.
  The initial SQL browser-write and evidence restrictions stay in place. Separate
  request RPCs add only the guarded pilot operations described above.
- Verify Supabase Site URL, exact callback allowlist, email delivery, and
  deployment public environment variables before inviting real users.

### Supabase Foundation

- Apply `supabase/migrations/202610150001_marketplace_foundation.sql` once to the new project using the SQL Editor. It creates seven RLS-protected tables and a locked private evidence bucket. It does not import browser demo records.
- Customer-facing booking will not require a password or a separate registration form. Email magic-link verification will establish an internal Supabase Auth identity before allowing private order access. "Guest booking" does not mean anonymous access to addresses or photos.
- Providers must authenticate and receive operator approval. No client can grant approval, set prices, claim work, change status, or create bookings directly in this foundation.
- Customers can read only their own bookings. Approved providers can read exact addresses only after their assigned route is accepted. Customer contact details are separate and unavailable to providers.
- Service IDs match the prototype, but live services start inactive. Prices, currency, geography, service coverage and scheduling rules must be configured for the pilot; current demo prices are not imported.
- Direct browser writes and evidence uploads/downloads are intentionally locked until a later migration adds verified operations. Route acceptance, street/zone validation, transition guards, mandatory photo completion, Premium checks, add-ons and reviews are not live APIs yet.
- The service capability, route/service/date, six-stop, nonnegative-money and ownership constraints are a starting foundation, not a substitute for the remaining business-rule APIs.
- Initial rollout: passwordless customer access, approved provider access, operator-assisted dispatch, and then cross-device booking tests. No AI or real payments in this phase.

### Connected Customer / Provider Demo

1. Create a booking at `/book`, open its tracking link, then switch to `/field`.
2. New jobs are grouped by normalized street, ZIP, service, requested date/window, and preferred provider. Each block holds at most six stops. Smaller blocks remain acceptable for testing a low-volume marketplace; this is not geofencing, drive-time optimization, or AI.
3. Accepting a block claims every stop together. Accepted blocks are closed to additional bookings. Work advances in booking order, not an optimized navigation order.
4. Mark arrival, save before and after photos, and complete each stop. Both photos are required. JPEG, PNG and WebP files under 1 MB each are supported; browser storage errors are shown rather than treating a failed save as success.
5. Fixed-price extras remain pending until approved from the matching customer's tracking page. Only approved extras count toward demo earnings.
6. Use the customer-view link to inspect the same booking, progress, and photos. Unknown booking codes show an error, never another customer's sample booking.
7. Prices and provider earnings are illustrative, not negotiated wholesale rates. Cashout is a preview, available only after all accepted jobs are completed; no money moves. Issue reporting remains a page-local preview, not an actual support submission.

### Management and Feature-Demand Demo

- `/admin` defaults to Management, with connected demo record counts, searchable
  lists, internal notes and follow-up flags. Existing operations mockups remain
  separate sample tabs; do not mix their fixture KPIs with connected records.
- Provider applications submitted through `/join` enter a local review queue.
  "Reviewed" is an administrative demo label, not approval or authorization.
- Homepage feature tests must state that their functionality is unavailable.
  They may record locally opted-in interest but must not imply successful booking,
  enrollment, payment, or a launch commitment.
- Count visible views separately from clicks. Deduplicate impressions and clicked
  views per mounted button, keep raw repeat clicks separately, show no CTR for zero
  views, and never present a small demo sample as proven demand or guaranteed CTR.
- Management and feature metrics remain tab-local. Do not expose Supabase records
  through this unauthenticated demo or change database policies to make it live.
  Production requires verified admin access, scoped data APIs, appropriate
  analytics consent, and server-side aggregation before rollout.

The asset-light model does not require owned vehicles or AI. A 20% cost reduction is a business target to validate in a pilot, not a measured result or a product guarantee. Live scheduling, provider identity/eligibility, secure photo storage, payments, and customer notifications remain backend work.

## Marketplace Rules

### Service and Batch Pricing

1. Customers can browse Lawn Care, Gutter Cleaning, Pressure Washing, and Snow Removal.
2. Each service has a solo rate and a street batch rate.
3. The street batch rate unlocks when two or more homes on the same street book the same service.
4. The UI must clearly show the savings between the solo rate and the street batch rate.
5. Service details must show what is included and what is usually not included.

### Contractor Supply and Radius

1. Contractor availability must be determined by service coverage, provider-defined service zones, and API-calculated drive time from the customer.
2. The marketplace should display enough supply for early-stage social proof.
3. Mock contractor distances must be realistic and may range up to 14 miles; this is a UI presentation rule, not the production routing constraint.
4. Example distances: 2.4 mi, 8.1 mi, and 13.5 mi.
5. Contractor cards show initials, name, rating, completed job count, and distance.
6. A Block Captain may receive a visible badge.

### Free and Premium Customers

1. Free customers are auto-routed to a suitable contractor.
2. Free customers cannot select a specific contractor.
3. For free customers, contractor cards are view-only and must not render selection arrows or clickable controls.
4. Free customers should see this message near the contractor list: "Upgrade to Blokpakt Premium to hand-pick your pro and get priority routing."
5. Free customers proceed through the normal booking flow with the main "Next: Property details" button.
6. Premium customers can select a specific contractor.
7. Premium contractor cards are interactive and display a selection arrow.
8. Premium customers see a "Diamond Member" badge in the contractor and review experience.
9. The current UI prototype enables Premium mode with `?premium=true` on the booking URL. Replace this with an authenticated entitlement check when backend work begins.

### Reviews and Evidence

1. Customers can submit service reviews after a completed job.
2. Any rating below 4 stars requires an issue tag and at least one photo as supporting evidence before it can be submitted.
3. Reviews should remain linked to a completed booking, customer, contractor, and service.
4. Review evidence must be stored separately from the review record and protected from public modification.

## Future Backend Requirements

### Core Data Models

Create persistent models for:

- Users and customer profiles
- Premium membership or entitlement status
- Contractors and contractor service coverage
- Contractor service areas and coordinates
- Services and pricing
- Street batches
- Bookings and appointment status
- Contractor assignments and auto-routing decisions
- Reviews and review evidence
- Optional provider add-on requests

### Data Integrity Rules

1. A booking must reference one customer, one service, and one address.
2. A contractor assignment must reference an eligible contractor who supports the requested service.
3. Contractor selection is permitted only when the customer has an active Premium entitlement.
4. Auto-routing must assign a qualified contractor for free customers.
5. Contractor search must enforce provider service zones and an API-calculated drive-time limit. Do not use a fixed straight-line radius for production routing.
6. Batch eligibility must use normalized street and service values, not display text alone.
7. A rating below 4 stars must be rejected if no issue tag or evidence record exists.

### Future API Boundaries

When backend work starts, introduce authenticated APIs for:

- Service and contractor availability
- Premium entitlement lookup
- Booking creation and status updates
- Auto-routing and Premium contractor selection
- Batch creation and batch eligibility
- Review submission and photo-evidence upload

Do not trust price, Premium status, contractor eligibility, distance, review rating, or evidence requirements sent by the client. Validate all of them on the server.

### In-App Messaging and Notifications

1. Add authenticated, booking-scoped in-app messaging between a customer and the assigned contractor. Do not expose either party's raw phone number.
2. When a new message is received while the chat is open, show it in the conversation and announce it to assistive technology.
3. Offer an optional incoming-message sound. It must be off until the user has interacted with the site, respect a persistent mute preference, and never play for messages sent by the current user.
4. Do not play sounds when the browser tab is hidden. Use a browser or push notification instead when the user has explicitly granted permission.
5. Store the notification preference per authenticated user and provide a visible setting to turn the sound on or off.
6. The messaging service must enforce booking membership server-side, rate-limit sends, retain an audit trail, and prevent a contractor or customer from accessing conversations outside their own booking.

## Implementation Sequence

1. Finalize all UI layouts and interaction states using mock data.
2. Design SQL schema and migrations from this document.
3. Add authentication and user profiles.
4. Add contractor coverage, distance queries, and Premium entitlement checks.
5. Add booking, batch, and assignment workflows.
6. Add reviews and required evidence validation.
7. Add payments only after booking and routing are stable.

## Prompt for Future Backend Work

> Read `ROADMAP.md` before making changes. Treat it as the product source of truth. Propose the database schema and migrations for the requested feature, including validation for all applicable business rules.