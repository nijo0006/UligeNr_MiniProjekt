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
