/** Where a public page's link is rendered on the main preferences screen. */
export const PAGE_LINK_LOCATIONS = ['menu', 'footer', 'none'] as const;
export type PageLinkLocation = (typeof PAGE_LINK_LOCATIONS)[number];

export type PageLink = { uri: string; title: string };

type LinkablePage = { uri: string; title: string; linkLocation: string };

export function isPageLinkLocation(value: unknown): value is PageLinkLocation {
  return (PAGE_LINK_LOCATIONS as readonly unknown[]).includes(value);
}

/**
 * The preferences-screen link lists: pages marked `menu` or `footer`, in the
 * order given (the server queries by uri). Pages marked `none` are dropped; a
 * blank title falls back to the uri so a link is never rendered empty.
 */
export function groupPageLinks(pages: LinkablePage[]): { menu: PageLink[]; footer: PageLink[] } {
  const toLink = (p: LinkablePage): PageLink => ({
    uri: p.uri,
    title: p.title.trim() || p.uri
  });
  return {
    menu: pages.filter((p) => p.linkLocation === 'menu').map(toLink),
    footer: pages.filter((p) => p.linkLocation === 'footer').map(toLink)
  };
}
