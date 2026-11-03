# Contributing

Read `.specify/memory/constitution.md`, the feature specification, plan, and task list
before changing behavior. Implement one task or a small related group at a time.
Keep HTTP handling, business logic, and SQL in their respective layers. Do not invent
undecided business rules, generate historical satisfaction scores, or select a Tableau
connector while that work is user-deferred.

Use `docker compose up` for the normal local runtime. Host Node/npm is needed only if
you choose to develop or run pure tests outside containers; application runtime is
Node 24 in a pinned image. PostgreSQL and Node image digests and dependency lockfile are
committed for repeatability. Keep `.env`, `node_modules`, test outputs and credentials
out of commits. Never delete the application volume to make a test pass.

Run `npm test` from `backend/` after pricing/validation changes and the isolated
Compose integration suite after SQL, lifecycle, route or contract changes. Update
`backend/openapi.json` with implemented interfaces and verify Swagger UI. The future
contract under `specs/` must not be presented as if every endpoint already exists.
Use `npm run test:browser` for booking UI changes with a local Chrome installation.
Record verification and remaining gaps in the convergence report; do not mark a
whole-feature quality checklist complete based only on the booking MVP.

Include focused commits with task/story references. Review source changes before
committing; publishing, pushing and deployment are separate actions.
