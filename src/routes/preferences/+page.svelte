<script lang="ts">
  import Icon from '$lib/components/Icon.svelte';
  import { reveal } from '$lib/transitions';
</script>

<!-- Container carries `out` (the whole menu leaves as one block); each button
     carries `in` so they stagger into place top-to-bottom on entry. -->
<nav class="menu" out:reveal|global>
  <a class="panel-menu-btn" in:reveal|global href="/preferences/theme">Theme <Icon name="forward" size="1.9rem" /></a>
  <a class="panel-menu-btn" in:reveal|global href="/preferences/saved">Saved reflections <Icon name="forward" size="1.9rem" /></a>
  <a class="panel-menu-btn" in:reveal|global href="/preferences/history">Past reflections <Icon name="forward" size="1.9rem" /></a>
  <a class="panel-menu-btn" in:reveal|global href="/preferences/device">Your device <Icon name="forward" size="1.9rem" /></a>
  <a class="panel-menu-btn" in:reveal|global href="/about">About <Icon name="forward" size="1.9rem" /></a>
</nav>

<style>
  .menu {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
</style>
