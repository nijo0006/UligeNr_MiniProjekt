"""Read-only source extraction. Runtime uses the checked-in JSON, not Python/Excel."""
import hashlib,json
from decimal import Decimal
from pathlib import Path
import openpyxl
root=Path(__file__).resolve().parents[2]
source=root/'Hotel_Kong_Arthur_data-1.xlsx'
w=openpyxl.load_workbook(source,read_only=True,data_only=True)
amount=lambda value:format(Decimal(str(value)),'.2f')
bookings=[]
for rownum,row in enumerate(w['Bookinger'].iter_rows(min_row=2,values_only=True),2):
    if row[0] is None:continue
    sid,first,last,country,room,nights,season,total,nightly=row
    bookings.append(dict(sourceBookingId=sid,sourceRow=rownum,firstName=first,lastName=last,country=country,roomType=room,nights=nights,season=season,totalPrice=amount(total),nightlyPrice=amount(nightly)))
bar=[]
for rownum,row in enumerate(w['Bar - Drinks'].iter_rows(values_only=True),1):
    name,category,price,units,revenue,share,rank=row
    if category not in ('Cocktail','Kaffe'):continue
    bar.append(dict(sourceRow=rownum,name=name,sourceCategory=category,category={'Cocktail':'Cocktails','Kaffe':'Coffee'}[category],unitPrice=amount(price),units=units,revenue=amount(revenue),sourceRevenueShare=str(share),sourceRevenueRank=rank))
assert len(bookings)==1000 and len(bar)==30
assert sum(Decimal(b['totalPrice']) for b in bookings)==Decimal('11234034.00')
assert sum(b['nights'] for b in bookings)==5379
assert all(Decimal(b['nightlyPrice'])*b['nights']==Decimal(b['totalPrice']) for b in bookings)
assert sum(b['units'] for b in bar)==179958
assert sum(Decimal(b['revenue']) for b in bar)==Decimal('13448640.34')
assert all(Decimal(b['unitPrice'])*b['units']==Decimal(b['revenue']) for b in bar)
payload=dict(bookings=bookings,bar=bar)
canonical=json.dumps(payload,ensure_ascii=False,separators=(',',':'))
fixture=dict(sourceFile=source.name,workbookSha256=hashlib.sha256(source.read_bytes()).hexdigest(),payloadSha256=hashlib.sha256(canonical.encode()).hexdigest(),payload=payload)
target=root/'backend/src/startup/workbook-history.json'
target.write_text(json.dumps(fixture,ensure_ascii=False,indent=2)+'\n')
print('Validated source extract: 1000 bookings / 5379 nights / DKK 11234034.00; 179958 bar units / DKK 13448640.34')
