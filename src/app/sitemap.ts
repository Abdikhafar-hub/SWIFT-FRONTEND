import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://app.swiftdoc.co.ke";
  const now = new Date().toISOString();

  return [
    { url: siteUrl, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${siteUrl}/login`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${siteUrl}/register`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${siteUrl}/forgot-password`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ];
}
