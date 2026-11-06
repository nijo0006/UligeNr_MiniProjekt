"""Build the native Tableau workbook using the same REST reports as the staff UI.

No guest data is embedded. Portable workbooks use native Hyper connections;
run with --extracts to fetch fresh report data from the running local API.
The workbook before this change is preserved in /tmp by the authoring workflow.
"""
from pathlib import Path
from copy import deepcopy
import uuid
import xml.etree.ElementTree as E
import argparse
import json
from datetime import datetime, timezone
from decimal import Decimal
from urllib.request import urlopen
from zipfile import ZipFile, ZIP_DEFLATED

ROOT = Path(__file__).resolve().parents[2]
TARGET = ROOT / 'Tableau_Dashboard.twb'
TEMPLATE = Path('/tmp/Tableau_Dashboard-before-hotel-charts.twb')
BLUE = '#153f6c'
ROOM_COLORS = {
    'Standard Single': '#6f8e85', 'Grand Lit': '#496b60',
    'Standard Double': '#789ba0', 'Superior Double': '#657f98',
    'Junior Suite': '#918296', 'Spa Executive': '#b28b87',
    'Suite': '#b28768', 'LOFT Suite': '#b5a078',
}


def sub(parent, tag, text=None, **attrs):
    item = E.SubElement(parent, tag, {k.replace('_', '-'): str(v) for k, v in attrs.items()})
    item.text = text
    return item


def ident(label):
    return str(uuid.uuid5(uuid.NAMESPACE_URL, 'hotel-kong-arthur/' + label)).upper()


def fmt(parent, **items):
    for key, value in items.items():
        sub(parent, 'format', attr=key.replace('_', '-'), value=value)


tree = E.parse(TEMPLATE if TEMPLATE.exists() else TARGET)
root = tree.getroot()
for tag in ['datasources', 'worksheets', 'dashboards', 'windows', 'thumbnails', 'explain-data']:
    for item in root.findall(tag):
        root.remove(item)
sources = sub(root, 'datasources')
maps = root.find('mapsources')
if maps is not None:
    root.remove(maps)
else:
    maps = E.Element('mapsources')
    sub(maps, 'mapsource', name='Tableau')
root.append(maps)
worksheets = sub(root, 'worksheets')
dashboards = sub(root, 'dashboards')
windows = sub(root, 'windows', source_height='30')
registry = {}
api_cache = {}
evidence = {}
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--extracts', action='store_true', help='Fetch REST reports and create portable Hyper extracts and TWBX (requires tableauhyperapi).')
parser.add_argument('--api', default='http://localhost:3000/api', help='Base URL of the running app\'s API, e.g. http://localhost:3001/api if APP_PORT=3001.')
args = parser.parse_args()
API = args.api.rstrip('/') + '/'
if not args.extracts:
    parser.error('Use --extracts to refresh API data and build the portable Hyper workbook.')
if args.extracts:
    from tableauhyperapi import HyperProcess, Telemetry, Connection, CreateMode, TableDefinition, TableName, SqlType, Inserter
    hyper = HyperProcess(Telemetry.DO_NOT_SEND_USAGE_DATA_TO_TABLEAU, parameters={'log_config': ''})


def attach_extract(ds, con, fields, key, endpoint, path, oid, obj):
    if not args.extracts:
        return
    url = API + endpoint
    if url not in api_cache:
        with urlopen(url, timeout=30) as response:
            api_cache[url] = json.load(response)
    rows = api_cache[url]
    for part in path.removeprefix('$').strip('.').split('.'):
        if part:
            rows = rows[part]
    if isinstance(rows, dict):
        rows = [rows]
    relative = Path('exports/tableau/data') / (key + '.hyper')
    output = ROOT / relative
    output.parent.mkdir(parents=True, exist_ok=True)
    types = {'string': SqlType.text(), 'integer': SqlType.big_int(), 'real': SqlType.double(), 'boolean': SqlType.bool()}
    table = TableDefinition(TableName('Extract', 'Extract'), [TableDefinition.Column(field, types[dtype]) for field, dtype, _ in fields])
    values = [[row.get(field) for field, *_ in fields] for row in rows]
    with Connection(hyper.endpoint, str(output), CreateMode.CREATE_AND_REPLACE) as connection:
        connection.catalog.create_schema('Extract')
        connection.catalog.create_table(table)
        with Inserter(connection, table) as inserter:
            inserter.add_rows(values)
            inserter.execute()
        count = connection.execute_scalar_query('SELECT COUNT(*) FROM "Extract"."Extract"')
        assert count == len(rows), key
    extract = sub(ds, 'extract', count='-1', enabled='true', object_id='', units='records', user_specific='false')
    # Extract must precede layout and object-graph in Tableau's document order.
    ds.remove(extract)
    ds.insert(list(ds).index(ds.find('layout')), extract)
    xc = sub(extract, 'connection', access_mode='readonly', authentication='auth-none',
             author_locale='en_US', **{'class': 'hyper'}, dbname=relative.as_posix(),
             default_settings='yes', schema='Extract', sslmode='', tablename='Extract', username='tableau_internal_user')
    sub(xc, 'relation', name='Extract', table='[Extract].[Extract]', type='table')
    xr = sub(xc, 'metadata-records')
    for i, rec in enumerate(con.findall('./metadata-records/metadata-record')):
        copy = deepcopy(rec)
        copy.find('ordinal').text = str(i)
        copy.find('parent-name').text = '[Extract]'
        if copy.find('local-type').text == 'integer':
            copy.find('remote-type').text = '20'
        xr.append(copy)
    sub(sub(obj, 'properties', context='extract'), 'relation', name='Extract', table='[Extract].[Extract]', type='table')
    evidence[key] = {'url': url, 'jsonPath': path, 'rows': len(rows), 'extract': relative.as_posix()}


def datasource(key, caption, endpoint, fields, path='$', calculations=None):
    name = 'federated.hotel_' + key
    ncname = 'tableau_rest.hotel_' + key
    oid = 'rest_table_' + ident(key).replace('-', '')
    ds = sub(sources, 'datasource', caption=caption, inline='true', name=name, version='18.1')
    con = sub(ds, 'connection', **{'class': 'federated'})
    nc = sub(sub(con, 'named-connections'), 'named-connection', caption=endpoint, name=ncname)
    sub(nc, 'connection', authentication='auth-none', **{
        'class': 'tableau_rest', 'one-time-sql': '', 'server': API + endpoint,
        'username': '', 'v-connectTimeout': '30', 'v-csvDelimiter': '', 'v-format': 'JSON',
        'v-headers': '', 'v-jsonPath': path, 'v-limit': '', 'v-limitName': '',
        'v-offsetName': '', 'v-recordPageProcessor': 'NONE', 'v-tableName': 'rest_table',
        'v-trustAllCerts': 'false',
    })
    relation = sub(con, 'relation', connection=ncname, name='rest_table',
                   table='[rest_schema].[rest_table]', type='table')
    records = sub(con, 'metadata-records')
    columns = {}
    for ordinal, (field, dtype, label) in enumerate(fields, 1):
        rec = sub(records, 'metadata-record', **{'class': 'column'})
        for tag, value in [('remote-name', field), ('remote-type', {'string': 129, 'integer': 3, 'real': 5, 'boolean': 11}[dtype]),
                           ('local-name', f'[{field}]'), ('parent-name', '[rest_table]'),
                           ('remote-alias', field), ('ordinal', ordinal), ('local-type', dtype),
                           ('aggregation', 'Sum' if dtype in ['integer', 'real'] else 'Count'),
                           ('contains-null', 'true'), ('object-id', f'[{oid}]')]:
            sub(rec, tag, text=str(value))
    sub(ds, 'aliases', enabled='yes')
    sub(ds, 'column', caption='Measure Names', datatype='string', name='[:Measure Names]', role='dimension', type='nominal')
    sub(ds, 'column', caption='Measure Values', datatype='real', name='[Multiple Values]', role='measure', type='quantitative')
    sub(ds, 'column', caption='rest_table', datatype='table', name=f'[__tableau_internal_object_id__].[{oid}]', role='measure', type='quantitative')
    for field, dtype, label in fields:
        numeric = dtype in ['integer', 'real']
        c = sub(ds, 'column', caption=label, datatype=dtype, name=f'[{field}]',
                role='measure' if numeric else 'dimension', type='quantitative' if numeric else 'nominal')
        if field == 'country':
            c.set('semantic-role', '[Country].[ISO3166_2]')
        columns[field] = c
    for field, (formula, dtype, label) in (calculations or {}).items():
        numeric = dtype in ['real', 'integer']
        c = sub(ds, 'column', caption=label, datatype=dtype, name=f'[{field}]',
                role='measure' if numeric else 'dimension', type='quantitative' if numeric else 'nominal')
        sub(c, 'calculation', **{'class': 'tableau', 'formula': formula})
        columns[field] = c
    # Monetary strings from the API must be explicitly converted before SUM.
    for field, c in columns.items():
        if c.get('datatype') in ['real', 'integer']:
            c.set('default-format', '#,##0.0' if c.get('datatype') == 'real' else '#,##0')
    sub(ds, 'layout', dim_ordering='alphabetic', measure_ordering='alphabetic', show_structure='true')
    obj = sub(sub(sub(ds, 'object-graph'), 'objects'), 'object', caption=caption, id=oid)
    sub(obj, 'properties', context='').append(deepcopy(relation))
    attach_extract(ds, con, fields, key, endpoint, path, oid, obj)
    registry[key] = (name, caption, columns)


datasource('countries', 'Guest markets · 2026', 'reports/countries?year=2026', [
    ('country', 'string', 'Country'), ('bookingCount', 'integer', 'Bookings'),
    ('knownGuestCount', 'integer', 'Known guests'), ('unknownGuestBookingCount', 'integer', 'Bookings with unknown guests'),
    ('guestCount', 'integer', 'Guests'), ('roomRevenue', 'string', 'Room revenue (API)'),
    ('containsSyntheticData', 'boolean', 'Contains demonstration allocations')], calculations={
        'RevenueDKK': ('FLOAT([roomRevenue])', 'real', 'Room revenue · DKK')})
datasource('seasons', 'Room types and seasons · 2026', 'reports/room-types-seasons?year=2026', [
    ('roomType', 'string', 'Room type'), ('season', 'string', 'Season code'),
    ('roomRevenue', 'string', 'Room revenue (API)'), ('soldRoomNights', 'integer', 'Sold room-nights'),
    ('containsSyntheticData', 'boolean', 'Contains demonstration allocations')], calculations={
        'RevenueDKK': ('FLOAT([roomRevenue])', 'real', 'Room revenue · DKK'),
        'SeasonLabel': ('CASE [season] WHEN "low" THEN "1 · Low" WHEN "mid" THEN "2 · Mid" WHEN "high" THEN "3 · High" END', 'string', 'Season')})
datasource('rooms', 'Room performance · 2026', 'reports/rooms?year=2026', [
    ('roomNumber', 'string', 'Room'), ('roomType', 'string', 'Room type'),
    ('roomRevenue', 'string', 'Room revenue (API)'), ('soldRoomNights', 'integer', 'Sold room-nights'),
    ('containsSyntheticData', 'boolean', 'Contains demonstration allocations')], calculations={
        'RevenueDKK': ('FLOAT([roomRevenue])', 'real', 'Room revenue · DKK')})
datasource('inventory', 'Room inventory · 214 rooms', 'reports/inventory', [
    ('roomType', 'string', 'Room type'), ('roomCount', 'integer', 'Rooms'), ('synthetic', 'boolean', 'Demonstration inventory')])
datasource('satisfaction', 'Guest satisfaction · all time', 'reports/satisfaction?groupBy=roomType', [
    ('roomType', 'string', 'Room type'), ('responseCount', 'integer', 'Responses'), ('meanRating', 'real', 'Mean rating')], calculations={
        'RatingLabel': ('IF ISNULL([meanRating]) THEN "No data" ELSE STR(ROUND([meanRating], 1)) + " / 5" END', 'string', 'Rating')})
datasource('summary', 'Hotel overview · 2026', 'reports/summary?year=2026', [
    ('year', 'integer', 'Year'), ('bookingCount', 'integer', 'Bookings'),
    ('soldRoomNights', 'integer', 'Sold room-nights'), ('knownGuestCount', 'integer', 'Known guests'),
    ('unknownGuestBookingCount', 'integer', 'Bookings with unknown guests'),
    ('roomRevenue', 'string', 'Room revenue (API)'), ('barRevenue', 'string', 'Bar revenue (API)'),
    ('totalRevenue', 'string', 'Hotel revenue (API)'), ('occupancyPercent', 'real', 'Annual occupancy · %'),
    ('containsSyntheticData', 'boolean', 'Contains demonstration allocations')], calculations={
        'RevenueDKK': ('FLOAT([totalRevenue])', 'real', 'Hotel revenue · DKK'),
        'RoomRevenueDKK': ('FLOAT([roomRevenue])', 'real', 'Room revenue · DKK'),
        'BarRevenueDKK': ('FLOAT([barRevenue])', 'real', 'Bar revenue · DKK')})
datasource('drinks', 'Drink performance · 2026', 'reports/drinks?year=2026', [
    ('drinkId', 'integer', 'Drink ID'), ('name', 'string', 'Drink'), ('category', 'string', 'Category'),
    ('units', 'integer', 'Units sold'), ('revenue', 'string', 'Revenue (API)')], calculations={
        'RevenueDKK': ('FLOAT([revenue])', 'real', 'Revenue · DKK')})
datasource('bar', 'Helene Christine · 2026', 'reports/bar?year=2026', [
    ('year', 'integer', 'Year'), ('revenue', 'string', 'Bar revenue (API)'), ('units', 'integer', 'Units sold'),
    ('cocktailPercent', 'real', 'Cocktail revenue share · %'), ('coffeePercent', 'real', 'Coffee revenue share · %')], calculations={
        'RevenueDKK': ('FLOAT([revenue])', 'real', 'Bar revenue · DKK')})
datasource('mix', 'Cocktails and coffee · 2026', 'reports/bar?year=2026', [
    ('category', 'string', 'Category'), ('units', 'integer', 'Units sold'), ('revenue', 'string', 'Revenue (API)')], path='$.categories', calculations={
        'RevenueDKK': ('FLOAT([revenue])', 'real', 'Revenue · DKK')})
datasource('overall', 'Whole-stay satisfaction · all time', 'reports/stay-feedback', [
    ('meanRating', 'real', 'Overall stay rating'), ('responseCount', 'integer', 'Responses')], path='$.overall')
datasource('recommend', 'Guest recommendations · all time', 'reports/stay-feedback', [
    ('recommendPercent', 'real', 'Would recommend · %'), ('responseCount', 'integer', 'Responses')], path='$.recommendation')


def sheet(title, key, rows=(), cols=(), mark='Bar', color=None, text=None,
          details=(), tooltip=None, sort=None, top=None, kpi=False, blue_scale=False):
    name, caption, columns = registry[key]
    ws = sub(worksheets, 'worksheet', name=title)
    table = sub(ws, 'table')
    view = sub(table, 'view')
    sub(sub(view, 'datasources'), 'datasource', caption=caption, name=name)
    if mark == 'Multipolygon':
        view.append(deepcopy(maps))
    deps = sub(view, 'datasource-dependencies', datasource=name)
    # Include calculation inputs as well as fields placed on shelves. Tableau's
    # query compiler needs the monetary source string when compiling FLOAT().
    for column in columns.values():
        deps.append(deepcopy(column))
    # A field tuple is (field name, derivation); None means a discrete dimension.
    usages = list(rows) + list(cols) + list(details)
    for entry in [color, text]:
        if entry:
            usages.append(entry)
    if sort:
        usages.extend(sort)
    if top:
        usages.extend(top[:2])
    instances = {}
    for field, agg in usages:
        if (field, agg) in instances:
            continue
        if field not in columns:
            continue
        if not any(c.get('name') == f'[{field}]' for c in deps.findall('column')):
            deps.append(deepcopy(columns[field]))
        token = f'[{agg.lower() if agg else "none"}:{field}:{"qk" if agg else "nk"}]'
        sub(deps, 'column-instance', column=f'[{field}]', derivation=agg or 'None', name=token,
            pivot='key', type='quantitative' if agg else 'nominal')
        instances[field, agg] = token

    def ref(entry):
        field, agg = entry
        return f'[{name}].{instances.get(entry, "[" + field + "]")}'

    if top:
        dimension, measure, count = top
        fil = sub(view, 'filter', **{'class': 'categorical', 'column': ref(dimension)})
        gf = sub(fil, 'groupfilter', function='end', count=str(count), end='top', units='records')
        ordered = sub(gf, 'groupfilter', function='order', direction='DESC', expression=ref(measure))
        sub(ordered, 'groupfilter', function='level-members', level=ref(dimension))
    if sort:
        sub(view, 'sort', **{'class': 'computed'}, column=ref(sort[0]), direction='DESC', using=ref(sort[1]))
    sub(view, 'aggregation', value='true')
    style = sub(table, 'style')
    default = sub(style, 'style-rule', element='worksheet')
    fmt(default, font_family='Barlow', font_size='11', color='#263e56', background_color='#ffffff')
    cell = sub(style, 'style-rule', element='cell')
    fmt(cell, font_size='30' if kpi else '12', color=BLUE)
    grid = sub(style, 'style-rule', element='gridline')
    fmt(grid, line_visibility='off')
    pane = sub(sub(table, 'panes'), 'pane', selection_relaxation_option='selection-relaxation-allow')
    sub(sub(pane, 'view'), 'breakdown', value='auto')
    sub(pane, 'mark', **{'class': mark})
    enc = sub(pane, 'encodings')
    if color:
        sub(enc, 'color', column=ref(color))
    if text:
        sub(enc, 'text', column=ref(text))
    for entry in details:
        sub(enc, 'lod', column=ref(entry))
    if mark == 'Multipolygon':
        sub(enc, 'geometry', column=f'[{name}].[Geometry (generated)]')
    if tooltip:
        formatted = sub(sub(pane, 'customized-tooltip', show_buttons='true'), 'formatted-text')
        sub(formatted, 'run', text=tooltip, fontsize='15', fontcolor='#263e56')
    pstyle = sub(pane, 'style')
    rule = sub(pstyle, 'style-rule', element='mark')
    fmt(rule, color=BLUE, mark_labels_show='true' if text else 'false', font_size='28' if kpi else '12')
    if color:
        if blue_scale:
            encoding = sub(rule, 'encoding', attr='color', field=ref(color), type='palette', palette='Blue', min='0')
            pal = sub(encoding, 'color-palette', name='Hotel revenue blue', type='ordered-sequential', custom='true')
            sub(pal, 'color', text='#dceaf6')
            sub(pal, 'color', text='#153f6c')
        else:
            encoding = sub(rule, 'encoding', attr='color', field=ref(color), type='palette')
            palette = ROOM_COLORS if color[0] == 'roomType' else {'Cocktails': '#153f6c', 'Coffee': '#789ba0', 'Wine': '#918296', 'Beer': '#b5a078'}
            for label, value in palette.items():
                sub(sub(encoding, 'map', to=value), 'bucket', text='"' + label + '"')
    sub(table, 'rows', text=' / '.join(ref(e) for e in rows))
    sub(table, 'cols', text=' / '.join(ref(e) for e in cols))
    sub(ws, 'simple-id', uuid='{' + ident(title) + '}')
    win = sub(windows, 'window', **{'class': 'worksheet', 'name': title})
    cards = sub(win, 'cards')
    topedge = sub(cards, 'edge', name='top')
    for card in ['columns', 'rows', 'title']:
        sub(sub(topedge, 'strip', size='31' if card == 'title' else '2147483647'), 'card', type=card)
    if color:
        sub(sub(sub(cards, 'edge', name='right'), 'strip', size='160'), 'card', type='color', pane_specification_id='0')
    sub(win, 'simple-id', uuid='{' + ident('window/' + title) + '}')
    return title


D = lambda name: (name, None)
S = lambda name: (name, 'Sum')
A = lambda name: (name, 'Avg')

sheet('Hotel revenue · DKK', 'summary', mark='Text', text=S('RevenueDKK'), kpi=True)
sheet('Room revenue · DKK', 'summary', mark='Text', text=S('RoomRevenueDKK'), kpi=True)
sheet('Bar revenue · DKK', 'summary', mark='Text', text=S('BarRevenueDKK'), kpi=True)
sheet('Annual occupancy · %', 'summary', mark='Text', text=A('occupancyPercent'), kpi=True)
sheet('Sold room-nights', 'summary', mark='Text', text=S('soldRoomNights'), kpi=True)
sheet('Bookings · 2026', 'summary', mark='Text', text=S('bookingCount'), kpi=True)
sheet('Guest markets & highest-earning countries', 'countries',
      rows=[D('Latitude (generated)')], cols=[D('Longitude (generated)')], mark='Multipolygon',
      color=S('RevenueDKK'), details=[D('country'), S('bookingCount'), S('guestCount')], blue_scale=True)
sheet('Guests by country', 'countries', rows=[D('country')], cols=[S('guestCount')],
      text=S('guestCount'), details=[S('bookingCount')], sort=(D('country'), S('guestCount')))
sheet('Country revenue · DKK', 'countries', rows=[D('country')], cols=[S('RevenueDKK')],
      color=S('RevenueDKK'), sort=(D('country'), S('RevenueDKK')), blue_scale=True)
sheet('Room revenue by type & season', 'seasons', rows=[S('RevenueDKK')], cols=[D('SeasonLabel'), D('roomType')],
      color=D('roomType'), details=[S('soldRoomNights')])
sheet('Seasonal data · revenue DKK', 'seasons', rows=[D('roomType')], cols=[D('SeasonLabel')],
      mark='Text', color=D('roomType'), text=S('RevenueDKK'), details=[S('soldRoomNights')])
sheet('Highest-earning rooms · Top 10', 'rooms', rows=[D('roomNumber')], cols=[S('RevenueDKK')],
      color=D('roomType'), text=S('RevenueDKK'), details=[S('soldRoomNights')],
      sort=(D('roomNumber'), S('RevenueDKK')), top=(D('roomNumber'), S('RevenueDKK'), 10))
sheet('Highest-earning rooms · all rooms', 'rooms', rows=[D('roomNumber')], cols=[S('RevenueDKK')],
      color=D('roomType'), details=[S('soldRoomNights')], sort=(D('roomNumber'), S('RevenueDKK')))
sheet('Room overview', 'inventory', rows=[D('roomType')], mark='Text', text=S('roomCount'), color=D('roomType'))
sheet('Rating by room type · 1–5', 'satisfaction', rows=[D('roomType')], cols=[A('meanRating')], color=D('roomType'),
      text=A('meanRating'), details=[S('responseCount')], sort=(D('roomType'), A('meanRating')))
sheet('Overall stay rating · 1–5', 'overall', mark='Text', text=A('meanRating'), kpi=True)
sheet('Would recommend the hotel · %', 'recommend', mark='Text', text=A('recommendPercent'), kpi=True)
sheet('Helene Christine · annual revenue DKK', 'bar', mark='Text', text=S('RevenueDKK'), kpi=True)
sheet('Helene Christine · annual units sold', 'bar', mark='Text', text=S('units'), kpi=True)
sheet('Cocktails · revenue share %', 'bar', mark='Text', text=A('cocktailPercent'), kpi=True)
sheet('Coffee · revenue share %', 'bar', mark='Text', text=A('coffeePercent'), kpi=True)
sheet('Revenue per drink · DKK', 'drinks', rows=[D('name')], cols=[S('RevenueDKK')], color=D('category'),
      text=S('RevenueDKK'), details=[S('units')], sort=(D('name'), S('RevenueDKK')))
sheet('Cocktails & coffee · revenue DKK', 'mix', rows=[D('category')], cols=[S('RevenueDKK')], color=D('category'), text=S('RevenueDKK'))


def dashboard(name, width, height, placements, subtitle, headings=()):
    db = sub(dashboards, 'dashboard', enable_sort_zone_taborder='true', name=name)
    style = sub(db, 'style')
    fmt(sub(style, 'style-rule', element='dashboard'), background_color='#f4efea')
    sub(db, 'size', maxheight=height, maxwidth=width, minheight=height, minwidth=width)
    zones = sub(db, 'zones')
    layout = sub(zones, 'zone', h=100000, id=1, type_v2='layout-basic', w=100000, x=0, y=0)
    def zone(zoneid, x, y, w, h, **attrs):
        return sub(layout, 'zone', id=zoneid, x=round(x/width*100000), y=round(y/height*100000),
                   w=round(w/width*100000), h=round(h/height*100000), **attrs)
    header = zone(2, 24, 14, width-48, 66, type_v2='text')
    ft = sub(header, 'formatted-text')
    sub(ft, 'run', text='HOTEL KONG ARTHUR  /  2026\n', bold='true', fontsize='23', fontname='Barlow', fontcolor=BLUE)
    sub(ft, 'run', text=subtitle, fontsize='11', fontname='Barlow', fontcolor='#596e7f')
    for i, (title, x, y, w, h) in enumerate(placements, 3):
        z = zone(i, x, y, w, h, name=title, show_title='true')
        zs = sub(z, 'zone-style')
        fmt(zs, background_color='#ffffff', border_color='#ddd2c5', border_style='solid', border_width='1', margin='6', padding='12')
    # Section headings group related worksheets, like the frontend's "Guest satisfaction".
    for i, (text, x, y, w, h) in enumerate(headings, len(placements)+3):
        ft = sub(zone(i, x, y, w, h, type_v2='text'), 'formatted-text')
        sub(ft, 'run', text=text, fontsize='17', fontname='Barlow', fontcolor=BLUE)
    footer = zone(len(placements)+len(headings)+3, 24, height-68, width-48, 52, type_v2='text')
    ft = sub(footer, 'formatted-text')
    sub(ft, 'run', text='Source: local REST API / PostgreSQL. 2026 financial data; satisfaction is all-time.',
        fontsize='10', fontname='Barlow', fontcolor='#596e7f')
    sub(db, 'simple-id', uuid='{' + ident('dashboard/' + name) + '}')
    win = sub(windows, 'window', **{'class': 'dashboard', 'name': name})
    viewpoints = sub(win, 'viewpoints')
    for title, *_ in placements:
        sub(sub(viewpoints, 'viewpoint', name=title), 'zoom', type='entire-view')
    sub(win, 'active', id='-1')
    sub(win, 'simple-id', uuid='{' + ident('dashboardwindow/' + name) + '}')


dashboard('Hotel Overview · 2026', 1600, 2200, [
    ('Hotel revenue · DKK', 24, 90, 500, 150), ('Room revenue · DKK', 536, 90, 500, 150), ('Bar revenue · DKK', 1048, 90, 528, 150),
    ('Annual occupancy · %', 24, 252, 500, 130), ('Bookings · 2026', 536, 252, 500, 130), ('Sold room-nights', 1048, 252, 528, 130),
    ('Guest markets & highest-earning countries', 24, 394, 1000, 440), ('Country revenue · DKK', 1036, 394, 540, 440),
    ('Room revenue by type & season', 24, 846, 1000, 430), ('Highest-earning rooms · Top 10', 1036, 846, 540, 430),
    ('Seasonal data · revenue DKK', 24, 1288, 1000, 400), ('Room overview', 1036, 1288, 540, 400),
    ('Guests by country', 24, 1700, 740, 420), ('Rating by room type · 1–5', 776, 1742, 800, 236),
    ('Overall stay rating · 1–5', 776, 1990, 394, 130), ('Would recommend the hotel · %', 1182, 1990, 394, 130),
], 'Hotel operations and performance · annual occupancy is the additional KPI · use worksheets to explore all rooms',
    headings=[('Guest satisfaction', 782, 1700, 788, 38)])
dashboard('Helene Christine’s Bar · 2026', 1600, 1280, [
    ('Helene Christine · annual revenue DKK', 24, 90, 760, 150), ('Helene Christine · annual units sold', 796, 90, 780, 150),
    ('Cocktails · revenue share %', 24, 252, 370, 140), ('Coffee · revenue share %', 406, 252, 378, 140),
    ('Cocktails & coffee · revenue DKK', 796, 252, 780, 300), ('Revenue per drink · DKK', 24, 564, 1552, 630),
], 'Closing-shift sales · cocktail/coffee shares use revenue and exclude wine and beer')

if args.extracts:
    # Even an enabled extract can make Tableau instantiate its original connector
    # while loading. Bind directly to Hyper so no REST plugin is required to open.
    for ds in sources:
        extract = ds.find('extract')
        connection = deepcopy(extract.find('connection'))
        ds.remove(ds.find('connection'))
        ds.remove(extract)
        ds.insert(0, connection)
        for obj in ds.findall('./object-graph/objects/object'):
            for properties in list(obj.findall('properties')):
                obj.remove(properties)
            sub(obj, 'properties', context='').append(deepcopy(connection.find('relation')))

sub(root, 'thumbnails')
E.indent(root, space='  ')
E.ElementTree(root).write(TARGET, encoding='utf-8', xml_declaration=True)
print(f'Wrote {TARGET.name}: {len(sources)} native Hyper sources, {len(worksheets)} worksheets, {len(dashboards)} dashboards')
if args.extracts:
    # Reconcile independent reports before packaging: never join unrelated aggregates.
    summary = api_cache[API + 'reports/summary?year=2026']
    for key in ['countries', 'rooms', 'seasons']:
        rows = api_cache[evidence[key]['url']]
        total = sum((Decimal(row['roomRevenue']) for row in rows if row['roomRevenue'] is not None), Decimal(0))
        assert total == Decimal(summary['roomRevenue']), (key, total, summary['roomRevenue'])
        evidence[key]['roomRevenueControl'] = str(total)
    drinks = api_cache[evidence['drinks']['url']]
    bar_total = sum((Decimal(row['revenue']) for row in drinks if row['revenue'] is not None), Decimal(0))
    assert bar_total == Decimal(summary['barRevenue'])
    assert Decimal(summary['totalRevenue']) == Decimal(summary['roomRevenue']) + bar_total
    manifest = {'fetchedAt': datetime.now(timezone.utc).isoformat(), 'year': 2026,
                'hotelRevenueDKK': summary['totalRevenue'], 'roomRevenueDKK': summary['roomRevenue'],
                'barRevenueDKK': str(bar_total), 'sources': evidence, 'connectionMode': 'native-hyper-api-snapshot',
                'visualVerification': 'Not completed: native app control unavailable; workbook structure and API controls checked.'}
    (ROOT / 'exports/tableau/dashboard-data-manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
    with ZipFile(TARGET.with_suffix('.twbx'), 'w', ZIP_DEFLATED) as package:
        package.write(TARGET, TARGET.name)
        for value in evidence.values():
            package.write(ROOT / value['extract'], value['extract'])
    hyper.close()
    print('Reconciled country/room/season reports against summary and all drinks against bar revenue. Packaged Tableau_Dashboard.twbx.')
