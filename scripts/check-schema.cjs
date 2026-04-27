const fs = require('fs');

// Path to your JSON file (relative to /scripts)
const FILE = '../src/lib/data/balkans-2026.json';

// Canonical schema based on your template
const topLevelKeys = [
  'type', 'title', 'description',
  'from', 'to',
  'departLocal', 'arriveLocal',
  'startLocal', 'endLocal',
  'checkInLocal', 'checkOutLocal',
  'provider',
  'distanceKm',
  'notes',
  'bookingRefs',
  'confirmation',
  'website',
  'phone',
  'address',
  'locations',
  'attachments',
  'cost'
];

const providerKeys = ['name', 'dayNumber'];

const locationKeys = ['name', 'lat', 'lon'];

const costKeys = ['incurredDate', 'local', 'aud', 'costNotes'];

const costLocalKeys = ['amount', 'currency'];

const costAudKeys = ['amount', 'rateUsed', 'source'];

function diffKeys(expected, actual) {
  const missing = expected.filter(k => !actual.includes(k));
  const extra = actual.filter(k => !expected.includes(k));
  return { missing, extra };
}

function check() {
  const raw = fs.readFileSync(FILE, 'utf8');
  const data = JSON.parse(raw);

  // Your JSON is an object with a "segments" array
  const segments = Array.isArray(data.segments) ? data.segments : null;

  if (!segments) {
    console.error('JSON does not contain a top-level "segments" array.');
    process.exit(1);
  }

  let hasIssues = false;

  segments.forEach((seg, idx) => {
    const path = `segment[${idx}]`;

    // Top-level keys
    const segKeys = Object.keys(seg);
    const { missing: missTop, extra: extraTop } = diffKeys(topLevelKeys, segKeys);
    if (missTop.length || extraTop.length) {
      hasIssues = true;
      console.log(`\n${path}:`);
      if (missTop.length) console.log('  Missing top-level keys:', missTop);
      if (extraTop.length) console.log('  Extra top-level keys:', extraTop);
    }

    // provider
    if (seg.provider == null || typeof seg.provider !== 'object') {
      hasIssues = true;
      console.log(`\n${path}.provider: expected object, got`, seg.provider);
    } else {
      const pk = Object.keys(seg.provider);
      const { missing, extra } = diffKeys(providerKeys, pk);
      if (missing.length || extra.length) {
        hasIssues = true;
        console.log(`\n${path}.provider:`);
        if (missing.length) console.log('  Missing keys:', missing);
        if (extra.length) console.log('  Extra keys:', extra);
      }
    }

    // locations
    if (!Array.isArray(seg.locations)) {
      hasIssues = true;
      console.log(`\n${path}.locations: expected array, got`, seg.locations);
    } else {
      seg.locations.forEach((loc, li) => {
        const lk = Object.keys(loc);
        const { missing, extra } = diffKeys(locationKeys, lk);
        if (missing.length || extra.length) {
          hasIssues = true;
          console.log(`\n${path}.locations[${li}]:`);
          if (missing.length) console.log('  Missing keys:', missing);
          if (extra.length) console.log('  Extra keys:', extra);
        }
      });
    }

    // cost
    if (seg.cost == null || typeof seg.cost !== 'object') {
      hasIssues = true;
      console.log(`\n${path}.cost: expected object, got`, seg.cost);
    } else {
      const ck = Object.keys(seg.cost);
      const { missing, extra } = diffKeys(costKeys, ck);
      if (missing.length || extra.length) {
        hasIssues = true;
        console.log(`\n${path}.cost:`);
        if (missing.length) console.log('  Missing keys:', missing);
        if (extra.length) console.log('  Extra keys:', extra);
      }

      // cost.local
      if (seg.cost.local == null || typeof seg.cost.local !== 'object') {
        hasIssues = true;
        console.log(`\n${path}.cost.local: expected object, got`, seg.cost.local);
      } else {
        const clk = Object.keys(seg.cost.local);
        const { missing, extra } = diffKeys(costLocalKeys, clk);
        if (missing.length || extra.length) {
          hasIssues = true;
          console.log(`\n${path}.cost.local:`);
          if (missing.length) console.log('  Missing keys:', missing);
          if (extra.length) console.log('  Extra keys:', extra);
        }
      }

      // cost.aud
      if (seg.cost.aud == null || typeof seg.cost.aud !== 'object') {
        hasIssues = true;
        console.log(`\n${path}.cost.aud: expected object, got`, seg.cost.aud);
      } else {
        const cak = Object.keys(seg.cost.aud);
        const { missing, extra } = diffKeys(costAudKeys, cak);
        if (missing.length || extra.length) {
          hasIssues = true;
          console.log(`\n${path}.cost.aud:`);
          if (missing.length) console.log('  Missing keys:', missing);
          if (extra.length) console.log('  Extra keys:', extra);
        }
      }
    }
  });

  if (!hasIssues) {
    console.log('All segments match the canonical structure.');
  }
}

check();
