import type { Metadata } from "next";
import RootLayoutClient from "./layout-client";

export const metadata: Metadata = {
  title: "Zattar Advogados",
  description: "Gestão Jurídica Inteligente",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <RootLayoutClient>{children}</RootLayoutClient>;
}
