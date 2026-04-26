<script>
  console.log("LAYOUT SVELTE: running");
</script>

<div class="layout-shell">
  <slot />
</div>

<style>
  .layout-shell {
    width: 100%;
    min-height: 100vh;
    margin: 0;
    padding: 0;
    display: block;
  }

  :global(body) {
    margin: 0;
  }
</style>
