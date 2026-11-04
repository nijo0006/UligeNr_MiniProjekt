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


## Staff home and separate workspaces — 2026-11-03

Completed the user's navigation change: customer page/controller removed, staff home
with three named SVG icon links at / and /staff, and independent Overview, Bookings
and Helene’s bar pages. Header navigation exposes the current page and a route home.
Page-specific scripts prevent booking administration from requesting bar/revenue data,
and the home page makes no API calls. Existing booking and historical/bar behavior
remain available without a backend business-rule or database change. US20 is retired
and US22 records the new interface requirements.

Executed: 24 isolated PostgreSQL/API tests and 4 Chrome browser flows passed. A focused
keyboard/mobile icon-navigation check also passed. Tested booking creation/reload/edit/
cancellation, current API report totals, report failure/recovery, historic year/search/
pagination, bar form corrections with controlled HTTP fixtures, removed guest routes
and separate page content/data requests. Reviewed desktop/mobile home and Overview
screenshots. Existing user/source records were not changed; the browser's own booking
was cancelled. T068–T071 complete; other pending feature tasks remain open.


## Official room photos and frontend style — 2026-11-03

US23 implemented: eight local room-type photos with accessible filter buttons, Barlow
body fonts, official header logo, reference headline fallback and warm palette on all
staff pages. Attribution, original image mapping and Barlow OFL are retained locally.
No booking, pricing, inventory, database or API rules changed. Four browser flows passed;
photo loading/type selection and Barlow loading are explicitly checked. Desktop/mobile
screenshots and the eight-photo gallery were visually reviewed. T072–T074 complete.


## Combined annual hotel revenue — 2026-11-03

US11/FR-013 and T027 are now implemented: GET /api/reports/revenue returns saved annual
roomRevenue, barRevenue and exact totalRevenue; Overview displays all three from the
API. Independent aggregates in one database snapshot avoid join multiplication. The
service sums decimal strings using integer minor units. Calendar dates, cancellation,
bar corrections and source-price preservation follow the existing specification.
Missing components remain null; total is null only with no records in either source.
Synthetic provenance includes either component and is visible in the interface.
OpenAPI, README, specification and plan have been synchronized. No constitution change,
database migration or mutation of source/user records is part of the report change.

Evidence: 27 isolated PostgreSQL/API tests and 5 browser flows passed. Verification
includes year boundaries, multi-room contributions, room/bar-only scopes, zeros,
exact arithmetic beyond safe integer cents, edits/cancellation, daily corrections,
provenance, year selection and error recovery. Reviewed desktop/mobile screenshots.
Browser test booking cancelled; bar fixtures do not write live sales. Docker app was
rebuilt and passed readiness. T075–T077 complete. T041 remains open for country/type/
season rankings, occupancy and inventory; satisfaction and user-deferred Tableau
remain unfinished. This increment does not claim full-feature convergence.


## Current convergence: reporting and questionnaires — 2026-11-03

US5–US17/US19 reporting and operational workflows are now implemented for the confirmed
rules and supplied catalog. Completed optional-year summary/country/type-season/room
endpoints, fixed annual occupancy, inventory and annual drink-report alias. Overview
uses API-calculated indicators and expandable tables; all-year scope is explicitly
labelled and never divided by one annual denominator. Country people are deduplicated
by booking and propagate unknown counts while retaining a known subtotal. Saved nightly
charges reconcile by season/country/room without repricing or duplicating group bookings.
Equal revenue rows remain equal; name/number ordering is only stable presentation.

Room questionnaire entry/reporting now exists through separate data/service/HTTP layers.
Startup adds only an empty table, with no generated scores. Transactional booking-row
locking validates active room membership against concurrent booking edits/cancellation.
Original room links survive edits, cancelled bookings are excluded, response-free rooms
show null and means display one decimal. Financial year does not filter the explicitly
all-time questionnaire view. Each POST is a distinct questionnaire; correction and
repeated-questionnaire policy remain open rather than silently enforcing a limit.

Evidence: 33 isolated PostgreSQL/API tests passed, including Excel country/season/room
reconciliation, count separation, exact amounts, cross-year/multi-room allocations,
unknown guest data, inventory invariance, feedback validity, means and repeat-start
persistence. Seven Chrome browser scenarios verified, with a targeted passing rerun
after a questionnaire accessible-label fix. Reviewed desktop/mobile reports and feedback
screenshots; error recovery and selected-year/all-year scope verified. Docker app
rebuilt and healthy. Browser feedback/bar calls use fixtures rather than live writes;
its own temporary booking is cancelled. Reporting reads never mutate source evidence.

Reconciled T021–T032, T034–T035, T041/T043/T045 and T078–T082
with completed phases. The five constitution principles remain satisfied. Served OpenAPI
is updated; corresponding reporting/feedback paths in the design contract are synced.

Remaining: US18/T033/T046 Tableau dashboard/connector/refresh are user-deferred. T037/
T044 retain missing wine/beer menu input, unresolved zero-denominator/half-way rounding
and formal business tie numbering if later requested; current UI exposes undefined
percentages and equal values explicitly. No missing products, guests, ratings or rank
rules are invented. Full project acceptance and the Tableau deliverable are not claimed.
GitHub publication and presentation preparation are not performed by this implementation.


## Interactive country revenue map — 2026-11-03

Implemented user-requested country-report choropleth using the existing scoped API.
Locally bundled Natural Earth polygons and explicit ISO3 aliases cover all 21 approved
country names. Deep/pale blue encodes the selected period's max/min room revenue, with
labelled linear legend and equal-value colors. No-record countries are neutral; recorded
zero remains data. Selection exposes all country metrics without inventing missing guest
counts. Hover/focus, tap/click, dropdown, keyboard zoom/pan, drag/reset and mobile layout
are supported. A closed data disclosure retains the accessible table. Missing geometry
opens fallback figures and supports retry; API failure clears stale colors/details.
Unmapped country names remain available in selection/details/table.

9 browser scenarios passed, plus targeted actual-drag verification. Reviewed desktop/
mobile screenshots. Source attribution/checksum recorded locally; no external map
requests, API changes or database migrations. T083–T085 complete. Other report visual
conversions and deferred Tableau integration are not claimed by this first map increment.

The focused map rerun passed after preventing pointer-induced focus from selecting a
country during drag. Actual mouse drag changes the zoomed transform while retaining
the selected country; ordinary click and keyboard selection still pass.


## Seasonal room-revenue bar chart — 2026-11-03

Implemented the user's requested grouped bar chart with Revenue (DKK) on the y-axis and
seasons on the x-axis. Eight fixed blue series match the map palette's light/deep ends;
color identifies room type while height encodes saved room revenue. Existing year scope,
nightly/season attribution and API calculations are preserved. Checkboxes filter visible
series without changing period scale; hover/focus/selection shows source values/counts.
Null amounts do not become zero bars; recorded zero has a baseline dot. Stale bars clear
on loading/error and empty states are explicit. Local native SVG supports keyboard
interaction and horizontal scrolling on mobile. Original table remains as a disclosure.

10 browser scenarios passed, including the new chart-value/filter/edge-case flow and
retained country-map, booking/bar/history/questionnaire workflows. Desktop/mobile
screenshots reviewed. No backend, contract, schema or data changes; API/SQL suites not
repeated. T086–T087 complete. Other report visual conversions and Tableau remain outside
this particular presentation increment.


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

Satisfaction styling follow-up: deep-blue header, pale-blue alternating rows and blue
text/borders applied. Existing Overview browser flow passed; screenshot reviewed.
CSS only; ratings and missing-data behavior unchanged.


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

Eight-color chart amendment: each room type now has a distinct stable categorical color
matching its legend swatch across seasons. Existing chart browser scenario passed,
including eight unique legend colors, value/filter behavior and mobile layout. Desktop
screenshot reviewed. No financial/API/database changes. T095 complete.

Palette refinement: replaced saturated room-type colors with coordinated muted sage,
forest, teal, slate, mauve, rose, clay and sand. Eight distinct stable legend/series colors
remain. Existing seasonal chart browser flow passed and desktop screenshot reviewed.
No data, API or financial behavior changes.

Seasonal numeric table refinement: one shared roomTypePalette.js now supplies exact
chart/legend/table colors. Rows use a pale tint with an exact-color left border, larger
text/revenue figures and more padding. All 24 rows use page scrolling instead of an
internal height limit; mobile keeps horizontal table scrolling. Two existing report/
chart browser flows passed, including shared-color equality, API values and responsive
layout. Table screenshot reviewed. No backend, database or financial changes. T096 complete.

Revenue hover readability: replaced native SVG titles with a large HTML detail box,
24px type/28px amount and 16px secondary text, using the room type's accent. Position
is constrained to the viewport and chart width. Hover, focus/click and Escape work;
filter/refresh removes stale tooltips. Below-chart detail text is larger too. Existing
chart browser scenario passed, including actual hover, visible value/font-size checks,
keyboard dismissal and mobile layout; tooltip screenshot reviewed. No data/API changes.
T097 complete.

Highest-earning rooms now defaults to ten recorded-revenue rooms as horizontal bars,
retaining exact API ordering and the shared room-type palette. Visible room/type, revenue
and room-night values need no hover. Show all rooms exposes all 214 entries in a scroll
region; Show top 10 restores the default. Missing revenue is labelled No data and zero
uses a baseline marker. Refresh/error clears stale bars. Existing Overview browser flow
passed, including API-ordered IDs/amounts, 10→214→10 toggling and responsive layout.
Desktop/mobile screenshots reviewed. No API/database changes. T098 complete.


## Main/feature integration — 2026-11-03

Integrated main's booking-holder email requirement with the feature branch's latest
room charts, shared palette, large hover details and numeric-table styling. Preserved
both task sets; email tasks now use T099–T101/Phase 42 to avoid collisions with existing
T096–T098. Updated the README booking request to include the newly required email.
The only textual merge conflict was in tasks.md; frontend/backend changes were reviewed
and retained together. No feature was replaced wholesale with one branch's version.

Validation: 12 pure tests, 37 isolated PostgreSQL/API tests and all 10 Chrome browser
scenarios passed on the merged tree. Checks include email validation/storage/editing,
imported bookings without email, retained 2026 history/migration behavior, booking
create/edit/cancel, shared chart/table colors, room top-ten/all toggle, large tooltips,
country map and bar/questionnaire flows. Docker app rebuilt and healthy. Source records
are not given fabricated emails. Browser verification booking cancelled; sales and
questionnaire UI fixtures do not write live values.


## Full-width Overview dashboard — 2026-11-04

Overview now uses a near-full-width shell with a compact fixed-2026 toolbar and a row
of revenue, active-booking, occupancy, room-night and guest cards. Revenue receives a
strong green visual emphasis while the warm hotel palette and existing report colors
remain. Wide screens use independent main/sidebar columns: map, seasonal chart and
seasonal data in the main column; room top-ten/all, inventory, satisfaction and source
references in the sidebar. Source metadata no longer separates headline figures from
charts. All charts/tables stay open and every existing data/control ID remains available.
Tablet/mobile layouts stack reports and adapt KPI cards. Styling is scoped to Overview.
No calculations, APIs, database records or other staff page flows changed.

Verification: seven relevant existing Chrome browser scenarios passed (staff navigation,
history, annual/report null/zero/error recovery, map interaction/fallback and seasonal
chart values/filters/hover). Top-ten/all toggle remains covered in Overview checks.
Visual QA at 1920, 1440, 1024, 390 and 320px confirmed no page-wide horizontal overflow.
Reviewed wide/desktop/tablet/mobile screenshots; a focused final rerun verified the
smallest mobile revenue fits one line after a typography adjustment. Docker rebuilt
and healthy; git diff --check passed. T102–T103 complete. No API/SQL suites repeated
for this DOM/CSS presentation change.
