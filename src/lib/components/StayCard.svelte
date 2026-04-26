<script>
  export let stay;

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

  const nights = stay.nights;
</script>

<div class="stay-card">
  <div class="header">
    <div class="icon">🏨</div>
    <div class="title">{stay.hotel}</div>
  </div>

  <div class="location">{stay.location}</div>

  <div class="dates">
    <div class="row">
      <span class="label">🛬 Check‑in</span>
      <span class="value">{fmtDate(stay.checkInLocal)} • {fmtTime(stay.checkInLocal)}</span>
    </div>

    <div class="row">
      <span class="label">🛫 Check‑out</span>
      <span class="value">{fmtDate(stay.checkOutLocal)} • {fmtTime(stay.checkOutLocal)}</span>
    </div>

    <div class="row nights">
      <span class="label">Nights</span>
      <span class="value">{nights}</span>
    </div>
  </div>
</div>

<style>
  .stay-card {
    background: white;
    border-radius: 12px;
    padding: 18px 22px;
    margin: 14px 0;
    box-shadow: 0 2px 6px rgba(0,0,0,0.08);
    text-align: center;
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
    margin-top: 4px;
    font-size: 0.95rem;
    color: #444;
  }

  .dates {
    margin-top: 12px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .row {
    display: flex;
    justify-content: space-between;
    font-size: 0.9rem;
  }

  .label {
    font-weight: 600;
  }

  .nights {
    margin-top: 6px;
    font-size: 1rem;
  }
</style>
