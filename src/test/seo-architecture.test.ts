/**
 * Swift Doc — SEO Architecture Tests
 */

import { describe, it, expect } from "vitest";
import {
  getCanonicalUrl,
  isIndexablePath,
  createPageMetadata,
  createServiceMetadata,
  createArticleMetadata,
  createOrganizationSchema,
  createWebSiteSchema,
  createBreadcrumbSchema,
  createFaqSchema,
  createServiceSchema,
  createArticleSchema,
  SEO_CONFIG,
} from "@/lib/seo";
import { SERVICE_CATALOG, getServiceBySlug, getAllServiceSlugs } from "../../content/services";

/* ── Canonical URL Tests ─────────────────────── */

describe("getCanonicalUrl", () => {
  it("constructs canonical URL for root path", () => {
    const url = getCanonicalUrl("/");
    expect(url).toBe(SEO_CONFIG.siteUrl);
  });

  it("constructs canonical URL for service path", () => {
    const url = getCanonicalUrl("/services/company-registration");
    expect(url).toBe(`${SEO_CONFIG.siteUrl}/services/company-registration`);
  });

  it("strips trailing slash", () => {
    const url = getCanonicalUrl("/services/");
    expect(url).toBe(`${SEO_CONFIG.siteUrl}/services`);
  });

  it("strips query parameters", () => {
    const url = getCanonicalUrl("/services?category=kra");
    expect(url).toBe(`${SEO_CONFIG.siteUrl}/services`);
  });
});

/* ── Indexability Tests ──────────────────────── */

describe("isIndexablePath", () => {
  it("allows public pages", () => {
    expect(isIndexablePath("/")).toBe(true);
    expect(isIndexablePath("/services")).toBe(true);
    expect(isIndexablePath("/blog")).toBe(true);
    expect(isIndexablePath("/about")).toBe(true);
    expect(isIndexablePath("/contact")).toBe(true);
  });

  it("blocks auth pages", () => {
    expect(isIndexablePath("/login")).toBe(false);
    expect(isIndexablePath("/register")).toBe(false);
    expect(isIndexablePath("/forgot-password")).toBe(false);
  });

  it("blocks admin and client areas", () => {
    expect(isIndexablePath("/admin")).toBe(false);
    expect(isIndexablePath("/admin/applications")).toBe(false);
    expect(isIndexablePath("/client")).toBe(false);
    expect(isIndexablePath("/client/dashboard")).toBe(false);
  });
});

/* ── Metadata Generation Tests ───────────────── */

describe("createPageMetadata", () => {
  it("generates correct title and description", () => {
    const meta = createPageMetadata({
      title: "Test Page | Swift Doc",
      description: "Test description",
      path: "/test",
    });
    expect(meta.title).toBe("Test Page | Swift Doc");
    expect(meta.description).toBe("Test description");
  });

  it("generates canonical alternates", () => {
    const meta = createPageMetadata({
      title: "Services | Swift Doc",
      description: "Desc",
      path: "/services",
    });
    expect(meta.alternates?.canonical).toBe(`${SEO_CONFIG.siteUrl}/services`);
  });

  it("sets noindex correctly", () => {
    const meta = createPageMetadata({
      title: "Private",
      description: "Private page",
      path: "/private",
      noIndex: true,
    });
    expect(meta.robots).toEqual({ index: false, follow: false });
  });

  it("generates openGraph metadata", () => {
    const meta = createPageMetadata({
      title: "Blog | Swift Doc",
      description: "Blog desc",
      path: "/blog",
    });
    expect(meta.openGraph?.title).toBe("Blog | Swift Doc");
    expect(meta.openGraph?.url).toContain("/blog");
    expect(meta.openGraph?.siteName).toBe("Swift Doc");
  });
});

describe("createServiceMetadata", () => {
  it("generates unique metadata for a service", () => {
    const meta = createServiceMetadata({
      slug: "company-registration",
      name: "Company Registration",
      seoTitle: "Company Registration in Kenya | Swift Doc",
      seoDescription: "Learn about company registration.",
    });
    expect(meta.title).toBe("Company Registration in Kenya | Swift Doc");
    expect(meta.alternates?.canonical).toContain("company-registration");
  });
});

describe("createArticleMetadata", () => {
  it("generates article metadata with og:type article", () => {
    const meta = createArticleMetadata({
      slug: "how-to-register-company-in-kenya",
      title: "How to Register a Company in Kenya",
      description: "Company registration guide.",
      type: "blog",
      publishedAt: "2026-08-01",
    });
    expect((meta.openGraph as any)?.type).toBe("article");
  });
});

/* ── Structured Data Tests ───────────────────── */

describe("createOrganizationSchema", () => {
  it("returns valid Organization schema", () => {
    const schema = createOrganizationSchema();
    expect(schema["@type"]).toBe("Organization");
    expect(schema.name).toBe(SEO_CONFIG.organization.name);
    expect(schema.address["@type"]).toBe("PostalAddress");
  });
});

describe("createWebSiteSchema", () => {
  it("returns valid WebSite schema", () => {
    const schema = createWebSiteSchema();
    expect(schema["@type"]).toBe("WebSite");
    expect(schema.url).toBe(SEO_CONFIG.siteUrl);
  });
});

describe("createBreadcrumbSchema", () => {
  it("creates breadcrumb with correct item count", () => {
    const schema = createBreadcrumbSchema([
      { label: "Home", href: "/" },
      { label: "Services", href: "/services" },
      { label: "Company Registration", href: "/services/company-registration" },
    ]);
    expect(schema["@type"]).toBe("BreadcrumbList");
    expect(schema.itemListElement).toHaveLength(3);
    expect(schema.itemListElement[0].position).toBe(1);
    expect(schema.itemListElement[2].name).toBe("Company Registration");
  });
});

describe("createFaqSchema", () => {
  it("creates FAQPage schema with mainEntity", () => {
    const schema = createFaqSchema([
      { question: "What is a KRA PIN?", answer: "A tax identification number." },
    ]);
    expect(schema["@type"]).toBe("FAQPage");
    expect(schema.mainEntity).toHaveLength(1);
    expect(schema.mainEntity[0]["@type"]).toBe("Question");
  });
});

describe("createServiceSchema", () => {
  it("creates Service schema", () => {
    const schema = createServiceSchema({
      name: "Company Registration",
      slug: "company-registration",
      description: "Register your company in Kenya.",
    });
    expect(schema["@type"]).toBe("Service");
    expect(schema.areaServed).toMatchObject({ name: "Kenya" });
  });
});

describe("createArticleSchema", () => {
  it("creates Article schema with correct type", () => {
    const schema = createArticleSchema({
      title: "How to Register",
      description: "A guide",
      slug: "how-to-register",
      type: "blog",
      publishedAt: "2026-08-01",
    });
    expect(schema["@type"]).toBe("Article");
    expect(schema.url).toContain("/blog/");
  });
});

/* ── Service Catalog Tests ───────────────────── */

describe("SERVICE_CATALOG", () => {
  it("contains all expected services", () => {
    const slugs = getAllServiceSlugs();
    expect(slugs).toContain("company-registration");
    expect(slugs).toContain("business-name-registration");
    expect(slugs).toContain("kra-services");
    expect(slugs).toContain("tax-compliance");
    expect(slugs).toContain("nssf-services");
    expect(slugs).toContain("sha-services");
    expect(slugs).toContain("business-compliance");
  });

  it("each service has required SEO fields", () => {
    SERVICE_CATALOG.forEach((service) => {
      expect(service.slug).toBeTruthy();
      expect(service.seoTitle).toBeTruthy();
      expect(service.seoDescription).toBeTruthy();
      expect(service.introduction.length).toBeGreaterThan(50);
      expect(service.faqs.length).toBeGreaterThan(0);
      expect(service.process.length).toBeGreaterThan(0);
    });
  });

  it("getServiceBySlug returns correct service", () => {
    const svc = getServiceBySlug("kra-services");
    expect(svc?.name).toBe("KRA PIN Registration & Services");
  });

  it("returns undefined for unknown slug", () => {
    const svc = getServiceBySlug("non-existent-service");
    expect(svc).toBeUndefined();
  });
});
