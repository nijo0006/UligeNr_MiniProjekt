# Draft Data Model: Hotel Operations

Status: design draft for confirmed application behavior. See research.md for unresolved
gates and spec.md for authoritative rules. No SQL migrations are created by this document.
Use PostgreSQL foreign keys, DATE for stay/sales days, UTC timestamps for audit/versioning,
and DECIMAL or exact minor units for money. Synthetic provenance is separate from facts.

## Tables and responsibilities

| Entity | Key fields | Relationships and constraints |
| --- | --- | --- |
| room_types | id, name | Eight approved names; no guest-capacity limit is invented. |
| rooms | room_number, room_type_id, synthetic | Fixed 214-room JSON fixture; unique number and one type. |
| seasonal_rates | room_type_id, season, nightly_price | Unique type/season; all 24 approved rate cells. |
| countries | code/id, display_name | Approved source country choices; no invented expanded catalog. |
| bookings | id, holder_first_name, holder_last_name, country_id, guest_count nullable, arrival, departure, status, version, total_price, pricing_mode, source_id nullable, synthetic_dates | One holder country for all country reporting; generated immutable ID; active/cancelled; guest_count remains null for unknown source counts. |
| booking_guests | id, booking_id, first_name, last_name | Optional individual names for the people recorded on a group booking; do not infer source people from the named holder. guest_count is the reporting count. |
| booking_rooms | booking_id, room_number, room_total | Unique booking/room pair; multiple rooms supported. Source rows receive one authorized synthetic room of the recorded type. |
| room_nights | booking_id, room_number, night_date, season, exact_charge | Occupied-night detail for availability/year counting; exact_charge is nullable for preserved historical totals, which are attributed through the single assigned booking room. Arrival included; departure excluded. Do not add a second reportable source total to the same booking. |
| drink_categories | category | Cocktails, Coffee, Wine, Beer; source spelling can map to these canonical labels. |
| drinks | id, name, category, unit_price, source_id | Preserve the 30 source drinks/prices; actual wine/beer menu entries remain open. |
| daily_bar_sales | sales_date, drink_id, quantity, unit_price_snapshot, exact_revenue, synthetic, source_id | Unique date/drink pair; replacing quantity replaces contribution. Preserve original source unit prices; later price-change policy is not specified. |
| satisfaction_responses | id, booking_id, room_number, rating, recorded_at | Rating in 1–5; linked room must belong to booking. Separate rooms may have distinct ratings; no generated historical responses. |
| source_records | source_file, sheet, source_id, original_payload, checksum | Immutable lineage and source totals; not directly summed alongside enriched operational records. |
| initialization_runs | migration/seed_key, version, completed_at | Unique completion marker; no repeated seeds on ordinary restart. |

No account, role, request-idempotency-key, or guest-capacity table is required by the
approved prototype scope. A date/drink uniqueness constraint implements daily replacement;
it is not the declined duplicate-creation feature.

## Booking lifecycle and edits

Create active booking with version 1. A successful edit keeps ID, checks the supplied
version and room availability, recomputes departure/night charges/totals, then increments
version. A stale version is a conflict without partial mutation. Cancellation changes
active to cancelled; repeating cancellation is a no-op. Retain enough identity/state
for “already cancelled” versus unknown ID. No reactivation workflow is assumed.

Unknown IDs return the approved not-found message; cancelled contributions are excluded
from booking counts, guest counts, room revenue and occupied room-nights. Raw source
lineage remains intact. How editing a synthetic-price booking affects its original
operational charge must be explicit in implementation: source evidence stays immutable;
newly recalculated edits follow the approved tariff rather than altering raw evidence.

## Race-safe room availability

See research.md: one transaction connection, booking version/state checks, sorted room
row locks, current overlap checks, and atomic allocations plus charges. Serialize writes
per affected room even when no existing allocation overlaps. Exclude the same booking
on edit. Concurrent overlap tests must prove at most one conflicting reservation commits.

## Reporting projections

- Country: holder country receives the booking count, recorded guest count, and room
  revenue exactly once; bar revenue is excluded. Preserve null for unknown person counts.
- Room/type/season: aggregate room-level charges, not the whole multi-room total once per
  room. Historical totals use preserved source prices on generated assignments, flagged
  `source-preserved`; new or recalculated prices use `nightly-calculated`. Sum the
  appropriate basis exactly once. Do not require fictional historical nightly charges
  to compute historical inventory, yearly totals, or room-night counts.
- Year: each occupied night belongs to its calendar year; bar uses sales date.
- Occupancy: occupied room-nights / (214 × 365), expressed as a percentage, as approved.
- Inventory: counts come from rooms, independent of booking changes.
- Bar: all categories contribute to total revenue/units; cocktail/coffee comparison
  uses only their combined revenue. Corrections replace date/drink contributions.
- Satisfaction: arithmetic mean per room, one displayed decimal, null for no responses.

No-data results are null rather than a made-up value. R10 still controls zero-denominator
and half-way rounding behavior. Do not resolve that policy merely by choosing SQL types.

## Remaining design dependencies

Detailed report payloads, tie presentation, upper-bound UI selectors, missing menu entries,
and the Tableau consumer remain open as documented in research.md and spec.md. The API
contract draft avoids arbitrary maximum-stay, guest-capacity, login, or request-dedup rules.
