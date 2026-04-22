import type { LucideIcon } from "lucide-react";

import { MarketingCard } from "../shared/marketing-card";
import { Heading } from "@/components/ui/typography";

interface LegalSectionProps {
  icon: LucideIcon;
  title: string;
  items: string[];
}

/**
 * Seção editorial de documento legal (Termos de Uso / Política de Privacidade).
 * Renderiza MarketingCard com ícone, título e lista com suporte a ênfase via
 * `**texto**` (transformado em <strong> por regex — conteúdo interno, seguro).
 */
export function LegalSection({ icon: Icon, title, items }: LegalSectionProps) {
  return (
    <MarketingCard variant="solid" padding="lg">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-11 h-11 rounded-xl bg-primary-dim/20 border border-primary/25 ring-1 ring-primary/20 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <Heading level="card" as="h2">
          {title}
        </Heading>
      </div>
      <ul className="space-y-3.5">
        {items.map((item) => (
          <li
            key={item}
            className="flex gap-3 text-foreground/80 text-caption leading-relaxed"
          >
            <span
              aria-hidden="true"
              className="w-1.5 h-1.5 rounded-full bg-primary/50 shrink-0 mt-2"
            />
            <span
              className="leading-relaxed"
              dangerouslySetInnerHTML={{
                __html: item.replace(
                  /\*\*(.*?)\*\*/g,
                  '<strong class="text-foreground font-semibold">$1</strong>',
                ),
              }}
            />
          </li>
        ))}
      </ul>
    </MarketingCard>
  );
}
