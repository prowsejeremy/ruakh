<script lang="ts">
  import { enhance } from '$app/forms';
  import Icon from '$lib/components/Icon.svelte';
  import MarkdownHelp from '$lib/components/admin/MarkdownHelp.svelte';
  
  type Initial = {
    sections: string[];
    attribution: string | null;
    source: string | null;
    copyright: string | null;
    isPublished: boolean;
  };

  let {
    initial,
    action,
    error
  }: { initial?: Initial; action: string; error?: string } = $props();

  let sections = $state<string[]>(initial?.sections?.length ? [...initial.sections] : ['']);
  let attribution = $state(initial?.attribution ?? '');
  let source = $state(initial?.source ?? '');
  let copyright = $state(initial?.copyright ?? '');
  let isPublished = $state(initial?.isPublished ?? true);

  function addSection() {
    sections = [...sections, ''];
  }

  function removeSection(i: number) {
    sections = sections.filter((_, idx) => idx !== i);
  }
</script>

<form method="POST" {action} use:enhance>
  <fieldset class="panel-field">
    <div class="panel-field-head">
      <span>Content</span>
      <MarkdownHelp />
    </div>
    {#each sections as _, i}
      <div class="section-row">
        <textarea name="sections" rows="4" bind:value={sections[i]}></textarea>
        {#if sections.length > 1}
          <button type="button" class="panel-link-btn" onclick={() => removeSection(i)}>
            remove
          </button>
        {/if}
      </div>
    {/each}
    <button type="button" class="panel-link-btn" onclick={addSection}>
      <Icon name="add" background="#101010" size="1.5rem" />
      Add content section
    </button>
  </fieldset>

  <label class="panel-field">
    Author
    <input type="text" name="attribution" bind:value={attribution} />
  </label>

  <label class="panel-field">
    Source
    <input type="text" name="source" bind:value={source} />
  </label>

  <label class="panel-field">
    Copyright
    <input type="text" name="copyright" bind:value={copyright} />
  </label>

  <label class="panel-checkbox">
    <input type="checkbox" name="isPublished" bind:checked={isPublished} />
    published
  </label>

  {#if error}<p class="panel-error">{error}</p>{/if}

  <button type="submit" class="panel-save">Save</button>
</form>

<style>
  form {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }
  fieldset {
    border: none;
    padding: 0;
    margin: 0;
  }
  .section-row {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.35rem;
    margin-bottom: 0.75rem;
  }
  .section-row textarea {
    width: 100%;
  }
</style>
