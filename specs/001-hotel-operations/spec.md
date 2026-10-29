# Feature Specification: Hotel Operations and Performance Insights

**Feature Branch**: `001-hotel-operations`

**Feature Directory**: `specs/001-hotel-operations`

**Created**: 2026-10-27

**Last Updated**: 2026-10-28 — pricing, date selection, demonstration dates, and guest-name entry updated.

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
- **K6 — Follow-up decisions (2026-10-28)**: Seasonal tariff supplied, arrival selected
  with a date picker, departure calculated from nights, season-based demonstration
  dates authorized, and manual guest-name entry allowed. Standard Single low-season
  low-season price is confirmed as DKK 1,031; the user now authorizes generated demonstration room inventory.
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
  years (Q2, Q12). K6 authorizes clearly labelled demonstration booking dates based on
  the source seasons in 2024, 2025, and 2026; generation/allocation details remain R2. Original source
  data stay distinct from demonstration enrichment. No room assignments or questionnaire
  responses are generated without authorization.
- Workbook labels such as “annual revenue” use a one-year assumption that K5 replaces.
  Workbook totals remain whole-source reconciliation values, not verified annual totals.
- Historical prices can fall outside K1's approximate price ranges. Original source
  amounts are reference evidence and are not overwritten with the new K6 tariff.
  The supplied tariff applies to new calculations; source reconciliation retains source prices.
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

### Session 2026-10-28

These follow-up decisions supersede the earlier no-manual-name-entry and automatically
chosen-arrival wording. They do not authorize invented historical facts.

- Q: What are the seasonal nightly rates? → A: Use the supplied DKK tariff below.
  The follow-up confirms Standard Single low season as DKK 1,031, superseding the
  earlier DKK 950 line. All 24 tariff cells are now confirmed.
- Q: How should arrival and departure be entered? → A: The receptionist selects arrival
  using a date picker; departure is calculated as arrival plus the number of nights.
- Q: May missing historical dates be generated as demonstration data? → A: Yes, based
  on the source seasons. Generated dates must remain labelled as demonstration data;
  approved demonstration years are 2024, 2025, and 2026; seasonal generation details remain R2.
- Q: Is an actual or demonstration room inventory available/authorized? → A: Yes.
  After the meaning of inventory was explained, the user explicitly requested generated
  room inventory, superseding the earlier prohibition. Use clearly labelled synthetic
  room numbers/type mappings for 214 rooms across all eight types; no actual inventory
  has been supplied.
- Q: May guest names be entered manually while fixed options remain selectable? → A: Yes.
  First and last names may be typed; country and room type remain selections, and
  price is never manually entered.

- Q: How should a stay crossing seasons be priced? → A: Use each night's own seasonal
  rate, then sum the nightly charges across the booked rooms. This resolves new-booking
  cross-season pricing; historical source amounts remain unchanged.

- Q: Which three years should generated historical booking dates use? → A: 2024, 2025,
  and 2026, consistent with each booking's recorded season and clearly labelled as
  demonstration dates. This assigns a demonstration horizon, not verified dates to
  the original source. Allocation across years and detailed generation remain R2.

- Q: How are mixed-country bookings counted? → A: Count the booking, all guests
  belonging to it, and its room revenue under the booking holder's country. Do not
  split the booking across guests' individual countries or duplicate its revenue.
  Guest count and booking count remain separate measures. This does not assign a
  country to independent walk-in bar sales or supply missing historical person counts.

- Q: Which guest satisfaction scale and calculation should be used? → A: One overall
  questionnaire rating from 1 to 5, linked to a room. Show the arithmetic mean of that
  room's ratings to one decimal place; show null if it has no responses. Do not invent
  historical responses. Collection workflow and multi-room response linkage remain R6.

- Q: How should daily bar sales and corrections be registered? → A: The closing shift
  selects a sales date and records the total quantity sold per drink for that date.
  There is one effective quantity per date/drink pair. Saving a correction replaces
  the prior quantity rather than adding to it, preventing double-counting. This is
  daily aggregate entry, not individual transaction capture.

- Q: How should wine, beer, and bar percentages be reported? → A: Use separate
  Cocktails, Coffee, Wine, and Beer categories. The cocktail/coffee comparison divides
  each category's revenue by cocktail revenue plus coffee revenue only, so those two
  shares total 100% before display rounding when the denominator is positive. Overall
  bar revenue and units include all four categories. Missing wine/beer menu data are
  not permission to invent drinks, prices, or historical sales.

- Q: How should browser and API reporting refresh? → A: Refresh the browser after
  successful booking creation, edits, and cancellation; API reporting reflects saved
  changes on the next request. The user asks whether Tableau Desktop can refresh
  automatically, so its refresh mechanism remains under investigation; manual-only
  Tableau refresh has not been confirmed as the final requirement.

- Q: Which Tableau edition is available? → A: Tableau Desktop Public Edition.
  The exact version is not supplied. Automatic refresh remains a requested capability
  to assess, not a confirmed supported feature or an approved cloud integration.
  Local operation and data delivery from the JSON API remain requirements.

**Nightly tariff for new booking calculations (DKK per room per night)**:

| Room type | Low | Mid | High |
| --- | ---: | ---: | ---: |
| Standard Single | 1,031 | 1,152 | 1,339 |
| Grand Lit | 1,230 | 1,405 | 1,592 |
| Standard Double | 1,416 | 1,488 | 1,782 |
| Superior Double | 1,602 | 1,785 | 1,968 |
| Junior Suite | 1,990 | 2,180 | 2,359 |
| Spa Executive | 2,241 | 2,397 | 2,631 |
| Suite | 2,740 | 3,046 | 3,231 |
| LOFT Suite | 3,220 | 3,468 | 3,731 |

For each booked room, calculate each night's charge using that room type's tariff
for the season of that night's date. Include arrival night and exclude departure
night: departure = arrival + nights. A room's total is the sum of its nightly charges;
a booking's total is the sum across all booked rooms. Do not apply the arrival-date
season to the entire stay. These rates do not replace historical source prices.

**Generated demonstration room inventory**:

Fixture: [fixtures/room-inventory.json](fixtures/room-inventory.json).
The following distribution and sequential room numbers are implementation assumptions
for the authorized demonstration dataset, not claims about the hotel's actual rooms.
The first and last number in each range are included.

| Room type | Demonstration room numbers | Count |
| --- | --- | ---: |
| Standard Single | 001–030 | 30 |
| Grand Lit | 031–054 | 24 |
| Standard Double | 055–114 | 60 |
| Superior Double | 115–158 | 44 |
| Junior Suite | 159–178 | 20 |
| Spa Executive | 179–194 | 16 |
| Suite | 195–206 | 12 |
| LOFT Suite | 207–214 | 8 |
| **Total** | **001–214** | **214** |

The fixture contains inventory only. Assigning historical bookings to these rooms,
overlap/availability rules, room capacities, and satisfaction responses are separate
decisions; this generation request does not resolve or fabricate those records.

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

- K6: enter first/last name manually; select country, room type, nights, and arrival (date picker). The system generates BookingID, departure, season, and price. No manual price entry is available.
- Q9: support multiple guests and rooms and identify one guest as the booking holder. Guest names may be typed; room selection rules remain R5.
- K6 confirms all 24 seasonal tariff cells, including Standard Single low season at DKK 1,031. Departure equals selected arrival plus nights. Each night uses the season of its own date; sum nightly charges for each room, then sum rooms for the booking total.

**Confirmation (acceptance criteria)**:

1. Given valid booking details including typed names, a date-picker arrival, nights, and a confirmed tariff cell, when a booking is created, then it is retrievable with a generated unique BookingID, the selected arrival, departure equal to arrival plus nights, derived season, and calculated total price.
2. Given a newly saved booking, when the save succeeds, then the booking page refreshes and includes that booking without a separate manual refresh (Q7).
3. Given the booking form, when details are entered, then first/last names allow typing, arrival uses a date picker, fixed options use valid selections, and price has no manual entry or override.
4. Given arrival 10 July 2026, three nights, and one Standard Double room, when departure and price are calculated, then departure is 13 July 2026 and total price is DKK 5,346.0 (3 × 1,782).
5. Given arrival 10 January 2026, two nights, and one Standard Single room, when departure and price are calculated, then departure is 12 January 2026 and total price is DKK 2,062.0 (2 × 1,031).
6. Given one Standard Single room arriving 31 May 2026 for two nights, when price and departure are calculated, then departure is 2 June, the 31 May night costs DKK 1,152, the 1 June night costs DKK 1,339, and total price is DKK 2,491.0; departure day is not charged.
7. Given two Standard Single rooms for that same stay, when the booking total is calculated, then each room costs DKK 2,491.0 and the booking total is DKK 4,982.0.

---

### User Story 2 - Edit a booking through the browser frontend (Priority: Must)

**Card**: As a receptionist, I want to update an existing booking in the browser, so that reservation details remain correct.

**Why this priority**: Supports the assignment’s requested capability and the team’s confirmed clarifications. Priority remains proposed under A1.

**Independent Test**: Edit a known booking using valid selections and retrieve the result.

**Conversation**:

- The same name-entry, date-picker, valid-selection, and automatic-price requirements apply to editing. BookingID is the generated identity, not a user-entered replacement. Changing arrival or nights recalculates departure as arrival plus nights.
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

1. Given valid booking data including supplied arrival and nights, when the booking system creates a booking, then it is retrievable with a generated unique identifier, the supplied arrival, departure calculated from nights, and generated price under the agreed tariff.
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

- Refresh the booking page after successful creation, edits, and cancellation. API reporting must reflect saved changes on the next request. Tableau refresh behavior remains under investigation (R9).
- Q8 adds daily dated bar updates. The original undated totals remain source evidence until R2 is settled.

**Confirmation (acceptance criteria)**:

1. Given booking revenue R for an agreed period and a new booking contributing X in that period, when current indicators are recalculated, then booking revenue is R + X.
2. Given a cancelled/deleted booking, when current indicators are recalculated, then the booking is excluded.
3. Given an agreed grouping change to a booking, when current indicators are recalculated, then its contribution moves to the correct group without being counted twice.
4. Given a successful booking creation, edit, or cancellation, when the next reporting API request is made after the save, then the result reflects that change without waiting for a scheduled batch refresh.
5. Given a successful browser booking edit or cancellation, when the operation completes, then the booking page automatically refreshes to reflect the result.

---

### User Story 6 - Guests and bookings by country (Priority: Must)

**Card**: As a hotel administrator/decision-maker, I want to see guest and booking counts by country, so that I can understand our guest markets.

**Why this priority**: Supports the assignment’s requested capability and the team’s confirmed clarifications. Priority remains proposed under A1.

**Independent Test**: Use a fixture with known guest counts, named booking holders, and country assignments; check person counts separately from booking counts.

**Conversation**:

- Q9 confirms both booking and guest counts and multiple guests/rooms per booking. One guest is the named booking holder.
- K3 can verify booking counts only: 1,000 across 20 countries, South Korea 63. These are not verified person counts. For group bookings, count the booking and all its guests under the booking holder's country; historical person counts remain missing (R4).

**Confirmation (acceptance criteria)**:

1. Given the unchanged source dataset, when booking counts by country are shown, then all 20 countries sum to 1,000 bookings and South Korea has 63 bookings.
2. Given a Danish booking holder, two Danish guests in total, and one Swedish guest on one booking, when counts are grouped by country, then Denmark receives one booking and three guests, Sweden receives no contribution from that booking, and the two measures are labelled distinctly.
3. Given no person-count data for a reporting scope, when its guest count is requested, then the result is null rather than a booking count relabelled as guests.

---

### User Story 7 - Revenue by room type and season (Priority: Must)

**Card**: As a hotel administrator/decision-maker, I want to see revenue by room type and season, so that I can compare seasonal room performance.

**Why this priority**: Supports the assignment’s requested capability and the team’s confirmed clarifications. Priority remains proposed under A1.

**Independent Test**: Check the unchanged source aggregations and a separately dated fixture using the confirmed month-to-season map.

**Conversation**:

- Q3: high is June–August; mid is April–May and September–December; low is January–March. December is mid season despite the earlier general assignment description.
- K6 confirms the complete nightly tariff. New stays use each night’s date for seasonal pricing. Historical date-generation details remain R2. Approved generated historical dates must be labelled as demonstration data and agree with the recorded source season under the agreed date rule.

**Confirmation (acceptance criteria)**:

1. Given the unchanged source records grouped by their recorded season codes, when room revenue is aggregated, then all 8 room types and 3 seasons match K3, with totals low DKK 3,354,077.0, mid DKK 3,809,387.0, and high DKK 4,070,570.0.
2. Given an agreed relevant date in each month, when the season is derived, then it matches the Q3 month map and is not manually selected.
3. Given a newly priced multi-room booking, when room revenue is grouped by season, then each room-night charge contributes once under its room type and that night’s season; no full-booking total is duplicated across rooms or seasons.

---

### User Story 8 - Revenue by country (Priority: Must)

**Card**: As a hotel administrator/decision-maker, I want to see revenue by country, so that I can compare the financial contribution of guest markets.

**Why this priority**: Supports the assignment’s requested capability and the team’s confirmed clarifications. Priority remains proposed under A1.

**Independent Test**: Compare country totals against K3 for unchanged source records and verify that a mixed-country booking contributes its revenue exactly once to its holder’s country.

**Conversation**:

- Q10 confirms all-inclusive booking totals. All booking room revenue is attributed to the booking holder's country, regardless of other guests' countries. Country attribution of walk-in bar sales remains unresolved (R4).

**Confirmation (acceptance criteria)**:

1. Given unchanged source booking data, when booking revenue is grouped by its recorded country, then all country totals match K3 and sum to DKK 11,234,034.0 across the complete source dataset.
2. Given a Danish booking holder, other guests from any countries, and DKK 3,000 in booking room revenue, when revenue is grouped by country, then Denmark receives DKK 3,000.0 exactly once and no part is assigned to another guest’s country.

---

### User Story 9 - Identify the highest-earning rooms (Priority: Must)

**Card**: As a hotel administrator/decision-maker, I want to identify which rooms earn the most, so that I can compare the contribution of individual rooms.

**Why this priority**: Supports the assignment’s requested capability and the team’s confirmed clarifications. Priority remains proposed under A1.

**Independent Test**: Use a fixture of numbered rooms with known types and allocated booking revenue, and compare the resulting ranking.

**Conversation**:

- Q11 requires a room-number-to-room-type inventory. The example “small = 1, 2, 3” does not establish actual room assignments. K6 now authorizes the generated demonstration inventory. Room-level revenue still requires booking-to-room assignments (R5).
- K3 supports a room-type ranking only. Actual numbered-room ranking requires R5; new room totals follow the nightly rule; historical room assignments still require R5.

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

- Bookings are attributed to the booking holder's country for guest counts, booking counts, and room revenue; most guests and highest revenue are distinct measures.

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

**Why this priority**: Existing Should priority is retained; the questionnaire source, 1–5 scale, and per-room mean are confirmed, while response collection remains to be designed. Priority remains proposed under A1.

**Independent Test**: Use known room-linked ratings on the 1–5 scale and independently calculate the arithmetic mean for each room.

**Conversation**:

- Q14 confirms questionnaires linked to rooms. Each response supplies one overall rating from 1 to 5. The room score is the sum of its ratings divided by its response count, displayed to one decimal place. Collection workflow and multi-room response linkage remain R6.
- K3 has no satisfaction records. No historical ratings are generated or inferred from booking revenue, country, or room type.

**Confirmation (acceptance criteria)**:

1. Given three ratings of 2, 4, and 5 linked to one room, when its satisfaction is displayed, then the result is 3.7 out of 5; responses for other rooms do not contribute.
2. Given a room with no questionnaire responses, when its satisfaction is requested, then the result is null.
3. Given a numeric satisfaction result, when it is displayed, then it uses one decimal place (Q19).
4. Given a submitted rating below 1 or above 5, when it is validated, then it is rejected and does not change the room’s satisfaction score.

---

### User Story 14 - Room inventory by type — selected extra indicator (Priority: Must)

**Card**: As a hotel administrator/decision-maker, I want to see room types and the number of rooms in each type, so that I can understand the hotel’s room inventory.

**Why this priority**: Supports the assignment’s requested capability and the team’s confirmed clarifications. Priority remains proposed under A1.

**Independent Test**: Use a known room-number/type inventory and count unique rooms by type independently.

**Conversation**:

- Q15 selects this inventory overview instead of earlier proposed ADR, average stay, or revenue-per-booking indicators.
- Q11 provides the categorization requirement, but not the actual mapping. K6 now authorizes the demonstration inventory in fixtures/room-inventory.json. Source booking counts must not be used as inventory counts.
- This describes room stock, so creating or cancelling a booking must not change the inventory counts.

**Confirmation (acceptance criteria)**:

1. Given an approved inventory of numbered rooms and their types, when the overview is shown, then each type’s count equals the number of rooms assigned to that type.
2. Given the generated demonstration inventory, when counts are shown, then Standard Single is 30, Grand Lit 24, Standard Double 60, Superior Double 44, Junior Suite 20, Spa Executive 16, Suite 12, and LOFT Suite 8, totalling 214 rooms.
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
- The four categories are Cocktails, Coffee, Wine, and Beer. Wine/beer are separate from each other and from cocktail/coffee. Their actual menu items and prices remain R8; the source has only cocktail and coffee items.

**Confirmation (acceptance criteria)**:

1. Given unchanged source data, when revenue per drink is shown, then all 30 drinks match K3 and Espresso has the highest revenue.
2. Given a dated daily fixture with known drink prices and quantities, when revenue per drink is requested, then the drink totals match the independently calculated results with one decimal place.
3. Given Helene Christine or the administrator, when drink revenue is requested, then both can see the results.

---

### User Story 17 - Cocktail and coffee revenue percentages (Priority: Must)

**Card**: As Helene Christine, I want to see the revenue percentage split between cocktails and coffee, so that I can understand the bar’s revenue mix.

**Why this priority**: Supports the assignment’s requested capability and the team’s confirmed clarifications. Priority remains proposed under A1.

**Independent Test**: Compare against K3, then use a fixture with all four categories to verify that wine/beer affect overall totals but not the cocktail/coffee comparison denominator.

**Conversation**:

- Q16 explicitly selects revenue, not units, as the percentage basis. Additional category treatment must not silently put wine/beer into cocktail or coffee.
- Cocktail share = cocktail revenue / (cocktail revenue + coffee revenue) × 100; coffee share uses the same denominator. Wine and beer are excluded from this comparison but included in overall bar revenue and unit totals. Zero-denominator behavior remains R10.

**Confirmation (acceptance criteria)**:

1. Given the unchanged two-category source data, when revenue percentages are shown, then cocktails are 52.8% and coffee is 47.2%, calculated from revenue rather than sold units.
2. Given no data in the reporting scope, when percentages are requested, then they are null.
3. Given revenue of DKK 300 for Cocktails, DKK 100 for Coffee, DKK 200 for Wine, and DKK 400 for Beer, when reporting is calculated, then the cocktail/coffee comparison shows 75.0% and 25.0%, while overall bar revenue is DKK 1,000.0.
4. Given units sold in all four categories, when overall bar units are shown, then all four categories contribute; wine/beer are not misclassified as cocktail or coffee.

---

### User Story 18 - Interactive Tableau dashboard supplied through the API (Priority: Must)

**Card**: As a hotel administrator/decision-maker, I want to explore hotel and bar results in an interactive Tableau dashboard supplied through the API, so that I can investigate operational performance in one place.

**Why this priority**: Supports the assignment’s requested capability and the team’s confirmed clarifications. Priority remains proposed under A1.

**Independent Test**: Supply known indicator values and verify visible values, shared access, and a selected exploratory interaction.

**Conversation**:

- Q17: Helene Christine also sees bar results alongside the administrator, with no role-specific rights (Q6).
- Q18 deliberately defers final interactions: try alternatives and decide later. No specific filter or layout is approved.
- Browser refresh after booking creation/edit/cancellation and current API results on the next request are confirmed. The user requests investigation of automatic Tableau Desktop refresh; its mechanism and interval remain R9. Technical calculation placement belongs in Plan.

**Confirmation (acceptance criteria)**:

1. Given known indicator results through the API, when the dashboard loads, then it displays the applicable hotel, occupancy, inventory, satisfaction, and bar results from Stories 6–17 consistently with those results.
2. Given Helene Christine and the administrator, when they view bar reporting, then both can see the bar results.
3. Given a selected exploratory interaction with known expected results, when it is used, then the displayed scope and values match that selection; final interaction selection remains deferred.
4. Given missing results or numeric amounts/percentages, when they are shown, then missing results are null and amounts/percentages use one decimal place.

---

### User Story 19 - Register daily bar sales (Priority: Must)

**Card**: As a closing-shift staff member, I want to record bar sales once each day against that sales date, so that the hotel can later compare bar performance across days.

**Why this priority**: Supports the assignment’s requested capability and the team’s confirmed clarifications. Priority remains proposed under A1.

**Independent Test**: Record daily quantities per drink, correct and resubmit a date/drink pair, and verify that daily and annual reports use only the latest quantity once.

**Conversation**:

- Q8 introduces this function explicitly; it is no longer excluded from scope. Q20 means no hotel booking is required for a bar customer.
- The closing shift selects a sales date and records each drink’s total quantity sold that day. A date/drink pair has one effective quantity; corrections replace it rather than add another sale. Valid quantity controls and catalog/prices remain R8; no manual price override is added.

**Confirmation (acceptance criteria)**:

1. Given an agreed daily sales fixture and valid selectable options, when the closing shift records that day’s sales, then the saved records retain the sales date and the fixture’s drink quantities and revenue.
2. Given two dated daily sales records, when daily reporting is requested, then each day can be distinguished and reports the corresponding sales rather than an undated cumulative total.
3. Given dated sales for non-resident bar customers, when registration completes, then no hotel booking link is required and the sales contribute to drink, daily, and applicable annual totals.
4. Given 10 units recorded for one date/drink pair, when the closing shift corrects the quantity to 12, then the pair contributes 12 units rather than 22 and its reporting contribution is recalculated using 12.
5. Given 12 units already saved for a date/drink pair, when the same quantity is saved again, then the pair still contributes 12 units exactly once.
6. Given the same drink on two different sales dates, when one date’s quantity is corrected, then the other date’s quantity remains unchanged.

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
  Guest names are the approved free-text exception (K6). Valid night options remain
  R3. Preserve historical prices; do not silently reprice them using the new tariff.
- Deleted/cancelled bookings are excluded from indicators (Q4), while independent bar
  sales remain valid without a booking (Q20).
- Cross-season pricing uses each night’s seasonal tariff, summed across rooms.
  Historical date enrichment, annual reporting allocation, and walk-in bar country attribution
  remain unresolved; no arrival-year reporting rule is introduced (R2/R4).
- Saving the same date/drink pair replaces its effective quantity; repeated saves
  do not add quantities or duplicate sales. Concurrent edits, missing bookings, and
  tied ranking presentation remain R7. No conflict or tie-break policy is invented.

Approved historical-date enrichment acceptance: given raw bookings with a source
season and an agreed generation policy for 2024, 2025, and 2026, when demonstration dates are
created, then arrival/departure follow nights, the agreed seasonal date matches the
source season, generated dates are labelled synthetic, and raw prices and source
identifiers remain traceable. No actual historical date is claimed.

## Requirements *(mandatory)*

### Functional Requirements

| ID | Requirement | Acceptance coverage |
| --- | --- | --- |
| FR-001 | Receptionists MUST be able to create bookings through a browser frontend using typed names, a date-picker arrival, and valid fixed-option selections. | Story 1 |
| FR-002 | Receptionists MUST be able to edit allowed booking details through the browser; generated identity and prices are not manually editable. | Story 2; R7 |
| FR-003 | Receptionists MUST be able to delete/cancel bookings; those bookings MUST be excluded from active bookings and indicators. | Story 3 |
| FR-004 | The existing booking system MUST be able to create, edit, and delete/cancel bookings through the API. | Story 4 |
| FR-005 | Booking behavior across the browser and API follows the same rules (proposed A5); no actor-specific access rights are required (Q6). | Stories 1–4 |
| FR-006 | The browser MUST allow typed guest names, a date picker for arrival, and valid selection controls for fixed options; price entry MUST NOT be allowed; invalid submitted booking values MUST be rejected without changing booking data. | Stories 1–4; R3/R7 |
| FR-007 | The booking page MUST refresh after successful creation, edits, and cancellation. API reporting MUST reflect saved changes on the next request. Tableau refresh mechanism and delay remain R9. | Stories 1, 5, 18 |
| FR-008 | The system MUST distinguish booking counts from person counts and attribute each booking and all its guests to the booking holder's country, without inventing missing people. | Story 6; R4 |
| FR-009 | The system MUST show revenue by room type and season; derive season from dates using the confirmed month map. | Story 7; R1/R2 |
| FR-010 | The system MUST attribute each booking's room revenue exactly once to the booking holder's country. | Story 8; R4 |
| FR-011 | The system MUST categorize numbered rooms by type and rank individual rooms by revenue when room assignments and allocation are available. | Story 9; R1/R5 |
| FR-012 | The system MUST rank countries by revenue. | Story 10; R4 |
| FR-013 | Annual hotel revenue MUST include all-inclusive booking totals and bar revenue for the same year, with distinct component totals. | Story 11; R2 |
| FR-014 | Annual occupancy MUST use sold room-nights / (214 × 365), expressed as a percentage. Cancelled/deleted bookings do not contribute. | Story 12; R2 |
| FR-015 | The system SHOULD show each room’s arithmetic mean of overall questionnaire ratings from 1 to 5, displayed to one decimal place, or null when it has no responses. | Story 13; R6 |
| FR-016 | The selected additional indicator MUST show room types and the number of rooms of each type. | Story 14; R5 |
| FR-017 | Annual bar sales MUST show both revenue and units sold and be visible to Helene Christine and the administrator. | Story 15; R2 |
| FR-018 | The system MUST show revenue per drink with separate Cocktails, Coffee, Wine, and Beer categories. Overall bar revenue and units MUST include all four categories. | Story 16; R8 |
| FR-019 | Cocktail/coffee percentages MUST use only combined cocktail and coffee revenue as their denominator, excluding wine and beer; display one decimal place. Zero-denominator behavior remains R10. | Story 17 |
| FR-020 | The system MUST provide indicators through the API to an interactive Tableau dashboard. Final interactions are deferred for exploration. | Story 18 |
| FR-021 | The source bookings and bar data MUST be usable as starting data. Authorized historical booking-date enrichment MUST use 2024, 2025, and 2026, be clearly labelled demonstration data, and be based on source seasons; original source values remain identifiable. The authorized generated room inventory MUST be labelled demonstration data; historical booking-to-room assignments remain unresolved (R5). | Stories 1, 5–17; A6/R2 |
| FR-022 | No-data results MUST be null. Displayed numeric amounts and percentages MUST use one decimal place; counts remain counts. | Stories 6, 9, 13, 15–18; R10 |
| FR-023 | The system MUST generate a unique BookingID and price, accept selected arrival, and calculate departure as arrival plus nights. Price MUST use the confirmed seasonal tariff with no manual override. Each occupied night MUST use its own date’s seasonal rate; sum nights per room and room totals per booking, excluding departure night. | Stories 1, 2, 4; R1/R2 |
| FR-024 | A booking MUST support multiple guests and multiple rooms and be held in one guest's name. | Stories 1, 6–9, 12; R4/R5 |
| FR-025 | The closing shift MUST select a sales date and record daily total quantities per drink. Each date/drink pair MUST have one effective quantity; corrections MUST replace rather than add, enabling daily comparisons without double-counting. | Story 19; R8 |
| FR-026 | Bar sales MUST NOT require a booking and MUST include sales to non-resident customers in applicable bar and combined totals. | Stories 11, 15, 19 |

### Key Entities *(include if feature involves data)*

These are conceptual requirements, not a technical data model.

- **Booking**: Unique system-generated BookingID (primary identifier), named booking
  holder, manually entered first/last name, selected country, multiple guests and rooms,
  room type, nights, date-picker arrival, departure calculated from nights, date-derived
  season, and all-inclusive generated
  price. Operational fields and source fields are distinguished; missing historical
  dates/guests/rooms are not assumed present.
- **Guest / Booking Holder**: People associated with a booking; one holds the booking.
  For country reporting, the booking and all its guests use the booking holder's
  country. Missing historical guest counts and walk-in bar attribution remain R4.
- **Room / Room Type**: Individual room number mapped to one of the eight source types:
  Standard Single, Grand Lit, Standard Double, Superior Double, Junior Suite,
  Spa Executive, Suite, LOFT Suite. The generated demonstration inventory provides
  the room-number/type mapping; historical booking assignments still require R5.
- **Season**: Low = January–March; mid = April, May, September–December;
  high = June–August. For pricing, season is derived separately for each occupied
  night; a booking can span multiple seasons.
- **Reporting Period**: Source horizon of three years; annual reporting for dated records.
  Demonstration booking dates based on source seasons are authorized and must be labelled;
  demonstration years are 2024, 2025, and 2026; generation/allocation details remain R2.
- **Hotel Capacity**: 214 rooms from K1, with the confirmed annual occupancy denominator
  214 × 365. K1 describes 1–4 people per room and approximate maximum guest capacity 428;
  those facts do not provide a complete type-by-type capacity mapping.
- **Drink / Daily Bar Sale**: Drink, category, price, daily quantity, calculated revenue,
  and selected sales date. Each date/drink pair has one effective quantity; corrections
  replace that quantity. Source rows are undated aggregates, not daily sales.
  A hotel booking is optional for bar customers.
- **Questionnaire Response**: One overall rating from 1 to 5 linked to a room number.
  Room satisfaction is the arithmetic mean of its responses, displayed to one decimal;
  no responses gives null. Collection and treatment of multi-room stays remain R6.

## Success Criteria *(mandatory)*

### Measurable Outcomes

Proposed acceptance measures (A8), not invented service-level targets.

- **SC-001**: Every Must story passes its acceptance criteria with an approved fixture;
  unresolved rules must be settled before that story is declared complete.
- **SC-002**: Unchanged source booking and bar totals match K3, displayed to one decimal
  where appropriate, without relabelling three-year undated totals as annual figures.
- **SC-003**: After every successful creation, edit, or cancellation, the booking page
  refreshes to reflect the result. The next reporting API request reflects the saved
  change. Tableau's refresh mechanism and interval still require R9.
- **SC-004**: A receptionist completes browser booking maintenance using only valid
  selections (with typed guest names and a date-picker arrival) and without entering prices. First-attempt unaided demonstration remains
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
- **A6 — Starting data**: K3 provides starting data and new operations build on it. K6
  authorizes labelled, season-based demonstration booking dates; generation details and
  other missing-field enrichment still require agreement.
- **A8 — Success measures**: The measures above are proposed ways to evaluate the feature.
- **A9 — Source references**: Workbook values are source-reconciliation checks only for
  unchanged raw inputs. They do not override Q12 or supply missing historical attributes.

## Remaining Open Questions

Each item records the part still unanswered; it does not reopen the confirmed part of Q1–Q20.

- **R1 — Resolved: new booking pricing**: All 24 tariff cells are confirmed. Calculate
  each occupied room-night using its own date's seasonal rate, sum nights for each room,
  and sum rooms for the booking. Exclude departure night. Historical source totals
  are preserved; assigning historical amounts to room numbers remains R5.
- **R2 — Remaining historical/date rules**: Arrival selection and departure = arrival
  plus nights are confirmed. Labelled demonstration booking dates based on recorded
  seasons in 2024, 2025, and 2026 are authorized. How should demonstration
  dates preserve a source booking’s single recorded season, and how are cross-year
  revenues allocated? Historical aggregate bar dates are not established by the booking
  season permission. Preserve raw records and do not label synthetic dates as observed facts.
- **R3 — Remaining fixed-option validity**: Typed guest names and a date-picker arrival
  are confirmed. What night counts are valid selections? Country/type catalogs can use
  the supplied data, but any broader allowed catalogs require agreement. No selectable-name
  catalog or random name generation is needed.
- **R4 — Remaining country-reporting inputs (Q9/Q10)**: Booking counts, all guests
  belonging to a booking, and its room revenue are attributed to the booking holder's
  country. What should country reporting include for independent walk-in bar revenue?
  Historical person counts are absent; do not infer them from booking counts or
  multiply booking revenue by the number of guests.
- **R5 — Remaining room assignments (Q9/Q11/Q15)**: Demonstration inventory generation
  is authorized and the room-number/type fixture is supplied. How are rooms assigned
  to group bookings and historical bookings? Availability/overlap and per-type capacity
  rules remain unspecified. Inventory counts are now available; room-level revenue
  and satisfaction still require associated bookings and responses. No actual room
  inventory is claimed.
- **R6 — Remaining satisfaction collection (Q14)**: The overall 1–5 rating, arithmetic
  mean per room, one decimal, and null for no responses are confirmed. How are responses
  collected and linked to rooms for multi-room stays? Historical responses are absent;
  no authorization to generate satisfaction data has been supplied.
- **R7 — Remaining booking behavior (Q1/Q5/Q6)**: Which fields may be edited? How are
  simultaneous changes, unknown IDs, repeat submissions, and ties presented? Unique
  BookingID prevents duplicate identifiers, not equivalent bookings with different IDs.
  Equal rights do not specify whether login is required.
- **R8 — Remaining bar inputs (Q8/Q16)**: Daily quantity per date/drink and replacement
  on correction are confirmed. Cocktails, Coffee, Wine, and Beer are separate categories;
  the cocktail/coffee comparison excludes wine/beer, while overall totals include them.
  How are valid quantities selected and prices/catalog populated, including missing
  wine/beer menu items? No extra menu values or historical sales are invented.
- **R9 — Remaining Tableau refresh and exploration (Q7/Q18)**: Browser refresh after
  successful booking creation/edit/cancellation and current API results on the next
  request are confirmed. The installed edition is Tableau Desktop Public Edition;
  its exact version is unknown. Which supported integration/refresh mechanism should
  be used within the local-only setup? Do not promise automatic
  API polling or mark manual refresh as accepted. Source-failure behavior and final
  dashboard interactions remain unspecified; interaction design is deliberately deferred.
- **R10 — Display boundary cases (Q19)**: Null for no data and one decimal for amounts/
  percentages are confirmed. Does a zero denominator with records also return null,
  and which tie-rounding rule applies? No-data null must not erase a genuine numeric zero.
