import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium, expect } from '@playwright/test';

const origin = process.env.APP_BASE_URL || 'http://127.0.0.1:3000';
test('staff booking page creates, reloads, edits and cancels while reports stay current', async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors=[]; page.on('pageerror', error => errors.push(error.message));
  let id;
  try {
    await page.goto(`${origin}/staff/bookings`);
    await expect(page.locator('#room-type-gallery .room-type-card')).toHaveCount(8);
    await expect.poll(()=>page.locator('#room-type-gallery img').evaluateAll(images=>images.filter(img=>img.complete&&img.naturalWidth>0).length)).toBe(8);
    const expectedPhotos={'Standard Single':'standard-single.jpg','Grand Lit':'grand-lit.jpg','Standard Double':'standard-double.jpg','Superior Double':'superior-double.jpg','Junior Suite':'junior-suite.jpg','Spa Executive':'spa-executive.jpg','Suite':'suite.jpg','LOFT Suite':'loft-suite.jpg'};
    for(const [type,file] of Object.entries(expectedPhotos)){
      const card=page.getByRole('button',{name:`Show ${type} rooms`,exact:true});
      await expect(card.locator('img')).toHaveAttribute('src',`/assets/rooms/${file}`);
      await card.click();await expect(page.getByLabel('Room type',{exact:true})).toHaveValue(type);
      await expect(card).toHaveAttribute('aria-pressed','true');
    }
    await page.evaluate(async()=>{await document.fonts.ready;});
    assert.ok(await page.evaluate(()=>getComputedStyle(document.body).fontFamily.includes('Barlow')&&Array.from(document.fonts).some(f=>f.family==='Barlow'&&f.status==='loaded')));
    await page.locator('#room-type-gallery').screenshot({path:'/tmp/hotel-room-type-photos.png'});

    const readReport = async year => {
      const response = await fetch(`${origin}/api/reports/revenue?year=${year}`);
      assert.equal(response.status,200); return response.json();
    };
    const baseline = (await readReport(2026)).roomRevenue;
    await page.getByLabel('First name', { exact:true }).fill('Browser verification');
    await page.getByLabel('Last name', { exact:true }).fill('Demonstration');
    await page.getByLabel('Booking holder’s country').selectOption('Denmark');
    await page.getByLabel('Arrival', { exact:true }).fill('2026-05-31');
    await page.getByLabel('Nights', { exact:true }).selectOption('2');
    await page.getByLabel('Room type', { exact:true }).selectOption('Standard Single');
    const firstRoom=page.locator('#rooms input[type=checkbox]').first();
    await firstRoom.waitFor(); await firstRoom.locator('..').click(); await expect(firstRoom).toBeChecked();
    await expect(page.locator('#price')).toContainText(/2[.,]491[.,]0/);
    const created=page.waitForResponse(r=>r.url().endsWith('/api/bookings')&&r.request().method()==='POST');
    await page.getByRole('button',{name:'Create booking',exact:true}).click();
    const response=await created; assert.equal(response.status(),201);
    id=(await response.json()).bookingId;
    let row=page.locator(`[data-booking-id="${id}"]`);
    await expect(row).toContainText('Browser verification Demonstration');
    assert.equal(Number((await readReport(2026)).roomRevenue),Number(baseline || 0)+2491);
    await page.reload(); await expect(row).toContainText(/2[.,]491[.,]0/);
    await row.getByRole('button',{name:'Edit booking'}).click();
    await expect(page.locator('#form-title')).toHaveText(`Edit booking #${id}`);
    await page.getByLabel('Nights',{exact:true}).selectOption('3');
    await expect(page.locator('#price')).toContainText(/3[.,]830[.,]0/);
    await page.getByRole('button',{name:'Save changes'}).click();
    await expect(row).toContainText(/3[.,]830[.,]0/);
    assert.equal(Number((await readReport(2026)).roomRevenue),Number(baseline || 0)+3830);
    page.once('dialog',dialog=>dialog.dismiss());
    await row.getByRole('button',{name:'Cancel booking'}).click();
    await expect(row).toBeVisible();
    page.once('dialog',dialog=>dialog.accept());
    await row.getByRole('button',{name:'Cancel booking'}).click();
    await expect(row).toHaveCount(0);
    assert.equal((await readReport(2026)).roomRevenue,baseline);
    // Cancel the edit form's smooth scroll before capturing a stable viewport.
    await page.evaluate(() => window.scrollTo({top:0,left:0,behavior:'instant'}));
    await page.screenshot({path:process.env.SCREENSHOT_PATH || '/tmp/hotel-bookings-desktop.png',fullPage:true});
    await page.setViewportSize({width:390,height:844});
    await page.evaluate(() => window.scrollTo({top:0,left:0,behavior:'instant'}));
    await page.screenshot({path:'/tmp/hotel-bookings-mobile.png'});
    assert.deepEqual(errors,[]);
  } catch (error) {
    await page.screenshot({path:'/tmp/hotel-booking-browser-failure.png',fullPage:true});
    throw error;
  } finally {
    if(id) await fetch(`${origin}/api/bookings/${id}`,{method:'DELETE'});
    await browser.close();
  }
});

test('staff home icon links open independent workspaces on desktop and mobile',async()=>{
  const browser=await chromium.launch({channel:'chrome',headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  const errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));
  page.on('request',r=>{if(new URL(r.url()).pathname.startsWith('/api/'))requests.push(new URL(r.url()).pathname);});
  try{
    await page.goto(origin);
    await expect(page.locator('.workspace-card')).toHaveCount(3);
    await expect(page.locator('#booking-form')).toHaveCount(0);assert.equal(requests.length,0);
    await page.screenshot({path:'/tmp/hotel-staff-home.png',fullPage:true});
    await page.getByRole('link',{name:'Open overview',exact:true}).focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(`${origin}/staff/overview`);
    await expect(page.locator('.revenue-result')).toHaveAttribute('aria-busy','false');
    await expect(page.locator('#booking-form')).toHaveCount(0);await expect(page.locator('#bar-form')).toHaveCount(0);
    assert.ok(!requests.includes('/api/drinks'));assert.ok(!requests.includes('/api/reports/bar'));
    requests.length=0;
    await page.getByRole('link',{name:'Bookings',exact:true}).click();
    await expect(page).toHaveURL(`${origin}/staff/bookings`);
    await expect(page.locator('#reservation-count')).toContainText('active');
    await expect(page.locator('#annual-room-revenue')).toHaveCount(0);await expect(page.locator('#bar-form')).toHaveCount(0);
    assert.ok(!requests.some(p=>p.startsWith('/api/reports/')));
    requests.length=0;
    await page.getByRole('link',{name:'Helene’s bar',exact:true}).click();
    await expect(page).toHaveURL(`${origin}/staff/bar`);
    await expect(page.locator('#drink-revenue tr')).toHaveCount(30);
    await expect(page.locator('#booking-form')).toHaveCount(0);assert.ok(!requests.includes('/api/bookings'));
    await page.screenshot({path:'/tmp/hotel-staff-bar-page.png'});
    await page.getByRole('link',{name:'Home',exact:true}).click();
    await page.setViewportSize({width:390,height:844});
    await page.screenshot({path:'/tmp/hotel-staff-home-mobile.png',fullPage:true});
    await page.getByRole('link',{name:'Open bookings',exact:true}).click();
    await expect(page.locator('#booking-form')).toBeVisible();
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth));
    assert.deepEqual(errors,[]);
  }finally{await browser.close();}
});

test('staff bar form replaces daily quantity and displays API revenue without writing live bar data',async()=>{
  const browser=await chromium.launch({channel:'chrome',headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  const menu=await (await fetch(`${origin}/api/drinks`)).json();
  const drink=menu.find(d=>d.name==='Espresso');
  let quantity=null;
  try{
    // Controlled HTTP fixtures exercise the bar UI; real SQL correction/mix behavior is
    // covered by isolated integration tests, keeping the user's actual bar data untouched.
    await page.route('**/api/bar-sales?date=*',route=>route.fulfill({json:{salesDate:'2026-11-02',sales:quantity===null?[]:[{drinkId:drink.drinkId,quantity,unitPrice:'69.10',revenue:(quantity*69.1).toFixed(2)}]}}));
    await page.route('**/api/bar-sales/*/*',async route=>{quantity=route.request().postDataJSON().quantity;await route.fulfill({json:{salesDate:'2026-11-02',drinkId:drink.drinkId,quantity,unitPrice:'69.10',revenue:(quantity*69.1).toFixed(2)}});});
    await page.route('**/api/reports/bar?year=*',route=>route.fulfill({json:{year:2026,currency:'DKK',revenue:quantity===null?null:(quantity*69.1).toFixed(2),units:quantity,cocktailPercent:quantity?0:null,coffeePercent:quantity?100:null,mixStatus:quantity?'available':'no_data',categories:[],drinks:[{...drink,units:quantity,revenue:quantity===null?null:(quantity*69.1).toFixed(2)}]}}));
    await page.goto(`${origin}/staff/bar`);
    await expect(page.locator('#bar-revenue')).toHaveText('No data');
    await page.getByLabel('Sales date',{exact:true}).fill('2026-11-02');
    await page.getByLabel('Drink',{exact:true}).selectOption(String(drink.drinkId));
    await expect(page.locator('#daily-saved')).toContainText('No closing quantity');
    await page.getByLabel('Units sold today').selectOption('10');
    await page.getByRole('button',{name:'Save daily sales'}).click();
    await expect(page.locator('#bar-save-status')).toContainText('Saved 10 units');
    await expect(page.locator('#bar-units')).toHaveText('10');
    await page.getByLabel('Units sold today').selectOption('12');
    await page.getByRole('button',{name:'Save daily sales'}).click();
    await expect(page.locator('#bar-save-status')).toContainText('Saved 12 units');
    await expect(page.locator('#bar-units')).toHaveText('12');
    await expect(page.locator('#bar-mix')).toHaveText('0.0% / 100.0%');
    await page.locator('#bar').scrollIntoViewIfNeeded();
    await page.screenshot({path:'/tmp/hotel-staff-bar-verification.png'});
  }finally{await browser.close();}
});

test('staff browses historical bookings and reporting across the separate pages',async()=>{
  const browser=await chromium.launch({channel:'chrome',headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:1100}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const format=value=>new Intl.NumberFormat('en-DK',{style:'currency',currency:'DKK',minimumFractionDigits:1,maximumFractionDigits:1}).format(Number(value));
  try{
    await page.goto(`${origin}/staff/overview`);
    await expect(page.locator('#history-status')).toContainText('Excel bookings');
    await expect(page.locator('#history-controls')).toContainText(format('11234034.00'));
    await page.getByRole('button',{name:'Refresh revenue',exact:true}).click();
    const room=await(await fetch(`${origin}/api/reports/revenue?year=2026`)).json();
    await expect(page.locator('#annual-room-revenue')).toHaveText(format(room.roomRevenue));assert.equal(room.containsSyntheticData,true);
    await expect(page.locator('#annual-bar-revenue')).toHaveText(format(room.barRevenue));
    await expect(page.locator('#annual-hotel-revenue')).toHaveText(format(room.totalRevenue));
    await expect(page.locator('#revenue-status')).toContainText('demonstration dates');
    await page.screenshot({path:'/tmp/hotel-staff-overview.png'});
    await page.route('**/api/reports/revenue?year=*',route=>route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({message:'Verification outage'})}));
    await page.getByRole('button',{name:'Refresh revenue',exact:true}).click();
    await expect(page.locator('#annual-room-revenue')).toHaveText('Unavailable');
    await expect(page.locator('#annual-bar-revenue')).toHaveText('Unavailable');
    await expect(page.locator('#annual-hotel-revenue')).toHaveText('Unavailable');
    await page.unroute('**/api/reports/revenue?year=*');
    await page.getByRole('button',{name:'Refresh revenue',exact:true}).click();
    await expect(page.locator('#annual-room-revenue')).toHaveText(format(room.roomRevenue));
    await page.getByRole('link',{name:'Bookings',exact:true}).click();
    await page.getByLabel('Booking year',{exact:true}).selectOption('2026');
    await expect(page.locator('#bookings .reservation')).toHaveCount(25);
    await expect(page.locator('#bookings .source-label').first()).toContainText('demonstration dates');
    await page.getByRole('button',{name:'Next bookings',exact:true}).click();
    await expect(page.locator('#booking-page-status')).toContainText('Showing 26–50');
    const books=await(await fetch(`${origin}/api/bookings`)).json();
    const target=books.find(b=>b.sourceId&&b.arrival.startsWith('2026'));
    await page.getByLabel('Search bookings',{exact:true}).fill(`#${target.bookingId}`);
    await expect(page.locator('#bookings .reservation')).toHaveCount(1);
    await expect(page.locator(`[data-booking-id="${target.bookingId}"]`)).toContainText('Unknown guests');
    await page.getByRole('link',{name:'Helene’s bar',exact:true}).click();
    await page.getByLabel('Bar reporting year',{exact:true}).selectOption('2026');
    const bar=await(await fetch(`${origin}/api/reports/bar?year=2026`)).json();assert.equal(bar.containsSyntheticData,true);
    await expect(page.locator('#bar-revenue')).toHaveText(format(bar.revenue));
    assert.deepEqual(errors,[]);
  }finally{await browser.close();}
});


test('annual hotel overview distinguishes missing components, recorded zero and no data on desktop and mobile',async()=>{
  const browser=await chromium.launch({channel:'chrome',headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  let values={roomRevenue:null,barRevenue:'50.00',totalRevenue:'50.00'};
  const format=value=>new Intl.NumberFormat('en-DK',{style:'currency',currency:'DKK',minimumFractionDigits:1,maximumFractionDigits:1}).format(Number(value));
  try{
    await page.route('**/api/reports/revenue?year=*',route=>route.fulfill({json:{year:Number(new URL(route.request().url()).searchParams.get('year')),currency:'DKK',containsSyntheticData:false,...values}}));
    await page.goto(`${origin}/staff/overview`);
    await expect(page.locator('#annual-room-revenue')).toHaveText('No data');
    await expect(page.locator('#annual-bar-revenue')).toHaveText(format('50.00'));
    await expect(page.locator('#annual-hotel-revenue')).toHaveText(format('50.00'));
    values={roomRevenue:'0.00',barRevenue:null,totalRevenue:'0.00'};
    await page.getByRole('button',{name:'Refresh revenue',exact:true}).click();
    await expect(page.locator('#annual-room-revenue')).toHaveText(format('0.00'));
    await expect(page.locator('#annual-bar-revenue')).toHaveText('No data');
    await expect(page.locator('#annual-hotel-revenue')).toHaveText(format('0.00'));
    values={roomRevenue:null,barRevenue:null,totalRevenue:null};
    await page.getByRole('button',{name:'Refresh revenue',exact:true}).click();
    for(const id of ['annual-room-revenue','annual-bar-revenue','annual-hotel-revenue'])await expect(page.locator(`#${id}`)).toHaveText('No data');
    await expect(page.locator('#revenue-status')).toContainText('No room-nights or bar sales');
    await page.unroute('**/api/reports/revenue?year=*');
    await page.getByRole('button',{name:'Refresh revenue',exact:true}).click();
    const actual=await(await fetch(`${origin}/api/reports/revenue?year=2026`)).json();
    await expect(page.locator('#annual-hotel-revenue')).toHaveText(format(actual.totalRevenue));
    await page.screenshot({path:'/tmp/hotel-annual-revenue-desktop.png',fullPage:true});
    await page.setViewportSize({width:390,height:844});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    await page.screenshot({path:'/tmp/hotel-annual-revenue-mobile.png',fullPage:true});
  }finally{await browser.close();}
});

test('remaining Overview reports use fixed 2026, recover from failures and fit mobile',async()=>{
  const browser=await chromium.launch({channel:'chrome',headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:1100}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  try{
    await page.goto(`${origin}/staff/overview`);
    await page.getByRole('button',{name:'Refresh revenue',exact:true}).click();
    await expect(page.locator('#operational-reports')).toHaveAttribute('aria-busy','false');
    const summary=await(await fetch(`${origin}/api/reports/summary?year=2026`)).json();
    await expect(page.locator('#occupancy')).toHaveText(`${summary.occupancyPercent.toFixed(1)}%`);
    await expect(page.locator('#sold-nights')).toHaveText(new Intl.NumberFormat('en-DK').format(summary.soldRoomNights));
    await expect(page.locator('#guest-note')).toContainText('unknown guest counts');
    const countries=await(await fetch(`${origin}/api/reports/countries?year=2026`)).json();
    await expect(page.locator('#country-report tr')).toHaveCount(countries.length);
    await expect(page.locator('#country-report tr').first().locator('td').first()).toHaveText(countries[0].country);
    await expect(page.locator('#season-report tr')).toHaveCount(24);
    await expect(page.locator('#operational-reports details, #operational-reports summary')).toHaveCount(0);
    await expect(page.locator('#inventory-report')).toBeVisible();
    await expect(page.locator('#satisfaction-report')).toBeVisible();
    await expect(page.locator('#room-report .room-bar-row')).toHaveCount(10);
    const rooms=await(await fetch(`${origin}/api/reports/rooms?year=2026`)).json();
    assert.deepEqual(await page.locator('#room-report .room-bar-row').evaluateAll(items=>items.map(e=>e.dataset.roomNumber)),rooms.filter(r=>r.roomRevenue!==null).slice(0,10).map(r=>r.roomNumber));
    await expect(page.locator('#room-report .room-bar-row').first()).toContainText(new Intl.NumberFormat('en-DK',{style:'currency',currency:'DKK',minimumFractionDigits:1,maximumFractionDigits:1}).format(Number(rooms[0].roomRevenue)));
    await page.getByRole('button',{name:'Show all rooms (214)',exact:true}).click();
    await expect(page.locator('#room-report .room-bar-row')).toHaveCount(214);
    await expect(page.locator('#room-chart-toggle')).toHaveAttribute('aria-pressed','true');
    await page.getByRole('button',{name:'Show top 10',exact:true}).click();
    await expect(page.locator('#room-report .room-bar-row')).toHaveCount(10);
    await page.locator('.room-chart-report').screenshot({path:'/tmp/hotel-top-rooms-desktop.png'});
    await expect(page.locator('#inventory-report tr')).toHaveCount(8);
    await expect(page.locator('#satisfaction-report tr')).toHaveCount(8);
    await expect(page.locator('[aria-labelledby=room-feedback-title] th')).toHaveText(['Room type','Rating']);
    await page.getByRole('button',{name:'Refresh revenue',exact:true}).click();
    await expect(page.locator('#report-year')).toHaveText('2026');
    await expect(page.locator('select#report-year')).toHaveCount(0);
    await expect(page.locator('#revenue-status')).toContainText('Calendar year 2026');
    await expect(page.locator('#country-report')).toContainText('South Korea');
    await expect(page.locator('#season-chart')).toBeVisible();
    await expect(page.locator('#season-report')).toBeVisible();
    await expect(page.locator('#room-report')).toBeVisible();
    await page.screenshot({path:'/tmp/hotel-complete-reports-desktop.png',fullPage:true});
    await page.locator('[aria-labelledby=room-feedback-title]').screenshot({path:'/tmp/hotel-satisfaction-types.png'});
    await page.route('**/api/reports/countries*',route=>route.fulfill({status:503,json:{message:'Report test outage'}}));
    await page.getByRole('button',{name:'Refresh revenue',exact:true}).click();
    await expect(page.locator('#reports-error')).toContainText('Report test outage');
    await expect(page.locator('#country-report tr')).toHaveCount(0);
    await expect(page.locator('#occupancy')).toHaveText('Unavailable');
    await page.unroute('**/api/reports/countries*');
    await page.getByRole('button',{name:'Refresh revenue',exact:true}).click();
    await expect(page.locator('#reports-error')).toBeHidden();
    await expect(page.locator('#country-report tr').first()).toBeVisible();
    await page.setViewportSize({width:390,height:844});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    await page.screenshot({path:'/tmp/hotel-complete-reports-mobile.png',fullPage:true});
    await page.locator('.room-chart-report').screenshot({path:'/tmp/hotel-top-rooms-mobile.png'});
    assert.deepEqual(errors,[]);
  }finally{await browser.close();}
});

test('receptionist records room questionnaires through API fixtures without writing live satisfaction data',async()=>{
  const browser=await chromium.launch({channel:'chrome',headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  const bookings=await(await fetch(`${origin}/api/bookings`)).json();const target=bookings[0];let submitted;
  try{
    await page.route('**/api/satisfaction',async route=>{
      submitted=route.request().postDataJSON();
      await route.fulfill({status:201,json:{...submitted,responseId:999,recordedAt:'2026-11-03T12:00:00.000Z'}});
    });
    await page.goto(`${origin}/staff/bookings`);
    await page.getByLabel('Search bookings').fill(`#${target.bookingId}`);
    await page.locator(`[data-booking-id="${target.bookingId}"]`).getByRole('button',{name:'Record satisfaction',exact:true}).click();
    await expect(page.getByLabel('Questionnaire booking',{exact:true})).toHaveValue(String(target.bookingId));
    await expect(page.getByLabel('Questionnaire room',{exact:true}).locator('option')).toHaveCount(target.roomNumbers.length+1);
    await page.getByLabel('Questionnaire room',{exact:true}).selectOption(target.roomNumbers[0]);
    await page.getByLabel('Overall satisfaction',{exact:true}).selectOption('4');
    await page.getByRole('button',{name:'Record questionnaire',exact:true}).click();
    await expect(page.locator('#questionnaire-status')).toContainText('Questionnaire #999 recorded');
    assert.deepEqual(submitted,{bookingId:target.bookingId,roomNumber:target.roomNumbers[0],rating:4});
    await page.unroute('**/api/satisfaction');
    await page.route('**/api/satisfaction',route=>route.fulfill({status:400,json:{message:'Questionnaire test rejection'}}));
    await page.getByLabel('Overall satisfaction',{exact:true}).selectOption('3');
    await page.getByRole('button',{name:'Record questionnaire',exact:true}).click();
    await expect(page.locator('#questionnaire-status')).toContainText('Questionnaire test rejection');
    await expect(page.getByRole('button',{name:'Record questionnaire',exact:true})).toBeEnabled();
    await page.locator('#questionnaire').screenshot({path:'/tmp/hotel-questionnaire-desktop.png'});
    await page.setViewportSize({width:390,height:844});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    await page.locator('#questionnaire').screenshot({path:'/tmp/hotel-questionnaire-mobile.png'});
  }finally{await browser.close();}
});

test('country map uses scoped blue revenue colors and supports selection, keyboard, zoom, missing/zero data and recovery',async()=>{
  const browser=await chromium.launch({channel:'chrome',headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:1100}});
  const format=value=>new Intl.NumberFormat('en-DK',{style:'currency',currency:'DKK',minimumFractionDigits:1,maximumFractionDigits:1}).format(Number(value));
  const row=(country,roomRevenue)=>({country,roomRevenue,bookingCount:3,guestCount:null,knownGuestCount:2,unknownGuestBookingCount:1,containsSyntheticData:true});
  let values=[row('South Korea','300.00'),row('United States','100.00'),row('China','100.00'),row('Denmark','0.00')];
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  try{
    await page.route('**/api/reports/countries*',route=>route.fulfill({json:values}));
    await page.goto(`${origin}/staff/overview`);
    const country=code=>page.locator(`#country-map path[data-country-code="${code}"]`);
    await expect(page.locator('#country-map path')).toHaveCount(176);
    await expect(country('KOR')).toHaveAttribute('fill','rgb(15, 64, 128)');
    await expect(country('DNK')).toHaveAttribute('fill','rgb(219, 234, 254)');
    assert.equal(await country('USA').getAttribute('fill'),await country('CHN').getAttribute('fill'));
    await expect(country('BRA')).toHaveAttribute('fill','#e2e3e2');
    await expect(page.locator('#map-legend-min')).toHaveText(format('0'));
    await expect(page.locator('#map-legend-max')).toHaveText(format('300'));
    await country('CHN').focus();await page.keyboard.press('Enter');
    await expect(page.locator('#map-country-name')).toHaveText('China');
    await expect(page.locator('#map-country-revenue')).toHaveText(format('100'));
    await expect(page.locator('#map-country-guests')).toHaveText('Unknown');
    await expect(page.locator('#map-country-known')).toHaveText('2');
    await expect(page.locator('#map-country-note')).toContainText('subtotal');
    await page.getByLabel('Explore a country',{exact:true}).selectOption('United States');
    await expect(country('USA')).toHaveAttribute('aria-pressed','true');
    await country('KOR').click();
    await expect(page.locator('#map-country-name')).toHaveText('South Korea');
    await page.getByRole('button',{name:'Zoom in on map',exact:true}).click();
    await expect(page.locator('#map-zoom-status')).toHaveText('150%');
    const before=await page.locator('#country-map > g').getAttribute('transform');
    await page.locator('#country-map').focus();await page.keyboard.press('ArrowRight');
    assert.notEqual(await page.locator('#country-map > g').getAttribute('transform'),before);
    const beforeDrag=await page.locator('#country-map > g').getAttribute('transform');
    const bounds=await page.locator('#country-map').boundingBox();
    await page.mouse.move(bounds.x+bounds.width/2,bounds.y+bounds.height/2);
    await page.mouse.down();await page.mouse.move(bounds.x+bounds.width/2+45,bounds.y+bounds.height/2+25,{steps:5});await page.mouse.up();
    assert.notEqual(await page.locator('#country-map > g').getAttribute('transform'),beforeDrag);
    await expect(page.locator('#map-country-name')).toHaveText('South Korea');
    await page.getByRole('button',{name:'Reset map',exact:true}).click();
    await expect(page.locator('#map-zoom-status')).toHaveText('100%');
    await page.locator('.country-map-report').screenshot({path:'/tmp/hotel-country-map-desktop.png'});
    values=[row('United States','0.00')];
    await page.getByRole('button',{name:'Refresh revenue',exact:true}).click();
    await expect(country('KOR')).toHaveAttribute('data-has-data','false');
    await expect(page.locator('#map-country-revenue')).toHaveText('No data');
    await page.getByLabel('Explore a country',{exact:true}).selectOption('United States');
    await expect(page.locator('#map-country-revenue')).toHaveText(format('0'));
    await expect(country('USA')).toHaveAttribute('data-has-data','true');
    values=[];
    await page.getByRole('button',{name:'Refresh revenue',exact:true}).click();
    await expect(page.locator('#map-state')).toHaveText('No country revenue recorded for this period.');
    await expect(country('USA')).toHaveAttribute('fill','#e2e3e2');
    await page.unroute('**/api/reports/countries*');
    await page.route('**/api/reports/countries*',route=>route.fulfill({status:503,json:{message:'Map test outage'}}));
    await page.getByRole('button',{name:'Refresh revenue',exact:true}).click();
    await expect(page.locator('#map-state')).toHaveText('Country revenue unavailable');
    await expect(page.locator('#map-country-revenue')).toHaveText('Country revenue unavailable');
    await page.unroute('**/api/reports/countries*');
    await page.getByRole('button',{name:'Refresh revenue',exact:true}).click();
    await expect(country('KOR')).toHaveAttribute('data-has-data','true');
    await page.setViewportSize({width:390,height:844});
    await page.getByLabel('Explore a country',{exact:true}).selectOption('South Korea');
    await expect(page.locator('#map-country-name')).toHaveText('South Korea');
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    await page.locator('.country-map-report').screenshot({path:'/tmp/hotel-country-map-mobile.png'});
    assert.deepEqual(errors,[]);
  }finally{await browser.close();}
});

test('country map keeps country figures usable if local geography fails to load',async()=>{
  const browser=await chromium.launch({channel:'chrome',headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  try{
    await page.route('**/assets/maps/world-countries.json',route=>route.fulfill({status:503,body:'Unavailable'}));
    await page.goto(`${origin}/staff/overview`);
    await expect(page.locator('#map-load-error')).toContainText('Map boundaries could not be loaded');
    await expect(page.locator('#country-data')).toBeVisible();
    await expect(page.locator('#country-report tr').first()).toBeVisible();
    await page.getByLabel('Explore a country',{exact:true}).selectOption('South Korea');
    await expect(page.locator('#map-country-name')).toHaveText('South Korea');
    await page.unroute('**/assets/maps/world-countries.json');
    await page.getByRole('button',{name:'Refresh revenue',exact:true}).click();
    await expect(page.locator('#country-map path')).toHaveCount(176);
    await expect(page.locator('#map-load-error')).toBeHidden();
  }finally{await browser.close();}
});

test('seasonal grouped bar chart preserves API values, axes, distinct room-type colors, filters and null/zero/error states',async()=>{
  const browser=await chromium.launch({channel:'chrome',headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:1100}});
  const types=['Standard Single','Grand Lit','Standard Double','Superior Double','Junior Suite','Spa Executive','Suite','LOFT Suite'];
  const fixture=()=>types.flatMap(roomType=>['low','mid','high'].map(season=>({roomType,season,roomRevenue:null,soldRoomNights:0,containsSyntheticData:false})));
  let values=fixture(),fail=false;
  const set=(type,season,value)=>Object.assign(values.find(r=>r.roomType===type&&r.season===season),{roomRevenue:value,soldRoomNights:2});
  set('Standard Single','low','100.00');set('Standard Single','mid','200.00');set('Standard Single','high','300.00');set('Grand Lit','low','0.00');set('Grand Lit','high','50.00');
  const bar=(type,season)=>page.locator(`#season-chart .season-bar[data-room-type="${type}"][data-season="${season}"]`);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  try{
    await page.route('**/api/reports/room-types-seasons*',route=>route.fulfill(fail?{status:503,json:{message:'Chart test outage'}}:{json:values}));
    await page.goto(`${origin}/staff/overview`);
    await expect(page.locator('#season-chart .season-bar')).toHaveCount(5);
    assert.equal(await page.locator('#season-chart-legend .chart-swatch').evaluateAll(swatches=>new Set(swatches.map(s=>s.style.background)).size),8);
    await expect(page.locator('#season-chart')).toContainText('Revenue (DKK)');
    for(const label of ['Low season','Mid season','High season'])await expect(page.locator('#season-chart')).toContainText(label);
    assert.ok(Number(await bar('Standard Single','high').getAttribute('height'))>Number(await bar('Standard Single','mid').getAttribute('height')));
    assert.equal(await bar('Standard Single','high').getAttribute('fill'),await bar('Standard Single','low').getAttribute('fill'));
    await expect(bar('Standard Single','low')).toHaveAttribute('fill','#6f8e85');
    assert.equal(await page.locator('#season-report tr[data-room-type="Standard Single"]').first().evaluate(row=>row.style.getPropertyValue('--room-type-color')),await bar('Standard Single','low').getAttribute('fill'));
    await expect(bar('Grand Lit','mid')).toHaveCount(0);
    assert.equal(await bar('Grand Lit','low').evaluate(e=>e.tagName),'circle');
    await bar('Standard Single','mid').hover();
    await expect(page.locator('#season-bar-tooltip')).toBeVisible();
    await bar('Standard Single','mid').focus();await page.keyboard.press('Enter');
    await expect(page.locator('#season-chart-value')).toContainText('Standard Single · Mid season');
    await expect(page.locator('#season-chart-value')).toContainText('200,0');
    await expect(page.locator('#season-bar-tooltip')).toBeVisible();
    await expect(page.locator('#season-tooltip-type')).toHaveText('Standard Single');
    await expect(page.locator('#season-tooltip-revenue')).toContainText('200,0');
    assert.ok(await page.locator('#season-tooltip-revenue').evaluate(e=>parseFloat(getComputedStyle(e).fontSize)>=25));
    await page.locator('#season-bar-tooltip').screenshot({path:'/tmp/hotel-revenue-large-tooltip.png'});
    await page.keyboard.press('Escape');await expect(page.locator('#season-bar-tooltip')).toBeHidden();
    await page.getByLabel('Show Standard Single in chart',{exact:true}).uncheck();
    await expect(page.locator('#season-chart .season-bar')).toHaveCount(2);
    await page.getByRole('button',{name:'Show all room types',exact:true}).click();
    await expect(page.locator('#season-chart .season-bar')).toHaveCount(5);
    set('Standard Single','mid','700.00');
    await page.getByRole('button',{name:'Refresh revenue',exact:true}).click();
    await expect(bar('Standard Single','mid')).toHaveAttribute('data-revenue','700.00');
    await expect(page.locator('#season-chart-period')).toHaveText('Calendar year 2026');
    values=fixture();
    await page.getByRole('button',{name:'Refresh revenue',exact:true}).click();
    await expect(page.locator('#season-chart-state')).toHaveText('No revenue records for this period.');
    await expect(page.locator('#season-chart .season-bar')).toHaveCount(0);
    set('Grand Lit','low','0.00');
    await page.getByRole('button',{name:'Refresh revenue',exact:true}).click();
    await expect(page.locator('#season-chart .season-bar')).toHaveCount(1);
    await bar('Grand Lit','low').click();
    await expect(page.locator('#season-chart-value')).toContainText('0,0 kr.');
    fail=true;await page.getByRole('button',{name:'Refresh revenue',exact:true}).click();
    await expect(page.locator('#season-chart-state')).toHaveText('Seasonal revenue unavailable');
    await expect(page.locator('#season-chart .season-bar')).toHaveCount(0);
    await page.unroute('**/api/reports/room-types-seasons*');
    await page.getByRole('button',{name:'Refresh revenue',exact:true}).click();
    await expect(page.locator('#season-chart-period')).toHaveText('Calendar year 2026');
    await expect(page.locator('#season-chart .season-bar')).toHaveCount(24);
    const actual=await(await fetch(`${origin}/api/reports/room-types-seasons?year=2026`)).json();
    await expect(bar('Standard Single','mid')).toHaveAttribute('data-revenue',actual.find(r=>r.roomType==='Standard Single'&&r.season==='mid').roomRevenue);
    await page.locator('.season-chart-report').screenshot({path:'/tmp/hotel-season-chart-desktop.png'});
    await page.locator('#season-data').screenshot({path:'/tmp/hotel-season-table-desktop.png'});
    await page.setViewportSize({width:390,height:844});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    assert.ok(await page.locator('.season-chart-scroll').evaluate(e=>e.scrollWidth>e.clientWidth));
    await page.locator('.season-chart-scroll').evaluate(e=>{e.scrollLeft=e.scrollWidth;});
    assert.ok(await page.locator('.season-chart-scroll').evaluate(e=>e.scrollLeft>0));
    await page.locator('.season-chart-scroll').evaluate(e=>{e.scrollLeft=0;});
    await page.locator('.season-chart-report').screenshot({path:'/tmp/hotel-season-chart-mobile.png'});
    assert.deepEqual(errors,[]);
  }finally{await browser.close();}
});
