import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium, expect } from '@playwright/test';

const origin = process.env.APP_BASE_URL || 'http://127.0.0.1:3000';
test('browser creates, reloads, edits and confirms cancellation of a booking', async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors=[]; page.on('pageerror', error => errors.push(error.message));
  let id;
  try {
    await page.goto(`${origin}/staff`);
    const readReport = async year => {
      const response = await fetch(`${origin}/api/reports/revenue?year=${year}`);
      assert.equal(response.status,200); return response.json();
    };
    const formatRevenue = amount => amount === null ? 'No data' : new Intl.NumberFormat('en-DK', {style:'currency',currency:'DKK',minimumFractionDigits:1,maximumFractionDigits:1}).format(Number(amount));
    await page.getByLabel('Reporting year',{exact:true}).selectOption('2025');
    await expect(page.locator('#annual-room-revenue')).toHaveText(formatRevenue((await readReport(2025)).roomRevenue));
    await page.getByLabel('Reporting year',{exact:true}).selectOption('2026');
    const baseline = (await readReport(2026)).roomRevenue;
    await expect(page.locator('#annual-room-revenue')).toHaveText(formatRevenue(baseline));
    // A report failure must be visibly different from a legitimate no-data result.
    await page.route('**/api/reports/revenue?year=*',route=>route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({message:'Verification outage'})}));
    await page.getByRole('button',{name:'Refresh revenue',exact:true}).click();
    await expect(page.locator('#annual-room-revenue')).toHaveText('Unavailable');
    await page.unroute('**/api/reports/revenue?year=*');
    await page.getByRole('button',{name:'Refresh revenue',exact:true}).click();
    await expect(page.locator('#annual-room-revenue')).toHaveText(formatRevenue(baseline));
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
    await expect(page.locator('#annual-room-revenue')).toHaveText(formatRevenue(Number(baseline || 0) + 2491));
    await page.reload(); await expect(row).toContainText(/2[.,]491[.,]0/);
    await row.getByRole('button',{name:'Edit booking'}).click();
    await expect(page.locator('#form-title')).toHaveText(`Edit booking #${id}`);
    await page.getByLabel('Nights',{exact:true}).selectOption('3');
    await expect(page.locator('#price')).toContainText(/3[.,]830[.,]0/);
    await page.getByRole('button',{name:'Save changes'}).click();
    await expect(row).toContainText(/3[.,]830[.,]0/);
    await expect(page.locator('#annual-room-revenue')).toHaveText(formatRevenue(Number(baseline || 0) + 3830));
    page.once('dialog',dialog=>dialog.dismiss());
    await row.getByRole('button',{name:'Cancel booking'}).click();
    await expect(row).toBeVisible();
    page.once('dialog',dialog=>dialog.accept());
    await row.getByRole('button',{name:'Cancel booking'}).click();
    await expect(row).toHaveCount(0);
    await expect(page.locator('#annual-room-revenue')).toHaveText(formatRevenue(baseline));
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

test('guest books without loading staff data and the booking appears in staff workspace',async()=>{
  const browser=await chromium.launch({channel:'chrome',headless:true});
  const guest=await browser.newPage({viewport:{width:1440,height:1000}});
  const staff=await browser.newPage({viewport:{width:1440,height:1000}});
  const requests=[];const errors=[];
  guest.on('request',r=>requests.push({url:r.url(),method:r.method()}));
  guest.on('pageerror',e=>errors.push(e.message));staff.on('pageerror',e=>errors.push(e.message));
  let id;
  try{
    await guest.goto(origin);
    await expect(guest.locator('#bookings')).toHaveCount(0);
    await expect(guest.locator('#annual-room-revenue')).toHaveCount(0);
    await guest.getByLabel('First name',{exact:true}).fill('Guest verification');
    await guest.getByLabel('Last name',{exact:true}).fill('Demonstration');
    await guest.getByLabel('Booking holder’s country').selectOption('Denmark');
    await guest.getByLabel('Arrival',{exact:true}).fill('2026-05-31');
    await guest.getByLabel('Nights',{exact:true}).selectOption('2');
    await guest.getByLabel('Room type',{exact:true}).selectOption('Standard Single');
    const room=guest.locator('#rooms input[type=checkbox]').first();await room.waitFor();await room.locator('..').click();
    const created=guest.waitForResponse(r=>r.url().endsWith('/api/bookings')&&r.request().method()==='POST');
    await guest.getByRole('button',{name:'Confirm booking',exact:true}).click();
    const response=await created;assert.equal(response.status(),201);id=(await response.json()).bookingId;
    await expect(guest.locator('#confirmation')).toContainText(`Booking #${id}`);
    await staff.goto(`${origin}/staff`);
    const row=staff.locator(`[data-booking-id="${id}"]`);await expect(row).toContainText('Guest verification Demonstration');
    staff.once('dialog',d=>d.accept());await row.getByRole('button',{name:'Cancel booking'}).click();await expect(row).toHaveCount(0);
    assert.ok(!requests.some(r=>r.method==='GET'&&new URL(r.url).pathname==='/api/bookings'));
    assert.ok(!requests.some(r=>new URL(r.url).pathname.startsWith('/api/reports')));
    await guest.reload();await guest.screenshot({path:'/tmp/hotel-guest-desktop.png',fullPage:true});
    await guest.setViewportSize({width:390,height:844});await guest.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));await guest.screenshot({path:'/tmp/hotel-guest-mobile.png'});
    await staff.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
    await staff.screenshot({path:'/tmp/hotel-staff-desktop.png',fullPage:true});
    await staff.setViewportSize({width:390,height:844});await staff.screenshot({path:'/tmp/hotel-staff-mobile.png'});
    assert.deepEqual(errors,[]);
  }finally{if(id)await fetch(`${origin}/api/bookings/${id}`,{method:'DELETE'});await browser.close();}
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
    await page.goto(`${origin}/staff`);
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

test('staff browses imported 2025 history with labels, year filters, pagination and live bar totals',async()=>{
  const browser=await chromium.launch({channel:'chrome',headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:1100}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const format=value=>new Intl.NumberFormat('en-DK',{style:'currency',currency:'DKK',minimumFractionDigits:1,maximumFractionDigits:1}).format(Number(value));
  try{
    await page.goto(`${origin}/staff`);
    await expect(page.locator('#history-status')).toContainText('Excel bookings');
    await expect(page.locator('#history-controls')).toContainText(format('11234034.00'));
    await page.getByLabel('Booking year',{exact:true}).selectOption('2025');
    await expect(page.locator('#bookings .reservation')).toHaveCount(25);
    await expect(page.locator('#bookings .reservation').first()).toContainText('demonstration dates');
    await page.getByRole('button',{name:'Next bookings',exact:true}).click();
    await expect(page.locator('#booking-page-status')).toContainText('Showing 26–50');
    const books=await(await fetch(`${origin}/api/bookings`)).json();
    const target=books.find(b=>b.sourceId&&b.arrival.startsWith('2025'));
    await page.getByLabel('Search bookings',{exact:true}).fill(`#${target.bookingId}`);
    await expect(page.locator('#bookings .reservation')).toHaveCount(1);
    await expect(page.locator(`[data-booking-id="${target.bookingId}"]`)).toContainText('Unknown guests');
    await page.getByLabel('Reporting year',{exact:true}).selectOption('2025');
    const room=await(await fetch(`${origin}/api/reports/revenue?year=2025`)).json();
    await expect(page.locator('#annual-room-revenue')).toHaveText(format(room.roomRevenue));assert.equal(room.containsSyntheticData,true);
    await page.getByLabel('Bar reporting year',{exact:true}).selectOption('2025');
    const bar=await(await fetch(`${origin}/api/reports/bar?year=2025`)).json();assert.equal(bar.containsSyntheticData,true);
    await expect(page.locator('#bar-revenue')).toHaveText(format(bar.revenue));
    await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
    await page.screenshot({path:'/tmp/hotel-excel-history-staff.png'});
    await page.setViewportSize({width:390,height:844});await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
    await page.screenshot({path:'/tmp/hotel-excel-history-mobile.png'});
    assert.deepEqual(errors,[]);
  }finally{await browser.close();}
});
