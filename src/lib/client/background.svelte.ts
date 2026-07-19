// Shared visibility flag for the global PatternBackground lines. Any page or
// section can hide the lines by setting `patternBackground.visible = false`
// (e.g. the breathing exercise fades them out for its duration); the component
// cross-fades the line layer's opacity to match. Transient/in-memory only —
// restore it to `true` when your screen unmounts so the lines return elsewhere.
// Only ever mutated in the browser, so SSR always renders lines-visible.
export const patternBackground = $state({ visible: true });
