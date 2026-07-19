<script lang="ts">
  import { MARKDOWN_EXAMPLES, examplePreview } from '$lib/markdown-help';
  let open = $state(false);
  const panelId = 'md-help-panel';
</script>

<button
  type="button"
  class="panel-link-btn md-help-link"
  aria-expanded={open}
  aria-controls={panelId}
  onclick={() => (open = !open)}
>
  <span class="info-icon">i</span>
  {#if open}
    hide formatting help
  {:else}
    formatting help
  {/if}
</button>

{#if open}
  <div id={panelId} class="md-help-panel">
    <p class="md-help-intro">
      These editors use a lightweight markdown. Separate paragraphs with a blank
      line; single line breaks are kept within a paragraph.
    </p>
    <dl class="md-help-grid">
      {#each MARKDOWN_EXAMPLES as ex (ex.label)}
        <dt>
          <span class="md-help-label">{ex.label}</span>
          <code>{ex.syntax}</code>
        </dt>
        <dd>{@html examplePreview(ex.syntax)}</dd>
      {/each}
    </dl>
  </div>
{/if}

<style>
  .info-icon {
    display: inline-block;
    width: 1.5rem;
    height: 1.5rem;
    line-height: 1.5rem;
    text-align: center;
    border-radius: 50%;
    background-color: rgba(var(--color-ink-rgb), 0.15);
    color: rgba(var(--color-ink-rgb), 0.85);
    font-size: 0.9rem;
    font-weight: bold;
    text-decoration: none !important;
  }
  /* Pushes the trigger to the right of the field title in .panel-field-head. */
  .md-help-link {
    margin-left: auto;
  }
  /* Full-width flex item: wraps onto its own line below the title + link. */
  .md-help-panel {
    flex-basis: 100%;
    border: 1px solid rgba(var(--color-ink-rgb), 0.25);
    border-radius: 0.5rem;
    padding: 0.75rem 0.9rem;
    font-size: var(--text-small);
    margin-bottom: 1rem;
  }
  .md-help-intro {
    opacity: 0.85;
    margin: 0 0 0.5rem;
  }
  .md-help-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 0.5rem 1rem;
    align-items: baseline;
    margin: 0;
  }
  dt,
  dd {
    margin: 0;
    min-width: 0;
  }
  dt code {
    display: block;
    white-space: pre-wrap;
    word-break: break-word;
    font-family: ui-monospace, monospace;
    background: rgba(var(--color-ink-rgb), 0.08);
    border-radius: 0.35rem;
    padding: 0.3rem 0.45rem;
    margin-top: 0.15rem;
  }
  .md-help-label {
    display: block;
    opacity: 0.7;
    font-size: 0.85em;
  }
  dd {
    /* Tame the rendered preview so it reads as a sample, not page content.
       :global is necessary — the preview is {@html} output, which Svelte
       does not scope. */
    :global(h1) {
      font-size: 1.1rem;
    }
    :global(h2) {
      font-size: 1rem;
    }
    :global(:first-child) {
      margin-top: 0;
    }
    :global(:last-child) {
      margin-bottom: 0;
    }
    :global(hr) {
      border: none;
      border-top: 1px solid rgba(var(--color-ink-rgb), 0.4);
      margin: 0.4rem 0;
    }

    @media (max-width: 30rem) {
      margin-bottom: 0.5rem;
    }
  }
</style>
