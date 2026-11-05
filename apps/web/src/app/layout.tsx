import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import "./globals.css";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "../lib/seo";

// Inter expuesta como variable (--font-inter); la consumen los tokens de marca
// (--av-font-sans). No cambia la tipografía del dashboard.
const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Avantia | Tu academia online, con tu marca", template: "%s" },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: {
    type: "website",
    locale: "es_CL",
    siteName: SITE_NAME,
    title: "Avantia | Tu academia online, con tu marca",
    description: SITE_DESCRIPTION,
    images: [{ url: "/brand/avantia-logo-512.png", width: 512, height: 512, alt: "Avantia" }],
  },
  twitter: { card: "summary", title: "Avantia", description: SITE_DESCRIPTION },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
