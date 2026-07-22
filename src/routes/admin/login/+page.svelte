<script lang="ts">
  import { enhance } from '$app/forms';
  import type { ActionData } from './$types';

  let { form }: { form: ActionData } = $props();
</script>

<svelte:head>
  <title>admin — ruakh</title>
</svelte:head>

<main>
  <h1>admin</h1>

  <form method="POST" use:enhance>
    <label>
      email
      <input type="email" name="email" required autocomplete="username" />
    </label>
    <label>
      password
      <input type="password" name="password" required autocomplete="current-password" />
    </label>
    {#if form?.error}<p class="error">{form.error}</p>{/if}
    <button type="submit" class="panel-save">Sign In</button>
  </form>
</section>

<style>
  main {
    min-height: calc(100vh - var(--app-header-height));
    max-width: 24rem;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }
  h1 {
    font-size: var(--text-heading);
    font-weight: 700;
    line-height: 1;
  }
  form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  label {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: var(--text-small);
  }
  input {
    font: inherit;
    font-size: var(--text-body);
    background: none;
    border: 1px solid var(--color-ink);
    border-radius: 0.25rem;
    padding: 0.4rem 0.6rem;
    color: inherit;
  }
  .error {
    font-size: var(--text-small);
    font-weight: 700;
  }
</style>
