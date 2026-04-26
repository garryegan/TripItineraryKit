<script>
  const { segments } = $props();

  const flights = $derived(computeFlights(segments));

  function parseDate(str) {
    return str ? new Date(str) : null;
  }

  function formatDateTime(d) {
    if (!d) return '';
    return d.toLocaleString('en-AU', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function formatDuration(a, b) {
    if (!a || !b) return '';
    const mins = Math.round((b - a) / (1000 * 60));
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  }

  function extractAircraft(desc) {
    if (!desc) return '';
    const match = desc.match(/(Airbus|Boeing)[^.,)]+/i);
    return match ? match[0] : '';
  }

  function computeFlights(segments) {
    return segments
      .filter((s) => s.type === 'flight' || s.type === 'layover')
      .map((s) => {
        const depart = parseDate(s.departLocal || s.startLocal);
        const arrive = parseDate(s.arriveLocal || s.endLocal);
        const f = s.flight || {};

        return {
          type: s.type,
          flightNumber: f.flightNumber || '',
          airline: f.airline || '',
          from: s.from || '',
          to: s.to || '',
          depart,
          arrive,
          duration: formatDuration(depart, arrive),
          distanceKm: s.distanceKm ?? '',
          aircraft: extractAircraft(s.description)
        };
      })
      .sort((a, b) => (a.depart || 0) - (b.depart || 0));
  }
</script>

<div class="table-wrapper">
  <table class="flights-table">
    <thead>
      <tr>
        <th class="col-type">Type</th>
        <th class="col-flight">Flight No</th>
        <th class="col-airline">Airline</th>
        <th class="col-from">From</th>
        <th class="col-to">To</th>
        <th class="col-datetime">Departure</th>
        <th class="col-datetime">Arrival</th>
        <th class="col-duration">Duration</th>
        <th class="col-distance">Distance (km)</th>
        <th class="col-aircraft">Aircraft</th>
      </tr>
    </thead>

    <tbody>
      {#each flights as f}
        <tr>
          <td>{f.type}</td>
          <td>{f.flightNumber}</td>
          <td>{f.airline}</td>
          <td>{f.from}</td>
          <td>{f.to}</td>
          <td>{formatDateTime(f.depart)}</td>
          <td>{formatDateTime(f.arrive)}</td>
          <td>{f.duration}</td>
          <td>{f.distanceKm}</td>
          <td>{f.aircraft}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
  .table-wrapper {
    max-width: 900px;
    margin: 0 auto;
  }

  .flights-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.95rem;
    table-layout: auto;
    white-space: nowrap;
  }

  .flights-table th,
  .flights-table td {
    border: 1px solid #ddd;
    padding: 6px 8px;
  }

  .flights-table th {
    background: #f5f5f5;
  }

  .col-type,
  .col-flight,
  .col-airline,
  .col-from,
  .col-to,
  .col-datetime,
  .col-duration,
  .col-distance,
  .col-aircraft {
    width: 1%;
    white-space: nowrap;
  }

  .col-distance,
  .col-duration {
    text-align: center;
  }
  
	  /* Prevent wrapping and keep rows compact */
	.accom-table td,
	.accom-table th,
	.flights-table td,
	.flights-table th {
	  white-space: nowrap;
	  overflow: hidden;
	  text-overflow: ellipsis;
	  padding-right: 12px; /* minimal tail */
	}

	/* Optional: ensure columns don’t collapse too small */
	.accom-table td,
	.flights-table td {
	  min-width: 80px;
	}

  
</style>
