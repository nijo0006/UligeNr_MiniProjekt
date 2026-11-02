# Quickstart and Validation

Status: booking maintenance (US1–US4) is implemented. Reporting, bar sales, satisfaction
and historical import are still pending. Tableau integration is deferred to the user.

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
