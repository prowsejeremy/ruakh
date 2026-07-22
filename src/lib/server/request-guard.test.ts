import { describe, it, expect } from 'vitest';
import { isSameOriginBrowserRequest, isCrossSiteRequest, clientIp } from './request-guard';

const req = (site: string | null) =>
  new Request('https://ruakh.test/api/content/bundle', {
    headers: site === null ? {} : { 'sec-fetch-site': site }
  });

describe('isSameOriginBrowserRequest', () => {
  it('allows the app’s own same-origin / same-site fetches', () => {
    expect(isSameOriginBrowserRequest(req('same-origin'))).toBe(true);
    expect(isSameOriginBrowserRequest(req('same-site'))).toBe(true);
  });

  it('rejects address-bar navigations, cross-site fetches, and non-browser clients', () => {
    expect(isSameOriginBrowserRequest(req('none'))).toBe(false); // pasted URL
    expect(isSameOriginBrowserRequest(req('cross-site'))).toBe(false); // other site
    expect(isSameOriginBrowserRequest(req(null))).toBe(false); // curl / scripts
  });
});

describe('isCrossSiteRequest', () => {
  it('is true only for an explicit cross-site tag', () => {
    expect(isCrossSiteRequest(req('cross-site'))).toBe(true);
  });

  it('is false for same-origin, same-site, navigations, and header-absent SW fetches', () => {
    expect(isCrossSiteRequest(req('same-origin'))).toBe(false);
    expect(isCrossSiteRequest(req('same-site'))).toBe(false);
    expect(isCrossSiteRequest(req('none'))).toBe(false);
    expect(isCrossSiteRequest(req(null))).toBe(false); // SW fetch may omit it
  });
});

describe('clientIp', () => {
  const h = (init: Record<string, string>) => new Headers(init);

  it('prefers the proxy-set X-Real-IP', () => {
    expect(clientIp(h({ 'x-real-ip': '203.0.113.7', 'x-forwarded-for': '10.0.0.1' }), 'fb')).toBe(
      '203.0.113.7'
    );
  });

  it('falls back to the first X-Forwarded-For hop', () => {
    expect(clientIp(h({ 'x-forwarded-for': '203.0.113.7, 10.0.0.1, 10.0.0.2' }), 'fb')).toBe(
      '203.0.113.7'
    );
  });

  it('falls back to getClientAddress when no proxy headers are present', () => {
    expect(clientIp(h({}), '198.51.100.4')).toBe('198.51.100.4');
  });
});
