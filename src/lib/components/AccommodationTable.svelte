<script>
  const { segments } = $props();

  // 1. Extract ONLY accommodation segments
  const raw = $derived(
    segments.filter(s => s.type === "accommodation")
  );

  // 2. Correct pairing logic:
  //    - Sort by check-in/check-out dates ONLY
  //    - Ignore startLocal/endLocal (free-days, activities, notes)
  //    - Pair each check-out with the most recent unmatched check-in
  function pairStays(list) {
    const sorted = [...list].sort((a, b) => {
      const da = a.checkInLocal || a.checkOutLocal;
      const db = b.checkInLocal || b.checkOutLocal;
      return new Date(da) - new Date(db);
    });

    const stays = [];
    const open = new Map(); // title → unmatched check-in

    for (const seg of sorted) {
      const title = seg.title.trim();

      // Check-in segment
      if (seg.checkInLocal) {
        open.set(title, {
          title,
          checkIn: seg.checkInLocal,
          checkOut: null,
          loc: seg.locations?.[0] || null
        });
      }

      // Check-out segment
      if (seg.checkOutLocal) {
        const stay = open.get(title);
        if (stay) {
          stay.checkOut = seg.checkOutLocal;
          stays.push(stay);
          open.delete(title);
        }
      }
    }

    return stays;
  }

  // 3. Build stays list
  const stays = $derived(
    pairStays(raw).sort((a, b) =>
      (a.checkIn || a.checkOut).localeCompare(b.checkIn || b.checkOut)
    )
  );

  // --- TIMEZONE-SAFE HELPERS ---

  // Extract only the YYYY-MM-DD portion and treat as a plain local date
  function parseDate(str) {
    if (!str) return null;
    const d = str.slice(0, 10); // "2026-05-23"
    return new Date(d + "T00:00:00");
  }

  function formatDate(d) {
    if (!d) return "";
    return d.toLocaleDateString("en-AU", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "2-digit"
    });
  }

  function diffNights(checkInStr, checkOutStr) {
    const inD = parseDate(checkInStr);
    const outD = parseDate(checkOutStr);
    if (!inD || !outD) return "";
    const ms = outD.getTime() - inD.getTime();
    return Math.max(1, Math.round(ms / 86400000));
  }

  function extractCityCountry(name) {
    if (!name) return { city: "", country: "" };
    const parts = name.split(",").map(s => s.trim());
    return { city: parts[0] || "", country: parts[1] || "" };
  }
</script>

<div class="table-wrapper">
  <table class="accom-table">
    <thead>
      <tr>
        <th>Accommodation</th>
        <th>City</th>
        <th>Country</th>
        <th>Check‑in</th>
        <th>Check‑out</th>
        <th>Nights</th>
      </tr>
    </thead>

    <tbody>
      {#each stays as s (s.title + s.checkIn)}
        {@const place = extractCityCountry(s.loc?.name)}

        <tr>
          <td>{s.title}</td>
          <td>{place.city}</td>
          <td>{place.country}</td>
          <td>{formatDate(parseDate(s.checkIn))}</td>
          <td>{formatDate(parseDate(s.checkOut))}</td>
          <td style="text-align:center">
            {diffNights(s.checkIn, s.checkOut)}
          </td>
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

  .accom-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.95rem;
  }

  th, td {
    border: 1px solid #ddd;
    padding: 6px 8px;
  }

  th {
    background: #f5f5f5;
    text-align: left;
  }

  /* Force single-line rows with minimal tail */
  .accom-table td,
  .accom-table th {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    padding-right: 12px;
  }

  /* Prevent columns from collapsing too tightly */
  .accom-table td {
    min-width: 80px;
  }
</style>
