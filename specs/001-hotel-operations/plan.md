# Implementation Plan: Hotel Operations and Performance Insights

**Branch**: `001-hotel-operations` | **Date**: 2026-10-29 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification and the team's technical choices supplied on 2026-10-28.

**Status**: Draft — confirmed technical direction recorded; Tableau integration and
refresh are deferred to the user as of 2026-10-29. Continue other planning; independent technical research and draft design are recorded in research.md,
data-model.md, contracts/openapi.json, and quickstart.md. The full plan remains
incomplete at the explicitly unresolved business and Tableau gates. The user authorized implementation of the confirmed booking slice on 2026-10-29;
this does not resolve other open business rules or the user-deferred Tableau work.

## Summary

Build a locally runnable hotel operations application with a JavaScript backend,
a browser frontend using HTML, CSS, and JavaScript, and PostgreSQL storage. The backend
retains the constitution's presentation/API, business logic, and data access layers.
Provide the booking and reporting capabilities in the specification and supply
reporting data through the API to Tableau Desktop.

The delivery goal is to clone the GitHub repository and run `docker compose up`
to build and start the application, without installing a backend runtime, frontend
build tools, or PostgreSQL directly on the host. Docker with Compose and Git are host
prerequisites. First startup may need network access to obtain images and dependencies.
The booking increment is runnable; the remaining reporting/bar/satisfaction scope is pending.

## Technical Context

**Language/Version**: Backend JavaScript; frontend HTML, CSS, and JavaScript, confirmed
by the team. Technical design selects Node.js 24 LTS with Express 5 and ES modules.
Pin exact supported package patches and container digests during implementation;
see research.md for rationale and alternatives.

**Primary Dependencies**: Docker and Docker Compose, PostgreSQL, and Tableau Desktop Public Edition are
confirmed. Select Express 5, node-postgres (pg) driver, locally packaged Swagger UI,
and plain browser fetch/DOM code served by Express. No frontend framework or build
pipeline is added. Tableau connection/refresh is user-owned and deferred.

**Storage**: PostgreSQL 18, confirmed technical direction. Plan persistent Docker-managed storage so ordinary
container restarts do not erase operational data. Booking tables and catalog initialization
are implemented; wider report/bar/import data structures remain pending. Historical enrichment requires the
business decisions in spec R2/R5; the team now permits labelled, season-based demonstration booking dates. Preserve
raw records and do not represent generated dates as actual historical facts.

**Testing**: Node built-in test runner/assertions, PostgreSQL integration tests in containers,
and an optional Playwright browser-test service. Required validation will cover business
calculations against agreed fixtures, API/OpenAPI consistency, browser booking flows,
database integration, Tableau data consistency, and clean-checkout Compose startup.

**Target Platform**: Local developer/student computers running Docker with Compose;
a browser for the frontend and a host installation of Tableau Desktop for analytics.
The installed edition is Tableau Desktop Public Edition. Exact Tableau version,
host operating systems, and CPU architectures are unconfirmed.

**Project Type**: Web application with a backend API and a separate desktop analytics client.

**Performance Goals**: No quantitative throughput or latency target has been approved.
The booking page refreshes after successful creation, edits, and cancellation. API
reporting reflects saved changes on the next request; no separate millisecond target
is invented. Tableau refresh mechanism and interval remain spec R9.

**Constraints**: Follow all five constitutional principles. The team specifically
requests `docker compose up`; the constitution spells the command `docker-compose up`.
Preserve the single-command startup requirement and document the command supported
by the target installations; do not silently require separate build, migration,
seed, or dependency-install commands.

**Scale/Scope**: One hotel's prototype: 214 rooms; source workbook with 1,000 bookings
and 30 drinks; multiple guests and rooms per booking; daily bar sales; room-linked
satisfaction; an interactive Tableau dashboard. No concurrent-user count is specified.

**Tableau Desktop boundary**: Tableau Desktop is installed and opened on the host.
The Compose startup goal covers the application services and API, not installation
or launch of the Tableau Desktop GUI. This boundary requires acknowledgement before
claiming that Compose alone starts the entire analytics experience. Tableau version,
connector installation, and workbook opening/refresh steps must be documented and tested.

Source: [Tableau Desktop installation guide](https://help.tableau.com/current/desktopdeploy/en-us/desktop_deploy_download_and_install.htm).

## Constitution Check

*Initial direction review only; re-check after research and detailed design.*

| Principle | Planned compliance | Current status |
| --- | --- | --- |
| I. Three-layer architecture | Separate presentation/API, business logic, and data access responsibilities. | Independent draft aligned; implementation pending. |
| II. REST with JSON | Browser and reporting integrations use the backend REST/JSON interface. | Draft REST/JSON contract available. |
| III. OpenAPI and Swagger UI | Deliver an OpenAPI contract viewable in Swagger UI. | OpenAPI draft and Swagger UI serving planned. |
| IV. PostgreSQL | PostgreSQL is the application database. | Confirmed. |
| V. Docker and single-command startup | Application services build/start through one Compose command. | Validation pending; Tableau Desktop host boundary requires acknowledgement. |

**Gate result**: Independent technical draft available for review; not a fully passed feature gate. The user explicitly
requests deferring the Tableau integration/refresh decision. Carry it as an open
integration dependency rather than choosing a workaround or blocking unrelated work.
No constitutional exception is granted; final dashboard validation and a complete
plan still depend on this decision and remaining business rules.

## Project Structure

### Documentation (this feature)

Existing documents:

- `specs/001-hotel-operations/spec.md`
- `specs/001-hotel-operations/plan.md` — this draft
- `specs/001-hotel-operations/checklists/requirements.md`

Planned outputs after clarification and research:

- `research.md` — runtime, dependencies, integration choices, and alternatives
- `data-model.md` — entities, relations, and agreed validation/lifecycle rules
- `contracts/` — OpenAPI and other required interface definitions
- `quickstart.md` — clean-checkout startup and end-to-end validation instructions

`tasks.md` belongs to the subsequent Tasks step and is not generated here.

### Source Code (repository root)

Planned layout (directories are design targets, not generated application code):

```text
backend/src/presentation/   # Express routes, controllers, JSON errors, HTTP version tokens
backend/src/services/       # pricing, reporting, availability, lifecycle, transactions
backend/src/data/           # prepared SQL, repositories, connection pool
backend/src/startup/        # migrations, deterministic import/seed readiness
backend/tests/             # unit, API contract, and real PostgreSQL integration cases
frontend/                  # plain HTML, CSS, JavaScript served by app
browser-tests/             # optional Playwright tests
compose.yaml               # app, db; optional test profile
```

There are two normal services. The app also serves Swagger UI and static frontend
assets; db has persistent storage and a healthcheck. Migrations/seeding run automatically
before app readiness. Source/Compose files are not created in this planning step.

## Outstanding Decisions

**Technical research**: Independent architecture decisions are recorded in research.md.
Exact patches/image digests and actual compatibility/run validation remain implementation
checks. Business gaps remain explicitly listed there. Tableau integration remains
deferred, with no additional research or exporter work scheduled by this plan.

**Business clarification**: Spec R1–R10 remain authoritative. Follow-up decisions
confirm all 24 tariff cells (Standard Single low season: DKK 1,031), date-picker
arrival, departure calculated from nights, typed guest names, and labelled season-based
demonstration booking dates. The user now authorizes generated demonstration room
inventory, superseding the previous prohibition. The fixture
[fixtures/room-inventory.json](fixtures/room-inventory.json) defines 214 unique room
numbers across all eight types, with synthetic counts documented in the specification.
Use this fixture as the planned room seed; do not generate a different mapping on each
startup or relabel it as actual hotel inventory. Historical booking-to-room assignments are now authorized under the demonstration
generation rule below. Satisfaction responses remain a separate unresolved input. Generated historical booking
dates use the approved demonstration years 2024, 2025, and 2026 and must match source
seasons. Other remaining booking/input rules still require clarification. See the specification's
2026-10-28 session for the complete tariff and confirmed rules.

**Confirmed annual room-revenue rule**: Assign each occupied night's room charge to
the calendar year of that night. Do not assign an entire cross-year stay to arrival
year. Standard Single, 31 December 2025–2 January 2026: DKK 1,152.0 belongs to 2025
and DKK 1,031.0 to 2026; sum DKK 2,183.0. Departure day is not charged. Historical
bar-date allocation is an authorized synthetic distribution under the rule below.

**Confirmed historical-bar generation rule**: Distribute recorded per-drink quantities
across synthetic daily dates in 2024–2026. Retain each source drink's unit price and
preserve its total units and exact total revenue across the generated days. Use whole
unit quantities and a reproducible distribution algorithm in detailed design. Keep
original aggregate rows traceable, but do not add them again to generated daily totals.
Reconcile 179,958 units and DKK 13,448,640.34 before final display rounding; label the
generated daily dates as demonstration data, not observed sales history.

**Confirmed historical-booking generation rule**: Distribute demonstration bookings
across 2024–2026, with every occupied night inside the source season. Assign an available
room of each booking's recorded type from the fixed demonstration inventory, with no
overlapping active stays. Preserve source IDs, room type, season, nights, and prices;
label generated dates/assignments synthetic. Choose a reproducible generation algorithm
in detailed design and report any placement failure instead of changing source facts.
This booking rule does not generate questionnaire responses or missing guest counts.
Daily bar demonstration records are separately authorized below.

**Confirmed access scope**: This local prototype requires no login or user accounts.
Do not add account registration, credential setup, or role-based authorization as a
startup prerequisite. Browser and API clients have the same access and must still
pass booking validation and room-availability checks. This is the approved local
prototype scope, not a decision about a future production deployment.

**Confirmed missing/cancelled-booking rule**: Unknown IDs report “Booking not found”
without mutation. Browser cancellation requires confirmation; declining does nothing.
Repeat cancellation is a no-op on the already-cancelled state and indicator totals.
Keep enough booking lifecycle information to distinguish an already-cancelled ID from
an unknown one; determine persistence and API responses in detailed design. The same
missing-ID and repeat-cancellation semantics apply to browser and API clients.

**Confirmed booking-edit rule**: Permit changes to guest names, booking holder's
email (required and format-validated, except that an imported booking without one may stay empty), booking holder's country, guest count, selected room numbers, arrival, and nights. Keep BookingID fixed;
recompute departure, nightly seasonal charges, and booking total from the saved inputs.
Check room availability again before accepting the update; never permit manual price
replacement. Detect whether the client edited an outdated booking state: accept the
first valid save and reject subsequent stale saves with a reload message, preserving
the saved values. Apply this across browser and API. Choose the state/version token
and atomic database update mechanism in detailed design; do not implement silent
last-write-wins behavior.

**Confirmed room availability rule**: Receptionists select specific room numbers
available for the entire stay. Reject an active same-room conflict when
`newArrival < existingDeparture` and `newDeparture > existingArrival`. Arrival on
another stay's departure is allowed. Apply the rule to creation and edits through
both channels; exclude the booking itself when validating an edit. The implementation
must ensure concurrent requests cannot both reserve overlapping stays; the mechanism
belongs in detailed design. Historical assignments follow the confirmed demonstration generation rule. Guest-
capacity validation is explicitly out of scope for this prototype; validate room
availability without creating per-type guest limits. Preserve guest counts for reporting.

**Confirmed booking-country rule**: Attribute each booking, all its guests, and its
room revenue to the booking holder's country. Keep guest counts separate from booking
counts and count revenue once. Do not require individual guest countries for this
aggregation. Historical person counts remain unknown; the rule does not supply a
country for independent walk-in bar sales. Country revenue reports and rankings
include room-booking revenue only; all bar revenue stays in separate bar totals and
combined hotel revenue, without country allocation.

**Deferred Tableau investigation (user-owned, 2026-10-29)**: The user will choose the
integration and refresh approach. Retain the findings below as reference; do not
continue connector/refresh research or implement an exporter without new direction.
Proceed with other planning and clarification.

**Prior refresh findings**: Browser refresh after booking creation/edit/
cancellation and next-request API freshness are confirmed. The user asks about
automatic Tableau Desktop refresh; manual-only refresh is not yet an accepted final
choice. The user has confirmed Public Edition. Its connector set is limited; do not
assume the generic REST API Connector is available in that edition. Where available,
that connector is extract-only and documents manual refresh; do not substitute a direct PostgreSQL connection for the required API path.
Built-in published extract schedules run on Server/Cloud. Do not rely on the old
Windows Data Extract command-line utility: Tableau marks it deprecated and unavailable
in later releases. Any local automation must be researched and tested for this setup,
including whether an already-open view updates, before being promised or implemented.

Sources: [REST API Connector](https://exchange.tableau.com/products/1111),
[refresh scheduling](https://help.tableau.com/current/pro/desktop/en-us/publish_workbooks_schedules.htm),
[deprecated extract utility](https://help.tableau.com/current/pro/desktop/en-us/extracting_TDE.htm).

**Public Edition findings**: Tableau's Public FAQ states that published Public workbooks
use extracts rather than live connections. Its supported automatic data refresh is for
Google Sheets sources every 24 hours; other sources do not have automatic refresh on
Public. This hosted feature is not automatic polling of the local project API by the
Desktop application. Do not add Google Sheets, cloud publishing, or another Tableau
edition without a user decision. Public Edition can save workbooks locally; using it
does not by itself authorize publishing project data.

**Deferred, unselected local integration candidate**: A small exporter fetches current JSON from
the application API and writes a CSV supported by Public Edition; the user then refreshes
the local workbook manually. This retains the API as the reporting-data source but is
an indirect file-based connection. Validate suitability against the assignment and
obtain the user's choice before treating it as the selected architecture. Do not
promise automatic dashboard refresh merely because an exported file is updated.

Source: [Tableau Public FAQ](https://help.tableau.com/current/pro/desktop/en-us/public_faq.htm).

**Confirmed bar-category rule**: Keep Cocktails, Coffee, Wine, and Beer separate.
The cocktail/coffee comparison uses cocktail revenue plus coffee revenue as its
sole denominator. Overall bar revenue and units include all four categories. For
revenues 300, 100, 200, and 400 respectively, comparison shares are 75.0%/25.0% and
bar revenue is DKK 1,000.0. Do not invent missing wine/beer catalog entries or sales.

**Confirmed daily bar-entry rule**: The closing shift selects a sales date and records
total quantities per drink. Maintain one effective quantity per date/drink pair.
A correction replaces that quantity; repeating the same save must not add units or
duplicate reporting revenue. This specifies daily aggregates, not individual-sale
transactions. Catalog/input details remain in spec R8.

**Confirmed satisfaction rule**: Each questionnaire supplies one overall 1–5 rating
linked to a room. Compute the arithmetic mean of that room's ratings and display one
decimal; return null when there are no responses. For ratings 2, 4, and 5, the displayed
score is 3.7 out of 5. Receptionists record each response against its booking and one
specific room on that booking. Validate that the room belongs to the booking; separate
rooms can receive separate responses. Do not copy a response to every room or generate
historical ratings. Spec R6 is resolved.

**Confirmed pricing rule**: For new bookings, derive the season independently from
each occupied night's date, select the room-type tariff for that season, sum nights
per room, then sum all rooms. Arrival night is included; departure night is excluded.
For one Standard Single room arriving 31 May for two nights, total price is
DKK 1,152 + DKK 1,339 = DKK 2,491.0. Historical source prices are not recalculated.

**Startup acceptance**: After those decisions, validate a clean clone using only
`docker compose up`, with automated application initialization, documented local URLs,
and no undocumented manual setup. Test first startup and restart behavior separately.
Describe Tableau Desktop prerequisites and workbook/connector steps explicitly.

## Complexity Tracking

No architectural exception is proposed. The Tableau Desktop boundary remains open
rather than being recorded as an approved exception to the containerization principle.

## Planning Deliverables and Remaining Gates

- [research.md](research.md): selected technologies, source references, and alternatives.
- [data-model.md](data-model.md): draft entities, provenance, money, lifecycle and locking.
- [contracts/openapi.json](contracts/openapi.json): independent API contract draft, including
  read-only calculations and mutation/error shapes; not a claim of implemented endpoints.
- [quickstart.md](quickstart.md): planned clean-clone validation and acceptance scenarios.

No request-idempotency mechanism or duplicate-specific Save-button restriction is planned.
Normal uniqueness, room-overlap checks, stale-edit checks, and repeated cancellation
semantics still apply. No Tableau connector/exporter is selected. Do not enter unrestricted
implementation merely because these independent draft artifacts exist: unresolved
business items and deferred integration remain visible in research.md.

## Implementation slice — 2026-10-29

US1–US4 are the first implementation increment: create/read/list/availability, edits
and cancellation in browser and API. Use `backend/openapi.json` as the served, implemented
contract; the contract under `contracts/` remains the full future draft. Current
initialization seeds room inventory, approved tariffs and country choices only. Historical
booking/bar imports, reporting, bar entry, and satisfaction remain pending tasks.

The implemented schema uses `bookings` with version/status and nullable source fields,
`booking_rooms`, `booking_guests`, and `room_nights`. Guest name/country storage accepts
255 Unicode characters; IDs and guest counts use checked non-negative BIGINT storage with the existing API integer bounds. These are
storage boundaries, not guest-capacity rules. The existing API date range (1000–9999) is preserved;
there is no new business maximum for stay length. Names remain free text, arrival uses
a date picker, and numeric selectors can extend without treating their initial option
count as a policy limit.

Compose defaults permit a fresh clone without `.env`, use local PostgreSQL port 5433,
and preserve the database volume. Reused volumes must retain their existing credentials.
Images are pinned to the verified Node 24 and PostgreSQL 18 digests; npm versions are pinned
in `backend/package-lock.json`. The separate test profile uses a disposable database;
it is not part of ordinary application startup. No database reset is part of testing.


## PostgreSQL amendment — 2026-11-02

The user selected PostgreSQL following the week-2 assignment. Constitution IV is now
PostgreSQL; the three-layer architecture, JSON contract, Swagger UI and one-command
Docker startup remain unchanged. Use pg with numbered parameter bindings, RETURNING
IDs, transactional DDL/catalog initialization under a transaction-scoped advisory lock,
and READ COMMITTED transactions with sorted room row locks. Preserve decimal strings,
calendar date strings, booking IDs, versions and all existing booking behavior.

Normal database: db:5432, host localhost:5433, dedicated postgres_data volume. Retain
the original MySQL volume and Git tag uge-1-mysql-demo-2026-11-02. Existing local
booking records are transferred once with a private snapshot and verified table-by-table;
this is distinct from the still-pending Excel historical-data import.
The week-2 report endpoints/frontend calculations remain separate pending report tasks.


## Annual room-revenue increment — 2026-11-02

Implement the room portion of FR-013/US11, plus FR-007 freshness and FR-022 no-data
behavior, through GET /api/reports/revenue?year=YYYY. Bar and combined hotel totals
remain pending. Keep SQL aggregation in data/reportRepository.js, year validation and
response composition in services/reportService.js, and HTTP routing in presentation/reportRoutes.js.

The required year is one four-digit value from 1000 to 9999, matching the current booking
API date bounds. Query active booking room-night charges over the half-open calendar-year
interval. Sum NUMERIC exactly; return {year, currency: "DKK", roomRevenue: decimal-string|null}.
No-data SUM remains null. Do not relabel this as combined hotel revenue or restrict it
to stays completed before today. Preserve saved charges rather than repricing a report.

Frontend: annual room-revenue card, year selection from approved demonstration years,
current year and saved stays, explicit room-only scope, JSON link, refresh on booking
changes and an independent visible failure state. Ignore obsolete responses if the
user changes years quickly. Contract: backend/openapi.json version 0.2.0.
Verification: cross-year/multi-room allocation, cancellation/edit freshness, decimal
precision, no data versus zero, invalid years, and a browser flow fetching real API totals.


## Guest/staff frontend split — 2026-11-02

User requested two frontends, including Helene Christine's functions on the staff side.
Serve guest entry at / (alias /guest), staff entry at /staff. They have separate HTML and
JavaScript entry points, with a shared booking-form controller and API/formatting helpers.
Keep one Express container and one PostgreSQL container so docker compose up remains
the complete startup command. Guest code must not request the booking list or reports.

Staff contains the existing booking administration and annual room revenue plus the bar
functions in US15–US17/US19. Add drinks and daily_bar_sales with an idempotent source-menu
seed. Read only the 30 source drink names/categories/prices; do not import undated
aggregate sales into annual reporting. No synthetic sales or wine/beer products are seeded.
SQL save uses one date/drink key, replaces quantity and preserves the first saved unit price.
SQL stores exact revenue; business layer computes bar/category totals and the cocktail/coffee
comparison, excluding wine/beer from its denominator. API contract is version 0.3.0.

Input implementation assumption for the prototype: daily quantity is a non-negative
whole count, selected from an extendable dropdown, bounded only by its storage range;
zero allows correction to no units sold. This does not resolve all R8 product/input choices.
For a recorded zero comparison denominator, expose mixStatus=undefined and no numeric
percentage, displaying Not defined; R10's desired business treatment and rounding remain open.

No authentication or access restrictions are added, following the existing explicit local
prototype decision. Separating guest/staff interfaces does not secure staff API endpoints.
Broader hotel reports, satisfaction, historical workbook import and Tableau remain pending.


## Historical Excel import — 2026-11-02

The user explicitly requested execution of the approved booking/bar enrichment. The
read-only extractor records workbook SHA-256, payload checksum, Excel row references
and unchanged original values in workbook-history.json. Runtime needs neither Python
nor Excel: normal initialize() imports this checked-in fixture inside its startup transaction.

Inspection confirmed all 1,000 source bookings have a recorded price-per-night field
whose product with nights equals the original total. Therefore room_nights can retain
that actual source rate exactly, without fabricating nightly allocations or using today's
tariffs. Label pricing_mode=source-preserved; a deliberate booking edit recalculates
the tariff and keeps immutable original evidence. Unknown source guest counts remain null
and can remain null on edit; an ordinary/new booking still requires a positive count.

Generation is deterministic in source-row order: rotate preferred years 2024/2025/2026,
rotate season-valid arrival dates and type-compatible room numbers, and reject overlap
with existing or newly assigned stays. Every occupied night stays in the source season
and year. Report inability to place a booking rather than changing source facts.

Distribute each source drink's integer quantity across available daily keys in 2024–2026
using quotient/remainder and a fixed rotation. Skip existing date/drink keys and preserve
all existing daily entries. Use original source prices; reconcile each drink's units and
revenue. Only generated daily records are reportable, not the source aggregates again.

Use immutable source_records and historical_imports evidence guarded against update/delete.
A version/checksum marker makes restart a no-op even after edits/cancellation; changed source
bytes require a reviewed new import version. Keep existing operational IDs; preserve Excel
Booking ID separately as source identity. Lock room rows in order and bar writes during
import. Failures roll back the complete import and its completion marker.

Staff shows import reference totals, demonstration-date labels, year filtering, search and
25-row display pagination. Bookings are loaded with four bulk queries instead of per-booking
round trips. Annual APIs expose containsSyntheticData and /api/reports/history exposes
immutable source/reference totals. Pagination is a UI display choice, not a booking limit.


## Staff workspace navigation amendment — 2026-11-03

The user retired the customer frontend. Serve a static staff home with three SVG icon
links at / and /staff. Serve independent pages at /staff/overview, /staff/bookings and
/staff/bar. Header navigation and home links work across all pages. The former /guest
route/controller is removed; /staff.html redirects to the staff home for old bookmarks.

Overview owns overview.js, revenue.js and history.js. The booking page owns app.js and
bookingForm.js; it does not request reports or bar data. The bar page owns bar.js and
does not fetch booking lists. The home page has no data-fetching script. Keep one Express
container and the existing JSON API, PostgreSQL data, import markers and booking rules.
No database migration, new business rule or authentication change is part of this work.

Verification updates existing HTTP/browser checks to cover icon navigation, independent
page content/data requests, keyboard/mobile navigation and retained booking/report/bar
behavior, including the generated historical data and year/search/pagination controls.


## Hotel visual identity amendment — 2026-11-03

Use locally stored official room overview images, associated by exact room-type name
in frontend/roomPhotos.js. Clickable, labelled image buttons synchronize the existing
type filter and display availability counts; selected room numbers and booking rules
retain their current behavior. Photographs illustrate categories, not generated rooms.
Apply the reference site's Barlow body font, Miller/Times headline fallback stack,
warm beige/cream/brown palette and header wordmark across all staff pages. The source
Miller font-face is disabled and its referenced file unavailable, so do not claim to
bundle Miller. Store Barlow with its OFL license and document source URLs in
frontend/assets/README.md. No external font/photo requests are required at runtime.


## Combined annual hotel revenue — 2026-11-03

Extend the existing GET /api/reports/revenue?year=YYYY response additively with
barRevenue and totalRevenue, preserving roomRevenue, year, currency and provenance.
Use one PostgreSQL statement with independent room and daily-bar aggregates to avoid
join multiplication and read both components from the same snapshot. No schema change.
The service sums exact decimal strings with integer minor units; it keeps null components
visible, returns total=null only if both are null and preserves genuine zero values.
Use the same existing year validation and JSON errors. Extend the served OpenAPI and
show total plus room/bar breakdown on Overview through one report fetch. Keep the
separate detailed bar report and the wider draft /reports/summary unchanged.
Verify isolated PostgreSQL/API tests for decimal precision, missing/zero data, year
boundaries, multi-room totals, cancellation/corrections and either-source provenance;
then verify frontend year changes, error recovery, live values and desktop/mobile layout.
Other reporting, satisfaction and deferred Tableau tasks remain open.


## Remaining reports and satisfaction — 2026-11-03

Add GET /api/reports/summary, /countries, /rooms, /room-types-seasons and /inventory
using ReportRepository SQL aggregates, ReportService validation/calculations and report
routes. Optional year is 1000–9999; missing means all years. Aggregate booking counts
separately from nightly revenue to prevent multiplying people. Return exact monetary
strings and unrounded percentages; UI displays one decimal. Add a drinks report alias
using the existing bar service. Retain the current annual /revenue endpoint.

Add an empty satisfaction_responses table with independent booking and original-room
foreign keys and a 1–5 numeric constraint. Booking-room validation and insertion run under
a booking row lock in one transaction to serialize with booking edits/cancellation.
Use separate SatisfactionRepository/Service/routes. POST /api/satisfaction creates a
response; GET /api/reports/satisfaction returns all-time room means/counts (no financial
year filter). Inject the new repository at app composition; do not seed questionnaires.
Add booking-row questionnaire actions and an accessible dropdown form on Bookings.

Overview uses expandable report sections and one shared financial year selector. APIs
return sorted complete lists; frontend does not calculate financial indicators. Preserve
current no-data/provenance semantics, clear stale rows on failure and guard late responses.
Verify isolated API fixtures, source reconciliation, schema repeatability and browser
flows. Broader Tableau integration, new wine/beer menu values and questionnaire correction
policy remain outside this increment. Update data model, OpenAPI, tasks and convergence.
