import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import StoreNav from "@/src/frontend/components/StoreNav";
import Footer from "@/src/frontend/components/Footer/Footer";
import MobileBottomNav from "@/src/frontend/components/MobileBottomNav";
import { JsonLd } from "@/src/frontend/components/Seo/JsonLd";
import { absoluteUrl, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/src/frontend/lib/seo";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "WIN-DIA FibreRich Thins | Low-GI Coconut Flour Snacks",
    template: "%s | WIN-DIA Foods",
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "WIN-DIA",
    "FibreRich Thins",
    "coconut flour snacks",
    "low GI snacks",
    "high fibre snacks",
    "healthy thins",
    "no maida snacks",
  ],
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_IN",
    url: SITE_URL,
    title: "WIN-DIA FibreRich Thins | Low-GI Coconut Flour Snacks",
    description: SITE_DESCRIPTION,
    images: [{ url: absoluteUrl("/images/hero/hero-poster.jpeg") }],
  },
  twitter: {
    card: "summary_large_image",
    title: "WIN-DIA FibreRich Thins | Low-GI Coconut Flour Snacks",
    description: SITE_DESCRIPTION,
    images: [absoluteUrl("/images/hero/hero-poster.jpeg")],
  },
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  legalName: "Kalpavristi Coco Foods",
  url: SITE_URL,
  logo: absoluteUrl("/images/windia-logo.png"),
  description:
    "WIN-DIA Foods makes FibreRich Thins, low-GI, high-fibre coconut flour snacks from Mysuru, Karnataka.",
  email: "kcfpl2022@gmail.com",
  telephone: "+91-96861-53413",
  address: {
    "@type": "PostalAddress",
    streetAddress: "#1058/C, Basavanahalli Main Road, Belvadi Village, Ilavala Hobli",
    addressLocality: "Mysuru",
    addressRegion: "Karnataka",
    postalCode: "570032",
    addressCountry: "IN",
  },
  sameAs: [
    "https://www.instagram.com/win_dia_foods/",
    "https://www.linkedin.com/in/g-tejaswini-281a7b340/",
  ],
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  inLanguage: "en-IN",
  publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=DM+Sans:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <JsonLd data={[organizationSchema, websiteSchema]} />
        <Providers>
          <StoreNav />
          {children}
          <Footer />
          <MobileBottomNav />
        </Providers>
      </body>
    </html>
  );
}