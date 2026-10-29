# Planned Quickstart and Validation

Status: future validation guide. There is no application or Compose file implemented yet;
the commands and endpoints below are design targets, not instructions for running a
finished program. Tableau integration is deferred to the user.

## Host prerequisites

Git, Docker with the Compose plugin, and a browser. No host Node, npm, or MySQL is required.
First build may download images/packages. Tableau Public Edition is a separate host tool;
no automatic install, connector, publishing, or refresh setup is promised.

## Clean-clone acceptance

From the cloned repository root, `docker compose up` must build/start the normal services,
wait for database health, migrate and seed automatically, and expose these planned URLs:

- `http://localhost:3000/` — browser frontend
- `http://localhost:3000/api/health` — readiness; ready only after required initialization
- `http://localhost:3000/api/openapi.json` — JSON API contract
- `http://localhost:3000/api/docs` — Swagger UI

No .env copy, host npm install, manual schema creation, or separate seed command is allowed
for the standard local path. Document local-only defaults and port changes in the README.

## End-to-end checks after implementation

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

Plan `node --test` for business tests and the same runner for MySQL integration tests
inside a Compose test profile. Browser tests use a separate optional test service;
ordinary startup does not run test suites or require browser tooling on the host.
Pin exact test/package versions during implementation. Contract validation must exercise
all operations and errors, including stale versions, missing bookings, room conflicts,
nullable source guest counts, and rejection of client-supplied prices.

Do not claim the full feature passes while the independent business gaps in research.md
or Tableau end-to-end connection and refresh remain unresolved. No tests were run against
an application during planning because that application does not exist yet.
