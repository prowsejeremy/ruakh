<script lang="ts">
  import Reveal from '$lib/components/Reveal.svelte';
  import Logo from '$lib/components/Logo.svelte';
</script>

<section>
  <!-- The optical-centering offset lives on the wrapper: the crossfade writes an
       inline transform on the h1, which would otherwise overwrite it. Reveal
       animates its own wrapper, so the offset transform is untouched. -->
  <div class="offset">
    <Reveal>
      <Logo size={'60vw'} />
    </Reveal>
  </div>
</section>

<style>
  /* Fixed overlay: while the wordmark morphs out, the reflection screen already
     occupies the document flow at its final position underneath. No pointer
     events: the overlay must not swallow eager taps meant for the page below. */
  section {
    position: fixed;
    inset: 0;
    pointer-events: none;
    display: flex;
    align-items: center;
    padding: 2rem;
  }
  .offset {
    transform: translateY(12%);
    margin: 0 auto;
  }
</style>
