# Hotel Kong Arthur

A local booking prototype built with JavaScript, Express, PostgreSQL, and a plain
HTML/CSS/JavaScript frontend. The backend follows the project's three-layer constitution.

## Start

From a clone of this repository, with Docker and Docker Compose installed:

```bash
docker compose up
```

Open **http://localhost:3000** for the guest booking frontend,
**http://localhost:3000/staff** for the staff frontend, and
**http://localhost:3000/api/docs** for Swagger UI. The first build downloads dependencies;
the app waits for PostgreSQL, creates its tables, and seeds the room/country/tariff catalog
automatically. No host Node/PostgreSQL installation or manual migration command is needed.
Use `docker compose up -d` to leave services running in the background.

| Service | Local address |
| --- | --- |
| Guest booking frontend | http://localhost:3000 |
| Staff operations frontend | http://localhost:3000/staff |
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

The first week-2 report is implemented: annual booked room revenue through the API and frontend. Other indicators remain pending.

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
Generated dates/room assignments across 2024–2026 are labelled demonstration data.
Source prices and immutable Excel evidence are retained. Operational edits/cancellations
affect current reporting without rewriting source reference totals. Other hotel indicators,
satisfaction and Tableau remain pending. The served OpenAPI lists implemented endpoints.
Clearly named browser test bookings remain cancelled, not active stays.

## Historical Excel data

Open `/staff`: the Excel history panel shows source control totals, while the annual
room/bar cards use the selected year's saved operational records. Use **Booking year**,
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

These are whole-source reference values, not amounts for one observed historical year.
Excel lacks actual stay/sales dates and numbered room assignments. The authorized
demonstration allocation uses 2024–2026, source seasons and available same-type rooms.
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

## Guest and staff frontends

The guest entry at `/` (alias `/guest`) provides stay dates, available rooms, automatic
prices and a confirmation of the guest's own booking. It never requests the internal
booking list or report endpoints. The staff entry at `/staff` provides booking CRUD,
annual room revenue, active booking count and Helene Christine's bar workspace. They
share booking-form behavior and one backend; no extra runtime services are required.

This remains the explicitly selected **local prototype without login**. Different pages
do not implement authentication, permissions or protected API endpoints.

### Helene Christine's bar workspace

Staff can view annual bar revenue and units, revenue per drink and the cocktail/coffee
revenue split. Wine/beer belong in overall totals but are excluded from that comparison.
Select a closing date, drink and total quantity to register daily sales; no booking is
required. Saving the same date/drink again replaces its quantity. The original unit-price
snapshot is retained for corrections and prices cannot be entered manually.

The 30 drink names/categories/prices are read from the source workbook and seeded once.
Undated source aggregates are allocated once to labelled synthetic daily records across
2024–2026, preserving quantities/prices and totals. Empty reporting scopes show No data. Wine/beer products remain an open input and are not invented. A recorded
zero comparison denominator displays Not defined; its business treatment and exact
half-way rounding remain open under R10. The extendable whole-quantity selector includes
zero as an explicit prototype assumption in the plan; remaining R8 input/menu choices
are not marked resolved.

Implemented staff bar endpoints (see Swagger):

- `GET /api/drinks`
- `GET /api/bar-sales?date=2026-11-02`
- `PUT /api/bar-sales/2026-11-02/1` with `{ "quantity": 12 }`
- `GET /api/reports/bar?year=2026`

## Annual room revenue

The staff frontend's **Annual room revenue** card fetches the selected year from
`GET /api/reports/revenue?year=2026`. It refreshes after booking creation, edits and
cancellation, on year changes, or with **Refresh revenue**. **View JSON** opens the
same API result. The year selector includes 2024–2026, the current year, and all years
represented by active stays. The API accepts a single year from 1000 to 9999.

```json
{ "year": 2026, "currency": "DKK", "roomRevenue": "2491.00", "containsSyntheticData": false }
```

PostgreSQL sums each active booking's exact room-night charges for dates in the selected
year. It includes future booked nights in that year and excludes cancellation and the
departure night. Multi-room bookings contribute each room-night once. A stay spanning
31 December and 1 January contributes to both years according to each night's date.
Prices are not recalculated from today's tariff when reporting saved charges.

Without eligible nights, roomRevenue is null and the card shows **No data**. An actual
zero is returned as "0.00"; database errors show **Unavailable**. JSON preserves two
decimal places; the frontend displays one. This report contains room revenue only, including imported source nightly charges;
bar revenue has a separate report. Generated history is identified by containsSyntheticData. It does not yet complete
the combined hotel revenue story. Swagger UI documents success and input/error responses.

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

This verifies guest-to-staff booking, staff edits/cancellation, annual room revenue and
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
