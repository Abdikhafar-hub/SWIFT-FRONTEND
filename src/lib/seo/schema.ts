/**
 * Swift Doc — JSON-LD Structured Data Generators
 * Returns plain objects ready for serialization.
 */

import { SEO_CONFIG } from "./seo-config";
import { getCanonicalUrl } from "./canonical";

/* ──────────────────────────────────────────────
 * Organization + WebSite (homepage)
 * ────────────────────────────────────────────── */

export function createOrganizationSchema() {
  const org = SEO_CONFIG.organization;
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: org.name,
    legalName: org.legalName,
    url: org.url,
    email: org.email,
    telephone: org.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: org.address.streetAddress,
      addressLocality: org.address.addressLocality,
      addressRegion: org.address.addressRegion,
      postalCode: org.address.postalCode,
      addressCountry: org.address.addressCountry,
    },
  };
}

export function createWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SEO_CONFIG.siteName,
    url: SEO_CONFIG.siteUrl,
    description: SEO_CONFIG.siteDescription,
    publisher: {
      "@type": "Organization",
      name: SEO_CONFIG.organization.name,
    },
  };
}

/* ──────────────────────────────────────────────
 * Local Business (contact / location pages)
 * ────────────────────────────────────────────── */

export interface LocalBusinessInput {
  name: string;
  description?: string;
  streetAddress: string;
  locality: string;
  region: string;
  postalCode: string;
  phone: string;
  email: string;
  openingHours?: string;
  url: string;
}

export function createLocalBusinessSchema(input: LocalBusinessInput) {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: input.name,
    description: input.description,
    url: input.url,
    telephone: input.phone,
    email: input.email,
    openingHours: input.openingHours,
    address: {
      "@type": "PostalAddress",
      streetAddress: input.streetAddress,
      addressLocality: input.locality,
      addressRegion: input.region,
      postalCode: input.postalCode,
      addressCountry: "KE",
    },
  };
}

/* ──────────────────────────────────────────────
 * Service
 * ────────────────────────────────────────────── */

export interface ServiceSchemaInput {
  name: string;
  slug: string;
  description: string;
  provider?: string;
}

export function createServiceSchema(input: ServiceSchemaInput) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: input.name,
    description: input.description,
    url: getCanonicalUrl(`/services/${input.slug}`),
    provider: {
      "@type": "Organization",
      name: input.provider || SEO_CONFIG.organization.name,
    },
    areaServed: {
      "@type": "Country",
      name: "Kenya",
    },
  };
}

/* ──────────────────────────────────────────────
 * Breadcrumbs
 * ────────────────────────────────────────────── */

export interface BreadcrumbItem {
  label: string;
  href: string;
}

export function createBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      item: getCanonicalUrl(item.href),
    })),
  };
}

/* ──────────────────────────────────────────────
 * FAQPage
 * ────────────────────────────────────────────── */

export interface FaqItem {
  question: string;
  answer: string;
}

export function createFaqSchema(faqs: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

/* ──────────────────────────────────────────────
 * Article
 * ────────────────────────────────────────────── */

export interface ArticleSchemaInput {
  title: string;
  description: string;
  slug: string;
  type: "blog" | "guides";
  author?: string;
  publishedAt?: string;
  updatedAt?: string;
  featuredImage?: string;
}

export function createArticleSchema(input: ArticleSchemaInput) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.title,
    description: input.description,
    url: getCanonicalUrl(`/${input.type}/${input.slug}`),
    datePublished: input.publishedAt,
    dateModified: input.updatedAt || input.publishedAt,
    image: input.featuredImage,
    author: {
      "@type": "Person",
      name: input.author || "Swift Doc Team",
    },
    publisher: {
      "@type": "Organization",
      name: SEO_CONFIG.organization.name,
    },
  };
}

/* ──────────────────────────────────────────────
 * CollectionPage
 * ────────────────────────────────────────────── */

export function createCollectionPageSchema(page: {
  name: string;
  description: string;
  path: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: page.name,
    description: page.description,
    url: getCanonicalUrl(page.path),
  };
}
