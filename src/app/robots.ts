import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://app.swiftdoc.co.ke";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/login", "/register", "/forgot-password", "/reset-password"],
        disallow: ["/admin", "/admin/", "/client", "/client/", "/unauthorized"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
