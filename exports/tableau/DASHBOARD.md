# Hotel Kong Arthur Tableau dashboard

Open `Tableau_Dashboard.twbx` from the repository root. It packages the native
workbook and all 11 Hyper extracts, so a teammate does not need the author's local
Tableau repository. `Tableau_Dashboard.twb` is the editable workbook XML and uses
the extracts under `exports/tableau/data/`.

## Views and assignment coverage

| Assignment / frontend view | Native Tableau worksheet |
| --- | --- |
| Guest countries and highest-earning countries | Filled country map shaded by room revenue; separate descending country revenue chart |
| Guests by country | Known guest counts, with unknown-guest booking counts in detail; missing historical people are not invented |
| Revenue per room type and season | Grouped vertical bars, Low / Mid / High; eight frontend room colors |
| Seasonal figures | Room type × season revenue table, using the same colors |
| Highest-earning rooms | Ten highest-revenue rooms as horizontal bars; separate all-rooms worksheet |
| Annual hotel revenue | Hotel, room and bar revenue KPI cards |
| Additional interesting KPI | Annual occupancy, with booking and sold room-night cards |
| Inventory | Room counts per type; 214 demonstration rooms |
| Satisfaction | Rating table by room type, overall stay rating and would-recommend percentage; all-time |
| Helene Christine's annual sales | Annual bar revenue and units sold |
| Revenue per drink | Horizontal bars for all supplied drinks |
| Cocktail / coffee split | API-calculated percentage cards and category revenue bars |

The two dashboard tabs are **Hotel Overview · 2026** and
**Helene Christine’s Bar · 2026**. Worksheets remain available for editing and
exploration, including all 214 rooms. Native map pan/zoom, mark selection and
tooltips are retained. Cross-source dashboard filtering is not configured.

## Data and refresh

All values are fetched from the same local REST reports used by the staff frontend.
There are no joins between independently aggregated reports. Monetary API strings
are converted with `FLOAT` in named Tableau calculation fields before aggregation.
Source strings retain their exact decimal values in the extract. Financial scope
is 2026. Inventory and satisfaction are not annual reports.

The included extracts are a snapshot, not automatic polling. The workbook connects
directly to native Hyper files because the installed REST plugin failed package
signature verification. No plugin or relaxed signature checks are needed to open
this version. API URLs and JSON paths are recorded in the manifest and build script.
Tableau's Refresh command reads the Hyper snapshot; it does not fetch new API data.
To fetch new report data, close this workbook and regenerate it with the app running:

```bash
python3 -m venv /tmp/hotel-tableau-venv
/tmp/hotel-tableau-venv/bin/pip install tableauhyperapi==0.0.26479
/tmp/hotel-tableau-venv/bin/python scripts/tableau/build_dashboard.py --extracts
```

Regeneration replaces the generated charts and extracts, so preserve a separate
copy if you have made manual Tableau layout changes. Runtime containers and the
application's Node dependencies are unchanged by this optional authoring tool.

`dashboard-data-manifest.json` records fetch time, source URLs, JSON paths, row
counts and reconciliation controls. Countries, rooms and seasons each reconcile
to room revenue; drink revenue reconciles to bar revenue; the two components
reconcile to total hotel revenue. No guest names, emails or questionnaire tokens
are included. Unknown ratings remain null, and historical dates and allocations
remain explicitly labelled demonstration data.

## Verification boundary

Hyper files were created and queried with Tableau's official Hyper API. API revenue
controls and packaged-file references passed. The installed Tableau reader rejected
sorting and explain-data elements accepted by the published 2026.1 schema; these
were replaced with native computed sort attributes and the unsupported explain-data
block was removed. Both TWB and packaged TWBX were checked for the corrected five
sort definitions and absence of rejected elements. All 11 source connections now use
native Hyper, with no REST plugin reference in either workbook file. Successful
native rendering still needs verification; XML checks alone are insufficient.
