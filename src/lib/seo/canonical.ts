/**
 * Swift Doc — Canonical URL Utilities
 * Ensures every indexable page has a single canonical URL.
 */

import { SEO_CONFIG } from "./seo-config";

/**
 * Build a canonical URL for a given path.
 * - Strips trailing slashes (except root `/`)
 * - Strips query parameters
 * - Prepends the production site URL
 */
export function getCanonicalUrl(path: string): string {
  // Remove query parameters
  const cleanPath = path.split("?")[0].split("#")[0];

  // Normalize trailing slash: remove it unless root
  const normalizedPath =
    cleanPath === "/" ? "" : cleanPath.replace(/\/+$/, "");

  return `${SEO_CONFIG.siteUrl}${normalizedPath}`;
}

/**
 * Determine whether a path should be indexed.
 */
export function isIndexablePath(path: string): boolean {
  return !SEO_CONFIG.noIndexPaths.some(
    (noIndex) => path === noIndex || path.startsWith(`${noIndex}/`)
  );
}
