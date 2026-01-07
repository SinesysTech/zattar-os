"use client";

import { Inter, Montserrat, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { Toaster } from "@/components/ui/sonner";
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

export default function RootLayoutClient({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${montserrat.variable} ${geistMono.variable} antialiased font-sans bg-background text-foreground`}
      >
        <style jsx global>{`
          @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap');
        `}</style>
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
