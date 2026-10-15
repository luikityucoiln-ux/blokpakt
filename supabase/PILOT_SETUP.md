# Blokpakt: email and real service-request pilot

This is an operator-assisted US home-service pilot, not an automated nationwide
booking service. Code completion is not launch approval. The owner still needs
to configure email, apply the migration, appoint an administrator, verify real
accounts, and establish service coverage and contractors.

## 1. Make sign-in emails work

### First test with the project owner

1. Open the website in your normal browser and copy its origin from the address
   bar (scheme and hostname, plus port if present). A Supabase dashboard URL is
   not your website URL. Do not guess the address.
2. In Supabase, open **Authentication > URL Configuration**.
   - Set **Site URL** to your website origin.
   - Add that exact origin followed by `/auth/callback` to **Redirect URLs**.
   - Example only: if you own `https://example.com`, add
     `https://example.com/auth/callback`. Do not copy the example as your domain.
   - For development, add the actual development origin and port separately.
     Prefer exact callback URLs over broad wildcards.
3. Check that the Email provider is enabled and email confirmation remains
   enabled. Keep the default confirmation/magic-link templates using
   `{{ .ConfirmationURL }}`. Both new and returning users must receive a usable
   link; do not replace it with a token-only template.
4. Set the existing public Supabase URL and publishable key in your hosting
   provider's build environment and redeploy if those values changed. Never
   expose service-role keys or SMTP passwords through `VITE_` variables.
5. Visit `/login` and request one link using the email address of a member of
   your Supabase project team. Check inbox and spam. Open the latest link in
   the **same browser** that requested it, not an email app's isolated browser.
6. Success means the callback returns to the account screen showing your email,
   reload preserves your session, and sign-out works. Seeing "Check your inbox"
   proves only that the request was accepted, not delivery or login.

Supabase's built-in sender is for testing, not public launch. Its current
documentation says it sends only to project-team addresses and is limited to
**2 messages per hour**, a limit Supabase may change. Do not add customers as
project team members to work around this restriction.

### Enable email for customers

1. Choose a transactional email provider with SMTP support (for example Resend,
   Postmark, or Amazon SES). Check that provider's current pricing and limits.
2. Verify a domain you own with that provider. Add its required DNS records,
   including DKIM/SPF and an appropriate DMARC policy. Do not replace unrelated
   DNS records blindly. Choose a verified sender such as `hello@your-domain`.
3. Obtain the SMTP host, port, username, and password from the provider.
4. Open Supabase **Authentication > Email > SMTP Settings** (or the SMTP page
   linked below), enable custom SMTP, and enter the sender and SMTP details
   there. SMTP secrets belong in Supabase settings, not source code or chat.
5. Disable email-provider link tracking/rewriting for authentication messages
   if it changes or consumes verification links. Check delivery logs for bounces.
6. Request a link to an authorized test recipient who is **not** on your project
   team. Verify the full new-account, returning-account, reload, and sign-out
   flow on the real hostname. Test mobile links in the originating browser too.

Troubleshooting:

| Symptom | What to check |
| --- | --- |
| Only the owner receives mail | Default SMTP restriction; configure custom SMTP |
| Rate limit error | Wait; check Supabase Auth and mail-provider limits, do not repeatedly resend |
| No inbox mail | Spam, sender-domain verification, SMTP delivery/bounce logs |
| Link opens localhost or the wrong website | Site URL, exact Redirect URLs, and email template |
| Missing PKCE verifier | Open the latest link in the requesting browser; request a new link there |
| Link expired/already used | Request a fresh link; check mail scanners and link rewriting |
| Missing database table on a request page | Apply the pilot migration; email settings cannot fix missing tables |

Official references:
- [Supabase custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp)
- [Supabase SMTP settings](https://supabase.com/dashboard/project/_/auth/smtp)
- [Supabase redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls)

## 2. Apply the additive request migration

The existing foundation must already be present. Do **not** rerun the first
migration or delete any tables.

1. Back up any real data and confirm you are in the intended Supabase project.
2. In SQL Editor, run the entire
   [second migration](./migrations/202610150002_service_request_pilot.sql) once.
3. It adds `pilot_settings`, `pilot_admins`, `service_requests`, and
   `service_request_events`, plus guarded RPC functions. All four tables use RLS.
4. New intake starts **closed**. Existing services remain inactive until you
   deliberately enable those you can actually review.

The older `bookings`, route, provider, and photo tables are not repurposed.
A request is not a fulfilled booking. Existing browser-write restrictions and
the evidence bucket lock stay intact.

## 3. Appoint the first operator

First sign in through the website and verify the owner's email. In Supabase
**Authentication > Users**, copy that verified account's User UID.

Run this in SQL Editor, replacing the placeholder with that UUID:

```sql
insert into public.pilot_admins (user_id)
select id from auth.users
where id = 'REPLACE_WITH_VERIFIED_OWNER_USER_UUID'::uuid
  and email_confirmed_at is not null;
```

Confirm that exactly one intended owner was added. A zero-row result means the
account was not found or is not verified. Do not appoint all users or infer
administrator status from an email suffix or browser-selected role.

Visit `/ops` while signed in as that account. An ordinary customer must instead
see "Administrator access required." To revoke access, delete only that user's
row from `pilot_admins` in Supabase. Server authorization changes immediately;
an already open screen refreshes its access check at least once a minute.

## 4. Open a small test intake

Choose the services you can actually evaluate and the local area you intend to
serve. The owner selected the US, but no launch city, service coverage,
contractors, or pricing have been verified. The form accepts the 50 states/DC
and a US ZIP; this is format validation, not geocoding or proof of coverage.

For example, **only if you intend to review lawn-care requests**:

```sql
update public.services set active = true where id = 'lawn';
update public.pilot_settings set intake_open = true where id = true;
```

Test privately through `/request-service`, `/requests`, and `/ops` before changing
the public website navigation. No client flag can bypass a closed server intake.
To pause new intake while keeping existing records accessible:

```sql
update public.pilot_settings set intake_open = false where id = true;
```

## 5. Verify real accounts before public launch

Use two authorized customer test accounts and a separate operator account:

- Customer A submits a clearly marked test request; it appears in Supabase.
- Reload or sign in on another device as A: the same request is visible.
- Customer B cannot read A's request, even with its UUID.
- Only the allowlisted operator sees the all-customer dashboard and counts.
- An operator changes `received` to `reviewing` and writes a customer-visible
  update. A sees the update after Refresh (also polled every minute).
- Confirm only after checking coverage and contractor availability and getting
  customer agreement outside the app. Enter the agreed positive USD quote and
  date, then acknowledge that agreement. Dates are checked against today's UTC
  date. No money is charged.
- A customer may cancel only an unconfirmed request. For confirmed work, the
  operator handles cancellation after contact. Include a real contact method
  in the customer-visible update; do not invent a support address.
- Check `completed`, `declined`, and `cancelled` outcomes as appropriate.
  Terminal requests cannot be reopened through these APIs.
- Confirm denied direct writes, no self-promotion, and operator revocation.

Requests are limited to five open requests and ten new requests per rolling
24 hours per customer. Unchanged retries from the same mounted form reuse one
idempotency key. After a reload or uncertain connection failure, check My requests
before starting a new submission. No address or form draft is stored locally.

Operator updates use version checks to reject conflicting edits and append an
audit event. The update text is visible to the customer, not an internal note.
Quote/date agreement is an operator attestation, not an electronic signature
or customer acceptance collected by the app.

## 6. Switch the main entry points

Only after the previous checks, set this in the deployment build environment:

```text
VITE_ENABLE_LIVE_REQUESTS=true
```

Rebuild/redeploy. `/book` now opens real request intake, `/track` opens the
signed-in customer's requests, and `/admin` opens the private operator screen.
With the flag absent/false, these three existing routes remain demos.
The explicit pilot URLs work regardless of the flag, but submission always
requires the server intake to be open and the service active.

The rest of the site still contains prototype material: sample prices,
providers, provider applications/field screens, batch offers, FAQs, and marketing
claims. Before inviting the public, review those pages for your actual coverage,
contractor arrangements, support contact, terms, privacy/retention, and measured
claims. Do not advertise sample prices as live quotes. This first implementation
does not convert every demonstration screen into a production workflow.

## What is not enabled

- Online charges, escrow, payouts, automatic refunds, or payment receipts.
- Automated provider onboarding, dispatch, scheduling, or photo uploads.
- Automatic booking emails, push notifications, or operator email alerts.
  Supabase SMTP handles authentication mail only; dashboard reminders are in-app.
- AI dispatch, measured cost savings, or nationwide service guarantees.

Local SQL checks are in [the pilot regression script](./tests/service_request_pilot.sql)
and [the foundation regression script](./tests/marketplace_foundation.sql).
Run them only in an isolated test database, never on the live project.
