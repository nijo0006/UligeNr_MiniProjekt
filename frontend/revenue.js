const yearSelect = document.querySelector('#report-year');
const amounts = {
  totalRevenue: document.querySelector('#annual-hotel-revenue'),
  roomRevenue: document.querySelector('#annual-room-revenue'),
  barRevenue: document.querySelector('#annual-bar-revenue')
};
const status = document.querySelector('#revenue-status');
const result = document.querySelector('.revenue-result');
let requestNumber = 0;

export function updateReportingYears(bookings) {
  const currentYear = new Date().getFullYear();
  const selectedYear = yearSelect.options.length && yearSelect.value === '' ? '' : Number(yearSelect.value || currentYear);
  // Recent reporting years plus the source year and all active stay years.
  // This is a convenience list, not a restriction on the report API's year range.
  const years = new Set([currentYear-2, currentYear-1, 2026, currentYear, ...(selectedYear === '' ? [] : [selectedYear])]);
  for (const booking of bookings) {
    const lastNight = new Date(`${booking.departure}T00:00:00Z`);
    lastNight.setUTCDate(lastNight.getUTCDate() - 1);
    for (let year = Number(booking.arrival.slice(0, 4)); year <= lastNight.getUTCFullYear(); year++) years.add(year);
  }
  const allYears = new Option('All years', '');
  yearSelect.replaceChildren(allYears,...[...years].sort((a, b) => b - a).map(year => {
    const option = document.createElement('option'); option.value = String(year); option.textContent = String(year); return option;
  }));
  yearSelect.value = String(selectedYear);
}

export async function refreshRevenue() {
  const request = ++requestNumber;
  const year = yearSelect.value;
  document.querySelector('#revenue-title').textContent = year ? 'Annual hotel revenue' : 'Hotel revenue · all years';
  const url = year ? `/api/reports/revenue?year=${encodeURIComponent(year)}` : '/api/reports/summary';
  document.dispatchEvent(new CustomEvent('reporting-year-change', {detail:year}));
  document.querySelector('#revenue-api').href = url;
  for (const amount of Object.values(amounts)) amount.textContent = 'Loading…';
  status.textContent = `Reading hotel revenue for ${year || 'all years'}.`;
  result.setAttribute('aria-busy', 'true');
  result.classList.remove('revenue-error');
  try {
    const response = await fetch(url, { cache: 'no-store' });
    const report = await response.json();
    if (!response.ok) throw new Error(report.message || 'Revenue could not be loaded.');
    if (request !== requestNumber) return;
    const format = new Intl.NumberFormat('en-DK', {
      style: 'currency', currency: report.currency, minimumFractionDigits: 1, maximumFractionDigits: 1
    });
    for (const [field, amount] of Object.entries(amounts)) {
      amount.textContent = report[field] === null ? 'No data' : format.format(Number(report[field]));
    }
    status.textContent = report.totalRevenue === null
      ? `No room-nights or bar sales recorded in ${year || 'all years'}.`
      : `DKK · ${report.year === null ? 'All saved years' : `Calendar year ${report.year}`}${report.containsSyntheticData ? ' · Includes history with demonstration dates' : ''}`;
  } catch (error) {
    if (request !== requestNumber) return;
    for (const amount of Object.values(amounts)) amount.textContent = 'Unavailable';
    status.textContent = error.message;
    result.classList.add('revenue-error');
  } finally {
    if (request === requestNumber) result.setAttribute('aria-busy', 'false');
  }
}

updateReportingYears([]);
yearSelect.addEventListener('change', refreshRevenue);
document.querySelector('#refresh-revenue').addEventListener('click', refreshRevenue);
