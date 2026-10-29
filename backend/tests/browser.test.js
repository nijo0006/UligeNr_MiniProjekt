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
    await page.goto(origin);
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
    await page.reload(); await expect(row).toContainText(/2[.,]491[.,]0/);
    await row.getByRole('button',{name:'Edit booking'}).click();
    await expect(page.locator('#form-title')).toHaveText(`Edit booking #${id}`);
    await page.getByLabel('Nights',{exact:true}).selectOption('3');
    await expect(page.locator('#price')).toContainText(/3[.,]830[.,]0/);
    await page.getByRole('button',{name:'Save changes'}).click();
    await expect(row).toContainText(/3[.,]830[.,]0/);
    page.once('dialog',dialog=>dialog.dismiss());
    await row.getByRole('button',{name:'Cancel booking'}).click();
    await expect(row).toBeVisible();
    page.once('dialog',dialog=>dialog.accept());
    await row.getByRole('button',{name:'Cancel booking'}).click();
    await expect(row).toHaveCount(0);
    await page.screenshot({path:process.env.SCREENSHOT_PATH || '/tmp/hotel-bookings-desktop.png',fullPage:true});
    await page.setViewportSize({width:390,height:844});
    await page.screenshot({path:'/tmp/hotel-bookings-mobile.png',fullPage:true});
    assert.deepEqual(errors,[]);
  } catch (error) {
    await page.screenshot({path:'/tmp/hotel-booking-browser-failure.png',fullPage:true});
    throw error;
  } finally {
    if(id) await fetch(`${origin}/api/bookings/${id}`,{method:'DELETE'});
    await browser.close();
  }
});
