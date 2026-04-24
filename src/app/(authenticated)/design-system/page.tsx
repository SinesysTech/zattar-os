import type { Metadata } from "next";
import { PageShell } from "@/components/shared/page-shell";
import { Heading, Text } from "@/components/ui/typography";
import { BrandSection } from "./_components/brand-section";
import { ColorsSection } from "./_components/colors-section";
import { TypeSection } from "./_components/type-section";
import { SpacingSection } from "./_components/spacing-section";
import { GlassSection } from "./_components/glass-section";
import { ComponentsSection } from "./_components/components-section";

export const metadata: Metadata = {
  title: "Design System — Glass Briefing",
  description:
    "Fontes canônicas do sistema visual do ZattarOS: tokens, tipografia, glass, componentes.",
};

const SECTIONS = [
  { id: "brand", label: "Brand", component: BrandSection },
  { id: "colors", label: "Cores", component: ColorsSection },
  { id: "type", label: "Tipografia", component: TypeSection },
  { id: "spacing", label: "Espaço · Raio · Sombra", component: SpacingSection },
  { id: "glass", label: "Glass", component: GlassSection },
  { id: "components", label: "Componentes", component: ComponentsSection },
] as const;

export default function DesignSystemPage() {
  return (
    <PageShell>
      <header className="space-y-2">
        <Text variant="meta-label">DESIGN SYSTEM · GLASS BRIEFING</Text>
        <Heading level="page">Fundação visual do ZattarOS</Heading>
        <Text variant="caption" className="max-w-3xl">
          Hue 281° (Zattar Purple) ancora o sistema tonal inteiro. Glassmorphism
          sutil sobre fundação sólida. Montserrat para títulos, Inter para
          conteúdo. Toda a linguagem de negócio em PT-BR.
        </Text>
      </header>

      <nav
        aria-label="Navegação do design system"
        className="sticky top-0 z-20 -mx-1 overflow-x-auto rounded-xl border border-border/20 bg-background/80 px-1 py-2 backdrop-blur"
      >
        <ul className="flex gap-1.5">
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                className="inline-flex items-center whitespace-nowrap rounded-lg px-3 py-1.5 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {SECTIONS.map(({ id, label, component: Section }) => (
        <section
          key={id}
          id={id}
          aria-labelledby={`${id}-title`}
          className="scroll-mt-20 space-y-4 pt-4"
        >
          <Heading
            level="section"
            as="h2"
            id={`${id}-title`}
            className="sr-only"
          >
            {label}
          </Heading>
          <Section />
        </section>
      ))}
    </PageShell>
  );
}
