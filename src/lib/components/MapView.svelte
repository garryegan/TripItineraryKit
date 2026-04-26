<script>
  import { onMount, tick } from "svelte";

  // --- Static imports ONLY for icons (safe for SSR) ---
  import iconUrl from "leaflet/dist/images/marker-icon.png";
  import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
  import shadowUrl from "leaflet/dist/images/marker-shadow.png";

  const { segments } = $props();

  function filterSegmentsWithinAccommodationWindow(segments) {
    const accommodations = segments.filter(s => s.type === "accommodation");
    if (accommodations.length === 0) return [];

    const first = segments.indexOf(accommodations[0]);
    const last = segments.indexOf(accommodations[accommodations.length - 1]);

    return segments.slice(first, last + 1).filter(s =>
      s.type !== "flight" &&
      s.type !== "layover" &&
      s.type !== "transport" &&
      s.type !== "note"
    );
  }

  const filtered = $derived(filterSegmentsWithinAccommodationWindow(segments));

  let map;

  onMount(async () => {
    // --- Dynamic import of Leaflet (required for SSR safety) ---
    const L = await import("leaflet");
    await import("leaflet/dist/leaflet.css");
    await tick();

    // --- Apply icon fix AFTER dynamic import ---
    const defaultIcon = L.icon({
      iconUrl,
      iconRetinaUrl,
      shadowUrl,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    L.Marker.prototype.options.icon = defaultIcon;

    const allLocations = [];

    for (const seg of filtered) {
      if (!seg.locations) continue;
      for (const loc of seg.locations) {
        allLocations.push({
          segmentTitle: seg.title,
          name: loc.name,
          lat: loc.lat,
          lon: loc.lon
        });
      }
    }

    // Deduplicate
    const unique = [];
    const seen = new Set();
    for (const loc of allLocations) {
      if (!seen.has(loc.name)) {
        seen.add(loc.name);
        unique.push(loc);
      }
    }

    map = L.map("map", { zoomControl: true, scrollWheelZoom: true });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19
    }).addTo(map);

    const bounds = [];

    for (const loc of unique) {
      const latlng = [loc.lat, loc.lon];
      bounds.push(latlng);
      L.marker(latlng).addTo(map).bindPopup(`
        <strong>${loc.segmentTitle}</strong><br/>
        ${loc.name}
      `);
    }

    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [40, 40] });
    } else {
      map.setView([42.7, 23.3], 5);
    }
  });
</script>

<div id="map"></div>

<style>
  #map {
    width: 100%;
    height: 600px;
  }
</style>
