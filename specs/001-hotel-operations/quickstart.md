# Quickstart and Validation

Status: booking maintenance, guest/staff frontends, annual room/bar reporting, daily bar
entry and historical Excel import are implemented. Other hotel reports and satisfaction
remain pending. Tableau integration is deferred to the user.

## Host prerequisites

Git, Docker with the Compose plugin, and a browser. No host Node, npm, or PostgreSQL is required.
First build may download images/packages. Tableau Public Edition is a separate host tool;
no automatic install, connector, publishing, or refresh setup is promised.

## Clean-clone acceptance

From the cloned repository root, `docker compose up` must build/start the normal services,
wait for database health, migrate and seed automatically, and expose these URLs:

- `http://localhost:3000/` — browser frontend
- `http://localhost:3000/api/health` — readiness; ready only after required initialization
- `http://localhost:3000/api/openapi.json` — JSON API contract
- `http://localhost:3000/api/docs` — Swagger UI

No .env copy, host npm install, manual schema creation, or separate seed command is allowed
for the standard local path. Document local-only defaults and port changes in the README.

## Full-feature acceptance checklist (includes pending work)

1. Verify 214 unique rooms across the eight fixture types and all 24 approved tariff cells.
2. Verify unchanged complete source totals: 1,000 bookings, DKK 11,234,034 room revenue,
   179,958 bar units, DKK 13,448,640.34 bar revenue. Synthetic daily allocations must not
   add those raw aggregates again. Missing guest counts remain unknown.
3. Create Standard Single, 31 May 2026 for two nights: departure 2 June and DKK 2,491.
   Two such rooms total DKK 4,982. Price cannot be supplied manually.
4. Verify 31 December 2025 for two nights splits DKK 1,152 into 2025 and DKK 1,031 into 2026.
5. Reject overlapping stays for the same room; allow arrival on the prior departure date.
   Run simultaneous requests and verify only a valid non-overlapping state commits.
6. Edit one booking from two clients; the first valid save succeeds, the stale save fails
   with a reload message, and no saved values are silently lost.
7. Confirm browser cancellation can be declined without changes, confirmed cancellation
   removes contributions, repeating it changes no totals, and unknown IDs change nothing.
8. Verify browser refresh after saves and current reporting results on the next API request.
   Login/account setup is not required. Extra duplicate-submission handling is not tested
   as a feature because it was declined.
9. Correct one daily drink quantity from 10 to 12; reporting contributes 12, not 22. Repeating
   the same save does not change totals; a different sales day is unaffected.
10. For category revenues 300/100/200/400, show cocktail/coffee 75.0%/25.0%, whole-bar 1,000.
    Missing wine/beer menu items are not generated to make this fixture look historical.
11. Enter room-linked satisfaction 2, 4, 5 and verify 3.7; a different room is unaffected;
    no responses gives null. Reject linking a response to a room outside its booking.
12. Stop and restart ordinary containers; preserve new bookings and corrected bar quantities.
    Initialization must not reseed or overwrite them. Do not remove volumes for this check.

## Tests and quality gates

Use `npm test` from backend for business tests and
`docker compose --profile test run --build --rm test` for isolated PostgreSQL/API tests.
The optional `npm run test:browser` uses local Google Chrome; ordinary startup requires
no browser test tooling or host Node. Package versions are pinned in the lockfile. Contract validation must exercise
all operations and errors, including stale versions, missing bookings, room conflicts,
nullable source guest counts, and rejection of client-supplied prices.

Do not claim the full feature passes while the independent business gaps in research.md
or Tableau end-to-end connection and refresh remain unresolved. The original planning checks did not execute an application. Implementation verification
is recorded below.


## Booking-slice verification — 2026-10-29

- Seven pricing/input unit tests passed.
- Eleven MySQL/API integration tests passed in a separate test database.
- One browser create → reload → edit → cancel test passed, including confirmation dismissal.
- Served OpenAPI validated; Swagger UI and frontend were reachable.
- An isolated Compose project started with an empty volume and `--env-file /dev/null`.
  Its database healthcheck required an authenticated TCP query before app startup.
- Created a two-night May/June booking for DKK 2,491.00 in that isolated project,
  removed/recreated its containers without deleting the volume, and verified the entire
  returned booking was unchanged. Normal project data was not reset.

These results cover booking maintenance, pricing, availability and startup only.
The full-feature checks above for reporting, source totals, bar and satisfaction
remain pending; see tasks.md.


## PostgreSQL verification — 2026-11-02

The current Compose setup uses PostgreSQL 18, with application port 3000 and an optional
host database connection on 5433. Previous MySQL evidence above describes the original
implementation. The old volume is retained; postgres_data is separate.

Commands: `npm test` in backend; `docker compose --profile test run --build --rm test`
from the root; `npm run test:browser` in backend with Chrome installed.
The database migration also checks every transferred row before committing, including
booking identity, status, dates and exact prices. Final executed results are in converge.md.


## Annual room-revenue verification — 2026-11-02

Open the Annual room revenue card at http://localhost:3000 and select a reporting year.
The View JSON link opens GET /api/reports/revenue?year=YYYY. Swagger documents the
endpoint, required year, exact decimal-string/null response and error cases.

Executed: seven pricing/input unit tests, sixteen isolated PostgreSQL/API tests, and one
Chrome browser flow passed. The four new API tests cover no data and invalid years,
New Year allocation across multiple rooms (2025: 2304.00; 2026: 2062.00), next-request
freshness after creation/edit/cancellation, decimal aggregation and actual zero versus null.
The browser verifies year selection, report failure/recovery, and displayed revenue changes
after create/edit/cancel, alongside the original booking flow.

The ordinary app/database containers were rebuilt and started healthy; the local 2026
report returned roomRevenue 33329.00 from the three existing active bookings. The clearly
named browser verification record was cancelled; no existing user booking was changed.
No Excel historical import or bar/combined-hotel revenue is included.


## Guest/staff verification — 2026-11-02

Guest: http://localhost:3000. Staff: http://localhost:3000/staff. Guest and staff share
the backend and PostgreSQL, with no additional startup command or login in this prototype.

Seven unit tests and twenty PostgreSQL/API integration tests passed. Three Chrome browser
flows passed: staff booking/revenue lifecycle, guest-to-staff booking with no guest-side
list/report requests, and controlled bar-form corrections. The real bar SQL integration
tests verify 10→12 replacement, repeated saves, separate dates/years, fixed price snapshots,
all-category totals and 75%/25% cocktail/coffee mix from the approved fixture.
Guest/staff desktop and mobile screenshots were captured; desktop layouts were reviewed.
Browser bar fixtures do not write live bar data; clearly named test bookings are cancelled.
Source Excel data remain unchanged. Existing user bookings are retained.


## Historical import verification — 2026-11-02

Normal docker compose up imports the bundled workbook extract once. No manual schema,
Python or seed command is required. Open /staff, inspect Excel history, choose Booking
year 2025, search or page through imported records, and select annual room/bar years.
Actual historical dates are unknown: generated 2024–2026 dates and room assignments
are explicitly demonstration data. Source guest counts remain unknown.

Executed: 10 unit/generator tests, 24 isolated PostgreSQL/API tests and 4 Chrome browser
flows passed. Controls: 1000 bookings, 5379 nights, 11234034.00 room revenue, 179958 bar
units, 13448640.34 bar revenue. Every original source nightly-price product and each
drink's quantity/revenue reconciles. No active room overlaps are introduced.

Live import preserved all 12 pre-existing booking rows, 12 room allocations and 40 nightly
charges unchanged. It added 1000 source bookings, 5379 source room-nights and 32880 daily
bar rows. A private pg_dump backup was taken before import. Browser test bookings were
cancelled. A subsequent forced app recreation preserved complete row-count/hash
fingerprints for all operational, source and import tables: no duplicates or data changes.

Tests cover existing-row/date-key preservation, raw evidence immutability, edits and
cancellation surviving repeat startup, impossible-placement rollback/retry and a late
database failure rolling back bookings/sales/evidence together. Browser history checks
cover year selection, search, pagination, provenance labels and actual 2025 report totals.


## Staff navigation update — 2026-11-03

The customer booking page is retired. Open / (or /staff) for three icon links:
/staff/overview, /staff/bookings and /staff/bar. Each page has shared header navigation
and a home link; no extra container or startup step is required. /guest and /guest.js
return 404. Staff booking creation and the existing JSON API remain available.

Validation: 24 isolated PostgreSQL/API tests and 4 Chrome browser flows passed. Checks
cover separate route content, removed guest URLs, home icon navigation, keyboard Enter,
mobile layout, retained create/edit/cancel with current report totals, report failure
recovery, historic year/search/pagination and daily bar correction UI. Desktop/mobile
home screenshots were reviewed; Overview and bar screenshots were captured/reviewed.
No database schema or source-data import changes were made. The booking browser flow
uses a clearly named test booking and cancels it afterward; bar UI fixtures avoid writes
to live sales.


## Room photos and hotel styling — 2026-11-03

Open /staff/bookings to browse eight room-type photo cards. Choose a card or the room-type
dropdown, then choose available room numbers as before. Photos, Barlow and the hotel
wordmark are local assets included in the normal Docker build. All staff pages use the
reference site's warm palette and headline fallback stack. Source mapping and font
license information are in frontend/assets/README.md and frontend/roomPhotos.js.

Validation: 4 Chrome browser flows passed, including all eight image URLs/loading,
photo-to-filter selection, loaded Barlow, retained booking create/edit/cancel and
report/history/bar flows. Desktop and mobile layouts and the photo gallery were reviewed.


## Combined annual hotel revenue — 2026-11-03

Open /staff/overview for annual hotel total plus separately labelled room and bar
revenue. Change Reporting year or press Refresh revenue. View JSON opens
/api/reports/revenue?year=YYYY; Swagger at /api/docs documents the extended response.
The response preserves roomRevenue and adds barRevenue and totalRevenue. Missing
components remain null; total is null only when neither source has records. Recorded
zero remains 0.00. Either source can set containsSyntheticData, shown on Overview.

Executed: 27 isolated PostgreSQL/API tests and 5 Chrome browser flows passed. Tests
cover independent aggregation, multiple rooms, New Year and departure boundaries,
bar-only/room-only/no-data/zero results, saved price corrections, booking edits and
cancellation, exact fractional sums and values beyond safe integer cents, and either-
source provenance. Swagger validation passed. Browser checks cover API-backed values,
year selection, missing/zero results, request-failure recovery and retained booking,
history and bar workflows. Desktop/mobile annual-report screenshots were reviewed.
No schema or data migration was needed; reports do not write data. The browser's own
temporary booking was cancelled; bar UI checks use fixtures rather than live sales.


## Remaining operational reports and questionnaires — 2026-11-03

Run docker compose up as usual. Overview now contains Performance reports: annual
occupancy, sold room-nights, guest completeness and expandable country revenue/counts,
type/season revenue, highest-earning rooms, inventory and all-time satisfaction. Use
the shared Reporting year or All years; occupancy requires a single year. Highest
revenue lists retain equal amounts without inventing numbered ranks. Unknown complete
guest totals display No data with the known subtotal/missing-booking count alongside.

(Superseded by Story 24 below: receptionist entry is removed.) Bookings includes Record satisfaction on each active booking plus a dropdown form at
/staff/bookings#questionnaire. Select a booked room and a 1–5 rating. Each submission
records a distinct actual response; means are all-time, independent of financial year.
No questionnaire seed data exists. Startup creates the empty response table and normal
Docker volume persistence retains future responses. No additional setup command.

Executed: 33 isolated PostgreSQL/API tests passed, including historical source controls,
all report scopes, exact allocation and unknown people, cancellation/edit freshness,
fixed-denominator occupancy and inventory invariance. Questionnaire tests cover room
membership, 2/4/5 arithmetic mean, invalid values, repeat-start persistence, original
room retention after edits and cancellation concurrency/exclusion. Served Swagger
contract validated. Seven Chrome browser scenarios verified; a targeted rerun passed
after correcting questionnaire controls' accessible names. Desktop/mobile report and
questionnaire screenshots reviewed. Report failure/recovery clears stale data; year
and All years selections work. Questionnaire/bar browser POSTs use controlled fixtures
and do not write live responses/sales; browser's temporary booking is cancelled.


## Country map — 2026-11-03

Open /staff/overview and the Guest markets & highest-earning countries section. Darker
blue indicates higher saved room revenue for the selected period. Use the country
selector or map paths, hover/focus, zoom/reset and drag/arrow keys. No-record countries
are gray; exact zero is still a recorded value. View country data discloses the table.
Geometry is local and requires no additional container or external map connection.

Verification: 9 Chrome browser scenarios passed; a focused map rerun additionally
checks actual drag movement without accidental selection. Checks cover color extrema,
equal values, neutral missing countries, recorded zero, hover/focus/keyboard and country
selection, year refresh, empty scope, API failure/recovery and geography failure with
usable data fallback/retry. Desktop/mobile map screenshots reviewed. Existing booking,
bar, history, questionnaire and reporting workflows also passed. No backend/database
changes; API/SQL suites were not repeated for this frontend-only presentation increment.


## Seasonal grouped bar chart — 2026-11-03

Open /staff/overview and expand Room revenue by type & season. Revenue (DKK) is the
y-axis, Low/Mid/High are x-groups and blue shades identify room types consistently.
Filter with legend checkboxes or Show all room types. Hover/focus/click bars for values.
Reporting year/All years updates all bars from the existing API. Missing data is omitted;
a recorded zero uses a dot at the baseline. Mobile plot scrolls within its own region,
with no page overflow; View seasonal data retains the full table.

Validation: 10 Chrome browser scenarios passed, including API-backed bar values and
relative heights, consistent series colors, axes, null/zero/empty cases, checkbox reset,
year scope, request failures/recovery, keyboard details and mobile scrolling. Desktop/
mobile screenshots reviewed. Backend rules and data are unchanged, so SQL/API suites
were not repeated for this presentation-only increment.


## Always-visible report cards — 2026-11-03

All Overview charts, maps and data tables now appear as fixed rectangular cards while
scrolling. No details/summary toggles remain, including the country/season data sections.
Static named section headings replace disclosure controls. Existing year, map, chart
filters and table/plot scrolling remain available. This supersedes earlier expandable/
closed-table descriptions. Four relevant Chrome browser scenarios passed, covering
immediate report/table visibility, year/error recovery, map selection/zoom/fallback and
season chart controls on desktop/mobile. Screenshots reviewed; no API/database changes.
T088 complete.


## Simple satisfaction table — 2026-11-03

Overview now shows eight room-type rows with only Room type and Rating. Real responses
will populate the mean; without responses the display is No data, never an invented
rating. Optional groupBy=roomType is validated and documented in OpenAPI; the default
per-room API and questionnaire entry remain available. Arithmetic mean uses actual
responses directly so differently sized room-response sets receive correct weighting.
No schema/data/seed changes. 33 isolated PostgreSQL/API tests passed, including a
four-response type mean of 3.25 (rather than an average of room means) and invalid
grouping rejection. Two relevant Chrome browser scenarios passed, verifying the eight
rows/two headers, retained questionnaire flow and desktop/mobile reports. Screenshot
reviewed. T089 complete.


## Source-year correction to 2026 — 2026-11-03

The user confirms that the workbook is for 2026 only, superseding all earlier three-year
source descriptions. Fresh startup now imports directly into 2026. Existing installations
correct in one transaction with a new append-only marker, keeping source identities,
immutable v1 evidence, booking IDs/statuses, saved prices/night counts and unrelated manual
rows. Exact dates/room numbers remain generated according to source season and availability.
Current source-linked bar quantities/amounts are redistributed only within 2026 and manual
date/drink keys are skipped. Later startup skips the completed correction. Unexpected
edited old-year source bookings cause a safe rollback for review rather than being reset.
History API/UI and OpenAPI/source documentation identify 2026. General recent-year choices
still permit empty-year reporting; they do not imply workbook records exist in those years.

Verification: 10 pure pricing/generator tests and 36 isolated PostgreSQL/API tests passed.
Fresh 2026 import reconciles all 1,000 bookings/5,379 nights and 179,958 bar units. Legacy
migration tests cover preserved IDs/cancellation/current bar corrections/manual stays,
room conflict avoidance, immutable evidence, late-failure rollback/retry, restart and
refusal to overwrite edited old-year sources. Ten browser scenarios were verified, with
focused passing reruns after updating old assumptions that the first booking was imported
and that 2024 recovery still contained workbook data. Reviewed the live 2026 Overview.

Before applying locally, created a private pg_dump backup outside Git. Live correction
completed successfully: all 11 before/after control groups match, including booking
business fields, source evidence, original marker, saved per-booking night totals,
per-source bar totals, manual data, guests and questionnaire records. Source annual
controls are DKK 11,234,034.00 rooms and DKK 13,448,640.34 bar, total DKK 24,682,674.34.
The live current total is higher because existing manual bookings are preserved.
A forced app recreation retained identical counts/hashes across nine tables, including
all dates/allocations and both immutable import markers. T090–T093 complete. No volume
reset, duplicate source import, new guest counts or questionnaire seed data.


## Fixed Overview reporting period — 2026-11-03

Removed the Reporting year dropdown and obsolete option-generation code. Overview now
displays plain 2026 and always passes year=2026 to its financial reports on load/refresh.
Inventory/satisfaction remain all-time; API year support and separate booking/bar controls
are unchanged. Five relevant browser scenarios passed, including static 2026/no select,
API-backed report values, null/zero/error recovery and map/chart interactions on desktop/
mobile. Screenshot reviewed. No database change. T094 complete.


## Booking completion and guest questionnaire (Story 24) — 2026-11-03

`docker compose up -d --build` also starts Mailpit; its inbox is http://localhost:8025.

1. On /staff/bookings, create a booking with an email and arrival today or earlier
   (future stays show a disabled "Check-out from …" button).
2. Select Complete stay and confirm. The booking shows COMPLETED STAY; the notice names
   the address the questionnaire was sent to. Edit still works; Cancel is gone.
3. Open the email in Mailpit and follow its link to /survey.html?token=….
4. Rate the stay overall, each room, and answer Would you recommend us?. Answers can be
   given in several visits; each question accepts one answer. A thank-you page follows.
5. On /staff/overview, room-type means, Overall stay rating and Would recommend the hotel
   reflect the answers. An invalid link shows an error without booking data.

Automated: `docker compose --profile test run --build --rm test` covers completion rules,
single email, mail failure, no-email bookings, questionnaire validation and reports.
