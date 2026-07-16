<script lang="ts">
  // A controlled on/off switch built on a native checkbox, so a wrapping or
  // `for=`-associated <label> toggles it too and keyboard support comes free.
  // The parent owns `checked` and reacts to `onchange` — deliberately
  // presentational so it can't misrepresent state during an async round-trip
  // (e.g. the daily reminder only flips on once the server subscription
  // succeeds). Visuals track the `checked` prop, not the input's own :checked,
  // so a controlled parent never sees a flash before its state catches up.
  let {
    checked,
    onchange,
    label,
    id,
    disabled = false
  }: {
    checked: boolean;
    onchange: () => void;
    label: string;
    id?: string;
    disabled?: boolean;
  } = $props();
</script>

<span class="toggle" class:on={checked} class:disabled>
  <input
    {id}
    class="native"
    type="checkbox"
    role="switch"
    checked={checked}
    aria-label={label}
    {disabled}
    {onchange}
  />
  <span class="track"></span>
  <span class="knob"></span>
</span>

<style>
  .toggle {
    --track-w: 3.25rem;
    --track-h: 1.85rem;
    --knob: 1.5rem;
    /* even gap between knob and track edge */
    --pad: calc((var(--track-h) - var(--knob)) / 2);
    position: relative;
    flex: none;
    display: inline-block;
    width: var(--track-w);
    height: var(--track-h);

    &.disabled {
      opacity: 0.5;
    }
    &.on .track {
      background: #10e260;
    }
    &.on .knob {
      background: #f5f3ee;
      translate: calc(var(--track-w) - var(--knob) - var(--pad) * 2) 0;
    }
  }

  /* The real control: fills the switch, invisible, sits on top so direct
     clicks land on it while an external <label for> still activates it. */
  .native {
    position: absolute;
    inset: 0;
    margin: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
    z-index: 1;

    &:disabled {
      cursor: not-allowed;
    }
    &:focus-visible ~ .track {
      outline: 2px solid var(--color-ink);
      outline-offset: 2px;
    }
  }

  .track {
    position: absolute;
    inset: 0;
    border-radius: 999px;
    border: 1px solid rgba(var(--color-ink-rgb), 0.15);
    background: transparent;
    box-shadow: 0 0 5px rgba(0, 0, 0, 0.15) inset;
    transition: background-color 180ms var(--transition-timing);
  }

  .knob {
    position: absolute;
    top: var(--pad);
    left: var(--pad);
    width: var(--knob);
    height: var(--knob);
    border-radius: 50%;
    background: var(--color-ink);
    translate: 0 0;
    transition: translate 300ms var(--transition-timing), background 300ms var(--transition-timing);
  }
</style>
