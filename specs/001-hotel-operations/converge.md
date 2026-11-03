# Booking implementation verification — 2026-10-29

The first increment implements US1–US4. The complete hotel feature is not finished.

## Implemented

The JavaScript backend separates presentation/API, business services and MySQL data
access. The frontend creates, lists, edits and cancels multi-room bookings. Booking IDs
remain fixed, stale edits are rejected, overlapping active stays are rejected atomically,
and adjacent stays are allowed. Each occupied night uses its own seasonal rate.
Room inventory and tariffs are seeded once; initialization preserves existing bookings.

The running API is documented in backend/openapi.json and Swagger UI. The larger
specification contract remains a future design, not a claim of implemented routes.
Docker Compose starts the app and MySQL with local defaults and persistent storage.

## Evidence

Seven unit tests, eleven isolated MySQL/API tests and one browser maintenance-flow test
passed. OpenAPI validation passed. A fresh isolated Compose project started without
a .env file; a created booking survived full container recreation with its volume retained.
See quickstart.md and backend/tests for reproducible checks.

## Remaining scope

T021–T037 remain open: current operational reports, country/room/season revenue, occupancy,
bar entry and reports, questionnaire ratings, historical import and unresolved business
input/display choices. Tableau delivery is explicitly deferred pending the user's choice.
The requirements checklist remains 13/16; no unresolved business rules were invented.
Convergence follow-up tasks belong at the end of tasks.md.


## PostgreSQL amendment verification — 2026-11-02

Constitution IV v2.0.0 now requires PostgreSQL, as selected by the user under the week-2
supplement. The booking repository, pool, transactional schema/catalog initialization,
Compose app/database/test profiles and documentation have been migrated. Runtime uses
PostgreSQL 18 and pg 8.23.1, with exact decimal strings and calendar-date strings at the
unchanged API boundary. PostgreSQL row locks and READ COMMITTED transactions preserve
the booking concurrency and stale-edit rules.

Executed results:

- Seven unit tests passed.
- Twelve PostgreSQL/API integration tests passed, including concurrent overlap rejection,
  rollback, stale edits, filtered availability, integer/date/money types and OpenAPI validation.
- One Chrome browser create/reload/edit/cancel test passed; desktop screenshot reviewed and mobile screenshot captured.
- Five pre-existing MySQL bookings and their related data were transferred and reconciled
  table-by-table inside one transaction: 21 countries, eight types, 214 rooms, 24 rates,
  five bookings, five room allocations and 22 nightly charges; no named guest rows existed.
- All six bookings (the five transferred plus the cancelled browser test) were unchanged
  after forced recreation of both app and PostgreSQL containers with the volume retained.
- An isolated project started healthy from an empty volume without .env, using the
  already-built application image and the normal database health dependency.

The previous working version is preserved at Git tag uge-1-mysql-demo-2026-11-02. The
legacy MySQL volume is retained; PostgreSQL uses a separate postgres_data volume. Private
snapshots and screenshots contain local guest data and are not committed. The application
runs at http://localhost:3000; Swagger UI is at /api/docs.

This completes the database change only. Operational reports, frontend indicators,
Excel historical import, bar operations, satisfaction and deferred Tableau delivery
remain open in the existing tasks; this is not completion of the full week-2 assignment.


## Annual room-revenue increment — 2026-11-02

Implemented the room portion of FR-013/US11, FR-007 report freshness and FR-022 no-data
behavior. GET /api/reports/revenue?year=YYYY sums exact saved charges for active
room-nights in that calendar year, including future booked stays. It excludes cancellation
and departure nights, attributes cross-year stays per night and returns null without data.
The browser displays one decimal, selects years, links to JSON and refreshes after booking
mutations. Failed report requests display Unavailable without replacing a saved booking
result with a fabricated revenue amount. OpenAPI 0.2.0 documents this implemented endpoint.

Validation: seven unit tests, sixteen PostgreSQL/API integration tests and one Chrome
browser flow passed. Browser checks include year selection, report outage/recovery and
automatic revenue changes after create/edit/cancel. The live 2026 room total was 33329.00
when verified, matching the three pre-existing active booking totals. Desktop and mobile
screenshots were captured. The browser test cancelled its own verification booking.

T051–T055 are complete. T027 and T041 stay open: combined room/bar totals and the other
reports are not complete. Historical Excel import, bar, satisfaction and Tableau are
still pending/deferred. No new business rules or historical records were invented.


## Guest/staff frontend increment — 2026-11-02

Delivered separate guest HTML/JS at / and staff HTML/JS at /staff, with shared form helpers
and the same API. Guests create stays and see their own confirmation; the guest frontend
does not request booking lists or operational reports. Staff retain booking lifecycle
and room reporting, and gain Helene Christine's bar revenue/units, drink revenue,
cocktail/coffee comparison and daily closing entry. No login/access-control change is claimed.

Added versioned source-menu seed, drinks and daily_bar_sales tables, BarRepository,
BarService, BarRoutes and OpenAPI 0.3.0. One date/drink pair has one effective quantity;
corrections retain price snapshots. Exact money is aggregated without doubling the source
workbook totals. No historical bar sales or missing wine/beer products were generated.
R8 selector/menu completeness and R10 zero-denominator/tie-rounding choices remain open;
prototype quantity controls and undefined-comparison presentation are documented in plan.

Validation: 7 unit tests, 20 isolated PostgreSQL/API tests and 3 Chrome browser flows passed.
A first integration run found an ambiguous PostgreSQL parameter type; explicit date/BIGINT
casts fixed it and all integration checks passed. Browser checks found ambiguous new
field labels; explicit accessible names and exact lookups fixed them. Guest-to-staff
booking and staff editing/cancellation passed. The bar UI test uses HTTP fixtures so
no fabricated live sales remain; real saves/corrections are covered in the isolated DB.
Desktop screenshots reviewed. Existing user bookings were not changed.

T056–T062 complete. Earlier bar/source tasks are not treated as complete reconciliation
of the historical dataset. Broader hotel metrics, satisfaction, Excel history and Tableau
remain on the outstanding task list.


## Historical import verification — 2026-11-02

Completed the authorized FR-021 historical enrichment/import. Source extraction is
read-only and checks workbook/payload SHA-256 plus exact controls. All 1000 bookings
have recorded nightly prices that reconcile to original totals; those source prices
are stored without applying the current tariff. Deterministic season/type/availability
placement spans 2024–2026 and preserves original IDs as separate source identity.
Operational IDs, existing bookings and existing bar date/drink rows are preserved.
Missing person counts remain null. No satisfaction responses are generated.

Source bar units are allocated to dated demonstration rows with source-price snapshots;
per-drink totals reconcile and raw aggregates do not contribute twice. Original source
payloads and import/reference totals are immutable. A version/checksum marker prevents
repeat import after edits/cancellation; a failure rolls back the complete transaction.

Validation: 10 unit tests, 24 isolated PostgreSQL/API tests and 4 Chrome browser flows
passed. Dedicated tests verify a failure after operational rows were inserted still
rolls back every imported row and preserves existing daily sales. Live pre-import
comparison preserved all original 12 bookings, 12 room allocations and 40 room-nights.
Source additions reconcile to 1000 / 5379 / DKK11234034.00 and 179958 bar units /
DKK13448640.34. Forced app recreation left fingerprints for all seven data/evidence
tables identical, with one import marker. Workbook bytes remain unchanged.

Staff exposes source/reference totals and marked historical bookings with year/search/
pagination controls. Annual report APIs expose generated-data provenance. Browser
verified 2025 room/bar results and unknown counts; desktop/mobile screenshots reviewed.

T036/T042 and T063–T067 are complete. Other hotel indicators, satisfaction, unresolved
business inputs and deferred Tableau delivery remain open; the full hotel feature is
not declared complete.
