"use client";

import { cn } from '@/lib/utils';
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  PenLine,
  LayoutGrid,
  List,
  Plus,
} from "lucide-react";
import Link from "next/link";
import {
  InsightBanner,
  AnimatedNumber,
} from "@/app/(authenticated)/dashboard/widgets/primitives";
import { TabPills } from "@/components/dashboard/tab-pills";
import { SearchInput } from "@/components/dashboard/search-input";
import {
  ViewToggle,
  type ViewToggleOption,
} from "@/components/dashboard/view-toggle";
import {
  PulseKpiCard,
  PulseKpiBar,
  PulseKpiGrid,
} from "@/components/shared/pulse-kpi-card";
import { Button } from "@/components/ui/button";
import type { DocumentosStats } from '@/shared/assinatura-digital/services/documentos.service';
import type { DocumentoListItem } from '@/shared/assinatura-digital/adapters/documento-card-adapter';
import { useDocumentosPage } from '@/shared/assinatura-digital/hooks/use-documentos-page';
import { useDocumentosStats } from '@/shared/assinatura-digital/hooks/use-documentos-stats';
import { DocumentDetail } from '@/app/(authenticated)/assinatura-digital/components/documento-detail';
import { AssinaturaDigitalPageNav } from "../../components/page-nav";
import { DocumentosGlassList } from "../../components/documentos-glass-list";

// ─── View Options ──────────────────────────────────────────────────────

const VIEW_OPTIONS: ViewToggleOption[] = [
  { id: "cards", icon: LayoutGrid, label: "Cartões" },
  { id: "lista", icon: List, label: "Lista" },
];

// ─── Props ─────────────────────────────────────────────────────────────

interface DocumentosCommandCenterProps {
  initialData: DocumentoListItem[];
  initialStats?: DocumentosStats;
}

// ─── Component ─────────────────────────────────────────────────────────

export function DocumentosCommandCenter({
  initialData,
  initialStats,
}: DocumentosCommandCenterProps) {
  const { stats } = useDocumentosStats(initialStats);
  const {
    docs,
    search,
    setSearch,
    activeStatus,
    setActiveStatus,
    viewMode,
    setViewMode,
    selectedDoc,
    handleSelect,
    pendingSigners,
  } = useDocumentosPage({ initialData });

  return (
    <div className={cn("flex flex-col stack-default-plus")}>
      {/* ── Header (título do módulo + abas + ação) ─────── */}
      <AssinaturaDigitalPageNav
        action={
          <Button asChild size="sm" className="rounded-xl">
            <Link href="/app/assinatura-digital/documentos/novo">
              <Plus className="size-3.5" />
              Novo documento
            </Link>
          </Button>
        }
      />

      {/* ── KPI Strip ─────────────────────────────────────────────────── */}
      {stats && (
        <PulseKpiGrid className="lg:grid-cols-5">
          <PulseKpiCard
            label="Total"
            icon={FileText}
            iconColor="text-primary/60"
            iconBg="bg-primary/8"
            footer={<PulseKpiBar pct={100} color="bg-primary/25" />}
          >
            <AnimatedNumber value={stats.total} />
          </PulseKpiCard>
          <PulseKpiCard
            label="Rascunhos"
            icon={PenLine}
            iconColor="text-muted-foreground/50"
            iconBg="bg-muted/20"
            footer={
              <PulseKpiBar
                pct={stats.total > 0 ? Math.round((stats.rascunhos / stats.total) * 100) : 0}
                color="bg-muted/30"
              />
            }
          >
            <AnimatedNumber value={stats.rascunhos} />
          </PulseKpiCard>
          <PulseKpiCard
            label="Aguardando"
            icon={Clock}
            iconColor="text-warning/60"
            iconBg="bg-warning/8"
            footer={
              <PulseKpiBar
                pct={stats.total > 0 ? Math.round((stats.aguardando / stats.total) * 100) : 0}
                color="bg-warning/25"
              />
            }
          >
            <AnimatedNumber value={stats.aguardando} />
          </PulseKpiCard>
          <PulseKpiCard
            label="Concluídos"
            icon={CheckCircle2}
            iconColor="text-success/60"
            iconBg="bg-success/8"
            footer={
              <PulseKpiBar
                pct={stats.total > 0 ? Math.round((stats.concluidos / stats.total) * 100) : 0}
                color="bg-success/25"
              />
            }
          >
            <AnimatedNumber value={stats.concluidos} />
          </PulseKpiCard>
          <PulseKpiCard
            label="Cancelados"
            icon={XCircle}
            iconColor="text-destructive/60"
            iconBg="bg-destructive/8"
            highlight={stats.cancelados > 0}
            highlightBorderColor="border-destructive/15"
            iconHighlightBorder={stats.cancelados > 0 ? "border border-destructive/20" : undefined}
            footer={
              <PulseKpiBar
                pct={stats.total > 0 ? Math.round((stats.cancelados / stats.total) * 100) : 0}
                color="bg-destructive/25"
              />
            }
          >
            <AnimatedNumber
              value={stats.cancelados}
              className={stats.cancelados > 0 ? "text-destructive" : ""}
            />
          </PulseKpiCard>
        </PulseKpiGrid>
      )}

      {/* ── Insight ─────────────────────────────────────── */}
      {pendingSigners.length > 0 && (
        <InsightBanner type="warning">
          {pendingSigners.length} assinante
          {pendingSigners.length > 1 ? "s" : ""} sem assinar há 7+ dias —
          considere reenviar os convites
        </InsightBanner>
      )}

      {/* ── Controls ────────────────────────────────────── */}
      <div className={cn("flex flex-col sm:flex-row items-start sm:items-center inline-medium")}>
        <TabPills
          tabs={[
            { id: "todos", label: "Todos", count: stats?.total ?? 0 },
            { id: "rascunho", label: "Rascunhos", count: stats?.rascunhos ?? 0 },
            { id: "pronto", label: "Aguardando", count: stats?.aguardando ?? 0 },
            { id: "concluido", label: "Concluídos", count: stats?.concluidos ?? 0 },
            { id: "cancelado", label: "Cancelados", count: stats?.cancelados ?? 0 },
          ]}
          active={activeStatus}
          onChange={setActiveStatus}
        />
        <div className={cn("flex items-center inline-tight flex-1 justify-end")}>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar documento, assinante..."
          />
          <ViewToggle
            mode={viewMode}
            onChange={setViewMode}
            options={VIEW_OPTIONS}
          />
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────── */}
      <div
        className={`grid gap-4 ${selectedDoc ? "lg:grid-cols-[1fr_380px]" : ""}`}
      >
        <DocumentosGlassList
          documentos={docs}
          mode={viewMode === "cards" ? "cards" : "list"}
          selectedId={selectedDoc?.id}
          onSelect={handleSelect}
        />

        {selectedDoc && (
          <div className="hidden lg:block sticky top-4 self-start">
            <DocumentDetail
              doc={selectedDoc}
              onClose={() => handleSelect(selectedDoc)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
