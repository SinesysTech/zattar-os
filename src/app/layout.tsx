import type { Metadata } from "next";
import { Inter, Montserrat, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { Toaster } from "@/components/ui/sonner"; // Ajuste o import conforme sua estrutura
import { CommandMenu } from "@/components/layout/header/command-menu";
import { ActiveThemeProvider } from "@/components/layout/theme/active-theme";

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
  title: "Zattar Advogados",
  description: "Gestão Jurídica Inteligente",
  // ... resto do seu metadata
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${montserrat.variable} ${geistMono.variable} antialiased font-sans bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ActiveThemeProvider>
            <CommandMenu />
            {children}
            {/* Toaster configurado com richColors para feedback visual (Sucesso=Verde, Erro=Vermelho) */}
            <Toaster position="top-right" richColors closeButton theme="system" className="font-sans" />
          </ActiveThemeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}