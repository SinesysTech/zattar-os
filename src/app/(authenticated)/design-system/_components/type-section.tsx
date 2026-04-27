import { cn } from '@/lib/utils';
import { Heading, Text } from "@/components/ui/typography";
import { SpecimenCard } from "./specimen-card";

interface TypeRowProps {
  token: string;
  size: string;
  children: React.ReactNode;
}

function TypeRow({ token, size, children }: TypeRowProps) {
  return (
    <div className={cn(/* design-system-escape: gap-4 → migrar para <Inline gap="default">; py-2 padding direcional sem Inset equiv. */ "grid grid-cols-[100px_1fr_90px] items-baseline gap-4 border-b border-dashed border-border py-2 last:border-b-0 sm:grid-cols-[120px_1fr_80px]")}>
      <span className="font-mono text-[10px] text-muted-foreground">{token}</span>
      <div className="min-w-0 truncate">{children}</div>
      <span className="text-right font-mono text-[10px] text-muted-foreground">
        {size}
      </span>
    </div>
  );
}

function TypeHeadings() {
  return (
    <SpecimenCard
      eyebrow="HEADINGS"
      title="Montserrat · -0.02em"
      aside="var(--font-heading)"
    >
      <div>
        <TypeRow token="page-title" size="24/1.2 · 700">
          <Heading level="page">Processos</Heading>
        </TypeRow>
        <TypeRow token="section-title" size="20/1.25 · 600">
          <Heading level="section">Meus processos ativos</Heading>
        </TypeRow>
        <TypeRow token="card-title" size="18/1.3 · 600">
          <Heading level="card">0001234-56.2024.5.01.0001</Heading>
        </TypeRow>
        <TypeRow token="subsection" size="16/1.35 · 600">
          <Heading level="subsection">Partes envolvidas</Heading>
        </TypeRow>
        <TypeRow token="widget-title" size="14/1.4 · 600">
          <Heading level="widget">Últimas audiências</Heading>
        </TypeRow>
      </div>
    </SpecimenCard>
  );
}

function TypeBody() {
  return (
    <SpecimenCard
      eyebrow="BODY · KPI"
      title="Inter · +tabular-nums p/ KPI"
      aside="var(--font-sans)"
    >
      <div>
        <TypeRow token="body-lg" size="20/1.6">
          <span className="text-body-lg">
            A autora requer a reintegração ao cargo e o pagamento de verbas rescisórias.
          </span>
        </TypeRow>
        <TypeRow token="body" size="18/1.55">
          <span className="text-body">
            Processo distribuído em 03/04/2024 · TRT1 — 1ª Vara do Trabalho.
          </span>
        </TypeRow>
        <TypeRow token="body-sm" size="16/1.5">
          <span className="text-body-sm">
            Última movimentação há 2 dias. Audiência em 18/05.
          </span>
        </TypeRow>
        <TypeRow token="caption" size="13/1.4">
          <Text variant="caption">Atualizado em 12 abr 2026 · 14:32</Text>
        </TypeRow>
      </div>
      <div className={cn(/* design-system-escape: gap-4 → migrar para <Inline gap="default">; px-3.5 padding direcional sem Inset equiv.; py-3 padding direcional sem Inset equiv. */ "mt-4 flex items-baseline gap-4 rounded-xl border border-border bg-card px-3.5 py-3")}>
        <Text variant="kpi-value">R$ 1.245.830</Text>
        <Text variant="widget-sub">valor total em disputa · 28 processos</Text>
      </div>
    </SpecimenCard>
  );
}

function TypeMeta() {
  const metas = [
    { label: "Tribunal", value: "TRT1" },
    { label: "Responsável", value: "Dra. Ana Ribeiro" },
    { label: "Comarca", value: "Rio de Janeiro" },
    { label: "Distribuição", value: "03/04/2024", mono: true },
  ];
  return (
    <SpecimenCard eyebrow="LABELS · META · MONO">
      <div>
        <TypeRow token="label" size="14/1 · 500">
          <Text variant="label">Nome da parte</Text>
        </TypeRow>
        <TypeRow token="overline" size="11 · .08em">
          <Text variant="overline">Em andamento</Text>
        </TypeRow>
        <TypeRow token="meta-label" size="11 · .14em">
          <Text variant="meta-label">
            Tribunal · Responsável · Localidade
          </Text>
        </TypeRow>
        <TypeRow token="mono-num" size="10 · Geist">
          <span className="text-mono-num">0001234-56.2024.5.01.0001</span>
        </TypeRow>
      </div>
      <div className={cn(/* design-system-escape: gap-3 gap sem token DS; p-3.5 → usar <Inset> */ "mt-4 grid grid-cols-2 gap-3 rounded-xl border border-border bg-card p-3.5 sm:grid-cols-4")}>
        {metas.map((m) => (
          <div key={m.label} className={cn(/* design-system-escape: gap-1 gap sem token DS */ "flex flex-col gap-1")}>
            <Text variant="meta-label">{m.label}</Text>
            <span
              className={`text-[13px] font-semibold ${
                m.mono ? "font-mono" : ""
              }`}
            >
              {m.value}
            </span>
          </div>
        ))}
      </div>
    </SpecimenCard>
  );
}

export function TypeSection() {
  return (
    <div className={cn(/* design-system-escape: space-y-4 → migrar para <Stack gap="default"> */ "space-y-4")}>
      <TypeHeadings />
      <TypeBody />
      <TypeMeta />
    </div>
  );
}
