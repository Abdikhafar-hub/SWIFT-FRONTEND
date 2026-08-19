/**
 * Swift Doc — Analytics Utilities
 * Lightweight event tracking wrapper.
 */

type EventParams = Record<string, string | number | boolean>;

/**
 * Track a custom event. Only fires when GA is configured.
 */
export function trackEvent(name: string, params?: EventParams): void {
  if (typeof window === "undefined") return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gtag = (window as any).gtag;
  if (typeof gtag !== "function") return;

  gtag("event", name, params);
}

/* ── Pre-defined event helpers ─────────────────── */

export function trackServicePageView(serviceSlug: string): void {
  trackEvent("service_page_view", { service: serviceSlug });
}

export function trackServiceCtaClick(serviceSlug: string): void {
  trackEvent("service_cta_click", { service: serviceSlug });
}

export function trackRegistrationClick(source: string): void {
  trackEvent("registration_click", { source });
}

export function trackContactClick(source: string): void {
  trackEvent("contact_click", { source });
}

export function trackArticleEngagement(slug: string, type: string): void {
  trackEvent("article_engagement", { slug, content_type: type });
}
