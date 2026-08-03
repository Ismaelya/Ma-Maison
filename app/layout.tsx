import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { QueryProvider } from "@/components/providers/query-provider";
import { ToastProvider } from "@/components/ui/toast-notification";
import { ThemeProvider } from "@/components/providers/theme-provider";
import InstallPrompt from "@/components/ui/InstallPrompt";
import "./globals.css";

const geist = {
  variable: "--font-geist",
  className: "font-sans",
};

export const metadata: Metadata = {
  title: {
    template: "%s | Ma Maison",
    default: "Ma Maison",
  },
  description:
    "Ma Maison est la plateforme immobilière de référence au Niger. Trouvez des appartements, maisons, studios et terrains à louer ou à acheter à Niamey et dans tout le Niger.",
  keywords: [
    "immobilier Niger",
    "location Niamey",
    "maison à louer Niger",
    "appartement Niamey",
    "achat terrain Niger",
    "Ma Maison",
    "annonces immobilières Niger",
  ],
  authors: [{ name: "Ma Maison" }],
  openGraph: {
    type: "website",
    locale: "fr_NE",
    siteName: "Ma Maison",
    title: "Ma Maison",
    description:
      "La plateforme immobilière de référence au Niger. Publiez et trouvez des annonces immobilières facilement.",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: "/logo.png" },
      { url: "/favicon.png", type: "image/png" },
    ],
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2563eb",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={geist.variable} suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
        <meta name="theme-color" content="#2563eb" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Ma Maison" />
        {/* Outfit font — modern wordmark */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@700;800&display=swap" rel="stylesheet" />
      </head>
      <body className={`${geist.className} min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] transition-colors duration-200 antialiased`}>
        <ThemeProvider defaultTheme="light">
          <QueryProvider>
            <ToastProvider>
              <div className="flex min-h-screen flex-col">
                {children}
              </div>
            </ToastProvider>
          </QueryProvider>
        </ThemeProvider>
        <InstallPrompt />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
