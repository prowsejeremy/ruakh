<script lang="ts">
  import BackButton from '$lib/components/BackButton.svelte';
  import { enhance } from '$app/forms';
  import { randomPassword } from '$lib/client/password';
  import type { ActionData } from './$types';

  let { form }: { form: ActionData } = $props();

  let password = $state('');
  let generated = $state(false);

  function generate() {
    password = randomPassword(24);
    generated = true;
  }

  function onInput() {
    // A hand-typed password must not be revealed back after saving.
    generated = false;
  }
</script>

<svelte:head>
  <title>new user — admin — ruakh</title>
</svelte:head>

<main class="panel-main">
  <header class="panel-header">
    <BackButton background="#101010" />
    <h1 class="panel-title">new user</h1>
  </header>

  {#if form?.generatedPassword}
    <p class="panel-blurb">
      Admin created for <strong>{form.email}</strong>. Store this password now — it won't be shown
      again:
    </p>
    <p class="panel-card-title">{form.generatedPassword}</p>
    <a class="panel-save" href="/admin/users">Done</a>
  {:else if form?.created}
    <p class="panel-blurb">Admin created for <strong>{form.email}</strong>.</p>
    <a class="panel-save" href="/admin/users">Done</a>
  {:else}
    <form method="POST" action="?/create" use:enhance>
      <label class="panel-field">
        Email
        <input type="email" name="email" required value={form?.email ?? ''} />
      </label>

      <label class="panel-field">
        Password
        <input
          type="text"
          name="password"
          required
          minlength="12"
          autocomplete="new-password"
          bind:value={password}
          oninput={onInput}
        />
      </label>
      <input type="hidden" name="generated" value={generated ? '1' : ''} />
      <button type="button" class="panel-link-btn" onclick={generate}>Generate password</button>

      {#if form?.error}<p class="panel-error">{form.error}</p>{/if}

      <button type="submit" class="panel-save">Save</button>
    </form>
  {/if}
</main>

<style>
  form {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  form .panel-link-btn {
    align-self: flex-start;
    margin-top: -0.75rem;
  }
</style>
