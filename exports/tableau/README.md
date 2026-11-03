# Tableau JSON snapshot

room-revenue-by-type-season-2026.json contains the 24 room-type/season rows used by the
Overview revenue chart, fetched from the running PostgreSQL-backed report API:
GET http://localhost:3000/api/reports/room-types-seasons?year=2026

Created 2026-11-03. This is a snapshot; it does not automatically refresh after bookings
change. All current active 2026 bookings are included, including manually created ones.
Revenue uses saved room-night charges, excluding cancelled bookings and departure nights.
The API remains the live source. This export does not select a Tableau live connector.

Fields: year, currency, roomType, season, seasonOrder (low=1/mid=2/high=3), roomRevenue
(numeric DKK for aggregation in Tableau), soldRoomNights and containsSyntheticData.
Null revenue remains null; JSON monetary literals were checked against the API's exact
decimal values. containsSyntheticData marks generated exact dates/room assignments.
The workbook belongs to 2026; the original source is Hotel_Kong_Arthur_data-1.xlsx,
with validated source extraction in backend/src/startup/workbook-history.json. The chart
uses current database values, so this export can differ from immutable workbook totals.
