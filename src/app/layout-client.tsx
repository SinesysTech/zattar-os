"use client";

import { useEffect } from "react";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { CommandMenu } from "@/components/layout/header/command-menu";
import { ActiveThemeProvider } from "@/components/layout/theme/active-theme";
import { PWAInstallPrompt } from "@/components/pwa/pwa-install-prompt";
import { setNonceCache } from "@/hooks/use-csp-nonce";
import { clearExpiredSecureStorage } from "@/lib/utils/clear-secure-storage";

export default function RootLayoutClient({
  children,
  nonce,
}: Readonly<{
  children: React.ReactNode;
  nonce?: string;
}>) {
  useEffect(() => {
    setNonceCache(nonce);
    clearExpiredSecureStorage();
  }, [nonce]);

  return (
    <>
      <style jsx global nonce={nonce}>{`
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
          <PWAInstallPrompt />
          {/* Toaster configurado com richColors para feedback visual (Sucesso=Verde, Erro=Vermelho) */}
          <Toaster position="top-right" richColors closeButton theme="system" className="font-sans" />
        </ActiveThemeProvider>
      </ThemeProvider>
    </>
  );
}
