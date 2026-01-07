import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Meu Processo - Zattar Advogados",
  description: "Acompanhe seus processos de forma simples e segura",
};

export default function PortalLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
