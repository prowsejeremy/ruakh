<script lang="ts">
  import BackButton from '$lib/components/BackButton.svelte';
  import { enhance } from '$app/forms';
  import type { ActionData, PageData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  let showPassword = $state(false);
  let next = $state('');
  let confirm = $state('');

  let mismatch = $derived(next.length > 0 && confirm.length > 0 && next !== confirm);
</script>

<svelte:head>
  <title>my account — admin — ruakh</title>
</svelte:head>

<main class="panel-main">
  <header class="panel-header">
    <BackButton background="#101010" />
    <h1 class="panel-title">my account</h1>
  </header>

  <form
    method="POST"
    action="?/updateEmail"
    use:enhance={() => async ({ update }) => update({ reset: false })}
  >
    <label class="panel-field">
      Email
      <input type="email" name="email" value={data.admin.email} required />
    </label>

    {#if form?.emailError}<p class="panel-error">{form.emailError}</p>{/if}
    {#if form?.emailUpdated}<p class="panel-blurb">Email updated.</p>{/if}

    <button type="submit" class="panel-save">Save email</button>
  </form>

  {#if showPassword}
    <form method="POST" action="?/changePassword" use:enhance>
      <label class="panel-field">
        Current password
        <input type="password" name="current" required autocomplete="current-password" />
      </label>

      <label class="panel-field">
        New password
        <input
          type="password"
          name="next"
          required
          minlength="12"
          autocomplete="new-password"
          bind:value={next}
        />
      </label>

      <label class="panel-field">
        Confirm new password
        <input
          type="password"
          name="confirm"
          required
          minlength="12"
          autocomplete="new-password"
          bind:value={confirm}
        />
      </label>

      {#if mismatch}<p class="panel-error">New passwords do not match.</p>{/if}
      {#if form?.passwordError}<p class="panel-error">{form.passwordError}</p>{/if}
      {#if form?.passwordChanged}<p class="panel-blurb">Password changed.</p>{/if}

      <button type="submit" class="panel-save" disabled={mismatch}>Change password</button>
    </form>
  {:else}
    <button type="button" class="panel-link-btn" onclick={() => (showPassword = true)}>
      Change Password
    </button>
  {/if}
</main>

<style>
  form {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    margin-bottom: 2rem;
  }
</style>
