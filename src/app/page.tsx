"use client";

import Header from "@/components/website/header";
import Hero from "@/components/website/hero";
import DireitosEssenciais from "@/components/website/direitos-essenciais";
import EtapasProcessuais from "@/components/website/etapas-processuais";
import QuemSomos from "@/components/website/quem-somos";
import ConsultoriaEmpresarial from "@/components/website/consultoria-empresarial";
import Footer from "@/components/website/ui/footer";
import ChatwootWidget from "@/components/website/chatwoot-widget";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Header />
      <Hero />
      <DireitosEssenciais />
      <EtapasProcessuais />
      <QuemSomos />
      <ConsultoriaEmpresarial />
      <Footer />
      <ChatwootWidget />
    </main>
  );
}
