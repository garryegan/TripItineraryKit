import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load countries file
const filePath = path.join(__dirname, '../src/lib/data/metadata/countries-europe.json');
const countries = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// Melbourne local date
function melbourneDateString() {
  return new Date().toLocaleString('en-AU', {
    timeZone: 'Australia/Melbourne'
  });
}

// Frankfurter API (ECB currencies)
async function fetchFrankfurter(code) {
  const url = `https://api.frankfurter.app/latest?from=AUD&to=${code}`;
  const res = await fetch(url);
  const data = await res.json();
  return data?.rates?.[code] ?? null;
}

// OpenER fallback (supports all currencies)
async function fetchOpenER(code) {
  const url = `https://open.er-api.com/v6/latest/AUD`;
  const res = await fetch(url);
  const data = await res.json();
  return data?.rates?.[code] ?? null;
}

async function updateFx() {
  // Preload OpenER once (faster)
  let openERData = null;

  for (const c of countries) {
    const code = c.currency.code;

    // 1. Try Frankfurter first
    let rate = await fetchFrankfurter(code);

    if (rate !== null) {
      c.currency.fxToAUD = rate;
      c.currency.fxSource = 'frankfurter.app';
      c.currency.fxDate = melbourneDateString();
      console.log(`Frankfurter → Updated ${code}: ${rate}`);
      continue;
    }

    // 2. Fallback to OpenER
    if (!openERData) {
      const url = `https://open.er-api.com/v6/latest/AUD`;
      const res = await fetch(url);
      openERData = await res.json();
    }

    rate = openERData?.rates?.[code] ?? null;

    if (rate !== null) {
      c.currency.fxToAUD = rate;
      c.currency.fxSource = 'open.er-api.com';
      c.currency.fxDate = melbourneDateString();
      console.log(`OpenER → Updated ${code}: ${rate}`);
    } else {
      console.warn(`No FX rate found for ${code}`);
    }
  }

  fs.writeFileSync(filePath, JSON.stringify(countries, null, 2));
  console.log('FX rates updated.');
}

updateFx();
