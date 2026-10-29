# Implementation Plan: Hotel Operations and Performance Insights

**Branch**: `001-hotel-operations` | **Date**: 2026-10-29 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification and the team's technical choices supplied on 2026-10-28.

**Status**: Draft — confirmed technical direction recorded; Tableau integration and
refresh are deferred to the user as of 2026-10-29. Continue other planning; independent technical research and draft design are recorded in research.md,
data-model.md, contracts/openapi.json, and quickstart.md. The full plan remains
incomplete at the explicitly unresolved business and Tableau gates. This document does not authorize implementation or resolve open business rules.

## Summary

Build a locally runnable hotel operations application with a JavaScript backend,
a browser frontend using HTML, CSS, and JavaScript, and MySQL storage. The backend
retains the constitution's presentation/API, business logic, and data access layers.
Provide the booking and reporting capabilities in the specification and supply
reporting data through the API to Tableau Desktop.

The delivery goal is to clone the GitHub repository and run `docker compose up`
to build and start the application, without installing a backend runtime, frontend
build tools, or MySQL directly on the host. Docker with Compose and Git are host
prerequisites. First startup may need network access to obtain images and dependencies.
This is a planned acceptance condition, not a claim that runnable code already exists.

## Technical Context

**Language/Version**: Backend JavaScript; frontend HTML, CSS, and JavaScript, confirmed
by the team. Technical design selects Node.js 24 LTS with Express 5 and ES modules.
Pin exact supported package patches and container digests during implementation;
see research.md for rationale and alternatives.

**Primary Dependencies**: Docker and Docker Compose, MySQL, and Tableau Desktop Public Edition are
confirmed. Select Express 5, mysql2 promise driver, locally packaged Swagger UI,
and plain browser fetch/DOM code served by Express. No frontend framework or build
pipeline is added. Tableau connection/refresh is user-owned and deferred.

**Storage**: MySQL 8.4 LTS with InnoDB, confirmed technical direction. Plan persistent Docker-managed storage so ordinary
container restarts do not erase operational data. Exact version, schema, migrations,
and initial-data handling remain design work. Historical enrichment requires the
business decisions in spec R2/R5; the team now permits labelled, season-based demonstration booking dates. Preserve
raw records and do not represent generated dates as actual historical facts.

**Testing**: Node built-in test runner/assertions, MySQL integration tests in containers,
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
| IV. MySQL | MySQL is the application database. | Confirmed. |
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
backend/tests/             # unit, API contract, and real MySQL integration cases
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
country, guest count, selected room numbers, arrival, and nights. Keep BookingID fixed;
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
that connector is extract-only and documents manual refresh; do not substitute a direct MySQL connection for the required API path.
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
