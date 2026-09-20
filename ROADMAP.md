# Blokpakt Product Roadmap

## Purpose

This file is the source of truth for product rules that must survive UI iteration and guide future backend work. Read this file before changing booking, routing, contractor selection, reviews, payments, or database design.

## Current Phase: UI-Only Prototype

- The application currently uses local mock data and browser-only interactions.
- Do not add a database, payment provider, business API, or server-side booking logic until the UI is approved.
- Mock data may reset when the browser refreshes.
- The booking, tracking, field, and admin screens exist to validate the user experience, not to process real work.

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