import type { Metadata, Viewport } from "next";
import { QueryProvider } from "@/components/providers/query-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    template: "%s | Ma Maison",
    default: "Ma Maison — Trouvez votre logement idéal au Niger",
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
    title: "Ma Maison — Trouvez votre logement idéal au Niger",
    description:
      "La plateforme immobilière de référence au Niger. Publiez et trouvez des annonces immobilières facilement.",
  },
  robots: {
    index: true,
    follow: true,
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
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[var(--background)] font-sans antialiased">
        <QueryProvider>
          <div className="flex min-h-screen flex-col">
            {children}
          </div>
        </QueryProvider>
      </body>
    </html>
  );
}
