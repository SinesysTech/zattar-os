import { Text } from "@/components/ui/typography";
import { SpecimenCard } from "./specimen-card";

const tiles = [
  {
    cls: "glass-kpi",
    title: "glass-kpi",
    token: ".glass-kpi · blur 12",
    desc: "KPIs, stats, tiles numéricos",
  },
  {
    cls: "glass-widget",
    title: "glass-widget",
    token: ".glass-widget · blur 16",
    desc: "Padrão para containers",
  },
  {
    cls: "glass-dialog",
    title: "glass-dialog",
    token: ".glass-dialog · blur 24",
    desc: "Modais, sheets, dialogs",
  },
];

export function GlassSection() {
  return (
    <SpecimenCard eyebrow="GLASS SYSTEM · VIDRO SOBRE PEDRA">
      <div
        className="relative overflow-hidden rounded-2xl p-6"
        style={{
          background: `
            radial-gradient(700px at 15% 10%, oklch(0.48 0.26 281 / 0.22), transparent 60%),
            radial-gradient(600px at 90% 90%, oklch(0.60 0.22 45 / 0.18), transparent 60%),
            linear-gradient(135deg, oklch(0.96 0.01 281), oklch(0.92 0.04 281))
          `,
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-30 mix-blend-multiply"
          style={{
            backgroundImage:
              "radial-gradient(oklch(0.48 0.26 281 / 0.3) 1px, transparent 1px)",
            backgroundSize: "14px 14px",
          }}
        />
        <div className="relative z-10 grid gap-3.5 sm:grid-cols-3">
          {tiles.map((t) => (
            <div
              key={t.cls}
              className={`flex flex-col gap-1.5 rounded-2xl p-4 ${t.cls}`}
            >
              <span className="font-heading text-[13px] font-bold text-foreground">
                {t.title}
              </span>
              <span className="font-mono text-[10px] text-muted-foreground">
                {t.token}
              </span>
              <span className="text-[11px] text-muted-foreground">{t.desc}</span>
            </div>
          ))}
        </div>
      </div>
      <Text variant="caption" className="mt-3">
        Todas as superfícies glass usam{" "}
        <span className="font-mono text-[10px]">
          inset 0 1px 0 rgba(255,255,255,.8)
        </span>{" "}
        para simular brilho de borda superior em light mode.
      </Text>
    </SpecimenCard>
  );
}
