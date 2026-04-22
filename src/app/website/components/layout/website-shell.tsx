import { ReactNode } from "react";
import { Header } from "./header";
import { Footer } from "./footer";
import { WebsiteScaleProvider } from "./website-scale-provider";
import { ChatwootWidget } from "./chatwoot-widget";

interface WebsiteShellProps {
  children: ReactNode;
  /**
   * Oculta o Closing Statement genérico do Footer ("Pronto para defender seus
   * direitos?"). Use em páginas que têm CTA próprio e dedicado no conteúdo
   * para evitar duplicação (ex.: /expertise, /solucoes).
   */
  hideClosingCta?: boolean;
}

export function WebsiteShell({ children, hideClosingCta }: WebsiteShellProps) {
  return (
    <div className="dark min-h-screen bg-surface text-on-surface font-body selection:bg-primary/30 selection:text-primary">
      <WebsiteScaleProvider />
      <Header />
      <main>{children}</main>
      <Footer hideClosingCta={hideClosingCta} />
      <ChatwootWidget />
    </div>
  );
}
