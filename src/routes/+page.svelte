<script>
  import { onMount } from 'svelte';

  import Timeline from '$lib/components/Timeline.svelte';
  import MapView from '$lib/components/MapView.svelte';
  import AccommodationTable from '$lib/components/AccommodationTable.svelte';
  import FlightsTable from '$lib/components/FlightsTable.svelte';

  let { data } = $props();

  const trip = data.trip;
  const countries = data.countries;
  const overview = trip.tripOverview;

  // ---------------------------------------------------------
  // SAFE DATE EXTRACTION
  // ---------------------------------------------------------
  function extractLocalDate(isoString) {
    if (!isoString) return null;
    return isoString.slice(0, 10);
  }

  function toLocalDateOnly(dateStr) {
    return new Date(dateStr + 'T00:00:00');
  }

  function fmtShort(dateObj) {
    if (!dateObj) return '';
    const d = dateObj instanceof Date ? dateObj : new Date(dateObj);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-AU', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: '2-digit'
    });
  }

  // ---------------------------------------------------------
  // TRIP START/END DATES
  // ---------------------------------------------------------
  const dateKeys = [
    'departLocal',
    'arriveLocal',
    'startLocal',
    'endLocal',
    'checkInLocal',
    'checkOutLocal'
  ];

  const segmentDates = trip.segments
    .flatMap((seg) => dateKeys.map((k) => extractLocalDate(seg[k])))
    .filter(Boolean)
    .map((d) => toLocalDateOnly(d));

  const derivedStart =
    segmentDates.length > 0
      ? new Date(Math.min(...segmentDates.map((d) => d.getTime())))
      : null;

  const derivedEnd =
    segmentDates.length > 0
      ? new Date(Math.max(...segmentDates.map((d) => d.getTime())))
      : null;

  const startLabel =
    derivedStart && !isNaN(derivedStart.getTime()) ? fmtShort(derivedStart) : '';

  const endLabel =
    derivedEnd && !isNaN(derivedEnd.getTime()) ? fmtShort(derivedEnd) : '';

   // ---------------------------------------------------------
  // COUNTRY DETECTION — INCLUDE EVERY COUNTRY IN ALL SEGMENTS
  // ---------------------------------------------------------
  function extractCountryFromLocationName(name) {
    if (!name || !name.includes(',')) return null;
    return name.split(',').pop().trim();
  }

  // Extract ALL countries from ALL segments' locations[]
  const allCountries = trip.segments.flatMap((seg) =>
    (seg.locations ?? []).map((loc) =>
      extractCountryFromLocationName(loc.name)
    )
  );

  // Deduplicate + sorted by order visited
  const uniqueCountries = [...new Set(allCountries.filter(Boolean))].sort();

// Map to metadata (only countries present in countries-europe.json survive)
// Determine earliest appearance date for each country
function earliestDateForCountry(countryName) {
  const dates = trip.segments.flatMap(seg => {
    const locCountries = (seg.locations ?? [])
      .map(loc => extractCountryFromLocationName(loc.name))
      .filter(Boolean);

    if (!locCountries.includes(countryName)) return [];

    const keys = [
      'departLocal',
      'arriveLocal',
      'startLocal',
      'endLocal',
      'checkInLocal',
      'checkOutLocal'
    ];

    for (const k of keys) {
      if (seg[k]) return [new Date(seg[k])];
    }
    return [];
  });

  return dates.length > 0 ? Math.min(...dates.map(d => d.getTime())) : Infinity;
}

// Sort visited countries by trip order
const visitedCountries = uniqueCountries
  .map(name => countries.find(c => c.name === name))
  .filter(Boolean)
  .sort((a, b) =>
    earliestDateForCountry(a.name) - earliestDateForCountry(b.name)
  );


  // ---------------------------------------------------------
  // FORMATTED OUTPUT (Option L1 — English only)
  // ---------------------------------------------------------
  const dynamicCurrencies = visitedCountries.map(
    (c) => `${c.name} — ${c.currency.name} (${c.currency.code})`
  );

// Group plug types by country
const dynamicPlugs = visitedCountries.map((c) => {
  const plugList = c.plugs
    .map((p) => `Type ${p.type} (${p.voltage}V, ${p.frequency}Hz)`)
    .join(', ');
  return `${c.name} — ${plugList}`;
});

// Group languages by country
const dynamicLanguages = visitedCountries.map((c) => {
  const langList = c.languages
    .map((l) => l.name)
    .join(', ');
  return `${c.name} — ${langList}`;
});

  // ---------------------------------------------------------
  // TRAVELLERS
  // ---------------------------------------------------------
  const travellers =
    trip.travellers && trip.travellers.length > 0
      ? trip.travellers.map((t) => t.name).join(', ')
      : '';

  // ---------------------------------------------------------
  // UI STATE
  // ---------------------------------------------------------
  let activeTab = $state('timeline');
  let showOverview = $state(false);
  let showScrollTop = $state(false);

  let openSection = $state({
    currency: true,
    plugs: true,
    language: true,
    generalNotes: true,
    weather: true,
    emergency: true,
    transportBasics: true,
    maps: true
  });
  
  let fxOpen = $state({});

  function toggleSection(key) {
    openSection[key] = !openSection[key];
  }
  
  function toggleFx(i) {
  fxOpen[i] = !fxOpen[i];
}

  function openPrint() {
    const w = window.open(window.location.href, '_blank');
    if (w) w.onload = () => w.print();
  }
  
  // ---------------------------------------------------------
  // FX HELPERS
  // ---------------------------------------------------------
  function formatFx(rate) {
    if (rate === null || rate === undefined) return '—';
    return rate.toFixed(4);
  }

  function fxString(currency) {
    if (!currency || currency.fxToAUD == null) return '—';
    return `1 AUD = ${formatFx(currency.fxToAUD)} ${currency.code}`;
  }
  
  function reverseFxString(currency) {
  if (!currency || currency.fxToAUD == null) return '—';
  const rev = 1 / currency.fxToAUD;
  return rev.toFixed(4);
  }

  // ---------------------------------------------------------
  // DEBUG: Inspect visitedCountries
  // ---------------------------------------------------------
  console.log('visitedCountries:', visitedCountries);
  
  // ---------------------------------------------------------
  // SCROLL HANDLER
  // ---------------------------------------------------------
  $effect(() => {
    function handleScroll() {
      if (activeTab === 'timeline') {
        showScrollTop = window.scrollY > 300;
      } else {
        showScrollTop = false;
      }
    }

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  });
</script>

<header class="page-header">
  <div></div>

  <div class="header-center">
    <div class="page-title">{trip.tripName}</div>
    <div class="page-subtitle">{startLabel} → {endLabel}</div>
    {#if travellers}
      <div class="page-travellers">Travellers: {travellers}</div>
    {/if}
  </div>

  <div class="header-buttons">
    <button class="header-btn" onclick={() => (showOverview = !showOverview)}>
      ℹ️ Trip information
    </button>

    <button class="header-btn" onclick={openPrint}>
      🖨️ Print itinerary
    </button>
  </div>
</header>

<div class="tabs">
  <button
    class={`tab-btn ${activeTab === 'timeline' ? 'active' : ''}`}
    onclick={() => (activeTab = 'timeline')}
  >
    Timeline
  </button>

  <button
    class={`tab-btn ${activeTab === 'map' ? 'active' : ''}`}
    onclick={() => (activeTab = 'map')}
  >
    Map
  </button>

  <button
    class={`tab-btn ${activeTab === 'accommodation' ? 'active' : ''}`}
    onclick={() => (activeTab = 'accommodation')}
  >
    Accommodation
  </button>

  <button
    class={`tab-btn ${activeTab === 'flights' ? 'active' : ''}`}
    onclick={() => (activeTab = 'flights')}
  >
    Flights
  </button>
</div>

<div class="layout-grid">
  <div></div>

  <div class="content-column">
    {#if activeTab === 'timeline'}
      <div class="timeline-wrapper">
        <Timeline segments={trip.segments} />
      </div>

    {:else if activeTab === 'accommodation'}
      <div class="wide-wrapper">
        <AccommodationTable segments={trip.segments} />
      </div>

    {:else if activeTab === 'flights'}
      <div class="wide-wrapper">
        <FlightsTable segments={trip.segments} />
      </div>

    {:else if activeTab === 'map'}
      <MapView segments={trip.segments} />
    {/if}
  </div>

  <div class="panel-column">
    <div class={`side-panel ${showOverview ? 'visible' : ''}`}>
      <h2 class="panel-title">Trip Overview</h2>

      <div class="panel-scroll">

<!-- Currency & Exchange -->
<div class="panel-section">
  <button class="section-header" onclick={() => toggleSection('currency')}>
    <span class="section-title">Currency & Exchange</span>
    <span class="section-toggle">{openSection.currency ? '▾' : '▸'}</span>
  </button>

{#if openSection.currency}
  <div class="section-body">

    {#each visitedCountries as c, i}

      <!-- CLICKABLE HEADER ROW -->
		<div class="fx-row" onclick={() => toggleFx(i)} style="cursor: pointer;">
		  <div class="fx-label">{c.name}</div>

		  <div class="fx-value" style="display: flex; align-items: center; gap: 6px;">
			<!-- Currency info -->
			{c.currency.name} ({c.currency.code}) {c.currency.symbol}

			<!-- Arrow indicator -->
			<span style="opacity: 0.6;">
			  {fxOpen[i] ? '▾' : '▸'}
			</span>
		  </div>
		</div>


      <!-- COLLAPSIBLE CONTENT -->
      {#if fxOpen[i]}
        <div class="fx-row">
          <div class="fx-label">AUD → {c.currency.code}</div>
          <div class="fx-value">{fxString(c.currency)}</div>
        </div>

        <div class="fx-row">
          <div class="fx-label">{c.currency.code} → AUD</div>
          <div class="fx-value">{reverseFxString(c.currency)}</div>
        </div>

        {#if c.currency.fxDate}
          <div class="fx-row">
            <div class="fx-label">Rate Date</div>
            <div class="fx-value">{c.currency.fxDate}</div>
          </div>
        {/if}

        {#if c.currency.fxSource}
          <div class="fx-row">
            <div class="fx-label">Source</div>
            <div class="fx-value">{c.currency.fxSource}</div>
          </div>
        {/if}
      {/if}

      <hr class="fx-divider" />

    {/each}

  </div>
{/if}

</div>


        <!-- Plugs -->
        <div class="panel-section">
          <button class="section-header" onclick={() => toggleSection('plugs')}>
            <span class="section-title">plugs</span>
            <span class="section-toggle">{openSection.plugs ? '▾' : '▸'}</span>
          </button>

          {#if openSection.plugs}
            <div class="section-body">
              <ul>
                {#each dynamicPlugs as p}
                  <li>{p}</li>
                {/each}
              </ul>
            </div>
          {/if}
        </div>

        <!-- Languages -->
        <div class="panel-section">
          <button class="section-header" onclick={() => toggleSection('language')}>
            <span class="section-title">language</span>
            <span class="section-toggle">{openSection.language ? '▾' : '▸'}</span>
          </button>

          {#if openSection.language}
            <div class="section-body">
              <ul>
                {#each dynamicLanguages as l}
                  <li>{l}</li>
                {/each}
              </ul>
            </div>
          {/if}
        </div>

        <!-- Static sections -->
        {#each Object.keys(openSection) as key}
          {#if !['currency', 'plugs', 'language'].includes(key)}
            <div class="panel-section">
              <button class="section-header" onclick={() => toggleSection(key)}>
                <span class="section-title">{key}</span>
                <span class="section-toggle">{openSection[key] ? '▾' : '▸'}</span>
              </button>

              {#if openSection[key]}
                <div class="section-body">
                  {#if key === 'maps'}
                    <ul>
                      {#each overview.maps as m}
                        <li>
                          <a href={m.url} target="_blank" rel="noopener noreferrer">
                            {m.label}
                          </a>
                        </li>
                      {/each}
                    </ul>
                  {:else}
                    <ul>
                      {#each overview[key] as item}
                        <li>{item.label ?? item}</li>
                      {/each}
                    </ul>
                  {/if}
                </div>
              {/if}
            </div>
          {/if}
        {/each}
      </div>
    </div>
  </div>
</div>

{#if showScrollTop}
  <button
    class="scroll-top-btn"
    onclick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
  >
    ⬆️
  </button>
{/if}

<style>
  .page-header {
    position: sticky;
    top: 0;
    z-index: 900;
    background: white;
    padding: 12px 20px;
    border-bottom: 1px solid #ccc;
    display: grid;
    grid-template-columns: 1fr 560px 1fr;
    align-items: center;
  }

  .header-center {
    text-align: center;
  }

  .header-buttons {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }

  .header-btn {
    width: 180px;
    background: #007bff;
    color: white;
    border: none;
    padding: 8px 14px;
    border-radius: 4px;
    cursor: pointer;
    text-align: left;
    font-size: 0.9rem;
  }

  .page-title {
    font-size: 1.8rem;
    font-weight: 600;
  }

  .page-subtitle {
    margin-top: 4px;
    font-size: 1rem;
    color: #555;
  }

  .page-travellers {
    margin-top: 4px;
    font-size: 0.95rem;
    color: #666;
  }

  .tabs {
    display: flex;
    justify-content: center;
    gap: 12px;
    padding: 12px 0;
  }

  .tab-btn {
    padding: 8px 14px;
    border: 1px solid #ccc;
    background: #f8f8f8;
    cursor: pointer;
  }

  .tab-btn.active {
    background: #007bff;
    color: white;
  }

  .layout-grid {
    display: grid;
    grid-template-columns: 1fr minmax(560px, 900px) 1fr;
    width: 100%;
    margin-top: 10px;
  }

  .content-column {
    width: 100%;
  }

  .timeline-wrapper {
    width: 560px;
    margin: 0 auto;
  }

  .wide-wrapper {
    max-width: 900px;
    margin: 0 auto;
  }

  .content-column :global(.map-container),
  .content-column :global(.leaflet-container) {
    max-width: 900px;
    margin: 0 auto;
  }

:root {
  --trip-panel-width: 520px;
}

.panel-column {
  position: fixed;
  right: 0;
  top: 215px;
  bottom: 10px;
  width: var(--trip-panel-width);
  max-width: 90vw;
  display: flex;
  justify-content: flex-end;
  pointer-events: none;
}

.side-panel {
  width: var(--trip-panel-width);
  max-width: 90vw;
  max-height: 100%;
  background: white;
  border-left: 1px solid #ccc;
  overflow-y: auto;
  transform: translateX(100%);
  transition: transform 0.25s ease;
  pointer-events: auto;
}

.side-panel.visible {
  transform: translateX(0);
}


  .panel-title {
    font-size: 1.1rem;
    font-weight: 600;
    padding: 10px 14px;
    border-bottom: 1px solid #eee;
  }

  .panel-scroll {
    padding: 8px 0 12px;
  }

  .panel-section {
    border-bottom: 1px solid #eee;
  }

  .section-header {
    width: 100%;
    padding: 8px 12px;
    background: #f7f7f7;
    border: none;
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    font-size: 0.9rem;
    text-transform: lowercase;
  }

  .section-title {
    font-weight: 500;
  }

  .section-toggle {
    font-size: 0.9rem;
  }

  .section-body {
    padding: 8px 14px 10px;
    font-size: 0.9rem;
  }

  .section-body ul {
    margin: 0;
    padding-left: 18px;
  }

  .section-body li + li {
    margin-top: 4px;
  }

  .scroll-top-btn {
    position: fixed;
    bottom: 30px;
    right: 30px;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    border: none;
    background: rgba(0, 0, 0, 0.35);
    color: white;
    font-size: 1.4rem;
    cursor: pointer;
    backdrop-filter: blur(4px);
    transition: opacity 0.25s ease, background 0.25s ease;
    z-index: 1200;
  }

  .scroll-top-btn:hover {
    background: rgba(0, 0, 0, 0.55);
  }
  
    /* FX formatting */
  .fx-row {
    display: flex;
    justify-content: space-between;
    margin: 4px 0;
  }

  .fx-label {
    font-weight: 600;
    opacity: 0.8;
  }

  .fx-value {
    text-align: right;
  }

  .fx-divider {
    margin: 8px 0;
    opacity: 0.3;
    border: none;
    border-bottom: 1px solid #ddd;
  }

  
</style>
