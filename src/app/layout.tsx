import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Inter, Montserrat, Geist_Mono } from "next/font/google";
import { CSPNonceMeta } from "@/lib/csp/csp-nonce-meta";
import RootLayoutClient from "./layout-client";
import "./globals.css";

// Fonte Sans (Interface/Texto)
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Fonte Heading (Títulos/Marca)
const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});

// Fonte Mono (Código/IDs técnicos)
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Zattar Advogados",
    template: "%s | Zattar Advogados",
  },
  description: "Gestão Jurídica Inteligente",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Zattar",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Obter nonce do middleware para CSP
  const headersList = await headers();
  const nonce = headersList.get("x-nonce") || undefined;

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <CSPNonceMeta nonce={nonce} />
      </head>
      <body
        className={`${inter.variable} ${montserrat.variable} ${geistMono.variable} antialiased font-sans bg-background text-foreground`}
      >
        <RootLayoutClient nonce={nonce}>{children}</RootLayoutClient>
      </body>
    </html>
  );
}