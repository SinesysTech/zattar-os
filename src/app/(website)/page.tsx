"use client";

import Header from "./components/header";
import Hero from "./components/hero";
import DireitosEssenciais from "./components/direitos-essenciais";
import EtapasProcessuais from "./components/etapas-processuais";
import QuemSomos from "./components/quem-somos";
import ConsultoriaEmpresarial from "./components/consultoria-empresarial";
import Footer from "./components/ui/footer";

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
    </main>
  );
}
