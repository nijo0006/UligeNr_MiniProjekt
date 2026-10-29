# Technical Research: Hotel Operations

Date: 2026-10-29. Scope: independent application/API planning; Tableau research is deferred.
Status: technical choices below are resolved. Business/UI gaps listed at the end remain open;
this is not a claim that the complete feature is ready for implementation.

## Runtime and HTTP layer

**Decision**: Node.js 24 LTS, Express 5, native JavaScript ES modules. Serve the plain
HTML/CSS/JavaScript frontend with Express static middleware from the application
container; browser fetch requests use the same origin and `/api` prefix.
**Rationale**: Matches the team's language choice without a frontend build framework,
separate frontend server, or required host Node installation. Node 24 remains supported
LTS; it is deliberately not described as the newest LTS.
**Alternatives considered**: Node 26 LTS, native HTTP routing, separate static-file container,
and a frontend framework. The smaller stack is sufficient for the prototype.
Select exact dependency patches, image tags/digests, and a lockfile before implementation;
no dependency/image compatibility is claimed to have been installed or tested yet.
Sources: [Node releases](https://nodejs.org/en/about/previous-releases),
[Express requirements](https://expressjs.com/en/starter/installing/),
[static files](https://expressjs.com/en/5x/starter/static-files/).

## SQL and money

**Decision**: MySQL 8.4 LTS, InnoDB, mysql2 promise driver with prepared statements and
one acquired connection per transaction. Represent exact monetary values as decimal
strings at the API boundary and integer ore during calculations. MySQL stores amounts
as DECIMAL; do not enable driver conversion that loses decimal precision. Format one
decimal for the user as requested; preserve exact source amounts internally.
**Rationale**: Direct SQL keeps the data layer understandable; money must reconcile
against source totals and generated nightly/daily allocations.
**Alternatives considered**: MySQL 9.7 LTS and an ORM. Neither is necessary for this scope.
Sources: [MySQL release model](https://dev.mysql.com/doc/refman/9.7/en/mysql-releases.html),
[mysql2 prepared queries](https://sidorares.github.io/node-mysql2/docs/examples/queries/prepared-statements/select),
[driver decimal handling](https://sidorares.github.io/node-mysql2/docs/documentation).

## Availability and stale edits

**Decision**: Enclose all booking mutations and affected room allocations in one
transaction. Lock an existing booking when editing/cancelling, compare its version,
and lock affected old/new room rows in ascending room-number order before checking
availability. Every write path must follow this protocol. Use current reads under
READ COMMITTED; do not depend on an earlier snapshot. Reject an overlap when
`newArrival < existingDeparture AND newDeparture > existingArrival`, excluding the
booking being edited and cancelled records. Revalidate before commit.
Versioned updates reject stale clients without overwriting. Deadlock handling rolls
back and retries a bounded number of complete transactions; retry is not duplicate
creation detection or an external request-idempotency feature.
**Rationale**: Locking only existing overlaps fails when no conflicting row exists yet;
locking room rows serializes competing reservations. A version check inside the same
transaction implements the approved first-save-wins rule.
**Alternatives considered**: Unlocked check-then-insert, last-write-wins, or introducing
a distributed lock service. Reject the first two as inconsistent with approved behavior.
Sources: [locking reads](https://dev.mysql.com/doc/refman/8.4/en/innodb-locking-reads.html),
[isolation](https://dev.mysql.com/doc/refman/8.4/en/innodb-transaction-isolation-levels.html),
[conditional updates](https://dev.mysql.com/doc/refman/8.4/en/update.html),
[deadlock handling](https://dev.mysql.com/doc/refman/8.4/en/innodb-deadlocks-handling.html).

## Containers and initialization

**Decision**: Two normal services: `app` and `db`. The app serves browser assets, REST
JSON, an OpenAPI document, and Swagger UI. MySQL has a named volume and healthcheck;
Compose waits for database health. The application startup runs versioned migrations
and seed reconciliation before it reports readiness. Record applied seeds so ordinary
restarts never re-import source totals or overwrite later booking/bar edits. A startup
failure must fail visibly, not report a partially initialized application as healthy.
Bind the browser/API port to localhost; use the private Compose network for SQL.
Provide local-only defaults so a clean clone needs no manually created .env file.
**Rationale**: Meets clone plus `docker compose up`; host tools and manual SQL steps
would undermine that requirement. The modern command spelling is the user's explicit
choice; the constitution's original hyphenated spelling expresses the same workflow.
**Alternatives considered**: Manual migration/seed commands or extra frontend/Swagger
containers. No advantage for this prototype.
Sources: [Compose readiness](https://docs.docker.com/compose/how-tos/startup-order/),
[service conditions](https://docs.docker.com/reference/compose-file/services/).

## Documentation and tests

**Decision**: Maintain an OpenAPI 3.0.3 JSON document, rendered by locally packaged Swagger
UI. Use Node's built-in test runner and assertions, real MySQL integration tests inside
Compose, and a separate optional browser-test service using Playwright. No tests execute
as part of ordinary startup. Validate the contract against request/response fixtures
and run actual create/edit/cancel/concurrency and source-reconciliation scenarios.
**Rationale**: Tests should exercise behavior and race conditions, not mirror the source.
**Alternatives considered**: A larger application framework or a host-only test setup.
Sources: [Node test runner](https://nodejs.org/api/test.html),
[OpenAPI 3.0.3](https://spec.openapis.org/oas/v3.0.3),
[Swagger UI](https://swagger.io/tools/swagger-ui/),
[Playwright Docker guidance](https://playwright.dev/docs/docker).

## Generation and import

Keep raw workbook evidence immutable. Choose deterministic input-order placement of
booking records across the approved 2024–2026 horizon, checking season, nights, room
type, and overlap constraints, and report impossible placements. Persist generated
assignments with source IDs and a generator version, so restarting does not regenerate
all dates. Preserve historical totals; do not apply the new tariff to source bookings.
Daily bar generation distributes integer per-drink quantities deterministically over
the approved dates; retain source unit prices and reconcile exact totals. Raw aggregates
are lineage, not additional reportable sales. Satisfaction data are not generated.
This algorithm choice is engineering detail within the authorized synthetic-data scope;
it does not assert any actual historical date, room assignment, or missing person count.

## Unresolved gates

- R3: final selectable-night controls and any approved upper limit are not supplied.
  Do not invent a maximum stay while designing the API.
- R4: historical guest counts are absent. Keep them unknown and preserve approved null
  behavior; do not seed a fictional person count.
- R7: ranking tie presentation remains undecided. The extra duplicate-submission feature
  is declined; no idempotency key or special disabled-save behavior is planned.
- R8: valid quantity controls and actual wine/beer catalog/prices remain unspecified.
  Category support does not authorize invented menu entries.
- R9: Tableau connection/refresh is user-owned and deferred. No exporter, cloud publishing,
  connector, or refresh schedule is selected here.
- R10: zero denominators with records and half-way rounding remain open. Preserve exact
  amounts and avoid committing a business rounding policy by accident.

Independent draft design artifacts can be reviewed now. These open items must not be
marked resolved merely because the technical stack has been selected. No application
implementation or completed end-to-end validation is claimed by these documents.
