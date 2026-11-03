# Tasks: Hotel Operations and Performance Insights

**Current status — 2026-11-03**: Booking, history import, operational/reporting APIs,
bar workflows, staff frontend and room questionnaires are implemented and verified.
Tableau remains user-deferred (T033/T046). T037/T044 retain unresolved business/input
boundaries; neither complete project acceptance nor a Tableau dashboard is claimed.
Phase 31 reconciles older unchecked bar/report tasks with the implemented code.

**Input**: spec.md, plan.md, research.md, data-model.md, contracts/openapi.json.
**Execution scope**: Start with the confirmed booking MVP (US1–US4 and foundations),
then verify and converge that slice. Wider reporting/bar/import tasks remain visible.
The user authorized starting this sequence with the existing quality checklist still
13/16; do not silently mark its unresolved requirements as reviewed or complete.
Tableau is explicitly deferred by the user. No hooks are configured.

**Format**: unchecked = not completed; [US#] maps to specification story. Each path is
relative to repository root. Test tasks exercise stated acceptance behavior.

## Phase 1: Setup

- [x] T001 Create the JavaScript package and pinned dependency lock in backend/package.json and backend/package-lock.json.

- [x] T002 Add the app container, readiness checks, persistent database and clean-clone local defaults in Dockerfile, docker-compose.yml and .env.example; preserve host MySQL port 3307.

- [x] T003 Exclude dependencies and credentials in .gitignore and .dockerignore.

## Phase 2: Foundational

- [x] T004 Create versioned booking migrations in backend/src/startup/schema.sql: immutable ID, active/cancelled state, version, multiple rooms and exact nightly charges.

- [x] T005 Seed 214 unique rooms, eight types, approved source countries and all 24 tariff cells once in backend/src/startup/initialize.js; do not invent historical bookings or survey responses in this slice.

- [x] T006 Implement one-connection transactions and sorted room row locks in backend/src/data/bookingRepository.js; reject overlapping active stays and exclude the current booking on edit.

- [x] T007 Serve static frontend, JSON errors, readiness and Swagger UI in backend/src/presentation/app.js; expose implemented operations separately from the full future draft contract.

- [x] T008 Add meaningful date/pricing unit tests in backend/tests/pricing.test.js and MySQL/API integration cases in backend/tests/bookings.integration.test.js.

## Phase 3: User Story 1

**Independent validation**: Use the acceptance scenarios for Story 1 in spec.md with known fixtures.

- [x] T009 [US1] Implement date validation, automatic departure and each night’s seasonal prices in backend/src/services/pricing.js; verify 2491.00 for Standard Single across May/June.

- [x] T010 [US1] Implement create, read, list and room availability services in backend/src/services/bookingService.js with no manual price override or guest-capacity limits.

- [x] T011 [US1] Expose catalog, room availability, POST /api/bookings and read routes in backend/src/presentation/bookingRoutes.js using the implemented OpenAPI request fields.

- [x] T012 [US1] Build an accessible booking form, date picker, room-type/room selectors and saved-booking list in frontend/index.html, frontend/app.js and frontend/styles.css; refresh after save, no login or extra duplicate-submission feature.

- [x] T013 [US1] Verify browser creation, seasonal totals, overlapping/concurrent room requests, adjacent stays, invalid dates/unknown fields and persistence in backend/tests/bookings.integration.test.js.

## Phase 4: User Story 2

**Independent validation**: Use the acceptance scenarios for Story 2 in spec.md with known fixtures.

- [x] T014 [US2] Implement versioned booking edits in backend/src/services/bookingService.js and backend/src/data/bookingRepository.js; preserve ID, reject stale saves and revalidate old/new rooms atomically.

- [x] T015 [US2] Add edit/reload interactions to frontend/app.js with automatic departure/pricing and conflict messages.

- [x] T016 [US2] Verify stale edit preservation, reload/resubmit, multi-room rollback and rejected price/ID overrides in backend/tests/bookings.integration.test.js.

## Phase 5: User Story 3

**Independent validation**: Use the acceptance scenarios for Story 3 in spec.md with known fixtures.

- [x] T017 [US3] Implement cancellation with retained identity and repeat-cancellation no-op semantics in backend/src/services/bookingService.js and backend/src/data/bookingRepository.js.

- [x] T018 [US3] Add browser confirmation and cancellation refresh in frontend/app.js; unknown IDs return Booking not found.

- [x] T019 [US3] Verify cancelled rooms become available and repeat cancellation/unknown IDs cause no second mutation in backend/tests/bookings.integration.test.js.

## Phase 6: User Story 4

**Independent validation**: Use the acceptance scenarios for Story 4 in spec.md with known fixtures.

- [x] T020 [US4] Validate browser/API parity and publish only working endpoints in backend/openapi.json while preserving the full future design in specs/001-hotel-operations/contracts/openapi.json.

## Phase 7: User Story 5

**Independent validation**: Use the acceptance scenarios for Story 5 in spec.md with known fixtures.

- [x] T021 [US5] Implement next-request reporting freshness and accepted booking contributions in backend/src/services/reportService.js, with contract coverage for /api/reports/summary.

## Phase 8: User Story 6

**Independent validation**: Use the acceptance scenarios for Story 6 in spec.md with known fixtures.

- [x] T022 [US6] Implement holder-country booking and guest counts in backend/src/services/reportService.js; unknown historical person counts remain null rather than guessed.

## Phase 9: User Story 7

**Independent validation**: Use the acceptance scenarios for Story 7 in spec.md with known fixtures.

- [x] T023 [US7] Implement room-type/season revenue from per-night charges in backend/src/services/reportService.js without duplicating whole multi-room totals.

## Phase 10: User Story 8

**Independent validation**: Use the acceptance scenarios for Story 8 in spec.md with known fixtures.

- [x] T024 [US8] Implement country room revenue in backend/src/services/reportService.js; exclude bar revenue and use the holder country.

## Phase 11: User Story 9

**Independent validation**: Use the acceptance scenarios for Story 9 in spec.md with known fixtures.

- [x] T025 [US9] Implement individual-room revenue ranking in backend/src/services/reportService.js; do not invent unapproved ranking tie presentation.

## Phase 12: User Story 10

**Independent validation**: Use the acceptance scenarios for Story 10 in spec.md with known fixtures.

- [x] T026 [US10] Implement country revenue ranking in backend/src/services/reportService.js; preserve equal amounts and defer rank presentation if undecided.

## Phase 13: User Story 11

**Independent validation**: Use the acceptance scenarios for Story 11 in spec.md with known fixtures.

- [x] T027 [US11] Implement annual combined room/bar totals in backend/src/services/reportService.js with each occupied night allocated to its own calendar year.

## Phase 14: User Story 12

**Independent validation**: Use the acceptance scenarios for Story 12 in spec.md with known fixtures.

- [x] T028 [US12] Implement occupancy using sold room-nights / (214 × 365) in backend/src/services/reportService.js; cancelled bookings excluded.

## Phase 15: User Story 14

**Independent validation**: Use the acceptance scenarios for Story 14 in spec.md with known fixtures.

- [x] T029 [US14] Implement inventory counts from the room fixture in backend/src/services/reportService.js; booking changes must not alter the 214-room stock.

## Phase 16: User Story 15

**Independent validation**: Use the acceptance scenarios for Story 15 in spec.md with known fixtures.

- [x] T030 [US15] Implement annual bar revenue and units in backend/src/services/barService.js, including non-resident sales without a booking link.

## Phase 17: User Story 16

**Independent validation**: Use the acceptance scenarios for Story 16 in spec.md with known fixtures.

- [x] T031 [US16] Implement drink revenue and the four approved categories in backend/src/services/barService.js; actual wine/beer catalog entries remain an open input.

## Phase 18: User Story 17

**Independent validation**: Use the acceptance scenarios for Story 17 in spec.md with known fixtures.

- [x] T032 [US17] Implement cocktail/coffee percentages in backend/src/services/barService.js using only combined cocktail/coffee revenue; do not invent unresolved zero-denominator rules.

## Phase 19: User Story 18

**Independent validation**: Use the acceptance scenarios for Story 18 in spec.md with known fixtures.

- [ ] T033 [US18] Implement Tableau delivery only after the user selects the integration in specs/001-hotel-operations/plan.md; no exporter or cloud connector is currently selected (DEFERRED).

## Phase 20: User Story 19

**Independent validation**: Use the acceptance scenarios for Story 19 in spec.md with known fixtures.

- [x] T034 [US19] Implement one effective date/drink quantity with replace-on-correction in backend/src/services/barService.js and frontend/bar.js; preserve prices and avoid double-counting.

## Phase 21: User Story 13

**Independent validation**: Use the acceptance scenarios for Story 13 in spec.md with known fixtures.

- [x] T035 [US13] Implement receptionist questionnaire entry for a booking/room in backend/src/services/satisfactionService.js and frontend/satisfaction.js; 1–5 mean, one decimal, null without responses, no invented historical ratings.

## Phase 22: Polish and remaining feature gates

- [x] T036 Implement approved deterministic historical booking/bar enrichment in backend/src/startup/import.js with immutable lineage, source totals and synthetic labels; preserve raw workbook evidence.

- [ ] T037 Complete unresolved R3/R4/R7/R8/R10 choices in specs/001-hotel-operations/spec.md before implementing their dependent selectors, ranking, missing-data and rounding behavior.

- [x] T038 Document first-slice startup, layer responsibilities, API examples, contribution steps and deferred features in README.md and CONTRIBUTE.md.

- [x] T039 Verify clean-clone startup with no .env using an isolated Compose project, unit/API tests, browser smoke and restart persistence in specs/001-hotel-operations/quickstart.md.

- [x] T040 Run Spec Kit convergence against all stories and record the implemented booking slice and remaining gaps in specs/001-hotel-operations/converge.md without marking the whole hotel feature complete.

## Dependencies and execution strategy

Setup → foundations → US1 booking creation/read → US2 versioned edits → US3 cancellation
→ US4 API parity → first-slice validation and convergence. Reporting (US5–US12, US14)
can use independent SQL fixtures after foundations; bar (US15–US17, US19) needs its own
schema/services; satisfaction (US13) needs known bookings/rooms. US18 is user-deferred.
The static frontier and pure pricing tests can be prepared independently of SQL setup,
but shared service/router files must be edited sequentially. This is not authorization
to delegate agents; [P] is omitted where paths overlap.

MVP: automatic initialized rooms/rates/countries, booking creation in browser/API,
retrieval and availability, then edits/cancellation. No historical workbook import,
bar, reporting dashboard, or satisfaction data is claimed until its task is completed.
Exact data-model constraints are referenced at the entity and service tasks; do not
add login, guest capacity or duplicate-specific submission handling.

## Phase 23: Convergence

Review scope: 26 functional requirements, 19 stories, seven success criteria, five constitution principles, and the architecture, contract, persistence, startup and test decisions. No constitution contradiction was found in the implemented booking slice. Findings: four missing areas and two partial areas; four HIGH and two MEDIUM. The full feature is not converged.

- [x] T041 Implement and verify the missing operational reporting portion of backend/src/services/reportService.js per FR-007–FR-014, FR-016, FR-022, US5–US12, US14 and T021–T029; verify fresh contributions, country attribution, nightly/year allocation, rankings, occupancy and inventory counts (implemented and verified in Phases 26–31).
- [x] T042 Implement historical booking/bar import in backend/src/startup/import.js per FR-021, SC-002 and T036; preserve source totals and lineage, label synthetic dates/room allocations, prevent overlaps and double-counting (implemented and verified in Phases 26–31).
- [x] T043 Implement daily bar entry and reports in backend/src/services/barService.js and frontend/bar.js per FR-017–FR-019, FR-025–FR-026, SC-006, US15–US17, US19 and T030–T034; verify replace-on-correction and non-resident sales (implemented and verified in Phases 26–31).
- [ ] T044 Complete the unresolved dependent business choices in spec R3/R4/R7/R8/R10 and T037 before claiming full-feature acceptance; preserve already approved choices and do not invent missing historical person counts or menu items (partial; HIGH).
- [x] T045 Implement room-linked satisfaction entry and reporting in backend/src/services/satisfactionService.js and frontend/satisfaction.js per FR-015, US13 and T035; verify one-decimal means, null without responses and valid booking/room links (implemented and verified in Phase 31).
- [ ] T046 Complete API-to-Tableau dashboard delivery and matching-value verification per FR-020, US18, SC-005 and T033 only after the user selects the deferred integration; current booking API alone does not satisfy dashboard delivery (partial; MEDIUM; DEFERRED).


## Phase 24: PostgreSQL migration — 2026-11-02

Earlier completed tasks and verification entries describe the original MySQL increment;
this phase supersedes its database choice per Constitution IV v2.0.0 and the user's request.

- [x] T047 Preserve the working MySQL implementation with a Git tag and take a private local data snapshot.
- [x] T048 Replace mysql2, schema, initialization, queries and Docker services with PostgreSQL; preserve the JSON booking contract.
- [x] T049 Update constitution, plan, research and startup documentation; keep the old database volume and transfer existing bookings without changing IDs or prices.
- [x] T050 Verify unit, PostgreSQL integration, migration reconciliation, browser and container-recreation persistence checks, then show the running app visually.


## Phase 25: Annual room revenue — 2026-11-02

This increment completes only the room-revenue part of US11/FR-013 and reporting
freshness for this endpoint; T027/T041 remain open for the wider reporting scope.

- [x] T051 Sum active saved room-night charges by calendar year in backend/src/data/reportRepository.js, preserving exact money and null without data.
- [x] T052 Validate year and expose GET /api/reports/revenue through business/presentation layers; document the implemented JSON contract and errors in backend/openapi.json.
- [x] T053 Show annual room revenue in frontend with year selection and refresh after booking changes; distinguish no data from request failures.
- [x] T054 Verify cross-year/multi-room amounts, edit/cancel freshness, exact decimal sums, invalid years and the frontend flow using isolated PostgreSQL and browser checks.
- [x] T055 Update README, plan, quickstart and verification evidence without marking combined room/bar reporting or historical import complete.


## Phase 26: Guest and staff frontends — 2026-11-02

- [x] T056 Add a guest booking entry point with automatic prices, room availability and own-booking confirmation; never load internal booking lists or reports.
- [x] T057 Move booking management and annual room revenue to /staff; share form behavior without duplicating booking rules.
- [x] T058 Add source-backed drink catalog initialization and daily bar sales storage without generating historical sales or wine/beer products.
- [x] T059 Implement daily quantity replacement and annual bar/drink/category reports through three backend layers and OpenAPI; keep unresolved zero-denominator behavior explicit.
- [x] T060 Build Helene Christine's staff bar overview and daily closing form, showing revenue, units and cocktail/coffee comparison from the API.
- [x] T061 Verify guest-to-staff booking flow, API isolation in guest requests, staff lifecycle, daily corrections and bar reporting; inspect desktop/mobile visuals.
- [x] T062 Update specification, plan, README and verification evidence; document the existing no-login prototype boundary and pending historical data.


## Phase 27: Historical Excel import — 2026-11-02

- [x] T063 Extract and validate original workbook rows, source checksums, 1,000 bookings/5,379 nights and the exact room/bar control totals without modifying Excel.
- [x] T064 Implement deterministic season/type/availability-correct booking placement and dated bar quantity distribution across 2024–2026, preserving existing operational data.
- [x] T065 Import once transactionally with immutable lineage, source-preserved prices and unknown guest counts; verify rollback and restart preservation.
- [x] T066 Expose import/provenance metadata, make history visible and searchable by year on staff frontend, and retain valid editing/cancellation behavior.
- [x] T067 Verify isolated unit/API tests, live pre-existing-record preservation, browser history flow, source controls and restart idempotence; update documentation.


## Phase 28: Staff home and separate workspaces — 2026-11-03

US20 and the guest entry point from Phase 26 are retired at the user's request.

- [x] T068 Remove guest booking page/controller and replace the landing page with three accessible icon links to staff workspaces.
- [x] T069 Split Overview, Bookings and Helene’s bar into separate HTML/JS entry points with common staff navigation and responsive layouts.
- [x] T070 Preserve booking CRUD, historical search/filter/pagination, annual room reports and bar reporting/registration; isolate page-specific data requests.
- [x] T071 Verify HTTP routes, retired guest URLs, browser navigation and retained workflows; inspect desktop/mobile visuals and update documentation.


## Phase 29: Official room imagery and hotel styling — 2026-11-03

- [x] T072 Store the eight official room-type photos, header wordmark and available Barlow fonts locally with exact source mapping, attribution and font license.
- [x] T073 Add accessible photo selection to the existing booking type filter and apply the reference typography/palette across staff pages without changing booking rules.
- [x] T074 Verify image/font loading, all eight type selections and retained browser workflows; review desktop/mobile screenshots and document the result.


## Phase 30: Combined annual hotel revenue — 2026-11-03

- [x] T075 [US11] Extend annual revenue repository/service/API with independent room/bar aggregates, exact combined total, null/zero distinction and either-source provenance.
- [x] T076 [US11] Document the additive annual JSON response in served OpenAPI and display total plus room/bar components on Overview.
- [x] T077 [US11] Verify isolated API and browser behavior, preserve source/user data and document convergence without claiming remaining reports or Tableau complete.


## Phase 31: Remaining reports and room satisfaction — 2026-11-03

- [x] T078 Implement optional-year summary, holder-country counts/revenue, type/season revenue, sorted room revenue and inventory report APIs with provenance and exact money.
- [x] T079 Add persistent room-linked questionnaire storage, transactional validation and entry/report APIs without generating responses.
- [x] T080 Show remaining API-calculated indicators in expandable Overview sections and add questionnaire entry on Bookings; preserve staff navigation and styling.
- [x] T081 Update served OpenAPI/data-model documentation and verify report/feedback API, source reconciliation, repeat startup and browser desktop/mobile flows.
- [x] T082 Reconcile completed reporting/bar/satisfaction tasks and final convergence; retain explicit Tableau and unresolved-input boundaries.


## Phase 32: Interactive country revenue map — 2026-11-03

- [x] T083 Bundle attributed local Natural Earth geometry and map all approved country names explicitly.
- [x] T084 Replace the country table presentation with an interactive blue revenue choropleth, legend, details, keyboard/select/zoom/pan controls and a fallback data disclosure.
- [x] T085 Verify colors, scope changes, missing/zero data, selection, failures and desktop/mobile behavior; update convergence and documentation.


## Phase 33: Seasonal room revenue bar chart — 2026-11-03

- [x] T086 Replace type/season presentation with a grouped blue bar chart, labelled axes, room-type legend/filters, accessible values and retained fallback table.
- [x] T087 Verify API-scoped bar values/heights, null/zero/empty/error states, filters and desktop/mobile layout; document the result.


## Phase 34: Always-visible report cards — 2026-11-03

- [x] T088 Replace report/data disclosures with permanent cards, retain chart/map behavior and verify desktop/mobile visibility using existing browser checks.


## Phase 35: Simple satisfaction table — 2026-11-03

- [x] T089 Add validated type-grouped satisfaction reporting and simplify Overview to eight type/rating rows; preserve missing data and default room reporting, document and verify.


## Phase 36: Correct workbook period to 2026 — 2026-11-03

- [x] T090 Back up existing database and inspect source/manual edits before changing the import period.
- [x] T091 Implement direct 2026 import and transactional one-time legacy correction preserving IDs, source evidence, existing edits and all control totals.
- [x] T092 Update source-period metadata, year controls, provenance labels and authoritative documentation/contracts.
- [x] T093 Verify generation/migration/rollback/restart and browser reporting, apply correction safely and reconcile the live database.


## Phase 37: Fixed Overview year — 2026-11-03

- [x] T094 Remove the year dropdown, display 2026 and verify all Overview reports continue to request 2026 on refresh.


## Phase 38: Distinct room-type colors — 2026-11-03

- [x] T095 Give all eight chart room types distinct stable colors, update legend/copy and verify the existing chart flow visually.


## Phase 39: Booking-holder email requirement (Q1 correction) — 2026-11-03

Q1 is corrected to include the booking holder's email address as a supplied field; Q5 is
clarified so that only prices are excluded from manual entry.

- [x] T096 Correct Q1/Q5, Stories 1–2, FR-001/FR-002 and Key Entities in spec.md; update data model, plan and both OpenAPI contracts with holderEmail.
- [x] T097 Add nullable holder_email column, require and format-validate email for new bookings, and allow imported bookings without email to remain empty on edit.
- [x] T098 Add the email field to the browser booking form and booking list, and extend pricing/integration tests for missing, invalid and imported-without-email cases.
