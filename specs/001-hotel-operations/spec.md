# Feature Specification: Hotel Operations and Performance Insights

**Feature Branch**: `001-hotel-operations`

**Feature Directory**: `specs/001-hotel-operations`

**Created**: 2026-10-27

**Last Updated**: 2026-10-27 — team clarification answers Q1–Q20 integrated.

**Status**: Draft — confirmed answers incorporated; remaining business decisions are listed below.

**Input**: The assignment, workbook, existing specification, and the team's clarification answers.
Describe user goals and verifiable behavior without selecting an implementation technology.
The existing stories and their identifiers are retained; Story 19 adds the daily bar-sales
registration confirmed in Q8. The English story form is “As <role>, I want <goal>, so that <reason>.”

## Source Basis and Scope

- **K1 — Assignment**: `E26 Tværfaglig Opgave Hotel Kong Arthur.pdf`, read in full.
- **K2 — Supplementary questions**: `Tillægsspørgsmål_swa.pdf`, read in full.
  Architecture explanations and technical choices belong in Plan.
- **K3 — Workbook**: `Hotel_Kong_Arthur_data-1.xlsx`, inspected read-only. Sheets:
  Oversigt, Bookinger, Bar - Drinks, Værelsestyper, Hotelinfo, Indtjening pr. værelse,
  Indtjening pr. land, Noter. Source formulas and underlying totals were checked.
- **K4 — Constitution**: `.specify/memory/constitution.md`, v1.0.0, read.
  Its five principles remain applicable; no language or additional technology is chosen here.
- **K5 — Team clarifications**: The Q1–Q20 answers supplied on 2026-10-27 below.
  Explicit team decisions supersede the previous draft's assumptions, including the
  one-year dataset assumption and the unspecified seasonal month boundaries.
- Browser booking maintenance, API booking access, and an interactive Tableau dashboard
  are requirements from K1 and the current specification, not technology choices made here.
- Scope now includes daily closing-shift bar-sales registration, multiple guests and rooms
  per booking, room inventory by type, and questionnaire-based satisfaction linked to rooms.
- No different access rights are required for the named actors (Q6). This does not decide
  whether login is required or select an authentication mechanism.

**Source limitations and reference values**:

- K3 contains 1,000 bookings and 30 drinks (20 cocktails, 10 coffees), but no stay dates,
  individual room numbers, guest counts per booking, or satisfaction responses.
- A source booking names one guest and one country and records room type, nights,
  season (`low`/`mid`/`high`), and total price. Future bookings can contain multiple guests
  and rooms (Q9). Source booking counts MUST NOT be presented as verified person counts.
- Bar source data are undated totals per drink; there is no daily history to reconstruct.
- K5 requires arrival and departure for all bookings and states that the data cover three
  years (Q2, Q12). Exact years and historical date assignment remain unresolved (R2).
  No historical dates, room assignments, or questionnaire responses are fabricated.
- Workbook labels such as “annual revenue” use a one-year assumption that K5 replaces.
  Workbook totals remain whole-source reconciliation values, not verified annual totals.
- Historical prices can fall outside K1's approximate price ranges. Original source
  amounts are reference evidence; no new seasonal tariff is inferred from those ranges.
- Reference checks below apply only to the unchanged source dataset, before generated
  dates, extra guests/rooms, cancellations, or new transactions affect the result.

## Clarifications

### Session 2026-10-27

The team supplied all 20 answers together; no new questions were asked in this session.
Numbering matches the questions in the previous specification.

- Q: Q1 — Which booking fields are supplied and generated? → A: First name, last name,
  country, room type, and nights are supplied; the system creates BookingID, price based
  on season and room type, and arrival/departure dates. The date-generation basis remains R2.
- Q: Q2 — Do bookings require arrival and departure dates? → A: Yes, all bookings do.
- Q: Q3 — How is season determined? → A: From the date: high = June, July, August;
  mid = April, May, September, October, November, December; low = January, February, March.
- Q: Q4 — What happens to deleted/cancelled bookings? → A: They can be deleted/cancelled
  and need not appear in indicators. This specification excludes them from indicator inputs;
  physical deletion versus retained cancellation is not prescribed.
- Q: Q5 — How are input, price, and duplicates handled? → A: No manual typing; choose only
  valid options through controls such as dropdowns. Prices cannot be entered manually and
  are calculated from room type and nights, with season from Q1/Q3. BookingID is the unique
  primary identifier. Repeated submissions with different IDs remain unresolved (R7).
- Q: Q6 — Are different permissions needed? → A: No different rights are required.
- Q: Q7 — What does live mean? → A: Dynamic data; the booking page refreshes after every
  new booking. No maximum indicator/dashboard refresh delay was specified (R9).
- Q: Q8 — How is bar sales data updated? → A: Once daily, recorded by the closing shift,
  preserving the sales day so sales can later be measured by day.
- Q: Q9 — What can a booking contain and what should be counted? → A: Both bookings and
  guests; a booking may include multiple guests and rooms and is in one guest's name.
  Country attribution for groups is not defined (R4).
- Q: Q10 — What does total price include, and is bar revenue included? → A: Total price
  includes everything; yes to including the bar in the hotel's total revenue. Booking
  revenue is summed from booking total prices; bar revenue is added separately for the same period.
- Q: Q11 — How are rooms identified? → A: Room numbers are categorized by room type so
  the system knows which numbers belong to which type. “Small = rooms 1, 2, 3” is an
  example, not the actual inventory to load.
- Q: Q12 — What period do the data cover? → A: Three years. Exact years and allocation
  of undated source records were not provided (R2).
- Q: Q13 — Which occupancy formula and period apply? → A: Use the stated formula,
  sold room-nights / (214 × 365), for one year. A percentage is this ratio × 100.
- Q: Q14 — Where does satisfaction come from? → A: Questionnaires linked to rooms,
  allowing satisfaction to be viewed for each room. Scale and aggregation remain R6.
- Q: Q15 — Which extra indicator is selected? → A: An overview of room types and the
  number of rooms of each type. Earlier average-price and average-stay candidates are replaced.
- Q: Q16 — How should bar measures and other drinks be treated? → A: Total sales should
  show both units and revenue; the cocktail/coffee split uses revenue. Drinks outside
  those categories need their own category treatment; wine/beer grouping remains R8.
- Q: Q17 — Who sees bar results? → A: Helene Christine and the administrator both do.
- Q: Q18 — Which dashboard interactions are required? → A: Try different interactions;
  choose later. Interaction design is deliberately deferred for exploration.
- Q: Q19 — What are empty results and rounding? → A: No data is represented as `null`;
  displayed amounts and percentages use one decimal place. Zero-denominator detail remains R10.
- Q: Q20 — Is high bar revenue a data error? → A: No. Bar sales can come from people
  without a hotel booking. Such sales must not be discarded or require a booking link.

## User Scenarios & Testing *(mandatory)*

Stories retain **The Three Cs**: Card, Conversation, Confirmation. MoSCoW priorities remain
proposals (A1); no new priorities are claimed to be specified in the assignment. Each story
provides a distinct outcome and can be checked independently with a known fixture.
Calculations with unresolved rules use approved test fixtures once those rules are agreed;
those stories are not yet fully estimable under INVEST. Source reconciliation tests never
invent person counts, room assignments, or annual allocations missing from K3.

### User Story 1 - Create a booking through the browser frontend (Priority: Must)

**Card**: As a receptionist, I want to create a booking using valid selections in the browser, so that the booking page reflects new reservations.

**Why this priority**: Supports the assignment’s requested capability and the team’s confirmed clarifications. Priority remains proposed under A1.

**Independent Test**: Create a booking with an agreed selection fixture and tariff, then retrieve it without using the dashboard.

**Conversation**:

- Q1/Q5: select first name, last name, country, room type, and nights; the system supplies the identifier, dates, season, and price. No manual price entry is available.
- Q9: support multiple guests and rooms and identify one guest as the booking holder. Available guest/name choices and room selection rules remain R3/R5.
- R1/R2: the tariff and date-generation basis must be agreed before a definitive creation calculation can be tested.

**Confirmation (acceptance criteria)**:

1. Given valid selections and an agreed date-generation basis and tariff, when a booking is created, then it is retrievable with a generated unique BookingID, arrival, departure, derived season, and calculated total price.
2. Given a newly saved booking, when the save succeeds, then the booking page refreshes and includes that booking without a separate manual refresh (Q7).
3. Given the booking form, when the user enters booking details, then only valid selectable values are offered and no control permits manual entry or override of the price (Q5).

---

### User Story 2 - Edit a booking through the browser frontend (Priority: Must)

**Card**: As a receptionist, I want to update an existing booking in the browser, so that reservation details remain correct.

**Why this priority**: Supports the assignment’s requested capability and the team’s confirmed clarifications. Priority remains proposed under A1.

**Independent Test**: Edit a known booking using valid selections and retrieve the result.

**Conversation**:

- The same selection and automatic-price requirements apply to editing. BookingID is the generated identity, not a user-entered replacement.
- Exactly which fields are editable and how concurrent changes are resolved remain R7; no rule is invented.

**Confirmation (acceptance criteria)**:

1. Given an existing booking and an agreed editable field, when a valid selected change is saved, then the same BookingID retrieves the changed value.
2. Given a change to a price-driving field under the agreed tariff, when it is saved, then price and dependent values are recalculated and cannot be manually overridden.
3. Given an invalid requested value, when an update is submitted, then it is rejected without changing the booking, with an explanation.

---

### User Story 3 - Delete or cancel a booking through the browser frontend (Priority: Must)

**Card**: As a receptionist, I want to delete or cancel a booking in the browser, so that inactive reservations no longer contribute to operational indicators.

**Why this priority**: Supports the assignment’s requested capability and the team’s confirmed clarifications. Priority remains proposed under A1.

**Independent Test**: Delete/cancel a known booking, check active bookings, and recalculate affected indicators.

**Conversation**:

- Q4: deleted/cancelled bookings are excluded from indicators. Physical deletion versus retained cancellation is not a business requirement here.
- Repeated deletion, missing bookings, and confirmation behavior remain R7.

**Confirmation (acceptance criteria)**:

1. Given an active booking, when it is deleted/cancelled, then it no longer appears among active bookings.
2. Given a deleted/cancelled booking, when indicators are recalculated, then its booking, guest, room-night, and booking-revenue contributions are excluded.

---

### User Story 4 - Maintain bookings through the API (Priority: Must)

**Card**: As the hotel's existing booking system, I want to create, update, and delete bookings through the API, so that operational bookings can enter the system without retyping them.

**Why this priority**: Supports the assignment’s requested capability and the team’s confirmed clarifications. Priority remains proposed under A1.

**Independent Test**: Submit each booking operation through the API and retrieve its resulting state without using the browser.

**Conversation**:

- This combined story exists in the current source specification and is retained; the three previously deleted standalone API stories are not recreated.
- Q6: no different permissions apply. A5 proposes the same booking rules across channels; user-supplied prices cannot override generated prices.
- A combined story may need task-level splitting for estimation; requests repeated with different identifiers remain R7.

**Confirmation (acceptance criteria)**:

1. Given valid booking data under the agreed rules, when the booking system creates a booking, then it is retrievable with a system-generated unique identifier, dates, and price.
2. Given an existing booking, when an allowed update succeeds, then the same BookingID retrieves the updated details and calculated price.
3. Given an active booking, when it is deleted/cancelled, then it is no longer active and is excluded from indicators.
4. Given an invalid value, when the booking system submits it, then the operation is rejected with an explanation and without changing stored booking data.
5. Given a booking created through the API, when the browser booking page next loads, then the same booking is visible.

---

### User Story 5 - Show current operational indicators (Priority: Must)

**Card**: As a hotel administrator/decision-maker, I want to see indicators that reflect changing operational data, so that I can make decisions using current information.

**Why this priority**: Supports the assignment’s requested capability and the team’s confirmed clarifications. Priority remains proposed under A1.

**Independent Test**: Start from a dated fixture, create, edit, or cancel a booking, and compare recalculated indicators against an independent calculation.

**Conversation**:

- Q7 confirms automatic booking-page refresh after creation; it does not specify a maximum dashboard/indicator update delay (R9).
- Q8 adds daily dated bar updates. The original undated totals remain source evidence until R2 is settled.

**Confirmation (acceptance criteria)**:

1. Given booking revenue R for an agreed period and a new booking contributing X in that period, when current indicators are recalculated, then booking revenue is R + X.
2. Given a cancelled/deleted booking, when current indicators are recalculated, then the booking is excluded.
3. Given an agreed grouping change to a booking, when current indicators are recalculated, then its contribution moves to the correct group without being counted twice.

---

### User Story 6 - Guests and bookings by country (Priority: Must)

**Card**: As a hotel administrator/decision-maker, I want to see guest and booking counts by country, so that I can understand our guest markets.

**Why this priority**: Supports the assignment’s requested capability and the team’s confirmed clarifications. Priority remains proposed under A1.

**Independent Test**: Use a fixture with known guest counts, named booking holders, and country assignments; check person counts separately from booking counts.

**Conversation**:

- Q9 confirms both booking and guest counts and multiple guests/rooms per booking. One guest is the named booking holder.
- K3 can verify booking counts only: 1,000 across 20 countries, South Korea 63. These are not verified person counts. Country attribution for group bookings remains R4.

**Confirmation (acceptance criteria)**:

1. Given the unchanged source dataset, when booking counts by country are shown, then all 20 countries sum to 1,000 bookings and South Korea has 63 bookings.
2. Given a fixture with known guests and the agreed country-attribution rule, when counts are shown, then both guest and booking counts match independent counts and are labelled distinctly.
3. Given no person-count data for a reporting scope, when its guest count is requested, then the result is null rather than a booking count relabelled as guests.

---

### User Story 7 - Revenue by room type and season (Priority: Must)

**Card**: As a hotel administrator/decision-maker, I want to see revenue by room type and season, so that I can compare seasonal room performance.

**Why this priority**: Supports the assignment’s requested capability and the team’s confirmed clarifications. Priority remains proposed under A1.

**Independent Test**: Check the unchanged source aggregations and a separately dated fixture using the confirmed month-to-season map.

**Conversation**:

- Q3: high is June–August; mid is April–May and September–December; low is January–March. December is mid season despite the earlier general assignment description.
- Exact rates and the date used for season derivation, including cross-season stays, remain R1/R2. Historical season codes can be reconciled without inventing historical dates.

**Confirmation (acceptance criteria)**:

1. Given the unchanged source records grouped by their recorded season codes, when room revenue is aggregated, then all 8 room types and 3 seasons match K3, with totals low DKK 3,354,077.0, mid DKK 3,809,387.0, and high DKK 4,070,570.0.
2. Given an agreed relevant date in each month, when the season is derived, then it matches the Q3 month map and is not manually selected.
3. Given a multi-room booking with agreed room-level revenue allocation, when revenue is grouped, then each room contribution is counted once under its correct type and season.

---

### User Story 8 - Revenue by country (Priority: Must)

**Card**: As a hotel administrator/decision-maker, I want to see revenue by country, so that I can compare the financial contribution of guest markets.

**Why this priority**: Supports the assignment’s requested capability and the team’s confirmed clarifications. Priority remains proposed under A1.

**Independent Test**: Compare country totals against K3 for unchanged source records and against a group-booking fixture once allocation is agreed.

**Conversation**:

- Q10 confirms all-inclusive booking totals. Attribution of a multi-country booking and of walk-in bar sales to countries is unresolved (R4).

**Confirmation (acceptance criteria)**:

1. Given unchanged source booking data, when booking revenue is grouped by its recorded country, then all country totals match K3 and sum to DKK 11,234,034.0 across the complete source dataset.
2. Given a booking with multiple guests and the agreed country-allocation rule, when revenue is grouped, then total allocated booking revenue equals the booking total without duplication.

---

### User Story 9 - Identify the highest-earning rooms (Priority: Must)

**Card**: As a hotel administrator/decision-maker, I want to identify which rooms earn the most, so that I can compare the contribution of individual rooms.

**Why this priority**: Supports the assignment’s requested capability and the team’s confirmed clarifications. Priority remains proposed under A1.

**Independent Test**: Use a fixture of numbered rooms with known types and allocated booking revenue, and compare the resulting ranking.

**Conversation**:

- Q11 requires a room-number-to-room-type inventory. The example “small = 1, 2, 3” does not establish actual room assignments.
- K3 supports a room-type ranking only. Actual numbered-room ranking requires R5; multi-room price allocation requires R1.

**Confirmation (acceptance criteria)**:

1. Given numbered rooms with known types and agreed revenue allocation, when rooms are ranked, then the highest revenue appears first and each room number retains its correct type.
2. Given unchanged source data, when the separate room-type ranking is requested, then the leading types are Suite (DKK 2,119,671.0), Spa Executive (DKK 1,722,396.0), and LOFT Suite (DKK 1,695,405.0).
3. Given no historical room-number assignment, when numbered-room results are requested, then missing values are null and no assignments are invented.

---

### User Story 10 - Identify the highest-earning countries (Priority: Must)

**Card**: As a hotel administrator/decision-maker, I want to identify countries generating the most revenue, so that I can compare our most valuable markets.

**Why this priority**: Supports the assignment’s requested capability and the team’s confirmed clarifications. Priority remains proposed under A1.

**Independent Test**: Compare booking revenue ranking against the unchanged source data.

**Conversation**:

- Country allocation for multi-country bookings remains R4; most guests and highest revenue are distinct measures.

**Confirmation (acceptance criteria)**:

1. Given unchanged source booking data, when countries are ranked by booking revenue, then the leaders are South Korea (DKK 767,699.0), China (DKK 722,928.0), and United Kingdom (DKK 698,290.0), and the full ranking matches K3.

---

### User Story 11 - Annual hotel revenue (Priority: Must)

**Card**: As a hotel administrator/decision-maker, I want to see annual hotel revenue including rooms and bar, so that I can assess the hotel’s annual financial performance.

**Why this priority**: Supports the assignment’s requested capability and the team’s confirmed clarifications. Priority remains proposed under A1.

**Independent Test**: Use dated booking and bar fixtures for a known year and reconcile components and their sum.

**Conversation**:

- Q10: booking total prices are all-inclusive and bar revenue is included in combined hotel revenue for the same reporting period.
- Q12: the source covers three years; undated whole-source totals cannot be called one year. Exact annual attribution remains R2.
- Q20: bar guests may be walk-ins; high bar revenue is accepted and is not filtered by booking existence.

**Confirmation (acceptance criteria)**:

1. Given dated room and bar revenue for one year under the agreed date-allocation rule, when annual revenue is shown, then room revenue and bar revenue are shown distinctly and combined revenue equals their sum.
2. Given the unchanged complete source dataset, when whole-source totals are reconciled, then room revenue is DKK 11,234,034.0, bar revenue is DKK 13,448,640.3, and combined revenue is DKK 24,682,674.3; these are not labelled as verified annual totals.
3. Given bar sales without any booking link, when revenue is calculated for their reporting period, then those sales contribute to bar and combined revenue.

---

### User Story 12 - Annual occupancy (Priority: Must)

**Card**: As a hotel administrator/decision-maker, I want to see annual room occupancy, so that I can assess use of available room capacity.

**Why this priority**: Supports the assignment’s requested capability and the team’s confirmed clarifications. Priority remains proposed under A1.

**Independent Test**: Use an agreed annual fixture with known sold room-nights and independently calculate sold room-nights / (214 × 365) × 100.

**Conversation**:

- Q13 confirms a one-year formula with denominator 214 × 365 = 78,110 room-nights. A multi-room booking contributes the room-nights for its rooms, not guest-nights.
- K3 contains 5,379 recorded nights over an undated three-year source. Its former 6.9% one-year estimate is not a verified annual occupancy result.
- Annual allocation and historical multi-room evidence remain R2/R5. No per-type occupancy formula or leap-year variation is added.

**Confirmation (acceptance criteria)**:

1. Given an approved annual fixture with 5,379 sold room-nights, when annual occupancy is displayed, then it is 6.9% using the agreed formula; this fixture does not assert the source nights all belong to one year.
2. Given two rooms each booked for three nights in the same reporting year, when sold room-nights are calculated, then the booking contributes six room-nights regardless of guest count.
3. Given a cancelled/deleted booking, when annual occupancy is recalculated, then its room-nights are excluded.

---

### User Story 13 - Room-level guest satisfaction (Priority: Should)

**Card**: As a hotel administrator/decision-maker, I want to see questionnaire-based guest satisfaction for each room, so that I can identify differences in guest experience between rooms.

**Why this priority**: Existing Should priority is retained; the questionnaire source is confirmed but scoring still requires agreement. Priority remains proposed under A1.

**Independent Test**: Use questionnaire responses linked to known room numbers and an agreed scale and aggregate.

**Conversation**:

- Q14 confirms questionnaires linked to rooms as the source. Collection workflow, response scale, and aggregation remain R6.
- K3 has no satisfaction records. This clarification settles the source, not the missing historical scores.

**Confirmation (acceptance criteria)**:

1. Given questionnaire responses linked to rooms and an approved scoring rule, when satisfaction is shown, then each room’s result matches an independent calculation using only responses linked to that room.
2. Given a room with no questionnaire responses, when its satisfaction is requested, then the result is null.
3. Given a numeric satisfaction result, when it is displayed, then it uses one decimal place (Q19).

---

### User Story 14 - Room inventory by type — selected extra indicator (Priority: Must)

**Card**: As a hotel administrator/decision-maker, I want to see room types and the number of rooms in each type, so that I can understand the hotel’s room inventory.

**Why this priority**: Supports the assignment’s requested capability and the team’s confirmed clarifications. Priority remains proposed under A1.

**Independent Test**: Use a known room-number/type inventory and count unique rooms by type independently.

**Conversation**:

- Q15 selects this inventory overview instead of earlier proposed ADR, average stay, or revenue-per-booking indicators.
- Q11 provides the categorization requirement, but not the actual mapping. Source booking counts must not be used as inventory counts (R5).
- This describes room stock, so creating or cancelling a booking must not change the inventory counts.

**Confirmation (acceptance criteria)**:

1. Given an approved inventory of numbered rooms and their types, when the overview is shown, then each type’s count equals the number of rooms assigned to that type.
2. Given an approved complete inventory for the 214-room hotel, when type counts are summed, then they total 214.
3. Given an unchanged room inventory, when a booking is created or cancelled, then the inventory counts remain unchanged.

---

### User Story 15 - Annual bar sales: revenue and units (Priority: Must)

**Card**: As Helene Christine, I want to see annual bar revenue and units sold, so that I can assess bar sales performance.

**Why this priority**: Supports the assignment’s requested capability and the team’s confirmed clarifications. Priority remains proposed under A1.

**Independent Test**: Reconcile unchanged source totals, then verify a dated fixture independently for a selected year.

**Conversation**:

- Q16 requires both revenue and units. Q17 makes these results visible to both Helene Christine and the administrator.
- Q20 permits non-resident customers. Q12 replaces the one-year source assumption; daily/annual historical attribution remains R2.

**Confirmation (acceptance criteria)**:

1. Given unchanged complete source bar data, when source totals are shown, then revenue is DKK 13,448,640.3 and units sold are 179,958 without claiming those undated totals are for one known year.
2. Given dated daily sales for a year, when annual totals are shown, then revenue and units each equal the sum of that year’s eligible sales.
3. Given a sale without a booking, when totals are calculated, then the sale is included and can be viewed by both Helene Christine and the administrator.

---

### User Story 16 - Revenue per drink (Priority: Must)

**Card**: As Helene Christine, I want to see revenue for each drink, so that I can compare which drinks generate revenue.

**Why this priority**: Supports the assignment’s requested capability and the team’s confirmed clarifications. Priority remains proposed under A1.

**Independent Test**: Compare drink price × units against unchanged source data and an independently calculated dated fixture.

**Conversation**:

- Revenue per source drink follows the workbook formula price × sold units. Q8 adds dated daily sales going forward.
- Wine/beer require categorization beyond cocktail/coffee (Q16); actual catalog, prices, and grouping remain R8.

**Confirmation (acceptance criteria)**:

1. Given unchanged source data, when revenue per drink is shown, then all 30 drinks match K3 and Espresso has the highest revenue.
2. Given a dated daily fixture with known drink prices and quantities, when revenue per drink is requested, then the drink totals match the independently calculated results with one decimal place.
3. Given Helene Christine or the administrator, when drink revenue is requested, then both can see the results.

---

### User Story 17 - Cocktail and coffee revenue percentages (Priority: Must)

**Card**: As Helene Christine, I want to see the revenue percentage split between cocktails and coffee, so that I can understand the bar’s revenue mix.

**Why this priority**: Supports the assignment’s requested capability and the team’s confirmed clarifications. Priority remains proposed under A1.

**Independent Test**: Compare against K3 for the original two-category dataset and use a separate fixture containing additional drink categories after R8 is resolved.

**Conversation**:

- Q16 explicitly selects revenue, not units, as the percentage basis. Additional category treatment must not silently put wine/beer into cocktail or coffee.
- With additional categories, the percentage denominator and whether the view is a cocktail/coffee subset or whole-bar mix remain R8.

**Confirmation (acceptance criteria)**:

1. Given the unchanged two-category source data, when revenue percentages are shown, then cocktails are 52.8% and coffee is 47.2%, calculated from revenue rather than sold units.
2. Given no data in the reporting scope, when percentages are requested, then they are null.
3. Given data with wine/beer, when categories are reported, then those sales are not misclassified as cocktail or coffee; percentage calculations follow the agreed R8 denominator.

---

### User Story 18 - Interactive Tableau dashboard supplied through the API (Priority: Must)

**Card**: As a hotel administrator/decision-maker, I want to explore hotel and bar results in an interactive Tableau dashboard supplied through the API, so that I can investigate operational performance in one place.

**Why this priority**: Supports the assignment’s requested capability and the team’s confirmed clarifications. Priority remains proposed under A1.

**Independent Test**: Supply known indicator values and verify visible values, shared access, and a selected exploratory interaction.

**Conversation**:

- Q17: Helene Christine also sees bar results alongside the administrator, with no role-specific rights (Q6).
- Q18 deliberately defers final interactions: try alternatives and decide later. No specific filter or layout is approved.
- Q7 confirms booking-page refresh only. Indicator/dashboard refresh timing remains R9; technical calculation placement belongs in Plan.

**Confirmation (acceptance criteria)**:

1. Given known indicator results through the API, when the dashboard loads, then it displays the applicable hotel, occupancy, inventory, satisfaction, and bar results from Stories 6–17 consistently with those results.
2. Given Helene Christine and the administrator, when they view bar reporting, then both can see the bar results.
3. Given a selected exploratory interaction with known expected results, when it is used, then the displayed scope and values match that selection; final interaction selection remains deferred.
4. Given missing results or numeric amounts/percentages, when they are shown, then missing results are null and amounts/percentages use one decimal place.

---

### User Story 19 - Register daily bar sales (Priority: Must)

**Card**: As a closing-shift staff member, I want to record bar sales once each day against that sales date, so that the hotel can later compare bar performance across days.

**Why this priority**: Supports the assignment’s requested capability and the team’s confirmed clarifications. Priority remains proposed under A1.

**Independent Test**: Record an agreed daily fixture with known drink quantities and sales date, then retrieve daily and annual reporting contributions.

**Conversation**:

- Q8 introduces this function explicitly; it is no longer excluded from scope. Q20 means no hotel booking is required for a bar customer.
- Q5’s valid-option interaction rule is retained; no manual price override is added. The daily entry granularity, catalog, correction workflow, and duplicates remain R8.

**Confirmation (acceptance criteria)**:

1. Given an agreed daily sales fixture and valid selectable options, when the closing shift records that day’s sales, then the saved records retain the sales date and the fixture’s drink quantities and revenue.
2. Given two dated daily sales records, when daily reporting is requested, then each day can be distinguished and reports the corresponding sales rather than an undated cumulative total.
3. Given dated sales for non-resident bar customers, when registration completes, then no hotel booking link is required and the sales contribute to drink, daily, and applicable annual totals.

---

### Deferred Scope

- Final dashboard interactions are deliberately deferred for exploration (Q18).
- A separate monthly occupancy report is not selected by Q13, which accepts an annual measure.
- Numbered-room reporting and daily bar registration are now in scope (Q11, Q8);
  their former Won't entries are removed.

### Edge Cases

- No data produces `null`, not an invented score, zero, or person count (Q19).
  Zero denominators with records present still require R10.
- Generated BookingIDs are unique; two attempts to store the same ID cannot create
  two bookings. This does not define repeated-request handling or detect equivalent
  real-world reservations with different IDs (R7).
- Booking selections expose only valid values and never permit manual prices (Q5).
  Catalog population, name selection, and historic out-of-range prices still need R1/R3.
- Deleted/cancelled bookings are excluded from indicators (Q4), while independent bar
  sales remain valid without a booking (Q20).
- Cross-season/year stays, group-country attribution, and multi-room price allocation
  remain unresolved; no arbitrary split or arrival-year rule is introduced (R1/R2/R4).
- Concurrent changes, missing bookings, repeated daily entry, correction, and tied
  ranking presentation remain R7/R8. No new conflict or tie-break policy is invented.

## Requirements *(mandatory)*

### Functional Requirements

| ID | Requirement | Acceptance coverage |
| --- | --- | --- |
| FR-001 | Receptionists MUST be able to create bookings through a browser frontend using valid selections. | Story 1 |
| FR-002 | Receptionists MUST be able to edit allowed booking details through the browser; generated identity and prices are not manually editable. | Story 2; R7 |
| FR-003 | Receptionists MUST be able to delete/cancel bookings; those bookings MUST be excluded from active bookings and indicators. | Story 3 |
| FR-004 | The existing booking system MUST be able to create, edit, and delete/cancel bookings through the API. | Story 4 |
| FR-005 | Booking behavior across the browser and API follows the same rules (proposed A5); no actor-specific access rights are required (Q6). | Stories 1–4 |
| FR-006 | The browser MUST offer valid selection controls, not manual typing or price entry; invalid submitted booking values MUST be rejected without changing booking data. | Stories 1–4; R3/R7 |
| FR-007 | Operational indicators MUST reflect accepted booking changes; the booking page MUST refresh after every new booking. Indicator/dashboard maximum delay remains R9. | Stories 1, 5, 18 |
| FR-008 | The system MUST distinguish booking counts from person counts and support guest and booking reporting by country without inventing missing people. | Story 6; R4 |
| FR-009 | The system MUST show revenue by room type and season; derive season from dates using the confirmed month map. | Story 7; R1/R2 |
| FR-010 | The system MUST show revenue by country under an agreed attribution rule. | Story 8; R4 |
| FR-011 | The system MUST categorize numbered rooms by type and rank individual rooms by revenue when room assignments and allocation are available. | Story 9; R1/R5 |
| FR-012 | The system MUST rank countries by revenue. | Story 10; R4 |
| FR-013 | Annual hotel revenue MUST include all-inclusive booking totals and bar revenue for the same year, with distinct component totals. | Story 11; R2 |
| FR-014 | Annual occupancy MUST use sold room-nights / (214 × 365), expressed as a percentage. Cancelled/deleted bookings do not contribute. | Story 12; R2 |
| FR-015 | The system SHOULD show questionnaire-based satisfaction linked to individual rooms; scale and aggregation require agreement. | Story 13; R6 |
| FR-016 | The selected additional indicator MUST show room types and the number of rooms of each type. | Story 14; R5 |
| FR-017 | Annual bar sales MUST show both revenue and units sold and be visible to Helene Christine and the administrator. | Story 15; R2 |
| FR-018 | The system MUST show revenue per drink and retain appropriate categories for drinks beyond cocktail and coffee. | Story 16; R8 |
| FR-019 | Cocktail/coffee percentages MUST use revenue; additional-category denominator behavior remains R8. | Story 17 |
| FR-020 | The system MUST provide indicators through the API to an interactive Tableau dashboard. Final interactions are deferred for exploration. | Story 18 |
| FR-021 | The source bookings and bar data MUST be usable as starting data without fabricated dates or room assignments. All operational bookings require arrival/departure; historical enrichment is unresolved. | Stories 1, 5–17; A6/R2 |
| FR-022 | No-data results MUST be null. Displayed numeric amounts and percentages MUST use one decimal place; counts remain counts. | Stories 6, 9, 13, 15–18; R10 |
| FR-023 | The system MUST generate a unique BookingID, price, arrival, and departure for each booking; no manual price override is permitted. | Stories 1, 2, 4; R1/R2 |
| FR-024 | A booking MUST support multiple guests and multiple rooms and be held in one guest's name. | Stories 1, 6–9, 12; R4/R5 |
| FR-025 | The closing shift MUST be able to register dated bar sales once daily, enabling comparisons across sales days. | Story 19; R8 |
| FR-026 | Bar sales MUST NOT require a booking and MUST include sales to non-resident customers in applicable bar and combined totals. | Stories 11, 15, 19 |

### Key Entities *(include if feature involves data)*

These are conceptual requirements, not a technical data model.

- **Booking**: Unique system-generated BookingID (primary identifier), named booking
  holder, selected first/last name and country, multiple guests and rooms, room type,
  nights, generated arrival/departure, date-derived season, and all-inclusive generated
  price. Operational fields and source fields are distinguished; missing historical
  dates/guests/rooms are not assumed present.
- **Guest / Booking Holder**: People associated with a booking; one holds the booking.
  Counting and country attribution for groups require R4.
- **Room / Room Type**: Individual room number mapped to one of the eight source types:
  Standard Single, Grand Lit, Standard Double, Superior Double, Junior Suite,
  Spa Executive, Suite, LOFT Suite. Actual inventory and assignments require R5.
- **Season**: Low = January–March; mid = April, May, September–December;
  high = June–August. Which stay date controls season is not yet agreed.
- **Reporting Period**: Source horizon of three years; annual reporting for dated records.
  Exact years and historical period allocation remain R2.
- **Hotel Capacity**: 214 rooms from K1, with the confirmed annual occupancy denominator
  214 × 365. K1 describes 1–4 people per room and approximate maximum guest capacity 428;
  those facts do not provide a complete type-by-type capacity mapping.
- **Drink / Daily Bar Sale**: Drink, category, price, quantity, calculated revenue, and
  sales day for new daily entries. Source rows are undated aggregates, not daily sales.
  A hotel booking is optional for bar customers.
- **Questionnaire Response**: Satisfaction information linked to room number; scale,
  aggregate, collection method, and treatment of multi-room stays require R6.

## Success Criteria *(mandatory)*

### Measurable Outcomes

Proposed acceptance measures (A8), not invented service-level targets.

- **SC-001**: Every Must story passes its acceptance criteria with an approved fixture;
  unresolved rules must be settled before that story is declared complete.
- **SC-002**: Unchanged source booking and bar totals match K3, displayed to one decimal
  where appropriate, without relabelling three-year undated totals as annual figures.
- **SC-003**: Every successful new booking appears on the automatically refreshed
  booking page. Recalculated indicators reflect accepted creation, edits, and cancellation;
  a maximum dashboard refresh delay still requires R9.
- **SC-004**: A receptionist completes browser booking maintenance using only valid
  selections and without entering prices. First-attempt unaided demonstration remains
  a proposed acceptance measure, not an assignment-provided performance target.
- **SC-005**: Dashboard values match supplied indicator values for the same scope;
  at least one agreed exploratory interaction changes that scope correctly.
- **SC-006**: A two-day bar fixture preserves both sales dates and produces correct
  daily, drink, unit, and revenue totals, including sales without booking links.
- **SC-007**: Approved inventory counts total 214 rooms; a booking does not change stock.
  A room with no satisfaction responses reports null rather than an invented score.

## Assumptions

Confirmed decisions now appear in Clarifications and requirements rather than remaining
as assumptions. A2 (booking revenue), A4 (season), and A7 (rooms mean room types) are
retired: Q10 confirms the first, Q3 replaces the second with date derivation, and Q11
requires numbered rooms. A3 (one-year source) is explicitly rejected by Q12.

- **A1 — MoSCoW priorities**: Existing priorities remain proposed delivery priorities.
- **A5 — Consistent channel rules**: Browser and API use the same business rules;
  equal rights are confirmed by Q6, while shared channel validation remains this proposal.
- **A6 — Starting data**: K3 provides starting data and new operations build on it;
  the import/enrichment of missing fields must be agreed before implementation.
- **A8 — Success measures**: The measures above are proposed ways to evaluate the feature.
- **A9 — Source references**: Workbook values are source-reconciliation checks only for
  unchanged raw inputs. They do not override Q12 or supply missing historical attributes.

## Remaining Open Questions

Each item records the part still unanswered; it does not reopen the confirmed part of Q1–Q20.

- **R1 — Exact automatic prices (Q1/Q5/Q9)**: What rate applies to each room type and
  season? How are multi-room totals and revenue per room calculated? Are cross-season
  stays priced per night or by a single season? K1 gives approximate ranges, not tariffs.
- **R2 — Dates, seasons, and three-year allocation (Q1/Q2/Q3/Q12)**: What are the three
  years? How can arrival be generated from the stated selections, and how are arrival,
  departure, and nights related? Which date determines season? How are cross-year stays
  allocated? How are dates assigned to historical bookings and years to aggregate bar
  sales without inventing evidence? Do not silently use the current date or split totals equally.
- **R3 — Selection-only entry (Q5)**: Where do selectable names, guests, dates, countries,
  and valid night counts come from? How are new guests added when manual typing is prohibited?
  No guest catalog or name-generation rule is supplied.
- **R4 — Guest counts and country allocation (Q9/Q10)**: How are multiple guests and
  their countries recorded, how are mixed-country booking counts/revenue allocated,
  and what should country reporting include for walk-in bar revenue? Historical person
  counts are absent. Do not multiply the booking total by the number of guests.
- **R5 — Room inventory and assignment (Q9/Q11/Q15)**: What is the actual room-number/type
  mapping, how are rooms assigned to group bookings, and how are historical rooms identified?
  The team's “small” example is illustrative, not actual inventory. Availability/overlap
  and capacity rules are not specified.
- **R6 — Satisfaction scoring (Q14)**: Which questionnaire, response scale, aggregation,
  collection flow, and multi-room response attribution are intended? The source and
  per-room linkage are confirmed; the score itself is not yet defined.
- **R7 — Remaining booking behavior (Q1/Q5/Q6)**: Which fields may be edited? How are
  simultaneous changes, unknown IDs, repeat submissions, and ties presented? Unique
  BookingID prevents duplicate identifiers, not equivalent bookings with different IDs.
  Equal rights do not specify whether login is required.
- **R8 — Daily bar capture and category definitions (Q8/Q16)**: Is a daily entry per drink,
  or individual sale? How are quantities selected, corrections and repeat daily entries
  handled, and prices/catalog populated? Should wine and beer have separate categories
  or one shared additional category? Does the cocktail/coffee split exclude those
  categories from its denominator or show a whole-bar mix? No extra menu values are invented.
- **R9 — Reporting refresh and exploration (Q7/Q18)**: Automatic booking-page refresh
  after creation is confirmed. Indicator/dashboard delay, refresh after edits/deletion,
  source failure behavior, and the final exploratory interaction choice are not specified.
  Interaction design is deliberately deferred; no arbitrary latency threshold is introduced.
- **R10 — Display boundary cases (Q19)**: Null for no data and one decimal for amounts/
  percentages are confirmed. Does a zero denominator with records also return null,
  and which tie-rounding rule applies? No-data null must not erase a genuine numeric zero.
