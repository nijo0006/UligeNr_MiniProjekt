# Feature Specification: Hotel Operations and Performance Insights

**Feature Branch**: `001-hotel-operations`

**Feature Directory**: `specs/001-hotel-operations`

**Created**: 2026-10-27

**Last Updated**: 2026-11-03 — guest frontend retired; staff home opens separate Overview, Bookings and Helene’s bar pages; Story 24 adds booking completion with an emailed satisfaction questionnaire, and Story 13 now uses it as its main source.

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
- No different access rights are required for the named actors (Q6). The local
  prototype has no login or user accounts, as confirmed on 2026-10-29. All browser/API
  booking operations still enforce the same validation and availability rules.

**Source limitations and reference values**:

- K3 contains 1,000 bookings and 30 drinks (20 cocktails, 10 coffees), but no stay dates,
  individual room numbers, guest counts per booking, or satisfaction responses.
- A source booking names one guest and one country and records room type, nights,
  season (`low`/`mid`/`high`), and total price. Future bookings can contain multiple guests
  and rooms (Q9). Source booking counts MUST NOT be presented as verified person counts.
- Bar source data are undated totals per drink; actual daily history cannot be
  reconstructed. Synthetic daily allocation within 2026 is now authorized,
  preserving each source drink’s price, total units, and total revenue.
- K5 requires arrival and departure for all bookings and was originally interpreted as three years; the user corrects this to 2026 only. K6 authorizes clearly labelled demonstration booking dates based on
  the source seasons in 2026. All occupied nights must stay within the
  recorded season, and each booking receives an available room of its recorded type.
  Generated dates and room assignments remain separate, labelled synthetic enrichment;
  original source prices are preserved. Questionnaire responses are not generated.
- Workbook annual totals belong to 2026, as corrected by the user. Exact dates remain
  generated while original yearly amounts remain source evidence.
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
  email address, country, room type, and nights are supplied; the system creates BookingID, price based
  on season and room type, and arrival/departure dates. The date-generation basis remains R2.
- Q: Q2 — Do bookings require arrival and departure dates? → A: Yes, all bookings do.
- Q: Q3 — How is season determined? → A: From the date: high = June, July, August;
  mid = April, May, September, October, November, December; low = January, February, March.
- Q: Q4 — What happens to deleted/cancelled bookings? → A: They can be deleted/cancelled
  and need not appear in indicators. This specification excludes them from indicator inputs;
  physical deletion versus retained cancellation is not prescribed.
- Q: Q5 — How are input, price, and duplicates handled? → A: Prices cannot be entered
  manually; they are calculated from room type and nights, with season from Q1/Q3. Fields
  with a fixed set of valid values (e.g. country, room type) are chosen through controls
  such as dropdowns. Guest names and email are typed by the receptionist and validated.
  BookingID is the unique primary identifier. Repeated submissions with different IDs remain unresolved (R7).
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
  approved demonstration years are 2026; seasonal generation details remain R2.
- Q: Is an actual or demonstration room inventory available/authorized? → A: Yes.
  After the meaning of inventory was explained, the user explicitly requested generated
  room inventory, superseding the earlier prohibition. Use clearly labelled synthetic
  room numbers/type mappings for 214 rooms across all eight types; no actual inventory
  has been supplied.
- Q: May guest names be entered manually while fixed options remain selectable? → A: Yes.
  First and last names may be typed; country and room type remain selections, and
  price is never manually entered. The booking holder's email address is also typed
  and format-validated (Q1/Q5, corrected 2026-11-03).

- Q: How should a stay crossing seasons be priced? → A: Use each night's own seasonal
  rate, then sum the nightly charges across the booked rooms. This resolves new-booking
  cross-season pricing; historical source amounts remain unchanged.

- Q: Which year should generated source booking dates use? → A (corrected 2026-11-03):
  2026 only. The earlier three-year allocation is superseded; keep source seasons and
  label exact dates as generated.

- Q: How are mixed-country bookings counted? → A: Count the booking, all guests
  belonging to it, and its room revenue under the booking holder's country. Do not
  split the booking across guests' individual countries or duplicate its revenue.
  Guest count and booking count remain separate measures. This does not assign a
  country to independent walk-in bar sales or supply missing historical person counts.

- Q: Which guest satisfaction scale and calculation should be used? → A: One overall
  questionnaire rating from 1 to 5, linked to a room. Show the arithmetic mean of that
  room's ratings to one decimal place; show null if it has no responses. Do not invent
  historical responses. Receptionists record the rating against its booking and one specific room; multi-room bookings can have separate room ratings. No historical ratings are generated.

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

The inventory fixture contains rooms only. Historical booking dates and assignments
are now authorized under the generation rules in the 2026-10-29 session below; they
are not yet present in this inventory file. Guest-capacity validation is out of scope
for this prototype; questionnaire responses are not generated.

### Session 2026-10-29

- Q: Should the prototype add special handling for accidental duplicate creation
  submissions? → A: No; skip that extra feature and continue. Do not add an idempotency
  key, a duplicate-specific Save-button restriction, or a requirement that retries
  return the previously created booking. Unique BookingID and room-overlap validation
  still apply. This does not reverse accepted stale-edit or repeat-cancellation rules.

- Q: How are missing bookings and repeated cancellations handled? → A: For an unknown
  BookingID, show “Booking not found” and change nothing. Cancelling an already-cancelled
  booking leaves it cancelled without changing indicators again. Ask for confirmation
  before a browser cancellation; declining leaves the booking unchanged. Apply missing-ID
  and repeat-cancellation rules consistently through browser and API.

- Q: What happens when two clients edit the same booking from the same saved state?
  → A: Accept the first valid save. Reject the second client's outdated save with a
  message to reload the current booking; do not silently overwrite the first change.
  Apply the same rule through browser and API. A reloaded valid edit may be submitted
  against the new current state.

- Q: Does the local prototype require login or user accounts? → A: No. Login and user
  accounts are out of scope for this version. All actors retain the same access;
  browser and API operations still validate booking data and room availability.

- Q: Which booking fields can be edited? → A: Guest names, booking holder's email,
  booking holder's country, guest count, selected rooms, arrival date, and nights. BookingID remains fixed.
  Recalculate departure, per-night seasonal rates, and total price automatically;
  revalidate room availability before saving. No manual price override is allowed.

- Q: Should country revenue reporting include independent bar sales? → A: No. Country
  revenue reports and country revenue rankings include room-booking revenue only,
  attributed to the booking holder's country. Keep bar revenue separate from country
  reporting but include it in combined hotel revenue for the reporting period.
  No customer country or booking link is required for a bar sale.

- Q: May undated historical bar totals receive demonstration sales dates? → A: Yes.
  Distribute each drink's recorded sales quantities across dates in 2026. Preserve its original price, total units, and total revenue. Label all generated
  daily records synthetic and retain the original aggregate rows as source evidence.
  Do not count both source aggregates and their generated daily records in reporting.

- Q: How is room revenue assigned when a stay crosses New Year? → A: Assign each
  occupied night's revenue to the calendar year of that night, not the arrival year
  for the whole stay. For a Standard Single stay from 31 December 2025 to 2 January
  2026, assign DKK 1,152 to 2025 and DKK 1,031 to 2026; departure day is not charged.

- Q: Should the prototype enforce guest capacities per room/type? → A: No, only room
  availability for now. Keep same-room overlap validation, but do not reject bookings
  based on guest counts versus a room/type capacity or invent capacity limits. Guest
  counts remain needed for reporting; this does not remove guest data from bookings.

- Q: How are satisfaction ratings collected and linked for multi-room bookings? → A:
  Receptionists record a guest's 1–5 rating against the booking and a specific room
  on that booking. Each room on a multi-room booking can receive its own rating.
  Do not copy one rating automatically to every booked room or generate historical
  ratings. The per-room arithmetic mean, one decimal, and null for no responses remain.

- Q: How should historical demonstration bookings receive dates and rooms? → A:
  Distribute them across 2026. Keep every occupied night within each
  booking's recorded source season and assign an available room of the recorded type,
  without overlapping active stays. Preserve original source prices. Label generated
  dates and room assignments synthetic; they are not actual historical observations.

- Q: How are rooms selected and overlapping stays handled? → A: Receptionists select
  specific available room numbers for the selected stay. Reject overlapping active
  bookings for the same room, including conflicting edits and API requests. A new
  stay may arrive on a previous stay's departure date. The occupied date interval
  includes arrival and excludes departure. Historical assignments remain R5.

- Q: Should the Tableau connection and refresh method be chosen now? → A: No. The user
  will investigate the best approach. Defer this decision and continue the remaining
  work. The interactive dashboard and reporting API requirements remain in scope;
  neither CSV/manual refresh nor automatic refresh has been selected. Final dashboard
  integration and end-to-end validation remain pending the user's decision.

### Session 2026-11-03

- Q: How should satisfaction questionnaires reach guests now that the booking holder's
  email is required? → A: When a booking is completed, the booking holder automatically
  receives a satisfaction questionnaire by email. Completing a booking is a new receptionist
  action (check-out) and a new booking status, `completed`, alongside `active` and
  `cancelled`. A booking can be completed only on or after its arrival date, since the
  guest must have arrived before they can check out. Completed bookings remain real stays and keep counting in all indicators;
  only cancelled bookings are excluded. Guests answer through a questionnaire page reached
  by a link unique to their booking, rating each booked room separately. These responses
  become the only source for Story 13; receptionist entry of ratings is removed.
  Completed stays remain editable but can no longer be cancelled. The questionnaire also
  asks once per stay whether the guest would recommend the hotel to others (yes/no); the
  share answering yes is shown with room satisfaction. Recorded as Story 24.

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

- K6: enter first/last name manually; Q1 (corrected 2026-11-03): enter the booking holder's email address manually; select country, room type, nights, and arrival (date picker). The system generates BookingID, departure, season, and price. No manual price entry is available.
- Q9: support multiple guests and rooms and identify one guest as the booking holder. Guest names may be typed; select specific available room numbers for the stay. Historical assignments use an available room of the recorded type under the confirmed demonstration rule; guest-capacity validation is out of scope for this prototype.
- K6 confirms all 24 seasonal tariff cells, including Standard Single low season at DKK 1,031. Departure equals selected arrival plus nights. Each night uses the season of its own date; sum nightly charges for each room, then sum rooms for the booking total.

**Confirmation (acceptance criteria)**:

1. Given valid booking details including typed names, a typed booking-holder email, a date-picker arrival, nights, and a confirmed tariff cell, when a booking is created, then it is retrievable with a generated unique BookingID, the selected arrival, departure equal to arrival plus nights, derived season, and calculated total price.
2. Given a newly saved booking, when the save succeeds, then the booking page refreshes and includes that booking without a separate manual refresh (Q7).
3. Given the booking form, when details are entered, then first/last names and the booking-holder email allow typing, arrival uses a date picker, fixed options use valid selections, and price has no manual entry or override.
4. Given arrival 10 July 2026, three nights, and one Standard Double room, when departure and price are calculated, then departure is 13 July 2026 and total price is DKK 5,346.0 (3 × 1,782).
5. Given arrival 10 January 2026, two nights, and one Standard Single room, when departure and price are calculated, then departure is 12 January 2026 and total price is DKK 2,062.0 (2 × 1,031).
6. Given one Standard Single room arriving 31 May 2026 for two nights, when price and departure are calculated, then departure is 2 June, the 31 May night costs DKK 1,152, the 1 June night costs DKK 1,339, and total price is DKK 2,491.0; departure day is not charged.
7. Given two Standard Single rooms for that same stay, when the booking total is calculated, then each room costs DKK 2,491.0 and the booking total is DKK 4,982.0.
8. Given a new booking with a missing or invalidly formatted booking-holder email, when it is submitted through the browser or API, then it is rejected with an explanation and no booking is created.
8. Given room 001 is booked from 10 July to 13 July, when a new active stay for room 001 from 12 July to 14 July is submitted, then it is rejected without saving an overlapping booking.
9. Given room 001 is booked from 10 July to 13 July, when available rooms for a stay arriving 13 July are requested, then that earlier booking does not exclude room 001.
10. Given the selected stay dates, when room choices are offered, then only room numbers available throughout that stay can be selected.
11. Given a fresh local application startup, when the booking page is opened, then booking operations are available without login or account creation, and invalid or overlapping bookings are still rejected.
12. Given valid booking details and available selected rooms, when room validation runs, then no guest-capacity-per-room/type check is applied; guest counts are still retained for reporting.

---

### User Story 2 - Edit a booking through the browser frontend (Priority: Must)

**Card**: As a receptionist, I want to update an existing booking in the browser, so that reservation details remain correct.

**Why this priority**: Supports the assignment’s requested capability and the team’s confirmed clarifications. Priority remains proposed under A1.

**Independent Test**: Edit a known booking using valid selections and retrieve the result.

**Conversation**:

- The same name-entry, email-entry, date-picker, valid-selection, and automatic-price requirements apply to editing. BookingID is the generated identity, not a user-entered replacement. Changing arrival or nights recalculates departure as arrival plus nights.
- Editable fields are guest names, booking holder’s email, booking holder’s country, guest count, selected rooms, arrival date, and nights. BookingID stays fixed; departure, nightly rates, and total price are recalculated and availability is rechecked. Accept the first valid save; reject an outdated save with a reload message and preserve the newer booking state, through both browser and API.

**Confirmation (acceptance criteria)**:

1. Given an existing booking, when a valid change to guest names, booking holder’s email, booking holder’s country, guest count, selected rooms, arrival, or nights is saved, then the same BookingID retrieves the changed value.
2. Given a change to a price-driving field under the agreed tariff, when it is saved, then price and dependent values are recalculated and cannot be manually overridden.
3. Given an invalid requested value, when an update is submitted, then it is rejected without changing the booking, with an explanation.
4. Given an existing booking, when a date or room edit would overlap another active booking for the same room, then the edit is rejected and the original booking remains unchanged; the booking being edited does not conflict with itself.
5. Given an existing booking, when an update attempts to replace BookingID or manually override a calculated price, then the operation is rejected without changing the booking.
6. Given clients A and B have opened the same saved booking, when A saves a valid change and B then saves using the outdated state, then B’s save is rejected with a message to reload and A’s saved values remain unchanged.
7. Given an outdated save was rejected, when the client reloads the current booking and submits a valid edit against that state, then it can succeed after normal validation and availability checks.
8. Given an imported historical booking without an email address, when it is edited without supplying an email, then the save may succeed with the email still empty; a booking created in the system MUST keep a valid email on every save.

---

### User Story 3 - Delete or cancel a booking through the browser frontend (Priority: Must)

**Card**: As a receptionist, I want to delete or cancel a booking in the browser, so that inactive reservations no longer contribute to operational indicators.

**Why this priority**: Supports the assignment’s requested capability and the team’s confirmed clarifications. Priority remains proposed under A1.

**Independent Test**: Delete/cancel a known booking, check active bookings, and recalculate affected indicators.

**Conversation**:

- Q4: deleted/cancelled bookings are excluded from indicators. Physical deletion versus retained cancellation is not a business requirement here.
- Ask for confirmation before browser cancellation. Unknown BookingID returns “Booking not found” without mutation. Repeating cancellation leaves the booking cancelled and must not affect indicators a second time, through both channels.

**Confirmation (acceptance criteria)**:

1. Given an active booking, when it is deleted/cancelled, then it no longer appears among active bookings.
2. Given a deleted/cancelled booking, when indicators are recalculated, then its booking, guest, room-night, and booking-revenue contributions are excluded.
3. Given an active booking, when browser cancellation is requested, then confirmation is shown before changing data; declining confirmation leaves the booking and indicators unchanged.
4. Given an already-cancelled booking, when cancellation is repeated, then it stays cancelled and indicator totals do not change again.
5. Given an unknown BookingID, when a lookup, edit, or cancellation is attempted, then “Booking not found” is reported and no booking data or indicator contribution changes.

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

- Refresh the booking page after successful creation, edits, and cancellation. API reporting must reflect saved changes on the next request. Tableau integration and refresh are deferred for the user to investigate (R9).
- Q8 adds daily dated bar updates. Historical source totals can be allocated to synthetic daily records in 2026; preserve prices and totals and do not double-count the source aggregates.

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
- K6 confirms the complete nightly tariff. New stays use each night’s date for seasonal pricing. Historical demonstration dates are within 2026, with every occupied night in the recorded source season. Preserve historical source prices; label generated dates synthetic.

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

- Q10 confirms all-inclusive booking totals. All booking room revenue is attributed to the booking holder's country, regardless of other guests' countries. Bar revenue is excluded from country revenue reporting and rankings, while remaining in bar totals and combined hotel revenue.

**Confirmation (acceptance criteria)**:

1. Given unchanged source booking data, when booking revenue is grouped by its recorded country, then all country totals match K3 and sum to DKK 11,234,034.0 across the complete source dataset.
2. Given a Danish booking holder, other guests from any countries, and DKK 3,000 in booking room revenue, when revenue is grouped by country, then Denmark receives DKK 3,000.0 exactly once and no part is assigned to another guest’s country.
3. Given DKK 3,000 of Danish-holder room-booking revenue and DKK 500 of independent bar sales in the same period, when reporting is requested, then Denmark’s country revenue is DKK 3,000.0, bar revenue is DKK 500.0, and combined hotel revenue is DKK 3,500.0; no bar country is inferred.

---

### User Story 9 - Identify the highest-earning rooms (Priority: Must)

**Card**: As a hotel administrator/decision-maker, I want to identify which rooms earn the most, so that I can compare the contribution of individual rooms.

**Why this priority**: Supports the assignment’s requested capability and the team’s confirmed clarifications. Priority remains proposed under A1.

**Independent Test**: Use a fixture of numbered rooms with known types and allocated booking revenue, and compare the resulting ranking.

**Conversation**:

- Q11 requires a room-number-to-room-type inventory. The example “small = 1, 2, 3” does not establish actual room assignments. K6 authorizes the demonstration inventory; the 2026-10-29 clarification authorizes assigning historical bookings to available rooms of their recorded type, without changing source prices.
- K3 alone supports a room-type ranking only. Enriched demonstration data can rank synthetic room assignments using preserved source booking prices. New booking room totals follow the nightly tariff rule.

**Confirmation (acceptance criteria)**:

1. Given numbered rooms with known types and agreed revenue allocation, when rooms are ranked, then the highest revenue appears first and each room number retains its correct type.
2. Given unchanged source data, when the separate room-type ranking is requested, then the leading types are Suite (DKK 2,119,671.0), Spa Executive (DKK 1,722,396.0), and LOFT Suite (DKK 1,695,405.0).
3. Given generated historical room assignments, when numbered-room results are requested, then revenue uses the preserved source prices linked to those assigned rooms and the dataset is identified as demonstration data.
4. Given raw source records without enrichment, when numbered-room results are requested, then missing values are null rather than labelled actual historical assignments.

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
- Q12 (corrected 2026-11-03): the source covers 2026 only. New booking revenue is assigned per occupied night to that night’s calendar year. Generated booking and bar dates remain labelled synthetic; annual demonstration results use those dates without claiming actual historical dates.
- Q20: bar guests may be walk-ins; high bar revenue is accepted and is not filtered by booking existence.

**Confirmation (acceptance criteria)**:

1. Given dated room and bar revenue for one year, when annual revenue is shown, then room revenue includes occupied nights whose dates fall in that year, room and bar components are shown distinctly, and combined revenue equals their sum.
2. Given the unchanged complete source dataset, when whole-source totals are reconciled, then room revenue is DKK 11,234,034.0, bar revenue is DKK 13,448,640.3, and combined revenue is DKK 24,682,674.3; these are the source annual totals for 2026, with generated exact dates clearly identified.
3. Given bar sales without any booking link, when revenue is calculated for their reporting period, then those sales contribute to bar and combined revenue.
4. Given a Standard Single stay arriving 31 December 2025 for two nights, when annual room revenue is calculated, then 2025 receives DKK 1,152.0 and 2026 receives DKK 1,031.0, summing to the DKK 2,183.0 booking price without duplication.

---

**Annual report increment — 2026-11-03**:

- The annual API and Overview MUST show room revenue, bar revenue and their combined total for one selected calendar year, calculated by the backend.
- Room revenue uses saved active room-night charges; bar revenue uses saved daily sales revenue for the same year, including walk-in sales and all drink categories. No current tariff or menu price is applied during reporting.
- A component with no records remains null. The combined total sums recorded components; it is null only when neither component has records. A recorded zero remains numeric zero. The interface must keep missing components visible as “No data”.
- A stay crossing New Year contributes nights to the correct year; bar sales use their sales date. Corrections replace the previous contribution, and cancelled room bookings contribute nothing. Neither source reference aggregates nor multi-room totals are counted again.
- The report indicates whether either recorded component contains synthetic history. Current values are returned on the next request and shown when the user changes year, refreshes Overview or returns to the page.
- Acceptance fixtures: room charges 0.10 + 0.20 and bar revenue 0.40 produce exactly 0.70; bar-only 0.40 produces room=null, bar=0.40, total=0.40; no records produce three null amounts. Source data and existing user records are not changed by reporting.

### User Story 12 - Annual occupancy (Priority: Must)

**Card**: As a hotel administrator/decision-maker, I want to see annual room occupancy, so that I can assess use of available room capacity.

**Why this priority**: Supports the assignment’s requested capability and the team’s confirmed clarifications. Priority remains proposed under A1.

**Independent Test**: Use an agreed annual fixture with known sold room-nights and independently calculate sold room-nights / (214 × 365) × 100.

**Conversation**:

- Q13 confirms a one-year formula with denominator 214 × 365 = 78,110 room-nights. A multi-room booking contributes the room-nights for its rooms, not guest-nights.
- K3 contains 5,379 recorded nights over an undated 2026 source. Its former 6.9% one-year estimate is not a verified annual occupancy result.
- Occupied room-nights are counted in the calendar year of each occupied night. No per-type occupancy formula or leap-year variation is added; the approved denominator remains 214 × 365.

**Confirmation (acceptance criteria)**:

1. Given an approved annual fixture with 5,379 sold room-nights, when annual occupancy is displayed, then it is 6.9% using the agreed formula; this fixture does not assert the source nights all belong to one year.
2. Given two rooms each booked for three nights in the same reporting year, when sold room-nights are calculated, then the booking contributes six room-nights regardless of guest count.
3. Given a cancelled/deleted booking, when annual occupancy is recalculated, then its room-nights are excluded.

---

### User Story 13 - Room-level guest satisfaction (Priority: Should)

**Card**: As a hotel administrator/decision-maker, I want to see questionnaire-based guest satisfaction for each room, so that I can identify differences in guest experience between rooms.

**Why this priority**: Existing Should priority is retained; the questionnaire source, 1–5 scale, and per-room mean are confirmed. Responses are collected only through the emailed questionnaire sent when a booking is completed (Story 24). Priority remains proposed under A1.

**Independent Test**: Use known room-linked ratings on the 1–5 scale and independently calculate the arithmetic mean for each room.

**Conversation**:

- Q14 confirms questionnaires linked to rooms. Each response supplies one overall rating from 1 to 5. The room score is the sum of its ratings divided by its response count, displayed to one decimal place. Each response is linked to its booking and one specific room; multi-room bookings can have separate room ratings. No historical ratings are generated.
- 2026-11-03: Guests submit responses themselves through the questionnaire emailed when their booking is completed (Story 24). Receptionist entry of ratings is removed; the guest questionnaire is the only source.
- K3 has no satisfaction records. No historical ratings are generated or inferred from booking revenue, country, or room type.

**Confirmation (acceptance criteria)**:

1. Given three ratings of 2, 4, and 5 linked to one room, when its satisfaction is displayed, then the result is 3.7 out of 5; responses for other rooms do not contribute.
2. Given a room with no questionnaire responses, when its satisfaction is requested, then the result is null.
3. Given a numeric satisfaction result, when it is displayed, then it uses one decimal place (Q19).
4. Given a submitted rating below 1 or above 5, when it is validated, then it is rejected and does not change the room’s satisfaction score.
5. Given a completed booking for rooms 001 and 002, when the guest submits rating 4 for room 001 and rating 2 for room 002 through the questionnaire, then each response is linked to its room; neither response is copied to the other room.
6. Given a booking that does not include room 003, when a rating linked to that booking and room 003 is submitted, then it is rejected without changing room 003’s score.
7. Given a completed booking for room 001 whose guest submits rating 5 through the emailed questionnaire, when room 001’s satisfaction is displayed, then that response is included in the mean.
8. Given a cancelled booking, when its satisfaction responses are reported, then they do not contribute to any room’s score.

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
- Q20 permits non-resident customers. Q12 replaces the one-year source assumption; generated daily bar records are distributed within 2026 and labelled synthetic, with per-drink prices and complete-source totals preserved.

**Confirmation (acceptance criteria)**:

1. Given unchanged complete source bar data, when source totals are shown, then revenue is DKK 13,448,640.3 and units sold are 179,958 without claiming those undated totals are for one known year.
2. Given dated daily sales for a year, when annual totals are shown, then revenue and units each equal the sum of that year’s eligible sales.
3. Given generated historical daily records for 2026, when reconciled by drink across the source year 2026, then each drink retains its source price, total units, and total revenue; combined units are 179,958 and unrounded combined revenue is DKK 13,448,640.34. The original aggregate rows are not added again.
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
- Browser refresh after booking creation/edit/cancellation and current API results on the next request are confirmed. The user is investigating Tableau integration and refresh; defer their mechanism and interval under R9 and continue other work. Technical calculation placement belongs in Plan.

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

### User Story 20 - Guest booking frontend (Retired 2026-11-03)

**Status**: Superseded by the user’s explicit request to remove the customer booking page. This story is retained only for traceability; its guest interface is no longer required.

**Card**: As a hotel guest, I want to choose available rooms and book my stay, so that I can arrange accommodation without using the hotel's internal workspace.

**Source**: User request, 2026-11-02: split the frontend into a guest booking frontend and a staff frontend.

**Confirmation**:

1. Given a guest opening the guest frontend, when selecting dates, nights and rooms, then availability and automatic seasonal prices follow the existing booking rules.
2. Given a successful booking, when it is saved, then the guest sees its booking number, dates, rooms and total, and staff can see the same booking.
3. Given the guest frontend, when it loads, then it does not fetch or display the hotel's booking list, internal revenue indicators or bar workspace.

### User Story 21 - Staff operations frontend (Priority: Must)

**Card**: As a hotel staff member, I want a separate workspace for bookings, operational indicators and Helene Christine's bar reporting, so that I can manage hotel operations in one place.

**Confirmation**:

1. Given the staff frontend, when opening bookings, then staff can create, read, edit and cancel through the existing API rules.
2. Given annual room reporting, when selecting a year or changing a booking, then the workspace displays current API values.
3. Given Helene Christine or the administrator using the bar workspace, then annual revenue and units, drink revenue and cocktail/coffee percentages follow Stories 15–17, and daily corrections follow Story 19.
4. Missing annual history is labelled as missing rather than supplied as invented dates or totals.

The existing local prototype's no-login decision remains in force. Separate frontends
are interface separation; this request does not establish authentication or new actor permissions.

### User Story 22 - Staff home and separate workspaces (Priority: Must)

**Card**: As a hotel staff member, I want a home page with icons opening Overview, Bookings and Helene’s bar on separate pages, so that I can find the relevant tools without scrolling through every function.

**Source**: User request, 2026-11-03. This supersedes the customer frontend and the previous combined staff page.

**Confirmation**:

1. Opening the start page shows three clearly named, clickable icon entries for Overview, Bookings and Helene’s bar.
2. Each entry opens a separate page for its area, with a clear way back to the start page and between workspaces.
3. Overview retains annual room revenue, booking count and historical source figures; Bookings retains creation, search, filtering, editing and cancellation; Helene’s bar retains reporting and daily sales registration.
4. The customer booking page and its navigation entry are removed. Staff booking capability, existing records and historical source data remain available.
5. Navigation works with keyboard input and on mobile; each page requests only the data it needs.

### User Story 23 - Recognizable room selection and hotel appearance (Priority: Must)

**Card**: As a receptionist, I want to see the hotel's room-type photographs when creating a booking and use a frontend with the hotel's typography and visual style, so that I can recognize the room categories while working in a familiar interface.

**Source**: User request, 2026-11-03; official Hotel Kong Arthur room overview.

**Confirmation**:

1. The booking form shows the official overview photograph for each of the eight supported room types, labelled with its type.
2. Selecting a photograph selects the corresponding room-type filter; room numbers and availability retain the existing booking behavior.
3. Photos are identified as room-type illustrations, without claiming to depict each generated room number.
4. All staff pages share the reference site's Barlow body type, headline fallback stack, warm palette and hotel wordmark. Images and available fonts load from local assets.
5. The image choices are keyboard accessible, mobile layouts remain usable, and existing booking, history and bar workflows continue to work.

### User Story 24 - Complete a booking and send a satisfaction questionnaire (Priority: Should)

**Card**: As a receptionist, I want to complete a booking when the guest checks out, so that the booking holder automatically receives a satisfaction questionnaire by email and the hotel collects room-level satisfaction (Story 13).

**Source**: User request, 2026-11-03, following the required booking-holder email (FR-001).

**Why this priority**: It supplies the questionnaire responses Story 13 reports on, and Story 13 has Should priority. Priority remains proposed under A1.

**Independent Test**: Complete a known active booking with an email address and one or two rooms; check that one email with a unique questionnaire link is produced, then submit ratings through the link and check them against Story 13’s room means.

**Conversation**:

- Completing a booking is a receptionist action on the Bookings page and through the API. It changes the booking status from `active` to `completed`. Completion is only allowed on or after the booking’s arrival date; a stay that has not started cannot be checked out. A completed booking is a finished stay, not a cancellation: its revenue, room-nights, guests and country still count in every indicator. It can still be edited (for example to correct a name or room), stays completed and triggers no new email, but it can no longer be cancelled.
- The questionnaire email is sent automatically when completion is saved, to the booking holder’s email. It contains a link unique to that booking. The questionnaire page asks for one overall rating from 1 to 5 for each room on the booking, and once per stay whether the guest would recommend Hotel Kong Arthur to friends or family (yes/no).
- The questionnaire page is the only guest-facing page. It shows nothing except that booking’s rooms and the rating form, so the retired guest frontend (Story 20) is not reintroduced.
- For the local prototype, sent emails may be delivered to a local test mailbox instead of real recipients.

**Confirmation (acceptance criteria)**:

1. Given an active booking with an email address, when the receptionist completes it, then its status becomes `completed` and exactly one questionnaire email with a link unique to that booking is sent to the booking holder.
2. Given an already completed booking, when it is completed again, then it stays completed and no further email is sent.
3. Given a cancelled booking or an unknown BookingID, when completion is attempted, then it is rejected (“Booking not found” for an unknown ID) and no email is sent.
4. Given an active booking whose arrival date is in the future, when completion is attempted, then it is rejected with a message that the stay has not started, the booking remains active, and no email is sent. On the arrival date itself, or any later date, completion is allowed.
5. Given a completed booking, when it is edited, then the edit follows the normal booking rules, the booking stays completed and no new email is sent; when cancellation is attempted, it is rejected without changing the booking.
6. Given a completed booking, when revenue, occupancy, country and room reports are calculated, then the booking still contributes exactly as it did while active.
7. Given a booking with rooms 001 and 002, when the guest opens the questionnaire link, then they can give a separate rating from 1 to 5 for each room, and each submitted rating is linked to its booking and room (Story 13).
8. Given a room on that booking that has already been rated through the questionnaire, when another rating for the same room is submitted through the link, then it is rejected and the room’s score is unchanged.
9. Given an invalid or unknown questionnaire link, when it is opened or submitted, then no booking information is shown and no rating is recorded.
10. Given an imported historical booking without an email address, when it is completed, then it becomes `completed`, no email is sent, and the receptionist is told that no questionnaire could be sent.
11. Given that sending the email fails, when the booking is completed, then the completion is still saved and the receptionist is told that the questionnaire was not sent.
12. Given a questionnaire link, when the guest answers yes or no to whether they would recommend the hotel, then one answer is saved for that stay, alone or together with room ratings; a second answer for the same stay is rejected without changing the first.
13. Given three answered stays, two answering yes, when the recommendation result is displayed, then it shows 66.7% (2 of 3 guests); with no answers it shows no data (null).

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
  real-world reservations with different IDs. Extra duplicate-submission handling
  has been explicitly declined; normal room-overlap validation still applies.
- Booking selections expose only valid values and never permit manual prices (Q5).
  Guest names are the approved free-text exception (K6). Valid night options remain
  R3. Preserve historical prices; do not silently reprice them using the new tariff.
- Deleted/cancelled bookings are excluded from indicators (Q4), while independent bar
  sales remain valid without a booking (Q20). Completed bookings are not cancellations
  and remain included in every indicator (Story 24).
- A booking can be completed on or after its arrival date, never before; a rejected
  early completion leaves it active and sends no email. Completing a booking sends at
  most one questionnaire email, even when completion is repeated or the stay is edited afterwards; completed bookings remain editable but can no longer be cancelled. A booking without an
  email address can be completed without an email. A failed email does not undo completion.
- Cross-season pricing uses each night’s seasonal tariff, summed across rooms.
  Room revenue is allocated by each occupied night's calendar year, not wholly to the
  arrival year. Historical bar dates are authorized synthetic allocations; walk-in
  bar revenue is excluded from country reports and included in bar/combined totals.
- Saving the same date/drink pair replaces its effective quantity; repeated saves
  do not add quantities or duplicate sales. Unknown booking IDs report “Booking not
  found” without mutation; repeated cancellation changes no totals. Outdated booking
  edits are rejected with a reload message, preserving the first valid save. Ranking
  tie presentation and repeated booking creation remain R7.

Approved historical-enrichment acceptance: given raw bookings with recorded season,
room type, nights, and price, when demonstration records are generated, then:

1. Dates are distributed across 2026; departure equals arrival plus nights.
2. Every occupied night belongs to the recorded source season; departure itself is not
   an occupied night and may be the next season's first date.
3. Each booking receives a room number of its recorded type from the demonstration
   inventory, with no overlapping active stay for that room.
4. Original prices and source identifiers remain unchanged and traceable; generated
   dates and room assignments are explicitly marked synthetic.
5. Generation does not silently change source season, type, nights, or price to solve
   an assignment problem; if no valid placement exists, report the failure. No actual historical date is claimed.

## Requirements *(mandatory)*

### Functional Requirements

| ID | Requirement | Acceptance coverage |
| --- | --- | --- |
| FR-001 | Receptionists MUST be able to create bookings through a browser frontend using typed names, a typed and format-validated booking-holder email address (required for every new booking), a date-picker arrival, and valid fixed-option selections. | Story 1 |
| FR-002 | Receptionists MUST be able to edit guest names, booking holder’s email, booking holder’s country, guest count, rooms, arrival, and nights. BookingID MUST remain fixed; departure, nightly rates, and total price MUST recalculate, and room availability MUST be rechecked before saving. Calculated prices MUST NOT be manually overridden. The first valid edit MUST save; edits based on outdated booking state MUST be rejected with a reload message without overwriting the saved change, through browser and API. | Story 2; R7 |
| FR-003 | Receptionists MUST be able to delete/cancel bookings after browser confirmation; declining MUST change nothing. Cancelled bookings MUST be excluded from active bookings and indicators. Repeated cancellation MUST leave them cancelled without affecting totals again; unknown BookingID MUST report “Booking not found” without mutation through either channel. | Story 3 |
| FR-004 | The existing booking system MUST be able to create, edit, and delete/cancel bookings through the API. | Story 4 |
| FR-005 | Booking behavior across the browser and API follows the same rules (proposed A5); no actor-specific access rights are required (Q6). The local prototype MUST NOT require login or user accounts; booking validation and availability checks still apply. | Stories 1–4 |
| FR-006 | The browser MUST allow typed guest names, a date picker for arrival, and valid selection controls for fixed options; price entry MUST NOT be allowed; invalid submitted booking values MUST be rejected without changing booking data. | Stories 1–4; R3/R7 |
| FR-007 | The booking page MUST refresh after successful creation, edits, and cancellation. API reporting MUST reflect saved changes on the next request. Tableau refresh mechanism and delay remain R9. | Stories 1, 5, 18 |
| FR-008 | The system MUST distinguish booking counts from person counts and attribute each booking and all its guests to the booking holder's country, without inventing missing people. | Story 6; R4 |
| FR-009 | The system MUST show revenue by room type and season; derive season from dates using the confirmed month map. | Story 7; R1/R2 |
| FR-010 | The system MUST attribute each booking's room revenue exactly once to the booking holder's country. Country revenue reports MUST exclude bar revenue, which remains in separate bar and combined hotel totals. | Story 8; R4 |
| FR-011 | The system MUST categorize numbered rooms by type and rank individual rooms by revenue when room assignments and allocation are available. | Story 9; R1/R5 |
| FR-012 | The system MUST rank countries by room-booking revenue only, excluding bar revenue. | Story 10; R4 |
| FR-013 | Annual hotel revenue MUST include all-inclusive room revenue allocated by each occupied night’s calendar year and bar revenue for the same year, with distinct component totals. | Story 11; R2 |
| FR-014 | Annual occupancy MUST use sold room-nights / (214 × 365), expressed as a percentage. Cancelled/deleted bookings do not contribute. | Story 12; R2 |
| FR-015 | The system SHOULD show each room’s arithmetic mean of overall questionnaire ratings from 1 to 5, displayed to one decimal place, or null when it has no responses. Ratings MUST be linked to a booking and one room on that booking; multi-room bookings support separate room ratings. Ratings come only from the guest questionnaire (FR-028); there is no receptionist entry. Responses for cancelled bookings MUST NOT contribute. | Stories 13, 24 |
| FR-016 | The selected additional indicator MUST show room types and the number of rooms of each type. | Story 14; R5 |
| FR-017 | Annual bar sales MUST show both revenue and units sold and be visible to Helene Christine and the administrator. | Story 15; R2 |
| FR-018 | The system MUST show revenue per drink with separate Cocktails, Coffee, Wine, and Beer categories. Overall bar revenue and units MUST include all four categories. | Story 16; R8 |
| FR-019 | Cocktail/coffee percentages MUST use only combined cocktail and coffee revenue as their denominator, excluding wine and beer; display one decimal place. Zero-denominator behavior remains R10. | Story 17 |
| FR-020 | The system MUST provide indicators through the API to an interactive Tableau dashboard. Final interactions are deferred for exploration. | Story 18 |
| FR-021 | The source bookings and bar data MUST be usable as starting data. Authorized historical booking-date enrichment MUST use 2026, be clearly labelled demonstration data, and be based on source seasons; original source values remain identifiable. The authorized generated room inventory MUST be labelled demonstration data; Historical bookings MUST receive available rooms of their source type with no overlaps; every occupied night MUST remain in their recorded source season, and original prices MUST be preserved. Historical bar totals MUST be allocated to labelled synthetic daily records in 2026, preserving per-drink price, total units, and revenue without counting source aggregates twice. | Stories 1, 5–17, 19; A6/R2 |
| FR-022 | No-data results MUST be null. Displayed numeric amounts and percentages MUST use one decimal place; counts remain counts. | Stories 6, 9, 13, 15–18; R10 |
| FR-023 | The system MUST generate a unique BookingID and price, accept selected arrival, and calculate departure as arrival plus nights. Price MUST use the confirmed seasonal tariff with no manual override. Each occupied night MUST use its own date’s seasonal rate; sum nights per room and room totals per booking, excluding departure night. | Stories 1, 2, 4; R1/R2 |
| FR-024 | A booking MUST support multiple guests and multiple selected available room numbers and be held in one guest's name. Overlapping active stays for the same room MUST be rejected; arrival on another stay's departure date MUST be allowed, through both browser and API. Guest-capacity validation is out of scope for this prototype. | Stories 1, 6–9, 12; R4/R5 |
| FR-025 | The closing shift MUST select a sales date and record daily total quantities per drink. Each date/drink pair MUST have one effective quantity; corrections MUST replace rather than add, enabling daily comparisons without double-counting. | Story 19; R8 |
| FR-026 | Bar sales MUST NOT require a booking and MUST include sales to non-resident customers in applicable bar and combined totals. | Stories 11, 15, 19 |
| FR-027 | Receptionists MUST be able to complete an active booking through the browser and API, changing its status to `completed`. Repeated completion MUST change nothing; cancelled or unknown bookings MUST NOT be completed, and a booking MUST NOT be completed before its arrival date. Completed bookings MUST remain editable under the normal booking rules without changing status or resending the email, MUST NOT be cancelled, and MUST remain included in all indicators, as active bookings are. | Story 24 |
| FR-028 | When a booking is completed, the system MUST send one satisfaction questionnaire email to the booking holder’s email address, with a link unique to that booking, and MUST NOT send it again for the same booking. Through the link, the guest MUST be able to give one 1–5 rating per room on the booking; invalid links MUST NOT reveal booking data or record ratings. Bookings without an email address are completed without an email, and a failed email MUST NOT undo completion; in both cases the receptionist is informed. The questionnaire MUST also ask once per stay whether the guest would recommend the hotel (yes/no), and the system MUST show the all-time share of yes answers, displayed to one decimal, or null without answers. | Stories 13, 24 |

### Key Entities *(include if feature involves data)*

These are conceptual requirements, not a technical data model.

- **Booking**: Unique system-generated BookingID (primary identifier), named booking
  holder, manually entered first/last name, manually entered booking-holder email
  (required for new bookings; empty for imported historical bookings, which have none), selected country, multiple guests and rooms,
  room type, nights, date-picker arrival, departure calculated from nights, date-derived
  season, and all-inclusive generated
  price, and status: `active`, `completed` (stay finished, still counted in indicators)
  or `cancelled` (excluded from indicators). Operational fields and source fields are
  distinguished; missing historical dates/guests/rooms are not assumed present.
- **Guest / Booking Holder**: People associated with a booking; one holds the booking.
  For country reporting, the booking and all its guests use the booking holder's
  country. Bar revenue is excluded from country reports; missing historical guest
  counts remain R4.
- **Room / Room Type**: Individual room number mapped to one of the eight source types:
  Standard Single, Grand Lit, Standard Double, Superior Double, Junior Suite,
  Spa Executive, Suite, LOFT Suite. The generated demonstration inventory provides
  the room-number/type mapping. Historical demonstration bookings use available rooms
  of their recorded type; generated assignments are labelled synthetic.
- **Season**: Low = January–March; mid = April, May, September–December;
  high = June–August. For pricing, season is derived separately for each occupied
  night; a booking can span multiple seasons.
- **Reporting Period**: Source year 2026; annual reporting for dated records.
  Demonstration booking dates based on source seasons are authorized and must be labelled;
  demonstration years are 2026, with all occupied nights within the
  source season. New room revenue is allocated by the calendar year of each occupied
  night. Historical bar dates are synthetic allocations within 2026, with source
  prices, quantities, and revenue preserved.
- **Hotel Capacity**: 214 rooms from K1, with the confirmed annual occupancy denominator
  214 × 365. K1 describes 1–4 people per room and approximate maximum guest capacity 428;
  those facts do not provide a complete type-by-type capacity mapping. The user has
  excluded guest-capacity validation from this prototype; room availability is enforced.
- **Drink / Daily Bar Sale**: Drink, category, price, daily quantity, calculated revenue,
  and selected sales date. Each date/drink pair has one effective quantity; corrections
  replace that quantity. Source rows are undated aggregates; authorized daily demonstration records allocate
  their quantities within 2026 with preserved prices and totals. Do not add the
  source aggregates a second time when reporting the generated daily records.
  A hotel booking is optional for bar customers.
- **Questionnaire Response**: One overall rating from 1 to 5 linked to a room number.
  Room satisfaction is the arithmetic mean of its responses, displayed to one decimal;
  no responses gives null. Each response is linked to its booking and a specific room
  on that booking; multi-room bookings can have separate room ratings. Responses come
  only from the guest questionnaire.
- **Satisfaction Questionnaire Invitation**: Created when a booking is completed. Linked to
  one booking, with a unique link, the email address it was sent to, and whether sending
  succeeded. At most one per booking; each room on the booking can be rated once through it,
  and it holds the stay's single yes/no answer to whether the guest would recommend the hotel.

## Success Criteria *(mandatory)*

### Measurable Outcomes

Proposed acceptance measures (A8), not invented service-level targets.

- **SC-001**: Every Must story passes its acceptance criteria with an approved fixture;
  unresolved rules must be settled before that story is declared complete.
- **SC-002**: Unchanged source booking and bar totals match K3, displayed to one decimal
  where appropriate, while identifying the source year as 2026 and exact dates as generated.
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
- **SC-008**: Completing a booking fixture with an email address produces exactly one
  questionnaire email; ratings submitted through its link appear in the room means, and
  the booking’s revenue and occupancy totals are unchanged by completion.

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
  are preserved and attributed to their authorized synthetic room assignments.
- **R2 — Resolved: reporting dates and demonstration enrichment**: Generate historical
  booking dates in 2026 with every occupied night in the source season and available
  rooms of the source type, preserving prices. Generate synthetic daily bar allocations
  over the same years, preserving each drink's original price, units, and revenue.
  Label generated records synthetic and avoid double-counting raw aggregates. New
  booking revenue is attributed to each occupied night's calendar year.
- **R3 — Remaining fixed-option validity**: Typed guest names and a date-picker arrival
  are confirmed. What night counts are valid selections? Country/type catalogs can use
  the supplied data, but any broader allowed catalogs require agreement. No selectable-name
  catalog or random name generation is needed.
- **R4 — Remaining historical guest counts (Q9/Q10)**: Booking counts, all guests
  belonging to a booking, and its room revenue are attributed to the booking holder's
  country. Country revenue reports exclude bar revenue; bar remains in separate and
  combined hotel totals. Historical person counts are absent; do not infer them from
  booking counts or multiply booking revenue by the number of guests.
- **R5 — Resolved: room availability only (Q9/Q11/Q15)**: New/group bookings select
  available rooms; demonstration historical bookings receive available rooms of the
  recorded type. Reject same-room overlaps and allow departure-day arrival. Guest
  capacity checks are out of scope for this prototype; do not invent per-type limits.
  Retain guest counts for reporting. Inventory and historical assignments are synthetic.
- **R6 — Resolved: satisfaction collection (Q14; revised 2026-11-03)**: Guests give an
  overall 1–5 rating for each room of their completed stay through the emailed
  questionnaire (Story 24); receptionist entry is removed. Multi-room bookings can
  receive separate room ratings. Show the arithmetic mean per room to one decimal,
  or null with no responses. Historical responses are absent and are not generated.
- **R7 — Remaining booking behavior (Q1/Q5/Q6)**: Editable fields and automatic
  recalculation are confirmed. First valid save succeeds; outdated edits are rejected
  with a reload message. Unknown IDs report “Booking not found” without mutation; browser
  cancellation requires confirmation, and repeated cancellation changes no totals.
  Extra duplicate-creation handling is declined. Ranking tie presentation remains open. Unique
  BookingID prevents duplicate identifiers, not equivalent bookings with different IDs.
  No login or user accounts are required for the local prototype.
- **R8 — Remaining bar inputs (Q8/Q16)**: Daily quantity per date/drink and replacement
  on correction are confirmed. Cocktails, Coffee, Wine, and Beer are separate categories;
  the cocktail/coffee comparison excludes wine/beer, while overall totals include them.
  How are valid quantities selected and prices/catalog populated, including missing
  wine/beer menu items? No extra menu values or historical sales are invented.
- **R9 — Deferred: Tableau integration and refresh (user-owned)**: Browser refresh after
  successful booking creation/edit/cancellation and current API results on the next
  request remain confirmed. The user will investigate the Tableau Public Edition
  connection and refresh approach. Continue the other work without choosing a connector,
  exporter, refresh schedule, or publishing platform. Dashboard requirements remain;
  final integration/validation must await this decision. Dashboard interaction design
  remains deliberately deferred for exploration.
- **R10 — Display boundary cases (Q19)**: Null for no data and one decimal for amounts/
  percentages are confirmed. Does a zero denominator with records also return null,
  and which tie-rounding rule applies? No-data null must not erase a genuine numeric zero.


## Remaining reporting implementation scope — 2026-11-03

User instruction: implement the remaining reports and room-linked questionnaire entry;
Tableau remains explicitly deferred. Existing country attribution, nightly prices,
season map, fixed 214 × 365 occupancy denominator and no-login decision remain in force.

Acceptance criteria for this increment:
- Optional report year filters occupied nights in that calendar year; no year means
  all saved years. A booking is counted once within each scope if it has eligible nights,
  even if it has multiple rooms. Cross-year bookings can appear in both annual counts.
- Country revenue excludes bar sales. Known guest counts are summed once per booking;
  if any booking has unknown guests, the complete guestCount is null, with knownGuestCount
  and unknownGuestBookingCount exposed separately. No historical people are inferred.
- Type/season and room totals sum saved nightly charges exactly once and reconcile
  with room revenue. All 24 type/season combinations and 214 numbered rooms remain visible;
  combinations without records have null revenue. Country and room lists sort by exact
  revenue descending; equal values remain equal, with alphabetical/room-number ordering
  solely for stable display. No business rank-number/tie-breaking policy is introduced.
- Summary exposes current booking/person/night counts and annual occupancy. Without a
  year, occupancy is null: a multi-year operational scope is not treated as one year. With no
  eligible room nights annual occupancy is null. Counts use zero for an empty scope.
- Inventory counts unique room numbers by type, totals 214 and never changes with bookings.
- Through the questionnaire link of a completed stay, the guest gives a whole 1–5 rating
  per room, once per room; each saved rating is one actual questionnaire response. Reject
  invalid numbers, unknown links, repeated ratings and unrelated rooms without writing. No historical ratings
  are generated. Means/counts update on the next request and show null without responses.
- Satisfaction is explicitly labelled all-time and is independent of the financial year
  selector; no annual satisfaction attribution rule is invented. Cancelled bookings are
  excluded from reporting. Recorded feedback keeps its original room link when a booking
  is edited. Prototype assumption: only active bookings are offered for new entries;
  each POST represents a distinct questionnaire, not a correction or overwrite. Correction
  and duplicate-questionnaire policies remain open; the UI must not imply otherwise.
- Overview shows these API-calculated figures in expandable sections, with selected-year
  labels, no-data/errors distinguished, synthetic provenance and keyboard/mobile access.
- Bar report already supplies drink/category calculations; expose a documented drinks
  report alias for API consumers without adding unprovided wine/beer products.

Verify fixtures for multi-room/cross-year and mixed-known guest counts; edits/cancellation;
source country/type/season reconciliation; exact and tied revenues; inventory invariance;
ratings 2/4/5 => 3.7, invalid room/rating rejection, cancelled exclusion and persistence.


## Interactive country revenue map — 2026-11-03

User request: replace Guest markets & highest-earning countries with an interactive
world map. Higher saved room revenue uses deeper blue; lower revenue uses lighter blue.
Acceptance: selected year/all years keeps the existing API scope and holder-country
attribution; a labelled linear color legend shows actual minimum/maximum recorded
revenue. Equal values use equal colors; countries without revenue records are neutral
gray, distinct from a recorded zero. Hover/focus and click/tap reveal country revenue,
bookings, complete/known guest counts and unknown-booking count without inventing data.
The selection also works through a labelled country dropdown and keyboard. Zoom/reset
and drag panning support small countries. Failed/loading report updates clear stale
colors/details; empty scopes state no data. Unmapped names remain selectable and are
identified rather than silently dropped. Other report tables remain unchanged.


## Seasonal room-revenue bar chart — 2026-11-03

Replace the type/season table presentation with grouped bars: Revenue (DKK) on the
vertical axis and Low/Mid/High seasons on the horizontal axis. Each season groups
one bar per room type, using a fixed legend of the same pale-to-deep blue palette.
The existing API and selected year/all-year scope remain authoritative. Color identifies
room type consistently across seasons, while bar height represents revenue. Show exact
formatted values and room-nights on hover/focus/selection. Optional legend controls
hide/show types without modifying data. Missing revenue is not a zero bar; recorded zero
has an explicit baseline marker. Retain the source table in a closed data disclosure.
Clear stale bars on loading/error, show empty states, and support keyboard/mobile use.


## Always-visible report cards — 2026-11-03

User request supersedes expandable report sections and closed data disclosures. All
Overview graphs and tables must appear in fixed rectangular cards as the user scrolls,
without clicking headings to reveal them. Headings are static; chart/map controls,
financial year selection and table/plot scrolling remain available.


## Simple satisfaction table — 2026-11-03

User request: show satisfaction as a simple table with rating and room type; real data
will arrive later. Overview displays one row per room type and only Room type/Rating.
Ratings use the arithmetic mean of actual questionnaire responses for that type, not
an unweighted mean of room averages. Keep one decimal and null/No data without responses.
Do not generate scores. Existing per-room API and questionnaire entry remain available.

Visual follow-up: the satisfaction table uses the same blue palette as the map/chart,
with a deep-blue header, pale-blue rows and blue text/borders.


## Authoritative source-year correction — 2026-11-03

The user corrects the previous three-year premise: the complete workbook belongs to
2026. This supersedes every earlier 2024–2026 source-horizon instruction in this spec.
All workbook bookings/room-nights and bar quantities belong to 2026, preserving source
seasons, room types, nights, prices, quantities and totals. Exact dates and room numbers
remain generated, not observed. Guest counts and questionnaire data remain unknown.

Existing installations must migrate once transactionally, preserving booking IDs,
statuses, original source evidence and unrelated manual records. Do not delete volumes,
reset the database or re-import duplicate bookings. Reassign generated room dates/numbers
without overlaps against existing operational stays. Preserve saved bar totals and skip
manual date/drink keys. Keep old immutable evidence and append a correction marker;
restart must not repeat the correction or overwrite later edits. Validate totals and
rollback on errors. Fresh clones must import directly into 2026. Update UI provenance,
report years and current documentation so workbook data is no longer described as three
years. Unrelated genuine operational years may remain selectable when records exist.


## Fixed Overview year — 2026-11-03

User request removes the Reporting year dropdown. Overview displays static 2026 and
all financial charts, map and summary requests always use year=2026, including refresh
and browser return. Inventory/satisfaction retain their existing all-time meanings.
The general API year support and separate booking/bar controls are unchanged.


## Eight room-type colors — 2026-11-03

The user replaces the seasonal chart's blue shades with eight distinct colors, one per
room type. Each type retains its color across seasons, filters and the legend. Other
visualizations and all financial values remain unchanged.

Room-type palette refinement: use eight related muted sage/forest/teal/slate/mauve/
rose/clay/sand colors that complement the warm hotel frontend, retaining distinct and
consistent room-type identities in bars and legend. This replaces the bright palette.


## Seasonal numeric table styling — 2026-11-03

User request: Seasonal data remains a numeric table and uses the same room-type color
coding as the chart. Increase text, numeric amounts and row spacing. Keep all rows
visible while scrolling the page, with horizontal table scrolling on small screens.
No extra chart/icons or changes to data/financial calculations.


## Readable revenue bar details — 2026-11-03

User requests larger readable information on hovering a revenue bar. Replace native
small popups with a large styled tooltip showing type, season, revenue and room-nights.
Keyboard focus and touch/click retain access; keep the below-chart detail text larger.
Hide stale tooltips on filtering/refresh, support Escape and keep mobile content within
the chart width. No calculation or data changes.


## Top-ten horizontal room revenue — 2026-11-03

User requests Highest-earning rooms as horizontal bars, defaulting to the ten highest
recorded room revenues, with an option to show all rooms and return to top ten. Use
existing exact API order without invented tie ranks. Display room number/type, revenue
and room-nights directly, matching type colors. All mode includes rooms without revenue
as No data; top mode uses recorded revenues only. Preserve fixed 2026 and data/error rules.
