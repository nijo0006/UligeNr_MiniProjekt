# Implementation Plan: Hotel Operations and Performance Insights

**Branch**: `001-hotel-operations` | **Date**: 2026-10-28 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification and the team's technical choices supplied on 2026-10-28.

**Status**: Draft — confirmed technical direction recorded; research and detailed design
are not complete. This document does not authorize implementation or resolve open business rules.

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
by the team. Backend runtime and exact versions remain technical research decisions;
Node.js is a candidate, not an additional user-selected framework or version.

**Primary Dependencies**: Docker and Docker Compose, MySQL, and Tableau Desktop Public Edition are
confirmed. Backend framework, database driver, frontend serving, OpenAPI/Swagger UI
packaging, and Tableau connection mechanism remain to be selected and verified.
No frontend framework has been requested.

**Storage**: MySQL, confirmed. Plan persistent Docker-managed storage so ordinary
container restarts do not erase operational data. Exact version, schema, migrations,
and initial-data handling remain design work. Historical enrichment requires the
business decisions in spec R2/R5; the team now permits labelled, season-based demonstration booking dates. Preserve
raw records and do not represent generated dates as actual historical facts.

**Testing**: Test tools remain to be selected. Required validation will cover business
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
| I. Three-layer architecture | Separate presentation/API, business logic, and data access responsibilities. | Direction aligned; design pending. |
| II. REST with JSON | Browser and reporting integrations use the backend REST/JSON interface. | Required; contract pending. |
| III. OpenAPI and Swagger UI | Deliver an OpenAPI contract viewable in Swagger UI. | Required; packaging pending. |
| IV. MySQL | MySQL is the application database. | Confirmed. |
| V. Docker and single-command startup | Application services build/start through one Compose command. | Validation pending; Tableau Desktop host boundary requires acknowledgement. |

**Gate result**: Not ready for finalized Phase 1 design. No constitutional exception
has been granted. Resolve the desktop-client boundary and blocking business decisions
before representing the plan as complete.

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

No source layout is finalized by this preference-recording draft. Detailed design
must define a browser frontend and a backend with the three required responsibilities,
plus Compose configuration and tests. No application code or deployment configuration
is created at this stage.

## Outstanding Decisions

**Technical research**: Select and pin the backend runtime and dependencies, choose
frontend serving and test tools, verify MySQL startup readiness and persistent storage,
and validate a Tableau Desktop/API integration against the actual installed version.
Do not assume that Desktop consumes any JSON API without a connector or other setup.

**Business clarification**: Spec R1–R10 remain authoritative. Follow-up decisions
confirm all 24 tariff cells (Standard Single low season: DKK 1,031), date-picker
arrival, departure calculated from nights, typed guest names, and labelled season-based
demonstration booking dates. The user now authorizes generated demonstration room
inventory, superseding the previous prohibition. The fixture
[fixtures/room-inventory.json](fixtures/room-inventory.json) defines 214 unique room
numbers across all eight types, with synthetic counts documented in the specification.
Use this fixture as the planned room seed; do not generate a different mapping on each
startup or relabel it as actual hotel inventory. Booking-to-room assignments and
satisfaction responses are separate unresolved inputs. Generated historical booking
dates use the approved demonstration years 2024, 2025, and 2026 and must match source
seasons. Year allocation, walk-in bar country attribution, satisfaction collection, and other
remaining rules still require clarification. See the specification's
2026-10-28 session for the complete tariff and confirmed rules.

**Confirmed booking-country rule**: Attribute each booking, all its guests, and its
room revenue to the booking holder's country. Keep guest counts separate from booking
counts and count revenue once. Do not require individual guest countries for this
aggregation. Historical person counts remain unknown; the rule does not supply a
country for independent walk-in bar sales.

**Refresh integration investigation**: Browser refresh after booking creation/edit/
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

**Unapproved local integration candidate**: A small exporter fetches current JSON from
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
score is 3.7 out of 5. Do not generate historical ratings. Collection and multi-room
linkage remain open in spec R6.

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
