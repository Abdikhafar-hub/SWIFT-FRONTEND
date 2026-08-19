/**
 * Swift Doc — Reusable Metadata Generators
 * Uses Next.js App Router Metadata API.
 */

import type { Metadata } from "next";
import { SEO_CONFIG } from "./seo-config";
import { getCanonicalUrl } from "./canonical";

export interface PageMetadataOptions {
  title: string;
  description: string;
  path: string;
  ogImage?: string;
  noIndex?: boolean;
  keywords?: string[];
}

/**
 * Create consistent Next.js Metadata for any public page.
 */
export function createPageMetadata({
  title,
  description,
  path,
  ogImage,
  noIndex = false,
  keywords,
}: PageMetadataOptions): Metadata {
  const canonical = getCanonicalUrl(path);
  const image = ogImage || SEO_CONFIG.defaultOgImage;

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: SEO_CONFIG.siteName,
      locale: SEO_CONFIG.locale,
      type: "website",
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
  };
}

export interface ServiceMetadataInput {
  slug: string;
  seoTitle?: string;
  name: string;
  seoDescription?: string;
  description?: string;
}

/**
 * Create metadata for a service detail page.
 */
export function createServiceMetadata(
  service: ServiceMetadataInput
): Metadata {
  const title =
    service.seoTitle || `${service.name} | Swift Doc`;
  const description =
    service.seoDescription ||
    service.description ||
    `Learn about ${service.name} — requirements, process, fees, and how Swift Doc helps you with statutory filings in Kenya.`;

  return createPageMetadata({
    title,
    description,
    path: `/services/${service.slug}`,
  });
}

export interface ArticleMetadataInput {
  slug: string;
  seoTitle?: string;
  title: string;
  seoDescription?: string;
  description: string;
  excerpt?: string;
  author?: string;
  publishedAt?: string;
  updatedAt?: string;
  featuredImage?: string;
  tags?: string[];
  type: "blog" | "guides";
}

/**
 * Create metadata for a blog or guide article.
 */
export function createArticleMetadata(
  article: ArticleMetadataInput
): Metadata {
  const title = article.seoTitle || `${article.title} | Swift Doc`;
  const description =
    article.seoDescription || article.description || article.excerpt || "";

  const base = createPageMetadata({
    title,
    description,
    path: `/${article.type}/${article.slug}`,
    ogImage: article.featuredImage,
    keywords: article.tags,
  });

  return {
    ...base,
    openGraph: {
      ...base.openGraph,
      type: "article",
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
      authors: article.author ? [article.author] : undefined,
      tags: article.tags,
    },
  };
}
