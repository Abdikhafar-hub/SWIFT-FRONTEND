/**
 * Swift Doc Platform Configurations
 */

export const APP_CONFIG = {
  name: "Swift Doc",
  legalName: "Swift Document & Compliance Masters Ltd",
  description: "Kenyan statutory documentation, government registrations, and compliance specialists.",
  address: "Unga House, Muthithi Road, Westlands, Nairobi",
  postalAddress: "P.O. BOX 47239 - 00100, Nairobi, Kenya",
  supportEmail: "compliance@swiftdoc.co.ke",
  supportPhone: "+254 729 732 142",
  defaultCurrency: "KES",
  publicSiteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://swiftdoc.co.ke",
  appUrl: process.env.NEXT_PUBLIC_APP_URL || "https://app.swiftdoc.co.ke",
  apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || "https://app.swiftdoc.co.ke/api/v1",
  tokenStorageKey: "swift_doc_access_token",
  refreshTokenStorageKey: "swift_doc_refresh_token",
  userStorageKey: "swift_doc_user",
  clientStorageKey: "swift_doc_client",
};
