<!--
Sync Impact Report
- Version: unversioned scaffold -> 1.0.0 (initial adoption of five fixed principles).
- Modified principles: five template placeholders replaced with principles I-V below.
- Added sections: Core Principles and Governance populated.
- Removed sections: System Requirements and unused optional template sections.
  Purpose, KPI, and Tableau requirements are outside the requested five principles.
  Programming language selection is deferred to Plan.
- Deferred items: The assignment "E26 Tværfaglig Opgave Hotel Kong Arthur" was not
  found in the project folder; the principles use the user's explicit instructions.
- No unresolved template placeholders remain.
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

### IV. MySQL Database

The system MUST use MySQL as its database.

### V. Docker and Single-Command Startup

All system components MUST run in Docker containers. The complete system MUST
be startable with a single `docker-compose up` command.

## Governance

Specifications, plans, and implementation reviews MUST check compliance with
these five principles. Amendments MUST be recorded in this document with an
updated version and amendment date. Versioning follows semantic versioning:
major for incompatible principle changes or removals, minor for additions,
and patch for clarifications.

**Version**: 1.0.0 | **Ratified**: 2026-10-26 | **Last Amended**: 2026-10-26
