import type { Metadata, Viewport } from "next";
import RootLayoutClient from "./layout-client";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <RootLayoutClient>{children}</RootLayoutClient>;
}