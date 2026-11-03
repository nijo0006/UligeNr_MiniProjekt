const reportingYear = '2026';
const amounts = {
  totalRevenue: document.querySelector('#annual-hotel-revenue'),
  roomRevenue: document.querySelector('#annual-room-revenue'),
  barRevenue: document.querySelector('#annual-bar-revenue')
};
const status = document.querySelector('#revenue-status');
const result = document.querySelector('.revenue-result');
let requestNumber = 0;

export async function refreshRevenue() {
  const request = ++requestNumber;
  const year = reportingYear;
  const url = `/api/reports/revenue?year=${year}`;
  document.dispatchEvent(new CustomEvent('reporting-year-change', {detail:year}));
  document.querySelector('#revenue-api').href = url;
  for (const amount of Object.values(amounts)) amount.textContent = 'Loading…';
  status.textContent = `Reading hotel revenue for ${year}.`;
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
      ? `No room-nights or bar sales recorded in ${year}.`
      : `DKK · Calendar year ${report.year}${report.containsSyntheticData ? ' · Includes history with demonstration dates' : ''}`;
  } catch (error) {
    if (request !== requestNumber) return;
    for (const amount of Object.values(amounts)) amount.textContent = 'Unavailable';
    status.textContent = error.message;
    result.classList.add('revenue-error');
  } finally {
    if (request === requestNumber) result.setAttribute('aria-busy', 'false');
  }
}

document.querySelector('#refresh-revenue').addEventListener('click', refreshRevenue);
