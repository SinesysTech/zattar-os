import type { Metadata, Viewport } from "next";
import { Inter, Montserrat } from "next/font/google"; // 1. Trocamos Geist por Inter e Montserrat
import "./globals.css";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { Toaster } from "sonner";
import { PWAInstallPrompt } from '@/components/pwa-install-prompt';

// 2. Configuração da Inter (Corpo de texto)
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: 'swap',
});

// 3. Configuração da Montserrat (Títulos e Marca)
const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Zattar Advogados",
  description: "Gestão Jurídica Inteligente",
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Zattar Advogados'
  },
  applicationName: 'Zattar Advogados',
  icons: {
    apple: '/apple-touch-icon.png',
    icon: [
      { url: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' }
    ]
  },
  keywords: ['gestão jurídica', 'processos', 'advogados', 'zattar', 'legal tech']
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: [
    // 4. Ajuste das cores da barra de status para bater com o novo tema
    { media: '(prefers-color-scheme: light)', color: '#F4F4F8' }, // Cor do Background Light (Off-white)
    { media: '(prefers-color-scheme: dark)', color: '#282828' }   // Cor do Background Dark (Charcoal)
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className="overflow-x-hidden">
      {/* 5. Injeção das variáveis das fontes no Body */}
      <body className={`${inter.variable} ${montserrat.variable} antialiased overflow-x-hidden bg-background text-foreground`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster position="top-right" richColors />
          <PWAInstallPrompt />
        </ThemeProvider>
      </body>
    </html>
  );
}