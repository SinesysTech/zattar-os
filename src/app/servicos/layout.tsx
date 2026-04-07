import type { Metadata } from "next";
import { WebsiteShell } from "@/app/website";

export const metadata: Metadata = {
  title: "Serviços Trabalhistas | Zattar Advogados",
  description:
    "Calculadoras, geradores de documentos e diagnósticos trabalhistas gratuitos, atualizados com a legislação 2026.",
};

export default function ServicosPublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WebsiteShell>
      {/* pt-32 compensa a navbar flutuante do WebsiteShell (fixed top-4) */}
      <div className="pt-32 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {children}
      </div>
    </WebsiteShell>
  );
}
