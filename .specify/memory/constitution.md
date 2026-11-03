<!--
Sync Impact Report — 2026-11-02
- Version: 1.0.0 -> 2.0.0.
- Principle IV: MySQL replaced by PostgreSQL, authorized by the user following
  Tillægsopgave_uge_2.pdf. Other four principles unchanged; no principles added.
- Synchronized plan, research, data model, README, environment example and Compose.
- Previous implementation preserved at Git tag uge-1-mysql-demo-2026-11-02.
-->

# Hotel Kong Arthur Constitution

## Core Principles

### I. Three-Layer Architecture

The backend MUST use a three-layer architecture consisting of a presentation
layer exposing the REST API, a business logic layer, and a data layer.

### II. REST API with JSON

The system MUST expose a REST API using JSON as its data exchange format.

### III. OpenAPI Contract and Swagger UI

The API contract MUST be delivered as an OpenAPI specification and MUST be
viewable in Swagger UI.

### IV. PostgreSQL Database

The system MUST use PostgreSQL as its database.

### V. Docker and Single-Command Startup

All system components MUST run in Docker containers. The complete system MUST
be startable with a single `docker-compose up` command.

## Governance

Specifications, plans, and implementation reviews MUST check compliance with
these five principles. Amendments MUST be recorded in this document with an
updated version and amendment date. Versioning follows semantic versioning:
major for incompatible principle changes or removals, minor for additions,
and patch for clarifications.

**Version**: 2.0.0 | **Ratified**: 2026-10-26 | **Last Amended**: 2026-11-02
