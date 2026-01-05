import type { Metadata } from "next";
import { Inter, Montserrat, Geist_Mono } from "next/font/google";
import "../globals.css";
import ChatwootWidget from "./components/chatwoot-widget";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Zattar Advogados",
  description:
    "Escritório de advocacia especializado em Direito do Trabalho, oferecendo assessoria jurídica completa para empresas e trabalhadores. Atuamos em ações trabalhistas, rescisões, assédio moral, horas extras e demais questões trabalhistas. Soluções jurídicas personalizadas com excelência e comprometimento.",
  keywords:
    "advogados, escritório advocacia, direito empresarial, direito trabalhista, assessoria jurídica, consultoria jurídica",
  authors: [{ name: "Zattar Advogados" }, { name: "Sinesys", url: "https://sinesys.com.br" }],
  creator: "Sinesys",
  publisher: "Zattar Advogados",
  generator: "Sinesys",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="text-sm antialiased">
      <body
        className={`${inter.variable} ${montserrat.variable} ${geistMono.variable} font-sans bg-background text-foreground antialiased`}
      >
        {children}
        <ChatwootWidget />
      </body>
    </html>
  );
}
