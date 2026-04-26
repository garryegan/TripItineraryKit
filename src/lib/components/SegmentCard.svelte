<script>
  import { fade, slide } from 'svelte/transition';

  const { segment, forceOpen = false } = $props();
  let open = $state(forceOpen);

  const icons = {
    flight: "✈️",
    layover: "⏳",
    accommodation: "🏨",
    transport: "🚌",
    tour: "🎧",
    activity: "🎟️",
    restaurant: "🍽️",
    "car-rental": "🚗",
    "free-day": "🌤️",
    note: "📝",
    default: "📌"
  };

  const icon = icons[segment.type] || icons.default;

  let city = $state("");
  let country = $state("");

  if (segment.locations && segment.locations.length > 0) {
    const loc = segment.locations[0].name;
    const parts = loc.split(",").map((s) => s.trim());
    city = parts[0] || "";
    country = parts[1] || "";
  }

  function fmtTime(dt) {
    if (!dt) return null;
    return dt.split("T")[1].substring(0, 5);
  }

  function fmtDate(dt) {
    if (!dt) return null;
    const [y, m, d] = dt.split("T")[0].split("-").map(Number);
    const date = new Date(Date.UTC(y, m - 1, d));
    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const wd = weekdays[date.getUTCDay()];
    const yy = String(y).slice(-2);
    return `${wd}, ${d} ${months[m - 1]} ${yy}`;
  }

  function getSummary() {
    if (segment.type === "flight" && segment.departLocal && segment.arriveLocal) {
      return {
        type: "flight",
        depart: segment.departLocal,
        arrive: segment.arriveLocal
      };
    }

    if (segment.departLocal) return { type: "single", label: "Depart", dt: segment.departLocal };
    if (segment.arriveLocal) return { type: "single", label: "Arrive", dt: segment.arriveLocal };
    if (segment.startLocal) return { type: "single", label: "Start", dt: segment.startLocal };
    if (segment.checkInLocal) return { type: "single", label: "Check‑in", dt: segment.checkInLocal };
    if (segment.checkOutLocal) return { type: "single", label: "Check‑out", dt: segment.checkOutLocal };

    return null;
  }

  let summary = $derived(getSummary());

  function getCardStyle(seg) {
    const type = seg.type || "default";
    const bgVar = `--${type}-bg`;
    const borderVar = `--${type}-border`;
    return `
      background: var(${bgVar}, var(--default-bg));
      border: 1px solid var(${borderVar}, var(--default-border));
    `;
  }
</script>

<div
  class="card"
  style={getCardStyle(segment)}
  onclick={() => { if (!forceOpen) open = !open; }}
>
  <div class="summary">
    <div class="header">
      <div class="icon">{icon}</div>
      <div class="title">{segment.title}</div>
    </div>

    {#if city}
      <div class="location">
        {city}{country ? `, ${country}` : ""}
      </div>
    {/if}

    {#if summary}
      <div class="summary-times">
        {#if summary.type === "flight"}
          🛫 Depart: {fmtTime(summary.depart)} on {fmtDate(summary.depart)}
          |
          🛬 Arrive: {fmtTime(summary.arrive)} on {fmtDate(summary.arrive)}
        {:else}
          {summary.label}: {fmtTime(summary.dt)} on {fmtDate(summary.dt)}
        {/if}
      </div>
    {/if}
  </div>

  {#if open}
    <div in:fade={{ duration: 160 }} out:fade={{ duration: 140 }}>
      <div
        class="details"
        in:slide={{ duration: 180, easing: t => t*t }}
        out:slide={{ duration: 160, easing: t => t*t }}
      >
        {#if segment.description}
          <div class="description">{segment.description}</div>
        {/if}

        <div class="times">
          {#if segment.checkInLocal}
            <div class="time-row">
              <span class="label">🛬 Check‑in</span>
              <span class="value">{fmtTime(segment.checkInLocal)} on {fmtDate(segment.checkInLocal)}</span>
            </div>
          {/if}

          {#if segment.checkOutLocal}
            <div class="time-row">
              <span class="label">🛫 Check‑out</span>
              <span class="value">{fmtTime(segment.checkOutLocal)} on {fmtDate(segment.checkOutLocal)}</span>
            </div>
          {/if}

          {#if segment.startLocal}
            <div class="time-row">
              <span class="label">Start</span>
              <span class="value">{fmtTime(segment.startLocal)} on {fmtDate(segment.startLocal)}</span>
            </div>
          {/if}

          {#if segment.endLocal}
            <div class="time-row">
              <span class="label">End</span>
              <span class="value">{fmtTime(segment.endLocal)} on {fmtDate(segment.endLocal)}</span>
            </div>
          {/if}

          {#if segment.departLocal}
            <div class="time-row">
              <span class="label">Depart</span>
              <span class="value">{fmtTime(segment.departLocal)} on {fmtDate(segment.departLocal)}</span>
            </div>
          {/if}

          {#if segment.arriveLocal}
            <div class="time-row">
              <span class="label">Arrive</span>
              <span class="value">{fmtTime(segment.arriveLocal)} on {fmtDate(segment.arriveLocal)}</span>
            </div>
          {/if}
        </div>

        {#if segment.type === "accommodation"}
          <div class="accom-details">
            {#if segment.address}
              <div class="detail-row">
                <span class="label">Address</span>
                <span class="value">{segment.address}</span>
              </div>
            {/if}

            {#if segment.phone}
              <div class="detail-row">
                <span class="label">Phone</span>
                <span class="value">{segment.phone}</span>
              </div>
            {/if}

            {#if segment.website}
              <div class="detail-row">
                <span class="label">Website</span>
                <span class="value">
                  <a href={segment.website} target="_blank" rel="noopener noreferrer">
                    {segment.website}
                  </a>
                </span>
              </div>
            {/if}
          </div>
        {/if}

        {#if segment.notes && segment.notes.length > 0}
          <div class="notes">
            {#each segment.notes as n}
              <div class="note">• {n}</div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .card {
    width: 520px;
    max-width: 520px;
    border-radius: 14px;
    padding: 18px 22px;
    box-shadow: var(--card-shadow);
    display: flex;
    flex-direction: column;
    gap: 10px;
    text-align: center;
    cursor: pointer;
    transition:
      box-shadow 0.18s ease,
      transform 0.18s ease;
    box-sizing: border-box;
  }

  .card:hover {
    box-shadow: var(--card-shadow-hover);
    transform: translateY(-1px);
  }

  .summary {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .header {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
  }

  .icon {
    font-size: 32px;
  }

  .title {
    font-size: 1.15rem;
    font-weight: 600;
  }

  .location {
    font-size: 0.95rem;
    font-weight: 500;
    color: #444;
  }

  .summary-times {
    font-size: 0.85rem;
    color: #555;
  }

  .details {
    margin-top: 10px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    text-align: left;
  }

  .description {
    font-size: 0.9rem;
    color: #555;
  }

  .times {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .time-row {
    display: flex;
    justify-content: space-between;
    font-size: 0.9rem;
  }

  .label {
    font-weight: 600;
    color: #333;
  }

  .value {
    color: #444;
  }

  .accom-details {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .detail-row {
    display: flex;
    justify-content: space-between;
    font-size: 0.9rem;
  }

  .detail-row a {
    color: #2563eb;
    text-decoration: none;
  }

  .detail-row a:hover {
    text-decoration: underline;
  }

  .notes {
    font-size: 0.9rem;
    color: #444;
  }

  .note {
    margin: 2px 0;
  }
</style>
