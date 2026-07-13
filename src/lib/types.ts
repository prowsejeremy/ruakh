import type { ContentBlock } from './markdown';

/** The client-facing shape of a reflection — exactly what routes load and screens render. */
export type ReflectionView = {
  id: number;
  /** Ordered content parts; the client renders these as slides.
   * Each part is pre-parsed markdown-lite blocks (one <p>/heading per block). */
  body: ContentBlock[][];
  attribution: string | null;
  source: string | null;
};
