# Hotel Kong Arthur

A local booking prototype built with JavaScript, Express, PostgreSQL, and a plain
HTML/CSS/JavaScript frontend. The backend follows the project's three-layer constitution.

## Start

From a clone of this repository, with Docker and Docker Compose installed:

```bash
docker compose up
```

Open **http://localhost:3000** (or **http://localhost:3000/staff**) for the staff home and
**http://localhost:3000/api/docs** for Swagger UI. The first build downloads dependencies;
the app waits for PostgreSQL, creates its tables, and seeds the room/country/tariff catalog
automatically. No host Node/PostgreSQL installation or manual migration command is needed.
Use `docker compose up -d` to leave services running in the background.

| Service | Local address |
| --- | --- |
| Staff home with icon navigation | http://localhost:3000 |
| Overview and historical figures | http://localhost:3000/staff/overview |
| Booking administration | http://localhost:3000/staff/bookings |
| Helene’s bar | http://localhost:3000/staff/bar |
| Swagger UI | http://localhost:3000/api/docs |
| Implemented OpenAPI JSON | http://localhost:3000/api/openapi.json |
| Readiness | http://localhost:3000/api/health |
| PostgreSQL for a host database client | 127.0.0.1:5433 |

The app connects internally to `db:5432`. Compose binds exposed ports to the local
computer. It uses local-development credentials by default; optional `.env` overrides
are documented in `.env.example`. Keep existing `.env` credentials when reusing an
already initialized PostgreSQL volume: changing environment values does not reset database
passwords. `.env` is ignored by Git and excluded from the application image.

If port 3000 or 5433 is occupied, set `APP_PORT` or `POSTGRES_HOST_PORT` in an optional
`.env` file. `docker compose stop` stops the application without deleting its data.
Normal restarts preserve bookings and do not repeat catalog seeds.

## PostgreSQL change — week 2

PostgreSQL replaces MySQL under Constitution v2.0.0. The previous working code is
preserved at Git tag `uge-1-mysql-demo-2026-11-02`; migration work is on
`feature/postgresql`. The old `mysql_data` Docker volume is retained, while the current
application uses a separate `postgres_data` volume. Legacy `MYSQL_*` values in an old
`.env` are ignored; see `.env.example` for optional `POSTGRES_*` overrides.

Five existing local booking records were copied and reconciled table-by-table, including
IDs, prices, statuses and room-night charges. This one-time transfer is separate from
the full Excel historical import described below. The private snapshot contains guest data and stays outside
Git. `backend/scripts/migrate-mysql-snapshot.js <private-snapshot.json>` can import that
format into an empty, initialized target; it refuses a target containing bookings and
verifies records before commit. This script is not required on a fresh clone.

Annual hotel revenue is implemented through the API and frontend, with separate room and bar components and their combined total. The remaining operational reports and room questionnaires are also implemented; Tableau remains deferred.

## Implemented booking slice

- Create, list, read, edit, and cancel bookings through browser and JSON API.
- Select specific available rooms from 214 clearly labelled demonstration rooms.
- Generate BookingID, departure, nightly seasonal charges, and exact booking totals.
- Support multiple rooms and recorded guest counts, without per-room guest-capacity checks.
- Reject room overlaps atomically, including simultaneous requests; allow departure-day arrival.
- Reject stale edits with a reload message, preserving the first valid save.
- Confirm browser cancellation; repeat cancellation has no additional effect.
- No login, user accounts, or special duplicate-submission feature.

The room-type catalog, tariff table and generated inventory follow `spec.md` and its
fixture. Country choices are the 20 workbook countries plus Denmark, which appears
in the approved booking acceptance examples. The browser's quantity selectors can
extend to show more values; their initial option count is not a maximum-stay policy.

Normal startup now imports the **1,000 source bookings** and **179,958 bar units** once.
Generated dates/room assignments within 2026 are labelled demonstration data.
Source prices and immutable Excel evidence are retained. Operational edits/cancellations
affect current reporting without rewriting source reference totals. Country/type/season and room reports, occupancy, inventory and questionnaire means are implemented.
Tableau remains deferred. The served OpenAPI lists implemented endpoints.
Clearly named browser test bookings remain cancelled, not active stays.

## Historical Excel data

Open `/staff/overview` for the Excel history panel and annual room revenue. Bar figures
are on `/staff/bar`. Open `/staff/bookings` and use **Booking year**,
**Search bookings**, and previous/next controls to browse the history. A `#123` search
selects an exact operational BookingID; ordinary text searches names, country, rooms and
source IDs. The 25-row display page size does not limit stored bookings.

| Original source control | Value across all source records |
| --- | --- |
| Bookings | 1,000 |
| Room-nights | 5,379 |
| Room revenue | DKK 11,234,034.00 |
| Bar units | 179,958 |
| Bar revenue | DKK 13,448,640.34 |

The user confirmed that the complete workbook belongs to 2026; these are its original annual reference totals.
Excel lacks actual stay/sales dates and numbered room assignments. The authorized
demonstration allocation within that source year uses 2026, source seasons and available same-type rooms.
Guest counts remain null; no satisfaction responses or additional people are generated.
Original per-night prices exist in every source booking and sum exactly to its original
total; these saved charges are retained, without applying the current booking tariff.

The source's bar quantities/prices are distributed over synthetic daily records. Existing
date/drink entries are skipped and preserved; source aggregates are not counted again.
`GET /api/reports/history` exposes import metadata and immutable reference totals. Annual
APIs identify generated history with `containsSyntheticData`. Editing a source booking
explicitly applies the current tariff, while keeping source evidence unchanged; its
unknown guest count can remain unknown. Existing operational IDs are preserved and the
original Excel BookingID is stored separately through source identity.

The bundled `backend/src/startup/workbook-history.json` carries workbook/payload hashes
and source row references. Runtime requires no Excel/Python tool. Optional read-only
regeneration: `uv run --no-project --with openpyxl python backend/scripts/extract-workbook-history.py`.
Source extraction validates the controls above; startup validates records and exact totals
before committing. Immutable `source_records`/`historical_imports` preserve evidence; a
version/checksum marker makes restart a no-op after later edits or cancellation. Failures
roll back the entire import. Never delete volumes or markers to force a re-import.

## Three layers and container architecture

```mermaid
flowchart LR
  Browser[Browser: HTML / CSS / JavaScript] --> Presentation
  subgraph app[app container]
    Presentation[Express routes and JSON errors] --> Services[Booking rules / nightly prices / transaction orchestration]
    Services --> Data[Repositories and parameterized SQL]
    Swagger[Swagger UI and OpenAPI]
  end
  Data --> DB[(PostgreSQL db container / persistent volume)]
  Browser --> Swagger
```

- `backend/src/presentation`: HTTP parsing, statuses, JSON errors, Swagger UI and frontend serving.
- `backend/src/services`: validation, seasonal pricing, booking lifecycle, transaction orchestration.
- `backend/src/data`: connection pool, prepared SQL, row locking and persistence.
- `backend/src/startup`: versioned table/catalog initialization.
- `frontend`: plain browser code; it never connects directly to PostgreSQL.

Prices are summed per occupied room-night using that night's season, including arrival
and excluding departure. December is mid season. Money is stored exactly and returned
as decimal strings; the frontend displays one decimal. Booking edits carry a saved
version; room rows are locked in sorted order inside a transaction before checking
availability. No allocation is committed if part of a multi-room request fails.

## Example JSON request

Once the app is healthy and room 001 is available:

```bash
curl -i http://localhost:3000/api/bookings \
  -H 'Content-Type: application/json' \
  -d '{"holderFirstName":"Frederik","holderLastName":"Johansen","holderCountry":"Denmark","guestCount":1,"roomNumbers":["001"],"arrival":"2026-05-31","nights":2}'
```

Expected: HTTP 201, departure `2026-06-02`, total price `2491.00` (1152 + 1339).
Do not supply ID, departure or prices. If the selected room is occupied, use the room
availability endpoint or frontend to choose another room. See Swagger UI for edit and
cancellation requests and the saved `version` required by edits.

## Staff home and workspaces

The customer-facing booking page has been removed at the user's request. The start page
at `/` (alias `/staff`) provides three accessible icon links:

- **Overview** (`/staff/overview`): annual hotel revenue with room/bar breakdown, booking count and original Excel reference figures.
- **Bookings** (`/staff/bookings`): create, view, search, filter, edit and cancel bookings.
- **Helene’s bar** (`/staff/bar`): annual bar/drink reporting and daily closing quantities.

Each area has its own HTML/JavaScript entry point and a shared header menu/home link.
The home page does not load hotel data, and each workspace requests its own data. The
old `/guest` page/controller is no longer served; `/staff.html` redirects to staff home.
All functionality still starts through one `docker compose up` command.

This remains the explicitly selected **local prototype without login**. Navigation changes
do not add authentication, permissions or protected API endpoints.

### Helene Christine's bar workspace

Staff can view annual bar revenue and units, revenue per drink and the cocktail/coffee
revenue split. Wine/beer belong in overall totals but are excluded from that comparison.
Select a closing date, drink and total quantity to register daily sales; no booking is
required. Saving the same date/drink again replaces its quantity. The original unit-price
snapshot is retained for corrections and prices cannot be entered manually.

The 30 drink names/categories/prices are read from the source workbook and seeded once.
Undated source aggregates are allocated once to labelled synthetic daily records across
2026, preserving quantities/prices and totals. Empty reporting scopes show No data. Wine/beer products remain an open input and are not invented. A recorded
zero comparison denominator displays Not defined; its business treatment and exact
half-way rounding remain open under R10. The extendable whole-quantity selector includes
zero as an explicit prototype assumption in the plan; remaining R8 input/menu choices
are not marked resolved.

Implemented staff bar endpoints (see Swagger):

- `GET /api/drinks`
- `GET /api/bar-sales?date=2026-11-02`
- `PUT /api/bar-sales/2026-11-02/1` with `{ "quantity": 12 }`
- `GET /api/reports/bar?year=2026`

## Annual hotel revenue

The Overview page shows annual **combined hotel revenue**, **room revenue** and **bar
revenue** from one `GET /api/reports/revenue?year=2026` request. Select a reporting year
or use **Refresh revenue**; returning from booking administration reloads current values.
**View JSON** opens the same result. The year selector includes recent reporting years, the source year 2026 and years
represented by active stays. The API accepts one
calendar year from 1000 to 9999.

Example response (illustrative values):

```json
{
  "year": 2026,
  "currency": "DKK",
  "roomRevenue": "2491.00",
  "barRevenue": "691.00",
  "totalRevenue": "3182.00",
  "containsSyntheticData": false
}
```

Room revenue sums saved charges for each active occupied room-night in the selected
year, including future booked nights and excluding cancellation and departure. A stay
crossing New Year contributes to the proper year for each night. Bar revenue sums saved
daily sales amounts by sales date, including all drink categories and walk-in customers.
Corrections replace the previous daily contribution. Independent database aggregates in
one statement prevent multiplied totals and read the components from the same snapshot.
The service adds exact integer minor units, without floating-point money arithmetic.
Reporting never reapplies current tariffs/menu prices or adds source reference totals.

A component without records is `null` and displays **No data**. The total sums the
recorded components; it is null only when neither has records. An actual zero stays
`"0.00"`. JSON keeps exact two-decimal strings; the frontend displays one decimal.
Request failures show **Unavailable**, separately from missing data.
`containsSyntheticData` is true if either included component contains imported history
with demonstration dates/room assignments; Overview explicitly labels those results.
The existing `roomRevenue` field remains available to API consumers. Swagger documents
the extended response, input validation and errors. Other operational reports and questionnaire entry are described below; Tableau remains deferred.

## Operational reports and questionnaires

Overview shows all API-backed reports as permanently visible rectangular cards with the same financial year selector.
Choose **All years** to reconcile the complete saved dataset; annual occupancy then
requires a single year rather than treating a multi-year operational scope as one year.

| API | Result |
| --- | --- |
| `GET /api/reports/summary?year=2026` | Booking/guest/night counts, revenue, bar units and annual occupancy |
| `GET /api/reports/countries?year=2026` | Holder-country bookings, guests and room revenue, highest revenue first |
| `GET /api/reports/room-types-seasons?year=2026` | All 24 type/season revenue combinations |
| `GET /api/reports/rooms?year=2026` | All numbered rooms, highest room revenue first |
| `GET /api/reports/inventory` | All-time room stock by type, totaling 214 |
| `GET /api/reports/satisfaction` | All-time room questionnaire means and response counts |
| `GET /api/reports/drinks?year=2026` | Per-drink rows from the existing annual bar report |
| `POST /api/satisfaction` | Record one actual room-linked questionnaire |

Omit `year` on summary/country/type-season/room reports for all saved years. A booking
counts once per scope if it has occupied nights in it; it may appear in both years when
crossing New Year. Room-night revenue always contributes only to its own date. Countries
use the booking holder's country for all guests and room revenue, without bar revenue.
If any included guest count is unknown, `guestCount` is null; `knownGuestCount` and
`unknownGuestBookingCount` expose the known subtotal and missing-booking count. These
are not estimated complete guest totals. Empty booking/night counts are zero; missing
revenue/ratings are null. Occupancy uses the agreed fixed 214 × 365 denominator, including
leap years, and is null without occupied nights. Equal revenues remain equal; name/room
number stabilizes display without inventing business rank numbers. Synthetic date/room
provenance accompanies reports; the room inventory itself is demonstration data.

On **Bookings**, select **Record satisfaction** on a booking, or use the questionnaire
form below the list. Select one of that booking's rooms and a rating from 1 to 5.
Example JSON: `{"bookingId":123,"roomNumber":"001","rating":4}`. The API also accepts
numeric ratings within the range. It validates active booking and current room membership
inside a transaction serialized with booking edits/cancellation. Each POST records a
distinct actual response; correction and duplicate-questionnaire policies remain open.
Feedback keeps its original room link after booking edits; cancelled bookings are
excluded from reporting. Questionnaire means are all-time, independent of the financial
year, and display one decimal. No historical responses are seeded. Normal startup creates
the empty questionnaire table idempotently; saved responses persist in PostgreSQL.

## Verification

Pure pricing/date tests on a developer machine:

```bash
cd backend
npm ci
npm test
```

API/PostgreSQL integration tests run in a separate disposable database, never the application
database. From the repository root:

```bash
docker compose --profile test run --build --rm test
```

The integration harness refuses databases whose names do not end in `_test`. It checks
initialization persistence, exact prices, concurrency, rollback, stale edits, repeated
cancellation, input rejection, Swagger/OpenAPI and readiness. The optional test database
has no exposed host port and stores its data in memory.

Browser smoke test with Chrome installed and the application running:

```bash
cd backend
npm ci
npm run test:browser
```

This verifies staff home navigation, staff edits/cancellation, historical/annual reporting and
bar-form rendering/corrections. Clearly named test bookings are cancelled afterward.
Real bar SQL behavior is tested only in the isolated test database; the browser bar
form test uses controlled HTTP fixtures and does not change live bar sales.
See [the current convergence report](specs/001-hotel-operations/converge.md) for evidence
and outstanding feature work.

## Spec Kit artifacts

- [Constitution](.specify/memory/constitution.md)
- [Specification](specs/001-hotel-operations/spec.md)
- [Plan](specs/001-hotel-operations/plan.md)
- [Tasks and completion state](specs/001-hotel-operations/tasks.md)
- [Implemented API contract](backend/openapi.json)
- [Full future API draft](specs/001-hotel-operations/contracts/openapi.json)

Tableau Public Edition's connection and refresh approach is deferred to the user.


## Room photographs and hotel appearance

The booking form includes eight clickable room-type photos from the official
[Hotel Kong Arthur room overview](https://arthurhotels.dk/hotel-kong-arthur/vaerelser/).
Selecting a photo filters room types; actual room numbers still come from availability.
Photos illustrate types, not each generated room. Staff pages use the hotel's warm
palette, header logo, local Barlow fonts and original headline fallback stack.
Assets and attribution: [frontend/assets/README.md](frontend/assets/README.md).


## Interactive country revenue map

Overview's Guest markets & highest-earning countries report is a world map. The existing
financial year/All years selector controls its API data. A linear scale maps lowest
recorded room revenue to pale blue and highest to deep blue; the legend shows the actual
minimum/maximum for that scope. Equal values share a color. Missing revenue records are
gray, distinct from recorded zero. Click/tap a country or use Explore a country to see
room revenue, bookings and complete/known/unknown guest counts. Hover/focus previews
revenue. Zoom controls, drag panning, arrow-key panning and Reset map are available.
The country data table is always visible below the map, including when geography cannot load.

Geometry is bundled locally from public-domain Natural Earth 1:110m data, without map
service keys/CDNs. Source and original checksum: frontend/assets/maps/README.md.
Country catalog names map explicitly to ISO3 in frontend/countryMap.js; unmapped rows
remain selectable and in the table rather than being discarded. This changes only the
country report's presentation; financial rules, APIs and other report tables are unchanged.


## Seasonal room revenue chart

Overview's Room revenue by type & season is a grouped blue bar chart: Revenue (DKK)
on the vertical axis, Low/Mid/High seasons on the horizontal axis, and one consistent
blue shade per room type. It follows Reporting year/All years and uses the existing
saved-charge report API. Legend checkboxes hide/show room types; Show all room types
restores them. The y-scale stays fixed for the selected reporting period when filtering.
Hover, focus or select a bar for its formatted revenue and room-night count. Missing
amounts are omitted, recorded zero has a baseline dot, and empty/error scopes are explicit.
On small screens scroll the plot horizontally; the data table remains permanently visible below the chart. Native SVG is local, with no chart library/CDN or backend/database change.


## Simple satisfaction table

Overview shows only Room type and Rating, one row for each of the eight types. Until
actual questionnaires exist, the rating is No data. Once responses arrive, the backend
averages the actual ratings per type and the UI displays one decimal out of 5; room
averages are not averaged again. `/api/reports/satisfaction?groupBy=roomType` supplies
this table. The default endpoint still supplies per-room results. No data is generated,
no schema migration is needed, and the existing questionnaire entry remains available.


## Workbook period corrected to 2026

The complete workbook belongs to 2026. This supersedes the earlier three-year premise.
Fresh clones allocate all 1,000 source bookings/5,379 nights and 179,958 bar units within
2026, preserving seasons, room types and original amounts. Source annual revenue is
DKK 11,234,034.00 rooms + DKK 13,448,640.34 bar = DKK 24,682,674.34. Operational
transactions/edits may change current totals; the immutable reference totals stay fixed.
Exact daily dates and numbered room assignments are still generated, not observed.

Existing legacy installations correct once during normal startup, transactionally,
without replacing booking IDs or resetting the database. Saved prices, quantities,
statuses and unrelated manual records are preserved. The old immutable import marker
remains; a new correction marker supplies current metadata. Restarts do not replay it.
Unexpected manually edited old-year source bookings stop automatic correction for review
instead of silently resetting them. A private pg_dump backup was taken before the local
correction; it is outside Git. Do not delete volumes or source evidence to re-import.
