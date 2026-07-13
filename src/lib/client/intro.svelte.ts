// Whether the once-per-full-page-load intro has finished. Shared between the
// home page (which plays the intro and flips this) and the root layout (which
// holds the header wordmark back until the intro wordmark can morph into it).
// Only ever mutated in the browser, so SSR of `/` always renders intro-first —
// same behavior as the module-level `introPlayed` this replaces.
export const intro = $state({ done: false });
