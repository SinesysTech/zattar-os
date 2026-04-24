"use client";

import { Plus, Search, MoreHorizontal, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Heading, Text } from "@/components/ui/typography";
import { IconContainer } from "@/components/ui/icon-container";
import { SpecimenCard } from "./specimen-card";

function ButtonsSpecimen() {
  return (
    <SpecimenCard eyebrow="BUTTONS">
      <div className="space-y-3.5">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="min-w-[110px] font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
            variant
          </span>
          <Button>
            <Plus />
            Adicionar processo
          </Button>
          <Button variant="secondary">Filtrar</Button>
          <Button variant="outline">Cancelar</Button>
          <Button variant="ghost">Saiba mais</Button>
          <Button variant="destructive">Arquivar</Button>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="min-w-[110px] font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
            size
          </span>
          <Button size="sm">Pequeno</Button>
          <Button>Padrão</Button>
          <Button size="lg">Grande</Button>
          <Button variant="outline" size="icon">
            <Search />
          </Button>
          <Button variant="outline" size="icon">
            <MoreHorizontal />
          </Button>
        </div>
      </div>
    </SpecimenCard>
  );
}

function BadgesSpecimen() {
  return (
    <SpecimenCard eyebrow="BADGES · CHIPS">
      <div className="space-y-4">
        <div className="flex flex-col gap-2">
          <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-muted-foreground opacity-70">
            STATUS (PROCESSO)
          </span>
          <div className="flex flex-wrap gap-2">
            <Badge tone="soft" variant="default">EM ANDAMENTO</Badge>
            <Badge tone="soft" variant="success">ATIVO</Badge>
            <Badge tone="soft" variant="warning">SUSPENSO</Badge>
            <Badge tone="soft" variant="destructive">PRAZO VENCIDO</Badge>
            <Badge tone="soft" variant="neutral">ARQUIVADO</Badge>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-muted-foreground opacity-70">
            ENTITY (PARTE)
          </span>
          <div className="flex flex-wrap gap-2">
            <span
              className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-[11px] font-medium"
              style={{
                color: "var(--entity-cliente)",
                borderColor: "var(--entity-cliente)",
                background: "oklch(0.48 0.26 281 / 0.06)",
              }}
            >
              Cliente
            </span>
            <span
              className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-[11px] font-medium"
              style={{
                color: "var(--entity-parte-contraria)",
                borderColor: "var(--entity-parte-contraria)",
                background: "oklch(0.60 0.18 75 / 0.08)",
              }}
            >
              Parte contrária
            </span>
            <span
              className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-[11px] font-medium"
              style={{
                color: "var(--entity-terceiro)",
                borderColor: "var(--entity-terceiro)",
                background: "oklch(0.55 0.18 250 / 0.08)",
              }}
            >
              Terceiro
            </span>
            <span
              className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-[11px] font-medium"
              style={{
                color: "var(--entity-representante)",
                borderColor: "var(--entity-representante)",
                background: "oklch(0.55 0.18 145 / 0.08)",
              }}
            >
              Representante
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-muted-foreground opacity-70">
            TAG · COUNTER · SHORTCUT
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="soft" variant="neutral">Trabalhista</Badge>
            <Badge tone="soft" variant="neutral">Cível</Badge>
            <Badge tone="soft" variant="neutral">Família</Badge>
            <Badge>28</Badge>
            <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
              ⌘ K
            </kbd>
            <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
              ↵
            </kbd>
          </div>
        </div>
      </div>
    </SpecimenCard>
  );
}

function InputsSpecimen() {
  return (
    <SpecimenCard eyebrow="INPUTS · FORMS">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ds-processo">Nº do processo</Label>
          <Input
            id="ds-processo"
            defaultValue="0001234-56.2024.5.01.0001"
            className="font-mono"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ds-tribunal">Tribunal</Label>
          <Input
            id="ds-tribunal"
            defaultValue="TRT1 — Tribunal Regional do Trabalho 1ª Região"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ds-search">Buscar</Label>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="ds-search"
              placeholder="Buscar processos, partes, peças…"
              className="pl-8"
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ds-resp">Responsável</Label>
          <Input id="ds-resp" defaultValue="Dra. Ana Ribeiro" />
          <span className="text-[11px] text-muted-foreground">
            Advogado titular do caso.
          </span>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-5 pt-1">
        <div className="flex items-center gap-2.5">
          <Switch defaultChecked id="ds-notif" />
          <Label htmlFor="ds-notif" className="text-[12px] font-normal">
            Notificações
          </Label>
        </div>
        <div className="flex items-center gap-2.5">
          <Checkbox defaultChecked id="ds-audi" />
          <Label htmlFor="ds-audi" className="text-[12px] font-normal">
            Audiências
          </Label>
        </div>
        <div className="flex items-center gap-2.5">
          <Checkbox defaultChecked id="ds-prazo" />
          <Label htmlFor="ds-prazo" className="text-[12px] font-normal">
            Prazos
          </Label>
        </div>
        <div className="flex items-center gap-2.5">
          <Checkbox id="ds-exp" />
          <Label htmlFor="ds-exp" className="text-[12px] font-normal">
            Expedientes
          </Label>
        </div>
      </div>
    </SpecimenCard>
  );
}

function CardsSpecimen() {
  return (
    <SpecimenCard eyebrow="CARDS · PROCESSO + KPI">
      <div
        className="rounded-2xl border border-border p-4"
        style={{
          background: `
            radial-gradient(600px at 100% 0%, oklch(0.48 0.26 281 / 0.10), transparent 60%),
            linear-gradient(180deg, oklch(0.98 0.005 281), oklch(0.96 0.01 281))
          `,
        }}
      >
        <div className="grid gap-3.5 lg:grid-cols-[1.4fr_1fr]">
          {/* Process card */}
          <div className="flex flex-col gap-2.5 rounded-2xl border border-border bg-card p-4 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-start justify-between gap-2.5">
              <div className="flex flex-col gap-1">
                <Text variant="micro-caption" className="font-mono">
                  0001234-56.2024.5.01.0001
                </Text>
                <Heading level="widget">
                  Silva &amp; Cia Ltda vs. Banco Nacional S/A
                </Heading>
              </div>
              <Badge tone="soft" variant="default">ATIVO</Badge>
            </div>
            <div className="grid grid-cols-2 gap-x-3.5 gap-y-2">
              <div>
                <Text variant="meta-label">Tribunal</Text>
                <div className="text-[12px] font-medium">TRT1</div>
              </div>
              <div>
                <Text variant="meta-label">Responsável</Text>
                <div className="text-[12px] font-medium">Dra. Ana Ribeiro</div>
              </div>
              <div>
                <Text variant="meta-label">Próx. prazo</Text>
                <div className="text-[12px] font-medium">18/05/2026</div>
              </div>
              <div>
                <Text variant="meta-label">Valor</Text>
                <div className="font-mono text-[12px] font-medium">
                  R$ 248.500
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-dashed border-border pt-2">
              <div className="flex">
                <span className="flex size-5.5 items-center justify-center rounded-full border-2 border-card bg-primary text-[9px] font-semibold text-white">
                  AR
                </span>
                <span
                  className="-ml-1.5 flex size-5.5 items-center justify-center rounded-full border-2 border-card text-[9px] font-semibold text-white"
                  style={{ background: "oklch(0.60 0.22 45)" }}
                >
                  BN
                </span>
                <span
                  className="-ml-1.5 flex size-5.5 items-center justify-center rounded-full border-2 border-card text-[9px] font-semibold text-white"
                  style={{ background: "oklch(0.55 0.18 145)" }}
                >
                  LP
                </span>
              </div>
              <span className="font-mono text-[10px] text-muted-foreground">
                há 2 dias
              </span>
            </div>
          </div>

          {/* KPI cards */}
          <div className="flex flex-col justify-between gap-2.5">
            <div className="glass-kpi flex flex-col gap-1.5 rounded-2xl border border-border/30 p-4">
              <div className="flex items-center justify-between">
                <Text variant="meta-label">Processos ativos</Text>
                <IconContainer
                  size="xs"
                  className="bg-success/15 text-success"
                >
                  <ArrowUpRight className="size-3" />
                </IconContainer>
              </div>
              <Text variant="kpi-value">128</Text>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className="font-semibold text-success">+4</span>
                desde a última semana
              </div>
            </div>
            <div className="glass-kpi flex flex-col gap-1.5 rounded-2xl border border-border/30 p-4">
              <Text variant="meta-label">Prazos em 7 dias</Text>
              <Text
                variant="kpi-value"
                className="text-destructive"
              >
                7
              </Text>
              <Text variant="micro-caption">2 vencendo em 48h</Text>
            </div>
          </div>
        </div>
      </div>
    </SpecimenCard>
  );
}

export function ComponentsSection() {
  return (
    <div className="space-y-4">
      <ButtonsSpecimen />
      <BadgesSpecimen />
      <InputsSpecimen />
      <CardsSpecimen />
    </div>
  );
}
