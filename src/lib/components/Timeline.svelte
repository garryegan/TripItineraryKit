<script>
  import { fade, slide } from 'svelte/transition';
  import { onMount } from 'svelte';
  import SegmentCard from './SegmentCard.svelte';

  const { segments, forceOpen = false } = $props();

  function extractDate(seg) {
    return (
      seg.startLocal?.split("T")[0] ||
      seg.endLocal?.split("T")[0] ||
      seg.checkInLocal?.split("T")[0] ||
      seg.checkOutLocal?.split("T")[0] ||
      seg.departLocal?.split("T")[0] ||
      seg.arriveLocal?.split("T")[0] ||
      seg.date ||
      "unknown"
    );
  }

  function groupByDate(list) {
    const groups = {};
    for (const seg of list) {
      const key = extractDate(seg);
      if (!groups[key]) groups[key] = [];
      groups[key].push(seg);
    }
    return groups;
  }

  const grouped = $derived(groupByDate(segments));

  const sortedKeys = $derived(
    Object.keys(grouped).sort((a, b) => {
      if (a === "unknown") return 1;
      if (b === "unknown") return -1;
      return new Date(a) - new Date(b);
    })
  );

  function formatDay(dateStr) {
    if (dateStr === "unknown") return "Unknown Date";

    const d = new Date(dateStr);
    return d.toLocaleDateString("en-AU", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "2-digit"
    });
  }

  onMount(() => {
    const header = document.querySelector('.day-header-bar');
    const headerContainer = document.querySelectorAll('.card-container')[0];
    const firstSegmentCard = document.querySelectorAll('.card-container')[1];

    console.log('--- HEADER/CARD FORENSICS ---');
    console.log('header rect:', header?.getBoundingClientRect());
    console.log('header container rect:', headerContainer?.getBoundingClientRect());
    console.log('first segment card rect:', firstSegmentCard?.getBoundingClientRect());
  });
</script>

<div class="timeline-root">
  {#each sortedKeys as date, dayIndex}
    <div class="day-block" in:fade={{ duration: 180 }}>
      <div class="row header-row">
        <div class="spine-cell">
          <div class="timeline-dot invisible"></div>
          <div class="timeline-line invisible"></div>
        </div>

        <div class="card-container">
          <div class="day-header-bar">
            Day {dayIndex + 1} — {formatDay(date)}
          </div>
        </div>
      </div>

      {#each grouped[date] as seg, i}
        <div class="row" in:slide={{ duration: 220, easing: t => t*t }}>
          <div class="spine-cell">
            <div class="timeline-dot"></div>
            <div class="timeline-line"></div>
          </div>

          <div class="card-container" in:fade={{ delay: 40 * i, duration: 160 }}>
            <SegmentCard segment={seg} forceOpen={forceOpen} />
          </div>
        </div>
      {/each}
    </div>
  {/each}
</div>

<style>
  .timeline-root {
    display: block;
  }

  .day-block {
    width: 560px;
    margin-bottom: 48px;
    display: block;
  }

  .day-header-bar {
    width: 520px;
    padding: 18px 22px;
    border: 1px solid var(--default-border);
    background: var(--default-bg);
    border-radius: 14px;
    text-align: center;
    font-size: 1.05rem;
    font-weight: 700;
    margin-bottom: 16px;
    box-sizing: border-box;
  }

  .row {
    display: flex;
    align-items: stretch;
    gap: 10px;
    margin-bottom: 16px;
  }

  .header-row {
    margin-bottom: 16px;
    align-items: stretch;
    display: flex;
    gap: 10px;
  }

  .spine-cell {
    width: 22px;
    display: flex;
    flex-direction: row;
    align-items: stretch;
    justify-content: flex-end;
  }

  .timeline-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--timeline-blue);
    align-self: flex-start;
    margin-right: 6px;
    flex-shrink: 0;
  }

  .timeline-line {
    width: 2px;
    background: var(--timeline-blue);
    height: 100%;
  }

  .card-container {
    width: 520px;
    box-sizing: border-box;
  }

  .invisible {
    visibility: hidden;
  }
</style>
