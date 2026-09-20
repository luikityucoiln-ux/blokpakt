# Blokpakt Master System Blueprint

This document serves as the absolute source of truth for the platform's business logic, UI constraints, and backend architecture. All frontend components and backend database schemas must adhere to these rules.

## 1. The Win-Win-Win Pricing Model (Stripe Math)

- **Homeowner Discount:** 10% Flat Group Discount (triggered when 2+ homes on the same street book).
- **Blokpakt Platform Commission:** 5% charged to the worker (or a split 3% customer + 3% worker fee).
- **Payment Flow:** Stripe handles authorization holds upon booking. The hold is only captured (charged) when the contractor uploads the mandatory timestamped completion photo.
- **Unit Economics (4-House Block Example):**
  - Status Quo: Worker drives cross-town for 2 hours, makes $92.50/hr.
  - Blokpakt Batch: Worker drives 0.4 hours, makes $123.33/hr.
  - Platform Net: Blokpakt nets ~$3.48 clean profit per stop after Stripe fees (~2.9% + $0.30).

## 2. Supply Side Constraints

The UI prototype displays contractor distances up to 14 miles to demonstrate early marketplace supply. This is a presentation constraint, not the future backend routing rule. Production routing must use provider service zones and API-calculated drive time rather than a fixed straight-line mileage radius.

## 3. Customer Tiers & Route Batching Logic

### Free Users (Efficiency Route)

- Must accept system-automated, efficient batch routing.
- UI Restriction: The contractor list is VIEW-ONLY (social proof). No clickable selection arrows.
- UI Upsell: Must show a locked state prompting an upgrade to pick their specific pro.

### Premium Users (VIP "Block Captain")

- Pay a premium subscription to unlock choice and priority.
- UI Privilege: Contractor list is interactive. Can manually hand-pick their preferred pro from the available local list.
- System Role: Premium users act as the "anchor" for a route. By selecting a contractor, they initiate a new neighborhood batch that free users will automatically be added to.

## 4. Trust & Anti-Sabotage Mechanics

- **Visual Proof:** The UI must prioritize social proof (ratings, job counts, and the Block Captain badge).
- **Review Gatekeeping (Mandatory Photo):** Customers cannot submit a 1-star or 2-star rating without accountability. Any rating below 4 stars strictly requires an issue tag and photo proof. The frontend form must not submit without this payload.
- **No Automated Refunds:** There is no automated refund button. Customers must use a Report an Issue flow with mandatory photo evidence. Platform administrators manually review and initiate any refund or dispute outcome.

## 5. Advanced Anti-Sabotage & Review Backend

- **Automated Cross-Audit:** The system compares customer complaint photos against the contractor's timestamped completion photos. If the completion evidence contradicts the complaint, the rating is voided after administrator review.
- **Trimmed Mean Rating:** Contractor scores drop the single lowest rating per 10 completed jobs to reduce outlier sabotage.
- **Dispute-Seeker Strike System:** A customer who submits a Report an Issue claim or low rating on 3 of their first 5 jobs is flagged for manual review. After review, the platform may restrict public-rating privileges when there is evidence of abusive dispute behavior.
- **48-Hour Dispute Window:** Low ratings remain in a pending state for 48 hours. The contractor receives a private notification and may respond with completion photos or offer a touch-up before the score becomes public.
- **Two-Way Ratings:** Contractors rate homeowners. Low-rated properties, such as properties with aggressive animals or unsafe conditions, are flagged so contractors can decline them before accepting a route.

## 8. The "Before & After" Photo Workflow (State Triggers)

- **Customer Verification:** Uploading the photo automatically updates the customer's portal to "Completed/Pending Review" and sends them a secure link to view the results.
- **Payment Capture:** The photo upload acts as the verifiable trigger for Stripe to capture the final payment from the initial authorization hold.
- **Dispute Logging:** The backend securely stores the images alongside time, date, and address verification metadata to defend against chargebacks.
- **Route Progression:** Logging the photo automatically marks the current address as complete and signals the provider to move to the next house in the neighborhood batch.
- **Social Proof Engine:** With consent, high-quality before-and-after shots are dynamically pushed to the neighborhood's public landing page to drive future batch sign-ups.

## 11. The Automated "Batch Unlocked" Email Flow

- **UI First (Current State):** The frontend visually simulates the waiting state for the anchor user and provides Nextdoor and WhatsApp sharing links.
- **Backend Blueprint (Future Implementation):**
  - **State Flag:** When User #1 books, the database flags the order as `status: pending_batch`.
  - **The Listener:** The backend actively counts incoming bookings tied to that specific neighborhood ID or referral link.
  - **The Trigger:** As soon as the count reaches the required threshold, such as two or more homes, the system automatically sends an email through a provider such as Resend or SendGrid to User #1 stating: "Success! Your neighbor joined and your 10% batch discount is unlocked."

## 12. The Auto-Routing Engine (Location-Based Matchmaking)

When a batch is filled entirely by Free users, the backend automatically assigns a provider using this 3-step location logic:

1. **Scheduled Route Density:** The system ignores real-time phone GPS and queries the schedule for providers who already have a confirmed booking in the same ZIP code on the requested day.
2. **Geofenced Drive Time:** If no provider is scheduled nearby, the system matches the customer's geocoded address against provider-defined service zones. It prioritizes the shortest API-calculated drive time, such as under 20 minutes, instead of straight-line distance.
3. **Quality Tie-Breaker:** If two providers have the same drive time, the system awards the job to the provider with the higher Trimmed Mean Star Rating.

## 14. Contractor Profile Card (UI Components)

The frontend UI for the Contractor Card must include the following specific elements to balance trust, information, and platform security:

- **Header Identity:** Display first name and last initial only, such as "Mike R.", alongside a business logo or truck avatar.
- **Trust & Verification:** Prominently display the green "ID Verified" badge and an official Blokpakt Provider ID, such as "ID: #501231", to establish enterprise-level legitimacy.
- **Service Capability Tags:** Display visual tags for approved scopes of work, such as Building Repair, Lawn Care, and Pressure Washing.
- **Contact Mechanism (Anti-Leakage):** Never display raw phone numbers in the UI or expose them through client-side APIs. All communication must route through a Contact Provider button that uses masked VoIP proxy numbers to protect privacy and prevent platform disintermediation. The proxy number expires after the job is complete.
- **Social Proof:** Display the contractor's Trimmed Mean Star Rating and total completed jobs.

## 15. Provider ID Generation & Display Security

To protect platform scale data and maintain social proof, the system must never expose sequential low-number IDs, such as `#00001`, to the public.

- **Backend Implementation:** Database primary keys remain internal. If an auto-increment sequence is used for operational identifiers, start it at a high offset such as 500000 rather than 1.
- **Public ID:** Generate a separate, immutable, non-sequential public provider ID for every contractor. Do not derive it solely from a database primary key.
- **UI Display:** The frontend displays only the public provider ID with an official prefix, such as `ID: BP-8492X` or `ID: BP-500001`.
