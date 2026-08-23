import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Playfair_Display, Manrope } from "next/font/google";
import "@/styles/globals.css";
import { AppProviders } from "./providers";
import { GoogleAnalytics } from "@/components/seo/GoogleAnalytics";
import { JsonLd } from "@/components/seo/JsonLd";
import { createOrganizationSchema, createWebSiteSchema } from "@/lib/seo";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700", "800"],
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["600", "700", "800", "900"],
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
});

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://app.swiftdoc.co.ke";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Swift Doc | Kenyan Document & Statutory Compliance Specialists",
    template: "%s | Swift Doc",
  },
  description:
    "Official Kenyan document registration, eCitizen filings, KRA tax compliance, BRS company registrations, and government documentation services.",
  openGraph: {
    siteName: "Swift Doc",
    locale: "en_KE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${plusJakarta.variable} ${playfair.variable} ${manrope.variable}`}
    >
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-gold/30 selection:text-ink">
        <JsonLd data={[createOrganizationSchema(), createWebSiteSchema()]} />
        <GoogleAnalytics />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
