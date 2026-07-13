<section aria-label="Loading">
  <div class="ring" aria-hidden="true"></div>
  <p>ruakh</p>
</section>

<style>
  section {
    min-height: 100vh;
    min-height: 100dvh;
    display: grid;
    place-items: center;
  }
  .ring,
  p {
    grid-area: 1 / 1;
  }
  .ring {
    width: min(55vw, 20rem);
    aspect-ratio: 1;
    border-radius: 50%;
    border: 1.1rem solid var(--color-accent);
    /* open ring: one gap, per the mock */
    border-top-color: transparent;
    transform: rotate(35deg);
  }
  p {
    font-size: 2rem;
    font-weight: 700;
  }
</style>
