# Blokpakt product basis

Owner-approved direction, recorded October 28, 2026. Read this together with
[the English story](README.md#our-story), [product rules](ROADMAP.md), and
[AI collaborator instructions](AGENTS.md). This is a decision record, not proof
of customers, revenue, deployed infrastructure, or completed field research.

## 1. The product, in one sentence

Blokpakt is an asset-light **home-services marketplace** that connects households
with independent service providers and aims to coordinate nearby demand, starting
with a manually operated US pilot.

- **Block** means nearby households and grouped service work.
- **Provider** means an independent home-service professional.
- Blokpakt does not own a service fleet or employ a full-time service crew as its
  approved operating model.
- It is not a trading platform, investment product, cryptocurrency exchange,
  bank, financial marketplace, or payroll service.

The problem is scattered home-maintenance demand and the effort of coordinating
worthwhile work. The proposed benefit is clearer coordination for households and
providers. Whether nearby work improves costs and earnings must be measured.

## 2. Keep these kinds of information separate

| Kind                   | What it means here                                                                                                                                                                        |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Approved direction     | Home services; one manually confirmed US pilot area and category; independent providers; operator-led coordination.                                                                       |
| Implemented capability | The repository includes verified email sign-in and guarded private service-request workflows. Configuration, deployment, delivery, and real-account checks still need verification.       |
| Demonstration          | Browser bookings, providers, photos, prices, route examples, and fixture metrics. They are not live operational records.                                                                  |
| Hypothesis             | Denser work may improve customer prices and provider economics; a useful free planner may attract relevant households. Neither outcome is proven.                                         |
| Draft plan             | Growth thresholds, future feature ideas, and starter owner tasks. A number or checked box does not make a feature live.                                                                   |
| Unknown                | Current real user count, revenue, established coverage, available contractors, acquisition performance, or guaranteed savings unless supported by explicit evidence. Unknown is not zero. |

Do not invent a founder experience or copy someone else's story as Blokpakt's
history. Do not reinterpret the words "block," "fund," or "provider" as a reason
to change the business category.

## 3. The working pilot boundary

The intended initial flow is:

1. A customer verifies an email and submits a private service request.
2. An operator checks service-area eligibility and independent-provider
   availability.
3. Scope, price, and timing are agreed manually with the relevant parties.
4. Only then may the operator record a confirmation.

A request is **not** a confirmed booking. There are no online payments,
automatic dispatch, paid subscription entitlements, guaranteed discounts, or
established nationwide coverage. Do not infer them from demo screens.

Follow the [commercial validation decision](ROADMAP.md#commercial-validation-decision)
for unit economics. Its 10% household discount and 5% provider commission are
initial modeling hypotheses, not published rates or automatically collected fees.
Count coordination and support labor when evaluating platform contribution.

Do not change ownership checks, administrator allowlists, RLS, or the evidence
storage lock to make a prototype appear operational. Follow
[pilot setup](supabase/PILOT_SETUP.md), with additive migrations.

## 4. Why a free home planner belongs here

The owner approved an optional **Home & Time Planner** as a useful entry point
to the existing home-services product, not as a new financial business.

- Public location: a secondary homepage card and footer link to
  `/home-planner.html`. Do not replace the home-services hero or booking/request
  flow with a personal-finance proposition.
- Scope: effective hourly-pay estimates, a quick manual ledger, the latest four
  entries, monthly cash-flow summaries, a safety buffer, free-fund goals, a native
  SVG projection, and commuting/overtime/pay scenarios.
- Delivery: one HTML file with inline CSS, JavaScript, icons, and illustration.
  No CDN, online chart library, backend, sign-in, bank connection, or telemetry.
  It can be downloaded and opened directly in a browser.
- Data: browser-local storage and explicit JSON import/export. Examples are
  labeled and dated relative to first opening. No planner figure is attached to
  the optional link back to Blokpakt.
- Meaning: "free funds" are estimated savings above a user-chosen buffer. They are
  not an investment fund, deposit account, investment recommendation, or yield.
- Promotion: explain the actual tool. Do not advertise guaranteed savings, a
  confirmed service quote, or proven customer acquisition. No campaign, tracking,
  audience upload, or advertising spend is authorized by building this page.

An original draft promotional message:

> Small spends. A bigger picture. See the working time behind everyday expenses
> with Blokpakt's free Home & Time Planner. No sign-up. Download it for offline
> use, then learn about our neighborhood home-services pilot when you choose.

Use original copy and drawings or assets the project is entitled to use. Do not
copy another product's code, screenshots, distinctive layout, illustrations, or
founder story, and do not treat hiding a source as permission to reuse it.

## 5. Growth from zero: a draft, not automatic unlocks

The owner approved the following **initial editable draft** for the offline
[owner notebook](owner-workspace.html). Numbers appear above each feature/focus
and increase down the page. The notebook is not added to public navigation or
included in the production website's public files.

The proposed metric is **distinct pilot households whose contact and
service-area eligibility the operator has verified**, with duplicates removed.
It is not page views, registrations alone, planner downloads, bookings, or
completed jobs. The owner may enter an aggregate count, observation date, and
non-sensitive evidence source locally. The app does not verify that observation.
Until supplied, the count is "Not recorded"; zero is only the roadmap origin.

| Proposed households | Feature or focus below the number | Evidence before proceeding                                                                                                                             |
| ------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 0                   | Start with one neighborhood       | Confirm one area/category, provider availability, email verification, and request permissions.                                                         |
| 10                  | Learn through manual requests     | Agree each scope, quote, and date; learn from fulfillment and support. Existing request code is not withheld until this threshold.                     |
| 50                  | Test nearby service batches       | Repeated completed batches support customer savings, provider willingness and viable earnings, and positive contribution including coordination labor. |
| 100                 | Make repeat home care easier      | Demonstrated repeat demand, reliable fulfillment, support capacity, and explicit approval for any new status/repeat-request tools.                     |
| 500                 | Consider careful expansion        | Sustainable results, provider capacity, and a separately approved plan for another area or targeted coordination tools.                                |

All cards remain drafts, even when an owner-entered count reaches a threshold.
Counts alone never authorize launch, spending, market expansion, subscriptions,
payments, dispatch, or AI. Local edits do not automatically update this product
basis or the deployed site; an approved scope change must also update the
repository's product documentation.

## 6. Remembering the next action

The owner notebook has local tasks with a milestone, optional note and due date,
edit/delete controls, completion checkboxes, and overdue/next-seven-day reminders.
Starter suggestions are not completed work or fixed deadlines. Saving an edit
or checking a starter task adopts it, so example cleanup keeps it.

Reminders are visible **only while the notebook is open or when reopened**.
There are no push notifications, emails, background jobs, cloud sync, or claims
of secure admin authorization. Do not store real customer information,
credentials, or confidential business data in either local tool.

Browser storage and JSON backups are not encrypted. A shared browser or scripts
on the same origin may access browser storage. Export before moving the file,
changing browser, or clearing site data. Some browsers restrict storage for
`file://` pages; errors must remain visible instead of pretending a save worked.

## 7. Checklist for the next AI collaborator

Before proposing or implementing a change:

1. Read and state that you have loaded the shared product context. Instructions
   are guidance; not every AI interface loads them automatically.
2. Name the user problem and the affected surface: live pilot, demo, public
   offline helper, or local owner notebook.
3. Separate established facts, approved direction, estimates, examples, and
   unapproved ideas. Ask the owner about a genuine business-scope change.
4. Preserve the green/orange identity, touch usability, existing service flows,
   server-side authorization, and separation of private and sample records.
5. Reuse repository implementations where appropriate. No fallback from a failed
   live API to fabricated or sample records.
6. Validate the actual changed behavior with targeted Vitest tests and a
   production build, plus SQL permission/lifecycle tests for database changes.
7. Update directly related product/usage documentation. Explain results to the
   owner in Traditional Chinese; keep website and story copy in English unless
   asked otherwise.
