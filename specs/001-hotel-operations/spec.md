# Feature Specification: Hotel Operations and Performance Insights

**Feature Branch**: No new branch created; no branch hook is configured.

**Feature Directory**: `specs/001-hotel-operations`

**Created**: 2026-10-27

**Status**: Draft — source verification and business definitions pending.

**Input**: Original user description translated into English:

Read the assignment and Excel file in the folder. Describe what the system must do,
without technology choices. Users are the hotel administrator/decision-maker,
receptionist, Helene Christine (bar), and the hotel's existing booking system.
Support creating, editing, and deleting bookings through a browser frontend and
through the API. Update data continuously so indicators reflect current as well as
historical information. Provide guests by country, revenue by room type by season,
revenue by country, highest-earning rooms and countries, annual revenue, and one
additional interesting indicator. For the cocktail bar, provide annual total sales,
revenue per drink, and the percentage split between cocktails and coffee. Supply
data through the API to an interactive Tableau dashboard. Write INVEST user
stories with checkable acceptance criteria. Label anything not established in the
material as an assumption or open question; do not invent business rules.

**Scope update**: At the user’s request, the three standalone stories for the
existing booking system to create, edit, and delete bookings through the API
have been removed, together with their matching requirements. The remaining
stories are numbered 1–15. API delivery of dashboard data remains in scope.

## Source Basis and Scope

- **S1 — Confirmed source**: The user's feature description above and earlier
  explicit project purpose: analyze and present hotel operations data to decision-makers.
- **S2 — Read**: `.specify/memory/constitution.md`, version 1.0.0. Its architecture
  and deployment constraints remain applicable; this specification makes no new
  technology, programming language, framework, storage, or deployment choices.
- **S3 — Unavailable source**: The assignment “E26 Tværfaglig Opgave Hotel Kong Arthur”
  was not found in the project folder or the scanned surrounding project directory.
- **S4 — Unavailable source**: No Excel workbook or CSV dataset was found in that search.
  No column names, sample values, worksheet structure, or calculation rules have been verified.
- Browser frontend, API access, and Tableau are explicit user requirements, not new
  implementation choices. No API routes or contract schemas are prescribed here.
- Scope is booking maintenance, current operational reporting, bar reporting, and
  dashboard data delivery. This document assigns no additional hotel business rules.
- **ASSUMPTION A1**: Priorities P1/P2/P3 are a proposed delivery order, not a priority
  stated in the assignment. All stories remain in scope.

## User Scenarios & Testing *(mandatory)*

Stories use the English translation of “Som <rolle> ønsker jeg <mål>, så <grund>”:
“As a/an <role>, I want <goal>, so that <reason>.” Each story describes one outcome;
small booking stories separate the three browser booking actions. Reporting stories can be
estimated and tested individually against independent fixtures. Their calculation
rules remain negotiable until the open questions are answered; this draft does not
claim those stories are ready for final estimation yet.

### User Story 1 - Create a booking through the browser frontend (Priority: P1)

As a receptionist, I want to create a booking through the browser frontend, so that I can record a new reservation.

**Why this priority**: I can record a new reservation. Priority is proposed under A1.

**Independent Test**: Use an isolated booking fixture through the browser frontend and retrieve the result without requiring the dashboard.

**Acceptance Scenarios**:

1. **Given** booking details accepted under the agreed booking rules, **When** the actor submits the create operation through the browser frontend, **Then** the booking is recorded and can be retrieved with those details.

**Assumptions / Open Questions**: Accepted booking fields, validation, deletion semantics, and access permissions remain open in Q1.

### User Story 2 - Edit a booking through the browser frontend (Priority: P1)

As a receptionist, I want to edit an existing booking through the browser frontend, so that I can keep reservation details up to date.

**Why this priority**: I can keep reservation details up to date. Priority is proposed under A1.

**Independent Test**: Use an isolated booking fixture through the browser frontend and retrieve the result without requiring the dashboard.

**Acceptance Scenarios**:

1. **Given** an existing booking and a change accepted under the agreed booking rules, **When** the actor submits the edit operation through the browser frontend, **Then** the same booking can be retrieved with the changed details.

**Assumptions / Open Questions**: Accepted booking fields, validation, deletion semantics, and access permissions remain open in Q1.

### User Story 3 - Delete a booking through the browser frontend (Priority: P1)

As a receptionist, I want to delete an existing booking through the browser frontend, so that I can remove a booking that should no longer be active.

**Why this priority**: I can remove a booking that should no longer be active. Priority is proposed under A1.

**Independent Test**: Use an isolated booking fixture through the browser frontend and retrieve the result without requiring the dashboard.

**Acceptance Scenarios**:

1. **Given** an existing booking selected for deletion, **When** the actor submits the delete operation through the browser frontend, **Then** the booking is no longer returned as an active booking.

**Assumptions / Open Questions**: Accepted booking fields, validation, deletion semantics, and access permissions remain open in Q1.

### User Story 4 - Keep indicators current (Priority: P1)

As a hotel administrator/decision-maker, I want to see indicators that reflect ongoing changes to operational data, so that I can make decisions using current information.

**Why this priority**: I can make decisions using current information. Priority is proposed under A1.

**Independent Test**: Use a known dataset, record an accepted booking change that affects a reported measure, and compare the next refreshed result against the agreed expected result.

**Acceptance Scenarios**:

1. **Given** a baseline indicator and an accepted change affecting it, **When** the agreed update interval has elapsed and the indicator is refreshed, **Then** the indicator reflects the changed data rather than only the original historical dataset.
2. **Given** a booking deleted from active bookings, **When** the indicators are refreshed, **Then** the effect follows the agreed deletion and revenue treatment in Q1 and Q2.

**Assumptions / Open Questions**: The update interval and sources of ongoing data are unresolved (Q3); no real-time latency target is assumed.

### User Story 5 - Guests by country (Priority: P2)

As a hotel administrator/decision-maker, I want to see the number of guests by country, so that I can understand where our guests come from.

**Why this priority**: I can understand where our guests come from. Priority is proposed under A1.

**Independent Test**: Load a reference dataset with agreed expected guest counts grouped by country and inspect this measure independently of other reports.

**Acceptance Scenarios**:

1. **Given** a reference dataset with approved calculation definitions, **When** this indicator is requested, **Then** the reported guest counts grouped by country match the independently calculated expected results.
2. **Given** reference records in different reporting years, **When** a reporting year is used, **Then** the result includes only contributions allocated to that year under the agreed date rules.

**Assumptions / Open Questions**: Country, guest counting, revenue, date allocation, and season definitions are unresolved in Q2. Reporting-year selection is a proposed assumption (A3).

### User Story 6 - Revenue by room type and season (Priority: P2)

As a hotel administrator/decision-maker, I want to see revenue by room type for each season, so that I can compare the seasonal performance of room types.

**Why this priority**: I can compare the seasonal performance of room types. Priority is proposed under A1.

**Independent Test**: Load a reference dataset with agreed expected revenue grouped by both room type and season and inspect this measure independently of other reports.

**Acceptance Scenarios**:

1. **Given** a reference dataset with approved calculation definitions, **When** this indicator is requested, **Then** the reported revenue grouped by both room type and season match the independently calculated expected results.
2. **Given** reference records in different reporting years, **When** a reporting year is used, **Then** the result includes only contributions allocated to that year under the agreed date rules.

**Assumptions / Open Questions**: Country, guest counting, revenue, date allocation, and season definitions are unresolved in Q2. Reporting-year selection is a proposed assumption (A3).

### User Story 7 - Revenue by country (Priority: P2)

As a hotel administrator/decision-maker, I want to see revenue by country, so that I can compare the revenue associated with different guest markets.

**Why this priority**: I can compare the revenue associated with different guest markets. Priority is proposed under A1.

**Independent Test**: Load a reference dataset with agreed expected revenue grouped by country and inspect this measure independently of other reports.

**Acceptance Scenarios**:

1. **Given** a reference dataset with approved calculation definitions, **When** this indicator is requested, **Then** the reported revenue grouped by country match the independently calculated expected results.
2. **Given** reference records in different reporting years, **When** a reporting year is used, **Then** the result includes only contributions allocated to that year under the agreed date rules.

**Assumptions / Open Questions**: Country, guest counting, revenue, date allocation, and season definitions are unresolved in Q2. Reporting-year selection is a proposed assumption (A3).

### User Story 8 - Highest-earning rooms (Priority: P2)

As a hotel administrator/decision-maker, I want to identify which rooms earn the most, so that I can identify the rooms with the strongest revenue contribution.

**Why this priority**: I can identify the rooms with the strongest revenue contribution. Priority is proposed under A1.

**Independent Test**: Load a reference dataset with agreed expected room revenue ordered from highest to lowest, retaining equal values and inspect this measure independently of other reports.

**Acceptance Scenarios**:

1. **Given** a reference dataset with approved calculation definitions, **When** this indicator is requested, **Then** the reported room revenue ordered from highest to lowest, retaining equal values match the independently calculated expected results.
2. **Given** reference records in different reporting years, **When** a reporting year is used, **Then** the result includes only contributions allocated to that year under the agreed date rules.

**Assumptions / Open Questions**: Country, guest counting, revenue, date allocation, and season definitions are unresolved in Q2. Reporting-year selection is a proposed assumption (A3).

### User Story 9 - Highest-earning countries (Priority: P2)

As a hotel administrator/decision-maker, I want to identify which countries generate the most revenue, so that I can identify the markets with the strongest revenue contribution.

**Why this priority**: I can identify the markets with the strongest revenue contribution. Priority is proposed under A1.

**Independent Test**: Load a reference dataset with agreed expected country revenue ordered from highest to lowest, retaining equal values and inspect this measure independently of other reports.

**Acceptance Scenarios**:

1. **Given** a reference dataset with approved calculation definitions, **When** this indicator is requested, **Then** the reported country revenue ordered from highest to lowest, retaining equal values match the independently calculated expected results.
2. **Given** reference records in different reporting years, **When** a reporting year is used, **Then** the result includes only contributions allocated to that year under the agreed date rules.

**Assumptions / Open Questions**: Country, guest counting, revenue, date allocation, and season definitions are unresolved in Q2. Reporting-year selection is a proposed assumption (A3).

### User Story 10 - Annual hotel revenue (Priority: P2)

As a hotel administrator/decision-maker, I want to see hotel revenue for a year, so that I can assess the hotel’s annual financial performance.

**Why this priority**: I can assess the hotel’s annual financial performance. Priority is proposed under A1.

**Independent Test**: Load a reference dataset with agreed expected hotel revenue for the agreed reporting year and inspect this measure independently of other reports.

**Acceptance Scenarios**:

1. **Given** a reference dataset with approved calculation definitions, **When** this indicator is requested, **Then** the reported hotel revenue for the agreed reporting year match the independently calculated expected results.
2. **Given** reference records in different reporting years, **When** a reporting year is used, **Then** the result includes only contributions allocated to that year under the agreed date rules.

**Assumptions / Open Questions**: Country, guest counting, revenue, date allocation, and season definitions are unresolved in Q2. Reporting-year selection is a proposed assumption (A3).

### User Story 11 - Additional indicator: average revenue per booking (Priority: P3)

As a hotel administrator/decision-maker, I want to see average revenue per booking, so that I can compare the average revenue contribution of bookings.

**Why this priority**: I can compare the average revenue contribution of bookings. Priority is proposed under A1.

**Independent Test**: Using an approved eligible booking set and revenue definition, compare the displayed result with the agreed reference calculation.

**Acceptance Scenarios**:

1. **Given** eligible bookings with non-zero booking count and agreed revenue amounts, **When** the proposed indicator is calculated, **Then** the result equals the agreed revenue total divided by the eligible booking count.
2. **Given** no eligible bookings, **When** the indicator is requested, **Then** the result follows the explicitly agreed empty-result rule in Q2.

**Assumptions / Open Questions**: ASSUMPTION A4: This is the proposed additional interesting indicator requested by the user; its selection and formula require confirmation. No eligibility or zero-denominator rule is imposed.

### User Story 12 - Annual cocktail bar sales (Priority: P2)

As Helene Christine (bar), I want to see total cocktail bar sales for a year, so that I can assess the bar’s annual sales performance.

**Why this priority**: I can assess the bar’s annual sales performance. Priority is proposed under A1.

**Independent Test**: Use an isolated bar sales fixture and compare the annual bar sales total with an agreed reference calculation.

**Acceptance Scenarios**:

1. **Given** bar sales with agreed categories, dates, and calculation definitions, **When** the measure is requested for a reporting year, **Then** The annual bar sales total match the agreed reference calculation.
2. **Given** sales records spanning different reporting years, **When** the reporting year is applied, **Then** only sales allocated to that year under the agreed rules contribute.

**Assumptions / Open Questions**: Q2 leaves the meaning of total sales (amount or units), percentage basis (revenue or units), drink categories, refunds, and reporting-year boundaries open. Year filtering for all bar measures is proposed in A3.

### User Story 13 - Revenue per drink (Priority: P2)

As Helene Christine (bar), I want to see revenue per drink, so that I can compare the revenue contribution of individual drinks.

**Why this priority**: I can compare the revenue contribution of individual drinks. Priority is proposed under A1.

**Independent Test**: Use an isolated bar sales fixture and compare revenue grouped by drink with an agreed reference calculation.

**Acceptance Scenarios**:

1. **Given** bar sales with agreed categories, dates, and calculation definitions, **When** the measure is requested for a reporting year, **Then** Revenue grouped by drink match the agreed reference calculation.
2. **Given** sales records spanning different reporting years, **When** the reporting year is applied, **Then** only sales allocated to that year under the agreed rules contribute.

**Assumptions / Open Questions**: Q2 leaves the meaning of total sales (amount or units), percentage basis (revenue or units), drink categories, refunds, and reporting-year boundaries open. Year filtering for all bar measures is proposed in A3.

### User Story 14 - Cocktail and coffee percentages (Priority: P2)

As Helene Christine (bar), I want to see the percentage split between cocktails and coffee, so that I can understand the bar’s sales mix.

**Why this priority**: I can understand the bar’s sales mix. Priority is proposed under A1.

**Independent Test**: Use an isolated bar sales fixture and compare the percentage split between cocktails and coffee with an agreed reference calculation.

**Acceptance Scenarios**:

1. **Given** bar sales with agreed categories, dates, and calculation definitions, **When** the measure is requested for a reporting year, **Then** The percentage split between cocktails and coffee match the agreed reference calculation.
2. **Given** sales records spanning different reporting years, **When** the reporting year is applied, **Then** only sales allocated to that year under the agreed rules contribute.

**Assumptions / Open Questions**: Q2 leaves the meaning of total sales (amount or units), percentage basis (revenue or units), drink categories, refunds, and reporting-year boundaries open. Year filtering for all bar measures is proposed in A3.

### User Story 15 - Explore indicators in an interactive Tableau dashboard (Priority: P2)

As a hotel administrator/decision-maker, I want to explore operational indicators in an interactive Tableau dashboard supplied through the API, so that I can investigate hotel and bar performance for decision-making.

**Why this priority**: I can investigate hotel and bar performance for decision-making. Priority is proposed under A1.

**Independent Test**: Provide a known set of indicator results through the API and verify dashboard values and one agreed interaction against those results.

**Acceptance Scenarios**:

1. **Given** known hotel and bar indicator results available through the API, **When** the dashboard retrieves the results, **Then** the dashboard displays values matching the supplied results for the same reporting scope.
2. **Given** a dashboard displaying indicator results, **When** the user changes an agreed reporting selection, **Then** the visible results change to match that selection.
3. **Given** a source change affecting an indicator, **When** the agreed refresh cycle completes, **Then** the refreshed dashboard agrees with the updated indicator result.

**Assumptions / Open Questions**: Tableau and API delivery are explicit user requirements. A reporting-year selection is proposed in A3; other interactions and refresh timing remain open in Q3. No dashboard layout or connection mechanism is selected.

### Edge Cases

The material available does not establish outcomes for the cases below. These are
open questions, not implied business rules:

- Q1: Missing or invalid booking fields; editing/deleting a missing booking;
  duplicate submissions; concurrent changes; overlaps; deletion versus cancellation.
- Q2: Missing countries or room types; multiple guests or countries on one booking;
  stays spanning seasons or years; refunds, cancellations, currencies, taxes, and discounts.
- Q2: Empty datasets, zero percentage denominators, and tied highest earners.
  Tied values must remain numerically equal; no business tie-break order is assumed.
- Q3: Failed refresh, unavailable sources, conflicting source changes, and gaps in
  current bar sales data. No retry, conflict-resolution, or stale-data display rule is assumed.

## Requirements *(mandatory)*

### Functional Requirements

| ID | Requirement | Acceptance coverage |
| --- | --- | --- |
| FR-001 | Receptionists MUST be able to create bookings through a browser frontend. | Story 1 |
| FR-002 | Receptionists MUST be able to edit bookings through a browser frontend. | Story 2 |
| FR-003 | Receptionists MUST be able to delete bookings through a browser frontend. | Story 3 |
| FR-004 | Indicators MUST reflect ongoing operational data updates, including accepted booking changes, under an agreed refresh interval and calculation rules. | Story 4; Q1–Q3 |
| FR-005 | Decision-makers MUST be able to see guest counts by country. | Story 5; Q2 |
| FR-006 | Decision-makers MUST be able to see revenue by room type by season. | Story 6; Q2 |
| FR-007 | Decision-makers MUST be able to see revenue by country. | Story 7; Q2 |
| FR-008 | Decision-makers MUST be able to identify the highest-earning individual rooms. | Story 8; Q2 |
| FR-009 | Decision-makers MUST be able to identify the highest-earning countries. | Story 9; Q2 |
| FR-010 | Decision-makers MUST be able to see annual hotel revenue. | Story 10; Q2 |
| FR-011 | The system MUST provide one additional relevant indicator. Average revenue per booking is the proposed candidate, subject to A4. | Story 11; A4 |
| FR-012 | Helene Christine MUST be able to see total annual cocktail bar sales. | Story 12; Q2 |
| FR-013 | Helene Christine MUST be able to see revenue per drink. | Story 13; Q2 |
| FR-014 | Helene Christine MUST be able to see the percentage split between cocktails and coffee. | Story 14; Q2 |
| FR-015 | The system MUST supply the hotel and bar indicator results through the API for an interactive Tableau dashboard. | Story 15; Q3 |

These requirements establish capabilities. Calculation-dependent acceptance tests
are not executable with definitive expected values until the corresponding Q2
rules and source fields are confirmed. No fabricated financial definitions are used.

### Key Entities *(include if feature involves data)*

These are conceptual reporting needs inferred from S1, not verified workbook columns
or a prescribed data model. Their presence and relationships require S3/S4 verification.

- **Booking**: Reservation information that can be created, edited, and deleted;
  actual fields, identifiers, validation, and lifecycle are open in Q1.
- **Guest / Country**: Information needed to attribute guest counts and revenue to
  a country; attribution and counting rules are open in Q2.
- **Room / Room Type**: An individual room and its reporting classification;
  source identifiers and relationships are unverified.
- **Reporting Year / Season**: Reporting periods with boundaries and date allocation
  rules to be established in Q2.
- **Revenue Contribution**: Amounts attributed to hotel activity for the requested
  aggregations; source and financial meaning are open in Q2.
- **Bar Sale / Drink Category**: Bar activity associated with a drink, reporting date,
  and cocktail/coffee classification; available detail and calculation basis are unverified.

## Success Criteria *(mandatory)*

### Measurable Outcomes

These are proposed acceptance measures (**ASSUMPTION A5**), not performance or
business targets claimed to appear in the missing assignment.

- **SC-001**: All three browser booking maintenance journeys (create, edit, and delete)
  pass their acceptance scenarios on agreed booking fixtures.
- **SC-002**: All ten requested reporting outputs (six named hotel outputs, one extra
  indicator, and three bar outputs) match independently calculated reference results
  using approved definitions and precision.
- **SC-003**: A tested accepted change affecting an indicator is reflected after the
  agreed refresh interval; historical-only data do not remain the reported current result.
- **SC-004**: Every displayed reporting value matches its supplied source result for
  the same reporting scope, and at least one agreed interaction changes that scope correctly.

No response-time, refresh-latency, user-volume, or task-duration threshold is invented.
SC-002 and SC-003 remain conditional on the business definitions and interval in Q2/Q3.

## Assumptions

- **A1 — Proposed priorities**: Story priorities represent a draft delivery order.
- **A3 — Proposed interaction and period selection**: A reporting-year selection
  is proposed for dashboard interactivity and test isolation. Its availability,
  year boundaries, and application to each measure require confirmation.
- **A4 — Proposed additional indicator**: Average revenue per booking is proposed
  because it relates booking activity to revenue. The proposed formula is total
  eligible booking revenue divided by eligible booking count; eligibility,
  date basis, and empty-set behavior require confirmation.
- **A5 — Proposed acceptance measures**: The coverage and reconciliation measures
  in Success Criteria express how this draft can be evaluated, not source-backed
  service-level requirements.
- **Dependency**: Source documents and workbook must be available for validation.
  Current operational and bar-data sources and the agreed dashboard data
  consumption must be confirmed. No authentication,
  role hierarchy, retention, synchronization protocol, or bar-sales-entry feature is assumed.

## Open Questions

The grouped questions below deliberately leave business rules undecided.

### Q1 — Source material, booking data, and actor responsibilities

Where are the assignment and Excel workbook? Which sheets and fields are authoritative?
Which booking fields are required or editable, and what makes a booking acceptable?
Does “delete” mean removal, cancellation, or exclusion from active bookings, and what
happens to related reporting history? What outcomes are required for invalid/missing
bookings, repeated requests, overlaps, and simultaneous changes? Which actors may
perform which operations? No extra permissions are assigned in this draft.

### Q2 — Indicator definitions and expected calculations

Does “revenue” mean booked revenue, paid amounts, or another measure? What does annual
bar “total sales” measure: money, units, or both? Are cocktails/coffee percentages based
on money or units, and what is the denominator? What determines a guest's country,
how are guests counted, and how is revenue attributed to country and individual rooms?
How are seasons and reporting years defined, and how are stays spanning boundaries allocated?
How do cancellations, deletions, refunds, taxes, discounts, currencies, missing data,
rounding, and empty results affect each output? Is average revenue per booking accepted
as the additional indicator? These definitions must precede final expected-value tests.

### Q3 — Current data and dashboard behavior

Which sources provide ongoing hotel and bar updates, beyond the historical workbook?
What maximum delay is acceptable from an accepted source change to updated indicators
and dashboard values? What happens when a source is unavailable or conflicting data arrive?
Which dashboard interactions are required, and does Helene Christine use the same
reporting view? The API delivery requirement is confirmed; its consumption workflow
and dashboard refresh expectations remain unspecified.
