import { cn } from '@/lib/utils';
import { Text } from "@/components/ui/typography";
import { SpecimenCard } from "./specimen-card";

function SpacingScale() {
  const steps = [
    { t: "1", v: "4", h: 4 },
    { t: "2", v: "8", h: 8 },
    { t: "3", v: "12", h: 12 },
    { t: "4", v: "16", h: 16 },
    { t: "6", v: "24", h: 24 },
    { t: "8", v: "32", h: 32 },
    { t: "12", v: "48", h: 48 },
    { t: "16", v: "64", h: 64 },
  ];
  const usage = [
    { lbl: "page padding", val: "p-4 sm:p-6 lg:p-8" },
    { lbl: "card padding", val: "p-4 sm:p-6" },
    { lbl: "admin max-width", val: "1400px" },
    { lbl: "detail panel", val: "380px fixed" },
  ];
  return (
    <SpecimenCard eyebrow="SPACING · GRID 4PX">
      <div className={cn("flex items-end inline-default py-2")}>
        {steps.map((s) => (
          <div key={s.t} className={cn("flex flex-col items-center inline-tight")}>
            <div
              className="w-5 rounded bg-primary"
              style={{ height: s.h }}
            />
            <span className={cn( "font-mono text-[10px] font-medium")}>{s.t}</span>
            <span className="font-mono text-[10px] text-muted-foreground">
              {s.v}
            </span>
          </div>
        ))}
      </div>
      <div className={cn("mt-4 grid inline-medium sm:grid-cols-2")}>
        {usage.map((u) => (
          <div
            key={u.lbl}
            className={cn("flex flex-col inline-micro rounded-xl border border-border bg-card px-3.5 py-3")}
          >
            <span className="font-mono text-[10px] text-muted-foreground">
              {u.lbl}
            </span>
            <span className={cn( "text-[13px] font-semibold")}>{u.val}</span>
          </div>
        ))}
      </div>
    </SpecimenCard>
  );
}

function RadiusScale() {
  const tiles = [
    { lbl: "sm", v: "4px", cls: "rounded" },
    { lbl: "md", v: "6px", cls: "rounded-md" },
    { lbl: "lg (base)", v: "8px", cls: "rounded-lg" },
    { lbl: "xl", v: "12px", cls: "rounded-xl" },
    { lbl: "2xl", v: "16px", cls: "rounded-2xl" },
    { lbl: "full", v: "pill/dot", cls: "rounded-full" },
  ];
  return (
    <SpecimenCard eyebrow="RADIUS · HIERARQUIA">
      <div className={cn("grid grid-cols-3 inline-medium sm:grid-cols-6")}>
        {tiles.map((t) => (
          <div
            key={t.lbl}
            className={`flex aspect-square flex-col items-center justify-center gap-1.5 border border-border bg-card p-3 ${t.cls}`}
          >
            <div className={`h-9 w-12 bg-primary ${t.cls}`} />
            <span className="font-mono text-[10px] text-muted-foreground">
              {t.lbl}
            </span>
            <span className="font-mono text-[9px] text-muted-foreground">
              {t.v}
            </span>
          </div>
        ))}
      </div>
      <Text variant="caption" className="mt-4">
        2xl → GlassPanel · xl → cards/botões · lg → inputs · md → badges · full → pills/avatars
      </Text>
    </SpecimenCard>
  );
}

function ShadowScale() {
  const tiles = [
    { lbl: "none", v: "repouso plano", cls: "shadow-none" },
    { lbl: "sm", v: "separação sutil", cls: "shadow-sm" },
    { lbl: "shadow", v: "card repouso", cls: "shadow" },
    { lbl: "md", v: "hover", cls: "shadow-md" },
    { lbl: "lg", v: "overlay", cls: "shadow-lg" },
  ];
  return (
    <SpecimenCard eyebrow="SHADOW · ELEVAÇÃO">
      <div className={cn("grid grid-cols-2 inline-default pb-6 sm:grid-cols-5")}>
        {tiles.map((t) => (
          <div
            key={t.lbl}
            className={`flex aspect-[1.1/1] flex-col justify-between rounded-xl border border-border/50 bg-white p-3.5 ${t.cls}`}
          >
            <span className={cn( "font-mono text-[10px] font-medium text-muted-foreground")}>
              {t.lbl}
            </span>
            <span className="font-mono text-[9px] text-muted-foreground/70">
              {t.v}
            </span>
          </div>
        ))}
      </div>
      <div className={cn(/* design-system-escape: px-3 padding direcional sem Inset equiv.; py-2.5 padding direcional sem Inset equiv. */ "flex items-center inline-tight-plus rounded-xl border border-destructive/30 bg-destructive/[0.08] px-3 py-2.5 text-[12px] text-destructive")}>
        <span className={cn("rounded bg-destructive/[0.12] px-1.5 py-0.5 font-mono text-[10px]")}>
          proibido
        </span>
        <span>{`shadow-${"xl"} · shadow-${"2xl"} — sempre usar lg como teto`}</span>
      </div>
    </SpecimenCard>
  );
}

export function SpacingSection() {
  return (
    <div className={cn("stack-default")}>
      <SpacingScale />
      <RadiusScale />
      <ShadowScale />
    </div>
  );
}
