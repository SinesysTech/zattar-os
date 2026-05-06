import { cn } from '@/lib/utils';
import { Text } from "@/components/ui/typography";
import { SpecimenCard } from "./specimen-card";

function PalettePrimary() {
  const swatches = [
    { bg: "oklch(0.98 0.01 281)", label: "primary/50", caption: "L .98", dark: true },
    { bg: "oklch(0.93 0.04 281)", label: "primary/200", caption: "L .93", dark: true },
    { bg: "oklch(0.80 0.12 281)", label: "primary/400", caption: "L .80", dark: true },
    { bg: "oklch(0.60 0.22 281)", label: "primary/600", caption: "L .60", dark: false },
    { bg: "oklch(0.48 0.26 281)", label: "primary", caption: "L .48 ◉", dark: false, anchor: true },
    { bg: "oklch(0.35 0.24 281)", label: "primary-dim", caption: "L .35", dark: false },
  ];

  return (
    <SpecimenCard
      eyebrow="PRIMARY · BRAND"
      title="Zattar Purple — hue 281°"
      aside="oklch(L C 281)"
    >
      <div className={cn(/* design-system-escape: gap-4 → migrar para <Inline gap="default"> */ "grid grid-cols-1 gap-4 md:grid-cols-[220px_1fr]")}>
        <div
          className={cn(/* design-system-escape: p-4 → migrar para <Inset variant="card-compact"> */ "flex aspect-[1.3/1] flex-col justify-between rounded-2xl p-4 text-white")}
          style={{ background: "var(--primary)" }}
        >
          <Text variant="meta-label" className="text-white/80">
            --primary
          </Text>
          <div className={cn(/* design-system-escape: space-y-1 sem token DS */ "space-y-1")}>
            <div className="text-kpi-value">#5523EB</div>
            <div className="font-mono text-[10px] opacity-80">oklch(.48 .26 281)</div>
          </div>
        </div>
        <div className={cn(/* design-system-escape: gap-2.5 gap sem token DS */ "grid grid-cols-3 gap-2.5 sm:grid-cols-6")}>
          {swatches.map((s) => (
            <div
              key={s.label}
              className={cn(/* design-system-escape: p-2.5 → usar <Inset> */ "flex aspect-[1.2/1] flex-col justify-between rounded-xl border p-2.5")}
              style={{
                background: s.bg,
                color: s.dark ? "oklch(0.15 0.01 281)" : "white",
                borderColor: s.anchor ? "var(--foreground)" : "var(--border)",
                borderWidth: s.anchor ? 2 : 1,
              }}
            >
              <span className={cn(/* design-system-escape: font-medium → className de <Text>/<Heading> */ "font-mono text-[10px] font-medium")}>{s.label}</span>
              <span className="font-mono text-[10px] opacity-75">{s.caption}</span>
            </div>
          ))}
        </div>
      </div>
      <div className={cn(/* design-system-escape: gap-3 gap sem token DS */ "mt-4 grid gap-3 sm:grid-cols-2")}>
        <div className={cn(/* design-system-escape: gap-2.5 gap sem token DS; px-3.5 padding direcional sem Inset equiv.; py-2.5 padding direcional sem Inset equiv. */ "flex items-center gap-2.5 rounded-xl border border-border bg-card px-3.5 py-2.5")}>
          <span
            className="size-6 rounded-md"
            style={{ background: "var(--highlight)" }}
          />
          <div className="flex flex-col">
            <span className="font-mono text-[11px]">--highlight</span>
            <span className="font-mono text-[10px] text-muted-foreground">
              #E67E40 · action orange
            </span>
          </div>
        </div>
        <div className={cn(/* design-system-escape: gap-2.5 gap sem token DS; px-3.5 padding direcional sem Inset equiv.; py-2.5 padding direcional sem Inset equiv. */ "flex items-center gap-2.5 rounded-xl border border-border bg-card px-3.5 py-2.5")}>
          <span className="size-6 rounded-full bg-primary" />
          <span className="font-mono text-[11px]">ring focus · transparent</span>
        </div>
      </div>
    </SpecimenCard>
  );
}

function PaletteNeutrals() {
  const tiles = [
    { l: "1.00", bg: "oklch(1 0 0)", dark: true },
    { l: "0.98", bg: "oklch(0.98 0.005 281)", dark: true },
    { l: "0.96", bg: "oklch(0.96 0.01 281)", dark: true },
    { l: "0.92", bg: "oklch(0.92 0.01 281)", dark: true },
    { l: "0.87", bg: "oklch(0.87 0.01 281)", dark: true },
    { l: "0.42", bg: "oklch(0.42 0.01 281)", dark: false },
    { l: "0.22", bg: "oklch(0.22 0.01 281)", dark: false },
    { l: "0.15", bg: "oklch(0.15 0.01 281)", dark: false },
  ];
  return (
    <SpecimenCard
      eyebrow="NEUTRALS"
      title="Micro-tinted hue 281°"
      aside="chroma 0.005–0.01"
    >
      <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "grid grid-cols-4 gap-2 sm:grid-cols-8")}>
        {tiles.map((t) => (
          <div
            key={t.l}
            className={cn(/* design-system-escape: p-2 → usar <Inset> */ "flex aspect-square items-end rounded-xl border p-2 font-mono text-[10px]")}
            style={{
              background: t.bg,
              color: t.dark ? "var(--foreground)" : "white",
              borderColor: t.dark ? "var(--border)" : "rgba(255,255,255,0.1)",
            }}
          >
            {t.l}
          </div>
        ))}
      </div>
      <div className={cn(/* design-system-escape: gap-2.5 gap sem token DS */ "mt-4 grid gap-2.5 sm:grid-cols-3")}>
        <div className={cn(/* design-system-escape: gap-1 gap sem token DS; px-4 padding direcional sem Inset equiv.; py-3 padding direcional sem Inset equiv. */ "flex flex-col gap-1 rounded-xl border border-border bg-card px-4 py-3")}>
          <span className="font-mono text-[10px] text-muted-foreground">--card</span>
          <span className={cn(/* design-system-escape: font-semibold → className de <Text>/<Heading> */ "text-[13px] font-semibold")}>Card surface</span>
        </div>
        <div className={cn(/* design-system-escape: gap-1 gap sem token DS; px-4 padding direcional sem Inset equiv.; py-3 padding direcional sem Inset equiv. */ "flex flex-col gap-1 rounded-xl border border-border bg-muted px-4 py-3")}>
          <span className="font-mono text-[10px] text-muted-foreground">--muted</span>
          <span className={cn(/* design-system-escape: font-semibold → className de <Text>/<Heading> */ "text-[13px] font-semibold")}>Muted</span>
        </div>
        <div className={cn(/* design-system-escape: gap-1 gap sem token DS; px-4 padding direcional sem Inset equiv.; py-3 padding direcional sem Inset equiv. */ "flex flex-col gap-1 rounded-xl border border-transparent bg-sidebar px-4 py-3 text-sidebar-foreground")}>
          <span className="font-mono text-[10px] opacity-70">--sidebar</span>
          <span className={cn(/* design-system-escape: font-semibold → className de <Text>/<Heading> */ "text-[13px] font-semibold")}>Sidebar (always dark)</span>
        </div>
      </div>
    </SpecimenCard>
  );
}

function PaletteStatus() {
  const tiles = [
    { title: "SUCCESS", hue: "145°", label: "Deferido", bg: "var(--success)" },
    { title: "WARNING", hue: "75°", label: "Pendente", bg: "var(--warning)" },
    { title: "INFO", hue: "250°", label: "Audiência", bg: "var(--info)" },
    { title: "DESTRUCTIVE", hue: "25°", label: "Prazo", bg: "var(--destructive)" },
  ];
  const chips = [
    { label: "ATIVO", bg: "oklch(0.55 0.18 145 / 0.12)", color: "oklch(0.35 0.16 145)" },
    { label: "SUSPENSO", bg: "oklch(0.60 0.18 75 / 0.14)", color: "oklch(0.40 0.17 75)" },
    { label: "ARQUIVADO", bg: "oklch(0.92 0.01 281)", color: "oklch(0.42 0.01 281)" },
    { label: "PRAZO VENCIDO", bg: "oklch(0.55 0.22 25 / 0.14)", color: "oklch(0.45 0.22 25)" },
    { label: "EM ANDAMENTO", bg: "oklch(0.48 0.26 281 / 0.12)", color: "var(--primary)" },
    { label: "AGENDADA", bg: "oklch(0.55 0.18 250 / 0.12)", color: "oklch(0.42 0.18 250)" },
  ];
  return (
    <SpecimenCard eyebrow="SEMANTIC · STATUS">
      <div className={cn(/* design-system-escape: gap-3 gap sem token DS */ "grid grid-cols-2 gap-3 lg:grid-cols-4")}>
        {tiles.map((t) => (
          <div
            key={t.title}
            className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight">; p-3.5 → usar <Inset> */ "flex min-h-[110px] flex-col justify-between gap-2 rounded-xl p-3.5 text-white")}
            style={{ background: t.bg }}
          >
            <div className="flex items-center justify-between font-mono text-[10px] opacity-85">
              <span>{t.title}</span>
              <span>{t.hue}</span>
            </div>
            <div className={cn(/* design-system-escape: font-bold → className de <Text>/<Heading> */ "font-heading text-body font-bold")}>{t.label}</div>
          </div>
        ))}
      </div>
      <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "mt-4 flex flex-col gap-2")}>
        <Text variant="meta-label">CHIPS EM USO</Text>
        <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "flex flex-wrap gap-2")}>
          {chips.map((c) => (
            <span
              key={c.label}
              className={cn(/* design-system-escape: px-2.5 padding direcional sem Inset equiv.; py-1 padding direcional sem Inset equiv.; font-semibold → className de <Text>/<Heading> */ "rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em]")}
              style={{ background: c.bg, color: c.color }}
            >
              {c.label}
            </span>
          ))}
        </div>
      </div>
    </SpecimenCard>
  );
}

function PaletteUser() {
  const labels = [
    { n: 1, name: "vermelho" },
    { n: 4, name: "amarelo" },
    { n: 7, name: "esmeralda" },
    { n: 10, name: "azul claro" },
    { n: 13, name: "violeta" },
    { n: 16, name: "pink" },
  ];
  return (
    <SpecimenCard eyebrow="USER PALETTE — 18 SLOTS" title="Espaçada cromaticamente">
      <Text variant="caption" className="mb-3">
        L ≈ 0.65, C ≈ 0.18. Usada em tags, labels, cores de evento, seletores.
      </Text>
      <div
        className={cn(/* design-system-escape: gap-1.5 gap sem token DS */ "grid gap-1.5")}
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(28px, 1fr))" }}
      >
        {Array.from({ length: 18 }, (_, i) => i + 1).map((n) => (
          <div
            key={n}
            className="aspect-square rounded-lg border border-black/[0.06]"
            style={{ background: `var(--palette-${n})` }}
          />
        ))}
      </div>
      <div className={cn(/* design-system-escape: gap-2 → migrar para <Inline gap="tight"> */ "mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6")}>
        {labels.map((l) => (
          <div
            key={l.n}
            className={cn(/* design-system-escape: gap-1.5 gap sem token DS */ "flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground")}
          >
            <span
              className="size-2.5 rounded-full"
              style={{ background: `var(--palette-${l.n})` }}
            />
            {l.n} {l.name}
          </div>
        ))}
      </div>
    </SpecimenCard>
  );
}

function PaletteEvent() {
  const events = [
    { code: "AU", label: "Audiência", token: "--event-audiencia", ref: "palette-10" },
    { code: "EX", label: "Expediente", token: "--event-expediente", ref: "palette-3" },
    { code: "PZ", label: "Prazo", token: "--event-prazo", ref: "palette-1" },
    { code: "OB", label: "Obrigação", token: "--event-obrigacao", ref: "palette-2" },
    { code: "PE", label: "Perícia", token: "--event-pericia", ref: "palette-13" },
    { code: "AG", label: "Agenda", token: "--event-agenda", ref: "palette-12" },
  ];
  return (
    <SpecimenCard eyebrow="EVENT COLORS · DOMÍNIO JURÍDICO">
      <div className={cn(/* design-system-escape: gap-2.5 gap sem token DS */ "grid gap-2.5 sm:grid-cols-2")}>
        {events.map((e) => (
          <div
            key={e.token}
            className={cn(/* design-system-escape: gap-3.5 gap sem token DS; px-3.5 padding direcional sem Inset equiv.; py-3 padding direcional sem Inset equiv. */ "grid grid-cols-[4px_44px_1fr_auto] items-center gap-3.5 rounded-xl border border-border bg-card px-3.5 py-3")}
          >
            <span
              className="h-9 w-1 rounded"
              style={{ background: `var(${e.token})` }}
            />
            <span
              className={cn(/* design-system-escape: font-bold → className de <Text>/<Heading> */ "flex size-9 items-center justify-center rounded-xl font-heading text-body-sm font-bold text-white")}
              style={{ background: `var(${e.token})` }}
            >
              {e.code}
            </span>
            <div className={cn(/* design-system-escape: gap-0.5 gap sem token DS */ "flex flex-col gap-0.5")}>
              <span className={cn(/* design-system-escape: font-semibold → className de <Text>/<Heading> */ "text-[13px] font-semibold text-foreground")}>{e.label}</span>
              <span className="font-mono text-[10px] text-muted-foreground">
                {e.token}
              </span>
            </div>
            <span className="font-mono text-[10px] text-muted-foreground">{e.ref}</span>
          </div>
        ))}
      </div>
    </SpecimenCard>
  );
}

export function ColorsSection() {
  return (
    <div className={cn(/* design-system-escape: space-y-4 → migrar para <Stack gap="default"> */ "space-y-4")}>
      <PalettePrimary />
      <PaletteNeutrals />
      <PaletteStatus />
      <PaletteUser />
      <PaletteEvent />
    </div>
  );
}
