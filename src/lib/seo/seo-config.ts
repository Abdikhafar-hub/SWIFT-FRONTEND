/**
 * Swift Doc — Site-Wide SEO Configuration
 * Central source of truth for all SEO constants.
 */

export const SEO_CONFIG = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://swiftdoc.co.ke",
  siteName: "Swift Doc",
  siteDescription:
    "Official Kenyan document registration, statutory filings, KRA tax compliance, BRS company registrations, NSSF, SHA, and government documentation services.",
  locale: "en_KE",
  language: "en",
  defaultOgImage: "/og-default.png",
  twitterHandle: "@swiftdocke",

  organization: {
    name: "Swift Document & Compliance Masters Ltd",
    legalName: "Swift Document & Compliance Masters Ltd",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://swiftdoc.co.ke",
    email: "compliance@swiftdoc.co.ke",
    phone: "+254 729 732 142",
    address: {
      streetAddress: "Unga House, Muthithi Road",
      addressLocality: "Westlands, Nairobi",
      addressRegion: "Nairobi",
      postalCode: "00100",
      addressCountry: "KE",
    },
    postalAddress: "P.O. BOX 47239 - 00100, Nairobi, Kenya",
    operatingHours: "Mo-Fr 08:00-17:00",
  },

  /** Pages that should NOT be indexed */
  noIndexPaths: [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/client",
    "/admin",
    "/unauthorized",
  ],
} as const;
