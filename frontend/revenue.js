const yearSelect = document.querySelector('#report-year');
const amount = document.querySelector('#annual-room-revenue');
const status = document.querySelector('#revenue-status');
const result = document.querySelector('.revenue-result');
let requestNumber = 0;

export function updateReportingYears(bookings) {
  const currentYear = new Date().getFullYear();
  const selectedYear = Number(yearSelect.value || currentYear);
  // Approved demonstration years plus all years represented by active stays.
  // This is a convenience list, not a restriction on the report API's year range.
  const years = new Set([2024, 2025, 2026, currentYear, selectedYear]);
  for (const booking of bookings) {
    const lastNight = new Date(`${booking.departure}T00:00:00Z`);
    lastNight.setUTCDate(lastNight.getUTCDate() - 1);
    for (let year = Number(booking.arrival.slice(0, 4)); year <= lastNight.getUTCFullYear(); year++) years.add(year);
  }
  yearSelect.replaceChildren(...[...years].sort((a, b) => b - a).map(year => {
    const option = document.createElement('option'); option.value = String(year); option.textContent = String(year); return option;
  }));
  yearSelect.value = String(selectedYear);
}

export async function refreshRevenue() {
  const request = ++requestNumber;
  const year = yearSelect.value;
  const url = `/api/reports/revenue?year=${encodeURIComponent(year)}`;
  document.querySelector('#revenue-api').href = url;
  amount.textContent = 'Loading…';
  status.textContent = `Reading room revenue for ${year}.`;
  result.setAttribute('aria-busy', 'true');
  result.classList.remove('revenue-error');
  try {
    const response = await fetch(url, { cache: 'no-store' });
    const report = await response.json();
    if (!response.ok) throw new Error(report.message || 'Revenue could not be loaded.');
    if (request !== requestNumber) return;
    amount.textContent = report.roomRevenue === null ? 'No data' : new Intl.NumberFormat('en-DK', {
      style: 'currency', currency: report.currency, minimumFractionDigits: 1, maximumFractionDigits: 1
    }).format(Number(report.roomRevenue));
    status.textContent = report.roomRevenue === null ? `No active room-nights recorded in ${year}.` : `DKK · Calendar year ${report.year}`;
  } catch (error) {
    if (request !== requestNumber) return;
    amount.textContent = 'Unavailable';
    status.textContent = error.message;
    result.classList.add('revenue-error');
  } finally {
    if (request === requestNumber) result.setAttribute('aria-busy', 'false');
  }
}

updateReportingYears([]);
yearSelect.addEventListener('change', refreshRevenue);
document.querySelector('#refresh-revenue').addEventListener('click', refreshRevenue);
